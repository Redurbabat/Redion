#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
REDNOTEN — Server zum Abgleichen zwischen Geräten
=================================================

Startet die App **und** einen kleinen Abgleich-Dienst, damit dieselben Notizen
auf Laptop, Handy und Tablet liegen — und mehrere Leute gleichzeitig schreiben
können.

    python3 server.py               # startet auf Port 8080
    python3 server.py --port 9000   # anderer Port
    python3 server.py --daten ~/rednoten-daten

Es wird **nichts** installiert und **nichts** bezahlt: Der Server benutzt
ausschließlich die Python-Standardbibliothek und läuft auf deinem eigenen
Rechner. Kein Konto, kein Fremdanbieter, kein Schlüssel.

Wie es funktioniert
-------------------
* Jeder „Raum" ist ein frei gewählter Code (z. B. `familie-2026`). Wer denselben
  Code eingibt, sieht dieselben Notizen. Der Code ist gleichzeitig das Passwort
  — also einen wählen, den niemand errät.
* Die Notizen eines Raums liegen als eine JSON-Datei im Datenordner.
* Der Server führt zusammen, statt zu überschreiben: Für jede Notiz gewinnt die
  Fassung mit dem neueren Zeitstempel. Löschungen merkt er sich als Grabstein,
  damit eine gelöschte Notiz nicht von einem anderen Gerät zurückkommt.
* Über eine WebSocket-Verbindung sagt der Server allen offenen Fenstern sofort
  Bescheid, wenn sich etwas geändert hat — dadurch fühlt es sich live an.

Schnittstelle
-------------
  GET  /sync/<raum>?stand=<n>   → { stand, unveraendert } oder { stand, daten }
  POST /sync/<raum>             → Notizen hochschicken, zusammengeführt zurück
  GET  /ws/<raum>               → WebSocket: { typ: "aktualisiert" | "anwesend" }
  GET  /raeume                  → Liste der Räume auf diesem Server (nur Namen)
  GET  /                        → die App selbst (index.html)
