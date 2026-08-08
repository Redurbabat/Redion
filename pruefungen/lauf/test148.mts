/* Suite 112 — Was der Browser bei einer grossen Sicherung wirklich hergibt (L14)
 * ============================================================================
 * Das Format kann grosse Dateien seit E39 (ZIP64, stückweise Prüfsummen).
 * GEMESSEN hat es nie jemand — L14 stand seit Wochen als „ungemessen" in
 * LUECKEN.md. Eine Zusicherung, die nie unter Last war, ist keine.
 *
 * Hier wird der ECHTE Weg unter Last gesetzt, mit denselben Griffen wie
 * test100 (E73): `sicherungSpeichern` selbst, Download abgefangen, Import
 * über `zipLesenAusBlob` + `importAll` + den Anhangsweg.
 *
 * DREI DATEIEN à 48 MB — zusammen 144 MB, mehr als jede bisherige Prüfung
 * (test100 arbeitet mit Kilobytes) und mehr als `SERVER_DATEI_MAX`.
 *
 * WAS GEMESSEN WIRD, UND WARUM ES PRÜFPUNKTE SIND
 *
 *   1. Der JS-Heap während des Packens. CLAUDE.md §11/§14: grosse Blobs
 *      STÜCKWEISE, nicht vollständig in den Arbeitsspeicher. Ein Packer,
 *      der die 144 MB als Bytes in den Heap zöge, risse den Messwert über
 *      die Gesamtgrösse — der Punkt würde rot. (Blobs selbst verwaltet der
 *      Browser ausserhalb des JS-Heaps; genau deshalb ist der Heap hier
 *      das richtige Messgerät für „stückweise".)
 *   2. Die Bytes nach dem Kreis Export → wipe → Import. Stichproben an
 *      16 Stellen je Datei plus voller Vergleich der ersten Datei.
 *   3. Die Dauer — kein harter Grenzwert fürs Tempo, aber eine grosszügige
 *      Decke, unter der „es stürzt nicht ab und hängt nicht" liegt.
 *
 *   node pruefungen/lauf/test148.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8841;

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
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const mb = (x: number): string => (x / 1048576).toFixed(1) + ' MB';

/* `--enable-precise-memory-info` macht `performance.memory` gradgenau statt
   auf 20 MB gequantelt — ohne die Flagge misst Punkt 1 Rauschen. */
const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
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

const DATEI_MB = 48;
const DATEIEN = 3;

console.log(`\n1 · ${DATEIEN} Dateien à ${DATEI_MB} MB ablegen`);

const anlegen = await seite.evaluate(async ({ DATEI_MB, DATEIEN }) => {
  const t0 = Date.now();
  const s = Store.addBlock(null, 'page', { text: 'Grosse Sicherung' });
  const kennungen: string[] = [];
  for (let d = 0; d < DATEIEN; d++) {
    /* Musterbytes je 1-MB-Stück: (Stücknummer + Dateinummer) — damit lässt
       sich jede Stelle später NACHRECHNEN, ohne das Original zu behalten. */
    const teile: Uint8Array[] = [];
    for (let i = 0; i < DATEI_MB; i++)
      teile.push(new Uint8Array(1048576).fill((i + d) % 251));
    const b = Store.addBlock(s.id, 'file', { text: 'gross-' + d + '.bin' });
    const satz = await Dateien.ablegen(
      new File(teile as any, 'gross-' + d + '.bin', { type: 'application/octet-stream' }),
      { blockId: b.id });
    Store.updateBlock(b.id, { dateiId: satz.id });
    kennungen.push(satz.id);
  }
  await Store.flush();
  const platz = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
  return { kennungen, dauer: Date.now() - t0,
           belegt: platz?.usage ?? -1, frei: platz?.quota ?? -1 };
}, { DATEI_MB, DATEIEN });
const an = anlegen as any;
gleich('Alle Dateien sind angemeldet', an.kennungen.length, DATEIEN);
console.log(`    (Ablegen: ${(an.dauer / 1000).toFixed(1)} s · belegt ${mb(an.belegt)} von ${mb(an.frei)})`);

console.log('\n2 · Die echte Sicherung, unter Last');

const export1 = await seite.evaluate(async () => {
  const heap = () => (performance as any).memory?.usedJSHeapSize ?? -1;
  const vorher = heap();
  let spitze = vorher;
  const wache = setInterval(() => { const h = heap(); if (h > spitze) spitze = h; }, 50);

  const gefangen: { blob: Blob | null; name: string } = { blob: null, name: '' };
  const echtURL = URL.createObjectURL.bind(URL);
  const echtClick = HTMLAnchorElement.prototype.click;
  (URL as any).createObjectURL = (b: Blob) => { gefangen.blob = b; return 'blob:gefangen'; };
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.download) { gefangen.name = this.download; return; }
    return echtClick.call(this);
  };
  const t0 = Date.now();
  let gut: any = null;
  try { gut = await App.sicherungSpeichern(); }
  finally {
    (URL as any).createObjectURL = echtURL;
    HTMLAnchorElement.prototype.click = echtClick;
    clearInterval(wache);
  }
  (window as any).__archiv = gefangen.blob;
  return { gut, groesse: gefangen.blob?.size ?? 0, dauer: Date.now() - t0,
           vorher, spitze, name: gefangen.name };
});
const ex = export1 as any;
const GESAMT = DATEIEN * DATEI_MB * 1048576;
gleich('sicherungSpeichern sagt true', ex.gut, true);
p(`Das Archiv trägt die ganzen ${mb(GESAMT)}`, ex.groesse >= GESAMT,
  mb(ex.groesse));
