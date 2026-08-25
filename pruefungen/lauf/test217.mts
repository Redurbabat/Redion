/* Suite 183 — Die Lernrunde am Telefon (§31)
 * ============================================================================
 * §31 des Auftrags beschreibt die Telefonansicht nicht in Worten, sondern als
 * Bild:
 *
 *     Elektrotechnik
 *     🔥 14 Tage
 *
 *     18 Karten fällig
 *     5 neue
 *     2 Fehler
 *
 *     [ Lernen starten ]
 *
 *     Darunter: Nächste Prüfung · Aufgaben · Fortschritt
 *
 * Das Entscheidende daran ist die REIHENFOLGE. Am 25. August gemessen auf
 * 390 × 844:
 *
 *     Begrüssung, Datum, Lernziel   322 px, bevor irgendetwas zur Runde kam
 *     die vier Zahlen               ab 713, zur Hälfte unter der Falz
 *     „Tagesrunde starten"          y = 1032 — 188 px UNTER der Falz
 *
 * Wer die App am Telefon öffnete, um zehn Minuten zu lernen, musste erst
 * scrollen, um den Knopf zu finden. Am Rechner stimmte alles, weil dort
 * nichts unter einer Falz liegt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §1 und §2 waren vor E151 rot — das ist keine Behauptung, das ist die
 * Messung oben. Zusätzlich sind die Gegenproben einzeln auf einem Abzug des
 * Baums zurückgenommen worden; sie stehen in E151. §4 misst die
 * Gegenrichtung: am Rechner darf die Reihenfolge NICHT gedreht sein.
 *
 *   node pruefungen/lauf/test217.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8975;

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
const fehler: string[] = [];

/** Eine Lernwelt mit echtem Bestand — fällige Karten, neue, ein Fehler, eine
    Prüfung. Ohne das misst §2 eine Ansicht, die gar nichts anzuzeigen hat. */
const bestand = async (seite: any): Promise<void> => {
  await seite.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());

    const fach = Store.addPage(null, { text: 'Elektrotechnik', icon: '⚡' });
    /* Fällig: ein Termin in der Vergangenheit. */
    for (const frage of ['Ohm :: U = R · I', 'Leistung :: P = U · I', 'Arbeit :: W = P · t'])
      Store.addBlock(fach.id, 'flashcard', { text: frage,
        sr: { ease: 2.5, intervall: 1, wdh: 1, faellig: '2020-01-01T00:00:00.000Z' } });
    /* Neu: gar kein Stand. */
    for (const frage of ['Reihe :: R = R1 + R2', 'Parallel :: 1/R = 1/R1 + 1/R2'])
      Store.addBlock(fach.id, 'flashcard', { text: frage });
    await Store.flush();
    (globalThis as any).Produktwelten.lernen('heute');
  });
  await seite.waitForTimeout(1300);
};

/** Was wo steht — in einem Durchgang, damit nichts zwischen zwei Messungen
    nachrutscht. */
const lage = (seite: any): Promise<any> => seite.evaluate(() => {
  const kasten = (wahl: string): any => {
    const el = document.querySelector<HTMLElement>(wahl);
    if (!el) return null;
    const k = el.getBoundingClientRect();
    return { oben: Math.round(k.top), unten: Math.round(k.bottom),
             sichtbar: k.top < window.innerHeight };
  };
  const knopf = document.querySelector<HTMLElement>('[data-lw-train="today"]');
  const kk = knopf?.getBoundingClientRect();
  const leiste = document.querySelector<HTMLElement>('.lw-nav');
  return {
    hoehe: window.innerHeight,
    zahlen: kasten('.lw-today > .lw-metrics'),
    fokus: kasten('.lw-focus-card'),
    hero: kasten('.lw-hero'),
    pruefung: kasten('.lw-exam-card'),
    start: kk ? { oben: Math.round(kk.top), hoch: Math.round(kk.height),
                  sichtbar: kk.top >= 0 && kk.bottom <= window.innerHeight,
                  text: (knopf?.textContent || '').trim(),
                  gesperrt: (knopf as HTMLButtonElement | null)?.disabled } : null,
    /* WERT UND BESCHRIFTUNG GETRENNT, nicht als ein Text.
       Der erste Entwurf hängte beides aneinander und suchte darin mit einem
       Muster. Ergebnis: „3fällig" hat keine Wortgrenze zwischen Zahl und
       Wort, der Punkt wurde falsch rot — und schlimmer, `\b2\b` fand die 2
       in „SM-2-Wissensstand" und machte einen anderen Punkt falsch GRÜN.
       Die Auszeichnung trennt beides ohnehin: <strong> und <span>. */
    kennzahlen: [...document.querySelectorAll<HTMLElement>('.lw-today > .lw-metrics > *')]
      .map(el => ({
        wert: (el.querySelector('strong')?.textContent || '').trim(),
        name: (el.querySelector('span')?.textContent || '').trim()
      })),
    /* Und daneben, was der Bestand sagt — damit die Anzeige an ihm gemessen
       wird und nicht an einer Zahl, die ich hier hingeschrieben habe. */
    ausDenDaten: (() => {
      const karten = Object.values<any>(Store.cache.blocks)
        .filter(b => b?.alive !== false && b?.type === 'flashcard');
      const jetzt = Date.now();
      const faellig = karten.filter(b => b.sr &&
        (!b.sr.faellig || Date.parse(String(b.sr.faellig)) <= jetzt)).length;
      return { faellig, neu: karten.filter(b => !b.sr).length };
    })(),
    leiste: leiste ? { scroll: leiste.scrollWidth, klar: leiste.clientWidth,
                       mehr: leiste.dataset['mehr'] || '' } : null,
    /* Vorlesereihenfolge: die bleibt, was sie war — `order` verschiebt nur
       das Stapeln. */
    baumfolge: [...document.querySelectorAll<HTMLElement>('.lw-today > *')]
      .map(el => el.className.split(/\s+/)[0] || el.tagName.toLowerCase())
  };
});

