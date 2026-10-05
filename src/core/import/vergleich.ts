/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/import/vergleich.ts (npm run bauen:ts). */
/* ============================================================================
 * core/import/vergleich.ts — was sich beim Einspielen WIRKLICH ändert
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/import/vergleich.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/import/vergleich.js`.
 * ----------------------------------------------------------------------------
 * REIN: keine Uhr, keine Ablage, kein DOM. Herein kommen zwei Verzeichnisse,
 * heraus kommt, was der eine mit dem anderen macht.
 *
 * ─── WAS VORHER DASTAND ─────────────────────────────────────────────────────
 *
 *     'Die Datei enthält ' + wieViele + ' Blöcke. ' +
 *     'In diesem Bestand liegen gerade ' + jetzt + ' Blöcke.'
 *                                                    schale.ts:2047
 *
 * „Die Datei enthält 1247 Blöcke, hier liegen 1180." Das sagt, wie GROSS die
 * Sicherung ist, nicht was sie tut. Wer wissen will, ob die eigene Seite von
 * gestern überlebt, erfährt es erst danach — und dann ist sie weg.
 *
 * Es ist die letzte Stelle vor einem Vorgang, der löscht. Genau dort gehört
 * die Frage beantwortet, die ein Mensch wirklich hat.
 *
 * ─── DIE VIER GRUPPEN ───────────────────────────────────────────────────────
 *
 *   neu           steht in der Sicherung und hier nicht.
 *   ersetzt       steht in beiden, aber ANDERS.
 *   gleich        steht in beiden und ist dasselbe.
 *   verschwindet  steht hier und nicht in der Sicherung.
 *
 * Nur die vierte ist gefährlich, und nur beim ERSETZEN gibt es sie: beim
 * Dazulegen wird nichts gelöscht, dort ist sie immer leer. Genau deshalb ist
 * sie eine Nachricht, wenn sie NICHT leer ist — und sonst keine.
 *
 * ─── WARUM NAMEN UND NICHT NUR ZAHLEN ───────────────────────────────────────
 *
 * „7 Seiten verschwinden" beantwortet nicht die Frage, die man hat. Die
 * Frage ist „MEINE?". Deshalb kommen ein paar Titel mit — die zuletzt
 * geänderten zuerst, denn an die erinnert man sich.
 * ==========================================================================*/

