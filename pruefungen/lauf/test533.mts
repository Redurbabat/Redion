/* Suite 533 — Die Tafel als Behälter, und das Wort unter dem Zeichen (E614, W2+W3)
 * ============================================================================
 * Redur, 14. September 2026, mit fünf Bildern eines fertigen Entwurfs:
 * „Siehe Bildern, so will ich es haben." Und einen Satz später: „Die untere
 * Dock sollte bleiben."
 *
 * DIESER BOGEN BAUT KEINE GESTALTUNG. Er schiebt EINE Ebene ein —
 * `.blatt-tafel` innerhalb von `.blatt-werk` —, damit W4 dort später eine
 * Tafel aufgehen lassen kann. `AUFGABEN.md:1132` sagt, worin die Arbeit
 * wirklich steckt: „Der Haken sitzt im CSS: rund fünfzig Regeln lesen heute
 * `.blatt-werk > [data-gruppe]` (Kindwähler). Die müssen mit — und genau
 * das ist der Bogen, nicht die Gestaltung."
 *
 * Nachgezählt waren es 104 Selektorzeilen in 51 Regelblöcken, verteilt auf
 * zwei Stilblätter, und dazu sieben `:scope >` im TypeScript.
 *
 * ─── DIE ZUSAGE DIESES LAUFS ───────────────────────────────────────────────
 *
 *     NACH W2 SIEHT DIE LEISTE GENAUSO AUS WIE VORHER.
 *
 * Das ist die unauffälligste Sorte Arbeit und die gefährlichste: ein
 * Kindwähler, der danach ins Leere zeigt, macht eine Regel STILL wirkungslos
 * — und weil `.blatt-tafel` `display:contents` trägt, sähe ein halb
 * umgehängtes Stilblatt an vielen Stellen trotzdem richtig aus. Deshalb
 * misst §2 Kästen und nicht Klassennamen.
 *
 *   §1 DIE EBENE IST DA und trägt weder `data-wz` noch `data-gruppe` —
 *      drei `closest('[data-wz],[data-gruppe]')` in `marken.ts` träfen
 *      sonst die Tafel statt den Knopf, den der Finger meint.
 *   §2 KEIN KNOTEN IST VERLOREN, und keiner hat sich bewegt: dieselben
 *      Namen, dieselben Kästen wie in der Fassung ohne Tafel.
 *   §3 DIE DREI MECHANISMEN, DIE NUR ZWISCHEN GESCHWISTERN WIRKEN:
 *      der Zeilenbruch (`flex:1 0 100%`, E359), `order` am Telefon
 *      (E356/E570) und `position:sticky` an Zurück/Vor.
 *   §4 DIE NUTZEREIGENE ORDNUNG (E570/E571) kommt weiterhin an — sie geht
 *      durch `ordnungAnwenden`, und dessen `if (!bruch) return` wäre der
 *      leiseste Ausfall des ganzen Bogens.
 *   §5 DAS WORT STEHT UNTER DEM ZEICHEN (W3), gemessen und nicht gezählt.
 *   §6 §37: nichts unter 44 px auf dem Hauptweg.
 *   §7 Keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ──────────────────────────────────
 * §1 war rot, bevor die Ebene gebaut war (keine `.blatt-tafel`).
 * §2 wird rot, sobald EIN Kindwähler nicht mitgenommen wird — die Kästen
 *    verschieben sich dann sichtbar; gegengeprüft mit dem Gruppenkatalog
 *    aus `bausteine.css`, siehe ENTSCHEIDUNGEN.md E614.
 * §5 war rot vor W3: das Wort stand rechts neben dem Zeichen, nicht darunter.
 *
 *   node pruefungen/lauf/test533.mts
 *   node pruefungen/alle.mts 533
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9634;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

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

const kontext = async (breit: number, handy = false) => {
  const ktx = await browser.newContext({
    viewport: { width: breit, height: handy ? 844 : 950 },
    isMobile: handy, hasTouch: handy, deviceScaleFactor: 1
  });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
  pg.on('dialog', d => d.dismiss().catch(() => {}));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForTimeout(2800);
  await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Tafelprobe', icon: '🧰' });
    /* BREIT, damit die Leiste über 820 px kommt. W3 zeigt das Wort nach der
       Breite der LEISTE, nicht des Fensters (E359, Behälterabfrage) — eine
       schmale Seite in einem breiten Fenster hätte hier gar keine Wörter. */
    Store.updateBlock(s.id, { wide: true });
    const b = Store.addBlock(s.id, 'blatt', { text: '', papier: 'blanko' });
    Store.addBlock(b.id, 'text', { text: '' });
    await Store.flush();
    App.oeffne(s.id);
    await new Promise(f => setTimeout(f, 900));
  });
  await pg.click('.blatt-werk [data-wz="stift"]');
  await pg.waitForTimeout(260);
  return { ktx, pg };
};

