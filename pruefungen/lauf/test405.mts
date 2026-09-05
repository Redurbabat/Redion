/* Suite 405 — Der Kalender zeigt Zeitspannen (E410)
 * ============================================================================
 * Ein Projekt vom 1. bis zum 12. September stand am 1. — und sonst nirgends.
 * Wer im Monat nachsah, was gerade läuft, sah es nicht.
 *
 * Der durchgehende Balken war die ganze Zeit gebaut: `spurenDerWoche`,
 * `balkenWoche`, `.cw-bar`, mit Spuren gegen Überdeckung und einem Kommentar
 * „das ist der durchgehende Balken, den Notion nicht zeichnet". Er sprang
 * nur nie an, weil `endeKey` als einziges Feld der Kalenderansicht KEINEN
 * Vorgabewert hatte. Eine Funktion, deren Schalter keinen Vorgabewert hat,
 * ist eine Funktion, die es nicht gibt.
 *
 *   §1 Eine Datenbank mit Anfang und Ende zeigt Balken.
 *   §2 Der Balken ist SICHTBAR — er hat eine Farbe, nicht nur Text.
 *   §3 Er ist so lang wie die Spanne, nicht länger und nicht kürzer.
 *   §4 Er verdeckt die Tageszahlen nicht.
 *   §5 Geraten wird nur, was die Daten belegen — ein einziges Enddatum vor
 *      dem Anfang, und der Kalender schweigt.
 *   §6 „nur ein Tag" bleibt „nur ein Tag" — eine Wahl wird nicht überstimmt.
 *   §7 Und die Oberfläche SAGT, dass geraten wurde.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle im Bericht zu E410 aufgeschrieben und gelaufen. Die beiden, die
 * echte Fehler halten:
 *   §2 → die acht `.cw-bar.q-*`-Farbzeilen wieder entfernen. Genau so war
 *        es: `color:#fff` ohne Hintergrund, also loser weisser Text quer
 *        über den Tageszahlen.
 *   §4 → `.cw-balken{top:4px}` zurück auf `24px`. Dann liegt der letzte
 *        Balken bei drei Spuren auf 64 px und das Zellenpolster endet bei
 *        65 — die Zahl verschwindet unter dem Balken.
 *
 *   node pruefungen/lauf/test405.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9528;

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

/* Ein eigener, kleiner Satz statt des grossen aus `bilder.mts`: hier soll
   sich das ENDE ändern lassen, und zwar Zeile für Zeile. */
const aufbau = (zeilen: string, endeKey: string | null) => `return (async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const seite = Store.addPage(null, { text: 'Spannen', icon: '📅' });
  const { block, collectionId } = Store.addDatabase(seite.id, 'Spannen', {
    titel:  { name: 'Titel',  type: 'title' },
    anfang: { name: 'Anfang', type: 'date' },
    ende:   { name: 'Ende',   type: 'date' }
  }, 'table');
  for (const [t, a, e] of ${zeilen}) {
    const r = Store.addRow(collectionId, { title: t });
    Store.setProp(r.id, 'anfang', a);
    if (e) Store.setProp(r.id, 'ende', e);
  }
  const view = Store.addView(collectionId, 'calendar');
  Store.updateView(view.id, { monat: '2026-09-15T00:00:00.000Z'${
    endeKey === null ? '' : `, endeKey: ${JSON.stringify(endeKey)}`} });
  Store.updateBlock(block.id, { aktiveView: view.id });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 900));
})();`;

const oeffne = async (zeilen: string, endeKey: string | null = null) => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 120)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(aufbau(zeilen, endeKey)) as any);
  await s.waitForTimeout(900);
  return s;
};

const SPANNEN = `[['Langes Projekt','2026-09-01','2026-09-12'],
                  ['Kurzes','2026-09-08','2026-09-10'],
                  ['Ein Tag','2026-09-15','']]`;

/* ==========================================================================
 * §1 · BALKEN SIND DA
 * ========================================================================*/
console.log('\n§1 Balken');

const s1 = await oeffne(SPANNEN);
const BALKEN = `(() => [...document.querySelectorAll('.cw-bar')].map(b => {
  const r = b.getBoundingClientRect(); const st = getComputedStyle(b);
  return { text: b.textContent.trim(), b: Math.round(r.width), l: Math.round(r.left),
           t: Math.round(r.top), grund: st.backgroundColor, farbe: st.color };
}))()`;
const balken = await s1.evaluate(BALKEN) as any[];
p('Es gibt Balken', balken.length >= 3, String(balken.length));
p('Und sie tragen die Titel der mehrtägigen Einträge',
  balken.some(b => /Langes Projekt/.test(b.text)) && balken.some(b => /Kurzes/.test(b.text)),
  balken.map(b => b.text).join(' | '));
p('Der eintägige Eintrag ist KEIN Balken',
  !balken.some(b => /Ein Tag/.test(b.text)), balken.map(b => b.text).join(' | '));

/* ==========================================================================
 * §2 · DER BALKEN IST SICHTBAR
 * --------------------------------------------------------------------------
 * `.cw-bar` hatte `color:#fff` und eine Klasse `q-blue` — aber
 * `.cw-bar.q-blue` gab es nirgends. Weisser Text ohne Grund ist kein Balken.
 * ========================================================================*/
console.log('\n§2 Sichtbar, nicht nur Text');

const durchsichtig = (f: string) =>
  !f || f === 'transparent' || /rgba\([^)]*,\s*0\s*\)/.test(f);
p('Jeder Balken hat einen Hintergrund',
  balken.every(b => !durchsichtig(b.grund)),
  balken.map(b => b.grund).join(' | '));
