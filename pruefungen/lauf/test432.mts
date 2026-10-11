/* Suite 432 — Die Ordnerkarte zeigt echte Kinder, und man kann sie lesen (E459)
 * ============================================================================
 * Der Blick in einen Ordner, ohne hineinzugehen. Alles daran ist echt: die
 * Kinder kommen aus `Store.childrenOf`, die Zahl ist die Anzahl, die Suche
 * filtert den ganzen Unterbaum.
 *
 *   §1 DAS BAUTEIL: `aria-expanded` statt verstecktem Kästchen, die echte
 *      Zahl, höchstens fünf Blätter, der Rest als Satz; jedes Blatt ein
 *      Knopf mit vollem Namen im Titel; die Art als WORT (§38).
 *   §2 LESBAR: jede der fünf Zeilen steht wirklich im Bild — gemessen mit
 *      `elementFromPoint`, nicht geglaubt.
 *   §3 DIE SUCHE GEHT TIEFER als die des Regals: sie findet, was zwei
 *      Ebenen darunter liegt, und nennt den Weg.
 *   §4 AM ECHTEN REGAL: „Blick hinein" steht nur bei Ordnern; ein Blatt
 *      öffnet die echte Seite; „Ordner öffnen" geht hinein; Escape
 *      schliesst und gibt den Fokus zurück.
 *   §5 OHNE BEWEGUNG steht die Karte still, und die Blätter stehen
 *      trotzdem an ihrem Platz.
 *   §6 EINGEBUNDEN: index.html und der GRUNDSTOCK kennen ordnerkarte.js.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   Drei Gegenproben, alle am 6. September 2026 gelaufen:
 *   A → `.ru-fach-blaetter` zurück auf `z-index:5`: der Klappgriff liegt
 *       wieder über den Blättern. SECHS Punkte rot, jeder mit „davor liegt
 *       ru-fach-griff". Das ist der Fehler, den diese Suite gefunden hat.
 *   B → die Zeile zurück an den Kopf des Blattes (`top:5px`): vier Punkte
 *       rot, „davor liegt ru-fach-blatt".
 *   C → `--ru-fach-hoehe` zurück auf 190px: BLIEB GRÜN. Die Höhe allein
 *       war nie der Fehler; sie war es nur zusammen mit den alten
 *       Abständen. Eine Gegenprobe, die nicht rot wird, beweist nichts —
 *       also stehen A und B hier, nicht C (§55.2).
 *   Dieser Paragraph ist der Grund für die Suite. Drei Fassungen der Karte
 *   sahen im Quelltext richtig aus und verdeckten je etwas anderes: erst
 *   die Suchzeile, dann drei Blätter, dann die unterste Zeile. Keine
 *   Prüfung hätte das gesehen, die nur DASS-es-da-ist misst — `querySelector`
 *   findet auch ein Element, das vollständig hinter einem anderen liegt.
 *
 *   node pruefungen/lauf/test432.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9552;

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

/* Ein Fach mit sieben Kindern, davon ein Unterfach mit einem Enkel. Die
   Zahlen darin sind die, gegen die unten geprüft wird. */
const BESTAND = `(() => {
  document.querySelectorAll('.overlay, .menu, #rg-willkommen, #rg-einladung, ' +
    '.produkt-onboarding-lage').forEach(x => x.remove());
  Store.setMeta('rundgangGesehen', true);
  const fach = Store.addPage(null, { text: 'Elektrotechnik' });
  Store.updateBlock(fach.id, { heftArt: 'fach' });
  const namen = ['Kapitel 2 — Spannung und Strom', 'Formelsammlung', 'Prüfung Februar',
                 'Messprotokoll 14.03.', 'Notizen Vorlesung', 'Altklausuren'];
  const kinder = namen.map(t => Store.addPage(fach.id, { text: t }).id);
  const unter = Store.addPage(fach.id, { text: 'Laborberichte' });
  Store.updateBlock(unter.id, { heftArt: 'fach' });
  const enkel = Store.addPage(unter.id, { text: 'Versuch 3 — Widerstandsmessung' });
  Store.flush();
  return JSON.stringify({ fach: fach.id, unter: unter.id, enkel: enkel.id, kinder });
})()`;