/** Alles, was in der Leiste steht — Name, Kasten, Zeile. */
const aufnahme = (pg: Page) => pg.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const f = w.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? w;
  const wb = w.getBoundingClientRect();
  const sichtbar = (e: Element) => (e as HTMLElement).getClientRects().length > 0;
  /* ZWEI FLÄCHEN SEIT E618: die Werkzeuge und der Zeilenbruch liegen in der
     Leiste, das Zubehör in der Tafel. Wer nur eine von beiden liest, zählt
     die Hälfte — und weil die Tafel `display:contents` trägt, sähe der
     Bildschirm dabei unverändert aus. Genau der Fehler, den W2 schon einmal
     gemacht hätte. */
  const alle = [...w.children, ...f.children]
    .filter(k => !(k as HTMLElement).classList?.contains('blatt-tafel'));
  const teile = alle.filter(sichtbar).map(k => {
    const el = k as HTMLElement, r = el.getBoundingClientRect();
    return {
      name: el.dataset.wz || el.dataset.act || el.dataset.gruppe || el.className,
      x: Math.round(r.x - wb.x), y: Math.round(r.y - wb.y),
      w: Math.round(r.width), h: Math.round(r.height)
    };
  });
  const bruch = w.querySelector<HTMLElement>(':scope > .blatt-zeilenbruch');
  const redo = f.querySelector<HTMLElement>(':scope > [data-act="redo"]');
  return {
    tafel: !!w.querySelector(':scope > .blatt-tafel'),
    tafelKinderVonWerk: w.children.length,
    /* Was WIRKLICH in der Tafel liegt: seit E618 nur noch Zubehör. Kein
       Werkzeug darf hineinrutschen — sonst stünde es später im Kasten. */
    werkzeugeInTafel: f.querySelectorAll(':scope > [data-wz]').length,
    bruchInTafel: f.querySelectorAll(':scope > .blatt-zeilenbruch').length,
    tafelHatGruppe: !!(w.querySelector<HTMLElement>(':scope > .blatt-tafel')?.dataset.gruppe),
    tafelHatWz: !!(w.querySelector<HTMLElement>(':scope > .blatt-tafel')?.dataset.wz),
    tafelDisplay: w.querySelector(':scope > .blatt-tafel')
      ? getComputedStyle(w.querySelector<HTMLElement>(':scope > .blatt-tafel')!).display : '',
    teile,
    hoehe: Math.round(wb.height), breite: Math.round(wb.width),
    zeilen: new Set(teile.filter(t => t.h > 10).map(t => Math.round(t.y / 12) * 12)).size,
    bruchBreite: bruch ? Math.round(bruch.getBoundingClientRect().width) : -1,
    bruchDa: !!bruch,
    redoSticky: redo ? getComputedStyle(redo).position : '',
    /* NUR, WAS SELBST `data-wz` TRÄGT. Ein `querySelector` auf den NAMEN
       traf auch das Zubehör: die Formengruppe hat ein `data-act="formen"`,
       und „formen" kam dreimal vor. Gefunden, weil §2 „15 statt 13" sagte. */
    werkzeuge: [...w.querySelectorAll<HTMLElement>(':scope > [data-wz]')]
      .filter(sichtbar).map(k => String(k.dataset.wz)),
    /* DIE ZEILEN DER WERKZEUGE, an den Knöpfen selbst gemessen. Über die
       Namensliste zu gehen wäre falsch: die Formengruppe trägt ein
       `data-act="formen"`, und „formen" käme dreimal vor. */
    werkzeugZeilen: new Set([...w.querySelectorAll<HTMLElement>(':scope > [data-wz]')]
      .filter(sichtbar).map(k => Math.round(k.getBoundingClientRect().top))).size,
    /* WELCHE GRUPPEN SICHTBAR SIND. Das ist die schärfste einzelne Zahl
       dieses Laufs: der Gruppenkatalog aus E356 besteht aus 46 Kindwählern
       (`.blatt-werk[data-tool] > [data-gruppe="…"]`), und bleibt EINER von
       ihnen auf der alten Ebene, stehen auf einmal ALLE zwölf Gruppen da. */
    gruppen: [...new Set([...f.querySelectorAll<HTMLElement>(':scope > [data-gruppe]')]
      .filter(sichtbar).map(k => String(k.dataset.gruppe)))].sort()
  };
});

