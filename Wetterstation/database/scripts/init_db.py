"""Datenbankinitialisierung für die Wetterstation.

Dieses Skript legt die SQLite-Datenbankdatei an, erstellt die nötigen
Tabellen und fügt Default-Sensoren sowie Default-Datentypen ein.
"""

import sqlite3
import sys
import os
from pathlib import Path

# backend/ zum sys.path hinzufügen, damit log und config importierbar sind.
sys.path.append(str(Path(__file__).parent.parent.parent))
import log
import config

DEFAULT_DB_PATH = str(config.DB_PATH)


def init_DB(db_path: str = DEFAULT_DB_PATH) -> bool:
    """Erstellt die Datenbank, Tabellen, Indizes und Seed-Daten."""
    try:
        # Verzeichnis für die Datenbank erstellen, falls nicht vorhanden.
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            log.log_info(f"Datenbankverzeichnis erstellt: {db_dir}")

        with sqlite3.connect(db_path) as con:
            cur = con.cursor()

            # SQLite-Foreign-Keys aktivieren, damit Referenzen sauber geprüft werden.
            cur.execute("PRAGMA foreign_keys = ON;")
            cur.execute("PRAGMA journal_mode = WAL;")

            # Tabelle für Sensoren anlegen.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS sensor (
                    sensor_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    name      TEXT    NOT NULL UNIQUE,
                    typ       TEXT    NOT NULL
                );""")

            # Tabelle für Datentypen anlegen.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS dataTyp (
                    typ_id  INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    name    TEXT    NOT NULL UNIQUE,
                    einheit TEXT    NOT NULL
                );""")

            # Tabelle für Messwerte mit Zeitstempel anlegen.
            cur.execute("""
                CREATE TABLE IF NOT EXISTS messwert (
                    messwert_id INTEGER  PRIMARY KEY AUTOINCREMENT NOT NULL,
                    sensor_id   INTEGER  NOT NULL,
                    dataTyp_id  INTEGER  NOT NULL,
                    wert        REAL     NOT NULL,
                    zeitstempel TEXT     NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now')),
                    FOREIGN KEY (sensor_id)  REFERENCES sensor(sensor_id),
                    FOREIGN KEY (dataTyp_id) REFERENCES dataTyp(typ_id)
                );""")

            # Indizes für performante Abfragen nach Zeit und Sensor/Datentyp.
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_messwert_zeit
                ON messwert (zeitstempel DESC);
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_messwert_sensor_zeit
                ON messwert (sensor_id, zeitstempel DESC);
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_messwert_datatyp_zeit
                ON messwert (dataTyp_id, zeitstempel DESC);
            """)

            log.log_info("Tabellen und Indizes bereit.")

            # Standard-Sensoren eintragen, falls sie noch nicht existieren.
            cur.executemany(
                "INSERT OR IGNORE INTO sensor (name, typ) VALUES (?, ?);",
                [
                    ("DHT22", "Temperatur/Luftfeuchtigkeit"),
                    ("US5881LUA", "Windgeschwindigkeit"),
                    ("VEML7700", "Beleuchtungsstärke"),
                ]
            )

            # Standard-Datentypen eintragen.
            cur.executemany(
                "INSERT OR IGNORE INTO dataTyp (name, einheit) VALUES (?, ?);",
                [
                    ("Temperatur", "°C"),
                    ("Luftfeuchtigkeit", "%rH"),
                    ("Windgeschwindigkeit", "km/h"),
                    ("Beleuchtungsstärke", "Lux"),
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
        log.log_error("Unerwarteter Fehler bei der DB-Initialisierung", e)
        raise


if __name__ == "__main__":
    success = init_DB()
    sys.exit(0 if success else 1)
