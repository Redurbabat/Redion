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
const wirklich: Record<string, string> = {};
const volltext: Record<string, string> = {};

/* Der Weg zu einer Blockart ist nicht sie selbst (L41). Die meisten kommen
   durchs Slash-Menü — `weg: 'slash'`. Zwei kommen anders, und genau die
   fehlten bis E170. Sie stehen hier als eigene Aufträge, damit sie durch
   DIESELBE Messung gehen und nicht durch eine zweite, die altert. */
type Auftrag = { art: string; weg: 'slash' | 'spalte' | 'spalte-leer' | 'pdfseite' };
const wege: Auftrag[] = [
  ...arten.filter(a => a !== 'page').map(a => ({ art: a, weg: 'slash' as const })),
  { art: 'spalte',      weg: 'spalte' },
  { art: 'spalte-leer', weg: 'spalte-leer' },
  { art: 'pdfseite',    weg: 'pdfseite' },
];

for (const auftrag of wege) {
  const art = auftrag.art;
  const r = await seite.evaluate(async (auf: { art: string; weg: string }) => {
    const warte = (ms: number) => new Promise(r => setTimeout(r, ms));
    const s = Store.addPage(null, { text: 'Probe ' + auf.art });
    App.oeffne(s.id);
    await warte(200);
    const erste = Store.childrenOf(s.id)[0];
    if (!erste) return { grund: 'keine Startzeile' };

    let b: any = null;
    if (auf.weg === 'slash') {
      try { Blocks.umwandeln(erste.id, auf.art); }
      catch (e) { return { grund: 'wirft: ' + String(e).slice(0, 70) }; }
      await warte(300);
      const bloecke = Store.childrenOf(s.id);
      b = bloecke.find((x: any) => x.type === auf.art) || bloecke[0];
    }
    else if (auf.weg === 'spalte') {
      /* Eine Spalte legt niemand an — `columns` legt sie an (E102). Also
         den echten Weg gehen und das Kind nehmen, das dabei entsteht. */
      try { Blocks.umwandeln(erste.id, 'columns'); }
      catch (e) { return { grund: 'wirft: ' + String(e).slice(0, 70) }; }
      await warte(300);
      const rahmen = Store.childrenOf(s.id).find((x: any) => x.type === 'columns');
      b = rahmen ? Store.childrenOf(rahmen.id).find((x: any) => x.type === 'spalte') : null;
    }
    else if (auf.weg === 'spalte-leer') {
      /* UND DERSELBE BEHÄLTER OHNE INHALT.
         `columns` legt die Zeile darin gleich mit an — die leere Spalte
         entsteht also nicht beim Anlegen, sondern SPÄTER: aus einer
         eingespielten Sicherung, aus einer alten Seite, aus einer
         umgewandelten Folie (E118). Genau dafür gibt es den Auffang beim
         Zeichnen, und genau der wird hier gemessen. Der Weg darüber misst
         ihn nicht: dort ist die Spalte nie leer. */
      const rahmen = Store.addBlock(s.id, 'columns', { text: '' });
      b = Store.addBlock(rahmen.id, 'spalte', { text: '' });
      Store.addBlock(rahmen.id, 'spalte', { text: '' });
      App.zeichneSeite();
      await warte(300);
    }
    else if (auf.weg === 'pdfseite') {
      /* Die Felder sind die aus `PdfEinlesen` — ohne `bildDateiId`, denn
         GENAU SO steht eine PDF-Seite nach dem Einspielen einer `.redion`
         da: die Bilder bleiben draussen und werden neu gerechnet (E103). */
      b = Store.addBlock(s.id, 'pdfseite', {
        text: '', suchtext: 'Probeseite', nr: 1, vonSeiten: 3,
        bw: 595.28, bh: 841.89, dreh: 0
      });
      App.zeichneSeite();
      await warte(300);
    }

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
  }, auftrag);

  const kurz = (r as any).grund
    ? (r as any).grund
    : `edit ${(r as any).zahl.schreibbar} · feld ${(r as any).zahl.felder} · ` +
      `knopf ${(r as any).zahl.knoepfe} · bild ${(r as any).zahl.bild} · ` +
      `${(r as any).haeltKinder ? 'Behälter · ' : ''}` +
      `„${((r as any).zahl.text || '').slice(0, 26)}"`;
  bericht[art] = kurz;
  if ((r as any).echterTyp) wirklich[art] = (r as any).echterTyp;
  volltext[art] = (r as any).zahl ? String((r as any).zahl.text || '') : '';
  if (!(r as any).brauchbar) tot.push(art + ' (' + kurz + ')');
  if ((r as any).haeltKinder) {
    behaelter.push(art);
    if (!(r as any).schreibbarLeer) verschlossen.push(art + ' (' + kurz + ')');
  }
}

