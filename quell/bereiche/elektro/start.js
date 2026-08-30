"use strict";
/* ==========================================================================
 * start.ts — Elektro als ORT, nicht als Fenster (L65)
 *
 * „Elektro" steht seit E218 als fünfter Weg in der obersten Gruppe der
 * Seitenleiste, neben Heute, Lernzentrum, Bibliothek und Aufgaben. Vier
 * davon führen an einen Ort: die Krume ändert sich, man ist woanders, der
 * Zurück-Pfeil bringt einen zurück.
 *
 * „Elektro" nicht. Es rief `Electrical.open()` — eine Überlagerung mit dem
 * Rechner. Der Rechner funktioniert; die Lücke war, dass ein Eintrag
 * zwischen vier Zielen steht und als einziger keines ist.
 *
 * DIESE SEITE IST KEIN NEUER KATALOG (§8). Was sie zeigt, steht schon im
 * Menüband-Register unter `reiter: 'elektro'` — acht Wege in drei Gruppen,
 * jeder mit Namen, Zeichen, Hinweis und der Funktion, die ihn ausführt.
 * Hier wird das gelesen und als Kacheln gezeichnet, mehr nicht. Wer einen
 * neunten Weg hinzufügt, trägt ihn ins Register ein und er steht hier.
 *
 * UND SIE ERFINDET NICHTS (§47). Jeder Abschnitt fällt WEG, wenn es nichts
 * zu zeigen gibt: keine Schaltpläne — kein „Weiter wo du warst"; keine
 * fälligen Karten — keine Zeile darüber. Ein leerer Kasten mit einer
 * Überschrift ist schlimmer als kein Kasten, weil er behauptet, hier
 * gehöre etwas hin, das fehlt.
 * ========================================================================*/
