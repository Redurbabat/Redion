/* Die Rollen: Oberfläche und Server müssen dasselbe sagen
 * ----------------------------------------------------------------------------
 * `quell/kern/zugang/rollen.js` behauptet in seinem Kopfkommentar:
 *
 *     „Sie ist bewusst wortgleich mit der des Servers, und der Prüflauf
 *      vergleicht beide."
 *
 * Diesen Prüflauf gab es nicht. Er war einer der 53 unter /tmp und ist damit
 * für jeden ausser einem Rechner verschwunden. Übrig blieb eine Behauptung —
 * und eine Behauptung ohne Prüfung ist die gefährlichste Sorte Dokumentation,
 * weil sie beruhigt.
 *
 * WORUM ES GEHT. Die Rollen stehen zweimal: einmal in der Oberfläche
 * (blendet Knöpfe aus) und einmal im Server (hält den Datensatz zurück). Zwei
 * Listen, die dasselbe meinen, laufen mit der Zeit auseinander — und wie
 * `rollen.js` selbst schreibt, immer in dieselbe Richtung: die Oberfläche
 * erlaubt etwas, das der Server verweigert, und der Mensch sieht einen Knopf,
 * der nicht funktioniert.
 *
 * Die andere Richtung ist schlimmer und steht deshalb als eigene Prüfung da:
 * wenn die Oberfläche MEHR erlaubt als der Server, klickt jemand etwas an,
 * das er nicht darf, und bekommt einen Fehler statt einer Erklärung.
 *
 * OHNE BROWSER. Dieser Lauf braucht kein Chromium — er lädt beide Listen
 * direkt und vergleicht sie. Das ist genau das, worauf A4 hinauswill: reine
 * Logik ohne DOM lässt sich in Millisekunden prüfen statt in Sekunden.
 *
 *   node pruefungen/rollen.mjs
 * ==========================================================================*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLLEN as SERVER, darf as serverDarf } from '../server/kern.js';

let ok = 0, bad = 0;
const pruef = (n, ist, soll) => {
  const gut = JSON.stringify(ist) === JSON.stringify(soll);
  console.log((gut ? '✅ ' : '❌ ') + n + (gut ? '' : `  ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`));
  gut ? ok++ : bad++;
};

const WURZELORDNER = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/* Die Oberflächen-Datei ist ein gewöhnliches Skript, kein Modul — sie hängt
   sich am Ende an `window`. Hier bekommt sie ein Fensterchen aus Papier und
   gibt ihr Ergebnis direkt zurück. Kein Browser nötig. */
const quelle = fs.readFileSync(
  path.join(WURZELORDNER, 'quell/kern/zugang/rollen.js'), 'utf8');
const OBERFLAECHE = new Function('window', quelle + '\nreturn Rollen;')({});

/* ======================================================================== *
 * 1 · DIESELBEN ROLLEN
 * ======================================================================== */
console.log('\n--- Dieselben Rollen ---');

pruef('Beide kennen dieselben Rollen',
      Object.keys(OBERFLAECHE.ROLLEN).sort(), Object.keys(SERVER).sort());
pruef('Und es sind die fünf erwarteten',
      Object.keys(SERVER).sort(), ['edit', 'kein', 'komm', 'lesen', 'voll']);

Object.keys(SERVER).forEach(r => {
  pruef(`„${r}" hat beidseitig denselben Rang`,
        OBERFLAECHE.ROLLEN[r]?.rang, SERVER[r].rang);
  pruef(`„${r}" darf beidseitig dasselbe`,
        (OBERFLAECHE.ROLLEN[r]?.darf || []).slice().sort(), SERVER[r].darf.slice().sort());
});

/* ======================================================================== *
 * 2 · DIE GEFÄHRLICHE RICHTUNG
 * Die Oberfläche darf nie mehr erlauben als der Server. Tut sie es, zeigt sie
 * einen Knopf, der beim Klick einen Fehler bringt statt einer Erklärung.
 * ======================================================================== */
console.log('\n--- Erlaubt die Oberfläche mehr? ---');

