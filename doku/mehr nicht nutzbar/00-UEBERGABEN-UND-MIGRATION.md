# Historische Übergaben und Migration — Aufräumvorschlag zur Kontrolle

**Datum: 8. November 2026.** Dies ist ein Archiv von Dokumentationsdateien, **keine Löschung** und keine Aussage über bereits bestandene Tests.

Einmalige historische Arbeitsübergaben, bereits durchgeführte Integrations- oder Migrationsprotokolle. Es wurden keine exakten Referenzen auf diese Dateinamen aus anderen GitHub-Dateien gefunden.

| Ursprünglicher Pfad | Neuer Archivpfad |
| --- | --- |
| `doku/CODEX-UEBERGABE-ZEICHENSTUDIO.md` | `doku/mehr nicht nutzbar/CODEX-UEBERGABE-ZEICHENSTUDIO.md` |
| `doku/INTEGRATION-2026-10-21.md` | `doku/mehr nicht nutzbar/INTEGRATION-2026-10-21.md` |
| `doku/BUENDEL-11-BIS-24.md` | `doku/mehr nicht nutzbar/BUENDEL-11-BIS-24.md` |

## Sicherheitsgrenzen

- Die Dateiinhalte werden **byte-identisch** aus den bisherigen Git-Blobs übernommen; der Git-Verlauf bleibt erhalten.
- Keine Dateien in `src/`, `quell/`, `ios/`, `windows/`, Build-Konfigurationen oder die Weboberfläche wurden geändert.
- `CLAUDE.md`, `AGENTS.md`, `AI_START_HERE.md` und andere Steuerdateien bleiben unangetastet.
- Das Archiv liegt unter `doku/`, das bereits von der Website-Bereitstellung ausgeschlossen ist.
- Eine Suche nach exakten Dateinamens-Referenzen im Hauptbranch ergab keine fremden Leser. Das ist kein vollständiger Laufzeit- oder Link-Test.
- Der Vorschlag wird **nicht** ohne Freigabe gemergt. Restore: Datei aus diesem Ordner zurück an den ursprünglichen Pfad verschieben.

**Prüfstatus:** Git-Baum- und Blob-Prüfung vorgesehen; Browser, Builds, Windows- und iOS-Geräte wurden nicht getestet.
