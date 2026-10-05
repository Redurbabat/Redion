/* Suite 464 — Die Elemente-Bibliothek: gesicherte Marken stempeln (E494)
 * ============================================================================
 * L133, unter „Was Redion auch nach G5 nicht haben wird":
 *
 *   „**Elemente-Bibliothek (Sticker, GIPHY)** — Redion hat die Fachzeichen;
 *    eine allgemeine Sammlung wiederverwendbarer Marken wäre neu."
 *
 * Der zweite Halbsatz war kein Grund, sondern eine Beschreibung: neu ist
 * jede Funktion, bevor sie da ist. Und „wiederverwendbare Marken" sind in
 * Redion nichts Neues — es sind dieselben Marken, die die Zwischenablage
 * kopiert (E353), nur überleben sie das Dokument.
 *
 * GoodNotes nennt es „Elements": eine Sammlung fertiger Zeichnungen, die man
 * auf jede Seite stempelt. Der Weg hinein ist dort wie hier die AUSWAHL.
 *
 *   §1 DER KATALOG UND DIE LEISTE: das zwölfte Werkzeug, in einer Zeile, und
 *      sein Knopf steht nur bei ihm — 44 px (§37).
 *   §2 DIE EINE TÜR: `elementSichern` normiert auf den Nullpunkt, wirft die
 *      Sperre weg, ersetzt bei gleichem Namen — und SAGT jede Absage.
 *   §3 STEMPELN: `elementMarken` setzt mittig unter den Tipp, mit frischen
 *      Kennungen, ohne die Vorlage anzufassen.
 *   §4 DER GANZE WEG DURCH DIE OBERFLÄCHE: auswählen → „Als Element" →
 *      Werkzeug → tippen → die Marken stehen auf dem Blatt.
 *   §5 DIE BIBLIOTHEK REIST IN DER SICHERUNG MIT — sie liegt in `meta`
 *      (§9, §11), wie die Farbsätze.
 *   §6 DER DIALOG: eine Kachel je Element, Löschen darin, Escape schliesst.
 *   §7 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Fünf Gegenproben, alle gelaufen, alle rot gesehen:
 *   §1 → `button('elemente')` aus der Leiste nehmen. Rot: elf statt zwölf.
 *        (Den KATALOGEINTRAG zu entfernen taugt dafür NICHT — dann wirft
 *        `button()` beim Aufbau der Leiste, und die Seite kommt gar nicht
 *        erst hoch. Eine Gegenprobe, die die App umbringt, prüft nichts.)
 *   §2 → in `elementNormieren` das `delete kopie.gesperrt` weglassen. Rot:
 *        ein gesperrtes Element käme gesperrt an und wäre nicht zu bewegen.
 *   §2 → `elementSichern` bei voller Bibliothek `liste.shift()` machen statt
 *        einen Grund zu geben. Rot in ZWEI Zusagen: die Absage fehlt, und
 *        das erste Element ist weg.
 *   §3 → in `elementMarken` die halbe Breite und Höhe weglassen (Ecke statt
 *        Mitte). Rot: die Mitte liegt bei [353, 328] statt [300, 300].
 *   §4 → den Zweig `tool === 'elemente'` in `pointerdown` auf einen anderen
 *        Namen legen. Rot in drei Zusagen: der Tipp setzt nichts.
 *
 *   node pruefungen/lauf/test464.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;
declare const InkGeometry: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9584;
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
    Store.setMeta('zeichnen:elemente', []);
    const seite = Store.addPage(null, { text: 'Elementblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  return s;
};

/* ═══ §1 Der Katalog und die Leiste ════════════════════════════════════════ */
console.log('\n§1 Das zwölfte Werkzeug');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const raus = {};
    raus.imKatalog = Marken.WERKZEUGE.some(w => w.id === 'elemente');
    raus.wort = Marken.artWort('elemente');
    raus.zeichen = Marken.artZeichen('elemente');
    const werk = document.querySelector('.blatt-werk');
    const wz = [...werk.querySelectorAll('[data-wz]')];
    raus.werkzeuge = wz.length;
    raus.namen = wz.map(k => k.getAttribute('data-wz'));
    raus.zeilen = new Set(wz.map(k => Math.round(k.getBoundingClientRect().top))).size;
    raus.rollt = werk.scrollWidth > werk.clientWidth + 2;
    const knopf = werk.querySelector('[data-act="elemente"]');
    raus.knopfDa = !!knopf;
    raus.knopfGruppe = knopf ? knopf.getAttribute('data-gruppe') : '';
    return JSON.stringify(raus);
  })()`) as string);
  p('„elemente" steht in `Marken.WERKZEUGE`', r.imKatalog);
  gleich('Es heisst „Elemente" und trägt den Stern', [r.wort, r.zeichen], ['Elemente', '⭐']);
  /* ZWÖLF WAREN ES BEI E494, DREIZEHN SEIT E512 (der Laserpointer) —
     nachgezogen am 14. September, rot seit E512. Die Zusage ist die
     EINE Höhe: ein zwölfter Knopf kippte die Zeile nicht, ein
     dreizehnter auch nicht.
     VIERZEHN SEIT E671 (21. September): „Text ändern" (`textfix`, E670)
     steht seitdem auch auf dem Blatt neben „Text" — `test523` verlangt es
     („13 statt 14, textfix fehlt"). Diese Zeile hier blieb bei dreizehn und
     war seit af2706c1 rot (E714, halbiert). Jetzt steht nicht nur die Zahl
     da, sondern die vierzehn NAMEN in ihrer Reihenfolge: ein fremder Knopf
     mit `data-wz` oder ein fehlendes Werkzeug fiele auf, auch wenn die Zahl
     zufällig stimmte. Und alle weiter auf EINER Höhe. */
  gleich('Vierzehn Werkzeuge, mit Namen, alle auf EINER Höhe', [r.werkzeuge, r.zeilen, r.namen],
    [14, 1, ['schreiben', 'select', 'stift', 'marker', 'formen', 'abdeck', 'zettel', 'text', 'textfix',
             'zeichen', 'elemente', 'bild', 'radierer', 'laser']]);
  p('… und die Leiste rollt am Rechner nicht', !r.rollt);
  gleich('Der Zubehörknopf steht in der Gruppe „elemente"', [r.knopfDa, r.knopfGruppe], [true, 'elemente']);

  /* SEIN ZUBEHÖR STEHT NUR BEI IHM (E356) — und dann misst es 44 px (§37). */
  const sicht = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knopf = werk.querySelector('[data-act="elemente"]');
    const misst = () => knopf.getClientRects().length > 0;
    werk.querySelector('[data-wz="stift"]').click();
    const beimStift = misst();
    werk.querySelector('[data-wz="elemente"]').click();
    const beiUns = misst();
    const kasten = knopf.getBoundingClientRect();
    const werkzeug = werk.querySelector('[data-wz="elemente"]').getBoundingClientRect();
    const nachbar = werk.querySelector('[data-act="undo"]').getBoundingClientRect();
    const wzNachbar = werk.querySelector('[data-wz="zeichen"]').getBoundingClientRect();
    return JSON.stringify({ beimStift, beiUns,
      hoehe: Math.round(kasten.height), breite: Math.round(kasten.width),
      nachbarHoehe: Math.round(nachbar.height), wzNachbar: Math.round(wzNachbar.height),
      wzHoehe: Math.round(werkzeug.height),
      flaeche: document.querySelector('.blatt-marken').getAttribute('data-tool') });
  })()`) as string);
  gleich('Beim Stift steht er nicht, bei den Elementen schon', [sicht.beimStift, sicht.beiUns], [false, true]);
  /* NACHGEMESSEN, NICHT BEHAUPTET: am Rechner sind die Knöpfe dieser Leiste
     32 px hoch — alle, seit E359. Die 44 px aus §37 gelten dem Telefon, und
     dort werden sie unten gemessen. Ein neuer Knopf hat hier so gross zu
     sein wie seine Nachbarn; grösser wäre ein Bruch in der Zeile. */
  gleich('Am Rechner so hoch wie seine Nachbarn', sicht.hoehe, sicht.nachbarHoehe);
  p('Das Werkzeug ebenso', sicht.wzHoehe === sicht.wzNachbar, `${sicht.wzHoehe} px gegen ${sicht.wzNachbar} px`);
  gleich('Die Fläche steht danach auf „elemente"', sicht.flaeche, 'elemente');
  await s.close();
}

