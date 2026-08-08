/* Suite 94 — Bedingte Formatierung im Tabellenblock (L15)
 * ============================================================================
 * `LUECKEN.md` L15 nannte fünf Dinge: Zell- und Zeilenfarbe nach Regel,
 * Datenbalken, Farbskalen, Symbolregeln, Duplikate und überfällige Werte.
 * Nachgesehen am 8. August war die Hälfte davon längst da — aber in den
 * DATENBANKEN: `farbregeln` färbt dort ganze Zeilen, und die Spaltenanzeige
 * kennt `skala`, `heat`, `bar` und `ring`. Im TABELLENBLOCK, wo das Wort
 * „bedingte Formatierung" herkommt, gab es nichts davon.
 *
 * WAS DIESER LAUF PRÜFT, und warum jeder Punkt einzeln zählt:
 *
 *   Die Regel gehört dem BLATT, nicht der Zelle. Eine Farbe an der Zelle
 *   müsste bei jeder Änderung mitgeführt, beim Einfügen einer Zeile
 *   verschoben und beim Löschen aufgeräumt werden. Eine Regel am Blatt
 *   sagt, WANN gefärbt wird, und überlebt jede Umstellung darunter.
 *
 *   Sie ändert die Daten NICHT. Das ist der Punkt, an dem eine solche
 *   Sache gefährlich würde: was `wert` sagt, muss bleiben, was es war.
 *
 *   Die Auswahl gewinnt. Eine gefärbte Zelle muss trotzdem als gewählt zu
 *   erkennen sein — sonst verliert man beim Malen die Stelle, an der man
 *   gerade steht.
 *
 *   node pruefungen/lauf/test130.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8799;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Ein Block mit Zahlen: A1..A6 = 10, 50, 120, 50, 5, 300. */
/* DIE MAPPE ENTSTEHT BEIM ZEICHNEN, nicht beim Anlegen des Blocks. Wer
   direkt nach `addBlock` an `blk.mappe.blaetter` greift, bekommt
   „Cannot read properties of undefined" — einmal zeichnen lassen, dann
   steht sie. */
await seite.evaluate(() => {
  const w = window as any;
  const s = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Regelprobe' });
  w.__bid = blk.id;
  const kasten = document.createElement('div');
  kasten.id = 'pruef-regeln';
  document.body.appendChild(kasten);
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
});
await seite.waitForTimeout(400);
await seite.evaluate(() => {
  const w = window as any;
  const blk = Store.getBlock(w.__bid);
  const blatt = blk.mappe.blaetter[0];
  [10, 50, 120, 50, 5, 300].forEach((v, i) => { blatt.zellen['A' + (i + 1)] = { wert: v }; });
  blatt.zellen['B1'] = { wert: 'Apfel' };
  blatt.zellen['B2'] = { wert: '' };
  Store.updateBlock(blk.id, { mappe: blk.mappe });
  const kasten = document.getElementById('pruef-regeln')!;
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
});
await seite.waitForTimeout(400);

/** Regeln setzen und neu zeichnen. */
const mitRegeln = (regeln: unknown[]) => seite.evaluate((r) => {
  const w = window as any;
  const blk = Store.getBlock(w.__bid);
  blk.mappe.blaetter[0].regeln = r as any[];
  Store.updateBlock(blk.id, { mappe: blk.mappe });
  const kasten = document.getElementById('pruef-regeln')!;
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
}, regeln);

/** Wie eine Zelle aussieht. */
const zelle = (a: string) => seite.evaluate((adr) => {
  const d = document.querySelector<HTMLElement>(`#pruef-regeln [data-a="${adr}"]`);
  if (!d) return null;
  const c = getComputedStyle(d);
  return { klasse: d.className, text: d.textContent || '',
           grund: c.backgroundColor,
           balken: d.style.getPropertyValue('--regel-balken'),
           stil: d.getAttribute('style') || '' };
}, a);


console.log('\n1 · Eine Regel färbt, was sie soll — und nur das');

await mitRegeln([{ bereich: 'A1:A6', art: 'groesser', wert: 100, farbe: 'gruen', an: true }]);
const a3 = await zelle('A3'), a1 = await zelle('A1'), b1 = await zelle('B1');
p('120 ist grösser als 100 und wird gefärbt', /regel-farbe/.test(a3?.klasse || ''),
  a3?.klasse);
p('10 nicht', !/regel-farbe/.test(a1?.klasse || ''), a1?.klasse);
/* AUSSERHALB DES BEREICHS PASSIERT NICHTS. Ohne diese Prüfung liesse sich
   der Bereich stillschweigend ignorieren, und beim ersten grossen Blatt
   wäre plötzlich alles bunt. */
