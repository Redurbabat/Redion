# Die Umzugsliste der Premium-Schale (E272)

Diese Datei beantwortet EINE Frage, und zwar für jeden einzelnen Knopf, den
Redion heute hat:

> Wo steht er morgen — und ruft er dort dieselbe Funktion wie heute?

Sie ist die Bedingung dafür, dass der Umbau der Schale kein Funktionsverlust
wird. Der Masterprompt nennt sie §2.1 Pflicht; CLAUDE.md §46 sagt dasselbe
kürzer: Daten und Funktionen zuerst, Aussehen danach.

**Gezählt, nicht geschätzt.** Alle Zahlen unten sind am 30. August 2026 aus dem
Quelltext gelesen worden, nicht aus der Dokumentation übernommen. Wo eine
Zahl im Code selbst falsch stand, steht das dabei.

---

## Teil 0 · Was heute wirklich da ist

Alle Zahlen unten sind **im laufenden Browser gemessen**, nicht im Quelltext
abgezählt. Das ist nicht dasselbe: `zeigen()` streicht Einträge, deren Modul
fehlt, und `BRAUCHT_SEITE` streicht drei ganze Reiter, solange keine Seite offen
ist. Eine Zahl aus der Datei wäre eine Obergrenze, keine Wirklichkeit.

### Das Band hat drei verschiedene Grössen

| Lage | Einträge |
|---|---|
| keine Seite offen | **22** |
| Textseite offen | **117** |
| Seite mit Zeichenfläche offen | **141** |

Je Reiter, bei offener Zeichenfläche:

| Reiter | Einträge |
|---|---|
| `start` | 14 |
| `einfuegen` | 69 |
| `zeichnen` | 30 |
| `werkzeuge` | 11 |
| `elektro` | 8 |
| `ansicht` | 9 |

**141 ist die Zahl, an der die 15er-Regel zu rechnen ist.** Sie bedeutet: in den
Reitern Einfügen und Zeichnen wandert der grössere Teil ins `•••`, in allen
anderen passt alles.

### Und der Rest

| Was | Anzahl | Woher |
|---|---|---|
| Bandreiter | 6 | `menueband.ts:86-92` |
| Blockarten im Register | 78, davon 67 ohne `aktion` | `Register.bloecke.alle()` |
| Einträge im Reiter Einfügen | 69 | 67 Blockarten + 2 aus `Blocks.AM_ENDE` |
| Module | 16 | `src/register/module.ts` |
| Navigationseinträge | 39 | oben 10 · apps 19 · baum 3 · fuss 2 · unten 5 |
| davon heute **gezeichnet** | **31** | die 3 `baum`- und die 5 `unten`-Einträge nicht, siehe unten |
| Schalen-Bedienelemente ausserhalb des Bands | 76 | Seitenleiste 22 · Telefonleiste 5 · Kopfzeile 13 · Tastenleiste 11 · KI-Panel 20 · Rest 5 |

### Zwei Zahlen in der Datei stimmten nicht

`src/register/menueband.ts:642` spricht von „jedem der 108 Einträge". Gemessen
sind es 141. Die Zahl ist beim Wachsen der Register nicht mitgewachsen;
`anzahl()` (`:703`) rechnet zur Laufzeit und nennt deshalb keine feste Zahl.

Und beim Nachzählen fiel ein zweiter Unterschied auf, der kein Kommentarfehler
war, sondern ein echter: **das Band zeigte zehn Werkzeuge, das Register führt
elf.**

### Der Knopf „Zeitmesser" stand seit E268 nie da

`w-zeit` hatte als Bedingung `kann(() => (window as any).Zeitmesser)`.
`kann()` fragt aber `typeof griff() === 'function'` (`menueband.ts:114`), und
`Zeitmesser` ist das **Modul**, ein Objekt. Die Antwort war immer „nein"; der
Knopf kam nie in die Liste. Alle 26 anderen Aufrufe von `kann()` in dieser Datei
nennen eine Methode (`Werkzeuge.journal`, `Links.graph`, …) und waren nie
betroffen.

