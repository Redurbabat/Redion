/* Suite 461 — Der Stift wie GoodNotes: Halten, Schutzleiter, Zurück links (E490)
 * ============================================================================
 * Redur am 7. September: „könntest du den Stift verbessern — wenn ich eine
 * Linie zeichne und mehr als drei Sekunden gedrückt halte, sollte sie gerade
 * werden. Dann brauche ich eine spezielle Farbe, die ist Schutzleiterfarbe,
 * so grün-gelb, und Strich-Punkt-Strich-Punkt. Und ich will das
 * Zurücknehmen ungefähr hier haben wie GoodNotes." (mit einem Bild, auf dem
 * links oben ein Kasten gezeichnet war)
 *
 *   §1 HALTEN GILT AUCH BEI ZITTERNDER HAND. Das war der ganze Fehler: jeder
 *      aufgezeichnete Punkt setzte die Uhr zurück, und eine Hand, die hält,
 *      liefert weiter Punkte. Mit der Maus ging es, mit einer Hand nie.
 *   §2 DIE ERKENNUNG WAR NICHT DAS PROBLEM — nachgemessen, nicht geändert.
 *   §3 DER SCHUTZLEITER: ein grüner Strich und ein gelber Strich-Punkt
 *      darüber, in EINER Marke.
 *   §4 GEHALTEN WIRD ER GERADE — und bleibt Schutzleiter.
 *   §5 ZURÜCK UND VOR STEHEN LINKS in der Studioleiste.
 *   §6 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `bewegtUm` wieder bei jedem Punkt setzen: der gehaltene Strich
 *        bleibt krumm. Gelaufen, rot.
 *   §3 → die Schutzleiter-Gruppe auslassen: ein Strich statt zwei, und die
 *        Farbe der Leiste statt Grün. Gelaufen, rot.
 *   §4 → `delete mark.stil` wieder ohne Ausnahme: die gerade Leitung wird
 *        schwarz. Gelaufen, rot.
 *   §5 → `prepend` wieder zu `appendChild`: Zurück steht rechts. Gelaufen, rot.
 *
 *   node pruefungen/lauf/test461.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;
declare const InkShapes: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9581;
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

/** Eine Seite mit einem leeren Blatt und dem Stift in der Hand. */
const mitStift = async (stil = 'fueller'): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async (wahl: string) => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('zeichnen:formen', true);
    Store.setMeta('zeichnen:stil', wahl);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Schaltplan' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  }, stil);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.evaluate(() => document.querySelector<HTMLButtonElement>('.blatt-werk [data-wz="stift"]')?.click());
  await s.waitForTimeout(250);
  return s;
};

/**
 * Einen Strich ziehen und am Ende halten.
 *
 * `zittern` ist der Ausschlag des Haltens in Blattpunkten: 0 heisst
 * bewegungslos (eine Maus), 2 heisst eine ruhige Hand, 10 heisst, dass die
 * Hand weitergegangen ist. `haltenMs` ist die Zeit, die dabei vergeht — sie
 * vergeht WIRKLICH, denn die Marke misst mit `Date.now()`.
 */
