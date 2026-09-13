/* Suite 507 — Eine Folie STEHT, ein Skript ROLLT
 * ============================================================================
 * Redur hat zu zwei verschiedenen Dingen zwei verschiedene Sachen gesagt, und
 * sie widersprechen einander nicht:
 *
 *   PDF und Heft (E299):  „die PDF SEITEN sollte wie goodnotes sich ganz
 *                          oeffnen komplet wie one note so"
 *   Folien (E548/E549):   „1:1 wie powerpoint"
 *
 * Ein Skript liest man durch, man blättert es nicht. Eine Präsentation rollt
 * in PowerPoint dagegen nirgends: dort STEHT eine Folie, und die Liste
 * wechselt sie. Die Rolle ist genau das, was einen Foliensatz nicht wie
 * PowerPoint aussehen lässt.
 *
 * Die Einzelseite gab es seit E398 — als Schalter im Inspector, mit der
 * Rolle als Vorgabe „überall". Dieser Bogen ändert die VORGABE, und zwar nur
 * für den quer liegenden Foliensatz. Das ist keine Entscheidung gegen E299,
 * sondern beide Ansagen dort, wo sie gemeint waren. Der Schalter bleibt der
 * stärkere: wer bei einem Foliensatz „Fortlaufend" wählt, behält es.
 *
 * ─── WAS GEMESSEN WURDE, BEVOR ETWAS GEBAUT WURDE ───────────────────────────
 * Stehende Folie, wie sie vorher aussah:
 *
 *     Rechner 1440 × 852   Folie 980 × 551 in 1440 × 588  ·  94 % der Höhe
 *     Telefon  390 × 844   Folie 344 × 194 in  390 × 689  ·  28 % der Höhe
 *                          und 476 px LEERE FLÄCHE darunter
 *
 * Am Rechner war nichts zu tun. Am Telefon stand die Folie oben und darunter
 * ein halber Bildschirm Nichts; breiter kann sie dort nicht werden (344 von
 * 390 px sind 88 %), also gehört sie in die Mitte. Danach: 203 px über ihr,
 * 293 px unter ihr — nicht gleich, weil unten 110 px für die schwebende
 * Stiftleiste freibleiben, und das ist richtig so.
 *
 * ─── `safe center`, UND WARUM DAS KEIN DETAIL IST ───────────────────────────
 * Mittiges Ausrichten in einem rollenden Kasten schiebt den Inhalt nach OBEN
 * heraus, sobald er höher ist als der Kasten — und dorthin rollt kein
 * Rollbalken. Gemessen, Abstand der Folienoberkante zur Oberkante:
 *
 *                                     safe center      center
 *     1440 × 852  (normal)               + 28 px       − 28 px
 *     1440 × 500  (kurzes Fenster)       + 28 px       −204 px
 *     1440 × 420, Zoom 180 %             + 28 px       −464 px
 *
 * Minus heisst: der Anfang der Folie ist nicht erreichbar. Und die erste
 * Zeile trifft schon den GEWÖHNLICHEN Fall.
 *
 * ─── UND EIN FUND AUS E549, DEN ERST DAS BILD ZEIGTE ────────────────────────
 * „📽️ Folie" stand oben in der Kopfleiste. Am Telefon war er der einzige
 * Knopf dort, der sein WORT zeigte — alle anderen tragen nur ihr Zeichen —,
 * und er kostete: dem Titel eines Foliensatzes blieben bei 390 px **70 px**.
 * `test285` verlangt hundert, mit der Begründung aus E296 („N." statt eines
 * Namens). Gemeldet hat es niemand, weil `test285` ein PDF öffnet und der
 * Knopf dort ohnehin versteckt ist — der Fall war unbeobachtet.
 *
 * Er steht jetzt am Telefon in der Ansichtsklappe, denselben Weg, den E468
 * für die Suche und E493 für „Präsentieren" gegangen sind. Titel danach:
 * 114 px.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Alle vier gefahren, die Zahlen sind GEMESSEN:
 *   G1 → Vorgabe wieder „immer Rolle":                    24 grün, 10 rot  (der Foliensatz zeigt wieder alle drei)
 *   G2 → `meta` nicht mehr gewinnen lassen:               30 grün,  4 rot  (nach dem Neuladen ist der Druck vergessen)
 *   G3 → `safe center` zu `center`:                       30 grün,  4 rot  (Anfang bei −28, −204, −244 px — unerreichbar)
 *   G4 → den Knopf oben stehen lassen:                    32 grün,  2 rot  (Titel wieder 70 px statt 114)
 *
 * UND EINE LEHRE ÜBER DIESE SUITE SELBST. §2 stand zuerst vier Zeilen rot,
 * und die Zeilen hatten recht: der erste Entwurf schrieb `dokLauf:` von
 * aussen ins `meta` und erwartete eine Wirkung. `stateFor` legt den Zustand
 * je Dokument aber EINMAL an und liest den Merker danach nicht wieder — kein
 * Fehler, sondern der Grund, warum das Umschalten im Bild sofort wirkt.
 *
 * Geprüft wird deshalb der Weg des Menschen: den Schalter im Inspector
 * drücken, die Seite NEU LADEN, nachsehen. Eine Zusage, die eine Abkürzung
 * nimmt, prüft die Abkürzung.
 *
 *   node pruefungen/lauf/test507.mts
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
const PORT = 9617;
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

const aufbauen = async (breite: number, hoehe: number) => {
  const kontext = await browser.newContext({
    viewport: { width: breite, height: hoehe },
    hasTouch: breite < 800, isMobile: breite < 800
  });
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
    Folienvorlagen.neueFolie(deck.id, 'vergleich');
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
  return { kontext, seite, ids, oeffne };
};

/** Wie viele Bühnen sind zu sehen, und wie liegt die aktive? */
const lage = (s: any) => s.evaluate(() => {
  const mitte = document.querySelector<HTMLElement>('.document-center');
  const sichtbar = [...document.querySelectorAll<HTMLElement>('.document-stage')]
    .filter(x => x.getBoundingClientRect().height > 0);
  const bl = document.querySelector<HTMLElement>('.document-stage[data-aktiv] .blatt-papier');
  const mr = mitte?.getBoundingClientRect(), br = bl?.getBoundingClientRect();
  if (mitte) mitte.scrollTop = 0;
  const br2 = bl?.getBoundingClientRect();
  return {
    einzeln: mitte?.classList.contains('ist-einzeln') === true,
    buehnen: sichtbar.length,
    alleBuehnen: document.querySelectorAll('.document-stage').length,
    flaeche: mr ? { b: Math.round(mr.width), h: Math.round(mr.height) } : null,
    folie: br ? { b: Math.round(br.width), h: Math.round(br.height),
                  verh: Math.round((br.width / br.height) * 1000) / 1000 } : null,
    anteil: br && mr ? Math.round((br.height / mr.height) * 100) : 0,
    obenIm: br ? Math.round(br.top - (mr?.top ?? 0)) : 0,
    untenIm: br ? Math.round((mr?.bottom ?? 0) - br.bottom) : 0,
    /* Nach `scrollTop = 0`: liegt der Anfang der Folie IM Kasten? Ein
       negativer Wert hiesse, man kommt nicht mehr hin. */
    obenNachOben: br2 ? Math.round(br2.top - (mr?.top ?? 0)) : 0,
    ausrichtung: mitte ? getComputedStyle(mitte).justifyContent : '—',
    stand: (document.querySelector('.document-position')?.textContent || '').trim()
  };
});

