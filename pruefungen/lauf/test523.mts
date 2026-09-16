/* Suite 523 — Die Leiste selbst ordnen (E570)
 * ============================================================================
 * Redur, 14. September 2026: „Könntest du so machen, dass ich alles, was dort
 * ist im Redion, direkt selber ordnen kann? Geht das so was?"
 *
 * ─── WAS GESPEICHERT WIRD, IST EINE REIHENFOLGE — KEIN KATALOG ──────────────
 * Das ist der Kern dieser Suite und der Grund, warum sie mehr prüft als
 * „hoch schiebt nach oben". Was es GIBT, steht weiter in `WERKZEUGE` und
 * `GRUPPEN`; in `meta` liegt nur, in welcher Folge. Beim Lesen wird deshalb
 * abgeglichen, und zwar in beide Richtungen:
 *
 *   · eine Kennung, die der Katalog nicht kennt, fällt weg
 *     → sonst risse eine alte Sicherung eine leere Stelle in die Leiste
 *   · eine Kennung, die der Katalog kennt und die Liste nicht, kommt HINTEN
 *     dazu → sonst bliebe ein neu eingebautes Werkzeug unsichtbar, bis
 *       jemand zurücksetzt, und niemand wüsste, warum
 *
 * §5 misst beides mit einer von Hand geschriebenen Liste. Das ist der Punkt,
 * an dem diese Suite Datenverlust verhindert und nicht Gestaltung prüft (§9).
 *
 * ─── UND DIE DOM-FOLGE IST DIE SICHTBARE FOLGE ──────────────────────────────
 * Am Rechner werden die Knoten wirklich umgehängt, nicht nur mit `order`
 * verschoben: ein Vorleseprogramm und die Tabulatortaste gehen in
 * Dokumentreihenfolge (§38). §7 misst das. Am Telefon weicht es ab — dort
 * schiebt `order` die Gruppen hinter das gewählte Werkzeug —, und das ist
 * seit E356 mit geschriebenem Grund entschieden.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
   Alle vier GEFAHREN, nicht behauptet:
 *
 *     G1  `ordnungAnwenden` beim Bauen weglassen      22 grün,  4 rot
 *     G2  den Abgleich weglassen (Liste roh nehmen)   11 grün, 15 rot
 *     G3  die Pfeile auf 32 px setzen                 25 grün,  1 rot
 *     G4  nur die Zahlen setzen, nicht umhängen       17 grün,  9 rot
 *     G5  den Klickabfänger weglassen                  39 grün,  1 rot
 *     G6  den Zug im Band weglassen                    37 grün,  3 rot
 *     G7  die Pfeiltasten im Modus weglassen           39 grün,  1 rot
 *     G8  das Band nicht zeigen                        24 grün, 16 rot
 *
 *   G2 ist die lauteste, und das ist richtig so: ohne Abgleich trägt die
 *   Leiste, was in `meta` steht — auch eine erfundene Kennung, auch eine
 *   Dublette, und die elf Werkzeuge, die in der gemerkten Liste fehlen,
 *   fehlen dann auch in der Leiste. Fünfzehn Zusagen fallen gleichzeitig,
 *   weil ab da nichts mehr stimmt.
 *
 * §9 misst den Modus aus E571: im Band selbst schieben, mit der Maus und
 * mit den Pfeiltasten — und dass dabei nichts gezeichnet wird.
 *
 *   node pruefungen/lauf/test523.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
declare const App: any;
declare const Store: any;
declare const Marken: any;
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9633;
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    'ist ' + JSON.stringify(ist) + ', soll ' + JSON.stringify(soll));

const browser = await chromium.launch();
const fehler: string[] = [];

const aufbauen = async (breite: number): Promise<Page> => {
  const ktx = await browser.newContext({ viewport: { width: breite, height: 940 } });
  const pg = await ktx.newPage();
  pg.on('pageerror', e => fehler.push(e.message));
  await pg.goto(`http://localhost:${PORT}/index.html`);
  await pg.waitForFunction('typeof Store !== "undefined" && typeof App !== "undefined"');
  for (let v = 0; v < 8; v++) {
    await pg.evaluate(() => {
      document.querySelectorAll<HTMLElement>('#rg-willkommen [data-a="los"]').forEach(b => b.click());
    });
    await pg.waitForTimeout(200);
    if (!await pg.evaluate(() => !!document.querySelector('#rg-willkommen'))) break;
  }
  const id = await pg.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    const s = Store.addPage(null, { text: 'Ordnung' });
    Store.addBlock(s.id, 'blatt', {
      text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: []
    });
    await Store.flush();
    App.oeffne(s.id);
    return s.id;
  });
  await pg.waitForTimeout(900);
  await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click());
  await pg.waitForTimeout(350);
  (pg as any).__seite = id;
  return pg;
};

/** Die Folge der Werkzeuge und Gruppen, wie sie im DOM stehen. */
const domFolge = (pg: Page) => pg.evaluate(() => {
  /* UMGEHÄNGT AUF DIE TAFEL (E614, W2). Die Kinder liegen seit W2 in
     `.blatt-tafel`; `:scope >` an der Leiste fände gar nichts mehr — und
     weil die Tafel `display:contents` trägt, sähe der Bildschirm dabei
     unverändert aus. Der Rückfall auf die Leiste ist Absicht. */
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const f = w.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? w;
  return {
    werkzeuge: [...f.querySelectorAll<HTMLElement>(':scope > [data-wz]')].map(k => String(k.dataset.wz)),
    gruppen: [...new Set([...f.querySelectorAll<HTMLElement>(':scope > [data-gruppe]')]
      .map(k => String(k.dataset.gruppe)))],
    platz: w.style.getPropertyValue('--platz')
  };
});

