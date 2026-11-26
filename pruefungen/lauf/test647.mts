/* test647 — Umwandeln verliert nichts (E803, §18 hart)
 *
 * „Blöcke müssen sich ohne Datenverlust umwandeln lassen" (§18). Der
 * gewöhnliche Weg setzt nur `type` und war schon verlustfrei; vier Sonderwege
 * waren es nicht:
 *
 *   → Datenbank   der Block wurde in den Papierkorb gelegt UND sofort
 *                 endgültig gelöscht (`purgeBlock`) — Text und Unterblöcke weg
 *   → Seite       eine NEUE Seite am Ende; der alte Block samt Unterblöcken
 *                 in den Papierkorb, die Kennung gewechselt
 *   → Einbettung  `text: ''`
 *   → Spalten     `text: ''`
 *
 * Gelesen wird die Ablage selbst (`Store`), nach `Store.flush()`.
 */
import _pfad from 'node:path';
const WURZEL = _pfad.resolve(import.meta.dirname, '../..');
import { chromium } from 'playwright';
let ok = 0, bad = 0;
const pruef = (n: string, ist: unknown, soll: unknown) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
const fehler: string[] = [];
p.on('pageerror', e => fehler.push('JS: ' + e.message));
await p.goto('file://' + WURZEL + '/index.html');
await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache && typeof Blocks !== 'undefined', null, { timeout: 20000 });
await p.waitForTimeout(1500);

const r = await p.evaluate(async () => {
  const seite = Store.addPage(null, { text: 'Umwandeln E803' });
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 300));
  const anlegen = (text: string) => {
    const x = Store.addBlock(seite.id, 'todo', { text, checked: true, color: 'red' });
    const kind = Store.addBlock(x.id, 'text', { text: 'Unterblock von ' + text });
    return { id: x.id, kind: kind.id };
  };
  const raus: Record<string, any> = {};

  /* 1 · gewöhnlich: To-do → Überschrift → To-do */
  const g = anlegen('Gewöhnlich');
  Blocks.umwandeln(g.id, 'h1');
  Blocks.umwandeln(g.id, 'todo');
  const gb = Store.getBlock(g.id);
  raus.gewoehnlich = { checked: gb?.checked, color: gb?.color, text: gb?.text, kind: gb?.content?.includes(g.kind) };

  /* 2 · → Seite */
  const s = anlegen('Wird Seite');
  const vorPos = Store.getBlock(seite.id).content.indexOf(s.id);
  Blocks.umwandeln(s.id, 'page');
  await new Promise(r => setTimeout(r, 300));
  const sb = Store.getBlock(s.id);
  raus.seite = {
    gleicheKennung: !!sb && sb.type === 'page',
    lebt: sb?.alive === true,
    text: sb?.text,
    kind: !!sb?.content?.includes(s.kind) && Store.getBlock(s.kind)?.parentId === s.id,
    platz: Store.getBlock(seite.id).content.indexOf(s.id) === vorPos,
    zeichen: !!sb?.icon
  };
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 300));

  /* 3 · → Datenbank */
  const d = anlegen('Wird Datenbank');
  Blocks.umwandeln(d.id, 'db-table');
  await new Promise(r => setTimeout(r, 300));
  const db = Store.getBlock(d.id);
  const dbNeu = Store.getBlock(seite.id).content.map((k: string) => Store.getBlock(k)).find((x: any) => x?.type === 'collection_view' || x?.collectionId);
  raus.datenbank = {
    alterBlockHolbar: !!db,
    imPapierkorb: db ? db.alive === false : null,
    text: db?.text,
    kindHolbar: !!Store.getBlock(d.kind),
    name: dbNeu ? (Store.getCollection(dbNeu.collectionId)?.name ?? null) : 'KEINE'
  };

  /* 4 · → Einbettung */
  const e = anlegen('Wird Einbettung');
  Blocks.umwandeln(e.id, 'embed-youtube');
  raus.einbettung = { text: Store.getBlock(e.id)?.text, checked: Store.getBlock(e.id)?.checked };

  /* 5 · → Spalten */
  const c = anlegen('Wird Spalten');
  Blocks.umwandeln(c.id, 'columns');
  raus.spalten = { text: Store.getBlock(c.id)?.text, kind: !!Store.getBlock(c.kind) };

  /* 6 · ein LEERER Block → Datenbank füllt den Papierkorb nicht */
  const leer = Store.addBlock(seite.id, 'text', { text: '' });
  Blocks.umwandeln(leer.id, 'db-table');
  await new Promise(r => setTimeout(r, 300));
  raus.leer = { weg: !Store.getBlock(leer.id) };

  await Store.flush();
  return raus;
});

pruef('§1 gewöhnlich: abgehakt, Farbe und Text bleiben', [r.gewoehnlich.checked, r.gewoehnlich.color, r.gewoehnlich.text], [true, 'red', 'Gewöhnlich']);
pruef('§1 und der Unterblock bleibt', r.gewoehnlich.kind, true);
pruef('§2 → Seite: dieselbe Kennung ist jetzt die Seite', r.seite.gleicheKennung, true);
pruef('§2 sie lebt (nicht im Papierkorb)', r.seite.lebt, true);
pruef('§2 Text bleibt', r.seite.text, 'Wird Seite');
pruef('§2 der Unterblock wird Inhalt der Seite', r.seite.kind, true);
pruef('§2 am selben Platz', r.seite.platz, true);
pruef('§2 mit Seitenzeichen', r.seite.zeichen, true);
pruef('§3 → Datenbank: der alte Block ist nicht endgültig weg', r.datenbank.alterBlockHolbar, true);
pruef('§3 er liegt im Papierkorb', r.datenbank.imPapierkorb, true);
pruef('§3 mit seinem Text', r.datenbank.text, 'Wird Datenbank');
pruef('§3 und sein Unterblock ist holbar', r.datenbank.kindHolbar, true);
pruef('§3 die neue Datenbank trägt den Text als Namen', r.datenbank.name, 'Wird Datenbank');
pruef('§4 → Einbettung: der Text bleibt', r.einbettung.text, 'Wird Einbettung');
pruef('§4 und das Häkchen auch', r.einbettung.checked, true);
pruef('§5 → Spalten: der Text bleibt', r.spalten.text, 'Wird Spalten');
pruef('§5 und der Unterblock', r.spalten.kind, true);
pruef('§6 ein leerer Block füllt den Papierkorb nicht', r.leer.weg, true);
pruef('Keine Skriptfehler', fehler, []);
await b.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
