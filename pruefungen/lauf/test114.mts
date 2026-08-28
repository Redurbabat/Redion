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

/* DAS WILLKOMMEN WEGRÄUMEN — hier misst kein Erstbesucher.
   Seit §11 (E55) legt sich beim allerersten Öffnen ein Blatt über den
   ganzen Bildschirm. Das ist dort richtig und hier im Weg: es deckte in
   drei Abschnitten das ab, was gemessen werden sollte, und die Meldungen
   dazu („der Klick nach dem Loslassen hat das Menü geschlossen") zeigten
   auf ganz andere Ecken. Abschnitt 18 ruft es später ausdrücklich auf. */
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

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
  /* Die schwebende Leiste (`#handy-unten`) gibt es seit E236 nicht mehr;
     die Wegeleiste am unteren Rand heisst `#handy-oben` — der Name ist aus
     der Zeit, als sie oben stand, und wird nicht umbenannt, solange
     Prüfungen, CSS und Modul ihn kennen (§53.3, Grenze 2). Verdeckt
     werden darf sie so wenig wie ihre Vorgängerin. */
  const leiste = document.getElementById('handy-oben')?.getBoundingClientRect();
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

console.log('\n8 · Das R-Blatt: der Arbeitsbereich am Telefon');

/* Vorher zog der Kreis links oben die SEITENLEISTE des Rechners herein —
   Baum, Reiter, 33-px-Zeilen, auf 390 px geschoben. Jetzt ein Blatt über
   den ganzen Bildschirm mit Fingerzeilen. Am Rechner bleibt die
   Seitenleiste; Abschnitt 4 prüft weiter, dass sich dort nichts ändert. */
await seite.evaluate(() => document.getElementById('mb-konto')?.click());
await seite.waitForTimeout(450);
const blatt = await seite.evaluate(() => {
  const bl = document.getElementById('r-blatt');
  if (!bl) return null;
  const r = bl.getBoundingClientRect();
  const zeilen = [...bl.querySelectorAll<HTMLElement>('.rm-gruppe button')];
  const zu = bl.querySelector<HTMLElement>('.rm-zu');
  return {
    voll: Math.round(r.width) === innerWidth && Math.round(r.height) === innerHeight,
    anzahl: zeilen.length,
    zuFlach: zeilen.filter(z => z.getBoundingClientRect().height < 56)
      .map(z => (z.textContent || '').trim().slice(0, 16)),
    zuHoch: zu ? Math.round(zu.getBoundingClientRect().height) : 0,
    satz: /Alles bleibt auf diesem Gerät/.test(bl.textContent || ''),
    hatSichern: /Sichern/.test(bl.textContent || ''),
    hatPapierkorb: /Papierkorb/.test(bl.textContent || ''),
    hatKI: /KI und Verlauf/.test(bl.textContent || '')
  };
}) as { voll: boolean; anzahl: number; zuFlach: string[]; zuHoch: number;
        satz: boolean; hatSichern: boolean; hatPapierkorb: boolean; hatKI: boolean } | null;

p('Der Kreis öffnet ein Blatt', !!blatt, 'es kam keines — dann hängt noch die Schublade dran');
p('Es bedeckt den ganzen Bildschirm', blatt?.voll === true);
p('Es hat zwölf Wege', (blatt?.anzahl ?? 0) === 12, String(blatt?.anzahl));
p('Jede Zeile ist 56 px hoch', (blatt?.zuFlach.length ?? 1) === 0,
  (blatt?.zuFlach ?? []).join(', '));
p('Das Schliessen-Kreuz ist 44 px', (blatt?.zuHoch ?? 0) >= 44, String(blatt?.zuHoch));
p('Oben steht, was Redion ausmacht', blatt?.satz === true,
  '„Alles bleibt auf diesem Gerät" fehlt');
p('Sichern und Papierkorb sind erreichbar',
  blatt?.hatSichern === true && blatt?.hatPapierkorb === true);
p('Die KI ist hier erreichbar, auch ohne Reiter oben (E38)',
  blatt?.hatKI === true, 'sie hat oben keinen Platz mehr und muss hier stehen');

/* DER SPEICHERBALKEN (Vorgabe §16). Er gehört hierher: bei einer App, die
   alles auf dem Gerät hält, ist „wie viel liegt hier eigentlich?" die
   erste Frage nach „wo bin ich?". Er kommt NACH — `storage.estimate()` ist
   asynchron —, deshalb wird hier gewartet statt sofort gemessen. */
await seite.waitForTimeout(600);
const speicher = await seite.evaluate(() => {
  const sp = document.querySelector<HTMLElement>('#r-blatt .rm-speicher');
  if (!sp) return null;
  const bal = sp.querySelector<HTMLElement>('.rs-balken i');

  /* LIEGT ETWAS DARÜBER? Der Hinweisstreifen liegt auf z-index 900, das
     Blatt lag auf 700 — der Streifen stand mitten auf dem Speicherbalken.

     DER ERSTE ENTWURF DIESER PRÜFUNG WAR WERTLOS: er fragte
     `elementFromPoint` an der Stelle des Balkens ab und verliess sich
     darauf, dass gerade ein Streifen da ist. War keiner da — und in
     diesem Lauf ist keiner —, sagte sie „passt schon", auch mit dem
     alten z-index. Gegenprobe gemacht, nicht rot geworden.

     Jetzt legt der Lauf SELBST einen Streifen hin, genau wie der echte:
     `position:fixed`, z-index 900, über dem Balken. Bleibt das Blatt
     obenauf, stimmt die Schichtung wirklich. */
  const streifen = document.createElement('div');
  const r0 = sp.getBoundingClientRect();
  streifen.style.cssText =
    `position:fixed; z-index:900; left:${r0.left}px; top:${r0.top}px;` +
    `width:${r0.width}px; height:${r0.height}px; background:#f0f`;
  document.body.appendChild(streifen);
  const r = sp.getBoundingClientRect();
  const oben = document.elementFromPoint(r.left + r.width / 2, r.top + 14);
  const frei = !!oben && !!oben.closest('#r-blatt');
  streifen.remove();

  return { text: (sp.textContent || '').trim(),
           breite: bal ? bal.style.width : '', frei };
}) as { text: string; breite: string; frei: boolean } | null;

p('Der Speicherstand steht im Blatt', !!speicher, 'er kommt nach — asynchron');
p('… mit einer Zahl in MB oder GB', /\d+\s?(MB|GB)/.test(speicher?.text || ''),
  (speicher?.text || '').slice(0, 60));
p('… und einem Balken, der etwas zeigt',
  /%$/.test(speicher?.breite || '') && parseFloat(speicher?.breite || '0') > 0,
  speicher?.breite);
p('Nichts liegt über dem Blatt', speicher?.frei === true,
  'der Hinweisstreifen lag auf z-index 900 und das Blatt auf 700');

/* UND DAS BLATT MUSS DIE PILLE MITNEHMEN. Es zeichnete dreimal eine
   Ansicht, ohne den Reiter zu setzen, den `handyLeiste()` liest — man
   landete im Posteingang, und oben stand noch „Start". Derselbe Fehler wie
   an den Reitern selbst, nur an einer Stelle, wo ihn niemand suchte. */
/* Die Namen sind seit E132 andere: `hl-start` heisst „Heute". Die Wege im
   Blatt heissen weiter `mehr` und `start` — geprüft wird, dass sie den
   richtigen Weg markieren, nicht wie er beschriftet ist.

   `seiten` FEHLT HIER SEIT E236, und mit Absicht: der Workspace hat unten
   keinen Weg mehr, er steht im Mehr-Blatt. Dass dort NICHTS markiert wird,
   statt ersatzweise „Heute", prüft der Punkt weiter unten — das ist der
   Fall, den man leicht falsch macht. */
for (const [weg, erwartet] of [['mehr', 'Mehr'],
                               ['start', 'Heute']] as [string, string][]) {
  await seite.evaluate(() => document.getElementById('r-blatt')?.remove());
  await seite.evaluate(() => document.getElementById('mb-konto')?.click());
  await seite.waitForTimeout(400);
  await seite.evaluate((w) => {
    document.querySelector<HTMLElement>(`#r-blatt [data-r="${w}"]`)?.click();
  }, weg);
  await seite.waitForTimeout(600);
  const pille = await seite.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#handy-oben button.an')]
      .map(b => (b.textContent || '').trim()));
  p(`„${erwartet}" aus dem Blatt setzt auch die Pille oben`,
    pille.length === 1 && pille[0] === erwartet,
    'aktiv: ' + pille.join(', ') + ' — ohne reiter() zeigt sie noch auf den vorigen Bereich');
}

await seite.evaluate(() => document.getElementById('r-blatt')?.remove());

