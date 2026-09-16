/* Suite 351 — Die Blattleiste am Rechner: zwei Zeilen, nur das Zubehör des Werkzeugs (E359)
 * ============================================================================
 * L115 Punkt 9: bei 1360 px Fenster ist die Seite 706 px breit, und die
 * Leiste über dem Blatt stand mit 22 Knöpfen in FÜNF Zeilen, 220 px über
 * dem Papier. Jetzt: oben die Werkzeuge in einer Zeile, darunter das
 * Zubehör des gewählten Werkzeugs (die Regel aus E356, nun überall) — und
 * Wörter nur, wenn die LEISTE breit genug ist, nicht das Fenster.
 *
 *   1 · ZWEI ZEILEN: alle Werkzeuge auf einer Höhe, das Zubehör darunter,
 *       die ganze Leiste unter 100 px.
 *   2 · NUR DAS ZUBEHÖR DES WERKZEUGS — auch am Rechner.
 *   3 · WÖRTER NACH BREITE DER LEISTE: in der Spalte (706 px) keine, bei
 *       voller Breite (1240 px) ja — und immer noch zwei Zeilen.
 *   4 · DIE PAPIERWAHL IST EINE KLAPPE: ein Knopf zeigt das Papier, die fünf
 *       Vorlagen liegen darunter; Escape und ein Tipp daneben schliessen.
 *   5 · IN DER SPALTE EINES ZWEISPALTERS rollt eine Zeile; der Zeilenbruch
 *       ist dort keine Lücke.
 *   6 · AM TELEFON bleibt es die eine rollende Zeile aus E356.
 *   7 · Keine Seitenfehler.
 *
 *   node pruefungen/lauf/test351.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9355;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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

const browser = await chromium.launch();
const fehler: string[] = [];
type Seite = import('playwright').Page;

const kontext = async (handy: boolean, spalten = false) => {
  const ktx = await browser.newContext({
    viewport: handy ? { width: 390, height: 844 } : { width: 1360, height: 950 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2800);
  const seiteId = await pg.evaluate(async (spalten: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Leistenprobe', icon: '🧰' });
    if (spalten) {
      const zwei = Store.addBlock(s.id, 'columns', { text: '' });
      const links = Store.addBlock(zwei.id, 'spalte', { text: '' });
      const b = Store.addBlock(links.id, 'blatt', { text: '', papier: 'blanko' });
      Store.addBlock(b.id, 'text', { text: '' });
      const rechts = Store.addBlock(zwei.id, 'spalte', { text: '' });
      Store.addBlock(rechts.id, 'text', { text: 'Daneben' });
    } else {
      const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
      Store.addBlock(b.id, 'text', { text: '' });
    }
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
    return s.id as string;
  }, spalten);
  return { ktx, pg, seiteId };
};
/* SEIT E375 STEHEN VIER FORMEN UNTER EINEM KNOPF. Wer `line` will, tippt
   erst auf „Form" und dann im Zubehör auf die Linie — genau der Weg, den
   ein Mensch geht. Alles andere bleibt ein Knopf. */
