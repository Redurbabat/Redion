/* Suite 192 — Eine Datei, die noch jemand zeigt, bleibt (L43, E171)
 * ============================================================================
 * L43 stand seit dem 22. August in den Lücken: ein Anhang, dessen Dateisatz
 * kein `blockId` trägt, bleibt beim endgültigen Löschen des Blocks für immer
 * liegen. `purgeAnhaenge` suchte ihn über `cache.blocks[id].dateiId` — und
 * der Block war zu diesem Zeitpunkt schon aus dem Zwischenspeicher.
 *
 * Nachgemessen wurde dabei etwas Schlimmeres, und es stand in keiner Lücke:
 *
 *     Ein Bild duplizieren, das Original endgültig löschen —
 *     und im Duplikat ist das Bild weg.
 *
 * `Store.baum` nimmt den ganzen Satz mit, `baumEinfuegen` legt ihn so wieder
 * hin, also tragen beide Blöcke DIESELBE `dateiId`. Der Dateisatz zeigt
 * über seinen Index auf das Original; wird das gelöscht, geht die Datei mit,
 * und das Duplikat zeigt auf nichts. Das ist Datenverlust im Normalbetrieb
 * (§46, Priorität 1), und es passierte, ohne dass jemand etwas falsch machte.
 *
 * Diese Suite hält beide Richtungen fest — dass Herrenloses wirklich weggeht,
 * und dass Beanspruchtes wirklich bleibt.
 *
 *   node pruefungen/lauf/test226.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8983;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Ein Hilfsstück, das die vier Fälle gleich abfährt. Es gibt zurück, ob die
   Datei danach noch da ist — mit echten Bytes gefragt, nicht über den
   Dateisatz: ein Satz ohne seine Stücke wäre eine Datei, die es nur auf dem
   Papier gibt (§30). */