console.log('\n9 · Der Reiter „Seiten" — statt „Chats" (E38)');

/* Redur: „Chats raus aus der Hauptnavigation. Seiten rein. KI bleibt unten."
   Der Reiter oben führt jetzt in den Seitenbereich; die KI steht weiter in
   der unteren Leiste und im R-Blatt.
   ZWEI FEHLER STANDEN HIER, und beide sah erst das Bildschirmfoto:
   · Die Pille blieb auf „Start" stehen, während daneben schon die Seiten
     standen — `handyLeiste()` liest den Reiter, und den setzte niemand.
   · Die Titel waren kursiv, weil sie in einem `<em>` steckten. */
await seite.evaluate(() => {
  const a = Store.addPage(null, { text: 'Reisenotizen', icon: '🧳' });
  Store.addPage(a.id, { text: 'Unterseite' });
  Store.addPage(null, { text: 'Einkaufsliste', icon: '🛒', fav: true });
});
await seite.waitForTimeout(300);
/* „Seiten"/Workspace hat seit E236 keinen Weg mehr in der Leiste — er
   steht im Mehr-Blatt. Aufgerufen wird deshalb, was der Weg TUT. */
await seite.evaluate(() => { Produktwelten.workspace('start'); });
await seite.waitForTimeout(700);

const seitenReiter = await seite.evaluate(() => {
  const oben = document.getElementById('handy-oben');
  const buehne = document.getElementById('page');
  if (!oben || !buehne) return null;
  const pillen = [...oben.querySelectorAll<HTMLElement>('button[role="tab"]')];
  const titel = [...buehne.querySelectorAll<HTMLElement>('.pt')];
  const zeilen = [...buehne.querySelectorAll<HTMLElement>('button')];
  const kiKnopf = document.getElementById('mb-ki');
  return {
    beschriftungen: pillen.map(b => (b.textContent || '').trim()),
    aktiv: pillen.filter(b => b.classList.contains('an'))
                 .map(b => (b.textContent || '').trim()),
    ueberschrift: (buehne.querySelector('h1')?.textContent || '').trim(),
    abschnitte: [...buehne.querySelectorAll('h2,h3')].map(h => (h.textContent || '').trim()),
    kursiv: titel.filter(t => getComputedStyle(t).fontStyle !== 'normal')
                 .map(t => (t.textContent || '').trim().slice(0, 16)),
    zuFlach: zeilen.filter(z => { const h = z.getBoundingClientRect().height;
                                  return h > 0 && h < 44; })
                   .map(z => (z.textContent || '').trim().slice(0, 16)),
    kiOben: !!kiKnopf && kiKnopf.getBoundingClientRect().width > 0
  };
}) as { beschriftungen: string[]; aktiv: string[]; ueberschrift: string;
        abschnitte: string[]; kursiv: string[]; zuFlach: string[];
        kiOben: boolean } | null;

/* „Seiten" hat seit E236 keinen Weg mehr in der Leiste — er steht im
   Mehr-Blatt. Was hier bewacht wird, ist deshalb ein anderes und
   wichtigeres: dass die fünf Wege unten die fünf sind, die es sein
   sollen, und dass keiner markiert ist, wenn man woanders steht.

   „Wer nirgends in der Reiterleiste ist, soll dort auch nirgends markiert
   sein" — der Satz steht in `seitenleiste.ts` und ist der Grund, warum es
   keinen Rückfall auf „Start" gibt. Der Workspace ist genau so ein Ort. */
p('Unten stehen die fünf Wege',
  (seitenReiter?.beschriftungen ?? []).join(',') === 'Dokumente,Heute,Lernen,Termine,Mehr',
  (seitenReiter?.beschriftungen ?? []).join(' · '));
p('… und „Chats" steht nicht mehr da',
  seitenReiter?.beschriftungen.includes('Chats') === false);
p('Der Workspace geht auf',
  seitenReiter?.ueberschrift === '🧱 Workspace', seitenReiter?.ueberschrift);
p('Und keiner der fünf Wege behauptet, man sei dort',
  seitenReiter?.aktiv.length === 0,
  'aktiv: ' + (seitenReiter?.aktiv ?? []).join(', ') +
  ' — ein falsch markierter Weg ist schlimmer als kein markierter');
/* DER BEREICH IST EIN ANDERER GEWORDEN (E132): `hl-seiten` öffnet seit den
   Produktwelten die Workspace-Übersicht statt der alten Seitenliste. Die
   Absicht des Prüfpunkts bleibt — man muss finden, woran man zuletzt war,
   was man sich gemerkt hat und wie viel da ist. Die Namen dafür heissen
   jetzt anders. */
p('Die Abschnitte aus der Vorgabe stehen da',
  ['Zuletzt geöffnet', 'Favoriten', 'Dein Bestand'].every(
    a => (seitenReiter?.abschnitte ?? []).includes(a)),
  (seitenReiter?.abschnitte ?? []).join(' · '));
p('Die Titel sind aufrecht, nicht kursiv',
  (seitenReiter?.kursiv.length ?? 1) === 0, (seitenReiter?.kursiv ?? []).join(', '));
p('Keine Zeile ist unter 44 px', (seitenReiter?.zuFlach.length ?? 1) === 0,
  (seitenReiter?.zuFlach ?? []).join(', '));
/* DIE KI IST OBEN RECHTS, NICHT MEHR UNTEN (E236). Redurs Satz „KI bleibt
   unten" galt der schwebenden Leiste; die gibt es nicht mehr, weil unten
   die Navigation steht und zwei Leisten am unteren Rand eine zu viel
   wären. Er hat den Umzug selbst gewählt. Was bleibt, ist die Frage
   dahinter: verschwindet die KI mit dem Reiterwechsel? Nein — sie hängt
   in der Menüleiste und ist von jeder Ansicht aus da. */
p('Die KI ist von hier aus erreichbar', seitenReiter?.kiOben === true,
  'sie darf mit dem Reiterwechsel nicht verschwinden');

console.log('\n10 · Termine und Eingang führen dahin, wo sie hinführen sollen');

/* ZWEI FUNDE VOM 6. AUGUST, beide am Bildschirmfoto und nicht im Code:
   · „Termine" öffnete die SCHUBLADE — die Seitenleiste des Rechners auf
     390 px geschoben, genau das, wovon das R-Blatt weggekommen ist.
   · „Eingang" liess die Pille auf „Start" stehen. */
await seite.evaluate(() => document.getElementById('hl-bespr')?.click());
await seite.waitForTimeout(700);
const term = await seite.evaluate(() => ({
  ueberschrift: (document.querySelector('#page h1')?.textContent || '').trim(),
  aktiv: [...document.querySelectorAll<HTMLElement>('#handy-oben button.an')]
           .map(b => (b.textContent || '').trim()),
  schublade: document.body.classList.contains('side-offen'),
  hatKalender: /Kalender/.test(document.getElementById('page')?.textContent || '')
}));
p('„Termine" zeigt die Termine auf der Bühne', term.ueberschrift === 'Termine',
  term.ueberschrift);
p('… und zieht NICHT die Schublade auf', term.schublade === false,
  'die Seitenleiste des Rechners gehört nicht aufs Telefon (E38)');
p('Der Weg zum Kalender steht darin', term.hatKalender === true);
/* E132 kürzte den Namen am Telefon auf „Plan", weil die waagerechte Pille
   ihn sonst nicht fasste. Seit E236 steht die Leiste unten und die Namen
   stehen unter den Zeichen — dort passt „Termine", und die Bühne darüber
   heisst genauso. Zwei Namen für einen Ort waren einer zu viel. */
p('Die Pille steht auf „Termine"',
  term.aktiv.length === 1 && term.aktiv[0] === 'Termine', term.aktiv.join(', '));

await seite.evaluate(() => document.getElementById('hl-mehr')?.click());
await seite.waitForTimeout(700);
const ein = await seite.evaluate(() => {
  const link = document.querySelector<HTMLElement>('#page .pe-link');
  return {
    aktiv: [...document.querySelectorAll<HTMLElement>('#handy-oben button.an')]
             .map(b => (b.textContent || '').trim()),
    linkHoch: link ? Math.round(link.getBoundingClientRect().height) : -1,
    linkText: (link?.textContent || '').trim(),
    hatInbox: /Posteingang/.test(document.getElementById('page')?.textContent || '')
  };
});
p('Die Pille steht auf „Mehr"',
  ein.aktiv.length === 1 && ein.aktiv[0] === 'Mehr',
  ein.aktiv.join(', ') + ' — mit reiter(\'start\') stand hier „Start"');
p('Der Posteingang ist von hier aus erreichbar',
  ein.hatInbox === true,
  'er hat oben keinen eigenen Reiter mehr (E42 §6) und muss deshalb in Mehr stehen');
