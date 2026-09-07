/* Suite 446 — Was die Prüfung fand: eine Farbe kann Code sein, und die Sperre hatte sechs Türen (E473)
 * ============================================================================
 * Eine adversariale Runde über die Bögen E465–E472 fand 33 Stellen; zwei
 * davon sind hart, und beide stehen hier.
 *
 *   §1 EINE FARBE KANN CODE SEIN. `Register.fachzeichen.alsSvg` BAUT
 *      seinen SVG-Text (`stroke="${farbe}"`), und `marken.ts` setzt ihn mit
 *      `innerHTML` ein. Die Farbe kommt aus `mark.farbe` — also aus einem
 *      Block, und ein Block kommt aus einer `.redion`, die jemand anders
 *      geschrieben haben kann. `#000" onload="…` schliesst das Attribut.
 *      §19: kein rohes innerHTML mit ungeprüften Nutzerdaten.
 *
 *   §2 DIE SPERRE HATTE SECHS TÜREN. E466 verspricht: nicht schieben,
 *      ziehen, drehen, löschen, radieren. Sie hielt gegen die fünf — aber
 *      Strichstärke, Schriftgrösse, Reihenfolge, Verweis, Text und das
 *      Drehen eines Fachzeichens gingen daran vorbei. Die Farbe darf
 *      weiter (das steht so in E466: die Sperre gilt dem Ort).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `Sanitize.farbe` in `fachzeichen.ts` weglassen: das `onload` steht
 *        im SVG. Gelaufen am 7. September, rot.
 *   §2 → eine der sechs Prüfungen in `marken.ts` entfernen: der zugehörige
 *        Punkt fällt. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test446.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;
declare const Sanitize: any; declare const Register: any; declare const Zeichenziel: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9566;
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
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined' && typeof Sanitize !== 'undefined'");

/* ═══ §1 Eine Farbe kann Code sein ═════════════════════════════════════════ */
console.log('\n§1 Eine Farbe kann Code sein');
{
  const rein = await s.evaluate(() => {
    const gut = ['#fff', '#2f7ed8', '#2f7ed8cc', 'rgb(10, 20, 30)', 'rgba(1,2,3,.5)', 'currentColor', 'transparent', 'red'];
    const boese = ['#000" onload="alert(1)', '#000"/><script>alert(1)</script>', 'url(javascript:alert(1))',
      'red;background:url(x)', '"><image href=x onerror=alert(1)>', 'expression(alert(1))'];
    return { gut: gut.map(f => Sanitize.farbe(f)), boese: boese.map(f => Sanitize.farbe(f)) };
  });
  gleich('Echte Farben gehen durch', rein.gut,
    ['#fff', '#2f7ed8', '#2f7ed8cc', 'rgb(10, 20, 30)', 'rgba(1,2,3,.5)', 'currentColor', 'transparent', 'red']);
  gleich('Alles, was nach Attribut oder Code aussieht, wird leer', rein.boese, ['', '', '', '', '', '']);

  const angriff = await s.evaluate(() => {
    (window as any).__xss = 0;
    const id = Register?.fachzeichen?.alle ? (Register.fachzeichen.alle()[0]?.id || '') : '';
    const roh = Register.fachzeichen.alsSvg(id, { farbe: '#000" onload="window.__xss=1' });
    /* Und der ganze Weg: eine Marke mit dieser Farbe zeichnen lassen. */
    const knoten = Marken.zeichneMarke({ id: 'x1', art: 'zeichen', zeichenId: id,
      point: [100, 100], groesse: 64, farbe: '#000" onload="window.__xss=1' });
    const huelle = document.createElement('div');
    if (knoten) huelle.appendChild(knoten);
    document.body.appendChild(huelle);
    /* NICHT NACH DEM WORT SUCHEN, SONDERN NACH DEM ATTRIBUT. `zeichneMarke`
       setzt die Farbe auch per `setAttribute` — dort ist sie ein Wert, und
       beim Serialisieren steht `stroke="#000&quot; onload=…"` im Text.
       Das ist harmlos; gefährlich wäre ein Element mit einem `on…`-Attribut. */
    const ereignisse = [...huelle.querySelectorAll('*')]
      .flatMap(el => [...el.attributes].map(a => a.name))
      .filter(n => /^on/i.test(n));
    huelle.remove();
    return { id, roh, hatOnloadImRoh: /onload=/i.test(roh), ereignisse,
      xss: (window as any).__xss, gezeichnet: !!knoten };
  });
  p('Es gibt überhaupt ein Fachzeichen zu prüfen', !!angriff.id && angriff.gezeichnet, JSON.stringify(angriff.id));
  p('Der gebaute SVG-Text trägt kein `onload`', !angriff.hatOnloadImRoh, String(angriff.roh).slice(0, 160));
  gleich('Kein Element des Knotens hat ein Ereignis-Attribut', angriff.ereignisse, []);
  gleich('Und nichts ist gelaufen', angriff.xss, 0);
}

