/* Suite 69 — Die verschlüsselte Sicherung hält, was der Dialog verspricht
 * ----------------------------------------------------------------------------
 * Beim Schreiben von `doku/REDION-FORMAT.md` kam heraus, dass es **zwei**
 * Sicherungswege gibt, die beide „Sicherung" heissen und nicht dasselbe tun:
 *
 *   Store.exportAll()          .json / .redion   Hauptweg
 *   Krypto.bestandSammeln()    .verschluesselt.json
 *
 * Der zweite hatte drei Mängel, und der dritte ist der schlimmste, den ein
 * Sicherungssystem haben kann.
 *
 * ─── 1 · ER SICHERT WENIGER, UND SAGT ES NICHT ──────────────────────────────
 *
 * Kein `versions`, keine Anhänge — und **kein `fehlt`/`hinweis`**, das es
 * sagen würde. Genau dafür wurden diese Felder erfunden: eine Sicherung, die
 * nicht sagt, was sie auslässt, ist die gefährlichste Sorte.
 *
 * ─── 2 · DER DIALOG SAGT „ERSETZT", DER CODE FÜHRT ZUSAMMEN ─────────────────
 *
 * `Object.assign(Store.cache.blocks, p.blocks)` legt dazu. Wer eine Sicherung
 * einspielt, um einen kaputten Stand loszuwerden, hat ihn danach immer noch.
 *
 * ─── 3 · DAS EINGESPIELTE WURDE NIE GESCHRIEBEN ─────────────────────────────
 *
 * Die vier `Object.assign` fassen **nur den Zwischenspeicher** an. Danach:
 *
 *     Store.alles && Store.alles();     ← die Funktion gibt es nicht
 *     UI.toast('Eingelesen — die Seite wird neu geladen');
 *     setTimeout(() => location.reload(), 900);
 *
 * Der Aufruf ist abgesichert und deshalb ein stiller Leerlauf. Nichts geht in
 * die Ablage. Neunhundert Millisekunden später lädt die Seite neu, liest aus
 * der Ablage — und dort steht der alte Bestand. Die Wiederherstellung wird
 * als geglückt gemeldet und ist eine Sekunde später verschwunden.
 *
 * Das ist der Fall, für den `CLAUDE.md` seinen Schlusssatz hat: Redion darf
 * niemals so gebaut werden, dass Nutzer ihre Daten unbemerkt verlieren. Hier
 * verlieren sie nicht einmal etwas — sie bekommen etwas nicht zurück und
 * werden dabei beglückwünscht.
 *
 *   node pruefungen/lauf/test104.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8816;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };
const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const kontext = await browser.newContext();
const seite = await kontext.newPage();
const fehler: any[] = [];
seite.on('pageerror', e => fehler.push(e.message));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
                                  typeof Krypto !== 'undefined',
                            null, { timeout: 20000 });

/* ========================================================================= *
 * 1 · WAS EINE VERSCHLÜSSELTE SICHERUNG ÜBER SICH SELBST SAGT
 * ========================================================================= */
console.log('\n1 · Die Sicherung sagt, was sie enthält und was nicht');

const kopf = await seite.evaluate(async () => {
  /* Etwas Bestand, ein Verlaufseintrag, ein Anhang-Kopfsatz. */
  const s = Store.addBlock(null, 'page', { text: 'Reisenotizen' });
  Store.addBlock(s.id, 'text', { text: 'Zug um 7:14' });
  await Store.versionSpeichern(s.id, 'manuell');
  await Store.dateiPut({ id: 'datei-ticket', name: 'ticket.pdf', groesse: 12,
                         typ: 'application/pdf', blockId: s.id, teile: 1,
                         angekommen: 1, zustand: 'fertig',
                         angelegt: Store.now(), fertigAm: Store.now() });

  await Store.exportVorbereiten();
  const roh = await Krypto.bestandSammeln();
  const d = JSON.parse(roh);
  return {
    felder: Object.keys(d),
    hatEnthaelt: Array.isArray(d.enthaelt),
    hatFehlt: Array.isArray(d.fehlt),
    hatHinweis: typeof d.hinweis === 'string' && d.hinweis.length > 0,
    versionen: Array.isArray(d.versions) ? d.versions.length : null,
    seiteDa: !!Object.values(d.blocks || {}).find((b: any) => b && b.text === 'Reisenotizen')
  };
});