/* ZWEI TIPPE STATT EINEM (E571). „Einrichten" schaltet seit E571 den Modus
   im Band ein; die Liste steht darin als „Als Liste". Der Weg dorthin ist
   damit einen Tipp länger, und diese Suite geht ihn wie ein Mensch. */
const feldAuf = async (pg: Page): Promise<void> => {
  await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-act="einrichten"]')?.click());
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-ordnen-band [data-ob="liste"]')?.click());
  await pg.waitForTimeout(350);
};
const feldZu = async (pg: Page): Promise<void> => {
  await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-ordnen-fertig')?.click());
  await pg.waitForTimeout(200);
  await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-ordnen-band [data-ob="fertig"]')?.click());
  await pg.waitForTimeout(250);
};

/* ======================================================================== */
console.log('\n1 · Der Knopf steht in der Leiste und öffnet das Feld');
const pg = await aufbauen(1280);
const knopf = await pg.evaluate(() => {
  const k = document.querySelector<HTMLElement>('.blatt-werk [data-act="einrichten"]');
  if (!k) return null;
  const r = k.getBoundingClientRect();
  return { gruppe: k.dataset.gruppe, sichtbar: r.width > 0 && r.height > 0,
           titel: k.getAttribute('title') || '', wort: k.querySelector('.wort')?.textContent || '' };
});
p('Der Knopf «Einrichten» ist da, sichtbar und in der Verlaufsgruppe',
  !!knopf && knopf.sichtbar && knopf.gruppe === 'verlauf', JSON.stringify(knopf));
p('… und er sagt, was er tut', /Reihenfolge/.test(String(knopf?.titel)), String(knopf?.titel));
await feldAuf(pg);
const feld = await pg.evaluate(() => {
  const f = document.querySelector('.blatt-ordnen-feld');
  if (!f) return null;
  const pfeile = [...f.querySelectorAll<HTMLElement>('.blatt-ordnen-pfeil')];
  return {
    bloecke: f.querySelectorAll('.blatt-ordnen-block').length,
    werkzeuge: f.querySelectorAll('.blatt-ordnen-zeile[data-art="werkzeuge"]').length,
    gruppen: f.querySelectorAll('.blatt-ordnen-zeile[data-art="gruppen"]').length,
    kleinsterPfeil: Math.min(...pfeile.map(k => Math.round(k.getBoundingClientRect().height))),
    schmalsterPfeil: Math.min(...pfeile.map(k => Math.round(k.getBoundingClientRect().width))),
    ohneNamen: pfeile.filter(k => !(k.getAttribute('aria-label') || '').trim()).length,
    erstesHochAus: (f.querySelector('.blatt-ordnen-zeile[data-art="werkzeuge"] [data-ruecken="hoch"]') as HTMLButtonElement)?.disabled,
    letztesRunterAus: (() => {
      const z = [...f.querySelectorAll('.blatt-ordnen-zeile[data-art="werkzeuge"]')];
      return (z[z.length - 1]?.querySelector('[data-ruecken="runter"]') as HTMLButtonElement)?.disabled;
    })()
  };
});
gleich('Zwei Blöcke: dreizehn Werkzeuge, zwölf Gruppen',
  [feld?.bloecke, feld?.werkzeuge, feld?.gruppen], [2, 13, 12]);

