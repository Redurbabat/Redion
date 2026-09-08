/* Suite 480 — Die Leiste wie GoodNotes: Stiftreihe, Laser, vier Plätze (E512)
 * ============================================================================
 * Redur, 8. September, mit fünf Bildern aus GoodNotes und drei Sätzen:
 *
 *   „Die Fachzeichen-Stift kommt, wenn ich die Stift klicke — sollte neben
 *    es, also links unten, wo die Farben dort sind, mir zeigen, welche
 *    Stift ich will."
 *   „Alter, wieso habe ich keinen Laserpointer? Mache es sofort."
 *   „Und die Stift[leiste] sollte ich als komplett bewegen können, also
 *    nach links, rechts, Mitte und ganz oben."
 *
 *   §1 DIE STIFTREIHE: sechs Knöpfe statt eines Wechslers, EIN Tipp je
 *      Stift, der geführte ist zu sehen — und der alte Rundlauf ist nicht
 *      weg, er liegt auf der Taste P.
 *   §2 DER LASERPOINTER: ein Werkzeug, das ZEIGT und nichts schreibt.
 *      Keine Marke, kein Schritt im Verlauf, nichts in der Sicherung.
 *   §3 VIER PLÄTZE für die Leiste, gemerkt, und an der Seite steht sie
 *      wirklich am Rand — gemessen, nicht behauptet.
 *   §4 QUELLEN.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → die Reihe zurück auf einen Wechselknopf: fünf der sechs Zusagen.
 *   §2 → im Laser-Zweig `return` streichen: der Strahl wird ein Strich.
 *   §3 → `row.dataset.lage` beim Bauen weglassen: der gemerkte Platz gilt
 *        erst nach dem ersten Klick — derselbe Fund wie in E509.
 *
 *   node pruefungen/lauf/test480.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9600;
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

const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    Store.setMeta('zeichnen:stift', 'fueller');
    const a = Store.addPage(null, { text: 'Werkblatt' });
    Store.addBlock(a.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(a.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* ═══ §1 Die Stiftreihe ════════════════════════════════════════════════════ */
