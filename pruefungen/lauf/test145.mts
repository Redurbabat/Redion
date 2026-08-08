/* Suite 109 — Heilen heisst auffüllen, nicht überschreiben (E72)
 * ============================================================================
 * `formen.ts` versprach in seinem eigenen Kopf zwei Regeln:
 *
 *   1. Nie etwas wegwerfen, was aussieht wie Inhalt.
 *   2. Nur ergänzen, was fehlt. Ein vorhandener Wert wird nie ersetzt.
 *
 * Der Code hielt sich an beide nicht. Passte die Sorte eines Feldes nicht
 * und griff keine der vier Rettungen, setzte `heile` die Vorgabe ein — und
 * der alte Wert war fort. Bei JEDEM Start, gemeldet als `Reporter.info`,
 * also gar nicht.
 *
 * WARUM DAS NICHT THEORETISCH IST
 *
 * Die Felder, die es trifft, sind nicht die Randfelder. Es sind:
 *
 *   text     ein Objekt statt einer Zeichenkette  → `''`
 *   props    ein Feld statt eines Objekts         → `{}`   (alle Zeilenwerte)
 *   schema   ein Feld statt eines Objekts         → `{}`   (alle Spalten)
 *   content  ein Objekt statt einer Liste         → `[]`   (alle Kinder)
 *
 * Genau die Formen, die ein Import aus einem fremden Werkzeug liefert.
 *
 * Und die zweite Stelle: Kinder-Kennungen, die gerade nicht im Speicher
 * stehen, wurden ersatzlos aus `content` gestrichen. „Steht nicht im
 * Speicher" trifft auch einen Block, den der Abgleich noch nicht geholt
 * hat — kommt er an, ist die Verbindung zu seinem Elternteil längst weg.
 *
 * WAS HIER GEPRÜFT WIRD
 *
 * Nicht, dass `heile` nichts mehr tut — die Oberfläche braucht die Vorgabe,
 * sonst stolpert sie über `b.content.length`. Sondern dass der alte Wert
 * dabei **erhalten bleibt**, statt zu verschwinden.
 *
 *   node pruefungen/lauf/test145.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8835;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

console.log('\n1 · Ein unlesbarer Wert wird nicht mehr weggeworfen');

const einzeln = await seite.evaluate(() => {
  const F = (window as any).Formen;
  /* Vier Sätze, die je ein Feld in der falschen Sorte tragen — und zwar
     eine, die KEINE der vier Rettungen versteht. */
  const roh = {
    text:    { id: 'a', type: 'text', text: { ops: [{ insert: 'Mein Text' }] },
               content: [], parentTable: 'block', created: '2026-01-01T00:00:00.000Z',
               edited: '2026-01-01T00:00:00.000Z', alive: true },
    props:   { id: 'b', type: 'page', text: 'Zeile', props: [['Preis', 12]],
               content: [], parentTable: 'block', created: '2026-01-01T00:00:00.000Z',
               edited: '2026-01-01T00:00:00.000Z', alive: true },
    content: { id: 'c', type: 'text', text: 'X', content: { erst: 'k1', dann: 'k2' },
               parentTable: 'block', created: '2026-01-01T00:00:00.000Z',
               edited: '2026-01-01T00:00:00.000Z', alive: true }
  };
  const r: Record<string, any> = {};
  for (const [k, satz] of Object.entries(roh))
    r[k] = F.heile('block', JSON.parse(JSON.stringify(satz)));
  const schema = F.heile('sammlung', { id: 'd', name: 'DB',
    schema: [['title', 'Titel']], viewIds: [] });
  return { ...r, schema };
});

const e = einzeln as any;

gleich('`text` bekommt die Vorgabe, damit die Oberfläche läuft',
  e.text.satz.text, '');
p('… und der ursprüngliche Text liegt unter „unlesbar"',
  JSON.stringify(e.text.satz.unlesbar?.text ?? null).includes('Mein Text'),
  JSON.stringify(e.text.satz.unlesbar));

gleich('`props` bekommt `{}`', JSON.stringify(e.props.satz.props), '{}');
p('… und die Zeilenwerte sind erhalten',
  JSON.stringify(e.props.satz.unlesbar?.props ?? null).includes('Preis'),
  JSON.stringify(e.props.satz.unlesbar));

gleich('`content` bekommt `[]`', JSON.stringify(e.content.satz.content), '[]');
p('… und die Kinder sind erhalten',
  JSON.stringify(e.content.satz.unlesbar?.content ?? null).includes('k1'),
  JSON.stringify(e.content.satz.unlesbar));

