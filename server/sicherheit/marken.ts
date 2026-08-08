/* ============================================================================
 * server/sicherheit/marken.js — was eine Marke darf und was nur ein Mensch
 * ----------------------------------------------------------------------------
 * Eine **Marke** ist ein Zugangsschlüssel für ein Programm: eine Verknüpfung,
 * ein Skript, ein Agent. Beim Anlegen kann man ihr sagen, was sie darf —
 * `lesen`, `schreiben`, oder `alles`.
 *
 * ─── DIE EINSCHRÄNKUNG GAB ES, UND SIE GRIFF AN ZWEI VON NEUN STELLEN ───────
 *
 * `markeDarf(…)` stand in `v1Weg` und in `mcpWeg`. Die übrigen Wege —
 * `/sync`, `/bereich`, `/freigabe`, `/feldrecht`, `/veroeffentlichen`,
 * `/protokoll`, `/marken` — fragten nicht danach. Eine Marke mit `lesen`
 * konnte also über `/bereich` schreiben, über `/sync` den ganzen Bestand
 * ersetzen und über `/marken` **sich selbst eine neue Marke mit `alles`
 * ausstellen**.
 *
 * Das ist dieselbe Sorte wie schon sechsmal in dieser Session: an einer
 * Stelle getan, an der benachbarten nicht. Nur trägt sie hier den Namen
 * einer Sicherheitszusage — „diese Marke darf nur lesen" stand in der
 * Oberfläche, und es stimmte für zwei von neun Wegen.
 *
 * ─── DREI REGELN, AN EINEM ORT ──────────────────────────────────────────────
 *
 *   1. Eine **Sitzung** (ein Mensch am Gerät) darf weiterhin alles, was ihre
 *      Rolle im Bereich hergibt. Hier ändert sich nichts.
 *   2. Eine **Marke** darf schreiben, wenn sie `schreiben` oder `alles` hat,
 *      und lesen, wenn sie irgendetwas davon hat. Wer schreiben darf, darf
 *      auch lesen — sonst könnte niemand nachsehen, was er geschrieben hat.
 *   3. **Rechte vergeben darf keine Marke**, auch keine mit `alles`. Wer
 *      einlässt, wer aussperrt und wer neue Schlüssel bekommt, ist eine
 *      Entscheidung für einen Menschen an einem Gerät. Ein Schlüssel, der
 *      neue Schlüssel ausstellen kann, ist keine Einschränkung mehr.
 *
 * Regel 3 ist die wichtigste und die, die am ehesten wieder verlorengeht:
 * sie sieht wie eine Unbequemlichkeit aus, solange man nicht daran denkt,
 * dass eine Marke abhandenkommen kann.
 * ==========================================================================*/

/** Was beim Anlegen einer Marke überhaupt eingetragen werden darf. */
export const MARKEN_RECHTE = ['lesen', 'schreiben', 'alles'];

/**
 * Wege, die eine Marke gar nicht betreten darf — auch mit `alles` nicht.
 * Alle drei ändern, WER etwas darf:
 *   marken      neue Schlüssel ausstellen und alte zurückziehen
 *   freigabe    jemanden in einen Bereich hinein- oder hinauslassen
 *   feldrecht   einzelne Spalten öffnen oder sperren
 */
/* `push` gehört dazu, seit es Weckrufe gibt (E54). Eine Marke ist ein
   Schlüssel für ein Programm; ein Weckruf ist ein Wecker für einen
   Menschen an einem Gerät. Dürfte eine Marke ihn legen, könnte ein
   Skript mit `schreiben`-Recht fremde Telefone um drei Uhr nachts
   klingeln lassen — und das steht in keiner Rechteliste. */
export const NUR_MIT_SITZUNG = ['marken', 'freigabe', 'feldrecht', 'push'];

