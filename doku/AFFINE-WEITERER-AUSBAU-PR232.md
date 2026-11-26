# Weitere AFFiNE-Funktionen in PR #232

26. November 2026. Ausgangspunkt `7adad1ae`; eigener Arbeitszweig
`feature/pr232-affine-complete`. Redurs „Nehme alles“ bezieht sich auf die
zuvor angebotenen Ergänzungen. Dies ist kein behaupteter Ersatz sämtlicher
AFFiNE-Dienste. Der [Gesamtabgleich](AFFINE-GESAMTABGLEICH.md) hält deren
getrennten Stand fest.

## Bedienung

Der neue Knopf **Objekte und Rahmen** sitzt im Zeichendock der Seitenfläche.
Im Whiteboard führt **Mehr → Ebenen, Gruppen und Ausrichten** zur selben
Übersicht, im PDF der Knopf **Objekte und Ebenen**. Ein einziger Baustein baut
die Bedienung; jeder Kontext behält seinen Verlauf, seine Koordinaten und
seinen bestehenden Speicherweg.

| Ergänzung | Verhalten |
| --- | --- |
| Ausrichten | Links, Mitte, rechts, oben, vertikal mittig, unten. Gruppen werden als Einheit behandelt. |
| Verteilen | Gleiche horizontale oder vertikale Abstände ab drei Einheiten. |
| Einrasten | Kanten und Mittellinien beim Verschieben auf Seitenfläche und Whiteboard; sichtbare Hilfslinien. Alt unterdrückt das Einrasten. |
| Lasso | Freihandschlinge im Auswahlmenü auf Seite und Whiteboard; vorhandenes PDF-Lasso bleibt. |
| Drehung | 90° oder ein eingegebener Winkel. Striche drehen ihre Punkte; Formen behalten eine lokale Drehung. PDF benutzt seine vorhandene Geometrie. |
| Ebenen | Liste von vorne nach hinten, Gruppeneinträge, einzelne Mitglieder öffnen, vier Anordnungsbefehle. |
| Verschachtelte Gruppen | Gruppieren legt eine äussere Ebene an; Auflösen erhält vorhandene Untergruppen. Kopien bekommen neue Gruppenkennungen. |
| Sperren | Einheitliche Bedienung in allen drei Kontexten; PDF behält `gesperrt`. Die Sperre ist eine Bearbeitungshilfe, keine Berechtigung. |
| Rahmen | Auswahl einrahmen, Titel bearbeiten, Reihenfolge ändern, Ausschnitte präsentieren. Vor/Zurück und Pfeiltasten wechseln, Escape beendet. Währenddessen wird nicht gezeichnet. |
| Verbinder | Gerade, Kurve, rechtwinklig; automatische oder feste Anschlüsse oben/rechts/unten/links. Auf Seite und Whiteboard. |
| Dokumente einbetten | Vorhandener synchronisierter Block statt Kopie oder zweitem Editor. Neue Quelleninhalte bleiben verbunden; Quellrechte werden geprüft. |
| Objektkommentare | Lokale Fäden hinzufügen, bearbeiten, erledigen und wieder öffnen. Gespeicherte Texte werden als Text ausgegeben. |
| Vorlagen | Projektboard, SWOT, Zeitstrahl und Retrospektive mit bearbeitbaren Rahmen und Notizen. |
| Dynamische Sammlungen | Im Ortsmenü der Bibliothek erstellen und bearbeiten; Titel, Schlagwort, Dokumentart, Favoriten und Bearbeitungszeit mit UND/ODER verknüpfen. |

## Austausch und Grenzen

Die bearbeitbare Flächendatei enthält alle Zeichenobjekte, unbekannte Felder,
Gruppenpfade, Rahmen und Kommentare. Ohne Anhänge ist sie JSON; mit Anhängen
enthält ein ZIP `canvas.json` sowie die wirklichen Bytes unter `assets/`.
Ein fehlender Anhang bricht den Export ab. SVG und PNG sind grafische Ausgaben
der Zeichenobjekte; eingebettete Dokumentblöcke gehören in die vollständige
Redion-Sicherung. Der Exportdialog sagt diese Grenze ausdrücklich.