const browser = await chromium.launch();
const fehler: string[] = [];
const oeffne = async (weite: number, hoehe: number, ruhig = false) => {
  const s = await browser.newPage({ viewport: { width: weite, height: hoehe },
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {}) });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 140)); });
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Ordnerkarte !== 'undefined' " +
                          "&& typeof Bibliothek !== 'undefined' && Store.cache.blocks",
                          null, { timeout: 30000 });
  await s.waitForTimeout(600);
  return s;
};

const s = await oeffne(1280, 900);
const bestand = JSON.parse(await s.evaluate(BESTAND) as string);

console.log('\n§1 Das Bauteil: echte Zahl, echte Kinder, echte Wörter');
const bauteil = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const kinder = Store.childrenOf(${JSON.stringify(bestand.fach)})
    .filter(b => b.alive !== false && b.type === 'page')
    .map(b => ({ id: b.id, name: b.text, art: 'Seite' }));
  const g = Ordnerkarte.bauen({ name: 'Elektrotechnik', kinder,
    beiWahl: () => {}, beiOrdner: () => {} });
  document.body.append(g.element);
  const griff = g.element.querySelector('.ru-fach-griff');
  const zu = { auf: g.offen(), aria: griff.getAttribute('aria-expanded'),
    blaetter: g.element.querySelectorAll('.ru-fach-blatt').length };
  g.klappen(true);
  const blaetter = [...g.element.querySelectorAll('.ru-fach-blatt')];
  const auf = {
    auf: g.offen(), aria: griff.getAttribute('aria-expanded'),
    anzahl: blaetter.length,
    zahl: g.element.querySelector('.ru-fach-zahl').textContent,
    wort: g.element.querySelector('.ru-fach-wort').textContent,
    rolle: g.element.querySelector('.ru-fach-zaehler').getAttribute('role'),
    rest: g.element.querySelector('.ru-fach-rest').textContent,
    titel: blaetter.map(b => b.title),
    knoepfe: blaetter.every(b => b.tagName === 'BUTTON' && b.type === 'button'),
    marken: blaetter.map(b => b.querySelector('.ru-fach-art').textContent),
    kasten: g.element.querySelectorAll('input[type="checkbox"]').length
  };
  g.entfernen();
  return { zu, auf, kinder: kinder.length };
})())`) as string);
p('Der Ordner hat sieben Kinder im Bestand', bauteil.kinder === 7, String(bauteil.kinder));
p('Zugeklappt liegt kein Blatt im Baum', bauteil.zu.blaetter === 0 && bauteil.zu.auf === false);
p('… und der Griff sagt es (aria-expanded=false)', bauteil.zu.aria === 'false');
p('Aufgeklappt sagt er das Gegenteil', bauteil.auf.aria === 'true' && bauteil.auf.auf === true);
p('Kein verstecktes Kästchen — ein Knopf mit aria-expanded (§38)', bauteil.auf.kasten === 0);
p('Der Zähler nennt die ECHTE Zahl, nicht die gezeigte', bauteil.auf.zahl === '7', bauteil.auf.zahl);
p('… mit dem Wort daneben, nicht nur der Zahl', bauteil.auf.wort === 'Sachen', bauteil.auf.wort);
p('… und er ist eine Statuszeile', bauteil.auf.rolle === 'status');
p('Höchstens fünf Blätter fächern heraus', bauteil.auf.anzahl === 5, String(bauteil.auf.anzahl));
p('… und der Rest steht als Satz da', /und 2 weitere/.test(bauteil.auf.rest), bauteil.auf.rest);
p('Jedes Blatt ist ein Knopf', bauteil.auf.knoepfe);
p('Jedes trägt seinen ganzen Namen im Titel',
  bauteil.auf.titel.some((t: string) => t.startsWith('Kapitel 2 — Spannung und Strom')),
  JSON.stringify(bauteil.auf.titel[0]));
p('Die Art steht als WORT auf dem Blatt, nicht nur als Farbe (§38)',
  bauteil.auf.marken.every((m: string) => m && m.length > 2), JSON.stringify(bauteil.auf.marken));

console.log('\n§2 Und man kann die Zeilen wirklich lesen');
/* elementFromPoint statt querySelector: ein Element, das vollständig hinter
   einem anderen liegt, steht trotzdem im Baum. Genau das war der Fehler,
   den erst das Bild zeigte — dreimal, an drei verschiedenen Stellen. */
/* ERST DEN AUFTRITT ABWARTEN, DANN MESSEN (nachgemessen am 19. September
   2026). Der Block hier mass im selben Tick wie `klappen(true)` — und seit
   E537 haben Pille und Suchzeile einen Auftritt mit `animation-fill-mode:both`.
   `both` heisst: vor dem ersten Bild gilt das Anfangsbild. Die Pille stand
   deshalb auf `scale(0)` (0 × 0 gross, weil ihre Vorlage 0,2 s wartet), die
   Suchzeile auf `width:30px` hinter `overflow:hidden`. `elementFromPoint`
   griff beides daneben und meldete „verdeckt", wo nichts verdeckt war.
   Kein `getAnimations().finished`: `ru-fach-winke` am Hinweispfeil läuft
   `infinite` und löste nie auf. */
const sicht = JSON.parse(await s.evaluate(`(async () => {
  const kinder = Store.childrenOf(${JSON.stringify(bestand.fach)})
    .filter(b => b.alive !== false && b.type === 'page')
    .map(b => ({ id: b.id, name: b.text, art: 'Seite' }));
  const lage = document.createElement('div');
  lage.style.cssText = 'position:fixed;left:40px;top:40px;z-index:5000';
  document.body.append(lage);
  const g = Ordnerkarte.bauen({ name: 'Elektrotechnik', kinder, beiWahl: () => {} });
  lage.append(g.element); g.klappen(true);
  await new Promise(r => setTimeout(r, 700));
  const treffer = [...g.element.querySelectorAll('.ru-fach-blatt')].map((b, i) => {
    const t = b.querySelector('.ru-fach-text');
    const r = t.getBoundingClientRect();
    const oben = document.elementFromPoint(Math.round(r.left + 6), Math.round(r.top + r.height / 2));
    return { nr: i, breit: Math.round(r.width), hoch: Math.round(r.height),
      frei: !!oben && b.contains(oben),
      davor: oben ? (oben.className || oben.tagName) : 'nichts' };
  });
  const suche = g.element.querySelector('.ru-fach-eingabe').getBoundingClientRect();
  const sOben = document.elementFromPoint(Math.round(suche.left + 20), Math.round(suche.top + suche.height / 2));
  const zaehler = g.element.querySelector('.ru-fach-zaehler').getBoundingClientRect();
  const zOben = document.elementFromPoint(Math.round(zaehler.left + 8), Math.round(zaehler.top + zaehler.height / 2));
  const karte = g.element.getBoundingClientRect();
  const wer = (e) => e ? (e.className || e.tagName) : 'nichts';
  lage.remove();
  return JSON.stringify({ treffer,
    sucheFrei: !!sOben && sOben.classList.contains('ru-fach-eingabe'),
    sucheDavor: wer(sOben), sucheBreit: Math.round(suche.width),
    zaehlerFrei: !!zOben && g.element.querySelector('.ru-fach-zaehler').contains(zOben),
    zaehlerDavor: wer(zOben), zaehlerBreit: Math.round(zaehler.width),
    hoch: Math.round(karte.height) });
})()`) as string);
for (const t of sicht.treffer as Array<Record<string, unknown>>)
  p(`Zeile ${Number(t['nr']) + 1} steht frei im Bild`, t['frei'], 'davor liegt ' + String(t['davor']));
p('Jede Zeile hat auch Breite', (sicht.treffer as Array<Record<string, number>>).every(t => t['breit']! > 40));
/* MIT `extra`, NICHT OHNE. Diese zwei Punkte waren die einzigen im Abschnitt
   ohne Meldungstext — sie sagten „verdeckt" und verschwiegen, wovon. Der
   Fund vom 19. September hat deshalb zwei Stunden gekostet, die eine Zeile
   gespart hätte. */
p('Die Suchzeile ist nicht von den Blättern verdeckt', sicht.sucheFrei,
  'davor liegt ' + String(sicht.sucheDavor) + ', breit ' + String(sicht.sucheBreit));
p('Der Zähler auch nicht', sicht.zaehlerFrei,
  'davor liegt ' + String(sicht.zaehlerDavor) + ', breit ' + String(sicht.zaehlerBreit));
p('Die Karte bleibt kleiner als ein halber Bildschirm', sicht.hoch < 450, String(sicht.hoch));

console.log('\n§3 Die Suche geht tiefer als die des Regals');
const suche = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const f = ${JSON.stringify(bestand)};
  const kinder = Store.childrenOf(f.fach).filter(b => b.alive !== false && b.type === 'page')
    .map(b => ({ id: b.id, name: b.text, art: 'Seite' }));
  const tiefe = kinder.concat(Store.childrenOf(f.unter)
    .filter(b => b.alive !== false && b.type === 'page')
    .map(b => ({ id: b.id, name: b.text, art: 'Seite', weg: 'Laborberichte' })));
  const g = Ordnerkarte.bauen({ name: 'Elektrotechnik', kinder, tiefe, beiWahl: () => {} });
  document.body.append(g.element); g.klappen(true);
  const feld = g.element.querySelector('.ru-fach-eingabe');
  feld.value = 'Widerstand';
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  const treffer = [...g.element.querySelectorAll('.ru-fach-blatt')]
    .map(b => b.querySelector('.ru-fach-text').textContent);
  const wort = g.element.querySelector('.ru-fach-wort').textContent;
  const punkt = getComputedStyle(g.element.querySelector('.ru-fach-punkt'), '::after').animationName;
  feld.value = 'gibtesnicht';
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  const leer = g.element.querySelector('.ru-fach-rest').textContent;
  feld.value = '';
  feld.dispatchEvent(new Event('input', { bubbles: true }));
  const zurueck = g.element.querySelectorAll('.ru-fach-blatt').length;
  const stillerPunkt = getComputedStyle(g.element.querySelector('.ru-fach-punkt'), '::after').animationName;
  g.entfernen();
  return { treffer, wort, punkt, leer, zurueck, stillerPunkt };
})())`) as string);
p('Ein Enkel zwei Ebenen tiefer wird gefunden',
  (suche.treffer as string[]).some(t => t.includes('Versuch 3')), JSON.stringify(suche.treffer));
