/* Suite 158 — Jede Blockart muss etwas hergeben (E119)
 * ============================================================================
 * E118 hat einen Fehler behoben: `/blatt` legte Papier an, in das man nicht
 * schreiben konnte. Die Blockart stand im Register, war also über das
 * Slash-Menü erreichbar — aber `umwandeln` stellt keinen Anfangszustand her,
 * und `Blatt.zeichne` zeichnete nur vorhandene Kinder. Ergebnis: ein
 * rechteckiges Nichts.
 *
 * `spalte` löst dasselbe seit E102 selbst, `blatt` löste es nicht, und
 * NIEMAND HÄTTE ES GEMERKT — es gibt keine Stelle, die sagt, was eine
 * Blockart zum Leben braucht (L41).
 *
 * Diese Suite ist diese Stelle. Sie legt JEDE über das Slash-Menü
 * erreichbare Blockart an und fragt für jede dasselbe:
 *
 *     Kann ein Mensch damit etwas anfangen?
 *
 * Das ist erfüllt, wenn im Block — ohne seinen Griff, den jeder Block hat —
 * mindestens eines steht: ein beschreibbares Feld, ein Eingabefeld, ein
 * Knopf, ein Bild/eine Zeichenfläche/eine Linie, oder sichtbarer Text.
 * Sonst sieht der Mensch ein leeres Rechteck.
 *
 * DER SINN IST NICHT, DIE HEUTIGEN 65 ZU PRÜFEN — sie sind alle in Ordnung,
 * seit E118. Der Sinn ist die 66., die jemand einträgt, ohne alle Wege zu
 * ihr abzugehen.
 *
 *   node pruefungen/lauf/test192.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8946;

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
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.setViewportSize({ width: 1300, height: 900 });
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

/* ==========================================================================
 * §1 · Wie viele es überhaupt sind
 * ========================================================================*/
console.log('\n1 · Wie viele es überhaupt sind');

const arten: string[] = await seite.evaluate(() =>
  Register.bloecke.alle()
    .filter((x: any) => x.cmd && !x.aktion)
    .map((x: any) => x.id));

p('Das Register nennt Blockarten mit Slash-Befehl', arten.length >= 40,
  String(arten.length));
p('Darunter das A4-Blatt, an dem es auffiel', arten.includes('blatt'));
p('Und die Spalte, die es richtig macht', arten.includes('columns'));

/* ==========================================================================
 * §2 · Und jede einzelne gibt etwas her
 * --------------------------------------------------------------------------
 * `page` ist die eine begründete Ausnahme: sie legt eine UNTERSEITE an und
 * springt hinein. Auf der Elternseite steht danach ein anklickbarer Verweis
 * — nachgesehen, nicht angenommen (§2b).
 * ========================================================================*/
console.log('\n2 · Und jede einzelne gibt etwas her');

const tot: string[] = [];
const behaelter: string[] = [];
const verschlossen: string[] = [];
const bericht: Record<string, string> = {};

for (const art of arten) {
  if (art === 'page') continue;          /* siehe §2b */
  const r = await seite.evaluate(async (typ: string) => {
    const s = Store.addPage(null, { text: 'Probe ' + typ });
    App.oeffne(s.id);
    await new Promise(r => setTimeout(r, 200));
    const erste = Store.childrenOf(s.id)[0];
    if (!erste) return { grund: 'keine Startzeile' };
    try { Blocks.umwandeln(erste.id, typ); }
    catch (e) { return { grund: 'wirft: ' + String(e).slice(0, 70) }; }
    await new Promise(r => setTimeout(r, 300));

    const bloecke = Store.childrenOf(s.id);
    const b = bloecke.find((x: any) => x.type === typ) || bloecke[0];
    if (!b) return { grund: 'kein Block entstanden' };
    const kasten = document.querySelector(`.blk[data-bid="${b.id}"]`) as HTMLElement | null;
    if (!kasten) return { grund: 'kein Kasten im Bild' };

    /* Der GRIFF zählt nicht — den hat jeder Block. Gezählt wird, was dieser
       Blockart gehört. Ohne diesen Abzug wäre jede Blockart „in Ordnung",
       weil der Griff zwei Knöpfe mitbringt (gemessen). */
    const inhalt = kasten.cloneNode(true) as HTMLElement;
    inhalt.querySelectorAll('.handles').forEach(x => x.remove());
    const zahl = {
      schreibbar: inhalt.querySelectorAll('[contenteditable]').length,
      felder: inhalt.querySelectorAll('input, textarea, select').length,
      knoepfe: inhalt.querySelectorAll('button').length,
      bild: inhalt.querySelectorAll('img, svg, canvas, iframe, hr').length,
      text: (inhalt.textContent || '').replace(/\s+/g, ' ').trim(),
    };
    const brauchbar = zahl.schreibbar + zahl.felder + zahl.knoepfe + zahl.bild > 0
      || zahl.text.length > 0;

    /* UND DIE SCHÄRFERE FRAGE (E119).
       „Nicht leer" ist zu wenig. Das kaputte Blatt aus E118 war NICHT leer —
       es hatte zwölf Knöpfe und eine Zeichenfläche. Es hatte nur nichts, in
       das man SCHREIBEN konnte, und genau darum ging es.
       Also: hält diese Blockart überhaupt Kinderblöcke? Das wird nicht
       geraten, sondern ausprobiert — ein Textblock hineingelegt und
       nachgesehen, ob er im Kasten erscheint. Wenn ja, MUSS die Blockart
       auch leer eine Stelle zum Hineinschreiben bieten; sonst kommt man in
       den Behälter nie hinein. */
    const vorher = zahl.schreibbar;
    Store.addBlock(b.id, 'text', { text: 'HINEINGELEGT' });
    App.zeichneSeite();
    await new Promise(r => setTimeout(r, 300));
    const kasten2 = document.querySelector(`.blk[data-bid="${b.id}"]`) as HTMLElement | null;
    const haeltKinder = !!kasten2 && (kasten2.textContent || '').includes('HINEINGELEGT');

    return { brauchbar, zahl, echterTyp: b.type, haeltKinder, schreibbarLeer: vorher };
  }, art);

  const kurz = (r as any).grund
    ? (r as any).grund
    : `edit ${(r as any).zahl.schreibbar} · feld ${(r as any).zahl.felder} · ` +
      `knopf ${(r as any).zahl.knoepfe} · bild ${(r as any).zahl.bild} · ` +
      `${(r as any).haeltKinder ? 'Behälter · ' : ''}` +
      `„${((r as any).zahl.text || '').slice(0, 26)}"`;
  bericht[art] = kurz;
  if (!(r as any).brauchbar) tot.push(art + ' (' + kurz + ')');
  if ((r as any).haeltKinder) {
    behaelter.push(art);
    if (!(r as any).schreibbarLeer) verschlossen.push(art + ' (' + kurz + ')');
  }
}

