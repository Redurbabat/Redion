/* Suite 557 — Fett ist ein Schalter, und Strg+B nimmt denselben Weg
 * ============================================================================
 * ZWEI FUNDE AN EINER STELLE, und der zweite ist der teurere.
 *
 * ─── FUND 1 · Fett kennt kein Zurück ────────────────────────────────────────
 * `umschliesse('**')` legt Marken um die Auswahl — immer. Wer ein fettes
 * Wort markiert und noch einmal Strg+B drückt, bekommt `****Wort****`. In
 * jedem Textprogramm der Welt ist Fett ein SCHALTER; hier war es ein
 * Stempel. Und `****Wort****` ist nicht nur hässlich: gezeichnet wird daraus
 * `**Wort**` als sichtbarer Text, also steht die Marke plötzlich im Absatz.
 *
 * ─── FUND 2 · Es gibt ZWEI `umschliesse` ────────────────────────────────────
 * E650 hat den Fehler mit `String.replace` in `auswahlleiste.ts` repariert —
 * aber `editor.ts` hat seine EIGENE Fassung, und Strg+B ruft die. Sie macht
 * etwas ganz anderes:
 *
 *     r.insertNode(document.createTextNode(marke + txt + marke));
 *     Store.updateBlock(blk.dataset.bid, { text: ct.textContent });
 *
 * `ct.textContent` ist der GEZEICHNETE Text. In einem Block `Ein **fetter**
 * Satz` steht dort `Ein fetter Satz` — ohne Sterne. Wer irgendwo in diesem
 * Block Strg+B drückt, speichert den gezeichneten Text zurück und LÖSCHT
 * damit jede Auszeichnung, die der Block vorher hatte. Kein Absturz, keine
 * Meldung; das Fett von gestern ist einfach weg.
 *
 * Das ist §8 in einem Satz: „Keine doppelten Kataloge einführen. Ein zweiter
 * Katalog für dasselbe läuft mit dem ersten auseinander, und niemand merkt,
 * welcher gilt." Hier sind es zwei Fassungen derselben Funktion, und die
 * Reparatur von E650 hat nur eine davon erreicht.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Fett an: aus `Satz` wird `**Satz**`.
 *   2  Fett aus: aus `**Satz**` wird wieder `Satz` — ein Schalter.
 *   3  Strg+B tut GENAU DASSELBE wie der Knopf (ein Katalog, §8).
 *   4  Und Strg+B lässt die übrige Auszeichnung des Blocks stehen.
 *   5  Kursiv schaltet auch, und `*` verwechselt sich nicht mit `**`:
 *      Strg+I auf einem fetten Wort macht daraus nicht `*Wort*`.
 *   6  Die Treffsicherheit aus E650 bleibt: das zweite Vorkommen.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 *
 *   node pruefungen/lauf/test557.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof App !== "undefined" && typeof Store !== "undefined" && typeof Auswahl !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(400);

console.log('\n' + '─'.repeat(60));
console.log('Suite 557 — Fett ist ein Schalter, und Strg+B nimmt denselben Weg');
console.log('─'.repeat(60));

/**
 * Block anlegen, das `nte` Vorkommen von `wort` im GEZEICHNETEN Text
 * markieren und auslösen — entweder über den Knopf der Auswahlleiste
 * (`wie = "knopf"`) oder über die Tastatur (`wie = "taste"`).
 *
 * Zurück kommt, was GESPEICHERT ist. Was gezeichnet wurde, ist hier ohne
 * Belang: der Schaden von Fund 2 steht in der Ablage, nicht im Bild.
 */
const probe = async (text: string, wort: string, nte: number,
                     a: string, wie: 'knopf' | 'taste'): Promise<string> =>
  seite.evaluate(
    '(async () => {\n'
  + '  const s = Store.addPage(null, { text: "Probe 557" });\n'
  + '  const b = Store.addBlock(s.id, "text", { text: ' + JSON.stringify(text) + ' });\n'
  + '  App.oeffne(s.id);\n'
  + '  await new Promise(f => setTimeout(f, 250));\n'
  + '  App.zeichneSeite();\n'
  + '  await new Promise(f => setTimeout(f, 200));\n'
  + '  const el = document.querySelector(\'[data-bid="\' + b.id + \'"] .ct\');\n'
  + '  if (!el) return "KEIN BLOCK";\n'
  + '  const lauf = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);\n'
  + '  let knoten = null, gesehen = 0, stelle = -1;\n'
  + '  while ((knoten = lauf.nextNode())) {\n'
  + '    let i = -1;\n'
  + '    while ((i = knoten.data.indexOf(' + JSON.stringify(wort) + ', i + 1)) !== -1) {\n'
  + '      gesehen++;\n'
  + '      if (gesehen === ' + nte + ') { stelle = i; break; }\n'
  + '    }\n'
  + '    if (stelle !== -1) break;\n'
  + '  }\n'
  + '  if (stelle === -1) return "STELLE NICHT GEFUNDEN";\n'
  + '  const r = document.createRange();\n'
  + '  r.setStart(knoten, stelle);\n'
  + '  r.setEnd(knoten, stelle + ' + wort.length + ');\n'
  + '  const sel = getSelection();\n'
  + '  sel.removeAllRanges(); sel.addRange(r);\n'
  + '  if (' + JSON.stringify(wie) + ' === "taste") {\n'
  + '    el.dispatchEvent(new KeyboardEvent("keydown", { key: ' + JSON.stringify(a)
  +      ', ctrlKey: true, bubbles: true, cancelable: true }));\n'
  + '  } else {\n'
  + '    Auswahl.zeigen();\n'
  + '    await new Promise(f => setTimeout(f, 120));\n'
  + '    const knopf = document.querySelector(\'.auswahlleiste button[data-a="' + a + '"]\');\n'
  + '    if (!knopf) return "KEIN KNOPF";\n'
  + '    knopf.click();\n'
  + '  }\n'
  + '  await new Promise(f => setTimeout(f, 250));\n'
  + '  return String(Store.getBlock(b.id).text || "");\n'
  + '})()') as Promise<string>;

