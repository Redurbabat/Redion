/* Suite 395 — Einzelseite oder Fortlaufend (E398, Audit F03 Rest)
 * ============================================================================
 * Der Prüfbericht vom 3. September, Befund F03 (P1), verlangte zweierlei:
 * eine WAHL zwischen „Einzelseite" und „Fortlaufend" — und Einzelseite als
 * VORGABE am Telefon.
 *
 * Redur hat am 4. September das Erste bestellt und das Zweite nicht. Der
 * Grund ist seine eigene Ansage aus E299: „die pdf seiten sollte wie
 * goodnotes sich ganz oeffnen komplet wie one note". Eine Vorgabe, die das
 * zurücknimmt, wäre eine Entscheidung gegen ihn.
 *
 * Dieser Lauf hält deshalb BEIDES fest — dass es die Wahl gibt, und dass sie
 * die Vorgabe nicht angefasst hat. §1 ist der Wächter für E299.
 *
 *   §1 Die Vorgabe ist Fortlaufend — am Telefon wie am Rechner.
 *   §2 Der Schalter steht im Inspector und schaltet wirklich um.
 *   §3 In der Einzelseite bleibt es bei EINER gezeichneten Seite, auch nach
 *      dem Rollen (sonst wäre E299 durch die Hintertür weg).
 *   §4 `‹ ›` wechselt die Seite, und die Rolle bleibt eine Seite hoch.
 *   §5 Bei einem einzigen Blatt gibt es den Schalter nicht.
 *   §6 Die Wahl überlebt das Neuladen, je Dokument — und hebt `edited` nicht.
 *   §7 E399 · Der Rollbalken lügt nicht mehr: der Platzhalter einer noch
 *      ungezeichneten Seite ist so hoch, wie die Seite werden wird.
 *
 *   node pruefungen/lauf/test395.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9423;

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
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* VIER BLÄTTER, keine drei: bei 390x844 sind zwei gleichzeitig im Bild, und
   erst ab vier ist sicher, dass „nur eine gezeichnet" auch etwas heisst. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Skript', icon: '📕' });
  for (let nr = 1; nr <= 4; nr++)
    Store.addBlock(s.id, 'pdfseite', { text: '', suchtext: 'Ohm', nr, vonSeiten: 4,
      bw: 595, bh: 842, quelleId: 'q' });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1600));
  return s.id;
})()`;

/* Was auf dem Bildschirm steht, nicht was im DOM liegt. `offsetHeight` ist
   0, sobald `display:none` gilt — genau das misst die Einzelseite. */
const LAGE = `(() => {
  const c = document.querySelector('.document-center');
  const st = Array.from(document.querySelectorAll('.document-stage'));
  return {
    einzeln: !!c && c.classList.contains('ist-einzeln'),
    buehnen: st.length,
    sichtbar: st.filter(e => e.offsetHeight > 0).length,
    gezeichnet: st.filter(e => !!e.querySelector('.blatt-huelle, .blk')).length,
    rollhoehe: c ? c.scrollHeight : 0,
    bildhoehe: c ? c.clientHeight : 0,
    schalter: document.querySelectorAll('[data-document-action="lauf"]').length,
    wort: (document.querySelector('[data-document-action="lauf"]') || {}).textContent || ''
  };
})()`;

const browser = await chromium.launch();
const fehler: string[] = [];

/* ==========================================================================
 * §1 · DIE VORGABE IST FORTLAUFEND — der Wächter für E299
 * --------------------------------------------------------------------------
 * Das ist der wichtigste Abschnitt dieses Laufs, und er hält NICHT den neuen
 * Bau fest, sondern den alten: dass ihn niemand angefasst hat. Wer eines
 * Tages `einzeln: true` als Grundstellung setzt oder eine Media Query für
 * schmale Fenster einzieht, fällt hier — und nicht erst, wenn Redur es
 * merkt.
 *
 * §55.2 — kann er rot werden? Ja, und zwar sofort: `einzeln: gemerkterLauf()`
 * auf `einzeln: true` gedreht, und beide Hälften fallen.
 * ======================================================================== */
console.log('\n1 · Die Vorgabe ist Fortlaufend — am Telefon wie am Rechner');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      isMobile: true, hasTouch: true });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2700);
await handy.evaluate(AUFBAU);
await handy.waitForSelector('.document-stage[data-aktiv]', { timeout: 20000 });
await handy.waitForTimeout(700);
const t1 = await handy.evaluate(LAGE) as any;

