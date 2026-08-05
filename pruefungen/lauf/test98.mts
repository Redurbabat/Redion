/* Suite 63 — Der Versionsverlauf reicht zurück
 * ----------------------------------------------------------------------------
 * `KONSTANTEN.VERSIONEN_MAX: 200` stand da und wurde von niemandem gelesen.
 * `versionSpeichern` schnitt hart bei `slice(30)`, der Aufräumknopf in den
 * Einstellungen bei `slice(5)`. **Drei Zahlen, drei Meinungen** — und die
 * Konstante war die einzige, an die sich niemand hielt.
 *
 * Die Frage in `LUECKEN.md` lautete: welche Zahl gilt? Beim Nachmessen war es
 * die falsche Frage.
 *
 * ─── WARUM 30 NICHT „ETWAS WENIG" IST, SONDERN DER FEHLER ───────────────────
 *
 * Eine Fassung entsteht **alle vier Minuten** (`werkzeuge.js`,
 * `versionAutomatisch`). Wer einen Nachmittag an einer Seite arbeitet,
 * erzeugt dreissig davon. Am Abend steht ein Verlauf mit dreissig Einträgen
 * da — und reicht **zwei Stunden** zurück. Die Fassung von letzter Woche,
 * wegen der man einen Verlauf überhaupt hat, war still weg.
 *
 * Es sah aus, als sei alles da. Das ist an dem Fehler das Teure: die Liste
 * ist voll, die Zahl stimmt, und trotzdem ist die Frage „wie sah das vor dem
 * Umbau aus?" nicht mehr zu beantworten.
 *
 * ─── DIE REGEL JETZT ────────────────────────────────────────────────────────
 *
 * Ausdünnen statt abschneiden — von neu nach alt:
 *
 *   1. die jüngsten zwölf bleiben unangetastet
 *   2. dann eine je Tag, dreissig Tage lang
 *   3. dann eine je Monat
 *   4. von Hand gesicherte Fassungen bleiben **immer**
 *   5. darüber die harte Grenze 200 — und die nimmt nur automatische
 *
 * Derselbe Platz, ein Verlauf, der zurückreicht.
 *
 * ─── UND DER KNOPF ──────────────────────────────────────────────────────────
 *
 * „Alte Versionen aufräumen" behielt fünf Fassungen je Seite und löschte den
 * Rest — ohne Rückfrage, endgültig, mit einem Klick. Er wendet jetzt dieselbe
 * Regel an und fragt vorher, mit der Zahl, um die es geht.
 *
 * Geprüft wird die Rechnung mit einer **erfundenen Liste**: einen Nachmittag
 * Arbeit zu tippen dauert einen Nachmittag, eine Liste zu bauen eine
 * Millisekunde. Was die Rechnung nicht abdeckt — dass sie überhaupt gerufen
 * wird —, prüft Abschnitt 3 an der echten Ablage.
 *
 *   node pruefungen/lauf/test98.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8807;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };
const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const kontext = await browser.newContext();
const seite = await kontext.newPage();
const fehler: any[] = [];
seite.on('pageerror', e => fehler.push(e.message));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined',
                            null, { timeout: 20000 });

const hatRegel = await seite.evaluate(() => typeof Store.fassungenAusduennen === 'function');
p('Store kennt die Regel (fassungenAusduennen)', hatRegel);
if (!hatRegel) {
  console.log('\n  (Alles Weitere braucht die neue Fassung von indexdb.js.)');
  console.log(`\n  Suite 63 — Der Verlauf: ${ok} ok, ${weg} offen`);
  await browser.close(); server.close(); process.exit(1);
}

/* ========================================================================= *
 * 1 · DER NACHMITTAG — UND DIE WOCHE DAVOR
 * ========================================================================= */
console.log('\n1 · Ein Nachmittag Arbeit frisst nicht den Monat davor');

