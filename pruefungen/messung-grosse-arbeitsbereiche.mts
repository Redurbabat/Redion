/* Reproduzierbare P7-Messung für grosse lokale Arbeitsbereiche
 * ============================================================================
 * Standard: 1 000 und 10 000 Seiten. `--50000` ergänzt den bewusst langen
 * 50k-Lauf. Das Skript schreibt nichts ins Repository und benutzt ein frisches
 * Playwright-Browserprofil.
 *
 *   node pruefungen/messung-grosse-arbeitsbereiche.mts
 *   node pruefungen/messung-grosse-arbeitsbereiche.mts --50000
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '..');
const PORT = 8902;
const mit50k = process.argv.includes('--50000');
const groessen = mit50k ? [1_000, 10_000, 50_000] : [1_000, 10_000];
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
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
await new Promise<void>(ok => server.listen(PORT, ok));

type Satz = Record<string, any>;
const datensatz = (seiten: number): string => {
  const blocks: Record<string, Satz> = {};
  const jetzt = '2026-08-15T10:00:00.000Z';
  const id = (vor: string, n: number) => vor + String(n).padStart(7, '0');

  for (let i = 0; i < seiten; i++) {
    const pid = id('p', i), bid = id('b', i);
    blocks[pid] = {
      id: pid, type: 'page', text: 'Messseite ' + i, icon: '📄', content: [bid],
      parentId: null, parentTable: 'block', alive: true, order: i,
      created: jetzt, edited: jetzt
    };
    blocks[bid] = {
      id: bid, type: 'text',
      text: `Arbeitsbereich Leistung ${i} seltenesuchwort${i} [[Messseite ${(i + 1) % seiten}]]`,
      content: [], parentId: pid, parentTable: 'block', alive: true,
      created: jetzt, edited: jetzt
    };
  }

  /* Eine lange Seite: genug Text, um nicht nur Ein-Satz-Dokumente zu messen. */
  const lang = 'p0000000';
  for (let i = 0; i < 1_000; i++) {
    const bid = id('l', i);
    blocks[bid] = {
      id: bid, type: 'text', text: 'Langer Absatz ' + i + ' ' + 'inhalt '.repeat(24),
      content: [], parentId: lang, parentTable: 'block', alive: true,
      created: jetzt, edited: jetzt
    };
    blocks[lang]!.content.push(bid);
  }

  /* Eine grosse Datenbank; bei 50k bleibt sie auf 10k Zeilen begrenzt, damit
     der Lauf die Seitengrösse und nicht dreimal dieselbe Zeilenmenge misst. */
  const dbZeilen = Math.min(10_000, Math.max(1_000, Math.floor(seiten / 2)));
  const coll = 'c-gross', view = 'v-gross', db = 'd-gross';
  blocks[db] = {
    id: db, type: 'database', text: 'Grosse Datenbank', collectionId: coll,
    content: [], parentId: 'p0000001', parentTable: 'block', alive: true,
    created: jetzt, edited: jetzt
  };
  blocks['p0000001']!.content.push(db);
  for (let i = 0; i < dbZeilen; i++) {
    const rid = id('r', i);
    blocks[rid] = {
      id: rid, type: 'page', text: 'Datensatz ' + i,
      props: { title: 'Datensatz ' + i, n: i, status: ['Offen', 'Läuft', 'Fertig'][i % 3] },
      content: [], parentId: coll, parentTable: 'collection', alive: true,
      created: jetzt, edited: jetzt, folge: i + 1
    };
  }
  const collections = {
    [coll]: { id: coll, name: 'Grosse Datenbank', icon: '🗂️', viewIds: [view],
      schema: {
        title: { name: 'Name', type: 'title' },
        n: { name: 'Nummer', type: 'number' },
        status: { name: 'Status', type: 'select', options: ['Offen', 'Läuft', 'Fertig'] }
      }, created: jetzt, edited: jetzt }
  };
  const views = {
    [view]: { id: view, collectionId: coll, name: 'Alle', layout: 'table', limit: 0,
      filters: { operator: 'and', rules: [] }, sorts: [], groupBy: '', hidden: [], calc: {},
      created: jetzt, edited: jetzt }
  };
  return JSON.stringify({ version: 6, exportiert: jetzt, blocks, collections, views,
    meta: { rundgangGesehen: true }, versions: [] });
};

