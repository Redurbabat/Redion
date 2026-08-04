/* Suite 54 — Die Werkzeug-Logik, in Node, ohne Browser
 * ----------------------------------------------------------------------------
 * Nach `dienst.js` der Datenbanken derselbe Schnitt für die Werkzeuge — aber
 * mit einem anderen Ergebnis, und das ist der Punkt dieses Laufs.
 *
 * `AUFGABEN.md` nimmt für A4 an, `wissen/werkzeuge.js` liesse sich wie
 * `steuerung.js` in eine rechnende und eine zeichnende Hälfte teilen. Vor dem
 * Schneiden nachgemessen: **stimmt nicht.** Alle vierzehn Abschnitte fassen
 * das Dokument an, zwischen 7 und 47 Mal. Es gibt keine rechnende Hälfte.
 *
 * Also wurde nicht geschnitten, sondern gesucht — nach den neun Stellen, die
 * wirklich nur rechnen. Genau die neun, bei denen man sich fragt, ob sie
 * richtig rechnen:
 *
 *   unscharf         findet „umb" das „Umbenennen"? und in welcher Reihenfolge?
 *   planen           kommt eine dreimal gewusste Karte in 6 Tagen wieder?
 *   alsMarkdown      bleibt eine Datenbank beim Hin und Zurück erhalten?
 *   ausMarkdown      kommt eine Tabelle am Dateiende noch an?
 *   statistikZahlen  ist die Lesezeit für eine leere Seite 1 oder 0?
 *   zeitKurz         heisst gestern 23:59 wirklich „Gestern"?
 *   sauber           was wird aus einem Titel mit einem Schrägstrich?
 *   istUnter         erkennt es einen Ring, bevor der Baum sich selbst frisst?
 *   datumLang        stimmt der Wochentag über eine Zeitzone hinweg?
 *
 * Das lässt sich hier in Millisekunden prüfen. In einem Browser liesse es
 * sich für die meisten dieser Fragen gar nicht prüfen: `planen` schreibt
 * seinen Termin in die Zukunft, und auf einen Tag zu warten ist kein Prüflauf.
 *
 * WIE: `dienst.js` ist ein gewöhnliches Skript, kein Modul. Es wird gelesen
 * und mit einer Attrappe für `Store` ausgewertet. Kein `document`, und
 * bewusst auch **kein `window`** — die Datei hängt sich nur an eines, wenn es
 * eines gibt. Steht hier keines, ist bewiesen, dass sie ohne auskommt.
 *
 *   node pruefungen/lauf/test89.mjs
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const gleich = (n, ist, soll) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

/* ========================================================================= *
 * DIE ATTRAPPE VON `Store`
 * ---------------------------------------------------------------------------
 * Ein Baum aus Blöcken, mehr braucht die Logik nicht. `addBlock` legt wirklich
 * an, damit `ausMarkdown` sich nachher nachlesen lässt — eine Attrappe, die
 * nur mitschreibt, würde die Reihenfolge und die Verschachtelung verlieren,
 * und genau die sind hier die Frage.
 * ========================================================================= */
const mach = () => {
  const bloecke = {};
  let lauf = 0;
  const neu = (parentId, type, felder = {}) => {
    const id = 'b' + (++lauf);
    bloecke[id] = Object.assign({ id, parentId, type, alive: true, content: [] }, felder);
    if (parentId && bloecke[parentId]) bloecke[parentId].content.push(id);
    return bloecke[id];
  };
  return {
    bloecke, neu,
    Store: {
      cache: { blocks: bloecke },
      now: () => '2026-08-03T10:00:00.000Z',
      getBlock: (id) => bloecke[id] || null,
      childrenOf: (id) => (bloecke[id]?.content || []).map(k => bloecke[k]).filter(b => b && b.alive),
      addBlock: (elter, type, felder) => neu(elter, type, felder),
      updateBlock: (id, felder) => Object.assign(bloecke[id] || {}, felder),
      kinderLeeren: (id) => { (bloecke[id]?.content || []).forEach(k => { if (bloecke[k]) bloecke[k].alive = false; });
                              if (bloecke[id]) bloecke[id].content = []; },
      baum: (id) => JSON.parse(JSON.stringify(bloecke[id] || null)),
      baumEinfuegen: (baum, elter) => { bloecke[baum.id] = baum; baum.parentId = elter;
                                        baum.alive = true; bloecke[elter].content.push(baum.id); }
    }
  };
};

