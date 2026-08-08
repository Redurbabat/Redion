/* tests/schema.test.ts — die Zod-Schemas gegen echte Satzformen (RM-2)
 * ----------------------------------------------------------------------------
 * Die Sätze hier sind ABGESCHRIEBEN aus dem Bestand (addBlock,
 * versionSpeichern, dateien/ablage.ts) — nicht ausgedacht. Ändert der
 * Bestand seine Form, muss dieser Lauf rot werden, sonst prüft er nichts.
 */
import { describe, it, expect } from 'vitest';
import { BlockSchema, CollectionSchema, FileRecordSchema, VersionSchema }
  from '../src/domain/schema';

describe('BlockSchema', () => {
  const block = {
    id: 'b1', type: 'text', text: 'Hallo', content: [],
    parentId: null, parentTable: 'block', color: '',
    created: '2026-08-08T10:00:00.000Z', edited: '2026-08-08T10:00:00.000Z',
    erstelltVon: 'Ich', alive: true
  };

  it('nimmt einen Satz, wie addBlock ihn schreibt', () => {
    expect(BlockSchema.safeParse(block).success).toBe(true);
  });

  it('lehnt ab, was den Bestand zu Fall brächte', () => {
    expect(BlockSchema.safeParse({ ...block, content: 'kaputt' }).success).toBe(false);
    expect(BlockSchema.safeParse({ ...block, alive: 'ja' }).success).toBe(false);
    expect(BlockSchema.safeParse({ ...block, parentTable: 'woanders' }).success).toBe(false);
  });

  it('wirft unbekannte Felder NICHT weg — Regel 1 aus formen.ts', () => {
    const p = BlockSchema.parse({ ...block, spaeteresFeld: 'bleibt' });
    expect((p as Record<string, unknown>)['spaeteresFeld']).toBe('bleibt');
  });

  it('kennt den Papierkorb: alive false ist gültig, kein Mangel', () => {
    expect(BlockSchema.safeParse({ ...block, alive: false }).success).toBe(true);
  });
});

describe('FileRecordSchema', () => {
  const satz = {
    id: 'd1', name: 'foto.jpg', groesse: 12345, typ: 'image/jpeg',
    blockId: null, teile: 1, angekommen: 1, zustand: 'fertig',
    angelegt: '2026-08-08T10:00:00.000Z', fertigAm: '2026-08-08T10:00:01.000Z'
  };

  it('nimmt einen Dateisatz mit den gespeicherten (deutschen) Feldnamen', () => {
    expect(FileRecordSchema.safeParse(satz).success).toBe(true);
  });

  it('lehnt einen „übersetzten" Satz ab — size statt groesse wäre Datenverlust', () => {
    const uebersetzt = { ...satz } as Record<string, unknown>;
    delete uebersetzt['groesse'];
    uebersetzt['size'] = 12345;
    expect(FileRecordSchema.safeParse(uebersetzt).success).toBe(false);
  });

  it('kennt nur die drei echten Zustände', () => {
    expect(FileRecordSchema.safeParse({ ...satz, zustand: 'pending' }).success).toBe(false);
  });
});

describe('VersionSchema', () => {
  it('verlangt pageId — nicht page, das ist nur der Index-Name (E21)', () => {
    const v = { id: 'v1', pageId: 'p1', zeit: '2026-08-08T10:00:00.000Z',
                anlass: 'hand', titel: 'Seite', icon: '📄', daten: {} };
    expect(VersionSchema.safeParse(v).success).toBe(true);
    const falsch = { ...v } as Record<string, unknown>;
    delete falsch['pageId'];
    falsch['page'] = 'p1';
    expect(VersionSchema.safeParse(falsch).success).toBe(false);
  });
});

describe('CollectionSchema', () => {
  it('nimmt eine Datenbank mit Schema und Ansichten', () => {
    const c = { id: 'c1', name: 'Aufgaben', icon: '📋',
      schema: { title: { name: 'Titel', type: 'title' },
                status: { name: 'Status', type: 'select',
                          options: [{ name: 'Offen', color: 'gray' }] } },
      viewIds: ['v1'], created: '2026-08-08T10:00:00.000Z' };
    expect(CollectionSchema.safeParse(c).success).toBe(true);
  });

  it('lässt Spaltentypen offen — das Register ist zur Laufzeit erweiterbar', () => {
    const c = { id: 'c2', name: 'X', schema: { a: { name: 'A', type: 'probefeld' } },
                viewIds: [] };
    expect(CollectionSchema.safeParse(c).success).toBe(true);
  });
});
