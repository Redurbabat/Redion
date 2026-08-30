# Redion-Oberfläche — GoodNotes × OneNote × Notion

**Stand: 30. August 2026**

## Ziel

Redion behält seinen gesamten Funktionsumfang, zeigt im Normalzustand aber nur das, was für den aktuellen Arbeitsschritt nötig ist.

Die neue ruhige Schale verbindet drei bekannte Bedienmuster:

- **OneNote:** ein schmaler Bereichs-Rail links und daneben der Seitenbaum.
- **Notion:** eine ruhige Kopfzeile mit Pfad, Suche, KI und wenigen Seitenaktionen; der Inhalt steht im Mittelpunkt.
- **GoodNotes:** echte Seiten und Dokumente wirken wie eine Arbeitsfläche; Zeichnen, PDF und Schaltplan sind Werkzeuge innerhalb der Seite und keine zweite App.

## Grundregel

Es wird **keine Funktion entfernt** und kein zweiter Katalog eingeführt.

Die bestehende ruhige Fassung (`Ruhig`) bleibt die Schaltstelle:

- `data-ruhig="an"` — neue reduzierte Schale.
- `data-ruhig="offen"` — dieselbe Schale, aber „Mehr" zeigt die vorhandenen zusätzlichen Ziele.
- `data-ruhig="aus"` — die bisherige volle Oberfläche bleibt unverändert verfügbar.

Dadurch bleiben Navigation, Register, Tastenkürzel, Datenmodelle und bestehende Handlungen dieselben.

## Desktop

### Linker Bereich

Der bisherige einzelne Seitenleisten-Streifen wird in der ruhigen Fassung optisch in zwei Teile geteilt:

1. **Bereichs-Rail** — die wichtigsten Wege als kompakte Ziele.
2. **Notizbücher & Seiten** — der vorhandene Seitenbaum als eigene Spalte.

Das entspricht dem Denkmodell „Bereich → Seite" und reduziert die sichtbare Konkurrenz zwischen Hauptnavigation und persönlichen Seiten.

### Kopfzeile

Die Kopfzeile bleibt bei Navigation, Pfad, Suche, KI, Favorit und Seitenmenü. Zusätzliche Aktionen bleiben über die vorhandene „Mehr"-/Seitenlogik erreichbar.

Die Suche steht im normalen Fluss der Kopfzeile und verhält sich nicht wie eine weitere schwebende Leiste.

### Menüband

Das vorhandene Menüband bleibt erhalten. Es wird in der ruhigen Fassung als kompakte Werkzeugschublade behandelt:

- Reiter bleiben sichtbar.
- Der aufgeklappte Inhalt ist deutlich als kontextbezogenes Werkzeugband getrennt.
- Einfügen, Zeichnen, Werkzeuge, Elektro und Ansicht verwenden weiterhin dieselben Registereinträge wie vorher.

### Echte Seiten

Eine echte Seite wird daran erkannt, dass `#title` vorhanden ist — dieselbe Unterscheidung verwendet Redion bereits im Menüband.

Solche Seiten bekommen auf dem Desktop eine ruhige Dokumentfläche mit:

- klarer Begrenzung,
- reduzierter Titelgröße,
- kompakter Seitenwerkzeugzeile,
- mehr optischer Trennung vom Navigations-Chrome.

Startansichten, Lernwelt, Bibliothek und andere Sonderansichten bleiben Vollflächen und werden nicht künstlich in ein „Papier" gezwungen.

## Telefon

Auf dem Telefon bleibt Redions bestehende Fünf-Wege-Navigation erhalten. Die neue Schale verändert vor allem Dichte und Hierarchie:

- kompakter Seitenkopf,
- randlose eigentliche Seite,
- vorhandene fünf Hauptwege als einzige feste Navigation,
- Werkzeugband als temporäre, kontextbezogene Fläche,
- keine zweite dauerhafte Aktionsleiste.

## Technische Umsetzung

Die eigentliche Gestaltung liegt in:

`quell/schale/stil/einfach.css`

Sie wird von:

`quell/schale/stil/anatomie.css`

über einen lokalen CSS-Import geladen. Das Stilblatt ist auf die vorhandene ruhige Fassung begrenzt; die volle alte Oberfläche bleibt dadurch als Rückfall erhalten.

Damit `redion-einzeldatei.html` weiterhin wirklich eine Einzeldatei bleibt, löst `bauen.mts` lokale CSS-Imports beim Bauen rekursiv auf. Externe CSS-Imports werden nicht verändert; Importkreise führen zu einem klaren Baufehler.

## Was bewusst noch nicht umgebaut wurde

Dieser Schritt ändert die **Schale**, nicht die Daten- oder Fachlogik. Folgende Vertiefungen können danach getrennt gebaut und geprüft werden:

1. Dokumentbibliothek noch stärker wie ein GoodNotes-Regal strukturieren.
2. A4/PDF beim Öffnen automatisch in einen fokussierten Dokumentmodus wechseln lassen.
3. Kontextleiste für Stift/Marker/Radierer direkt an Dokumentflächen binden.
4. Datenbanken noch stärker auf „Inhalt zuerst, Einstellungen unter •••" reduzieren.
5. KI-Einstieg auf einen Hauptknopf mit aufgabenbezogener Auswahl verdichten.
6. Eigene visuelle Prüfung für 1366×768, 1440×900, 390×844 und 430×932 ergänzen.

Wichtig bleibt: Diese Schritte sollen vorhandene Funktionen umordnen, nicht sie duplizieren oder löschen.