/* ======================================================================== */
console.log('\n2 · §37 und §38: jeder Pfeil ist ein Fingerziel und hat einen Namen');
p('Kein Pfeil unter 44 × 44', (feld?.kleinsterPfeil ?? 0) >= 44 && (feld?.schmalsterPfeil ?? 0) >= 44,
  JSON.stringify([feld?.schmalsterPfeil, feld?.kleinsterPfeil]));
gleich('Jeder Pfeil sagt seinen Namen', feld?.ohneNamen, 0);
/* KEIN KNOPF, DER NICHTS TUT. Am Anfang der Liste gibt es kein „weiter
   hoch" — er ist abgeschaltet und nicht still wirkungslos. */
gleich('Erstes «hoch» und letztes «runter» sind abgeschaltet',
  [feld?.erstesHochAus, feld?.letztesRunterAus], [true, true]);

/* ======================================================================== */
console.log('\n3 · Ein Tipp rückt — in der Liste UND in der Leiste');
const vorher = await domFolge(pg);
/* Das dritte Werkzeug («Stift») zweimal nach vorn: es muss das erste werden. */
for (let i = 0; i < 2; i++) {
  await pg.evaluate(() => {
    const z = [...document.querySelectorAll('.blatt-ordnen-zeile[data-art="werkzeuge"]')]
      .find(n => (n as HTMLElement).dataset.id === 'stift') as HTMLElement | undefined;
    z?.querySelector<HTMLElement>('[data-ruecken="hoch"]')?.click();
  });
  await pg.waitForTimeout(160);
}
const nachher = await domFolge(pg);
gleich('«Stift» steht jetzt vorn', nachher.werkzeuge[0], 'stift');
gleich('… und es sind immer noch dreizehn', nachher.werkzeuge.length, vorher.werkzeuge.length);
gleich('… keines ist verlorengegangen',
  [...nachher.werkzeuge].sort(), [...vorher.werkzeuge].sort());
/* Dasselbe für eine Gruppe: die Farben ganz nach vorn. */
for (let i = 0; i < 12; i++) {
  await pg.evaluate(() => {
    const z = [...document.querySelectorAll('.blatt-ordnen-zeile[data-art="gruppen"]')]
      .find(n => (n as HTMLElement).dataset.id === 'farbe') as HTMLElement | undefined;
    const k = z?.querySelector('[data-ruecken="hoch"]') as HTMLButtonElement | undefined;
    if (k && !k.disabled) k.click();
  });
  await pg.waitForTimeout(120);
}
gleich('«Farben» stehen jetzt als erste Gruppe', (await domFolge(pg)).gruppen[0], 'farbe');

/* ======================================================================== */
console.log('\n4 · Die Ordnung überlebt den Neubau der Seite');
await feldZu(pg);
await pg.evaluate(async () => { App.zeichneSeite(); await new Promise(r => setTimeout(r, 600)); });
await pg.waitForTimeout(500);
await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click());
await pg.waitForTimeout(250);
const nachNeubau = await domFolge(pg);
gleich('Nach `zeichneSeite` steht «Stift» immer noch vorn', nachNeubau.werkzeuge[0], 'stift');
gleich('… und «Farben» immer noch als erste Gruppe', nachNeubau.gruppen[0], 'farbe');
const gemerkt = await pg.evaluate(() => Store.getMeta('zeichnen:ordnung'));
p('Sie liegt in `meta` und reist damit in der Sicherung mit (§9)',
  !!gemerkt && Array.isArray((gemerkt as any).werkzeuge) && (gemerkt as any).werkzeuge[0] === 'stift',
  JSON.stringify(gemerkt));

/* ======================================================================== */
console.log('\n5 · Der Abgleich: Unbekanntes fällt weg, Fehlendes kommt dazu');
/* DER PUNKT, AN DEM DIESE SUITE DATENVERLUST VERHINDERT (§9). Eine
   Sicherung aus einer anderen Fassung kann Kennungen tragen, die es nicht
   mehr gibt — und ihr können welche fehlen, die es inzwischen gibt. */