Berichtigt zu `kann(() => (window as any).Zeitmesser?.panel)`. Dabei kam der
zweite Teil desselben Fehlers zum Vorschein: das Zeichen `clock`, das der
Eintrag seit E268 nennt, gab es im Symbolregister nicht — der Knopf hätte das
Wort `clock` gezeigt. Aufgefallen wäre das nie, weil er nicht da war. Beides
ist in Phase A behoben.

### Acht Navigationseinträge werden gar nicht gezeichnet

Ein Fund, kein Nebensatz:

* `Register.navigation.anPlatz('baum')` wird **nirgends aufgerufen**. Die drei
  Einträge `favoriten`, `seiten`, `geteilt` sind Überschriften ohne `tun` und
  ohne Leser. Die einzigen `anPlatz`-Aufrufer sind `seitenleiste.ts:640` und
  `:733` (für `apps` und `unten`) sowie `schale.ts:3064/3065` (`oben`, `fuss`).
* Die fünf `unten`-Einträge (`vorlagen`, `bibliothek`, `papierkorb`,
  `einstellungen`, `hilfe`) fallen durch den Filter in `seitenleiste.ts:733`:
  gezeichnet wird nur, was `x.tun && x.vonAussen` hat, und eingebaute Einträge
  haben kein `vonAussen`.

**BERICHTIGT IN PHASE E.** Hier stand: „Der Reiter Gehen bringt diese fünf
Wege zum ersten Mal seit ihrer Eintragung wieder auf den Bildschirm." Der
erste Teil stimmt — sie werden gefiltert. Der zweite nicht: nachgemessen
führt jeder der fünf zu einem Ziel, das anderswo schon steht.

    vorlagen      → Galerie.oeffne()        = app-markt
    bibliothek    → Bibliothek.oeffne()     = app-bib
    papierkorb    → App.papierkorb()        = papierkorbFuss
    hilfe         → Rundgang.uebersicht()   = app-kann
    einstellungen → Einstellungen.oeffne()  = Modul „einstellungen"

Es ist also nichts verlorengegangen, als sie unsichtbar waren, und es kommt
auch nichts zurück. Gefunden hat es eine Gegenprobe in Phase E: den Platz
`unten` aus der Schleife genommen, und der Prüflauf blieb grün — eine
Gegenprobe, die nichts beweist, weil es nichts zu beweisen gab.

Was bleibt: acht Registereinträge werden nicht gezeichnet, und der Grund
dafür ist ein Filter, den niemand mehr begründen kann. Das ist eine
Aufräumaufgabe für Phase J, kein Funktionsverlust.

---

## Teil 1 · Die Reiter: 6 alte → 8 neue plus Datei

### Was mit den sechs alten Reitern geschieht

| alt | Einträge | neu |
|---|---|---|
| `start` | 14 | bleibt **Start**, wächst um Zurücknehmen und Seite |
| `einfuegen` | 69 | bleibt **Einfügen**, unverändert registergespeist |
| `zeichnen` | 30 | bleibt **Zeichnen** |
| `werkzeuge` | 11 | **aufgelöst** — siehe R6 unten |
| `elektro` | 8 | **virtueller Reiter** — bleibt im Register, verschwindet aus dem Band |
| `ansicht` | 9 | bleibt **Ansicht**, wächst um Kante/Teilen/Schrift |
| — | — | **Gehen** (neu, aus `Register.module` + `Register.navigation`) |
| — | — | **Verlauf** (neu) |
| — | — | **Überprüfen** (neu) |
| — | — | **Hilfe** (neu) |
| — | — | **Datei** = Backstage, kein Reiter im `tablist` |

### R6 · Der Reiter „Werkzeuge" wird aufgeteilt

Jede der elf Zeilen behält ihren Griff. Keine wird neu geschrieben.

| id | Griff heute | morgen |
|---|---|---|
| `w-journal` | `Werkzeuge.journal()` | Gehen → Erfassen |
| `w-memos` | `Werkzeuge.schnellnotizen()` | Gehen → Erfassen |
| `w-vorlagen` | `Werkzeuge.vorlagen()` | Gehen → Erfassen |
| `w-graph` | `Links.graph()` | Überprüfen → Wiederfinden |
| `w-tags` | `Links.tagRegister()` | Überprüfen → Wiederfinden |
| `w-lernen` | `Werkzeuge.lernen()` | Überprüfen → Lernen |
| `w-stand` | `Status.seiteAnlegen()` | Hilfe → Über Redion |
| `w-agenten` | `App.reiterWechseln('chat')` | Gehen → Verbinden, **Griff wechselt** (siehe unten) |
| `w-bespr` | `App.reiterWechseln('bespr')` | Gehen → Verbinden, **Griff wechselt** |
| `w-zeit` | `Zeitmesser.panel()` | Gehen → Planung & Lernen |
| `w-zuletzt` | `Bibliothek.oeffne()` | Verlauf → Zuletzt |

