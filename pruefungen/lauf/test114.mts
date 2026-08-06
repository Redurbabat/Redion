/* Suite 78 — Fingergrössen: was man antippen soll, muss man treffen können
 * ============================================================================
 * WARUM ES DIESEN LAUF GIBT. Die Regeln standen längst in `redion-mobile-ux`
 * — „mindestens 44px, besser 48" und, unter „Nicht tun", zweimal dasselbe:
 * „Hover als einzige Bedienung" und „keine unsichtbaren Buttons". Trotzdem
 * waren am 428-Pixel-Bildschirm neun Knöpfe der Seitenleiste auf `opacity:0`
 * und fünf über dem Seitentitel dazu.
 *
 * Gefunden hat das nicht das Hinsehen, sondern das Messen. Genau deshalb
 * steht es jetzt hier: eine Regel, die niemand nachrechnet, hält bis zur
 * nächsten CSS-Zeile.
 *
 * ZWEI FRAGEN, UND DIE ERSTE IST DIE WICHTIGERE
 *
 *   1. IST DER KNOPF ÜBERHAUPT ZU SEHEN? Ein Knopf, der auf Hover wartet,
 *      existiert am Telefon nicht — es gibt dort kein Hover. Er ist nicht
 *      klein, er ist weg. Das ist kein Schönheitsfehler: war das ⚙ der
 *      Einstellungen unsichtbar, kam man am Telefon nicht in die
 *      Einstellungen.
 *
 *   2. TRIFFT MAN IHN? 44 Pixel, sagt die Skill. Ein Zeichen darf dabei
 *      klein bleiben — gemeint ist die Fläche darum herum.
 *
 * WAS DIESER LAUF BEWUSST DURCHGEHEN LÄSST
 * Die Knöpfe der Kopfleiste sind 30 px breit und 44 px hoch. Das ist eine
 * Entscheidung und kein Versehen; sie steht im Stilblatt begründet: acht
 * Knöpfe zu 44 px sind 352 von 428 Pixeln, und dann ist der Seitentitel weg.
 * Eine Kopfleiste ohne Titel ist schlimmer als eine mit schmaleren Knöpfen —
 * man weiss dann nicht mehr, wo man ist. In einer waagerechten Leiste ist
 * die Höhe die Hälfte, die der Daumen trifft.
 *
 * Diese Ausnahme steht hier NAMENTLICH. Eine Ausnahme, die man nicht
 * aufzählen muss, ist keine Ausnahme mehr, sondern ein Loch.
 *
 * NEU AM 6. AUGUST: Abschnitt 5 drückt wirklich lange auf einen Block und
 * lässt los — gegen den Fehler, dass der Klick, den der Browser der
 * Berührung hinterherschickt, das eben geöffnete Blockmenü sofort wieder
 * schloss. Abschnitt 6 geht wirklich offline: der Streifen lag auf der
 * unteren Leiste und sein ✕ war 17 × 20 px. Abschnitt 7 öffnet den Import:
 * Ordnerwahl und Zieh-Hinweis haben auf einem Telefon nichts verloren, und
 * die Rundgang-Einladung verdeckte das offene Blatt.
 *
 *   node pruefungen/lauf/test114.mts
 * ==========================================================================*/

import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8796;

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

/* Die Knöpfe der Kopfleiste — schmal mit Begründung, siehe oben. Sie werden
   trotzdem auf ihre HÖHE geprüft; nur die Breite ist ihnen erlassen. */
const SCHMAL_ERLAUBT = [
  '#btn-menu', '#btn-back', '#btn-fwd', '#btn-suche-handy',
  '#btn-neu-handy', '#btn-page-menu', '#btn-fav', '#btn-komm',
  '#btn-verlauf', '#btn-link', '#btn-lock', '#btn-ai', '#btn-teilen'
];

const browser = await chromium.launch();
const seite = await browser.newPage({
  viewport: { width: 428, height: 926 }, hasTouch: true, isMobile: true
});
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2200);