p('Und B1 liegt ausserhalb des Bereichs', !/regel-farbe/.test(b1?.klasse || ''),
  b1?.klasse);
p('Die gefärbte Zelle hat wirklich eine Fläche',
  !!a3 && a3.grund !== 'rgba(0, 0, 0, 0)', a3?.grund);

/* DIE WERTE BLEIBEN, WAS SIE WAREN. Der Punkt, an dem eine bedingte
   Formatierung gefährlich würde. */
const unveraendert = await seite.evaluate(() => {
  const w = window as any;
  const bl = Store.getBlock(w.__bid).mappe.blaetter[0];
  return [1, 2, 3, 4, 5, 6].map(i => bl.zellen['A' + i]?.wert);
});
p('Die Werte selbst sind unverändert',
  JSON.stringify(unveraendert) === JSON.stringify([10, 50, 120, 50, 5, 300]),
  JSON.stringify(unveraendert));
gleich('Und der Text in der Zelle auch', a3?.text, '120');


console.log('\n2 · Die erste zutreffende Regel gewinnt');

/* Zwei Regeln auf derselben Zelle sind kein Fehler, sondern der Normalfall
   („über 100 grün, über 200 blau"). Es braucht nur eine feste Reihenfolge. */
await mitRegeln([
  { bereich: 'A1:A6', art: 'groesser', wert: 100, farbe: 'gruen', an: true },
  { bereich: 'A1:A6', art: 'groesser', wert: 200, farbe: 'blau', an: true }
]);
const erste = await zelle('A6');
p('A6 (300) nimmt die ERSTE passende Regel, nicht die letzte',
  /bg-green/.test(erste?.klasse || ''), erste?.klasse);

await mitRegeln([
  { bereich: 'A1:A6', art: 'groesser', wert: 200, farbe: 'blau', an: true },
  { bereich: 'A1:A6', art: 'groesser', wert: 100, farbe: 'gruen', an: true }
]);
const umgedreht = await zelle('A6');
p('… und in der anderen Reihenfolge die andere',
  /bg-blue/.test(umgedreht?.klasse || ''), umgedreht?.klasse);


console.log('\n3 · Alle Arten von Bedingung');

const faelle: Array<[string, any, string, boolean]> = [
  ['kleiner',   { art: 'kleiner', wert: 20 },                   'A5', true],
  ['kleiner (nicht)', { art: 'kleiner', wert: 20 },             'A3', false],
  ['gleich',    { art: 'gleich', wert: 50 },                    'A2', true],
  ['zwischen',  { art: 'zwischen', wert: 40, wert2: 60 },       'A4', true],
  ['zwischen (nicht)', { art: 'zwischen', wert: 40, wert2: 60 },'A1', false],
  ['leer',      { art: 'leer' },                                'B2', true],
  ['nichtLeer', { art: 'nichtLeer' },                           'B1', true]
];
for (const [name, teil, adr, soll] of faelle) {
  const bereich = adr.startsWith('B') ? 'B1:B6' : 'A1:A6';
  await mitRegeln([Object.assign({ bereich, farbe: 'gelb', an: true }, teil)]);
  const z = await zelle(adr);
  p(`${name}: ${adr} ${soll ? 'wird' : 'wird nicht'} gefärbt`,
    /regel-farbe/.test(z?.klasse || '') === soll, z?.klasse);
}

/* „Enthält" arbeitet auf Text und darf Gross und Klein nicht unterscheiden —
   wer nach „apfel" sucht, meint auch „Apfel". */
await mitRegeln([{ bereich: 'B1:B6', art: 'enthaelt', wert: 'apf', farbe: 'gelb', an: true }]);
const enth = await zelle('B1');
p('enthaelt: findet auch bei anderer Gross-/Kleinschreibung',
  /regel-farbe/.test(enth?.klasse || ''), enth?.klasse);

/* Doppelte Werte: 50 steht in A2 UND A4. */
await mitRegeln([{ bereich: 'A1:A6', art: 'doppelt', farbe: 'orange', an: true }]);
const [d2, d4, d1] = [await zelle('A2'), await zelle('A4'), await zelle('A1')];
p('doppelt: A2 und A4 (beide 50) werden gefärbt',
  /regel-farbe/.test(d2?.klasse || '') && /regel-farbe/.test(d4?.klasse || ''),
  `${d2?.klasse} | ${d4?.klasse}`);
p('… und die einmaligen nicht', !/regel-farbe/.test(d1?.klasse || ''), d1?.klasse);


console.log('\n4 · Skala und Balken rechnen mit dem Bereich');

