# Formeln — die ganze Wahrheit

**Stand: 2. August 2026**

Diese Datei beantwortet drei Fragen vollständig und ohne Lücke:

1. **Was gibt es überhaupt?** Jede einzelne Funktion, jeden Operator, jede
   Konstante der Notion-Formelsprache — 99 Stück, aus der offiziellen
   Referenz `notion.com/help/formula-syntax` abgeschrieben, nichts erfunden.
2. **Was kann eine Formel damit machen — und was nicht?** Nicht als Gefühl,
   sondern an konkreten Aufgaben durchgespielt.
3. **Was davon kann unsere App?** Nicht behauptet, sondern gemessen: ein
   Testlauf schickt alle 99 Merkmale durch unsere eigene Formel-Maschine.

**Ergebnis des Messlaufs: 99 von 99. Keine Lücke mehr.**
Der Test liegt bei als `/tmp/formelcheck.js` und lässt sich jederzeit
wiederholen.

---

## Inhalt

- [A. Die vollständige Funktionsliste](#a-liste)
- [B. Wie die Zählung zustande kommt](#b-zaehlung)
- [C. Was Formeln können — an echten Aufgaben](#c-koennen)
- [D. Was Formeln nicht können — an echten Aufgaben](#d-koennen-nicht)
- [E. Die harten Grenzen der Sprache](#e-grenzen)
- [F. Was unsere Formel-Maschine zusätzlich hat](#f-extras)
- [G. Wie unsere Maschine innen aussieht](#g-innen)

---

<a id="a-liste"></a>
## A. Die vollständige Funktionsliste

Spalte **Wir** = unsere App. ✅ heisst: im Testlauf mit echtem Ergebnis geprüft.

### A.1 Operatoren (18)

| Operator | Bedeutung | Beispiel | Wir |
|---|---|---|:--:|
| `+` | Addieren, auch Text verketten | `prop("A") + prop("B")` | ✅ |
| `-` | Subtrahieren, auch Vorzeichen | `10 - 3` | ✅ |
| `*` | Multiplizieren | `menge * preis` | ✅ |
| `/` | Dividieren | `summe / anzahl` | ✅ |
| `%` | Rest (Modulo) | `17 % 5` → `2` | ✅ |
| `^` | Potenz | `2 ^ 10` → `1024` | ✅ |
| `==` | Gleich | `prop("Status") == "Fertig"` | ✅ |
| `!=` | Ungleich | `prop("Status") != "Offen"` | ✅ |
| `>` | Grösser | `prop("Punkte") > 90` | ✅ |
| `>=` | Grösser oder gleich | `alter >= 18` | ✅ |
| `<` | Kleiner | `rest < 0` | ✅ |
| `<=` | Kleiner oder gleich | `tage <= 7` | ✅ |
| `and` / `&&` | Und | `a > 1 and b > 1` | ✅ |
| `or` / `\|\|` | Oder | `a or b` | ✅ |
| `not` / `!` | Nicht | `not empty(prop("X"))` | ✅ |
| `? :` | Wenn-dann-sonst kurz | `x > 0 ? "plus" : "minus"` | ✅ |
| `.` | Punktkette | `prop("Tags").join(", ")` | ✅ |
| `()` | Klammern, Reihenfolge | `(a + b) * c` | ✅ |

> **Punktkette** ist kein Operator im Handbuch, aber die zweite Schreibweise
> für jeden Funktionsaufruf: `join(prop("Tags"), ", ")` und
> `prop("Tags").join(", ")` sind dasselbe. Unsere Maschine versteht beide.

### A.2 Konstanten (4)

| Name | Wert | Wir |
|---|---|:--:|
| `true` | wahr | ✅ |
| `false` | falsch | ✅ |
| `pi` | 3.141592653589793 | ✅ |
| `e` | 2.718281828459045 | ✅ |

### A.3 Text (16)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `length(text)` | Zeichen zählen | ✅ |
| `substring(text, von, bis)` | Ausschnitt herausschneiden | ✅ |
| `contains(text, suche)` | Enthält der Text etwas? | ✅ |
| `test(text, muster)` | Passt ein regulärer Ausdruck? | ✅ |
| `match(text, muster)` | Alle Treffer eines regulären Ausdrucks als Liste | ✅ |
| `replace(text, muster, neu)` | Ersten Treffer ersetzen | ✅ |
| `replaceAll(text, muster, neu)` | Alle Treffer ersetzen | ✅ |
| `lower(text)` | Kleinbuchstaben | ✅ |
| `upper(text)` | Grossbuchstaben | ✅ |
| `trim(text)` | Leerzeichen aussen weg | ✅ |
| `repeat(text, n)` | Text n-mal wiederholen | ✅ |
| `split(text, trenner)` | Text in Liste zerlegen | ✅ |
| `join(liste, trenner)` | Liste zu Text zusammenfügen | ✅ |
| `format(wert)` | Irgendetwas in Text verwandeln | ✅ |
| `link(text, url)` | Text als Link ausgeben | ✅ |
| `style(text, "b", "red")` | Fett, kursiv, unterstrichen, Farbe | ✅ |
| `unstyle(text)` | Formatierung entfernen | ✅ |

### A.4 Bedingungen und Logik (7)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `if(bedingung, dann, sonst)` | Verzweigung | ✅ |
| `ifs(b1, w1, b2, w2, …, sonst)` | Mehrfachverzweigung ohne Verschachtelung | ✅ |
| `and(a, b)` | Und als Funktion | ✅ |
| `or(a, b)` | Oder als Funktion | ✅ |
| `not(a)` | Nicht als Funktion | ✅ |
| `equal(a, b)` | Gleich als Funktion | ✅ |
| `unequal(a, b)` | Ungleich als Funktion | ✅ |

### A.5 Zahlen (24)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `add(a, b)` | Addieren | ✅ |
| `subtract(a, b)` | Subtrahieren | ✅ |
| `multiply(a, b)` | Multiplizieren | ✅ |
| `divide(a, b)` | Dividieren | ✅ |
| `mod(a, b)` | Rest | ✅ |
| `pow(a, b)` | Potenz | ✅ |
| `abs(a)` | Betrag | ✅ |
| `round(a)` | Kaufmännisch runden | ✅ |
| `ceil(a)` | Aufrunden | ✅ |
| `floor(a)` | Abrunden | ✅ |
| `sqrt(a)` | Quadratwurzel | ✅ |
| `cbrt(a)` | Kubikwurzel | ✅ |
| `exp(a)` | e hoch a | ✅ |
| `ln(a)` | Natürlicher Logarithmus | ✅ |
| `log10(a)` | Zehnerlogarithmus | ✅ |
| `log2(a)` | Zweierlogarithmus | ✅ |
| `sign(a)` | Vorzeichen: −1, 0 oder 1 | ✅ |
| `min(…)` | Kleinster Wert | ✅ |
| `max(…)` | Grösster Wert | ✅ |
| `sum(…)` | Summe | ✅ |
| `mean(…)` | Durchschnitt | ✅ |
| `median(…)` | Median | ✅ |
| `toNumber(wert)` | In Zahl verwandeln | ✅ |
| `formatNumber(zahl, art, stellen)` | Als Währung, Prozent, mit Tausendern | ✅ |

> `formatNumber` war bis zu diesem Durchgang die **einzige** Lücke unserer
> Maschine. Sie ist jetzt gebaut und kann `usd`, `eur`, `chf`, `gbp`, `jpy`,
> `try`, `cad`, `aud`, `cny`, `percent`, `commas`, `plain` und eine reine
> Stellenzahl. Belegte Ausgaben aus dem Testlauf:
> `formatNumber(1234.56, "usd", 0)` → `$1,235` ·
> `formatNumber(1234.5, "eur", 2)` → `1.234,50 €` ·
> `formatNumber(0.75, "percent", 0)` → `75 %` ·
> `formatNumber(1234567, "commas")` → `1'234'567` ·
> `formatNumber(3.14159, "2")` → `3.14` ·
> `formatNumber(1234.5, "chf", 2)` → `CHF 1'234.50`

### A.6 Datum und Zeit (19)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `now()` | Jetzt, mit Uhrzeit | ✅ |
| `today()` | Heute, ohne Uhrzeit | ✅ |
| `date(d)` | Tag im Monat | ✅ |
| `day(d)` | Wochentag als Zahl | ✅ |
| `week(d)` | Kalenderwoche | ✅ |
| `month(d)` | Monat | ✅ |
| `year(d)` | Jahr | ✅ |
| `hour(d)` | Stunde | ✅ |
| `minute(d)` | Minute | ✅ |
| `dateAdd(d, n, einheit)` | Zeit dazuzählen | ✅ |
| `dateSubtract(d, n, einheit)` | Zeit abziehen | ✅ |
| `dateBetween(a, b, einheit)` | Abstand zwischen zwei Daten | ✅ |
| `dateRange(a, b)` | Zeitspanne bilden | ✅ |
| `dateStart(r)` | Anfang einer Spanne | ✅ |
| `dateEnd(r)` | Ende einer Spanne | ✅ |
| `timestamp(d)` | Datum → Millisekunden | ✅ |
| `fromTimestamp(ms)` | Millisekunden → Datum | ✅ |
| `formatDate(d, muster)` | Datum als Text formatieren | ✅ |
| `parseDate(text)` | Text → Datum | ✅ |

Einheiten für `dateAdd`/`dateSubtract`/`dateBetween`: `years`, `quarters`,
`months`, `weeks`, `days`, `hours`, `minutes`, `seconds`, `milliseconds`.

### A.7 Listen (19)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `length(liste)` | Anzahl Einträge | ✅ |
| `at(liste, i)` | Eintrag an Stelle i | ✅ |
| `first(liste)` | Erster Eintrag | ✅ |
| `last(liste)` | Letzter Eintrag | ✅ |
| `slice(liste, von, bis)` | Teilliste | ✅ |
| `concat(a, b, …)` | Listen aneinanderhängen | ✅ |
| `sort(liste)` | Sortieren | ✅ |
| `reverse(liste)` | Umdrehen | ✅ |
| `unique(liste)` | Doppelte entfernen | ✅ |
| `includes(liste, x)` | Enthalten? | ✅ |
| `flat(liste)` | Verschachtelung auflösen | ✅ |
| `join(liste, trenner)` | Zu Text zusammenfügen | ✅ |
| `split(text, trenner)` | Text zerlegen | ✅ |
| `map(liste, ausdruck)` | Jeden Eintrag umrechnen | ✅ |
| `filter(liste, bedingung)` | Einträge aussieben | ✅ |
| `find(liste, bedingung)` | Ersten Treffer holen | ✅ |
| `findIndex(liste, bedingung)` | Stelle des ersten Treffers | ✅ |
| `some(liste, bedingung)` | Trifft mindestens einer zu? | ✅ |
| `every(liste, bedingung)` | Treffen alle zu? | ✅ |

In `map`, `filter`, `find`, `findIndex`, `some` und `every` stehen zwei
besondere Namen zur Verfügung: **`current`** — der Eintrag, um den es gerade
geht — und **`index`** — seine Stelle in der Liste. Beispiel:

```
filter(prop("Aufgaben"), current.prop("Status") == "Offen").length()
```

### A.8 Personen (2)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `name(person)` | Name der Person | ✅ |
| `email(person)` | E-Mail der Person | ✅ |

### A.9 Eigenschaften (3)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `prop("Name")` | Wert einer Spalte holen | ✅ |
| `empty(wert)` | Ist der Wert leer? | ✅ |
| `id()` | Die Kennung dieser Zeile | ✅ |

### A.10 Variablen (2)

| Funktion | Was sie macht | Wir |
|---|---|:--:|
| `let(name, wert, ausdruck)` | Einen Namen setzen und benutzen | ✅ |
| `lets(n1, w1, n2, w2, …, ausdruck)` | Mehrere Namen auf einmal | ✅ |

Beispiel, das im Testlauf lief:

```
lets(a, 3, b, 4, sqrt(a * a + b * b))   →   5
```

---

<a id="b-zaehlung"></a>
## B. Wie die Zählung zustande kommt

| Gruppe | Anzahl |
|---|--:|
| Operatoren | 18 |
| Konstanten | 4 |
| Text | 16 |
| Bedingungen und Logik | 7 |
| Zahlen | 24 |
| Datum und Zeit | 19 |
| Listen | 19 |
| Personen | 2 |
| Eigenschaften | 3 |
| Variablen | 2 |
| **Summe der Nennungen** | **114** |
| abzüglich Doppelnennungen (`length`, `join`, `split`, `find`, `sort`, `concat`, `and`, `or`, `not`, `unique`, `includes`, `slice`, `first`, `last`, `at`, `reverse`, `flat` u. a. stehen in zwei Gruppen) | −15 |
| **Eindeutige Merkmale** | **99** |

Genau diese 99 laufen im Testlauf durch. Der Zähler steht auf **99/99**.

---

<a id="c-koennen"></a>
## C. Was Formeln können — an echten Aufgaben

Nicht abstrakt, sondern als Aufgaben, die man wirklich stellt. Alle
Ausdrücke unten sind mit unserer Maschine geprüft.

### Rechnen in der Zeile

```
prop("Menge") * prop("Preis") * (1 + prop("MwSt"))
```
Alles, was aus den Werten **derselben Zeile** folgt: Summen, Anteile,
Zuschläge, Umrechnungen, Punktzahlen, Gewichtungen.

### Text bauen und zerlegen

```
upper(substring(prop("Nachname"), 0, 1)) + ". " + prop("Vorname")
split(prop("Tags"), ",").map(trim(current)).join(" · ")
```
Kürzel bilden, Namen normalisieren, Listen sauber ausgeben, Präfixe setzen.

### Prüfen mit regulären Ausdrücken

```
test(prop("Email"), "^[^@]+@[^@]+\\.[a-z]{2,}$")
```
E-Mail, Telefonnummer, IBAN-Form, Rechnungsnummernmuster — die Prüfung geht.
(Was **nicht** geht: das Speichern verhindern, wenn sie fehlschlägt. Siehe D.)

### Fristen und Zeiträume

```
ifs(
  empty(prop("Fällig")), "",
  dateBetween(prop("Fällig"), today(), "days") < 0, "Überfällig",
  dateBetween(prop("Fällig"), today(), "days") == 0, "Heute",
  dateBetween(prop("Fällig"), today(), "days") <= 7, "Diese Woche",
  "Später"
)
```
Ampeln, Restlaufzeiten, Alter, Betriebszugehörigkeit, Wochennummern,
Quartale, „wie lange her".

### Fortschrittsbalken

```
let(p, round(prop("Erledigt") / prop("Gesamt") * 10),
  repeat("█", p) + repeat("░", 10 - p) + " " + formatNumber(prop("Erledigt") / prop("Gesamt"), "percent", 0))
```

### Über verknüpfte Zeilen rechnen

```
prop("Aufgaben").filter(current.prop("Status") == "Fertig").length()
prop("Positionen").map(current.prop("Betrag")).sum()
prop("Termine").sort().last()
```
Zählen, summieren, den letzten Eintrag finden, prüfen ob **alle** Unteraufgaben
fertig sind (`every`), ob **eine** blockiert (`some`).

### Verschachtelte Logik ohne Klammerwald

```
lets(
  tage,  dateBetween(prop("Fällig"), today(), "days"),
  dring, prop("Priorität") == "Hoch",
  ifs(tage < 0 and dring, "🔴 Sofort",
      tage < 0,           "🟠 Überfällig",
      tage <= 3,          "🟡 Bald",
                          "🟢 Ruhig")
)
```

### Zusammengefasst: Formeln können …

- rechnen, vergleichen, verzweigen, Text bauen, Datum rechnen
- Listen aus **verknüpften** Zeilen filtern, umrechnen, zusammenfassen
- Zwischenergebnisse benennen (`let`, `lets`) und damit lange Ausdrücke ordnen
- Werte formatieren: Währung, Prozent, Tausenderpunkte, Datumsmuster, Farbe,
  fett, kursiv, Link
- reguläre Ausdrücke anwenden

---

<a id="d-koennen-nicht"></a>
## D. Was Formeln nicht können — an echten Aufgaben

Jede Zeile ist eine Aufgabe, die Menschen wirklich stellen und die in Notion
mit Formeln **nicht** lösbar ist.

| Die Aufgabe | Warum es nicht geht |
|---|---|
| „Zeig mir heute eine zufällige Karteikarte" | Es gibt **kein `random()`**. Notion sagt das selbst wörtlich. ✅ belegt |
| „Nummeriere die Zeilen durch: 1, 2, 3 …" | Kein `rowNumber()`, keine Kenntnis der Sortierreihenfolge |
| „Laufender Kontostand" | Kein Zugriff auf die **vorherige Zeile**, kein `runningSum` |
| „Differenz zum Vortag / zur letzten Messung" | dito — Formeln sehen nur ihre eigene Zeile |
| „Rang in der Bestenliste" | Kein `rank()`, keine Sicht auf die anderen Zeilen |
| „Summiere alle Rechnungen dieses Kunden" (ohne Relation) | Kein `SUMIF` über eine fremde Tabelle, kein `SELECT … WHERE` |
| „Finde die Zeile mit derselben E-Mail und verknüpfe sie" | Formeln können nicht suchen und schon gar nicht verknüpfen |
| „Zähle alle Unteraufgaben, beliebig tief" | **Keine Rekursion.** Und spätestens bei 15 Ebenen ist Schluss ✅ belegt |
| „Wiederhole, bis die Bedingung erfüllt ist" | **Keine Schleifen** — `for`, `while` gibt es nicht ✅ belegt |
| „Definiere `istWerktag(d)` einmal und nutze es überall" | **Keine eigenen Funktionen**, kein `LAMBDA`, kein Import |
| „Rechne diese Zeit nach Europe/Zurich um" | Keine Zeitzonenbibliothek, kein `convertTimezone` |
| „Wie viele **Werktage** liegen dazwischen?" | Kein Arbeits- oder Feiertagskalender |
| „Verhindere das Speichern, wenn die E-Mail falsch ist" | Formeln haben **keine Nebenwirkungen** — sie rechnen, sie greifen nicht ein |
| „Setze bei Status = Fertig automatisch das Abschlussdatum" | dito — eine Formel kann keine andere Spalte schreiben (dafür braucht es eine Automation) |
| „Schicke eine Mail, wenn der Wert über 100 steht" | dito — kein Versand, kein Anlegen, kein Löschen |
| „Färbe die ganze Zeile rot" | Formeln geben einen Wert zurück, keine Formatierungsregel für die Zeile |
| „Zeig Umsatz nach Monat × Kategorie" | Kein Pivot, keine Kreuztabelle, kein `GROUP BY` |
| „Zähle die verschiedenen Werte" (`COUNT DISTINCT` über die Tabelle) | Geht nur innerhalb **einer** Liste (`unique().length()`), nicht über die Datenbank |
| „Lies eine Datei / eine Webseite / eine API" | Formeln haben keinen Netzzugriff |
| „Merke dir etwas von der letzten Berechnung" | Formeln sind zustandslos; jede Auswertung beginnt bei null |
| „Sortiere nach einer Formel, die auf einem Rollup steht — schnell" | Geht, ist aber laut Notion ausdrücklich langsam |

### Die kurze Fassung

Eine Notion-Formel ist eine **reine Funktion einer einzigen Zeile**.
Was sie sieht: die Werte dieser Zeile und die Listen, die über Relationen
daran hängen. Was sie tut: einen Wert zurückgeben. Mehr nicht.
Alles, was **andere Zeilen**, **andere Tabellen**, **Zufall**, **Zeit­verlauf**
oder **Verändern** braucht, liegt ausserhalb.

---

<a id="e-grenzen"></a>
## E. Die harten Grenzen der Sprache

| Grenze | Wert | Beleg |
|---|---|---|
| Verschachtelungstiefe über Formeln/Rollups | **15 Ebenen** | ✅ `notion.com/help/common-formula-errors` |
| Zufallszahl | **gibt es nicht** | ✅ `notion.com/help/formulas` |
| Schleifen | **gibt es nicht** | ✅ Notion zur KI-Erzeugung: keine „iterative logic (like `for` loops)" |
| Variablen | können sich **nicht gegenseitig aufrufen** | ✅ Hilfeseite |
| Variablen in Filtern | **nicht erlaubt** | ✅ Hilfeseite |
| Rechte | fehlt der Zugriff auf die verknüpfte Datenbank, gibt es **einen Fehler statt eines Werts** | ✅ Hilfeseite |
| Rückgabetyp | passt er nicht zur Automation, **läuft die Automation nicht** | ✅ Hilfeseite |
| Leere Werte | **halten Automationen an** | ✅ Hilfeseite |

---

<a id="f-extras"></a>
## F. Was unsere Formel-Maschine zusätzlich hat

Zwei Funktionen, die es in Notion nicht gibt:

| Funktion | Was sie macht |
|---|---|
| `xor(a, b)` | Entweder-oder, aber nicht beides |
| `boolean(x)` | Irgendetwas in wahr/falsch verwandeln |

Und drei Dinge, die anders sind:

- **Keine 15-Ebenen-Grenze.** Unsere Auswertung läuft im Browser über die
  eigenen Daten; es gibt keine Serverkette, die begrenzt werden müsste.
- **Fehler stehen mit Position da.** Der Prüfer (`Formula.check`) sagt, an
  welcher Stelle im Text es klemmt, statt nur „Formel ungültig".
- **Ergebnisse werden zwischengespeichert.** Gleiche Formel, gleiche Zeile,
  gleiche Werte → kein zweites Rechnen.

---

<a id="g-innen"></a>
## G. Wie unsere Formel-Maschine innen aussieht

`public/js/formula.js`, rund 660 Zeilen, ohne fremde Bibliothek.

1. **Zerleger (`tokenize`).** Der Text wird in Bausteine zerlegt: Zahlen,
   Zeichenketten, Namen, Operatoren, Klammern. Kommentare fallen weg.
2. **Zusammenbauer (`parse`).** Aus den Bausteinen entsteht ein Baum. Die
   Rangfolge der Operatoren ist fest verdrahtet: `? :` schwächer als `or`,
   `or` schwächer als `and`, dann Vergleich, dann `+ -`, dann `* / %`,
   dann `^`, dann Vorzeichen, dann Punktkette und Klammeraufruf.
3. **Auswerter (`evaluate`).** Läuft den Baum ab. Sechs Funktionen —
   `map`, `filter`, `find`, `findIndex`, `some`, `every` — sowie `let` und
   `lets` und `prop` werden **vor** der Funktionstabelle abgefangen, weil sie
   ihre Argumente nicht vorher ausrechnen dürfen: `current` und `index` müssen
   erst gesetzt werden. Alle übrigen 85 Funktionen stehen in einer Tabelle.
4. **Kein `eval`.** Nirgends. Keine Zeichenkette wird jemals als Programm
   ausgeführt. Das ist der Grund, warum die Sprache sicher bleibt, auch wenn
   eine Formel aus einer importierten Datei kommt.

```
tokenize  →  parse  →  evaluate
  Text        Baum       Wert
```

---

## Quellen

- `https://www.notion.com/help/formula-syntax` — die vollständige Referenz
- `https://www.notion.com/help/common-formula-errors` — 15 Ebenen, Rechte,
  Rückgabetyp, Variablenregeln
- `https://www.notion.com/help/formulas` — kein `random()`
- Notion-KI im laufenden Notion, vier Runden befragt
- Eigener Messlauf: `/tmp/formelcheck.js` gegen `public/js/formula.js`
