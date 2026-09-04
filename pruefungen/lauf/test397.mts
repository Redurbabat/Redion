/* Suite 397 — Zuletzt und Angeheftet in der Palette (E401, Audit F09 Rest)
 * ============================================================================
 * Die zwei Halbworte aus F09, die beim Messen wirklich fehlten:
 * „zuletzt verwendet" und „Favoriten". Die Palette hatte nur `paletteOft`,
 * einen Zähler — der weiss nicht, was man gerade eben getan hat, und schon
 * gar nicht, was man oben HABEN will.
 *
 *   §1 Frisch ist frisch: ohne Vergangenheit keine Überschriften.
 *   §2 „Zuletzt" merkt sich die Reihenfolge, nicht die Zahl.
 *   §3 „Angeheftet" steht oben und überlebt das Neuladen.
 *   §4 Der Stern heftet an — er führt nicht aus.
 *   §5 Seiten sind keine Befehle und landen nicht im Gedächtnis.
 *   §6 `paletteOft` hat endlich einen Deckel, und der behält das Richtige.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja, jeder Abschnitt einzeln. §1 ist der Wächter gegen die Regel, an der
 * dieses Projekt am häufigsten scheitert: eine Überschrift, die IMMER
 * dasteht, wird nicht gelesen.
 *
 *   node pruefungen/lauf/test397.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9427;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const fehler: string[] = [];
const seite = await browser.newPage({ viewport: { width: 1360, height: 900 } });
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 160)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
const aufraeumen = `(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
})()`;
await seite.evaluate(aufraeumen);

const zu = async (): Promise<void> => {
  await seite.evaluate(`document.querySelectorAll('.overlay').forEach(o => o.remove())`);
  await seite.waitForTimeout(150);
};
const auf = async (): Promise<void> => {
  await zu();
  await seite.keyboard.press('Control+Shift+K');
  await seite.waitForTimeout(450);
};
/* Die Überschriften in der gezeichneten Reihenfolge — ohne die Zeile
   „N weitere", die keine Gruppe ist (E400). */
const koepfe = async (): Promise<string[]> => await seite.evaluate(`(() =>
  Array.from(document.querySelectorAll('#cr .grp'))
       .filter(e => !e.classList.contains('mehr'))
       .map(e => e.textContent.trim()))()`) as string[];
const zeilen = async (n = 6): Promise<string[]> => await seite.evaluate(`(() =>
  Array.from(document.querySelectorAll('#cr button[data-i]'))
       .slice(0, ${n})
       .map(b => b.querySelector('span:nth-child(2)').textContent.trim()))()`) as string[];
const merker = async (k: string): Promise<any> =>
  await seite.evaluate((s: string) => Store.getMeta(s, null), k);

/* ==========================================================================
 * §1 · FRISCH IST FRISCH — ohne Vergangenheit keine Überschriften
 * --------------------------------------------------------------------------
 * Die Regel, an der dieses Projekt am häufigsten scheitert: eine Anzeige,
 * die IMMER etwas anzeigt, wird nicht gelesen. Ein leeres „Zuletzt" über
 * einer frischen Palette wäre genau das.
 *
 * §55.2: die Bedingung `if (t)` beim Aufbau von `kopf` entfernt, oder die
 * Gruppen unbedingt gesetzt → dieser Abschnitt fällt.
 * ======================================================================== */
console.log('\n1 · Ohne Vergangenheit stehen die zwei Überschriften nicht da');
await seite.evaluate(`(() => {
  Store.setMeta('paletteOft', {});
  Store.setMeta('paletteZuletzt', []);
  Store.setMeta('paletteFest', []);
})()`);
await auf();
const k1 = await koepfe();
p('Keine Überschrift „Zuletzt"', k1.indexOf('Zuletzt') < 0, k1.slice(0, 4).join(' · '));
p('Keine Überschrift „Angeheftet"', k1.indexOf('Angeheftet') < 0, k1.slice(0, 4).join(' · '));
p('Aber die gewöhnlichen Gruppen stehen da', k1.length > 2, `${k1.length} Überschriften`);

/* ==========================================================================
 * §2 · „ZULETZT" MERKT SICH DIE REIHENFOLGE, NICHT DIE ZAHL
 * --------------------------------------------------------------------------
 * Das ist der ganze Unterschied zu `paletteOft`. A, dann B, dann wieder A —
 * ein Zähler sagt „A zweimal, B einmal", die Reihenfolge sagt „A, B".
 * ======================================================================== */
console.log('\n2 · „Zuletzt" ist eine Reihenfolge, kein Zähler');
const fuehreAus = async (name: string): Promise<void> => {
  await auf();
  await seite.fill('#cq', name);
  await seite.waitForTimeout(400);
  await seite.keyboard.press('Enter');
  await seite.waitForTimeout(500);
  await zu();
};
await fuehreAus('Papierkorb');
await fuehreAus('Tastenkürzel anzeigen');
gleich('Nach zwei Befehlen steht der jüngste vorn',
  (await merker('paletteZuletzt') || []).slice(0, 2),
  ['Tastenkürzel anzeigen', 'Papierkorb']);
