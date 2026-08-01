#!/usr/bin/env bash
# REDNOTEN lokal starten (macOS) — einfach doppelklicken.
cd "$(dirname "$0")" || exit 1
PORT=8000
URL="http://localhost:$PORT/index.html"

echo "============================================================"
echo "   REDNOTEN wird gestartet ..."
echo "   Der Browser öffnet sich gleich automatisch."
echo "   Adresse:  $URL"
echo ""
echo "   Dieses Fenster offen lassen, solange du REDNOTEN nutzt."
echo "   Zum Beenden: Strg+C drücken oder Fenster schließen."
echo "============================================================"
echo ""

# Browser kurz nach dem Serverstart öffnen
( sleep 1.5; open "$URL" ) &

# Lokalen Webserver starten
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT"
else
  echo "Python wurde nicht gefunden."
  echo "Öffne stattdessen die Datei index.html direkt im Browser (Doppelklick)."
  read -r -p "Zum Schließen Enter drücken …"
fi