p('Und der Hintergrund ist nicht dieselbe Farbe wie die Schrift',
  balken.every(b => b.grund !== b.farbe),
  balken.map(b => `${b.grund} auf ${b.farbe}`).join(' | '));

/* ==========================================================================
 * §3 · SO LANG WIE DIE SPANNE
 * ========================================================================*/
console.log('\n§3 Richtige Länge');

/* „Kurzes" läuft vom 8. bis 10. — drei Tage in einer Woche. „Langes"
   vom 1. bis 12. und geht über zwei Wochen, steht also zweimal da. */
const kurz = balken.filter(b => /Kurzes/.test(b.text));
const lang = balken.filter(b => /Langes/.test(b.text));
p('Das kurze steht einmal da', kurz.length === 1, String(kurz.length));
p('Das lange steht zweimal da — es läuft über zwei Wochen',
  lang.length === 2, String(lang.length));

const tagBreite = await s1.evaluate(
  `(() => { const d = document.querySelector('.cal .day');
     return d ? Math.round(d.getBoundingClientRect().width) : -1; })()`) as number;
p('Eine Tagesspalte liess sich messen', tagBreite > 40, String(tagBreite));
/* Drei Tage, mit Rand — zwischen 2,5 und 3,5 Spalten. */
const k = kurz[0]!;
p('Das kurze ist etwa drei Tage breit',
  k.b > tagBreite * 2.5 && k.b < tagBreite * 3.5,
  `${k.b} px bei ${tagBreite} px je Tag`);

/* ==========================================================================
 * §4 · DIE TAGESZAHLEN BLEIBEN LESBAR
 * ========================================================================*/
console.log('\n§4 Zahlen bleiben lesbar');

const UEBERDECKT = `(() => {
  const zahlen = [...document.querySelectorAll('.cal .day .n')];
  const bars = [...document.querySelectorAll('.cw-bar')];
  const treffer = [];
  for (const z of zahlen) {
    const a = z.getBoundingClientRect();
    if (a.width < 2) continue;
    for (const b of bars) {
      const c = b.getBoundingClientRect();
      const x = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if (x > 2 && y > 2) { treffer.push(z.textContent.trim() + ' unter ' + b.textContent.trim().slice(0,18)); break; }
    }
  }
  return JSON.stringify({ zahlen: zahlen.length, treffer });
})()`;
const ueb = JSON.parse(await s1.evaluate(UEBERDECKT));
p('Es gibt überhaupt Tageszahlen zu prüfen', ueb.zahlen >= 28, String(ueb.zahlen));
p('Keine Tageszahl liegt unter einem Balken', ueb.treffer.length === 0,
  ueb.treffer.slice(0, 4).join(' | '));
await s1.close();

/* ==========================================================================
 * §5 · GERATEN WIRD NUR, WAS DIE DATEN BELEGEN
 * --------------------------------------------------------------------------
 * Eine zweite Datumsspalte muss nicht das Ende sein. Ein einziges Enddatum
 * VOR seinem Anfang widerlegt die Annahme, und dann ist Schweigen richtig:
 * ein Balken über die falsche Spanne wäre schlimmer als gar keiner.
 * ========================================================================*/
console.log('\n§5 Ein Gegenbeispiel genügt');

const s5 = await oeffne(`[['Langes Projekt','2026-09-01','2026-09-12'],
                          ['Verdreht','2026-09-20','2026-09-05'],
                          ['Ein Tag','2026-09-15','']]`);
const balken5 = await s5.evaluate(BALKEN) as any[];
p('Kein einziger Balken, wenn ein Ende vor seinem Anfang liegt',
  balken5.length === 0, balken5.map(b => b.text).join(' | '));
await s5.close();

/* Und die Gegenrichtung: ohne zweite Datumsspalte wird gar nicht erst
   geraten. Das ist der Normalfall und muss ohne Aufhebens durchgehen. */
console.log('\n  (und ohne zweite Datumsspalte gibt es nichts zu raten)');

/* ==========================================================================
 * §6 · EINE WAHL WIRD NICHT ÜBERSTIMMT
 * ========================================================================*/
console.log('\n§6 „nur ein Tag" bleibt');

const s6 = await oeffne(SPANNEN, '');
const balken6 = await s6.evaluate(BALKEN) as any[];
p('Wer „nur ein Tag" gewählt hat, bekommt keine Balken',
  balken6.length === 0, balken6.map(b => b.text).join(' | '));
await s6.close();

const s6b = await oeffne(SPANNEN, 'ende');
const balken6b = await s6b.evaluate(BALKEN) as any[];
p('Wer eine Spalte gewählt hat, bekommt sie', balken6b.length >= 3,
  String(balken6b.length));

/* ==========================================================================
 * §7 · GERATEN WIRD GESAGT
 * ========================================================================*/
console.log('\n§7 Die Oberfläche sagt es');

const s7 = await oeffne(SPANNEN);
const fuss = await s7.evaluate(
  `(() => { const b = document.querySelector('.cal-fuss [data-a="ende"]');
     return b ? b.textContent.trim() : ''; })()`) as string;
p('Der Fuss nennt die erkannte Spalte und markiert sie als erkannt',
  /Ende/.test(fuss) && /erkannt/.test(fuss), fuss || '(nichts)');

const fussGewaehlt = await s6b.evaluate(
  `(() => { const b = document.querySelector('.cal-fuss [data-a="ende"]');
     return b ? b.textContent.trim() : ''; })()`) as string;
p('Eine GEWÄHLTE Spalte wird nicht als erkannt ausgegeben',
  /Ende/.test(fussGewaehlt) && !/erkannt/.test(fussGewaehlt), fussGewaehlt || '(nichts)');
await s7.close(); await s6b.close();

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.slice(0, 3).join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