**Die zwei Griffwechsel sind Pflicht, nicht Geschmack.**
`App.reiterWechseln('chat')` schaltet den **Seitenleisten**-Baum auf die
Agentenliste (`KI.seitenleiste`). Stirbt die Seitenleiste in Phase F, zeigt der
Knopf ins Leere. Beide werden deshalb in Phase F — als **eigener Commit**, damit
der Wechsel im Verlauf sichtbar bleibt — auf `App.kiPanel(true)` bzw.
`Meeting.panel()` umgehängt. Das ist derselbe Ort, nur ohne den Umweg über eine
Leiste, die es dann nicht mehr gibt.

### Der virtuelle Elektro-Reiter

Redur hat entschieden: kein eigener Elektro-Reiter, wie im Prototyp.

Die acht Einträge **behalten `reiter: 'elektro'` im Register**. Nur die
`REITER`-Konstante führt ihn nicht mehr. Das ist wichtig, weil
`src/bereiche/elektro/start.ts:64-66` seine acht Kacheln aus
`Register.menueband.inReiter('elektro')` liest — dieser Leser darf nicht
brechen. Er bricht auch nicht, denn `inReiter()` filtert über das Feld, nicht
über die Reiterliste.

| id | Griff | sichtbar künftig über |
|---|---|---|
| `e-rechner` | `Electrical.open()` | Gehen → Elektro; Kontextkante `elektro` |
| `e-formelheft` | `Formelheft.oeffne()` | Kontextkante `elektro` und `pdf` |
| `e-dreieck` | `Elektrolernbilder.dreieckFlaeche()` | Kontextkante `elektro` |
| `e-sinus` | `Elektrolernbilder.sinusFlaeche()` | Kontextkante `elektro` |
| `e-ueben` | `Elektroarbeitsplatz.uebung()` | Kontextkante `elektro` + Überprüfen → Üben |
| `e-pruefung` | `Elektroarbeitsplatz.pruefungFlaeche()` | Kontextkante `elektro` + Überprüfen → Üben |
| `e-arbeitsplatz` | `Elektroarbeitsplatz.arbeitsplatz()` | Kontextkante `elektro` |
| `e-plan` | `Blocks.einfuegenAmEnde('schaltplan')` | Zeichnen → Fläche (dort steht `z-plan` mit demselben Griff) |

`e-plan` und `z-plan` rufen wörtlich dasselbe. Das ist heute schon so und bleibt
so — zwei Wege zu einem Ziel sind erlaubt, zwei Fassungen desselben Ziels nicht.

### Die neuen Reiter, Zeile für Zeile — jede an einem Griff, den es gibt

**Verlauf**

| Eintrag | Griff | Fundstelle |
|---|---|---|
| Zurück | `Verlauf.zurueck()` | `src/kern/zustand/verlauf.ts:77` |
| Vor | `Verlauf.vor()` | `verlauf.ts:86` |
| Fassungen | `Werkzeuge.versionen(seite)` | `werkzeuge.ts`, Exportliste :2572 |
| Duplizieren | `App.dupliziereSeite(seite)` | `schale.ts`, Exportliste |
| Verschieben | `Werkzeuge.verschiebenNach(seite)` | Exportliste :2578 |
| Papierkorb | `App.papierkorb()` | Exportliste |
| Kommentare | `Kommentare.panel(id)` | Aufruf `editor.ts:1035` |
| Posteingang | `Ansichten.posteingang()` | `ansichten/dienst.ts:325` |
| Zuletzt | `Bibliothek.oeffne()` | von `w-zuletzt` |

