/* Suite 598 — Fläche: eine Leiste je Arbeitskontext (E722, E723)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Redur, PDF vom 29. September, Seite 18 unten, mit
 * einer roten Markierung um die untere Leiste:
 *
 *     „Hier wieder die zeichnen menüs ist doppelt , es sollte nur die ganez
 *      unter bleiben , seihet rote markierung ,"
 *
 * und Seite 18 oben, eine Tabelle im Seitenkasten der Fläche, dunkel:
 *
 *     „Fehler= hier wenn ich flach modus wähle und sieht im bild habe ich
 *      eine tabela erstellt und ds hier es ist hinterden und kann nicht gut
 *      lesen und es sollte nicht so sein ,"
 *
 * Am 3. Oktober hat er erlaubt, „die doppelte Zeichenleiste (die obere im
 * eingebetteten Bereich)" wegzunehmen — wenn jede Funktion an EINER klaren
 * Stelle erreichbar bleibt (§43).
 *
 * Aufgebaut wird eine Seite in der Flächenansicht mit Text, einem Whiteboard
 * im Seitenkasten (W1) und einem zweiten Whiteboard im eigenen Blockkasten
 * (W2, E691). „Die Leiste" ist `.pg-flaeche > .gfx-tb-sockel` — der Schacht.
 *
 *   §1  EINE Leiste in der Fläche, ein unmittelbares Kind, unten.
 *   §2  Nichts geht verloren: nach einem Tipp ins Whiteboard trägt die Leiste
 *       seine zwölf Werkzeuge und Farbe, Kleiner, Grösser, Ins Bild, Zurück,
 *       Vor und Mehr (Mehr öffnet „Alles löschen" und „Als Bild
 *       speichern"); nach einem Tipp auf die Fläche ihre acht Werkzeuge und
 *       dazu „Schritt vorwärts".
 *   §3  Genau EIN gewähltes Werkzeug und EINE Zoomzahl sind zu sehen, und
 *       die Zahl des Whiteboards stimmt nach dem Wechsel mit seiner Sicht.
 *   §4  EINE Taste, EINE Wirkung (E682): Strg+Z im Whiteboard und mit dem
 *       Fokus in seiner Leiste nimmt nur dort zurück, auf der Fläche nur
 *       dort — auch wenn das Whiteboard selbst einen Schritt zurücknehmen
 *       könnte.
 *   §5  EIN Rad, EIN Ausschnitt: über dem Whiteboard bewegt sich nur das
 *       Whiteboard — mit und ohne Strg.
 *   §6  Die Hand der Fläche stiehlt keinen Strich: ein Zug IM Whiteboard
 *       zeichnet dort und schiebt die Fläche nicht. Die mittlere Taste
 *       zeichnet im Whiteboard nicht, sie schiebt es.
 *   §7  Keine Leiste verdeckt ihre Fläche (§37): in der Seitenansicht steht
 *       die Leiste unter dem Whiteboard, in der Fläche über keinem. Ihr
 *       Name sagt, WELCHES Whiteboard sie bedient.
 *   §8  Am Telefon: eine Leiste, jeder Knopf 44 px, über der unteren Leiste,
 *       keine im Kasten; das gewählte Werkzeug steht im sichtbaren Teil
 *       des rollenden Streifens, und das Schild rollt nicht mit hinaus
 *       und nimmt höchstens ein Fünftel des Streifens;
 *       Tab aus der Leiste führt auch dort hinter das Whiteboard.
 *   §9  Tastatur (§38): Tab erreicht die Leiste, Pfeile wandern, Escape
 *       schliesst ihr Menü zuerst; vom Whiteboard aus führt Tab in SEINE
 *       Leiste und Umschalt+Tab zurück — und das nächste Tab aus der
 *       Leiste weiter HINTER das Whiteboard, nicht an den Anfang — auch
 *       wenn der erste Halt dahinter keinen Fokus nimmt.
 *   §10 „Neu" der Tabelle bleibt beim Überfahren in allen zehn Schemata
 *       lesbar (≥ 4,5) und bleibt der Hauptknopf (nicht --bg-hover).
 *   §11 Die Auswahlleiste liegt auf der Fläche NICHT über der Flächenleiste.
 *   §12 Die angeheftete Spalte trägt den Grund des Kastens, nicht der Seite.
 *   §13 Die breite Tabelle rollt im Kasten auch mit dem Rad: quer und mit
 *       Umschalt rollt sie, die Fläche bleibt stehen; längs und am Rand
 *       schiebt das Rad die Fläche.
 *
 * GEGEN DEN STAND 1bfaca53 ROT — die Zeilen stehen im Bericht zu E722/E723.
 *
 *   node pruefungen/lauf/test598.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
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
const browser = await chromium.launch();
const jsFehler: string[] = [];

const SCHACHT = '.pg-flaeche > .gfx-tb-sockel';
const W1 = '.pg-fl-notiz[data-fl-seite] .wb';
const W2 = '.pg-fl-notiz[data-fl-block] .wb';

/** Eine Seite in der Flächenansicht: Text, W1 im Seitenkasten, W2 im
 *  eigenen Kasten. Die Formen sind gesetzt, nicht gezeichnet — der Verlauf
 *  beginnt also leer, und jeder Schritt in §4 ist einer dieses Laufs. */
const bauen = async (breite: number, hoehe: number, telefon = false) => {
  const pg = await browser.newPage({
    viewport: { width: breite, height: hoehe },
    ...(telefon ? { hasTouch: true, isMobile: true } : {}) });
  pg.on('pageerror', e => jsFehler.push(e.message.slice(0, 160)));
  await pg.goto(`http://127.0.0.1:${PORT}/index.html`);
  await pg.waitForFunction(() => typeof App !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
  const ids = await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
    const s = Store.addPage(null, { text: 'Zwei Leisten', seitenAnsicht: 'flaeche' });
    Store.addBlock(s.id, 'text', { text: 'Ein Satz über der Skizze.' });
    const w1 = Store.addBlock(s.id, 'whiteboard', { text: 'Skizze', hoehe: 260, shapes: [
      { id: 'a1', art: 'rechteck', x: 40, y: 40, w: 120, h: 70, farbe: '#529cca' }] });
    const w2 = Store.addBlock(s.id, 'whiteboard', { text: 'Zweite', hoehe: 220, shapes: [
      { id: 'b1', art: 'ellipse', x: 40, y: 30, w: 100, h: 60, farbe: '#e03e3e' }],
      flaecheOrt: { x: 860, y: 0, w: 460, raumVersion: 1 } });
    await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
    return { seite: s.id, w1: w1.id, w2: w2.id };
  });
  await pg.waitForTimeout(400);
  return { pg, ids };
};

