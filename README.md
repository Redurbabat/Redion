# 🔴 REDNOTEN — deine eigene Notizen-App

**[➜ App öffnen: `index.html`](index.html)** — Datei im Browser öffnen, fertig.
Keine Installation, kein Server, keine Anmeldung, keine Abhängigkeiten. Eine einzige HTML-Datei,
komplett eigener Code. Alle Daten bleiben lokal in deinem Browser.

**▶️ Zum Starten per Doppelklick:** siehe **[START.md](START.md)** — je eine Startdatei für
Windows (`start-windows.bat`), Mac (`start-mac.command`) und Linux (`start-linux.sh`).

REDNOTEN entstand aus der Analyse von **20 quelloffenen Notiz-Apps** (Quellcode unter
[`PROJECTS/`](PROJECTS/)): Aus jeder wurden die besten Mechaniken studiert und
abhängigkeitsfrei neu in einer Datei umgesetzt.

**Notion-Stil:** heller, aufgeräumter Look mit **Seitenbaum** (verschachtelte Unterseiten),
**Emoji-Symbol pro Seite**, großem Seitentitel und Breadcrumb-Pfad — dazu die rote
REDNOTEN-Identität als Akzent. Hell- und Dunkelmodus.

**WYSIWYG-Editor wie Notion:** Du schreibst direkt formatiert — `# ` wird sofort zur
Überschrift, `- ` zur Liste, `[] ` zur abhakbaren Aufgabe, `**text**` zu **fett**. Das
Slash-Menü (`/`) fügt Blöcke ein. Kein Markdown-Rohtext sichtbar. (Wer lieber Markdown
tippt, schaltet oben auf „Markdown" um — dasselbe Dokument, roh.)

**Blöcke bewegen:** Beim Zeigen auf einen Block erscheint links der Griff — ziehen ordnet um,
Klick öffnet das Blockmenü (nach oben/unten, duplizieren, löschen), `＋` fügt einen Block ein.

**Cover & Symbole:** Jede Seite bekommt ein Emoji-Symbol und ein Cover (12 Farbverläufe).

**🗂 Datenbanken:** Jede Seite kann eine Datenbank sein — mit **Tabelle**, **Board (Kanban)**
und **Galerie**. Eigenschaften: Text, Auswahl, Datum, Zahl, Kontrollkästchen. Karten lassen
sich im Board per Drag-and-Drop zwischen Spalten ziehen, Spalten sortieren, Einträge filtern.
Anlegen über `/` → „Datenbank" oder die Befehlspalette.

**Darstellung:** Schriftart (Standard / Serif / Monospace) und volle Breite umschaltbar.
**Favoriten** liegen oben in der Seitenleiste.

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

## 📚 Referenz-Quellcode: 20 quelloffene Notiz-Apps

Der vollständige Quellcode der 20 Vorbild-Projekte liegt unter [`PROJECTS/`](PROJECTS/) —
zum Nachschlagen, Weiterverwenden und als Studienmaterial. Übersicht auch als
[Uebersicht.html](Uebersicht.html).

| # | Projekt | Beschreibung | Lizenz | Ordner |
|---|--|--|--|--|
| 1 | **AppFlowy-IO/AppFlowy** | Notion-Alternative, quelloffen & lokal (Rust/Flutter) | siehe LICENSE | `PROJECTS/AppFlowy-IO_AppFlowy` |
| 2 | **toeverything/AFFiNE** | Notion + Miro Alternative, Blöcke & Whiteboard | MIT | `PROJECTS/toeverything_AFFiNE` |
| 3 | **laurent22/joplin** | Notiz- & To-do-App mit Verschlüsselung und Sync | siehe LICENSE | `PROJECTS/laurent22_joplin` |
| 4 | **logseq/logseq** | Outliner & Wissensdatenbank (lokal, Markdown/Org) | siehe LICENSE.md | `PROJECTS/logseq_logseq` |
| 5 | **siyuan-note/siyuan** | Notion-artiges PKM, lokal-first (Block-Editor) | siehe LICENSE | `PROJECTS/siyuan-note_siyuan` |
| 6 | **usememos/memos** | Leichte, selbst-gehostete Notiz-App (Markdown) | siehe LICENSE | `PROJECTS/usememos_memos` |
| 7 | **outline/outline** | Team-Wiki / Wissensdatenbank | Business Source License 1.1 | `PROJECTS/outline_outline` |
| 8 | **streetwriters/notesnook** | Ende-zu-Ende verschlüsselte Notiz-App | GPL-3.0-or-later | `PROJECTS/streetwriters_notesnook` |
| 9 | **marktext/marktext** | Schöner Markdown-Editor (WYSIWYG) | siehe LICENSE | `PROJECTS/marktext_marktext` |
| 10 | **standardnotes/app** | Verschlüsselte Notizen, plattformübergreifend | siehe LICENSE | `PROJECTS/standardnotes_app` |
| 11 | **zadam/trilium** | Hierarchische Notizen / persönliches Wiki | AGPL-3.0-only | `PROJECTS/zadam_trilium` |
| 12 | **codex-team/editor.js** | Block-Editor im Notion-Stil (JS) | Apache-2.0 | `PROJECTS/codex-team_editor.js` |
| 13 | **nhn/tui.editor** | Markdown-WYSIWYG-Editor (Toast UI) | siehe LICENSE | `PROJECTS/nhn_tui.editor` |
| 14 | **foambubble/foam** | Vernetztes Notizsystem in VS Code (PKM) | MIT | `PROJECTS/foambubble_foam` |
| 15 | **Zettlr/Zettlr** | Markdown-Editor für Schreiben & Wissenschaft | GPL-3.0 | `PROJECTS/Zettlr_Zettlr` |
| 16 | **hedgedoc/hedgedoc** | Kollaborative Markdown-Notizen (Echtzeit) | siehe LICENSE | `PROJECTS/hedgedoc_hedgedoc` |
| 17 | **Jermolene/TiddlyWiki5** | Persönliches Wiki in einer einzigen Datei | BSD | `PROJECTS/Jermolene_TiddlyWiki5` |
| 18 | **anyproto/anytype-ts** | Anytype - lokal-first Notion-Alternative | siehe LICENSE.md | `PROJECTS/anyproto_anytype-ts` |
| 19 | **blinko-space/blinko** | Moderne selbst-gehostete Notiz-App | siehe LICENSE | `PROJECTS/blinko-space_blinko` |
| 20 | **silverbulletmd/silverbullet** | Lokale, erweiterbare Markdown-Notiz-App (PKM) | siehe LICENSE.md | `PROJECTS/silverbulletmd_silverbullet` |
