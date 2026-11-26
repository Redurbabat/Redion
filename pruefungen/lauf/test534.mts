/* Suite 534 — Die Leiste wandert wirklich (E619–E621)
 * ============================================================================
 * Redur hat am 19. September ein Papier hochgeladen, das Redions Zeichenleiste
 * nach dem GoodNotes-Modell neu bauen will: ziehbar, andockbar, mit Griff.
 * Nachgemessen war das meiste davon längst gebaut — E512 kennt vier Plätze,
 * E570/E571 das Umsortieren, E616/E618 die beschrifteten Strichstärken.
 *
 * NUR: ZWEI DER VIER PLÄTZE WAREN KAPUTT, und zwar sichtbar.
 * Gemessen am 19. September 2026, Fenster 1440 × 960, `data-lage` gesetzt
 * und der Kasten der Leiste abgelesen:
 *
 *     gewöhnliche Seite    oben     x=244  y=335  1136 × 93     richtig
 *                          links    x=250  y=369    64 × 749    richtig
 *                          rechts   x=1310 y=369    64 × 749    richtig
 *                          unten    x=811  y=522     2 × 1409   ← ZWEI PIXEL
 *
 *     Studio               oben     x=198  y=884  1044 × 62     der Dock
 *                          links    x=683  y=197    74 × 749    ← MITTEN AUFS
 *                          rechts   x=683  y=197    74 × 749      PAPIER
 *                          unten    x=198  y=884  1044 × 62     der Dock
 *
 * Das Bild dazu (`bilder/messung-unten-seite.png`) zeigt, was die Zahl 2
 * bedeutet: ein zwei Pixel breiter schwarzer Streifen quer über das Blatt,
 * in dem ein einziger Knopf steckt. §55.1, zum wievielten Mal — kein
 * Prüflauf hat das gehalten, ein Blick hat es in einer Sekunde gezeigt.
 *
 * Die Ursache auf der Seite: `.blatt-werk > .blatt-zeilenbruch` trägt
 * `flex:1 0 100%` (E359). In einem absolut gesetzten Kasten ohne Breite ist
 * dieses `100%` unbestimmt, und die Schrumpf-auf-Inhalt-Breite fällt auf
 * null zusammen. Im Studio ist es umgekehrt: `pdf-studio.css` setzt die
 * Leiste OHNE `[data-lage]` im Wähler auf `left:50%`, die Spaltenform aus
 * `bausteine.css` greift trotzdem — also stand eine 74 px schmale Spalte
 * mitten auf dem Papier.
 *
 * ─── DIE ZUSAGEN DIESES LAUFS ──────────────────────────────────────────────
 *   §1 AUF DER GEWÖHNLICHEN SEITE stehen alle vier Plätze an vier
 *      verschiedenen Orten, und jeder ist LESBAR: die Zeile breit und flach,
 *      die Spalte schmal und hoch — keiner zwei Pixel breit.
 *   §2 IM STUDIO BLEIBT DER DOCK. Redur, 14. September: „Die untere Dock
 *      sollte bleiben." Also steht dort kein Platz-Knopf, der etwas anderes
 *      verspricht — und ein gemerkter Platz verformt den Dock nicht.
 *   §3 DIE LEISTE SAGT, DASS SIE EINE LEISTE IST: `role="toolbar"`, und die
 *      Pfeiltasten bewegen den Fokus darin (§38).
 *   §4 ZIEHEN AM GRIFF dockt an den nächsten Rand an.
 *   §5 EIN TIPP BLEIBT DER RUNDLAUF (E512) — der Telefonweg.
 *   §6 DIE FREIE LAGE bleibt im Bild, auch wenn das Fenster kleiner wird.
 *   §7 §37: der Griff misst 44 px.
 *   §8 Keine Seitenfehler.
 *   §9 Eine freie Leiste bleibt GANZ im Fenster, auch wenn die Seite beim
 *      Ziehen rollt — losgelassen oben und nach dem Verkleinern (E810).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * Am 19. September, vor dem Bau, waren §1 (unten), §2 (die Spalte auf dem
 * Papier), §3 (null `role="toolbar"` in `src/`), §4, §6 und §7 rot. Die
 * Zahlen im Kopf sind die Messung dieses roten Zustands.
 *
 *   node pruefungen/lauf/test534.mts
 *   node pruefungen/alle.mts 534
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9635;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml',
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

/** Eine Seite mit einem Blatt, Stift gewählt. `studio` öffnet den Dokumentmodus. */
const aufbauen = async (breit: number, studio: boolean, handy = false) => {
  const ktx = await browser.newContext({
    viewport: { width: breit, height: handy ? 844 : 960 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  await pg.waitForTimeout(900);
  await pg.evaluate(async (imStudio: boolean) => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung')
      .forEach(n => n.remove());
    const s = Store.addPage(null, { text: 'Lagenprobe', icon: '🧭' });
    /* BREIT, damit die Leiste ihre volle Zeile hat (Behälterabfrage, E359). */
    Store.updateBlock(s.id, { wide: true });
    const b = Store.addBlock(s.id, 'blatt', {
      text: '', papier: 'punkte', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: []
    });
    if (imStudio) Store.updateBlock(s.id, { dokumentModus: true });
    else Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 1100));
  }, studio);
  if (studio) await pg.waitForSelector('.document-drawingbar');
  await pg.waitForTimeout(400);
  /* VOR DEM ERSTEN KLICK gemessen, und das ist der Punkt: ein Klick setzt
     den Fokus, und damit richtet sich der Tabbaum von selbst. Gefragt ist
     der Zustand des frisch geladenen Bildschirms. */
  const tabFrisch = await pg.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.blatt-werk');
    if (!w) return -1;
    return [...w.querySelectorAll<HTMLElement>('button')]
      .filter(b => b.getClientRects().length > 0 && b.tabIndex >= 0).length;
  });
  await pg.click(studio ? '[data-document-tool="stift"]' : '.blatt-werk [data-wz="stift"]')
    .catch(() => {});
  await pg.waitForTimeout(320);
  return { ktx, pg, tabFrisch };
};

