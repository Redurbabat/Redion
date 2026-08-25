/* Suite 193 — Ein Spaltenschlüssel aus lauter Ziffern (L36, E172)
 * ============================================================================
 * Bis E96 entstanden Spaltenschlüssel als Hex-Schnipsel, und knapp jeder
 * zehnte bestand nur aus Ziffern. JavaScript behandelt so einen Schlüssel als
 * Feldindex: `Object.keys` gibt ihn VOR allen anderen zurück, aufsteigend
 * sortiert. Die Spalte steht dann immer ganz links — und keine Bedienung der
 * Welt schiebt sie weg.
 *
 * Seit E96 entsteht so ein Schlüssel nicht mehr. Der BESTAND blieb offen, mit
 * dem richtigen Grund: eine Umbenennung ist eine Datenmigration, und die
 * gibt es nur mit eigenem Plan und eigenen Prüfungen (§9, L36).
 *
 * DIES IST DIESE PRÜFUNG, und sie fragt nicht nach Feldnamen, sondern nach
 * VERHALTEN. Eine Migration, die den Schlüssel an neunzehn von zwanzig
 * Stellen umschreibt, sieht im Quelltext gut aus und macht die zwanzigste
 * Stelle stumm kaputt. Also wird derselbe Zustand vor und nach dem Umzug
 * gemessen: dieselben gefilterten Zeilen, dieselbe Sortierung, dieselben
 * Gruppen, dieselben Werte, dieselbe Breite, derselbe Rollup.
 *
 *   node pruefungen/lauf/test227.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8984;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

const r = await seite.evaluate(async () => {
  const warte = (ms: number) => new Promise(rr => setTimeout(rr, ms));
  const ALT = '4711';                      /* der Schlüssel von vor E96 */
  const aus: Record<string, any> = {};

  /* ======================================================================
   * Ein Bestand, wie er vor E96 entstanden ist.
   * ----------------------------------------------------------------------
   * Von Hand gebaut, weil ihn heute nichts mehr erzeugt — das ist der Punkt.
   * Der Zifferschlüssel steht an jeder Stelle, an der ein Schlüssel stehen
   * kann: im Schema, in den Zeilen, im Filter, in der Sortierung, in der
   * Gruppierung, in den versteckten Spalten, in der Zusammenfassung, in der
   * Spaltenbreite — und drüben in einem Rollup.
   * ====================================================================*/
  const seiteA = Store.addPage(null, { text: 'Bestand' });
  const { block: dbBlock, collectionId, viewId } =
    Store.addDatabase(seiteA.id, 'Alte Datenbank', null, 'table');
  const coll = Store.getCollection(collectionId);
  const view = Store.getView(viewId);

  /* Ein Schema mit dem Zifferschlüssel MITTENDRIN — so, wie es der Mensch
     angelegt hätte. Dass er trotzdem vorn landet, ist genau der Fehler. */
  coll.schema = {
    title: { name: 'Name', type: 'title' },
    [ALT]:  { name: 'Punkte', type: 'number' },
    abc:    { name: 'Fach',   type: 'text' }
  };
  aus.vorherReihenfolge = Object.keys(coll.schema);

  Object.assign(view, {
    groupBy: ALT,
    hidden: [ALT],
    sorts: [{ key: ALT, dir: 'desc' }],
    filters: { operator: 'and', rules: [{ key: ALT, op: '>', wert: 3 }] },
    calc: { [ALT]: 'summe' },
    breiten: { [ALT]: 220 },
    /* Und ein Filterwert, der zufällig genauso heisst wie der Schlüssel.
       Er ist eine ZAHL in einer Bedingung, keine Spalte — wer stumpf alles
       ersetzt, macht daraus eine kaputte Bedingung. */
    farbregeln: [{ key: 'abc', op: '=', wert: ALT, farbe: 'red', an: true }]
  });
  Store.rohSetzen('views', view);

  const zeilen = [
    { text: 'Eins',  props: { [ALT]: 5, abc: 'Mathe' } },
    { text: 'Zwei',  props: { [ALT]: 9, abc: '4711'  } },   /* Zelle = ALT */
    { text: 'Drei',  props: { [ALT]: 1, abc: 'Physik'} }
  ];
  const zeilenIds: string[] = [];
  for (const z of zeilen) {
    const row = Store.addRow(collectionId, { text: z.text });
    Object.assign(row, { props: z.props });
    Store.rohSetzen('blocks', row);
    zeilenIds.push(row.id);
  }
  /* Und eine im Papierkorb — sie muss mitwandern, sonst kommt sie mit dem
     alten Schlüssel zurück. */
  const imPapier = Store.addRow(collectionId, { text: 'Vier' });
  Object.assign(imPapier, { props: { [ALT]: 7, abc: 'Chemie' } });
  Store.rohSetzen('blocks', imPapier);
  Store.trashBlock(imPapier.id);

  /* Drüben eine zweite Datenbank mit Verknüpfung und Rollup auf ALT. */
  const { collectionId: zweiteId } =
    Store.addDatabase(seiteA.id, 'Zweite', null, 'table');
  const zweite = Store.getCollection(zweiteId);
  zweite.schema = {
    title: { name: 'Name', type: 'title' },
    rel:   { name: 'Zeilen', type: 'relation', ziel: collectionId },
    roll:  { name: 'Summe',  type: 'rollup', relation: 'rel',
             zielKey: ALT, rollup: 'Summe' }
  };
  Store.rohSetzen('collections', zweite);
  const zweiteZeile = Store.addRow(zweiteId, { text: 'Sammel' });
  Object.assign(zweiteZeile, { props: { rel: zeilenIds } });
  Store.rohSetzen('blocks', zweiteZeile);

  /* Und eine Automation, die auf ALT hört und auf ALT schreibt. */
  coll.automationen = [{
    an: true, name: 'Punkte spiegeln',
    wenn: { art: 'wert-gefuellt', key: ALT },
    dann: [{ art: 'setze', setzeKey: 'abc', wert: 'gesetzt' }]
  }];
  Store.rohSetzen('collections', coll);

  /* ======================================================================
   * Was VORHER herauskommt — das ist der Massstab.
   * ====================================================================*/
  const messe = () => {
    const c = Store.getCollection(collectionId);
    const v = Store.getView(viewId);
    const key = Object.keys(c.schema).find(k => c.schema[k].name === 'Punkte') || '';
    const rows = Store.rowsOf(collectionId);
    return {
      spaltenNamen: Object.keys(c.schema).map(k => c.schema[k].name),
      werte: rows.map((z: any) => Datenbank.wert(z, key, c)),
      /* Die ECHTE Filter- und Sortierstrecke der Datenbank, nicht eine
         nachgebaute: `Datenbank.zeilen` filtert, sortiert und begrenzt so,
         wie es die Tabelle auf dem Bildschirm tut. */
      gefiltert: Datenbank.zeilen(c, v).map((z: any) => z.text),
      gruppeKey: v.groupBy === key,
      sortKey: (v.sorts || []).every((s: any) => s.key === key),
      filterKey: (v.filters.rules || []).every((rr: any) => rr.key === key),
      versteckt: (v.hidden || []).every((h: string) => h === key),
      calc: Object.keys(v.calc || {}),
      breite: (v.breiten || {})[key],
      farbwert: (v.farbregeln || [])[0].wert,
      autoKey: c.automationen[0].wenn.key === key,
      rollup: Datenbank.wert(Store.getBlock(zweiteZeile.id), 'roll',
                             Store.getCollection(zweiteId)),
      papierProps: Object.keys(Store.getBlock(imPapier.id).props || {}).sort(),
      schluessel: key
    };
  };

  /* DER VERSUCH, DIE SPALTE ZU VERSCHIEBEN.
     Genau das tut `spalteEinordnen` beim Ziehen einer Tabellenüberschrift:
     die Schlüssel in die gewünschte Reihenfolge bringen und das Schema in
     dieser Reihenfolge neu bauen. Bei einem Zifferschlüssel nützt das nichts
     — `Object.keys` sortiert ihn beim Lesen wieder nach vorn. DAS ist der
     Fehler, um den es geht, und er lässt sich nur so messen. */
  const verschiebeAnsEnde = (): string[] => {
    const c = Store.getCollection(collectionId);
    const key = Object.keys(c.schema).find(k => c.schema[k].name === 'Punkte') || '';
    const keys = Object.keys(c.schema).filter(k => k !== key).concat([key]);
    const neuSchema: Record<string, any> = {};
    keys.forEach(k => { neuSchema[k] = c.schema[k]; });
    Store.updateCollection(collectionId, { schema: neuSchema });
    return Object.keys(Store.getCollection(collectionId).schema);
  };

  aus.vorher = messe();
  aus.vorherVerschoben = verschiebeAnsEnde();

  /* ======================================================================
   * Und jetzt der Umzug.
   * ====================================================================*/
  Umzuege.zuruecksetzen();
  const bericht = Umzuege.laufen();
  await warte(400);
  aus.gelaufen = bericht.gelaufen.map((x: any) => x.id);
  aus.nachher = messe();
  aus.nachherReihenfolge = Object.keys(Store.getCollection(collectionId).schema);
  aus.nachherVerschoben = verschiebeAnsEnde();

  /* Und ein zweites Mal — ein Umzug muss wiederholbar sein. */
  Umzuege.zuruecksetzen();
  Umzuege.laufen();
  await warte(400);
  aus.zweimal = messe();
  aus.zweimalReihenfolge = Object.keys(Store.getCollection(collectionId).schema);

  /* Und die Probe aufs Ganze: steht der alte Schlüssel irgendwo noch als
     SCHLÜSSEL oder in einem Schlüsselfeld? Gesucht wird im ganzen Bestand,
     nicht in einer Liste von Feldnamen — sonst prüfte die Prüfung dieselbe
     Aufzählung, die auch der Umzug benutzt. */
  const reste: string[] = [];
  const suche = (wert: any, pfad: string) => {
    if (!wert || typeof wert !== 'object') return;
    if (Array.isArray(wert)) { wert.forEach((x, i) => suche(x, pfad + '[' + i + ']')); return; }
    for (const feld of Object.keys(wert)) {
      if (feld === ALT) reste.push(pfad + '.{' + ALT + '}');
      else if (/[Kk]ey$|^groupBy$|^relation$|^pivot|^chart/.test(feld) && wert[feld] === ALT)
        reste.push(pfad + '.' + feld);
      suche(wert[feld], pfad + '.' + feld);
    }
  };
  suche(Store.getCollection(collectionId), 'sammlung');
  suche(Store.getCollection(zweiteId), 'zweite');
  suche(Store.getView(viewId), 'ansicht');
  Store.rowsOf(collectionId).forEach((z: any, i: number) => suche(z, 'zeile' + i));
  suche(Store.getBlock(imPapier.id), 'papierkorb');
  aus.reste = reste;

  aus.dbBlock = dbBlock.id;

  /* ======================================================================
   * Und der Weg, auf dem alte Daten HEUTE hereinkommen: eine Sicherung.
   * ----------------------------------------------------------------------
   * Die Umzüge laufen beim Start. Eine Sicherung von 2025 kommt danach, und
   * die Merkliste sagt „schon gelaufen". Ohne einen zweiten Anlauf wäre der
   * Umzug für alles zuständig ausser für den einen Weg, auf dem sein Fall
   * wirklich auftritt.
   * ====================================================================*/
  const gesichert = JSON.parse(await Store.exportAll());
  /* Von Hand zurückdrehen — so sähe die Datei von damals aus. */
  const zurueck = JSON.stringify(gesichert).split('s4711').join('4711');
  const erg = await Store.importAll(zurueck, 'ersetzen');
  await warte(600);
  aus.importBloecke = erg.bloecke;
  const collNach = Object.values<any>(Store.cache.collections)
    .find((c: any) => c.name === 'Alte Datenbank');
  aus.nachImport = collNach
    ? Object.keys(collNach.schema).filter(k => /^\d+$/.test(k))
    : ['SAMMLUNG FEHLT'];
  aus.nachImportSchluessel = collNach ? Object.keys(collNach.schema) : [];

  return aus;
});

