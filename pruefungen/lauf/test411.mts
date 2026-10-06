/* Suite 411 — Sechs Schalter ohne Draht (E417)
 * ============================================================================
 * Gefunden beim vollen Lauf, statisch gemessen: 21 Schalter werden in der
 * Oberfläche ANGEBOTEN, sechs davon liest niemand. Der Nutzer kippt sie, sie
 * kippen zurück oder bleiben stehen — und nichts geschieht.
 *
 *   titelZeigen      „Titel der Datenquelle anzeigen"    Datenbank-Layout
 *   seitenIcon       „Seiten-Icon anzeigen"              Datenbank-Layout
 *   linien           „Vertikale Linien anzeigen"         Datenbank-Layout
 *   umbruchAlle      „Zeilenumbruch für alle Inhalte"    Datenbank-Layout
 *   erinnernInApp    „Erinnerungen in der App"           Einstellungen
 *   autoVersionen    „Fassungen automatisch merken"      Einstellungen
 *
 * Zwei davon sind schlimmer als tot: `titelZeigen` und `seitenIcon` konnten
 * gar nichts ausschalten, weil es das, was sie zeigen sollten, NIE GAB. Kein
 * Titel im Kopf der Datenbank, kein Seiten-Icon in der Titelspalte. Der
 * Schalter war die einzige Spur einer Funktion, die nie gebaut wurde.
 *
 *   §1 Der Titel der Datenquelle steht da — und geht weg, wenn man will.
 *   §2 Das Seiten-Icon steht in der Zeile — und geht weg, wenn man will.
 *   §3 Die vertikalen Linien sind da — und gehen weg, wenn man will.
 *   §4 Der Zeilenumbruch ist aus und lässt sich einschalten.
 *   §5 `erinnernInApp` aus heisst: kein Streifen.
 *   §6 `autoVersionen` aus heisst: keine automatische Fassung.
 *   §7 Das Verzeichnis der Schalter ohne Leser darf nur schrumpfen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Jeder Punkt hat zwei Hälften: „ist da" und „geht weg". Ein Schalter, den
 * niemand liest, macht die ZWEITE Hälfte rot — genau das war der Befund.
 * Ein Schalter, dessen Anzeige es nicht gibt, macht die ERSTE rot.
 * Gegenprobe je Punkt im Bericht zu E417; alle sind gelaufen.
 *
 * §7 ist der Wächter für die Zukunft, und er ist mit Absicht ein VERZEICHNIS
 * und kein Muster. Dieselbe Messung meldete zwölf Schalter ohne Leser, und
 * SECHS davon waren Fehlalarm: die fünf `q:*` werden über einen berechneten
 * Namen gelesen (`Kontext.quellen()[k.slice(2)]`), `sicherungErinnern` über
 * `meta('sicherungErinnern')`. Ein Wächter, der nach dem Namen sucht, findet
 * beides nicht — derselbe Fehler wie `test294` bei `formel` (E412). Deshalb
 * steht jede Ausnahme im Verzeichnis beim Namen, mit dem Grund daneben.
 *
 *   node pruefungen/lauf/test411.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9533;

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

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
s.on('dialog', d => d.accept().catch(() => {}));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(400);

/* Eine kleine Datenbank mit ZWEI Zeilen, von denen eine ein Icon hat.
   Die grosse Vorlage aus bilder.mts wäre hier Ballast: geprüft werden vier
   Schalter, nicht dreizehn Spaltentypen. */
