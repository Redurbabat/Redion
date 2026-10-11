/* ============================================================================
 * test589 — Tropfen, Linse und Kacheln aus dem Liquid-Glass-Video (E712)
 * ----------------------------------------------------------------------------
 * Redur, 27. September 2026, ca. 22:05 UTC, zu einem Video „LIQUID GLASS":
 * „Schau mal das auch an ich will das auch haben". Und ca. 22:10 UTC:
 * „… ohne eine funktione löschen bessere ordnungen bessere übergagnge
 * besssere efeckten , bessere oberfläsche …".
 *
 * Drei Szenen des Videos, in Redions eigenem TypeScript und CSS (R1: kein
 * React beim Start), mit den Federn aus E702 und dem Material aus E706:
 *
 *   01 MORPH    Das „+" (Neu erstellen) und das „⋯" der Seite fliessen wie
 *               ein Tropfen in ihr Menü; das Menü WÄCHST AUS DEM KNOPF (am
 *               Rechner stand das „+"-Menü bis hierher oben links in der
 *               Ecke, weit weg vom Knopf). Oben teilen sich drei runde
 *               Glasknöpfe ab — und JEDER bisherige Eintrag steht darunter,
 *               am selben Auslöser, ohne Zwischenschritt (§43).
 *   03 REFRACT  Die Linse gleitet einmal über „Aufmachen. / Weiterdenken.",
 *               mit der Brechung aus linse.ts (keine dritte), und ruht seit
 *               E740 NEBEN dem Wort, nicht über „ken" (§16).
 *   04 CONTROL  Glaskacheln oben in „Mehr" (Telefon) und in der Übersicht
 *               der Einstellungen (Rechner): Dunkel, Fokus-Modus, Ruhige
 *               Darstellung, Hoher Kontrast, Zeitmesser, Schriftgrösse und
 *               Zeilenabstand — dieselben Griffe wie bisher, die Auswahl-
 *               felder in „Allgemein" bleiben, wo sie sind.
 *
 * WAS DIESER LAUF HÄLT
 *   §1  Das „+" am Rechner: das Menü steht AM Knopf, nicht in der Ecke.
 *   §2  Drei runde Knöpfe oben (PDF einlesen · Neue Seite · Notizbuch), je
 *       44 px; darunter alle Wege des Katalogs, keiner fehlt; ein runder
 *       Knopf tut genau, was sein Eintrag tut.
 *   §3  EIN Tropfenfilter im Dokument, nur während des Fliessens an — in
 *       Ruhe trägt kein Element ihn. Bewegt werden nur transform/opacity.
 *   §4  Zu: das Menü ist sofort weg (Escape, E302), und der Tropfen fliesst
 *       sichtbar in den Knopf zurück — und ist danach auch weg.
 *   §5  Das „⋯" der Seite: Präsentieren · Merkzeichen · Teilen und ausgeben;
 *       alle bisherigen Einträge bleiben; das Merkzeichen füllt sich an Ort
 *       und Stelle; Präsentieren geht denselben Weg wie sein Eintrag.
 *   §6  Am Telefon: das Blatt trägt dieselben drei Knöpfe unter dem Titel.
 *   §7  Ruhig und „weniger Bewegung": kein Tropfen, kein Fliessen, sofort.
 *   §8  Die Linse über „Heute": einmal beim Ankommen, dann Stillstand; die
 *       Schrift bleibt echte Schrift; EINE Brechung im Dokument; nach einer
 *       Grössenänderung liegt sie weiter NEBEN der zweiten Zeile (E740).
 *   §9  Die Kacheln in „Mehr" (Telefon): sieben Griffe, 44 px, jeder tut,
 *       was sein bisheriger Ort tut; beim Rollen eine Chipleiste.
 *   §10 Die Kacheln in den Einstellungen (Rechner): oben in „Allgemein",
 *       die alten Felder darunter, beide zeigen denselben Stand.
 *   §11 Kein Seitenfehler.
 *   §12 Die Schrift der Kacheln ist lesbar, in jedem Schema (Durchsicht).
 *   §13 Nachtrag: Platz unter den Knöpfen, jeder Weg aus seinem Knopf, der
 *       Zug endet, die Uhr zählt, die Linse ist dicht, ein Beobachter.
 *   §14 Dritte Durchsicht: ein Weg aus den Einstellungen führt hinaus.
 *   §15 Zusammenführen der zweiten Welle: EIN Klebefilter in der ganzen
 *       App — Löschen-Knopf (E709), Meldungen (E711) und Tropfen leihen
 *       `Linse.TROPFEN`; liest nur Dateien.
 *   §16 Die Linse ruht NEBEN dem Wort (E740, Redur am 11. Oktober 2026):
 *       kein Buchstabe der Überschrift unter der ruhenden Linse.
 *
 * DURCHSICHT (4. Oktober 2026; Redur am 3. Oktober, ca. 19:35 UTC: „Weiter
 * ohne pause,"). Der Bericht des Baus ging am Wochenlimit verloren; die
 * Durchsicht hat nachgemessen und diese Zusagen dazugeschrieben — jede gegen
 * den Stand f6b9f007 (E712) rot gesehen, ausser wo „bleibt" steht:
 *   §3/§4 Der Tropfenfilter steht NUR, solange es fliesst — in Ruhe hält der
 *       Halter der Linse nur die Fahrt (sonst ist `test539` §2 rot: 2 statt
 *       1); auch wenn sich Öffnen und Schliessen überschneiden, EINER.
 *   §5  Nach dem runden Merkzeichen heisst der Eintrag darunter „Aus
 *       Favoriten entfernen" (vorher „Zu Favoriten" — und ein Tipp darauf
 *       nahm das Merkzeichen wieder weg).
 *   §6  Am Telefon fliessen die Tropfen dorthin, wo die runden Knöpfe
 *       ankommen (vorher abwärts quer durch die Liste).
 *   §8  Vorleser hören jede Zeile der Überschrift einmal; nach einer
 *       Grössenänderung des Fensters liegt die Linse weiter an der Zeile
 *       (bis E740 „auf", seither „neben" — siehe unten);
 *       „Hoher Kontrast", „Starker Kontrast" und „mehr Kontrast": keine
 *       Linse. „Weniger Bewegung" im System: nichts gleitet (bleibt).
 *   §9  Kein Name ragt aus seiner Kachel (390 px); ein Wisch nach oben über
 *       einen Regler rollt „Mehr" und lässt die Einstellung stehen; ein Tipp
 *       danach zählt.
 *   §12 Name und Stand jeder Kachel ≥ 4,5 : 1 am gerenderten Bild, in allen
 *       zehn Schemata, ohne Schalter, mit „Hoher Kontrast", mit „Ruhig".
 *
 * NACHTRAG DER ZWEITEN DURCHSICHT (§13; 4./5. Oktober 2026), jede Zusage
 * gegen den Stand der ersten Durchsicht rot gesehen:
 *   a   Die runden Knöpfe kommen oben DAZU: unter ihnen hat die Liste ihre
 *       60 % des Fensters, wie vorher das ganze Menü.
 *   b   „Neu erstellen" aus der Kante und „Alle Wege …" der Notizhefte
 *       wachsen aus IHREM Knopf, nicht aus dem „+" oben rechts.
 *   c   Ein Zug am Regler mit der Maus endet auch draussen.
 *   d   Die Kachel „Zeitmesser" zeigt die laufende Uhr und zählt mit.
 *   e   Die Linse ist dichtes Glas: die Schrift darunter scheint nicht
 *       doppelt durch. Seit E740 gemessen, wo sie über Schrift steht — am
 *       Ende der ersten Zeile, angehalten (siehe unten).
 *   f   Je Rollfläche EIN Beobachter der Kacheln.
 *
 * DRITTE DURCHSICHT (§14; 5. Oktober 2026), gegen den Stand des Nachtrags
 * rot gesehen:
 *   a   Die Kachel „Zeitmesser" in den Einstellungen öffnet das Feld der Uhr
 *       OBEN und bedienbar — vorher ging es hinter dem Fenster der
 *       Einstellungen auf (z 45 unter z 700, dazu von Fokus stillgelegt):
 *       ein Griff, der sichtbar nichts tat.
 *   b   Die Namen unter den runden Knöpfen sind lesbar (≥ 4,5 : 1 am
 *       gerenderten Bild), in allen zehn Schemata, am Rechner und im Blatt
 *       am Telefon — vorher am Telefon „Hell" 4,46 und „Sand" 4,36 : 1.
 *
 * NEBEN DEM WORT (§16, §8, §13e; 11. Oktober 2026, E740). In der Liste der
 * Fragen an Redur vom 5. Oktober stand, ob die Linse „neben dem Wort
 * ruhen" soll; am 11. Oktober kam sein „Ja". Im Gesamtbild stand
 * „Weiterdenl(en": die ruhende Linse deckte „ken" und zeigte es
 * vergrössert noch einmal. Drei
 * Änderungen, mit seinem Wort — §16 und §8 gegen 1575a183 rot gesehen,
 * §13e hält, was dort schon stimmte, und wird mit dünner Linse rot:
 *   §16 NEU. Jeder Buchstabe beider Zeilen (Range.getClientRects, Zeichen
 *       für Zeichen) gegen den Kreis der ruhenden Linse — 1440 × 900 und
 *       390 × 844, dunkel und hell, dazu „weniger Bewegung"; die Linse
 *       liegt rechts neben „Weiterdenken.", auf der Mitte der Zeile, in der
 *       Spalte der Überschrift. Bei 320 px ist daneben kein Platz: dann
 *       keine Linse statt einer über der Schrift.
 *   §8  GEÄNDERT. „liegt weiter AUF der zweiten Zeile" war die Zusage der
 *       ersten Durchsicht; sie heisst jetzt „liegt weiter NEBEN der zweiten
 *       Zeile". Die Messung ist dieselbe (1000 px, nichts fährt, Abschrift
 *       in der Grösse der Überschrift), nur der Ort ist Redurs neuer.
 *   §13e VERLEGT. Er mass den Kontrast IN der ruhenden Linse — liegt unter
 *       ihr keine Schrift mehr, ist er immer grün (§55.2). Jetzt hält er
 *       die Fahrt am Ende der ersten Zeile an (~780 ms, Linse über
 *       „Aufmachen."), prüft, dass dort Buchstaben UNTER ihr liegen, und
 *       misst erst dann. Gegenprobe: die Linse zu 35 % gedeckt → rot.
 *
 * KANN ER ROT WERDEN? Gegen den Stand b3cf1933 (vor E712) ist er rot, in
 * jedem Abschnitt ausser den „bleibt"-Zusagen — siehe Commit „test589 (rot)".
 *
 *   node pruefungen/alle.mts 589
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page, BrowserContext } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
};
const server = http.createServer((a, b) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(datei)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(datei));
});
/* Ein freier Port vom System (test400) — kein fester. */
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* §15 · EIN KLEBEFILTER IN DER GANZEN APP (Zusammenführen der zweiten Welle,
   5. Oktober 2026). Drei Zweige derselben Woche hatten je einen eigenen
   gebaut: der Löschen-Knopf (E709, `#ru-loesch-goo`), die Meldungen (E711,
   `SelectionFlow.goo`, `#ru-goo`) und der Tropfen (E712, `Linse.TROPFEN`).
   Drei Filter für EINE Bewegung sind drei Stellen, die auseinanderlaufen
   (§8). Der Auftrag zum Zusammenführen: „Nur ein Goo-Filter: Löschen-Knopf
   und Tropfen teilen sich `Linse.TROPFEN`." Hier steht es als Zahl: im
   Quelltext genau EINE Alpha-Schwelle (`0 0 0 k −c` in einem
   feColorMatrix), und sie steht in linse.ts; kein Stilblatt nennt einen
   anderen Klebefilter; wer fliesst, leiht ihn. Liest nur Dateien. */
