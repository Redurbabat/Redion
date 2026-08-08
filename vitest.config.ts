/* vitest.config.ts — Unit-Tests der neuen Schicht (E78)
 * ----------------------------------------------------------------------------
 * Vitest prüft Domain, Schemas und Persistenz OHNE Browser — schnell, bei
 * jedem Bau. Die Playwright-Läufe unter pruefungen/ bleiben das Netz für die
 * echte App; nichts hier ersetzt sie (CLAUDE.md §30: keine Mocks, wo die
 * echte App prüfbar ist — Unit-Tests prüfen hier nur, was KEINEN Browser
 * braucht: reine Logik und die Dexie-Schicht gegen fake-indexeddb).
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  }
});