await pg.evaluate(async () => {
  Store.setMeta('zeichnen:ordnung', {
    werkzeuge: ['laser', 'gibtesnicht', 'stift', 'stift'],
    gruppen: ['breite', 'auchnicht']
  });
  await Store.flush();
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 600));
});
await pg.waitForTimeout(500);
await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.click());
await pg.waitForTimeout(250);
const abgleich = await domFolge(pg);
const katalog = await pg.evaluate(() => ({
  werkzeuge: Marken.WERKZEUGE.map((w: any) => w.id)
}));
gleich('Die zwei gemerkten stehen vorn, in ihrer Folge',
  abgleich.werkzeuge.slice(0, 2), ['laser', 'stift']);
gleich('… die erfundene Kennung ist weg und die Dublette auch',
  abgleich.werkzeuge.length, katalog.werkzeuge.length);
gleich('… und ALLE Werkzeuge sind da — keines fehlt',
  [...abgleich.werkzeuge].sort(), [...katalog.werkzeuge].sort());
gleich('Bei den Gruppen dasselbe: die gemerkte vorn, der Rest dahinter',
  [abgleich.gruppen[0], abgleich.gruppen.length], ['breite', 12]);

/* ======================================================================== */
console.log('\n6 · Zurücksetzen holt die ursprüngliche Ordnung');
await feldAuf(pg);
await pg.evaluate(() => document.querySelector<HTMLElement>('.blatt-ordnen-zurueck')?.click());
await pg.waitForTimeout(350);
const zurueck = await domFolge(pg);
gleich('Die Werkzeuge stehen wieder wie im Katalog', zurueck.werkzeuge, katalog.werkzeuge);
/* DIE VORGABE BEGINNT MIT DER SPIELART DES WERKZEUGS — beim Stift also mit
   der Stiftreihe. Das ist Redurs Satz aus E512 („die Stiftreihe … neben es,
   wo die Farben dort sind") und die Reihenfolge, die `test348` seit E356
   hält. */
gleich('Und die Gruppen beginnen wieder mit der Spielart', zurueck.gruppen[0], 'stil');
/* E568: der Verlauf steht am Ende — das ist jetzt der letzte Katalogeintrag
   und keine Zeile im Stilblatt mehr. */
gleich('… und enden mit dem Verlauf (E568, jetzt als Katalog)',
  zurueck.gruppen[zurueck.gruppen.length - 1], 'verlauf');
await feldZu(pg);

/* ======================================================================== */
console.log('\n7 · Am Rechner ist die DOM-Folge die sichtbare Folge (§38)');
await feldAuf(pg);
for (let i = 0; i < 4; i++) {
  await pg.evaluate(() => {
    const z = [...document.querySelectorAll('.blatt-ordnen-zeile[data-art="werkzeuge"]')]
      .find(n => (n as HTMLElement).dataset.id === 'text') as HTMLElement | undefined;
    const k = z?.querySelector('[data-ruecken="hoch"]') as HTMLButtonElement | undefined;
    if (k && !k.disabled) k.click();
  });
  await pg.waitForTimeout(120);
}
await feldZu(pg);
const folge = await pg.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const f = w.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? w;   /* E614 */
  const knoepfe = [...f.querySelectorAll<HTMLElement>(':scope > [data-wz]')];
  return {
    dom: knoepfe.map(k => String(k.dataset.wz)),
    nachX: [...knoepfe].sort((a, b) =>
      a.getBoundingClientRect().left - b.getBoundingClientRect().left).map(k => String(k.dataset.wz))
  };
});
gleich('Was links steht, steht auch im DOM zuerst', folge.dom, folge.nachX);
await pg.context().close();

/* ======================================================================== */
console.log('\n8 · Am Telefon folgt `--platz` dem neuen Ort des Werkzeugs');
/* Dort schiebt `order` die Gruppen hinter das gewählte Werkzeug (E356).
   Die Zahl dafür kam bis E570 aus dreissig festen Zeilen im Stilblatt; sie
   muss jetzt der gemerkten Ordnung folgen, sonst landet das Zubehör wieder
   am Anfang der Leiste. */
