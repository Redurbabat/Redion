# ▶️ REDNOTEN starten

## Am einfachsten: Doppelklick

Lade das Repo als ZIP herunter (GitHub → grüner Button **Code → Download ZIP**) und entpacke es.
Dann die zu deinem System passende Datei **doppelklicken**:

| System | Datei |
|---|---|
| 🪟 **Windows** | `start-windows.bat` |
| 🍎 **Mac** | `start-mac.command` |
| 🐧 **Linux** | `start-linux.sh` |

Es öffnet sich ein kleines schwarzes Fenster (der lokale Server) **und automatisch dein Browser**
mit REDNOTEN. Das schwarze Fenster einfach offen lassen, solange du die App nutzt — zum Beenden
schließen.

> **Mac-Hinweis:** Beim ersten Mal fragt macOS eventuell nach Erlaubnis. Falls Doppelklick nicht geht:
> Rechtsklick auf `start-mac.command` → **Öffnen** → im Dialog nochmal **Öffnen**.
>
> **Windows-Hinweis:** Falls „Windows hat Ihren PC geschützt" erscheint: **Weitere Informationen → Trotzdem ausführen**. Die Datei ist harmlos (startet nur einen lokalen Server).

## Ohne Server (nur schnell ausprobieren)

Einfach die Datei **`index.html`** doppelklicken — sie öffnet sich im Browser und läuft sofort.
(In manchen Browsern wie Safari werden Notizen so aber nicht dauerhaft gespeichert — dann nimm den
Doppelklick-Weg oben.)

## Ganz ohne Download (online)

Repo-**Einstellungen → Pages** öffnen, als Quelle den Branch `claude/github-repos-notes-app-ywaeaj`
wählen, speichern. Nach ~1 Minute ist REDNOTEN unter
`https://redurbabat.github.io/Notizen-/` erreichbar — auch auf dem Handy.

---

**Voraussetzung für die Start-Dateien:** Python ist installiert (auf Mac & Linux ist es das immer,
auf Windows ggf. einmalig von [python.org](https://python.org) installieren). Ohne Python funktioniert
der „Ohne Server"-Weg trotzdem.
