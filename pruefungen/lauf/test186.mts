/* Suite 152 — Ein Dateiname ist kein HTML (E112)
 * ============================================================================
 * `Dialog.wahl` escapte seinen Titel. `Dialog.frage`, zehn Zeilen darüber in
 * derselben Datei, tat es nicht — sie setzte ihn roh ins `innerHTML`.
 *
 * Das war jahrelang folgenlos, weil jeder Aufrufer eine feste Zeichenkette
 * übergab: „Blatt umbenennen". Mit E110 kam der erste Aufrufer mit FREMDEM
 * Text — dem Dateinamen eines PDFs.
 *
 * NACHGESTELLT UND BESTÄTIGT: eine Datei namens
 *
 *     <img src=x onerror="…">.pdf
 *
 * liess den Code laufen. Es genügte, sie hereinzuziehen und ein Passwort
 * verlangt zu bekommen. §19 verbietet genau das.
 *
 * DIESE SUITE PRÜFT NICHT DEN EINEN WEG, SONDERN DAS LOCH. Die Lücke sass
 * nicht im Aufrufer, sondern im Dialog — also wird der Dialog geprüft, mit
 * allem, was ein Dateiname sein kann.
 *
 *   node pruefungen/lauf/test186.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { machGeschuetztesPdf } from '../hilfe/krypto-pdf.mts';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8940;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.setViewportSize({ width: 1300, height: 800 });
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

/* ==========================================================================
 * §1 · Der echte Weg: eine Datei mit bösem Namen hereinziehen
 * --------------------------------------------------------------------------
 * `<img src=x onerror=…>` ist der ehrlichste Versuch: das Bild lädt nie,
 * also feuert `onerror` von selbst — ohne Klick, ohne Zutun. Wer den Namen
 * ungeprüft ins `innerHTML` gibt, führt fremden Code aus, sobald der Dialog
 * aufgeht.
 * ========================================================================*/
console.log('\n1 · Der echte Weg: eine Datei mit bösem Namen hereinziehen');

const PDF = machGeschuetztesPdf([['Geheim', 'A']], 'muh');
const BOESE = '<img src=x onerror="window.__geknackt=1">.pdf';

