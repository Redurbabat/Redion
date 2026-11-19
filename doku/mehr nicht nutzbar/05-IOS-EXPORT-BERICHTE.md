# iOS-Lifecycle- und Exportberichte — zur Kontrolle

**8. November 2026. Reversibles Prüfarchiv, keine Löschung.**

Diese zwei Dokumente halten punktuelle Implementierungs- und Prüfergebnisse aus Oktober 2026 fest, nicht die aktive Projekt- oder Buildkonfiguration. Sie bleiben inhaltsgleich erhalten.

| Vorher | Neu |
| --- | --- |
| `doku/IOS-NATIVE-LIFECYCLE-EXPORT-2.md` | `doku/mehr nicht nutzbar/IOS-NATIVE-LIFECYCLE-EXPORT-2.md` |
| `doku/IOS-EXPORT-HAPTIK-PDF-MOBIL.md` | `doku/mehr nicht nutzbar/IOS-EXPORT-HAPTIK-PDF-MOBIL.md` |

## Weshalb als Archivkandidaten

- `IOS-NATIVE-LIFECYCLE-EXPORT-2.md`: Bericht zu Hintergrundwechsel, Statusleiste, Unicode-Dateinamen und temporären Exportdateien aus einer abgeschlossenen Entwicklungsrunde.
- `IOS-EXPORT-HAPTIK-PDF-MOBIL.md`: Bericht zum nativen Haptik-Feedback nach Dateiexport und zu PDF-Werkzeugleisten auf schmalen iPhones.
- In der GitHub-Dateinamenssuche keine direkten externen Dateinamensverweise gefunden; die beiden Originaldokumente enthalten keine relativen Markdown-Links. Das ist keine vollständige dynamische Abhängigkeitsanalyse.

## Offene Abnahme (bleibt offen)

Die Berichte selbst nennen noch ausstehende reale Geräte-, Codemagic-, Windows-/Web-Paritäts- bzw. Regressionstests. Durch die Archivierung wird **keiner dieser Tests als bestanden markiert**. Vor einer tatsächlichen Freigabe sind die Originalberichte bei Bedarf wiederherzustellen und die Prüfungen auszuführen.

## Schutz und Wiederherstellung

Die Git-Blobs werden bytegenau als reine Umbenennung übernommen. Es werden keine Dateien in `ios/`, `src/`, `quell/`, `windows/`, keine Konfiguration und insbesondere keine Datenschutz-/Backup-Dateien geändert. `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md` und die Skill-Ordner bleiben unangetastet.

**Nur Entwurf-PR, Eigentümerkontrolle vor Merge.**
