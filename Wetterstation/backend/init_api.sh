#!/usr/bin/env bash
set -euo pipefail

# Dieses Skript startet die FastAPI-Anwendung aus dem Backend/api-Ordner.
# Es wird vom Hauptbackend-Prozess im Hintergrund aufgerufen.

# Wechsel in das Verzeichnis, in dem sich die API-Anwendung befindet.
# Der Pfad ist hier hartkodiert; bei Bedarf muss er an die Laufumgebung angepasst werden.
cd "/home/admin/Wetterstation/backend/api/" && uvicorn main:app

# Hinweis:
# Wenn das Projekt in einer anderen Umgebung liegt, muss dieser Pfad
# entsprechend angepasst werden oder das Skript von einem relativen
# Pfad aus gestartet werden.
