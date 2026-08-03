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
 *     prüft die Oberflächenseite für sich, aber nie gegen server/kern.js.
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
import { readFileSync as _lies, readdirSync as _liste } from 'node:fs';
import { ROLLEN as SERVER, darf as serverDarf } from '../../server/kern.js';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

/* ========================================================================= *
 * 1 · KEINE ROHEN STEUERZEICHEN
 * ========================================================================= */
console.log('\n— Steuerzeichen im Quelltext —');

const alleDateien = (ordner) => _liste(ordner, { withFileTypes: true })
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

Object.keys(SERVER).forEach(r => {
  p(`„${r}" hat beidseitig denselben Rang`,
    OBEN.ROLLEN[r]?.rang === SERVER[r].rang,
    OBEN.ROLLEN[r]?.rang + ' gegen ' + SERVER[r].rang);
  p(`„${r}" darf beidseitig dasselbe`,
    JSON.stringify((OBEN.ROLLEN[r]?.darf || []).slice().sort()) ===
    JSON.stringify(SERVER[r].darf.slice().sort()),
    (OBEN.ROLLEN[r]?.darf || []).join(',') + ' gegen ' + SERVER[r].darf.join(','));
});

/* Die gefährliche Richtung eigens: ein Tabellenvergleich sagt nur
   „ungleich". Das hier sagt, dass die Oberfläche nirgends mehr erlaubt. */
const taten = [...new Set(Object.values(SERVER).flatMap(r => r.darf))];
const zuViel = [], zuWenig = [];
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
p('Und zwar von stark nach schwach',
  JSON.stringify(OBEN.REIHE.map(r => SERVER[r].rang)) === JSON.stringify([5, 4, 3, 2, 1]));
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
const nurCode = (text) => text
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
    .every(n => schale.includes(n)));

/* ========================================================================= *
 * 4 · DIE STILBLÄTTER SIND VOLLSTÄNDIG EINGEHÄNGT
 * Seit A3 sind es sechs statt einem. `bauen.js` ersetzte den <link> ohne
 * g-Flag, also nur den ERSTEN — mit sechs Stilblättern hätte die Einzeldatei
 * fünf tote <link> behalten. Sie wäre gestartet und unfertig gewesen: die
 * halbe Gestaltung fehlt, und nichts meldet einen Fehler. Genau wie bei der
 * fehlenden HTML-Säuberung merkt man so etwas nicht beim Durchklicken.
 * ========================================================================= */
console.log('\n— Die sechs Stilblätter —');

const STILE = ['marken.css', 'dunkel.css', 'hell.css', 'grund.css', 'aufbau.css',
               'datenbanken.css', 'ki.css', 'werkzeuge.css', 'ansichten.css',
               'einstellungen.css', 'bausteine.css'];
const html = _lies(_dazu(WURZEL, 'index.html'), 'utf8');
const verlinkt = [...html.matchAll(/<link rel="stylesheet" href="quell\/schale\/stil\/([^"]+)">/g)]
  .map(m => m[1]);

p('index.html lädt alle sechs, in der richtigen Folge',
  JSON.stringify(verlinkt) === JSON.stringify(STILE), verlinkt.join(', '));

STILE.forEach(datei => {
  const voll = _dazu(WURZEL, 'quell/schale/stil', datei);
  let da = true;
  try { _lies(voll); } catch { da = false; }
  p(datei + ' liegt an seinem Platz', da);
});

const sw = _lies(_dazu(WURZEL, 'sw.js'), 'utf8');
p('sw.js kennt alle sechs — sonst fehlen sie offline',
  STILE.every(d => sw.includes('quell/schale/stil/' + d)),
  STILE.filter(d => !sw.includes('quell/schale/stil/' + d)).join(', '));

/* Und der eigentliche Punkt: in der Einzeldatei müssen alle sechs als
   <style> stehen und kein einziger <link> übrig sein. */
const einzel = _lies(_dazu(WURZEL, 'redion-einzeldatei.html'), 'utf8');
p('Die Einzeldatei hat kein <link rel="stylesheet"> mehr',
  !/<link rel="stylesheet"/.test(einzel));
STILE.forEach(datei => {
  p(datei + ' steckt eingebettet in der Einzeldatei',
    einzel.includes('/* ===== quell/schale/stil/' + datei + ' ===== */'));
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

console.log(`\n  Suite 52 — Quelltext: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
