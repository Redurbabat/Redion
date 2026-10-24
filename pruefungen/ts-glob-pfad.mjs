/*
 * TypeScript-include-Dateimuster für Windows und macOS/Linux.
 *
 * Windows liefert bei path.join() Rückstriche. In JSON-configs von tsc
 * bedeuten sie keine portable Glob-Syntax (TS18003): die Muster werden
 * wörtlich gelesen oder keine Dateien werden gefunden.
 *
 * Der Pfad selbst darf weiterhin absolut bleiben, auch auf Laufwerken
 * wie C:. Wir ändern ausschliesslich die Separatoren.
 */
export function globPfad(pfad) {
  if (typeof pfad !== 'string' || !pfad.trim()) {
    throw new TypeError('Ein TypeScript-Dateimuster braucht einen Pfad.');
  }
  return pfad.replace(/\\/g, '/');
}

export function typescriptGlob(wurzel, relativ, endung) {
  if (!['ts', 'tsx'].includes(endung)) {
    throw new TypeError('Eine TypeScript-Endung muss ts oder tsx sein.');
  }
  if (relativ !== 'src/islands' && relativ !== 'fremd/touch') {
    throw new TypeError('Unbekannter Quellordner für den Insel-Prüflauf.');
  }
  return globPfad(wurzel).replace(/\/+$/, '') + '/' + relativ + '/**/*.' + endung;
}
