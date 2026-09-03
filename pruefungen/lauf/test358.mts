/* Suite 358 — Das Regal zeigt die ganze Schachtelung (E366, L78 Punkt 2)
 * ============================================================================
 * BEFUND: das Notizhefte-Regal las die Fach-Regel EINE Ebene tief. Ein Fach
 * zählte nur, wenn direkt ein Heft darin lag. Bei `Schule/Physik/Heft` war
 * „Schule" damit gar kein Fach, „Physik" stand allein an der Wurzel, und
 * dass es zu „Schule" gehört, sah man nur im Baum. Nach einem ZIP-Import
 * mit Ordnern (E350/E365) war das die halbe Struktur — und zwar die Hälfte,
 * die der Nutzer selbst angelegt hatte.
 *
 * §1 DIE REGEL: ein Fach ist auch ein Fach, wenn nur ein FACH darin liegt.
 * §2 DIE WURZEL zeigt nur die obersten Fächer — nicht mehr alle flach.
 * §3 IM FACH stehen seine Unterfächer, und man kommt hinein.
 * §4 DIE BROTKRUME nennt den ganzen Weg — und schweigt auf Ebene eins.
 * §5 ZURÜCK führt EINE Ebene hoch, nicht an die Wurzel.
 * §6 DER INHALTSSATZ ist ehrlich: „2 Fächer", nicht „0 Hefte".
 * §7 NICHTS GEHT VERLOREN: jedes Heft bleibt erreichbar, lose bleibt lose.
 * §8 DAS VERSCHIEBEN kennt auch die tiefen Fächer, mit ihrem Weg.
 * §9 RING UND TIEFE: ein Ring hängt nicht, ein zu tiefer Baum bricht ab.
 * §10 SUCHE: dabei bleiben die Fächer weg — gesucht wird flach.
 * §11 TELEFON (§37) und BAU-HYGIENE.
 *
 *   node pruefungen/lauf/test358.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Notebook: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9369;

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
const seite = await browser.newPage({ viewport: { width: 1360, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof App !== 'undefined' && typeof (window as any).Notebook !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1100);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
});

/* Der Bestand, wie ihn eine ZIP mit Ordnern hinterlässt:
 *
 *   Schule/                      ← nur Fächer darin
 *     Physik/                    ← Fächer UND ein Heft
 *       Mechanik/  Kinematik, Dynamik
 *       Optik/     Linsen
 *       Formelsammlung           (Heft)
 *     Mathematik/  Analysis
 *   Kladde                       (loses Heft an der Wurzel)
 */
const ids = await seite.evaluate(() => {
  const fach = (name: string, eltern: string | null) =>
    Store.addPage(eltern, { text: name, icon: '🗂' }).id;
  const heft = (name: string, eltern: string) => {
    const h = Store.addPage(eltern, { text: name, icon: '📓' });
    const blatt = Store.addBlock(h.id, 'blatt', { text: '', papier: 'kariert' });
    Store.addBlock(blatt.id, 'text', { text: '' });
    return h.id;
  };
  const schule = fach('Schule', null);
  const physik = fach('Physik', schule);
  const mechanik = fach('Mechanik', physik);
  const kinematik = heft('Kinematik', mechanik);
  const dynamik = heft('Dynamik', mechanik);
  const optik = fach('Optik', physik);
  const linsen = heft('Linsen', optik);
  const formeln = heft('Formelsammlung', physik);
  const mathe = fach('Mathematik', schule);
  const analysis = heft('Analysis', mathe);
  const kladde = heft('Kladde', null as unknown as string);
  return { schule, physik, mechanik, optik, mathe,
           kinematik, dynamik, linsen, formeln, analysis, kladde };
});

const anDieWurzel = async (): Promise<void> => {
  await seite.evaluate(() => {
    Store.setMeta('heft:fach', '');
    Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:form', 'gitter');
    (window as any).Notebook.oeffnen();
  });
  await seite.waitForTimeout(400);
};
const insFach = async (id: string): Promise<void> => {
  await seite.evaluate((x: string) => {
    document.querySelector<HTMLElement>(`[data-fach="${x}"]`)?.click();
  }, id);
  await seite.waitForTimeout(350);
};

