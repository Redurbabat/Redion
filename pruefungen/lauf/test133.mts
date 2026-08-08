/* Suite 97 — Der Probelauf einer Automation (L16)
 * ============================================================================
 * DER FUND. An jeder Automation sass ein Knopf ▶ mit dem Titel „Einmal
 * probeweise laufen lassen". Er liess sie nicht probeweise laufen, sondern
 * WIRKLICH — auf der ersten Zeile der Datenbank — und sagte hinterher, ob
 * sich etwas geändert hat.
 *
 * Wer ihn drückte, um zu sehen, ob seine Regel stimmt, hatte sie danach
 * angewendet. Bei der Aktion „Eintrag in den Papierkorb" war die Zeile
 * weg; der Toast machte nichts rückgängig. Das ist kein Schönheitsfehler,
 * sondern Priorität 1 aus CLAUDE.md §46 — Daten sicher halten.
 *
 * WAS DIESER LAUF PRÜFT, und warum §2 der eigentliche Punkt ist:
 *
 *   Ein Probelauf muss NICHTS schreiben. Nicht „fast nichts", nicht „nur
 *   die harmlosen Aktionen". §2 vergleicht deshalb nach einem Probelauf
 *   den ganzen Bestand: dieselben Zeilen, dieselben Werte, derselbe
 *   Papierkorb, derselbe Laufverlauf.
 *
 *   Der Schutz liegt an EINER Stelle im Ablauf: der Probelauf bricht ab,
 *   bevor die erste schreibende Aktion an der Reihe ist. Eine Aktion, die
 *   jemand später oben anhängt, umgeht ihn — und §2 findet genau das,
 *   weil es nicht die Aktionen einzeln zählt, sondern das Ergebnis.
 *
 *   §3 prüft die Gegenrichtung: derselbe Lauf OHNE Probe muss schreiben.
 *   Sonst wäre §2 grün, weil überhaupt nichts läuft.
 *
 *   node pruefungen/lauf/test133.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8803;

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

/* --- Eine Datenbank mit einer Automation, die kräftig zulangt -------------
   Absichtlich mit den Aktionen, bei denen ein versehentlicher echter Lauf
   weh tut: Eigenschaft setzen, Zähler, Zeile anlegen, archivieren. */
await seite.evaluate(async () => {
  const w = window as any;
  const s = Store.addBlock(null, 'page', { text: 'Automationsprobe' });
  w.__seite = s.id;
  const db = Store.addDatabase(s.id, 'Aufgaben', {
    title:  { name: 'Aufgabe', type: 'title' },
    status: { name: 'Status', type: 'select',
              options: [{ name: 'Offen' }, { name: 'Fertig' }] },
    zaehler: { name: 'Läufe', type: 'number' },
    notiz:  { name: 'Notiz', type: 'text' }
  }, 'table');
  const coll = Store.getCollection(db.collectionId);
  w.__coll = coll.id;

  const ziel = Store.addDatabase(s.id, 'Ablage', {
    title: { name: 'Titel', type: 'title' }
  }, 'table');
  w.__ziel = ziel.collectionId;

  Store.addRow(coll.id, { title: 'Erste', status: 'Offen', zaehler: 3, notiz: 'unberührt' });
  Store.addRow(coll.id, { title: 'Zweite', status: 'Offen', zaehler: 0, notiz: 'auch' });

  coll.automationen = [{
    id: 'a1', name: 'Kräftig', an: true,
    wenn: { art: 'prop', key: 'status' },
    dann: [
      { art: 'variablen', vars: [{ name: 'x', formel: '"Wert-" + 7' }] },
      { art: 'setze-prop', key: 'notiz', wert: 'geändert {{x}}' },
      { art: 'zaehler', key: 'zaehler' },
      { art: 'neue-zeile', zielDb: ziel.collectionId, titel: 'aus {titel}' },
      { art: 'archivieren' }
    ]
  }];
  Store.updateCollection(coll.id, { automationen: coll.automationen });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 400));
});
await seite.waitForTimeout(400);

/** Ein Abzug des ganzen Bestands — alles, was ein Lauf anfassen könnte. */
const abzug = () => seite.evaluate(() => {
  const w = window as any;
  const coll = Store.getCollection(w.__coll);
  return JSON.stringify({
    zeilen: Store.rowsOf(w.__coll).map((r: any) => ({
      t: r.text, p: r.props, alive: r.alive, arch: !!r.archiviert })),
    ablage: Store.rowsOf(w.__ziel).map((r: any) => r.text),
    verlauf: (coll.automationen?.[0]?.verlauf || []).length,
    protokoll: (Store.getMeta('protokoll', []) || []).length,
    bloecke: Object.keys(Store.cache.blocks).length
  });
});

console.log('\n1 · Der Probelauf sagt, was passieren würde');