gleich('Keine einzige Blockart ist ein leeres Rechteck', tot.length, 0);
if (tot.length) for (const t of tot) console.log('      → ' + t);
p('Und alle wurden wirklich geprüft', Object.keys(bericht).length === wege.length,
  Object.keys(bericht).length + ' von ' + wege.length);

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
  return { gesprungen, kastenDa: !!kasten, echterTyp: b ? b.type : '',
           text: kasten ? (kasten.textContent || '').replace(/\s+/g, ' ').trim() : '',
           geoeffnet };
});

/* §2b IST der Weg zu `page` — nur ein anderer als der der Schleife. Also
   hier vermerken, sonst hält §3 die Seite gleich für weglos. */
if (unterseite.echterTyp) wirklich['page'] = unterseite.echterTyp;

p('`/page` springt in die neue Unterseite', unterseite.gesprungen);
p('Auf der Elternseite steht danach ein Verweis', unterseite.kastenDa);
p('Er trägt ein Blattzeichen und einen Titel',
  /📄/.test(unterseite.text), unterseite.text);
p('Und ein Klick öffnet die Unterseite wirklich', unterseite.geoeffnet);

/* ==========================================================================
 * §3 · Und die, die keinen Weg durchs Slash-Menü haben
 * --------------------------------------------------------------------------
 * §2 geht den Weg, den ein Mensch geht: Schrägstrich, Name, Enter. Nicht
 * jede Blockart hat den. `spalte` legt `columns` an, `pdfseite` entsteht
 * beim Einlesen eines PDF — gezeichnet werden beide, erreichbar ist keine
 * von beiden, und genau das war der Rest, den L41 offenliess.
 *
 * Oben stehen sie jetzt als eigene Aufträge in derselben Schleife. Hier
 * steht die Frage dahinter, und sie wird nicht aufgezählt, sondern
 * GERECHNET: alle `case`-Zweige des Zeichners minus alles, was §2 über das
 * Slash-Menü wirklich erzeugt hat. Übrig bleiben muss genau das, wofür oben
 * ein Weg von Hand steht.
 *
 * Kommt eine dritte Blockart ohne Slash-Weg dazu, wächst die Differenz und
 * dieser Punkt wird rot — das ist sein einziger Zweck. Die beiden von heute
 * sind in Ordnung; die dritte ist die, um die es geht.
 * ========================================================================*/
console.log('\n3 · Und die, die keinen Weg durchs Slash-Menü haben');

const zeichnerQuelle = fs.readFileSync(
  path.join(WURZEL, 'quell/bereiche/editor/ansicht/editor.js'), 'utf8');

/* Die Zweige stehen in EINEM `switch`. Käme ein zweiter dazu, läse der
   Ausdruck unten nur noch die Hälfte und dieser Punkt sagt es. */
const schalter = [...zeichnerQuelle.matchAll(/switch\s*\(\s*block\.type\s*\)/g)];
gleich('Der Zeichner entscheidet an genau einer Stelle nach Blockart',
  schalter.length, 1);

const gezeichnet = new Set([...zeichnerQuelle.matchAll(/^\s*case '([a-z0-9_-]+)':/gim)]
  .map(m => m[1] as string));
