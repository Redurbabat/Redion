/* Suite 60 — Ein alter Bestand überlebt den Umzug
 * ----------------------------------------------------------------------------
 * DIE ABSCHLUSSREGEL DES AUFTRAGS LAUTET: *„Redion darf niemals so gebaut
 * werden, dass Nutzer ihre Daten unbemerkt verlieren."* Der Fall, in dem das
 * am ehesten passiert, ist immer derselbe: jemand hat die App vor Monaten
 * benutzt, öffnet sie nach einer Aktualisierung wieder — und die Ablage hat
 * inzwischen eine neue Fassung.
 *
 * `test85` prüft die BESCHREIBUNG der Umzüge: wie viele Fassungen es gibt,
 * welche Fächer dazukamen, was `zwischen(3, 5)` liefert. Das ist der Katalog.
 * Niemand hat je eine **echte Fassung-1-Datenbank** mit heutigem Code
 * geöffnet und nachgesehen, ob die Notizen noch da sind.
 *
 * Genau das tut dieser Lauf, und zwar rückwärts durch alle fünf Fassungen:
 *
 *   1. Eine Datenbank von Hand anlegen — mit der Fassungsnummer von damals
 *      und nur den Fächern, die es damals gab.
 *   2. Eine Seite und Blöcke hineinschreiben, wie sie ein Mensch angelegt
 *      hätte.
 *   3. Die App laden. Der Browser ruft `onupgradeneeded`.
 *   4. Nachsehen: ist alles noch da, und ist die App benutzbar?
 *
 * WARUM DAS NICHT „OFFENSICHTLICH GRÜN" IST: der Umzug in `indexdb.js` ist
 * rein additiv — er legt fehlende Fächer an und fasst vorhandene nicht an.
 * Das SIEHT sicher aus. Aber „sieht sicher aus" ist der Zustand, in dem
 * jeder Fehler dieser Session gefunden wurde. Ein `createObjectStore` ohne
 * `contains`-Prüfung, ein vergessener Index, eine Fassungsnummer, die nicht
 * hochgezählt wurde — jedes davon wäre hier sofort rot, und in der Praxis
 * erst dann sichtbar, wenn es einem Menschen die Notizen kostet.
 *
 *   node pruefungen/lauf/test95.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8803;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };

const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  /* Eine leere Seite auf demselben Ursprung — dort wird die alte Datenbank
     angelegt, BEVOR die App sie auf die neue Fassung hebt. */
  if (rein === '/leer') {
    b.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    b.end('<!doctype html><meta charset="utf-8"><title>leer</title>');
    return;
  }
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

/* Die Fächer, die es in jeder Fassung gab — wortgleich aus
   `quell/kern/ablage/umzuege.js`. Sie werden hier NICHT importiert, sondern
   abgeschrieben: importierte man sie, prüfte der Lauf die Liste gegen sich
   selbst und wäre auch dann grün, wenn beide falsch sind. */
/** Die Fassungen, die es je gab — als eigener Name, damit die Tabelle unten
    nur mit einer davon gelesen werden kann. */
type Fassung = 1 | 2 | 3 | 4 | 5;

const FAECHER_BIS: Record<Fassung, string[]> = {
  1: ['blocks', 'collections', 'views', 'meta'],
  2: ['blocks', 'collections', 'views', 'meta', 'versions'],
  3: ['blocks', 'collections', 'views', 'meta', 'versions', 'dateien', 'stuecke'],
  4: ['blocks', 'collections', 'views', 'meta', 'versions', 'dateien', 'stuecke', 'basis'],
  5: ['blocks', 'collections', 'views', 'meta', 'versions', 'dateien', 'stuecke', 'basis', 'vorrat']
};

const browser = await chromium.launch();

/** Legt eine Ablage in der Fassung `nr` an und schreibt eine Seite hinein. */
const altenBestandAnlegen = async (seite: Page, nr: Fassung) =>
  seite.evaluate(async ([nummer, faecher]: [number, string[]]) => {
  await new Promise<void>((fertig, schief) => {
    const req = indexedDB.open('notizen', nummer);
    req.onupgradeneeded = () => {
      /* `e.target` ist nur ein `EventTarget` und trägt kein `result`. Die
         Anfrage selbst steht ohnehin schon hier — dasselbe Objekt, nur
         benannt. */
      const d = req.result;
      faecher.forEach(f => {
        if (d.objectStoreNames.contains(f)) return;
        const s = d.createObjectStore(f, { keyPath: f === 'meta' ? 'k' : 'id' });
        if (f === 'blocks') { s.createIndex('parent', 'parentId'); s.createIndex('type', 'type'); }
      });
    };
    req.onerror = () => schief(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction(['blocks', 'meta'], 'readwrite');
      t.objectStore('blocks').put({ id: 'alt-seite', type: 'page', text: 'Meine alte Seite',
        parentId: null, content: ['alt-block-1', 'alt-block-2'], alive: true,
        created: '2025-01-01T00:00:00.000Z', edited: '2025-01-01T00:00:00.000Z' });
      t.objectStore('blocks').put({ id: 'alt-block-1', type: 'text',
        text: 'Ein Satz, der nicht verloren gehen darf.', parentId: 'alt-seite',
        content: [], alive: true });
      t.objectStore('blocks').put({ id: 'alt-block-2', type: 'todo',
        text: 'Diese Aufgabe war schon erledigt', checked: true,
        parentId: 'alt-seite', content: [], alive: true });
      t.objectStore('meta').put({ k: 'alterSchalter', v: 'stand-von-damals' });
      t.oncomplete = () => { db.close(); fertig(); };
      t.onerror = () => schief(t.error);
    };
  });
}, [nr, FAECHER_BIS[nr]] as [number, string[]]);

