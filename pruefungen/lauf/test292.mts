/* Suite 292 — Die Reiterzeile für offene Dokumente (E300)
 * ============================================================================
 * Redurs Satz zu einem Bild aus GoodNotes, in dem oben zwei Dokumentreiter
 * stehen: „Für handy ansich sollte so sein ich sollte wie auf dem zwischen
 * die pdfs direk gehen können für laptop auch so."
 *
 * Nachgesehen, was Redion dafür schon hatte — und der Fund war zweiteilig:
 *
 *   Die Reiterzeile GIBT ES seit langem (`schale/aufbau/reiter.js`, mit
 *   Umsortieren, Neustartfestigkeit und Strg+1…9). Nur ist sie leer
 *   geblieben: `gemerkt()` hat den aktiven Reiter beim Öffnen ÜBERSCHRIEBEN.
 *   Wer eine zweite PDF öffnete, verlor die erste aus der Zeile, und weil
 *   die Zeile unter zwei Reitern verborgen bleibt, sah man sie nie.
 *
 *   Und am Telefon stand `#reiterleiste{display:none !important}` — mit dem
 *   Argument, dort sei kein Platz. Für eine Zeile, in der nie etwas steht,
 *   war das sogar richtig.
 *
 * E300 dreht beides um. Was hier gemessen wird:
 *
 *   §1 ZWEI DOKUMENTE, ZWEI REITER — und die Zeile ist dann zu sehen.
 *   §2 GEGENPROBE: zwanzig gewöhnliche Seiten ergeben EINEN Reiter.
 *   §3 SCHON OFFEN heisst hinwechseln, nicht ein zweites Mal anlegen.
 *   §4 EIN DOKUMENT WIRD NICHT VERDRÄNGT, auch nicht von einer Notiz.
 *   §5 AM TELEFON steht die Zeile da, mit Fingermassen (§37).
 *   §6 DAS DOKUMENT BLEIBT GANZ IM BILD, obwohl die Zeile Platz nimmt.
 *   §7 KEIN KÜRZEL, DAS ETWAS ANDERES TUT ALS ANGESCHRIEBEN.
 *
 *   node pruefungen/lauf/test292.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any; declare const Fenster: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9092;

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

const browser = await chromium.launch();
const fehler: string[] = [];

/* Zwei Dokumente und zwei gewöhnliche Seiten. Die Dokumente ohne echte
   Seitenbilder — für die Frage, WELCHE Reiter entstehen, ist der Inhalt der
   PDF ohne Belang, und der Lauf wird um zwanzig Sekunden kürzer. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const mach = (titel, symbol) => {
    const s = Store.addPage(null, { text: titel, icon: symbol });
    for (let nr = 1; nr <= 3; nr++)
      Store.addBlock(s.id, 'pdfseite', { text: '', suchtext: 'Ohm', nr, vonSeiten: 3,
        bw: 595, bh: 842, quelleId: 'q-' + s.id });
    Store.updateBlock(s.id, { dokumentModus: true });
    return s.id;
  };
  const a = mach('Kapitel 8 – Schaltungen', '📕');
  const b = mach('Formelsammlung', '📗');
  const n1 = Store.addPage(null, { text: 'Einkaufszettel', icon: '📝' }).id;
  const n2 = Store.addPage(null, { text: 'Telefonnotiz', icon: '☎️' }).id;
  await Store.flush();
  App.oeffne(a);
  await new Promise(r => setTimeout(r, 1200));
  return { a, b, n1, n2 };
})()`;

const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR (Rechner): ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
const ids = await pc.evaluate(AUFBAU) as { a: string; b: string; n1: string; n2: string };
await pc.waitForSelector('.document-workspace', { timeout: 20000 });

/* Der Rundgang legt sich als Dialog über alles und fängt jeden Klick ab.
   Er wird vor jedem Klick weggeräumt — `rundgangGesehen` allein genügt
   nicht, weil er beim Neuladen erneut aufgeht. */
const aufraeumen = (wo = pc) => wo.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.querySelectorAll('[role="dialog"].overlay').forEach(o => o.remove());
});

/* Klicken, aber nicht daran zerbrechen. Beim Gegenbeweis gegen den alten
   Stand gab es die Reiter gar nicht, und `page.click` warf nach dreissig
   Sekunden eine Ausnahme — der Lauf brach ab, statt zu BERICHTEN, was fehlt.
   Eine Prüfung, die abstürzt, sagt weniger als eine, die rot wird. */