const nachmittag = await seite.evaluate(() => {
  /* 40 Fassungen von heute, im Abstand von vier Minuten … */
  const heute = new Date('2026-06-30T18:00:00.000Z').getTime();
  const liste = [];
  for (let i = 0; i < 40; i++)
    liste.push({ id: 'heute' + i, anlass: 'automatisch',
                 zeit: new Date(heute - i * 4 * 60000).toISOString() });
  /* … und je eine an den 30 Tagen davor. */
  for (let t = 1; t <= 30; t++)
    liste.push({ id: 'tag' + t, anlass: 'automatisch',
                 zeit: new Date(heute - t * 86400000).toISOString() });
  /* … und eine aus jedem der sechs Monate davor. */
  for (let m = 1; m <= 6; m++)
    liste.push({ id: 'monat' + m, anlass: 'automatisch',
                 zeit: new Date(heute - (30 + m * 31) * 86400000).toISOString() });

  const weg = Store.fassungenAusduennen(liste);
  const bleibt = liste.filter(v => !(weg ?? '').includes(v.id)).map(v => v.id);
  return { gesamt: liste.length, weg: weg.length, bleibt };
});

gleich('Die Liste hat 76 Fassungen', nachmittag.gesamt, 76);
p('Die zwölf jüngsten bleiben vollständig',
  ['heute0','heute1','heute5','heute11'].every(x => (nachmittag.bleibt ?? '').includes(x)),
  JSON.stringify(nachmittag.bleibt.slice(0, 14)));
p('Vom Nachmittag bleibt danach nur eine je Tag',
  nachmittag.bleibt.filter(x => x.startsWith('heute')).length === 13,
  `${nachmittag.bleibt.filter(x => x.startsWith('heute')).length} statt 13`);

/* Das ist der Kern: der Monat davor überlebt den Nachmittag. */
p('ALLE dreissig Tage davor bleiben',
  Array.from({ length: 30 }, (_, i) => 'tag' + (i + 1)).every(x => (nachmittag.bleibt ?? '').includes(x)),
  'genau die hat slice(30) weggeworfen');
p('Und die sechs Monate davor auch',
  Array.from({ length: 6 }, (_, i) => 'monat' + (i + 1)).every(x => (nachmittag.bleibt ?? '').includes(x)));

/* Zum Vergleich, was die alte Regel getan hätte. Kein Prüfpunkt, eine Zahl. */
const alt = await seite.evaluate(() => {
  const heute = new Date('2026-06-30T18:00:00.000Z').getTime();
  const liste = [];
  for (let i = 0; i < 40; i++) liste.push({ zeit: new Date(heute - i * 4 * 60000).toISOString() });
  for (let t = 1; t <= 30; t++) liste.push({ zeit: new Date(heute - t * 86400000).toISOString() });
  return liste.slice(0, 30).map(v => v.zeit).pop();
});
/* Kein Prüfpunkt, nur eine Zahl — eine leere Liste soll man trotzdem sehen. */
console.log(`    (slice(30) hätte bis ${alt ? alt.slice(0, 16) : '(nichts)'} zurückgereicht — zwei Stunden.)`);

/* ========================================================================= *
 * 2 · WAS EIN MENSCH SELBST GESICHERT HAT, BLEIBT
 * ========================================================================= */
console.log('\n2 · Von Hand gesicherte Fassungen bleiben');

