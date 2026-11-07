# Redion – lokale Testauswertung (7. November 2026)

## Testbasis

- Nutzer-ZIP: `Redion-main.zip` (lokal entpackt, entspricht nicht zwingend dem letzten Commit des Review-Branches).
- Umgebung: Linux, Node v22.16.0, Chromium 144.0.7559.96.
- Projekt verlangt Node >=22.18. Die lokale Version ist damit **nicht kompatibel** zu allen vorgesehenen Buildskripten.
- Keine Benutzerdaten, kein reales Konto und keine Cloud-Verbindung verwendet.

## Ausgefuehrte Tests

| Befehl / Pruefung | Ergebnis | Aussagekraft |
| --- | --- | --- |
| `node --test windows/macos-desktop.test.cjs` | **BESTANDEN: 5/5** | Statische macOS-Konfigurations- und Quelltextvertraege; kein Mac-Build |
| `node --test tools/sync-readiness.test.mjs` | **BESTANDEN: 8/8** | Read-only-Checks fuer Sync-Bereitschaft |
| `node --test windows/version.test.mts` | **NICHT AUSFUEHRBAR** | Node 22.16 kann `.mts` ohne Flag nicht laden |
| `node --experimental-strip-types --test windows/version.test.mts` | **BESTANDEN: 1/1** | Versionskonsistenz; Type-Stripping experimentell |
| `npm ci --ignore-scripts --no-audit --no-fund --prefer-offline --fetch-retries=0` | **FEHLGESCHLAGEN** | Registry-Downloads: DNS `EAI_AGAIN`; keine reproduzierbare Installation |
| Chromium Headless `--dump-dom` | **FEHLGESCHLAGEN** | GPU-Prozessabbruch `FATAL: GPU process isn't usable` (Exit -6) |
| Chromium mit Xvfb | **ZEITLIMIT** | 15 Sekunden, keine DOM-Ausgabe; kein erfolgreicher Browserstart |
| `node pruefungen/workspace-library.mts --states` | **NICHT GETESTET** | Playwright-Abhaengigkeiten nicht installiert, Browserstart unzuverlaessig |

## Befund und naechste Schritte

Die Fehler sind bisher **Umgebungsblocker**, keine nachgewiesenen Redion-Anwendungsfehler. Eine visuelle Bewertung der Arbeitsflaeche und ein erfolgreicher Chromium-Test waeren daher unredlich.

1. GitHub Actions auf einem Runner mit Node >=22.18 und funktionierender npm-Registry starten.
2. `npm ci`, `npm run bauen:ts`, `npm run typecheck`, `npm run stand` ausfuehren.
3. Playwright-Chromium installieren und `node pruefungen/workspace-library.mts --states` auf dem CI-Runner ausfuehren; Browserfehler mit Logs/Screenshots dokumentieren.
4. Erst nach reproduzierbaren roten Tests App-Fehler korrigieren. Keine Benutzerdateien fuer Tests verwenden.
5. macOS-DMG/ZIP, Windows-App und iPhone-IPA getrennt bauen und auf echten Zielgeraeten testen.

**Wichtig:** Dieser Bericht ist eine Diagnose, kein Freigabe- oder Release-Nachweis.
