/* Suite 538 — Griffe, freie Verbindungen, Formen und Vorlagen (E628)
 * ============================================================================
 * REDURS SATZ, 19. September 2026: „Könntest du den XMind-Teil verbessern —
 * wenn ich oben, links, rechts oder unten auf einen Taster klicke, sollte
 * dort eine Verbindung entstehen; ich sollte die Verbindungen löschen
 * können; es sollte verschiedene Formen haben, fertige Vorlagen usw."
 *
 * Vier Dinge, und dieser Lauf hält alle vier — plus das, was sie an Daten
 * anfassen. `test529` hält die Karte selbst (Bäume, Tasten, Farben, die
 * `.redion`-Runde) und bleibt unverändert; hier steht nur das Neue.
 *
 * §1  DIE VIER GRIFFE stehen am gewählten Knoten — und nur dort. Jeder hat
 *     einen Namen zum Vorlesen (§38) und eine Fläche, die ein Finger trifft.
 * §2  EIN TIPP auf einen Griff legt ein Thema an: links/rechts ein
 *     Unterthema, oben/unten ein Geschwister an der richtigen Stelle.
 * §3  EIN ZUG von einem Griff auf einen anderen Knoten macht eine freie
 *     Verbindung — die, die ein Baum nicht kann.
 * §4  EINE VERBINDUNG LÄSST SICH WÄHLEN UND LÖSCHEN, und ↶ holt sie zurück.
 * §5  UNSINN WIRD ABGELEHNT: zu sich selbst, zweimal dieselbe, und die
 *     Kante, die der Baum schon zeichnet.
 * §6  EINE VERBINDUNG INS NICHTS fällt beim Lesen still weg, statt eine
 *     Linie an einen gelöschten Knoten zu malen (§9).
 * §7  DIE FORMEN: sechs im Register, `rund` schreibt NICHTS in die Daten,
 *     und eine unbekannte Form aus einer neueren Fassung BLEIBT (§18).
 * §8  DIE SICHTBARE LINIE unterscheidet gewählt von ungewählt nicht nur
 *     über die Farbe (§38) — und die Fanglinie ist breit genug für einen
 *     Finger.
 * §9  DIE VORLAGEN: sechs Stück, jede mit Wurzel und Ästen, jede baut eine
 *     Karte, die `leseKarte` unverändert wieder herausgibt.
 * §10 UND SIE FRAGT, BEVOR SIE ÜBERSCHREIBT (§9) — aber nur, wenn wirklich
 *     etwas dasteht.
 * §11 Nichts ist dabei kaputtgegangen.
 *
 * ─── WAS ER BEIM ERSTEN LAUF GEFUNDEN HAT ───────────────────────────────────
 * Vier Fehler, alle vier echt, keiner davon im Code zu sehen:
 *
 *   · DIE GRIFFE ERSCHIENEN NICHT. `waehle` zeichnet die Karte nicht neu, es
 *     setzt nur die Marke `on` um — die Griffe entstanden also erst bei der
 *     nächsten Änderung. Gemessen: 0 statt 4. Behoben mit `griffeBauen`.
 *   · DIE LINIE LIEF DURCH DIE WURZEL. Zwei Äste links und rechts auf
 *     gleicher Höhe ergaben eine waagerechte Linie mitten durch den
 *     Wurzelknoten: Kasten 181 × 0 px, und ein Klick darauf traf die Wurzel.
 *     Behoben mit dem Bogen zur Seite.
 *   · DIE ENTF-TASTE LIEF INS LEERE. Ohne `preventDefault` nahm der Browser
 *     nach dem Klick auf den SVG-Pfad den Fokus wieder weg; gemessen stand
 *     `document.activeElement` auf dem Körper der Seite statt auf der Bühne.
 *   · UND DER LAUF SELBST MASS FALSCH: §6 las den rohen Block statt das
 *     gelesene Modell und war rot, obwohl alles richtig war.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vier Zusicherungen wurden EINZELN rot gesehen — nicht der ganze Lauf gegen
 * einen Stand ohne die Funktion (das beweist nichts über die einzelne Zeile).
 * Jedes Mal: Zeile verstümmeln, bauen, laufen, zurücksetzen.
 *
 *   §1  `griffeBauen` auch an den ungewählten Knoten. Gemessen: 16 statt 4.
 *       UND EIN FUND DABEI: die Zahl NACH einem Klick blieb grün, weil
 *       `waehle` die fremden Griffe ohnehin wegräumt. Die Zusicherung, die
 *       den Zeichner wirklich prüft, misst deshalb VOR dem ersten Klick —
 *       genau der Fall aus §55.2, eine Prüfung, die nicht rot werden kann.
 *   §5  Die Prüfung auf Eltern-Kind in `verbinden` ausgehängt. Gemessen:
 *       1 Verbindung entstand, wo 0 stehen sollten.
 *   §7  `delete k.form` durch `k.form = 'rund'` ersetzt. Gemessen: das Feld
 *       stand in den Daten, obwohl der Knoten aussieht wie vorher — genau
 *       die stille Änderung, die §9 nicht will.
 *   §10 Die Rückfrage übersprungen. Gemessen: die volle Karte war ohne ein
 *       Wort weg.
 *
 * Und zweimal stand dabei `noUnusedLocals` im Weg (§52.6): `if (false)` an
 * der Stelle von §5 liess den Zweig nicht mehr bauen, weil zwei Konstanten
 * damit unbenutzt waren. Eine Gegenprobe, die nicht baut, ist keine —
 * verstümmelt wurde deshalb so, dass die Namen benutzt bleiben.
 *
 *   node pruefungen/lauf/test538.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
declare const Store: any;
declare const App: any;
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

  /* Eine Karte mit Wurzel und drei Ästen — dieselbe für alle Abschnitte,
     zwischendurch jeweils frisch gestellt. */
  const ids = await page.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(node => node.remove());
    const seite = Store.addPage(null, { text: 'Kartenprobe zwei', icon: '🧠' });
    const blk = Store.addBlock(seite.id, 'mindmap', {});
    await Store.flush();
    App.oeffne(seite.id);
    return { seite: seite.id, blk: blk.id };
  });
  await page.waitForSelector('.gk-buehne');

  const stellen = async (knoten: unknown[], verbindungen: unknown[] = []): Promise<void> => {
    await page.evaluate(async ({ blk, knoten, verbindungen }) => {
      Store.updateBlock(blk, { karte: { aufbau: 'karte', knoten, verbindungen } });
      await Store.flush();
      App.zeichneSeite();
    }, { blk: ids.blk, knoten, verbindungen });
    await page.waitForTimeout(350);
  };
  const karteVon = async (): Promise<any> =>
    await page.evaluate(id => JSON.parse(JSON.stringify(Store.getBlock(id)?.karte ?? null)), ids.blk);

  const GRUND = [
    { id: 'w', text: 'Mitte', eltern: null },
    { id: 'a', text: 'Erster Ast', eltern: 'w', seite: 'rechts' },
    { id: 'b', text: 'Zweiter Ast', eltern: 'w', seite: 'rechts' },
    { id: 'c', text: 'Dritter Ast', eltern: 'w', seite: 'links' },
  ];

  /* ---------------------------------------------------------------------- */
  console.log('\n1 · Die vier Griffe — am gewählten Knoten, und nur dort');
  await stellen(GRUND);
  /* ZUERST OHNE KLICK. Diese eine Zahl ist die, die den Zeichner prüft:
     beim Zeichnen bekommt NUR der gewählte Knoten Griffe. Die Zahl nach
     einem Klick prüft das nicht — `waehle` räumt die alten Griffe ohnehin
     weg und hängt vier neue an, und damit bliebe die Zusicherung auch dann
     grün, wenn der Zeichner sie an jeden Knoten hängte. Gemessen: mit dem
     eingebauten Fehler 16 statt 4 (§55.2). */
  gleich('Beim Zeichnen bekommt nur EIN Knoten Griffe',
    await page.evaluate(() => document.querySelectorAll('.gk-griffel').length), 4);
  await page.locator('.gk-kn[data-k="a"]').click();
  await page.waitForTimeout(200);
  const griffe = await page.evaluate(() => {
    const am = document.querySelectorAll('.gk-kn[data-k="a"] .gk-griffel');
    const alle = document.querySelectorAll('.gk-griffel');
    const richtungen = [...am].map(g => (g as HTMLElement).dataset.r);
    const ohneNamen = [...am].filter(g => !(g.getAttribute('aria-label') || '').trim()).length;
    const erster = am[0] as HTMLElement | undefined;
    const flaeche = erster
      ? (() => {
          const k = erster.getBoundingClientRect();
          const nach = getComputedStyle(erster, '::after');
          /* `inset:-6px` an einem 16-px-Knopf gibt 28 px. Gemessen wird die
             Fläche, nicht die Absicht. */
          const dazu = Math.abs(parseFloat(nach.insetBlockStart || nach.top || '0')) || 0;
          return { hoehe: Math.round(k.height + 2 * dazu), sicht: Math.round(k.height) };
        })()
      : null;
    return { amGewaehlten: am.length, insgesamt: alle.length, richtungen, ohneNamen, flaeche };
  });
  gleich('Vier Griffe am gewählten Knoten', griffe.amGewaehlten, 4);
  gleich('… und im ganzen Bild auch nur diese vier', griffe.insgesamt, 4);
  pr('… einer je Richtung',
    ['oben', 'rechts', 'unten', 'links'].every(r => griffe.richtungen.includes(r)),
    JSON.stringify(griffe.richtungen));
  gleich('Jeder Griff hat einen Namen zum Vorlesen (§38)', griffe.ohneNamen, 0);
  pr('Die Treffläche ist grösser als das, was man sieht (§37)',
    !!griffe.flaeche && griffe.flaeche.hoehe >= 28 && griffe.flaeche.hoehe > griffe.flaeche.sicht,
    JSON.stringify(griffe.flaeche));

  /* ---------------------------------------------------------------------- */
  console.log('\n2 · Ein Tipp legt ein Thema an — in der Richtung des Griffs');
  const tippen = async (knoten: string, richtung: string): Promise<void> => {
    await page.locator(`.gk-kn[data-k="${knoten}"] .gk-griffel-${richtung}`).click();
    await page.waitForTimeout(250);
    /* Der neue Knoten öffnet gleich ein Schreibfeld — wegtippen, sonst
       fängt der nächste Klick den offenen Schreiber. */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  };
  await tippen('a', 'rechts');
  const nachRechts = await karteVon();
  const neuRechts = (nachRechts.knoten as any[]).find(k => k.eltern === 'a');
  pr('Rechts wird ein Unterthema daraus', !!neuRechts, JSON.stringify(nachRechts.knoten));

  await stellen(GRUND);
  await page.locator('.gk-kn[data-k="a"]').click();
  await page.waitForTimeout(200);
  await tippen('a', 'unten');
  const nachUnten = await karteVon();
  const geschwister = (nachUnten.knoten as any[]).filter(k => k.eltern === 'w');
  gleich('Unten wird ein Geschwister daraus', geschwister.length, 4);
  gleich('… und zwar direkt HINTER dem angefassten Ast',
    geschwister.findIndex(k => !GRUND.some(g => g.id === k.id)), 1);

  await stellen(GRUND);
  await page.locator('.gk-kn[data-k="b"]').click();
  await page.waitForTimeout(200);
  await tippen('b', 'oben');
  const nachOben = await karteVon();
  const obenListe = (nachOben.knoten as any[]).filter(k => k.eltern === 'w');
  gleich('Oben wird eines DAVOR', obenListe.findIndex(k => !GRUND.some(g => g.id === k.id)), 1);

  /* ---------------------------------------------------------------------- */
  console.log('\n3 · Ein Zug macht eine freie Verbindung');
  await stellen(GRUND);
  await page.locator('.gk-kn[data-k="a"]').click();
  await page.waitForTimeout(200);
  const ziehen = async (von: string, richtung: string, nach: string): Promise<void> => {
    const griff = await page.locator(`.gk-kn[data-k="${von}"] .gk-griffel-${richtung}`).boundingBox();
    const ziel = await page.locator(`.gk-kn[data-k="${nach}"]`).boundingBox();
    if (!griff || !ziel) return;
    await page.mouse.move(griff.x + griff.width / 2, griff.y + griff.height / 2);
    await page.mouse.down();
    /* In zwei Schritten — ein einziger Sprung sieht für die Schwelle von
       sechs Pixeln aus wie ein Tipp mit sehr weitem Wackeln. */
    await page.mouse.move(ziel.x + ziel.width / 2, ziel.y + ziel.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  };
  await ziehen('a', 'unten', 'c');
  const nachZug = await karteVon();
  gleich('Eine Verbindung steht in den Daten', (nachZug.verbindungen || []).length, 1);
  const v = (nachZug.verbindungen || [])[0] ?? {};
  pr('… zwischen den beiden angefassten Knoten',
    (v.von === 'a' && v.zu === 'c') || (v.von === 'c' && v.zu === 'a'), JSON.stringify(v));
  const gemalt = await page.evaluate(() => ({
    gruppen: document.querySelectorAll('.gk-verb').length,
    fang: document.querySelectorAll('.gk-verb .gk-verb-fang').length,
    linie: document.querySelectorAll('.gk-verb .gk-verb-linie').length,
  }));
  gleich('… und sie ist auch gezeichnet', gemalt.gruppen, 1);
  pr('… mit Fanglinie UND sichtbarer Linie',
    gemalt.fang === 1 && gemalt.linie === 1, JSON.stringify(gemalt));
  gleich('Der Knoten hängt dabei NICHT um (es bleibt ein Baum)',
    (nachZug.knoten as any[]).find(k => k.id === 'c')?.eltern, 'w');

  /* ---------------------------------------------------------------------- */
  console.log('\n4 · Wählen, löschen, zurückholen');
  /* DER KLICK GEHT AUF DIE MITTE DER LINIE, nicht auf die Mitte ihres
     Kastens. Ein gebogener Pfad füllt seinen Kasten nicht aus — dessen
     Mitte liegt neben der Linie, und `click({force:true})` darauf traf im
     ersten Lauf die Wurzel. Gemessen wird deshalb ein Punkt AUF dem Pfad
     (`getPointAtLength`), und geklickt wird dort mit der echten Maus. */
  const linienPunkt = async (): Promise<{ x: number; y: number } | null> =>
    await page.evaluate(() => {
      const f = document.querySelector('.gk-verb-fang') as SVGPathElement | null;
      const m = f?.getScreenCTM();
      if (!f || !m) return null;
      const p = f.getPointAtLength(f.getTotalLength() / 2);
      return { x: p.x * m.a + p.y * m.c + m.e, y: p.x * m.b + p.y * m.d + m.f };
    });
  const verbindungKlicken = async (): Promise<void> => {
    const p = await linienPunkt();
    if (p) await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(250);
  };
  /* Und die Zusicherung, die dahinter steckt: an dieser Stelle liegt
     wirklich die Linie und nicht ein Knoten. Sie ist der Wächter gegen die
     gerade Linie quer durch die Wurzel — gemessen war ihr Kasten 181 × 0 px
     und der Klick traf den Kasten darunter. */
  const punkt = await linienPunkt();
  gleich('Auf der Mitte der Linie liegt auch wirklich die Linie',
    await page.evaluate(p => document.elementFromPoint(p!.x, p!.y)?.getAttribute('class') ?? '', punkt),
    'gk-verb-fang');
  gleich('… denn sie macht einen Bogen, statt quer durch die Mitte zu laufen',
    await page.evaluate(() =>
      Math.round((document.querySelector('.gk-verb')?.getBoundingClientRect().height ?? 0) > 30 ? 1 : 0)), 1);
  await verbindungKlicken();
  gleich('Eine angeklickte Verbindung ist markiert',
    await page.evaluate(() => document.querySelectorAll('.gk-verb.on').length), 1);
  gleich('… und kein Thema mehr',
    await page.evaluate(() => document.querySelectorAll('.gk-kn.on').length), 0);
  await page.keyboard.press('Delete');
  await page.waitForTimeout(300);
  const nachWeg = await karteVon();
  gleich('Entf löscht die Verbindung', (nachWeg.verbindungen || []).length, 0);
  gleich('… und kein einziges Thema dazu', (nachWeg.knoten || []).length, 4);
  await page.locator('.gk-leiste [data-a="zurueck"]').click();
  await page.waitForTimeout(300);
  gleich('↶ holt sie in EINEM Schritt zurück (§51)',
    ((await karteVon()).verbindungen || []).length, 1);

  /* ---------------------------------------------------------------------- */
  console.log('\n5 · Unsinn wird abgelehnt');
  const versuch = async (von: string, zu: string): Promise<number> => {
    await stellen(GRUND, [{ id: 'v1', von: 'a', zu: 'c' }]);
    const zahl = await page.evaluate(({ von, zu }) => {
      const k = Gedankenkarte.leseKarte({ karte: { aufbau: 'karte', knoten: [
        { id: 'w', text: 'Mitte', eltern: null },
        { id: 'a', text: 'A', eltern: 'w' },
        { id: 'a1', text: 'A1', eltern: 'a' },
        { id: 'c', text: 'C', eltern: 'w' },
      ], verbindungen: [{ id: 'x', von, zu }] } });
      return k.verbindungen.length;
    }, { von, zu });
    return zahl;
  };
  gleich('Eine Verbindung auf sich selbst entsteht nicht', await versuch('a', 'a'), 0);
  gleich('Eine Verbindung zu einem Knoten, den es nicht gibt, auch nicht',
    await versuch('a', 'gibtsnicht'), 0);
  gleich('Eine gültige dagegen schon', await versuch('a', 'c'), 1);
  const doppelt = await page.evaluate(() => Gedankenkarte.leseKarte({ karte: { aufbau: 'karte',
    knoten: [{ id: 'w', text: 'M', eltern: null }, { id: 'a', text: 'A', eltern: 'w' },
             { id: 'c', text: 'C', eltern: 'w' }],
    verbindungen: [{ id: 'x', von: 'a', zu: 'c' }, { id: 'y', von: 'c', zu: 'a' }] } }).verbindungen.length);
  gleich('Dieselbe Verbindung zweimal wird eine', doppelt, 1);
  /* Und der Weg, den ein Mensch geht: zwei Knoten, die im Baum schon
     verbunden sind, noch einmal verbinden. Das gäbe zwei Linien
     übereinander, und löschen liesse sich nur eine davon. */
  await stellen(GRUND);
  await page.locator('.gk-kn[data-k="w"]').click();
  await page.waitForTimeout(200);
  await ziehen('w', 'unten', 'a');
  gleich('Was der Baum schon zeichnet, wird nicht doppelt gezogen',
    ((await karteVon()).verbindungen || []).length, 0);

  /* ---------------------------------------------------------------------- */
  console.log('\n6 · Eine Verbindung ins Nichts fällt still weg');
  await stellen(GRUND, [{ id: 'v1', von: 'a', zu: 'c' }, { id: 'v2', von: 'a', zu: 'weg' }]);
  /* GEMESSEN WIRD AM GELESENEN MODELL, nicht am rohen Block: im Block steht
     noch, was hineingeschrieben wurde — `leseKarte` ist die Stelle, an der
     aufgeräumt wird, und erst beim nächsten Sichern steht das Ergebnis auch
     im Block. (Der erste Lauf mass den Block und war rot, obwohl alles
     richtig war.) */
  gleich('Von zwei Verbindungen bleibt die mit beiden Enden',
    await page.evaluate(id => Gedankenkarte.leseKarte(Store.getBlock(id)).verbindungen.length, ids.blk), 1);
  gleich('… und die Karte zeichnet auch nur die eine',
    await page.evaluate(() => document.querySelectorAll('.gk-verb').length), 1);

  /* ---------------------------------------------------------------------- */
  console.log('\n7 · Die Formen');
  const formen = await page.evaluate(() =>
    [...document.querySelectorAll('.gk-leiste .gk-form')].map(b => (b as HTMLElement).dataset.f));
  gleich('Sechs Formen stehen in der Leiste', formen.length, 6);
  pr('… und `rund` ist die erste', formen[0] === 'rund', JSON.stringify(formen));
  await stellen(GRUND);
  await page.locator('.gk-kn[data-k="a"]').click();
  await page.waitForTimeout(150);
  await page.locator('.gk-leiste .gk-form[data-f="raute"]').click();
  await page.waitForTimeout(250);
  gleich('Eine gewählte Form steht am Knoten',
    await page.evaluate(() => document.querySelector<HTMLElement>('.gk-kn[data-k="a"]')?.dataset.form), 'raute');
  gleich('… und in den Daten',
    (await karteVon()).knoten.find((k: any) => k.id === 'a')?.form, 'raute');
  await page.locator('.gk-leiste .gk-form[data-f="rund"]').click();
  await page.waitForTimeout(250);
  const zurueckRund = (await karteVon()).knoten.find((k: any) => k.id === 'a');
  pr('`rund` schreibt NICHTS in die Daten — es ist die Form ohne Feld (§9)',
    !('form' in zurueckRund), JSON.stringify(zurueckRund));
  gleich('Eine unbekannte Form aus einer neueren Fassung BLEIBT (§18)',
    await page.evaluate(() => Gedankenkarte.leseKarte({ karte: { aufbau: 'karte',
      knoten: [{ id: 'w', text: 'M', eltern: null, form: 'stern' }] } }).knoten[0].form), 'stern');
  gleich('… aber kein Unsinn, der kein Formname sein kann',
    await page.evaluate(() => Gedankenkarte.leseKarte({ karte: { aufbau: 'karte',
      knoten: [{ id: 'w', text: 'M', eltern: null, form: '"><img src=x>' }] } }).knoten[0].form), undefined);

  /* ---------------------------------------------------------------------- */
  console.log('\n8 · Was man sieht — und was ein Finger trifft');
  await stellen(GRUND, [{ id: 'v1', von: 'a', zu: 'c' }]);
  const linie = await page.evaluate(() => {
    const el = document.querySelector('.gk-verb .gk-verb-linie');
    const fang = document.querySelector('.gk-verb .gk-verb-fang');
    if (!el || !fang) return null;
    const s = getComputedStyle(el), f = getComputedStyle(fang);
    return {
      strich: s.strokeDasharray, dicke: parseFloat(s.strokeWidth),
      fangDicke: parseFloat(f.strokeWidth), fangZeiger: f.pointerEvents,
    };
  });
  pr('Die freie Verbindung ist gestrichelt — nicht nur anders gefärbt (§38)',
    !!linie && linie.strich !== 'none' && linie.strich !== '', JSON.stringify(linie));
  pr('Die Fanglinie ist viel breiter als die sichtbare',
    !!linie && linie.fangDicke >= 12 && linie.fangDicke > linie.dicke * 3, JSON.stringify(linie));
  gleich('… und sie nimmt die Zeiger auch an', linie?.fangZeiger, 'stroke');
  await verbindungKlicken();
  const gewaehlteLinie = await page.evaluate(() => {
    const el = document.querySelector('.gk-verb.on .gk-verb-linie');
    if (!el) return null;
    const s = getComputedStyle(el);
    return { strich: s.strokeDasharray, dicke: parseFloat(s.strokeWidth) };
  });
  pr('Die gewählte Verbindung ist DURCHGEZOGEN und dicker (§38)',
    !!gewaehlteLinie && !!linie && gewaehlteLinie.dicke > linie.dicke
      && (gewaehlteLinie.strich === 'none' || gewaehlteLinie.strich === ''),
    JSON.stringify(gewaehlteLinie));

  /* ---------------------------------------------------------------------- */
  console.log('\n9 · Die fertigen Vorlagen');
  await page.locator('.gk-leiste [data-a="vorlage"]').click();
  await page.waitForTimeout(300);
  const liste = await page.evaluate(() => {
    const knoepfe = [...document.querySelectorAll('.menu button[data-v]')];
    return {
      zahl: knoepfe.length,
      ohneHinweis: knoepfe.filter(b => !b.querySelector('.sub')?.textContent?.trim()).length,
      erste: (knoepfe[0] as HTMLElement | undefined)?.dataset.v ?? '',
    };
  });
  gleich('Sechs Vorlagen stehen zur Wahl', liste.zahl, 6);
  gleich('… und jede sagt in einer Zeile, was drinsteht', liste.ohneHinweis, 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  /* ---------------------------------------------------------------------- */
  console.log('\n10 · Und sie fragt, bevor sie überschreibt');
  /* Erst der leere Fall: eine frische Karte wird ohne Rückfrage ersetzt —
     eine Frage, die immer kommt, wird nicht mehr gelesen. */
  await stellen([{ id: 'w', text: 'Zentrales Thema', eltern: null }]);
  await page.locator('.gk-leiste [data-a="vorlage"]').click();
  await page.waitForTimeout(250);
  await page.locator('.menu button[data-v="projekt"]').click();
  await page.waitForTimeout(450);
  const ohneFrage = await karteVon();
  gleich('Eine leere Karte wird ohne Rückfrage ersetzt',
    await page.evaluate(() => document.querySelectorAll('.overlay .wahl').length), 0);
  pr('… und die Vorlage steht wirklich da',
    (ohneFrage.knoten || []).length > 6, JSON.stringify((ohneFrage.knoten || []).length));
  gleich('… mit der Wurzel der Vorlage', ohneFrage.knoten[0]?.text, 'Projekt');

  /* Und jetzt der volle Fall. */
  await stellen(GRUND, [{ id: 'v1', von: 'a', zu: 'c' }]);
  await page.locator('.gk-leiste [data-a="vorlage"]').click();
  await page.waitForTimeout(250);
  await page.locator('.menu button[data-v="woche"]').click();
  await page.waitForTimeout(400);
  gleich('Eine volle Karte fragt zuerst',
    await page.evaluate(() => document.querySelectorAll('.overlay .wahl').length), 1);
  await page.locator('.overlay .wahl button[data-w=""]').click();
  await page.waitForTimeout(350);
  const abgebrochen = await karteVon();
  gleich('„Abbrechen" lässt die Karte, wie sie war', (abgebrochen.knoten || []).length, 4);
  gleich('… mitsamt ihren Verbindungen', (abgebrochen.verbindungen || []).length, 1);

  await page.locator('.gk-leiste [data-a="vorlage"]').click();
  await page.waitForTimeout(250);
  await page.locator('.menu button[data-v="woche"]').click();
  await page.waitForTimeout(400);
  await page.locator('.overlay .wahl button[data-w="ja"]').click();
  await page.waitForTimeout(450);
  const ersetzt = await karteVon();
  gleich('„Ersetzen" setzt die Vorlage ein', ersetzt.knoten[0]?.text, 'Diese Woche');
  gleich('… ohne alte Verbindungen mitzuschleppen', (ersetzt.verbindungen || []).length, 0);
  await page.locator('.gk-leiste [data-a="zurueck"]').click();
  await page.waitForTimeout(350);
  const zurueckgeholt = await karteVon();
  gleich('Und ↶ holt die alte Karte zurück (§51)', zurueckgeholt.knoten[0]?.text, 'Mitte');
  gleich('… mit ihrer Verbindung', (zurueckgeholt.verbindungen || []).length, 1);

  /* ---------------------------------------------------------------------- */
  console.log('\n11 · Und nichts ist dabei kaputtgegangen');
  pr('Keine Seitenfehler', errors.length === 0, errors.join(' | '));

} finally {
  await browser.close();
  server.close();
}

console.log(`\n${passed + failed === 0 ? 0 : passed}/${passed + failed} bestanden · ✗=${failed}`);
process.exit(failed ? 1 : 0);
