import sqlite3 
import os
import sys
sys.path.insert(0, "../../")
import log

db_path = "../WetterstationData.db"

def init_DB():
    
    try:

        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            log.log_info(f"Datenbankverzeichnis erstellt: {db_dir}")

        con = sqlite3.connect(db_path)
        cur = con.cursor()

        cur.execute("PRAGMA foreign_keys = ON;")
        cur.execute("PRAGMA journal_mode = WAL;")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS sensor (
                sensor_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
                name TEXT NOT NULL UNIQUE, 
                typ TEXT NOT NULL
            );""")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS dataTyp (
                typ_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
                name TEXT NOT NULL UNIQUE, 
                einheit TEXT NOT NULL
            );""")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS messwert (
                messwert_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                sensor_id INTEGER NOT NULL,
                dataTyp_id INTEGER NOT NULL,
                wert REAL NOT NULL,
                zeitstempel DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sensor_id) REFERENCES sensor(sensor_id),
                FOREIGN KEY (dataTyp_id) REFERENCES dataTyp(typ_id)
            );""")

        cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_messwert_zeit
                ON messwert (zeitstempel DESC);
            """)
    
        log.log_info("Tabellen und Index bereit.")

        cur.executemany(
                "INSERT OR IGNORE INTO sensor (name, typ) VALUES (?, ?);",
                [
                    ("DHT22",    "Temperatur/Luftfeuchtigkeit"),
                    ("BME280",   "Temperatur/Druck"),
                    ("VEML6075", "UV"),
                ]
            )
    
        cur.executemany(
                "INSERT OR IGNORE INTO dataTyp (name, einheit) VALUES (?, ?);",
                [
                    ("Temperatur",       "°C"),
                    ("Luftfeuchtigkeit", "%rH"),
                    ("Luftdruck",        "hPa"),
                    ("UV-Index",         "UV"),
                ]
            )
    
        log.log_info("Seed-Daten eingetragen (Sensoren & Datentypen).")

        con.commit()
        con.close()
    
        log.log_info(f"Datenbank erfolgreich initialisiert: {db_path}")
    
    except sqlite3.Error as e:
        log.log_error("SQLite-Fehler bei der DB-Initialisierung", e)
    except Exception as e:
        log.log_error("Unerwarteter Fehler bei der DB-Initialisierung", e)
 
 
if __name__ == "__main__":
    init_DB()
 
