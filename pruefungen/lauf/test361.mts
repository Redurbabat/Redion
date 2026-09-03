/* Suite 361 — Die Vorschau am Telefon ist ein Blatt (E371, L10)
 * ============================================================================
 * BEFUND: `zeilePeek` sprang am Telefon zur ganzen Seite. Der Kommentar dazu
 * war ehrlich („ein 560-px-Fenster wird auf 390 px keine Vorschau") und die
 * Folgerung falsch: die Tabelle war danach weg, die Rollposition auch, und
 * zurück ging es nur über die Navigation. Zehn Zeilen ansehen hiess zwanzig
 * Mal navigieren.
 *
 * Jetzt: ein Blatt von unten mit drei Höhen. Die Tabelle bleibt stehen.
 *
 * §1 AM TELEFON kommt ein Blatt statt eines Seitenwechsels.
 * §2 DIE TABELLE steht noch darunter — das ist der ganze Punkt.
 * §3 DREI HÖHEN: halb ist kleiner als voll, voll lässt oben Platz.
 * §4 ZIEHEN am Griff ändert die Höhe; nach unten schliesst es.
 * §5 ESCAPE und der Grund schliessen — und zwar nur das Blatt.
 * §6 SCHREIBEN zieht das Blatt auf.
 * §7 AM RECHNER ist alles wie vorher — dasselbe Seitenfenster.
 * §8 DER INHALT ist EINER: Titel, Eigenschaften, Blöcke in beiden Hüllen.
 * §9 FINGER: eine echte Berührung zieht das Blatt.
 * §10 BAU-HYGIENE: Masse, Merkmale, Einzeldatei, Dienststock.
 *
 *   node pruefungen/lauf/test361.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any; declare const App: any; declare const Datenbank: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9374;

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
const fehler: string[] = [];

/* ---------------------------------------------------------------------------
 * Der Aufbau: eine Datenbank mit drei Zeilen, geöffnet in einem Bildmass.
 * Beide Hälften des Laufs (Telefon, Rechner) benutzen ihn.
 * ------------------------------------------------------------------------ */
const aufbau = async (breite: number, hoehe: number) => {
  const s = await browser.newPage({
    viewport: { width: breite, height: hoehe },
    hasTouch: true, isMobile: breite < 500,
  });
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction(() => typeof Store !== 'undefined' &&
    typeof App !== 'undefined' && typeof Datenbank !== 'undefined',
    null, { timeout: 30000 });
  await s.waitForTimeout(1000);
  const daten = await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    /* `addDatabase` gibt `{ block, collectionId, viewId }` — kein `id`.
       Nachgesehen in indexdb.ts, nicht geraten (E21). */
    const seite = Store.addPage(null, { text: 'Werkstatt' });
    const db = Store.addDatabase(seite.id, 'Aufträge');
    const cid = db.collectionId;
    const r1 = Store.addRow(cid, { title: 'Sicherung prüfen' });
    Store.addRow(cid, { title: 'Verteiler zeichnen' });
    Store.addRow(cid, { title: 'Messprotokoll' });
    App.oeffne(seite.id);
    return { seite: seite.id, coll: cid, zeile: r1.id };
  });
  await s.waitForTimeout(700);
  return { s, ...daten };
};

/* Die Vorschau aufmachen — über denselben Weg, den die Oberfläche geht. */
const vorschau = (s: any, zeile: string) => s.evaluate((id: string) => {
  const z = Store.getBlock(id);
  const coll = Store.cache.collections[z.parentId];
  Datenbank.zeilePeek(z, coll);
}, zeile);

/* ========================================================================= */
console.log('\n1 · Am Telefon kommt ein Blatt, kein Seitenwechsel');

const t = await aufbau(390, 844);
const vorher = await t.s.evaluate(() => App.aktuelleSeite?.() ?? null);
await vorschau(t.s, t.zeile);
await t.s.waitForTimeout(420);

p('Es gibt ein Blatt', await t.s.locator('.iblatt').count() === 1);
p('Und einen Grund darunter', await t.s.locator('.iblatt-grund').count() === 1);
gleich('Die offene Seite hat NICHT gewechselt',
  await t.s.evaluate(() => App.aktuelleSeite?.() ?? null), vorher);
p('Kein Seitenfenster am Telefon', await t.s.locator('.peek').count() === 0);
p('Der Titel der Zeile steht darin',
  (await t.s.locator('.iblatt .peek-titel').first().textContent() || '').includes('Sicherung'));

console.log('\n2 · Die Tabelle steht noch darunter');

const sichtbar = await t.s.evaluate(() => {
  const liste = [...document.querySelectorAll('.db-karte, .tt-t, [data-rid]')];
  return liste.filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && !e.closest('.iblatt');
  }).length;
});
p('Zeilen der Tabelle sind weiterhin im Baum und sichtbar', sichtbar > 0, 'gezählt ' + sichtbar);