/* ═══ §2 Die Sperre hält jetzt ═════════════════════════════════════════════ */
console.log('\n§2 Die Sperre hält gegen alle sechs Türen');
const seiteId = await s.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const zid = Register?.fachzeichen?.alle ? (Register.fachzeichen.alle()[0]?.id || '') : '';
  const seite = Store.addPage(null, { text: 'Gesperrtes', icon: '🔒' });
  Store.addBlock(seite.id, 'blatt', { text: '', papier: 'blanko', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1,
    marken: [
      { id: 'g-rect', art: 'rectangle', farbe: '#d64545', breite: 2.4, pts: [[60, 60], [200, 140]], gesperrt: true },
      { id: 'g-text', art: 'text', farbe: '#111111', breite: 2.4, point: [60, 200], text: 'Fest', fontSize: 18, gesperrt: true },
      { id: 'g-zettel', art: 'zettel', farbe: '#e0a419', breite: 2.4, pts: [[260, 200], [420, 280]], text: 'Notiz', gesperrt: true },
      { id: 'g-zeichen', art: 'zeichen', zeichenId: zid, point: [300, 400], groesse: 64, farbe: '#111111', drehung: 0, gesperrt: true },
      { id: 'frei', art: 'rectangle', farbe: '#3aa757', breite: 2.4, pts: [[60, 500], [200, 580]] }
    ] });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1200));
  return seite.id as string;
});

const marke = (id: string) => s.evaluate(([sid, mid]: [string, string]) => {
  const b = Store.childrenOf(sid).find((x: any) => x.type === 'blatt');
  const m = (b?.marken || []).find((x: any) => x.id === mid);
  return m ? { breite: m.breite, fontSize: m.fontSize, text: m.text, drehung: m.drehung,
    farbe: m.farbe, href: m.href, gesperrt: m.gesperrt } : null;
}, [seiteId, id] as [string, string]);

const reihe = () => s.evaluate((sid: string) => {
  const b = Store.childrenOf(sid).find((x: any) => x.type === 'blatt');
  return (b?.marken || []).map((m: any) => m.id);
}, seiteId);