const FORM_ARTEN = ['line', 'arrow', 'rectangle', 'ellipse'];
const werkzeug = async (pg: Seite, wz: string): Promise<void> => {
  if (!FORM_ARTEN.includes(wz)) { await pg.click(`.blatt-werk [data-wz="${wz}"]`); return; }
  await pg.click('.blatt-werk [data-wz="formen"]');
  await pg.click(`.blatt-werk [data-act="formart"][data-form="${wz}"]`);
};
/** Masse der Leiste: Zeilen der Werkzeuge, Lage des Zubehörs, Höhe, Wörter. */
const leiste = (pg: Seite) => pg.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const sichtbar = (e: Element) => (e as HTMLElement).getClientRects().length > 0;
  /* WÖRTER ANDERS MESSEN ALS ALLES ANDERE. Das Zubehör verschwindet mit
     `display:none` — dort sagt `getClientRects()` die Wahrheit. Die Wörter
     nicht: Audit F04 hat ihr `display:none` durch die Klemme ersetzt
     (`position:absolute; width:1px; clip-path:inset(50%)`), damit der Knopf
     im Zugänglichkeitsbaum seinen Namen behält statt „✎" zu heissen.
     Ein geklemmtes Wort HAT ein Rechteck — eins von 1×1 px. `getClientRects`
     zählte deshalb in JEDER Breite elf, und dieser Punkt konnte nicht mehr
     rot werden, ohne dass jemand es merkte (§55.2).
     Gemessen wird jetzt die Breite: geklemmt 1 px, gesetzt 22 bis 74 px. */
  const wortSichtbar = (e: Element) => e.getBoundingClientRect().width > 4;
  const werkzeuge = [...w.querySelectorAll<HTMLElement>('[data-wz]')];
  const tops = new Set(werkzeuge.map(k => Math.round(k.getBoundingClientRect().top)));
  const zubehoer = [...w.querySelectorAll<HTMLElement>('[data-gruppe]')].filter(sichtbar);
  const werkzeugUnten = Math.max(...werkzeuge.map(k => k.getBoundingClientRect().bottom));
  /* DIE BEDIENTEILE EINER GRUPPE — OHNE IHREN TRENNER (E568). Seit die
     Gruppen am Rechner einen Strich voreinander haben, trägt auch er
     `data-gruppe`; er kommt und geht mit ihnen, genau dafür ist er so
     gebaut. Gezählt wird hier aber, was man ANFASSEN kann. Der Strich
     wird eine Zeile tiefer eigens gezählt. */
  const gruppen = (name: string) => [...w.querySelectorAll<HTMLElement>(`[data-gruppe="${name}"]:not(.blatt-trenn)`)].filter(sichtbar).length;
  const trenner = (name: string) => [...w.querySelectorAll<HTMLElement>(`.blatt-trenn[data-gruppe="${name}"]`)].filter(sichtbar).length;
  const bruch = w.querySelector<HTMLElement>('.blatt-zeilenbruch');
  return {
    werkzeugZeilen: tops.size,
    werkzeuge: werkzeuge.length,
    zubehoerUnterhalb: zubehoer.every(k => k.getBoundingClientRect().top >= werkzeugUnten - 1),
    zubehoerSichtbar: zubehoer.length,
    hoehe: Math.round(w.getBoundingClientRect().height),
    breite: Math.round(w.getBoundingClientRect().width),
    woerter: [...w.querySelectorAll<HTMLElement>('[data-wz] .wort')].filter(wortSichtbar).length,
    gruppen: { stil: gruppen('stil'), formen: gruppen('formen'), farbe: gruppen('farbe'), breite: gruppen('breite'),
      radierer: gruppen('radierer'), auswahl: gruppen('auswahl'), lineal: gruppen('lineal'), verlauf: gruppen('verlauf') },
    trenner: { stil: trenner('stil'), formen: trenner('formen'), farbe: trenner('farbe'), breite: trenner('breite'),
      auswahl: trenner('auswahl'), lineal: trenner('lineal'), verlauf: trenner('verlauf'), schrift: trenner('schrift') },
    bruch: bruch ? { da: true, sichtbar: getComputedStyle(bruch).display !== 'none', breite: Math.round(bruch.getBoundingClientRect().width) } : { da: false },
    rollt: w.scrollWidth > w.clientWidth + 2
  };
});

/* ======================================================================== */
console.log('\n1 · Zwei Zeilen am Rechner: Werkzeuge oben, Zubehör darunter, unter 100 px');
const { ktx, pg, seiteId } = await kontext(false);
await werkzeug(pg, 'stift');
let z = await leiste(pg);
/* ELF, NICHT MEHR VIERZEHN (E375): Linie, Pfeil, Rechteck und Ellipse
   stehen jetzt unter einem Knopf „Form". Die Zusage dieses Punktes ist
   dieselbe geblieben — alle auf EINER Höhe —, nur ist die Zeile kürzer.
   SEIT E494 SIND ES ZWÖLF: die Elemente-Bibliothek kam dazu. Vor dem
   Einbau nachgemessen, ob die Zeile sie trägt: bei 1360 px Fenster belegen
   die Werkzeuge 437 px von 596, mit Wörtern bei 1600 px 919 von 1184 —
   eine Zeile bleibt eine, und die Leiste rollt am Rechner nicht. */
