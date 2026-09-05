/* Suite 419 — Am Telefon steht der Titel für sich (E426)
 * ============================================================================
 * Auf dem Telefonbild `db-list-handy` standen in Zeile 3 und 4:
 *
 *     Beric…      Fertig  Bericht  Abgabe   Anfang 20.08.2026 …
 *     Beric…      Prüfung Bericht  Abgabe   Anfang 03.09.2026 …
 *
 * Es sind „Bericht Kapitel 1" und „Bericht Kapitel 2". Auf 390 px blieben
 * dem Titel rund 55 px, und zwei VERSCHIEDENE Einträge sahen gleich aus.
 * Das ist der Fehler aus §55.1 in seiner reinsten Form: eine abgeschnittene
 * Anzeige zeigt etwas ANDERES, und beides sieht gültig aus.
 *
 * SELBST GEBAUT, UND ZWAR IN E425. Dort bekam der Titel `min-width:0`, damit
 * ein langer Titel am Rechner die Werte nicht aus dem Bild drückt. Am
 * Telefon ist genau das die falsche Richtung: dort ist nicht der Titel zu
 * lang, sondern die Zeile zu schmal für beides nebeneinander.
 *
 * Der Feed macht es an derselben Stelle richtig: Titel auf eigener Zeile,
 * Werte darunter. Die Liste bekommt dasselbe — aber nur am Telefon, denn am
 * Rechner ist die eine Zeile genau das, was eine Liste ausmacht.
 *
 *   §1 Am Telefon steht kein Titel abgeschnitten da.
 *   §2 Zwei verschiedene Einträge sehen verschieden aus.
 *   §3 Am Rechner bleibt die Zeile eine Zeile.
 *   §4 Und die Zeile bleibt gross genug zum Antippen (§37).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1/§2 → die Telefonregel herausnehmen. Gemessen: „Beric…" zweimal.
 *   §3    → die Regel ohne Medienabfrage setzen, dann stapelt auch der
 *           Rechner.
 * Beide gelaufen, Ergebnisse im Bericht zu E426.
 *
 *   node pruefungen/lauf/test419.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9541;

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

const bilderQuelle = fs.readFileSync(path.join(WURZEL, 'bilder.mts'), 'utf8');
const teil = bilderQuelle.slice(bilderQuelle.indexOf('const dbAufbau'),
                                bilderQuelle.indexOf('for (const l of DB_ANSICHTEN)'));
const vorlage = teil.slice(teil.indexOf('`') + 1, teil.lastIndexOf('`'));

const browser = await chromium.launch();
const fehler: string[] = [];

const messen = async (breite: number, handy: boolean) => {
  const ktx = await browser.newContext({
    viewport: { width: breite, height: 900 }, isMobile: handy, hasTouch: handy
  });
  const s = await ktx.newPage();
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.waitForTimeout(400);
  await s.evaluate(new Function(vorlage.replace('${layout}', 'list')) as any);
  await s.waitForTimeout(1200);
  const raus = JSON.parse(await s.evaluate(`JSON.stringify(
    [...document.querySelectorAll('.list-row')].map(z => {
      const t = z.querySelector('.lr-titel');
      const w = z.querySelector('.lr-werte');
      const tr = t ? t.getBoundingClientRect() : null;
      const wr = w ? w.getBoundingClientRect() : null;
      return {
        /* Der volle Text steht im DOM; abgeschnitten wird mit
           text-overflow. Beides zu haben ist der ganze Trick: so laesst
           sich messen, ob der Mensch noch sieht, was dasteht. */
        voll: t ? t.textContent.trim() : '',
        breit: tr ? Math.round(tr.width) : 0,
        noetig: t ? Math.round(t.scrollWidth) : 0,
        gestapelt: (tr && wr) ? (wr.top >= tr.bottom - 2) : false,
        hoehe: Math.round(z.getBoundingClientRect().height)
      };
    }))`) as string);
  await ktx.close();
  return raus;
};

/* ==========================================================================
 * §1 · AM TELEFON STEHT KEIN TITEL ABGESCHNITTEN DA
 * ========================================================================*/
console.log('\n§1 Am Telefon steht kein Titel abgeschnitten da');
const handy = await messen(390, true);
p('Es gibt Zeilen zu messen', handy.length >= 5, String(handy.length));
/* Zwei Pixel Spiel gegen die Rundung. Braucht der Titel mehr Platz als er
   hat, kuerzt der Browser ihn — und das ist der Befund. */
const beschnitten = handy.filter((z: any) => z.noetig > z.breit + 2);
p('Kein Titel wird gekürzt',
  beschnitten.length === 0,
  JSON.stringify(beschnitten.map((z: any) => z.voll + ': ' + z.breit + ' statt ' + z.noetig)));
p('Und der Titel steht ueber den Werten, nicht daneben',
  handy.every((z: any) => z.gestapelt === true),
  JSON.stringify(handy.map((z: any) => z.gestapelt)));

/* ==========================================================================
 * §2 · ZWEI VERSCHIEDENE EINTRÄGE SEHEN VERSCHIEDEN AUS
 * --------------------------------------------------------------------------
 * Der eigentliche Punkt, und er ist schärfer als „nicht gekürzt": zwei
 * Zeilen, deren Titel sich unterscheiden, dürfen auf dem Bildschirm nicht
 * gleich aussehen. „Bericht Kapitel 1" und „Bericht Kapitel 2" standen
 * beide als „Beric…" da.
 * ========================================================================*/
console.log('\n§2 Zwei verschiedene Einträge sehen verschieden aus');
const sichtbar = await browser.newContext({ viewport: { width: 390, height: 900 },
                                            isMobile: true, hasTouch: true });
const s2 = await sichtbar.newPage();
s2.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s2.goto(`http://localhost:${PORT}/index.html`);
await s2.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                         null, { timeout: 30000 });
await s2.waitForTimeout(400);
await s2.evaluate(new Function(vorlage.replace('${layout}', 'list')) as any);
await s2.waitForTimeout(1200);
/* Was ein Mensch SIEHT: der Text bis zur Stelle, an der der Browser kuerzt.
   Gemessen mit einer Range ueber die Zeichen, die noch im Kasten liegen. */