/** Der Kasten der sichtbaren Zeichenleiste, bezogen auf das Fenster. */
const kasten = (pg: Page) => pg.evaluate(() => {
  const reihen = [...document.querySelectorAll<HTMLElement>('.blatt-reihe')]
    .filter(r => r.getClientRects().length > 0);
  const r = reihen[0];
  if (!r) return null;
  const k = r.getBoundingClientRect();
  const papiere = [...document.querySelectorAll<HTMLElement>('.blatt-papier')]
    .filter(n => n.getClientRects().length > 0);
  const pap = papiere[0]?.getBoundingClientRect();
  const werk = r.querySelector<HTMLElement>('.blatt-werk');
  return {
    lage: r.dataset.lage ?? '',
    seite: Math.round(document.querySelector('#scroll')?.scrollTop ?? 0),
    x: Math.round(k.x), y: Math.round(k.y),
    w: Math.round(k.width), h: Math.round(k.height),
    richtung: werk ? getComputedStyle(werk).flexDirection : '',
    /* Wie viele Bedienteile man WIRKLICH sieht. Der Zwei-Pixel-Streifen
       hatte noch Knöpfe im Baum — sie waren nur nicht mehr zu erkennen. */
    sichtbar: werk ? [...werk.querySelectorAll<HTMLElement>('button')]
      .filter(x => { const q = x.getBoundingClientRect(); return q.width >= 16 && q.height >= 16; }).length : 0,
    papier: pap ? {
      x: Math.round(pap.x), r: Math.round(pap.right),
      y: Math.round(pap.y), u: Math.round(pap.bottom)
    } : null,
    /* WO SIE IM BAUM STEHT. Seit E622 ist das keine Nebensache: «unten»
       klebt nur dann am Fensterrand, wenn sie im Fluss HINTER dem Papier
       steht — `position:sticky` mit `bottom` zieht nach oben, es schiebt
       nichts nach unten. */
    baum: (() => {
      const h = r.parentElement;
      return h ? [...h.children].indexOf(r) : -1;
    })(),
    letztes: r.parentElement?.lastElementChild === r,
    fenster: { w: window.innerWidth, h: window.innerHeight }
  };
});

