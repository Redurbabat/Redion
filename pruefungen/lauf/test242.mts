/* Suite 208 — Fachzeichen auf dem PDF (Elektro, Punkte 42, 43)
 * ============================================================================
 * Redur hat sein eigenes Lehrmittel als PDF. Zwei Dinge fehlten dafür:
 *
 *   42  ein Fachzeichen AUF eine Seite setzen — etwa in einen Grundriss, um
 *       eine Installation zu planen oder eine Aufgabe zu ergänzen
 *   43  einen Ausschnitt HERAUSSCHNEIDEN und daraus eine Lernkarte machen
 *
 * BEIDE BENUTZEN, WAS SCHON DA IST, und das ist der Punkt dieser Suite.
 *
 * Das Symbol kommt aus `register/fachzeichen` — derselben Quelle wie im
 * Schaltplan-Editor. §2 prüft ausdrücklich, dass es DIESELBE ist: eine zweite
 * Symbolliste fürs PDF wäre L34, sie liefe auseinander, und niemand merkte
 * es, bis dasselbe Zeichen auf zwei Seiten verschieden aussieht.
 *
 * Der Ausschnitt benutzt das RECHTECK-Werkzeug, das es längst gibt. Kein
 * zweites Gummiband: das gezeichnete Rechteck ist zugleich die Auswahl und
 * der bleibende Vermerk, was man herausgeschnitten hat.
 *
 * UND BEIDES MUSS DEN NEUSTART ÜBERLEBEN. Ein Zeichen liegt als Marke im
 * Block, ein Ausschnitt als gewöhnlicher Anhang — damit gehen beide durch
 * Papierkorb und `.redion`-Sicherung, ohne dass irgendwo ein Sonderfall
 * dafür stehen muss. §4 und §7 messen genau das.
 *
 *   node pruefungen/lauf/test242.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Register: any;
declare const Dateien: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8993;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
const seite = await browser.newPage({ viewport: { width: 1300, height: 920 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => { Store.setMeta('rundgangGesehen', true);
                             Store.setMeta('neuerungenGesehen', 99);
                             Store.setMeta('kartenGemeldet', new Date().toISOString().slice(0, 10)); });
await seite.reload();
await seite.waitForTimeout(2400);
const aufraeumen = () => seite.evaluate(() =>
  document.querySelectorAll('#rg-willkommen, .overlay').forEach(x => x.remove()));
await aufraeumen();

/* --------------------------------------------------------------------------
 * Eine PDF-Seite von Hand bauen. Ein gemaltes Bild als Anhang und ein
 * `pdfseite`-Block darauf — damit braucht die Prüfung kein echtes PDF und
 * misst trotzdem genau den Weg, den eine eingelesene Seite geht.
 * ----------------------------------------------------------------------- */
/* Die Kennungen bleiben HIER und nicht auf `window`: ein Neuladen löscht
   alles, was am Fenster hängt, und §4 und §7 laden absichtlich neu. Beim
   ersten Lauf war die Prüfung deshalb nach dem Neuladen blind. */
const kennungen = await seite.evaluate(async () => {
  const c = document.createElement('canvas');
  c.width = 600; c.height = 850;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 850);
  g.strokeStyle = '#000'; g.lineWidth = 3;
  g.strokeRect(120, 150, 180, 120);
  g.font = '28px sans-serif'; g.fillStyle = '#000';
  g.fillText('Schema 0', 130, 320);
  const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
  const datei = await Dateien.ablegen(new File([blob], 'seite.png', { type: 'image/png' }), null);
  const st = Store.addPage(null, { text: 'PDF-Ausschnitt' });
  const b = Store.addBlock(st.id, 'pdfseite', { text: '' });
  Store.updateBlock(b.id, { nr: 1, vonSeiten: 1, bw: 600, bh: 850,
                            bildDateiId: datei.id, bildBreite: 600, bildHoehe: 850 });
  return { seite: st.id, pdf: b.id };
});
await seite.evaluate((id: string) => { App.zeichneBaum(); App.oeffne(id); }, kennungen.seite);
await seite.waitForTimeout(1600);
await aufraeumen();

/* ==========================================================================
 * §1 · Die Seite steht
 * ========================================================================*/
console.log('\n1 · Die PDF-Seite');

p('Die Seite ist gezeichnet', await seite.locator('.pdfs').count() === 1);
const bildMass = await seite.evaluate(() => {
  const i = document.querySelector('.pdfs-bild') as HTMLImageElement | null;
  return i ? `${i.naturalWidth}x${i.naturalHeight}` : 'keins';
});
p('Und ihr Bild ist geladen', bildMass === '600x850', bildMass);
p('Es gibt eine Zeichenschicht', await seite.locator('.blatt-marken').count() === 1);

