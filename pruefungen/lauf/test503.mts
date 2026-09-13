/* Suite 503 — Die Folienliste zeigt Folien
 * ============================================================================
 * O4, zweiter Teil. E546 hat die eingelesene Präsentation als Dokument
 * aufgehen lassen; damit war die Seitenliste da, die G3 gebaut hat — mit
 * Menü je Seite, Einfügen, Löschen, Verschieben. Der Blick darauf
 * (`bilder/fe-seitenliste.png`) zeigte drei Fehler, alle in derselben
 * Funktion, und alle erst im Bild:
 *
 *   §1 DIE MINIATUR WAR HOCHKANT, DIE FOLIE QUER. `.document-thumbnail-preview`
 *      trägt `aspect-ratio:210/297` — A4, fest verdrahtet. Eine 16:9-Folie
 *      stand darin als Hochformat. Gemessen: Miniatur 0,68, Folie 1,78.
 *
 *   §2 DIE MINIATUR WAR LEER. Für alles, was keine PDF-Seite mit Bild ist,
 *      stand ein Bleistift („✎") im Kasten. Bei 27 Folien also 27 gleiche
 *      leere Kästchen — man kann darin nichts finden. Die Marken der Folie
 *      liegen aber bereit, und `Marken.zeichneMarke` zeichnet sie schon für
 *      Vortrag, Druck und Seitenbild.
 *
 *   §3 JEDE HIESS „A4-Blatt". `sourceLabel` gibt für `blatt` diesen einen
 *      Satz zurück — auch im `aria-label` („A4-Blatt öffnen"), 27-mal
 *      dasselbe. Für einen Menschen am Bildschirm unbrauchbar, für ein
 *      Vorleseprogramm schlimmer (§38).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier wirklich gefahren, die Zahlen sind GEMESSEN (18 grün ist gesund):
 *   §1 → `preview.style.aspectRatio` weglassen:      17 grün,  1 rot.
 *   §2 → `markenVorschau` immer `null`:              13 grün,  5 rot.
 *   §3 → `sourceLabel` wieder „A4-Blatt" für alles:  15 grün,  3 rot.
 *   §3b→ die Nummer vor dem Namen weglassen:         17 grün,  1 rot.
 *
 * §3 fing beim ersten Versuch nur ZWEI: die Zusage verglich auf Gleichheit,
 * und mit der Nummer davor heisst die Zeile „1 · A4-Blatt" — also nicht
 * gleich, also grün. Jetzt prüft sie auf „enthält". Eine Prüfung, die am
 * eigenen Zusatz vorbeiliest, prüft die Hälfte.
 *
 *   node pruefungen/lauf/test503.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9613;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(250);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
await seite.waitForTimeout(400);

const TITEL = ['Titelfolie', 'Aufgabe 1', 'Aufgabe 2', 'Aufgabe 3', 'Zusammenfassung'];

const gebaut = await seite.evaluate((titel: string[]) => {
  /* Ein Foliensatz wie aus dem .pptx-Einleser: 16:9, Text als Marken. */
  const deck = Store.addPage(null, { text: 'Kapitel 4', icon: '📽️' });
  titel.forEach(t => {
    const b = Store.addBlock(deck.id, 'blatt', {
      text: t, blattBreite: 960, blattHoehe: 540, papier: 'blanko' });
    Store.updateBlock(b.id, { marken: [
      { id: 'k' + t, art: 'text', point: [60, 50], breiteBox: 840, text: t, fontSize: 30, fett: true },
      { id: 'i' + t, art: 'text', point: [60, 190], breiteBox: 840, text: 'Inhalt von ' + t, fontSize: 20 },
      { id: 'd' + t, art: 'abdeck', farbe: '#FFCC00', schritt: 1, pts: [[54, 294], [620, 340]] },
    ] });
  });
  Store.updateBlock(deck.id, { dokumentModus: true });

  /* UND DANEBEN EIN ECHTES A4-BLATT ohne Marken und ohne Titel — das muss
     hochkant bleiben und darf weiterhin „A4-Blatt" heissen. Sonst hätte
     diese Suite nur die eine Hälfte gemessen. */
  const heft = Store.addPage(null, { text: 'Notizheft' });
  Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.updateBlock(heft.id, { dokumentModus: true });
  return { deck: deck.id, heft: heft.id };
}, TITEL);

/** Die Seitenliste aufklappen und messen. */
const listeAuf = async (seiteId: string) => {
  await seite.evaluate((id: string) => App.oeffne(id), seiteId);
  await seite.waitForTimeout(1800);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen, .overlay').forEach(o => o.remove());
  });
  const geklickt = await seite.evaluate(() => {
    const knopf = [...document.querySelectorAll<HTMLElement>('button, a')]
      .find(b => /^▤\s*Seiten$/.test((b.textContent || '').trim()));
    if (!knopf) return false;
    knopf.click(); return true;
  });
  await seite.waitForTimeout(900);
  return geklickt;
};

/* ══ §1 DIE MINIATUR HAT DAS MASS IHRER FOLIE ════════════════════════════ */
console.log('\n§1 Eine 16:9-Folie hat auch eine 16:9-Miniatur');
{
  p('Die Seitenliste geht auf', await listeAuf(gebaut.deck));

  const m = await seite.evaluate(() => {
    const vorschauen = [...document.querySelectorAll<HTMLElement>('.document-thumbnail-preview')];
    const gross = document.querySelector('.blatt-papier')?.getBoundingClientRect();
    return {
      zahl: vorschauen.length,
      masse: vorschauen.map(v => {
        const r = v.getBoundingClientRect();
        return r.height > 0 ? +(r.width / r.height).toFixed(2) : 0;
      }),
      grossMass: gross && gross.height > 0 ? +(gross.width / gross.height).toFixed(2) : 0,
    };
  });

  gleich('Fünf Miniaturen stehen in der Liste', m.zahl, 5);
  gleich('Die Folie im Bild ist 16:9', m.grossMass, 1.78);
  p('Und jede Miniatur auch — nicht hochkant',
    m.masse.length === 5 && m.masse.every(v => Math.abs(v - 16 / 9) < 0.05),
    JSON.stringify(m.masse));
}

