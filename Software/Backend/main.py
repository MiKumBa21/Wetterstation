import sys
import log
from database.script.init_db import init_DB

def main():
    log.setup_logging()
    log.log_info("Wetterstation wird gestartet...")

    # DB beim Start initialisieren (sicher, da idempotent)
    if not init_DB():
        log.log_critical("DB-Initialisierung fehlgeschlagen – Abbruch.")
        sys.exit(1)

    log.log_info("System bereit.")

    # Hier kannst du später deinen Server / Sensor-Loop starten
    # z.B.: server.start()

if __name__ == "__main__":
    main()