await mitRegeln([{ bereich: 'A1:A6', art: 'skala', an: true }]);
const klein = await zelle('A5'), gross = await zelle('A6');
p('Der kleinste Wert bekommt eine andere Farbe als der grösste',
  !!klein && !!gross && klein.grund !== gross.grund,
  `${klein?.grund} vs ${gross?.grund}`);
/* Rot unten, grün oben — dieselbe Farbfolge wie die Heatmap der
   Datenbanken, damit dasselbe Bild dasselbe bedeutet. */
const rgb = (s: string) => (s.match(/[\d.]+/g) || []).map(Number);
const kr = rgb(klein?.grund || ''), gr = rgb(gross?.grund || '');
p('… und zwar rot beim kleinsten, grün beim grössten',
  (kr[0] ?? 0) > (kr[1] ?? 0) && (gr[1] ?? 0) > (gr[0] ?? 0),
  `klein ${klein?.grund}, gross ${gross?.grund}`);

await mitRegeln([{ bereich: 'A1:A6', art: 'balken', an: true }]);
const bKlein = await zelle('A5'), bGross = await zelle('A6'), bMitte = await zelle('A2');
p('Der Balken ist beim grössten Wert am längsten',
  parseFloat(bGross?.balken || '0') === 100, bGross?.balken);
/* DER BALKEN MISST VON NULL, nicht vom kleinsten Wert. Sonst wäre der
   kleinste null Pixel lang und sähe aus wie „nichts" — dabei ist 5 von
   300 ein Sechzigstel, nicht gar nichts. Genau so lügen Diagramme mit
   abgeschnittener Achse. Gesehen am Bildschirmfoto, nicht im Quelltext:
   in der ersten Fassung war Mai ein leeres Feld.
   5 von 300 sind rund 2 % — sichtbar wenig, aber sichtbar. */
const kleinP = parseFloat(bKlein?.balken || '0');
p('… beim kleinsten kurz, aber nicht null', kleinP > 0 && kleinP < 5,
  bKlein?.balken + ' — ein Balken von 0 % sähe aus wie „kein Wert"');
p('… und dazwischen dazwischen',
  parseFloat(bMitte?.balken || '0') > 0 && parseFloat(bMitte?.balken || '100') < 100,
  bMitte?.balken);
/* Und mit negativen Zahlen bleibt die Null der Boden — sonst gäbe es
   keinen ehrlichen Nullpunkt mehr. */
await mitRegeln([{ bereich: 'C1:C6', art: 'balken', an: true }]);
await seite.evaluate(() => {
  const w = window as any;
  const blk = Store.getBlock(w.__bid);
  const bl = blk.mappe.blaetter[0];
  [-40, 0, 60].forEach((v, i) => { bl.zellen['C' + (i + 1)] = { wert: v }; });
  Store.updateBlock(blk.id, { mappe: blk.mappe });
  const k = document.getElementById('pruef-regeln')!;
  k.innerHTML = '';
  k.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
});
await seite.waitForTimeout(300);
const [neg, null0, pos] = [await zelle('C1'), await zelle('C2'), await zelle('C3')];
p('Mit negativen Zahlen liegt die Null in der Mitte',
  parseFloat(neg?.balken || '99') === 0 &&
  Math.abs(parseFloat(null0?.balken || '0') - 40) <= 1 &&
  parseFloat(pos?.balken || '0') === 100,
  `${neg?.balken} / ${null0?.balken} / ${pos?.balken}`);
/* DER BALKEN LIEGT HINTER DEM TEXT. Neben ihm bräuchte er eigene Breite,
   und eine Tabellenspalte hat keine übrig — dann wäre entweder der Balken
   zwei Pixel lang oder die Zahl abgeschnitten. Abgeschnittene Zahlen sind
   in diesem Block die gefährlichste Sorte Fehler (siehe test111 §###). */
gleich('… und die Zahl steht trotzdem vollständig da', bGross?.text, '300');


console.log('\n5 · Abschalten, ohne zu löschen');

await mitRegeln([{ bereich: 'A1:A6', art: 'groesser', wert: 100, farbe: 'gruen', an: false }]);
const aus = await zelle('A3');
p('Eine abgeschaltete Regel färbt nicht', !/regel-farbe/.test(aus?.klasse || ''),
  aus?.klasse);
const nochDa = await seite.evaluate(() => {
  const w = window as any;
  return (Store.getBlock(w.__bid).mappe.blaetter[0].regeln || []).length;
});
gleich('… steht aber noch in der Liste', nochDa, 1);


console.log('\n6 · Die Auswahl gewinnt über die Farbe');

/* Eine gefärbte Zelle muss trotzdem als gewählt zu erkennen sein — sonst
   verliert man beim Malen die Stelle, an der man gerade steht. */
