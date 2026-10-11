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
| Mechanischer Dreierblock, 4796–5396 | Zeitmesser → Start, Pause, Beenden | Eine gemeinsame Wanne mit Fuge und Rahmenreflex, LED je Taste mit drei Zuständen, Wischmaske und einmalige Symboldrehung beim Start, einrastende Haupttaste. Getrennte zugängliche Schaltflächen statt eines neuen Players. |

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

---

## Nachtrag vom 12. September 2026 (E529)

Redur: „arbeite an redion selbständig weiter … du musst alles im redion
einsetzen und dabei wirklich alles."

**Zwei Zeilen der Tabelle oben waren leer.** Nicht „vereinfacht übertragen",
sondern gar nicht gebaut — und das fällt niemandem auf, weil ja nichts
fehlt, was vorher da war:

| Eintrag | Was dastand | Was wirklich da war |
|---|---|---|
| Filamentschalter, 4158–4790 | „Warmes Filamentlicht bei `.sp-start.an`" | ein 13 × 6 px grosses `::before` mit einem Rand |
| 3D-Karussell, 1847–1909 | „Drei abstrakte Karten kippen räumlich" | Regeln für `.rmo-carousel` — **ein Element, das niemand erzeugt hat** |

Gefunden durch Abzählen: `motion.ts` hat sechs `ensure(`-Aufrufe, und keiner
gehörte zu `filament` oder `carousel`. Beide standen in der Wirkungstabelle,
kamen aber nie im Bild an.

**Jetzt gebaut, beide vollständig:**

* **Der Glühfaden** ist eine Lampe: Glaskolben, zwei Zuleitungen, eine
  Wendel dazwischen. Aus ist sie matt, an wird sie weissglühend und atmet.
  Weiss und nicht bernstein, weil der eingeschaltete Knopf selbst
  bernsteinfarben ist — am Bild geprüft, mit `#ffc572` war der Faden darauf
  nicht zu finden. Es ist auch das Richtige: der Draht glüht heller als die
  Fassung, die Zuleitungen bleiben dunkel.
* **Der Kartenring** stellt fünf Karten auf einen Kreis statt in einen
  Fächer, kippt ihn 14° nach vorn und dreht ihn in 22 Sekunden einmal herum.
  Der Radius wird gerechnet und nicht hingeschrieben: bei fünf Karten à 44 px
  müssen 44 / (2·tan 36°) ≈ 30 px heraus, sonst überlappen sie oder es klafft.
  Ohne die Kippung sieht man den Ring genau von der Kante — dann sind es
  zwei Karten nebeneinander, und das war der erste Versuch.

Die Pausenmechanik von E-vorher trägt beides mit: ausserhalb des Bildes,
im verborgenen Reiter, bei `body[data-bewegung="ruhig"]` und bei
`prefers-reduced-motion` steht alles still. Beides ist vor Vorleseprogrammen
verborgen und lässt Klicks durch.

`pruefungen/lauf/test495.mts`, 16 Zusagen. Gegenprobe: die zwei
`ensure(`-Aufrufe wieder entfernt — null Glühfäden, null Ringe, acht Zusagen
rot. Das ist genau der Zustand, den dieser Nachtrag beschreibt.

### Und dieselbe Sitzung noch einmal, eine Stunde später (E531)

Die zwei Sätze, die hier standen — „keinen laufenden Barcode", „keinen
gezeichneten Ring" — sind eingelöst.

**Der Barcode entsteht jetzt unter dem Druckkopf.** Er stand vorher fertig
da und wurde nur ein- und ausgeblendet; ein Beleg, dessen Code schon vor dem
Druck vollständig ist, erzählt die Sache rückwärts. Jetzt wächst er von links
nach rechts, solange der Auftrag WIRKLICH läuft, und ein schmaler Lichtstrich
läuft an seiner Kante mit. Bricht der Auftrag ab, bleibt der Code unfertig —
das ist die richtige Auskunft.

Zwei Dinge daran waren erst falsch und sind am Bild aufgefallen:
`clip-path` statt `width`, weil eine wachsende Breite den sich
wiederholenden Verlauf STAUCHT statt ihn freizulegen — man sähe Streifen,
die enger zusammenrücken. Und `left` statt `translateX` für den Kopf: ein
Prozentwert in `translateX` bezieht sich auf die eigene Breite, und die ist
zwei Punkte — der Kopf lief weit neben dem Papier her.

**Der Ring an der Kennzahl zeichnet sich einmal ganz und misst nichts.** Das
ist keine Sparsamkeit, sondern §33: ein Ring auf 72 % behauptet eine Grösse,
und Redion hätte keine, aus der er sie nähme. Er rahmt die echte Zahl. Wer je
eine echte Quote hat, setzt `--rmo-anteil` und bekommt daraus einen Messring,
ohne eine Regel zu ändern. Beim Anfassen geht ein zweiter Ring auf und
verblasst — das ist der `ring` der Vorlage.

