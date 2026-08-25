"use strict";
/* ============================================================================
 * cleanup.ts — Spalten aufräumen, bevor man mit ihnen rechnet (L27)
 * ----------------------------------------------------------------------------
 * L27 nennt sechs Handgriffe eines Import-Assistenten. Vier davon gab es
 * schon, als die Lücke geschrieben wurde:
 *
 *   Typen erkennen              `Spaltentyp.erkenne`, beim CSV-Einlesen
 *   Vorschau vor dem Übernehmen derselbe Weg — erst nachsehen, dann fragen
 *   Duplikate entfernen         `Pflege.dublettenDialog`
 *   Dateien kombinieren         ein zweites CSV in dieselbe Datenbank
 *
 * Zwei fehlten, und beide sind das, was man nach jedem Import als Erstes
 * braucht:
 *
 *   Spalten bereinigen          Leerzeichen vorn und hinten, doppelte
 *                               Leerzeichen, unsichtbare Zeichen
 *   Werte ersetzen              „GmbH." → „GmbH" in dreihundert Zeilen
 *
 * DIE REGEL DIESER DATEI IST DIE VON `probelauf.ts`: erst zeigen, was
 * passieren würde, dann erst tun. `plan()` ändert nichts und zählt echt
 * nach; `wende` schreibt. Ein Aufräumen, das dreihundert Zeilen anfasst und
 * erst danach zeigt, was es getan hat, ist kein Werkzeug, sondern ein
 * Risiko (§46).
 * ==========================================================================*/
const Aufraeumen = (() => {
    /* Unsichtbare Zeichen, die aus Tabellen mitkommen und alles verderben:
       geschütztes Leerzeichen, Nullbreite, Byte-Reihenfolge-Marke. Sie sehen
       aus wie nichts und sind nicht nichts — ein Filter „ist gleich Berlin"
       greift bei einem geschützten Leerzeichen dahinter nicht, und niemand
       sieht warum.
  
       ALS ESCAPE GESCHRIEBEN, NICHT ALS ZEICHEN. Eine Regex mit literalen
       unsichtbaren Zeichen im Quelltext übersteht kein Kopieren und keine
       Zeichensatzumstellung — und ob sie noch enthält, was sie enthalten
       soll, sieht ihr niemand an. */
    const UNSICHTBAR = /[\u00a0\u2007\u202f\u200b\u200c\u200d\ufeff]/g;
    const GRIFFE = [
        { id: 'rand', name: 'Leerzeichen am Rand entfernen',
            was: 'vorn und hinten',
            tu: (w) => w.replace(/^\s+|\s+$/g, '') },
        { id: 'innen', name: 'Doppelte Leerzeichen zusammenziehen',
            was: 'zwei oder mehr werden eines',
            tu: (w) => w.replace(/[ \t]{2,}/g, ' ') },
        { id: 'unsichtbar', name: 'Unsichtbare Zeichen entfernen',
            was: 'geschütztes Leerzeichen, Nullbreite, BOM',
            tu: (w) => w.replace(UNSICHTBAR, ' ') },
        { id: 'gross', name: 'Erster Buchstabe gross',
            was: 'nur der erste, der Rest bleibt',
            tu: (w) => w ? w.charAt(0).toLocaleUpperCase('de-DE') + w.slice(1) : w }
    ];
    /**
     * Was passieren WÜRDE. Ändert nichts.
     *
     * `ersetze` ist ein wörtlicher Text, kein Ausdruck: wer „(GmbH)" ersetzen
     * will, tippt „(GmbH)" und nicht „\(GmbH\)". Ein Suchfeld, das heimlich
     * ein regulärer Ausdruck ist, macht aus einem Punkt ein Jokerzeichen und
     * ersetzt dann mehr als gemeint — bei dreihundert Zeilen fällt das erst
     * hinterher auf.
     */
    const plan = (coll, key, wahl = {}) => {
        const def = coll && coll.schema ? coll.schema[key] : null;
        const spalte = def ? String(def.name || key) : String(key);
        const griffe = GRIFFE.filter(g => (wahl.griffe || []).includes(g.id));
        const suche = String(wahl.ersetze ?? '');
        const durch = String(wahl.durch ?? '');
        const zeilen = [];
        const alle = Store.rowsOf(coll.id);
        for (const row of alle) {
            const roh = (row.props || {})[key];
            /* Nur Text wird aufgeräumt. Eine Zahl hat keine Leerzeichen am Rand,
               und aus ihr einen Text zu machen wäre der teurere Schaden. */
            if (typeof roh !== 'string')
                continue;
            let neu = roh;
            for (const g of griffe)
                neu = g.tu(neu);
            if (suche) {
                neu = wahl.nurGanz
                    ? (neu === suche ? durch : neu)
                    : neu.split(suche).join(durch);
            }
            if (neu !== roh)
                zeilen.push({ id: row.id, vorher: roh, nachher: neu });
        }
        return { key, spalte, zeilen, betroffen: zeilen.length, gesamt: alle.length };
    };
    /**
     * Und jetzt wirklich. Gibt zurück, wie viele Zeilen sich geändert haben.
     *
     * Es wird DER PLAN geschrieben und nicht neu gerechnet: zwischen Vorschau
     * und Zusage kann sich der Bestand geändert haben (zweites Fenster,
     * Abgleich), und dann stünde in der Zelle etwas, das dem Menschen nie
     * gezeigt wurde. Wessen Wert inzwischen ein anderer ist, bleibt in Ruhe.
     */
    const wende = (vorschau) => {
        let geaendert = 0, ausgelassen = 0;
        for (const z of vorschau.zeilen) {
            const row = Store.getBlock(z.id);
            if (!row || (row.props || {})[vorschau.key] !== z.vorher) {
                ausgelassen++;
                continue;
            }
            Store.setProp(z.id, vorschau.key, z.nachher);
            geaendert++;
        }
        return { geaendert, ausgelassen };
    };
    /** Welche Spalten sich aufräumen lassen — die, in denen Text steht. */
    const spalten = (coll) => Object.keys((coll && coll.schema) || {}).filter(k => {
        const t = coll.schema[k].type;
        return t === 'text' || t === 'title' || t === 'url' ||
            t === 'email' || t === 'phone';
    });
    return { GRIFFE, plan, wende, spalten };
})();
window.Aufraeumen = Aufraeumen;
