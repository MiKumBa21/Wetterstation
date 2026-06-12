"""Zentrale Projektkonfiguration für die Wetterstation.

Alle Pfade werden hier definiert, damit sie von mehreren Modulen
einheitlich verwendet werden können.
"""

from pathlib import Path

# Basisverzeichnis des Projekts (eine Ebene über backend/).
BASE_DIR = Path(__file__).resolve().parent.parent

# Pfad zur Logdatei: logs/Wetterstation.log unter dem Projektstamm.
LOG_PATH = BASE_DIR / "logs" / "Wetterstation.log"

# Pfad zur SQLite-Datenbankdatei im database-Verzeichnis.
DB_PATH = BASE_DIR / "database" / "WetterstationData.db"