const messe = await seite.evaluate(async () => {
  const warte = (ms: number) => new Promise(r => setTimeout(r, ms));
  const bytes = () => new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])],
    'probe.png', { type: 'image/png' });
  const aus: Record<string, unknown> = {};

  /* --- A · Der Fall aus L43: ein Dateisatz ohne `blockId` --------------- */
  const sA = Store.addPage(null, { text: 'A' });
  const bA = Store.addBlock(sA.id, 'image', { text: '' });
  const satzA = await Dateien.ablegen(bytes(), {});
  Store.updateBlock(bA.id, { dateiId: satzA.id });
  Store.trashBlock(bA.id); Store.purgeBlock(bA.id);
  await warte(1200);
  aus.A_datei = !!(await Dateien.alsBlob(satzA.id));
  aus.A_stuecke = (await Store.stueckeVon(satzA.id)).length;

  /* --- B · Der gewöhnliche Fall, der schon immer stimmte ---------------- */
  const sB = Store.addPage(null, { text: 'B' });
  const bB = Store.addBlock(sB.id, 'image', { text: '' });
  const satzB = await Dateien.ablegen(bytes(), { blockId: bB.id });
  Store.updateBlock(bB.id, { dateiId: satzB.id });
  Store.trashBlock(bB.id); Store.purgeBlock(bB.id);
  await warte(1200);
  aus.B_datei = !!(await Dateien.alsBlob(satzB.id));

  /* --- C · Duplizieren, dann das ORIGINAL endgültig löschen ------------- */
  const sC = Store.addPage(null, { text: 'C' });
  const bC = Store.addBlock(sC.id, 'image', { text: '' });
  const satzC = await Dateien.ablegen(bytes(), { blockId: bC.id });
  Store.updateBlock(bC.id, { dateiId: satzC.id });
  const zwilling = Store.baumEinfuegen(Store.baum(bC.id), sC.id, -1);
  aus.C_gleicheDatei = !!zwilling && Store.getBlock(zwilling.id).dateiId === satzC.id;
  Store.trashBlock(bC.id); Store.purgeBlock(bC.id);
  await warte(1200);
  aus.C_datei = !!(await Dateien.alsBlob(satzC.id));
  aus.C_zwillingLebt = !!(zwilling && Store.getBlock(zwilling.id)
    && Store.getBlock(zwilling.id).alive);
  /* Und der Satz muss dem gehören, der ihn noch zeigt — sonst hielte die
     Pflegeseite ihn für herrenlos und böte an, ihn wegzuräumen. */
  const satzCneu = await Store.dateiHolen(satzC.id);
  aus.C_gehoertJetztDem = !!(zwilling && satzCneu && satzCneu.blockId === zwilling.id);
  aus.C_verwaist = (await Dateien.verwaist()).some((d: any) => d.id === satzC.id);

  /* --- D · Dasselbe, aber der ZWILLING wird gelöscht -------------------- */
  const sD = Store.addPage(null, { text: 'D' });
  const bD = Store.addBlock(sD.id, 'image', { text: '' });
  const satzD = await Dateien.ablegen(bytes(), { blockId: bD.id });
  Store.updateBlock(bD.id, { dateiId: satzD.id });
  const zwD = Store.baumEinfuegen(Store.baum(bD.id), sD.id, -1);
  if (zwD) { Store.trashBlock(zwD.id); Store.purgeBlock(zwD.id); }
  await warte(1200);
  aus.D_datei = !!(await Dateien.alsBlob(satzD.id));
  aus.D_originalLebt = !!Store.getBlock(bD.id).alive;

  /* --- E · Und die PDF-Seite, die ihre Datei in `bildDateiId` trägt ----- */
  const sE = Store.addPage(null, { text: 'E' });
  const bE = Store.addBlock(sE.id, 'pdfseite', { nr: 1, vonSeiten: 1 });
  const satzE = await Dateien.ablegen(bytes(), {});
  Store.updateBlock(bE.id, { bildDateiId: satzE.id });
  Store.trashBlock(bE.id); Store.purgeBlock(bE.id);
  await warte(1200);
  aus.E_datei = !!(await Dateien.alsBlob(satzE.id));

  /* --- F · Beide auf einmal: Original UND Zwilling gehen weg ------------ */
  const sF = Store.addPage(null, { text: 'F' });
  const bF = Store.addBlock(sF.id, 'image', { text: '' });
  const satzF = await Dateien.ablegen(bytes(), { blockId: bF.id });
  Store.updateBlock(bF.id, { dateiId: satzF.id });
  const zwF = Store.baumEinfuegen(Store.baum(bF.id), sF.id, -1);
  Store.trashBlock(sF.id); Store.purgeBlock(sF.id);   /* die ganze Seite */
  await warte(1500);
  aus.F_datei = !!(await Dateien.alsBlob(satzF.id));
  aus.F_stuecke = (await Store.stueckeVon(satzF.id)).length;
  aus.F_zwillingWeg = !Store.getBlock(zwF ? zwF.id : 'x');

  /* --- G · Original im PAPIERKORB, Duplikat lebt ------------------------ */
  const sG = Store.addPage(null, { text: 'G' });
  const bG = Store.addBlock(sG.id, 'image', { text: '' });
  const satzG = await Dateien.ablegen(bytes(), { blockId: bG.id });
  Store.updateBlock(bG.id, { dateiId: satzG.id });
  const zwG = Store.baumEinfuegen(Store.baum(bG.id), sG.id, -1);
  Store.trashBlock(bG.id);                       /* nur in den Papierkorb */
  await warte(300);
  aus.G_zwillingLebt = !!(zwG && Store.getBlock(zwG.id).alive);
  aus.G_verwaist = (await Dateien.verwaist()).some((d: any) => d.id === satzG.id);

  /* --- H · Und derselbe Fall OHNE Duplikat bleibt aufräumbar ------------- */
  const sH = Store.addPage(null, { text: 'H' });
  const bH = Store.addBlock(sH.id, 'image', { text: '' });
  const satzH = await Dateien.ablegen(bytes(), { blockId: bH.id });
  Store.updateBlock(bH.id, { dateiId: satzH.id });
  Store.trashBlock(bH.id);
  await warte(300);
  aus.H_verwaist = (await Dateien.verwaist()).some((d: any) => d.id === satzH.id);

  return aus;
});

/* ==========================================================================
 * §1 · Was niemand mehr zeigt, geht wirklich weg
 * --------------------------------------------------------------------------
 * Das ist die Richtung, die L43 offen liess. Nicht nur der Dateisatz — auch
 * seine Stücke, sonst bleibt der Platz belegt.
 * ========================================================================*/
console.log('\n1 · Was niemand mehr zeigt, geht wirklich weg');

gleich('Ein Anhang ohne `blockId` bleibt nicht mehr liegen (L43)', messe.A_datei, false);
gleich('Und seine Stücke auch nicht', messe.A_stuecke, 0);
gleich('Der gewöhnliche Fall mit `blockId` bleibt, wie er war', messe.B_datei, false);
gleich('Auch die PDF-Seite gibt ihr Bild frei (`bildDateiId`)', messe.E_datei, false);

