/* Suite 52 — Was der Quelltext selbst hergeben muss (ohne Browser)
 * ----------------------------------------------------------------------------
 * Drei Dinge, die kein Browserlauf finden kann, weil sie nicht im Verhalten
 * stehen, sondern zwischen zwei Dateien — und die trotzdem jemand merkt.
 *
 * 1 · ROHE STEUERZEICHEN. In vier Quelldateien standen Steuerzeichen als
 *     echtes Byte statt als Escape-Folge. Als getrennte .js geladen ist das
 *     gültig und läuft. In der Einzeldatei nicht: der HTML-Parser ersetzt ein
 *     NUL nach Vorschrift durch U+FFFD, und aus der Zeichenklasse
 *     [NUL-US] wird ein Bereich von 65533 bis 31 — verkehrt herum. Der
 *     reguläre Ausdruck entsteht beim Einlesen, nicht beim Aufruf, und reisst
 *     den ganzen Skriptblock mit.
 *
 *     Betroffen war ausgerechnet kern/sicherheit/saeubern.js. In der
 *     weitergegebenen Einzeldatei gab es die HTML-Säuberung schlicht nicht;
 *     alles aus Zwischenablage, Clipper, Import und Einbettung lief ungeprüft
 *     durch. Die App startete dabei ganz normal.
 *
 * 2 · DIE RECHTE STEHEN ZWEIMAL. kern/zugang/rollen.js sagt in seinem
 *     Kopfkommentar: „Sie ist bewusst wortgleich mit der des Servers, und der
 *     Prüflauf vergleicht beide." Diesen Vergleich gab es nicht — test85
 *     prüft die Oberflächenseite für sich, aber nie gegen server/kern.ts.
 *     Zwei Listen, die dasselbe meinen, laufen auseinander, und rollen.js
 *     schreibt selbst, in welche Richtung: die Oberfläche erlaubt etwas, das
 *     der Server verweigert, und der Mensch klickt einen Knopf, der nicht
 *     funktioniert.
 *
 * 3 · DIE ZEICHNER KENNEN APP NICHT. Seit A1 und A2 liegen Seitenleiste,
 *     Kopfleiste und Inhaltsfläche in eigenen Dateien und bekommen, was sie
 *     von drüben brauchen, über binde({ … }). Das ist der ganze Zweck der
 *     Trennung: sagt eine von ihnen wieder App., ist die neue Datei nur eine
 *     neue Datei und keine neue Grenze — und schale.js ist wieder die Datei,
 *     die man für alles aufmachen muss.
 *
 * Ohne Browser, in Millisekunden. Das ist kein Nebeneffekt, sondern der
 * Grund, warum dieser Lauf vorn steht: wenn die Rechte auseinanderlaufen,
 * will man das wissen, bevor man auf die Browserläufe wartet.
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu, relative as _relativ,
         extname as _endung } from 'node:path';
import { readFileSync as _lies, readdirSync as _liste, existsSync as _da } from 'node:fs';
import { ROLLEN as SERVER, darf as serverDarf } from '../../server/kern.ts';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* ========================================================================= *
 * 1 · KEINE ROHEN STEUERZEICHEN
 * ========================================================================= */
console.log('\n— Steuerzeichen im Quelltext —');

/* `: string[]` steht hier, weil die Funktion sich selbst aufruft — ohne die
   Angabe kann der Übersetzer ihren Rückgabetyp nicht ausrechnen. */
const alleDateien = (ordner: string): string[] => _liste(ordner, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? alleDateien(_dazu(ordner, e.name)) : [_dazu(ordner, e.name)]);

const quellen = alleDateien(_dazu(WURZEL, 'quell'))
  .filter(f => ['.js', '.css'].includes(_endung(f)))
  .concat(alleDateien(_dazu(WURZEL, 'server')).filter(f => _endung(f) === '.js'));

/* Erlaubt sind Tabulator (9), Zeilenumbruch (10) und Wagenrücklauf (13).
   Alles andere unter 32 gehört als Escape-Folge geschrieben, nicht roh. */
const schmutzig = quellen
  .filter(f => _lies(f).some(b => b < 9 || (b > 13 && b < 32)))
  .map(f => _relativ(WURZEL, f));

p('Keine Quelldatei hat rohe Steuerzeichen', schmutzig.length === 0, schmutzig.join(', '));
p('Und es wurden wirklich Dateien angesehen', quellen.length > 80, String(quellen.length));

/* ========================================================================= *
 * 2 · DIE RECHTE, BEIDSEITIG
 * ========================================================================= */
console.log('\n— Oberfläche und Server —');