/* ---------------------------------------------------------------------- */
console.log('\n1 · Fett ist ein Schalter');

const an = await probe('Ein schlichter Satz', 'Satz', 1, 'b', 'knopf');
console.log('    „Ein schlichter Satz" + Fett  →  ' + JSON.stringify(an));
p('Fett an: aus `Satz` wird `**Satz**`', an === 'Ein schlichter **Satz**', an);

const aus = await probe('Ein schlichter **Satz**', 'Satz', 1, 'b', 'knopf');
console.log('    „Ein schlichter **Satz**" + Fett  →  ' + JSON.stringify(aus));
p('Fett aus: aus `**Satz**` wird wieder `Satz`', aus === 'Ein schlichter Satz',
  aus + '  — ein Stempel, kein Schalter');

/* ---------------------------------------------------------------------- */
console.log('\n2 · Strg+B nimmt denselben Weg wie der Knopf (§8)');

const tasteAn = await probe('Ein schlichter Satz', 'Satz', 1, 'b', 'taste');
console.log('    Strg+B auf „Satz"  →  ' + JSON.stringify(tasteAn));
p('Strg+B macht fett', tasteAn === 'Ein schlichter **Satz**', tasteAn);

const tasteAus = await probe('Ein schlichter **Satz**', 'Satz', 1, 'b', 'taste');
console.log('    Strg+B auf fettem „Satz"  →  ' + JSON.stringify(tasteAus));
p('Strg+B schaltet auch wieder aus', tasteAus === 'Ein schlichter Satz', tasteAus);

/* Der teure Fall: der Block trägt SCHON eine Auszeichnung, und die
   Tastatur fasst eine andere Stelle an. */
const daneben = await probe('Ein **fetter** Satz', 'Satz', 1, 'b', 'taste');
console.log('    „Ein **fetter** Satz", Strg+B auf „Satz"  →  ' + JSON.stringify(daneben));
p('Strg+B lässt das vorhandene Fett stehen', daneben === 'Ein **fetter** **Satz**',
  daneben + '  — der gezeichnete Text wurde zurückgespeichert, das alte Fett ist weg');

const danebenKnopf = await probe('Ein **fetter** Satz', 'Satz', 1, 'b', 'knopf');
console.log('    dasselbe über den Knopf      →  ' + JSON.stringify(danebenKnopf));
p('Knopf und Taste kommen zum selben Ergebnis', daneben === danebenKnopf,
  JSON.stringify(daneben) + ' ≠ ' + JSON.stringify(danebenKnopf));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Kursiv schaltet auch — und verwechselt sich nicht mit Fett');

const kursivAn = await probe('Ein schlichter Satz', 'Satz', 1, 'i', 'knopf');
p('Kursiv an', kursivAn === 'Ein schlichter *Satz*', kursivAn);

const kursivAus = await probe('Ein schlichter *Satz*', 'Satz', 1, 'i', 'knopf');
p('Kursiv aus', kursivAus === 'Ein schlichter Satz', kursivAus);

const kursivAufFett = await probe('Ein **fetter** Satz', 'fetter', 1, 'i', 'knopf');
console.log('    Kursiv auf einem FETTEN Wort  →  ' + JSON.stringify(kursivAufFett));
p('Kursiv auf fettem Wort macht daraus nicht `*fetter*`',
  kursivAufFett !== 'Ein *fetter* Satz',
  'das `*` hat sich die Hälfte des `**` genommen — das Fett ist weg');
p('Sondern legt kursiv dazu', kursivAufFett === 'Ein ***fetter*** Satz', kursivAufFett);

/* ---------------------------------------------------------------------- */
console.log('\n4 · Und die Treffsicherheit aus E650 bleibt');

const zweites = await probe('Test und Test', 'Test', 2, 'b', 'knopf');
p('Der Knopf trifft weiter das zweite Vorkommen',
  zweites === 'Test und **Test**', zweites);

const zweitesTaste = await probe('Test und Test', 'Test', 2, 'b', 'taste');
console.log('    Strg+B auf dem zweiten „Test"  →  ' + JSON.stringify(zweitesTaste));
p('Und die Taste jetzt auch', zweitesTaste === 'Test und **Test**',
  zweitesTaste + '  — die zweite Fassung kannte E650 nicht');

p('Keine Ausnahme im Browser', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