/* ========================================================================== */
console.log('\n1 · Die Regel: ein Fach in einem Fach macht ein Fach');

const regel = await seite.evaluate((x: any) => {
  const N = (window as any).Notebook;
  const f = (id: string) => N.istFach(Store.getBlock(id));
  return {
    schule: f(x.schule), physik: f(x.physik), mechanik: f(x.mechanik),
    mathe: f(x.mathe),
    kinematik: f(x.kinematik),          /* ein Heft ist kein Fach */
    kladde: f(x.kladde),
    heftKinematik: N.isNotebook(Store.getBlock(x.kinematik)),
    heftSchule: N.isNotebook(Store.getBlock(x.schule)),
  };
}, ids);
p('„Schule" ist ein Fach — obwohl kein Heft direkt darin liegt', regel.schule,
  'genau das war vor E366 falsch');
p('„Physik" ist ein Fach (Fächer UND ein Heft darin)', regel.physik);
p('„Mechanik" ist ein Fach (nur Hefte darin)', regel.mechanik);
p('„Mathematik" ist ein Fach', regel.mathe);
p('Ein Heft ist kein Fach', !regel.kinematik && !regel.kladde);
p('Ein Heft bleibt ein Heft', regel.heftKinematik);
p('Ein Fach ist kein Heft', !regel.heftSchule);

/* DER MERKER ERGÄNZT DIE REGEL, ER ÜBERSTIMMT SIE NICHT.
   Der erste Wurf dieses Bogens zog `heftArt === 'fach'` als billigen
   Vorab-Ausstieg vor die Blatt-Prüfung — und machte damit genau die Lüge
   möglich, gegen die E364 den Merker abgesichert hatte. test356 §2 hat es
   gefangen; hier steht es noch einmal, weil es E366s eigener Fehler war. */
const merkerRegel = await seite.evaluate(() => {
  const N = (window as any).Notebook;
  const f = Store.addPage(null, { text: 'Gemerktes Fach', icon: '🗂', heftArt: 'fach' });
  const leerUndGemerkt = N.istFach(Store.getBlock(f.id));
  Store.addBlock(f.id, 'blatt', { text: '', papier: 'blanko' });
  const mitEigenemBlatt = N.istFach(Store.getBlock(f.id));
  /* Wieder wegräumen: die Seite ist jetzt ein HEFT und stünde sonst in §7
     als loses Heft — ein Abschnitt, der einem späteren den Bestand
     verstellt, misst nicht mehr, was er behauptet. */
  Store.trashBlock(f.id);
  return { leerUndGemerkt, mitEigenemBlatt };
});
p('Ein leeres, gemerktes Fach bleibt sichtbar (E364)', merkerRegel.leerUndGemerkt);
p('Bekommt es ein eigenes Blatt, ist es kein Fach mehr — der Merker lügt nicht',
  !merkerRegel.mitEigenemBlatt,
  'genau hier ist der erste Wurf von E366 hineingelaufen');

/* ========================================================================== */
console.log('\n2 · Die Wurzel zeigt nur die obersten Fächer');

const wurzel = await seite.evaluate(() => {
  const N = (window as any).Notebook;
  return { faecher: N.faecher().map((f: any) => f.text),
           alle: N.alleFaecher().map((f: any) => f.text) };
});
gleich('An der Wurzel steht genau ein Fach: Schule', wurzel.faecher, ['Schule']);
gleich('Alle Fächer kennt die Liste weiterhin — fünf, nach Namen',
  wurzel.alle, ['Mathematik', 'Mechanik', 'Optik', 'Physik', 'Schule']);

await anDieWurzel();
const wurzelHtml = await seite.evaluate(() =>
  document.querySelector('.nh-regal')?.innerHTML || '');