**Zurück/Vor sind neu im Band, aber nicht neu in Redion.** `Verlauf.zurueck()`
gibt es seit langem; gerufen wird es heute nur von Strg+Z (`schale.ts:2368`) und
vom Seitenmenü (`:622`). Ein Bandknopf dafür fehlte — er ruft dieselbe Funktion.

**Nicht verwechseln mit `wz-undo`/`wz-redo`** im Reiter Zeichnen: die rufen
`Zeichenziel.ruf('undo')` und nehmen einen **Strich** zurück, nicht eine
Textänderung. Beide bleiben nebeneinander stehen, weil sie zwei verschiedene
Dinge tun. Ihre Namen müssen das sagen: „Zurück (Seite)" gegen „Zurück (Strich)"
— sonst ist der eine Knopf eine Falle. Wird in Phase D entschieden und im
Eintrag festgehalten.

**Überprüfen**

| Eintrag | Griff |
|---|---|
| Text erkennen | `Recognition.scan()` (heute `z-erkennen`) |
| Seite abfotografieren | `Recognition.capturePage()` (heute `z-scan`) |
| Statistik | `Werkzeuge.statistik(seite)` — Exportliste :2574 |
| Graph | `Links.graph()` |
| Schlagwörter | `Links.tagRegister()` |
| Karteikarten | `Werkzeuge.lernen()` |
| Fällige Karten | `Werkzeuge.faellig()` — Exportliste :2573 |
| Üben | `Elektroarbeitsplatz.uebung()` |
| Prüfung | `Elektroarbeitsplatz.pruefungFlaeche()` |
| Zeitmesser | `Zeitmesser.panel()` |
| Kommentare | `Kommentare.panel(id)` |

**Hilfe**

| Eintrag | Griff |
|---|---|
| Was Redion kann | `Rundgang.uebersicht()` |
| Tastenkürzel | `Werkzeuge.tastenkuerzel()` |
| Erste Hilfe | `Pflege.ersteHilfe()` — `pflege.ts:512` |
| Umsetzungsstand | `Status.seiteAnlegen()` |
| Sicherung speichern | `App.sicherungSpeichern()` |
| Papierkorb | `App.papierkorb()` |

**Ansicht — was dazukommt**

| Eintrag | Griff | Zustand |
|---|---|---|
| Kontextkante | `Kontextkante.umschalten()` | neu in Phase F |
| Reiter teilen | `Fenster.teilen()` | `reiter.ts:143`, da |
| Teilung aufheben | `Fenster.teilenAus()` | `reiter.ts:152`, da |
| Dokumentmodus | `DocumentMode.toggle(seite, true)` | `document-mode.ts:424`, da, mit `available()` als `zeigen()` |
| Schrift grösser/kleiner | **Griff fehlt** — siehe Teil 5 |
| Volle Breite | **Griff fehlt** — siehe Teil 5 |

---

## Teil 2 · Gehen — woher die Einträge kommen

Gehen erfindet keine Liste. Es liest `Register.module.alle()` (16) und
`Register.navigation` (39) und legt darüber zwei kleine Karten:

* `GEHEN_GRUPPE` — welche Kennung in welche Gruppe gehört
* `GEHEN_DOPPELT` — welche zwei Kennungen dasselbe Ziel haben

### Die Dedup-Karte (gemessen an den Griffen, nicht an den Namen)

| bleibt | fällt weg als Zweitweg | gemeinsames Ziel |
|---|---|---|
| `heute` | `lernwelt` | `Produktwelten.lernen('heute')` |
| `workspace` | `arbeitswelt` | `Produktwelten.workspace(…)` — `'start'` wird auf `'uebersicht'` abgebildet, `produktwelten.ts:108` |
| `app-notizhefte` | `notizhefte` | `Notebook.oeffnen()` |
| `elektro` (nav) | `elektro` (module) | `Elektrostart.oeffne()` — seit L65 absichtlich gleich |
| `einstellungen` (module) | `einstellungen` (nav, Platz unten) | `Einstellungen.oeffne()` |
| `app-kann` | `hilfe` (module) **und** `hilfe` (nav) | `Rundgang.uebersicht()` — eine Dreiergruppe |
| `app-markt` | `vorlagen` (nav, Platz unten) | `Galerie.oeffne()` |
| `app-bib` | `bibliothek` (nav, Platz unten) | `Bibliothek.oeffne()` |
| `papierkorbFuss` | `papierkorb` (nav, Platz unten) | `App.papierkorb()` |

