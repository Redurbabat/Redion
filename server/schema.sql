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
