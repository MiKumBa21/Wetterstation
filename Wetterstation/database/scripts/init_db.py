import sqlite3
import sys
from pathlib import Path

import os

# backend/ zum sys.path hinzufügen damit log und config importierbar sind
sys.path.append(str(Path(__file__).parent.parent.parent))
import log
import config

DEFAULT_DB_PATH = str(config.DB_PATH)

def init_DB(db_path: str = DEFAULT_DB_PATH) -> bool:
    try:
        # Verzeichnis erstellen, falls nicht vorhanden
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            log.log_info(f"Datenbankverzeichnis erstellt: {db_dir}")

        # Context Manager stellt sicher, dass die Verbindung auch bei Fehlern geschlossen wird
        with sqlite3.connect(db_path) as con:
            cur = con.cursor()

            cur.execute("PRAGMA foreign_keys = ON;")
            cur.execute("PRAGMA journal_mode = WAL;")

            # Tabellen anlegen
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sensor (
                    sensor_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    name      TEXT    NOT NULL UNIQUE,
                    typ       TEXT    NOT NULL
                );""")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS dataTyp (
                    typ_id  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    name    TEXT    NOT NULL UNIQUE,
                    einheit TEXT    NOT NULL
                );""")

            cur.execute("""
                CREATE TABLE IF NOT EXISTS messwert (
                    messwert_id INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
                    sensor_id   INTEGER  NOT NULL,
                    dataTyp_id  INTEGER  NOT NULL,
                    wert        REAL     NOT NULL,
                    -- ISO-8601 UTC-Zeitstempel für eindeutige Interpretation
                    zeitstempel TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
                    FOREIGN KEY (sensor_id)  REFERENCES sensor(sensor_id),
                    FOREIGN KEY (dataTyp_id) REFERENCES dataTyp(typ_id)
                );""")

            # Index für zeitbasierte Abfragen
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_messwert_zeit
                ON messwert (zeitstempel DESC);
            """)

            # Zusammengesetzter Index für sensor-spezifische Zeitreihenabfragen
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_messwert_sensor_zeit
                ON messwert (sensor_id, zeitstempel DESC);
            """)

            #Index für einzelnen Datensatz
            cur.execute("""
               CREATE INDEX IF NOT EXISTS idx_messwert_datatyp_zeit
                ON messwert (dataTyp_id, zeitstempel DESC);
            """)

            log.log_info("Tabellen und Indizes bereit.")

            # Seed-Daten: Sensoren
            cur.executemany(
                "INSERT OR IGNORE INTO sensor (name, typ) VALUES (?, ?);",
                [
                    ("DHT22",    "Temperatur/Luftfeuchtigkeit"),
                    ("BME280",   "Temperatur/Druck"),
                    ("VEML6075", "UV"),
                ]
            )

            # Seed-Daten: Datentypen
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

        log.log_info(f"Datenbank erfolgreich initialisiert: {os.path.normpath(DEFAULT_DB_PATH)}")
        return True

    except sqlite3.Error as e:
        log.log_error("SQLite-Fehler bei der DB-Initialisierung", e)
        return False
    except OSError as e:
        log.log_error("Dateisystemfehler bei der DB-Initialisierung", e)
        return False
    except Exception as e:
        # Unbekannte Fehler werden geloggt und weitergeworfen,
        # damit Programmierfehler nicht still verschluckt werden.
        log.log_error("Unerwarteter Fehler bei der DB-Initialisierung", e)
        raise


if __name__ == "__main__":
    success = init_DB()
    sys.exit(0 if success else 1)