console.log('\n§15 · Ein Klebefilter in der ganzen App');
{
  const alleTs = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
    const f = path.join(d, e.name);
    return e.isDirectory() ? (e.name === 'islands' ? [] : alleTs(f)) : (/\.ts$/.test(e.name) ? [f] : []);
  });
  const schwelle = /0 0 0 \d+(?:\.\d+)? -\d+(?:\.\d+)?/;
  const mitSchwelle = alleTs(path.join(WURZEL, 'src'))
    .filter(f => schwelle.test(fs.readFileSync(f, 'utf8')))
    .map(f => path.relative(WURZEL, f).split(path.sep).join('/')).sort();
  gleich('Im Quelltext steht EINE Alpha-Schwelle, und zwar in der Linse', mitSchwelle,
    ['src/schale/bedienung/linse.ts']);
  const stilOrt = path.join(WURZEL, 'quell/schale/stil');
  const fremdeKleber = fs.readdirSync(stilOrt).filter(f => f.endsWith('.css')).sort()
    .flatMap(f => [...fs.readFileSync(path.join(stilOrt, f), 'utf8').matchAll(/url\(#(ru-[a-z-]*goo[a-z-]*)\)/g)]
      .map(m => f + ' → #' + m[1]));
  gleich('Kein Stilblatt nennt einen eigenen Klebefilter', fremdeKleber, []);
  const leihtNicht = ['src/schale/bedienung/delete.ts', 'src/schale/bedienung/selection-flow.ts',
                      'src/schale/bedienung/tropfen.ts']
    .filter(f => !/Linse\.tropfenLeihen\(\)/.test(fs.readFileSync(path.join(WURZEL, f), 'utf8')));
  gleich('Löschen-Knopf, Meldungen und Tropfen leihen ihn (Linse.tropfenLeihen)', leihtNicht, []);
}

const browser = await chromium.launch();
const fehler: string[] = [];
const warte = (s: Page, ms: number) => s.waitForTimeout(ms);

const oeffnen = async (handy: boolean, weniger = false): Promise<{ ctx: BrowserContext; s: Page }> => {
  const ctx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    ...(handy ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
    reducedMotion: weniger ? 'reduce' : 'no-preference'
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(el => el.remove());
    App.theme('dark');
  });
  await s.mouse.move(2, 2);
  return { ctx, s };
};

const aufraeumen = (s: Page) => s.evaluate(() =>
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove()));

/** Eine Seite anlegen und öffnen — für das „⋯". */
const seiteAuf = (s: Page) => s.evaluate(async () => {
  const neu = Store.addPage(null, { text: 'Wärmepumpe — Notizen' });
  Store.addBlock(neu.id, 'text', { text: 'Vorlauftemperatur und Spreizung.' });
  await Store.flush();
  App.oeffne(neu.id);
  await new Promise(r => setTimeout(r, 600));
  return neu.id as string;
});

/* Was IN der Seite gemessen wird, als Zeichenkette — in jedem evaluate gleich. */
const MESSEN = `
  window.__kopf = () => [...document.querySelectorAll('.menu .ru-tropfen-kopf .ru-tropfen-knopf')]
    .map(b => (b.querySelector('.ru-tropfen-name')?.textContent || '').trim());
  window.__tropfenTraeger = () => [...document.querySelectorAll('*')]
    .filter(el => /ru-linse-tropfen/.test(getComputedStyle(el).filter || '')).length;
  window.__nurTransform = () => {
    const erlaubt = new Set(['offset', 'easing', 'composite', 'computedOffset', 'transform', 'opacity', 'scale']);
    const falsch = [];
    for (const a of document.getAnimations()) {
      const e = a.effect;
      if (!e || typeof e.getKeyframes !== 'function') continue;
      /* Nur, was dieser Bogen bewegt: Menü, Bühne, Linse und Satz. */
      const t = e.target;
      if (!t || !t.closest || !t.closest('.menu, .ru-tropfen-buehne, .lw-desk')) continue;
      for (const k of e.getKeyframes()) for (const n of Object.keys(k))
        if (!erlaubt.has(n)) falsch.push(n + ' @ ' + ((e.target && e.target.className) || '?'));
    }
    return [...new Set(falsch)];
  };
`;

/* ==========================================================================
 * §1–§4 · Das „+" am Rechner
 * ========================================================================*/
{
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(MESSEN);
  await seiteAuf(s);

  console.log('\n§1 · Das „+" am Rechner: das Menü wächst aus dem Knopf');
  await s.click('#studio-create');
  const frueh = await s.evaluate(() => ({
    buehne: !!document.querySelector('.ru-tropfen-buehne'),
    traeger: (window as any).__tropfenTraeger(),
    nurTransform: (window as any).__nurTransform(),
    filter: document.querySelectorAll('filter#ru-linse-tropfen').length
  }));
  await warte(s, 1300);
  const lage = await s.evaluate(() => {
    const k = document.getElementById('studio-create')!.getBoundingClientRect();
    const m = document.querySelector<HTMLElement>('.menu:not(.blatt)')?.getBoundingClientRect();
    return m ? { k: { l: k.left, r: k.right, t: k.top, b: k.bottom },
                 m: { l: m.left, r: m.right, t: m.top, b: m.bottom } } : null;
  });
  p('Das „+" öffnet ein Menü', !!lage);
  if (lage) {
    p('… es steht am Knopf und nicht oben links in der Ecke (senkrecht höchstens 14 px Luft)',
      Math.abs(lage.m.t - lage.k.b) <= 14 || Math.abs(lage.k.t - lage.m.b) <= 14,
      JSON.stringify(lage));
    p('… und waagrecht über dem Knopf (die Kanten überdecken sich)',
      lage.m.r >= lage.k.l && lage.m.l <= lage.k.r, JSON.stringify(lage));
  }
  /* Zusammenführen der zweiten Welle (5. Oktober): das Menü wächst seit
     E712 AUS dem Knopf — die Blase des Knopfs (E462, beim Zeigen) ragte
     darunter als „…llen" hervor. Solange das Menü offen ist, keine Blase. */
  const blase = await s.evaluate(() =>
    getComputedStyle(document.getElementById('studio-create')!, '::after').display);
  p('… und die Blase des Knopfs steht nicht unter dem offenen Menü', blase === 'none', blase);

  console.log('\n§2 · Drei runde Knöpfe oben, darunter jeder Weg');
  gleich('Oben: PDF einlesen · Neue Seite · Notizbuch', await s.evaluate(() => (window as any).__kopf()),
    ['PDF einlesen', 'Neue Seite', 'Notizbuch']);
  const kopf = await s.evaluate(() => {
    const m = document.querySelector('.menu')!;
    const k = m.querySelector('.ru-tropfen-kopf');
    const runde = [...m.querySelectorAll<HTMLElement>('.ru-tropfen-kopf .ru-tropfen-rund')]
      .map(r => { const q = r.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; });
    const namen = [...m.querySelectorAll<HTMLElement>('.ru-tropfen-knopf')].map(b => b.getAttribute('aria-label'));
    const liste = m.querySelector('.menu-liste');
    return {
      zuerst: !!k && !!liste && !!(k.compareDocumentPosition(liste) & Node.DOCUMENT_POSITION_FOLLOWING),
      runde, namen,
      wege: [...m.querySelectorAll<HTMLElement>('.menu-liste [data-neu]')].map(b => b.dataset['neu']),
      katalog: App.erstellenWege().map((w: any) => w.id),
      ohneDataNeu: m.querySelectorAll('.ru-tropfen-kopf [data-neu]').length
    };
  });
  p('Die Knöpfe stehen VOR der Liste, im selben Menü', kopf.zuerst);
  p('Jeder runde Knopf misst mindestens 44 × 44 px (§37)',
    kopf.runde.length === 3 && kopf.runde.every(([b, h]) => b! >= 44 && h! >= 44), JSON.stringify(kopf.runde));
  p('Jeder hat einen Namen für Vorleser (§38)', kopf.namen.every(n => !!n && n.length > 3), JSON.stringify(kopf.namen));
  gleich('Darunter JEDER Weg des Katalogs, in derselben Folge (§43)', kopf.wege, kopf.katalog);
  gleich('Die runden Knöpfe zählen nicht als zweiter Weg (kein data-neu)', kopf.ohneDataNeu, 0);

  console.log('\n§3 · Ein Tropfenfilter, nur während des Fliessens');
  p('Beim Öffnen fliesst ein Tropfen (die Bühne steht)', frueh.buehne);
  p('… und genau dann trägt eine Fläche den Tropfenfilter', frueh.traeger >= 1, String(frueh.traeger));
  gleich('… bewegt wird nur transform und opacity', frueh.nurTransform, []);
  /* DER FILTER STEHT NUR, SOLANGE ES FLIESST (Durchsicht E712). Hier stand
     „Der Filter steht genau einmal im Dokument" — auch in Ruhe. Das hat
     `test539` §2 rot gemacht: der Halter der Linse hält in Ruhe GENAU EINEN
     Filter, die Fahrt (E646: ein Filter, den niemand ruft, ist eine Zeile,
     die aussieht, als täte sie etwas). Jetzt: während des Fliessens genau
     einer, in Ruhe keiner — und der Halter wieder nur mit der Fahrt. */
  gleich('… und der Tropfenfilter steht dann genau einmal im Dokument', frueh.filter, 1);
  const ruhe = await s.evaluate(() => ({
    buehne: document.querySelectorAll('.ru-tropfen-buehne').length,
    traeger: (window as any).__tropfenTraeger(),
    filter: document.querySelectorAll('filter#ru-linse-tropfen').length,
    halter: [...document.querySelectorAll('#ru-linse-halter filter')].map(f => f.id)
  }));
  gleich('In Ruhe: keine Bühne mehr', ruhe.buehne, 0);
  gleich('In Ruhe: KEIN Element trägt den Tropfenfilter', ruhe.traeger, 0);
  gleich('In Ruhe: kein Tropfenfilter im Dokument', ruhe.filter, 0);
  gleich('In Ruhe hält der Halter der Linse nur die Fahrt (test539 §2)', ruhe.halter, ['ru-linse-fahrt']);

  console.log('\n§4 · Zu: sofort weg, und der Tropfen fliesst zurück');
  await s.keyboard.press('Escape');
  const zu = await s.evaluate(() => ({
    menue: document.querySelectorAll('.menu').length,
    zurueck: !!document.querySelector('.ru-tropfen-buehne')
  }));
  gleich('Escape nimmt das Menü sofort (E302)', zu.menue, 0);
  p('… und der Tropfen fliesst sichtbar in den Knopf zurück', zu.zurueck);
  await warte(s, 1200);
  gleich('… danach ist auch er weg', await s.evaluate(() => document.querySelectorAll('.ru-tropfen-buehne').length), 0);

  /* Zweimal auf, zweimal zu — und einmal so schnell, dass Teilen und
     Vereinen sich überschneiden: es bleibt kein Filter liegen. */
  for (let i = 0; i < 2; i++) {
    await s.click('#studio-create'); await warte(s, 700);
    await s.keyboard.press('Escape'); await warte(s, 700);
  }
  await s.click('#studio-create'); await warte(s, 60);
  const schnell = await s.evaluate(() => document.querySelectorAll('filter#ru-linse-tropfen').length);
  await s.keyboard.press('Escape'); await warte(s, 60);
  const ueberlappt = await s.evaluate(() => ({
    buehnen: document.querySelectorAll('.ru-tropfen-buehne').length,
    filter: document.querySelectorAll('filter#ru-linse-tropfen').length
  }));
  await warte(s, 1400);
  gleich('Schnell auf und zu: auch mit zwei Bühnen genau EIN Tropfenfilter', [schnell, ueberlappt.filter], [1, 1]);
  gleich('Nach viermal Auf und Zu: kein Tropfenfilter übrig, der Halter hält nur die Fahrt', await s.evaluate(() =>
    [document.querySelectorAll('filter#ru-linse-tropfen').length,
     document.querySelectorAll('#ru-linse-halter filter').length]), [0, 1]);

  /* Der runde Knopf „Neue Seite" tut, was der Eintrag „Neue Seite" tut. */
  const vorher = await s.evaluate(() => Store.rootPages().length);
  await s.click('#studio-create'); await warte(s, 700);
  await s.evaluate(() => document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="seite"]')?.click());
  await warte(s, 800);
  const nachher = await s.evaluate(() => ({ n: Store.rootPages().length, menue: document.querySelectorAll('.menu').length }));
  gleich('„Neue Seite" rund legt eine Seite an wie der Eintrag', nachher.n, vorher + 1);
  gleich('… und das Menü ist zu', nachher.menue, 0);

  /* ======================================================================
   * §5 · Das „⋯" der Seite
   * ====================================================================*/
  console.log('\n§5 · Das „⋯" der Seite');
  await aufraeumen(s);
  const id = await seiteAuf(s);
  await s.click('#btn-page-menu'); await warte(s, 900);
  gleich('Oben: Präsentieren · Merkzeichen · Teilen und ausgeben', await s.evaluate(() => (window as any).__kopf()),
    ['Präsentieren', 'Merkzeichen', 'Teilen und ausgeben']);
  const eintraege = await s.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.menu .menu-liste [data-a]')].map(b => b.dataset['a']));
  const muss = ['link', 'inhalt', 'dup', 'wz-verschieben', 'archiv', 'del', 'wz-praesi', 'klein', 'breit', 'pfad',
    'anpassen', 'offline', 'wz-gesperrt', 'mitki', 'fav', 'produkt-bereiche', 'rename', 'icon', 'cover', 'pid',
    'komm', 'vorschlag', 'uebersetzen', 'undo', 'export', 'import', 'stat2', 'updates', 'benach', 'verbind', 'papier'];
  const fehlt = muss.filter(a => !eintraege.includes(a));
  gleich('Jeder bisherige Eintrag steht weiter darunter (§43)', fehlt, []);
  const punkte = await s.evaluate(() => {
    const k = document.getElementById('btn-page-menu')!.getBoundingClientRect();
    const m = document.querySelector<HTMLElement>('.menu')!.getBoundingClientRect();
    return { k: [k.left, k.top, k.right, k.bottom], m: [m.left, m.top, m.right, m.bottom] };
  });
  p('Das Menü steht am „⋯" (senkrecht höchstens 14 px Luft)',
    Math.abs(punkte.m[1]! - punkte.k[3]!) <= 14 || Math.abs(punkte.k[1]! - punkte.m[3]!) <= 14, JSON.stringify(punkte));
  const merk = await s.evaluate(async (pid: string) => {
    const b = document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="merkzeichen"]');
    const vorher = b?.getAttribute('aria-pressed');
    b?.click();
    await new Promise(r => setTimeout(r, 300));
    const b2 = document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="merkzeichen"]');
    return { vorher, nachher: b2?.getAttribute('aria-pressed'), fav: !!Store.getBlock(pid)?.favorite,
             offen: !!document.querySelector('.menu'),
             eintrag: (document.querySelector('.menu .menu-liste [data-a="fav"]')?.textContent || '').trim(),
             kopf: document.getElementById('btn-fav')?.getAttribute('aria-pressed') };
  }, id);
  gleich('Das Merkzeichen füllt sich an Ort und Stelle', [merk.vorher, merk.nachher, merk.fav, merk.offen],
    ['false', 'true', true, true]);
  /* DER EINTRAG DARUNTER SAGT DASSELBE (Durchsicht E712). Hier stand nach
     dem runden Knopf weiter „Zu Favoriten" — ein Tipp darauf hätte das
     Merkzeichen wieder entfernt, unter einem Namen, der das Gegenteil
     verspricht. Das Merkzeichen im Kopf der Seite zieht mit. */
  gleich('… der Eintrag darunter heisst jetzt „Aus Favoriten entfernen", der Kopf zieht mit',
    [merk.eintrag, merk.kopf], ['Aus Favoriten entfernen', 'true']);
  const praesi = await s.evaluate(async () => {
    const W = (window as any).Werkzeuge;
    const alt = W.seitenMenueAktion;
    let gerufen = '';
    W.seitenMenueAktion = (a: string) => { gerufen = a; return true; };
    document.querySelector<HTMLElement>('.menu .ru-tropfen-knopf[data-tropfen="wz-praesi"]')?.click();
    await new Promise(r => setTimeout(r, 200));
    W.seitenMenueAktion = alt;
    return gerufen;
  });
  gleich('„Präsentieren" rund geht denselben Weg wie sein Eintrag', praesi, 'wz-praesi');
  await aufraeumen(s);
  await ctx.close();
}