p('Die Wurzel zeichnet die Karte „Schule"', wurzelHtml.includes('>Schule<'));
p('Und zeichnet „Physik" NICHT mehr flach daneben',
  !wurzelHtml.includes('>Physik<'),
  'vor E366 standen hier vier Fächer nebeneinander');
p('Das lose Heft steht weiterhin an der Wurzel', wurzelHtml.includes('>Kladde<'));

/* ========================================================================== */
console.log('\n3 · Im Fach stehen seine Unterfächer');

const unter = await seite.evaluate((x: any) => {
  const N = (window as any).Notebook;
  return { schule: N.unterFaecher(x.schule).map((f: any) => f.text),
           physik: N.unterFaecher(x.physik).map((f: any) => f.text),
           mechanik: N.unterFaecher(x.mechanik).map((f: any) => f.text) };
}, ids);
gleich('In „Schule" liegen Mathematik und Physik', unter.schule,
  ['Mathematik', 'Physik']);
gleich('In „Physik" liegen Mechanik und Optik', unter.physik, ['Mechanik', 'Optik']);
gleich('In „Mechanik" liegt kein Fach mehr', unter.mechanik, []);

await insFach(ids.schule);
const inSchule = await seite.evaluate(() =>
  document.querySelector('.nh-regal')?.innerHTML || '');
p('Das offene Fach „Schule" zeigt seine beiden Unterfächer',
  inSchule.includes('>Physik<') && inSchule.includes('>Mathematik<'),
  'vor E366 war das offene Fach leer');
await insFach(ids.physik);
const inPhysik = await seite.evaluate(() => ({
  html: document.querySelector('.nh-regal')?.innerHTML || '',
  titel: document.querySelector('.nh-kopf h1')?.textContent || '' }));
p('Von „Schule" kommt man in „Physik"', inPhysik.titel.includes('Physik'));
p('„Physik" zeigt Unterfächer UND sein eigenes Heft',
  inPhysik.html.includes('>Mechanik<') && inPhysik.html.includes('>Optik<') &&
  inPhysik.html.includes('>Formelsammlung<'));

/* ========================================================================== */
console.log('\n4 · Die Brotkrume nennt den ganzen Weg');

const wegNamen = await seite.evaluate((x: any) =>
  (window as any).Notebook.fachWeg(x.mechanik).map((f: any) => f.text), ids);
gleich('fachWeg(Mechanik) ist Schule / Physik / Mechanik', wegNamen,
  ['Schule', 'Physik', 'Mechanik']);

const krumePhysik = await seite.evaluate(() => {
  const n = document.querySelector('.nh-krume');
  return { da: !!n, text: (n?.textContent || '').replace(/\s+/g, ' ').trim(),
           knoepfe: [...(n?.querySelectorAll('button') || [])].map(b => b.textContent) };
});
p('In „Physik" steht eine Brotkrume', krumePhysik.da);
gleich('Sie nennt den Weg', krumePhysik.text, 'Notizhefte / Schule / Physik');
gleich('Notizhefte und Schule sind anklickbar, Physik nicht',
  krumePhysik.knoepfe, ['Notizhefte', 'Schule']);

await anDieWurzel();
await insFach(ids.schule);
const krumeSchule = await seite.evaluate(() => !!document.querySelector('.nh-krume'));
p('An einem WURZELFACH schweigt die Brotkrume', !krumeSchule,
  'dort stünde „Notizhefte / Schule" neben Titel und Zurück-Knopf — dreimal dasselbe');

/* ========================================================================== */
console.log('\n5 · Zurück führt eine Ebene hoch, nicht an die Wurzel');

await anDieWurzel();
await insFach(ids.schule); await insFach(ids.physik); await insFach(ids.mechanik);
const zurueckKnopf = await seite.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.nh-zurueck');
  return { text: (b?.textContent || '').trim(), fach: b?.dataset['fach'] || '',
           hatZurueck: b?.hasAttribute('data-zurueck') ?? false };
});
gleich('In „Mechanik" heisst der Knopf „← Physik"', zurueckKnopf.text, '← Physik');
p('Und er führt wirklich nach Physik, nicht an die Wurzel',
  zurueckKnopf.fach === ids.physik && !zurueckKnopf.hatZurueck);
