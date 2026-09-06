/* Suite 431 — Die Drucker-Karte sagt nur, was gerade wahr ist (E458)
 * ============================================================================
 * Uiverse Nr. 28 „Printer Process Card" (spotift_5948) sagt im Original alle
 * 6,4 s „Done" — aus einem Zeitgeber. Die Redion-Fassung
 * (schale/bedienung/drucker.ts) setzt jeden Zustand an der Stelle im
 * Druckweg (werkzeuge.ts `drucken`), die ihn wahr macht.
 *
 *   §1 DAS BAUTEIL: `role="status"`, sechs Zustände mit je eigenem Satz und
 *      Zeichen; die Lampe wechselt die Farbe, aber nie allein (§38);
 *      Bewegung nur in `vorbereiten` und `rendern`.
 *   §2 OHNE BEWEGUNG: mit `prefers-reduced-motion` steht das Blatt, und
 *      der Satz sagt trotzdem, was läuft.
 *   §3 DER ECHTE DRUCKWEG: `Werkzeuge.drucken(p)` führt die Karte durch
 *      vorbereiten → rendern → speichern → fertig, danach ist sie weg;
 *      ein Fehler in der Ablage landet als Satz auf der Karte, nicht in
 *      der Konsole.
 *   §4 AM TELEFON: die Karte steht im Bild und nicht auf der Leiste.
 *   §5 DAS ARCHIV: Nr. 28 trägt nur das CSS als Original (Autor stimmt),
 *      keine erfundene original.html; die produktive Fassung benutzt keine
 *      der globalen Klassen des Originals.
 *   §6 EINGEBUNDEN: index.html und der GRUNDSTOCK kennen drucker.js (§28).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §3 → in werkzeuge.ts `karte?.setzen('rendern')` streichen: die Folge
 *        verliert ein Glied. Gelaufen am 6. September 2026, rot, wieder
 *        eingesetzt (Bericht zu E458).
 *
 *   node pruefungen/lauf/test431.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9551;

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

const AUFRAEUMEN = `(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt, #rg-willkommen, ' +
    '#rg-einladung, .produkt-onboarding-lage').forEach(x => x.remove());
  Store.setMeta('rundgangGesehen', true);
})()`;
const BEREIT = "typeof App !== 'undefined' && typeof Drucker !== 'undefined' " +
               "&& typeof Werkzeuge !== 'undefined' && typeof Zustand !== 'undefined'";

const browser = await chromium.launch();
const fehler: string[] = [];
const oeffne = async (weite: number, hoehe: number, ruhig = false) => {
  const s = await browser.newPage({ viewport: { width: weite, height: hoehe },
    ...(ruhig ? { reducedMotion: 'reduce' as const } : {}) });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('console', m => { if (m.type() === 'error') fehler.push('console: ' + m.text().slice(0, 140)); });
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(BEREIT, null, { timeout: 30000 });
  await s.waitForTimeout(600);
  await s.evaluate(AUFRAEUMEN);
  return s;
};

/* Was ein Zustand auf der Karte hinterlässt: Satz, Zeichen, Lampenfarbe,
   und ob sich das Blatt bewegt. */
const ABLESEN = `(karte) => {
  const st = getComputedStyle;
  return {
    zustand: karte.dataset.zustand,
    text: karte.querySelector('.ru-drucker-text').textContent,
    zeichen: karte.querySelector('.ru-drucker-zeichen').textContent,
    lampe: st(karte.querySelector('.ru-drucker-led')).backgroundColor,
    blatt: st(karte.querySelector('.ru-drucker-blattgruppe')).animationName,
    blattDeckung: st(karte.querySelector('.ru-drucker-blattgruppe')).opacity,
    tinte: st(karte.querySelector('.ru-drucker-tinte')).opacity,
    satzFarbe: st(karte.querySelector('.ru-drucker-status')).color,
    /* Zeilen = Rechtecke des Inline-Textes: ein Span über zwei Zeilen hat
       zwei. (Höhe durch Zeilenhöhe zählte das Polster mit: „Bereit" = 2.) */
    zeilen: karte.querySelector('.ru-drucker-text').getClientRects().length
  };
}`;

const s = await oeffne(1280, 900);

