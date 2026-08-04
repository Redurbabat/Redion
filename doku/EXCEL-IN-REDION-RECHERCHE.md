# Excel in Redion — was schon geht, was fehlt, was zuerst kommt

Grundlage für die Entscheidung, wie Redion Excel-ähnliches Rechnen bekommt.

**Die Leitplanke steht vorher fest:** Redion soll *Excel-Probleme lösen, nicht
Excel klonen.* Ein Nachbau wäre zu gross, zu komplex, schwer testbar — und
würde verwässern, was Redion ausmacht.

---

## Das überraschende Ergebnis

Redions Formelmaschine kann **mehr Excel, als sie zugibt.**

Von den 63 Funktionen des Startpakets sind **37 bereits da und laufen** — aber
**keine einzige unter ihrem deutschen Namen.**

| | |
|---|--:|
| Funktionen im Register | **158** |
| davon ohne Beschreibung | 129 |
| davon ohne Implementierung | **0** |
| Excel-Startpaket abgedeckt | **37 von 63** |
| davon unter deutschem Namen erreichbar | **0** |

Gemessen, nicht geschätzt: Register geladen, Laufzeit geladen, Namensliste
gegen das Startpaket abgeglichen. `Register.formeln.abgleich()` meldet
`ohneFunktion: []` — es gibt keine dokumentierte Funktion ohne Code.

