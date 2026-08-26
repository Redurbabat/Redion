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
 *     platz 'fuss'    die festen Zeilen ganz unten. Wie 'oben': Markup in
 *                     index.html, Handlung hier, verbunden über `knopfId`.
 *     platz 'apps'    „Meine Apps". Die Seitenleiste zeichnet sie von hier;
 *                     der Eintrag trägt Zeichen, Namen, Hinweistext und
 *                     Handlung. test222 §6 vergleicht Liste und Bildschirm.
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
        /* MEINE APPS — die zwanzig aus der Seitenleiste (E166).
           Sie standen als Datentabelle in `seitenleiste.ts`, direkt neben einer
           Kette aus zwanzig `if (a === '…')`. Zwei Listen für dieselben zwanzig
           Dinge, und wer eine Zeile hinzufügte, musste an beide denken — genau
           die Lage, die E160 eine Gruppe weiter oben aufgelöst hat.
    
           `hinweis` ist der Text, der beim Darüberfahren erscheint. Er gehört
           zum Eintrag und nicht zum Zeichner: wer die App beschreibt, beschreibt
           sie hier. */
        /* DER RANG LÄUFT DURCH, ER FÄNGT NICHT JE GRUPPE NEU AN (E206).
           Der erste Entwurf gab jeder Gruppe 10, 20, 30 … — und `anPlatz('apps')`
           sortiert nach `rang`, ohne die Gruppe zu kennen. Heraus kam eine Liste,
           in der erst alle Ersten jeder Gruppe standen, dann alle Zweiten: eine
           Reihenfolge, die auf dem Bildschirm nirgends vorkommt. test222 §6
           vergleicht Register und Bild und ging deshalb rot — zu Recht.
    
           Durchlaufend heisst: Registerreihenfolge IST Bildschirmreihenfolge,
           und die Gruppen sind nur die Schnitte darin. */
        { id: 'app-kalender', marke: 'kalender', name: 'Kalender', icon: '📅', platz: 'apps', gruppe: 'planen', rang: 10,
            hinweis: 'Termine aus allen Quellen', tun: () => Kalender.dialog() },
        { id: 'app-tagesplan', marke: 'tagesplan', name: 'Tagesplan', icon: '☀', platz: 'apps', gruppe: 'planen', rang: 20,
            hinweis: 'Was heute ansteht', tun: () => Plan.tagesplan() },
        { id: 'app-woche', marke: 'woche', name: 'Wochenrückblick', icon: '📅', platz: 'apps', gruppe: 'planen', rang: 30,
            hinweis: 'Was lief, was blieb liegen', tun: () => Plan.wochenrueckblick() },
        { id: 'app-spaeter', marke: 'spaeter', name: 'Zurückgestellt', icon: '⏰', platz: 'apps', gruppe: 'planen', rang: 40,
            hinweis: 'Was später wieder hochkommt', tun: () => Plan.uebersicht() },
        /* NICHT dasselbe wie die Zeile „Aufgaben" in der obersten Gruppe.
           Die ruft `Produktwelten.aufgaben()`, also `workspace('aufgaben')`;
           diese hier ruft `Bibliothek.aufgaben()`. Zwei Ansichten auf zwei
           verschiedene Fragen — beim Aufräumen (E206) sah es nach einer
           Doppelung aus und war keine. */
        { id: 'app-aufgaben', marke: 'aufgaben', name: 'Meine Aufgaben', icon: '☑', platz: 'apps', gruppe: 'planen', rang: 50,
            hinweis: 'Was dir zugewiesen ist', tun: () => Bibliothek.aufgaben() },
        { id: 'app-modell', marke: 'modell', name: 'Datenmodell', icon: '🗺', platz: 'apps', gruppe: 'daten', rang: 60,
            hinweis: 'Alle Datenbanken und ihre Verknüpfungen', tun: () => Schema.ansicht() },
        { id: 'app-kennzahl', marke: 'kennzahl', name: 'Kennzahlen', icon: '📊', platz: 'apps', gruppe: 'daten', rang: 70,
            hinweis: 'Zahlen aus mehreren Datenbanken', tun: () => Schema.tafel() },
        { id: 'app-eingang', marke: 'eingang', name: 'Was hereinkommt', icon: '📨', platz: 'apps', gruppe: 'daten', rang: 80,
            hinweis: 'Daten von aussen abholen und einwerfen', tun: () => Eingang.dialog() },
        { id: 'app-markt', marke: 'markt', name: 'Marktplatz', icon: '🛍', platz: 'apps', gruppe: 'daten', rang: 90,
            hinweis: 'Fertige Vorlagen', tun: () => Werkzeuge.vorlagen() },
        { id: 'app-aussehen', marke: 'aussehen', name: 'Aussehen', icon: '🎨', platz: 'apps', gruppe: 'einrichten', rang: 100,
            hinweis: 'Farben, Schrift und Tastenkürzel', tun: () => Aussehen.dialog() },
        { id: 'app-tempo', marke: 'tempo', name: 'Tempo', icon: '⏱', platz: 'apps', gruppe: 'einrichten', rang: 110,
            hinweis: 'Wie schnell gezeichnet und gerechnet wird', tun: () => Tempo.dialog() },
        { id: 'app-krypto', marke: 'krypto', name: 'Passwort', icon: '🔐', platz: 'apps', gruppe: 'einrichten', rang: 120,
            hinweis: 'Verschlüsselte Sicherung und Sperre', tun: () => Krypto.dialog() },
        { id: 'app-erweitern', marke: 'erweitern', name: 'Erweiterungen', icon: '🧩', platz: 'apps', gruppe: 'einrichten', rang: 130,
            hinweis: 'Eigene Befehle, Knöpfe und Formeln', tun: () => Erweiterung.dialog() },
        { id: 'app-pwa', marke: 'pwa', name: 'App installieren', icon: '📱', platz: 'apps', gruppe: 'einrichten', rang: 140,
            hinweis: 'Auf dem Telefon oder Rechner ablegen', tun: () => PWA.installieren() },
        /* NICHT die Seite „Notion-Wissen" im Baum. Das hier ist das Modul mit
           den acht Teilen; die Seite ist eine Seite. Auch das sah beim
           Aufräumen nach einer Doppelung aus (E206). */
        { id: 'app-wissen', marke: 'wissen', name: 'Notion-Wissen', icon: '📖', platz: 'apps', gruppe: 'hilfe', rang: 150,
            hinweis: 'Alles über Notion und Redion, in acht Teilen', tun: () => Wissen.oeffnen() },
        { id: 'app-kann', marke: 'kann', name: 'Was Redion kann', icon: '⭐', platz: 'apps', gruppe: 'hilfe', rang: 160,
            hinweis: 'Alles auf einen Blick, mit Führung', tun: () => Rundgang.uebersicht() },
        { id: 'app-pflege', marke: 'pflege', name: 'Erste Hilfe', icon: '🧰', platz: 'apps', gruppe: 'hilfe', rang: 170,
            hinweis: 'Prüfen, reparieren, sichern', tun: () => Pflege.ersteHilfe() },
        /* DREI EINTRÄGE STANDEN HIER UND STEHEN WOANDERS SCHON (E206).
           Redur: „Links habe ich so viel Bereiche, reduziere es — aber wichtig
           nichts löschen." Gelöscht ist auch nichts: alle drei Ziele bleiben,
           nur eben je einmal statt zweimal.
    
               app-bib     „Bibliothek"    →  `Bibliothek.oeffne()`
                                              = btn-library, oberste Gruppe
               app-papier  „Papierkorb"    →  `App.papierkorb()`
                                              = btn-trash, im Fuss
               app-hilfe   „Hilfe"         →  `Werkzeuge.tastenkuerzel()`
                                              = btn-hilfe, im Fuss
    
           Wer eine davon über `Register.navigation.eines('app-bib')` gesucht
           hat, findet sie nicht mehr — das ist der einzige Bruch, und er trifft
           nur Code, den es hier nicht gibt. */
        { id: 'favoriten', name: 'Favoriten', icon: '★', platz: 'baum', rang: 10 },
        { id: 'seiten', name: 'Seiten', icon: '📄', platz: 'baum', rang: 20 },
        { id: 'geteilt', name: 'Geteilt', icon: '👥', platz: 'baum', rang: 30,
            zeigen: () => da('Wolke') && Wolke.angemeldet() },
        /* DER FUSS DER SEITENLEISTE (E167). Drei Zeilen stehen dort fest in
           index.html; zwei davon passen ohne Umstände hierher — Aussehen im
           Markup, Handlung im Register, verbunden über `knopfId`, genau wie
           oben.
    
           `btn-import` fehlt bewusst und nicht aus Vergesslichkeit: sein Menü
           braucht das Klickereignis, um sich an der richtigen Stelle zu öffnen,
           und die fünfundzwanzig Zeilen Menüaufbau gehören in die Schale, nicht
           in einen Katalog der Seitenleiste.
    
           Eigener Platz, nicht `oben`: die drei stehen im Fuss und nicht in
           `.side-nav`. Ein gemeinsamer Platz für beides machte den Vergleich in
           test222 §5 falsch, ohne dass sich am Bildschirm etwas ändert — und
           eine Prüfung, die aus dem falschen Grund rot wird, ist so wenig wert
           wie eine, die aus dem falschen Grund grün ist. */
        { id: 'papierkorbFuss', name: 'Papierkorb', icon: '🗑', platz: 'fuss', rang: 20,
            knopfId: 'btn-trash', tun: () => App.papierkorb() },
        { id: 'tastenkuerzel', name: 'Tastenkürzel', icon: '?', platz: 'fuss', rang: 30,
            knopfId: 'btn-hilfe', kuerzel: 'Strg /',
            tun: () => Werkzeuge.tastenkuerzel() },
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