const vonHand = await seite.evaluate(() => {
  const heute = new Date('2026-06-30T18:00:00.000Z').getTime();
  const liste = [];
  /* VIERZEHN FRISCHE VORNEWEG — sonst prüft der Fall etwas anderes, als er
     behauptet. Die ersten zwölf sind ohnehin unantastbar (Regel 1); ohne
     einen frischen Vorlauf fielen die alten Fassungen darunter und blieben
     aus dem falschen Grund liegen. Der erste Entwurf dieses Abschnitts hat
     genau das gemessen und „11 statt 1" gemeldet. */
  for (let i = 0; i < 14; i++)
    liste.push({ id: 'heute' + i, anlass: 'automatisch',
                 zeit: new Date(heute - i * 4 * 60000).toISOString() });
  /* Zwanzig automatische an ein und demselben alten Tag … */
  for (let i = 0; i < 20; i++)
    liste.push({ id: 'auto' + i, anlass: 'automatisch',
                 zeit: new Date(heute - 200 * 86400000 - i * 60000).toISOString() });
  /* … und drei, die jemand ausdrücklich gesichert hat. */
  liste.push({ id: 'hand1', anlass: 'von Hand',
               zeit: new Date(heute - 200 * 86400000 - 30000).toISOString() });
  liste.push({ id: 'hand2', anlass: 'vor Wiederherstellung',
               zeit: new Date(heute - 200 * 86400000 - 40000).toISOString() });
  liste.push({ id: 'hand3', anlass: 'vor Quelltext-Änderung',
               zeit: new Date(heute - 400 * 86400000).toISOString() });

  const weg = Store.fassungenAusduennen(liste);
  const bleibt = liste.filter(v => !(weg ?? '').includes(v.id)).map(v => v.id);
  return { bleibt, weg };
});

p('Die drei von Hand gesicherten bleiben alle',
  ['hand1','hand2','hand3'].every(x => (vonHand.bleibt ?? '').includes(x)),
  JSON.stringify(vonHand.bleibt));
p('Von zwanzig automatischen desselben Tages bleibt eine',
  vonHand.bleibt.filter(x => x.startsWith('auto')).length === 1,
  `${vonHand.bleibt.filter(x => x.startsWith('auto')).length} statt 1`);

/* Auch die harte Grenze darf sie nicht holen. */
const vieleVonHand = await seite.evaluate(() => {
  const heute = new Date('2026-06-30T18:00:00.000Z').getTime();
  const liste = [];
  for (let i = 0; i < 260; i++)
    liste.push({ id: 'h' + i, anlass: 'von Hand',
                 zeit: new Date(heute - i * 86400000).toISOString() });
  const weg = Store.fassungenAusduennen(liste);
  return weg.length;
});
gleich('260 von Hand gesicherte überleben auch die Grenze von 200', vieleVonHand, 0);

/* Und die Grenze greift, wenn es wirklich zu viele automatische sind:
   zehn Jahre, jeden Tag eine — das Ausdünnen allein reicht dann nicht. */
const grenze = await seite.evaluate(() => {
  const heute = new Date('2026-06-30T18:00:00.000Z').getTime();
  const liste = [];
  for (let i = 0; i < 4000; i++)
    liste.push({ id: 'a' + i, anlass: 'automatisch',
                 zeit: new Date(heute - i * 86400000).toISOString() });
  const weg = Store.fassungenAusduennen(liste);
  return { bleibt: liste.length - weg.length };
});
p('Bei zehn Jahren täglicher Arbeit greift die Grenze', grenze.bleibt <= 200,
  `${grenze.bleibt} bleiben`);
p('… und sie schneidet nicht zu tief', grenze.bleibt >= 40, `${grenze.bleibt} bleiben`);

/* Die Gegenrichtung: eine kurze Liste bleibt unangetastet. Wer drei Fassungen
   hat, soll nicht plötzlich zwei haben. */
const kurz = await seite.evaluate(() => Store.fassungenAusduennen([
  { id: 'a', anlass: 'automatisch', zeit: '2026-06-30T18:00:00.000Z' },
  { id: 'b', anlass: 'automatisch', zeit: '2026-06-30T17:56:00.000Z' },
  { id: 'c', anlass: 'automatisch', zeit: '2026-06-30T17:52:00.000Z' }
]).length);
gleich('Drei Fassungen bleiben drei', kurz, 0);
gleich('Eine leere Liste ergibt nichts', await seite.evaluate(() =>
  Store.fassungenAusduennen([]).length), 0);
