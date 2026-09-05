/* Suite 402 — Trefflächen unter 44 px dürfen nur weniger werden (E407)
 * ============================================================================
 * §37 ist [hart im Kern] und sagt zwei Dinge, nicht eins:
 *
 *   1. 44 px auf den Hauptwegen — Werkzeuge, Hauptmenü, untere Leiste,
 *      Bestätigen und Abbrechen. Ohne Ausnahme.
 *   2. Nebenwege dürfen 32 px sein — ABER mit einem geschriebenen Grund an
 *      Ort und Stelle, nicht stillschweigend.
 *
 * Der zweite Teil ist der, den niemand prüft. Gemessen am 4. September 2026:
 * 42 Trefflächen unter 44 px, davon 4 mit Begründung und 38 ohne.
 *
 * Diese Suite führt kein Urteil, sondern ein VERZEICHNIS —
 * `pruefungen/masse-bestand.json`, nach dem Vorbild von `js-bestand.json`
 * (§54.4). Es darf nur schrumpfen. Eine Zeile verschwindet, wenn die Fläche
 * 44 px bekommt ODER wenn über der Regel steht, warum sie ein Nebenweg ist.
 *
 *   §1 Das Verzeichnis stimmt mit dem Stil überein — keine Zeile beschreibt
 *      etwas, das es nicht mehr gibt.
 *   §2 Es ist keine Regel dazugekommen, die nicht darin steht.
 *   §3 Und die Zahl darin ist nicht gewachsen.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja: eine neue Regel `.xy button{height:30px}` in eine Stildatei schreiben,
 * und §2 fällt. Wirklich gelaufen, siehe ENTSCHEIDUNGEN.md E407.
 *
 * Kein Browser, kein Port — sie liest Dateien.
 *
 *   node pruefungen/lauf/test402.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const STIL = path.join(WURZEL, 'quell/schale/stil');
const VERZEICHNIS = path.join(WURZEL, 'pruefungen/masse-bestand.json');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

interface Eintrag { datei: string; wahl: string; px: number }

p('Es gibt ein Verzeichnis', fs.existsSync(VERZEICHNIS), 'pruefungen/masse-bestand.json fehlt');
const bestand: Eintrag[] =
  (JSON.parse(fs.readFileSync(VERZEICHNIS, 'utf8')).eintraege || []) as Eintrag[];

/**
 * Alle Trefflächen unter 44 px, für die KEIN Grund geschrieben steht.
 *
 * Nur der Knopf selbst zählt: `button > svg` ist eine Zeichengrösse, keine
 * Fläche, die ein Daumen treffen muss.
 */
const messen = (): Eintrag[] => {
  const raus: Eintrag[] = [];
  for (const name of fs.readdirSync(STIL).filter(f => f.endsWith('.css')).sort()) {
    const t = fs.readFileSync(path.join(STIL, name), 'utf8');
    const zeilen = t.split('\n');
    for (const m of t.matchAll(/([^{}\n]+)\{([^}]*)\}/g)) {
      const rohSel = (m[1] ?? '').trim().split('\n').pop() ?? '';
      const sel = rohSel.trim();
      const body = m[2] ?? '';
      if (!/(button|\.knopf|\.btn[\w.]*|\.tab)(:[\w-]+)?$/.test(sel)) continue;
      const h = body.match(/(?<!max-)(?:min-)?height\s*:\s*(\d+)px/);
      if (!h || !h[1] || Number(h[1]) >= 44) continue;
      const zn = t.slice(0, m.index).split('\n').length - 1;
      const umfeld = zeilen.slice(Math.max(0, zn - 8), zn + 3).join('\n');
      if (/Nebenweg|§37|44 ?px TREFFFL|geschriebener Grund/i.test(umfeld)) continue;
      raus.push({ datei: name, wahl: sel, px: Number(h[1]) });
    }
  }
  return raus;
};

const jetzt = messen();
const schluessel = (e: Eintrag) => `${e.datei}|${e.wahl}`;
const imBestand = new Set(bestand.map(schluessel));
const gemessen = new Set(jetzt.map(schluessel));

console.log(`\n    ${bestand.length} im Verzeichnis, ${jetzt.length} gemessen`);

/* §1 · Keine Leiche im Verzeichnis */
const verwaist = bestand.filter(e => !gemessen.has(schluessel(e))).map(schluessel);
p('Jede Zeile im Verzeichnis beschreibt eine Regel, die es gibt',
  verwaist.length === 0,
  verwaist.slice(0, 5).join(', ') + '  →  aus masse-bestand.json streichen');

/* §2 · Nichts Neues */
const neu = jetzt.filter(e => !imBestand.has(schluessel(e)));
p('Keine neue Fläche unter 44 px ohne geschriebenen Grund',
  neu.length === 0,
  neu.slice(0, 5).map(e => `${e.datei} ${e.wahl} (${e.px}px)`).join(', '));

/* §3 · Und es wird nicht mehr */
p('Das Verzeichnis ist nicht gewachsen', jetzt.length <= bestand.length,
  `${jetzt.length} gemessen gegen ${bestand.length} eingetragen`);

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