await mitRegeln([{ bereich: 'A1:A6', art: 'nichtLeer', farbe: 'gruen', an: true }]);
const gewaehlt = await seite.evaluate(async () => {
  const d = document.querySelector<HTMLElement>('#pruef-regeln [data-a="A3"]');
  d?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await new Promise(f => setTimeout(f, 250));
  const jetzt = document.querySelector<HTMLElement>('#pruef-regeln [data-a="A3"]');
  const c = jetzt ? getComputedStyle(jetzt) : null;
  return { klasse: jetzt?.className || '', schatten: c?.boxShadow || '' };
});
p('Die gewählte Zelle trägt beide Klassen',
  /gewaehlt/.test(gewaehlt.klasse) && /regel-farbe/.test(gewaehlt.klasse),
  gewaehlt.klasse);
p('… und ihr Auswahlrahmen ist zu sehen',
  /inset/.test(gewaehlt.schatten) && gewaehlt.schatten !== 'none',
  gewaehlt.schatten);


console.log('\n7 · Das Fenster legt Regeln an und nimmt sie zurück');

const fenster = await seite.evaluate(async () => {
  const w = window as any;
  const blk = Store.getBlock(w.__bid);
  blk.mappe.blaetter[0].regeln = [];
  Store.updateBlock(blk.id, { mappe: blk.mappe });
  const kasten = document.getElementById('pruef-regeln')!;
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(f => setTimeout(f, 200));
  /* Über das ⋯-Menü, wie ein Mensch es täte. */
  const mehr = kasten.querySelector<HTMLElement>('[data-a="mehr"]');
  mehr?.click();
  await new Promise(f => setTimeout(f, 300));
  const eintrag = document.querySelector<HTMLElement>('.menu [data-a="regeln"]');
  const da = !!eintrag;
  eintrag?.click();
  await new Promise(f => setTimeout(f, 350));
  return { imMenue: da, offen: !!document.querySelector('.overlay #rg-liste'),
           leerText: (document.querySelector('#rg-liste')?.textContent || '').trim() };
});
p('Die bedingte Formatierung steht im ⋯-Menü', fenster.imMenue);
p('… und öffnet ein Fenster', fenster.offen);
p('… das ohne Regeln sagt, was man tun kann',
  /Noch keine Regel/.test(fenster.leerText), fenster.leerText.slice(0, 60));

const angelegt = await seite.evaluate(async () => {
  const o = document.querySelector('.overlay')!;
  (o.querySelector('#rg-bereich') as HTMLInputElement).value = 'A1:A6';
  (o.querySelector('#rg-art') as HTMLSelectElement).value = 'groesser';
  o.querySelector('#rg-art')!.dispatchEvent(new Event('change', { bubbles: true }));
  (o.querySelector('#rg-wert') as HTMLInputElement).value = '100';
  (o.querySelector('#rg-farbe') as HTMLSelectElement).value = 'blau';
  o.querySelector<HTMLElement>('[data-a="add"]')!.click();
  await new Promise(f => setTimeout(f, 300));
  const w = window as any;
  const r = Store.getBlock(w.__bid).mappe.blaetter[0].regeln || [];
  return { anzahl: r.length, erste: r[0],
           zeilen: document.querySelectorAll('#rg-liste .fr-zeile').length,
           gemalt: !!document.querySelector('#pruef-regeln [data-a="A3"].regel-farbe') };
});
gleich('Hinzufügen legt eine Regel an', angelegt.anzahl, 1);
p('… mit allem, was eingegeben wurde',
  angelegt.erste?.bereich === 'A1:A6' && angelegt.erste?.art === 'groesser' &&
  String(angelegt.erste?.wert) === '100' && angelegt.erste?.farbe === 'blau',
  JSON.stringify(angelegt.erste));
gleich('… und sie steht in der Liste', angelegt.zeilen, 1);
/* SOFORT ZU SEHEN. Eine Regel, die man erst nach dem Schliessen des
   Fensters sieht, ist eine Regel, die man nicht ausprobieren kann. */
p('… und die Tabelle darunter ist sofort gefärbt', angelegt.gemalt === true);

const weggemacht = await seite.evaluate(async () => {
  document.querySelector<HTMLElement>('#rg-liste [data-weg="0"]')!.click();
  await new Promise(f => setTimeout(f, 300));
  const w = window as any;
  return { anzahl: (Store.getBlock(w.__bid).mappe.blaetter[0].regeln || []).length,
           gemalt: !!document.querySelector('#pruef-regeln [data-a="A3"].regel-farbe') };
});
gleich('🗑 nimmt sie wieder weg', weggemacht.anzahl, 0);
p('… und die Farbe verschwindet mit', weggemacht.gemalt === false);