/* ==========================================================================
 * §2 · Was noch jemand zeigt, bleibt
 * --------------------------------------------------------------------------
 * DER TEURE FALL. Vor E171 war die Antwort hier „weg", und niemand hatte
 * etwas falsch gemacht: Bild einfügen, duplizieren, das Original löschen.
 * ========================================================================*/
console.log('\n2 · Was noch jemand zeigt, bleibt');

gleich('Ein Duplikat trägt wirklich dieselbe Dateikennung', messe.C_gleicheDatei, true);
gleich('Das Duplikat überlebt das Löschen des Originals', messe.C_zwillingLebt, true);
gleich('Und sein Bild ist noch da', messe.C_datei, true);
gleich('Der Dateisatz gehört jetzt dem, der ihn noch zeigt', messe.C_gehoertJetztDem, true);
gleich('Die Pflegeseite hält ihn nicht für herrenlos', messe.C_verwaist, false);

console.log('\n2a · Und in die andere Richtung genauso');
gleich('Wird das Duplikat gelöscht, behält das Original sein Bild', messe.D_datei, true);
gleich('Und das Original lebt', messe.D_originalLebt, true);

/* ==========================================================================
 * §3 · Gehen beide weg, geht auch die Datei
 * --------------------------------------------------------------------------
 * Die Gegenprobe zum Behalten: „im Zweifel behalten" darf nicht heissen
 * „nie mehr löschen". Wenn die ganze Seite mit Original und Duplikat
 * verschwindet, beansprucht die Datei niemand mehr.
 * ========================================================================*/
console.log('\n3 · Gehen beide weg, geht auch die Datei');

gleich('Original und Duplikat sind wirklich beide fort', messe.F_zwillingWeg, true);
gleich('Und die Datei ist es auch', messe.F_datei, false);
gleich('Und ihre Stücke', messe.F_stuecke, 0);

/* ==========================================================================
 * §4 · Und die Pflegeseite stellt dieselbe Frage
 * --------------------------------------------------------------------------
 * `Dateien.verwaist()` sah nur auf `blockId`. Liegt das Original im
 * Papierkorb, hielt es die Datei für herrenlos — und „Aufräumen" nahm dem
 * lebenden Duplikat sein Bild. Derselbe Fehler wie oben, nur durch eine
 * andere Tür.
 *
 * Die Frage ist hier aber eine ANDERE als beim endgültigen Löschen: dort
 * zählt auch ein Block im Papierkorb als Anspruch, weil Löschen nicht
 * umkehrbar ist. Hier zählt nur, wer sie heute zeigt — sonst räumte die
 * Pflegeseite nie wieder etwas weg. §5 hält beide Hälften fest.
 * ========================================================================*/
console.log('\n4 · Und die Pflegeseite stellt dieselbe Frage');

gleich('Das Duplikat lebt, während das Original im Papierkorb liegt',
  messe.G_zwillingLebt, true);
gleich('Und die Pflegeseite bietet seine Datei nicht zum Wegräumen an',
  messe.G_verwaist, false);
gleich('Ohne Duplikat bleibt sie aufräumbar — sonst wäre nichts gewonnen',
  messe.H_verwaist, true);

/* ==========================================================================
 * §5 · Und der Quelltext sagt, warum
 * ========================================================================*/
console.log('\n5 · Und der Quelltext sagt, warum');

const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/kern/ablage/indexdb.ts'), 'utf8');

p('`dateiAnspruch` gibt es', /const dateiAnspruch\s*=/.test(quelle));
p('Und es fragt alle Blöcke, nicht nur den einen',
  /dateiAnspruch[\s\S]{0,700}Object\.values<any>\(cache\.blocks\)/.test(quelle));
p('`purgeTief` merkt die Dateien, bevor der Block aus dem Cache fliegt',
  /purgeTief[\s\S]{0,900}anhaenge\[id\] = eigene/.test(quelle));
p('Und der Anspruch wird einmal je Vorgang gerechnet, nicht je Block',
  /const anspruch = dateiAnspruch\(\);\s*\n\s*for \(const x of gesammelt\)/.test(quelle));

const ablageQuelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/dateien/ablage.ts'), 'utf8');
p('`verwaist` fragt nach lebenden Ansprüchen',
  /Store\.dateiAnspruch\(true\)/.test(ablageQuelle));
p('Und zwar bevor es auf `blockId` sieht',
  /beansprucht\.has\(String\(d\.id\)\)[\s\S]{0,80}if \(!d\.blockId\)/.test(ablageQuelle));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
