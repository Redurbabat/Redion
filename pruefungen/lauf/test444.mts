/* Suite 444 — Die Rechte im Dokument gelten wirklich (E471, L102 zum zweiten Mal)
 * ============================================================================
 * DER FUND. `Konten.darf(was, seiteId)` erwartet eine KENNUNG. Im
 * Dokumentmodus wurde es an sechs Stellen mit dem SEITENOBJEKT gerufen:
 *
 *     Konten.darf('bearbeiten', page)        statt   ('bearbeiten', page.id)
 *
 * Was dabei geschieht, steht in `sitzung.ts` und ist schlimmer als ein
 * übersehener Punkt: `rolleAuf` schlägt mit dem Objekt in `Store.getBlock`
 * nach, findet nichts, läuft die Freigabenkette nie ab — und endet in
 * `strenger(Store.getMeta('rolleStandard', 'voll'), …)`. Die Antwort ist
 * „voll". JEDE Rechtefrage im Dokument sagte ja, gleich welche Freigabe an
 * der Seite hing.
 *
 * Es ist derselbe Fehler wie in L102, und CLAUDE.md §26 nennt ihn beim
 * Namen: „Ein Tor, das ohne Seitenkennung befragt wird, sagt ja."
 *
 *   §1 DIE QUELLE: kein `Konten.darf` bekommt mehr ein Objekt — und zwar
 *      in ganz `src/`, nicht nur im Dokument.
 *   §2 DIE WIRKUNG: eine Seite, die nur gelesen werden darf, lässt sich im
 *      Studio nicht bearbeiten — kein Annotieren, keine Seitengriffe, kein
 *      Einlesen, kein Zoom-Fenster.
 *   §3 UND MIT VOLLEM RECHT geht alles wieder.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 und §2 → an einer Stelle `page.id` wieder durch `page` ersetzen:
 *      der Wächter nennt die Zeile, und die Wirkung fällt. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test444.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Konten: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9564;
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

/* ═══ §1 Die Quelle ════════════════════════════════════════════════════════ */
console.log('\n§1 Die Quelle: keine Rechtefrage mit einem Objekt');
{
  /* Jede Datei unter src/, jeder Aufruf `Konten.darf(…)` mit ZWEI Argumenten.
     Das zweite muss eine Kennung sein: es endet auf `Id`/`id`, ist ein
     String-Literal oder eine Variable, die eine Kennung führt. Ein blosses
     `page`, `block`, `seite`, `b` ist der Fehler von L102. */
  const dateien: string[] = [];
  const sammeln = (ordner: string): void => {
    for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
      const voll = path.join(ordner, e.name);
      if (e.isDirectory()) sammeln(voll);
      else if (e.name.endsWith('.ts')) dateien.push(voll);
    }
  };
  sammeln(path.join(WURZEL, 'src'));
  const schlecht: string[] = [];
  const gut: string[] = [];
  const muster = /Konten\.darf\(\s*(['"][a-zA-Z]+['"]|[A-Za-z_$][\w$]*)\s*,\s*([^),]+)\)/g;
  for (const datei of dateien) {
    const text = fs.readFileSync(datei, 'utf8');
    const zeilen = text.split('\n');
    zeilen.forEach((zeile, i) => {
      muster.lastIndex = 0;
      let treffer: RegExpExecArray | null;
      while ((treffer = muster.exec(zeile))) {
        const zweites = String(treffer[2]).trim();
        const kennung = /(^|\.)([Ii]d|ID)$/.test(zweites) || /^['"]/.test(zweites)
          || /Id\b/.test(zweites) || zweites === 'pageId' || zweites === 'seiteId';
        const wo = path.relative(WURZEL, datei) + ':' + (i + 1) + ' → ' + zweites;
        (kennung ? gut : schlecht).push(wo);
      }
    });
  }
  p('Es gibt überhaupt Rechtefragen mit Kennung zu prüfen', gut.length >= 4, gut.slice(0, 4).join(' | '));
  gleich('Keine einzige Rechtefrage bekommt ein Objekt statt einer Kennung (L102, §26)', schlecht, []);
}

/* ═══ §2 Die Wirkung ═══════════════════════════════════════════════════════ */
console.log('\n§2 Die Wirkung: nur lesen heisst nur lesen');
const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1360, height: 950 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Konten !== 'undefined'");

const lage = () => s.evaluate(() => {
  const aus = (a: string): boolean | null => {
    const k = document.querySelector<HTMLButtonElement>('[data-document-action="' + a + '"]');
    return k ? k.disabled : null;
  };
  return {
    annotieren: aus('annotate'), einlesen: aus('import'),
    seiteDanach: aus('page-add'), loeschen: aus('page-delete'),
    lesezeichen: aus('page-bookmark'), sichern: aus('page-export-image'),
    werkzeuge: document.querySelector<HTMLElement>('.document-workspace')?.dataset.documentTools,
    darf: Konten.darf('bearbeiten', (window as any).__seite),
    darfObjekt: Konten.darf('bearbeiten', Store.getBlock((window as any).__seite))
  };
});

const oeffne = (nurLesen: boolean) => s.evaluate(async (nurLesen: boolean) => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const alt = (window as any).__seite;
  if (alt) { Store.trashBlock(alt); }
  const seite = Store.addPage(null, { text: 'Fremdes Skript', icon: '📕' });
  Store.addBlock(seite.id, 'pdfseite', { text: '', nr: 1, vonSeiten: 1, bw: 595, bh: 842, quelleId: 'q', raumVersion: 1 });
  /* Die Freigabe für ALLE Konten — so hängt sie an der Seite, und `rolleAuf`
     findet sie beim Hochlaufen der Kette. */
  Store.updateBlock(seite.id, { dokumentModus: true, freigaben: { '*': nurLesen ? 'lesen' : 'voll' } });
  (window as any).__seite = seite.id;
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(r => setTimeout(r, 1300));
  document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
  await new Promise(r => setTimeout(r, 400));
  return seite.id as string;
}, nurLesen);

{
  await oeffne(true);
  const z = await lage();
  p('Das Tor selbst sagt nein, wenn es die Kennung bekommt', z.darf === false, JSON.stringify(z));
  p('… und es sagte ja, solange es das Objekt bekam — das war der Fehler', z.darfObjekt === true, JSON.stringify(z));
  gleich('Annotieren, Einlesen und die Seitengriffe sind aus',
    [z.annotieren, z.einlesen, z.seiteDanach, z.loeschen], [true, true, true, true]);
  gleich('Lesezeichen und Sichern bleiben an — sie ändern die Seite nicht',
    [z.lesezeichen, z.sichern], [false, false]);
  gleich('Die Zeichenwerkzeuge sind eingeklappt', z.werkzeuge, 'closed');
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-inspector [data-document-action="lupe"]')?.click(); });
  await s.waitForTimeout(400);
  p('Das Zoom-Fenster geht nicht auf', await s.evaluate(() => !document.querySelector('.document-lupe')));
  /* Und ein erzwungener Tipp ändert auch nichts. */
  await s.evaluate(() => {
    const k = document.querySelector<HTMLButtonElement>('[data-document-action="page-add"]');
    if (k) { k.disabled = false; k.click(); }
  });
  await s.waitForTimeout(500);
  gleich('Ein erzwungener Tipp auf „Seite danach" legt keine Seite an',
    await s.evaluate(() => Store.childrenOf((window as any).__seite).filter((b: any) => b.type === 'blatt').length), 0);
}

/* ═══ §3 Mit vollem Recht ══════════════════════════════════════════════════ */
console.log('\n§3 Mit vollem Recht geht alles wieder');
{
  await oeffne(false);
  const z = await lage();
  p('Das Tor sagt ja', z.darf === true, JSON.stringify(z));
  gleich('Annotieren, Einlesen und die Seitengriffe sind an',
    [z.annotieren, z.einlesen, z.seiteDanach, z.loeschen], [false, false, false, false]);
  await s.evaluate(() => { document.querySelector<HTMLElement>('.document-inspector [data-document-action="page-add"]')?.click(); });
  await s.waitForTimeout(600);
  gleich('„Seite danach" legt jetzt eine Seite an',
    await s.evaluate(() => Store.childrenOf((window as any).__seite).filter((b: any) => b.type === 'blatt').length), 1);
}
await s.close();

console.log('\n§4 Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
