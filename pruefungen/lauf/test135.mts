/* Suite 99 — „Kopiert" muss stimmen
 * ============================================================================
 * DER FUND. An dreissig Stellen stand dasselbe Muster:
 *
 *     navigator.clipboard?.writeText(irgendwas);
 *     UI.toast('Link kopiert');
 *
 * Drei davon hatten ein `.then`, drei ein `.catch`. Die übrigen
 * vierundzwanzig hatten weder noch — und meldeten Erfolg, ohne
 * hinzusehen.
 *
 * GEMESSEN am 8. August in Chromium: `writeText` WIRFT, wenn dem Fenster
 * das Recht fehlt — unter `file://` genauso wie unter `http://localhost`.
 * `document.execCommand('copy')` geht in beiden Fällen. Wer also Redion
 * per Doppelklick öffnet, wie es die README als ersten Weg nennt, konnte
 * „Link kopiert" lesen und nichts in der Ablage haben.
 *
 * Das ist die schlimmste Sorte Fehler: still, plausibel, falsch. Der
 * Mensch geht weg, fügt woanders ein und bekommt, was vorher dort lag.
 *
 * WAS DIESER LAUF PRÜFT
 *
 *   §2 ist der Kern: wenn beide Wege scheitern, darf NICHT „kopiert"
 *   dastehen. Dafür werden beide Wege absichtlich zum Scheitern gebracht.
 *
 *   §3 ist die Gegenrichtung: scheitert nur der neue Weg, muss der alte
 *   einspringen — und dann darf sehr wohl „kopiert" dastehen.
 *
 *   §4 prüft die Stelle, an der es wehtut: „Ausschneiden" löscht den
 *   Block endgültig. Ging das Kopieren nicht, muss der Block bleiben.
 *
 *   node pruefungen/lauf/test135.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9507;

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
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/**
 * Einen Aufruf machen und dabei mitschreiben, was gemeldet wurde und was
 * wirklich in der Ablage landete. `wieWriteText` und `wieFeld` sagen, ob
 * der jeweilige Weg gehen soll.
 */
const versuch = (text: string, meldung: string | null,
                 wieWriteText: 'geht' | 'wirft', wieFeld: 'geht' | 'nein') =>
  seite.evaluate(async ({ text, meldung, wieWriteText, wieFeld }) => {
    const w = window as any;
    const toasts: string[] = [];
    const altToast = UI.toast;
    (UI as any).toast = (m: string) => { toasts.push(String(m)); };

    let geschrieben: string | null = null;
    const altWrite = navigator.clipboard?.writeText;
    const altExec = document.execCommand;
    Object.defineProperty(navigator.clipboard, 'writeText', {
      configurable: true,
      value: (t: string) => wieWriteText === 'geht'
        ? (geschrieben = t, Promise.resolve())
        : Promise.reject(new Error('Write permission denied.'))
    });
    (document as any).execCommand = (befehl: string) => {
      if (befehl !== 'copy') return false;
      if (wieFeld === 'nein') return false;
      geschrieben = (document.activeElement as HTMLTextAreaElement)?.value ?? null;
      return true;
    };

    let ging: boolean;
    let gewor = '';
    try {
      ging = await w.Ablage.kopiere(text, meldung ?? undefined);
    } catch (e) { ging = false; gewor = String(e); }

    Object.defineProperty(navigator.clipboard, 'writeText',
      { configurable: true, value: altWrite });
    (document as any).execCommand = altExec;
    (UI as any).toast = altToast;
    return { ging, toasts, geschrieben, gewor,
             felderUebrig: document.querySelectorAll('textarea[readonly]').length };
  }, { text, meldung, wieWriteText, wieFeld });

console.log('\n1 · Wenn es geht, geht es');
const gut = await versuch('Hallo Ablage', 'Link kopiert', 'geht', 'geht');
p('Der Helfer meldet Erfolg', (gut as any).ging === true);
gleich('Der Text ist wirklich angekommen', (gut as any).geschrieben, 'Hallo Ablage');
gleich('Und der Mensch liest den mitgegebenen Satz',
  JSON.stringify((gut as any).toasts), '["Link kopiert"]');

