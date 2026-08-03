/* ==========================================================================
 * server/ablage.js — Wo der Server seine Daten hinlegt
 * --------------------------------------------------------------------------
 * Der Serverkern soll nichts davon wissen, ob er auf Cloudflare läuft oder
 * in einem Prüflauf auf einem Rechner. Deshalb steht hier eine schmale
 * Schnittstelle, und dahinter zwei Umsetzungen:
 *
 *   ablageD1(env.DB)       Cloudflare D1 — eine SQLite-Datenbank, kostenlos
 *   ablageSpeicher()       nur im Arbeitsspeicher — für die Prüfungen
 *
 * Beide können genau dasselbe. Wer eine dritte bauen will (Postgres, Datei),
 * muss nur diese sieben Funktionen liefern.
 *
 * Warum so schmal? Weil jede Abfrage, die hier nicht vorkommt, im Kern auch
 * nicht gebraucht wird. Ein Server, der alles kann, ist einer, den niemand
 * mehr prüfen kann.
 * ========================================================================*/

/* Die Tabellen. Bewusst wenige — jede zusätzliche ist eine, die man später
   mitschleppen muss. */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS konten (
  id        TEXT PRIMARY KEY,
  mail      TEXT,
  name      TEXT,
  bild      TEXT,
  herkunft  TEXT,
  angelegt  TEXT,
  gesperrt  INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS konten_mail ON konten(mail);

CREATE TABLE IF NOT EXISTS sitzungen (
  token     TEXT PRIMARY KEY,
  kontoId   TEXT,
  geraet    TEXT,
  angelegt  TEXT,
  bis       TEXT
);
CREATE INDEX IF NOT EXISTS sitzungen_konto ON sitzungen(kontoId);

CREATE TABLE IF NOT EXISTS bereiche (
  id        TEXT PRIMARY KEY,
  name      TEXT,
  besitzer  TEXT,
  angelegt  TEXT
);
CREATE INDEX IF NOT EXISTS bereiche_besitzer ON bereiche(besitzer);

/* Ein Satz ist ein Block, eine Sammlung oder eine Ansicht.
   'daten' ist entweder Klartext-JSON oder ein verschlüsseltes Paket —
   was davon, sagt 'verschluesselt'. Der Server liest nur den Klartext. */
CREATE TABLE IF NOT EXISTS saetze (
  id            TEXT,
  bereich       TEXT,
  tabelle       TEXT,
  daten         TEXT,
  verschluesselt INTEGER DEFAULT 0,
  seite         TEXT,
  version       INTEGER DEFAULT 1,
  geaendert     TEXT,
  geloescht     INTEGER DEFAULT 0,
  vonGeraet     TEXT,
  PRIMARY KEY (bereich, id)
);
CREATE INDEX IF NOT EXISTS saetze_zeit  ON saetze(bereich, geaendert);
CREATE INDEX IF NOT EXISTS saetze_seite ON saetze(bereich, seite);

CREATE TABLE IF NOT EXISTS freigaben (
  bereich   TEXT,
  seite     TEXT,
  kontoId   TEXT,
  rolle     TEXT,
  von       TEXT,
  wann      TEXT,
  PRIMARY KEY (bereich, seite, kontoId)
);
CREATE INDEX IF NOT EXISTS freigaben_konto ON freigaben(kontoId);

CREATE TABLE IF NOT EXISTS oeffentlich (
  schluessel TEXT PRIMARY KEY,
  bereich    TEXT,
  seite      TEXT,
  titel      TEXT,
  inhalt     TEXT,
  wann       TEXT,
  bis        TEXT,
  aufrufe    INTEGER DEFAULT 0,
  passwort   TEXT
);
CREATE INDEX IF NOT EXISTS oeffentlich_seite ON oeffentlich(bereich, seite);

CREATE TABLE IF NOT EXISTS protokoll (
  id       TEXT PRIMARY KEY,
  bereich  TEXT,
  kontoId  TEXT,
  art      TEXT,
  text     TEXT,
  objekt   TEXT,
  wann     TEXT
);
CREATE INDEX IF NOT EXISTS protokoll_zeit ON protokoll(bereich, wann);

CREATE TABLE IF NOT EXISTS marken (
  wert     TEXT PRIMARY KEY,
  art      TEXT,
  kontoId  TEXT,
  bereich  TEXT,
  name     TEXT,
  rechte   TEXT,
  angelegt TEXT,
  bis      TEXT,
  benutzt  TEXT
);
CREATE INDEX IF NOT EXISTS marken_konto ON marken(kontoId);

/* Rechte bis auf die einzelne Spalte. Eine Freigabe sagt „diese Seite ja",
   ein Feldrecht sagt „diese Seite ja, aber das Gehalt nicht".
   rolle: voll (sehen und ändern) · lesen (nur sehen) · kein (gar nicht).
   kontoId '*' gilt für alle, ein eigener Eintrag sticht ihn. */
CREATE TABLE IF NOT EXISTS feldrechte (
  bereich   TEXT,
  sammlung  TEXT,
  feld      TEXT,
  kontoId   TEXT,
  rolle     TEXT,
  von       TEXT,
  wann      TEXT,
  PRIMARY KEY (bereich, sammlung, feld, kontoId)
);
CREATE INDEX IF NOT EXISTS feldrechte_slg ON feldrechte(bereich, sammlung);

/* Die Bremse: wie oft jemand etwas versucht hat.

   Sie steht als eigene Tabelle da und nicht bei den Marken, weil sie etwas
   anderes ist: eine Marke ist ein Recht mit Ablaufdatum, ein Bremseintrag ist
   eine Zaehlung ohne jeden Wert. Der Unterschied zaehlt beim Aufraeumen — die
   Bremse darf jederzeit weggeworfen werden, eine Marke nicht.

   Gezaehlt werden nur FEHLVERSUCHE. Zaehlte man jeden Aufruf, sperrte sich
   eine viel gelesene oeffentliche Seite von selbst. */
CREATE TABLE IF NOT EXISTS bremse (
  schluessel TEXT PRIMARY KEY,
  treffer    INTEGER DEFAULT 0,
  seit       TEXT
);
CREATE INDEX IF NOT EXISTS bremse_seit ON bremse(seit);
`;

/* Die Tabellen, die der Kern kennt — alles andere wird abgewiesen. */
export const TABELLEN = ['konten', 'sitzungen', 'bereiche', 'saetze',
                         'freigaben', 'oeffentlich', 'protokoll', 'marken',
                         'feldrechte', 'bremse'];

/* Der Primärschlüssel je Tabelle. 'saetze' und 'freigaben' sind zusammengesetzt. */
const SCHLUESSEL = {
  konten: ['id'], sitzungen: ['token'], bereiche: ['id'],
  saetze: ['bereich', 'id'], freigaben: ['bereich', 'seite', 'kontoId'],
  oeffentlich: ['schluessel'], protokoll: ['id'], marken: ['wert'],
  feldrechte: ['bereich', 'sammlung', 'feld', 'kontoId'],
  bremse: ['schluessel']
};

/* ==========================================================================
 * 1 · IM ARBEITSSPEICHER — für Prüfungen und für den Betrieb ohne D1
 * ========================================================================*/
export const ablageSpeicher = () => {
  const tabellen = {};
  TABELLEN.forEach(t => { tabellen[t] = new Map(); });

  const schluesselVon = (tabelle, satz) =>
    SCHLUESSEL[tabelle].map(k => String(satz[k] ?? '')).join('\u0000');

  return {
    art: 'speicher',

    async einrichten() { return true; },

    async hole(tabelle, wo) {
      const m = tabellen[tabelle];
      if (!m) return null;
      return m.get(schluesselVon(tabelle, wo)) || null;
    },

    async setze(tabelle, satz) {
      const m = tabellen[tabelle];
      if (!m) throw new Error('Unbekannte Tabelle: ' + tabelle);
      m.set(schluesselVon(tabelle, satz), { ...satz });
      return satz;
    },

    async weg(tabelle, wo) {
      const m = tabellen[tabelle];
      if (!m) return false;
      return m.delete(schluesselVon(tabelle, wo));
    },

    /**
     * Alles, was auf `wo` passt. `wo` ist ein flaches Objekt; zusätzlich
     * versteht die Ablage `{ geaendertNach: '…' }` und `{ grenze: n }`.
     */
    async finde(tabelle, wo = {}, opt = {}) {
      const m = tabellen[tabelle];
      if (!m) return [];
      let raus = [...m.values()].filter(s =>
        Object.entries(wo).every(([k, v]) => String(s[k] ?? '') === String(v)));
      if (opt.geaendertNach)
        raus = raus.filter(s => String(s.geaendert || '') > String(opt.geaendertNach));
      if (opt.sortiere)
        raus.sort((a, b) => String(a[opt.sortiere] ?? '')
          .localeCompare(String(b[opt.sortiere] ?? '')) * (opt.absteigend ? -1 : 1));
      if (opt.grenze) raus = raus.slice(0, opt.grenze);
      return raus.map(s => ({ ...s }));
    },

    async zaehle(tabelle, wo = {}) {
      return (await this.finde(tabelle, wo)).length;
    },

    /** Nur für Prüfungen: alles wegwerfen. */
    async leeren() { TABELLEN.forEach(t => tabellen[t].clear()); }
  };
};

/* ==========================================================================
 * 2 · CLOUDFLARE D1
 * --------------------------------------------------------------------------
 * D1 spricht SQL. Die Fragezeichen werden von D1 selbst eingesetzt — deshalb
 * kommt hier nie ein Wert direkt in den Text. Das ist der einzige Schutz vor
 * eingeschleustem SQL, der wirklich hält.
 * ========================================================================*/
export const ablageD1 = (db) => {
  const pruefe = (tabelle) => {
    if (!TABELLEN.includes(tabelle)) throw new Error('Unbekannte Tabelle: ' + tabelle);
  };

  const woTeil = (wo) => {
    const schluessel = Object.keys(wo);
    if (!schluessel.length) return { text: '', werte: [] };
    return { text: ' WHERE ' + schluessel.map(k => `${k} = ?`).join(' AND '),
             werte: schluessel.map(k => wo[k]) };
  };

  return {
    art: 'd1',

    async einrichten() {
      for (const stueck of SCHEMA.split(';')) {
        const s = stueck.trim();
        if (s) await db.prepare(s).run();
      }
      return true;
    },

    async hole(tabelle, wo) {
      pruefe(tabelle);
      const nur = {};
      SCHLUESSEL[tabelle].forEach(k => { nur[k] = wo[k]; });
      const w = woTeil(nur);
      const r = await db.prepare(`SELECT * FROM ${tabelle}${w.text} LIMIT 1`)
        .bind(...w.werte).first();
      return r || null;
    },

    async setze(tabelle, satz) {
      pruefe(tabelle);
      const spalten = Object.keys(satz);
      const platz = spalten.map(() => '?').join(', ');
      await db.prepare(
        `INSERT OR REPLACE INTO ${tabelle} (${spalten.join(', ')}) VALUES (${platz})`
      ).bind(...spalten.map(k => satz[k])).run();
      return satz;
    },

    async weg(tabelle, wo) {
      pruefe(tabelle);
      const nur = {};
      SCHLUESSEL[tabelle].forEach(k => { nur[k] = wo[k]; });
      const w = woTeil(nur);
      await db.prepare(`DELETE FROM ${tabelle}${w.text}`).bind(...w.werte).run();
      return true;
    },

    async finde(tabelle, wo = {}, opt = {}) {
      pruefe(tabelle);
      const w = woTeil(wo);
      let text = `SELECT * FROM ${tabelle}${w.text}`;
      const werte = [...w.werte];
      if (opt.geaendertNach) {
        text += (w.text ? ' AND' : ' WHERE') + ' geaendert > ?';
        werte.push(opt.geaendertNach);
      }
      if (opt.sortiere) {
        /* Der Spaltenname kommt nie von aussen — er steht im Kern fest. */
        text += ` ORDER BY ${opt.sortiere}` + (opt.absteigend ? ' DESC' : ' ASC');
      }
      if (opt.grenze) text += ` LIMIT ${Number(opt.grenze) || 100}`;
      const r = await db.prepare(text).bind(...werte).all();
      return (r && r.results) || [];
    },

    async zaehle(tabelle, wo = {}) {
      pruefe(tabelle);
      const w = woTeil(wo);
      const r = await db.prepare(`SELECT COUNT(*) AS n FROM ${tabelle}${w.text}`)
        .bind(...w.werte).first();
      return (r && r.n) || 0;
    }
  };
};
