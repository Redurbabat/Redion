# Filter, Berechnungen, Sortieren, Gruppieren — die vollständige Referenz

**Stand: 2. August 2026**

Die Notion-KI hat dafür die offizielle Entwicklerreferenz
(*Filter data source entries*), die Hilfeseiten *Database properties*,
*Views, filters, sorts & groups* und *Table view* geladen und daraus
Tabellen gebaut. Wo sie etwas **nicht** belegen konnte, sagt sie es —
das steht hier ebenso.

Spalte **Wir** = unsere App, nach dem Vergleich in dieser Runde.

---

## 1. Filter-Bedingungen je Eigenschaftstyp

### 1.1 Text, Titel, URL, E-Mail, Telefon

Notion behandelt alle fünf gleich — als Rich-Text-Filter.

| Notion (API-Name) | Bei uns | Wir |
|---|---|:--:|
| `contains` | enthält | ✅ |
| `does_not_contain` | enthält nicht | ✅ |
| `equals` | ist | ✅ |
| `does_not_equal` | ist nicht | ✅ |
| `starts_with` | beginnt mit | ✅ |
| `ends_with` | endet mit | ✅ |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

> **Hier hatten wir eine Lücke.** Bei **URL, E-Mail und Telefon** boten wir
> nur fünf der acht Bedingungen an — „ist nicht", „beginnt mit" und
> „endet mit" fehlten. In dieser Runde ergänzt. Bei Text und Titel waren
> alle acht schon da.

### 1.2 Zahl

| Notion | Bei uns | Wir |
|---|---|:--:|
| `equals` | ist gleich | ✅ |
| `does_not_equal` | ist nicht gleich | ✅ |
| `greater_than` | größer als | ✅ |
| `greater_than_or_equal_to` | größer oder gleich | ✅ |
| `less_than` | kleiner als | ✅ |
| `less_than_or_equal_to` | kleiner oder gleich | ✅ |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

Gilt ebenso für Formeln mit Zahlenergebnis und Rollups mit Zahlenergebnis.

### 1.3 Auswahl und Status

| Notion | Bei uns | Wir |
|---|---|:--:|
| `equals` | ist | ✅ |
| `does_not_equal` | ist nicht | ✅ |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

