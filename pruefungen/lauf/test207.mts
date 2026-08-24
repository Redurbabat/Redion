/* Suite 173 — Papiervorlagen auf dem Blatt (E134, Auftrag §21)
 * ============================================================================
 * Blanko, liniert, kariert, Punktraster, Millimeterpapier.
 *
 * Der Auftrag sagt dazu einen Satz, der die ganze Bauweise festlegt: „Nur
 * Darstellung/Metadaten, kein paralleles Dokumentformat." Also ein Feld am
 * Block und ein Hintergrundbild — kein zweiter Speicher, kein zweiter
 * Blocktyp, keine Kopie des Blattes je Vorlage.
 *
 * ─── WORAN DIESE SUITE WIRKLICH HÄNGT ───────────────────────────────────────
 * An §4 und §5. Alles andere ist Zubehör.
 *
 * Das Blatt folgt der Fensterbreite über `aspect-ratio`. Wer die Lineatur in
 * Bildschirmpunkten rechnet, bekommt am Telefon andere Kästchen als am
 * Rechner — und dann ist es kein Karopapier mehr, sondern ein Muster. Wer
 * für beide Achsen dieselbe Prozentzahl nimmt, bekommt Rechtecke statt
 * Quadrate: 2,38 % der Breite und 2,38 % der Höhe sind auf A4 nicht dasselbe.
 *
 * §4 misst deshalb in Pixeln nach, ob ein Karo quadratisch ist. §5 misst
 * dasselbe auf einem zweiseitigen Blatt — dort ist die Prozentzahl halb so
 * gross und der Abstand auf dem Papier derselbe. Beide können rot werden,
 * und zwar genau an dem Fehler, den man hier am leichtesten macht.
 *
 *   node pruefungen/lauf/test207.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8964;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
/** Zwei Längen gelten als gleich, wenn sie sich um weniger als 1 px unterscheiden. */
const fastGleich = (n: string, a: number, b: number, toleranz = 1): void =>
  p(n, Math.abs(a - b) < toleranz, `${a.toFixed(2)} gegen ${b.toFixed(2)} px`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1100, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2600);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

const blattId = await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Papierprobe' });
  const b = Store.addBlock(s.id, 'blatt', { text: '' });
  App.oeffne(s.id);
  return b.id;
});
await seite.waitForTimeout(1100);

/* ==========================================================================
 * §1 · Fünf Vorlagen, und man sieht, welche
 * ========================================================================*/
console.log('\n1 · Fünf Vorlagen, und man sieht, welche');

const waehler = await seite.evaluate(() => {
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.blatt-papierwahl')];
  return {
    anzahl: knoepfe.length,
    arten: knoepfe.map(k => k.dataset.papier ?? ''),
    beschriftet: knoepfe.every(k => (k.getAttribute('aria-label') || '').length > 6),
    gedrueckt: knoepfe.filter(k => k.getAttribute('aria-pressed') === 'true').length,
    /* Jeder Knopf zeigt SEIN Muster, kein Sinnbild dafür. */
    vorschauen: knoepfe.map(k => k.querySelector('i')?.getAttribute('data-vorschau') ?? ''),
  };
});
gleich('Es gibt fünf', waehler.anzahl, 5);
gleich('… und zwar diese', waehler.arten, ['blanko', 'liniert', 'kariert', 'punkte', 'mm']);
p('Jeder trägt eine Beschriftung für die Sprachausgabe (§38)', waehler.beschriftet);
gleich('Genau einer ist gedrückt', waehler.gedrueckt, 1);
gleich('Und jeder zeigt sein eigenes Muster', waehler.vorschauen,
       ['blanko', 'liniert', 'kariert', 'punkte', 'mm']);

/* ==========================================================================
 * §2 · Ein Klick stellt um — am Block UND am Papier
 * ========================================================================*/
console.log('\n2 · Ein Klick stellt um — am Block und am Papier');

