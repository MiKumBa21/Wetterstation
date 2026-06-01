import sys
from pathlib import Path
import subprocess

sys.path.append(str(Path(__file__).parent.parent))

import log
from database.scripts.init_db import init_DB  

def main():
    log.setup_logging()
    log.log_info("Wetterstation wird gestartet...")

    if not init_DB():
        log.log_critical("DB-Initialisierung fehlgeschlagen – Abbruch.")
        sys.exit(1)

    # Starte zusätzliches Initialisierungs-Skript für die API
    script_path = "./init_api.sh"
    log.log_info(f"Starte init script: {script_path}")
    try:
        res = subprocess.run(["bash", script_path], check=True, capture_output=True, text=True)
        if res.stdout:
            log.log_info(f"init_api.sh stdout: {res.stdout.strip()}")
        if res.stderr:
            log.log_info(f"init_api.sh stderr: {res.stderr.strip()}")
    except subprocess.CalledProcessError as e:
        log.log_critical(f"init_api.sh fehlgeschlagen (Code {e.returncode}): {e.stderr.strip() if e.stderr else str(e)}")
        sys.exit(1)
    except FileNotFoundError:
        log.log_critical(f"init_api.sh nicht gefunden: {script_path}")
        sys.exit(1)

    log.log_info("System bereit.")

if __name__ == "__main__":
    main()