const formenZahl = (pg: Page, id: string) => pg.evaluate((i: string) => {
  const b = Store.getBlock(i) as any;
  return Array.isArray(b?.shapes) ? b.shapes.length : 0;
}, id);

/** Die Mitte eines Elements in Bildschirmpunkten. */
const mitte = (pg: Page, wahl: string, fx = 0.5, fy = 0.5) => pg.evaluate(([w, x, y]) => {
  const r = document.querySelector(w as string)?.getBoundingClientRect();
  return r ? { x: Math.round(r.left + r.width * (x as number)), y: Math.round(r.top + r.height * (y as number)) } : null;
}, [wahl, fx, fy] as [string, number, number]);

/** Eine LEERE Stelle der Fläche: dort und 70 × 50 daneben liegt nur die
 *  Fläche — kein Kasten, keine Leiste. Gesucht, nicht angenommen. */
const leer = (pg: Page) => pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!.getBoundingClientRect();
  const frei = (x: number, y: number): boolean => {
    const el = document.elementFromPoint(x, y);
    return !!el && !!el.closest('.pg-flaeche') && !el.closest('.pg-fl-notiz') && !el.closest('.gfx-tb-sockel');
  };
  for (let y = f.top + 30; y < f.bottom - 140; y += 23)
    for (let x = f.left + 30; x < f.right - 110; x += 37)
      if (frei(x, y) && frei(x + 70, y + 50) && frei(x + 35, y + 25)) return { x: Math.round(x), y: Math.round(y) };
  return null;
});

const ziehen = async (pg: Page, von: { x: number; y: number }, dx: number, dy: number) => {
  await pg.mouse.move(von.x, von.y);
  await pg.mouse.down();
  await pg.mouse.move(von.x + dx, von.y + dy, { steps: 6 });
  await pg.mouse.up();
  await pg.waitForTimeout(200);
};
const klick = async (pg: Page, wo: { x: number; y: number } | null) => {
  if (!wo) return;
  await pg.mouse.click(wo.x, wo.y);
  await pg.waitForTimeout(150);
};
const imSchacht = (pg: Page, wahl: string) => pg.evaluate(([s, w]) => {
  const el = document.querySelector<HTMLElement>(`${s} ${w}`);
  el?.click();
  return !!el;
}, [SCHACHT, wahl] as [string, string]);

/* ==========================================================================
 * AM RECHNER
 * ======================================================================== */
const { pg, ids } = await bauen(1440, 900);

console.log('\n1 · Eine Leiste in der Fläche');
p('W1 liegt im Seitenkasten, W2 im eigenen Blockkasten (Vorbedingung)',
  await pg.evaluate(([a, b]) => !!document.querySelector(a as string) && !!document.querySelector(b as string), [W1, W2]));
const s1 = await pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!;
  const alle = [...f.querySelectorAll<HTMLElement>('.gfx-tb-sockel')];
  const eine = alle[0];
  const fr = f.getBoundingClientRect(), r = eine?.getBoundingClientRect();
  return { zahl: alle.length, kind: !!eine && eine.parentElement === f,
           unten: r ? Math.round(fr.bottom - r.bottom) : -1,
           klassen: alle.map(x => x.className) };
});
p('Genau EINE Werkzeugleiste in der Fläche (W1 und W2 bringen keine zweite und dritte)',
  s1.zahl === 1, `${s1.zahl}: ${s1.klassen.join(' | ')}`);
p('Sie ist ein unmittelbares Kind der Fläche (der Schacht)', s1.kind);
p('Und sie sitzt unten (≤ 40 px über dem Rand)', s1.unten >= 0 && s1.unten <= 40, `${s1.unten} px`);

console.log('\n2 · Nichts geht verloren');
await klick(pg, await mitte(pg, `${W1} .wb-flaeche`, 0.8, 0.8));
const s2a = await pg.evaluate((s: string) => {
  const l = document.querySelector(s);
  return { wz: [...(l?.querySelectorAll<HTMLElement>('[data-wz]') ?? [])].map(b => b.dataset['wz']),
           a: [...(l?.querySelectorAll<HTMLElement>('[data-a]') ?? [])].map(b => b.dataset['a']) };
}, SCHACHT);
const WB_WZ = ['zeiger', 'hand', 'verbindung', 'radierer', 'stift', 'linie', 'pfeil', 'rechteck', 'ellipse', 'notiz', 'text', 'bild'];
const WB_A = ['farbe', 'kleiner', 'groesser', 'passend', 'zurueck', 'vor', 'mehr'];
p('Nach einem Tipp ins Whiteboard trägt die Leiste seine zwölf Werkzeuge',
  WB_WZ.every(w => s2a.wz.includes(w)), 'fehlt: ' + WB_WZ.filter(w => !s2a.wz.includes(w)).join(','));
p('… und Farbe, Kleiner, Grösser, Ins Bild, Zurück, Vor, Mehr',
  WB_A.every(a => s2a.a.includes(a)), 'fehlt: ' + WB_A.filter(a => !s2a.a.includes(a)).join(','));
await imSchacht(pg, '[data-a="mehr"]');
await pg.waitForTimeout(150);
const mehr = await pg.evaluate((s: string) =>
  [...document.querySelectorAll<HTMLElement>(`${s} .gfx-tb-menue [data-a]`)].map(b => b.dataset['a']), SCHACHT);
p('„Mehr" öffnet „Alles löschen" und „Als Bild speichern"',
  mehr.includes('leeren') && mehr.includes('png'), JSON.stringify(mehr));
await pg.keyboard.press('Escape');
const fleck = await leer(pg);
p('Es gibt eine leere Stelle auf der Fläche (Vorbedingung)', !!fleck);
await klick(pg, fleck);
const s2b = await pg.evaluate((s: string) => {
  const l = document.querySelector(s);
  return { wz: [...(l?.querySelectorAll<HTMLElement>('[data-wz]') ?? [])].map(b => b.dataset['wz']),
           a: [...(l?.querySelectorAll<HTMLElement>('[data-a]') ?? [])].map(b => b.dataset['a']) };
}, SCHACHT);
const FL_WZ = ['zeiger', 'hand', 'stift', 'linie', 'pfeil', 'rechteck', 'ellipse', 'radierer'];
p('Nach einem Tipp auf die Fläche trägt sie deren acht Werkzeuge',
  FL_WZ.every(w => s2b.wz.includes(w)) && s2b.wz.length === 8, s2b.wz.join(','));
p('… und dazu „Schritt vorwärts" (vorher nur über Strg+Umschalt+Z — mit dem Finger unmöglich)',
  s2b.a.includes('vor') && s2b.a.includes('zurueck'), s2b.a.join(','));

