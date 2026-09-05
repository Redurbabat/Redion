/* Suite 396 — Die Palette sagt die Wahrheit über sich selbst (E400, Audit F09)
 * ============================================================================
 * F09 des Prüfberichts lautet nur: „Befehlsmenü mit Suche, zuletzt verwendet,
 * Favoriten". Gemessen gegen den heutigen Stand ist die erste Hälfte längst
 * gebaut — `Werkzeuge.palette()` kennt rund 111 Befehle und sucht unscharf.
 *
 * Beim Nachmessen kamen aber zwei Dinge heraus, die der Bericht nicht kannte
 * und die schlimmer sind als das, was er verlangt:
 *
 *   §1 Der Pfeil lief über die gezeichnete Liste hinaus — ab dem 61. Druck
 *      führte Enter einen Befehl aus, den niemand gesehen hatte.
 *   §2 Vier Stellen schrieben ein Kürzel an, das die Palette nicht öffnet.
 *   §3 Die abgeschnittene Liste sagt jetzt, wie viel fehlt — und schweigt,
 *      wenn nichts fehlt.
 *   §4 Willkommensseite und leeres Suchergebnis nennen dasselbe Kürzel.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja, alle vier Abschnitte, jeder mit einer eigenen Mutation. §2 ist der
 * wichtigste: er DRÜCKT die angeschriebene Taste und sieht nach, was aufgeht.
 * Genau das fehlte — `test222 §5` hält nur zwei Beschriftungen aneinander,
 * und die waren beide falsch.
 *
 *   node pruefungen/lauf/test396.mts
 * ==========================================================================*/
declare const Store: any; declare const App: any;
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9425;

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
await seite.evaluate(`(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
})()`);

const zu = async (): Promise<void> => {
  await seite.evaluate(`document.querySelectorAll('.overlay').forEach(o => o.remove())`);
  await seite.waitForTimeout(150);
};
const offen = async (): Promise<string> => await seite.evaluate(`(() => {
  if (document.querySelector('#cq')) return 'palette';
  if (document.querySelector('#q'))  return 'suche';
  if (document.querySelector('.overlay')) return 'anderes';
  return 'nichts';
})()`) as string;

/* ==========================================================================
 * §1 · DER PFEIL FÜHRT NICHTS AUS, WAS NICHT DASTEHT
 * --------------------------------------------------------------------------
 * Ohne Eingabe hält die Palette die ganze Liste: 163 Einträge, auf dem Bild
 * abgelesen als „103 weitere" unter 60 gezeichneten Zeilen. Vorher lief `i`
 * bis `treffer.length - 1`; ab 60 gab es keinen `.on`-Knopf mehr, und Enter
 * führte trotzdem aus — 103 Befehle waren erreichbar, ohne sichtbar zu sein.
 *
 * §55.2: `Math.min(treffer.length, GEZEIGT)` zurück auf `treffer.length`
 * gedreht → „Der gewählte Knopf steht auch da" fällt.
 * ======================================================================== */
console.log('\n1 · Der Pfeil bleibt in der gezeichneten Liste');
await zu();
await seite.keyboard.press('Control+Shift+K');
await seite.waitForTimeout(500);
gleich('Strg+Shift+K öffnet die Palette', await offen(), 'palette');

const lage = async (): Promise<any> => await seite.evaluate(`(() => {
  const res = document.querySelector('#cr');
  const knoepfe = res ? res.querySelectorAll('button[data-i]') : [];
  const an = res ? res.querySelector('button.on') : null;
  return {
    gezeichnet: knoepfe.length,
    hatGewaehlten: !!an,
    gewaehlterIndex: an ? Number(an.dataset.i) : -1,
    mehrzeile: (res && res.querySelector('.grp.mehr')
      ? res.querySelector('.grp.mehr').textContent : '') || ''
  };
})()`);

const l0 = await lage();
p('Ohne Eingabe stehen 60 Zeilen da', l0.gezeichnet === 60, `es sind ${l0.gezeichnet}`);
p('Und die erste ist gewählt', l0.hatGewaehlten && l0.gewaehlterIndex === 0);

/* HUNDERT MAL NACH UNTEN — mehr als gezeichnet ist, und mehr als die Liste
   lang war, als der Fehler entstand. */
for (let n = 0; n < 100; n++) await seite.keyboard.press('ArrowDown');
await seite.waitForTimeout(300);
const l1 = await lage();
p('Nach 100× ↓ ist der gewählte Knopf immer noch gezeichnet', l1.hatGewaehlten,
  'kein button.on im DOM — Enter würde etwas Unsichtbares ausführen');
p('Und er steht innerhalb der 60 Zeilen',
  l1.gewaehlterIndex >= 0 && l1.gewaehlterIndex <= 59, `Index ${l1.gewaehlterIndex}`);
gleich('Er steht genau auf der letzten gezeichneten Zeile', l1.gewaehlterIndex, 59);

/* GEGENPROBE: nach oben kommt man auch wieder zurück. Ohne sie wäre ein
   festgeklemmter Pfeil grün. */