const ImportVergleich = (() => {

  type Satz = Record<string, any>;
  type Fach = Record<string, Satz>;

  type Gruppe = {
    anzahl: number;
    /** Ein paar Titel zum Wiedererkennen, die zuletzt geänderten zuerst. */
    titel: string[];
  };

  type Ergebnis = {
    art: 'ersetzen' | 'zusammenfuehren';
    neu: Gruppe;
    ersetzt: Gruppe;
    gleich: Gruppe;
    verschwindet: Gruppe;
    /** Wieviele Sätze der Bestand danach hat. */
    danach: number;
  };

  /** So viele Titel je Gruppe — mehr liest in einem Dialog niemand. */
  const TITEL = 5;

  /**
   * Zwei Sätze sind gleich, wenn ihr Inhalt gleich ist.
   *
   * `wolkeVersion` und `folge` sind Buchhaltung des Geräts, kein Inhalt:
   * stünden sie mit im Vergleich, wäre nach einem Abgleich JEDER Satz
   * „geändert", und die Anzeige sagte wieder nichts. Dieselbe Überlegung wie
   * bei den Sync-Marken.
   */
  const OHNE = ['wolkeVersion', 'folge', 'basis'];

  const kern = (s: Satz): string => {
    if (!s || typeof s !== 'object') return String(s);
    const schluessel = Object.keys(s).filter(k => !OHNE.includes(k)).sort();
    return JSON.stringify(schluessel.map(k => [k, (s as any)[k]]));
  };

  const titelVon = (s: Satz): string => {
    const t = String(s?.text ?? s?.name ?? '').trim();
    if (t) return t.length > 40 ? t.slice(0, 39) + '…' : t;
    return String(s?.type || s?.id || 'Ohne Titel');
  };

  /** Die zuletzt geänderten zuerst — an die erinnert man sich. */
  const gruppe = (saetze: Satz[]): Gruppe => ({
    anzahl: saetze.length,
    titel: saetze
      .slice()
      .sort((a, b) => String(b?.edited || b?.created || '')
        .localeCompare(String(a?.edited || a?.created || '')))
      .slice(0, TITEL)
      .map(titelVon)
  });

  /**
   * Was macht die Sicherung mit dem Bestand?
   *
   * @param hier      Was jetzt da ist, je Fach.
   * @param sicherung Was in der Datei steht, je Fach.
   * @param art       'ersetzen' löscht, was fehlt; 'zusammenfuehren' nicht.
   */
  const rechnen = (hier: Record<string, Fach>, sicherung: Record<string, Fach>,
                   art: string): Ergebnis => {
    const ersetzen = art === 'ersetzen';
    const neu: Satz[] = [], ersetzt: Satz[] = [], gleich: Satz[] = [],
          verschwindet: Satz[] = [];

    const faecher = [...new Set([...Object.keys(hier || {}),
                                 ...Object.keys(sicherung || {})])];
    for (const fach of faecher) {
      const a = (hier || {})[fach] || {};
      const b = (sicherung || {})[fach] || {};
      for (const id of Object.keys(b)) {
        if (!Object.prototype.hasOwnProperty.call(a, id)) { neu.push(b[id] as Satz); continue; }
        if (kern(a[id] as Satz) === kern(b[id] as Satz)) gleich.push(b[id] as Satz);
        else ersetzt.push(b[id] as Satz);
      }
      if (ersetzen) {
        for (const id of Object.keys(a))
          if (!Object.prototype.hasOwnProperty.call(b, id)) verschwindet.push(a[id] as Satz);
      }
    }

    const daHier = faecher.reduce((s, f) => s + Object.keys((hier || {})[f] || {}).length, 0);
    return {
      art: ersetzen ? 'ersetzen' : 'zusammenfuehren',
      neu: gruppe(neu), ersetzt: gruppe(ersetzt),
      gleich: gruppe(gleich), verschwindet: gruppe(verschwindet),
      danach: ersetzen ? neu.length + ersetzt.length + gleich.length
                       : daHier + neu.length
    };
  };

  const zaehlwort = (n: number, eins: string, viele: string): string =>
    n + ' ' + (n === 1 ? eins : viele);

  /**
   * Der Satz für den Dialog.
   *
   * Was NICHT geschieht, steht nicht da. „0 verschwinden" ist keine
   * Beruhigung, sondern eine Zeile, über die man hinwegliest — und beim
   * nächsten Mal auch über die, in der eine 7 steht.
   */
  const satz = (e: Ergebnis): string => {
    if (!e) return '';
    const teile: string[] = [];
    if (e.neu.anzahl) teile.push(zaehlwort(e.neu.anzahl, 'Satz kommt dazu',
                                           'Sätze kommen dazu'));
    if (e.ersetzt.anzahl) teile.push(zaehlwort(e.ersetzt.anzahl,
      'Satz wird überschrieben', 'Sätze werden überschrieben'));
    if (!teile.length && !e.verschwindet.anzahl)
      return 'Diese Sicherung ändert nichts — sie ist derselbe Stand.';
    let t = teile.join(', ') + '.';
    if (e.verschwindet.anzahl) {
      t += ' ' + zaehlwort(e.verschwindet.anzahl, 'Satz verschwindet',
                           'Sätze verschwinden') + ':';
      t += ' ' + e.verschwindet.titel.join(', ') +
           (e.verschwindet.anzahl > e.verschwindet.titel.length ? ' …' : '') + '.';
    }
    return t;
  };

  /** Ist etwas dabei, das ein Mensch gesehen haben MUSS? */
  const warnt = (e: Ergebnis): boolean => !!e && e.verschwindet.anzahl > 0;

  return { rechnen, satz, warnt, kern, titelVon, TITEL };
})();

(window as any).ImportVergleich = ImportVergleich;
