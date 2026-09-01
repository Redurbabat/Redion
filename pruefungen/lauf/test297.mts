/* Suite 297 — Der freie Wiederholungsplaner (E303, FSRS 4.5)
 * ============================================================================
 * Redurs Punkt 8: „FSRS additiv." Redion plant Karteikarten bis heute mit
 * SM-2 — zwei Zahlen je Karte, ein Abstand und eine „Leichtigkeit". Das
 * Verfahren weiss nicht, wie wahrscheinlich man eine Karte gerade noch kann;
 * es schreibt einen Abstand fort.
 *
 * FSRS führt Stabilität und Schwierigkeit und rechnet daraus die
 * Abrufbarkeit. Der Kern liegt in `src/core/learning/fsrs.ts` und kennt weder
 * Uhr noch Ablage — deshalb läuft dieser Prüflauf OHNE Browser, in
 * Millisekunden, und deshalb lässt sich ein Verfahren, das über Monate wirkt,
 * überhaupt prüfen.
 *
 *   §1 DIE DEFINITION: nach S Tagen steht die Abrufbarkeit auf 0,9.
 *   §2 DIE KURVE fällt, und zwar immer.
 *   §3 DIE NOTEN stehen in der richtigen Reihenfolge.
 *   §4 EIN FEHLER SCHIEBT KEINEN TERMIN NACH HINTEN.
 *   §5 ÜBER ZWEIHUNDERT ANTWORTEN bleibt alles in seinen Grenzen.
 *   §6 DER ÜBERGANG aus SM-2 trifft die zwei bekannten Punkte.
 *   §7 DER KERN HAT KEINE UHR — sonst wäre er nicht prüfbar.
 *
 *   node pruefungen/lauf/test297.mts
 * ==========================================================================*/
declare const Learning: any;
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const nahe = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

/* Der Kern wird als gewöhnliches Skript geladen — er hängt sich an
   `globalThis`, genau wie im Browser. Kein Bündler, kein Import-Umweg. */
const quelle = fs.readFileSync(
  path.join(WURZEL, 'quell/core/learning/fsrs.js'), 'utf-8');
(0, eval)(quelle);
const F = (globalThis as any).Fsrs;

console.log('\n1 · Die Definition: nach S Tagen steht R auf 0,9');
p('Der Kern ist geladen', !!F && typeof F.abrufbarkeit === 'function');
for (const s of [1, 5, 30, 365]) {
  p(`Bei S=${s} und t=${s} ist R genau 0,9`,
    nahe(F.abrufbarkeit(s, s), 0.9, 1e-9), String(F.abrufbarkeit(s, s)));
}
p('Bei t=0 ist R genau 1', nahe(F.abrufbarkeit(0, 10), 1, 1e-12));
for (const s of [1, 5, 30, 365])
  p(`Und der Abstand zu 0,9 ist wieder S=${s}`,
    nahe(F.abstand(s, 0.9), s, 1e-9), String(F.abstand(s, 0.9)));

console.log('\n2 · Die Kurve fällt, und zwar immer');
let vorher = 1.1, faellt = true;
for (let t = 0; t <= 400; t += 1) {
  const r = F.abrufbarkeit(t, 20);
  if (r > vorher) faellt = false;
  vorher = r;
}
p('R fällt über 400 Tage monoton', faellt);
p('Und bleibt zwischen 0 und 1',
  F.abrufbarkeit(3650, 20) > 0 && F.abrufbarkeit(3650, 20) < 0.2,
  String(F.abrufbarkeit(3650, 20)));
/* Wer weniger Sicherheit will, wartet länger — das ist der ganze Sinn eines
   Ziels. */
p('Ein niedrigeres Ziel gibt einen längeren Abstand',
  F.abstand(20, 0.8) > F.abstand(20, 0.9) && F.abstand(20, 0.9) > F.abstand(20, 0.95),
  `${F.abstand(20, 0.8)} > ${F.abstand(20, 0.9)} > ${F.abstand(20, 0.95)}`);