p('… mit seinem Weg dahinter', (suche.treffer as string[]).some(t => t.includes('Laborberichte')));
p('Das Wort sagt jetzt „Treffer von 8", nicht „Sachen"',
  /Treffer von 8/.test(suche.wort), suche.wort);
p('Der Punkt schlägt nur, während gesucht wird', suche.punkt !== 'none' && suche.stillerPunkt === 'none',
  suche.punkt + ' / ' + suche.stillerPunkt);
p('Kein Treffer sagt es im Klartext', /Kein Treffer/.test(suche.leer), suche.leer);
p('Ein geleertes Feld zeigt wieder alle fünf', suche.zurueck === 5, String(suche.zurueck));

console.log('\n§4 Am echten Regal');
await s.evaluate('Bibliothek.oeffne()');
await s.waitForTimeout(700);
const menue = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const deckel = [...document.querySelectorAll('.bib-deckel')];
  const ordner = deckel.find(d => d.dataset.art === 'ordner');
  const seite = deckel.find(d => d.dataset.art !== 'ordner');
  ordner.parentElement.querySelector(':scope > .bib-deckel-mehr').click();
  const beiOrdner = !!document.querySelector('.menu [data-a="blick"]');
  document.querySelector('.menu')?.remove();
  seite.parentElement.querySelector(':scope > .bib-deckel-mehr').click();
  const beiSeite = !!document.querySelector('.menu [data-a="blick"]');
  document.querySelector('.menu')?.remove();
  return { beiOrdner, beiSeite, name: ordner.textContent.slice(0, 20) };
})())`) as string);
p('„Blick hinein" steht im Menü eines Ordners', menue.beiOrdner);
p('… und NICHT bei einer gewöhnlichen Seite', menue.beiSeite === false);

await s.evaluate(`(() => {
  const ordner = [...document.querySelectorAll('.bib-deckel')].find(d => d.dataset.art === 'ordner');
  ordner.parentElement.querySelector(':scope > .bib-deckel-mehr').click();
  document.querySelector('.menu [data-a="blick"]').click();
})()`);
await s.waitForSelector('.ru-fach-lage .ru-fach', { timeout: 8000 });
const amRegal = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const karte = document.querySelector('.ru-fach-lage .ru-fach');
  const r = karte.getBoundingClientRect();
  return { offen: karte.dataset.offen, zahl: karte.querySelector('.ru-fach-zahl').textContent,
    imBild: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
    fokus: document.activeElement.className,
    gehen: !!karte.querySelector('.ru-fach-gehen') };
})())`) as string);
p('Die Karte steht offen da', amRegal.offen === 'ja');
p('… mit der echten Zahl des Ordners', amRegal.zahl === '7', amRegal.zahl);
p('… vollständig im Bild', amRegal.imBild, JSON.stringify(amRegal));
p('… und der Fokus sitzt darin', /ru-fach-griff/.test(amRegal.fokus), amRegal.fokus);
p('„Ordner öffnen" ist da — der alte Weg bleibt', amRegal.gehen);