{
  const vorher = await marke('g-rect');
  p('Vorbereitung: die Marken sind gesperrt', vorher?.gesperrt === true, JSON.stringify(vorher));
  /* Alles wählen — auch die gesperrten. */
  await s.evaluate(() => {
    const werk = document.querySelector<HTMLElement>('.blatt-werk')!;
    werk.querySelector<HTMLButtonElement>('[data-wz="select"]')?.click();
    const f = document.querySelector<SVGSVGElement>('svg.blatt-marken')!;
    const ctm = f.getScreenCTM()!;
    const pt = (x: number, y: number) => { const q = f.createSVGPoint(); q.x = x; q.y = y; return q.matrixTransform(ctm); };
    const ev = (typ: string, x: number, y: number, t: number) => { const c = pt(x, y);
      return new PointerEvent(typ, { bubbles: true, cancelable: true, clientX: c.x, clientY: c.y,
        pointerId: 41, pointerType: 'mouse', isPrimary: true, button: 0, buttons: t }); };
    f.dispatchEvent(ev('pointerdown', 20, 20, 1));
    f.dispatchEvent(ev('pointermove', 560, 700, 1));
    f.dispatchEvent(ev('pointerup', 560, 700, 0));
  });
  await s.waitForTimeout(400);
  const gewaehlt = await s.evaluate(() =>
    [...document.querySelectorAll('.blatt-marken .blatt-auswahlrahmen')].length);
  /* VIER GENÜGEN, UND ES MÜSSEN DIE RICHTIGEN SEIN: der Kastenzug greift
     jede Marke, deren Kasten er trifft. Was der Punkt sichern soll, ist
     nicht die Zahl, sondern dass die gesperrten MITGEWÄHLT sind — sonst
     prüfte alles darunter ins Leere. */
  p('Die Marken sind gewählt (mindestens vier)', gewaehlt >= 4, String(gewaehlt));

  /* 1 · Strichstärke */
  await s.evaluate(() => { document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-strich[data-b="5"]')?.click(); });
  await s.waitForTimeout(400);
  gleich('Die Strichstärke lässt die gesperrte Marke in Ruhe', (await marke('g-rect'))?.breite, 2.4);
  gleich('… und ändert die freie', (await marke('frei'))?.breite, 5);

  /* 2 · Schriftgrösse */
  await s.evaluate(() => { document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="groesser"]')?.click(); });
  await s.waitForTimeout(400);
  gleich('Die Schriftgrösse lässt den gesperrten Text in Ruhe', (await marke('g-text'))?.fontSize, 18);

  /* 3 · Reihenfolge */
  const vorReihe = await reihe();
  await s.evaluate(() => { document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="vor"]')?.click(); });
  await s.waitForTimeout(400);
  const nachReihe = await reihe();
  p('„Nach vorn" lässt die gesperrten an ihrem Platz und schiebt nur die freie',
    nachReihe[nachReihe.length - 1] === 'frei' && nachReihe.slice(0, 4).join() === vorReihe.filter((x: string) => x !== 'frei').join(),
    JSON.stringify([vorReihe, nachReihe]));

  /* 4 · Verweis */
  await s.evaluate(() => {
    (window as any).Dialog.frage = async () => 'https://example.org/x';
    document.querySelector<HTMLButtonElement>('.blatt-werk [data-act="verweis"]')?.click();
  });
  await s.waitForTimeout(600);
  gleich('Ein Verweis hängt sich nicht an eine gesperrte Marke', (await marke('g-rect'))?.href, undefined);
  gleich('… an die freie schon', (await marke('frei'))?.href, 'https://example.org/x');

  /* 5 · Text bearbeiten (Tipp mit dem Textwerkzeug) */
  await s.evaluate(() => {
    (window as any).Dialog.mehrzeilig = async () => '';
    const werk = document.querySelector<HTMLElement>('.blatt-werk')!;
    werk.querySelector<HTMLButtonElement>('[data-wz="text"]')?.click();
    const f = document.querySelector<SVGSVGElement>('svg.blatt-marken')!;
    const ziel = f.querySelector<SVGElement>('[data-sid="g-text"]')!;
    const r = ziel.getBoundingClientRect();
    const ev = (typ: string, t: number) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 42, pointerType: 'mouse',
      isPrimary: true, button: 0, buttons: t });
    ziel.dispatchEvent(ev('pointerdown', 1)); f.dispatchEvent(ev('pointerup', 0));
  });
  await s.waitForTimeout(700);
  gleich('Ein gesperrter Text lässt sich nicht leeren — und ist noch da', (await marke('g-text'))?.text, 'Fest');

  /* 6 · Fachzeichen drehen */
  await s.evaluate(() => {
    const werk = document.querySelector<HTMLElement>('.blatt-werk')!;
    werk.querySelector<HTMLButtonElement>('[data-wz="zeichen"]')?.click();
    const f = document.querySelector<SVGSVGElement>('svg.blatt-marken')!;
    const ziel = f.querySelector<SVGElement>('[data-sid="g-zeichen"]')!;
    const r = ziel.getBoundingClientRect();
    const ev = (typ: string, t: number) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 43, pointerType: 'mouse',
      isPrimary: true, button: 0, buttons: t });
    ziel.dispatchEvent(ev('pointerdown', 1)); f.dispatchEvent(ev('pointerup', 0));
  });
  await s.waitForTimeout(700);
  gleich('Ein gesperrtes Fachzeichen dreht sich nicht', (await marke('g-zeichen'))?.drehung, 0);

  /* 7 · Die Farbe darf weiter (E466) */
  await s.evaluate(() => {
    const werk = document.querySelector<HTMLElement>('.blatt-werk')!;
    werk.querySelector<HTMLButtonElement>('[data-wz="select"]')?.click();
    const f = document.querySelector<SVGSVGElement>('svg.blatt-marken')!;
    const ziel = f.querySelector<SVGElement>('[data-sid="g-rect"]')!;
    const r = ziel.getBoundingClientRect();
    const ev = (typ: string, t: number) => new PointerEvent(typ, { bubbles: true, cancelable: true,
      clientX: r.left + 4, clientY: r.top + 4, pointerId: 44, pointerType: 'mouse', isPrimary: true, button: 0, buttons: t });
    ziel.dispatchEvent(ev('pointerdown', 1)); f.dispatchEvent(ev('pointerup', 0));
    document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-farbe[data-c]')?.click();
  });
  await s.waitForTimeout(500);
  const nachher = await marke('g-rect');
  p('Die Farbe darf weiter — die Sperre gilt dem Ort, nicht der Farbe (E466)',
    !!nachher && nachher.farbe !== '#d64545' && nachher.gesperrt === true, JSON.stringify(nachher));
}
await s.close();

/* ═══ §3 Eingebunden ═══════════════════════════════════════════════════════ */
console.log('\n§3 Eingebunden');
{
  p('Sanitize kennt die Farbe', /const farbe = \(wert: unknown\)/.test(lies('src/core/security/sanitize.ts')));
  p('Das Fachzeichen säubert seine Farbe, bevor es sie textet', /Sanitize\.farbe\(opt\.farbe\)/.test(lies('src/register/fachzeichen.ts')));
  const m = lies('src/bereiche/pdf/marken.ts');
  p('Die sechs Türen sind zu', (m.match(/gesperrt\)/g) || []).length >= 8 && /Diese Marke ist gesperrt/.test(m));
  p('Das Lesezeichen geht durch die Rechteprüfung', !/Das Lesezeichen darf jeder setzen/.test(lies('src/bereiche/pdf/document-mode.ts')));
}

console.log('\n§4 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
