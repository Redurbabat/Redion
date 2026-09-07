/* Suite 458 — Farbsätze: eigene Farben sichern, laden, zurücksetzen (E486)
 * ============================================================================
 * Der letzte Punkt unter „Zeichnen" in L133:
 *
 *   „**Farbsets** speichern und zurücksetzen — heute sieben feste und vier
 *    eigene Tupfer."
 *
 * (Es sind fünf feste, nicht sieben — nachgezählt in `Marken.FARBEN`. Die
 * Zeile in `LUECKEN.md` ist mit diesem Bogen berichtigt.)
 *
 * GoodNotes hält mehrere Paletten und wechselt zwischen ihnen. Redion hatte
 * seit E351 die vier zuletzt gewählten Tupfer — EINE Palette, die sich beim
 * Zeichnen selbst umschreibt. Ein Farbsatz ist die benannte Abschrift dieser
 * vier; die fünf festen Farben gehören keinem Satz an.
 *
 *   §1 DIE PRÜFUNG STEHT EINMAL: klein geschrieben, ohne Dubletten, ohne die
 *      festen, höchstens vier — und zwar auf jedem der vier Wege hinein.
 *   §2 SICHERN, LADEN, LÖSCHEN, ZURÜCKSETZEN — und die Grenze wird gesagt,
 *      nicht verschluckt.
 *   §3 DIE LEISTE: der Knopf ist da, misst 44 px (§37), und der Weg über den
 *      Dialog setzt wirklich die Tupfer.
 *   §4 EIN SATZ REIST IN DER SICHERUNG MIT — er liegt in `meta` (§9, §11).
 *   §5 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → in `farbenRein` das `toLowerCase()` weglassen: `#AABBCC` bleibt
 *        gross und trifft `data-c` nie. Gelaufen, rot.
 *   §2 → `farbsatzSichern` bei voller Liste den ältesten wegwerfen lassen
 *        statt `null` zu geben: die Absage fällt weg. Gelaufen, rot.
 *   §3 → den Knopf `data-act="farbsatz"` aus der Leiste nehmen. Gelaufen, rot.
 *   §3c → die Regel `.finder.wahl` aus `bausteine.css` nehmen: das Fenster
 *        wird über 1000 px hoch in einem 900 px hohen Bildschirm und schneidet ab.
 *        Gelaufen, rot.
 *   §3 (Reihenfolge) → in `tupferZeigen` wieder `reverse()` einsetzen: die
 *        eben gewählte Farbe steht rechts und nach dem Neuzeichnen links.
 *        Gelaufen, rot.
 *
 *   node pruefungen/lauf/test458.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9578;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

/** Eine Seite mit einem Blatt und der echten Zeichenleiste. */
const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Farbblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* ═══ §1 Die Prüfung steht einmal ══════════════════════════════════════════ */
console.log('\n§1 Was als eigene Farbe durchkommt');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const raus = {};
    /* Gross geschrieben, doppelt, eine feste Farbe, Unsinn — und mehr als vier. */
    raus.gemischt = Marken.farbenSetzen(['#AABBCC', '#aabbcc', '#111111', 'blau', '',
                                         '#123456', '#234567', '#345678', '#456789']);
    raus.gelesen = Marken.eigeneFarben();
    raus.keineListe = Marken.farbenSetzen('nichts');
    raus.grenze = Marken.HOECHSTENS_EIGENE_FARBEN;
    return JSON.stringify(raus);
  })()`) as string);
  gleich('Klein geschrieben, ohne Dublette, ohne die feste, höchstens vier',
    r.gemischt, ['#aabbcc', '#123456', '#234567', '#345678']);
  gleich('… und genau das steht danach da', r.gelesen, r.gemischt);
  gleich('Was keine Liste ist, wird keine halbe', r.keineListe, []);
  gleich('Die Grenze ist vier', r.grenze, 4);

  /* DASSELBE ÜBER DEN ANDEREN WEG. `eigeneFarbeMerken` (E351) und das Laden
     eines Satzes gehen jetzt durch dieselbe Prüfung — das ist der Punkt. */
  const zweiWege = JSON.parse(await s.evaluate(`(() => {
    Marken.farbenSetzen([]);
    Marken.farbsatzSichern('Gross', ['#AA0011', '#BB0022']);
    Marken.farbenZuruecksetzen();
    return JSON.stringify({ geladen: Marken.farbsatzLaden('Gross'),
                            gesichert: Marken.farbsaetze()[0] });
  })()`) as string);
  gleich('Ein Satz merkt sich die Farben schon klein geschrieben',
    zweiWege.gesichert?.farben, ['#aa0011', '#bb0022']);
  gleich('… und lädt sie so zurück', zweiWege.geladen, ['#aa0011', '#bb0022']);
  await s.close();
}

/* ═══ §2 Sichern, laden, löschen, zurücksetzen ═════════════════════════════ */
console.log('\n§2 Die vier Griffe');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const raus = {};
    Store.setMeta('zeichnen:farbsaetze', []);
    Marken.farbenSetzen(['#aa0000', '#bb0000']);
    Marken.farbsatzSichern('Korrektur');
    Marken.farbenSetzen(['#0000aa', '#0000bb', '#0000cc']);
    Marken.farbsatzSichern('Notiz');
    raus.namen = Marken.farbsaetze().map(x => x.name);
    /* Laden holt die alten Tupfer zurueck. */
    raus.zurueck = Marken.farbsatzLaden('Korrektur');
    /* Gleicher Name ersetzt, statt zweimal dazustehen. */
    Marken.farbenSetzen(['#010101']);
    Marken.farbsatzSichern('Korrektur');
    raus.nachErsetzen = Marken.farbsaetze().map(x => ({ name: x.name, n: x.farben.length }));
    /* Unbekannter Name: nichts geschieht. */
    raus.unbekannt = Marken.farbsatzLaden('gibtsnicht');
    /* Zuruecksetzen leert die Tupfer — die Saetze bleiben. */
    raus.nachReset = Marken.farbenZuruecksetzen();
    raus.saetzeDanach = Marken.farbsaetze().length;
    /* Loeschen nimmt einen Namen weg. */
    Marken.farbsatzLoeschen('Notiz');
    raus.nachLoeschen = Marken.farbsaetze().map(x => x.name);
    return JSON.stringify(raus);
  })()`) as string);
  gleich('Zwei Sätze mit ihren Namen', r.namen, ['Korrektur', 'Notiz']);
  gleich('Laden holt die Tupfer des Satzes zurück', r.zurueck, ['#aa0000', '#bb0000']);
  gleich('Gleicher Name ersetzt, statt danebenzustehen',
    r.nachErsetzen, [{ name: 'Korrektur', n: 1 }, { name: 'Notiz', n: 3 }]);
  gleich('Ein unbekannter Name tut nichts', r.unbekannt, null);
  gleich('Zurücksetzen leert die Tupfer', r.nachReset, []);
  gleich('… und lässt die Sätze stehen', r.saetzeDanach, 2);
  gleich('Löschen nimmt genau einen Namen', r.nachLoeschen, ['Korrektur']);

  /* DIE GRENZE WIRD GESAGT (§35). Der neunte Satz kommt nicht durch — und
     wirft dabei keinen der acht weg. */
  const voll = JSON.parse(await s.evaluate(`(() => {
    Store.setMeta('zeichnen:farbsaetze', []);
    for (let i = 1; i <= Marken.HOECHSTENS_FARBSAETZE; i++) Marken.farbsatzSichern('S' + i, ['#0000' + (10 + i)]);
    const voll = Marken.farbsaetze().length;
    const neunter = Marken.farbsatzSichern('S99', ['#999999']);
    /* Ein vorhandener Name geht auch bei voller Liste — er nimmt keinen Platz. */
    const ersetzt = Marken.farbsatzSichern('S1', ['#123123']);
    return JSON.stringify({ voll, neunter, nochDa: Marken.farbsaetze().length,
      ersetztGeht: Array.isArray(ersetzt),
      ersteFarben: Marken.farbsaetze()[0].farben,
      ohneNamen: Marken.farbsatzSichern('   ') });
  })()`) as string);
  gleich('Acht Sätze passen', voll.voll, 8);
  gleich('Der neunte bekommt eine Absage, kein stilles Nichts', voll.neunter, null);
  gleich('… und wirft keinen der acht weg', voll.nochDa, 8);
  p('Ein vorhandener Name geht auch bei voller Liste', voll.ersetztGeht, JSON.stringify(voll));
  gleich('… und ersetzt wirklich', voll.ersteFarben, ['#123123']);
  gleich('Ohne Namen kein Satz', voll.ohneNamen, null);
  await s.close();
}