/* ==========================================================================
 * §6 · Am Telefon
 * ========================================================================*/
{
  console.log('\n§6 · Am Telefon: dieselben drei Knöpfe im Blatt');
  const { ctx, s } = await oeffnen(true);
  await s.evaluate(MESSEN);
  await s.evaluate(() => App.erstellenBlatt());
  await warte(s, 900);
  const blatt = await s.evaluate(() => {
    const m = document.querySelector('.menu.blatt');
    const titel = m?.querySelector('.blatt-titel');
    const kopf = m?.querySelector('.ru-tropfen-kopf');
    return { da: !!m, nachTitel: !!titel && !!kopf && titel.nextElementSibling === kopf,
             wege: m?.querySelectorAll('.menu-liste [data-neu]').length,
             katalog: App.erstellenWege().length };
  });
  p('Das „+"-Blatt kommt', blatt.da);
  gleich('Drei runde Knöpfe', await s.evaluate(() => (window as any).__kopf()), ['PDF einlesen', 'Neue Seite', 'Notizbuch']);
  p('… direkt unter dem Titel', blatt.nachTitel);
  gleich('… und darunter jeder Weg', blatt.wege, blatt.katalog);
  await aufraeumen(s);

  /* DIE TROPFEN FLIESSEN DORTHIN, WO DIE KNÖPFE ANKOMMEN (Durchsicht E712).
     Am Telefon wurden die Ziele gemessen, als das Blatt noch ganz unten
     stand (translateY(100 %)): die Tropfen flossen abwärts quer durch die
     Liste, die Knöpfe erschienen oben. Gemessen wird das Ende jeder
     Tropfenbahn (der letzte Schritt ihrer Federbahn auf der Bühne) gegen die
     Mitte des runden Knopfs, wenn das Blatt steht. Ausgelöst wie von Hand:
     über das sichtbare „Neu" (mit Anker), sonst fliesst nichts. */
  const bahn = await s.evaluate(() => {
    const k = [...document.querySelectorAll<HTMLElement>('[data-neu-auf], #studio-create')]
      .find(b => b.getBoundingClientRect().width > 0);
    if (!k) return null;
    k.click();
    const st = document.querySelector<HTMLElement>('.ru-tropfen-buehne');
    if (!st) return [];
    const ox = parseFloat(st.style.left), oy = parseFloat(st.style.top);
    const zahl = (t: unknown): number[] =>
      (String(t).match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/) || []).slice(1).map(Number);
    return [...st.querySelectorAll<HTMLElement>('.ru-tropfen-kreis')].map(c => {
      const kf = (c.getAnimations()[0]?.effect as KeyframeEffect | undefined)?.getKeyframes() || [];
      return { a: zahl(kf[0]?.['transform']), b: zahl(kf[kf.length - 1]?.['transform']) };
    }).filter(z => z.a.length === 2 && z.b.length === 2 &&
      Math.abs(z.a[0]! - z.b[0]!) + Math.abs(z.a[1]! - z.b[1]!) > 4)
      .map(z => ({ x: ox + z.b[0]! + 22, y: oy + z.b[1]! + 22 }));
  });
  await warte(s, 1300);
  const runde = await s.evaluate(() => [...document.querySelectorAll<HTMLElement>('.menu.blatt .ru-tropfen-rund')]
    .map(r => { const q = r.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }));
  const daneben = (bahn || []).map((z, i) => Math.round(Math.hypot(z.x - (runde[i]?.x ?? 1e4), z.y - (runde[i]?.y ?? 1e4))));
  p('Jeder Tropfen endet in der Mitte seines runden Knopfs, wenn das Blatt steht (höchstens 8 px daneben)',
    daneben.length === 3 && daneben.every(d => d <= 8), JSON.stringify({ daneben, bahn, runde }));
  await aufraeumen(s);
  await ctx.close();
}

/* ==========================================================================
 * §7 · Ruhig und weniger Bewegung
 * ========================================================================*/
for (const [name, weniger] of [['„Ruhige Darstellung"', false], ['prefers-reduced-motion', true]] as const) {
  console.log(`\n§7 · ${name}: kein Tropfen, sofort`);
  const { ctx, s } = await oeffnen(false, weniger);
  await s.evaluate(MESSEN);
  if (!weniger) await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await seiteAuf(s);
  await s.click('#studio-create');
  const r = await s.evaluate(() => ({
    buehne: document.querySelectorAll('.ru-tropfen-buehne').length,
    kopf: document.querySelectorAll('.menu .ru-tropfen-kopf .ru-tropfen-knopf').length,
    laeuft: document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && !!t.closest('.menu') && a.playState === 'running' &&
        ((a.effect as KeyframeEffect).getComputedTiming().duration as number) > 5;
    }).length
  }));
  gleich('Kein Tropfen beim Öffnen', r.buehne, 0);
  gleich('Die drei Knöpfe stehen trotzdem da', r.kopf, 3);
  gleich('Am Menü läuft keine Bewegung', r.laeuft, 0);
  await s.keyboard.press('Escape');
  gleich('Kein Tropfen beim Schliessen', await s.evaluate(() => document.querySelectorAll('.ru-tropfen-buehne').length), 0);
  await ctx.close();
}