console.log('\n§1 Sechs Stifte stehen da, statt sich zu verstecken');
{
  const s = await mitBlatt();
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(200);
  const r = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knoepfe = Array.from(werk.querySelectorAll('[data-act="stilwahl"]'));
    return JSON.stringify({
      zahl: knoepfe.length,
      stifte: knoepfe.map(k => k.dataset.stil),
      gefuehrt: knoepfe.filter(k => k.classList.contains('on')).map(k => k.dataset.stil),
      /* Jeder sagt seinen Namen — im Titel und für einen Vorleser (§38). */
      titel: knoepfe.map(k => k.getAttribute('title') || ''),
      namen: knoepfe.map(k => k.getAttribute('aria-label') || ''),
      /* UND KEINER IST EINE FALLE FÜR DEN DAUMEN (§37). Gemessen wird die
         TREFFFLÄCHE, nicht der sichtbare Kasten: die Leiste gibt jedem
         Knopf seit E406 ein 44 px hohes Feld über das ::after, damit die
         Knöpfe nebeneinander schmal bleiben und der Finger trotzdem
         trifft. Wer hier den Kasten misst, misst das Falsche. */
      hoehen: knoepfe.map(k => parseFloat(getComputedStyle(k, '::after').height) || 0),
      /* Die Reihe steht LINKS VOR den Farben — Redurs Wunsch wörtlich. */
      vorDenFarben: (() => {
        const letzterStift = knoepfe[knoepfe.length - 1].getBoundingClientRect();
        const ersteFarbe = werk.querySelector('.blatt-farbe').getBoundingClientRect();
        return letzterStift.right <= ersteFarbe.left + 1;
      })()
    });
  })()`) as string);
  gleich('Sechs Stifte, jeder mit eigenem Knopf', r.zahl, 6);
  gleich('… und in der bekannten Reihenfolge', r.stifte,
    ['fueller', 'kugel', 'pinsel', 'bleistift', 'schutzleiter', 'leiter']);
  gleich('Genau EINER ist geführt, und es ist der gemerkte', r.gefuehrt, ['fueller']);
  p('Jeder sagt seinen Namen', r.titel.every((t: string) => t.length > 2)
    && r.namen.every((n: string) => /^Stift /.test(n)), JSON.stringify(r.titel));
  p('Jeder ist mindestens 44 px hoch (§37)',
    r.hoehen.every((h: number) => h >= 44), JSON.stringify(r.hoehen));
  p('Die Reihe steht links vor den Farben — genau dort, wo Redur sie wollte',
    r.vorDenFarben, JSON.stringify(r.vorDenFarben));

  /* EIN TIPP, EIN STIFT — nicht bis zu fünf. */
  await s.click('.blatt-werk [data-act="stilwahl"][data-stil="leiter"]');
  await s.waitForTimeout(200);
  gleich('Ein einziger Tipp holt den letzten Stift',
    await s.evaluate(`document.querySelector('.blatt-werk [data-act="stilwahl"].on').dataset.stil`), 'leiter');
  gleich('… und er ist gemerkt', await s.evaluate(`Store.getMeta('zeichnen:stift')`), 'leiter');

  /* DER RUNDLAUF IST NICHT WEG — er liegt auf der Taste. */
  await s.click('.blatt-werk [data-act="stilwahl"][data-stil="fueller"]');
  await s.waitForTimeout(150);
  await s.keyboard.press('p');
  await s.waitForTimeout(150);
  gleich('P noch einmal gedrückt wechselt weiter — der alte Weg lebt',
    await s.evaluate(`document.querySelector('.blatt-werk [data-act="stilwahl"].on').dataset.stil`), 'kugel');
  await s.close();
}

/* ═══ §2 Der Laserpointer zeigt und schreibt nicht ═════════════════════════ */
console.log('\n§2 Der Laserpointer');
{
  const s = await mitBlatt();
  const da = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    imKatalog: Marken.WERKZEUGE.some(w => w.id === 'laser'),
    arten: (Marken.LASER || []).map(l => l.id),
    knopf: !!document.querySelector('.blatt-werk [data-wz="laser"]')
  }))()`) as string);
  p('Es gibt ein Werkzeug „laser"', da.imKatalog && da.knopf, JSON.stringify(da));
  gleich('… mit zwei Arten: Punkt und Linie', da.arten, ['punkt', 'linie']);

  await s.click('.blatt-werk [data-wz="laser"]');
  await s.waitForTimeout(250);
  const sichtbar = await s.evaluate(`(() => {
    const k = document.querySelectorAll('.blatt-werk [data-act="laserart"]');
    return [...k].filter(x => x.getBoundingClientRect().width > 0).length;
  })()`);
  gleich('Beim Laser stehen seine zwei Arten in der Leiste', sichtbar, 2);

  const r = JSON.parse(await s.evaluate(`(async () => {
    const f = document.querySelector('.blatt-marken');
    const ctm = f.getScreenCTM();
    const px = (q) => { const pt = f.createSVGPoint(); pt.x = q[0]; pt.y = q[1];
      const c = pt.matrixTransform(ctm); return { x: c.x, y: c.y }; };
    const ev = (typ, q, t) => { const c = px(q);
      const e = new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 1, pointerType: 'mouse', isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
        buttons: typ === 'pointerup' ? 0 : 1, pressure: typ === 'pointerup' ? 0 : 0.6 });
      Object.defineProperty(e, 'timeStamp', { value: t });
      return e; };
    const blatt = () => Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
    let t = 2000;
    f.dispatchEvent(ev('pointerdown', [100, 300], t));
    for (let i = 1; i <= 10; i++) { t += 16.7; f.dispatchEvent(ev('pointermove', [100 + i * 20, 300], t)); }
    const waehrend = {
      strahl: document.querySelectorAll('.blatt-laser').length,
      marken: ((blatt() || {}).marken || []).length
    };
    f.dispatchEvent(ev('pointerup', [300, 300], t + 16.7));
    await new Promise(r => setTimeout(r, 1100));
    return JSON.stringify({ waehrend,
      danachStrahl: document.querySelectorAll('.blatt-laser').length,
      danachMarken: ((blatt() || {}).marken || []).length,
      zurueckMoeglich: !document.querySelector('.blatt-werk [data-act="undo"]').disabled });
  })()`) as string);
  p('Während des Zeigens leuchtet ein Strahl', r.waehrend.strahl === 1, JSON.stringify(r));
  p('… und er ist KEINE Marke', r.waehrend.marken === 0, JSON.stringify(r));
  p('Nach dem Loslassen ist er verschwunden', r.danachStrahl === 0, JSON.stringify(r));
  p('… und hat nichts hinterlassen', r.danachMarken === 0, JSON.stringify(r));
  /* KEIN SCHRITT IM VERLAUF. Ein „Zurück", das einen Laserstrahl
     zurücknimmt, wäre ein Schritt, den niemand gemacht hat. */
  p('Er steht auch nicht im Verlauf', r.zurueckMoeglich === false, JSON.stringify(r));

  await s.click('.blatt-werk [data-act="laserart"][data-laser="linie"]');
  await s.waitForTimeout(150);
  gleich('Die gewählte Art wird gemerkt', await s.evaluate(`Store.getMeta('zeichnen:laser')`), 'linie');
  await s.close();
}

