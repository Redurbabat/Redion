/* Suite 172 — Die zwei Produktwelten tragen (E133)
 * ============================================================================
 * Der Auftrag verlangt unter §56 ausdrücklich Prüfungen für die grossen
 * Produktwege. Diese Suite ist das — und sie hat einen konkreten Anlass.
 *
 * Lernwelt, Arbeitswelt, Lebensbereiche, Produktwelten und die Einrichtung
 * der Hauptwelten lagen als rund 40 000 Zeilen im Verzeichnis und waren im
 * Browser NICHT VORHANDEN: ein Typfehler hatte `bauen:ts` abgebrochen, die
 * fünf `quell/*.js` fehlten, `index.html` lud sie trotzdem, und niemandem
 * fiel es auf (E132).
 *
 * Kein Prüflauf konnte es merken, weil keiner die Welten je geöffnet hat.
 * Genau das tut diese Suite jetzt.
 *
 * ─── KANN SIE ROT WERDEN? (§55.2) ───────────────────────────────────────────
 * Ja, und zwar am selben Fehler: verschwindet eine der fünf Dateien wieder,
 * sind `Produktwelten`, `Lernwelt` und `Lebensbereiche` undefined und §1
 * fällt sofort um. Die Regel „ein Objekt, viele Ansichten" (§51 des
 * Auftrags) misst §3 an Zählwerten vorher/nachher — legt eine Ansicht
 * heimlich eine Kopie an, steigt die Zahl.
 *
 *   node pruefungen/lauf/test206.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8959;

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

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine frisch geladene Seite, ohne Rundgang und ohne Einrichtungsschirm. */
const seiteAuf = async (breite: number, hoehe: number): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  s.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForTimeout(2600);
  await s.evaluate(() => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
  });
  return s;
};

const seite = await seiteAuf(1300, 900);

/* ==========================================================================
 * §1 · Die Module sind überhaupt da
 * --------------------------------------------------------------------------
 * Der Punkt, an dem es gefehlt hat. Ein `<script>` auf eine Datei, die es
 * nicht gibt, ist im Browser kein Fehler — die Seite lädt weiter, und das
 * Modul ist einfach nicht da. Deshalb steht das hier ganz vorn.
 * ========================================================================*/
console.log('\n1 · Die Module sind überhaupt da');

const da = await seite.evaluate(() => ({
  produktwelten: typeof (globalThis as any).Produktwelten,
  lernwelt: typeof (globalThis as any).Lernwelt,
  arbeitswelt: typeof (globalThis as any).Arbeitswelt,
  lebensbereiche: typeof (globalThis as any).Lebensbereiche,
  onboarding: typeof (globalThis as any).ProduktOnboarding,
}));
for (const [name, art] of Object.entries(da)) gleich(name + ' ist geladen', art, 'object');

const geladen = await seite.evaluate(() =>
  [...document.querySelectorAll('script[src]')].map(s => (s as HTMLScriptElement).src));
p('index.html lädt die fünf neuen Module',
  ['lebensbereiche', 'lernwelt', 'arbeitswelt', 'produkt_onboarding', 'produktwelten']
    .every(n => geladen.some(s => s.includes(n))));

/* ==========================================================================
 * §2 · Beide Hauptwelten öffnen wirklich
 * ========================================================================*/
console.log('\n2 · Beide Hauptwelten öffnen wirklich');

const welt = async (fn: string, arg: string): Promise<Record<string, unknown>> =>
  seite.evaluate(async (a: { fn: string; arg: string }) => {
    const P = (globalThis as any).Produktwelten;
    (P as any)[a.fn](a.arg);
    await new Promise(r => setTimeout(r, 900));
    /* DIESELBE WURZEL FÜR BEIDES. Der erste Entwurf las `hatInhalt` aus
       `.lernwelt` und den Text aus `#inhalt` — und `#inhalt` ist gar nicht
       der Ort, an dem die Lernwelt zeichnet. Der Punkt war rot, obwohl das
       Datum gut sichtbar auf dem Bildschirm stand. Eine Prüfung, die am
       falschen Element misst, ist schlimmer als keine. */
    const wurzel = (document.querySelector('.lernwelt, .arbeitswelt') ||
                    document.getElementById('inhalt')) as HTMLElement | null;
    const text = (wurzel?.textContent || '').replace(/\s+/g, ' ').trim();
    return { aktiv: P.aktiv?.() ?? null, text: text.slice(0, 200), hatInhalt: text.length > 40 };
  }, { fn, arg });