/** Platz setzen ÜBER DEN KNOPF — der echte Weg. Seit E622 hängt am Platz
 *  auch ein Zug im Baum («unten» muss hinter das Papier), und den macht nur
 *  `lageAnwenden`. Wer das Attribut von Hand setzt, misst eine Leiste, die
 *  es so nie gibt. */
const lageSetzen = async (pg: Page, lage: string) => {
  for (let i = 0; i < 6; i++) {
    const jetzt = await pg.evaluate(() =>
      document.querySelector<HTMLElement>('.blatt-reihe')?.dataset.lage ?? '');
    if (jetzt === lage) break;
    await pg.click('.blatt-werk [data-act="lage"]');
    await pg.waitForTimeout(180);
  }
  await pg.waitForTimeout(200);
};

/** Nur den GEMERKTEN Platz setzen, ohne Knopf — für das Studio, wo es
 *  keinen gibt (E619). Geprüft wird dort, dass ein gemerkter Platz den Dock
 *  nicht verformt. */
const lageMerken = async (pg: Page, lage: string) => {
  await pg.evaluate((l: string) => {
    try { Store.setMeta('zeichnen:leistenlage', l); } catch { /* nur diese Sitzung */ }
    document.querySelectorAll<HTMLElement>('.blatt-reihe').forEach(r => { r.dataset.lage = l; });
  }, lage);
  await pg.waitForTimeout(220);
};

/* ═══ §1 Die vier Plätze auf der gewöhnlichen Seite ════════════════════════ */
console.log('\n§1 Vier Plätze, vier Orte — und jeder lesbar');
const { ktx: k1, pg: p1, tabFrisch } = await aufbauen(1440, false);
const orte: Record<string, NonNullable<Awaited<ReturnType<typeof kasten>>>> = {};
for (const lage of ['oben', 'links', 'rechts', 'unten']) {
  await lageSetzen(p1, lage);
  const m = await kasten(p1);
  if (m) orte[lage] = m;
  console.log(`    ${lage.padEnd(7)} x=${m?.x} y=${m?.y} ${m?.w} × ${m?.h}, ${m?.sichtbar} Knöpfe sichtbar`);
}
const alleVier = ['oben', 'links', 'rechts', 'unten'].every(l => orte[l]);
p('Alle vier Plätze liefern eine sichtbare Leiste', alleVier);
if (alleVier) {
  const schluessel = new Set(['oben', 'links', 'rechts', 'unten'].map(l => `${orte[l]!.x}/${orte[l]!.y}`));
  p('Sie stehen an vier verschiedenen Orten', schluessel.size === 4, `${schluessel.size} verschiedene`);
  for (const lage of ['oben', 'unten']) {
    const m = orte[lage]!;
    p(`«${lage}» ist eine Zeile: breit und flach`, m.w >= 300 && m.h <= 220, `${m.w} × ${m.h}`);
  }
  for (const lage of ['links', 'rechts']) {
    const m = orte[lage]!;
    p(`«${lage}» ist eine Spalte: schmal und hoch`, m.w >= 44 && m.w <= 140 && m.h >= 220, `${m.w} × ${m.h}`);
    p(`… und die Knöpfe stehen untereinander`, m.richtung === 'column', m.richtung);
    /* EINE SPALTE ENDET IM FENSTER (E696). Sie war `78vh` hoch, egal wo sie
       beginnt — bei 409 px Abstand von oben endete sie 197 px UNTER dem
       Fensterrand, und die letzten Knöpfe (darunter der Griff „Platz")
       waren nur zu erreichen, indem man die ganze Seite rollte. Schon vor
       E690 ragte sie 123 px hinaus; E690 hat den Umschalter der Ansichten
       darübergesetzt, und von da an fiel auch der Griff hinunter. Gemessen
       wird OHNE vorheriges Rollen der Seite — wer rollen muss, um die
       Leiste zu sehen, hat sie nicht. */
    p(`«${lage}» endet im Fenster — der letzte Knopf braucht kein Seitenrollen`,
      m.y + m.h <= m.fenster.h + 2 && m.seite === 0,
      `Spalte ${m.y} … ${m.y + m.h} bei ${m.fenster.h} px, Seite gerollt um ${m.seite} px`);
  }
  for (const lage of ['oben', 'links', 'rechts', 'unten']) {
    const m = orte[lage]!;
    p(`«${lage}» zeigt seine Knöpfe (nicht nur im Baum)`, m.sichtbar >= 6, `${m.sichtbar} sichtbar`);
    p(`«${lage}» bleibt im Fenster`, m.x >= -2 && m.x + m.w <= m.fenster.w + 2 && m.y >= -2,
      `x=${m.x} w=${m.w} von ${m.fenster.w}`);
  }
}