/* ══ §1 EIN FOLIENSATZ STEHT, EIN HEFT ROLLT ═════════════════════════════ */
console.log('\n§1 Von Haus aus: die Folie steht, das Heft rollt (E299 bleibt)');
const gross = await aufbauen(1440, 852);
{
  await gross.oeffne(gross.ids.deck);
  const d = await lage(gross.seite);
  p('Der Foliensatz steht', d.einzeln);
  gleich('… und zwar genau EINE Folie im Bild', d.buehnen, 1);
  p('… von dreien, die es gibt', d.alleBuehnen >= 3, String(d.alleBuehnen));
  p('… und sie ist 16:9', d.folie?.verh === 1.778, JSON.stringify(d.folie));
  p('… und nutzt über 85 % der Höhe', d.anteil >= 85, String(d.anteil) + ' %');

  await gross.oeffne(gross.ids.heft);
  const h = await lage(gross.seite);
  p('Das Notizheft ROLLT weiter (E299)', !h.einzeln);
  p('… und zeigt mehr als ein Blatt', h.buehnen >= 2, String(h.buehnen));
}

/* ══ §2 DER SCHALTER GEWINNT GEGEN DIE VORGABE ═══════════════════════════ */
console.log('\n§2 Wer umschaltet, behält es — in beide Richtungen');
{
  /* ÜBER DEN ECHTEN SCHALTER, NICHT ÜBER `meta`.
     Der erste Entwurf schrieb `dokLauf:` von aussen und erwartete eine
     Wirkung — vier rote Zeilen, und sie hatten recht: `stateFor` legt den
     Zustand je Dokument EINMAL an und liest den Merker danach nicht wieder.
     Das ist kein Fehler, sondern der Grund, warum das Umschalten im Bild
     sofort wirkt. Wer prüfen will, ob es GEMERKT wird, muss den Weg des
     Menschen gehen: drücken, neu laden, nachsehen. */
  const schalten = async () => {
    await gross.seite.evaluate(() => {
      document.querySelector<HTMLElement>('[data-document-action="inspector"]')?.click();
    });
    await gross.seite.waitForTimeout(400);
    const gedrueckt = await gross.seite.evaluate(() => {
      const k = document.querySelector<HTMLElement>('[data-document-action="lauf"]');
      if (!k) return false;
      k.click(); return true;
    });
    await gross.seite.waitForTimeout(600);
    return gedrueckt;
  };
  const nachLaden = async (id: string) => {
    await gross.seite.reload();
    await gross.seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
    await gross.seite.waitForTimeout(600);
    await gross.oeffne(id);
    return lage(gross.seite);
  };

  await gross.oeffne(gross.ids.deck);
  p('Der Schalter ist da (mehr als eine Folie)', await schalten());
  const sofort = await lage(gross.seite);
  p('Ein Druck rollt den Foliensatz sofort', !sofort.einzeln);
  p('… und zeigt mehr als eine Folie', sofort.buehnen >= 2, String(sofort.buehnen));

  const d = await nachLaden(gross.ids.deck);
  p('Und nach dem Neuladen rollt er immer noch — der Schalter gewinnt',
    !d.einzeln);
  p('… gegen die Vorgabe „ein Foliensatz steht"', d.buehnen >= 2, String(d.buehnen));

  /* Heft in die andere Richtung: auch das bleibt. */
  await gross.oeffne(gross.ids.heft);
  await schalten();
  const h = await nachLaden(gross.ids.heft);
  p('Ein Heft auf „Einzelseite" steht auch nach dem Neuladen', h.einzeln);
  gleich('… und zeigt genau ein Blatt', h.buehnen, 1);

  /* Und ohne Merker: jedes Dokument zurück zu SEINER Vorgabe. */
  await gross.seite.evaluate((a: string[]) => {
    Store.setMeta('dokLauf:' + a[0], null); Store.setMeta('dokLauf:' + a[1], null);
  }, [gross.ids.deck, gross.ids.heft]);
  await gross.seite.reload();
  await gross.seite.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await gross.seite.waitForTimeout(600);
  await gross.oeffne(gross.ids.deck);
  p('Ohne Merker steht der Foliensatz wieder', (await lage(gross.seite)).einzeln);
  await gross.oeffne(gross.ids.heft);
  p('… und das Heft rollt wieder', !(await lage(gross.seite)).einzeln);
}

