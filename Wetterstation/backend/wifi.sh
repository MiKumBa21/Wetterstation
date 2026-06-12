#!/usr/bin/env bash
set -euo pipefail

# Dieses Skript stellt die WLAN-Funktionen für das Backend bereit.
# Es wird von der API aufgerufen und unterstützt drei Hauptbefehle:
#   scan    - sucht nach verfügbaren Netzwerken
#   connect - verbindet mit einem angegebenen Netzwerk
#   status  - gibt den aktuellen Verbindungsstatus zurück

COMMAND=${1:-}
DEFAULT_IFACE=wlan0

function error() {
  echo "$1" >&2
  exit 1
}

function nmcli_connect_wpa_psk() {
  local ssid="$1"
  local password="$2"
  local con_name="wifi-${ssid//[^A-Za-z0-9_-]/-}"
  con_name=${con_name:0:32}

  # Bestehende Verbindung mit gleichem Namen entfernen, um Konflikte zu vermeiden.
  if nmcli connection show "$con_name" >/dev/null 2>&1; then
    nmcli connection delete "$con_name" >/dev/null 2>&1 || true
  fi

  nmcli connection add type wifi ifname "$IFACE" con-name "$con_name" ssid "$ssid" wifi-sec.key-mgmt wpa-psk wifi-sec.psk "$password"
  nmcli connection up "$con_name"
}

if [[ "$COMMAND" == "scan" ]]; then
  # WLAN-Scan durchführen und alle gefundenen Netzwerke als JSON ausgeben.
  if command -v nmcli >/dev/null 2>&1; then
    nmcli dev wifi rescan >/dev/null 2>&1 || true
    nmcli -t -f SSID,SECURITY,SIGNAL device wifi list | awk -F ':' 'NF>=3 {
      ssid = $1
      security = $2
      signal = $3
      gsub(/"/, "\\\"", ssid)
      if (ssid == "") ssid = "<unsichtbar>"
      printf("{\"ssid\":\"%s\",\"security\":\"%s\",\"signal\":%s}\n", ssid, security, signal)
    }' | awk 'BEGIN { print "[" } { if (NR>1) printf(","); printf("%s", $0) } END { print "]" }'
  elif command -v iwlist >/dev/null 2>&1 && command -v python3 >/dev/null 2>&1; then
    # Fallback für Systeme ohne NetworkManager: iwlist plus Python zur Auswertung.
    iwlist "$IFACE" scanning 2>/dev/null | python3 - "$IFACE" - <<'PY'
import sys, re, json

data = sys.stdin.read()
cells = re.split(r"\n\s*Cell \d+ - ", data)
nets = []
for c in cells:
    if not c.strip():
        continue
    ess = re.search(r'ESSID:"(.*)"', c)
    if not ess:
        continue
    ssid = ess.group(1) or '<unsichtbar>'
    sig = 0
    m = re.search(r'Signal level=([-0-9]+) dBm', c)
    if m:
        try:
            sig = int(m.group(1))
        except:
            sig = 0
    else:
        m2 = re.search(r'Quality=(\d+)/(\d+)', c)
        if m2:
            try:
                sig = int(int(m2.group(1)) * 100 / int(m2.group(2)))
            except:
                sig = 0
    security = ''
    if re.search(r'Encryption key:on', c, re.IGNORECASE):
        security = 'WPA'
    nets.append({ 'ssid': ssid, 'security': security, 'signal': sig })
print(json.dumps(nets, ensure_ascii=False))
PY
  else
    error "Kein passendes WLAN-Tool gefunden (nmcli oder iwlist+python). Bitte installiere NetworkManager oder die notwendigen Tools."
  fi
