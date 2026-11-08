# GitHub Actions: Fehlschläge ohne sichtbare Testschritte (8. November 2026)

**Status: ungeklärt.** Dieses Dokument diagnostiziert die CI-Infrastruktur anhand von GitHub-Metadaten. Es ist **kein** Nachweis eines Fehlers im Redion-Anwendungscode und **keine** Freigabe, Tests zu überspringen.

## Beobachtete Fakten

Der bestehende Workflow `.github/workflows/pruefen.yml` hat zwei definierte Jobs mit `runs-on: ubuntu-latest` und regulären Schritten beginnend mit `actions/checkout@v4` und `actions/setup-node@v4`. Der Workflow wurde **nicht geändert**.

| Auslösung | GitHub-Lauf | Quellcommit | Ergebnis |
| --- | --- | --- | --- |
| Push auf neu angelegten Prüfzweig vor jeder Änderung | [42429250883](https://github.com/Redurbabat/Redion/actions/runs/42429250883) | `371fcf7e5` (identisch mit `main`) | failure; beide Jobs ohne gelistete Schritte |
| Push auf neuen Layout-Archivzweig vor jeder Änderung | [42428743543](https://github.com/Redurbabat/Redion/actions/runs/42428743543) | `371fcf7e5` (identisch mit `main`) | failure; beide Jobs ohne gelistete Schritte |
| PR #198 mit neuem Testwerkzeug | [42429344392](https://github.com/Redurbabat/Redion/actions/runs/42429344392) | `1b7fab7ba` | failure; beide Jobs ohne gelistete Schritte |
| PR #197 nur mit Dokumentation | [42428884620](https://github.com/Redurbabat/Redion/actions/runs/42428884620) | `deb07d8a8` | failure; beide Jobs ohne gelistete Schritte |

Für die untersuchten Jobs lieferte die GitHub-Steps-Abfrage jeweils eine leere Liste. Der Job-Logs-Abruf bei PR #198 und PR #197 endete jeweils in GitHub/Azure-Blob-Antwort `BlobNotFound` (404). Daher gibt es derzeit **keine belastbaren Testlogs** zu einem aus dem Code verursachten Fehlschlag. Auch ein Runner-/GitHub-Actions-Billing- oder Freigabeproblem ist nur eine Hypothese.

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
5. Nach Wiederherstellung einen regulären PR-Lauf mit `npm run typecheck` und den vorhandenen Quelltext-/Sicherungstests durchführen. Erfolgreiche Node-Fixture-Tests in PR #198 ersetzen ihn nicht.

## Verknüpfte, nicht gemergte PRs

Archivierung: [#192](https://github.com/Redurbabat/Redion/pull/192), [#193](https://github.com/Redurbabat/Redion/pull/193), [#194](https://github.com/Redurbabat/Redion/pull/194), [#195](https://github.com/Redurbabat/Redion/pull/195), [#196](https://github.com/Redurbabat/Redion/pull/196).

Aufräuminventar: [#197](https://github.com/Redurbabat/Redion/pull/197). Lesender Archiv-Link-Prüfer: [#198](https://github.com/Redurbabat/Redion/pull/198).

**Alle PRs bleiben als Entwürfe offen. Kein Merge ohne nachweisbaren Testlauf und Eigentümerfreigabe.**

## Schutzgrenzen

Nur neue Diagnose-Dokumentation. `main`, `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md`, `.github/workflows/`, `src/`, `quell/`, `ios/`, `windows/`, App-IDs, gespeicherte Daten und Build-Konfigurationen bleiben unverändert.
