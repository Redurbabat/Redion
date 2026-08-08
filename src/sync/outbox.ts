/* src/sync/outbox.ts — das Operationen-Tagebuch der neuen Schicht (RM-9, E78)
 * ----------------------------------------------------------------------------
 * Der Architektur-Text, wörtlich: „Synchronisation nicht durch ‚DB
 * hochladen'. … Stattdessen bekommt Redion ein Operation Log / Outbox."
 * Und der Satz dahinter, der zählt: „Offline ist der Normalfall."
 *
 * Jede Änderung der neuen Schicht wird ZUERST lokal geschrieben und
 * DANEBEN als Operation vermerkt. Der Abgleich schickt Operationen, nie
 * den Bestand; eine bestätigte Operation ist erledigt, eine abgelehnte
 * ein Konflikt mit Namen.
 *
 * Die Feldnamen hier sind englisch und NEU — dieses Fach hat nie anders
 * geheissen, also gibt es keinen gespeicherten Namen zu bewahren (§53.3
 * schützt Bestände, nicht Entwürfe). Der ABGLEICH DES BESTANDS
 * (kern/abgleich/) bleibt unangetastet; diese Outbox gehört zur neuen
 * Schicht und übernimmt erst, wenn die neue Schicht schreibt.
 */
import Dexie, { type Table } from 'dexie';

export interface Operation {
  id: string;
  deviceId: string;
  entityType: string;
  entityId: string;
  /** Die Fassung, auf der die Änderung aufsetzt — der Konfliktanker. */
  baseRevision: number;
  operation: 'create' | 'update' | 'delete';
  payload: unknown;
  createdAt: string;
  status: 'pending' | 'synced' | 'conflict';
}

class OutboxDb extends Dexie {
  operations!: Table<Operation, string>;
  constructor(name = 'redion-neu-outbox') {
    super(name);
    this.version(1).stores({
      operations: 'id, status, [status+createdAt], entityId'
    });
  }
}

export class Outbox {
  private db: OutboxDb;
  constructor(private deviceId: string, dbName?: string) {
    this.db = new OutboxDb(dbName);
  }

  /** Eine Änderung vermerken — nach dem lokalen Schreiben, nie statt dessen. */
  async enqueue(op: Omit<Operation, 'id' | 'deviceId' | 'status' | 'createdAt'> &
                    { createdAt: string }): Promise<Operation> {
    const voll: Operation = {
      ...op,
      id: crypto.randomUUID(),
      deviceId: this.deviceId,
      status: 'pending'
    };
    await this.db.operations.put(voll);
    return voll;
  }

  /** Was auf den Weg gehört — älteste zuerst, denn Reihenfolge ist Bedeutung:
   *  ein update vor seinem create ergäbe drüben keinen Sinn. */
  async pending(limit = 100): Promise<Operation[]> {
    return this.db.operations.where('status').equals('pending')
      .sortBy('createdAt').then((liste) => liste.slice(0, limit));
  }

  /** Der Server hat bestätigt. Bestätigte bleiben stehen (Nachvollzug),
   *  bis `prune` sie nach Frist wegräumt — nichts verschwindet still. */
  async ack(ids: string[]): Promise<void> {
    await this.db.transaction('rw', this.db.operations, async () => {
      for (const id of ids) {
        const op = await this.db.operations.get(id);
        /* Nur pending → synced. Ein ack auf einen KONFLIKT wäre eine
           Lüge über einen ungelösten Zustand — der bleibt stehen. */
        if (op && op.status === 'pending')
          await this.db.operations.update(id, { status: 'synced' });
      }
    });
  }

  /** Der Server hat abgelehnt — das ist ein Konflikt mit Namen, kein
   *  stiller Verlust. Er bleibt liegen, bis ihn jemand LÖST. */
  async markConflict(id: string): Promise<void> {
    await this.db.operations.update(id, { status: 'conflict' });
  }

  async conflicts(): Promise<Operation[]> {
    return this.db.operations.where('status').equals('conflict').toArray();
  }

  /** Einen gelösten Konflikt als neue Operation wieder auf den Weg bringen.
   *  Die alte bleibt als synced-Spur? Nein: sie wird ERSETZT — die Lösung
   *  IST die neue Operation, und zwei Wahrheiten über dieselbe Änderung
   *  sind eine zu viel. */
  async resolveConflict(id: string, neuePayload: unknown, baseRevision: number):
      Promise<Operation | null> {
    const alt = await this.db.operations.get(id);
    if (!alt || alt.status !== 'conflict') return null;
    await this.db.operations.delete(id);
    return this.enqueue({
      entityType: alt.entityType, entityId: alt.entityId,
      baseRevision, operation: alt.operation, payload: neuePayload,
      createdAt: alt.createdAt
    });
  }

  /** Bestätigte Operationen älter als die Frist wegräumen. */
  async prune(vorDatum: string): Promise<number> {
    const alte = await this.db.operations
      .where('status').equals('synced')
      .filter((op) => op.createdAt < vorDatum).toArray();
    await this.db.operations.bulkDelete(alte.map((o) => o.id));
    return alte.length;
  }

  /** Für Prüfläufe: alles sehen. */
  async all(): Promise<Operation[]> {
    return this.db.operations.toArray();
  }

  async delete(): Promise<void> { await this.db.delete(); }
}
