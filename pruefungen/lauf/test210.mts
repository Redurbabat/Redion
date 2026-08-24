/* Suite 176 — Der PDF-Arbeitsplatz, am Rechner und am Telefon (§17, §32)
 * ============================================================================
 * §17 des Auftrags zeichnet den Arbeitsplatz als Bild:
 *
 *     ┌ Miniaturen ┬──────── PDF / Blatt ────────┬ Inspector ┐
 *
 * und schreibt für das Telefon dazu: „volle Breite, keine gequetschten drei
 * Spalten, Miniaturen als Sheet/Drawer, Inspector als Bottom Sheet".
 *
 * Gebaut war das (E126). Geprüft war es nicht — und was nicht geprüft ist,
 * ist beim nächsten Umbau zufällig. Diese Suite hält die vier Zusagen fest.
 *
 * ─── WAS DAS HINSEHEN GEBRACHT HAT (§55) ────────────────────────────────────
 * Beim ersten Bildschirmfoto standen zwei Dinge da, die keine Prüfung sehen
 * konnte, weil beide kein Verhalten sind:
 *
 *   · „Zurueck" und „Loeschen" ohne Umlaut (dafür jetzt test87 §10).
 *   · Am Telefon war die Zeichenleiste 211 px breit bei 1059 px Inhalt —
 *     17 von 21 Knöpfen draussen. Rund 100 px davon frass ein zweiter
 *     Seitenzähler, der dieselbe Zahl sagte wie die Kopfzeile darüber.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Jede Zusage einzeln zurückgenommen und nachgemessen; die Zahlen stehen
 * beim jeweiligen Abschnitt.
 *
 *   node pruefungen/lauf/test210.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8969;

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

/** Eine Seite mit vier PDF-Seiten im Dokumentmodus — der Aufbau ist am
    Rechner und am Telefon derselbe, nur das Fenster ist anders. */
const AUFBAU = `(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const s = Store.addPage(null, { text: 'Elektrotechnik – Skript', icon: '📕' });
  for (let nr = 1; nr <= 4; nr++)
    Store.addBlock(s.id, 'pdfseite', {
      text: '', suchtext: 'Ohmsches Gesetz', nr, vonSeiten: 4,
      bw: 595, bh: 842, quelleId: 'skript-1' });
  Store.updateBlock(s.id, { dokumentModus: true });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1300));
  return s.id;
})()`;

/* ==========================================================================
 * §1 · Am Rechner stehen die drei Bereiche nebeneinander
 * --------------------------------------------------------------------------
 * Gegenprobe: mit `dokumentModus` auf `false` gibt es weder Miniaturen noch
 * Inspector — gemessen 0 und 0, und die drei ersten Punkte fallen.
 * ========================================================================*/
console.log('\n1 · Am Rechner stehen die drei Bereiche nebeneinander');

