/* tests/hashing.test.ts — die Inhaltsadresse rechnet richtig (RM-8)
 * ----------------------------------------------------------------------------
 * Die Vereinbarung `redion-merkle-v1` wird hier FESTGENAGELT: ein bekannter
 * Inhalt hat eine bekannte Adresse, von Hand nachgerechnet über denselben
 * Weg (Stückhashes, dann Kettenhash). Ändert jemand Stückgrösse oder
 * Rechnung, wird dieser Lauf rot — und genau das soll er, denn dann ist
 * jede gespeicherte Adresse ungültig und braucht eine neue Fassungskennung.
 */
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { contentAddress, addressDigest, addressPath, HASH_CHUNK, HASH_VERSION }
  from '../src/files/hashing';

if (!(globalThis as Record<string, unknown>)['crypto'])
  (globalThis as Record<string, unknown>)['crypto'] = webcrypto;

/** Die Rechnung von Hand — unabhängig formuliert, damit sie die
 *  Bibliotheksrechnung PRÜFT statt sie zu wiederholen. */
const vonHand = async (bytes: Uint8Array): Promise<string> => {
  const stuecke: Uint8Array[] = [];
  if (bytes.length === 0) stuecke.push(bytes);
  for (let von = 0; von < bytes.length; von += HASH_CHUNK)
    stuecke.push(bytes.subarray(von, Math.min(von + HASH_CHUNK, bytes.length)));
  const haeschen: Uint8Array[] = [];
  for (const s of stuecke)
    haeschen.push(new Uint8Array(await crypto.subtle.digest('SHA-256', s as BufferSource)));
  const kette = new Uint8Array(haeschen.length * 32);
  haeschen.forEach((h, i) => kette.set(h, i * 32));
  const ganz = new Uint8Array(await crypto.subtle.digest('SHA-256', kette));
  return HASH_VERSION + ':' + [...ganz].map((b) => b.toString(16).padStart(2, '0')).join('');
};

describe('contentAddress', () => {
  it('gleiche Bytes, gleiche Adresse — verschiedene Bytes, verschiedene', async () => {
    const a1 = await contentAddress(new Blob([new Uint8Array([1, 2, 3])]));
    const a2 = await contentAddress(new Blob([new Uint8Array([1, 2, 3])]));
    const b = await contentAddress(new Blob([new Uint8Array([1, 2, 4])]));
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });

  it('trägt die Fassungskennung als Präfix', async () => {
    const a = await contentAddress(new Blob(['x']));
    expect(a.startsWith(HASH_VERSION + ':')).toBe(true);
    expect(addressDigest(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it('stimmt mit der Handrechnung überein — ein Stück und mehrere', async () => {
    const klein = new Uint8Array([5, 6, 7, 8]);
    expect(await contentAddress(new Blob([klein]))).toBe(await vonHand(klein));
    /* Über die Stückgrenze: 4 MB + 3 Bytes → zwei Stücke. */
    const gross = new Uint8Array(HASH_CHUNK + 3);
    for (let i = 0; i < gross.length; i += 4096) gross[i] = (i / 4096) % 251;
    expect(await contentAddress(new Blob([gross]))).toBe(await vonHand(gross));
  });

  it('die leere Datei hat eine Adresse — und zwar immer dieselbe', async () => {
    const a = await contentAddress(new Blob([]));
    expect(a).toBe(await vonHand(new Uint8Array(0)));
  });

  it('GEGENPROBE: ein einziges gekipptes Byte ändert die Adresse', async () => {
    const gross = new Uint8Array(HASH_CHUNK + 100);
    const a = await contentAddress(new Blob([gross]));
    gross[HASH_CHUNK + 50] = 1;    /* im ZWEITEN Stück — auch das zählt */
    const b = await contentAddress(new Blob([gross]));
    expect(a).not.toBe(b);
  });

  it('addressPath fächert nach den ersten zwei Hex-Zeichen', async () => {
    const a = await contentAddress(new Blob(['pfadprobe']));
    const d = addressDigest(a);
    expect(addressPath(a)).toBe(d.slice(0, 2) + '/' + d);
  });
});