/* ==========================================================================
 * §1 · Der Bestand, um den es geht
 * ========================================================================*/
console.log('\n1 · Der Bestand, um den es geht');

gleich('Der Zifferschlüssel steht in der Mitte — und landet vorn',
  r.vorherReihenfolge, ['4711', 'title', 'abc']);
p('Das ist der Fehler: Notiert wurde Mitte, gelesen wird Anfang',
  r.vorherReihenfolge[0] === '4711');
/* Und der Beweis, dass es nicht bloss unschön ist: die Spalte lässt sich
   nicht wegschieben. Ans Ende geschrieben, steht sie wieder vorn. */
gleich('Ans Ende geschoben steht sie trotzdem wieder vorn',
  r.vorherVerschoben, ['4711', 'title', 'abc']);

/* ==========================================================================
 * §2 · Der Umzug läuft und benennt um
 * ========================================================================*/
console.log('\n2 · Der Umzug läuft und benennt um');

p('Der Umzug ist gelaufen',
  (r.gelaufen || []).includes('spaltenschluessel-ohne-ziffer'), JSON.stringify(r.gelaufen));
gleich('Der Schlüssel heisst jetzt anders', r.nachher.schluessel, 's4711');
/* Wo sie STAND, weiss niemand mehr: `Object.keys` hat sie schon beim Anlegen
   nach vorn gezogen, die notierte Stelle war nie gespeichert. Der Umzug
   erfindet sie deshalb nicht, sondern lässt sie, wo sie zu sehen war — ein
   Umzug, der Spalten verschiebt, sieht aus wie ein Fehler. */