const klick = async (wahl: string, was: string): Promise<boolean> => {
  await aufraeumen();
  const da = await pc.$(wahl);
  if (!da) { p(was, false, `${wahl} gibt es nicht`); return false; }
  await da.click({ timeout: 5000 }).catch(() => {});
  return true;
};

const oeffne = async (id: string, warte = 700) => {
  await pc.evaluate(async (x: string) => {
    App.oeffne(x);
    await new Promise(r => setTimeout(r, 350));
  }, id);
  await pc.waitForTimeout(warte);
};

/** Der Stand der Zeile: was drin steht, welcher aktiv ist, ob sie zu sehen ist. */
const zeile = () => pc.evaluate(() => {
  const el = document.getElementById('reiterleiste');
  const r = el?.getBoundingClientRect();
  return {
    liste: (Fenster.reiter() || []).map((t: any) => (Store.getBlock(t.id)?.text) || '?'),
    aktiv: Fenster.aktiv(),
    sichtbar: !!el && getComputedStyle(el).display !== 'none' && (r?.height || 0) > 4,
    studio: document.body.dataset.dokument === 'an',
    knoepfe: [...(el?.querySelectorAll('.rt-tab') || [])]
      .map(t => (t.querySelector('span')?.textContent || '').trim()),
    hoch: Math.round(r?.height || 0)
  };
});

/* ==========================================================================
 * §1 · Zwei Dokumente, zwei Reiter
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Vor E300 stand in `gemerkt()` genau eine
 * Zeile: `reiter[aktiv] = { id }`. Nach dem Öffnen des zweiten Dokuments
 * hätte die Liste EINEN Eintrag gehabt, und die Zeile wäre unsichtbar
 * geblieben. Beide Behauptungen dieses Abschnitts wären gefallen.
 * ========================================================================*/
console.log('\n1 · Zwei Dokumente, zwei Reiter');

const vorher = await zeile();
gleich('Ein Dokument allein ergibt einen Reiter', vorher.liste.length, 1);
/* SEIT E464 STEHT DIE ZEILE IM SCHREIBSTUDIO IMMER — mit dem „+" für das
   nächste Dokument, wie die Reiter eines Browsers (Redurs test437: „Echte
   Dokument-Tabs sichtbar"). Ausserhalb des Studios gilt E300 weiter: eine
   Zeile mit einem Reiter ist eine Zeile Luft. */
p('Und die Zeile bleibt dabei verborgen — ausser im Schreibstudio, wo sie das „+" trägt',
  !vorher.sichtbar || vorher.studio, `${vorher.hoch} px, Studio: ${vorher.studio}`);

await oeffne(ids.b);
const zwei = await zeile();
gleich('Das zweite Dokument bekommt einen eigenen Reiter',
  zwei.liste, ['Kapitel 8 – Schaltungen', 'Formelsammlung']);
gleich('Der neue ist der aktive', zwei.aktiv, 1);
p('Und jetzt steht die Zeile da', zwei.sichtbar, `${zwei.hoch} px`);
gleich('Beide tragen ihren Namen', zwei.knoepfe,
  ['📕 Kapitel 8 – Schaltungen', '📗 Formelsammlung']);

/* Und der Weg zurück ist ein Klick, nicht der Umweg übers Regal — das ist
   Redurs eigentlicher Satz. */
await klick('.rt-tab[data-i="0"]', 'Ein Klick auf den ersten Reiter führt zum ersten Dokument');
await pc.waitForTimeout(800);
const zurueck = await pc.evaluate(() => ({
  offen: App.aktuelleSeite(), aktiv: Fenster.aktiv(),
  /* Den NAMEN, nicht den ganzen Kasten (E823, Dokumentkompass). */
  titel: ((document.querySelector('.document-title-name') ?? document.querySelector('.document-title'))?.textContent || '').trim()
}));
gleich('Ein Klick auf den ersten Reiter führt zum ersten Dokument',
  zurueck.offen, ids.a);
gleich('Und der Reiter weiss es auch', zurueck.aktiv, 0);
gleich('Die Kopfzeile zeigt den richtigen Namen', zurueck.titel, 'Kapitel 8 – Schaltungen');