await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Probe' });
  App.oeffne(s.id);
  return s.id;
});
await seite.waitForFunction(() => !!document.getElementById('scroll'));
await seite.evaluate(([hex, name]: string[]) => {
  const bytes = Uint8Array.from((hex!.match(/../g) || []).map(h => parseInt(h, 16)));
  const dt = new DataTransfer();
  dt.items.add(new File([bytes], name!, { type: 'application/pdf' }));
  document.getElementById('scroll')!.dispatchEvent(
    new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, [PDF.toString('hex'), BOESE]);

await seite.waitForSelector('.overlay #fq', { timeout: 25000 });
await seite.waitForTimeout(700);

const nachDemDialog = await seite.evaluate(() => ({
  geknackt: !!(window as any).__geknackt,
  bilder: document.querySelectorAll('.overlay :is(.fh, .ui-touch-dialog-title, .ui-touch-action-sheet-title) img').length,
  titelHtml: document.querySelector('.overlay :is(.fh, .ui-touch-dialog-title, .ui-touch-action-sheet-title)')?.innerHTML || '',
  titelText: document.querySelector('.overlay :is(.fh, .ui-touch-dialog-title, .ui-touch-action-sheet-title)')?.textContent || '',
}));

p('Es lief kein fremder Code', !nachDemDialog.geknackt);
gleich('Und es entstand kein Element aus dem Namen', nachDemDialog.bilder, 0);
p('Die spitze Klammer steht als Text da',
  /&lt;img/.test(nachDemDialog.titelHtml), nachDemDialog.titelHtml.slice(0, 90));
p('Der Mensch sieht den Namen trotzdem',
  nachDemDialog.titelText.includes('<img src=x'), nachDemDialog.titelText.slice(0, 90));

await seite.click('.overlay [data-a="zu"]');
await seite.waitForTimeout(400);

/* ==========================================================================
 * §2 · Und das Loch selbst — beide Dialoge, alle Felder
 * --------------------------------------------------------------------------
 * Nicht nur der eine Weg von oben. Wer nur den Aufrufer prüft, hat beim
 * nächsten Aufrufer dasselbe Loch.
 * ========================================================================*/
console.log('\n2 · Und das Loch selbst — beide Dialoge, alle Felder');

const BOESARTIG = [
  '<img src=x onerror="window.__f1=1">',
  '<svg onload="window.__f2=1">',
  '"><script>window.__f3=1</script>',
  "'><img src=x onerror='window.__f4=1'>",
];

const dialogProbe = await seite.evaluate(async (proben: string[]) => {
  const gefunden: Record<string, unknown> = {};
  const zaehle = (wo: string) => {
    const o = document.querySelector('.overlay');
    gefunden[wo] = {
      elemente: o ? o.querySelectorAll('img, svg, script').length : -1,
      html: o ? (o.querySelector('.fh')?.innerHTML || '') : '',
    };
  };

  /* frage: Titel */
  for (const b of proben) {
    const versprechen = Dialog.frage(b, '');
    await new Promise(r => setTimeout(r, 60));
    zaehle('frage-titel:' + proben.indexOf(b));
    (document.querySelector('.overlay [data-a="zu"]') as HTMLElement)?.click();
    await versprechen;
  }
  /* frage: Vorgabe (steht in einem Attribut) */
  const v = Dialog.frage('Titel', proben[0]!);
  await new Promise(r => setTimeout(r, 60));
  gefunden['frage-vorgabe'] = {
    elemente: document.querySelectorAll('.overlay img, .overlay svg').length,
    wert: (document.querySelector('.overlay #fq') as HTMLInputElement)?.value || '',
  };
  (document.querySelector('.overlay [data-a="zu"]') as HTMLElement)?.click();
  await v;

  /* wahl: Titel, Text und Knopftexte */
  const w = Dialog.wahl({ titel: proben[0]!, text: proben[1]!,
    knoepfe: [{ id: 'a', text: proben[2]!, hinweis: proben[3]! },
              { id: '', text: 'Abbrechen' }] });
  await new Promise(r => setTimeout(r, 60));
  gefunden['wahl'] = {
    elemente: document.querySelectorAll('.overlay img, .overlay svg, .overlay script').length,
  };
  (document.querySelector('.overlay [data-w=""]') as HTMLElement)?.click();
  await w;

  return {
    gefunden,
    marken: [1, 2, 3, 4].map(i => !!(window as any)['__f' + i]),
  };
}, BOESARTIG);

p('Kein einziger Versuch hat Code ausgeführt',
  dialogProbe.marken.every(x => !x), JSON.stringify(dialogProbe.marken));
const alleElemente = Object.entries(dialogProbe.gefunden)
  .map(([k, v]) => `${k}=${(v as any).elemente}`);
p('Und keiner hat ein Element erzeugt',
  Object.values(dialogProbe.gefunden).every((v: any) => v.elemente === 0),
  alleElemente.join(', '));
p('Die Vorgabe steht unversehrt im Feld',
  String((dialogProbe.gefunden as any)['frage-vorgabe']?.wert) === BOESARTIG[0],
  String((dialogProbe.gefunden as any)['frage-vorgabe']?.wert));

/* ==========================================================================
 * §3 · Die Meldungen daneben
 * ========================================================================*/
console.log('\n3 · Die Meldungen daneben');

const meldung = await seite.evaluate((b: string) => {
  UI.toast('„' + b + '" ist da');
  const t = document.getElementById('toast');
  return { html: t?.innerHTML || '', text: t?.textContent || '',
           elemente: t?.querySelectorAll('img, svg').length ?? -1 };
}, BOESARTIG[0]!);

gleich('Der Hinweis erzeugt kein Element', meldung.elemente, 0);
p('Er zeigt den Namen als Text', meldung.text.includes('<img src=x'),
  meldung.text.slice(0, 60));

/* ==========================================================================
 * §4 · Was der Quelltext verspricht
 * ========================================================================*/
console.log('\n4 · Was der Quelltext verspricht');

const roh = fs.readFileSync(
  path.join(WURZEL, 'src/schale/ueberlagerung/dialog.ts'), 'utf8');
const code = roh.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

gleich('Es gibt GENAU EINE Escape-Funktion in der Datei',
  (code.match(/const esc = /g) || []).length, 1);
p('Sie ersetzt alle fünf Zeichen (§19)',
  /&amp;/.test(code) && /&lt;/.test(code) && /&gt;/.test(code) &&
  /&quot;/.test(code) && /&#39;/.test(code));
/* GEZAEHLT, nicht bloss gefunden. Jeder Dialog setzt einen `.fh`-Titel;
   ein `test()` faende den escapten in `wahl` auch dann noch, wenn der in
   `frage` daneben roh dastuende — und waere gruen. Gemessen: genau so war
   es, bis hier gezaehlt wurde (§55.2).

   GEGEN DIE GESAMTZAHL, nicht gegen eine feste Zahl. Hier stand `2`, und
   mit `mehrzeilig` (E267) wurden es drei — die Pruefung wurde rot, obwohl
   alle drei escapt sind. Eine Zahl, die bei jedem neuen Dialog von Hand
   nachgezogen werden muss, wird irgendwann nachgezogen statt geprueft.
   So bleibt die Aussage dieselbe und haelt: JEDER Titel geht hindurch. */
const titelAlle   = (code.match(/class="fh">/g) || []).length;
const titelEscapt = (code.match(/class="fh">\$\{esc\(titel\)\}/g) || []).length;
gleich('JEDER Dialogtitel geht durch sie hindurch', titelEscapt, titelAlle);
p('Und es sind wirklich welche da',
  titelAlle >= 3, String(titelAlle));
gleich('Und keiner steht roh da',
  (code.match(/class="fh">\$\{titel\}/g) || []).length, 0);
p('Die Vorgabe auch',
  /value="\$\{esc\(vorgabe\)\}"/.test(code));

/* Und nirgends sonst in dieser Datei landet etwas ungeprüft im innerHTML. */
const rohEingesetzt = [...code.matchAll(/\$\{(?!esc\()([a-zA-Z][\w.]*)\}/g)]
  .map(m => m[1])
  .filter(n => !['feldArt', 'i'].includes(String(n)));
p('Und keine andere Einsetzung geht ungeprüft hinein',
  rohEingesetzt.length === 0, rohEingesetzt.join(', '));

/* ==========================================================================
 * §5 · Drucken: die Bild-Adresse ist auch ein Attribut
 * --------------------------------------------------------------------------
 * Dieselbe Lücke, zwei Zeilen weiter — und keine, die ein Dateiname öffnet,
 * sondern eine SICHERUNG. Die Daten-Adresse eines Seitenbildes trägt ihren
 * MIME-Teil wörtlich aus dem Datei-Satz:
 *
 *     data:image/png;base64,…        so soll es sein
 *     data:image/png" onerror="…     so steht es da, wenn der Satz das sagt
 *
 * Und der Satz sagt, was in `dateien.json` stand — bei einer eingespielten
 * `.redion` also, was der Absender hineingeschrieben hat. Der Blob-Bauer
 * lässt das durch: er verwirft nur Zeichen ausserhalb U+0020–U+007E, und
 * das Anführungszeichen gehört nicht dazu.
 *
 * Die Folie escapt seit E109. Der Druck tat es nicht. Geprüft wird der
 * DRUCKRAHMEN selbst, nicht der Quelltext — was gedruckt wird, steht im
 * Rahmen (E111).
 * ========================================================================*/
console.log('\n5 · Drucken: die Bild-Adresse ist auch ein Attribut');

/* Der Schwanz `;base64,…` haengt IMMER hinten dran — die Daten-Adresse
   setzt ihn selbst. Ein Angreifer, der ihn nicht mitdenkt, schreibt sich
   den eigenen Handler kaputt (gemessen: `parent.__druck=1;base64,AQIDBA==`
   ist ein Syntaxfehler und laeuft nicht). Also faengt der Angriff ihn mit
   einem letzten Attribut auf. Wer die Probe leichter macht als die Wirk-
   lichkeit, prueft nichts. */
const BOESER_TYP = 'image/png" onerror="parent.__druck=1" x="';

const druckProbe = await seite.evaluate(async (typ: string) => {
  const s = Store.addPage(null, { text: 'Druckprobe' });
  /* Vier Bytes genügen — es soll nie ein Bild werden, es soll `onerror`
     auslösen, falls das Attribut überhaupt entsteht. */
  const satz = await Dateien.ablegen(
    new File([new Uint8Array([1, 2, 3, 4])], 'seite.png', { type: typ }),
    { abgeleitet: true });
  Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842,
    bildDateiId: satz.id, quelleId: 'q-druck' });

  (window as any).__druck = 0;
  await Werkzeuge.drucken(s);

  const rahmen = [...document.querySelectorAll('iframe')]
    .filter(f => (f as HTMLIFrameElement).style.position === 'fixed')
    .pop() as HTMLIFrameElement | undefined;
  const d = rahmen?.contentDocument;
  const bild = d?.querySelector('.blatt-druck img') as HTMLImageElement | null;
  const antwort = {
    /* Der gespeicherte Typ, damit sichtbar bleibt, dass der Angriff
       überhaupt bis hierher gekommen ist. */
    typGespeichert: (await Store.dateiHolen(satz.id))?.typ || '',
    bilder: d?.querySelectorAll('.blatt-druck img').length ?? -1,
    /* `getAttribute`, nicht `.src`: `.src` löst auf und verschluckt den Bruch. */
    srcRoh: bild?.getAttribute('src') || '',
    hatOnerror: !!bild?.getAttribute('onerror'),
    attribute: bild ? [...bild.attributes].map(a => a.name).sort().join(',') : '',
  };
  /* Der Rahmen bleibt STEHEN. Wird er hier entfernt, kommt das Bild nie
     dazu, sein `onerror` zu feuern — und die Prüfung unten wäre grün, weil
     nichts geschah, nicht weil nichts geschehen konnte. Eine Prüfung, die
     nicht rot werden kann, ist keine (§55.2). Weggeräumt wird nachher. */
  return antwort;
}, BOESER_TYP);

/* Zuerst: ist der Angriff überhaupt angekommen? Eine Prüfung, die nur
   „kein onerror" sagt, wäre auch dann grün, wenn der Blob-Bauer den Typ
   längst verworfen hätte — und würde nichts prüfen. */
gleich('Der böse MIME-Typ steht wirklich im Datei-Satz',
  druckProbe.typGespeichert, BOESER_TYP);
gleich('Der Druckrahmen zeigt das Seitenbild', druckProbe.bilder, 1);
p('Es gibt kein `onerror` am Bild', !druckProbe.hatOnerror, druckProbe.attribute);
gleich('Das Bild trägt nur `src` und `alt` und nichts Fremdes',
  druckProbe.attribute, 'alt,src');
p('Die Adresse steht ungebrochen in EINEM Attribut',
  druckProbe.srcRoh.startsWith('data:') &&
  druckProbe.srcRoh.includes('onerror'), druckProbe.srcRoh.slice(0, 70));

/* Jetzt Zeit lassen: das Bild muss scheitern dürfen, damit `onerror` — wenn
   es denn eines gibt — auch wirklich feuert. (Gegenprobe gemessen: ohne
   `esc` steht `onerror` am Bild UND `__druck` springt auf 1.) */
/* 300 ms reichen: das Bild ist sofort fertig-gescheitert (gemessen:
   `complete=true, naturalWidth=0` schon beim ersten Hinsehen), und
   `drucken` raeumt seinen Rahmen nach rund 1300 ms selbst weg. */
await seite.waitForTimeout(300);
const nachDruck = await seite.evaluate(() => {
  const n = Number((window as any).__druck) || 0;
  [...document.querySelectorAll('iframe')]
    .filter(f => (f as HTMLIFrameElement).style.position === 'fixed')
    .forEach(f => f.remove());
  return n;
});
gleich('Und im Rahmen lief kein fremder Code', nachDruck, 0);

/* ==========================================================================
 * §6 · Die Seitenzahl in der Leiste
 * --------------------------------------------------------------------------
 * `Marken.leiste` setzt ihren Zusatz per `innerHTML`. Der Zusatz der
 * PDF-Seite baut `block.nr` sorgfältig über `Number()` ab — und hängte
 * `block.vonSeiten` roh daneben. Beim eigenen Einlesen ist das die
 * Seitenzahl des Dokuments und harmlos; aus einer eingespielten Sicherung
 * ist es, was dort steht.
 *
 * Eine Zahl kann nichts sein ausser einer Zahl.
 * ========================================================================*/
console.log('\n6 · Die Seitenzahl in der Leiste');

const leisteProbe = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Leistenprobe' });
  Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 3, bw: 595, bh: 842, quelleId: 'q-leiste',
    vonSeiten: '<img src=x onerror="window.__leiste=1">' });
  (window as any).__leiste = 0;
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 500));
  const nr = document.querySelector('.pdfs-nr');
  return {
    geknackt: Number((window as any).__leiste) || 0,
    bilder: document.querySelectorAll('.blatt-fest img, .pdfs-nr img').length,
    text: nr?.textContent || '',
    html: nr?.innerHTML || '',
  };
});

gleich('Es lief kein fremder Code', leisteProbe.geknackt, 0);
gleich('Und es entstand kein Element', leisteProbe.bilder, 0);
p('Die Leiste zeigt nur die Seitenzahl',
  leisteProbe.text.trim() === 'Seite 3', JSON.stringify(leisteProbe.text));
p('Im HTML steht keine spitze Klammer',
  !/[<>]/.test(leisteProbe.html), leisteProbe.html.slice(0, 80));

/* Und die richtige Angabe geht nicht verloren: eine echte Zahl bleibt. */
const echteZahl = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Leiste zwei' });
  Store.addBlock(s.id, 'pdfseite', {
    text: '', nr: 3, vonSeiten: 40, bw: 595, bh: 842, quelleId: 'q-leiste2' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 500));
  return document.querySelector('.pdfs-nr')?.textContent?.trim() || '';
});
gleich('Eine echte Zahl steht weiterhin da', echteZahl, 'Seite 3 von 40');

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
