/* Suite 314 — Die KI-Grenzen sind einstellbar (L104 Punkt 1, E321)
 * ============================================================================
 * Das Buch gab es seit E287, die Griffe `stand()`, `monatJeAnbieter()` und
 * `grenzenSetzen()` auch. Sichtbar war nichts. Wer seine Grenzen ändern
 * wollte, konnte es allein über die Konsole — eine Bremse, die wirkt, aber
 * die niemand einstellen kann, ist eine fremde Entscheidung (§47).
 *
 *   §1 DER ABSCHNITT IST DA, mit vier Grenzen und einem Weg zum Leeren.
 *   §2 EINE ÄNDERUNG KOMMT AN — im Eintrag, nicht in vier neuen Schlüsseln.
 *   §3 UNSINN WIRD ZURÜCKGENOMMEN, statt eine Grenze zu zerstören.
 *   §4 DIE SUMME NENNT IHRE GRUNDLAGE (gezählt / geschätzt).
 *   §5 GEGENPROBE: ohne Buchung steht keine Summe und keine Anbieterzeile.
 *   §6 DEUTSCH: Beträge mit Komma. Die Zahlenfelder mit Punkt — ein
 *      `<input type="number">` hält seinen Wert sprachunabhängig.
 *
 * DER PRÜFSTEIN IST §5. Eine Übersicht, die bei jemandem ohne einen einzigen
 * Wolken-Aufruf „0,00 USD" und eine Anbieterliste zeigt, behauptet etwas
 * über Geld, das nie geflossen ist.
 *
 *   node pruefungen/lauf/test314.mts
 * ==========================================================================*/
declare const Store: any; declare const KiBuch: any;
declare const KiKosten: any; declare const Einstellungen: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9325;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2500);

/* ------------------------------------------------------------------------ */
console.log('\n5 · GEGENPROBE zuerst: ohne Buchung steht keine Summe');

/* ZUERST, WEIL ES DER WICHTIGERE FALL IST. Wer lokal arbeitet, hat nie eine
   Buchung — und soll keine Geldübersicht sehen, die es nicht gibt. */
const leer = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  Store.setMeta(KiBuch.SCHL_BUCH, []);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Einstellungen.oeffne('ki');
  await new Promise(r => setTimeout(r, 500));
  const t = document.querySelector('.overlay')?.textContent || '';
  return { text: t,
           felder: document.querySelectorAll('.overlay [data-grenze]').length };
});
p('Der Abschnitt ist auch ohne Buchung da', /Kosten und Grenzen/.test(leer.text));
p('Und sagt, dass noch nichts verbucht ist',
  /Noch kein Wolken-Aufruf verbucht/.test(leer.text));
p('Kein Betrag steht da', !/0,00 USD|0,153/.test(leer.text));
p('Und keine Anbieterzeile', !/\bopenai\b|\bgroq\b/.test(
  leer.text.slice(leer.text.indexOf('Kosten und Grenzen'),
                  leer.text.indexOf('Datenschutz'))));
gleich('Die vier Grenzen sind trotzdem einstellbar', leer.felder, 4);

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Abschnitt mit Buchungen');

const voll = await pc.evaluate(async () => {
  Store.setMeta(KiBuch.SCHL_BUCH, []);
  const b1 = KiBuch.buchen('gpt-4o-mini', 'openai', 128000, 41000, false);
  KiBuch.berichtigen(b1.id, 96400, 30100);
  KiBuch.buchen('gpt-4o', 'openai', 22000, 8000, false);
  /* Ein freies Modell: kostet nichts und darf deshalb keine Zeile bekommen. */
  KiBuch.buchen('llama-3.3-70b-versatile', 'groq', 340000, 90000, false);

  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Einstellungen.oeffne('ki');
  await new Promise(r => setTimeout(r, 500));
  const o = document.querySelector('.overlay') as HTMLElement;
  const t = o.textContent || '';
  const ab = t.indexOf('Kosten und Grenzen');
  const abschnitt = t.slice(ab, t.indexOf('Datenschutz'));
  const feld = (k: string) =>
    (o.querySelector(`[data-grenze="${k}"]`) as HTMLInputElement)?.value;
  return {
    abschnitt,
    felder: { jeAufruf: feld('jeAufruf'), jeLauf: feld('jeLauf'),
              jeTag: feld('jeTag'), jeMonat: feld('jeMonat') },
    leerenKnopf: !!o.querySelector('[data-tun="ki-buch-leeren"]'),
    breite: (o.querySelector('[data-grenze="jeAufruf"]') as HTMLElement)
              ?.getBoundingClientRect().width
  };
});

