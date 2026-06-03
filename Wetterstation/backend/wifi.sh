#!/usr/bin/env bash
set -euo pipefail

COMMAND=${1:-}
IFACE=${2:-wlan0}

function error() {
  echo "$1" >&2
  exit 1
}

if [[ "$COMMAND" == "scan" ]]; then
  if command -v nmcli >/dev/null 2>&1; then
    nmcli -t -f SSID,SECURITY,SIGNAL device wifi list | awk -F ':' 'NF>=3 {
      ssid = $1
      security = $2
      signal = $3
      gsub(/"/, "\\\"", ssid)
      if (ssid == "") ssid = "<unsichtbar>"
      printf("{\"ssid\":\"%s\",\"security\":\"%s\",\"signal\":%s}\n", ssid, security, signal)
    }' | awk 'BEGIN { print "[" } { if (NR>1) printf(","); printf("%s", $0) } END { print "]" }'
  else
    error "nmcli nicht gefunden. Bitte installiere NetworkManager oder passe das Skript an."
  fi
elif [[ "$COMMAND" == "connect" ]]; then
  SSID=${2:-}
  PASSWORD=${3:-}
  if [[ -z "$SSID" ]]; then
    error "SSID fehlt"
  fi
  if command -v nmcli >/dev/null 2>&1; then
    if [[ -n "$PASSWORD" ]]; then
      nmcli device wifi connect "$SSID" password "$PASSWORD"
    else
      nmcli device wifi connect "$SSID"
    fi
  else
    error "nmcli nicht gefunden. Bitte installiere NetworkManager oder passe das Skript an."
  fi
elif [[ "$COMMAND" == "status" ]]; then
  if command -v nmcli >/dev/null 2>&1; then
    active_line=$(nmcli -t -f ACTIVE,SSID,SECURITY,SIGNAL device wifi list | awk -F ':' '$1=="yes" { print $0; exit }')
    if [[ -z "$active_line" ]]; then
      connection_name=$(nmcli -t -f GENERAL.CONNECTION device show "$IFACE" 2>/dev/null || true | cut -d: -f2-)
      if [[ -z "$connection_name" ]]; then
        connection_name=$( (nmcli -t -f DEVICE,STATE,CONNECTION device status 2>/dev/null || true) | awk -F: '$2 ~ /^connected/ { print $3; exit }')
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
  else
    error "nmcli nicht gefunden. Bitte installiere NetworkManager oder passe das Skript an."
  fi
else
  echo "Usage: $0 scan|connect|status <ssid> [password]" >&2
  exit 1
fi
