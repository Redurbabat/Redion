# MESSUNGEN.md — was wirklich gemessen wurde

## 23. September 2026 · E697 · Farbwahl und Schreibfluss

**Methode:** Playwright/Chromium, eigener lokaler Dateiserver, frisch
angelegtes Testheft, keine Nutzerdokumente. `node pruefungen/lauf/test577.mts`.
Rechner 1440 × 960; schmale Fenster 390 × 844 und 320 × 844 mit reduzierter
Bewegung. Die schmalen Fenster sind kein Test auf physischer Touch-Hardware.

| Messung | Ergebnis |
|---|---|
| Direkte Palette nach einem Klick, alter Stand | fehlt, neuer Wächter rot |
| Neuer Stand | 29/29 Zusagen grün |
| 20 synchrone Eingabeereignisse | genau 1 Geometrielesung im nächsten Bild |
| Marker-Vorschau | Deckung 0,32 wie der vorhandene Zeichner |
| Neues Gelb | `#ffcf33` an echter Marke, Strichprobe und nach Neuladen |
| Ungültiges Hex | Übernehmen gesperrt, `aria-invalid=true`, Erklärung sichtbar |
| Text nach Formatieren an Position 0 | `Wichtig: Meine Notiz`, dieselbe Textmarke |
| Palette bei 320/390 px | vollständig im Fenster, Farbauswahl mindestens 44 × 44 px |
| Laufzeitfehler | 0 |

**Gefundener Zwischenfehler:** Der erste Palettenentwurf aktualisierte
die Strichprobe und Dokumentvorliebe nicht. Am echten Screenshot erkannt,
durch zusätzliche rote Zusagen gehalten, über den bestehenden Tupfer-Klickweg
behoben. Bestehende Druck-/Glättungsalgorithmen unverändert; keine behauptete
Millisekundenverbesserung auf einem echten Stifttablet.

**Abgrenzung des Altfehlers:** `test537` meldet 518 Querverweise gegen
517 erlaubte. Derselbe Lauf wurde in einer frischen temporären Extraktion
von `a196b65d` (unveränderte GitHub-Basis) ausgeführt: ebenfalls 518/517,
16 Zusagen grün, 1 rot. Das ist der schon dokumentierte Befund L207; das
Verzeichnis wurde weder erweitert noch der Wächter abgeschwächt.

Diese Datei hält **Zahlen** fest, keine Absichten. Sie ist das Gegenstück zu
`ENTSCHEIDUNGEN.md` (warum etwas so ist) und `LUECKEN.md` (was fehlt): hier
steht, **was beim Nachsehen herauskam** — vorher und nachher, mit der
Fenstergrösse, dem Datum und der Methode.

Der Satz, aus dem sie entstanden ist, steht in `CLAUDE.md` §36:

> **Erst messen, dann bauen.**

Und §55.2 sagt, warum das auch für Prüfungen gilt: eine Prüfung, die immer
„passt schon" sagt, ist keine Prüfung.

## Wie eine Zeile hier zu lesen ist

**Eine Zahl ohne Fenstergrösse ist keine Messung.** Dieselbe Leiste misst bei
1440 px etwas anderes als bei 390 px, und genau in diesem Unterschied lagen
mehrere der Funde unten. Jede Messung nennt deshalb:

| Was | Warum |
|---|---|
| Datum | damit man sieht, ob sie noch zum Code passt |
| Fenster | 1440 × 960 ist der Rechner, 390 × 844 das Telefon |
| Methode | damit sie jemand wiederholen kann |
| vorher / nachher | eine Zahl allein sagt nicht, ob sie gut ist |

**Was NICHT hier steht:** Vermutungen, Eindrücke und „sieht besser aus".
Eindrücke gehören in `LUECKEN.md`, wo sie als ungeprüft erkennbar bleiben.
L103 Punkt 2 stand ein Jahr als „bei OCR über achtzig Seiten ruckelt die App"
in der Liste — nachgemessen waren es flache 8 ms je Schritt. Eine Vermutung
im Leistungskapitel kostet Wochen.

---

# Teil I — Die Messungen vom 14./15. September 2026

Alle Messungen dieses Teils stammen aus den Bögen **E573 bis E577**
(Zeichenstudio). Gemessen wurde an der laufenden App über Playwright, gegen
einen kleinen Dateiserver auf `127.0.0.1`, mit einem eigenen Browserkontext —
**keine Nutzerdokumente**, jedes Mal ein frisch angelegtes Testheft.

## 1. Das Dock je Werkzeug

**Frage:** Zeigt das untere Dock das Zubehör des GEWÄHLTEN Werkzeugs, oder
alles, oder nichts?

**Methode:** Alle Kinder von `.document-stage[data-aktiv] .blatt-werk` zählen
und je `data-gruppe` danach fragen, ob sie sichtbar sind (Breite > 0,
Höhe > 0, `display` ≠ none, `visibility` ≠ hidden). Fenster 1440 × 960,
14. September 2026.

### 1.1 Vorher — der Pauschalschalter (Stand E572)

`pdf-studio.css` versteckte im geschlossenen Zustand acht Dinge unbedingt:

| Werkzeug | sichtbar von der eigenen Gruppe |
|---|---|
| `line` | **0 von 7** Formknöpfen |
| `text` | **0 von 7** Schriftknöpfen |
| `select` | **0 von 10** Auswahlknöpfen |
| geschlossen, gesamt | **62 von 86** Kindern unbedingt weg |

*Herkunft: Untersuchungslauf vom 14. September, vor E573. In dieser Sitzung
nicht wiederholt, weil der Zustand danach repariert war.*

### 1.2 Nachher — das Dock liest die Gruppenliste (E573)

Gemessen nach der Reparatur, dieselbe Methode, dasselbe Fenster:

| Werkzeug | sichtbar | davon aus der eigenen Gruppe |
|---|---|---|
| `stift` | 26 / 86 | stil 6/7, formen 2/3, farbe 15/16, breite 3/5 |
| `text` | 21 / 86 | schrift 6/7, farbe 15/16 |
| `select` | 33 / 86 | auswahl 9/10, breite 3/5, farbe 15/16 |
| `marker` | 19 / 86 | lineal 1/2, breite 3/5, farbe 15/16 |
| `zettel` | 15 / 86 | farbe 15/16 |
| `radierer` | **5 / 86** | radierer 5/5, sonst nichts |

### 1.3 Der geöffnete Zustand („···") — unverändert offen

Bei **jedem** Werkzeug: **84 von 86** sichtbar. Das ist derselbe Wert für
`stift`, `text`, `select`, `marker`, `radierer` und `zettel` — „Alle
Optionen" ist wörtlich alle, ohne Rücksicht auf den Kontext.

Das bleibt vorerst so, und zwar mit Grund: `test177`, `test228`, `test437`
und `test515` erreichen über diesen Weg Dinge, die sonst nirgends stehen.
Steht als offener Punkt in `LUECKEN.md` (L157, Plan 7 B 9).

### 1.4 Ein Messfehler, der wie ein Fehler im Produkt aussah

Ein Heft mit zwei Blättern hat **zwei** `.blatt-werk`.
`document.querySelector` nimmt das erste, `inkSync()` aber das der AKTIVEN
Seite. Solange beide gleich sind, fällt das nie auf. `test524` misst seither
überall `.document-stage[data-aktiv] .blatt-werk`.

---

## 2. Die Farbreihe

**Frage:** Wo stehen die neun Haftnotizfarben aus E572?

**Methode:** `.blatt-note-color`, `.blatt-farbe-leiter` und die übrigen
`.blatt-farbe` getrennt zählen, sichtbar und gesamt; dazu die Reihenfolge als
Zeichenkette (t = Tinte, N = Notiz, L = Ader, + = Farbwähler). Fenster
1440 × 960, 14. September 2026.

### 2.1 Vorher

| Werkzeug | Notizfarben sichtbar | Tintenfarben sichtbar | Reihenfolge |
|---|---|---|---|
| `stift` | **9 von 9** | 5 von 5 | `tttttNNNNNNNNN+` |
| `zettel` | 9 von 9 | 5 von 5 | `tttttNNNNNNNNN+` |
| `marker` | **9 von 9** | 5 von 5 | `tttttNNNNNNNNN+` |
| `text` | **9 von 9** | 5 von 5 | `tttttNNNNNNNNN+` |

Vierzehn Tupfer in jedem Werkzeug, von denen neun zu einem gehören, das
gerade nicht gewählt ist.

### 2.2 Nachher (E574)

Eigene Gruppe `notizfarbe`, in der Liste aus E356 nur beim Zettel:

| Werkzeug | Notizfarben | Tintenfarben | „+" |
|---|---|---|---|
| `stift` | 0 | 5 | sichtbar |
| `zettel` | 9 | **0** | sichtbar |

### 2.3 Die Breite der Leiste als Folge davon

Gemessen am Kasten `.document-studio .blatt-werk`, 1440 × 960:

| Werkzeug | Dock | „+" |
|---|---|---|
| `stift` | 941 × 62 px | sichtbar, 44 × 44 |
| `text` | 793 × 62 px | sichtbar, 44 × 44 |
| `zettel` | **520 × 62 px** | sichtbar, 44 × 44 |
| `radierer` | 217 × 62 px (nach E576: 238 × 62) | versteckt |

---

## 3. Die Werkzeugfelder (`InkMenu`)

**Frage:** Geht ein geöffnetes Feld wieder zu, wenn die Fläche darunter
verschwindet?

**Methode:** Laserfeld öffnen, `App.oeffne()` auf eine gewöhnliche Textseite,
800 ms warten, dann nach `.blatt-popover` und `.document-workspace` fragen.
Fenster 1440 × 960, 14. September 2026.

### 3.1 Vorher

| Schritt | Ergebnis |
|---|---|
| 1 · Laserfeld offen | Popover da, offen, Anker „Laserpointer", Studio da |
| 2 · nach dem Seitenwechsel | Popover **immer noch offen**, **380 × 54 px bei 520/159**, Studio **weg**, Anker weg |
| 3 · `resize`-Horcher | läuft weiter — abgemeldet wird er nur im `toggle`-Ereignis |
| 4 · Aussenklick | Popover zu und entfernt; Fokus auf der Zeichenfläche (`svg`) |

Der Kasten schwebte also über einer fremden Textseite, und es gab keinen
Knopf mehr, der ihn je hätte schliessen können.

### 3.2 Nachher (E575)

Kein Popover mehr nach dem Seitenwechsel; kein Knopf mit
`aria-expanded="true"`; `resize`, `keydown`, `pointerdown` und der Beobachter
werden in einem einzigen, idempotenten `ende()` abgeräumt.

### 3.3 Der Ersatzweg ohne native Klappe

`showPopover` aus `HTMLElement.prototype` genommen — die Lage in einem
Browser ohne die Popover-API. Gemessen: Feld geht trotzdem auf, trägt
`.blatt-popover-ersatz`, `position: fixed`, und Escape schliesst es.
`test524` geht diesen Weg bei jedem Lauf.

---

## 4. `inkSync()` — wie oft die Leiste neu gebaut wird

**Frage:** Was kostet ein einziger Klick auf ein Werkzeug?

**Methode:** Ein eigener `MutationObserver` auf `.document-drawingbar` mit
`{childList:true}`; gezählt wird `addedNodes.length + removedNodes.length`.
Fenster 1440 × 960, 14. September 2026.

### 4.1 Vorher

| Tat | Knotenbewegungen | Fokus danach |
|---|---|---|
| Klick auf „Marker" | **156** | `BODY` |
| Klick auf „Stift" | **156** | `BODY` |

156 = dreizehn Knöpfe × zwei Bewegungen (raus und rein) × sechs Rufe von
`inkSync()`. `insertBefore` bewegt auch einen Knoten, der schon am richtigen
Platz steht — und ein bewegter Knoten verliert den Fokus.

**Sortierbewegung:** den letzten Knopf der unteren Leiste nach vorn gezogen,
600 ms gewartet — die obere Reihenfolge war Zeichen für Zeichen unverändert:

```txt
vorher : schreiben,select,stift,marker,formen,abdeck,zettel,text,zeichen,elemente,bild,radierer,laser
nachher: schreiben,select,stift,marker,formen,abdeck,zettel,text,zeichen,elemente,bild,radierer,laser
live angekommen: NEIN
```

### 4.2 Nachher (E575)

| Tat | Knotenbewegungen | Fokus danach |
|---|---|---|
| Klick auf „Marker" | **0** | `BUTTON marker` |
| Klick auf „Stift" | **0** | `BUTTON stift` |

```txt
vorher : schreiben,select,stift,marker,formen,abdeck,zettel,text,zeichen,elemente,bild,radierer,laser
nachher: laser,schreiben,select,stift,marker,formen,abdeck,zettel,text,zeichen,elemente,bild,radierer
unten  : laser,schreiben,select,stift,marker,formen,abdeck,zettel,text,zeichen,elemente,bild,radierer
live angekommen: JA — und zeichengleich mit der unteren Leiste
```

---

## 5. Der Radierer

**Methode:** Knopfkästen und das `<i>` darin messen; den Rundlaufknopf
(`[data-act="radiermodus"]`) und das neue Modusfeld (`[data-act="eraser-menu"]`)
getrennt; für das Gedächtnis: „gross" wählen, Seite wechseln, wiederkommen.
Fenster 1440 × 960, 14. September 2026.

### 5.1 Vorher

| Was | Wert |
|---|---|
| die drei Grössenknöpfe | je **14 × 44 px** |
| ihr `<i>` (die Kreisvorschau) | **0 × 0** — nichts zu sehen |
| Rundlaufknopf | „Ganz", **65 px**, sichtbar |
| Modusfeld | „Ganz ⌄", **60 px**, sichtbar |
| nach Wahl „gross" (28) | 28 ist gewählt — richtig |
| nach einem Seitenwechsel | wieder **5** (klein) |

Zweimal dasselbe Wort nebeneinander, drei leere Felder dazwischen.

### 5.2 Ein Fund beim Bauen: der grösste Kreis wurde gestaucht

Erster Versuch mit 16 / 28 / 40 px Vorschau in 44-px-Knöpfen. Gemessen:

| `--eraser-preview` | `width` berechnet | wirklich |
|---|---|---|
| 16 px | 16 px | 16 px |
| 28 px | 28 px | 28 px |
| **40 px** | **28 px** | **28 px** |

Der dritte Kreis war ein Flex-Element mit `flex-shrink: 1` und wurde auf die
Breite des mittleren gestaucht. **Zwei gleich grosse Kreise sind keine zwei
Grössen.** Jetzt 14 / 22 / 30 px und `flex: 0 0 auto`.

### 5.3 Nachher (E576)

| Was | Wert |
|---|---|
| die drei Grössenknöpfe | je **44 × 44 px** |
| ihre Kreise | 14 / 22 / 30 px, streng wachsend |
| Rundlaufknopf | im Baum, im Studio **nicht sichtbar** |
| Modusfeld | sichtbar |
| nach einem Seitenwechsel | **28** bleibt gewählt, `meta['zeichnen:radierergroesse'] === 28` |

### 5.4 Und eine Spezifitätsmessung nebenbei

Die Zeile, die den Rundlaufknopf zurücktreten lässt, blieb zuerst wirkungslos.
Grund: die Gruppenliste aus E356 steht in derselben Datei **weiter unten** und
hatte dieselbe Spezifität — bei Gleichstand gewinnt die spätere Zeile. Eine
Attributangabe mehr entschied es, ohne `!important`.

---

## 6. Die Zeichen — wie ähnlich sind sie einander?

**Methode (aus `test480 §7`, E515):** jedes Zeichen als SVG in 16 × 16
rastern, Punkte mit `alpha > 40` als Tinte zählen, für jedes Paar
*Schnitt ÷ Vereinigung*. Grenze 60 % — die Mitte zwischen den gemessenen
38 % („zwei Bilder") und 69 % („dasselbe Bild"). 14. September 2026.

### 6.1 Die dreizehn Werkzeuge — vorher

| Paar | geteilte Tinte |
|---|---|
| `inkPen` / `inkLaser` | **69 %** |
| `inkText` / `inkImage` | **64 %** |
| `inkText` / `inkSymbol` | 56 % |
| `inkShapes` / `inkStamp` | 52 % |
| `inkShapes` / `inkSymbol` | 48 % |
| `inkSymbol` / `inkImage` | 48 % |
| `inkHand` / `inkStamp` | 47 % |
| `inkShapes` / `inkText` | 47 % |
| `inkCover` / `inkText` | 47 % |
| `inkStamp` / `inkEraser` | 47 % |

Die zwei über der Grenze stehen in derselben Reihe unmittelbar nebeneinander.

### 6.2 Nachher (E577)

| Paar | geteilte Tinte |
|---|---|
| `inkShapes` / `inkStamp` | **52 %** (schlimmstes Paar) |
| `inkShapes` / `inkSymbol` | 48 % |
| `inkSymbol` / `inkImage` | 48 % |
| `inkHand` / `inkStamp` | 47 % |
| `inkStamp` / `inkEraser` | 47 % |
| `inkCover` / `inkStamp` | 44 % |
| `inkShapes` / `inkImage` | 43 % |
| `inkNote` / `inkImage` | 43 % |
| `inkMarker` / `inkEraser` | 42 % |
| `inkHand` / `inkCover` | 41 % |

`inkPen`/`inkLaser` und `inkText`/`inkImage` stehen nicht mehr in den ersten
zehn.

### 6.3 Die Gegenprobe (§50)

Mit den **alten** zwei Zeichen zurückgedreht meldete `test480 §7b`:

```txt
✗ Kein Paar teilt mehr als 60 % seiner Tinte — inkPen/inkLaser = 69 %
✗ inkPen und inkLaser sind nicht mehr dasselbe Bild — 69 %
✗ inkText und inkImage auch nicht — 64 %
```

Der Wächter ist also rot gewesen, mit genau den Zahlen aus 6.1.

### 6.4 Die sechs Stifte — unverändert, gemessen in E515

| Paar | damals |
|---|---|
| Kugelschreiber / Bleistift | 73 % |
| Füller / Bleistift | 69 % |
| die Paare, die man sofort auseinanderhält | 24 – 38 % |

Daraus stammt die Grenze von 60 %. Heute liegen alle sechs darunter.
`penBrush` und `penPencil` ähneln einander **fürs Auge** weiterhin — das ist
ein Eindruck, keine Messung, und steht deshalb in `LUECKEN.md`.

---

## 7. Die Dock-Bewegung

**Frage:** Wächst das Zeichen — und bleibt die Trefferfläche, wie sie war?

**Methode:** `.document-drawingbar [data-document-tool="stift"]` überfahren,
400 ms warten, dann für jeden Knopf `getComputedStyle(svg).transform` und die
gemessene Breite. Fenster 1440 × 960, 15. September 2026.

| Knopf | `transform` | SVG-Breite |
|---|---|---|
| `schreiben` | none | 25 px |
| `select` | `matrix(1.13, …)` | **28,3 px** |
| **`stift`** (überfahren) | `matrix(1.3, …)` | **32,5 px** |
| `marker` | `matrix(1.13, …)` | **28,3 px** |
| `formen` | none | 25 px |
| `abdeck` | none | 25 px |
| `zettel` | none | 25 px |
| `text` | none | 25 px |

**Die Trefferfläche:** 44 × 44 px vorher, 44 × 44 px während des
Überfahrens, 44 × 44 px danach. Sie bewegt sich nicht — nur das Zeichen.

Die Kinder der oberen Leiste, in der Reihenfolge des Nutzers:

```txt
schreiben · select · stift · marker · formen · abdeck · zettel · text ·
zeichen · {formelheft} · elemente · bild · radierer · laser ·
{ink-ruler} · {ink-options}
```

### 7.1 Ein Messfehler, der wie ein Fehler aussah

Die erste Prüfung war rot, obwohl die Regel stimmte: ein Klick auf ein
Werkzeug lässt die Maus auf diesem Knopf **stehen**, und der Nachbar daneben
stand deshalb schon auf 28,3 px, als die „Ruhe" gemessen wurde. Erst den
Zeiger wegnehmen, dann messen.

---

## 8. Die Verlaufskapsel über dem Papier

**Frage:** Deckt sie die Schreibfläche ab?

**Methode:** Die Rechtecke von `.document-ink-history` und
`.document-stage[data-aktiv] .blatt-marken` schneiden. 15. September 2026.

### 8.1 Vorher

| Fenster | Kapsel (x/y/b/h) | Papier (x/y/b/h) | überdeckt |
|---|---|---|---|
| 1440 × 960 | 12 / 166 / 100 / 54 | 226 / 249 / 978 / 1384 | **0 × 0 px** |
| 390 × 844 | 8 / 163 / 98 / 52 | 19 / 176 / 342 / 485 | **87 × 39 px** |

Am Rechner liegt sie im linken Rand — genau wie in Redurs Bild 1. Am Telefon
gibt es diesen Rand nicht (Papier 342 von 390 px), und dieselbe Ecke ist dort
die, in der die erste Zeile anfängt.

### 8.2 Nachher (E577)

Am Telefon unten links über dem schwebenden Dock. Dass sie dort über Papier
liegt, ist bei 19 px Rand nicht zu vermeiden — die **Stelle** ist es.

---

## 9. Doppelte Zeichen in `index.html`

**Frage:** Stimmt der Übergabesatz „19 handgeschriebene Inline-SVG, davon 15
bytegleiche Kopien des Registers"?

**Methode:** Alle `<svg>…</svg>` aus `index.html` holen, ihre `d="…"`-Pfade
zählen, jeden gegen `src/register/symbole.ts` prüfen (beide auf einfachen
Leerraum normiert). 14. September 2026.

| Was | gezählt |
|---|---|
| `<svg>` in `index.html` | **19** |
| Pfade darin | **35** |
| davon wörtlich auch im Register | **27** |
| ganze SVG, die wörtlich im Register stehen | 2 |

**Der Satz stimmte in der Sache, nicht in der Gestalt:** es gibt echte
Doppelpflege im Sinn von §8, aber sie liegt auf der Ebene der PFADE, nicht
ganzer Zeichen. Nicht nebenbei geschlossen — ein Teil davon steht in der
Startschale, die gezeichnet sein muss, bevor das Register geladen ist.

---

## 10. Grössen der Felder und Leisten

Fenster 1440 × 960, beide Themen (`standard` und `hell`), 14./15. September.

| Feld | Grösse |
|---|---|
| Laserfeld, vor der Gestaltung der Zeilen | 380 × 139 px |
| Laserfeld, danach | 380 × 179 px |
| Elemente-/Haftnotizfeld | 380 × 267 px |
| Radiererfeld (fünf Modi) | 380 × 329 px |

| Ansicht | Fenster | Fensterüberlauf |
|---|---|---|
| Studio, Rechner | 1440 × 960 | nein |
| Studio, Telefon | 390 × 844 | nein |
| Studio, Rechner hell | 1440 × 960 | nein |

---

## 11. Bau und Dienststand

| Was | Wert |
|---|---|
| Dienststand im WIP-Stand (E572) | v1065 |
| nach E573 | v1071 |
| nach E574 | v1072 |
| nach E575 | v1075 |
| nach E576 | v1077 |
| nach E577 | v1082 |
| `redion-einzeldatei.html` vor E576 | 10 083 KB |
| `redion-einzeldatei.html` nach E577 | 10 092 KB |

*Die Dienststände sind nicht geschätzt, sondern aus den Commits gelesen:
`git show <commit>:src/dienst/sw.ts | grep VERSION`. Beim ersten Schreiben
dieser Datei stand hier „zu Beginn v1071" — das war der Stand NACH E573, und
das Nachlesen hat es gefunden.*

### 11.1 Die Zahl der Prüfläufe — schon wieder nachgezogen

```txt
$ ls pruefungen/lauf/test*.mts | wc -l
466
```

**`CLAUDE.md` §30 sagt 438.** Der Abschnitt schreibt selbst vor, wie mit
dieser Zahl umzugehen ist — „Sie wird nicht geschätzt, sie wird gezählt" —
und hält fest, dass sie schon einmal hundertfünfzehn Läufe lang nicht
nachgezogen wurde. Jetzt sind es achtundzwanzig. Die Zahl ist in `CLAUDE.md`
nachgezogen; hier steht die Messung mit dem Befehl, der sie ergibt.

---

## 12. Prüflaufzahlen dieser Bögen

`test524` ist in diesen Bögen von 6 auf 50 Zusicherungen gewachsen. Die
Zwischenstände sind hier festgehalten, weil jeder Sprung ein Fund ist:

| Stand | Zusicherungen | rot davon vorher gesehen |
|---|---|---|
| Übergabe (E572) | 6 | 5 |
| nach §2 (Dock je Werkzeug) | 16 | 1 |
| nach §3 (Notizfarben) | 24 | 3 |
| nach §4 (Werkzeugfelder) | 32 | 1 |
| nach §5 (`inkSync`) | 36 | 4 |
| nach §6 (Radierer) | 42 | 4 |
| nach §7 (Dock-Bewegung) | 47 | 1 |
| nach §8 (Verlaufskapsel) | **50** | 1 |

Die übrigen Läufe am Ende dieser Bögen:

| Lauf | Ergebnis |
|---|---|
| `test267` | 16 / 16 |
| `test348` | 26 / 26 |
| `test393` | 19 / 19 |
| `test437` | 34 / 34 |
| `test461` | 35 / 35 |
| `test464` | 63 / 63 (vorher 61 / 62) |
| `test480` | 50 / 50 |
| `test523` | 40 grün |
| `test524` | 50 / 50 |

**Die Gesamtsuite ist nicht als grün gemessen.** Gefahren und grün sind rund
dreissig Läufe; `test290` (CSS-Namensräume) ist rot und älter als diese Bögen.

---

# Teil II — Ältere Messungen, die im Bestand stehen

Diese Zahlen stammen nicht aus dieser Sitzung. Sie stehen hier, weil sie in
Entscheidungen und Kommentaren als Begründung dienen und sonst über das ganze
Verzeichnis verstreut wären. **Herkunft ist jeweils genannt** — wer eine
davon heute braucht, misst sie nach.

| Was | Zahl | Herkunft |
|---|---|---|
| Leiste bei 390 px vor E356 | 1539 px lang — vier Bildschirmbreiten | E356 |
| Leiste in der Spalte bei 1360 px Fenster | 706 px breit, 22 Knöpfe in FÜNF Zeilen, 220 px hoch | L115 Punkt 9 |
| Kugelschreiber gegen Bleistift | 73 % geteilte Tinte | E515 |
| Füller gegen Bleistift | 69 % | E515 |
| klar unterscheidbare Stiftpaare | 24 – 38 % | E515 |
| OCR über achtzig Seiten | flache 8 ms je Schritt, davon 15 % Worker-fähig | L103 Punkt 2 |
| `--line` auf der weissen Leistenkarte | rgb(233, 233, 231) — fast unsichtbar | E570 |
| abgeschnittene Zahl in der Tabelle | `634.2166666667` stand als `34.2166666667` da | §55.1 |
| `scrollWidth` gegen `clientWidth` in Flexbox | 109 gegen 109 — misst gar nichts | §55.2 |
| fünf von acht Studio-Flächen unter allen Schemata | bytegleich | E554 |

---

## Wie man diese Messungen wiederholt

Die Skripte dieser Sitzung liefen aus einem Arbeitsverzeichnis ausserhalb des
Projekts und sind **nicht mitversioniert** — wie die Bilder (§55.4). Was
bleibt, ist die Methode; sie steht in jedem Abschnitt oben, und die drei
wichtigsten sind im Verzeichnis als echte Prüfläufe verewigt:

```txt
node pruefungen/alle.mts 524      Dock je Werkzeug, Farben, Felder,
                                  inkSync, Radierer, Bewegung, Kapsel
node pruefungen/alle.mts 480      Ähnlichkeit der Zeichen (§7 und §7b)
node pruefungen/alle.mts 348 351  die Gruppenliste aus E356
node bilder.mts                   Bilder, wenn es etwas zu SEHEN gibt
```

Ein Wert, der hier steht und beim Nachmessen anders herauskommt, ist kein
Streit — er ist ein Fund. Dann kommt die neue Zahl dazu, mit Datum, und die
alte bleibt stehen.

---

# Teil III — Die Messungen vom 15. September 2026, zweiter Tag

## 13. Die CSS-Namensräume — wie weit das Verzeichnis abgewandert war

**Frage:** `test290` war rot. Woran?

**Methode:** `doku/CSS-NAMENSRAEUME.md` gegen `quell/schale/stil/*.css`,
mit demselben Regex, mit dem das Verzeichnis entstanden ist
(`\.([a-z]{2,4})-[a-z0-9-]+`, ab vier Vorkommen ein eigener Namensraum).

| Was | gemessen |
|---|---|
| Präfixe im Stil | **157** |
| Zeilen im Verzeichnis | 156 |
| fehlt im Verzeichnis | **1** — `fv` (der Folienvorlagen-Wähler, E548) |
| Karteileichen | 0 |
| **falsche Zahl in der Spalte** | **45 von 157** |
| falsche Hauptdatei | 1 — `els` |

Die schlimmsten Zahlen: `rmo` stand auf 40 und ist **561**, `ai` auf 130 und
ist **97**, `stat` auf 16 und ist **45**. Von den sieben nachgesehenen
stimmte nur `bs` (64).

### 13.1 Der `els`-Fund war echt, und mein erster Verdacht war falsch

Zuerst sah es nach einem Messfehler des Wächters aus: `els` hat in
`bausteine.css` **14 verschiedene** Klassen, in `motion.css` nur **zwei** —
die aber in 53 Regeln. Ein Maß, das Regeln zählt, macht die Datei, die zwei
Klassen oft anfasst, zur Eigentümerin.

Zwei Maße nebeneinander über alle 157 Präfixe:

| | Antwort nach Vorkommen | Antwort nach verschiedenen Klassen |
|---|---|---|
| gleich bei | 151 Präfixen | |
| verschieden bei | **6** | `els`, `ist`, `ka`, `leer`, `side`, `stat` |

**Die Geschichte hat entschieden, nicht das Maß:** der Verzeichniseintrag
stammt aus **E323**, die `motion.css`-Regeln kamen mit **E537** dazu —
`git merge-base --is-ancestor` bestätigt die Reihenfolge. Der Schwerpunkt
ist also wirklich gewandert, und `§4` hat genau das gemeldet, wofür es ihn
gibt. Das Verzeichnis sagt jetzt `motion.css`; ein neuer Abschnitt darin
sagt, wo das Aussehen trotzdem liegt.

**Vier Präfixe haben `motion.css` als Hauptdatei**, weil Bewegung seit
E43/E259 ausschliesslich dort wohnt: `ai`, `els`, `rmo`, `stat`.

---

## 14. Lesen heisst lesen — zwei Türen, beide offen

**Frage:** Schützt der Lesemodus die Arbeitskopie wirklich?

**Methode:** Dokumentstudio, Fenster 1440 × 960, ein Heft mit einem leeren
Blatt. Nach jedem Schritt `data-tool` und `pointer-events` der Zeichenschicht
lesen und `Store.getBlock(blatt).marken.length` zählen. Danach ein echter Zug
mit synthetischen Zeigerereignissen.

### 14.1 Tür 1 — die Tastatur

| Schritt | Werkzeug | `pointer-events` | Marken |
|---|---|---|---|
| frisch geöffnet | `stift` | `auto` | 0 |
| „Lesen" gewählt | `schreiben` | `none` | 0 ✓ |
| **Taste „P"** | `stift` | `auto` | — |
| ein Zug danach | | | **0 → 1** ✗ |

### 14.2 Tür 2 — die Maus, und sie war die grössere

Gemessen NACH der ersten Reparatur, weil nachgemessen statt geglaubt wurde:

| Im Lesemodus | gemessen |
|---|---|
| `[data-document-tool="marker"]` sichtbar | **ja** |
| … `disabled` | **nein** |
| … `aria-pressed` | `false` |
| nach einem gewöhnlichen **Mausklick** | `marker`, `pointer-events:auto` |
| ein Zug danach | **0 → 1** |

### 14.3 Nachher (E578)

| Schritt | Ergebnis |
|---|---|
| Taste „P" im Lesemodus | Schicht bleibt `schreiben`/`none` |
| ein Zug danach | Fläche unerreichbar, Marken unverändert |
| oberer Werkzeugknopf | `disabled` |
| Mausklick darauf | ändert nichts, keine Marke |
| **Gegenprobe:** „H" im Schreibmodus | holt den Marker — die Abkürzung lebt |

### 14.4 Und ein Nebenfund an der eigenen Reparatur

