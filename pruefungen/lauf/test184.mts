/* Suite 150 — Ein geschütztes PDF fragt nach seinem Passwort (E110)
 * ============================================================================
 * Der letzte offene Punkt aus L37. Bisher sagte Redion bei einer
 * passwortgeschützten Datei „Redion kann sie nicht öffnen" und hängte sie an
 * — ehrlich, aber eine Sackgasse: die Datei hat ein Passwort, der Mensch
 * davor kennt es, und niemand hat ihn gefragt.
 *
 * DAS PASSWORT WIRD NIRGENDS ABGELEGT. Es geht von der Tastatur an pdf.js
 * und ist danach weg — nicht in den Block, nicht in die Ablage, nicht in die
 * Sicherung. §4 misst das nach: nach dem Einlesen darf es im ganzen Bestand
 * nicht mehr auffindbar sein. Ein Schlüssel, den man aufbewahrt, schützt
 * nichts mehr.
 *
 * DAS PRÜF-PDF IST ECHT VERSCHLÜSSELT. `pruefungen/hilfe/krypto-pdf.mts`
 * baut ein PDF mit dem Standard-Sicherheitshandler (V1/R2, RC4 40 Bit) —
 * ohne das richtige Passwort kommt pdf.js nicht hinein, und das ist genau
 * der Zustand, um den es geht.
 *
 *   node pruefungen/lauf/test184.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { machGeschuetztesPdf } from '../hilfe/krypto-pdf.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8929;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const PASSWORT = 'Pythagoras42';
const PDF = machGeschuetztesPdf(
  [['Klausur — geschuetzt', 'Aufgabe A: 3x = 12'],
   ['Zweite Seite', 'Aufgabe B: 7 mal 8']], PASSWORT);

/* ==========================================================================
 * §0 · Die Datei ist wirklich zu
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt prüfte alles Folgende womöglich ein PDF, das gar
 * kein Passwort hat — und wäre dann grün, ohne etwas zu bedeuten.
 * ========================================================================*/
console.log('\n0 · Die Datei ist wirklich zu');

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1400, height: 900 });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

p('Es ist ein PDF', PDF.subarray(0, 5).toString('latin1') === '%PDF-');
p('Und es trägt einen Verschluss',
  PDF.toString('latin1').includes('/Encrypt'));

const ohnePasswort = await seite.evaluate(async (hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  try { const g = await PdfLeser.oeffne(bytes); g.schliessen(); return 'offen'; }
  catch (e: unknown) { return e instanceof Error ? e.message : String(e); }
}, PDF.toString('hex'));
p('Ohne Passwort geht sie nicht auf', /password/i.test(ohnePasswort), ohnePasswort);

const falsches = await seite.evaluate(async (hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const gefragt: boolean[] = [];
  try {
    const g = await PdfLeser.oeffne(bytes, async (nochmal: boolean) => {
      gefragt.push(nochmal);
      return gefragt.length > 3 ? null : 'daneben';
    });
    g.schliessen();
    return { offen: true, gefragt };
  } catch (e: unknown) {
    return { offen: false, gefragt, fehler: e instanceof Error ? e.message : String(e) };
  }
}, PDF.toString('hex'));

p('Ein falsches Passwort öffnet sie nicht', !falsches.offen);
p('Und sie wird noch einmal gefragt',
  falsches.gefragt.length >= 2, JSON.stringify(falsches.gefragt));
gleich('Beim ersten Mal ohne „nochmal"', falsches.gefragt[0], false);
gleich('Beim zweiten Mal mit', falsches.gefragt[1], true);

/* ==========================================================================
 * §1 · Mit dem richtigen Passwort geht sie auf
 * ========================================================================*/
console.log('\n1 · Mit dem richtigen Passwort geht sie auf');