/* DREIZEHN SEIT E512: der Laserpointer ist dazugekommen (Redurs Wunsch —
   es gab ihn nur im Vollbild, und dort findet ihn niemand). Er steht am
   Ende der Reihe, weil er als einziger nichts hinterlässt. */
gleich('Alle dreizehn Werkzeuge auf EINER Höhe', z.werkzeugZeilen, 1);
gleich('Und es sind wirklich dreizehn', z.werkzeuge, 13);
p('Das Zubehör steht unter den Werkzeugen', z.zubehoerUnterhalb && z.zubehoerSichtbar > 0, JSON.stringify(z));
/* DREI ZEILEN STATT ZWEI, und das ist Arithmetik. E359 mass zwei Zeilen
   für vierzehn Zubehörknöpfe (E486 hat sie gezählt). Redur hat seither
   zwei Reihen bestellt: zehn Adern (E509) und sechs Stifte (E512).
   Sechs Stifte sind auch ohne Namen rund 160 px; bei 596 px Leistenbreite
   ist die dritte Zeile keine Nachlässigkeit. Der Ausweg ist die Leiste an
   der SEITE (E512): dort stehen die Gruppen untereinander und es ist
   gleichgültig, wie viele es sind. Steht als L137 in LUECKEN. */
p('Die Leiste bleibt bei höchstens drei Zeilen (vorher fünf, rund 220)', z.hoehe < 140, `${z.hoehe} px bei ${z.breite} px Breite`);
p('Der Zeilenbruch ist da und wirkt (volle Breite, keine Höhe)', z.bruch.da && z.bruch.sichtbar && (z.bruch as any).breite > z.breite * 0.8, JSON.stringify(z.bruch));

/* ======================================================================== */
console.log('\n2 · Nur das Zubehör des Werkzeugs — auch am Rechner');
/* DREI IN DER GRUPPE „BREITE" — auch seit E465: der Regler der freien
   Stärke ist eine Klappe (`display:none`, bis die gewählte Stufe ein
   zweites Mal getippt wird) und zählt zu, wie der Trenner ohne Rechteck. */
/* ══ EIN LINEAL SEIT E574, VORHER KEINES ══════════════════════════════════
   Die letzte Null dieser Zeile hiess „kein Lineal" und war richtig, solange
   `lineal` in der Gruppenliste (E356) nur bei `marker`, `line` und `arrow`
   stand. Abgelesen in `marken.ts` lässt die Kantenführung aber auch `stift`
   zu: der Zeichner konnte am Lineal entlangfahren, der Stift hatte nur
   keinen Schalter dafür. Jetzt hat er einen — einen, nicht mehr. */
gleich('Stift: Stil, Formen, Farben, Breiten, Verlauf und EIN Lineal — kein Radiermodus, keine Auswahlknöpfe',
  /* DREI IM VERLAUF SEIT E512: Zurück, Vor — und der Platz der Leiste.
     VIER SEIT E570: dazu «Einrichten», das Feld für die eigene
     Reihenfolge. Alle vier stehen hier, weil sie zu JEDEM Werkzeug
     gehören und zu keinem — sie ändern nicht, was der Finger tut,
     sondern die Leiste selbst. */
  [z.gruppen.stil > 0, z.gruppen.formen > 0, z.gruppen.farbe >= 6, z.gruppen.breite === 3, z.gruppen.verlauf === 4, z.gruppen.radierer, z.gruppen.auswahl, z.gruppen.lineal],
  [true, true, true, true, true, 0, 0, 1]);
