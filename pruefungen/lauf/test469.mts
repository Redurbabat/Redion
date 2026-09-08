/* Suite 469 — Die Schalensuche findet die STELLE im Dokument (E500)
 * ============================================================================
 * L133, unter „Suche und Verweise":
 *
 *   „Die Schalensuche (Strg P) findet weiterhin Seiten, nicht Stellen — sie
 *    ist eine andere Suche, und das bleibt offen."
 *
 * Bei einem Skript mit zweihundert PDF-Seiten landete man damit auf Seite
 * eins und musste dort ein zweites Mal suchen — genau der Weg, den E468 und
 * E487 im Studio abgeschafft haben, nur eine Ebene höher.
 *
 *   §1 DIE EINE RECHNUNG: `stelleIn` liest, was im Speicher liegt, und
 *      findet dieselben Stellen wie die Suche im Studio (§8).
 *   §2 DIE LISTE NENNT DIE SEITE — „Seite 3" statt „Inhalt" — und zeigt
 *      den Ausschnitt.
 *   §3 EIN TIPP SPRINGT AUF DIE SEITE, nicht auf Seite eins.
 *   §4 EIN FILTER IST KEIN SUCHWORT: `tag:arbeit` steht in keinem
 *      Seitentext und darf die Stelle nicht verfälschen — und der Zweig,
 *      der an der Abfragesprache vorbeigeht, greift dann GAR NICHT (E175).
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §2 → den Nachlieferblock in `schale.ts` weglassen: die Liste sagt
 *        wieder „Inhalt" und nennt keine Seite. Rot.
 *   §3 → die `blockId` am Treffer weglassen: geöffnet wird das Dokument
 *        auf der zuletzt gesehenen Seite, nicht auf der gefundenen. Rot.
 *        (Der erste Entwurf hatte STATTDESSEN einen eigenen Sprungzweig in
 *        `zumTreffer`. Ihn wegzunehmen liess §3 grün — `zeigeBlock` kann es
 *        längst. Er war eine zweite Tür und ist wieder weg, §8.)
 *   §1 → in `fundIm` die Marken überspringen: ein Treffer in einer
 *        Textmarke wird nicht mehr gefunden. Rot.
 *   §2 → den zweiten Zweig weglassen (die Stellen, die die Abfragesprache
 *        nicht kennt): die Mitschrift fehlt in der Liste, weil ihr Treffer
 *        in einer Marke steht. Rot.
 *
 *   node pruefungen/lauf/test469.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const DocumentMode: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9589;
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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/**
 * Ein Skript mit fünf PDF-Seiten; das gesuchte Wort steht auf der DRITTEN.
 * Dazu ein Blatt-Dokument, dessen Treffer in einer Textmarke steht.
 */
const mitSkript = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof DocumentMode !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const skript = Store.addPage(null, { text: 'Elektrotechnik Skript', icon: '📕' });
    const texte = ['Vorwort und Aufbau', 'Kapitel 1 — Ladung und Strom',
      'Kapitel 2 — Der Kirchhoffsche Knotensatz erklärt die Stromverteilung',
      'Kapitel 3 — Leistung', 'Anhang'];
    texte.forEach((t, i) => Store.addBlock(skript.id, 'pdfseite', { text: '', nr: i + 1,
      vonSeiten: 5, bw: 595, bh: 842, quelleId: 'q1', raumVersion: 1, suchtext: t }));
    Store.updateBlock(skript.id, { dokumentModus: true });

    const heft = Store.addPage(null, { text: 'Mitschrift', icon: '📗' });
    for (let i = 0; i < 2; i++) {
      const blatt = Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595.28,
        blattHoehe: 841.89, raumVersion: 1, papier: 'liniert',
        marken: i === 1
          ? [{ id: 'mk', art: 'text', farbe: '#111111', point: [60, 120],
              text: 'Knotensatz mit eigenen Worten' }]
          : [] });
      Store.addBlock(blatt.id, 'text', { text: '' });
    }
    Store.updateBlock(heft.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(skript.id);
  });
  await s.waitForTimeout(1400);
  return s;
};

