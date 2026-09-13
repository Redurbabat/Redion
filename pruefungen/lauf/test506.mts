/* Suite 506 — Das Folienband: Reiter ÜBER der Folie, wie in PowerPoint
 * ============================================================================
 * Redur: „oben mit menü … 1:1 wie powerpoint".
 *
 * E549 hat den KATALOG gebaut — einen Reiter „Präsentation" im Bandregister
 * und ein Menü in der Dokumentleiste. Was fehlte, war der ORT: eine
 * Reiterzeile mit einem Band darunter, über der Folie, wie sie jedes
 * Textprogramm über dem Blatt hat.
 *
 * WARUM NICHT `#menueband` DORT EINBLENDEN. Weil das gemessen schlechter war
 * (E549): am Rechner ist das globale Band eine zugeklappte LADE, und im
 * Dokumentmodus legte sich seine Ecke „Werkzeuge ⌄" bei 1440 × 852
 * deckungsgleich über die Dokumentleiste. Das Folienband fliesst dagegen IN
 * der Spalte mit — es überdeckt nichts, es nimmt Platz.
 *
 * ─── WELCHE REITER, UND WARUM DIESE ──────────────────────────────────────────
 * Alle 151 Einträge des Bandkatalogs sind bei offenem Foliensatz EINZELN
 * aufgerufen worden, und nachgesehen wurde, ob danach ein Block, ein Menü
 * oder ein Fehler da war:
 *
 *     start        14 Knöpfe · 14 ohne Wirkung
 *     einfuegen    69 Knöpfe · 65 ohne Wirkung
 *     ansicht      10 Knöpfe ·  8 „ohne Wirkung", davon Vollbild und Drucken —
 *                               die Messung SIEHT sie nur nicht
 *     verlauf       9 Knöpfe ·  6 (Rückgängig auf leerem Stapel tut zu Recht
 *                               nichts)
 *     ueberpruefen  6 Knöpfe ·  1
 *     hilfe         6 Knöpfe ·  3
 *
 * Abgestürzt ist keiner; die Seite meldete null Fehler. Draussen bleiben
 * deshalb genau die zwei, bei denen es eindeutig ist: `start` und
 * `einfuegen`. Ihre Knöpfe brauchen eine Schreibmarke in einem Textblock, und
 * im Dokumentmodus gibt es keine. 79 von 83 Knöpfen ohne Wirkung wären kein
 * Menüband, sondern eine Enttäuschungsmaschine.
 *
 * `zeichnen` bleibt aus einem ANDEREN Grund draussen: seine dreissig Knöpfe
 * stehen als Zeichenleiste schon dauerhaft zwei Zeilen tiefer. Dieselbe Sache
 * an zwei sichtbaren Stellen gleichzeitig ist genau das, was §8 verbietet.
 *
 * ─── WAS DAS BILD GEFUNDEN HAT UND KEIN PRÜFLAUF GEFUNDEN HÄTTE ──────────────
 * Auf dem ersten Bild stand die ganze Reihe als NACKTER TEXT da: „Neue Folie
 * Folienliste Präsentieren Als PowerPoint Als PDF Drucken", ohne ein einziges
 * Zeichen. `Menueband.knopf` hängt für einen Symbolnamen nur ein leeres
 * `<span data-sym="plus">` ein — gemalt wird es von
 * `Register.symbole.fuelle(wurzel)`, und das war vergessen.
 *
 * Kein zusammengesetzter Prüflauf hätte das gemeldet: die Knöpfe waren alle
 * da, hiessen richtig, hatten ihren Satz und taten das Richtige. §55.1 in
 * Reinform. §3 misst es jetzt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier wirklich gefahren, die Zahlen sind GEMESSEN:
 *   G1 → `einfuegen` in FOLIENBAND_REITER aufnehmen:      42 grün,  2 rot  (und 52 Knöpfe ragten aus dem Band)
 *   G2 → `Register.symbole.fuelle` nicht rufen:           42 grün,  1 rot  (38 Knöpfe ohne gemaltes Zeichen)
 *   G3 → `istFoliensatz` immer „ja" sagen lassen:         41 grün,  2 rot  (Band im Notizheft, Zeichenleiste 110 px tiefer)
 *   G4 → `BAND_AB` auf 0 setzen (Band auch am Telefon):   41 grün,  2 rot  (Band bei 390 und bei 899 px)
 *   G5 → `folienbandNachziehen` nichts tun lassen:         49 grün,  2 rot  (Band bleibt bei 800 px stehen)
 *   G6 → es nur AUSHÄNGEN lassen, nie wieder ein:          47 grün,  4 rot  (kommt beim Aufziehen nicht zurück)
 *
 * G2 ist die, auf die es ankommt: sie hält den Fund des Bildes fest.
 *
 * G5 hatte zuerst die FALSCHE FORM: den Aufruf aus `beiGroesse` genommen —
 * und dann baute der Zweig gar nicht mehr (`noUnusedLocals`: die Funktion
 * war nun nirgends benutzt). Eine Gegenprobe, die nicht baut, ist keine
 * (CLAUDE.md §52.6, dort steht genau dieser Fall). Also stattdessen den
 * Rumpf verstümmelt.
 *
 *   node pruefungen/lauf/test506.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
declare const Store: any;
declare const App: any;
declare const Register: any;
declare const Folienvorlagen: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9616;
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

/** Ein Fenster aufmachen, das Willkommen wegräumen, Foliensatz und Heft anlegen. */
const aufbauen = async (breite: number, hoehe: number) => {
  const kontext = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  const seite = await kontext.newPage();
  seite.on('pageerror', e => fehler.push(e.message));
  await seite.goto(`http://localhost:${PORT}/index.html`);
  await seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  for (let versuch = 0; versuch < 8; versuch++) {
    await seite.evaluate(() => {
      document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
    });
    await seite.waitForTimeout(250);
    if (!await seite.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
  }
  const ids = await seite.evaluate(() => {
    const deck = Folienvorlagen.neuePraesentation('titelInhalt');
    Folienvorlagen.neueFolie(deck.id, 'zweiInhalte');
    const heft = Store.addPage(null, { text: 'Notizheft', icon: '📓' });
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
  return { kontext, seite, ids, oeffne };
};

/* ══ §1 DAS BAND STEHT ÜBER DER FOLIE ════════════════════════════════════ */
console.log('\n§1 Eine Reiterzeile mit Band, zwischen Kopfleiste und Zeichenleiste');
const gross = await aufbauen(1440, 852);
{
  await gross.oeffne(gross.ids.deck);
  const m = await gross.seite.evaluate(() => {
    const band = document.querySelector<HTMLElement>('.folienband');
    const top = document.querySelector<HTMLElement>('.document-topbar');
    const draw = document.querySelector<HTMLElement>('.document-drawingbar');
    const mitte = document.querySelector<HTMLElement>('.document-center');
    const blatt = document.querySelector<HTMLElement>('.document-center .blatt-papier');
    const r = (e: Element | null) => e ? e.getBoundingClientRect() : null;
    const rb = r(band), rt = r(top), rd = r(draw), rm = r(mitte), rbl = r(blatt);
    return {
      da: !!band,
      hoehe: Math.round(rb?.height ?? 0),
      unterKopf: !!rb && !!rt && rb.top >= rt.bottom - 1,
      ueberZeichen: !!rb && !!rd && rb.bottom <= rd.top + 1,
      ueberFolie: !!rb && !!rm && rb.bottom <= rm.top + 1,
      /* Es DECKT nichts zu — das war der Fehler des ersten Versuchs (E549). */
      deckt: !!rb && !!rt && rb.top < rt.bottom - 1,
      folie: rbl ? { b: Math.round(rbl.width), h: Math.round(rbl.height),
                     verh: Math.round((rbl.width / rbl.height) * 1000) / 1000 } : null,
      mitteHoehe: Math.round(rm?.height ?? 0),
      reiterRolle: document.querySelector('.folienband-reiter')?.getAttribute('role'),
      flaecheRolle: document.querySelector('.folienband-flaeche')?.getAttribute('role')
    };
  });
  p('Das Band ist da', m.da);
  p('Es steht UNTER der Kopfleiste', m.unterKopf);
  p('… und ÜBER der Zeichenleiste', m.ueberZeichen);
  p('… und ÜBER der Folie', m.ueberFolie);
  p('Es überdeckt die Kopfleiste NICHT (der Fund von E549)', !m.deckt);
  p('Es ist zwischen 80 und 150 px hoch', m.hoehe >= 80 && m.hoehe <= 150,
    String(m.hoehe) + ' px');
  p('Die Folie bleibt 16:9', m.folie?.verh === 1.778, JSON.stringify(m.folie));
  p('Und sie hat noch Platz — über 400 px Fläche', m.mitteHoehe > 400,
    String(m.mitteHoehe) + ' px');
  gleich('Die Reiterzeile ist eine Reiterzeile (§38)', m.reiterRolle, 'tablist');
  gleich('Die Fläche darunter ist ihr Feld (§38)', m.flaecheRolle, 'tabpanel');
}

/* ══ §2 DIE REITER — UND DIE ZWEI, DIE DRAUSSEN BLEIBEN ══════════════════ */
console.log('\n§2 Fünf Reiter, und „Start"/„Einfügen" sind nicht dabei');
{
  const m = await gross.seite.evaluate(() => {
    const kn = [...document.querySelectorAll<HTMLElement>('.folienband-reiter [data-fb-reiter]')];
    return {
      ids: kn.map(b => b.dataset['fbReiter'] || ''),
      namen: kn.map(b => (b.textContent || '').trim()),
      /* §38: nicht nur der Strich sagt, welcher gewählt ist. */
      gewaehlt: kn.filter(b => b.getAttribute('aria-selected') === 'true').length,
      ersterGewaehlt: kn[0]?.getAttribute('aria-selected') === 'true',
      rollen: kn.every(b => b.getAttribute('role') === 'tab'),
      /* §37-Nebenweg: mit der Maus 34 px, das ist die Bandregel (aufbau.css). */
      zuFlach: kn.filter(b => b.getBoundingClientRect().height < 30)
                 .map(b => (b.textContent || '').trim())
    };
  });
  p('Mindestens vier Reiter', m.ids.length >= 4, JSON.stringify(m.ids));
  p('„Präsentation" steht vorn', m.ids[0] === 'praesentation', JSON.stringify(m.ids));
  p('… und ist beim Öffnen gewählt', m.ersterGewaehlt);
  gleich('Genau einer ist gewählt', m.gewaehlt, 1);
  p('Jeder ist ein `tab` (§38)', m.rollen);
  p('„Start" ist NICHT dabei (14 von 14 Knöpfen tun hier nichts)',
    !m.ids.includes('start'), JSON.stringify(m.ids));
  p('„Einfügen" ist NICHT dabei (65 von 69 tun hier nichts)',
    !m.ids.includes('einfuegen'), JSON.stringify(m.ids));
  p('„Zeichnen" ist NICHT dabei (steht als Zeichenleiste schon da, §8)',
    !m.ids.includes('zeichnen'), JSON.stringify(m.ids));
  p('Jeder Reiter ist mindestens 30 px hoch', m.zuFlach.length === 0,
    JSON.stringify(m.zuFlach));
  p('Die Namen sind Wörter, keine Kennungen',
    m.namen.length > 0 && m.namen.every(n => n.length > 2 && !/^[a-z]+$/.test(n)),
    JSON.stringify(m.namen));
}

/* ══ §3 JEDER REITER ZEIGT ECHTE KNÖPFE — MIT ZEICHEN ════════════════════ */
console.log('\n§3 Gruppen mit Überschriften, Knöpfe mit Zeichen (der Fund des Bildes)');
{
  const reiter = await gross.seite.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.folienband-reiter [data-fb-reiter]')]
      .map(b => b.dataset['fbReiter'] || ''));
  let geprueft = 0, ohneZeichen = 0, leereUeberschrift = 0, ausserhalb = 0, ohneSatz = 0;
  const gesehen: string[] = [];
  for (const r of reiter) {
    await gross.seite.click(`[data-fb-reiter="${r}"]`);
    await gross.seite.waitForTimeout(350);
    const m = await gross.seite.evaluate(() => {
      const f = document.querySelector<HTMLElement>('.folienband-flaeche');
      const fr = f?.getBoundingClientRect();
      const kn = [...(f?.querySelectorAll<HTMLElement>('.mb-knopf') || [])];
      const titel = [...(f?.querySelectorAll<HTMLElement>('.mb-gruppe-titel') || [])];
      return {
        knoepfe: kn.length,
        gruppen: titel.length,
        leer: titel.filter(t => !(t.textContent || '').trim()).length,
        /* DER FUND DES BILDES: ein Knopf ohne gemaltes Zeichen. `data-sym`
           allein reicht nicht — der Kasten kann leer sein. Gesucht wird das
           GEMALTE: ein <svg> darin, ein Textzeichen oder eine Probe. */
        ohneZeichen: kn.filter(b =>
          !b.querySelector('[data-sym] svg, .mb-glyph, .mb-probe')).length,
        raus: kn.filter(b => { const r = b.getBoundingClientRect();
          return !!fr && (r.right > fr.right + 1 || r.left < fr.left - 1); }).length,
        /* §38: jeder Knopf sagt einem Vorleseprogramm, was er ist. */
        ohneSatz: kn.filter(b => !b.getAttribute('aria-label') && !b.title).length,
        titel: titel.map(t => (t.textContent || '').trim())
      };
    });
    geprueft++;
    p(`„${r}": mindestens zwei Knöpfe`, m.knoepfe >= 2, String(m.knoepfe));
    ohneZeichen += m.ohneZeichen; leereUeberschrift += m.leer;
    ausserhalb += m.raus; ohneSatz += m.ohneSatz;
    gesehen.push(...m.titel);
  }
  p('Alle Reiter wurden geöffnet', geprueft >= 4, String(geprueft));
  gleich('KEIN Knopf ohne gemaltes Zeichen (§55.1)', ohneZeichen, 0);
  gleich('KEINE leere Gruppenüberschrift', leereUeberschrift, 0);
  gleich('Kein Knopf ragt aus dem Band', ausserhalb, 0);
  gleich('Jeder Knopf spricht mit einem Vorleseprogramm (§38)', ohneSatz, 0);
  p('Und es waren wirklich Überschriften da', gesehen.length >= 6,
    JSON.stringify(gesehen.slice(0, 12)));
}

/* ══ §4 EIN NOTIZHEFT BEKOMMT KEINS ══════════════════════════════════════ */
console.log('\n§4 Ein hochkantes Notizheft bleibt, wie es war');
{
  await gross.oeffne(gross.ids.heft);
  const m = await gross.seite.evaluate(() => ({
    band: !!document.querySelector('.folienband'),
    zeichenOben: Math.round(document.querySelector('.document-drawingbar')
      ?.getBoundingClientRect().top ?? -1),
    kopfUnten: Math.round(document.querySelector('.document-topbar')
      ?.getBoundingClientRect().bottom ?? -1)
  }));
  p('Kein Folienband im Notizheft', !m.band);
  p('… und die Zeichenleiste sitzt direkt unter der Kopfleiste',
    m.zeichenOben >= 0 && Math.abs(m.zeichenOben - m.kopfUnten) <= 2,
    'Zeichenleiste bei ' + m.zeichenOben + ', Kopf endet bei ' + m.kopfUnten);

  /* Zurück zum Foliensatz: es kommt WIEDER. Ein Band, das einmal weg ist und
     nicht zurückkehrt, wäre schlimmer als keins. */
  await gross.oeffne(gross.ids.deck);
  p('Zurück im Foliensatz ist es wieder da',
    await gross.seite.evaluate(() => !!document.querySelector('.folienband')));
}
await gross.kontext.close();

/* ══ §5 AM SCHMALEN FENSTER KEINS ════════════════════════════════════════ */
console.log('\n§5 Unter 900 px bleibt es beim Knopf „📽️ Folie" (E549)');
{
  for (const breite of [390, 899, 900]) {
    const w = await aufbauen(breite, 844);
    await w.oeffne(w.ids.deck);
    const m = await w.seite.evaluate(() => {
      const bl = document.querySelector('.document-center .blatt-papier')?.getBoundingClientRect();
      return {
        band: !!document.querySelector('.folienband'),
        folienKnopf: !!document.querySelector<HTMLElement>(
          '[data-document-action="folienmenue"]:not([hidden])'),
        verh: bl ? Math.round((bl.width / bl.height) * 1000) / 1000 : 0
      };
    });
    if (breite < 900) {
      p(`${breite} px: kein Band`, !m.band);
      p(`${breite} px: dafür der Knopf „📽️ Folie"`, m.folienKnopf);
    } else {
      p(`${breite} px: ein Band`, m.band);
    }
    p(`${breite} px: die Folie bleibt 16:9`, m.verh === 1.778, String(m.verh));
    await w.kontext.close();
  }
}

/* ══ §6 DAS BAND FOLGT DEM FENSTER ═══════════════════════════════════════
 * GEFUNDEN BEIM LESEN DES EIGENEN BOGENS, nicht beim Messen: `innerWidth`
 * wird beim Zeichnen EINMAL gefragt. Wer ein Fenster von 1440 auf 800 zieht,
 * behielt ein Band, das dort nicht hingehört; wer umgekehrt aufzieht, bekam
 * nie eines. Das Studio zeichnet bei `resize` nicht neu — es rechnet nur
 * Höhen nach —, also muss das Band sich dort selbst ein- und aushängen. */
console.log('\n§6 Zieht man das Fenster schmal, geht das Band — und kommt wieder');
{
  const w = await aufbauen(1440, 852);
  await w.oeffne(w.ids.deck);
  const anfangs = await w.seite.evaluate(() => !!document.querySelector('.folienband'));
  p('Bei 1440 px ist es da', anfangs);

  await w.seite.setViewportSize({ width: 800, height: 852 });
  await w.seite.waitForTimeout(600);
  const schmal = await w.seite.evaluate(() => ({
    band: !!document.querySelector('.folienband'),
    zeichenOben: Math.round(document.querySelector('.document-drawingbar')
      ?.getBoundingClientRect().top ?? -1),
    kopfUnten: Math.round(document.querySelector('.document-topbar')
      ?.getBoundingClientRect().bottom ?? -1)
  }));
  p('Auf 800 px gezogen ist es weg', !schmal.band);
  p('… und die Zeichenleiste rückt wieder unter die Kopfleiste',
    Math.abs(schmal.zeichenOben - schmal.kopfUnten) <= 2,
    'Zeichenleiste bei ' + schmal.zeichenOben + ', Kopf endet bei ' + schmal.kopfUnten);

  await w.seite.setViewportSize({ width: 1440, height: 852 });
  await w.seite.waitForTimeout(600);
  const wieder = await w.seite.evaluate(() => {
    const b = document.querySelector<HTMLElement>('.folienband');
    return {
      band: !!b,
      /* Nicht ZWEI — ein zweites Einhängen wäre der naheliegende Fehler. */
      wieviele: document.querySelectorAll('.folienband').length,
      knoepfe: document.querySelectorAll('.folienband-flaeche .mb-knopf').length,
      ohneZeichen: [...document.querySelectorAll<HTMLElement>('.folienband-flaeche .mb-knopf')]
        .filter(x => !x.querySelector('[data-sym] svg, .mb-glyph, .mb-probe')).length,
      unterKopf: !!b && b.getBoundingClientRect().top >=
        (document.querySelector('.document-topbar')?.getBoundingClientRect().bottom ?? 0) - 1
    };
  });
  p('Wieder aufgezogen ist es zurück', wieder.band);
  gleich('… und zwar genau EINES', wieder.wieviele, 1);
  p('… mit seinen Knöpfen', wieder.knoepfe >= 2, String(wieder.knoepfe));
  gleich('… und die tragen ihre Zeichen', wieder.ohneZeichen, 0);
  p('… und es sitzt wieder unter der Kopfleiste', wieder.unterKopf);
  await w.kontext.close();
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0, );
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 506: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