const umstellen = async (art: string) => seite.evaluate(async (a: { art: string; id: string }) => {
  (document.querySelector(`.blatt-papierwahl[data-papier="${a.art}"]`) as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 250));
  const pap = document.querySelector('.blatt-papier') as HTMLElement;
  return {
    amPapier: pap?.dataset.papier ?? '',
    amBlock: Store.getBlock(a.id)?.papier ?? '',
    hintergrund: getComputedStyle(pap).backgroundImage !== 'none',
    gedrueckt: document.querySelector('.blatt-papierwahl[aria-pressed="true"]')
      ?.getAttribute('data-papier') ?? '',
  };
}, { art, id: blattId });

for (const art of ['liniert', 'kariert', 'punkte', 'mm']) {
  const r = await umstellen(art);
  gleich(`„${art}" steht am Papier`, r.amPapier, art);
  gleich(`… und am Block gespeichert`, r.amBlock, art);
  p(`… und zeichnet wirklich etwas`, r.hintergrund);
  gleich(`… und der Knopf ist gedrückt`, r.gedrueckt, art);
}
const zurueck = await umstellen('blanko');
gleich('Blanko lässt das Papier leer', zurueck.hintergrund, false);

/* ==========================================================================
 * §3 · Die Wahl überlebt das Neuladen
 * ========================================================================*/
console.log('\n3 · Die Wahl überlebt das Neuladen');

await umstellen('kariert');
await seite.evaluate(() => Store.flush());
await seite.reload();
await seite.waitForTimeout(2800);
const nachNeu = await seite.evaluate((id: string) => ({
  amBlock: Store.getBlock(id)?.papier ?? '',
  amPapier: (document.querySelector('.blatt-papier') as HTMLElement | null)?.dataset.papier ?? '(kein Blatt)',
}), blattId);
gleich('Der Block hält die Wahl', nachNeu.amBlock, 'kariert');
gleich('Und das Papier zeichnet sie wieder', nachNeu.amPapier, 'kariert');

/* ==========================================================================
 * §4 · Ein Karo ist quadratisch — in Pixeln nachgemessen
 * --------------------------------------------------------------------------
 * Der eigentliche Prüfpunkt. A4 ist 595,28 × 841,89 — wer für beide Achsen
 * dieselbe Prozentzahl nimmt, bekommt Rechtecke im Verhältnis 1 : 1,41.
 * ========================================================================*/
console.log('\n4 · Ein Karo ist quadratisch — in Pixeln nachgemessen');

const karo = await seite.evaluate(() => {
  const pap = document.querySelector('.blatt-papier') as HTMLElement;
  const r = pap.getBoundingClientRect();
  const teile = getComputedStyle(pap).backgroundSize.split(',').map(x => x.trim());
  /* Zwei Verläufe: senkrechte Linien alle X der Breite, waagerechte alle Y der Höhe. */
  const quer = parseFloat(teile[0]?.split(/\s+/)[0] ?? '0') / 100 * r.width;
  const hoch = parseFloat(teile[1]?.split(/\s+/)[1] ?? '0') / 100 * r.height;
  return { quer, hoch, breite: r.width, hoehe: r.height };
});
fastGleich('Kästchen quer und hoch sind gleich gross', karo.quer, karo.hoch);
/* 5 mm auf 210 mm Blattbreite. */
fastGleich('Und zwar 5 mm', karo.quer, karo.breite * 5 / 210, 0.6);

/* ==========================================================================
 * §5 · Zwei Seiten, derselbe Abstand
 * --------------------------------------------------------------------------
 * Die Probe darauf, dass in BLATTMASSEN gerechnet wird und nicht im
 * Element. Ein zweiseitiges Blatt ist doppelt so hoch; die Prozentzahl muss
 * sich halbieren, damit der Abstand auf dem Papier derselbe bleibt.
 * ========================================================================*/
console.log('\n5 · Zwei Seiten, derselbe Abstand');

