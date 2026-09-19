/* Suite 536 — Der Dock-Effekt gilt auch ohne Studio (E625, W5)
 * ============================================================================
 * `AUFGABEN.md` führte W5 — „Vergrössern beim Überfahren, mit
 * `prefers-reduced-motion` als Abschaltung" — als offen. NACHGEMESSEN am
 * 19. September 2026 war er zum grössten Teil gebaut, nur eben nicht überall:
 *
 *     pdf-studio.css:666-716    .document-drawingbar button svg
 *                               .document-studio .blatt-werk > button svg
 *                               .document-studio .blatt-werk > .blatt-tafel > button svg
 *
 * Drei Familien, und alle drei hängen am Studio. Auf einer GEWÖHNLICHEN Seite
 * traf keine einzige — dort war die Leiste still.
 *
 * Und Redurs Bild 8 fehlte ganz: das „Farb-Dock mit Namensfähnchen". Die
 * Farbtupfer tragen kein `svg`, fielen also auch im Studio aus jeder Regel
 * heraus — gezählt, nicht vermutet.
 *
 * ─── DIE ZUSAGEN DIESES LAUFS ──────────────────────────────────────────────
 *   §1 EIN ÜBERFAHRENER KNOPF WÄCHST, auch ohne Studio.
 *   §2 DIE NACHBARN HEBEN SCHWÄCHER MIT — das ist der Teil, an dem man ein
 *      Dock erkennt (`:has(+ button:hover)` nach links, der Nachbarwähler
 *      nach rechts).
 *   §3 DIE FARBTUPFER WACHSEN AUCH, obwohl sie kein `svg` haben.
 *   §4 UND SIE SAGEN IHREN NAMEN: ein Fähnchen über dem Tupfer, aus dem
 *      `title`, den er ohnehin trägt — keine zweite Liste von Farbnamen (§8).
 *   §5 WER BEWEGUNG NICHT WILL, BEKOMMT KEINE (§38).
 *   §6 IM STUDIO BLEIBT ES, WIE ES WAR — die Regeln sind gewandert, nicht
 *      verdoppelt.
 *   §7 Keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * Am 19. September, vor dem Bau, waren §1 bis §4 rot: auf der gewöhnlichen
 * Seite blieb `transform` bei `none`, und ein Fähnchen gab es nirgends.
 *
 *   node pruefungen/lauf/test536.mts
 *   node pruefungen/alle.mts 536
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9637;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
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

const browser = await chromium.launch();
const fehler: string[] = [];

/** Der Massstab aus `transform` — 1 heisst „keiner". */
const massstab = async (pg: Page, wahl: string): Promise<number> => pg.evaluate((s: string) => {
  const el = document.querySelector<HTMLElement>(s);
  if (!el) return -1;
  const t = getComputedStyle(el).transform;
  if (!t || t === 'none') return 1;
  const z = t.match(/-?\d+(\.\d+)?/g);
  return z && z[0] ? Math.round(Number(z[0]) * 100) / 100 : 1;
}, wahl);

const aufbauen = async (studio: boolean, ruhe = false): Promise<{ ktx: BrowserContext; pg: Page }> => {
  const ktx = await browser.newContext({
    viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1,
    ...(ruhe ? { reducedMotion: 'reduce' as const } : {})
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await pg.waitForTimeout(900);
  await pg.evaluate(async (imStudio: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(n => n.remove());
    const s = Store.addPage(null, { text: 'Dock-Welle', icon: '🌊' });
    Store.updateBlock(s.id, { wide: true });
    const b = Store.addBlock(s.id, 'blatt', {
      text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: []
    });
    if (imStudio) Store.updateBlock(s.id, { dokumentModus: true });
    else Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 1100));
  }, studio);
  if (studio) await pg.waitForSelector('.document-drawingbar');
  await pg.waitForTimeout(400);
  await pg.click(studio ? '[data-document-tool="stift"]' : '.blatt-werk [data-wz="stift"]')
    .catch(() => {});
  await pg.waitForTimeout(320);
  return { ktx, pg };
};

/* ═══ §1 und §2 · Die Welle auf der gewöhnlichen Seite ═════════════════════ */
console.log('\n§1 Ein überfahrener Knopf wächst — auch ohne Studio');
const { ktx: k1, pg: p1 } = await aufbauen(false);
/* ZUERST DEN ZEIGER WEGNEHMEN. `aufbauen` klickt den Stift, und danach
   steht die Maus noch auf ihm — der Nachbar „Marker" trug deshalb schon
   1,13, bevor der Lauf irgendetwas überfahren hatte. Der Ruhezustand muss
   wirklich Ruhe sein, sonst misst §1 sich selbst. */
await p1.mouse.move(20, 700);
await p1.waitForTimeout(320);
const ruhig = await massstab(p1, '.blatt-werk [data-wz="marker"] svg');
p('Ohne Zeiger darauf ist kein Massstab gesetzt', ruhig === 1, String(ruhig));
await p1.hover('.blatt-werk [data-wz="marker"]');
await p1.waitForTimeout(320);
const gross = await massstab(p1, '.blatt-werk [data-wz="marker"] svg');
console.log(`    überfahren: ${gross}`);
p('Der überfahrene Knopf wächst', gross > 1.15, String(gross));