/* ═══ §1 Die Ebene ist da ══════════════════════════════════════════════════ */
console.log('\n§1 Die Ebene ist da — und sie ist nur eine Ebene');
const { ktx: k1, pg: p1 } = await kontext(1600);
let a = await aufnahme(p1);
/* UMGEHÄNGT MIT E618. Hier stand „als EINZIGES Kind". Das war die Form
   von W2, wo die Tafel nur eine Ebene ohne Kasten war. W4 braucht sie als
   Kasten — und ein Kasten um die Werkzeugreihe herum wäre keine Tafel,
   sondern die ganze Leiste. Also: Werkzeuge und Zeilenbruch in der
   Leiste, Zubehör in der Tafel. */
p('`.blatt-tafel` steht in `.blatt-werk`, neben den Werkzeugen',
  a.tafel && a.tafelKinderVonWerk > 1, `${a.tafelKinderVonWerk} Kinder`);
gleich('… und kein Werkzeug ist in ihr gelandet', a.werkzeugeInTafel, 0);
gleich('… und der Zeilenbruch auch nicht — er trennt die zwei Flächen',
  a.bruchInTafel, 0);
p('Sie erzeugt keinen Kasten (`display:contents`) — sonst bräche das Flex-Layout',
  a.tafelDisplay === 'contents', a.tafelDisplay);
p('Sie trägt KEIN `data-gruppe` — `closest` träfe sonst sie statt den Knopf',
  !a.tafelHatGruppe);
p('… und kein `data-wz`', !a.tafelHatWz);
p('Und alle Bedienteile liegen darin', a.teile.length > 20, String(a.teile.length));

/* ═══ §2 Nichts hat sich bewegt ════════════════════════════════════════════ */
console.log('\n§2 Kein Knoten verloren, keiner verschoben');
/* DIE ZAHLEN STAMMEN AUS DER FASSUNG OHNE TAFEL, an derselben Stelle
   gemessen (1600 × 950, Stift gewählt, Blatt mit blanko Papier). Sie
   stehen hier als Zahl und nicht als Formel: eine Zusicherung, die ihren
   Sollwert aus demselben DOM rechnet, das sie prüft, kann nicht rot werden
   (§55.2 — derselbe Fehler wie in E612 §5). */
/* VIERZEHN SEIT E670, NICHT DREIZEHN. „Text ändern" (`textfix`) kam am
   21. September dazu; `test480` wurde damals nachgezogen, dieser Lauf nicht —
   er stand eine Woche rot, und gefunden hat es der Nachbarlauf von E696. Die
   Zahl bleibt eine Zahl und keine Formel (siehe oben): wer ein Werkzeug
   hinzufügt, soll es hier merken. */
gleich('Vierzehn Werkzeuge, wie im Katalog', a.werkzeuge.length, 14);
gleich('Sie stehen alle auf EINER Höhe', a.werkzeugZeilen, 1);
/* BEIM STIFT GEHÖREN GENAU VIER GRUPPEN DAZU (E356, abgelesen aus dem
   Katalog in `bausteine.css`): Spielart, Formen, Farbe, Breite — und der
   Verlauf, der immer steht. Bleibt EIN Kindwähler des Katalogs auf der
   alten Ebene, stehen hier alle zwölf. */