const Elektrostart = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    /* WORAN REDION EINE ELEKTRO-SEITE ERKENNT: an dem, was darin liegt — und
       nicht an einem Feld am Block. Ein Feld `bereich: 'elektro'` wäre eine
       Datenwanderung für eine ANSICHT, und das ist der teuerste Weg, den es
       gibt (§9). Dieselbe Entscheidung wie bei den Deckeln im Regal (E236). */
    const ELEKTROARTEN = new Set(['schaltplan']);
    /** Die zuletzt geöffneten Seiten, in denen ein Schaltplan liegt. */
    const zuletzt = () => {
        if (typeof App === 'undefined' || typeof Store === 'undefined')
            return [];
        let liste = [];
        try {
            liste = App.kuerzlich() || [];
        }
        catch {
            return [];
        }
        return liste.filter((p) => {
            try {
                return Store.childrenOf(p.id)
                    .some((k) => ELEKTROARTEN.has(String(k.type)));
            }
            catch {
                return false;
            }
        }).slice(0, 4);
    };
    /** Wie viele Karteikarten heute fällig sind — 0, wenn es keine gibt. */
    const faellig = () => {
        try {
            return (Werkzeuge.faellig() || []).length;
        }
        catch {
            return 0;
        }
    };
    const wege = () => {
        try {
            const roh = Register.menueband.inReiter('elektro');
            return roh
                .map((g) => ({
                gruppe: g.gruppe,
                /* `zeigen()` ist die Frage „gibt es das Modul überhaupt?". Ein
                   Weg, dessen Modul fehlt, wäre eine Kachel ins Leere (§47). */
                eintraege: g.eintraege.filter((e) => {
                    try {
                        return typeof e.zeigen !== 'function' || e.zeigen();
                    }
                    catch {
                        return false;
                    }
                })
            }))
                .filter((g) => g.eintraege.length > 0);
        }
        catch {
            return [];
        }
    };
    /* EIN `data-sym` IST NOCH KEIN ZEICHEN. Es ist eine Bestellung; gezeichnet
       wird sie von `Register.symbole.fuelle()`, und zwar erst, wenn das
       Element im Dokument steht. Ohne den Aufruf am Ende von `zeichnen()`
       standen im ersten Bild acht leere graue Quadrate.
  
       UND NICHT JEDES ZEICHEN IST EIN SYMBOLNAME. Im Menüband-Register steht
       mal „bolt" (ein Name aus `register/symbole.ts`), mal ein Textzeichen
       wie „H₁". Gefragt wird deshalb, statt geraten — dieselbe Stelle, an der
       das Menüband es auch fragt. */
    const zeichenHtml = (zeichen) => {
        try {
            if (Register?.symbole?.hat?.(zeichen))
                return '<span class="els-zeichen" data-sym="' + esc(zeichen) + '" aria-hidden="true"></span>';
        }
        catch { /* ohne Symbolregister bleibt der Buchstabe */ }
        return '<span class="els-zeichen els-glyph" aria-hidden="true">' + esc(zeichen) + '</span>';
    };
    const kachel = (e) => '<button type="button" class="els-kachel' + (e.gross ? ' gross' : '') +
        '" data-weg="' + esc(e.id) + '"' +
        (e.hinweis ? ' title="' + esc(e.hinweis) + '"' : '') + '>' +
        zeichenHtml(String(e.zeichen || '')) +
        '<span class="els-text"><b>' + esc(e.name) + '</b>' +
        (e.hinweis ? '<small>' + esc(e.hinweis) + '</small>' : '') +
        '</span></button>';
    const zeichnen = (wrap) => {
        const offen = zuletzt();
        const dran = faellig();
        const gruppen = wege();
        let html = '<div class="els">' +
            '<div class="els-kopf">' +
            '<h1>⚡ Elektro</h1>' +
            '<p>Rechnen, üben und zeichnen — alles an einem Ort.</p>' +
            '</div>';
        /* WAS ANSTEHT — nur wenn wirklich etwas ansteht. */
        if (dran > 0) {
            html += '<button type="button" class="els-dran" data-weg="e-ueben">' +
                '<span class="els-dran-zahl">' + dran + '</span>' +
                '<span class="els-dran-text"><b>' +
                (dran === 1 ? 'Eine Karte ist fällig' : dran + ' Karten sind fällig') +
                '</b><small>Zuerst Fehler, dann Fälliges, dann Neues.</small></span>' +
                '</button>';
        }
        /* WEITER WO DU WARST — nur, wenn es wirklich einen Plan gibt. */
        if (offen.length) {
            html += '<div class="els-abschnitt"><h2>Weiter wo du warst</h2>' +
                '<div class="els-weiter">' +
                offen.map((p) => '<button type="button" class="els-seite" data-seite="' + esc(p.id) + '">' +
                    '<span class="els-seite-zeichen">' + esc(p.icon || '⚡') + '</span>' +
                    '<b>' + esc(p.text || 'Ohne Titel') + '</b>' +
                    '</button>').join('') +
                '</div></div>';
        }
        /* UND DIE WERKZEUGE — aus dem Register, Gruppe für Gruppe. */
        for (const g of gruppen) {
            html += '<div class="els-abschnitt"><h2>' + esc(g.gruppe) + '</h2>' +
                '<div class="els-gitter">' + g.eintraege.map(kachel).join('') + '</div></div>';
        }
        /* Steht gar nichts da, sagt die Seite das — statt leer zu bleiben. */
        if (!gruppen.length) {
            html += '<p class="els-leer">Die Elektro-Werkzeuge sind gerade nicht ' +
                'geladen. Lade die Seite neu, dann stehen sie wieder hier.</p>';
        }
        html += '</div>';
        wrap.innerHTML = html;
        /* Erst jetzt, mit dem fertigen Baum: die Bestellungen einlösen. */
        try {
            Register?.symbole?.fuelle?.(wrap);
        }
        catch { /* ohne Zeichen bleiben die Namen — die stehen ohnehin daneben */ }
        binde(wrap);
    };
    const binde = (wrap) => {
        wrap.querySelectorAll('[data-weg]').forEach(k => {
            k.addEventListener('click', () => {
                const eintrag = Register.menueband.eines(k.dataset['weg'] || '');
                /* KEIN STILLES SCHLUCKEN. Ein Weg, der nichts tut und nichts sagt,
                   ist der Fehler, den E236 an „PDF einlesen" gefunden hat. */
                if (!eintrag || typeof eintrag.tun !== 'function') {
                    try {
                        UI.toast('Dieser Weg ist gerade nicht verfügbar.');
                    }
                    catch { /* still */ }
                    return;
                }
                try {
                    eintrag.tun();
                }
                catch (fehler) {
                    console.error('[Elektro] ' + (k.dataset['weg'] || ''), fehler);
                    try {
                        UI.toast('Das hat nicht geklappt.');
                    }
                    catch { /* still */ }
                }
            });
        });
        wrap.querySelectorAll('[data-seite]').forEach(k => {
            k.addEventListener('click', () => App.oeffne(k.dataset['seite'] || null));
        });
    };
    /**
     * Der Weg hierher — von der Seitenleiste, vom Modulregister und von der
     * Adresszeile (`#elektro`).
     *
     * Den Reiter setzt diese Stelle selbst, wie `Bibliothek.oeffne()` es seit
     * E236 tut: die Seite geht von mehreren Orten auf, und die Markierung muss
     * jedes Mal stimmen.
     */
    const oeffne = () => {
        try {
            Seitenleiste.reiter('elektro');
        }
        catch { /* ohne Leiste kein Reiter */ }
        App.zeigeSonder('Elektro', zeichnen);
    };
    return { oeffne, zeichnen, zuletzt, wege };
})();
window.Elektrostart = Elektrostart;
/* ============================================================================
 * DIE KONTEXTKANTE VON ELEKTRO (E272 Phase F)
 * ----------------------------------------------------------------------------
 * DIESELBE QUELLE WIE DIE STARTSEITE, und das ist der ganze Punkt.
 *
 * Redur hat entschieden, dass „Elektro" kein eigener Reiter im Menüband
 * mehr ist (E272 Phase D). Die acht Einträge behalten trotzdem
 * `reiter: 'elektro'` im Register — die Startseite oben in dieser Datei
 * liest `inReiter('elektro')`, und die Kante liest es hier genauso.
 *
 * Eine zweite Liste hier wäre der Fehler, gegen den der ganze Bogen
 * geschrieben ist: zwei Kataloge für dieselben acht Werkzeuge, und beim
 * neunten pflegt jemand nur einen.
 *
 * `zeigen()` wird MITGENOMMEN und nicht ausgewertet: die Kante fragt es
 * selbst, jedes Mal, wenn sie zeichnet. Ein Modul, das später geladen
 * wird, taucht dann von selbst auf.
 * ==========================================================================*/