const alleTaten = [...new Set(Object.values(SERVER).flatMap(r => r.darf))];
const zuViel = [];
Object.keys(SERVER).forEach(rolle => {
  alleTaten.forEach(tat => {
    if (OBERFLAECHE.darf(rolle, tat) && !serverDarf(rolle, tat)) zuViel.push(rolle + ':' + tat);
  });
});
pruef('Die Oberfläche erlaubt nirgends mehr als der Server', zuViel, []);

const zuWenig = [];
Object.keys(SERVER).forEach(rolle => {
  alleTaten.forEach(tat => {
    if (!OBERFLAECHE.darf(rolle, tat) && serverDarf(rolle, tat)) zuWenig.push(rolle + ':' + tat);
  });
});
pruef('Und auch nirgends weniger', zuWenig, []);

/* ======================================================================== *
 * 3 · WAS DIE OBERFLÄCHE ZUSÄTZLICH BRAUCHT
 * Name, Satz und die Reihenfolge gibt es nur dort — der Server braucht keine
 * Wörter. Fehlt eines davon, steht in einer Meldung „undefined".
 * ======================================================================== */
console.log('\n--- Wörter für Menschen ---');

pruef('Die Reihe nennt jede Rolle genau einmal',
      OBERFLAECHE.REIHE.slice().sort(), Object.keys(SERVER).sort());
pruef('Und zwar von stark nach schwach',
      OBERFLAECHE.REIHE.map(r => SERVER[r].rang), [5, 4, 3, 2, 1]);

const ohneNamen = Object.keys(SERVER).filter(r => !OBERFLAECHE.ROLLEN[r]?.name);
const ohneSatz  = Object.keys(SERVER).filter(r => !OBERFLAECHE.ROLLEN[r]?.satz);
pruef('Jede Rolle hat einen Namen', ohneNamen, []);
pruef('Und einen Satz dazu',        ohneSatz, []);

/* Jede Tat, die irgendwo erlaubt wird, braucht ein Wort in TATEN — sonst
   steht in `warumNicht` eine Lücke, wo eine Erklärung stehen sollte. */
const ohneWort = alleTaten.filter(t => !OBERFLAECHE.TATEN[t]);
pruef('Jede Tat hat ein Wort im Klartext', ohneWort, []);

/* ======================================================================== *
 * 4 · DIE SÄTZE, DIE EIN MENSCH ZU SEHEN BEKOMMT
 * ======================================================================== */
console.log('\n--- Was der Mensch liest ---');

const satz = OBERFLAECHE.warumNicht('lesen', 'bearbeiten');
pruef('Eine Absage nennt die nötige Rolle', satz.includes('Bearbeiten'), true);
pruef('Und die eigene',                     satz.includes('Lesen'), true);
pruef('Ohne „undefined" darin',             satz.includes('undefined'), false);
pruef('Wer darf, bekommt keine Absage',     OBERFLAECHE.warumNicht('voll', 'bearbeiten'), '');

/* Geerbte Rechte: die schwächere gewinnt. Andersherum wäre eine Freigabe
   weiter unten im Baum eine Rechteerweiterung — das darf nie sein. */
pruef('Geerbt gewinnt die schwächere',  OBERFLAECHE.schwaechere('voll', 'lesen'), 'lesen');
pruef('„Kein Zugriff" sticht alles',    OBERFLAECHE.schwaechere('voll', 'kein'), 'kein');
pruef('Und die stärkere, wo gewünscht', OBERFLAECHE.staerkere('lesen', 'edit'), 'edit');

/* Ohne Konto gibt es niemanden, gegen den zu prüfen wäre — dann gilt alles.
   Das ist Absicht und keine Lücke: der Bestand gehört dem Gerät. */
pruef('Ohne Konto ist jeder Knopf da',   OBERFLAECHE.zeigen('rechte', ''), true);
pruef('Mit Rolle wird gefiltert',        OBERFLAECHE.zeigen('rechte', 'lesen'), false);
pruef('Eine erfundene Rolle darf nichts', OBERFLAECHE.darf('erfunden', 'lesen'), false);

/* ======================================================================== */
console.log(`\n${ok}/${ok + bad} bestanden`);
process.exit(bad ? 1 : 0);
