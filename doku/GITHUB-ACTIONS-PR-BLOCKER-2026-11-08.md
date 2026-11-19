# GitHub Actions: Fehlschläge ohne sichtbare Testschritte (8. November 2026)

**Status: zwei getrennte Fehlerbilder.** Die heutigen Läufe scheitern ohne dokumentierte Testschritte; **ihre unmittelbare Ursache ist unbekannt**. Ältere, tatsächlich ausgeführte Läufe zeigen dagegen **konkrete TypeScript- und Artefakt-Konsistenzfehler**. Kein grüner Teststatus, kein Anlass, Prüfungen abzuschalten.

## Aktueller Review-Stand

Der Eigentümer bündelt alle zuvor unabhängig geprüften Aufräum- und Windows-Typkorrekturen in **einem** [gemeinsamen Draft-PR #206](https://github.com/Redurbabat/Redion/pull/206) auf Branch `review/redion-live-gesamt-20261108`. Die früheren Einzel-PRs **#192–#205** werden geschlossen, **nicht gemergt**; ihre Verweise dienen nur noch der Herkunftsnachverfolgung. **Der CI-Ausführungsblocker und der aktuelle Einzeldatei-Abgleich sind weiterhin offen.** Windows-Live kann lokal nur auf eigene Verantwortung als ungeprüfter Entwicklungsstand gestartet werden; kein zusätzlicher UI-Funktionsumfang.

## Beobachtete Fakten

Der bestehende Workflow `.github/workflows/pruefen.yml` hat zwei definierte Jobs mit `runs-on: ubuntu-latest` und regulären Schritten beginnend mit `actions/checkout@v4` und `actions/setup-node@v4`. Der Workflow wurde **nicht geändert**.

| Auslösung | GitHub-Lauf | Quellcommit | Ergebnis |
| --- | --- | --- | --- |
| Push auf neu angelegten Prüfzweig vor jeder Änderung | [42429250883](https://github.com/Redurbabat/Redion/actions/runs/42429250883) | `371fcf7e5` (identisch mit `main`) | failure; beide Jobs ohne gelistete Schritte |
| Push auf neuen Layout-Archivzweig vor jeder Änderung | [42428743543](https://github.com/Redurbabat/Redion/actions/runs/42428743543) | `371fcf7e5` (identisch mit `main`) | failure; beide Jobs ohne gelistete Schritte |
| PR #198 mit neuem Testwerkzeug | [42429344392](https://github.com/Redurbabat/Redion/actions/runs/42429344392) | `1b7fab7ba` | failure; beide Jobs ohne gelistete Schritte |
| PR #197 nur mit Dokumentation | [42428884620](https://github.com/Redurbabat/Redion/actions/runs/42428884620) | `deb07d8a8` | failure; beide Jobs ohne gelistete Schritte |

Für die untersuchten Jobs lieferte die GitHub-Steps-Abfrage jeweils eine leere Liste. Der Job-Logs-Abruf bei PR #198 und PR #197 endete jeweils in GitHub/Azure-Blob-Antwort `BlobNotFound` (404). Diese **konkreten Läufe** liefern daher keine verwertbare Aussage über den Code. Ältere CI-Läufe mit tatsächlich ausgeführten Schritten liefern sehr wohl verwertbare Compiler- und Baufehler (siehe unten). Ob die **aktuellen** früh abgebrochenen Jobs ein GitHub-, Runner-, Berechtigungs- oder Abrechnungsproblem haben, ist nicht bestätigt.

## Neuer Befund aus erfolgreich abgerufenen CI-Protokollen (8. November 2026)

Die früheren GitHub-Läufe waren **nicht durchgehend** ohne Testschritte. Ein Lauf auf `main` vom **2. November 2026, 23:24 UTC** ([Workflow #41545187209](https://github.com/Redurbabat/Redion/actions/runs/41545187209), Commit `c81ff6af9ab65fed52e1962f9864add4385c13ef`) enthält vollständige Runner-Logs: Die Jobs starteten auf Ubuntu 24.04 / Node 22, installierten Pakete und liefen in echte Prüfungen.

| Job | Nachgewiesene Fehler am 2. November | Bedeutung |
| --- | --- | --- |
| „Quelltext und Logik“ | `npm run typecheck` / `tsc --noEmit` mit **63 TypeScript-Diagnosen** in **5 Windows-Dateien** (Exit-Code 2) | Reale typisierte Fehler; **nicht** durch das aktuelle Runner-Problem verursacht |
| „Schneller Lauf“ | Beim erneuten Erzeugen der Einzeldatei meldet die Kontrolle `redion-einzeldatei.html` als nicht mehr quellengetreu: **205 Einfügungen, 47 Löschungen** im Git-Diff (Exit-Code 1) | Ein echter Artefakt-/Quellstandkonflikt zu diesem historischen Commit |

**TypeScript-Verteilung im gelesenen Protokoll:** `windows/live.mts` 26 Diagnosen, `windows/live.test.mts` 15, `windows/local-source.test.mts` 15, `windows/version.test.mts` 6, `windows/web-files.mts` 1. Beispielcodes: `TS7006` (implizites `any`), `TS7031` (implizites `any` im Destructuring), `TS2722` (möglicherweise undefinierte Funktion), `TS2532` (möglicherweise `undefined`). Die genaue Gesamtauswertung umfasst 63 Compilerdiagnosen, nicht 63 fehlgeschlagene einzelne Tests.

**Git-Blob-Gegenprobe:** Alle fünf betroffenen `windows/*.mts`-Dateien, `tsconfig.json`, `redion-einzeldatei.html`, `index.html` und der Workflow `.github/workflows/pruefen.yml` haben auf dem heutigen `main`-Commit `371fcf7e50719793db5b58eec2d29ae7fe82bde4` **exakt dieselben Git-Blobs** wie auf `c81ff6af9ab65fed52e1962f9864add4385c13ef`. Damit sind die dokumentierten TypeScript-Fehlerstellen nicht zwischenzeitlich geändert worden. Das legt weiterhin bestehende Typecheck-Probleme nahe; ein aktueller vollständiger Typecheck ist **nicht ausgeführt** und darf nicht als beweisbar fehlgeschlagen dargestellt werden. Die damalige Einzeldatei-Abweichung muss nach Start der CI erneut anhand **aller** Quellabhängigkeiten überprüft werden; identische `index.html` und Einzeldatei allein beweisen keine aktuelle Abweichung.

Am selben **2. November** war außerdem ein **anderer Workflow** ([„Kapitel-12-Artefakte synchronisieren“ #41537713920](https://github.com/Redurbabat/Redion/actions/runs/41537713920)) **erfolgreich** und enthielt echte Schritte. Der zeitgleiche reguläre Prüfworkflow ([#41537721098](https://github.com/Redurbabat/Redion/actions/runs/41537721098)) führte ebenfalls Schritte aus, endete aber mit inhaltlichen Prüfproblemen. Andererseits scheiterte bereits am **31. Oktober** der Prüfworkflow [#41242858819](https://github.com/Redurbabat/Redion/actions/runs/41242858819) **ohne Schritte**, während später am 2. November wieder reguläre Ausführungen stattfanden. Der No-Step-Fehler ist daher **nicht** nachweislich erst seit einem bestimmten Datum permanent; die verfügbare Stichprobe deutet auf zeitweise unterschiedliche Fehlerarten hin.

### Getrennte Arbeitspakete, jeweils eigener PR

1. **Runner-/Ausführungsblocker zuerst:** GitHub-Joboberfläche/Systemmeldungen und Repository-Actions-Zugriff prüfen; ein nächster echter Lauf muss wieder `checkout`, `setup-node` und die übrigen Schritte protokollieren. Das ist weiterhin ohne bekannte technische Ursache. Keine Statusschönung.
2. **Windows-Typecheck-Fehler separat prüfen und freigeben:** Die fünf zuvor fehlerhaften Dateien wurden in **drei separaten Draft-PRs #203, #204 und #205** typisiert; die strengen Compilerregeln sind unverändert. Der isolierte gemeinsame TypeScript-Lauf für diese fünf korrigierten Dateien war lokal grün, ebenso die drei Live-Reload-Tests. Erneuter Repository-Typecheck unter der geforderten Projekt-Node-/TypeScript-Version und Windows-Echtlauf fehlen weiter. Kein Edit dieser Dateien in diesem reinen Diagnose-PR.
3. **Einzeldatei-Bau separat untersuchen:** Nach Behebung der Testumgebung `node bauen.mts` auf dem dann aktuellen Stand ausführen und `redion-einzeldatei.html` gegen den **aktuellen** Bau vergleichen. Persönliche Daten/Backups nicht anrühren; nicht blind ein 10-MB-Artefakt aus einem historischen Lauf übernehmen.

### Stand der Typkorrekturen (8. November 2026, separate Draft-PRs)

| PR | Geänderte Windows-Dateien | Historisch protokollierte Diagnosen | Isolierte Typprüfung |
| --- | --- | ---: | --- |
| [#203](https://github.com/Redurbabat/Redion/pull/203) | `version.test.mts`, `web-files.mts` | 7 | 0 verbleibende Diagnosen |
| [#204](https://github.com/Redurbabat/Redion/pull/204) | `local-source.test.mts` | 15 | 0 verbleibende Diagnosen |
| [#205](https://github.com/Redurbabat/Redion/pull/205) | `live.mts`, `live.test.mts` | 41 | 0 verbleibende Diagnosen |
| **Summe** | **fünf Dateien in drei getrennten Draft-PRs** | **63** | **alle fünf gemeinsam isoliert typgeprüft** |

Für die gemeinsame Gegenprüfung wurden die Fassungen aus #203–#205 **lokal zusammengeführt, ohne GitHub-`main` oder PR-Basen zu ändern**. `tsc --noEmit` mit den strengen Projekt-Compileroptionen unter dem verfügbaren **TypeScript 5.8.3** und `@types/node` meldete **0 Diagnosen (Exit 0)**. Die 3 vorhandenen `windows/live.test.mts`-Node-Tests bestanden mit Node 22.16 und `--experimental-strip-types`; dabei wurde die `live-reload.cts` per Git-Blob-SHA als unverändert bestätigt. GitHub-Blobs der fünf korrigierten Dateien stimmten mit den lokal geprüften Fassungen überein. **Dies ersetzt weder das vollständige `npm run typecheck` mit Projekt-TypeScript 5.9.3, noch den echten Windows-/Electron-Test.** Kein PR ist gemergt. Die historische Einzeldatei-Abweichung ist noch offen.

## Was das nicht beweist

- Weder `npm install` noch `npm run typecheck` wurden in diesen Läufen nachweislich ausgeführt.
- Kein Regressions- oder Buildtest darf deshalb als bestanden bezeichnet werden.
- GitHub Actions `failure` ist real. Die Ursache bleibt unbewiesen, solange es keine Runner-/Systemmeldung gibt.
- Es wurden weder ein Actions-Workflow, eine Branch-Protection-Regel noch die App verändert, um einen grünen Status zu erzwingen.

## Nachprüfungen für den Repository-Eigentümer

1. Einen der verlinkten fehlgeschlagenen Läufe in **Actions** öffnen und prüfen, ob oberhalb der Jobs eine GitHub-Systemmeldung zur Runner-Zuweisung, Workflow-Freigabe oder Abrechnung erscheint.
2. Repository **Settings → Actions → General** prüfen: Actions zugelassen, Workflows freigegeben, Organisations-/Repository-Richtlinien und GitHub-hosted Runner. **Keine Schutzregeln ausschalten**, bevor Ursache und Auswirkungen klar sind.
3. Falls relevant: GitHub-Billing/Minuten, eventuelle Zahlungs- oder Budgetbegrenzung sowie die Verfügbarkeit der `ubuntu-latest`-Runner kontrollieren. Kein unbelegter Zahlungsschritt wird verlangt.
4. Mit einem **unveränderten** Commit erneut prüfen, ob `actions/checkout@v4` als erster Schritt überhaupt startet. Erst dann anhand konkreter Logs Ursachen im Workflow oder Code untersuchen.
5. Nach Wiederherstellung einen regulären PR-Lauf mit `npm run typecheck` und den vorhandenen Quelltext-/Sicherungstests durchführen; die hier konkret belegten Windows-TypeScript- und Artefakt-Abweichungen in **separaten** Themen-PRs auflösen. Erfolgreiche Node-Fixture-Tests in PR #198 ersetzen ihn nicht.

## Verknüpfte, nicht gemergte PRs

Archivierung: [#192](https://github.com/Redurbabat/Redion/pull/192), [#193](https://github.com/Redurbabat/Redion/pull/193), [#194](https://github.com/Redurbabat/Redion/pull/194), [#195](https://github.com/Redurbabat/Redion/pull/195), [#196](https://github.com/Redurbabat/Redion/pull/196).

Aufräuminventar: [#197](https://github.com/Redurbabat/Redion/pull/197). Lesender Archiv-Link-Prüfer: [#198](https://github.com/Redurbabat/Redion/pull/198).

**Alle PRs bleiben als Entwürfe offen. Kein Merge ohne nachweisbaren Testlauf und Eigentümerfreigabe.**

## Schutzgrenzen

Nur neue Diagnose-Dokumentation. `main`, `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md`, `.github/workflows/`, `src/`, `quell/`, `ios/`, `windows/`, App-IDs, gespeicherte Daten und Build-Konfigurationen bleiben unverändert.
