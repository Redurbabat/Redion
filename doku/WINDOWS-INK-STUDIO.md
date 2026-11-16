# Windows-Stiftstudio · E790

Stand: 16. November 2026. Branch `codex/windows-ink-glass`, Ausgangspunkt
`eff7e4cdd` aus `claude/redion2-gesamt`. GitHub-main stand beim Abgleich auf
`371fcf7e5`; die neueren E775–E789 bleiben erhalten. Kein Merge, Push oder Deployment.

## Bedienung

- **6 / Stift:** Maus oder digitaler Stift schreibt ohne Raster. Farbe,
  Breite, Schreiben und Tinte radieren stehen über der Zeichenfläche.
- **1 / Auswahl:** Annotation anfassen und verschieben. Entf löscht die
  Auswahl; Strg+Z, Strg+Y und Strg+Umschalt+Z benutzen den bestehenden Verlauf.
- Freihand funktioniert bei laufender Simulation. Schalter werden im
  Auswahlwerkzeug bedient. Änderungen an der elektrischen Zeichnung
  verlangen eine gestoppte Simulation.
- **2 / Leitung** oder direkt von einer Klemme ziehen verbindet elektrisch.
  Fangring, Leitungsdarstellung und Bestätigung beruhen auf den tatsächlichen
  Anschlüssen. Freihand bleibt eine Annotation und verbindet keine Klemme.
- Der Tintenradierer und das Radierende eines Stifts entfernen nur Tinte.
  Der bisherige elektrische Radierer bleibt ein getrenntes Werkzeug.
- **F** öffnet die bestehende fokussierte Planfläche. Finger verschieben
  dort die Ansicht; zwei Finger zoomen. Ein Handballenkontakt während eines
  aktiven Stiftzugs kapert den Strich nicht.
- Glass Wheel bleibt in den vorhandenen Oberflächeneinstellungen optional.
  Klassisch ist weiter Standard. Die eigentliche Zeichnung bleibt deckend.

## Wiederverwendung und Daten

| Bestand | Entscheidung |
| --- | --- |
| Electron, Dateibrücke, lokale App-ID und Datenprofil | KEEP |
| InkStroke, InkGeometry, Planmodell, Verlauf und Simulation | KEEP; gezielt erweitern |
| Punktverarbeitung, Zeichenflächen-Absetzen, Glaswerkzeuge | REWORK |
| RED-Morph-Labs und RED-Bit-Musikfunktionen | Referenz; keine Produktübernahme |
| Dateien löschen oder vorhandene Navigation ersetzen | Nicht Bestandteil |

Die gemeinsamen Stiftgrundlagen lesen Sammelereignisse einschliesslich der
aktuellen Meldung. PDF, Notizheft, Zeichenfläche und Plan fragen dieselbe
Punktverarbeitung. Vorhersagen bleiben Bilddaten. Beim neuen Planzug ist die
Koordinatenmatrix festgehalten; ein laufendes Einpassen oder Fensterwechsel
darf keine falschen Punkte speichern. Abbruch und verlorene Zeigeraufnahme
hinterlassen keinen halben Planstand.

`plan.ink` ist optional, verwendet Planeinheiten und die bestehenden
Sensorkanäle. Gespeichert wird erst beim Abschliessen einer Aktion als
Kopie über den bestehenden Blockpfad. Annotationen rechnen die Simulation
nicht neu. Der alte Klemmennamen-Auflöser und die bestehenden Leitungsfelder
bleiben unverändert. Details und ältere App-Versionen: `REDION-FORMAT.md`.

RED Bit und RED Morph liefern Bedien- und Materialprinzipien. Es wurde kein
SwiftUI-, Musik-, GPL- oder 3D-Democode übernommen. Glas benutzt Redions
vorhandene Marken. Ein Filter am Plan-Kopf wurde verworfen: er änderte den
Bezug des absolut gesetzten Werkzeugdocks. Der Filter sitzt am Dock selbst.

## Reproduzierbare Prüfungen