/* EIN BLATT, DAS EINE SEITE IST — nicht das erste beste: „Laborberichte"
   ist ein Unterordner, und der GEHT HINEIN statt zu öffnen (E380). Der
   erste Wurf klickte ihn und suchte danach vergeblich einen Seitentitel. */
const gewaehlt = await s.evaluate(`(() => {
  const blatt = [...document.querySelectorAll('.ru-fach-blatt')]
    .find(b => b.querySelector('.ru-fach-art').textContent !== 'Ordner' &&
               !/^\\d+ Sach/.test(b.querySelector('.ru-fach-art').textContent));
  const name = blatt.querySelector('.ru-fach-text').textContent;
  blatt.click();
  return name;
})()`) as string;
await s.waitForTimeout(600);
const nachWahl = JSON.parse(await s.evaluate(`JSON.stringify({
  karteWeg: !document.querySelector('.ru-fach-lage'),
  titel: document.getElementById('title') ? document.getElementById('title').textContent : ''
})`) as string);
p('Ein Blatt öffnet die echte Seite und schliesst die Karte', nachWahl.karteWeg);
p('… und genau die gewählte Seite steht offen',
  String(nachWahl.titel).startsWith(String(gewaehlt).replace(/…$/, '')),
  JSON.stringify(gewaehlt) + ' → ' + JSON.stringify(nachWahl.titel));