await fuehreAus('Papierkorb');
gleich('Derselbe noch einmal rückt vor, ohne sich zu verdoppeln',
  (await merker('paletteZuletzt') || []).slice(0, 3),
  ['Papierkorb', 'Tastenkürzel anzeigen']);
const oft2 = await merker('paletteOft') || {};
gleich('Und der Zähler zählt weiter mit', oft2['Papierkorb'], 2);

await auf();
const k2 = await koepfe();
gleich('Jetzt steht „Zuletzt" ganz oben', k2[0], 'Zuletzt');
gleich('Und darunter die zwei in der richtigen Reihenfolge',
  (await zeilen(2)), ['Papierkorb', 'Tastenkürzel anzeigen']);

/* ==========================================================================
 * §3 · „ANGEHEFTET" STEHT OBEN UND ÜBERLEBT DAS NEULADEN
 * ======================================================================== */
console.log('\n3 · Angeheftetes steht oben und bleibt');
/* ZWEIMAL DANEBEN GEGRIFFEN, UND BEIDES WAR LEHRREICH. Erst stand hier
   „Exportieren" — den Befehl gibt es nicht. Dann „Als Markdown speichern" —
   den gibt es, aber nur bei OFFENER SEITE (`BRAUCHT_SEITE` filtert ihn
   sonst aus `befehle()`). Beide Male liess die Absicherung `if (t)` den
   Namen still fallen, und genau das soll sie: ein angehefteter Befehl, den
   es gerade nicht gibt, darf keine leere Zeile erzeugen.

   „Tastenkürzel anzeigen" steht immer zur Verfügung — §2 hat es eben
   ausgeführt. Der Fall „Name gibt es nicht mehr" bekommt weiter unten
   seinen eigenen Punkt. */
await seite.evaluate(`(() => {
  Store.setMeta('paletteZuletzt', ['Papierkorb']);
  Store.setMeta('paletteFest', ['Tastenkürzel anzeigen']);
})()`);
await auf();
const k3 = await koepfe();
gleich('„Angeheftet" steht vor „Zuletzt"', k3.slice(0, 2), ['Angeheftet', 'Zuletzt']);
gleich('Und der angeheftete Befehl ist die erste Zeile',
  (await zeilen(1)), ['Tastenkürzel anzeigen']);
p('Die Zeile trägt die Marke',
  await seite.evaluate(`!!document.querySelector('#cr button[data-ist-fest]')`));
p('Und sagt es dem Vorleseprogramm (§38)',
  /angeheftet/.test(String(await seite.evaluate(
    `(document.querySelector('#cr button[data-ist-fest]') || {})
       .getAttribute?.('aria-label') || ''`))));

await seite.reload();
await seite.waitForTimeout(2700);
await seite.evaluate(aufraeumen);
await auf();
gleich('Nach dem Neuladen steht es wieder oben',
  (await zeilen(1)), ['Tastenkürzel anzeigen']);

/* UND EIN NAME, DEN ES NICHT MEHR GIBT, ERZEUGT KEINE LEERE ZEILE.
   Befehle werden umbenannt; ein alter Name im Merker darf die Palette nicht
   mit einer Zeile ohne Inhalt verunstalten. */
await seite.evaluate(
  `Store.setMeta('paletteFest', ['Gibtsnichtmehr', 'Tastenkürzel anzeigen'])`);
await auf();
gleich('Ein verschwundener Befehl fällt still weg',
  (await zeilen(1)), ['Tastenkürzel anzeigen']);
p('Und „Angeheftet" steht trotzdem da', (await koepfe())[0] === 'Angeheftet');

/* GEGENPROBE: ein angehefteter Befehl führt auch die GEFILTERTE Liste an.
   Ohne sie wäre das Anheften nur Kosmetik für den Erstzustand. */
await seite.evaluate(`Store.setMeta('paletteFest', ['Papierkorb'])`);
await auf();
await seite.fill('#cq', 'papierkorb');
await seite.waitForTimeout(400);
gleich('Gefiltert steht der angeheftete zuerst', (await zeilen(1)), ['Papierkorb']);

/* ==========================================================================
 * §4 · DER STERN HEFTET AN — ER FÜHRT NICHT AUS
 * --------------------------------------------------------------------------
 * Der Stern sitzt IM Zeilenknopf (ein zweiter Knopf darin wäre ungültiges
 * HTML). Der Griff muss ihn deshalb VOR dem Knopf prüfen — sonst öffnet ein
 * Druck auf den Stern den Papierkorb, statt ihn anzuheften.
 *
 * §55.2: die drei Zeilen `const stern = …; if (stern…) return;` entfernt →
 * dieser Abschnitt fällt.
 * ======================================================================== */
