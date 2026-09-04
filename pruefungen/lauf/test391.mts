/* Suite 391 — Das KI-Feld bleibt nicht im Dokument stehen (E394)
 * ============================================================================
 * GEMESSEN AM 4. SEPTEMBER 2026 auf 1360 × 900, mit einem A4-Blatt im
 * Dokumentmodus:
 *
 *                              Breite `#ai`   Arbeitsbreite
 *   Startbildschirm                    0 px       1306 px
 *   KI von Hand geöffnet             380 px        926 px
 *   … dann in den Dokumentmodus      380 px        980 px   ← der Fehler
 *
 * E384 hat den Dokumentmodus damit begründet, dass „die ganze Schale
 * wegfällt", und die CSS blendet dort Menüband, Kopfzeile, untere Leiste und
 * Kontextkante aus. Das KI-Feld fehlte in dieser Liste und nahm dem Blatt
 * 28 % des Bildschirms.
 *
 * NICHT mit `display:none` behoben: „fasse diese Seite zusammen" ist im
 * Dokument genau die richtige Frage. Zugeklappt, aber zu öffnen.
 *
 *   §1 Im Dokument ist das Feld zu, und die Breite ist wieder ganz.
 *   §2 Öffnen geht dort trotzdem.
 *   §3 Wer es offen hatte, bekommt es beim Verlassen zurück.
 *   §4 Wer es zu hatte, bekommt es nicht aufgedrängt.
 *   §5 Am Telefon ist es ein Blatt von unten — schon vor diesem Bogen.
 *
 *   node pruefungen/lauf/test391.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9415;
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

const browser: Browser = await chromium.launch();

/** Offen? Wie breit? Und wie viel bleibt der Arbeit? */
const LAGE = `(() => {
  const ai = document.getElementById('ai');
  const r = ai.getBoundingClientRect();
  const wrap = document.getElementById('page') || document.getElementById('scroll');
  return { offen: ai.classList.contains('open'),
           breite: Math.round(r.width),
           arbeit: wrap ? Math.round(wrap.getBoundingClientRect().width) : 0,
           imDokument: document.body.dataset.dokument === 'an' };
})()`;
type Lage = { offen: boolean; breite: number; arbeit: number; imDokument: boolean };