/* Eine Seite mit Inhalt, damit auch die Werkzeuge über dem Titel dastehen. */
await seite.evaluate(() => {
  const s = Store.addBlock(null, 'page', { text: 'Fingerprobe' });
  Store.addBlock(s.id, 'text', { text: 'Eine Zeile.' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(900);

type Fund = { wo: string; text: string; breite: number; hoehe: number; sichtbar: boolean };

const messen = async (): Promise<Fund[]> => seite.evaluate(() => {
  const raus: { wo: string; text: string; breite: number; hoehe: number; sichtbar: boolean }[] = [];
  const gesehen = new Set<string>();
  document.querySelectorAll<HTMLElement>('button, [role="button"], a[href]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') return;

    /* Durchsichtig kann auch ein Vorfahre sein — `.row .act` steht auf
       `opacity:0`, nicht der Knopf darin. Wer nur den Knopf ansieht,
       übersieht genau den Fall, um den es hier geht. */
    let sichtbar = true;
    for (let k: HTMLElement | null = el; k; k = k.parentElement) {
      if (Number(getComputedStyle(k).opacity) === 0) { sichtbar = false; break; }
    }

    const wo = (el.id ? '#' + el.id : '') +
      (typeof el.className === 'string' && el.className
        ? '.' + el.className.trim().split(/\s+/)[0] : '');
    const text = (el.textContent ?? '').trim().slice(0, 12);
    const schl = wo + text + Math.round(r.width) + 'x' + Math.round(r.height);
    if (gesehen.has(schl)) return;
    gesehen.add(schl);
    raus.push({ wo: wo || el.tagName.toLowerCase(), text,
                breite: Math.round(r.width), hoehe: Math.round(r.height), sichtbar });
  });
  return raus;
}) as Promise<Fund[]>;

console.log('\n1 · Kein Knopf wartet auf einen Mauszeiger, den es nicht gibt');

const alle = await messen();
p('Es wurden überhaupt Knöpfe gefunden', alle.length > 20, String(alle.length));

const unsichtbar = alle.filter(x => !x.sichtbar);
p('Kein Knopf steht auf opacity 0',
  unsichtbar.length === 0,
  unsichtbar.slice(0, 8).map(x => `${x.wo} „${x.text}"`).join(', ') +
  ' → am Telefon gibt es kein Hover; diese Knöpfe sind dort nicht klein, sondern weg');

console.log('\n2 · Was man antippen soll, ist 44 Pixel hoch');

const zuFlach = alle.filter(x => x.sichtbar && x.hoehe < 44);
p('Jeder sichtbare Knopf ist mindestens 44 px hoch',
  zuFlach.length === 0,
  zuFlach.slice(0, 8).map(x => `${x.wo} ${x.breite}×${x.hoehe}`).join(', '));

console.log('\n3 · … und breit genug, ausser den namentlich erlaubten');

const zuSchmal = alle.filter(x =>
  x.sichtbar && x.breite < 44 && !SCHMAL_ERLAUBT.some(s => x.wo.startsWith(s)));
p('Jeder übrige Knopf ist mindestens 44 px breit',
  zuSchmal.length === 0,
  zuSchmal.slice(0, 8).map(x => `${x.wo} ${x.breite}×${x.hoehe}`).join(', ') +
  ' → entweder die Fläche vergrössern oder in SCHMAL_ERLAUBT eintragen, mit Grund');

/* Die Ausnahmeliste ist nur dann eine, wenn sie kurz bleibt. */
p('Die Ausnahmeliste ist nicht heimlich gewachsen',
  SCHMAL_ERLAUBT.length <= 15, String(SCHMAL_ERLAUBT.length) + ' Einträge');

console.log('\n4 · Und auf dem Rechner bleibt alles, wie es war');

/* Der Umkehrschluss. Würden die Regeln aus Abschnitt 1 auch am Rechner
   greifen, stünden dort dauerhaft Knöpfe herum, die dort absichtlich erst
   beim Überfahren erscheinen — die Leiste wäre unruhig, sobald man nur
   liest. Dass sie dort weiterhin verborgen sind, ist deshalb keine
   Nachlässigkeit, sondern die Gegenprobe. */
const gross = await browser.newPage({ viewport: { width: 1500, height: 950 } });
await gross.goto(`http://localhost:${PORT}/index.html`);
await gross.waitForTimeout(2000);
const versteckt = await gross.evaluate(() => {
  let n = 0;
  document.querySelectorAll<HTMLElement>('.side-section button, .row .act, .pg-tools').forEach(el => {
    if (Number(getComputedStyle(el).opacity) === 0) n++;
  });
  return n;
}) as number;
p('Am Rechner erscheinen sie weiterhin erst beim Überfahren',
  versteckt > 0, `${versteckt} verborgen — bei 0 wäre die Telefon-Regel auf den Rechner durchgeschlagen`);

await gross.close();

console.log('\n5 · Langes Drücken öffnet das Blockmenü — und es überlebt das Loslassen');

/* DER FEHLER, GEGEN DEN DIESER ABSCHNITT STEHT (6. August 2026). Die Griffe
   neben den Blöcken sind am Telefon ausgeblendet; ihr Ersatz ist das lange
   Drücken. Das Menü ÖFFNETE auch — bei noch gedrücktem Finger. Beim
   Loslassen schickt der Browser der Berührung aber mousedown, mouseup und
   click hinterher, und dieser click traf den frisch gelegten Menü-Grund,
   dessen Klick-Handler das Menü schliesst. Es verschwand im selben Atemzug,
   in dem es aufging.

   Sichtbar ist das nur mit echten Touch-Ereignissen SAMT Loslassen. Ein
   Direktaufruf von blockMenue() wäre hier immer grün gewesen — genau so hat
   der Fehler überlebt. Deshalb drückt dieser Abschnitt wirklich. */
p('Vorher ist kein Menü offen',
  await seite.evaluate(() => !document.querySelector('.menu')));

const ziel = await seite.evaluate(() => {
  const el = document.querySelector('.blk .ct');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + Math.min(60, r.width / 2), y: r.top + r.height / 2 };
}) as { x: number; y: number } | null;
p('Ein Block steht zum Drücken bereit', !!ziel);

if (ziel) {
  const cdp = await seite.context().newCDPSession(seite);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: ziel.x, y: ziel.y }] });
  await seite.waitForTimeout(650);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await seite.waitForTimeout(400);

  const menue = await seite.evaluate(() => {
    const m = document.querySelector('.menu');
    if (!m) return { da: false, blatt: false, turn: false, zuFlach: [] as string[] };
    const zuFlach = [...m.querySelectorAll('button')]
      .filter(k => k.getBoundingClientRect().height < 44)
      .map(k => `${(k.textContent ?? '').trim().slice(0, 12)} ${Math.round(k.getBoundingClientRect().height)}px`);
    return { da: true, blatt: m.classList.contains('blatt'),
             turn: !!m.querySelector('[data-a="turn"]'), zuFlach };
  }) as { da: boolean; blatt: boolean; turn: boolean; zuFlach: string[] };
  p('Nach dem Loslassen ist das Menü noch da', menue.da,
    'der Klick nach dem Loslassen hat es wieder geschlossen — die Nachzügler werden nicht geschluckt');
  p('Es ist das Blatt von unten', menue.blatt);
  p('„Umwandeln in" steht darin', menue.turn);
  p('Jeder Menüeintrag ist mindestens 44 px hoch',
    menue.zuFlach.length === 0, menue.zuFlach.join(', '));
  await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });
}