const welt = mach();

const quelle = _lies(_dazu(WURZEL, 'quell/bereiche/wissen/dienst.js'), 'utf8');
let Dienst = null, ladefehler = null;
try {
  Dienst = new Function('Store', quelle + '\nreturn WissenDienst;')(welt.Store);
} catch (e) { ladefehler = e.message; }

/* ========================================================================= *
 * 1 · LÄDT SIE ÜBERHAUPT?
 * ========================================================================= */
console.log('\n1 · Ohne Fenster ladbar');
p('dienst.js lädt in Node ohne document und ohne window', !!Dienst, ladefehler || '');
if (!Dienst) { console.log('\n  Suite 54: Abbruch — ohne das Modul gibt es nichts zu prüfen.');
               process.exit(1); }

p('typeof document ist hier wirklich undefined', typeof document === 'undefined');
p('typeof window ist hier wirklich undefined', typeof window === 'undefined');

/* Was drin steht, soll auch angeboten werden — sonst ist der Umzug
   unvollständig und `werkzeuge.js` bekommt beim Auspacken ein undefined,
   das erst viel später auffällt. */
for (const name of ['esc', 'heute', 'datumLang', 'unscharf', 'zeitKurz', 'planen',
                    'alsMarkdown', 'ausMarkdown', 'statistikZahlen', 'sauber', 'istUnter'])
  p(`${name} wird angeboten`, typeof Dienst[name] === 'function');
p('WOCHENTAG hat sieben Einträge', Dienst.WOCHENTAG?.length === 7);
p('MONAT hat zwölf Einträge', Dienst.MONAT?.length === 12);

/* Die Datei darf nichts anfassen, was ein Fenster bräuchte. Der Kommentar
   oben behauptet das — hier wird es gelesen statt geglaubt. */
const ohneKommentare = quelle.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const verboten of ['document', 'App.', 'UI.', 'Links.', 'Blocks.'])
  p(`Der Quelltext sagt nirgends „${verboten}"`, !ohneKommentare.includes(verboten));
p('Der Quelltext nennt window nur in der Absicherung am Ende',
  (ohneKommentare.match(/window/g) || []).length === 2);

/* ========================================================================= *
 * 2 · DIE UNSCHARFE SUCHE
 * ---------------------------------------------------------------------------
 * Das ist der Grund, warum es sie gibt: Notions Palette sucht wörtlich.
 * ========================================================================= */
console.log('\n2 · Die unscharfe Suche der Befehlspalette');

const u = (text, suche) => Dienst.unscharf(text, suche);

p('„umb" findet „Umbenennen" — genau das, was Notion nicht kann', u('Umbenennen', 'umb') > 0);
p('Leere Suche wertet nichts', u('Umbenennen', '') === 0);
p('Was gar nicht vorkommt, fällt raus', u('Umbenennen', 'xyz') === -1);

/* Die Rangfolge ist der eigentliche Inhalt: gleich > Anfang > Wortanfang >
   irgendwo > Buchstabensprung. Wer eine dieser Stufen vertauscht, bekommt
   eine Palette, die formal funktioniert und sich falsch anfühlt. */
p('Ein voller Treffer schlägt alles', u('Seite', 'Seite') > u('Seitenleiste', 'Seite'));
p('Am Anfang schlägt in der Mitte',
  u('Seitenleiste ausblenden', 'seiten') > u('Neue Seitenleiste', 'seiten'));
p('Am Wortanfang schlägt mittendrin',
  u('Neue Seite anlegen', 'seite') > u('Voreingestellte', 'einge'));
p('Buchstabensprünge sind die letzte Wahl',
  u('Umbenennen', 'umb') > u('Und mehr Bilder', 'umb'));

/* Zwei gleich gute Treffer: der kürzere Name gewinnt. Sonst steht „Seite in
   Datenbank umwandeln" über „Seite". */