### Vier Einträge, die KEIN Gehen-Ziel sind

| Kennung | warum nicht |
|---|---|
| `lebensbereiche` (module) | sagt selbst „KEIN EIGENER BILDSCHIRM" (`module.ts:93`); ohne offene Seite nur ein Toast |
| `dokumentmodus` (module) | schaltet einen Modus AUF der offenen Seite; ohne passende Seite ein Toast → gehört nach **Ansicht** |
| `editor` (module) | `App.oeffne(App.aktuelleSeite())` — zurück zur laufenden Seite, kein Ort → gehört nach **Verlauf → Zuletzt** |
| `favoriten`/`seiten`/`geteilt` (baum) | Überschriften ohne `tun`; werden von niemandem gelesen |

### Die Gefahr, die einen eigenen Absatz braucht

**„Bibliothek" heisst vier Mal etwas anderes.** `btn-library` ruft
`Produktwelten.bibliothek()` (`navigation.ts:103`), `hl-dok` ruft
`Bibliothek.oeffne()` (`schale.ts:3133`), `app-bib` und `bibliothek` rufen
ebenfalls `Bibliothek.oeffne()`. Drei davon sind dasselbe, eine ist es nicht:
`Produktwelten.bibliothek()` geht über die Arbeitswelt und fällt nur dann auf
`Bibliothek.oeffne()` zurück, wenn das Arbeitswelt-Modul fehlt
(`produktwelten.ts:115`).

Wer beim Zusammenlegen die falsche wählt, ändert lautlos, wo der Nutzer landet.
**Gehen führt beide**, unter zwei ehrlichen Namen: „Bibliothek" (die Welt) und
„Alle Seiten" (die Liste). Genau so heissen sie heute schon im Register.

Dasselbe gilt für „Aufgaben": `aufgaben` (nav, oben) →
`Produktwelten.aufgaben()`, `app-aufgaben` → `Bibliothek.aufgaben()`. Der
Kommentar `navigation.ts:141` hält ausdrücklich fest, dass das **nicht**
dasselbe ist. Beide bleiben.

---

## Teil 3 · Backstage — die Datei-Fläche

Jede Sektion hängt an einem Dienst, den es gibt. Alle Signaturen unten sind
nachgelesen, nicht angenommen.

| Sektion | Bindung | Signatur |
|---|---|---|
| Informationen | `Sicherung.stand()` | `{stufe, tage, art, wann}` — `tage: null` heisst **unbekannt**, nicht null Tage; die Stufe ist dann bewusst `warnen` |
| | `Sicherung.platz()` | `Promise` — **asynchron**, erst ohne zeichnen, dann nachtragen; `bekannt:false` ⇒ **kein Balken**, eine erfundene Zahl wäre schlimmer als keine |
| | `Sicherung.groesse(bytes)` | gleichläufig, `de-CH` |
| | `OrdnerSicherung.moeglich/an/name/zuletzt/fehler` | E270; `moeglich()` **vor** `an()` fragen — Safari iOS und Firefox können es nicht |
| Neu | `App.erstellenWege()` / `App.erstellenWeg(id)` | E265; **kein eigener Erstellcode** |
| Öffnen | `Bibliothek.oeffne()`, `Notebook.oeffnen()`, `App.suche()` | |
| Kopie / Sicherung | `App.sicherungSpeichern()` | `Promise<boolean>` — der Rückgabewert ist auswertbar |
| | `App.sicherungLaden(danach?)` | gleichläufig, öffnet nur den Wähler |
| | `OrdnerSicherung.waehlen(zusagen?)` | `Promise` — `ok:false` mit **leerem** `grund` heisst Abbruch durch den Menschen und darf **nicht** als Fehler gezeigt werden |
| | `OrdnerSicherung.jetztSichern(laut)` | `laut=true` für den Knopf von Hand |
| Drucken | `Werkzeuge.drucken(seite)` | **asynchron**; nur mit offener Seite (§47) |
| Weitergeben | `Werkzeuge.teilenMenue(anker, seite)` | braucht den Anker für die Menüposition |
| Exportieren | `App.markdownExport(seite)`, `Werkzeuge.htmlExport(seite)`, `Werkzeuge.einzelDatei()`, `Werkzeuge.ordnerSchreiben()` | Markdown/HTML nehmen das **Seitenobjekt**, nicht die id |
| Konto | `WolkeFenster.dialog()` | Redion-Konto |
| | `Verbindungen.dialog()` | **Drittkonten** (Google, GitHub, Jira) — ein anderes Ding |
| Optionen | `Einstellungen.oeffne(bereich?)`, `Aussehen.dialog()`, `App.theme()`, `Werkzeuge.tastenkuerzel()` | |