const mitPasswort = await seite.evaluate(async ([hex, pw]: string[]) => {
  const bytes = Uint8Array.from((hex!.match(/../g) || []).map(h => parseInt(h, 16)));
  let male = 0;
  const g = await PdfLeser.oeffne(bytes, async () => { male++; return pw!; });
  const text = await g.text(1);
  const geo = await g.geometrie(1);
  const bild = await g.alsBild(1, 500);
  const erg = { seiten: g.seiten, text, geo, bild: bild.size, male };
  g.schliessen();
  return erg;
}, [PDF.toString('hex'), PASSWORT]);

gleich('Zwei Seiten', mitPasswort.seiten, 2);
gleich('Einmal gefragt, einmal gereicht', mitPasswort.male, 1);
p('Der Text ist lesbar', /Klausur/.test(mitPasswort.text), mitPasswort.text.slice(0, 40));
p('Die Masse stimmen', Math.abs(mitPasswort.geo.bw - 595) < 2);
p('Und die Seite lässt sich zeichnen', mitPasswort.bild > 500,
  mitPasswort.bild + ' Bytes');

/* ==========================================================================
 * §2 · Der ganze Weg: fallen lassen, gefragt werden, Seiten bekommen
 * ========================================================================*/
console.log('\n2 · Der ganze Weg: fallen lassen, gefragt werden, Seiten bekommen');

const sid = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Geschützte Klausur' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'klausur-geschuetzt.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));

/* Die Passwortfrage kommt VOR der Anordnungsfrage — ohne Passwort weiss
   niemand, wie viele Seiten es überhaupt sind. */
await seite.waitForSelector('.overlay #fq', { timeout: 25000 });

const feld = await seite.evaluate(() => {
  const i = document.querySelector('.overlay #fq') as HTMLInputElement;
  return { art: i.type, titel: document.querySelector('.overlay .fh')?.textContent || '',
           auto: i.getAttribute('autocomplete') || '' };
});
gleich('Das Feld verbirgt die Eingabe', feld.art, 'password');
p('Die Frage nennt die Datei', /klausur-geschuetzt\.pdf/.test(feld.titel), feld.titel);
gleich('Und der Browser merkt es sich nicht', feld.auto, 'off');

/* Erst falsch — die Frage muss wiederkommen und es sagen. */
await seite.fill('.overlay #fq', 'daneben');
await seite.click('.overlay [data-a="ok"]');
await seite.waitForFunction(() =>
  /stimmte nicht/i.test(document.querySelector('.overlay .fh')?.textContent || ''),
  null, { timeout: 25000 });
p('Nach dem falschen Versuch sagt sie das', true);

await seite.fill('.overlay #fq', PASSWORT);
await seite.click('.overlay [data-a="ok"]');

await seite.waitForSelector('.overlay [data-w="untereinander"]', { timeout: 25000 });
await seite.click('.overlay [data-w="untereinander"]');
await seite.waitForFunction(() => Object.values(Store.cache.blocks || {})
  .filter((b: any) => b.type === 'pdfseite' && b.alive && b.bildDateiId).length >= 2,
  null, { timeout: 90000 });

const fertig = await seite.evaluate(async (s: string) => {
  const seiten = (Object.values(Store.cache.blocks) as any[])
    .filter(b => b.type === 'pdfseite' && b.alive).sort((a, b) => a.nr - b.nr);
  const saetze = await Store.dateiAlle();
  return {
    wieViele: seiten.length,
    text: String(seiten[0]?.suchtext || ''),
    original: saetze.find((x: any) => x.name === 'klausur-geschuetzt.pdf')?.groesse,
    seite: s
  };
}, sid);

gleich('Zwei Seiten sind entstanden', fertig.wieViele, 2);
p('Mit ihrem Text', /Klausur/.test(fertig.text), fertig.text.slice(0, 40));
gleich('Und das Original liegt vollständig da', fertig.original, PDF.length);

/* ==========================================================================
 * §3 · Wer abbricht, bekommt seine Datei trotzdem
 * ========================================================================*/
console.log('\n3 · Wer abbricht, bekommt seine Datei trotzdem');