/** Die Suche öffnen und ein Wort eingeben; gibt die Trefferzeilen zurück. */
const suchen = async (s: Page, wort: string) => {
  await s.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));
  await s.evaluate(() => App.suche());
  await s.waitForSelector('.overlay #q', { timeout: 5000 });
  await s.fill('.overlay #q', wort);
  await s.waitForTimeout(600);
  return JSON.parse(await s.evaluate(`(() => {
    const zeilen = [...document.querySelectorAll('#res button[data-i]')].map(b => ({
      titel: b.querySelector('span:nth-child(2) > span')?.textContent || '',
      art: b.querySelector('.pth')?.textContent || '',
      schnipsel: b.querySelector('.snip:not(.pfad)')?.textContent || ''
    }));
    return JSON.stringify(zeilen);
  })()`) as string);
};

/* ═══ §1 Die eine Rechnung ═════════════════════════════════════════════════ */
console.log('\n§1 `stelleIn` findet dieselben Stellen wie das Studio');
{
  const s = await mitSkript();
  const r = JSON.parse(await s.evaluate(`(() => {
    const seiten = Object.values(Store.cache.blocks).filter(b => b.type === 'page' && b.alive);
    const skript = seiten.find(x => x.text === 'Elektrotechnik Skript');
    const heft = seiten.find(x => x.text === 'Mitschrift');
    return JSON.stringify({
      imSkript: DocumentMode.stelleIn(skript, 'Knotensatz'),
      imHeft: DocumentMode.stelleIn(heft, 'Knotensatz'),
      nichts: DocumentMode.stelleIn(skript, 'Kondensator'),
      zuKurz: DocumentMode.stelleIn(skript, 'K')
    });
  })()`) as string);
  gleich('Im Skript steht es auf Seite 3', r.imSkript?.nr, 3);
  p('… mit einem Ausschnitt um das Wort', /Knotensatz/.test(String(r.imSkript?.auszug)),
    String(r.imSkript?.auszug));
  gleich('Im Heft steht es auf Seite 2 — in einer Textmarke', r.imHeft?.nr, 2);
  gleich('Was nicht drinsteht, gibt nichts', r.nichts, null);
  gleich('Ein einzelner Buchstabe sucht gar nicht erst', r.zuKurz, null);
  await s.close();
}

/* ═══ §2 Die Liste nennt die Seite ═════════════════════════════════════════ */
console.log('\n§2 Die Trefferliste nennt Seite und Ausschnitt');
{
  const s = await mitSkript();
  const zeilen = await suchen(s, 'Knotensatz');
  /* BEIDE — und das zweite ist der Punkt. Der Treffer im Skript steht in
     `suchtext` und war der Abfragesprache bekannt; der im Heft steht in
     einer MARKE, und Marken stehen in keinem Suchindex. Ohne den zweiten
     Zweig in `schale.ts` fehlte die Mitschrift ganz. */
  p('Beide Dokumente stehen in der Liste', zeilen.length >= 2, JSON.stringify(zeilen));
  const skript = zeilen.find((z: any) => /Skript/.test(z.titel));
  const heft = zeilen.find((z: any) => /Mitschrift/.test(z.titel));
  gleich('Beim Skript steht „Seite 3" statt „Inhalt"', skript?.art, 'Seite 3');
  gleich('Beim Heft steht „Seite 2"', heft?.art, 'Seite 2');
  p('… und der Ausschnitt zeigt die Stelle',
    /Knotensatz/.test(String(skript?.schnipsel)), String(skript?.schnipsel));
  await s.close();
}