console.log('\n§1 Das Bauteil: Rolle, sechs Zustände, Farbe nie allein');
const bauteil = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const ablesen = ${ABLESEN};
  const g = Drucker.bauen();
  document.body.append(g.element);
  const rolle = g.element.getAttribute('role');
  const buehneVersteckt = g.element.querySelector('.ru-drucker-buehne').getAttribute('aria-hidden') === 'true';
  const zeichenVersteckt = g.element.querySelector('.ru-drucker-zeichen').getAttribute('aria-hidden') === 'true';
  const laende = {};
  for (const z of ['bereit', 'vorbereiten', 'rendern', 'speichern', 'fertig', 'fehler']) {
    g.setzen(z); laende[z] = ablesen(g.element);
  }
  g.setzen('fehler', 'Ablage antwortet nicht');
  const eigener = ablesen(g.element).text;
  g.setzen('unbekannt');
  const unbekannt = { zustand: g.zustand(), text: ablesen(g.element).text };
  g.entfernen();
  const wegGeraeumt = !document.body.contains(g.element);
  return { rolle, buehneVersteckt, zeichenVersteckt, laende, eigener, unbekannt, wegGeraeumt };
})())`) as string);
p('Die Karte ist eine Statuszeile (role="status")', bauteil.rolle === 'status');
p('Die Bühne ist Bild und für Vorleser unsichtbar', bauteil.buehneVersteckt);
p('Das Zeichen auch — der Text spricht', bauteil.zeichenVersteckt);
const L = bauteil.laende as Record<string, Record<string, string>>;
const texte = Object.values(L).map(l => l.text);
p('Sechs Zustände, sechs verschiedene Sätze', new Set(texte).size === 6, texte.join(' | '));
p('Jeder Zustand steht in data-zustand', Object.entries(L).every(([z, l]) => l.zustand === z));
p('„fertig" und „fehler" unterscheiden sich im Zeichen, nicht nur in der Farbe',
  L['fertig']!.zeichen !== L['fehler']!.zeichen && L['fertig']!.zeichen === '✓' && L['fehler']!.zeichen === '!',
  `${L['fertig']!.zeichen} / ${L['fehler']!.zeichen}`);
p('Die Lampe wechselt mit dem Zustand (bereit, rendern, fertig, fehler je anders)',
  new Set([L['bereit']!.lampe, L['rendern']!.lampe, L['fertig']!.lampe, L['fehler']!.lampe]).size === 4,
  [L['bereit']!.lampe, L['rendern']!.lampe, L['fertig']!.lampe, L['fehler']!.lampe].join(' / '));
p('… und der Satz wechselt die Farbe mit (fertig grün, fehler rot, nicht gleich)',
  L['fertig']!.satzFarbe !== L['fehler']!.satzFarbe && L['fertig']!.satzFarbe !== L['bereit']!.satzFarbe);
p('Das Blatt bewegt sich beim Vorbereiten', L['vorbereiten']!.blatt !== 'none', L['vorbereiten']!.blatt);
p('… und beim Setzen der Seiten', L['rendern']!.blatt !== 'none', L['rendern']!.blatt);
p('… aber nicht, solange der Dialog offen ist', L['speichern']!.blatt === 'none', L['speichern']!.blatt);
p('… und nicht bei fertig, fehler, bereit',
  ['fertig', 'fehler', 'bereit'].every(z => L[z]!.blatt === 'none'));
p('Bereit: kein Blatt zu sehen', L['bereit']!.blattDeckung === '0');
p('Fertig: das Blatt liegt bedruckt da', L['fertig']!.tinte === '1' && L['fertig']!.blattDeckung === '1');
p('Fehler: das Blatt steckt, ohne Druck', L['fehler']!.tinte === '0');
p('Ein eigener Satz ersetzt den Standardsatz', bauteil.eigener === 'Ablage antwortet nicht');
p('Ein unbekanntes Wort wird zu „fehler" mit dem Wort als Satz',
  bauteil.unbekannt.zustand === 'fehler' && bauteil.unbekannt.text === 'unbekannt');
p('entfernen() räumt die Karte weg', bauteil.wegGeraeumt);
p('Jeder Standardsatz steht in EINER Zeile (auf dem ersten Bild brach er um)',
  Object.values(L).every(l => Number(l.zeilen) === 1),
  Object.entries(L).map(([z, l]) => z + ':' + l.zeilen).join(' '));

console.log('\n§2 Ohne Bewegung');
const ruhig = await oeffne(1280, 900, true);
const still = JSON.parse(await ruhig.evaluate(`JSON.stringify((() => {
  const ablesen = ${ABLESEN};
  const g = Drucker.bauen(); document.body.append(g.element);
  g.setzen('rendern'); const r = ablesen(g.element);
  g.setzen('vorbereiten'); const v = ablesen(g.element);
  g.entfernen();
  return { r, v, reduziert: matchMedia('(prefers-reduced-motion: reduce)').matches };
})())`) as string);
p('Die Seite weiss, dass keine Bewegung gewünscht ist', still.reduziert);
p('Beim Setzen steht das Blatt still', still.r.blatt === 'none', still.r.blatt);
p('… bedruckt, damit man sieht, wo es steht', still.r.tinte === '1');
p('… und der Satz sagt trotzdem, was läuft', /setzen/.test(still.r.text), still.r.text);
p('Beim Vorbereiten steht es auch still', still.v.blatt === 'none' && /sammeln/.test(still.v.text));
await ruhig.close();

console.log('\n§3 Der echte Druckweg');
const lauf = JSON.parse(await s.evaluate(`(async () => {
  const seite = Store.addPage(null, { text: 'Druckprobe' });
  Store.addBlock(seite.id, 'text', { text: 'Spannung, Strom und Widerstand' });
  /* EIN BEOBACHTER LIEST NICHT DEN NEUEN WERT. Die Sätze kommen gesammelt,
     nachdem print() zurück ist — wer dann dataset.zustand liest, liest
     zweimal „fertig" und nie „speichern" (so war der erste Wurf rot). Der
     ALTE Wert steht im Satz selbst; die Folge ist also alle alten Werte
     und zum Schluss der, der jetzt dasteht. */
  const folge = [];
  const beobachter = new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'childList') {
      m.addedNodes.forEach(n => { if (n.classList && n.classList.contains('ru-drucker')) folge.push('da'); });
      return;
    }
    if (m.target.classList && m.target.classList.contains('ru-drucker')) folge.push(m.oldValue);
  }));
  beobachter.observe(document.body, { childList: true, subtree: true,
    attributes: true, attributeOldValue: true, attributeFilter: ['data-zustand'] });
  await Werkzeuge.drucken(seite);
  await new Promise(r => setTimeout(r, 500));
  const schwebt = document.querySelector('.ru-drucker.ru-drucker-schwebt');
  const nochDa = !!schwebt;
  const zuletzt = schwebt ? schwebt.dataset.zustand : null;
  if (zuletzt) folge.push(zuletzt);
  const rolle = schwebt ? schwebt.getAttribute('role') : null;
  await new Promise(r => setTimeout(r, 2700));
  const wegNachher = !document.querySelector('.ru-drucker');
  beobachter.disconnect();
  /* Der Fehlerweg: die Ablage antwortet nicht. Kein Stellvertreter für die
     App — die echte Funktion wird für einen Aufruf kaputtgemacht und
     danach zurückgesetzt. */
  const echt = Store.childrenOf;
  Store.childrenOf = () => { throw new Error('Ablage antwortet nicht'); };
  let geflogen = false;
  try { await Werkzeuge.drucken(seite); } catch (e) { geflogen = true; }
  Store.childrenOf = echt;
  const k = document.querySelector('.ru-drucker.ru-drucker-schwebt');
  const fehlerKarte = k ? { zustand: k.dataset.zustand, text: k.querySelector('.ru-drucker-text').textContent } : null;
  if (k) k.remove();
  return JSON.stringify({ folge, nochDa, zuletzt, rolle, wegNachher, geflogen, fehlerKarte });
})()`) as string);
const schritte = (lauf.folge as string[]).filter(f => f !== 'da');
p('Die Karte erscheint', lauf.folge[0] === 'da', JSON.stringify(lauf.folge));
p('Dann bereit → vorbereiten → rendern → speichern → fertig, in dieser Reihenfolge',
  JSON.stringify(schritte) === JSON.stringify(['bereit', 'vorbereiten', 'rendern', 'speichern', 'fertig']),
  JSON.stringify(schritte));
p('Nach dem Dialog steht sie auf „fertig"', lauf.nochDa && lauf.zuletzt === 'fertig', String(lauf.zuletzt));
p('… als Statuszeile', lauf.rolle === 'status');
p('Und nach zweieinhalb Sekunden ist sie weg', lauf.wegNachher);
p('Ein Fehler in der Ablage fliegt nicht mehr aus drucken() heraus', lauf.geflogen === false);
p('… sondern steht als Satz auf der Karte',
  lauf.fehlerKarte?.zustand === 'fehler' && lauf.fehlerKarte?.text === 'Ablage antwortet nicht',
  JSON.stringify(lauf.fehlerKarte));

console.log('\n§4 Am Telefon');
const handy = await oeffne(390, 844);
const lage = JSON.parse(await handy.evaluate(`JSON.stringify((() => {
  const g = Drucker.zeigen(); g.setzen('rendern');
  const r = g.element.getBoundingClientRect();
  /* NUR DIE LEISTEN, nicht [data-studio-nav]: das Attribut traegt der
     body, und der ueberlappt alles — so war der erste Wurf rot, ohne dass
     die Karte irgendwo drauflag (nachgemessen: Karte bis 763, Leiste ab 785). */
  const leisten = [...document.querySelectorAll('#handy-oben, #handy-unten, #topbar')]
    .map(e => e.getBoundingClientRect()).filter(b => b.width > 0 && b.height > 0);
  const ueberlappt = leisten.some(b => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
  g.entfernen();
  return { rechts: r.right <= innerWidth, unten: r.bottom <= innerHeight, breite: Math.round(r.width),
    hoehe: Math.round(r.height), leisten: leisten.length, ueberlappt };
})())`) as string);
p('Die Karte steht im Bild', lage.rechts && lage.unten, JSON.stringify(lage));
p('… und nicht auf einer Leiste', !lage.ueberlappt, `${lage.leisten} Leisten gemessen`);
p('… mit den Massen des Originals (190 breit)', lage.breite === 190, String(lage.breite));
await handy.close();

console.log('\n§5 Das Archiv');
const katalog = JSON.parse(lies('quell/entwicklung/ui-reserve/katalog.json')) as Array<Record<string, unknown>>;
const nr28 = katalog.find(e => e['nr'] === 28);
p('Nr. 28 ist als Gesprächsschnipsel eingetragen', nr28?.['quelleStatus'] === 'chat-original-snippet');
const originalPfad = String(nr28?.['original'] ?? '');
p('… und zeigt auf original.css, nicht auf eine html', /original\.css$/.test(originalPfad), originalPfad);
const ordner = 'quell/entwicklung/ui-reserve/komponenten/28-printer-process-card/';
p('Es gibt keine erfundene original.html', !fs.existsSync(path.join(WURZEL, ordner, 'original.html')));
const original = lies(ordner + 'original.css');
p('Das Original nennt seinen Autor in der ersten Zeile', /^\/\* From Uiverse\.io by spotift_5948 \*\//.test(original));
p('… und ist unangetastet: Ready, Feeding, Printing, Ejecting, Done stehen als Keyframes darin',
  ['stReady', 'stFeeding', 'stPrinting', 'stEjecting', 'stDone'].every(k => original.includes('@keyframes ' + k)));
const bau = lies('quell/schale/stil/bausteine.css').replace(/\/\*[\s\S]*?\*\//g, '');
p('Die produktive Fassung trägt ihren Namensraum', /\.ru-drucker\{/.test(bau));
p('… und keine der globalen Klassen des Originals',
  !/(^|[\s,}])\.(card|scene|paper|printer|slot|panel|buttons|led|vents|tray|brand|status|st|ready|feeding|printing|ejecting|done|ink)[\s{,:.]/m.test(
    bau.slice(bau.indexOf('.ru-drucker{'), bau.indexOf('.ru-baum{'))));

console.log('\n§6 Eingebunden');
p('index.html lädt drucker.js', /quell\/schale\/bedienung\/drucker\.js/.test(lies('index.html')));
p('Der GRUNDSTOCK kennt es (§28)', /\.\/quell\/schale\/bedienung\/drucker\.js/.test(lies('src/dienst/sw.ts')));
p('Die Quelle ist TypeScript, das .js ist erzeugt',
  fs.existsSync(path.join(WURZEL, 'src/schale/bedienung/drucker.ts')) &&
  /ERZEUGT/.test(lies('quell/schale/bedienung/drucker.js')));

p('Keine Fehler auf den Seiten', fehler.length === 0, fehler.slice(0, 3).join(' | '));
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