/* ═══ §1b «unten» klebt am Fenster, nicht am Blattfuss (L187, E622) ═══════ */
console.log('\n§1b «unten» bleibt im Bild, auch wenn das Blatt lang ist');
await lageSetzen(p1, 'unten');
const klebt = await kasten(p1);
console.log(`    y=${klebt?.y} in ${klebt?.fenster.h} px Fenster, Papier ${klebt?.papier?.y}…${klebt?.papier?.u}, Platz im Baum ${klebt?.baum}`);
p('Sie ist `position:sticky`, nicht absolut',
  await p1.evaluate(() => getComputedStyle(document.querySelector('.blatt-reihe')!).position) === 'sticky');
p('… und steht im Baum HINTER dem Papier', klebt?.letztes === true, `Platz ${klebt?.baum}`);
p('… und klebt am unteren Fensterrand, nicht am Blattfuss',
  !!klebt && klebt.y + klebt.h <= klebt.fenster.h + 2 && klebt.y > klebt.fenster.h / 2,
  `y=${klebt?.y}+${klebt?.h} in ${klebt?.fenster.h}`);
p('… obwohl das Blatt länger ist als das Fenster',
  !!klebt?.papier && klebt.papier.u > klebt.fenster.h,
  `Papier bis ${klebt?.papier?.u}`);
/* DIE LÜCKE, die `sticky` im Fluss machen könnte: sie entsteht NICHT, weil
   die Leiste hinter dem Papier steht. Gemessen gegen «oben»: dort beginnt
   die LEISTE bei 335 und das Papier darunter bei 428; bei «unten» muss das
   Papier selbst bei 335 anfangen. Eine feste Zahl wie „< 400" wäre hier
   zu weich — in der Gegenprobe stand das Papier bei 381 und der Lauf blieb
   grün, obwohl 46 px Lücke dastanden. */
p('Über dem Papier steht keine Lücke — es beginnt, wo bei «oben» die Leiste beginnt',
  !!klebt?.papier && !!orte['oben'] && klebt.papier.y <= orte['oben']!.y + 4,
  `Papier bei ${klebt?.papier?.y}, «oben» beginnt bei ${orte['oben']?.y}`);
await lageSetzen(p1, 'oben');
const zurueck = await kasten(p1);
p('Und zurück bei «oben» steht sie wieder vor dem Papier',
  zurueck?.baum === 0, `Platz ${zurueck?.baum}`);