gleich('Beim Stift steht nur SEIN Zubehör da (E356)', a.gruppen,
  ['breite', 'farbe', 'formen', 'lineal', 'stil', 'verlauf']);
p('Der erste Knopf sitzt am linken Rand der Leiste (Polster 8 px)',
  a.teile[0]!.x <= 10, `x=${a.teile[0]!.x}`);
p('Die Leiste bleibt bei höchstens drei Zeilen', a.hoehe < 140, `${a.hoehe} px`);
p('Kein Bedienteil steht ausserhalb der Leiste',
  a.teile.every(t => t.x >= 0 && t.x + t.w <= a.breite + 2),
  JSON.stringify(a.teile.filter(t => t.x < 0 || t.x + t.w > a.breite + 2).slice(0, 3)));

/* ═══ §3 Die drei Geschwister-Mechanismen ══════════════════════════════════ */
console.log('\n§3 Was nur zwischen Geschwistern wirkt, wirkt weiter');
p('Der Zeilenbruch ist da …', a.bruchDa);
p('… und nimmt die volle Breite (`flex:1 0 100%`, E359)',
  a.bruchBreite > a.breite * 0.8, `${a.bruchBreite} von ${a.breite} px`);
/* ZURÜCK/VOR KLEBEN NUR AM TELEFON. Am Rechner stehen sie seit E359 in
   einer eigenen Zeile; `position:sticky` steht in der Abfrage unter 760 px.
   Die Zusicherung dazu steht deshalb in §7 und nicht hier — sie hier zu
   stellen hiesse, am falschen Ort das Richtige zu verlangen. */
gleich('Am Rechner kleben Zurück/Vor NICHT — sie haben ihre eigene Zeile', a.redoSticky, 'relative');
/* UMGEHÄNGT MIT E618, NICHT WEGGELASSEN. Die Zusage ist dieselbe (E568:
   kein Trennstrich am Zeilenanfang), der Weg dahin ein anderer: bis E614
   war es ein Geschwisterwähler `.blatt-zeilenbruch + .blatt-trenn`. Seit
   E618 liegt der Zeilenbruch in der Leiste und das Zubehör in der Tafel —
   die beiden sind keine Geschwister mehr. Derselbe Satz heisst jetzt:
   der ERSTE Trenner in der Tafel steht am Zeilenanfang. */
const trenner = await p1.evaluate(() => {
  const f = document.querySelector<HTMLElement>('.blatt-werk > .blatt-tafel')!;
  const erstes = f.firstElementChild as HTMLElement | null;
  return {
    erstesIstTrenner: !!erstes?.classList.contains('blatt-trenn'),
    erstesSichtbar: erstes ? erstes.getClientRects().length > 0 : false,
    name: erstes?.className || ''
  };
});
p('Der erste Trenner der Tafel ist weg — kein Strich am Zeilenanfang (E568)',
  !trenner.erstesIstTrenner || !trenner.erstesSichtbar, JSON.stringify(trenner));

/* ═══ §4 Die eigene Ordnung kommt an ═══════════════════════════════════════ */
console.log('\n§4 Die Nutzerordnung geht durch die Tafel (E570/E571)');
const vorher = a.werkzeuge.join(',');
await p1.evaluate(() => {
  /* Die Werkzeuge liegen seit E618 in der LEISTE, nicht in der Tafel. */
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const wz = [...w.querySelectorAll<HTMLElement>(':scope > [data-wz]')];
  w.insertBefore(wz[wz.length - 1]!, wz[0]!);
});
await p1.waitForTimeout(200);
let b2 = await aufnahme(p1);
p('Eine Bewegung in der Werkzeugreihe kommt an', b2.werkzeuge.join(',') !== vorher,
  `${vorher} → ${b2.werkzeuge.join(',')}`);
p('… und keines ist dabei verlorengegangen', b2.werkzeuge.length === 14,
  String(b2.werkzeuge.length));
/* DAS IST DER LEISESTE AUSFALL DES BOGENS: `ordnungAnwenden` steigt bei
   `if (!bruch) return` stumm aus, wenn es den Zeilenbruch nicht findet.
   Ein Neubau der Seite stellt die gemerkte Ordnung wieder her — wenn er es
   nicht tut, ist die Funktion ausgestiegen. */