/* ==========================================================================
 * §1 · Am Telefon steht die Handlung über der Falz
 * ========================================================================*/
console.log('\n1 · Am Telefon steht die Handlung über der Falz');

const telefon = await browser.newPage({ viewport: { width: 390, height: 844 } });
telefon.on('pageerror', (e: any) => fehler.push('PAGEERROR(Telefon): ' + String(e.message).slice(0, 120)));
await telefon.goto(`http://localhost:${PORT}/index.html`);
await telefon.waitForTimeout(2700);
await bestand(telefon);
const t = await lage(telefon);

p('Es gibt einen Startknopf', !!t.start, JSON.stringify(t.start));
gleich('Er heisst „Tagesrunde starten"', t.start?.text, 'Tagesrunde starten');
p('Er ist NICHT gesperrt — es warten Karten', t.start?.gesperrt === false,
  `gesperrt: ${t.start?.gesperrt}`);
p('Er steht ganz im ersten Bild', t.start?.sichtbar === true,
  `y = ${t.start?.oben} von ${t.hoehe}`);
p('Und ist mit dem Finger zu treffen (44 px, §37)', (t.start?.hoch || 0) >= 44,
  `${t.start?.hoch} px`);
p('Auch die Zahlen stehen im ersten Bild', t.zahlen?.sichtbar === true,
  `y = ${t.zahlen?.oben}`);
p('Die Tagesrunden-Karte ebenso', t.fokus?.sichtbar === true, `y = ${t.fokus?.oben}`);

/* ==========================================================================
 * §2 · Und zwar VOR Begrüssung und Datum
 * --------------------------------------------------------------------------
 * Der eigentliche Punkt. Ohne ihn könnte alles zufällig gerade so passen.
 * ========================================================================*/
console.log('\n2 · Und zwar vor Begrüssung und Datum');
p('Die Zahlen stehen über der Tagesrunden-Karte',
  (t.zahlen?.oben ?? 9999) < (t.fokus?.oben ?? 0), `${t.zahlen?.oben} < ${t.fokus?.oben}`);
p('Und beide über der Begrüssung',
  (t.fokus?.unten ?? 9999) <= (t.hero?.oben ?? 0), `${t.fokus?.unten} ≤ ${t.hero?.oben}`);

/* §31 nennt vier Dinge, die dort stehen sollen. */
const namen = t.kennzahlen.map((k: any) => k.name);
for (const wort of ['fällig', 'neu', 'Fehler', 'nächste Prüfung'])
  p(`§31 nennt „${wort}" — es steht da`, namen.includes(wort), namen.join(' | '));

/* Und die Zahlen stimmen mit dem Bestand überein. Eine Ansicht, die immer 0
   zeigt, bestünde die Punkte darüber ebenfalls. Verglichen wird mit dem, was
   im Speicher steht — nicht mit einer Zahl aus dieser Datei. */
const zahlVon = (name: string): string =>
  String(t.kennzahlen.find((k: any) => k.name === name)?.wert ?? '');
p('Es gibt überhaupt etwas zu zählen',
  t.ausDenDaten.faellig > 0 && t.ausDenDaten.neu > 0, JSON.stringify(t.ausDenDaten));
gleich('Die Zahl „fällig" stimmt mit dem Bestand überein',
  zahlVon('fällig'), String(t.ausDenDaten.faellig));
gleich('Und die Zahl „neu" auch', zahlVon('neu'), String(t.ausDenDaten.neu));

