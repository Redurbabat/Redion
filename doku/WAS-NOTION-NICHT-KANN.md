# Was Notion nicht kann

**Stand: 2. August 2026** · Quelle: Notion-KI im echten Notion befragt (sechs Runden),
jede Zahl danach gegen die offizielle Dokumentation gehalten.

> **Diese Datei ist der erste von sieben Teilen.** Sie sammelt die Grenzen.
> Die anderen sechs gehen ins Einzelne:
>
> - **`FORMELN-ALLES.md`** — jede einzelne der 99 Formelfunktionen, was
>   Formeln können, was nicht, und der Messlauf gegen unsere eigene Maschine
> - **`FILTER-RECHNEN-SORTIEREN.md`** — jede Filterbedingung je
>   Eigenschaftstyp, alle 21 Berechnungsarten, Sortieren und Gruppieren
> - **`AUTOMATIONEN-UND-KNOEPFE.md`** — alle Auslöser, alle Aktionen, alle
>   Knopfaktionen, alle Zeitplanoptionen, mit Notions eigenen Grenzen
> - **`SLASH-UND-TASTEN.md`** — jeder Slash-Befehl mit seinen Alias-Wörtern,
>   jedes Tastenkürzel für Windows, und welcher Befehl ein eigenes hat
> - **`OBERFLAECHE-PC-UND-HANDY.md`** — wo jeder Knopf sitzt, am Windows-PC
>   und am iPhone, mit Position, Aussehen und Wirkung
> - **`NOTION-10000X-BESSER.md`** — die 21 grössten Lücken und die 36
>   Ideen, die Notion um Grössenordnungen besser machen würden

> **Wie diese Liste entstanden ist.** Ich habe die Notion-KI im laufenden Notion
> gefragt — sie hat dabei selbst die offiziellen Seiten geladen
> (`developers.notion.com`, `notion.com/help`). Danach habe ich jede harte Zahl
> noch einmal selbst nachgeschlagen. Was ich bestätigen konnte, steht mit ✅;
> was die KI gesagt hat, ich aber nicht belegen konnte, steht mit ⚠ und dem
> Vermerk „unbelegt". Nichts hier ist geraten.

---

## Inhalt