const ids = await s.evaluate(`(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  const seite = Store.addPage(null, { text: 'Schalterprobe', icon: '🔌' });
  const { block, collectionId } = Store.addDatabase(seite.id, 'Mein Katalog', {
    titel: { name: 'Sache', type: 'title' },
    text:  { name: 'Notiz', type: 'text' }
  }, 'table');
  const coll = Store.getCollection(collectionId);
  const langerText = 'Ein Satz, der in eine schmale Spalte nicht passt und ' +
                     'deshalb entweder umbricht oder abgeschnitten wird.';
  const a = Store.addBlock(collectionId, 'page', { text: 'Mit Zeichen', parentTable: 'collection' });
  Store.updateBlock(a.id, { icon: '🧲', props: { text: langerText } });
  const b = Store.addBlock(collectionId, 'page', { text: 'Ohne Zeichen', parentTable: 'collection' });
  Store.updateBlock(b.id, { props: { text: langerText } });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(f => setTimeout(f, 900));
  return { seite: seite.id, coll: collectionId, view: coll.viewIds[0], block: block.id };
})()`) as any;

/** Einen Ansichts-Schalter umlegen und neu zeichnen — ohne das Panel zu
    öffnen. Geprüft wird die WIRKUNG, nicht der Klickweg; den hält test294. */
const stelle = async (feld: string, wert: boolean) => {
  await s.evaluate(`(async () => {
    Store.updateView(${JSON.stringify(ids.view)}, { ${feld}: ${wert} });
    App.zeichneSeite();
    await new Promise(f => setTimeout(f, 500));
  })()`);
};

/* ==========================================================================
 * §1 · DER TITEL DER DATENQUELLE
 * ------------------------------------------------------------------------
 * Es gab ihn nicht. Der Kopf der Datenbank trug Reiter und Werkzeuge, sonst
 * nichts — und darüber einen Schalter „Titel der Datenquelle anzeigen".
 * ========================================================================*/
console.log('\n§1 Der Titel der Datenquelle');
const titel1 = await s.evaluate(
  `(document.querySelector('.db-titel') || {}).textContent || ''`) as string;
p('Der Titel steht im Kopf der Datenbank', /Mein Katalog/.test(titel1), JSON.stringify(titel1));
await stelle('titelZeigen', false);
const titel2 = await s.evaluate(`!!document.querySelector('.db-titel')`) as boolean;
p('Ausgeschaltet ist er weg', titel2 === false, String(titel2));
await stelle('titelZeigen', true);
p('Und wieder eingeschaltet ist er zurück',
  await s.evaluate(`!!document.querySelector('.db-titel')`), '');

/* ==========================================================================
 * §2 · DAS SEITEN-ICON IN DER ZEILE
 * ========================================================================*/
console.log('\n§2 Das Seiten-Icon in der Zeile');
const icon1 = await s.evaluate(
  `[...document.querySelectorAll('td.tt .tt-icon')].map(e => e.textContent.trim())`) as string[];
p('Die Zeile mit Zeichen zeigt es', icon1.includes('🧲'), JSON.stringify(icon1));
/* Und die Zeile OHNE Zeichen bekommt keins angedichtet — sonst wäre der
   Schalter nur ein Platzhalter-Erzeuger. */
p('Die Zeile ohne Zeichen bleibt ohne', icon1.length === 1, JSON.stringify(icon1));
await stelle('seitenIcon', false);
const icon2 = await s.evaluate(`document.querySelectorAll('td.tt .tt-icon').length`) as number;
p('Ausgeschaltet ist es weg', icon2 === 0, String(icon2));
await stelle('seitenIcon', true);

/* ==========================================================================
 * §3 · DIE VERTIKALEN LINIEN
 * ------------------------------------------------------------------------
 * Gemessen wird der gerechnete Rand einer Zelle, nicht eine Klasse. Eine
 * Klasse, zu der es keine Regel gibt, ist genau der Fehler aus E410.
 * ========================================================================*/
console.log('\n§3 Die vertikalen Linien');
/* Gemessen wird die FARBE, nicht die Breite: die Striche werden durchsichtig
   gestellt und nicht entfernt, damit die Spalten beim Umschalten nicht um
   1 px springen. Die Breite bliebe also in beiden Fällen 1px — eine Prüfung
   darauf könnte nie rot werden (§55.2). */
