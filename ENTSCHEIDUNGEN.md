# ENTSCHEIDUNGEN.md — was stand wo, was wurde gewählt, warum

Eine Zeile pro Fall. Diese Datei ist später mehr wert als der Code, weil man
an ihr sieht, **warum** etwas so ist, wie es ist.

Die Regel dahinter (aus der Arbeitsanweisung):

1. Erst prüfen, ob es wirklich ein Widerspruch ist — meist sind es zwei
   Detailtiefen derselben Sache; dann gilt die genauere.
2. Ein Screenshot schlägt einen Text.
3. Lassen sich beide Wege nebeneinander bauen, ohne dass es umständlicher
   wird: beide bauen.
4. Sonst den besseren wählen — weniger Klicks, weniger Zustände die
   kaputtgehen, näher am Screenshot, später erweiterbar.

---

## E1 · `NOTION-10000X-BESSER.md` Teil 4 gegen den Quelltext

**Was stand wo.** Die Bestandsaufnahme in Teil 4 (2. August) markiert sechs
Punkte als ✗ oder ◐, die im Quelltext gebaut sind:

| Punkt | Teil 4 | Quelltext |
|---|:--:|---|
| Pivot / Kreuztabellen | ✗ | `datenbanken/steuerung.js:204` `alsPivot` — Zeilen × Spalten × Werte × Rechnung × Prozent |
| Datenvalidierung | ✗ | `datenbanken/dienst.js:196–243` — `pflicht`, `eindeutig`, `muster` |
| Feldrechte | ✗ | Spaltenrechte in Oberfläche und Server, `test80`–`test84` |
| Simulator | ✗ | `datenbanken/probelauf/dienst.js` |
| Tests | ✗ | `datenbanken/pruefsaetze/dienst.js` |
| Eigene Formelfunktionen | ◐ | `formeln/laufzeit.js:709` `EIGENE`, `setzeBibliothek` |

**Ist es ein Widerspruch?** Nein — es ist ein Datum. `WAS-REDION-MEHR-KANN.md`
ist vom 3. August und nennt alle sechs als gebaut. Teil 4 ist einen Tag älter
und wurde beim Bauen nicht nachgezogen.

**Gewählt.** Der Quelltext gilt. Er ist die einzige Quelle, die nicht
veralten kann, weil sie das ist, was läuft. `LUECKEN.md` führt die sechs als
gebaut und markiert sie mit „⚠ Teil 4 überholt", damit niemand die alte
Tabelle noch einmal für bare Münze nimmt.

**Nicht getan:** Teil 4 überschrieben. Die Datei ist ein datierter Befund,
kein Verzeichnis — sie umzuschreiben würde die Spur verwischen, an der man
sieht, wann was entstand. `LUECKEN.md` ist ab jetzt der aktuelle Stand.

---

## E2 · Wie die Kataloge gezählt werden

**Was stand wo.** Die Prüflisten in der Doku nennen Stückzahlen (97
Blocktypen, 160 Kürzel, 125 Formeln). Um dagegen zu prüfen, muss man Redions
Zahlen kennen.

**Gewählt.** Die Register **laden und befragen**, nicht `grep`en — dieselbe
Technik wie `test88`/`test89` mit den Diensten. Ein `grep` über `id:` zählt
Kommentare, Beispiele und die Doku im Kopf der Datei mit.

**Warum es zweimal danebenging, und was daraus folgt.** Beide Male, weil die
Schnittstelle geraten statt nachgesehen wurde:

- `Register.tasten.alle()` liefert **Gruppen**, nicht Kürzel. Geraten: 12.
  Mit `flach()`: **127**.
- `Register.formeln.alle()` hängt an `Formula.namen()`. Ohne geladene
  Laufzeit kommt nur der beschriebene Teil. Geraten: 20. Wirklich: **158**.

Eine geratene Schnittstelle sieht aus wie eine erfüllte — sie liefert eine
Zahl, nur die falsche. Dasselbe war schon beim Schreiben von `test88`
passiert (`wert` statt `val`). Es ist offenbar der teuerste wiederkehrende
Fehler in diesem Projekt und steht deshalb hier.

---

## E3 · Wo die Einstellungen wohnen

**Was stand wo.** `CLAUDE.md` Regel 3: *„Neue Blockart, Ansicht, Eigenschaft,
Befehl, Kürzel, Einstellung = ein Objekt in der passenden `register/`-Datei."*
Gemessen: `register/einstellungen.js` hat **11** Einträge, die
Einstellungsseite zeichnet **143** Optionen in 24 Bereichen aus einer eigenen
Liste in `bereiche/einstellungen/ansicht/seite.js`.

**Ist es ein Widerspruch?** Ja, aber kein inhaltlicher: die Funktion ist da
und sogar reicher als Notions 111. Es ist die Regel, die nicht eingehalten
wird.

**Gewählt.** **Jetzt nicht umbauen.** 143 Optionen ins Register zu heben ist
ein Umzug ohne Verhaltensänderung — genau die Art Arbeit, die `CLAUDE.md`
einen eigenen Schritt nennt. Sie neben eine inhaltliche Änderung zu legen,
wäre der Fehler, vor dem dieselbe Datei warnt: *„ein Umzug, der Verhalten
ändert, ist kein Umzug, sondern zwei Änderungen gleichzeitig."*

Eingetragen als eigene Aufgabe. Der Gewinn ist echt, aber er ist Ordnung,
nicht Funktion — und deshalb kommt er nach dem, was der Mensch merkt.

---

## E4 · Kein SQL, keine echte Datenbank-Engine (Idee 2)

**Was stand wo.** Idee 2 der 36: Ansichten mit SQL definieren, auf Tabellen
und materialisierten Views aufbauen.

**Gewählt.** **Wird nicht gebaut.** Nicht aus Bequemlichkeit, sondern weil es
mit dem Kern der App unvereinbar ist: sie läuft per Doppelklick auf
`index.html`, ohne Bauschritt und ohne Abhängigkeit. Eine SQL-Engine im
Browser hiesse SQLite über WebAssembly — eine Abhängigkeit von mehreren
hundert Kilobyte, die `CLAUDE.md` ausdrücklich ausschliesst.

**Was stattdessen.** Idee 34 aus derselben Liste — eine **lesbare
Abfragesprache** — löst dasselbe Problem für dieselben Leute, ohne die
Architektur zu brechen. Sie steht in `LUECKEN.md` als **C2**. Die Idee wird
also nicht verworfen, sondern auf den Weg gebracht, der hier gangbar ist.

---

## E5 · Die 62 Integrationen

**Was stand wo.** Teil 13 nennt 62 Integrationen. Redion hat 8.

**Gewählt.** **Nicht als Fleissarbeit einplanen.** Der Unterschied ist keine
Frage des Aufwands: die meisten der 62 verlangen OAuth mit einem
Anbietergeheimnis, und ein Geheimnis im Quelltext wäre für alle dasselbe —
`CLAUDE.md` verbietet das ausdrücklich, und zwar zu Recht.

Ohne Server geht nur, was einen **persönlichen** Schlüssel akzeptiert, den
der Mensch selbst einträgt. Das ist die Bauart, die Redion für die KI schon
benutzt.

Der ehrliche Eintrag in `LUECKEN.md` lautet deshalb nicht „54 fehlen",
sondern „54 fehlen, davon gehen ohne Server nur die mit persönlichem
Schlüssel". Welche das sind, ist noch nicht durchgezählt — das gehört vor das
Bauen, nicht danach.