gleich('`schema` bekommt `{}`', JSON.stringify(e.schema.satz.schema), '{}');
p('… und die Spalten sind erhalten',
  JSON.stringify(e.schema.satz.unlesbar?.schema ?? null).includes('title'),
  JSON.stringify(e.schema.satz.unlesbar));

p('Und der Bericht nennt es beim Namen, nicht als „falsche Art"',
  (e.text.geheilt ?? []).some((g: string) => /unlesbar/.test(g)),
  JSON.stringify(e.text.geheilt));

console.log('\n2 · Was nichts trägt, darf die Vorgabe bekommen');
/* Sonst wäre die neue Regel eine Müllhalde: jeder leere Rest bliebe für
   immer im Satz stehen und wanderte durch jede Sicherung mit. */
const leer = await seite.evaluate(() => {
  const F = (window as any).Formen;
  const bau = (feld: string, wert: unknown) => F.heile('block', Object.assign(
    { id: 'x', type: 'text', text: 'T', content: [], parentTable: 'block',
      created: '2026-01-01T00:00:00.000Z', edited: '2026-01-01T00:00:00.000Z',
      alive: true }, { [feld]: wert }));
  return {
    leeresObjekt: bau('content', {}).satz,
    leereListe:   bau('text', []).satz,
    nullText:     bau('content', 0).satz
  };
});
const l = leer as any;
p('Ein leeres Objekt in `content` hinterlässt keine Kiste',
  l.leeresObjekt.unlesbar === undefined, JSON.stringify(l.leeresObjekt.unlesbar));
p('Eine leere Liste in `text` ebenso',
  l.leereListe.unlesbar === undefined, JSON.stringify(l.leereListe.unlesbar));
p('Und `0` auch nicht',
  l.nullText.unlesbar === undefined, JSON.stringify(l.nullText.unlesbar));
gleich('Trotzdem steht danach die Vorgabe da',
  JSON.stringify(l.leeresObjekt.content), '[]');

console.log('\n3 · Die Rettungen retten weiter');
/* Wo eine Umformung den Wert erhält, ist sie besser als die Kiste — sonst
   stünde nach jedem Start eine Vorgabe da, wo der echte Wert hingehört. */
const rettung = await seite.evaluate(() => {
  const F = (window as any).Formen;
  const bau = (feld: string, wert: unknown) => F.heile('block', Object.assign(
    { id: 'x', type: 'text', text: 'T', content: [], parentTable: 'block',
      created: '2026-01-01T00:00:00.000Z', edited: '2026-01-01T00:00:00.000Z',
      alive: true }, { [feld]: wert }));
  /* ACHTUNG: für `content` muss die Kennung ein Block sein, den es WIRKLICH
     gibt. Sonst rettet die Umformung sie zwar zur Liste — und der Filter
     für fehlende Kinder nimmt sie eine Zeile später wieder heraus. Der
     erste Anlauf nahm 'k1' und las das Ergebnis `[]` als „Rettung kaputt".
     Sie war heil; es griffen bloss zwei Regeln nacheinander. */
  const echt = Store.addBlock(null, 'text', { text: 'Echtes Kind' });
  return {
    zahlZuText:  bau('text', 42).satz,
    textZuListe: bau('content', echt.id).satz,
    echteId:     echt.id,
    zuJaNein:    bau('alive', 1).satz
  };
});
const r2 = rettung as any;
gleich('Eine Zahl in `text` wird zur Zeichenkette', r2.zahlZuText.text, '42');
p('… ohne Kiste', r2.zahlZuText.unlesbar === undefined);
gleich('Eine Kennung in `content` wird zur Liste',
  JSON.stringify(r2.textZuListe.content), JSON.stringify([r2.echteId]));
p('… und auch dabei bleibt die Kiste leer',
  r2.textZuListe.unlesbar === undefined, JSON.stringify(r2.textZuListe.unlesbar));
gleich('Eine 1 in `alive` wird `true`', r2.zuJaNein.alive, true);

console.log('\n4 · Fehlende Kinder sind nicht mehr fort, nur beiseite');

const kinder = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Eltern' });
  const k = Store.addBlock(s.id, 'text', { text: 'Kind' });
  /* Eine Kennung dazuhängen, die es im Speicher nicht gibt — genau der
     Zustand, den ein noch nicht angekommener Abgleich hinterlässt. */
  const eltern = Store.getBlock(s.id);
  eltern.content = [k.id, 'kommt-noch-4711'];
  const r = (window as any).Formen.heile('block', eltern);
  return {
    content: r.satz.content,
    fehlt: r.satz.unlesbar?.contentFehlt ?? null,
    bericht: r.geheilt
  };
});
const kk = kinder as any;
p('Die unbekannte Kennung ist aus `content` heraus',
  Array.isArray(kk.content) && !kk.content.includes('kommt-noch-4711'),
  JSON.stringify(kk.content));
