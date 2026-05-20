from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import sqlite3

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ZEITRAUM_MAP = {
    "heute":  "strftime('%Y-%m-%d', zeitstempel) = strftime('%Y-%m-%d', 'now')",
    "7tage":  "zeitstempel >= datetime('now', '-7 days')",
    "30tage": "zeitstempel >= datetime('now', '-30 days')",
    "60tage": "zeitstempel >= datetime('now', '-60 days')",
    "90tage": "zeitstempel >= datetime('now', '-90 days')",
}

def get_db():
    conn = sqlite3.connect("../../database/WetterstationData.db")
    conn.row_factory = sqlite3.Row
    return conn

def query_history(typ_name: str, zeitraum_filter: str) -> list[dict]:
    conn = get_db()
    rows = conn.execute(f"""
        SELECT
            dt.name        AS typ,
            dt.einheit,
            s.name         AS sensor,
            m.wert,
            m.zeitstempel
        FROM messwert m
        JOIN dataTyp dt ON dt.typ_id   = m.dataTyp_id
        JOIN sensor  s  ON s.sensor_id = m.sensor_id
        WHERE dt.name = ?
          AND {zeitraum_filter}
        ORDER BY m.zeitstempel ASC
    """, (typ_name,)).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.get("/sensors")
def get_sensors():
    conn = get_db()
    rows = conn.execute("SELECT * FROM sensor").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/typen")
def get_typen():
    conn = get_db()
    rows = conn.execute("SELECT * FROM dataTyp ORDER BY name").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/aktuell")
def get_aktuellste_werte():
    conn = get_db()
    rows = conn.execute("""
        SELECT dt.name AS typ, dt.einheit, s.name AS sensor, m.wert, m.zeitstempel
        FROM messwert m
        JOIN dataTyp dt ON dt.typ_id   = m.dataTyp_id
        JOIN sensor  s  ON s.sensor_id = m.sensor_id
        WHERE m.messwert_id IN (
            SELECT messwert_id FROM messwert
            WHERE dataTyp_id = m.dataTyp_id
            ORDER BY zeitstempel DESC LIMIT 1
        )
        ORDER BY dt.name
    """).fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.get("/aktuell/{typ_name}")
def get_aktuellster_wert_typ(typ_name: str):
    conn = get_db()
    row = conn.execute("""
        SELECT dt.name AS typ, dt.einheit, s.name AS sensor, m.wert, m.zeitstempel
        FROM messwert m
        JOIN dataTyp dt ON dt.typ_id   = m.dataTyp_id
        JOIN sensor  s  ON s.sensor_id = m.sensor_id
        WHERE dt.name = ?
        ORDER BY m.zeitstempel DESC LIMIT 1
    """, (typ_name,)).fetchone()
    conn.close()
    return dict(row) if row else {"error": f"Kein Messwert für Typ '{typ_name}'"}

@app.get("/history/{typ_name}")
def history_flexibel(
    typ_name: str,
    zeitraum: str = Query(default="7tage", enum=list(ZEITRAUM_MAP.keys()))
):
    return query_history(typ_name, ZEITRAUM_MAP[zeitraum])