await seite.evaluate(() => document.querySelector<HTMLElement>('.nh-zurueck')?.click());
await seite.waitForTimeout(350);
const nachZurueck = await seite.evaluate(() =>
  (document.querySelector('.nh-kopf h1')?.textContent || '').trim());
p('Ein Klick landet in „Physik"', nachZurueck.includes('Physik'),
  'ist: ' + nachZurueck);

await anDieWurzel(); await insFach(ids.schule);
const zurueckOben = await seite.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.nh-zurueck');
  return { text: (b?.textContent || '').trim(), hatZurueck: b?.hasAttribute('data-zurueck') ?? false };
});
gleich('An der obersten Ebene heisst er weiter „← Notizhefte"',
  zurueckOben.text, '← Notizhefte');
p('Und führt an die Wurzel', zurueckOben.hatZurueck);

/* ========================================================================== */
console.log('\n6 · Der Inhaltssatz ist ehrlich');

const saetze = await seite.evaluate((x: any) => {
  const N = (window as any).Notebook;
  const leer = Store.addPage(null, { text: 'Leeres Fach', icon: '🗂', heftArt: 'fach' });
  return { schule: N.fachInhaltSatz(x.schule), physik: N.fachInhaltSatz(x.physik),
           mechanik: N.fachInhaltSatz(x.mechanik), optik: N.fachInhaltSatz(x.optik),
           mathe: N.fachInhaltSatz(x.mathe), leer: N.fachInhaltSatz(leer.id) };
}, ids);
gleich('„Schule" sagt „2 Fächer" — nicht „0 Hefte"', saetze.schule, '2 Fächer');
gleich('„Physik" sagt beides', saetze.physik, '2 Fächer · 1 Heft');
gleich('„Mechanik" sagt „2 Hefte"', saetze.mechanik, '2 Hefte');
gleich('„Optik" zählt in der Einzahl', saetze.optik, '1 Heft');
gleich('„Mathematik" auch', saetze.mathe, '1 Heft');
gleich('Ein leeres Fach sagt „leer"', saetze.leer, 'leer');

/* ========================================================================== */
console.log('\n7 · Nichts geht verloren');

const bestand = await seite.evaluate((x: any) => {
  const N = (window as any).Notebook;
  /* Jedes Heft muss über SEIN Fach erreichbar sein. */
  const erreichbar = new Set<string>();
  const gehe = (fid: string, tiefe: number): void => {
    if (tiefe > 20) return;
    N.fachHefte(fid).forEach((h: any) => erreichbar.add(h.id));
    N.unterFaecher(fid).forEach((f: any) => gehe(f.id, tiefe + 1));
  };
  N.faecher().forEach((f: any) => gehe(f.id, 0));
  N.loseHefte().forEach((h: any) => erreichbar.add(h.id));
  const hefte = [x.kinematik, x.dynamik, x.linsen, x.formeln, x.analysis, x.kladde];
  return { fehlend: hefte.filter(h => !erreichbar.has(h)).length,
           lose: N.loseHefte().map((h: any) => h.text) };
}, ids);
gleich('Jedes der sechs Hefte ist über den Regalweg erreichbar', bestand.fehlend, 0);
gleich('Lose bleibt genau die Kladde', bestand.lose, ['Kladde']);

/* ========================================================================== */
console.log('\n8 · Das Verschieben kennt auch die tiefen Fächer');

await anDieWurzel();
await seite.evaluate((x: any) => {
  document.querySelector<HTMLElement>(`[data-mehr="${x.kladde}"]`)?.click();
}, ids);
await seite.waitForTimeout(250);
const verschiebenAuf = await seite.evaluate(() => {
  const b = [...document.querySelectorAll<HTMLElement>('.menu button')]
    .find(x => /Verschieben|Fach/.test(x.textContent || ''));
  b?.click(); return b?.textContent || '';
});
await seite.waitForTimeout(250);
const ziele = await seite.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.menu [data-z]')]
    .map(b => (b.textContent || '').replace(/\s+/g, ' ').trim()));
