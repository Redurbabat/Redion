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
    /* EINE GANZ GEWÖHNLICHE TEXTSEITE als Gegenprobe für §4: dorthin darf
       kein Werkzeugfeld des Studios mitkommen. */
    const fremd = Store.addPage(null, { text: 'Eine gewöhnliche Textseite', icon: '📄' });
    Store.addBlock(fremd.id, 'text', { text: 'Hier steht Text und sonst nichts.' });
    await Store.flush(); App.oeffne(notebook.id);
    return { page: notebook.id, sheet: sheet.id, fremd: fremd.id };
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
    const werk = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
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
    const werk = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
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

  /* ══ §4 EIN FELD, DAS AUFGEHT, MUSS AUCH WIEDER ZUGEHEN (E575) ════════════
     GEMESSEN am 14. September: das Laserfeld war nach `App.oeffne()` einer
     fremden Seite immer noch offen — 380 × 54 Pixel bei 520/159, schwebend
     über einer gewöhnlichen Textseite, während `.document-workspace` längst
     weg war. Sein Anker war mit dem Studio aus dem Baum verschwunden — das
     Feld blieb also ohne jeden Knopf zurück, der es je wieder geschlossen
     hätte —, und der `resize`-Horcher, den nur das `toggle`-Ereignis
     abmeldet, lief weiter.
     DIE ZEILE ÜBER `aria-expanded` IST DESHALB DIE SCHWÄCHSTE DER DREI: sie
     war schon vor der Reparatur grün, weil der Anker mitsamt seinem Attribut
     wegfiel. Rot wird sie in dem Fall, den es auch gibt — einer Leiste, die
     neu aufgebaut wird, während ihr Knopf im Baum bleibt.

     Der Grund ist einfach und deshalb leicht zu übersehen: NICHTS ruft
     `hidePopover()`, ausser dem Helfer selbst. Wer die Fläche unter einem
     Popover wegräumt, räumt das Popover nicht mit — es hängt an
     `document.body`, nicht am Studio. */
  await werkzeug('stift');
  await page.locator('[data-document-tool="laser"]').click();
  await page.waitForTimeout(400);
  const feldAuf = await page.evaluate(`(() => {
    const p = document.querySelector('.blatt-popover');
    return { da: !!p, offen: p ? p.matches(':popover-open') : false };
  })()`) as { da: boolean; offen: boolean };
  check('Das Laserfeld geht auf', feldAuf.da && feldAuf.offen);

  await page.evaluate(id => App.oeffne(id), ids.fremd);
  await page.waitForTimeout(800);
  const nachWechsel = await page.evaluate(`(() => {
    const p = document.querySelector('.blatt-popover');
    const r = p ? p.getBoundingClientRect() : null;
    return { da: !!p, studio: !!document.querySelector('.document-workspace'),
      masse: r ? Math.round(r.width) + '×' + Math.round(r.height) : '—',
      offeneAnker: document.querySelectorAll('[aria-expanded="true"]').length };
  })()`) as { da: boolean; studio: boolean; masse: string; offeneAnker: number };
  check('Das Studio ist beim Wechsel wirklich weg', nachWechsel.studio === false);
  check('… und kein Werkzeugfeld schwebt über der fremden Seite', nachWechsel.da === false);
  check('… und kein Knopf behauptet noch, sein Feld stünde offen', nachWechsel.offeneAnker === 0);

  await page.evaluate(id => App.oeffne(id), ids.page);
  await page.waitForSelector('.document-drawingbar');
  await page.waitForTimeout(600);
  /* ESCAPE GIBT DEN FOKUS ZURÜCK, EIN AUSSENKLICK NICHT (Plan 8). Wer mit
     Escape schliesst, will dort weitermachen, wo er war; wer daneben tippt,
     wollte dorthin. */
  await page.locator('[data-document-tool="laser"]').click();
  await page.waitForTimeout(350);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Escape schliesst das Feld und gibt den Fokus an seinen Knopf zurück',
    await page.evaluate(`(() => !document.querySelector('.blatt-popover')
      && document.activeElement?.dataset?.documentTool === 'laser')()`));

  /* ══ DER ERSATZWEG WIRD WIRKLICH GEGANGEN (E575) ══════════════════════════
     Ein Rückfallweg, den nie jemand betritt, ist eine Behauptung (§50). Hier
     wird `showPopover` aus dem Prototyp genommen — genau die Lage in einem
     Browser ohne die Klappe — und dann dasselbe verlangt: aufgehen, Escape,
     zugehen. Danach kommt die Methode zurück, damit die übrigen Zusagen
     wieder den echten Weg messen. */
  await page.evaluate(`(() => { (window as any).__pop = HTMLElement.prototype.showPopover;
    delete (HTMLElement.prototype as any).showPopover; })()`.replace(/ as any/g, ''));
  await page.locator('[data-document-tool="laser"]').click();
  await page.waitForTimeout(350);
  const ersatz = await page.evaluate(`(() => {
    const p = document.querySelector('.blatt-popover');
    if (!p) return { da: false, ersatz: false, fest: '', breit: 0, hoch: 0 };
    const r = p.getBoundingClientRect(), st = getComputedStyle(p);
    return { da: true, ersatz: p.classList.contains('blatt-popover-ersatz'),
      fest: st.position, breit: Math.round(r.width), hoch: Math.round(r.height) };
  })()`) as { da: boolean; ersatz: boolean; fest: string; breit: number; hoch: number };
  check('Ohne die native Klappe geht das Feld trotzdem auf',
    ersatz.da && ersatz.ersatz && ersatz.breit > 100 && ersatz.hoch > 30);
  check('… und das Stilblatt stellt es fest an seinen Platz', ersatz.fest === 'fixed');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('… und Escape schliesst es auch dort',
    await page.evaluate(`!document.querySelector('.blatt-popover')`));
  await page.evaluate(`(() => { HTMLElement.prototype.showPopover = window.__pop; delete window.__pop; })()`);

  /* ══ §5 EIN KLICK DARF DIE LEISTE NICHT NEU AUFBAUEN (E575) ═══════════════
     GEMESSEN mit einem eigenen Beobachter auf `.document-drawingbar`, der
     jede `childList`-Bewegung zählt:

       ein Klick auf „Marker"   156 Knotenbewegungen
       ein Klick auf „Stift"    156 Knotenbewegungen
       Fokus danach             BODY
       Sortierbewegung unten    kommt oben NICHT an

     Die 156 sind dreizehn Knöpfe × zwei Bewegungen (raus und rein) × sechs
     Rufe von `inkSync()`. Der Grund: die Zeile hängte die Knöpfe bedingungslos
     um — `insertBefore` bewegt auch dann, wenn der Knoten schon am richtigen
     Platz steht. Ein bewegter Knoten verliert den Fokus, und jeder Übergang
     auf ihm beginnt von vorn. Genau deshalb steht danach `BODY` da: der
     Knopf, den der Finger gerade getroffen hat, wird unter ihm weggezogen.

     Und die dritte Zeile ist die Kehrseite derselben Nachlässigkeit: der
     Beobachter horchte nur auf Attribute (`disabled`, `aria-pressed`,
     `data-tool`). Eine Sortierbewegung ist aber eine `childList`-Änderung —
     sie kam oben nie an, obwohl unten fleissig umgehängt wurde. */
  await werkzeug('stift');
  await page.evaluate(`(() => {
    window.__umhaengen = 0;
    window.__zaehler?.disconnect();
    window.__zaehler = new MutationObserver(list => {
      for (const m of list) window.__umhaengen += m.addedNodes.length + m.removedNodes.length;
    });
    window.__zaehler.observe(document.querySelector('.document-drawingbar'), { childList: true });
  })()`);
  await werkzeug('marker');
  const bewegt = await page.evaluate(`window.__umhaengen`) as number;
  check('Ein Werkzeugwechsel baut die obere Leiste NICHT neu auf', bewegt === 0);
  check('… und der angetippte Knopf behält den Fokus',
    await page.evaluate(`document.activeElement?.dataset?.documentTool === 'marker'`));
  await page.evaluate(`window.__zaehler?.disconnect()`);

  /* Eine Sortierbewegung unten muss oben ankommen, ohne Neuaufbau (E570). */
  const reihe = () => page.evaluate(`Array.from(document.querySelectorAll('.document-drawingbar [data-document-tool]')).map(b => b.dataset.documentTool).join(',')`) as Promise<string>;
  const vorSortieren = await reihe();
  await page.evaluate(`(() => {
    const werk = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
    const wz = Array.from(werk.querySelectorAll(':scope > [data-wz]'));
    werk.insertBefore(wz[wz.length - 1], wz[0]);
  })()`);
  await page.waitForTimeout(500);
  const nachSortieren = await reihe();
  check('Eine Sortierbewegung unten kommt oben live an', vorSortieren !== nachSortieren);
  check('… und zwar genau als dieselbe Reihenfolge',
    nachSortieren === await page.evaluate(`Array.from(document.querySelectorAll('.document-stage[data-aktiv] .blatt-werk > [data-wz]')).map(b => b.dataset.wz).join(',')`));

  await werkzeug('stift');
  check('Keine Laufzeitfehler', errors.length === 0);
  mkdirSync(resolve(root, 'bilder'), { recursive: true });
  /* Der Name sagte „before" und zeigte den Nachher-Stand — ein Bild, dessen
     Name lügt, ist schlimmer als keines (§55.4). */
  await page.screenshot({ path: resolve(root, 'bilder/zeichenstudio-dock.png') });
} finally { await browser.close(); server.close(); }
console.log(`\n${passed} grün, ${failed} rot`);
process.exitCode = failed ? 1 : 0;