Auch er ist zweimal umgezogen, und beide Male wegen eines Bildes: oben rechts
lag er mitten auf „Karten gelernt" (ein absolut gesetztes Element malt über
den Inhalt daneben), mit `z-index: -1` war er ganz verschwunden (die Karte
bildet einen eigenen Stapelzusammenhang, also landete er hinter ihrem
Hintergrund). Die Lösung war keine Schichtung, sondern ein freier Platz.

`test495` hält jetzt 25 Zusagen. Dabei war eine Zusage aus dem dümmsten
denkbaren Grund rot: `> span` traf den RING statt der Beschriftung, weil
`ensure()` ihn als erstes Kind einsetzt und er selbst ein `span` ist — der
Lauf mass den Ring gegen sich selbst.

**Was jetzt noch offen ist:** die Wendekarte des Tickets (Vor- und Rückseite,
2830–3455) und das Herz der Statistikkarte (2628–2648). Beides sind eigene
Bewegungen mit eigenem Markup, keine Motive mehr.

### Und eine Berichtigung an E528

E528 hat Redurs Unschärfe an den KI-Knöpfen zurückgeholt — und dabei mehr
zurückgeholt als er verlangt hatte. Das Original besteht aus drei Teilen:

| Teil | Wann | Art |
|---|---|---|
| `ru-funkel-glimmen` | immer | `infinite` |
| `ru-funkel-flackern` (Symbol) | immer | `infinite` |
| `ru-funkel-platzen` | beim Anfassen | einmal |

**Die Unschärfe steckt allein im dritten.** Die ersten beiden laufen ohne
Unterlass, und `test494` hält seit dem Motion-Bogen ausdrücklich fest:
„KI-Werkzeuge ohne Endlosschleifen im Leerlauf". Der Lauf wurde rot — und
er hatte recht.

Jetzt ist es getrennt: im Leerlauf still, beim Anfassen die volle
Unschärfe. Nachgemessen am laufenden Knopf — `animationName` ist im
Leerlauf `none` und beim Anfassen `rmo-letter-platzen` mit genau einer
Wiederholung. Das ist beides, was verlangt war, und nicht eines auf Kosten
des anderen.

## Weiterarbeit auf ad4ccbc — E534, 12. September 2026

Die oben zuletzt offenen Teile sind jetzt eingebaut:

- **Statistikherz:** ein kurzer räumlicher Herzschlag bei Interaktion,
  keine Dauerbewegung und keine erfundene Gesundheitskennzahl.
- **Ticket-Wendekarte:** die bestehende Druckbühne ist die Vorderseite;
  bei Abschluss oder Fehler erscheint die Rückseite mit dem tatsächlichen
  Status. Der zugängliche Status bleibt außen unverändert sichtbar.
- **Schmale Statistik:** Ring und Herz teilen sich einen Platz oberhalb
  der Beschriftung. „Warnungen“ wird nicht mehr vom Ring übermalt.
- **Glasknopf:** der geplante Schatten gewinnt jetzt tatsächlich gegen
  die ältere `.fbtns button.prim:not(.ru-funkel)`-Regel.

Der Katalog zählt die ursprünglichen **15 Vorlagenfamilien**. Ring, Herz
und Ziffernrolle gehören gemeinsam zu `metric`; es wurde kein bestehender
Effekt entfernt. `test496` prüft die Ergänzungen an echten Komponenten und
war vor dem Einbau rot. Bilder: `bilder/motion-rest-*.png`, ausschließlich lokal.
Übrige Prüflücken aus E532/E533 stehen weiterhin unter L149.

---

## Nachtrag vom 12. September 2026 (E535) — die zehn offenen Blöcke

Sieben Vorlagenblöcke sind in diesem Bogen gebaut worden, jeder von einem
eigenen Agenten, jeder als Fragment am Ende von `motion.css` plus einem
Schnipsel in `motion.ts`. Was dabei **mit Grund nicht** übernommen wurde,
steht hier — nicht still weggelassen (§35).

**Block 6, Verlaufsschalter (`.mschalter`).** `mix-blend-mode: difference`
und `color-dodge` der Vorlage sind durch `screen` + `overlay` ersetzt:
`difference` kippt auf einer 17-px-Pille bei beiden Akzenten ins Negative
und macht aus dem Akzent ein Giftgrün. `multiply` auf der Textebene frisst
bei 6,5 px Schrift das Wort weg. Der 5-s-Dauerpuls ist eine Leerlaufschleife
(E528) und sitzt jetzt endlich auf dem Lichtbalken beim Anfassen.
**Offen und wichtig:** `schale.ts` erzeugte den Umschalter ohne
`role="switch"`; das ist inzwischen behoben, aber nicht in diesem Fragment.

**Block 7, Kartenring.** Die Karten hängen jetzt in einer **Trommel** im
Ring, nicht direkt im Ring: `overflow:hidden` erzwingt
`transform-style:flat`, und aus dem Ring würde ein Stapel. Bühne und
Drehung müssen zwei Elemente sein.