p('Das Kontextmenü führt zum Fachwähler', !!verschiebenAuf, verschiebenAuf);
p('„Mechanik" steht zur Wahl — drei Ebenen tief',
  ziele.some(z => z.includes('Mechanik')),
  'zur Wahl standen: ' + ziele.join(' | '));
p('Und mit seinem Weg, damit zwei gleiche Namen unterscheidbar sind',
  ziele.some(z => z.includes('Schule / Physik / Mechanik')),
  'zur Wahl standen: ' + ziele.join(' | '));
p('Auch „Schule" steht zur Wahl, ohne Weg davor',
  ziele.some(z => /^🗂\s*Schule$/.test(z) || z === '🗂Schule' || z.endsWith('Schule') && !z.includes('/')),
  'zur Wahl standen: ' + ziele.join(' | '));
await seite.evaluate(() => document.querySelectorAll('.menu').forEach(m => m.remove()));

/* ========================================================================== */
console.log('\n9 · Ring und Tiefe hängen nicht');

const bremsen = await seite.evaluate(() => {
  const N = (window as any).Notebook;
  /* Ein Ring in `content`: A hält B, B hält A. Kaputt — darf aber nicht hängen. */
  const a = Store.addPage(null, { text: 'Ring A', icon: '🗂' });
  const b = Store.addPage(a.id, { text: 'Ring B', icon: '🗂' });
  Store.updateBlock(b.id, { content: [a.id] });
  const t0 = performance.now();
  const ringOk: boolean = N.istFach(Store.getBlock(a.id));
  const ringMs = performance.now() - t0;
  /* Ein sehr tiefer Baum: 30 Fächer ineinander, ganz unten ein Heft. */
  let eltern: string | null = null; let oberstes = '';
  for (let i = 0; i < 30; i++) {
    const stufe: any = Store.addPage(eltern, { text: 'Tief ' + i, icon: '🗂' });
    if (!oberstes) oberstes = stufe.id;
    eltern = stufe.id;
  }
  const h = Store.addPage(eltern, { text: 'Ganz unten' });
  const blatt = Store.addBlock(h.id, 'blatt', { text: '', papier: 'blanko' });
  Store.addBlock(blatt.id, 'text', { text: '' });
  const t1 = performance.now();
  const tiefOk = N.istFach(Store.getBlock(oberstes));
  const tiefMs = performance.now() - t1;
  const wegLaenge = N.fachWeg(eltern).length;
  return { ringMs: Math.round(ringMs), ringOk, tiefMs: Math.round(tiefMs), tiefOk,
           grenze: N.FACH_TIEFE, wegLaenge };
});
p('Ein Ring in `content` hängt nicht — die Antwort kommt sofort',
  bremsen.ringMs < 500, bremsen.ringMs + ' ms');
p('Ein 30 Ebenen tiefer Baum hängt auch nicht',
  bremsen.tiefMs < 500, bremsen.tiefMs + ' ms');
p('Ab der Grenze gilt „kein Fach" statt „unendlich suchen"',
  bremsen.grenze === 12 && bremsen.tiefOk === false,
  'Grenze ' + bremsen.grenze + ', oberstes gilt als Fach: ' + bremsen.tiefOk);
p('Auch die Brotkrume bricht ab statt zu wachsen',
  bremsen.wegLaenge <= bremsen.grenze + 1, 'Weglänge ' + bremsen.wegLaenge);

/* ========================================================================== */
console.log('\n10 · Während der Suche bleiben die Fächer weg');

await anDieWurzel();
await insFach(ids.physik === '' ? ids.schule : ids.schule);
await insFach(ids.physik);
await seite.evaluate(() => {
  const feld = document.querySelector<HTMLInputElement>('.nh-suche');
  if (!feld) return;
  feld.hidden = false; feld.value = 'Formel';
  feld.dispatchEvent(new Event('input', { bubbles: true }));
});
await seite.waitForTimeout(400);
const beiSuche = await seite.evaluate(() =>
  document.querySelector('.nh-regal')?.innerHTML || '');