/* ═══ §2 Im Studio bleibt der Dock ═════════════════════════════════════════ */
console.log('\n§2 Im Studio bleibt der Dock — Redur, 14. September');
const { ktx: k2, pg: p2 } = await aufbauen(1440, true);
const dockOben = await kasten(p2);
console.log(`    Stand: x=${dockOben?.x} y=${dockOben?.y} ${dockOben?.w} × ${dockOben?.h}`);
p('Der Dock steht unten in der Mitte',
  !!dockOben && dockOben.w >= 300 && dockOben.h <= 220 && dockOben.y > dockOben.fenster.h / 2,
  JSON.stringify(dockOben && [dockOben.x, dockOben.y, dockOben.w, dockOben.h]));
/* SICHTBAR, nicht gezählt: der Knopf wird einmal gebaut und gilt für beide
   Betriebsarten — der Dokumentmodus schaltet zur Laufzeit um. Ihn im Studio
   auszublenden ist deshalb die Aufgabe des Stilblatts, und `display:none`
   nimmt ihn auch aus dem Vorlesebaum (§38), was hier richtig ist: er hat
   dort keine Wirkung. */
const platzImStudio = await p2.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.document-stage[data-aktiv] [data-act="lage"]')]
    .filter(k => k.getClientRects().length > 0).length);
p('Kein sichtbarer Platz-Knopf im Studio — er hätte dort keine Wirkung (E619)',
  platzImStudio === 0, `${platzImStudio} sichtbar`);
for (const lage of ['links', 'rechts', 'unten']) {
  await lageMerken(p2, lage);
  const m = await kasten(p2);
  p(`Ein gemerktes «${lage}» verformt den Dock nicht`,
    !!m && m.w >= 300 && m.h <= 220 && m.richtung === 'row',
    JSON.stringify(m && [m.x, m.y, m.w, m.h, m.richtung]));
  if (m?.papier) p(`… und er liegt nicht quer über dem Papier`,
    m.w >= 300 || m.x + m.w <= m.papier.x + 2 || m.x >= m.papier.r - 2,
    `Leiste ${m.x}–${m.x + m.w}, Papier ${m.papier.x}–${m.papier.r}`);
}

/* ═══ §3 Die Leiste sagt, dass sie eine Leiste ist ═════════════════════════ */
console.log('\n§3 `role="toolbar"` und die Pfeiltasten (§38)');
await lageSetzen(p1, 'oben');
const rolle = await p1.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk');
  if (!w) return null;
  const knoepfe = [...w.querySelectorAll<HTMLElement>('button')]
    .filter(b => b.getClientRects().length > 0);
  return {
    rolle: w.getAttribute('role') ?? '',
    name: w.getAttribute('aria-label') ?? '',
    /* EINE ZUNGE IM TABBAUM, nicht dreissig — so will es die Rolle. */
    tabbar: knoepfe.filter(b => b.tabIndex >= 0).length,
    knoepfe: knoepfe.length
  };
});
p('`.blatt-werk` trägt `role="toolbar"`', rolle?.rolle === 'toolbar', rolle?.rolle || '(keine)');
p('… und einen Namen', (rolle?.name.length ?? 0) > 3, rolle?.name || '(keiner)');
p('Genau ein Knopf steht im Tabbaum', rolle?.tabbar === 1, `${rolle?.tabbar} von ${rolle?.knoepfe}`);
p('… schon beim frisch geladenen Bildschirm, ohne einen einzigen Klick',
  tabFrisch === 1, `${tabFrisch} tabbar`);