console.log('\n3 · Die Noten stehen in der richtigen Reihenfolge');
const ersteS = [1, 2, 3, 4].map(n => F.ersterStand(n).stabilitaet);
p('Erste Antwort: leicht hält länger als gut als schwer als nochmal',
  ersteS[0]! < ersteS[1]! && ersteS[1]! < ersteS[2]! && ersteS[2]! < ersteS[3]!,
  JSON.stringify(ersteS));
const ersteD = [1, 2, 3, 4].map(n => F.ersterStand(n).schwierigkeit);
p('Und leicht ist die kleinste Schwierigkeit',
  ersteD[0]! > ersteD[1]! && ersteD[1]! > ersteD[2]! && ersteD[2]! > ersteD[3]!,
  JSON.stringify(ersteD.map((x: number) => x.toFixed(2))));

const stand = { stabilitaet: 20, schwierigkeit: 5 };
const nach = [2, 3, 4].map(n => F.antworten(stand, n, 20).abstandTage);
p('Nach 20 Tagen: leicht gibt mehr Abstand als gut als schwer',
  nach[0]! < nach[1]! && nach[1]! < nach[2]!,
  JSON.stringify(nach.map((x: number) => Math.round(x))));
p('Und alle drei sind länger als die 20 Tage davor',
  nach.every((x: number) => x > 20), JSON.stringify(nach.map((x: number) => Math.round(x))));

console.log('\n4 · Ein Fehler schiebt keinen Termin nach hinten');
const fehler = F.antworten(stand, 1, 20);
p('Nach einem Fehler ist die Stabilität kleiner als vorher',
  fehler.stand.stabilitaet < stand.stabilitaet,
  `${fehler.stand.stabilitaet} vs ${stand.stabilitaet}`);
p('Aber nicht null — was einmal sass, sitzt schneller wieder',
  fehler.stand.stabilitaet > 0, String(fehler.stand.stabilitaet));
p('Und der Abstand wird kürzer', fehler.abstandTage < 20,
  String(Math.round(fehler.abstandTage)));
p('Der Fehler wird auch so gemeldet', fehler.fehler === true);
/* GEGENPROBE: eine gekonnte Antwort meldet KEINEN Fehler. Ohne diesen Arm
   wäre `fehler: true` auch dann grün, wenn es immer true wäre (§55.2). */
p('GEGENPROBE: „gut" meldet keinen Fehler',
  F.antworten(stand, 3, 20).fehler === false);

console.log('\n5 · Über zweihundert Antworten bleibt alles in seinen Grenzen');
/* Eine feste Folge, keine Zufallszahlen: der Kern soll bei gleichen Eingaben
   dasselbe liefern, und ein Prüflauf, der bei jedem Durchgang andere Zahlen
   nimmt, kann das nicht behaupten. */
let s2: any = null;
let kleinste = 999, groesste = 0, kleinsteD = 99, groessteD = 0, negativ = false;
for (let i = 0; i < 200; i++) {
  const note = ([3, 3, 4, 2, 3, 1, 3, 2, 4, 3][i % 10] ?? 3) as 1 | 2 | 3 | 4;
  const erg = F.antworten(s2, note, s2 ? Math.max(1, Math.round(F.abstand(s2.stabilitaet))) : 0);
  s2 = erg.stand;
  if (!(s2.stabilitaet > 0)) negativ = true;
  kleinste = Math.min(kleinste, s2.stabilitaet); groesste = Math.max(groesste, s2.stabilitaet);
  kleinsteD = Math.min(kleinsteD, s2.schwierigkeit); groessteD = Math.max(groessteD, s2.schwierigkeit);
}
p('Die Stabilität bleibt positiv', !negativ && kleinste > 0, String(kleinste));
p('Die Schwierigkeit bleibt zwischen 1 und 10',
  kleinsteD >= 1 && groessteD <= 10, `${kleinsteD.toFixed(2)} … ${groessteD.toFixed(2)}`);
p('Und die Stabilität wächst über die Folge wirklich',
  groesste > 30, String(Math.round(groesste)));
