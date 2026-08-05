"use strict";
/* ============================================================================
 * probelauf.js — Erst zeigen, was passieren würde. Dann erst tun.
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/probelauf/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/probelauf/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Idee 36 der 10000×-Liste: „Workspace-Simulator". Vor einer grossen
 * Änderung wissen, was sie anrichtet — welche Formeln brechen, welche
 * Ansichten leer werden, welche Werte verschwinden. Wie ein `plan` bei
 * Terraform, nur für Notizen.
 *
 * Warum das nötig ist: eine Spalte zu löschen dauert eine Sekunde. Dass
 * damit vier Formeln kaputtgehen, zwei Ansichten ihren Filter verlieren und
 * 312 Werte weg sind, merkt man erst danach — und der Papierkorb hilft dann
 * nicht, weil er Seiten kennt und keine Spalten.
 *
 * Drei Regeln, an die sich diese Datei hält:
 *
 *   1. Sie ändert nichts. Kein einziger Aufruf hier schreibt.
 *   2. Sie zählt echt nach, statt zu schätzen. „312 Werte" heisst: 312 Zeilen
 *      haben in dieser Spalte etwas stehen, gerade eben nachgezählt.
 *   3. Sie sagt auch, wenn nichts passiert. „Diese Spalte benutzt niemand"
 *      ist die nützlichste Antwort, die sie geben kann.
 * ==========================================================================*/
