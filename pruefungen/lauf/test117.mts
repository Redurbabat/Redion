/* Suite 81 — Der Sicherungsstand steht auf dem Start-Bildschirm, und er stimmt
 * ============================================================================
 * DER FEHLER, DER DAZU FÜHRTE. Den Zeitstempel `sicherung:zuletzt` schrieb
 * einzig `Krypto.sicherungSchreiben` — der Weg über den Verschlüsselungs-
 * Dialog. Der Hauptweg, `App.sicherungSpeichern`, schrieb ihn nicht: nicht aus
 * den Einstellungen, nicht aus der PWA, nicht aus der Befehlsleiste, nicht aus
 * der Pflegeseite. Alle vier Knöpfe führen dorthin.
 *
 * Wer also normal sicherte — und das tun alle — bekam bis in alle Ewigkeit
 * „Noch nie gesichert." zu lesen. Der Fehler war unsichtbar, solange die
 * Anzeige drei Klicks tief in den Einstellungen lag. Sobald sie auf dem
 * Start-Bildschirm steht, ist sie eine Lüge, die jeden Morgen mitliest.
 *
 * WAS DIESER LAUF MISST:
 *
 *   1. Ohne Sicherung: die deutliche Warnung, mit Knopf.
 *   2. Lange her: dieselbe Warnung, aber mit Datum.
 *   3. Eine Woche her: der leisere Hinweis.
 *   4. Frisch: eine ruhige Zeile, keine Ermahnung.
 *   5. `App.sicherungSpeichern` hinterlässt die Marke — der eigentliche Fehler.
 *   6. Ein unlesbarer Zeitstempel gilt als „nie", nicht als „frisch".
 *   7. „Privat" listet die eigenen Seiten oberster Ebene.
 *   8. „Schnellzugriff" zeigt, was mit ★ markiert ist — und nichts, wenn nichts
 *      markiert ist.
 *   9. Auf Handy-Breite ist der Knopf zu treffen (44px).
 *
 * WARUM PUNKT 6 DRINSTEHT. `new Date('kaputt')` ergibt `NaN`, und `NaN` in
 * einer Differenz ergibt wieder `NaN`. Ein `NaN >= 30` ist `false` — die
 * Warnung wäre also ausgeblieben und der Nutzer hätte „frisch gesichert"
 * gelesen, obwohl gar nichts dastand. Fehler dieser Sorte melden sich nie.
 *
 *   node pruefungen/lauf/test117.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9502;

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

const browser = await chromium.launch();
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(3200);
/* Die Begrüssung liegt sonst über dem Start-Bildschirm. */
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-einladung')?.remove();
  document.getElementById('rg-neu')?.remove();
});

type Band = { klasse: string; text: string; knopf: string; da: boolean };

/** Stand setzen und den Start-Bildschirm neu zeichnen. */
const stand = async (tage: number | null, art: string): Promise<Band> => {
  await seite.evaluate(([tage, art]) => {
    Store.setMeta('sicherung:zuletzt',
      tage === null ? '' : new Date(Date.now() + Number(tage) * 86400000).toISOString());
    Store.setMeta('sicherung:art', art);
    Ansichten.start();
  }, [tage, art] as [number | null, string]);
  await seite.waitForTimeout(200);
  return seite.evaluate(() => {
    const e = document.querySelector('.home-sich');
    const k = e?.querySelector<HTMLElement>('[data-a="sichern"]');
    return {
      da: !!e,
      klasse: e ? e.className : '',
      text: e instanceof HTMLElement ? e.innerText.replace(/\n/g, ' ') : '',
      knopf: k ? (k.textContent ?? '') : ''
    };
  }) as Promise<Band>;
};

console.log('\n1 · Noch nie gesichert — die deutliche Warnung');

const nie = await stand(null, '');
p('Das Band steht auf dem Start-Bildschirm', nie.da,
  'ohne Anzeige merkt niemand, dass nie gesichert wurde');
p('Es warnt', nie.klasse.includes('home-sich-warnen'), nie.klasse);
p('Und sagt es im Klartext', nie.text.includes('Noch nie gesichert'), nie.text);
p('Mit einem Knopf, der etwas tut', nie.knopf.includes('Jetzt sichern'), nie.knopf);
/* Ein Hinweis ohne Ausweg ist eine Beschwerde. */
p('Und einer Erklärung, warum das zählt',
  nie.text.includes('nur in diesem Browser'), nie.text);

console.log('\n2 · Lange her — dieselbe Deutlichkeit, anderer Satz');

const alt = await stand(-45, 'redion');
p('Warnt weiterhin', alt.klasse.includes('home-sich-warnen'), alt.klasse);
p('Nennt die Tage', alt.text.includes('vor 45 Tagen'), alt.text);
p('Behauptet nicht mehr „nie"', !alt.text.includes('Noch nie'), alt.text);

console.log('\n3 · Über eine Woche — der leisere Hinweis');

const mittel = await stand(-12, 'json');
p('Erinnert, statt zu warnen', mittel.klasse.includes('home-sich-erinnern'), mittel.klasse);
p('Nennt die Tage', mittel.text.includes('vor 12 Tagen'), mittel.text);