Der AFFiNE-Import liest **BlockSuite-JSON-Snapshots**, auch in ZIP-Dateien.
Unterstützt sind Rechteck, Ellipse, Dreieck, Raute, Text, Strich/Marker,
Gruppen, Verbinder zwischen vorhandenen Objekten, Rahmen, Notizen, Bilder
und Dateianhänge. Originalwerte bleiben als `affineSource` erhalten.
Nicht unterstützte GFX-Elemente werden abgelehnt; fehlende Dateien werden vor
dem ersten Dateischreibzugriff erkannt. Bei einem Schreibfehler werden nur die
Dateien des gerade fehlgeschlagenen Imports entfernt. Bestehende Daten werden
nicht überschrieben. Beim Einfügen entstehen neue Objekt- und Gruppen-IDs.

Binäre Yjs-Arbeitsbereichssicherungen sind kein unterstützter Snapshot.
AFFiNE-spezifische Schriftstile, Rich-Text-Formatierung in Notizkarten,
Theme-Farbtokens, zusätzliche Formarten, freie Verbinderenden und Mindmap-GFX
sind keine bestätigte Formatparität. Der Snapshot-Import ist kein Import des
gesamten AFFiNE-Arbeitsbereichs samt Konten, Datenbanken und Serverhistorie.

Als Quellen wurden die bereits in PR #232 festgehaltene AFFiNE-Referenz
`81da59d63d535d72ba677a097d9a0cc9a5871ade` und dort die Modelle unter
`blocksuite/affine/model/src/elements/{shape,group,connector}` gelesen.
Es wurde kein neuer AFFiNE-Quellcode kopiert und keine Abhängigkeit ergänzt.

## Abnahme

`pruefungen/affine-workbench.browser.test.mts` bedient die echten Oberflächen
bei 1366, 390 und 320 Pixeln. Er prüft Geometrie, Zeigergesten, Verschachtelung,
Kommentare, Rahmenvortrag, Verbinder, JSON/ZIP, Anhänge bytegenau, Neuladen,
Quellenrechte mit einem echten lokalen Gastkonto, Whiteboard-Verlauf,
PDF-Gruppierung, dynamische Regeln und `.redion`-Metadatenrundreisen.
Die Gegenprobe gegen `7adad1ae` scheitert an der dort fehlenden
`GfxObjects.align`-Funktion. Der zusätzliche Gestentest deckte auf, dass eine
geschlossene Schlinge fälschlich als kurzer Klick verworfen wurde; die
Mindestbewegung gilt jetzt nur für die Rechteckauswahl.

Endergebnisse auf diesem Arbeitsstand:

- Neue Objektübersicht: **101/101**, Chromium bei 1366, 390 und 320 Pixeln.
- Bisherige Gruppen/Sperren/Sicherung: **72/72**.
- Kontext-Docks mit nativer JavaScript-Brücke: **60/60**.
- Seitenfläche `test575`: **111/111**. Der erste Lauf fand eine Überlappung
  zwischen dem dritten Zusatzknopf und der Verlaufskapsel. Die Kapsel
  reserviert jetzt 160 statt 110 Pixel; beide schmalen Breiten haben eine
  zusätzliche Zusage dafür.
- Whiteboard `test209`: **56/56**; Spiegelblöcke `test44`: **31/31**.
- PDF-Dokumentkompass: **68/68**.
- Sicherungen `test96`: **18/18**; Anhangsarchive `test100`: **35/35**,
  einschliesslich des vorhandenen Falls über vier Gigabyte.
- Architektur `test537`: **18/18**. Die Dateioperationen des Whiteboards
  werden über den vom App-Start gebundenen GFX-Adapter eingespeist; keine
  neue direkte Kopplung zwischen Bereichen.
- Erzeugtes JavaScript `test105`: **370/370**, einschliesslich Typprüfung.
- Native Installer-/Dock-/Paritätsverträge: **15/15**.
- TypeScript, Web-Build, Einzeldatei und Dienststand **1697** erfolgreich.
- **40** Browserbilder in einer separaten Galerie und einem ZIP.
- Der gesamte schnelle Lauf wurde für diesen Bogen nicht wiederholt. Die
  vier zuvor am unveränderten Basisstand bestätigten Fehler bleiben im
  [Dock-Bericht](KONTEXT-DOCKS-PR232.md) dokumentiert.
- Graphify wurde nicht aktualisiert: Das Werkzeug ist hier nicht installiert.

Bilder liegen ausserhalb von Git unter `bilder/affine-workbench/`.
Chromium-Bilder in Handybreite sind kein Test der UIKit-Glasdarstellung.
WebKit, echtes iPhone, Xcode und IPA: **NICHT GETESTET**.
Deployment und Merge: **NICHT AUSGEFÜHRT**.
