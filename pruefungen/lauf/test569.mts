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

  p('Keine Fehler im Browser', fehler.length === 0, fehler.slice(0, 3).join(' | '));
} finally {
  await browser.close();
  server.close();
}
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