```powershell
npm run bauen:ts
npm run typecheck
npm run stand
node bauen.mts
npm run test:ink
npm run test:windows-ink
node pruefungen/windows-ink-studio.mts --web
node pruefungen/windows-ink-layout.mts
node pruefungen/windows-ink-layout.mts --webkit
node pruefungen/windows-ink-studio.mts --scale=1
node pruefungen/windows-ink-studio.mts --scale=1.5
node pruefungen/windows-ink-studio.mts --scale=2
node pruefungen/windows-ink-studio.mts --soak-ms=1800000
```

Alle Eingaben und Archive sind synthetisch. Native Tests setzen appData vor
Laden des unveränderten Electron-Einstiegs auf ein frisch angelegtes
Testverzeichnis. Die reale Ablage wird nicht geöffnet. Der Dauerlauf verbirgt
sein eigenes Fenster und deaktiviert nur dort die Hintergrunddrosselung.
Unterbrechungen werden getrennt von vollständigen Strichen gezählt.
Bilder, Videos und Messungen liegen ignoriert unter `bilder/windows-ink/`.

## Nachweise und Grenzen

- Modellprüfung: 6/6; die neuen Grundverträge waren vor dem Bau rot.
- Windows-Desktop-Verträge: 21/21. Native Paketparität: 3/3; die alte
  Testfixture berücksichtigte die zwei vorgeschriebenen Versionsdateien nicht.
- Ink-/Elektro-Läufe 366, 478, 479, 575, 608, 611, 639–642: alle zehn grün.
- Echte Electron-Ausführung: Zeichnen, Löschen, Verlauf, laufende Simulation,
  emulierter Stiftdruck/Neigung, Handballenkontakt und Datenerhalt nach Neuladen.
- Eigenständige Electron-Testläufe bei Faktor 1 / 1,5 / 2 bestanden.
  Gemessene Bildabstände im 95. Perzentil: 16,9 / 17,0 / 17,6 ms.
  Die Ausgangsmessung lag bei 20,1 ms. Das sind Browser-Bildabstände,
  keine Messung der physischen Stift-zu-Display-Latenz.
- Browser: realer `.redion`-Export mit künstlichem Anhang, Lesen und Import
  erhalten die Freihanddaten. Bedienvideo aufgezeichnet.
- Chromium: 16 Layouts grün, jeweils Desktop/Telefon, hell/dunkel und
  klassisch/Glas; 44-Pixel-Werkzeuge, deckendes Papier, Kontrast und ruhige
  Darstellung. WebKit ist unter dem Windows-Prüfruntime noch nicht
  zuverlässig abgenommen; die Versuche am Kontrastpfad wurden abgebrochen.
- Automatischer Electron-Dauerlauf: 1.800.215 ms, 3.315 abgeschlossene
  Schreibzüge mit Rückgängig, keine Abbrüche. Verborgenes Testfenster,
  synthetische Mausereignisse, keine Messung menschlicher Stifteingabe.
- Strichvorschau im Windows-Funktionslauf: 86 gemessene Bild-Callbacks,
  95. Perzentil 0,4 ms, Maximum 0,6 ms. Szene: Wechselschaltung mit Maus-
  und emulierten Stiftstrichen; die vorhandene PDF-Stiftprüfung deckt
  zusätzlich ihre Szene mit 200 Marken ab.
- Bestandsfehler: 332, 362, 401, 402, 541, 576, 581, 584 und 623 sind
  auch auf der isolierten Kopie von `eff7e4cdd` rot. Keine Wächter wurden
  abgeschwächt; ein vollständig grüner Gesamtlauf wird nicht behauptet.
- Schneller Gesamtlauf: 42/49 grün. Die sieben roten Läufe 109, 225, 401,
  402, 578, 610, 621 sind am Ausgangscommit ebenfalls rot. Das kurzzeitig
  neue, undefinierte Schriftgrössentoken wurde entfernt; die Tokenprüfung
  meldet danach ausschliesslich die beiden bestehenden Farbtoken.
- Gemeinsamer Neigungskanal: bestehender PDF-Lauf 475 mit 22/22 grün.
- Paketbau: Abschlusswerte werden nach dem Lauf ergänzt.
- **NICHT GETESTET:** physischer Windows-Stift und Handballen, echtes iPhone,
  Installation/Update einer bestehenden Nutzerinstallation, Codesignierung
  und veröffentlichter Updatekanal. Die Vorschau veröffentlicht nichts.
