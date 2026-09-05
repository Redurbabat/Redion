/* Suite 326 — Der Nachlauf zur Bestandsaufnahme (L102 Punkt 3, 6 und 7, E333)
 * ============================================================================
 * Drei Funde vom 31. August, und sie brauchten drei verschiedene Antworten.
 *
 *   Punkt 3: „Der ganze Vektorweg ist toter Code. `findenMitVektoren` ist
 *            definiert und exportiert, und niemand ruft es auf."
 *            → VERDRAHTET, aber nicht naiv: die Funktion schickt für jede
 *              Frage eine Einbettung an eine kostenpflichtige API.
 *
 *   Punkt 6: „Das Fehlerzentrum zeigt ein Feld, das nie gefüllt wird."
 *            → Vier tote Feldnamen weg, und die Überschrift sagt jetzt,
 *              was die Zahl WIRKLICH ist.
 *
 *   Punkt 7: „Der normale KI-Chat hat GAR KEIN Limit."
 *            → WAR SCHON ZU. E287 kam nach der Bestandsaufnahme.
 *
 *   §1 DER VEKTORWEG WIRD GERUFEN — und nicht mehr nur exportiert.
 *   §2 OHNE VEKTOREN KOSTET ER NICHTS und sucht wie vorher.
 *   §3 `nurSeite` GILT AUCH DORT — sonst wäre das Verdrahten ein Leck.
 *   §4 DAS FEHLERZENTRUM zeigt die Note, nicht eine erfundene Antwort.
 *   §5 UND PUNKT 7 IST NACHGEMESSEN, nicht geglaubt.
 *
 *   node pruefungen/lauf/test326.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9524;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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

const browser = await chromium.launch();
const fehler: string[] = [];
const pc = await browser.newPage({ viewport: { width: 1280, height: 900 } });
pc.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await pc.goto(`http://localhost:${PORT}/index.html`);
await pc.waitForTimeout(2600);

const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/ki/kontext.ts'), 'utf-8');
const ohneKommentar = quelle.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* ------------------------------------------------------------------------ */
console.log('\n1 · Der Vektorweg wird gerufen');