const plan = await seite.evaluate(() => {
  const w = window as any;
  const coll = Store.getCollection(w.__coll);
  const zeile = Store.rowsOf(w.__coll)[0];
  const liste: any[] = [];
  (Datenbank as any).automationenLaufen(zeile, coll, 'prop', 'status', 'Fertig', { probe: liste });
  return liste;
});

p('Er nennt jede Aktion, die an der Reihe wäre', (plan as any[]).length === 5,
  (plan as any[]).length + ': ' + (plan as any[]).map(x => x.art).join(', '));
p('… mit dem Namen, den auch das Menü zeigt',
  (plan as any[]).some(x => x.name === 'Eigenschaft setzen'),
  JSON.stringify((plan as any[]).map(x => x.name)));
p('… und der Spalte, die getroffen würde',
  (plan as any[]).some(x => x.ziel === 'Notiz'),
  JSON.stringify((plan as any[]).map(x => x.ziel)));

/* Der Punkt, an dem eine Vorschau erst nützlich wird: sie muss den WERT
   zeigen, mit dem gearbeitet würde — samt aufgelöster Variable. Eine
   Vorschau, die nur „Eigenschaft setzen" sagt, beantwortet nichts. */
const setzt = (plan as any[]).find(x => x.art === 'setze-prop');
gleich('Der Wert steht da, mit aufgelöster Variable', setzt?.wert, 'geändert Wert-7');
const zaehlt = (plan as any[]).find(x => x.art === 'zaehler');
gleich('Der Zähler zeigt, worauf er stünde (3 → 4)', zaehlt?.wert, '4');
const neu = (plan as any[]).find(x => x.art === 'neue-zeile');
p('Die neue Zeile nennt Titel und Zieldatenbank',
  String(neu?.wert ?? '').includes('aus Erste') && String(neu?.wert ?? '').includes('Ablage'),
  JSON.stringify(neu?.wert));

console.log('\n2 · Und er verändert NICHTS — das ist der ganze Punkt');

const vorher = await abzug();
await seite.evaluate(() => {
  const w = window as any;
  const coll = Store.getCollection(w.__coll);
  const zeile = Store.rowsOf(w.__coll)[0];
  /* Dreimal, damit ein Zähler, der doch hochliefe, sichtbar davonliefe. */
  for (let i = 0; i < 3; i++)
    (Datenbank as any).automationenLaufen(zeile, coll, 'prop', 'status', 'Fertig', { probe: [] });
});
await seite.waitForTimeout(400);
const nachher = await abzug();

p('Nach drei Probeläufen ist der Bestand Zeichen für Zeichen derselbe',
  vorher === nachher,
  vorher === nachher ? '' : 'vorher ' + vorher + '\n     nachher ' + nachher);

/* Und jedes Stück einzeln, damit die Meldung sagt, WAS sich verschoben hat. */
const v = JSON.parse(vorher), n = JSON.parse(nachher);
gleich('Die Notiz steht unverändert da', n.zeilen[0].p.notiz, v.zeilen[0].p.notiz);
gleich('Der Zähler steht auf 3, nicht auf 6', n.zeilen[0].p.zaehler, 3);
p('Die Zeile ist nicht archiviert', n.zeilen[0].arch === false);
gleich('In der Ablage liegt keine neue Zeile', n.ablage.length, 0);
gleich('Der Laufverlauf ist leer geblieben', n.verlauf, 0);
gleich('Und das gemeinsame Protokoll auch', n.protokoll, v.protokoll);
gleich('Es ist kein einziger Block dazugekommen', n.bloecke, v.bloecke);

console.log('\n3 · Die Gegenprobe: ohne Probe muss es wirken');
/* Ohne diesen Abschnitt wäre §2 auch dann grün, wenn gar nichts liefe. */
await seite.evaluate(() => {
  const w = window as any;
  const coll = Store.getCollection(w.__coll);
  const zeile = Store.rowsOf(w.__coll)[0];
  (Datenbank as any).automationenLaufen(zeile, coll, 'prop', 'status', 'Fertig');
});
await seite.waitForTimeout(500);
const echt = JSON.parse(await abzug());
p('Der echte Lauf setzt die Notiz',
  String(echt.zeilen[0].p.notiz).includes('geändert'), JSON.stringify(echt.zeilen[0].p.notiz));
gleich('… erhöht den Zähler', echt.zeilen[0].p.zaehler, 4);
p('… archiviert die Zeile', echt.zeilen[0].arch === true);
gleich('… legt die Zeile in der Ablage an', echt.ablage.length, 1);
gleich('… und schreibt einen Laufverlauf', echt.verlauf, 1);

console.log('\n4 · Bedingungen gelten auch im Probelauf');
/* Eine Vorschau, die Aktionen zeigt, die gar nicht drankämen, ist
   schlimmer als keine — sie lässt eine Regel richtig aussehen. */