/* Ein Feld, das nichts tut, ist eine Frage ohne Antwort: bei „ist leer"
   gibt es keinen Vergleichswert, bei „Farbverlauf" keine Farbe zu wählen. */
const felder = await seite.evaluate(async () => {
  const o = document.querySelector('.overlay')!;
  const setz = async (v: string) => {
    (o.querySelector('#rg-art') as HTMLSelectElement).value = v;
    o.querySelector('#rg-art')!.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    const sicht = (q: string) =>
      getComputedStyle(o.querySelector(q) as HTMLElement).display !== 'none';
    return { wert: sicht('#rg-wert'), wert2: sicht('#rg-wert2'), farbe: sicht('#rg-farbe') };
  };
  return { groesser: await setz('groesser'), zwischen: await setz('zwischen'),
           leer: await setz('leer'), skala: await setz('skala') };
});
p('Bei „grösser als" steht ein Wertfeld, aber kein zweites',
  felder.groesser.wert && !felder.groesser.wert2, JSON.stringify(felder.groesser));
p('Bei „zwischen" stehen zwei', felder.zwischen.wert && felder.zwischen.wert2,
  JSON.stringify(felder.zwischen));
p('Bei „ist leer" keines', !felder.leer.wert && !felder.leer.wert2,
  JSON.stringify(felder.leer));
p('Und beim Farbverlauf gibt es keine Farbe zu wählen', !felder.skala.farbe,
  JSON.stringify(felder.skala));

await seite.evaluate(() =>
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove()));


console.log('\n8 · Und am Telefon ist das Fenster bedienbar');

/* Vier Felder nebeneinander sind am Rechner richtig und auf 390 px alle
   unbedienbar. Sie brechen dort um; die kleinen Knöpfe ☑ und 🗑 werden
   zu Fingerzielen (CLAUDE.md §37). */
const handy = await browser.newPage({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true
});
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2400);
const eng = await handy.evaluate(async () => {
  const w = window as any;
  const s = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Handy' });
  const k = document.createElement('div');
  k.id = 'ph'; document.body.appendChild(k);
  k.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(f => setTimeout(f, 300));
  const b2 = Store.getBlock(blk.id);
  b2.mappe.blaetter[0].zellen['A1'] = { wert: 5 };
  b2.mappe.blaetter[0].regeln = [
    { bereich: 'A1:A6', art: 'groesser', wert: 1, farbe: 'rot', an: true }];
  Store.updateBlock(b2.id, { mappe: b2.mappe });
  k.innerHTML = '';
  k.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(f => setTimeout(f, 250));
  k.querySelector<HTMLElement>('[data-a="mehr"]')?.click();
  await new Promise(f => setTimeout(f, 350));
  document.querySelector<HTMLElement>('.menu [data-a="regeln"]')?.click();
  await new Promise(f => setTimeout(f, 400));
  const o = document.querySelector('.overlay');
  if (!o) return null;
  const hoch = (q: string) => {
    const el = o.querySelector<HTMLElement>(q);
    return el ? Math.round(el.getBoundingClientRect().height) : 0;
  };
  const kasten = o.getBoundingClientRect();
  const hin = o.querySelector<HTMLElement>('.rg-hinweis');
  const hr = hin?.getBoundingClientRect();
  return {
    bereich: hoch('#rg-bereich'), art: hoch('#rg-art'),
    add: hoch('[data-a="add"]'),
    schalter: hoch('.rg-liste [data-an]'), weg: hoch('.rg-liste [data-weg]'),
    ueberRand: !!hr && (hr.left < kasten.left + 8 || hr.right > kasten.right - 8),
    zeilen: new Set([...o.querySelectorAll<HTMLElement>('.rg-neu input, .rg-neu select')]
      .map(x => Math.round(x.getBoundingClientRect().top))).size
  };
});
p('Das Fenster geht am Telefon auf', eng !== null);
p('Die Felder sind mit dem Finger zu treffen',
  !!eng && eng.bereich >= 44 && eng.art >= 44 && eng.add >= 44,
  JSON.stringify(eng));
p('… auch An/Aus und Löschen an einer Regel',
  !!eng && eng.schalter >= 44 && eng.weg >= 44,
  `☑ ${eng?.schalter}, 🗑 ${eng?.weg}`);
/* Vier Felder in EINER Zeile wären auf 390 px je 90 px breit. */
p('Die Felder brechen um, statt zu schrumpfen', !!eng && eng.zeilen > 1,
  String(eng?.zeilen) + ' Zeilen');
p('Und der Hinweistext stösst nicht an den Rahmen', eng?.ueberRand === false);
await handy.close();


