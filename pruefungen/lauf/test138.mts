/* Suite 102 — Fensterweise zeichnen: die Zeilenhöhe wird gemessen (L22)
 * ============================================================================
 * DER FUND. In `kern/helfer/tempo.ts` stand:
 *
 *     const hoehe = 34;
 *
 * Eine Zeile ist aber nie 34 px hoch. `table.grid td` macht ihre Höhe über
 * `padding`, und die Ansicht hat drei Stufen. Gemessen am 8. August in
 * Chromium:
 *
 *     h-klein    31,25 px
 *     h-normal   37,25 px
 *     h-gross    49,25 px
 *
 * Keine davon ist 34.
 *
 * WAS DAS ANRICHTET, und warum es kein Schönheitsfehler ist
 *
 * Das fensterweise Zeichnen blendet Zeilen aus, die niemand sieht, und
 * setzt an ihre Stelle einen Platzhalter der Höhe `von * hoehe`. Bei 142
 * übersprungenen Zeilen sind das 4828 px statt der wirklichen 6994 — ein
 * Versatz von 2166 px. Der Puffer beträgt 25 Zeilen, also 1231 px, und
 * kann das nicht auffangen.
 *
 * Gemessen vor der Behebung: der Nutzer steht bei 6000 px, also etwa bei
 * Zeile 122. Eingeblendet waren die Zeilen 143 bis 218. Er sieht die
 * falschen Zeilen — oder leeren Raum.
 *
 * WARUM NICHT ZWEI ZAHLEN ABGLEICHEN. Weil die Fehlerquelle dann bliebe,
 * nur mit einem Kommentar daneben. Heute wurde dieselbe Klasse dreimal
 * gefunden (E64 zweimal, hier zum dritten Mal). Eine gemessene Zahl kann
 * nicht auseinanderlaufen.
 *
 * DER LAUF BRAUCHT DREI DINGE, damit es überhaupt greift: mehr als 120
 * Zeilen (`tempoSchwelle`), die Ansicht auf „alle Einträge" (sonst zeigt
 * sie 50), und Rollen. Fehlt eines davon, misst er nichts — §1 prüft
 * deshalb zuerst, dass das Fenstern wirklich aktiv ist.
 *
 *   node pruefungen/lauf/test138.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8815;

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
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/** Eine Datenbank mit 400 Zeilen, Ansicht auf „alle", in der gewählten Stufe. */
const bauen = (stufe: string) => seite.evaluate(async (h) => {
  const w = window as any;
  if (!w.__coll) {
    const s = Store.addBlock(null, 'page', { text: 'Lange Tabelle' });
    const db = Store.addDatabase(s.id, 'Viele', {
      title: { name: 'Name', type: 'title' }, n: { name: 'Nummer', type: 'number' }
    }, 'table');
    const coll = Store.getCollection(db.collectionId);
    for (let i = 0; i < 400; i++) Store.addRow(coll.id, { title: 'Zeile ' + i, n: i });
    w.__coll = coll.id;
    w.__view = coll.viewIds[0];
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 1200));
  }
  /* „alle Einträge" — mit der Vorgabe von 50 greift das Fenstern nie. */
  Store.updateView(w.__view, { limit: 0, hoehe: h });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 1400));
  void w;
}, stufe);

/** Weit rollen und ablesen, welche Zeile der Mensch sieht und welche gezeichnet sind. */
const nachRollen = (wieWeit: number) => seite.evaluate(async (px) => {
  const kasten = document.getElementById('scroll') || document.documentElement;
  kasten.scrollTop = px;
  kasten.dispatchEvent(new Event('scroll'));
  await new Promise(r => setTimeout(r, 400));

  const alle = [...document.querySelectorAll<HTMLTableRowElement>('table.grid tbody tr')]
    .filter(z => !z.classList.contains('vs-luft'));
  const sichtbar = alle.filter(z => z.style.display !== 'none');
  const luft = document.querySelector<HTMLElement>('tr.vs-luft td');

  /* Die wirkliche Zeilenhöhe, an einer eingeblendeten Zeile gemessen. */
  const hoehe = sichtbar[0] ? sichtbar[0].getBoundingClientRect().height : 0;

  /* Welche Nummer trägt die erste und die letzte eingeblendete Zeile?
     Die erste Spalte ist der Titel „Zeile N". */
  const nummer = (z: HTMLTableRowElement | undefined): number => {
    const t = z?.querySelector('td')?.textContent ?? '';
    const m = /(\d+)/.exec(t);
    return m ? Number(m[1]) : -1;
  };

  return {
    fensternAktiv: !!luft,
    zeilenGesamt: alle.length,
    gezeichnet: sichtbar.length,
    vonNr: nummer(sichtbar[0]),
    bisNr: nummer(sichtbar[sichtbar.length - 1]),
    hoehe: Math.round(hoehe * 100) / 100,
    luft: luft ? Math.round(luft.getBoundingClientRect().height) : -1,
    gerollt: Math.round(kasten.scrollTop)
  };
}, wieWeit);