Die erste Fassung der Regel („eine Abkürzung drückt nur, was greifbar ist")
schaltete im Studio **alle** Werkzeugtasten ab. Gemessen:
`[data-wz="marker"]` im unteren Dock hat dort `display:none` und
`getClientRects().length === 0` — die Werkzeuge stehen im Studio mit Absicht
oben (E573). Die Abkürzung greift seither nach oben, wenn der untere Knopf
nicht greifbar ist.

---

## 15. Die Verlaufskapsel im Foliensatz — 66 Pixel, die niemand bestellt hat

**Frage:** `test508 §2` meldete 580 px statt über 600. Woher?

**Methode:** Foliensatz öffnen, Reiter „Ansicht", die Rechtecke von
`.document-body`, `.document-ink-history` und `.document-center` lesen.
Fenster 1440 × 852, 15. September 2026.

| Element | vorher oben | vorher hoch | nachher oben | nachher hoch |
|---|---|---|---|---|
| `.document-body` | 206 | 646 | 206 | 646 |
| Kapsel | 218 | 54 | 218 | 54 |
| `.document-center` | **272** | **580** | **206** | **646** |

272 = 218 + 54. Die Kapsel hatte im Foliensatz eine eigene Rasterzeile und
schob die Fläche um ihre Höhe nach unten; im Studio überlagerte dieselbe
Regel. `position:absolute` nimmt in jedem Raster keinen Platz (E579).

### 15.1 Welcher Bogen es war — und dass mein erster Schluss falsch war

Ich hielt den roten Lauf für einen Altbestand. Ein Arbeitsbaum auf den
einzelnen Commits hat es entschieden:

```txt
d4a53c8e (E571)   Suite 508: 40 grün
5d415d61 (E572)   Suite 508: 40 grün
4ac55759 (E573)   Suite 508: 39 grün, 1 rot   ← hier
5aa8876f (E574)   Suite 508: 39 grün, 1 rot
```

**„Älter als mein Zweig" ist eine Vermutung, solange niemand die Commits
durchgeht** — und sie ist die bequeme Antwort, was sie verdächtig macht.

---

## 16. Wie viel am Telefon ausserhalb des Bildes steht

**Methode:** `scrollWidth` gegen `clientWidth` der beiden Leisten, je Fenster.
15. September 2026.

| Fenster | obere Leiste | versteckt | unteres Dock | versteckt |
|---|---|---|---|---|
| 390 × 844 | 780 / 390 | **390 px** | 918 / 356 | **562 px** |
| 820 × 1180 | 834 / 820 | 14 px | 939 / 786 | 153 px |
| 1440 × 960 | 1440 / 1440 | 0 | 939 / 939 | 0 |

Am Telefon steht mehr ausserhalb des Bildes als darin: acht von sechzehn
Werkzeugen oben, im Dock zwei Drittel.

## 17. Wie stark ein Rollschatten wirklich ist

**Methode:** Bildschirmfoto der Leiste, Helligkeit (0–255) eines Pixels am
rechten Rand, in der Mitte und am linken Rand, bei 390 px Fensterbreite.

| Thema | Schatten `rgba(0,0,0,.30)` | Schatten aus `--text` |
|---|---|---|
| dunkel | Rand 24, Mitte 32 → **8** | Rand 96, Mitte 32 → **64** |
| hell | Rand 181, Mitte 247 → 66 | Rand 189, Mitte 247 → 58 |
| links (beide, am Anfang der Rolle) | kein Unterschied | kein Unterschied |

**Acht von 255 ist nichts.** Ein schwarzer Schatten auf einer dunklen Leiste
ist keiner — im Stilblatt sieht er richtig aus, auf dem Bild nicht (§55.1).
Die Grenze im Wächter ist 25: sie liegt in der Mitte zwischen dem kaputten
Wert (8) und den reparierten (58 und 64).

---

## 18. Was im Druck auf dem Papier steht, das kein Strich ist

**Frage:** Bleibt das sichtbare Lineal von jeder Ausgabe ausgeschlossen?

**Methode:** Lineal einschalten, dann `page.emulateMedia({media:'print'})`
und alle `[data-ink-ui]` der Zeichenfläche auf Sichtbarkeit prüfen. Fenster
1440 × 960, 15. September 2026.

| Weg | liest | Ergebnis |
|---|---|---|
| „Als Bild sichern" | baut aus `marken` neu | kann nichts leaken |
| „Als PDF" | baut aus `marken` neu | kann nichts leaken |
| **Druck** | das lebende DOM | **Lineal sichtbar** |

| | vorhanden | sichtbar (vorher) | sichtbar (nachher) |
|---|---|---|---|
| am Bildschirm | 1 | 1 | 1 |
| im Druck | 1 | **1** | **0** |

Kein Stilblatt nannte `[data-ink-ui]` im Druck — dieselbe Lücke galt damit
für die Laserspur und die Auswahlgriffe. Eine Zeile deckt alle drei ab,
weil sie dem ATTRIBUT gilt und nicht einer Liste von Klassen (E581).

---

## 19. Zwei rote Wächter, und kein Fehler dahinter

**Methode:** Arbeitsbaum (`git worktree`) auf den einzelnen Commits, je Lauf
einmal gefahren — die Lehre aus Abschnitt 15.

| Lauf | E571 | E572 | E573 | heute | Ursache |
|---|---|---|---|---|---|
| `test429` | rot | rot | rot | rot → **17/17** | mass `getComputedStyle().transform` an einem SVG-Präsentationsattribut |
| `test476` | rot | rot | rot | rot → **26/26** | zielte mit der Maus auf eine noch laufende Animation |
| `test508` | **grün** | **grün** | rot | 40/40 | echter Rückschritt aus E573 (Abschnitt 15) |

### 19.1 `test429` — das Unmessbare

```txt
Attribut   transform="rotate(36 12 12)"     ← da, wie gebaut
CSS        getComputedStyle(...).transform  → "none"
```

Erster Reparaturversuch: die Segmente dort messen, wo sie stehen — ergab
**20 Rechtecke mit Ausdehnung 0**, weil die Ladezeichen der Probe an dieser
Stelle verborgen sind. Gemessen wird jetzt an einer sichtbaren Kopie.

### 19.2 `test476` — das bewegte Ziel

| | gemessen |
|---|---|
| Rechteck vor dem Zielen | oben 453,8 |
| nach dem Zeigen (kaputt) | oben 453,8, `translate: none` |
| `elementFromPoint` am Zielpunkt | traf das Blatt |
| `:hover` am Blatt | **false** |
| Zielpunkt im zweiten Lauf | **226 px daneben** |
| nach dem Warten auf Ruhe | oben **440,3**, `translate: 0px -10px` |

Der Verzug der fünf Blätter: 0,152 s · 0,114 s · 0,076 s · 0,038 s · 0 s,
dazu ein Übergang mit Überschwingen. Wer währenddessen misst, misst die
Animation.

---

## 20. Das Form-Dock — was schon dastand

**Wann:** 15. September 2026 · **Womit:** eigenes Messskript, Studio geöffnet,
Formwerkzeug über die obere Leiste gewählt · **Warum:** Plan 7 B 5 verlangte
„alle sieben vorhandenen Formen direkt; Farbe/Dicke dazu".

Sichtbare Kinder der unteren Leiste, nach Gruppe, bei `data-tool="line"`:

| Gruppe | sichtbar / gesamt | 1440 px | 390 px |
|---|---|---|---|
| `form` | 7 / 8 | ja | ja |
| `farbe` | 6 / 7 | ja | ja |
| `breite` | 3 / 5 | ja | ja |
| `lineal` | 1 / 2 | ja | ja |
| `stil`, `laser`, `radierer`, `schrift`, `auswahl`, `notizfarbe` | 0 | — | — |

Die jeweils fehlenden sind der Trenner der Gruppe und — bei `breite` — die
Klappe für die freie Stärke, die sich nach E465 erst auf den zweiten Tipp
öffnet. **Der Punkt war zu, bevor der Bogen begann.**

Knopfmasse der sieben Formen:

```txt
1440 px   61 · 59 · 88 · 72 · 78 · 65 · 68 px breit, alle 44 px hoch (mit Wort)
 390 px   44 × 44 px, alle sieben, ohne Wort
Dockbreite   1440 px: 1079 px · 390 px: 358 px sichtbar von 868 px Inhalt
```

---

## 21. Die Kopie in der oberen Leiste folgte der Form nicht

**Wann:** 15. September 2026 · **Womit:** dasselbe Skript, Form im Dock
gewechselt, oberen Knopf gelesen.

| im Dock gewählt | `data-tool` unten | oben `data-sym` | oben `data-form` | oben Titel |
|---|---|---|---|---|
| Dreieck | `triangle` | `inkShapes` | — | „Form" |
| Kurve | `curve` | `inkShapes` | — | „Form" |
| Ellipse | `ellipse` | `inkShapes` | — | „Form" |

**Nachher** (E583), derselbe Weg:

| gewählt | oben `data-sym` | oben `data-form` | oben Titel |
|---|---|---|---|
| Dreieck | `formTriangle` | `triangle` | „Dreieck — die Form wählst du darunter" |
| Kurve | `formCurve` | `curve` | „Kurve — nach dem Ziehen biegt der Griff …" |
| Ellipse | `formEllipse` | `ellipse` | „Ellipse — die Form wählst du darunter" |
| Rund | `formRoundrect` | `roundrect` | „Rechteck mit runden Ecken — …" |
| Pfeil | `formArrow` | `arrow` | „Pfeil — die Form wählst du darunter" |
| Linie | `formLine` | `line` | „Gerade Linie — die Form wählst du darunter" |

**Was es an Bewegung kostet** (Beobachter auf dem oberen Knopf, `childList`,
`subtree`, `attributes`):

```txt
echter Formwechsel          7 Änderungen
dieselbe Form nochmal       2 Änderungen   ← und die zwei sind das
                                             `aria-pressed`, das die Reihe
                                             ohnehin für alle dreizehn setzt
```

Ohne die Abweichungsprüfung wären es sechs frische `<svg>` je Klick gewesen
— `inkSync()` läuft bis zu sechsmal (gemessen in E575).

---

## 22. Sieben Formzeichen gegeneinander

**Wann:** 15. September 2026 · **Womit:** die Methode aus `test480 §7` —
jedes Zeichen als SVG auf 16 × 16 gerastert, Deckung durch Vereinigung ·
**Warum:** „Rechteck" und „Rund" sahen im Bild des Docks gleich aus.

**Vorher:**

```txt
75 %  formRect/formRoundrect
72 %  formEllipse/formRoundrect
70 %  formLine/formArrow
55 %  formRect/formEllipse
44 %  formTriangle/formCurve
```

Tinte je Zeichen (von 256 Rasterfeldern): formLine 33 · formArrow 47 ·
formRect 76 · formEllipse 60 · formTriangle 60 · formRoundrect 64 ·
formCurve 35.

**Die Kandidaten, gemessen statt geraten** (jeweils das schlimmste Paar der
ganzen Liste):

| Fassung | schlimmstes Paar |
|---|---|
| heute | 75 % |
| Pfeil: grösserer Kopf | 75 % (der Pfeil selbst 65 %) |
| Pfeil: Kopf als eigene Spitze | 75 % (der Pfeil selbst 69 %) |
| Pfeil: waagerecht mit offener Spitze | 75 % (der Pfeil selbst 28 %) |
| Rund: rx 5.4, gleiche Grösse | 75 % — jetzt gegen die Ellipse |
| Rund: rx 6.4, gleiche Grösse | 81 % gegen die Ellipse |
| Rund: Stadion rx 5.6 | 85 % gegen die Ellipse |
| Rund: etwas kleiner, rx 5.2 | 73 % gegen die Ellipse |
| Rund: offene Eckbögen | 39 % — verworfen, zeigt nicht die Form |
| **waagerechter Pfeil + kleiner und runder** | **55 %** ✓ |

**Nachher:** das ähnlichste Paar der Liste ist `formRect/formEllipse` mit
55 %, und das sind zwei Formen, die zu Recht verschieden aussehen.
`formRect/formRoundrect` 38 %, `formEllipse/formRoundrect` 29 %,
`formLine/formArrow` 28 %.

**Angesehen:** `bilder/formzeichen-vergleich.png` (beide Sätze bei 18 und
26 px), `bilder/dock-form.png`, `bilder/dock-form-handy.png`,
`bilder/oben-leiste-form.png`.

---

## 23. Wie gross ein Zeichen im Dock wirklich ist

**Wann:** 15. September 2026 · **Womit:** eigenes Messskript, Studio
geöffnet, `getComputedStyle` auf Hülle UND SVG · **Warum:** Plan 7 C 2
verlangt „24–28 px innerhalb fester 44-px-Trefferflächen".

**Erste Messung — nur das SVG angesehen:**

```txt
obere Leiste   25 px in 44 × 44 px   ✓ im Bereich
unteres Dock   18 px                 ✗ darunter
  1440 px   Knöpfe 32 / 44 / 69 / 77 / 79 × 44 px, Dock 941 px
   390 px   Knöpfe 44 × 44 px,                     Dock 358 px von 868 px
```

**Zweite Messung — Hülle gegen SVG, und da fiel es auf:**

| Zustand | Hülle laut CSS | SVG-Attribut | SVG laut CSS |
|---|---|---|---|
| 1440 unten | 16 px | 18 | 18 px |
| 1440 links/rechts | 20 px | 18 | 18 px |
| 390 unten | 18 px | 18 | 18 px |
| 390 links/rechts | 20 px | 18 | 18 px |

Drei von vier Zahlen im Stilblatt hatten keine Wirkung. Das Stilblatt
bemasste die Hülle, `Register.symbole.fuelle` schrieb `width="18"` als
Attribut in das SVG — und ein SVG mit eigener Breite kümmert sich nicht um
seinen Kasten.

**Was ein grösseres Zeichen kostet** (Dockbreite und Knopfbreiten):

| Zeichen | 390 px Rollbreite | 1440 px Dockbreite | 1440 px Knöpfe |
|---|---|---|---|
| 18 px | 918 px | 959 px | 34/44/71/79/81 |
| 22 px | 918 px | 995 px | 38/44/75/83/85 |
| 24 px | **918 px** | 1013 px | 40/44/77/85/87 |
| 26 px | 918 px | 1031 px | 42/44/79/87/89 |

Am Telefon kostet es **nichts** — der Knopf ist dort ohnehin 44 px breit.
Am Rechner kostet es 54 px, und bei 1280 px wäre das der Umbruch, den E576
weggerechnet hat. Deshalb 24 px nur am Telefon und an der Seite.

**Nachher:**

```txt
obere Leiste   25 px in 44 × 44   (unverändert)
 390 px unten  24 px in 44 × 44
 390 px seitl. 24 px in 48 × 44
1440 px unten  16 px in 32–79 × 44   (vorher 18, stand 2 px über der Hülle)
```

**Die vier Leistenlagen, nebenbei gemessen** (Knopf × Höhe / Zeichen,
vorher):

```txt
1440 unten   32/69/77/79 × 44 / 18      1440 links   48 × 44 / 18
1440 oben    32/69/77/79 × 44 / 18      1440 rechts  48 × 44 / 18
 390 unten   44 × 44 / 18                390 links   48 × 44 / 18
```

**Angesehen:** `bilder/dock-zeichen-18.png`, `-22`, `-24`, `-26` (Telefon),
`bilder/dock1440-zeichen-*.png` (Rechner), `bilder/dock-form-handy.png`
zweifach.

---

## 24. Wo im Studio ein Schriftzeichen statt eines Bildes stand

**Wann:** 15. September 2026 · **Womit:** eigenes Messskript, alle
sichtbaren `button` des Studios mit einem Zeichen statt eines Wortes ·
**Warum:** Plan 7 B 7 („die alten Toolbar-Styles") und 7 C 1 („keine zweite
lose Icon-Sammlung").

```txt
„↶"  ink-undo   28 px Schrift, kein SVG
„↷"  ink-redo   28 px Schrift, kein SVG
„🔍" find       12 px Schrift, kein SVG
„☷"  view       12 px Schrift, kein SVG
„+"  zweimal    13/14 px — bleibt Text
„⋮⋮" Griff      14 px — bleibt Text
                                        Knöpfe mit Text UND SVG: 0
```

**Die Verlaufskapsel, vorher und nachher:**

| | vorher | nachher |
|---|---|---|
| Kapsel | 100 × 54 px (1440), 98 × 52 (390) | unverändert |
| Knopf | 44 × 44 px | 44 × 44 px |
| Inhalt | Text „↶", Schrift 28 px | SVG `undo`, 25 px |
| Farbe abgeschaltet | `rgb(115,115,115)` | `rgb(115,115,115)`, Strich gleich |
| Deckung abgeschaltet | 1 | 1 |

Die Farbe und die Deckung sind die zwei Zahlen, die E396 verlangt — blass,
nicht durchscheinend. Ein SVG mit `stroke="currentColor"` hält beides von
selbst; gemessen steht `stroke` danach auf demselben Wert wie `color`.

**Angesehen:** `bilder/kapsel-1440.png`, `bilder/kapsel-390.png`,
`bilder/topbar-1440.png`.

---

## 25. Das Stift-Dock bei vier Breiten

**Wann:** 15. September 2026 · **Womit:** eigenes Messskript, Studio
geöffnet, Stiftwerkzeug geführt · **Warum:** Plan 7 B 2, zweiter Satz —
„Werkzeuge/Extras nicht still entfernen, wenn der Bildschirm zu schmal ist".

| Fenster | Dock | Rollinhalt | im Sichtfenster | Kinder sichtbar | Zeilen |
|---|---|---|---|---|---|
| 1440 × 960 | 941 × 62 | 939 px | 18 von 18 | 18 | 1 |
| 1024 × 768 | 941 × 62 | 939 px | 18 von 18 | 18 | 1 |
| 768 × 1024 | 736 × 62 | 939 px | 15 von 18 | 18 | 1 |
| 390 × 844 | 358 × 62 | 918 px | 7 von 18 | 18 | 1 |

Stiftknöpfe: sechs, überall sichtbar, 32 px breit am Rechner und 44 px am
Telefon. Farben 6, Strichstufen 3, Farbmenü und Lineal bei jeder Breite da.
**Nichts wird weggelassen — es rollt.**

---

## 26. Sechs Stifte: zwei Masse, zwei Antworten

**Wann:** 15. September 2026 · **Warum:** Plan 7 C 2 — „Füller,
Kugelschreiber, Pinsel und Bleistift müssen sofort unterscheidbar sein".

**Mass eins — Tintendeckung** (die Methode aus `test480 §7`, alle 15 Paare):

```txt
46 %  penFountain/penEarth      34 %  penBrush/penWire
40 %  penBrush/penPencil        33 %  penBall/penWire
38 %  penFountain/penBall       27 %  penFountain/penBrush
38 %  penEarth/penWire          25 %  penBrush/penEarth
36 %  penBall/penBrush          24 %  penBall/penPencil
36 %  penPencil/penWire         22 %  penFountain/penPencil
35 %  penBall/penEarth          21 %  penPencil/penEarth
34 %  penFountain/penWire
```

Kein Paar über 60 %. Nach diesem Mass ist alles in Ordnung.

**Mass zwei — Hauptachse und Länglichkeit** (Kovarianz der Tinte auf 16 × 16,
mit der Deckung gewichtet):

```txt
penFountain    90°   26 %        penPencil      45°   78 %
penBall        86°   52 %        penEarth       90°   30 %
penBrush       52°   69 %        penWire        10°   38 %
```

Ein Paar zählt, wenn beide ab 45 % länglich sind und weniger als 20°
auseinander liegen: **penBrush/penPencil Δ7°** — und sonst nichts.

**Gegenprobe auf die sieben Formen** (dasselbe Mass, derselbe Lauf):

```txt
formLine 45°/90 %   formArrow 0°/47 %   formRect 0°/21 %
formEllipse 180°/18 %   formTriangle 90°/4 %
formRoundrect 179°/17 %   formCurve 6°/29 %
                                    → kein Paar
```

Obwohl dort mit `formLine` das längste Zeichen des Projekts steht.

**Die Kandidaten für den Pinsel, beide Masse zugleich:**

| Fassung | schlimmste Deckung | Richtungspaare | Pinsel |
|---|---|---|---|
| heute | 46 % | `penBrush/penPencil` Δ7° | 52°/69 % |
| senkrecht | **55 %** | `penBall/penBrush` Δ4° | 90°/61 % |
| steiler 58° | 46 % | `penBrush/penPencil` Δ13° | 58°/78 % |
| waagerecht mit Zug | 46 % | kein Paar | 67°/27 % |
| **gespiegelt** | **46 %** | **kein Paar** | **128°/69 %** |

**Angesehen:** `bilder/stifte-lupe.png` — alle sechs bei 16, 24 und 48 px,
heute und in beiden ernsthaften Fassungen.

---

## 27. Was die Bildschirmtastatur im Studio verdeckt

**Wann:** 15. September 2026 · **Womit:** eigenes Messskript bei 390 × 844;
simuliert wird genau das Signal, das die App selbst benutzt —
`--visual-bottom`, `--visual-height`, `--vh` und `body.tastatur-offen` aus
`kern/einstellung/app.ts` · **Warum:** Plan 7 B 8.

Tastatur 336 px (iPhone hochkant), sichtbar also bis 508:

| | oben–unten | verdeckt ohne | verdeckt mit |
|---|---|---|---|
| Dock (`.blatt-reihe`) | 768–830 | 0 px | **322 px** |
| Zurück/Vor | 708–760 | 0 px | **252 px** |
| obere Werkzeugleiste | 102–155 | 0 px | 0 px |
| Suchzeile | 102–159 | 0 px | 0 px |

Beide unteren Schwebenden lagen **ganz** dahinter.

**Nachher** (E588), dieselbe Messung:

```txt
Dock     432–494   verdeckt 0      (war 768–830)
Kapsel   372–424   verdeckt 0      (war 708–760)
ohne Tastatur wieder 768–830 — auf den Pixel wie vorher
```

Dem Papier bleiben zwischen oberer Leiste (bis 155) und Dock (ab 432)
**277 px**.

**Angesehen:** `bilder/studio-tastatur.png`.

---

## 28. Zwei Kataloge für Zeichen

**Wann:** 15. September 2026 · **Womit:** Auszählung über `index.html` und
`src/register/symbole.ts` · **Warum:** §8.

```txt
<svg> in index.html                  19
Pfade darin (d="…")                  35, davon 30 verschieden
davon wörtlich auch in symbole.ts    22
Zeichenbefehle gesamt                48   (path/rect/circle/ellipse/…)
Stellen mit data-sym                 37
Registereinträge                    127
```

Wo die neunzehn standen: fünf in der Reiterleiste unten, zwei in der
Textleiste am Telefon, zwei im Kopf des KI-Felds, sieben in der
Werkzeugzeile des KI-Felds, drei in der Eingabezeile.

**Wie viele auf einen Registereintrag passten:** 15 von 19 wörtlich.
Die vier übrigen waren zweite Zeichnungen für dieselbe Sache:

| Reiter | öffnet | Seitenleiste | Reiter |
|---|---|---|---|
| Dokumente | `Bibliothek.oeffne()` | `library` | zwei Felder |
| Heute | `lernen('heute')` | `home` | Haus ohne Tür |
| Mehr | Mehr-Blatt | `dots` | gefüllte Punkte |
| Termine | — | (keine) | Kalender mit Tagen |

`calendar` im Register hat **31** Verwender, `dots` 12, `library` 12,
`learn` 8, `home` 1.

**Nachher:**

```txt
<svg> in index.html                   0
Zeichenbefehle                        0
Stellen mit data-sym                 56   (in der laufenden App 85)
davon leer geblieben                  0
```

**Angesehen:** `bilder/nav-vergleich.png` (alt gegen Register bei 19 und
40 px), `bilder/nav-nachher.png`, `bilder/ki-nachher.png`.

---

## 29. Drei rote Läufe, die keiner von diesem Bogen sind

**Wann:** 15. September 2026, beim Regressionslauf zu E589 · **Womit:** ein
`git worktree` auf `b7d194e7` (dem Stand VOR der Änderung).

| Lauf | vorher | nachher | also |
|---|---|---|---|
| `test34` | Zeitgrenze an `#ai-faehig` | dieselbe Zeitgrenze | nicht von hier |
| `test37` | `❌ Nach dem Ändern zeigen wieder alle dasselbe · ist="Redion,🦊"` | derselbe Satz | nicht von hier |
| `test362` | Decke 246/77/56/153/14/12, gezählt 266/83/63/168/15/14 | dieselben Zahlen | nicht von hier |

`test362` zählt rohe Pixelzahlen in den Stilblättern gegen ein Verzeichnis
(`pruefungen/marken-decke.json`), das zuletzt bei **E509/E510** nachgetragen
wurde. Seither sind zwanzig rohe `16px` dazugekommen, ohne dass jemand die
Zahl nachgezogen hat — dieselbe Bauform wie `js-bestand.json`, und dieselbe
Nachlässigkeit wie bei der Prüflaufzahl in `CLAUDE.md` (§30).

---

## 30. Was hinter den drei roten Läufen stand

**Wann:** 15. September 2026 · **Warum:** §46 „rot zuerst".

### `test37` — der Arbeitsbereichsknopf

```txt
#btn-settings enthielt:
  <span class="rmo-sliders">      ← von motion.ts, erstes Kind
  <span class="ws-icon">Redion    ← hier sollte „N" stehen
  <span>Redion
```

Gemessen über drei Zeitpunkte:

| | Spans im Knopf | `.ws-icon`-Texte |
|---|---|---|
| vorher | `rmo-sliders`, `ws-icon`=„Redion", ``=„Redion" | `Redion` |
| Einstellungen offen | dito | `Redion`, `N` |
| Zeichen auf 🦊 geändert | dito | `Redion`, `🦊` |

Das eingestellte Zeichen kam in der Seitenleiste nie an. Ursache:
`querySelectorAll('span')[1]` an zwei Stellen — ein Zugriff nach Platz.

### `test34` — die Oberfläche von gestern

```txt
#ai-faehig  liegt in  #ai-tools (Schublade „Werkzeuge & Kontext")
  Schublade zu      1 Rechteck, 104 × 33 px, y = 884 bei 900 px Fenster
  Schublade offen   nach scrollIntoView y = 679–712
  .ai-tools-body    overflow-y:auto, 529 px Inhalt in 324 px Fenster

.ai-leiste button  →  ai-plus · ai-modus · (ohne Kennung) · ai-diktat · ai-senden
                      also fünf, die Zusicherung sagte sechs
Platzhalter        →  „Frag etwas oder beschreibe deine Idee …"
                      die Zusicherung suchte „Mach alles mit KI"
```

### `test362` — das Verzeichnis der rohen Pixelzahlen

| | Verzeichnis (E509/E510) | gemessen | Δ | nach dem Tausch |
|---|---|---|---|---|
| 44px | 153 | 168 | +15 | **54** |
| 28px | 56 | 63 | +7 | 63 |
| 22px | 77 | 83 | +6 | 83 |
| 16px | 246 | 266 | +20 | 266 |
| 56px | 12 | 14 | +2 | 14 |
| 46px | 14 | 15 | +1 | 15 |

Gegengeprüft, dass die Drift nicht aus dieser Sitzung stammt: in
`bausteine.css` + `pdf-studio.css` sind die Zahlen bei `2d8ca7cf`
(Sitzungsanfang) und bei `HEAD` identisch — 44=91, 56=5, 46=8, 28=20,
22=38, 16=125.

**Der Tausch:** 114 Stellen in 11 Stildateien von `min-height:44px` /
`min-width:44px` auf `var(--touch-min)`. Wertgleich, weil `--touch-min` an
genau einer Stelle definiert ist (`marken.css:44`, 44px).

```txt
aufbau 5 · bausteine 69 · einstellungen 3 · ki 1 · lernwelt 6 · motion 8
notizhefte 7 · premium 2 · produktwelten 2 · tabelle 1 · werkzeuge 10
```

---

## 31. Wo das Lineal beim Zoom landet

**Wann:** 15. September 2026 · **Womit:** eigenes Messskript, Lineal an,
Zoomregler auf vier Werte · **Warum:** Abschnitt 8 des Übergabeplans.

„Sichtbarer Anteil" ist die Fläche des Lineals, die im Rollfenster
(`.document-center`) liegt.

**Vorher:**

| Zoom | 1440 × 960 | Griff | 390 × 844 | Griff |
|---|---|---|---|---|
| 60 % | 100 % | ja | 100 % | ja |
| 100 % | 100 % | ja | 100 % | ja |
| 140 % | **1 %** | **nein** | 83 % | **nein** |
| 180 % | **0 %** | **nein** | 63 % | **nein** |

Die Kästen dazu, 1440 × 960:

```txt
140 %   Lineal  [ 99, 958, 1233, 258]   Fenster [0, 154, 1440, 806]
180 %   Lineal  [107,1180, 1586, 332]   Blatt   [19, 183, 1762, 2493]
```

Das Lineal spannt 0,9 Blattbreiten; bei 180 % sind das 1586 px in einem
1440 px breiten Fenster. Es kann also gar nicht ganz hineinpassen — der
Griff muss es.

**Nachher** (E591):

```txt
140 %   100 % sichtbar, Griff [1121, 664, 92]  → drin
180 %    91 % sichtbar, Griff [1252, 690, 118] → drin
```

**Zwischenstand, der nicht genügte:** eine erste Fassung prüfte nur
senkrecht. Danach lag das Glas bei 180 % zu 84 % im Bild — und der Griff
bei x = 1422 immer noch daneben (Fenster 1440, Griff 118 breit).

---

## 32. Die Radierergrösse und die Tinte

**Wann:** 15. September 2026.

```txt
Radierer an       meta null · markiert 5  · Strichknopf 2,4
gross gewählt     meta 28   · markiert 28 · Strichknopf 2,4
zurück zum Stift  meta 28   · markiert 28 · Strichknopf 2,4
Seite 2           meta 28   · markiert 28 · Strichknopf 2,4
```

**Die Gegenprobe, und warum sie nötig war:** liess man `setEraserSize`
zusätzlich `setzeStrich(radius / 10)` rufen, blieb die Zusicherung über den
Strichknopf **grün** — die Markierung in der Leiste wird vom Klick auf die
Strichknöpfe gesetzt, nicht vom Zeichner. Erst ein wirklich gezogener Strich
zeigt es:

```txt
kaputter Stand   Strich vorher 0.5  → nachher 2.8   (rot)
echter Stand     Strich vorher 2.4  → nachher 2.4   (grün)
```

---

## 33. Die Rundreise einer .pptx

**Wann:** 15. September 2026 · **Womit:** eine fremde `.pptx`, mit Python
gebaut (unabhängig von Redions Schreiber), eingelesen und wieder ausgegeben ·
**Warum:** Bogen O5.

**Vorher:**

| | Original | Export |
|---|---|---|
| Einträge | 16 | 15 |
| Bytes | 6432 | 13807 |
| Folien | 2 | 3 |
| `docProps/core.xml` | da | weg |
| `docProps/app.xml` | da | weg |
| `ppt/media/image1.png` | da | weg |
| Text Folie 1 | „Erste Folie" | „probe" + „[Datei: probe.pptx]" |
| Füllfarbe | `FFCC00` | keine |
| Bilder auf Folie 1 | 1 | 0 |
| Thema | „Redur-Thema" | überschrieben |

Dreizehn der sechzehn gleichnamigen Einträge waren inhaltlich anders; drei
fehlten ganz.

**Nachher** (E592), mit Pythons `zipfile` gegengeprüft — nicht mit Redions
Leser:

```txt
16 Einträge · testzip(): keine Schäden
fehlt: nichts · neu: nichts · inhaltlich anders: kein Eintrag
6432 Bytes hinein, 6432 Bytes heraus
Packmethoden in der Ausgabe: nur 8
Folie 1: Text ['Erste Folie'] · Bilder 1 · Farbe ['FFCC00']
Thema: ['Redur-Thema'] · core.xml: ['Redurs Probevortrag']
```

**Was noch nicht geht** (L168): ein in Redion geänderter Titel steht nicht in
der Datei — gemessen `['Erste Folie']` statt `['Geänderte Folie']`. Die
Ausgabe sagt es.

---

## 34. Die Rundreise mit einer echten Änderung

**Wann:** 15. September 2026 · **Womit:** dieselbe fremde `.pptx` wie in §33,
Titel der ersten Folie in Redion geändert, dann ausgegeben und mit Pythons
`zipfile` gelesen · **Warum:** Bogen O5b.

```txt
16 Einträge · testzip(): keine Schäden · fehlt nichts · neu nichts
inhaltlich anders: GENAU EIN Eintrag — ppt/slides/slide1.xml

Folie 1 vorher : ['Erste Folie']       Bilder 1 · FFCC00 · Lage 838200/500000, 1000000/2200000
Folie 1 nachher: ['Ganz neuer Titel']  Bilder 1 · FFCC00 · Lage 838200/500000, 1000000/2200000
Folie 2        : Byte für Byte gleich
XML wohlgeformt · Vorspann <?xml …?> erhalten

Bytes   6432 → 7104      Packmethoden   [8] → [0, 8]
```

Die 672 Bytes mehr sind die eine Folie, die ungepackt hineingeht (L169).
Der Hinweis der Ausgabe lautete: „Die Originaldatei ist vollständig
erhalten; 1 Textstelle wurde übernommen. Formen ohne eindeutige Zuordnung
stehen unverändert darin."

---

## 35. Die fünf Messlatten, gezählt

**Wann:** 15. September 2026 · **Womit:** die Register der laufenden App
ausgelesen, dazu Zählungen im Verzeichnisbaum · **Warum:** Redurs fünf
Messlatten (E594) brauchen einen Stand, gegen den sie gelten.

**Aus den Registern, an der laufenden App:**

```txt
Blockarten        78      Ansichten             13      Eigenschaftstypen  35
Formelfunktionen 255      Vorlagen              11      Verbindungen        8
Bereiche          16      Zeichen im Register  129      Bandeinträge      173
Bandreiter         7      Werkzeuge (Zeichnen)  13      Stifte              6
Formen             7      Radierarten            5      Folienlayouts       8
```

`Register.befehle` trägt nur **9** Einträge — die Befehle der Bereiche stehen
im Slash-Menü und im Band, nicht dort. Die Zahl ist richtig und sagt wenig;
sie steht hier, damit sie beim nächsten Lesen nicht für „Redion hat neun
Befehle" gehalten wird.

**Aus dem Verzeichnisbaum:**

```txt
Prüfläufe                 467
TypeScript-Dateien        221
TypeScript-Zeilen     146 661
Entscheidungen (Index)    574
Lücken                    169, davon 31 geschlossen
js-bestand.json             0 Einträge — keine handgeschriebene .js mehr
```

**Eine Unstimmigkeit, die dabei auffiel und nicht verschwiegen wird:**
`ENTSCHEIDUNGEN.md` hat **574** Einträge im Verzeichnis, aber nur **223**
Abschnitte im Text. Der Unterschied sind Entscheidungen, die als Zeile im
Verzeichnis stehen und ihren Fliesstext in einem gemeinsamen Abschnitt haben
— das ist so gewachsen und kein Fehler, aber wer die Zahl 574 liest, sollte
nicht 574 Kapitel erwarten.

---

## 36. Die Rundreise einer .docx

**15. September 2026 · Bogen O7 / E595**

Gemessen an einer von Hand gebauten Probedatei: Überschrift mit Stil
`Heading1`, ein roter fetter Absatz (`w:color val="CC0000"`), ein Absatz aus
drei Läufen mit kursivem Mittelstück, eine Tabelle mit zwei Zellen, ein PNG,
`docProps/core.xml`. Methode: die Datei durch `Einlesen.datei` und
`Austausch.alsWord` schicken, dann mit **Pythons `zipfile`** nachsehen —
nicht mit Redions eigenem Leser, der ja Partei ist.

**Vorher — der frische Schreiber:**

```txt
Einträge           7  →  6
Bytes           2284  →  5718
verloren        docProps/core.xml · word/media/image1.png · Farbe CC0000
dazugekommen    „Redurs Bericht.docx" als gewöhnlicher Absatz im Text
überlebt        fett · kursiv · die Tabelle (alle drei über Markdown)
```

**Nachher — durchgereicht mit einem geänderten Absatz:**

```txt
Python öffnet       7 Einträge · testzip: keine Schäden
Bytes            2284  →  2650
fehlt               nichts
neu                 nichts
inhaltlich anders   ['word/document.xml']
Text nachher        ['Ein ganz neuer Satz.', 'Ein farbiger, fetter Absatz.',
                     'Ein zweiter Absatz mit ', 'kursivem', ' Teil.',
                     'A1', 'B1']
Farbe               ['CC0000']   Tabellen 1   Kursiv 1   Stil ['Heading1']
document.xml        wohlgeformt
Packmethoden        [0, 8]
```

Die 366 Bytes Zuwachs sind `word/document.xml`: es geht ungepackt (Methode 0)
wieder hinein, während die sechs durchgereichten Einträge ihre Methode 8
behalten. Dieselbe Sache wie **L169** bei den Folien, dieselbe Grössenordnung.

**Der Wächter vorher und nachher:**

```txt
test526 gegen den Stand vor E595    14 von 19 rot
test526 gegen den Stand nach E595   19 von 19 grün
```

---

## 37. Wie lange ein roter Lauf unbemerkt bleiben kann

**15. September 2026 · E596**

`test252` war rot. Nicht geraten, wem er gehört, sondern durchgegangen — mit
einem Arbeitsbaum je Stand:

```txt
Stand        was dort steht                   test252
a26adfc7     der Stand vor Bogen O7           rot   14 von 15
d1f8e955     E538 „Originalschutz"            rot
d1f8e955~1   E537                             grün  15 von 15
```

```txt
rot geworden am          12. September 2026
unbemerkt geblieben      56 Commits, 3 Tage
Ursache                  E538 hängt die Originaldatei an Stelle 0;
                         der Lauf las `drin[0]` als Titel
```

**Gegenprobe der Reparatur** — die neue Zusicherung über den Anhang gegen
den Stand, der ihn noch nicht hatte:

```txt
d1f8e955~1   ✗ Das Original liegt als Anhang an Stelle 0   15 von 16
heute        ✓                                             16 von 16
```

---

## 38. Was ein Tipp mit dem Textwerkzeug auslöste

**15. September 2026 · E597**

Vorher, an der laufenden App, Fenster 1440 × 960, ein Tipp auf ein leeres
Blatt mit dem Textwerkzeug:

```txt
Überlagerungen           1
Dialogtext               „Text · Übernehmen mit Strg + Enter · Übernehmen · Abbrechen"
Textfelder auf der Seite 2   (beide im Dialog)
aktives Element          TEXTAREA
Marken auf dem Blatt     []
nach „Hallo Redion"      steht in der TEXTAREA des Dialogs, nicht auf dem Blatt
```

Nachher, derselbe Tipp:

```txt
Überlagerungen           0
Schreibfeld auf dem Blatt ja, mit Fokus, ohne Anklicken
Stelle                   120 / 160 Blatteinheiten getippt → 120,0 / 160,2 gemessen
Schriftgrösse im Feld    dieselbe, die die fertige Marke trägt
nach „Freier Text…"      steht in der Marke, an der Stelle des Tipps
```

**Der Wächter vorher und nachher:**

```txt
test527 gegen den Stand vor E597    16 von 20 rot (damalige Fassung)
test527 gegen den Stand nach E598   27 von 27 grün
```

Drei der vier grünen im ersten Lauf waren es aus dem falschen Grund: „Escape
schliesst das Feld", „das neue Feld ist leer" und „kein Schreibfeld über
einer gesperrten Marke" sind alle wahr, wenn es gar kein Feld gibt. Sie
zählen für den neuen Zustand, nicht als Beleg (§55.2).

---

## 39. Der Umbruch im Schreibfeld gegen den Umbruch auf dem Blatt

**15. September 2026 · E598 · gefunden auf einem Bild**

Derselbe Satz, „Ein Klick, und ich schreibe schon.", Schriftgrösse 16,
Kastenbreite 238 Blatteinheiten:

```txt
                     im Feld                       auf dem Blatt
Rechner 1280×900     fontPx 26,3 · Zeilen 2        fontPx 16 · Zeilen 2   ✓
Telefon  390×844     fontPx 16   · Zeilen 3        fontPx 16 · Zeilen 2   ✗
                     gesetzt waren 9,23 px
```

Der Grund: `bausteine.css:312` setzt unter 760 px
`input, textarea, select{ font-size:16px !important }`, damit iOS beim
Tippen nicht in die Seite hineinzoomt.

Nach der Reparatur (Feld in seiner Grösse, nie unter 16 px, als Ganzes
verkleinert):

```txt
Telefon  390×844     fontPx 16 · Zeilen 2          fontPx 16 · Zeilen 2   ✓
                     Zeilenhöhe 20 px · Innenbreite 226 px · scale 0,577
```

**Gegenproben** — `test527` §10, bei Schriftgrösse 34 statt der Vorgabe 16
(bei 16 fallen Rechnung und Stilregel zufällig zusammen):

```txt
ohne das inline-„important"   Feld 3 Zeilen · Blatt 4 · fontPx 16    ✗ ✗
ohne die 16-px-Untergrenze    fontPx 9,21                            ✗
mit beidem                    Feld und Blatt gleich · fontPx 19,6    ✓ ✓
```

**Und eine dritte Gegenprobe**, die den ersten Entwurf einer Zusicherung
widerlegt hat (§12 des Laufs, die Lebenswache aus E115):

```txt
Weg „auf eine andere Seite blättern"   ohne Wache GRÜN   — `blur` übernimmt
Weg „pagehide" (der Reiter geht zu)    ohne Wache ROT    — nur die Wache hält ihn
```

---

## 40. Der Feinschliff am freien Text

**15. September 2026 · E599**

**Die Leiste während des Schreibens** — dieselbe Folge, dreimal gefahren:
einen Kasten öffnen, „Wächst mit" tippen, „A+ Grösser" antippen.

```txt
                                  Feld danach      Marke danach
vor E599                          geschlossen      16 (unverändert)
mit der Fokus-Ausnahme allein     26,3 → 26,3 px   16 (unverändert)
mit beidem                        26,3 → 34,2 px   20
```

**Die Werkzeugleiste je Werkzeug**, nebenbei gemessen und als **L174**
eingetragen — sie gehört nicht zu diesem Bogen, aber eine Zahl, die man
gesehen hat, schreibt man auf:

```txt
Fenster      Werkzeug   sichtbare Knöpfe   davon ausserhalb   rollbar
1280 × 900   stift      18                 0                  nein
1280 × 900   text       12                 0                  nein
1280 × 900   select     24                 10                 ja
1440 × 960   select     24                  8                 ja
 390 × 844   select     24                 17                 ja
```

**Gegenproben zu E599** (test527, jedes Stück einzeln zurückgedreht):

```txt
ohne die Ausnahme für die Leiste       Feld schliesst beim ersten Knopf   3 rot
ohne `schreiberUmformen`               26,3 → 26,3 px · Marke 16          2 rot
ohne den Doppeltipp auf leeres Papier  kein Feld, kein Satz               2 rot
```

---

## 41. Der Ordnerdeckel, nachdem Redur ihn gesehen hat

**15. September 2026 · E601 · Kachel 200 × 267 px**

```txt
was                        vorher                       nachher
Blick-Knopf                left:4px top:4px, IMMER da   erst beim Darüberfahren,
                           Auge 26 × 15                 Auge 20 × 12, am Telefon gar nicht
Ordnerreiter               left:4%  top:8%  44% × 13%   left:7% top:20% 34% × 8%
Vorderdeckel               inset 34% 4% 8%  = 184 × 155 inset 52% 7% 16%
die fünf Blätter           inset 24% 14% 20%            inset 22% 16% 38%
davon sichtbar             10 % der Blatthöhe           30 %
„7 Unterseiten"            immer, halb auf dem Reiter   mit der Vorschau, unter dem Reiter
Vorschaustreifen           so breit wie die Karte       so breit wie der Name
```

Drei Dinge wollten dieselbe obere linke Ecke. Kein Prüflauf konnte das
sehen — sie prüfen, DASS der Knopf da ist und dass er wirkt, nicht, WORAUF
er liegt. Das Bild hat es gefunden (§55.1), und zwar Redurs Bild.

**Geprüft:** `test436`, `test476`, `test492`, `test493`, `test494` (153
Zusicherungen zur Bewegungsfamilie, darunter „folder"), `test87` — grün.

---

## 42. Ein Kasten mit drei Formaten, durch das Schreibfeld geschickt

**16. September 2026 · E606 · L172**

Probe: ein Textkasten mit drei Läufen, wie ihn der `.pptx`-Weg anlegt.
Geöffnet, ans Ende getippt, übernommen.

```txt
                        vorher                nachher (bis E605)   nachher (E606)
Läufe                   3                     keine                3
„GROSS" 30 pt fett      ja                    nein                 ja
„ rot" #CC0000          ja                    nein                 ja
Text                    Klein GROSS rot       + Getipptes          + Getipptes
Format des Kastens      16 pt, #111111        16 pt, #111111       unverändert
```

**Der Wächter vorher und nachher:**

```txt
test527 §16 gegen den Stand vor E606    4 von 7 rot
test527 §16 gegen den Stand nach E606   7 von 7 grün
test527 gesamt                          43 Zusicherungen
```

Die drei, die schon vorher grün waren, waren es aus dem falschen Grund: sie
prüfen die Läufe der Marke, und solange das Feld gar nicht aufging, blieben
sie unangetastet. Erst zusammen mit „der Kasten öffnet sich mit seinem
vollen Text" tragen sie etwas.

---

## 43. Die Gedankenkarte: gemessen statt geschätzt (E607)

**Was:** Der Aufbau der Gedankenkarte braucht die Breite jedes Knotens. Zwei
Wege standen zur Wahl — der Browser misst sie (HTML-Knoten), oder Redion
schätzt sie (SVG-Text). Die Schätzung wurde gebaut und gemessen, statt sie
für schlecht zu halten.

**Wie:** `test529` §3 setzt eine Karte mit „Mitte" als Wurzel und zwei
Zweigen. Die Linien zur Wurzel müssen an deren gemessener Kante beginnen.
Für die Gegenprobe wurde im Zeichner `offsetWidth` durch die naive Formel
`7 px je Zeichen + 26` ersetzt und neu gebaut.

```txt
                             gemessen (E607)     geschätzt (Gegenprobe)
rechte Kante der Wurzel      101 px              101 px   (das DOM lügt nicht)
Anfang der Linie             101 px              89 px
Abweichung waagerecht        0 px                12 px
Abweichung senkrecht         0 px                6 px
test529 §3                   3 von 3 grün        1 von 3 grün
```

Die eine Zusicherung, die auch mit der Schätzung grün blieb, ist „der lange
Zweig ist breiter als der kurze". Sie hält nichts — auch eine Schätzung macht
längeren Text breiter. Sie steht im Kopf von `test529` ausdrücklich als
solche, statt in der Zahl mitzulaufen (§55.2).

**Was der zweite Durchgang kostet:** einhängen, messen, rechnen, stellen.
Bei der Karte aus dem Bild (18 Knoten) unter einer Millisekunde.

---

## 44. Der erste Blick auf eine Gedankenkarte (E607)

**Was:** Beim Öffnen passt sich die Karte in ihren Kasten. Ohne Untergrenze
tut sie das IMMER — auch, wenn dabei niemand mehr etwas lesen kann.

```txt
                       Rechner 1440×960     iPhone 13 Pro Max 390×844
Karte (18 Knoten)      1050 × 430 px        1050 × 430 px
ganz eingepasst        69 %                 33 %
Schrift am Bildschirm  9,3 px               4,6 px
lesbar                 ja                   nein
```

**Die Grenze:** 10 px sind die Grenze, unter der man aufhört zu lesen und
anfängt zu raten. 10 / 13,5 ergibt 0,74; gesetzt sind **0,72**, weil die
Schrift am Telefon 14 px ist. Unterhalb davon wird nicht mehr eingepasst,
sondern die MITTE bei 72 % gezeigt; der Rest wird erschoben.

```txt
                       vorher (ohne Grenze)   nachher (E607)
Rechner                69 %, ganz             69 %, ganz      (unverändert)
Telefon                33 %, ganz             72 %, Mitte
Schrift am Telefon     4,6 px                 10,1 px
```

Der Knopf ⤢ kennt die Grenze nicht: wer wirklich alles sehen will, bekommt
alles.

---

## 45. Wie weit die Karte sprang, bevor sie festgehalten wurde (E607)

**Was:** Der Aufbau normiert sein Ergebnis auf eine linke obere Ecke bei
`RAND` — sonst hätte die Welt negative Koordinaten. Wächst die Karte nach
links, wandert deshalb in Weltkoordinaten alles nach rechts.

**Wie:** `test529` §11 misst die Bildschirmlage der Wurzel, legt links ein
breites Unterthema an und misst wieder.

```txt
                       ohne Ausgleich      mit Ausgleich (E607)
Wurzel vorher          x = 770,5           x = 770,5
Wurzel nachher         x = 1054,5          x = 770,5
Sprung                 284 px              0 px
```

284 Pixel sind kein Feinschliff. Wer ein Unterthema anlegt, schaut auf den
Knoten, an den es kommt — und der war danach woanders.

---

## 47. Die Ordnerkachel, hin und zurück an einem Tag (E608 → E609)

**Was:** Das Auge am Ordnerdeckel wurde entfernt (E608) und noch am selben
Tag vollständig zurückgeholt (E609). Was dabei zählbar ist:

```txt
                         vorher      ohne Auge (E608)   zurück (E609)
Knöpfe auf der Kachel    1           0                  1
CSS-Regeln dafür         13          0                  13
`bib` im Stilblatt       412         397                412
test436 §7               9 Zusich.   8 Zusich. (neu)    9 Zusich. (alt)
test476                  29          29 (umgehängt)     29 (alt)
Dateien im Bogen         —           16                 16 (dieselben)
```

**Der Beweis, dass „zurück" wirklich zurück heisst:**

```txt
git revert 70cf4503
git diff codex/frei-text-auswahl --stat    →  leer
```

Kein Unterschied zum Stand vor E608 — Zeichen für Zeichen, nicht „sieht gut
aus". Von Hand zurückgebaut wäre das nicht nachweisbar gewesen (E604, dieselbe
Lehre).

**Nach dem Zurücknehmen gemessen:**

```txt
test436   70 von 70 grün
test476   29 von 29 grün
test290   13 von 13 grün   (der Namensraum-Wächter — `bib` wieder bei 412)
```

**Was offen bleibt und nicht mit zurückging:** der Fund, dass der Stift den
Blick gar nicht öffnen kann. Er steht als L180 und ist zwei Zeilen gross.

--------------------------------------------------------------------------------

## §48 — Der Ablagename des Dienst-Arbeiters (E610, 16. September 2026)

**Die Nummer läuft nicht nur vorwärts.** Abgelesen aus `sw.js` über vier
Bögen, nicht erinnert:

```txt
git show <commit>:sw.js | grep -o "VERSION[^;]*"

E601  5c1f757   notizen-v1125
E608  70cf450   notizen-v1145
E609  ca2a422   notizen-v1141     ← vier Stufen ZURÜCK
HEAD            notizen-v1141
```

E609 war ein `git revert` von E608. Weil E608 `sw.ts` und `stand.ts`
angefasst hatte, gingen sie mit zurück — und `v1142` bis `v1145` sind wieder
frei zur zweiten Vergabe, mit anderem Inhalt.

**Was der Ablagename vorher und nachher ist**, im echten Browser abgelesen
(`caches.keys()` nach echter Anmeldung des Dienst-Arbeiters, `test530` §3):

```txt
vorher   ["notizen-v1141"]
jetzt    ["notizen-v1141-7b5c3ef121062083"]
```

Genau eine Ablage in beiden Fällen — der Aufräumer in `activate` arbeitet.
Er löscht aber nur, was **anders** heisst, und genau das war die Lücke.

**Der Zusammenstoss, hergestellt statt behauptet** (`test530` §2, vier
Schritte in einem Wegwerf-Projekt: Inhalt A → Inhalt B → Zurücknehmen auf A
samt `sw.ts`/`stand.ts` → Inhalt C):

```txt
Schritt 2   Inhalt B   notizen-v1143
Schritt 4   Inhalt C   notizen-v1143     dieselbe Nummer, anderer Inhalt
```

Vor E610 waren das zwei gleiche Namen, nach E610 zwei verschiedene.

**Läufe:**

```txt
test530                        16/16   (neu)
test353 143 31 99 zusammen    105/105
test105 109 87                 grün
npm run typecheck              sauber
npm run stand                  v1141 unverändert (7b5c3ef121062083)
```

**Was der Bogen NICHT gemessen hat:** die Gesamtsuite. Gelaufen sind die
oben genannten acht Läufe.

--------------------------------------------------------------------------------

## §49 — Wie viele Ordner es wirklich gibt (E611, 16. September 2026)

**„Überall" ist eine Stelle.** Gezählt, nicht geschätzt:

```txt
grep -rn 'data-art="ordner"' src/ --include=*.ts

bibliothek.ts  deckelKarte   Auge seit E463, „Blick hinein" seit E459
notebook.ts    fachCard      beides fehlte
motion.ts                    nur der Selektor der Blätter-Fächerung
```

Zwei Zeichner, einer mit Auge. Das erklärt nebenbei Redurs erstes Bild
desselben Tages: Ordnerkacheln mit `•••` und ohne Auge — das war die
`nh-mehr`-Schaltfläche der **Notizhefte**, nicht die Bibliothek.

**Das Auge sitzt in beiden Bereichen gleich** — am laufenden Programm
abgelesen (`getBoundingClientRect`, dunkles Thema, 1280 px):

```txt
                 Masse    von oben   von links
Notizhefte       44×44      4 px       4 px
Bibliothek       44×44      4 px       4 px
```

**Läufe:**

```txt
test531   19/19   (neu)
test436   71/71   das Auge der Bibliothek
test476   26/26   der Blick beim Hinschauen
test264   25/25   die Notizhefte selbst
test290   13/13   Namensräume
npm run typecheck   sauber
Dienststand         v1141 → v1142, Stempel e1266feeeb8eca65
```

**Die Gegenprobe, die zuerst grün war.** Der Mitgabewert `beiOeffnen` wurde
entfernt — und der Lauf blieb grün. Die Zusicherung prüfte `.nh-regal` und
den Hash, und beide bleiben stehen, wenn die Karte das `geheIn` der
Bibliothek ruft. Geschärft auf `Store.getMeta('heft:fach')`:

```txt
vorher (Zusicherung an .nh-regal + Hash)   19/19  ← wertlos
nachher (Zusicherung an heft:fach)         18/19  ✗=1
```

Erst die zweite Fassung misst, was sie behauptet.

**Nicht gemessen:** die Gesamtsuite. Gelaufen sind die fünf oben.

--------------------------------------------------------------------------------

## §50 — Die Bedienung über der Folie (E612, 16. September 2026)

**Zweimal gemessen, und beide Male 301.** Erst aus den Stilblättern
gerechnet, dann am laufenden Programm abgelesen (1440 × 852, Foliensatz mit
eingelesener `.ppsx`, dunkles Thema) — von der Oberkante bis zur ersten
Folie:

```txt
                                    vorher   nachher
Reiterleiste (offene Dokumente)      48 px     48 px
Dokument-Kopfzeile                   48 px     48 px
Folienband — Reiterzeile (Griff)     35 px     35 px
Folienband — Fläche                  74 px      0 px   ← zugeklappt
Polster, Dateikarte, Hinweissatz     95 px      0 px   ← im Details-Fenster
──────────────────────────────────────────────────
Bedienung über der Folie            301 px    160 px
Arbeitsfläche (.document-center)    646 px    720 px
Folie selbst (.document-stage)      571 px    571 px
```

**Die letzte Zeile ist die ehrliche.** Die Folie wird nicht grösser: sie
hängt am Seitenverhältnis und an der Spaltenbreite, nicht an der Höhe.
Gewonnen sind Arbeitsfläche und Ruhe — wer „die Folie wird grösser"
verspricht, misst falsch (dieselbe Lehre wie E383).

**Die Gegenproben, jede einzeln gelaufen und rot gesehen:**

```txt
Klappen abgeklemmt  (`let zu = false`)    224 px   test532 12/17 · ✗=5
Dateikarte zurück   (Ruhig-Abfrage weg)   227 px   test532 14/17 · ✗=3
```

Die Decke steht deshalb auf **175** und nicht auf den gemessenen 160: sie
muss beide Rückfälle fangen (224 und 227), darf aber nicht beim ersten
geänderten Rand rot werden.

**Läufe:**

```txt
test532                       22/22   (neu)
test385                       38/38   §4 umgehängt
test506 508 524               grün
test430 424 348 351 290 87 105 109   alle acht grün
npm run typecheck             sauber
Dienststand                   v1141 → v1145
```

**Nicht gemessen:** die Gesamtsuite.

---

## §51 · Die Startnutzlast — woher die 512 KB kamen (E613, 16. September 2026)

`test388 §5` war rot, und zwar seit zwölf Tagen. Zuerst gezählt, dann
gehandelt — das ist die Reihenfolge, die L146 Punkt 1 bis 3 verlangt hat.

**Am laufenden Programm gemessen** (`node pruefungen/lauf/test388.mts`, gzip
Stufe 6 wie ein echter Server, der Lauf zählt, was der Browser wirklich holt):

```txt
 4. September   203 Dateien   2081 KB     Decke damals gesetzt: 2300
 5. September   207 Dateien   2169 KB
16. September   232 Dateien   2637 KB     ← rot
nach E613       232 Dateien   2585 KB     Decke jetzt: 2700
```

Die 2637 stammen aus einem eigenen Arbeitsbaum auf `origin/main`
(`git worktree add … origin/main`), nicht aus einer Rechnung.

**Die Aufteilung der 512 KB** (gzip Stufe 6 über alle `<script src>` und
`<link rel=stylesheet>` aus `index.html`, gegen `57a5199`):

```txt
26 NEUE Dateien        229 KB
206 GEWACHSENE         291 KB
```

Die sechs grössten Posten:

```txt
neu        quell/bereiche/chronik/daten.js       54,2 KB   (182 KB roh)
neu        quell/schale/stil/motion.css          47,6 KB
neu        quell/schale/stil/pdf-studio.css      16,2 KB
gewachsen  quell/bereiche/pdf/marken.js         +68,1 KB
gewachsen  quell/bereiche/pdf/document-mode.js  +64,1 KB
gewachsen  quell/schale/stil/bausteine.css      +45,8 KB
```

**Was die Zahlen sagen, und was nicht.** `marken.js` und `document-mode.js`
sind zusammen 132 KB gewachsen — das Zeichen- und das Schreibstudio, E568
bis E612. Wer diese Zahl kleiner haben will, will weniger Produkt. Der eine
Posten, der *nichts* mit Arbeit am Produkt zu tun hatte, war
`chronik/daten.js`.

**Der Befehl, mit dem sich das jederzeit nachzählen lässt:**

```bash
node pruefungen/lauf/test388.mts          # was der Browser wirklich holt
```

**Gegenprobe (§55.2), gelaufen und rot gesehen:** `daten.js` wieder als
`<script src>` in `index.html` → `test388` 18/19, Startlast 2639 KB.

**Läufe:**

```txt
test388     19/19   (2 Zusicherungen neu, 1 in der Gegenprobe rot gesehen)
test481     39/39   (5 neu, §3b — die Chronik kommt beim Öffnen wirklich an)
test270     77 ok
test105 · test109 · test87   grün
npm run typecheck   sauber
Einzeldatei         10 243 KB
Dienststand         v1145 → v1146
```

**Nicht gemessen:** die Gesamtsuite.

---

## §52 · Die Tafel als Behälter — was sich NICHT bewegt hat (E614, 16. September 2026)

W2 baut keine Gestaltung. Er schiebt eine Ebene ein, und die Zusage ist,
dass am Bildschirm nichts passiert. Das lässt sich nur so belegen: dieselbe
Messung auf beiden Ständen, in einem eigenen Arbeitsbaum.

**1280 px Fenster, breite Seite, Blatt mit kariertem Papier, Stift gewählt:**

```txt
                          origin/main (2f35d03)   mit E614
Leiste, Breite                     860 px           860 px
Leiste, Höhe                       127 px           128 px
Zeile 1  (y ≈ 0)              13 Werkzeuge      13 Werkzeuge
Zeile 2  (y ≈ 50)             26 Zubehörteile   26 Zubehörteile
Zeile 3                       «Einrichten»      «Einrichten»
```

**Ein Pixel.** Das ist die ganze sichtbare Wirkung von W2 — und es ist der
eine Pixel des gestapelten Wortes aus W3, nicht der Ebene.

Gefahren mit `git worktree add … origin/main`, damit im Hauptbaum
weitergearbeitet werden konnte (§30).

### Der Umfang, gezählt statt geschätzt

```txt
.blatt-werk in CSS              182 Zeilen in 2 Dateien
  davon Kindwähler               51 Regelblöcke / 104 Selektorzeilen  ← ziehen mit
  davon Nachfahre                44 Regelblöcke                       ← bleiben
  davon `.blatt-werk` selbst     23 Regelblöcke                       ← bleiben
:scope > im TypeScript            7 Stellen (6 marken.ts, 1 document-mode.ts)
:first/last/nth-child im Kontext  0   ← eine ganze Gefahrenklasse fällt weg
Geschwisterwähler `+`             3 Regeln;  `~`  0
Läufe, die `.blatt-werk` nennen  56 von 475
  davon auf dem Kindwähler        3   (test522, test523, test524)
```

Befehl für die Kindwähler — das naive Muster übersieht die Regeln mit
Attributanhängsel, und das sind gerade die Kernregeln:

```bash
grep -rnE "\.blatt-werk(\[[^]]*\]|:[a-z-]+(\([^)]*\))?)*\s*>" quell/schale/stil/
```

### W3: das Wort kostet Höhe statt Breite

Gemessen an der Stelle, die `test351` ohnehin misst — 1360 px Fenster,
Leiste 940 px:

```txt
vorher    0 Wörter,  ZWEI Werkzeugzeilen
nachher  13 Wörter,  EINE Werkzeugzeile
```

Dreizehn gestapelte Werkzeuge brauchen in einer Zeile rund **790 px**
(daneben waren es 1142, E515). Die Schwelle steht deshalb auf **820** und
nicht auf 790 — eine Schwelle auf dem Messwert reisst beim ersten längeren
Wort. Bei 592 px (Leiste in einer Spalte) kippen sie in zwei Zeilen und die
Leiste wird 165 px hoch; `test351` fängt das.

### Gegenproben (§55.2), jede einzeln gelaufen und rot gesehen

```txt
EINEN Kindwähler zurücklassen     test533 27/29
  → „Beim Stift steht nur SEIN Zubehör da" meldet ZWÖLF Gruppen statt
    sechs; Leiste 163 px statt 128.
W3-Stapelung abgeklemmt           test533 26/29
  → `flex-direction: row`, das Wort steht wieder daneben.
```

**Läufe:**

```txt
test533   29/29   (neu)
test351   26/26   §3 umgehängt
test522   31/31 · test523 40/40 · test524 118/118   je umgehängt
test343–352 (neun Läufe)   alle grün
npm run typecheck   sauber
Einzeldatei         10 252 KB
Dienststand         v1146 → v1148
```

**Nicht gemessen:** die Gesamtsuite.

---

## §53 · Der Stift am Ordner-Auge (E615, 17. September 2026)

Kein Bild — hier gibt es nichts zu sehen, nur ein Verhalten (§55.3). Die
Messung ist der Beweis.

**Was vorher galt**, an der einen Bedingung in `bibliothek.ts`:

```txt
Eingabemittel      pointerType    zeigerHatHover()   Karte ging auf?
Maus               mouse          ja                 ja
Stift              pen            ja                 NEIN  ← der Fund
Finger             touch          —                  nein  (gewollt)
```

Und der zweite, unterschätzte Grund — `(hover: hover) and (pointer: fine)`
beschreibt den **Hauptzeiger**:

```txt
Gerät                                  (hover:hover)   (any-hover:hover)
Rechner mit Maus                       ja              ja
Laptop mit Berührungsbildschirm        NEIN            ja   ← auch die MAUS
   + Maus oder Stift daneben                                   war gesperrt
Telefon                                nein            nein
```

Die alte Abfrage hätte also nicht nur den Stift ausgesperrt, sondern auf
jedem Touch-Laptop auch die Maus — an einem Gerät, das Redur benutzt.

**Läufe:**

```txt
test476   31/31   (5 Zusicherungen neu)
npm run typecheck   sauber
Dienststand         v1148 → v1149
```

**Gegenproben (§55.2), jede einzeln gelaufen und rot gesehen:**

```txt
alter Stand (`!== 'mouse'`, `hover: hover`)      test476 27/31
nur die `pointerdown`-Absage entfernt            test476 29/31
```

**Und ein Fund im eigenen Wächter, der vierte dieser Woche.** Die
Quellenzusicherung „`(hover: hover)` steht nirgends mehr" war rot, obwohl
der Code stimmte: sie traf den **Kommentar**, der erklärt, warum die alte
Abfrage weg ist. Mit `matchMedia\(` davor zeigt sie auf den Aufruf.
Dieselbe Sorte wie E610, E612 und E613.

**Nicht gemessen:** die Gesamtsuite.

---

## §54 · Was ein Strich in Millimetern ist (E616, 17. September 2026)

Die Frage, mit der W4 anfing: Redurs iPad-Bilder nennen „Fein 0,3 mm ·
Mittel 0,7 mm · Markant 1,2 mm". Passen diese Zahlen auf Redion?

**Nein.** Und das liess sich nur durch Nachsehen herausfinden.

**Gemessen am laufenden Programm** (1440 × 950, A4-Blatt, Papier „mm"):

```txt
.blatt-papier auf dem Schirm      1136 × 1607 px
viewBox der Markenfläche          0 0 595.28 841.89     ← A4 in PDF-PUNKTEN
```

Der Massstab der Marken ist also **nicht** der des Bildschirms. `BREITEN`
sind Punkte. Ein Punkt ist 1/72 Zoll, ein Zoll 25,4 mm — ab hier ist die
Rechnung exakt:

```txt
                 Punkte    Redion      GoodNotes (Redurs Bild)   Abweichung
Fein               1,2     0,4 mm      0,3 mm                    +33 %
Mittel             2,4     0,8 mm      0,7 mm                    +14 %
Markant            5,0     1,8 mm      1,2 mm                    +50 %
Marker (× 4)       9,6     3,4 mm      4,0 mm                    −15 %
Regler, Maximum   12,0     4,2 mm      —
```

**Hätte der Bogen Redurs Tabelle abgeschrieben**, stünde bei „Markant"
1,2 mm an einem Strich, der 1,8 mm zieht — um die Hälfte daneben, und
plausibel genug, dass es niemandem auffällt (§55.1).

**Und die zweite Falle an derselben Stelle:** Stift und Marker teilen sich
die drei Stufenknöpfe, aber der Marker zieht das Vierfache. Eine feste
Beschriftung hätte am Marker „0,8 mm" an einen 3,4-mm-Strich geschrieben.
Die Beschriftung hängt deshalb am Werkzeug.

**Der Befehl, mit dem sich das nachzählen lässt:**

```bash
node pruefungen/alle.mts 438     # §3 prüft das viewBox und rechnet selbst
```

Die Zusicherung schreibt ihren Sollwert **nicht** ab, sondern rechnet ihn
aus dem `viewBox`, das die Seite wirklich trägt.

**Läufe:**

```txt
test438   59/59   (5 Zusicherungen neu, 2 umgehängt)
npm run typecheck   sauber
Dienststand         v1149 → v1156
```

**Gegenproben (§55.2), jede einzeln gelaufen und rot gesehen:**

```txt
„Punkte sind Millimeter"   test438 55/59
Marker-Faktor weg          test438 58/59
```

Die erste baute zunächst gar nicht: `MM_JE_PT` war nur in `alsMm` benutzt,
und `noUnusedLocals` brach ab (§52.6). Die Konstante musste mit weg — sonst
wäre es keine Gegenprobe gewesen, sondern ein Bauabbruch.

**Nicht gemessen:** die Gesamtsuite.

---

## §55 · Was ein Stiftname kostet (E617, 17. September 2026)

Im Stilblatt stand seit E512 eine Zahl als Grund dafür, dass die
Stiftkacheln keinen Namen tragen: „Sechs Stifte mit Namen sind rund 320 px."
Sie war richtig — für ein Wort **neben** dem Zeichen.

**Gemessen, gestapelt** (laufende App, Stift gewählt, breite Seite):

```txt
Kachel ohne Wort                    32 px
Kachel mit Wort, gestapelt          77 px   („Kugelschreiber", das längste)
sechs Kacheln, Zuwachs             ~270 px  statt der befürchteten 320
```

**Und was das für die Leiste heisst** — das ist die Zahl, die zählt:

```txt
Leistenbreite   Zubehörzeilen   Leistenhöhe
    1180 px          4            127 px    ← zu eng
    1280 px          3             91 px
    1307 px          3             91 px
    1507 px          3             91 px
```

Die Schwelle steht deshalb auf **1300** und nicht auf 1280: eine Schwelle
auf dem Messwert reisst beim ersten längeren Namen. Nach der Umstellung ist
die Leiste bei **jeder** geprüften Breite so hoch wie vorher:

```txt
Fenster   Leiste    Höhe vorher / nachher   Namen sichtbar
 1280      860 px      128 / 128                 0
 1500     1080 px       92 /  92                 0
 1600     1180 px       91 /  91                 0
 1700     1280 px       91 /  91                 0
 1900     1407 px       91 /  91                 6
```

**Die drei Schwellen der Leiste, gesammelt:**

```txt
 820 px   die dreizehn Werkzeuge      W3 (E614)
1150 px   Formen, Kritzeln, Lineal …  E359
1300 px   die sechs Stifte            E617
```

### Und der Fehler, den das Bild gefunden hat

Die erste Messung sagte „Kachel 36 px" — also „der Name wird
abgeschnitten". Auf dem Bild stand er **vollständig** da. Nachgemessen sind
es 77 px; die erste Zahl war am falschen Knoten genommen. Hätte ich ihr
geglaubt, wäre der Bogen als „geht nicht" abgebrochen worden.

**§55 ist deshalb keine Zierde: hier hat das Bild die Messung widerlegt,
nicht umgekehrt.**

### Und `bilder.mts` konnte den Zustand gar nicht zeigen

Das breiteste Gerät war `rechner` mit 1280 px Fenster — Leiste 860 px. Die
obere Schwelle war damit **auf keinem Bild dieses Verzeichnisses je zu
sehen**. Neu: `breit`, 1920 × 1080, Leiste 1407 px.

**Läufe:**

```txt
test533   40/40   (11 Zusicherungen neu: §5b und §5c)
test351 522 523 524 438 345 365   alle grün
npm run typecheck   sauber
```

**Gegenproben (§55.2), jede einzeln gelaufen und rot gesehen:**

```txt
die dritte Schwelle entfernt       test533 38/40   (Leiste 127 statt 91 px)
`display:none` wieder eingesetzt   test533 36/40   (keine Namen, keiner im Baum)
```

**Nicht gemessen:** die Gesamtsuite.

---

## §56 · Die Tafel als Kasten (E618, 17. September 2026)

### Was der Rückbau an E614 gekostet hat

E614 legte alle Kinder in die Tafel; E618 holt die Werkzeuge und den
Zeilenbruch zurück in die Leiste. Gezählt, was dabei mitziehen musste:

```txt
Kindwähler der GRUPPEN   (.blatt-tafel > [data-gruppe])   51   unberührt
Regeln mit [data-wz] oder .blatt-zeilenbruch               8   umgeschrieben
Geschwisterwähler über die neue Grenze                     1   neu gefasst
:scope > im TypeScript                                     5   auf zwei Flächen
Prüfläufe umgehängt                       test522 523 524 533
```

**Ein Achtel der Arbeit von E614** — weil die 51 Gruppenwähler weiterhin auf
die Tafel zeigen. Das Zubehör ist ja darin geblieben.

### Der Kasten, gemessen

```txt
Fenster 1900 px   Leiste 1407 px   Tafel: display:flex, eigene Zeile, voller Breite
Fenster 1600 px   Leiste 1180 px   Tafel: display:contents — alles wie bisher
```

Die Schwelle ist dieselbe wie bei den Stiftnamen (1300, E617).
`display:contents` unter ihr ist **keine Sparmassnahme, sondern die
Bedingung**: am Telefon kommt die Reihenfolge aus `order` über Werkzeuge UND
Zubehör hinweg (E356), und ein Kasten dazwischen bräche das.

### Und zweimal hat das Bild die Arbeit korrigiert (§55)

**Erstes Bild — „0,4 mm0,8 mm 1,8 mm".** Die Zahlen liefen ineinander:
`.blatt-strich` steht auf festen `width:30px`, die Zahl lief darüber hinaus.

```txt
vorher   width:30px                 Zahl überlappt den Nachbarn
nachher  width:auto; min-width:52px sie steht in ihrer Kachel
```

Eine überlappte Zahl ist eine falsche Zahl — derselbe Fund wie §55.1 mit der
abgeschnittenen Tabellenzahl. `test533 §5d` misst seither ausdrücklich, dass
keine Zahl über ihre Kachel hinausläuft.

**Zweites Bild — der Kasten war kaum zu sehen.**

```txt
vorher   --bg-tief  #f4f4f2   gegen --bg-card #f7f7f5   = 3/100 Helligkeit
nachher  --bg       #ffffff                             = ein Feld
```

**Läufe:**

```txt
test533   54/54   (14 Zusicherungen neu: §5d und §5e)
test522 523 524 351 438 345 365 476 532 506   grün
npm run typecheck   sauber
Dienststand         v1157 → v1160
```

**Gegenprobe (§55.2), gelaufen und rot gesehen:** den Kasten wieder zu
`display:contents` → `test533` 50/54.

**Nicht gemessen:** die Gesamtsuite.

---

## §57 · Wo die Leiste wirklich stand (E619/E620, 19. September 2026)

Gemessen an der laufenden App mit Playwright, Fenster 1440 × 960,
`deviceScaleFactor: 1`. `data-lage` gesetzt, danach
`getBoundingClientRect()` der `.blatt-reihe` abgelesen — die Werte sind
gerundete Pixel, nicht geschätzt.

```txt
Befehl   node /tmp/.../messe-lage.mts   (Wegwerfskript, siehe test534 §1/§2)
```

### Gewöhnliche Seite, vorher

```txt
oben     x=244   y=335   1136 × 93      richtig
links    x=250   y=369     64 × 749     richtig
rechts   x=1310  y=369     64 × 749     richtig
unten    x=811   y=522      2 × 1409    ← zwei Pixel breit
```

### Gewöhnliche Seite, nachher

```txt
oben     x=244   y=335   1136 × 93      unverändert
links    x=250   y=335     64 × 749     unverändert
rechts   x=1310  y=335     64 × 749     unverändert
unten    x=256   y=1885  1112 × 46      eine Leiste
frei     gezogen, geklemmt auf die halbe Leistenbreite vom Rand
```

### Studio, vorher

```txt
oben     x=198   y=884   1044 × 62      der Dock
links    x=683   y=197     74 × 749     mitten auf dem Papier (x=225 … 1205)
rechts   x=683   y=197     74 × 749     dasselbe
unten    x=198   y=884   1044 × 62      der Dock
```

### Studio, nachher

```txt
alle vier gemerkten Plätze   x=198  y=884  1044 × 62  —  der Dock, unverformt
Platz-Knopf im Studio        0 sichtbar (vorher 1)
```

### Der Vorlesebaum

```txt
role="toolbar" in src/      vorher 0   nachher 1
   (bei 11 anderen Rollen: status 11, switch 8, tab 6, img 5, group 5, dialog 5 …)
Tabstationen der Leiste     vorher 35  nachher 1      frisch geladen, ohne Klick
```

### Die Farben des Papiers gegen Redions Marken

Gerechnet mit `python3`, euklidisch im RGB:

```txt
#905CFF (Papier)  gegen  --accent hell  #7c3aed    Abstand 43,4
#905CFF (Papier)  gegen  --accent dunkel #6d4aff   Abstand 39,4
```

Beide sind Violett, beide liegen nah — und genau deshalb wäre der Hex-Wert
des Papiers ein **drittes** Violett neben zwei vorhandenen gewesen (§39).

---

## §58 · Die Strichprobe, die Kachel und der Radierer (E622–E624, 19. September 2026)

Gemessen an der laufenden App mit Playwright, `deviceScaleFactor: 1`.

### Wo «unten» steht (E622)

```txt
Fenster 1440 × 960, Blatt rund 1600 px hoch

vorher    position:absolute   y = 1885      (Blattfuss, ausserhalb des Bildes)
nachher   position:sticky     y =  904      (10 px über dem Fensterrand)
          Papier              335 … 1941    — keine Lücke darüber
          Platz im Baum       1 von 2       (hinter dem Papier)
```

Zwischenstand, der zum Zug im Baum führte: nur `absolute` → `sticky` getauscht
ergab y = 335, also gar keine Bewegung. Und mit `left:50%` zusätzlich
x = −288, weil `left` bei sticky eine Haftgrenze ist und keine Platzierung.

### Was die Strichprobe zeigte (E623)

```txt
vorher    background:currentColor  →  rgb(242, 242, 242) bei JEDER Tinte
nachher   rot gewählt              →  rgb(214, 69, 69)

Kontrast der schwarzen Tinte (rgb 17,17,17)
  gegen die Leiste im Dunkelmodus (rgb 32,32,32)      1,2 zu 1   unsichtbar
  gegen den Papiergrund (rgb 248,248,245)            17,7 zu 1   lesbar

Deckung der Probe        Bleistift 0,72 · Pinsel 0,92 · Marker 0,32 · Füller 1
Deckung am echten Strich Bleistift 0,72 · Pinsel 0,92      (am SVG abgelesen)
```

### Was die Kachel kostet (E623)

```txt
„Markant · 1,8 mm" in EINER Zeile     Leiste 143 px   Decke 140  → gerissen
Name über Millimeter                  Leiste < 140 px            → passt
Kachelbreite im Kasten                min-width 52 px, width:auto
beim Marker                           „3,4 mm" (das Vierfache, E616)
```

### Der Radierer (E624)

```txt
Grössen auf der gewöhnlichen Seite    vorher 0      nachher 3
Kantenlänge je Grösse                 44 × 44 px    (§37, E576)
Radierkreis „groß" gewählt            r = 28
Radierkreis „automatisch"             r = 7,2       (Strichbreite 2,4 × 3)
```

### Was die Läufe dazu sagen

```txt
test535   27 von 27 grün   (neu)
test534   50 von 50 grün   (§1b neu)
test533   56 von 56 grün   (zwei Zusagen neu)
test524  105 von 105 grün
test348   34 von 34 grün   (eine Zahl nachgezogen: 1068 statt 828 + 60)
test351   34 von 34 grün   (eine Zahl nachgezogen: 5 statt 1)
```

---

## §59 · Die Dock-Welle (E625, 19. September 2026)

Gemessen am `transform` der Zeichen, Fenster 1500 × 950, Playwright mit
`hover: hover` und `pointer: fine`.

### Gewöhnliche Seite

```txt
                      vorher      nachher
überfahrener Knopf    none (1)    1,3
linker Nachbar        none (1)    1,13
rechter Nachbar       none (1)    1,13
zwei Knöpfe weiter    none (1)    1
Farbtupfer            none (1)    1,3   (Nachbar 1,13)
```

### Mit `prefers-reduced-motion: reduce`

```txt
alles                 1
```

### Studio (Gegenprobe gegen eine Verdoppelung)

```txt
obere Leiste          1,3        unverändert
Dock                  1,3        unverändert, jetzt aus bausteine.css
Wählerfamilien        3 → 2
test524               105 von 105 grün
```

### Das Fähnchen, das nicht ging

```txt
auf ::before          top 5px    — erbt `inset:5px` der Kantenregel (E568)
unter dem Tupfer      opacity 1  — und zu 60 % vom Papier verdeckt
```

---

## §60 · Wie oft Bereiche einander anfassen (E626, 19. September 2026)

Gemessen mit `pruefungen/lauf/test537.mts` über `src/` — Kommentare,
Zeichenketten und der Inhalt von Schablonen entfernt (`nurCode()` aus
`test87:145`, plus eine Schablonen-Leerung), gesucht nach einem **Aufruf**
(`Name.glied`), nicht nach dem blossen Wort.

### Die Fläche

```txt
ls -d src/bereiche/*/ | wc -l                              18 Bereiche
find src/bereiche -name "*.ts" | wc -l                     86 Dateien
grep -rh "^import " src/bereiche --include=*.ts | wc -l     0 Importe
eindeutig zugeordnete globale Namen                       182
```

### Die Querverweise

```txt
523 Treffer        in 63 von 306 möglichen Bereichspaaren
                   127 Einträge (Bereich + fremder Name)
                   über 61 verschiedene fremde Namen
 88 weitere nur in Schablonen (Backticks) — nicht mitgezählt
  6 über `(window as any).X`
```

Am meisten gerufen werden:

```txt
114  bereiche/datenbanken
101  bereiche/wissen
 86  bereiche/dateien
 59  bereiche/ki
 40  bereiche/verbinden
 17  bereiche/elektro
```

### Die zwölf dicksten Namen — und ihre Grösse

Die Grösse entscheidet, ob „nach `kern/` verschieben" überhaupt in Frage
kommt. Sie kam nicht.

```txt
68  Werkzeuge     aus 10 Bereichen   wissen/werkzeuge.ts            163 KB
68  Datenbank     aus  8 Bereichen   datenbanken/steuerung.ts       502 KB
46  Dateien       aus  4 Bereichen   dateien/ablage.ts               23 KB
30  KI            aus  5 Bereichen   ki/dienst.ts                   108 KB
26  Formula       aus  6 Bereichen   datenbanken/formeln/laufzeit.ts 82 KB
21  Links         aus  6 Bereichen   wissen/verweise.ts              69 KB
14  Blocks        aus  4 Bereichen   editor/…
14  Austausch     aus  4 Bereichen   dateien/…
13  Verbindungen  aus  3 Bereichen   verbinden/…
11  Kommentare    aus  2 Bereichen   kommentare/…
11  Plan          aus  2 Bereichen   planen/…
11  Marken        aus  4 Bereichen   pdf/…

  diese zwölf zusammen: 333 von 520 = 64 %
```

### Was die Messung selbst gekostet hat

```txt
ohne Schablonen-Leerung         +88 Treffer aus deutscher Prosa in Backticks
Fensterweg doppelt gezählt      526 statt 523 (eine Zeile zählte zweimal)
```

Beides fiel in der Gegenprobe auf, nicht beim Lesen.

---

## §61 · Was an der Gedankenkarte zu sehen war (E628, 19. September 2026)

Vier Messungen, und drei davon hat erst das Bild oder der Prüflauf gefunden —
im Quelltext stand jedes Mal etwas, das richtig aussah.

### Die Griffe, die nicht kamen

```txt
Griffe am gewählten Knoten nach einem Klick   0    (soll 4)
```

Der Grund: `waehle` zeichnet die Karte nicht neu, es setzt nur die Marke
`on` um. Die Griffe entstanden im Zeichner — also erst bei der nächsten
Änderung. Behoben mit `griffeBauen`, das beide Wege benutzen.

**Und die Gegenprobe dazu entlarvte eine Prüfung, die nicht rot werden
konnte** (§55.2):

```txt
Zeichner hängt Griffe an JEDEN Knoten
  gemessen NACH einem Klick    4    ← bleibt grün, `waehle` räumt auf
  gemessen VOR  einem Klick   16    ← hier fällt sie
```

### Die Linie quer durch die Wurzel

Zwei Äste links und rechts der Wurzel, auf gleicher Höhe:

```txt
Kasten der Verbindung   181 × 0 px
Klick auf ihre Mitte    traf `.gk-kn` (die Wurzel), nicht die Linie
```

Eine waagerechte Linie zwischen zwei gleich hohen Knoten läuft genau durch
das, was dazwischen steht. Mit dem Bogen zur Seite:

```txt
Kasten der Verbindung   181 × 45 px
Klick auf die Bogenmitte  traf `.gk-verb-fang`
```

### Der Fokus, den der Browser zurücknahm

```txt
nach dem Klick auf die Linie   document.activeElement = <body>
Entf                           löschte nichts
mit preventDefault             document.activeElement = .gk-buehne
Entf                           löschte die Verbindung
```

Ein Knoten ist ein `div` und gibt den Fokus an die Bühne weiter; ein
SVG-Pfad tut das nicht.

### Was der Lauf hält

```txt
test538   53 von 53 grün      Griffe, Verbindungen, Formen, Vorlagen
test529   56 von 56 grün      die Karte selbst, unverändert
test402    4 von  4 grün      Trefflächen (E627)
```

---

## Die sechs Marken-Decken, nachgemessen — 19. September 2026 (E637)

`test362` meldete: `{16:272, 22:85, 28:64, 44:54, 46:16, 56:14}` gegen die
Decke `{16:266, 22:83, 28:63, 44:54, 46:15, 56:14}`. Redur hatte entschieden:
**erst nachsehen, dann entscheiden** — also nicht nachtragen, sondern die
Stellen suchen.

### Wo der Zuwachs steckt

Gezählt je Datei, gegen `9b9a89e` (den Stand, an dem die Decke zuletzt
geschrieben wurde):

```txt
16px   werkzeuge.css    29 → 35   (+6)     alle anderen 21 Dateien: unverändert
22px   werkzeuge.css     7 →  9   (+2)
28px   werkzeuge.css     9 → 10   (+1)
46px   werkzeuge.css     3 →  4   (+1)
44px   —                          (+0)
56px   —                          (+0)
```

**Restlos in einer Datei, und restlos aus zwei Bögen:** E607 (die
Gedankenkarte, 16. September) und E628 (Griffe, Formen, Vorlagen,
19. September). Keine Gegenbewegung anderswo.

### Die zehn Stellen, je eine Zeile, je ein Urteil

```txt
 Zeile  Zahl  was es ist                       Marke dieser Zahl        Urteil
 1325   28px  Breite eines Werkzeugknopfs      --mobile-gutter          andere Aufgabe
 1364   46px  min-width der Zoomanzeige        (keine — 46 ist der      aufgelöst
                                                verworfene Wert)
 1387   16px  Schriftgrösse der Wurzel         --sheet-radius           andere Aufgabe
 1387   16px  waagerechtes Polster             --sheet-radius           → --space-5
 1416   16px  Breite des Griffels              --sheet-radius           andere Aufgabe
 1416   16px  Höhe des Griffels                --sheet-radius           andere Aufgabe
 1467   16px  Polster der Pillenform           --sheet-radius           → --space-5
 1468   22px  Polster der Ellipse              --mobile-gutter-small    andere Aufgabe
 1473   22px  Polster des Sechsecks            --mobile-gutter-small    andere Aufgabe
 1502   16px  Schriftgrösse am Telefon         --sheet-radius           andere Aufgabe
```

Der Massstab für „andere Aufgabe" steht in `marken.css:40`: *„Gleiche Zahl
bedeutet nur dann dieselbe Marke, wenn sie dieselbe Aufgabe hat."* Eine
Schriftgrösse ist keine Blattgeometrie, ein Knopf ist kein Seitenrand, ein
Formpolster ist kein Telefonrand.

### Die 46 hatte Vorrang — und war unschuldig

E372 hat `--mobile-topbar` von falschen 46 auf die gemessenen 56 gesetzt; die
46 steht seitdem als Fangzaun in der Decke. Die neue 46 ist `min-width` der
Zoom-Prozentanzeige und eine wörtliche Abschrift von `.wb-massstab`
(Whiteboard, seit E138). Kein `--mobile-topbar` in derselben Datei, kein
Telefonbalken in Sichtweite.

Die Abschrift war trotzdem ein Fehler, nur ein anderer: sie hatte
`font-variant-numeric:tabular-nums` verloren — genau das, wofür die Regel da
ist. Beide teilen sich jetzt eine Regel.

### Was daraus wurde

```txt
46px   16 → 15    eine Regel für beide Massstäbe statt zweier Abschriften
16px  272 → 270   zwei Polster benutzen --space-5 (grund.css:44), das es gibt
22px   85         bleibt — kein Token für 22, und es ist kein Seitenrand
28px   64         bleibt — Knopfbreite, die Trefffläche holt --touch-min
```

Neue Decke: `{16:270, 22:85, 28:64, 44:54, 46:15, 56:14}`. **Zwei nach unten,
zwei nach oben.** `test362` 18/18.

Dass eine Decke steigt, ist die Ausnahme und steht deshalb hier mit jeder
einzelnen Zeile. Wer sie später senken will, findet oben, welche sieben
Zahlen noch roh dastehen und warum.

---

## Die wandernde Linse — 20. September 2026 (E639)

Redurs Video (Apple TV, iOS 26) Bild für Bild gelesen, dann nachgebaut und
gegeneinandergehalten. Alle Zahlen sind gemessen, keine geschätzt.

### Was das Vorbild tut

Aufnahme mit 15 Bildern je Sekunde, Ausschnitt der Leiste (1284 × 420 aus
1284 × 2778), Fahrt von „Mediathek" nach „Apple TV":

```txt
Dauer der Fahrt          rund 0,45 s
Dehnung in der Mitte     die Kapsel überspannt etwa 2,5 Reiter
Farbsaum                 grün → weiss → violett, nur an der Oberkante
Wölbung                  die Kapsel ragt über den oberen Rand der Leiste
```

### Die fünf Varianten, die ich nebeneinander gebaut habe

Gemessen an derselben Leiste mit fünf Reitern, dunkles Thema, 390 px breit:

```txt
Verschiebung   Sicht
  8            nichts zu sehen
 15            das Zeichen wird grösser, der Name bleibt lesbar   ← Ruhe
 24            die Nachbarzeichen werden mitgezogen               ← Fahrt
 46            die Zeichen VERDOPPELN sich, der Saum wird ein RGB-Gitter
 70            unlesbar
```

```txt
Farbsaum       Sicht
 0,22          ein Hauch an der Kante                             ← Ruhe
 0,55          sichtbar, aber nicht bunt                          ← Fahrt
 1,6           harte rote und blaue Doppelkanten
 3,6           Kirmes
```

### Der Fehler, der wie ein Balken aussah

Erster Anlauf mit `x="-30%" width="160%"` am Filter, damit der Saum am Rand
nicht abschneidet:

```txt
gesehen     ein dunkelblauer senkrechter Balken quer durch die Linse,
            in JEDER Variante an derselben Stelle
Ursache     `feImage` misst in Anteilen des FILTERBEREICHS, nicht des
            Elements — die Karte lag um 30 % verschoben über dem Glas
behoben     x="0%" width="100%"; der Saum darf am Rand abschneiden
```

### Der Übergang ohne Anlass

`test114` §17 wurde rot. Nachgemessen mit `transitionstart` und dem
gerechneten `transform` beim Start der App:

```txt
t = 676 ms    opacity     scaleX = 1,309   ← die Dehnung stand schon
t = 792 ms    transform   scaleX = 1,212   ← der Übergang, den niemand wollte
t = 1008 ms   opacity     scaleX = 1
```

Beim Start läuft `pilleSchieben` zweimal; der zweite Ruf rückt die Pille um
**sechs Punkte**. Die `stumm`-Sperre verdeckt das — aber nicht das
Zurückfedern der Dehnung 190 ms später, wenn die Sperre schon weg ist.

### Die drei Gegenproben

```txt
`pointer-events:none` entfernt   → elementFromPoint gibt "ho-pille" statt "knopf"
Wächterzeile in linse.ts weg     → 5 Halter, 5 Ruhe-Filter, 5 Fahrt-Filter
die zwei CSS-Regeln vereint      → „und die beiden sind NICHT dieselbe Regel" rot
```

Die zweite ist die lehrreichste: `sicherstellen()` wird bei jedem Reiterwechsel
gerufen, und ohne die eine Zeile wächst der Halterstapel mit jedem Tipp. Das ist
der Fehler aus E440, nur an einer neuen Stelle.

### Was der Lauf hält

```txt
test539    27 von 27 grün    die Linse (neu)
test114    87 von 87 grün    die gleitende Pille, seit E236
22 Läufe   alle grün         jeder, der `#handy-oben` oder `#ho-pille` anfasst
```

---

## Der Wechsel im Werkzeugsystem — 20. September 2026 (E640)

### Die Bauform, die nicht getragen hat

Erster Entwurf: eine dauerhafte Fläche neben den Knöpfen, die zum gewählten
wandert — dieselbe wie `#ho-pille` unten. Gemessen sah sie gut aus:

```txt
13 verschiedene Orte über 49 Bilder, 253 px → 816 px
```

Dann `test478`: die Fläche stand **55 px neben ihrem Werkzeug**,
Überdeckung 0. Die Suche danach, in der Reihenfolge, in der sie lief:

```txt
Verdacht                  Massnahme                              --bx danach
ein Auslöser fehlt        Beobachter auf class+childList+subtree     88 px
falscher Ursprung         gegen die Leiste statt offsetLeft          88 px
falsche Hülle             gegen offsetParent, Rand abgezogen         88 px
```

Erst ein Zähler im Element brachte es heraus: `laeufe: 5`. Die Rechnung war
gelaufen — fünfmal — und jedes Mal **zu früh**. Danach rollte die Leiste zum
Werkzeug (E356) und brach um.

```txt
Knopf auf dem Bildschirm    467 px
Fläche auf dem Bildschirm   412 px
gespeicherte Stelle          88 px   (richtig gewesen, bevor die Leiste rollte)
richtige Stelle             143 px
```

### Die Bauform, die trägt

```txt
mit Flug      13 Orte über 49 Bilder
ohne Flug     „Eine Fläche ist geflogen — 0 Bilder lang"   (Gegenprobe, rot)
```

Und der Beleg, der zählt: **die drei Läufe, die den ersten Entwurf widerlegt
haben, sind unverändert grün.** `test478` 43/43, `test522`, `test533` — keine
angepasste Zusage, keine nachgezogene Erwartung.

### Was nicht messbar war

```txt
page.emulateMedia({ reducedTransparency: 'reduce' })   matches → false
Start mit --force-prefers-reduced-transparency          matches → false
```

Der Chromium dieses Projekts kennt `prefers-reduced-transparency` nicht.
`test539` §6 prüft deshalb die Quelle statt die Seite, und das steht als
**L203** — samt der drei älteren Regeln derselben Art, die nie gemessen
wurden.

---

## Die Linse nach dem Design-System — 20. September 2026 (E641)

83 Regeln aus den Modulen des nachgereichten Design-Systems, gegen Redions
echten Quelltext gehalten:

```txt
44 erfüllt
20 teilweise
10 klar verletzt   ← neun davon aus E639, dem Bogen von derselben Nacht
 9 nicht berührt
```

### Was geändert wurde

```txt
                        E639                         E641
Dehnung                 1 + Weg/Breite × 0,3         1,18 zum Nachbarn
                        (wächst mit dem Weg)         1,00 sonst
Deckel                  1,85                         1,18
Ruhe-Brechung           Verschiebung 15              8
Fahrt-Brechung          24                           24 (unverändert)
```

Die 15 waren am 19. September ausdrücklich als „das Zeichen wird grösser"
notiert, die 8 als „nichts zu sehen". Genau das ist jetzt das Ziel: das Glas
zeigt sich am Rand, es vergrössert nicht den Inhalt.

### Die Gegenprobe kam umsonst

`test539` §7 wurde geschrieben, bevor die Änderung gebaut war — und lief im
grossen Durchgang gegen den ALTEN Stand:

```txt
✗ … und sie bleibt bescheiden (keine Gummiband-Oberfläche) — Dehnung 1.3085
✗ Über vier Reiter wird NICHT gedehnt — Dehnung 1.85
```

Das sind auf die Nachkommastelle die Werte der alten Formel. Nach dem Bauen:
50/50. Ein Wächter, der rot war, bevor er grün wurde, ohne dass jemand ihn
dafür verstümmeln musste (§50).

### Was bleibt

60 von 61 Wächtern der Werkzeugleiste waren im selben Durchgang grün — der
eine rote war §7 selbst.

---

## 20. September 2026 — Sechsundsiebzig tote CSS-Regeln, gezählt bis null

**Methode.** `node pruefungen/alle.mts 332`. Der Lauf liest die CSSOM im
echten Browser, in der Reihenfolge, in der `index.html` die Blätter lädt —
keine selbstgebaute Spezifitätsrechnung (E340). Gemessen nach jeder Gruppe,
nicht am Ende hochgerechnet.

```txt
Stand                                          tote Erklärungen
──────────────────────────────────────────────────────────────
19. September, erster voller Lauf seit PR #100       76
nach dem Klammer-Trennen im Wächter selbst           63   (−13 Gespenster)
nach #ai, .schalter i, .els-kachel                   51
nach #handy-oben, #reiterleiste                      43
nach .document-position, .document-zoom-label        37
nach premium.css (7 Rasterzeilen) und #kanten-lade   35
nach der Bibliothek (bausteine ↔ bibliothek-studio)   0
```

**Die dreizehn Gespenster sind die wichtigste Zahl der Liste.** Sie waren
kein Produktfehler, sondern ein Fehler im Messgerät: `selectorText.split(',')`
zerriss die Kommas innerhalb von `:is()`, `:where()`, `:not()` und `:has()`.
Was dabei herauskam, waren Bruchstücke wie

```txt
body[data-dokument="an"] :is(#topbar      ← verlor die schliessende Klammer
#menueband)                               ← verlor Vorfahren UND !important
select):focus-visible
:focus-visible)
```

Zeichenketten, die nie ein Element treffen. Der Lauf verglich sie mit echten
Regeln und meldete **die echten** als tot. Anteil am Befund: **17 %.**

### Die eine echte Regression darunter

```txt
.els-kachel  Überfahren, Flächenwechsel
   10. September – 20. September    HART   (motion.css ersetzte die Liste
                                            und verlor `background`)
   ab 20. September                 WEICH  var(--motion-fast) = .14s
```

Zehn Tage. Kein Auge hat es gemeldet — ein fehlender Übergang sieht nicht
kaputt aus.

### Der Deckelname: eine Zahl, die eine Schrift überlebt hat

`.bib-deckel-name b{min-height:33px}` war für 12,5px bei Zeilenhöhe 1,3
gerechnet. `bibliothek-studio.css` setzt seit dem 6. September 13px bei 1,5
— also 19,5px je Zeile, 39px für zwei. Gemessen im Browser mit einem kurzen
und einem langen Namen nebeneinander:

```txt
min-height:33px    kurz 33 px · lang 39 px    →  6 px Versatz
min-height:39px    kurz 39 px · lang 39 px    →  bündig
```

Der Wächter konnte das nicht sehen: `min-height` setzt das Studio-Blatt gar
nicht, es ist also keine Doppelung. Die Zahl war trotzdem falsch geworden.
**Eine tote Regel hat Nachbarn** — wer sie wegräumt, sieht sie.

### Bild-Gegenprobe

`node bilder.mts bibliothek rechner` vor und nach dem Aufräumen der 35
Bibliotheks-Erklärungen: **kein sichtbarer Unterschied** — was zu erwarten
war, denn jede entfernte Zeile war vorher schon wirkungslos. Genau das ist
der Beleg, dass entfernt und nicht verändert wurde.

---

## 20. September 2026 — Elf Prüfläufe teilten sich einen Port, sieben unbemerkt

**Methode.** Alle 481 Dateien unter `pruefungen/lauf/` gelesen, Kommentare
und Zeichenketten mit `nurCode` entfernt, dann nach **beiden** Schreibweisen
gesucht: `PORT = N` und `listen(N, …)`.

```txt
                                          alter Ausdruck    beide Schreibweisen
Läufe insgesamt                                  481                481
davon mit eigenem Server                           —                387
davon mit erkannter Portzahl                     374                382
davon mit listen(0) (Rechner wählt)                —                  6
davon für den Wächter unsichtbar                 107                  0
doppelt vergebene Ports                            0                  7
```

**Die 107 waren nie eine Frage.** Der Lauf gab seit E405 die Zeile
„374 von 481 Läufen halten einen festen Port" aus, und niemand hat gefragt,
was mit den übrigen ist. Eine Zahl, die eine Lücke NENNT, ersetzt keine
Prüfung, die sie schliesst.

### Die sieben, die niemand sah

```txt
8799: test31  + test130      9629: test429 + test519
8963: test205 + test243      9630: test430 + test520
9624: test424 + test514      9631: test437 + test521
9628: test428 + test518
```

Vier weitere hatte Bogen 1 am selben Tag von Hand gefunden (9530, 9531,
9625, 9626) — zusammen **elf** an einem Tag, in einem Bestand, über den ein
grüner Wächter wachte.

### Die Gegenproben

```txt
test514 zurück auf 9624 gesetzt   →  ✗ „9624: test424 + test514"
test514 auf `const HAFEN = 9645`  →  ✗ „Jeder Lauf … zeigt seinen Port — test514"
beides zurückgenommen             →  ✓ 4 von 4
```

Ein Wächter, der beide Male rot war, bevor er grün wurde (§50).

### Und zwei Fehlalarme beim Bauen, beide durch das Aufschreiben

```txt
1. Die Tabelle oben steht im Kopfkommentar von test400
   → gemeldet: „9624: test400 + test424"      Lösung: nurCode (§8, eine Stelle)
2. „listen(0)" steht in der Ausgabezeile des Laufs, in einer Schablone
   → gezählt: 7 × listen(0) statt 6           Lösung: erst fragen, OB es
                                              einen Server gibt, dann welche Zahl
```

Die zweite ist die lehrreichere: `nurCode` lässt Schablonen mit Absicht
stehen, weil in `${…}` echter Code steht. Dort hilft kein Entferner, sondern
nur die richtige Reihenfolge der Fragen.

---

## 20. September 2026 — Die zuletzt gelesene Seite, und ein Wächter, der ein Rennen gewann

**Methode.** Ein Haken auf `Store.setMeta`, der jeden Schreibvorgang auf
`dokSeite:*` mit Zeit, Wert und Aufrufweg festhält, im Ablauf von
`test424`.

```txt
Stelle                        meta   aktiv   scrollTop
────────────────────────────────────────────────────────
direkt nach dem Blättern         1     "1"           0
vor dem Zurück ins Regal         1     "1"          18
nach der Bildmatrix              1    null        null
nach dem letzten Öffnen          0     "0"           0   ← verloren
nach dem Neuladen                0     "0"           0
```

Genau **ein** Schreibvorgang, und sein Weg:

```txt
seiteMerken ⟵ nachziehen ⟵ beiGroesse
```

### Der Haken hat den Fehler beim zweiten Mal weggemessen

```txt
Durchgang 1   Haken mit Zeit + Wert + Stapel        ✗ 49/50, meta=0
Durchgang 2   Haken zusätzlich mit Buehnen-Geometrie ✓ 50/50, keine Schreibung
```

Dieselbe Datei, derselbe Rechner, ein paar Millisekunden mehr Arbeit im
Haken. **Das ist die eigentliche Messung dieses Bogens:** die Zusage hing
nicht am Code, sondern am Zufall. Deshalb prüft `test540` sie nicht mehr über
einen Umweg, sondern stellt das Rennen — `window.dispatchEvent(new
Event('resize'))` vor dem `requestAnimationFrame`.

### Nach der Reparatur

```txt
                                 ohne Sperre   mit Sperre
gemerkte Seite nach dem resize        0             1
aktive Bühne                         "0"           "1"
scrollTop                             0          1441
```

Die Gegenprobe lief über `if (false && !standGesetzt) return;` — die Sperre
ausgeschaltet, die Konstante aber weiter benutzt, damit `noUnusedLocals` den
Bau nicht abbricht (§52.6). Ergebnis: genau die drei Zeilen wieder rot, die
den Fehler beschreiben, und keine vierte.

---

## 20. September 2026 — Warum die untere Leiste springt, obwohl sie wandert

**Methode 1 · Redurs Aufnahme, Bild für Bild.** 1284 × 2778, 50 fps,
10,5 Sekunden. Ein waagerechter Streifen durch die Leiste, auf 122 Spalten
verkleinert, Helligkeitsschwerpunkt je Bild.

```txt
Wechsel              letztes Bild davor   erstes Bild danach   Abstand
────────────────────────────────────────────────────────────────────────
Dokumente → Heute     2,717 s  x = 127     2,733 s  x = 318     191 px
Heute → Lernen        4,333 s  x = 369     4,350 s  x = 578     209 px
Lernen → Termine      5,617 s  x = 602     5,633 s  x = 742     140 px
Termine → Mehr        7,083 s  x = 842     7,100 s  x = 1013    171 px
```

Viermal **ein einziges Bild** (16,7 ms) für 140 bis 209 Pixel.

**Methode 2 · dieselbe Fassung im Browser**, 390 × 844, Orte je
`requestAnimationFrame`:

```txt
17 → 37,5 → 53,5 → 64,2 → 71 → 75,3 → 78,1 → 79,9 → 81,2 → 81,9 → 82,4 → 82,6
```

16 bis 21 Zwischenorte. Die Bewegung ist also da — und **72 % des Weges
liegen in den ersten 50 ms.**

**Methode 3 · mit gedrosselter Rechenleistung** (`Emulation.setCPUThrottlingRate`):

```txt
Ziel          Drossel 1×   Drossel 4×   Drossel 8×
„Heute"         16 Orte       7 Orte       5 Orte
„Lernen"        17 Orte       9 Orte       5 Orte
„Termine"       17 Orte      17 Orte      17 Orte
„Mehr"          17 Orte      17 Orte      16 Orte
```

Nur die beiden schweren Bildschirme brechen ein. „Heute" und „Lernen" bauen
beim Wechsel einen ganzen Bildschirm neu auf.

### Die erste Vermutung war falsch, und das ist die Messung wert

```txt
mit Glasbrechung      Drossel 8×, „Heute"   5 Orte
ohne Glasbrechung     Drossel 8×, „Heute"   4 Orte
```

Der SVG-Filter war unschuldig. Schuld war `width` in der Übergangsliste:
eine Bewegung, die Layout animiert, bleibt auf dem Hauptfaden.

### Nachher

```txt
                              im ERSTEN Bild zurückgelegt
alte Kurve                            31 %
Feder (E646)                          11 %
```

Und im Film unter vierfacher Drosselung, Aufnahme mit 25 Bildern je Sekunde,
die Fläche für die Messung rot eingefärbt:

```txt
vorher   5 Orte, grösster Schritt 50 px
nachher  9 bis 10 Orte, grösster Schritt 14 bis 18 px
```

### Das Daumenkino

Die Bahn angehalten und an feste Zeitpunkte gesetzt (`animation.currentTime`),
damit das Bild die GEBAUTE Bewegung zeigt und nicht das, was der Aufnahme
gerade gelungen ist:

```txt
t =   0 ms   Fläche auf „Dokumente"
t =  30 ms   eben losgefahren
t =  60 ms   über „Heute", deutlich in die Länge gezogen
t =  90 ms   über „Lernen", noch gedehnt
t = 130 ms   fast am Ziel, wieder kompakt
t = 180 ms   steht
t = 230 ms   steht
```

**Und ein Befund daraus, den keine Zahl hatte:** bei einer Verschiebung von
24 war der Name UNTER der Linse nicht mehr zu lesen — „Dokume", „Lern",
„Termi" standen doppelt und verschmiert. Bei 12 (also ±6 px) bleibt er
lesbar. `recipes/dock-material-flow.md` verlangt genau das für die untere
Leiste: „labels/icons must remain legible throughout."

### Die Voraussetzung, die gemessen wird statt angenommen

```txt
Knopfbreiten bei 390 px Fenster:  [70, 70, 70, 70, 70]
```

Nur deshalb muss die Breite nicht animiert werden. `test541` §1 misst es mit.

---

## 20. September 2026 — Was in `LUECKEN.md` wirklich steht

**Methode.** Jede Überschrift der Form `## L<Nummer> · …` gelesen, als
geschlossen gezählt, wenn sie durchgestrichen ist oder „GESCHLOSSEN" trägt.
Dazu die Zeilennummer gegen den Beginn von „Anhang B · Was erledigt ist"
gehalten.

```txt
Lücken insgesamt                                      103
davon offen                                            53
davon geschlossen                                      50
offene, die UNTERHALB von „Anhang B" stehen            35
```

Die 35 stehen nicht IN den Tabellen des Anhangs, sondern dahinter: der
Anhang endet mit seiner letzten Tabelle, und alles Spätere wurde ans
Dateiende geschrieben. Wer von oben liest, hält sie für erledigt.

Seit heute steht dort eine Überschrift „Hier endet Anhang B" mit genau
diesen Zahlen. Umsortieren ist ein eigener Bogen; bis dahin ist eine
geschriebene Warnung besser als eine stille Falle (§35).

**Nebenbei:** die im Plan vom 19. September vermuteten doppelten Nummern
L117–L120 gibt es nicht. Gezählt sind null doppelte Nummern — `L8` und `L8b`
sind zwei verschiedene Einträge, und der Ausdruck, der sie als Doppelung
meldete, war zu grob (`^## L[0-9]+` trifft `L8` auch in `L8b`). Zum fünften
Mal an zwei Tagen ein Ausdruck, der etwas anderes misst, als der Satz
daneben behauptet.

## 20. September 2026 — Zwei rote Läufe, und beide waren achtundvierzig Stunden alt (E649)

Der erste volle Lauf gegen das neue `main`: **483 Läufe, 49 Stücke, drei rot.**

```txt
test270   im Arbeitsbaum rot, im Hauptbaum GRÜN
          .git ist dort eine Datei (52 Bytes), node_modules ein Symlink;
          test270 filtert mit `istOrdner && name === …` und sieht beide nicht.
          CLAUDE.md §30 beschreibt genau diesen Fall — er ist eingetreten.

test272   echt rot.  „Und alles dahinter ist stillgelegt"
test290   echt rot.  „Kein Präfix fehlt im Verzeichnis — bw"
```

**Keiner der beiden war im Lauf vom 19. September rot.** Die achtzehn von
damals sind alle abgearbeitet; diese zwei sind in den achtundvierzig Stunden
danach entstanden, in E639 (Glaslinse) und E640 (fliegende Werkzeugleiste).

### Was `test272` wirklich misst

```txt
fokus.ts, Schleife       if (!(kind instanceof HTMLElement)) return
test272, Behauptung      .every(k => (k as HTMLElement).inert)

document.body.children   vor E639   nur HTMLElement → beide Sätze gleich
                         nach E639  ein <svg> dazwischen → SVGElement
                                    .inert gibt es dort nicht → undefined
```

Gemessen, nicht geschätzt: **zwei** solche Halter hängen im Körper —
`ru-linse-halter` (E639, beim Start) und `ru-textur-halter` (E462, erst bei
Gebrauch). Der zweite war seit vier Wochen derselbe Fehler und fiel nie auf,
weil `Textur.sicherstellen()` im Prüflauf nicht lief.

### Was `bw` wirklich ist

```txt
.bw-flug      3   bausteine.css     seit E640
.bw-wartet    3   bausteine.css     seit E640
.bw-trenn     1   bausteine.css     seit E500
              ──
              7   Schwelle für einen eigenen Namensraum: 4
```

Und beim Eintragen fiel eine zweite Zahl um:

```txt
doku/CSS-NAMENSRAEUME.md, Fliesstext     „Es sind 144"
Einträge im Verzeichnis, gezählt          158
nach diesem Eintrag                       159
```

`test290` prüft die Einträge, nicht den Satz darüber. Die Zahl steht jetzt
mit ihrem Befehl daneben:

```bash
grep -cE "^[a-z]{2,4}\s+[0-9]+\s+[a-z]+\.css" doku/CSS-NAMENSRAEUME.md
```

### Nach der Reparatur

```txt
node pruefungen/alle.mts 272 290        beide grün  (272: 153 ok · 290: 13/13)
node pruefungen/alle.mts 128 435 539 541  alle vier grün
npm run typecheck                        ohne Befund
npm run stand                            v1234 unverändert (89f28ca703fd9a1f)
node bauen.mts                           10 514 KB
node bilder.mts heute handy              Linse über „Heute", Name lesbar
```

Die Gegenprobe war nicht zu bauen — sie war da: beide Läufe **waren** rot und
sind es nicht mehr. Ein Wächter, der nie rot war, ist eine Behauptung
(§55.2); diese zwei haben sich selbst belegt.

## 20. September 2026 — Die Auswahlleiste traf die falsche Stelle (E650)

Aus der Bestandsaufnahme desselben Tages; kein Prüflauf hatte es je angefasst.

### Der Fehler, gemessen

```txt
Block           "Test und Test"
markiert        das ZWEITE Wort
gedrückt        Fett

erwartet        Test und **Test**
bekommen        **Test** und Test
```

Dasselbe für kursiv, Code, durchgestrichen und den Link — alle sechs Marken
laufen durch `umschliesse`, der Link durch `linkSetzen`, beide mit
`String.replace(txt, …)`.

```txt
"a b a b a", das DRITTE „a" markiert
  bekommen    **a** b a b a
```

### Was richtig blieb

```txt
"Test und Test", das ERSTE markiert      ✓ richtig  (Zufall: erstes = erstes)
"Nur einmal hier", einmaliges Wort       ✓ richtig
"Anfang mitte ende", ganz vorn           ✓ richtig
```

Genau deshalb ist es neun Monate nicht aufgefallen: der Normalfall eines
kurzen Blocks mit einem einmaligen Wort war immer richtig.

### Nach der Reparatur

```txt
node pruefungen/lauf/test542.mts        10/10   (vorher 5/10)
node pruefungen/alle.mts 132 202        grün    Markdown-Kürzel, Lückenkarten
node pruefungen/alle.mts 105 109 400    grün
npm run typecheck                        ohne Befund
```

`test400` misst den Messstand gleich mit:

```txt
382 feste Ports · 9 × listen(0) · 390 von 484 Läufen starten einen Server
```

### Eine Messung, die zweimal rot war — und nur einmal richtig

Der erste Anlauf von `test542` war rot mit **„KEIN BLOCK"**. Grund:
`App.zeichneSeite(id)` allein lässt die Bibliothek stehen; erst
`App.oeffne(id)` schaltet auf den Editor. Der Lauf hätte dasselbe Rot
gezeigt, wenn der Fehler gar nicht existierte.

```txt
erster Anlauf    5/10 rot — davon 8× "KEIN BLOCK"   → misst nichts
zweiter Anlauf   5/10 rot — mit dem falschen Wert   → misst den Fehler
nach der Reparatur  10/10
```

Das ist der Unterschied zwischen einem roten Lauf und einem Beweis.

## 20. September 2026 — Ein Schalter, der Sicherheit verspricht (E651)

### Was `coll.verbindungen` wirklich war

```txt
geschrieben von   steuerung.ts:5186  das Menü selbst
angezeigt von     steuerung.ts:5070  die Anzahl in der Zeile darüber
gelesen als Erlaubnis   NIRGENDS
```

Der Spiegel hängt an `gespiegelt` und `spiegelQuelle`. Gemessen mit
`grep -rn "\.verbindungen\b" src/`: zwölf Treffer, davon zehn in der
Gedankenkarte (Kanten) und der Schale (Seitenverbindungen) — also etwas ganz
anderes. Für die Datenbank blieben genau die zwei oben.

### Der Beweis, gegen den alten Stand

```txt
Datenbank         gespiegelt, spiegelQuelle "github:a/b", verbindungen: []
Aktion            Spiegel.githubZurueck(zeile)
erwartet          kein Netzruf
gemessen          1 Ruf
```

Und die Anzeige:

```txt
Datenbank ohne das Feld, GitHub-Spiegel läuft
Menü zeigte       GitHub · aus
```

### Nach der Reparatur

```txt
node pruefungen/lauf/test543.mts          13/13   (vorher 5/13 und ein Absturz)
  Bestandsschutz ohne Feld                erlaubt
  verbindungen: []                        0 Rufe beim Schreiben
  verbindungen: []                        0 Rufe beim LESEN
  verbindungen: ['github']                1 Ruf, wie erwartet
node pruefungen/alle.mts 537 87 105 109 400   alle grün
npm run typecheck                          ohne Befund
```

`test537` bleibt grün: `steuerung.ts` und `spiegel/dienst.ts` liegen beide
unter `bereiche/datenbanken/` — derselbe Bereich, kein neuer Querverweis.

### Und ein Wächter, der zweimal etwas anderes mass

```txt
erster Lauf    rot, dann ABSTURZ ("Spiegel.darf is not a function")
               → Abschnitte 3–6 wurden nie gemessen
nach der Härtung  rot mit "1 Rufe" in Abschnitt 2 — der eigentliche Beweis
nach der Reparatur  13/13
```

Ein Wächter, der beim ersten fehlenden Namen abstürzt, prüft nur bis dorthin.
Dieselbe Lehre wie bei `test542` am selben Tag, nur eine Stufe früher.

## 20. September 2026 — Der Stopp-Knopf, den es nicht gab (E652)

### Die Kette war vollständig — bis auf ein Argument

```txt
frage(nachrichten, beiText, { signal })   dienst.ts:612   nimmt ein Signal
ollamaFragen(n, modell, signal)                   :507   reicht es weiter
fetch(…, { signal })                              :512   bis ganz nach unten
schlafen(ms, signal)                              :156   sogar der Backoff

senden → frage(nachrichten, cb)                  :1113   OHNE das dritte Argument
```

### Gemessen, gegen den alten Stand

`fetch` abgehängt und so gebaut, dass es **nie** antwortet — ausser das
Signal kommt an:

```txt
Signal in fetch angekommen       nein
data-lauf am Senden-Knopf        null
Klick auf den Knopf              HAENGT (3 s Abbruch der Messung)
```

Nach der Reparatur:

```txt
Signal in fetch angekommen       ja
data-lauf während des Laufs      "1"
aria-label während des Laufs     "Antwort abbrechen"
Klick beendet den Lauf           geworfen → gefangen → "Abgebrochen."
Knopfgrösse vorher/nachher       gleich (§37)
```

### Und der Wächter, der fast danebengriff

Abschnitt 2 war im ersten Anlauf **grün**, ohne dass etwas repariert war:

```txt
gezählt    sichtbare [data-qs] im ganzen Dokument     → 5 (die Leiste im Fuss)
gemeint    was der Menüpunkt NEU öffnet               → 0
```

Die Schalterleiste steht ohnehin im Panelfuss. Der Lauf mass sie statt des
Menüpunkts. Erst mit einem `Set` der Schalter **vor** dem Klick stand da
„0 Schalter sichtbar" — der eigentliche Befund.

Dritter Fall an einem Tag, nach `test542` (Absturz statt Messung) und
`test543` (Absturz nach dem ersten fehlenden Namen). Die Lehre wächst
mit: **ein roter Lauf ist noch kein Beweis, und ein grüner erst recht
nicht.**

### Bild

`bilder/ki-stoppknopf.png` — derselbe blaue Kreis, `■` statt `↑`, während
„KI arbeitet …" läuft (§55.3).

---

## 20. September 2026 — Das KI-Blatt am Telefon (E653, `test545`)

Gemessen auf 390 × 844, Blatt offen:

```txt
#ai                      oben bei 101 px, 743 px hoch, z-index 920
#handy-oben              z-index 401 — vollständig darunter
#btn-ai sichtbar         nein (display:none, bausteine.css:300 und :2119)
Knöpfe im Kopf           ai-verlauf, ai-clear
Knöpfe, die schliessen   0 von 2
```

Nicht geschätzt, sondern gedrückt: jeder sichtbare Knopf in `.ai-head`
wurde geklickt und danach nachgesehen, ob `.open` weg ist. Die Zeile, die
der Lauf gegen den alten Stand ausgab:

```txt
✗ Mindestens ein sichtbarer Knopf schliesst das Blatt wirklich
  — 2 geprüft, 0 schliessen — das Blatt ist eine Falle
```

Nach dem Bogen:

```txt
Knöpfe im Kopf           ai-verlauf, ai-clear, ai-zu
Knöpfe, die schliessen   1 von 3  ·  ai-zu · 44 × 44 px · "KI schliessen"
Zug 180 px nach unten    schliesst
Zug  26 px nach unten    schliesst NICHT (federt zurück)
Rest-transform danach    keines
Zug am Rechner (1280)    schliesst nichts — eine Spalte ist kein Blatt
```

### Und zweimal rot aus dem falschen Grund

```txt
1. Anlauf   Knopfmass 0 × 0          gemessen NACH dem Klick; geschlossen
                                     steht #ai auf display:none
2. Anlauf   "Geste gibt es nicht"    der Zug landete auf #rg-willkommen,
                                     dem Willkommensblatt über allem
```

Beide Male war der Lauf rot, beide Male sagte er etwas anderes, als er
mass. Er prüft jetzt mit `elementFromPoint`, wer unter dem Finger liegt,
und nennt ihn beim Namen, wenn es nicht das Blatt ist.

Vierter und fünfter Fall derselben Sorte an zwei Tagen, nach `test542`,
`test543` und `test544`. **Ein roter Lauf ist noch kein Beweis, und ein
grüner erst recht nicht.**

### Gegenprobe

`kiGriff()` im gebauten `schale.js` abgehängt, Lauf wiederholt: genau eine
Zeile wird rot („Ein Zug nach unten schliesst das Blatt"), während „Der Zug
landet wirklich auf dem Kopf des Blattes" grün bleibt. Die Röte gilt also
der Geste, nicht dem Zielen (§50, §55.2).

### Bild

`bilder/kiBlatt-handy-dunkel.png` — der Strich oben, das Kreuz rechts im
Kopf, 390 px breit (§55.3).

---

## 20. September 2026 — Was die KI darf, und was sie nie darf (E654, `test546`)

Der Katalog der Agentenwerkzeuge, vorher und nachher:

```txt
                       vorher                       nachher
Werkzeuge              12                           13
Rechte                 lesen · bearbeiten           lesen · bearbeiten · loeschen
mit Recht "loeschen"   []                           ["seiteLoeschen"]
```

Das Tor, sechs Fälle, jeder gefahren statt behauptet:

```txt
Nein gesagt                    Seite lebt · 1 Dialog
Ja gesagt                      alive=false, Block noch da (Papierkorb) · 1 Dialog
Knöpfe im Dialog               ["nein","ja"] — kein "für diesen Lauf"
fragenModus = "nie"            fragt trotzdem · 1 Dialog
zwei Löschungen                2 Dialoge
unbeaufsichtigt + darfAllein   0 Dialoge, 0 Löschungen
```

### Die Gegenprobe

Das Tor im gebauten `agenten.js` abgehängt (`if (false)`), Lauf wiederholt.
Was dann dastand, ist genau der Satz, den Redur verhindert haben wollte:

```txt
    Dialoge: 0 · Seite lebt: false
    Ergebnis: Seite „Weg damit" liegt im Papierkorb.
  ✗ Vor dem Löschen wird überhaupt gefragt — kein Dialog
  ✗ Nach einem Nein lebt die Seite weiter — die Seite ist weg, obwohl abgelehnt wurde
```

Abschnitt 6 blieb dabei grün — der Filter, der unbeaufsichtigten Läufen
Löschwerkzeuge gar nicht erst anbietet, greift unabhängig vom Tor. Zwei
Sperren für denselben Fall, und die Gegenprobe zeigt, dass es wirklich zwei
sind.

### Bild

`bilder/kiLoeschTor-rechner-hell.png` — die Seite beim Namen, 3 Blöcke
darunter, zwei Knöpfe, und der Fokus liegt auf „Nicht löschen" (§55.3).

---

## 20. September 2026 — Was die KI jetzt bauen kann (E655, `test547`)

Der Katalog wächst von 13 auf 16 Werkzeuge:

```txt
karteikartenAnlegen   bearbeiten   echte flashcard-Blöcke
pdfLesen              lesen        Wortlaut einer Seitenspanne aus `suchtext`
tabelleAnlegen        bearbeiten   table-Block mit `rows`
```

Gemessen, nicht behauptet:

```txt
Learning.cards()            1 → 4 · drei neue erkannt
Typ der neuen Blöcke        ["flashcard"]
splitCard der ersten        ["Wie lautet das ohmsche Gesetz?","U = R mal I"]

pdfLesen von 4 bis 5        enthält S4 und S5 · enthält NICHT S1 oder S6
pdfLesen ohne Spanne        316 Zeichen, S1 bis S6
pdfLesen, Dokument fehlt    „Kein Dokument gefunden, das „Gibt es nicht" heisst."

table-Block                 4 Zeilen × 3 Spalten
vom Editor gezeichnet       3 th, 9 td · erste Zelle „Querschnitt"
```

### Die Gegenprobe, und warum sie die wichtigste ist

`karteikartenAnlegen` im gebauten `agenten.js` auf `text` statt `flashcard`
umgestellt:

```txt
    Antwort: 3 Lernkarten … stehen ab sofort im Lernzentrum bereit.
    Learning.cards(): 1 → 1 · neu erkannt: 0
  ✗ Die Lernwelt zählt drei neue Karten — 0 statt 3
```

Das Werkzeug meldet weiterhin Erfolg. **Eine Erfolgsmeldung ist kein
Erfolg** — und ein Wächter, der nur zählt, ob Blöcke entstehen, hätte das
nicht gesehen. Er muss dort messen, wo das Ergebnis gebraucht wird.

### Bild

`bilder/kiTabelle-rechner-hell.png` — vier Spalten, Kopfzeile, und links
der lila Herkunftsstreifen aus E307: was die KI gebaut hat, sagt es von
selbst (§55.3).

---

## 20. September 2026 — Text ändern, ohne den alten Stand zu verlieren (E656, `test548`)

Der Katalog wächst von 16 auf 17 Werkzeuge. `textBearbeiten` ist das erste,
das bestehenden Text anfasst.

```txt
vorher   Der Leiter wird an die Klemme gefuehrt und dort gesichert.
nachher  Der Leiter wird auf die Reihenklemme aufgelegt und dort gesichert.

Fassungen          0 → 1
Anlass             "vor KI-Änderung"
alter Text darin   ja
autoVersionen      AUS — die Fassung kam trotzdem
Nachbarblock       unberührt
herkunft danach    "ki"
```

Und die drei Fälle, in denen NICHTS geschieht:

```txt
zweimal im selben Block   „steht 2-mal … (im selben Block)" · Text unverändert
in zwei Blöcken           „steht 2-mal … (in 2 Blöcken)"    · beide unverändert
gar nicht gefunden        „steht nicht auf dieser Seite"    · Text unverändert
```

### Zwei Gegenproben

```txt
Sicherungsfassung abgehängt
  ✗ Vor der Änderung wurde eine Fassung gesichert — 0 → 0
  ✗ Die Fassung heisst „vor KI-Änderung" — "KEINE FASSUNG"

Eindeutigkeitsprüfung abgehängt
  nachher: Die Leitung liegt. Das Kabel bleibt.
  ✗ In zwei Blöcken → nichts geändert — Kurz. | Ein Hinweis ohne Wiederholung.
```

Die zweite ist der Fehler aus **E650** wörtlich zurück, nur an einer anderen
Stelle des Programms: `String.replace` trifft das erste Vorkommen, nicht das
gemeinte. Zwei Bögen Abstand zwischen demselben Fehler an zwei Orten — das
ist der Grund, warum er hier von vornherein verhindert und nicht repariert
wurde.

### Bild

`bilder/kiTextTor-rechner-hell.png` — das Tor zeigt jetzt den Wortlaut
vorher und nachher statt „höchstens ein gespeichertes Objekt" (§55.3).

---

## 20. September 2026 — Die Lückenliste über sich selbst (E658, `test549`)

Gezählt mit `node pruefungen/lauf/test549.mts`, nicht geschätzt:

```txt
                              vorher        nachher
Einträge                      101           101
offen                         52            51
geschlossen                   49            50
offen UNTER „Anhang B"        33            0
fremde Schlusswörter          5             0
Datei nennt sich selbst       103/53/50     101/51/50   (gemessen: stimmt)
```

Der eine Wanderer zwischen „offen" und „geschlossen" ist `L157`: die
Überschrift sagte „GELANDET", was kein Wort dieser Datei ist.

### Das Verschieben, und wie es gegengeprüft wurde

```txt
Datei in Blöcke zerlegt                   109 Blöcke
Gegenprobe vor jeder Bewegung             Zusammensetzen ist byte-gleich
gewandert                                 33 Blöcke · 6816 Zeilen
Gegenprobe nach der Bewegung              jeder Block genau einmal
Zeilen vorher/nachher                     9566 → 9585 (+19 neue Überschrift)
```

### Und zweimal hat der Wächter zuerst sich selbst korrigiert

```txt
1. Anlauf   „offen" im TITEL von L181 als Status gelesen
2. Anlauf   „genannt 20/2026/103" — die ersten Zahlen waren das Datum
```

Beide Male war er rot und sagte das Falsche. Vierter und fünfter Fall nach
`test544`, `test545` und `test548`. **Eine Messung, die den Titel für den
Status hält, misst den Titel.**

Kein Bild: hier ist nichts zu sehen, hier ist zu zählen (§55.3).

---

## 20. September 2026 — Was die Doku über sich selbst behauptet (E659, `test550`)

Der Wächter wurde gegen den Stand rot, den **er selbst** erzeugt hatte:

```txt
gezählt: 492 Dateien unter pruefungen/lauf/
§30 „Heute sind es N Läufe":     491
§30 Befehlsblock „alle N Läufe": 491
§31 „Von N Läufen":              491
ENTSCHEIDUNGEN.md nennt sich     636   ·  gezählt 638
```

`test550.mts` ist die 492. Datei — die Drift, die §30 seit einem Jahr
beklagt, im Abstand von Minuten und diesmal mit Beleg.

### Vier Anläufe, vier erfundene Zahlen

`ENTSCHEIDUNGEN.md` kennt drei Überschriftsformen für dieselbe Sache. Was
die Messung nacheinander meldete, bevor sie stimmte:

```txt
nur `## E123`                     351 Einträge ohne Text
+ Banner zwischen zwei ===        253
+ Titel mit === darunter          203
+ Titel über zwei Zeilen            0   ← die Datei war immer in Ordnung
```

Die Regel, die hält, setzt **keine Form voraus**: eine Zeile, die mit der
Nummer beginnt und ein Trennzeichen trägt, ist eine Überschrift. Alles
andere ist eine Erwähnung.

### Und zwei „Funde", die beim Lesen verschwanden

```txt
E198/E199/E222/E269 zitiert, ohne Eintrag   → steht seit langem in Zeile 35
ENTSCHEIDUNGEN.md Index ≠ Text              → 638 von 638, stimmt
```

Deshalb prüft der Lauf nicht, ob es Lücken GIBT (die darf es), sondern ob
jede Lücke oben GENANNT ist.

### Gegenprobe

Eine der drei Zahlen in CLAUDE.md auf 480 gesetzt: genau diese eine Zeile
wird rot, die beiden anderen bleiben grün. Drei Stellen, drei Messungen.

Kein Bild: hier ist zu zählen, nicht zu sehen (§55.3).

---

## 20. September 2026 — Tabellenwerkzeuge am Telefon (E660, `test551`)

Gemessen auf 390 × 844 mit echtem Touch (`hasTouch`, sonst greift
`@media(hover:none)` nicht):

```txt
                        vorher      nachher
.stab-tools button      7 × 26 px   7 × 44 px
.stab-griff.x/.y        7 px        7 px  (der Rechnerweg, unverändert)
am Rechner (1280 px)    26 px       26 px  (bleibt schlank — geprüft)
```

Die Knöpfe tun dabei weiterhin, was sie sagen:

```txt
Spalte +   [3,3,3] → [4,4,4]     in JEDER Zeile
Zeile +    3 → 4 Zeilen
Inhalt     „Querschnitt" / „1,5 mm²" unverändert
```

### Der Fund über dem Fund

`test402` hält §37 seit langem und hat diese sieben Knöpfe **nie gesehen**:

```js
const h = body.match(/(?<!max-)(?:min-)?height\s*:\s*(\d+)px/);
```

Er sucht nach `height`/`min-height` im Stilblatt. Die 26 px kamen aus
`font-size:12px` und `padding:3px 9px` — nirgends stand eine Höhe. Deshalb
stand die Regel auch nicht in `masse-bestand.json`: nie gesehen, nie
eingetragen. Steht als **L206**.

### Und was ich zuerst falsch gebaut hätte

Der erste Wächter suchte nach `.stab-daumen` — einer Werkzeugzeile, die ich
für den Daumen bauen wollte. `.stab-tools` gibt es seit langem, und **L108
hat sie am Telefon schon sichtbar gemacht**. Der fertige Wächter wurde
weggeworfen und neu geschrieben; das ist billiger als die zweite Zeile
(§8, §45 Schritt 1).

---

## 20. September 2026 — Groqs 404 (E661, `test552`)

Redurs Meldung, wörtlich, und was daran falsch war:

```txt
Groq antwortet mit 404. Die Adresse gibt es nicht (object_not_found).
{"error":{"message":"The model `llama-3.3-70b-versatile` does not exist …",
 "code":"model_not_found"}}
```

Die Adresse war in Ordnung — Groq hat sie beantwortet. Das Modell war weg,
und der Anbieter sagte es wörtlich.

```txt
                          vorher                    nachher
führender Satz            Statustabelle (falsch)    der Satz des Anbieters
Hinweis, was zu tun ist   keiner                    „wähle ein anderes Modell"
404 ohne Körper           Statustabelle             Statustabelle (unverändert)
Modellliste               fest im Programm          /models beim Anbieter
Rückfall ohne Netz        —                         die eingebaute Liste
gefiltert                 —                         whisper/tts/embed/guard
```

Gemessen mit abgehängtem `fetch` und genau Groqs Körper:

```txt
gerufen   https://api.groq.com/openai/v1/models
zurück    ["llama-neu-70b","llama-neu-8b"]   (whisper-gross-v3 gefiltert)
Netzfehler → geworfen: false, Menü nimmt die eingebaute Liste
```

### Zwei Gegenproben — und die erste war falsch

```txt
1. Versuch   const modellWeg = false && A || B     → blieb GRÜN
```

`&&` bindet stärker als `||`, also blieb `B` übrig und der Zweig lief
weiter. Der grüne Lauf sah kurz nach einem zu schwachen Wächter aus. **Eine
Gegenprobe ist ein Stück Code wie jedes andere und kann genauso falsch
sein.**

Richtig gefahren:

```txt
`if (modellWeg)` → `if (false)`     ✗ sagt nicht, was zu tun ist
alter Wurf zurück                    ✗ „Die Adresse gibt es nicht"
```

Kein Bild: hier ist ein Satz zu lesen, keine Fläche zu sehen (§55.3).

---

## 20. September 2026 — Der erste Ernstfall des Sweep-Werkzeugs (E662, `test553`)

Zwei Stunden nach seinem Bau meldete `volllauf.mts`:

```txt
→ ROT: 266 267 268 270 272 273 274 275 276 277
```

Im Protokoll darüber:

```txt
✗ 1 von 10 Läufen gescheitert:
    test270
```

Zehn gemeldet, einer war es. Die Zerlegung suchte je ZEILE nach ✗ **und**
Nummer; die Bilanz steht auf zwei Zeilen, und keine trägt beides.

```txt
                        vorher              nachher
echte Bilanz            [266 … 277]         [270]
drei Rote               [266 … 277]         [266,270,277]
Lauf meldet sich selbst gefunden            gefunden
Ausgabe schweigt        ganzes Stück        ganzes Stück (unverändert)
fremder Name (test100)  test100 wäre rot    ganzes Stück, kein fremder Lauf
```

Der Rückfall auf „ganzes Stück" ist Absicht und bleibt: lieber neun zu viel
als einer zu wenig, und keiner erfunden (§56). Falsch war nur, ihn so leicht
auszulösen.

### Gegenprobe

Die alte Ein-Zeilen-Regel eingesetzt → genau das beobachtete Symptom,
`[266 … 277]` statt `[270]`.

### Der eine echte rote Lauf

`test270` mit `✗ In der Wurzel geht nichts ins Netz … [".git","node_modules"]`
— wörtlich das Artefakt, das §30 beschreibt (im Arbeitsbaum ist `.git` eine
Datei und `node_modules` ein Symlink). **Nachzumessen im Hauptbaum**, sobald
der Sweep durch ist; vorher wird daran nichts repariert.

---

## 20. September 2026 — Die Wochenrückschau zählte nie (E663, `test554`)

```txt
                            vorher      nachher
erledigtAm nach dem Haken   null        gesetzt
in der Rückschau            nein        ja
heute im Tagesdiagramm      0           1
Haken zurück → erledigtAm   —           null, nicht mehr gezählt
Altbestand (ohne Datum)     unsichtbar  über `edited` gezählt
```

Wer `erledigtAm` schrieb, vorher: **niemand** für Blöcke. Einziger Schreiber
im ganzen Programm war der ICS-Import (`kalender.ts:211`).

`checked` wird an **sechs** Stellen geschrieben — Kästchen, Tastenkürzel,
Markdown-Kürzel, Befehlspalette, Schnittstelle, PWA. Deshalb sitzt der
Stempel in `Store.updateBlock`, wo alle sechs durchgehen.

### Zwei Gegenproben

```txt
Stempel abgehängt   erledigtAm bleibt null — die Rückschau zählt dann nur
                    noch ungefähr, über `edited`
Rückfall abgehängt  Altbestand wieder unsichtbar
```

---

## 20. September 2026 — Ein zu kleines Fenster (E664, `test403`)

Der volle Lauf meldete:

```txt
✗ Beide stehen in einem finally — [false,true]
```

Der Code war richtig. Der Wächter sah **zwei Zeilen** zurück:

```js
const davor = alle.slice(Math.max(0, i - 2), i + 1).join(' ');
```

E652 hatte zwei Zeilen in dasselbe `finally` geschoben — `zustand.abbruch`
und `sendenKnopf(false)`. Damit rutschte das `remove` auf Position 3.

```txt
finally {            ← Zeile i-3, ausserhalb des Fensters
  zustand.abbruch = null;
  sendenKnopf(false);
  ziel.classList.remove('ki-schreibt');   ← Zeile i
```

Jetzt wird der Blockkopf gesucht, Klammern zählend nach oben. Gegenprobe:
ein `remove` aus seinem `finally` geholt → wieder `[false,true]`.

Dieselbe Redewendung kommt in keinem der übrigen 495 Läufe vor — gesucht,
nicht angenommen.

---

## 20. September 2026 — Was das Bereichs-Verzeichnis nicht sieht (E665, L207)

Der erste volle Lauf seit E626 machte `test537` rot: **518 gegen 517**, bei
unverändert 125 Paaren. Welche zwei Treffer dazugekommen waren:

```txt
MEHR  bereiche/einstellungen | KI            | bereiche/ki             15 → 16
MEHR  bereiche/ki            | Einstellungen | bereiche/einstellungen   1 → 2
```

Der erste war meiner (E661: zwei Griffe statt eines) und ist mit E665 weg —
519 → 518.

Der zweite ist **kein neuer Aufruf**. `Einstellungen.oeffne('schluessel')`
steht seit E500 im KI-Fenster. Dieselbe Datei, durch denselben Filter:

```txt
                      roh   nach ohneSchablonen
Fassung von E626       2            1
heute                  2            2
```

Er war für den Wächter unsichtbar, weil `ohneSchablonen` ihn für Text in
einer Schablone hielt.

### Wie viel sonst noch unsichtbar ist

Über alle 86 Dateien in `src/bereiche/`:

```txt
Aufrufe nach nurCode:              7907
davon nach ohneSchablonen:         7641
verdeckt:                           266   (3,4 %)

  136  editor/ansicht/editor.ts       (457 → 321)
   30  wissen/werkzeuge.ts            (471 → 441)
   26  einstellungen/ansicht/seite.ts (215 → 189)
   21  datenbanken/steuerung.ts      (1119 → 1098)
```

**Die 517 sind ein Mindestwert, kein Stand.** `${Datenbank.name(x)}` in
einer Schablone ist ein Aufruf, kein Text.

Das Verzeichnis wurde NICHT angehoben. Die drei Wege und ihre Kosten stehen
als **L207**; §5 sagt selbst, dass die Richtung Redur gehört. Bis dahin
bleibt `test537` rot und `main` steht (§46) — eine rote Zahl, die auf eine
Entscheidung wartet, ist besser als eine grüne, die nicht stimmt.

---

## 20. September 2026 — „Erinnerung" war eine Zeichenkette (E666, `test555`)

```txt
                                vorher                  nachher
Registereintrag a-remind        nur Name + Aktion       + tun + zeigen
Slash „Erinnerung"              schreibt „@remind "     öffnet den Dialog
Text des Blocks danach          „@remind "              „"
Erinnerungen in der Liste       0                       1
Querverweise (test537)          518                     518  ← unverändert
```

Die letzte Zeile ist der Punkt: der Draht liegt im **Register** (§5 dritter
Weg) und nicht im Editor. `bereiche/editor → Werkzeuge` steht bei 1 und darf
nicht wachsen; `Register` ist kein Bereich.

Nirgends im Programm wurde `@remind` gelesen — gesucht, nicht angenommen.
Die Maschine dahinter (`Werkzeuge.erinnerungSetzen`, Liste, Geräte-Meldung,
Weckruf am Server) stand seit E54 vollständig da.

### Gegenprobe

`tun` umbenannt → genau die drei Zusagen werden rot, die an der Handlung
hängen; „den Eintrag gibt es" bleibt grün.

### Und zwei Zusagen waren im ersten Anlauf grün, weil nichts lief

```txt
!String(undefined).includes('@remind')   → true
undefined === undefined                  → true
```

Beide prüfen jetzt zuerst, ob der Schritt überhaupt stattgefunden hat.
Vierter Fall nach `test544`, `test549` und `test550`.

### Was der Lauf nicht beweist

Dass `zeigen()` bei fehlendem Modul „nein" sagt. `Werkzeuge` hängt nicht am
Fenster (E207) und lässt sich von aussen nicht verstecken. Gemessen ist nur,
dass es nicht wirft — der Rest hält am `try/catch`. Steht so im Lauf.

---

## Voller Prüflauf auf `09ac7f8` — 21. September 2026

Der erste volle Lauf seit `74bde43` (20. September, 17:56). Gefahren im
eigenen Arbeitsbaum mit `node pruefungen/volllauf.mts --neu`, während im
Hauptbaum **kein** Prüflauf lief (§30).

```txt
Läufe      501
grün       491
ROT         10   210 270 290 362 410 437 440 523 524 537
gelaufen   112 min
```

### Im Hauptbaum nachgemessen: acht statt zehn

§30 verlangt genau das, und es hat sich wieder gelohnt:

| Lauf | im Arbeitsbaum | im Hauptbaum |
|---|---|---|
| `test270` | rot | **grün** — `.git` ist dort eine Datei, `node_modules` ein Symlink |
| `test440` | rot | **grün** — dieselbe Ursache |
| die anderen acht | rot | rot |

Zwei von zehn waren Artefakte der Messumgebung. Wer sie ohne Nachmessung
„repariert" hätte, hätte am Produkt etwas geändert, das nichts hatte.

### Und sieben der acht waren meine eigenen letzten drei Bögen

| Lauf | was er hielt | Ursache |
|---|---|---|
| `test210` | 17 Knöpfe statt 16 | neues Werkzeug (E670) |
| `test523` | 14 Werkzeuge statt 13 — und `textfix` fehlte in der DOM-Folge | **echter Fund**, siehe unten |
| `test437` | 14 Zeichenwerkzeuge statt 13 | neues Werkzeug |
| `test290` | Präfix `wo` nicht im Verzeichnis | `.wo-zeilenknopf` (E669) |
| `test362` | `56` zum fünfzehnten Mal roh im CSS | `min-width:56px` (E667) |
| `test410` | „tote Deklaration" in der Einzeldatei | **Messfehler**, siehe unten |
| `test537` | 519 statt 517 Treffer | ein zweiter Speicher (E670), jetzt weg |

**Der echte Fund steckte in `test523`.** Die Blatt-Werkzeugleiste wird von
Hand aufgezählt (`button('text') + button('zeichen') + …`), das Studio-Band
daneben baut sie aus dem Katalog. Also hatte „Text ändern" im Studio einen
Knopf und auf dem Blatt keinen — zwei Tage lang, und gesehen hat es kein
Mensch, sondern ein Lauf, der die Ordnung gegen den Katalog abgleicht.

**Der Messfehler steckte in `test410`.** Sein Ausdruck
`/<style[^>]*>([\s\S]*?)<\/style>/g` fing das `<style>` aus einem
**Kommentar** ein — die Sanitizer-Doku zählt die verbotenen Tags auf — und
schluckte von dort **5,3 MB** bis zum nächsten `</style>`. Aufgefallen ist
es erst, als in der Chronik ein deutscher Satz stand, der wie CSS aussieht:
„Die 26 px entstehen aus `font-size:12px` und `padding:3px 9px`" (P97).
Mit `^` und `m` sind es 21 echte Blöcke statt 25.

### Danach

```txt
node pruefungen/alle.mts 210 270 290 362 410 437 440 523 537
✗ 1 von 9 Läufen gescheitert: test537
```

`test537` bleibt bei **518 gegen 517** — genau dem Stand vor diesen drei
Bögen. Das ist **L207**, und die Richtung gehört Redur.

## 25. September 2026 — Strg+Z nimmt zweimal zurück (Plattform-Audit, L212)

Zwei Sonden im Scratchpad, Chromium über `file://…/index.html`, Fenster
1280 × 900, Aufbau wie `test238` (Schaltplan) und `test345` (Blatt). Keine
Prüfläufe des Bestands; der Wächter daraus heisst test568.

**Schaltplan:** zwei Teile, ein drittes über die Palette gesetzt, 800 ms
gewartet (Zaun des Seitenverlaufs: 700 ms), Fokus `.sp-wrap`, Strg+Z.

```txt
                 domTeile  storeTeile  blockId      Element   Toast
Ausgang               2         2      b04888d1…   alt       —
Teil gesetzt          3         3      b04888d1…   alt       —
nach Strg+Z           3         3      eb6edc4f…   NEU       „Rückgängig"
zweites Teil          4         4      eb6edc4f…   alt2      —
nach ↶-Knopf          3         3      eb6edc4f…   alt2      kein neuer
```

**Blatt:** Stift, zwei Striche 800 ms auseinander, Strg+Z auf `.blatt-marken`.

```txt
                 domMarken  alter Block lebt  blockId      Element   Toast
zwei Striche          2         ja            ff683223…   alt       —
nach Strg+Z           1         NEIN          24ba45cf…   NEU       „Rückgängig"
```

Lesart: der Block nimmt seinen Schritt zurück UND die Schale den
Seitenverlauf (`schale.ts:3252` → `Verlauf.zurueck()`, kein Blick auf
`defaultPrevented`); `Verlauf.anwenden` purgt die Kinder und setzt sie mit
frischen Kennungen wieder ein (`indexdb.ts:2508`). Welcher Stand am Ende
steht, hängt am 700-ms-Zaun — im Schaltplan blieb das gesetzte Teil, auf dem
Blatt ging ein Strich. Ausgabe wörtlich in `doku/REDION-PLATTFORM-AUDIT.md`
2.4.

## 25. September 2026 — Überlebt ein Bild ein Strg+Z auf einer Textseite? (Bogen 2, L212 Punkt 2)

Sonde im Scratchpad, Chromium über `file://`, 1280 × 900. Eine Seite mit
einem Textblock und einem `image`-Block, dessen Datei (4096 Bytes,
`probe.png`) über `Dateien.ablegen(blob, { blockId })` in der Ablage liegt;
zwei Textänderungen 800 ms auseinander, Strg+Z ohne fokussierten Block,
dann 2,5 s warten, dann neu laden.

```txt
                       Bild-Block   dateiId gleich  Dateisatz  satz.blockId     Bytes  verwaist
Ausgang                c884b9db…    —               da         = Bild-Block     4096   nein
gleich nach Strg+Z     782d93c4…    ja              da         = NEUER Block    4096   nein
2,5 s später           782d93c4…    ja              da         = NEUER Block    4096   nein
nach Neuladen          782d93c4…    ja              da         = NEUER Block    4096   nein
```

Lesart: **das Bild überlebt.** Der Block bekommt eine neue Kennung, aber
der Dateisatz wird auf den neuen Block umgehängt und die Bytes bleiben —
der Anspruch (`dateiAnspruch`) greift, bevor der Purge die Datei löst. Was
bleibt, ist die Kennung selbst (und mit ihr Grabsteine und Neuanlagen für
den Abgleich, Verweise von aussen) — siehe die zweite Sonde darunter.

## 25. September 2026 — Und eine Unterseite? Kennung weg, Fassungen weg, Favorit tot (Bogen 2, L212 Punkt 2)

Dieselbe Sonde mit einer UNTERSEITE als Kind der Seite: eigener Text, eine
geplante Fassung (`Store.versionSpeichern(kind.id, 'geplant')`), ein
Favorit (`meta.favoriten = [kind.id]`). Zwei Textänderungen an der
Elternseite, Strg+Z, 2,5 s warten.

```txt
                       Unterseite   alte lebt  Fassungen (alt / neu)  Favorit zeigt auf   Inhalt
Ausgang                a8da9eea…    ja         1 / —                  die Unterseite      da
nach Strg+Z (2,5 s)    a7ecec08…    NEIN       0 / 0                  die ALTE Kennung    da
```

Lesart: der Text der Unterseite überlebt, sonst nichts — **die Fassung ist
gelöscht** (`purgeAnhaenge` räumt `versions` je gepurgtem Block, und eine
Unterseite ist ein Kind der Seite), die Kennung ist neu, und jeder Verweis
von aussen (Favorit, Link, „zuletzt geöffnet", Erwähnung) zeigt auf einen
Block, den es nicht mehr gibt. Ein Strg+Z auf der Elternseite löscht also
den Verlauf der Unterseite. Das ist §15 in seiner einfachsten Form
verletzt, und es ist der Grund, warum Bogen 2 vor `raumVersion` kommt.

### Nachgemessen nach E684 (dieselben zwei Sonden)

```txt
                       Unterseite   alte lebt  Fassungen (alt / neu)  Favorit zeigt auf   Inhalt
nach Strg+Z (2,5 s)    1d18fc4d…    JA         1 / 1                  die Unterseite      da
                       (dieselbe Kennung wie vor dem Strg+Z)

                       Bild-Block   Dateisatz  satz.blockId       Bytes  verwaist
nach Strg+Z + Neuladen gleich       da         = derselbe Block   4096   nein
```

Die Zeile, um die es ging — „Fassungen 1 / 0" — heisst jetzt „1 / 1".

---

## §62 · Die Startnutzlast, neun Tage später — woher die 127 KB kamen (E688, 25. September 2026)

`test388 §5` war wieder rot: **2711 KB über 238 Dateien**, Decke 2700.
Gefunden als Nachbar von Bogen 4 (E687), nicht durch Hinsehen — derselbe
Fehler wie in §51, nur neun statt zwölf Tage lang. Bogen 4 selbst bringt
2 KB (`core/gfx/history.js`); vor ihm stand die Zahl bei 2709.

**Am laufenden Programm gemessen** (`node pruefungen/lauf/test388.mts`):

```txt
16. September   232 Dateien   2585 KB     Decke damals gesetzt: 2700
25. September   238 Dateien   2711 KB     ← rot, 11 KB drüber
```

**Die Aufteilung der 127 KB** (gzip Stufe 6 über alle `<script src>` und
`<link rel=stylesheet>` aus `index.html`, gegen `bef8c3f`, den Commit von
E613; Werkzeug: `startlast.cjs` im Arbeitsverzeichnis der Sitzung, nicht im
Repo — es ist eine Rechnung, keine Prüfung):

```txt
6 NEUE Dateien          ~41 KB
gewachsene Dateien      ~86 KB
```

Die neun grössten Posten:

```txt
gewachsen  quell/bereiche/pdf/marken.js               +18,9 KB   Zeichenstudio (E673–E676)
gewachsen  quell/schale/stil/bausteine.css            +12,3 KB
neu        quell/bereiche/wissen/nin-quiz.js           12,2 KB   Lerninhalt (E679)
neu        quell/bereiche/wissen/trainer.js             8,9 KB   Trainer (E677)
gewachsen  quell/bereiche/bloecke/arten/gedankenkarte.js +7,7 KB  Griffe, Formen, Vorlagen (E628)
neu        quell/bereiche/wissen/staatskunde-inhalt.js  7,3 KB   Lerninhalt (E677)
gewachsen  quell/bereiche/ki/agenten.js                +6,6 KB
neu        quell/schale/bedienung/selection-flow.js     6,5 KB   Dock-Welle (E646)
neu        quell/schale/bedienung/linse.js              4,5 KB
```

Alles Übrige: rund 200 Dateien um je weniger als 4 KB.

**Urteil.** Wieder das Produkt, keine Bibliothek — aber zwei Posten sind
Inhalt, kein Code: `nin-quiz.js` und `staatskunde-inhalt.js`, zusammen
19,5 KB, Lernstoff, den nur sieht, wer den Trainer öffnet. Das ist der Fall
der Chronik aus E613. Sie stehen als **L216** offen; nachladen würde sie
gerade unter die alte Decke bringen (2711 − 19,5 = 2692) und beim nächsten
Bogen wäre sie wieder gerissen — deshalb steigt die Decke trotzdem.

**Die Decke steht seit E688 auf 2850**: 139 KB Luft, so viel wie neun Tage
Arbeit zuletzt gebraucht haben; 387 KB unter dem Punkt, an dem pdf.js
unbemerkt zurückkäme (2711 + 526 = 3237). Nach der Änderung:
`test388` 19/19.

---

## §63 · Die Werkzeugleiste des Whiteboards, vorher und nachher (E689, 26. September 2026)

Gemessen im Browser mit Playwright (`.wb` auf einer gewöhnlichen Seite,
gerenderte Boxen, nicht Stilblatt-Text — L206):

```txt
                        VORHER (HTML-String)      NACHHER (GfxToolbar)
Rechner 1300 px
  Kasten `.wb`          708 px                    708 px
  Leiste                706 × 67 px, 3 Zeilen     706 × 54 px, 1 Zeile
  Kapsel                — (keine)                 38 px hoch
  Knöpfe                27, je 28 × 26 px          19, je 30 × 30 px
  Farben                8 Tupfer à 17 × 17 px      im Untermenü, 28 px + 8 px Fläche
  Platzbedarf           —                         698 px bei 706 px (8 px Luft)

Telefon 390 px
  Kasten `.wb`          334 px                    334 px
  Leiste                95 px, 4 Zeilen           70 px, 1 Zeile (rollt)
  Knöpfe                28 × 26 px                44 × 44 px  (§37)
  Inhalt / Sichtfenster  —                        980 px in 332 px
```

**Die 44 px sind neu und echt.** Vorher lagen sie in einem `::after`, das
niemand sieht und `test402` nicht messen kann (L206); der Knopf selbst mass
26 px. Am Telefon ist jetzt der KNOPF 44 px, am Rechner bleibt er 30 px mit
44 px Trefffläche darunter — und der Grund steht über der Regel, wie §37 es
verlangt.

**Startnutzlast nach dem Bogen:** 2780 KB über 241 Dateien (gzip Stufe 6),
Decke 2850 seit E688. Die zwei neuen Dateien kosten zusammen rund 5 KB.

**Untere Leiste am Telefon:** Leiste 796…866, `#handy-oben` 775…835 — sie
überdecken sich im Ruhezustand um 39 px (L217).

---

## §64 · Die drei Ansichten einer Seite (E690, 26. September 2026)

Gemessen mit `node bilder.mts ansichtSeite|ansichtFlaeche|ansichtRedion` und
`playwright` am gerenderten Kasten, nicht im Stilblatt (L206).

**Was in welcher Ansicht steht** (dieselbe Seite, nur der Schalter bewegt):

```txt
                        Seite      Fläche     Redion
Cover                   nein       nein       ja
Symbol + Titel          ja         im Kasten  ja
Werkzeugzeile .pg-tools nein       nein       ja
Punktraster             nein       ja         nein
Text im Speicher        gleich     gleich     gleich   (test573 §7)
```

**Der Umschalter**, Rechner 1300 × 950 und Telefon 390 × 844:

```txt
                        Rechner              Telefon
Knöpfe                  3                    3
je Knopf                ~96 × 44 px          ~96 × 44 px   (§37 hart)
ausserhalb des Bildes   0                    0
gedrückt zugleich       genau 1 (aria-checked)
```

**Die Fläche, und was das Hinsehen daran gefunden hat.** Drei Zahlen, jede
vorher/nachher, alle am Telefon 390 × 844:

```txt
                              ERSTER STAND        NACH DEM BILD
Höhe der Fläche               332 px              584 px
Breite der Fläche             278 px (in 390)     390 px
„ins Bild holen"              31 %                98 %
Werkzeugleiste                auf dem Kasten      am unteren Rand
```

- **332 statt 584:** `#page{height:100%}` hat nichts zu messen, solange
  `#scroll` nur `flex:1` ist — die Prozentzahl fiel auf `auto` zurück, übrig
  blieb die `min-height` der Fläche. Als Spalte (`display:flex`) wächst das
  Kind ohne Prozentzahl.
- **278 statt 390:** `#page` trägt `margin:0 auto`, und ein Flex-Element mit
  automatischen Rändern auf der Querachse wird NICHT gedehnt. 56 px Luft auf
  jeder Seite, und die Leinwand endete mitten im Bild.
- **31 % statt 98 %:** mit fester Kastenbreite 760 ist auf einem 390 px
  breiten Gerät jede Rechnung richtig und jedes Ergebnis unlesbar. Die
  VORGABE richtet sich jetzt nach dem Fenster (`min(760, Fenster − 40)`);
  eine GESPEICHERTE Breite nicht — die gehört dem Dokument.

**Und eine Zahl, die vorher falsch war** (`pruefungen/marken-decke.json`):
28 px stand auf 64 und ist 65, 46 px stand auf 15 und ist 14. Beide Deltas
stammen aus E689 (`.gfx-tb-farben button` 28 × 28, `.wb-massstab` 46 → 40) —
`test362` stand seit dem 26. September früh rot, und gemerkt hat es erst der
Nachbarlauf dieses Bogens. Eine Decke, die nicht nachgezogen wird, ist eine
Zahl.

---

## §65 · Der Vollausbau der Fläche (E691, 26. September 2026)

Gemessen mit `test574` (50 Zusagen) und `node bilder.mts flaecheBloecke |
flaecheVersteckt | flaecheLeer`.

**Was ein Block trägt, und wie oft er es trägt:**

```txt
                        frisch      auf der Fläche   ausgeblendet
flaecheOrt              fehlt       {x,y,w,rv:1}     {x,y,w,rv:1}
sichtbarIn              fehlt       fehlt            'flaeche'
im Seitenkasten         ja          nein             nein
in der Textansicht      ja          ja               NEIN
in `content` der Seite  ja          ja               ja
alive                   true        true             true
```

**Das Verschieben rechnet in Flächeneinheiten** — gemessen bei 51 %
Massstab, nicht bei 100 %: bei 1 sähe ein Umrechnungsfehler genauso aus wie
keiner (derselbe Grund wie E686).

```txt
Bildschirm        Fläche (gemessen)     erwartet 1/z
120 px in x       235                   235,3
60 px in y        118                   117,6
```

**„Ins Bild holen", vorher und nachher** (Rechner 1400 × 950, drei Kästen,
einer davon bei x = 1400):

```txt
                        ERSTER STAND        NACH DEM BILD
gerechnet über          nur Seitenkasten    alle Kästen
Massstab                100 %               90 %
Kästen im Bild          1 von 3             3 von 3
```

**Am Telefon (390 × 844):**

```txt
Griff `⋮⋮` am Block         display:none  (ki.css:182)
Weg auf die Fläche          Hebe-Geste (E83) → Blockmenü → „Auf die Fläche legen"
Menüknopf des Kastens       44 × 44 px im Aufbau, 43 × 43 gerendert bei 98 %
neuer Kasten liegt          unter dem Seitenkasten, nicht rechts daneben
```

Die zwei Masse sind nicht dasselbe, und das ist kein Mangel: auf einer
Leinwand hängt ALLES am `transform: scale(z)`. Bei 50 % ist auch der Text
halb so gross. Gemessen wird deshalb die Layout-Box; die gerenderte steht
zum Vergleich daneben.

**Und zwei Zahlen aus dem Prüfstand selbst:** zweimal war `test574` aus dem
falschen Grund rot — einmal, weil er `contextmenu` schickte, das unter
760 px ausdrücklich unterdrückt wird (E83), und einmal, weil er 400 ms nach
dem Loslassen tippte, während der Fänger aus E83 die Klick-Nachzügler noch
800 ms schluckt. Beide Male sah es aus wie ein Fehler im Produkt.

---

## §66 · L220 geschlossen (E692, 26. September 2026)

Gemessen mit `test574 §10–§12`, je gegen den Stand vor der Reparatur.

```txt
                                    VORHER              NACHHER
Rücktaste, Vorgänger versteckt
  Fokus danach                      in keinem Block     im sichtbaren Vorgänger
  gelöschter Block                  weg                 weg
  versteckter Nachbar               lebt                lebt

Strg+Umschalt+↓, Nachbar versteckt
  Bildschirm nach EINEM Druck       A, C  (nichts)      C, A
  Daten                             unverändert         A hinter C
  versteckter Block                 bleibt              bleibt

Nummernliste
  am Block gespeichert              nr = 1, 2, 3        kein Feld
  auf dem Bild                      1. 2. 3.            1. 2. 3.
```

**Und die Zahl, die den vierten Fund belegt:** `Strg+Umschalt+↓` in einer
Liste ganz OHNE versteckte Blöcke bewegte vorher ebenfalls nichts —
`["X","Y","Z"]` vor und nach dem Druck. Die Pfeilnavigation stand im selben
Behandler davor und kehrte um, sobald der Cursor am Ende stand. Das Kürzel
steht seit Langem im Blockmenü.

---

## §67 · Auf der Fläche zeichnen (E693, 26. September 2026)

**Der Umzug in den Kern**, gezählt mit `git diff --stat`:

```txt
                                        vorher      nachher
zeichenflaeche.ts (Whiteboard)          —           136 Zeilen weniger
core/gfx/shapes.ts                      gibt es nicht   ~250 Zeilen
Fassungen des Formenzeichners           1 (nur Whiteboard)   1 (im Kern, zwei Leser)
Fassungen der Farbpalette               1               1 (im Kern)
```

**Die Bedingung aus L219, gemessen** — Tinte und Kasten teilen einen
`transform`, also schrumpfen sie beim Zoomen gleich:

```txt
                        RICHTIG (Tinte in der Ebene)   GEGENPROBE (daneben)
Kasten beim Zoomen      ×0,800                          ×0,800
Tinte beim Zoomen       ×0,800                          ×1,000
```

**„Ins Bild holen", zum zweiten Mal in zwei Bögen nachgebessert:**

```txt
E690   rechnete nur mit dem Seitenkasten   → Blöcke hingen draussen (E691)
E691   rechnete mit allen Kästen           → Formen hingen draussen (E693)
E693   rechnet mit Kästen UND Formen       → nichts hängt draussen
```

**Die Werkzeugleiste der Fläche:**

```txt
                E690        E693
Werkzeuge       2           8  (Zeiger, Hand, Radierer, Stift, Linie,
                               Pfeil, Rechteck, Ellipse)
Aktionen        3           5  (Farbe, Rückgängig, −, Massstab, +, Ins Bild)
am Telefon      44 px       44 px  je Knopf
```

**Und eine Zeile, die nicht nur den Prüfstand betraf:**
`setPointerCapture` wirft, wenn es den Zeiger nicht mehr gibt, und der Wurf
brach den Handgriff ab, bevor die erste Form entstand — ein schneller Tipp,
ein verlorener Stift oder ein zweiter Finger reichen dafür. Gemessen am
Telefon: ohne `try` entstand bei einem synthetischen Fingerstrich keine
einzige Form, mit `try` die erwartete.

**Nachtrag: ein leeres Feld, gefunden beim Schreiben der Doku.**
`doku/REDION-FORMAT.md` sollte versprechen, dass ein Seitenblock ohne
Zeichnung kein `shapes` trägt. Nachgesehen war es nicht wahr — die leere
Liste blieb stehen. Gemessen am Telefon, letzte Form wegradiert:

```txt
                       VORHER                    NACHHER
Feld `shapes`          [] (vorhanden)            nicht vorhanden
Feld `raumVersion`     1 (vorhanden)             nicht vorhanden
test575                37 ok                     40 ok
```

Die Gegenprobe (die eine Zeile `Store.feldWeg` wieder heraus) druckt
`{"hatShapes":true,"hatRaum":true}` und macht zwei Zusagen rot.

---

## §68 · Eine Werkzeugliste statt drei (E694, 26. September 2026)

**Der Bestand vorher und nachher**, gezählt im Quelltext:

```txt
                        VORHER                      NACHHER
Register.werkzeuge      22 Einträge (Katalog)       22 Einträge (Katalog)
Marken.WERKZEUGE        14 Objektliterale mit       14 Kennungen als
                        id, zeichen, sym, name,     Reihenfolge
                        titel  (≈ 4280 Zeichen)     (≈ 190 Zeichen)
menueband.WERKZEUGE     13 Vierertupel              13 Paare
                        [id, Name, Zeichen,         [id, 'werkzeug'|'form']
                        Hinweis]
Namen im Programm       an 3 Stellen geschrieben    an 1 Stelle
```

**Die Kollision, die dabei sichtbar wurde.** Die Kennung `ellipse` steht in
zwei Kennungsräumen:

```txt
Register.werkzeuge  'linie'  'pfeil'  'rechteck'  'ellipse'   Zeichen ◯
Marken.FORMEN       'line'   'arrow'  'rectangle' 'ellipse'   Zeichen ○
```

Drei Paare sind durch die Sprache getrennt, das vierte nicht. Ein
`holen(id) ?? form(id)` hätte im Menüband still `◯` statt `○` gezeigt.

**Der Wächter, gemessen:**

```txt
                    VOR der Reparatur   NACH der Reparatur   Gegenprobe
test572             55 ok, 4 rot        59 ok, 0 rot         58 ok, 1 rot
```

Die Gegenprobe ist ein von Hand zurückgeschriebener Name
(`id === 'abdeck' ? 'Abdeckband' : …`) und druckt genau den historischen
Fehler aus `test266`: `abdeck`.

**Zwei Messungen, die aus dem falschen Grund null ergaben** (beide jetzt als
Kommentar im Lauf):

```txt
inReiter('zeichnen') gefiltert nach e.id           0 Werkzeuge  (gibt GRUPPEN zurück)
gemessen ohne offenes Blatt                        0 Werkzeuge  (Zeichenziel.da() = false)
gemessen mit Blatt, Gruppe 'Werkzeug'             13 Werkzeuge  ✓
```

---

## §69 · Glas und Bewegung, gezählt vor dem Umbau (E695, 27. September 2026)

**Die Inventur aller 23 Stilblätter** (ohne Kommentare, nur `transition`,
`animation` und `backdrop-filter`):

```txt
verschiedene Dauern in Übergängen       55     Dauer-Marken benutzt:   5
verschiedene Kurven                     16     davon nacktes `ease`: 227
transition auf Layout-Eigenschaften     14     (width, left, top, margin)
Endlos-Animationen im Quelltext         46
backdrop-filter                         16 Stellen, 10 verschiedene Werte
@keyframes                             120     doppelt benannt: 0
```

**Was davon WIRKLICH läuft** (Laufzeit-Sonde, `document.getAnimations()`
nach 1,8 s Leerlauf auf der Startseite):

```txt
                      Rechner    Telefon    Rechner, weniger Bewegung
Endlos-Animationen       1          1          0
sichtbar verwischt       0 %        8 %        0 %
```

Die eine Endlos-Animation ist der Kartenring der leeren Bibliothek (E529).
„Weniger Bewegung" hält alles an — die Sperre in `grund.css` greift.

**Glas, vorher und nachher:**

```txt
                          VORHER                        NACHHER (E695)
Menüs, Finder, Auswahl    88 % + blur(8px)              dicht + saturate(180%) blur(20px)
Telefonleiste             88 % + blur(20px) sat(1.6)    dicht + saturate(180%) blur(20px)
PDF-Werkzeugleiste        88 % + blur(8px)              leicht + saturate(180%) blur(20px)
.rb.glas                  leicht + glas-blur            leicht + glas-blur
Schleier (Willkommen)     blur(3px), ohne Präfix        --schleier-blur, mit Präfix
ohne -webkit-Zwilling     5 Stellen                     0
```

**Kontrast, gemessen an gerenderten Pixeln** über grossen schwarzen,
weissen, roten und blauen Flächen (schlimmstes Hundertstel, test576):

```txt
                             74 % (erste Schätzung)   dicht (E695)   ohne Schrift-Regel
Menü hell, Hauptschrift          7,05                   9,79              —
Menü dunkel, Hauptschrift        6,05                  10,01              —
Menü hell, stille Schrift        2,24                   4,67             3,11
Menü dunkel, stille Schrift      1,43                   4,66             2,36
Telefonleiste hell               4,14 (alt, 88 %)       4,59              —
Telefonleiste dunkel             4,66 (alt, 88 %)       4,66              —
```

Die Telefonleiste hell war schon VOR diesem Bogen unter 4,5 — gegen die
alten Stilblätter nachgemessen, dieselbe Zahl. Gegenprobe für den
Kontrastteil: `--bg-schwebend` hell auf 22 % → 1,6 : 1, der Lauf wird rot.

---

## §70 · Die Seitenspalte der Studioleiste (E696, 27. September 2026)

**Wo die Leiste steht**, 1440 × 960, Blatt mit Studio, gemessen in
`test534 §1` (y und Unterkante in Fensterpixeln):

```txt
                    vor E690 (43432e1)   nach E690 (4d7436d)   E696
oben                y = 335              y = 409               y = 409
links               335 … 1084           409 … 1158            409 … 949
rechts              335 … 1084           −56 … 693 (gerollt)   409 … 949
Seite gerollt nach
Klick auf den Griff 0 px                 465 px                0 px
```

Der Griff „Platz" ist der 64. von 68 Knöpfen und liegt tief in der rollenden
Spalte. Rollt die Spalte ans Ende, steht er vier Knöpfe über ihrem unteren
Rand — vor E690 bei y ≈ 923 (im Bild), nach E690 bei ≈ 997 (darunter), also
rollte der Browser die Seite nach.

**Zurückverfolgt** über Arbeitsbäume: `fd1a778` grün, `43432e1` grün,
`4d7436d` rot, `e388949` rot, `637eeb6` rot, `387ca8e` rot, `fc6e606` rot.

**Der neue Satz „endet im Fenster"** war auch gegen `43432e1` rot
(335 … 1084 bei 960) — der Mangel war älter als der Rückfall.

---

## §71 · Die React-Inseln: Grösse, Start, Einzeldatei, Ladezeit (E699, 27. September 2026)

**Die Bündel**, gebaut mit `node bauen-inseln.mts` (Vite 8.3.1, Ziel
es2022, CSS für Safari 16.4), gzip Stufe 6 wie `test388`:

```txt
                               roh          gzip
quell/fremd/react/react.js     222'474 B    69'080 B   React 19.3.0 + React DOM + scheduler
quell/islands/islands.js        10'637 B     4'162 B   die Inseln + Button, Toggle, Glyph
quell/islands/islands.css       21'645 B     4'879 B   Kit-Marken, Bauteile, Brücke
quell/schale/inseln/laden.js    10'960 B     4'137 B   der Lader (Redion-Code, im Start)
zusammen ohne Lader            254'756 B    78'121 B
```

Zum Vergleich aus den Vorversuchen (dieselbe Vite-Fassung): das ganze Kit
über `index.ts` hätte 128 KB CSS gebracht, fünf Bauteile einzeln 33 KB —
deshalb importieren die Inseln jedes Bauteil aus seiner eigenen Datei.
Zweimal gebaut, zweimal dieselbe sha256 (`test578` §1).

**Der Start**, gemessen mit `test388` §5 (erster Besuch über das Netz, gzip,
bis 3,5 s nach `load`):

```txt
vor E699 (4f6e91f)                     2761 KB   245 Dateien
mit E699                               2767 KB   246 Dateien   (+ Lader, + Kommentar in index.html)
Gegenprobe: Vorwärmen auf JEDEM Weg    2843 KB   249 Dateien   ← 7 KB unter der Decke 2850
```

Die Gegenprobe ist der Grund für die neue Zeile in `test388` §5: die Decke
allein hätte das Laden von React beim Start NICHT bemerkt.

**Die Einzeldatei:** 11'323'558 → 11'593'758 Bytes (+270'200, +2,4 %). Die
Bündel stehen darin als `<script type="text/plain">` und werden beim Start
nicht ausgewertet.

**`Inseln.bereit()`, kalt**, nach dem Laden, ohne Vorwärmen
(`requestIdleCallback` abgeschaltet), 2,5 s gewartet, fünf Läufe je Zeile,
Median, Chromium 1194 über `file://`:

```txt
                              CPU ×1     CPU ×4 (gedrosselt)
index.html (Ordner)           73 ms      197 ms
redion-einzeldatei.html       57 ms      213 ms
```

Zum Vergleich während des Starts (bei DOMContentLoaded gerufen, gegen den
Start der App): 260 ms / 396 ms (Ordner), 282 ms / 347 ms (Einzeldatei). Das
ist der Grund fürs Vorwärmen im Leerlauf: die erste Insel (Stufe 1b, ein
Dialog) soll nicht eine Fünftelsekunde auf React warten.

**Die Typen:** `tsc -p tsconfig.islands.json` 0 Fehler (Schalter des Kits).
Dieselben Dateien mit Redions Schaltern (§52.6): 73 Fehler, alle in
`fremd/touch/` — 25 TS2532, 18 TS18048, 8 TS2322, 8 TS2375, 6 TS2379,
4 TS2345, 2 TS2538, 2 TS7030; in `src/islands/` keiner.

**Nachtrag, Durchsicht (27. September, Abend).** Zwei Reparaturen
(`test579` §5 und §11), danach neu gemessen:

```txt
quell/schale/inseln/laden.js    11'811 B     4'442 B   (+851 / +305: das
                                                       gescheiterte <link>
                                                       geht wieder, mit Kommentar)
Start (test388 §5)              2767 KB   246 Dateien   unverändert
Einzeldatei                     11'595'301 B   (+1'543 gegenüber oben)
Dienststand                     v1379
Bündel (react.js, islands.*)    Byte für Byte unverändert (dieselben sha256)
```

Und die Kontraste, mit denen die Durchsicht rechnete (WCAG, gerundet):

```txt
Weiss auf --gefahr        Standard/dunkle Schemata #ef4444   3,76 : 1
                          „Touch Kit dunkel" vorher #ff7088  2,65 : 1  ← behoben
                          „Touch Kit hell" #b81c3c           6,42 : 1
Schwarz (--bg) auf #ef4444, die Schrift der Kit-Bauteile      5,58 : 1
--accent #6d4aff auf --bg-card #202020 (Akzent als Schrift)   3,16 : 1  (L222 Punkt 6)
--accent-text #9b87ff auf --bg-card #202020                   5,67 : 1
```

---

## §72 · Ein Farbtupfer dazu, ein Seitenrand zur Marke — die 28-px-Decke (E700, 27. September 2026)

(§71 ist den React-Inseln vergeben, E699 auf `claude/react-inseln-grundlage`.)

`test362` §7 auf `main` 323f13a: `{16:270, 22:85, 28:66, 44:54, 46:14, 56:14}`
gegen die Decke `{…, 28:65, …}`, 17/18. Gezählt mit dem Muster des Laufs
(Kommentare entfernt, `(?<![\w-])28px`, alle `.css` unter `quell/schale/stil/`):

```txt
Stand                          28px roh   Decke   test362
6ad2650b  (E696)               65         65      18/18
569a8341  (Codex, PR #114)     65         64      rot
0f73ba1d  (Merge, E697)        66         65      17/18
dieser Bogen (E700)            65         65      18/18
```

**Der Tausch, je eine Zeile, je ein Urteil.** Massstab ist `marken.css`:
gleiche Zahl heisst nur bei gleicher Aufgabe gleiche Marke.

```txt
     Datei:Zeile          was es ist                        Marke dieser Zahl   Urteil
+1   bausteine.css:5308   Breite eines Farbtupfers          --mobile-gutter     andere Aufgabe, bleibt roh
                          (.blatt-color-grid button i,
                          E697, 9e306b85)
−1   ki.css:158           Seitenrand von #page am Telefon   --mobile-gutter     dieselbe Aufgabe → Marke
                          (E37, max-width:820px)
```

**Ohne den Tupfer stünde die Decke jetzt bei 64.** Die übrigen 62 rohen
28 px (ohne den Tupfer und die zwei Definitionen `--mobile-gutter` und
`--tbl-kh`) sind durchgesehen: Knopf- und Zeichenmasse (28 × 28), Schatten (`0 8px 28px`),
Schriftgrössen, Innenpolster von Karten, Abstände zwischen Blöcken, ein
Listeneinzug — kein weiterer Seitenrand von `#page`.

**Sichtbar? Nein.** Vorher und nachher mit Playwright aufgenommen
(`isMobile`, feste Uhr, reduzierte Bewegung, Willkommensblatt weg), die
Vorher-Reihe zweimal, um das Rauschen zu messen (0 Pixel):

```txt
Fenster       Ansicht        #page Polster (oben rechts unten links)   Pixel anders
375 × 812     Start, Seite   0 22 243.6 22                             0, 0
390 × 844     Start, Seite   0 28 253.2 28                             0, 0
428 × 926     Start, Seite   0 28 277.8 28                             0, 0
700 × 1000    Start, Seite   0 28 300 28                               0, 0
```

Alle acht Nachher-Bilder sind byte-gleich mit den Vorher-Bildern. Die Zeile
in `ki.css` wird am Telefon ohnehin von `bausteine.css:221-225` überstimmt
(gleiche Spezifität, spätere Datei); sie trägt jetzt trotzdem die Marke, damit
die Zahl an einer Stelle steht. Die Bilder bleiben auf dem Rechner (§55.4).

## §73 · Ruhiger, und nichts ist weg — laute Flächen, Dauerbewegung, Emoji, Start (E701, 28. September 2026)

(§71 und §72 stehen auf dem Grundstand `claude/ruhig-grundstand` 515451f9;
§74 bis §78 stehen darunter.)

**Wie gemessen.** Playwright/Chromium, 1440 × 900 (Zeiger) und 390 × 844
(`isMobile`, `hasTouch`), hell und dunkel, jede Ansicht mit echtem Inhalt
über `Store`/`Produktwelten` aufgebaut, der Zeiger bei (2, 2). Vorher auf
515451f9, nachher auf diesem Zweig, derselbe Aufbau (Skript im Scratchpad,
nicht eingecheckt). Gezählt wird in der Seite:

- **laut** — sichtbare Knöpfe ab 250 px², deren Fläche im Farbton des
  Akzents gefüllt ist (deckend, Sättigung > .35, Ton ± 30°) oder deren
  Verlauf überwiegend aus solchen Tönen besteht, dazu die Themenkugel.
  `test580` §1 zählt zusätzlich den dunklen Funkelknopf „Lernen starten"
  (E638) — der ist die eine Haupthandlung auf „Heute".
- **endlos** — `document.getAnimations()` mit `playState` „running" und
  unendlich vielen Durchläufen.
- **Emoji** — Blätter in `.einst-nav`, `.menu`, `#r-blatt`, `.pg-tools`,
  `.home-liste`, deren Text ein Emoji ist. Getippte Zeichen wie ⌘ ⌨ ⧉ ↔
  zählt diese Spalte NICHT; die zählt `test580` §3 (je Zeile genau ein
  gezeichnetes `<svg class="sym">`, kein getipptes Zeichen daneben).

```txt
Ansicht (Rechner)        laut hell   laut dunkel   endlos   Emoji
Heute (+ „Lernen st.")   4 → 1       3 → 1         0 → 0    —
Dokumente                2 → 1       1 → 1         1 → 0    —
Textseite                2 → 0       1 → 0         0 → 0    4 → 0  (Seitenwerkzeuge)
Lernen                   2 → 0       1 → 0         0 → 0    —
Einstellungen            0 → 0       0 → 0         1 → 0    19 → 0
⋯-Menü der Seite         2 → 0       1 → 0         0 → 0    37 → 0
Mehr                     2 → 0       1 → 0         0 → 0    8 → 0
Termine                  2 → 0       1 → 0         0 → 0    7 → 0
Band offen               2 → 0       1 → 0         0 → 0    4 → 0

Ansicht (Telefon)        laut hell   laut dunkel   endlos   Emoji
Heute (+ „Lernen st.")   2 → 1       2 → 1         0 → 0    —
Dokumente                1 → 1       1 → 1         1 → 0    —
Einstellungen            0 → 0       0 → 0         1 → 0    19 → 0
⋯-Menü der Seite         0 → 0       0 → 0         0 → 0    37 → 0
R-Blatt                  1 → 1*      1 → 1*        1 → 0    11 → 0
```

\* Die eine laute Fläche unter dem R-Blatt ist „PDF öffnen" im Regal
dahinter — die Haupthandlung jener Ansicht, nicht des Blattes.

Die zwei „laut" auf „Dokumente" hell waren die violette Themenkugel und
„PDF öffnen" im Regal; übrig ist „PDF öffnen". Die Dauerbewegung hinter
Einstellungen und R-Blatt war der Kartenring des Regals darunter.

**Gezeichnete Zeichen statt getippter, je Ort** (Zeilen mit einem getippten
Zeichen oder Emoji, vorher → nachher; die Griffe selbst: dieselbe Kennung,
dasselbe Wort, dieselbe Folge, nachgezählt in `test580` §3):

```txt
Einstellungen, Navigation   19 → 0     19 Bereiche
⋯-Menü der Seite            47 → 0     47 Zeilen (Rechner in der ruhigen Fassung und Telefon)
„Mehr"                      13 → 0     13 Wege
R-Blatt                     12 → 0     12 Wege, dazu „Schliessen" (✕ → Zeichen `close`)
Seitenwerkzeuge              5 → 0     5 Griffe (Telefon; am Rechner dieselben)
Termine                      3 + n → 0 3 Karten und jede Zeile „Bevorstehend" (📌)
```

Neue Zeichen im Register: 20 (`plug`, `keyboard`, `globe`, `users`, `key`,
`creditCard`, `info`, `cloud`, `archive`, `widthWide`, `widthNarrow`,
`textSize`, `typeface`, `crumbs`, `hash`, `translate`, `moveTo`, `suggest`,
`alarm`, `code`) — im Raster der übrigen 24 × 24, Strich 1,7, `currentColor`.

**Start und Einzeldatei.** gzip Stufe 6 (`node:zlib`), nur die Dateien, die sich ändern
(alle im Start):

```txt
Datei                                            roh vorher  roh nachher  gzip vorher  gzip nachher  Δ gzip
quell/bereiche/datenbanken/ansichten/dienst.js        61601        62878      16,3 KB       16,8 KB   +0,48 KB
quell/bereiche/einstellungen/ansicht/seite.js        103399       103803      29,7 KB       29,8 KB   +0,11 KB
quell/bereiche/wissen/lernwelt.js                    178234       178882      46,6 KB       46,8 KB   +0,28 KB
quell/bereiche/wissen/werkzeuge.js                   183225       183731      50,8 KB       51,1 KB   +0,23 KB
quell/register/symbole.js                             42540        47622      14,2 KB       15,8 KB   +1,58 KB
quell/schale/aufbau/kopfleiste.js                     25367        29795       8,3 KB        9,7 KB   +1,45 KB
quell/schale/aufbau/schale.js                        261812       263057      75,3 KB       76,0 KB   +0,66 KB
quell/schale/stil/studio.css                          33795        42180      15,6 KB       18,3 KB   +2,72 KB
                                                                                           gesamt   +7,51 KB
```

Gut die Hälfte davon sind die deutschen Begründungen an Ort und Stelle
(§39, §53). `test388` §5 misst den ganzen Start: **2767 → 2775 KB** über
246 Dateien (Decke 2850 KB; der Grundstand 515451f9 hatte 2767 KB, §71).
Die Einzeldatei: 11 595 462 → 11 617 437 Bytes (+21 975).

## §74 · Flüssige Bewegung: Federn, Druck, Blätter, Ankunft, „Ruhig" (E702, 28. September 2026)

**Womit.** Chromium 1194 (Playwright 1.56.1) über `file://`, 390 × 844 mit
Berührung (`isMobile`, CDP `Input.dispatchTouchEvent`) und 1440 × 900.
„Vorher" ist `git archive 515451f` (claude/ruhig-grundstand) mit den neuen
Läufen hineinkopiert, „nachher" dieser Zweig. Bildstreifen mit CDP
`Animation.setPlaybackRate 0.1`, ein Bild alle 33 ms Animationszeit.

**Was `test581` vorher und nachher sieht:**

```txt
                                          vorher (515451f)            nachher
Blatt (UI.menu) im ersten Bild            16 von 276 px unter Ruhe    ≥ 50 % (vom Rand)
  Grund im ersten Bild                    1 (in einem Bild schwarz)   < 0,9, blendet auf
  gezogen 60 px                           0 px (folgt nicht)          60 ± 3 px
  weggewischt / daneben getippt           im selben Bild weg          200 ms Abgang, dann weg
  Escape, Wahl eines Eintrags             sofort                      sofort (unverändert)
Knopfdruck, sechs Proben (CDP-Berührung)  0 von 6 sinken ein          6 von 6, zurück auf linear()
  kurzer Tipp (ab/auf ohne Pause)         kleinste Breite 1           < 0,995
Schalter: Griff unter dem Finger          16,0 → 16,0 px              ≥ 110 % (18 %)
  Weg hinüber                             transform, cubic-bezier     translate, --feder-knapp
  Verlauf beim Einschalten                −30 statt −39,6 px          um die Mitte (−50 %)
Reiter getippt (Dokumente → Termine)      keine Ankunft               wisch-rein-links, allein
  zurück zu Dokumente                     2 Bewegungen (Kopf, Deckel) eine, von links
Einstellungen am Telefon Liste → Bereich  hartes display:none         schiebt herein / zurück
„Ruhig": laufende Bewegungen nach Heute,  7 (Pille ×3, .lw-nav,       0
  Dokumente, Termine, Menü, Dialog, Toast   Kopf, 2 Deckel)
  ::after unter „Ruhig"                   läuft (0.4s, Animation)     steht
  <html data-ui-motion>                   fehlt                       "reduce"
transition: all (quell/schale/stil)       1 (#rg-loch)                0
:active{transform:scale(…)}               17 Regeln                   4 (eigene Druckbilder)
JavaScript fragt nur das System           8 Stellen                   0 (AppEinstellung.wenigBewegung)
```

**Die Federn** (aus `fremd/touch/motion-tokens.css`, nachgerechnet von
`test581` §2 auf 1953 Punkten, Bit für Bit gleich dem Kit):

```txt
Marke             Kit        Dauer   höchster Wert   Einsatz in E702
--feder-druck     press      575 ms  1,0457          Knopf losgelassen, Griff zurück
--feder-knapp     snappy     542 ms  1,0050          Griff hinüber, Blatt zurück
--feder-sanft     smooth     796 ms  1 (nie über)    Blatt herein, jede Ankunft
--feder-lebhaft   bouncy     887 ms  1,0729          (bereit, noch nicht benutzt)
--feder-weich     gentle     923 ms  1,0015          (bereit, noch nicht benutzt)
```

**Die Grösse** (gzip Stufe 6, wie `test388`):

```txt
quell/schale/bedienung/spring.js     9'581 B roh   3'244 B gzip   (Code allein 2'285)
quell/schale/bedienung/press.js      7'228 B roh   2'642 B gzip   (Code allein 1'844)
alle geänderten Startdateien zusammen                +11,9 KB gzip  (Code und Kurven rund 8)
```

**Der Start**, gemessen mit `test388` §5 (erster Besuch über das Netz, gzip,
bis 3,5 s nach `load`):

```txt
Grundstand 515451f (E698–E700)     2767 KB   246 Dateien
mit E702                           2779 KB   248 Dateien   (+ spring.js, + press.js)
Decke                              2850 KB
```

**+12 KB — über der Richtzahl von rund 10 KB je Zweig dieser Bitte.** Davon
sind rund 8 KB Code und Kurven (Federkern 2,3, Druckfeder 1,8, Blattgeste
1,1, die fünf `linear()`-Kurven rund 1,2, Regeln und Aufrufe rund 1,5), der
Rest Kommentare an Ort und Stelle (§53: Deutsch für Menschen gehört zur
Quelle). Die langen Begründungen stehen in E702, nicht im Code — die Köpfe
von spring.ts und press.ts sind dafür von 50 auf 8 Zeilen gekürzt worden
(vorher +14,6 KB). Die Summe aller Zweige prüft der Integrator.

**Die Einzeldatei:** 11'595'462 → 11'629'653 Bytes (+34'191).

**Bildstreifen** (nicht eingecheckt, §55.4): Knopfdruck, Schalter, Blatt
auf, Blatt weggewischt, Ankunft — je vorher und nachher, am Telefon dunkel,
dazu die Druckkurve (Breite je Bild bei Tempo 1).

## §75 · Glas, wo es passt: echte Unschärfe, Grenzen, Kosten und Lesbarkeit in zehn Schemata (E703, 28. September 2026)

**Fenster und Werkzeug.** Chromium 141 (Playwright 1.56.1) mit dem GPU-Weg
`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist
--enable-gpu-compositing`, Telefon 390 × 844 (`isMobile`, `hasTouch`),
Rechner 1280 × 900 und 1440 × 900. Gemessen auf dem Zweig
`claude/glas-wo-es-passt` über dem Grundstand 515451f; „vorher" ist
515451f selbst.

**1 · Ist die Unschärfe echt?** Eine harte Kante (links Weiss, rechts
Schwarz) hinter einem offenen Menü, eine Pixelzeile quer über die Kante,
Breite der Rampe von 90 % auf 10 % (`test582` §1):

```txt
Chromium wie bisher (SoftwareRenderer)   0 px     59,59,59,59,59,59,59,59,28,28,28,28,28,28,28,28 (alle 10 px, hart)
mit dem GPU-Weg                          37–52 px (drei Läufe: 50, 52, 37; die Zeile liegt je nach Menülage anders)
```

Jedes Bild aus `bilder.mts` und jede Messung aus `test576` lief bis heute
ohne Unschärfe. Die Kontrastzahlen von E695 bleiben trotzdem richtig: die
Streifen des Prüfmusters sind breiter als die Unschärfe, der schlimmste
Grund ist mit und ohne derselbe.

**2 · Wie viel Glas steht am Telefon?** Sichtbare Elemente mit
`backdrop-filter` ≠ `none`, die Linse als Teil der Leiste (`test582` §7):

```txt
Szene                          Flächen   Anteil am Bild   was
Textseite, Ruhe                1         6,7 %            untere Leiste 370×60 (+ Linse 70×48)
Zeichenblatt, Leiste unten     2         17,0 %           untere Leiste, Zeichenleiste 310×109
Dokument mit Dock              1         6,7 %            Dock 358×62 (die untere Leiste ist im Dokument aus)
Menü-Blatt offen (Dokument)    2         50,1 %           Dock, Blatt 390×366
Willkommen                     0 Vollbild-Unschärfe       der Schleier dimmt am Telefon nur
Grenze                         ≤ 3       ≤ 25 % in Ruhe, ≤ 60 % mit Menü, nie ≥ 90 % in einer Fläche
```

**3 · Was kostet es?** 390 × 844 @3x, GPU-Weg, 2,5 s Rollen mit 6 px je
Bild, gezählt `Display::DrawAndSwap` und die Zeit der Grafik (Runde 2 und 3
von 3; in derselben Seite einmal mit, einmal mit per Stilblatt
abgeschaltetem Glas):

```txt
Szene                                   Glas         Runde 2              Runde 3
Textseite (Leiste + Linse)              ohne         142 Bilder,  26 ms   152 Bilder,   24 ms
                                        mit          151 Bilder, 180 ms   147 Bilder,  244 ms
Zeichenblatt, Leiste unten              ohne         152 Bilder,  30 ms   152 Bilder,   30 ms
  (Leiste + Linse + Glas-Dock 310×109)  mit          152 Bilder, 186 ms   141 Bilder, 1583 ms *
```

Rund 150 Bilder in 2,5 s sind der Takt der Anzeige (60 je Sekunde): mit
Glas geht keines verloren, das der Takt nicht auch ohne verliert. Die
Grafikzeit steigt von etwa 25 auf etwa 180–240 ms je 2,5 s, also von
0,2 auf 1,2–1,6 ms je Bild. * Der eine Ausreisser fiel in eine Zeit, in der
vier andere Arbeitsbäume auf derselben Maschine Browser liefen; die zweite
Runde derselben Szene gab 186 ms. Im Dokument liess sich nichts messen: die
Probe hatte keinen Rollweg (0 Bilder in beiden Fällen).

Aus der Vorerhebung vom 27. September (dasselbe Verfahren, 0976b5f, mit
eingesetzten Probeflächen): vier Flächen mit 20 px 302–304 Bilder wie ohne
Glas; dieselben mit 40 px ebenso, aber etwa ein Viertel mehr Grafikarbeit je
Bild; ein Vollbild-Schleier mit 6 px dagegen 182–202 von 300 Bildern und
etwa 2200 ms Grafikzeit gegen etwa 200 ms. Daraus die Grenzen oben: die
Fläche und der Vollbild-Schleier treiben die Kosten, der Radius kaum.

**4 · Lesbarkeit über dem schlimmsten Grund.** Muster aus Weiss, Schwarz,
Rot und Blau (breiter als die Unschärfe), alles in der Fläche unsichtbar,
die Schriftfarbe gegen jedes vierte Pixel; „schlimmster" ist das 1-%-Quantil
(`test582` §3, §9, §10):

```txt
Fläche                          Modus/Gerät          schlimmster   Mitte    Grenze
Dock im Dokument, Beschriftung  dunkel, Rechner      10,79         13,89    4,5
                                dunkel, Telefon      10,79         13,88
                                hell, Rechner         9,54          9,97
                                hell, Telefon         9,54         10,00
Zeichenleiste unten, Zeichen    dunkel, Rechner      13,56         13,89    4,5
vorher (deckend, Deckel weg)    Dock dunkel/hell      1,12 / 1,71              (das Muster lag unter dem Roller)
```

In allen zehn Schemata (Rechner, dunkel, Dokument offen):

```txt
Schema            Menü Schrift  Gruppentitel   Dock          Telefonleiste   voll (stille Schrift)
                  nachher       vorher→nachher vorher→nachher vorher→nachher
standard          13,17         6,05 → 6,13    1,12 → 10,79  4,66 → 5,02     6,77
hell              9,54          4,55 → 4,55    1,71 → 9,54   4,55 → 4,55     5,45
nacht             12,29         6,1 → 6,2      1,21 → 10,1   4,71 → 5,09     6,82
wald              11,34         5,6 → 5,68     1,2 → 9,23    4,27 → 4,62     6,26
sand              8,57          3,97 → 3,97    1,67 → 8,57   3,97 → 3,97     4,72
papier            11,97         4,51 → 4,51    1,35 → 11,97  4,51 → 4,51     5,41
kontrast          18,42         12,49 → 13,96  1 → 18,42     9,85 → 13,96    13,96
rose              11,7          5,84 → 5,92    1,22 → 9,55   4,48 → 4,84     6,54
touchkit-hell     16,47         5,36 → 5,36    1,07 → 16,47  5,36 → 5,36     6,38
touchkit-dunkel   14,2          5,97 → 6,12    1,09 → 11,72  4,62 → 5,05     6,72
```

„vorher" ist der Grundstand: der Dock deckend, das Muster lag unter dem
durchsichtigen Rahmen und bei ausgeblendetem Inhalt offen da (deshalb 1,0
bis 1,71); dunkles dichtes Glas 88 %. „Kontrast" ist nachher deckend (kein
Glas, E703 Punkt 5) — darum Mitte = schlimmster = voll. **Sand** ist der
eine Fall unter 4,5: seine stille Schrift hat schon auf der vollen Karte
nur 4,72 : 1 (L226, Farbzweig); `test582` lässt dem Glas dort höchstens
0,8 (gemessen 0,75). Das leichte Glas (§9, L221): in allen zehn Schemata
über 3 : 1 für ein Zeichen in `--text-dim`.

**5 · Die Dichte.** Gerechnet (sRGB-Mischung, WCAG-Leuchtdichte) für
`--text-dim` #a7a7a7 auf dunklem Glas über reinem Weiss, gegen die Messung:

```txt
Karte             86 %    88 %    90 %    92 %    gemessen bei 88 %   bei 90 %
Standard #202020  4,36    4,67    5,00    5,34    4,66                5,02
Wald     #1e2921  4,01    4,29    4,59    4,90    4,27                4,62
Rosé     #2a2027  4,20    4,50    4,81    5,14    4,48                4,84
Mitternacht       4,41    4,72    5,05    5,40    4,71                5,09
```

Und hell (`--text-dim` #66655f über reinem Schwarz): Sand schon voll
deckend 4,72 : 1, bei 92 % 3,96 (gemessen 3,97), bei 96 % 4,33 — erst ab
etwa 97 % hielte Sand 4,5. Deshalb gehört Sand dem Farbzweig (L226).

**6 · Der Start** (`test388` §5, gzip Stufe 6): **2767 → 2774 KB über 246 Dateien**, Decke 2850 KB (Lauf vom 28. September, 08:5x UTC, Dienststand v1385). Die knapp sieben KB (6,8) sind fast ganz Kommentar in sieben Startdateien (bausteine.css +2,7, grund.css +1,4, studio.css +1,0, pdf-studio.css +0,7, dunkel.css +0,5, aussehen.js +0,2, hell.css +0,1 KB gzip); keine neue Datei.

**7 · Der Stapel am unteren Rand** (vorher, `test582` §6 rot):

```txt
Szene                      Werkzeug                   Toast            Lader
Rechner, Zeichenleiste     Leiste 844–890             835–878 darauf   786–878 darauf
Rechner, Dokument          Dock 824–886               835–878 darauf   786–878 darauf
Telefon, Dokument          Kapsel 708–760, Dock 768–830   720–763 darauf   670–762 darauf, und aufeinander
Telefon, Zeichenleiste     Leiste 632–741             720–763 darauf   670–762 darauf, und aufeinander
```

Dazu am Telefon mit offenem Blatt „Seite": der Lader lag mit `z-index:901`
über dem Blatt (600) auf „Zu Favoriten" und „Link kopieren"; nachher 585,
unter dem Schleier (590).

Nachher schneidet sich in keiner der vier Szenen ein Rechteck, und der
Lader liegt unter einem offenen Blatt (`test582` §6 grün). Neben der
Zeichenleiste „unten" steht der Toast oben (sie klebt nur, solange das Blatt
unter den Rand reicht; gerollt steht sie höher, und der Toast über dem
Boden lag im Bild wieder auf ihr).

## §76 · Bessere Stifteffekte: Umriss, Keil, Vorhersage, Tinten, Startgrösse (E704, 28. September 2026)

(§73–§75 stehen darüber, §77 und §78 darunter.) Redur: „bessere stift efeckte beim zeichnen" — im Fragebogen
„Echter Textmarker", „Füller wie GoodNotes", „Bleistift mit Graphitkorn",
„Neue Tintenfarben". Gemessen in Node an `quell/core/ink/*.js` (vorher: der
Grundstand 515451f9, nachher: dieser Zweig) und in Chromium 1194 mit
künstlichen Stiftereignissen; Rechner, nicht iPad (L227 Punkt 1).

**Der Umriss am „M"** (gespeicherte Form: zwei, drei Punkte je Bein, halbe
Breite 1,26 pt, Mittellinie in 0,5-pt-Schritten, `test583` §1):

```txt
                          vorher      nachher
Mittellinie ausserhalb    23 Punkte   0
halbe Breite, Median      0,80 pt     1,26 pt   (soll 1,26)
Pfad eines Zickzacks      1065 B      1190 B
Umriss, 300 Punkte        0,88 ms     0,64 ms   (je Aufruf, Node)
```

**Die Kappen** (gerader Strich, halbe Breite 3): 1,5 pt vor dem Ende
vorher draussen (Kerbe), nachher drin; 1,5 pt hinter dem Ende nachher drin.

**Der Keilmarker** (300 Punkte, Höhe 10 pt): `keil` + `vieleckPfad` 1,35 ms
je Bild, Pfad 28 481 B. Über weissem Papier: `#ffcf33` bei 0,40
multipliziert ≈ rgb(255, 236, 173); vorher `#e0a419` bei 0,32 ≈
rgb(245, 227, 183) (Beige).

**Der Schwanz der Vorhersage** (drei rohe Punkte im 8-ms-Takt, der Browser
rät drei weitere; Länge über den letzten rohen Punkt hinaus, pt):

```txt
Tempo px/ms   ungedeckelt   gedeckelt, stetig   Druck fällt (Bremse)
0,2           4,8           2,8                 0
0,45          10,8          6,3                 0
1             24            14                  0
2,5           60            26 (VORHER_PX)      0
```

**Die Tinten** auf dem Papier des Blatts (#f8f8f5), WCAG; kleinster
Abstand zweier Tinten in ΔE_OK (×100), nachgebildet nach Machado 2009:

```txt
Königsblau #2346b5 7,55   Nachtblau #1b2552 13,77   Karmin #b12f4f 5,82
Tannengrün #1d6024 7,17   Petrol    #0c6d7f  5,62   Aubergine #5f3295 8,30
Sepia      #662f05 10,00  Graphit   #3c3c3c 10,37
engstes Paar   normal 9,5 · deutan 5,2 · protan 6,2 · tritan 5,7
die alten fünf normal 20,1 · deutan 4,3 (Rot/Grün) · protan 6,8 · tritan 5,9
               auf Papier: Grün 2,88, Gelb 2,08, Blau 3,87, Rot 4,11
```

**Startgrösse und Einzeldatei.** Gezählt am 28. September ca. 08:45 UTC,
jede geänderte Startdatei gzip -6 gegen 515451f9: marken.js +7 112,
geometry.js +2 377, stroke.js +1 822, zeichenflaeche.js +1 057,
seitenflaeche.js +1 014, bausteine.css +484, pdfWriter.js +387, shapes.js
+159, arbeitswelt.js +137, document-mode.js +125 — zusammen **+14 674 B**
(ohne Kommentare rund 8,2 KB; der Rest sind die Kommentare, die `tsc`
mitnimmt, schon auf ein Drittel gekürzt). Das ist mehr als die rund 10 KB,
die jedem Zweig der Bitte vom 27. September zugedacht sind (L227 Punkt 7).
`test388` §5, gemessen am 28. September ca. 09:29 UTC (Chromium, gzip wie
ein echter Server): „Der Start holt 2782 KB (gzip) über 246 Dateien — Decke
2850 KB" (der Grundstand: 2767 KB).
Einzeldatei 11 595 462 → 11 645 706 B (+50 244).

## §77 · Bessere Farben — Kontrast je Schema, vorher und nachher (E705, 28. September 2026)

(§73 bis §76 stehen darüber.)

**Wie gemessen.** WCAG-2-Kontrast und OKLCH aus sRGB (Ottosson 2020),
vorher am Grundstand `515451f9`, nachher auf `claude/bessere-farben`. Im
Browser mit `test584`: jede Farbe als `var(--…)` an einem Probe-Element,
gerechnet, durch eine 1×1-Leinwand gelesen (so kommt auch `color-mix(…)` als
Zahl an), Chromium 1194 über `file://`. Die Einzelwerte darunter zusätzlich
in Node mit der gebauten `quell/core/helpers/colors.js`.

**1 · Schrift auf dem Akzent (Hauptknopf)** — vorher war es immer Weiss:

```txt
Schema / Farbe          vorher Weiss   nachher Schrift        Überfahren   Tinte auf Grund / Karte
Mitternacht #6c8cff     3,07           #0f1528  5,90          6,63         6,14 / 5,34
Wald #5cbf8a            2,26           #041b0f  7,93          8,85         7,82 / 6,65
Sand #b1743a            3,87           #231103  4,71          5,31         #93581a 5,34 / 4,64
Rosé #e06a94            3,15           #240e15  5,80          6,48         5,75 / 4,99
Starker Kontrast #ffd400 1,43          #000000 14,67          (#ffe071)    #ffd400 auf Schwarz
Standard + eigen #e0a33a 2,22          #201301  8,20          —            —
```

`test584` §1: alle 210 Paare (10 Schemata × Schema-Akzent, 9 neue, 8 alte,
3 eigene) ≥ 4,5 auf Fläche und Überfahren, Tinte ≥ 4,5 auf Grund und Karte,
im Ton des Akzents (≤ 20°).

**2 · Notion-Farben** — knappste Stelle über alle zehn Schemata, Grund,
Karte, Überfahren und eigene Tönung: vorher Gelb auf der „Sand"-Karte 2,22
(im Hellen alle neun unter 4,5; im Dunkeln Braun 3,75, Violett 4,30),
nachher Blau im Schema „Sand" **4,63**. Schrift auf jeder Tönung ≥ 7.

**3 · Statusfarben und Weiss auf Rot:**

```txt
                                vorher            nachher
--gefahr dunkel auf der Karte   #ef4444  4,33     #f66d67  5,68
--gefahr hell auf Sand-Überfahren #dc2626 3,57    #bb2021  4,64
--erfolg dunkel auf der Karte   #22c55e  7,15     #40cd9b  8,11   (Sättigung 0,21 → 0,14)
Weiss auf Rot (.glocke-zahl)    3,76 (Kit dunkel 2,65)   5,27 in allen zehn (--gefahr-flaeche #ce2a29)
Touch Kit hell --warnung        #b45309  4,34     #af4f00  4,60   (auf #eeeef1)
```

**4 · Whiteboard (GfxShapes.PALETTE) und Gedankenkarte im Hellen** — die
gespeicherte Farbe auf Weiss, und die Tinte, die jetzt gezeichnet wird:

```txt
Whiteboard   Gelb 1,35 → 5,15   Orange 1,99 → 5,19   Rot 2,66 → 5,16   Grün 2,76 → 5,17
             Blau 3,01 → 5,13   Grau 2,81 → 5,17     Violett 3,79 → 5,18  Rosa 3,47 → 5,23
Gedankenkarte Gelb 2,42 → 5,13  Orange 2,68 → 5,16   Türkis 3,02 → 5,25  Grün 3,34 → 5,13
             Blau 3,87 → 5,17   Rot 3,96 → 5,19      Rosa 4,17 → 5,15    Violett 5,04 → 5,17
```

Im Dunkeln wird unverändert die gespeicherte Farbe gezeichnet; Zettel
behalten ihre Füllung.

**5 · Diagramme** — die acht gezeichneten Reihen, OKLab-Abstand ΔE_OK:
vorher (eine Liste für beide Modi) Nachbarn 0,096, ein Grau mit Sättigung
0,003, Gelb auf Weiss 1,35; nachher je Grundton, Nachbarn 0,196 (hell) /
0,193 (dunkel), jede Sättigung ≥ 0,10, im Dunkeln jede ≥ 3 : 1 auf dem
Grund. Das engste Paar überhaupt ist Orange/Rot (0,071) — sie stehen nie
nebeneinander.

**6 · Die dunkle Leiter** (OKLCH L / C / h):

```txt
          vorher                          nachher
--bg      #141414  0,191 / 0 / —          #121417  0,190 / 0,0069 / 258°
--bg-side #1a1a1a                         #181a1d  0,217 / 0,0066 / 258°
--bg-card #202020                         #1e2023  0,243 / 0,0064 / 258°
--bg-hover #2d2d2d                        #2b2d30  0,296 / 0,0061 / 258°
--bg-press #343434                        #323437  0,324 / 0,0060 / 258°
--text-dim #a7a7a7 7,7 / 6,8 / 5,7        #a6a8aa  7,73 / 6,84 / 5,79 (Grund / Karte / Überfahren)
```

Die Schale (`#1b1d20`) und `--bg-tief` (`#0f1012`) lagen schon bei 258°;
jetzt ist es EINE Temperatur. Abgeleitete gedämpfte Schrift: Wald
`#9ea6a0`, Sand `#645c52` — jeweils im Ton des Grundes.

**7 · Feste Farben in den Stilblättern** (`test584` §11, bunte Werte mit
OKLCH-Sättigung ≥ 0,06 in Farbeigenschaften ausserhalb der Markendateien):
vorher 54 ausserhalb der Liste (716 Farbwerte gelesen), nachher 0 (657); auf der Liste stehen nur Papier-
und Bildfarben (Laser, Auswahlgriffe, Staffelei, Deckel, Zier der Bewegung,
Suchtreffer im Text).

**8 · Start (test388 §5).** Grundstand 2767 KB über 246 Dateien (§71).
Mit der ersten Fassung dieses Zweigs mass `test388` **2780 KB** (+12,6 KB) —
über der Zuteilung von rund 10 KB je Zweig. 8,1 der 12,9 KB waren
Kommentare in den Startdateien (die Begründungen stehen jetzt in E705, am
Ort nur noch der Kern). Danach, Datei für Datei gegen den Grundstand
gerechnet (gzip Stufe 6 wie `test388`):

```txt
colors.js +3 346 B · aussehen.js +1 410 · zeichenflaeche.js +673 · bausteine.css +588
dunkel.css +392 · grund.css +352 · shapes.js +336 · gedankenkarte.js +271
werkzeuge.css +168 · hell.css +140 · übrige +90             Summe +7 766 B ≈ +7,6 KB
```

Also rund 2775 KB, 75 unter der Decke 2850.

## §78 · Das Material des Touch Kits: Feder, Greifen, Linse, sechs Umschalter (E706, 28. September 2026)

**Wo und wie.** Zweig `claude/material-ueberall` gegen den Grundstand
`515451f9` (E698 + E699 + E700). Chromium von Playwright, 390 × 844
(`isMobile`, Berührung über CDP) und 1440 × 900; Kontrast an den Bildpunkten
(`test585` §2: dunkelster gegen hellsten Bildpunkt im Kasten des aktiven
Namens, 0,5- und 99,5-Perzentil). Gzip Stufe 6 wie `test388`.

**Die Feder, gerechnet** (`knapp` = Kit „snappy", 0,36 s, Schwung 0,14,
gegen die alte ζ = 1, ω = 0,026/ms):

```txt
                                 vorher (ζ = 1)      nachher (knapp, ζ = 0,86)
Anteil im ersten Bild (16,7 ms)      7,1 %               3,6 %
Bahn zum Nachbarn (74 px)            292 ms              288 ms
Bahn über zwei Wege (148 px)         292 ms              448 ms, 0,74 px über
höchste Dehnung zum Nachbarn         1,175 (test541 §6)  1,105
Nulldurchgang                        nie                 293 ms
```

**Die Linse in Ruhe — der aktive Name „Dokumente"** (vorher: Farbkarte vom
27. September; nachher und Gegenprobe: `test585` §2):

```txt
                      vorher (515451f9)    nachher (E706)    Gegenprobe (62 %, brightness 1.08)
hell                  1,83 : 1             4,74 : 1          1,83 : 1
dunkel                2,06 : 1             5,50 : 1          2,06 : 1
ohne Aufhellung       —                    4,73 / 5,11 : 1   (erste Fassung, gegen E639 und test539 §2)
Farbkarte 27.09.      1,83 / 2,09 : 1      —
Linse unter Knöpfen   —                    —                 5,18 / 5,20 : 1 (Alternative d, verworfen)
```

**Start (test388 §5).** 2777 KB gzip über 246 Dateien, Decke 2850 KB —
auf dem Grundstand 2767 KB (E699, §71). +10 KB, genau die Grenze, die jedem
Zweig dieser Bitte zugeteilt ist; es bleiben 73 KB für alle übrigen.

**Was die Dateien wachsen** (gzip Stufe 6, gegen `515451f9`, Bytes):

```txt
quell/schale/bedienung/selection-flow.js     6'649 → 14'578   +7'929
quell/schale/stil/bausteine.css            162'568 → 163'847   +1'279
quell/schale/aufbau/seitenleiste.js         19'434 →  19'827     +393
quell/bereiche/pdf/marken.js               128'143 → 128'366     +223
quell/schale/bedienung/segment.js            2'697 →   2'761      +64
quell/bereiche/einstellungen/ansicht/aussehen.js  9'991 → 10'045  +54
quell/bereiche/wissen/bibliothek.js         34'904 →  34'956      +52
quell/bereiche/wissen/lernwelt.js           47'668 →  47'715      +47
quell/bereiche/einstellungen/ansicht/seite.js 30'384 → 30'421     +37
quell/kern/einstellung/stand.js                440 →     440       ±0
                                                       zusammen +10'077
```

Der Löwenanteil ist Code: `selection-flow.js` ohne Kommentare 1,3 → 7,3 KB
(Federformel, Geste, Greifen, Umschalter). Die Kommentare sind gekürzt; die
Begründungen stehen in E706, nicht im Startpaket.

**Filmstreifen** (Bilder alle ~33 ms bei Wiedergabe ¼, `material-bilder/`,
nicht eingecheckt, §55.4): untere Leiste — Tipp „Dokumente" → „Heute" und
Ziehen „Heute" → „Termine" (10 Schritte à 34 ms, gehalten, dann los);
Werkzeugwechsel Stift → Radierer, Farbe, Stiftart (Rechner und Telefon);
Seite → Fläche; Aussehen Farben → Schrift und Layout; Regal Meine Ablage →
Zuletzt geöffnet; Heute erster → zweiter Reiter; Einstellungen eine Zeile
tiefer — je vorher und nachher, hell und dunkel. Wiedergabe ¼ über
`Animation.setPlaybackRate`, ein Bild alle 110 ms Echtzeit, also rund alle
27 ms Bewegungszeit.

## §79 · Der Löschen-Knopf, der zerfliesst: Stellen, Filter, Startpaket, Bildstreifen (E709, 28. September 2026)

**Wo und wie.** Zweig `claude/loeschen-fluessig` gegen den Stand
`b3cf1933` (Welle 1: E698–E706). Chromium von Playwright, 1440 × 900 und
390 × 844 (`isMobile`), hell und dunkel. Gzip Stufe 6 wie `test388`.

**Die Stellen, gezählt vor dem Bau** (Suche nach `🗑` als eigenem Knopf im
Quelltext, Menüzeilen `<span class="mi">🗑` nicht mitgezählt, dazu das ✕
der Chatliste):

```txt
Knöpfe mit Papierkorb, die löschen                        23 in 16 Dateien
  davon ohne jede Frage (erster Druck löscht)             21
  davon mit confirm() des Browsers                         2  (Papierkorb einzeln,
                                                               Erweiterung entfernen)
nachher mit data-loeschknopf                              23
confirm() hinter einem runden Löschen-Knopf                0
„Papierkorb leeren", Datenbank/Spalte im Menü        fragen weiter (viele Dinge / Menü)
```

**Der Filter.** Das Kit legt je Knopf einen `<filter>` an und lässt ihn in
Ruhe an. Hier, im Papierkorb mit drei Zeilen gemessen (`test586` §3): EIN
`filter#ru-loesch-goo` im Dokument; an nur, solange `data-fliesst` steht
(700 ms beim Öffnen, 480 ms beim Schliessen); in Ruhe `visibility: hidden`
und kein Filter.

**Startpaket** (neu: ein Skript, ein Blatt):

```txt
                                          roh        gzip
quell/schale/bedienung/delete.js       18'258 B    5'711 B
quell/schale/stil/loeschen.css         17'292 B    4'646 B
                                                  10'357 B  (10,1 KiB; Richtwert je Zweig ~10 KB)
Merkmale an 23 Stellen, Start (17 .js) +1'089 B roh
redion-einzeldatei.html       11'783'171 → 11'820'105 B   (+36'934)
test388 §5    2836 KB gzip über 250 Dateien, Decke 2850 KB
              (Nachbarlauf 14:03, vor den zwei Korrekturen danach: +0,2 KB)
```

**Bildstreifen** (`welle2-bilder/loeschen/`, nicht eingecheckt, §55.4):
Öffnen und Schliessen an drei echten Stellen (Papierkorb, Bereiche in den
Einstellungen, Dateien), Rechner und Telefon, hell und dunkel — in Echtzeit
aufgenommen (CDP-Bildschirmfoto des Ausschnitts, keine verlangsamte
Wiedergabe, weil die Zeitgeber des Helfers nicht mitverlangsamt würden):
24 Streifen (3 Orte × Rechner/Telefon × hell/dunkel × auf/zu), je 0,9 s
ab dem Druck, 13 bis 25 Bilder je Streifen, Abstand im Mittel 35 bis
66 ms (höchstens 149 ms; das Bildschirmfoto selbst kostet die Zeit, als
JPEG über CDP schneller als PNG: vorher 38–82 ms im Mittel). Am Bild
geprüft (Telefon, hell, Bereiche): bei ~75 ms schwillt der Kreis, 150 bis
290 ms zieht die zweite Pille einen Hals aus der ersten, ab ~340 ms sind
beide getrennt und die Wörter scharf; bei 700 ms übernimmt die CSS-Pille
ohne Durchscheinen. Zwei Fehler kamen erst im Streifen heraus (siehe
E709, „Gefunden auf dem Weg"): „Endgültig löschen" lief über die Pille,
und bei der Übergabe schien „0 Seiten" ein Bild lang durch.

**Nachtrag, 3. Oktober — die Läufe nach den zwei Korrekturen.** Sie liefen
am 28. September um ca. 15:54 UTC unter dem Schloss (`loeschen-lauf2.sh`)
gegen genau den Stand von E709 (`delete.js` byte-gleich, Arbeitsbaum
sauber); nachgelesen am 3. Oktober:

```txt
test586 (Zweig)                       45 von 45
  Gegenprobe: delete.js vor der Behebung (Pillen gemessen, bevor sie im
  Paar liegen) → §4 rot, „Jedes Wort passt in seine Pille":
  luftJa −36 px, luftNein 14 px — 44 von 45; zurück, cmp gleich
test362 (Zweig)                       18 von 18 (die rohe 16px ist weg)
test464 (Zweig)                       63 von 64 — nur §1 „Dreizehn Werkzeuge,
                                      alle auf EINER Höhe": ist [14,1], soll [13,1]
test464 (b3cf1933, eigener Baum)      62 von 63 — derselbe Punkt, gleich rot:
                                      fremd, älter als E709
test388 §5 (b3cf1933)                 2825 KB gzip über 248 Dateien, Decke 2850
Streifen neu (15:56 UTC)              24, je 13–25 Bilder, im Mittel 35–67 ms
                                      Abstand (höchstens 116 ms)
```

**Und das Zurückfliessen (3. Oktober, unter dem Schloss ca. 20:27–20:31
UTC, `loeschen-lauf4.sh`).** `test586` §3 zeichnet jedes Bild ab Escape auf
(requestAnimationFrame, 1 s, rund 50 Bilder):

```txt
                                     E709 (426270594)        nach dem Nachtrag
letzter Kreis der Flüssigkeit        44 px bei 480 ms        ≈ 32 px (± 3)
  (Knopf in der dichten Zeile 32 px)
erstes Bild ohne Schicht (~510 ms)   Zeichen 0, Fläche       Zeichen 1, Fläche
                                     rgba(0,0,0,0)           wie in Ruhe
Abbrechen, nach 100 ms wieder        aria-expanded fehlt     "true", Paar offen
test586                              45 von 48               48 von 48
Gegenproben je Teil (G7 Landung,     —                       je 47 von 48, rot
  G8 k = 1, G9 ohne reopened())                              genau am eigenen Punkt
test388 §5 (Zweig)                   —                       2836 KB gzip über 250
                                                             Dateien (Grundstand
                                                             b3cf1933: 2825 / 248)
delete.js                            18'258 / 5'711 B        19'408 / 6'107 B (roh/gzip)
loeschen.css                         17'292 / 4'646 B        18'151 / 4'863 B
  zusammen gzip                      10'357 B                10'970 B (+613)
redion-einzeldatei.html              11'820'105 B            11'822'114 B (+2'009)
```

**Durchsicht, 5. Oktober — Kontrast unter dem Zeiger, die Übergabe, die
Namen (unter dem Schloss, `rv5-loeschen/lauf-a.sh` und `lauf-b.sh`).**
Kontrast der roten Pille („Endgültig löschen", `--gefahr` auf ihrer Fläche),
gerechnet aus den berechneten Farben (WCAG; ein `color-mix()` kommt als
`color(srgb …)` zurück und wird so gelesen):

```txt
Schema            in Ruhe   unter dem Zeiger    unter dem Zeiger
                            vorher (Tönung)     nachher (Ring)
Standard (dunkel) 4,80      3,94                4,80
Hell              6,28      4,97                6,28
Mitternacht       5,10      4,19                5,10
Wald              4,59      3,81                4,59
Sand              5,83      4,64                5,83
Papier            6,28      4,97                6,28
Starker Kontrast  5,73      4,68                5,73
Rosé              5,01      4,05                5,01
Touch Kit hell    5,77      4,59                5,77
Touch Kit dunkel  4,95      4,05                4,95
(„Abbrechen" überall 10,97 bis 17,64 : 1; das Zeichen in Ruhe wie „ja".
 Fünf dunkle Schemata lagen unter dem Zeiger unter 4,5 — jetzt keines.)
```

```txt
                                     ebb01d778               nach der Durchsicht
erstes Bild ohne Fliessen,           Deckkraft 0 (769/780    1 (Fläche wie in Ruhe;
  Zeiger auf der roten Pille         ms, Übergang aus dem    der Ring blendet)
                                     Durchsichtigen)
Fokus nach Grösse ändern             body                    am Knopf (Zeile)
Name des Paars (Bereiche)            „Löschen: Bereich       „Bereich „Schule"
                                     „Schule" löschen"       löschen"
Name des Paars (Papierkorb)          „Endgültig löschen:     „„Nachtfahrt"
                                     Endgültig löschen"      endgültig löschen"
test586                              49 von 52 / 49 von 54   54 von 54
test388 §5 (Zweig)                   2836 KB / 250 Dateien   2837 KB / 250 Dateien
delete.js (roh / gzip, zlib 6)       19'408 / 6'075 B        20'164 / 6'359 B
loeschen.css                         18'151 / 4'830 B        18'772 / 5'104 B
redion-einzeldatei.html              11'822'114 B            11'824'223 B (+2'109)
```

Und die Sonde über alle Stellen (`rv5-loeschen/sonde-a.mjs`, 20 Orte ×
Rechner/Telefon × hell/dunkel, 5. Oktober 13:09–13:22 UTC): an 17 Orten
alles wie verlangt (erster Druck fragt nur, Fokus auf „Abbrechen", Filter
nur beim Fliessen, Escape und „Abbrechen" schliessen nur das Paar und
geben den Fokus zurück, die rote Pille nimmt genau eines, keine
Browser-Frage, Luft neben jedem Wort 40 px). Die Bedingte Farbe: Pillen
nicht obenauf (elementFromPoint traf die Seitenleiste) an allen vier
Geräten → nach der Behebung obenauf, „Löschen" 2 → 1, der Fokus in der
neuen Leiste (Lauf D). Die Chatliste am Rechner: der Knopf in Ruhe
`display: flex` (vor E709 `none`) → wieder `none`, beim Überfahren da.

## §84 · Rot zuerst, vier Inseln: Stilblatt, Wettlauf, Keil, Werkzeuge (E714, 3. Oktober 2026)

**Wo und wie.** Zweig `claude/rot-zuerst-inseln` auf `claude/morgen-besser`
(4d9a9a3f). Chromium von Playwright 1.56.1 (1194), über `http://127.0.0.1`
und `file://`, unter dem gemeinsamen Schloss; Halbierung in eigenen
Arbeitsbäumen (`git checkout --detach`, die erzeugten Dateien sind
eingecheckt).

**`test492`, das Stilblatt der Einzeldatei** (`probe492`: Einzeldatei laden,
gleich danach und nach `Inseln.bereit()` die `link[rel="stylesheet"]` lesen;
28. September):

```txt
Stand                       gleich nach dem Laden          nach bereit()        angenommene Blätter
E698 4f6e91f3               —                              — (keine Inseln)     0
E699 434402a3               blob:… stil (nach 49 ms)       blob:… stil          0
4d9a9a3f, drei Runden       blob:… stil, 3 von 3           blob:… stil          0
E714                        —                              —                    1
```

**`test582` §6, Toast und Lader über dem Zeichenblatt** (`probe582`: wie
`stapel()`, dazu Bilder über `requestAnimationFrame`, lange Aufgaben,
Deckkraft und Animationen nach 700 ms Wandzeit; 1280 × 900, dunkel; erste
Runde je Stand, die übrigen 43 Bilder und Deckkraft 1):

```txt
Stand                 Bilder in 700 ms   lange Aufgaben   Beginn nach Auslösen   Deckkraft Toast / Lader
4d9a9a3f, Runde 1     4                  0                507 ms                 0,19 / 0,11
E703 6b420f32, R. 1   3                  0                234 ms                 0,06 / 0,04
E704 b3cf1933, R. 1   4                  0                (Toast schon da)       1 / 0,97
jede weitere Runde    9 bis 44           0                im ersten Bild         1 / 1
```

**`test247`, der Keil** (Leiste „marker", Band Blau `#2f7ed8`, Stärke 5 dann
1,2): vor E704 `stroke="#2f7ed8"`, `stroke-width` im Verhältnis 5 : 1,2; ab
E704 `fill="#2f7ed8"`, `stroke="none"`, kein `stroke-width`, die Kante
`strokeWidth(mark)` lang.

**`test464`, die Leiste am Blatt:** 13 `[data-wz]` bis 09ac7f81, 14 ab
af2706c1 (`textfix`, E671), eine Zeile.

**Startgrösse (`test388` §5, 3. Oktober, 20:44 UTC):** **2826 KB** gzip über
248 Dateien, DECKE 2850 KB — wie `claude/morgen-besser` (2826); `laden.js`
wächst um weniger als ein halbes KB und rundet nicht um.

**Gegenproben (Grundstand 4d9a9a3f, neue Wächter):**

```txt
Lauf     Eingriff                                   rot mit
test492  keiner (Stand vor E714)                    nachgeladen: ['blob:null/52f9f81b-4ee3-'], alte Zeile auch
test464  button('textfix') aus der Leiste           ist [13,1,[…ohne textfix…]], soll [14,1,[…]]
test247  Keilhöhe fest 6 statt strokeWidth(mark)    dick 5.99 : dünn 5.99 = 1.00 (erwartet 4.17)
test582  ru-lader-herein 1,2 s statt 0,3 s          {"elemente":2,"laengste":1200,"offen":0}, alle vier Szenen
```

**Durchsicht, Gegenproben (4. Oktober, 16:03–16:06 UTC, auf dem Zweig, unter
dem Schloss; je zurückgenommen, Arbeitsbaum danach sauber):**

```txt
Lauf          Eingriff                                          rot mit
test582 §6    UI.toast setzt .show 900 ms zu spät               {"zeigt":false,…,"gewartet":0}, alle vier Szenen (172 ok, 8 rot)
test579 §9    Einzeldatei: das Blatt wird nicht angenommen      Knopf 24 px · {"angenommen":0,"links":0} · Akzent rgba(0, 0, 0, 0) (75 / 3)
```

**Startgrösse nach der Durchsicht (`test388` §5, 4. Oktober, 16:06–16:13 UTC):** **2826 KB** gzip über 248 Dateien, DECKE 2850 KB — unverändert, die Durchsicht ändert nur Prüfungen und Doku.

## §85 · Rot zuerst am Stift: Halten, Farbwähler, eine Probe — zurückverfolgt und nachgerechnet (E708, 28. September 2026)

**Wo und wie.** Zweig `claude/rot-zuerst-stift` gegen den Grundstand
`b3cf1933` (erste Welle, E698–E706). Die Wächter von HEUTE (`test201`,
`test461`, `test343` aus `b3cf1933`) liefen in eigenen Arbeitsbäumen gegen
den Code von damals: `e123eb10` (vor E676), `04b8c4d5` (E676), `a196b65d`
(vor E697, Codex-Basis) und `9e306b85` (E697). Chromium von Playwright,
unter der gemeinsamen Sperre. Die Glätter-Zahlen ohne Browser: der gebaute
`quell/core/ink/stroke.js` des jeweiligen Stands in einem `vm`-Kontext, mit
demselben Zug wie `test461` (40 Punkte in 4-ms-Schritten, dann Halten mit
Zittern alle 25 ms, 900 ms lang) und derselben Logik wie `addSample`
(Punktschwelle 0,6, `RUHE_RADIUS` 3). Gzip Stufe 6 wie `test388`.

**Die Wächter, zurückverfolgt** (✗ = durchgefallene Zusagen):

```txt
Wächter  Stand                          Ergebnis
test201  e123eb10 (vor E676)            32 ok, 0 offen
         04b8c4d5 (E676)                31 ok, 1 offen  ✗ „Freihand … geglaettet" — M0 0 L10 20 L20 15 L30 10
         b3cf1933 (Grundstand)          31 ok, 1 offen  (dasselbe)
test461  e123eb10 (vor E676)            36/36
         04b8c4d5 (E676)                33/36  ✗ §1 Linie (ist ["stift"]) ✗ … zwei Punkte ✗ §4 Linie
         b3cf1933 (Grundstand)          33/36  (dieselben drei)
test343  a196b65d (vor E697)            31/31
         9e306b85 (E697)                27/31  ✗ Tupfer undefined ✗ gemerkt (meta null)
                                               ✗ nächster Strich #111111 ✗ Tupfer nach Neuzeichnen []
         b3cf1933 (Grundstand)          22 ✓ 2 ✗ (§6), dann page.click 30 s: die offene Palette
                                               „Markerfarben" fängt den Tipp ab → Abbruch, §7/§8 ungelaufen
```

Jeder rote Commit hat den grünen als unmittelbaren Eltern (`git log -1
--format=%P`): `04b8c4d5` → `e123eb10`, `9e306b85` → `a196b65d`.

**Das Halten, nachgerechnet:**

```txt
±2 Zittern, 900 ms     längste Ruhe   Ruhe am Ende   Ruhekreis verlassen   Ergebnis
vor E676 (e123eb10)    875 ms         875 ms         1× (Ankunft)          Linie
seit E676 (b3cf1933)   175 ms          25 ms         15×                   Strich
E708 (die Hand)        875 ms         875 ms         1× (Ankunft)          Linie
±10, weitergefahren    ≤ 50 ms in allen drei Ständen                       Strich (richtig)
gehalten heisst        ≥ 450 ms (HALTEN_MS)
```

Mit Zeitrauschen (400 Läufe je Zittern, Anfahrt 4–6 ms, Halten 25–32 ms je
Meldung, Glätter des gebauten Stands): die Uhr an der Tinte sagt bei ±2 und
bei ±3 **0-mal** „gehalten", die Uhr an der Hand **400-mal**, und jedes Mal
wird mit 1b eine Linie daraus.

**Die Erkennung des gehaltenen Strichs, nachgerechnet** (Glätter und
`InkShapes` des gebauten Stands im `vm`-Kontext, derselbe Zug; „bis zur
Ruhe" ist die Stelle in `running.pts`, an der die Hand zuletzt in ihren
Ruhekreis kam):

```txt
Zug                  Punkte  bis zur Ruhe  ganzer Strich  bis zur Ruhe + Abhebepunkt     Ergebnis
±2, 900 ms gehalten    74       42          keine Form     Linie → (478 | 300,87)         Linie
±3, 900 ms gehalten    72       42          keine Form     Linie → (477,01 | 301,31)      Linie
±10, weitergefahren    73       73          keine Form     keine Form                     Strich
±2, nur 120 ms         45       42          Linie          Linie                          Strich (nicht gehalten)
```

Die Uhr allein reichte nicht: mit ihr lief `test461` im Browser weiter mit
33 von 36 (dieselben drei Zusagen), weil die Sehne keine 90 % des Wegs mehr
war.

**Formen mit Ecken, gehalten** (3. Oktober, am neuen Bau; dieselbe
Rechnung, langsam gezogen mit 1 px je 8-ms-Meldung wie `test564`, dann
900 ms oder 120 ms gehalten; „Grundstand" ist die Uhr an der Tinte und die
Erkennung auf der ganzen Tinte, „E708" die Uhr an der Hand und die
Erkennung bis zur Ruhe):

```txt
Zug          Zittern  Grundstand (b3cf1933)        E708
Linie        ±0       gehalten → Linie             gehalten → Linie
             ±2, ±3   nicht gehalten → Strich      gehalten → Linie
Dreieck      ±0       gehalten → Dreieck           gehalten → Dreieck
             ±2, ±3   nicht gehalten → Strich      gehalten → Dreieck
Rechteck     ±0       gehalten → Rechteck          gehalten → Rechteck
             ±2, ±3   nicht gehalten → Strich      gehalten → Rechteck
„M"          ±0, ±2   gehalten → keine Form        gehalten → keine Form
             ±3       nicht gehalten → keine Form  gehalten → keine Form
„N"          ±0       gehalten → keine Form        gehalten → keine Form
             ±2, ±3   nicht gehalten → keine Form  gehalten → keine Form
Zickzack     ±0       gehalten → keine Form        gehalten → keine Form
             ±2, ±3   nicht gehalten → keine Form  gehalten → keine Form
jeder Zug, nur 120 ms gehalten: in beiden Ständen nicht gehalten, keine Form
```

Wo der Grundstand „gehalten" sagte, sagt E708 dasselbe und erkennt dasselbe —
für langsam gezogene Züge wie hier; schnelle, kurze siehe „Durchsicht" unten.
Ein „M", ein „N" und ein Zickzack bleiben Striche — und weil nur die Frage an
`InkShapes` die gekürzten Punkte bekommt, bleibt ihre Tinte Punkt für Punkt,
wie sie war, mit allen Ecken (der Glätter mit Ecken ist der heutige, siehe
unten).

**Der Glätter ohne Ecken ist der alte, der mit Ecken der heutige.** 2000
zufällige Meldungen (Zittern ±3, Drift, `dt` 4–34 ms): `glaetter(start,
false)` gleich dem Glätter von `e123eb10` in jeder Zahl, `glaetter(start)`
gleich dem von `b3cf1933` in jeder Zahl. Der Vergleich trennt: an 1925 der
2000 Meldungen unterscheiden sich die Glätter von `e123eb10` und `b3cf1933`.

**Die Tinte beim Halten** (Spanne der geglätteten Punkte ab dem fünften,
36 Meldungen à 25 ms) — offen in L235 Punkt 2, nicht in diesem Bogen:

```txt
Zittern   roh     vor E676   seit E676
±0,4      1,03    0,30       0,30        (test366 §3 misst hier)
±1        2,57    0,79       0,79
±1,5      3,86    1,26       1,26
±2        5,14    1,78       5,07
±3        7,71    2,96       7,60
```

**Start (test388 §5).** Am 3. Oktober am fertigen Bau: „Der Start holt
2827 KB (gzip) über 248 Dateien — Decke 2850 KB", 21 bestanden. Was die
Dateien wachsen (gzip Stufe 6,
gegen `b3cf1933`, Bytes):

```txt
quell/bereiche/pdf/marken.js        135'496 → 136'961 +1'465
quell/core/ink/stroke.js              9'591 →   9'801   +210
quell/kern/einstellung/stand.js         440 →     438     −2
                                              zusammen +1'673
(sw.js, nicht beim Start: 10'226 → 10'225, −1 — der neue Stempel)
```

Gemessen am 3. Oktober am neuen Bau (Dienststand v1397), Node-`zlib`
Stufe 6. Fast nur Kommentar: der Code selbst sind ein Parameter, eine
Bedingung, ein Filter mehr je Meldung, zwei Werte, eine Auswahl der Punkte
beim Absetzen, zwei Hörer und ein gemerkter Wert.

**Nachgefahren am 3. Oktober** (der Bogen lag eine Woche still; am
fertigen Bau mit der Prüfung „nur ein neuer Wert", Dienststand v1397,
unter der gemeinsamen Sperre, Läufe zwischen 20:12 und 20:26 UTC):

```txt
Lauf                                          Ergebnis
test461                                       36/36
test343 (mit der neuen Zusage in §6)          32/32
test347                                       31/31
test201                                       31/32  ✗ §1 (die Probe, L235 Punkt 1)
G1 Uhr an der Tinte → test461                 33/36
G3 keepCorners wirkungslos → test461          33/36
G4 Erkennung auf der ganzen Tinte → test461   33/36
G2 kein change-Hörer → test343                2 ✗, dann page.click 30 s → Abbruch
G5 change ohne Wertprüfung → test343          30/32  ✗ auf und zu übernimmt nichts
                                                     (Palette zu, ["#ffcf33"] gemerkt)
                                                     ✗ Tupfer nach Neuzeichnen
                                                     ["#8e44ad","#ffcf33"]
```

**`test563` §1 „kein Buckel", wiederholt** (3. Oktober, 21:04 UTC, unter
der Sperre, abwechselnd; im Nachbarlauf um 20:24 einmal rot mit ×1,07):

```txt
Lauf   Zweig (E708)                Grundstand b3cf1933
1      13/13  innen 1,10 … 1,14 ×1,04   12/13  innen 1,12 … 1,24 ×1,11
2      12/13  innen 1,10 … 1,26 ×1,15   12/13  innen 1,10 … 1,30 ×1,18
3      12/13  innen 1,10 … 1,18 ×1,07   13/13  innen 1,10 … 1,10 ×1,00
verlangt: < 1,05
```

Derselbe Wackler auf beiden Seiten; die Breite des Füllers folgt seit E704
dem Tempo der Meldungen, und unter der Last von vier Bauern schwankt das
Tempo. E708 ändert weder Breite noch Druck noch Tempo. Nicht von hier;
gemeldet, nicht „repariert" (§31).

**Durchsicht** (4./5. Oktober 2026, zweiter Prüfer). *Gehaltene Formen im
echten App-Lauf* (Chromium von Playwright, unter der Sperre, 23:35–23:41
UTC; Zeigerereignisse eines Stifts auf ein leeres Blatt, alle 8 ms eine
Meldung im Zug, beim Halten alle 25 ms; jeder Zug in eigenem Kontext;
Grundstand `b3cf1933` gegen den Kopf `7eb0998c`). Gezählt die Marke und
ihre Punkte; „Ecken" ist der kleinste Abstand der Tinte zu jeder inneren
Ecke des Zugs:

```txt
Zug (Einheiten je Meldung)         Halten        Grundstand    Kopf E708
Linie 400 (3)                      ±0, 900 ms    Linie         Linie
Linie 400 (3)                      ±2 / ±3       Strich        Linie
Linie 400 (3)                      ±2, 120 ms    Strich        Strich
Linie 20 (3 und 7), 40 (3), 80 (12) ±0           Linie         Linie
Linie 20, 40, 80 (alle Schritte)   ±2            Strich        Linie
Linie 40 (10)                      ±0, 900 ms    Linie         Strich (8)   ← verloren
Linie 80 (20)                      ±0, 900 ms    Linie         Strich (8)   ← verloren
Linie 400 (40)                     ±0 / ±2       Linie/Strich  Linie
Dreieck (3)                        ±0 / ±2 / ±3  D / D / S     D / D / D
Rechteck (3)                       ±0 / ±2 / ±3  R / S / S     R / R / R
Kreis (3)                          ±0 / ±2       Ellipse/S     Ellipse/Ellipse
„M" (3)                            ±0/±2/±3, 120 Strich 11/35/33/11, Ecken 0,00 — in beiden gleich
„N", Zickzack, „L", Haken (3)      ±0 / ±2       Strich, gleiche Punktzahl, Ecken 0,00 — in beiden gleich
Haken, 700 ms Pause in der Mitte   nicht gehalten Strich 9     Strich 9
Linie, Pause ±2, am Ende ±2        900 ms        Strich 53     Strich 53   (L235 Punkt 2)
```

Seitenfehler in beiden: keine. Die zwei verlorenen Linien sind das, was
`test461` §1 seit der Durchsicht hält (rot am Kopf dreimal 36/38, am
Grundstand die neuen Zusagen dreimal grün).

*Warum, ohne Browser* (Glätter und `InkShapes` des gebauten Stands im
`vm`-Kontext, Logik wie `addSample`; schnelle, kurze Züge, alle 8 ms eine
Meldung, dann 900 ms still oder mit ±2):

```txt
Zug, still gehalten     Tinte   bis Ruhe + Abhebepunkt   Grundstand   Kopf   Durchsicht
60 in 15er-Schritten      8         6                    Linie        –      Linie
80 in 20er-Schritten      8         6                    Linie        –      Linie
80 in 12er-Schritten     12        12                    Linie        Linie  Linie
120 in 30er-Schritten     9         8                    Linie        Linie  Linie
```

`InkShapes.recognize` verlangt acht Punkte; bis zur Ruhe sind es bei einem
schnellen Zug weniger, die ganze Tinte hat sie, weil der Glätter beim
Halten nachzieht. *Und über alle Formen:* 192 Züge (Linie, kurze Linie,
Dreieck, Rechteck, „M", „N", Zickzack, „L"; 1, 3, 8, 15 Einheiten je
Meldung; ±0, ±2, ±3; 900 und 120 ms) — die Durchsicht (Frage bis zur
Ruhe, sonst die ganze Tinte) erkennt in **keinem** weniger als der
Grundstand, nie eine andere Form, aus „M", „N", Zickzack und „L" nie eine
Form, in 23 mehr; der Kopf verlor davon einen (kurze Linie, 15er-Schritte,
±0).

*Der Glätter*, nachgerechnet am Bau der Durchsicht: 5000 zufällige
Meldungen, `glaetter(start)` gegen `b3cf1933` und `glaetter(start, false)`
gegen `e123eb10` je grösste Abweichung 0; die beiden alten unterscheiden
sich an 4834.

*Start.* `marken.js` gzip (Stufe 6) 136'961 → 137'293 Bytes, +332 gegen
den Kopf; `stand.js` 438 → 439. Gegen den Grundstand zusammen rund
+2,0 KB (`marken.js` +1'797, `stroke.js` +210, `stand.js` −1).
`test388` §5 am Bau der Durchsicht (Dienststand v1398, 5. Oktober, unter
der Sperre): „Der Start holt 2827 KB (gzip) über 248 Dateien — Decke
2850 KB", 21 bestanden — die 332 Bytes bleiben unter der Rundung.

*Nach der Reparatur*, dieselbe Sonde der gehaltenen Formen am Bau der
Durchsicht (00:24–00:27 UTC): alle 40 Züge erkennen mindestens, was der
Grundstand erkannte — die zwei verlorenen Linien (40 in 10er-, 80 in
20er-Schritten, ±0) sind wieder Linien; „M", „N", Zickzack, „L" und Haken
bleiben Striche, jede Ecke bei 0,00. Ein Zug schwankt mit dem Tempo:
20 Einheiten in 7er-Schritten mit ±2 war am Kopf eine Linie und hier ein
Strich (30 Punkte) — der Grundstand liess ihn ebenfalls Strich.

**Dritte Durchsicht** (5. Oktober 2026, dritter Prüfer, am Bau v1398).

*Der echte Farbwähler.* Chromium 1194 von Playwright, **sichtbar**
(`headless: false`) auf einem eigenen Xvfb-Bildschirm 1440×1000, die App
über `file://` (index.html), Stift gewählt, Palette offen. Maus und Tastatur
als echte X-Ereignisse über XTest (libXtst über ctypes), nicht als
nachgestellte DOM-Ereignisse; mitgeschrieben die Ereignisse am Wähler
(`focus`, `click`, `input`, `change`, `blur`, `keydown`, jeweils mit seinem
Wert) und danach Palette, Tupfer der Leiste und `zeichnen:farben`. Unter
der gemeinsamen Sperre, 05:21–05:39 UTC:

```txt
Fall  Was die Hand tut                                   Ereignisse am Wähler                       Ergebnis
A     Wähler auf, Escape                                 focus, click #111111                       offen, kein Tupfer, nichts gemerkt
B1    im Feld eine Farbe, Eingabe                        click, input #a33838, change #a33838, blur Palette zu, #a33838 markiert, gemerkt
B2    im Feld eine Farbe, Klick daneben (Kopf)           click, input #b71f1f, change #b71f1f, blur Palette zu, #b71f1f markiert, gemerkt
B3    im Feld eine Farbe, Escape                         click, input #6c3d3d, input #a33838        offen, nichts dazu
C     im Feld eine Farbe, 17/17/17 in R/G/B getippt,     click, input #433232 … #111111 (7×),       offen, nichts gemerkt
        Eingabe                                            kein change
E     Hex #2266aa getippt, Wähler auf, Escape; auf,       click #2266aa (2×), kein change            offen, nichts gemerkt
        Eingabe ohne Wahl
D     Fokus, Leertaste; Escape; Eingabe                  keydown " ", click; keydown Enter, click   der Wähler geht auf
      … im Feld eine Farbe, Eingabe                      input #8e2525, change #8e2525, blur        Palette zu, #8e2525 markiert, gemerkt
Seitenfehler: keine. Fokus nach jeder Übernahme: „Farben: eigene Farbe wählen oder Farbsätze" (das „+" der Leiste).
```

*Gehaltene Formen, breit.* Glätter und `InkShapes` aus dem gebauten
`quell/core/ink/` des Grundstands `b3cf1933` und des Baus in je einem
`vm`-Kontext; je Zug die Logik von `addSample` (Punktschwelle 0,6,
`RUHE_RADIUS` 3, die Uhr des Grundstands an der Tinte, die des Baus an der
Hand mit `handRestFrom`) und von `finish` (Grundstand: `recognize` der
ganzen Tinte; Bau: bis zur Ruhe + Abhebepunkt, sonst die ganze Tinte).
27 Züge × 5 Schrittweiten × 3 Takte × 2 Wege × 5 Zittern × 4 Haltezeiten ×
Pause ja/nein = 32'400 Züge (Zufall mit festem Samen).

```txt
Tinte, Bau gegen Grundstand, 198'396 Meldungen     grösste Abweichung 0
Haltezeit 900 ms:  weniger erkannt 0 · andere Form 1 (kleiner Kreis, 25er-Schritte, ±2, Pause:
                   Dreieck → Ellipse) · aus Zügen mit Ecken neu eine Form 0
Haltezeit 500 ms:  weniger erkannt 28, alle, weil die Uhr des Baus „nicht gehalten" sagte
                   (Lage der Ruhepunkte an der Schwelle, siehe unten)
Haltezeit 120 / 0: in beiden Ständen nie gehalten, nie eine Form

„gehalten" (je 810 Züge)    Grundstand   Bau    Ruhe(Grundstand) − Ruhe(Bau), Median / 5 % / 95 %
±0, 500 ms                     551        544    0 / 0 / 0 ms   (Mittel +0,6, höchstens 112)
±0, 900 ms                     810        810    0 / 0 / 0 ms
±1, 500 ms                     509        510    0 / 0 / 0 ms
±1, 900 ms                     807        807    0 / 0 / 0 ms
±2, 500 ms                      75        398    −416 / −500 / 0 ms
±2, 900 ms                     109        808    −816 / −900 / 0 ms
±3, 500 ms                       0        362    −432 / −480 / −275 ms
±3, 900 ms                       0        800    −848 / −880 / −675 ms
```

Mit ruhiger Hand messen beide Uhren dieselbe Ruhe; bei 500 ms, 50 ms über
`HALTEN_MS`, entscheidet die Lage des letzten Ruhepunkts in beiden Ständen
bald so, bald so (sieben von 810 mehr im Grundstand, einer weniger bei ±1).
Ab ±2 hält erst der Bau.

*Start*, Node-`zlib` Stufe 6 gegen `b3cf1933`: `marken.js` 135'496 →
137'293 (+1'797), `stroke.js` 9'591 → 9'801 (+210), `stand.js` 440 → 439
(−1), zusammen +2'006 Bytes. `test388` §5 unter der Sperre (ca. 06:13
UTC, im Nachbarlauf): „Der Start holt 2827 KB (gzip) über 248 Dateien —
Decke 2850 KB", 21 bestanden.

## §86 · Der Startweg ohne Kommentare im erzeugten JavaScript (E715, 3. Oktober 2026)

**Wo und wie.** Zweig `claude/startlast-leichter` gegen `4d9a9a3fb`
(morgen-besser, E701–E706). Statisch: jede Datei, die `index.html` beim
Start holt (Skripte, Stilblätter samt `@import`, die Seite selbst), einzeln
mit gzip Stufe 6 gepackt und zusammengezählt — so, wie `test388` §5 sie
über seinen Server ausliefert. Dazu `test388` selbst, vorher (auf einem
Abzug von 4d9a9a3fb) und nachher.

**Die Hebel, gezählt, bevor gebaut wurde** (KB gzip):

```txt
                                                 vorher    ohne Kommentare
erzeugtes JavaScript, 224 Skripte                 2395,8       1375,5
  … davon die Zeile „ERZEUGT" je Datei (/*!)          —           18,4
Stilblätter, 23 Dateien                            416,7        416,7  (Kommentare darin: 261,3 — Quelle, bleibt)
index.html                                          13,2         13,2  (Kommentare darin: 6,4 — bleibt)
zusammen (248 Dateien)                              2826         1805
roh                                                 9688 KB      7063 KB
```

**Die grössten Einzelposten** (gzip, KB):

```txt
                                          vorher   nachher   weniger
quell/bereiche/pdf/marken.js              132,3     55,8      76,6
quell/bereiche/pdf/document-mode.js        82,5     35,2      47,3
quell/schale/aufbau/schale.js              76,1     34,2      41,9
quell/bereiche/datenbanken/steuerung.js   132,0     94,9      37,2
quell/kern/ablage/indexdb.js               52,7     17,9      34,8
quell/bereiche/dateien/einlesen.js         40,7     18,9      21,8
```

**Was danach noch zu holen wäre** (ohne Kommentare gemessen, nicht
gebaut): Studio (`marken.js` + `document-mode.js`) 91,0 KB, Datenbanken
(`steuerung.js`) 94,9 KB, Lerninhalt (L216: `nin-quiz.js` +
`staatskunde-inhalt.js`) 17,5 KB — alles nur mit Nachladen, also mit
geändertem Zeitpunkt; die Kommentare der Stilblätter 261,3 KB — nur mit
einem Bauschritt für CSS.

**Die Einzeldatei.** 11'784'203 → 9'095'626 Bytes (−2,56 MB); gzip
3'606'395 → 2'618'339 Bytes.

**Was vorher Kommentar war und gebraucht wurde.** `test105` §3 (Warnung im
erzeugten Kopf; vorher nur `core/`, 46 Dateien — auf 4d9a9a3fb fehlte sie
in 44 der 227), `test264`, `test265`, `test268` (ERZEUGT-Kopf in je einer
Datei) und `test272` (die Beschreibung der toten Verdrahtung `hl-seiten`
in `schale.js`). Alle Läufe, die `quell/…js` oder die Einzeldatei lesen,
sind gelaufen: 34 Dateiläufe grün; 103 Browserläufe unter dem Schloss,
davon nach der ERZEUGT-Zeile und `test272` aus der Quelle alle grün bis
auf acht, die auf dem Grundstand genauso rot sind: `test270` (die
`.git`-Datei des Arbeitsbaums, E671), `test343` §6 und `test461` (E708),
`test464` §1 und `test492` (E714), `test365` („Dreizehn Werkzeuge" 14
gegen 13, dieselbe Ursache wie `test464` §1), `test448` (Klappe des
Reglers, 20/22) und `test470` (wartet 5 s auf „sichern"). Die drei
letzten sind auf einem Abzug von 4d9a9a3fb nachgefahren, mit demselben
Ergebnis.

**test388 §5.** Vorher (4d9a9a3fb): 2826 KB über 248 Dateien, Decke
2850, 21/21. Mit der neuen Decke auf demselben Stand: 20/22 — „2826 KB …
Decke 1950" und „removeComments" rot. Nachher: **1805 KB über 248
Dateien, Decke 1950, 22/22.** Die Zahl des Laufs und die statische
Zählung stimmen auf das KB überein.

**Derselbe Code.** Die Quellen von 4d9a9a3fb mit `tsc -p
tsconfig.bauen.json --removeComments` in einen leeren Ordner gebaut und
gegen `quell/` des Zweigs gelegt, ohne die ERZEUGT-Zeile: 227 Dateien,
226 Byte für Byte gleich, die eine andere ist `stand.js` (nur der
Stempel). Was der Browser ausführt, ist also genau das Alte ohne
Kommentare — kein Skript kommt später, keine Funktion fehlt.

**Nachtrag (4. Oktober 2026, Durchsicht nach dem Abbruch vom 3. Oktober).**
Die erste Sitzung brach nach den beiden Commits ab; die Bilder, die der
Commit nennt, lagen nicht im Ordner. Nachgeholt und alles noch einmal
selbst gezählt, unter dem Schloss:

- *Zahlen, unabhängig nachgerechnet* (jede Datei, die `index.html` beim
  Start holt, samt `@import`, gzip 6): 4d9a9a3fb 2826 KB über 248
  Dateien (JS 2396, CSS 417), roh 9688 KB; der Zweig 1805 KB (JS 1376,
  CSS 417), roh 7063 KB. `test388` §5 nennt dieselbe Zahl: 1805 KB,
  Decke 1950, 22/22. Einzeldatei 11'784'203 → 9'095'626 Bytes.
- *Derselbe Code, noch einmal*: die Quellen von 4d9a9a3fb (`git archive`)
  mit `tsc -p tsconfig.bauen.json --removeComments` gebaut — 226 von 227
  Dateien Byte für Byte gleich `quell/` des Zweigs ohne die
  ERZEUGT-Zeile (sie steht als zweite Zeile, nach `"use strict";`, die
  Anweisung bleibt die erste); `stand.js` weicht nur im Stempel ab.
  `src/` ändert sich nur um die 227 ERZEUGT-Zeilen und den Stempel.
- *Bilder vorher/nachher*, per Doppelklick (`file://`) und als
  Einzeldatei, Rechner 1440×900 und Telefon 390×844, hell und dunkel
  (16 Bilder, `welle2-bilder/startlast/vorher-…`/`nachher-…`, nicht
  eingecheckt, §55.4): alle acht Paare **Pixel für Pixel gleich** (0 von
  1'296'000 bzw. 1'316'640 Bildpunkten anders), kein Konsolenfehler,
  kein Seitenfehler. Fertig (Baum gefüllt) nach 779–1100 ms vorher und
  794–861 ms nachher (`index.html`), 684–822 und 628–666 ms
  (Einzeldatei).
- *Früh bedienen* (zweiter Start, nach „Loslegen"; ab dem ersten Byte
  alle 20 ms ein Klick auf „Suchen", bis das Suchfeld steht; Median aus
  drei): `index.html` Rechner 1323 → 803 ms, Telefon 718 → 688 ms;
  Einzeldatei Rechner 498 → 425 ms, Telefon 581 → 467 ms. Nie
  später, kein Fehler. Strg P im selben 20-ms-Takt: vorher wie nachher
  nie ein stehendes Suchfeld gesehen (der Grund ist nicht gesucht, er ist
  auf beiden Ständen derselbe); darum noch einmal im Raster von 400 ms —
  drücken, 150 ms warten, nachsehen: `index.html`
  Rechner 1063 → 1149 ms, Telefon 1125 → 1168 ms; Einzeldatei Rechner
  1057 → 681 ms, Telefon 729 → 690 ms — die Unterschiede liegen innerhalb
  eines Rasterschritts; der genauere Klick (20 ms) zeigt nachher überall
  früher. Beim ERSTEN Start fängt meist der Dialog „Willkommen bei
  Redion" (Fokus auf „Loslegen") einen Druck gleich bei DOMContentLoaded
  ab — vorher wie nachher: in je einem von acht Versuchen (Strg P oder
  Klick, beide Seiten, beide Geräte) ging die Suche vor ihm auf.
- *Gegenproben, je rot gesehen und zurückgenommen*: die ERZEUGT-Zeile aus
  `src/bereiche/pdf/marken.ts` und `marken.js` → `test105` 333 ok,
  2 offen; `removeComments: false` in `tsconfig.bauen.json` (ohne
  Neubau) → `test388` 21/22, „reist ohne Kommentare" rot.

**Durchsicht (5. Oktober 2026, nach dem zweiten Abbruch).** Eine zweite
Durchsicht brach am 4./5. Oktober ab, bevor sie etwas festhielt; ihre
fünf offenen Änderungen (Verweise in E28, E389, E613, E688, L216, README,
`doku/MIGRATION-REZEPT.md`, `umzug.mts`) sind geprüft und übernommen. Neu
gemessen, auf `c287b388e` plus diese Änderungen:

- *Zahlen* (jede Datei, die `index.html` beim Start holt, samt
  `@import` ausserhalb von Kommentaren, gzip 6): 4d9a9a3fb 2826 KB über
  248 Dateien (JS 2395,8, CSS 416,7, HTML 13,2), roh 9688 KB; der Zweig
  1805 KB (JS 1375,5), roh 7063 KB. Einzeldatei 11'784'203 → 9'095'626
  Bytes. Stimmt mit dem Nachtrag überein.
- *Derselbe Code, mit einem zweiten Parser.* tsc hat die Kommentare
  genommen; ob es dabei Code angefasst hat, sagt ein Vergleich mit tsc
  nicht. Deshalb oxc (`rolldown/parseAst`, mit Vite schon im Haus): jedes
  alte `.js` von 4d9a9a3fb MIT Kommentaren und jedes neue OHNE geparst,
  der Baum ohne Positionen verglichen — 226 von 227 gleich, `stand.js`
  gleich bis auf den Stempel. Im erzeugten Code stehen 141 Zeichenketten,
  9 Vorlagen und 1 regulärer Ausdruck mit `//`, `/*` oder `*/` darin; alle
  unverändert. Gegenprobe: eine Zeichenkette in `marken.js` um ein Zeichen
  geändert → Baum anders; ein Kommentar dazu → Baum gleich.
- *Lizenzköpfe.* Unter `src/` steht kein fremder Kopf (`Copyright`,
  `@license`, `SPDX`, `©` nur in einer Zeichenkette für OpenStreetMap);
  `quell/fremd/react/react.js`, `quell/fremd/pdfjs/daten.js` und
  `quell/islands/islands.js` gehen nicht durch tsc und sind unverändert.
- *Bilder, Grundstand gegen Zweig* (eigene Probe, unter dem Schloss;
  index.html und Einzeldatei je Rechner 1440×900 und Telefon 390×844,
  dunkel, weniger Bewegung, feste Uhr und fester Zufall): Willkommen,
  Start, 13 Wege über `Register.navigation`, alle zehn Schemata (auch
  „Starker Kontrast" und beide Touch-Kit-Schemata), „Ruhige Darstellung"
  und Strg P — 108 Bildpaare, 107 Pixel für Pixel gleich; eines
  (Einzeldatei, Rechner, Bibliothek) mit 152 von 1'296'000 Bildpunkten,
  verstreut über die schräg gestellten Dokumentblätter der Grafik.
  Nachgefahren, je Stand dreimal derselbe Ausschnitt: alle sechs Pixel
  für Pixel gleich — ein einmaliges Rauschen beim Rastern, nicht E715.
  Kein Seiten- und kein Konsolenfehler in allen acht Durchgängen; Strg P
  öffnet überall die Suche; `data-bewegung="ruhig"` greift überall.
- *Wächter.* `test105` §3 verlangt jetzt auch, dass die Zeile ihre eigene
  Quelle nennt. Gegenprobe: in `src/core/helpers/ids.ts` und `ids.js`
  „idz.ts" eingesetzt → `test105` 335 ok, 1 offen („Jede Warnung nennt
  ihre eigene Quelle … quell/core/helpers/ids.js"), §2 grün;
  zurückgenommen.
- *Läufe.* Dateiläufe auf diesem Stand: `test87` 177 ok, `test105` 336
  ok/0 offen, `test109` 25, `test225` 11/11, `test549` 6/6, `test550` 8/8,
  `test578` 110/110, dazu 47, 75, 79, 88, 89, 92, 93, 101, 102, 103, 106,
  107, 108, 110, 113, 119, 131, 203, 216, 246, 275, 290, 294, 298, 354,
  367, 400, 401, 402, 410, 537, 553, 571 grün; `test274` 11 ok, 1 offen
  („verwaiste Nachschlagestelle … pdf/marken.ts: redion-graphit", E704) —
  auf 4d9a9a3fb genauso, fremd. Unter dem Schloss: `test388` 22/22 (1805
  KB, Decke 1950), `test353` 105/105, `test143` 23, `test412` 27/27,
  `test579` 76/76 (mit §10 ohne Netz), `test272` 153/0, `test264` 25/25,
  `test265` 39/39, `test268` 15/15, `test222` 52, `test510` 18, `test126`
  29, `test127` 22, `test245` 51, `test296` 17; und die Läufe, deren
  Prüftexte in alten Kommentaren vorkamen und die bisher keiner
  nachgefahren hatte: `test141` 27, `test183` 27, `test191` 23, `test303`
  16, `test341` 37, `test362` 18/18, `test411` 26, `test427` 55, `test444`
  13, `test576` 30/30, `test582` 176, `test584` 37 — alle ohne Offenes.
