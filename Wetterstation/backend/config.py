from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

LOG_PATH = BASE_DIR / "logs" / "Wetterstation.log"
DB_PATH  = BASE_DIR / "database" / "WetterstationData.db"