console.log('\n6 · Ohne Verbindung: der Streifen sitzt über der Leiste und ist antippbar');

/* Vorher lag der Streifen bei bottom:70px AUF der 72 px hohen unteren
   Leiste, und sein ✕ war 17 × 20 px — auf dem einzigen Gerät, auf dem man
   wirklich offline ist, war die Anzeige weder lesbar noch schliessbar. */
await seite.context().setOffline(true);
await seite.waitForTimeout(700);
const streifen = await seite.evaluate(() => {
  const s = document.getElementById('offline-streifen');
  if (!s) return { da: false, bottom: 0, leisteTop: 0, flach: [] as string[], xBreit: 0 };
  const r = s.getBoundingClientRect();
  const leiste = document.getElementById('handy-unten')?.getBoundingClientRect();
  const flach = [...s.querySelectorAll('button')]
    .filter(k => k.getBoundingClientRect().height < 44)
    .map(k => `${(k.textContent ?? '').trim().slice(0, 12)} ${Math.round(k.getBoundingClientRect().height)}px`);
  const x = s.querySelector('button[data-a="zu"]');
  return { da: true, bottom: Math.round(r.bottom),
           leisteTop: leiste ? Math.round(leiste.top) : 9999, flach,
           xBreit: x ? Math.round(x.getBoundingClientRect().width) : 0 };
}) as { da: boolean; bottom: number; leisteTop: number; flach: string[]; xBreit: number };
p('Der Offline-Streifen erscheint', streifen.da);
p('Er liegt über der unteren Leiste, nicht auf ihr',
  streifen.da && streifen.bottom <= streifen.leisteTop,
  `Streifen endet bei ${streifen.bottom}, die Leiste beginnt bei ${streifen.leisteTop}`);