gleich('Keine einzige Blockart ist ein leeres Rechteck', tot.length, 0);
if (tot.length) for (const t of tot) console.log('      → ' + t);
p('Und alle wurden wirklich geprüft', Object.keys(bericht).length === arten.length - 1,
  Object.keys(bericht).length + ' von ' + (arten.length - 1));

/* ==========================================================================
 * §2a · Und was Kinder hält, muss auch aufnehmen können
 * --------------------------------------------------------------------------
 * Das ist die Frage, die E118 gefunden hätte. „Nicht leer" hätte es nicht:
 * das kaputte Blatt hatte zwölf Knöpfe und eine Zeichenfläche.
 * ========================================================================*/
console.log('\n2a · Und was Kinder hält, muss auch aufnehmen können');

p('Es gibt Blockarten, die andere Blöcke aufnehmen', behaelter.length >= 3,
  behaelter.join(', '));
gleich('Und jede von ihnen bietet leer eine Stelle zum Schreiben',
  verschlossen.length, 0);
if (verschlossen.length) for (const v of verschlossen) console.log('      → ' + v);

/* Drei Stichproben im Klartext — damit im Prüfbericht steht, WAS gemessen
   wurde, und nicht nur, dass es gut war. */
p('Das Blatt hat ein beschreibbares Feld (E118)',
  /edit [1-9]/.test(bericht['blatt'] || ''), bericht['blatt']);
p('Die Trennlinie zeichnet wirklich eine Linie',
  /bild [1-9]/.test(bericht['divider'] || ''), bericht['divider']);
p('Das Bild bietet einen Weg, eines auszuwählen',
  /feld [1-9]/.test(bericht['image'] || ''), bericht['image']);

/* ==========================================================================
 * §2b · Die eine Ausnahme, und warum sie eine ist
 * ========================================================================*/
console.log('\n2b · Die eine Ausnahme, und warum sie eine ist');

const unterseite = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Elternseite' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  const erste = Store.childrenOf(s.id)[0];
  Blocks.umwandeln(erste.id, 'page');
  await new Promise(r => setTimeout(r, 600));
  const gesprungen = App.aktuelleSeite() !== s.id;

  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 600));
  const b = Store.childrenOf(s.id).find((x: any) => x.type === 'page');
  const kasten = b ? document.querySelector(`.blk[data-bid="${b.id}"]`) as HTMLElement | null : null;
  let geoeffnet = false;
  if (kasten) {
    (kasten.querySelector('[data-seite]') as HTMLElement)?.click();
    await new Promise(r => setTimeout(r, 500));
    geoeffnet = App.aktuelleSeite() === b!.id;
  }
  return { gesprungen, kastenDa: !!kasten,
           text: kasten ? (kasten.textContent || '').replace(/\s+/g, ' ').trim() : '',
           geoeffnet };
});

p('`/page` springt in die neue Unterseite', unterseite.gesprungen);
p('Auf der Elternseite steht danach ein Verweis', unterseite.kastenDa);
p('Er trägt ein Blattzeichen und einen Titel',
  /📄/.test(unterseite.text), unterseite.text);
p('Und ein Klick öffnet die Unterseite wirklich', unterseite.geoeffnet);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log('\n   (geprüfte Blockarten: ' + arten.length + ')');

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
