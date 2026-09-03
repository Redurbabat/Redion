/* Suite 360 — Ziehen und Ablegen im Regal (E368, L78 Punkt 1, L114 Punkt 4)
 * ============================================================================
 * BEFUND: seit E366 SIEHT man die Schachtelung des Regals — bewegen konnte
 * man ein Heft aber nur über „⋯ → Verschieben". Das ist der Weg, den
 * GoodNotes gar nicht hat: dort zieht man den Deckel auf das Fach. Und
 * L114 Punkt 4 dazu: „Das Ablegen funktioniert, man sieht es nur nicht
 * kommen" — es gab keine Fläche, die sagt „hier fallen lassen".
 *
 * EINE Geste für Maus und Finger, über Pointer-Ereignisse. HTML5-`dragstart`
 * (wie in der Seitenleiste) wäre am Rechner billiger und am TELEFON gar
 * nichts — Touch löst es nicht aus.
 *
 * §1 MAUS: Heft auf Fach ziehen, es liegt drin.
 * §2 DIE ABLEGEZONE ist sichtbar, und nur während des Ziehens.
 * §3 EIN TIPP bleibt ein Tipp — er öffnet, er hebt nicht.
 * §4 DANEBEN abgelegt heisst: nichts passiert.
 * §5 DER RING ist gesperrt — ein Fach kann nicht in sein eigenes Heft.
 * §6 DIE BROTKRUME holt ein Heft wieder heraus.
 * §7 FINGER: langes Drücken hebt, kurzes Wischen rollt.
 * §8 DER SATZ danach nennt Heft und Ziel — beim Ziehen gibt es kein Menü.
 * §9 BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test360.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const Notebook: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9372;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof (window as any).Notebook !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1100);

/* Physik/Wellenlehre · Mathematik/Analysis · Kladde (lose) */
const ids = await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const fach = (n: string, e: string | null) => Store.addPage(e, { text: n, icon: '🗂' }).id;
  const heft = (n: string, e: string | null) => {
    const q = Store.addPage(e, { text: n });
    const bl = Store.addBlock(q.id, 'blatt', { text: '', papier: 'kariert' });
    Store.addBlock(bl.id, 'text', { text: '' });
    return q.id;
  };
  const physik = fach('Physik', null);
  const wellen = heft('Wellenlehre', physik);
  const mathe = fach('Mathematik', null);
  const analysis = heft('Analysis', mathe);
  const kladde = heft('Kladde', null);
  return { physik, mathe, wellen, analysis, kladde };
});

/** EIN FRISCHER BESTAND JE ABSCHNITT.
 *  Der erste Wurf teilte fünf Kennungen über neun Abschnitte — und §5 mass
 *  dann eine Schachtelung, die §2 kurz vorher aufgelöst hatte (das Fach lag
 *  gar nicht mehr im Heft, also war der Zug erlaubt und die Zusage schien
 *  gebrochen). Ein Abschnitt, dem ein anderer den Bestand verstellt, misst
 *  nicht mehr, was er behauptet. */
const frisch = async (marke: string): Promise<Record<string, string>> => {
  const neu = await seite.evaluate((m: string) => {
    Object.values<any>(Store.cache.blocks)
      .filter((b: any) => b?.type === 'page' && b.alive !== false &&
                          /^[A-Z]\d+ /.test(String(b.text || '')))
      .forEach((b: any) => Store.trashBlock(b.id));
    const fach = (n: string, e: string | null) =>
      Store.addPage(e, { text: m + ' ' + n, icon: '🗂' }).id;
    const heft = (n: string, e: string | null) => {
      const q = Store.addPage(e, { text: m + ' ' + n });
      const bl = Store.addBlock(q.id, 'blatt', { text: '', papier: 'kariert' });
      Store.addBlock(bl.id, 'text', { text: '' });
      return q.id;
    };
    const physik = fach('Physik', null);
    const wellen = heft('Wellenlehre', physik);
    const mathe = fach('Mathematik', null);
    const analysis = heft('Analysis', mathe);
    const kladde = heft('Kladde', null);
    return { physik, wellen, mathe, analysis, kladde };
  }, marke);
  await seite.evaluate(() => {
    Store.setMeta('heft:fach', ''); Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:form', 'gitter');
    (window as any).Notebook.oeffnen();
  });
  await seite.waitForTimeout(400);
  return neu;
};