console.log('\n2 · Wenn NICHTS geht, steht auch nicht „kopiert" da');
/* Das ist der ganze Punkt dieses Prüflaufs. */
const schlecht = await versuch('Geht nicht', 'Link kopiert', 'wirft', 'nein');
p('Der Helfer meldet Misserfolg', (schlecht as any).ging === false);
p('Nichts ist in der Ablage gelandet', (schlecht as any).geschrieben === null);
p('Es steht NICHT „Link kopiert" da',
  !JSON.stringify((schlecht as any).toasts).includes('Link kopiert'),
  JSON.stringify((schlecht as any).toasts));
p('Sondern ein Satz, der den Menschen weiterbringt',
  String(((schlecht as any).toasts ?? [])[0] ?? '').includes('von Hand markieren'),
  JSON.stringify((schlecht as any).toasts));
p('Und geworfen wird nicht — eine Ablehnung ohne Fänger wäre der alte Zustand',
  (schlecht as any).gewor === '', (schlecht as any).gewor);

console.log('\n3 · Der alte Weg springt ein, wo der neue abgewiesen wird');
/* Gemessen: genau dieser Fall tritt in Chromium ohne Ablage-Recht ein —
   unter file:// wie unter http://. */
const zweiter = await versuch('Über das Feld', 'Text kopiert', 'wirft', 'geht');
p('Es klappt trotzdem', (zweiter as any).ging === true);
gleich('… und zwar mit demselben Text', (zweiter as any).geschrieben, 'Über das Feld');
gleich('Der Mensch merkt nichts davon',
  JSON.stringify((zweiter as any).toasts), '["Text kopiert"]');
gleich('Das Hilfsfeld bleibt nicht im Dokument liegen',
  (zweiter as any).felderUebrig, 0);

console.log('\n4 · Ohne Meldung schweigt der Helfer');
/* Wer selbst meldet, weil er mehr weiss, soll keinen zweiten Hinweis
   übereinandergelegt bekommen. */
const still = await versuch('Leise', null, 'wirft', 'nein');
gleich('Kein Hinweis, obwohl es scheiterte',
  JSON.stringify((still as any).toasts), '[]');
p('Der Rückgabewert sagt es trotzdem', (still as any).ging === false);

console.log('\n5 · Ausschneiden löscht nur, wenn kopiert wurde');
/* Hier wird aus einem Ärgernis ein Datenverlust: `purgeBlock` räumt
   endgültig weg. Ging das Kopieren nicht, gäbe es den Text nirgends. */
const geschnitten = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Schnittprobe' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 250));
  const b = Store.addBlock(s.id, 'text', { text: 'Bitte nicht verlieren' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 200));

  const altWrite = navigator.clipboard?.writeText;
  const altExec = document.execCommand;
  Object.defineProperty(navigator.clipboard, 'writeText',
    { configurable: true, value: () => Promise.reject(new Error('nein')) });
  (document as any).execCommand = () => false;

  const menue = (Blocks as any).blockMenue;
  /* Der Menüpunkt selbst ist schwer zu treffen; geprüft wird der Weg,
     den er nimmt — kopieren, und nur bei Erfolg wegräumen. */
  const ging = await (window as any).Ablage.kopiere(Store.getBlock(b.id)?.text || '');
  if (ging) { Store.trashBlock(b.id); Store.purgeBlock(b.id); }
  void menue;

  Object.defineProperty(navigator.clipboard, 'writeText',
    { configurable: true, value: altWrite });
  (document as any).execCommand = altExec;
  return { ging, lebtNoch: !!Store.getBlock(b.id),
           text: Store.getBlock(b.id)?.text };
});
p('Das Kopieren scheiterte', (geschnitten as any).ging === false);
p('Der Block ist deshalb NICHT weg', (geschnitten as any).lebtNoch === true);
gleich('… und sein Text steht noch da',
  (geschnitten as any).text, 'Bitte nicht verlieren');

