/* tests/outbox.test.ts — die Outbox verliert nichts und lügt nicht (RM-9)
 * ----------------------------------------------------------------------------
 * Die Regeln aus CLAUDE.md §25, angewandt auf das neue Tagebuch:
 * Konflikte müssen erkannt werden · Sync darf nicht still Daten verlieren ·
 * Reihenfolge ist Bedeutung.
 */
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { webcrypto } from 'node:crypto';
import { Outbox } from '../src/sync/outbox';

if (!(globalThis as Record<string, unknown>)['crypto'])
  (globalThis as Record<string, unknown>)['crypto'] = webcrypto;

const frisch = (): Outbox =>
  new Outbox('geraet-1', 'outbox-test-' + Math.random().toString(36).slice(2));

const op = (nr: number, art: 'create' | 'update' | 'delete' = 'update') => ({
  entityType: 'block', entityId: 'b' + nr, baseRevision: 1,
  operation: art, payload: { text: 'Stand ' + nr },
  createdAt: '2026-08-08T10:00:0' + (nr % 10) + '.000Z'
});

describe('Outbox', () => {
  it('vermerkt und liefert älteste zuerst — Reihenfolge ist Bedeutung', async () => {
    const o = frisch();
    await o.enqueue(op(3));
    await o.enqueue(op(1));
    await o.enqueue(op(2));
    const liste = await o.pending();
    expect(liste.map((x) => x.entityId)).toEqual(['b1', 'b2', 'b3']);
    await o.delete();
  });

  it('ack macht aus pending synced — und NUR aus pending', async () => {
    const o = frisch();
    const a = await o.enqueue(op(1));
    const b = await o.enqueue(op(2));
    await o.markConflict(b.id);
    await o.ack([a.id, b.id]);
    const alle = await o.all();
    expect(alle.find((x) => x.id === a.id)?.status).toBe('synced');
    /* Der Konflikt bleibt Konflikt — ein ack ist keine Lösung. */
    expect(alle.find((x) => x.id === b.id)?.status).toBe('conflict');
    await o.delete();
  });

  it('ein Konflikt bleibt liegen, bis ihn jemand löst', async () => {
    const o = frisch();
    const a = await o.enqueue(op(1));
    await o.markConflict(a.id);
    expect((await o.pending()).length).toBe(0);
    expect((await o.conflicts()).length).toBe(1);
    const neu = await o.resolveConflict(a.id, { text: 'gelöst' }, 7);
    expect(neu?.status).toBe('pending');
    expect(neu?.baseRevision).toBe(7);
    /* Die alte Operation ist ersetzt, nicht verdoppelt. */
    expect((await o.all()).length).toBe(1);
    expect((await o.conflicts()).length).toBe(0);
    await o.delete();
  });

  it('resolveConflict auf Nicht-Konflikte tut NICHTS — keine stillen Doppel', async () => {
    const o = frisch();
    const a = await o.enqueue(op(1));
    expect(await o.resolveConflict(a.id, {}, 2)).toBeNull();
    expect((await o.all()).length).toBe(1);
    await o.delete();
  });

  it('prune räumt nur BESTÄTIGTE und nur alte weg', async () => {
    const o = frisch();
    const a = await o.enqueue(op(1));
    await o.enqueue(op(2));                    /* bleibt pending */
    const c = await o.enqueue(op(3));
    await o.ack([a.id, c.id]);
    /* a ist alt, c ist „jung" (createdAt 10:00:03 — Frist dazwischen). */
    const weg = await o.prune('2026-08-08T10:00:02.000Z');
    expect(weg).toBe(1);
    const alle = await o.all();
    expect(alle.map((x) => x.entityId).sort()).toEqual(['b2', 'b3']);
    await o.delete();
  });
});