p('Das echte Kind steht noch drin',
  (kk.content ?? []).length === 1, JSON.stringify(kk.content));
p('Und die unbekannte Kennung liegt daneben, statt fort zu sein',
  JSON.stringify(kk.fehlt ?? '').includes('kommt-noch-4711'),
  JSON.stringify(kk.fehlt));

/* Und beim zweiten Durchgang wächst die Kiste nicht weiter — sonst
   sammelte sich bei jedem Start dieselbe Kennung noch einmal an. */
const nochmal = await seite.evaluate(() => {
  const s = Store.addBlock(null, 'page', { text: 'Zweimal' });
  const eltern = Store.getBlock(s.id);
  eltern.content = ['gibts-nicht'];
  const F = (window as any).Formen;
  F.heile('block', eltern);
  const zweit = F.heile('block', eltern);
  return { fehlt: zweit.satz.unlesbar?.contentFehlt ?? [],
           content: zweit.satz.content };
});
gleich('Ein zweiter Durchgang legt nichts doppelt ab',
  JSON.stringify((nochmal as any).fehlt), '["gibts-nicht"]');

console.log('\n5 · Ein heiler Satz bleibt unberührt');
/* Die wichtigste Nichtwirkung: bei gesunden Daten darf sich gar nichts
   ändern — sonst schriebe jeder Start jeden Satz neu, und der Abgleich
   hielte das für lauter Änderungen. */
const heil = await seite.evaluate(() => {
  const satz = { id: 'h', type: 'text', text: 'Heil', content: [],
    parentId: null, parentTable: 'block', color: '',
    created: '2026-01-01T00:00:00.000Z', edited: '2026-01-01T00:00:00.000Z',
    alive: true, eigenesFeld: 'bleibt' };
  const vorher = JSON.stringify(satz);
  const r = (window as any).Formen.heile('block', JSON.parse(vorher));
  return { vorher, nachher: JSON.stringify(r.satz), geheilt: r.geheilt };
});
gleich('Nichts wurde angefasst', (heil as any).nachher, (heil as any).vorher);
gleich('… und nichts gemeldet', JSON.stringify((heil as any).geheilt), '[]');

console.log('\n6 · Der ganze Bestand läuft weiterhin durch');
const bestand = await seite.evaluate(() => {
  const b = (window as any).Formen.zustand(false);
  return { geprueft: b?.geprueft ?? 0, kaputt: (b?.kaputt ?? []).length };
});
p('Der Bericht sieht Sätze an', ((bestand as any).geprueft ?? 0) > 0,
  String((bestand as any).geprueft));
gleich('Und findet im laufenden Bestand nichts Kaputtes',
  (bestand as any).kaputt, 0);

console.log('\n7 · Die Quelle sagt dasselbe');
const quelle = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/formen.ts'), 'utf8');
p('`heile` legt beiseite, statt zu überschreiben',
  /beiseite\(raus, name, v\);/.test(quelle));
p('Und die fehlenden Kinder ebenso',
  /beiseite\(raus, 'contentFehlt', fehlend\);/.test(quelle));
/* Nicht als Verneinung prüfen — ein Muster, das „den alten Code" sucht,
   findet nach jeder Umformatierung nichts und ist dann für immer grün.
   Stattdessen positiv: der Ersatz steht HINTER der Frage, ob der Wert
   etwas trägt. */
p('Der Ersatz durch die Vorgabe steht hinter `traegtInhalt`',
  /else if \(traegtInhalt\(v\)\) \{[\s\S]{0,900}else raus\[name\] = regel\.vorgabe\(\);/.test(quelle));
p('Der ersatzlose `content`-Filter ist weg',
  !/raus\['content'\] = raus\['content'\]\.filter\(\(id: string\) => !!Store\.cache\.blocks\[id\]\);\s*\n\s*if \(raus\['content'\]\.length !== vorher\)/.test(quelle));

/* Und die Kommentare, die das Gegenteil behaupteten. */
const idb = fs.readFileSync(path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');
p('Der Kommentar an der Aufrufstelle behauptet nichts Falsches mehr',
  !/Nichts\s*\n?\s*wird ersetzt und nichts weggeworfen\. \*\//.test(idb));

console.log('\n8 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 109 — Heilen wirft nichts mehr weg: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