const rand = () => s.evaluate(
  `(() => { const td = document.querySelector('table.grid tbody td:not(:last-child)');
            if (!td) return { fehlt: true };
            const st = getComputedStyle(td);
            return { breite: st.borderRightWidth, farbe: st.borderRightColor,
                     zellen: td.getBoundingClientRect().width }; })()`) as Promise<any>;
const durchsichtig = (f: string) => /rgba\(.*,\s*0\)$/.test(String(f)) || f === 'transparent';
const rand1 = await rand();
p('Die Zellen haben einen sichtbaren rechten Strich',
  !durchsichtig(rand1.farbe) && /^[1-9]/.test(rand1.breite), JSON.stringify(rand1));
await stelle('linien', false);
const rand2 = await rand();
p('Ausgeschaltet ist er weg', durchsichtig(rand2.farbe), JSON.stringify(rand2));
/* UND DER PLATZ BLEIBT. Der Strich wird durchsichtig gestellt, nicht
   entfernt — sonst wäre jede Spalte 1 px schmaler und die Tabelle spränge
   beim Umschalten. Gemessen wird die BREITE des Randes und nicht die der
   Zelle: die Zelle hat `min-width:90px` und bliebe auch dann 90 px breit,
   wenn der Rand ganz verschwände. Eine Prüfung auf die Zellbreite wäre
   genau der Fehler, den §55.2 beschreibt — sie hat es in der Gegenprobe
   auch getan und blieb grün, während der Rand schon weg war. */
p('… und der Platz bleibt: durchsichtig, nicht entfernt',
  rand2.breite === rand1.breite && rand2.breite !== '0px',
  `${rand1.breite} -> ${rand2.breite}`);
await stelle('linien', true);
p('Und wieder eingeschaltet ist er zurück', !durchsichtig((await rand()).farbe), '');

/* ==========================================================================
 * §4 · DER ZEILENUMBRUCH FÜR ALLE INHALTE
 * ------------------------------------------------------------------------
 * Andersherum als die drei davor: die Vorgabe ist AUS. Eine Tabelle, in der
 * jede Zelle umbricht, ist keine Tabelle mehr — deshalb muss man es wollen.
 * ========================================================================*/
console.log('\n§4 Der Zeilenumbruch');
const umbruch = () => s.evaluate(
  `(() => { const td = [...document.querySelectorAll('table.grid tbody td')]
              .find(e => e.textContent.includes('schmale Spalte'));
            if (!td) return { fehlt: true };
            return { ws: getComputedStyle(td).whiteSpace,
                     hoehe: Math.round(td.getBoundingClientRect().height) }; })()`) as Promise<any>;
const u1 = await umbruch();
p('Ohne den Schalter bricht nichts um', u1.ws === 'nowrap', JSON.stringify(u1));
await stelle('umbruchAlle', true);
const u2 = await umbruch();
p('Eingeschaltet bricht es um', u2.ws !== 'nowrap', JSON.stringify(u2));
/* Der harte Beleg: die Zelle wird HÖHER. „white-space geändert" allein
   könnte auch heissen, dass die Spalte breit genug war. */
p('Und die Zeile wird dadurch wirklich höher',
  u2.hoehe > u1.hoehe + 4, `${u1.hoehe} px -> ${u2.hoehe} px`);
await stelle('umbruchAlle', false);

/* ==========================================================================
 * §5 · ERINNERUNGEN IN DER APP
 * ------------------------------------------------------------------------
 * Derselbe Fall wie der Karteikarten-Streifen aus E409, eine Stufe schlimmer:
 * dort war die VORGABE falsch, hier wirkte der Schalter überhaupt nicht.
 * ========================================================================*/
