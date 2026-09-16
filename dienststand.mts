/* ============================================================================
 * dienststand.mts — die Fassung des Dienst-Arbeiters folgt dem INHALT (E361)
 * ----------------------------------------------------------------------------
 * L83 Punkt 3: ohne erhöhte `VERSION` in src/dienst/sw.ts liefert der
 * Dienst-Arbeiter alte und neue Dateien gemischt — und nichts erzwang die
 * Erhöhung; E357 bis E360 haben sie je von Hand gesetzt. Jetzt rechnet
 * dieses Skript einen Stempel über alle Dateien des Grundstocks (Pfad und
 * Bytes, feste Reihenfolge) und hebt die Fassung, sobald er sich ändert.
 * Es läuft in `npm run bauen:ts` zwischen den beiden tsc-Aufrufen und
 * schreibt zwei Stellen:
 *
 *     src/dienst/sw.ts                 const VERSION = 'notizen-vN'
 *     src/kern/einstellung/stand.ts    fassung, inhalt, gebaut — was die
 *                                      App unter „Über diese App" zeigt
 *
 * `stand.js` selbst bleibt aus dem Stempel heraus: es trägt ihn.
 * Unverändert heisst unverändert — kein neuer Zeitstempel, kein Rauschen
 * im Verzeichnis. test353 rechnet den Stempel nach und wird rot, wenn
 * jemand eine Datei des Grundstocks geändert und den Bau vergessen hat.
 *
 *     node dienststand.mts             prüfen, bei Änderung heben
 *     node dienststand.mts --pruefen   nur prüfen; Rückgabe 1, wenn veraltet
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const WURZEL = path.resolve(import.meta.dirname);
const SW = 'src/dienst/sw.ts';
const STAND = 'src/kern/einstellung/stand.ts';
const STAND_JS = 'quell/kern/einstellung/stand.js';

/** Die Pfade des Grundstocks aus sw.ts — dieselbe Lesart wie test143. */
export const grundstock = (swTs: string): string[] => {
  const block = /const GRUNDSTOCK = \[([\s\S]*?)\n\];/.exec(swTs)?.[1] ?? '';
  return [...block.matchAll(/'\.\/([^']+)'/g)].map(m => m[1] ?? '').filter(v => v !== '');
};

/** SHA-256 über Pfad und Bytes jeder Datei, sortiert; die ersten 16 Hexzeichen. */
export const inhaltsStempel = (wurzel: string, dateien: string[]): string => {
  const h = crypto.createHash('sha256');
  for (const d of [...new Set(dateien)].sort()) {
    if (d === STAND_JS) continue;
    const p = path.join(wurzel, d);
    if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) continue;
    h.update(d); h.update('\0'); h.update(fs.readFileSync(p)); h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
};

export type Stand = { fassung: number; inhalt: string; gebaut: string };

/** Was sw.ts und stand.ts gerade sagen. */
export const gelesen = (wurzel: string): { swTs: string; fassungSw: number; inhaltSw: string; stand: Stand } => {
  const swTs = fs.readFileSync(path.join(wurzel, SW), 'utf8');
  const fassungSw = Number(/const VERSION = 'notizen-v(\d+)'/.exec(swTs)?.[1] ?? 0);
  /* Der Stempel steht seit E610 auch in sw.ts, weil der Ablagename ihn
     trägt. Fehlt die Zeile (ein ganz neues Projekt, test353 §3), ist er
     leer — dann schreibt `abgleichen` sie an. */
  const inhaltSw = /const INHALT = '([0-9a-f]*)'/.exec(swTs)?.[1] ?? '';
  const standPfad = path.join(wurzel, STAND);
  const standTs = fs.existsSync(standPfad) ? fs.readFileSync(standPfad, 'utf8') : '';
  return { swTs, fassungSw, inhaltSw, stand: {
    fassung: Number(/fassung: (\d+)/.exec(standTs)?.[1] ?? 0),
    inhalt: /inhalt: '([0-9a-f]*)'/.exec(standTs)?.[1] ?? '',
    gebaut: /gebaut: '([^']*)'/.exec(standTs)?.[1] ?? '' } };
};