### Die Sektion „Senden" gibt es nicht

Der Prototyp hat sie. Redion hat keinen Sendeweg: **`Mail.senden` existiert
nicht**, und der Code sagt es selbst — `editor.ts:2369-2372`: „Hier stand
`Mail.senden(…)` — die Funktion gibt es nicht. Das Mail-Modul kann lesen und
antworten, aber nicht von sich aus verschicken." Die zwei tatsächlichen Wege
sind `location.href = 'mailto:…'` und Gmails Compose-Fenster im neuen Tab.

Die Sektion heisst deshalb **„Weitergeben"** und öffnet `teilenMenue` — den
echten, vollständigen Weg (Link, Text, Markdown, HTML, PDF, Word, Excel,
Obsidian). Ein Knopf „Senden", der nichts sendet, wäre genau die Sorte
Enttäuschung, gegen die `zeigen()` im Menüband gebaut wurde.

---

## Teil 4 · Kontextkante — je Bereich

Die Kante ist nicht hartkodiert. Jeder Bereich meldet sich selbst an
(`Register.kontext.melde(…)`, Phase F). Diese Tabelle sagt, **was** er anmeldet
und **woher** die Zeilen kommen.

| Bereich | Knöpfe | Quelle |
|---|---|---|
| `heute` | Überblick · Favoriten · Zuletzt · Angeheftet | `Ansichten`, `App.kuerzlich()` |
| `bibliothek` | Übersicht · Notizbücher · Favoriten · Zuletzt · Import · Suche | `Bibliothek`, `Notebook` |
| `editor` | Seitenwerkzeuge · Blöcke · Verweise · Karteikarten · Kommentare · Fassungen | `Register.bloecke`, `Links`, `Kommentare`, `Werkzeuge.versionen` |
| `pdf` | Werkzeuge · Schreiben & Zeichnen · Formelheft · Fachzeichen · OCR · Anhang | `Zeichenziel`, `Formelheft`, `Register.fachzeichen`, `Recognition` |
| `aufgaben` | Heute · Geplant · Priorität · Kalender · Filter | `Plan`, `Bibliothek.aufgaben` |
| `datenbank` | Ansichten · Filter · Sortieren · Gruppieren · Formeln · Automationen | `Register.ansichten`, `Register.eigenschaften`, `Register.formeln` |
| `elektro` | die acht Einträge aus `inReiter('elektro')` | **dieselbe Quelle wie die Elektro-Startseite** |
| `lernen` | Karteikarten · Fällig · Lernpfad · Prüfungen | `Werkzeuge.lernen/karten/faellig` |
| `ki` | Chat · Agent · Besprechung · Protokoll | `App.kiPanel`, `Agent.panel`, `Meeting.panel` |

**Die PDF-Kante existiert schon** — als Werkzeugspalte mitten im Dokumentmodus
(im Bild von heute gut zu sehen: Schreiben · Auswahl · Stift · Marker · Linie ·
Pfeil · Rechteck · Ellipse · Abdecken · Haftnotiz · Text · Fachzeichen ·
Radieren · Zurück · Vor · Löschen · Lineal · Farben · Strichstärken). Sie
wandert an den Rand, sie wird nicht neu geschrieben.

---

## Teil 5 · Was nicht geht — die ehrlichen Lücken

Der Masterprompt verbietet Funktionsverlust. Er verbietet nicht, eine fehlende
Funktion fehlend zu nennen. Diese vier Prototyp-Knöpfe haben in Redion **keinen
Griff**:

| Prototyp-Knopf | Befund | Entscheidung |
|---|---|---|
| **Vollbild** | Es gibt im ganzen `src/`-Baum keinen Vollbild-Griff. `requestFullscreen` kommt zweimal vor: im Präsentationsmodus (`werkzeuge.ts:995`) und als `allowfullscreen`-Attribut einer Einbettung. `Werkzeuge.fokus()` setzt nur eine CSS-Klasse. | Kein Knopf „Vollbild". **Präsentation** (`a-praes`) steht schon da und tut das Echte. → LUECKEN |
| **Zoom** | Kein Zoom-Griff. Strg + / − / 0 setzt `Store.setMeta('schriftgroesse', …)` in drei Stufen — **inline im Tastenhandler**, `schale.ts:2436-2451`, also nicht aufrufbar. | Phase D zieht denselben Code als `App.schriftgroesse(richtung)` heraus. Kein neues Verhalten, eine Stelle statt keiner. |
| **Volle Breite** | Kein benannter Griff. Der Schalter lebt im Seitenmenü (`schale.ts:432`) und in der Krume (`kopfleiste.ts:269`, `data-a="wide"`) als `Store.updateBlock(p.id, {wide: …})`. | Phase D zieht ihn als `App.volleBreite(p)` heraus — beide Aufrufer rufen dann dieselbe Funktion. |
| **Senden** | `Mail.senden` gibt es nicht (Beleg oben). | Sektion heisst „Weitergeben", bindet `teilenMenue`. → LUECKEN |

Alle vier kommen als Punkte nach `LUECKEN.md`.

---

## Teil 6 · Was beim Umbau lautlos brechen kann

Zwölf Stellen, an denen ein `?.` oder ein früher `return` einen Fehler
verschluckt. Sie sind der eigentliche Grund für diese Datei.

1. **`hl-seiten` und `hl-konto` sind bereits tot.** Die Verdrahtung steht
   (`schale.ts:3141-3145` und `:3177`), das Element gibt es in `index.html`
   nicht. `const an = (id, fn) => document.getElementById(id)?.addEventListener(…)`
   (`schale.ts:3050`) bindet still ins Leere. Kein Fehler, kein Prüflauf.
   `produktwelten.ts:278-280` hält für `hl-seiten` sogar fest, dass es ihn seit
   E236 nicht mehr gibt — die Zeile in `schale.ts` wurde dabei vergessen.
   → Phase J.
2. **Eine dritte tote Verdrahtung**, im Auftrag nicht genannt:
   `produktwelten.ts:292` hängt an `element('weltwechsel')`. Der Welt-Umschalter
   ist mit E206 entfernt worden. → Phase J.
3. **Totes CSS dazu**: `produktwelten.css:78` und `:81` ordnen Knöpfe, die es
   nicht gibt. → Phase J.
4. **Das Seitenmenü klickt die Kopfzeile an.** `schale.ts:604` und `:605` führen
   zwei Menüeinträge über `document.getElementById('btn-komm')?.click()` und
   `('btn-auto')?.click()` aus. Verschwinden diese zwei Kopfzeilenknöpfe,
   sterben zwei Menüeinträge mit. → **`#topbar` bleibt** (Bau-Entscheid 4).
5. **Vier Kopfzeilenknöpfe hängen an der Brotkrume.** `Kopfleiste.pfad()`
   (`kopfleiste.ts:322-382`) steigt bei `if (!c) return;` (`:329`) aus, wenn es
   `#crumb` nicht gibt — danach zeichnet niemand mehr `btn-fav`, `btn-komm`
   samt Zähler, `btn-lock` samt Zustand und `btn-auto` samt Sichtbarkeit.
   → **`#crumb` bleibt**.
6. **Die ruhige Fassung lebt im Markup.** `data-ruhig="bleibt"|"mehr"|"schalter"`
   steht ausschliesslich in `index.html`; `ruhig.ts` setzt nur `body[data-ruhig]`.
   Wer Knöpfe umbaut und die Attribute vergisst, hat einen Mehr-Knopf, der
   nichts mehr ausblendet — und wieder keinen Fehler.
