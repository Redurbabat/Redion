/* Suite 259 — Kartentext sieht überall gleich aus (E252)
 * ============================================================================
 * Der Karteikasten zeichnet Vorder- und Rückseite mit `Blocks.inline` —
 * **fett** wird fett, `Code` wird Code. Dieselbe Karte stand in der
 * Lernwelt (Training, Simulation, Fehlerliste) mit nackten Sternchen da:
 * zwei Anzeigen desselben Textes, eine davon falsch.
 *
 * §1 IM TRAINING wird die Auszeichnung GEZEICHNET: <b> und <code> stehen
 *    im Baum, die Sternchen nicht mehr im Text.
 * §2 DIE MASKIERUNG BLEIBT (§19): getipptes HTML auf einer Karte wird
 *    Text, kein Element — `Blocks.inline` maskiert zuerst und verziert
 *    dann. Ein kartenText, der das aufweicht, macht diesen Teil rot.
 *
 * Die Runde zeigt auch die Demo-Karten des frischen Profils — gesucht
 * wird deshalb DURCH die Runde, nicht auf der ersten Karte. (Der erste
 * Entwurf nahm „Karte 1 = meine Karte" an und mass „Wo liegen meine
 * Daten?" — die Willkommens-Karte.)
 *
 *   node pruefungen/lauf/test259.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9025;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1300, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof Store !== 'undefined' &&
  typeof (globalThis as any).Produktwelten !== 'undefined', null, { timeout: 30000 });
await seite.waitForTimeout(1200);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/** Eine neue Trainingsrunde starten und die Karte mit `muster` in der
 *  Vorderseite suchen: jede fremde Karte wird aufgedeckt und mit „Gut"
 *  bewertet, bis die gesuchte offen liegt. Zurück kommt, was auf ihr —
 *  vorn und aufgedeckt hinten — wirklich im Baum steht. */
const sucheKarte = (muster: string) => seite.evaluate(async (such: string) => {
  const klick = (wahl: string): void =>
    (document.querySelector(wahl) as HTMLElement | null)?.click();
  const zahl = Object.values<any>(Store.cache.blocks)
    .filter(b => b && b.type === 'flashcard' && b.alive !== false).length;
  klick('[data-lw-train="today"]');
  await new Promise(r => setTimeout(r, 900));
  if (!document.querySelector('.lw-study-card')) {
    klick('[data-lw-train="new"]');
    await new Promise(r => setTimeout(r, 900));
  }
  for (let i = 0; i <= zahl + 1; i++) {
    const h = document.querySelector('.lw-study-card h3');
    if (!h) break;
    if ((h.textContent || '').includes(such)) {
      klick('[data-lw-action="training-reveal"]');
      await new Promise(r => setTimeout(r, 400));
      const a = document.querySelector('.lw-answer');
      return {
        gefunden: true,
        vornFett: !!h.querySelector('b'), vornCode: !!h.querySelector('code'),
        vornImg: !!h.querySelector('img'), vornText: (h.textContent || '').trim(),
        hintenFett: !!a?.querySelector('b'), hintenCode: !!a?.querySelector('code'),
        hintenText: (a?.textContent || '').trim(),
        xss: (window as any).__xss259 === 1
      };
    }
    klick('[data-lw-action="training-reveal"]');
    await new Promise(r => setTimeout(r, 300));
    klick('[data-lw-rate="3"]');
    await new Promise(r => setTimeout(r, 700));
  }
  return { gefunden: false, vornFett: false, vornCode: false, vornImg: false,
           vornText: '', hintenFett: false, hintenCode: false, hintenText: '',
           xss: (window as any).__xss259 === 1 };
}, muster);

console.log('\n1 · Im Training wird die Auszeichnung gezeichnet');
await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elektrotechnik' });
  Store.addBlock(s.id, 'flashcard',
    { text: '**Ohm** sagt `U = R · I` :: Die **Formel** lautet `U = R · I`' });
  await Store.flush();
});
await seite.evaluate(() => (globalThis as any).Produktwelten.lernen('heute'));
await seite.waitForTimeout(900);
const ohm = await sucheKarte('Ohm');
p('Die Ohm-Karte kommt an die Reihe', ohm.gefunden, JSON.stringify(ohm));
p('Ihre Vorderseite zeichnet <b> und <code>',
  ohm.gefunden && ohm.vornFett && ohm.vornCode, JSON.stringify(ohm));
p('Die Sternchen stehen nicht mehr im Text',
  ohm.gefunden && !ohm.vornText.includes('**') && ohm.vornText.includes('Ohm'),
  ohm.vornText);
p('Die aufgedeckte Antwort zeichnet <b> und <code> genauso',
  ohm.gefunden && ohm.hintenFett && ohm.hintenCode, JSON.stringify(ohm));

console.log('\n2 · Die Maskierung bleibt — getipptes HTML wird Text, kein Element');
await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Probeseite' });
  Store.addBlock(s.id, 'flashcard',
    { text: '<img src=x onerror=window.__xss259=1> Tag :: <b>nicht fett</b>' });
  await Store.flush();
});
await seite.evaluate(() => (globalThis as any).Produktwelten.lernen('heute'));
await seite.waitForTimeout(900);
const angriff = await sucheKarte('Tag');
p('Die Angriffs-Karte kommt an die Reihe', angriff.gefunden, JSON.stringify(angriff));
p('Aus dem img-Text wird KEIN Element, und kein Code läuft',
  angriff.gefunden && !angriff.vornImg && !angriff.xss &&
  angriff.vornText.includes('<img'), JSON.stringify(angriff));
p('Getipptes <b> bleibt wörtlicher Text',
  angriff.gefunden && !angriff.hintenFett &&
  angriff.hintenText.includes('<b>nicht fett</b>'), JSON.stringify(angriff));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));
await browser.close(); server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