/** Methoden, die etwas verändern. Alles Übrige gilt als Lesen. */
const SCHREIBT = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Wege, bei denen die Methode NICHT verrät, ob gelesen oder geschrieben wird.
 *
 * DAS HAT DER ERSTE WURF FALSCH GEMACHT, und ein Prüflauf hat es gefangen:
 * `POST /v1/search` ist ein Suchen, und `POST /v1/databases/:id/query` ist
 * ein Abfragen — beides Lesen, beides POST, weil der Filter in den Körper
 * gehört und nicht in die Adresse. Das MCP ist dasselbe eine Stufe weiter:
 * ein einziger POST, und was er tut, steht im Namen des Werkzeugs.
 *
 * Dort entscheidet die Route selbst, und zwar mit derselben Funktion
 * (`darfMarke`) — nicht mit einer eigenen Rechnung. Das Tor lässt sie
 * deshalb durch, hält aber Regel 3 auch für sie aufrecht.
 *
 * Die Alternative wäre gewesen, hier eine Liste der lesenden POST-Adressen
 * zu führen. Dann stünde das Wissen über die Route an zwei Orten — und beim
 * nächsten neuen Endpunkt an einem davon nicht.
 */
const SELBST_PRUEFEND = ['v1', 'mcp', 'sync', 'datei'];

/* NACHGETRAGEN AM 6. AUGUST: `sync` und `datei` gehören in dieselbe Reihe,
   und dass sie fehlten, machte das Leserecht wertlos. Beide Abgleichswege
   sind POST — der Filter (`seit`, `bereich`) gehört in den Körper —, und
   das Tor las daraus „schreibt". Eine Marke mit `lesen` bekam auf
   `/sync/runter` die Antwort „Diese Marke darf nicht schreiben": sie
   konnte nichts lesen. Wer lesen wollte, musste `schreiben` vergeben —
   und damit genau das Recht, den ganzen Bestand zu ersetzen, gegen das
   dieses Tor gebaut wurde.

   Die Routen stellen die Frage jetzt selbst, mit derselben `darfMarke`:
   runter und stand brauchen `lesen`, hoch, melden, stueck und weg
   brauchen `schreiben`. */

/** Die Rechte dieser Marke als Liste — eine Sitzung hat sie alle. */
export const rechteVon = (wer: any) => {
  if (!wer || !wer.marke) return ['alles'];
  return String(wer.marke.rechte || '')
    .split(',').map(x => x.trim()).filter(Boolean);
};

/**
 * Darf dieser Zugang das?
 * @param {object} wer  aus `werFragt`
 * @param {'lesen'|'schreiben'} was
 */
export const darfMarke = (wer: any, was: any) => {
  const r = rechteVon(wer);
  if (r.includes('alles')) return true;
  if (was === 'lesen') return r.includes('lesen') || r.includes('schreiben');
  return r.includes(was);
};

/**
 * Das Tor vor allen Wegen. Gibt `null` zurück, wenn es weitergehen darf,
 * sonst `{ status, code, satz }` — der Aufrufer macht daraus seine Antwort.
 *
 * @param {object} wer       aus `werFragt`
 * @param {string} familie   der erste Teil des Pfades, z. B. 'bereich'
 * @param {string} methode   GET, POST, …
 */
export const torPruefen = (wer: any, familie: any, methode: any) => {
  if (!wer || !wer.marke) return null;                 /* Mensch: weiter */

  if (NUR_MIT_SITZUNG.includes(familie))
    return { status: 403, code: 'restricted_resource',
             satz: 'Rechte und Schlüssel ändert nur ein Mensch am Gerät, nicht eine ' +
                   'Marke. Melde dich in Redion an und mach es dort.' };

  /* Regel 3 gilt auch hier — nur die Frage lesen-oder-schreiben stellt
     die Route selbst. */
  if (SELBST_PRUEFEND.includes(familie)) return null;

  const braucht = SCHREIBT.includes(String(methode || '').toUpperCase())
    ? 'schreiben' : 'lesen';
  if (!darfMarke(wer, braucht))
    return { status: 403, code: 'restricted_resource',
             satz: 'Diese Marke darf nicht ' + braucht + '. Ihre Rechte: ' +
                   (rechteVon(wer).join(', ') || 'keine') + '. Lege in Redion eine ' +
                   'neue Marke mit den passenden Rechten an.' };

  return null;
};
