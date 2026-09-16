/* Suite 529 — Die Gedankenkarte (E607)
 * ============================================================================
 * REDURS SATZ, 16. September 2026: „Ich will bei Redion auch das XMind
 * erstellen können." Dazu drei Bilder — eine Karte mit Ästen nach beiden
 * Seiten, eine bunte Karte mit Querverbindungen, und die Ein-/Ausgabetafel
 * von ConceptDraw.
 *
 * DIESER LAUF HÄLT DEN ERSTEN BOGEN: die Karte selbst. Querverbindungen,
 * Marker und die fremden Formate stehen als L177 und L178 in `LUECKEN.md`
 * und sind ausdrücklich NICHT Gegenstand dieses Laufs.
 *
 * §1  DIE BLOCKART GIBT ES und das Slash-Menü findet sie unter „xmind".
 * §2  EIN FRISCHER BLOCK zeichnet eine Karte mit genau einem Knoten.
 * §3  DER AUFBAU MISST, ER SCHÄTZT NICHT — die Linie beginnt exakt an der
 *     gemessenen Kante des Knotens. Das ist die Zusicherung gegen L173.
 * §4  TAB legt ein Unterthema an, ENTER eines daneben.
 * §5  DER GETIPPTE TEXT steht danach im Block, nicht nur am Bildschirm.
 * §6  ENTF nimmt den ganzen Ast — die Wurzel bleibt stehen.
 * §7  ZURÜCK holt den Ast in EINEM Schritt zurück (§51).
 * §8  ZUKLAPPEN verbirgt die Kinder und zeigt ihre ZAHL, nicht nur ein Dreieck.
 * §9  KAPUTTE DATEN verschwinden nicht: ein Ring und ein ins Leere zeigender
 *     Elternteil landen an der Wurzel, statt ungezeichnet zu bleiben (§9).
 * §10 JEDER AST HAT SEINE FARBE, und die Kinder erben sie.
 * §11 DIE KARTE SPRINGT NICHT, wenn sie nach links wächst.
 * §12 §37: die Leistenknöpfe haben 44 px Trefffläche — am Telefon sind sie
 *     der einzige Weg, ein Unterthema anzulegen.
 * §13 §19: Text bleibt Text. Ein Knoten mit `<img onerror>` erzeugt kein Bild.
 * §14 EINE ECHTE `.redion`-RUNDE: sichern, alles löschen, zurückholen,
 *     die Karte vergleichen (§13, §50).
 * §15 Und nichts ist dabei kaputtgegangen.
 *
 * DIE GEGENPROBE (§55.2). Gegen den Stand vor E607 ist alles rot, weil es
 * die Blockart nicht gab — das ist kein Kunststück und beweist nichts über
 * die einzelne Zusicherung. Zwei wurden deshalb EINZELN rot gesehen:
 *
 *   §3  Die Messung im Zeichner wurde durch die naive Schätzung ersetzt
 *       (`7 px je Zeichen + 26`). Gemessen: die Wurzel endet bei 101 px, die
 *       Linie begänne bei 89 — zwölf Pixel daneben, und senkrecht sechs.
 *       Beide Zusicherungen wurden rot.
 *   §11 Der Ausgleich der Wurzelwanderung wurde herausgenommen. Gemessen:
 *       die Wurzel sprang von x=770,5 auf x=1054,5 — 284 Pixel, weil ein
 *       breites Unterthema auf der linken Seite dazukam.
 *
 * UND EINE, DIE NICHTS HÄLT: „Der lange Zweig ist breiter als der kurze"
 * blieb in beiden Gegenproben grün. Das ist ehrlich aufgeschrieben, statt
 * sie mitzuzählen — auch eine Schätzung macht einen längeren Text breiter.
 * Was die Schätzung entlarvt, ist die Zusicherung darunter.
 * ==========================================================================*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
declare const Store: any;
declare const App: any;
declare const Register: any;
declare const Einlesen: any;
declare const Dateien: any;
declare const Gedankenkarte: any;

const root = resolve(import.meta.dirname, '../..');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((request, response) => {
  const file = resolve(root, '.' + (request.url?.split('?')[0] || '/index.html'));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404).end(); return;
  }
  response.setHeader('Content-Type', (types[extname(file)] || 'application/octet-stream') + '; charset=utf-8');
  response.end(readFileSync(file));
});
await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
const port = (server.address() as { port: number }).port;
const browser = await chromium.launch();
let failed = 0, passed = 0;
const pr = (name: string, value: unknown, zusatz = ''): void => {
  value ? passed++ : failed++;
  console.log((value ? '  ✓ ' : '  ✗ ') + name + (value || !zusatz ? '' : ' — ' + zusatz));
};
const gleich = (name: string, ist: unknown, soll: unknown): void =>
  pr(name, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const errors: string[] = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  await page.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await page.waitForTimeout(500);

  /* ---------------------------------------------------------------------- */
  console.log('\n1 · Die Blockart gibt es, und man findet sie');
  const registriert = await page.evaluate(() => {
    const alle = Register.bloecke.alle ? Register.bloecke.alle() : Register.bloecke.liste;
    const eintrag = (alle as any[]).find(b => b.id === 'mindmap');
    return eintrag ? { name: eintrag.name, gruppe: eintrag.gruppe, cmd: eintrag.cmd } : null;
  });
  pr('`mindmap` steht im Blockregister', !!registriert, JSON.stringify(registriert));
  gleich('… auf Deutsch, wie jeder Text für Menschen (§3)', registriert?.name, 'Gedankenkarte');
  gleich('… in der Gruppe Wissen', registriert?.gruppe, 'Wissen');
  pr('… und wer „xmind" tippt, findet sie',
    (registriert?.cmd ?? []).includes('xmind'), JSON.stringify(registriert?.cmd));
  pr('Der Zeichner ist geladen', await page.evaluate(() => typeof Gedankenkarte === 'object'));

  /* ---------------------------------------------------------------------- */
  console.log('\n2 · Ein frischer Block zeichnet eine Karte mit einem Knoten');
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(node => node.remove());
    const seite = Store.addPage(null, { text: 'Kartenprobe', icon: '🧠' });
    const blk = Store.addBlock(seite.id, 'mindmap', {});
    await Store.flush();
    App.oeffne(seite.id);
    return { seite: seite.id, blk: blk.id };
  });
  await page.waitForSelector('.gk-buehne');
  const frisch = await page.evaluate(() => ({
    knoten: document.querySelectorAll('.gk-kn').length,
    wurzeln: document.querySelectorAll('.gk-kn.gk-wurzel').length,
    text: document.querySelector('.gk-wurzel .gk-txt')?.textContent ?? '',
    rolle: document.querySelector('.gk-buehne')?.getAttribute('role') ?? '',
    treeitem: document.querySelector('.gk-kn')?.getAttribute('role') ?? '',
  }));
  gleich('Genau ein Knoten', frisch.knoten, 1);
  gleich('… und der ist die Wurzel', frisch.wurzeln, 1);
  gleich('… mit einem Text, den man lesen kann', frisch.text, 'Zentrales Thema');
  /* UND WER SCHON ETWAS GESCHRIEBEN HAT, VERLIERT ES NICHT. Wandelt man
     einen Absatz in eine Gedankenkarte um, wird sein Text das zentrale
     Thema — sonst stünde da „Zentrales Thema" und der Satz wäre weg (§18:
     Blöcke müssen sich ohne Datenverlust umwandeln lassen). */
  gleich('Der Text eines umgewandelten Blocks wird das zentrale Thema',
    await page.evaluate(() => Gedankenkarte.leseKarte({ text: 'Aus einem Absatz' }).knoten[0].text),
    'Aus einem Absatz');
  gleich('Die Bühne ist ein Baum (§38)', frisch.rolle, 'tree');
  gleich('… und der Knoten ein Ast darin', frisch.treeitem, 'treeitem');

  /* ---------------------------------------------------------------------- */
  console.log('\n3 · Der Aufbau misst, statt zu schätzen (gegen L173)');
  await page.evaluate(async ({ blk }) => {
    Store.updateBlock(blk, { karte: { aufbau: 'karte', knoten: [
      { id: 'w', text: 'Mitte', eltern: null },
      { id: 'kurz', text: 'Ja', eltern: 'w', seite: 'rechts' },
      { id: 'lang', text: 'Ein deutlich längerer Zweigtext', eltern: 'w', seite: 'rechts' },
    ] } });
    await Store.flush();
    App.zeichneSeite();
  }, ids);
  await page.waitForTimeout(350);
  const gemessen = await page.evaluate(() => {
    const el = (k: string) => document.querySelector<HTMLElement>(`.gk-kn[data-k="${k}"]`);
    const kurz = el('kurz'), lang = el('lang'), wurzel = el('w');
    if (!kurz || !lang || !wurzel) return null;
    /* Die Linie zur Wurzel beginnt an DEREN rechter Kante. Wenn der Aufbau
       die Breite schätzte, läge der Anfang daneben — genau das ist der Fund
       aus L173, nur hier gemessen statt vermutet. */
    const pfade = [...document.querySelectorAll('.gk-linien path')]
      .map(p => (p.getAttribute('d') || '').match(/^M ([\d.-]+) ([\d.-]+)/))
      .filter(Boolean)
      .map(m => ({ x: Number(m![1]), y: Number(m![2]) }));
    return {
      kurzBreite: kurz.offsetWidth, langBreite: lang.offsetWidth,
      wurzelKante: wurzel.offsetLeft + wurzel.offsetWidth,
      wurzelMitte: wurzel.offsetTop + wurzel.offsetHeight / 2,
      anfaenge: pfade,
    };
  });
  pr('Der lange Zweig ist breiter als der kurze',
    !!gemessen && gemessen.langBreite > gemessen.kurzBreite + 40,
    JSON.stringify(gemessen && { kurz: gemessen.kurzBreite, lang: gemessen.langBreite }));
  pr('Beide Linien beginnen an der gemessenen Kante der Wurzel (± 1 px)',
    !!gemessen && gemessen.anfaenge.length === 2
      && gemessen.anfaenge.every(a => Math.abs(a.x - gemessen.wurzelKante) <= 1),
    JSON.stringify(gemessen && { kante: gemessen.wurzelKante, anfaenge: gemessen.anfaenge }));
  pr('… und auf ihrer Mitte (± 1 px)',
    !!gemessen && gemessen.anfaenge.every(a => Math.abs(a.y - gemessen.wurzelMitte) <= 1),
    JSON.stringify(gemessen && { mitte: gemessen.wurzelMitte, anfaenge: gemessen.anfaenge }));

  /* ---------------------------------------------------------------------- */
  console.log('\n4 · Tab legt ein Unterthema an, Enter eines daneben');
  const karteVon = async (): Promise<any> =>
    await page.evaluate(id => JSON.parse(JSON.stringify(Store.getBlock(id)?.karte ?? null)), ids.blk);

  await page.locator('.gk-kn[data-k="kurz"]').click();
  await page.waitForTimeout(120);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  const nachTab = await page.evaluate(() => ({
    schreibt: !!document.querySelector('.gk-txt.gk-schreibt'),
    fokus: document.activeElement?.className ?? '',
  }));
  pr('Tab öffnet gleich ein Schreibfeld', nachTab.schreibt, JSON.stringify(nachTab));
  pr('… und es hat den Fokus, ohne dass man es anklicken muss',
    nachTab.fokus.includes('gk-txt'), JSON.stringify(nachTab));
  await page.keyboard.type('Unterthema A');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  await page.keyboard.type('Unterthema B');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);

  const nachVier = await karteVon();
  const kinderVon = (k: any, id: string) => (k?.knoten ?? []).filter((n: any) => n.eltern === id);
  gleich('Aus einem Zweig sind zwei Unterthemen geworden',
    kinderVon(nachVier, 'kurz').length, 2);
  pr('… und beide hängen am selben Elternteil',
    kinderVon(nachVier, 'kurz').every((n: any) => n.eltern === 'kurz'),
    JSON.stringify(nachVier?.knoten));

  /* ---------------------------------------------------------------------- */
  console.log('\n5 · Der getippte Text steht im Block, nicht nur am Bildschirm');
  const texte = kinderVon(nachVier, 'kurz').map((n: any) => n.text);
  pr('„Unterthema A" ist angekommen', texte.includes('Unterthema A'), JSON.stringify(texte));
  pr('„Unterthema B" auch', texte.includes('Unterthema B'), JSON.stringify(texte));
  gleich('Am Bildschirm stehen jetzt fünf Knoten',
    await page.evaluate(() => document.querySelectorAll('.gk-kn').length), 5);

  /* ---------------------------------------------------------------------- */
  console.log('\n6 · Entf nimmt den ganzen Ast, die Wurzel bleibt');
  await page.locator('.gk-kn[data-k="kurz"]').click();
  await page.waitForTimeout(120);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(250);
  const nachWeg = await karteVon();
  gleich('Der Zweig und seine zwei Unterthemen sind weg',
    (nachWeg?.knoten ?? []).length, 2);
  pr('Die Wurzel steht noch',
    (nachWeg?.knoten ?? []).some((n: any) => n.id === 'w'), JSON.stringify(nachWeg?.knoten));

  await page.locator('.gk-kn[data-k="w"]').click();
  await page.waitForTimeout(100);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(250);
  gleich('Und die Wurzel selbst lässt sich nicht löschen — eine Karte ohne Mitte gibt es nicht',
    ((await karteVon())?.knoten ?? []).length, 2);

  /* ---------------------------------------------------------------------- */
  console.log('\n7 · Zurück holt den ganzen Ast in einem Schritt');
  await page.locator('.gk-leiste [data-a="zurueck"]').click();
  await page.waitForTimeout(250);
  const nachZurueck = await karteVon();
  gleich('Alle vier Knoten sind wieder da', (nachZurueck?.knoten ?? []).length, 5);
  pr('… samt ihrem Text',
    (nachZurueck?.knoten ?? []).some((n: any) => n.text === 'Unterthema A'),
    JSON.stringify((nachZurueck?.knoten ?? []).map((n: any) => n.text)));

  /* ---------------------------------------------------------------------- */
  console.log('\n8 · Zuklappen verbirgt die Kinder und zeigt ihre Zahl');
  await page.locator('.gk-kn[data-k="kurz"]').click();
  await page.waitForTimeout(120);
  await page.locator('.gk-leiste [data-a="klapp"]').click();
  await page.waitForTimeout(250);
  const zu = await page.evaluate(() => ({
    knoten: document.querySelectorAll('.gk-kn').length,
    zahl: document.querySelector('.gk-kn[data-k="kurz"] .gk-zahl')?.textContent ?? '',
    aria: document.querySelector('.gk-kn[data-k="kurz"]')?.getAttribute('aria-expanded') ?? '',
  }));
  gleich('Die zwei Unterthemen sind nicht mehr gezeichnet', zu.knoten, 3);
  gleich('Die ZAHL steht am Knoten, nicht nur ein Dreieck (§38)', zu.zahl, '2');
  gleich('… und ein Vorleseprogramm erfährt es auch', zu.aria, 'false');
  await page.locator('.gk-leiste [data-a="klapp"]').click();
  await page.waitForTimeout(250);
  gleich('Wieder aufgeklappt sind alle fünf da',
    await page.evaluate(() => document.querySelectorAll('.gk-kn').length), 5);

  /* ---------------------------------------------------------------------- */
  console.log('\n9 · Kaputte Daten verschwinden nicht (§9)');
  const gerettet = await page.evaluate(() => Gedankenkarte.baum({
    aufbau: 'karte',
    sicht: { x: 0, y: 0, z: 1 },
    knoten: [
      { id: 'w', text: 'Mitte', eltern: null },
      { id: 'ok', text: 'Ordentlich', eltern: 'w' },
      { id: 'waise', text: 'Eltern gibt es nicht', eltern: 'gibtesnicht' },
      /* Ein Ring: a hängt an b, b hängt an a. */
      { id: 'a', text: 'Ring A', eltern: 'b' },
      { id: 'b', text: 'Ring B', eltern: 'a' },
    ],
  }));
  const alleKinder: string[] = Object.values<string[]>(gerettet.kinder).flat();
  gleich('Die Wurzel ist erkannt', gerettet.wurzel, 'w');
  gleich('Kein Knoten geht verloren — alle vier hängen irgendwo', alleKinder.length, 4);
  pr('Der ordentliche bleibt, wo er war',
    (gerettet.kinder['w'] ?? []).includes('ok'), JSON.stringify(gerettet.kinder));
  pr('Die Waise hängt an der Wurzel, statt zu verschwinden',
    (gerettet.kinder['w'] ?? []).includes('waise'), JSON.stringify(gerettet.kinder));
  pr('Und der Ring ebenso — sichtbar am falschen Platz ist besser als weg',
    (gerettet.kinder['w'] ?? []).includes('a') && (gerettet.kinder['w'] ?? []).includes('b'),
    JSON.stringify(gerettet.kinder));

  /* ---------------------------------------------------------------------- */
  console.log('\n10 · Jeder Ast hat seine Farbe, und die Kinder erben sie');
  const farben = await page.evaluate(() => {
    const masse: Record<string, { w: number; h: number }> = {};
    const karte = { aufbau: 'karte', sicht: { x: 0, y: 0, z: 1 }, knoten: [
      { id: 'w', text: 'Mitte', eltern: null },
      { id: 'a', text: 'Ast A', eltern: 'w' }, { id: 'a1', text: 'A1', eltern: 'a' },
      { id: 'b', text: 'Ast B', eltern: 'w' }, { id: 'b1', text: 'B1', eltern: 'b' },
      { id: 'c', text: 'Ast C', eltern: 'w' },
    ] };
    karte.knoten.forEach(k => { masse[k.id] = { w: 100, h: 30 }; });
    return Gedankenkarte.aufbauen(karte, masse).farben;
  });
  pr('Die drei Äste tragen drei verschiedene Farben',
    new Set([farben.a, farben.b, farben.c]).size === 3, JSON.stringify(farben));
  gleich('A1 erbt die Farbe von A', farben.a1, farben.a);
  gleich('B1 erbt die Farbe von B', farben.b1, farben.b);
  pr('… und keine davon ist die der Wurzel',
    farben.a !== farben.w && farben.b !== farben.w, JSON.stringify(farben));

  /* ---------------------------------------------------------------------- */
  console.log('\n11 · Die Karte springt nicht, wenn sie nach links wächst');
  await page.evaluate(async ({ blk }) => {
    Store.updateBlock(blk, { karte: { aufbau: 'karte', knoten: [
      { id: 'w', text: 'Mitte', eltern: null },
      { id: 'r', text: 'Rechts', eltern: 'w', seite: 'rechts' },
      { id: 'l', text: 'Links', eltern: 'w', seite: 'links' },
    ] } });
    await Store.flush();
    App.zeichneSeite();
  }, ids);
  await page.waitForTimeout(350);
  const vorher = await page.evaluate(() =>
    document.querySelector('.gk-kn[data-k="w"]')!.getBoundingClientRect().x);
  await page.locator('.gk-kn[data-k="l"]').click();
  await page.waitForTimeout(120);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(150);
  await page.keyboard.type('Ein sehr breites neues Unterthema auf der linken Seite');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const nachher = await page.evaluate(() =>
    document.querySelector('.gk-kn[data-k="w"]')!.getBoundingClientRect().x);
  pr('Die Wurzel steht noch an derselben Stelle (± 2 px)',
    Math.abs(nachher - vorher) <= 2, `vorher ${vorher}, nachher ${nachher}`);

  /* ---------------------------------------------------------------------- */
  console.log('\n12 · 44 px Trefffläche auf den Leistenknöpfen (§37)');
  const treffer = await page.evaluate(() => {
    const knoepfe = [...document.querySelectorAll<HTMLElement>('.gk-leiste button')];
    const hoehen = knoepfe.map(b => getComputedStyle(b, '::after').height);
    return { anzahl: knoepfe.length, hoehen: [...new Set(hoehen)] };
  });
  pr('Die Leiste hat ihre Knöpfe', treffer.anzahl >= 12, String(treffer.anzahl));
  gleich('Und jeder trägt genau eine Trefffläche von 44 px',
    JSON.stringify(treffer.hoehen), JSON.stringify(['44px']));

  /* ---------------------------------------------------------------------- */
  console.log('\n13 · Text bleibt Text (§19)');
  await page.evaluate(async ({ blk }) => {
    Store.updateBlock(blk, { karte: { aufbau: 'karte', knoten: [
      { id: 'w', text: '<img src=x onerror="window.__bumm=1">', eltern: null },
      { id: 'z', text: '<b>fett?</b>', eltern: 'w' },
    ] } });
    await Store.flush();
    App.zeichneSeite();
  }, ids);
  await page.waitForTimeout(350);
  const sicher = await page.evaluate(() => ({
    bilder: document.querySelectorAll('.gk-welt img').length,
    fett: document.querySelectorAll('.gk-welt b').length,
    bumm: (window as any).__bumm ?? null,
    text: document.querySelector('.gk-kn[data-k="z"] .gk-txt')?.textContent ?? '',
  }));
  gleich('Kein Bild ist entstanden', sicher.bilder, 0);
  gleich('Und kein fetter Text', sicher.fett, 0);
  gleich('Nichts ist ausgeführt worden', sicher.bumm, null);
  gleich('Der Knoten zeigt die Zeichen selbst', sicher.text, '<b>fett?</b>');

  /* ---------------------------------------------------------------------- */
  console.log('\n14 · Zwei echte Sicherungsrunden: .json und .redion (§50)');

  /* BEIDE WEGE, NICHT EINER. `sicherungPaketBauen` entscheidet nach den
     Anhängen: ohne sie schreibt es eine schlichte `.json`, mit ihnen ein
     `.redion`-Archiv. Der erste Entwurf dieses Abschnitts kannte nur den
     ZIP-Weg und brach mit „Das ist kein gültiges ZIP-Archiv" ab — er hatte
     gar keinen Anhang angelegt. §50 verlangt ausdrücklich beides. */
  const runde = await page.evaluate(async ({ blk, seite }) => {
    const karteSetzen = () => Store.updateBlock(blk, { karte: {
      aufbau: 'karte', sicht: { x: 12, y: 8, z: 1.25 }, knoten: [
        { id: 'w', text: 'Sicherungsprobe', eltern: null },
        { id: 'a', text: 'Ast mit Farbe', eltern: 'w', farbe: '#d9534f' },
        { id: 'a1', text: 'Kind darunter', eltern: 'a' },
        { id: 'b', text: 'Ast links, zugeklappt', eltern: 'w', seite: 'links', zu: true },
      ] } });

    /** Den echten Weg gehen und den Download abfangen (wie in test100). */
    const sichern = async (): Promise<Blob> => {
      const gefangen: { blob: Blob | null } = { blob: null };
      const echtURL = URL.createObjectURL.bind(URL);
      const echtClick = HTMLAnchorElement.prototype.click;
      (URL as any).createObjectURL = (b: Blob) => { gefangen.blob = b; return 'blob:gefangen'; };
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (this.download) return;
        return echtClick.call(this);
      };
      try { await App.sicherungSpeichern(); }
      finally {
        (URL as any).createObjectURL = echtURL;
        HTMLAnchorElement.prototype.click = echtClick;
      }
      if (!gefangen.blob) throw new Error('Es wurde keine Sicherung geschrieben.');
      return gefangen.blob;
    };

    /* --- Runde 1: ohne Anhänge, also `.json` --- */
    karteSetzen();
    await Store.flush();
    const vorher = JSON.parse(JSON.stringify(Store.getBlock(blk).karte));
    const jsonBlob = await sichern();
    const jsonArt = Store.getMeta('sicherung:art');
    await Store.wipe();
    const leerJson = Object.keys(Store.cache.blocks).length;
    await Store.importAll(await jsonBlob.text(), 'ersetzen');
    const nachJson = Store.getBlock(blk)?.karte ?? null;

    /* --- Runde 2: mit einem echten Anhang, also `.redion` --- */
    const bytes = new Uint8Array(2048);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7) % 256;
    const bild = Store.addBlock(seite, 'image', { text: 'probe.bin' });
    await Dateien.ablegen(new File([bytes], 'probe.bin',
      { type: 'application/octet-stream' }), { blockId: bild.id, name: 'probe.bin' });
    karteSetzen();
    await Store.flush();
    const zipBlob = await sichern();
    const zipArt = Store.getMeta('sicherung:art');
    await Store.wipe();
    const leerZip = Object.keys(Store.cache.blocks).length;
    const zip = await Einlesen.zipLesenAusBlob(zipBlob);
    await Store.importAll(await zip.text('daten.json'), 'ersetzen');
    const nachZip = Store.getBlock(blk)?.karte ?? null;

    return { vorher, jsonArt, leerJson, nachJson, zipArt, leerZip, nachZip, zipNamen: zip.namen };
  }, ids);

  gleich('Ohne Anhänge schreibt Redion eine `.json`', runde.jsonArt, 'json');
  gleich('… und danach war wirklich nichts mehr da', runde.leerJson, 0);
  pr('Die Karte ist aus der `.json` zurück', !!runde.nachJson, JSON.stringify(runde.nachJson));
  gleich('… Zeichen für Zeichen dieselbe',
    JSON.stringify(runde.nachJson), JSON.stringify(runde.vorher));

  gleich('Mit einem Anhang schreibt Redion ein `.redion`', runde.zipArt, 'redion');
  pr('… und der Anhang liegt wirklich darin',
    (runde.zipNamen ?? '').includes('dateien/probe.bin'), JSON.stringify(runde.zipNamen));
  gleich('… und danach war wieder nichts mehr da', runde.leerZip, 0);
  pr('Die Karte ist auch aus dem `.redion` zurück', !!runde.nachZip, JSON.stringify(runde.nachZip));
  gleich('… ebenfalls Zeichen für Zeichen dieselbe',
    JSON.stringify(runde.nachZip), JSON.stringify(runde.vorher));

  /* ---------------------------------------------------------------------- */
  console.log('\n15 · Und nichts ist dabei kaputtgegangen');
  pr('Keine Seitenfehler', errors.length === 0, errors.join(' | '));

} finally {
  await browser.close();
  server.close();
}

console.log(`\n${passed + failed === 0 ? 0 : passed}/${passed + failed} bestanden · ✗=${failed}`);
process.exit(failed ? 1 : 0);