/* ═══ §3 Die Leiste ════════════════════════════════════════════════════════ */
console.log('\n§3 Der Knopf und der Weg dahinter');
{
  const s = await mitBlatt();
  /* ERST DEN STIFT. Die Farbgruppe erscheint nach der Gruppenregel aus E356
     nur, wenn ein Werkzeug gewählt ist, das färbt — beim Start steht die
     Leiste auf „Schreiben", und dann misst JEDER Farbknopf 0 × 0. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(250);
  const k = JSON.parse(await s.evaluate(`(() => {
    const b = document.querySelector('.blatt-werk .blatt-farbe-neu');
    if (!b) return JSON.stringify({ da: false });
    const r = b.getBoundingClientRect();
    return JSON.stringify({ da: true, titel: b.getAttribute('title'),
      name: b.getAttribute('aria-label'),
      gruppe: b.getAttribute('data-gruppe'),
      hoch: Math.round(r.height), breit: Math.round(r.width),
      /* DIE ZEILE DARF NICHT WACHSEN (E359, test351). Vierzehn Knoepfe
         fuellen sie bei 596 px genau aus; ein fuenfzehnter kippt sie in eine
         dritte Zeile. Deshalb fuehrt EIN Knopf zu allem, was Farbe ist. */
      zubehoerZeilen: new Set([...document.querySelectorAll('.blatt-werk [data-gruppe]')]
        .filter(e => e.getBoundingClientRect().width > 0)
        .map(e => Math.round(e.getBoundingClientRect().top))).size,
      leisteHoch: Math.round(document.querySelector('.blatt-werk').getBoundingClientRect().height) });
  })()`) as string);
  p('Der Knopf steht in der Leiste', k.da, JSON.stringify(k));
  /* SO GROSS WIE SEINE NACHBARN — und die Zahl steht nicht hier.
     Nachgemessen: die ganze Zeichenleiste misst am Rechner 36 × 32 und am
     Telefon 44 × 44; §37 gilt dem Finger, und der ist am Telefon. Eine
     feste Zahl an dieser Stelle wäre eine zweite Wahrheit neben dem CSS —
     also wird gegen den Stiftknopf gemessen, und die 44 px am Telefon
     stehen weiter unten. */
  gleich('… so gross wie der Stiftknopf daneben', [k.breit, k.hoch], JSON.parse(await s.evaluate(`(() => {
    const r = document.querySelector('.blatt-werk [data-wz="stift"]').getBoundingClientRect();
    return JSON.stringify([Math.round(r.width), Math.round(r.height)]);
  })()`) as string));
  p('… in der Farbgruppe', k.gruppe === 'farbe', JSON.stringify(k));
  p('… und sein Name nennt beides (§38)',
    /Farbe/.test(String(k.name)) && /Farbsätze/.test(String(k.name)), JSON.stringify(k));
  gleich('Das Zubehör steht in EINER Zeile', k.zubehoerZeilen, 1);
  p('… und die Leiste bleibt unter 100 px (E359)', k.leisteHoch < 100, String(k.leisteHoch) + ' px');

  /* DER DIALOG. Er ist echt — also wird er echt geklickt. */
  await s.evaluate(() => {
    Store.setMeta('zeichnen:farbsaetze', [{ name: 'Korrektur', farben: ['#aa0000', '#bb0000'] }]);
    Store.setMeta('zeichnen:farben', []);
    App.zeichneSeite();
  });
  await s.waitForTimeout(500);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(250);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-farbe-neu')?.click());
  await s.waitForTimeout(300);
  const auf = JSON.parse(await s.evaluate(`(() => {
    const o = document.querySelector('.overlay .finder');
    return JSON.stringify({ da: !!o,
      knoepfe: [...document.querySelectorAll('.overlay [data-w]')].map(b => b.dataset.w) });
  })()`) as string);
  p('Der Dialog geht auf', auf.da, JSON.stringify(auf));
  p('… und der Farbwähler steht zuoberst — er ist der häufigste Weg',
    auf.knoepfe[0] === 'waehlen', JSON.stringify(auf.knoepfe));
  p('… dahinter der gesicherte Satz',
    auf.knoepfe[1] === 'laden:Korrektur', JSON.stringify(auf.knoepfe));
  p('… mit Sichern, Löschen und Zurücksetzen',
    ['sichern', 'entfernen', 'zuruecksetzen'].every(id => auf.knoepfe.includes(id)),
    JSON.stringify(auf.knoepfe));

  /* Laden über den Dialog setzt die Tupfer in der ECHTEN Leiste. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.overlay [data-w="laden:Korrektur"]')?.click());
  await s.waitForTimeout(300);
  const tupfer = JSON.parse(await s.evaluate(`JSON.stringify(
    [...document.querySelectorAll('.blatt-werk .blatt-farbe-eigen')].map(b => b.dataset.c))`) as string);
  gleich('Laden setzt die Tupfer in der Leiste', tupfer, ['#aa0000', '#bb0000']);
  gleich('… und sie stehen VOR dem „+"', await s.evaluate(`(() => {
    const neu = document.querySelector('.blatt-werk .blatt-farbe-neu');
    const letzt = [...document.querySelectorAll('.blatt-werk .blatt-farbe-eigen')].pop();
    return !!neu && !!letzt && (letzt.compareDocumentPosition(neu) & Node.DOCUMENT_POSITION_FOLLOWING) > 0;
  })()`), true);

  /* DIE REIHENFOLGE MUSS DIESELBE SEIN WIE NACH EINEM NEUSTART (E351-Fund).
     Die Leiste zeichnet die Tupfer beim Aufbau aus derselben Liste — wenn
     das Nachtragen anders herum einhängt, springt die eben gewählte Farbe
     beim nächsten Start ans andere Ende. Genau das war jahrelang so. */
  await s.evaluate(() => { App.zeichneSeite(); });
  await s.waitForTimeout(500);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(250);
  gleich('Frisch gezeichnet steht dieselbe Reihenfolge da', JSON.parse(await s.evaluate(`JSON.stringify(
    [...document.querySelectorAll('.blatt-werk .blatt-farbe-eigen')].map(b => b.dataset.c))`) as string), tupfer);
  gleich('… und es ist die Reihenfolge der Liste',
    tupfer, JSON.parse(await s.evaluate(`JSON.stringify(Marken.eigeneFarben())`) as string));

  /* UND ÜBER DEN FARBWÄHLER, den echten Weg aus E351: die neu gewählte
     Farbe steht vorn — vor und nach dem Neuzeichnen. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-farbe-neu')?.click());
  await s.waitForTimeout(300);
  /* DER FARBWÄHLER ÖFFNET SICH ERST NACH DEM VERSPRECHEN DER WAHL.
     Der Ersatz für `click` muss deshalb stehen bleiben, bis er wirklich
     gerufen wurde — ihn im selben `try` wieder wegzunehmen kam zu früh,
     und dann tat der Knopf scheinbar nichts. */
  await s.evaluate(`(() => {
    window.__echterKlick = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      this.value = '#00cc44';
      this.dispatchEvent(new Event('change'));
    };
  })()`);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.overlay [data-w="waehlen"]')?.click());
  await s.waitForTimeout(300);
  const nachWahl = JSON.parse(await s.evaluate(`(() => {
    HTMLInputElement.prototype.click = window.__echterKlick;
    return JSON.stringify([...document.querySelectorAll('.blatt-werk .blatt-farbe-eigen')].map(b => b.dataset.c));
  })()`) as string);
  gleich('Die eben gewählte Farbe steht vorn', nachWahl, ['#00cc44', '#aa0000', '#bb0000']);
  await s.evaluate(() => { App.zeichneSeite(); });
  await s.waitForTimeout(500);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(250);
  gleich('… auch nach dem Neuzeichnen', JSON.parse(await s.evaluate(`JSON.stringify(
    [...document.querySelectorAll('.blatt-werk .blatt-farbe-eigen')].map(b => b.dataset.c))`) as string),
    ['#00cc44', '#aa0000', '#bb0000']);

  /* Zurücksetzen über den Dialog nimmt sie wieder weg. */
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-farbe-neu')?.click());
  await s.waitForTimeout(300);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.overlay [data-w="zuruecksetzen"]')?.click());
  await s.waitForTimeout(300);
  gleich('Zurücksetzen räumt die Tupfer aus der Leiste',
    await s.evaluate(`document.querySelectorAll('.blatt-werk .blatt-farbe-eigen').length`), 0);
  gleich('… und die fünf festen bleiben stehen',
    await s.evaluate(`document.querySelectorAll('.blatt-werk .blatt-farbe:not(.blatt-farbe-eigen)').length`),
    await s.evaluate(`Marken.FARBEN.length`));
  gleich('… der gesicherte Satz auch', await s.evaluate(`Marken.farbsaetze().length`), 1);
  await s.close();
}

/* ═══ §3b Am Telefon 44 px (§37) ═══════════════════════════════════════════ */
console.log('\n§3b Am Telefon fasst ihn ein Finger');
{
  const s = await browser.newPage({ viewport: { width: 390, height: 844 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Farbblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(300);
  const m = JSON.parse(await s.evaluate(`(() => {
    const r = document.querySelector('.blatt-werk .blatt-farbe-neu').getBoundingClientRect();
    return JSON.stringify([Math.round(r.width), Math.round(r.height)]);
  })()`) as string);
  p('44 px am Telefon (§37)', m[0] >= 44 && m[1] >= 44, JSON.stringify(m));
  await s.close();
}

/* ═══ §3c Acht Sätze bleiben erreichbar ═══════════════════════════════════ */
console.log('\n§3c Auch der letzte Knopf ist erreichbar');
for (const [wo, breit, hoch] of [['Rechner', 1280, 900], ['Telefon', 390, 844]] as Array<[string, number, number]>) {
  const s = await browser.newPage({ viewport: { width: breit, height: hoch } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    Store.setMeta('zeichnen:farbsaetze', Array.from({ length: 8 }, (_, i) =>
      ({ name: 'Satz ' + (i + 1), farben: ['#1e88e5', '#43a047', '#fb8c00'] })));
    const seite = Store.addPage(null, { text: 'Voll' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(250);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk .blatt-farbe-neu')?.click());
  await s.waitForTimeout(400);
  /* GEMESSEN, NICHT ANGESEHEN. „Sichtbar" ist die falsche Frage — der
     letzte Knopf DARF unter der Kante stehen, solange man ihn hinrollen
     kann. Vor E486 konnte man das nicht: `.finder` schnitt ab. */
  const m = JSON.parse(await s.evaluate(`(() => {
    const f = document.querySelector('.overlay .finder');
    const k = [...document.querySelectorAll('.overlay [data-w]')];
    const letzt = k[k.length - 1];
    const rf = f.getBoundingClientRect();
    /* scrollTop LÄSST SICH AUCH BEI overflow:hidden SETZEN — und dann sagt
       die Messung „erreichbar", wo eine Hand nichts erreicht. Also zuerst
       fragen, ob das Ding überhaupt rollen DARF.
       (Keine Schrägstriche-Zeichen hier: der ganze Block steht in einem
       Template-Literal, und ein Rückwärts-Anführungszeichen beendet es.) */
    const laeuftUeber = f.scrollHeight > f.clientHeight + 1;
    const darfRollen = ['auto', 'scroll'].includes(getComputedStyle(f).overflowY);
    f.scrollTop = f.scrollHeight;
    const rl = letzt.getBoundingClientRect();
    return JSON.stringify({ knoepfe: k.length, id: letzt.dataset.w,
      laeuftUeber, darfRollen,
      fensterImBild: rf.bottom <= window.innerHeight + 1 && rf.top >= -1,
      erreichbar: (!laeuftUeber || darfRollen)
        && rl.bottom <= window.innerHeight + 1 && rl.top >= 0 });
  })()`) as string);
  gleich(wo + ': zwölf Knöpfe stehen da', m.knoepfe, 12);
  p(wo + ': das Fenster bleibt im Bild', m.fensterImBild, JSON.stringify(m));
  p(wo + ': der letzte Knopf ist hinrollbar', m.erreichbar && m.id === 'zuruecksetzen', JSON.stringify(m));
  await s.close();
}

/* ═══ §4 Ein Satz reist in der Sicherung mit ═══════════════════════════════ */
console.log('\n§4 Der Satz steht in der Sicherung');
{
  const s = await mitBlatt();
  const d = JSON.parse(await s.evaluate(`(() => {
    Marken.farbenSetzen(['#aa0000']);
    Marken.farbsatzSichern('Reisesatz');
    return Store.exportAll();
  })()`) as string);
  /* `meta` steht in der Sicherung als schlichtes Objekt, nicht als Liste —
     nachgesehen in `exportAll`, nicht geraten (E21). */
  const eintrag = d.meta?.['zeichnen:farbsaetze'];
  p('`zeichnen:farbsaetze` liegt im Fach `meta` (§9)', !!eintrag, JSON.stringify(Object.keys(d.meta ?? {}).length));
  p('… mit dem Namen darin', JSON.stringify(eintrag ?? '').includes('Reisesatz'), JSON.stringify(eintrag));
  p('… und die Tupfer selbst auch', JSON.stringify(d.meta?.['zeichnen:farben'] ?? '').includes('#aa0000'),
    JSON.stringify(d.meta?.['zeichnen:farben']));
  await s.close();
}

/* ═══ §5 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§5 Quellen');
{
  const q = lies('src/bereiche/pdf/marken.ts');
  p('Die Prüfung der Tupfer steht einmal (`farbenRein`)',
    /const farbenRein = /.test(q) && (q.match(/toLowerCase\(\);\n\s*if \(!\/\^#\[0-9a-f\]\{6\}\$\//g) || []).length === 1, '');
  p('Die vier Griffe stehen da',
    /const farbsatzSichern = /.test(q) && /const farbsatzLaden = /.test(q)
    && /const farbsatzLoeschen = /.test(q) && /const farbenZuruecksetzen = /.test(q));
  /* EIN BAUER, MEHRERE AUFRUFER. Die Zahl der Aufrufer steht hier nicht —
     die wächst mit jedem Weg. Geprüft wird, dass es GENAU EINEN Bauer gibt
     und dass ihn mehr als eine Stelle benutzt. */
  p('Die Tupfer werden an einer Stelle gebaut (`tupferZeigen`)',
    (q.match(/const tupferZeigen = /g) || []).length === 1
    && (q.match(/tupferZeigen\(/g) || []).length >= 3,
    String((q.match(/tupferZeigen\(/g) || []).length));
  p('Und nicht mehr im Farbwähler selbst',
    !/neuKnopf\?\.before\(k\);[\s\S]{0,400}neuKnopf\?\.before\(k\);/.test(q));
  p('Das erzeugte JS trägt es', /farbsatzSichern/.test(lies('quell/bereiche/pdf/marken.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