/* ═══ §3 Vier Plätze für die Leiste ════════════════════════════════════════ */
console.log('\n§3 Die Leiste lässt sich verschieben');
{
  const s = await mitBlatt();
  const knopfDa = await s.evaluate(`!!document.querySelector('.blatt-werk [data-act="lage"]')`);
  p('Es gibt einen Knopf für den Platz', knopfDa);
  const runde: string[] = [];
  for (let n = 0; n < 4; n++) {
    await s.click('.blatt-werk [data-act="lage"]');
    await s.waitForTimeout(160);
    runde.push(await s.evaluate(`document.querySelector('.blatt-reihe').dataset.lage`) as string);
  }
  gleich('Vier Plätze im Rundlauf: links, rechts, unten, wieder oben',
    runde, ['links', 'rechts', 'unten', 'oben']);

  /* AN DER SEITE STEHT SIE WIRKLICH AM RAND — gemessen, nicht geglaubt. */
  await s.click('.blatt-werk [data-act="lage"]');   /* → links */
  await s.waitForTimeout(250);
  const lage = JSON.parse(await s.evaluate(`(() => {
    const reihe = document.querySelector('.blatt-reihe');
    const huelle = reihe.closest('.blatt-huelle') || reihe.parentElement;
    const a = reihe.getBoundingClientRect(), h = huelle.getBoundingClientRect();
    const werk = reihe.querySelector('.blatt-werk');
    const knoepfe = [...werk.querySelectorAll('[data-wz]')].slice(0, 4)
      .map(k => Math.round(k.getBoundingClientRect().left));
    return JSON.stringify({ lage: reihe.dataset.lage,
      abstandLinks: Math.round(a.left - h.left), schmal: Math.round(a.width),
      /* Untereinander heisst: die ersten Knöpfe teilen ihre linke Kante. */
      gleicheKante: new Set(knoepfe).size <= 2,
      hoehen: [...werk.querySelectorAll('[data-wz]')].slice(0, 4)
        .map(k => parseFloat(getComputedStyle(k, '::after').height) || 0) });
  })()`) as string);
  gleich('Sie steht links', lage.lage, 'links');
  p('… wirklich am linken Rand des Blattes', lage.abstandLinks >= 0 && lage.abstandLinks <= 12, JSON.stringify(lage));
  p('… als schmale Spalte', lage.schmal > 0 && lage.schmal <= 90, JSON.stringify(lage));
  p('… mit den Knöpfen untereinander', lage.gleicheKante, JSON.stringify(lage));
  p('… und jeder trifft weiterhin 44 px (§37)',
    lage.hoehen.every((h: number) => h >= 44), JSON.stringify(lage.hoehen));

  /* UND DER PLATZ ÜBERLEBT. Neu zeichnen und nachsehen — der Fund aus
     E509 war genau hier: gemerkt ja, angewandt erst beim nächsten Klick. */
  await s.evaluate(`App.zeichneSeite()`);
  await s.waitForTimeout(500);
  gleich('Nach dem Neuzeichnen steht sie immer noch links',
    await s.evaluate(`document.querySelector('.blatt-reihe').dataset.lage`), 'links');
  gleich('… und es ist gemerkt', await s.evaluate(`Store.getMeta('zeichnen:leistenlage')`), 'links');
  await s.close();
}

/* ═══ §4 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§4 Quellen');
p('Die Stiftreihe steht EINMAL im Quelltext, aus dem Katalog gebaut',
  /STIFTE\.map\(st => `<button data-act="stilwahl"/.test(lies('src/bereiche/pdf/marken.ts')));
p('Der Laser hat einen eigenen Katalog', /const LASER = \[/.test(lies('src/bereiche/pdf/marken.ts')));
p('Die vier Plätze auch', /const LAGEN = \[/.test(lies('src/bereiche/pdf/marken.ts')));
p('Das Stilblatt kennt alle vier',
  ['links', 'rechts', 'unten'].every(l =>
    new RegExp('data-lage="' + l + '"').test(lies('quell/schale/stil/bausteine.css'))));
p('Das erzeugte JS trägt alles',
  /stilwahl/.test(lies('quell/bereiche/pdf/marken.js'))
  && /laserAn/.test(lies('quell/bereiche/pdf/marken.js'))
  && /leistenlage/.test(lies('quell/bereiche/pdf/marken.js')));
p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