p('Der JS-Heap blieb dabei UNTER der Nutzlast — stückweise, wie §14 verlangt',
  ex.spitze - ex.vorher < GESAMT,
  `Spitze +${mb(ex.spitze - ex.vorher)} bei ${mb(GESAMT)} Nutzlast`);
p('Unter fünf Minuten', ex.dauer < 300000, (ex.dauer / 1000).toFixed(1) + ' s');
console.log(`    (Export: ${(ex.dauer / 1000).toFixed(1)} s · Heap +${mb(Math.max(0, ex.spitze - ex.vorher))} · Archiv ${mb(ex.groesse)})`);

console.log('\n3 · Alles weg, alles zurück');

const zurueck = await seite.evaluate(async ({ DATEI_MB, DATEIEN }) => {
  await Store.wipe();
  const leer = (await Store.dateiAlle()).length;

  const t0 = Date.now();
  const zip = await Einlesen.zipLesenAusBlob((window as any).__archiv);
  await Store.importAll(await zip.text('daten.json'), 'ersetzen');

  /* Derselbe Weg wie in `anhaengeEinspielen` (test100, E73). */
  const karte = JSON.parse(await zip.text('dateien.json'));
  const nachName: Record<string, string> = {};
  Object.entries(karte.zuordnung).forEach(([name, id]) => { nachName[String(id)] = name; });
  const STUECK = KONSTANTEN.STUECK;
  for (const satz of karte.saetze) {
    const name = nachName[satz.id];
    const roh = name ? await zip.alsBlob(name) : null;
    if (!roh) continue;
    const blob = roh.type === (satz.typ || '') ? roh : new Blob([roh], { type: satz.typ || '' });
    let nr = 0;
    for (let von = 0; von < blob.size; von += STUECK) {
      /* `dateiId`, nicht `datei` — das ist der FELDname; `datei` ist nur der
         Name des INDEX darauf. Der erste Wurf schrieb `datei:` und alle 48
         Stücke waren für `stueckeVon` unsichtbar, obwohl sie im Fach lagen.
         Dieselbe Verwechslung wie `page`/`pageId` in E21. */
      await Store.stueckPut({ id: satz.id + ':' + nr, dateiId: satz.id, nr,
                              blob: blob.slice(von, Math.min(von + STUECK, blob.size)) });
      nr++;
    }
    await Store.dateiPut(Object.assign({}, satz, { teile: nr, angekommen: nr, zustand: 'fertig' }));
  }
  const dauer = Date.now() - t0;

  const saetze = await Store.dateiAlle();
  /* Stichproben: 16 Stellen je Datei, nachgerechnet aus dem Muster. */
  let stichproben = 0, treffer = 0, ganzeGleich = false;
  for (let d = 0; d < DATEIEN; d++) {
    const satz = saetze.find((x: any) => x.name === 'gross-' + d + '.bin');
    if (!satz) continue;
    const blob = await Dateien.alsBlob(satz.id);
    if (!blob || blob.size !== DATEI_MB * 1048576) continue;
    for (let k = 0; k < 16; k++) {
      const stueck = Math.floor(k * DATEI_MB / 16);
      const stelle = stueck * 1048576 + Math.floor(1048576 / 2);
      const byte = new Uint8Array(await blob.slice(stelle, stelle + 1).arrayBuffer())[0];
      stichproben++;
      if (byte === (stueck + d) % 251) treffer++;
    }
    if (d === 0) {
      const alles = new Uint8Array(await blob.arrayBuffer());
      ganzeGleich = alles.length === DATEI_MB * 1048576 &&
        alles.every((x, i) => x === (Math.floor(i / 1048576) + 0) % 251);
    }
  }
  return { leer, dauer, anzahl: saetze.length, stichproben, treffer, ganzeGleich };
}, { DATEI_MB, DATEIEN });
const zu = zurueck as any;
gleich('Nach dem Löschen war wirklich nichts mehr da', zu.leer, 0);
gleich('Alle Dateien sind zurück', zu.anzahl, DATEIEN);
/* Erst die Zahl, dann der Vergleich: mit dem `datei:`-Fehler oben war
   „treffer == stichproben" GRÜN — als 0 == 0. Eine Stichprobe, die nie
   genommen wurde, stimmt nicht, sie fehlt (§55.2). */
gleich('Es wurden wirklich alle Stichproben genommen', zu.stichproben, DATEIEN * 16);
gleich(`Alle ${DATEIEN * 16} Stichproben stimmen`, zu.treffer, zu.stichproben);
p('Und die erste Datei ist Byte für Byte gleich', zu.ganzeGleich === true);
p('Auch der Import bleibt unter fünf Minuten', zu.dauer < 300000,
  (zu.dauer / 1000).toFixed(1) + ' s');
console.log(`    (Import: ${(zu.dauer / 1000).toFixed(1)} s)`);

console.log('\n4 · Aufräumen');
const sauber = await seite.evaluate(async () => {
  await Store.wipe();
  return (await Store.dateiAlle()).length;
});
gleich('Der Prüfbestand ist wieder weg', sauber, 0);

console.log('\n5 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 112 — ${mb(GESAMT)} durch den Kreis: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