console.log('\n§2 Die Nachbarn heben schwächer mit — die Dock-Welle');
const links = await massstab(p1, '.blatt-werk [data-wz="stift"] svg');
const rechts = await massstab(p1, '.blatt-werk [data-wz="formen"] svg');
console.log(`    links ${links} · Mitte ${gross} · rechts ${rechts}`);
p('Der linke Nachbar hebt mit', links > 1 && links < gross, String(links));
p('Der rechte Nachbar hebt mit', rechts > 1 && rechts < gross, String(rechts));
p('… und beide gleich stark', links === rechts, `${links} gegen ${rechts}`);
/* ZWEI WEITER IST SCHLUSS — sonst wäre es keine Welle, sondern eine Flut.
   Der Knopf wird gezählt, nicht benannt: welches Werkzeug zwei Plätze
   weiter steht, hängt an Redurs eigener Reihenfolge (E570/E571). */
const fern = await p1.evaluate(() => {
  const alle = [...document.querySelectorAll<HTMLElement>('.blatt-werk [data-wz]')]
    .filter(k => k.getClientRects().length > 0);
  const i = alle.findIndex(k => k.matches(':hover'));
  const ziel = i >= 0 ? (alle[i + 2] ?? alle[i - 2]) : undefined;
  const svg = ziel?.querySelector('svg');
  if (!svg) return -1;
  const t = getComputedStyle(svg).transform;
  if (!t || t === 'none') return 1;
  const z = t.match(/-?\d+(\.\d+)?/g);
  return z && z[0] ? Math.round(Number(z[0]) * 100) / 100 : 1;
});
p('Zwei Knöpfe weiter bleibt alles ruhig', fern === 1, String(fern));

/* ═══ §3 und §4 · Die Farbtupfer ═══════════════════════════════════════════ */
console.log('\n§3 Die Farbtupfer wachsen auch — sie haben kein `svg`');
const tupferRuhig = await massstab(p1, '.blatt-werk .blatt-farbe');
p('Ruhig ist ruhig', tupferRuhig === 1, String(tupferRuhig));
await p1.locator('.blatt-werk .blatt-farbe').nth(1).hover();
await p1.waitForTimeout(320);
const tupfer = await p1.evaluate(() => {
  const alle = [...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe')]
    .filter(k => k.getClientRects().length > 0);
  const mass = (e: HTMLElement | undefined): number => {
    if (!e) return -1;
    const t = getComputedStyle(e).transform;
    if (!t || t === 'none') return 1;
    const z = t.match(/-?\d+(\.\d+)?/g);
    return z && z[0] ? Math.round(Number(z[0]) * 100) / 100 : 1;
  };
  const drauf = alle.find(k => k.matches(':hover'));
  const i = drauf ? alle.indexOf(drauf) : -1;
  const fahne = drauf ? getComputedStyle(drauf, '::before') : null;
  return {
    drauf: mass(drauf), nachbar: mass(i >= 0 ? alle[i + 1] : undefined),
    titel: drauf?.getAttribute('title') ?? '',
    fahneInhalt: fahne?.content ?? '', fahneSichtbar: fahne?.display ?? ''
  };
});
console.log('    ' + JSON.stringify(tupfer));
p('Der überfahrene Tupfer wächst', tupfer.drauf > 1.1, String(tupfer.drauf));
p('… und sein Nachbar hebt schwächer mit',
  tupfer.nachbar > 1 && tupfer.nachbar < tupfer.drauf, String(tupfer.nachbar));

console.log('\n§4 Und der Tupfer sagt seinen Namen — ohne Fähnchen (L190)');
/* REDURS BILD 8 ZEIGT EIN FÄHNCHEN. Gebaut ist es nicht, und der Grund ist
   gemessen, nicht gemeint: am Tupfer sind BEIDE Pseudoelemente vergeben —
   `::before` ist die 1-px-Kante gegen den verschwindenden schwarzen Tupfer
   im Dunkelmodus (E568), `::after` die 44-px-Trefffläche (§37). Ein
   Fähnchen auf `::before` erbte das `inset:5px` der Kantenregel und lag
   mitten auf dem Tupfer; unter den Tupfer gelegt war es zu sechzig Prozent
   vom Papier verdeckt. Was dieser Abschnitt hält, ist deshalb das, worauf
   es ankommt: der Name IST da, für Auge und Vorleser. */
p('Er trägt einen Namen, nicht nur einen Hexwert',
  /^[A-ZÄÖÜ][a-zäöüß]/.test(tupfer.titel), tupfer.titel);
const namen = await p1.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe')]
    .filter(k => k.getClientRects().length > 0)
    .map(k => [k.getAttribute('title') ?? '', k.getAttribute('aria-label') ?? '']));