/* Am Telefon gilt §37: 44 px auf dem Hauptweg. */
{
  const s = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.getElementById('rg-willkommen')?.remove();
    document.getElementById('rg-einladung')?.remove();
    const seite = Store.addPage(null, { text: 'Telefonblatt' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89, raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  });
  await s.waitForSelector('.blatt-werk [data-wz="elemente"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  const handy = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    werk.querySelector('[data-wz="elemente"]').click();
    const wz = werk.querySelector('[data-wz="elemente"]').getBoundingClientRect();
    const zu = werk.querySelector('[data-act="elemente"]').getBoundingClientRect();
    return JSON.stringify({ wz: Math.round(wz.height), zu: Math.round(zu.height),
      name: werk.querySelector('[data-wz="elemente"]').getAttribute('aria-label')
        || werk.querySelector('[data-wz="elemente"] .wort').textContent });
  })()`) as string);
  p('Am Telefon misst das Werkzeug 44 px (§37)', handy.wz >= 44, `${handy.wz} px`);
  p('… und sein Knopf im Zubehör auch', handy.zu >= 44, `${handy.zu} px`);
  p('Der Knopf hat einen Namen für den Screenreader (§38)', /Elemente/.test(String(handy.name)), String(handy.name));
  await s.close();
}

/* ═══ §2 Die eine Tür ══════════════════════════════════════════════════════ */
console.log('\n§2 Sichern: normiert, entsperrt, mit Grund bei jeder Absage');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const raus = {};
    const marken = [
      { id: 'alt-1', art: 'stift', farbe: '#3aa757', breite: 5, gesperrt: true,
        pts: [[300, 400], [320, 422], [356, 374]] },
      { id: 'alt-2', art: 'stift', farbe: '#3aa757', breite: 5, pts: [[300, 430], [356, 430]] }
    ];
    const erst = Marken.elementSichern('Häkchen', marken);
    raus.erstOk = erst.ok;
    const liste = Marken.elemente();
    raus.anzahl = liste.length;
    raus.name = liste[0].name;
    /* AUF DEN NULLPUNKT GERUECKT — gemessen am SICHTBAREN Kasten, nicht an den
       rohen Punkten. InkGeometry.bounds rechnet die halbe Strichbreite mit
       (2,5 bei einem 5er Strich); der linke Rand des Striches liegt also auf
       0, sein Mittelpunkt bei 2,5. Das ist richtig so: ein Stempel, dessen
       Punkte auf 0 laegen, haette die halbe Linie ausserhalb seines Kastens.
       (Kein Gegenstrich in dieser Zeichenkette — er beendet sie, und der
       Fehler kommt dann aus einer ganz anderen Ecke. Zum dritten Mal.) */
    const kasten = InkGeometry.union(liste[0].marken.map(m => InkGeometry.bounds(m)));
    raus.minX = Math.round(kasten.x * 10) / 10;
    raus.minY = Math.round(kasten.y * 10) / 10;
    const alle = liste[0].marken.flatMap(m => m.pts);
    raus.punktX = Math.min(...alle.map(pt => pt[0]));
    raus.breite = Math.round(liste[0].breite);
    raus.hoehe = Math.round(liste[0].hoehe);
    raus.gesperrt = liste[0].marken.some(m => m.gesperrt);
    raus.kennungen = liste[0].marken.some(m => m.id);
    /* Gleicher Name ersetzt, statt ein zweites daneben zu legen. */
    Marken.elementSichern('Häkchen', [{ art: 'stift', farbe: '#111111', breite: 2, pts: [[0, 0], [10, 10]] }]);
    raus.nachErsetzen = Marken.elemente().length;
    /* Die drei Absagen. */
    raus.ohneNamen = Marken.elementSichern('   ', marken);
    raus.ohneAuswahl = Marken.elementSichern('Leer', []);
    const riesig = [{ art: 'stift', farbe: '#111111', breite: 2,
      pts: Array.from({ length: 30000 }, (unused, i) => [i % 500, Math.floor(i / 500)]) }];
    raus.zuGross = Marken.elementSichern('Riesig', riesig);
    raus.grenzen = [Marken.HOECHSTENS_ELEMENTE, Marken.HOECHSTENS_ELEMENT_BYTES];
    return JSON.stringify(raus);
  })()`) as string);
  p('Gesichert', r.erstOk);
  gleich('Eines in der Bibliothek, und es heisst so', [r.anzahl, r.name], [1, 'Häkchen']);
  gleich('Der sichtbare Kasten beginnt bei null', [r.minX, r.minY], [0, 0]);
  gleich('… und der Strich liegt seine halbe Breite drinnen', r.punktX, 2.5);
  gleich('Der Kasten misst 61 × 61 — 56 Punkte plus die 5 des Strichs', [r.breite, r.hoehe], [61, 61]);
  p('Die Sperre reist NICHT mit — sonst liesse sich das Gesetzte nicht bewegen', !r.gesperrt);
  p('Und die alten Kennungen auch nicht', !r.kennungen);
  gleich('Gleicher Name ersetzt, statt zu verdoppeln', r.nachErsetzen, 1);
  p('Ohne Namen: Absage MIT Grund', r.ohneNamen.ok === false && /Namen/.test(r.ohneNamen.grund), JSON.stringify(r.ohneNamen));
  p('Ohne Auswahl: Absage MIT Grund', r.ohneAuswahl.ok === false && /ausgewählt/.test(r.ohneAuswahl.grund), JSON.stringify(r.ohneAuswahl));
  p('Zu gross: Absage MIT Grund und Zahl', r.zuGross.ok === false && /KB/.test(r.zuGross.grund), JSON.stringify(r.zuGross).slice(0, 160));
  gleich('Die Grenzen sind sechzig und 200 KB', r.grenzen, [60, 204800]);

  /* DIE VOLLE BIBLIOTHEK SAGT ES (§35) — sie wirft nicht still das älteste weg. */
  const voll = JSON.parse(await s.evaluate(`(() => {
    Store.setMeta('zeichnen:elemente', []);
    const eine = [{ art: 'stift', farbe: '#111111', breite: 2, pts: [[0, 0], [10, 10]] }];
    for (let i = 0; i < 60; i++) Marken.elementSichern('E' + i, eine);
    const davor = Marken.elemente().length;
    const absage = Marken.elementSichern('E60', eine);
    const danach = Marken.elemente();
    return JSON.stringify({ davor, absage, danach: danach.length, erstesDa: danach[0].name });
  })()`) as string);
  gleich('Sechzig passen hinein', voll.davor, 60);
  p('Der einundsechzigste bekommt eine Absage', voll.absage.ok === false && /sechzig|60/.test(voll.absage.grund),
    JSON.stringify(voll.absage));
  gleich('… und das erste ist noch da', [voll.danach, voll.erstesDa], [60, 'E0']);
  await s.close();
}

