/* Suite 467 — Die zwei letzten Reste: Ausschnitt im Zoom-Fenster, Spalten (E498)
 * ============================================================================
 * Zwei Zeilen aus L133, beide klein und beide seit G5 offen:
 *
 *   „Was noch fehlt: „Ausschnitt" und „Erkennen" ruhen, solange es offen ist."
 *   „Offen bleibt: umgeordnet wird nur innerhalb derselben Eltern."
 *
 *   §1 IM ZOOM-FENSTER RUHEN SIE SICHTBAR — am Knopf, nicht erst als
 *      Meldung nach dem Druck (§38: der Zustand gehört an den Knopf).
 *   §2 UND SIE WACHEN WIEDER AUF, wenn das Fenster zugeht — auch nach
 *      einem Neuzeichnen des Inspectors.
 *   §3 ÜBER SPALTEN HINWEG ORDNEN: eine Seite aus der rechten Spalte vor
 *      eine der linken ziehen — sie wechselt die Eltern und behält ihre
 *      Kennung.
 *   §4 IN DERSELBEN SPALTE bleibt alles, wie es war.
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `ausschnittRuhen(true)` aus `lupeSetzen` nehmen: die Knöpfe stehen
 *        offen da und geben erst nach dem Druck eine Absage. Rot.
 *   §2 → den Block im Inspector weglassen, der den Ruhezustand beim
 *        Neuzeichnen mitnimmt: nach einem Seitenwechsel stehen sie wieder
 *        offen. Rot.
 *   §3 → den Zweig für fremde Eltern durch das alte `return false` mit der
 *        Meldung ersetzen: über Spalten geht nichts. Rot.
 *
 *   node pruefungen/lauf/test467.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9587;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/** Ein Dokument mit zwei Blattseiten, Inspector offen. */
const einfach = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Skript', icon: '📕' });
    for (let i = 0; i < 2; i++) {
      const blatt = Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28,
        blattHoehe: 841.89, raumVersion: 1, papier: 'liniert', marken: [] });
      Store.addBlock(blatt.id, 'text', { text: 'Seite ' + (i + 1) });
    }
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.document-workspace', { timeout: 15000 });
  await s.waitForTimeout(1100);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  return s;
};

/** Der Zustand der zwei Knöpfe. */
const knoepfe = (s: Page) => s.evaluate(`(() => {
  const eins = (was) => {
    const k = document.querySelector('.document-inspector-actions [data-document-action="' + was + '"]');
    return k ? { aus: k.disabled, aria: k.getAttribute('aria-disabled'), titel: k.title } : null;
  };
  return JSON.stringify({ ausschnitt: eins('select-region'), erkennen: eins('recognize'),
    lupe: document.querySelector('.document-workspace')?.dataset.lupe || 'aus' });
})()`).then(x => JSON.parse(x as string));

/* ═══ §1 Im Zoom-Fenster ruhen sie ═════════════════════════════════════════ */
console.log('\n§1 Offen ruhen „Ausschnitt" und „Erkennen"');
{
  const s = await einfach();
  const vorher = await knoepfe(s);
  gleich('Ohne Zoom-Fenster stehen beide offen',
    [vorher.ausschnitt.aus, vorher.erkennen.aus, vorher.lupe], [false, false, 'aus']);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="lupe"]')?.click());
  await s.waitForTimeout(600);
  const drin = await knoepfe(s);
  gleich('Mit Zoom-Fenster sind beide gesperrt',
    [drin.ausschnitt.aus, drin.erkennen.aus, drin.lupe], [true, true, 'an']);
  gleich('… und sagen es auch der Sprachausgabe (§38)',
    [drin.ausschnitt.aria, drin.erkennen.aria], ['true', 'true']);
  p('… und der Hinweis sagt, WARUM', /Zoom-Fenster/.test(String(drin.ausschnitt.titel))
    && /ganzen Seite/.test(String(drin.ausschnitt.titel)), String(drin.ausschnitt.titel));
  await s.close();
}