console.log('\n3 · Drei Höhen, und voll lässt oben Platz');

const masse = await t.s.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.iblatt')!;
  const halb = b.getBoundingClientRect().height;
  (window as any).__griff?.setzeHoehe;
  return { halb, stufe: b.dataset.stufe, fenster: window.innerHeight };
});
p('Halb ist deutlich kleiner als der Bildschirm',
  masse.halb > 200 && masse.halb < masse.fenster - 80,
  'halb=' + Math.round(masse.halb) + ' Fenster=' + masse.fenster);
gleich('Und das Blatt weiss, auf welcher Stufe es steht', masse.stufe, 'halb');

/* Auf „voll" ziehen — über den Griff, nicht über eine Innerei. */
const griffKasten = await t.s.locator('.iblatt-kopf').boundingBox();
await t.s.mouse.move(griffKasten!.x + griffKasten!.width / 2, griffKasten!.y + 8);
await t.s.mouse.down();
await t.s.mouse.move(griffKasten!.x + griffKasten!.width / 2, 60, { steps: 8 });
await t.s.mouse.up();
await t.s.waitForTimeout(380);

const nachOben = await t.s.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.iblatt');
  return b ? { h: b.getBoundingClientRect().height, stufe: b.dataset.stufe,
               oben: b.getBoundingClientRect().top } : null;
});
gleich('Nach oben gezogen steht es auf voll', nachOben?.stufe, 'voll');
p('Voll ist höher als halb', (nachOben?.h || 0) > masse.halb,
  'voll=' + Math.round(nachOben?.h || 0) + ' halb=' + Math.round(masse.halb));
p('Oben bleibt Platz — man SIEHT, dass etwas dahinter liegt',
  (nachOben?.oben || 0) >= 30,
  'oben=' + Math.round(nachOben?.oben || 0));

console.log('\n4 · Nach unten ziehen schliesst');

const k4 = await t.s.locator('.iblatt-kopf').boundingBox();
await t.s.mouse.move(k4!.x + k4!.width / 2, k4!.y + 8);
await t.s.mouse.down();
await t.s.mouse.move(k4!.x + k4!.width / 2, k4!.y + 700, { steps: 10 });
await t.s.mouse.up();
await t.s.waitForTimeout(420);
p('Weit nach unten gezogen ist das Blatt weg', await t.s.locator('.iblatt').count() === 0);
p('Und der Grund ist mitgegangen', await t.s.locator('.iblatt-grund').count() === 0);

console.log('\n5 · Escape und der Grund schliessen');

await vorschau(t.s, t.zeile);
await t.s.waitForTimeout(360);
await t.s.keyboard.press('Escape');
await t.s.waitForTimeout(360);
p('Escape schliesst das Blatt (§38)', await t.s.locator('.iblatt').count() === 0);

await vorschau(t.s, t.zeile);
await t.s.waitForTimeout(360);
await t.s.locator('.iblatt-grund').click({ position: { x: 10, y: 10 } });
await t.s.waitForTimeout(360);
p('Ein Tipp auf den Grund schliesst', await t.s.locator('.iblatt').count() === 0);
gleich('Und die Seite ist immer noch dieselbe',
  await t.s.evaluate(() => App.aktuelleSeite?.() ?? null), vorher);

console.log('\n6 · Schreiben zieht das Blatt auf');

await vorschau(t.s, t.zeile);
await t.s.waitForTimeout(360);
await t.s.locator('.iblatt .peek-titel').first().click();
await t.s.waitForTimeout(360);
gleich('Wer in den Titel tippt, bekommt die volle Höhe',
  await t.s.evaluate(() => document.querySelector<HTMLElement>('.iblatt')?.dataset.stufe ?? null),
  'voll');

console.log('\n7 · Am Rechner ist alles wie vorher');

const d = await aufbau(1360, 900);
await vorschau(d.s, d.zeile);
await d.s.waitForTimeout(400);
p('Am Rechner kommt das Seitenfenster', await d.s.locator('.peek').count() === 1);
p('Und kein Blatt', await d.s.locator('.iblatt').count() === 0);
const peekKasten = await d.s.locator('.peek').boundingBox();
p('Es steht rechts und ist schmaler als das Fenster',
  (peekKasten?.x || 0) > 600 && (peekKasten?.width || 0) < 700,
  'x=' + Math.round(peekKasten?.x || 0) + ' b=' + Math.round(peekKasten?.width || 0));

console.log('\n8 · Der Inhalt ist EINER, nicht zwei');