/** Eine Seite mit einem A4-Blatt darin — nur so gibt es einen Dokumentmodus. */
const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1360, height: 900 } });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof App === 'object' && typeof DocumentMode === 'object'`,
                          null, { timeout: 20000 });
  await s.waitForTimeout(600);
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  await s.evaluate(`(async () => {
    App.neueSeite();
    await new Promise(r => setTimeout(r, 400));
    Store.addBlock(App.aktuelleSeite(), 'block', { type: 'blatt', text: '' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 400));
  })()`);
  return s;
};
const insDokument = async (s: Page, an: boolean): Promise<void> => {
  await s.evaluate(`DocumentMode.toggle(Store.getBlock(App.aktuelleSeite()), ${an})`);
  await s.waitForTimeout(700);
};

/* ==========================================================================
 * §1 · Im Dokument ist das Feld zu, und die Breite ist wieder ganz
 * ========================================================================*/
console.log('\n1 · Der Dokumentmodus räumt das KI-Feld weg');
{
  const s = await mitBlatt();
  await s.evaluate(`App.kiPanel(true)`);
  await s.waitForTimeout(500);
  const vor = await s.evaluate(LAGE) as Lage;
  p('Vorher steht es da und kostet Breite', vor.offen && vor.breite > 300,
    `offen ${vor.offen}, ${vor.breite} px`);

  await insDokument(s, true);
  const im = await s.evaluate(LAGE) as Lage;
  p('Der Dokumentmodus ist wirklich an', im.imDokument);
  p('Das Feld ist zu', !im.offen && im.breite === 0, `offen ${im.offen}, ${im.breite} px`);
  p('Und die Arbeitsfläche hat die volle Breite',
    im.arbeit >= 1340, `${im.arbeit} von 1360`);
  await s.close();
}

/* ==========================================================================
 * §2 · Öffnen geht dort trotzdem
 * --------------------------------------------------------------------------
 * DER ABSCHNITT, DER DIE REPARATUR IN SCHRANKEN HÄLT. `display:none` in der
 * CSS wäre die kürzere Lösung gewesen und hätte den Weg zugemauert; „fasse
 * diese Seite zusammen" ist im Dokument gerade die naheliegende Frage.
 * ========================================================================*/
console.log('\n2 · Wer die KI im Dokument will, bekommt sie');
{
  const s = await mitBlatt();
  await insDokument(s, true);
  await s.evaluate(`App.kiPanel(true)`);
  await s.waitForTimeout(500);
  const l = await s.evaluate(LAGE) as Lage;
  p('Von Hand geöffnet steht es auch im Dokument da',
    l.offen && l.breite > 300, `offen ${l.offen}, ${l.breite} px`);
  await s.close();
}

/* ==========================================================================
 * §3 · Wer es offen hatte, bekommt es beim Verlassen zurück
 * ========================================================================*/
console.log('\n3 · Beim Verlassen kommt zurück, was war');
{
  const s = await mitBlatt();
  await s.evaluate(`App.kiPanel(true)`);
  await s.waitForTimeout(400);
  await insDokument(s, true);
  gleich('Im Dokument zu', (await s.evaluate(LAGE) as Lage).offen, false);
  await insDokument(s, false);
  gleich('Draussen wieder offen', (await s.evaluate(LAGE) as Lage).offen, true);
  await s.close();
}

/* ==========================================================================
 * §4 · Die Gegenprobe — wer es zu hatte, bekommt es nicht aufgedrängt
 * --------------------------------------------------------------------------
 * Ohne diesen Abschnitt wäre §3 mit einem plumpen „beim Verlassen immer
 * aufklappen" grün — und dann stünde das Feld nach jedem Dokument da, auch
 * bei jemandem, der es nie geöffnet hat.
 * ========================================================================*/
console.log('\n4 · Und wer es nie wollte, bekommt es nicht');
{
  const s = await mitBlatt();
  gleich('Vorher zu', (await s.evaluate(LAGE) as Lage).offen, false);
  await insDokument(s, true);
  gleich('Im Dokument zu', (await s.evaluate(LAGE) as Lage).offen, false);
  await insDokument(s, false);
  gleich('Und danach immer noch zu', (await s.evaluate(LAGE) as Lage).offen, false);
  await s.close();
}

/* ==========================================================================
 * §5 · Am Telefon ist es ein Blatt von unten — schon vorher
 * --------------------------------------------------------------------------
 * Der Bericht verlangt unter F08 „am Telefon als Bottom Sheet". Nachgemessen
 * ist das seit Längerem so: das Feld hängt am unteren Rand, hat oben runde
 * Ecken und beginnt unter den Kopfleisten. Der Abschnitt steht hier, damit
 * die Forderung nicht ein zweites Mal als offen gilt — und damit ein
 * Rückbau zum Seitenfeld rot wird.
 * ========================================================================*/
console.log('\n5 · Am Telefon ein Blatt von unten (war schon so)');
{
  const s = await browser.newPage({ viewport: { width: 390, height: 844 },
                                    isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await s.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'load' });
  await s.waitForFunction(`typeof App === 'object'`, null, { timeout: 20000 });
  await s.waitForTimeout(700);
  await s.evaluate(`document.getElementById('rg-willkommen')?.remove()`);
  await s.evaluate(`App.kiPanel(true)`);
  await s.waitForTimeout(700);
  const m = await s.evaluate(`(() => {
    const ai = document.getElementById('ai');
    const r = ai.getBoundingClientRect();
    const cs = getComputedStyle(ai);
    return { position: cs.position, rundOben: parseFloat(cs.borderTopLeftRadius) || 0,
             oben: Math.round(r.top), unten: Math.round(r.bottom),
             breite: Math.round(r.width), bild: innerHeight };
  })()`) as { position: string; rundOben: number; oben: number; unten: number;
              breite: number; bild: number };
  gleich('Es schwebt, statt eine Spalte zu sein', m.position, 'fixed');
  p('Es liegt am unteren Rand', Math.abs(m.unten - m.bild) <= 2,
    `unten ${m.unten}, Bild ${m.bild}`);
  p('Es beginnt unter den Kopfleisten, nicht am oberen Rand', m.oben > 60, `${m.oben} px`);
  p('Oben ist es abgerundet, wie ein Blatt', m.rundOben >= 8, `${m.rundOben} px`);
  p('Es nimmt die volle Breite', m.breite >= 380, `${m.breite} px`);
  await s.close();
}

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