p('Jede Handlung darin ist 44 px hoch',
  ein.linkHoch === -1 || ein.linkHoch >= 44,
  `„${ein.linkText}" ist ${ein.linkHoch} px`);

console.log('\n11 · Der Codeblock: die Werkzeuge standen AUF dem Code');

/* GEMESSEN AM 6. AUGUST bei 390 px: der Kasten mit ⧉ № ↩ lag von x=175 bis
   252, die Sprachwahl von 248 bis 362, und die erste Codezeile lief
   darunter durch. Man las `const abfahr…` und dahinter drei Knöpfe.
   Derselbe Fehler wie die abgeschnittene Zahl in §55.1: was dasteht, ist
   nicht, was gemeint ist.

   UND EINE FALLE BEIM PRÜFEN: der Kasten des Codes ist nicht der Code.
   Mit `padding-top:64px` misst man Luft und nennt sie frei. Gemessen wird
   die erste Zeile selbst, über einen Range. */
await seite.evaluate(() => {
  const p = Store.addPage(null, { text: 'Codeprobe', icon: '💻' });
  Store.addBlock(p.id, 'code', { text: 'const abfahrt = "08:14";\nconsole.log(abfahrt);' });
  Store.addBlock(p.id, 'todo', { text: 'Ticket kaufen' });
  App.oeffne(p.id);
});
await seite.waitForTimeout(900);

const code = await seite.evaluate(() => {
  const kasten = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom };
  };
  const zeile = (() => {
    const e = document.querySelector('.b-code .ct');
    if (!e || !e.firstChild) return null;
    const rg = document.createRange(); rg.selectNodeContents(e);
    const r = rg.getClientRects()[0];
    return r ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null;
  })();
  const trifft = (a: any, b: any) => !!a && !!b && a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const werk = kasten(document.querySelector('.code-werk'));
  const wahl = kasten(document.querySelector('.b-code select'));
  return {
    gabEsCode: !!zeile,
    werkAufText: trifft(zeile, werk),
    wahlAufText: trifft(zeile, wahl),
    knoepfe: [...document.querySelectorAll<HTMLElement>('.code-werk button')]
      .map(b => Math.round(b.getBoundingClientRect().height)),
    wahlHoch: wahl ? Math.round(wahl.b - wahl.t) : 0,
    kasten: (() => {
      const i = document.querySelector<HTMLElement>('.b-todo input');
      return i ? Math.round(i.getBoundingClientRect().width) : 0;
    })(),
    seitenrand: parseInt(getComputedStyle(document.getElementById('page')!).paddingLeft, 10)
  };
});

p('Der Codeblock steht wirklich da', code.gabEsCode === true,
  'ohne Code misst der Rest dieses Abschnitts nichts');
p('Die Werkzeuge stehen NICHT auf dem Code', code.werkAufText === false,
  '⧉ № ↩ lagen quer über der ersten Zeile');
p('Die Sprachwahl steht NICHT auf dem Code', code.wahlAufText === false);
p('Die drei Werkzeuge sind 44 px hoch',
  code.knoepfe.length === 3 && code.knoepfe.every(h => h >= 44), code.knoepfe.join(', '));
p('Die Sprachwahl ist 44 px hoch', code.wahlHoch >= 44, String(code.wahlHoch));
p('Das Kästchen der Aufgabe ist grösser als 16 px', code.kasten >= 20,
  `${code.kasten} px — es war der kleinste Treffer der Seite`);
p('Der Seitenrand ist derselbe wie auf dem Start-Bildschirm',
  code.seitenrand >= 22, `${code.seitenrand} px, erwartet 28 (22 unter 380 px)`);

/* DIE LEISTE MUSS AUF DEN SCHMALEN GERÄTEN GANZ HINEINPASSEN. Gemessen bei
   390 px brauchte sie 395 px mit „Start" und 421 px mit „Eingang" — die
   letzte Pille stand ausserhalb des Bildes und war nicht antippbar.

   AM 428er FIEL DAS NIE AUF, und genau das war der Fehler dieser Prüfung:
   sie kannte 375 und 390, aber nicht 428 und nicht 393. Als die Tasten
   von 52 auf 56 px wuchsen (vier mal vier Pixel), kippte 428 auf 435 —
   und niemand hätte es gemerkt, weil die eine Breite, die niemand prüfte,
   ausgerechnet die häufigste grosse ist. Also alle vier gängigen. */
