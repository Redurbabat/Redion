# Redion – Aufräuminventar und Prüfschritte

**Stand:** 8. November 2026. Geprüfter GitHub-Ausgangsstand: `main` bei `371fcf7e50719793db5b58eec2d29ae7fe82bde4`. **Dies ist ein Vorschlags- und Kontrollindex, keine Freigabe zum Löschen.**

## Bestand, gezählt im Git-Baum

| Teil | Dateien (Git-Blobs) | Einordnung |
| --- | ---: | --- |
| Gesamtbestand | **1.723** | Kein Beleg, dass eine Datei davon entbehrlich ist |
| `src/` | 259 | TypeScript-/React-Quellen: **nicht archivieren** |
| `quell/` | 352 | gemeinsame Web-/generierte Dateien: **nicht archivieren** |
| `pruefungen/` | 605 | Verträge/Tests/Fixtures: **nicht nach Namen aussortieren** |
| `doku/` | 170 | davon 119 Markdown-Dateien, Prüfkandidaten nur nach Referenzsuche |
| `ios/` | 56 | native iPhone-Adapter und Regressionstests: **nicht archivieren** |
| `windows/` | 22 | Electron-Dateien und Tests: **nicht archivieren** |
| `.agents/` und `.claude/` | jeweils 12 | Agenten-/Skillsteuerung: **nur nach Eigentümerfreigabe** |

## Zur Kontrolle vorbereitete unabhängige Draft-PRs

Jeder PR basiert unmittelbar auf `main`. Die verschobenen Dateien behalten ihre **identischen Git-Blob-SHAs**. Die angegebene Anzahl ist nicht die Zahl der neu erzeugten Dateien, sondern der rein umbenannten Originale.

| PR | Thema | Anzahl | Pfad |
| --- | --- | ---: | --- |
| [#192](https://github.com/Redurbabat/Redion/pull/192) | historische Übergaben und Migrationen | 3 | `doku/mehr nicht nutzbar/` |
| [#193](https://github.com/Redurbabat/Redion/pull/193) | frühere Windows-Testberichte | 2 | derselbe Sammelordner |
| [#194](https://github.com/Redurbabat/Redion/pull/194) | Codemagic-Fehleranalysen | 2 | derselbe Sammelordner |
| [#195](https://github.com/Redurbabat/Redion/pull/195) | Capacitor-Pfad-/SPM-Buildberichte | 2 | derselbe Sammelordner |
| [#196](https://github.com/Redurbabat/Redion/pull/196) | iPhone-Viewport-/PDF-Querformatberichte | 2 | derselbe Sammelordner |
| **Summe** | **fünf voneinander unabhängige Archiv-PRs** | **11** | **kein Merge** |

Jeder Archiv-PR ergänzt sein eigenes Herkunfts-/Risiko-Protokoll. Die Änderungen in diesen PRs sind **nur Umbenennungen der Dokumente** und das zugehörige Prüfprotokoll. Ein gitbasierter SHA-Vergleich bestätigte die Inhaltstreue.

## Schutzliste – wurde bewusst NICHT verschoben

| Datei / Bereich | Warum behalten? |
| --- | --- |
| `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md`, `START-MIT-CLAUDE-CODE.md` | Aktive oder historisch referenzierte Arbeitsanweisungen. Eigentümer möchte **vor jeder Änderung gefragt werden** |
| `.agents/`, `.claude/` | Skill- und Agenten-Integrationen, auch wenn Dateinamen sich wiederholen |
| `doku/ARCHITEKTUR.md`, `AUFGABEN.md`, `ENTSCHEIDUNGEN.md`, `LUECKEN.md` | Architektur, Planung, Entscheidungen, offene Produktlücken |
| `doku/ALTE-PRUEFLAEUFE.md` | In `pruefungen/LIESMICH.md` direkt referenziert |
| `doku/AUFTRAG-01-ruhiges-band.md` | In mehreren `pruefungen/lauf/test*.mts` referenziert |
| `doku/AUFTRAG-STAND.md` | In Prüfläufen und `doku/ELEKTRO-STAND.md` referenziert |
| `doku/OBERFLAECHE-PC-UND-HANDY.md` | Historische Abschnitte, aber auch aktuelle Verweise aus UX-Skill und Hilfedokumentation |
| `quell/entwicklung/ui-reserve/` | Bewusst nicht produktive Originalgalerie, aber durch `test426` und Reserve-Bauablauf geschützt |
| `src/islands/probe.tsx` | Testinsel zur Validierung von `test579`, keine tote Produktionskomponente |
| `UR.md`, `PROBLEME.md` | Erzeugte Chronik-Dokumente mit eigener Quelle und Historie |
| `unbenutzt.mts`, `Redion-Live.bat` | Tatsächliche Entwicklungs- bzw. Windows-Startwerkzeuge |
| Persönliche Dokumente im Repository-Wurzelverzeichnis | Ohne Einzelfreigabe nicht verschieben oder veröffentlichen; in `.assetsignore` ausgeschlossen, Vorhandensein wird von `test270` geprüft |

Besonders wichtig: Die zufällig identischen Dateien `AGENTS.md` und `AI_START_HERE.md` werden **nicht** dedupliziert. Ebenso bleiben Swift-/iOS-Entitlements und alle anderen identischen Sicherheitsdateien unberührt.

## Warum keine Dateinamen-Heuristik genügt

- `backup` bezeichnet oft eine **wichtige Datenrettungsfunktion** statt eine alte Sicherung.
- `probe` kennzeichnet häufig eine **aktive Testkomponente**.
- `alt` kann ein **gewolltes Historienprotokoll** sein.
- `quell/` enthält generierte Webdateien. Entfernen würde Web, iPhone und Windows auseinandertreiben.
- Eine exakte GitHub-Textsuche nach Dateinamen ist **kein vollständiger Beweis** dafür, dass dynamische Referenzen und relative Markdown-Links fehlen.

## Abnahme- und Merge-Kriterien

1. Jede PR einzeln auf unerwartete Referenzen und relative Links überprüfen, insbesondere Dateien in `doku/`.
2. Verschobene Dateiinhalte per Git-Blob-SHA gegen `main` vergleichen; nur reine Renames zulassen.
3. GitHub-Actions-Checks und mindestens die betroffenen Dokument-/Linkverträge wirklich ausführen; aktuelle Läufe nicht durch historische Testberichte ersetzen.
4. Den Sammelordner vom Web-Deployment ausschliessen – er liegt im bereits ausgeklammerten `doku/`.
5. Erst nach Besitzerfreigabe mergen. Keine Zweige löschen, keine produktiven Dateien, Nutzerdaten oder App-IDs anrühren.

**Teststatus dieses Berichts:** Lesende GitHub-Baum- und Referenzprüfung. **Keine** neuen Windows-, WebKit-, Xcode-, iPhone-Geräte-, Build- oder Laufzeittests. `main` wurde nicht verändert.

## Noch offen zur Eigentümerentscheidung

Die früheren Arbeitszweige `feat/red-morph-skills-20261107` und `chore/mehr-nicht-nutzbar-review-20261107` existieren weiterhin. Der zweite enthält teilweise dieselbe Archivarbeit wie PR #192; **nicht löschen**, bevor der Besitzer entschieden hat, welchen Reviewpfad er behalten möchte. Der Skill-Branch enthält Änderungen an Projektanweisungen und wird **nicht ohne gesonderte Freigabe** in diesen Aufräumprozess aufgenommen.