const Probelauf = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const leer = (v) => v === undefined || v === null || v === '' ||
        (Array.isArray(v) && !v.length);
    const befund = (schwere, text, liste = []) => ({ schwere, text, liste });
    const SCHWERE = { verlust: '⛔', bruch: '⚠️', hinweis: 'ℹ️' };
    const nutzerDerSpalte = (coll, key) => {
        const def = coll.schema[key] || {};
        const name = def.name || key;
        const raus = { formeln: [], filter: [], sortierung: [], gruppen: [],
            rollups: [], relationen: [], automationen: [], diagramme: [],
            pruefsaetze: [] };
        /* --- Prüfsätze, die diese Spalte betreffen ---------------------------
           Der einzige Punkt in dieser Liste, den ein Mensch selbst gesetzt hat.
           Deshalb wiegt er schwerer als jede Heuristik. */
        if (typeof Pruefsatz !== 'undefined') {
            Pruefsatz.alle(coll).forEach(ps => {
                if (ps.spalte === key || (ps.gegeben && key in ps.gegeben))
                    raus.pruefsaetze.push({ wo: coll.name || 'Datenbank', was: ps.name || 'Prüfsatz' });
            });
        }
        /* --- Formeln in derselben Datenbank ---------------------------------- */
        Object.entries(coll.schema).forEach(([k, d]) => {
            if (k === key)
                return;
            if (d.type === 'formula' && String(d.formula || '').includes(name))
                raus.formeln.push({ wo: coll.name || 'Datenbank', was: d.name, text: d.formula });
            if (d.type === 'rollup' && (d.rollupProp === key || d.eigenschaft === key))
                raus.rollups.push({ wo: coll.name || 'Datenbank', was: d.name });
        });
        /* --- Formeln und Rollups in ANDEREN Datenbanken ----------------------
           Eine Formel darf über findRows/sumWhere in fremde Tabellen greifen.
           Wer nur die eigene durchsucht, übersieht genau die teuren Fälle. */
        Object.values(Store.cache.collections).forEach(c => {
            if (c.id === coll.id)
                return;
            Object.values(c.schema || {}).forEach(d => {
                if (d.type === 'formula' && String(d.formula || '').includes(name) &&
                    String(d.formula || '').includes(coll.name || '\u0000'))
                    raus.formeln.push({ wo: c.name || 'Datenbank', was: d.name, text: d.formula });
                if (d.type === 'rollup' && (d.rollupProp === key || d.eigenschaft === key)) {
                    const rel = c.schema[d.relation];
                    if (rel && rel.ziel === coll.id)
                        raus.rollups.push({ wo: c.name || 'Datenbank', was: d.name });
                }
            });
        });
        /* --- Verknüpfungen, die auf diese Spalte zeigen ----------------------- */
        if (def.type === 'relation') {
            const ziel = Store.getCollection(def.ziel);
            if (ziel && def.gegen && ziel.schema[def.gegen])
                raus.relationen.push({ wo: ziel.name || 'Datenbank', was: ziel.schema[def.gegen].name });
        }
        Object.values(Store.cache.collections).forEach(c => {
            Object.values(c.schema || {}).forEach(d => {
                if (d.type === 'relation' && d.gegen === key && d.ziel === coll.id)
                    raus.relationen.push({ wo: c.name || 'Datenbank', was: d.name });
            });
        });
        /* --- Ansichten ------------------------------------------------------- */
        const regelnSuchen = (gruppe, treffer) => {
            (gruppe && gruppe.rules || []).forEach((r) => {
                if (r.rules !== undefined)
                    regelnSuchen(r, treffer);
                else if (r.key === key)
                    treffer.push(r);
            });
        };
        (coll.viewIds || []).map((id) => Store.getView(id)).filter(Boolean).forEach((v) => {
            const t = [];
            regelnSuchen(v.filters, t);
            if (t.length)
                raus.filter.push({ wo: v.name || v.layout, anzahl: t.length });
            if ((v.sorts || []).some((s) => s.key === key))
                raus.sortierung.push({ wo: v.name || v.layout });
            if (v.groupBy === key)
                raus.gruppen.push({ wo: v.name || v.layout });
            if (v.pivotZeile === key || v.pivotSpalte === key || v.pivotWert === key)
                raus.diagramme.push({ wo: v.name || v.layout, was: 'Pivot' });
            if (v.chartX === key || v.chartY === key || v.chartWert === key)
                raus.diagramme.push({ wo: v.name || v.layout, was: 'Diagramm' });
        });
        /* --- Automationen und Knöpfe ----------------------------------------- */
        const drin = (x) => JSON.stringify(x || {}).includes('"' + key + '"');
        (coll.automationen || []).forEach((a) => {
            if (drin(a))
                raus.automationen.push({ wo: coll.name || 'Datenbank', was: a.name || 'Automation' });
        });
        Object.values(Store.cache.blocks).forEach(b => {
            if (b.type === 'button' && b.alive !== false && drin(b.aktionen))
                raus.automationen.push({ wo: 'Knopf', was: b.text || 'Ohne Beschriftung' });
        });
        return raus;
    };
    /* ========================================================================
     * 2 · DIE VORHABEN
     * ======================================================================*/
    /** Wie viele Zeilen haben in dieser Spalte überhaupt etwas stehen? */
    const gefuellt = (coll, key) => Store.rowsOf(coll.id).filter((r) => !leer((r.props || {})[key])).length;
    const spalteWeg = (coll, key) => {
        const def = coll.schema[key] || {};
        const n = gefuellt(coll, key);
        const zeilen = Store.rowsOf(coll.id).length;
        const nutzer = nutzerDerSpalte(coll, key);
        const b = [];
        if (def.type === 'title')
            b.push(befund('bruch', 'Die Titelspalte lässt sich nicht löschen. ' +
                'Jede Datenbank braucht genau eine.'));
        if (n)
            b.push(befund('verlust', n + ' von ' + zeilen + ' Zeilen haben hier einen Wert. Diese Werte sind danach weg — ' +
                'der Papierkorb kennt Seiten, keine Spalten.', Store.rowsOf(coll.id).filter((r) => !leer((r.props || {})[key])).slice(0, 8)
                .map((r) => (r.text || 'Ohne Titel') + ' → ' + Formula.anzeige((r.props || {})[key]))));
        if (nutzer.formeln.length)
            b.push(befund('bruch', nutzer.formeln.length + ' Formel' + (nutzer.formeln.length === 1 ? '' : 'n') +
                ' nennen diese Spalte beim Namen und zeigen danach einen Fehler.', nutzer.formeln.map(f => f.wo + ' › ' + f.was)));
        if (nutzer.rollups.length)
            b.push(befund('bruch', nutzer.rollups.length + ' Rollup' + (nutzer.rollups.length === 1 ? '' : 's') +
                ' rechnen mit dieser Spalte.', nutzer.rollups.map(f => f.wo + ' › ' + f.was)));
        if (nutzer.relationen.length)
            b.push(befund('bruch', 'Die Gegenspalte in ' + nutzer.relationen.length + ' Datenbank' +
                (nutzer.relationen.length === 1 ? '' : 'en') + ' zeigt danach ins Leere.', nutzer.relationen.map(f => f.wo + ' › ' + f.was)));
        if (nutzer.filter.length)
            b.push(befund('hinweis', nutzer.filter.length + ' Ansicht' + (nutzer.filter.length === 1 ? '' : 'en') +
                ' filtern danach — der Filter fällt weg, es werden mehr Zeilen sichtbar.', nutzer.filter.map(f => f.wo)));
        if (nutzer.sortierung.length)
            b.push(befund('hinweis', 'Die Sortierung von ' + nutzer.sortierung.length + ' Ansicht' +
                (nutzer.sortierung.length === 1 ? '' : 'en') + ' fällt weg.', nutzer.sortierung.map(f => f.wo)));
        if (nutzer.gruppen.length)
            b.push(befund('bruch', nutzer.gruppen.length + ' Ansicht' + (nutzer.gruppen.length === 1 ? '' : 'en') +
                ' gruppieren danach und haben danach keine Spalten mehr.', nutzer.gruppen.map(f => f.wo)));
        if (nutzer.diagramme.length)
            b.push(befund('bruch', nutzer.diagramme.length + ' Auswertung' + (nutzer.diagramme.length === 1 ? '' : 'en') +
                ' beziehen sich darauf.', nutzer.diagramme.map(f => f.wo + ' › ' + f.was)));
        if (nutzer.automationen.length)
            b.push(befund('bruch', nutzer.automationen.length + ' Automation' + (nutzer.automationen.length === 1 ? '' : 'en') +
                ' oder Knöpfe fassen diese Spalte an.', nutzer.automationen.map(f => f.wo + ' › ' + f.was)));
        if (nutzer.pruefsaetze.length)
            b.push(befund('bruch', nutzer.pruefsaetze.length + ' Prüfsatz/Prüfsätze prüfen genau das hier — ' +
                'du hast selbst festgehalten, dass es so stimmen soll.', nutzer.pruefsaetze.map(f => f.was)));
        return { titel: 'Spalte „' + (def.name || key) + '" löschen', befunde: b };
    };
    /* --- Typ ändern -------------------------------------------------------- */
    /* Was sich in was verwandeln lässt, ohne dass etwas verloren geht. */
    const ZAHLIG = ['number', 'formula', 'rollup'];
    const TEXTIG = ['text', 'title', 'url', 'email', 'phone'];
    const passt = (wert, typ) => {
        if (leer(wert))
            return true;
        const t = String(Array.isArray(wert) ? wert[0] : wert);
        if (typ === 'number')
            return isFinite(parseFloat(t.replace(',', '.')));
        if (typ === 'date')
            return !isNaN(new Date(t).getTime());
        if (typ === 'checkbox')
            return ['true', 'false', 'ja', 'nein', '1', '0', ''].includes(t.toLowerCase());
        if (typ === 'select' || typ === 'status')
            return !Array.isArray(wert) || wert.length <= 1;
        return true; /* nach Text passt alles */
    };
    const spalteTyp = (coll, key, neuerTyp) => {
        const def = coll.schema[key] || {};
        const zeilen = Store.rowsOf(coll.id);
        const schlecht = zeilen.filter((r) => !passt((r.props || {})[key], neuerTyp));
        const nutzer = nutzerDerSpalte(coll, key);
        const b = [];
        if (schlecht.length)
            b.push(befund('verlust', schlecht.length + ' von ' + zeilen.length + ' Werten passen nicht in den neuen Typ ' +
                'und werden leer.', schlecht.slice(0, 8).map((r) => (r.text || 'Ohne Titel') + ' → ' +
                Formula.anzeige((r.props || {})[key]))));
        else
            b.push(befund('hinweis', 'Alle Werte passen in den neuen Typ.'));
        if (TEXTIG.includes(def.type) && ZAHLIG.includes(neuerTyp) === false &&
            ['select', 'status', 'multi'].includes(neuerTyp))
            b.push(befund('hinweis', 'Aus jedem vorhandenen Text wird eine Auswahlmöglichkeit. ' +
                'Bei vielen verschiedenen Werten wird die Liste lang.'));
        if (def.type === 'formula' && neuerTyp !== 'formula')
            b.push(befund('verlust', 'Die Formel selbst geht verloren, nicht nur ihr Ergebnis.'));
        if (def.type === 'relation' && neuerTyp !== 'relation')
            b.push(befund('verlust', 'Alle Verknüpfungen dieser Spalte werden getrennt — ' +
                'auch die Gegenrichtung in der anderen Datenbank.'));
        if (nutzer.formeln.length)
            b.push(befund('bruch', nutzer.formeln.length + ' Formel(n) rechnen mit dieser Spalte. Ein anderer Typ ' +
                'kann dort ein anderes Ergebnis geben — oder einen Fehler.', nutzer.formeln.map(f => f.wo + ' › ' + f.was)));
        if (nutzer.filter.length)
            b.push(befund('hinweis', 'In ' + nutzer.filter.length + ' Ansicht(en) filtert eine Regel darauf. ' +
                'Manche Vergleiche gibt es beim neuen Typ nicht mehr.', nutzer.filter.map(f => f.wo)));
        if (nutzer.pruefsaetze.length)
            b.push(befund('bruch', nutzer.pruefsaetze.length + ' Prüfsatz/Prüfsätze hängen an dieser Spalte.', nutzer.pruefsaetze.map(f => f.was)));
        return { titel: 'Spalte „' + (def.name || key) + '" auf ' + neuerTyp + ' umstellen',
            befunde: b };
    };
    /* --- Umbenennen -------------------------------------------------------- */
    const spalteName = (coll, key, neuerName) => {
        const def = coll.schema[key] || {};
        const nutzer = nutzerDerSpalte(coll, key);
        const b = [];
        const doppelt = Object.entries(coll.schema)
            .some(([k, d]) => k !== key && (d.name || '').toLowerCase() === String(neuerName).toLowerCase());
        if (doppelt)
            b.push(befund('bruch', 'Es gibt bereits eine Spalte mit diesem Namen. Formeln, die den Namen nennen, ' +
                'wüssten dann nicht mehr, welche gemeint ist.'));
        if (nutzer.formeln.length)
            b.push(befund('bruch', nutzer.formeln.length + ' Formel(n) nennen den alten Namen. Sie werden mit ' +
                'umgeschrieben — wenn eine davon den Namen in Anführungszeichen führt, bleibt ' +
                'sie stehen und muss von Hand nach.', nutzer.formeln.map(f => f.wo + ' › ' + f.was)));
        else
            b.push(befund('hinweis', 'Keine Formel nennt diesen Namen. Umbenennen ist gefahrlos.'));
        return { titel: 'Spalte „' + (def.name || key) + '" in „' + neuerName + '" umbenennen',
            befunde: b };
    };
    /* --- Seite löschen ----------------------------------------------------- */
    const seiteWeg = (id) => {
        const s = Store.getBlock(id);
        if (!s)
            return { titel: 'Seite löschen', befunde: [befund('hinweis', 'Diese Seite gibt es nicht mehr.')] };
        /* Alles darunter zählen, nicht nur die erste Ebene. */
        let bloecke = 0, seiten = 0, dbs = 0, zeilen = 0;
        const gehe = (bid, tiefe = 0) => {
            if (tiefe > 40)
                return;
            const b = Store.getBlock(bid);
            if (!b || b.alive === false)
                return;
            bloecke++;
            if (b.type === 'page')
                seiten++;
            if (b.collectionId) {
                dbs++;
                zeilen += Store.rowsOf(b.collectionId).length;
            }
            (b.content || []).forEach((k) => gehe(k, tiefe + 1));
        };
        (s.content || []).forEach((k) => gehe(k));
        /* Rückverweise. Hier stand `Links.rueckverweise` — die Funktion heisst
           aber `verweiseAuf` und hat nie existiert. Weil der Aufruf hinter
           `&& Links.rueckverweise` stand, fiel das nie auf: die Liste war immer
           leer, und beim Löschen einer Seite kam der Satz „andere Seiten
           verweisen hierher" kein einziges Mal. Genau der Hinweis, für den es
           diesen Probelauf gibt. */
        const rueck = typeof Links !== 'undefined' ? (Links.verweiseAuf(id) || []) : [];
        const b = [];
        b.push(befund(seiten || dbs ? 'verlust' : 'hinweis', bloecke + ' Blöcke darunter, davon ' + seiten + ' Unterseiten und ' + dbs +
            ' Datenbanken mit zusammen ' + zeilen + ' Zeilen.'));
        if (rueck.length)
            b.push(befund('bruch', rueck.length + ' andere Seite(n) verweisen hierher. Die Verweise zeigen danach ins Leere.', 
            /* `verweiseAuf` liefert `{ seite, stellen }` — der Titel steht eine
               Ebene tiefer. Die alte Zeile las `r.text` am falschen Objekt und
               hätte auch mit dem richtigen Namen nur „Ohne Titel" gezeigt. */
            rueck.slice(0, 8).map((r) => (r.seite?.text || 'Ohne Titel'))));
        /* Verknüpfungen aus Datenbankzeilen auf diese Seite */
        let verknuepft = 0;
        Object.values(Store.cache.blocks).forEach(x => {
            if (x.parentTable !== 'collection' || x.alive === false)
                return;
            Object.values(x.props || {}).forEach(v => {
                if (Array.isArray(v) && v.includes(id))
                    verknuepft++;
            });
        });
        if (verknuepft)
            b.push(befund('bruch', verknuepft + ' Datenbankzeile(n) sind mit dieser Seite verknüpft.'));
        b.push(befund('hinweis', 'Der Papierkorb hält sie noch — endgültig weg ist sie erst, ' +
            'wenn die Frist abläuft oder jemand sie dort löscht.'));
        return { titel: 'Seite „' + (s.text || 'Ohne Titel') + '" löschen', befunde: b };
    };
    /* --- Ansicht löschen --------------------------------------------------- */
    const ansichtWeg = (viewId) => {
        const v = Store.getView(viewId);
        if (!v)
            return { titel: 'Ansicht löschen', befunde: [] };
        const coll = Store.getCollection(v.collectionId);
        const b = [];
        const anzahl = (coll && coll.viewIds || []).length;
        if (anzahl <= 1)
            b.push(befund('bruch', 'Das ist die letzte Ansicht dieser Datenbank. Ohne Ansicht ist sie nicht mehr zu sehen.'));
        const regeln = typeof Datenbank !== 'undefined' && Datenbank.regelAnzahl
            ? Datenbank.regelAnzahl(v.filters) : 0;
        if (regeln || (v.sorts || []).length || v.groupBy)
            b.push(befund('hinweis', 'Einstellungen dieser Ansicht gehen verloren: ' +
                [regeln ? regeln + ' Filterregeln' : '', (v.sorts || []).length ? (v.sorts || []).length + ' Sortierungen' : '',
                    v.groupBy ? 'eine Gruppierung' : ''].filter(Boolean).join(', ') + '.'));
        b.push(befund('hinweis', 'Die Zeilen selbst bleiben. Eine Ansicht ist nur eine Brille.'));
        return { titel: 'Ansicht „' + (v.name || v.layout) + '" löschen', befunde: b };
    };
    /* --- Automation trocken laufen lassen ---------------------------------- */
    const automation = (coll, index) => {
        const a = (coll.automationen || [])[index];
        if (!a)
            return { titel: 'Automation', befunde: [befund('hinweis', 'Diese Automation gibt es nicht.')] };
        const zeilen = Store.rowsOf(coll.id);
        const treffer = zeilen.filter((r) => {
            if (!a.bedingungen || !a.bedingungen.length)
                return true;
            /* Die ganze Automation, nicht ihre Bedingungsliste — sonst prüft
               every() eine leere Liste und alles trifft zu. */
            try {
                return Datenbank.bedingungenTreffen(a, r, coll);
            }
            catch {
                return false;
            }
        });
        const b = [];
        b.push(befund(treffer.length ? 'hinweis' : 'hinweis', treffer.length + ' von ' + zeilen.length + ' Zeilen erfüllen die Bedingungen.', treffer.slice(0, 8).map((r) => r.text || 'Ohne Titel')));
        (a.aktionen || []).forEach((ak) => {
            const feld = ak.key && coll.schema[ak.key] ? coll.schema[ak.key].name : ak.key;
            if (ak.art === 'setzen' || ak.art === 'wert')
                b.push(befund('verlust', 'Setzt „' + esc(feld) + '" auf „' + esc(ak.wert) +
                    '" — der bisherige Wert wird überschrieben, bei ' + treffer.length + ' Zeilen.'));
            else if (ak.art === 'loeschen')
                b.push(befund('verlust', 'Löscht ' + treffer.length + ' Zeilen.'));
            else
                b.push(befund('hinweis', 'Aktion: ' + esc(ak.art || 'unbekannt')));
        });
        if (!(a.aktionen || []).length)
            b.push(befund('hinweis', 'Diese Automation hat keine Aktionen — sie tut nichts.'));
        return { titel: 'Probelauf: ' + (a.name || 'Automation'), befunde: b, trocken: true };
    };
    /* ========================================================================
     * 3 · DIE EINE TÜR
     * ======================================================================*/
    const fuer = (vorhaben) => {
        const v = vorhaben || {};
        const coll = v.coll ? (typeof v.coll === 'string' ? Store.getCollection(v.coll) : v.coll) : null;
        switch (v.art) {
            case 'spalteWeg': return spalteWeg(coll, v.key);
            case 'spalteTyp': return spalteTyp(coll, v.key, v.neuerTyp);
            case 'spalteName': return spalteName(coll, v.key, v.neuerName);
            case 'seiteWeg': return seiteWeg(v.id);
            case 'ansichtWeg': return ansichtWeg(v.view);
            case 'automation': return automation(coll, v.index);
            default: return { titel: 'Probelauf', befunde: [befund('hinweis', 'Für dieses Vorhaben gibt es noch keinen Probelauf.')] };
        }
    };
    /** Wiegt der Befund schwer genug, um vorher zu fragen? */
    const lohntSich = (plan) => (plan.befunde || []).some((b) => b.schwere === 'verlust' || b.schwere === 'bruch');
    /* ========================================================================
     * 4 · DAS FENSTER
     * ======================================================================*/
    /**
     * @param {Object} vorhaben
     * @param {Function} [tun]  wird beim Bestätigen aufgerufen
     * @returns {Promise<boolean>} ob bestätigt wurde
     */
    const fenster = (vorhaben, tun) => new Promise((fertig) => {
        const plan = fuer(vorhaben);
        const o = document.createElement('div');
        o.className = 'overlay';
        const schwer = (plan.befunde || []).filter(b => b.schwere === 'verlust').length;
        const brueche = (plan.befunde || []).filter(b => b.schwere === 'bruch').length;
        o.innerHTML = '<div class="finder" style="width:min(680px,96vw)">' +
            '<div class="fh">🔍 Probelauf<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" style="padding:18px;max-height:70vh;overflow:auto">' +
            '<div style="font-weight:600;font-size:1.05em;margin-bottom:4px">' + esc(plan.titel) + '</div>' +
            '<div style="opacity:.7;margin-bottom:14px">' +
            (plan.trocken
                ? 'Nichts davon ist geschehen. Das hier ist nur, was geschehen würde.'
                : schwer || brueche
                    ? 'Das ist noch nicht passiert. Was passieren würde:'
                    : 'Das ist noch nicht passiert — es sieht aber harmlos aus.') +
            '</div>' +
            (plan.befunde || []).map(b => '<div style="display:flex;gap:10px;margin-bottom:12px">' +
                '<div style="font-size:1.1em">' + SCHWERE[b.schwere] + '</div>' +
                '<div style="flex:1">' + esc(b.text) +
                (b.liste && b.liste.length
                    ? '<ul style="margin:6px 0 0;padding-left:18px;opacity:.75">' +
                        b.liste.slice(0, 8).map(x => '<li>' + esc(typeof x === 'string' ? x :
                            (x.text || x.titel || JSON.stringify(x))) + '</li>').join('') +
                        (b.liste.length > 8 ? '<li>… und ' + (b.liste.length - 8) + ' weitere</li>' : '') +
                        '</ul>'
                    : '') +
                '</div></div>').join('') +
            (!(plan.befunde || []).length
                ? '<div style="opacity:.7">Nichts gefunden. Diese Änderung betrifft sonst niemanden.</div>'
                : '') +
            '</div>' +
            '<div class="fbtns">' +
            (plan.trocken
                ? '<button data-a="zu" class="prim">Verstanden</button>'
                : '<button data-a="los" class="prim">' +
                    (schwer ? 'Trotzdem tun' : 'Ausführen') + '</button>' +
                    '<button data-a="zu">Abbrechen</button>') +
            '</div></div>';
        document.body.appendChild(o);
        let entschieden = false;
        o.addEventListener('click', (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                entschieden = true;
                o.remove();
                fertig(false);
                return;
            }
            if (elVon(e)?.closest('[data-a="los"]')) {
                entschieden = true;
                o.remove();
                try {
                    if (tun)
                        tun();
                }
                catch (err) {
                    UI.toast(err instanceof Error ? err.message : String(err));
                }
                fertig(true);
            }
        });
        o.addEventListener('keydown', (e) => { if (e.key === 'Escape') {
            o.remove();
            fertig(false);
        } });
        setTimeout(() => { if (!entschieden)
            o.querySelector('[data-a="zu"]')?.focus(); }, 50);
    });
    /**
     * Bequem für Löschknöpfe: nur fragen, wenn es weh tut.
     * @returns {Promise<boolean>}
     */
    const fragenWennNoetig = async (vorhaben, tun) => {
        const plan = fuer(vorhaben);
        if (!lohntSich(plan)) {
            if (tun)
                tun();
            return true;
        }
        return await fenster(vorhaben, tun);
    };
    return { fuer, fenster, fragenWennNoetig, lohntSich, nutzerDerSpalte,
        spalteWeg, spalteTyp, spalteName, seiteWeg, ansichtWeg, automation, passt };
})();
window.Probelauf = Probelauf;