const gefiltert = await seite.evaluate(() => {
  const w = window as any;
  const coll = Store.getCollection(w.__coll);
  coll.automationen[0].dann = [
    { art: 'setze-prop', key: 'notiz', wert: 'nur wenn offen',
      wenn: { key: 'status', op: 'ist', wert: 'Offen' } },
    { art: 'setze-prop', key: 'notiz', wert: 'nur wenn fertig',
      wenn: { key: 'status', op: 'ist', wert: 'Fertig' } }
  ];
  Store.updateCollection(coll.id, { automationen: coll.automationen });
  const zeile = Store.rowsOf(w.__coll).find((r: any) => r.props?.status === 'Offen')
             || Store.rowsOf(w.__coll)[1];
  const liste: any[] = [];
  (Datenbank as any).automationenLaufen(zeile, coll, 'prop', 'status', 'Offen', { probe: liste });
  return { zeile: zeile.text, status: zeile.props?.status, plan: liste };
});
gleich('Von zwei Aktionen kommt nur eine zum Zug', (gefiltert as any).plan.length, 1);
gleich('… und zwar die, deren Bedingung passt',
  (gefiltert as any).plan[0]?.wert, 'nur wenn offen');

console.log('\n5 · Ein Fehler stoppt nicht alles Weitere');
/* `laufNotiz.fehler` gab es seit jeher, und der Laufverlauf zeigt dafür ein
   ⚠. Gesetzt hat es nie jemand. Und ohne Griff riss eine werfende Aktion
   den ganzen Lauf mit — die Aktionen dahinter liefen nicht, der Verlauf
   blieb leer, und die nächste Automation kam nie an die Reihe. */
const nachFehler = await seite.evaluate(async () => {
  const w = window as any;
  const coll = Store.getCollection(w.__coll);
  coll.automationen[0].dann = [
    { art: 'setze-prop', key: 'notiz', wert: 'sollte scheitern' },
    { art: 'setze-prop', key: 'notiz', wert: 'danach gelaufen' }
  ];
  coll.automationen[0].verlauf = [];
  Store.updateCollection(coll.id, { automationen: coll.automationen });
  const zeile = Store.rowsOf(w.__coll)[1];
  const vorher = zeile.props?.notiz;

  /* EINE Aktion soll wirklich werfen. „Zieldatenbank gibt es nicht" tut das
     nicht — dafür gibt es einen sauberen Zweig mit `return`. Also wird der
     Schreibweg selbst einmal zum Werfen gebracht, und nur beim ersten Mal:
     die zweite Aktion muss danach durchkommen. */
  const echt = Store.setProp;
  let erste = true;
  (Store as any).setProp = (...a: any[]) => {
    if (erste) { erste = false; throw new Error('Absichtlicher Fehler'); }
    return (echt as any)(...a);
  };
  try {
    (Datenbank as any).automationenLaufen(zeile, coll, 'prop', 'status', 'Offen');
    await new Promise(r => setTimeout(r, 400));
  } finally {
    (Store as any).setProp = echt;
  }
  const c2 = Store.getCollection(w.__coll);
  return { vorher, nachher: Store.getBlock(zeile.id).props?.notiz,
           verlauf: c2.automationen[0].verlauf || [] };
});
p('Die Aktion DAHINTER läuft trotzdem',
  (nachFehler as any).nachher === 'danach gelaufen',
  JSON.stringify((nachFehler as any).nachher));
p('Der Lauf steht im Verlauf, statt still zu verschwinden',
  ((nachFehler as any).verlauf || []).length === 1,
  String(((nachFehler as any).verlauf || []).length));
p('… und trägt den Fehler bei sich, damit das ⚠ etwas bedeutet',
  String((nachFehler as any).verlauf?.[0]?.fehler ?? '').includes('Absichtlicher Fehler'),
  JSON.stringify((nachFehler as any).verlauf?.[0]?.fehler));
/* Und der Name der Aktion gehört dazu — „Fehler" allein sagt nicht, welche. */
p('… samt Namen der Aktion, die es war',
  String((nachFehler as any).verlauf?.[0]?.fehler ?? '').includes('Eigenschaft setzen'),
  JSON.stringify((nachFehler as any).verlauf?.[0]?.fehler));

console.log('\n6 · Der Knopf heisst, was er tut');
const knopf = await seite.evaluate(() => {
  const q = document.body.innerHTML;
  return { titel: /data-test="\d+" title="([^"]*)"/.exec(q)?.[1] ?? '' };
});
void knopf;
/* Der Titel steht im Quelltext der Steuerung, nicht immer im DOM — das
   Automationsfenster ist beim Messen zu. Deshalb hier die Quelle selbst. */
const quelle = fs.readFileSync(path.join(WURZEL, 'quell/bereiche/datenbanken/steuerung.js'), 'utf8');
p('Der ▶-Knopf verspricht keinen echten Lauf mehr',
  !/title="Einmal probeweise laufen lassen"/.test(quelle) &&
  /Probelauf: zeigt den Plan, ändert nichts/.test(quelle));
p('Und das Wort „Testlauf" ist verschwunden',
  !/Testlauf:/.test(quelle));

console.log('\n7 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 97 — Probelauf: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
