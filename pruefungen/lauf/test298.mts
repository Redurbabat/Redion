/* Suite 298 — Keine Farbe aus einer Variablen, die es nicht gibt (E304)
 * ============================================================================
 * Gefunden beim Bau des Lernplan-Schalters (E303), und zwar auf dem Bild: der
 * nicht gewählte Knopf hatte keinen Rand. Nachgemessen im laufenden Programm:
 *
 *     border: 1px solid var(--rand)   →   border-top-width: 0px
 *
 * `--rand` ist in Redion NIRGENDS definiert. Ein `var()` ohne Wert und ohne
 * Ersatzwert macht die ganze Eigenschaft ungültig — bei `border` heisst das
 * nicht „schwarz" oder „geerbt", sondern GAR KEIN RAND. Bei `background`
 * heisst es durchsichtig.
 *
 * Betroffen waren acht Stellen, sieben davon älter als dieser Tag: der Rand
 * des Papiers, der Rand der Werkzeugleiste darüber, der Trennstrich zwischen
 * den Werkzeugen, eine Datenbankkante und ihr Überfahr-Hintergrund. Alle
 * unsichtbar, und niemandem aufgefallen — weil ein fehlender Rand aussieht
 * wie eine Gestaltungsentscheidung.
 *
 * DIESE SUITE IST DER WÄCHTER DAGEGEN, und sie kann nur eines: nachsehen, ob
 * jede benutzte Variable auch irgendwo herkommt.
 *
 *   §1 JEDE `var(--x)` OHNE ERSATZWERT hat eine Quelle — CSS oder JavaScript.
 *   §2 GEGENPROBE: eine erfundene Variable wird gemeldet.
 *   §3 UND DER GEMESSENE FALL: `--rand` kommt nicht zurück.
 *
 *   node pruefungen/lauf/test298.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const dateien = (verz: string, endung: RegExp): string[] => {
  const raus: string[] = [];
  const lauf = (d: string): void => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const pf = path.join(d, e.name);
      if (e.isDirectory()) lauf(pf);
      else if (endung.test(e.name)) raus.push(pf);
    }
  };
  lauf(verz);
  return raus;
};

const cssDateien = [
  ...dateien(path.join(WURZEL, 'quell/schale/stil'), /\.css$/),
  ...dateien(path.join(WURZEL, 'oeffentlich'), /\.css$/)
];
const tsDateien = dateien(path.join(WURZEL, 'src'), /\.ts$/);

/* WOHER EINE VARIABLE KOMMEN DARF, und beides zählt gleich:
   · aus einer CSS-Regel  `--x: wert`
   · aus dem Code         `style.setProperty('--x', …)` — davon lebt Redion
     an mehreren Stellen (die Blattbreite, die Höhe des Vorführbalkens, der
     sichtbare Ausschnitt über der Telefontastatur). */
const gesetzt = new Set<string>();
for (const f of [...cssDateien, ...tsDateien]) {
  const t = fs.readFileSync(f, 'utf-8');
  /* Das Anführungszeichen darf dazwischenstehen: im TypeScript heissen die
     Schlüssel `'--blatt-zeile': hoch(8.75)`, und ohne diese Nachsicht meldete
     der erste Entwurf sieben Papiermasse als quellenlos — sie stehen dort
     sehr wohl, nur in Anführungszeichen. */
  for (const m of t.matchAll(/(--[a-zA-Z0-9_-]+)['"`]?\s*:/g)) gesetzt.add(m[1]!);
  for (const m of t.matchAll(/setProperty\(\s*['"`](--[a-zA-Z0-9_-]+)/g)) gesetzt.add(m[1]!);
}

/* Benutzt wird sie mit `var(--x)`. Ein `var(--x, ersatz)` ist ausdrücklich in
   Ordnung — dort steht ja, was gelten soll, wenn es sie nicht gibt. */
const ohneQuelle: string[] = [];
const stellen: Record<string, number> = {};
for (const f of cssDateien) {
  const t = fs.readFileSync(f, 'utf-8');
  for (const m of t.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)) {
    const name = m[1]!;
    if (gesetzt.has(name)) continue;
    stellen[name] = (stellen[name] || 0) + 1;
    const kurz = path.relative(WURZEL, f);
    if (!ohneQuelle.includes(name + '  (' + kurz + ')'))
      ohneQuelle.push(name + '  (' + kurz + ')');
  }
}

console.log('\n1 · Jede Variable ohne Ersatzwert hat eine Quelle');
console.log(`   ${cssDateien.length} Stilblätter, ${gesetzt.size} bekannte Variablen.`);
p('Es gibt überhaupt Stilblätter zu lesen', cssDateien.length >= 3,
  String(cssDateien.length));
p('Und der Leser findet die bekannten Variablen', gesetzt.has('--line'),
  String(gesetzt.size));
p('KEINE Variable ohne Quelle', ohneQuelle.length === 0,
  ohneQuelle.slice(0, 8).join(' | '));

console.log('\n2 · Gegenprobe: eine erfundene Variable wird gemeldet');
/* Der Name wird zusammengesetzt, damit er nicht als Zeichenkette in dieser
   Datei steht — sonst fände der Leser oben seine eigene Erfindung, wenn
   `pruefungen/` je mitgelesen würde. */
const erfunden = '--gibt' + 'EsSicherNicht';
p('Der erfundene Name ist wirklich unbekannt', !gesetzt.has(erfunden), erfunden);
const probe = 'a{border:1px solid var(' + erfunden + ')}';
const gefunden = [...probe.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)]
  .map(m => m[1]!).filter(n => !gesetzt.has(n));
p('Und der Leser meldet ihn', gefunden.length === 1 && gefunden[0] === erfunden,
  JSON.stringify(gefunden));
/* Und ein Ersatzwert macht ihn wieder in Ordnung — sonst wäre der Wächter
   lästig statt nützlich. */
const mitErsatz = 'a{border:1px solid var(' + erfunden + ', #ccc)}';
const gefunden2 = [...mitErsatz.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g)];
p('Mit Ersatzwert schweigt er', gefunden2.length === 0);

console.log('\n3 · Der gemessene Fall: `--rand` kommt nicht zurück');
const alleCss = cssDateien.map(f => fs.readFileSync(f, 'utf-8')).join('\n');
p('`var(--rand)` steht nirgends mehr', !alleCss.includes('var(--rand)'));
p('Und `--line` ist da, wo es hingehört',
  (alleCss.match(/var\(--line\)/g) || []).length >= 8,
  String((alleCss.match(/var\(--line\)/g) || []).length));

console.log(`\n${ok} von ${ok + weg} — Suite 298 (E304: Farben ohne Quelle)`);
process.exit(weg ? 1 : 0);
