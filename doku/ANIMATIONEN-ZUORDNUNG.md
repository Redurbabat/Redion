# Animationen und KI-Eingabe — 10. September 2026

## Was sich im KI-Bereich geändert hat

Das Eingabefeld folgt Redurs Bildvorlage: ein großer, abgerundeter Kasten,
mehrzeiliger Text oben und unten Anhängen, Modus, Modellwahl, Mikrofon und
der blaue, runde Senden-Knopf. Es werden weiterhin die tatsächlich verfügbaren
Modelle und die vorhandenen Modi Standard/Fragen angeboten. Keine erfundene
Modellbezeichnung oder Freigabefunktion aus der Bildvorlage wurde eingebaut.

„Werkzeuge & Kontext“ ist zunächst zugeklappt. Darin stehen die echten
Quellen-Schalter und vier Gruppen: Erstellen, Text bearbeiten, Lernen &
planen, Assistenten & Verlauf. Die zwölf bisherigen Aktionen behalten ihre
Kennungen und Funktionen. Auch die Rückfrage vor der Websuche bleibt erhalten.

**Die Originalgestaltung von „Datenbank bauen“ und „Seite aufbauen“ bleibt
unverändert.** Die bestehende `Funkel`-Funktion wurde auf die übrigen zehn
Aktionen und die zwei Einstellungsaktionen erweitert. Ihre Buchstaben,
Symbole, Rückfragen und Klickhandlungen bleiben erhalten.

## Wo die CSS-Vorlagen verwendet werden

Quelle: Redurs Datei `redion animationen code.css` (5.396 Zeilen).
Die Zeilen beziehen sich auf diese Originaldatei, nicht auf `motion.css`.
Die Tabelle unterscheidet Wiederverwendung und vereinfachte Übertragung:
**Sie bedeutet nicht, dass jede der 5.396 Zeilen oder jede Demo vollständig
eins zu eins eingebaut wurde.**

| Vorlage / Originalzeilen | Ort in Redion | Umsetzung |
|---|---|---|
| 3D-Ordner, 1–427 | Ordnerdeckel in der Bibliothek | Fünf dekorative Blätter fächern bei Hover/Tastaturfokus auf. Ordner öffnen weiterhin echte Inhalte; der bestehende Ordnerblick bleibt. |
| Einstellungsregler, 438–487 | KI → Werkzeuge → Quellen & Modus | Drei kleine Regler bewegen ihre Punkte beim Anfassen. |
| Lichtkarte, 500–885 | Elektrotechnik-Fachkarten | Perspektivisches Anheben und wandernder Lichtreflex, ohne neue Schalterfunktion. |
| Kreisende Verlaufspille, 892–1081 | Fokusrahmen der KI-Eingabe | Mehrfarbiger Lichtlauf am Rand; ein begrenzter Durchlauf beim Fokussieren. |
| Buchstaben-Glühknopf, 1097–1409 | Alle zwölf KI-Aktionen, zwei KI-Einstellungsaktionen | **Bestehenden Originaleffekt wiederverwendet**, die zwei Bau-Knöpfe nicht neu gestaltet. |
| Flüssiger Polygonlader, 1420–1558 | Tatsächliche KI-Aktivitätszeile | Vereinfachter gegenläufiger, sich verformender Doppelring. Kein Lader im Leerlauf. |
| Verlaufsschalter, 1571–1838 | Vorhandene Einstellungsschalter | Bestehenden Verlauf und Zustandswechsel beibehalten, Licht auf dem Schieber ergänzt. |
| 3D-Karussell, 1847–1909 | Leere Bibliotheksansicht | Drei abstrakte Karten kippen räumlich beim Anfassen; keine angeblichen Dokumente und keine Dauerrotation. |
| Mechanischer Glasknopf, 1920–2019 | „Übernehmen“ in Eingabedialogen | Innere Lichtkante, Schatten und kurzer Druckweg. |
| Gekippte Statistik, 2030–2699 | Metrikkarten im Lernbereich | Lichtreflex, geringer Perspektivwechsel und Einstieg der **echten** Kennzahl. Keine erfundenen Diagramme. |
| Leuchtende Statuskapsel, 2711–2829 | KI arbeitet … | Konischer Farbrand hinter dem vorhandenen Status, mit Text und Vorlesefunktion. |
| Holografisches Ticket, 2830–3455 | Papier im PDF-Druck-/Exportstatus | Holografischer Lichtdurchlauf; vorhandener Papiereinzug und tatsächlicher Auftragszustand bleiben. |
| Glaskugel, 3470–4142 | Zeichen neben „Redion KI“ | Frostige Farbkugel mit Ringbewegung beim Anfassen der Kopfzeile. Rein dekorativ, keine Verifizierungsanzeige. |
| Filamentschalter, 4158–4790 | Schaltplan → Strom eingeschaltet | Warmes Filamentlicht ausschließlich bei `.sp-start.an`; die Simulation selbst wurde nicht geändert. |
| Mechanischer Dreierblock, 4796–5396 | Anhängen, Diktieren, Senden | Gemeinsamer kurzer Druckeffekt und eingelassener Schatten; getrennte zugängliche Schaltflächen statt eines neuen Players. |