/* ═══ §3 Der Sprung ════════════════════════════════════════════════════════ */
console.log('\n§3 Ein Tipp springt auf DIE Seite');
{
  const s = await mitSkript();
  /* Zuerst woanders hin, damit „Seite 1" nicht zufällig stimmt. */
  await s.evaluate(() => {
    const seiten = Object.values<any>(Store.cache.blocks).filter(b => b.type === 'page' && b.alive);
    const heft = seiten.find(x => x.text === 'Mitschrift');
    App.oeffne(heft.id);
  });
  await s.waitForTimeout(900);
  await suchen(s, 'Knotensatz');
  await s.evaluate(`(() => {
    const zeilen = [...document.querySelectorAll('#res button[data-i]')];
    const treffer = zeilen.find(b => /Skript/.test(b.textContent || ''));
    treffer.click();
  })()`);
  await s.waitForTimeout(1400);
  const r = JSON.parse(await s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const liste = DocumentMode.documentsIn(seite);
    const titel = document.querySelector('.document-inspector-heading, .document-title');
    const stand = document.querySelector('[data-document-position]');
    return JSON.stringify({ seite: seite.text, seiten: liste.length,
      stand: stand ? stand.textContent : '',
      aktiv: [...document.querySelectorAll('.document-stage')].findIndex(x => x.hasAttribute('data-aktiv')) + 1,
      titel: titel ? titel.textContent : '' });
  })()`) as string);
  gleich('Das Skript ist offen', r.seite, 'Elektrotechnik Skript');
  p('… und zwar auf Seite 3', r.aktiv === 3 || /3\/5|Seite 3/.test(String(r.stand)),
    JSON.stringify(r));
  await s.close();
}

/* ═══ §4 Ein Filter ist kein Suchwort ══════════════════════════════════════ */
console.log('\n§4 Filter zählen nicht als Suchwort');
{
  const s = await mitSkript();
  const r = JSON.parse(await s.evaluate(`(() => {
    /* Genau die Zeile aus schale.ts: die freien Woerter der Abfrage.
       (Kein Gegenstrich in dieser Zeichenkette — er beendet sie.) */
    const frei = (roh) => roh.split(/\\s+/)
      .filter(w => w && !/^[\\p{L}]+:/u.test(w)).join(' ').replace(/["']/g, '').trim();
    return JSON.stringify({
      nurWort: frei('Knotensatz'),
      mitFilter: frei('typ:seite Knotensatz'),
      nurFilter: frei('tag:arbeit'),
      mitZitat: frei('titel:"Skript" Knotensatz')
    });
  })()`) as string);
  gleich('Ein Wort bleibt ein Wort', r.nurWort, 'Knotensatz');
  gleich('Ein Filter davor fällt weg', r.mitFilter, 'Knotensatz');
  gleich('Nur Filter heisst: kein Suchwort', r.nurFilter, '');
  gleich('Anführungszeichen fallen mit', r.mitZitat, 'Knotensatz');
  /* Und in der Oberfläche: mit Filter bleibt die Stelle dieselbe. */
  const zeilen = await suchen(s, 'typ:seite Knotensatz');
  const skript = zeilen.find((z: any) => /Skript/.test(z.titel));
  gleich('Mit Filter steht immer noch „Seite 3"', skript?.art, 'Seite 3');
  await s.close();
}

/* ═══ §5 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§5 Quellen');
{
  const d = lies('src/bereiche/pdf/document-mode.ts');
  p('Die Fundregel steht EINMAL (`fundIm`)',
    (d.match(/const fundIm = /g) || []).length === 1
    && (d.match(/fundIm\(/g) || []).length === 2,
    String((d.match(/fundIm\(/g) || []).length));
  p('`stelleIn` benutzt sie und wird nach aussen gegeben',
    /const stelleIn = /.test(d) && /^\s+stelleIn,$/m.test(d));
  const q = lies('src/schale/aufbau/schale.ts');
  p('Die Schale liefert die Stelle nach', /dok\.stelleIn\(hit\.page, freieWorte\)/.test(q));
  p('… und holt die Stellen dazu, die die Abfragesprache nicht kennt',
    /dok\.stellenSuchen\(freieWorte\)/.test(q));
  p('… aber nur bei einer reinen Wortsuche (E175)',
    /if \(!hasUiFilter && roh\.trim\(\) === freieWorte/.test(q));
  p('… nur für Dokumente', /if \(!hit\.page\?\.dokumentModus\) continue;/.test(q));
  /* KEIN ZWEITER WEG FÜR DEN SPRUNG. `zeigeBlock` kann ihn längst — es
     erkennt ein `pdfseite`/`blatt`-Ziel und wählt die Seite. Der erste
     Entwurf hat daneben einen eigenen gebaut; die Gegenprobe hat gezeigt,
     dass §3 auch ohne ihn grün ist, also war er eine zweite Tür (§8). */
  p('Der Sprung geht über `zeigeBlock` — keine zweite Tür daneben',
    /if \(t\.blockId && zeigeBlock\(t\.blockId\)\) return;/.test(q)
    && !/DocumentMode\.select\(t\.page, t\.blockId\)/.test(q));
  p('… und `zeigeBlock` wählt die Dokumentseite vor dem Öffnen',
    /const dokumentZiel = b\.type === 'pdfseite' \|\| b\.type === 'blatt';/.test(q)
    && /DocumentMode\.select\(seite, b\.id\)/.test(q));
  p('Das erzeugte JS trägt beides',
    /stelleIn/.test(lies('quell/bereiche/pdf/document-mode.js'))
    && /stelleIn/.test(lies('quell/schale/aufbau/schale.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