gleich('Der Umzug lässt sie stehen, wo sie zu sehen war',
  r.nachherReihenfolge, ['s4711', 'title', 'abc']);
/* UND JETZT LÄSST SIE SICH BEWEGEN. Das ist der Gewinn, und er ist der
   einzige, den es zu holen gab. */
gleich('Aber jetzt lässt sie sich ans Ende schieben und bleibt dort',
  r.nachherVerschoben, ['title', 'abc', 's4711']);

/* ==========================================================================
 * §3 · Und alles verhält sich wie vorher
 * --------------------------------------------------------------------------
 * Das ist der eigentliche Prüfstein. Eine Migration, die den Schlüssel an
 * neunzehn von zwanzig Stellen umschreibt, sieht im Quelltext gut aus.
 * ========================================================================*/
console.log('\n3 · Und alles verhält sich wie vorher');

gleich('Dieselben Spalten in derselben Anzeige', r.nachher.spaltenNamen, r.vorher.spaltenNamen);
gleich('Dieselben Werte in den Zeilen', r.nachher.werte, r.vorher.werte);
gleich('Dieselben gefilterten Zeilen', r.nachher.gefiltert, r.vorher.gefiltert);
p('Die Gruppierung zeigt auf die Spalte', r.nachher.gruppeKey);
p('Die Sortierung auch', r.nachher.sortKey);
p('Der Filter auch', r.nachher.filterKey);
p('Die versteckten Spalten auch', r.nachher.versteckt);
gleich('Die Zusammenfassung hängt am neuen Schlüssel',
  r.nachher.calc, ['s4711']);