console.log('\n3 · Ein Werkzeug, eine Zahl');
await klick(pg, await mitte(pg, `${W1} .wb-flaeche`, 0.8, 0.8));
const sichtbar = () => pg.evaluate(() => {
  const f = document.querySelector('.pg-flaeche')!;
  const zu = (w: string) => [...f.querySelectorAll<HTMLElement>(w)].filter(b => b.offsetParent !== null);
  return { an: zu('[data-wz].on').length, zahlen: zu('.pg-fl-massstab, .wb-massstab').length };
});
const s3 = await sichtbar();
p('Genau EIN gewähltes Werkzeug ist zu sehen', s3.an === 1, `${s3.an}`);
p('Genau EINE Zoomzahl ist zu sehen', s3.zahlen === 1, `${s3.zahlen}`);
await imSchacht(pg, '[data-a="groesser"]');
await pg.waitForTimeout(150);
const s3b = await pg.evaluate(([s, id]) => {
  const z = Number((Store.getBlock(id as string) as any)?.sicht?.z ?? 1);
  const t = document.querySelector(`${s} .wb-massstab, ${s} .pg-fl-massstab`)?.textContent ?? '';
  return { text: t.trim(), soll: Math.round(z * 100) + ' %' };
}, [SCHACHT, ids.w1] as [string, string]);
p('„Grösser" in der Leiste vergrössert das Whiteboard, und seine Zahl folgt',
  s3b.text === s3b.soll && s3b.soll !== '100 %', `zeigt ${s3b.text}, Whiteboard ${s3b.soll}`);
await imSchacht(pg, '[data-a="kleiner"]');

console.log('\n4 · Eine Taste, eine Wirkung (E682)');
await klick(pg, fleck);
await imSchacht(pg, '[data-wz="rechteck"]');
await ziehen(pg, fleck!, 60, 40);
const fl0 = await formenZahl(pg, ids.seite);
p('Auf der Fläche liegt eine gezogene Form (Vorbedingung)', fl0 === 1, `${fl0}`);
await imSchacht(pg, '[data-wz="zeiger"]');
const w1Start = await formenZahl(pg, ids.w1);
await klick(pg, await mitte(pg, `${W1} .wb-flaeche`, 0.8, 0.8));
await imSchacht(pg, '[data-wz="rechteck"]');
const im = await mitte(pg, `${W1} .wb-flaeche`, 0.55, 0.3);
await ziehen(pg, im!, 50, 30);
p('Im Whiteboard liegt eine Form mehr (Vorbedingung)', await formenZahl(pg, ids.w1) === w1Start + 1,
  `${w1Start} → ${await formenZahl(pg, ids.w1)}`);
await pg.keyboard.press('Control+z');
await pg.waitForTimeout(250);
let w1n = await formenZahl(pg, ids.w1), fln = await formenZahl(pg, ids.seite);
p('Strg+Z im Whiteboard nimmt dort zurück', w1n === w1Start, `${w1Start + 1} → ${w1n}`);
p('… und die Fläche behält ihre Form', fln === 1, `Fläche 1 → ${fln}`);
await pg.keyboard.press('Control+Shift+z');
await pg.waitForTimeout(250);
p('Strg+Umschalt+Z holt sie im Whiteboard wieder', await formenZahl(pg, ids.w1) === w1Start + 1);
await pg.evaluate((s: string) => document.querySelector<HTMLElement>(`${s} button[data-wz]`)?.focus(), SCHACHT);
await pg.keyboard.press('Control+z');
await pg.waitForTimeout(250);
w1n = await formenZahl(pg, ids.w1); fln = await formenZahl(pg, ids.seite);
p('Mit dem Fokus in der Leiste des Whiteboards nimmt Strg+Z im Whiteboard zurück',
  w1n === w1Start, `Whiteboard ${w1Start + 1} → ${w1n}`);
p('… und nicht auf der Fläche', fln === 1, `Fläche → ${fln}`);
/* EIN SCHRITT, DEN DAS WHITEBOARD ZURÜCKNEHMEN KÖNNTE (Durchsicht E722).
   Ohne ihn war sein Verlauf hier leer, und ein Strg+Z der Fläche, das
   fälschlich AUCH beim Whiteboard ankäme, täte dort nichts — „das
   Whiteboard bleibt" hätte nicht rot werden können (§55.2). Also ein
   zweites Rechteck, mit dem Werkzeug, das es noch trägt. */
await klick(pg, await mitte(pg, `${W1} .wb-flaeche`, 0.8, 0.8));
await ziehen(pg, (await mitte(pg, `${W1} .wb-flaeche`, 0.2, 0.55))!, 40, 25);
w1n = await formenZahl(pg, ids.w1);
p('Im Whiteboard liegt wieder ein rücknehmbarer Schritt (Vorbedingung)', w1n === w1Start + 1,
  `${w1Start} → ${w1n}`);
await klick(pg, fleck);
await pg.evaluate(() => document.querySelector<HTMLElement>('.pg-flaeche')?.focus());
const vorFl = await formenZahl(pg, ids.seite);
await pg.keyboard.press('Control+z');
await pg.waitForTimeout(250);
fln = await formenZahl(pg, ids.seite);
p('Auf der Fläche nimmt Strg+Z die Fläche zurück', vorFl >= 1 && fln === vorFl - 1, `${vorFl} → ${fln}`);
p('… und das Whiteboard bleibt — obwohl es einen Schritt zurücknehmen KÖNNTE',
  await formenZahl(pg, ids.w1) === w1n, `Whiteboard ${w1n} → ${await formenZahl(pg, ids.w1)}`);

console.log('\n5 · Ein Rad, ein Ausschnitt');
const lage = () => pg.evaluate((w: string) => ({
  flaeche: document.querySelector<HTMLElement>('.pg-fl-sicht')?.style.transform ?? '',
  wb: document.querySelector(`${w} .wb-flaeche`)?.getAttribute('viewBox') ?? ''
}), W1);
const ueberWb = await mitte(pg, `${W1} .wb-flaeche`, 0.3, 0.5);
await pg.mouse.move(ueberWb!.x, ueberWb!.y);
let vor5 = await lage();
await pg.mouse.wheel(0, 120);
await pg.waitForTimeout(250);
let nach5 = await lage();
const geaendert = (a: typeof vor5, b: typeof vor5) =>
  (a.flaeche !== b.flaeche ? 1 : 0) + (a.wb !== b.wb ? 1 : 0);
p('Ein Rad über dem Whiteboard bewegt genau EINEN Ausschnitt', geaendert(vor5, nach5) === 1,
  `Fläche ${vor5.flaeche !== nach5.flaeche ? 'bewegt' : 'still'}, Whiteboard ${vor5.wb !== nach5.wb ? 'bewegt' : 'still'}`);