p('Bei gleichem Rang gewinnt der kürzere Name',
  u('Seite', 'sei') > u('Seite in Datenbank umwandeln', 'sei'));

/* Zusammenhängende Buchstaben zählen mehr als verstreute — sonst wäre die
   Reihenfolge unter den Sprungtreffern Zufall. */
p('Zusammenhängend schlägt verstreut',
  u('xxabc', 'abc') > u('axbxc', 'abc'));

p('Gross und klein spielt keine Rolle', u('UMBENENNEN', 'umb') === u('umbenennen', 'UMB'));

/* ========================================================================= *
 * 3 · DAS WIEDERHOLUNGSVERFAHREN (SM-2)
 * ---------------------------------------------------------------------------
 * Hier steht die Frage, die man im Browser nicht stellen kann, ohne zu warten.
 * ========================================================================= */
console.log('\n3 · Karteikarten: SM-2');

/* DIE SKALA IST VIERSTUFIG, nicht fünfstufig: die Knöpfe heissen „Nochmal",
   „Schwer", „Gut", „Leicht" — 1 bis 4. Deshalb steht in der Datei `(4 - note)`
   und nicht SuperMemos `(5 - q)`. Das ist richtig übertragen: „Leicht" (4)
   macht die Karte leichter, „Gut" (3) lässt sie, wie sie ist.
   Wer den Lauf für eine fünfstufige Skala schreibt, bekommt 16 statt 15 und
   hält den Unterschied für einen Fehler. Das ist hier passiert. */
const tage = (sr) => Math.round((new Date(sr.faellig) - Date.now()) / 86400000);
const lerne = (noten) => {
  const k = welt.neu(null, 'flashcard', { text: 'Frage' });
  let sr;
  for (const n of noten) sr = Dienst.planen(welt.Store.getBlock(k.id), n);
  return sr;
};

gleich('Einmal gewusst: in einem Tag wieder', lerne([3]).intervall, 1);
gleich('Zweimal gewusst: in sechs Tagen', lerne([3, 3]).intervall, 6);

/* 6 × 2.5 = 15. Wer hier `ease` vor dem Intervall fortschreibt, bekommt 16 —
   und niemand merkt es. */
gleich('Dreimal „Gut": sechs Tage mal Leichtigkeit', lerne([3, 3, 3]).intervall, 15);

gleich('„Gut" lässt die Leichtigkeit, wie sie ist', lerne([3, 3, 3]).ease, 2.5);
p('„Leicht" macht die Karte leichter', lerne([4, 4]).ease > 2.5);
p('Dreimal „Leicht" kommt später wieder als dreimal „Gut"',
  lerne([4, 4, 4]).intervall > lerne([3, 3, 3]).intervall);

const vergessen = lerne([3, 3, 3, 1]);
gleich('Vergessen setzt die Zählung zurück', vergessen.wdh, 0);
gleich('Vergessen heisst: gleich nochmal', vergessen.intervall, 0);
p('„Gleich nochmal" sind zehn Minuten, kein neuer Tag',
  new Date(vergessen.faellig) - Date.now() < 11 * 60000);
gleich('„Schwer" schickt die Karte auf morgen, nicht auf gleich',
  lerne([3, 3, 2]).intervall, 1);

/* VERGESSEN LÄSST DIE LEICHTIGKEIT UNBERÜHRT, und das ist Absicht, keine
   vergessene Zeile. SM-2 Schritt 7 sagt wörtlich: bei einer Note unter 3
   „start repetitions for the item from the beginning **without changing the
   E-Factor**". Anki macht es anders und zieht 20 % ab; beide Lesarten sind
   verbreitet. Diese Datei folgt der ursprünglichen.
   Die Prüfung steht hier, damit niemand die Zeile später „repariert", ohne zu
   merken, dass er damit die Termine aller vorhandenen Karten verschiebt. */
gleich('Vergessen lässt die Leichtigkeit unberührt (SM-2 Schritt 7)',
  lerne([4, 4, 1]).ease, lerne([4, 4]).ease);