p('Telefon: der Rollkasten trägt KEINE Einzelseiten-Marke', t1.einzeln === false);
gleich('Telefon: alle vier Bühnen stehen im Bild', t1.sichtbar, 4);
/* Und das ist die Zahl, die den Befund überhaupt ausgelöst hat: am Telefon
   teilen sich zwei Blätter den Bildschirm. */
p('Telefon: die Rolle ist höher als das Bild — man rollt wirklich',
  t1.rollhoehe > t1.bildhoehe * 1.2,
  `Rolle ${t1.rollhoehe}, Bild ${t1.bildhoehe}`);

const pc = await browser.newPage({ viewport: { width: 1360, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR (Rechner): ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
const dokId = await pc.evaluate(AUFBAU) as string;
await pc.waitForSelector('.document-stage[data-aktiv]', { timeout: 20000 });
await pc.waitForTimeout(700);
const r1 = await pc.evaluate(LAGE) as any;

p('Rechner: der Rollkasten trägt KEINE Einzelseiten-Marke', r1.einzeln === false);
gleich('Rechner: alle vier Bühnen stehen im Bild', r1.sichtbar, 4);
/* `null`, nicht `undefined`: `getMeta` hat einen Rueckfallwert, und der ist
   `null` (`indexdb.ts:1112`). Nachgesehen, nicht geraten (E21). */
p('Und nichts ist gemerkt, solange niemand geschaltet hat',
  await pc.evaluate((id: string) => Store.getMeta('dokLauf:' + id), dokId) === null);

/* ==========================================================================
 * §2 · DER SCHALTER STEHT IM INSPECTOR UND SCHALTET UM
 * --------------------------------------------------------------------------
 * Im Inspector und nicht in der Leiste: E384 hat den Randstreifen aus der
 * Leiste geholt, weil sie am Telefon 411 px breit war in einem 390 px
 * breiten Fenster. Ein zweiter Schalter dort wäre derselbe Fehler.
 * ======================================================================== */
console.log('\n2 · Der Schalter steht im Inspector und schaltet um');

const oeffneInspector = async (seite: any): Promise<void> => {
  await seite.evaluate(`(() => {
    const k = document.querySelector('[data-document-action="inspector"]');
    if (k) k.click();
  })()`);
  await seite.waitForTimeout(500);
};
await oeffneInspector(pc);
const r2 = await pc.evaluate(LAGE) as any;
gleich('Genau ein Schalter, im Inspector', r2.schalter, 1);
p('In der Leiste steht er NICHT',
  await pc.evaluate(`!document.querySelector('.document-topbar [data-document-action="lauf"]')`));
p('Das Wort sagt, was ein Druck bewirkt', r2.wort.includes('Einzelseite'), r2.wort);
p('Und der Screenreader hört den Zustand (§38)',
  await pc.evaluate(`document.querySelector('[data-document-action="lauf"]')
    .getAttribute('aria-pressed')`) === 'false');

/* Kein `page.click`: der Inspector kann den Knopf verdecken, und dann wartet
   Playwright dreissig Sekunden und WIRFT, statt einen Punkt zu melden. */
const schalten = async (seite: any): Promise<void> => {
  await seite.evaluate(`(() => {
    const k = document.querySelector('[data-document-action="lauf"]');
    if (k) k.click();
  })()`);
  await seite.waitForTimeout(900);
};
await schalten(pc);
const r3 = await pc.evaluate(LAGE) as any;
p('Jetzt trägt der Rollkasten die Marke', r3.einzeln === true);
gleich('Und genau EINE Bühne steht im Bild', r3.sichtbar, 1);
gleich('Die vier Bühnen sind aber noch da — nur unsichtbar', r3.buehnen, 4);
p('Gemerkt ist es auch',
  await pc.evaluate((id: string) => Store.getMeta('dokLauf:' + id), dokId) === 'einzel');

/* Und zurück — eine Wahl, die nur in eine Richtung geht, ist keine. */
await oeffneInspector(pc);
const r4 = await pc.evaluate(LAGE) as any;
p('Das Wort ist umgesprungen', r4.wort.includes('Fortlaufend'), r4.wort);
await schalten(pc);
const r5 = await pc.evaluate(LAGE) as any;
p('Zurück in der Rolle', r5.einzeln === false);
gleich('Alle vier wieder im Bild', r5.sichtbar, 4);

/* ==========================================================================
 * §3 · IN DER EINZELSEITE BLEIBT ES BEI EINER GEZEICHNETEN SEITE
 * --------------------------------------------------------------------------
 * DAS IST DIE STELLE, DIE FAST SCHIEFGEGANGEN WÄRE. Eine ausgeblendete
 * Bühne hat `offsetTop` 0 und `offsetHeight` 0 — damit fällt sie in JEDES
 * Nähe-Fenster von `nachziehen`, und beim ersten Rollen wären alle achtzig
 * Seiten gezeichnet worden. Genau das, was E299 verhindern wollte.
 *
 * §55.2: den Kurzschluss `if (state.einzeln) { … return }` herausgenommen,
 * und dieser Abschnitt meldet vier gezeichnete statt einer.
 * ======================================================================== */
console.log('\n3 · Auch nach dem Rollen ist nur eine Seite gezeichnet');
await oeffneInspector(pc);
await schalten(pc);
const r6 = await pc.evaluate(LAGE) as any;
gleich('Beim Umschalten: eine gezeichnet', r6.gezeichnet, 1);

await pc.evaluate(`(() => {
  const c = document.querySelector('.document-center');
  c.scrollTop = c.scrollHeight;
  c.dispatchEvent(new Event('scroll'));
})()`);
await pc.waitForTimeout(700);
const r7 = await pc.evaluate(LAGE) as any;
gleich('Nach dem Rollen ans Ende: immer noch eine', r7.gezeichnet, 1);
gleich('Und immer noch eine sichtbar', r7.sichtbar, 1);

/* GEGENPROBE IN DER ROLLE. Ohne sie wäre „eine gezeichnet" auch dann grün,
   wenn gar nichts mehr gezeichnet würde. In der Rolle müssen mehrere
   kommen, sobald man hinrollt. */
await oeffneInspector(pc);
await schalten(pc);
await pc.evaluate(`(() => {
  const c = document.querySelector('.document-center');
  c.scrollTop = c.scrollHeight;
  c.dispatchEvent(new Event('scroll'));
})()`);
await pc.waitForTimeout(900);
const r8 = await pc.evaluate(LAGE) as any;
p('Gegenprobe: in der Rolle werden es beim Rollen mehr', r8.gezeichnet > 1,
  `gezeichnet ${r8.gezeichnet}`);

/* ==========================================================================
 * §4 · `‹ ›` WECHSELT DIE SEITE, UND DIE ROLLE BLEIBT EINE SEITE HOCH
 * ======================================================================== */
console.log('\n4 · In der Einzelseite blättert man mit ‹ ›');
await oeffneInspector(pc);
await schalten(pc);
await pc.waitForTimeout(400);

/* ERST AUF EINE BEKANNTE SEITE. Beim ersten Versuch fing dieser Abschnitt
   mit „Seite 1" an und stand auf „Seite 2" — weil §3 vorher ans Ende der
   Rolle gescrollt hatte und die Seitenzahl dem Blick folgt (E299). Das ist
   kein Fehler im Bau, sondern eine Annahme im Prueflauf: wer eine Seite
   messen will, sagt vorher, welche. Der Sprung geht ueber die Miniatur, und
   damit prueft er zugleich den Weg, den §4 sonst nicht anfasst. */
await pc.evaluate(`document.querySelector('[data-document-index="0"]').click()`);
await pc.waitForTimeout(900);

const seiteJetzt = async (): Promise<string> =>
  await pc.evaluate(`(document.querySelector('.document-position')||{}).textContent||''`) as string;
const aktivNr = async (): Promise<number> =>
  Number(await pc.evaluate(`(() => {
    const a = document.querySelector('.document-stage[data-aktiv]');
    return a ? Number(a.dataset.standNr) : -1;
  })()`));

gleich('Am Anfang Seite 1', await seiteJetzt(), 'Seite 1/4');
gleich('Und Bühne 0 ist aktiv', await aktivNr(), 0);
const hoch1 = (await pc.evaluate(LAGE) as any).rollhoehe;

await pc.evaluate(`document.querySelector('[data-document-action="next"]').click()`);
await pc.waitForTimeout(800);
gleich('Nach ›: Seite 2', await seiteJetzt(), 'Seite 2/4');
gleich('Und Bühne 1 ist aktiv', await aktivNr(), 1);
gleich('Immer noch nur eine im Bild', (await pc.evaluate(LAGE) as any).sichtbar, 1);

const hoch2 = (await pc.evaluate(LAGE) as any).rollhoehe;
p('Die Rolle ist auf einer Seite geblieben', Math.abs(hoch1 - hoch2) < 40,
  `vorher ${hoch1}, jetzt ${hoch2}`);

await pc.evaluate(`document.querySelector('[data-document-action="previous"]').click()`);
await pc.waitForTimeout(800);
gleich('Nach ‹: wieder Seite 1', await seiteJetzt(), 'Seite 1/4');

/* GEGENPROBE ZUR HÖHE: in der Rolle ist sie ein Vielfaches. Ohne sie sagte
   „auf einer Seite geblieben" nichts — zwei gleiche Zahlen sind auch dann
   gleich, wenn beide falsch sind. */
await oeffneInspector(pc);
await schalten(pc);
await pc.waitForTimeout(600);
const hochRolle = (await pc.evaluate(LAGE) as any).rollhoehe;
p('Gegenprobe: in der Rolle ist sie deutlich höher', hochRolle > hoch1 * 2,
  `Einzelseite ${hoch1}, Rolle ${hochRolle}`);

/* ==========================================================================
 * §5 · BEI EINEM EINZIGEN BLATT GIBT ES DEN SCHALTER NICHT
 * --------------------------------------------------------------------------
 * Ein Schalter, der nichts tut, ist schlimmer als keiner: er lässt einen
 * suchen, was sich geändert hat. Bei einer Seite sind Einzelseite und
 * Fortlaufend dasselbe Bild.
 * ======================================================================== */
console.log('\n5 · Bei einer einzigen Seite fehlt der Schalter');
await pc.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Ein Blatt', icon: '📗' });
  Store.addBlock(s.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842 });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1400));
  return s.id;
})()`);
await pc.waitForSelector('.document-stage[data-aktiv]', { timeout: 20000 });
await oeffneInspector(pc);
const e1 = await pc.evaluate(LAGE) as any;
gleich('Eine Bühne', e1.buehnen, 1);
gleich('Kein Schalter', e1.schalter, 0);
p('Der Randstreifen-Schalter steht aber sehr wohl da',
  await pc.evaluate(`!!document.querySelector('[data-document-action="rand"]')`));

/* ==========================================================================
 * §6 · DIE WAHL ÜBERLEBT DAS NEULADEN, JE DOKUMENT
 * ======================================================================== */
console.log('\n6 · Die Wahl bleibt — je Dokument, ohne den Inhalt anzufassen');
await pc.evaluate((id: string) => App.oeffne(id), dokId);
await pc.waitForSelector('.document-stage[data-aktiv]', { timeout: 20000 });
await pc.waitForTimeout(600);
const vorher = await pc.evaluate((id: string) => {
  const b = Store.getBlock(id); return { edited: b.edited, text: b.text };
}, dokId) as any;
await oeffneInspector(pc);
await schalten(pc);
gleich('Umgeschaltet', (await pc.evaluate(LAGE) as any).einzeln, true);

const nachher = await pc.evaluate((id: string) => {
  const b = Store.getBlock(id); return { edited: b.edited, text: b.text };
}, dokId) as any;
p('Der Seitenblock ist unangetastet — eine Ansicht ist kein Inhalt',
  vorher.edited === nachher.edited && vorher.text === nachher.text,
  `vorher ${vorher.edited}, nachher ${nachher.edited}`);

await pc.reload();
await pc.waitForTimeout(2700);
await pc.evaluate(`(() => { document.getElementById('rg-willkommen')?.remove();
                            document.getElementById('rg-einladung')?.remove(); })()`);
await pc.evaluate((id: string) => App.oeffne(id), dokId);
await pc.waitForSelector('.document-stage[data-aktiv]', { timeout: 20000 });
await pc.waitForTimeout(800);
const n1 = await pc.evaluate(LAGE) as any;
p('Nach dem Neuladen ist es wieder Einzelseite', n1.einzeln === true);
gleich('Und wieder nur eine im Bild', n1.sichtbar, 1);

/* GEGENPROBE: ein ZWEITES Dokument fängt in der Rolle an. Ohne sie wäre ein
   global gemerkter Lauf grün — und der wäre falsch: ein gescanntes Buch
   liest sich anders als ein handbeschriebenes Heft. */
const zweitId = await pc.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Zweites Skript', icon: '📘' });
  for (let nr = 1; nr <= 3; nr++)
    Store.addBlock(s.id, 'pdfseite', { text: '', nr, vonSeiten: 3, bw: 595, bh: 842 });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1500));
  return s.id;
})()`) as string;
await pc.waitForTimeout(600);
const z1 = await pc.evaluate(LAGE) as any;
p('Ein anderes Dokument fängt in der Rolle an', z1.einzeln === false);
gleich('Und zeigt alle drei', z1.sichtbar, 3);
p('Das erste behält seine Einzelseite',
  await pc.evaluate((id: string) => Store.getMeta('dokLauf:' + id), dokId) === 'einzel' &&
  dokId !== zweitId);