p('… und zwar den des Whiteboards (das Innerste gewinnt)', vor5.wb !== nach5.wb);
vor5 = nach5;
await pg.keyboard.down('Control');
await pg.mouse.wheel(0, -120);
await pg.keyboard.up('Control');
await pg.waitForTimeout(250);
nach5 = await lage();
p('Strg+Rad über dem Whiteboard zoomt nur das Whiteboard', vor5.flaeche === nach5.flaeche && vor5.wb !== nach5.wb,
  `Fläche ${vor5.flaeche} → ${nach5.flaeche}`);

console.log('\n6 · Die Hand der Fläche stiehlt keinen Strich');
await klick(pg, fleck);
await imSchacht(pg, '[data-wz="hand"]');
const w1vor6 = await formenZahl(pg, ids.w1);
const vor6 = await lage();
/* KEIN Werkzeugwechsel dazwischen: das Whiteboard hat aus §4 noch sein
   Rechteck. Wer hier erst das Whiteboard wählt, wählt im alten Stand das
   Werkzeug der FLÄCHE um — und der Lauf prüfte die Hand gar nicht. */
await ziehen(pg, (await mitte(pg, `${W1} .wb-flaeche`, 0.3, 0.3))!, 80, 50);
const nach6 = await lage();
p('Ein Zug im Whiteboard schiebt die Fläche nicht', vor6.flaeche === nach6.flaeche,
  `${vor6.flaeche} → ${nach6.flaeche}`);
p('… und das Whiteboard bekommt seinen Strich', await formenZahl(pg, ids.w1) === w1vor6 + 1,
  `${w1vor6} → ${await formenZahl(pg, ids.w1)}`);
/* DIE MITTLERE TASTE (Durchsicht E722). Auf der Fläche schiebt sie die
   Fläche; seit das Whiteboard im Kasten sich selbst gehört, kam sie bei ihm
   an — und zeichnete mit seinem Werkzeug, hier einem Rechteck. Im Kasten
   gewinnt das Innerste: sie schiebt das Whiteboard. */
const w1vor6m = await formenZahl(pg, ids.w1);
const vor6m = await lage();
const mStart = (await mitte(pg, `${W1} .wb-flaeche`, 0.35, 0.6))!;
await pg.mouse.move(mStart.x, mStart.y);
await pg.mouse.down({ button: 'middle' });
await pg.mouse.move(mStart.x + 70, mStart.y + 30, { steps: 6 });
await pg.mouse.up({ button: 'middle' });
await pg.waitForTimeout(200);
const nach6m = await lage();
p('Die mittlere Taste im Whiteboard zeichnet nicht', await formenZahl(pg, ids.w1) === w1vor6m,
  `${w1vor6m} → ${await formenZahl(pg, ids.w1)}`);
p('… sie schiebt das Whiteboard und nicht die Fläche (das Innerste gewinnt)',
  vor6m.flaeche === nach6m.flaeche && vor6m.wb !== nach6m.wb,
  `Fläche ${vor6m.flaeche === nach6m.flaeche ? 'still' : 'bewegt'}, Whiteboard ${vor6m.wb} → ${nach6m.wb}`);
await klick(pg, fleck);
await imSchacht(pg, '[data-wz="zeiger"]');

console.log('\n7 · Keine Leiste verdeckt ihre Fläche (§37)');
await klick(pg, await mitte(pg, `${W1} .wb-flaeche`, 0.8, 0.8));
const s7 = await pg.evaluate((s: string) => {
  const raus: string[] = [];
  /* Jede Leiste in der Fläche gegen die Zeichenfläche, die sie bedient:
     eine Leiste IN einem Whiteboard bedient dieses, die im Schacht das
     gerade gewählte (`.pg-fl-aktiv`). */
  for (const l of document.querySelectorAll<HTMLElement>('.pg-flaeche .gfx-tb-sockel')) {
    const wb = l.closest('.wb') ?? (l.matches(s) ? document.querySelector('.pg-flaeche .wb.pg-fl-aktiv') : null);
    const svg = wb?.querySelector('.wb-flaeche');
    if (!svg) continue;
    const a = l.getBoundingClientRect(), b = svg.getBoundingClientRect();
    const deckt = a.top < b.bottom - 1 && a.bottom > b.top + 1 && a.left < b.right && a.right > b.left;
    if (deckt) raus.push(`${l.className.split(' ').pop()}: oben ${Math.round(a.top)} < Unterkante ${Math.round(b.bottom)}`);
  }
  return raus;
}, SCHACHT);
p('In der Fläche liegt keine Leiste über ihrer eigenen Zeichenfläche', s7.length === 0, s7.join(' · '));
const gewaehlt = await pg.evaluate(() => {
  const a = document.querySelector('.pg-flaeche .wb.pg-fl-aktiv');
  return { da: !!a, ring: a ? getComputedStyle(a).boxShadow : '' };
});
p('Das gewählte Whiteboard ist markiert (Ring) — und die Leiste sagt in Worten, wessen sie ist',
  gewaehlt.da && gewaehlt.ring !== 'none' &&
  await pg.evaluate((s: string) => /Zeichenfläche/.test(document.querySelector(s)?.textContent ?? ''), SCHACHT),
  JSON.stringify(gewaehlt));
/* WELCHES Whiteboard (Durchsicht E722, §38)? Zwei Whiteboards gaben der
   Leiste denselben Namen, „Werkzeuge der Zeichenfläche" — wer vorlesen
   lässt, hörte nicht, wem sie gerade gehört. Der Name trägt den Titel des
   Blocks; das Schild bleibt das kurze Wort. */
const namen = await pg.evaluate(async ([s, w2]) => {
  const jetzt = () => ({
    name: document.querySelector(`${s} [role="toolbar"]`)?.getAttribute('aria-label') ?? '',
    schild: (document.querySelector(`${s} .pg-fl-kontext`)?.textContent ?? '').trim() });
  const a = jetzt();
  document.querySelector<HTMLElement>(w2 as string)?.focus();
  await new Promise(f => setTimeout(f, 150));
  return { a, b: jetzt() };
}, [SCHACHT, W2]);
p('Die Leiste nennt, WELCHES Whiteboard sie bedient — „Skizze", nach dem Wechsel „Zweite"',
  namen.a.name.includes('„Skizze“') && namen.b.name.includes('„Zweite“'), JSON.stringify(namen));
p('… und das Schild bleibt das kurze Wort „Zeichenfläche"',
  namen.a.schild === 'Zeichenfläche' && namen.b.schild === 'Zeichenfläche', `${namen.a.schild} / ${namen.b.schild}`);
/* Dieselbe Seite in der Seitenansicht: dort bleibt die Leiste UNTER dem
   Whiteboard (test572 §5). */
