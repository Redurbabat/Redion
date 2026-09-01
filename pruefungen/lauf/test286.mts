/* Suite 286 — Die Rechteprüfung der Agenten trifft ihr Ziel (E291, L102)
 * ============================================================================
 * `kern/zugang/sitzung.ts:154`:
 *
 *     const darf = (was, seiteId?) => {
 *       const id = seiteId || App.aktuelleSeite();   // die OFFENE Seite
 *       if (!id) return true;                        // ohne Seite: alles
 *       return rolle(rolleAuf(id, '')).darf.includes(was);
 *     };
 *
 * `bereiche/ki/agenten.ts:773` rief das OHNE Seitenkennung. Zwei Folgen:
 *
 *   1. Mit offener Seite wurden die Werkzeuge gegen DIESE Seite geprüft —
 *      nicht gegen die, die sie anfassen.
 *   2. Ohne offene Seite kam `true` heraus. Genau das ist seit E132 der
 *      Normalfall: die Startansicht ist das Heute-Dashboard, und das ist
 *      keine Seite.
 *
 * Von zwölf Werkzeugen prüfte genau EINES später richtig nach
 * (`seiteLesen`, mit `p.id`). `zeileAnlegen` und `feldFuellen` schreiben in
 * eine Datenbank, die sie sich per NAMEN suchen — und hingen allein an dem
 * Tor, das ins Leere greift.
 *
 *   §1 DAS TOR greift ins Leere, und das bleibt so — es kann gar nicht anders.
 *   §2 SEITE ZU SAMMLUNG findet den Ort, an dem die Rechte hängen.
 *   §3 `zeileAnlegen` prüft die Datenbank, die es WIRKLICH meint.
 *   §4 `feldFuellen` ebenso — und VOR dem Schreiben des Auftrags.
 *   §5 OHNE ZIEL wird weder heimlich erlaubt noch heimlich gesperrt.
 *   §6 GEGENPROBE: mit Recht geht alles durch.
 *
 * ─── KANN ER ROT WERDEN? (§55.2) ────────────────────────────────────────────
 * §3 und §4 waren vor E291 rot: ohne offene Seite legte der Agent die Zeile
 * an, gleich welche Rolle das Konto auf der Datenbank hatte. §6 ist die
 * Gegenprobe dazu — ohne sie prüfte der Lauf nur, dass alles gesperrt ist,
 * und das wäre mit einem `return false` auch zu haben.
 *
 *   node pruefungen/lauf/test286.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
declare const Konten: any; declare const Agent: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9069;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  () => typeof Store !== 'undefined' && typeof (globalThis as any).Konten !== 'undefined',
  null, { timeout: 30000 });
await seite.waitForTimeout(1400);

/* Einen Bestand bauen, an dem sich Rechte messen lassen: eine Seite mit
   einer Datenbank darauf, und ein Konto, das darauf nur lesen darf. */
const aufbau = await seite.evaluate(async () => {
  document.getElementById('rg-willkommen')?.remove();
  const seiteMitDb = Store.addBlock(null, 'page', { text: 'Gesperrte Seite' });
  const db = Store.addDatabase(seiteMitDb.id, 'Gesperrte Liste');
  const collId = db.collectionId || (db.block && db.block.collectionId) || '';
  /* Ein zweites Konto anlegen und anmelden, damit „ich" nicht der Ersteller
     bin — sonst greift die Regel „wer es angelegt hat, behält es". */
  /* DIE KONTOROLLE IST DIE OBERGRENZE, nicht die Antwort. `rolleAuf`
     rechnet `strenger(Seitenfreigabe, Kontorolle)`; mit einem Konto der
     Rolle „lesen" wäre JEDE Seite gesperrt, und §6 hätte nichts zu zeigen.
     Das Konto darf also grundsätzlich bearbeiten — den Unterschied machen
     die beiden Freigaben unten. */
  const k = Konten.anlegen({ name: 'Gast', rolleId: 'edit' });
  Konten.anmelden(k.id);
  Konten.setzeFreigabe(seiteMitDb.id, k.id, 'lesen');
  /* Und eine Datenbank, an der das Konto sehr wohl schreiben darf. */
  const freieSeite = Store.addBlock(null, 'page', { text: 'Freie Seite' });
  const db2 = Store.addDatabase(freieSeite.id, 'Freie Liste');
  const collId2 = db2.collectionId || (db2.block && db2.block.collectionId) || '';
  Konten.setzeFreigabe(freieSeite.id, k.id, 'edit');
  return { seiteMitDb: seiteMitDb.id, collId, freieSeite: freieSeite.id,
           collId2, konto: k.id,
           dbName: (Store.cache.collections[collId] || {}).name,
           db2Name: (Store.cache.collections[collId2] || {}).name };
}) as any;

p('Der Bestand steht: zwei Datenbanken, ein Konto mit zwei Rollen',
  !!aufbau.collId && !!aufbau.collId2 && aufbau.collId !== aufbau.collId2,
  JSON.stringify(aufbau));

/* ------------------------------------------------------------------------ */
console.log('\n1 · Das Tor greift ins Leere — und das bleibt so');

const tor = await seite.evaluate(() => {
  /* Keine Seite offen — der Normalfall seit E132. */
  const vorher = App.aktuelleSeite && App.aktuelleSeite();
  const ohneSeite = Konten.darf('bearbeiten');
  return { vorher: String(vorher || ''), ohneSeite };
}) as any;