/* ===========================================================================
 * 10 · SYMBOLREGELN — der erste der zwei Reste aus L15
 *
 * Ein Symbol färbt nicht, es stellt sich vor den Wert. Deshalb kann es
 * nicht bei den Vergleichsregeln stehen: es trifft nicht „zu" oder „nicht
 * zu", es sagt bei jedem Wert etwas.
 *
 * Der Punkt, an dem es falsch wäre: das Symbol IN die Zelle zu schreiben.
 * Dann stünde es in `wert`, ginge beim Kopieren nach Excel als Text mit
 * und die Zelle rechnete nicht mehr. Es steht deshalb in einer CSS-
 * Eigenschaft, und dieser Abschnitt prüft genau das mit.
 * ========================================================================= */
console.log('\n10 · Symbolregeln');

/* A1..A6 = 10, 50, 120, 50, 5, 300 — Spanne 5 bis 300. */
await mitRegeln([{ bereich: 'A1:A6', art: 'symbol', satz: 'ampel', an: true }]);
const [s5, s120, s300] = [await zelle('A5'), await zelle('A3'), await zelle('A6')];
p('Die Zelle bekommt die Symbolklasse', /regel-symbol/.test(s300?.klasse || ''),
  s300?.klasse);
p('Der kleinste Wert bekommt das unterste Symbol',
  (s5?.stil || '').includes('🔴'), s5?.stil);
p('Der grösste das oberste', (s300?.stil || '').includes('🟢'), s300?.stil);
p('Und dazwischen das mittlere', (s120?.stil || '').includes('🟡'), s120?.stil);

/* DAS IST DER PUNKT, DER ZÄHLT: der Wert darf sich nicht ändern. */
p('Der Zellinhalt bleibt die blosse Zahl', s300?.text === '300',
  JSON.stringify(s300?.text));
const unberuehrt = await seite.evaluate(() => {
  const w = window as any;
  return Store.getBlock(w.__bid).mappe.blaetter[0].zellen['A6'].wert;
});
p('… und gespeichert steht sie ebenso da', unberuehrt === 300, String(unberuehrt));

/* Eigene Grenzen schlagen die Drittelung: bei „ab 50 und ab 80" ist 79
   gelb, auch wenn im Blatt eine 300 steht. */
await mitRegeln([{ bereich: 'A1:A6', art: 'symbol', satz: 'ampel',
                   wert: 50, wert2: 80, an: true }]);
const g10 = await zelle('A1'), g50 = await zelle('A2'), g120 = await zelle('A3');
p('Eigene Grenzen: 10 liegt unter 50 → rot', (g10?.stil || '').includes('🔴'), g10?.stil);
p('… 50 liegt dazwischen → gelb', (g50?.stil || '').includes('🟡'), g50?.stil);
p('… 120 liegt über 80 → grün', (g120?.stil || '').includes('🟢'), g120?.stil);

/* Umgekehrt, für Werte, bei denen klein gut ist. */
await mitRegeln([{ bereich: 'A1:A6', art: 'symbol', satz: 'ampel',
                   umgekehrt: true, an: true }]);
const u5 = await zelle('A5'), u300 = await zelle('A6');
p('Umgekehrt: der kleinste Wert wird grün', (u5?.stil || '').includes('🟢'), u5?.stil);
p('… und der grösste rot', (u300?.stil || '').includes('🔴'), u300?.stil);

/* Die anderen Sätze. */
await mitRegeln([{ bereich: 'A1:A6', art: 'symbol', satz: 'pfeile', an: true }]);
const pf = await zelle('A6');
p('Der Pfeilsatz nimmt Pfeile', (pf?.stil || '').includes('▲'), pf?.stil);

/* Text hat keine Stufe — und darf deshalb kein Symbol bekommen. */
await mitRegeln([{ bereich: 'B1:B6', art: 'symbol', satz: 'ampel', an: true }]);
const txt = await zelle('B1'), leerZ = await zelle('B2');
p('Text bekommt kein Symbol', !/regel-symbol/.test(txt?.klasse || ''), txt?.klasse);
p('Eine leere Zelle auch nicht', !/regel-symbol/.test(leerZ?.klasse || ''), leerZ?.klasse);

/* Und die Anzeige selbst. Ohne `flex:none` würde das Symbol in einer engen
   Spalte mitgestaucht — und ein halber Kreis bedeutet nichts. Genau diese
   Sorte Fehler hat beim Tabellenblock nur das Hinsehen gefunden
   (CLAUDE.md §55.2), deshalb steht sie hier als Zahl. */
