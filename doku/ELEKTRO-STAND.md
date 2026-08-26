# Die hundert Elektro-Punkte — Stand mit Belegen

Redur hat hundert Punkte aufgeschrieben: Schaltpläne, Fachzeichen, PDFs,
Berechnungen, Reihen- und Parallelschaltung, Messen, Steuerungen. Ausdrücklich
NICHT dabei: KI und allgemeine Arbeitsbereich-Sachen.

Diese Datei sagt, wo jeder Bereich steht — mit der Datei, die es tut, und dem
Prüflauf, der es misst. Wie `doku/AUFTRAG-STAND.md`: Belege statt Absichten.

Drei Zeichen: ✅ gebaut und geprüft, ◐ gebaut und teilweise, ✗ offen.

---

## 1–10 · Fachzeichen ✅

| Was | Wo | Prüflauf |
|-----|-----|----------|
| Symbolregister, 100 Zeichen in 15 Gruppen | `src/register/fachzeichen.ts` | test238 |
| Anschlüsse mit Nummern und Lage | `anschlussLage`, `masse` | test238 |
| Schweizer Schemata 0/1/2/3/6 | Gruppe `ch-schema` | test238 |
| Schweizer Bauplanzeichen (T13, T23, Minuterie …) | Gruppe `ch-bauplan` | test238 |
| Zeichen benennen, erkennen, zuordnen | `aufgaben.ts`, drei Arten | test241 |
| Kennbuchstaben | `kennbuchstabe` | test241 |

## 11–40 · Schaltplan zeichnen ✅

| Was | Wo | Prüflauf |
|-----|-----|----------|
| Plan als Blockart, Bauteile setzen und ziehen | `bereiche/bloecke/arten/schaltplan.ts` | test239 |
| Leitungen mit Fang, Knickpunkten, Verbindungspunkten | `fangeAnschluss`, `leitungPfad` | test239 |
| Raster, Ebenen (Plan/Aufgabe/Lösung), Beschriftungen | `EBENEN_VORGABE`, `plan.texte` | test239 |
| Betriebsmittelkennzeichen, automatisch fortlaufend | `naechstesBmk` | test239 |
| Stromsimulation mit echten Werten (MNA) | `bereiche/elektro/simulation.ts` | test239, test243 |
| Messwerte am Bauteil, fliessender Strich | `alsSvg` mit `strom` | test239 |

Die Simulation rechnet Knotenspannungen, nicht Animation: E187. Was sie
NICHT kann, steht in derselben Entscheidung und in E193 — der Strom durch
eine einzelne ideale Leitung ist physikalisch nicht bestimmt.

## 41–50 · PDF ✅

| Was | Wo | Prüflauf |
|-----|-----|----------|
| PDF-Seiten öffnen, durchblättern, beschriften | `bereiche/pdf/*` (E103–E110) | test192, test242 |
| Freihand, Linien, Pfeile, Text | `Marken`, Arten `stift`/`line`/`arrow`/`text` | test242 |
| Fachzeichen auf die Seite setzen | `Marken`, Art `zeichen` (E191) | test242 |
| Ausschnitt als Lernkarte | `seite.ts`, `alsLernkarte` (E191) | test242 |
| Ebenen für Aufgabe und Lösung | `Schaltplan.EBENEN_VORGABE` | test239 |

## 51–60 · Aufgaben zu Schaltungen ✅

| Punkt | Was | Wo |
|-------|-----|-----|
| 51 | Fehlendes Bauteil ergänzen | `planLuecke` |
| 52 | Fehlende Leitung | `planLeitung` (E192) |
| 53 | Fehler im Plan suchen | `planFehler` (E192) |
| 55 | Schaltung erkennen | `planFunktion` |
| 57 | Betriebsmittel im Plan finden | `bmkBenennen` |
| 59 | Stromweg selbst markieren | `planStromweg` (E193) |
| 60 | Steuer- und Hauptstromkreis | `kreisZuordnen` (E193) |

Prüflauf `test243`, 70 Punkte. Er rechnet jede Antwort mit EIGENEM Werkzeug
nach, nicht mit dem des Aufgabenmoduls.

## 61–90 · Rechnen ✅

49 Formeln in 14 Kapiteln: `src/register/elektroformeln.ts`.

| Was | Wo | Prüflauf |
|-----|-----|----------|
| Formelheft, beim Zeichnen einblendbar, verschiebbar | `bereiche/elektro/formelheft.ts` (E188) | test240 |
| Alle Seiten, Favoriten | `formelheft.ts` | test240 |
| Rechnen mit Zwischenschritten | `aufgaben.ts`, `rechnen` | test241 |
| Einheiten umrechnen | `umrechnen` | test241 |
| Formeldreieck aus der Schreibweise | `lernbilder.ts`, `ausSchreibweise` (E190) | test240 |
| Sinuskurve mit Scheitel- und Effektivwert | `lernbilder.ts`, `sinusFlaeche` | test240 |

Diese dreissig Punkte sind über das Formelregister abgedeckt und nicht
einzeln im Code als Punktnummer vermerkt — anders als die Aufgabenpunkte, wo
jede Art ihre Nummer trägt. Wer nachzählen will, zählt Formeln, nicht
Kommentare.

## 91–100 · Lernen, prüfen, arbeiten ✅

| Punkt | Was | Wo |
|-------|-----|-----|
| 91–96 | Üben mit Statistik je Art, schwächste Art zuerst | `arbeitsplatz.ts`, `schwaeche` |
| 97 | Erklärung nach dem Antworten, Rechenweg | `aufgabeHtml` |
| 98 | Richtig messen — wo das Messgerät hingehört | `messenWo` |
| 99 | Prüfungsmodus mit Note und Startwert | `pruefungStarten`, `auswerten` |
| 100 | Arbeitsplatz: Aufgaben, Plan, Notizen nebeneinander | `arbeitsplatz` |

Note nach Schweizer Skala: `1 + 5 · richtig / gesamt`.

---

## Was bewusst NICHT gebaut ist

**Schalter werden immer in derselben Stellung gezeichnet** (L59). Die Frage
sagt „S1: geschlossen", das Bild zeigt S1 offen. Gedruckte Lehrmittel machen
es genauso — mit einer Stellungstabelle neben dem Plan —, aber schön ist es
nicht. Was es kostet, steht in L59.

**Keine KI im Elektro-Bereich.** Ausdrücklich ausgenommen. Die Aufgaben
werden gewürfelt und gerechnet, nicht erzeugt; die Lösungen kommen aus
`Stromfluss.rechne` und aus dem Formelregister.

**Kein fremdes Lehrmittel im Verzeichnis.** Redion liefert das Werkzeug,
nicht den Inhalt. Ein Ausschnitt aus einem gekauften Buch in die eigene
Karteikarte auf dem eigenen Rechner ist Privatgebrauch; er geht an keinen
Server und kommt nicht ins Verzeichnis (E188, E191).