await werkzeug(pg, 'radierer');
z = await leiste(pg);
gleich('Radierer: sein Modus und der Verlauf, sonst nichts', [z.gruppen.radierer, z.gruppen.verlauf, z.gruppen.farbe, z.gruppen.stil, z.gruppen.breite], [1, 4, 0, 0, 0]);
await werkzeug(pg, 'select');
z = await leiste(pg);
/* NEUN IN DER GRUPPE „AUSWAHL": Löschen, Kopieren, Einsetzen; dazu seit
   E466 Ausschneiden, nach vorn, nach hinten, Sperren; seit E468 der
   Verweis — und seit E494 „Als Element", der einzige Weg in die
   Elemente-Bibliothek. Nachgemessen: der neunte Knopf ändert die Höhe der
   Leiste nicht (120 px vorher wie nachher, bei 596 px und bei 1184 px). */
gleich('Auswahl: Löschen, Kopieren, Einsetzen, Ausschneiden, Vor, Hinten, Sperren, Verweis, Als Element, Farben, Breiten', [z.gruppen.auswahl, z.gruppen.farbe >= 6, z.gruppen.breite, z.gruppen.stil], [9, true, 3, 0]);
gleich('… und immer noch eine Werkzeugzeile', z.werkzeugZeilen, 1);
await werkzeug(pg, 'line');
z = await leiste(pg);
gleich('Linie: Lineal, Farben, Breiten', [z.gruppen.lineal, z.gruppen.farbe >= 6, z.gruppen.breite], [1, true, 3]);

/* ======================================================================== */
console.log('\n3 · Wörter nach Breite der Leiste, nicht des Fensters');
await werkzeug(pg, 'stift');
z = await leiste(pg);
p('In der Spalte (unter 1150 px) stehen die Werkzeuge ohne Wort', z.woerter === 0 && z.breite < 1150, `${z.woerter} Wörter bei ${z.breite} px`);
await pg.evaluate(async (id: string) => {
  Store.updateBlock(id, { wide: true });
  App.zeichneSeite();
  await new Promise(f => setTimeout(f, 700));
}, seiteId);
await werkzeug(pg, 'stift');
z = await leiste(pg);
/* UMGEHÄNGT MIT W3 (E614), NICHT WEICHGEMACHT.
   Hier stand „noch keine Wörter". Das war richtig, solange das Wort NEBEN
   dem Zeichen stand und Breite kostete — die Schwelle 1150 aus E359 war
   genau diese Breitenrechnung. Seit W3 steht es DARUNTER: dreizehn
   gestapelte Werkzeuge brauchen rund 790 px statt 1142.
   Gemessen an dieser Stelle, 1360 px Fenster, Leiste 940 px:

       vorher   0 Wörter, 2 Werkzeugzeilen
       nachher  13 Wörter, 1 Werkzeugzeile

   Die Zusicherung prüft deshalb jetzt das, was wirklich gilt — und sie ist
   SCHÄRFER als vorher, weil sie beides zugleich verlangt: die Wörter UND
   die eine Zeile. Die alte Schwelle lebt weiter, sie ist nur tiefer
   gerutscht; §3 unten misst sie bei 592 px. */
p('Volle Breite bei 1360 px Fenster (Leiste über 820 px): dreizehn Wörter, EINE Werkzeugzeile',
  z.woerter === 13 && z.breite > 820 && z.breite < 1150 && z.werkzeugZeilen === 1,
  `${z.woerter} Wörter bei ${z.breite} px, ${z.werkzeugZeilen} Zeilen`);
await pg.setViewportSize({ width: 1600, height: 950 });
await pg.waitForTimeout(400);
z = await leiste(pg);
p('Bei 1600 px Fenster (Leiste über 1150 px) stehen die dreizehn Wörter', z.woerter === 13 && z.breite > 1150, `${z.woerter} Wörter bei ${z.breite} px`);
gleich('… in einer Werkzeugzeile, das Zubehör darunter', [z.werkzeugZeilen, z.zubehoerUnterhalb], [1, true]);
p('… und die Leiste bleibt bei höchstens drei Zeilen', z.hoehe < 140, `${z.hoehe} px`);
await ktx.close();

