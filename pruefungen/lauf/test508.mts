/* Suite 508 — Gleich wie PowerPoint: Zeichnen ist ein REITER, und ein Blatt
 *             heisst „Folie"
 * ============================================================================
 * Redur, auf die Frage, ob die Zeichenleiste zum Reiter werden soll:
 * „weiter mache gleich wie powerpoint".
 *
 * PowerPoint hat einen Reiter „Zeichnen" und keine zweite Dauerleiste; und es
 * sagt nirgends „Seite". Beides steht hier.
 *
 * ─── WARUM DIE LEISTE UMZIEHT UND NICHT NACHGEBAUT WIRD ─────────────────────
 * Der Reiter `zeichnen` im BANDKATALOG hat dreissig Einträge. Bei offenem
 * Foliensatz wurden vierzehn davon einzeln aufgerufen:
 *
 *     kein einziger änderte das gewählte Werkzeug des Dokuments
 *     `an()` gab bei ALLEN vierzehn `true` zurück
 *
 * Im Band stünden also vierzehn gleichzeitig gewählte Knöpfe, und keiner
 * täte etwas. Ein Werkzeugkasten, in dem alles markiert ist, sagt nichts —
 * E212 hat genau das einmal repariert.
 *
 * Also zieht die ECHTE Zeichenleiste um: dasselbe Element, dieselben sechzehn
 * Knöpfe, dieselben Griffe. Ein Nachbau hätte `applyPen`, `inkSync`, den
 * Verlauf und die Stiftoptionen mitkopieren müssen — und eine Kopie davon
 * wäre still auseinandergelaufen (§8).
 *
 * ─── WAS DAS AN PLATZ BRINGT, GEMESSEN BEI 1440 × 852 ───────────────────────
 *     vorher                        nachher
 *     Kopfleiste      48 px         Kopfleiste      48 px
 *     Folienband     110 px         Folienband     110 px  (94 bei „Zeichnen")
 *     Zeichenleiste   58 px         —
 *     Fläche         588 px         Fläche         646 px  (662 bei „Zeichnen")
 *
 * ─── DIE GEFAHR, UND SIE IST KEINE KLEINIGKEIT ──────────────────────────────
 * Die Leiste ist jetzt ein KIND des Bandes. Wer das Band entfernt, nimmt sie
 * mit — und dann hat ein Fenster unter 900 px gar keine Zeichenwerkzeuge
 * mehr. Das wäre eine weggenommene Funktion durch Unfall (§47). §4 misst
 * genau das: Heft, schmales Fenster, und wieder zurück.
 *
 * ─── UND DAS WORT ───────────────────────────────────────────────────────────
 * „Seite 3 von 7" in einer Präsentation ist die Sprache eines anderen
 * Programms. Das Wort kommt aus EINEM Ort (`wortEins`/`wortViele`) und nicht
 * aus zwanzig — sonst vergisst jemand die einundzwanzigste Stelle.
 *
 * DIE DATEN HEISSEN WEITER `blatt`. Übersetzt wird, was ein Mensch liest,
 * nicht was gespeichert ist (§53.3, Grenze 1: ein Feldname ist keine
 * Übersetzung, sondern eine Datenmigration). §5 misst auch das.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle fünf gefahren, die Zahlen sind GEMESSEN:
 *   G1 → `zeichnen` aus FOLIENBAND_REITER nehmen:        2 rot, dann Abbruch am Klick auf den fehlenden Reiter
 *   G2 → die `[hidden]`-Zeile im Stilblatt streichen:    35 grün,  3 rot  (die Leiste stand unter JEDEM Reiter, Fläche zurück auf 588 px)
 *   G3 → „Annotieren" den Reiter nicht holen lassen:     36 grün,  2 rot  (nach „Annotieren" stand weiter „Präsentation" vorn)
 *   G4 → die Leiste beim Verkleinern nicht retten:       38 grün,  2 rot  (beim Ziehen auf 800 px blieben NULL Knöpfe übrig)
 *   G5 → `wortEins` immer „Seite" sagen lassen:          37 grün,  3 rot  (im Foliensatz stand wieder „Seite 1/2")
 *
 * UND G4 WAR ZUERST GRÜN — das ist der wichtigste Satz dieses Kopfes.
 * §4 rief nach dem Verkleinern `oeffne(deck)` und baute damit alles frisch
 * auf; der gefährliche Weg (das Band entfernen, WÄHREND die Leiste darin
 * hängt) wurde gar nicht gegangen. Die Zusage sah aus wie eine und war
 * keine. Jetzt wird nur noch das Fenster gezogen, sonst nichts — genau das,
 * was ein Mensch tut. Danach meldet die Gegenprobe „0 Knöpfe" (§55.2).
 *
 *   node pruefungen/lauf/test508.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
declare const Folienvorlagen: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9618;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
await new Promise<void>(f => server.listen(PORT, f));

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, 'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];
const kontext = await browser.newContext({ viewport: { width: 1440, height: 852 } });
const seite = await kontext.newPage();
seite.on('pageerror', e => fehler.push(e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
for (let versuch = 0; versuch < 8; versuch++) {
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
  });
  await seite.waitForTimeout(230);
  if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
}
const ids = await seite.evaluate(() => {
  const deck = Folienvorlagen.neuePraesentation('titelInhalt');
  Folienvorlagen.neueFolie(deck.id, 'zweiInhalte');
  const heft = Store.addPage(null, { text: 'Notizheft', icon: '📓' });
  Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.addBlock(heft.id, 'blatt', { text: '', blattBreite: 595, blattHoehe: 842 });
  Store.updateBlock(heft.id, { dokumentModus: true });
  return { deck: deck.id, heft: heft.id };
});
const oeffne = async (id: string) => {
  await seite.evaluate((x: string) => App.oeffne(x), id);
  await seite.waitForTimeout(1700);
  await seite.evaluate(() => {
    document.querySelectorAll<HTMLElement>('#rg-willkommen').forEach(o => o.remove());
  });
};
const lage = () => seite.evaluate(() => {
  const bar = document.querySelector<HTMLElement>('.document-drawingbar');
  const band = document.querySelector<HTMLElement>('.folienband');
  const mitte = document.querySelector<HTMLElement>('.document-center');
  const r = (e: Element | null) => e ? e.getBoundingClientRect() : null;
  return {
    leisteDa: !!bar,
    leisteSichtbar: (r(bar)?.height ?? 0) > 0,
    leisteImBand: !!bar && !!band && band.contains(bar),
    knoepfe: bar ? bar.querySelectorAll('button').length : 0,
    werkzeuge: bar ? bar.querySelectorAll('[data-document-tool]').length : 0,
    bandHoehe: Math.round(r(band)?.height ?? 0),
    reiter: [...document.querySelectorAll<HTMLElement>('.folienband-reiter [data-fb-reiter]')]
      .map(b => b.dataset['fbReiter'] || ''),
    aktiv: document.querySelector('.folienband-reiter [aria-selected="true"]')
      ?.getAttribute('data-fb-reiter') || '—',
    flaecheSichtbar: (r(document.querySelector('.folienband-flaeche'))?.height ?? 0) > 0,
    mitte: Math.round(r(mitte)?.height ?? 0)
  };
});

/* ══ §1 „ZEICHNEN" IST EIN REITER, UND DIE ECHTE LEISTE STEHT DARUNTER ═══ */
console.log('\n§1 Der Reiter „Zeichnen" — und darunter die Leiste selbst');
await oeffne(ids.deck);
{
  const vorher = await lage();
  p('„Zeichnen" steht in der Reiterzeile', vorher.reiter.includes('zeichnen'),
    JSON.stringify(vorher.reiter));
  p('… und zwar an zweiter Stelle, wie in PowerPoint',
    vorher.reiter[1] === 'zeichnen', JSON.stringify(vorher.reiter));
  p('Die Leiste ist im Band zu Hause', vorher.leisteImBand);
  p('… aber unter „Präsentation" unsichtbar', !vorher.leisteSichtbar);

  await seite.click('[data-fb-reiter="zeichnen"]');
  await seite.waitForTimeout(400);
  const jetzt = await lage();
  gleich('Ein Klick wählt den Reiter', jetzt.aktiv, 'zeichnen');
  p('… und die Leiste wird sichtbar', jetzt.leisteSichtbar);
  p('… mit allen ihren Knöpfen', jetzt.knoepfe >= 14, String(jetzt.knoepfe));
  p('… darunter jedes Zeichenwerkzeug', jetzt.werkzeuge >= 10, String(jetzt.werkzeuge));
  p('Und das Band der Gruppen ist dafür weg', !jetzt.flaecheSichtbar);
  p('Es ist DIESELBE Leiste, kein Nachbau — sie war schon vorher da',
    vorher.leisteDa && vorher.knoepfe === jetzt.knoepfe,
    vorher.knoepfe + ' / ' + jetzt.knoepfe);
}