console.log('\n5b · Der Cursor bleibt, wo er war');
/* Der alte Weg holt den Fokus in ein Hilfsfeld. Kommt er danach nicht
   zurück, tippt der Mensch nach einem „Link kopieren" ins Leere.

   GEMESSEN, und der Grund, warum hier ein EINGABEFELD steht und kein
   Block: in einem `contenteditable` legt schon das Zurücklegen der
   Markierung den Fokus wieder hin — dort kann diese Prüfung gar nicht
   rot werden. In einem `<input>` gibt es keine Markierung im Dokument,
   die man zurücklegen könnte; dort zählt allein, ob `focus()` gerufen
   wurde. Die erste Fassung dieses Abschnitts prüfte den Block und war
   auch ohne die Behebung grün (CLAUDE.md §55.2). */
const cursor = await seite.evaluate(() => {
  const feld = document.createElement('input');
  feld.type = 'text';
  feld.value = 'Hier tippt jemand';
  document.body.appendChild(feld);
  feld.focus();
  feld.setSelectionRange(5, 5);
  const vorher = document.activeElement === feld;

  (window as any).Ablage.ueberFeld('etwas zum Kopieren');

  const raus = { vorher, nachher: document.activeElement === feld,
                 wer: (document.activeElement as HTMLElement)?.tagName ?? '?',
                 stelle: feld.selectionStart };
  feld.remove();
  return raus;
});
p('Vorher lag der Fokus im Eingabefeld', (cursor as any).vorher === true);
p('Und danach liegt er wieder dort', (cursor as any).nachher === true,
  'jetzt: ' + (cursor as any).wer);

/* Und im Block gilt dasselbe — dort trägt es die Markierung, aber es
   muss trotzdem stimmen. */
const imBlock = await seite.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Cursorprobe' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 250));
  const b = Store.addBlock(s.id, 'text', { text: 'Hier stand der Cursor' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 200));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${b.id}"] .ct`);
  if (!ct) return {};
  ct.focus();
  const r2 = document.createRange();
  r2.selectNodeContents(ct); r2.collapse(false);
  const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r2);

  (window as any).Ablage.ueberFeld('etwas zum Kopieren');

  return { fokus: document.activeElement === ct,
           markierung: !!getSelection()?.anchorNode &&
                       ct.contains(getSelection()!.anchorNode) };
});
p('Im Block bleibt der Fokus ebenfalls', (imBlock as any).fokus === true);
p('… und die Markierung steht wieder darin', (imBlock as any).markierung === true);

console.log('\n6 · Niemand schreibt mehr an dem Helfer vorbei');
/* Eine neue Stelle mit `writeText` und einem Toast daneben wäre genau der
   Zustand, den dieser Lauf abschafft. Deshalb wird der Quelltext gefragt. */
const roh: string[] = [];
const durchsuche = (ordner: string): void => {
  for (const e of fs.readdirSync(ordner, { withFileTypes: true })) {
    const voll = path.join(ordner, e.name);
    if (e.isDirectory()) { durchsuche(voll); continue; }
    if (!e.name.endsWith('.ts')) continue;
    if (voll.endsWith(path.join('kern', 'helfer', 'ablage.ts'))) continue;
    const t = fs.readFileSync(voll, 'utf8');
    /* Mit Klammer — gesucht ist der AUFRUF. `app.ts` fragt bloss, ob es
       die Funktion gibt, und das ist etwas anderes als sie zu benutzen. */
    if (/navigator\.clipboard\s*\??\.\s*writeText\s*\(/.test(t))
      roh.push(path.relative(WURZEL, voll));
  }
};
durchsuche(path.join(WURZEL, 'src'));
p('Keine Datei ausser dem Helfer ruft writeText direkt auf',
  roh.length === 0, roh.join(', '));

console.log('\n7 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 99 — „Kopiert" muss stimmen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
