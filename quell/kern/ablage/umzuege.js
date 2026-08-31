"use strict";
/* ============================================================================
 * kern/ablage/umzuege.js — wie die Ablage über die Zeit gewachsen ist
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/ablage/umzuege.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/ablage/umzuege.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * IndexedDB kennt eine Fassungsnummer. Steigt sie, läuft `onupgradeneeded`,
 * und dort werden neue Fächer angelegt. Das steht in `indexdb.js` und muss
 * dort stehen — der Browser ruft es genau einmal, mitten im Öffnen.
 *
 * Was dort **nicht** hingehört, ist die Erklärung: warum es das Fach gibt,
 * was vorher fehlte, und was passiert, wenn jemand mit einer alten Fassung
 * dieselbe Datenbank öffnet. Das steht hier.
 *
 * Und ein zweiter Teil, der ohne diese Datei nirgends stünde: **Umzüge im
 * Inhalt.** Ein neues Fach legt der Browser an. Ein Feld, das früher anders
 * hiess, muss jemand umschreiben — einmal, beim ersten Start nach dem
 * Wechsel, und nie wieder.
 *
 * Die Regel für jeden Inhaltsumzug hier:
 *
 *   · Er läuft **einmal** und merkt sich das.
 *   · Er ist **wiederholbar** — zweimal laufen darf nichts kaputtmachen.
 *   · Er wirft **nichts weg**, sondern ergänzt. Das alte Feld bleibt, bis
 *     zwei Fassungen später niemand mehr davon liest.
 * ==========================================================================*/