await p1.evaluate(async () => { App.zeichneSeite(); await new Promise(f => setTimeout(f, 700)); });
await p1.click('.blatt-werk [data-wz="stift"]');
await p1.waitForTimeout(260);
const nachNeubau = await aufnahme(p1);
p('`ordnungAnwenden` läuft durch — nach dem Neubau stehen vierzehn Werkzeuge da',
  nachNeubau.werkzeuge.length === 14 && nachNeubau.tafel,
  JSON.stringify(nachNeubau.werkzeuge));

/* ═══ §5 Das Wort steht unter dem Zeichen (W3) ═════════════════════════════ */
console.log('\n§5 Das Wort steht UNTER dem Zeichen, nicht daneben');
const w3 = await p1.evaluate(() => {
  const knoepfe = [...document.querySelectorAll<HTMLElement>('.blatt-werk > button[data-wz]')];
  const mass = knoepfe.map(k => {
    const z = k.querySelector<HTMLElement>('.zeichen');
    const wo = k.querySelector<HTMLElement>('.wort');
    if (!z || !wo) return null;
    const rz = z.getBoundingClientRect(), rw = wo.getBoundingClientRect();
    return {
      name: String(k.dataset.wz),
      wortSichtbar: rw.width > 1 && rw.height > 1,
      darunter: rw.top >= rz.bottom - 1,
      mittig: Math.abs((rw.x + rw.width / 2) - (rz.x + rz.width / 2)) < 6,
      richtung: getComputedStyle(k).flexDirection
    };
  }).filter(Boolean) as Array<{ name: string; wortSichtbar: boolean; darunter: boolean; mittig: boolean; richtung: string }>;
  return { mass, anzahl: mass.length };
});
gleich('Vierzehn Werkzeuge tragen Zeichen und Wort', w3.anzahl, 14);
p('Jedes Wort ist sichtbar', w3.mass.every(m => m.wortSichtbar),
  w3.mass.filter(m => !m.wortSichtbar).map(m => m.name).join(', '));
p('Jedes Wort steht UNTER seinem Zeichen — gemessen, nicht gezählt',
  w3.mass.every(m => m.darunter), w3.mass.filter(m => !m.darunter).map(m => m.name).join(', '));
p('… und mittig darunter, nicht am Rand',
  w3.mass.every(m => m.mittig), w3.mass.filter(m => !m.mittig).map(m => m.name).join(', '));
p('Der Knopf stapelt (`flex-direction:column`)',
  w3.mass.every(m => m.richtung === 'column'),
  [...new Set(w3.mass.map(m => m.richtung))].join(', '));

/* ═══ §5b Die Stiftkacheln tragen ihren Namen (E617, W4) ═══════════════════
   Redurs Bild 2: „fünf benannte Stiftkacheln". Bis E617 stand an dieser
   Stelle `display:none` — der Name war weg, auch aus dem Vorlesebaum.

   DREI SCHWELLEN, NICHT EINE. Die Werkzeuge zeigen ihr Wort ab 820 px
   Leistenbreite (W3), das übrige Zubehör ab 1150 (E359), die Stifte erst
   ab 1300 — weil ihre Namen lang sind („Kugelschreiber" macht die Kachel
   77 px breit statt 32) und weil bei 1150 alle anderen Wörter zugleich
   aufgehen. Gemessen: bei 1180 px Leiste kippte das Zubehör in eine
   vierte Zeile und die Leiste auf 127 px; ab 1280 blieb sie bei 91. */
