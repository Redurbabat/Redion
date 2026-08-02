#!/usr/bin/env bash
# REDNOTEN lokal starten (macOS) — einfach doppelklicken.
cd "$(dirname "$0")" || exit 1
PORT=8080
URL="http://localhost:$PORT/"

echo "============================================================"
echo "   REDNOTEN wird gestartet ..."
echo "   Der Browser öffnet sich gleich automatisch."
echo "   Adresse:  $URL"
echo ""
echo "   Der Abgleich zwischen Geräten ist mit dabei:"
echo "   in der App  Strg+K  →  \"Abgleich einrichten\""
echo ""
echo "   Dieses Fenster offen lassen, solange du REDNOTEN nutzt."
echo "   Zum Beenden: Strg+C drücken oder Fenster schließen."
echo "============================================================"
echo ""

PY=""
command -v python3 >/dev/null 2>&1 && PY=python3
[ -z "$PY" ] && command -v python >/dev/null 2>&1 && PY=python

if [ -z "$PY" ]; then
  echo "Python wurde nicht gefunden."
  echo "Öffne stattdessen die Datei index.html direkt im Browser (Doppelklick)."
  read -r -p "Zum Schließen Enter drücken …"
  exit 1
fi

# server.py bringt App und Abgleich mit und öffnet den Browser selbst.
if [ -f server.py ]; then
  exec "$PY" server.py --port "$PORT"
fi

( sleep 1.5; open "$URL" ) &
exec "$PY" -m http.server "$PORT"