/* ==========================================================================
 * §8 · Die Linse über „Heute"
 * ========================================================================*/
{
  console.log('\n§8 · Die Linse gleitet einmal über „Aufmachen. / Weiterdenken."');
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(MESSEN);
  await s.evaluate(() => Produktwelten.lernen('heute'));
  await s.waitForSelector('.lw-desk h2', { timeout: 8000 });
  await warte(s, 150);
  const frueh = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk')!;
    const laeuft = document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && held.contains(t) && a.playState === 'running';
    });
    return { laeuft: laeuft.length, nurTransform: (window as any).__nurTransform(),
             linse: !!held.querySelector('.ru-held-linse[aria-hidden="true"]') };
  });
  p('Eine Linse liegt über dem Satz (aria-hidden)', frueh.linse);
  p('Beim Ankommen bewegt sie sich', frueh.laeuft > 0, String(frueh.laeuft));
  gleich('… nur transform und opacity', frueh.nurTransform, []);
  await warte(s, 2600);
  const spaeter = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk')!;
    const h2 = held.querySelector('h2')!;
    const laeuft = document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && held.contains(t) && a.playState === 'running';
    }).length;
    const bruch = [...held.querySelectorAll<HTMLElement>('.ru-held-linse *')]
      .some(el => /ru-linse-fahrt/.test(getComputedStyle(el).filter || ''));
    return { laeuft, text: (h2.textContent || '').replace(/\s+/g, ''),
             displacement: document.querySelectorAll('feDisplacementMap').length, bruch };
  });
  gleich('Danach steht alles still (keine Dauerbewegung)', spaeter.laeuft, 0);
  gleich('Die Überschrift bleibt echte Schrift', spaeter.text, 'Aufmachen.Weiterdenken.');
  /* VORLESER HÖREN SIE EINMAL (Durchsicht E712). Der Dunst, mit dem die
     Zeilen hereinkommen, ist `::before{content:attr(data-zeile)}` — und
     erzeugter Inhalt zählt zum Namen einer Überschrift. Vorgelesen wurde
     „Aufmachen. Aufmachen. Weiterdenken. Weiterdenken.". */
  const vorgelesen = await s.locator('.lw-desk h2').ariaSnapshot();
  gleich('Vorleser hören jede Zeile genau einmal', [
    (vorgelesen.match(/Aufmachen\./g) || []).length, (vorgelesen.match(/Weiterdenken\./g) || []).length], [1, 1]);
  p('In Ruhe bricht die Linse mit der Brechung aus linse.ts', spaeter.bruch);
  gleich('EINE Brechung im Dokument (keine dritte)', spaeter.displacement, 1);
  /* DIE LINSE BLEIBT AM SATZ, WENN DAS FENSTER SICH ÄNDERT (Durchsicht
     E712). Die Überschrift wächst mit dem Fenster (clamp(28px, 3.1vw,
     44px)); die Linse lag in den Pixeln des Ankommens und stand nach einer
     Grössenänderung irgendwo neben dem Wort, mit einer Abschrift in der
     alten Schriftgrösse. Gemessen bei 1000 px Breite: die Linse liegt an
     der zweiten Zeile, die Abschrift hat die Grösse der Überschrift — und
     es fährt dabei nichts neu los.
     NEBEN, NICHT AUF (E740). Hier stand „liegt weiter AUF der zweiten
     Zeile" — die Mitte der Linse über dem Wort. Redur hat am 11. Oktober
     2026 „Ja" gesagt zur Frage aus der Liste vom 5. Oktober, ob sie „neben
     dem Wort ruhen" soll. Seither: ihr linker Rand liegt rechts vom Ende der
     Zeile, höchstens eine halbe Schriftgrösse daneben, ihre Mitte auf der
     Höhe der Zeile. Zeichen für Zeichen misst es §16. */
  await s.setViewportSize({ width: 1000, height: 900 });
  await warte(s, 900);
  const schmal = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk');
    const l = held?.querySelector<HTMLElement>('.ru-held-linse');
    const z = [...(held?.querySelectorAll<HTMLElement>('.ru-held-zeile') || [])];
    const q = l?.getBoundingClientRect(), z2 = z[z.length - 1]?.getBoundingClientRect();
    const my = q ? q.top + q.height / 2 : -1;
    const bild = l?.querySelector<HTMLElement>('.ru-held-linse-bild');
    const h2 = held?.querySelector<HTMLElement>('h2');
    const fs = h2 ? parseFloat(getComputedStyle(h2).fontSize) : 0;
    return {
      nebenZeile: !!(q && q.width && z2 && q.left >= z2.right - 0.5 && q.left - z2.right <= fs / 2 &&
                     my >= z2.top && my <= z2.bottom),
      gleicheSchrift: !!bild && !!h2 && getComputedStyle(bild).fontSize === getComputedStyle(h2).fontSize,
      laeuft: document.getAnimations().filter(a => {
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
        return !!t && !!held && held.contains(t) && a.playState === 'running';
      }).length,
      lage: q && z2 ? { linksLinse: Math.round(q.left), endeZeile: Math.round(z2.right), mitte: Math.round(my),
                        zeile: [Math.round(z2.top), Math.round(z2.bottom)] } : null
    };
  });
  p('Schmaleres Fenster: die Linse liegt weiter NEBEN der zweiten Zeile, die Abschrift in der Grösse der Überschrift, nichts fährt',
    schmal.nebenZeile && schmal.gleicheSchrift && schmal.laeuft === 0, JSON.stringify(schmal));
  await s.setViewportSize({ width: 1440, height: 900 });
  await warte(s, 300);
  await s.evaluate(() => Einstellungen.S('bewegung', 'ruhig'));
  await s.evaluate(() => Produktwelten.lernen('heute'));
  await warte(s, 400);
  const still = await s.evaluate(() => {
    const held = document.querySelector('.lw-desk');
    return { linse: !!held?.querySelector('.ru-held-linse'),
             laeuft: document.getAnimations().filter(a => {
               const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
               return !!t && !!held && held.contains(t) && a.playState === 'running';
             }).length };
  });
  gleich('Ruhig: die Linse liegt still an ihrem Ort, nichts gleitet', [still.linse, still.laeuft], [true, 0]);
  await ctx.close();
}
{
  /* Dasselbe mit „weniger Bewegung" im System — die zweite Quelle. */
  const { ctx, s } = await oeffnen(false, true);
  await s.evaluate(() => Produktwelten.lernen('heute'));
  await s.waitForSelector('.lw-desk h2', { timeout: 8000 });
  const proben: number[] = [];
  for (let i = 0; i < 4; i++) {
    proben.push(await s.evaluate(() => {
      const held = document.querySelector('.lw-desk');
      return document.getAnimations().filter(a => {
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
        return !!t && !!held && held.contains(t) && a.playState === 'running';
      }).length;
    }));
    await warte(s, 120);
  }
  const da = await s.evaluate(() => !!document.querySelector('.lw-desk .ru-held-linse'));
  gleich('prefers-reduced-motion: die Linse liegt still, nichts gleitet, keine Zeile kommt geflogen',
    [da, Math.max(...proben)], [true, 0]);
  await ctx.close();
}
{
  /* KONTRAST HEISST: KEIN GLAS (Redur, 27.09., ca. 21:45: „Starker Kontrast
     ohne Glas"; grund.css schaltet dafür alles Glas deckend). Die Linse über
     „Heute" ist Glas mit Brechung (seit dem Nachtrag dichtes Glas, E695) —
     ohne Glas keine Linse. Durchsicht E712: in allen fünf Eingängen des Schalters ist sie
     weg; die Überschrift bleibt. Geprüft: die beiden in Redion und „mehr
     Kontrast" im System. */
  for (const [name, weg] of [['„Hoher Kontrast"', 'einstellung'], ['Schema „Starker Kontrast"', 'schema'],
                             ['System „mehr Kontrast"', 'system']] as const) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 },
      ...(weg === 'system' ? { contrast: 'more' as const } : {}) });
    const s = await ctx.newPage();
    s.on('pageerror', e => fehler.push(e.message));
    await s.goto(`http://127.0.0.1:${PORT}/index.html`);
    await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
      (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
    await s.evaluate((w: string) => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      if (w === 'einstellung') Einstellungen.S('kontrast', true);
      if (w === 'schema') (window as any).Aussehen.setzen({ schema: 'kontrast' });
    }, weg);
    await s.evaluate(() => Produktwelten.lernen('heute'));
    await s.waitForSelector('.lw-desk h2', { timeout: 8000 });
    await warte(s, 2200);
    const r = await s.evaluate(() => {
      const l = document.querySelector<HTMLElement>('.lw-desk .ru-held-linse');
      const q = l?.getBoundingClientRect();
      return { linse: !!l && !!q && q.width > 0 && getComputedStyle(l).display !== 'none',
               text: (document.querySelector('.lw-desk h2')?.textContent || '').replace(/\s+/g, '') };
    });
    gleich(`${name}: keine Linse über der Überschrift, die Schrift bleibt`, [r.linse, r.text], [false, 'Aufmachen.Weiterdenken.']);
    await ctx.close();
  }
}

/* ==========================================================================
 * §9 · Die Kacheln in „Mehr" (Telefon)
 * ========================================================================*/