/* ==========================================================================
 * §7 · E399 — DER ROLLBALKEN LÜGT NICHT MEHR
 * --------------------------------------------------------------------------
 * Gefunden beim Messen für §4, nicht gesucht: die Gegenprobe „in der Rolle
 * ist sie deutlich höher" fiel, weil die Rolle bei vier Seiten gerade
 * 2895 px hoch war statt gut 7000. Nachgemessen an sechs Seiten:
 *
 *   beim Öffnen   Rolle 3513   Höhen [1922, 283, 283, 283, 283, 283]
 *   nach 3000 px  Rolle 6620   Höhen [1837, 1922, 1837, 283, 283, 283]
 *
 * Der Platzhalter war 283 px hoch, die Seite wird 1922 — weil
 * `center.clientWidth` beim Bauen der Bühnen noch 0 ist. Der Rollbalken
 * wuchs damit bei jeder erreichten Seite; bei achtzig Seiten zeigte er von
 * Anfang an ein Viertel des Wegs an.
 *
 * §55.2: die Zeile `platzhalterSetzen(...)` aus `passen()` genommen, und
 * beide Punkte hier fallen (gemessen 3513 statt 11283).
 * ======================================================================== */
console.log('\n7 · E399 · Der Rollbalken steht von Anfang an richtig');
const sechsId = await pc.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Sechs Seiten', icon: '📙' });
  for (let nr = 1; nr <= 6; nr++)
    Store.addBlock(s.id, 'pdfseite', { text: '', nr, vonSeiten: 6, bw: 595, bh: 842 });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1600));
  return s.id;
})()`) as string;
await pc.waitForSelector('.document-stage[data-aktiv]', { timeout: 20000 });
await pc.waitForTimeout(800);

const hoehen = async (): Promise<number[]> => await pc.evaluate(`(() =>
  Array.from(document.querySelectorAll('.document-stage'))
       .map(e => Math.round(e.getBoundingClientRect().height)))()`) as number[];

const h0 = await hoehen();
const roll0 = (await pc.evaluate(LAGE) as any).rollhoehe;
const gez0 = (await pc.evaluate(LAGE) as any).gezeichnet;
/* Eine ungezeichnete A4-Seite muss ungefähr so hoch sein wie die gezeichnete
   daneben — nicht ein Siebtel davon. Zehn Prozent Spielraum, weil die
   gezeichnete ihre Werkzeugleiste mitträgt und die andere nicht. */
const echt = h0[0] ?? 0;
const platz = h0.slice(1);
/* HÖCHSTENS ZWEI, NICHT GENAU EINE (E467, nachgemessen am 7. September):
   seit die Seite auf 980 px gedeckelt ist (E299 `passen`), ist eine A4-Seite
   1387 px hoch, und die zweite beginnt bei 1441 — innerhalb der einen
   Bildhöhe (2 × 746) nach unten, die `nachziehen` mitzeichnet. Die Zusage
   bleibt dieselbe: nicht alle sechs, nur die in Reichweite. */
p('Nur die Seiten in Reichweite sind gezeichnet — E299 ist unberührt', gez0 >= 1 && gez0 <= 2, `gezeichnet ${gez0}`);
p('Jeder Platzhalter ist so hoch wie die Seite werden wird',
  platz.length === 5 && platz.every(h => h > echt * 0.85 && h < echt * 1.15),
  `gezeichnet ${echt}, Platzhalter ${JSON.stringify(platz)}`);

/* UND ER BLEIBT ES BEIM ROLLEN. Das ist der eigentliche Punkt: vorher wuchs
   die Rolle von 3513 auf 6620, während man las. */
await pc.evaluate(`(() => { const c=document.querySelector('.document-center');
  c.scrollTop = 3000; c.dispatchEvent(new Event('scroll')); })()`);
await pc.waitForTimeout(900);
const roll1 = (await pc.evaluate(LAGE) as any).rollhoehe;
const gez1 = (await pc.evaluate(LAGE) as any).gezeichnet;
p('Beim Rollen kamen Seiten dazu', gez1 > gez0, `${gez0} → ${gez1}`);
p('Aber die Rolle ist dieselbe geblieben', Math.abs(roll0 - roll1) < 60,
  `vorher ${roll0}, jetzt ${roll1}`);
p('Und sie ist so hoch wie sechs Seiten, nicht wie zwei',
  roll0 > echt * 5, `Rolle ${roll0}, eine Seite ${echt}`);
p('Das Dokument ist ein anderes als das erste', sechsId !== dokId);

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
