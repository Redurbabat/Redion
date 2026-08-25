/* Suite 141 — Schriftgrösse und Schriftart je Block (E101)
 * ============================================================================
 * Redur wollte „wie in Word": Grösse, Farbe und Schriftart ändern.
 *
 * BEIM NACHSEHEN WAR EIN DRITTEL DAVON SCHON DA — Schriftfarbe und
 * Hintergrund gibt es seit Langem (`block.color` → `.t-red` / `.bg-red`,
 * erreichbar im Blockmenü unter „🎨 Farbe"). Gefehlt haben nur Grösse und
 * Schriftart. Wieder die E90-Klasse: der Wunsch klang vollständig neu, war
 * es aber nicht.
 *
 * WARUM JE BLOCK UND NICHT MITTEN IM SATZ. Der Editor liest den Text mit
 * `ct.textContent` zurück (`bindeEditor`). Eine Auszeichnung innerhalb einer
 * Zeile wäre beim nächsten Tastendruck weg — gemessen im Quelltext, nicht
 * vermutet. Inline kommt erst nach einer Rückübersetzung DOM → Text.
 *
 * WARUM KENNUNGEN UND KEINE WERTE. Gespeichert wird `'gross'`, nicht
 * `1.3em`. Ein freier Wert aus den Daten landete sonst in einem style-Feld,
 * und `"red;background:url(…)"` ist kein erfundener Fall (§19).
 *
 *   node pruefungen/lauf/test175.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8927;

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
const seite = await browser.newPage();
await seite.setViewportSize({ width: 1280, height: 900 });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

const bau = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Schriftprobe' });
  const b = Store.addBlock(s.id, 'text', { text: 'Ein Satz zum Ansehen' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  return { seite: s.id, blk: b.id };
});

console.log('\n1 · Der Katalog ist EINE Quelle');
const katalog = await seite.evaluate(() => {
  const T = (window as any).Textstile;
  return {
    da: !!T,
    groessen: T ? T.GROESSEN.map((x: string[]) => x[0]) : [],
    schriften: T ? T.SCHRIFTEN.map((x: string[]) => x[0]) : []
  };
});
p('Der Katalog ist geladen', (katalog as any).da);
p('Er kennt mehrere Grössen', ((katalog as any).groessen || []).length >= 4,
  JSON.stringify((katalog as any).groessen));
p('… und mehrere Schriftarten', ((katalog as any).schriften || []).length >= 4,
  JSON.stringify((katalog as any).schriften));

console.log('\n2 · Über das ECHTE Blockmenü: Grösse setzen');
const menueWeg = async (was: 'groesse' | 'schrift', wert: string) =>
  seite.evaluate(async (arg: any) => {
    document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
    const blk = document.querySelector<HTMLElement>(`[data-bid="${arg.blk}"]`);
    const griff = blk?.querySelector<HTMLElement>('.handles [data-a], .handles button, .griff')
               || blk?.querySelector<HTMLElement>('.handles');
    (Blocks as any).blockMenue(griff || blk!, Store.getBlock(arg.blk));
    await new Promise(r => setTimeout(r, 250));
    ([...document.querySelectorAll<HTMLElement>('.menu button')]
      .find(x => x.dataset.a === arg.was))?.click();
    await new Promise(r => setTimeout(r, 250));
    const eintraege = [...document.querySelectorAll<HTMLElement>('.menu button[data-s]')]
      .map(x => x.dataset.s);
    ([...document.querySelectorAll<HTMLElement>('.menu button[data-s]')]
      .find(x => x.dataset.s === arg.wert))?.click();
    await new Promise(r => setTimeout(r, 400));
    const ct = document.querySelector<HTMLElement>(`[data-bid="${arg.blk}"] .ct`);
    return {
      eintraege,
      klassen: ct ? [...ct.classList].filter(k => k.startsWith('tg-') || k.startsWith('ts-')) : [],
      groesseCss: ct ? getComputedStyle(ct).fontSize : '',
      schriftCss: ct ? getComputedStyle(ct).fontFamily : '',
      stil: (Store.getBlock(arg.blk) || {}).stil
    };
  }, { ...bau, was, wert });

const vorher = await seite.evaluate((arg: any) => {
  const ct = document.querySelector<HTMLElement>(`[data-bid="${arg.blk}"] .ct`);
  return { groesse: ct ? getComputedStyle(ct).fontSize : '', schrift: ct ? getComputedStyle(ct).fontFamily : '' };
}, bau);

const gross = await menueWeg('groesse', 'gross');
console.log('   ' + JSON.stringify(gross));
p('Das Menü bietet die Grössen an', ((gross as any).eintraege || []).includes('gross'),
  JSON.stringify((gross as any).eintraege));
p('Der Block trägt die Klasse tg-gross',
  ((gross as any).klassen || []).includes('tg-gross'), JSON.stringify((gross as any).klassen));
gleich('… und der Stil steht in den Daten',
  ((gross as any).stil || {}).groesse, 'gross');
p('Die Schrift ist wirklich grösser geworden',
  parseFloat((gross as any).groesseCss) > parseFloat(vorher.groesse),
  vorher.groesse + ' → ' + (gross as any).groesseCss);

console.log('\n3 · Und die Schriftart');
const serif = await menueWeg('schrift', 'serif');
console.log('   ' + JSON.stringify({ klassen: (serif as any).klassen, schrift: (serif as any).schriftCss }));
p('Das Menü bietet die Schriftarten an', ((serif as any).eintraege || []).includes('serif'),
  JSON.stringify((serif as any).eintraege));
p('Der Block trägt die Klasse ts-serif',
  ((serif as any).klassen || []).includes('ts-serif'), JSON.stringify((serif as any).klassen));
p('Die Grösse bleibt dabei erhalten',
  ((serif as any).klassen || []).includes('tg-gross'), JSON.stringify((serif as any).klassen));
p('Die Schriftfamilie hat sich geändert',
  (serif as any).schriftCss !== vorher.schrift,
  vorher.schrift + ' → ' + (serif as any).schriftCss);

console.log('\n4 · Ein erfundener Wert wirkt NICHT');
const boes = await seite.evaluate(async (arg: any) => {
  Store.updateBlock(arg.blk, { stil: { groesse: 'gross;background:url(x)', schrift: 'Comic; evil' } });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 400));
  const ct = document.querySelector<HTMLElement>(`[data-bid="${arg.blk}"] .ct`);
  return {
    klassen: ct ? [...ct.classList] : [],
    stilAttribut: ct ? (ct.getAttribute('style') || '(keins)') : '',
    T: (window as any).Textstile.klassen({ groesse: 'gross;background:url(x)' })
  };
}, bau);
console.log('   ' + JSON.stringify(boes));
p('Der Katalog verwirft ihn', ((boes as any).T || []).length === 0,
  JSON.stringify((boes as any).T));
p('Am Block hängt keine erfundene Klasse',
  !((boes as any).klassen || []).some((k: string) => k.includes(';') || k.includes('url')),
  JSON.stringify((boes as any).klassen));
p('Und nichts landet in einem style-Feld',
  !/background|url\(/.test(String((boes as any).stilAttribut)),
  String((boes as any).stilAttribut));

console.log('\n5 · Der Stil überlebt das Neuladen');
await seite.evaluate((arg: any) => {
  Store.updateBlock(arg.blk, { stil: { groesse: 'sehrgross', schrift: 'mono' } });
}, bau);
await seite.waitForTimeout(300);
await seite.reload();
await seite.waitForTimeout(2600);
/* Nach dem Neuladen ist die Einrichtung der Hauptwelten wieder da —
   sie erscheint 300 ms nach dem Start und fängt Klicks ab (E132). */
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
});
const nachher = await seite.evaluate(async (arg: any) => {
  App.oeffne(arg.seite);
  await new Promise(r => setTimeout(r, 700));
  const ct = document.querySelector<HTMLElement>(`[data-bid="${arg.blk}"] .ct`);
  return {
    klassen: ct ? [...ct.classList].filter(k => k.startsWith('tg-') || k.startsWith('ts-')) : [],
    stil: (Store.getBlock(arg.blk) || {}).stil
  };
}, bau);
console.log('   ' + JSON.stringify(nachher));
p('Die Klassen sind wieder da',
  ((nachher as any).klassen || []).includes('tg-sehrgross') &&
  ((nachher as any).klassen || []).includes('ts-mono'),
  JSON.stringify((nachher as any).klassen));

console.log('\n6 · Die Farbe, die es schon gab, ist unberührt');
const farbe = await seite.evaluate(async (arg: any) => {
  Store.updateBlock(arg.blk, { color: 'red' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 400));
  const ct = document.querySelector<HTMLElement>(`[data-bid="${arg.blk}"] .ct`);
  return { klassen: ct ? [...ct.classList] : [] };
}, bau);
p('Farbe und Schriftstil vertragen sich',
  ((farbe as any).klassen || []).includes('t-red') &&
  ((farbe as any).klassen || []).includes('tg-sehrgross'),
  JSON.stringify((farbe as any).klassen));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