/* ==========================================================================
 * §2 · Das Fachzeichen-Werkzeug (Punkt 42)
 * ========================================================================*/
console.log('\n2 · Fachzeichen setzen');

p('Die Leiste hat ein Fachzeichen-Werkzeug',
  await seite.locator('[data-wz="zeichen"]').count() === 1);

await seite.locator('[data-wz="zeichen"]').click();
await seite.waitForTimeout(250);
const flaeche = seite.locator('.blatt-marken');
const rahmen = (await flaeche.boundingBox())!;
/* NUR im sichtbaren Teil tippen. Die Seite ist 1003 px hoch und beginnt bei
   y = 380 — sechzig Prozent davon liegen unter dem Fensterrand, und ein
   Klick dorthin trifft nichts. Beim ersten Lauf sah das aus wie ein kaputtes
   Werkzeug und war eine Prüfung, die neben die Seite gezielt hat. */
const tippen = (anteilX: number, anteilY: number) => seite.mouse.click(
  rahmen.x + rahmen.width * anteilX,
  rahmen.y + Math.min(rahmen.height * anteilY, 900 - rahmen.y - 40));
await tippen(0.30, 0.20);
await seite.waitForTimeout(600);

p('Ein Tipp öffnet die Symbolauswahl', await seite.locator('.mz-liste').count() === 1);
const inPalette = await seite.locator('.mz-liste [data-sym]').count();
const imRegister = await seite.evaluate(() => Register.fachzeichen.alle().length);
/* DIESELBE Liste, nicht eine zweite. Wären es zwei, liefen sie auseinander
   und niemand merkte es, bis ein Zeichen fehlt (L34). */
p('Sie zeigt genau die Symbole aus dem Register',
  inPalette === imRegister, `${inPalette} in der Auswahl, ${imRegister} im Register`);
p('Mit einem Suchfeld', await seite.locator('.mz-suche input').count() === 1);
p('Und einem Regler für die Grösse', await seite.locator('.mz-groesse input').count() === 1);
/* Beim ersten Mal gibt es kein „zuletzt" — es wäre eine Zeile ohne Inhalt. */
p('Beim ersten Mal ohne „Zuletzt"', await seite.locator('.mz-zuletzt').count() === 0);

/* Suchen muss die Liste wirklich verkleinern. */
await seite.locator('.mz-suche input').fill('schalter');
await seite.waitForTimeout(300);
const gefunden = await seite.locator('.mz-liste [data-sym]').count();
p('Die Suche verkleinert die Auswahl', gefunden > 0 && gefunden < inPalette,
  `${gefunden} von ${inPalette}`);

await seite.locator('[data-sym="ch-schema0"]').first().click();
await seite.waitForTimeout(500);
p('Nach der Wahl steht das Zeichen auf der Seite',
  await seite.locator('[data-ink-art="zeichen"]').count() === 1);
p('Und die Auswahl ist zu', await seite.locator('.mz-liste').count() === 0);

/* Es muss AUS DEM REGISTER kommen und nicht nachgebaut sein: dieselben Pfade. */
const gleicheForm = await seite.evaluate(() => {
  const g = document.querySelector('[data-ink-art="zeichen"]') as SVGGElement | null;
  if (!g) return { pfade: 0, ausRegister: 0 };
  const roh = Register.fachzeichen.alsSvg('ch-schema0', { farbe: '#000' });
  const hilf = document.createElement('div');
  hilf.innerHTML = roh;
  return {
    pfade: g.querySelectorAll('path, circle, line, rect').length,
    ausRegister: (hilf.querySelector('svg')?.querySelectorAll('path, circle, line, rect').length || 0) + 1
  };
});
/* +1, weil die Marke zusätzlich eine unsichtbare Grifffläche bekommt — ein
   Kontakt besteht fast nur aus Linien und wäre sonst kaum zu treffen. */
p('Das Zeichen trägt genau die Formen aus dem Register',
  gleicheForm.pfade === gleicheForm.ausRegister,
  `${gleicheForm.pfade} gegen ${gleicheForm.ausRegister}`);

/* Beim zweiten Mal steht das zuletzt gewählte oben. */
await tippen(0.62, 0.20);
await seite.waitForTimeout(600);
p('Beim zweiten Mal steht „Zuletzt" oben',
  await seite.locator('.mz-zuletzt button').count() === 1);
p('… und nennt das gewählte Zeichen',
  /Ausschalter/.test(await seite.locator('.mz-zuletzt button').innerText()),
  await seite.locator('.mz-zuletzt button').innerText());
