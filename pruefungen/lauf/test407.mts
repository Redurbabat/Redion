/* Suite 407 — Eine Zahl sagt, wovon sie handelt (E412)
 * ============================================================================
 * „420" stand in der Tabelle und auf jeder Karte. Ob es Franken, Stunden
 * oder Stücke waren, wusste nur, wer die Spalte benannt hatte. `def.anzeige`
 * gab es längst (Balken, Ring, Skala, Heatmap) — aber nichts, was die Zahl
 * beschriftet.
 *
 * Die Einheit ist eine ANZEIGE, kein Wert. Das ist der Teil, der hier
 * wirklich geprüft wird: eine Einheit, die in `props` landet, macht aus
 * jeder Zahl einen Text, bricht jede Formel und jede Sortierung, und in
 * einer Sicherung steht sie dann für immer.
 *
 *   §1 Ohne Einheit ändert sich nichts.
 *   §2 Mit Einheit steht sie hinter der Zahl — mit schmalem, bindendem
 *      Leerzeichen, damit Zahl und Einheit nie umbrechen.
 *   §3 Der gespeicherte WERT bleibt eine Zahl.
 *   §4 Formeln und Summen rechnen weiter.
 *   §5 Die Einheit wird escapt.
 *   §6 Eine Zahlenspalte lässt gar keinen Text durch — und der Riegel ist
 *      nicht der, den ich zuerst dafür hielt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → in `dienst.ts` `mitEinheit` immer den blossen Wert zurückgeben
 *        lassen.
 *   §3 → beim Setzen zusätzlich `Store.setProp(r.id,'kosten', '85 CHF')` —
 *        also die Einheit in den Wert schreiben. Dann fällt §3 UND §4.
 *   §6 → in `wert()` die Zeile `if (def.type === 'number') … Number(v)`
 *        entfernen. NICHT `esc` — das war die falsche Vermutung, siehe §6.
 * Alle drei gelaufen, Ergebnisse im Bericht zu E412.
 *
 *   node pruefungen/lauf/test407.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9530;

const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
const fehler: string[] = [];

/* Die Einheit kommt als Wortlaut in den Aufbau; sonst müsste sie über eine
   Node-Grenze, die `page.evaluate` nicht kennt. */
const AUFBAU = (einheit: string) => `return (async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const seite = Store.addPage(null, { text: 'Einheiten', icon: '🔢' });
  const schema = {
    titel:  { name: 'Titel',  type: 'title' },
    kosten: { name: 'Kosten', type: 'number' },
    doppelt:{ name: 'Doppelt', type: 'formula', formula: 'prop("Kosten") * 2' }
  };
  ${einheit ? `schema.kosten.einheit = ${JSON.stringify(einheit)};` : ''}
  const { block, collectionId } = Store.addDatabase(seite.id, 'Einheiten', schema, 'table');
  for (const [t, k] of [['Eins', 85], ['Zwei', 420], ['Drei', 0]]) {
    const r = Store.addRow(collectionId, { title: t });
    Store.setProp(r.id, 'kosten', k);
  }
  Store.updateBlock(block.id, { aktiveView: Store.getCollection(collectionId).viewIds[0] });
  await Store.flush();
  App.oeffne(seite.id);
  window.__coll = collectionId;
  await new Promise(r => setTimeout(r, 800));
})();`;

const oeffne = async (einheit: string) => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(AUFBAU(einheit)) as any);
  await s.waitForTimeout(800);
  return s;
};

/* Die Zellen der Kosten-Spalte, als roher Text. */
const SPALTE = (nr: number) => `(() => [...document.querySelectorAll('.db tbody tr')]
  .map(tr => (tr.children[${nr}] || {}).textContent || '').map(t => t.trim()))()`;

/* ==========================================================================
 * §1 · OHNE EINHEIT ÄNDERT SICH NICHTS
 * ========================================================================*/
console.log('\n§1 Ohne Einheit');
const s1 = await oeffne('');
const ohne = await s1.evaluate(SPALTE(2)) as string[];
p('Die Kosten stehen als blosse Zahl da',
  ohne.includes('85') && ohne.includes('420') && ohne.includes('0'),
  JSON.stringify(ohne));

/* ==========================================================================
 * §2 · MIT EINHEIT, UND MIT BINDENDEM LEERZEICHEN
 * ========================================================================*/
console.log('\n§2 Mit Einheit');
await s1.close();
const s2 = await oeffne('CHF');
const mit = await s2.evaluate(SPALTE(2)) as string[];
p('Die Einheit steht hinter der Zahl',
  mit.some(t => /^85 CHF$/.test(t)) && mit.some(t => /^420 CHF$/.test(t)),
  JSON.stringify(mit));
p('Auch bei der Null — eine 0 ohne Einheit wäre die halbe Auskunft',
  mit.some(t => /^0 CHF$/.test(t)), JSON.stringify(mit));
/* Das schmale Leerzeichen ist nicht Kosmetik: ein gewöhnliches lässt „420"
   und „CHF" auf zwei Zeilen brechen, und dann steht die Einheit unter einer
   fremden Zahl. */
