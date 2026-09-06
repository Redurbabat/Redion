/* Suite 385 — Ein offenes Dokument ist der ganze Bildschirm (E384)
 * ============================================================================
 * Redurs Satz kam ein ZWEITES Mal: „ich will das die pdf nicht im bereichen
 * sich öffnet so wie goodnotes scheu wie ist es dort und mache es 1.1 so".
 *
 * E296 hatte den SEITENKOPF weggeräumt — den Kasten INNERHALB der Seite.
 * Stehen blieb die Schale UM sie herum, und genau die meint das Wort
 * „Bereiche". Gemessen, bevor etwas geändert wurde (§55.1):
 *
 *   1440×900   Menüband 0..37 · Kopfzeile 37..91 · Dokumentleiste 92..139 ·
 *              Original-Karte 157..202 → erstes Blatt bei 222 von 900.
 *              Dazu links `#kante`, 54 px breit, über die ganze Höhe.
 *   390×844    dieselben vier Bänder → erstes Blatt bei 232 von 844, und
 *              UNTEN stand noch die Reiterleiste mit rund 90 px.
 *
 * Was E384 daraus macht: `body[data-dokument="an"]`, und darunter fallen
 * Menüband, Kopfzeile, Kante und untere Leiste weg. Der Weg zurück steht als
 * `‹ Dokumente` in der Dokumentleiste; Original-Karte und Randstreifen ziehen
 * in den Inspector.
 *
 *   §1 DIE SCHALE IST WEG, solange ein Dokument offen ist — und NUR dann.
 *   §2 DAS PAPIER FÄNGT OBEN AN, und die Zahl ist gemessen, nicht geraten.
 *   §3 DER WEG ZURÜCK ist da und führt aus dem Dokument heraus.
 *   §4 DIE ORIGINAL-KARTE steht im Inspector und nicht über dem Papier.
 *   §5 DER RANDSTREIFEN steht im Inspector, mit Wort, und schaltet wirklich.
 *   §6 AM TELEFON passt die Leiste ins Fenster — und der Name steht darin.
 *
 *   node pruefungen/lauf/test385.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9403;

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

/* Ein Dokument mit vier Seiten UND einer Originaldatei — die Karte braucht
   einen `file`-Block, sonst hat §4 nichts zu messen. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  /* Der Willkommens-Rundgang liegt als Dialog ÜBER allem und fängt jeden
     Klick ab; die Marke oben verhindert nur den nächsten Aufruf. */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
  Store.addBlock(s.id, 'file', { text: 'Skript.pdf', dateiId: 'datei-1', original: true });
  for (let nr = 1; nr <= 4; nr++)
    Store.addBlock(s.id, 'pdfseite', { text: '', suchtext: 'Ohm', nr, vonSeiten: 4,
      bw: 595, bh: 842, quelleId: 'skript-1' });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1400));
  return s.id;
})()`;

/* Eine gewöhnliche Seite — die Gegenprobe zu §1. */
const GEWOEHNLICH = `(async () => {
  const s = Store.addPage(null, { text: 'Eine gewöhnliche Seite', icon: '📄' });
  Store.addBlock(s.id, 'text', { text: 'Hallo' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
  return s.id;
})()`;

/* ACHTUNG: Vorlagenzeichenketten. Kein Backtick und kein Backslash in den
   Kommentaren hier drin — beides beendet den Ausdruck, und der Fehler kommt
   dann aus einer ganz anderen Ecke. */
const MESS = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { t: Math.round(b.top), h: Math.round(b.height), w: Math.round(b.width),
             l: Math.round(b.left), sicht: b.height > 0 && b.width > 0 }; };
  const q = (s) => r(document.querySelector(s));
  const tb = document.querySelector('.document-topbar');
  return {
    marke: document.body.dataset.dokument || '',
    menueband: q('#menueband'), topbar: q('#topbar'),
    werkzeuge: q('#studio-tools'),
    kante: q('#kante'), handyOben: q('#handy-oben'),
    leiste: q('.document-topbar'),
    papier: q('.document-center .document-stage'),
    fenster: { w: window.innerWidth, h: window.innerHeight },
    leisteUeber: tb ? { scrollW: tb.scrollWidth, clientW: tb.clientWidth } : null,
    zurueck: q('.document-topbar .document-zurueck'),
    zurueckWort: (document.querySelector('.document-topbar .document-zurueck .dz-wort') || {}).textContent || '',
    titel: q('.document-title'),
    titelText: (document.querySelector('.document-title') || {}).textContent || '',
    originalUeberPapier: !!document.querySelector('.document-center > .document-original'),
    originalImInspector: !!document.querySelector('.document-inspector .document-original'),
    randInLeiste: !!document.querySelector('.document-topbar [data-document-action="rand"]'),
    randImInspector: (document.querySelector('.document-inspector .document-rand-knopf') || {}).textContent || '',
    randAn: !!document.querySelector('.document-inspector .document-rand-knopf.an')
  };
})()`;

const browser = await chromium.launch();
const fehler: string[] = [];

const pc = await browser.newPage({ viewport: { width: 1440, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR (Rechner): ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
const dokId = await pc.evaluate(AUFBAU) as string;
await pc.waitForSelector('.document-workspace', { timeout: 20000 });
await pc.waitForTimeout(400);
let m = await pc.evaluate(MESS) as any;

/* ==========================================================================
 * §1 · Die Schale ist weg — und nur, solange ein Dokument offen ist
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Vor E384 standen alle vier da; jede einzelne
 * Zeile hier wäre gefallen. Und die Gegenprobe am Ende ist der eigentliche
 * Wächter: eine Regel, die IMMER ausblendet, hätte Redion die Schale ganz
 * genommen. Sie muss auf einer gewöhnlichen Seite wieder stehen.
 * ======================================================================== */
console.log('\n1 · Die Schale ist weg, solange ein Dokument offen ist');
gleich('Der Körper trägt die Marke „an"', m.marke, 'an');
p('Das Menüband steht nicht mehr da', !m.menueband?.sicht,
  JSON.stringify(m.menueband));
p('Die Kopfzeile steht nicht mehr da', !m.topbar?.sicht,
  JSON.stringify(m.topbar));
p('Die Kontextkante steht nicht mehr da', !m.kante?.sicht,
  JSON.stringify(m.kante));
p('Und die Kante hält auch keine leere Rasterspalte mehr frei',
  (m.papier?.l ?? 999) < 54, 'Papier beginnt bei ' + m.papier?.l);

console.log('\n2 · Das Papier fängt oben an');
/* Vor E384 gemessen: 222 von 900. Die Schranke ist bewusst grosszügig — sie
   soll den Rückfall fangen, nicht ein paar Pixel Feinschliff verbieten. */
/* SEIT E464 (Redurs Schreibstudio) stehen über dem Papier die Reiterleiste
   (48), die Kopfzeile, die Zeichenleiste und die Original-Karte — gemessen
   254 von 900 am Rechner, 245 von 844 am Telefon. Die Schranke ist 30 %:
   sie fängt weiterhin den Rückfall (222 + Menüband + Kopfzeile wären 40 %),
   ohne Redurs abgenommene Anordnung zu verbieten. */
p('Das erste Blatt beginnt im oberen Drittel des Fensters',
  (m.papier?.t ?? 9999) < m.fenster.h * 0.30,
  'Blatt bei ' + m.papier?.t + ' von ' + m.fenster.h);
p('Die Kopfzeile des Dokuments steht direkt unter der Reiterleiste — sonst nichts',
  (m.leiste?.t ?? -1) >= 0 && (m.leiste?.t ?? 0) <= 56,
  JSON.stringify(m.leiste));
p('Das Papier nimmt die Breite, die die Kante nicht mehr braucht',
  (m.papier?.w ?? 0) > 1340, 'breit: ' + m.papier?.w);

console.log('\n3 · Der Weg zurück steht im Dokument');
p('Ein Zurück-Knopf ist da', !!m.zurueck?.sicht, JSON.stringify(m.zurueck));
gleich('Er sagt am Rechner, wohin er führt', m.zurueckWort, 'Dokumente');
p('Er steht ganz links in der Leiste', (m.zurueck?.l ?? 9999) < 120,
  'links: ' + m.zurueck?.l);
/* UND ER FÜHRT AUCH WIRKLICH HINAUS. Ein Knopf, der nur dasteht, wäre
   schlimmer als keiner — die Schale ist ja weg, und er ist die einzige Tür.
   §55.2: der Abschnitt KANN rot werden — würde `Register.navigation` den
   Eintrag `bibliothekOben` nicht mehr führen, käme nur ein Hinweis. */
await pc.click('.document-topbar .document-zurueck');
await pc.waitForTimeout(900);
const nachZurueck = await pc.evaluate(`(() => ({
  marke: document.body.dataset.dokument || '',
  regal: !!document.querySelector('.bib-wrap, .bibliothek, [data-bereich="bibliothek"]'),
  dokLeiste: !!document.querySelector('.document-topbar')
}))()`) as any;
p('Nach dem Druck ist kein Dokument mehr offen', nachZurueck.dokLeiste === false,
  JSON.stringify(nachZurueck));
gleich('Und die Marke am Körper ist weg', nachZurueck.marke, '');

/* Zurück ins Dokument für die folgenden Abschnitte. */
await pc.evaluate((id: string) => App.oeffne(id), dokId);
await pc.waitForSelector('.document-workspace', { timeout: 20000 });
await pc.waitForTimeout(500);
m = await pc.evaluate(MESS) as any;
gleich('Das Dokument geht wieder als Dokument auf', m.marke, 'an');

console.log('\n4 · Die Original-Karte steht über der Arbeitskopie UND im Inspector');
/* E385 nahm sie vom Papier in den Inspector; Redurs Schreibtisch (E464) stellt
   sie als Kopf der Arbeitskopie zurück — sein test437 verlangt genau das
   („Original über der Arbeitskopie sichtbar"). Der Inspector behält sie. */
p('Über der Arbeitskopie steht sie (E464)', m.originalUeberPapier);
/* Der Inspector ist zu (E296 Punkt 2) — also erst öffnen. */
await pc.click('.document-topbar [data-document-action="inspector"]');
await pc.waitForTimeout(500);
m = await pc.evaluate(MESS) as any;
p('Im geöffneten Inspector steht sie', m.originalImInspector);
p('Und das Papier bleibt im oberen Drittel, auch mit offenem Inspector',
  (m.papier?.t ?? 9999) < m.fenster.h * 0.30, 'Blatt bei ' + m.papier?.t);

console.log('\n5 · Der Randstreifen steht im Inspector, mit Wort');
p('In der Leiste steht er nicht mehr', !m.randInLeiste);
gleich('Im Inspector sagt er, was ein Druck bewirkt',
  m.randImInspector, '⇥ Randstreifen an');
p('Vorher ist er aus', !m.randAn);
await pc.click('.document-inspector .document-rand-knopf');
await pc.waitForTimeout(800);
m = await pc.evaluate(MESS) as any;
gleich('Nach dem Druck sagt er das Gegenteil', m.randImInspector, '⇥ Randstreifen aus');
p('Und er ist jetzt gefärbt', m.randAn);
const randBreite = await pc.evaluate((id: string) =>
  Number(Store.getBlock(id)?.randBreite) || 0, dokId);
p('Am Dokument steht wirklich ein Rand', randBreite > 0, 'randBreite: ' + randBreite);

/* ══ DIE GEGENPROBE ZU §1 ═══════════════════════════════════════════════════
   Ohne sie wäre eine Regel, die IMMER ausblendet, grün — und Redion hätte
   keine Schale mehr. Der Abschnitt KANN rot werden: würde `zeichneSeite` die
   Marke nicht löschen, bliebe sie nach dem Wechsel stehen. */
console.log('\n6 · Auf einer gewöhnlichen Seite steht die Schale wieder');
await pc.evaluate(GEWOEHNLICH);
await pc.waitForTimeout(700);
m = await pc.evaluate(MESS) as any;
gleich('Die Marke ist wieder weg', m.marke, '');
/* SEIT DEM STUDIO-KOPF IST DAS BAND AM RECHNER EINE LADE (6. September):
   es steht erst da, wenn `#studio-tools` es holt. Was nach dem Dokument
   zurückkommen muss, ist deshalb der GRIFF — und hinter ihm das Band. Ein
   Band, das ohne Griff dastünde, wäre der alte Zustand, nicht der neue. */
p('Der Werkzeuggriff steht wieder da', !!m.werkzeuge?.sicht, JSON.stringify(m.werkzeuge));
await pc.evaluate(`Menueband.aufklappen()`);
await pc.waitForTimeout(400);
const mitBand = await pc.evaluate(MESS) as any;
p('… und er holt das Menüband zurück', !!mitBand.menueband?.sicht, JSON.stringify(mitBand.menueband));
await pc.evaluate(`Menueband.schliessen()`);
await pc.waitForTimeout(200);
p('Die Kopfzeile steht wieder da', !!m.topbar?.sicht, JSON.stringify(m.topbar));
p('Die Kontextkante steht wieder da', !!m.kante?.sicht, JSON.stringify(m.kante));

await pc.close();

/* ==========================================================================
 * §7 · Am Telefon passt die Leiste ins Fenster — und der Name steht darin
 * --------------------------------------------------------------------------
 * §55.2 — kann das rot werden? Beide Messungen waren beim ersten Versuch rot:
 * die Leiste war 411 px breit in einem 390 px breiten Fenster (der Ausgang
 * stand 21 px AUSSERHALB), und der Titel war seit E296 ausgeblendet, weil er
 * „ohnehin im Pfad darüber steht" — dieser Pfad ist seit E384 weg.
 * ======================================================================== */
const handy = await browser.newPage({ viewport: { width: 390, height: 844 },
                                      isMobile: true, hasTouch: true });
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2700);
await handy.evaluate(AUFBAU);
await handy.waitForSelector('.document-workspace', { timeout: 20000 });
await handy.waitForTimeout(500);
const h = await handy.evaluate(MESS) as any;

console.log('\n7 · Am Telefon');
p('Die untere Reiterleiste steht nicht mehr da', !h.handyOben?.sicht,
  JSON.stringify(h.handyOben));
p('Die Dokumentleiste läuft nicht über das Fenster hinaus',
  (h.leisteUeber?.scrollW ?? 9999) <= (h.leisteUeber?.clientW ?? 0),
  JSON.stringify(h.leisteUeber));
p('Das erste Blatt beginnt im oberen Drittel (E464: 245 von 844)',
  (h.papier?.t ?? 9999) < h.fenster.h * 0.30,
  'Blatt bei ' + h.papier?.t + ' von ' + h.fenster.h);
p('Der Zurück-Pfeil ist da', !!h.zurueck?.sicht, JSON.stringify(h.zurueck));
p('Aber ohne Wort — dafür ist kein Platz', !h.zurueck || h.zurueck.w <= 52,
  'breit: ' + h.zurueck?.w);
p('Der Name des Dokuments steht in der Leiste', !!h.titel?.sicht,
  JSON.stringify(h.titel));
gleich('Und es ist der richtige', h.titelText, 'Elektrotechnik – Skript');
/* E296 mass für den Titel rund 30 px und las „E.". Mehr als hundert Pixel
   heisst: ein Name, kein Buchstabe mit Punkt. */
p('Er hat mehr als hundert Pixel — kein „E." mehr',
  (h.titel?.w ?? 0) > 100, 'breit: ' + h.titel?.w);
/* Kein zweiter, gleich aussehender Pfeil daneben (der Bildfund). */
const pfeile = await handy.$$eval('.document-topbar button',
  (bs: Element[]) => bs.filter(b => (b.textContent || '').trim().startsWith('‹')
                                 && (b as HTMLElement).offsetParent !== null).length);
gleich('Nur EIN ‹ in der Leiste, nicht zwei mit zwei Bedeutungen', pfeile, 1);

await handy.close();
await browser.close();
server.close();

console.log('\n' + (fehler.length ? 'Fehler auf der Seite:\n  ' + fehler.join('\n  ') + '\n' : ''));
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
console.log('\n' + ok + ' bestanden, ' + weg + ' durchgefallen');
process.exit(weg ? 1 : 0);