const browser = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
const ergebnisse: any[] = [];

try {
  for (const seitenzahl of groessen) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const seite = await context.newPage();
    const fehler: string[] = [];
    seite.on('pageerror', e => fehler.push(e.message));
    const startLeer = performance.now();
    await seite.goto(`http://localhost:${PORT}/index.html`);
    await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined');
    await seite.waitForTimeout(900);
    const leerMs = performance.now() - startLeer;

    const json = datensatz(seitenzahl);
    const importiert = await seite.evaluate(async (daten: string) => {
      const t = performance.now();
      const antwort = await Store.importAll(daten, 'ersetzen');
      return { ms: performance.now() - t, antwort };
    }, json);

    /* Viele Metadaten ohne Nutzlast-Blob. */
    const anhaenge = Math.min(2_000, Math.max(200, Math.floor(seitenzahl / 10)));
    const anhangMs = await seite.evaluate(async ({ anzahl }) => {
      const t = performance.now();
      for (let i = 0; i < anzahl; i++) await Store.dateiPut({
        id: 'messdatei-' + i, blockId: 'b' + String(i).padStart(7, '0'),
        name: 'Anhang-' + i + '.pdf', type: 'application/pdf', groesse: 1024 + i,
        stuecke: 0, erstellt: '2026-08-15T10:00:00.000Z'
      });
      return performance.now() - t;
    }, { anzahl: anhaenge });

    const messung = await seite.evaluate(async ({ seitenzahl }) => {
      const heap = () => (performance as any).memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 104857.6) / 10 : null;
      (globalThis as any).gc?.();
      const speicherVor = heap();

      let t = performance.now();
      const quick = Store.search('seltenesuchwort777');
      const quickKalt = performance.now() - t;

      t = performance.now();
      const ix = Kontext.holen();
      const indexKalt = performance.now() - t;
      if (Kontext.warten) await Kontext.warten();

      t = performance.now();
      const rag = Kontext.finden('seltenesuchwort777', { anzahl: 8 });
      const sucheWarm = performance.now() - t;

      t = performance.now();
      App.zeichneBaum();
      const seitenliste = performance.now() - t;
      const baumKnoten = document.querySelectorAll('#tree .row, #tree .side-item').length;
      const baum = document.getElementById('tree');
      if (baum) {
        baum.scrollTop = Math.floor(baum.scrollHeight / 2);
        baum.dispatchEvent(new Event('scroll'));
        await new Promise(r => requestAnimationFrame(r));
      }
      const baumKnotenGerollt = document.querySelectorAll('#tree .row, #tree .side-item').length;

      t = performance.now();
      App.oeffne('p0000001');
      const datenbank = performance.now() - t;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const dbDomZeilen = document.querySelectorAll('table.grid tbody tr').length;

      t = performance.now();
      const rueck = Links.verweiseAuf('p0000777');
      const backlinks = performance.now() - t;

      /* Neue Fassungen stellen den echten, UI-unabhängigen Produkthelfer
         bereit. Für eine Baseline vor dieser Änderung bildet der Ersatz exakt
         die alte Vorbereitung nach, aber ohne die O(n²)-Animation zu starten. */
      t = performance.now();
      let graph: any;
      if (Links.graphVorbereiten) graph = Links.graphVorbereiten();
      else if (seitenzahl <= 10_000) {
        const alle = Object.values<any>(Store.cache.blocks)
          .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection');
        const idx = new Map(alle.map((p: any, i: number) => [p.id, i]));
        const kanten: any[] = [];
        const seiteVon = (id: string) => {
          let cur = Store.getBlock(id), n = 0;
          while (cur && n++ < 60) {
            if (cur.type === 'page' && cur.parentTable !== 'collection') return cur;
            cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
          }
          return null;
        };
        Object.values<any>(Store.cache.blocks).forEach(b => {
          if (!b.alive || !b.text) return;
          const q = seiteVon(b.id); if (!q) return;
          (b.text.match(/\[\[([^\[\]\n]{1,120})\]\]/g) || []).forEach((m: string) => {
            const name = m.slice(2, -2).trim().toLowerCase();
            const ziel = alle.find((p: any) => (p.text || '').trim().toLowerCase() === name);
            if (ziel && idx.has(q.id) && idx.has(ziel.id)) kanten.push([q.id, ziel.id]);
          });
        });
        graph = { knoten: alle, kanten };
      } else graph = { knoten: [], kanten: [], ausgelassen: true };
      const graphVorbereitung = performance.now() - t;

      await Store.exportVorbereiten();
      t = performance.now();
      const exportiert = Store.exportAll();
      const exportMs = performance.now() - t;

      (globalThis as any).gc?.();
      return {
        quickKalt, quickTreffer: quick.length, indexKalt,
        indexBericht: ix.bericht, indexStatus: Kontext.status ? Kontext.status() : null,
        sucheWarm, ragTreffer: rag.length,
        seitenliste, baumKnoten, baumKnotenGerollt, datenbank, dbDomZeilen,
        backlinks, backlinkQuellen: rueck.length,
        graphVorbereitung, graphKnoten: graph.knoten?.length || 0,
        graphKanten: graph.kanten?.length || 0, graphAusgelassen: !!graph.ausgelassen,
        exportMs, exportMB: Math.round(exportiert.length / 104857.6) / 10,
        speicherVor, speicherNach: heap()
      };
    }, { seitenzahl });

    await seite.evaluate(() => Store.flush());
    await seite.waitForTimeout(500);
    const tStart = performance.now();
    await seite.reload();
    await seite.waitForFunction((mindestens: number) =>
      typeof Store !== 'undefined' && Object.keys(Store.cache.blocks).length >= mindestens &&
      !!document.getElementById('page')?.textContent,
      seitenzahl * 2, { timeout: mit50k ? 120_000 : 45_000 });
    const startVoll = performance.now() - tStart;
    const nachStart = await seite.evaluate(async () => {
      const t = performance.now();
      const ix = Kontext.holen();
      const indexPruefen = performance.now() - t;
      const lager = await Store.usage();
      return { indexPruefen, indexBericht: ix.bericht, lager };
    });

    ergebnisse.push({
      seiten: seitenzahl,
      bloecke: importiert.antwort.bloecke,
      dbZeilen: Math.min(10_000, Math.max(1_000, Math.floor(seitenzahl / 2))),
      anhaenge,
      startLeerMs: Math.round(leerMs), importMs: Math.round(importiert.ms),
      anhangMetadatenMs: Math.round(anhangMs), startVollMs: Math.round(startVoll),
      ...Object.fromEntries(Object.entries(messung).map(([k, v]) =>
        [k, typeof v === 'number' ? Math.round(v * 10) / 10 : v])),
      indexPruefenMs: Math.round(nachStart.indexPruefen * 10) / 10,
      indexNeustart: nachStart.indexBericht,
      speicherIndexedDBMB: nachStart.lager?.benutzt
        ? Math.round(nachStart.lager.benutzt / 104857.6) / 10 : null,
      browserfehler: fehler
    });
    console.log('\n' + seitenzahl.toLocaleString('de-CH') + ' Seiten');
    console.table(ergebnisse[ergebnisse.length - 1]);
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log('\nMESSDATEN_JSON');
console.log(JSON.stringify({ datum: new Date().toISOString(), ergebnisse }, null, 2));
