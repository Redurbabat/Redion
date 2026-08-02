# ▶️ REDNOTEN starten

## 🚀 Ein Befehl fürs Terminal (nichts vorher herunterladen)

Der Befehl lädt REDNOTEN in den Ordner `REDNOTEN` in deinem Benutzerordner, startet den
Server und öffnet den Browser. Zum Beenden im Terminal `Strg+C` drücken.

**🪟 Windows — PowerShell** (Startmenü → „PowerShell" → einfügen → Enter):

```powershell
$d="$HOME\REDNOTEN"; $u="https://raw.githubusercontent.com/Redurbabat/Notizen-/refs/heads/claude/github-repos-notes-app-ywaeaj"; ni $d -ItemType Directory -Force | Out-Null; irm "$u/index.html" -OutFile "$d\index.html"; irm "$u/server.py" -OutFile "$d\server.py"; cd $d; python server.py
```

**🪟 Windows — Eingabeaufforderung (cmd):**

```bat
mkdir "%USERPROFILE%\REDNOTEN" 2>nul & cd /d "%USERPROFILE%\REDNOTEN" & curl -LO https://raw.githubusercontent.com/Redurbabat/Notizen-/refs/heads/claude/github-repos-notes-app-ywaeaj/index.html & curl -LO https://raw.githubusercontent.com/Redurbabat/Notizen-/refs/heads/claude/github-repos-notes-app-ywaeaj/server.py & python server.py
```

**🍎 Mac / 🐧 Linux — Terminal:**

```bash
mkdir -p ~/REDNOTEN && cd ~/REDNOTEN && u=https://raw.githubusercontent.com/Redurbabat/Notizen-/refs/heads/claude/github-repos-notes-app-ywaeaj && curl -LO $u/index.html && curl -LO $u/server.py && python3 server.py
```

> Beim nächsten Mal reicht `cd ~/REDNOTEN && python3 server.py` (Windows: `cd "$HOME\REDNOTEN"; python server.py`).
>
> Ist Port 8080 belegt: `python3 server.py --port 8081`.
>
> Kein Python? Dann `index.html` einfach doppelklicken — die App läuft auch so,
> nur ohne Abgleich zwischen Geräten.

## ⇅ Handy, Laptop und Tablet auf denselben Stand bringen

`server.py` ist nicht nur ein Dateiserver — er gleicht auch ab. Alles kostenlos, ohne
Konto, ohne Fremdanbieter: Die Notizen liegen auf **deinem** Rechner im Ordner
`rednoten-daten`.

1. Auf dem Rechner starten (siehe oben). Er zeigt beim Start zwei Adressen an —
   die zweite ist die für dein WLAN, z. B. `http://192.168.1.20:8080/`.
2. In der App `Strg+K` → **„Abgleich einrichten"**.
3. Einen **Raum-Code** frei wählen (z. B. `meine-notizen-2026`) und einen Namen eintragen.
   Die Serveradresse kann leer bleiben. Auf **Einschalten & abgleichen** tippen.
4. Am Handy im selben WLAN die WLAN-Adresse im Browser öffnen und **denselben Raum-Code**
   eintragen. Fertig — beide Geräte sehen dieselben Seiten.

Der Raum-Code ist zugleich das Passwort: Wähle einen, den niemand errät.
Änderungen erscheinen in unter einer Sekunde, und oben rechts steht, wer sonst noch da ist.

> **Wichtig:** Der Server ist für dein eigenes Netz gedacht, nicht fürs offene Internet.
> Wenn du den **Tresor** benutzt: Auf dem Abgleich-Server liegen die Seiten
> **unverschlüsselt** — die App weist im Einrichten-Fenster darauf hin.

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
schließen. Der Abgleich zwischen Geräten ist dabei schon mit an Bord (siehe oben).

> **Mac-Hinweis:** Beim ersten Mal fragt macOS eventuell nach Erlaubnis. Falls Doppelklick nicht geht:
> Rechtsklick auf `start-mac.command` → **Öffnen** → im Dialog nochmal **Öffnen**.
>
> **Windows-Hinweis:** Falls „Windows hat Ihren PC geschützt" erscheint: **Weitere Informationen → Trotzdem ausführen**. Die Datei ist harmlos (startet nur einen lokalen Server).

## Ohne Server (nur schnell ausprobieren)

Einfach die Datei **`index.html`** doppelklicken — sie öffnet sich im Browser und läuft sofort.
(In manchen Browsern wie Safari werden Notizen so aber nicht dauerhaft gespeichert — dann nimm den
Doppelklick-Weg oben. Der Abgleich zwischen Geräten braucht ebenfalls den Server.)

## Ganz ohne Download (online)

Repo-**Einstellungen → Pages** öffnen, als Quelle den Branch `claude/github-repos-notes-app-ywaeaj`
wählen, speichern. Nach ~1 Minute ist REDNOTEN unter
`https://redurbabat.github.io/Notizen-/` erreichbar — auch auf dem Handy.

---

**Voraussetzung für die Start-Dateien:** Python ist installiert (auf Mac & Linux ist es das immer,
auf Windows ggf. einmalig von [python.org](https://python.org) installieren). Ohne Python funktioniert
der „Ohne Server"-Weg trotzdem.