p('Und zwar mit schmalem, bindendem Leerzeichen (U+202F), nicht mit einem gewöhnlichen',
  mit.every(t => !/\d \w/.test(t)), JSON.stringify(mit));

/* ==========================================================================
 * §3 · DER WERT BLEIBT EINE ZAHL
 * --------------------------------------------------------------------------
 * Der wichtigste Abschnitt. Eine Einheit in `props` macht aus jeder Zahl
 * einen Text — und steht dann für immer in jeder Sicherung.
 * ========================================================================*/
console.log('\n§3 Der Wert bleibt eine Zahl');
const roh = JSON.parse(await s2.evaluate(`JSON.stringify(
  Store.rowsOf(window.__coll).map(r => (r.props || {}).kosten))`) as string);
p('In props stehen Zahlen, keine Texte',
  roh.every((x: any) => typeof x === 'number'), JSON.stringify(roh));
p('Und zwar genau die eingegebenen',
  JSON.stringify([...roh].sort((a: number, b: number) => a - b)) === JSON.stringify([0, 85, 420]),
  JSON.stringify(roh));

/* ==========================================================================
 * §4 · FORMELN RECHNEN WEITER
 * ========================================================================*/
console.log('\n§4 Formeln rechnen weiter');
const formel = await s2.evaluate(SPALTE(3)) as string[];
p('Die Formelspalte verdoppelt richtig',
  formel.includes('170') && formel.includes('840'), JSON.stringify(formel));

/* ==========================================================================
 * §5 · DIE EINHEIT WIRD ESCAPT
 * ========================================================================*/
console.log('\n§5 Die Einheit wird escapt');
await s2.close();
const s5 = await oeffne('<img src=x onerror=alert(1)>');
const boes = await s5.evaluate(
  `(() => ({ text: (document.querySelector('.db tbody tr td:nth-child(3)')||{}).textContent || '',
             bilder: document.querySelectorAll('.db tbody img').length }))()`) as any;
p('Kein Bild-Element aus der Einheit entstanden', boes.bilder === 0, String(boes.bilder));
p('Der Wortlaut steht als Text da', /onerror/.test(boes.text), boes.text.slice(0, 60));
await s5.close();

/* ==========================================================================
 * §6 · EINE ZAHLENSPALTE LÄSST GAR KEINEN TEXT DURCH
 * --------------------------------------------------------------------------
 * Hier stand zuerst eine Behauptung, die sich beim Messen als FALSCH
 * herausstellte, und sie steht deshalb hier statt im Papierkorb:
 *
 *   „`return String(v)` ohne `esc` — ein Import schreibt in eine
 *    Zahlenspalte, was er will."
 *
 * Gemessen kam `NaN` heraus, nicht der eingeschleuste Text. Der Grund steht
 * in `dienst.ts`, in `wert()`:
 *
 *   if (def.type === 'number') return v == null ? null : Number(v);
 *
 * DIESE Zeile ist die Sperre, nicht das `esc` in der Zelle. `Number('<img
 * …>')` ist `NaN`, und weiter kommt nichts. Das `esc` bleibt trotzdem
 * stehen — eine zweite Tür kostet nichts —, aber es als den Riegel
 * auszugeben wäre eine falsche Behauptung über die eigene Sicherheit, und
 * die ist schlimmer als gar keine.
 *
 * Geprüft wird deshalb, was WIRKLICH schützt: dass die Umwandlung da ist.
 * Wer sie entfernt, macht die Lücke erst auf — und wird hier rot.
 * ========================================================================*/
console.log('\n§6 Eine Zahlenspalte lässt keinen Text durch');
const s6 = await oeffne('');
await s6.evaluate(`(() => {
  const r = Store.rowsOf(window.__coll)[0];
  Store.setProp(r.id, 'kosten', '<img src=x onerror=window.__boes=1>');
  App.zeichneSeite();
})()`);
await s6.waitForTimeout(500);
const roh6 = await s6.evaluate(
  `(() => ({ bilder: document.querySelectorAll('.db tbody img').length,
             boes: !!window.__boes,
             text: (document.querySelector('.db tbody tr td:nth-child(3)')||{}).textContent || '' }))()`) as any;
p('Kein Bild-Element aus einer Zahlenspalte', roh6.bilder === 0, String(roh6.bilder));
p('Und nichts ausgeführt', roh6.boes === false);
p('Der eingeschleuste Text kommt gar nicht erst durch — die Spalte rechnet',
  roh6.text.trim() === 'NaN', roh6.text.slice(0, 60));
await s6.close();

/* Und der Riegel selbst, im Quelltext: `wert()` muss die Zahlenspalte
   umwandeln. Ohne diese Zeile wäre die Messung oben eines Tages grün, weil
   gar nichts mehr geprüft wird. */
const dienstQuelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/datenbanken/dienst.ts'), 'utf8');
p('Die Umwandlung in wert() steht da — sie ist der eigentliche Riegel',
  /def\.type === 'number'\)\s*return[^;]*Number\(v\)/.test(dienstQuelle));

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
