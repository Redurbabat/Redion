/* Suite 531 — Das Auge sitzt an JEDEM Ordner, nicht nur im Regal (E611)
 * ============================================================================
 * Redur, 16. September 2026, mit einem Bild der Bibliothekskachel: „und das
 * ist nur bei Bibliothek — ich will überall, wenn ein Ordner erstellt wird,
 * das haben."
 *
 * GEZÄHLT, nicht geschätzt: es gibt genau ZWEI Stellen, die eine
 * Ordner-Kachel zeichnen.
 *
 *   bibliothek.ts  `deckelKarte`  → Auge seit E463, „Blick hinein" seit E459
 *   notebook.ts    `fachCard`     → beides fehlte
 *
 * In den Notizheften gab es also gar keinen Weg, in ein Fach zu sehen, ohne
 * es zu öffnen — weder mit der Maus noch über das ⋯-Menü.
 *
 *   §1 JEDES FACH TRÄGT EIN AUGE, 44 × 44, oben links, genau eines.
 *   §2 DAS AUGE ÖFFNET DIE ORDNERKARTE — und „Ordner öffnen" darin bleibt
 *      IN DEN NOTIZHEFTEN. Das ist der Punkt, der leicht falsch wird: die
 *      Verdrahtung kommt aus der Bibliothek, und deren `geheIn` würde in
 *      die Bibliothek springen.
 *   §3 DER WEG OHNE MAUS (§37): „Blick hinein" steht im ⋯-Menü des Fachs.
 *   §4 DIE BIBLIOTHEK BEHÄLT IHRES — keine Regression an E463/E508.
 *   §5 Keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * Vor dem Bauen war sie es in §1, §2 und §3 — das Auge gab es dort nicht.
 * Die Gegenprobe nach dem Bauen steht in E611.
 *
 *   node pruefungen/lauf/test531.mts
 *   node pruefungen/alle.mts 531
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
declare const Store: any;
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
/* 9639 UND NICHT 9531 (E630). Die Zahl war doppelt vergeben — sie gehörte
   schon einem älteren Lauf, und dessen Port steht in ENTSCHEIDUNGEN.md.
   Zwei Läufe mit derselben Zahl können nie nebeneinander laufen, und ein
   Ergebnis, das aus dem falschen Grund rot ist, ist schlimmer als eines,
   das grün lügt (test400). */
const PORT = 9639;

const TYPEN: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.json': 'application/json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let rein = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  if (rein === '/') rein = '/index.html';
  const datei = path.join(WURZEL, rein);
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('weg'); return;
  }
  res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
  res.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];

/** Zwei Fächer mit je zwei Heften. Ein Heft ist eine Seite mit einem
 *  `blatt` darin — abgelesen in `notebook.ts` (`heftArtig`), nicht
 *  geraten (E21). Ein Fach trägt `heftArt: 'fach'`. */