p('Vier Grenzfelder mit den Vorgabewerten',
  voll.felder.jeAufruf === String(0.5) && voll.felder.jeMonat === String(20),
  JSON.stringify(voll.felder));
p('Und ein Weg, das Buch zu leeren', voll.leerenKnopf);
p('Das Grenzfeld ist schmal — ein Betrag, kein Satz (E320)',
  voll.breite > 0 && voll.breite <= 130, String(voll.breite));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Die Summe nennt ihre Grundlage');

p('Der Monatsbetrag steht da', /Diesen Monat/.test(voll.abschnitt));
p('Mit der Belegzahl daneben — wie E289 es vormacht',
  /1 von 3 Aufrufen gezählt/.test(voll.abschnitt), voll.abschnitt.slice(0, 260));
p('openai hat etwas gekostet und steht drin', /openai/.test(voll.abschnitt));
/* DIE ZEILE, DIE NICHTS BEHAUPTET. Groq mit einem freien Modell kostet 0 —
   „groq 0,00 USD" nähme eine Zeile und sagte nichts. */
p('groq kostete nichts und bekommt keine Zeile', !/groq/.test(voll.abschnitt),
  voll.abschnitt);

/* ------------------------------------------------------------------------ */
console.log('\n6 · Deutsch: Beträge mit Komma');

p('Der Betrag hat ein Komma, keinen Punkt',
  /\d+,\d+ USD/.test(voll.abschnitt) && !/\d+\.\d+ USD/.test(voll.abschnitt),
  (/[\d.,]+ USD/.exec(voll.abschnitt) || [''])[0]);
/* UND DIE FELDER NICHT. Ein `<input type="number">` mit „0,5" hat einen
   ungültigen Wert und liest sich als leer zurück — das wäre keine
   Eindeutschung, sondern ein kaputtes Feld. */
p('Die Zahlenfelder behalten den Punkt', voll.felder.jeAufruf === '0.5',
  String(voll.felder.jeAufruf));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Eine Änderung kommt an');

const geaendert = await pc.evaluate(async () => {
  const el = document.querySelector('.overlay [data-grenze="jeTag"]') as HTMLInputElement;
  el.value = '7.5';
  el.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 150));
  return { grenzen: KiBuch.grenzen(),
           /* Kein Streuschlüssel: die vier liegen ZUSAMMEN in einem Eintrag. */
           streu: Store.getMeta('jeTag', null) };
});
gleich('Die Tagesgrenze steht jetzt auf 7,5', geaendert.grenzen.jeTag, 7.5);
gleich('Die anderen drei blieben unberührt',
  [geaendert.grenzen.jeAufruf, geaendert.grenzen.jeLauf, geaendert.grenzen.jeMonat],
  [0.5, 2, 20]);
p('Und es entstand kein Streuschlüssel daneben', geaendert.streu === null,
  JSON.stringify(geaendert.streu));

/* ------------------------------------------------------------------------ */
console.log('\n3 · Unsinn wird zurückgenommen');

const unsinn = await pc.evaluate(async () => {
  const el = document.querySelector('.overlay [data-grenze="jeTag"]') as HTMLInputElement;
  el.value = '-3';
  el.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(r => setTimeout(r, 150));
  return { grenze: KiBuch.grenzen().jeTag, feld: el.value };
});
/* EINE NEGATIVE GRENZE WÄRE SCHLIMMER ALS KEINE: sie verböte jeden Aufruf,
   und der Grund stünde nirgends. */
gleich('Die Grenze blieb, wo sie war', unsinn.grenze, 7.5);
gleich('Und das Feld zeigt wieder den geltenden Wert', unsinn.feld, '7.5');

p('Keine JS-Fehler', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok}/${ok + weg} bestanden`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
