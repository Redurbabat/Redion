/* Suite 414 — Das Dashboard zeigt Balken, die man sieht (E421)
 * ============================================================================
 * Auf dem Bild `db-dashboard` sah die Kachel „Verteilung nach Status" so aus,
 * als hätten zwei von vier Zeilen gar keinen Balken. Nachgemessen war das
 * Gegenteil richtig: die Breiten stimmen alle — 100 %, 100 %, 67 %, 33 % —
 * und trotzdem war KEIN Balken zu sehen.
 *
 * Der Grund steht in zwei Zeilen der Stildateien nebeneinander:
 *
 *     --bg-input: #f1f1ef      die Bahn, auf der der Balken liegt
 *     --b-gray:   #f1f1ef      die Füllung des Balkens „Offen"
 *
 * Byte für Byte dieselbe Farbe. Kontrast 1.00. Ein Balken über die volle
 * Breite, den man nicht sehen kann — und die Zeile „Offen 3" las sich wie
 * „gar keine". Die anderen drei lagen bei 1.01 bis 1.03.
 *
 * DIE URSACHE IST EINE PALETTENVERWECHSLUNG, keine vergessene Regel. Redion
 * hat ZWEI Farbreihen: `--b-*` sind Tönungen, die HINTER dunklem Text liegen
 * (Etiketten, Zeilenfarben); `--c-*` sind die kräftigen Farben für den Text
 * selbst und für Flächen, die für sich stehen müssen. Ein Balken auf einer
 * Bahn gehört zur zweiten Reihe. Derselbe Fall wie E410, wo die
 * Kalenderbalken gar keine Farbe hatten.
 *
 *   §1 Jeder Balken hebt sich von seiner Bahn ab — hell.
 *   §2 Und dunkel.
 *   §3 Die Breiten sagen weiter die Wahrheit.
 *   §4 Die Zahl steht daneben — der Balken ist nicht die einzige Auskunft (§38).
 *   §5 Eine Summe mit Einheit trägt ihre Einheit (E412).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → die Füllung zurück auf `bg-${farbe}`. Gemessen: Kontrast 1.00.
 *   §5    → `mitEinheit` an der Kachel wieder weglassen.
 * Beide gelaufen, Ergebnisse im Bericht zu E421.
 *
 *   node pruefungen/lauf/test414.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9536;

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

/** Kontrastverhältnis nach WCAG. Zwei Farben, eine Zahl von 1 bis 21. */
const kontrast = (a: string, b: string): number => {
  const teile = (c: string) => (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
  const hell = (c: string) => {
    const [r = 0, g = 0, bl = 0] = teile(c).map(v => v / 255);
    const f = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  };
  const [x, y] = [hell(a), hell(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));

const browser = await chromium.launch();
const fehler: string[] = [];

const kachel = async (thema: 'light' | 'dark') => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(vorlage.replace('${layout}', 'dashboard')) as any);
  await s.evaluate(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(thema)})`);
  await s.waitForTimeout(900);
  const mass = await s.evaluate(`JSON.stringify({
    zeilen: [...document.querySelectorAll('.dash-balken')].map(b => {
      const bahn = b.querySelector('.db-strich');
      const i = b.querySelector('.db-strich i');
      if (!bahn || !i) return null;
      return { name: (b.querySelector('.db-name')||{}).textContent,
               zahl: (b.querySelector('.db-zahl')||{}).textContent,
               breite: i.style.width,
               bahnFarbe: getComputedStyle(bahn).backgroundColor,
               fuellFarbe: getComputedStyle(i).backgroundColor };
    }).filter(Boolean),
    summen: [...document.querySelectorAll('.dz-wert')].map(e => ({
      wert: e.textContent.trim(),
      name: (e.nextElementSibling||{}).textContent || '' }))
  })`) as string;
  await s.close();
  return JSON.parse(mass);
};

/* ==========================================================================
 * §1 · HELL: JEDER BALKEN HEBT SICH VON SEINER BAHN AB
 * --------------------------------------------------------------------------
 * Die Schwelle 2.0 ist keine gegriffene Zahl. Gemessen liegen die alten
 * Tönungen bei 1.00 bis 1.03 und die kräftigen Farben bei 2.43 (Gelb) bis
 * 10.84 (Standard) — dazwischen ist nichts. 2.0 trennt die beiden Reihen,
 * ohne der schwächsten kräftigen Farbe im Weg zu stehen.
 * ========================================================================*/
console.log('\n§1 Hell: jeder Balken hebt sich von seiner Bahn ab');
const hell = await kachel('light');
p('Es gibt Balken zu messen', hell.zeilen.length >= 3, String(hell.zeilen.length));
const schwachH = hell.zeilen
  .map((z: any) => ({ ...z, k: kontrast(z.bahnFarbe, z.fuellFarbe) }))
  .filter((z: any) => z.k < 2);
p('Keiner geht in seiner Bahn unter',
  schwachH.length === 0,
  schwachH.map((z: any) => `${z.name}: ${z.k.toFixed(2)} (${z.fuellFarbe} auf ${z.bahnFarbe})`).join(' | '));
/* Der schlimmste Einzelfall, mit Namen: „Offen" ist grau, und Grau WAR die
   Bahnfarbe. Ein Balken über die volle Breite, Kontrast 1.00. */
const grau = hell.zeilen.find((z: any) => /Offen/.test(String(z.name)));
p('Und „Offen" — die Zeile, die gar keinen Balken zu haben schien — auch nicht',
  grau ? kontrast(grau.bahnFarbe, grau.fuellFarbe) >= 2 : false,
  grau ? `${kontrast(grau.bahnFarbe, grau.fuellFarbe).toFixed(2)}` : 'nicht gefunden');

/* ==========================================================================
 * §2 · DUNKEL AUCH
 * ========================================================================*/
console.log('\n§2 Dunkel auch');
const dunkel = await kachel('dark');
const schwachD = dunkel.zeilen
  .map((z: any) => ({ ...z, k: kontrast(z.bahnFarbe, z.fuellFarbe) }))
  .filter((z: any) => z.k < 2);
p('Auch im Dunkelmodus geht keiner unter',
  schwachD.length === 0,
  schwachD.map((z: any) => `${z.name}: ${z.k.toFixed(2)}`).join(' | '));
/* Und die beiden Themen sind nicht dasselbe Bild — sonst wäre eine der
   beiden Messungen gar keine. */
p('Hell und Dunkel sind wirklich verschieden',
  hell.zeilen[0]?.bahnFarbe !== dunkel.zeilen[0]?.bahnFarbe,
  `${hell.zeilen[0]?.bahnFarbe} gegen ${dunkel.zeilen[0]?.bahnFarbe}`);

/* ==========================================================================
 * §3 · DIE BREITEN SAGEN WEITER DIE WAHRHEIT
 * --------------------------------------------------------------------------
 * Die Breiten waren nie falsch. Diese Zeilen halten sie fest, damit eine
 * Reparatur der FARBE nicht die ZAHL kaputtmacht.
 * ========================================================================*/
console.log('\n§3 Die Breiten sagen weiter die Wahrheit');
const zahlen = hell.zeilen.map((z: any) => Number(z.zahl));
const breiten = hell.zeilen.map((z: any) => parseFloat(z.breite));
p('Jede Zeile trägt eine Zahl und eine Breite',
  zahlen.every((n: number) => Number.isFinite(n)) && breiten.every((b: number) => Number.isFinite(b)),
  JSON.stringify(hell.zeilen.map((z: any) => z.zahl + '=' + z.breite)));
p('Die grösste Zahl hat die volle Breite',
  breiten[zahlen.indexOf(Math.max(...zahlen))] === 100,
  JSON.stringify(hell.zeilen.map((z: any) => z.zahl + '=' + z.breite)));
/* Und die Reihenfolge stimmt: mehr Einträge, breiterer Balken. */
const paare = zahlen.map((n: number, i: number) => ({ n, b: breiten[i] }));
p('Mehr Einträge heisst breiter',
  paare.every((a: any) => paare.every((b: any) => a.n <= b.n || a.b >= b.b)),
  JSON.stringify(paare));

/* ==========================================================================
 * §4 · DIE ZAHL STEHT DANEBEN (§38)
 * ========================================================================*/
console.log('\n§4 Die Zahl steht daneben');
p('Jede Zeile nennt ihre Zahl im Text',
  hell.zeilen.every((z: any) => String(z.zahl || '').trim().length > 0),
  JSON.stringify(hell.zeilen.map((z: any) => z.zahl)));
p('… und ihren Namen',
  hell.zeilen.every((z: any) => String(z.name || '').trim().length > 1),
  JSON.stringify(hell.zeilen.map((z: any) => z.name)));

/* ==========================================================================
 * §5 · EINE SUMME MIT EINHEIT TRÄGT IHRE EINHEIT
 * --------------------------------------------------------------------------
 * E412 hat der Zahlenspalte eine Einheit gegeben und sie in der Zelle
 * angehängt. Die Kachel darüber rechnete weiter ohne: „2630" statt
 * „2630 CHF" — und 2630 was, bei einer Spalte namens „Kosten"?
 * ========================================================================*/
console.log('\n§5 Eine Summe mit Einheit trägt ihre Einheit');
const kosten = hell.summen.find((x: any) => /Kosten/.test(String(x.name)));
p('Es gibt eine Kachel über die Kosten', !!kosten, JSON.stringify(hell.summen));
p('… und sie nennt die Einheit', /CHF/.test(String(kosten?.wert)),
  JSON.stringify(kosten));
/* Die Anzahl-Kachel bekommt KEINE angehängt — „9 CHF Einträge" wäre
   schlimmer als gar nichts. */
const anzahl = hell.summen.find((x: any) => /Einträge/.test(String(x.name)));
p('Die Anzahl-Kachel bekommt keine angedichtet',
  anzahl ? !/CHF/.test(String(anzahl.wert)) : false, JSON.stringify(anzahl));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