console.log('\n4 · Der Stern heftet an, statt auszuführen');
await seite.evaluate(`Store.setMeta('paletteFest', [])`);
await auf();
await seite.fill('#cq', 'papierkorb');
await seite.waitForTimeout(400);
const vorher = await zeilen(1);
await seite.evaluate(`document.querySelector('#cr button[data-i] .fest').click()`);
await seite.waitForTimeout(400);
p('Die Palette ist noch offen', await seite.evaluate(`!!document.querySelector('#cq')`),
  'sie hat sich geschlossen — der Stern hat ausgeführt');
gleich('Der Befehl ist jetzt angeheftet', await merker('paletteFest'), vorher);
p('Und die Zeile trägt die Marke',
  await seite.evaluate(`!!document.querySelector('#cr button[data-ist-fest]')`));

/* Noch einmal drücken nimmt ihn wieder ab — eine Wahl, die nur in eine
   Richtung geht, ist keine. */
await seite.evaluate(`document.querySelector('#cr button[data-i] .fest').click()`);
await seite.waitForTimeout(400);
gleich('Noch einmal nimmt ihn wieder ab', await merker('paletteFest'), []);

/* Und die Taste tut dasselbe wie der Stern (§38: Tastaturbedienung). */
await seite.keyboard.press('Control+Enter');
await seite.waitForTimeout(400);
gleich('Strg+Enter heftet ebenfalls an', await merker('paletteFest'), vorher);
p('Auch dabei bleibt die Palette offen',
  await seite.evaluate(`!!document.querySelector('#cq')`));
p('Der Hinweis nennt die Taste',
  /Strg\+Enter anheften/.test(String(await seite.evaluate(
    `document.querySelector('.finder .hint').textContent`))));

/* ==========================================================================
 * §5 · SEITEN SIND KEINE BEFEHLE
 * --------------------------------------------------------------------------
 * Die Palette zeigt bei einer Eingabe auch bis zu sechs SEITEN. Deren Titel
 * landeten bisher ungefiltert im Zähler — in einer Liste „Zuletzt" wäre das
 * noch sichtbarer gewesen.
 * ======================================================================== */
console.log('\n5 · Ein Seitentitel landet nicht im Befehlsgedächtnis');
await zu();
await seite.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Zwiebelsuppe', icon: '🧅' });
  await Store.flush();
})()`);
await seite.evaluate(`(() => {
  Store.setMeta('paletteZuletzt', []); Store.setMeta('paletteOft', {});
})()`);
await auf();
await seite.fill('#cq', 'Zwiebelsuppe');
await seite.waitForTimeout(500);
const trefferSeite = await zeilen(1);
p('Die Seite steht in der Trefferliste',
  /Zwiebelsuppe/.test(trefferSeite[0] || ''), trefferSeite.join(' · '));
await seite.keyboard.press('Enter');
await seite.waitForTimeout(700);
gleich('Aber „Zuletzt" bleibt leer', await merker('paletteZuletzt'), []);
gleich('Und der Zähler auch', await merker('paletteOft'), {});

/* ==========================================================================
 * §6 · DER ZÄHLER HAT EINEN DECKEL — UND BEHÄLT DAS RICHTIGE
 * --------------------------------------------------------------------------
 * `paletteOft` war der einzige Verlauf im Haus ohne Obergrenze und wandert
 * über `indexdb.ts` in jede Sicherung. Beim Deckeln muss gewinnen, wer OFT
 * benutzt wurde — nicht, wer zufällig zuerst dastand.
 * ======================================================================== */
console.log('\n6 · Der Zähler wächst nicht mehr unbegrenzt');
await zu();
await seite.evaluate(`(() => {
  const m = {};
  /* 60 Namen, absichtlich in aufsteigender Häufigkeit: „alt-0" ist der
     seltenste und muss beim Deckeln als Erster fallen. */
  for (let n = 0; n < 60; n++) m['alt-' + n] = n + 1;
  Store.setMeta('paletteOft', m);
})()`);
gleich('Vorher sind es 60', Object.keys(await merker('paletteOft') || {}).length, 60);
await fuehreAus('Papierkorb');
const oft6 = await merker('paletteOft') || {};
gleich('Nach einer Ausführung sind es 50', Object.keys(oft6).length, 50);
p('Der seltenste ist weg', !('alt-0' in oft6));
p('Der häufigste ist da', 'alt-59' in oft6);
/* DER WICHTIGSTE PUNKT DIESES ABSCHNITTS. Beim ersten Bau fiel der gerade
   benutzte Befehl sofort wieder heraus: er steht mit Zähler 1 ganz unten,
   und der Deckel sortierte nur nach Häufigkeit. Man hätte etwas ausgeführt
   und es danach nicht in „Zuletzt" wiedergefunden. */
p('Und der gerade benutzte bleibt in jedem Fall', 'Papierkorb' in oft6,
  'er ist beim Deckeln herausgefallen');

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