p('Die Leichtigkeit fällt nie unter 1.3 — sonst käme die Karte ewig wieder',
  lerne([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]).ease >= 1.3);

p('Der Termin der ersten Wiederholung liegt einen Tag voraus', tage(lerne([3])) === 1);
p('Der Zeitstempel „zuletzt" wird gesetzt', !!lerne([3]).zuletzt);

/* Eine neue Karte hat kein `sr`. Der Vorgabewert muss greifen, sonst rechnet
   der erste Durchgang mit undefined und liefert NaN als Termin. */
const frisch = Dienst.planen({ id: welt.neu(null, 'flashcard').id }, 3);
p('Eine Karte ohne Vorgeschichte bekommt Vorgabewerte',
  frisch.ease === 2.5 && frisch.wdh === 1 && !Number.isNaN(new Date(frisch.faellig).getTime()));

/* ========================================================================= *
 * 4 · MARKDOWN HIN UND ZURÜCK
 * ========================================================================= */
console.log('\n4 · Markdown');

const seite = welt.neu(null, 'page', { text: 'Test' });
welt.neu(seite.id, 'h1', { text: 'Überschrift' });
welt.neu(seite.id, 'bullet', { text: 'Ein Punkt' });
welt.neu(seite.id, 'todo', { text: 'Offen', checked: false });
welt.neu(seite.id, 'todo', { text: 'Erledigt', checked: true });
welt.neu(seite.id, 'code', { text: 'let a = 1;', lang: 'js' });
welt.neu(seite.id, 'divider');
welt.neu(seite.id, 'quote', { text: 'Zitat' });
welt.neu(seite.id, 'database', { text: 'Tabelle' });

const md = Dienst.alsMarkdown(seite);
p('Eine Überschrift wird zu #', md.includes('# Überschrift'));
p('Ein Punkt wird zu -', md.includes('- Ein Punkt'));
p('Offen wird zu [ ]', md.includes('- [ ] Offen'));
p('Erledigt wird zu [x]', md.includes('- [x] Erledigt'));
p('Code bekommt seine Sprache mit', md.includes('```js') && md.includes('let a = 1;'));
p('Ein Trenner wird zu ---', md.includes('---'));
p('Ein Zitat wird zu >', md.includes('> Zitat'));

/* Der wichtigste Punkt der ganzen Datei: eine Datenbank darf beim Umweg über
   den Text nicht verschwinden. Sie steht als Platzhalter drin. */
p('Eine Datenbank steht als Platzhalter, nicht als Text', /<!--db:b\d+-->/.test(md));

/* --- und zurück --- */
const zurueck = welt.neu(null, 'page', { text: 'Rück' });
const dbAlt = welt.neu(zurueck.id, 'database', { text: 'Bleibt' });
Dienst.ausMarkdown(zurueck, [
  '# Titel',
  '- Punkt',
  '- [x] Fertig',
  '1. Erstens',
  '> 💡 Hinweis',
  '$$E=mc^2$$',
  '![Bild](bild.png)',
  '?? Frage',
  '<!--db:' + dbAlt.id + '-->',
  '| A | B |',
  '|---|---|',
  '| 1 | 2 |'
].join('\n'));

const arten = welt.Store.childrenOf(zurueck.id).map(b => b.type);
p('# wird wieder eine Überschrift', arten.includes('h1'));
p('- wird wieder ein Punkt', arten.includes('bullet'));
p('[x] wird wieder ein erledigtes Todo',
  welt.Store.childrenOf(zurueck.id).some(b => b.type === 'todo' && b.checked === true));
p('1. wird wieder eine Nummer', arten.includes('number'));
p('> 💡 wird wieder ein Hinweis', arten.includes('callout'));
p('$$…$$ wird wieder eine Formel', arten.includes('equation'));
p('![…](…) wird wieder ein Bild', arten.includes('image'));
p('?? wird wieder eine Karteikarte', arten.includes('flashcard'));

/* Der Platzhalter muss die alte Datenbank wiederfinden — sonst ist
   „Quelltext ansehen und schliessen" ein stiller Datenverlust. */
p('Der Platzhalter holt dieselbe Datenbank zurück',
  welt.Store.childrenOf(zurueck.id).some(b => b.id === dbAlt.id));