/* Zweimal dieselbe Rechnung gibt dasselbe Ergebnis — sonst steckt irgendwo
   eine Uhr oder ein Zufall. */
const a1 = F.antworten({ stabilitaet: 7, schwierigkeit: 4 }, 3, 9);
const a2 = F.antworten({ stabilitaet: 7, schwierigkeit: 4 }, 3, 9);
p('Dieselbe Eingabe gibt dasselbe Ergebnis',
  JSON.stringify(a1) === JSON.stringify(a2));

console.log('\n6 · Der Übergang aus SM-2 trifft die zwei bekannten Punkte');
p('ease 2,5 (SM-2s Vorgabe) wird zur Mitte 5',
  nahe(F.ausSm2(10, 2.5).schwierigkeit, 5, 1e-9),
  String(F.ausSm2(10, 2.5).schwierigkeit));
p('ease 1,3 (SM-2s Anschlag) wird zur 10',
  nahe(F.ausSm2(10, 1.3).schwierigkeit, 10, 1e-9),
  String(F.ausSm2(10, 1.3).schwierigkeit));
p('Der letzte Abstand wird die erste Stabilität',
  F.ausSm2(37, 2.5).stabilitaet === 37);
p('Und alles bleibt in den Grenzen',
  F.ausSm2(1, 5).schwierigkeit >= 1 && F.ausSm2(1, 0).schwierigkeit <= 10,
  `${F.ausSm2(1, 5).schwierigkeit} / ${F.ausSm2(1, 0).schwierigkeit}`);

console.log('\n7 · Der Kern hat keine Uhr');
const roh = fs.readFileSync(path.join(WURZEL, 'src/core/learning/fsrs.ts'), 'utf-8');
const codeOhneKommentar = roh
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/.*$/gm, '');
for (const verboten of ['Date', 'Math.random', 'Store', 'document', 'window'])
  p(`Kein \`${verboten}\` im Kern`, !codeOhneKommentar.includes(verboten));
/* GEGENPROBE: der Leser findet etwas, das WIRKLICH dasteht — sonst wäre die
   Zeile oben auch grün, wenn sie am leeren String suchte. */
p('GEGENPROBE: der Leser findet, was dasteht',
  codeOhneKommentar.includes('abrufbarkeit') && codeOhneKommentar.includes('Math.exp'));

/* ==========================================================================
 * §8 · Der Anschluss: SM-2 bleibt die Vorgabe
 * --------------------------------------------------------------------------
 * Der Kern allein plant nichts. Geprüft wird deshalb `WissenDienst.planen`
 * mit einem kleinen Ablage-Ersatz — die Datei sagt in ihrem eigenen Kopf,
 * dass sie „als reine Logik auch mit einem kleinen Store-Adapter prüfbar"
 * bleibt, und genau das wird hier ausgenutzt.
 * ========================================================================*/
console.log('\n8 · Der Anschluss: SM-2 bleibt die Vorgabe');

const meta: Record<string, any> = {};
const geschrieben: Record<string, any> = {};
(globalThis as any).Store = {
  getMeta: (k: string, v: any) => (k in meta ? meta[k] : v),
  setMeta: (k: string, v: any) => { meta[k] = v; },
  updateBlock: (id: string, felder: any) => {
    geschrieben[id] = { ...(geschrieben[id] || {}), ...felder };
  },
  now: () => new Date().toISOString(),
  uid: (() => { let n = 0; return () => 'r' + (++n); })()
};
/* Der Dienst hängt sich an `window`, wenn es eines gibt — genau diesen Weg
   nimmt er auch im Browser. Ein leeres Objekt genügt ihm; er liest beim
   Laden nichts daraus. */
(globalThis as any).window = {};
const dienstQuelle = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/wissen/dienst.js'), 'utf-8');
(0, eval)(dienstQuelle);
const D = (globalThis as any).window.WissenDienst;
p('Der Dienst ist geladen', !!D && typeof D.planen === 'function');

/* Ohne Einstellung: SM-2. Die Karte ist neu, „gut" gibt bei SM-2 genau
   einen Tag — das ist die Zahl, an der man die zwei Verfahren unterscheidet. */