const inhaltRechner = await d.s.evaluate(() => ({
  titel: !!document.querySelector('.peek .peek-titel'),
  props: document.querySelectorAll('.peek .peek-prop').length,
  bloecke: !!document.querySelector('.peek .peek-inhalt'),
}));
await d.s.keyboard.press('Escape');

await vorschau(t.s, t.zeile);
await t.s.waitForTimeout(360);
const inhaltTelefon = await t.s.evaluate(() => ({
  titel: !!document.querySelector('.iblatt .peek-titel'),
  props: document.querySelectorAll('.iblatt .peek-prop').length,
  bloecke: !!document.querySelector('.iblatt .peek-inhalt'),
}));
gleich('Titel, Eigenschaften und Blöcke stehen in beiden Hüllen gleich',
  inhaltTelefon, inhaltRechner);
p('Die Eigenschaftszeilen sind am Telefon fingergerecht (§37)',
  await t.s.evaluate(() => {
    const w = document.querySelector('.iblatt .pp-w');
    return w ? Math.round(w.getBoundingClientRect().height) >= 44 : false;
  }));
p('Die Knöpfe im Kopf messen 44 px (§37)',
  await t.s.evaluate(() => [...document.querySelectorAll('.iblatt-zeile button')]
    .every(b => b.getBoundingClientRect().height >= 44 &&
                b.getBoundingClientRect().width >= 44)));

console.log('\n9 · Mit dem Finger');

const cdp = await t.s.context().newCDPSession(t.s);
type Beruehrung = 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel';
const tippen = async (x: number, y: number, art: Beruehrung) => {
  await cdp.send('Input.dispatchTouchEvent', {
    type: art, touchPoints: art === 'touchEnd' ? [] : [{ x, y, id: 1 }]
  });
};
const k9 = await t.s.locator('.iblatt-kopf').boundingBox();
const h9vor = await t.s.evaluate(() => document.querySelector('.iblatt')!.getBoundingClientRect().height);
await tippen(k9!.x + k9!.width / 2, k9!.y + 8, 'touchStart');
await tippen(k9!.x + k9!.width / 2, k9!.y - 100, 'touchMove');
await tippen(k9!.x + k9!.width / 2, k9!.y - 200, 'touchMove');
await tippen(k9!.x + k9!.width / 2, k9!.y - 200, 'touchEnd');
await t.s.waitForTimeout(400);
const h9nach = await t.s.evaluate(() =>
  document.querySelector('.iblatt')?.getBoundingClientRect().height ?? 0);
p('Eine echte Berührung am Griff zieht das Blatt auf', h9nach > h9vor + 40,
  'vorher=' + Math.round(h9vor) + ' nachher=' + Math.round(h9nach));

/* UND JETZT DER FALL, DER DEN touchmove-GRIFF BRAUCHT.
   Am Kopf steht `touch-action:none` im Stil — dort weiss der Browser schon
   beim `touchstart`, dass die Geste uns gehört. Der KÖRPER muss rollen
   können und darf das nicht haben. Zieht man von dort aus nach unten,
   während oben nichts mehr zu rollen ist, hat der Browser die Berührung
   bereits für sich beansprucht: ohne `preventDefault` im `touchmove`
   passiert nichts. Genau diese Zeile ist es, die E368 einen halben Tag
   gekostet hat — hier ist sie zum ersten Mal einzeln geprüft. */
await t.s.evaluate(() => {
  const b = document.querySelector<HTMLElement>('.iblatt')!;
  b.style.height = Math.round(window.innerHeight * 0.58) + 'px';
  b.dataset.stufe = 'halb';
  document.querySelector<HTMLElement>('.iblatt-koerper')!.scrollTop = 0;
});
await t.s.waitForTimeout(320);
const koerper9 = await t.s.locator('.iblatt-koerper').boundingBox();
const x9 = koerper9!.x + koerper9!.width / 2;
const y9 = koerper9!.y + 30;
await tippen(x9, y9, 'touchStart');
await tippen(x9, y9 + 40, 'touchMove');
await tippen(x9, y9 + 140, 'touchMove');
await tippen(x9, y9 + 260, 'touchMove');
await tippen(x9, y9 + 260, 'touchEnd');
await t.s.waitForTimeout(450);
p('Und aus dem Körper heraus schliesst ein Zug nach unten',
  await t.s.locator('.iblatt').count() === 0,
  'Blatt steht noch, Höhe ' + await t.s.evaluate(() =>
    Math.round(document.querySelector('.iblatt')?.getBoundingClientRect().height ?? -1)));

console.log('\n10 · Das ⋯-Menü liegt ÜBER dem Blatt, nicht dahinter');

/* GEFUNDEN BEIM LESEN, NICHT BEIM MESSEN: `.menu` steht auf z-index 600,
   das Blatt auf 780. Ein Menü aus dem Blatt heraus wäre dahinter
   verschwunden — der Knopf hätte scheinbar nichts getan. */