/* ==========================================================================
 * §3 · Die Reiterleiste sagt, dass es weitergeht
 * ========================================================================*/
console.log('\n3 · Die Reiterleiste sagt, dass es weitergeht');
p('Sie ist am Telefon wirklich zu schmal', (t.leiste?.scroll || 0) > (t.leiste?.klar || 0) + 2,
  `${t.leiste?.scroll} in ${t.leiste?.klar}`);
gleich('Und zeigt das an der rechten Kante an', t.leiste?.mehr, 'rechts');

/* UND SIE ZEICHNET AUCH ETWAS. Hier stand bis zum 25. August nur die Zeile
   darüber — das Merkmal. Auf dem Bildschirmfoto endete „Meine Fehler"
   trotzdem an einer scharfen Kante: der Schatten aus E151 war
   `rgba(0,0,0,.34)` über `--bg-side`, also schwarz auf #1a1a1a. Deckkraft 1,
   Prüfung grün, Bild unverändert.

   Was sich messen lässt, ist die ART der Kante. Ein Verlauf endet in der
   Fläche, auf der er liegt, und trägt in beiden Themen; ein Schatten in
   fester Farbe tut das nicht. Diese Prüfung geht also rot, wenn jemand zum
   Schatten zurückkehrt — sie beweist nicht, dass man die Kante SIEHT. Das
   bleibt eine Frage ans Bild (§55), und deshalb steht sie hier so
   ausdrücklich. */
const kante = await telefon.evaluate(() => {
  const leiste = document.querySelector<HTMLElement>('.lw-nav');
  if (!leiste) return null;
  const s = getComputedStyle(leiste, '::after');
  return { deckkraft: Number(s.opacity), bild: s.backgroundImage,
           schatten: s.boxShadow, breite: s.width };
});
p('Die rechte Kante ist eingeblendet', (kante?.deckkraft ?? 0) > 0.9, JSON.stringify(kante));
p('Sie zeichnet einen Verlauf, keinen Schatten in fester Farbe',
  /gradient/.test(kante?.bild || '') && !/px/.test(kante?.schatten || ''),
  JSON.stringify(kante));
p('Und sie hat Breite, sonst wäre der Verlauf unsichtbar',
  parseFloat(kante?.breite || '0') >= 8, String(kante?.breite));

const gerollt = await telefon.evaluate(async () => {
  const leiste = document.querySelector<HTMLElement>('.lw-nav');
  if (!leiste) return null;
  leiste.scrollLeft = leiste.scrollWidth;
  leiste.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 120));
  return leiste.dataset['mehr'] || '';
});
gleich('Ganz rechts zeigt sie nach links', gerollt, 'links');

/* ==========================================================================
 * §4 · Am Rechner bleibt die Reihenfolge, wie sie war
 * --------------------------------------------------------------------------
 * Die Gegenrichtung. Dort liegt nichts unter einer Falz, und die Begrüssung
 * gehört nach oben. Eine Umstellung, die überall gilt, wäre keine Antwort
 * auf §31, sondern eine zweite Frage.
 * ========================================================================*/
console.log('\n4 · Am Rechner bleibt die Reihenfolge, wie sie war');
const rechner = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
rechner.on('pageerror', (e: any) => fehler.push('PAGEERROR(Rechner): ' + String(e.message).slice(0, 120)));
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2700);
await bestand(rechner);
const r = await lage(rechner);
p('Dort steht die Begrüssung wieder oben',
  (r.hero?.oben ?? 9999) < (r.zahlen?.oben ?? 0), `${r.hero?.oben} < ${r.zahlen?.oben}`);
p('Und der Startknopf ist trotzdem ohne Rollen zu sehen', r.start?.sichtbar === true,
  `y = ${r.start?.oben} von ${r.hoehe}`);
gleich('Und die Leiste braucht dort keinen Hinweis', r.leiste?.mehr, 'nein');

/* ==========================================================================
 * §5 · Der Baum bleibt, wie er ist
 * --------------------------------------------------------------------------
 * Gedreht wird mit `order`, nicht mit einer zweiten Baumstruktur. Für ein
 * Vorleseprogramm und für die Tastatur ändert sich damit nichts — und es
 * gibt keinen zweiten Bauplan, der auseinanderlaufen könnte (§52).
 * ========================================================================*/
console.log('\n5 · Der Baum bleibt, wie er ist');
gleich('Telefon und Rechner haben dieselbe Reihenfolge im Baum',
  t.baumfolge, r.baumfolge);
p('Und die beginnt mit der Begrüssung', t.baumfolge[0] === 'lw-hero' ||
  t.baumfolge[1] === 'lw-hero', t.baumfolge.join(' → '));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