p('Der Bestand ist drin', kopf.seiteDa, JSON.stringify(kopf.felder));
p('Sie trägt „enthaelt"', kopf.hatEnthaelt, JSON.stringify(kopf.felder));
p('Sie trägt „fehlt"', kopf.hatFehlt, JSON.stringify(kopf.felder));
p('Sie sagt im Klartext, was fehlt („hinweis")', kopf.hatHinweis);
p('Der Versionsverlauf kommt mit', kopf.versionen === 1,
  'versions=' + kopf.versionen);

const nennt = await seite.evaluate(async () => {
  await Store.exportVorbereiten();
  const d = JSON.parse(await Krypto.bestandSammeln());
  return { fehlt: d.fehlt || [], hinweis: d.hinweis || '' };
});
p('Die Anhänge stehen unter „fehlt"',
  nennt.fehlt.includes('dateien') && nennt.fehlt.includes('stuecke'),
  JSON.stringify(nennt.fehlt));
p('Der Hinweis nennt die Zahl der ausgelassenen Dateien',
  /\b1\b/.test(nennt.hinweis), nennt.hinweis);

/* ========================================================================= *
 * 2 · VERSCHLÜSSELN UND WIEDER LESEN
 * ========================================================================= */
console.log('\n2 · Der Rundlauf mit Passwort');

const rund = await seite.evaluate(async () => {
  await Store.exportVorbereiten();
  const roh = await Krypto.bestandSammeln();
  const geheim = await Krypto.verschluesseln(roh, 'holzweg-42');
  const zurueck = await Krypto.sicherungLesen(geheim, 'holzweg-42');

  let falschesPasswort = null;
  try { await Krypto.sicherungLesen(geheim, 'daneben'); }
  catch (e: unknown) { falschesPasswort = (e instanceof Error ? e.message : String(e)); }

  return {
    seiteDa: !!Object.values(zurueck.blocks || {}).find((b: any) => b && b.text === 'Reisenotizen'),
    versionen: Array.isArray(zurueck.versions) ? zurueck.versions.length : null,
    falschesPasswort
  };
});
p('Mit dem richtigen Passwort kommt der Bestand zurück', rund.seiteDa);
p('Der Verlauf kommt mit zurück', rund.versionen === 1, 'versions=' + rund.versionen);
p('Ein falsches Passwort wird abgelehnt', rund.falschesPasswort !== null);

/* ========================================================================= *
 * 2b · GROSSE MENGEN — DIE KLIPPE BEI 128 KB
 * ---------------------------------------------------------------------------
 * `btoa(String.fromCharCode(...bytes))` reicht jedes Byte als eigenen
 * Aufruf-Parameter weiter. Ab etwa 128 000 Bytes ist der Aufrufstapel voll.
 *
 * Diese Zeile stand an drei Stellen, und alle drei waren Verschlüsselung:
 * die Sicherung hier, die Seitensperre in `wissen/werkzeuge.js`, der Abgleich
 * in `kern/abgleich/maschine.js`. Also genau dort, wo viel Text durchgeht.
 * Wer genug Notizen hatte, dass sich das Sichern lohnte, konnte nicht
 * sichern — und die Meldung sprach von Aufrufstapeln statt von Grössen.
 *
 * Eine Fassung liegt jetzt in `core/helpers/bytes.ts`; `test87` hält fest,
 * dass keine vierte danebenwächst. Hier wird das Verhalten geprüft, nicht
 * der Quelltext: eine Million Bytes durch alle drei Wege.
 * ========================================================================= */