p('Jeder sichtbare Tupfer trägt Titel UND `aria-label` (§38)',
  namen.length > 0 && namen.every(([t, a]) => (t ?? '').length > 1 && (a ?? '').length > 1),
  JSON.stringify(namen.slice(0, 3)));
p('Die beiden Pseudoelemente sind vergeben — daher kein Fähnchen (L190)',
  tupfer.fahneInhalt === 'none' || tupfer.fahneInhalt === '""' || tupfer.fahneInhalt === '',
  `::before trägt ${tupfer.fahneInhalt}`);

/* ═══ §5 · Wer Bewegung nicht will ═════════════════════════════════════════ */
console.log('\n§5 Wer Bewegung nicht will, bekommt keine (§38)');
const { ktx: k2, pg: p2 } = await aufbauen(false, true);
await p2.hover('.blatt-werk [data-wz="marker"]');
await p2.waitForTimeout(320);
const still = await massstab(p2, '.blatt-werk [data-wz="marker"] svg');
p('Bei `prefers-reduced-motion` wächst nichts', still === 1, String(still));
const stillNachbar = await massstab(p2, '.blatt-werk [data-wz="stift"] svg');
p('… auch die Nachbarn nicht', stillNachbar === 1, String(stillNachbar));
await p2.locator('.blatt-werk .blatt-farbe').nth(1).hover();
await p2.waitForTimeout(320);
const stillTupfer = await p2.evaluate(() => {
  const k = [...document.querySelectorAll<HTMLElement>('.blatt-werk .blatt-farbe')]
    .filter(x => x.getClientRects().length > 0).find(x => x.matches(':hover'));
  if (!k) return -1;
  const t = getComputedStyle(k).transform;
  if (!t || t === 'none') return 1;
  const z = t.match(/-?\d+(\.\d+)?/g);
  return z && z[0] ? Math.round(Number(z[0]) * 100) / 100 : 1;
});
p('… und die Tupfer auch nicht', stillTupfer === 1, String(stillTupfer));

/* ═══ §6 · Im Studio bleibt es, wie es war ═════════════════════════════════ */
console.log('\n§6 Im Studio bleibt es, wie es war (keine Verdoppelung)');
const { ktx: k3, pg: p3 } = await aufbauen(true);
await p3.hover('.document-drawingbar [data-document-tool="marker"]');
await p3.waitForTimeout(320);
const studioGross = await massstab(p3, '.document-drawingbar [data-document-tool="marker"] svg');
p('Die obere Leiste des Studios wächst weiter', studioGross > 1.15, String(studioGross));
/* IM DOCK STEHT DAS ZUBEHÖR, nicht die Werkzeuge (E573): `[data-wz]` ist
   dort versteckt. Gesucht wird deshalb irgendein sichtbarer Knopf mit
   einem `svg` — welcher, hängt am gewählten Werkzeug. */
const dockZahl = await p3.evaluate(() => {
  const alle = [...document.querySelectorAll<HTMLElement>('.document-stage[data-aktiv] .blatt-werk button')]
    .filter(x => x.getClientRects().length > 0 && x.querySelector('svg') && !x.hasAttribute('disabled'));
  return alle.length;
});
if (dockZahl > 0) {
  /* Über den KASTEN fahren, nicht über einen Wähler: welche Knöpfe im Dock
     stehen, hängt am Werkzeug, und `:has(svg)` trifft auch die, die das CSS
     gerade wegklappt. Playwright wartet dann dreissig Sekunden auf etwas,
     das niemand versteckt hat — es gehört dort nur nicht hin. */
  const kasten = await p3.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('.document-stage[data-aktiv] .blatt-werk button')]
      .filter(x => x.getClientRects().length > 0 && x.querySelector('svg') && !x.hasAttribute('disabled'))[0];
    if (!k) return null;
    const r = k.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (kasten) await p3.mouse.move(kasten.x, kasten.y);
  await p3.waitForTimeout(320);
  const dockGross = await p3.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('.document-stage[data-aktiv] .blatt-werk button')]
      .find(x => x.matches(':hover'));
    const svg = k?.querySelector('svg');
    if (!svg) return -1;
    const t = getComputedStyle(svg).transform;
    if (!t || t === 'none') return 1;
    const z = t.match(/-?\d+(\.\d+)?/g);
    return z && z[0] ? Math.round(Number(z[0]) * 100) / 100 : 1;
  });
  p(`Und der Dock ebenfalls (${dockZahl} Knöpfe mit Zeichen)`, dockGross > 1.15, String(dockGross));
} else p('Ein Knopf mit Zeichen im Dock gefunden', false);

/* ═══ §7 · Keine Seitenfehler ══════════════════════════════════════════════ */
console.log('\n§7 Keine Seitenfehler');
p('Die Seite meldet keinen Fehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await k1.close(); await k2.close(); await k3.close();
await browser.close();
server.close();
console.log(`\n${ok} gut, ${weg} weg`);
process.exit(weg === 0 ? 0 : 1);