await seite.locator('.mz-zuletzt button').click();
await seite.waitForTimeout(500);
p('Ein Klick darauf setzt es sofort',
  await seite.locator('[data-ink-art="zeichen"]').count() === 2);

/* ==========================================================================
 * §3 · Drehen
 * ========================================================================*/
console.log('\n3 · Drehen');

const vorher = await seite.locator('[data-ink-art="zeichen"]').first().getAttribute('transform');
await seite.locator('[data-ink-art="zeichen"]').first().click({ force: true });
await seite.waitForTimeout(400);
const nachher = await seite.locator('[data-ink-art="zeichen"]').first().getAttribute('transform');
p('Ein Tipp auf ein gesetztes Zeichen dreht es', vorher !== nachher,
  `${vorher} → ${nachher}`);
const drehung = await seite.evaluate((id: string) => {
  const b = Store.getBlock(id);
  return (b.marken || []).filter((m: any) => m.art === 'zeichen').map((m: any) => m.drehung);
}, kennungen.pdf);
p('Die Drehung steht im Block', drehung.includes(90), JSON.stringify(drehung));
p('Und es sind immer noch zwei Zeichen',
  await seite.locator('[data-ink-art="zeichen"]').count() === 2);

/* Ein geändertes Zeichen darf nicht sein altes Bild behalten. `updateNode`
   flickt sonst nur Attribute, und ein <g> voller Pfade behielte die alten
   Kinder — die Kennung änderte sich, das Bild nicht. */
const nachTausch = await seite.evaluate((id: string) => {
  const b = Store.getBlock(id);
  const marken = (b.marken || []).slice();
  const z = marken.find((m: any) => m.art === 'zeichen');
  z.zeichenId = 'lampe';
  Store.updateBlock(b.id, { marken });
  App.zeichneSeite();
  return true;
}, kennungen.pdf);
await seite.waitForTimeout(800);
const formNachTausch = await seite.evaluate(() => {
  const alle = [...document.querySelectorAll('[data-ink-art="zeichen"]')];
  return alle.map(g => g.querySelectorAll('circle').length);
});
p('Ein getauschtes Zeichen zeigt das neue Bild',
  nachTausch && formNachTausch.some(n => n > 0), JSON.stringify(formNachTausch));

/* ==========================================================================
 * §4 · Ein Zeichen überlebt den Neustart
 * ========================================================================*/
console.log('\n4 · Nach dem Neuladen');

await seite.reload();
await seite.waitForTimeout(2600);
await aufraeumen();
await seite.waitForTimeout(600);
p('Beide Zeichen sind wieder da',
  await seite.locator('[data-ink-art="zeichen"]').count() === 2,
  `${await seite.locator('[data-ink-art="zeichen"]').count()}`);
const imBlock = await seite.evaluate((id: string) => {
  const b = Store.getBlock(id);
  return (b.marken || []).filter((m: any) => m.art === 'zeichen')
    .map((m: any) => ({ id: m.zeichenId, g: m.groesse, d: m.drehung }));
}, kennungen.pdf);
p('Sie liegen als gewöhnliche Marken im Block', imBlock.length === 2,
  JSON.stringify(imBlock));
p('Mit Kennung, Grösse und Drehung',
  imBlock.every((m: any) => m.id && typeof m.g === 'number' && typeof m.d === 'number'),
  JSON.stringify(imBlock));

/* ==========================================================================
 * §5 · Der Ausschnitt braucht ein Rechteck (Punkt 43)
 * ========================================================================*/
console.log('\n5 · Ausschneiden');

p('Die Leiste hat eine Schere', await seite.locator('[data-a="karte"]').count() === 1);

/* Ohne Rechteck: eine klare Ansage statt einer leeren Karte. */
await seite.locator('[data-a="karte"]').click();
await seite.waitForTimeout(600);
const ansage = (await seite.locator('.toast, #toast').allInnerTexts()).join(' ');
p('Ohne Rechteck sagt sie, was fehlt', /Rechteck/.test(ansage), ansage || '(nichts)');
p('Und legt keine Karte an', await seite.locator('.fkarte').count() === 0);
p('Und fragt auch nicht nach der Rückseite', await seite.locator('#fq').count() === 0);

/* Jetzt ein Rechteck ziehen. Seit E375 steht es hinter dem Formen-Knopf
   (L115 Punkt 9): erst „Form", dann im Zubehör die Art. */
