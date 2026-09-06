/* Suite 433 — Ein Merker für „gemerkt", und er sagt es auch hörbar (E460)
 * ============================================================================
 * `favorite` wurde an drei Stellen verschieden gezeichnet: die Kopfleiste
 * mit einer Klasse und OHNE `aria-pressed`, die Notizhefte mit „★" gegen
 * „☆", das Regal mit einem Zeichen, das gar kein Knopf ist. Seit E460 ist
 * es EIN Bauteil.
 *
 *   §1 DAS BAUTEIL: Form UND `aria-pressed` UND Vorlesename — nicht Farbe
 *      allein (§38); der Kranz springt nur beim Anhaken auf, nicht beim
 *      Abhaken und nicht bei jedem Neuzeichnen.
 *   §2 IN DER KOPFLEISTE: der echte Knopf trägt den echten Zustand, und
 *      ein Klick schreibt ihn in den Speicher.
 *   §3 IN DEN NOTIZHEFTEN: dasselbe Zeichen, derselbe Zustand.
 *   §4 DIE FORM ALLEIN GENÜGT: in Graustufen bleibt „gemerkt" von „nicht
 *      gemerkt" unterscheidbar.
 *   §5 OHNE BEWEGUNG springt nichts.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → in `kopfleiste.ts` zurück auf `classList.toggle('on', …)`:
 *        `aria-pressed` fehlt. Gelaufen am 6. September 2026, rot.
 *   §4 → im Bauteil `fill` immer auf `currentColor`: beide Zustände sehen
 *        gleich aus. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test433.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9553;
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
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];
const oeffne = async (ruhig = false) => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 },
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {}) });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 140)); });
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Merkzeichen !== 'undefined' && typeof Notebook !== 'undefined' && Store.cache.blocks",
                          null, { timeout: 30000 });
  await s.waitForTimeout(600);
  await s.evaluate(`(() => {
    document.querySelectorAll('.overlay, #rg-willkommen, #rg-einladung, ' +
      '.produkt-onboarding-lage').forEach(x => x.remove());
    Store.setMeta('rundgangGesehen', true);
  })()`);
  return s;
};

const s = await oeffne();

console.log('\n§1 Das Bauteil: Form, Wort, Kranz');
const bauteil = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  let zuletzt = null;
  const k = Merkzeichen.bauen({ an: false, name: 'Formelsammlung',
    beiWechsel: v => { zuletzt = v; } });
  document.body.append(k);
  const aus = { pressed: k.getAttribute('aria-pressed'), label: k.getAttribute('aria-label'),
    fill: k.querySelector('.ru-merk-band path').getAttribute('fill'),
    klasse: k.className, platzt: k.classList.contains('platzt') };
  k.click();
  const an = { pressed: k.getAttribute('aria-pressed'), label: k.getAttribute('aria-label'),
    fill: k.querySelector('.ru-merk-band path').getAttribute('fill'),
    klasse: k.className, platzt: k.classList.contains('platzt'), gemeldet: zuletzt };
  k.click();
  const wiederAus = { pressed: k.getAttribute('aria-pressed'),
    platzt: k.classList.contains('platzt'), gemeldet: zuletzt };
  /* Zweimal dasselbe stellen darf NICHT platzen — sonst feuert jedes
     Neuzeichnen der Kopfleiste ein Feuerwerk. */
  Merkzeichen.markieren(k, { an: false, name: 'Formelsammlung' });
  Merkzeichen.markieren(k, { an: false, name: 'Formelsammlung' });
  const ruhig = !k.classList.contains('platzt');
  k.remove();
  const roh = Merkzeichen.html({ an: true, name: 'Seite <b>x</b>', zusatz: 'data-stern="7"' });
  return { aus, an, wiederAus, ruhig, roh };
})())`) as string);
p('Aus: aria-pressed=false', bauteil.aus.pressed === 'false');
p('Aus: der Vorlesename sagt, was ein Klick tut', bauteil.aus.label === 'Zu Favoriten: Formelsammlung',
  bauteil.aus.label);
p('Aus: das Band ist offen, nicht gefüllt', bauteil.aus.fill === 'none', bauteil.aus.fill);
p('An: aria-pressed=true', bauteil.an.pressed === 'true');
p('An: der Vorlesename kehrt sich um', bauteil.an.label === 'Aus Favoriten: Formelsammlung',
  bauteil.an.label);
p('An: das Band ist gefüllt', bauteil.an.fill === 'currentColor', bauteil.an.fill);
p('An: die Klasse sagt es auch', /ist-an/.test(bauteil.an.klasse));
p('Der Kranz springt beim Anhaken auf', bauteil.an.platzt === true);
p('… und NICHT beim Abhaken', bauteil.wiederAus.platzt === false);
p('… und nicht, wenn sich nichts ändert', bauteil.ruhig);
p('Der Wechsel wird gemeldet', bauteil.an.gemeldet === true && bauteil.wiederAus.gemeldet === false);
p('Die Zeichenketten-Fassung escapt den Namen (§19)',
  /Seite &lt;b&gt;x&lt;\/b&gt;/.test(bauteil.roh) && !/name="Seite <b>/.test(bauteil.roh));
p('… und trägt den Zusatz des Aufrufers', /data-stern="7"/.test(bauteil.roh));

console.log('\n§2 In der Kopfleiste');
const kopf = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const seite = Store.addPage(null, { text: 'Formelsammlung Elektrotechnik' });
  Store.flush();
  App.oeffne(seite.id);
  return { id: seite.id };
})())`) as string);
await s.waitForTimeout(600);
const vorher = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('btn-fav');
  return { pressed: k.getAttribute('aria-pressed'), label: k.getAttribute('aria-label'),
    band: !!k.querySelector('.ru-merk-band'),
    fill: k.querySelector('.ru-merk-band') ? k.querySelector('.ru-merk-band path').getAttribute('fill') : '' };
})())`) as string);
p('Der Knopf der Kopfleiste trägt das Band', vorher.band);
p('… und sagt „nicht gemerkt" hörbar', vorher.pressed === 'false', String(vorher.pressed));
p('… mit dem Titel der Seite im Vorlesenamen',
  /Formelsammlung Elektrotechnik/.test(String(vorher.label)), String(vorher.label));
await s.click('#btn-fav');
await s.waitForTimeout(400);
const nachher = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const k = document.getElementById('btn-fav');
  return { pressed: k.getAttribute('aria-pressed'),
    fill: k.querySelector('.ru-merk-band path').getAttribute('fill'),
    gespeichert: !!Store.getBlock(${JSON.stringify(kopf.id)}).favorite,
    inFavoriten: Store.favorites().some(f => f.id === ${JSON.stringify(kopf.id)}) };
})())`) as string);
p('Ein Klick merkt die Seite wirklich', nachher.gespeichert === true);
p('… sie steht danach in Store.favorites()', nachher.inFavoriten === true);
p('… und der Knopf sagt es', nachher.pressed === 'true' && nachher.fill === 'currentColor');