await mitRegeln([{ bereich: 'A1:A6', art: 'symbol', satz: 'ampel', an: true }]);
const eng6 = await seite.evaluate(() => {
  const d = document.querySelector<HTMLElement>('#pruef-regeln [data-a="A6"]');
  if (!d) return null;
  const v = getComputedStyle(d, '::before');
  return { grow: v.flexGrow, shrink: v.flexShrink, inhalt: v.content };
});
p('Das Symbol wird nicht mitgestaucht',
  eng6?.shrink === '0' && eng6?.grow === '0', JSON.stringify(eng6));
p('… und der Zeichner setzt es wirklich ein',
  (eng6?.inhalt ?? '').includes('🟢'), JSON.stringify(eng6?.inhalt));

/* ===========================================================================
 * 11 · ÜBERFÄLLIG — der zweite Rest aus L15
 *
 * Ein Datumsvergleich gegen heute, und „heute" heisst ORTSZEIT um
 * Mitternacht. `new Date('2026-08-10')` liest ISO als UTC; östlich von
 * Greenwich wäre das der Vortag um zwei Uhr nachts, und die Regel spränge
 * einen Tag zu früh an. Deshalb wird das Datum aus seinen Teilen gebaut.
 *
 * Der zweite Punkt: was KEIN Datum ist, ist nicht überfällig — sondern gar
 * nichts. Eine 5 in einer Datumsspalte darf nicht rot werden, nur weil sie
 * kleiner ist als irgendetwas.
 * ========================================================================= */
console.log('\n11 · Überfällige und bald fällige Daten');