for (const breite of [428, 393, 390, 375, 360]) {
  const schmal = await browser.newPage({
    viewport: { width: breite, height: 844 }, hasTouch: true, isMobile: true
  });
  await schmal.goto(`http://localhost:${PORT}/index.html`);
  await schmal.waitForTimeout(2000);
  const zuBreit = await schmal.evaluate(() => {
    const l = document.getElementById('handy-oben');
    if (!l) return ['(keine Leiste)'];
    const raus: string[] = [];
    for (const id of ['hl-dok', 'hl-start', 'hl-bespr', 'hl-mehr']) {
      l.querySelectorAll('button[role="tab"]').forEach(b => b.classList.remove('an'));
      document.getElementById(id)?.classList.add('an');
      if (l.scrollWidth > l.clientWidth) {
        raus.push((document.getElementById(id)?.textContent || id).trim() +
                  ' (' + (l.scrollWidth - l.clientWidth) + ' px zu viel)');
      }
    }
    return raus;
  }) as string[];
  p(`Bei ${breite} px passen alle fünf Wege nebeneinander`, zuBreit.length === 0,
    zuBreit.join(', '));

  /* UND DER INHALT DARF NICHT DAHINTER LIEGEN — nur liegt die Leiste seit
     E236 UNTEN. Die Frage ist dieselbe geblieben, die Richtung nicht: der
     Rollkasten muss unten genau so viel freihalten, wie die Leiste hoch
     ist, sonst verschwindet die letzte Zeile dahinter.

     Der Fund, der diesen Punkt entstehen liess, gilt weiter und war oben:
     Leiste 76 px, freigehalten 60 — die obersten 16 px des Zurück-Knopfes
     lagen dahinter, und am iPhone wäre es die ganze Zeile gewesen, weil
     die Kerbe nur in der Leiste mitwuchs.

     Hier wird bei 0 px Kerbe gemessen. Was die Prüfung sichert, ist die
     Gleichheit der beiden Zahlen: solange BEIDE dieselbe Kerbe
     dazurechnen, hält sie auch auf dem Gerät. Freigehalten wird mehr als
     die Leiste hoch ist (24 px Luft) — geprüft wird deshalb „mindestens",
     nicht „genau". */
  const platz = await schmal.evaluate(() => ({
    leiste: Math.round(document.getElementById('handy-oben')!
              .getBoundingClientRect().height),
    frei: Math.round(parseFloat(
            getComputedStyle(document.getElementById('scroll')!).paddingBottom)),
    /* NICHT über `getComputedStyle` — das rechnet `env()` schon aus und
       liefert auf diesem Rechner `calc(80px + 0px)`. Ob die Kerbe
       überhaupt vorkommt, steht nur im Stilblatt selbst. */
    marke: (() => {
      let t = '';
      /* Über `rule.style`, nicht über `cssText`: eine Verschachtelungs-
         regel führt den ganzen Rumpf im Text mit, und in Chrome hat
         inzwischen JEDE Stilregel eine (leere) `cssRules` — wer daran
         entlangläuft, kommt an der Deklaration nie vorbei. */
      const geh = (r: CSSRuleList) => {
        for (const rr of [...r] as any[]) {
          const wert = rr.style?.getPropertyValue?.('--hunten');
          if (wert) t += wert.trim();
          if (rr.cssRules?.length) geh(rr.cssRules);
        }
      };
      for (const b of [...document.styleSheets]) {
        try { geh(b.cssRules); } catch { /* fremde Herkunft */ }
      }
      return t;
    })()
  }));
  p(`… und der Inhalt endet über ihr (${breite} px)`,
    platz.frei >= platz.leiste,
    `Leiste ${platz.leiste} px, freigehalten ${platz.frei} px`);
  if (breite === 428) {
    /* Der Teil, den dieser Rechner NICHT nachmessen kann. Hier ist die
       Kerbe 0, also stimmen die beiden Zahlen auch dann, wenn nur die
       Leiste sie mitrechnet. Auf dem iPhone wären es 47 px Unterschied.
       Also wird stattdessen geprüft, dass die gemeinsame Marke die Kerbe
       überhaupt kennt — die Leiste tut es nachweislich seit E37, und seit
       E236 heisst sie `--hunten` und meint den unteren Rand. */
    p('Der freigehaltene Platz rechnet die Kerbe des Geräts mit',
      /env\(\s*safe-area-inset-bottom/.test(platz.marke),
      platz.marke || '--hunten steht nirgends');
  }
  await schmal.close();
}

console.log('\n12 · Das Blatt „Neu erstellen" hinter dem Stift');

/* WAS DER STIFT VORHER TAT: sofort eine leere Seite anlegen. Richtig für
   den, der genau das will — eine Sackgasse für alle anderen. Redion kann
   Datenbanken, Tabellen, Aufgaben, Karteikarten, Dateien und Vorlagen, und
   keines davon war von hier aus erreichbar. Wer nicht wusste, dass es
   Karteikarten gibt, fand sie nie (Vorgabe §18, E45). */
await seite.evaluate(() => {
  document.querySelectorAll('.menu, .menu-grund, #r-blatt').forEach(x => x.remove());
});
/* `hu-neu` gab es in der schwebenden Leiste; seit E236 öffnet der
   „+ Neu"-Knopf im Regal dasselbe Blatt. Aufgerufen wird hier direkt die
   Funktion — welcher Knopf sie auslöst, prüft test37. */
await seite.evaluate(() => App.erstellenBlatt());
await seite.waitForTimeout(600);

const blattNeu = await seite.evaluate(() => {
  const m = document.querySelector<HTMLElement>('.menu.blatt');
  if (!m) return null;
  const kn = [...m.querySelectorAll<HTMLElement>('button[data-neu]')];
  const r = m.getBoundingClientRect();
  return {
    titel: (m.querySelector('.blatt-titel')?.textContent || '').trim(),
    wege: kn.map(b => b.dataset['neu'] || ''),
    grund: !!document.querySelector('.menu-grund'),
    zuFlach: kn.filter(b => b.getBoundingClientRect().height < 60)
               .map(b => (b.textContent || '').trim().slice(0, 16)),
    ohneSatz: kn.filter(b => !b.querySelector('.ne-txt i')).length,
    amBoden: Math.round(r.bottom) >= innerHeight - 1,
    seitenVorher: Store.rootPages().length,
    gruppen: [...m.querySelectorAll<HTMLElement>('.grp')].map(g => (g.textContent || '').trim()),
    listen: m.querySelectorAll('.menu-liste').length
  };
}) as { titel: string; wege: string[]; grund: boolean; zuFlach: string[];
        ohneSatz: number; amBoden: boolean; seitenVorher: number;
        gruppen: string[]; listen: number } | null;

p('Der Stift öffnet ein Blatt', !!blattNeu, 'er legte vorher sofort eine Seite an');
p('Es heisst „Neu erstellen"', blattNeu?.titel === 'Neu erstellen', blattNeu?.titel);
/* ELF SEIT E138: Aufnahme und Whiteboard sind dazugekommen (Auftrag §46).
   Beide Wege gab es vorher schon, nur nicht an der Stelle, an der man am
   Telefon etwas Neues anfängt. */
/* NEUNZEHN SEIT E236, und in sechs Gruppen. Redur hat ein Blatt
   beschrieben, das FRAGT, was entstehen soll — und dabei alles zeigt, was
   Redion kann. Dazugekommen sind: PDF einlesen, Aus anderem Werkzeug,
   Journal-Eintrag, Ordner, Blatt, Schaltplan, Diagramm, Lernzentrale.
   Die Zahl steht hier absichtlich hart: wächst das Blatt weiter, soll
   jemand diese Zeile lesen und entscheiden, ob es noch ein Wegweiser ist
   oder schon eine Liste. */
p('Es führt zu neunzehn Sachen inklusive Scanner, nicht zu einer',
  (blattNeu?.wege.length ?? 0) === 19 && (blattNeu?.wege ?? []).includes('scan'),
  (blattNeu?.wege ?? []).join(', '));
p('Die neuen Wege von E236 sind alle dabei',
  ['pdf', 'umzug', 'journal', 'ordner', 'blatt', 'plan', 'diagramm', 'lernen']
    .every(w => (blattNeu?.wege ?? []).includes(w)),
  (blattNeu?.wege ?? []).join(', '));
/* SECHS ÜBERSCHRIFTEN, EINE LISTE. Der erste Entwurf gab jeder Gruppe eine
   eigene `.menu-liste` — und die trägt am Telefon `flex:1`. Sechs davon
   teilten sich die Höhe und schnitten sich gegenseitig ab; gerollt hat
   keine. Im Bild war „Dokument scannen" halb weg. */
p('Sechs Überschriften ordnen die Wege', (blattNeu?.gruppen ?? []).length === 6,
  (blattNeu?.gruppen ?? []).join(' | '));
p('Und es ist EINE Liste, die rollt — nicht sechs, die sich abschneiden',
  blattNeu?.listen === 1, String(blattNeu?.listen) + ' Listen');
p('Aufnahme und Whiteboard stehen darunter',
  (blattNeu?.wege ?? []).includes('aufnahme') && (blattNeu?.wege ?? []).includes('board'),
  (blattNeu?.wege ?? []).join(', '));
p('Datenbank, Tabelle, Aufgabe und Karteikarte sind dabei',
  ['db', 'tabelle', 'aufgabe', 'karte'].every(w => (blattNeu?.wege ?? []).includes(w)),
  (blattNeu?.wege ?? []).join(', '));
p('Jede Zeile ist mindestens 60 px hoch', (blattNeu?.zuFlach.length ?? 1) === 0,
  (blattNeu?.zuFlach ?? []).join(', '));
/* Ohne den Satz darunter ist „Neue Tabelle" nur ein Wort — mit ihm weiss
   man, dass darin gerechnet wird. Das ist der Unterschied zwischen einer
   Liste und einem Wegweiser. */
p('Jede Zeile sagt in einem Satz, was sie tut',
  blattNeu?.ohneSatz === 0, String(blattNeu?.ohneSatz) + ' ohne Satz');
p('Es sitzt am unteren Rand', blattNeu?.amBoden === true);
p('Dahinter liegt ein Grund zum Wegtippen', blattNeu?.grund === true);

/* Und es tut auch etwas. „Neue Seite" muss weiterhin eine Seite anlegen —
   ein Blatt, das nur schön ist, hat den Stift verschlechtert. */
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('.menu.blatt [data-neu="seite"]')?.click();
});
await seite.waitForTimeout(700);
const danach = await seite.evaluate(() => ({
  seiten: Store.rootPages().length,
  blattWeg: !document.querySelector('.menu.blatt'),
  imTitel: document.activeElement?.id === 'title'
}));
p('„Neue Seite" legt wirklich eine an',
  danach.seiten === (blattNeu?.seitenVorher ?? 0) + 1,
  `vorher ${blattNeu?.seitenVorher}, nachher ${danach.seiten}`);
p('… und das Blatt geht dabei zu', danach.blattWeg === true);

console.log('\n13 · Das KI-Blatt kommt von unten (Vorgabe §19)');

/* ES SCHOB SICH BISHER VON RECHTS HEREIN — die Form, die am Rechner
   richtig ist, weil es dort eine Spalte NEBEN der Seite ist. Am Telefon
   gibt es kein Neben. Dort ist es ein Blatt, und es kommt von da, wo der
   Daumen es angetippt hat: von unten. */
await seite.evaluate(() => {
  document.querySelectorAll('.menu, .menu-grund, #r-blatt').forEach(x => x.remove());
});
await seite.evaluate(() => document.getElementById('mb-ki')?.click());
await seite.waitForTimeout(800);

const ki = await seite.evaluate(() => {
  const a = document.getElementById('ai');
  if (!a) return null;
  const r = a.getBoundingClientRect();
  const st = getComputedStyle(a);
  /* Wieder selbst einen Streifen hinlegen — der echte ist nicht immer da,
     und eine Prüfung, die auf Zufall wartet, ist keine (§55.2). */
  const streifen = document.createElement('div');
  streifen.style.cssText =
    `position:fixed; z-index:900; left:0; right:0; bottom:0; height:120px; background:#f0f`;
  document.body.appendChild(streifen);
  const oben = document.elementFromPoint(innerWidth / 2, innerHeight - 40);
  const frei = !!oben && (oben.id === 'ai' || !!oben.closest('#ai'));
  streifen.remove();
  return {
    offen: a.classList.contains('open'),
    amBoden: Math.round(r.bottom) >= innerHeight - 1,
    laesstLuft: r.top > 40,
    vollBreit: Math.round(r.width) === innerWidth,
    rund: parseInt(st.borderTopLeftRadius) >= 12,
    frei
  };
}) as { offen: boolean; amBoden: boolean; laesstLuft: boolean;
        vollBreit: boolean; rund: boolean; frei: boolean } | null;

p('Der KI-Knopf öffnet das Blatt', ki?.offen === true);
p('Es sitzt unten, nicht rechts', ki?.amBoden === true && ki?.vollBreit === true,
  JSON.stringify(ki));