await seite.locator('.blatt-werk [data-wz="formen"]').click();
await seite.locator('.blatt-werk [data-act="formart"][data-form="rectangle"]').click();
await seite.waitForTimeout(250);
const r2 = (await seite.locator('.blatt-marken').boundingBox())!;
await seite.mouse.move(r2.x + r2.width * 0.18, r2.y + r2.height * 0.16);
await seite.mouse.down();
await seite.mouse.move(r2.x + r2.width * 0.55, r2.y + r2.height * 0.40, { steps: 10 });
await seite.mouse.up();
await seite.waitForTimeout(500);
p('Das Rechteck steht auf der Seite',
  await seite.locator('[data-ink-art="rectangle"]').count() === 1);

await seite.locator('[data-a="karte"]').click();
await seite.waitForTimeout(700);
p('Jetzt fragt sie nach der Rückseite', await seite.locator('#fq').count() === 1);

/* Abbrechen darf nichts anlegen. */
await seite.locator('[data-a="zu"]').click();
await seite.waitForTimeout(600);
p('Abbrechen legt keine Karte an', await seite.locator('.fkarte').count() === 0);

await seite.locator('[data-a="karte"]').click();
await seite.waitForTimeout(700);
await seite.locator('#fq').fill('Ausschalter Schema 0');
await seite.locator('[data-a="ok"]').click();
await seite.waitForTimeout(1600);

/* ==========================================================================
 * §6 · Die Karte trägt das Bild
 * ========================================================================*/
console.log('\n6 · Die Lernkarte');

p('Es gibt eine Karteikarte', await seite.locator('.fkarte').count() === 1);
p('Mit einem Bild darauf', await seite.locator('.fk-bild').count() === 1);
const kartenBild = await seite.evaluate(() => {
  const i = document.querySelector('.fk-bild') as HTMLImageElement | null;
  return i ? { b: i.naturalWidth, h: i.naturalHeight, quelle: (i.src || '').slice(0, 5) }
           : null;
});
p('Das Bild ist wirklich geladen', !!kartenBild && kartenBild.b > 40 && kartenBild.h > 40,
  JSON.stringify(kartenBild));
/* Es muss der AUSSCHNITT sein und nicht die ganze Seite. Ohne diese Zeile
   würde eine Schere, die den Zuschnitt vergisst, unbemerkt durchgehen. */
p('… und es ist der Ausschnitt, nicht die ganze Seite',
  !!kartenBild && kartenBild.b < 500 && kartenBild.h < 700,
  JSON.stringify(kartenBild));
p('Es liegt als Anhang, nicht im Text',
  !!kartenBild && kartenBild.quelle === 'blob:', JSON.stringify(kartenBild));
const kartenText = await seite.locator('.fkarte .fk-zeilen').innerText();
p('Die Rückseite steht in der Karte', /Ausschalter Schema 0/.test(kartenText),
  kartenText.replace(/\n/g, ' | '));

const kartenBlock = await seite.evaluate((id: string) => {
  const seite2 = Store.getBlock(id);
  const kinder = (seite2.content || []).map((k: string) => Store.getBlock(k));
  const karte = kinder.find((x: any) => x && x.type === 'flashcard');
  return karte ? { bildId: karte.bildId, text: karte.text } : null;
}, kennungen.seite);
p('Der Block kennt seine Bildkennung', !!kartenBlock && !!kartenBlock.bildId,
  JSON.stringify(kartenBlock));

/* ==========================================================================
 * §7 · Und auch die Karte überlebt den Neustart
 * ========================================================================*/
console.log('\n7 · Die Karte nach dem Neuladen');

await seite.reload();
await seite.waitForTimeout(2600);
await aufraeumen();
await seite.waitForTimeout(900);
const spaeter = await seite.evaluate(() => {
  const i = document.querySelector('.fk-bild') as HTMLImageElement | null;
  return i ? { b: i.naturalWidth, h: i.naturalHeight } : null;
});
p('Die Karte ist wieder da', await seite.locator('.fkarte').count() === 1);
p('Und ihr Bild auch', !!spaeter && spaeter.b > 40, JSON.stringify(spaeter));
/* Der Anhang muss auch in der Dateiablage stehen — sonst käme er in einer
   `.redion`-Sicherung nicht mit, und die Karte wäre nach dem Einspielen leer. */
const inAblage = await seite.evaluate(async (id: string) => {
  const seite2 = Store.getBlock(id);
  const kinder = (seite2.content || []).map((k: string) => Store.getBlock(k));
  const karte = kinder.find((x: any) => x && x.type === 'flashcard');
  if (!karte || !karte.bildId) return null;
  const b = await Dateien.alsBlob(karte.bildId);
  return b ? { groesse: b.size, typ: b.type } : null;
}, kennungen.seite);
p('Der Ausschnitt liegt in der Dateiablage', !!inAblage && inAblage.groesse > 100,
  JSON.stringify(inAblage));
p('… als PNG', !!inAblage && inAblage.typ === 'image/png', JSON.stringify(inAblage));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