const heute = await welt('lernen', 'heute');
p('„Lernen & Alltag / Heute" zeigt etwas', heute.hatInhalt, String(heute.text).slice(0, 90));
p('… und begrüsst mit einem Datum',
  /Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag/.test(String(heute.text)),
  String(heute.text).slice(0, 90));

const lernen = await welt('lernen', 'lernen');
p('„Lernen" zeigt etwas', lernen.hatInhalt, String(lernen.text).slice(0, 90));

const arbeit = await welt('workspace', 'start');
p('„Workspace" zeigt etwas', arbeit.hatInhalt, String(arbeit.text).slice(0, 90));

/* ==========================================================================
 * §3 · Ein Objekt, viele Ansichten — und KEINE Kopie (§51 des Auftrags)
 * --------------------------------------------------------------------------
 * Die wichtigste Produktregel. Geprüft wird sie nicht an Worten, sondern an
 * Zählwerten: eine Datei anlegen, danach durch alle Welten laufen und
 * nachsehen, ob Blöcke, Sammlungen oder Dateien mehr geworden sind.
 * ========================================================================*/
console.log('\n3 · Ein Objekt, viele Ansichten — und keine Kopie');

const kopien = await seite.evaluate(async () => {
  const zaehl = async (): Promise<Record<string, number>> => {
    const dateien = await Store.dateiAlle();
    let stuecke = 0;
    for (const d of dateien) stuecke += (await Store.stueckeVon(d.id)).length;
    return {
      bloecke: Object.keys(Store.cache.blocks).length,
      sammlungen: Object.keys(Store.cache.collections).length,
      dateien: dateien.length,
      stuecke,
    };
  };

  const s = Store.addPage(null, { text: 'Kapitel 4 Lampenschaltungen' });
  const fb = Store.addBlock(s.id, 'file', { text: 'lampen.pdf' });
  const satz = await Dateien.ablegen(
    new File([new Uint8Array(400)], 'lampen.pdf', { type: 'application/pdf' }),
    { blockId: fb.id });
  Store.updateBlock(fb.id, { dateiId: satz.id });
  await Store.settled();

  const vorher = await zaehl();

  const P = (globalThis as any).Produktwelten;
  for (const [fn, arg] of [['lernen', 'heute'], ['lernen', 'lernen'], ['workspace', 'start']] as const) {
    (P as any)[fn](arg);
    await new Promise(r => setTimeout(r, 500));
  }
  P.bibliothek(); await new Promise(r => setTimeout(r, 500));
  P.aufgaben();   await new Promise(r => setTimeout(r, 500));

  const nachher = await zaehl();
  return { vorher, nachher, dateiId: satz.id };
});

gleich('Die Zahl der Blöcke ändert sich nicht', kopien.nachher.bloecke, kopien.vorher.bloecke);
gleich('Die Zahl der Sammlungen auch nicht', kopien.nachher.sammlungen, kopien.vorher.sammlungen);
gleich('Und die Datei bleibt genau eine', kopien.nachher.dateien, kopien.vorher.dateien);
gleich('Mit genau ihren Stücken', kopien.nachher.stuecke, kopien.vorher.stuecke);

/* ==========================================================================
 * §4 · Die Datei ist danach noch dieselbe Datei
 * --------------------------------------------------------------------------
 * Zählwerte allein genügen nicht: eine Ansicht könnte eine Datei ersetzen,
 * statt eine dazuzulegen. Also wird die Kennung nachgesehen.
 * ========================================================================*/
