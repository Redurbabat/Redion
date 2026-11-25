# Agenten-Workflow – Redion

1. Lies zuerst den [Graphify-Bericht](../graphify-out/GRAPH_REPORT.md) für das betroffene Thema. Danach lies die Regeln in [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md), [AI_START_HERE.md](../AI_START_HERE.md) und dem passenden Skill. Prüfe anschliessend `git status -sb`, Zielbranch, aktuelle Commits und Quelldateien.
2. Vor Implementierung: bestehende Funktion, Register, Dokumentation, offene Issues, Datenrisiken und zugehoerige Tests ermitteln.
3. Ein Ziel pro Branch. Kein direkter Commit nach `main`; fremde Agenten-Branches nie ueberschreiben. PR nur auf ausdruecklichen Auftrag; Merge/Deployment nur nach Freigabe.
4. Bei Fehlern moeglichst reproduzierbaren, zuerst fehlschlagenden Test schaffen; kleine Aenderungen, keine Neben-Refactors.
5. Tests nach Risiko: Typen, Build, betroffene Browser-Regressionen, WebKit, Backup-/Import-/Export-Roundtrip, iPhone/Windows. Jede nicht gefahrene Stufe = **NICHT GETESTET**.
6. Ergebnisse dokumentieren: Dateien, Branch, Commit, Testbefehl, Ergebnis, offene Risiken. `AUFGABEN.md`, `PROBLEME.md`, `LUECKEN.md` und `ENTSCHEIDUNGEN.md` nur bei tatsaechlichen neuen Fakten aktualisieren.
7. Vor Push Diff und Branch kontrollieren. Kein Force-Push, keine Geheimnisse, keine privaten Nutzerdaten.

## Skills

Kanonisch: `.agents/skills/`; Claude: `.claude/skills/`. Siehe `AI_START_HERE.md`. `redion-animationen` bleibt als vorhandener Claude-Skill unveraendert; vor einer spaeteren Zusammenfuehrung Duplikate und Referenzen pruefen.

## Workspace-Review

`doku/WORKSPACE-REVIEW-2026-11.md` ist der aktuelle Massnahmenplan, keine Bestaetigung eines UI-Tests.
