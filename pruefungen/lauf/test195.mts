/* Suite 161 — persistenter Suchindex: Produktweg, Inkrement und Reparatur
 * ============================================================================
 * Der Lauf benutzt die echte IndexedDB und die echten Wege `Store.search`,
 * `Store.updateBlock`, Neuladen und `Kontext.holen`. Seine Gegenprobe ist ein
 * absichtlich beschädigter Cache-Satz: Redions Block bleibt unverändert, der
 * Index erkennt den Schaden und baut genau diese Quelle neu.
 *
 *   node pruefungen/lauf/test195.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8951;
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

let gut = 0, schlecht = 0;
const pruef = (name: string, wahr: unknown, extra = '') => {
  if (wahr) { gut++; console.log('  ✓ ' + name); }
  else { schlecht++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 820 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push(e.message));

try {
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Kontext !== 'undefined');
  await seite.waitForTimeout(1800);

  console.log('\n1 · Vollaufbau und echter Quick-Find-Weg');
  const aufgebaut = await seite.evaluate(async () => {
    const ids: string[] = [];
    for (let i = 0; i < 700; i++) {
      const p = Store.addPage(null, { text: 'Indexprüfung ' + i });
      Store.addBlock(p.id, 'text', {
        text: `eindeutigeswort${i} gemeinsamer Inhalt [[Indexprüfung ${(i + 1) % 700}]]`
      });
      ids.push(p.id);
    }
    await Store.flush();
    const ix = Kontext.bauen();
    await Kontext.warten();
    const treffer = Store.search('eindeutigeswort42');
    return {
      ids, anzahl: ix.anzahl, bericht: ix.bericht, status: Kontext.status(),
      gefunden: treffer.some((x: any) => x.page?.id === ids[42])
    };
  });
  pruef('Quick Find findet den Inhalt über den echten Produktweg', aufgebaut.gefunden);
  /* Fassung 2 seit E724: Zeilen gespiegelter Datenbanken tragen
     `verbunden` (der Schalter „Verbundenes" hat einen Leser). Ein Index der
     Fassung 1 wird beim ersten Abgleich neu gebaut. Gehalten wird weiter
     genau EINE Zahl — und dass die gespeicherte die laufende ist. */
  pruef('Index-Fassung 2 liegt persistent vor (seit E724)',
    aufgebaut.status.persistierteFassung === 2 && aufgebaut.status.fassung === 2,
    JSON.stringify(aufgebaut.status));
  pruef('Alle 700 neuen Seiten sind im Index', aufgebaut.anzahl >= 700,
    'Indexeinträge: ' + aufgebaut.anzahl);

  console.log('\n2 · Eine Inhaltsänderung baut nicht alles neu');
  const inkrement = await seite.evaluate(async (ids: string[]) => {
    const ziel = ids[42];
    if (!ziel) throw new Error('Die Prüffolge enthält keine Seite 42');
    const kind = Store.childrenOf(ziel)[0];
    if (!kind) throw new Error('Die Prüfseite enthält keinen Textblock');
    Store.updateBlock(kind.id, { text: 'nachbearbeitetesziel nur hier' });
    const ix = Kontext.abgleichen();
    await Kontext.warten();
    return {
      bericht: ix.bericht,
      alt: Store.search('eindeutigeswort42').some((x: any) => x.page?.id === ids[42]),
      neu: Store.search('nachbearbeitetesziel').some((x: any) => x.page?.id === ids[42])
    };
  }, aufgebaut.ids);
  pruef('Genau eine Quelle wird neu berechnet', inkrement.bericht.geaendert === 1,
    JSON.stringify(inkrement.bericht));
  pruef('Die übrigen Quellen werden wiederverwendet',
    inkrement.bericht.wiederverwendet >= aufgebaut.anzahl - 1,
    JSON.stringify(inkrement.bericht));
  pruef('Der neue Text ist sofort suchbar', inkrement.neu);
  pruef('Der ersetzte Text ist nicht mehr suchbar', !inkrement.alt);

  console.log('\n3 · Neustart benutzt den gespeicherten Index');
  await seite.reload();
  await seite.waitForFunction(() => typeof Kontext !== 'undefined' && typeof Store !== 'undefined');
  await seite.waitForTimeout(1200);
  const neustart = await seite.evaluate(() => {
    const ix = Kontext.holen();
    return { bericht: ix.bericht, status: Kontext.status() };
  });
  pruef('Der Abgleich kommt aus dem persistenten Cache', neustart.bericht.quelle === 'persistiert',
    JSON.stringify(neustart.bericht));
  /* Die App pflegt beim Start ihre eine Status-/Wissensseite nach. Das ist
     eine echte Datenänderung, kein Index-Neuaufbau. Entscheidend: null neue
     oder reparierte Quellen und höchstens diese eine neu tokenisierte Seite. */
  pruef('Beim Neustart wird nicht der ganze Index neu aufgebaut',
    neustart.bericht.neu === 0 && neustart.bericht.repariert === 0 &&
      neustart.bericht.wiederverwendet >= neustart.bericht.anzahl - 1,
    JSON.stringify(neustart.bericht));

  console.log('\n4 · Gegenprobe: Cache beschädigen, Nutzerdaten behalten, selbst heilen');
  const gegenprobe = await seite.evaluate(async (ids: string[]) => {
    const vorher = JSON.stringify(Store.getBlock(ids[42]));
    await Store.suchindexAendern([{
      id: ids[42], art: 'seite', stand: 'absichtlich-falsch',
      titel: 'CACHE-SCHADEN', text: 'CACHE-SCHADEN', zaehler: null, laenge: -1
    }], []);
    return vorher;
  }, aufgebaut.ids);
  await seite.reload();
  await seite.waitForFunction(() => typeof Kontext !== 'undefined' && typeof Store !== 'undefined');
  await seite.waitForTimeout(1000);
  const geheilt = await seite.evaluate(async ({ ids, vorher }) => {
    const ix = Kontext.holen();
    await Kontext.warten();
    return {
      bericht: ix.bericht,
      datenGleich: JSON.stringify(Store.getBlock(ids[42])) === vorher,
      suchbar: Store.search('nachbearbeitetesziel').some((x: any) => x.page?.id === ids[42]),
      schadenSuchbar: Store.search('CACHE-SCHADEN').some((x: any) => x.page?.id === ids[42])
    };
  }, { ids: aufgebaut.ids, vorher: gegenprobe });
  pruef('Der beschädigte Eintrag wird als Reparatur erkannt', geheilt.bericht.repariert === 1,
    JSON.stringify(geheilt.bericht));
  pruef('Der echte Block blieb bytegleich', geheilt.datenGleich);
  pruef('Die Suche arbeitet wieder aus den echten Daten', geheilt.suchbar && !geheilt.schadenSuchbar);

  console.log('\n5 · Gemessene Grosslistenwege bleiben begrenzt');
  const grosseWege = await seite.evaluate(async () => {
    App.zeichneBaum();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const baum = document.getElementById('tree');
    const fenster = baum?.querySelector<HTMLElement>('.seiten-fenster') || null;
    if (baum && fenster) {
      baum.scrollTop = fenster.offsetTop + Math.floor(fenster.offsetHeight / 2);
      baum.dispatchEvent(new Event('scroll'));
      await new Promise(r => requestAnimationFrame(r));
    }
    const vorbereitet = Links.graphVorbereiten();
    const overlay = Links.graph();
    const info = overlay?.querySelector('.graph-info')?.textContent || '';
    overlay?.remove();
    return {
      fenster: !!fenster,
      seiten: Store.rootPages().length,
      domZeilen: baum?.querySelectorAll('.row').length || 0,
      graphKnoten: vorbereitet.knoten.length,
      graphKanten: vorbereitet.kanten.length,
      graphInfo: info
    };
  });
  pruef('Die Seitenleiste benutzt ab 240 Seiten ein Fenster', grosseWege.fenster,
    JSON.stringify(grosseWege));
  pruef('Im DOM stehen nur sichtbare Seiten plus Puffer',
    grosseWege.domZeilen < 100 && grosseWege.seiten >= 700, JSON.stringify(grosseWege));
  pruef('Die Graphvorbereitung erfasst alle Prüfverweise',
    grosseWege.graphKnoten >= 700 && grosseWege.graphKanten >= 700, JSON.stringify(grosseWege));
  /* ------------------------------------------------------------------------
   * Hier stand: `/600 von/.test(...)`.
   *
   * Die 600 gehörte zur ALTEN Graph-Fassung, die den ganzen Bestand zeichnete
   * und bei 600 Knoten abschnitt. Die neue Fassung in `verweise.ts` zeichnet
   * einen NACHBARSCHAFTS-Ausschnitt um die offene Seite und begrenzt ihn bei
   * `GRAPH_NODE_LIMIT = 320`. Gegen sie konnte der Punkt nie grün werden.
   *
   * Dass er trotzdem grün war, hat einen eigenen Grund: `quell/bereiche/
   * wissen/verweise.js` war auf dem Laptop veraltet — der Browser lief auf
   * dem alten Graphen, während die Quelle längst den neuen enthielt.
   * `test105` („erzeugtes JavaScript passt zur Quelle") war dort rot und hat
   * genau das gemeldet.
   *
   * Geprüft wird jetzt, was die neue Fassung verspricht: sie nennt beide
   * Zahlen, überschreitet ihre Grenze nie, und wenn sie abschneidet, sagt
   * sie es.
   * --------------------------------------------------------------------- */
  const zahlen = grosseWege.graphInfo.match(/^(\d+) von (\d+) Knoten/);
  pruef('Der Ausschnitt nennt seine Grösse und den ganzen Bestand',
    !!zahlen, grosseWege.graphInfo);
  /* NICHT gleich, sondern mindestens: `index.nodes` zählt alles, was der
     Graph kennt (auch Tags), `graphVorbereiten().knoten` nur das, was auf
     der Fläche eine Position bekommt. Gemessen 771 gegen 713 — beides
     richtig, nur nicht dasselbe. */
  pruef('Der genannte Gesamtbestand deckt die vorbereiteten Knoten ab',
    !!zahlen && Number(zahlen[2]) >= grosseWege.graphKnoten && Number(zahlen[2]) >= 700,
    grosseWege.graphInfo + ' gegen ' + grosseWege.graphKnoten);
  pruef('Der Ausschnitt bleibt innerhalb seiner Grenze von 320',
    !!zahlen && Number(zahlen[1]) >= 1 && Number(zahlen[1]) <= 320,
    grosseWege.graphInfo);
  pruef('Und wenn er abschneidet, sagt er es',
    !zahlen || Number(zahlen[1]) < 320 || /begrenzt/.test(grosseWege.graphInfo),
    grosseWege.graphInfo);
} finally {
  await browser.close();
  server.close();
}

pruef('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));
console.log(`\n${gut}/${gut + schlecht} bestanden`);
process.exitCode = schlecht ? 1 : 0;
