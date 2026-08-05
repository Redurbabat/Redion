/* ============================================================================
 * server/sicherheit/eingaben.js — wie gross darf hereinkommen, was hereinkommt
 * ----------------------------------------------------------------------------
 * `LUECKEN.md` führte das als Ordnungsaufgabe: die Prüfungen stehen je Route
 * statt an einem Ort, aber sie stehen. Beim Nachmessen war das nur die halbe
 * Wahrheit — die Messung hatte die Felder angesehen, die eine Prüfung HABEN,
 * und nicht die, die keine haben.
 *
 * ZWEI DINGE FEHLTEN GANZ:
 *
 *   1. **Eine Obergrenze für den Anfragekörper.** `request.json()` liest, was
 *      kommt. Kein `Content-Length`, keine Grenze, kein Abbruch. Wer 200 MB
 *      schickt, bekommt sie geparst — im Arbeitsspeicher eines Workers, der
 *      128 MB hat.
 *   2. **Eine Grenze für `inhalt`.** Beim Veröffentlichen einer Seite ist der
 *      `titel` auf 200 Zeichen begrenzt und der Inhalt auf gar nichts. Er
 *      läuft durch `sauber()` — mehrere reguläre Ausdrücke über die ganze
 *      Zeichenkette — und danach in die Datenbank.
 *
 * Das ist kein Loch, durch das Daten abfliessen, sondern eines, durch das
 * welche hineinlaufen: fremder Speicherplatz, fremde Rechenzeit, und eine
 * Rechnung, die jemand anders bezahlt.
 *
 * ─── WARUM EINE TABELLE UND KEINE FUNKTION JE FELD ──────────────────────────
 *
 * Ein Bereichsname darf 80 Zeichen, ein Markenname 60. Das ist kein
 * Widerspruch — es sind zwei verschiedene Dinge. Dass man den Unterschied
 * bisher nur bemerkte, wenn man zufällig beide Zeilen nebeneinander las,
 * schon. Eine Tabelle macht die Zahlen vergleichbar; erst dann fällt auf,
 * wenn eine davon nicht passt.
 *
 * ─── UND WARUM DIE GRENZEN NICHT ÜBERALL GLEICH SIND ────────────────────────
 *
 * Eine Grenze, die zu eng sitzt, ist schlimmer als keine. Der Abgleich
 * schickt bis zu 300 Sätze auf einmal; bricht er bei der ersten grossen Seite
 * ab, verliert jemand seine Änderungen — und das verbietet Priorität 1 des
 * Auftrags. Deshalb hat jede Routenfamilie ihre eigene Zahl, und der Abgleich
 * die grosszügigste.
 * ==========================================================================*/

const MB = 1024 * 1024;

/**
 * Jedes Feld, das über die Schnittstelle hereinkommt und irgendwo landet.
 * Der Name ist der ZWECK, nicht der Schlüssel im JSON — `bereichName` und
 * `markeName` heissen beide `name`, und genau darum geht es.
 */
export const FELDER: Record<string, { max: number; vorgabe: string }> = {
  bereichName:   { max: 80,      vorgabe: 'Neuer Bereich' },
  markeName:     { max: 60,      vorgabe: 'Ohne Namen' },
  geraet:        { max: 60,      vorgabe: 'Unbekannt' },
  titel:         { max: 200,     vorgabe: 'Ohne Titel' },
  protokollText: { max: 500,     vorgabe: '' },
  kennung:       { max: 64,      vorgabe: '' },
  rolle:         { max: 16,      vorgabe: 'lesen' },
  code:          { max: 32,      vorgabe: '' },
  suchwort:      { max: 200,     vorgabe: '' },

  /* Der Inhalt einer veröffentlichten Seite. Zwei Megabyte HTML sind rund
     eine Million Zeichen Text — ein Buch. Wer mehr veröffentlichen will,
     teilt die Seite; wer eine Datenbank füllen will, kommt nicht weit. */
  inhalt:        { max: 2 * MB,  vorgabe: '' }
};

/** Was für ein Feld gilt, das in der Tabelle fehlt. Lieber eng als offen. */
export const VORGABE_FELD = { max: 1000, vorgabe: '' };

