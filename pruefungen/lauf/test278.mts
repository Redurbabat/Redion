/* Suite 278 — Eine FEINDLICHE Sicherung einspielen (E284)
 * ============================================================================
 * Vierzehn Prüfläufe rufen `importAll` (test96, 100, 144, 148, 152, 180, 181,
 * 200, 201, 204, 227, 261, 270, 273). Alle vierzehn spielen eine Sicherung
 * ein, die Redion selbst geschrieben hat.
 *
 * Dieser hier spielt eine ein, die jemand gebaut hat, der Redion schaden
 * will. Das ist der Unterschied zwischen „funktioniert der Import" und „hält
 * der Import".
 *
 * ─── DER ANGRIFF, UND WARUM ER FUNKTIONIERTE ────────────────────────────────
 *
 * `JSON.parse('{"__proto__":{"a":1}}')` erzeugt eine EIGENE Eigenschaft
 * namens `__proto__` — harmlos, solange niemand sie weiterreicht.
 * `Object.assign` reicht sie weiter, und zwar über `[[Set]]`, also über den
 * geerbten `__proto__`-SETZER. Damit bekam `cache.meta` einen fremden
 * Prototyp, und `getMeta('irgendwas')` gab danach nicht mehr die Vorgabe
 * zurück, sondern das, was in der Sicherung stand.
 *
 * Betroffen ist alles, was heute NICHT gesetzt ist und über `cache.meta[k]`
 * gelesen wird: `wolkeAbgleich`, `agent:notaus`, `theme`, jeder `api:`-
 * Schlüssel. Und `cache.blocks[id]` genauso: eine Kennung, die es nicht
 * gibt, hätte plötzlich einen Block geliefert.
 *
 *   §1 DER ANGRIFF selbst — beide Einspielarten, beide Fächer.
 *   §2 DIE TIEFE: ein `__proto__` nicht ganz oben, sondern in `props`.
 *   §3 DIE FORMPRÜFUNG liest endlich die Fassung, die der Export schreibt.
 *   §4 DER BERICHT sagt, was entfernt wurde — still wäre schlimmer.
 *   §5 DIE HARMLOSE Sicherung geht unverändert durch (kein Kollateralschaden).
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §1 und §2 waren vor E284 rot — und zwar nicht knapp: der Prototyp wurde
 * nachweislich gesetzt. §5 ist die Gegenprobe dazu und war schon vorher
 * grün; er steht hier, weil eine Härtung, die auch gültige Sicherungen
 * abweist, keine Härtung ist, sondern ein neuer Fehler. §3 war rot, weil
 * `version` nie gelesen wurde.
 *
 *   node pruefungen/lauf/test278.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const ImportSicherheit: any; declare const ImportValidierung: any;
declare const Umzuege: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9056;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof App !== 'undefined' &&
        typeof (globalThis as any).ImportSicherheit !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Angriff: ein fremder Prototyp über die Sicherung');

/* Die Sicherung wird von Hand als TEXT gebaut, nicht mit JSON.stringify aus
   einem Objekt — sonst könnte die Testumgebung selbst schon säubern und der
   Prüflauf würde etwas anderes messen als den echten Weg. */
const boese = JSON.stringify({
  version: 6,
  exportiert: '2026-01-01T00:00:00.000Z',
  enthaelt: ['blocks', 'collections', 'views', 'meta', 'versions'],
  blocks: {},
  collections: {},
  views: {},
  meta: { theme: 'dark' },
  versions: []
}).replace('"meta":{"theme":"dark"}',
  '"meta":{"theme":"dark","__proto__":{"wolkeAbgleich":true,"agent:notaus":false,' +
  '"eingeschleust":"ja"},"constructor":"kaputt"}')
  .replace('"blocks":{}',
  '"blocks":{"__proto__":{"text":"Ich bin ein Block, den es nicht gibt","alive":true}}');