gleich('Eine kaputte Zeitangabe wird nicht angefasst', await seite.evaluate(() =>
  Store.fassungenAusduennen(Array.from({ length: 20 }, (_, i) =>
    ({ id: 'x' + i, anlass: 'automatisch', zeit: 'gestern' }))).length), 0);

/* ========================================================================= *
 * 3 · AN DER ECHTEN ABLAGE — WIRD DIE REGEL AUCH GERUFEN?
 * ========================================================================= */
console.log('\n3 · Speichern wendet die Regel an');

const echt = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Viel bearbeitet' });
  Store.addBlock(s.id, 'text', { text: 'Inhalt' });
  /* Zwanzig Fassungen in Folge — mit slice(30) blieben alle zwanzig, mit der
     neuen Regel ebenfalls: zwölf frisch, der Rest fällt auf denselben Tag,
     davon bleibt eine. Also 13. */
  for (let i = 0; i < 20; i++) await Store.versionSpeichern(s.id, 'automatisch');
  await Store.flush();
  return { anzahl: (await Store.versionen(s.id)).length, seiteId: s.id };
});
p('Nach zwanzig Fassungen an einem Tag bleiben dreizehn', echt.anzahl === 13,
  `${echt.anzahl} — die Regel wird beim Speichern nicht angewandt`);

/* Und die von Hand gesicherte überlebt das Speichern der nächsten zwanzig. */
const handEcht = await seite.evaluate(async ([id]) => {
  const merk = await Store.versionSpeichern(id, 'von Hand');
  /* Kommt hier nichts zurück, gibt es nichts zu suchen — dann muss die Zeile
     rot werden und darf nicht ohne Prüfung bestehen. */
  if (!merk) return { da: false, gesamt: 0, grund: 'versionSpeichern gab nichts zurück' };
  for (let i = 0; i < 20; i++) await Store.versionSpeichern(id, 'automatisch');
  await Store.flush();
  const alle = await Store.versionen(id);
  return { da: alle.some(v => v.id === merk.id), gesamt: alle.length, grund: '' };
}, [echt.seiteId] as [string]);
p('Die von Hand gesicherte Fassung überlebt zwanzig weitere', handEcht.da,
  handEcht.grund || `von ${handEcht.gesamt} Fassungen war sie nicht dabei`);

/* ========================================================================= *
 * 4 · IM QUELLTEXT STEHT NUR NOCH EINE ZAHL
 * ========================================================================= */
console.log('\n4 · Eine Zahl, nicht drei');

const ohneKommentar = (s: any) => s
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

const store = ohneKommentar(_lies(_dazu(WURZEL, 'quell/kern/ablage/indexdb.js'), 'utf8'));
const einst = ohneKommentar(_lies(_dazu(WURZEL, 'quell/bereiche/einstellungen/ansicht/seite.js'), 'utf8'));
const konst = _lies(_dazu(WURZEL, 'quell/kern/einstellung/konstanten.js'), 'utf8');

p('`slice(30)` steht nicht mehr im Speichern', !/slice\(30\)/.test(store));
p('`slice(5)` steht nicht mehr im Aufräumknopf', !/versionen\(p\.id\)[\s\S]{0,200}slice\(5\)/.test(einst));
p('Der Knopf benutzt dieselbe Regel', /fassungenAusduennen/.test(einst));
p('Der Knopf fragt, bevor er endgültig löscht',
  /versionen-aufraeumen[\s\S]{0,900}confirm\(/.test(einst));
p('VERSIONEN_MAX wird endlich gelesen', /VERSIONEN_MAX/.test(store),
  'die Konstante stand da und niemand hielt sich an sie');
p('Die Konstante erklärt, warum es die Zahl gibt',
  /FASSUNGEN_FRISCH/.test(konst) && /FASSUNGEN_TAGE/.test(konst));

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 63 — Der Verlauf: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