const wandern = await p1.evaluate(async () => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const erster = [...w.querySelectorAll<HTMLElement>('button')]
    .filter(b => b.getClientRects().length > 0 && b.tabIndex >= 0)[0];
  if (!erster) return { vorher: '', nachher: '', ende: '' };
  erster.focus();
  const nam = (e: Element | null) => (e as HTMLElement)?.dataset?.wz
    || (e as HTMLElement)?.dataset?.act || (e as HTMLElement)?.className || '';
  const vorher = nam(document.activeElement);
  w.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await new Promise(f => setTimeout(f, 60));
  const nachher = nam(document.activeElement);
  w.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  await new Promise(f => setTimeout(f, 60));
  return { vorher, nachher, ende: nam(document.activeElement) };
});
p('Pfeil rechts wandert weiter', !!wandern.nachher && wandern.nachher !== wandern.vorher,
  `${wandern.vorher} → ${wandern.nachher}`);
p('`End` springt ans Ende', !!wandern.ende && wandern.ende !== wandern.nachher, wandern.ende);

/* ═══ §4 Ziehen am Griff ═══════════════════════════════════════════════════ */
console.log('\n§4 Am Griff ziehen, und sie dockt an');
await lageSetzen(p1, 'oben');
const griff = p1.locator('.blatt-werk [data-act="lage"]').first();
p('Es gibt einen Griff', await griff.count() === 1);
if (await griff.count() === 1) {
  const g = (await griff.boundingBox())!;
  /* NICHT DER KASTEN, SONDERN DIE TREFFFLÄCHE. `.blatt-werk button::after`
     legt seit je ein 44 px hohes Feld über den 32 px hohen Knopf — wer den
     Kasten misst, meldet dreizehn falsche Fehler (derselbe Fund wie in
     test533 §6). */
  const griffHoehe = await p1.evaluate(() => {
    const k = document.querySelector<HTMLElement>('.blatt-werk [data-act="lage"]');
    if (!k) return 0;
    const nach = parseFloat(getComputedStyle(k, '::after').height) || 0;
    return Math.max(k.getBoundingClientRect().height, nach);
  });
  p('Der Griff misst 44 px (§37)', griffHoehe >= 43.5, `${Math.round(griffHoehe)} px`);
  const fenster = await p1.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  await p1.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await p1.mouse.down();
  await p1.mouse.move(g.x + g.width / 2 - 40, g.y + 60, { steps: 6 });
  await p1.mouse.move(24, Math.round(fenster.h / 2), { steps: 12 });
  await p1.mouse.up();
  await p1.waitForTimeout(320);
  const nachZug = await kasten(p1);
  p('Zum linken Rand gezogen heisst «links»', nachZug?.lage === 'links', nachZug?.lage || '(nichts)');
  const gemerkt = await p1.evaluate(() => String(Store.getMeta('zeichnen:leistenlage', '')));
  p('… und der Platz ist gemerkt', gemerkt === 'links', gemerkt);

  /* In die Mitte gezogen: dort ist kein Rand — also bleibt sie frei stehen. */
  await lageSetzen(p1, 'oben');
  /* Die Klicks auf den Griff haben die Seite gerollt (Playwright holt den
     Knopf ins Bild). Dann lag der Griff OBERHALB des Fensters, der Zug fing
     daneben an, und die Leiste blieb «oben» stehen — das war der Fehler
     bei `y=-101`, und er lag am Test, nicht am Produkt. Zurück an den
     Anfang, dann erst messen. */
  await p1.evaluate(() => { const s = document.querySelector<HTMLElement>('#scroll'); if (s) s.scrollTop = 0; });
  await p1.waitForTimeout(150);
  const g2 = (await p1.locator('.blatt-werk [data-act="lage"]').first().boundingBox())!;
  await p1.mouse.move(g2.x + g2.width / 2, g2.y + g2.height / 2);
  await p1.mouse.down();
  await p1.mouse.move(g2.x, g2.y + 40, { steps: 5 });
  await p1.mouse.move(Math.round(fenster.w / 2), Math.round(fenster.h / 2), { steps: 12 });
  await p1.mouse.up();
  await p1.waitForTimeout(320);
  const frei = await kasten(p1);
  p('In die Mitte gezogen heisst «frei»', frei?.lage === 'frei', frei?.lage || '(nichts)');
  p('… und sie steht dort, wo sie losgelassen wurde',
    !!frei && frei.y > 100 && frei.y < (frei.fenster.h - 40), `y=${frei?.y}`);

  /* ═══ §6 Die freie Lage bleibt im Bild ══════════════════════════════════ */
  console.log('\n§6 Frei heisst nicht «hinter dem Rand»');
  await p1.setViewportSize({ width: 900, height: 700 });
  await p1.waitForTimeout(420);
  const eng = await kasten(p1);
  p('Nach dem Verkleinern steht sie noch im Fenster',
    !!eng && eng.x >= -2 && eng.x + eng.w <= eng.fenster.w + 2
      && eng.y >= -2 && eng.y + eng.h <= eng.fenster.h + 2,
    JSON.stringify(eng && [eng.x, eng.y, eng.w, eng.h, eng.fenster]));
  await p1.setViewportSize({ width: 1440, height: 960 });
  await p1.waitForTimeout(320);
}