const zusammen = await seite.evaluate(async (txt: string) => {
  const vorher = {
    proto: Object.getPrototypeOf(Store.cache.meta),
    abgleich: Store.getMeta('wolkeAbgleich', 'VORGABE'),
    geistBlock: Store.getBlock('gibtesganzsicherniemals')
  };
  let raus: any = null, geworfen = '';
  try { raus = await Store.importAll(txt, 'zusammenfuehren'); }
  catch (e: any) { geworfen = String(e && e.message || e); }
  return {
    geworfen,
    /* DER KERN: hat cache.meta einen fremden Prototyp bekommen? */
    metaProtoIstObject: Object.getPrototypeOf(Store.cache.meta) === Object.prototype ||
                        Object.getPrototypeOf(Store.cache.meta) === null,
    metaProtoName: String(Object.getPrototypeOf(Store.cache.meta)),
    /* Und liefert getMeta jetzt Erfundenes? */
    abgleich: Store.getMeta('wolkeAbgleich', 'VORGABE'),
    eingeschleust: Store.getMeta('eingeschleust', 'NICHTS'),
    notaus: Store.getMeta('agent:notaus', 'VORGABE'),
    /* Steht `constructor` als gewöhnlicher Eintrag im Verzeichnis? */
    ctorEintrag: Object.prototype.hasOwnProperty.call(Store.cache.meta, 'constructor'),
    /* Liefert ein unbekannter Block plötzlich etwas? */
    geistBlock: Store.getBlock('gibtesganzsicherniemals'),
    /* Das Harmlose muss angekommen sein — sonst misst §1 nur einen Abbruch. */
    theme: Store.getMeta('theme', ''),
    vorherAbgleich: vorher.abgleich,
    bericht: raus ? { entschaerft: raus.entschaerft, satz: raus.entschaerftSatz } : null
  };
}, boese) as any;

p('Das Einspielen wirft nicht — es entschärft und macht weiter',
  zusammen.geworfen === '', zusammen.geworfen);
p('Der harmlose Teil der Sicherung ist angekommen',
  zusammen.theme === 'dark', JSON.stringify(zusammen.theme));
p('DER ANGRIFF: `cache.meta` hat KEINEN fremden Prototyp',
  zusammen.metaProtoIstObject === true, zusammen.metaProtoName);
p('… `getMeta` für einen ungesetzten Schlüssel gibt die VORGABE zurück',
  zusammen.abgleich === 'VORGABE', String(zusammen.abgleich) +
  ' (vor E284 kam hier `true` aus der fremden Datei)');
p('… und den erfundenen Schlüssel gibt es gar nicht',
  zusammen.eingeschleust === 'NICHTS', String(zusammen.eingeschleust));
p('… `agent:notaus` ebenfalls unberührt',
  zusammen.notaus === 'VORGABE', String(zusammen.notaus));
p('`constructor` steht nicht als Eintrag im Verzeichnis',
  zusammen.ctorEintrag === false);
p('Ein Block, den es nicht gibt, ist weiterhin nichts',
  !zusammen.geistBlock, JSON.stringify(zusammen.geistBlock));

/* Dasselbe noch einmal mit „ersetzen" — dort wird das geparste Objekt beim
   alten Weg SELBST zum Zwischenspeicher, das ist der zweite Weg hinein. */
const ersetzt = await seite.evaluate(async (txt: string) => {
  let geworfen = '';
  try { await Store.importAll(txt, 'ersetzen'); }
  catch (e: any) { geworfen = String(e && e.message || e); }
  return {
    geworfen,
    metaOk: Object.getPrototypeOf(Store.cache.meta) === Object.prototype ||
            Object.getPrototypeOf(Store.cache.meta) === null,
    blocksOk: Object.getPrototypeOf(Store.cache.blocks) === Object.prototype ||
              Object.getPrototypeOf(Store.cache.blocks) === null,
    abgleich: Store.getMeta('wolkeAbgleich', 'VORGABE'),
    geistBlock: Store.getBlock('gibtesganzsicherniemals'),
    theme: Store.getMeta('theme', '')
  };
}, boese) as any;
p('„Ersetzen" geht denselben Weg — `cache.meta` bleibt sauber',
  ersetzt.metaOk === true, ersetzt.geworfen);
p('… und `cache.blocks` auch', ersetzt.blocksOk === true);
p('… `getMeta` gibt weiter die Vorgabe', ersetzt.abgleich === 'VORGABE',
  String(ersetzt.abgleich));
p('… und der Geist-Block bleibt nichts', !ersetzt.geistBlock);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Nicht nur ganz oben: ein `__proto__` tief im Block');

const tief = await seite.evaluate(async () => {
  const txt = '{"version":6,"blocks":{"b1":{"id":"b1","type":"page","text":"Tarnung",' +
    '"alive":true,"props":{"harmlos":"ja","__proto__":{"geerbt":"boese"}}}},' +
    '"collections":{},"views":{},"meta":{},"versions":[]}';
  await Store.importAll(txt, 'ersetzen');
  const b = Store.getBlock('b1');
  return {
    blockDa: !!b,
    text: b ? b.text : '',
    harmlos: b && b.props ? b.props.harmlos : '',
    /* Hat `props` einen fremden Prototyp bekommen? */
    propsProtoOk: b && b.props
      ? (Object.getPrototypeOf(b.props) === Object.prototype ||
         Object.getPrototypeOf(b.props) === null)
      : true,
    /* Und liefert eine ungesetzte Spalte jetzt etwas? */
    geerbt: b && b.props ? (b.props as any).geerbt : undefined
  };
}) as any;
p('Der Block ist da und trägt seinen Text', tief.blockDa && tief.text === 'Tarnung',
  JSON.stringify(tief));