const sm2 = { sr: D.planen({ id: 'k1' }, 3),
              reviewVerlauf: geschrieben['k1'].reviewVerlauf };
p('Ohne Einstellung plant SM-2', sm2.sr.intervall === 1, String(sm2.sr.intervall));
p('Und schreibt es auch so ins Protokoll',
  Object.values<any>(sm2.reviewVerlauf)[0]?.algorithm === 'sm2',
  JSON.stringify(Object.values<any>(sm2.reviewVerlauf)[0]?.algorithm));

meta['lernVerfahren'] = 'fsrs';
const neu1 = { sr: D.planen({ id: 'k2' }, 3),
               reviewVerlauf: geschrieben['k2'].reviewVerlauf };
p('Umgestellt plant FSRS — und anders als SM-2',
  neu1.sr.intervall !== 1 && neu1.sr.intervall >= 1, String(neu1.sr.intervall));
p('Die Karte führt jetzt Stabilität und Schwierigkeit',
  Number(neu1.sr.fsrs?.stabilitaet) > 0 && Number(neu1.sr.fsrs?.schwierigkeit) >= 1,
  JSON.stringify(neu1.sr.fsrs));
const e1 = Object.values<any>(neu1.reviewVerlauf)[0];
p('Und das Protokoll nennt das Verfahren', e1?.algorithm === 'fsrs');
p('Eine frische Karte ist KEIN Übergang', e1?.uebergang === undefined,
  JSON.stringify(e1?.uebergang));

/* Und der Übergang aus einer SM-2-Vergangenheit wird als solcher vermerkt. */
const alt2 = { sr: D.planen({ id: 'k3', sr: { ease: 2.5, intervall: 12, wdh: 4,
  zuletzt: new Date(Date.now() - 12 * 86400000).toISOString() } }, 3),
  reviewVerlauf: geschrieben['k3'].reviewVerlauf };
const e2 = Object.values<any>(alt2.reviewVerlauf).slice(-1)[0] as any;
p('DER ÜBERGANG STEHT IM PROTOKOLL', e2?.uebergang === true,
  JSON.stringify(e2?.uebergang));
p('Die geschätzte Stabilität kommt aus dem letzten Abstand',
  Number(alt2.sr.fsrs?.stabilitaet) > 12, String(alt2.sr.fsrs?.stabilitaet));
p('Und `ease` bleibt stehen — wer zurückschaltet, verliert nichts',
  alt2.sr.ease === 2.5, String(alt2.sr.ease));
/* GEGENPROBE: die zweite Antwort auf dieselbe Karte ist kein Übergang mehr. */
const alt3 = { sr: D.planen({ id: 'k3', sr: alt2.sr }, 3),
               reviewVerlauf: geschrieben['k3'].reviewVerlauf };
const e3 = Object.values<any>(alt3.reviewVerlauf).slice(-1)[0] as any;
p('GEGENPROBE: die zweite Antwort ist kein Übergang mehr',
  e3?.uebergang === undefined, JSON.stringify(e3?.uebergang));

meta['lernVerfahren'] = 'sm2';
const zurueck = { sr: D.planen({ id: 'k4' }, 3) };
p('Zurückgeschaltet plant wieder SM-2', zurueck.sr.intervall === 1,
  String(zurueck.sr.intervall));

/* UND DER BLOCK SAGT, WONACH ER LÄUFT. Diese Zeile stand fest auf `'sm2'`;
   eine Karte hätte nach FSRS geplant und am Block SM-2 behauptet. Gefunden
   hat es dieser Abschnitt, nicht das Schreiben. */
p('Der Block trägt bei SM-2 auch `sm2`', geschrieben['k1']?.lernAlgorithmus === 'sm2',
  JSON.stringify(geschrieben['k1']?.lernAlgorithmus));
p('Und bei FSRS auch `fsrs`', geschrieben['k2']?.lernAlgorithmus === 'fsrs',
  JSON.stringify(geschrieben['k2']?.lernAlgorithmus));