**Eine Falle dabei, die beim ersten Zählen zuschlug.** Die Namensliste des
Registers enthält zweierlei: Funktionen, die man mit Argumenten aufruft
(`sum(1,2,3)`), und **Spaltenaggregate**, die nur in einer Datenbankspalte
gelten (`average` antwortet ausserhalb mit „Das geht nur in einer
Datenbankspalte"). Für `MITTELWERT` ist deshalb nicht `average` das
Gegenstück, sondern `mean`.

Nachgezählt gegen `Formula.F` — also gegen das, was wirklich aufrufbar ist —
statt gegen die Registerliste. Ergebnis unverändert 37; nur ein Paar musste
korrigiert werden.

**Was das heisst.** Wer aus Excel kommt und `=SUMME(A1:A10)` tippt, bekommt
einen Fehler. `sum` hätte funktioniert. Die Arbeit liegt also nicht dort, wo
man sie vermutet: es fehlen nicht 63 Funktionen, es fehlen 26 Funktionen und
**37 Namen**.

---

## Was schon da ist

| Gruppe | da | Namen im Code |
|---|--:|---|
| Mathematik | 10/15 | `sum` `mean` `min` `max` `abs` `sqrt` `mod` `round` `floor` `ceil` |
| Logik | 5/6 | `if` `ifs` `and` `or` `not` |
| Datum | 7/9 | `today` `now` `date` `year` `month` `day` `week` |
| Text | 11/16 | `length` `slice` `trim` `upper` `lower` `replaceall` `replace` `format` `tonumber` `concat` `join` |
| Info | 1/4 | `empty` |
| Suche/Verweis | 3/13 | `match` `sort` `unique` |

## Was fehlt

```txt
Mathematik     PRODUKT · ANZAHL · ANZAHL2 · POTENZ · GANZZAHL
Logik          WENNFEHLER
Datum          ZEIT · WOCHENTAG
Text           LINKS · RECHTS · SÄUBERN · SUCHEN · FINDEN
Info           ISTZAHL · ISTTEXT · ISTFEHLER
Suche/Verweis  ZÄHLENWENN · ZÄHLENWENNS · SUMMEWENN · SUMMEWENNS ·
               MITTELWERTWENN · SVERWEIS · WVERWEIS · XVERWEIS ·
               INDEX · FILTER
```

Die Verteilung ist bemerkenswert: **Suche/Verweis ist mit 3 von 13 die
schwächste Gruppe** — und genau sie trägt in Excel die eigentliche Arbeit.
`SVERWEIS` und `SUMMEWENN` sind das, wofür Menschen Excel überhaupt öffnen.

---

## Zwei Dinge, die nicht im Weg stehen

Vor der Planung nachgesehen, statt es später zu merken:

**1 · Der Zerteiler kennt Umlaute schon.**

```js
const istBuchstabe = c => /[A-Za-zÄÖÜäöüß_]/.test(c);
```

`LÄNGE(…)` wird also korrekt als Name gelesen — er lässt sich nur nicht
auflösen. Für `SÄUBERN`, `ZÄHLENWENN` und `LÄNGE` ist nichts anzupassen.

**2 · Namen werden vor dem Nachschlagen kleingeschrieben.**

```js
const klein = name.toLowerCase();
…
return { k: 'call', name: klein, args };
```

Ein Alias ist deshalb eine Zeile: `F.summe = F.sum`. Gross- und
Kleinschreibung ist automatisch egal — `SUMME`, `Summe` und `summe` landen
alle am selben Ort.

**Die Folge für die Planung:** Die 37 deutschen Namen sind kein Projekt,
sondern eine Tabelle. Sie bringen mehr für den Excel-Umsteiger als die
nächsten zehn neuen Funktionen.

---

## Was Redion hat, das Excel nicht hat

Wichtig für die Frage, was hier *nicht* nachgebaut werden muss:

- **Kein `eval()`, kein `Function()`.** Eigener Zerteiler, eigener Parser,
  eigene Laufzeit. Formeln haben keine Seiteneffekte und können keinen
  fremden Code ausführen — der Grund, warum Makro-Viren hier keine Kategorie
  sind.
- **20 Funktionen über Notion hinaus**, u. a. `runningSum`, `rank`,
  `percentOfTotal`, `delta`, `businessDaysBetween`, `groupBy`, `reduce`.
- **Zeilen sind Seiten.** Eine Formel rechnet über strukturierte Daten, nicht
  über ein Raster aus Zellen — das ist der Punkt, an dem Redion und Excel
  wirklich verschieden sind, und er soll verschieden bleiben.

---

## Der Unterschied, der die Architektur bestimmt

|  | Excel | Redions Datenbanken |
|---|---|---|
| Grundeinheit | Zelle | Zeile (= Seite) |
| Bezug | `A1`, `B2:C10` | Spaltenname |
| Formel gilt für | genau eine Zelle | die ganze Spalte |
| Abhängigkeiten | Graph über Zellen | Spalte → Spalte |
| Zirkelbezug | möglich, wird erkannt | kann kaum entstehen |

Das ist kein Mangel auf einer der beiden Seiten, sondern **zwei verschiedene
Werkzeuge.** Eine Budgetliste mit Zwischensummen an beliebigen Stellen ist im
Zellenmodell natürlich und im Zeilenmodell umständlich. Eine Aufgabenliste,
in der jede Zeile eine Seite mit Unterseiten ist, ist genau umgekehrt.

**Empfehlung: beide behalten, nicht eins ins andere pressen.**

```txt
Spreadsheet-Block        freies Raster, A1-Bezüge, Excel-Funktionen
Datenbank + Formelspalte bleibt wie sie ist
```

Ein Spreadsheet-Block ist ein Block wie jeder andere — er passt ohne
Sonderfall in Editor, Sicherung und `.redion`. Das Datenmodell dafür
(`Workbook`, `Sheet`, `Cell`, `Range`) ist in der Funktionsplanung schon
benannt.

---

## Empfohlene Reihenfolge

Nach Nutzen je Aufwand, nicht nach Vollständigkeit.

### ~~X1 · Die 37 deutschen Namen~~ · erledigt am 4. August 2026

Eine Aliastabelle. Kein neuer Code, keine neue Logik, kein Risiko für
Bestehendes. Aus 0 % deutscher Abdeckung wurden 59 %.

Die Namen stehen als **Namenstabelle**, die ganz zu Beginn der Auswertung
greift. Beschrieben stehen sie im Register, damit die Suche im Formeleditor
sie findet.

**Der erste Wurf war falsch.** Er schrieb `F.summe = F.sum` — Zeiger auf
dieselben Funktionen. `evaluate` behandelt aber dreizehn Namen besonders,
*bevor* es in die Funktionstabelle schaut, darunter `if` und `ifs` mit ihrer
faulen Auswertung. Ein Alias, der nur in der Tabelle steht, läuft daran
vorbei:

```txt
if(true, 1, teuer())      rechnete teuer() nicht
WENN(true, 1, teuer())    rechnete es
```

Beide gaben `1` zurück — deshalb fiel es nicht auf. Die Regel daraus steht in
`ENTSCHEIDUNGEN.md` E24: ein Zweitname wird am **Anfang** der Auswertung auf
seinen Erstnamen zurückgeführt, nicht am Ende in die Funktionstabelle
gehängt.

Gehalten von `pruefungen/lauf/test106.mjs`: 80 Prüfungen auf **gleiches
Ergebnis** — und, seit diesem Fund, auf **gleiche Auswertung**: der nicht
genommene Zweig darf nicht rechnen. Das findet kein Ergebnisvergleich.

### X2 · Die 10 fehlenden Suche/Verweis-Funktionen

`SVERWEIS` · `XVERWEIS` · `INDEX` · `FILTER` · `ZÄHLENWENN(S)` ·
`SUMMEWENN(S)` · `MITTELWERTWENN(S)`

Die schwächste Gruppe und zugleich die wichtigste. Auf Listen arbeiten sie
auch ohne Zellraster — Redion hat `filter`, `find`, `map` bereits, sie
brauchen nur die Excel-Fassade.

### X3 · Die 16 übrigen Einzelfunktionen

`PRODUKT` `ANZAHL` `ANZAHL2` `POTENZ` `GANZZAHL` `WENNFEHLER` `ZEIT`
`WOCHENTAG` `LINKS` `RECHTS` `SÄUBERN` `SUCHEN` `FINDEN` `ISTZAHL`
`ISTTEXT` `ISTFEHLER`

Alle klein, alle ohne Abhängigkeit voneinander. Gute Arbeit für zwischendurch.

### X4 · Die 129 fehlenden Beschreibungen

Nicht Excel, aber derselbe Nutzen: eine Funktion, die niemand findet, ist
fast wie nicht vorhanden. `Register.formeln.abgleich()` nennt sie beim Namen.

### X5 · Spreadsheet-MVP

Erst danach. Zellen, `A1`-Bezüge, Bereiche, Neuberechnung, Zirkelbezüge,
Fehlerwerte. Der grösste Brocken und der einzige mit echtem Architekturrisiko
— deshalb zuletzt in dieser Reihe, nicht zuerst.

---

## Was ausdrücklich nicht kommt

- **Excel 1:1.** Über 500 Funktionen, davon die meisten nie benutzt.
- **VBA / Makros.** Fremder Code im Dokument ist genau die Angriffsfläche,
  die Redions Formelsprache bewusst nicht hat. Wiederkehrende Arbeit läuft
  über Automationen.
- **Grosse fremde Tabellen-Bibliotheken** ohne Prüfung. Die Einzeldatei wiegt
  heute 2,5 MB; sie muss auf einem Telefon offline laufen.

---

## Offene Fragen für die Entscheidung

1. **Ein Alias oder zwei Einträge?** Soll `SUMME` als eigener Registereintrag
   mit eigener Beschreibung erscheinen, oder als Zweitname von `sum`? Für die
   Suche ist ein eigener Eintrag besser, für die Pflege ein Zweitname.
2. **Was tut `SVERWEIS` ohne Zellraster?** Auf einer Datenbankspalte ist die
   Bedeutung klar; auf einem Bereich `A1:C10` braucht es erst den
   Spreadsheet-Block. Möglich: X2 auf Listen beschränken und beim MVP
   erweitern.
3. **Fehlerwerte.** Excel hat `#WERT!`, `#BEZUG!`, `#DIV/0!`. Redion meldet
   heute Text. Für `WENNFEHLER` und `ISTFEHLER` braucht es einen echten
   Fehlerwert im Datenmodell — das ist eine Änderung an der Laufzeit, keine
   neue Funktion.

Frage 3 ist die einzige mit Architekturwirkung. Sie sollte **vor** X2
entschieden werden, weil `WENNFEHLER` sonst zweimal gebaut wird.