const zwei = await seite.evaluate(async () => {
  (document.querySelector('[data-a="seite"]') as HTMLElement)?.click();
  await new Promise(r => setTimeout(r, 700));
  const pap = document.querySelector('.blatt-papier') as HTMLElement;
  const r = pap.getBoundingClientRect();
  const teile = getComputedStyle(pap).backgroundSize.split(',').map(x => x.trim());
  return {
    quer: parseFloat(teile[0]?.split(/\s+/)[0] ?? '0') / 100 * r.width,
    hoch: parseFloat(teile[1]?.split(/\s+/)[1] ?? '0') / 100 * r.height,
    hoehe: r.height, breite: r.width,
    seiten: Math.round((Store.getBlock(
      (document.querySelector('.blk[data-id]') as HTMLElement)?.dataset.id ?? '')?.blattHoehe ?? 0)),
  };
});
p('Das Blatt ist jetzt höher als breit mal Wurzel zwei', zwei.hoehe > zwei.breite * 1.5,
  `${Math.round(zwei.breite)} × ${Math.round(zwei.hoehe)}`);
fastGleich('Das Karo ist immer noch quadratisch', zwei.quer, zwei.hoch);
fastGleich('Und immer noch 5 mm', zwei.quer, zwei.breite * 5 / 210, 0.6);

/* ==========================================================================
 * §6 · Umstellen verliert nichts
 * --------------------------------------------------------------------------
 * Eine Vorlage ist Darstellung. Wer sie wechselt, darf weder seinen Text
 * noch seine Striche verlieren — sonst wäre sie ein Dokumentformat.
 * ========================================================================*/
console.log('\n6 · Umstellen verliert nichts');

const erhalten = await seite.evaluate(async (id: string) => {
  const kind = Store.childrenOf(id)[0];
  if (kind) Store.updateBlock(kind.id, { text: 'Satz des Pythagoras' });
  Store.updateBlock(id, { marken: [{ art: 'stift', punkte: [[10, 10], [20, 20]], farbe: '#111' }] });
  await Store.flush();
  const vorher = {
    text: Store.childrenOf(id)[0]?.text ?? '',
    marken: (Store.getBlock(id)?.marken ?? []).length,
    kinder: Store.childrenOf(id).length,
  };
  for (const art of ['liniert', 'punkte', 'mm', 'blanko', 'kariert']) {
    (document.querySelector(`.blatt-papierwahl[data-papier="${art}"]`) as HTMLElement)?.click();
    await new Promise(r => setTimeout(r, 120));
  }
  return {
    vorher,
    nachher: {
      text: Store.childrenOf(id)[0]?.text ?? '',
      marken: (Store.getBlock(id)?.marken ?? []).length,
      kinder: Store.childrenOf(id).length,
    },
  };
}, blattId);
gleich('Der Text steht noch da', erhalten.nachher.text, erhalten.vorher.text);
gleich('Die Striche auch', erhalten.nachher.marken, erhalten.vorher.marken);
gleich('Und es sind nicht mehr Kinder geworden', erhalten.nachher.kinder, erhalten.vorher.kinder);

/* ==========================================================================
 * §7 · Was nicht gelesen werden kann, ist blanko
 * ========================================================================*/
console.log('\n7 · Was nicht gelesen werden kann, ist blanko');

const unbekannt = await seite.evaluate(() => {
  const B = (globalThis as any).Blatt;
  return {
    quatsch: B.papierVon({ papier: 'schraffiert' }),
    fehlt: B.papierVon({}),
    nichts: B.papierVon(null),
    gut: B.papierVon({ papier: 'mm' }),
  };
});
gleich('Ein unbekannter Wert wird blanko', unbekannt.quatsch, 'blanko');
gleich('Ein fehlendes Feld auch', unbekannt.fehlt, 'blanko');
gleich('Und gar kein Block auch', unbekannt.nichts, 'blanko');
gleich('Ein guter Wert bleibt aber stehen', unbekannt.gut, 'mm');

gleich('Kein Skriptfehler', fehler.join(' | '), '');

console.log(`\n  Suite 173 — Papiervorlagen auf dem Blatt: ${ok} ok, ${weg} offen`);
await browser.close();
server.close();
process.exitCode = weg ? 1 : 0;
