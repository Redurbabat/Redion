/* ============================================================================
 * register/navigation.js — was in der Seitenleiste steht, und in welcher Folge
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/navigation.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/navigation.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die Seitenleiste ist die einzige Stelle, die jeder Bereich anfassen will.
 * Genau deshalb darf sie keiner anfassen: sonst hängt ihre Reihenfolge davon
 * ab, welche Datei zuletzt geladen wurde.
 *
 * Hier steht die Ordnung. Die Seitenleiste liest sie und zeichnet, was sie
 * findet — mehr nicht.
 *
 *     id        eindeutig
 *     name      was dasteht
 *     icon      ein Zeichen
 *     platz     'oben' | 'baum' | 'unten'
 *     rang      kleinere Zahl steht weiter oben
 *     zeigen()  false = Eintrag bleibt weg (z. B. ohne Konto)
 *     tun()     was beim Klick geschieht
 *
 * `zeigen` ist wichtiger, als es aussieht: ein Eintrag, der etwas verspricht,
 * das ohne Konto nicht geht, ist schlimmer als kein Eintrag.
 * ==========================================================================*/

(window as any).Register = (window as any).Register || {};

Register.navigation = (() => {

  /* Gibt es dieses Modul? Zwei Wege, und der zweite ist der unschöne.
     Die neueren Module hängen sich an `window`; die älteren sind
     `const X = (() => …)()` auf oberster Ebene und stehen dort nicht. Für
     die bleibt nur `typeof` mit einem Namen, der erst zur Laufzeit
     feststeht. Verschwindet, sobald der letzte alte Bestand umgezogen ist. */
  const da = (name: string): boolean =>
    typeof (window as any)[name] !== 'undefined' ||
    (() => { try { return eval('typeof ' + name) !== 'undefined'; }
             catch { return false; } })();

  const EINGEBAUT = [
    { id: 'suche',      name: 'Suchen',            icon: '🔍', platz: 'oben',  rang: 10,
      tun: () => Werkzeuge.palette() },
    { id: 'ki',         name: 'Redion-KI',         icon: '✨', platz: 'oben',  rang: 20,
      /* Hier stand `KI.panel()` — die Funktion gibt es nicht. Anders als in
         der Modulübersicht war der Aufruf ungeschützt: ein Klick auf
         „Redion-KI" in der Seitenleiste warf. */
      tun: () => App.kiPanel() },
    { id: 'posteingang',name: 'Posteingang',       icon: '📥', platz: 'oben',  rang: 30,
      tun: () => Werkzeuge.meldungen() },
    { id: 'neu',        name: 'Neue Seite',        icon: '＋', platz: 'oben',  rang: 40,
      tun: () => App.neueSeite() },

    { id: 'favoriten',  name: 'Favoriten',         icon: '★',  platz: 'baum',  rang: 10 },
    { id: 'seiten',     name: 'Seiten',            icon: '📄', platz: 'baum',  rang: 20 },
    { id: 'geteilt',    name: 'Geteilt',           icon: '👥', platz: 'baum',  rang: 30,
      zeigen: () => da('Wolke') && Wolke.angemeldet() },

    { id: 'vorlagen',   name: 'Vorlagen',          icon: '🧩', platz: 'unten', rang: 10,
      tun: () => Galerie.oeffne() },
    { id: 'bibliothek', name: 'Bibliothek',        icon: '📚', platz: 'unten', rang: 20,
      tun: () => Bibliothek.oeffne() },
    { id: 'papierkorb', name: 'Papierkorb',        icon: '🗑', platz: 'unten', rang: 30,
      tun: () => App.papierkorb() },
    { id: 'einstellungen', name: 'Einstellungen',  icon: '⚙',  platz: 'unten', rang: 40,
      tun: () => Einstellungen.oeffne() },
    { id: 'hilfe',      name: 'Was Redion kann',   icon: '?',  platz: 'unten', rang: 50,
      tun: () => Rundgang.uebersicht() }
  ];

  /**
   * Ein Eintrag der Seitenleiste.
   *
   * `tun` fehlt bei den Abschnitten (`favoriten`, `seiten`, `geteilt`) —
   * die sind Überschriften und nicht Knöpfe. Genau deshalb steht das
   * Fragezeichen da und nicht bei den anderen Feldern.
   */
  type Eintrag = {
    id: string; name: string; icon: string;
    platz: string; rang: number;
    tun?: () => void;
    zeigen?: () => boolean;
    vonAussen?: boolean;
  };

  const LISTE: Eintrag[] = EINGEBAUT.slice();

  /**
   * Einen Eintrag anmelden.
   * `vonAussen` merkt sich, dass er nicht eingebaut ist — die Seitenleiste
   * zeichnet ihre eingebauten Abschnitte selbst und hängt nur das an, was
   * von aussen dazukam. Ohne diese Unterscheidung stünde jeder Eintrag
   * zweimal da.
   */
  const melde = (eintrag: unknown): boolean => {
    const e = eintrag as Eintrag | null;
    if (!e || !e.id) return false;
    if (LISTE.some(x => x.id === e.id)) return false;
    LISTE.push(Object.assign({ vonAussen: true }, e));
    return true;
  };

  const nimmZurueck = (id: unknown): boolean => {
    const i = LISTE.findIndex(x => x.id === id);
    if (i < 0) return false;
    LISTE.splice(i, 1);
    return true;
  };

  const alle = (): Eintrag[] => LISTE;

  /** Was gehört an diesen Platz, in der richtigen Folge? */
  const anPlatz = (platz: string): Eintrag[] => LISTE
    .filter(x => x.platz === platz)
    .filter(x => !x.zeigen || (() => { try { return !!x.zeigen!(); } catch { return false; } })())
    .sort((a, b) => (a.rang || 100) - (b.rang || 100));

  const eines = (id: unknown): Eintrag | null => LISTE.find(x => x.id === id) || null;

  return { alle, anPlatz, eines, melde, nimmZurueck, anzahl: () => LISTE.length };
})();
