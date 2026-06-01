#!/bin/bash

# Wir holen uns den Namen der aktuellen Verbindung
# Der Output sieht meistens so aus: "GENERAL.CONNECTION:MeinWLAN"
# Mit 'cut' schneiden wir alles vor dem Doppelpunkt weg.
CURRENT_CON=$(nmcli -t -f GENERAL.CONNECTION dev show wlan0 | head -n 1 | cut -d':' -f2)

# Wenn die Verbindung NICHT "Hotspot" ist, prüfen wir das Internet
if [ "$CURRENT_CON" != "Hotspot" ]; then
    # Ping an Google DNS (2 Pakete, 2 Sekunden Timeout)
    if ! ping -c 2 -W 2 8.8.8.8 > /dev/null 2>&1; then
        echo "Kein Internet. Schalte auf Hotspot um..."
        nmcli con up Hotspot
    fi
fi