await vorschau(t.s, t.zeile);
await t.s.waitForTimeout(360);
p('Der Body ist markiert, solange ein Blatt offen ist',
  await t.s.evaluate(() => document.body.classList.contains('iblatt-auf')));
await t.s.locator('.iblatt-zeile button[aria-label="Mehr"]').click();
await t.s.waitForTimeout(420);
const stapel = await t.s.evaluate(() => {
  const m = document.querySelector<HTMLElement>('.menu');
  const b = document.querySelector<HTMLElement>('.iblatt');
  if (!m || !b) return null;
  const r = m.getBoundingClientRect();
  const punkt = document.elementFromPoint(
    Math.round(r.left + r.width / 2), Math.round(r.top + Math.min(30, r.height / 2)));
  return { menu: +getComputedStyle(m).zIndex, blatt: +getComputedStyle(b).zIndex,
           oben: punkt ? !!punkt.closest('.menu') : false };
});
p('Es gibt ein Menü', !!stapel);
p('Sein z-index liegt über dem des Blattes',
  (stapel?.menu || 0) > (stapel?.blatt || 0),
  'Menü ' + stapel?.menu + ' gegen Blatt ' + stapel?.blatt);
p('Und an seiner eigenen Stelle liegt es wirklich obenauf', stapel?.oben === true);
await t.s.keyboard.press('Escape');
await t.s.waitForTimeout(300);
p('Escape nimmt zuerst das Menü, nicht das Blatt',
  await t.s.locator('.iblatt').count() === 1 && await t.s.locator('.menu').count() === 0);
await t.s.keyboard.press('Escape');
await t.s.waitForTimeout(320);
p('Und erst der zweite Druck das Blatt', await t.s.locator('.iblatt').count() === 0);
p('Die Marke am Body ist danach weg',
  !await t.s.evaluate(() => document.body.classList.contains('iblatt-auf')));

console.log('\n11 · Bau-Hygiene');

const js = fs.readFileSync(path.join(WURZEL, 'quell/schale/ueberlagerung/sheet.js'), 'utf8');
const css = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf8');
const steuer = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/datenbanken/steuerung.js'), 'utf8');
p('Das erzeugte sheet.js gibt es und kennt die Geste',
  js.includes('ERZEUGT') && js.includes('pointerdown') && js.includes('iblatt'));
/* OHNE KOMMENTARE PRÜFEN. Beim ersten Versuch stand dieser Punkt grün, ob
   die Zeile da war oder nicht — der Kommentar darüber nennt „touchmove"
   und „preventDefault" beide, und der Prüfpunkt las ihn mit. Ein Punkt,
   der von seiner eigenen Erklärung bedient wird, kann nicht rot werden
   (§55.2). */
const jsOhneWorte = js.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
p('Es hängt ein touchmove mit preventDefault daran (die E368-Lehre)',
  /addEventListener\('touchmove'[\s\S]{0,140}preventDefault/.test(jsOhneWorte) &&
  /passive:\s*false/.test(jsOhneWorte));
p('Und der Zeiger wird gefangen, sonst reisst der Zug ab',
  /setPointerCapture/.test(jsOhneWorte));
p('Der Stil hebt Menüs an, solange ein Blatt offen ist',
  /body\.iblatt-auf\.menu\{z-index:\d+\}/.test(css.replace(/\s+/g, '')));
p('Der Stil kennt Blatt, Grund, Griff und Körper',
  css.includes('.iblatt{') && css.includes('.iblatt-grund') &&
  css.includes('.iblatt-griff') && css.includes('.iblatt-koerper'));
p('Beim Ziehen läuft keine Bewegung mit',
  /\.iblatt\.zieht\{transition:none\}/.test(css.replace(/\s+/g, '')));
p('Kein erfundenes Merkmal im neuen Stil',
  !/var\(--akzent\)/.test(css.split('INHALTSBLATT')[1] || '') &&
  !/var\(--flaeche-2\)/.test(css.split('INHALTSBLATT')[1] || '') &&
  !/var\(--bg-2\b/.test(css.split('INHALTSBLATT')[1] || ''));
p('Der Inhalt steht einmal im Quelltext, nicht zweimal',
  (steuer.match(/peek-titel/g) || []).length <= 2 && steuer.includes('peekInhalt'));
p('Die Datei steht im Dienststock',
  fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8')
    .includes('ueberlagerung/sheet.js'));
p('Und in index.html',
  fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8')
    .includes('ueberlagerung/sheet.js'));
p('Die Einzeldatei kennt das Blatt',
  fs.readFileSync(path.join(WURZEL, 'redion-einzeldatei.html'), 'utf8')
    .includes('iblatt-koerper'));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