elif [[ "$COMMAND" == "connect" ]]; then
  SSID=${2:-}
  PASSWORD=${3:-}
  IFACE=${4:-$DEFAULT_IFACE}
  if [[ -z "$SSID" ]]; then
    error "SSID fehlt"
  fi

  if command -v nmcli >/dev/null 2>&1; then
    # NetworkManager verwenden, wenn verfügbar.
    if [[ -n "$PASSWORD" ]]; then
      if nmcli device wifi connect "$SSID" password "$PASSWORD" >/dev/null 2>&1; then
        true
      else
        nmcli_connect_wpa_psk "$SSID" "$PASSWORD"
      fi
    else
      nmcli device wifi connect "$SSID"
    fi
  elif command -v wpa_cli >/dev/null 2>&1 && command -v wpa_passphrase >/dev/null 2>&1; then
    # Fallback: wpa_supplicant konfigurieren, wenn NetworkManager nicht vorhanden ist.
    if [[ -n "$PASSWORD" ]]; then
      if [[ -w /etc/wpa_supplicant/wpa_supplicant.conf ]]; then
        wpa_passphrase "$SSID" "$PASSWORD" >> /etc/wpa_supplicant/wpa_supplicant.conf
        wpa_cli -i "$IFACE" reconfigure >/dev/null 2>&1 || true
        echo '{"message": "Konfiguriert und reconfigured" }'
      else
        error "Keine Schreibrechte für /etc/wpa_supplicant/wpa_supplicant.conf. Bitte mit sudo ausführen."
      fi
    else
      # Offenes Netzwerk: temporär ohne Passwort verbinden.
      netid=$(wpa_cli -i "$IFACE" add_network | tr -d '\n')
      wpa_cli -i "$IFACE" set_network "$netid" ssid '"'$SSID'"' >/dev/null 2>&1 || true
      wpa_cli -i "$IFACE" set_network "$netid" key_mgmt NONE >/dev/null 2>&1 || true
      wpa_cli -i "$IFACE" enable_network "$netid" >/dev/null 2>&1 || true
      wpa_cli -i "$IFACE" save_config >/dev/null 2>&1 || true
      wpa_cli -i "$IFACE" reconfigure >/dev/null 2>&1 || true
      echo '{"message": "Mit offenem Netzwerk verbunden" }'
    fi
  else
    error "Kein passendes Verbindungstool gefunden (nmcli oder wpa_cli+wpa_passphrase)."
  fi
elif [[ "$COMMAND" == "status" ]]; then
  # Aktuellen WLAN-Status abfragen und als JSON zurückgeben.
  if command -v nmcli >/dev/null 2>&1; then
    active_line=$(nmcli -t -f ACTIVE,SSID,SECURITY,SIGNAL device wifi list | awk -F ':' '$1=="yes" { print $0; exit }')
    if [[ -z "$active_line" ]]; then
      connection_name=$(nmcli -t -f GENERAL.CONNECTION device show "$IFACE" 2>/dev/null || true | cut -d: -f2-)
      if [[ -z "$connection_name" ]]; then
        connection_name=$((nmcli -t -f DEVICE,STATE,CONNECTION device status 2>/dev/null || true) | awk -F: '$2 ~ /^connected/ { print $3; exit }')
      fi
      if [[ -n "$connection_name" && "$connection_name" != "--" ]]; then
        ssid="$connection_name"
        signal=0
        security=""
        printf '{"ssid":"%s","security":"%s","signal":%s,"connected":true}\n' "$ssid" "$security" "$signal"
      else
        echo '{"ssid":"","security":"","signal":0,"connected":false}'
      fi
    else
      IFS=':' read -r active ssid security signal <<< "$active_line"
      if [[ -z "$ssid" ]]; then
        ssid="<unsichtbar>"
      fi
      printf '{"ssid":"%s","security":"%s","signal":%s,"connected":true}\n' "$ssid" "$security" "$signal"
    fi
  elif command -v iwgetid >/dev/null 2>&1; then
    ssid=$(iwgetid -r || true)
    if [[ -z "$ssid" ]]; then
      echo '{"ssid":"","security":"","signal":0,"connected":false}'
    else
      sig=0
      if command -v iwconfig >/dev/null 2>&1; then
        s=$(iwconfig "$IFACE" 2>/dev/null || true)
        m=$(echo "$s" | awk -F"=" '/Signal level/ {print $3; exit}')
        if [[ -n "$m" ]]; then
          sig_num=$(echo "$m" | grep -o -E '-?[0-9]+' || true)
          if [[ -n "$sig_num" ]]; then
            sig=$sig_num
          fi
        fi
      fi
      printf '{"ssid":"%s","security":"%s","signal":%s,"connected":true}\n' "$ssid" "" "$sig"
    fi
  else
    error "Kein passendes Status-Tool gefunden (nmcli oder iwgetid)."
  fi
else
  echo "Usage: $0 scan [iface] | connect <ssid> [password] [iface] | status [iface]" >&2
  exit 1
fi