"""

import argparse
import base64
import hashlib
import json
import os
import re
import socket
import struct
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ── Grenzen: verhindern, dass ein einzelner Aufruf den Speicher sprengt ──
MAX_KOERPER = 64 * 1024 * 1024      # 64 MB pro Hochladen (Bilder sind mit drin)
MAX_WS_NACHRICHT = 1 * 1024 * 1024  # WebSocket-Nachrichten sind winzig
WS_MAGIE = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

HIER = os.path.dirname(os.path.abspath(__file__))


# ═══════════════════════════════════════════════════════════════════════
#  Raum-Speicher: eine JSON-Datei je Raum, geschützt durch ein Schloss
# ═══════════════════════════════════════════════════════════════════════

def raum_saeubern(name):
    """Nur harmlose Zeichen zulassen — der Name wird zum Dateinamen."""
    sauber = re.sub(r"[^A-Za-z0-9_-]", "", (name or ""))[:48]
    return sauber


class Raeume:
    def __init__(self, ordner):
        self.ordner = ordner
        os.makedirs(ordner, exist_ok=True)
        self.schloss = threading.Lock()
        self.zwischen = {}   # raum -> {"stand": n, "daten": {...}}

    def _pfad(self, raum):
        return os.path.join(self.ordner, "raum-%s.json" % raum)

    def _laden(self, raum):
        if raum in self.zwischen:
            return self.zwischen[raum]
        pfad = self._pfad(raum)
        eintrag = {"stand": 0, "daten": leerer_bestand()}
        if os.path.exists(pfad):
            try:
                with open(pfad, "r", encoding="utf-8") as f:
                    gelesen = json.load(f)
                eintrag = {
                    "stand": int(gelesen.get("stand", 0)),
                    "daten": gelesen.get("daten") or leerer_bestand(),
                }
            except Exception as e:
                # Kaputte Datei nicht stillschweigend überschreiben: beiseitelegen.
                print("  ! Raum %s ist nicht lesbar (%s) — Datei wird als .kaputt gesichert" % (raum, e))
                try:
                    os.replace(pfad, pfad + ".kaputt")
                except OSError:
                    pass
        self.zwischen[raum] = eintrag
        return eintrag

    def _schreiben(self, raum, eintrag):
        pfad = self._pfad(raum)
        # Erst daneben schreiben, dann umbenennen — sonst steht bei einem
        # Absturz mitten im Schreiben eine halbe Datei auf der Platte.
        vorlaeufig = pfad + ".neu"
        with open(vorlaeufig, "w", encoding="utf-8") as f:
            json.dump(eintrag, f, ensure_ascii=False, separators=(",", ":"))
        os.replace(vorlaeufig, pfad)

    def holen(self, raum):
        with self.schloss:
            e = self._laden(raum)
            return e["stand"], e["daten"]

    def zusammenfuehren(self, raum, fremd):
        """Fremde Fassung einarbeiten und den zusammengeführten Stand zurückgeben."""
        with self.schloss:
            e = self._laden(raum)
            neu, veraendert = verschmelzen(e["daten"], fremd)
            if veraendert:
                e["stand"] += 1
                e["daten"] = neu
                self._schreiben(raum, e)
            return e["stand"], e["daten"], veraendert

    def liste(self):
        with self.schloss:
            namen = []
            for d in sorted(os.listdir(self.ordner)):
                if d.startswith("raum-") and d.endswith(".json"):
                    pfad = os.path.join(self.ordner, d)
                    namen.append({
                        "raum": d[5:-5],
                        "groesse": os.path.getsize(pfad),
                        "geaendert": int(os.path.getmtime(pfad) * 1000),
                    })
            return namen


# ═══════════════════════════════════════════════════════════════════════
#  Zusammenführen — die eigentliche Denkarbeit
# ═══════════════════════════════════════════════════════════════════════

def leerer_bestand():
    return {"notes": [], "notebooks": [], "bilder": {}, "geloescht": {}, "geaendert": 0}


def _zahl(wert):
    try:
        return int(wert)
    except (TypeError, ValueError):
        return 0


def verschmelzen(alt, neu):
    """
    Führt zwei Notizbestände zusammen.

    Regel je Notiz: Wer den neueren `updated`-Zeitstempel hat, gewinnt.
    Regel je Löschung: Ein Grabstein (`geloescht[id] = zeit`) entfernt eine
    Notiz, solange die Notiz nicht *nach* dem Löschen wieder bearbeitet wurde —
    dann lebt sie weiter. Das ist die freundlichere Wahl: lieber eine Notiz zu
    viel als eine verlorene.
    """
    ergebnis = {
        "notes": [],
        "notebooks": [],
        "bilder": {},
        "geloescht": {},
        "geaendert": max(_zahl(alt.get("geaendert")), _zahl(neu.get("geaendert"))),
    }
    veraendert = False

    # ── Grabsteine: jeweils der späteste Löschzeitpunkt zählt ──
    graeber = {}
    for quelle in (alt.get("geloescht") or {}, neu.get("geloescht") or {}):
        if not isinstance(quelle, dict):
            continue
        for kennung, zeit in quelle.items():
            zeit = _zahl(zeit)
            if zeit > graeber.get(kennung, 0):
                graeber[kennung] = zeit
    # Grabsteine irgendwann vergessen, damit die Datei nicht ewig wächst.
    # Gemessen wird an der *jüngsten Zeit in den Daten selbst*, nicht an der
    # Uhr des Servers: Sonst würde eine falsch gestellte Uhr (oder ein Gerät
    # mit anderer Zeitzone) frische Grabsteine wegwerfen — und gelöschte
    # Seiten kämen beim nächsten Abgleich wieder hoch.
    zeiten = list(graeber.values())
    for menge in ((alt.get("notes") or []), (neu.get("notes") or [])):
        zeiten += [_zahl(n.get("updated")) for n in menge if isinstance(n, dict)]
    juengste = max(zeiten) if zeiten else int(time.time() * 1000)
    grenze = juengste - 180 * 24 * 3600 * 1000   # 180 Tage
    ergebnis["geloescht"] = {k: v for k, v in graeber.items() if v > grenze}
    if ergebnis["geloescht"] != (alt.get("geloescht") or {}):
        veraendert = True

    # ── Notizen ──
    nach_kennung = {}
    for notiz in (alt.get("notes") or []):
        if isinstance(notiz, dict) and notiz.get("id"):
            nach_kennung[notiz["id"]] = notiz
    vorher_anzahl = len(nach_kennung)

    for notiz in (neu.get("notes") or []):
        if not isinstance(notiz, dict) or not notiz.get("id"):
            continue
        kennung = notiz["id"]
        vorhanden = nach_kennung.get(kennung)
        if vorhanden is None:
            nach_kennung[kennung] = notiz
            veraendert = True
        elif _zahl(notiz.get("updated")) > _zahl(vorhanden.get("updated")):
            nach_kennung[kennung] = notiz
            veraendert = True

    for kennung, zeit in graeber.items():
        notiz = nach_kennung.get(kennung)
        if notiz is not None and _zahl(notiz.get("updated")) <= zeit:
            del nach_kennung[kennung]
            veraendert = True

    ergebnis["notes"] = list(nach_kennung.values())
    if len(ergebnis["notes"]) != vorher_anzahl:
        veraendert = True

    # ── Notizbücher (nur noch aus alten Sicherungen) — rein additiv ──
    buecher = {b["id"]: b for b in (alt.get("notebooks") or []) if isinstance(b, dict) and b.get("id")}
    for buch in (neu.get("notebooks") or []):
        if isinstance(buch, dict) and buch.get("id") and buch["id"] not in buecher:
            buecher[buch["id"]] = buch
            veraendert = True
    ergebnis["notebooks"] = list(buecher.values())

    # ── Bilder: werden nur hinzugefügt, nie überschrieben ──
    bilder = dict(alt.get("bilder") or {})
    for kennung, bild in (neu.get("bilder") or {}).items():
        if kennung not in bilder:
            bilder[kennung] = bild
            veraendert = True
    # Ein Bild verschwindet nur über einen ausdrücklichen Grabstein "bild:<id>".
    for kennung in list(bilder.keys()):
        if ("bild:" + kennung) in graeber:
            del bilder[kennung]
            veraendert = True
    ergebnis["bilder"] = bilder

    if veraendert:
        ergebnis["geaendert"] = max(ergebnis["geaendert"], int(time.time() * 1000))
    return ergebnis, veraendert


# ═══════════════════════════════════════════════════════════════════════
#  WebSocket — von Hand, damit keine Bibliothek nötig ist
# ═══════════════════════════════════════════════════════════════════════

class WsRaum:
    """Alle offenen Fenster eines Raums."""

    def __init__(self):
        self.schloss = threading.Lock()
        self.leute = {}   # socket -> {"name": str, "sende": Lock}

    def dazu(self, verbindung, name):
        with self.schloss:
            self.leute[verbindung] = {"name": name, "sende": threading.Lock()}

    def weg(self, verbindung):
        with self.schloss:
            self.leute.pop(verbindung, None)

    def namen(self):
        # Wer sich noch nicht vorgestellt hat, taucht nicht auf — sonst
        # blitzt beim Verbinden kurz ein Namensloser in der Liste auf.
        with self.schloss:
            return sorted({e["name"] for e in self.leute.values() if e["name"]})

    def rufen(self, nachricht, ausser=None):
        roh = ws_rahmen(json.dumps(nachricht, ensure_ascii=False).encode("utf-8"))
        with self.schloss:
            paare = list(self.leute.items())
        for verbindung, eintrag in paare:
            if verbindung is ausser:
                continue
            try:
                with eintrag["sende"]:
                    verbindung.sendall(roh)
            except OSError:
                self.weg(verbindung)


WS_RAEUME = {}
WS_RAEUME_SCHLOSS = threading.Lock()


def ws_raum(raum):
    with WS_RAEUME_SCHLOSS:
        if raum not in WS_RAEUME:
            WS_RAEUME[raum] = WsRaum()
        return WS_RAEUME[raum]


def ws_rahmen(nutzlast, opcode=1):
    kopf = bytes([0x80 | opcode])
    n = len(nutzlast)
    if n < 126:
        kopf += bytes([n])
    elif n < 65536:
        kopf += bytes([126]) + struct.pack(">H", n)
    else:
        kopf += bytes([127]) + struct.pack(">Q", n)
    return kopf + nutzlast


def _genau(verbindung, anzahl):
    stuecke = b""
    while len(stuecke) < anzahl:
        teil = verbindung.recv(anzahl - len(stuecke))
        if not teil:
            return None
        stuecke += teil
    return stuecke


def ws_lesen(verbindung):
    """Liefert (opcode, daten) oder None, wenn die Gegenseite weg ist."""
    kopf = _genau(verbindung, 2)
    if not kopf:
        return None
    opcode = kopf[0] & 0x0F
    maskiert = bool(kopf[1] & 0x80)
    laenge = kopf[1] & 0x7F
    if laenge == 126:
        teil = _genau(verbindung, 2)
        if not teil:
            return None
        laenge = struct.unpack(">H", teil)[0]
    elif laenge == 127:
        teil = _genau(verbindung, 8)
        if not teil:
            return None
        laenge = struct.unpack(">Q", teil)[0]
    if laenge > MAX_WS_NACHRICHT:
        return None
    maske = _genau(verbindung, 4) if maskiert else b""
    if maskiert and maske is None:
        return None
    daten = _genau(verbindung, laenge) if laenge else b""
    if daten is None:
        return None
    if maskiert:
        daten = bytes(b ^ maske[i % 4] for i, b in enumerate(daten))
    return opcode, daten


# ═══════════════════════════════════════════════════════════════════════
#  HTTP
# ═══════════════════════════════════════════════════════════════════════

ERLAUBTE_DATEIEN = {
    "": ("index.html", "text/html; charset=utf-8"),
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/Uebersicht.html": ("Uebersicht.html", "text/html; charset=utf-8"),
    "/README.md": ("README.md", "text/markdown; charset=utf-8"),
    "/START.md": ("START.md", "text/markdown; charset=utf-8"),
}


class Griff(BaseHTTPRequestHandler):
    server_version = "REDNOTEN"
    protocol_version = "HTTP/1.1"

    # ── Hilfen ──
    def _kopf_frei(self):
        # Damit die App auch von file:// oder GitHub Pages aus abgleichen kann.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, obj, code=200):
        roh = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(roh)))
        self.send_header("Cache-Control", "no-store")
        self._kopf_frei()
        self.end_headers()
        self.wfile.write(roh)

    def _fehler(self, code, text):
        self._json({"fehler": text}, code)

    def log_message(self, format, *args):
        pass   # Standardprotokoll ist zu geschwätzig; wir melden selbst.

    # ── Verben ──
    def do_OPTIONS(self):
        self.send_response(204)
        self._kopf_frei()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        pfad, _, frage = self.path.partition("?")

        if pfad.startswith("/ws/"):
            return self._websocket(pfad[4:])

        if pfad.startswith("/sync/"):
            raum = raum_saeubern(pfad[6:])
            if not raum:
                return self._fehler(400, "Raum-Code fehlt")
            bekannt = 0
            for teil in frage.split("&"):
                if teil.startswith("stand="):
                    bekannt = _zahl(teil[6:])
            stand, daten = self.server.raeume.holen(raum)
            if bekannt and bekannt == stand:
                return self._json({"stand": stand, "unveraendert": True})
            return self._json({"stand": stand, "daten": daten})

        if pfad == "/raeume":
            return self._json({"raeume": self.server.raeume.liste()})

        if pfad == "/hallo":
            return self._json({"dienst": "rednoten", "fassung": 1})

        return self._datei(pfad)

    def do_POST(self):
        pfad, _, _ = self.path.partition("?")
        if not pfad.startswith("/sync/"):
            return self._fehler(404, "Unbekannter Weg")
        raum = raum_saeubern(pfad[6:])
        if not raum:
            return self._fehler(400, "Raum-Code fehlt")

        laenge = _zahl(self.headers.get("Content-Length"))
        if laenge <= 0:
            return self._fehler(400, "Leerer Aufruf")
        if laenge > MAX_KOERPER:
            return self._fehler(413, "Zu viele Daten (Grenze: %d MB)" % (MAX_KOERPER // 1024 // 1024))
        roh = self.rfile.read(laenge)
        try:
            fremd = json.loads(roh.decode("utf-8"))
        except Exception:
            return self._fehler(400, "Kein gültiges JSON")
        if not isinstance(fremd, dict):
            return self._fehler(400, "Erwartet wird ein Objekt")

        absender = str(fremd.get("absender") or "")[:40]
        stand, daten, veraendert = self.server.raeume.zusammenfuehren(raum, fremd)
        if veraendert:
            ws_raum(raum).rufen({"typ": "aktualisiert", "stand": stand, "von": absender})
            print("  ↕ %s: zusammengeführt → Stand %d (%d Seiten)" % (raum, stand, len(daten.get("notes", []))))
        self._json({"stand": stand, "daten": daten})

    # ── Statische Dateien ──
    def _datei(self, pfad):
        eintrag = ERLAUBTE_DATEIEN.get(pfad)
        if not eintrag:
            return self._fehler(404, "Nicht gefunden")
        name, typ = eintrag
        voll = os.path.join(HIER, name)
        if not os.path.exists(voll):
            return self._fehler(404, "Datei fehlt: " + name)
        with open(voll, "rb") as f:
            roh = f.read()
        self.send_response(200)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(roh)))
        self.send_header("Cache-Control", "no-cache")
        self._kopf_frei()
        self.end_headers()
        self.wfile.write(roh)

    # ── WebSocket ──
    def _websocket(self, rest):
        raum = raum_saeubern(rest.partition("?")[0])
        if not raum:
            return self._fehler(400, "Raum-Code fehlt")
        schluessel = self.headers.get("Sec-WebSocket-Key")
        if (self.headers.get("Upgrade", "").lower() != "websocket") or not schluessel:
            return self._fehler(400, "Das ist keine WebSocket-Anfrage")

        antwort = base64.b64encode(
            hashlib.sha1((schluessel + WS_MAGIE).encode("utf-8")).digest()
        ).decode("ascii")
        self.wfile.write(
            (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                "Sec-WebSocket-Accept: %s\r\n\r\n" % antwort
            ).encode("ascii")
        )
        self.wfile.flush()

        verbindung = self.connection
        gruppe = ws_raum(raum)
        name = ""
        gruppe.dazu(verbindung, name)

        try:
            verbindung.settimeout(300)
            while True:
                paket = ws_lesen(verbindung)
                if paket is None:
                    break
                opcode, daten = paket
                if opcode == 0x8:            # Schließen
                    break
                if opcode == 0x9:            # Ping → Pong
                    verbindung.sendall(ws_rahmen(daten, 0xA))
                    continue
                if opcode != 0x1:
                    continue
                try:
                    nachricht = json.loads(daten.decode("utf-8"))
                except Exception:
                    continue
                typ = nachricht.get("typ")
                if typ == "hallo":
                    name = str(nachricht.get("name") or "Gast")[:24]
                    gruppe.dazu(verbindung, name)
                    gruppe.rufen({"typ": "anwesend", "leute": gruppe.namen()})
                elif typ == "puls":
                    verbindung.sendall(ws_rahmen(json.dumps({"typ": "puls"}).encode("utf-8")))
                elif typ == "tippt":
                    gruppe.rufen(
                        {"typ": "tippt", "name": name, "seite": str(nachricht.get("seite") or "")[:40]},
                        ausser=verbindung,
                    )
        except (OSError, socket.timeout):
            pass
        finally:
            gruppe.weg(verbindung)
            gruppe.rufen({"typ": "anwesend", "leute": gruppe.namen()})
            self.close_connection = True


class Dienst(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


# ═══════════════════════════════════════════════════════════════════════
#  Start
# ═══════════════════════════════════════════════════════════════════════

def eigene_adresse():
    """Die Adresse im eigenen Netz — damit das Handy sie erreichen kann."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))   # es wird nichts gesendet
        adresse = s.getsockname()[0]
        s.close()
        return adresse
    except OSError:
        return "127.0.0.1"