/* ═══ §2 Und wieder auf ════════════════════════════════════════════════════ */
console.log('\n§2 Zu ist wieder offen — auch nach einem Neuzeichnen');
{
  const s = await einfach();
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="lupe"]')?.click());
  await s.waitForTimeout(600);
  /* Den Inspector zuklappen und wieder aufklappen — er baut seine Knöpfe
     dabei frisch. Der Ruhezustand muss das überstehen, sonst stünden sie
     wieder offen da, während das Fenster noch offen ist. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="inspector"]')?.click());
  await s.waitForTimeout(500);
  const nachWechsel = await knoepfe(s);
  gleich('Nach dem Neuzeichnen ruhen sie weiter',
    [nachWechsel.ausschnitt.aus, nachWechsel.erkennen.aus], [true, true]);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="lupe"]')?.click());
  await s.waitForTimeout(700);
  const zu = await knoepfe(s);
  gleich('Zugeklapptes Fenster gibt sie frei',
    [zu.ausschnitt.aus, zu.erkennen.aus, zu.lupe], [false, false, 'aus']);
  p('… und der Hinweis ist wieder der gewöhnliche',
    !/Zoom-Fenster/.test(String(zu.ausschnitt.titel)), String(zu.ausschnitt.titel));
  await s.close();
}

/* ═══ §3 Über Spalten hinweg ordnen ════════════════════════════════════════ */
console.log('\n§3 Eine Seite aus der rechten Spalte nach links');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  const gebaut = JSON.parse(await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Zweispalter', icon: '📕' });
    const zwei = Store.addBlock(seite.id, 'columns', { text: '' });
    const links = Store.addBlock(zwei.id, 'spalte', { text: '' });
    const rechts = Store.addBlock(zwei.id, 'spalte', { text: '' });
    const mach = (eltern, name) => {
      const b = Store.addBlock(eltern, 'blatt', { text: '', blattBreite: 595.28,
        blattHoehe: 841.89, raumVersion: 1, marken: [
          { id: name, art: 'stift', farbe: '#111111', breite: 2, pts: [[10, 10], [80, 80]] }] });
      Store.addBlock(b.id, 'text', { text: name });
      return b.id;
    };
    const a1 = mach(links.id, 'links-1');
    const a2 = mach(links.id, 'links-2');
    const b1 = mach(rechts.id, 'rechts-1');
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
    await new Promise(r => setTimeout(r, 1200));
    return JSON.stringify({ seite: seite.id, links: links.id, rechts: rechts.id, a1, a2, b1 });
  })()`) as string);
  await s.waitForTimeout(400);

  const reihe = () => s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const liste = DocumentMode.documentsIn(seite);
    return JSON.stringify({ ids: liste.map(b => b.id), eltern: liste.map(b => b.parentId),
      marken: liste.map(b => (b.marken || [])[0]?.id || '') });
  })()`).then(x => JSON.parse(x as string));

  const davor = await reihe();
  gleich('Vorher: zwei links, eine rechts', davor.marken, ['links-1', 'links-2', 'rechts-1']);

  /* Der Griff steht nicht am Modul, sondern hinter dem Ziehen in der
     Miniaturenleiste — also wird gezogen, wie eine Hand es täte. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="thumbnails"]')?.click());
  await s.waitForTimeout(600);
  await s.evaluate(`(async () => {
    const leiste = document.querySelector('.document-thumbnails');
    const zeilen = [...leiste.querySelectorAll('.document-thumb-zeile')];
    const von = zeilen[2].getBoundingClientRect();
    const zielY = zeilen[0].getBoundingClientRect().top + 4;
    const ev = (typ, x, y) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: x, clientY: y, pointerId: 7, pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1 });
    const x0 = von.left + von.width / 2, y0 = von.top + von.height / 2;
    zeilen[2].dispatchEvent(ev('pointerdown', x0, y0));
    for (let i = 1; i <= 8; i++) leiste.dispatchEvent(ev('pointermove', x0, y0 + (zielY - y0) * i / 8));
    leiste.dispatchEvent(ev('pointerup', x0, zielY));
    await new Promise(r => setTimeout(r, 800));
  })()`);
  await s.waitForTimeout(500);
  const danach = await reihe();
  gleich('Nachher steht sie vorn', danach.marken, ['rechts-1', 'links-1', 'links-2']);
  gleich('Sie behält ihre Kennung', danach.ids[0], davor.ids[2]);
  gleich('Und sie hängt jetzt in der linken Spalte', danach.eltern[0], gebaut.links);
  p('Die rechte Spalte hat sie nicht mehr', await s.evaluate(
    `Store.getBlock(${JSON.stringify(gebaut.rechts)}).content.length === 0`));
  await s.close();
}

/* ═══ §4 In derselben Spalte bleibt alles, wie es war ══════════════════════ */
console.log('\n§4 In derselben Spalte unverändert');
{
  const s = await einfach();
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('[data-document-action="thumbnails"]')?.click());
  await s.waitForTimeout(600);
  const davor = JSON.parse(await s.evaluate(`(() => {
    const liste = DocumentMode.documentsIn(Store.getBlock(App.aktuelleSeite()));
    return JSON.stringify({ ids: liste.map(b => b.id), eltern: liste.map(b => b.parentId) });
  })()`) as string);
  await s.evaluate(`(async () => {
    const leiste = document.querySelector('.document-thumbnails');
    const zeilen = [...leiste.querySelectorAll('.document-thumb-zeile')];
    const von = zeilen[1].getBoundingClientRect();
    const zielY = zeilen[0].getBoundingClientRect().top + 4;
    const ev = (typ, x, y) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: x, clientY: y, pointerId: 8, pointerType: 'mouse', isPrimary: true,
      button: typ === 'pointermove' ? -1 : 0, buttons: typ === 'pointerup' ? 0 : 1 });
    const x0 = von.left + von.width / 2, y0 = von.top + von.height / 2;
    zeilen[1].dispatchEvent(ev('pointerdown', x0, y0));
    for (let i = 1; i <= 8; i++) leiste.dispatchEvent(ev('pointermove', x0, y0 + (zielY - y0) * i / 8));
    leiste.dispatchEvent(ev('pointerup', x0, zielY));
    await new Promise(r => setTimeout(r, 800));
  })()`);
  await s.waitForTimeout(400);
  const danach = JSON.parse(await s.evaluate(`(() => {
    const liste = DocumentMode.documentsIn(Store.getBlock(App.aktuelleSeite()));
    return JSON.stringify({ ids: liste.map(b => b.id), eltern: liste.map(b => b.parentId) });
  })()`) as string);
  gleich('Die zweite steht jetzt vorn', danach.ids, [davor.ids[1], davor.ids[0]]);
  gleich('Und beide hängen weiter an derselben Stelle', danach.eltern, davor.eltern);
  await s.close();
}