/**
 * Ein Textfeld, wie es hereinkommen darf: als Zeichenkette, ohne Leerraum
 * aussen, auf seine Länge gekürzt, und leer wird zur Vorgabe.
 *
 * Die Reihenfolge ist Absicht: erst kürzen, dann alles Weitere. Wer zuerst
 * säubert und danach schneidet, hat den teuren Teil über die volle Länge
 * laufen lassen — die Grenze käme zu spät, um etwas zu sparen.
 */
export const text = (wert: unknown, feld: string): string => {
  const regel = FELDER[feld] ?? VORGABE_FELD;
  const roh = (wert === null || wert === undefined) ? '' : String(wert);
  const kurz = roh.length > regel.max ? roh.slice(0, regel.max) : roh;
  const sauber = kurz.trim();
  return sauber === '' ? regel.vorgabe : sauber;
};

/**
 * Der Wert muss aus einer Liste kommen — sonst gilt der Rückfall.
 *
 * Es fällt ZU, nicht auf: eine unbekannte Rolle wird `kein`, nicht `voll`.
 * Diese Richtung lässt sich beim Umbauen lautlos umdrehen, deshalb steht sie
 * hier an einer Stelle und nicht dreimal verteilt.
 */
export const ausListe = (wert: any, erlaubt: any, rueckfall: any) => {
  const w = String(wert === null || wert === undefined ? '' : wert).trim();
  return erlaubt.includes(w) ? w : rueckfall;
};

/* ============================================================================
 * DIE OBERGRENZE FÜR DEN ANFRAGEKÖRPER
 * ==========================================================================*/

/**
 * Je Routenfamilie eine Zahl, mit dem Grund daneben.
 *
 * Die Reihenfolge in dieser Liste zählt: der erste Treffer gilt. `/abgleich`
 * steht vor `/`, sonst gälte für alles die kleine Grenze.
 */
export const KOERPER = [
  /* Der Abgleich schickt bis zu 300 Sätze (`KONSTANTEN.ABGLEICH_RUNDE`).
     Bei einer grossen Seite sind das schnell ein paar Megabyte. Zu eng
     heisst hier: ein Gerät kann nicht mehr abgleichen und merkt es nicht. */
  { pfad: '/abgleich', grenze: 16 * MB },
  /* Veröffentlichen schickt eine ganze Seite als HTML — das Feld `inhalt`
     darf 2 MB, der Körper etwas mehr für Titel und Beiwerk. */
  { pfad: '/oeffentlich', grenze: 4 * MB },
  { pfad: '/s/',         grenze: 64 * 1024 },   /* nur ein Passwort */
  /* Alles andere sind Namen, Kennungen und Rollen. Ein Megabyte ist dafür
     schon grosszügig — es steht hier nur, damit ein vergessener Sonderfall
     nicht sofort umfällt. */
  { pfad: '/',           grenze: 1 * MB }
];

export const koerperGrenze = (pfad: string) => {
  const p = String(pfad || '/');
  const treffer = KOERPER.find(x => p.startsWith(x.pfad));
  return treffer ? treffer.grenze : 1 * MB;
};

/**
 * @param pfad
 * @param laenge  der Wert aus `Content-Length` — er kommt als Text herein
 *
 * OHNE LÄNGENANGABE WIRD NICHT GERATEN. Ein Absender, der keine schickt
 * (etwa bei `Transfer-Encoding: chunked`), ist deswegen kein Angreifer, und
 * eine Anfrage abzulehnen, deren Grösse man nicht kennt, würde vor allem die
 * eigene App treffen. Der Schutz ist die billige Hälfte: wer eine Zahl
 * nennt, wird an ihr gemessen.
 */
export const koerperZuGross = (pfad: string,
                               laenge: number | string | null | undefined): boolean => {
  if (laenge === null || laenge === undefined || laenge === '') return false;
  const n = Number(laenge);
  if (!Number.isFinite(n) || n < 0) return false;
  return n > koerperGrenze(pfad);
};

/** Die Antwort auf einen zu grossen Körper — überall dieselbe. */
export const zuGrossAntwort = (pfad: string) => ({
  status: 413,
  kopf: { 'Content-Type': 'application/json; charset=utf-8' },
  koerper: JSON.stringify({
    object: 'error', status: 413, code: 'payload_too_large',
    message: 'Diese Anfrage ist zu gross. Hier gehen höchstens ' +
             Math.round(koerperGrenze(pfad) / MB * 10) / 10 + ' MB.'
  })
});