for (const fassung of [1, 2, 3, 4, 5] as Fassung[]) {
  console.log(`\n— Ein Bestand aus Fassung ${fassung} —`);

  const kontext = await browser.newContext();
  const seite = await kontext.newPage();
  const fehler: any[] = [];
  seite.on('pageerror', e => fehler.push(e.message));

  /* Erst die leere Seite: derselbe Ursprung, aber ohne die App — sonst
     hätte sie die Ablage längst auf die neue Fassung gehoben. */
  await seite.goto(`http://localhost:${PORT}/leer`);
  await altenBestandAnlegen(seite, fassung);

  /* Und jetzt die App darauf loslassen. */
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined',
                              null, { timeout: 20000 });
  await seite.waitForTimeout(700);

  /* 1 · Ist der Inhalt noch da? */
  const gefunden = await seite.evaluate(() => {
    const b = Store.getBlock('alt-seite');
    const k1 = Store.getBlock('alt-block-1');
    const k2 = Store.getBlock('alt-block-2');
    return { seiteText: b && b.text, kinder: b && b.content,
             satz: k1 && k1.text, erledigt: k2 && k2.checked,
             meta: Store.getMeta('alterSchalter') };
  });

  gleich(`F${fassung}: Die alte Seite ist noch da`, gefunden.seiteText, 'Meine alte Seite');
  gleich(`F${fassung}: Ihr Text ist unverändert`, gefunden.satz,
    'Ein Satz, der nicht verloren gehen darf.');
  gleich(`F${fassung}: Auch das Häkchen steht noch`, gefunden.erledigt, true);
  gleich(`F${fassung}: Die Reihenfolge der Blöcke stimmt`, gefunden.kinder,
    ['alt-block-1', 'alt-block-2']);
  gleich(`F${fassung}: Eine alte Einstellung überlebt`, gefunden.meta, 'stand-von-damals');

  /* 2 · Sind alle Fächer der HEUTIGEN Fassung da? Ein fehlendes fällt sonst
     erst auf, wenn jemand die zugehörige Funktion benutzt — also spät. */
  const faecher = await seite.evaluate(() => new Promise((f) => {
    const r = indexedDB.open('notizen');
    r.onsuccess = () => { const n = [...r.result.objectStoreNames]; r.result.close(); f(n.sort()); };
  }));
  gleich(`F${fassung}: Alle neun Fächer stehen danach bereit`, faecher, FAECHER_BIS[5]?.slice().sort());

  /* 3 · Und die App muss danach benutzbar sein, nicht nur lesbar. */
  const nachSchreiben = await seite.evaluate(async () => {
    const neu = Store.addBlock('alt-seite', 'text', { text: 'Nach dem Umzug geschrieben' });
    await Store.flush();
    return { id: neu.id, kinder: Store.getBlock('alt-seite').content.length };
  });
  gleich(`F${fassung}: Nach dem Umzug lässt sich weiterschreiben`,
    nachSchreiben.kinder, 3);

  p(`F${fassung}: Kein JS-Fehler beim Öffnen`, fehler.length === 0,
    fehler.slice(0, 2).join(' · '));

  await kontext.close();
}

/* ---------------------------------------------------------------------------
 * UND DER FALL ANDERSHERUM: eine Ablage, die NEUER ist als die App.
 * Das passiert, wenn jemand zwei Fassungen der App auf demselben Rechner hat
 * — etwa die Einzeldatei neben der entpackten. Dann darf die ältere App die
 * neuere Ablage nicht kaputtmachen, sondern muss es sagen.
 * ------------------------------------------------------------------------ */
console.log('\n— Eine Ablage aus der Zukunft —');

const kontext = await browser.newContext();
const seite = await kontext.newPage();
await seite.goto(`http://localhost:${PORT}/leer`);
await seite.evaluate(() => new Promise<void>((f) => {
  const r = indexedDB.open('notizen', 99);
  r.onupgradeneeded = () => {
    /* Wie oben: die Ablage kommt aus der Anfrage, nicht aus `e.target`. */
    const d = r.result;
    ['blocks', 'collections', 'views', 'meta', 'versions', 'dateien',
     'stuecke', 'basis', 'vorrat'].forEach(n => {
      if (!d.objectStoreNames.contains(n))
        d.createObjectStore(n, { keyPath: n === 'meta' ? 'k' : 'id' });
    });
  };
  r.onsuccess = () => { r.result.close(); f(); };
}));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2500);

/* Die App darf die neuere Ablage nicht auf die alte Fassung zurückstufen —
   das wäre Datenverlust auf Vorrat. Der Browser verhindert es von sich aus,
   und die App muss den Fehler ERKLÄREN statt hängenzubleiben. */
const stand = await seite.evaluate(() => new Promise((f) => {
  const r = indexedDB.open('notizen');
  r.onsuccess = () => { const v = r.result.version; r.result.close(); f(v); };
}));
gleich('Die neuere Ablage bleibt auf ihrer Fassung', stand, 99);

const sagtEtwas = await seite.evaluate(() =>
  (document.body?.textContent || '').length > 0);
p('Die App bleibt nicht leer stehen — sie sagt etwas', sagtEtwas);

await kontext.close();
await browser.close();
server.close();

console.log(`\n  Suite 60 — Alter Bestand: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
