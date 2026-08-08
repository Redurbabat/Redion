/* src/files/hashing.ts — Inhalt als Adresse (RM-8, E78)
 * ----------------------------------------------------------------------------
 * Jede Datei bekommt ihren SHA-256 — und der wird ihr Name im Speicher und
 * beim Abgleich. Der Gewinn steht im Architektur-Text: dieselbe Datei
 * zweimal hinzugefügt heisst einmal gespeichert, und ein Server, der den
 * Hash schon kennt, bekommt die Bytes nicht noch einmal (R2-Dedup).
 *
 * GERECHNET WIRD STÜCKWEISE — §14 gilt auch hier. Aber ehrlich: WebCrypto
 * kann kein fortlaufendes SHA-256 (kein update/finalize). Deshalb der
 * Merkle-Weg: jedes 4-MB-Stück bekommt seinen eigenen SHA-256, und die
 * Kette der Stückhashes bekommt einen Gesamthash. Das ist NICHT derselbe
 * Wert wie `sha256(datei)` — und das ist in Ordnung, solange BEIDE Seiten
 * (App und Server) dieselbe Rechnung vereinbaren. Die Vereinbarung steht
 * hier und heisst `redion-merkle-v1`; sie wandert als Präfix in die
 * Adresse, damit eine spätere andere Rechnung nie mit dieser verwechselt
 * werden kann.
 *
 * Für KLEINE Dateien (≤ 4 MB, ein Stück) ist der Merkle-Wert über genau
 * ein Stück definiert — auch dann wird die Kette gehasht, damit es EINE
 * Regel gibt und keine zwei.
 */

/** Die Stückgrösse der Rechnung. Teil der Vereinbarung — wer sie ändert,
 *  ändert jede Adresse und braucht eine neue Fassungskennung. */
export const HASH_CHUNK = 4 * 1024 * 1024;

/** Die Fassungskennung der Rechnung. */
export const HASH_VERSION = 'redion-merkle-v1';

const hex = (puffer: ArrayBuffer): string =>
  [...new Uint8Array(puffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Die Inhaltsadresse eines Blobs: `redion-merkle-v1:<64 hex>`.
 * Liest nie mehr als ein Stück auf einmal.
 */
export const contentAddress = async (blob: Blob): Promise<string> => {
  const stueckHashes: Uint8Array[] = [];
  for (let von = 0; von < blob.size || von === 0; von += HASH_CHUNK) {
    const stueck = await blob.slice(von, Math.min(von + HASH_CHUNK, blob.size)).arrayBuffer();
    stueckHashes.push(new Uint8Array(await crypto.subtle.digest('SHA-256', stueck)));
    if (blob.size === 0) break;
  }
  const kette = new Uint8Array(stueckHashes.length * 32);
  stueckHashes.forEach((h, i) => kette.set(h, i * 32));
  return HASH_VERSION + ':' + hex(await crypto.subtle.digest('SHA-256', kette));
};

/** Nur die Hex-Ziffern — für Pfade wie `dateien/ab/abcdef…`. */
export const addressDigest = (adresse: string): string => {
  const doppelpunkt = adresse.lastIndexOf(':');
  return doppelpunkt >= 0 ? adresse.slice(doppelpunkt + 1) : adresse;
};

/** Der Ablagepfad zu einer Adresse: zwei Hex-Zeichen als Fächerung, damit
 *  kein Ordner zehntausend Einträge trägt. */
export const addressPath = (adresse: string): string => {
  const d = addressDigest(adresse);
  return d.slice(0, 2) + '/' + d;
};