p('Das harmlose Feld daneben ist unversehrt', tief.harmlos === 'ja');
p('DIE TIEFE: auch `props` hat keinen fremden Prototyp', tief.propsProtoOk === true);
p('… und eine ungesetzte Spalte liefert nichts', tief.geerbt === undefined,
  String(tief.geerbt));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Die Formfassung wird endlich gelesen');

const formen = await seite.evaluate(() => {
  const jetzige = typeof Umzuege !== 'undefined' ? Umzuege.JETZIGE : 6;
  const mach = (o: any) => ImportValidierung.pruefen(o, jetzige);
  const gut = mach({ version: jetzige, blocks: { a: {} }, collections: {},
                     views: {}, meta: {}, versions: [] });
  const neuer = mach({ version: jetzige + 3, blocks: { a: {} }, collections: {},
                       views: {}, meta: {}, versions: [] });
  const aelter = mach({ version: 1, blocks: { a: {} }, collections: {},
                        views: {}, meta: {}, versions: [] });
  const ohne = mach({ blocks: { a: {} } });
  const keine = mach({ irgendwas: 1 });
  const leer = mach({ version: jetzige, blocks: {}, collections: {},
                      views: {}, meta: {}, versions: [] });
  /* Ein Bestand mit Blöcken, aber ohne Sammlungen — der gewöhnliche Fall
     für jemanden, der nur Notizen schreibt. Er darf nicht warnen. */
  const nurNotizen = mach({ version: jetzige, blocks: { a: {} }, collections: {},
                            views: {}, meta: {}, versions: [],
                            enthaelt: ['blocks', 'collections', 'views', 'meta', 'versions'] });
  return {
    jetzige,
    gutStufen: gut.punkte.map((x: any) => x.stufe),
    gutZahl: gut.zahlen.blocks,
    neuerWarnt: neuer.punkte.some((x: any) => x.stufe === 'warnen' &&
      /NEUEREN/.test(x.text)),
    aelterHinweis: aelter.punkte.some((x: any) => x.stufe === 'hinweis'),
    ohneFassung: ohne.punkte.some((x: any) => /keine Formatfassung/.test(x.text)),
    keineTaugt: keine.taugt,
    leerWarnt: leer.punkte.some((x: any) => x.stufe === 'warnen' &&
      /keine einzige Seite/.test(x.text)),
    leeresFachSchweigt: !nurNotizen.punkte.some((x: any) => x.stufe === 'warnen')
  };
}) as any;
p('Eine passende Sicherung erzeugt keine Warnung',
  formen.gutStufen.filter((s: string) => s !== 'hinweis').length === 0,
  JSON.stringify(formen.gutStufen));
p('… und ihre Blöcke werden GEZÄHLT, nicht geglaubt', formen.gutZahl === 1);
p('Eine NEUERE Fassung wird gemeldet — sonst geht still verloren, was sie neu hat',
  formen.neuerWarnt === true);
p('Eine ältere Fassung ist nur ein Hinweis', formen.aelterHinweis === true);
p('Eine Sicherung ohne Fassungsangabe sagt das auch', formen.ohneFassung === true);
p('Was gar keine Sicherung ist, wird hart abgewiesen', formen.keineTaugt === false);
/* HIER STAND EINE PRÜFUNG AUF EINE PRÜFUNG, DIE ES NICHT MEHR GIBT.
   Sie verlangte, dass ein Manifest mit `enthaelt: ['collections']` bei
   leerem Fach warnt. Beim ersten Lauf von §5 zeigte sich, dass genau das
   an Redions EIGENEM Export anspringt: `enthaelt` nennt die fünf Fächer
   fest, und ein frischer Arbeitsbereich hat legitim null Fassungen.
   Die Prüfung war grün und die geprüfte Regel trotzdem falsch — deshalb
   ist beides weg. Die Begründung steht in validierung.ts. */
p('Gegenprobe: ein leeres Fach ist KEINE Warnung — „enthaelt" spricht über ' +
  'das Format, nicht über den Inhalt',
  formen.leeresFachSchweigt === true);
p('Eine Sicherung ganz ohne Seiten wird vor dem Ersetzen erwähnt',
  formen.leerWarnt === true);

/* ------------------------------------------------------------------------ */
console.log('\n4 · Der Bericht: entfernt wird nicht still');

