"""Schnelle REST-API für die Wetterstation.

Dieses Modul stellt Endpunkte für Sensoren, Datentypen, aktuelle Messwerte,
Verlaufdaten und WLAN-Funktionalität bereit.
"""

import json
import sqlite3
import subprocess
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Pfad zum WLAN-Skript im Backend-Ordner.
WIFI_SCRIPT = Path(__file__).resolve().parent.parent / "wifi.sh"

app = FastAPI()

# CORS-Middleware, damit das Frontend im Browser auf diese API zugreifen kann.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapping der erlaubten Zeitraum-Parameter auf SQLite-Filterausdrücke.
ZEITRAUM_MAP = {
    "heute": "strftime('%Y-%m-%d', zeitstempel) = strftime('%Y-%m-%d', 'now')",
    "7tage": "zeitstempel >= datetime('now', '-7 days')",
    "30tage": "zeitstempel >= datetime('now', '-30 days')",
    "60tage": "zeitstempel >= datetime('now', '-60 days')",
    "90tage": "zeitstempel >= datetime('now', '-90 days')",
}


def get_db():
    """Öffnet eine SQLite-Verbindung zur Wetterstation-Datenbank."""
    conn = sqlite3.connect("../../database/WetterstationData.db")
    conn.row_factory = sqlite3.Row
    return conn


def query_history(typ_name: str, zeitraum_filter: str) -> list[dict]:
    """Fragt historische Daten für einen Typ innerhalb eines Zeitraums ab."""
    conn = get_db()
    rows = conn.execute(
        f"""
        SELECT
            dt.name AS typ,
            dt.einheit,
            s.name AS sensor,
            m.wert,
            m.zeitstempel
        FROM messwert m
        JOIN dataTyp dt ON dt.typ_id = m.dataTyp_id
        JOIN sensor s ON s.sensor_id = m.sensor_id
        WHERE dt.name = ?
          AND {zeitraum_filter}
        ORDER BY m.zeitstempel ASC
    """,
        (typ_name,),
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/sensors")
def get_sensors():
    """Gibt alle Sensoren zurück."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM sensor").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/typen")
def get_typen():
    """Gibt alle Datentypen sortiert nach Namen zurück."""
    conn = get_db()
    rows = conn.execute("SELECT * FROM dataTyp ORDER BY name").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/aktuell")
def get_aktuellste_werte():
    """Gibt den neuesten Messwert jedes Datentyps zurück."""
    conn = get_db()
    rows = conn.execute(
        """
        SELECT dt.name AS typ, dt.einheit, s.name AS sensor, m.wert, m.zeitstempel
        FROM messwert m
        JOIN dataTyp dt ON dt.typ_id = m.dataTyp_id
        JOIN sensor s ON s.sensor_id = m.sensor_id
        WHERE m.messwert_id IN (
            SELECT messwert_id FROM messwert
            WHERE dataTyp_id = m.dataTyp_id
            ORDER BY zeitstempel DESC LIMIT 1
        )
        ORDER BY dt.name
    """
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/aktuell/{typ_name}")
def get_aktuellster_wert_typ(typ_name: str):
    """Gibt den aktuellsten Messwert für einen einzelnen Typ zurück."""
    conn = get_db()
    row = conn.execute(
        """
        SELECT dt.name AS typ, dt.einheit, s.name AS sensor, m.wert, m.zeitstempel
        FROM messwert m
        JOIN dataTyp dt ON dt.typ_id = m.dataTyp_id
        JOIN sensor s ON s.sensor_id = m.sensor_id
        WHERE dt.name = ?
        ORDER BY m.zeitstempel DESC LIMIT 1
    """,
        (typ_name,),
    ).fetchone()
    conn.close()
    return dict(row) if row else {"error": f"Kein Messwert für Typ '{typ_name}'"}


@app.get("/history/{typ_name}")
def history_flexibel(
    typ_name: str,
    zeitraum: str = Query(default="7tage", enum=list(ZEITRAUM_MAP.keys())),
):
    """Gibt Verlaufsmesswerte für einen Typ und Zeitraum zurück."""
    return query_history(typ_name, ZEITRAUM_MAP[zeitraum])


class WifiConnectRequest(BaseModel):
    """Datentransfer-Objekt für WLAN-Verbindungsanfragen."""
    ssid: str
    password: str | None = None


@app.get("/wifi")
def get_wifi_networks():
    """Scannt WLAN-Netzwerke und liefert die Ergebnisse als JSON."""
    if not WIFI_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="WLAN-Skript nicht gefunden")
    try:
        result = subprocess.run(
            ["bash", str(WIFI_SCRIPT), "scan"], capture_output=True, text=True, check=True
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=(e.stderr or e.stdout or "WLAN-Scan fehlgeschlagen").strip(),
        )
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Ungültige WLAN-Antwort: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/wifi/connect")
def connect_wifi(request: WifiConnectRequest):
    """Verbindet das System mit einem WLAN-Netzwerk."""
    if not WIFI_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="WLAN-Skript nicht gefunden")
    try:
        args = ["bash", str(WIFI_SCRIPT), "connect", request.ssid]
        if request.password:
            args.append(request.password)
        result = subprocess.run(args, capture_output=True, text=True, check=True)
        return {"message": result.stdout.strip() or f"Mit {request.ssid} verbunden"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=(e.stderr or e.stdout or "Verbindung fehlgeschlagen").strip(),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/wifi/status")
def get_wifi_status():
    """Liefert den aktuellen WLAN-Verbindungsstatus zurück."""
    if not WIFI_SCRIPT.exists():
        raise HTTPException(status_code=500, detail="WLAN-Skript nicht gefunden")
    try:
        result = subprocess.run(
            ["bash", str(WIFI_SCRIPT), "status"], capture_output=True, text=True, check=True
        )
        return json.loads(result.stdout)
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=(e.stderr or e.stdout or "WLAN-Status konnte nicht geladen werden").strip(),
        )
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Ungültige WLAN-Antwort: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