const anDieWurzel = async (): Promise<void> => {
  await seite.evaluate(() => {
    Store.setMeta('heft:fach', ''); Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:form', 'gitter');
    (window as any).Notebook.oeffnen();
  });
  await seite.waitForTimeout(400);
};
const mitte = async (wahl: string): Promise<{ x: number; y: number }> =>
  seite.evaluate((s: string) => {
    const el = document.querySelector<HTMLElement>(s);
    if (!el) throw new Error('fehlt: ' + s);
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, wahl);
const elternVon = async (id: string): Promise<string | null> =>
  seite.evaluate((x: string) => Store.getBlock(x)?.parentId ?? null, id);
/** Ein Zug mit der Maus, mit einem Halt in der Mitte zum Hinsehen. */
const ziehen = async (vonWahl: string, nachWahl: string,
                      dazwischen?: () => Promise<void>): Promise<void> => {
  const a = await mitte(vonWahl), b = await mitte(nachWahl);
  await seite.mouse.move(a.x, a.y);
  await seite.mouse.down();
  await seite.mouse.move(a.x + 20, a.y + 10, { steps: 4 });
  await seite.mouse.move(b.x, b.y, { steps: 10 });
  await seite.waitForTimeout(150);
  if (dazwischen) await dazwischen();
  await seite.mouse.up();
  await seite.waitForTimeout(500);
};

/* ========================================================================== */
console.log('\n1 · Mit der Maus: Heft auf Fach');

await anDieWurzel();
gleich('Die Kladde liegt vorher lose', await elternVon(ids.kladde), null);
await ziehen(`.bib-deckel[data-id="${ids.kladde}"]`, `[data-fach="${ids.mathe}"]`);
gleich('Nach dem Zug liegt sie in Mathematik', await elternVon(ids.kladde), ids.mathe);
const kopfNachher = await seite.evaluate(() =>
  [...document.querySelectorAll('.nh-karte')]
    .map(k => (k.textContent || '').replace(/\s+/g, ' ').trim()));
p('Und die Fach-Karte zählt sie mit', kopfNachher.some(t => /Mathematik ?2 Hefte/.test(t)),
  kopfNachher.join(' | '));
p('Die lose Karte ist aus der Wurzel verschwunden',
  !kopfNachher.some(t => /Kladde/.test(t)), kopfNachher.join(' | '));

/* ========================================================================== */
console.log('\n2 · Die Ablegezone ist sichtbar — und nur währenddessen');

await anDieWurzel();
p('Vor dem Zug ist keine Zone markiert',
  await seite.evaluate(() => !document.querySelector('.nh-ziel')));
/* Die Wellenlehre liegt IN Physik — also erst hinein. Der Zug geht von dort
   auf die Brotkrume, das ist zugleich der Weg aus §6 in der Gegenrichtung. */
await seite.evaluate((x: string) => {
  document.querySelector<HTMLElement>(`[data-fach="${x}"]`)?.click();
}, ids.physik);
await seite.waitForTimeout(400);
let sichtbar: any = null;
await ziehen(`.bib-deckel[data-id="${ids.wellen}"]`, '[data-zurueck]', async () => {
  sichtbar = await seite.evaluate(() => {
    const z = document.querySelector('.nh-ziel');
    const s = document.querySelector<HTMLElement>('.nh-schatten');
    const h = document.querySelector<HTMLElement>('.nh-hebt');
    const st = z ? getComputedStyle(z) : null;
    return { zoneDa: !!z, zoneRahmen: st ? st.outlineStyle : '',
             zoneNichtNurFarbe: st ? (st.outlineWidth !== '0px') : false,
             schattenDa: !!s, schattenText: s?.textContent || '',
             gehobenBlass: h ? +getComputedStyle(h).opacity < 1 : false,
             bodyMarke: document.body.classList.contains('nh-zieht') };
  });
});
p('Während des Zugs ist die Zielfläche markiert', sichtbar?.zoneDa);
p('Und zwar mit einem Rahmen, nicht nur mit Farbe (§38)',
  sichtbar?.zoneNichtNurFarbe && sichtbar?.zoneRahmen === 'dashed', JSON.stringify(sichtbar));
p('Am Zeiger hängt der Name des Hefts', sichtbar?.schattenDa &&
  /Wellenlehre/.test(sichtbar?.schattenText || ''), sichtbar?.schattenText);
p('Die gehobene Karte bleibt stehen, nur blasser', sichtbar?.gehobenBlass);
p('Der Body trägt die Zieh-Marke (Textauswahl aus)', sichtbar?.bodyMarke);
p('Danach ist alles wieder weg',
  await seite.evaluate(() => !document.querySelector('.nh-ziel') &&
    !document.querySelector('.nh-schatten') && !document.querySelector('.nh-hebt') &&
    !document.body.classList.contains('nh-zieht')));

/* ========================================================================== */
console.log('\n3 · Ein Tipp bleibt ein Tipp');

const r3 = await frisch('R3');
await seite.evaluate((x: string) => {
  document.querySelector<HTMLElement>(`[data-fach="${x}"]`)?.click();
}, r3['mathe']!);
await seite.waitForTimeout(400);
const nachTipp = await seite.evaluate(() =>
  (document.querySelector('.nh-kopf h1')?.textContent || '').trim());
p('Ein Klick auf ein Fach öffnet es weiterhin', nachTipp.includes('Mathematik'), nachTipp);
await anDieWurzel();
const vorherEltern = await elternVon(r3['kladde']!);
/* Gedrückt wird auf ein HEFT. Fach-Karten tragen kein `data-id` und sind
   damit gar nicht ziehbar — sie sind Ziel, nicht Fracht (siehe LUECKEN
   L78 Punkt 1). Auf einer Fach-Karte könnte dieser Abschnitt die Schwelle
   also gar nicht messen; die Mutationsprobe blieb genau deshalb grün. */
const pos = await mitte(`.bib-deckel[data-id="${r3['kladde']}"]`);
await seite.mouse.move(pos.x, pos.y);
await seite.mouse.down();
await seite.mouse.move(pos.x + 2, pos.y + 1);   /* unter der Hebe-Schwelle */
/* MITTEN IM DRÜCKEN NACHSEHEN, sonst misst dieser Abschnitt nichts.
   Der erste Wurf prüfte nur, dass hinterher nichts verschoben ist — und
   das stimmt auch OHNE Schwelle: wird die Karte gehoben und auf sich
   selbst abgelegt, ist das Ziel dasselbe wie der Ursprung, und es
   passiert ebenfalls nichts. Die Mutationsprobe blieb grün. Gemessen
   wird deshalb, ob überhaupt gehoben WURDE. */
const beiZweiPixeln = await seite.evaluate(() => ({
  gehoben: !!document.querySelector('.nh-schatten'),
  marke: document.body.classList.contains('nh-zieht')
}));
await seite.mouse.up();
await seite.waitForTimeout(400);
p('Zwei Pixel Weg heben noch nichts an',
  !beiZweiPixeln.gehoben && !beiZweiPixeln.marke, JSON.stringify(beiZweiPixeln));
gleich('Ein Klick ohne Weg verschiebt nichts', await elternVon(r3['kladde']!), vorherEltern);
p('Und die Zieh-Marke ist danach wieder weg',
  await seite.evaluate(() => !document.body.classList.contains('nh-zieht')));

/* ========================================================================== */
console.log('\n4 · Daneben abgelegt heisst: nichts passiert');

const r4 = await frisch('R4');
const vorDaneben = await elternVon(r4['kladde']!);
const a4 = await mitte(`.bib-deckel[data-id="${r4['kladde']}"]`);
await seite.mouse.move(a4.x, a4.y);
await seite.mouse.down();
await seite.mouse.move(a4.x + 20, a4.y + 10, { steps: 4 });
await seite.mouse.move(20, 20, { steps: 8 });    /* auf die Seitenleiste */
await seite.mouse.up();
await seite.waitForTimeout(400);
gleich('Ausserhalb des Regals abgelegt: alles bleibt', await elternVon(r4['kladde']!), vorDaneben);

/* ========================================================================== */
console.log('\n5 · Der Ring ist gesperrt');

const r5 = await frisch('R5');
const ringVorher = await elternVon(r5['physik']!);
const ring = await seite.evaluate((x: any) => {
  /* Physik auf sein eigenes Heft „Wellenlehre" — geht nur über den Griff
     direkt, weil die Karte im offenen Fach steht. Gemessen wird die
     Regel, nicht der Weg dorthin. */
  const N = (window as any).Notebook;
  return N.ziehenAblegen(x.physik, x.wellen);
}, r5);
p('Ein Fach lässt sich nicht in sein eigenes Heft ziehen', ring === false);
gleich('Und es liegt weiterhin, wo es lag', await elternVon(r5['physik']!), ringVorher);

/* ========================================================================== */
console.log('\n6 · Die Brotkrume holt ein Heft wieder heraus');

const r6 = await frisch('R6');
/* Die Kladde erst hineinlegen, damit es etwas herauszuholen gibt, dann das
   Fach ÜBER DEN MERKER öffnen — ein Klick hinge daran, dass die Karte in
   diesem Augenblick auch gezeichnet ist, und das misst hier niemand. */
await seite.evaluate((x: any) => (window as any).Notebook.ziehenAblegen(x.kladde, x.mathe), r6);
await seite.evaluate((x: string) => {
  Store.setMeta('heft:fach', x);
  (window as any).Notebook.oeffnen();
}, r6['mathe']!);
await seite.waitForTimeout(500);
const krumeDa = await seite.evaluate(() => !!document.querySelector('[data-zurueck]'));
p('Im offenen Fach gibt es den Zurück-Griff', krumeDa);
await ziehen(`.bib-deckel[data-id="${r6['kladde']}"]`, '[data-zurueck]');
gleich('Auf ihn gezogen, liegt die Kladde wieder im Regal',
  await elternVon(r6['kladde']!), null);

/* ========================================================================== */
console.log('\n7 · Am Finger: langes Drücken hebt, Wischen rollt');

const r7 = await frisch('R7');
const cdp = await seite.context().newCDPSession(seite);
type TouchArt = 'touchStart' | 'touchMove' | 'touchEnd';
const tippen = async (x: number, y: number, art: TouchArt): Promise<void> => {
  await cdp.send('Input.dispatchTouchEvent', {
    type: art, touchPoints: art === 'touchEnd' ? [] : [{ x, y, id: 1 }]
  });
};
const vorFinger = await elternVon(r7['wellen']!);
const q7 = await mitte(`.bib-deckel[data-id="${r7['kladde']}"]`);
const z7 = await mitte(`[data-fach="${r7['physik']}"]`);
/* a) Kurz drücken und weit wischen = rollen, nicht ziehen. */
const vorWisch = await elternVon(r7['kladde']!);
await tippen(q7.x, q7.y, 'touchStart');
await tippen(q7.x, q7.y - 60, 'touchMove');
await tippen(z7.x, z7.y, 'touchMove');
await tippen(z7.x, z7.y, 'touchEnd');
await seite.waitForTimeout(400);
gleich('Wischen ohne Halten verschiebt nichts', await elternVon(r7['kladde']!), vorWisch);
/* b) Lange drücken, dann tragen = ziehen. */
await seite.evaluate(() => (window as any).Notebook.oeffnen());
await seite.waitForTimeout(400);
const q7b = await mitte(`.bib-deckel[data-id="${r7['kladde']}"]`);
const z7b = await mitte(`[data-fach="${r7['physik']}"]`);
await tippen(q7b.x, q7b.y, 'touchStart');
await seite.waitForTimeout(600);            /* über HEBEN_MS */
const gehoben = await seite.evaluate(() => !!document.querySelector('.nh-schatten'));
p('Nach langem Drücken ist die Karte gehoben', gehoben);
await tippen(z7b.x, z7b.y, 'touchMove');
await seite.waitForTimeout(120);
const zoneAmFinger = await seite.evaluate(() => !!document.querySelector('.nh-ziel'));
p('Und die Ablegezone zeigt sich auch am Finger', zoneAmFinger);
await tippen(z7b.x, z7b.y, 'touchEnd');
await seite.waitForTimeout(500);
gleich('Losgelassen liegt die Kladde in Physik',
  await elternVon(r7['kladde']!), r7['physik']);
gleich('Und die Wellenlehre hat sich nicht bewegt',
  await elternVon(r7['wellen']!), vorFinger);

/* ========================================================================== */
console.log('\n8 · Der Satz danach nennt Heft und Ziel');

const r8 = await frisch('R8');
const satz = await seite.evaluate((x: any) => {
  const gesehen: string[] = [];
  const alt = (window as any).UI.toast;
  (window as any).UI.toast = (t: string) => { gesehen.push(String(t)); };
  const N = (window as any).Notebook;
  N.ziehenAblegen(x.kladde, x.mathe);
  N.ziehenAblegen(x.kladde, null);
  N.ziehenAblegen(x.kladde, null);          /* dorthin, wo es schon liegt */
  (window as any).UI.toast = alt;
  return gesehen;
}, r8);
gleich('Zwei Sätze für zwei Züge — der dritte war keiner', satz.length, 2);
p('Der erste nennt Heft und Fach',
  /Kladde.*liegt jetzt in.*Mathematik/.test(satz[0] || ''), satz[0]);
p('Der zweite sagt „im Regal"', /im Regal/.test(satz[1] || ''), satz[1]);

/* ========================================================================== */
console.log('\n9 · Bau-Hygiene');

const nbJs = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/notebook.js'), 'utf8');
const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/notizhefte.css'), 'utf8');
p('Das erzeugte notebook.js kennt die Geste',
  nbJs.includes('ERZEUGT') && nbJs.includes('pointerdown') && nbJs.includes('nh-schatten'));
p('Der Stil kennt Schatten, Zone und die Zieh-Marke am Body',
  css.includes('.nh-schatten') && css.includes('.nh-ziel') && css.includes('body.nh-zieht'));
p('Kein erfundenes Merkmal im neuen Stil',
  !/var\(--bg-2\b/.test(css) && !css.includes('var(--akzent)') &&
  !css.includes('var(--flaeche-2)'));
p('Am Finger wird das Rollen abgeschaltet, aber nur während des Zugs',
  /body\.nh-zieht[^}]*touch-action:none/.test(css.replace(/\s+/g, ' ')));
p('Die Einzeldatei kennt die Geste',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes('nh-schatten'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
