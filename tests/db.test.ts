/* tests/db.test.ts — die Dexie-Schicht, gegen fake-indexeddb (RM-3)
 * ----------------------------------------------------------------------------
 * Zwei Dinge müssen hier von Anfang an stimmen:
 *
 *   1. Die Schutzregel: Dexie öffnet NIEMALS `notizen` (E78, §56.3).
 *      Dieser Punkt ist der wichtigste der Datei — er bewacht echte
 *      Nutzerdaten vor einem Schema-Upgrade durch die neue Schicht.
 *   2. Ein Satz geht mit UNVERÄNDERTEN Feldnamen hinein und kommt so
 *      wieder heraus — created bleibt created, groesse bleibt groesse.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { RedionDb } from '../src/persistence/db';
import type { Block } from '../src/domain/schema';

describe('RedionDb', () => {
  it('weigert sich, die Ablage des Bestands zu öffnen', () => {
    expect(() => new RedionDb('notizen')).toThrow(/Bestand/);
  });

  it('schreibt und liest einen Block mit den gespeicherten Feldnamen', async () => {
    const db = new RedionDb('redion-neu-test-' + Math.random().toString(36).slice(2));
    const block: Block = {
      id: 'b1', type: 'page', text: 'Meine Seite', content: ['k1'],
      parentId: null, parentTable: 'block',
      created: '2026-08-08T10:00:00.000Z', edited: '2026-08-08T10:00:00.000Z',
      alive: true, erstelltVon: 'Ich'
    };
    await db.blocks.put(block);
    const zurueck = await db.blocks.get('b1');
    expect(zurueck).toEqual(block);
    /* Und ausdrücklich: kein Feld wurde „übersetzt". */
    expect(zurueck && 'created' in zurueck).toBe(true);
    expect(zurueck && ('createdAt' in zurueck)).toBe(false);
    await db.delete();
  });

  it('findet Zeilen über den parentId-Index, wie der Bestand es tut', async () => {
    const db = new RedionDb('redion-neu-test-' + Math.random().toString(36).slice(2));
    const bau = (id: string, parentId: string | null): Block => ({
      id, type: 'text', text: id, content: [], parentId,
      parentTable: parentId ? 'collection' : 'block',
      created: '2026-08-08T10:00:00.000Z', edited: '2026-08-08T10:00:00.000Z',
      alive: true
    });
    await db.blocks.bulkPut([bau('z1', 'c1'), bau('z2', 'c1'), bau('z3', 'c2'), bau('frei', null)]);
    const zeilen = await db.blocks.where('parentId').equals('c1').toArray();
    expect(zeilen.map((z) => z.id).sort()).toEqual(['z1', 'z2']);
    await db.delete();
  });

  it('holt Stücke einer Datei in Reihenfolge über [dateiId+nr] — das Feld heisst dateiId, nur der Index im Bestand heisst datei (E21)', async () => {
    const db = new RedionDb('redion-neu-test-' + Math.random().toString(36).slice(2));
    await db.stuecke.bulkPut([
      { id: 's2', dateiId: 'd1', nr: 1, blob: new Blob(['b']) },
      { id: 's1', dateiId: 'd1', nr: 0, blob: new Blob(['a']) },
      { id: 'fremd', dateiId: 'd2', nr: 0, blob: new Blob(['x']) }
    ]);
    const stuecke = await db.stuecke.where('[dateiId+nr]')
      .between(['d1', -Infinity], ['d1', Infinity]).toArray();
    expect(stuecke.map((s) => s.nr)).toEqual([0, 1]);
    await db.delete();
  });
});
