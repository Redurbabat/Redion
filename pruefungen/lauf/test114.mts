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

console.log('\n8 · Das R-Blatt: der Arbeitsbereich am Telefon');

/* Vorher zog der Kreis links oben die SEITENLEISTE des Rechners herein —
   Baum, Reiter, 33-px-Zeilen, auf 390 px geschoben. Jetzt ein Blatt über
   den ganzen Bildschirm mit Fingerzeilen. Am Rechner bleibt die
   Seitenleiste; Abschnitt 4 prüft weiter, dass sich dort nichts ändert. */
await seite.evaluate(() => document.getElementById('hl-konto')?.click());
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

/* UND DAS BLATT MUSS DIE PILLE MITNEHMEN. Es zeichnete dreimal eine
   Ansicht, ohne den Reiter zu setzen, den `handyLeiste()` liest — man
   landete im Posteingang, und oben stand noch „Start". Derselbe Fehler wie
   an den Reitern selbst, nur an einer Stelle, wo ihn niemand suchte. */
for (const [weg, erwartet] of [['seiten', 'Seiten'], ['mehr', 'Mehr'],
                               ['start', 'Start']] as [string, string][]) {
  await seite.evaluate(() => document.getElementById('r-blatt')?.remove());
  await seite.evaluate(() => document.getElementById('hl-konto')?.click());
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
await seite.evaluate(() => document.getElementById('hl-seiten')?.click());
await seite.waitForTimeout(700);

const seitenReiter = await seite.evaluate(() => {
  const oben = document.getElementById('handy-oben');
  const buehne = document.getElementById('page');
  if (!oben || !buehne) return null;
  const pillen = [...oben.querySelectorAll<HTMLElement>('button[role="tab"]')];
  const titel = [...buehne.querySelectorAll<HTMLElement>('.pt')];
  const zeilen = [...buehne.querySelectorAll<HTMLElement>('button')];
  const unten = document.getElementById('handy-unten');
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
    kiUnten: /KI fragen/.test(unten?.textContent || '')
  };
}) as { beschriftungen: string[]; aktiv: string[]; ueberschrift: string;
        abschnitte: string[]; kursiv: string[]; zuFlach: string[];
        kiUnten: boolean } | null;

p('Oben steht „Seiten"', seitenReiter?.beschriftungen.includes('Seiten') === true,
  (seitenReiter?.beschriftungen ?? []).join(' · '));
p('… und „Chats" steht nicht mehr da',
  seitenReiter?.beschriftungen.includes('Chats') === false);
p('Ein Tipp darauf öffnet den Seitenbereich',
  seitenReiter?.ueberschrift === 'Seiten', seitenReiter?.ueberschrift);
p('Die Pille wandert mit',
  seitenReiter?.aktiv.length === 1 && seitenReiter.aktiv[0] === 'Seiten',
  'aktiv: ' + (seitenReiter?.aktiv ?? []).join(', ') +
  ' — ohne Seitenleiste.reiter() bliebe sie auf „Start"');
p('Die Abschnitte aus der Vorgabe stehen da',
  ['Kürzlich verwendet', 'Favoriten', 'Privat'].every(
    a => (seitenReiter?.abschnitte ?? []).includes(a)),
  (seitenReiter?.abschnitte ?? []).join(' · '));
p('Die Titel sind aufrecht, nicht kursiv',
  (seitenReiter?.kursiv.length ?? 1) === 0, (seitenReiter?.kursiv ?? []).join(', '));
p('Keine Zeile ist unter 44 px', (seitenReiter?.zuFlach.length ?? 1) === 0,
  (seitenReiter?.zuFlach ?? []).join(', '));
p('Die KI ist unten geblieben', seitenReiter?.kiUnten === true,
  'Redur: „KI bleibt unten" — sie darf mit dem Reiter nicht verschwinden');

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
   letzte Pille stand ausserhalb des Bildes und war nicht antippbar. Am
   428er iPhone fiel das nie auf, und deshalb prüft dieser Abschnitt bei
   375 UND 390. */
for (const breite of [375, 390]) {
  const schmal = await browser.newPage({
    viewport: { width: breite, height: 844 }, hasTouch: true, isMobile: true
  });
  await schmal.goto(`http://localhost:${PORT}/index.html`);
  await schmal.waitForTimeout(2000);
  const zuBreit = await schmal.evaluate(() => {
    const l = document.getElementById('handy-oben');
    if (!l) return ['(keine Leiste)'];
    const raus: string[] = [];
    for (const id of ['hl-start', 'hl-seiten', 'hl-bespr', 'hl-mehr']) {
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
await seite.evaluate(() => document.getElementById('hu-neu')?.click());
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
    seitenVorher: Store.rootPages().length
  };
}) as { titel: string; wege: string[]; grund: boolean; zuFlach: string[];
        ohneSatz: number; amBoden: boolean; seitenVorher: number } | null;

p('Der Stift öffnet ein Blatt', !!blattNeu, 'er legte vorher sofort eine Seite an');
p('Es heisst „Neu erstellen"', blattNeu?.titel === 'Neu erstellen', blattNeu?.titel);
p('Es führt zu acht Sachen, nicht zu einer',
  (blattNeu?.wege.length ?? 0) === 8, (blattNeu?.wege ?? []).join(', '));
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

await browser.close();
server.close();

console.log(`\n  Suite 78 — Fingergrössen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