for (let n = 0; n < 100; n++) await seite.keyboard.press('ArrowUp');
await seite.waitForTimeout(300);
const l2 = await lage();
gleich('100× ↑ führt zurück auf die erste Zeile', l2.gewaehlterIndex, 0);

/* ==========================================================================
 * §2 · WAS ANGESCHRIEBEN IST, ÖFFNET AUCH DAS, WAS DRAUFSTEHT
 * --------------------------------------------------------------------------
 * DER ABSCHNITT, DER GEFEHLT HAT. `test222 §5` vergleicht die Beschriftung
 * in `index.html` mit dem `kuerzel` im Register — beide waren vier Bögen
 * lang „Strg ⇧ P", und weil sie ÜBEREINSTIMMTEN, blieb es grün.
 *
 * Hier wird nicht verglichen, sondern GEDRÜCKT: der Prüflauf liest das
 * Kürzel vom Knopf ab, zerlegt es in Tasten und drückt genau die.
 *
 * §55.2: „Strg ⇧ P" in index.html zurückgeschrieben → dieser Abschnitt fällt.
 * ======================================================================== */
console.log('\n2 · Die angeschriebene Taste öffnet das Angeschriebene');
await zu();

/* ERST EINE SEITE ÖFFNEN — und das ist keine Kleinigkeit, sondern der
   Unterschied zwischen einem Wächter und einer Behauptung.

   Beim ersten Bau stand dieser Abschnitt OHNE offene Seite. Die Mutation
   „falsches Kürzel zurück in index.html" blieb daraufhin grün: der Prüflauf
   las „Strg ⇧ P" ab, drückte es — und `werkzeuge.ts:2683` fällt ohne offene
   Seite auf die Palette zurück. Der Wächter bestätigte also genau den
   Fehler, gegen den er geschrieben war.

   Mit offener Seite verschiebt Strg ⇧ P, und ein falsches Kürzel fällt
   sofort auf. */
const seiteId = await seite.evaluate(`(async () => {
  const s = Store.addPage(null, { text: 'Eine Seite', icon: '📄' });
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
  return s.id;
})()`) as string;
await seite.waitForTimeout(400);

/* „Strg ⇧ K" → Control+Shift+K. Nur die drei Zeichen, die im Haus vorkommen. */
const alsTaste = (wort: string): string | null => {
  const teile = wort.trim().split(/\s+/).filter(Boolean);
  const tasten: string[] = [];
  let buchstabe = '';
  for (const t of teile) {
    if (t === 'Strg' || t === 'Ctrl') tasten.push('Control');
    else if (t === '⇧' || t === 'Shift') tasten.push('Shift');
    else if (t === 'Alt') tasten.push('Alt');
    else if (/^[A-Za-z0-9]$/.test(t)) buchstabe = t.toUpperCase();
    else return null;
  }
  return buchstabe ? [...tasten, buchstabe].join('+') : null;
};

const angeschrieben = await seite.evaluate(`(() => {
  const lies = (id) => {
    const k = document.querySelector('#' + id + ' .k');
    return k ? k.textContent.trim() : '';
  };
  return { befehle: lies('btn-cmd'), suche: lies('btn-search') };
})()`) as any;

p('Am Knopf „Befehle" steht ein Kürzel', !!angeschrieben.befehle, 'leer');
p('Am Knopf „Suchen" steht ein Kürzel', !!angeschrieben.suche, 'leer');

const tasteBefehle = alsTaste(angeschrieben.befehle);
const tasteSuche = alsTaste(angeschrieben.suche);
p('Das Kürzel „Befehle" lässt sich als Taste lesen', !!tasteBefehle, angeschrieben.befehle);
p('Das Kürzel „Suchen" lässt sich als Taste lesen', !!tasteSuche, angeschrieben.suche);

if (tasteBefehle) {
  await zu();
  await seite.keyboard.press(tasteBefehle);
  await seite.waitForTimeout(500);
  gleich('„' + angeschrieben.befehle + '" öffnet wirklich die Palette',
    await offen(), 'palette');
}
if (tasteSuche) {
  await zu();
  await seite.keyboard.press(tasteSuche);
  await seite.waitForTimeout(500);
  gleich('„' + angeschrieben.suche + '" öffnet wirklich die Suche',
    await offen(), 'suche');
}

/* GEGENPROBE — und hier kam beim ersten Lauf etwas heraus, das ich nicht
   gesucht hatte. `werkzeuge.ts:2683` steht wörtlich:
   `if (p2) verschiebenNach(p2); else palette();`
   Strg ⇧ P fällt also OHNE offene Seite auf die Palette zurück. Das ist
   Absicht (das Kürzel soll nicht ins Leere gehen) — und zugleich der Grund,
   warum die falsche Beschriftung vier Bögen überlebte: auf dem
   Startbildschirm tut das alte Kürzel genau das, was danebenstand.

   Beide Hälften werden deshalb festgehalten, statt eine wegzunehmen: mit
   offener Seite verschiebt es, ohne öffnet es die Palette. Wer eines Tages
   den Rückfall entfernt, soll hier fallen und es bewusst tun. */