const mitFaechern = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('heft:reiter', 'dokumente');
    Store.setMeta('heft:fach', '');
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    for (const [name, hefte] of [['Elektrotechnik', ['Kapitel 2', 'Formelsammlung']],
                                 ['Arbeitssicherheit', ['NIV', 'Erste Hilfe']]]) {
      const fach = Store.addPage(null, { text: name, icon: '\\u{1F5C2}', heftArt: 'fach' });
      for (const h of hefte) {
        const heft = Store.addPage(fach.id, { text: h });
        Store.addBlock(heft.id, 'blatt', { papier: 'blanko' });
      }
    }
    await Store.flush();
  })()`);
  return s;
};

const zumRegal = async (s: Page): Promise<void> => {
  await s.evaluate('Notebook.oeffnen()');
  await s.waitForSelector('.nh-regal', { timeout: 20000 });
  await s.waitForTimeout(500);
};

/* ── 1 ────────────────────────────────────────────────────────────────── */
console.log('\n1 · Jedes Fach in den Notizheften trägt ein Auge');
const s1 = await mitFaechern();
await zumRegal(s1);

const lage = await s1.evaluate(() => {
  const faecher = [...document.querySelectorAll('.nh-fach .bib-deckel[data-art="ordner"]')];
  const augen = [...document.querySelectorAll('.nh-fach .bib-blick')] as HTMLElement[];
  const a = augen[0];
  const kachel = faecher[0] as HTMLElement | undefined;
  const ra = a?.getBoundingClientRect(), rk = kachel?.getBoundingClientRect();
  return {
    faecher: faecher.length,
    augen: augen.length,
    masse: ra ? Math.round(ra.width) + '×' + Math.round(ra.height) : '—',
    /* Oben links auf der Kachel heisst: in ihrer linken und oberen Hälfte. */
    linksOben: !!(ra && rk && ra.left < rk.left + rk.width / 2 && ra.top < rk.top + rk.height / 2),
    knopf: a?.tagName === 'BUTTON',
    beschriftet: /Blick in/.test(a?.getAttribute('aria-label') || ''),
    /* Das Auge darf NICHT im Deckelknopf stecken: ein Knopf im Knopf ist
       kein gültiges HTML, und der Klick käme zweimal an (E463). */
    nichtImKnopf: !!a && !a.closest('.bib-deckel')
  };
});
gleich('Zwei Fächer stehen im Regal', lage.faecher, 2);
gleich('… und jedes trägt genau ein Auge', lage.augen, lage.faecher);
gleich('Das Auge misst 44 × 44 px (§37)', lage.masse, '44×44');
p('… und sitzt oben links auf der Kachel', lage.linksOben);
p('Es ist ein Knopf und heißt, wohin es sieht', lage.knopf && lage.beschriftet);
p('… und steckt nicht im Deckelknopf (E463)', lage.nichtImKnopf);

/* ── 2 ────────────────────────────────────────────────────────────────── */
console.log('\n2 · Das Auge öffnet die Ordnerkarte — und bleibt in den Notizheften');
/* Erst fragen, dann klicken: fehlt das Auge, ist dieser Teil rot — aber
   der Lauf stirbt nicht, und §3 bis §5 sagen trotzdem noch etwas. */
const gibtAuge = await s1.$('.nh-fach .bib-blick');
if (gibtAuge) { await gibtAuge.click(); await s1.waitForTimeout(700); }
else p('Es gibt ein Auge zum Anklicken', false, 'kein .nh-fach .bib-blick');
const karte = await s1.evaluate(() => {
  const l = document.querySelector('.ru-fach-lage');
  return { da: !!l, text: (l?.textContent || '').slice(0, 200) };
});
p('Die Ordnerkarte steht offen', karte.da, karte.text.slice(0, 80));
p('… und nennt das Fach, auf das gezeigt wurde', /Elektrotechnik|Arbeitssicherheit/.test(karte.text),
  karte.text.slice(0, 80));

/* Welches Fach war gemeint? VOR dem Klick abgelesen — danach zeichnet das
   Regal das Innere des Fachs, und die Kachel von eben gibt es nicht mehr. */
const gemeint = await s1.evaluate(() =>
  document.querySelector('.nh-fach .bib-blick')?.getAttribute('data-blick') || '');
p('Das Auge nennt die Kennung seines Fachs', /^[0-9a-f-]{8,}$/.test(gemeint), gemeint);

/* „Ordner öffnen" muss in den Notizheften landen. Käme die Verdrahtung
   unverändert aus der Bibliothek, spränge `geheIn` dorthin — das Regal
   wäre weg und der Hash ein anderer. */
const wohin = await s1.evaluate(() => {
  const knopf = [...document.querySelectorAll('.ru-fach-lage button')]
    .find(b => /Ordner öffnen/.test(b.textContent || '')) as HTMLElement | undefined;
  knopf?.click();
  return !!knopf;
});
p('In der Karte gibt es „Ordner öffnen"', wohin);
await s1.waitForTimeout(700);
const danach = await s1.evaluate(() => ({
  regal: !!document.querySelector('.nh-regal'),
  hash: location.hash,
  /* DAS IST DIE ZUSICHERUNG, DIE ROT WERDEN KANN. „Regal steht noch" und
     „Hash unverändert" sind es NICHT: ruft die Karte das `geheIn` der
     Bibliothek, ändert sich dort nur unsichtbar etwas, und beide blieben
     grün — gemessen, die Gegenprobe war es. `heft:fach` dagegen setzt
     einzig `openFach`. */
  offenesFach: String(Store.getMeta('heft:fach', '') || '')
}));
gleich('… und danach steht man IN DIESEM Fach der Notizhefte',
  danach.offenesFach, gemeint);
p('… das Regal steht noch und der Weg ist unverändert',
  danach.regal && danach.hash === '#notizhefte', JSON.stringify(danach));

/* ── 3 ────────────────────────────────────────────────────────────────── */
console.log('\n3 · Der Weg ohne Maus: „Blick hinein" im ⋯-Menü (§37)');
const s3 = await mitFaechern();
await zumRegal(s3);
const gibtMehr = await s3.$('.nh-fach [data-mehr-fach]');
if (gibtMehr) { await gibtMehr.click(); await s3.waitForTimeout(400); }
const menue = await s3.evaluate(() => {
  const m = document.querySelector('.menu');
  return { da: !!m, text: (m?.textContent || '') };
});
p('Das ⋯-Menü eines Fachs geht auf', menue.da);
p('… und bietet „Blick hinein"', /Blick hinein/.test(menue.text), menue.text.slice(0, 120));

const ausMenue = await s3.evaluate(() => {
  const b = [...document.querySelectorAll('.menu [data-a]')]
    .find(x => /Blick hinein/.test(x.textContent || '')) as HTMLElement | undefined;
  b?.click();
  return !!b;
});
await s3.waitForTimeout(700);
p('… und der Eintrag öffnet die Karte',
  ausMenue && await s3.evaluate(() => !!document.querySelector('.ru-fach-lage')));

/* ── 4 ────────────────────────────────────────────────────────────────── */
console.log('\n4 · Die Bibliothek behält ihres (keine Regression an E463/E508)');
const s4 = await mitFaechern();
await s4.evaluate('Bibliothek.oeffne()');
await s4.waitForTimeout(800);
const bib = await s4.evaluate(() => {
  const augen = [...document.querySelectorAll('.bib-zelle .bib-blick[data-blick]')] as HTMLElement[];
  const r = augen[0]?.getBoundingClientRect();
  return { augen: augen.length,
    ordner: document.querySelectorAll('.bib-deckel[data-art="ordner"]').length,
    masse: r ? Math.round(r.width) + '×' + Math.round(r.height) : '—' };
});
gleich('Im Regal trägt weiterhin jeder Ordner sein Auge', bib.augen, bib.ordner);
gleich('… unverändert 44 × 44 px', bib.masse, '44×44');
const gibtBibAuge = await s4.$('.bib-zelle .bib-blick[data-blick]');
if (gibtBibAuge) { await gibtBibAuge.click(); await s4.waitForTimeout(700); }
p('… und es öffnet die Karte wie bisher',
  await s4.evaluate(() => !!document.querySelector('.ru-fach-lage')));

/* ── 5 ────────────────────────────────────────────────────────────────── */
console.log('\n5 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