7. **Die Markierung der Telefonleiste ist eine feste Kennungstabelle.**
   `seitenleiste.ts:333-335` bildet Reiternamen auf `hl-dok`, `hl-start`,
   `hl-lernen`, `hl-bespr`, `hl-mehr` ab, **ohne Rückfall** (Kommentar
   `:346-351`). Eine falsche Kennung ⇒ die Markierung verschwindet still.
8. **Beschriftungen stehen doppelt.** `produktwelten.ts:276/277/287` überschreibt
   zur Laufzeit die Texte von `hl-start`, `hl-lernen`, `hl-bespr`, die schon in
   `index.html:247-249` stehen.
9. **Der Rundgang zeigt auf fünf Schalen-Kennungen**: `#btn-search` (`:44`),
   `#btn-new` (`:48`), `#btn-ai` (`:55`), `#btn-settings` (`:68`), `btn-import`
   (`:424`). → Phase H zieht die Schritte um.
10. **`btn-settings` ist auch eine Anzeige.** `schale.ts:2982-2988` schreibt den
    Arbeitsbereichsnamen in sein zweites `<span>` und das Zeichen in alle
    `.ws-icon` — seit E236 auch in das Konto in der Menüleiste. Ein
    Backstage-Umbau muss diesen Zustand mitnehmen.
11. **`btn-import` ist absichtlich nicht im Register** (`navigation.ts:231-234`):
    sein Menü braucht das Klickereignis für die Position. Er lässt sich als
    einziger Fusseintrag nicht über `knopfId` mitnehmen.
12. **Elf Seitenleistenknöpfe hängen nicht einzeln, sondern über eine Schleife**
    (`schale.ts:3060-3097`) über `anPlatz('oben')` und `('fuss')`. Wer nach
    `an('btn-search'` sucht, findet nichts und hält den Knopf für tot. Die
    Schleife setzt zusätzlich `aria-current="page"` — nur für `oben`.

### Und drei Dinge, die kein neues Zuhause bekommen

* **`#tastenleiste`** (11 Knöpfe): schwebt am Telefon über der Bildschirm-
  tastatur, mit eigener `visualViewport`-Logik (`pwa.ts:250-260`). Weder Kante
  noch Backstage. **Bleibt, wie es ist.**
* **`aside#ai`** (20 Bedienelemente): vollständig in `ki/dienst.ts` verdrahtet,
  kein einziges in `schale/aufbau/`. **Bleibt, wie es ist**; die Kante bekommt
  nur den Weg dorthin (✦).
* **`#zum-inhalt`**: Sprungmarke auf `#page`. Bekommt der Inhaltsbereich eine
  andere Kennung, zeigt sie ins Leere — und niemand merkt es, weil sie nur bei
  Tastaturfokus sichtbar wird. **`#page` bleibt `#page`.**

---

## Teil 7 · Eine Eigenheit, die jeder neue Schalencode kennen muss

**`App` liegt nicht auf `window`.** `src/global.d.ts:79` sagt es wörtlich: „Wie
`Store` ist sie ein gewöhnliches `const` auf oberster Ebene und steht **nicht**
auf `window`; wer `window.App` schreibt, bekommt `undefined`." Der Zugriff läuft
über den blossen Bezeichner `App`, was geht, weil alle Dateien als klassische
`<script>`-Dateien denselben globalen Bindungsraum teilen.

Auf `window` liegen dagegen: `Ansichten`, `Verlauf`, `Fenster`, `WolkeFenster`,
`Werkzeuge`, `Einstellungen`, `Verbindungen`, `Sicherung`, `OrdnerSicherung`,
`Zeichenziel`, `Mail`, `Wolke`, `DocumentMode`.

Für Module, die in der Einzeldatei fehlen können, gilt weiterhin der Wächter
`typeof X !== 'undefined'`.

**test87 §3 betrifft die neuen Dateien nicht.** Die Regel „die Zeichner kennen
App nicht" führt drei Dateien namentlich: `seitenleiste.js`, `kopfleiste.js`,
`inhaltsflaeche.js` (`test87.mts:151`). `menueband.js` ruft `App.suche()`,
`App.kiPanel()` und `App.arbeitsbereich()` — und ist damit das Vorbild für
`backstage.ts` und `context-rail.ts`.

---

*Gehört zu ENTSCHEIDUNGEN.md E272. Gemessen am 30. August 2026 gegen
`dac7ecbd`.*