console.log('\n§3 In den Notizheften dasselbe Zeichen');
const hefte = JSON.parse(await s.evaluate(`(async () => {
  /* EIN HEFT IST EINE SEITE MIT EINEM BLATT DARIN (heftArtig in
     notebook.ts). Ohne das zeigt das Regal seinen leeren Zustand, und der
     erste Wurf dieser Suite suchte den Merker in „Dein erstes Heft".
     Kein Backtick hier drin: der Block steckt in einer Vorlagenzeichenkette. */
  const heft = Store.addPage(null, { text: 'Mathe I', icon: '📓' });
  Store.addBlock(heft.id, 'blatt', { text: '' });
  Store.flush();
  Notebook.oeffnen();
  await new Promise(r => setTimeout(r, 900));
  const knopf = document.querySelector('.nh-stern');
  if (!knopf) return JSON.stringify({ da: false });
  const vor = { pressed: knopf.getAttribute('aria-pressed'),
    band: !!knopf.querySelector('.ru-merk-band'), id: knopf.dataset.stern };
  knopf.click();
  await new Promise(r => setTimeout(r, 500));
  const jetzt = document.querySelector('[data-stern="' + vor.id + '"]');
  return JSON.stringify({ da: true, vor,
    nach: jetzt ? jetzt.getAttribute('aria-pressed') : null,
    gespeichert: !!Store.getBlock(vor.id).favorite });
})()`) as string);
p('Es gibt einen Merker im Heftregal', hefte.da);
p('… und es ist dasselbe Band wie oben, kein „★"', hefte.da && hefte.vor.band);
p('… mit aria-pressed', hefte.da && hefte.vor.pressed === 'false');
p('Ein Klick merkt das Heft wirklich', hefte.da && hefte.gespeichert === true);
p('… und das neu gezeichnete Zeichen sagt es', hefte.da && hefte.nach === 'true');