console.log('\n§5 Erinnerungen in der App');
const streifen = async (an: boolean) => await s.evaluate(`(async () => {
  Store.setMeta('erinnernInApp', ${an});
  /* EIN Balken, kein Element je Meldung: #toast bekommt .show und den Text
     gesetzt. Vor der Messung beides zurücksetzen, sonst zählt die vorige. */
  const bal = document.getElementById('toast');
  if (bal) { bal.classList.remove('show'); bal.textContent = ''; }
  const s2 = Store.addPage(null, { text: 'Zurückgestellt' });
  await Store.flush();
  /* Eine Seite, die vor einer Minute wieder hätte hochkommen sollen. */
  Store.setMeta('zurueckgestellt', [{ id: s2.id, grund: '',
    bis: new Date(Date.now() - 60000).toISOString(),
    seit: new Date(Date.now() - 120000).toISOString() }]);
  const wieviele = Plan.pruefen();
  await new Promise(f => setTimeout(f, 400));
  const b2 = document.getElementById('toast');
  return { streifen: b2 && b2.classList.contains('show') ? 1 : 0,
           text: (b2 && b2.textContent) || '', wieviele,
           meldungen: Werkzeuge.meldungen().length };
})()`) as any;
const strAus = await streifen(false);
p('Ausgeschaltet kommt kein Streifen', strAus.streifen === 0, JSON.stringify(strAus));
/* UND DIE SEITE KOMMT TROTZDEM ZURÜCK. Der Schalter heisst „Erinnerungen IN
   DER APP" und meint den Streifen, nicht das Zurückholen. Wer ihn ausmacht,
   will keinen Streifen — nicht seine Seiten verlieren (§51). */
p('… aber die Seite kommt trotzdem zurück', strAus.wieviele === 1, JSON.stringify(strAus));
/* UND SIE STEHT IM POSTEINGANG. Abbestellt ist die EINBLENDUNG, nicht die
   Nachricht — sonst wäre der Schalter ein Datenverlust auf Knopfdruck. */
p('… und die Meldung steht im Posteingang',
  strAus.meldungen > 0, JSON.stringify(strAus));
const strAn = await streifen(true);
p('Eingeschaltet kommt er', strAn.streifen > 0, JSON.stringify(strAn));
/* Und er sagt, worum es geht — ein Balken ohne Text wäre auch keiner. */
p('… und sagt, was zurückkam', /zurückgestellte Seite/.test(strAn.text), JSON.stringify(strAn.text));

/* ==========================================================================
 * §6 · FASSUNGEN AUTOMATISCH MERKEN
 * ------------------------------------------------------------------------
 * Der einzige der sechs, bei dem die kaputte Richtung die SICHERE war: es
 * wurde mehr gespeichert als bestellt, nicht weniger. Ein Schalter, der
 * lügt, bleibt trotzdem einer — und er kostet Platz, den der Nutzer
 * ausdrücklich nicht ausgeben wollte (§15).
 * ========================================================================*/
console.log('\n§6 Fassungen automatisch merken');
const fassungen = async (an: boolean) => await s.evaluate(`(async () => {
  Store.setMeta('autoVersionen', ${an});
  const s3 = Store.addPage(null, { text: 'Fassungsprobe ${'' + Math.random()}' });
  await Store.flush();
  const vorher = (await Store.versionen(s3.id)).length;
  await Werkzeuge.versionAutomatisch(s3.id);
  const nachher = (await Store.versionen(s3.id)).length;
  return { vorher, nachher };
})()`) as any;
const fAus = await fassungen(false);
p('Ausgeschaltet entsteht keine Fassung', fAus.nachher === fAus.vorher, JSON.stringify(fAus));
const fAn = await fassungen(true);
p('Eingeschaltet entsteht eine', fAn.nachher > fAn.vorher, JSON.stringify(fAn));
/* Von Hand gespeichert wird IMMER — der Schalter heisst „automatisch". */
const vHand = await s.evaluate(`(async () => {
  Store.setMeta('autoVersionen', false);
  const s4 = Store.addPage(null, { text: 'Von Hand' });
  await Store.flush();
  await Store.versionSpeichern(s4.id, 'von Hand');
  return (await Store.versionen(s4.id)).length;
})()`) as number;
p('Von Hand geht weiter, auch wenn der Schalter aus ist', vHand > 0, String(vHand));