console.log('\n2b · Auch eine grosse Sicherung lässt sich verschlüsseln');

const gross = await seite.evaluate(async () => {
  const erg: Record<string, any> = {};
  /* Eine Million Zeichen — achtmal über der alten Klippe. */
  const viel = 'x'.repeat(1000000);

  try {
    const geheim = await Krypto.verschluesseln(viel, 'passwort');
    erg.sicherung = (await Krypto.entschluesseln(geheim, 'passwort')) === viel;
  } catch (e: unknown) { erg.sicherung = 'FEHLER: ' + (e instanceof Error ? e.message : String(e)); }

  try {
    const hin = Bytes.toBase64(new TextEncoder().encode(viel));
    erg.helfer = new TextDecoder().decode(Bytes.fromBase64(hin)) === viel;
  } catch (e: unknown) { erg.helfer = 'FEHLER: ' + (e instanceof Error ? e.message : String(e)); }

  return erg;
});
p('Eine Million Zeichen gehen durch die verschlüsselte Sicherung',
  gross.sicherung === true, String(gross.sicherung));
p('Der Helfer selbst hält eine Million Zeichen aus',
  gross.helfer === true, String(gross.helfer));

/* Die dritte Stelle — `verschluessele` im Abgleich — lässt sich hier nicht
   von aussen aufrufen: `Wolke` gibt sie nicht heraus. Gehalten wird sie
   deshalb anders, und das ist hier ausdrücklich vermerkt statt stillschweigend
   ausgelassen: `test87` verbietet die Spread-Fassung im ganzen Quelltext, und
   der Helfer darüber ist mit einer Million Zeichen geprüft. Der Abgleich ruft
   nur noch ihn auf. */
console.log('    (Die dritte Stelle im Abgleich hält test87 — sie ist nicht ' +
            'von aussen aufrufbar.)');

/* ========================================================================= *
 * 3 · DAS EINGESPIELTE MUSS IN DER ABLAGE LANDEN
 * ---------------------------------------------------------------------------
 * Der Kern dieses Laufs. Nicht „steht es im Zwischenspeicher" ist die Frage,
 * sondern „steht es in der Ablage" — denn neunhundert Millisekunden später
 * lädt die Seite neu und liest genau von dort.
 *
 * Geprüft wird deshalb an der Ablage vorbei am Zwischenspeicher: direkt aus
 * IndexedDB gelesen, nicht aus `Store.cache`.
 * ========================================================================= */
console.log('\n3 · Nach dem Einspielen steht es in der Ablage, nicht nur im Speicher');

const ablage = await seite.evaluate(async () => {
  /* Eine Sicherung mit genau einer fremden Seite darin. */
  const fremd = {
    version: 1, exportiert: new Date().toISOString(),
    enthaelt: ['blocks', 'collections', 'views', 'meta', 'versions'],
    fehlt: [], hinweis: '',
    blocks: { 'zzz-fremd': { id: 'zzz-fremd', type: 'page', text: 'Aus der Sicherung',
                             content: [], parentId: null, parentTable: 'block',
                             color: '', created: Store.now(), edited: Store.now(),
                             erstelltVon: 'Ich', alive: true } },
    collections: {}, views: {}, meta: {}, versions: []
  };

  await Krypto.sicherungEinspielen(JSON.stringify(fremd), 'ersetzen');

  /* An `Store.cache` vorbei — direkt nachsehen, was wirklich geschrieben ist.
     Der Name kommt aus KONSTANTEN und nicht aus dem Gedächtnis: eine
     geratene Kennung legt eine leere zweite Ablage an, und die ist dann
     natürlich leer — ein Befund, der wie ein Fehler aussieht und keiner ist. */
  const ausDerAblage = await new Promise<any[]>((fertig) => {
    const a = indexedDB.open(KONSTANTEN.ABLAGE_NAME);
    a.onsuccess = () => {
      const db = a.result;
      const t = db.transaction(['blocks'], 'readonly');
      const r = t.objectStore('blocks').getAll();
      r.onsuccess = () => { fertig(r.result || []); db.close(); };
      r.onerror = () => { fertig([]); db.close(); };
    };
    a.onerror = () => fertig([]);
  });

  return {
    inDerAblage: ausDerAblage.some((b: any) => b && b.id === 'zzz-fremd'),
    alteNochDa: ausDerAblage.some((b: any) => b && b.text === 'Reisenotizen' && b.alive)
  };
});

