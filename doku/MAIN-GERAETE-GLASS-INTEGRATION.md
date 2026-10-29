# Geräteintegration und Glass Wheel auf gemeinsamem main

29. Oktober 2026. Redur verlangt ausdrücklich beide Stände auf main.

## Ausgangslage

Beim Abrufen war GitHub-main bereits `084c98bc5`: Glass-Wheel-Commit
`e0b0d08a1` aus PR #168 sowie die neueren Windows-Update-/Sync-Sicherheits-
Arbeiten aus PR #163, #165 und #166 waren schon enthalten.
Die Geräteintegration `766105fab` wird darauf zusammengeführt, nicht auf den
älteren Stand zurückgesetzt. Keine Branches oder Nutzerdaten werden gelöscht.

## Auflösung der Überschneidungen

- Windows behält Auto-Update-Controller, Shutdown-Schutz und beide vorhandenen
  Update-Abhängigkeiten. Hinzu kommen die Datei-Kennungen und isolierte Brücke.
  Das Paket enthält Update-Module UND generierte native Dateimodule.
- Beide UI-Einstiege und alle drei neuen Laufzeitdateien sind eingebunden.
  Klassisch bleibt Standard; Glass Wheel ist freiwillig.
- Geräte-CSS bleibt vor den Bausteinen. Das optionale Gesamtschalenblatt
  Glass Wheel folgt allen klassischen Schalenblättern. Der Reihenfolgewächter
  erkennt es ausdrücklich als optionale Schale statt als gewöhnliches Bauteil.
  Vorher war test87 deshalb rot; die übrige Kaskadenprüfung bleibt erhalten.
- JavaScript, Service Worker, Stand und Einzeldatei werden über die vorgesehenen
  Buildschritte neu erzeugt; keine der kollidierenden Ausgaben wird blind gewählt.
- App-IDs, lokale Herkunft, Windows-Datenprofil und Sicherungsformat bleiben
  unverändert. Access-Tor, HTTPS-Prüfung und Token-Origin-Sperre bleiben erhalten.

## Freigabegrenzen

Der main-Push ist keine Geräteinstallation und kein Deployment-Auftrag.
Es existiert weiterhin kein eingerichteter eigener Sync-Server. Echte iPhone-
Abnahme, Signierung und produktiver Abgleich bleiben offene Freigaben.
Die alten JavaScript-Bestandsfehler werden nicht durch eine pauschale Ausnahme
versteckt. Ein vollständig grüner Gesamtlauf wird nicht behauptet.

Die neue einmalige Ausnahme nach CLAUDE §46 hat Redur ausdrücklich bestätigt:
„Ja, dokumentiert auf main übernehmen“. Bekannte Altfehler und offene echte
iPhone-/Signierungsprüfungen bleiben dokumentiert. Das ist keine allgemeine
Erlaubnis für spätere main-Änderungen. Neue Integrationsfehler werden vorher behoben.

## Tatsächlich geprüfter gemeinsamer Stand

- Typecheck, TypeScript-/Einzeldatei-Bau und Dienststandprüfung erfolgreich.
- 194/194 native Datei-, Update-, Shutdown-, Sync-HTTPS-/Token- und
  Readiness-Unitprüfungen erfolgreich, keine übersprungen.
- Glass-Geometrie für 0/1/3/8/20/64 Bereiche erfolgreich; acht Glass-
  Browserfälle mit insgesamt 800 Moduswechseln und Daten-/Reiterkontrolle grün.
- Acht Geräte-Browserfälle grün: vier Größen, hell/dunkel, Tastatur,
  ruhige Bewegung, echte Import-/Sicherungsfehlerwege.
- Echter Electron-Start, isolierte native Brücke und Testnotiz über Neustart grün.
- test87 nach Kaskadenkorrektur 189/189. Die alte JavaScript-Bestandsprüfung
  bleibt mit bereits auf main vorhandenen Quellen rot; kein neuer Quellcode
  wird durch eine Erweiterung ihrer Bestandsliste versteckt.
- Sicherung und echte Anhänge: test96 18/18 und test100 35/35.
- Windows und iOS enthalten jeweils 487 bytegleiche gemeinsame Webdateien.
- Die Quellbauprüfung fand außerdem zwei unvollständige Erzeugt-Kopfzeilen
  aus dem Glass-Zwischenstand. Nur diese Metadaten wurden berichtigt und die
  Dateien normal neu gebaut; danach test105 346/346. Keine Glass-Funktionen ergänzt.

Es wurden keine Nutzerprofile geöffnet, keine bestehenden Apps ersetzt,
keine Updates signiert und kein Server bereitgestellt.