/* ==========================================================================
 * §7 · DAS VERZEICHNIS DARF NUR SCHRUMPFEN
 * ========================================================================*/
console.log('\n§7 Das Verzeichnis der Schalter ohne Leser');
const bestand = JSON.parse(fs.readFileSync(
  path.join(WURZEL, 'pruefungen/schalter-bestand.json'), 'utf8'));

/* Dieselbe Messung, die den Befund gefunden hat — mit den Leseformen, die
   es wirklich gibt. Jede weitere Form gehört HIER dazu, nicht als Ausnahme
   ins Verzeichnis: eine Form, die der Wächter nicht kennt, meldet gesunde
   Schalter als tot, und dann wird er abgeschaltet. */
const dateien: string[] = [];
const sammeln = (d: string): void => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const voll = path.join(d, e.name);
    if (e.isDirectory()) sammeln(voll);
    else if (e.name.endsWith('.ts')) dateien.push(voll);
  }
};
sammeln(path.join(WURZEL, 'src'));
const quellen = new Map(dateien.map(f => [f, fs.readFileSync(f, 'utf8')]));

const angeboten = new Set<string>();
for (const t of quellen.values())
  for (const m of t.matchAll(/schalter\(\s*'([^']+)'/g)) angeboten.add(m[1] as string);

const flucht = (k: string) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wirdGelesen = (k: string): boolean => {
  const formen = [
    new RegExp(`\\bV\\(\\s*'${flucht(k)}'`),        // Einstellungen.V('k', …)
    new RegExp(`getMeta\\(\\s*'${flucht(k)}'`),      // Store.getMeta('k')
    new RegExp(`\\bmeta\\(\\s*'${flucht(k)}'`),      // meta('k', …) in ordnersicherung
    new RegExp(`\\.${flucht(k)}\\b`),                // view.k
    new RegExp(`\\['${flucht(k)}'\\]`)               // obj['k']
  ];
  /* DIE QUELLEN DER KI (E724). Ein Schalter `q:name` landet in
     `ki:quellen` und wird beim FRAGEN gelesen — `q.name` in kontext.ts,
     `Kontext.quellen().name` in dienst.ts. Diese Form fehlte; deshalb
     standen alle fünf als Ausnahme im Verzeichnis, mit dem Grund „gelesen
     im Klick-Handler". Der Klick-Handler KIPPT den Wert nur; ein Leser ist
     er nicht. So kam `q:verbindungen` durch, das niemand las. */
  if (k.startsWith('q:'))
    formen.push(new RegExp(`(?:\\bq|quellen\\(\\))\\.${flucht(k.slice(2))}\\b`));
  for (const t of quellen.values())
    for (const zeile of t.split('\n')) {
      if (zeile.includes(`schalter('${k}'`)) continue;   // die eigene Zeile zählt nicht
      if (formen.some(f => f.test(zeile))) return true;
    }
  return false;
};

const ohneLeser = [...angeboten].filter(k => !wirdGelesen(k)).sort();
const erlaubt: string[] = Object.keys(bestand.ausnahmen).sort();
p('Es gibt ein Verzeichnis', typeof bestand.ausnahmen === 'object', '');
p('Jede Ausnahme trägt einen geschriebenen Grund',
  erlaubt.every(k => typeof bestand.ausnahmen[k] === 'string' && bestand.ausnahmen[k].length > 20),
  JSON.stringify(bestand.ausnahmen));
p('Kein Schalter ohne Leser ausser den erklärten',
  JSON.stringify(ohneLeser) === JSON.stringify(erlaubt),
  `ist ${JSON.stringify(ohneLeser)}, erklärt ${JSON.stringify(erlaubt)}`);
/* Und der Wächter muss überhaupt etwas finden können — sonst prüft er nichts
   (§55.2). Einundzwanzig Schalter waren es beim Befund. */
p('Der Wächter sieht die Schalter wirklich', angeboten.size >= 20, String(angeboten.size));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