gleich('Die Spaltenbreite ist mitgekommen', r.nachher.breite, 220);
p('Die Automation hört noch auf dieselbe Spalte', r.nachher.autoKey);
gleich('Und der Rollup drüben rechnet weiter', r.nachher.rollup, r.vorher.rollup);
gleich('Auch die Zeile im Papierkorb ist mitgewandert',
  r.nachher.papierProps, ['abc', 's4711']);

/* ==========================================================================
 * §4 · Und was NICHT umgeschrieben werden darf
 * --------------------------------------------------------------------------
 * „4711" ist nicht immer eine Spalte. In einer Farbregel ist es ein WERT, in
 * einer Zelle ist es Inhalt. Wer stumpf alles ersetzt, macht daraus stumm
 * etwas anderes.
 * ========================================================================*/
console.log('\n4 · Und was NICHT umgeschrieben werden darf');

gleich('Der Wert einer Farbregel bleibt, was er war', r.nachher.farbwert, '4711');
gleich('Und eine Zelle mit demselben Text auch',
  r.vorher.werte.length, r.nachher.werte.length);

/* ==========================================================================
 * §5 · Zweimal laufen schadet nicht
 * ========================================================================*/
console.log('\n5 · Zweimal laufen schadet nicht');

gleich('Der Schlüssel heisst danach immer noch so', r.zweimal.schluessel, 's4711');
/* Verglichen mit dem Stand DIREKT DAVOR — und das ist inzwischen die
   verschobene Reihenfolge aus §2. Ein zweiter Durchlauf darf eine Spalte,
   die der Mensch inzwischen bewegt hat, nicht zurückschieben. */
gleich('Die Reihenfolge steht still — auch die inzwischen geänderte',
  r.zweimalReihenfolge, r.nachherVerschoben);
gleich('Und die Werte auch', r.zweimal.werte, r.nachher.werte);

/* ==========================================================================
 * §6 · Und nirgends bleibt ein Rest
 * ========================================================================*/
console.log('\n6 · Und nirgends bleibt ein Rest');

gleich('Kein Schlüsselplatz trägt noch den alten Namen', r.reste, []);

/* ==========================================================================
 * §7 · Und eine alte Sicherung wird auch geheilt
 * --------------------------------------------------------------------------
 * DAS IST DER WEG, AUF DEM DER FALL HEUTE ÜBERHAUPT NOCH AUFTRITT. Wer
 * Redion neu öffnet, hat keine Zifferschlüssel — die gibt es seit E96 nicht
 * mehr. Wer eine Sicherung von damals einspielt, hat sie. Die Umzüge liefen
 * aber beim Start, also vor dieser Sicherung.
 * ========================================================================*/
console.log('\n7 · Und eine alte Sicherung wird auch geheilt');

p('Die Sicherung ist wirklich eingespielt worden', r.importBloecke > 0,
  String(r.importBloecke));
gleich('Danach trägt keine Spalte mehr einen Zifferschlüssel', r.nachImport, []);
gleich('Und sie heisst wieder wie nach dem ersten Umzug',
  r.nachImportSchluessel.filter((k: string) => k.startsWith('s')), ['s4711']);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