/* Ein Blatt, das den ganzen Bildschirm nimmt, ist keine Überlagerung mehr,
   sondern eine neue Seite — man verliert das Gefühl, wo man herkam. */
p('… und lässt oben einen Streifen frei', ki?.laesstLuft === true);
p('… mit runden Ecken oben', ki?.rund === true);
p('Nichts liegt über dem Eingabefeld', ki?.frei === true,
  'der Hinweisstreifen liegt auf 900; ein Blatt zum Hineintippen muss darüber');

await seite.evaluate(() => App.kiPanel(false));
await seite.waitForTimeout(400);

console.log('\n14 · Die Suche: „Zuletzt gesucht" und ein ehrliches Leer (§17)');

/* DAS LEERE SUCHFELD IST DER HÄUFIGSTE ZUSTAND ÜBERHAUPT — man öffnet die
   Suche und hat noch nichts getippt. Ausgerechnet dort stand nichts.
   Menschen suchen wiederholt dasselbe; die letzten Begriffe als antippbare
   Marken sind die schnellste Abkürzung, die eine Suche haben kann. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove());
  Store.setMeta('suchverlauf', ['formel', 'sicherung', 'karteikarte']);
  App.suche();
});
await seite.waitForTimeout(700);

const su = await seite.evaluate(() => {
  const m = [...document.querySelectorAll<HTMLElement>('.sv-marken button')];
  return {
    kopf: (document.querySelector('.sv-kopf')?.textContent || '').trim(),
    marken: m.map(b => (b.textContent || '').trim()),
    hoehe: m[0] ? Math.round(m[0].getBoundingClientRect().height) : 0
  };
});
p('Das leere Suchfeld zeigt die letzten Suchen', su.marken.length === 3,
  JSON.stringify(su.marken) + ' — vorher stand dort nichts');
p('… unter einer Überschrift', su.kopf === 'Zuletzt gesucht', su.kopf);
p('… und die Marken sind mit dem Finger zu treffen', su.hoehe >= 40, String(su.hoehe));

/* Ein Tipp darauf sucht wirklich — eine Marke, die nur dasteht, ist Zierrat. */
await seite.evaluate(() => {
  document.querySelector<HTMLElement>('.sv-marken button')?.click();
});
await seite.waitForTimeout(500);
const nachTipp = await seite.evaluate(() =>
  (document.getElementById('q') as HTMLInputElement | null)?.value || '');
p('Ein Tipp auf eine Marke sucht danach', nachTipp === 'formel', nachTipp);

/* Und wenn nichts da ist, steht ein Satz statt einer leeren Fläche. */
await seite.evaluate(() => {
  const i = document.getElementById('q') as HTMLInputElement;
  i.value = 'zzqqxxyy'; i.dispatchEvent(new Event('input'));
});
await seite.waitForTimeout(500);
const leer = await seite.evaluate(() =>
  (document.querySelector('.such-leer')?.textContent || '').trim());
p('Nichts gefunden sagt, was man tun kann',
  /Nichts gefunden/.test(leer) && /Befehl/.test(leer), leer.slice(0, 70));

await seite.evaluate(() => document.querySelector('.overlay')?.remove());

console.log('\n15 · Leere Zustände sagen, was man tun kann (Vorgabe §13)');

/* „Noch keine Seiten" allein ist eine Feststellung; erst die Knöpfe daneben
   machen daraus einen Weg. Der zweite — Importieren — ist wichtiger, als
   er aussieht: wer gerade das Gerät gewechselt hat, will nicht anfangen,
   sondern zurückholen. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove());
  Object.values<any>(Store.cache.blocks).forEach((b: any) => {
    if (b.type === 'page') Store.updateBlock(b.id, { alive: false });
  });
  Ansichten.seiten();
});
await seite.waitForTimeout(600);

const lz = await seite.evaluate(() => {
  const el = document.querySelector<HTMLElement>('.leer-zustand');
  const kn = [...(el?.querySelectorAll<HTMLElement>('button') || [])];
  return {
    da: !!el,
    text: (el?.textContent || '').trim(),
    knoepfe: kn.map(b => (b.textContent || '').trim()),
    zuFlach: kn.filter(b => b.getBoundingClientRect().height < 44).length
  };
});
p('Ohne Seiten steht ein leerer Zustand da', lz.da === true,
  'vorher stand dort nur „Noch keine Seiten" in einer grauen Zeile');
p('… und er nennt zwei Wege', lz.knoepfe.length === 2, lz.knoepfe.join(', '));
p('… darunter das Zurückholen einer Sicherung',
  lz.knoepfe.includes('Importieren'),
  'wer das Gerät gewechselt hat, will nicht anfangen, sondern zurückholen');
p('… und beide sind mit dem Finger zu treffen', lz.zuFlach === 0);

console.log('\n16 · Die Suche am Telefon: Marken statt Auswahlfelder (§17, E48)');

/* VIER `<select>` NEBENEINANDER SIND AM RECHNER RICHTIG und am Telefon das
   Gegenteil. Dort öffnet jedes ein Systemrad über den halben Bildschirm —
   für „nur Titel" statt „Titel und Inhalt" sind das drei Handgriffe, und
   währenddessen sieht man die Trefferliste gar nicht mehr.
   Als runde Marken behalten sie ihre Funktion und brauchen einen Tipp.

   GEMESSEN WIRD DIE ZEILE, NICHT DAS STILBLATT. Der erste Entwurf schrieb
   `flex-wrap:wrap` — vier Marken zu 42 px in zwei Reihen sind 100 px, und
   das sind genau die 100 px, in denen die Treffer stehen. Ob die Zeile
   umbricht, sieht man nur an den Y-Werten der vier Felder. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove());
  App.suche();
});
await seite.waitForTimeout(600);

const fl = await seite.evaluate(() => {
  const leiste = document.querySelector<HTMLElement>('.such-filter');
  const sel = [...(leiste?.querySelectorAll<HTMLSelectElement>('select') || [])];
  const inp = document.getElementById('q') as HTMLInputElement | null;

  /* Passt der Platzhalter ins Feld? NICHT über `scrollWidth` — ein
     Platzhalter steht nicht im Inhalt und taucht dort nie auf. Also die
     Breite mit derselben Schrift nachrechnen. */
  let textBreite = 0, feldBreite = 0;
  if (inp) {
    const c = getComputedStyle(inp);
    const g = document.createElement('canvas').getContext('2d');
    if (g) {
      g.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
      textBreite = Math.round(g.measureText(inp.placeholder).width);
    }
    feldBreite = Math.round(inp.clientWidth
      - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight));
  }

  return {
    reihen: new Set(sel.map(x => Math.round(x.getBoundingClientRect().top))).size,
    zuFlach: sel.filter(x => x.getBoundingClientRect().height < 42).length,
    rund: sel.every(x => parseFloat(getComputedStyle(x).borderTopLeftRadius) >= 18),
    rollt: (leiste?.scrollWidth ?? 0) > (leiste?.clientWidth ?? 0),
    tastenZeile: !!document.querySelector<HTMLElement>('.hint-tasten')?.offsetParent,
    befehlsZeile: !!document.querySelector<HTMLElement>('.hint-befehle')?.offsetParent,
    textBreite, feldBreite
  };
});

p('Die vier Filter stehen in EINER Reihe', fl.reihen === 1,
  fl.reihen + ' Reihen — zwei Reihen kosten 100 px Trefferliste');
p('… sind mit dem Finger zu treffen', fl.zuFlach === 0, String(fl.zuFlach) + ' zu flach');
p('… sehen aus wie Marken, nicht wie Formularfelder', fl.rund === true);
p('… und die Zeile rollt seitwärts, statt umzubrechen', fl.rollt === true);

/* Ein gesetzter Filter muss man SEHEN, ohne ihn zu öffnen — sonst sucht
   man in einem Ausschnitt und weiss es nicht. */
const marke = await seite.evaluate(() => {
  const vorher = getComputedStyle(document.getElementById('f-typ')!).backgroundColor;
  const x = document.getElementById('f-typ') as HTMLSelectElement;
  x.value = 'datenbank';
  x.dispatchEvent(new Event('change', { bubbles: true }));
  const nachher = getComputedStyle(x).backgroundColor;
  const nachbar = getComputedStyle(document.getElementById('f-wo')!).backgroundColor;
  return { vorher, nachher, nachbar };
});
p('Ein gesetzter Filter sieht anders aus als ein leerer',
  marke.nachher !== marke.vorher && marke.nachher !== marke.nachbar,
  marke.vorher + ' → ' + marke.nachher + ' (Nachbar ' + marke.nachbar + ')');