/* ══ §2 KEINE ZWEITE DAUERLEISTE — UND DAS BRINGT PLATZ ══════════════════ */
console.log('\n§2 Unter jedem anderen Reiter ist sie weg, und die Folie bekommt den Platz');
{
  const zeichnen = await lage();
  await seite.click('[data-fb-reiter="ansicht"]');
  await seite.waitForTimeout(400);
  const ansicht = await lage();
  p('Unter „Ansicht" ist die Leiste weg', !ansicht.leisteSichtbar);
  p('… und die Gruppen sind da', ansicht.flaecheSichtbar);
  p('Die Fläche ist grösser als vor diesem Bogen (588 px)', ansicht.mitte > 600,
    String(ansicht.mitte) + ' px');
  p('Unter „Zeichnen" ist sie noch grösser', zeichnen.mitte >= ansicht.mitte,
    zeichnen.mitte + ' gegen ' + ansicht.mitte);
  p('Das Band ist unter „Zeichnen" niedriger als unter „Ansicht"',
    zeichnen.bandHoehe < ansicht.bandHoehe,
    zeichnen.bandHoehe + ' gegen ' + ansicht.bandHoehe);
}

/* ══ §3 „ANNOTIEREN" HOLT DEN REITER NACH VORN ═══════════════════════════ */
console.log('\n§3 Wer annotieren will, sieht den Stift — ohne ihn zu suchen');
{
  await seite.click('[data-fb-reiter="praesentation"]');
  await seite.waitForTimeout(400);
  p('Erst steht „Präsentation" vorn', (await lage()).aktiv === 'praesentation');
  await seite.evaluate(() => {
    document.querySelector<HTMLElement>('[data-document-action="view"]')?.click();
  });
  await seite.waitForTimeout(350);
  await seite.evaluate(() => {
    document.querySelector<HTMLElement>('[data-document-action="annotate"]')?.click();
  });
  await seite.waitForTimeout(700);
  const nach = await lage();
  gleich('Ein Druck auf „✎ Annotieren" holt „Zeichnen"', nach.aktiv, 'zeichnen');
  p('… und der Stift steht da', nach.leisteSichtbar);
}