console.log('\n4 · Frisch gesichert — Ruhe');

const frisch = await stand(-1, 'redion');
p('Keine Warnung, keine Erinnerung', frisch.klasse.includes('home-sich-gut'), frisch.klasse);
p('Sondern eine Bestätigung', frisch.text.includes('Gesichert'), frisch.text);
/* Genau hier verliert eine Anzeige ihren Wert: wenn sie auch dann mahnt,
   wenn alles stimmt. Dann lernt man, sie zu übersehen. */
p('Ohne Ausrufezeichen', !frisch.text.includes('Jetzt sichern'), frisch.text);

const heute = await stand(0, 'redion');
p('Heute gesichert heisst „heute"', heute.text.includes('heute'), heute.text);

const jsonFrisch = await stand(-2, 'json');
p('Bei einer JSON-Sicherung steht dabei, dass Anhänge fehlen',
  jsonFrisch.text.includes('ohne Anhänge'), jsonFrisch.text);
const vollFrisch = await stand(-2, 'redion');
p('Bei der vollständigen Sicherung steht das nicht',
  !vollFrisch.text.includes('ohne Anhänge'), vollFrisch.text);

console.log('\n5 · Sichern hinterlässt die Marke — der eigentliche Fehler');

await seite.evaluate(() => {
  Store.setMeta('sicherung:zuletzt', '');
  Store.setMeta('sicherung:art', '');
});
const vorher = await seite.evaluate(() => String(Store.getMeta('sicherung:zuletzt', '')));
p('Vorher steht nichts da', vorher === '', vorher);

await seite.evaluate(() => App.sicherungSpeichern());
await seite.waitForTimeout(1500);
const nachher = await seite.evaluate(() => ({
  wann: String(Store.getMeta('sicherung:zuletzt', '')),
  art: String(Store.getMeta('sicherung:art', ''))
})) as { wann: string; art: string };

p('`App.sicherungSpeichern` merkt sich, dass gesichert wurde',
  !!nachher.wann && !Number.isNaN(Date.parse(nachher.wann)),
  'genau das fehlte: der Hauptweg schrieb die Marke nie, ' +
  'also stand ewig „Noch nie gesichert" da');
p('Und merkt sich, was für eine Sicherung es war',
  nachher.art === 'json' || nachher.art === 'redion', nachher.art);

await seite.evaluate(() => Ansichten.start());
await seite.waitForTimeout(200);
const danach = await seite.evaluate(() =>
  document.querySelector('.home-sich')?.className ?? '') as string;
p('Der Start-Bildschirm zeigt danach den ruhigen Stand',
  danach.includes('home-sich-gut'), danach);

console.log('\n6 · Ein kaputter Zeitstempel gilt als „nie"');

const kaputt = await stand(null, '');
await seite.evaluate(() => {
  Store.setMeta('sicherung:zuletzt', 'irgendwas');
  Ansichten.start();
});
await seite.waitForTimeout(200);
const unlesbar = await seite.evaluate(() => {
  const e = document.querySelector('.home-sich');
  return { klasse: e?.className ?? '', text: e instanceof HTMLElement ? e.innerText.replace(/\n/g, ' ') : '' };
}) as { klasse: string; text: string };
p('Wird gewarnt', unlesbar.klasse.includes('home-sich-warnen'), unlesbar.klasse);
p('Und nicht „vor NaN Tagen" behauptet', !unlesbar.text.includes('NaN'), unlesbar.text);
p('Sondern schlicht: nie', unlesbar.text.includes('Noch nie gesichert'), unlesbar.text);
p('(Vorbedingung: ohne Marke wurde gewarnt)', kaputt.klasse.includes('home-sich-warnen'));

console.log('\n7 · „Privat" — die eigenen Seiten oberster Ebene');

const privat = await seite.evaluate(() => {
  const koepfe = [...document.querySelectorAll('.home h2')].map(h => h.textContent ?? '');
  const stelle = koepfe.indexOf('Privat');
  const liste = document.querySelectorAll('.home h2')[stelle]?.nextElementSibling;
  const eintraege = liste ? [...liste.querySelectorAll('button[data-open]')].map(b =>
    (b as HTMLElement).innerText.replace(/\n/g, ' ')) : [];
  const wurzeln = Store.rootPages().filter((x: any) => !x.system).map((x: any) => x.id);
  return { koepfe, eintraege, wurzeln: wurzeln.length };
}) as { koepfe: string[]; eintraege: string[]; wurzeln: number };

p('Der Abschnitt „Privat" ist da', privat.koepfe.includes('Privat'), privat.koepfe.join(', '));
p('Er steht nach „Zuletzt bearbeitet"',
  privat.koepfe.indexOf('Privat') > privat.koepfe.indexOf('Zuletzt bearbeitet'),
  privat.koepfe.join(', '));
p('Er listet Seiten', privat.eintraege.length > 0, String(privat.eintraege.length));
p('Höchstens acht — der Rest steht in der Seitenleiste',
  privat.eintraege.length <= 8, String(privat.eintraege.length));
