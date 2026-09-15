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
/** Eine Projektdatei als Text — für die eine Quellenzusage in §10. */
const lies = (rel: string): string => readFileSync(resolve(root, rel), 'utf-8');
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

  /* ══ §6 DER RADIERER: SICHTBAR, EINFACH, MIT GEDÄCHTNIS (E576) ════════════
     GEMESSEN an der laufenden App, Fenster 1440 × 960:

       die drei Größen        je 14 × 44 px, ihr <i> 0 × 0 — also nichts zu sehen
       der Modus              „Ganz" 65 px UND „Ganz ⌄" 60 px — zweimal dasselbe Wort
       nach einem Seitenwechsel   wieder „klein", obwohl „groß" gewählt war

     Die 14 px sind kein Stilfehler, sondern ein fehlendes Stilblatt:
     `.blatt-eraser-size` und `.blatt-eraser-menu` hatten KEINE einzige
     Regel. Die Knöpfe setzen `--eraser-preview` auf 16, 28 und 40 px und
     tragen ein leeres `<i>` — ohne Regel zeichnet das nichts, und die
     44-px-Zusage aus §37 gilt in der Breite nicht mehr.

     Der doppelte Modus ist der alte Rundlaufknopf, der neben seinem eigenen
     Ersatz stehen blieb. Er wird nicht entfernt — er ist weiterhin der
     Mechanismus, den das neue Feld bedient, und auf einer gewöhnlichen
     Seite (ohne Studio) der einzige Weg. Er tritt nur dort zurück, wo sein
     Ersatz wirklich steht. */
  await werkzeug('radierer');
  const radierer = async () => await page.evaluate(`(() => {
    const werk = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
    const sicht = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const groessen = Array.from(werk.querySelectorAll('[data-eraser-size]')).map(e => {
      const r = e.getBoundingClientRect();
      const i = e.querySelector('i');
      const ir = i ? i.getBoundingClientRect() : { width: 0, height: 0 };
      return { px: e.dataset.eraserSize, breit: Math.round(r.width), hoch: Math.round(r.height),
        kreis: Math.round(ir.width), gewaehlt: e.getAttribute('aria-pressed') === 'true' };
    });
    const cycle = werk.querySelector('[data-act="radiermodus"]');
    const menu = werk.querySelector('[data-act="eraser-menu"]');
    return { groessen, cycleSichtbar: !!cycle && sicht(cycle), cycleDa: !!cycle,
      menuSichtbar: !!menu && sicht(menu) };
  })()`) as { groessen: Array<{ px: string; breit: number; hoch: number; kreis: number; gewaehlt: boolean }>;
              cycleSichtbar: boolean; cycleDa: boolean; menuSichtbar: boolean };

  const r1 = await radierer();
  check('Die drei Radierergrößen sind 44 px breit und hoch (§37)',
    r1.groessen.length === 3 && r1.groessen.every(g => g.breit >= 44 && g.hoch >= 44));
  /* EINE GRÖSSE, DIE MAN NICHT SIEHT, IST KEINE WAHL (§55.1). Die drei
     Kreise müssen verschieden gross sein — sonst sagt das Bild nichts. */
  /* NACH WERT VERGLEICHEN, NICHT NACH REIHENFOLGE. Die Knöpfe stehen in der
     Reihenfolge, die der Nutzer gewählt hat (E570) — `querySelectorAll`
     liefert sie in Baumfolge, und die ist nach `ordnungAnwenden()` eben
     nicht mehr 5, 14, 28. Diese Zeile war deshalb zuerst aus dem falschen
     Grund rot. */
  const kreis = (px: string) => r1.groessen.find(g => g.px === px)?.kreis ?? 0;
  check('… und jede zeigt ihren Kreis, klein < mittel < groß',
    r1.groessen.every(g => g.kreis > 0) && kreis('5') < kreis('14') && kreis('14') < kreis('28'));
  check('Der Radiermodus steht im Studio einmal da, nicht zweimal',
    r1.menuSichtbar && r1.cycleDa && !r1.cycleSichtbar);

  /* Das Gedächtnis: „groß" wählen, weggehen, wiederkommen. */
  await page.locator('.document-stage[data-aktiv] [data-eraser-size="28"]').click();
  await page.waitForTimeout(250);
  check('Eine gewählte Größe ist sofort die gewählte',
    (await radierer()).groessen.find(g => g.px === '28')?.gewaehlt === true);
  await page.evaluate(id => App.oeffne(id), ids.fremd);
  await page.waitForTimeout(700);
  await page.evaluate(id => App.oeffne(id), ids.page);
  await page.waitForSelector('.document-drawingbar');
  await page.waitForTimeout(800);
  await werkzeug('radierer');
  const r2 = await radierer();
  check('… und sie überlebt den Seitenwechsel',
    r2.groessen.find(g => g.px === '28')?.gewaehlt === true);
  /* DIESE ZEILE STAND HIER EINMAL ANDERS und konnte nie rot werden:
     `Number(svg.dataset.eraser || 28) === 28` ist auch dann wahr, wenn das
     Attribut gar nicht existiert (§55.2). Jetzt wird der Ort geprüft, an dem
     die Wahl WIRKLICH überlebt — `meta`, derselbe Weg wie beim Modus. */
  check('… weil sie in `meta` steht und nicht im Blatt',
    await page.evaluate(`Store.getMeta('zeichnen:radierergroesse') === 28`));

  /* ══ §7 DIE DOCK-BEWEGUNG (E577) ══════════════════════════════════════════
     Redurs Wunsch aus E572: „Macbook Dock Animationen … beim Wechseln."
     Am Mac wächst das Zeichen unter dem Zeiger, die Nachbarn heben schwächer
     mit, und die Leiste selbst steht still.

     WAS HIER GEMESSEN WIRD, IST DER UNTERSCHIED ZWISCHEN BEIDEM: das Zeichen
     wächst, die TREFFERFLÄCHE nicht. Genau daran hängen drei Punkte des Plans
     — feste Trefferflächen (7 C 3), nichts wird am Rollcontainer abgeschnitten
     (7 C 5), keine verschluckten Klicks (7 C 4). Eine Prüfung, die nur „es
     bewegt sich" fragt, würde eine Bewegung durchlassen, die den Knopf selbst
     aufbläst — und die wäre falsch. */
  await werkzeug('stift');
  const zeichen = (tool: string) => page.evaluate(`(() => {
    const b = document.querySelector('.document-drawingbar [data-document-tool="${tool}"]');
    if (!b) return null;
    const svg = b.querySelector('svg');
    const br = b.getBoundingClientRect(), sr = svg ? svg.getBoundingClientRect() : null;
    return { knopf: Math.round(br.width) + 'x' + Math.round(br.height),
      zeichen: sr ? Math.round(sr.width * 10) / 10 : 0 };
  })()`) as Promise<{ knopf: string; zeichen: number } | null>;
  /* Zwei Nachbarn aus der laufenden Leiste holen — ihre Reihenfolge gehört
     seit E570 dem Nutzer, also wird sie gelesen und nicht angenommen. */
  const paar = await page.evaluate(`(() => {
    const bs = Array.from(document.querySelectorAll('.document-drawingbar [data-document-tool]'));
    const i = bs.findIndex(b => !b.disabled && bs[bs.indexOf(b) + 1] && !bs[bs.indexOf(b) + 1].disabled);
    return i < 0 ? null : [bs[i].dataset.documentTool, bs[i + 1].dataset.documentTool];
  })()`) as [string, string] | null;
  check('Zwei benutzbare Nachbarn in der oberen Leiste', !!paar);
  if (paar) {
    /* ERST DEN ZEIGER WEGNEHMEN. Diese zwei Zeilen sind kein Beiwerk: der
       Klick auf ein Werkzeug lässt die Maus auf diesem Knopf STEHEN, und der
       Nachbar daneben stand deshalb schon auf 28.3 px, als die „Ruhe"
       gemessen wurde. Die Prüfung war dadurch rot, obwohl die Regel stimmte —
       ein Messfehler, der wie ein Fehler im Produkt aussieht. */
    await page.mouse.move(5, 5);
    await page.waitForTimeout(320);
    const ruheA = await zeichen(paar[0]);
    const ruheB = await zeichen(paar[1]);
    await page.locator(`.document-drawingbar [data-document-tool="${paar[0]}"]`).hover();
    await page.waitForTimeout(350);
    const hoverA = await zeichen(paar[0]);
    const hoverB = await zeichen(paar[1]);
    check('Unter dem Zeiger wächst das Zeichen deutlich',
      !!ruheA && !!hoverA && hoverA.zeichen >= ruheA.zeichen * 1.2);
    check('… der Nachbar hebt schwächer mit',
      !!ruheB && !!hoverB && !!hoverA
      && hoverB.zeichen > ruheB.zeichen && hoverB.zeichen < hoverA.zeichen);
    /* DER PUNKT, AN DEM ES SONST FALSCH WÄRE. */
    check('… und die Trefferfläche bleibt, wie sie war',
      !!ruheA && !!hoverA && hoverA.knopf === ruheA.knopf && ruheA.knopf === '44x44');
    await page.mouse.move(5, 5);
    await page.waitForTimeout(300);
    const zurueck = await zeichen(paar[0]);
    check('… und geht wieder zurück, wenn der Zeiger fort ist',
      !!zurueck && !!ruheA && Math.abs(zurueck.zeichen - ruheA.zeichen) < 0.6);
  }

  /* ══ §8 DIE VERLAUFSKAPSEL DECKT NICHT DIE ERSTE ZEILE ZU (E577) ══════════
     DAS BILD HAT ES GEFUNDEN, nicht der Prüflauf — und dann hat die Messung
     es beziffert:

       1440 px   Kapsel bei 12/166, Papier bei 226/249   →  0 × 0 überdeckt
        390 px   Kapsel bei  8/163, Papier bei  19/176   → 87 × 39 überdeckt

     Am Rechner liegt sie im linken Rand, wo Platz ist — genau wie in Redurs
     Bild 1. Am Telefon gibt es diesen Rand nicht: das Papier ist 342 von
     390 px breit, und dieselbe Ecke ist dort die Ecke, in der die erste
     Zeile anfängt. Gemessen lag die Kapsel ÜBER dem „Tippe etwas …".

     DASS SIE AM TELEFON IRGENDWO ÜBER PAPIER LIEGT, ist nicht zu vermeiden;
     bei 19 px Rand gibt es keine freie Fläche. Vermeidbar ist die STELLE:
     unten links beginnt niemand zu schreiben, und der Daumen kommt dort
     ohne Umgreifen hin. */
  const kapsel = async (): Promise<{ ueberX: number; ueberY: number; oben: number; papierOben: number }> =>
    await page.evaluate(`(() => {
      const k = document.querySelector('.document-ink-history');
      const p = document.querySelector('.document-stage[data-aktiv] .blatt-marken')
        || document.querySelector('.document-stage[data-aktiv]');
      if (!k || !p) return { ueberX: -1, ueberY: -1, oben: -1, papierOben: -1 };
      const a = k.getBoundingClientRect(), b = p.getBoundingClientRect();
      return {
        ueberX: Math.round(Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))),
        ueberY: Math.round(Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))),
        oben: Math.round(a.top), papierOben: Math.round(b.top) };
    })()`);

  const amRechner = await kapsel();
  check('Am Rechner liegt die Kapsel im Rand, nicht auf dem Papier',
    amRechner.ueberX === 0 || amRechner.ueberY === 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  const amTelefon = await kapsel();
  /* DIE ZUSAGE IST NICHT „gar kein Papier", sondern „nicht die erste Zeile":
     die Kapsel muss in der UNTEREN Hälfte des Papiers stehen. */
  check('Am Telefon steht sie unten, nicht über der ersten Zeile',
    amTelefon.oben > amTelefon.papierOben + 200);
  check('… und sie ist überhaupt noch da und bedienbar',
    await page.locator('[data-document-action="ink-undo"]').isVisible()
    && await page.locator('[data-document-action="ink-undo"]').evaluate(e => {
      const r = e.getBoundingClientRect();
      return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= 390 && r.bottom <= 844;
    }));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(600);

  /* ══ §9 WENN ETWAS AUSSERHALB DES BILDES STEHT, MUSS MAN ES SEHEN (E580) ══
     GEMESSEN am 15. September 2026, je Fenster `scrollWidth` gegen
     `clientWidth`:

       390 px   oben 780/390 → 390 px versteckt · Dock 918/356 → 562 versteckt
       820 px   oben 834/820 →  14 px versteckt · Dock 939/786 → 153 versteckt
      1440 px   oben 1440/1440 nichts · Dock 939/939 nichts

     Am Telefon steht also MEHR ausserhalb des Bildes als darin — acht von
     sechzehn Werkzeugen oben, und im Dock zwei Drittel. Dass die Leiste
     rollt, ist Absicht (E356/E359: eine rollende Zeile statt drei Zeilen,
     die das Papier auffressen). Dass nichts es SAGT, ist keine.

     Plan 7 B 8 nennt es „sichtbarer Hinweis auf weitere Werkzeuge".

     WIE ES GEPRÜFT WIRD, OHNE PIXEL ZU RATEN: der Hinweis ist ein
     Rollschatten aus vier Hintergrundschichten (zwei `local` als Deckel,
     zwei `scroll` als Schatten). Er zeigt sich von selbst nur dort, wo es
     etwas zu rollen gibt, und verschwindet an den Enden — ohne eine Zeile
     JavaScript und ohne Horcher, der hängenbleiben kann. Geprüft wird,
     dass die Schichten wirklich im berechneten Hintergrund stehen, und
     daneben die Zahlen oben. */
  await werkzeug('stift');
  const rollen = async () => await page.evaluate(`(() => {
    const mess = (sel) => {
      const e = document.querySelector(sel);
      if (!e) return null;
      const bg = getComputedStyle(e).backgroundImage;
      return { sichtbar: Math.round(e.clientWidth), inhalt: Math.round(e.scrollWidth),
        versteckt: Math.max(0, Math.round(e.scrollWidth - e.clientWidth)),
        schatten: (bg.match(/radial-gradient/g) || []).length,
        deckel: (bg.match(/linear-gradient/g) || []).length };
    };
    return { oben: mess('.document-drawingbar'),
      dock: mess('.document-stage[data-aktiv] .blatt-werk') };
  })()`) as { oben: any; dock: any };

  const amRechnerRollt = await rollen();
  check('Am Rechner steht nichts ausserhalb des Bildes',
    amRechnerRollt.oben.versteckt === 0 && amRechnerRollt.dock.versteckt === 0);
  check('Beide Leisten tragen den Rollschatten — zwei Schatten, zwei Deckel',
    amRechnerRollt.oben.schatten >= 2 && amRechnerRollt.oben.deckel >= 2
    && amRechnerRollt.dock.schatten >= 2 && amRechnerRollt.dock.deckel >= 2);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  const amTelefonRollt = await rollen();
  check('Am Telefon rollt beides wirklich',
    amTelefonRollt.oben.versteckt > 100 && amTelefonRollt.dock.versteckt > 100);
  check('… und der Hinweis ist auch dort da',
    amTelefonRollt.oben.schatten >= 2 && amTelefonRollt.dock.schatten >= 2);

  /* ══ UND JETZT IN PIXELN, NICHT IN CSS-TEXT (§55.1) ═══════════════════════
     Dass die Schichten im Hintergrund stehen, heisst noch nicht, dass man
     sie SIEHT. Der erste Wurf nahm `rgba(0,0,0,.30)` und war im Dunkelmodus
     nachgemessen **8 von 255** Helligkeitsunterschied zwischen Rand und
     Mitte — ein schwarzer Schatten auf einer dunklen Leiste. Im Hellmodus
     waren es 66. Genau die Sorte Fehler, die nur ein Blick auf das Bild
     findet, und genau deshalb steht hier eine Messung und keine Zeichenkette.
     Die Grenze ist 25: gemessen liegen die reparierten Werte bei 64 (dunkel)
     und 58 (hell), der kaputte bei 8. 25 liegt in der Mitte der Lücke. */
  const randKontrast = async (): Promise<{ rechts: number; mitte: number; links: number }> => {
    const bar = page.locator('.document-drawingbar');
    const box = (await bar.boundingBox())!;
    const bild = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    return await page.evaluate(async (daten: number[]) => {
      const blob = new Blob([new Uint8Array(daten)], { type: 'image/png' });
      const bmp = await createImageBitmap(blob);
      const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
      const g = c.getContext('2d')!; g.drawImage(bmp, 0, 0);
      const y = Math.round(bmp.height / 2);
      const lies = (x: number) => { const d = g.getImageData(x, y, 1, 1).data;
        return Math.round(.299 * d[0]! + .587 * d[1]! + .114 * d[2]!); };
      return { links: lies(1), mitte: lies(Math.round(bmp.width / 2)), rechts: lies(bmp.width - 2) };
    }, Array.from(bild));
  };
  for (const thema of ['standard', 'hell']) {
    await page.evaluate(th => (window as any).Aussehen?.setzen({ schema: th }), thema);
    await page.waitForTimeout(400);
    const k = await randKontrast();
    check(`Der Hinweis ist im Thema „${thema}" wirklich zu sehen (≥ 25)`,
      Math.abs(k.rechts - k.mitte) >= 25);
    /* AM ANFANG DER ROLLE GIBT ES LINKS NICHTS ZU HOLEN — und dort darf auch
       kein Schatten stehen, sonst verspricht er etwas, das nicht da ist. */
    check(`… und links, wo nichts mehr kommt, steht keiner („${thema}")`,
      Math.abs(k.links - k.mitte) < 12);
  }
  await page.evaluate(() => (window as any).Aussehen?.setzen({ schema: 'standard' }));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(600);

  /* ══ §10 WAS BEDIENUNG IST, GEHÖRT AUF KEIN PAPIER (E581) ═════════════════
     Abschnitt 8 des Übergabeplans: „Ein sichtbar gemachtes SVG-Lineal muss
     von jeder Ausgabe ausgeschlossen bleiben; nicht darauf vertrauen, dass
     jedes Exportverfahren nur `marks` liest."

     ZWEI DER DREI WEGE WAREN IN ORDNUNG, und zwar aus einem guten Grund:
     „Als Bild sichern" und „Als PDF" bauen ein frisches SVG aus `marken`
     (`Marken.zeichneMarke`) und sehen die lebende Fläche nie an. Ein Lineal
     kann dort gar nicht hineingeraten.

     DER DRITTE WEG IST DER DRUCK, und der rendert das DOM. Gemessen mit
     echter Druckemulation, Lineal an:

       am Bildschirm   1 × [data-ink-ui="ruler"], sichtbar
       im Druck        1 × [data-ink-ui="ruler"], SICHTBAR   ← auf dem Papier

     Kein Stilblatt nannte `[data-ink-ui]` im Druck. Dasselbe galt damit für
     die Laserspur und die Auswahlgriffe: alles drei hätte mitgedruckt.
     `data-ink-ui` trägt genau dafür seinen Namen — es ist die Marke für
     „Bedienung, keine Marke". */
  await werkzeug('stift');
  await page.locator('[data-document-action="ink-ruler"]').click();
  await page.waitForTimeout(400);
  const inkUi = async () => await page.evaluate(`(() => {
    const f = document.querySelector('.document-stage[data-aktiv] .blatt-marken');
    const teile = Array.from(f ? f.querySelectorAll('[data-ink-ui]') : []);
    return { da: teile.length, sichtbar: teile.filter(t => { const s = getComputedStyle(t);
      return s.display !== 'none' && s.visibility !== 'hidden' && t.getClientRects().length > 0; }).length };
  })()`) as { da: number; sichtbar: number };

  const amSchirm = await inkUi();
  check('Am Bildschirm ist das Lineal da und sichtbar', amSchirm.da >= 1 && amSchirm.sichtbar >= 1);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);
  const imDruck = await inkUi();
  check('Im Druck steht nichts davon auf dem Papier',
    imDruck.da >= 1 && imDruck.sichtbar === 0);
  await page.emulateMedia({ media: 'screen' });
  await page.waitForTimeout(300);
  check('… und nach dem Druck ist es wieder da', (await inkUi()).sichtbar >= 1);
  /* DIE REGEL GILT DEM ATTRIBUT, NICHT DER KLASSE — sonst müsste jede neue
     Bedienschicht daran denken, und genau das vergisst irgendwann jemand. */
  /* LEERRAUM AUF EIN ZEICHEN ZUSAMMENZIEHEN, NICHT WEGWERFEN: `@media print`
     wird sonst zu `@mediaprint`, und die Zusage sucht etwas, das es nicht
     geben kann. Beim ersten Wurf war sie genau deshalb rot, obwohl die Regel
     schon dastand — derselbe Fehler wie in `test461` (E577). */
  const stil = lies('quell/schale/stil/bausteine.css')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  check('Die Regel nennt `[data-ink-ui]`, nicht nur das Lineal',
    /@media print\s*\{\s*\[data-ink-ui\]/.test(stil));
  await page.locator('[data-document-action="ink-ruler"]').click();
  await page.waitForTimeout(300);

  /* ══ §11 DIE KOPIE MUSS ZEIGEN, WAS DAS ORIGINAL ZEIGT (E583) ════════════
     Plan 7 B 5: „Form-Dock: alle sieben vorhandenen Formen direkt;
     Farbe/Dicke dazu." Nachgemessen am 15. September 2026 war genau das
     schon da — sieben Formknöpfe, alle sichtbar, alle 44 px hoch, fünf
     Farben plus „+" und die drei Strichstufen daneben:

       [data-tool="line"]   form 7/8 sichtbar · farbe 6/7 · breite 3/5
       (die zwei fehlenden: der Trenner und die Klappe für die freie
        Stärke — die öffnet sich erst auf den zweiten Tipp, E465)

     GEFUNDEN WURDE DABEI ETWAS ANDERES, und es steht in E515 als Zusage:
     „der Knopf zeigt nicht ‚Formen', sondern WELCHE Form gerade gewählt
     ist". Der Knopf auf dem Blatt hält das. Seine KOPIE in der oberen
     Studioleiste hielt es nicht:

       im Dock gewählt      oben: data-sym          oben: data-form
       ──────────────────   ────────────────────    ────────────────
       Dreieck              inkShapes               (keins)
       Kurve                inkShapes               (keins)
       Ellipse              inkShapes               (keins)

     Im Studio ist die obere Reihe die EINZIGE sichtbare Werkzeugreihe
     (E573) — die Auskunft, für die dieser Knopf da ist, fehlte also genau
     dort, wo gezeichnet wird. */
  await werkzeug('formen');
  const obenZeichen = async (): Promise<{ sym: string; form: string; titel: string }> =>
    await page.evaluate(`(() => {
      const b = document.querySelector('.document-drawingbar [data-document-tool="formen"]');
      const z = b ? b.querySelector('[data-sym]') : null;
      return { sym: (z && z.getAttribute('data-sym')) || '—',
               form: (b && b.getAttribute('data-form')) || '—',
               titel: (b && b.getAttribute('title')) || '' };
    })()`) as { sym: string; form: string; titel: string };
  for (const [id, sym] of [['triangle', 'formTriangle'], ['curve', 'formCurve'],
                           ['ellipse', 'formEllipse'], ['line', 'formLine']] as const) {
    await page.locator(`.document-stage[data-aktiv] .blatt-werk [data-act="formart"][data-form="${id}"]`).click();
    await page.waitForTimeout(260);
    const o = await obenZeichen();
    check(`Oben steht das Zeichen der gewählten Form („${id}")`, o.sym === sym);
    check(`… und die Kopie sagt auch im Attribut, welche es ist („${id}")`, o.form === id);
    /* NICHT NUR DAS BILD, AUCH DAS WORT: wer die Maus darauf hält oder
       einen Vorleser benutzt, hört sonst dreimal „Form" (§38). */
    check(`… und der Titel nennt sie beim Namen („${id}")`,
      o.titel !== 'Form' && o.titel.length > 4);
  }
  /* GEZEICHNET, NICHT GETIPPT (E515): ein „△" als Textzeichen sähe in einer
     Reihe gezeichneter Werkzeuge aus wie ein Fremdkörper. */
  check('Das Zeichen oben ist ein gezeichnetes SVG, kein Textzeichen',
    await page.evaluate(`(() => {
      const b = document.querySelector('.document-drawingbar [data-document-tool="formen"]');
      return !!(b && b.querySelector('svg') && (b.textContent || '').trim() === '');
    })()`));
  /* UND DIE ANDEREN ZWÖLF BLEIBEN, WAS SIE WAREN. Eine Spiegelung, die
     jedem Knopf sein Zeichen umschreibt, wäre schlimmer als gar keine —
     `test480` misst die dreizehn Silhouetten gegeneinander. */
  check('Die übrigen Werkzeuge behalten ihr eigenes Zeichen',
    await page.evaluate(`(() => {
      const soll = { stift:'inkPen', radierer:'inkEraser', select:'inkLasso', laser:'inkLaser' };
      return Object.keys(soll).every(id => {
        const b = document.querySelector('.document-drawingbar [data-document-tool="'+id+'"]');
        const z = b ? b.querySelector('[data-sym]') : null;
        return !!z && z.getAttribute('data-sym') === soll[id];
      });
    })()`));

  /* ══ §12 DAS STILBLATT REGIERTE DAS ZEICHEN NICHT (E585) ═════════════════
     Plan 7 C 2: „Symbole im Dock ca. 24–28 px innerhalb fester 44-px-
     Trefferflächen."

     GEMESSEN am 15. September 2026 waren es 18 px — und zwar ÜBERALL,
     gleichgültig, was das Stilblatt sagte:

       Zustand          Hülle laut CSS   SVG-Attribut   SVG laut CSS
       ──────────────   ──────────────   ────────────   ────────────
       1440 unten             16 px           18            18 px
       1440 links/rechts      20 px           18            18 px
        390 unten             18 px           18            18 px
        390 links/rechts      20 px           18            18 px

     `Register.symbole.fuelle` schreibt `width="18" height="18"` als
     Attribut in das `<svg>`. Das Stilblatt bemasst aber die HÜLLE
     (`.zeichen[data-sym]`), nicht das SVG darin — und ein SVG mit eigener
     Breite kümmert sich nicht darum, wie breit sein Kasten ist.

     Damit war jede der vier Zahlen im Stilblatt Zierde: die 16 liess das
     Zeichen zwei Pixel über seine Hülle stehen, die 20 für die seitliche
     Leiste hat nie etwas getan. Nur die 18 stimmte — weil sie zufällig die
     Zahl ist, die im Attribut steht.

     DIE OBERE LEISTE MACHT ES SEIT JE RICHTIG: `.document-drawingbar
     svg{width:25px}` bemasst das SVG selbst, und dort sind es gemessen
     auch 25 px. Genau dieselbe Stelle, zwei Wege, ein Ergebnis mehr.

     Das ist die Warnung aus §39 in neuer Gestalt: eine CSS-Zeile, die
     aussieht wie eine Regel und keine ist. Drei von vier Zahlen waren es. */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  const zeichenMass = async (): Promise<{ huelle: number; svg: number; knopf: number;
                                          attribut: string; n: number }> =>
    await page.evaluate(`(() => {
      const knoepfe = Array.from(document.querySelectorAll('.document-stage[data-aktiv] .blatt-werk > button'))
        .filter(n => n.getClientRects().length && n.querySelector('.zeichen[data-sym] svg'));
      const b = knoepfe[0];
      if (!b) return { huelle: 0, svg: 0, knopf: 0, attribut: '—', n: 0 };
      const sp = b.querySelector('.zeichen[data-sym]'), svg = sp.querySelector('svg');
      const px = (v) => Math.round(parseFloat(v) || 0);
      return { huelle: px(getComputedStyle(sp).width), svg: px(getComputedStyle(svg).width),
               knopf: Math.round(b.getBoundingClientRect().width),
               attribut: svg.getAttribute('width') || '—', n: knoepfe.length };
    })()`) as { huelle: number; svg: number; knopf: number; attribut: string; n: number };

  const handy = await zeichenMass();
  check(`Am Telefon steht das Zeichen in einer 44-px-Fläche (${handy.knopf} px, ${handy.n} Knöpfe)`,
    handy.knopf >= 44 && handy.n >= 5);
  check(`… und ist 24 bis 28 px gross (gemessen ${handy.svg} px)`,
    handy.svg >= 24 && handy.svg <= 28);
  /* DER KERN DES FUNDES: Hülle und Zeichen müssen dieselbe Zahl sein.
     Gingen sie auseinander, regierte wieder das Attribut. */
  check(`… und die Hülle sagt dieselbe Zahl (${handy.huelle} px gegen ${handy.svg} px)`,
    handy.huelle === handy.svg);
  check(`… obwohl im Attribut weiter „${handy.attribut}" steht`,
    handy.attribut === '18' && handy.svg !== 18);

  await page.evaluate(`(() => { const r = document.querySelector('.document-stage[data-aktiv] .blatt-reihe');
    if (r) r.dataset.lage = 'links'; })()`);
  await page.waitForTimeout(350);
  const seite = await zeichenMass();
  check(`An der Seite ebenso (${seite.svg} px in ${seite.knopf} px)`,
    seite.svg >= 24 && seite.svg <= 28 && seite.huelle === seite.svg);
  await page.evaluate(`(() => { const r = document.querySelector('.document-stage[data-aktiv] .blatt-reihe');
    if (r) r.dataset.lage = 'unten'; })()`);
  await page.waitForTimeout(350);

  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(700);
  const rechner = await zeichenMass();
  /* UND DIE ENGE RECHNERZEILE WÄCHST NICHT MIT. Dort stehen die Wörter
     neben den Zeichen, und dort sind 44-px-Flächen nicht die Regel — die
     Stiftknöpfe sind mit gutem Grund 32 px breit (E576, Arithmetik des
     Umbruchs). Ein 24-px-Zeichen würde sie aufblähen. */
  check(`Am Rechner bleibt das Zeichen klein (${rechner.svg} px in ${rechner.knopf} px)`,
    rechner.svg <= 20 && rechner.huelle === rechner.svg);

  /* DIE QUELLE, damit die Zahl nicht wieder von der Hülle abkoppelt: das
     SVG bekommt seine Grösse VON der Hülle, nicht als eigene Zahl. */
  const stilB = lies('quell/schale/stil/bausteine.css')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  check('Das Stilblatt gibt dem SVG die Grösse seiner Hülle',
    /\.blatt-werk \.zeichen\[data-sym\] svg\{[^}]*width:\s*100%/.test(stilB));

  /* ══ §13 EIN PFEIL AUS EINER SCHRIFT IST KEIN ZEICHEN (E586) ═════════════
     Plan 7 B 7: „History … hat aber noch die alten Toolbar-Styles."
     Plan 7 C 1: „Einheitliches SVG-Register nutzen; keine zweite lose
     Icon-Sammlung neben ihm."

     GEMESSEN am 15. September 2026, alle sichtbaren Knöpfe des Studios mit
     einem Zeichen statt eines Wortes:

       „↶"  ink-undo   28 px Schrift, kein SVG
       „↷"  ink-redo   28 px Schrift, kein SVG
       „🔍" find       12 px Schrift, kein SVG
       „☷"  view       12 px Schrift, kein SVG
       „+"  zwei Stück · „⋮⋮" Griff — die bleiben Text, sie sind Zeichen
                                      im Wortsinn und kein Bild

     Vier Knöpfe trugen also Schriftzeichen, während alle dreizehn Werkzeuge
     daneben gezeichnete SVGs tragen. Das Register sagt seit E272 selbst,
     warum das zu wenig ist: „ein Pfeil, der aus einer Schrift kommt, sieht
     auf jedem System anders aus und trägt nicht die Farbe seiner Zeile."
     Und die Zeichen `undo`, `redo`, `search`, `eye` liegen dort seither
     bereit — sie wurden nur nie geholt.

     DER STIL DER KAPSEL kam von daher: `font-size:1.75rem` steht nur da,
     um ein Textzeichen gross zu machen. Das ist der „alte Toolbar-Style"
     aus B 7. */
  const zeichenKnopf = async (sel: string): Promise<{ da: boolean; svg: boolean; text: string;
                                                     sym: string; gr: number; knopf: number }> =>
    await page.evaluate(`(() => {
      const b = document.querySelector('${sel}');
      if (!b) return { da: false, svg: false, text: '', sym: '', gr: 0, knopf: 0 };
      const svg = b.querySelector('svg'), sp = b.querySelector('[data-sym]');
      return { da: true, svg: !!svg, text: (b.textContent || '').trim(),
               sym: sp ? (sp.getAttribute('data-sym') || '') : '',
               gr: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
               knopf: Math.round(b.getBoundingClientRect().width) };
    })()`) as { da: boolean; svg: boolean; text: string; sym: string; gr: number; knopf: number };

  for (const [sel, sym, name] of [
    ['.document-ink-history [data-document-action="ink-undo"]', 'undo', 'Zurück'],
    ['.document-ink-history [data-document-action="ink-redo"]', 'redo', 'Vor'],
    ['.document-topbar [data-document-action="find"]', 'search', 'Suchen'],
    ['.document-topbar [data-document-action="view"]', 'eye', 'Ansicht']] as const) {
    const k = await zeichenKnopf(sel);
    check(`„${name}" trägt ein gezeichnetes Zeichen, kein Schriftzeichen`,
      k.da && k.svg && k.text === '');
    check(`… und zwar „${sym}" aus dem Register`, k.sym === sym);
  }
  /* DIE KAPSEL IST EINE FESTE 44-PX-FLÄCHE (§37) — dort gilt dieselbe
     Grösse wie im Dock am Telefon (E585). */
  const zurueck = await zeichenKnopf('.document-ink-history [data-document-action="ink-undo"]');
  check(`In der Kapsel ist das Zeichen 24 bis 28 px (gemessen ${zurueck.gr} px in ${zurueck.knopf} px)`,
    zurueck.gr >= 24 && zurueck.gr <= 28 && zurueck.knopf >= 44);
  /* UND ABGESCHALTET BLEIBT ES BLASS, NICHT DURCHSICHTIG (E396, test393 §3):
     sonst blitzen beim Rollen die Werkzeuge darunter durch. Ein SVG mit
     `currentColor` erbt die blasse Farbe — ein Bild mit eigener Farbe
     täte es nicht, und genau das wäre hier der stille Rückschritt. */
  const blass = await page.evaluate(`(() => {
    const b = document.querySelector('.document-ink-history [data-document-action="ink-undo"]');
    if (!b) return { aus: false, deckung: '0', farbe: '', strich: '' };
    const svg = b.querySelector('svg');
    return { aus: b.disabled, deckung: getComputedStyle(b).opacity,
             farbe: getComputedStyle(b).color,
             strich: svg ? getComputedStyle(svg).stroke : '' };
  })()`) as { aus: boolean; deckung: string; farbe: string; strich: string };
  check('Abgeschaltet ist die Kapsel blass, nicht durchsichtig',
    blass.aus && blass.deckung === '1');
  check(`… und das Zeichen nimmt dieselbe blasse Farbe (${blass.strich})`,
    blass.strich === blass.farbe && blass.strich !== '');
  /* DIE QUELLE: kein `font-size` mehr, das nur ein Textzeichen gross macht. */
  const stilC = lies('quell/schale/stil/pdf-studio.css')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  check('Die Kapsel bläht kein Schriftzeichen mehr auf',
    !/\.document-ink-history button\{font-size/.test(stilC));

  /* ══ §14 SCHMAL HEISST ROLLEN, NICHT WEGLASSEN (E587) ════════════════════
     Plan 7 B 2, zweiter Satz: „Werkzeuge/Extras nicht still entfernen, wenn
     der Bildschirm zu schmal ist."

     GEMESSEN am 15. September 2026, das Stift-Dock bei vier Breiten:

       Fenster   Dock     Rollinhalt   im Sichtfenster   Kinder da
       ───────   ──────   ──────────   ───────────────   ─────────
       1440 px   941 px      939 px         18 von 18       18
       1024 px   941 px      939 px         18 von 18       18
        768 px   736 px      939 px         15 von 18       18
        390 px   358 px      918 px          7 von 18       18

     Es wird also nichts weggelassen — es rollt. §9 misst, dass man das
     SIEHT; dieser Abschnitt misst, dass es überhaupt noch DA ist, und dass
     man auch wirklich hinkommt.

     WARUM DAS EINE ZUSICHERUNG BRAUCHT, obwohl es heute stimmt: die
     billigste Art, eine zu breite Leiste schmal zu machen, ist eine
     Medienabfrage mit `display:none`. Sie sieht im Quelltext harmlos aus,
     und am Rechner merkt sie niemand. Genau das ist bei den Pastellfarben
     schon einmal andersherum passiert (E574): eine Gruppe, die überall
     stand, weil niemand nachsah, wo sie stehen sollte.

     DIE GEGENPROBE HAT BEIM ERSTEN MAL NICHTS GETAN, und das ist selbst ein
     Fund: `.blatt-werk > [data-gruppe="stil"]{display:none}` in einer
     Medienabfrage blieb wirkungslos, weil der Katalog aus E356 mit
     `.blatt-werk[data-tool] > …` eine Stufe höher steht. Erst mit
     derselben Stufe fiel die Zahl bei 390 px von 18 auf 12 — dieselbe
     Falle wie in E585, nur andersherum. */
  const dockBei = async (breite: number, hoehe: number) => {
    await page.setViewportSize({ width: breite, height: hoehe });
    await page.waitForTimeout(650);
    return await page.evaluate(`(() => {
      const w = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
      if (!w) return { da: 0, sichtbar: 0, roll: 0, fenster: 0, versteckt: [] };
      const kinder = Array.from(w.children).filter(k => !k.classList.contains('blatt-trenn'));
      const sicht = (e) => { const s = getComputedStyle(e);
        return s.display !== 'none' && s.visibility !== 'hidden' && e.getClientRects().length > 0; };
      /* Die Gruppenregel aus E356 blendet fremde Gruppen aus — das IST ihr
         Zweck, und deshalb wird hier nicht „alle Kinder" gezählt, sondern
         die Zahl der SICHTBAREN gegen sich selbst bei anderer Breite. */
      return { da: kinder.length, sichtbar: kinder.filter(sicht).length,
               roll: w.scrollWidth, fenster: w.clientWidth, tool: w.dataset.tool || '' };
    })()`) as { da: number; sichtbar: number; roll: number; fenster: number; tool: string };
  };
  await werkzeug('stift');
  const weit = await dockBei(1440, 960);
  const eng = await dockBei(390, 844);
  const mittel = await dockBei(768, 1024);
  check(`Bei 1440 px stehen ${weit.sichtbar} Bedienteile im Dock`, weit.sichtbar >= 15);
  check(`Bei 768 px stehen genauso viele (${mittel.sichtbar})`, mittel.sichtbar === weit.sichtbar);
  check(`Bei 390 px auch (${eng.sichtbar})`, eng.sichtbar === weit.sichtbar);
  check(`… und schmal heisst rollen: ${eng.roll} px Inhalt in ${eng.fenster} px Fenster`,
    eng.roll > eng.fenster + 100 && mittel.roll > mittel.fenster);
  /* UND MAN KOMMT AUCH HIN. Ein Knopf, der im Baum steht, aber nicht
     erreichbar ist, wäre dasselbe wie einer, den es nicht gibt. */
  const letzter = await page.evaluate(`(async () => {
    const w = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
    const kn = Array.from(w.querySelectorAll('button')).filter(b => b.getClientRects().length);
    const ziel = kn[kn.length - 1];
    if (!ziel) return { ok: false, name: '—' };
    ziel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    await new Promise(f => setTimeout(f, 250));
    const r = ziel.getBoundingClientRect(), wr = w.getBoundingClientRect();
    return { ok: r.left >= wr.left - 2 && r.right <= wr.right + 2,
             name: ziel.dataset.act || ziel.dataset.wz || ziel.className.slice(0, 20) };
  })()`) as { ok: boolean; name: string };
  check(`Der letzte Knopf („${letzter.name}") ist durch Rollen erreichbar`, letzter.ok);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(600);

  /* ══ §15 DIE TASTATUR SCHIEBT DAS DOCK NICHT WEG (E588) ══════════════════
     Plan 7 B 8, zweiter Teil: „Kleine Höhe und Bildschirmtastatur
     berücksichtigen."

     WIE MAN DAS OHNE ECHTES GERÄT MISST: gar nicht anders als die App es
     selbst tut. `kern/einstellung/app.ts` liest `window.visualViewport` und
     schreibt daraus drei Werte an die Wurzel — `--visual-bottom`,
     `--visual-height`, `--vh` — und setzt `body.tastatur-offen`, sobald
     unten mehr als 80 px fehlen. Diese vier Signale sind ALLES, was das
     Stilblatt von der Tastatur je erfährt. Wer sie setzt, hat die Tastatur
     für jede Regel, die es gibt.

     GEMESSEN am 15. September 2026, 390 × 844, Tastatur 336 px (iPhone
     hochkant), sichtbar also bis 508:

       ohne Tastatur   Dock 768–830   verdeckt   0 px
                       Kapsel 708–760 verdeckt   0 px
       mit Tastatur    Dock 768–830   verdeckt 322 px   ← ganz dahinter
                       Kapsel 708–760 verdeckt 252 px   ← ganz dahinter

     Die obere Leiste und die Suchzeile stehen weiter richtig — sie sind
     oben. Wer aber auf dem Telefon in eine Haftnotiz oder ein Textfeld
     tippt, verliert damit die ganze Stiftleiste UND „Zurück".

     `.overlay` und die Bottom Sheets rechnen seit je mit `--visual-bottom`.
     Das Studio war der eine Ort, der es nicht tat. */
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(650);
  const tastatur = async (px: number) => {
    await page.evaluate(`(() => {
      const w = document.documentElement;
      if (${px} > 0) {
        w.style.setProperty('--visual-bottom', '${px}px');
        w.style.setProperty('--visual-height', (window.innerHeight - ${px}) + 'px');
        w.style.setProperty('--vh', ((window.innerHeight - ${px}) * 0.01) + 'px');
        document.body.classList.add('tastatur-offen');
      } else {
        w.style.removeProperty('--visual-bottom');
        w.style.removeProperty('--visual-height');
        w.style.removeProperty('--vh');
        document.body.classList.remove('tastatur-offen');
      }
    })()`);
    await page.waitForTimeout(400);
    return await page.evaluate(`(() => {
      const unten = parseFloat(getComputedStyle(document.documentElement)
        .getPropertyValue('--visual-bottom')) || 0;
      const bis = window.innerHeight - unten;
      const mess = (sel) => { const n = document.querySelector(sel);
        if (!n || !n.getClientRects().length) return { da: false, verdeckt: 0, unten: 0 };
        const r = n.getBoundingClientRect();
        return { da: true, unten: Math.round(r.bottom),
                 verdeckt: Math.max(0, Math.round(r.bottom - bis)) }; };
      return { bis, dock: mess('.document-stage[data-aktiv] .blatt-reihe'),
               kapsel: mess('.document-ink-history'),
               oben: mess('.document-drawingbar') };
    })()`) as { bis: number;
                dock: { da: boolean; verdeckt: number; unten: number };
                kapsel: { da: boolean; verdeckt: number; unten: number };
                oben: { da: boolean; verdeckt: number; unten: number } };
  };
  const ohne = await tastatur(0);
  check(`Ohne Tastatur steht das Dock am unteren Rand (${ohne.dock.unten} von ${ohne.bis})`,
    ohne.dock.da && ohne.dock.verdeckt === 0 && ohne.dock.unten > ohne.bis - 60);
  const mit = await tastatur(336);
  check(`Mit Tastatur bleibt das Dock sichtbar (verdeckt ${mit.dock.verdeckt} px, war 322)`,
    mit.dock.da && mit.dock.verdeckt === 0);
  check(`… und „Zurück/Vor" auch (verdeckt ${mit.kapsel.verdeckt} px, war 252)`,
    mit.kapsel.da && mit.kapsel.verdeckt === 0);
  check('… und die obere Leiste stand ohnehin richtig',
    mit.oben.da && mit.oben.verdeckt === 0);
  /* DER GEGENFALL, damit nicht einfach immer angehoben wird: ohne Tastatur
     muss das Dock wieder ganz unten stehen. Eine Leiste, die dauerhaft
     336 px über dem Rand schwebt, wäre die schlechtere Hälfte des Tauschs. */
  const wieder = await tastatur(0);
  check(`Und nach dem Schliessen steht es wieder unten (${wieder.dock.unten})`,
    Math.abs(wieder.dock.unten - ohne.dock.unten) <= 2);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(600);

  /* ══ §16 DAS LINEAL BLEIBT IM BILD (E591) ════════════════════════════════
     Abschnitt 8 des Übergabeplans: „`InkRuler` begrenzt die Lage an den
     Dokumentmaßen. Bei Zoom kann das Lineal außerhalb des sichtbaren
     Ausschnitts stehen; sinnvollen Erstplatz prüfen."

     GEMESSEN am 15. September 2026, Lineal an, dann gezoomt. „Sichtbarer
     Anteil" ist die Fläche des Lineals, die im Rollfenster liegt:

       1440 × 960    60 %  →  100 %   Griff erreichbar
                    100 %  →  100 %   Griff erreichbar
                    140 %  →    1 %   Griff NICHT erreichbar
                    180 %  →    0 %   Griff NICHT erreichbar
        390 × 844   140 %  →   83 %   Griff NICHT erreichbar
                    180 %  →   63 %   Griff NICHT erreichbar

     Die Ursache steht in `ink-ruler.ts`: `y = min(height * .4, width * .65)`
     — vier Zehntel der BLATThöhe. Beim Zoom ist das Blatt höher als das
     Fenster, der Blick steht oben, und vier Zehntel liegen darunter.

     Ein Lineal, dessen Griff man nicht erreicht, ist kein Werkzeug. */
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(600);
  await werkzeug('stift');
  await page.locator('[data-document-action="ink-ruler"]').click();
  await page.waitForTimeout(500);
  const linealBei = async (prozent: number) => {
    await page.evaluate(`(() => { const s = document.querySelector('[data-document-zoom]');
      if (s) { s.value = '${prozent}'; s.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
    await page.waitForTimeout(650);
    return await page.evaluate(`(() => {
      const g = document.querySelector('.document-stage[data-aktiv] [data-ink-ui="ruler"]');
      const mitte = document.querySelector('.document-center');
      if (!g || !mitte) return { da: false, anteil: 0, griffDrin: false };
      const r = g.getBoundingClientRect(), m = mitte.getBoundingClientRect();
      const griff = g.querySelector('circle');
      const gr = griff ? griff.getBoundingClientRect() : null;
      const schnitt = Math.max(0, Math.min(r.right, m.right) - Math.max(r.left, m.left))
                    * Math.max(0, Math.min(r.bottom, m.bottom) - Math.max(r.top, m.top));
      return { da: true,
               anteil: r.width * r.height > 0 ? Math.round(100 * schnitt / (r.width * r.height)) : 0,
               griffDrin: !!gr && gr.left >= m.left && gr.right <= m.right
                          && gr.top >= m.top && gr.bottom <= m.bottom };
    })()`) as { da: boolean; anteil: number; griffDrin: boolean };
  };
  for (const z of [60, 100, 140, 180]) {
    const l = await linealBei(z);
    check(`Bei ${z} % Zoom liegt das Lineal im Bild (${l.anteil} %)`, l.da && l.anteil >= 60);
    check(`… und sein Drehgriff ist erreichbar (${z} %)`, l.griffDrin);
  }
  await linealBei(100);
  await page.locator('[data-document-action="ink-ruler"]').click();
  await page.waitForTimeout(300);

  /* ══ §17 DIE RADIERERGRÖSSE LÄSST DIE TINTE IN RUHE (E591) ═══════════════
     Abschnitt 8 des Übergabeplans: „Neue Studio-Radierergröße wird zunächst
     auf klein gesetzt. Prüfen, ob sie zwischen Seiten wie erwartet bleibt.
     Sie darf die Tintenbreite nicht ändern."

     ZWEI DRITTEL DAVON HÄLT SCHON §3 weiter oben: drei Grössen mit ihren
     Kreisen, die Wahl gilt sofort, und sie überlebt den Wechsel auf ein
     ANDERES Dokument. Hier steht nur, was dort nicht steht:

       · die Tintenbreite bleibt, wo sie war — der Satz aus dem Plan, den
         bisher niemand gemessen hat;
       · und die Wahl überlebt auch den Wechsel auf die nächste SEITE
         desselben Dokuments. Das ist nicht dasselbe: der Zeichner wird je
         Blatt neu gebaut, die Wahl liegt in `meta` (E576).

     Nachgemessen am 15. September 2026, und beides stimmte:

       Radierer an      meta null · gewählt 5  · Strich 2,4
       gross gewählt    meta 28   · gewählt 28 · Strich 2,4
       zurück zum Stift meta 28   · gewählt 28 · Strich 2,4
       Seite 2          meta 28   · gewählt 28 · Strich 2,4

     Eine Zusage ohne Wächter ist eine Behauptung — deshalb steht sie jetzt
     hier, obwohl sie grün ist. */
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.waitForTimeout(600);
  const radierStand = async () => await page.evaluate(`(() => {
    const w = document.querySelector('.document-stage[data-aktiv] .blatt-werk');
    const gr = w ? Array.from(w.querySelectorAll('.blatt-eraser-size')) : [];
    const strich = w ? Array.from(w.querySelectorAll('.blatt-strich')) : [];
    const an = gr.find(b => b.getAttribute('aria-pressed') === 'true');
    const dick = strich.find(b => b.classList.contains('on'));
    return { anzahl: gr.length, gewaehlt: an ? an.getAttribute('data-eraser-size') : null,
             markiert: gr.filter(b => b.getAttribute('aria-pressed') === 'true').length,
             strich: dick ? dick.getAttribute('data-b') : null };
  })()`) as { anzahl: number; gewaehlt: string | null; markiert: number; strich: string | null };
  await werkzeug('radierer');
  await page.waitForTimeout(400);
  const rad0 = await radierStand();
  check(`Genau eine der drei Grössen ist markiert (${rad0.gewaehlt})`,
    rad0.anzahl === 3 && rad0.markiert === 1);
  const tinteVorher = rad0.strich;
  /* Auf die andere Grösse wechseln — welche, ist gleich; es geht um den
     Wechsel selbst. */
  const andere = rad0.gewaehlt === '28' ? '5' : '28';
  await page.locator(`.document-stage[data-aktiv] [data-eraser-size="${andere}"]`).click();
  await page.waitForTimeout(400);
  const rad1 = await radierStand();
  check(`Die Markierung wandert mit (${rad0.gewaehlt} → ${rad1.gewaehlt})`,
    rad1.gewaehlt === andere && rad1.markiert === 1);
  check(`… und die Markierung der Strichstärke bleibt stehen (${tinteVorher} → ${rad1.strich})`,
    !!tinteVorher && rad1.strich === tinteVorher);
  /* ══ UND JETZT DIE ECHTE TINTE, NICHT DER KNOPF ══════════════════════════
     Die Zeile darüber las die Markierung in der Leiste — und die wird vom
     Klick auf die Strichknöpfe gesetzt, nicht vom Zeichner. GEGENGEPROBT
     am 15. September 2026: liess man `setEraserSize` zusätzlich
     `setzeStrich(radius / 10)` rufen, blieb die Zusicherung GRÜN, während
     jeder neue Strich 0,5 statt 2,4 breit wurde. Eine Zusicherung, die den
     Fehler nicht sehen kann, ist keine (§55.2).
     Gemessen wird deshalb ein wirklich gezogener Strich. */
  await werkzeug('stift');
  await page.waitForTimeout(300);
  const zieheStrich = async (y: number): Promise<number | null> => {
    const flaeche = page.locator('.document-stage[data-aktiv] .blatt-marken');
    const box = await flaeche.boundingBox();
    if (!box) return null;
    await page.mouse.move(box.x + 60, box.y + y);
    await page.mouse.down();
    await page.mouse.move(box.x + 180, box.y + y, { steps: 6 });
    await page.mouse.up();
    await page.waitForTimeout(450);
    /* DEN BLOCK ÜBER DIE SEITE FINDEN, nicht über ein Attribut an der Bühne
       — welches das wäre, weiss diese Datei nicht, und raten wäre genau der
       Fehler aus E21. `App.aktuelleSeite()` sagt es. */
    return await page.evaluate(`(() => {
      const seite = App.aktuelleSeite && App.aktuelleSeite();
      if (!seite) return null;
      const blaetter = Store.childrenOf(seite).filter(k => k.type === 'blatt');
      let letzte = null;
      for (const bl of blaetter) {
        const m = Array.isArray(bl.marken) ? bl.marken : [];
        if (m.length) letzte = m[m.length - 1];
      }
      return letzte && Number.isFinite(Number(letzte.breite)) ? Number(letzte.breite) : null;
    })()`) as number | null;
  };
  const breiteVorher = await zieheStrich(120);
  await werkzeug('radierer');
  await page.waitForTimeout(300);
  await page.locator(`.document-stage[data-aktiv] [data-eraser-size="${rad0.gewaehlt}"]`).click();
  await page.waitForTimeout(350);
  await werkzeug('stift');
  await page.waitForTimeout(300);
  const breiteNachher = await zieheStrich(160);
  check(`Ein gezogener Strich ist danach genauso breit (${breiteVorher} → ${breiteNachher})`,
    breiteVorher !== null && breiteNachher !== null && breiteVorher === breiteNachher);
  await werkzeug('radierer');
  await page.waitForTimeout(300);
  await page.locator(`.document-stage[data-aktiv] [data-eraser-size="${andere}"]`).click();
  await page.waitForTimeout(300);
  /* ÜBER DIE SEITE HINWEG, nicht über das Dokument: der Zeichner ist je
     Blatt neu, die Wahl nicht. */
  await page.evaluate(`(() => { const b = document.querySelector('[data-document-action="next"]');
    if (b) b.click(); })()`);
  await page.waitForTimeout(900);
  await werkzeug('radierer');
  await page.waitForTimeout(400);
  const rad3 = await radierStand();
  check(`Und auf der nächsten Seite führt weiter dieselbe (${rad3.gewaehlt})`,
    rad3.gewaehlt === andere);
  await page.evaluate(`(() => { const b = document.querySelector('[data-document-action="previous"]');
    if (b) b.click(); })()`);
  await page.waitForTimeout(800);

  await werkzeug('stift');
  check('Keine Laufzeitfehler', errors.length === 0);
  mkdirSync(resolve(root, 'bilder'), { recursive: true });
  /* Der Name sagte „before" und zeigte den Nachher-Stand — ein Bild, dessen
     Name lügt, ist schlimmer als keines (§55.4). */
  await page.screenshot({ path: resolve(root, 'bilder/zeichenstudio-dock.png') });
} finally { await browser.close(); server.close(); }
console.log(`\n${passed} grün, ${failed} rot`);
process.exitCode = failed ? 1 : 0;
