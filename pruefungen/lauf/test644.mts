/* test644 — Arbeitsschritte landen ganz oder gar nicht (E800)
 *
 * Eine Handlung schreibt oft mehrere Sätze: `addBlock` schreibt den neuen
 * Block UND den Elternteil mit der neuen Kennung in `content`. Vorher übersprang
 * `flush` einen Satz, der sich nicht schreiben liess (`preventDefault`), und
 * schrieb den Rest — auf der Platte stand dann ein Elternteil, dessen
 * `content` auf einen Block zeigt, den es dort nicht gibt.
 *
 * Gelesen wird IMMER direkt aus IndexedDB, nie aus `Store.cache`: der
 * Zwischenspeicher sagt nur, was die App glaubt, nicht was überlebt.
 *
 * Die Gegenprobe ist der Stand vor E800: dort ist §1 rot
 * („Elternteil zeigt auf ein Kind, das auf der Platte fehlt").
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

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const fehler: string[] = [];
  p.on('pageerror', e => fehler.push('JS: ' + e.message));
  await p.goto('file://' + WURZEL + '/index.html');
  await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
  await p.waitForTimeout(1500);

  /* Liest einen Satz an der App vorbei direkt von der Platte. */
  await p.evaluate(() => {
    (window as any).__platte = (fach: string, id: string) => new Promise<any>((ok) => {
      const req = indexedDB.open(KONSTANTEN.ABLAGE_NAME || 'notizen');
      req.onsuccess = () => {
        const db = req.result;
        const r = db.transaction([fach], 'readonly').objectStore(fach).get(id);
        r.onsuccess = () => { ok(r.result ?? null); db.close(); };
        r.onerror = () => { ok('FEHLER'); db.close(); };
      };
      req.onerror = () => ok('KEINE_DB');
    });
  });

  /* --- 1 · Ein Schritt mit einem unschreibbaren Satz landet gar nicht ---- */
  const r1 = await p.evaluate(async () => {
    const platte = (window as any).__platte;
    const seite = Store.addPage(null, { text: 'Probe E800' });
    await Store.flush();
    const davor = await platte('blocks', seite.id);

    /* Ein guter Schritt in einem EIGENEN Takt, der im selben Stapel wartet. */
    const fremd = Store.addPage(null, { text: 'Fremder guter Schritt' });
    await new Promise(r => setTimeout(r, 0));

    /* Der schlechte Schritt: neuer Block + Elternteil, der Block trägt eine
       Funktion — `put` wirft DataCloneError. */
    const kind = Store.addBlock(seite.id, 'text', { text: 'Kind', kaputt: () => 1 });
    let abgelehnt = false;
    try { await Store.flush(); } catch { abgelehnt = true; }

    const elternPlatte = await platte('blocks', seite.id);
    const kindPlatte = await platte('blocks', kind.id);
    const fremdPlatte = await platte('blocks', fremd.id);
    const zeigtInsLeere = !!elternPlatte && elternPlatte.content.includes(kind.id) && !kindPlatte;

    /* Heilen: das Feld weg, nächster flush — jetzt landet beides. */
    Store.feldWeg(kind.id, 'kaputt');
    await Store.flush().catch(() => {});
    const elternNachher = await platte('blocks', seite.id);
    const kindNachher = await platte('blocks', kind.id);
    return {
      davorLeer: davor?.content.length,
      abgelehnt,
      zeigtInsLeere,
      elternUnveraendert: elternPlatte?.content.length === davor?.content.length,
      kindFehlt: kindPlatte === null,
      fremdGelandet: !!fremdPlatte && fremdPlatte.text === 'Fremder guter Schritt',
      nachherBeide: !!kindNachher && !!elternNachher?.content.includes(kind.id),
      seiteId: seite.id
    };
  });
  pruef('§1 flush meldet das Scheitern', r1.abgelehnt, true);
  pruef('§1 kein Elternteil zeigt auf ein Kind, das auf der Platte fehlt', r1.zeigtInsLeere, false);
  pruef('§1 Elternteil auf der Platte unverändert', r1.elternUnveraendert, true);
  pruef('§1 das kaputte Kind ist nicht auf der Platte', r1.kindFehlt, true);
  pruef('§1 ein guter Schritt im selben Stapel ist trotzdem gelandet', r1.fremdGelandet, true);
  pruef('§1 nach dem Heilen landen Kind und Elternteil zusammen', r1.nachherBeide, true);

  /* --- 2 · Eine Umstellung wartet nicht 400 ms --------------------------- */
  const r2 = await p.evaluate(async () => {
    const platte = (window as any).__platte;
    const seite = Store.addPage(null, { text: 'Eile E800' });
    await Store.flush();
    const kind = Store.addBlock(seite.id, 'text', { text: 'sofort' });
    await new Promise(r => setTimeout(r, 120));
    const k = await platte('blocks', kind.id);
    const e = await platte('blocks', seite.id);
    /* Tippen ist ein Satz je Schritt und behält die Pause. */
    Store.updateBlock(kind.id, { text: 'sofort getippt' });
    await new Promise(r => setTimeout(r, 120));
    const getippt = await platte('blocks', kind.id);
    await Store.flush();
    const spaeter = await platte('blocks', kind.id);
    return {
      kindDa: !!k, elternMitKind: !!e && e.content.includes(kind.id),
      tippenNochNicht: getippt?.text === 'sofort',
      tippenSpaeter: spaeter?.text === 'sofort getippt'
    };
  });
  pruef('§2 neuer Block nach 120 ms auf der Platte', r2.kindDa, true);
  pruef('§2 Elternteil mit dem Kind nach 120 ms auf der Platte', r2.elternMitKind, true);
  pruef('§2 Tippen behält die Schreibpause', r2.tippenNochNicht, true);
  pruef('§2 Tippen landet beim nächsten flush', r2.tippenSpaeter, true);

  /* --- 3 · Ein zurückgekehrter Schritt und ein neuerer Stand ------------- */
  const r3 = await p.evaluate(async () => {
    const platte = (window as any).__platte;
    const seite = Store.addPage(null, { text: 'Vereinen E800' });
    await Store.flush();
    const kind = Store.addBlock(seite.id, 'text', { text: 'A', kaputt: () => 1 });
    try { await Store.flush(); } catch { /* erwartet */ }
    /* Die Seite wird in einem späteren Takt noch einmal geändert — ihr
       neuerer Stand trägt das Kind in `content`. Sie darf trotzdem nicht
       ohne das Kind landen. */
    Store.updateBlock(seite.id, { text: 'Vereinen E800 · neu' });
    try { await Store.flush(); } catch { /* das Kind ist noch kaputt */ }
    const e = await platte('blocks', seite.id);
    const k = await platte('blocks', kind.id);
    Store.feldWeg(kind.id, 'kaputt');
    await Store.flush().catch(() => {});
    const e2 = await platte('blocks', seite.id);
    const k2 = await platte('blocks', kind.id);
    return {
      keinHalberStand: !(e && e.content.includes(kind.id) && !k),
      amEndeBeide: !!k2 && !!e2?.content.includes(kind.id) && e2?.text === 'Vereinen E800 · neu'
    };
  });
  pruef('§3 der neuere Stand landet nicht ohne seinen Schrittpartner', r3.keinHalberStand, true);
  pruef('§3 nach dem Heilen ist alles da', r3.amEndeBeide, true);

  /* --- 4 · Neuladen: was auf der Platte steht, ist ganz ------------------ */
  await p.reload();
  await p.waitForFunction(() => typeof Store !== 'undefined' && !!Store.cache, null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  const r4 = await p.evaluate((id: string) => {
    const s = Store.getBlock(id);
    if (!s) return { da: false, waisen: -1 };
    const waisen = s.content.filter((k: string) => !Store.getBlock(k)).length;
    return { da: true, waisen };
  }, r1.seiteId);
  pruef('§4 nach dem Neuladen ist die Probe da', r4.da, true);
  pruef('§4 und kein content zeigt ins Leere', r4.waisen, 0);

  pruef('Keine Skriptfehler', fehler, []);
  await b.close();
  console.log(`\n${ok} bestanden, ${bad} fehlgeschlagen`);
  process.exit(bad ? 1 : 0);
})();