const strichHalten = (s: Page, zittern: number, haltenMs: number, wackeln = 3) =>
  s.evaluate(async (a: { zittern: number; haltenMs: number; wackeln: number }) => {
    const f = document.querySelector<SVGSVGElement>('.blatt-marken')!;
    const ctm = f.getScreenCTM()!;
    const px = (x: number, y: number) => { const pt = f.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(ctm); };
    const ev = (typ: string, x: number, y: number) => { const c = px(x, y); return new PointerEvent(typ, {
      bubbles: true, cancelable: true, clientX: c.x, clientY: c.y, pointerId: 7, pointerType: 'pen',
      isPrimary: true, button: typ === 'pointermove' ? -1 : 0,
      buttons: typ === 'pointerup' ? 0 : 1, pressure: 0.6 }); };
    /* Eine von Hand gezogene Linie: leicht wellig, aber gerade gemeint. */
    f.dispatchEvent(ev('pointerdown', 80, 300));
    for (let i = 1; i <= 40; i++) {
      const t = i / 40;
      f.dispatchEvent(ev('pointermove', 80 + t * 400, 300 + a.wackeln * Math.sin(t * 7.3)));
      await new Promise(r => setTimeout(r, 4));
    }
    /* Und jetzt halten: alle 25 ms ein winziger Ausschlag um dieselbe Stelle. */
    const bis = Date.now() + a.haltenMs;
    let n = 0;
    while (Date.now() < bis) {
      n++;
      f.dispatchEvent(ev('pointermove', 480 + a.zittern * Math.sin(n * 1.7),
        300 + a.zittern * Math.cos(n * 2.3)));
      await new Promise(r => setTimeout(r, 25));
    }
    f.dispatchEvent(ev('pointerup', 480, 300));
    await new Promise(r => setTimeout(r, 400));
  }, { zittern, haltenMs, wackeln });

const marken = async (s: Page): Promise<any[]> => JSON.parse(await s.evaluate(`(() => {
  const b = Object.values(Store.cache.blocks).find(x => x.type === 'blatt' && x.alive);
  return JSON.stringify((b && b.marken) || []);
})()`) as string);

/* ═══ §1 Halten gilt auch bei zitternder Hand ══════════════════════════════ */
console.log('\n§1 Halten gilt auch, wenn die Hand zittert');
{
  /* Eine ruhige Hand: ±2 Einheiten, 900 ms. Das MUSS als Halten gelten. */
  const s = await mitStift();
  await strichHalten(s, 2, 900);
  const m1 = await marken(s);
  gleich('Aus dem gehaltenen Strich wird eine Linie', m1.map(x => x.art), ['line']);
  p('… mit genau zwei Punkten', (m1[0]?.pts || []).length === 2, JSON.stringify(m1[0]?.pts));
  await s.close();

  /* Dieselbe Zeit, aber die Hand geht weiter: ±10 Einheiten. Kein Halten. */
  const s2 = await mitStift();
  await strichHalten(s2, 10, 900);
  const m2 = await marken(s2);
  gleich('Wer weiterfährt, hält nicht — der Strich bleibt ein Strich', m2.map(x => x.art), ['stift']);
  await s2.close();

  /* Und ohne Halten (nur 120 ms) bleibt es ebenfalls ein Strich. */
  const s3 = await mitStift();
  await strichHalten(s3, 2, 120);
  gleich('Kurz aufgesetzt ist kein Halten', (await marken(s3)).map(x => x.art), ['stift']);
  await s3.close();
}

/* ═══ §2 Die Erkennung war nicht das Problem ═══════════════════════════════ */
console.log('\n§2 Wie krumm eine Linie sein darf — gemessen, nicht geändert');
{
  const s = await mitStift();
  const mass = JSON.parse(await s.evaluate(`(() => {
    const bahn = (wackeln) => {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        pts.push([60 + t * 400, 300 + wackeln * (Math.sin(t * 7.3) * 0.6 + Math.sin(t * 19.1) * 0.4)]);
      }
      return pts;
    };
    const raus = {};
    for (const w of [0, 4, 12, 18, 25]) raus[w] = (InkShapes.recognize(bahn(w)) || {}).art || null;
    return JSON.stringify(raus);
  })()`) as string);
  gleich('Eine saubere Linie: Linie', mass['0'], 'line');
  gleich('±4 Einheiten Zittern: immer noch Linie', mass['4'], 'line');
  gleich('±12: immer noch Linie — eine Hand ist so krumm nicht', mass['12'], 'line');
  gleich('±18: keine Linie mehr', mass['18'], null);
  gleich('±25: erst recht nicht', mass['25'], null);
  await s.close();
}