**Block 9, Statistikkarten.** Das Wegfliegen der Linien nach 80 % und der
5-s-Dauerlauf sind nur die Rückstellung einer Endlosschleife. Die
Tiefenstaffelung (`preserve-3d`, 140-px-Schlagschatten) endet an dem
`overflow:hidden` der Karte und bräuchte einen Umbau der Kartenanatomie —
die Kippung ist gebaut, aber flach. Eine runde Symbolfassung gibt es nicht:
Die Karte hat kein Symbolelement, und den freien Platz oben rechts hat E534
dem Herz gegeben; ein erfundenes Symbol behauptete eine Bedeutung.

**Block 10, Ticket.** Das Schweben sitzt auf der **Bühne**, nicht auf der
Karte. Gemessen: `test496` fotografiert das Ticket im Zustand „rendern",
und Playwright wartet dabei auf einen zwei Bilder lang unveränderten
Elementrahmen — 123 ms mit stehender Karte, Zeitüberschreitung nach 5 s mit
5-px-Wippen. Abhilfe für einen späteren Bogen, eine Zeile: `test496:92` auf
`screenshot({ …, animations: 'disabled' })`, dann darf die Bewegung an die
Karte wandern.
Beim Bauen gefunden: eine `opacity < 1` am Behälter zwingt
`transform-style` auf `flat` — der Würfel war eine Raute, während
`getComputedStyle` weiter „preserve-3d" meldete.

**Block 11, Glaskugel.** Glaskarte und Fusszeile nur in der KI-Kopfzeile —
am 44-px-Knopf `#btn-ai` wäre kein Platz dafür.

**Block 12, Filament-Hebel.** Der buchstabenweise Zeichenwechsel der
Knopfbeschriftung ist nicht gebaut: „▶ Strom"/„◼ Strom" trägt die
Zustandsaussage (§38), und sie in Spans zu zerlegen machte die Auskunft zur
Deko. Gebaut ist stattdessen der 0/I-Wechsel am Gehäuse. Die schwebende
Ruhelage (−10 px, 70-px-Schlagschatten) fällt in einer 34-px-Werkzeugleiste
aus der Zeile; gebaut ist 1 px Anheben beim Anfassen. Die Rauschebene über
der ganzen Szene würde fremde Knöpfe überziehen und sitzt deshalb im Glas.

**Block 13, Zeitmesser.** Die radiale Verschränkungsmaske zwischen den
Tasten ist nicht gebaut: eine Maske beschneidet nur das **Bild**, nicht die
Trefferprüfung — die scheinbar weggeschnittene Ecke bliebe klickbar und
löste die falsche Handlung aus. Die eigene Breite der Mitteltaste (46 %)
würde Trefferflächen verkleinern (§37). Das Verblassen des Play-Textes auf
0,3 beim Überfahren nimmt der Taste ihren einzigen Namen, gerade während
man darauf zeigt.

**Noch offen, drei Blöcke:** 1 (Ordnerkarte), 3 (Lichtkarte und
Kippschalter), 5 (flüssiger Polygonlader).

## Herz und Funkel nach E719 und E720 (6. Oktober 2026)

**Statistikherz → Merkknopf (E719).** Auf den 22 Kennzahlen aus dem Katalog
der Lernwelt (`KENNZAHLEN` in `lernwelt.ts`: Heute, Lernzentrale, Fehler,
Fortschritt) ist das Herz kein Schmuck mehr, sondern der eine Merker
(`Merkzeichen`, Form 'herz'): dieselbe Ecke, derselbe Ring, derselbe
Herzschlag `rmo-heart-beat` beim Anfassen — jetzt am `<svg>` im Knopf —,
dazu der Kranz aus E460 nur beim Anhaken. `motion.ts` malt dort kein
zweites Herz. Schmuck bleiben die Herzen der Bestandsgesundheit
(`.rmo-health-metric`), des Simulationsergebnisses und der Fachseite (L241).

**Funkel-Orte (E720).** Laut in Ruhe: „Datenbank bauen" und „Seite aufbauen"
(KI), „Lernen starten" (Heute), „Starten" (Tagesrunde), „Fehler trainieren"
(Fehlerzentrum) — je der eine Knopf, der etwas anfängt. Still in Ruhe
(Umrisspille, voller Schein unter Zeiger, Tastenfokus und Druck):
Fehlertraining, Neue Karten, Prüfungsfokus und Trainer in der Lernzentrale.
Die übrigen KI-Werkzeuge tragen den Funkel wie bisher. Für ALLE gilt seither:
der Schein unter dem Zeiger nur unter `@media (hover:hover)`, und
`data-gedrueckt` (press.ts) zeigt dasselbe Drucklicht wie `:active`. Seit
der Durchsicht vom 10. Oktober gilt das auch für den Buchstabenlauf
(`rmo-letter-wisch` in motion.css): der Zeiger löst ihn nur unter
`@media (hover:hover)` aus, Tastenfokus und Druck überall. Und ohne
Bewegung erben die Buchstaben die Farbe ihres Knopfes, statt weiss zu
werden — auf der hellen Pille der stillen Funkel war das Wort sonst weg
(`test596` §9/§11).
