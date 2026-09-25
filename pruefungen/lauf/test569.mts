/* Suite 569 — Der Seitenverlauf behält, was ihm nicht gehört (E684, L212 Punkt 2)
 * ============================================================================
 * GEMESSEN AM 25. SEPTEMBER 2026 (messungen.md): ein Strg+Z auf einer Seite
 * baute die Seite neu — `Store.kinderLeeren` purgte jedes Kind,
 * `Store.baumEinfuegen` setzte es „immer mit frischen IDs" wieder ein. Ein
 * Bild überlebte das, weil sein Dateisatz umgehängt wird. Eine UNTERSEITE
 * nicht: neue Kennung, ihre geplante Fassung gelöscht (1 → 0), der Favorit
 * zeigte auf die alte Kennung. Ein Tastendruck auf der Elternseite löschte
 * den Verlauf der Unterseite — §15 in seiner einfachsten Form.
 *
 * DIE REGEL, die dieser Lauf hält: Rückgängig ändert den INHALT einer Seite,
 * nicht die IDENTITÄT ihrer Blöcke. Was im Schnappschuss und auf der Seite
 * steht, behält Kennung, Fassungen und Anhänge; was nur auf der Seite steht,
 * geht in den Papierkorb, nicht ins Nichts; was nur im Schnappschuss steht,
 * kommt mit seiner alten Kennung zurück.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Unterseite: nach Strg+Z auf der Elternseite dieselbe Kennung, die
 *      Fassung noch da, der Favorit gültig, der Inhalt unverändert — und der
 *      Text der Elternseite ist trotzdem zurückgenommen.
 *   2  Bild: Block-Kennung gleich, Dateisatz zeigt auf denselben Block,
 *      Bytes vollständig — auch nach dem Neuladen.
 *   3  Ein Block, den das Rückgängig entfernt (nach dem Schnappschuss
 *      angelegt), liegt im Papierkorb (alive:false), nicht im Nichts —
 *      und lässt sich von dort zurückholen.
 *   4  Ein Block, den das Rückgängig zurückbringt (nach dem Schnappschuss
 *      gelöscht), kommt mit seiner alten Kennung.
 *   5  Kein Purge auf dem Weg zurück (gezählt über `Store.on`), und keine
 *      Grabsteine für Blöcke, die noch da sind.
 *   6  Wiederholen (Strg+Y) geht denselben Weg zurück, Kennungen gleich.
 *   7  Datenbank auf der Seite: Sammlung, Ansicht und drei Zeilen behalten
 *      ihre Kennungen; eine danach angelegte Zeile liegt im Papierkorb; eine
 *      danach angelegte Ansicht bleibt (Ansichten werden nie gelöscht); ein
 *      danach gesetzter Haken ist weg; die Zahl der Sammlungen ist gleich.
 *   8  Ein `table`-Block behält seine Zellen (E114).
 *   9  Wer sich nicht geändert hat, wird nicht gestempelt — sonst trüge jedes
 *      Strg+Z die ganze Seite zum Server.
 *  10  Zweimal dasselbe Bild bewegt nichts (Idempotenz, §10).
 *  11  Eine Unterseite ist ein Blatt: was seit dem Bild IN ihr geschrieben
 *      wurde, bleibt.
 *  12  Eine inzwischen gesperrte Seite rührt der Verlauf nicht an.
 *
 * GEGEN DEN ALTEN STAND (446266f) rot in §1, §2, §4, §5: Kennungen wechseln,
 * Fassungen fehlen, Grabsteine liegen.
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const browser = await chromium.launch();
const fehler: string[] = [];

const frisch = async () => {
  const ktx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push(e.message));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  await pg.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  });
  return { ktx, pg };
};
/** Zwei Änderungen am Text, 800 ms auseinander (der Zaun des Verlaufs ist 700 ms), dann Strg+Z ohne fokussierten Block. */
const zweiSchritteUndZurueck = async (pg: any, textId: string) => {
  await pg.waitForTimeout(800);
  await pg.evaluate((id: string) => { Store.updateBlock(id, { text: 'Zwei' }); }, textId);
  await pg.waitForTimeout(800);
  await pg.evaluate((id: string) => { Store.updateBlock(id, { text: 'Drei' }); }, textId);
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
  await pg.keyboard.press('Control+z');
  await pg.waitForTimeout(1500);
};