/* ═══ §5 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§5 Quellen');
{
  const q = lies('src/bereiche/pdf/document-mode.ts');
  p('Der Ruhezustand steht an EINER Stelle (`ausschnittRuhen`)',
    (q.match(/const ausschnittRuhen = /g) || []).length === 1
    && (q.match(/ausschnittRuhen\(/g) || []).length === 2);
  p('Die Meldung bleibt trotzdem stehen — für Tastatur und Palette',
    /Schliess zuerst das Zoom-Fenster/.test(q));
  p('Die alte Absage wird nicht mehr ausgesprochen',
    !/UI\.toast\('Die Seiten dieses Dokuments liegen in mehreren Spalten/.test(q));
  /* Die sichere Reihenfolge steht auch hier: erst dazulegen, dann umhängen,
     zuletzt wegnehmen — dieselbe wie in E496. GEMESSEN WIRD IM BLOCK von
     `seiteAnStelle`, nicht in der ganzen Datei: dieselbe Wegnehmen-Zeile
     steht auch in `seiteInsDokument`, und die kommt weiter vorn. */
  const block = q.slice(q.indexOf('const seiteAnStelle = '));
  const dazu = block.indexOf('Store.updateBlock(zielEltern.id, { content: hin })');
  const haengen = block.indexOf('Store.updateBlock(block.id, { parentId: zielEltern.id');
  const weg = block.indexOf('{ content: (stelle.eltern.content || []).filter');
  p('Erst dazulegen, dann umhängen, zuletzt wegnehmen',
    dazu > 0 && haengen > dazu && weg > haengen, `${dazu} / ${haengen} / ${weg}`);
  p('Das erzeugte JS trägt beides',
    /ausschnittRuhen/.test(lies('quell/bereiche/pdf/document-mode.js'))
    && /zielEltern/.test(lies('quell/bereiche/pdf/document-mode.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
