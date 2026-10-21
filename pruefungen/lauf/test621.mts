/* Suite 621 — Liquid Glass und Motion respektieren App-Grenzen.
 * Keine Pixel-Behauptung: das prüft die Kaskade und die vorhandenen Gates,
 * die visuelle Abnahme muss auf Handy und Desktop separat erfolgen. */
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const lies = (p: string) => fs.readFileSync(path.join(root,p),'utf8');
const s = lies('quell/schale/stil/studio.css');
const cssNamen = lies('doku/CSS-NAMENSRAEUME.md');
let gut = 0, schlecht = 0;
const pruef = (name: string, ok: boolean) => {
  console.log((ok ? '✓ ' : '✗ ') + name);
  ok ? gut++ : schlecht++;
};
pruef('Bestehende Liquid-Glass-Regeln liegen in der Studio-Schale',
  s.includes('REDION LIQUID GLASS / BEWEGUNG') &&
  s.includes('--liquid-ease: var(--feder-knapp'));
pruef('Erste und zweite Motion-Etappe sind vorhanden',
  s.includes('REDION MOTION / FEINSCHLIFF'));
pruef('Studio-Suche hat einen deckenden Fallback',
  /#studio-bar \.studio-search\s*\{\s*background: var\(--bg-card\)/.test(s));
pruef('Glas ist nur nach Browser-Fähigkeitsprüfung erlaubt',
  s.includes('@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))'));
pruef('Dock-Geometrie bleibt SelectionFlow überlassen',
  s.includes('SelectionFlow misst seine Geometrie') &&
  !s.includes('transform: translateX(var(--dock'));
pruef('Regalfilter reagieren mit Sprungfeder und textlicher Auswahl',
  s.includes('.bib-pille[data-gefiltert]') &&
  s.includes('.bib-pille[aria-expanded="true"] .bib-pille-pfeil'));
pruef('Einstellungsfläche wird nicht per backdrop-filter unscharf',
  !/\.einst-fenster\s*\{[^}]*backdrop-filter\s*:/.test(s));
pruef('Animationsarten berücksichtigen reduzierte Bewegung',
  s.includes('@media (prefers-reduced-motion: no-preference)') &&
  s.includes('[data-bewegung="ruhig"]'));
pruef('Hoher Kontrast, reduzierte Transparenz und Forced Colors werden beachtet',
  s.includes('(prefers-reduced-transparency: reduce)') &&
  s.includes('(forced-colors: active)') &&
  s.includes('[data-kontrast="hoch"]'));
pruef('Feder-Kurven werden aus dem etablierten Designsystem gelesen',
  s.includes('--feder-sanft-dauer') && s.includes('--feder-knapp'));
pruef('CSS-Namensraum ho- ist registriert',
  /^ho\s+\d+\s+studio\.css$/m.test(cssNamen));
pruef('Schrift, Eingaben und Touch-Klickflächen werden nicht verkleinert',
  !/REDION MOTION \/ FEINSCHLIFF[\s\S]*?font-size\s*:\s*[0-9]+px/.test(s));
console.log('Suite 621: ' + gut + ' grün, ' + schlecht + ' rot');
if(schlecht) process.exitCode = 1;
