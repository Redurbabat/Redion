# Die CSS-Namensräume von Redion

Beschlossen in ENTSCHEIDUNGEN.md unter E293, verlangt von LUECKEN.md L90.

## Warum es diese Datei gibt

Redions Stil hängt an kurzen Präfixen: `.bs-titel`, `.mb-knopf`, `.lw-karte`.
Zwei bis vier Buchstaben, ein Bindestrich, dann der Name. Das ist knapp und
liest sich gut — und es hat einen Preis, der schon einmal fällig wurde.

Die Datei-Fläche griff bei ihrem ersten Entwurf nach `bs-`. Das gehörte
längst der Buchseite des Formelbuchs, und sie erbte prompt
`font-weight: 700` und `--accent-text` in ihre Unterzeilen. Gefunden wurde
das nicht von einem Prüflauf, sondern auf einem Bild: die Unterzeile jeder
Dateizeile war fett, und niemand hatte das bestellt. Die Fläche heisst
seither `bst-`.

L90 hält seither fest, dass das nicht die Lücke ist:

> DIE LÜCKE IST NICHT DIESE EINE STELLE, SONDERN DASS NICHTS DAVOR WARNT.
> Redion hat rund vierzig CSS-Namensräume mit zwei bis vier Buchstaben, und
> keiner ist irgendwo aufgeschrieben. Der nächste neue Bereich greift genauso
> ins Leere, und der Fehler sieht wieder nicht wie ein Fehler aus — er sieht
> aus wie ein Stil, den man nicht bestellt hat.

Es sind nicht vierzig. Es sind **164** — gezählt, nicht fortgeschrieben (2. November 2026; `red-` kam am 1. November und ging am 2. wieder, E773).

*Hier stand 144, und das war schon vor diesem Durchgang falsch: das
Verzeichnis trug 158 Einträge. Die Zahl im Fliesstext prüft `test290`
nicht — nur die Einträge selbst. Sie wird deshalb beim Eintragen
nachgezählt (`grep -cE "^[a-z]{2,4}\s+[0-9]+\s+[a-z]+\.css"`), nicht
im Kopf fortgeschrieben.*

## Ein Präfix darf umziehen — aber nicht unbemerkt

`pg-` ist die Seite: `.pg-icon`, `.pg-tools`, `.pg-title` (aufbau.css), die
Telefonregeln (bausteine.css). Mit **E690** kamen der Umschalter
(`.pg-ansichten`) und die Fläche (`.pg-flaeche`, `.pg-fl-…`) dazu, und sie
stehen in einem eigenen Blatt. Gezählt am 26. September: 47 Vorkommen, davon
24 in `seitenansichten.css`, 17 in `bausteine.css`, 6 in `aufbau.css` — die
Hauptdatei hat also gewechselt, und die Zeile unten sagt es.

Das ist erlaubt, und `test290 §4` ist trotzdem richtig rot geworden: seine
Zusage heisst „kein Bereich ist UNBEMERKT gezogen", nicht „kein Bereich
zieht". Bemerkt heisst: die Zeile wird nachgezogen und der Grund steht
dabei. Was NICHT erlaubt wäre: ein zweiter Bereich, der `pg-` für etwas
anderes benutzt — das ist der Fall der Dateifläche und `bs-` von oben.