Nicht übernommen sind globale `body`-Resets, externe Schriftimporte,
mehrfach gleichnamige Keyframes und sich gegenseitig überschreibende
`.card`-/`.button`-Regeln. Sie gehören zu voneinander unabhängigen Demos
und würden als Gesamtimport die App verändern oder offline fehlen.

Auch die vollständigen Demo-Szenen (Ticketautomat mit Barcode, mechanischer
Hebel, Statistik-Odometer und endlos rotierender Kartenring) sind **nicht**
als eigene neue Funktionen eingebaut. Ihre passenden Gestaltungsmotive
wurden wie oben beschrieben übertragen. Das ist keine Zusage, den gesamten
Originalcode bereits vollständig umgesetzt zu haben.

## Technik und Bedienbarkeit

- `quell/schale/stil/motion.css`: neue Gestaltung und gekapselte `rmo-*`-Effekte.
- `src/schale/bedienung/motion.ts`: dekorative, vor Vorlesern verborgene Elemente;
  idempotenter Start, Betrachtung neuer DOM-Teilbäume statt wiederholter Vollscans.
- `src/bereiche/ki/dienst.ts`: vorhandene Knoten gruppieren, Quellenzustand
  mit `aria-pressed`, unveränderte Handlungen, verständlicher Modellname auch
  bei visueller Kürzung.
- Einbindung in `index.html`, Offline-Grundstock und gebaute Einzeldatei.
- Keine neuen Bibliotheken, Schriftabrufe, Telemetrie oder KI-Anbieter.
- Hauptwege der Eingabe mindestens 44 × 44 px; kompakte Nebenwege in der
  aufklappbaren Werkzeugliste. Die zwei ausdrücklich geschützten Bau-Knöpfe
  behalten ihre Originalmaße (§37-Ausnahme auf Redurs ausdrücklichen Wunsch).
- Reduzierte Bewegung wird respektiert. Fachkarten springen auf Touch nicht
  durch einen klebenden Hoverzustand. Die Eingabe bleibt bei kleiner Höhe erreichbar.

## Nachprüfen

`node pruefungen/lauf/test492.mts` prüft die echte Oberfläche bei 1280, 390 und
360 px, eine kleine Höhe von 480 px, Rückfragen, Web-Einwilligung, Quellen,
Modellmenü, Tastatur, Originalknopf, Ordner und direkten Datei-/Einzeldateistart.
Die Rotprobe erfolgte zunächst mit fehlendem Bewegungsstil und -modul.

`test436` hält weiterhin die bisherigen Funkel-, Ordnerblick- und
Laderzusagen fest; die alte Erwartung „nur zwei KI-Knöpfe glimmen“ wurde
entsprechend Redurs Auftrag auf genau zwölf geändert.

Bildprüfungen liegen lokal in `bilder/ai-*.png` sowie `bilder/motion-*.png`.
`node bilder.mts funkel rechner` öffnet für spätere Vergleiche die Werkzeugliste.
Diese Prüfungen senden keinen Prompt und laden kein Modell. Sie ersetzen
keinen vollständigen Gesamtlauf und keinen Test auf einem physischen iPhone.