const NAMEN = ['Dunkel', 'Fokus-Modus', 'Ruhige Darstellung', 'Hoher Kontrast', 'Zeitmesser', 'Schriftgrösse', 'Zeilenabstand'];
{
  console.log('\n§9 · Die Kacheln in „Mehr"');
  const { ctx, s } = await oeffnen(true);
  await s.evaluate(() => Ansichten.mehr());
  await warte(s, 700);
  const k = await s.evaluate(() => {
    const home = document.querySelector('.home');
    const kacheln = home?.querySelector('.ru-kacheln');
    const erstesH2 = home?.querySelector('h2');
    const alle = [...(kacheln?.querySelectorAll<HTMLElement>('[data-kachel]') || [])];
    return {
      da: !!kacheln,
      vorListe: !!kacheln && !!erstesH2 && !!(kacheln.compareDocumentPosition(erstesH2) & Node.DOCUMENT_POSITION_FOLLOWING),
      /* Der weiche Trennstrich (Durchsicht E712) ist Satz, nicht Name. */
      namen: alle.map(b => (b.querySelector('.ru-kachel-name')?.textContent || '').replace(/\u00AD/g, '').trim()),
      /* Steht jeder Name ganz in seiner Kachel? Die Schrift als Bereich
         gemessen, nicht als Kasten — der Kasten darf breiter sein. */
      abgeschnitten: alle.filter(b => {
        const n = b.querySelector('.ru-kachel-name');
        if (!n) return true;
        const bereich = document.createRange();
        bereich.selectNodeContents(n);
        const t = bereich.getBoundingClientRect(), q = b.getBoundingClientRect();
        return t.right > q.right - 1 || t.left < q.left + 1;
      }).map(b => (b.querySelector('.ru-kachel-name')?.textContent || '').replace(/\u00AD/g, '')),
      klein: alle.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length,
      schalter: alle.filter(b => b.hasAttribute('aria-pressed')).map(b => b.dataset['kachel']),
      regler: alle.filter(b => b.getAttribute('role') === 'slider')
        .map(b => [b.dataset['kachel'], b.getAttribute('aria-valuemin'), b.getAttribute('aria-valuemax'), !!b.getAttribute('aria-valuetext')]),
      wege: [...(home?.querySelectorAll<HTMLElement>('.home-liste [data-a]') || [])].map(b => b.dataset['a'])
    };
  });
  p('Die Kacheln stehen oben in „Mehr", vor der ersten Gruppe', k.da && k.vorListe);
  gleich('Sieben Griffe in dieser Folge', k.namen, NAMEN);
  gleich('Keiner unter 44 px (§37)', k.klein, 0);
  /* KEIN NAME ABGESCHNITTEN (Durchsicht E712). Am Telefon (390 px) ist eine
     Kachel 74 px breit, 50 px davon für die Schrift: dort stand
     „Schriftgröss" und „Zeilenabstan" — der Rest lag hinter dem Rand. */
  gleich('Kein Name ragt über seine Kachel hinaus (390 px)', k.abgeschnitten, []);
  gleich('Vier Schalter mit aria-pressed', k.schalter, ['dunkel', 'fokus', 'ruhig', 'kontrast']);
  gleich('Zwei Regler mit drei Stufen', k.regler,
    [['schrift', '0', '2', true], ['abstand', '0', '2', true]]);
  gleich('Jeder bisherige Weg in „Mehr" bleibt', k.wege,
    ['workspace', 'schublade', 'kompass', 'befehle', 'tasten', 'vorlagen', 'sichern', 'import', 'inbox', 'wolke',
     'papierkorb', 'einstellungen', 'ueber']);

  /* WER ÜBER DEN REGLER WISCHT, ROLLT „MEHR" (Durchsicht E712). Die zwei
     Regler trugen `touch-action:none` und zählten jede 28 px senkrecht als
     Stufe: wer „Mehr" mit dem Daumen auf „Schriftgrösse" nach oben rollen
     wollte, rollte nicht — und stellte die Schrift auf „Gross". Ein echter
     Wisch über das Protokoll des Browsers (CDP), nicht über Ereignisse von
     Hand: nur so entscheidet der Browser selbst, ob er rollt. */
  {
    const r = await s.evaluate(() => {
      const b = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="schrift"]');
      const q = b?.getBoundingClientRect();
      return q ? { x: q.left + q.width / 2, y: q.top + q.height / 2 } : null;
    });
    const vor = await s.evaluate(() => ({ top: document.getElementById('scroll')!.scrollTop,
      schrift: Einstellungen.V('schriftgroesse', 'normal') }));
    if (r) {
      const cdp = await ctx.newCDPSession(s);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: r.x, y: r.y }] });
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: r.x, y: r.y - i * 15 }] });
        await warte(s, 16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
      await warte(s, 600);
    }
    const nach = await s.evaluate(() => ({ top: document.getElementById('scroll')!.scrollTop,
      schrift: Einstellungen.V('schriftgroesse', 'normal') }));
    p('Ein Wisch nach oben über „Schriftgrösse" rollt „Mehr"', !!r && nach.top > vor.top + 40,
      JSON.stringify({ vor, nach }));
    gleich('… und lässt die Schriftgrösse, wie sie war', nach.schrift, vor.schrift);
    await s.evaluate(() => { const sc = document.getElementById('scroll')!; sc.scrollTop = 0; sc.dispatchEvent(new Event('scroll')); });
    await s.evaluate(() => Einstellungen.S('schriftgroesse', 'normal'));
    await warte(s, 400);
    /* DER TIPP DANACH ZÄHLT (Durchsicht E712). Ein Zug ohne Klick am Ende
       liess die Marke „gezogen" stehen, und sie schluckte den nächsten
       Tipp: nach dem Wisch blieb ein Tipp auf „Schriftgrösse" ohne Wirkung. */
    const t = await s.evaluate(() => {
      const q = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="schrift"]')?.getBoundingClientRect();
      return q ? { x: q.left + q.width / 2, y: q.top + q.height / 2 } : null;
    });
    if (t) await s.touchscreen.tap(t.x, t.y);
    await warte(s, 300);
    gleich('… und ein Tipp danach stellt eine Stufe weiter (Normal → Gross)',
      await s.evaluate(() => Einstellungen.V('schriftgroesse', 'normal')), 'gross');
    await s.evaluate(() => Einstellungen.S('schriftgroesse', 'normal'));
    await warte(s, 300);
  }

  const tu = async (was: string): Promise<void> => {
    await s.evaluate((w: string) => document.querySelector<HTMLElement>(`.home .ru-kacheln [data-kachel="${w}"]`)?.click(), was);
    await warte(s, 250);
  };
  await tu('dunkel');
  const hell = await s.evaluate(() => [document.documentElement.dataset['theme'],
    document.querySelector('.ru-kacheln [data-kachel="dunkel"]')?.getAttribute('aria-pressed')]);
  gleich('„Dunkel" schaltet wie #studio-theme (hell)', hell, ['light', 'false']);
  await tu('dunkel');
  gleich('… und zurück (dunkel)', await s.evaluate(() => document.documentElement.dataset['theme']), 'dark');
  await tu('fokus');
  gleich('„Fokus-Modus" schaltet body.fokus (Werkzeuge.fokus)', await s.evaluate(() => document.body.classList.contains('fokus')), true);
  await tu('fokus');
  gleich('… und wieder aus', await s.evaluate(() => document.body.classList.contains('fokus')), false);
  await tu('ruhig');
  gleich('„Ruhige Darstellung" setzt S(bewegung)', await s.evaluate(() => [document.body.dataset['bewegung'], Einstellungen.V('bewegung', '')]), ['ruhig', 'ruhig']);
  await tu('ruhig');
  await tu('kontrast');
  const gelb = await s.evaluate(() => {
    const b = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="kontrast"]');
    /* Ohne Kachel (vor E712) rot, nicht abgebrochen — §10 und §11 sollen weiterlaufen. */
    if (!b) return { kontrast: document.body.dataset['kontrast'], an: null, grund: [] as number[], schrift: [] as number[] };
    const cs = getComputedStyle(b), schicht = getComputedStyle(b, '::before');
    const zahl = (t: string) => (t.match(/[\d.]+/g) || []).map(Number);
    return { kontrast: document.body.dataset['kontrast'], an: b.getAttribute('aria-pressed'),
             grund: +schicht.opacity > 0.95 ? zahl(schicht.backgroundColor) : [], schrift: zahl(cs.color) };
  });
  p('„Hoher Kontrast" setzt S(kontrast)', gelb.kontrast === 'hoch' && gelb.an === 'true', JSON.stringify(gelb));
  p('… gelbe Kachel (die Farbschicht ::before), schwarze Schrift (Redur: „schwarze Schrift auf Gelb")',
    (gelb.grund[0] ?? 0) > 200 && (gelb.grund[1] ?? 0) > 170 && (gelb.grund[2] ?? 255) < 110 &&
    (gelb.schrift[0] ?? 255) < 60 && (gelb.schrift[1] ?? 255) < 60 && (gelb.schrift[2] ?? 255) < 60, JSON.stringify(gelb));
  await tu('kontrast');
  const regler = await s.evaluate(async () => {
    const r = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="schrift"]');
    const a = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="abstand"]');
    if (!r || !a) return { gross: [] as (string | null | undefined)[], klein: '', weit: '', normal: '' };
    r.focus();
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    const gross = [document.body.dataset['schrift'], r.getAttribute('aria-valuenow')];
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    const klein = document.body.dataset['schrift'];
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    a.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await new Promise(f => setTimeout(f, 120));
    return { gross, klein, weit: document.body.dataset['dichte'], normal: document.body.dataset['schrift'] };
  });
  gleich('Schriftgrösse: Pfeil rechts → gross', regler.gross, ['gross', '2']);
  gleich('… Pos1 → klein', regler.klein, 'klein');
  gleich('Zeilenabstand: Ende → weit', regler.weit, 'weit');
  await s.evaluate(() => { Einstellungen.S('dichte', 'normal'); Einstellungen.S('schriftgroesse', 'normal'); });
  await tu('zeit');
  gleich('„Zeitmesser" öffnet das Feld (Zeitmesser.panel)', await s.evaluate(() => !!document.querySelector('.zm-feld')), true);
  await s.evaluate(() => document.querySelector('.zm-feld')?.remove());

  const leiste = await s.evaluate(async () => {
    const sc = document.getElementById('scroll')!;
    const l = document.querySelector<HTMLElement>('.ru-kacheln-leiste');
    const vorher = l ? !l.hidden : null;
    sc.scrollTop = sc.scrollHeight;
    sc.dispatchEvent(new Event('scroll'));
    await new Promise(f => setTimeout(f, 700));
    const l2 = document.querySelector<HTMLElement>('.ru-kacheln-leiste');
    const chips = [...(l2?.querySelectorAll<HTMLElement>('[data-kachel]') || [])];
    return { vorher, nachher: l2 ? !l2.hidden : null,
             chips: chips.length, klein: chips.filter(c => c.getBoundingClientRect().height < 44).length };
  });
  gleich('Oben: keine Chipleiste', leiste.vorher, false);
  gleich('Gerollt: die Kacheln werden zur Chipleiste', leiste.nachher, true);
  p('… mit allen sieben Griffen, keiner unter 44 px', leiste.chips === 7 && leiste.klein === 0, JSON.stringify(leiste));
  await ctx.close();
}

/* ==========================================================================
 * §10 · Die Kacheln in den Einstellungen (Rechner)
 * ========================================================================*/
{
  console.log('\n§10 · Die Kacheln oben in „Allgemein", die Felder darunter');
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(() => Einstellungen.oeffne('allgemein'));
  await warte(s, 700);
  const e = await s.evaluate(() => {
    const ei = document.getElementById('ei')!;
    const h2 = ei.querySelector('h2');
    const kacheln = ei.querySelector('.ru-kacheln');
    const felder = [...ei.querySelectorAll<HTMLElement>('[data-set],[data-toggle]')]
      .map(f => f.dataset['set'] || f.dataset['toggle']);
    return { direkt: !!h2 && !!kacheln && h2.nextElementSibling === kacheln,
             namen: [...(kacheln?.querySelectorAll('.ru-kachel-name') || [])].map(n => (n.textContent || '').replace(/\u00AD/g, '').trim()),
             felder };
  });
  p('Die Kacheln stehen direkt unter „Einstellungen"', e.direkt);
  gleich('Dieselben sieben Griffe', e.namen, NAMEN);
  gleich('Die Auswahlfelder bleiben, wo sie sind (§43)', e.felder,
    ['theme', 'schriftgroesse', 'dichte', 'startAnsicht', 'wochenstart', 'datumsformat', 'zeitformat', 'kontrast',
     'bewegung', 'lesen', 'enterZeile', 'rechtschreib', 'seiteZu']);
  const sync = await s.evaluate(async () => {
    const r = document.querySelector<HTMLElement>('#ei .ru-kacheln [data-kachel="abstand"]');
    if (!r) return { nachKachel: '', kachel: null as string | null };
    r.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await new Promise(f => setTimeout(f, 150));
    const feld = document.querySelector<HTMLSelectElement>('#ei select[data-set="dichte"]')!;
    const nachKachel = feld.value;
    feld.value = 'weit';
    feld.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(f => setTimeout(f, 200));
    const r2 = document.querySelector<HTMLElement>('#ei .ru-kacheln [data-kachel="abstand"]');
    return { nachKachel, kachel: r2 ? r2.getAttribute('aria-valuenow') : null };
  });
  gleich('Kachel → Feld: derselbe Stand', sync.nachKachel, 'eng');
  gleich('Feld → Kachel: derselbe Stand', sync.kachel, '2');
  await s.evaluate(() => Einstellungen.S('dichte', 'normal'));
  await ctx.close();
}