1. [Harte Zahlen — die Grenzen der API](#1-harte-zahlen)
2. [Was Formeln nicht können](#2-formeln)
3. [Was Datenbanken und Ansichten nicht können](#3-datenbanken-und-ansichten)
4. [Was Automationen nicht können](#4-automationen)
5. [Was die Notion-KI selbst nicht kann](#5-die-notion-ki-selbst)
6. [Was offline nicht geht](#6-offline)
7. [Was auf dem Telefon nicht geht](#7-telefon)
8. [Rechte, Teilen und die Fallen darin](#8-rechte-und-teilen)
9. [Daten: wem sie gehören, wo sie liegen](#9-daten)
10. [Was beim Kündigen passiert](#10-abo-endet)
11. [Was Notion nicht kann, weil es ein Server-Dienst ist](#11-server-dienst)
12. [Was Excel und Airtable können und Notion nicht](#12-excel-und-airtable)
13. [Was davon unsere App anders macht](#13-unsere-app)

---

<a id="1-harte-zahlen"></a>
## 1. Harte Zahlen — die Grenzen der API

Alle Werte aus `developers.notion.com/reference/request-limits`, selbst nachgelesen. ✅

| Was | Grenze | Was damit nicht geht |
|---|---|---|
| Anfragen je Verbindung | **3 pro Sekunde** im Schnitt, kurze Spitzen erlaubt | Massenabgleich, schnelle Migration, Live-Sync |
| Zusätzlich je Arbeitsbereich | eigenes Limit, skaliert mit dem Tarif — **keine Zahl veröffentlicht** | mehrere Integrationen parallel ohne globales Bremsen |
| Nutzdaten je Anfrage | **500 KB** | eine grosse Seite in einem Rutsch schreiben |
| Blöcke je Anfrage | **1 000** | eine sehr lange Seite in einem Aufruf anlegen |
| Elemente je Feld-Liste | **100** | mehr als 100 Kindblöcke auf einmal senden |
| Text in einem Rich-Text-Stück | **2 000 Zeichen** | einen langen Absatz als ein Objekt senden |
| Adresse in einem Link | **2 000 Zeichen** | sehr lange URLs |
| Formelausdruck (Equation) | **1 000 Zeichen** | lange LaTeX-Formeln |
| URL-Eigenschaft | **2 000 Zeichen** | — |
| E-Mail-Eigenschaft | **200 Zeichen** | — |
| Telefon-Eigenschaft | **200 Zeichen** | — |
| Mehrfachauswahl je Anfrage | **100 Optionen** | — |
| Verknüpfung je Anfrage | **100 Seiten** | mehr geht — aber nicht in einem Aufruf |
| Personen je Anfrage | **100** | — |

Bei Überschreitung: `HTTP 429 rate_limited`, bei Überlast `HTTP 529 service_overload`.
Der Client soll `Retry-After` beachten.

**Wichtig:** Diese Zahlen gelten *je Anfrage*, nicht als Gesamtinhalt. Eine
Verknüpfung darf mehr als 100 Seiten enthalten — man kann nur nicht mehr als
100 auf einmal setzen.

### Dateien

| Was | Grenze |
|---|---|
| Datei-Upload, kostenloser Arbeitsbereich | **unter 5 MB** ✅ |
| Datei-Upload, bezahlt | **bis 5 GB je Datei** ✅ |
| PDF auf bezahlten Tarifen | unter 20 MB ✅ |
| Bilder (PNG, JPG) | unter 5 MB ✅ |
| Datei-Upload über die API, einfach | ≤ 20 MB, darüber nur mehrteilig ✅ |
| Dateiname über die API | 900 Byte samt Endung ✅ |

### Was es *nicht* gibt

**Es gibt keine offiziell dokumentierte Höchstzahl an Datenbankzeilen und keine
an Blöcken je Seite.** Die Notion-KI hat das ausdrücklich gesagt und ich habe
auch keine gefunden. Wer „Notion kann maximal 10 000 Zeilen" behauptet, hat
dafür keine Quelle. Was stimmt: Grosse Datenbanken werden in der Praxis
langsamer — das ist eine Erfahrung, keine Zahl.

---

<a id="2-formeln"></a>
## 2. Was Formeln nicht können

> Die vollständige Fassung — alle 99 Funktionen einzeln, mit Beispielen und
> dem gemessenen Vergleich gegen unsere Maschine — steht in
> **`FORMELN-ALLES.md`**. Hier nur die Grenzen.

### Belegt ✅

- **Keine Schleifen.** `for`, `while`, `do while` gibt es nicht. Notion schreibt
  selbst, dass die KI keine „iterative logic (like `for` loops)" erzeugen kann —
  weil die Sprache das nicht hat.
- **Keine Zufallszahl.** Wörtlich: „Random generations that would require a
  `random()` function, which Notion formulas don't have."
  Damit geht nicht: zufällige Auswahl, zufällige Sortierung, Würfel, A/B-Gruppen,
  „zeig mir heute eine zufällige Karteikarte".
- **Höchstens 15 Ebenen tief.** Wörtlich: „Notion formulas can only be 15 layers
  deep. Every time a formula references another formula or rollup, it adds a
  layer." Das gilt auch über Datenbankgrenzen hinweg. Wer Projekte mit
  Unteraufgaben, Rollups und abgeleiteten Status baut, läuft dagegen.
- **Formeln scheitern an Rechten.** Wer die verknüpfte Datenbank nicht sehen
  darf, bekommt einen Fehler statt eines Werts.
- **Falscher Rückgabetyp bricht Automationen.** Eine Automation erwartet einen
  bestimmten Typ; passt er nicht, läuft sie nicht.
- **Variablen können sich nicht gegenseitig aufrufen** und **nicht in Filtern
  verwendet werden.**
- **Undefinierte Werte halten Automationen an** — typisch bei leeren Datums-
  oder Personenfeldern.

### Aus der Sprache heraus klar, ohne eigene Belegseite

- **Keine Rekursion.** `fakultaet(n) = n * fakultaet(n-1)` geht nicht.
- **Kein Zugriff auf eine andere Datenbank ohne Verknüpfung.** Es gibt kein
  `SUMIF` über eine fremde Tabelle und kein `SELECT … WHERE`. Ohne Relation
  kommt man nicht heran.
- **Kein Verweis auf andere Zeilen.** Keine Zelle B7, keine „Zeile darüber",
  kein laufender Saldo, kein Vergleich mit der Vorzeile.
- **Keine eigenen Funktionen.** Kein `LAMBDA`, kein VBA, kein Skript. Logik muss
  man wiederholen — und stösst dann auf die 15 Ebenen.
- **Keine Nebenwirkungen.** Eine Formel rechnet, sie ändert nichts: kein Setzen
  einer anderen Spalte, kein Anlegen einer Seite, kein Versand.
- **Keine SQL-Bausteine.** Kein `GROUP BY`, `JOIN`, `ORDER BY`, `LIMIT`,
  Fensterfunktion, `COUNT DISTINCT`.
- **Zeitzonen nur rudimentär.** Kein `convertTimezone(datum, "UTC",
  "Europe/Zurich")`, keine sommerzeitsichere Rechnung über mehrere Regionen.
  Wiederkehrende Automationen haben zwar eine Zeitzone — die Formelsprache nicht.

---

<a id="3-datenbanken-und-ansichten"></a>
## 3. Was Datenbanken und Ansichten nicht können

- **Keine Pivot-Tabelle.** Keine Zeilenfelder/Spaltenfelder/Wertefelder, kein
  Drilldown, keine Pivot-Diagramme. Gruppieren ist kein Ersatz.
- **Keine Kreuztabelle.** Spalten lassen sich nicht dynamisch aus Werten
  erzeugen („Monat × Produkt").
- **Keine verbundenen Zellen.** Weder über Spalten noch über Zeilen, keine
  mehrzeiligen Kopfbereiche.
- **Keine Zellformatierung.** Keine einzelne Zelle einfärben, keine
  Zahlenformate je Zelle, keine Rahmen, keine Heatmap, keine Datenbalken,
  keine Symbole nach Regel. Farbe gibt es nur über Auswahl- und Statuswerte.
- **Spaltenreihenfolge gilt für die Ansicht, nicht je Gruppe.** Gruppe A kann
  nicht andere Spalten zeigen als Gruppe B.
- **Zwischensummen nur flach.** Es fehlen: mehrere Ebenen, frei platzierte
  Summen, eigene Aggregationsformeln, gewichtete Mittel, Varianz und
  Standardabweichung als Ansichtswert, laufende Summen, kumulative Werte,
  Prozent vom Gesamtergebnis.
- **Kein Zellenraster.** Keine A1-Bezüge, keine Matrixformeln, keine dynamischen
  Arrays, kein Solver, keine Zielwertsuche, kein Szenario-Manager.
- **Diagramme bleiben einfach.** Keine kombinierten Achsen, keine berechneten
  Kennzahlen, keine Trendlinien, keine Prognose.
- **Formularansichten lassen sich nicht exportieren.** ✅
- **Nicht alle Ansichten auf einmal exportieren** — nur die aktuelle oder die
  Standardansicht. ✅

---

<a id="4-automationen"></a>
## 4. Was Automationen nicht können

- **Keine Formel als Auslöser.** Notion: Erwähnungen und Formeln gehen nur in
  *Aktionen*, nicht in *Auslösern*. „Wenn diese Formel wahr wird" gibt es nicht —
  man braucht den Umweg über eine echte Spalte.
- **Keine Formeln in Slack-Nachrichten.**
- **Keine Programmlogik.** Keine verschachtelten if/else-Bäume, keine Schleifen
  über Treffer, keine Fehlerbehandlung mit Wiederholung, keine Variablen über
  mehrere Schritte, kein JSON-Verarbeiten, keine freien HTTP-Aufrufe.
- **Keine Abfrage als Auslöser.** „Jeden Morgen alle überfälligen Aufgaben
  suchen, nach Person gruppieren und je eine Zusammenfassung schicken" — nativ
  nicht.
- **Keine Massenverarbeitung.** 10 000 Zeilen nach Regel ändern, für jede Zeile
  in A drei Zeilen in B anlegen, beidseitig abgleichen, Dubletten
  zusammenführen — dafür braucht es Skripte oder externe Dienste.

---

<a id="5-die-notion-ki-selbst"></a>
## 5. Was die Notion-KI selbst nicht kann

Wörtlich aus `notion.com/help/notion-agent`, selbst nachgelesen ✅ —
der Agent kann **nicht**:

- Fragen zu Inhalten in **Embeds beantworten, die keine PDFs sind** (etwa ein
  Videotranskript)
- **neue Datenbank-Automationen** anlegen
- **neue Datenbank-Vorlagen** anlegen
- **neue Seitenlayouts** für Datenbanken anlegen
- **fortgeschrittene Eigenschaften** anlegen oder ändern — Formeln, Rollups,
  Knöpfe
- **Kommentare** anlegen oder ändern, weder am Block noch oben auf der Seite
- **Seiten teilen oder Rechte ändern**
- **KI-Besprechungsnotizen starten**
- **Erinnerungen anlegen**
- **Arbeitsbereichs-Einstellungen verwalten** — Rollen, Abrechnung, Sicherheit
- **Kalendertermine ändern oder absagen**, wenn man nicht selbst einlädt
- **auf dem Telefon Termine planen oder absagen** — nur Web und Rechner
- **auf dem Telefon MCP-Server verbinden** — nur Web und Rechner

Dazu kommt, was sie selbst gesagt hat: Sie sieht nur, was der angemeldete Mensch
sehen darf, sie kann nichts finden, was nicht indexiert oder freigegeben ist,
und sie kann sich irren — bei Rechten, Löschungen und Zahlen sollte man
nachprüfen.

---

<a id="6-offline"></a>
## 6. Was offline nicht geht

Aus `notion.com/help/use-pages-offline`, selbst nachgelesen ✅

**Geht offline:** neue Seiten anlegen, heruntergeladene Seiten lesen und
bearbeiten, Änderungen lokal speichern und später abgleichen — aber **nur in
der Rechner- oder Telefon-App**.

**Geht nicht offline:**

- **Notion im Browser.** Offline gibt es dort gar nicht.
- **Seiten, die man nicht vorher heruntergeladen hat.**
- **Unterseiten.** Sie werden **nicht automatisch** mitgeladen.
- **Datenbanken vollständig.** Heruntergeladen werden **die ersten 50 Zeilen der
  ersten Ansicht**. Alles Weitere muss man einzeln laden.
- **Embeds aus anderen Apps**, **KI-Blöcke**, **Formulare**, **Knöpfe** —
  wörtlich genannt.
- **Teilen und Rechte ändern.**

**Und es gibt Datenverlust:** Ändern zwei Menschen offline dieselbe
Auswahl-Eigenschaft, wird am Ende **nur eine Änderung gespeichert**. Wörtlich so
dokumentiert. Bei reinem Text versucht Notion zusammenzuführen; bei allem
anderen gewinnt einer.

---

<a id="7-telefon"></a>
## 7. Was auf dem Telefon nicht geht

- Der Agent kann dort **keine Termine planen oder absagen** ✅
- **Keine neuen MCP-Server verbinden** ✅
- **Kein Export des ganzen Arbeitsbereichs** — nur Rechner oder Web ✅
- Praktisch unbequem, aber nicht ausdrücklich gesperrt: grosse Datenbanken
  umbauen, komplexe Formeln schreiben, viele Ansichten verwalten, tiefere
  Verwaltungseinstellungen ändern

---

<a id="8-rechte-und-teilen"></a>
## 8. Rechte, Teilen und die Fallen darin

- **Das breiteste Recht gewinnt.** Wer auf einer Seite nur „Lesen" hat, bekommt
  Vollzugriff, sobald „Alle im Arbeitsbereich" auf Vollzugriff gestellt wird.
  Enge Rechte lassen sich durch eine weite Freigabe aushebeln.
- **Unterseiten behalten ihre Rechte.** Zieht man eine geteilte Seite ins
  Private zurück, gilt das **nur für die Elternseite** — auf Unterseiten bleiben
  vergebene Rechte bestehen. Eine klassische Falle.
- **„Jeder mit dem Link" reicht weiter, als es klingt.** Auch ohne Link kommt
  jemand hinein, wenn die Seite auf einer breiter geteilten Seite erwähnt oder
  verlinkt ist, über eine beidseitige Verknüpfung hängt oder darin verschachtelt
  liegt.
- **Gäste sind an Regeln gebunden** — Gästelimit, gesperrte Bereiche, erlaubte
  Domänen; bei überschrittenem Limit können neue Personen mit derselben Domäne
  automatisch **Mitglied** werden statt Gast.
- **Rechte auf einzelne Datenbankzeilen gibt es nur in Business und Enterprise.**
  Und wer nur so hineinkommt, kann **keine neuen Zeilen anlegen** — dafür braucht
  es ein Formular.

---

<a id="9-daten"></a>
## 9. Daten: wem sie gehören, wo sie liegen

- **Eigentum:** Notion beansprucht kein Eigentum an dem, was man hineingibt oder
  was die KI ausgibt. In einem Unternehmens-Arbeitsbereich gehören die Inhalte
  dem Unternehmen — nicht der einzelnen Person.
- **Ort:** gehostet bei **Amazon Web Services**. Regionen mit Sicherung:
  Oregon → Ohio · Frankfurt → Irland · Tokio → Osaka · Seoul → Seoul.
- **Ohne bestätigte Migration bleibt der Arbeitsbereich in den USA.**
  Die Regionenwahl gibt es nur für Enterprise mit Betreuung.
- **Die Region deckt nicht alles ab.** Ausserhalb liegen oder werden verarbeitet:
  Kontodaten, Nutzungsdaten, alles über Unterauftragsverarbeiter, Notion Kalender,
  Notion Mail, Beta-Dienste und alles, was über Integrationen läuft.
- Notion sagt ausdrücklich: die Regionenwahl betrifft **nur ruhende Daten in
  AWS**; verarbeitet werden darf weiter in den USA und anderswo.

---

<a id="10-abo-endet"></a>
## 10. Was beim Kündigen oder Herunterstufen passiert

Nach Angabe der Notion-KI aus der Preis-FAQ (die Seite selbst war beim
Nachprüfen nicht erreichbar — deshalb ⚠ **unbelegt**, aber plausibel und mit
dem bekannten Verhalten deckungsgleich):

- Bis zum Ende des bezahlten Zeitraums bleiben die Funktionen.
- Beim Rückfall auf den kostenlosen Tarif:
  - **Eigene Agenten** werden abgeschaltet, aber nicht gelöscht — nur noch lesbar
  - **1 000 Blöcke** im ganzen Arbeitsbereich, sobald **zwei oder mehr Personen**
    darin sind; allein bleibt es unbegrenzt
  - Neue Uploads nur noch **bis 5 MB**
  - **Versionsverlauf: 7 Tage**
  - **Automationen laufen weiter, sind aber nur noch lesbar** — keine neuen,
    keine Änderungen
  - **Nur das erste Diagramm bleibt**
  - **10 Gäste**
  - **SAML SSO weg**, geprüfte Domänen verlieren ihre Prüfung
  - **Prüfprotokoll weg** — es werden auch keine Ereignisse mehr gesammelt
  - **Aufbewahrung zurück auf 30 Tage**

Die Daten werden nicht gelöscht. Aber ein Teil der Arbeit wird eingefroren.

---

<a id="11-server-dienst"></a>
## 11. Was Notion nicht kann, weil es ein Server-Dienst ist

- **Keine Unabhängigkeit vom Anbieter.** Ist Notion gestört, das Konto gesperrt
  oder das Netz blockiert, hilft nur, was vorher lokal lag.
- **Kein vollständiger Rückweg.** Notion sagt selbst: Man kann einen
  exportierten Arbeitsbereich **nicht einfach durch erneutes Hochladen genau
  wiederherstellen**. Export ist Sicherung und Portabilität, kein Rundlauf mit
  Ansichten, Rechten, Relationen und Automationen.
- **Keine Ende-zu-Ende-Verschlüsselung für alles.** Ein Dienst, der serverseitig
  sucht, KI rechnen lässt, Rechte prüft und abgleicht, kann die Inhalte nicht
  gleichzeitig so verschlüsseln, dass der Server sie nie sieht. Wer das braucht,
  ist bei Notion grundsätzlich falsch.
- **Keine Kontrolle über die Datenbank.** Keine Indizes, kein Query Planner,
  keine Transaktionen, keine Fremdschlüssel, keine gespeicherten Prozeduren,
  keine Sicherung auf Datenbankebene, keine lokalen Datenbankdateien.
- **Kein Zugriff ohne Konto.** Zugang, Abgleich und Rechte hängen an Anmeldung,
  Mitgliedschaft, Netz, Verfügbarkeit und Tarif.
- **Weiterer Export dauert.** Ein ganzer Arbeitsbereich braucht **bis zu 30
  Stunden**, der Link läuft nach **7 Tagen** ab. Der PDF-Gesamtexport war
  Business/Enterprise vorbehalten und wird laut Hilfe **bis 31. August 2026**
  eingestellt.
- **Windows-Falle beim Entpacken:** Der Standardpfad ist auf **260 Zeichen**
  begrenzt; tief verschachtelte Exporte machen dort Ärger.

---

<a id="12-excel-und-airtable"></a>
## 12. Was Excel und Airtable können und Notion nicht

**Excel:** A1-Bezüge, relative und absolute Referenzen, `SUMIF`, `COUNTIF`,
`XLOOKUP`, `INDEX/MATCH`, dynamische Arrays, Matrixformeln, Pivot-Tabellen und
-Diagramme, Zielwertsuche, Solver, Szenarioanalyse, Analyse-Werkzeuge, Makros
und VBA, Office Scripts, bedingte Formatierung, verbundene Zellen, geschützte
Bereiche, Drucklayouts, Finanz- und Statistikfunktionen.

**Airtable:** stärkere Datenbankstruktur, Oberflächen für Endnutzer, app-artige
Formulare, Automationen mit mehr Integrationslogik, **Skripting in JavaScript**,
Erweiterungen, robustere CSV-Wege, rasterartiges Bearbeiten.

**Vier Beispiele, die das greifbar machen:**

| Aufgabe | Excel / Airtable | Notion |
|---|---|---|
| Laufender Kontostand | `=C2+B3-C3`, runterziehen | geht nicht — keine Vorzeile |
| Pivot Monat × Kategorie | Standard | keine echte Kreuztabelle |
| Zufällige Aufgabe ziehen | `=INDEX(A:A; RANDBETWEEN(...))` | kein `random()` |
| Summe je Kunde ohne Relation | `=SUMIF(...)` | geht nicht ohne Verknüpfung |

**Fair bleiben:** Notion ist dafür stark bei Aufgaben, Projekten, Wikis,
Dokumentation neben den Daten und daran, dass jede Zeile eine vollwertige Seite
ist. Die Liste hier sagt nicht „schlecht", sondern „anders gebaut".

---

<a id="13-unsere-app"></a>
## 13. Was davon unsere App anders macht

Ehrlich in beide Richtungen — **fett** heisst: bei uns kein Problem.

| Grenze bei Notion | Bei uns |
|---|---|
| 3 Anfragen/Sekunde über die API | **entfällt** — kein Server, alles im Browser |
| 500 KB Nutzdaten, 1 000 Blöcke je Anfrage | **entfällt** — direkter Speicherzugriff |
| 2 000 Zeichen je Textstück | **entfällt** |
| 5 MB Dateien im kostenlosen Tarif | **nur der Platz des Browsers begrenzt** (meist Gigabytes) |
| Offline nur 50 Zeilen der ersten Ansicht | **alles ist immer offline** — es gibt kein Online |
| Offline nicht im Browser | **wir sind nur Browser** |
| Embeds, KI-Blöcke, Formulare, Knöpfe offline tot | Formulare und Knöpfe **laufen offline**; KI braucht ein Modell |
| Zwei Offline-Änderungen: eine geht verloren | **kein Abgleich, kein Verlust** — ein Gerät, eine Wahrheit |
| Kein `random()` | **`zufall()` ist da** |
| Formeln höchstens 15 Ebenen tief | **keine Ebenenbegrenzung** |
| Keine Schleifen in Formeln | Formeln nein — aber **Worker führen echtes JavaScript aus** |
| Keine Nebenwirkungen aus Formeln | **Automationen und Knöpfe schreiben zurück** |
| Keine Formel als Auslöser | **geht** — Bedingungen sind frei kombinierbar |
| Agent kann keine Formeln, Rollups, Knöpfe anlegen | **unser Agent legt sie an** (11 Werkzeuge) |
| Agent kann keine Kommentare schreiben | **geht** |
| Agent kann keine Erinnerungen anlegen | **geht** |
| Agent kann keine Besprechungsnotizen starten | **geht** |
| Ohne Konto kein Zugriff | **es gibt gar kein Konto** |
| Export kein Rundlauf | **Sicherung ist ein vollständiger Rundlauf** — JSON raus, JSON rein |
| Ganzer Export bis 30 Stunden, Link 7 Tage | **eine Datei, sofort** |
| Daten in AWS, Region nur für Enterprise | **auf deinem Gerät** |
| Keine Ende-zu-Ende-Verschlüsselung | **die Daten verlassen das Gerät nicht** |
| Beim Herunterstufen: 1 000 Blöcke, 7 Tage Verlauf | **es gibt keinen Tarif** |
| PDF-Gesamtexport wird eingestellt | **Drucken und PDF bleiben** |

### Und wo Notion uns voraus ist — ebenso ehrlich

| Was | Notion | Wir |
|---|---|---|
| Echte Zusammenarbeit in Echtzeit | ja | nein — ein Gerät |
| Abgleich über mehrere Geräte | ja | nur über Sicherungsdatei |
| Rechte, die wirklich schützen | serverseitig durchgesetzt | Absprache im Browser, kein Schloss |
| Öffentliche API mit Token | ja | nein — dafür bräuchte es einen Server |
| Mobile App im Store | ja | PWA über Safari |
| Suche über Millionen Seiten | serverseitiger Index | im Browser, reicht für Zehntausende |
| Unternehmensfunktionen (SSO, Prüfprotokoll, SCIM) | ja | nein |

### Was Notion und wir gleichermassen nicht können

- **Keine Pivot-Tabelle** — wir haben Gruppierung, Diagramme und ein
  Dashboard, aber keine echte Kreuztabelle mit dynamischen Spalten
- **Keine verbundenen Zellen**
- **Kein Zellenraster mit A1-Bezügen**, keine Matrixformeln, kein Solver
- **Keine Zwischensummen auf mehreren Ebenen**
- Beides ist **kein Excel** — und will es auch nicht sein

---

## Quellen

Alles Folgende wurde beim Schreiben selbst geöffnet und gelesen:

- [API-Limits](https://developers.notion.com/reference/request-limits) — Rate Limit, Nutzdaten, alle Feldgrenzen
- [Dateien und Medien](https://www.notion.com/help/images-files-and-media) — 5 MB, 5 GB, PDF 20 MB
- [Häufige Formelfehler](https://www.notion.com/help/common-formula-errors) — die 15 Ebenen, Rechte, Rückgabetypen
- [Einführung in Formeln](https://www.notion.com/help/formulas) — kein `random()`, keine `for`-Schleifen
- [Seiten offline nutzen](https://www.notion.com/help/use-pages-offline) — 50 Zeilen, kein Browser, Konflikte
- [Notion Agent](https://www.notion.com/help/notion-agent) — die vollständige Kann-nicht-Liste
- Notion-KI im Arbeitsbereich „Redur babats", drei Runden am 2. August 2026 —
  sie hat für ihre Antworten selbst diese Seiten geladen und bei fehlenden
  Belegen ausdrücklich „keine offizielle Zahl gefunden" geschrieben