/* ======================================================================== */
console.log('\n4 · Die Papierwahl ist eine Klappe: ein Knopf, fünf Vorlagen darunter');
const { ktx: ktxP, pg: pgP } = await kontext(false);
const klappe = () => pgP.evaluate(() => {
  const knopf = document.querySelector<HTMLElement>('.blatt-fest .blatt-papierknopf');
  const liste = document.querySelector<HTMLElement>('.blatt-fest .blatt-papierliste');
  const fest = document.querySelector<HTMLElement>('.blatt-fest');
  return { knopf: !!knopf, offen: !!liste && !liste.hidden && liste.getClientRects().length > 0,
    aria: knopf?.getAttribute('aria-expanded') ?? null,
    vorschau: knopf?.querySelector('i')?.getAttribute('data-vorschau') ?? null,
    vorlagen: liste ? liste.querySelectorAll('.blatt-papierwahl').length : 0,
    festBreite: Math.round(fest?.getBoundingClientRect().width ?? 0),
    papier: document.querySelector<HTMLElement>('.blatt-papier')?.dataset.papier ?? null };
});
let k = await klappe();
gleich('Ein Knopf, zu, zeigt das Papier, das gilt (blanko); der feste Teil ist schmal', [k.knopf, k.offen, k.aria, k.vorschau, k.festBreite < 130], [true, false, 'false', 'blanko', true]);
await pgP.click('.blatt-fest .blatt-papierknopf');
k = await klappe();
/* Sieben seit E495 (Cornell und Notenlinien). Die Zusage dieses Punktes
   ist die KLAPPE, nicht die Zahl — sie geht auf und trägt den Katalog. */
gleich('Tipp: die Klappe ist auf, sieben Vorlagen darin', [k.offen, k.aria, k.vorlagen], [true, 'true', 7]);
await pgP.click('.blatt-fest .blatt-papierwahl[data-papier="kariert"]');
k = await klappe();
gleich('Eine Vorlage gewählt: Papier umgestellt, Knopf zeigt sie, Klappe zu', [k.papier, k.vorschau, k.offen], ['kariert', 'kariert', false]);
await pgP.click('.blatt-fest .blatt-papierknopf');
await pgP.keyboard.press('Escape');
gleich('Escape schliesst die Klappe (§38)', (await klappe()).offen, false);
await pgP.click('.blatt-fest .blatt-papierknopf');
await pgP.mouse.click(40, 500);
gleich('Ein Tipp daneben schliesst sie auch', (await klappe()).offen, false);
await ktxP.close();

/* ======================================================================== */
console.log('\n5 · In der Spalte eines Zweispalters rollt eine Zeile — der Zeilenbruch ist keine Lücke');
const { ktx: ktxS, pg: pgS } = await kontext(false, true);
await werkzeug(pgS, 'stift');
z = await leiste(pgS);
gleich('Der Zeilenbruch ist in der Spalte ausgeblendet', z.bruch.da && z.bruch.sichtbar, false);
p('Eine Zeile, die rollt (Werkzeuge auf einer Höhe, Inhalt breiter als die Leiste)', z.werkzeugZeilen === 1 && z.rollt, JSON.stringify({ zeilen: z.werkzeugZeilen, rollt: z.rollt, breite: z.breite }));
p('… und auch dort nur das Zubehör des Stifts', z.gruppen.stil > 0 && z.gruppen.radierer === 0 && z.gruppen.auswahl === 0);
await ktxS.close();

/* ======================================================================== */
console.log('\n6 · Am Telefon bleibt die eine rollende Zeile (E356)');
const { ktx: ktxH, pg: pgH } = await kontext(true);
await werkzeug(pgH, 'stift');
z = await leiste(pgH);
gleich('Zeilenbruch ausgeblendet, eine Werkzeugzeile', [z.bruch.da && z.bruch.sichtbar, z.werkzeugZeilen], [false, 1]);
p('Die Leiste ist eine Zeile (unter 60 px)', z.hoehe < 60, `${z.hoehe} px`);
await ktxH.close();

/* ======================================================================== */
console.log('\n7 · Keine Seitenfehler');
gleich('Keine Seitenfehler', fehler, []);

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