/* ==========================================================================
 * §12 · Die Schrift der Kacheln ist lesbar — in jedem Schema (Durchsicht E712)
 * ----------------------------------------------------------------------------
 * Gemessen am gerenderten Bild, nicht an den Marken: die Schrift wird
 * durchsichtig gemacht, der Grund aus den Pixeln unter ihr gelesen (Glas,
 * Farbschicht, Füllung des Reglers — was eben darunter liegt), die
 * Schriftfarbe mit der Deckkraft aller Ahnen darübergelegt; zählt der
 * SCHLIMMSTE Pixel. Vorher stand der Stand („An", „Normal") mit Deckkraft
 * .75 da: 3,6 : 1 auf der Akzentfarbe (Standard dunkel), 4,1 : 1 auf der
 * Füllung (Hell). Zehn Schemata, je ohne Schalter, mit „Hoher Kontrast"
 * (die gelbe Kachel) und mit „Ruhige Darstellung" (eine zweite gedrückte).
 * ========================================================================*/
{
  console.log('\n§12 · Die Schrift der Kacheln, am Bild gemessen, in jedem Schema');
  const { ctx, s } = await oeffnen(true);
  const schemata: string[] = await s.evaluate(() => (Aussehen.SCHEMATA as Array<{ id: string }>).map(x => x.id));
  p('Zehn Schemata zum Durchmessen', schemata.length === 10, String(schemata.length));
  const messen = async (): Promise<Array<{ t: string; min: number }>> => {
    const n = await s.evaluate(() => {
      const els = [...document.querySelectorAll<HTMLElement>('.ru-kacheln .ru-kachel-name, .ru-kacheln .ru-kachel-stand')]
        .filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= innerHeight; });
      els.forEach((e, i) => {
        e.dataset['m589'] = String(i);
        e.dataset['m589farbe'] = getComputedStyle(e).color;
        let o = 1;
        for (let x: Element | null = e; x && x !== document.documentElement; x = x.parentElement) o *= parseFloat(getComputedStyle(x).opacity) || 1;
        e.dataset['m589deck'] = String(o);
        e.style.setProperty('color', 'transparent', 'important');
      });
      return els.length;
    });
    await warte(s, 60);
    const bild = (await s.screenshot()).toString('base64');
    const raus = await s.evaluate(async (b64: string) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
      const dpr = img.width / innerWidth;
      const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const L = (r: number, gg: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
      const farbe = (t: string): number[] => {
        let m = t.match(/color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/);
        if (m) return [+m[1]! * 255, +m[2]! * 255, +m[3]! * 255, m[4] ? +m[4] : 1];
        m = t.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        return m ? [+m[1]!, +m[2]!, +m[3]!, m[4] ? +m[4] : 1] : [0, 0, 0, 1];
      };
      const liste: Array<{ t: string; min: number }> = [];
      for (const e of document.querySelectorAll<HTMLElement>('[data-m589]')) {
        const r = e.getBoundingClientRect();
        const x = Math.round(r.left * dpr), y = Math.round(r.top * dpr);
        const w = Math.max(1, Math.min(c.width - x, Math.round(r.width * dpr)));
        const h = Math.max(1, Math.min(c.height - y, Math.round(r.height * dpr)));
        const d = g.getImageData(x, y, w, h).data;
        const [tr, tg, tb, ta] = farbe(e.dataset['m589farbe'] || '');
        const a = (ta ?? 1) * parseFloat(e.dataset['m589deck'] || '1');
        let min = 99;
        for (let i = 0; i < d.length; i += 12) {
          const br = d[i]!, bg = d[i + 1]!, bb = d[i + 2]!;
          const l1 = L(a * tr! + (1 - a) * br, a * tg! + (1 - a) * bg, a * tb! + (1 - a) * bb), l2 = L(br, bg, bb);
          min = Math.min(min, (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
        }
        liste.push({ t: (e.textContent || '').replace(/­/g, '').trim(), min: +min.toFixed(2) });
        e.style.removeProperty('color');
        delete e.dataset['m589']; delete e.dataset['m589farbe']; delete e.dataset['m589deck'];
      }
      return liste;
    }, bild);
    return n ? raus : [];
  };
  for (const zustand of ['ohne Schalter', '„Hoher Kontrast" an', '„Ruhige Darstellung" an'] as const) {
    const schlecht: string[] = [];
    let gemessen = 0;
    for (const sch of schemata) {
      await s.evaluate(({ sch, zustand }) => {
        Aussehen.setzen({ schema: sch });
        Einstellungen.S('kontrast', zustand.includes('Kontrast'));
        Einstellungen.S('bewegung', zustand.includes('Ruhige') ? 'ruhig' : 'normal');
        Ansichten.mehr();
        const sc = document.getElementById('scroll'); if (sc) sc.scrollTop = 0;
      }, { sch, zustand });
      await warte(s, 450);
      const m = await messen();
      gemessen += m.length;
      for (const x of m) if (x.min < 4.5) schlecht.push(`${sch}: „${x.t}" ${x.min}`);
    }
    p(`${zustand}: Name und Stand jeder Kachel ≥ 4,5 : 1 am schlimmsten Pixel (${gemessen} gemessen)`,
      gemessen >= schemata.length * 14 && schlecht.length === 0, `${schlecht.length}: ` + schlecht.slice(0, 8).join(' · '));
  }
  await s.evaluate(() => { Einstellungen.S('kontrast', false); Einstellungen.S('bewegung', 'normal'); Aussehen.setzen({ schema: 'standard' }); });
  await ctx.close();
}