/* ═══ §5 Ein Tipp bleibt der Rundlauf ══════════════════════════════════════ */
console.log('\n§5 Ein Tipp bleibt der Rundlauf (E512)');
await lageSetzen(p1, 'oben');
await p1.click('.blatt-werk [data-act="lage"]');
await p1.waitForTimeout(280);
const nachTipp = await kasten(p1);
p('Ein Tipp ohne Bewegung schaltet weiter — oben → links',
  nachTipp?.lage === 'links', nachTipp?.lage || '(nichts)');
await p1.click('.blatt-werk [data-act="lage"]');
await p1.waitForTimeout(280);
const nachZwei = await kasten(p1);
p('… und noch einmal: links → rechts', nachZwei?.lage === 'rechts', nachZwei?.lage || '(nichts)');
const rundlauf = await p1.evaluate(() => {
  const k = document.querySelector<HTMLElement>('[data-act="lage"]');
  return { titel: k?.title ?? '', label: k?.getAttribute('aria-label') ?? '' };
});
p('Der Griff sagt, wohin es als Nächstes geht',
  /Nächstes/.test(rundlauf.titel), rundlauf.titel);
p('«frei» steht nicht im Rundlauf — dorthin führt nur das Ziehen',
  !/frei/i.test(rundlauf.titel), rundlauf.titel);

/* ═══ §7 Am Telefon wird nicht gezogen ═════════════════════════════════════ */
console.log('\n§7 Am Telefon bleibt der Rundlauf allein');
const { ktx: k3, pg: p3 } = await aufbauen(390, false, true);
const griffHandy = p3.locator('.blatt-werk [data-act="lage"]').first();
if (await griffHandy.count() === 1) {
  const g = (await griffHandy.boundingBox())!;
  const hoeheHandy = await p3.evaluate(() => {
    const k = document.querySelector<HTMLElement>('.blatt-werk [data-act="lage"]');
    if (!k) return 0;
    const nach = parseFloat(getComputedStyle(k, '::after').height) || 0;
    return Math.max(k.getBoundingClientRect().height, nach);
  });
  p('Auch am Telefon misst der Griff 44 px (§37)', hoeheHandy >= 43.5, `${Math.round(hoeheHandy)} px`);
  await p3.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await p3.mouse.down();
  await p3.mouse.move(12, 600, { steps: 10 });
  await p3.mouse.up();
  await p3.waitForTimeout(300);
  const m = await kasten(p3);
  p('Ziehen am Telefon macht die Leiste nicht frei schwebend',
    m?.lage !== 'frei', m?.lage || '(nichts)');
} else p('Griff am Telefon gefunden', false, 'kein [data-act="lage"]');