def main():
    zerleger = argparse.ArgumentParser(description="REDNOTEN — App und Abgleich in einem")
    zerleger.add_argument("--port", type=int, default=8080, help="Port (Standard 8080)")
    zerleger.add_argument("--host", default="0.0.0.0", help="Adresse (Standard: im ganzen Netz erreichbar)")
    zerleger.add_argument("--daten", default=os.path.join(HIER, "rednoten-daten"), help="Ordner für die Raum-Dateien")
    zerleger.add_argument("--kein-browser", action="store_true", help="Browser nicht automatisch öffnen")
    argumente = zerleger.parse_args()

    dienst = Dienst((argumente.host, argumente.port), Griff)
    dienst.raeume = Raeume(argumente.daten)

    lokal = "http://localhost:%d/" % argumente.port
    netz = "http://%s:%d/" % (eigene_adresse(), argumente.port)

    print("")
    print("  \033[1;31m🔴 REDNOTEN\033[0m läuft.")
    print("")
    print("  Auf diesem Gerät :  \033[4m%s\033[0m" % lokal)
    print("  Im selben WLAN   :  \033[4m%s\033[0m   ← am Handy öffnen" % netz)
    print("")
    print("  Daten            :  %s" % os.path.abspath(argumente.daten))
    print("  Abgleich         :  in der App  Strg+K → \"Abgleich einrichten\"")
    print("                      Serveradresse leer lassen, Raum-Code frei wählen.")
    print("")
    print("  Beenden mit Strg+C")
    print("")

    if not argumente.kein_browser:
        threading.Timer(0.7, lambda: webbrowser.open(lokal)).start()

    try:
        dienst.serve_forever()
    except KeyboardInterrupt:
        print("\n  Auf Wiedersehen. Deine Notizen liegen in %s\n" % os.path.abspath(argumente.daten))
    finally:
        dienst.server_close()


if __name__ == "__main__":
    if sys.version_info < (3, 7):
        print("Bitte Python 3.7 oder neuer benutzen.")
        sys.exit(1)
    main()