/* ══ §4 DIE LEISTE GEHT NIE VERLOREN ═════════════════════════════════════ */
console.log('\n§4 Heft, schmales Fenster, zurück — immer sind die Werkzeuge da');
{
  await oeffne(ids.heft);
  const heft = await lage();
  p('Im Notizheft gibt es kein Band', heft.bandHoehe === 0, String(heft.bandHoehe));
  p('… und die Zeichenleiste steht wie immer für sich', heft.leisteSichtbar && !heft.leisteImBand);
  p('… mit allen Knöpfen', heft.knoepfe >= 14, String(heft.knoepfe));

  /* OHNE NEU ZU ÖFFNEN. Der erste Entwurf rief hier `oeffne(ids.deck)` nach
     dem Verkleinern — und baute damit alles frisch auf. Die Gegenprobe G4
     (die Leiste beim Schrumpfen NICHT retten) blieb deshalb grün: der
     gefährliche Weg wurde gar nicht gegangen. Ein Wächter, der nicht rot
     werden kann, ist keiner (§55.2).
     Also: Fenster ziehen, sonst nichts — genau das, was ein Mensch tut. */
  await oeffne(ids.deck);
  p('Vor dem Ziehen wohnt die Leiste im Band', (await lage()).leisteImBand);
  await seite.setViewportSize({ width: 800, height: 852 });
  await seite.waitForTimeout(900);
  const schmal = await lage();
  p('Bei 800 px hat auch der Foliensatz kein Band', schmal.bandHoehe === 0,
    String(schmal.bandHoehe));
  p('… und die Leiste ist TROTZDEM da', schmal.leisteSichtbar,
    'sie ist ein Kind des Bandes — wer es entfernt, nimmt sie mit');
  p('… vollständig', schmal.knoepfe >= 14, String(schmal.knoepfe));
  p('… und sie steht wieder für sich, nicht im Band', !schmal.leisteImBand);

  /* Und beim Aufziehen im laufenden Fenster, ohne Neuaufbau. */
  await seite.setViewportSize({ width: 1440, height: 852 });
  await seite.waitForTimeout(900);
  const wieder = await lage();
  p('Wieder aufgezogen ist das Band zurück', wieder.bandHoehe > 0, String(wieder.bandHoehe));
  p('… und die Leiste ist wieder darin', wieder.leisteImBand);
  p('… und immer noch vollständig', wieder.knoepfe >= 14, String(wieder.knoepfe));
  gleich('… und es gibt genau EINE', await seite.evaluate(() =>
    document.querySelectorAll('.document-drawingbar').length), 1);
}