/* ═══ §9 Eine freie Leiste bleibt im Fenster (E810) ════════════════════════
   Die freie Lage hängt an der Hülle in Prozent. Rollt die Seite, während
   die Leiste gezogen wird, kann die Hülle mit ihrer Oberkante über dem
   Fensterrand liegen — und ein Loslassen oben im Bild liess die Leiste mit
   ihrem Rand heraushängen. Ohne Rollen ist dieser Fall nicht zu erreichen,
   deshalb rollt dieser Abschnitt bewusst. Er ist deterministisch: kein
   Zufall, keine Wiederholung. */
console.log('\n§9 Frei heisst im Fenster — auch wenn die Seite beim Ziehen rollt');
const { ktx: k4, pg: p4 } = await aufbauen(1440, false);
await p4.evaluate(() => { const s = document.querySelector<HTMLElement>('#scroll'); if (s) s.scrollTop = 0; });
await p4.waitForTimeout(150);
const gz = (await p4.locator('.blatt-werk [data-act="lage"]').first().boundingBox())!;
await p4.mouse.move(gz.x + gz.width / 2, gz.y + gz.height / 2);
await p4.mouse.down();
await p4.mouse.move(gz.x + gz.width / 2, gz.y + gz.height / 2 + 20, { steps: 4 });
/* Die Seite rollt während des Zugs, bis die Hülle mit ihrer Oberkante
   ÜBER dem Fenster liegt. Der Zeiger ist dann oben im Bild. Der Abstand
   zum Hüllenrand bleibt über dem Andock-Band (64 px), sonst dockte die
   Leiste an die Hülle an, und der Fall wäre ein anderer. */
await p4.evaluate(() => { const s = document.querySelector<HTMLElement>('#scroll'); if (s) s.scrollTop = 480; });
await p4.mouse.move(720, 10, { steps: 8 });
await p4.mouse.up();
await p4.waitForTimeout(320);
const ober = await kasten(p4);
p('Oben losgelassen heisst «frei» (kein Andocken an die Hülle)',
  ober?.lage === 'frei', ober?.lage || '(nichts)');
/* Das sichtbare Feld ist der Rollbereich (`#scroll`): unter der Kopfleiste,
   neben der Seitenleiste. Eine Leiste darüber ist für den Menschen verloren,
   auch wenn sie im Fenster steht (§9 misst deshalb gegen das Feld). */
const feld = () => p4.evaluate(() => {
  const b = document.querySelector<HTMLElement>('#scroll')!.getBoundingClientRect();
  return { oben: b.top, unten: b.bottom, links: b.left, rechts: b.right };
});
const imFeld = (k: any, f: { oben: number; unten: number; links: number; rechts: number }): boolean =>
  !!k && k.lage === 'frei' && k.y >= f.oben - 1 && k.y + k.h <= f.unten + 1
    && k.x >= f.links - 1 && k.x + k.w <= f.rechts + 1;
const f1 = await feld();
p('… und steht ganz im sichtbaren Feld, nicht unter der Kopfleiste',
  imFeld(ober, f1), JSON.stringify(ober && [ober.x, ober.y, ober.w, ober.h]) + ` Feld oben ${Math.round(f1.oben)}`);
await p4.setViewportSize({ width: 900, height: 700 });
await p4.waitForTimeout(420);
const eng2 = await kasten(p4);
const f2 = await feld();
p('Nach dem Verkleinern steht sie noch im sichtbaren Feld',
  imFeld(eng2, f2), JSON.stringify(eng2 && [eng2.x, eng2.y, eng2.w, eng2.h]) + ` Feld oben ${Math.round(f2.oben)}`);
await k4.close();

/* ═══ §8 Keine Seitenfehler ════════════════════════════════════════════════ */
console.log('\n§8 Keine Seitenfehler');
p('Keine Fehler auf der Seite', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await k1.close(); await k2.close(); await k3.close();
await browser.close();
server.close();
console.log(`\n${ok} gut, ${weg} weg`);
process.exit(weg === 0 ? 0 : 1);