/* ==========================================================================
 * §2 · GEGENPROBE — gewöhnliche Seiten lösen einander ab
 * --------------------------------------------------------------------------
 * Die Regel, die sich diese Woche fünfmal bewährt hat: eine Anzeige, die
 * IMMER etwas anzeigt, wird nicht gelesen. Eine Reiterzeile, die bei jedem
 * Klick im Baum wächst, ist nach zehn Minuten unbrauchbar — und dann steht
 * Redur wieder vor demselben Problem, nur mit dreissig statt zwei Kästchen.
 *
 * Kann das rot werden? Ja: würde `gemerkt()` bei JEDEM Öffnen einen Reiter
 * anlegen, stünden hier einundzwanzig statt einem.
 * ========================================================================*/
console.log('\n2 · Gegenprobe — gewöhnliche Seiten lösen einander ab');

/* Zurück auf eine GEWÖHNLICHE Seite — mit Redions eigenen Griffen, nicht
   über ein Neuladen. Der Weg übers Neuladen war der erste Versuch und war
   falsch: der Anker in der Adresse überlebt es und zieht die App wieder auf
   das Dokument, und dann misst die Gegenprobe etwas anderes als sie sagt. */
await pc.evaluate(async (id: string) => {
  while ((Fenster.reiter() || []).length > 1)
    Fenster.schliessen((Fenster.reiter() || []).length - 1);
  App.oeffne(id);                       /* daneben, weil links ein Dokument steht */
  await new Promise(r => setTimeout(r, 300));
  Fenster.schliessen(0);                /* und das Dokument weg */
  await new Promise(r => setTimeout(r, 400));
}, ids.n1);
await pc.waitForTimeout(600);
const startStand = await zeile();
gleich('Zurück auf einer gewöhnlichen Seite, ein Reiter',
  startStand.liste, ['Einkaufszettel']);

const viele = await pc.evaluate(async (paar: { n1: string; n2: string }) => {
  for (let i = 0; i < 20; i++) {
    App.oeffne(i % 2 ? paar.n1 : paar.n2);
    await new Promise(r => setTimeout(r, 60));
  }
  await new Promise(r => setTimeout(r, 300));
  const el = document.getElementById('reiterleiste');
  return { anzahl: (Fenster.reiter() || []).length,
           sichtbar: !!el && getComputedStyle(el).display !== 'none' };
}, { n1: ids.n1, n2: ids.n2 });

gleich('Zwanzig gewöhnliche Seiten nacheinander ergeben EINEN Reiter',
  viele.anzahl, 1);
p('Also bleibt die Zeile im Alltag still', !viele.sichtbar);

/* ==========================================================================
 * §3 · Schon offen heisst hinwechseln
 * ========================================================================*/
console.log('\n3 · Schon offen heisst hinwechseln, nicht doppelt anlegen');

await oeffne(ids.a);
await oeffne(ids.b);
const vorDoppelt = await zeile();
gleich('Erst wieder zwei Dokumente in der Zeile', vorDoppelt.liste.length, 2);

await oeffne(ids.a);
const doppelt = await zeile();
gleich('Das schon offene Dokument legt keinen dritten Reiter an',
  doppelt.liste.length, 2);
gleich('Sondern der Zeiger springt dorthin', doppelt.aktiv, 0);

/* ==========================================================================
 * §4 · Ein Dokument wird nicht verdrängt
 * --------------------------------------------------------------------------
 * Auch nicht von einer Notiz. Vorher hätte eine geöffnete Notiz die PDF aus
 * ihrem Reiter geschoben — und damit aus der Zeile.
 * ========================================================================*/
console.log('\n4 · Ein Dokument wird nicht verdrängt');

/* Stand: [Kapitel 8, Formelsammlung], und Kapitel 8 ist der aktive. */
await oeffne(ids.n1);
const mitNotiz = await zeile();
gleich('Die Notiz stellt sich DANEBEN, statt das Dokument zu ersetzen',
  mitNotiz.liste, ['Kapitel 8 – Schaltungen', 'Einkaufszettel', 'Formelsammlung']);
p('Und zwar neben dem, aus dem sie geöffnet wurde — wie in jedem Browser',
  mitNotiz.aktiv === 1, String(mitNotiz.aktiv));

await oeffne(ids.n2);
const zweiteNotiz = await zeile();
gleich('Die nächste Notiz löst aber die erste ab — Notizen häufen sich nicht',
  zweiteNotiz.liste, ['Kapitel 8 – Schaltungen', 'Telefonnotiz', 'Formelsammlung']);