/* ZURÜCK AN DIE WURZEL. Ohne das steht die Bibliothek noch in dem Ordner,
   in den der Klick oben geführt hat — und dort gibt es keinen Ordnerdeckel
   mehr, an dem das Menü hinge. */
await s.evaluate("Store.setMeta('bibOrdner', ''); Bibliothek.oeffne()");
await s.waitForTimeout(600);
const escape = JSON.parse(await s.evaluate(`(async () => {
  const ordner = [...document.querySelectorAll('.bib-deckel')].find(d => d.dataset.art === 'ordner');
  ordner.parentElement.querySelector(':scope > .bib-deckel-mehr').click();
  document.querySelector('.menu [data-a="blick"]').click();
  await new Promise(r => setTimeout(r, 200));
  const da = !!document.querySelector('.ru-fach-lage');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 200));
  return JSON.stringify({ da, weg: !document.querySelector('.ru-fach-lage') });
})()`) as string);
p('Escape schliesst die Karte', escape.da && escape.weg);

console.log('\n§5 Ohne Bewegung');
const ruhig = await oeffne(1280, 900, true);
await ruhig.evaluate(BESTAND);
const still = JSON.parse(await ruhig.evaluate(`JSON.stringify((() => {
  const kinder = [1,2,3,4,5,6].map(i => ({ id: 'x' + i, name: 'Stück ' + i, art: 'Seite' }));
  const g = Ordnerkarte.bauen({ name: 'Probe', kinder, beiWahl: () => {} });
  document.body.append(g.element); g.klappen(true);
  const blatt = g.element.querySelector('.ru-fach-blatt');
  const st = getComputedStyle(blatt);
  const klappe = getComputedStyle(g.element.querySelector('.ru-fach-klappe'));
  const treffer = [...g.element.querySelectorAll('.ru-fach-blatt')].every(b => {
    const t = b.querySelector('.ru-fach-text').getBoundingClientRect();
    const oben = document.elementFromPoint(Math.round(t.left + 6), Math.round(t.top + t.height / 2));
    return !!oben && b.contains(oben);
  });
  g.entfernen();
  return { blattUebergang: st.transitionDuration, klappeUebergang: klappe.transitionDuration,
    gefaechert: st.transform !== 'none', treffer,
    reduziert: matchMedia('(prefers-reduced-motion: reduce)').matches };
})())`) as string);
p('Die Seite weiss, dass keine Bewegung gewünscht ist', still.reduziert);
/* GEMESSEN, NICHT AUF EIN WORT GEPRÜFT. `grund.css` kürzt bei reduced
   motion jede Dauer auf .001 s statt sie zu streichen — eine Prüfung auf
   „0s" wäre rot, obwohl nichts mehr gleitet. Was zählt, ist: unter einer
   Zwanzigstelsekunde sieht niemand eine Bewegung. */
