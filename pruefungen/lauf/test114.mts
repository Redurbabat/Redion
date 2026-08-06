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
await browser.close();
server.close();

console.log(`\n  Suite 78 — Fingergrössen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