const sid2 = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Abgebrochen' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate((hex: string) => {
  const bytes = Uint8Array.from((hex.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], 'zweite.pdf', { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, PDF.toString('hex'));
await seite.waitForSelector('.overlay #fq', { timeout: 25000 });
await seite.click('.overlay [data-a="zu"]');

await seite.waitForFunction((s: string) =>
  (Store.getBlock(s)?.content || []).some(
    (k: string) => Store.getBlock(k)?.type === 'file'), sid2, { timeout: 25000 });

const abgebrochen = await seite.evaluate(async (s: string) => {
  const kinder = (Store.getBlock(s)?.content || [])
    .map((k: string) => Store.getBlock(k)).filter(Boolean)
    .filter((b: any) => b.type !== 'text' || b.text);
  const saetze = await Store.dateiAlle();
  const satz = saetze.find((x: any) => x.id === kinder[0]?.dateiId);
  return { wieViele: kinder.length, art: kinder[0]?.type,
           bytes: satz?.groesse,
           seiten: kinder.filter((b: any) => b.type === 'pdfseite').length };
}, sid2);

gleich('Ein Anhang steht auf der Seite', abgebrochen.art, 'file');
gleich('Und nur einer', abgebrochen.wieViele, 1);
gleich('Vollständig', abgebrochen.bytes, PDF.length);
gleich('Keine Seite wurde gerastert', abgebrochen.seiten, 0);

/* ==========================================================================
 * §4 · Das Passwort steht nirgends
 * --------------------------------------------------------------------------
 * DER PUNKT, AN DEM ES UM MEHR GEHT ALS UM BEQUEMLICHKEIT. Ein Passwort, das
 * die App aufbewahrt, hebt den Schutz auf, den es geben soll — und zwar für
 * jeden, der später an die Sicherung kommt.
 * ========================================================================*/
console.log('\n4 · Das Passwort steht nirgends');

const gesucht = await seite.evaluate(async (pw: string) => {
  const treffer: string[] = [];
  /* Alle Blöcke */
  if (JSON.stringify(Store.cache.blocks).includes(pw)) treffer.push('blocks');
  if (JSON.stringify(Store.cache.meta).includes(pw)) treffer.push('meta');
  /* Der ganze Export — also das, was in einer Sicherung landet */
  if (String(Store.exportAll(true)).includes(pw)) treffer.push('sicherung');
  /* Und die Datei-Sätze */
  if (JSON.stringify(await Store.dateiAlle()).includes(pw)) treffer.push('dateien');
  /* Der Browser-Speicher */
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if ((localStorage.getItem(k) || '').includes(pw)) treffer.push('localStorage:' + k);
  }
  return { treffer, suche: Store.search(pw, {}).length };
}, PASSWORT);

gleich('Es steht in keinem Fach', gesucht.treffer.join(', '), '');
gleich('Und die Suche findet es nicht', gesucht.suche, 0);

/* GEGENPROBE: die Suche findet sehr wohl etwas, das drinsteht — der Test
   sucht also nicht ins Leere. */
gleich('Gegenprobe: „Klausur" wird gefunden',
  await seite.evaluate(() => Store.search('Klausur', {}).length > 0), true);

/* ==========================================================================
 * §5 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n5 · Was der Quelltext verspricht');

const ohneKommentare = (t: string): string =>
  t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const leser = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/leser.ts'), 'utf8'));
const einlesen = ohneKommentare(
  fs.readFileSync(path.join(WURZEL, 'src/bereiche/pdf/einlesen.ts'), 'utf8'));

p('Der Leser reicht das Passwort nur durch',
  /onPassword = \(weiter/.test(leser) && !/passwort.*=.*Store\./i.test(leser));
p('Ein Abbruch schliesst den Auftrag',
  /auftrag\.destroy\(\)/.test(leser));
p('Das Einlesen fragt in einem Passwortfeld',
  /'passwort'\)/.test(einlesen));
p('Und legt es nirgends ab',
  !/updateBlock\([^)]*passwort/i.test(einlesen) &&
  !/setMeta\([^)]*passwort/i.test(einlesen));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