try {
  /* ── §1 Unterseite ─────────────────────────────────────────────────────── */
  console.log('\n1 · Die Unterseite bleibt sie selbst');
  {
    const { ktx, pg } = await frisch();
    const ids = await pg.evaluate(async () => {
      const eltern = Store.addPage(null, { text: 'Eltern' });
      const t = Store.addBlock(eltern.id, 'text', { text: 'Eins' });
      const kind = Store.addPage(eltern.id, { text: 'Unterseite' });
      Store.addBlock(kind.id, 'text', { text: 'Inhalt der Unterseite' });
      await Store.versionSpeichern(kind.id, 'geplant');
      Store.setMeta('favoriten', [kind.id]);
      await Store.flush(); App.zeichneBaum(); App.oeffne(eltern.id);
      await new Promise(f => setTimeout(f, 900));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      return { eltern: eltern.id, text: t.id, kind: kind.id, fassungen: (await Store.versionen(kind.id)).length };
    });
    p('Vorher: die Unterseite hat eine Fassung', ids.fassungen === 1, 'fassungen=' + ids.fassungen);
    await zweiSchritteUndZurueck(pg, ids.text);
    const r = await pg.evaluate(async (ids: any) => {
      const kinder = Store.childrenOf(ids.eltern) as any[];
      const unter = kinder.find(k => k.type === 'page');
      return {
        texte: kinder.filter(k => k.type === 'text').map(k => k.text),
        unterId: unter?.id ?? null, alteLebt: !!Store.getBlock(ids.kind),
        fassungen: (await Store.versionen(ids.kind)).length,
        favoritGueltig: (Store.getMeta('favoriten') || []).every((f: string) => !!Store.getBlock(f) && Store.getBlock(f).alive !== false),
        inhalt: unter ? (Store.childrenOf(unter.id) as any[]).map(k => k.text) : null,
        toasts: [...document.querySelectorAll('.toast, #toast, .ui-toast')].map(t => t.textContent?.trim() ?? ''),
      };
    }, ids);
    p('Der Text der Elternseite ist zurückgenommen', JSON.stringify(r.texte) === '["Zwei"]', JSON.stringify(r.texte));
    p('Die Unterseite behält ihre Kennung', r.unterId === ids.kind, `${ids.kind.slice(0, 8)}… → ${String(r.unterId).slice(0, 8)}…`);
    p('Ihre Fassung ist noch da', r.fassungen === 1, 'fassungen=' + r.fassungen);
    p('Der Favorit zeigt auf eine lebende Seite', r.favoritGueltig);
    p('Ihr Inhalt ist unverändert', JSON.stringify(r.inhalt) === '["Inhalt der Unterseite"]', JSON.stringify(r.inhalt));
    p('Und die Seite hat es gesagt', r.toasts.some(t => /Rückgängig/.test(t)), JSON.stringify(r.toasts));
    await ktx.close();
  }

  /* ── §2 Bild ───────────────────────────────────────────────────────────── */
  console.log('\n2 · Das Bild behält Block und Bytes — auch nach dem Neuladen');
  {
    const { ktx, pg } = await frisch();
    const ids = await pg.evaluate(async () => {
      const s = Store.addPage(null, { text: 'Bildseite' });
      const t = Store.addBlock(s.id, 'text', { text: 'Eins' });
      const b = Store.addBlock(s.id, 'image', { text: '' });
      const bytes = new Uint8Array(4096); for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
      const satz = await (globalThis as any).Dateien.ablegen(new Blob([bytes], { type: 'image/png' }), { name: 'probe.png', blockId: b.id });
      Store.updateBlock(b.id, { dateiId: satz.id });
      await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 900));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      return { seite: s.id, text: t.id, bild: b.id, datei: satz.id };
    });
    await zweiSchritteUndZurueck(pg, ids.text);
    await pg.reload();
    await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
    await pg.waitForTimeout(800);
    const r = await pg.evaluate(async (ids: any) => {
      const bild = (Store.childrenOf(ids.seite) as any[]).find(k => k.type === 'image');
      const satz = await Store.dateiHolen(ids.datei);
      const blob = await (globalThis as any).Dateien.alsBlob(ids.datei);
      return { bildId: bild?.id ?? null, dateiId: bild?.dateiId ?? null, satzBlockId: satz?.blockId ?? null, bytes: blob ? blob.size : 0 };
    }, ids);
    p('Der Bild-Block behält seine Kennung', r.bildId === ids.bild, `${ids.bild.slice(0, 8)}… → ${String(r.bildId).slice(0, 8)}…`);
    p('Er zeigt auf dieselbe Datei', r.dateiId === ids.datei);
    p('Der Dateisatz zeigt auf denselben Block', r.satzBlockId === ids.bild, 'satz.blockId=' + String(r.satzBlockId).slice(0, 8));
    p('Die Bytes sind vollständig', r.bytes === 4096, 'bytes=' + r.bytes);
    await ktx.close();
  }

  /* ── §3 + §4 + §5 + §6: dazu, weg, Grabsteine, wiederholen ─────────────── */
  console.log('\n3 · Was das Rückgängig entfernt, liegt im Papierkorb');
  {
    const { ktx, pg } = await frisch();
    const ids = await pg.evaluate(async () => {
      const s = Store.addPage(null, { text: 'Kommen und Gehen' });
      const bleibt = Store.addBlock(s.id, 'text', { text: 'bleibt' });
      const geht = Store.addBlock(s.id, 'text', { text: 'wird gelöscht' });
      Store.setMeta('wolkeBloeckeWeg', []);
      /* Mit Marke schreibt `blockGrabstein` — ohne sie nie (indexdb.ts), und
         „Merkliste leer" könnte gegen keinen Stand rot werden. Die Marke
         allein löst keinen Netzruf aus: `abgleichen` verlangt `angemeldet()`. */
      Store.setMeta('wolkeMarkeHoch', '2000-01-01T00:00:00.000Z');
      /* Ohne Wolke sammelt die Merkliste nichts (E254: „Nur-Lokal-Nutzer
         sammeln nichts an") — also zählen wir die Purges selbst. */
      (window as any).__purges = 0;
      Store.on((was: unknown) => { if (was === 'purge') (window as any).__purges++; });
      await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 900));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      return { seite: s.id, bleibt: bleibt.id, geht: geht.id };
    });
    await pg.waitForTimeout(800);
    /* Schritt A: einen Block löschen (in den Papierkorb) … */
    await pg.evaluate((id: string) => { Store.trashBlock(id); }, ids.geht);
    await pg.waitForTimeout(800);
    /* … Schritt B: einen neuen anlegen. */
    const neu = await pg.evaluate((s: string) => Store.addBlock(s, 'text', { text: 'kam dazu' }).id, ids.seite);
    await pg.waitForTimeout(800);
    await pg.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
    await pg.keyboard.press('Control+z');            // nimmt Schritt B zurück
    await pg.waitForTimeout(1500);
    const nachB = await pg.evaluate((x: any) => {
      const neuer = Store.getBlock(x.neu);
      const kinder = (Store.childrenOf(x.seite) as any[]).map(k => k.id);
      return { neuerDa: !!neuer, neuerAlive: neuer ? neuer.alive : null, kinder, bleibtGleich: kinder.includes(x.bleibt),
               grabsteine: (Store.getMeta('wolkeBloeckeWeg') || []).length };
    }, { ...ids, neu });
    p('Der zurückgenommene Block liegt im Papierkorb, nicht im Nichts', nachB.neuerDa && nachB.neuerAlive === false, JSON.stringify({ da: nachB.neuerDa, alive: nachB.neuerAlive }));
    p('Der bleibende Block behält seine Kennung', nachB.bleibtGleich, JSON.stringify(nachB.kinder.map((k: string) => k.slice(0, 8))));
    console.log('\n4 · Was das Rückgängig zurückbringt, kommt mit seiner Kennung');
    await pg.keyboard.press('Control+z');            // nimmt Schritt A zurück: der gelöschte kommt wieder
    await pg.waitForTimeout(1500);
    const nachA = await pg.evaluate((x: any) => {
      const kinder = Store.childrenOf(x.seite) as any[];
      return { texte: kinder.map(k => k.text), gehtZurueck: kinder.some(k => k.id === x.geht),
               grabsteine: (Store.getMeta('wolkeBloeckeWeg') || []).length, purges: (window as any).__purges };
    }, ids);
    p('Der gelöschte Block ist wieder da', nachA.texte.includes('wird gelöscht'), JSON.stringify(nachA.texte));
    p('… mit seiner alten Kennung', nachA.gehtZurueck);
    console.log('\n5 · Kein Purge, keine Grabsteine für Blöcke, die noch da sind');
    p('Zwei Schritte zurück haben nichts endgültig gelöscht', nachA.purges === 0, 'purge-Meldungen=' + nachA.purges);
    p('Die Merkliste des Abgleichs ist leer', nachA.grabsteine === 0, 'wolkeBloeckeWeg=' + nachA.grabsteine);
    console.log('\n6 · Wiederholen geht denselben Weg');
    await pg.keyboard.press('Control+y');
    await pg.waitForTimeout(1500);
    const wieder = await pg.evaluate((x: any) => {
      const kinder = Store.childrenOf(x.seite) as any[];
      return { texte: kinder.map(k => k.text), bleibtGleich: kinder.some(k => k.id === x.bleibt), gehtWeg: !kinder.some(k => k.id === x.geht) };
    }, ids);
    p('Strg+Y löscht ihn wieder', wieder.gehtWeg && !wieder.texte.includes('wird gelöscht'), JSON.stringify(wieder.texte));
    p('Der bleibende Block hat immer noch seine Kennung', wieder.bleibtGleich);
    await ktx.close();
  }

  /* ── §7 + §8 + §9: Datenbank, Tabelle, Stempel ─────────────────────────── */
  console.log('\n7 · Datenbank: Kennungen bleiben, Neues geht in den Papierkorb, Ansichten bleiben');
  {
    const { ktx, pg } = await frisch();
    const ids = await pg.evaluate(async () => {
      const s = Store.addPage(null, { text: 'Datenbankseite' });
      const t = Store.addBlock(s.id, 'text', { text: 'Eins' });
      const todo = Store.addBlock(s.id, 'todo', { text: 'offen' });
      const tab = Store.addBlock(s.id, 'table', { text: '', rows: [['Jahr', 'Wert'], ['2026', '19']] });
      const db = Store.addDatabase(s.id, 'Probe');
      const zeilen = [1, 2, 3].map(n => Store.addRow(db.collectionId, { title: 'Zeile ' + n }).id);
      await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 900));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      return { seite: s.id, text: t.id, todo: todo.id, tab: tab.id, block: db.block.id, coll: db.collectionId, view: db.viewId, zeilen,
               sammlungen: Object.keys(Store.cache.collections).length };
    });
    await pg.waitForTimeout(800);
    /* Nach dem Bild: eine Zeile, eine Ansicht, ein Haken, ein Text. */
    const danach = await pg.evaluate((x: any) => {
      Store.updateBlock(x.text, { text: 'Zwei' });
      const z4 = Store.addRow(x.coll, { title: 'Zeile 4' }).id;
      const v2 = Store.addView(x.coll, 'board', 'Tafel')?.id ?? null;
      Store.updateBlock(x.todo, { checked: true });
      const tabVorher = Store.getBlock(x.tab).edited;
      return { z4, v2, tabVorher };
    }, ids);
    await pg.waitForTimeout(800);
    await pg.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(1500);
    const r = await pg.evaluate((x: any) => {
      const kinder = Store.childrenOf(x.seite) as any[];
      const dbBlock = kinder.find(k => k.type === 'database' || k.collectionId === x.coll);
      const coll = Store.cache.collections[x.coll];
      const tab = Store.getBlock(x.tab);
      const todo = Store.getBlock(x.todo);
      const z4 = Store.getBlock(x.z4);
      return {
        texte: kinder.filter(k => k.type === 'text').map(k => k.text),
        blockId: dbBlock?.id ?? null, collDa: !!coll, viewIds: coll?.viewIds ?? [],
        zeilenLeben: x.zeilen.every((id: string) => Store.getBlock(id)?.alive === true),
        z4Alive: z4 ? z4.alive : 'weg', z4Da: !!z4,
        sammlungen: Object.keys(Store.cache.collections).length,
        tabRows: JSON.stringify(tab?.rows ?? null), tabEdited: tab?.edited ?? null,
        todoChecked: todo?.checked ?? null, todoErledigt: todo?.erledigtAm ?? null,
      };
    }, { ...ids, z4: danach.z4 });
    p('Der Text ist zurückgenommen', JSON.stringify(r.texte) === '["Eins"]', JSON.stringify(r.texte));
    p('Der Datenbank-Block behält seine Kennung', r.blockId === ids.block, `${ids.block.slice(0, 8)}… → ${String(r.blockId).slice(0, 8)}…`);
    p('Die Sammlung ist dieselbe', r.collDa && r.sammlungen === ids.sammlungen, `sammlungen ${ids.sammlungen} → ${r.sammlungen}`);
    p('Die alte Ansicht steht vorn, die neue bleibt hinten', r.viewIds[0] === ids.view && (danach.v2 ? r.viewIds.includes(danach.v2) : true), JSON.stringify(r.viewIds.map((v: string) => v.slice(0, 8))));
    p('Die drei Zeilen leben mit ihren Kennungen', r.zeilenLeben);
    p('Die vierte Zeile liegt im Papierkorb, nicht im Nichts', r.z4Da && r.z4Alive === false, JSON.stringify({ da: r.z4Da, alive: r.z4Alive }));
    p('Der Haken nach dem Bild ist weg', !r.todoChecked && !r.todoErledigt, JSON.stringify({ checked: r.todoChecked, erledigtAm: r.todoErledigt }));
    console.log('\n8 · Die Tabelle behält ihre Zellen (E114)');
    p('rows unverändert', r.tabRows === JSON.stringify([['Jahr', 'Wert'], ['2026', '19']]), r.tabRows);
    console.log('\n9 · Wer sich nicht geändert hat, wird nicht gestempelt');
    p('Die Tabelle trägt denselben Stempel wie vorher', r.tabEdited === danach.tabVorher, `${danach.tabVorher} → ${r.tabEdited}`);
    console.log('\n10 · Zweimal dasselbe Bild bewegt nichts');
    const idem = await pg.evaluate((x: any) => {
      const bild = Store.baum(x.seite);
      const vorher = (Store.childrenOf(x.seite) as any[]).map(k => k.id + ':' + k.edited).join('|');
      const a = Store.baumAbgleichen(x.seite, bild);
      const b = Store.baumAbgleichen(x.seite, bild);
      const nachher = (Store.childrenOf(x.seite) as any[]).map(k => k.id + ':' + k.edited).join('|');
      return { a, b, gleich: vorher === nachher };
    }, ids);
    p('Der Abgleich mit dem eigenen Bild schreibt nichts', idem.gleich && idem.a?.gesetzt === 0 && idem.a?.weggelegt === 0 && idem.b?.gesetzt === 0, JSON.stringify(idem));
    await ktx.close();
  }

  /* ── §11 Unterseite ist ein Blatt ─────────────────────────────────────── */
  console.log('\n11 · Was seit dem Bild in der Unterseite geschrieben wurde, bleibt');
  {
    const { ktx, pg } = await frisch();
    const ids = await pg.evaluate(async () => {
      const eltern = Store.addPage(null, { text: 'Eltern' });
      const t = Store.addBlock(eltern.id, 'text', { text: 'Eins' });
      const kind = Store.addPage(eltern.id, { text: 'Unterseite' });
      Store.addBlock(kind.id, 'text', { text: 'alt' });
      await Store.flush(); App.zeichneBaum(); App.oeffne(eltern.id);
      await new Promise(f => setTimeout(f, 900));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      return { eltern: eltern.id, text: t.id, kind: kind.id };
    });
    await pg.waitForTimeout(800);
    await pg.evaluate((x: any) => { Store.updateBlock(x.text, { text: 'Zwei' }); Store.addBlock(x.kind, 'text', { text: 'neu in der Unterseite' }); Store.updateBlock(x.kind, { text: 'Unterseite, umbenannt' }); }, ids);
    await pg.waitForTimeout(800);
    await pg.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(1500);
    const r = await pg.evaluate((x: any) => ({
      texte: (Store.childrenOf(x.eltern) as any[]).filter(k => k.type === 'text').map(k => k.text),
      innen: (Store.childrenOf(x.kind) as any[]).map(k => k.text),
      titel: Store.getBlock(x.kind)?.text, kennung: !!Store.getBlock(x.kind),
    }), ids);
    p('Die Elternseite ist zurückgenommen', JSON.stringify(r.texte) === '["Eins"]', JSON.stringify(r.texte));
    p('Die Unterseite lebt mit ihrer Kennung', r.kennung);
    p('Ihr neuer Block ist noch da', r.innen.includes('neu in der Unterseite'), JSON.stringify(r.innen));
    p('Ihr neuer Titel auch', r.titel === 'Unterseite, umbenannt', JSON.stringify(r.titel));
    await ktx.close();
  }

  /* ── §12 Gesperrte Seite ─────────────────────────────────────────────── */
  console.log('\n12 · Eine inzwischen gesperrte Seite rührt der Verlauf nicht an');
  {
    const { ktx, pg } = await frisch();
    const ids = await pg.evaluate(async () => {
      const s = Store.addPage(null, { text: 'Bald gesperrt' });
      const t = Store.addBlock(s.id, 'text', { text: 'Eins' });
      await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
      await new Promise(f => setTimeout(f, 900));
      document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
      return { seite: s.id, text: t.id };
    });
    await pg.waitForTimeout(800);
    await pg.evaluate((x: any) => { Store.updateBlock(x.text, { text: 'Zwei' }); }, ids);
    await pg.waitForTimeout(800);
    await pg.evaluate((x: any) => { Store.updateBlock(x.seite, { locked: true }); }, ids);
    await pg.waitForTimeout(800);
    await pg.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); });
    await pg.keyboard.press('Control+z');
    await pg.waitForTimeout(1200);
    const r = await pg.evaluate((x: any) => ({ locked: Store.getBlock(x.seite)?.locked, text: Store.getBlock(x.text)?.text }), ids);
    p('Die Sperre steht noch', r.locked === true, JSON.stringify(r));
    p('Der Inhalt ist unangetastet', r.text === 'Zwei', JSON.stringify(r));
    await ktx.close();
  }

  p('Keine Fehler im Browser', fehler.length === 0, fehler.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
