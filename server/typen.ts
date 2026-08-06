/* ==========================================================================
 * server/typen.ts — die Formen, mit denen der Server arbeitet
 * --------------------------------------------------------------------------
 * WARUM DIESE DATEI. Beim Umzug nach TypeScript wäre `any` die schnellste
 * Antwort auf jede Meldung gewesen. Für einen Server, der Anmeldungen,
 * Zugangsschlüssel und Sperren behandelt, ist sie die falsche: ein Typecheck,
 * der nur `any` sieht, prüft nichts und behauptet trotzdem, geprüft zu haben.
 * Das ist die Zierde, vor der `tsconfig.json` warnt.
 *
 * Deshalb stehen hier die Formen, die der Server ohnehin schon hatte — sie
 * standen bisher nur in Kommentaren und in JSDoc-Zeilen. Fünf Begriffe
 * reichen:
 *
 *   Anfrage   was hereinkommt   (Methode, Pfad, Kopfzeilen, Körper, Suche)
 *   Antwort   was hinausgeht    (Status, Kopfzeilen, Körper als Text)
 *   Ablage    wo Daten liegen   (die sieben Funktionen aus ablage.ts)
 *   Wer       wer fragt         (Konto und Sitzung oder Marke)
 *   Umwelt    die Einstellungen (Schlüssel der Anbieter, `holen`, `DB`)
 *
 * DER GEWINN IST NICHT DIE SCHREIBWEISE. `Ablage` steht in `ablage.ts` über
 * beiden Umsetzungen — der im Arbeitsspeicher und der auf D1. Der Kommentar
 * dort sagt seit dem ersten Tag „Beide können genau dasselbe"; ab jetzt sagt
 * das der Übersetzer, und zwar bevor jemand veröffentlicht. Wer der einen ein
 * Feld hinzufügt und der anderen nicht, erfährt es hier statt im Betrieb.
 *
 * Diese Datei erzeugt nichts. Sie steht nicht in `tsconfig.bauen.json`; sie
 * beschreibt nur und wird beim Ausführen von Node restlos entfernt.
 * ========================================================================*/

/* --------------------------------------------------------------------------
 * 1 · ABLAGE
 * ------------------------------------------------------------------------*/

/** Ein Satz aus einer Tabelle. Die Spalten stehen in `schema.sql`; welche
 *  davon belegt sind, hängt an der Tabelle — deshalb offen und nicht fest. */
export type Satz = Record<string, any>;

/** Die Bedingung einer Abfrage: Spalte gleich Wert, mit UND verbunden. */
export type Wo = Record<string, string | number | boolean | null | undefined>;

/** Die Zusätze zu `finde`. Alle vier sind freiwillig; ohne sie kommt alles
 *  in der Reihenfolge der Ablage. */
export type FindeOpt = {
  geaendertNach?: string;
  sortiere?: string;
  absteigend?: boolean;
  grenze?: number;
};

/**
 * Die schmale Schnittstelle aus `ablage.ts`. Sieben Funktionen — wer eine
 * dritte Ablage baut (Postgres, Datei), muss genau diese liefern.
 *
 * `art` sagt, welche es ist. Der Kern liest das an einer Stelle: die
 * Speicherablage überlebt keinen Neustart, und der Stand-Bericht sagt das.
 */
export type Ablage = {
  art: string;
  einrichten(): Promise<unknown>;
  hole(tabelle: string, wo: Wo): Promise<Satz | null>;
  setze(tabelle: string, satz: Satz): Promise<Satz>;
  weg(tabelle: string, wo: Wo): Promise<boolean>;
  finde(tabelle: string, wo?: Wo, opt?: FindeOpt): Promise<Satz[]>;
  zaehle(tabelle: string, wo?: Wo): Promise<number>;
  leeren?(): Promise<void>;
};

/**
 * Die Ablage für Datei-Stücke — Bytes, keine Sätze (E2: grosse Dateien
 * gehören nicht in D1). In der Wolke steckt R2 dahinter, im Prüfserver
 * eine Map. Schlüssel sind `bereich/dateiId/nr`.
 */
export type Blobs = {
  art: string;
  lege(schluessel: string, bytes: Uint8Array): Promise<void>;
  hole(schluessel: string): Promise<Uint8Array | null>;
  weg(schluessel: string): Promise<boolean>;
};

/* --------------------------------------------------------------------------
 * 2 · ANFRAGE UND ANTWORT
 * ------------------------------------------------------------------------*/

/** Kopfzeilen kommen klein geschrieben herein — der Kern liest
 *  `kopf.authorization`, nicht `kopf.Authorization`. */
export type Kopfzeilen = Record<string, string | undefined>;

/**
 * Was der Kern zu beantworten bekommt. `pruefserver.ts` baut das aus einer
 * Node-Anfrage, `cloudflare.ts` aus einer `Request` — der Kern kennt
 * beides nicht und soll es nicht kennen.
 */
export type Anfrage = {
  methode: string;
  pfad: string;
  kopf: Kopfzeilen;
  koerper?: any;
  suche?: Record<string, string>;
  adresse?: string;
};

/** Was zurückgeht. `koerper` ist immer schon Text — JSON wird von `antwort`
 *  gemacht, nicht vom Aufrufer. */
export type Antwort = {
  status: number;
  kopf: Record<string, string>;
  koerper: string;
};

/* --------------------------------------------------------------------------
 * 3 · WER FRAGT
 * ------------------------------------------------------------------------*/

/** Das Ergebnis von `werFragt`. Entweder eine Sitzung (ein Mensch an einem
 *  Gerät) oder eine Marke (ein Programm) — nie beides. */
export type Wer = {
  konto: Satz;
  sitzung?: Satz;
  marke?: Satz;
  rechte: string[];
};

/* --------------------------------------------------------------------------
 * 4 · UMWELT
 * ------------------------------------------------------------------------*/

/**
 * Die Einstellungen des Servers. Bei Cloudflare ist das `env` aus dem
 * Worker, im Prüflauf ein Objekt aus dem Prüflauf selbst.
 *
 * `holen` ist absichtlich dabei: der Anmeldeweg fragt beim Anbieter nach,
 * und ein Prüflauf setzt hier seine eigene Fassung ein, statt wirklich ins
 * Netz zu gehen. Ohne diesen Platz müsste der Kern `fetch` fest nennen und
 * wäre nicht mehr allein prüfbar.
 */
export type Umwelt = {
  ADRESSE?: string;
  holen?: typeof fetch;
  DB?: unknown;
  /** Die Blob-Ablage für Anhänge (`/datei/*`). Fehlt sie, sagen die
   *  Datei-Wege 503 mit dem Weg zur Einrichtung — alles andere läuft. */
  blobs?: Blobs | null;
  [schluessel: string]: any;
};
