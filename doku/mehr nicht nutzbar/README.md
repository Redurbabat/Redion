# Mehr nicht nutzbar — zur Kontrolle

Stand: 7. November 2026. **Prüfarchiv, kein Löschauftrag.**

Hier sind ältere Arbeits- und Übergabedokumente aus Redion gesammelt. Die Originalinhalte und Git-Blobs wurden unverändert verschoben; ihre frühere Position steht unten. Diese Dokumente sind keine laufzeitrelevanten App-Komponenten.

## Verschobene Dateien

| Vorher | Jetzt | Begründung | Abhängigkeiten |
| --- | --- | --- | --- |
| `doku/CODEX-UEBERGABE-ZEICHENSTUDIO.md` | `CODEX-UEBERGABE-ZEICHENSTUDIO.md` | Historische Übergabe vom September 2026 mit überholtem Arbeitszweig/Arbeitsauftrag | Im GitHub-Standardbranch keine exakte Dateinamensreferenz gefunden |
| `doku/INTEGRATION-2026-10-21.md` | `INTEGRATION-2026-10-21.md` | Einmaliger Integrationsbericht über bereits durchgeführte Commits | Im GitHub-Standardbranch keine exakte Dateinamensreferenz gefunden |
| `doku/BUENDEL-11-BIS-24.md` | `BUENDEL-11-BIS-24.md` | Historische TypeScript-Migrations-/Commitprotokolle | Im GitHub-Standardbranch keine exakte Dateinamensreferenz gefunden |

**Wichtig:** Eine Namenssuche beweist nicht, dass jede dynamische Referenz ausgeschlossen ist. Deshalb ist dies ein Review-Branch, kein freigegebener produktiver Stand. Builds und Browser-/Gerätetests sind **NICHT GETESTET**. Es wurden keine produktiven TypeScript-/JavaScript-/CSS-Dateien geändert.

## Noch NICHT verschoben: zuerst klären

- `doku/ALTE-PRUEFLAEUFE.md`: historische Tests, aber direkt in `pruefungen/LIESMICH.md` referenziert und als Wissensspeicher erhalten.
- `doku/AUFTRAG-01-ruhiges-band.md`: vergangener Auftrag, aber in mehreren Prüfläufen referenziert.
- `doku/AUFTRAG-STAND.md`: historische Fortschrittstabelle, in Prüfläufen und `doku/ELEKTRO-STAND.md` referenziert.
- `doku/OBERFLAECHE-PC-UND-HANDY.md`: enthält alte Abschnitte, aber auch aktuellere Dokumentation und Skill-Verweise.
- `quell/entwicklung/ui-reserve/`: absichtlich nicht produktive UI-Reserve, aber Teil des dokumentierten Entwicklungs- und Testsystems.
- `src/islands/probe.tsx`: ausdrücklich nur Test-Komponente, aber für `test579` notwendig.
- `Schul Inhalt` und die persönliche PDF in der Projektwurzel: aus Sicherheits-/Testgründen nicht angerührt; beide sind bewusst in `.assetsignore` ausgeschlossen.
- `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md`, `.claude/`, `.agents/`, `START-MIT-CLAUDE-CODE.md` und ähnliche Projektanweisungen: **nur nach ausdrücklicher Freigabe des Eigentümers** ändern oder verschieben.

## Prüfung und Wiederherstellung

1. Inhalte hier in GitHub kontrollieren.
2. Vor einer endgültigen Löschung oder einem Merge einzeln entscheiden.
3. Jede Datei ist über den Git-Verlauf und den alten Branch wiederherstellbar.
4. Für weitergehendes Aufräumen zuerst genaue Referenzen, Build-Wirkungen, Tests und Herkunft prüfen.

Die bestehende Redion-Architektur und die iPhone-/Windows-/Web-Produktdateien bleiben unverändert.
