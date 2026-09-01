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

Es sind nicht vierzig. Es sind 143.

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

## Das Verzeichnis

```
Präfix Anzahl  Hauptdatei
ab        4  bausteine.css
abo       5  einstellungen.css
ag       11  bausteine.css
ai       23  ki.css
an        6  bausteine.css
arb      24  bausteine.css
app      10  bausteine.css
as        4  bausteine.css
au       49  bausteine.css
auf      16  bausteine.css
auto      6  einstellungen.css
av       15  bausteine.css
aw      244  arbeitswelt.css
ax       11  bausteine.css
bahn      4  bausteine.css
bg       15  grund.css
bib     209  bausteine.css
bild     15  bausteine.css
bl        6  werkzeuge.css
bs       64  bausteine.css
bst      44  premium.css
cal       8  bausteine.css
cb       15  bausteine.css
code      9  bausteine.css
cw        6  bausteine.css
da       12  bausteine.css
dash     22  bausteine.css
db       41  bausteine.css
dd        4  bausteine.css
dk        8  bausteine.css
dl       17  bausteine.css
dz        7  bausteine.css
ea      129  bausteine.css
eg       21  bausteine.css
eh        4  bausteine.css
el        9  bausteine.css
els      30  bausteine.css
ew       33  bausteine.css
ez       38  einstellungen.css
fb       11  bausteine.css
fd       22  bausteine.css
fe        8  einstellungen.css
fg        9  einstellungen.css
fh       90  bausteine.css
fk       17  bausteine.css
form     27  ansichten.css
fr       26  bausteine.css
frei     10  einstellungen.css
fx        5  bausteine.css
gal       6  einstellungen.css
hk       12  bausteine.css
hl        4  bausteine.css
home     63  werkzeuge.css
hs       20  werkzeuge.css
icon     13  bausteine.css
is       42  lernwelt.css
ist      45  aufbau.css
ka        8  einstellungen.css
kal      10  einstellungen.css
kb       17  bausteine.css
ki       38  bausteine.css
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
lv        5  bausteine.css
lern      6  werkzeuge.css
lw      657  lernwelt.css
lz        6  werkzeuge.css
mail      5  einstellungen.css
mb      141  aufbau.css
mbl       8  premium.css
meet      7  bausteine.css
memo     10  werkzeuge.css
menu     11  bausteine.css
mini     11  bausteine.css
mit       4  bausteine.css
msg       4  bausteine.css
mz       11  bausteine.css
ne        5  bausteine.css
nh      115  notizhefte.css
nur       6  bausteine.css
opt       4  ansichten.css
pdf       5  bausteine.css
pdfs     13  bausteine.css
pe       19  bausteine.css
peek     11  ansichten.css
pers      8  bausteine.css
pf       12  bausteine.css
pg       23  bausteine.css
pk       15  bausteine.css
pl       15  bausteine.css
pr       12  bausteine.css
pv        8  bausteine.css
rg       37  bausteine.css
rgn      13  bausteine.css
rm       16  bausteine.css
rs        5  bausteine.css
rt       13  bausteine.css
side     75  aufbau.css
sk       46  bausteine.css
sl        7  bausteine.css
sm       21  bausteine.css
so        5  bausteine.css
sp      121  bausteine.css
stab     13  werkzeuge.css
stat     12  werkzeuge.css
such     18  einstellungen.css
sv        5  aufbau.css
sy        7  bausteine.css
tbl     104  tabelle.css
tblk     13  bausteine.css
td        6  einstellungen.css
teil     11  bausteine.css
tg       17  bausteine.css
th        5  ansichten.css
toc       8  bausteine.css
top      15  grund.css
tp       15  bausteine.css
ts        8  bausteine.css
tt       13  bausteine.css
typ       6  bausteine.css
ue        8  bausteine.css
verb     19  einstellungen.css
vg       29  bausteine.css
vor       7  bausteine.css
vs        8  einstellungen.css
wahl      6  bausteine.css
wb       20  werkzeuge.css
we       14  bausteine.css
wiki     11  einstellungen.css
with     12  bausteine.css
wk       18  bausteine.css
wl       30  werkzeuge.css
wr       28  bausteine.css
ws       10  aufbau.css
wz       11  bausteine.css
zm       12  bausteine.css
zs       30  ansichten.css
```