console.log('\n4 · Die Datei ist danach noch dieselbe Datei');

const dieselbe = await seite.evaluate(async (id: string) => {
  const satz = await Store.dateiHolen(id);
  const blob = await Dateien.alsBlob(id);
  return { da: !!satz, name: satz?.name ?? '', groesse: blob ? blob.size : -1 };
}, kopien.dateiId as string);

gleich('Sie trägt noch ihre Kennung', dieselbe.da, true);
gleich('… und ihren Namen', dieselbe.name, 'lampen.pdf');
gleich('… und ihre 400 Bytes', dieselbe.groesse, 400);

/* ==========================================================================
 * §5 · Neu laden behält den Bestand
 * ========================================================================*/
console.log('\n5 · Neu laden behält den Bestand');

await seite.reload();
await seite.waitForTimeout(2600);
const nachNeu = await seite.evaluate(async (id: string) => ({
  seite: Store.rootPages().some((x: any) => x.text === 'Kapitel 4 Lampenschaltungen'),
  datei: !!(await Store.dateiHolen(id)),
  module: typeof (globalThis as any).Produktwelten,
}), kopien.dateiId as string);

gleich('Die Seite ist nach dem Neuladen da', nachNeu.seite, true);
gleich('Die Datei auch', nachNeu.datei, true);
gleich('Und die Module sind wieder geladen', nachNeu.module, 'object');

/* ==========================================================================
 * §6 · Am Telefon läuft nichts über den Rand (§30/§34 des Auftrags)
 * ========================================================================*/
console.log('\n6 · Am Telefon läuft nichts über den Rand');

for (const [breite, hoehe, name] of
     [[390, 844, 'iPhone 13 mini'], [428, 926, 'iPhone 13 Pro Max'], [760, 900, 'Tablet']] as
     [number, number, string][]) {
  const klein = await seiteAuf(breite, hoehe);
  const masse = await klein.evaluate(async () => {
    const P = (globalThis as any).Produktwelten;
    const raus: Record<string, number> = {};
    for (const [fn, arg] of [['lernen', 'heute'], ['lernen', 'lernen'], ['workspace', 'start']] as const) {
      (P as any)[fn](arg);
      await new Promise(r => setTimeout(r, 700));
      raus[fn + ':' + arg] = document.documentElement.scrollWidth -
                             document.documentElement.clientWidth;
    }
    return raus;
  });
  for (const [wo, ueber] of Object.entries(masse))
    p(`${name} · ${wo}: kein waagerechter Überlauf`, ueber <= 0, `${ueber} px zu breit`);
  await klein.close();
}

/* ==========================================================================
 * §7 · Der alte Arbeitsweg lebt weiter
 * --------------------------------------------------------------------------
 * Zwei neue Hauptwelten dürfen das nicht kaputt machen, was Redion schon
 * konnte. Also: eine Seite anlegen, einen Block schreiben, nachlesen.
 * ========================================================================*/
console.log('\n7 · Der alte Arbeitsweg lebt weiter');

const alt = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Ganz gewöhnliche Seite' });
  const b = Store.addBlock(s.id, 'text', { text: 'Ein Satz von Hand.' });
  await Store.flush();
  return {
    seiteDa: !!Store.getBlock(s.id),
    text: Store.getBlock(b.id)?.text ?? '',
    kinder: Store.getBlock(s.id)?.content?.length ?? -1,
  };
});
gleich('Eine neue Seite entsteht', alt.seiteDa, true);
gleich('Ihr Block trägt den Text', alt.text, 'Ein Satz von Hand.');
gleich('Und hängt an der Seite', alt.kinder, 1);

gleich('Kein Skriptfehler auf keiner Ansicht', fehler.join(' | '), '');

console.log(`\n  Suite 172 — Die zwei Produktwelten tragen: ${ok} ok, ${weg} offen`);
await browser.close();
server.close();
process.exitCode = weg ? 1 : 0;
