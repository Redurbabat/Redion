# Historische Capacitor-Buildvorfälle — zur Kontrolle

Stand 8. November 2026. **Nur Archivierung, keine Löschung.**

Die Berichte beschreiben einzelne bereits diagnostizierte Build-Hürden (Capacitor-iOS-Projektpfad und SPM-Storyboard-Vorprüfung); sie sind kein aktiver Teil der Buildkette. Die technischen Prüfungen aus diesen Berichten bleiben im Buildcode und in den Regressionstests.

| Original | Im Sammelordner |
|---|---|
| `doku/IOS-CAPACITOR-PFADKONFLIKT.md` | `doku/mehr nicht nutzbar/IOS-CAPACITOR-PFADKONFLIKT.md` |
| `doku/IOS-CAPACITOR8-SPM-VORPRUEFUNG.md` | `doku/mehr nicht nutzbar/IOS-CAPACITOR8-SPM-VORPRUEFUNG.md` |

## Grenzen

- Dateien bytegenau als dieselben Git-Blobs übernommen. Verschiebungen sind reversibel.
- Nach Suche nach exakten Pfad-/Dateinamensreferenzen im Hauptbranch wurden keine weiteren Verweise gefunden; vollständige Link- und Laufzeitprüfung ist damit nicht bewiesen.
- Keine App-, Build-, Swift-, TypeScript-, JavaScript-, Test- oder Konfigurationsdateien geändert.
- `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md` und ähnliche Anweisungsdateien bleiben unverändert.
- Echte Codemagic-/Xcode-/iPhone-Geräteprüfung: **NICHT GETESTET**. Keine angeblich grünen Release-Tests.
- PR nicht ohne Kontrolle mergen. Im Zweifel jede Datei auf den früheren Pfad zurückverschieben.