p('Beide Knöpfe des Streifens sind 44 px hoch',
  streifen.da && streifen.flach.length === 0, streifen.flach.join(', '));
p('Das ✕ ist 44 px breit', streifen.xBreit >= 44, `${streifen.xBreit}px`);
await seite.context().setOffline(false);
await seite.waitForTimeout(600);
p('Mit Verbindung verschwindet der Streifen wieder',
  await seite.evaluate(() => !document.getElementById('offline-streifen')));

console.log('\n7 · Import am Telefon: nur, was dort wirklich geht');

/* „Ganzen Ordner einlesen" können Telefon-Browser nicht, und eine Datei auf
   die Seite ziehen kann auf einem Touchscreen niemand — beides stand
   trotzdem da. Und die Rundgang-Einladung lag ÜBER dem offenen Blatt und
   verdeckte den untersten Eintrag. */
await seite.evaluate(() => { document.getElementById('btn-import')?.click(); });
await seite.waitForTimeout(500);
const imp = await seite.evaluate(() => {
  const m = document.querySelector('.menu');
  const z = (el: Element | null) =>
    el ? (Number(getComputedStyle(el as HTMLElement).zIndex) || 0) : null;
  return {
    da: !!m, blatt: !!m && m.classList.contains('blatt'),
    dateien: !!m?.querySelector('[data-i="dateien"]'),
    werkzeug: !!m?.querySelector('[data-i="werkzeug"]'),
    ordner: !!m?.querySelector('[data-i="ordner"]'),
    ziehen: /ziehen/i.test(m?.textContent ?? ''),
    einladungZ: z(document.getElementById('rg-einladung')),
    grundZ: z(document.querySelector('.menu-grund')),
  };
}) as { da: boolean; blatt: boolean; dateien: boolean; werkzeug: boolean;
        ordner: boolean; ziehen: boolean; einladungZ: number | null; grundZ: number | null };
p('Das Import-Blatt öffnet', imp.da && imp.blatt);
p('„Dateien wählen" und „Aus einem anderen Werkzeug" stehen drin',
  imp.dateien && imp.werkzeug);
p('„Ganzen Ordner einlesen" steht am Telefon nicht drin', !imp.ordner,
  'Ordnerwahl gibt es in Telefon-Browsern nicht — ein toter Knopf');
p('Kein Zieh-Hinweis am Telefon', !imp.ziehen,
  'auf einem Touchscreen zieht niemand eine Datei auf die Seite');
p('Die Einladung liegt nicht über dem offenen Blatt',
  imp.einladungZ === null || (imp.grundZ !== null && imp.einladungZ < imp.grundZ),
  `Einladung z=${imp.einladungZ}, Menü-Grund z=${imp.grundZ}`);
await seite.evaluate(() => { document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove()); });

await browser.close();
server.close();

console.log(`\n  Suite 78 — Fingergrössen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