/* ═══ §3 Der Schutzleiter ══════════════════════════════════════════════════ */
console.log('\n§3 Grün-gelb und Strich-Punkt, in EINER Marke');
{
  const s = await mitStift();
  const bild = JSON.parse(await s.evaluate(`(() => {
    const knoten = Marken.zeichneMarke({ id: 'pe', art: 'stift', stil: 'schutzleiter',
      farbe: '#111111', breite: 3, pts: [[60, 100], [300, 100], [300, 260]] });
    const kinder = [...knoten.children];
    return JSON.stringify({
      tag: knoten.tagName, sid: knoten.getAttribute('data-sid'),
      stil: knoten.getAttribute('data-ink-stil'),
      anzahl: kinder.length,
      unten: { farbe: kinder[0]?.getAttribute('stroke'), muster: kinder[0]?.getAttribute('stroke-dasharray') },
      oben: { farbe: kinder[1]?.getAttribute('stroke'), muster: kinder[1]?.getAttribute('stroke-dasharray') },
      gleicherWeg: kinder[0]?.getAttribute('d') === kinder[1]?.getAttribute('d')
    });
  })()`) as string);
  gleich('Eine Gruppe mit zwei Strichen', [bild.tag, bild.anzahl], ['g', 2]);
  gleich('… und EINER Kennung', bild.sid, 'pe');
  gleich('Unten grün, ohne Muster', [bild.unten.farbe, bild.unten.muster], ['#158a3a', null]);
  p('Oben gelb, mit Strich-Punkt-Muster',
    bild.oben.farbe === '#f2d200' && String(bild.oben.muster).split(' ').length === 4,
    JSON.stringify(bild.oben));
  p('… und beide gehen denselben Weg', bild.gleicherWeg, JSON.stringify(bild));
  /* Das Muster ist Strich, Lücke, Punkt, Lücke — der Punkt ist das kürzeste. */
  const teile = String(bild.oben.muster).split(' ').map(Number);
  p('Strich lang, Punkt kurz', (teile[0] ?? 0) > (teile[2] ?? 0) * 5, JSON.stringify(teile));
  p('Die Farbe der Leiste gilt für ihn nicht — ein blauer Schutzleiter wäre keiner',
    bild.unten.farbe !== '#111111', JSON.stringify(bild.unten));
  gleich('Er schwillt nicht mit dem Druck', await s.evaluate(`[
    Marken.druckFaktor('schutzleiter', 0.1), Marken.druckFaktor('schutzleiter', 1)
  ]`), [1, 1]);
  /* E509 hat den Leiterstift HINTER ihn gehängt. Geprüft wird darum nicht
     mehr die ganze Reihe, sondern das, worauf es ankommt: die vier
     gewöhnlichen Stifte stehen unverändert vorn, der Schutzleiter kommt
     erst danach. */
  gleich('Er steht hinter den vier gewöhnlichen Stiften — der alte Wechsel bleibt',
    await s.evaluate(`Marken.STIFTE.map(x => x.id).slice(0, 5)`),
    ['fueller', 'kugel', 'pinsel', 'bleistift', 'schutzleiter']);
  await s.close();
}

/* ═══ §4 Gehalten wird er gerade — und bleibt Schutzleiter ═════════════════ */
console.log('\n§4 Die gerade Erdungsleitung');
{
  const s = await mitStift('schutzleiter');
  await s.evaluate(() => {
    /* Seit E512 steht jeder Stift als eigener Knopf da (E512). */
    document.querySelector<HTMLButtonElement>(
      '.blatt-werk [data-act="stilwahl"][data-stil="schutzleiter"]')?.click();
  });
  await s.waitForTimeout(250);
  await strichHalten(s, 2, 900);
  const m = await marken(s);
  gleich('Der gehaltene Strich wird eine Linie', m.map(x => x.art), ['line']);
  gleich('… und bleibt der Schutzleiter', m[0]?.stil, 'schutzleiter');
  p('Auf dem Blatt steht sie als Gruppe mit zwei Strichen',
    await s.evaluate(`(() => {
      const g = document.querySelector('.blatt-marken [data-ink-stil="schutzleiter"]');
      return !!g && g.tagName === 'g' && g.children.length === 2;
    })()`), '');
  await s.close();
}