console.log('\n§5b Die Stiftkacheln tragen ihren Namen — ab 1300 px');
{
  const { ktx, pg } = await kontext(1900);
  const weit = await pg.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.blatt-werk')!;
    const f = w.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? w;
    const sicht = (e: Element) => (e as HTMLElement).getClientRects().length > 0;
    const stifte = [...f.querySelectorAll<HTMLElement>('[data-act="stilwahl"]')].filter(sicht);
    return {
      leiste: Math.round(w.getBoundingClientRect().width),
      hoehe: Math.round(w.getBoundingClientRect().height),
      zahl: stifte.length,
      namen: stifte.map(k => (k.querySelector('.wort')?.textContent || '').trim()),
      sichtbar: stifte.filter(k => {
        const x = k.querySelector('.wort');
        return !!x && x.getBoundingClientRect().width > 1;
      }).length,
      /* KEIN `display:none` MEHR (§38): geklemmt heisst, ein Vorleser
         liest den Namen weiterhin. Das ist der halbe Bogen. */
      keinesVersteckt: stifte.every(k => {
        const x = k.querySelector('.wort');
        return !!x && getComputedStyle(x as Element).display !== 'none';
      }),
      darunter: stifte.every(k => {
        const z = k.querySelector('.zeichen')?.getBoundingClientRect();
        const o = k.querySelector('.wort')?.getBoundingClientRect();
        return !!z && !!o && o.top >= z.bottom - 1;
      })
    };
  });
  p('Die Leiste ist breit genug (über 1300 px)', weit.leiste > 1300, `${weit.leiste} px`);
  gleich('Sechs Stifte', weit.zahl, 6);
  gleich('… und alle sechs zeigen ihren Namen', weit.sichtbar, 6);
  p('… und zwar diese', weit.namen.join(', ') ===
    'Füller, Kugelschreiber, Pinsel, Bleistift, Schutzleiter, Leiter', weit.namen.join(', '));
  p('Jeder Name steht UNTER seinem Zeichen', weit.darunter);
  p('Kein Name ist per `display:none` weg — ein Vorleser bekommt ihn (§38)',
    weit.keinesVersteckt);
  p('Und die Leiste bleibt bei drei Zeilen', weit.hoehe < 140, `${weit.hoehe} px`);
  await ktx.close();
}

/* ═══ §5c Unter der Schwelle kostet es NICHTS (E617) ═══════════════════════
   Der Gegenfall, und der eigentliche Grund für die dritte Schwelle: bei
   1180 px Leiste dürfen die Namen NICHT stehen, sonst wächst die Leiste
   von 91 auf 127 px. Eine Schwelle ohne diese Zusicherung wäre geraten. */
console.log('\n§5c Unter 1300 px stehen die Namen nicht — und die Leiste wächst nicht');
{
  const { ktx, pg } = await kontext(1600);
  const eng = await pg.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.blatt-werk')!;
    const f = w.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? w;
    const sicht = (e: Element) => (e as HTMLElement).getClientRects().length > 0;
    const stifte = [...f.querySelectorAll<HTMLElement>('[data-act="stilwahl"]')].filter(sicht);
    return {
      leiste: Math.round(w.getBoundingClientRect().width),
      hoehe: Math.round(w.getBoundingClientRect().height),
      sichtbar: stifte.filter(k => {
        const x = k.querySelector('.wort');
        return !!x && x.getBoundingClientRect().width > 1;
      }).length,
      imBaum: stifte.every(k => {
        const x = k.querySelector('.wort');
        return !!x && getComputedStyle(x as Element).display !== 'none';
      })
    };
  });
  p('Die Leiste liegt unter 1300 px', eng.leiste < 1300, `${eng.leiste} px`);
  gleich('… und kein Stiftname ist zu sehen', eng.sichtbar, 0);
  p('… aber jeder steht noch im Vorlesebaum (geklemmt, nicht entfernt)', eng.imBaum);
  gleich('… und die Leiste ist so hoch wie vorher', eng.hoehe, 91);
  await ktx.close();
}

/* ═══ §5d Ab 1300 px ist die Tafel ein KASTEN (E618, W4) ═══════════════════
   Redurs Bilder 2 bis 6: unter der Werkzeugreihe ein Feld mit dem Zubehör.
   Das ist der Zweck, für den E614 die Ebene eingezogen hat — und der Grund,
   warum E618 die Werkzeuge wieder aus ihr herausgeholt hat: ein Kasten um
   die Werkzeugreihe herum wäre keine Tafel, sondern die ganze Leiste.

   UND ER IST DER GRUND FÜR `display:contents` (E614). Unter der Schwelle
   — Telefon, Spalte, Studio-Dock — bleibt die Tafel kastenlos, weil die
   Reihenfolge dort aus `order` über Werkzeuge UND Zubehör hinweg kommt
   (E356). Ein Kasten dazwischen bräche das. §5e prüft genau diesen Fall. */
