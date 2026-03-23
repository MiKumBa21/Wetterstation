import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import log
from database.scripts.init_db import init_DB  

def main():
    log.setup_logging()
    log.log_info("Wetterstation wird gestartet...")

    if not init_DB():
        log.log_critical("DB-Initialisierung fehlgeschlagen – Abbruch.")
        sys.exit(1)

    log.log_info("System bereit.")

if __name__ == "__main__":
    main()