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

/* --------------------------------------------------------------------------
   Die Bremse: wie oft jemand etwas versucht hat.

   Sie steht als eigene Tabelle da und nicht bei den `marken`, weil sie etwas
   anderes ist: eine Marke ist ein Recht mit Ablaufdatum, ein Bremseintrag ist
   eine Zählung ohne jeden Wert. Der Unterschied zählt beim Aufräumen — die
   Bremse darf jederzeit weggeworfen werden, eine Marke nicht.

   Gezählt werden nur FEHLVERSUCHE. Zählte man jeden Aufruf, sperrte sich eine
   viel gelesene öffentliche Seite von selbst.

   `CREATE TABLE IF NOT EXISTS` — ein bestehender Bestand bekommt die Tabelle
   beim nächsten Einspielen dazu und verliert nichts.
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS bremse (
  schluessel TEXT PRIMARY KEY,
  treffer    INTEGER DEFAULT 0,
  seit       TEXT
);
CREATE INDEX IF NOT EXISTS bremse_seit ON bremse(seit);

/* --------------------------------------------------------------------------
   Anhänge: nur die METADATEN. Die Bytes liegen stückweise in R2 unter
   `bereich/dateiId/nr` — grosse Dateien gehören nicht in D1 (E2).
   `geloescht` bleibt als Grabstein stehen, damit der Abgleich der anderen
   Geräte vom Löschen erfährt, statt die Datei ewig neu hochzuladen.
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS dateien (
  id             TEXT,
  bereich        TEXT,
  name           TEXT,
  groesse        INTEGER DEFAULT 0,
  typ            TEXT,
  seite          TEXT,
  teile          INTEGER DEFAULT 1,
  verschluesselt INTEGER DEFAULT 0,
  version        INTEGER DEFAULT 1,
  geaendert      TEXT,
  geloescht      INTEGER DEFAULT 0,
  PRIMARY KEY (bereich, id)
);
CREATE INDEX IF NOT EXISTS dateien_zeit ON dateien(bereich, geaendert);

/* --------------------------------------------------------------------------
   WECKRUFE — Web Push (L33, E54)
   --------------------------------------------------------------------------
   HIER STEHT KEIN ERINNERUNGSTEXT, und das ist der ganze Entwurf. Ein Web
   Push kann Inhalt mitbringen; Redion schickt keinen. Der Server erfährt
   einen Zeitpunkt und die Adresse eines Geräts — nicht, woran erinnert
   wird. „Zahnarzt 14:00" ist genau die Sorte Satz, die local-first
   schützen soll.

   Der Stoss sagt nur „wach auf". Was fällig ist, liest das Dienst-Skript
   danach aus der lokalen IndexedDB des Geräts.
   -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS weckrufe (
  id       TEXT PRIMARY KEY,
  kontoId  TEXT,
  geraet   TEXT,
  endpunkt TEXT,
  p256dh   TEXT,
  auth     TEXT,
  wann     TEXT,
  angelegt TEXT
);
CREATE INDEX IF NOT EXISTS weckrufe_wann ON weckrufe(wann);
CREATE INDEX IF NOT EXISTS weckrufe_konto ON weckrufe(kontoId);
