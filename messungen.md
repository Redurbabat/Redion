# MESSUNGEN.md — was wirklich gemessen wurde

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