const daten = await seite.evaluate(() => {
  const w = window as any;
  const blk = Store.getBlock(w.__bid);
  const blatt = blk.mappe.blaetter[0];
  const tag = (v: number) => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + v);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-` +
           `${String(d.getDate()).padStart(2, '0')}`;
  };
  blatt.zellen['C1'] = { wert: tag(-30) };   /* lange vorbei      */
  blatt.zellen['C2'] = { wert: tag(-1) };    /* gestern           */
  blatt.zellen['C3'] = { wert: tag(0) };     /* heute             */
  blatt.zellen['C4'] = { wert: tag(3) };     /* in drei Tagen     */
  blatt.zellen['C5'] = { wert: tag(30) };    /* weit weg          */
  blatt.zellen['C6'] = { wert: 5 };          /* gar kein Datum    */
  Store.updateBlock(blk.id, { mappe: blk.mappe });
  return { gestern: tag(-1), heute: tag(0) };
});

await mitRegeln([{ bereich: 'C1:C6', art: 'ueberfaellig', farbe: 'rot', an: true }]);
const [c1, c2, c3, c4, c6] = [await zelle('C1'), await zelle('C2'), await zelle('C3'),
                              await zelle('C4'), await zelle('C6')];
p('Ein Datum von vor dreissig Tagen ist überfällig',
  /regel-farbe/.test(c1?.klasse || ''), c1?.klasse);
p('Gestern ebenfalls', /regel-farbe/.test(c2?.klasse || ''),
  `${daten.gestern} → ${c2?.klasse}`);
/* DIE GRENZE. Heute ist nicht überfällig — sonst wäre jede Aufgabe, die
   heute fällig ist, schon am Morgen rot. */
p('Heute ist NICHT überfällig', !/regel-farbe/.test(c3?.klasse || ''),
  `${daten.heute} → ${c3?.klasse}`);
p('Ein künftiges Datum auch nicht', !/regel-farbe/.test(c4?.klasse || ''), c4?.klasse);
p('Und eine blosse Zahl ist kein überfälliges Datum',
  !/regel-farbe/.test(c6?.klasse || ''), c6?.klasse);

/* Deutsche Schreibweise muss ebenso gehen — sie ist die, die ein Mensch
   hier eintippt. */
await seite.evaluate(() => {
  const w = window as any;
  const blk = Store.getBlock(w.__bid);
  blk.mappe.blaetter[0].zellen['C6'] = { wert: '01.01.2020' };
  Store.updateBlock(blk.id, { mappe: blk.mappe });
});
await mitRegeln([{ bereich: 'C1:C6', art: 'ueberfaellig', farbe: 'rot', an: true }]);
const deutsch = await zelle('C6');
p('01.01.2020 wird als Datum gelesen', /regel-farbe/.test(deutsch?.klasse || ''),
  deutsch?.klasse);

await mitRegeln([{ bereich: 'C1:C6', art: 'faelligBald', wert: 7, farbe: 'orange', an: true }]);
const [b3, b4, b5, b2] = [await zelle('C3'), await zelle('C4'),
                          await zelle('C5'), await zelle('C2')];
p('Bald fällig: heute zählt mit', /regel-farbe/.test(b3?.klasse || ''), b3?.klasse);
p('… in drei Tagen auch', /regel-farbe/.test(b4?.klasse || ''), b4?.klasse);
p('… in dreissig Tagen nicht mehr', !/regel-farbe/.test(b5?.klasse || ''), b5?.klasse);
p('… und gestern ist nicht bald, sondern vorbei',
  !/regel-farbe/.test(b2?.klasse || ''), b2?.klasse);

/* Ohne Angabe sieben Tage — eine Regel ohne Zahl darf nicht nichts tun. */
await mitRegeln([{ bereich: 'C1:C6', art: 'faelligBald', farbe: 'orange', an: true }]);
const ohneZahl = await zelle('C4');
p('Ohne Tagesangabe gelten sieben Tage', /regel-farbe/.test(ohneZahl?.klasse || ''),
  ohneZahl?.klasse);

/* Und im Fenster stehen die drei neuen Arten zur Auswahl. */
const imFenster = await seite.evaluate(() => {
  const w = window as any;
  const arten = w.SpreadsheetView.REGELARTEN ?? [];
  return arten.map((x: any) => x[0]);
});
p('Die neuen Arten stehen im Regelkatalog',
  ['ueberfaellig', 'faelligBald', 'symbol'].every(a => (imFenster as string[]).includes(a)),
  JSON.stringify(imFenster));


/* ===========================================================================
 * 11b · UND DAS GANZE WESTLICH VON GREENWICH
 *
 * Hier entscheidet sich, ob „Ortszeit" eine Behauptung ist oder eine
 * Zusicherung. `new Date('2026-08-08')` ergibt UTC-Mitternacht. In Zürich
 * fällt das nicht auf; in Los Angeles ist derselbe Zeitpunkt der 7. August
 * um 17 Uhr — und damit läge ein Datum, das HEUTE ist, vor der heutigen
 * Mitternacht. Jede heute fällige Aufgabe wäre am Morgen schon rot.
 *
 * Deshalb baut `alsDatum` das Datum aus seinen Teilen. Diese Prüfung ist
 * die einzige Stelle, an der ein Unterschied überhaupt sichtbar wird: mit
 * `viewport` und `hasTouch` hat sie nichts zu tun, nur mit `timezoneId`.
 * ========================================================================= */
console.log('\n11b · Dieselbe Rechnung in Los Angeles (UTC−7)');

const westen = await browser.newContext({
  viewport: { width: 1280, height: 900 }, timezoneId: 'America/Los_Angeles'
});
const wSeite = await westen.newPage();
await wSeite.goto(`http://localhost:${PORT}/index.html`);
await wSeite.waitForTimeout(2400);

const wErg = await wSeite.evaluate(async () => {
  const w = window as any;
  const s = Object.values(Store.cache.blocks)
    .find((b: any) => b.type === 'page' && b.alive) as any;
  const blk = Store.addBlock(s.id, 'spreadsheet', { text: 'Westen' });
  const kasten = document.createElement('div');
  kasten.id = 'pruef-west';
  document.body.appendChild(kasten);
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 300));

  const b2 = Store.getBlock(blk.id);
  const blatt = b2.mappe.blaetter[0];
  const tag = (v: number) => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + v);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-` +
           `${String(d.getDate()).padStart(2, '0')}`;
  };
  blatt.zellen['A1'] = { wert: tag(0) };    /* heute, örtlich */
  blatt.zellen['A2'] = { wert: tag(-1) };   /* gestern        */
  blatt.regeln = [{ bereich: 'A1:A2', art: 'ueberfaellig', farbe: 'rot', an: true }];
  Store.updateBlock(b2.id, { mappe: b2.mappe });
  kasten.innerHTML = '';
  kasten.appendChild(w.SpreadsheetView.zeichne(Store.getBlock(blk.id)));
  await new Promise(r => setTimeout(r, 250));

  const lies = (a: string) =>
    document.querySelector<HTMLElement>(`#pruef-west [data-a="${a}"]`)?.className ?? '';
  return { zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
           versatz: new Date().getTimezoneOffset(),
           heute: lies('A1'), gestern: lies('A2'), datum: tag(0) };
});

p('Der Browser steht wirklich westlich von Greenwich',
  (wErg as any).versatz > 0, `Versatz ${(wErg as any).versatz} min, ${(wErg as any).zone}`);
p('Ein heute fälliges Datum ist dort ebenfalls nicht überfällig',
  !/regel-farbe/.test((wErg as any).heute), `${(wErg as any).datum} → ${(wErg as any).heute}`);
p('… und gestern ist es weiterhin', /regel-farbe/.test((wErg as any).gestern),
  (wErg as any).gestern);
await westen.close();


console.log('\n12 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 94 — Bedingte Formatierung: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