await pg.evaluate(async (id: string) => {
  Store.updateBlock(id, { seitenAnsicht: 'seite' }); await Store.flush(); App.oeffne(id);
  await new Promise(f => setTimeout(f, 700));
}, ids.seite);
const s7b = await pg.evaluate(() => {
  const l = document.querySelector('#page .wb .wb-tools') as HTMLElement | null;
  const svg = l?.closest('.wb')?.querySelector('.wb-flaeche');
  if (!l || !svg) return { da: false };
  return { da: true, pos: getComputedStyle(l).position,
           oben: Math.round(l.getBoundingClientRect().top), unter: Math.round(svg.getBoundingClientRect().bottom) };
});
p('Seitenansicht: die Leiste steht im Whiteboard, nicht schwebend',
  s7b.da && (s7b.pos === 'static' || s7b.pos === 'relative'), JSON.stringify(s7b));
p('… und unter seiner Zeichenfläche', s7b.da && (s7b.oben ?? 0) >= (s7b.unter ?? 0) - 1, JSON.stringify(s7b));
await pg.evaluate(async (id: string) => {
  Store.updateBlock(id, { seitenAnsicht: 'flaeche' }); await Store.flush(); App.oeffne(id);
  await new Promise(f => setTimeout(f, 700));
}, ids.seite);

console.log('\n9 · Tastatur (§38)');
await klick(pg, await leer(pg));
await pg.evaluate(() => document.querySelector<HTMLElement>('.pg-flaeche')?.focus());
let tabs = 0, erreicht = false;
for (; tabs < 60 && !erreicht; tabs++) {
  await pg.keyboard.press('Tab');
  /* Ein KNOPF: Chrome macht einen rollenden Roller ohne erreichbaren Knopf
     selbst zum Tabhalt — der Fokus läge dann in der Leiste, aber auf keinem
     Werkzeug (L206). */
  erreicht = await pg.evaluate((s: string) => !!document.activeElement?.closest(s)
    && document.activeElement?.tagName === 'BUTTON', SCHACHT);
}
p('Tab erreicht die Leiste', erreicht, `nach ${tabs} Mal Tab nicht`);
const stopps = await pg.evaluate((s: string) =>
  [...document.querySelectorAll<HTMLElement>(`${s} button`)].filter(b => b.tabIndex === 0).length, SCHACHT);
p('Die Leiste ist EIN Tabstopp', stopps === 1, `${stopps}`);
const vorPfeil = await pg.evaluate(() => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? '');
await pg.keyboard.press('ArrowRight');
const nachPfeil = await pg.evaluate((s: string) => ({
  name: (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ?? '',
  drin: !!document.activeElement?.closest(s) }), SCHACHT);
p('Pfeil rechts wandert in der Leiste', erreicht && nachPfeil.drin && nachPfeil.name !== vorPfeil,
  `${vorPfeil} → ${nachPfeil.name}`);
await pg.evaluate((s: string) => document.querySelector<HTMLElement>(`${s} [data-menue]`)?.focus(), SCHACHT);
await pg.keyboard.press('Enter');
await pg.waitForTimeout(150);
const menueAuf = await pg.evaluate((s: string) => !!document.querySelector(`${s} .gfx-tb-menue`), SCHACHT);
await pg.keyboard.press('Escape');
await pg.waitForTimeout(150);
const nachEsc = await pg.evaluate((s: string) => ({
  menue: !!document.querySelector(`${s} .gfx-tb-menue`),
  drin: !!document.activeElement?.closest(s), flaeche: !!document.querySelector('.pg-flaeche') }), SCHACHT);
p('Enter öffnet das Menü der Leiste, Escape schliesst es zuerst (E302)',
  menueAuf && !nachEsc.menue && nachEsc.drin && nachEsc.flaeche, JSON.stringify({ menueAuf, ...nachEsc }));
await pg.evaluate((w: string) => document.querySelector<HTMLElement>(w)?.focus(), W1);
await pg.waitForTimeout(100);
await pg.keyboard.press('Tab');
const vomWb = await pg.evaluate((s: string) => ({
  drin: !!document.activeElement?.closest(s) && document.activeElement?.tagName === 'BUTTON',
  seine: !!document.querySelector(`${s} [data-wz="verbindung"]`) }), SCHACHT);
p('Vom Whiteboard aus führt Tab in SEINE Leiste', vomWb.drin && vomWb.seine, JSON.stringify(vomWb));
await pg.keyboard.press('Shift+Tab');
p('… und Umschalt+Tab zurück aufs Whiteboard',
  await pg.evaluate((w: string) => document.activeElement === document.querySelector(w), W1));
/* … UND VON DER LEISTE WEITER, HINTER DAS WHITEBOARD (Durchsicht E722,
   §38). Die Leiste hängt VOR der Ebene; ohne eigene Führung sprang das
   zweite Tab zurück an den Anfang der Fläche — auf den Kopf des
   Seitenkastens —, und alles hinter dem Whiteboard war von dort aus mit
   Tab nicht mehr zu erreichen. Gesucht wird die Lage im Baum, nicht ein
   Name: was nach dem Whiteboard kommt, ist hier der nächste Kasten. */
await pg.keyboard.press('Tab');
await pg.keyboard.press('Tab');
const weiter = await pg.evaluate(([s, w]) => {
  const a = document.activeElement as HTMLElement | null;
  const wb = document.querySelector(w as string);
  if (!a || !wb || a === document.body) return { ok: false, was: 'kein Fokus' };
  const nach = !!(wb.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) && !wb.contains(a);
  const was = `${a.tagName} [${(a.getAttribute('aria-label') ?? a.textContent ?? '').trim().slice(0, 30)}]`;
  return { ok: nach && !a.closest(s as string), was };
}, [SCHACHT, W1]);
p('… und das nächste Tab führt aus der Leiste hinter das Whiteboard, nicht zurück an den Anfang', weiter.ok, weiter.was);
/* EIN HALT, DER RECHTECKE HAT UND KEINEN FOKUS NIMMT (Durchsicht E722).
   `visibility:hidden` behält seinen Platz, `focus()` scheitert still. Die
   Führung rief `preventDefault` VOR dem Fokus und sah nicht nach, ob er
   ankam — das Tab war verschluckt, der Fokus blieb in der Leiste. */
await pg.evaluate((w: string) => {
  const k = document.createElement('button');
  k.type = 'button'; k.id = 'f598-versteckt'; k.textContent = 'versteckt';
  k.style.visibility = 'hidden';
  document.querySelector(w)?.after(k);
}, W1);
await pg.evaluate((w: string) => document.querySelector<HTMLElement>(w)?.focus(), W1);
await pg.waitForTimeout(100);
await pg.keyboard.press('Tab');
await pg.keyboard.press('Tab');
const weiter2 = await pg.evaluate(([s, w]) => {
  const a = document.activeElement as HTMLElement | null;
  const wb = document.querySelector(w as string);
  if (!a || !wb || a === document.body) return { ok: false, was: 'kein Fokus' };
  const nach = !!(wb.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) && !wb.contains(a);
  const was = `${a.tagName} [${(a.getAttribute('aria-label') ?? a.textContent ?? '').trim().slice(0, 30)}]`;
  return { ok: nach && !a.closest(s as string) && a.id !== 'f598-versteckt', was: (a.closest(s as string) ? 'in der Leiste: ' : '') + was };
}, [SCHACHT, W1]);
p('… auch wenn der erste Halt dahinter keinen Fokus nimmt (visibility:hidden) — Tab bleibt nicht in der Leiste stecken',
  weiter2.ok, weiter2.was);
await pg.evaluate(() => document.getElementById('f598-versteckt')?.remove());

/* ==========================================================================
 * §10–§12 · Die Tabelle im Kasten (E723)
 * ======================================================================== */
const dunkel = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const tp = await dunkel.newPage();
tp.on('pageerror', e => jsFehler.push(e.message.slice(0, 160)));
await tp.goto(`http://127.0.0.1:${PORT}/index.html`);
await tp.waitForFunction(() => typeof App !== 'undefined' && typeof Aussehen !== 'undefined' && !!document.querySelector('#page')?.firstElementChild);
const tab = await tp.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  const s = Store.addPage(null, { text: 'Tabelle auf der Fläche', seitenAnsicht: 'flaeche' });
  Store.addBlock(s.id, 'text', { text: 'Darunter die Tabelle.' });
  const { collectionId } = Store.addDatabase(s.id, 'Neue Datenbank');
  Store.addRow(collectionId, {}); Store.addRow(collectionId, {});
  await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 900));
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
  return { seite: s.id, coll: collectionId };
});
await tp.waitForTimeout(300);