/* Die Tabelle steht am Dateiende. Genau da geht sie verloren, wenn niemand
   nach der letzten Zeile noch einmal abschliesst. */
const tab = welt.Store.childrenOf(zurueck.id).find(b => b.type === 'table');
p('Eine Tabelle am Dateiende kommt noch an', !!tab);
gleich('Die Kopfzeile der Tabelle steht drin', tab?.rows?.[0], ['A', 'B']);
gleich('Die Werte der Tabelle stehen drin', tab?.rows?.[1], ['1', '2']);

/* Ungleich lange Zeilen: kürzere werden aufgefüllt, nicht abgeschnitten.
   „Nichts wegwerfen, was nach Inhalt aussieht." */
const schief = welt.neu(null, 'page', { text: 'Schief' });
Dienst.ausMarkdown(schief, '| A | B | C |\n|---|---|---|\n| 1 |\n');
const st = welt.Store.childrenOf(schief.id).find(b => b.type === 'table');
gleich('Eine zu kurze Tabellenzeile wird aufgefüllt, nicht gekappt',
  st?.rows?.[1], ['1', '', '']);

/* Ein nicht geschlossener Codeblock am Dateiende: der Inhalt bleibt. */
const offen = welt.neu(null, 'page', { text: 'Offen' });
Dienst.ausMarkdown(offen, '```js\nlet a = 1;\n');
const cb = welt.Store.childrenOf(offen.id).find(b => b.type === 'code');
p('Ein nicht geschlossener Codeblock verliert seinen Inhalt nicht',
  cb?.text?.includes('let a = 1;'));
gleich('Ein nicht geschlossener Codeblock behält seine Sprache', cb?.lang, 'js');

/* ========================================================================= *
 * 5 · DIE SCHREIBSTATISTIK
 * ========================================================================= */
console.log('\n5 · Schreibstatistik');

const sSeite = welt.neu(null, 'page', { text: 'Der Titel' });
welt.neu(sSeite.id, 'text', { text: 'Ein Satz mit fünf Wörtern. Und noch einer!' });
const unter = welt.neu(sSeite.id, 'text', { text: 'Verschachtelt zählt mit.' });
welt.neu(unter.id, 'text', { text: 'Auch zwei Ebenen tiefer.' });

const z = Dienst.statistikZahlen(sSeite);
gleich('Wörter werden als Anzahl geliefert, nicht als Liste', typeof z.woerter, 'number');
p('Der Seitentitel zählt mit', z.woerter >= 15);
p('Verschachtelte Blöcke zählen mit', z.woerter >= 15 && z.blockAnzahl === 3);
gleich('Sätze werden gezählt', typeof z.saetze, 'number');
p('Zeichen werden gezählt', z.zeichen > 50);
p('Die Lesezeit ist nie null — eine Seite liest sich nicht in null Minuten',
  Dienst.statistikZahlen(welt.neu(null, 'page', { text: '' })).lesezeit === 1);
p('Vorlesen dauert länger als Lesen', z.sprechzeit >= z.lesezeit);
p('Die häufigsten Wörter sind eine Liste von Paaren',
  Array.isArray(z.top) && z.top.every(e => Array.isArray(e) && e.length === 2));
p('Höchstens zwölf häufigste Wörter', z.top.length <= 12);

/* Füllwörter dürfen die Liste nicht anführen — sonst steht dort auf jeder
   Seite dasselbe. */
const fuell = welt.neu(null, 'page', { text: '' });
welt.neu(fuell.id, 'text', { text: ('und oder aber ').repeat(20) + 'Dachziegel '.repeat(3) });
const zf = Dienst.statistikZahlen(fuell);
gleich('Füllwörter stehen nicht in den häufigsten Wörtern',
  zf.top.map(e => e[0]), ['dachziegel']);

p('Der ganze Arbeitsbereich wird mitgezählt', z.alleW > z.woerter);

/* ========================================================================= *
 * 6 · DIE KLEINEN HELFER
 * ========================================================================= */
console.log('\n6 · Datum, Dateinamen, Ringe');