/* rollen.js ist ein gewöhnliches Skript, kein Modul — es hängt sich am Ende
   an window. Hier bekommt es ein Fensterchen aus Papier statt eines Browsers. */
const OBEN = new Function('window',
  _lies(_dazu(WURZEL, 'quell/kern/zugang/rollen.js'), 'utf8') + '\nreturn Rollen;')({});

p('Beide kennen dieselben Rollen',
  JSON.stringify(Object.keys(OBEN.ROLLEN).sort()) === JSON.stringify(Object.keys(SERVER).sort()),
  Object.keys(OBEN.ROLLEN).join(',') + ' gegen ' + Object.keys(SERVER).join(','));

/* `entries` statt `keys`: so kommt die Rolle des Servers gleich mit, statt
   dass sie gleich darauf wieder aus der Tabelle geholt werden muss. */
Object.entries(SERVER).forEach(([r, unten]) => {
  p(`„${r}" hat beidseitig denselben Rang`,
    OBEN.ROLLEN[r]?.rang === unten.rang,
    OBEN.ROLLEN[r]?.rang + ' gegen ' + unten.rang);
  p(`„${r}" darf beidseitig dasselbe`,
    JSON.stringify((OBEN.ROLLEN[r]?.darf || []).slice().sort()) ===
    JSON.stringify(unten.darf.slice().sort()),
    (OBEN.ROLLEN[r]?.darf || []).join(',') + ' gegen ' + unten.darf.join(','));
});

/* Die gefährliche Richtung eigens: ein Tabellenvergleich sagt nur
   „ungleich". Das hier sagt, dass die Oberfläche nirgends mehr erlaubt. */
const taten = [...new Set(Object.values(SERVER).flatMap(r => r.darf))];
const zuViel: any[] = [], zuWenig: any[] = [];
Object.keys(SERVER).forEach(rolle => taten.forEach(tat => {
  if (OBEN.darf(rolle, tat) && !serverDarf(rolle, tat)) zuViel.push(rolle + ':' + tat);
  if (!OBEN.darf(rolle, tat) && serverDarf(rolle, tat)) zuWenig.push(rolle + ':' + tat);
}));
p('Die Oberfläche erlaubt nirgends mehr als der Server', zuViel.length === 0, zuViel.join(', '));
p('Und nirgends weniger',                                zuWenig.length === 0, zuWenig.join(', '));

/* Wörter gibt es nur in der Oberfläche — fehlt eines, steht „undefined" in
   einer Meldung, die ein Mensch liest. */
p('Die Reihe nennt jede Rolle genau einmal',
  JSON.stringify(OBEN.REIHE.slice().sort()) === JSON.stringify(Object.keys(SERVER).sort()));
/* `?.` statt eines geraden Zugriffs: nennt REIHE einen Namen, den der Server
   nicht kennt, wird diese Zeile rot — vorher riss sie den ganzen Lauf mit,
   und die hundert Prüfungen danach liefen gar nicht erst. */
p('Und zwar von stark nach schwach',
  JSON.stringify(OBEN.REIHE.map((r: string) => SERVER[r]?.rang)) === JSON.stringify([5, 4, 3, 2, 1]));
p('Jede Rolle hat Namen und Satz',
  Object.keys(SERVER).every(r => OBEN.ROLLEN[r]?.name && OBEN.ROLLEN[r]?.satz));
p('Jede Tat hat ein Wort im Klartext',
  taten.every(t => OBEN.TATEN[t]), taten.filter(t => !OBEN.TATEN[t]).join(', '));
p('Und keine Absage sagt „undefined"',
  !OBEN.warumNicht('lesen', 'bearbeiten').includes('undefined'),
  OBEN.warumNicht('lesen', 'bearbeiten'));

/* ========================================================================= *
 * 3 · DIE ZEICHNER KENNEN APP NICHT
 * ========================================================================= */
console.log('\n— Die Grenze aus A1 und A2 —');

/* Kommentare und Zeichenketten weg, sonst prüft der Lauf die Prosa und nicht
   das Programm: in den Kopfkommentaren steht `App.start()` sehr wohl, und in
   der Fehlermeldung von binde() auch — dort erklärt der Name, wo die Bindung
   herkommt.

   Schablonen (Backticks) bleiben absichtlich stehen. Erstens ist das, was in
   ${…} steht, echter Code — dort gehört ein App. gefunden und nicht versteckt.
   Zweitens war der Versuch, sie mit einem regulären Ausdruck zu entfernen, der
   erste Fehler dieses Laufs: er verschluckte 24 000 Zeichen aus schale.js und
   liess die Prüfung „schale.js bindet alle drei" fehlschlagen, obwohl alle
   drei dastanden. Ein Entferner, der mehr wegnimmt als er soll, macht eine
   Prüfung nicht strenger, sondern blind. */