const pc = await browser.newPage({ viewport: { width: 1440, height: 950 } });
pc.on('pageerror', e => fehler.push('PAGEERROR (Rechner): ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2700);
await pc.evaluate(AUFBAU);
await pc.waitForTimeout(400);

const raum = await pc.evaluate(() => {
  const kasten = (wahl: string) => {
    const el = document.querySelector(wahl) as HTMLElement | null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { links: Math.round(r.left), rechts: Math.round(r.right), breit: Math.round(r.width) };
  };
  return {
    arbeitsraum: !!document.querySelector('.document-workspace'),
    miniaturen: document.querySelectorAll('.document-thumbnail').length,
    mini: kasten('.document-thumbnail'),
    mitte: kasten('.document-center'),
    inspektor: kasten('.document-inspector-heading'),
    inspektorText: (document.querySelector('.document-inspector-heading')?.textContent || '').trim(),
    zaehler: [...document.querySelectorAll('.document-inspector-summary')]
      .map(x => (x.textContent || '').replace(/\s+/g, ' ').trim()).join(' | ')
  };
});

p('Der Arbeitsraum steht', raum.arbeitsraum);
gleich('Vier Miniaturen, eine je Seite', raum.miniaturen, 4);
p('Die Miniaturen stehen links vom Dokument',
  !!raum.mini && !!raum.mitte && raum.mini.rechts <= raum.mitte.links + 2,
  `${JSON.stringify(raum.mini)} vs ${JSON.stringify(raum.mitte)}`);
p('Der Inspector steht rechts davon',
  !!raum.inspektor && !!raum.mitte && raum.inspektor.links >= raum.mitte.rechts - 2,
  `${JSON.stringify(raum.inspektor)} vs ${JSON.stringify(raum.mitte)}`);
p('Der Inspector nennt das Dokument beim Namen',
  /Elektrotechnik/.test(raum.inspektorText), raum.inspektorText);
p('Und zählt, was mit der Stelle verbunden ist',
  /Lernkarten|Aufgaben|Notizen/.test(raum.zaehler), raum.zaehler);

/* ==========================================================================
 * §2 · Die Zeichenleiste sagt deutsch, was sie tut
 * --------------------------------------------------------------------------
 * Der Befund aus dem Bildschirmfoto, hier an der laufenden App statt am
 * Quelltext. test87 §10 hält die Quelle sauber, dieser Punkt das Ergebnis.
 * ========================================================================*/
console.log('\n2 · Die Zeichenleiste sagt deutsch, was sie tut');

const wortlaut = await pc.evaluate(() => {
  const leiste = document.querySelector('.blatt-werk');
  const worte = [...(leiste?.querySelectorAll('.wort') || [])]
    .map(x => (x.textContent || '').trim());
  const titel = [...(leiste?.querySelectorAll('button') || [])]
    .map(x => x.getAttribute('title') || '');
  return { worte, titel };
});
p('Kein Knopfwort schreibt einen Umlaut aus',
  !wortlaut.worte.some(w => /ue|oe|ae/i.test(w)),
  wortlaut.worte.filter(w => /ue|oe|ae/i.test(w)).join(', '));
p('Und keine Erklärung',
  !wortlaut.titel.some(w => /rueck|loesch|auswaehl|durchlaessig|geglaettet/i.test(w)),
  wortlaut.titel.filter(w => /rueck|loesch|auswaehl|durchlaessig|geglaettet/i.test(w)).join(', '));
p('„Zurück" und „Löschen" stehen da',
  wortlaut.worte.includes('Zurück') && wortlaut.worte.includes('Löschen'),
  wortlaut.worte.join(', '));

/* ==========================================================================
 * §3 · Am Telefon: volle Breite, keine drei Spalten
 * --------------------------------------------------------------------------
 * Gegenprobe (`thumbnailsOpen: true, inspectorOpen: true` erzwungen): beide
 * Punkte zur Zuklappung werden rot.
 *
 * NACHGEMESSEN UND ANDERS ALS ERWARTET: die Breite der Mitte blieb dabei
 * über 330 px. Am Telefon stapeln sich die drei Bereiche also, sie quetschen
 * sich nicht — das Dokument wird nicht schmal, sondern nach unten geschoben.
 * Der Punkt „fast die ganze Breite" allein hätte den Fehler nicht gesehen;
 * deshalb stehen die zwei Sichtbarkeitspunkte daneben.
 * ========================================================================*/
console.log('\n3 · Am Telefon: volle Breite, keine drei Spalten');

const handy = await browser.newPage({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3
});
handy.on('pageerror', e => fehler.push('PAGEERROR (Telefon): ' + e.message.slice(0, 140)));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2700);
await handy.evaluate(AUFBAU);
await handy.waitForTimeout(400);

const eng = await handy.evaluate(() => {
  const sichtbar = (wahl: string): boolean => {
    const el = document.querySelector(wahl) as HTMLElement | null;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4;
  };
  const mitte = document.querySelector('.document-center') as HTMLElement | null;
  return {
    mitteBreit: mitte ? Math.round(mitte.getBoundingClientRect().width) : -1,
    miniaturenOffen: sichtbar('.document-thumbnail'),
    inspektorOffen: sichtbar('.document-inspector-heading'),
    ueberlauf: document.documentElement.scrollWidth - innerWidth
  };
});
p('Das Dokument bekommt fast die ganze Breite', eng.mitteBreit >= 330,
  `${eng.mitteBreit} von 390 px`);
gleich('Die Miniaturen liegen zugeklappt', eng.miniaturenOffen, false);
gleich('Der Inspector auch', eng.inspektorOffen, false);
p('Und die Seite läuft nicht seitlich über', eng.ueberlauf <= 1, `${eng.ueberlauf} px`);

/* Beide lassen sich öffnen — zugeklappt ist nur richtig, wenn man sie
   wiederbekommt. */
const geoeffnet = await handy.evaluate(async () => {
  const werkzeug = document.querySelector('.document-topbar button') as HTMLElement | null;
  werkzeug?.click();
  await new Promise(r => setTimeout(r, 500));
  const miniDa = document.querySelectorAll('.document-thumbnail').length;
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.document-topbar button')];
  knoepfe[knoepfe.length - 2]?.click();
  await new Promise(r => setTimeout(r, 500));
  return { miniDa, inspektorDa: !!document.querySelector('.document-inspector-heading') };
});
p('Das ☰ holt die Miniaturen hervor', geoeffnet.miniDa >= 4, `${geoeffnet.miniDa}`);
p('Und das ⓘ den Inspector', geoeffnet.inspektorDa);

/* ==========================================================================
 * §4 · Die Zeichenleiste rollt — und zeigt, dass sie rollt
 * --------------------------------------------------------------------------
 * 21 Werkzeuge brauchen 1059 px. Auf ein Telefon passen sie nicht, und das
 * ist in Ordnung — sie rollt. Nicht in Ordnung ist eine Leiste, die
 * abgeschnitten aussieht wie eine vollständige (§55.1).
 *
 * Gegenprobe ohne `rollstand()`: `data-mehr` blieb leer, alle drei Zustände
 * meldeten „(nichts)".
 * Gegenprobe mit dem doppelten Seitenzähler: die Leiste war 211 statt 310 px
 * breit, und der Punkt „mehr als ein Drittel" wurde rot.
 * ========================================================================*/
console.log('\n4 · Die Zeichenleiste rollt — und zeigt, dass sie rollt');

const rollen = await handy.evaluate(async () => {
  const leiste = document.querySelector('.blatt-werk') as HTMLElement | null;
  const reihe = leiste?.closest('.blatt-reihe') as HTMLElement | null;
  if (!leiste || !reihe) return null;
  const knoepfe = [...leiste.querySelectorAll<HTMLElement>('button')];
  const anfang = reihe.dataset['mehr'] || '(nichts)';
  leiste.scrollLeft = Math.round(leiste.scrollWidth / 2);
  await new Promise(r => setTimeout(r, 260));
  const mitte = reihe.dataset['mehr'] || '(nichts)';
  leiste.scrollLeft = leiste.scrollWidth;
  await new Promise(r => setTimeout(r, 260));
  const ende = reihe.dataset['mehr'] || '(nichts)';
  return {
    knoepfe: knoepfe.length,
    breit: Math.round(leiste.getBoundingClientRect().width),
    inhalt: Math.round(leiste.scrollWidth),
    ohneBreite: knoepfe.filter(k => k.getBoundingClientRect().width < 1).length,
    anfang, mitte, ende
  };
});
p('Die Leiste ist da', !!rollen);
if (rollen) {
  p('Alle Werkzeuge sind gebaut', rollen.knoepfe >= 20, `${rollen.knoepfe}`);
  gleich('Und keines ist auf Breite null gesetzt', rollen.ohneBreite, 0);
  p('Sie nimmt mehr als ein Drittel der Fensterbreite',
    rollen.breit >= 290, `${rollen.breit} von 390 px`);
  gleich('Am Anfang zeigt sie nach rechts', rollen.anfang, 'rechts');
  gleich('In der Mitte nach beiden Seiten', rollen.mitte, 'beides');
  gleich('Am Ende nur noch nach links', rollen.ende, 'links');
}

/* ==========================================================================
 * §5 · Dieselbe Seitenzahl steht nicht zweimal auf einem Bildschirm
 * --------------------------------------------------------------------------
 * Gegenprobe: mit dem zweiten Zähler zurück standen „Seite 1/4" oben und
 * „Seite 1 von 4" unten auf 390 px nebeneinander.
 * ========================================================================*/
console.log('\n5 · Dieselbe Seitenzahl steht nicht zweimal auf einem Bildschirm');

const zaehler = await handy.evaluate(() => {
  const kopf = (document.querySelector('.document-position')?.textContent || '').trim();
  const unten = [...document.querySelectorAll<HTMLElement>('.blatt-fest .pdfs-nr')]
    .filter(x => x.getBoundingClientRect().width > 1)
    .map(x => (x.textContent || '').trim());
  return { kopf, unten };
});
p('Die Kopfzeile nennt die Seite', /Seite\s*1\s*\/\s*4/.test(zaehler.kopf), zaehler.kopf);
gleich('Und unten steht sie kein zweites Mal', zaehler.unten, []);

/* ==========================================================================
 * §6 · Auf einer gewöhnlichen Seite bleibt der Zähler stehen
 * --------------------------------------------------------------------------
 * Der Zähler verschwindet NUR im Dokumentmodus, wo die Kopfzeile ihn schon
 * sagt. Ohne diesen Punkt hätte die Regel oben eine PDF-Seite auf einer
 * normalen Seite stumm gemacht — dort ist sie die einzige Angabe.
 * ========================================================================*/
console.log('\n6 · Auf einer gewöhnlichen Seite bleibt der Zähler stehen');

const normal = await handy.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Einzelblatt' });
  Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 2, vonSeiten: 9, bw: 595, bh: 842, quelleId: 'q2' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
  return [...document.querySelectorAll<HTMLElement>('.blatt-fest .pdfs-nr')]
    .filter(x => x.getBoundingClientRect().width > 1)
    .map(x => (x.textContent || '').replace(/\s+/g, ' ').trim());
});
gleich('Dort sagt die Leiste, welche Seite das ist', normal, ['Seite 2 von 9']);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