/* ==========================================================================
 * §13 · Nachtrag der zweiten Durchsicht (E712)
 * ----------------------------------------------------------------------------
 * Jede Zusage gegen den Stand der ersten Durchsicht rot gesehen:
 *   a  Die runden Knöpfe kommen oben DAZU: unter ihnen hat die Liste so viel
 *      Höhe wie vorher das ganze Menü (60 % des Fensters) — beim „⋯" standen
 *      „Volle Breite", „Pfadnavigation" und „Seite anpassen" sonst unter dem
 *      Rand, wo sie vorher zu sehen waren.
 *   b  „Neu erstellen" aus der Kante und „Alle Wege …" der Notizhefte
 *      wachsen aus IHREM Knopf — nicht aus dem „+" oben rechts, quer über
 *      den Schirm (der Fund von E712, auf zwei Wegen wieder da).
 *   c  Ein Zug am Regler mit der Maus endet auch draussen: wer danach nur
 *      darüberfährt, stellt nichts.
 *   d  Die Kachel „Zeitmesser" zeigt die laufende Uhr und zählt mit.
 *   e  Die Linse trägt Schrift, also dichtes Glas (E695): die Schrift unter
 *      ihr scheint nicht doppelt durch („Weiterdenk“ + grosses „en“).
 *      Seit E740 ruht sie NEBEN dem Wort, über leerem Grund — dort wäre die
 *      Messung immer grün. Sie hält deshalb die Fahrt an, wo die Linse über
 *      Schrift steht: am Ende der ersten Zeile („Aufmachen.").
 * ========================================================================*/
{
  console.log('\n§13 · Nachtrag: Platz, Anker, Zug, Uhr, dichte Linse');
  const { ctx, s } = await oeffnen(false);
  await seiteAuf(s);

  /* a · Platz unter den runden Knöpfen */
  for (const [name, knopf] of [['„+"', '#studio-create'], ['„⋯"', '#btn-page-menu']] as const) {
    await s.click(knopf); await warte(s, 900);
    const r = await s.evaluate(() => {
      const m = document.querySelector<HTMLElement>('.menu');
      const k = m?.querySelector<HTMLElement>('.ru-tropfen-kopf');
      if (!m || !k) return null;
      const mr = m.getBoundingClientRect(), kr = k.getBoundingClientRect();
      return { unten: Math.round(mr.bottom - kr.bottom), noetig: Math.round(m.scrollHeight - (kr.bottom - mr.top)),
               soll: Math.round(innerHeight * 0.6), imFenster: mr.top >= 0 && mr.bottom <= innerHeight };
    });
    p(`${name}: unter den runden Knöpfen hat die Liste ihre 60 % des Fensters (höchstens 16 px weniger), das Menü bleibt im Fenster`,
      !!r && r.unten >= Math.min(r.soll, r.noetig) - 16 && r.imFenster, JSON.stringify(r));
    await s.keyboard.press('Escape'); await warte(s, 500);
  }

  /* b · Aus SEINEM Knopf: die Kante und die Notizhefte */
  const amKnopf = (sel: string) => s.evaluate((sel: string) => {
    const b = document.querySelector<HTMLElement>(sel)?.getBoundingClientRect();
    const m = document.querySelector<HTMLElement>('.menu.ru-tropfen-menue')?.getBoundingClientRect();
    if (!b || !m || !b.width) return { ok: false, knopf: null as number[] | null, menue: null as number[] | null };
    const senkrecht = Math.min(Math.abs(m.top - b.bottom), Math.abs(b.top - m.bottom)) <= 14 && m.left < b.right && m.right > b.left;
    const waagrecht = Math.min(Math.abs(m.left - b.right), Math.abs(b.left - m.right)) <= 14 && m.top < b.bottom && m.bottom > b.top;
    const z = (q: DOMRect) => [q.left, q.top, q.right, q.bottom].map(Math.round);
    return { ok: senkrecht || waagrecht, knopf: z(b), menue: z(m) };
  }, sel);
  /* „Neu erstellen" steht in der Kante, wenn die ruhige Fassung aus ist (E218). */
  await s.evaluate(() => Ruhig.setzen(false)); await warte(s, 400);
  const kanteDa = await s.evaluate(() => (document.querySelector<HTMLElement>('#kante .k-knopf[data-k="neu"]')?.getBoundingClientRect().width || 0) > 0);
  if (kanteDa) { await s.click('#kante .k-knopf[data-k="neu"]'); await warte(s, 900); }
  const kante = await amKnopf('#kante .k-knopf[data-k="neu"]');
  p('„Neu erstellen" in der Kante: das Menü wächst aus diesem Knopf', kanteDa && kante.ok, JSON.stringify(kante));
  await s.keyboard.press('Escape'); await warte(s, 400);
  await s.evaluate(() => Ruhig.setzen(true)); await warte(s, 300);
  await s.evaluate(() => Notebook.oeffnen()); await warte(s, 900);
  const heftDa = await s.evaluate(() => (document.querySelector<HTMLElement>('[data-neu-menue]')?.getBoundingClientRect().width || 0) > 0);
  if (heftDa) {
    await s.click('[data-neu-menue]'); await warte(s, 500);
    await s.click('.menu [data-w="alle"]'); await warte(s, 900);
  }
  const heft = await amKnopf('[data-neu-menue]');
  p('Notizhefte „＋ Neu" → „Alle Wege …": das Menü wächst aus „＋ Neu"', heftDa && heft.ok, JSON.stringify(heft));
  await s.keyboard.press('Escape'); await warte(s, 400);

  /* c · Ein Zug mit der Maus endet auch draussen */
  await s.evaluate(() => Ansichten.mehr()); await warte(s, 700);
  const r = await s.evaluate(() => {
    const q = document.querySelector<HTMLElement>('.ru-kacheln [data-kachel="schrift"]')?.getBoundingClientRect();
    const t = document.querySelector<HTMLElement>('.ru-kacheln')?.getBoundingClientRect();
    return q && t ? { x: q.left + q.width / 2, y: q.top + q.height / 2, oben: t.top } : null;
  });
  let zug = { los: '', haelt: true as boolean | undefined, danach: '' , draussen: false };
  if (r) {
    await s.mouse.move(r.x, r.y); await s.mouse.down();
    for (let i = 1; i <= 10; i++) { await s.mouse.move(r.x, r.y - i * 16); await warte(s, 16); }
    zug.draussen = r.y - 160 < r.oben;
    zug.los = await s.evaluate(() => Einstellungen.V('schriftgroesse', 'normal'));
    await s.mouse.up(); await warte(s, 100);
    zug.haelt = await s.evaluate(() => document.querySelector('.ru-kacheln [data-kachel="schrift"]')?.hasAttribute('data-haelt'));
    for (let i = 0; i <= 10; i++) { await s.mouse.move(r.x, r.y - 40 + i * 12); await warte(s, 16); }
    await warte(s, 200);
    zug.danach = await s.evaluate(() => Einstellungen.V('schriftgroesse', 'normal'));
  }
  gleich('Maus: über die Kacheln hinaus gezogen und draussen losgelassen — der Zug ist zu Ende, Darüberfahren stellt nichts',
    [zug.draussen, zug.los, zug.haelt, zug.danach], [true, 'gross', false, 'gross']);
  await s.evaluate(() => Einstellungen.S('schriftgroesse', 'normal')); await warte(s, 300);

  /* d · Die Kachel „Zeitmesser" zählt mit */
  const uhr = () => s.evaluate(() => (document.querySelector('.ru-kacheln [data-kachel="zeit"] .ru-kachel-stand')?.textContent || ''));
  await s.evaluate(() => Zeitmesser.start('stoppuhr'));
  await warte(s, 1300); const u1 = await uhr();
  await warte(s, 2200); const u2 = await uhr();
  await s.evaluate(() => Zeitmesser.stopp()); await warte(s, 600); const u3 = await uhr();
  p('„Zeitmesser": die Kachel zeigt die laufende Uhr, zählt mit und kehrt gestoppt zu „Stoppuhr und Timer" zurück',
    u1.startsWith('Läuft') && u2.startsWith('Läuft') && u1 !== u2 && u3 === 'Stoppuhr und Timer', JSON.stringify([u1, u2, u3]));

  /* e · Die Linse ist dicht: ohne ihre Abschrift sieht man in ihr fast nichts.
     WO GEMESSEN WIRD (E740). Hier wurde in RUHE gemessen, als die Linse über
     „ken" lag. Seit sie NEBEN dem Wort ruht, liegt unter ihr leerer Grund —
     der Kontrast darin ist dann immer klein, auch bei einer Linse aus
     Seidenpapier, und die Zusage wäre eine Behauptung (§55.2). Also wird die
     Fahrt dort angehalten, wo die Linse über Schrift steht: am Ende der
     ersten Zeile, wo sie wartet (T1 260 ms + Feder „knapp", weiter bei
     900 ms). Erst wird geprüft, dass dort wirklich Buchstaben UNTER ihr
     liegen und sie voll da ist (Deckkraft ≥ 0,98: das Aufploppen auf der
     Feder „lebhaft" schwingt bei 780 ms noch mit 0,998 aus), dann gemessen.
     Gegenprobe: dieselbe Linse zu 35 % gedeckt (der Stand vor dem Nachtrag)
     macht diese Zeile rot. */
  for (const thema of ['dark', 'light'] as const) {
    await s.evaluate((t: string) => { App.theme(t); Produktwelten.lernen('heute'); }, thema);
    await s.waitForSelector('.lw-desk .ru-held-linse', { timeout: 8000 });
    const kreis = await s.evaluate(() => {
      const held = document.querySelector('.lw-desk')!;
      const anim = document.getAnimations().filter(a => {
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
        return !!t && held.contains(t);
      });
      anim.forEach(a => { a.pause(); a.currentTime = 780; });
      const l = held.querySelector<HTMLElement>('.ru-held-linse');
      const q = l?.getBoundingClientRect();
      let unter = 0;
      if (q && q.width) {
        const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
        for (const z of held.querySelectorAll<HTMLElement>('h2 .ru-held-zeile')) {
          const t = z.firstChild as Text | null;
          if (!t) continue;
          for (let i = 0; i < t.data.length; i++) {
            if (!t.data[i]!.trim()) continue;
            const rg = document.createRange(); rg.setStart(t, i); rg.setEnd(t, i + 1);
            const r = rg.getBoundingClientRect();
            if (Math.abs(r.left + r.width / 2 - cx) < q.width * 0.35 && Math.abs(r.top + r.height / 2 - cy) < q.height * 0.35) unter++;
          }
        }
      }
      const deckt = l ? parseFloat(getComputedStyle(l).opacity) : 0;
      document.querySelectorAll<HTMLElement>('.ru-held-linse-glas, .ru-held-linse-frost').forEach(e => { e.style.visibility = 'hidden'; });
      return q && q.width ? { x: q.left + q.width / 2, y: q.top + q.height / 2, r: q.width / 2, unter, deckt, angehalten: anim.length } : null;
    });
    await warte(s, 80);
    let k = 99;
    if (kreis) {
      const bild = (await s.screenshot()).toString('base64');
      k = await s.evaluate(async ({ b64, kreis }) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
        const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const L = (r: number, gg: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
        const R = Math.floor(kreis.r * 0.7), w = 2 * R;
        const d = g.getImageData(Math.round(kreis.x - R), Math.round(kreis.y - R), w, w).data;
        let lo = 9, hi = -1;
        for (let i = 0; i < d.length; i += 4) {
          const px = (i / 4) % w - R, py = Math.floor(i / 4 / w) - R;
          if (px * px + py * py > R * R) continue;
          const l = L(d[i]!, d[i + 1]!, d[i + 2]!); lo = Math.min(lo, l); hi = Math.max(hi, l);
        }
        return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
      }, { b64: bild, kreis });
    }
    p(`${thema === 'dark' ? 'Dunkel' : 'Hell'}: über „Aufmachen." angehalten liegen Buchstaben unter der Linse, und sie scheinen nicht durch (ohne Abschrift < 1,5 : 1)`,
      !!kreis && kreis.unter > 0 && kreis.deckt >= 0.98 && k < 1.5,
      `${k} : 1 · ${JSON.stringify(kreis)}`);
    /* Die angehaltene Fahrt zu Ende bringen, damit nichts hängen bleibt. */
    await s.evaluate(() => {
      const held = document.querySelector('.lw-desk');
      document.getAnimations().forEach(a => {
        const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
        if (t && held?.contains(t)) a.finish();
      });
    });
    await warte(s, 200);
  }
  await s.evaluate(() => App.theme('dark'));
  await ctx.close();
}

{
  /* f · Je Rollfläche EIN Beobachter der Kacheln: „Mehr" fünfmal gezeichnet,
     es lauscht weiter genau einer (vorher blieb jeder stehen, samt seinen
     alten Kacheln). Gezählt an der echten Klasse, nur umwickelt. */
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const Echt = window.IntersectionObserver;
    const alle: any[] = [];
    (window as any).__io589 = alle;
    window.IntersectionObserver = class extends Echt {
      ziele: Element[] = []; aus = false;
      constructor(cb: IntersectionObserverCallback, o?: IntersectionObserverInit) { super(cb, o); alle.push(this); }
      override observe(t: Element): void { this.ziele.push(t); super.observe(t); }
      override disconnect(): void { this.aus = true; super.disconnect(); }
    } as any;
  });
  const s = await ctx.newPage();
  s.on('pageerror', e => fehler.push(e.message));
  await s.goto(`http://127.0.0.1:${PORT}/index.html`);
  await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
    (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
  });
  for (let i = 0; i < 5; i++) { await s.evaluate(() => Ansichten.mehr()); await warte(s, 250); }
  const lauschen = await s.evaluate(() => ((window as any).__io589 as any[])
    .filter(o => !o.aus && o.ziele.some((t: Element) => t.classList?.contains('ru-kacheln-gitter'))).length);
  gleich('„Mehr" fünfmal gezeichnet: genau EIN Beobachter der Kacheln lauscht noch', lauschen, 1);
  await ctx.close();
}