`sp-` ist der Schaltplan. Mit **E770** (Redurs ZIP vom 1. November 2026,
„Alle Funktionen 1:1") kamen Palette, Studio, Schnellkarte, Kontextleiste,
und das Labor in ein eigenes Blatt, `schaltatelier.css`:
gezählt 763 Vorkommen dort, 214 in `bausteine.css`, 40 in `motion.css` —
die Hauptdatei hat gewechselt. Einen Tag lang stand dort auch `red-`,
der RED-MGT-Glasschalter; Redur hat ihn am 2. November zurückgenommen
(E773), und mit ihm ging das Präfix.

## Zwei Sorten Präfix, und die zweite sieht nicht danach aus

Die meisten Präfixe benennen einen ORT: `lw-` ist die Lernwelt, `bib-` das
Regal, `mb-` das Menüband. Zwei benennen aber einen ZUSTAND, und die stehen
deshalb an ganz anderen Elementen:

- **`hat-`** — „dieses Element hat etwas". `body.hat-demo` heisst: über der
  App liegt der Vorführungsbalken, also braucht der Körper oben Platz.
  `.bib-deckel[data-art] .bib-deckel-blatt.hat-tinte` heisst: auf diesem
  Deckel steht Handschrift, also kein leeres Papier zeigen.
- **`is-`** — dasselbe auf Englisch, aus dem älteren Bestand (`is-open`).

Ein Zustandspräfix kollidiert nicht mit einem Ortspräfix, weil es nie allein
steht: es hängt immer an einer Klasse, die schon einen Ort hat. Wer ein
neues braucht, nimmt `hat-` und nicht ein drittes Wort für dieselbe Sache.

## Wie man ein neues Präfix wählt

1. In der Liste unten nachsehen, ob es frei ist. Sie ist vollständig für
   alles, was mindestens viermal vorkommt.
2. Es hier eintragen — Präfix, Zahl, Hauptdatei. `test290` verlangt das
   und wird sonst rot: ein Präfix im Stil, das hier fehlt, ist ein Präfix,
   von dem der nächste nichts weiss.
3. Ein Präfix darf über mehrere Stildateien gehen. `db-` steht in vier, weil
   der Datenbank-Bereich in vier Dateien wohnt — das ist keine Kollision,
   sondern ein Bereich. Genannt ist unten die Datei mit den meisten
   Vorkommen.

## Wie die Zahlen entstehen

Gezählt wird `.xx-…` in `quell/schale/stil/*.css`, zwei bis vier Buchstaben
vor dem Bindestrich. Alles ab vier Vorkommen gilt als eigener Namensraum;
darunter ist es meist ein Fremdzugriff — eine Datei, die eine Klasse einer
anderen mitgestaltet.

Die Zahlen wandern mit jeder Stiländerung. Sie sind hier nicht als Messwert
gedacht, sondern als Grössenordnung: ob `lw-` sechshundert oder sechs
Vorkommen hat, sagt einem sofort, wie schwer eine Umbenennung wäre.
`test290` prüft die NAMEN, nicht die Zahlen.

**Stand der Zahlen: 15. September 2026.** Sie waren bis dahin so weit
abgewandert, wie man es von einer ungeprüften Spalte erwarten muss: von 157
Präfixen hatten **45 eine falsche Zahl** — `rmo` stand auf 40 und ist 561,
`ai` auf 130 und ist 97. Die Spalte ist einmal aus dem Stil neu gerechnet
worden und ist ab hier wieder eine Grössenordnung statt einer Erfindung. Dass
sie erneut abwandert, ist eingeplant; dass sie es UNBEMERKT tut, steht jetzt
wenigstens hier.

## Was „Hauptdatei" bedeutet — und was nicht

Die dritte Spalte ist **die Datei mit den meisten Vorkommen**, nicht die
Datei, in der das Aussehen definiert wird. Bei den meisten Präfixen ist das
dasselbe. Bei vieren nicht, und wer dort sucht, sucht sonst falsch:

| Präfix | Hauptdatei (Spalte) | wo das Aussehen steht |
|---|---|---|
| `els` | `motion.css` — 53 Regeln für **2** Klassen | `bausteine.css`, alle **14** Klassen |
| `stat` | `motion.css` — 33 Regeln für **1** Klasse | `werkzeuge.css`, **3** Klassen |
| `ai` | `motion.css` | `bausteine.css` und `ki.css` |
| `rmo` | `motion.css` | dort auch wirklich zu Hause |

Der Grund ist E43/E259: **Bewegung wohnt ausschliesslich in `motion.css`.**
Ein Bereich mit viel Bewegung sammelt dort zwangsläufig mehr Regeln als in
seiner eigenen Datei — er ist deshalb nicht dorthin umgezogen.

`els` ist genau so aufgefallen: der Verzeichniseintrag stammte aus **E323**
und sagte `bausteine.css`, die Animationsregeln kamen mit **E537** dazu, und
`test290 §4` hat den Schwerpunktwechsel gemeldet. Die Meldung war richtig —
die Spalte sagt jetzt `motion.css`, und dieser Abschnitt sagt, wo das
Aussehen trotzdem liegt.

## Präfixe ausserhalb der Zählung

`res-` gehört der UI-Reserve (`quell/entwicklung/ui-reserve/reserve.css`,
E440). Die Datei liegt nicht unter `quell/schale/stil/` und wird von
`test290` deshalb nicht gezählt — sie steht hier als Satz und nicht in der
Tabelle, weil ein Tabelleneintrag ohne Vorkommen im Stil als Karteileiche
gemeldet würde. Der Zweck ist derselbe: niemand vergibt `res-` ein zweites
Mal.

`ui-` gehört dem **Touch Kit** (E699), genauer `ui-touch-`: jede Klasse
(`.ui-touch-button`, `.ui-touch-toggle-knob` …) und jede Keyframe-Folge des
Kits beginnt so, jede Marke mit `--ui-` (`--ui-color-accent`,
`--ui-spring-press`). Das CSS steht nicht in `quell/schale/stil/`, sondern
wird von `bauen-inseln.mts` ins Inselblatt `quell/islands/islands.css`
gebündelt — deshalb auch hier als Satz. `test290` §6 liest das Inselblatt
trotzdem: kein Präfix darin darf der Schale gehören, und jedes muss in
diesem Abschnitt stehen. `test578` §9 prüft zusätzlich, dass JEDE Klasse im
Inselblatt mit `ui-touch-` beginnt. Wer in Redion eine Klasse `ui-…` baut,
greift in den Namensraum des Kits; die Brücke zwischen beiden
(`src/islands/bridge.css`) benutzt deshalb keine Klassen, sondern
Merkmale: `data-insel`, `data-insel-wurzel`, `data-insel-fehler`.

`lern` steht unten mit **6** — gezählt sind nur die `.lern-…`-Klassen des
Lernplan-Schalters. Die klassische Lernansicht heisst `finder lern`, und
ihre Regeln schreiben `.lern ` mit Leerzeichen dahinter (`.lern button`,
`.lern progress`, `.lern .fh button`): seit **E734** sind es 15 Vorkommen,
alle in `werkzeuge.css`, derselben Datei wie die Zeile unten. Der Regex
oben (`\.xx-…`) sieht sie nicht, `test290` deshalb auch nicht; sie gehören
trotzdem zu diesem Namensraum. Auf dem Zweig des Elektro-Bogens stand die
Zahl deshalb auf 22 — eine Zählung nach anderer Regel als der Rest der
Spalte; hier bleibt die Spalte bei der Regel und der Satz sagt den Rest.

## Apple-inspirierte Navigation (21. Oktober 2026)

`ho-` benennt die Zeichen in der unteren iPhone-Navigation (`.ho-z`).
Seit dem Motion-/Liquid-Glass-Ausbau wird diese Klasse auch in
`studio.css` für die Federanimationen verwendet. Es ist **derselbe**
Navigationsbereich wie in `bausteine.css`, kein neuer Namensraum.
Die Hauptdatei ist nach der Zielleisten-Integration wieder `bausteine.css` (vier Vorkommen hier und vier in `studio.css`; bei Gleichstand gewinnt die alphabetisch erste Datei). Die Einstellung `data-bewegung="ruhig"` und die
Systemeinstellungen für reduzierte Bewegung/Transparenz gelten weiterhin.

## Das Verzeichnis

```
Präfix Anzahl  Hauptdatei
ab        4  bausteine.css
abo       5  einstellungen.css
ag       11  bausteine.css
ai       97  motion.css
an        6  bausteine.css
app      10  bausteine.css
arb      24  bausteine.css
as        4  bausteine.css
au       51  bausteine.css
auf      16  bausteine.css
auto      6  einstellungen.css
av       15  bausteine.css
aw      261  arbeitswelt.css
ax       11  bausteine.css
bahn      4  bausteine.css
bg       24  grund.css
bib     412  bausteine.css
bild     21  bausteine.css
bl        6  werkzeuge.css
bs       64  bausteine.css
bst      44  premium.css
bw        7  bausteine.css
cal       8  bausteine.css
cb       15  bausteine.css
chr      56  bausteine.css
code      9  bausteine.css
cw       18  bausteine.css
da       12  bausteine.css
dash     22  bausteine.css
db       52  bausteine.css
dd        4  bausteine.css
dk        8  bausteine.css
dl       17  bausteine.css
do        6  bausteine.css
dz       10  bausteine.css
ea      138  bausteine.css
eg       21  bausteine.css
eh        4  bausteine.css
el        9  bausteine.css
els      83  motion.css
ew       33  bausteine.css
ez       57  einstellungen.css
dev      27  devices.css
fb       11  bausteine.css
fd       22  bausteine.css
fe       11  einstellungen.css
fg        9  einstellungen.css
fh       91  bausteine.css
fk       17  bausteine.css
fn       15  werkzeuge.css
form     27  ansichten.css
fr       27  bausteine.css
frei     10  einstellungen.css
fv        9  einstellungen.css
fx        5  bausteine.css
gal       6  einstellungen.css
gfx       17  werkzeuge.css
gk       40  werkzeuge.css
gw       79  glasswheel.css
hat       6  notizhefte.css
hk       12  bausteine.css
hl        4  bausteine.css
ho        8  bausteine.css
home     63  werkzeuge.css
hs       20  werkzeuge.css
icon     16  bausteine.css
is       56  lernwelt.css
ist      65  aufbau.css
ka        8  einstellungen.css
kal      10  einstellungen.css
kb       17  bausteine.css
ki       60  bausteine.css
kl       18  premium.css
komm     18  bausteine.css
kopf      5  ansichten.css
kp       38  werkzeuge.css
kpi       4  bausteine.css
kq        6  bausteine.css
kr        7  bausteine.css
kt       15  einstellungen.css
kw       20  bausteine.css
kz       15  bausteine.css
leer      9  werkzeuge.css
lern      6  werkzeuge.css
list      7  datenbanken.css
lr        6  datenbanken.css
lv        5  bausteine.css
lw      758  lernwelt.css
lz        6  werkzeuge.css
mail      5  einstellungen.css
mb      154  aufbau.css
mbl       8  premium.css
meet      7  bausteine.css
memo     10  werkzeuge.css
menu     12  bausteine.css
mini     11  bausteine.css
mit       4  bausteine.css
msg       6  bausteine.css
mz       11  bausteine.css
ne        5  bausteine.css
nh      129  notizhefte.css
nur       7  bausteine.css
ohne      5  bausteine.css
opt       5  ansichten.css
pdf       5  bausteine.css
pdfs     15  bausteine.css
pe       19  bausteine.css
peek     14  ansichten.css
pers      8  bausteine.css
pf       17  bausteine.css
pg       47  seitenansichten.css
pk       15  bausteine.css
pl       18  bausteine.css
pp        5  ansichten.css
pr       12  bausteine.css
pv        8  bausteine.css
rg       46  bausteine.css
rgn      13  bausteine.css
rm       16  bausteine.css
rmo     561  motion.css
rs        5  bausteine.css
rt       22  bausteine.css
ru      498  bausteine.css
side     75  aufbau.css
sk       46  bausteine.css
sl        7  bausteine.css
sm       21  bausteine.css
so        5  bausteine.css
sp     1018  schaltatelier.css
stab     19  werkzeuge.css
stat     45  motion.css
such     18  einstellungen.css
sv        5  aufbau.css
sy        7  bausteine.css
tbl     104  tabelle.css
tblk     13  bausteine.css
td        7  einstellungen.css
teil     11  bausteine.css
tg       38  redion2.css
th        5  ansichten.css
toc       8  bausteine.css
top      15  grund.css
tp       15  bausteine.css
ts        8  bausteine.css
tt       17  bausteine.css
typ       6  bausteine.css
ue        8  bausteine.css
verb     19  einstellungen.css
vg       29  bausteine.css
vor       7  bausteine.css
vs       11  einstellungen.css
wahl      6  bausteine.css
wb       23  werkzeuge.css
we       14  bausteine.css
wiki     11  einstellungen.css
with     12  bausteine.css
wk       18  bausteine.css
wl       37  werkzeuge.css
wo       4  bausteine.css
wr       33  bausteine.css
ws       10  aufbau.css
wz       11  bausteine.css
zm       17  bausteine.css
zs       38  ansichten.css
```