/* Und das Kreuz nimmt einen wieder heraus. */
await klick('.rt-tab[data-i="1"] button[data-zu]', 'Das Kreuz schliesst den Reiter');
await pc.waitForTimeout(800);
const nachZu = await zeile();
gleich('Das Kreuz schliesst den Reiter', nachZu.liste,
  ['Kapitel 8 – Schaltungen', 'Formelsammlung']);

/* ==========================================================================
 * §5 · Am Telefon steht die Zeile da — mit Fingermassen
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Vor E300 stand in der 760er-Regel
 * `#reiterleiste{display:none !important}`. Die erste Behauptung wäre
 * gefallen, und mit ihr alle Masse darunter (ein verborgener Kasten misst
 * null). §37 verlangt 44 px; das Kreuz stand vorher bei 17 px Breite.
 * ========================================================================*/
console.log('\n5 · Am Telefon steht die Zeile da — mit Fingermassen');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
  isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(3200);
await handy.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});
/* `browser.newPage()` macht einen EIGENEN Kontext — eigene Ablage, eigene
   IndexedDB. Das Telefon sieht die Seiten des Rechners also nicht und baut
   sich dieselben zwei Dokumente selbst. */
const handyIds = await handy.evaluate(AUFBAU) as { a: string; b: string };
await handy.waitForSelector('.document-workspace', { timeout: 20000 });
const handyStand = await handy.evaluate(async (zweit: string) => {
  App.oeffne(zweit);
  await new Promise(r => setTimeout(r, 1200));
  return { offen: App.aktuelleSeite(), liste: (Fenster.reiter() || []).length,
           raum: !!document.querySelector('.document-workspace') };
}, handyIds.b);
await handy.waitForTimeout(1200);
p('Das Telefon hat beide Dokumente offen',
  handyStand.offen === handyIds.b && handyStand.liste === 2 && handyStand.raum,
  JSON.stringify(handyStand));

const amHandy = await handy.evaluate(() => {
  const el = document.getElementById('reiterleiste');
  const r = el?.getBoundingClientRect();
  const tabs = [...(el?.querySelectorAll<HTMLElement>('.rt-tab') || [])];
  const kreuze = tabs.map(t => t.querySelector<HTMLElement>('button[data-zu]'));
  const plus = el?.querySelector<HTMLElement>('.rt-plus');
  const pr = plus?.getBoundingClientRect();
  return {
    sichtbar: !!el && getComputedStyle(el).display !== 'none',
    hoch: Math.round(r?.height || 0),
    rechts: Math.round(r?.right || 0),
    anzahl: tabs.length,
    tabHoch: tabs.map(t => Math.round(t.getBoundingClientRect().height)),
    tabBreit: tabs.map(t => Math.round(t.getBoundingClientRect().width)),
    kreuzBreit: kreuze.map(k => Math.round(k?.getBoundingClientRect().width || 0)),
    kreuzHoch: kreuze.map(k => Math.round(k?.getBoundingClientRect().height || 0)),
    kreuzSicht: kreuze.map(k => k ? Number(getComputedStyle(k).opacity) : -1),
    plusBreit: Math.round(pr?.width || 0),
    plusHoch: Math.round(pr?.height || 0),
    rollbar: (el?.scrollWidth || 0) >= (el?.clientWidth || 0),
    /* Und der aktive Reiter ganz im Bild? */
    aktivRand: (() => {
      const a = el?.querySelector<HTMLElement>('.rt-tab.an');
      if (!a) return null;
      const r = a.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.right)];
    })(),
    fensterBreit: window.innerWidth
  };
});

p('Die Reiterzeile steht am Telefon', amHandy.sichtbar);
gleich('Und beide Dokumente stehen darin', amHandy.anzahl, 2);
p('Die Zeile ist mindestens 48 px hoch', amHandy.hoch >= 48, `${amHandy.hoch} px`);
/* `every` auf einer LEEREN Liste ist wahr. Ohne die Längenprüfung wären die
   vier Masse unten auch dann grün, wenn es gar keine Reiter gäbe — genau die
   Sorte Prüfung, die §55.2 verbietet. */
const zwei_da = amHandy.tabHoch.length === 2;
p('Jeder Reiter ist mindestens 44 px hoch (§37)',
  zwei_da && amHandy.tabHoch.every(h => h >= 44), amHandy.tabHoch.join(', '));
p('Jedes Schliesskreuz ist mindestens 44 px breit (§37)',
  zwei_da && amHandy.kreuzBreit.every(b => b >= 44), amHandy.kreuzBreit.join(', '));
