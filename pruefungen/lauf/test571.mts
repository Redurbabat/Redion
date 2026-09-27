/* Suite 571 — Ein Verlauf für alle Flächen (E687, Audit E681 D1)
 * ============================================================================
 * Whiteboard, Gedankenkarte und Planfläche hielten je einen eigenen
 * Rückgängig-Stapel — zwei Listen aus JSON-Abbildern, feste Tiefe (40, 40,
 * 60), dieselben vier Handgriffe. Whiteboard und Gedankenkarte Zeile für
 * Zeile gleich (vom Gegenprüfer des Audits bestätigt). Seit E687 wohnt die
 * Regel EINMAL in `src/core/gfx/history.ts` (`GfxHistory`), und die drei
 * rufen sie.
 *
 * DIESER LAUF BRAUCHT KEINEN BROWSER für den Kern (§1, §2) — wie test366
 * für den Strich: das gebaute `history.js` wird geladen und befragt. §3
 * liest die gebauten Dateien der drei Flächen: sie rufen den Kern, und
 * keine hält mehr einen eigenen Stapel.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Der Kern ist da, und er kennt weder Store noch DOM noch Fenster
 *      (ausser der einen Zeile, die ihn am Fenster anmeldet).
 *   2  Die Regel, wörtlich aus den drei Kopien: merken kappt bei der Tiefe
 *      und leert das Wiederholen; zurück/vor tauschen und geben null, wenn
 *      nichts da ist; letztenVerwerfen nimmt nur den Zurück-Schritt; leeren
 *      leert beides; die Tiefe ist mindestens 1.
 *   3  Whiteboard, Gedankenkarte und Planfläche rufen `GfxHistory.erstelle`
 *      und halten keinen eigenen Stapel mehr (`zurueckStapel`, `vorStapel`,
 *      `z.zurueck`, `z.vorwaerts` kommen nicht mehr vor). Die Markenschicht
 *      bleibt bewusst aussen vor (E378) — sie wird hier nicht verlangt.
 *
 * GEGEN DEN ALTEN STAND rot in §1 (die Datei gibt es nicht) und §3.
 * Gegenprobe im Kern: `merken` leert das Wiederholen nicht → §2 rot.
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
let ok = 0, weg = 0;
const p = (n: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

console.log('\n1 · Der Kern ist da und kennt nichts ausser sich selbst');
const datei = path.join(WURZEL, 'quell/core/gfx/history.js');
p('quell/core/gfx/history.js existiert', fs.existsSync(datei));
let G: any = null;
if (fs.existsSync(datei)) {
  const js = fs.readFileSync(datei, 'utf-8');
  p('Kein Store, kein document, kein App darin', !/\bStore\b|\bdocument\b|\bApp\b|\bUI\b/.test(js));
  (globalThis as any).window = globalThis;
  (0, eval)(js);
  G = (globalThis as any).GfxHistory;
  p('GfxHistory.erstelle ist eine Funktion', typeof G?.erstelle === 'function');
}

console.log('\n2 · Die Regel, wörtlich aus den drei Kopien');
if (G) {
  const h = G.erstelle(3);
  p('Leer: zurück gibt null', h.zurueck('jetzt') === null);
  p('Leer: vor gibt null', h.vor('jetzt') === null);
  p('Leer: kannZurueck/kannVor sind falsch', !h.kannZurueck() && !h.kannVor());
  h.merken('a'); h.merken('b'); h.merken('c'); h.merken('d');
  p('Tiefe 3: das älteste fällt heraus', JSON.stringify(h.stand()) === JSON.stringify({ zurueck: 3, vor: 0, tiefe: 3 }), JSON.stringify(h.stand()));
  p('zurück gibt das jüngste Abbild', h.zurueck('e') === 'd');
  p('… und legt das Jetzige aufs Wiederholen', h.kannVor() && h.stand().vor === 1);
  p('vor gibt es zurück', h.vor('d') === 'e' && h.stand().vor === 0 && h.stand().zurueck === 3);
  h.zurueck('e');                                   // vor: [e], zurück: [b, c]
  h.merken('f');
  p('merken leert das Wiederholen', !h.kannVor() && h.stand().vor === 0, JSON.stringify(h.stand()));
  h.zurueck('g');                                   // vor: [g]
  h.letztenVerwerfen();
  p('letztenVerwerfen nimmt nur den Zurück-Schritt', h.stand().vor === 1 && h.stand().zurueck === 1, JSON.stringify(h.stand()));
  h.leeren();
  p('leeren leert beides', JSON.stringify(h.stand()) === JSON.stringify({ zurueck: 0, vor: 0, tiefe: 3 }));
  p('Die Tiefe ist mindestens 1', G.erstelle(0).stand().tiefe === 1 && G.erstelle(-5).stand().tiefe === 1 && G.erstelle().stand().tiefe === 40);
  const k = G.erstelle(2); k.merken('x'); k.merken('y'); k.merken('z');
  p('Zwei Schritte zurück, dann null', k.zurueck('w') === 'z' && k.zurueck('z') === 'y' && k.zurueck('y') === null);
  p('Zwei Schritte vor, dann null', k.vor('y') === 'z' && k.vor('z') === 'w' && k.vor('w') === null);
} else {
  p('Die Regel lässt sich prüfen', false, 'kein Kern geladen');
}

console.log('\n3 · Die drei Flächen rufen den Kern und halten keinen eigenen Stapel');
const flaechen: Array<[string, string, RegExp]> = [
  ['Whiteboard', 'quell/bereiche/bloecke/arten/zeichenflaeche.js', /\bzurueckStapel\b|\bvorStapel\b/],
  ['Gedankenkarte', 'quell/bereiche/bloecke/arten/gedankenkarte.js', /\bzurueckStapel\b|\bvorStapel\b/],
  ['Planfläche', 'quell/bereiche/bloecke/arten/planflaeche.js', /z\.zurueck\b|z\.vorwaerts\b/],
];
for (const [name, rel, eigener] of flaechen) {
  const js = fs.readFileSync(path.join(WURZEL, rel), 'utf-8');
  p(`${name} ruft GfxHistory.erstelle`, /GfxHistory\.erstelle\(/.test(js));
  p(`${name} hält keinen eigenen Stapel mehr`, !eigener.test(js));
}
p('index.html lädt den Kern vor den Flächen', (() => {
  const h = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf-8');
  const a = h.indexOf('quell/core/gfx/history.js'), b = h.indexOf('quell/bereiche/bloecke/arten/zeichenflaeche.js');
  return a > 0 && b > 0 && a < b;
})());
p('Der GRUNDSTOCK des Dienst-Arbeiters kennt ihn (§28)', /quell\/core\/gfx\/history\.js/.test(fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf-8')));

console.log(`\n${ok} ok, ${weg} rot`);
process.exit(weg ? 1 : 0);
