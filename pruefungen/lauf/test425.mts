/* Suite 425 — Der Umschalter: eine Wahl, mit der Tastatur bedienbar (E439)
 * ============================================================================
 * BEFUND. Redion hatte fuer „Liste oder Raster", „Aufbauen · Simulieren ·
 * Messen" und jede andere Wahl zwischen wenigen sich ausschliessenden
 * Moeglichkeiten kein gemeinsames Bauteil. Gemessen: nirgends im ganzen
 * `src/` ein `role="radiogroup"` oder etwas Gleichwertiges. Jede Stelle
 * baute sich ihre eigene Knopfreihe — und keine davon war mit der Tastatur
 * bedienbar.
 *
 * §38 sagt „Die Tastaturbedienung bleibt erhalten". Eine Knopfreihe, die
 * nur mit der Maus geht, verletzt das leise: sie sieht bedienbar aus.
 *
 *   §1 DAS BAUTEIL gibt es, und es traegt die richtige Rolle.
 *   §2 KLICKEN waehlt, und zwar genau eines.
 *   §3 DIE TASTATUR: Pfeile umlaufend, Pos1/Ende, und die Wahl WIRKT.
 *   §4 EIN TABSTOPP fuer die ganze Gruppe (roving tabindex).
 *   §5 VON AUSSEN setzen meldet NICHT zurueck.
 *   §6 DER STIL: sichtbarer Fokus, Markierung nicht nur ueber Farbe (§38),
 *      44 px auf dem Hauptweg (§37).
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §3 → das `waehlen(...)` aus dem Tastendruck nehmen: Fokus wandert,
 *        Wahl bleibt stehen.
 *   §4 → `tabIndex = an ? 0 : -1` durch `0` ersetzen.
 *   §6 → die `:focus-visible`-Regel entfernen.
 * Alle drei gelaufen, Ergebnisse im Bericht zu E439.
 *
 *   node pruefungen/lauf/test425.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9546;

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

const browser = await chromium.launch();
const fehler: string[] = [];
const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s.goto(`http://localhost:${PORT}/index.html`);
await s.waitForFunction("typeof App !== 'undefined' && typeof Segment !== 'undefined'",
                        null, { timeout: 30000 });
await s.waitForTimeout(500);

/* Einen Umschalter in eine leere Flaeche haengen — nicht in eine echte
   Ansicht. Geprueft wird das Bauteil, nicht sein erster Benutzer. */
await s.evaluate(`(() => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const platz = document.createElement('div');
  platz.id = 'seg-probe';
  platz.style.cssText = 'position:fixed;left:20px;top:80px;z-index:9000';
  document.body.append(platz);
  window.__protokoll = [];
  window.__griff = Segment.bauen({
    name: 'Ansicht',
    wahlen: [
      { id: 'liste',  name: 'Liste' },
      { id: 'raster', name: 'Raster' },
      { id: 'karten', name: 'Karten', kurz: 'K' }
    ],
    gewaehlt: 'liste',
    gewechselt: (id) => window.__protokoll.push(id)
  });
  platz.append(window.__griff.element);
})()`);