console.log('\n§4 Die Form allein genügt');
/* Ohne Farbe: das gefüllte Band deckt mehr Fläche als das offene. Gemessen
   wird die Deckung, nicht die Farbe — genau das ist der Punkt von §38. */
const form = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const messe = (an) => {
    const k = Merkzeichen.bauen({ an, name: 'x', beiWechsel: () => {} });
    k.style.cssText = 'position:fixed;left:10px;top:200px;width:44px;height:44px';
    document.body.append(k);
    const pfad = k.querySelector('.ru-merk-band path');
    const wert = { fill: pfad.getAttribute('fill'), strich: pfad.getAttribute('stroke') };
    k.remove();
    return wert;
  };
  return { aus: messe(false), an: messe(true) };
})())`) as string);
p('Gemerkt ist gefüllt, nicht gemerkt ist offen',
  form.an.fill === 'currentColor' && form.aus.fill === 'none');
p('Beide haben denselben Umriss — nur die Füllung unterscheidet',
  form.an.strich === form.aus.strich && form.an.strich === 'currentColor');

console.log('\n§5 Ohne Bewegung');
const ruhig = await oeffne(true);
const still = JSON.parse(await ruhig.evaluate(`JSON.stringify((() => {
  const k = Merkzeichen.bauen({ an: false, name: 'x', beiWechsel: () => {} });
  document.body.append(k);
  k.click();
  const st = (sel) => getComputedStyle(k.querySelector(sel)).animationName;
  const wert = { band: st('.ru-merk-band'), kreis: st('.ru-merk-kreis'),
    funken: st('.ru-merk-funken'), punkt: st('.ru-merk-punkt'),
    pressed: k.getAttribute('aria-pressed') };
  k.remove();
  return wert;
})())`) as string);
p('Der Kranz springt nicht auf', still.kreis === 'none' && still.funken === 'none', JSON.stringify(still));
p('Das Band zuckt nicht', still.band === 'none');
p('Der Punkt rollt nicht', still.punkt === 'none');
p('… der Zustand wechselt trotzdem', still.pressed === 'true');
await ruhig.close();

console.log('\n§6 Eingebunden');
p('index.html lädt merkzeichen.js', /quell\/schale\/bedienung\/merkzeichen\.js/.test(lies('index.html')));
p('Der GRUNDSTOCK kennt es (§28)', /\.\/quell\/schale\/bedienung\/merkzeichen\.js/.test(lies('src/dienst/sw.ts')));
p('Die Quelle ist TypeScript, das .js ist erzeugt',
  fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/merkzeichen.ts')) &&
  /ERZEUGT/.test(lies('quell/schale/bedienung/merkzeichen.js')));

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