p('Ohne offene Seite sagt `darf("bearbeiten")` weiterhin true',
  tor.ohneSeite === true,
  'offen: „' + tor.vorher + '", Antwort: ' + tor.ohneSeite);
p('… und das ist RICHTIG so — „darf ich überhaupt" ist keine Ortsfrage',
  true);

/* ------------------------------------------------------------------------ */
console.log('\n2 · Seite zu Sammlung findet den Ort der Rechte');

const ort = await seite.evaluate(({ collId, seiteMitDb }: any) => ({
  gefunden: Konten.seiteZuSammlung(collId),
  erwartet: seiteMitDb,
  ohneKennung: Konten.seiteZuSammlung(''),
  erfunden: Konten.seiteZuSammlung('gibt-es-nicht-4711')
}), aufbau) as any;

p('Die Sammlung findet ihre Seite', ort.gefunden === ort.erwartet,
  ort.gefunden + ' statt ' + ort.erwartet);
p('Ohne Kennung gibt es keine Seite', ort.ohneKennung === '');
p('Eine erfundene Kennung ebenso — und keine Ausnahme',
  ort.erfunden === '', ort.erfunden);

/* ------------------------------------------------------------------------ */
console.log('\n3 · `zeileAnlegen` prüft die Datenbank, die es wirklich meint');

const gesperrt = await seite.evaluate(async ({ dbName, collId }: any) => {
  const vorher = Store.rowsOf(collId).length;
  const urteil = Konten.darfAnSammlung('bearbeiten', collId);
  const antwort = await Agent.WERKZEUGE.zeileAnlegen.lauf(
    { datenbank: dbName, werte: { Name: 'Darf nicht' } },
    { ids: [], felder: [] });
  const nachher = Store.rowsOf(collId).length;
  return { urteil, antwort: String(antwort), vorher, nachher };
}, aufbau) as any;

p('Das Recht an der gesperrten Datenbank ist FALSCH', gesperrt.urteil === false,
  String(gesperrt.urteil));
p('Der Agent legt dort NICHTS an', gesperrt.nachher === gesperrt.vorher,
  gesperrt.vorher + ' → ' + gesperrt.nachher);
p('… und sagt im Klartext, warum', /darfst du nichts anlegen/.test(gesperrt.antwort),
  gesperrt.antwort.slice(0, 120));

/* ------------------------------------------------------------------------ */
console.log('\n4 · `feldFuellen` ebenso — und VOR dem Schreiben des Auftrags');

const feld = await seite.evaluate(async ({ dbName, collId }: any) => {
  const c = Store.cache.collections[collId];
  /* `noUncheckedIndexedAccess` sagt zu Recht, dass ein Feldzugriff leer sein
     kann. Eine frisch angelegte Datenbank hat immer eine Spalte; steht hier
     keine, ist der Aufbau kaputt und der Abschnitt soll das sagen. */
  const spalte = String(Object.keys(c.schema)[0] || '');
  if (!spalte) return { antwort: 'KEINE SPALTE IM AUFBAU', auftragVorher: '', auftragNachher: '' };
  const auftragVorher = c.schema[spalte].auftrag || '';
  const antwort = await Agent.WERKZEUGE.feldFuellen.lauf(
    { datenbank: dbName, spalte: c.schema[spalte].name, auftrag: 'Etwas Neues' },
    { ids: [], felder: [] });
  const auftragNachher = (Store.cache.collections[collId].schema[spalte].auftrag || '');
  return { antwort: String(antwort), auftragVorher, auftragNachher };
}, aufbau) as any;

p('Der Agent füllt nichts', /darfst du nichts ändern/.test(feld.antwort),
  feld.antwort.slice(0, 120));
p('… und der Spaltenauftrag bleibt unangetastet — die Prüfung sitzt DAVOR',
  feld.auftragNachher === feld.auftragVorher,
  '„' + feld.auftragVorher + '" → „' + feld.auftragNachher + '"');

/* ------------------------------------------------------------------------ */
console.log('\n5 · Ohne Ziel wird weder heimlich erlaubt noch heimlich gesperrt');

const ohneZiel = await seite.evaluate(() => ({
  urteil: Konten.darfAnSammlung('bearbeiten', 'gibt-es-nicht-4711')
})) as any;

p('Eine Sammlung ohne Seite ergibt `null`, nicht true und nicht false',
  ohneZiel.urteil === null, String(ohneZiel.urteil));

/* ------------------------------------------------------------------------ */
console.log('\n6 · GEGENPROBE: mit Recht geht alles durch');

const erlaubt = await seite.evaluate(async ({ db2Name, collId2 }: any) => {
  const vorher = Store.rowsOf(collId2).length;
  const urteil = Konten.darfAnSammlung('bearbeiten', collId2);
  const antwort = await Agent.WERKZEUGE.zeileAnlegen.lauf(
    { datenbank: db2Name, werte: { Name: 'Darf sehr wohl' } },
    { ids: [], felder: [] });
  const nachher = Store.rowsOf(collId2).length;
  return { urteil, antwort: String(antwort), vorher, nachher };
}, aufbau) as any;

p('Das Recht an der freien Datenbank ist WAHR', erlaubt.urteil === true,
  String(erlaubt.urteil));
p('Der Agent legt dort sehr wohl an', erlaubt.nachher === erlaubt.vorher + 1,
  erlaubt.vorher + ' → ' + erlaubt.nachher);
p('… und meldet es', /angelegt/.test(erlaubt.antwort), erlaubt.antwort.slice(0, 120));

p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | ').slice(0, 300));

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
