# Redion Agenten-Start

Stand: 2026-11-07. Einstieg fuer Codex, Claude und ChatGPT. **Vor jedem Auftrag den aktuellen GitHub-Stand lesen.**

1. Lies `CLAUDE.md` (verbindliche Projektregeln), `doku/ARCHITEKTUR.md`, `AUFGABEN.md`, `ENTSCHEIDUNGEN.md`, `PROBLEME.md` und den aufgabenspezifischen Skill.
2. Pruefe bestehenden Code und Pruefungen, bevor du neue Komponenten, Navigation oder Datenmodelle erfindest.
3. Arbeite ausschliesslich auf einem eigenen Feature-/Fix-/Review-Branch; kein direkter Commit oder Merge nach `main`, kein Force-Push und keine Ueberschreibung fremder Branches.
4. Datenintegritaet, Offline-Betrieb, Import/Export, bestehende Navigation und Rueckwaertskompatibilitaet gehen vor Optik.
5. Unterscheide **Code gelesen**, **Syntax/Typen geprueft**, **Browser getestet**, **iPhone getestet**, **signierte IPA gebaut** und **Deployment erfolgt**. Fehlende Nachweise als **NICHT GETESTET** kennzeichnen.
6. Keine privaten Dokumente, Zugangsdaten, Tokens, persoenlichen Screenshots oder Diagnoseberichte committen.
7. Keine neue Produktfunktion ohne vorherigen Abgleich mit bestehenden Workspace-2.0-Arbeiten und den Entscheidungen.

## Skill-Verzeichnis

- `redion-workspace-architect`: Arbeitsbereiche, Bibliothek, Desktop- und Mobilnavigation konsistent gestalten.
- `redion-component-smith`: Wiederverwendbare TypeScript/CSS-Komponenten und React-Inseln entwerfen.
- `redion-ux-auditor`: Echte Nutzerwege auf Desktop, iPhone, Windows und Web pruefen.
- `redion-editor`: Notizseiten, Bloecke, Tastatur, Verlauf und Seitenwerkzeuge stabil verbessern.
- `redion-pdf-ink`: PDF-Dokumentmodus, Zeichnen, Stift, Export und Seitenwechsel pruefen.
- `redion-data-guardian`: IndexedDB, lokale Daten, Backup, Import, Export und Migrationen absichern.
- `redion-sync-security`: Optionale Synchronisierung, Cloudflare, Berechtigungen und Sicherheitsgrenzen pruefen.
- `redion-local-ai`: KI-Funktionen datenschutzbewusst in die bestehende Redion-Oberflaeche integrieren.
- `redion-platform-testing`: Regressionen, Browserpruefungen und echte Geraeteabnahmen koordinieren.
- `redion-release`: Sichere Web-, Windows- und iOS-Releases vorbereiten.
- `redion-macos-desktop`: macOS-App, Signierung, Notarisierung und gemeinsame Desktop-Shell
- `redion-animationen`: bestehendes Motion-System, Federn und Reduzierte-Bewegung-Regeln

Kanonische Skill-Dateien liegen unter `.agents/skills/<name>/SKILL.md`. Claude-Einstiege unter `.claude/skills/<name>/SKILL.md` verweisen auf sie. Bestehender Skill `redion-animationen` wird vorerst nicht verschoben oder ersetzt.

## Wichtige bestehende Workspace-Arbeiten

`doku/WORKSPACE-2-BIBLIOTHEK.md`, `doku/WORKSPACE-2-EDITOR.md`, `doku/WORKSPACE-2-DOKUMENTKOMPASS.md`, `doku/WORKSPACE-2-MOBILE-NAVIGATION.md`, `doku/DESIGN-REDION-PREMIUM.md` und `doku/PREMIUM-SHELL-MATRIX.md`. Dokumentierte historische Testresultate sind keine aktuellen Testergebnisse.

## Plattformziel

Redion soll als eigenstaendige Windows- und macOS-Desktop-App sowie als iPhone-App nutzbar sein. Der aktuelle Plattformstatus und die noch fehlenden Nachweise stehen in `doku/PLATTFORM-STRATEGIE-MAC-WINDOWS-IPHONE.md`. Die zehn unveraenderten BBT-Bit-Skills liegen nur als Referenz in `doku/bbt-bit-skill-referenz/`; sie sind nicht automatisch fuer Redion anwendbar.