const standQuelle = (s: Stand): string =>
  `/* kern/einstellung/stand.ts — DER STAND DIESES BAUS (E361, L83)
 * ----------------------------------------------------------------------------
 * Geschrieben von dienststand.mts bei \`npm run bauen:ts\` — von Hand nicht
 * anfassen. \`fassung\` ist die Fassung des Dienst-Arbeiters (sw.ts),
 * \`inhalt\` der Stempel über den Grundstock, \`gebaut\` der Augenblick, in
 * dem sich der Inhalt zuletzt geändert hat. Die App zeigt es unter
 * „Über diese App", zusammen mit dem Weg, über den sie gerade läuft.
 * ==========================================================================*/
const Stand = { fassung: ${s.fassung}, inhalt: '${s.inhalt}', gebaut: '${s.gebaut}' } as const;

(window as any).Stand = Stand;
`;

/** Prüft, hebt bei Änderung. Gibt zurück, was jetzt gilt und ob geschrieben wurde. */
export const abgleichen = (wurzel: string, nurPruefen: boolean): { stand: Stand; veraltet: boolean; geschrieben: boolean } => {
  const { swTs, fassungSw, inhaltSw, stand } = gelesen(wurzel);
  const jetzt = inhaltsStempel(wurzel, grundstock(swTs));
  const inhaltGleich = jetzt === stand.inhalt && jetzt === inhaltSw;
  const fassungGleich = fassungSw === stand.fassung && fassungSw > 0;
  if (inhaltGleich && fassungGleich) return { stand, veraltet: false, geschrieben: false };
  if (nurPruefen) return { stand: { ...stand, inhalt: jetzt }, veraltet: true, geschrieben: false };
  /* Eine von Hand höher gesetzte Fassung bleibt höher; sonst eine Stufe.
     Der Stempel entscheidet über die Stufe, nicht über den Ablagenamen —
     den trägt er seit E610 selbst. */
  const fassung = Math.max(fassungSw, stand.fassung) + (jetzt === stand.inhalt ? 0 : 1);
  const neu: Stand = { fassung, inhalt: jetzt,
    gebaut: jetzt === stand.inhalt ? stand.gebaut : new Date().toISOString() };
  /* Zwei Zeilen in sw.ts: die Nummer für den Menschen, der Stempel für die
     Ablage (E610). Fehlt die Stempelzeile, kommt sie unter die Nummer —
     sonst liefe ein neues Projekt ewig als „veraltet". */
  const swNummer = swTs.replace(/const VERSION = 'notizen-v\d+';/, `const VERSION = 'notizen-v${fassung}';`);
  const swNeu = /const INHALT = '[0-9a-f]*';/.test(swNummer)
    ? swNummer.replace(/const INHALT = '[0-9a-f]*';/, `const INHALT = '${jetzt}';`)
    : swNummer.replace(/(const VERSION = 'notizen-v\d+';)/, `$1\nconst INHALT = '${jetzt}';`);
  fs.writeFileSync(path.join(wurzel, SW), swNeu);
  /* Beim allerersten Mal gibt es den Ordner noch nicht (test353 §3 fand es). */
  fs.mkdirSync(path.dirname(path.join(wurzel, STAND)), { recursive: true });
  fs.writeFileSync(path.join(wurzel, STAND), standQuelle(neu));
  return { stand: neu, veraltet: true, geschrieben: true };
};

if (path.basename(process.argv[1] ?? '') === 'dienststand.mts') {
  const nurPruefen = process.argv.includes('--pruefen');
  const e = abgleichen(WURZEL, nurPruefen);
  if (!e.veraltet) console.log(`Dienststand v${e.stand.fassung}: unverändert (${e.stand.inhalt})`);
  else if (e.geschrieben) console.log(`Dienststand v${e.stand.fassung}: Inhalt geändert (${e.stand.inhalt}) — sw.ts und stand.ts geschrieben`);
  else { console.log(`Dienststand VERALTET: der Grundstock hat sich geändert (${e.stand.inhalt}), sw.ts/stand.ts sagen v${e.stand.fassung}. npm run bauen:ts ausführen.`); process.exit(1); }
}