/* Die Fusszeile nannte ↑ ↓, Enter und Esc. Keine dieser Tasten gibt es auf
   einer Telefontastatur — das war eine Anleitung für ein anderes Gerät. */
p('Die Tastenzeile ist am Telefon weg', fl.tastenZeile === false,
  'Esc gibt es dort nicht');
p('… die Suchbefehle bleiben — die gelten überall', fl.befehlsZeile === true);

/* Und der Platzhalter, der im Feld abbrach: „Suchen — auch typ:seite,
   in:Projekte, nach:202" liest sich wie ein Fehler. */
p('Der Platzhalter passt ins Suchfeld',
  fl.textBreite > 0 && fl.textBreite <= fl.feldBreite,
  fl.textBreite + ' px Text in ' + fl.feldBreite + ' px Feld');

await seite.evaluate(() => document.querySelector('.overlay')?.remove());

console.log('\n17 · Die Pille unter den Reitern gleitet, statt zu springen');

/* AUS DER BEWEGUNGS-VORGABE: „active tab indicator slides".
   Der Unterschied ist keine Zierde. Verschwindet die Fläche an einer
   Stelle und taucht an der nächsten auf, liest das Auge „hier ist etwas
   Neues" und muss die Stelle suchen. Wandert sie, folgt der Blick von
   selbst und ist beim Ankommen schon dort.

   EINE EIGENE SEITE MIT MITSCHRIFT. Die interessanteste Frage ist nicht,
   ob die Pille wandert, sondern ob sie es beim START NICHT tut: eine
   Pille, die sich beim Öffnen der App von der linken Kante hereinschiebt,
   ist eine Bewegung ohne Anlass.

   NICHT MEHR MIT BILDERN GEMESSEN. Die erste Fassung schrieb per
   requestAnimationFrame die Orte mit und verlangte „mehr als 10 Bilder,
   ein Ort". Unter Volllast der ganzen Suite malte der Browser aber nur
   ZWEI Bilder in 2,6 Sekunden — der Lauf wurde rot, obwohl die Pille
   stand wie sie soll. Der Prüfstand hungerte, nicht die App. Deshalb
   jetzt malunabhängig: `transitionstart` feuert auch dann, wenn kein
   einziges Bild gemalt wird. Rot werden kann der Punkt weiterhin — wer
   die stumm-Sperre aus `pilleSchieben` nimmt, gleitet beim Start und
   zählt hoch. */
const spurSeite = await browser.newPage({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true
});
await spurSeite.addInitScript(() => {
  (globalThis as any).__pilleFlog = 0;
  document.addEventListener('transitionstart', (e) => {
    const t = e.target as Element | null;
    if (t && t.id === 'ho-pille' && (e as TransitionEvent).propertyName === 'transform')
      (globalThis as any).__pilleFlog++;
  }, true);
});
await spurSeite.goto(`http://localhost:${PORT}/index.html`);
await spurSeite.waitForTimeout(2600);

const spur = await spurSeite.evaluate(() => {
  const an = document.querySelector<HTMLElement>('#handy-oben button.an');
  const pl = document.getElementById('ho-pille');
  return {
    flog: (globalThis as any).__pilleFlog as number,
    aktivX: an ? Math.round(an.getBoundingClientRect().left) : -1,
    aktivB: an ? Math.round(an.getBoundingClientRect().width) : -1,
    aktivGrund: an ? getComputedStyle(an).backgroundColor : '',
    pilleX: pl ? Math.round(pl.getBoundingClientRect().left) : -1,
    pilleB: pl ? Math.round(pl.getBoundingClientRect().width) : -1,
    pilleGrund: pl ? getComputedStyle(pl).backgroundColor : ''
  };
});
p('Beim Start steht die Pille sofort da, statt hereinzugleiten',
  spur.flog === 0, 'sie glitt ' + spur.flog + '×');
p('… und zwar genau auf dem aktiven Reiter',
  spur.pilleX === spur.aktivX && spur.pilleB === spur.aktivB,
  `Pille ${spur.pilleX}/${spur.pilleB}, Reiter ${spur.aktivX}/${spur.aktivB}`);
/* Zwei Flächen übereinander wären keine Wanderung, sondern eine Ankunft
   bei etwas, das schon da ist. Der Knopf gibt seinen Hintergrund ab. */
p('Der aktive Reiter bringt keinen eigenen Hintergrund mehr mit',
  /^rgba\(0, 0, 0, 0\)$|^transparent$/.test(spur.aktivGrund), spur.aktivGrund);
p('… den bringt die Pille', !/^rgba\(0, 0, 0, 0\)$/.test(spur.pilleGrund), spur.pilleGrund);

/* Und jetzt der Wechsel: unterwegs muss sie WIRKLICH unterwegs sein.

   AUCH HIER OHNE UHR UND OHNE BILDER. Die erste Fassung schlief 90 ms
   und las dann die Position — unter Volllast war nach 90 ms noch kein
   Bild gemalt, die Pille stand rechnerisch noch am Start, der Punkt
   wurde rot. Jetzt fragt der Punkt den Browser selbst: eine laufende
   CSS-Transition ist ein `getAnimations()`-Eintrag, ganz gleich, ob je
   ein Bild gemalt wird. Wer der Pille die transition nimmt, bekommt
   keinen Eintrag — der Punkt kann also weiter rot werden. Die Ankunft
   wird abgewartet statt abgepasst: der Zeitwert der Transition schreitet
   auch ohne Malen voran, `getBoundingClientRect` liest ihn jederzeit. */
const flug = await spurSeite.evaluate(async () => {
  const pl = document.getElementById('ho-pille')!;
  const ort = () => Math.round(pl.getBoundingClientRect().left);
  const start = ort();
  Seitenleiste.reiterWechseln('bespr');
  /* Die Transition entsteht mit dem Stilwechsel — kurz darauf ist sie
     als Animation sichtbar. Bis zu 600 ms darauf warten, dann aufgeben. */
  let unterwegs = false;
  for (let i = 0; i < 30 && !unterwegs; i++) {
    unterwegs = pl.getAnimations().some(a =>
      a instanceof CSSTransition && a.transitionProperty === 'transform');
    if (!unterwegs) await new Promise(f => setTimeout(f, 20));
  }
  const ziel = () => Math.round(
    document.getElementById('hl-bespr')!.getBoundingClientRect().left);
  const bis = Date.now() + 5000;
  while (Date.now() < bis && ort() !== ziel()) await new Promise(f => setTimeout(f, 40));
  return { start, unterwegs, ende: ort(), ziel: ziel() };
});
p('Beim Wechsel ist die Pille unterwegs zwischen den Reitern',
  flug.unterwegs && flug.ende !== flug.start,
  `Transition ${flug.unterwegs ? 'lief' : 'lief NICHT'}, ${flug.start} → ${flug.ende} (Ziel ${flug.ziel})`);
p('… und kommt genau an', flug.ende === flug.ziel, flug.ende + ' statt ' + flug.ziel);

/* „Kompass" hat oben keinen Reiter (E42). Dann gehört die Pille nirgendwo
   hin — und sie an den Anfang zu schieben wäre eine falsche Aussage. */
const ohne = await spurSeite.evaluate(async () => {
  Seitenleiste.reiterWechseln('kompass');
  await new Promise(f => setTimeout(f, 500));
  const pl = document.getElementById('ho-pille')!;
  return {
    deck: getComputedStyle(pl).opacity,
    markiert: document.querySelectorAll('#handy-oben button.an').length
  };
});
p('Wo kein Reiter zuständig ist, ist auch keine Pille',
  ohne.deck === '0' && ohne.markiert === 0,
  'Deckkraft ' + ohne.deck + ', markiert ' + ohne.markiert);

await spurSeite.close();

console.log('\n18 · Der Willkommensbildschirm (Vorgabe §11)');