/* ═══ §3 Stempeln ══════════════════════════════════════════════════════════ */
console.log('\n§3 Der Stempel liegt mittig unter dem Tipp');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    Store.setMeta('zeichnen:elemente', []);
    Marken.elementSichern('Kreuz', [
      { art: 'stift', farbe: '#d64545', breite: 5, pts: [[10, 10], [110, 60]] }
    ]);
    const el = Marken.elemente()[0];
    const gesetzt = Marken.elementMarken(el.id, 300, 300);
    const pts = gesetzt.flatMap(m => m.pts);
    const xs = pts.map(pt => pt[0]);
    const ys = pts.map(pt => pt[1]);
    const mitteX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const mitteY = (Math.min(...ys) + Math.max(...ys)) / 2;
    /* Die Vorlage darf sich dabei nicht verändert haben. */
    const nachher = Marken.elemente()[0];
    return JSON.stringify({
      anzahl: gesetzt.length, mitteX: Math.round(mitteX), mitteY: Math.round(mitteY),
      kennungen: gesetzt.map(m => m.id).filter(Boolean).length,
      frisch: gesetzt.every(m => m.id && m.id.length >= 4),
      vorlageGleich: JSON.stringify(nachher.marken) === JSON.stringify(el.marken),
      unbekannt: Marken.elementMarken('gibtesnicht', 10, 10).length
    });
  })()`) as string);
  gleich('Eine Marke gesetzt', r.anzahl, 1);
  gleich('Ihre Mitte liegt auf dem Tipp', [r.mitteX, r.mitteY], [300, 300]);
  gleich('Jede gesetzte Marke hat eine frische Kennung', [r.kennungen, r.frisch], [1, true]);
  p('Die Vorlage in der Bibliothek bleibt, wie sie war', r.vorlageGleich);
  gleich('Eine Kennung, die es nicht gibt, setzt nichts', r.unbekannt, 0);
  await s.close();
}

/* ═══ §4 Der ganze Weg durch die Oberfläche ════════════════════════════════ */
console.log('\n§4 Auswählen, sichern, stempeln — mit der Hand');
{
  const s = await mitBlatt();
  const kasten = (await s.locator('.blatt-marken').boundingBox())!;
  /* NACHGEMESSEN: die Fläche steht bei y=420 und ist 999 px hoch, das Fenster
     900. Sichtbar ist also nur ihr oberes Drittel — ein Tipp bei 52 % ihrer
     Höhe läge bei y=940 und damit AUSSERHALB des Fensters, wo Playwright
     nichts trifft. Genau daran ist der zweite Stempel zuerst gescheitert,
     und es lag nicht am Stempel. Deshalb feste Abstände, keine Anteile. */
  /* Zwei echte Striche, mit der Maus gezogen — nicht in den Speicher
     geschrieben. Was hier geprüft wird, ist der WEG, und der geht über
     dieselben Zeigerereignisse wie eine Hand. */
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(200);
  for (const versatz of [0, 60]) {
    await s.mouse.move(kasten.x + 120 + versatz, kasten.y + 140);
    await s.mouse.down();
    await s.mouse.move(kasten.x + 170 + versatz, kasten.y + 200, { steps: 8 });
    await s.mouse.up();
    await s.waitForTimeout(150);
  }
  const gemalt = Number(await s.evaluate(`document.querySelectorAll('.blatt-marken [data-sid]').length`));
  gleich('Zwei Striche stehen auf dem Blatt', gemalt, 2);

  /* Auswahl-Werkzeug, ein Kastenzug um beide. */
  await s.click('.blatt-werk [data-wz="select"]');
  await s.waitForTimeout(200);
  await s.mouse.move(kasten.x + 90, kasten.y + 110);
  await s.mouse.down();
  await s.mouse.move(kasten.x + 270, kasten.y + 240, { steps: 12 });
  await s.mouse.up();
  await s.waitForTimeout(300);
  const gewaehlt = Number(await s.evaluate(`document.querySelectorAll('.blatt-auswahlrahmen').length`));
  p('Beide sind ausgewählt', gewaehlt === 2, String(gewaehlt));
  const knopfAus = await s.evaluate(`document.querySelector('.blatt-werk [data-act="element-sichern"]').disabled`);
  p('Der Knopf „Als Element" ist mit Auswahl offen', knopfAus === false, String(knopfAus));

  await s.click('.blatt-werk [data-act="element-sichern"]');
  await s.waitForSelector('.overlay #fq', { timeout: 5000 });
  await s.fill('.overlay #fq', 'Kreuzchen');
  await s.click('.overlay [data-a="ok"]');
  await s.waitForTimeout(400);
  const inMeta = JSON.parse(await s.evaluate(`JSON.stringify(Marken.elemente())`) as string);
  gleich('Es steht in der Bibliothek, mit beiden Marken',
    [inMeta.length, inMeta[0]?.name, inMeta[0]?.marken?.length], [1, 'Kreuzchen', 2]);

  /* Jetzt stempeln: Werkzeug wählen, Bibliothek öffnen, Kachel tippen, aufs Blatt. */
  await s.click('.blatt-werk [data-wz="elemente"]');
  await s.waitForTimeout(250);
  await s.click('.blatt-werk [data-act="elemente"]');
  await s.waitForSelector('.elemente-kachel', { timeout: 5000 });
  const kachelWort = await s.evaluate(`document.querySelector('.elemente-kachel i').textContent`);
  gleich('Die Kachel trägt den Namen', kachelWort, 'Kreuzchen');
  await s.click('.elemente-kachel');
  await s.waitForTimeout(300);
  const knopfWort = await s.evaluate(`document.querySelector('.blatt-werk [data-act="elemente"] .wort').textContent`);
  gleich('Der Knopf sagt jetzt, was der nächste Tipp setzt', knopfWort, 'Kreuzchen');

  const davor = Number(await s.evaluate(`document.querySelectorAll('.blatt-marken [data-sid]').length`));
  await s.mouse.click(kasten.x + 380, kasten.y + 300);
  await s.waitForTimeout(500);
  const danach = Number(await s.evaluate(`document.querySelectorAll('.blatt-marken [data-sid]').length`));
  p('Der Tipp setzt die zwei Marken des Elements', danach - davor === 2, `${davor} → ${danach}`);
  /* Ein zweiter Tipp setzt dasselbe noch einmal, OHNE erneut zu fragen —
     das ist der Unterschied zwischen einem Stempel und einem Wähler. */
  await s.mouse.click(kasten.x + 500, kasten.y + 390);
  await s.waitForTimeout(500);
  const drittens = Number(await s.evaluate(`document.querySelectorAll('.blatt-marken [data-sid]').length`));
  const dialogOffen = await s.evaluate(`!!document.querySelector('.elemente-kachel')`);
  p('Ein zweiter Tipp stempelt wieder — ohne die Bibliothek zu öffnen',
    drittens - danach === 2 && dialogOffen === false, `${danach} → ${drittens}, Dialog offen: ${dialogOffen}`);
  /* Und es steht wirklich im Speicher, nicht nur im Bild. */
  const gesichert = Number(await s.evaluate(`(() => {
    const id = document.querySelector('.blatt-marken').closest('[data-bid]').getAttribute('data-bid');
    return (Store.getBlock(id).marken || []).length;
  })()`));
  p('Gesichert ist es auch', gesichert === drittens, `${gesichert} im Speicher, ${drittens} im Bild`);
  /* EIN SCHRITT IM VERLAUF, nicht zwei: „Zurück" nimmt den ganzen Stempel. */
  await s.evaluate(`document.querySelector('.blatt-werk [data-act="undo"]').click()`);
  await s.waitForTimeout(400);
  const nachZurueck = Number(await s.evaluate(`document.querySelectorAll('.blatt-marken [data-sid]').length`));
  p('„Zurück" nimmt den ganzen Stempel auf einmal', nachZurueck === danach, `${drittens} → ${nachZurueck}`);
  await s.close();
}

/* ═══ §5 Die Bibliothek reist in der Sicherung mit ═════════════════════════ */
console.log('\n§5 Die Bibliothek steht in der Sicherung');
{
  const s = await mitBlatt();
  const d = JSON.parse(await s.evaluate(`(() => {
    Store.setMeta('zeichnen:elemente', []);
    Marken.elementSichern('Reiseelement', [
      { art: 'stift', farbe: '#2f7ed8', breite: 2, pts: [[0, 0], [30, 30]] }
    ]);
    return Store.exportAll();
  })()`) as string);
  const eintrag = d.meta?.['zeichnen:elemente'];
  p('`zeichnen:elemente` liegt im Fach `meta` (§9)', !!eintrag, String(Object.keys(d.meta ?? {}).length));
  p('… mit dem Namen darin', JSON.stringify(eintrag ?? '').includes('Reiseelement'), JSON.stringify(eintrag).slice(0, 120));
  p('… und mit den Marken, nicht nur dem Namen',
    JSON.stringify(eintrag ?? '').includes('pts'), JSON.stringify(eintrag).slice(0, 200));
  await s.close();
}

/* ═══ §6 Der Dialog ════════════════════════════════════════════════════════ */
console.log('\n§6 Kacheln, Löschen, Escape');
{
  const s = await mitBlatt();
  await s.evaluate(`(() => {
    Store.setMeta('zeichnen:elemente', []);
    const eine = art => [{ art: 'stift', farbe: '#111111', breite: 2, pts: [[0, 0], [20, 20]] }];
    Marken.elementSichern('Erstes', eine());
    Marken.elementSichern('Zweites', eine());
    Marken.elementSichern('Drittes', eine());
  })()`);
  await s.click('.blatt-werk [data-wz="elemente"]');
  await s.waitForTimeout(200);
  await s.click('.blatt-werk [data-act="elemente"]');
  await s.waitForSelector('.elemente-kachel', { timeout: 5000 });
  const kacheln = Number(await s.evaluate(`document.querySelectorAll('.elemente-kachel').length`));
  gleich('Drei Kacheln', kacheln, 3);
  const bilder = Number(await s.evaluate(`document.querySelectorAll('.elemente-kachel svg path, .elemente-kachel svg polyline').length`));
  p('Jede trägt ein gezeichnetes Bild, keine leere Fläche', bilder >= 3, String(bilder));
  /* ERST ANKOMMEN LASSEN, DANN MESSEN. `.finder` fährt mit der Animation
     `studio-arrive` ein und steht in ihrer ersten Hälfte auf
     matrix(0.985, 0, 0, 0.985, 0, 7). Gemessen ergab das für einen Knopf mit
     `height:44px` glatte 43,34 px — die Zusage war rot, und der Knopf war
     richtig. Wer eine Grösse misst, während etwas einfährt, misst die
     Animation. */
  await s.waitForTimeout(500);
  const wegMass = JSON.parse(await s.evaluate(`(() => {
    const el = document.querySelector('.elemente-weg');
    const k = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return JSON.stringify({ h: Math.round(k.height), b: Math.round(k.width),
      angekommen: getComputedStyle(el.closest('.finder')).transform });
  })()`) as string);
  gleich('Der Papierkorb misst 44 px (§37)', [wegMass.h, wegMass.b], [44, 44]);
  /* Angekommen heisst: die Einheitsmatrix. `none` steht nur, solange die
     Animation die Eigenschaft gar nicht gesetzt hat. */
  gleich('… gemessen, nachdem das Fenster angekommen ist', wegMass.angekommen, 'matrix(1, 0, 0, 1, 0, 0)');
  /* Zwei Schritte (E709): der Druck öffnet „Löschen" / „Abbrechen" und
     löscht noch nichts; die rote Pille ist nach dem Aufgehen scharf. */
  await s.click('.elemente-weg');
  await s.waitForTimeout(800);
  gleich('Der erste Druck fragt nur (E709)', Number(await s.evaluate(`document.querySelectorAll('.elemente-kachel').length`)), 3);
  await s.click('.ru-loesch-ja');
  await s.waitForTimeout(300);
  const nachWeg = Number(await s.evaluate(`document.querySelectorAll('.elemente-kachel').length`));
  gleich('Löschen nimmt eine weg — und lässt den Dialog offen', nachWeg, 2);
  gleich('… und aus der Bibliothek auch', Number(await s.evaluate(`Marken.elemente().length`)), 2);
  await s.keyboard.press('Escape');
  await s.waitForTimeout(250);
  const zu = await s.evaluate(`!document.querySelector('.elemente-kachel')`);
  p('Escape schliesst (§38)', zu === true);

  /* DIE LEERE BIBLIOTHEK ZEIGT DEN WEG HINEIN, statt nichts zu zeigen. */
  await s.evaluate(`Store.setMeta('zeichnen:elemente', [])`);
  await s.click('.blatt-werk [data-act="elemente"]');
  await s.waitForSelector('.elemente-leer', { timeout: 5000 });
  const leer = String(await s.evaluate(`document.querySelector('.elemente-leer').textContent`));
  p('Ohne Elemente steht da, WIE eines hineinkommt', /Als Element/.test(leer), leer.slice(0, 90));
  await s.keyboard.press('Escape');
  await s.close();
}

/* ═══ §7 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§7 Quellen');
{
  const q = lies('src/bereiche/pdf/marken.ts');
  p('Die Bibliothek hat EINE Schreibstelle (`elementeSchreiben`)',
    (q.match(/const elementeSchreiben = /g) || []).length === 1
    && (q.match(/Store\.setMeta\('zeichnen:elemente'/g) || []).length === 1,
    String((q.match(/Store\.setMeta\('zeichnen:elemente'/g) || []).length));
  p('Das Normieren steht einmal (`elementNormieren`)',
    (q.match(/const elementNormieren = /g) || []).length === 1);
  p('Die Vorschau zeichnet mit `zeichneMarke`, nicht mit einem zweiten Zeichner',
    /const elementBild = [\s\S]{0,900}zeichneMarke\(/.test(q));
  p('Der Name des Elements geht über `textContent`, nicht über `innerHTML` (§19)',
    /wort\.textContent = element\.name/.test(q) && !/innerHTML[^\n]*element\.name/.test(q));
  p('Der Typ heisst NICHT `Element` — das ist die DOM-Klasse',
    /type LibraryElement = /.test(q) && !/^\s*type Element = /m.test(q));
  p('Das erzeugte JS trägt es', /elementSichern/.test(lies('quell/bereiche/pdf/marken.js')));
  p('Das Stilblatt kennt die Kacheln', /\.elemente-kachel/.test(lies('quell/schale/stil/bausteine.css')));
  /* ══ DIESE ZEILE SUCHTE EINE ABSCHRIFT, DIE ES NICHT MEHR GIBT (E574) ═════
     Sie las `/'elemente', 'star'/` in `document-mode.ts` — einen Eintrag aus
     der Liste, die die obere Leiste bis E572 von Hand nachführte. E572 hat
     genau diese Abschrift abgeschafft (sie hatte den Laser vergessen und
     benutzte andere Symbole für dieselbe Tat) und liest seither
     `Marken.WERKZEUGE`. Die Zusicherung war damit rot, ohne dass am Produkt
     etwas fehlte — der Elemente-Knopf steht oben, er kommt nur woanders her.
     Jetzt prüft sie die Eigenschaft, die das Versprechen wirklich trägt:
     EINE Quelle, und `elemente` steht darin. Rot wird sie, sobald jemand die
     Leiste wieder von Hand füllt oder das Werkzeug aus dem Katalog nimmt. */
  p('Die Zeichenleiste im Studio nimmt denselben Katalog, nicht eine Abschrift',
    /Marken\.WERKZEUGE\.map\(/.test(lies('src/bereiche/pdf/document-mode.ts'))
    && !/'elemente', 'star'/.test(lies('src/bereiche/pdf/document-mode.ts')));
  p('… und `elemente` steht in diesem Katalog',
    /\{ id: 'elemente',/.test(lies('src/bereiche/pdf/marken.ts')));
  gleich('Keine Seitenfehler', fehler, []);
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
process.exit(weg ? 1 : 0);
