/* ============================================================================
 * core/import/sicherheit.ts — fremde Sicherungen entschärfen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/import/sicherheit.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/import/sicherheit.js`. Wer das .js bearbeitet, verliert
 * die Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * WAS HIER SCHIEFGING, BEVOR ES DIESE DATEI GAB (E284).
 *
 * `importAll` las eine fremde Sicherung mit einem blanken `JSON.parse` und
 * legte das Ergebnis unbesehen in den Zwischenspeicher:
 *
 *     const d = JSON.parse(json);
 *     if (!d.blocks) throw new Error('Das sieht nicht nach einer Sicherung …');
 *     …
 *     Object.assign(cache.meta, neu.meta);      // zusammenfuehren
 *     cache.meta = neu.meta;                    // ersetzen
 *
 * Das sind zwei verschiedene Löcher, und das erste ist das gemeinere.
 *
 * ─── LOCH 1: `Object.assign` ruft Setzer auf ────────────────────────────────
 *
 * `JSON.parse('{"__proto__":{"a":1}}')` erzeugt ein Objekt mit einer EIGENEN
 * Eigenschaft namens `__proto__`. Das ist harmlos, solange niemand sie
 * weiterreicht. `Object.assign` reicht sie weiter — und zwar über `[[Set]]`,
 * also über den geerbten `__proto__`-SETZER. Damit bekommt `cache.meta`
 * einen fremden Prototyp.
 *
 * Danach gibt `getMeta('irgendwas')` nicht mehr `undefined` zurück, sondern
 * das, was der Angreifer hineingelegt hat. `wolkeAbgleich`, `wolkeToken`,
 * `theme`, `agent:notaus` — alles, was über `cache.meta[k]` gelesen wird und
 * heute nicht gesetzt ist. Dasselbe für `cache.blocks[id]`: eine Kennung,
 * die es nicht gibt, liefert plötzlich einen Block.
 *
 * ─── LOCH 2: das geparste Objekt WIRD der Zwischenspeicher ──────────────────
 *
 * Beim „ersetzen" wird gar nicht kopiert — `cache.meta = neu.meta` macht das
 * geparste Objekt selbst zum Verzeichnis. Ein Schlüssel `constructor` oder
 * `prototype` steht dann als gewöhnlicher Eintrag darin und bringt jeden
 * Code durcheinander, der `if (verzeichnis[k])` schreibt: `{}.constructor`
 * ist wahr, auch wenn nichts gesetzt wurde.
 *
 * ─── DIE ANTWORT: PROTOTYPLOSE VERZEICHNISSE ────────────────────────────────
 *
 * Ein Verzeichnis, das aus `Object.create(null)` kommt, hat keinen
 * `__proto__`-Setzer, den man auslösen könnte, und `verzeichnis['constructor']`
 * ist ehrlich `undefined`. Das ist keine Filterung, die man vergessen kann —
 * es ist eine Form, die das Problem nicht hat.
 *
 * Zusätzlich fliegen die drei Namen beim Kopieren raus. Zwei Wälle statt
 * einem, weil der erste an einer Stelle vergessen werden kann, an die heute
 * niemand denkt.
 *
 * ─── WARUM NICHT EIN `reviver` BEI `JSON.parse` ─────────────────────────────
 *
 * Ein `reviver`, der `__proto__` verwirft, ist der übliche Rat und er wäre
 * hier zu wenig: er säubert die WERTE, aber er ändert nichts daran, dass
 * `cache.meta` ein gewöhnliches `{}` mit `Object.prototype` bleibt. Der
 * nächste `Object.assign` aus einer anderen Quelle stünde wieder offen.
 *
 * ─── WAS DIESE DATEI NICHT TUT ──────────────────────────────────────────────
 *
 * Sie prüft nicht, ob die Sicherung inhaltlich stimmt — das ist
 * `validierung.ts`. Sie sagt nicht, was sich ändern wird — das ist die
 * Vorschau. Hier geht es einzig darum, dass fremde Schlüssel nichts
 * übernehmen können.
 * ==========================================================================*/