/* DAS WAR DIE GANZE LÜCKE: definiert, exportiert, nie gerufen. */
const rufe = (ohneKommentar.match(/findenMitVektoren\(/g) || []).length;
p('`findenMitVektoren` wird im Erzeugnis aufgerufen', rufe >= 1, String(rufe));
p('Und zwar aus `bauenFuerFrage`',
  /const treffer = await findenMitVektoren\(/.test(ohneKommentar));
p('Das den Aufruf jetzt auch abwartet',
  /const bauenFuerFrage = async /.test(ohneKommentar));

const dienst = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/ki/dienst.ts'), 'utf-8');
p('Und der eine Aufrufer wartet ebenfalls',
  /await Kontext\.bauenFuerFrage\(/.test(dienst));

/* ------------------------------------------------------------------------ */
console.log('\n2 · Ohne Vektoren kostet er nichts');

const ohneVektoren = await pc.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const w = globalThis as any;

  const s = Store.addPage(null, { text: 'Elektrotechnik' });
  Store.addBlock(s.id, 'text', { text: 'Das Ohmsche Gesetz sagt U = R · I.' });
  await Store.flush();

  /* Kein `ki:vektoren` — der gewöhnliche Fall. Und die Kasse mitschreiben,
     damit sich beweisen lässt, dass NICHTS gebucht wurde. */
  Store.setMeta('ki:vektoren', {});
  const vorher = (w.KiBuch.buchungen ? w.KiBuch.buchungen() : []).length;

  const treffer = await w.Kontext.findenMitVektoren('Ohmsches Gesetz', 5);
  const nachher = (w.KiBuch.buchungen ? w.KiBuch.buchungen() : []).length;

  const k = await w.Kontext.bauenFuerFrage('Ohmsches Gesetz', { anzahl: 5 });
  return { treffer: treffer.length, vorher, nachher,
           kontextHatText: /Ohmsche/.test(String(k?.text || k || '')),
           kontextQuellen: (k && k.quellen ? k.quellen.length : 0) };
});

p('Es wird trotzdem etwas gefunden', ohneVektoren.treffer >= 1,
  String(ohneVektoren.treffer));
/* DER PUNKT: ohne Vektoren darf keine einzige Buchung entstehen. */
gleich('Und nichts gebucht', ohneVektoren.nachher, ohneVektoren.vorher);
p('Der Kontext für das Modell steht', ohneVektoren.kontextHatText ||
  ohneVektoren.kontextQuellen >= 1,
  ohneVektoren.kontextQuellen + ' Quellen');

/* ------------------------------------------------------------------------ */
console.log('\n3 · `nurSeite` gilt auch im Vektorweg');

/* OHNE DIESE ZEILE WÄRE DAS VERDRAHTEN EIN LECK GEWESEN: `bauenFuerFrage`
   reicht `nurSeite` durch, wenn der Aufrufer eine Seite meint. `finden`
   achtet es seit jeher; der Vektorweg tat es nicht, weil ihn niemand rief.

   NUR IM VEKTORWEG SUCHEN, und das ist keine Feinheit. Der erste Wurf
   prüfte die ganze Datei — und `finden` trägt DIESELBE Zeile (kontext.ts:433).
   Die Prüfung war damit grün, auch als die Zeile im Vektorweg
   herausgenommen wurde: sie fand sie jedes Mal beim Nachbarn. Belegt durch
   die Mutation, die nichts rot machte. */
const vektorTeil = quelle.slice(quelle.indexOf('const findenMitVektoren'),
                                quelle.indexOf('return { bauen, abgleichen'));
p('Der Ausschnitt ist wirklich der Vektorweg', vektorTeil.length > 400 &&
  !vektorTeil.includes('const finden = ('), String(vektorTeil.length));
p('Der Vektorweg nimmt `nurSeite` entgegen',
  /opt: \{ nurSeite\?: string \}/.test(vektorTeil));
p('Und wirft heraus, was nicht darunter liegt',
  /opt\.nurSeite && e\.seiteId !== opt\.nurSeite && !istUnter\(e\.seiteId, opt\.nurSeite\)/.test(vektorTeil));
p('Der Rückfall behält es ebenfalls',
  /finden\(frage, \{ anzahl, nurSeite: opt\.nurSeite \}\)/.test(vektorTeil));
p('Und `bauenFuerFrage` reicht es weiter',
  /findenMitVektoren\(frage, opt\.anzahl \|\| 6,\s*\n?\s*\{ nurSeite: opt\.nurSeite \}\)/.test(quelle));

/* ------------------------------------------------------------------------ */
console.log('\n4 · Das Fehlerzentrum zeigt die Note');

const lernwelt = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/lernwelt.ts'), 'utf-8');
const lwCode = lernwelt.replace(/\/\*[\s\S]*?\*\//g, ' ');

/* DIE VIER TOTEN NAMEN, EINZELN. Ein Sammelmuster wäre auch dann grün,
   wenn drei von vier stehen geblieben wären. */
for (const name of ['answer', 'antwort', 'input', 'eingabe'])
  p('`letzter?.' + name + '` steht nicht mehr im Code',
    !new RegExp('letzter\\?\\.' + name).test(lwCode));

p('Die Überschrift sagt „Selbstbewertung"',
  /Letzte Selbstbewertung/.test(lernwelt));
p('Und nicht mehr „Letzte falsche Antwort"',
  !/Letzte falsche Antwort/.test(lwCode));
p('Die Note kommt aus `bewertung()`, dem einzigen Feld das es gibt',
  /const n = bewertung\(letzter\);/.test(lernwelt));
/* GEGENPROBE ZUR BEHAUPTUNG SELBST: der Verlaufseintrag hat wirklich kein
   Antwortfeld. Wäre das falsch, wäre die ganze Änderung falsch. */
const wissenDienst = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/dienst.ts'), 'utf-8');
const eintrag = wissenDienst.slice(wissenDienst.indexOf('alt[reviewId] = {'),
                                   wissenDienst.indexOf('alt[reviewId] = {') + 700);
p('Der Verlaufseintrag trägt wirklich keine Antwort',
  !/\banswer:|\bantwort:|\binput:|\beingabe:/.test(eintrag), eintrag.slice(0, 160));
p('Aber sehr wohl eine Note', /rating: Number\(note\)/.test(eintrag));

/* ------------------------------------------------------------------------ */
console.log('\n5 · Punkt 7 ist nachgemessen, nicht geglaubt');

/* „Der normale KI-Chat hat GAR KEIN Limit" — das stimmte am 31. August und
   nicht mehr am 1. September. E287 kam dazwischen. Statt es zu glauben,
   steht hier die Messung. */
p('Die Kostenprüfung sitzt im einen Tor `frage`',
  /DIE KOSTENPRÜFUNG SITZT HIER, UND ZWAR NUR HIER/.test(dienst));
p('Sie prüft VOR dem Aufruf', /if \(!urteil\.erlaubt\) throw new Error\(urteil\.satz\)/.test(dienst));
p('Und bucht, was sie schätzt', /KiBuch\.buchen\(zustand\.modell/.test(dienst));
p('Die Berichtigung steht im `finally`',
  /\} finally \{[\s\S]{0,900}KiBuch\.berichtigen/.test(dienst));
/* Und der Embedding-Stapel fragt einmal, mit Betrag. */
p('Der Embedding-Stapel fragt vorher mit Betrag',
  /Vektoren für ' \+ offen\.length \+ ' Seite\(n\) bauen\?/.test(quelle));
p('Und bucht ihn auch', /KiBuch\.buchen\(modellName, 'embedding'/.test(quelle));

gleich('Keine JS-Fehler', fehler, []);

await browser.close();
await new Promise<void>(f => server.close(() => f()));

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