/* ==========================================================================
 * §14 · Dritte Durchsicht (E712)
 * ----------------------------------------------------------------------------
 *   a  Einstellungen → „Zeitmesser": das Feld der Uhr steht OBEN (der Punkt
 *      in seiner Mitte gehört ihm), ist nicht stillgelegt, und ein echter
 *      Klick auf „Stoppuhr" startet die Uhr. Vorher öffnete die Kachel das
 *      Feld HINTER dem Fenster der Einstellungen (`.zm-feld` z 45, `.overlay`
 *      z 700) und Fokus legte es still — man sah nichts geschehen.
 * ========================================================================*/
{
  console.log('\n§14 · Dritte Durchsicht: ein Weg aus den Einstellungen führt hinaus');
  const { ctx, s } = await oeffnen(false);
  await s.evaluate(() => Einstellungen.oeffne('allgemein'));
  await warte(s, 700);
  const da = await s.evaluate(() => !!document.querySelector('#ei .ru-kacheln [data-kachel="zeit"]'));
  if (da) { await s.click('#ei .ru-kacheln [data-kachel="zeit"]'); await warte(s, 500); }
  const feld = await s.evaluate(() => {
    const f = document.querySelector<HTMLElement>('.zm-feld');
    if (!f) return { feld: false, oben: false, bedienbar: false };
    const q = f.getBoundingClientRect();
    const t = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
    let still = false;
    for (let x: HTMLElement | null = f; x; x = x.parentElement) if (x.inert) still = true;
    return { feld: true, oben: !!t && f.contains(t), bedienbar: !still };
  });
  let laeuft = false;
  if (feld.oben) {
    try { await s.click('.zm-feld [data-zm="stoppuhr"]', { timeout: 2000 }); } catch { /* verdeckt: unten rot */ }
    await warte(s, 300);
    laeuft = await s.evaluate(() => !!Zeitmesser.stand()?.laeuft);
  }
  gleich('Einstellungen → „Zeitmesser": das Feld der Uhr steht oben, ist bedienbar, und „Stoppuhr" startet sie',
    [da, feld.feld, feld.oben, feld.bedienbar, laeuft], [true, true, true, true, true]);
  await s.evaluate(() => { try { Zeitmesser.stopp(); } catch { /* … */ } document.querySelector('.zm-feld')?.remove(); });
  await ctx.close();

  /* b · Die Namen unter den runden Knöpfen, am Bild (wie §12): Schrift
     durchsichtig, Grund aus den Pixeln, Schriftfarbe mit der Deckkraft der
     Ahnen darüber, der SCHLIMMSTE Pixel zählt. */
  for (const handy of [false, true]) {
    const { ctx: c2, s: s2 } = await oeffnen(handy);
    await seiteAuf(s2);
    const schemata: string[] = await s2.evaluate(() => (Aussehen.SCHEMATA as Array<{ id: string }>).map(x => x.id));
    const schlecht: string[] = [];
    let gemessen = 0;
    for (const sch of schemata) {
      await s2.evaluate((sch: string) => { Aussehen.setzen({ schema: sch }); }, sch);
      await warte(s2, 250);
      await s2.evaluate((h: boolean) => App.erstellenBlatt(h ? null : document.getElementById('studio-create')), handy);
      await warte(s2, 1000);
      const n = await s2.evaluate(() => {
        const els = [...document.querySelectorAll<HTMLElement>('.menu .ru-tropfen-name')]
          .filter(e => { const r = e.getBoundingClientRect(); return r.width > 2 && r.top >= 0 && r.bottom <= innerHeight; });
        els.forEach((e, i) => {
          e.dataset['m589n'] = String(i);
          e.dataset['m589farbe'] = getComputedStyle(e).color;
          let o = 1;
          for (let x: Element | null = e; x && x !== document.documentElement; x = x.parentElement) o *= parseFloat(getComputedStyle(x).opacity) || 1;
          e.dataset['m589deck'] = String(o);
          e.style.setProperty('color', 'transparent', 'important');
        });
        return els.length;
      });
      await warte(s2, 60);
      const bild = (await s2.screenshot()).toString('base64');
      const werte = await s2.evaluate(async (b64: string) => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
        const dpr = img.width / innerWidth;
        const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const L = (r: number, gg: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(gg) + 0.0722 * lin(b);
        const farbe = (t: string): number[] => {
          let m = t.match(/color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/);
          if (m) return [+m[1]! * 255, +m[2]! * 255, +m[3]! * 255, m[4] ? +m[4] : 1];
          m = t.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
          return m ? [+m[1]!, +m[2]!, +m[3]!, m[4] ? +m[4] : 1] : [0, 0, 0, 1];
        };
        const liste: Array<{ t: string; min: number }> = [];
        for (const e of document.querySelectorAll<HTMLElement>('[data-m589n]')) {
          const r = e.getBoundingClientRect();
          const x = Math.round(r.left * dpr), y = Math.round(r.top * dpr);
          const w = Math.max(1, Math.min(c.width - x, Math.round(r.width * dpr)));
          const h = Math.max(1, Math.min(c.height - y, Math.round(r.height * dpr)));
          const d = g.getImageData(x, y, w, h).data;
          const [tr, tg, tb, ta] = farbe(e.dataset['m589farbe'] || '');
          const a = (ta ?? 1) * parseFloat(e.dataset['m589deck'] || '1');
          let min = 99;
          for (let i = 0; i < d.length; i += 12) {
            const br = d[i]!, bg = d[i + 1]!, bb = d[i + 2]!;
            const l1 = L(a * tr! + (1 - a) * br, a * tg! + (1 - a) * bg, a * tb! + (1 - a) * bb), l2 = L(br, bg, bb);
            min = Math.min(min, (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
          }
          liste.push({ t: (e.textContent || '').trim(), min: +min.toFixed(2) });
          e.style.removeProperty('color');
          delete e.dataset['m589n']; delete e.dataset['m589farbe']; delete e.dataset['m589deck'];
        }
        return liste;
      }, bild);
      gemessen += n ? werte.length : 0;
      for (const x of werte) if (x.min < 4.5) schlecht.push(`${sch}: „${x.t}" ${x.min}`);
      await s2.keyboard.press('Escape'); await warte(s2, 400);
      await aufraeumen(s2);
    }
    p(`${handy ? 'Telefon, Blatt' : 'Rechner'} „+": die Namen unter den runden Knöpfen ≥ 4,5 : 1 am schlimmsten Pixel, zehn Schemata (${gemessen} gemessen)`,
      gemessen >= schemata.length * 3 && schlecht.length === 0, `${schlecht.length}: ` + schlecht.slice(0, 6).join(' · '));
    await s2.evaluate(() => Aussehen.setzen({ schema: 'standard' }));
    await c2.close();
  }
}

/* ==========================================================================
 * §16 · Die Linse ruht NEBEN dem Wort (Redur, 11. Oktober 2026)
 * ----------------------------------------------------------------------------
 * Die Liste der Fragen an Redur vom 5. Oktober: „neben dem Wort ruhen?" —
 * Redur am 11. Oktober: „Ja". Im Gesamtbild stand „Weiterdenl(en": die
 * ruhende Linse lag über „ken" (P2 = Ende der zweiten Zeile − 0,8 Schrift-
 * grössen) und zeigte es vergrössert ein zweites Mal (E740).
 *
 * GEMESSEN WIRD JEDER BUCHSTABE, nicht die Zeile: `Range.getClientRects()`
 * Zeichen für Zeichen in beiden `.ru-held-zeile`, jedes Kästchen gegen den
 * KREIS der Linse (der nächste Punkt des Kästchens liegt näher als der
 * Halbmesser). Ein Kasten-gegen-Kasten-Vergleich hätte die Ecken der Linse
 * mitgezählt, die es nicht gibt.
 *
 * Dazu, damit „keine Linse" nicht als „neben dem Wort" durchgeht (§55.2):
 * sie IST da, rechts von „Weiterdenken.", höchstens eine halbe Schriftgrösse
 * daneben, ihre Mitte auf der Höhe der Zeile, in der Spalte der Überschrift
 * (nicht abgeschnitten, nicht über dem Papier), und es fährt nichts mehr.
 * Und sie deckt auch darunter nichts: weder die Augenbraue noch den Absatz
 * (bleibt). Bei 320 px ist neben dem Wort kein Platz für eine Linse — dann
 * lieber keine als eine über der Schrift.
 * ========================================================================*/
{
  console.log('\n§16 · Die Linse ruht NEBEN dem Wort (Redur, 11. Oktober 2026)');
  /* Die Lage der ruhenden Linse gegen jeden Buchstaben des Satzblocks. */
  const RUHE = () => {
    const held = document.querySelector('.lw-desk');
    const copy = held?.querySelector<HTMLElement>('.lw-desk-copy');
    const h2 = held?.querySelector<HTMLElement>('h2');
    const l = held?.querySelector<HTMLElement>('.ru-held-linse');
    const zeilen = [...(h2?.querySelectorAll<HTMLElement>('.ru-held-zeile') || [])];
    type Glyphe = { z: number; ch: string; r: DOMRect };
    const glyphen = (wurzel: Element, z: number): Glyphe[] => {
      const aus: Glyphe[] = [];
      const gang = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
      for (let n = gang.nextNode() as Text | null; n; n = gang.nextNode() as Text | null) {
        if (n.parentElement?.closest('.ru-held-linse')) continue;   /* die Abschrift IN der Linse */
        for (let i = 0; i < n.data.length; i++) {
          if (!n.data[i]!.trim()) continue;
          const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
          for (const r of rg.getClientRects()) if (r.width && r.height) aus.push({ z, ch: n.data[i]!, r });
        }
      }
      return aus;
    };
    const kopf = zeilen.flatMap((z, zi) => glyphen(z, zi));
    const rest = copy ? [...copy.children].filter(e => e !== h2 && !e.classList.contains('ru-held-linse'))
      .flatMap(e => glyphen(e, -1)) : [];
    const sichtbar = !!l && getComputedStyle(l).display !== 'none';
    const q = sichtbar ? l!.getBoundingClientRect() : null;
    const fs = h2 ? parseFloat(getComputedStyle(h2).fontSize) : 0;
    const z2 = zeilen[zeilen.length - 1]?.getBoundingClientRect();
    const ende2 = Math.max(...kopf.filter(g => g.z === zeilen.length - 1).map(g => g.r.right));
    const laeuft = document.getAnimations().filter(a => {
      const t = (a.effect as KeyframeEffect | null)?.target as Element | null;
      return !!t && !!held && held.contains(t) && a.playState === 'running';
    }).length;
    if (!q || !q.width || !h2 || !z2)
      return { linse: false, laeuft, fs, buchstaben: kopf.length, trifft: [] as string[], darunter: [] as string[],
               daneben: NaN, aufHoehe: false, inSpalte: false, d: 0 };
    const cx = q.left + q.width / 2, cy = q.top + q.height / 2, r = q.width / 2;
    const unter = (g: Glyphe) => {
      const nx = Math.max(g.r.left, Math.min(cx, g.r.right)), ny = Math.max(g.r.top, Math.min(cy, g.r.bottom));
      return (nx - cx) ** 2 + (ny - cy) ** 2 < (r - 0.5) ** 2;
    };
    const hr = h2.getBoundingClientRect();
    return {
      linse: true, laeuft, fs, buchstaben: kopf.length,
      trifft: kopf.filter(unter).map(g => g.ch),
      darunter: rest.filter(unter).map(g => g.ch),
      daneben: Math.round((q.left - ende2) * 10) / 10,
      aufHoehe: cy >= z2.top && cy <= z2.bottom,
      inSpalte: q.left >= hr.left - 0.5 && q.right <= hr.left + h2.clientWidth + 0.5,
      d: Math.round(q.width)
    };
  };
  const faelle = [
    ['Rechner 1440 dunkel', false, 'dark', false], ['Rechner 1440 hell', false, 'light', false],
    ['Telefon 390 dunkel', true, 'dark', false], ['Telefon 390 hell', true, 'light', false],
    ['Rechner, weniger Bewegung', false, 'dark', true], ['Telefon, weniger Bewegung', true, 'dark', true]
  ] as const;
  for (const [name, handy, thema, weniger] of faelle) {
    const { ctx, s } = await oeffnen(handy, weniger);
    await s.evaluate((t: string) => App.theme(t), thema);
    await s.evaluate(() => Produktwelten.lernen('heute'));
    await s.waitForSelector('.lw-desk h2', { timeout: 8000 });
    await warte(s, weniger ? 500 : 2600);
    const r = await s.evaluate(RUHE);
    p(`${name}: die ruhende Linse deckt keinen Buchstaben von „Aufmachen. / Weiterdenken." (${r.buchstaben} gemessen)`,
      r.buchstaben >= 22 && r.trifft.length === 0, `unter der Linse: ${JSON.stringify(r.trifft)}`);
    p(`${name}: sie ruht rechts neben „Weiterdenken.", höchstens eine halbe Schriftgrösse daneben, auf der Höhe der Zeile`,
      r.linse && r.daneben >= 0 && r.daneben <= r.fs / 2 && r.aufHoehe, JSON.stringify(r));
    p(`${name}: in der Spalte der Überschrift, still, und darunter deckt sie nichts (bleibt)`,
      r.linse && r.inSpalte && r.laeuft === 0 && r.darunter.length === 0, JSON.stringify(r));
    await ctx.close();
  }
  {
    /* Zu schmal für eine Linse daneben: dann lieber keine als eine über der Schrift. */
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const s = await ctx.newPage();
    s.on('pageerror', e => fehler.push(e.message));
    await s.goto(`http://127.0.0.1:${PORT}/index.html`);
    await s.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' &&
      (document.getElementById('tree')?.children.length || 0) > 0, null, { timeout: 30000 });
    await s.evaluate(() => {
      Store.setMeta('rundgangGesehen', true);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el => el.remove());
      Produktwelten.lernen('heute');
    });
    await s.waitForSelector('.lw-desk h2', { timeout: 8000 });
    await warte(s, 2600);
    const r = await s.evaluate(RUHE);
    p(`Telefon 320: kein Buchstabe unter einer Linse (daneben ist kein Platz — ${r.linse ? 'Linse ' + r.d + ' px' : 'keine Linse'})`,
      r.buchstaben >= 22 && r.trifft.length === 0 && r.darunter.length === 0, JSON.stringify(r));
    await ctx.close();
  }
}

console.log('\n§11 · Kein Seitenfehler');
p('Kein Seitenfehler während des Laufs', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n  Suite 589 — Tropfen, Linse und Kacheln: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