for (const [stufe, name] of [['normal', 'normal (37,25 px)'],
                             ['gross', 'gross (49,25 px)'],
                             ['klein', 'klein (31,25 px)']] as [string, string][]) {
  console.log(`\n${stufe === 'normal' ? 1 : stufe === 'gross' ? 2 : 3} · Zeilenhöhe ${name}`);
  await bauen(stufe);
  const r = await nachRollen(6000);

  p('Das fensterweise Zeichnen ist aktiv', (r as any).fensternAktiv === true,
    `${(r as any).zeilenGesamt} Zeilen, ${(r as any).gezeichnet} gezeichnet`);
  p('… und es blendet wirklich etwas aus',
    (r as any).gezeichnet < (r as any).zeilenGesamt,
    `${(r as any).gezeichnet} von ${(r as any).zeilenGesamt}`);

  /* DER PUNKT. Wo der Mensch steht, hängt an der WIRKLICHEN Zeilenhöhe.
     Diese Zeile muss unter den gezeichneten sein — sonst sieht er leeren
     Raum oder die falschen Daten. */
  const beiMir = Math.floor((r as any).gerollt / ((r as any).hoehe || 1));
  p('Die Zeile, vor der man steht, ist auch gezeichnet',
    beiMir >= (r as any).vonNr && beiMir <= (r as any).bisNr,
    `bei ${(r as any).gerollt} px und ${(r as any).hoehe} px je Zeile ist das Zeile ` +
    `${beiMir}; gezeichnet sind ${(r as any).vonNr}–${(r as any).bisNr}`);

  /* Und der Platzhalter muss so hoch sein wie das, was er ersetzt.
     Eine Zeile Spielraum, weil die erste Zeile eine Rahmenlinie mehr hat. */
  const sollLuft = (r as any).vonNr * (r as any).hoehe;
  p('Der Platzhalter ist so hoch wie die Zeilen, die er ersetzt',
    Math.abs((r as any).luft - sollLuft) < (r as any).hoehe * 2,
    `Platzhalter ${(r as any).luft} px, ${(r as any).vonNr} Zeilen × ` +
    `${(r as any).hoehe} px = ${Math.round(sollLuft)} px`);
}

console.log('\n4 · Und ohne genug Zeilen passiert gar nichts');
/* Die Schwelle ist 120. Darunter wäre Fenstern reine Arbeit ohne Gewinn —
   und ein Platzhalter, den niemand braucht, kann auch nichts verrutschen. */
const wenig = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Kurze Tabelle' });
  const db = Store.addDatabase(s.id, 'Wenige', {
    title: { name: 'Name', type: 'title' }
  }, 'table');
  const coll = Store.getCollection(db.collectionId);
  for (let i = 0; i < 20; i++) Store.addRow(coll.id, { title: 'Zeile ' + i });
  Store.updateView(coll.viewIds[0], { limit: 0 });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 1200));
  return { luft: document.querySelectorAll('tr.vs-luft').length,
           zeilen: document.querySelectorAll('table.grid tbody tr').length };
});
p('Bei zwanzig Zeilen gibt es keinen Platzhalter', (wenig as any).luft === 0,
  `${(wenig as any).luft} Platzhalter bei ${(wenig as any).zeilen} Zeilen`);

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 102 — Fensterweise zeichnen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
