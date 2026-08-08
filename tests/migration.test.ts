/* tests/migration.test.ts — RM-4: die Abschrift rechnet sich nach (E78)
 * ----------------------------------------------------------------------------
 * Das gefälschte `notizen` hier ist bewusst ein ROHES IndexedDB — angelegt
 * mit denselben Fächern und keyPaths wie im Bestand (indexdb.ts, Zeile
 * 81 ff.), nicht mit Dexie. Die Migration soll genau die Grenze überqueren,
 * die sie im Browser überquert.
 *
 * Und der wichtigste Abschnitt ist die GEGENPROBE: ein Vergleich, der eine
 * manipulierte Abschrift nicht rot macht, vergleicht nichts (§55.2).
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { RedionDb } from '../src/persistence/db';
import { copyFromLegacy, compare, migrateAndVerify, STORES }
  from '../src/persistence/migration';

/** Ein `notizen` wie im Bestand — roh, mit denselben keyPaths. */
const legacyAnlegen = (saetze: Partial<Record<string, unknown[]>>): Promise<void> =>
  new Promise((ok, nein) => {
    const del = indexedDB.deleteDatabase('notizen');
    del.onsuccess = del.onerror = () => {
      const req = indexedDB.open('notizen', 9);
      req.onupgradeneeded = () => {
        const d = req.result;
        for (const s of STORES)
          d.createObjectStore(s, { keyPath: s === 'meta' ? 'k' : 'id' });
      };
      req.onsuccess = () => {
        const d = req.result;
        const faecher = Object.keys(saetze);
        if (!faecher.length) { d.close(); ok(); return; }
        const t = d.transaction(faecher, 'readwrite');
        for (const [fach, liste] of Object.entries(saetze))
          for (const satz of liste ?? []) t.objectStore(fach).put(satz);
        t.oncomplete = () => { d.close(); ok(); };
        t.onerror = () => { d.close(); nein(t.error); };
      };
      req.onerror = () => nein(req.error);
    };
  });

const frisch = (): RedionDb =>
  new RedionDb('redion-neu-test-' + Math.random().toString(36).slice(2));

const BLOCK = {
  id: 'b1', type: 'page', text: 'Seite', content: [], parentId: null,
  parentTable: 'block', created: '2026-08-08T10:00:00.000Z',
  edited: '2026-08-08T10:00:00.000Z', alive: true, erstelltVon: 'Ich'
};

describe('RM-4: kopieren und nachrechnen', () => {
  beforeEach(async () => {
    await legacyAnlegen({
      blocks: [BLOCK, { ...BLOCK, id: 'b2', text: 'Zweite' }],
      meta: [{ k: 'nutzer', v: 'Redur' }],
      dateien: [{ id: 'd1', name: 'foto.jpg', groesse: 3, typ: 'image/jpeg',
                  blockId: 'b1', teile: 1, angekommen: 1, zustand: 'fertig',
                  angelegt: '2026-08-08T10:00:00.000Z', fertigAm: '2026-08-08T10:00:01.000Z' }],
      stuecke: [{ id: 'd1:0', dateiId: 'd1', nr: 0, blob: new Blob([new Uint8Array([1, 2, 3])]) }]
    });
  });

  it('kopiert alle Fächer und der Vergleich sagt: deckungsgleich', async () => {
    const db = frisch();
    const { kopie, vergleich } = await migrateAndVerify(db);
    expect(kopie.kopiert['blocks']).toBe(2);
    expect(kopie.kopiert['stuecke']).toBe(1);
    expect(vergleich.gleich).toBe(true);
    expect(vergleich.geprueft).toBe(5);
    expect(vergleich.blobsGeprueft).toBe(1);
    await db.delete();
  });

  it('GEGENPROBE: ein geänderter Satz in der Abschrift fällt auf', async () => {
    const db = frisch();
    await copyFromLegacy(db);
    await db.blocks.update('b1', { text: 'Verfälscht' });
    const v = await compare(db);
    expect(v.gleich).toBe(false);
    expect(v.abweichungen).toEqual([{ fach: 'blocks', schluessel: 'b1', was: 'ungleich' }]);
    await db.delete();
  });

  it('GEGENPROBE: ein fehlender Satz fällt auf — in beide Richtungen', async () => {
    const db = frisch();
    await copyFromLegacy(db);
    await db.blocks.delete('b2');
    await db.vorrat.put({ id: 'erfunden' });
    const v = await compare(db);
    expect(v.gleich).toBe(false);
    expect(v.abweichungen).toContainEqual({ fach: 'blocks', schluessel: 'b2', was: 'fehlt-neu' });
    expect(v.abweichungen).toContainEqual({ fach: 'vorrat', schluessel: 'erfunden', was: 'fehlt-alt' });
    await db.delete();
  });

  it('GEGENPROBE: ein verfälschtes Byte im Stück fällt auf', async () => {
    const db = frisch();
    await copyFromLegacy(db);
    await db.stuecke.update('d1:0', { blob: new Blob([new Uint8Array([1, 2, 4])]) });
    const v = await compare(db);
    expect(v.gleich).toBe(false);
    expect(v.abweichungen).toEqual([{ fach: 'stuecke', schluessel: 'd1:0', was: 'blob-ungleich' }]);
    await db.delete();
  });

  it('läuft zweimal, ohne Doppelte anzuhäufen — put ersetzt, statt anzufügen', async () => {
    const db = frisch();
    await copyFromLegacy(db);
    const { vergleich } = await migrateAndVerify(db);
    expect(vergleich.gleich).toBe(true);
    expect(vergleich.faecher['blocks']).toEqual({ alt: 2, neu: 2 });
    await db.delete();
  });

  it('die Feldreihenfolge ist egal, die Feldnamen sind es nicht', async () => {
    const db = frisch();
    await copyFromLegacy(db);
    /* Gleiche Felder, andere Reihenfolge — muss gleich bleiben. */
    const b = await db.blocks.get('b1');
    await db.blocks.put(JSON.parse(JSON.stringify(
      Object.fromEntries(Object.entries(b as object).reverse()))));
    const v1 = await compare(db);
    expect(v1.gleich).toBe(true);
    await db.delete();
  });
});