console.log('\n§5d Ab 1300 px ist die Tafel ein Kasten');
{
  const { ktx, pg } = await kontext(1900);
  const kasten = await pg.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.blatt-werk')!;
    const t = w.querySelector<HTMLElement>(':scope > .blatt-tafel')!;
    const st = getComputedStyle(t);
    const tr = t.getBoundingClientRect(), wr = w.getBoundingClientRect();
    const striche = [...t.querySelectorAll<HTMLElement>(':scope > .blatt-strich')];
    return {
      leiste: Math.round(wr.width),
      anzeige: st.display,
      eigeneBreite: Math.round(tr.width),
      grund: st.backgroundColor,
      rand: st.borderTopWidth,
      /* Er nimmt eine eigene Zeile — sonst stünde er neben den Werkzeugen. */
      unterhalb: tr.top >= wr.top + 20,
      /* ZWEI ZEILEN SEIT E623: Name über Millimeter. `textContent` klebt sie
         ohne Trenner zusammen („Fein0,4 mm"), also werden sie einzeln
         gelesen — und gleich mit ihren Kästen, damit „untereinander" eine
         Messung bleibt und keine Behauptung. */
      mm: striche.map(k => (k.querySelector('.strich-mm')?.textContent || '').trim()),
      namen: striche.map(k => (k.querySelector('.strich-name')?.textContent || '').trim()),
      gestapelt: striche.every(k => {
        const n = k.querySelector('.strich-name')?.getBoundingClientRect();
        const m = k.querySelector('.strich-mm')?.getBoundingClientRect();
        return !!n && !!m && m.top >= n.bottom - 1;
      }),
      mmSichtbar: striche.filter(k => {
        const x = k.querySelector('.wort');
        return !!x && x.getBoundingClientRect().width > 1;
      }).length,
      /* Keine Zahl darf über ihre Kachel hinauslaufen — auf dem ersten Bild
         stand „0,4 mm0,8 mm", und eine überlappte Zahl ist eine falsche. */
      passtRein: striche.every(k => {
        const b = k.getBoundingClientRect();
        const x = k.querySelector('.wort')?.getBoundingClientRect();
        return !!x && x.left >= b.left - 1 && x.right <= b.right + 1;
      })
    };
  });
  p('Die Leiste ist breit genug', kasten.leiste > 1300, `${kasten.leiste} px`);
  gleich('Die Tafel ist ein Kasten, kein `display:contents`', kasten.anzeige, 'flex');
  p('… mit eigenem Grund und Rand', kasten.grund !== 'rgba(0, 0, 0, 0)' &&
    parseFloat(kasten.rand) > 0, `${kasten.grund}, ${kasten.rand}`);
  p('… und er steht UNTER der Werkzeugreihe', kasten.unterhalb);
  p('… und nimmt die ganze Breite', kasten.eigeneBreite > kasten.leiste * 0.9,
    `${kasten.eigeneBreite} von ${kasten.leiste} px`);
  gleich('Die drei Strichstärken zeigen ihre Millimeter',
    kasten.mm, ['0,4 mm', '0,8 mm', '1,8 mm']);
  /* SEIT E623 STEHT DER NAME DANEBEN — genauer: darüber. Bis dahin trug
     die Kachel nur die Zahl, und der Name stand im Titel; W4 wollte
     beides auf EINER Kachel. Nebeneinander riss das die Höhendecke
     (143 statt 128 px), untereinander nicht. */
  gleich('… und dazu ihren Namen, auf derselben Kachel',
    kasten.namen, ['Fein', 'Mittel', 'Markant']);
  p('… der Name steht ÜBER der Zahl, nicht daneben', kasten.gestapelt);
  gleich('… und alle drei sind zu sehen', kasten.mmSichtbar, 3);
  p('… und keine Zahl läuft über ihre Kachel hinaus', kasten.passtRein);
  await ktx.close();
}

/* ═══ §5e Unter der Schwelle bleibt die Tafel kastenlos (E618) ═════════════
   Der Gegenfall, und der Kern der ganzen Bauweise: `display:contents` ist
   kein Notbehelf, sondern die Bedingung dafür, dass Umbruch, `order` und
   das Kleben von Zurück/Vor über die Tafelgrenze hinweg weiterwirken. */