/* WAS VORHER DASTAND, und warum es zu wenig war: eine kleine Einladung
   unten, „Neu hier? — Führung". Der Gedanke war richtig, aber sie
   beantwortete die eine Frage nicht, die der allererste Blick stellt:
   was ist das hier, und wohin gehören meine Daten?

   Redion ist local-first. Das ist der Grund, warum es die App gibt — und
   ausgerechnet das erfuhr niemand, bevor er anfing. Es stand in der
   README, die kein Mensch öffnet. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt, ' +
    '#rg-einladung, #rg-willkommen').forEach(x => x.remove());
  Rundgang.willkommen(true);
});
await seite.waitForTimeout(700);

const wk = await seite.evaluate(() => {
  const d = document.getElementById('rg-willkommen');
  const k = d?.querySelector<HTMLElement>('.wk-kasten');
  const wege = [...(d?.querySelectorAll<HTMLElement>('.wk-weg') || [])];
  const r = k?.getBoundingClientRect();
  return {
    da: !!d,
    rolle: d?.getAttribute('role'), modal: d?.getAttribute('aria-modal'),
    text: (d?.textContent || '').replace(/\s+/g, ' '),
    wege: wege.map(w => ({ a: w.dataset['a'],
                           h: Math.round(w.getBoundingClientRect().height) })),
    fokus: (document.activeElement as HTMLElement | null)?.dataset?.['a'] || '',
    /* Am Telefon ein Blatt von unten: es sitzt bündig unten und über die
       ganze Breite. */
    untenBuendig: r ? Math.round(innerHeight - r.bottom) <= 1 : false,
    volleBreite: r ? Math.round(r.width) === innerWidth : false,
    gesehen: !!Store.getMeta('rundgangGesehen', false)
  };
});
p('Beim ersten Öffnen steht ein Willkommen da', wk.da === true);
p('… und es ist ein Dialog', wk.rolle === 'dialog' && wk.modal === 'true',
  wk.rolle + '/' + wk.modal);
/* DER SATZ, UM DEN ES GEHT. Ohne ihn ist es ein hübscher Kasten. */
p('… der sagt, wo die Daten liegen',
  /auf deinem Gerät/.test(wk.text) && /Kein Konto/.test(wk.text),
  wk.text.slice(0, 100));
p('… und drei Wege anbietet', wk.wege.length === 3,
  JSON.stringify(wk.wege.map(w => w.a)));
/* DER ZWEITE IST DER, DEN MAN VERGISST. Wer gerade das Gerät gewechselt
   hat, will nicht anfangen, sondern zurückholen. */
p('… darunter das Einlesen einer Sicherung',
  wk.wege.some(w => w.a === 'import'),
  JSON.stringify(wk.wege.map(w => w.a)));
p('… alle drei mit dem Finger zu treffen',
  wk.wege.every(w => w.h >= 60), JSON.stringify(wk.wege.map(w => w.h)));
p('Der Fokus steht auf dem ersten Weg', wk.fokus === 'los', wk.fokus);
p('Am Telefon kommt es als Blatt von unten',
  wk.untenBuendig && wk.volleBreite,
  `unten bündig ${wk.untenBuendig}, volle Breite ${wk.volleBreite}`);
/* GEZEIGT IST GESEHEN. Eine Begrüssung, die bei jedem Öffnen kommt, ist
   eine Ermahnung. */
p('Gezeigt ist gesehen — es kommt nicht wieder', wk.gesehen === true);

/* Escape ist „später": nichts davon ist Pflicht. */
await seite.keyboard.press('Escape');
await seite.waitForTimeout(300);
p('Escape schliesst es', await seite.evaluate(() =>
  !document.getElementById('rg-willkommen')));


console.log('\n19 · Die Sicherungskarte sagt, dass sie arbeitet (§20)');

/* EINE `.redion`-SICHERUNG MIT ANHÄNGEN DAUERT. Bis hierher passierte in
   dieser Zeit auf der Karte nichts: der Knopf blieb, wie er war, und
   irgendwann kam ein Toast. Am Telefon steht der über der Aktionsleiste
   und ist nach 2,6 Sekunden weg — wer in dem Moment wegsieht, weiss nicht,
   ob überhaupt etwas geschieht, und tippt ein zweites Mal.

   Gemessen wird mit einer absichtlich langsamen Sicherung: der mittlere
   Zustand ist der, um den es geht, und er ist im Betrieb der kürzeste. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt, ' +
    '#rg-willkommen').forEach(x => x.remove());
  Store.setMeta('sicherung:zuletzt', '');       /* nie gesichert */
  Ansichten.start();
});
await seite.waitForTimeout(500);

const sich = await seite.evaluate(async () => {
  const w = window as any;
  w.__echtSichern = App.sicherungSpeichern;
  let gerufen = 0;
  (App as any).sicherungSpeichern = () => { gerufen++;
    return new Promise(f => setTimeout(f, 1500)); };

  const knopf = () => document.querySelector<HTMLButtonElement>('.home-sich button');
  const vorher = { text: (knopf()?.textContent || '').trim(),
                   gesperrt: !!knopf()?.disabled };

  knopf()?.click();
  await new Promise(f => setTimeout(f, 300));
  const b1 = knopf();
  const laeuft = {
    text: (b1?.textContent || '').trim(),
    kreisel: !!document.querySelector('.hs-kreisel'),
    gesperrt: !!b1?.disabled,
    /* Ein zweiter Klick darf keine zweite Sicherung starten. */
    dreht: b1 ? getComputedStyle(document.querySelector('.hs-kreisel')!)
      .animationName : ''
  };
  knopf()?.click();
  await new Promise(f => setTimeout(f, 1500));

  const b2 = knopf();
  const c2 = b2 ? getComputedStyle(b2) : null;
  const fertig = { text: (b2?.textContent || '').trim(),
                   klasse: b2?.className || '',
                   deck: c2?.opacity || '', farbe: c2?.color || '',
                   grund: c2?.backgroundColor || '' };

  (App as any).sicherungSpeichern = w.__echtSichern;
  return { vorher, laeuft, fertig, gerufen };
});

p('Vorher ist der Knopf ein gewöhnlicher Knopf',
  /sichern/i.test(sich.vorher.text) && !sich.vorher.gesperrt,
  JSON.stringify(sich.vorher));
p('Während des Sicherns sagt er es', /Sichern …/.test(sich.laeuft.text),
  sich.laeuft.text);
p('… mit einem Kreisel, der sich dreht',
  sich.laeuft.kreisel && sich.laeuft.dreht === 'hs-dreh', JSON.stringify(sich.laeuft));
/* EIN ZWEITER KLICK WÄHREND DES LAUFS wäre eine zweite Sicherung — bei
   Anhängen eine zweite Runde durch alle Dateien. */
p('… und ein zweiter Klick startet nichts Neues', sich.gerufen === 1,
  String(sich.gerufen) + ' Aufrufe');
p('Danach steht ein Haken da', /Gesichert/.test(sich.fertig.text) &&
  /✓/.test(sich.fertig.text), sich.fertig.text);
/* GESPERRT HEISST NICHT „NICHT GEMEINT". Der Knopf bleibt gesperrt, damit
   kein zweiter Lauf startet — aber die Erfolgsmeldung muss man lesen
   können. Gemessen war sie auf Grün bei 40 Prozent Deckkraft. */
p('… und man kann ihn lesen', parseFloat(sich.fertig.deck) >= 0.95,
  'Deckkraft ' + sich.fertig.deck);
p('… in der Farbe für Erfolg, nicht mehr im Akzent',
  sich.fertig.grund !== '' && sich.fertig.grund !== 'rgba(0, 0, 0, 0)' &&
  /fertig/.test(sich.fertig.klasse), sich.fertig.grund);


console.log('\n20 · Ein Klick ist ein Klick, auch nach dem zehnten Zeichnen');

/* DER FUND, DEN ABSCHNITT 19 NEBENBEI GEMACHT HAT. Er zählte zwei Klicks
   und bekam drei Aufrufe.

   `#page` bleibt stehen; nur sein Inhalt wird neu geschrieben. Der
   Start-Bildschirm hängte seinen Zuhörer mit `addEventListener` daran —
   und `start()` läuft bei JEDER Rückkehr zum Start. Nach dem dritten Mal
   legte ein Klick auf „Tagesjournal" drei Journale an; nach dem zehnten
   zehn. Bei „Jetzt sichern" mit Anhängen wären das zehn Läufe durch alle
   Dateien.

   Gemessen wird mit zehn Zeichnungen, weil eine oder zwei den Unterschied
   nicht zeigen — der Fehler wächst mit der Nutzungsdauer, und genau
   deshalb fällt er beim Ausprobieren nie auf. */
const mehrfach = await seite.evaluate(async () => {
  const w = window as any;
  w.__echtJournal = Werkzeuge.journal;
  let gerufen = 0;
  (Werkzeuge as any).journal = () => { gerufen++; };

  for (let i = 0; i < 10; i++) Ansichten.start();
  await new Promise(f => setTimeout(f, 300));
  document.querySelector<HTMLElement>('#page [data-a="journal"]')?.click();
  await new Promise(f => setTimeout(f, 200));

  (Werkzeuge as any).journal = w.__echtJournal;
  return gerufen;
});
p('Zehnmal gezeichnet, einmal geklickt, einmal ausgeführt', mehrfach === 1,
  String(mehrfach) + ' Aufrufe — jeder Zuhörer, der beim Zeichnen dazukommt, ' +
  'bleibt für immer');


console.log('\n21 · Die Einstellungen am Telefon (Vorgabe §12)');

