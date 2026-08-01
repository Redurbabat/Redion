# ✒️ Tintenfass — deine eigene Notizen-App

**[➜ App öffnen: `index.html`](index.html)** — Datei im Browser öffnen, fertig.
Keine Installation, kein Server, keine Anmeldung, keine Abhängigkeiten. Eine einzige HTML-Datei,
komplett eigener Code. Alle Daten bleiben lokal in deinem Browser.

> Tipp: Aktiviere GitHub Pages (Settings → Pages → Branch wählen), dann läuft die App
> direkt unter deiner `github.io`-Adresse — auch auf dem Handy.

## Funktionen

**Schreiben**
- Markdown-Editor mit Live-Vorschau: Schreiben / Beides (geteilt, synchron scrollend) / Lesen
- Slash-Menü: `/` am Zeilenanfang öffnet Blöcke (Überschrift, Aufgabe, Tabelle, Code, Datum, Vorlage …)
- Formatier-Leiste und Kürzel (`Strg+B`, `Strg+I`), Listen führen sich beim Enter selbst fort
- Fokusmodus und Schreibmaschinenmodus für ablenkungsfreies Schreiben
- Vorlagen: Notizen mit `#vorlage` erscheinen im Slash-Menü und in der Palette

**Vernetzen**
- Wiki-Links `[[Titel]]` mit Autovervollständigung beim Tippen
- Rückverweise (Backlinks) unter jeder Notiz
- Notiz-Einbettung: `![[Titel]]` zeigt eine Notiz in einer anderen an
- 🕸 Graph-Ansicht des gesamten Wissensnetzes — klickbar, ziehbar

**Organisieren**
- 📓 Notizbücher, #Schlagwörter mit Tag-Wolke, Anpinnen, Archiv, Papierkorb
- 📅 Tagesnotiz als Journal, ⚡ Schnellerfassung direkt über der Liste
- ☑ Aufgaben-Übersicht: alle offenen `- [ ]` aus allen Notizen an einem Ort, dort abhakbar
- Volltextsuche mit Operatoren: `tag:projekt`, `nb:Wissen`, `ist:offen`, `ist:gepinnt`

**Sichern & Besitzen**
- Versionshistorie je Notiz — alte Stände ansehen und wiederherstellen
- Optionale Verschlüsselung des gesamten Speichers (AES-256-GCM, Passwort nur bei dir)
- JSON-Backup/-Import, Markdown-Export je Notiz
- „Als App exportieren": lädt eine eigenständige HTML-Datei mit all deinen Notizen darin herunter —
  deine komplette App inklusive Daten als eine Datei zum Mitnehmen

**Präsentieren**
- 🎞 Präsentationsmodus: `---` trennt Folien, Pfeiltasten blättern

**Bedienung**
- Befehlspalette `Strg+K` — Suche und sämtliche Befehle an einem Ort
- Hell-/Dunkelmodus (folgt anfangs dem System), voll mobiltauglich, druckbar, offline

## Tastenkürzel

| Kürzel | Wirkung |
|---|---|
| `Strg+K` | Befehlspalette |
| `Strg+Alt+N` | Neue Notiz |
| `Strg+E` | Schreiben ⇄ Lesen |
| `Strg+B` / `Strg+I` | fett / kursiv |
| `Strg+Umschalt+J` | Fokusmodus |
| `Strg+Umschalt+G` | Schreibmaschinenmodus |
| `/` am Zeilenanfang | Slash-Menü |
| `[[` | Wiki-Link mit Vorschlägen |
| `Esc` | Fenster/Modus schließen |

## Deine Daten

Alles liegt im `localStorage` dieses Browsers — nichts verlässt dein Gerät.
Sichern: ⬇ JSON-Backup (jederzeit wieder einspielbar, auch auf anderen Geräten) oder
„Als App exportieren" für eine komplette Kopie von App + Notizen in einer Datei.
Wenn du die Verschlüsselung aktivierst: Das Passwort wird nirgends gespeichert —
ohne Passwort gibt es keinen Zugriff, also gut merken.

---

Der gesamte Code in `index.html` ist eigenständig und gehört dir.