if (typeof Register !== 'undefined' && Register.kontext) {
    /* EIN LIEFERANT UND KEINE ACHT ANMELDUNGEN — gemessen, nicht gewählt.
       Der erste Anlauf meldete beim Laden jeden Eintrag einzeln an. In der
       Kante standen dann SECHS statt acht: `Register.menueband.alle()` wendet
       `zeigen()` schon selbst an, und `zeigen()` fragt „ist das Modul da?".
       Beim Laden dieser Datei war `Electrical` noch nicht geladen — „Rechner"
       und „Schaltplan" waren damit für immer weg, und sechs Knöpfe sehen aus
       wie sechs Knöpfe.
  
       Ein Lieferant wird bei JEDEM Zeichnen gefragt. Was später kommt, ist
       dann auch später da. */
    Register.kontext.meldeLieferant('elektro', () => {
        const raus = [];
        try {
            let rang = 10;
            for (const g of (Register.menueband.inReiter('elektro') || [])) {
                for (const e of (g.eintraege || [])) {
                    raus.push({
                        bereich: 'elektro', id: String(e.id), name: String(e.name || e.id),
                        zeichen: String(e.zeichen || 'bolt'), rang: rang,
                        tun: () => { try {
                            e.tun();
                        }
                        catch { /* toter Griff bleibt still */ } }
                    });
                    rang += 10;
                }
            }
        }
        catch { /* ohne Register bleibt die Kante leer, die Seite läuft weiter */ }
        return raus;
    });
}