const sekunden = (wert: string): number =>
  Math.max(...String(wert).split(',').map(t => parseFloat(t) || 0));
p('Die Blätter gleiten nicht', sekunden(still.blattUebergang) < 0.05, still.blattUebergang);
p('Die Klappe auch nicht', sekunden(still.klappeUebergang) < 0.05, still.klappeUebergang);
p('… stehen aber trotzdem aufgefächert', still.gefaechert);
p('… und jede Zeile bleibt lesbar', still.treffer);
await ruhig.close();

console.log('\n§6 Eingebunden');
p('index.html lädt ordnerkarte.js', /quell\/schale\/bedienung\/ordnerkarte\.js/.test(lies('index.html')));
p('Der GRUNDSTOCK kennt es (§28)', /\.\/quell\/schale\/bedienung\/ordnerkarte\.js/.test(lies('src/dienst/sw.ts')));
p('Die Quelle ist TypeScript, das .js ist erzeugt',
  fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/ordnerkarte.ts')) &&
  /ERZEUGT/.test(lies('quell/schale/bedienung/ordnerkarte.js')));
p('Die Vorgabe liegt unverändert im Archiv',
  /Note: all animations will works when you click not hover/.test(
    lies('quell/entwicklung/ui-reserve/vorgaben/folder-card.css')));

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