Besonderheit laut API: bei `equals`/`does_not_equal` sind auch **mehrere
Werte als Liste** erlaubt; bei Status werden zusätzlich die Gruppennamen
(„To-do", „In progress", „Complete") angenommen.

### 1.4 Mehrfachauswahl

| Notion | Bei uns | Wir |
|---|---|:--:|
| `contains` | enthält | ✅ |
| `does_not_contain` | enthält nicht | ✅ |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

### 1.5 Datum, Erstellt am, Zuletzt bearbeitet am

| Notion | Bei uns | Wir |
|---|---|:--:|
| `equals` | ist | ✅ |
| `before` | ist vor | ✅ |
| `after` | ist nach | ✅ |
| `on_or_before` | ist am oder vor | ✅ |
| `on_or_after` | ist am oder nach | ✅ |
| `past_week` | ist letzte Woche | ✅ |
| `past_month` | ist letzter Monat | ✅ |
| `past_year` | ist letztes Jahr | ✅ *(in dieser Runde gebaut)* |
| `this_week` | ist diese Woche | ✅ |
| `next_week` | ist nächste Woche | ✅ |
| `next_month` | ist nächster Monat | ✅ *(in dieser Runde gebaut)* |
| `next_year` | ist nächstes Jahr | ✅ *(in dieser Runde gebaut)* |
| *(Oberfläche)* this_year | ist dieses Jahr | ✅ *(in dieser Runde gebaut)* |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

**Wir haben zusätzlich**, was Notion so nicht hat: „ist heute", „ist gestern",
„ist morgen", „ist in den letzten 7/30 Tagen", „ist in den nächsten 7/30 Tagen",
„liegt in der Vergangenheit", „liegt in der Zukunft".

Relative Werte, die die API zusätzlich zu ISO-Daten annimmt:
`today`, `tomorrow`, `yesterday`, `one_week_ago`, `one_week_from_now`,
`one_month_ago`, `one_month_from_now`.
Zeitzone: fehlt sie, nimmt Notion **UTC** an; mit Uhrzeit wird auf die
Millisekunde verglichen.

### 1.6 Kontrollkästchen

| Notion | Bei uns | Wir |
|---|---|:--:|
| `equals` (wahr/falsch) | ist aktiviert | ✅ |
| `does_not_equal` | ist nicht aktiviert | ✅ |

### 1.7 Person, Erstellt von, Zuletzt bearbeitet von

| Notion | Bei uns | Wir |
|---|---|:--:|
| `contains` | enthält | ✅ |
| `does_not_contain` | enthält nicht | ✅ |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

### 1.8 Verknüpfung

| Notion | Bei uns | Wir |
|---|---|:--:|
| `contains` | enthält | ✅ |
| `does_not_contain` | enthält nicht | ✅ |
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

### 1.9 Dateien und Medien

| Notion | Bei uns | Wir |
|---|---|:--:|
| `is_empty` | ist leer | ✅ |
| `is_not_empty` | ist nicht leer | ✅ |

Mehr gibt es nicht — man kann nicht nach Dateiname oder Dateityp filtern.

### 1.10 Formel

Die möglichen Bedingungen hängen vom **Ergebnistyp** ab:

| Ergebnistyp | Bedingungen |
|---|---|
| Wahrheitswert | `equals`, `does_not_equal` |
| Datum | die vollständige Datumsliste aus 1.5 |
| Zahl | die vollständige Zahlenliste aus 1.2 |
| Text | die vollständige Textliste aus 1.1 |

Wir bieten für Formelspalten eine gemischte Liste an, die alle vier Fälle
abdeckt: enthält · ist · ist gleich · größer als · kleiner als ·
ist aktiviert · ist nicht aktiviert · ist leer · ist nicht leer.

### 1.11 Rollup

| Rollup ergibt | Bedingungen |
|---|---|
| **eine Liste** | `any`, `every`, `none` — jeweils mit einer eingebetteten Bedingung für den Elementtyp |
| **ein Datum** (Frühestes/Spätestes Datum, Zeitspanne) | die Datumsliste |
| **eine Zahl** | die Zahlenliste |

**Bei uns:** Zahl- und Datumsvergleiche sowie „enthält"/„enthält nicht" sind
da und wurden in dieser Runde um `größer oder gleich`, `kleiner oder gleich`,
`ist vor` und `ist nach` ergänzt. Die verschachtelten `any`/`every`/`none`
mit eigener Unterbedingung fehlen noch — das ist der letzte offene Punkt
in dieser Tabelle.

### 1.12 Laufende Nummer (ID)

| Notion | Bei uns | Wir |
|---|---|:--:|
| `equals` | ist gleich | ✅ |
| `does_not_equal` | ist nicht gleich | ✅ |
| `greater_than` | größer als | ✅ |
| `greater_than_or_equal_to` | größer oder gleich | ✅ |
| `less_than` | kleiner als | ✅ |
| `less_than_or_equal_to` | kleiner oder gleich | ✅ |

Bemerkenswert: Notion nennt für ID **keine** Leer-Bedingungen — eine
laufende Nummer ist ja nie leer. Wir hatten hier nur drei der sechs
Vergleiche; die fehlenden drei sind jetzt da.

### 1.13 Prüfung (Verification)

`status` mit den Werten `verified`, `expired`, `none`.
**Bei uns:** ist geprüft · ist nicht geprüft · ist abgelaufen · ist abgelehnt.

### 1.14 Knopf und Ort

Die Notion-KI sagt hier ausdrücklich, dass sie **nichts** belegen konnte:

> Für **Knopf** nennt die API-Filterliste keinen eigenen Filtertyp.
> Für **Ort** ebenso wenig — Ort ist als Eigenschaft dokumentiert, aber
> in der Filterreferenz nicht als eigener Filtertyp aufgeführt.

**Bei uns:** Knopf hat wie in Notion keine Filter. Für Ort bieten wir
Textfilter an — das ist eine Entscheidung von uns, keine Nachbildung.

### 1.15 Zusammengesetzte Filter

| | Notion | Wir |
|---|---|:--:|
| UND | alle Bedingungen müssen zutreffen | ✅ |
| ODER | mindestens eine muss zutreffen | ✅ |
| Filtergruppen | Verschachtelung, in der Oberfläche **bis zu drei Ebenen** | ✅ |

---

## 2. Berechnungen unter der Spalte

### 2.1 Alle Berechnungsarten

| Notion | Bei uns | Wir |
|---|---|:--:|
| Count all | Anzahl alle | ✅ |
| Count values | Werte zählen | ✅ |
| Count unique values | Eindeutige zählen | ✅ |
| Count empty | Leere zählen | ✅ |
| Count not empty | Gefüllte zählen | ✅ |
| Percent empty | Prozent leer | ✅ |
| Percent not empty | Prozent gefüllt | ✅ |
| Earliest date | Frühestes Datum | ✅ |
| Latest date | Spätestes Datum | ✅ |
| Date range | Zeitspanne | ✅ |
| Sum | Summe | ✅ |
| Average | Durchschnitt | ✅ |
| Median | Median | ✅ |
| Min | Minimum | ✅ |
| Max | Maximum | ✅ |
| Range | Spanne | ✅ |
| *(Oberfläche)* Show original | Original zeigen | ✅ |
| *(Oberfläche)* Checked | Aktivierte zählen | ✅ |
| *(Oberfläche)* Unchecked | Nicht aktivierte zählen | ✅ |
| *(Oberfläche)* Percent checked | Prozent aktiviert | ✅ |
| *(Oberfläche)* Percent unchecked | Prozent nicht aktiviert | ✅ |

**21 Arten bei uns, keine fehlt.** Die Notion-KI nennt aus der Hilfeseite
16; die fünf weiteren (Original zeigen und die vier Kontrollkästchen-Arten)
stehen dort nicht in der Liste, sind in der Oberfläche aber vorhanden — wir
haben sie gebaut.

### 2.2 Welche Art bei welchem Typ

Notions Hilfe sagt: je nach Eigenschaftstyp sieht man „einige oder alle"
Optionen. Die Zuordnung, wie die Notion-KI sie aus der Referenz aufgestellt hat:

| Eigenschaftstyp | Die sieben Zähl-/Prozentarten | Datumsarten | Zahlenarten |
|---|:--:|:--:|:--:|
| Titel, Text, Auswahl, Status, Mehrfachauswahl | ✅ | — | — |
| Zahl | ✅ | — | ✅ |
| Datum, Erstellt am, Zuletzt bearbeitet am | ✅ | ✅ | — |
| Formel → Text | ✅ | — | — |
| Formel → Zahl | ✅ | — | ✅ |
| Formel → Datum | ✅ | ✅ | — |
| Rollup → Zahl | ✅ | — | ✅ |
| Rollup → Datum | ✅ | ✅ | — |
| Person, Datei, Kontrollkästchen, URL, E-Mail, Telefon | ✅ | — | — |
| Erstellt von, Zuletzt bearbeitet von | ✅ | — | — |
| Laufende Nummer | ✅ | — | ✅ (in der Oberfläche nicht garantiert) |
| Knopf | nur „Anzahl alle" sinnvoll | — | — |
| Ort | ✅ | — | — |

**Bei uns** ist es dieselbe Logik: die sieben Zählarten plus „Original zeigen"
immer, Zahlenarten bei Zahl und Formel, Datumsarten bei Datum/Erstellt/
Bearbeitet, Kontrollkästchenarten beim Kontrollkästchen.

---

## 3. Sortieren

| Notion | Wir |
|---|:--:|
| Nach einer Eigenschaft sortieren | ✅ |
| Aufsteigend | ✅ |
| Absteigend | ✅ |
| Mehrere Sortierregeln nacheinander | ✅ |
| Reihenfolge der Regeln ändern | ✅ |
| Einzelne Regel entfernen | ✅ |
| Nur für mich oder für alle speichern | — *(bei uns gibt es nur einen Menschen)* |

**Sortierlogik je Typ**, wie Notion sie beschreibt: Text alphabetisch ·
Zahl numerisch · Auswahl, Mehrfachauswahl und Status **nach der selbst
gesetzten Reihenfolge der Optionen** · Datum chronologisch · Person nach
Name · Kontrollkästchen falsch vor wahr · Verknüpfung nach Titel der
verknüpften Seite · Rollup und Formel nach dem Ergebniswert.
Für **Ort** ist es laut Notion-KI nicht eindeutig dokumentiert.

---

## 4. Gruppieren

| Notion | Wir |
|---|:--:|
| Nach einer Eigenschaft gruppieren | ✅ |
| Untergruppieren (zweite Ebene) | ✅ |
| Gruppen ein- und ausklappen | ✅ |
| Leere Gruppen ausblenden | ✅ |
| Gruppen sortieren: manuell | ✅ |
| Gruppen sortieren: alphabetisch A→Z und Z→A | ✅ *(in dieser Runde gebaut)* |
| Gruppen sortieren: nach Anzahl | ✅ *(in dieser Runde gebaut — Notion hat das so nicht)* |
| Gruppen nach Optionsreihenfolge | ✅ *(ist bei uns „manuell")* |

**Gruppieren nach Typ**, wie Notion es einordnet: sinnvoll bei Auswahl,
Status, Mehrfachauswahl, Datum, Person, Kontrollkästchen, Verknüpfung,
Formel, Rollup und Zahl; möglich, aber selten sinnvoll bei Titel, Text,
URL, E-Mail, Telefon und Datei.

---

## 5. Was diese Runde konkret verändert hat

| Was | Vorher | Jetzt |
|---|---|---|
| URL-, E-Mail- und Telefonfilter | 5 Bedingungen | **8** — wie Notion |
| Filter der laufenden Nummer | 3 Vergleiche | **6** — wie Notion |
| Rollup-Filter | 7 Bedingungen | **12** |
| Datumsfilter | 21 Bedingungen | **25** — dazu letztes/dieses/nächstes Jahr und nächster Monat |
| Gruppen sortieren | gab es nicht | **5 Arten** |

Offen bleibt genau ein Punkt: die verschachtelten Rollup-Filter
`any` / `every` / `none` mit eigener Unterbedingung.

---

## Quellen

- Notion-Entwicklerreferenz: *Filter data source entries*
- Notion-Hilfe: *Database properties*, *Views, filters, sorts & groups*,
  *Table view databases*
- Notion-KI im laufenden Notion, Runde 6, mit ausdrücklichem Vermerk, wo
  sie nichts belegen konnte (Knopf, Ort)
