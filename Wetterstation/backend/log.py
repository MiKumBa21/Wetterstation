"""Logging-Modul für die Wetterstation.

Dieses Modul konfiguriert einen zentralen Logger, der Meldungen in
Datei und optional auf die Konsole schreibt. Es stellt Hilfsfunktionen
für verschiedene Schweregrade bereit.
"""

import os
import logging
from pathlib import Path
from config import LOG_PATH  # config liegt im selben Ordner (backend/)

# Pfad zur Logdatei als String für das Dateihandling.
log_path = str(LOG_PATH)

# Logger-Instanz für das gesamte Projekt, ähnliche Konfiguration für alle Module.
logger = logging.getLogger("Wetterstation")
logger.setLevel(logging.DEBUG)

# Einheitliches Format für alle Log-Nachrichten.
log_format = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


def checkLogFile():
    """Überprüft, ob das Log-Verzeichnis vorhanden ist und legt die Log-Datei an."""
    try:
        log_dir = os.path.dirname(log_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)

        if not os.path.exists(log_path):
            Path(log_path).touch()
        return True
    except Exception as e:
        print(f"Fehler beim Überprüfen der Log-Datei: {e}")
        return False


def setup_logging():
    """Bereitet die Logger-Handler vor und hängt sie an den globalen Logger an."""
    try:
        if not checkLogFile():
            print("Log-Datei konnte nicht erstellt werden")
            return False

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(log_format)

        file_handler = logging.FileHandler(log_path, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(log_format)

        if not logger.handlers:
            logger.addHandler(console_handler)
            logger.addHandler(file_handler)

        return True
    except Exception as e:
        print(f"Fehler beim Einrichten des Logging: {e}")
        return False


def log_info(message: str):
    """Loggt eine Informationsmeldung."""
    logger.info(message)


def log_warning(message: str):
    """Loggt eine Warnung."""
    logger.warning(message)


def log_error(message: str, exception: Exception = None):
    """Loggt einen Fehler; bei vorhandenem Exception-Objekt mit Stacktrace."""
    if exception:
        logger.error(f"{message} - {str(exception)}", exc_info=True)
    else:
        logger.error(message)


def log_debug(message: str):
    """Loggt eine Debug-Nachricht."""
    logger.debug(message)


def log_critical(message: str):
    """Loggt eine kritische Fehlermeldung."""
    logger.critical(message)


def get_logger():
    """Gibt die konfigurierte Logger-Instanz zurück, initialisiert sie bei Bedarf."""
    if not logger.handlers:
        setup_logging()
    return logger


# Logging auch beim Import des Moduls initialisieren, falls das Skript als Paket verwendet wird.
if __name__ != "__main__":
    setup_logging()
        