p('Und er kennt eine ganze Reihe von ihnen beim Namen', gezeichnet.size >= 30,
  String(gezeichnet.size));

const durchSlash = new Set([...wege.filter(w => w.weg === 'slash')
  .map(w => wirklich[w.art]), wirklich['page']].filter(Boolean));
const ohneWeg = [...gezeichnet].filter(x => !durchSlash.has(x)).sort();

/* DREI SEIT E239, und die dritte ist eine ALTE SCHREIBWEISE.
   „+ Neu → Neue Tabelle" legte seit E45 Blöcke der Art `tabelle` an, und
   der Zeichner kannte sie nicht — gemessen 24 px, Inhalt „+⋮⋮", also nur
   der Griff. Der Weg legt jetzt eine Kalkulationstabelle an; damit die
   Blöcke, die schon jemand angelegt hat, nicht unsichtbar bleiben (§46),
   zeichnet der Editor `tabelle` wie `table`.
   Sie gehört deshalb hierher und nicht ins Slash-Menü: es gibt sie im
   Bestand, aber neu anlegen soll sie niemand mehr. */
gleich('Drei Blockarten zeichnet er, ohne dass das Slash-Menü sie anbietet',
  JSON.stringify(ohneWeg), JSON.stringify(['pdfseite', 'spalte', 'tabelle']));

/* Und für die, die es noch gibt, steht oben ein Weg — sonst wären sie hier
   nur genannt und nicht geprüft. `tabelle` hat keinen: sie entsteht nicht
   mehr, sie wird nur noch gezeichnet. Dass sie gezeichnet wird, prüft
   test247 §16. */
const ohneWegNeu = ohneWeg.filter(x => x !== 'tabelle');
p('Für jede, die noch entsteht, steht in der Schleife ein eigener Weg',
  ohneWegNeu.length === 2 &&
  ohneWegNeu.every(x => wege.some(w => w.weg !== 'slash' && wirklich[w.art] === x)),
  wege.filter(w => w.weg !== 'slash')
    .map(w => w.art + ' → ' + (wirklich[w.art] || '?')).join(', '));

/* Die zwei Berichte im Klartext — damit im Prüfbericht steht, WAS an ihnen
   gemessen wurde, und nicht nur, dass es gut war. */
p('Die Spalte, die `columns` anlegt, hat gleich eine Zeile (E102)',
  /edit [1-9]/.test(bericht['spalte'] || ''), bericht['spalte']);
/* UND DIE OHNE — der Fall aus dem Bestand. Ohne den Auffang beim Zeichnen
   wäre sie eine unsichtbare Fläche, in die niemand hineinkommt. */
p('Und eine leer gebliebene Spalte bekommt beim Zeichnen eine',
  /edit [1-9]/.test(bericht['spalte-leer'] || ''), bericht['spalte-leer']);
p('Beide nehmen einen Block auf',
  /Behälter/.test(bericht['spalte'] || '') &&
  /Behälter/.test(bericht['spalte-leer'] || ''),
  bericht['spalte'] + ' | ' + bericht['spalte-leer']);
p('Die PDF-Seite nennt ihre Nummer und wie viele es sind',
  /Seite 1 von 3/.test(volltext['pdfseite'] || ''), volltext['pdfseite']);
/* Und der Fall, der nach dem Einspielen einer `.redion` der NORMALFALL ist:
   die Seite steht da, das Bild ist noch nicht gerechnet. Dann muss ein Satz
   dastehen und kein leeres Papier (E103, E116). */
p('Und ohne Bild sagt sie in Worten, was los ist',
  /kein Bild/.test(volltext['pdfseite'] || ''), volltext['pdfseite']);
p('Und sie ist kein leeres Rechteck',
  !tot.some(x => x.startsWith('pdfseite')), bericht['pdfseite']);

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log('\n   (geprüfte Blockarten: ' + arten.length + ')');

await browser.close();
server.close();
console.log(`\n${ok} bestanden, ${weg} durchgefallen`);
process.exit(weg ? 1 : 0);