const ImportSicherheit = (() => {

  /* Die drei Namen, über die ein fremdes Objekt Einfluss auf Code nimmt, den
     es nie gesehen hat. `__proto__` ist der Setzer, `constructor` und
     `prototype` sind die Wege dorthin über Umwege. */
  const GEFAEHRLICH = ['__proto__', 'constructor', 'prototype'];

  /** Ist dieser Schlüssel einer der drei? */
  const istGefaehrlich = (schluessel: string): boolean =>
    GEFAEHRLICH.indexOf(schluessel) !== -1;

  /**
   * Was beim Entschärfen weggefallen ist.
   *
   * Nicht kosmetisch: eine Sicherung, die still verändert wurde, ist die
   * gefährlichste Sorte — man merkt es erst, wenn man sie braucht (§52.10,
   * derselbe Gedanke wie `fehlt` im Manifest).
   */
  type Fund = {
    /** Wie oft ein gefährlicher Schlüssel entfernt wurde. */
    entfernt: number;
    /** Wo — höchstens die ersten zwanzig Wege, sonst wird die Liste zum Roman. */
    wege: string[];
    /** true, sobald die Tiefengrenze griff — dann ist der Rest ungeprüft. */
    zuTief: boolean;
  };

  const leererFund = (): Fund => ({ entfernt: 0, wege: [], zuTief: false });

  /* Eine Sicherung darf verschachtelt sein, aber nicht beliebig. Hundert
     Ebenen sind mehr, als jedes echte Redion-Objekt braucht (der tiefste
     Fall ist ein Block mit `props` mit einer Liste mit Objekten — vier).
     Ohne Grenze wäre eine böswillig tiefe Datei ein Weg, den Stapel zu
     sprengen, bevor irgendeine Prüfung greift. */
  const MAX_TIEFE = 100;

  /* Wie viele Wege im Bericht stehen. Mehr hilft niemandem beim Lesen. */
  const MAX_WEGE = 20;

  /**
   * Ein Wert, aus dem alle gefährlichen Schlüssel entfernt sind — und in dem
   * jedes Verzeichnis prototyplos ist.
   *
   * Arbeitet mit einem eigenen Stapel statt mit Rekursion: die Tiefe ist
   * begrenzt, aber die BREITE ist es nicht, und eine Sicherung mit
   * zweihunderttausend Blöcken soll den Stapel nicht anfassen.
   *
   * @param roh   frisch aus `JSON.parse`
   * @param fund  wird mitgeschrieben; `leererFund()` übergeben
   */
  const entgiften = (roh: unknown, fund: Fund): unknown => {

    /* Ein Bauauftrag: „setze in `ziel` unter `schluessel` die entgiftete
       Fassung von `quelle`". Der Stapel hält diese Aufträge, statt sich
       selbst aufzurufen. */
    type Auftrag = {
      quelle: unknown;
      setzen: (wert: unknown) => void;
      tiefe: number;
      weg: string;
    };

    let ergebnis: unknown = undefined;
    const stapel: Auftrag[] = [
      { quelle: roh, setzen: (w) => { ergebnis = w; }, tiefe: 0, weg: '' }
    ];

    while (stapel.length) {
      const a = stapel.pop()!;
      const q = a.quelle;

      /* Alles, was kein Objekt ist, kann keinen Prototyp tragen. */
      if (q === null || typeof q !== 'object') { a.setzen(q); continue; }

      if (a.tiefe >= MAX_TIEFE) {
        /* Nicht weiterlaufen und auch nicht durchreichen: ab hier ist
           nichts geprüft, und ungeprüft durchreichen wäre genau das Loch.
           `null` ist ehrlicher als ein halb geprüfter Ast. */
        fund.zuTief = true;
        a.setzen(null);
        continue;
      }

      if (Array.isArray(q)) {
        const neu: unknown[] = new Array(q.length);
        a.setzen(neu);
        for (let i = 0; i < q.length; i++) {
          stapel.push({
            quelle: q[i],
            setzen: (w) => { neu[i] = w; },
            tiefe: a.tiefe + 1,
            weg: a.weg + '[' + i + ']'
          });
        }
        continue;
      }

      /* PROTOTYPLOS. Das ist der eigentliche Schutz — nicht die Liste
         unten, sondern diese Zeile. */
      const neu: Record<string, unknown> = Object.create(null);
      a.setzen(neu);

      /* `Object.keys` liefert nur EIGENE, aufzählbare Schlüssel. Ein
         geerbtes `toString` steht also gar nicht zur Debatte. */
      for (const k of Object.keys(q as Record<string, unknown>)) {
        if (istGefaehrlich(k)) {
          fund.entfernt++;
          if (fund.wege.length < MAX_WEGE) {
            fund.wege.push((a.weg ? a.weg + '.' : '') + k);
          }
          continue;
        }
        stapel.push({
          quelle: (q as Record<string, unknown>)[k],
          setzen: (w) => { neu[k] = w; },
          tiefe: a.tiefe + 1,
          weg: a.weg ? a.weg + '.' + k : k
        });
      }
    }

    return ergebnis;
  };

  /**
   * Ein Verzeichnis aus fremden Daten — prototyplos, ohne die drei Namen.
   *
   * Für die Stellen, die schon ein Objekt haben und nur ein sicheres
   * Verzeichnis daraus brauchen (`neu.blocks`, `neu.meta` …). Der Inhalt
   * wird dabei MIT entgiftet: ein Block, dessen `props` einen `__proto__`
   * trägt, ist genauso ein Problem wie das Verzeichnis selbst.
   */
  const verzeichnis = (roh: unknown, fund?: Fund): Record<string, any> => {
    const f = fund || leererFund();
    const sauber = entgiften(roh, f);
    if (sauber === null || typeof sauber !== 'object' || Array.isArray(sauber)) {
      return Object.create(null);
    }
    return sauber as Record<string, any>;
  };

  /**
   * `JSON.parse` mit Wächter.
   *
   * Gibt Wert UND Fund zurück, nie nur den Wert: wer den Fund nicht
   * anschaut, soll ihn wenigstens in der Hand halten.
   *
   * @throws wenn der Text kein JSON ist — mit einem Satz, den ein Mensch
   *         lesen kann statt „Unexpected token < in JSON at position 0".
   */
  const lesen = (text: string): { wert: unknown; fund: Fund } => {
    let roh: unknown;
    try {
      roh = JSON.parse(text);
    } catch {
      throw new Error('Die Datei ist keine gültige Sicherung — sie lässt sich ' +
                      'nicht als JSON lesen. Vielleicht ist es eine .redion-Datei? ' +
                      'Die gehört in „Sicherung einspielen" und nicht hierher.');
    }
    const fund = leererFund();
    const wert = entgiften(roh, fund);
    return { wert, fund };
  };

  /**
   * Ein Satz für den Menschen, wenn etwas entfernt wurde — sonst leer.
   *
   * Bewusst kein Abbruch: eine Sicherung mit einem `__proto__` darin ist
   * nicht zwingend ein Angriff. Sie kann aus einem Werkzeug stammen, das
   * Objekte falsch serialisiert. Weggenommen wird es trotzdem, und gesagt
   * wird es auch.
   */
  const satz = (fund: Fund): string => {
    if (!fund.entfernt && !fund.zuTief) return '';
    const teile: string[] = [];
    if (fund.entfernt) {
      teile.push(
        fund.entfernt === 1
          ? 'Ein gefährlicher Schlüssel wurde aus der Sicherung entfernt'
          : fund.entfernt + ' gefährliche Schlüssel wurden aus der Sicherung entfernt');
      if (fund.wege.length) {
        teile.push('(' + fund.wege.slice(0, 5).join(', ') +
                   (fund.entfernt > 5 ? ' …' : '') + ')');
      }
    }
    if (fund.zuTief) {
      teile.push('Ein Teil der Datei war tiefer verschachtelt als ' + MAX_TIEFE +
                 ' Ebenen und wurde ausgelassen.');
    }
    return teile.join(' ') + '.';
  };

  return {
    lesen, entgiften, verzeichnis, leererFund, satz,
    istGefaehrlich, GEFAEHRLICH, MAX_TIEFE
  };
})();

(window as any).ImportSicherheit = ImportSicherheit;