/* DIE SCHLECHTESTE SEITE DER GANZEN APP, gemessen am 8. August bei 390 px:
   die Rechner-Aufteilung lief unverändert weiter — 236 px Navigation, und
   für den Inhalt blieben 129 Pixel. Jede Beschreibung brach in
   Einzelwörter um („Hell, dunkel oder wie das System" als sechs Zeilen),
   und die Auswahlfelder ragten über den Rand hinaus.

   Zwei Spalten passen nicht auf ein Telefon. Also zwei Seiten. */
await seite.evaluate(() => {
  document.querySelectorAll('.overlay, .menu, .menu-grund, #r-blatt').forEach(x => x.remove());
  Einstellungen.oeffne();
});
await seite.waitForTimeout(600);

const eList = await seite.evaluate(() => {
  const f2 = document.querySelector<HTMLElement>('.einst-fenster');
  const nav = document.querySelector<HTMLElement>('.einst-nav');
  const inh = document.querySelector<HTMLElement>('.einst-inhalt');
  const kn = [...(nav?.querySelectorAll<HTMLElement>('button[data-b]') || [])];
  const zu = document.querySelector<HTMLElement>('.einst-zu');
  return {
    blick: f2?.getAttribute('data-blick'),
    volleBreite: Math.round(nav?.getBoundingClientRect().width || 0) === innerWidth,
    inhaltWeg: inh ? getComputedStyle(inh).display === 'none' : false,
    zeilen: kn.length,
    zuFlach: kn.filter(b => b.getBoundingClientRect().height < 44).length,
    zuKlein: zu ? Math.round(zu.getBoundingClientRect().height) : 0
  };
});
p('Die Bereichsliste nimmt die ganze Breite',
  eList.volleBreite && eList.blick === 'liste', JSON.stringify(eList));
p('… und der Inhalt liegt nicht daneben', eList.inhaltWeg === true,
  'auf 390 px blieben dafür 129 px übrig');
p('… jede Zeile ist mit dem Finger zu treffen', eList.zuFlach === 0,
  String(eList.zuFlach) + ' von ' + eList.zeilen + ' zu flach');
p('Auch das ✕ ist ein Fingerziel', eList.zuKlein >= 44, String(eList.zuKlein));

const eBereich = await seite.evaluate(async () => {
  document.querySelector<HTMLElement>('.einst-nav [data-b="allgemein"]')?.click();
  await new Promise(f => setTimeout(f, 400));
  const f2 = document.querySelector<HTMLElement>('.einst-fenster');
  const nav = document.querySelector<HTMLElement>('.einst-nav');
  const st = [...document.querySelectorAll<HTMLElement>('.ez-steuer select, .ez-steuer input')];
  const zur = document.querySelector<HTMLElement>('.einst-zurueck');
  const z = document.querySelector<HTMLElement>('.ez-zeile');
  return {
    blick: f2?.getAttribute('data-blick'),
    navWeg: nav ? getComputedStyle(nav).display === 'none' : false,
    umbruch: z ? getComputedStyle(z).flexWrap : '',
    steuerHoch: st.slice(0, 4).map(x => Math.round(x.getBoundingClientRect().height)),
    /* DAS WAR DER SICHTBARE FEHLER: die Felder standen halb ausserhalb. */
    ueberRand: st.some(x => Math.round(x.getBoundingClientRect().right) > innerWidth),
    zurueck: !!zur && getComputedStyle(zur).display !== 'none',
    zurueckHoch: Math.round(zur?.getBoundingClientRect().height || 0)
  };
});
p('Ein Tipp führt eine Seite weiter', eBereich.blick === 'bereich' && eBereich.navWeg,
  JSON.stringify(eBereich));
p('… die Zeilen stapeln, statt sich zu quetschen', eBereich.umbruch === 'wrap',
  eBereich.umbruch);
p('… die Felder sind 44 px hoch und im Bild',
  eBereich.steuerHoch.every(h => h >= 44) && !eBereich.ueberRand,
  JSON.stringify(eBereich.steuerHoch) + ', über den Rand: ' + eBereich.ueberRand);
/* OHNE WEG ZURÜCK WÄRE DIE ZWEITE SEITE EINE SACKGASSE: das ✕ schliesst
   alles, und dann fängt man von vorn an. */
p('… und es gibt einen Weg zurück', eBereich.zurueck && eBereich.zurueckHoch >= 44,
  JSON.stringify(eBereich));

const zurueck = await seite.evaluate(async () => {
  document.querySelector<HTMLElement>('.einst-zurueck')?.click();
  await new Promise(f => setTimeout(f, 300));
  return document.querySelector<HTMLElement>('.einst-fenster')?.getAttribute('data-blick');
});
p('Der Weg zurück führt zur Liste', zurueck === 'liste', String(zurueck));

/* Der Hinweisstreifen liegt auf 900. Am Rechner ist das richtig — dort
   nimmt das Fenster nur die Mitte ein. Am Telefon füllt es alles, und
   dann lag „1 Karteikarte ist fällig" mitten in der Liste. */
const drueber = await seite.evaluate(() => {
  const o = document.querySelector<HTMLElement>('.overlay');
  const t2 = document.getElementById('toast');
  if (!o || !t2) return null;
  return { fenster: Number(getComputedStyle(o).zIndex) || 0,
           streifen: Number(getComputedStyle(t2).zIndex) || 0 };
});
p('Nichts liegt über den Einstellungen',
  !!drueber && drueber.fenster > drueber.streifen, JSON.stringify(drueber));

await seite.evaluate(() => document.querySelectorAll('.overlay').forEach(x => x.remove()));

/* ==========================================================================
 * 22 · Der Durchgang über ALLE Produktwelten (E232)
 * --------------------------------------------------------------------------
 * Die Abschnitte oben prüfen einzelne Orte, die je einmal auffällig waren.
 * Dieser hier fragt dieselbe Frage für jede Welt auf einmal — und hat damit
 * neunzehn Ziele gefunden, die keiner der einzelnen Punkte abdeckte:
 *
 *     30 × 44  „Zurück"          in JEDER Ansicht
 *     30 × 44  „Seitenoptionen"  in JEDER Ansicht
 *     40 hoch  die zweite Reiterzeile (Schule / Uni / Arbeit)
 *     37 breit „Uni" — drei Buchstaben, und der Nachbar klebt daneben
 *
 * DIE ERSTEN BEIDEN WAREN EINE BEWUSSTE ENTSCHEIDUNG, und die stand mit
 * Begründung in der CSS: „eine Kopfleiste ohne Titel ist schlimmer als eine
 * mit etwas schmaleren Knöpfen". Richtig gedacht — nur nie ausgerechnet.
 * Gemessen auf 390 px: die Krume hat 312 px, und 18 stehen frei. Beide
 * Knöpfe auf 44 kosten sie 28. Sie behält 284, ein Seitentitel braucht
 * selten mehr als 200.
 *
 * Eine Abwägung ohne Zahlen ist eine Vermutung. Mit Zahlen war sie in
 * zwei Minuten entschieden.
 * ========================================================================*/
console.log('\n22 · Jede Produktwelt am Telefon: nichts unter 44 px');

const WELTEN: [string, string, string?][] = [
  ['Lernzentrale', 'lernen'], ['Workspace', 'workspace'], ['Bibliothek', 'bibliothek'],
  ['Aufgaben', 'aufgaben'], ['Whiteboards', 'whiteboards'], ['Planung', 'planung'],
  ['Arbeit', 'lernen', 'arbeit'], ['Prüfungen', 'lernen', 'pruefungen']
];

for (const [wname, ruf, arg] of WELTEN) {
  try { await seite.evaluate(async (x: any) => {
    await (globalThis as any).Produktwelten[x.r]?.(x.a);
  }, { r: ruf, a: arg }); } catch { /* meldet der Punkt selbst */ }
  await seite.waitForTimeout(900);
  const klein = await seite.evaluate(() => {
    const raus: string[] = [];
    for (const e of document.querySelectorAll<HTMLElement>(
        '#main button, #main a[href], #main [role="button"], #main select, #main input')) {
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const st = getComputedStyle(e);
      if (st.visibility === 'hidden' || st.display === 'none') continue;
      if (r.top > innerHeight || r.bottom < 0) continue;
      if (Math.round(r.height) >= 44 && Math.round(r.width) >= 44) continue;
      const name = (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 18)
        || e.getAttribute('aria-label') || e.tagName;
      raus.push(`${Math.round(r.width)}×${Math.round(r.height)} „${name}"`);
    }
    return [...new Set(raus)];
  });
  p(`${wname}: jedes Ziel ist mindestens 44 × 44`, klein.length === 0, klein.join('  |  '));
}


await browser.close();
server.close();

console.log(`\n  Suite 78 — Fingergrössen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
