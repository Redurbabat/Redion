"use strict";
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
 * WAS HIER STEHT, UND WAS NICHT. Hier stand bis zum 25. August der Satz
 * „Hier steht die Ordnung. Die Seitenleiste liest sie und zeichnet, was sie
 * findet — mehr nicht." Er war falsch. Nachgezählt: die Seitenleiste
 * zeichnet 45 Zeilen, dieses Register kannte 12, und gelesen wurde davon
 * genau ein Teil — `anPlatz('unten')`, gefiltert auf `vonAussen`.
 *
 * Ein Katalog, den niemand liest, wird still falsch. Der Eintrag `suche`
 * rief `Werkzeuge.palette()` auf, also das, was „Befehle" tut; `ki` stand
 * drin, obwohl die Seitenleiste ihn nirgends zeigt. Beides fiel niemandem
 * auf, weil beides nie ausgeführt wurde (E160).
 *
 * Heute gilt:
 *
 *     platz 'oben'    die neun Zeilen der obersten Gruppe. Das Aussehen
 *                     steht in index.html, die HANDLUNG hier — `schale.ts`
 *                     hängt sie über `knopfId` an. test222 §5 vergleicht
 *                     beide Listen Zeile für Zeile.
 *     platz 'baum'    die Überschriften des Baums.
 *     platz 'unten'   der Anhängepunkt für fremde Bereiche (`vonAussen`).
 *                     Die eingebauten unteren Zeilen zeichnet die
 *                     Seitenleiste weiter selbst; das steht in L51.
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
window.Register = window.Register || {};
Register.navigation = (() => {
    /* Gibt es dieses Modul? Zwei Wege, und der zweite ist der unschöne.
       Die neueren Module hängen sich an `window`; die älteren sind
       `const X = (() => …)()` auf oberster Ebene und stehen dort nicht. Für
       die bleibt nur `typeof` mit einem Namen, der erst zur Laufzeit
       feststeht. Verschwindet, sobald der letzte alte Bestand umgezogen ist. */
    const da = (name) => typeof window[name] !== 'undefined' ||
        (() => {
            try {
                return eval('typeof ' + name) !== 'undefined';
            }
            catch {
                return false;
            }
        })();
    const EINGEBAUT = [
        /* Die oberste Gruppe, in der Folge, in der sie in index.html steht.
           `knopfId` ist der Knopf im Markup — `schale.ts` hängt `tun` daran.
           Wer hier eine Zeile ändert, ändert damit wirklich die Seitenleiste;
           wer sie in index.html ändert, ohne hier nachzuziehen, macht test222
           §5 rot. Das ist der ganze Zweck der Übung. */
        { id: 'suche', name: 'Suchen', icon: '🔍', platz: 'oben', rang: 10,
            knopfId: 'btn-search', kuerzel: 'Strg P',
            /* Hier stand `Werkzeuge.palette()` — das ist „Befehle", eine Zeile
               tiefer. Die Suche hat ihr eigenes Fenster (E160). */
            tun: () => App.suche() },
        { id: 'befehle', name: 'Befehle', icon: '⌘', platz: 'oben', rang: 20,
            knopfId: 'btn-cmd', kuerzel: 'Strg ⇧ P',
            tun: () => Werkzeuge.palette() },
        { id: 'heute', name: 'Heute', icon: '☀️', platz: 'oben', rang: 30,
            knopfId: 'btn-home', tun: () => Produktwelten.lernen('heute') },
        { id: 'lernzentrum', name: 'Lernzentrum', icon: '🎓', platz: 'oben', rang: 40,
            knopfId: 'btn-learning', tun: () => Produktwelten.lernen('lernen') },
        { id: 'workspace', name: 'Workspace', icon: '🧱', platz: 'oben', rang: 50,
            knopfId: 'btn-workspace', tun: () => Produktwelten.workspace('start') },
        { id: 'bibliothekOben', name: 'Bibliothek', icon: '📚', platz: 'oben', rang: 60,
            /* Zweimal „Bibliothek": hier die Zeile der obersten Gruppe, weiter
               unten der Anhängepunkt mit demselben Namen. Verschiedene Kennungen,
               weil `melde` über die Kennung dublettenfrei hält. */
            knopfId: 'btn-library', tun: () => Produktwelten.bibliothek() },
        { id: 'aufgaben', name: 'Aufgaben', icon: '☑', platz: 'oben', rang: 70,
            knopfId: 'btn-tasks', tun: () => Produktwelten.aufgaben() },
        { id: 'posteingang', name: 'Posteingang', icon: '📥', platz: 'oben', rang: 80,
            /* Und hier stand `Werkzeuge.meldungen()`. Der Knopf ruft seit jeher
               `Ansichten.posteingang()`; das eine ist die Meldungsliste, das
               andere der Posteingang. Auch das fiel nie auf (E160). */
            knopfId: 'btn-inbox', tun: () => Ansichten.posteingang() },
        { id: 'neu', name: 'Neue Seite', icon: '✚', platz: 'oben', rang: 90,
            knopfId: 'btn-new', kuerzel: 'Strg N',
            tun: () => App.neueSeite() },
        { id: 'favoriten', name: 'Favoriten', icon: '★', platz: 'baum', rang: 10 },
        { id: 'seiten', name: 'Seiten', icon: '📄', platz: 'baum', rang: 20 },
        { id: 'geteilt', name: 'Geteilt', icon: '👥', platz: 'baum', rang: 30,
            zeigen: () => da('Wolke') && Wolke.angemeldet() },
        { id: 'vorlagen', name: 'Vorlagen', icon: '🧩', platz: 'unten', rang: 10,
            tun: () => Galerie.oeffne() },
        { id: 'bibliothek', name: 'Bibliothek', icon: '📚', platz: 'unten', rang: 20,
            tun: () => Bibliothek.oeffne() },
        { id: 'papierkorb', name: 'Papierkorb', icon: '🗑', platz: 'unten', rang: 30,
            tun: () => App.papierkorb() },
        { id: 'einstellungen', name: 'Einstellungen', icon: '⚙', platz: 'unten', rang: 40,
            tun: () => Einstellungen.oeffne() },
        { id: 'hilfe', name: 'Was Redion kann', icon: '?', platz: 'unten', rang: 50,
            tun: () => Rundgang.uebersicht() }
    ];
    const LISTE = EINGEBAUT.slice();
    /**
     * Einen Eintrag anmelden.
     * `vonAussen` merkt sich, dass er nicht eingebaut ist — die Seitenleiste
     * zeichnet ihre eingebauten Abschnitte selbst und hängt nur das an, was
     * von aussen dazukam. Ohne diese Unterscheidung stünde jeder Eintrag
     * zweimal da.
     */
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.id)
            return false;
        if (LISTE.some(x => x.id === e.id))
            return false;
        LISTE.push(Object.assign({ vonAussen: true }, e));
        return true;
    };
    const nimmZurueck = (id) => {
        const i = LISTE.findIndex(x => x.id === id);
        if (i < 0)
            return false;
        LISTE.splice(i, 1);
        return true;
    };
    const alle = () => LISTE;
    /** Was gehört an diesen Platz, in der richtigen Folge? */
    const anPlatz = (platz) => LISTE
        .filter(x => x.platz === platz)
        .filter(x => !x.zeigen || (() => { try {
        return !!x.zeigen();
    }
    catch {
        return false;
    } })())
        .sort((a, b) => (a.rang || 100) - (b.rang || 100));
    const eines = (id) => LISTE.find(x => x.id === id) || null;
    return { alle, anPlatz, eines, melde, nimmZurueck, anzahl: () => LISTE.length };
})();