/* ══ §2 DIE MINIATUR ZEIGT DIE FOLIE ═════════════════════════════════════ */
console.log('\n§2 In der Miniatur steht, was auf der Folie steht');
{
  const m = await seite.evaluate(() => {
    const vorschauen = [...document.querySelectorAll<HTMLElement>('.document-thumbnail-preview')];
    return {
      mitBleistift: vorschauen.filter(v => (v.textContent || '').includes('✎')).length,
      mitSvg: vorschauen.filter(v => v.querySelector('svg')).length,
      /* Der Text der ERSTEN Folie muss in der ERSTEN Miniatur stehen —
         nicht irgendwo in der Liste. Sonst wäre jede Miniatur gleich und
         die Zusage wertlos. */
      ersterText: (vorschauen[0]?.textContent || '').replace(/\s+/g, ' ').trim(),
      zweiterText: (vorschauen[1]?.textContent || '').replace(/\s+/g, ' ').trim(),
      /* Und die Abdeckung muss AUCH in der Miniatur decken — sonst stünde
         die Antwort in der Seitenliste offen (E266). */
      deckel: vorschauen.filter(v => v.querySelector('[data-ink-art="abdeck"]')).length,
    };
  });

  gleich('Kein Bleistift mehr statt einer Folie', m.mitBleistift, 0);
  gleich('Jede Miniatur zeichnet die Folie', m.mitSvg, 5);
  p('Die erste Miniatur zeigt die erste Folie',
    /Titelfolie/.test(m.ersterText), m.ersterText.slice(0, 60));
  p('Die zweite zeigt die zweite', /Aufgabe 1/.test(m.zweiterText), m.zweiterText.slice(0, 60));
  gleich('Und die Abdeckung deckt auch dort (E266)', m.deckel, 5);
}

/* ══ §3 DER NAME SAGT, WELCHE FOLIE ES IST ═══════════════════════════════ */
console.log('\n§3 Fünf Folien, fünf Namen — nicht fünfmal „A4-Blatt"');
{
  const m = await seite.evaluate(() => {
    const knoepfe = [...document.querySelectorAll<HTMLElement>('.document-thumbnail')];
    return {
      beschriftungen: knoepfe.map(b =>
        (b.querySelector('.document-thumbnail-label')?.textContent || '').replace(/\s+/g, ' ').trim()),
      ariaLabels: knoepfe.map(b => b.getAttribute('aria-label') || ''),
    };
  });

  /* AUF „ENTHÄLT", NICHT AUF „IST GLEICH". Der erste Entwurf verglich auf
     Gleichheit — und mit der Nummer davor heisst die Zeile „1 · A4-Blatt",
     also nicht gleich, also grün. Die Gegenprobe fing damit zwei Zusagen
     statt vier (gemessen). Eine Prüfung, die am eigenen Zusatz vorbeiliest,
     prüft die Hälfte (§55.2). */
  p('Keine heisst mehr „A4-Blatt"',
    !m.beschriftungen.some((t: string) => /A4-Blatt/.test(t)), JSON.stringify(m.beschriftungen));
  p('Die Titel der Folien stehen dran',
    m.beschriftungen.some((t: string) => /Titelfolie/.test(t)) &&
    m.beschriftungen.some((t: string) => /Zusammenfassung/.test(t)),
    JSON.stringify(m.beschriftungen));
  gleich('Und alle fünf sind verschieden', new Set(m.beschriftungen).size, 5);
  p('Auch das Vorleseprogramm hört fünf verschiedene (§38)',
    new Set(m.ariaLabels).size === 5, JSON.stringify(m.ariaLabels.slice(0, 2)));
  p('Die Nummer steht dabei — bei 27 Folien zählt niemand',
    m.beschriftungen.every((t: string, i: number) => t.startsWith(String(i + 1))),
    JSON.stringify(m.beschriftungen.slice(0, 3)));
}

/* ══ §4 UND DAS ECHTE A4-BLATT BLEIBT, WAS ES WAR ════════════════════════ */
console.log('\n§4 Ein leeres A4-Blatt bleibt hochkant und heisst weiter so');
{
  p('Die Liste des Notizhefts geht auf', await listeAuf(gebaut.heft));
  const m = await seite.evaluate(() => {
    const v = document.querySelector<HTMLElement>('.document-thumbnail-preview');
    const r = v?.getBoundingClientRect();
    return {
      mass: r && r.height > 0 ? +(r.width / r.height).toFixed(2) : 0,
      name: (document.querySelector('.document-thumbnail-label')?.textContent || '').trim(),
    };
  });
  /* 210/297 = 0,707. Ein Blatt ohne eigene Masse bleibt bei der Vorgabe. */
  p('Das A4-Blatt ist hochkant geblieben', Math.abs(m.mass - 595 / 842) < 0.05, String(m.mass));
  p('Und es heisst weiterhin „A4-Blatt"', /A4-Blatt/.test(m.name), m.name);
}

p('Keine Browserfehler', fehler.length === 0, fehler.join(' | '));

await kontext.close();
await browser.close();
server.close();
console.log(`\nSuite 503: ${ok} grün` + (weg ? `, ${weg} rot` : '') + '.');
process.exit(weg ? 1 : 0);
