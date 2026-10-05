/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/zugang/rollen.ts (npm run bauen:ts). */
/* ============================================================================
 * kern/zugang/rollen.js — wer was darf
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/zugang/rollen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/zugang/rollen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die Rollen standen bisher zweimal da: einmal im Server (`server/kern.js`)
 * und einmal verstreut in der Oberfläche. Zwei Listen, die dasselbe meinen,
 * laufen auseinander — und zwar immer in dieselbe Richtung: die Oberfläche
 * erlaubt etwas, das der Server verweigert, und der Mensch sieht einen Knopf,
 * der nicht funktioniert.
 *
 * Hier steht die Liste für die Oberfläche. Sie ist bewusst **wortgleich** mit
 * der des Servers, und der Prüflauf vergleicht beide.
 *
 * Der wichtige Satz zu dieser Datei: **das hier ist keine Sperre.** Was hier
 * steht, blendet Knöpfe aus und graut Felder ab. Die Sperre sitzt im Server,
 * weil nur er den Datensatz zurückhalten kann. Wer im Browser herumschraubt,
 * kommt an alles heran, was auf dem Gerät liegt — das ist keine Lücke,
 * sondern die Folge davon, dass die Daten dem Gerät gehören.
 * ==========================================================================*/

const Rollen = (() => {

  /* ------------------------------------------------------------------------
   * WAS DER UMZUG HIER GEBRACHT HAT. Vorher waren „Rolle" und „Tat"
   * Zeichenketten — `darf('editt', 'lesen')` war ein gültiger Aufruf, der
   * still `false` ergab, also aussah wie „darf nicht" statt wie „gibt es
   * nicht". Jetzt sind es Aufzählungen, und der Tippfehler steht beim Bauen
   * da, sofern der Aufrufer schon TypeScript ist.
   *
   * Nach aussen nehmen die Funktionen trotzdem `string`: Rollen kommen aus
   * dem Server und aus gespeicherten Daten, also aus Quellen, die alles
   * schicken können. Das Schmale steht innen, das Weite an der Grenze.
   * ----------------------------------------------------------------------*/
  type Tat = 'lesen' | 'kommentieren' | 'bearbeiten' | 'teilen' | 'loeschen' | 'rechte';
  type Kennung = 'voll' | 'edit' | 'komm' | 'lesen' | 'kein';
  type Beschreibung = { rang: number; name: string; darf: Tat[]; satz: string };

  /* Die Rangfolge zählt: wer mehr darf, darf auch alles Kleinere. */
  const ROLLEN: Record<Kennung, Beschreibung> = {
    voll:  { rang: 5, name: 'Vollzugriff',
             darf: ['lesen', 'kommentieren', 'bearbeiten', 'teilen', 'loeschen', 'rechte'],
             satz: 'Darf alles, auch Rechte vergeben und löschen.' },
    edit:  { rang: 4, name: 'Bearbeiten',
             darf: ['lesen', 'kommentieren', 'bearbeiten'],
             satz: 'Darf Inhalte ändern, aber keine Rechte vergeben.' },
    komm:  { rang: 3, name: 'Kommentieren',
             darf: ['lesen', 'kommentieren'],
             satz: 'Darf mitlesen und kommentieren, aber nichts ändern.' },
    lesen: { rang: 2, name: 'Lesen',
             darf: ['lesen'],
             satz: 'Darf nur mitlesen.' },
    kein:  { rang: 1, name: 'Kein Zugriff',
             darf: [],
             satz: 'Sieht diese Seite nicht — auch wenn er den Bereich darüber sieht.' }
  };

  const REIHE: Kennung[] = ['voll', 'edit', 'komm', 'lesen', 'kein'];

  /* Was man tun kann, und was es im Klartext heisst. */
  const TATEN: Record<Tat, string> = {
    lesen:        'ansehen',
    kommentieren: 'kommentieren',
    bearbeiten:   'ändern',
    teilen:       'weitergeben',
    loeschen:     'löschen',
    rechte:       'Rechte vergeben'
  };

  /**
   * Die Beschreibung zu einer Rolle — und `kein`, wenn es sie nicht gibt.
   *
   * Diese eine Zeile stand vorher siebenmal als `ROLLEN[x] || ROLLEN.kein`
   * da. Siebenmal dieselbe Vorsicht ist sechsmal die Gelegenheit, sie zu
   * vergessen.
   */
  const zu = (rolle: unknown): Beschreibung => {
    const b = typeof rolle === 'string' ? ROLLEN[rolle as Kennung] : undefined;
    return b ?? ROLLEN.kein;
  };

  /** Darf diese Rolle das? Unbekannte Rolle heisst nein. */
  const darf = (rolle: unknown, was: unknown): boolean =>
    zu(rolle).darf.some(t => t === was);

  /** Die schwächere von zweien — für geerbte Rechte. */
  const schwaechere = <T,>(a: T, b: T): T => zu(a).rang <= zu(b).rang ? a : b;

  /** Die stärkere von zweien. */
  const staerkere = <T,>(a: T, b: T): T => zu(a).rang >= zu(b).rang ? a : b;

  const name = (rolle: unknown): string => zu(rolle).name;
  const satz = (rolle: unknown): string => zu(rolle).satz;

  /**
   * Warum darf jemand etwas nicht? Ein Satz, den man anzeigen kann.
   * „Keine Berechtigung" ist keine Erklärung, sondern eine Sackgasse.
   *
   * EIN FUND DES UMZUGS. `REIHE…find(…)` kann `undefined` ergeben — nämlich
   * dann, wenn KEINE Rolle diese Tat erlaubt, etwa weil sie falsch
   * geschrieben wurde. `name(undefined)` gab dann „Kein Zugriff", und der
   * Satz lautete: „Dafür braucht es mindestens ‚Kein Zugriff'." Das ist
   * nicht nur unsinnig, es ist irreführend — es klingt, als läge es an der
   * Rolle. Jetzt sagt der Satz, was wirklich los ist.
   */
  const warumNicht = (rolle: unknown, was: unknown): string => {
    if (darf(rolle, was)) return '';
    const noetig = REIHE.slice().reverse().find(r => darf(r, was));
    if (!noetig) return 'Das lässt sich hier gar nicht tun — keine Rolle erlaubt es.';
    return 'Dafür braucht es mindestens „' + name(noetig) + '". Du hast „' +
           name(rolle) + '".';
  };

  /**
   * Für die Oberfläche: soll dieser Knopf überhaupt da sein?
   * Ohne Konto gilt volle Freiheit — dann gehört der Bestand dem Gerät,
   * und es gibt niemanden, gegen den zu prüfen wäre.
   */
  const zeigen = (was: unknown, rolle: unknown): boolean => {
    if (rolle === undefined || rolle === null || rolle === '') return true;
    return darf(rolle, was);
  };

  return { ROLLEN, REIHE, TATEN, darf, schwaechere, staerkere,
           name, satz, warumNicht, zeigen };
})();

(window as any).Rollen = Rollen;
