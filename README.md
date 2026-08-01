# ✒️ Tintenfass — deine Notizen-App

**[➜ App direkt öffnen: `index.html`](index.html)** — einfach die Datei im Browser öffnen, fertig.
Keine Installation, kein Server, keine Anmeldung. Alle Daten bleiben lokal im Browser (`localStorage`).

> Sobald GitHub Pages für dieses Repo aktiviert ist (Settings → Pages → Branch wählen),
> läuft die App auch unter deiner `github.io`-Adresse.

## Was die App kann

Tintenfass vereint die besten Ideen der 20 Notiz-Apps aus diesem Repo in **einer einzigen HTML-Datei** (TiddlyWiki-Prinzip):

| Funktion | Vorbild |
|---|---|
| **Markdown** mit Live-Vorschau (Schreiben / Beides / Lesen) | MarkText, Zettlr, HedgeDoc |
| **Wiki-Links** `[[Titel]]` mit Autovervollständigung beim Tippen von `[[` | Foam, SilverBullet |
| **Rückverweise (Backlinks)** unter jeder Notiz | Logseq, Trilium, Obsidian-Stil |
| **🕸 Graph-Ansicht** aller Verknüpfungen (klick- und ziehbar) | Logseq |
| **📅 Tagesnotiz** — Journal per Knopfdruck | Logseq Journals |
| **#Schlagwörter** direkt im Text, klickbar, mit Tag-Wolke | Memos, Bear |
| **📓 Notizbücher** zum Ordnen | Joplin |
| **Aufgaben** `- [ ]` — in der Lesen-Ansicht abhakbar | Joplin, Notesnook |
| **Befehlspalette** Strg+K — Suche + alle Befehle | Notion, AFFiNE |
| **Volltextsuche**, Anpinnen, Archiv, Papierkorb | Standard Notes |
| **Backup**: JSON-Export/-Import, Markdown-Export je Notiz | Standard Notes, Joplin |
| **Hell-/Dunkelmodus**, folgt anfangs dem System | alle |
| Komplett **offline**, eine Datei, ~50 kB | TiddlyWiki |

## Tastenkürzel

| Kürzel | Wirkung |
|---|---|
| `Strg+K` | Befehlspalette |
| `Strg+Alt+N` | Neue Notiz |
| `Strg+E` | Schreiben ⇄ Lesen |
| `Strg+B` / `Strg+I` | fett / kursiv |
| `Esc` | Fenster schließen |

## Daten sichern

Die Notizen liegen im `localStorage` **dieses** Browsers. Mit dem ⬇-Knopf unten links lädst du
jederzeit ein JSON-Backup herunter — und spielst es mit ⬆ wieder ein, auch auf einem anderen Gerät.
Der Import fügt hinzu und überschreibt nichts.

---

## 📚 Referenzsammlung: 20 quelloffene Notiz-Apps

Der Quellcode der Vorbilder liegt flach geklont (ohne Git-Historie) unter [`PROJECTS/`](PROJECTS/) —
Übersicht auch als [Uebersicht.html](Uebersicht.html).

| # | Projekt | Beschreibung | Lizenz | GitHub |
|---|--|--|--|--|
| 1 | **AppFlowy-IO/AppFlowy** | Notion-Alternative, quelloffen & lokal (Rust/Flutter) | siehe LICENSE | https://github.com/AppFlowy-IO/AppFlowy |
| 2 | **toeverything/AFFiNE** | Notion + Miro Alternative, Blöcke & Whiteboard | MIT | https://github.com/toeverything/AFFiNE |
| 3 | **laurent22/joplin** | Notiz- & To-do-App mit Verschlüsselung und Sync | siehe LICENSE | https://github.com/laurent22/joplin |
| 4 | **logseq/logseq** | Outliner & Wissensdatenbank (lokal, Markdown/Org) | siehe LICENSE.md | https://github.com/logseq/logseq |
| 5 | **siyuan-note/siyuan** | Notion-artiges PKM, lokal-first (Block-Editor) | siehe LICENSE | https://github.com/siyuan-note/siyuan |
| 6 | **usememos/memos** | Leichte, selbst-gehostete Notiz-App (Markdown) | siehe LICENSE | https://github.com/usememos/memos |
| 7 | **outline/outline** | Team-Wiki / Wissensdatenbank | Business Source License 1.1 | https://github.com/outline/outline |
| 8 | **streetwriters/notesnook** | Ende-zu-Ende verschlüsselte Notiz-App | GPL-3.0-or-later | https://github.com/streetwriters/notesnook |
| 9 | **marktext/marktext** | Schöner Markdown-Editor (WYSIWYG) | siehe LICENSE | https://github.com/marktext/marktext |
| 10 | **standardnotes/app** | Verschlüsselte Notizen, plattformübergreifend | siehe LICENSE | https://github.com/standardnotes/app |
| 11 | **zadam/trilium** | Hierarchische Notizen / persönliches Wiki | AGPL-3.0-only | https://github.com/zadam/trilium |
| 12 | **codex-team/editor.js** | Block-Editor im Notion-Stil (JS) | Apache-2.0 | https://github.com/codex-team/editor.js |
| 13 | **nhn/tui.editor** | Markdown-WYSIWYG-Editor (Toast UI) | siehe LICENSE | https://github.com/nhn/tui.editor |
| 14 | **foambubble/foam** | Vernetztes Notizsystem in VS Code (PKM) | MIT | https://github.com/foambubble/foam |
| 15 | **Zettlr/Zettlr** | Markdown-Editor für Schreiben & Wissenschaft | GPL-3.0 | https://github.com/Zettlr/Zettlr |
| 16 | **hedgedoc/hedgedoc** | Kollaborative Markdown-Notizen (Echtzeit) | siehe LICENSE | https://github.com/hedgedoc/hedgedoc |
| 17 | **Jermolene/TiddlyWiki5** | Persönliches Wiki in einer einzigen Datei | BSD | https://github.com/Jermolene/TiddlyWiki5 |
| 18 | **anyproto/anytype-ts** | Anytype - lokal-first Notion-Alternative | SEE LICENSE IN LICENSE.md | https://github.com/anyproto/anytype-ts |
| 19 | **blinko-space/blinko** | Moderne selbst-gehostete Notiz-App | siehe LICENSE | https://github.com/blinko-space/blinko |
| 20 | **silverbulletmd/silverbullet** | Lokale, erweiterbare Markdown-Notiz-App (PKM) | siehe LICENSE.md | https://github.com/silverbulletmd/silverbullet |