gleich('heute liefert ein Datum in der Form JJJJ-MM-TT',
  /^\d{4}-\d{2}-\d{2}$/.test(Dienst.heute()), true);

/* Mittags statt Mitternacht — sonst kippt der Wochentag westlich von
   Greenwich um einen Tag. Genau dafür steht T12:00:00 in der Datei. */
gleich('Der 3. August 2026 war ein Montag',
  Dienst.datumLang('2026-08-03'), 'Montag, 3. August 2026');
gleich('Der 1. Januar 2026 war ein Donnerstag',
  Dienst.datumLang('2026-01-01'), 'Donnerstag, 1. Januar 2026');

/* EINE STUNDE ZURÜCK WAR ES NICHT. Läuft dieser Lauf zwischen Mitternacht
   und ein Uhr, liegt „vor einer Stunde" gestern — und die Prüfung fiel um,
   ohne dass am Code etwas falsch war. Einmal am Tag rot ist schlimmer als
   nie rot, weil man rotem Rauschen irgendwann nicht mehr glaubt.

   Eine Sekunde zurück ist immer derselbe Tag, ausser in der ersten Sekunde
   des Tages — und der Fall, um den es eigentlich geht, steht darunter
   ausdrücklich. */
const jetzt = new Date();
/* Fünf Minuten wären zwischen 00:00 und 00:05 noch immer gestern — eine
   Sekunde nur in der allerersten Sekunde des Tages. Und wenn es doch
   einmal umfällt, steht der Wert daneben, statt dass man raten muss. */
const vorhin = new Date(jetzt.getTime() - 1000).toISOString();
p('Heute heisst „Heute"', Dienst.zeitKurz(vorhin).startsWith('Heute'),
  Dienst.zeitKurz(vorhin));
const gestern = new Date(jetzt.getTime() - 30 * 3600000).toISOString();
p('Gestern heisst „Gestern" oder trägt ein Datum',
  /^(Gestern|\d)/.test(Dienst.zeitKurz(gestern)));
gleich('Ohne Zeitstempel bleibt das Feld leer', Dienst.zeitKurz(''), '');
gleich('Ohne Zeitstempel bleibt das Feld auch bei undefined leer',
  Dienst.zeitKurz(undefined), '');

gleich('Ein Schrägstrich im Titel wird zum Strich',
  Dienst.sauber('Notizen/2026'), 'Notizen-2026');
gleich('Alle für Dateinamen verbotenen Zeichen werden ersetzt',
  Dienst.sauber('a\\b:c*d?e"f<g>h|i'), 'a-b-c-d-e-f-g-h-i');
gleich('Ein leerer Titel bekommt einen Namen', Dienst.sauber(''), 'Seite');
p('Ein sehr langer Titel wird gekürzt, nicht verworfen',
  Dienst.sauber('x'.repeat(200)).length === 80);

/* istUnter schützt beim Verschieben vor einem Ring. Bricht es ab, frisst der
   Baum sich selbst — und zwar in einer Endlosschleife, nicht mit einem
   Fehler, der jemandem auffiele. */
const a = welt.neu(null, 'page', { text: 'A' });
const b = welt.neu(a.id, 'page', { text: 'B' });
const c = welt.neu(b.id, 'page', { text: 'C' });
p('C hängt unter B', Dienst.istUnter(c.id, b.id));
p('C hängt auch unter A', Dienst.istUnter(c.id, a.id));
p('A hängt nicht unter C', !Dienst.istUnter(a.id, c.id));

/* Ein Ring von Hand gebaut: die Prüfung muss trotzdem zurückkommen. */
welt.bloecke[a.id].parentId = c.id;
const uhr = Date.now();
Dienst.istUnter(c.id, 'gibtesnicht');
p('Ein Ring im Baum führt nicht in eine Endlosschleife', Date.now() - uhr < 100);
welt.bloecke[a.id].parentId = null;

gleich('esc macht aus spitzen Klammern Entities',
  Dienst.esc('<b>&"'), '&lt;b&gt;&amp;&quot;');
gleich('esc verträgt null', Dienst.esc(null), '');

console.log(`\n  Suite 54 — Werkzeug-Logik: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
