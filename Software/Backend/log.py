import os
import logging
from datetime import datetime
from pathlib import Path

# Log-Pfad
log_path = "../../wetterstation.log"

# Logger konfigurieren
logger = logging.getLogger("Wetterstation")
logger.setLevel(logging.DEBUG)

# Formatter für Log-Nachrichten
log_format = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


def checkLogFile():
    """Überprüft, ob die Log-Datei existiert und erstellt sie eventuell."""
    try:
        log_dir = os.path.dirname(log_path)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        if not os.path.exists(log_path):
            Path(log_path).touch()
            return True
        return True
    except Exception as e:
        print(f"Fehler beim Überprüfen der Log-Datei: {e}")
        return False


def setup_logging():
    """Initialisiert das Logging mit File- und Console-Handler."""
    try:
        # Prüfe Log-Datei
        if not checkLogFile():
            print("Log-Datei konnte nicht erstellt werden")
            return False
        
        # Console Handler - nur für wichtige Meldungen
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(log_format)
        
        # File Handler - für alle Meldungen
        file_handler = logging.FileHandler(log_path, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(log_format)
        
        # Handler zum Logger hinzufügen
        if not logger.handlers:
            logger.addHandler(console_handler)
            logger.addHandler(file_handler)
        
        return True
    except Exception as e:
        print(f"Fehler beim Einrichten des Logging: {e}")
        return False


def log_info(message: str):
    """Loggt eine Info-Nachricht."""
    logger.info(message)


def log_warning(message: str):
    """Loggt eine Warnungs-Nachricht."""
    logger.warning(message)


def log_error(message: str, exception: Exception = None):
    """Loggt eine Fehler-Nachricht."""
    if exception:
        logger.error(f"{message} - {str(exception)}", exc_info=True)
    else:
        logger.error(message)


def log_debug(message: str):
    """Loggt eine Debug-Nachricht."""
    logger.debug(message)


def log_critical(message: str):
    """Loggt eine kritische Nachricht."""
    logger.critical(message)


def get_logger():
    """Gibt den konfigurierten Logger zurück."""
    if not logger.handlers:
        setup_logging()
    return logger


# Logging beim Import initialisieren
if __name__ != "__main__":
    setup_logging()
        