/* ==========================================================================
 * §9 · Der Schalter ist wirklich ein Schalter
 * --------------------------------------------------------------------------
 * §47: eine Auskunft ohne Griff ist eine Anzeige ohne Knopf. Hier stand bis
 * E303 ein Satz — „SM-2 bleibt der Standard, es findet keine automatische
 * FSRS-Migration statt" —, und das zweite Verfahren gab es gar nicht.
 *
 * Dieser Abschnitt braucht als einziger einen Browser, deshalb steht er am
 * Ende: wer nur den Kern prüfen will, hat sein Ergebnis vorher.
 * ========================================================================*/
console.log('\n9 · Der Schalter ist wirklich ein Schalter');

const { chromium } = await import('playwright');
const http = await import('node:http');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const PORT = 9097;
const server = http.createServer((a: any, b: any) => {
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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const seitenFehler: string[] = [];
seite.on('pageerror', (e: any) => seitenFehler.push(String(e.message).slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2800);
await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  Store.setMeta('lernVerfahren', 'sm2');
  const seiteK = Store.addPage(null, { text: 'Karten', icon: '🃏' });
  Store.addBlock(seiteK.id, 'flashcard', { text: 'Ohm', rueck: 'U = R · I' });
  await Store.flush();
  Learning.open();
  await new Promise(r => setTimeout(r, 900));
});
await seite.waitForTimeout(600);

const schalter = await seite.evaluate(() => {
  const kn = [...document.querySelectorAll<HTMLElement>('.lern-verfahren-knopf')];
  return { anzahl: kn.length, texte: kn.map(k => k.textContent || ''),
           an: kn.filter(k => k.classList.contains('on')).map(k => k.dataset.verfahren),
           hoch: kn.map(k => Math.round(k.getBoundingClientRect().height)),
           satz: (document.querySelector('.lern-verfahren p:last-of-type')?.textContent || '')
             .slice(0, 40) };
});
p('Es gibt zwei Knöpfe', schalter.anzahl === 2, JSON.stringify(schalter.texte));
p('Genau einer ist an, und es ist SM-2',
  JSON.stringify(schalter.an) === '["sm2"]', JSON.stringify(schalter.an));
p('Beide sind 44 px hoch (§37)', schalter.hoch.every(h => h >= 44),
  JSON.stringify(schalter.hoch));
p('Und ein Satz erklärt, was gerade gilt', /SM-2 ist das Verfahren/.test(schalter.satz),
  schalter.satz);

await seite.click('.lern-verfahren-knopf[data-verfahren="fsrs"]');
await seite.waitForTimeout(500);
const nachher2 = await seite.evaluate(() => ({
  gespeichert: Store.getMeta('lernVerfahren', 'sm2'),
  an: [...document.querySelectorAll<HTMLElement>('.lern-verfahren-knopf')]
    .filter(k => k.classList.contains('on')).map(k => k.dataset.verfahren),
  gedrueckt: [...document.querySelectorAll<HTMLElement>('.lern-verfahren-knopf')]
    .map(k => k.getAttribute('aria-pressed')),
  satz: (document.querySelector('.lern-verfahren p:last-of-type')?.textContent || '').slice(0, 30)
}));
p('Ein Klick stellt wirklich um', nachher2.gespeichert === 'fsrs', String(nachher2.gespeichert));
p('Der andere Knopf ist jetzt an', JSON.stringify(nachher2.an) === '["fsrs"]',
  JSON.stringify(nachher2.an));
p('Und ein Vorleseprogramm erfährt es auch (§38)',
  JSON.stringify(nachher2.gedrueckt) === '["false","true"]',
  JSON.stringify(nachher2.gedrueckt));
p('Der Satz wechselt mit', /FSRS rechnet/.test(nachher2.satz), nachher2.satz);
p('Keine Seitenfehler', seitenFehler.length === 0, seitenFehler.join(' | '));

await browser.close();
server.close();

console.log(`\n${ok} von ${ok + weg} — Suite 297 (E303: FSRS-Kern, Anschluss, Schalter)`);
process.exit(weg ? 1 : 0);