console.log('\n§1 Das Bauteil steht, mit der richtigen Rolle');
const bau = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const g = document.querySelector('#seg-probe .ru-seg');
  if (!g) return { fehlt: true };
  const knoepfe = [...g.querySelectorAll('[role="radio"]')];
  return {
    rolle: g.getAttribute('role'),
    name: g.getAttribute('aria-label'),
    anzahl: knoepfe.length,
    /* Ein echter <button>, kein <div> mit Klickgriff (Auftrag §1). */
    alleKnoepfe: knoepfe.every(k => k.tagName === 'BUTTON' && k.type === 'button'),
    gewaehlt: knoepfe.filter(k => k.getAttribute('aria-checked') === 'true').length,
    wert: window.__griff.wert()
  };
})())`) as string);
p('Die Gruppe ist eine Radiogruppe', bau.rolle === 'radiogroup', JSON.stringify(bau));
p('… und sagt, wonach sie fragt', bau.name === 'Ansicht', String(bau.name));
p('Drei Wahlen, alle echte Knöpfe', bau.anzahl === 3 && bau.alleKnoepfe === true,
  JSON.stringify(bau));
p('Genau eine ist gewählt', bau.gewaehlt === 1, String(bau.gewaehlt));
p('Und der Griff sagt, welche', bau.wert === 'liste', String(bau.wert));

console.log('\n§2 Klicken wählt — und genau eines');
const klick = JSON.parse(await s.evaluate(`(() => {
  document.querySelector('[data-seg-wahl="raster"]').click();
  const knoepfe = [...document.querySelectorAll('#seg-probe [role="radio"]')];
  return JSON.stringify({
    wert: window.__griff.wert(),
    gewaehlt: knoepfe.filter(k => k.getAttribute('aria-checked') === 'true').length,
    protokoll: window.__protokoll.slice()
  });
})()`) as string);
p('Der Wert folgt dem Klick', klick.wert === 'raster', String(klick.wert));
p('Es bleibt bei genau einer Wahl', klick.gewaehlt === 1, String(klick.gewaehlt));
p('Und der Wechsel wurde einmal gemeldet',
  klick.protokoll.length === 1 && klick.protokoll[0] === 'raster',
  JSON.stringify(klick.protokoll));
/* Zweimal dasselbe klicken darf nicht zweimal melden — sonst schreibt jede
   angeschlossene Ansicht doppelt. */
const nochmal = JSON.parse(await s.evaluate(`(() => {
  document.querySelector('[data-seg-wahl="raster"]').click();
  return JSON.stringify({ protokoll: window.__protokoll.slice() });
})()`) as string);
p('Dieselbe Wahl noch einmal meldet nicht noch einmal',
  nochmal.protokoll.length === 1, JSON.stringify(nochmal.protokoll));

console.log('\n§3 Die Tastatur wählt wirklich, nicht nur den Fokus');
await s.evaluate(`document.querySelector('[data-seg-wahl="raster"]').focus()`);
await s.keyboard.press('ArrowRight');
await s.waitForTimeout(80);
const rechts = await s.evaluate(`window.__griff.wert()`) as string;
p('Pfeil rechts geht eine Wahl weiter — und wählt sie', rechts === 'karten', rechts);
/* DER PUNKT, DER DEN UNTERSCHIED MACHT. Ein Umschalter, bei dem die
   Pfeiltaste nur den Fokus bewegt, sieht in jedem Bildschirmfoto richtig
   aus. Erst dieser Vergleich zeigt, ob die Wahl mitgeht. */
const nachPfeil = JSON.parse(await s.evaluate(`JSON.stringify({
  fokus: document.activeElement?.dataset?.segWahl || '',
  gewaehlt: [...document.querySelectorAll('#seg-probe [role="radio"]')]
    .find(k => k.getAttribute('aria-checked') === 'true')?.dataset?.segWahl || ''
})`) as string);
p('… und Fokus und Wahl stehen auf demselben Knopf',
  nachPfeil.fokus === 'karten' && nachPfeil.gewaehlt === 'karten',
  JSON.stringify(nachPfeil));
await s.keyboard.press('ArrowRight');
await s.waitForTimeout(80);
p('Am Ende läuft es um — auf die erste Wahl',
  await s.evaluate(`window.__griff.wert()`) === 'liste');
await s.keyboard.press('ArrowLeft');
await s.waitForTimeout(80);
p('Und rückwärts genauso', await s.evaluate(`window.__griff.wert()`) === 'karten');
await s.keyboard.press('Home');
await s.waitForTimeout(80);
p('Pos1 nimmt die erste', await s.evaluate(`window.__griff.wert()`) === 'liste');
await s.keyboard.press('End');
await s.waitForTimeout(80);
p('Ende nimmt die letzte', await s.evaluate(`window.__griff.wert()`) === 'karten');

console.log('\n§4 Ein Tabstopp für die ganze Gruppe');
const tab = JSON.parse(await s.evaluate(`JSON.stringify(
  [...document.querySelectorAll('#seg-probe [role="radio"]')]
    .map(k => ({ id: k.dataset.segWahl, tab: k.tabIndex })))`) as string);
p('Genau ein Knopf ist tabbar',
  tab.filter((k: any) => k.tab === 0).length === 1, JSON.stringify(tab));
p('… und zwar der gewählte',
  tab.find((k: any) => k.tab === 0)?.id === 'karten', JSON.stringify(tab));

console.log('\n§5 Von aussen setzen meldet nicht zurück');
const vonAussen = JSON.parse(await s.evaluate(`(() => {
  const vorher = window.__protokoll.length;
  window.__griff.setzen('liste');
  return JSON.stringify({ wert: window.__griff.wert(),
    neueMeldungen: window.__protokoll.length - vorher });
})()`) as string);
p('Der Wert ändert sich', vonAussen.wert === 'liste', String(vonAussen.wert));
/* Sonst baut jede Ansicht, die ihren Umschalter nachführt, eine Schleife:
   setzen → melden → speichern → setzen. */
p('… ohne einen Wechsel zu melden', vonAussen.neueMeldungen === 0,
  String(vonAussen.neueMeldungen));

console.log('\n§6 Der Stil: Fokus sichtbar, Markierung nicht nur Farbe, 44 px');
const stil = JSON.parse(await s.evaluate(`JSON.stringify((() => {
  const an = document.querySelector('#seg-probe [aria-checked="true"]');
  const aus = document.querySelector('#seg-probe [aria-checked="false"]');
  if (!an || !aus) return { fehlt: true };
  const a = getComputedStyle(an), b = getComputedStyle(aus);
  return {
    hoehe: Math.round(an.getBoundingClientRect().height),
    grundAnders: a.backgroundColor !== b.backgroundColor,
    rahmenAnders: a.borderTopColor !== b.borderTopColor,
    gewichtAnders: a.fontWeight !== b.fontWeight
  };
})())`) as string);
/* §37: 44 px auf den Hauptwegen. Ein Umschalter ist einer. */
p('Die Wahlflächen sind 44 px hoch (§37)', stil.hoehe >= 44, stil.hoehe + ' px');
/* §38: keine Information nur über Farbe. Drei Merkmale, nicht eines. */
p('Die Markierung wirkt über den Grund', stil.grundAnders === true);
p('… über den Rahmen', stil.rahmenAnders === true);
p('… und über das Schriftgewicht — nicht nur über Farbe (§38)',
  stil.gewichtAnders === true, JSON.stringify(stil));
const fokusRegel = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/bausteine.css'), 'utf8');
p('Es gibt eine sichtbare Fokusmarke',
  /\.ru-seg-wahl:focus-visible\{[^}]*outline:/.test(fokusRegel.replace(/\s+/g, '')));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