const Umzuege = (() => {
    /* ========================================================================
     * 1 · DIE FASSUNGEN DER ABLAGE
     * ======================================================================*/
    const FASSUNGEN = [
        { nr: 1, was: 'Die vier Grundfächer',
            faecher: ['blocks', 'collections', 'views', 'meta'],
            warum: 'Blöcke, Sammlungen, Ansichten, Einstellungen — mehr braucht ' +
                'das Datenmodell nicht. Alles andere ist eine Sicht darauf.' },
        { nr: 2, was: 'Versionsverlauf',
            faecher: ['versions'],
            warum: 'Alte Fassungen einer Seite. Liegen bewusst neben dem Cache: ' +
                'sie werden erst geholt, wenn jemand den Verlauf öffnet — sonst ' +
                'trüge man bei jedem Start den ganzen Verlauf im Arbeitsspeicher.' },
        { nr: 3, was: 'Dateien in Stücken',
            faecher: ['dateien', 'stuecke'],
            warum: 'Eine Data-URL liegt vollständig im Arbeitsspeicher und wird beim ' +
                'Kodieren um ein Drittel grösser. Bei 12 MB war Schluss. Blobs in ' +
                'Stücken zu je 1 MB gehen bis 500 MB.' },
        { nr: 4, was: 'Der letzte gemeinsame Stand',
            faecher: ['basis'],
            warum: 'Ohne ihn kann ein Abgleich nur „meins oder deins" und muss eine ' +
                'Seite wegwerfen. Mit ihm weiss er, wer was geändert hat.' },
        { nr: 5, was: 'Vorberechnete Werte',
            faecher: ['vorrat'],
            warum: 'Formeln und Rollups einmal rechnen und behalten. Ein Beschleuniger, ' +
                'kein Inhalt: wer ihn wegwirft, verliert nichts ausser Zeit.' },
        { nr: 6, was: 'Inkrementeller Suchindex',
            faecher: ['suchindex'],
            warum: 'Vorbereitete Suchwörter je Seite und Datenbankzeile. Auch dieses ' +
                'Fach ist nur ein Cache: Redions Blöcke und Sammlungen bleiben die ' +
                'Wahrheit. Fehlt der Index oder ist er beschädigt, wird er aus ihnen ' +
                'neu aufgebaut.' },
        { nr: 7, was: 'Aufträge für lange Hintergrundarbeit',
            faecher: ['auftraege'],
            warum: 'Ein OCR-Lauf über achtzig Seiten, ein grosser Import, eine ' +
                'Sicherung: Arbeiten, die länger dauern als ein Tab offen bleibt. ' +
                'Der Auftrag wird VOR der Arbeit geschrieben und trägt seinen ' +
                'eigenen Fortschritt — nach einem Neustart weiss die App, was ' +
                'offenstand, und setzt beim letzten fertigen Schritt an. ' +
                'Dieses Fach reist NICHT in der Sicherung mit: ein halb ' +
                'erledigter Auftrag auf einem anderen Gerät hätte seine ' +
                'Eingaben nicht (E286).' }
    ];
    /* Die letzte Fassung — und die Liste ist nie leer, sonst gäbe es keine
       Ablage. `?.nr ?? 0` schreibt genau das hin, statt es anzunehmen. */
    const JETZIGE = FASSUNGEN[FASSUNGEN.length - 1]?.nr ?? 0;
    /** Alle Fächer, die es geben muss. */
    const faecher = () => FASSUNGEN.flatMap(f => f.faecher);
    /** Was kam zwischen zwei Fassungen dazu? */
    const zwischen = (von, nach) => FASSUNGEN.filter(f => f.nr > von && f.nr <= nach);
    /**
     * Der Satz, der im Fehlerfall zählt.
     * Eine ältere Fassung der App kann eine neuere Datenbank **nicht** öffnen —
     * IndexedDB verweigert das, und das ist richtig so. Ohne diesen Hinweis
     * sieht man nur eine App, die nicht startet.
     */
    const hinweisZuAlt = (dbFassung) => 'Diese Ablage wurde von einer neueren Fassung von Redion angelegt ' +
        '(Fassung ' + dbFassung + ', diese App kennt ' + JETZIGE + '). ' +
        'Öffne die neuere Fassung, oder lege über „Sichern" eine Datei an und ' +
        'spiele sie dort wieder ein.';
    /* ========================================================================
     * 2 · UMZÜGE IM INHALT
     * ------------------------------------------------------------------------
     * Jeder Eintrag: eine Kennung, ein Satz, und eine Funktion, die einmal
     * über den Bestand läuft. Sie muss zweimal laufen können, ohne zu schaden.
     * ======================================================================*/
    /* ------------------------------------------------------------------------
     * Spaltenschlüssel ohne Ziffer am Anfang (L36, E172)
     * ------------------------------------------------------------------------
     * Ein Schlüssel ist nur ein Name für eine Spalte. Besteht er aus lauter
     * Ziffern, behandelt JavaScript ihn als Feldindex: `Object.keys` gibt ihn
     * VOR allen anderen zurück, aufsteigend sortiert. Die Spalte steht dann
     * immer ganz links, und keine Bedienung der Welt schiebt sie weg.
     *
     * WO EIN SCHLÜSSEL ÜBERALL STEHT. Das ist die eigentliche Arbeit, und die
     * Liste ist nachgesehen, nicht geraten:
     *
     *   schema[key]           die Spalte selbst
     *   zeile.props[key]      jeder Wert in jeder Zeile
     *   schema[x].relation    die Verknüpfung, auf der ein Rollup sitzt
     *   schema[x].zielKey     die Spalte DRÜBEN, die er einsammelt
     *   ansicht.groupBy       … und zwei Dutzend weitere Felder der Ansicht
     *   ansicht.hidden[]      Listen von Schlüsseln
     *   ansicht.calc{}        Objekte, deren SCHLÜSSEL Spaltenschlüssel sind
     *   automationen          wenn.key, dann-Schritte, Filter und Sortierung
     *
     * WAS NICHT MITGEHT: Formeln. `prop("Name")` spricht die Spalte über ihren
     * ANZEIGENAMEN an (`dienst.ts`, `formelRechnen`) — ein Schlüsselwechsel
     * geht daran vorbei. Nachgesehen, nicht angenommen.
     *
     * UND WARUM NICHT EINFACH ALLES ERSETZEN. Ein Wert, der zufällig „4711"
     * heisst, ist keine Spalte: eine Filterbedingung „Zahl ist gleich 4711",
     * eine Auswahloption mit diesem Namen, eine Zelle mit dieser Zahl. Deshalb
     * werden OBJEKTSCHLÜSSEL überall ersetzt — ein Feldname aus lauter Ziffern
     * kommt im Code nicht vor —, WERTE aber nur an benannten Stellen.
     * ----------------------------------------------------------------------*/
    /** Ein Schlüssel, den `Object.keys` als Feldindex behandelt. */
    const nurZiffern = (k) => /^\d+$/.test(k);
    /** Feldnamen, deren WERT ein Spaltenschlüssel ist. */
    const SCHLUESSELFELDER = new Set([
        'key', 'groupBy', 'zielKey', 'relation', 'setzeKey', 'filterKey',
        'bildKey', 'dateKey', 'datumKey', 'startKey', 'endeKey', 'ortKey',
        'bahnKey', 'abhKey', 'titelKey', 'summeKey',
        'pivotZeile', 'pivotSpalte', 'pivotWert',
        'chartGruppe', 'chartWert', 'chartStufe'
    ]);
    /** Feldnamen, deren Wert eine LISTE von Spaltenschlüsseln ist. */
    const SCHLUESSELLISTEN = new Set([
        'hidden', 'pflicht', 'fixiert', 'zuGruppen', 'bahnenZu', 'spalten'
    ]);
    /**
     * Einen Satz umschreiben. Gibt zurück, ob sich etwas geändert hat.
     *
     * Läuft rekursiv, weil Filter Gruppen enthalten können und Automationen
     * Schritte, die wieder Filter enthalten. Ein flacher Durchgang hätte
     * genau die Stellen ausgelassen, an denen es niemand nachsieht.
     */
    const satzUmschreiben = (wert, alt, neu) => {
        if (!wert || typeof wert !== 'object')
            return false;
        let geaendert = false;
        if (Array.isArray(wert)) {
            for (const teil of wert)
                if (satzUmschreiben(teil, alt, neu))
                    geaendert = true;
            return geaendert;
        }
        for (const feld of Object.keys(wert)) {
            const inhalt = wert[feld];
            if (SCHLUESSELFELDER.has(feld) && inhalt === alt) {
                wert[feld] = neu;
                geaendert = true;
            }
            else if (SCHLUESSELLISTEN.has(feld) && Array.isArray(inhalt)) {
                for (let i = 0; i < inhalt.length; i++)
                    if (inhalt[i] === alt) {
                        inhalt[i] = neu;
                        geaendert = true;
                    }
            }
            else if (satzUmschreiben(inhalt, alt, neu))
                geaendert = true;
        }
        /* Und die Objektschlüssel — `props`, `calc`, `breiten`, `schema`.
           ZUM SCHLUSS und über eine neu gebaute Reihenfolge: `delete` und dann
           `set` würde die Spalte ans Ende hängen, und dann stünde sie nach dem
           Umzug woanders als vorher. Ein Umzug, den man sieht, ist ein Umzug,
           den man für einen Fehler hält. */
        if (Object.prototype.hasOwnProperty.call(wert, alt)) {
            const neuerSatz = {};
            for (const feld of Object.keys(wert))
                neuerSatz[feld === alt ? neu : feld] = wert[feld];
            for (const feld of Object.keys(wert))
                delete wert[feld];
            Object.assign(wert, neuerSatz);
            geaendert = true;
        }
        return geaendert;
    };
    /** Ein freier Schlüssel, der wie der alte aussieht und keiner ist. */
    const freierSchluessel = (schema, alt) => {
        let neu = 's' + alt;
        let n = 2;
        while (Object.prototype.hasOwnProperty.call(schema, neu))
            neu = 's' + alt + '-' + n++;
        return neu;
    };
    const spaltenschluesselHeilen = () => {
        let n = 0;
        const sammlungen = Object.values(Store.cache.collections);
        for (const coll of sammlungen) {
            const betroffen = Object.keys(coll.schema || {}).filter(nurZiffern);
            if (!betroffen.length)
                continue;
            for (const alt of betroffen) {
                const neu = freierSchluessel(coll.schema, alt);
                /* 1 · Die Sammlung selbst — Schema und alles, was drinsteckt
                       (`relation` und `zielKey` an Rollups, die Automationen). */
                if (satzUmschreiben(coll, alt, neu)) {
                    Store.rohSetzen('collections', coll);
                    n++;
                }
                /* 2 · Die Ansichten dieser Sammlung. */
                for (const vid of coll.viewIds || []) {
                    const view = Store.cache.views[vid];
                    if (view && satzUmschreiben(view, alt, neu)) {
                        Store.rohSetzen('views', view);
                        n++;
                    }
                }
                /* 3 · Die Zeilen. `rowsOf` gibt nur die lebenden zurück — der
                       Papierkorb muss aber mit, sonst kommt eine zurückgeholte Zeile
                       mit dem alten Schlüssel wieder. */
                for (const block of Object.values(Store.cache.blocks)) {
                    if (block && block.parentTable === 'collection' && block.parentId === coll.id
                        && satzUmschreiben(block, alt, neu)) {
                        Store.rohSetzen('blocks', block);
                        n++;
                    }
                }
                /* 4 · Und die FREMDEN Sammlungen: ein Rollup drüben sammelt über
                       `zielKey` eine Spalte von HIER ein. Ohne diesen Durchgang
                       zeigte er nach dem Umzug ins Leere.
        
                       NUR `zielKey`, nicht der ganze Satz. Die fremde Sammlung kann
                       denselben Zifferschlüssel selbst tragen — dann ist das ihre
                       eigene Spalte, sie bekommt ihren eigenen neuen Namen, wenn sie
                       an der Reihe ist. Sie hier mitzuziehen hiesse, ihr einen
                       Schlüssel zu geben, der in IHREM Schema schon vergeben sein
                       kann. */
                for (const fremd of sammlungen) {
                    if (fremd.id === coll.id)
                        continue;
                    let fremdGeaendert = false;
                    for (const sp of Object.values(fremd.schema || {})) {
                        if (!sp || sp.type !== 'rollup' || sp.zielKey !== alt)
                            continue;
                        const rel = fremd.schema[sp.relation];
                        if (!rel || rel.ziel !== coll.id)
                            continue;
                        sp.zielKey = neu;
                        fremdGeaendert = true;
                    }
                    if (fremdGeaendert) {
                        Store.rohSetzen('collections', fremd);
                        n++;
                    }
                }
                /* 5 · Die vorberechneten Werte dieser Sammlung sind nach Schlüssel
                       abgelegt. Sie sind ABGELEITET — wegwerfen kostet eine
                       Neuberechnung und kann nichts verlieren; sie umzuschreiben
                       wäre eine weitere Stelle, die man vergessen kann. */
                if (Store.vorratWeg)
                    Store.vorratWeg(coll.id).catch(() => { });
            }
        }
        return n;
    };
    const INHALT = [
        {
            id: 'zeitstempel-an-sammlungen',
            was: 'Sammlungen und Ansichten bekommen einen Zeitstempel',
            warum: 'Ohne ihn galt eine Schemaänderung dem Abgleich als nie geschehen: ' +
                'eine neue Spalte kam auf dem zweiten Gerät nie an. Die Zeilen ' +
                'wanderten, ihre Spalten nicht.',
            lauf: () => {
                let n = 0;
                Object.values(Store.cache.collections).forEach(c => {
                    if (!c.edited) {
                        c.edited = c.created || Store.now();
                        n++;
                    }
                });
                Object.values(Store.cache.views).forEach(v => {
                    if (!v.edited) {
                        v.edited = v.created || Store.now();
                        n++;
                    }
                });
                return n;
            }
        },
        {
            id: 'spaltenschluessel-ohne-ziffer',
            was: 'Spaltenschlüssel aus lauter Ziffern bekommen einen Buchstaben davor',
            warum: 'JavaScript sortiert einen Schlüssel wie „4711" in `Object.keys` VOR ' +
                'alle anderen. Die Spalte stand dadurch immer ganz links, egal wohin ' +
                'man sie schob — nicht als Fehler zu erkennen, weil sie ja da war. ' +
                'Seit E96 entstehen solche Schlüssel nicht mehr; der Bestand von ' +
                'vorher blieb offen (L36).',
            lauf: () => spaltenschluesselHeilen()
        },
        {
            id: 'alive-ergaenzen',
            was: 'Blöcke ohne „alive" gelten als lebendig',
            warum: 'Ein fehlendes Feld ist kein „gelöscht". Frühe Sicherungen haben ' +
                'es nicht mitgeschrieben; ohne diesen Umzug verschwänden die ' +
                'Seiten daraus beim Einspielen.',
            lauf: () => {
                let n = 0;
                Object.values(Store.cache.blocks).forEach(b => {
                    if (b.alive === undefined) {
                        b.alive = true;
                        n++;
                    }
                });
                return n;
            }
        }
    ];
    const GEMERKT = 'umzuegeGelaufen';
    const gelaufen = () => (typeof Store !== 'undefined')
        ? (Store.getMeta(GEMERKT, []) || []) : [];
    /** Alle offenen Inhaltsumzüge laufen lassen. */
    const laufen = () => {
        if (typeof Store === 'undefined' || !Store.cache)
            return { gelaufen: [], geaendert: 0 };
        const schon = new Set(gelaufen());
        const neu = [], bericht = [];
        let geaendert = 0;
        INHALT.forEach(u => {
            if (schon.has(u.id))
                return;
            let n = 0;
            try {
                n = u.lauf() || 0;
            }
            catch (e) {
                const grund = e instanceof Error ? e.message : String(e);
                if (typeof Reporter !== 'undefined')
                    Reporter.error('Umzug ' + u.id, grund, e);
                return; /* nicht als gelaufen merken — beim nächsten Start nochmal */
            }
            geaendert += n;
            neu.push(u.id);
            bericht.push({ id: u.id, was: u.was, saetze: n });
        });
        if (neu.length) {
            Store.setMeta(GEMERKT, [...schon, ...neu]);
            if (typeof Reporter !== 'undefined')
                Reporter.info('Umzuege', neu.length + ' Umzug/Umzüge gelaufen, ' +
                    geaendert + ' Sätze ergänzt', bericht);
        }
        return { gelaufen: bericht, geaendert };
    };
    /** Für die Fehlersuche: alles noch einmal laufen lassen. */
    const zuruecksetzen = () => { if (typeof Store !== 'undefined')
        Store.setMeta(GEMERKT, []); };
    return { FASSUNGEN, JETZIGE, INHALT, faecher, zwischen, hinweisZuAlt,
        laufen, gelaufen, zuruecksetzen };
})();
window.Umzuege = Umzuege;