p('Nicht mehr, als es Wurzelseiten gibt',
  privat.eintraege.length <= privat.wurzeln,
  privat.eintraege.length + ' von ' + privat.wurzeln);

console.log('\n8 · „Schnellzugriff" — was mit ★ markiert ist');

/* Ohne Sterne darf keine leere Überschrift dastehen. */
const ohneSterne = await seite.evaluate(() => {
  Links.seiten().forEach((x: any) => { if (x.favorite) Store.updateBlock(x.id, { favorite: false }); });
  Ansichten.start();
  return [...document.querySelectorAll('.home h2')].map(h => h.textContent ?? '');
}) as string[];
p('Ohne Sterne keine Überschrift „Schnellzugriff"',
  !ohneSterne.includes('Schnellzugriff'), ohneSterne.join(', '));

const mitSternen = await seite.evaluate(() => {
  const wahl = Links.seiten().filter((x: any) => !x.system).slice(0, 6);
  wahl.forEach((x: any) => Store.updateBlock(x.id, { favorite: true }));
  Ansichten.start();
  const koepfe = [...document.querySelectorAll('.home h2')].map(h => h.textContent ?? '');
  const stelle = koepfe.indexOf('Schnellzugriff');
  const gitter = document.querySelectorAll('.home h2')[stelle]?.nextElementSibling;
  return {
    koepfe,
    markiert: wahl.length,
    karten: gitter ? gitter.querySelectorAll('.hk[data-open]').length : 0,
    gitterKlasse: gitter ? gitter.className : ''
  };
}) as { koepfe: string[]; markiert: number; karten: number; gitterKlasse: string };

p('Mit Sternen erscheint der Schnellzugriff',
  mitSternen.koepfe.includes('Schnellzugriff'), mitSternen.koepfe.join(', '));
p('Er steht vor „Zuletzt bearbeitet"',
  mitSternen.koepfe.indexOf('Schnellzugriff') < mitSternen.koepfe.indexOf('Zuletzt bearbeitet'),
  mitSternen.koepfe.join(', '));
p('Als Kacheln, nicht als Liste',
  mitSternen.gitterKlasse.includes('home-karten'), mitSternen.gitterKlasse);
/* Sechs markiert, vier gezeigt: der Schnellzugriff ist der erste Blick,
   nicht das Inhaltsverzeichnis. */
p('Höchstens vier Kacheln', mitSternen.karten === 4,
  mitSternen.karten + ' bei ' + mitSternen.markiert + ' Sternen');

const trifft = await seite.evaluate(() => {
  const k = document.querySelector<HTMLElement>('.home-karten .hk[data-open]');
  if (!k) return null;
  const id = k.dataset['open'] ?? '';
  const b = Store.cache.blocks[id];
  return { id, gibtEs: !!b, favorit: !!b?.favorite };
}) as { id: string; gibtEs: boolean; favorit: boolean } | null;
p('Jede Kachel zeigt auf eine Seite, die es gibt', !!trifft?.gibtEs, JSON.stringify(trifft));
p('Und zwar auf eine markierte', !!trifft?.favorit, JSON.stringify(trifft));

console.log('\n9 · Auf dem Handy ist der Knopf zu treffen');

const handy = await browser.newContext({
  viewport: { width: 428, height: 926 }, isMobile: true, hasTouch: true,
  deviceScaleFactor: 2
});
const klein = await handy.newPage();
await klein.goto(`http://localhost:${PORT}/index.html`);
await klein.waitForTimeout(3200);
await klein.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta('sicherung:zuletzt', '');
  document.getElementById('rg-einladung')?.remove();
  document.getElementById('rg-neu')?.remove();
  Ansichten.start();
});
await klein.waitForTimeout(300);

const masse = await klein.evaluate(() => {
  const k = document.querySelector('.home-sich [data-a="sichern"]');
  const band = document.querySelector('.home-sich');
  if (!k || !band) return null;
  const r = k.getBoundingClientRect(), rb = band.getBoundingClientRect();
  return { h: Math.round(r.height), b: Math.round(r.width),
           bandBreite: Math.round(rb.width), fenster: window.innerWidth };
}) as { h: number; b: number; bandBreite: number; fenster: number } | null;

p('Der Knopf ist da', !!masse);
if (masse) {
  p('Er ist mindestens 44px hoch', masse.h >= 44, masse.h + 'px');
  p('Und breit genug', masse.b >= 44, masse.b + 'px');
  /* Ein Band, das breiter ist als das Fenster, schiebt die ganze App
     seitwärts — der klassische Handy-Fehler. */
  p('Das Band passt ins Fenster', masse.bandBreite <= masse.fenster,
    masse.bandBreite + ' von ' + masse.fenster + 'px');
}
const querab = await klein.evaluate(() =>
  document.documentElement.scrollWidth <= window.innerWidth + 1) as boolean;
p('Und verursacht kein seitliches Scrollen', querab);

await handy.close();
await browser.close();
server.close();

console.log(`\n  Suite 81 — Sicherungsstand auf dem Start: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