console.log('\n§5e Unter 1300 px bleibt die Tafel kastenlos');
{
  const { ktx, pg } = await kontext(1600);
  const eng = await pg.evaluate(() => {
    const w = document.querySelector<HTMLElement>('.blatt-werk')!;
    const t = w.querySelector<HTMLElement>(':scope > .blatt-tafel')!;
    const striche = [...t.querySelectorAll<HTMLElement>(':scope > .blatt-strich')];
    return {
      leiste: Math.round(w.getBoundingClientRect().width),
      anzeige: getComputedStyle(t).display,
      mmSichtbar: striche.filter(k => {
        const x = k.querySelector('.wort');
        return !!x && x.getBoundingClientRect().width > 1;
      }).length,
      /* Geklemmt, nicht entfernt — die Zahl bleibt im Vorlesebaum (§38). */
      imBaum: striche.every(k => {
        const x = k.querySelector('.wort');
        return !!x && getComputedStyle(x as Element).display !== 'none'
          && (x.textContent || '').includes('mm');
      })
    };
  });
  p('Die Leiste liegt unter 1300 px', eng.leiste < 1300, `${eng.leiste} px`);
  gleich('Die Tafel erzeugt dort keinen Kasten', eng.anzeige, 'contents');
  gleich('… und keine Millimeterzahl ist zu sehen', eng.mmSichtbar, 0);
  p('… aber jede steht im Vorlesebaum (geklemmt, nicht entfernt)', eng.imBaum);
  await ktx.close();
}

/* ═══ §6 §37 ═══════════════════════════════════════════════════════════════ */
console.log('\n§6 §37: der Hauptweg misst 44 px');
/* DIE TREFFFLÄCHE IST NICHT DER KASTEN (§37, E406). Die 44 px kommen aus
   `::after` und nicht aus der Höhe des Knopfes — „sie wächst nur nach oben
   und unten, waagerecht stehen die Nachbarn". Wer hier
   `getBoundingClientRect()` misst, misst das Falsche und meldet dreizehn
   Fehler, wo keiner ist. Gemessen wird deshalb das Pseudoelement. */
const klein = await p1.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk > button[data-wz]')]
    .filter(k => k.getClientRects().length > 0)
    .map(k => {
      const r = k.getBoundingClientRect();
      const nach = parseFloat(getComputedStyle(k, '::after').height) || 0;
      return [String(k.dataset.wz), Math.round(r.width), Math.round(Math.max(r.height, nach))];
    })
    .filter(m => (m[2] as number) < 44));
p('Keine Trefffläche unter 44 px — auch nicht mit dem Wort darunter',
  klein.length === 0, JSON.stringify(klein));
await k1.close();

/* ═══ §7 Am Telefon bleibt alles, wie es war ═══════════════════════════════ */
console.log('\n§7 Am Telefon ändert W3 nichts (E356: eine rollende Zeile)');
const { ktx: k2, pg: p2 } = await kontext(390, true);
const handy = await aufnahme(p2);
p('Die Leiste ist eine Zeile', handy.hoehe < 70, `${handy.hoehe} px`);
p('Die Tafel steht auch dort', handy.tafel);
const handyWort = await p2.evaluate(() =>
  [...document.querySelectorAll<HTMLElement>('.blatt-werk > button[data-wz] .wort')]
    .filter(w => w.getBoundingClientRect().width > 1).length);
gleich('… und kein Wort ist sichtbar (es bleibt im Vorlesebaum, Audit F04)', handyWort, 0);
/* HIER gehört die Klebezusage hin: im waagerechten Roller bleiben Zurück
   und Vor am rechten Rand stehen (E359). Sie hängen an
   `.blatt-werk > .blatt-tafel > [data-act="redo"]` — also genau an einem
   der 51 umgehängten Kindwähler. Zeigt einer ins Leere, steht es hier. */
gleich('Zurück/Vor kleben am Rand (`position:sticky`, E359)', handy.redoSticky, 'sticky');
await k2.close();

console.log('\n§8 Keine Seitenfehler');
p('Die Seite meldet keinen Fehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

console.log(`\nSuite 533: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
