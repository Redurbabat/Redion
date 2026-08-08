/* vite.config.ts — der Bau der NEUEN Schicht (E78, CLAUDE.md §56)
 * ----------------------------------------------------------------------------
 * Einstieg ist `app.html`, nicht `index.html`: index.html gehört dem Bestand
 * und lädt weiter seine 105 klassischen Skripte aus quell/ — ganz ohne Vite.
 * Beides lebt nebeneinander, bis RM-10 den Parity-Test besteht.
 *
 * Die Ausgabe geht nach `dist-neu/` und wird nicht mitversioniert: sie ist
 * Bau-Ergebnis wie eine Übersetzung, nicht Quelle. (Der Bestand versioniert
 * sein erzeugtes quell/-JavaScript aus einem Grund, den es hier nicht gibt:
 * Doppelklick-Start ohne Bauschritt.)
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-neu',
    rollupOptions: { input: 'app.html' }
  },
  server: {
    port: 5199,
    /* Der Entwicklungsserver darf auch den Bestand ausliefern — so lässt
       sich die alte App unter /index.html neben der neuen unter /app.html
       öffnen und vergleichen. */
    fs: { allow: ['.'] }
  }
});