console.log('\n10 · „Neu" bleibt beim Überfahren lesbar, in allen zehn Schemata');
await tp.addScriptTag({ content: `
  window.__f598 = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const rgba = css => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = String(css);
      cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
    const auf = (v, h) => { const a = v[3]; return [0, 1, 2].map(i => v[i] * a + h[i] * (1 - a)); };
    const lum = c => { const k = c.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; });
      return .2126 * k[0] + .7152 * k[1] + .0722 * k[2]; };
    const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    return { rgba, auf, kontrast };
  })();` });
const SCHEMATA: string[] = await tp.evaluate(() => (Aussehen.SCHEMATA as Array<{ id: string }>).map(s => s.id));
p('Zehn Schemata zum Durchmessen', SCHEMATA.length === 10, String(SCHEMATA.length));
const schlecht: string[] = [];
for (const sch of SCHEMATA) {
  await tp.evaluate((s: string) => { Aussehen.setzen({ schema: s, akzent: '' }); }, sch);
  await tp.waitForTimeout(120);
  const neu = await mitte(tp, '.pg-fl-koerper .db-tools button[data-a="new"]');
  if (!neu) { schlecht.push(`${sch}: kein Knopf`); continue; }
  await tp.mouse.move(neu.x, neu.y);
  await tp.waitForTimeout(160);
  const m = await tp.evaluate(() => {
    const F = (window as any).__f598;
    const b = document.querySelector<HTMLElement>('.pg-fl-koerper .db-tools button[data-a="new"]')!;
    const st = getComputedStyle(b);
    const karte = F.rgba(getComputedStyle(document.querySelector('.pg-fl-notiz')!).backgroundColor);
    const grund = F.auf(F.rgba(st.backgroundColor), karte);
    const schrift = F.auf(F.rgba(st.color), grund);
    const i = document.createElement('i'); i.style.color = 'var(--bg-hover)'; document.body.appendChild(i);
    const hover = F.auf(F.rgba(getComputedStyle(i).color), karte); i.remove();
    return { k: Math.round(F.kontrast(schrift, grund) * 100) / 100, hoverGrund: grund.every((v: number, j: number) => Math.abs(v - (hover[j] ?? 0)) < 2),
             ueber: b.matches(':hover'), filter: st.filter };
  });
  if (!m.ueber || m.k < 4.5 || m.hoverGrund)
    schlecht.push(`${sch}: ${m.k}${m.hoverGrund ? ' auf --bg-hover' : ''}${m.ueber ? '' : ' (nicht überfahren)'}`);
  await tp.mouse.move(5, 5);
}
await tp.evaluate(() => { Aussehen.setzen({ schema: 'standard', akzent: '' }); });
p('„Neu" überfahren: Schrift ≥ 4,5 und Grund bleibt der Akzent — in allen zehn', schlecht.length === 0,
  schlecht.join(' · '));

console.log('\n11 · Die Auswahlleiste liegt nicht über der Flächenleiste');
await tp.evaluate(() => {
  const cb = document.querySelector<HTMLInputElement>('.pg-fl-koerper tbody input.zeilen-aus');
  cb?.click();
});
await tp.waitForTimeout(250);
const s11 = await tp.evaluate((s: string) => {
  const a = document.getElementById('sammelleiste')?.getBoundingClientRect();
  const b = document.querySelector(s)?.getBoundingClientRect();
  if (!a || !b) return { da: false, flaeche: 0 };
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return { da: true, flaeche: Math.round(w * h), leiste: [a.top, a.bottom].map(Math.round), werkzeug: [b.top, b.bottom].map(Math.round) };
}, SCHACHT);
p('Mit einer angehakten Zeile steht die Auswahlleiste da (Vorbedingung)', s11.da);
p('Und sie überdeckt die Flächenleiste nicht (Schnitt 0 px²)', s11.da && s11.flaeche === 0, JSON.stringify(s11));
await tp.evaluate(() => document.querySelector<HTMLInputElement>('.pg-fl-koerper tbody input.zeilen-aus:checked')?.click());

console.log('\n12 · Die angeheftete Spalte trägt den Grund des Kastens');
await tp.evaluate(async (coll: string) => {
  const c = Store.getCollection(coll) as any;
  const erste = Object.keys(c?.schema ?? {})[0];
  const v = (c?.viewIds ?? [])[0];
  if (v && erste) Store.updateView(v, { fixiert: [erste] });
  await Store.flush(); App.zeichneSeite();
  await new Promise(f => setTimeout(f, 600));
}, tab.coll);
const s12 = await tp.evaluate(() => {
  const th = document.querySelector('.pg-fl-koerper th.fixiert');
  const kasten = document.querySelector('.pg-fl-notiz');
  return { da: !!th, th: th ? getComputedStyle(th).backgroundColor : '', kasten: kasten ? getComputedStyle(kasten).backgroundColor : '' };
});
p('Es gibt eine angeheftete Spalte (Vorbedingung)', s12.da);
p('Ihr Grund ist der Grund des Kastens (--bg-card), kein dunklerer Streifen', s12.da && s12.th === s12.kasten,
  `${s12.th} gegen ${s12.kasten}`);