/* ══ §3 DER ANFANG DER FOLIE BLEIBT ERREICHBAR ═══════════════════════════ */
console.log('\n§3 `safe center`: mittig ja, abgeschnitten nie');
{
  await gross.oeffne(gross.ids.deck);
  const d = await lage(gross.seite);
  p('Die Fläche richtet SICHER mittig aus', /safe/.test(d.ausrichtung), d.ausrichtung);
  p('Der Anfang der Folie liegt IM Kasten', d.obenNachOben >= 0,
    String(d.obenNachOben) + ' px');
  await gross.kontext.close();

  /* Der Fall, für den `safe` da ist: die Folie ist höher als die Fläche. */
  for (const [b, h] of [[1440, 500], [1440, 420]] as [number, number][]) {
    const w = await aufbauen(b, h);
    await w.oeffne(w.ids.deck);
    const m = await lage(w.seite);
    p(`${b} × ${h}: die Folie ist höher als die Fläche`,
      (m.folie?.h ?? 0) > (m.flaeche?.h ?? 0),
      JSON.stringify(m.folie) + ' in ' + JSON.stringify(m.flaeche));
    p(`${b} × ${h}: ihr Anfang ist trotzdem erreichbar`, m.obenNachOben >= 0,
      String(m.obenNachOben) + ' px');
    await w.kontext.close();
  }
}