const gesehen = JSON.parse(await s2.evaluate(`JSON.stringify(
  [...document.querySelectorAll('.list-row .lr-titel')].map(t => {
    const kasten = t.getBoundingClientRect();
    const knoten = t.firstChild;
    if (!knoten || knoten.nodeType !== 3) return t.textContent.trim();
    const r = document.createRange();
    let bis = 0;
    for (let i = 1; i <= knoten.length; i++) {
      r.setStart(knoten, 0); r.setEnd(knoten, i);
      if (r.getBoundingClientRect().right > kasten.right + 1) break;
      bis = i;
    }
    return knoten.data.slice(0, bis).trim();
  }))`) as string);
await sichtbar.close();
const voll = handy.map((z: any) => z.voll);
p('Die Titel sind im DOM verschieden', new Set(voll).size === voll.length,
  JSON.stringify(voll));
p('Und auf dem Bildschirm auch',
  new Set(gesehen).size === gesehen.length, JSON.stringify(gesehen));

/* ==========================================================================
 * §3 · AM RECHNER BLEIBT DIE ZEILE EINE ZEILE
 * ========================================================================*/
console.log('\n§3 Am Rechner bleibt die Zeile eine Zeile');
const rechner = await messen(1280, false);
p('Auch dort gibt es Zeilen', rechner.length >= 5, String(rechner.length));
p('Titel und Werte stehen nebeneinander',
  rechner.every((z: any) => z.gestapelt === false),
  JSON.stringify(rechner.map((z: any) => z.gestapelt)));
p('Und kein Titel ist gekürzt',
  rechner.every((z: any) => z.noetig <= z.breit + 2),
  JSON.stringify(rechner.map((z: any) => z.breit + '/' + z.noetig)));

/* ==========================================================================
 * §4 · DIE ZEILE BLEIBT ZUM ANTIPPEN GROSS GENUG (§37)
 * ========================================================================*/
console.log('\n§4 Die Zeile bleibt zum Antippen gross genug');
p('Jede Zeile misst am Telefon mindestens 44 px',
  handy.every((z: any) => z.hoehe >= 44),
  JSON.stringify(handy.map((z: any) => z.hoehe)));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