/* §13 · DIE BREITE TABELLE ROLLT IM KASTEN — AUCH MIT DEM RAD (Durchsicht
   E723). Seit E723 bricht die Tabelle nicht mehr aus dem Kasten aus, sie
   rollt darin; acht Spalten verbergen im Seitenkasten 454 px. Das Rad der
   Fläche nahm aber JEDES Rad: ein Wisch quer auf dem Trackpad oder
   Umschalt+Rad schob die Fläche, und die Tabelle blieb bei 0 stehen. Es
   gilt dieselbe Regel wie beim Whiteboard — das Innerste gewinnt —, nur
   eben für das, was im Kasten selbst rollt. Längs rollt die Tabelle nicht,
   also schiebt ein Rad längs weiter die Fläche; und am Rand gibt sie das
   Rad weiter, statt es zu schlucken. */
console.log('\n13 · Die breite Tabelle rollt im Kasten — mit dem Rad');
await tp.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Breite Tabelle', seitenAnsicht: 'flaeche' });
  Store.addBlock(s.id, 'text', { text: 'Darüber ein Satz.' });
  const db = Store.addDatabase(s.id, 'Breit');
  const c = Store.getCollection(db.collectionId) as any;
  const schema = { ...(c?.schema ?? {}) };
  for (let i = 1; i <= 7; i++) schema['s' + i] = { name: 'Spalte ' + i, type: 'text' };
  Store.updateCollection(db.collectionId, { schema });
  Store.addRow(db.collectionId, {}); Store.addRow(db.collectionId, {});
  await Store.flush(); App.zeichneBaum(); App.oeffne(s.id);
  await new Promise(f => setTimeout(f, 1000));
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove());
});
const lage13 = () => tp.evaluate(() => {
  const box = document.querySelector<HTMLElement>('.pg-fl-koerper .db-rollbox');
  return { rollt: box ? box.scrollWidth - box.clientWidth : -1, links: Math.round(box?.scrollLeft ?? -1),
           flaeche: document.querySelector<HTMLElement>('.pg-fl-sicht')?.style.transform ?? '' };
});
const rad13 = async (dx: number, dy: number, umschalt = false) => {
  const m = await mitte(tp, '.pg-fl-koerper .db-rollbox', 0.5, 0.4);
  if (m) await tp.mouse.move(m.x, m.y);
  if (umschalt) await tp.keyboard.down('Shift');
  await tp.mouse.wheel(dx, dy);
  if (umschalt) await tp.keyboard.up('Shift');
  await tp.waitForTimeout(250);
  return lage13();
};
const v13 = await lage13();
p('Die Tabelle ist breiter als ihr Kasten (Vorbedingung)', v13.rollt > 100, `${v13.rollt} px verborgen`);
const n13a = await rad13(120, 0);
p('Ein Rad quer (Trackpad) über der Tabelle rollt die Tabelle', n13a.links > 0, `links ${n13a.links}`);
p('… und die Fläche bleibt stehen', n13a.flaeche === v13.flaeche, `${v13.flaeche} → ${n13a.flaeche}`);
const n13b = await rad13(0, 120, true);
p('Umschalt+Rad rollt sie weiter', n13b.links > n13a.links, `links ${n13a.links} → ${n13b.links}`);
p('… und die Fläche bleibt stehen', n13b.flaeche === n13a.flaeche, `${n13a.flaeche} → ${n13b.flaeche}`);
const n13c = await rad13(0, 120);
p('Ein Rad längs über derselben Tabelle schiebt weiter die Fläche (längs rollt sie nicht)',
  n13c.flaeche !== n13b.flaeche && n13c.links === n13b.links, `${n13b.flaeche} → ${n13c.flaeche}, links ${n13c.links}`);
await tp.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.pg-fl-koerper .db-rollbox');
  if (b) b.scrollLeft = b.scrollWidth;
});
await tp.waitForTimeout(150);
const v13d = await lage13();
const n13d = await rad13(120, 0);
p('Ganz rechts angekommen gibt sie das Rad an die Fläche weiter, statt es zu schlucken',
  n13d.flaeche !== v13d.flaeche, `${v13d.flaeche} → ${n13d.flaeche}, links ${v13d.links} → ${n13d.links}`);
await dunkel.close();

/* ==========================================================================
 * §8 · Am Telefon
 * ======================================================================== */
console.log('\n8 · Am Telefon (390 px)');
const { pg: handy, ids: idsH } = await bauen(390, 844, true);
const w1h = await mitte(handy, `${W1} .wb-flaeche`, 0.7, 0.7);
if (w1h) { await handy.touchscreen.tap(w1h.x, w1h.y); await handy.waitForTimeout(250); }
/* Ein Werkzeug weit rechts im Streifen wählen, zur Fläche wechseln und
   zurück: die Leiste kommt frisch eingehängt in den Schacht, und ein
   abgehängter Roller hat sein Rollmass verloren (Durchsicht E722). Der
   Wechsel geht über den Fokus, damit das Werkzeug beim Zurückkommen nicht
   selbst schon zeichnet. */
