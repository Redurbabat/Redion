/* src/app/main.tsx — Einstieg der React-Shell (E78, RM-5 begonnen)
 * ----------------------------------------------------------------------------
 * Bewusst klein: DOM abwarten übernimmt das Modul-Laden (type=module läuft
 * nach dem Parsen), Fehler beim Start landen sichtbar auf der Seite statt
 * still in der Konsole — dieselbe Regel wie in quell/start.js (§7).
 */
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { RedionDb } from '../persistence/db';
import { copyFromLegacy, compare, migrateAndVerify } from '../persistence/migration';
import './shell.css';

/* Für Prüfläufe erreichbar — dieselben Funktionen, die der Knopf in der
   Shell ruft. Ein Prüflauf, der eine eigene Abschrift der Migration
   testet, testet nichts (E73); er muss DIESE hier rufen. */
(window as unknown as Record<string, unknown>)['RedionMigration'] =
  { RedionDb, copyFromLegacy, compare, migrateAndVerify };

const root = document.getElementById('root');
if (!root) throw new Error('Der App-Container fehlt.');

try {
  createRoot(root).render(<App />);
} catch (err) {
  root.textContent = 'Redion konnte nicht starten: ' +
    (err instanceof Error ? err.message : String(err));
  throw err;
}