const bericht = await seite.evaluate(() => {
  const f = ImportSicherheit.leererFund();
  ImportSicherheit.entgiften(
    JSON.parse('{"a":{"__proto__":1},"b":[{"constructor":2}],"c":{"d":{"prototype":3}}}'), f);
  const still = ImportSicherheit.leererFund();
  ImportSicherheit.entgiften(JSON.parse('{"a":1,"b":[2,3]}'), still);
  /* Tiefe: ein Ast jenseits der Grenze wird abgeschnitten, nicht durchgereicht. */
  let tiefText = '{"a":';
  for (let i = 0; i < ImportSicherheit.MAX_TIEFE + 5; i++) tiefText += '{"x":';
  tiefText += '1';
  for (let i = 0; i < ImportSicherheit.MAX_TIEFE + 5; i++) tiefText += '}';
  tiefText += '}';
  const tf = ImportSicherheit.leererFund();
  ImportSicherheit.entgiften(JSON.parse(tiefText), tf);
  return {
    entfernt: f.entfernt, wege: f.wege, satz: ImportSicherheit.satz(f),
    stillEntfernt: still.entfernt, stillSatz: ImportSicherheit.satz(still),
    tiefFlag: tf.zuTief, tiefSatz: ImportSicherheit.satz(tf)
  };
}) as any;
p('Alle drei gefährlichen Namen werden gezählt', bericht.entfernt === 3,
  JSON.stringify(bericht));
p('… und ihr Weg wird genannt, nicht nur die Zahl',
  bericht.wege.length === 3 && bericht.wege.some((w: string) => w.includes('c.d')),
  JSON.stringify(bericht.wege));
p('… der Satz nennt sie im Klartext',
  /gefährliche Schlüssel/.test(bericht.satz), bericht.satz);
p('Gegenprobe: eine harmlose Datei erzeugt gar keinen Satz',
  bericht.stillEntfernt === 0 && bericht.stillSatz === '', bericht.stillSatz);
p('Zu tiefe Verschachtelung wird abgeschnitten UND gemeldet',
  bericht.tiefFlag === true && /tiefer verschachtelt/.test(bericht.tiefSatz),
  bericht.tiefSatz);

/* ------------------------------------------------------------------------ */
console.log('\n5 · Und die gewöhnliche Sicherung geht unverändert durch');

/* Eine Härtung, die auch gültige Sicherungen abweist oder verändert, ist
   keine Härtung, sondern ein neuer Fehler. Deshalb der Rundlauf mit Redions
   EIGENEM Export — Byte für Byte derselbe Bestand. */
const rundlauf = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Rundlauf', icon: '📓' });
  Store.addBlock(s.id, 'text', { text: 'Inhalt mit Umlaut: Prüfung — ✓' });
  /* `addDatabase(parentId, name)` — nachgesehen, nicht geraten
     (indexdb.ts:861). Es gibt kein `addCollection`. */
  const db = Store.addDatabase(null, 'Tabelle');
  Store.addRow(db.collectionId || db.id, { titel: 'Zeile eins' });
  Store.setMeta('theme', 'light');
  Store.setMeta('rundlaufMarke', 'behalten');
  const vorher = {
    bloecke: Object.keys(Store.cache.blocks).length,
    sammlungen: Object.keys(Store.cache.collections).length,
    marke: Store.getMeta('rundlaufMarke', ''),
    seiteText: Store.getBlock(s.id).text
  };
  const json = Store.exportAll();
  const raus = await Store.importAll(json, 'ersetzen');
  return {
    vorher,
    nachher: {
      bloecke: Object.keys(Store.cache.blocks).length,
      sammlungen: Object.keys(Store.cache.collections).length,
      marke: Store.getMeta('rundlaufMarke', ''),
      seiteText: Store.getBlock(s.id) ? Store.getBlock(s.id).text : null
    },
    entschaerft: raus.entschaerft,
    satz: raus.entschaerftSatz,
    fassung: raus.fassung,
    warnungen: (raus.befund || []).filter((x: any) => x.stufe !== 'hinweis').length,
    warnText: (raus.befund || []).filter((x: any) => x.stufe !== 'hinweis')
      .map((x: any) => x.stufe + ': ' + x.text).join(' | ')
  };
}) as any;
p('Der eigene Export kommt unverändert zurück — Blöcke',
  rundlauf.vorher.bloecke === rundlauf.nachher.bloecke,
  JSON.stringify(rundlauf));
p('… Sammlungen', rundlauf.vorher.sammlungen === rundlauf.nachher.sammlungen);
p('… Meta', rundlauf.nachher.marke === 'behalten');
p('… und der Text mit Umlaut und Zeichen', rundlauf.nachher.seiteText === 'Rundlauf');
p('An einer eigenen Sicherung wird NICHTS entschärft',
  rundlauf.entschaerft === 0 && rundlauf.satz === '', rundlauf.satz);
p('… und keine einzige Warnung erhoben', rundlauf.warnungen === 0,
  rundlauf.warnText);
p('… die Fassung wird dabei gelesen und stimmt',
  rundlauf.fassung === formen.jetzige, String(rundlauf.fassung));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 200));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