const fern = await handy.evaluate((s: string) => {
  /* „Bild" öffnet gleich die Dateiwahl und bleibt nicht gewählt — also das
     letzte Werkzeug davor. */
  const kn = [...document.querySelectorAll<HTMLElement>(`${s} .gfx-tb-roller [data-wz]`)]
    .filter(b => b.dataset['wz'] !== 'bild');
  const letzt = kn[kn.length - 1];
  letzt?.click();
  return letzt?.dataset['wz'] ?? '';
}, SCHACHT);
await handy.evaluate(() => document.querySelector<HTMLElement>('.pg-flaeche')?.focus());
await handy.waitForTimeout(150);
await handy.evaluate((w: string) => document.querySelector<HTMLElement>(w)?.focus(), W1);
await handy.waitForTimeout(250);
const s8 = await handy.evaluate((s: string) => {
  const f = document.querySelector('.pg-flaeche')!;
  const l = document.querySelector<HTMLElement>(s);
  /* JEDE Leiste in der Fläche, nicht nur der Schacht: die zweite im Kasten
     wird mit dem Kasten verkleinert (37 px), und genau die ist der Fund. */
  const kn = [...f.querySelectorAll<HTMLElement>('.gfx-tb-sockel button')].filter(b => b.offsetParent !== null && !b.closest('.gfx-tb-menue'));
  const klein = kn.map(b => { const r = b.getBoundingClientRect(); return { n: b.dataset['wz'] ?? b.dataset['a'] ?? '?', w: r.width, h: r.height }; })
    .filter(m => m.w < 43.5 || m.h < 43.5).map(m => `${m.n} ${Math.round(m.w)}×${Math.round(m.h)}`);
  const nav = document.getElementById('handy-oben');
  const nr = nav && nav.offsetParent !== null ? nav.getBoundingClientRect() : null;
  return { zahl: f.querySelectorAll('.gfx-tb-sockel').length,
           imKasten: f.querySelectorAll('.pg-fl-koerper .gfx-tb-sockel').length,
           seine: !!l?.querySelector('[data-wz="verbindung"]'), klein,
           unten: l ? Math.round(l.getBoundingClientRect().bottom) : -1, nav: nr ? Math.round(nr.top) : null,
           /* Das Schild nimmt dem Streifen Platz weg, den die Werkzeuge
              brauchen (Durchsicht E722): 106 von 366 px waren es. */
           schildBreit: (() => {
             const ro = l?.querySelector<HTMLElement>('.gfx-tb-roller');
             const sch = ro?.querySelector<HTMLElement>('.pg-fl-kontext');
             return ro && sch ? { w: Math.round(sch.getBoundingClientRect().width), von: Math.round(ro.getBoundingClientRect().width) } : null;
           })(),
           /* Das gewählte Werkzeug muss im rollenden Streifen ZU SEHEN sein,
              nicht irgendwo rechts daneben (Durchsicht E722): sonst sagt die
              Leiste nicht, womit der Finger gerade zeichnet. */
           gewaehlt: (() => {
             const ro = l?.querySelector<HTMLElement>('.gfx-tb-roller');
             const an = ro?.querySelector<HTMLElement>('[data-wz].on');
             if (!ro || !an) return { da: false, zu_sehen: false, schild: false, was: '' };
             const r = ro.getBoundingClientRect(), b = an.getBoundingClientRect();
             /* … und weder unter dem Schild noch ohne es: das Wort, wessen
                Leiste es ist, darf beim Rollen nicht mit hinausrollen (§38,
                sonst bleibt nur der Ring in der Akzentfarbe). */
             const sch = ro.querySelector<HTMLElement>('.pg-fl-kontext')?.getBoundingClientRect();
             const schild = !!sch && sch.width > 0 && sch.left >= r.left - 1 && sch.right <= r.right + 1;
             const frei = !sch || b.left >= sch.right - 1 || b.right <= sch.left + 1;
             return { da: true, zu_sehen: b.left >= r.left - 1 && b.right <= r.right + 1 && frei, schild,
                      was: `${an.dataset['wz']} ${Math.round(b.left)}…${Math.round(b.right)} im Streifen ${Math.round(r.left)}…${Math.round(r.right)}` };
           })() };
}, SCHACHT);
p('Eine Leiste in der Fläche, keine im Kasten', s8.zahl === 1 && s8.imKasten === 0, `${s8.zahl} / im Kasten ${s8.imKasten}`);
p('Ein Tipp ins Whiteboard bringt seine Werkzeuge in die eine Leiste', s8.seine);
p('Jeder Knopf misst 44 px (gerenderte Box, §37)', s8.klein.length === 0, s8.klein.slice(0, 6).join(' · '));
p(`Das gewählte Werkzeug (${fern}) steht nach dem Wechsel im sichtbaren Teil der rollenden Leiste`,
  !!fern && s8.gewaehlt.zu_sehen && s8.gewaehlt.was.startsWith(fern), s8.gewaehlt.was);
p('… und das Wort „Zeichenfläche" bleibt dabei im Bild', s8.gewaehlt.schild, s8.gewaehlt.was);
/* Ein Fünftel, nicht ein Viertel: mit 87 von 366 px (11 px, enger, noch in
   einer Zeile) standen weiter fünf Werkzeuge ganz im Bild — das Viertel
   war erfüllt, gewonnen war nichts. Erst unter einem Fünftel kommt das
   sechste dazu (Durchsicht E722). */
p('… und nimmt höchstens ein Fünftel des Streifens ein', !!s8.schildBreit && s8.schildBreit.w <= s8.schildBreit.von / 5,
  s8.schildBreit ? `${s8.schildBreit.w} von ${s8.schildBreit.von} px` : 'kein Schild');
p('Die Leiste steht über der unteren Leiste', s8.nav === null || s8.unten <= s8.nav + 1, `${s8.unten} gegen ${s8.nav}`);
/* Tab am Telefon (eine Tastatur am Tablet): die Griffe sind dort
   ausgeblendet, der nächste Halt nach dem Whiteboard ist also ein TEXTFELD.
   Ein `contenteditable` meldet `tabIndex` −1 und ist trotzdem ein Tabhalt —
   wer nur nach `tabIndex` filtert, findet keinen und schickt Tab zurück an
   den Anfang der Fläche (Durchsicht E722, gefunden in der Einzeldatei). */
await handy.evaluate(async (id: string) => {
  Store.addBlock(id, 'text', { text: 'Danach ein Satz.' }); await Store.flush(); App.oeffne(id);
  await new Promise(f => setTimeout(f, 900));
}, idsH.seite);
await handy.evaluate((w: string) => document.querySelector<HTMLElement>(w)?.focus(), W1);
await handy.waitForTimeout(150);
await handy.keyboard.press('Tab');
await handy.keyboard.press('Tab');
const weiterH = await handy.evaluate(([s, w]) => {
  const a = document.activeElement as HTMLElement | null;
  const wb = document.querySelector(w as string);
  if (!a || !wb || a === document.body) return { ok: false, was: 'kein Fokus' };
  const nach = !!(wb.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) && !wb.contains(a);
  /* Nicht irgendwohin dahinter, sondern auf den NÄCHSTEN Halt: das ist
     hier der Satz gleich unter dem Whiteboard, nicht das zweite Whiteboard
     im Kasten daneben. */
  const satz = a.isContentEditable && /Danach ein Satz/.test(a.textContent ?? '');
  return { ok: nach && satz && !a.closest(s as string), was: `${a.tagName} [${(a.getAttribute('aria-label') ?? a.textContent ?? '').trim().slice(0, 30)}]` };
}, [SCHACHT, W1]);
p('Telefon: Tab aus der Leiste führt auf den nächsten Halt hinter dem Whiteboard — das Textfeld', weiterH.ok, weiterH.was);
await handy.close();
await pg.close();

p('Keine Fehler auf der Konsole', jsFehler.length === 0, jsFehler.slice(0, 3).join(' · '));
await browser.close();
server.close();
console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