const nurCode = (text: string) => text
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');

['seitenleiste.js', 'kopfleiste.js', 'inhaltsflaeche.js'].forEach(datei => {
  const code = nurCode(_lies(_dazu(WURZEL, 'quell/schale/aufbau', datei), 'utf8'));
  const treffer = (code.match(/\bApp\s*\.\w+/g) || []);
  p(datei + ' ruft App an keiner Stelle', treffer.length === 0, treffer.join(', '));
  p(datei + ' bietet binde() an', /\bbinde\b/.test(code));
});

/* Gegenprobe: der Ausdruck findet App überhaupt. Ohne sie könnte er kaputt
   sein und für immer „nein" sagen — die drei Prüfungen oben wären dann
   dauerhaft grün und wertlos. */
p('Und die Prüfung würde einen Rückfall merken',
  /\bApp\s*\.\w+/.test(nurCode('const x = App.zeichneBaum();')));

/* schale.js darf sie umgekehrt sehr wohl kennen — es setzt sie zusammen. */
const schale = nurCode(_lies(_dazu(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8'));
p('schale.js bindet alle drei',
  ['Seitenleiste.binde', 'Kopfleiste.binde', 'Inhaltsflaeche.binde']
    .every(n => (schale ?? '').includes(n)));

/* ========================================================================= *
 * 4 · DIE STILBLÄTTER SIND VOLLSTÄNDIG EINGEHÄNGT
 * Seit A3 ist es nicht mehr eines, sondern ein Ordner voll. `bauen.mts`
 * ersetzte den <link> ohne g-Flag, also nur den ERSTEN — mit mehreren
 * Stilblättern hätte die Einzeldatei die übrigen als tote <link> behalten.
 * Sie wäre gestartet und unfertig gewesen: die halbe Gestaltung fehlt, und
 * nichts meldet einen Fehler. Genau wie bei der fehlenden HTML-Säuberung
 * merkt man so etwas nicht beim Durchklicken.
 * ========================================================================= */
console.log('\n— Die Stilblätter —');

/* ------------------------------------------------------------------------ *
 * Hier stand bis eben eine Liste von Hand:
 *
 *     const STILE = ['marken.css', 'dunkel.css', … , 'bausteine.css'];
 *     p('… in der richtigen Folge', JSON.stringify(verlinkt) === JSON.stringify(STILE));
 *
 * Sie ging rot, als tabelle.css dazukam — bei völlig richtiger Arbeit. Das
 * ist der schlimmste Fehlschlag, den eine Prüfung haben kann: sie bestraft
 * das Richtige. Wer das zweimal erlebt, ändert beim dritten Mal die Liste,
 * ohne hinzusehen — und dann fängt sie auch den echten Fehler nicht mehr.
 * Dieselbe Lehre wie beim fest eingetragenen Pfad in test87 und beim auf
 * `notizen-v11` festgenagelten Vergleich in test99.
 *
 * Also prüft sie ab jetzt die REGEL statt der Liste. Die Liste kommt vom
 * Ordner; die Regel ist die Kaskade, und die ist der eigentliche Grund,
 * warum die Folge überhaupt zählt:
 *
 *     Stufe 0  marken · dunkel · hell   die Werte  (--bg, --accent …)
 *     Stufe 1  grund · aufbau           das Gerüst (Körper, Raster)
 *     Stufe 2  alle Bauteile            untereinander egal
 *     Stufe 3  bausteine                zuletzt, es überschreibt Bauteile
 *
 * Ein neues Bauteil-Stilblatt braucht damit keine Änderung mehr an dieser
 * Datei — ein an die falsche Stelle gehängtes aber sehr wohl.
 * ------------------------------------------------------------------------ */
const STIL_ORDNER = _dazu(WURZEL, 'quell/schale/stil');
const STILE = _liste(STIL_ORDNER).filter(n => n.endsWith('.css')).sort();

/* Die Tabelle hat feste Schlüssel, wird aber mit einem Dateinamen gelesen,
   der erst zur Laufzeit feststeht — deshalb `Record<string, number>`. */
const STUFE: Record<string, number> = { 'marken.css': 0, 'dunkel.css': 0, 'hell.css': 0,
                'grund.css': 1, 'aufbau.css': 1,
                'bausteine.css': 3 };
const stufeVon = (d: string) => STUFE[d] ?? 2;

const html = _lies(_dazu(WURZEL, 'index.html'), 'utf8');
const verlinkt = [...html.matchAll(/<link rel="stylesheet" href="quell\/schale\/stil\/([^"]+)">/g)]
  .map(m => m[1] ?? '');

/* Nichts vergessen: jedes Blatt auf der Platte hängt auch drin. Genau das
   ist der Fehler, der beim Anlegen einer neuen Datei passiert. */
const nichtVerlinkt = STILE.filter(d => !(verlinkt ?? '').includes(d));
p('index.html lädt jedes Stilblatt aus dem Ordner (' + STILE.length + ')',
  nichtVerlinkt.length === 0, 'fehlt: ' + nichtVerlinkt.join(', '));

/* Und umgekehrt: kein toter <link> auf eine Datei, die es nicht mehr gibt. */
const totLink = verlinkt.filter(d => !STILE.includes(d));
p('und kein <link> auf ein Blatt, das es nicht gibt',
  totLink.length === 0, totLink.join(', '));

/* Die Kaskade: die Stufe darf nie zurückspringen. */
const stufen = verlinkt.map(stufeVon);
const rueckwaerts = verlinkt
  .map((d, i) => (i > 0 && (stufen[i] ?? 2) < (stufen[i - 1] ?? 2)) ? `${verlinkt[i - 1]} vor ${d}` : null)
  .filter(Boolean);
p('Werte, dann Gerüst, dann Bauteile, dann bausteine.css',
  rueckwaerts.length === 0, rueckwaerts.join(' · '));

/* Innerhalb der Werte-Stufe zählt die Folge doch genau: marken setzt die
   Namen, dunkel den Normalfall, hell überschreibt ihn. Umgedreht wäre die
   App im Hellmodus dunkel — und nur dort. */
const werte = verlinkt.filter(d => stufeVon(d) === 0);
p('marken.css, dann dunkel.css, dann hell.css',
  JSON.stringify(werte) === JSON.stringify(['marken.css', 'dunkel.css', 'hell.css']),
  werte.join(', '));

/* Gegenprobe: merkt die Regel eine verdrehte Folge überhaupt? Ohne sie wäre
   ein durchgerutschter Vergleich für immer grün. */
p('Und die Prüfung würde eine verdrehte Folge merken',
  stufeVon('marken.css') < stufeVon('bausteine.css'));

const sw = _lies(_dazu(WURZEL, 'sw.js'), 'utf8');
p('sw.js kennt jedes Blatt — sonst fehlen sie offline',
  STILE.every(d => (sw ?? '').includes('quell/schale/stil/' + d)),
  STILE.filter(d => !(sw ?? '').includes('quell/schale/stil/' + d)).join(', '));

/* Und der eigentliche Punkt: in der Einzeldatei müssen alle sechs als
   <style> stehen und kein einziger <link> übrig sein. */
const einzel = _lies(_dazu(WURZEL, 'redion-einzeldatei.html'), 'utf8');
p('Die Einzeldatei hat kein <link rel="stylesheet"> mehr',
  !/<link rel="stylesheet"/.test(einzel));
STILE.forEach(datei => {
  p(datei + ' steckt eingebettet in der Einzeldatei',
    (einzel ?? '').includes('/* ===== quell/schale/stil/' + datei + ' ===== */'));
});

/* Gegenprobe wie oben: findet die Prüfung einen übriggebliebenen <link>? */
p('Und die Prüfung würde einen übrigen <link> merken',
  /<link rel="stylesheet"/.test('<link rel="stylesheet" href="x.css">'));

/* ------------------------------------------------------------------------ *
 * Jede Stildatei muss heile Kommentare haben — und das ist keine
 * Schönheitsfrage.
 *
 * Beim Aufteilen landete ein Schnitt einmal MITTEN in einem Banner. Die
 * neue Datei fing damit an:
 *
 *     KI-PANEL
 *     ========================================================== * /
 *     #ai{ … display:none … }
 *
 * Ein herrenloses Kommentarende, davor Text ohne Klammer. CSS bricht dabei
 * nicht ab, es RÄUMT AUF: der Parser überliest alles bis zum nächsten
 * abgeschlossenen Block — und verschluckt dabei die erste echte Regel.
 * `#ai` verlor sein `display:none`, das KI-Panel stand von da an offen im
 * Fenster, und keine Datei war kaputt, keine Meldung erschien, keine
 * Klammer war unausgeglichen. Nur das Bild stimmte nicht mehr.
 * ------------------------------------------------------------------------ */
STILE.forEach(datei => {
  const t = _lies(_dazu(WURZEL, 'quell/schale/stil', datei), 'utf8');
  const auf = (t.match(/\/\*/g) || []).length;
  const zu  = (t.match(/\*\//g) || []).length;
  p(datei + ': Kommentare gehen auf und wieder zu', auf === zu, `${auf} auf, ${zu} zu`);

  /* Und kein `*/` bevor irgendein `/*` kam — genau das war der Fall. */
  const ersteAuf = t.indexOf('/*');
  const ersteZu  = t.indexOf('*/');
  p(datei + ': kein herrenloses Kommentarende am Anfang',
    ersteZu < 0 || (ersteAuf >= 0 && ersteAuf < ersteZu));

  /* Klammern: fällt eine ganze Regel weg, merkt man es hier. */
  const ohne = t.replace(/\/\*[\s\S]*?\*\//g, ' ');
  p(datei + ': geschweifte Klammern sind ausgeglichen',
    (ohne.match(/\{/g) || []).length === (ohne.match(/\}/g) || []).length);
});

/* ========================================================================= *
 * 5 · DAS MANIFEST ZEIGT AUF ETWAS, DAS ES GIBT
 *
 * Hier lag eine weisse Seite begraben, und zwar eine, die kein Browserlauf
 * finden konnte: das Manifest liegt in oeffentlich/, seine Angaben waren aber
 * relativ geschrieben. Relative Adressen in einem Manifest lösen sich gegen
 * DEN ORT DES MANIFESTS auf, nicht gegen die Wurzel der Seite. Aus
 * "start_url": "./index.html" wurde damit /oeffentlich/index.html — eine
 * Adresse, die es nicht gibt.
 *
 * Die Folge sah man erst auf dem Telefon: die installierte App startete auf
 * einer 404 und zeigte eine weisse Fläche. Und weil "scope": "./" auf
 * /oeffentlich/ zeigte, lag die App unter / ausserhalb ihres eigenen
 * Geltungsbereichs — deshalb bot der Browser das Installieren nicht richtig
 * an. Im Browser am Rechner fiel nichts davon auf: dort ruft man index.html
 * direkt auf und das Manifest wird nur gelesen, nicht befolgt.
 * ========================================================================= */
console.log('\n— Das Manifest —');

const manifestPfad = 'oeffentlich/manifest.webmanifest';
const manifest = JSON.parse(_lies(_dazu(WURZEL, manifestPfad), 'utf8'));

/* So, wie der Browser es täte: gegen den Ort des Manifests auflösen. */
const BASIS = new URL(manifestPfad, 'https://beispiel.test/');
const aufloesen = (wert: any) => new URL(wert, BASIS).pathname;

/* Und dann nachsehen, ob unter dieser Adresse wirklich eine Datei liegt. */
const gibtEs = (pfad: any) => {
  try { _lies(_dazu(WURZEL, pfad.replace(/^\//, ''))); return true; } catch { return false; }
};

const start = aufloesen(manifest.start_url);
const bereich = aufloesen(manifest.scope);
p('start_url zeigt auf eine Datei, die es gibt', gibtEs(start), start);
p('scope umfasst die start_url', start.startsWith(bereich), `${start} liegt nicht unter ${bereich}`);
p('scope ist die Wurzel und nicht oeffentlich/', bereich === '/', bereich);

/* Hier stand `(i: number)`. Ein Symbol im Manifest ist aber kein Zahlwert,
   sondern ein Objekt mit `src` — die Angabe war schlicht falsch. Sie tat
   nichts, weil Node die Typen beim Ausführen wegwirft; ein Typecheck hätte
   den nächsten Zugriff auf ein weiteres Feld trotzdem falsch beurteilt. */
const kaputteIcons = manifest.icons
  .map((i: { src: string }) => aufloesen(i.src))
  .filter((pf: string) => !gibtEs(pf));
p('Jedes Symbol im Manifest liegt an seinem Platz', kaputteIcons.length === 0,
  kaputteIcons.join(', '));

const kaputteWege = [
  ...(manifest.shortcuts || []).map((s: any) => s.url),
  manifest.share_target?.action
].filter(Boolean).map(aufloesen).filter(pf => !gibtEs(pf.split('#')[0] ?? ''));
p('Abkürzungen und Teilen-Ziel zeigen ins Volle', kaputteWege.length === 0,
  kaputteWege.join(', '));

/* Gegenprobe: würde die Prüfung den alten Zustand merken? */
p('Und die Prüfung würde den alten Fehler merken',
  new URL('./index.html', BASIS).pathname === '/oeffentlich/index.html' &&
  !gibtEs('/oeffentlich/index.html'));

/* Die Startbilder fürs iPhone: jede Datei muss da sein UND die Masse haben,
   die in ihrer Medienabfrage stehen. Passt das nicht auf das Pixel genau,
   übergeht Safari das Bild wortlos. */
const kopf = _lies(_dazu(WURZEL, 'index.html'), 'utf8');
const startbilder = [...kopf.matchAll(
  /href="(oeffentlich\/icons\/start-[^"]+)"\s*\n?\s*media="\(device-width:(\d+)px\)\s*and\s*\(device-height:(\d+)px\)\s*and\s*\(-webkit-device-pixel-ratio:(\d+)\)"/g)];

p('Es sind Startbilder eingetragen', startbilder.length >= 5, String(startbilder.length));

startbilder.forEach(([, datei, br, ho, dpr]) => {
  /* Ohne Dateinamen im Treffer gäbe es keinen Treffer — trotzdem eine
     Prüfung und keine Behauptung, sonst stünde hier ein `!`. */
  if (!datei) { p('Ein Startbild-Treffer ohne Dateinamen', false); return; }
  const roh = _lies(_dazu(WURZEL, datei));
  const breite = roh.readUInt32BE(16), hoehe = roh.readUInt32BE(20);
  const sollB = Number(br) * Number(dpr), sollH = Number(ho) * Number(dpr);
  p(datei.split('/').pop() + ` misst ${sollB}×${sollH}`,
    breite === sollB && hoehe === sollH, `${breite}×${hoehe}`);
});

/* ---------------------------------------------------------------------------
 * JEDES esc MUSS AUCH DAS ANFÜHRUNGSZEICHEN ERSETZEN
 * ---------------------------------------------------------------------------
 * Fünfzig Module haben ihr eigenes `esc` — das ist die Folge davon, dass es
 * keine Bauschritte gibt und jede Datei für sich stehen soll. Zwanzig davon
 * ersetzten `&`, `<` und `>`, aber nicht `"`. Das ist harmlos zwischen zwei
 * Marken und ein Loch in einem Attribut:
 *
 *     `<input value="${esc(block.text)}">`
 *
 * Eine Beschriftung wie `" onfocus="…" autofocus="` schliesst dann `value`
 * und schreibt zwei eigene Attribute dahinter. Der Browser sieht kein
 * `<script>`, sondern ein gültiges `onfocus` — und führt es aus. In einer App
 * ohne Server heisst das: Zugriff auf alle Notizen und auf den KI-Schlüssel,
 * ausgelöst von einer eingelesenen Datei oder einer geteilten Seite.
 * Was das im Browser anrichtet, prüft test90. Hier steht die Vorbeugung: eine
 * neue Datei mit einem halben `esc` fällt beim nächsten Push auf, nicht erst,
 * wenn jemand ein Anführungszeichen tippt.
 *
 * DIE MESSUNG DAZU WAR SELBST EINMAL FALSCH und das gehört zur Prüfung: der
 * erste Ausdruck endete bei `[\s\S]{0,400}?;` — und das erste Semikolon steht
 * mitten in der Definition, nämlich in `'&amp;'`. Ergebnis: „0 von 50 Dateien
 * geschützt", obwohl es dreissig waren. Ein Semikolon in einer Zeichenkette
 * ist kein Ende einer Anweisung. Deshalb wird hier bis zum Semikolon am
 * ZEILENENDE gesucht.
 * ------------------------------------------------------------------------ */
console.log('\n— Jedes esc ersetzt auch das Anführungszeichen —');

const escDef = /const esc\s*=\s*\(\w+\)\s*=>[\s\S]{0,400}?;\s*$/m;

const alleQuellen = [];
(function sammle(ordner) {
  for (const eintrag of _liste(_dazu(WURZEL, ordner), { withFileTypes: true })) {
    const rein = ordner + '/' + eintrag.name;
    if (eintrag.isDirectory()) sammle(rein);
    else if (eintrag.name.endsWith('.js')) alleQuellen.push(rein);
  }
})('quell');

const ohneSchutz = alleQuellen.filter(datei => {
  const treffer = escDef.exec(_lies(_dazu(WURZEL, datei), 'utf8'));
  return treffer && !(treffer[0] ?? '').includes('&quot;');
});

p('Der Sucher findet die Definitionen überhaupt',
  alleQuellen.filter(d => escDef.test(_lies(_dazu(WURZEL, d), 'utf8'))).length >= 40);
p('Kein Modul hat ein esc ohne "-Schutz', ohneSchutz.length === 0,
  ohneSchutz.slice(0, 5).join(', '));

/* ---------------------------------------------------------------------------
 * DAS SCHEMA STEHT ZWEIMAL — UND MUSS ZWEIMAL GLEICH SEIN
 * ---------------------------------------------------------------------------
 * `server/schema.sql` legt die Tabellen in D1 an. `server/ablage.ts` trägt
 * dieselben noch einmal als Zeichenkette, weil ein Cloudflare-Arbeiter keine
 * Datei lesen kann — er muss das Schema mitbringen.
 *
 * Die Doppelung ist also nicht Nachlässigkeit, sondern nötig. Ungesichert ist
 * sie trotzdem gefährlich, und zwar auf die stillste Art: wer eine Spalte nur
 * in `schema.sql` ergänzt, bekommt einen Server, der lokal läuft und in der
 * Wolke eine Spalte weniger hat. Das fällt erst auf, wenn jemand sie braucht
 * — und dann sieht es nach einem Fehler an ganz anderer Stelle aus.
 *
 * Beim Anlegen der Bremse war genau das passiert: `bremse` stand zuerst nur
 * in `schema.sql`. Die Prüfung hier hat es gefunden, bevor es jemand merkte.
 * Nachgemessen war der Rest zu diesem Zeitpunkt vollständig gleich — die
 * beiden Kopien waren also nicht auseinandergelaufen, sie waren nur nicht
 * bewacht.
 * ------------------------------------------------------------------------ */
console.log('\n— Die zwei Schemata —');

const schemaDatei = _lies(_dazu(WURZEL, 'server/schema.sql'), 'utf8');
const ablageJs = _lies(_dazu(WURZEL, 'server/ablage.ts'), 'utf8');
const ausJs = (ablageJs.match(/`([\s\S]*?CREATE TABLE[\s\S]*?)`;/) || [, ''])[1] ?? '';

const tabellenVon = (text: string) =>
  [...text.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\n\);/g)]
    .reduce<Record<string, string[]>>((o, x) => {
      o[x[1] ?? ''] = (x[2] ?? '').split('\n').map(z => z.trim().replace(/,$/, ''))
        .filter(z => z && !z.startsWith('/*') && !z.startsWith('*'));
      return o;
    }, {});

const inDatei = tabellenVon(schemaDatei);
const inJs = tabellenVon(ausJs);

/* Zuerst: findet der Ausdruck überhaupt etwas? Eine Prüfung, die auf zwei
   leeren Listen „gleich" meldet, ist schlimmer als gar keine. */
p('Der Ausdruck findet die Tabellen in schema.sql', Object.keys(inDatei).length >= 9);
p('… und die in ablage.js', Object.keys(inJs).length >= 9);

const nurDatei = Object.keys(inDatei).filter(t => !inJs[t]);
const nurJs = Object.keys(inJs).filter(t => !inDatei[t]);
p('Keine Tabelle nur in schema.sql', nurDatei.length === 0, nurDatei.join(', '));
p('Keine Tabelle nur in ablage.js', nurJs.length === 0, nurJs.join(', '));

const anders = Object.keys(inDatei).filter(t =>
  inJs[t] && JSON.stringify(inDatei[t]) !== JSON.stringify(inJs[t]));
p('Alle Tabellen haben in beiden dieselben Spalten', anders.length === 0,
  anders.map(t => t + ': ' + (inDatei[t] ?? []).filter(x => !(inJs[t] ?? []).includes(x)).join('|')).join(' · '));

/* Und die Liste, gegen die der Kern prüft, muss dieselben Namen kennen —
   eine Tabelle, die im Schema steht und in TABELLEN fehlt, wird vom Server
   abgewiesen, obwohl sie da ist. */
const listeRoh = (ablageJs.match(/export const TABELLEN = \[([\s\S]*?)\];/) || [, ''])[1] ?? '';
const inListe = [...listeRoh.matchAll(/'([a-z_]+)'/g)].map(x => x[1]);
const fehlenInListe = Object.keys(inDatei).filter(t => !(inListe ?? '').includes(t));
p('TABELLEN kennt jede Tabelle des Schemas', fehlenInListe.length === 0,
  fehlenInListe.join(', '));

/* ========================================================================= *
 * KEIN GLOBALER NAME ZWEIMAL
 * ---------------------------------------------------------------------------
 * Diese App hat keinen Bauschritt: jede Datei wird als gewöhnliches
 * `<script src>` geladen, und jedes Modul ist ein globaler Name. Damit gilt
 * eine Regel, die sonst niemand kennt — **zwei Dateien dürfen nicht denselben
 * Namen deklarieren.** Ein zweites `const Fenster = …` wirft beim Laden
 * „Identifier 'Fenster' has already been declared", und zwar in der Datei,
 * die als ZWEITE kommt. Die stirbt dann vollständig; alles, was sie können
 * sollte, fehlt einfach.
 *
 * Genau das ist beim Bauen von `nachbarn.js` passiert: der Name `Fenster`
 * war schon von `schale/aufbau/reiter.js` belegt (den Reitern). Die Folge
 * war nicht etwa eine Fehlermeldung an der richtigen Stelle, sondern ein
 * `Fenster.gemerkt is not a function` mitten in der Seitenleiste — ein
 * Fehlerbild, das nirgends auf die Ursache zeigt.
 *
 * Achtzig Millisekunden, und diese Sorte Fehler kann nicht mehr passieren.
 * ========================================================================= */
console.log('\n8 · Jeder globale Name gehört genau einer Datei');

const htmlQuelle = _lies(_dazu(WURZEL, 'index.html'), 'utf8');
const skripte = [...htmlQuelle.matchAll(/<script src="(quell\/[^"]+)"/g)].map(m => m[1] ?? '');
p('index.html lädt Skripte, die gefunden werden', skripte.length > 50, `${skripte.length}`);

const wemGehoert = new Map();
const doppelt = [];
for (const rel of skripte) {
  const pfad = _dazu(WURZEL, rel);
  if (!_da(pfad)) { doppelt.push(rel + ' — Datei fehlt'); continue; }
  const inhalt = _lies(pfad, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  /* Nur Deklarationen am Zeilenanfang — alles Eingerückte steht in einer
     Funktion und ist damit nicht global. */
  for (const m of inhalt.matchAll(/^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    const name = m[1];
    if (wemGehoert.has(name) && wemGehoert.get(name) !== rel)
      doppelt.push(`${name}: ${wemGehoert.get(name)} und ${rel}`);
    else wemGehoert.set(name, rel);
  }
}
p('Kein globaler Name wird zweimal deklariert', doppelt.length === 0,
  doppelt.slice(0, 4).join(' · '));
console.log(`    (${wemGehoert.size} globale Namen über ${skripte.length} Dateien)`);

/* Und die Gegenrichtung, damit die Prüfung nicht aus Versehen nichts misst:
   sie muss die bekannten Namen auch wirklich finden. */
p('Der Ausdruck findet die grossen Module',
  ['Store', 'App', 'Nachbarn', 'Sanitize'].every(n => wemGehoert.has(n)),
  ['Store', 'App', 'Nachbarn', 'Sanitize'].filter(n => !wemGehoert.has(n)).join(', '));

/* Jede geladene Datei muss auch im sw.js stehen, sonst fehlt sie offline —
   und `.catch(() => {})` beim Ablegen verschluckt genau das stillschweigend. */
const swQuelle = _lies(_dazu(WURZEL, 'sw.js'), 'utf8');
const nichtImSw = skripte.filter(s => !(swQuelle ?? '').includes(s));
p('Jede Datei aus index.html steht auch im sw.js', nichtImSw.length === 0,
  nichtImSw.slice(0, 3).join(', '));

/* ========================================================================= *
 * 9 · KEINE VIERTE FASSUNG VON BASE64
 * ---------------------------------------------------------------------------
 * `btoa(String.fromCharCode(...bytes))` sieht harmlos aus und ist es für
 * kleine Puffer auch. Der Spread reicht jedes Byte als eigenen
 * Aufruf-Parameter weiter; ab etwa 128 000 Bytes ist der Aufrufstapel voll.
 *
 * Diese Zeile stand an drei Stellen — in der verschlüsselten Sicherung, in
 * der Seitensperre und im Abgleich. Also an genau den drei Stellen, an denen
 * verschlüsselt wird, und damit an genau den drei Stellen, an denen die
 * Datenmenge gross ist. Wer genug Notizen hatte, dass sich das Sichern
 * lohnte, konnte nicht sichern; die Meldung sprach dabei von Aufrufstapeln
 * und nicht von Grössen.
 *
 * Es gibt jetzt eine Fassung in `core/helpers/bytes.ts`. Diese Prüfung hält
 * fest, dass keine vierte danebenwächst — der wiederkehrende Befund dieses
 * Projekts ist nicht „etwas vergessen", sondern „an einer Stelle getan und
 * an der Nachbarstelle nicht".
 * ========================================================================= */
console.log('\n9 · Base64 gibt es nur an einer Stelle');

const HELFER = 'quell/core/helpers/bytes.js';
const mitSpread = [];
for (const s of skripte) {
  if (s === HELFER) continue;
  const quelle = nurCode(_lies(_dazu(WURZEL, s), 'utf8'));
  if (/fromCharCode\s*\(\s*\.\.\./.test(quelle)) mitSpread.push(s);
}
p('Niemand baut Base64 mit dem Spread', mitSpread.length === 0,
  mitSpread.join(', '));

/* Gegenprobe: der Helfer existiert und wird auch geladen. Eine Prüfung, die
   nur verbietet, ohne dass es eine Alternative gibt, treibt den nächsten
   Bearbeiter erst recht in die Wiederholung. */
p('Der Helfer für Base64 wird geladen', (skripte ?? '').includes(HELFER),
  skripte.filter(s => (s ?? '').includes('bytes')).join(', '));

console.log(`\n  Suite 52 — Quelltext: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