const handy = await aufbauen(390);
const platzVorher = (await domFolge(handy)).platz;
await feldAuf(handy);
for (let i = 0; i < 2; i++) {
  await handy.evaluate(() => {
    const z = [...document.querySelectorAll('.blatt-ordnen-zeile[data-art="werkzeuge"]')]
      .find(n => (n as HTMLElement).dataset.id === 'stift') as HTMLElement | undefined;
    const k = z?.querySelector('[data-ruecken="hoch"]') as HTMLButtonElement | undefined;
    if (k && !k.disabled) k.click();
  });
  await handy.waitForTimeout(140);
}
await feldZu(handy);
const nachher8 = await domFolge(handy);
gleich('«Stift» steht vorn', nachher8.werkzeuge[0], 'stift');
/* NICHT GEGEN EINE ZAHL, SONDERN GEGEN DEN NACHBARN. Hier stand `'10'` —
   die Schrittweite der Werkzeuge —, und als sie von zehn auf hundert ging
   (weil zwölf Gruppen nicht in einen Zehnerschritt passen), war diese
   Zusage rot, ohne dass etwas kaputt war. Was sie WIRKLICH sagt: `--platz`
   zeigt auf das geführte Werkzeug. Also wird gegen dessen eigene Zahl
   gemessen, und die Schrittweite darf sich ändern. */
gleich('… und `--platz` zeigt auf den neuen Ort des Stifts',
  nachher8.platz.trim(),
  (await handy.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')
    ?.style.getPropertyValue('--ordnung') || '')).trim());
p('… vorher war es ein anderer', platzVorher.trim() !== nachher8.platz.trim(),
  JSON.stringify([platzVorher, nachher8.platz]));
const handyMasse = await handy.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk')!;
  const f = w.querySelector<HTMLElement>(':scope > .blatt-tafel') ?? w;   /* E614 */
  return [...f.querySelectorAll<HTMLElement>(':scope > button')]
    .filter(k => k.getClientRects().length > 0)
    .map(k => { const r = k.getBoundingClientRect(); return [String(k.dataset.wz || k.dataset.act || k.className), Math.round(r.width), Math.round(r.height)]; })
    .filter(m => (m[1] as number) < 44 || (m[2] as number) < 44);
});
gleich('Und §37 gilt weiter: nichts unter 44 px', handyMasse, []);
await handy.context().close();

/* ======================================================================== */
console.log('\n9 · Im Band selbst schieben (E571)');
/* Redur, 14. September: „kannst du so machen, dass ich direkt im Website
   ordnen kann — die Position mit der Maus schieben." Die Liste aus E570
   bleibt als Weg für die Tastatur und für das Zubehör, das gerade nicht
   zu sehen ist; hier wird an Ort und Stelle gezogen. */
const pg9 = await aufbauen(1280);
const vorher9 = await domFolge(pg9);
await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-act="einrichten"]')?.click());
await pg9.waitForTimeout(350);
const modus = await pg9.evaluate(() => {
  const w = document.querySelector<HTMLElement>('.blatt-werk');
  const b = document.querySelector<HTMLElement>('.blatt-ordnen-band');
  const r = b?.getBoundingClientRect();
  return {
    an: w?.dataset.ordnen || '',
    feldAuf: !!document.querySelector('.blatt-ordnen-feld'),
    knoepfe: b ? [...b.querySelectorAll('button')].map(k => (k.textContent || '').trim()) : [],
    kleinster: b ? Math.min(...[...b.querySelectorAll('button')]
      .map(k => Math.round(k.getBoundingClientRect().height))) : 0,
    sichtbar: !!r && r.width > 0 && r.height > 0
  };
});
gleich('Der Knopf schaltet den Modus ein — und öffnet NICHT die Liste',
  [modus.an, modus.feldAuf], ['an', false]);
gleich('Das Band steht da: Als Liste · Zurücksetzen · Fertig',
  [modus.knoepfe, modus.sichtbar], [['Als Liste', 'Zurücksetzen', 'Fertig'], true]);
p('… und jeder seiner Knöpfe ist ein Fingerziel (§37)', modus.kleinster >= 44, String(modus.kleinster));

/* DER ZUG MIT DER MAUS — das, worum es geht. Das letzte Werkzeug an die
   erste Stelle. */
const mitte = (wahl: string) => pg9.evaluate((w: string) => {
  const k = document.querySelector<HTMLElement>(w);
  if (!k) return null;
  const r = k.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}, wahl);
{
  const letzte = vorher9.werkzeuge[vorher9.werkzeuge.length - 1]!;
  const von = await mitte(`.blatt-werk [data-wz="${letzte}"]`);
  const nach = await mitte(`.blatt-werk [data-wz="${vorher9.werkzeuge[0]}"]`);
  if (von && nach) {
    await pg9.mouse.move(von.x, von.y);
    await pg9.mouse.down();
    await pg9.mouse.move((von.x + nach.x) / 2, nach.y, { steps: 6 });
    await pg9.mouse.move(nach.x, nach.y, { steps: 6 });
    await pg9.mouse.up();
    await pg9.waitForTimeout(250);
  }
  const nachZug = await domFolge(pg9);
  gleich('Ein Zug mit der Maus setzt das Werkzeug an die neue Stelle',
    nachZug.werkzeuge[0], letzte);
  gleich('… und keines ist dabei verlorengegangen',
    [...nachZug.werkzeuge].sort(), [...vorher9.werkzeuge].sort());
  gleich('… und es steht in `meta`',
    await pg9.evaluate(() => (Store.getMeta('zeichnen:ordnung') as any)?.werkzeuge?.[0]), letzte);
}

