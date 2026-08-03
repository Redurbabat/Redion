/* ============================================================================
 * kern/zugang/rollen.js — wer was darf
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

  /* Die Rangfolge zählt: wer mehr darf, darf auch alles Kleinere. */
  const ROLLEN = {
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

  const REIHE = ['voll', 'edit', 'komm', 'lesen', 'kein'];

  /* Was man tun kann, und was es im Klartext heisst. */
  const TATEN = {
    lesen:        'ansehen',
    kommentieren: 'kommentieren',
    bearbeiten:   'ändern',
    teilen:       'weitergeben',
    loeschen:     'löschen',
    rechte:       'Rechte vergeben'
  };

  /** Darf diese Rolle das? Unbekannte Rolle heisst nein. */
  const darf = (rolle, was) => (ROLLEN[rolle] || ROLLEN.kein).darf.includes(was);

  /** Die schwächere von zweien — für geerbte Rechte. */
  const schwaechere = (a, b) => (ROLLEN[a] || ROLLEN.kein).rang <= (ROLLEN[b] || ROLLEN.kein).rang ? a : b;

  /** Die stärkere von zweien. */
  const staerkere = (a, b) => (ROLLEN[a] || ROLLEN.kein).rang >= (ROLLEN[b] || ROLLEN.kein).rang ? a : b;

  const name = (rolle) => (ROLLEN[rolle] || ROLLEN.kein).name;
  const satz = (rolle) => (ROLLEN[rolle] || ROLLEN.kein).satz;

  /**
   * Warum darf jemand etwas nicht? Ein Satz, den man anzeigen kann.
   * „Keine Berechtigung" ist keine Erklärung, sondern eine Sackgasse.
   */
  const warumNicht = (rolle, was) => {
    if (darf(rolle, was)) return '';
    const noetig = REIHE.slice().reverse().find(r => darf(r, was));
    return 'Dafür braucht es mindestens „' + name(noetig) + '". Du hast „' +
           name(rolle) + '".';
  };

  /**
   * Für die Oberfläche: soll dieser Knopf überhaupt da sein?
   * Ohne Konto gilt volle Freiheit — dann gehört der Bestand dem Gerät,
   * und es gibt niemanden, gegen den zu prüfen wäre.
   */
  const zeigen = (was, rolle) => {
    if (rolle === undefined || rolle === null || rolle === '') return true;
    return darf(rolle, was);
  };

  return { ROLLEN, REIHE, TATEN, darf, schwaechere, staerkere,
           name, satz, warumNicht, zeigen };
})();

window.Rollen = Rollen;
