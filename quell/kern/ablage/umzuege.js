"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ablage/umzuege.ts (npm run bauen:ts). */
const Umzuege = (() => {
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
    const JETZIGE = FASSUNGEN[FASSUNGEN.length - 1]?.nr ?? 0;
    const faecher = () => FASSUNGEN.flatMap(f => f.faecher);
    const zwischen = (von, nach) => FASSUNGEN.filter(f => f.nr > von && f.nr <= nach);
    const hinweisZuAlt = (dbFassung) => 'Diese Ablage wurde von einer neueren Fassung von Redion angelegt ' +
        '(Fassung ' + dbFassung + ', diese App kennt ' + JETZIGE + '). ' +
        'Öffne die neuere Fassung, oder lege über „Sichern" eine Datei an und ' +
        'spiele sie dort wieder ein.';
    const nurZiffern = (k) => /^\d+$/.test(k);
    const SCHLUESSELFELDER = new Set([
        'key', 'groupBy', 'zielKey', 'relation', 'setzeKey', 'filterKey',
        'bildKey', 'dateKey', 'datumKey', 'startKey', 'endeKey', 'ortKey',
        'bahnKey', 'abhKey', 'titelKey', 'summeKey',
        'pivotZeile', 'pivotSpalte', 'pivotWert',
        'chartGruppe', 'chartWert', 'chartStufe'
    ]);
    const SCHLUESSELLISTEN = new Set([
        'hidden', 'pflicht', 'fixiert', 'zuGruppen', 'bahnenZu', 'spalten'
    ]);
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
                if (satzUmschreiben(coll, alt, neu)) {
                    Store.rohSetzen('collections', coll);
                    n++;
                }
                for (const vid of coll.viewIds || []) {
                    const view = Store.cache.views[vid];
                    if (view && satzUmschreiben(view, alt, neu)) {
                        Store.rohSetzen('views', view);
                        n++;
                    }
                }
                for (const block of Object.values(Store.cache.blocks)) {
                    if (block && block.parentTable === 'collection' && block.parentId === coll.id
                        && satzUmschreiben(block, alt, neu)) {
                        Store.rohSetzen('blocks', block);
                        n++;
                    }
                }
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
                return;
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
    const zuruecksetzen = () => { if (typeof Store !== 'undefined')
        Store.setMeta(GEMERKT, []); };
    return { FASSUNGEN, JETZIGE, INHALT, faecher, zwischen, hinweisZuAlt,
        laufen, gelaufen, zuruecksetzen };
})();
window.Umzuege = Umzuege;