/* EIN ZUG AUF EIN ZUBEHÖRTEIL SCHIEBT DIE GANZE GRUPPE. Sechs Stifte
   einzeln zu schieben wäre keine Bedienung, sondern eine Geduldsprobe. */
{
  const vorherG = (await domFolge(pg9)).gruppen;
  const von = await mitte('.blatt-werk .blatt-strich');
  const nach = await mitte('.blatt-werk [data-act="stilwahl"]');
  if (von && nach) {
    await pg9.mouse.move(von.x, von.y);
    await pg9.mouse.down();
    await pg9.mouse.move(nach.x, nach.y, { steps: 8 });
    await pg9.mouse.up();
    await pg9.waitForTimeout(250);
  }
  const nachG = (await domFolge(pg9)).gruppen;
  gleich('Ein Zug auf eine Breite schiebt die GANZE Gruppe vor die Stifte',
    nachG.indexOf('breite') < nachG.indexOf('stil'), true);
  gleich('… und es sind immer noch zwölf Gruppen', nachG.length, vorherG.length);
}

/* IM MODUS ZEICHNET NICHTS. Ein Klick greift, er wechselt kein Werkzeug —
   sonst hätte ein Zug auf den Radierer beim Loslassen radiert. */
{
  const vorherTool = await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk')?.dataset.tool);
  await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="radierer"]')?.click());
  await pg9.waitForTimeout(200);
  gleich('Ein Klick im Modus wechselt das Werkzeug nicht',
    await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk')?.dataset.tool), vorherTool);
}

/* UND DIE PFEILTASTEN TUN DASSELBE — für jeden, der nicht ziehen kann (§38). */
{
  const vorherT = (await domFolge(pg9)).werkzeuge;
  await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.focus());
  await pg9.keyboard.press('ArrowLeft');
  await pg9.waitForTimeout(200);
  const nachT = (await domFolge(pg9)).werkzeuge;
  gleich('Pfeil links rückt das Werkzeug eine Stelle nach vorn',
    nachT.indexOf('stift'), Math.max(0, vorherT.indexOf('stift') - 1));
  p('… und der Fokus bleibt an ihm',
    await pg9.evaluate(() => (document.activeElement as HTMLElement)?.dataset?.wz === 'stift'),
    await pg9.evaluate(() => String((document.activeElement as HTMLElement)?.dataset?.wz)));
}

/* «Fertig» beendet, und Escape auch. */
await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-ordnen-band [data-ob="fertig"]')?.click());
await pg9.waitForTimeout(250);
gleich('«Fertig» beendet den Modus und nimmt das Band weg',
  await pg9.evaluate(() => [document.querySelector<HTMLElement>('.blatt-werk')?.dataset.ordnen || '(aus)',
                            !!document.querySelector('.blatt-ordnen-band')]), ['(aus)', false]);
await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-act="einrichten"]')?.click());
await pg9.waitForTimeout(250);
await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="stift"]')?.focus());
await pg9.keyboard.press('Escape');
await pg9.waitForTimeout(250);
gleich('Escape ebenso',
  await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk')?.dataset.ordnen || '(aus)'), '(aus)');
/* Und danach zeichnet die Leiste wieder. */
await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk [data-wz="marker"]')?.click());
await pg9.waitForTimeout(200);
gleich('Nach dem Modus wechselt ein Klick wieder das Werkzeug',
  await pg9.evaluate(() => document.querySelector<HTMLElement>('.blatt-werk')?.dataset.tool), 'marker');
await pg9.context().close();

gleich('Die Seite meldet keinen Fehler', fehler.length, 0);
if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('\n   '));

await browser.close();
server.close();
console.log(`\nSuite 523: ${ok} grün${weg ? ', ' + weg + ' rot' : ''}.`);
process.exit(weg ? 1 : 0);