/* ══ §4 AM TELEFON: MITTIG, UND DER TITEL HAT WIEDER PLATZ ═══════════════ */
console.log('\n§4 Am Telefon steht sie mittig — und „Folie" nicht mehr im Kopf');
{
  const w = await aufbauen(390, 844);
  await w.oeffne(w.ids.deck);
  const m = await lage(w.seite);
  p('Auch am Telefon steht sie', m.einzeln);
  gleich('… genau eine', m.buehnen, 1);
  /* SIE STEHT MITTIG: vorher waren es 20 px über ihr und 476 darunter. Die
     beiden Abstände sind nicht gleich — unten bleiben 110 px für die
     schwebende Stiftleiste frei —, aber sie sind in derselben Grössenordnung. */
  p('… und mittig statt oben mit einem halben Bildschirm Leere darunter',
    m.obenIm > 120 && m.untenIm > 120,
    m.obenIm + ' px über ihr, ' + m.untenIm + ' px darunter');
  p('… ohne dass die Fläche rollt', m.obenNachOben === m.obenIm,
    String(m.obenNachOben) + ' / ' + String(m.obenIm));

  const kopf = await w.seite.evaluate(() => {
    const bar = document.querySelector<HTMLElement>('.document-topbar')!;
    const sichtbar = (sel: string) => {
      const e = document.querySelector<HTMLElement>(sel);
      return !!e && e.getBoundingClientRect().height > 0;
    };
    return {
      titel: Math.round(document.querySelector('.document-title')
        ?.getBoundingClientRect().width ?? 0),
      obenKnopf: sichtbar('.document-topbar [data-document-action="folienmenue"]'),
      klappeDa: !!document.querySelector('.document-commandbar .document-folien-klappe:not([hidden])'),
      kopfRechts: Math.round(bar.getBoundingClientRect().right),
      fenster: innerWidth,
      /* §37: jeder sichtbare Knopf der Leiste bleibt ein Fingerziel. */
      zuKlein: [...bar.querySelectorAll<HTMLElement>('button')]
        .filter(b => b.offsetParent !== null)
        .filter(b => Math.min(b.getBoundingClientRect().width,
                              b.getBoundingClientRect().height) < 44).length
    };
  });
  p('„📽️ Folie" steht NICHT mehr oben in der Leiste', !kopf.obenKnopf);
  p('… sondern in der Ansichtsklappe', kopf.klappeDa);
  p('Und der Titel hat wieder über 100 px (test285, E296)', kopf.titel > 100,
    String(kopf.titel) + ' px — vorher 70');
  p('Die Kopfzeile bleibt im Bild', kopf.kopfRechts <= kopf.fenster + 1,
    kopf.kopfRechts + ' von ' + kopf.fenster);
  gleich('Und jeder sichtbare Knopf ist ein Fingerziel (§37)', kopf.zuKlein, 0);

  /* Der Knopf in der Klappe führt wirklich ins Menü — sonst wäre er umgezogen
     und kaputt, und das wäre schlimmer als vorher. */
  await w.seite.evaluate(() => {
    document.querySelector<HTMLElement>('[data-document-action="view"]')?.click();
  });
  await w.seite.waitForTimeout(400);
  await w.seite.evaluate(() => {
    document.querySelector<HTMLElement>('.document-commandbar .document-folien-klappe')?.click();
  });
  await w.seite.waitForTimeout(500);
  const menue = await w.seite.evaluate(() => {
    const m = document.querySelector<HTMLElement>('.menu');
    return { da: !!m, eintraege: m ? m.querySelectorAll('[data-fm]').length : 0 };
  });
  p('Ein Tipp darauf öffnet das Folien-Menü', menue.da);
  p('… mit seinen Einträgen', menue.eintraege >= 4, String(menue.eintraege));
  await w.kontext.close();
}

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 507: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
