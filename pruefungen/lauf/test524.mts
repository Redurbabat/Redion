/* E572 — Die Zeichenwerkzeuge nach Redurs sieben Referenzbildern.
 * Echte App, eigene Browserablage; kein Zugriff auf Nutzerdokumente.
 * Vor der Umsetzung rot: Laser fehlt oben, Formenwahl ist versteckt.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
declare const Store: any;
declare const App: any;
declare const Marken: any;
const root = resolve(import.meta.dirname, '../..');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((request, response) => {
  const file = resolve(root, '.' + (request.url?.split('?')[0] || '/index.html'));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  response.end(readFileSync(file));
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
let failed = 0, passed = 0;
const check = (name: string, value: unknown) => { value ? passed++ : failed++; console.log((value ? '  ✓ ' : '  ✗ ') + name); };
const errors: string[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.waitForTimeout(500);
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(node => node.remove());
    const notebook = Store.addPage(null, { text: 'Ideen & Skizzen', icon: '📓' });
    const sheet = Store.addBlock(notebook.id, 'blatt', { text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.addBlock(notebook.id, 'blatt', { text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    Store.updateBlock(notebook.id, { dokumentModus: true });
    await Store.flush(); App.oeffne(notebook.id);
    return { page: notebook.id, sheet: sheet.id };
  });
  await page.waitForSelector('.document-drawingbar');
  check('Leeres Testblatt, keine Nutzerdaten', await page.evaluate(id => Store.getBlock(id)?.marken?.length === 0, ids.sheet));
  await page.locator('[data-document-tool="stift"]').click();
  check('Laser direkt in der oberen Werkzeugleiste', await page.locator('[data-document-tool="laser"]').count() === 1);
  await page.locator('[data-document-tool="formen"]').click();
  check('Formenwahl ohne Alle-Optionen-Umweg', await page.locator('.document-stage[data-aktiv] [data-act="formart"][data-form="triangle"]').isVisible());
  check('Lineal oben direkt erreichbar', await page.locator('[data-document-action="ink-ruler"]').count() === 1);
  check('Drei eigene Radierergrößen', await page.locator('.document-stage[data-aktiv] [data-eraser-size]').count() === 3);

  /* ══ §2 DAS DOCK ZEIGT DAS ZUBEHÖR DES GEWÄHLTEN WERKZEUGS (E574) ═══════════
     GEMESSEN am 14. September an der laufenden App, Fenster 1440 × 960, je
     Werkzeug die 86 Kinder der Leiste gezählt — nicht geschätzt:

       Werkzeug    sichtbar   davon aus der eigenen Gruppe
       stift        26/86     stil 6/7, formen 2/3, farbe 15/16, breite 3/5
       text         21/86     schrift 6/7, farbe 15/16
       select       33/86     auswahl 9/10, breite 3/5, farbe 15/16
       radierer      5/86     radierer 5/5, sonst nichts
       marker       19/86     lineal 1/2, breite 3/5, farbe 15/16

     Vor E573 war es an derselben Stelle 0 von 7 Formknöpfen, 0 von 7
     Schriftknöpfen und 0 von 10 Auswahlknöpfen: `pdf-studio.css` versteckte
     acht Dinge pauschal, statt die Gruppenregel aus `bausteine.css` (E356)
     wirken zu lassen. Diese Zusicherungen halten fest, dass das Dock die
     Regel LIEST und nicht zweitens entscheidet.

     WARUM SIE ROT WERDEN KÖNNEN: jede Zeile prüft ein Paar — was da sein
     MUSS und was NICHT da sein darf. Eine Regel, die wieder alles zeigt,
     bricht die zweite Hälfte; eine, die wieder alles versteckt, die erste.
     Eine Zusicherung, die nur „irgendetwas ist sichtbar" fragt, wäre in
     beiden Fällen grün (§55.2). */
  const werkzeug = async (name: string) => {
    await page.locator(`[data-document-tool="${name}"]`).click();
    await page.waitForTimeout(220);
  };
  const dock = async (): Promise<Record<string, [number, number]>> => await page.evaluate(`(() => {
    const werk = document.querySelector('.document-studio .blatt-werk');
    const sicht = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const out = {};
    for (const kind of werk ? Array.from(werk.children) : []) {
      const g = kind.getAttribute('data-gruppe') || (kind.hasAttribute('data-wz') ? 'werkzeug' : 'sonst');
      out[g] = out[g] || [0, 0];
      out[g][1]++; if (sicht(kind)) out[g][0]++;
    }
    return out;
  })()`) as Record<string, [number, number]>;
  const sicht = (gruppen: Record<string, [number, number]>, name: string) => (gruppen[name] || [0, 0])[0];

  await werkzeug('stift');
  const beimStift = await dock();
  check('Stift: seine Stifte und Farben stehen ohne „···" da',
    sicht(beimStift, 'stil') > 0 && sicht(beimStift, 'farbe') > 0);
  check('… und die Schrift-, Auswahl- und Radierergruppen NICHT',
    sicht(beimStift, 'schrift') === 0 && sicht(beimStift, 'auswahl') === 0 && sicht(beimStift, 'radierer') === 0);
  /* DIE WERKZEUGE SELBST STEHEN OBEN IM BAND. Stünden sie zusätzlich im
     Dock, wäre das eine zweite vollständige Werkzeugreihe unter der ersten —
     genau das zeigen Redurs Bilder 4 und 6 nicht. */
  check('… und keine zweite Werkzeugreihe im Dock', sicht(beimStift, 'werkzeug') === 0);
  /* ══ DAS LINEAL GEHÖRT AUCH DEM STIFT (E574) ═══════════════════════════════
     ABGELESEN, NICHT ANGENOMMEN: `marken.ts` lässt die Kantenführung für
     `['stift','marker','line','arrow']` zu. Der Zeichner führt den Stift also
     längst am Lineal — nur der Schalter dafür fehlte ihm. In der Gruppenliste
     (E356) stand `lineal` bei `marker`, `line` und `arrow`, nicht bei `stift`.
     Wer mit dem Stift ein Lineal wollte, kam nur über die Taste „r" oder über
     „···" daran. Ein Weg, den man kennen muss, ist am Telefon kein Weg. */
  check('Lineal-Schalter steht beim Stift im Dock',
    await page.locator('.document-stage[data-aktiv] [data-act="lineal"]').first().isVisible());

  await werkzeug('radierer');
  const beimRadierer = await dock();
  check('Radierer: seine Größen stehen da', sicht(beimRadierer, 'radierer') > 0);
  check('… und Farben, Stifte und Lineal nicht',
    sicht(beimRadierer, 'farbe') === 0 && sicht(beimRadierer, 'stil') === 0 && sicht(beimRadierer, 'lineal') === 0);

  await werkzeug('text');
  const beimText = await dock();
  check('Text: die Schriftgruppe steht ohne „···" da', sicht(beimText, 'schrift') > 0);
  check('… und die Stiftgruppe nicht', sicht(beimText, 'stil') === 0);

  await werkzeug('select');
  const beiAuswahl = await dock();
  check('Auswahl: ihre eigenen Knöpfe stehen da', sicht(beiAuswahl, 'auswahl') > 0);
  check('… und die Radierergrößen nicht', sicht(beiAuswahl, 'radierer') === 0);


  /* ══ §3 DIE HAFTNOTIZFARBEN BLEIBEN IM NOTIZKONTEXT (E574) ═════════════════
     GEMESSEN, BEVOR ETWAS GEÄNDERT WURDE: die neun Pastellfarben aus E572
     bekamen bei ihrer Erzeugung `data-gruppe="farbe"` — dieselbe Gruppe wie
     die fünf Tintenfarben. Damit standen sie in JEDEM Werkzeug. Die
     Farbreihe las sich beim Stift, beim Marker und bei der Schrift gleich:

       t t t t t N N N N N N N N N +      (t = Tinte, N = Notiz, + = Farbwähler)

     Vierzehn Tupfer, von denen neun zu einem Werkzeug gehören, das gerade
     nicht gewählt ist. Und weil `leiterReihe()` die Adern ebenfalls vor das
     „+" hängt, während `ink-studio-ready` die Pastelle DANACH erzeugt, kamen
     sie nach einem Neustart mit dem Leiterstift mitten in die Adernreihe:
     dort blendet sie niemand aus, denn `blatt-farbe-weg` war schon verteilt,
     als es sie noch nicht gab.

     DESHALB EINE EIGENE GRUPPE. `notizfarbe` steht in der Liste aus E356 nur
     beim Werkzeug `zettel` — und weil die Liste die Wahrheit ist (§8), gilt
     das an jeder Stelle gleich: im Dock, in der Leiste einer Seite, am
     Telefon und nach jedem Neustart, ohne dass irgendwer eine Klasse
     nachträglich verteilen muss. */
  await werkzeug('stift');
  const notizBeim = async () => await page.evaluate(`(() => {
    const werk = document.querySelector('.document-studio .blatt-werk');
    const sicht = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const zaehl = (wahl) => Array.from(werk.querySelectorAll(wahl)).filter(sicht).length;
    return { notiz: zaehl('.blatt-note-color'),
      tinte: zaehl('.blatt-farbe:not(.blatt-note-color):not(.blatt-farbe-leiter)'),
      ader: zaehl('.blatt-farbe-leiter'),
      notizGesamt: werk.querySelectorAll('.blatt-note-color').length,
      notizGruppen: Array.from(new Set(Array.from(werk.querySelectorAll('.blatt-note-color'))
        .map(e => e.getAttribute('data-gruppe') || ''))) };
  })()`) as { notiz: number; tinte: number; ader: number; notizGesamt: number; notizGruppen: string[] };

  const beiStift = await notizBeim();
  check('Die neun Haftnotizfarben sind überhaupt gebaut', beiStift.notizGesamt === 9);
  check('Beim Stift steht keine davon', beiStift.notiz === 0);
  check('… seine fünf Tintenfarben aber schon', beiStift.tinte >= 5);

  await werkzeug('zettel');
  const beiZettel = await notizBeim();
  check('Beim Zettel stehen alle neun', beiZettel.notiz === 9);
  /* PLAN 7 B 4 WÖRTLICH: „normale Tintenfarben hier nicht zusätzlich als
     zweite ungeordnete Palette zeigen". Eine Haftnotiz ist ein Zettel, und
     ein schwarzer Zettel ist keiner. */
  check('… und keine zweite Palette aus Tintenfarben daneben', beiZettel.tinte === 0);

  /* DER FALL AUS DEM RISIKOVERZEICHNIS DES PLANS: Leiterstift an. */
  await werkzeug('stift');
  await page.locator('.document-stage[data-aktiv] [data-act="stilwahl"][data-stil="leiter"]').first().click();
  await page.waitForTimeout(250);
  const beiLeiter = await notizBeim();
  check('Der Leiterstift zeigt seine Adern', beiLeiter.ader > 0);
  check('… und keine Haftnotizfarbe steht in der Adernreihe', beiLeiter.notiz === 0);
  /* DIE ZEILE DARÜBER ALLEIN WÄRE KEINE PRÜFUNG (§55.2): sie war GRÜN, als
     der Fehler noch dastand — `leiterReihe()` verteilt `blatt-farbe-weg` an
     alles, was `.blatt-farbe` heisst, und die Pastelle heissen so. Rot wurde
     sie erst nach einem NEUSTART mit dem Leiterstift, weil die Klasse dann
     schon verteilt war, als es die Pastelle noch nicht gab.
     Diese Zeile prüft deshalb die Eigenschaft, aus der beides folgt: eine
     eigene Gruppe. Solange die neun `notizfarbe` heissen, kann die Reihe
     gar nicht erst entstehen — in keiner Reihenfolge und nach keinem
     Neustart. */
  check('… weil die neun eine eigene Gruppe tragen, nicht die der Tinte',
    beiLeiter.notizGruppen.length === 1 && beiLeiter.notizGruppen[0] === 'notizfarbe');
  await page.locator('.document-stage[data-aktiv] [data-act="stilwahl"][data-stil="fueller"]').first().click();
  await page.waitForTimeout(200);

  await werkzeug('stift');
  check('Keine Laufzeitfehler', errors.length === 0);
  mkdirSync(resolve(root, 'bilder'), { recursive: true });
  /* Der Name sagte „before" und zeigte den Nachher-Stand — ein Bild, dessen
     Name lügt, ist schlimmer als keines (§55.4). */
  await page.screenshot({ path: resolve(root, 'bilder/zeichenstudio-dock.png') });
} finally { await browser.close(); server.close(); }
console.log(`\n${passed} grün, ${failed} rot`);
process.exitCode = failed ? 1 : 0;
