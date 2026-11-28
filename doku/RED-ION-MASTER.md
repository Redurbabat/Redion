# RED ION – gemeinsamer Master-Auftrag

Stand: 28. November 2026. Ein Entwicklungs-PR: [#263](https://github.com/Redurbabat/Redion/pull/263), Basis Main nach #262. Alle vier offenen Issues werden hier gebündelt; sie sind nicht automatisch abgeschlossen.

| Issue | Vorhandene Grundlage | Noch offen / Abnahme |
|---|---|---|
| [#134](https://github.com/Redurbabat/Redion/issues/134) Workspace | Bibliothek, Editor, Dokumentkompass, Mobile-Dock | aktuelle Chromium-/WebKit-Bilder, mobile Gesten, Accessibility, Web/IPA-Parität, echte iPhone-Abnahme |
| [#164](https://github.com/Redurbabat/Redion/issues/164) Sync/Backup | Sync-Engine, private Server-API, Gerätefreigabe, Backup und Konfliktlogik | getrennte echte Backups, Schlüsselablage, reale Zwei-Wege-Sync- und Restore-Abnahme, iCloud-Signatur |
| [#259](https://github.com/Redurbabat/Redion/issues/259) Ecosystem | SDK 0.15, Scheduler, Speicher-/Grant-Reviews, SSO, Files, AI/MCP-Pilot; Phase 3 ergänzt Disk-Sink und Video/Developer-Piloten | grosse verschlüsselte Dateien, Sync-/Vault-Integration, restliche P0–P3-Module, elf Apps und Hardware |
| [#260](https://github.com/Redurbabat/Redion/issues/260) Studio | Werkzeuge, PDF-Navigator, Messwertinspektor, Referenzfenster, native Preview | CAD-/Simulation, Split-View, PDF/Whiteboard, MCP und physische Stift-/Monitorabnahme |

## Reihenfolge

1. P0: CI, Offline-Datenintegrität, Server, Restore, Rechte, Sync.
2. P1: persistente Adapter, Files/SSD, Konflikt-UI, Schlüssel und native Integration.
3. P1: Workspace, Desktop, Elektro, PDF und Whiteboard auf bestehenden Datenmodellen.
4. P2: MCP, AI, Video, Developer, Workflow. Kein beliebiger Code im Server.
5. P3: App- und Hardwareabnahme. Andere Repositories benötigen eigene PRs; dieser PR verändert sie nicht.

## Gemeinsames Prüfgate

Diese Datei ist ein zusätzlicher Pfadtrigger für vorhandene Workflows: Home Server, Live Sync, Bibliothek, Editor, Dokument, Mobile Navigation, iOS-Regression und native Windows Preview. Zusätzlich Phase-3-Tests mit echter Chromium-Wiedergabe und Node unter Linux/Windows. Zusätzlich Cloud MCP Runtime, MCP Connector, iOS Glass Dock, Apple-/Android-SDK, Windows-Paket und unsignierter IPA-Build. Die Windows-/IPA-Builds bleiben für diesen ausdrücklich vorgesehenen Same-Repo-Branch begrenzt. Kein Produktionsdeployment oder Signieren. Keine Tests deaktivieren.

## Abnahme

- Keine Main-Freigabe vor erfolgreicher CI auf exakt der finalen Revision. Übersprungen oder ausstehend zählt nicht als bestanden.
- Issues erst schliessen, wenn ihre konkreten Unteraufgaben und Nachweise vollständig sind.
- Physische SSD, eigene iPhone-/Windows-Installation, Backup/Restore und externe App-Integration bleiben separat nachzuweisen.
- Keine Nutzerdaten löschen, keine Produktionssecrets, keine ungeprüfte Cloud-Konfiguration.
- Graphify im vollständigen Checkout nachziehen; vorhandener Graph ist historisch.

Siehe [Phase 3](RED-ION-PHASE-3.md), [Home Server](HOME-SERVER.md), [Studio](RED-STUDIO-DESKTOP.md), [MCP](RED-ION-MCP-ARCHITEKTUR.md), [iPhone/Windows](IPHONE-WINDOWS-INTEGRATION.md).

## Aktueller Prüffund

Auf `dcdde61e` bestanden 17 von 18 PR-Workflows, einschliesslich unsignierter IPA und Windows-Paket. Phase 3 scheiterte beim Chromium-Setup: Playwright 1.56.1 unterstützt Ubuntu 26.04 nicht. Der Runner wird auf 24.04 festgelegt; erneute vollständige Abnahme nötig. Die neuen Backup-Frische- und SDK-Disk-Sink-Tests sind noch nicht bestätigt. Keine physische Abnahme.

## P0-Fortschritt: lokaler Sync-Adapter

Auf `cf56d4f6` bestanden alle 18 PR-Workflows und der Push-Prüflauf. Editor erst im zweiten unveränderten Lauf erfolgreich; sporadische Sichtbarkeit noch beobachten. Neu: isolierter verschlüsselter Node-/SQLite-Sync-Adapter mit atomarem Cursor, Generation und Konfliktjournal, Regressionen über den echten SDK-Pull und zwei DB-Verbindungen. Die nächste Revision muss erneut geprüft werden. Keine native App-Anbindung, keine Freigabe von Schlüsselablage oder produktiven Datenprofilen.

## P0-Fortschritt: Upload-Warteschlange

Auf `c20c2671` sind alle 18 PR-Workflows und der Push-Prüflauf grün. Der neue Arbeitsschritt ergänzt persistente idempotente Text-Uploads, Readback und Schutz neuer lokaler Bearbeitungen. Tests für Neustart nach verlorener Antwort, falschen Schlüssel, abweichenden Serverstand und verweigerten Lösch-Upload. Neue Revision noch nicht abgenommen; Konfliktauflösung, native Schlüsselablage und echte Geräte bleiben offen.

## P0-Fortschritt: blockierte Upload-Konflikte

Explizite Keep-both-Auflösung mit authentifizierter Vorschau und erneuter Prüfung; jüngste lokale und vorbereitete Fassung bleiben bei Abweichung als separate lokale Kopien erhalten. Kein Server-Write und kein Cursor-Fortschritt. Regressionen für veraltete Vorschau, Server-/lokale Änderungen, falschen Schlüssel und Tombstones. Neue Revision noch zu prüfen. Reguläre Pull-Konflikte, native UI und Geräteabnahme bleiben offen.

## P0-Fortschritt: eingehende Textkonflikte

Ergänzt Keep-both für gewöhnliche lokale Textänderungskonflikte im SDK-Pull, mit authentifizierter Vorschau, neuer lokaler Kopie und atomarer Entfernung des explizit gelösten aktiven Konflikts. Kein Cursor-Fortschritt, keine Netzwerkschreiboperation. Tests für echten SDK-Pull, veraltete Vorschau, falschen Schlüssel und blockierte Sonderfälle. Vorherige und neue Gesamt-CI noch nicht vollständig abgenommen. UI, Sonderfälle und native Integration bleiben offen.

## P0-Fortschritt: durchgängige Server-Regression

Erweitert `red-store.test.mts` um zwei separat verschlüsselte persistente SQLite-Clients mit echtem RED ID v2, Freigabe und tatsächlichen Home-Server-Request-Handlern. Verlorene Antwort nach serverseitigem Commit, Neustart, idempotenter Retry, Offline-Konflikt, Keep-both-Kopie, Übertragung an das zweite Profil und Rechtewiderruf werden zusammen geprüft. Transport innerhalb des Prozesses, keine physische Geräte-/TLS-Abnahme. Test in bestehendem Home-Server-Workflow; neue CI noch nicht bestätigt.

## Editor-Regressionskorrektur

Wiederkehrender Chromium-390px-Befund (Run 46160781715): Leiste vorhanden, Sichtbarkeitsassertion fehlgeschlagen; bisherige Messung unterschied Opacity und Höhe nicht. Die Seitenleiste erhält eine explizite Mindesthöhe, keine geerbte Opacity-Transition und eine 44px-Untergrenze auch bei abweichenden Theme-Tokens. Browserdiagnose protokolliert Höhe, Opacity, Transition, Elterntransform und sämtliche Buttonhöhen. Vorhandene Assertions bleiben bestehen, alle Buttonhöhen kommen hinzu. Ursache noch nicht abschliessend nachgewiesen; neue Offline-Artefakte müssen gebaut und CI erneut geprüft werden.

## P1-Fortschritt: Apple Sync-Keychain

Separater nativer Apple-Schlüsselspeicher für explizit erhaltene 32-Byte-Schlüssel, an Serverursprung, Konto, App und Zweck gebunden. Atomarer Insert-only-Keychain-Weg, keine automatische Neuerzeugung oder Überschreibung bestehender Schlüssel, kein iCloud-Keychain. Tests der Scope-Isolation und Insert-only-Logik mit Testbackend. Reale Geräte-Keychain, App-Anbindung, Recovery, Windows DPAPI und Android-Sync-Key-Adapter bleiben offen.

## P1-Fortschritt: Windows Sync-Schlüssel

Apple-SDK-Workflow 46162342676 auf `9d65bf4c` bestanden. Windows-Pilot nutzt Electron safeStorage ausschliesslich unter Windows im Main-Prozess, separaten vertrauenswürdigen Ordner, Scope-Bindung und atomare Hardlink-Veröffentlichung ohne Überschreiben. CI ergänzt echten Electron/DPAPI-Smoke-Test und Node-Scope-Tests. Keine IPC-Freigabe, kein produktives Profil, kein automatisches Erzeugen/Löschen/Rotieren von Schlüsseln; kein Einbau in die ausgelieferte App. Neue Tests noch nicht ausgeführt.

## P1-Fortschritt: Android Sync-Key-Adapter

Ergänzt separaten Android-KeyStore-Adapter mit verschlüsseltem No-backup-Verzeichnis, Scope-Bindung, Prozess-/Dateisperre, atomarem Insert-only und Fail-closed bei fehlender Chiffre mit vorhandenem Wrapping-Key. Zwei JVM-Tests mit injiziertem Backend. Keine Geräteabnahme, Recovery, Rotation oder App-Anbindung. Windows-/Android-Kandidaten gemeinsam abnehmen, sobald die laufende Gesamt-CI abgeschlossen ist.

## P1-Fortschritt: Schlüsseltransfer-Lifecycle

Bestehenden SDK-Transfer um maximal fünf Minuten lokale Lebensdauer (Wallclock + monotone Zeit), explizite idempotente Abbruchfunktion über alle Stufen und Nachprüfung nach asynchroner Kryptografie erweitert. Peer-Public-Key vor await gebunden, temporäre Secret-Bytes auch bei Fehlern gelöscht. Wire-Format unverändert. Regressionen für Abbruch, laufende Entschlüsselung, Ablauf und ungültige Dauer. Kein QR-/Fingerprint-UI, kein automatischer Einbau, keine Recovery. Neue Tests noch zu prüfen.