await zu();
await seite.keyboard.press('Control+Shift+P');
await seite.waitForTimeout(600);
p('Mit offener Seite öffnet Strg+Shift+P NICHT die Palette',
  await offen() !== 'palette', 'es geht die Palette auf — dann ist es doppelt belegt');
p('Sondern „Verschieben nach"',
  await seite.evaluate(`!!document.querySelector('.overlay')`), 'gar nichts geht auf');

/* Und der Rückfall, wenn keine Seite offen ist — dokumentiert, nicht zufällig. */
await zu();
await seite.evaluate(`App.oeffne(null)`);
await seite.waitForTimeout(600);
await zu();
await seite.keyboard.press('Control+Shift+P');
await seite.waitForTimeout(600);
gleich('Ohne offene Seite fällt Strg+Shift+P auf die Palette zurück',
  await offen(), 'palette');
p('Die Seite gab es wirklich', !!seiteId);

/* Und das Register sagt dasselbe wie der Knopf (§8: eine Wahrheit). */
const ausRegister = await seite.evaluate(`(() => {
  const e = Register.navigation.eines('befehle');
  return e ? String(e.kuerzel || '') : '';
})()`) as string;
gleich('Register und Seitenleiste sagen dasselbe', ausRegister, angeschrieben.befehle);

/* ==========================================================================
 * §3 · DIE ABGESCHNITTENE LISTE SAGT, WIE VIEL FEHLT — UND SCHWEIGT SONST
 * --------------------------------------------------------------------------
 * Die Regel dieses Projekts: eine Anzeige, die IMMER etwas anzeigt, wird
 * nicht gelesen. Der Satz „N weitere" darf deshalb nur dastehen, wenn
 * wirklich etwas abgeschnitten ist.
 *
 * §55.2: die Bedingung `treffer.length > GEZEIGT` auf `true` gedreht →
 * die Gegenprobe unten fällt.
 * ======================================================================== */
console.log('\n3 · Die Liste sagt, wenn sie abgeschnitten ist');
await zu();
await seite.keyboard.press('Control+Shift+K');
await seite.waitForTimeout(500);
const l3 = await lage();
p('Ohne Eingabe steht „N weitere" da', /\d+ weitere/.test(l3.mehrzeile), l3.mehrzeile);
p('Und die Zahl ist grösser als null',
  Number((l3.mehrzeile.match(/(\d+) weitere/) || [])[1] || 0) > 0, l3.mehrzeile);

/* GEGENPROBE: mit einer engen Suche passt alles, und dann schweigt sie. */
await seite.fill('#cq', 'papierkorb');
await seite.waitForTimeout(400);
const l4 = await lage();
p('Mit enger Suche sind es weniger als 60 Zeilen', l4.gezeichnet < 60,
  `${l4.gezeichnet} Zeilen`);
gleich('Und dann steht der Satz NICHT da', l4.mehrzeile, '');

/* ==========================================================================
 * §4 · KEIN ALTES KÜRZEL MEHR IM AUSGELIEFERTEN STAND
 * --------------------------------------------------------------------------
 * Vier Stellen schrieben „Strg ⇧ P" für die Palette an, darunter die
 * Willkommensseite, die jeder neue Nutzer liest. Zwei davon stehen in
 * Fliesstext und sind auf dem Bildschirm nur schwer zu greifen — deshalb
 * hier am gebauten Stand gemessen.
 *
 * Wichtig: „Strg ⇧ P" DARF weiter vorkommen — es ist das echte Kürzel für
 * „Verschieben nach". Gesucht wird nur die Verbindung mit BEFEHLEN.
 * ======================================================================== */
console.log('\n4 · Kein altes Kürzel mehr neben dem Wort „Befehle"');
const schaleJs = fs.readFileSync(path.join(WURZEL, 'quell/schale/aufbau/schale.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

p('Die Willkommensseite nennt Strg + Shift + K',
  /Strg \+ Shift \+ K öffnet alle Befehle/.test(schaleJs),
  'sie nennt noch das alte Kürzel');
p('Das leere Suchergebnis nennt Strg ⇧ K',
  /suche in den Befehlen[\s\S]{0,80}Strg ⇧ K/.test(schaleJs),
  'es verweist noch auf Strg ⇧ P');
p('Die Seitenleiste schreibt Strg ⇧ K an den Befehlsknopf',
  /id="btn-cmd"[\s\S]{0,200}Strg ⇧ K/.test(indexHtml));
/* Und der echte Besitzer des Kürzels ist noch da. Ohne diesen Punkt wäre
   ein zu grober Such-und-Ersetze-Lauf grün, der auch „Verschieben nach"
   umgeschrieben hätte. */
p('Strg ⇧ P steht weiterhin bei „Verschieben nach"',
  /Verschieben nach[\s\S]{0,80}Strg ⇧ P/.test(schaleJs),
  'der echte Besitzer des Kürzels ist mit verschwunden');

/* ======================================================================== */
p('Keine Fehler auf der Konsole', fehler.length === 0, fehler.join(' · '));

await browser.close();
server.close();
console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