/* ═══ §5 Zurück und Vor stehen links ═══════════════════════════════════════ */
console.log('\n§5 Zurücknehmen links, wie bei GoodNotes');
{
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    const seite = Store.addPage(null, { text: 'Skript', icon: '📕' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    Store.updateBlock(seite.id, { dokumentModus: true });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.document-drawingbar', { timeout: 15000 });
  await s.waitForTimeout(900);
  const lage = JSON.parse(await s.evaluate(`(() => {
    const bar = document.querySelector('.document-drawingbar');
    const zurueck = document.querySelector('[data-document-action="ink-undo"]');
    const vor = document.querySelector('[data-document-action="ink-redo"]');
    const stift = document.querySelector('[data-document-tool="stift"]');
    const mehr = document.querySelector('[data-document-action="ink-options"]');
    const l = (e) => e ? Math.round(e.getBoundingClientRect().left) : -1;
    return JSON.stringify({ erstes: bar.firstElementChild?.className || '',
      zurueck: l(zurueck), vor: l(vor), stift: l(stift), mehr: l(mehr),
      barLinks: Math.round(bar.getBoundingClientRect().left),
      barRechts: Math.round(bar.getBoundingClientRect().right) });
  })()`) as string);
  /* ══ DIE KAPSEL IST AUS DEM BAND AUSGEZOGEN (E572/E573) ═══════════════════
     Hier stand: „Die Verlaufsgruppe ist das erste Kind der Leiste". Das war
     die Anordnung aus E490 — Zurück und Vor ganz links IM Werkzeugband.
     Redurs neue Referenz (E572, Bild 1) zeigt sie stattdessen als kleine
     SCHWEBENDE Kapsel über dem Papier, und genau dorthin sind sie gezogen.

     DIE ZUSAGE DAHINTER BLEIBT UND WIRD SOGAR SCHÄRFER: sie stehen links,
     vor dem ersten Werkzeug, und sie sind ERREICHBAR. Das zweite ist der
     Punkt, an dem dieser Umzug beinahe gescheitert wäre — die Kapsel landete
     erst ausserhalb des Fensters (x = 1440 bei 1440 px) und dann unter dem
     Papier (top = 812 bei 800 px). Gemessen wird deshalb jetzt gegen das
     FENSTER, nicht gegen den Kasten der Leiste, den sie verlassen hat.
     `test393 §1` hält dieselbe Sache an drei Telefonbreiten. */
  p('Die Verlaufskapsel steht als eigener Kasten da, nicht im Werkzeugband',
    lage.erstes !== 'document-ink-history' && lage.zurueck >= 0 && lage.vor >= 0,
    JSON.stringify(lage));
  p('Zurück steht links vom Stift', lage.zurueck < lage.stift, JSON.stringify(lage));
  p('Vor steht rechts von Zurück und links vom Stift',
    lage.vor > lage.zurueck && lage.vor < lage.stift, JSON.stringify(lage));
  p('… und beide im Bild, nah am linken Rand',
    lage.zurueck >= 0 && lage.zurueck < 120 && lage.vor < 160, JSON.stringify(lage));
  p('„···" bleibt ganz rechts', lage.barRechts - lage.mehr < 90, JSON.stringify(lage));
  await s.close();
}

/* ═══ §6 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§6 Quellen');
{
  const q = lies('src/bereiche/pdf/marken.ts');
  p('Das Halten hat einen eigenen Ruhepunkt', /RUHE_RADIUS/.test(q) && /running\.ruhePunkt/.test(q));
  p('Der Ruhepunkt wird beim Absetzen weggeräumt', /delete mark\.ruhePunkt/.test(q));
  p('Der Schutzleiter hat seine zwei Farben', /PE_GRUEN/.test(q) && /PE_GELB/.test(q) && /PE_MUSTER/.test(q));
  p('… und überlebt das Geradeziehen', /mark\.stil !== 'schutzleiter'/.test(q));
  /* Die zwei Quellenzusagen hielten den ALTEN Weg fest: `prepend` ins Band
     und zwei `auto`-Ränder, die das Band um die Kapsel herum mittig hielten.
     Beides gibt es nicht mehr (E573). Was jetzt geprüft wird, ist der neue
     Weg — und zwar so, dass er nicht zufällig stimmt: die Kapsel hängt am
     Dokumentkörper, und das Stilblatt gibt ihr dort eine Lage. */
  p('Die Kapsel hängt am Dokumentkörper, nicht im Werkzeugband',
    /body\.append\(thumbnails, center, inspector, history\)/.test(lies('src/bereiche/pdf/document-mode.ts'))
    && !/drawingbar\.prepend\(history\)/.test(lies('src/bereiche/pdf/document-mode.ts')));
  /* ══ OHNE KOMMENTARE UND LEERRAUM LESEN (E577) ══════════════════════════
     Diese Zeile suchte wörtlich `.document-ink-history{position:absolute`.
     Sie wurde rot, als die Telefonregel einen Kommentar und Zeilenumbrüche
     bekam — obwohl die Regel selbst unverändert galt. Eine Zusicherung, die
     an der FORMATIERUNG hängt statt am Inhalt, meldet Fehler, die keine
     sind, und lenkt vom nächsten echten ab. Jetzt wird das Stilblatt
     entkommentiert und entleert gelesen. */
  const stilOhneBeiwerk = lies('quell/schale/stil/pdf-studio.css')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '');
  /* ══ NICHT MEHR „IM RASTER", SONDERN ÜBERALL ABSOLUT (E579) ══════════════
     Hier stand `grid-column:2` — die Rasterzelle, mit der die Kapsel sich im
     Studio über das Papier legte. Im FOLIENSATZ hat der Dokumentkörper ein
     anderes Raster, und dort bekam sie eine eigene Zeile und SCHOB die
     Fläche: gemessen `.document-center` oben 272 statt 206, 580 px statt
     646. `test508 §2` hat es gefunden.
     Ein Raster, das in einer Ansicht überlagert und in der anderen schiebt,
     ist kein Platz, sondern ein Zufall. `position:absolute` nimmt in jedem
     Raster keinen. */
  p('Das Stilblatt legt sie über das Papier, ohne irgendwo Platz zu nehmen',
    /\.document-ink-history\{[^}]*position:absolute/.test(stilOhneBeiwerk)
    && !/\.document-ink-history\{[^}]*grid-column/.test(stilOhneBeiwerk));
  p('… und der Dokumentkörper ist ihr Bezug',
    /\.document-body\{[^}]*position:relative/.test(stilOhneBeiwerk));
  /* UND AM TELEFON UNTEN, NICHT OBEN (E577). Gemessen deckte `top:8px` dort
     87 × 39 px der Schreibfläche ab — die Ecke, in der die erste Zeile
     anfängt. `test524 §8` misst es an der laufenden App; hier steht nur,
     dass die Regel überhaupt so geschrieben ist. */
  p('… und am Telefon steht sie unten, nicht oben',
    /\.document-ink-history\{[^}]*position:absolute[^}]*bottom:/.test(stilOhneBeiwerk)
    && !/\.document-ink-history\{[^}]*position:absolute[^}]*top:8px/.test(stilOhneBeiwerk));
  p('Das erzeugte JS trägt es', /schutzleiter/.test(lies('quell/bereiche/pdf/marken.js')));
  gleich('Keine Seitenfehler', fehler, []);
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