/* ══ §5 EIN BLATT HEISST „FOLIE" — UND DIE DATEN HEISSEN WEITER `blatt` ══ */
console.log('\n§5 Im Foliensatz heisst alles „Folie", im Heft „Seite"');
const woerter = async () => {
  await seite.evaluate(() => {
    document.querySelector<HTMLElement>('[data-document-action="thumbnails"]')?.click();
    document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
  });
  await seite.waitForTimeout(700);
  return seite.evaluate(() => {
    const txt = (sel: string) => (document.querySelector(sel)?.textContent || '').trim();
    return [
      txt('.document-position'),
      txt('[data-document-action="thumbnails"]'),
      txt('.document-thumbnails .document-panel-header strong'),
      txt('.document-inspector-seite .document-section-title'),
      ...[...document.querySelectorAll<HTMLElement>('.document-seite-knoepfe .wort')]
        .map(e => (e.textContent || '').trim())
    ].filter(Boolean);
  });
};
{
  await oeffne(ids.deck);
  const imDeck = await woerter();
  p('Mindestens zehn Beschriftungen gemessen', imDeck.length >= 10, String(imDeck.length));
  gleich('KEINE davon sagt „Seite"', imDeck.filter(t => /Seite/.test(t)).length, 0);
  p('Mehrere sagen „Folie"', imDeck.filter(t => /Folie/.test(t)).length >= 5,
    JSON.stringify(imDeck.filter(t => /Folie/.test(t))));
  p('Der Stand unten zählt Folien', /^Folie \d+\/\d+$/.test(imDeck[0] || ''), imDeck[0]);
  p('Die Liste heisst „Folien"', imDeck.some(t => /^Folien$/.test(t)),
    JSON.stringify(imDeck));

  await oeffne(ids.heft);
  const imHeft = await woerter();
  p('Im Notizheft heisst weiter alles „Seite"',
    imHeft.filter(t => /Seite/.test(t)).length >= 4,
    JSON.stringify(imHeft.filter(t => /Seite/.test(t))));
  gleich('… und keine sagt „Folie"', imHeft.filter(t => /Folie/.test(t)).length, 0);

  /* §53.3, GRENZE 1: übersetzt wird, was ein Mensch liest — nicht, was
     gespeichert ist. Ein Blocktyp `folie` wäre eine Datenmigration und
     machte jede vorhandene Sicherung unlesbar. */
  const daten = await seite.evaluate((deck: string) => {
    const kinder = Store.childrenOf(deck) || [];
    return {
      typen: [...new Set(kinder.map((b: any) => String(b.type)))],
      felder: Object.keys(kinder[0] || {}).filter(k => /blatt|folie/i.test(k))
    };
  }, ids.deck);
  gleich('Die DATEN heissen weiter `blatt` (§53.3)', daten.typen.join(','), 'blatt');
  p('… und kein Feld heisst „folie"',
    !daten.felder.some((f: string) => /folie/i.test(f)), JSON.stringify(daten.felder));
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 508: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