p('Die eingespielte Seite steht in der Ablage', ablage.inDerAblage,
  'nur im Zwischenspeicher — nach dem Neuladen wäre sie weg');
p('„ersetzen" hat den alten Bestand wirklich ersetzt', !ablage.alteNochDa,
  'die alte Seite ist noch da — das war ein Zusammenführen, kein Ersetzen');

/* ========================================================================= *
 * 4 · DIE GEGENRICHTUNG: „DAZULEGEN" DARF NICHTS LÖSCHEN
 * ========================================================================= */
console.log('\n4 · Dazulegen löscht nichts');

const dazu = await seite.evaluate(async () => {
  const eigen = Store.addBlock(null, 'page', { text: 'Meine eigene Seite' });
  const sicherung = {
    version: 1, exportiert: new Date().toISOString(),
    enthaelt: ['blocks'], fehlt: [], hinweis: '',
    blocks: { 'yyy-dazu': { id: 'yyy-dazu', type: 'page', text: 'Dazugelegte Seite',
                            content: [], parentId: null, parentTable: 'block',
                            color: '', created: Store.now(), edited: Store.now(),
                            erstelltVon: 'Ich', alive: true } },
    collections: {}, views: {}, meta: {}, versions: []
  };
  await Krypto.sicherungEinspielen(JSON.stringify(sicherung), 'zusammenfuehren');
  return {
    eigeneNochDa: !!Store.getBlock(eigen.id) && Store.getBlock(eigen.id).alive,
    neueDa: !!Store.getBlock('yyy-dazu')
  };
});
p('Die eigene Seite überlebt das Dazulegen', dazu.eigeneNochDa);
p('Die Seite aus der Sicherung ist da', dazu.neueDa);

/* ========================================================================= *
 * 5 · OHNE ANGABE GESCHIEHT NICHTS
 * ---------------------------------------------------------------------------
 * Dieselbe Regel wie im Hauptweg: nichts löschen ohne Rückfrage. Eine
 * Vorgabe würde irgendwann durchrutschen, und beim Einspielen einer
 * Sicherung ist „irgendwann" einmal zu viel.
 * ========================================================================= */
console.log('\n5 · Ohne Angabe wird nichts getan');

const ohne = await seite.evaluate(async () => {
  const s = { version: 1, blocks: {}, collections: {}, views: {}, meta: {} };
  const versuche = [];
  /* Die zweite Sicht auf dieselbe Funktion: aus dem noch nicht umgezogenen
     JavaScript der App heraus ist jede Angabe möglich, und genau diese Aufrufe
     sind hier der Prüfgegenstand. TypeScript allein hielte sie für unmöglich. */
  const mitBeliebigerArt = Krypto.sicherungEinspielen as
    (text: string, art?: string) => Promise<unknown>;
  for (const art of [undefined, '', 'irgendwas']) {
    try { await mitBeliebigerArt(JSON.stringify(s), art); versuche.push(null); }
    catch (e: unknown) { versuche.push((e instanceof Error ? e.message : String(e))); }
  }
  return versuche;
});
p('Ohne Angabe wird abgelehnt', ohne[0] !== null, String(ohne[0]));
p('Eine leere Angabe wird abgelehnt', ohne[1] !== null, String(ohne[1]));
p('Eine unbekannte Angabe wird abgelehnt', ohne[2] !== null, String(ohne[2]));

/* ========================================================================= */
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n  Suite 69 — Verschlüsselte Sicherung: ${ok} ok, ${weg} offen`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
