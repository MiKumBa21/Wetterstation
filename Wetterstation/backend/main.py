"""Hauptstarter für das Backend der Wetterstation.

Dieses Skript sorgt dafür, dass Logging und die SQLite-Datenbank
initialisiert werden und startet anschließend das API-Backend als
Hintergrundprozess.
"""

import sys
from pathlib import Path
import subprocess

# Den Backend-Pfad in sys.path aufnehmen, damit lokale Module importiert werden können.
# Dadurch funktioniert der Import von backend.log und database.scripts.init_db.
sys.path.append(str(Path(__file__).parent.parent))

import log
from database.scripts.init_db import init_DB


def main():
    """Initialisiert das System und startet das API-Backend."""
    # Logging aufsetzen, damit Fehlermeldungen und Statusmeldungen erfasst werden.
    log.setup_logging()
    log.log_info("Wetterstation wird gestartet...")

    # Datenbank anlegen oder prüfen, ob sie bereits bereitsteht.
    if not init_DB():
        log.log_critical("DB-Initialisierung fehlgeschlagen – Abbruch.")
        sys.exit(1)

    # Die API in einem separaten Prozess starten, damit das Hauptskript nicht blockiert.
    script_path = "./init_api.sh"
    log.log_info(f"Starte init script im Hintergrund: {script_path}")
    try:
        # Uvicorn im Hintergrund starten, damit die Wetterstation weiterläuft.
        subprocess.Popen(["bash", script_path])
        log.log_info("init_api.sh gestartet (Hintergrund-Prozess)")
    except FileNotFoundError:
        log.log_critical(f"init_api.sh nicht gefunden: {script_path}")
        sys.exit(1)

    log.log_info("System bereit.")


if __name__ == "__main__":
    main()