p('Und mindestens 40 px hoch', zwei_da && amHandy.kreuzHoch.every(h => h >= 40),
  amHandy.kreuzHoch.join(', '));
p('Der Plusknopf ebenso',
  amHandy.plusBreit >= 44 && amHandy.plusHoch >= 44,
  `${amHandy.plusBreit}×${amHandy.plusHoch}`);
/* OHNE MAUS GIBT ES KEIN HOVER. Vorher war das Kreuz des nicht-aktiven
   Reiters `opacity:0` — ein Knopf, den man treffen, aber nicht sehen kann
   (§38: keine Information nur über eine Eigenschaft, die es hier gar nicht
   gibt). */
p('Auch das Kreuz des nicht-aktiven Reiters ist sichtbar',
  zwei_da && amHandy.kreuzSicht.every(o => o > 0.9), amHandy.kreuzSicht.join(', '));
p('Kein Reiter ragt über den Bildschirmrand',
  amHandy.rechts > 0 && amHandy.rechts <= 391, `${amHandy.rechts} px`);
p('Und keiner nimmt mehr als zwei Drittel der Breite',
  zwei_da && amHandy.tabBreit.every(b => b <= 260), amHandy.tabBreit.join(', '));

/* WAS ERST DAS BILD GEZEIGT HAT (§55.1): der AKTIVE Reiter stand halb
   ausserhalb des Bildschirms. Die ZEILE endete brav am Rand — das misst der
   Punkt darüber und der war grün —, nur ihr Inhalt nicht. Gegengeprüft: ohne
   das Nachrollen in `zeichnen()` steht hier [245, 442] bei 390 px Breite. */
p('Der aktive Reiter steht ganz im Bild',
  !!amHandy.aktivRand && amHandy.aktivRand[0]! >= 0 &&
  amHandy.aktivRand[1]! <= amHandy.fensterBreit,
  `${JSON.stringify(amHandy.aktivRand)} von ${amHandy.fensterBreit}`);

/* UND EIN LANGER NAME DARF DEN KNOPF NICHT HINAUSSCHIEBEN.
   §55.2 — kann das rot werden? Ja, und nur mit einem langen Namen: bei
   „Formelsammlung" bleibt der Reiter ohnehin unter seiner Höchstbreite,
   also wäre die Behauptung dort immer wahr gewesen. Redurs Dateien heissen
   aber „Elektrotechnik Grundlagen Kapitel 8 …". Nimmt man dem Namen sein
   `overflow:hidden`, wächst der Reiter hier auf über 400 px. */
const lang = await handy.evaluate(async () => {
  const liste = Fenster.reiter();
  Store.updateBlock(liste[0].id, {
    text: 'Elektrotechnik Grundlagen Kapitel 8 Schaltungen und Netzwerke Teil 2' });
  Fenster.zeichnen();
  await new Promise(r => setTimeout(r, 200));
  const el = document.getElementById('reiterleiste')!;
  const t = el.querySelector<HTMLElement>('.rt-tab')!;
  const k = t.querySelector<HTMLElement>('button[data-zu]')!;
  const tr = t.getBoundingClientRect(), kr = k.getBoundingClientRect();
  return { breit: Math.round(tr.width), kreuzInnen: kr.right <= tr.right + 1,
           kreuzBreit: Math.round(kr.width),
           name: (t.querySelector('span')?.textContent || '').length };
});
p('Ein 68 Zeichen langer Name steht wirklich im Reiter', lang.name > 60, String(lang.name));
p('Und der Reiter bleibt trotzdem unter zwei Dritteln der Breite',
  lang.breit <= 260, `${lang.breit} px`);
p('Das Schliesskreuz wird davon nicht hinausgeschoben',
  lang.kreuzInnen && lang.kreuzBreit >= 44, JSON.stringify(lang));

/* ==========================================================================
 * §6 · Das Dokument bleibt ganz im Bild
 * --------------------------------------------------------------------------
 * Die Zeile nimmt 48 px. Der Arbeitsraum misst seine Höhe selbst (E296) —
 * aber das nützt nur, wenn er nach dem Zeichnen der Zeile misst. Täte er es
 * vorher, stünde sein Fuss jetzt 48 px unter dem Fensterrand.
 * ========================================================================*/
console.log('\n6 · Das Dokument bleibt ganz im Bild');

