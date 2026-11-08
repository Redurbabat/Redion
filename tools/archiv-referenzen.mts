/**
 * Lesender Pruefer fuer verschobene Dokumente im Review-Archiv.
 * Aufruf: node tools/archiv-referenzen.mts [--json] [--strict]
 *
 * Der Pruefer aendert keine Dateien, importiert keine App-Module und
 * meldet nur Referenzen zu Dateinamen, die im Archiv tatsaechlich liegen.
 * Er ersetzt weder einen vollstaendigen Markdown-Parser noch App-Tests.
 */
import { existsSync } from 'node:fs';
import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHIV = 'doku/mehr nicht nutzbar';
const AUSLASSEN = new Set(['.git', 'node_modules', 'build', 'www', '.wrangler', 'bilder', 'dist']);
const TEXTARTEN = new Set([
  '.md', '.mdx', '.mjs', '.mts', '.js', '.ts', '.jsx', '.tsx',
  '.cjs', '.cts', '.html', '.css', '.json', '.yaml', '.yml', '.toml', '.bat', '.ps1',
]);
type Fund = { datei: string; zeile: number; ziel: string; archiviertUnter: string };
type Nennung = { datei: string; zeile: number; name: string };
type VerschobenerLink = { datei: string; zeile: number; ziel: string; vorherZiel: string };
export type Archivbericht = {
  archiv: string; archivDateien: string[]; gescannteDateien: number;
  kaputteLinks: Fund[]; erwaehnungen: Nennung[]; verschobeneQuellLinks: VerschobenerLink[];
};
const LINK = /!?\[[^\]]*\]\((<[^>]*>|[^\s)]+)(?:\s+["'][^)]*["'])?\)/g;

async function* textdateien(wurzel: string, ordner = ''): AsyncGenerator<string> {
  let eintraege: Dirent[];
  try { eintraege = await readdir(path.join(wurzel, ordner), { withFileTypes: true }); }
  catch (e) { if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return; throw e; }
  for (const e of eintraege) {
    if (e.isSymbolicLink()) continue;
    const relativ = path.join(ordner, e.name);
    if (e.isDirectory()) {
      if (!AUSLASSEN.has(e.name)) {
        yield* textdateien(wurzel, relativ);
      }
    } else if (e.isFile() && TEXTARTEN.has(path.extname(e.name).toLowerCase())) {
      yield relativ;
    }
  }
}

function linkziel(raw: string): string {
  const ohneKlammern = raw.startsWith('<') && raw.endsWith('>') ? raw.slice(1, -1) : raw;
  try { return decodeURIComponent(ohneKlammern.split(/[?#]/, 1)[0] ?? ''); }
  catch { return ohneKlammern.split(/[?#]/, 1)[0] ?? ''; }
}

/** Liefert nur Berichtsdaten; keine Datei wird geschrieben oder umbenannt. */
export async function pruefeArchivreferenzen(wurzel: string): Promise<Archivbericht> {
  const archivPfad = path.join(wurzel, ARCHIV);
  let eintraege: Dirent[] = [];
  try { eintraege = await readdir(archivPfad, { withFileTypes: true }); }
  catch (e) { if ((e as NodeJS.ErrnoException)?.code !== 'ENOENT') throw e; }
  const archivDateien = eintraege
    .filter(e => e.isFile() && e.name.endsWith('.md') && !/^(README|INDEX|\d\d-)/i.test(e.name))
    .map(e => e.name).sort();
  const kaputteLinks: Fund[] = [];
  const verschobeneQuellLinks: VerschobenerLink[] = [];
  const erwaehnungen: Nennung[] = [];
  let gescannt = 0;
  if (archivDateien.length) {
    for await (const relativ of textdateien(wurzel)) {
      const datei = relativ.replaceAll('\\', '/');
      const ausArchiv = datei.startsWith(`${ARCHIV}/`);
      const originalVerschoben = ausArchiv && archivDateien.includes(path.basename(relativ));
      // README, INDEX und Pruefprotokolle sind keine verschobenen Originale.
      if (ausArchiv && !originalVerschoben) continue;
      gescannt++;
      const daten = await readFile(path.join(wurzel, relativ), 'utf8');
      if (!originalVerschoben && !archivDateien.some(name => daten.includes(name))) continue;
      const zeilen = daten.split(/\r?\n/);
      for (let i = 0; i < zeilen.length; i++) {
        const zeile = zeilen[i] ?? '';
        const vorkommen = archivDateien.filter(name => zeile.includes(name));
        if (!vorkommen.length && !originalVerschoben) continue;
        for (const name of vorkommen) {
          erwaehnungen.push({ datei, zeile: i + 1, name });
        }
        for (const link of zeile.matchAll(LINK)) {
          const ziel = linkziel(link[1] ?? '');
          if (!ziel || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ziel)) continue;
          const aufgeloest = path.resolve(wurzel, path.dirname(relativ), ziel);
          if (existsSync(aufgeloest)) continue;
          const name = path.basename(aufgeloest);
          if (archivDateien.includes(name) &&
              path.relative(wurzel, aufgeloest).replaceAll('\\', '/') === `doku/${name}`) {
            kaputteLinks.push({ datei, zeile: i + 1,
              ziel, archiviertUnter: `${ARCHIV}/${name}` });
          }
          if (originalVerschoben) {
            const vorher = path.resolve(wurzel, 'doku', ziel);
            if (existsSync(vorher)) {
              verschobeneQuellLinks.push({ datei, zeile: i + 1, ziel,
                vorherZiel: path.relative(wurzel, vorher).replaceAll('\\', '/') });
            }
          }
        }
      }
    }
  }
  return { archiv: ARCHIV, archivDateien, gescannteDateien: gescannt,
    kaputteLinks, erwaehnungen, verschobeneQuellLinks };
}

const selbst = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (selbst) {
  const flags = new Set(process.argv.slice(2));
  const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  try {
    const bericht = await pruefeArchivreferenzen(wurzel);
    if (flags.has('--json')) console.log(JSON.stringify(bericht, null, 2));
    else {
      console.log(`Archiv: ${bericht.archivDateien.length} Dokumente; ${bericht.gescannteDateien} Textdateien untersucht.`);
      for (const l of bericht.kaputteLinks) {
        console.log(`[LINK OFFEN] ${l.datei}:${l.zeile} -> ${l.ziel} (liegt jetzt: ${l.archiviertUnter})`);
      }
      for (const l of bericht.verschobeneQuellLinks) {
        console.log(`[LINK DURCH UMZUG OFFEN] ${l.datei}:${l.zeile} -> ${l.ziel} (frueher: ${l.vorherZiel})`);
      }
      console.log(`${bericht.kaputteLinks.length} Verweise auf archivierte Pfade; ${bericht.verschobeneQuellLinks.length} durch Umzug ungueltige Original-Links; ${bericht.erwaehnungen.length} Textnennungen zur manuellen Pruefung.`);
      if (!bericht.archivDateien.length) console.log('Noch keine Archivdokumente im aktuellen Branch.');
    }
    if (flags.has('--strict') && (bericht.kaputteLinks.length || bericht.verschobeneQuellLinks.length)) process.exitCode = 1;
  } catch (e) { console.error(e); process.exitCode = 2; }
}
