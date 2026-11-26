/* test648 — eine Waise wird beim Laden wieder eingehängt (E804)
 *
 * Eine Waise ist ein lebender Block, dessen `parentId` auf einen lebenden
 * Block zeigt, in dessen `content` er nicht steht. Die Oberfläche zeichnet
 * über `content` — die Waise ist also unsichtbar, obwohl sie da ist. Genau
 * diesen Zustand konnte `flush` vor E800 hinterlassen (das Kind landete, der
 * Elternteil nicht), und ein abgebrochener Import oder Abgleich kann es auch.
 *
 * Die Waise wird hier DIREKT auf die Platte geschrieben, an der App vorbei,
 * und dann wird neu geladen. Gegenprobe: vor E804 bleibt sie unsichtbar.
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
const laden = async () => {
  await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
};
await p.goto('file://' + WURZEL + '/index.html');
await laden();

const ids = await p.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Waisenhaus E804' });
  const da = Store.addBlock(s.id, 'text', { text: 'Ich stehe in content' });
  const tot = Store.addBlock(s.id, 'text', { text: 'Ich liege im Papierkorb' });
  Store.trashBlock(tot.id);
  await Store.flush();
  /* An der App vorbei: ein Kind, das auf die Seite zeigt, aber nicht in
     ihrem content steht — und eines, das im Papierkorb liegt (alive:false)
     und ebenfalls nicht in content: das darf NICHT zurückkommen. */
  const jetzt = new Date().toISOString();
  const waise = { id: 'waise-e804', type: 'text', text: 'Ich war unsichtbar', content: [],
    parentId: s.id, parentTable: 'block', color: '', created: jetzt, edited: jetzt,
    erstelltVon: 'Ich', alive: true };
  await new Promise<void>((ok) => {
    const req = indexedDB.open(KONSTANTEN.ABLAGE_NAME || 'notizen');
    req.onsuccess = () => {
      const t = req.result.transaction(['blocks'], 'readwrite');
      t.objectStore('blocks').put(waise);
      t.oncomplete = () => { req.result.close(); ok(); };
    };
  });
  return { seite: s.id, da: da.id, tot: tot.id };
});

await p.reload();
await laden();
const r = await p.evaluate(async (i: any) => {
  await Store.flush();
  const s = Store.getBlock(i.seite);
  const platte = await new Promise<any>((ok) => {
    const req = indexedDB.open(KONSTANTEN.ABLAGE_NAME || 'notizen');
    req.onsuccess = () => {
      const g = req.result.transaction(['blocks'], 'readonly').objectStore('blocks').get(i.seite);
      g.onsuccess = () => { ok(g.result); req.result.close(); };
    };
  });
  App.oeffne(i.seite);
  await new Promise(r => setTimeout(r, 500));
  return {
    imSpeicher: s.content.includes('waise-e804'),
    aufDerPlatte: platte.content.includes('waise-e804'),
    sichtbar: !!document.querySelector('[data-bid="waise-e804"]'),
    reihenfolge: s.content.indexOf(i.da) < s.content.indexOf('waise-e804'),
    totBleibtDraussen: !s.content.includes(i.tot),
    einmal: s.content.filter((k: string) => k === 'waise-e804').length
  };
}, ids);
pruef('§1 die Waise steht nach dem Laden in content', r.imSpeicher, true);
pruef('§1 und das ist auch auf der Platte gesichert', r.aufDerPlatte, true);
pruef('§1 sie ist auf der Seite zu sehen', r.sichtbar, true);
pruef('§1 hinten angehängt, die alte Folge bleibt', r.reihenfolge, true);
pruef('§2 ein Block im Papierkorb kommt nicht zurück', r.totBleibtDraussen, true);

await p.reload();
await laden();
const r3 = await p.evaluate((s: string) => Store.getBlock(s).content.filter((k: string) => k === 'waise-e804').length, ids.seite);
pruef('§3 ein zweites Laden hängt sie nicht doppelt ein', r3, 1);

pruef('Keine Skriptfehler', fehler, []);
await b.close();
console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
process.exit(bad ? 1 : 0);