const raum = await handy.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.document-workspace');
  const l = document.getElementById('reiterleiste');
  const wr = w?.getBoundingClientRect(); const lr = l?.getBoundingClientRect();
  return { da: !!w, oben: Math.round(wr?.top || 0), unten: Math.round(wr?.bottom || 0),
           hoch: Math.round(wr?.height || 0), fenster: window.innerHeight,
           leisteUnten: Math.round(lr?.bottom || 0) };
});
p('Der Arbeitsraum ist da', raum.da);
p('Die Reiterzeile steht ÜBER ihm', raum.leisteUnten <= raum.oben + 1,
  `Zeile bis ${raum.leisteUnten}, Raum ab ${raum.oben}`);
p('Und sein Fuss bleibt im Fenster', raum.unten <= raum.fenster,
  `${raum.unten} von ${raum.fenster}`);
p('Er ist trotzdem noch brauchbar hoch', raum.hoch >= 400, `${raum.hoch} px`);

/* ==========================================================================
 * §7 · Kein Kürzel, das etwas anderes tut als angeschrieben
 * --------------------------------------------------------------------------
 * Strg+T und Strg+W gehören dem Browser; Redion bindet sie bewusst NICHT
 * (die Begründung steht in `reiter.ts`). Angeschrieben standen sie trotzdem
 * — im Reiterkreuz, am Plusknopf und in der Befehlsliste. Wer sie las und
 * drückte, schloss sein Browserfenster.
 *
 * Kann das rot werden? Vor E300 stand dort wörtlich „Strg + W" und „Strg T".
 * ========================================================================*/
console.log('\n7 · Kein Kürzel, das etwas anderes tut als angeschrieben');

const titel = await pc.evaluate(() => {
  const el = document.getElementById('reiterleiste');
  return {
    kreuz: el?.querySelector('button[data-zu]')?.getAttribute('title') || '',
    plus: el?.querySelector('.rt-plus')?.getAttribute('title') || '',
    kreuzName: el?.querySelector('button[data-zu]')?.getAttribute('aria-label') || '',
    gewaehlt: [...(el?.querySelectorAll('.rt-tab') || [])]
      .map(t => t.getAttribute('aria-selected')),
    aktiv: Fenster.aktiv()
  };
});
p('Das Kreuz nennt Strg + Alt + W', /Strg \+ Alt \+ W/.test(titel.kreuz), titel.kreuz);
p('Der Plusknopf nennt Strg + Alt + N', /Strg \+ Alt \+ N/.test(titel.plus), titel.plus);
p('Und keines von beiden nennt mehr das Browserkürzel',
  !/Strg \+ [TW]\)/.test(titel.kreuz + titel.plus), titel.kreuz + ' | ' + titel.plus);
p('Das Kreuz sagt einem Screenreader, WAS es schliesst',
  /schliessen$/.test(titel.kreuzName) && titel.kreuzName.length > 12, titel.kreuzName);
p('Und die Zeile meldet, welcher Reiter gewählt ist (§38)',
  titel.gewaehlt.filter(x => x === 'true').length === 1 &&
  titel.gewaehlt.indexOf('true') === titel.aktiv,
  `${JSON.stringify(titel.gewaehlt)}, aktiv ${titel.aktiv}`);

const befehle = await pc.evaluate(() => {
  const alle = (Werkzeuge as any).liste ? (Werkzeuge as any).liste() : null;
  return alle;
});
if (befehle) {
  const reiterBefehle = (befehle as any[]).filter(b => /Reiter/.test(String(b[1] ?? b.name ?? '')));
  p('Auch die Befehlsliste nennt kein Strg T oder Strg W mehr',
    !JSON.stringify(reiterBefehle).includes('"Strg T"') &&
    !JSON.stringify(reiterBefehle).includes('"Strg W"'),
    JSON.stringify(reiterBefehle).slice(0, 160));
} else {
  /* Kein Zugriff auf die Liste zur Laufzeit — dann wird die Quelle gelesen.
     Das ist schwächer, aber ehrlicher als ein übersprungener Punkt. */
  const quelle = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8');
  p('Auch die Befehlsliste nennt kein Strg T oder Strg W mehr',
    !/'Neuer Reiter', 'Strg T'/.test(quelle) && !/'Reiter schliessen', 'Strg W'/.test(quelle));
}

/* ========================================================================== */
console.log('\n8 · Keine Fehler auf dem Weg');
p('Keine unbehandelten Ausnahmen', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} — Suite 292 (E300: Reiterzeile für Dokumente)`);
process.exit(weg ? 1 : 0);
