/* Bestehende Batterie-Rechner als unveränderte Laufzeitdateien bereitstellen.
 * Die Originale bleiben für die vorhandenen Node-Prüfungen bestehen. Die
 * gemeinsamen Web-/iOS-Pakete nehmen nur Dateien unter quell/ mit. */
import fs from 'node:fs';
import path from 'node:path';
const root = import.meta.dirname;
for (const file of ['batterie-labor-kern.js', 'batterie-aufgaben.js']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const target = path.join(root, 'quell', 'bereiche', 'elektro', file);
  const warning = `/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: ${file} (node bauen-elektro.mts). */\n`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, warning + source);
}