p('Der Treffer steht da', beiSuche.includes('>Formelsammlung<'));
p('Die Unterfächer treten nicht dazwischen',
  !beiSuche.includes('>Mechanik<') && !beiSuche.includes('>Optik<'),
  'beim Suchen wird gesucht, nicht geblättert');

/* ========================================================================== */
console.log('\n11 · Telefon und Bau-Hygiene');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true });
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForFunction(() => typeof (window as any).Notebook !== 'undefined',
  null, { timeout: 30000 });
await handy.waitForTimeout(1100);
const handyMass = await handy.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const fach = (name: string, eltern: string | null) =>
    Store.addPage(eltern, { text: name, icon: '🗂' }).id;
  const s = fach('Schule', null), ph = fach('Physik', s), me = fach('Mechanik', ph);
  const h = Store.addPage(me, { text: 'Kinematik' });
  const bl = Store.addBlock(h.id, 'blatt', { text: '', papier: 'kariert' });
  Store.addBlock(bl.id, 'text', { text: '' });
  Store.setMeta('heft:fach', me);
  Store.setMeta('heft:reiter', 'dokumente');
  (window as any).Notebook.oeffnen();
  return new Promise<any>(f => setTimeout(() => {
    const kr = document.querySelector('.nh-krume');
    const zu = document.querySelector<HTMLElement>('.nh-zurueck');
    const regal = document.querySelector('.nh-regal');
    f({ krumeDa: !!kr,
        krumeText: (kr?.textContent || '').replace(/\s+/g, ' ').trim(),
        krumePasst: kr ? Math.round(kr.getBoundingClientRect().width) <= 390 : false,
        knopfHoehe: kr ? Math.min(...[...kr.querySelectorAll('button')]
          .map(b => Math.round(b.getBoundingClientRect().height))) : 0,
        breiter: regal ? Math.round(regal.scrollWidth) : 0,
        zurueck: (zu?.textContent || '').trim() });
  }, 700));
});
p('Am Telefon steht die Brotkrume', handyMass.krumeDa);
gleich('Und nennt denselben Weg', handyMass.krumeText,
  'Notizhefte / Schule / Physik / Mechanik');
p('Sie passt in die Breite des Telefons', handyMass.krumePasst,
  'sie rollt waagerecht statt die Seite zu weiten');
p('Das Regal wird nicht breiter als das Telefon',
  handyMass.breiter <= 391, handyMass.breiter + ' px');
p('Ihre Knöpfe sind mindestens 32 px hoch (kleiner Weg, kein Hauptweg)',
  handyMass.knopfHoehe >= 32, handyMass.knopfHoehe + ' px');
gleich('Der Zurück-Knopf nennt auch hier die Ebene darüber',
  handyMass.zurueck, '← Physik');
await handy.close();

const notebookJs = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/wissen/notebook.js'), 'utf8');
const notebookTs = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/notebook.ts'), 'utf8');
const css = fs.readFileSync(
  path.join(WURZEL, 'quell/schale/stil/notizhefte.css'), 'utf8');
p('Das erzeugte notebook.js trägt den ERZEUGT-Kopf und kennt die neuen Teile',
  notebookJs.includes('ERZEUGT') && notebookJs.includes('unterFaecher') &&
  notebookJs.includes('nh-krume'));
p('Die Quelle nennt die Grenze als Zahl, nicht als Zufall',
  /FACH_TIEFE\s*=\s*12/.test(notebookTs));
p('Die Brotkrume hat Stil und rollt waagerecht',
  css.includes('.nh-krume') && /\.nh-krume\{[^}]*overflow-x:auto/.test(css));
p('Kein erfundenes Merkmal im neuen Stil',
  !css.includes('var(--akzent)') && !css.includes('var(--flaeche-2)'),
  'genau das ist in bausteine.css schon zweimal passiert');
p('Die Einzeldatei kennt die Brotkrume',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes('nh-krume'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
