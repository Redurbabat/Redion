/* Suite 400 — Kein Prüflauf teilt seinen Port (E405)
 * ============================================================================
 * Jede Suite startet einen eigenen kleinen Webserver auf einem FESTEN Port.
 * Ports gehören dem Rechner, nicht der Suite: zwei Läufe mit derselben Zahl
 * können nie nebeneinander laufen.
 *
 * DASS DAS TEUER IST, IST NACHGEWIESEN. Am 4. September lief ein voller Lauf
 * in einem eigenen Arbeitsbaum, während im Hauptbaum `test206` geprüft wurde.
 * `test206` und `test247` hatten beide 8967. Ergebnis: Stück 22 des vollen
 * Laufs war ROT — und nichts daran war ein Fehler im Produkt. Einzeln
 * nachgefahren lief `test247` mit 106 von 106 durch.
 *
 * Ein Ergebnis, das aus dem falschen Grund rot ist, ist schlimmer als eines,
 * das grün lügt: es schickt einen auf die Jagd nach etwas, das es nicht gibt.
 *
 * Gefunden wurden damals 23 doppelte Zahlen über 48 Läufe — eine davon
 * viermal vergeben. Diese Suite sorgt dafür, dass keine 24. dazukommt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Ja, und sie WAR es: gegen den Bestand von vor dem Aufräumen meldet sie 23
 * Gruppen. Gegenprobe heute: in irgendeiner Suite `PORT` auf den Wert einer
 * anderen setzen.
 *
 * Diese Suite braucht keinen Browser und keinen Server — sie liest Dateien.
 * Sie läuft in unter einer Sekunde und hat deshalb selbst keinen Port.
 *
 *   node pruefungen/lauf/test400.mts
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const LAUF = path.join(WURZEL, 'pruefungen/lauf');

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const dateien = fs.readdirSync(LAUF)
  .filter(f => /^test\d+\.mts$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0));

p('Es gibt Prüfläufe zu lesen', dateien.length > 100, String(dateien.length));

/* Einige ältere Dateien haben Zeichen, die keine gültige UTF-8-Folge sind
   (Bildschirmfotos als Base64 im Quelltext). `replace` statt `throw`. */
const ports = new Map<string, number>();
for (const f of dateien) {
  const roh = fs.readFileSync(path.join(LAUF, f), 'utf8');
  const m = roh.match(/PORT = (\d+)/);
  if (m && m[1]) ports.set(f, Number(m[1]));
}
console.log(`    ${ports.size} von ${dateien.length} Läufen halten einen festen Port`);

const gruppen = new Map<number, string[]>();
for (const [f, port] of ports) {
  const liste = gruppen.get(port) ?? [];
  liste.push(f.replace('.mts', ''));
  gruppen.set(port, liste);
}
const doppelt = [...gruppen.entries()]
  .filter(([, fs2]) => fs2.length > 1)
  .map(([port, fs2]) => `${port}: ${fs2.join(' + ')}`)
  .sort();

p('Kein Port ist zweimal vergeben', doppelt.length === 0,
  doppelt.slice(0, 8).join('  ·  ') + (doppelt.length > 8 ? ` … (${doppelt.length} Gruppen)` : ''));

/* Und eine Grenze nach oben: über 65535 gibt es keinen Port, und unter 1024
   braucht man Rechte, die ein Prüflauf nicht haben soll. */
const schraeg = [...ports.entries()]
  .filter(([, port]) => port < 1024 || port > 65535)
  .map(([f, port]) => `${f}=${port}`);
p('Alle Ports liegen im erlaubten Bereich', schraeg.length === 0, schraeg.join(', '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
process.exit(weg ? 1 : 0);
