"use strict";
/* ============================================================================
 * schale/bedienung/ordnerkarte.ts — der Blick in einen Ordner, ohne hineinzugehen
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/ordnerkarte.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Ein Ordner im Regal sagt heute „7 Sachen" und sonst nichts. Wer
 * wissen will, WELCHE sieben, muss hineingehen (`geheIn`, E380) und danach
 * wieder heraus. Bei der Frage „liegt das Prüfungsskript in diesem Fach
 * oder im anderen?" sind das vier Wege für eine Auskunft.
 *
 * Die Ordnerkarte ist dieser Blick: ein Ordner klappt auf, die echten
 * Kinder fächern heraus, jedes mit seinem Namen und seiner Art. Ein Tipp
 * darauf öffnet es — man landet direkt am Ziel statt eine Ebene tiefer.
 *
 * WOHER. Vorgabe von Redur vom 6. September 2026 (`../ui-reserve/vorgaben/
 * folder-card.css`), zusammengelegt mit der zweiten Vorgabe desselben
 * Tages: der Ordnerstruktur, die beim Überfahren eine verschachtelte Liste
 * zeigt. Beide beschreiben dasselbe — „zeig mir, was drin ist, ohne dass
 * ich hingehen muss" —, also ist es EIN Bauteil und nicht zwei (§8).
 *
 * WAS ECHT IST, und das ist die ganze Regel hier:
 *
 *     die Kinder      `Store.childrenOf`, dieselbe Liste wie im Regal
 *     die Zahl        die echte Anzahl, nicht „5+"
 *     die Suche       filtert den ganzen Unterbaum, nicht nur eine Ebene
 *     die Art         steht als WORT auf jedem Blatt („PDF", „Ordner")
 *
 * Die fünf Farben der Blätter sind Schmuck und tragen keine Auskunft — die
 * Art steht daneben als Text. Ein Farbschlüssel für zehn Arten wäre eine
 * Auskunft, die niemand auswendig kann, und §38 verbietet Farbe als
 * einziges Merkmal.
 *
 * WARUM DIE SUCHE TIEFER GEHT ALS DIE DES REGALS. Das Suchfeld der
 * Bibliothek filtert die Kinder der offenen Ebene (`bibliothek.ts`, Filter
 * nach `parentId`). In einem Fach mit Unterfächern findet es deshalb
 * nichts, was eine Ebene tiefer liegt. Die Karte bekommt den Unterbaum
 * mitgegeben und sucht darin; jeder Treffer zeigt seinen Weg.
 * ==========================================================================*/
const Ordnerkarte = (() => {
    /* Höchstens fünf fächern heraus — mehr überdecken einander, und die
       Vorgabe zeichnet genau fünf. Der Rest steht als Zahl daneben und ist
       über die Suche erreichbar. */
    const FAECHER = 5;
    const el = (tag, klasse, eltern) => {
        const e = document.createElement(tag);
        e.className = klasse;
        if (eltern)
            eltern.append(e);
        return e;
    };
    /* Das Papier: eine Rückwand, die Blätter, eine Vorderklappe. Alles Bild
       ausser den Blättern — die sind Knöpfe, weil man sie drückt. */
    /* DIE VORDERKLAPPE IST NIEDRIGER ALS DIE RÜCKWAND, und das ist keine
       Feinheit: mit derselben Höhe verdeckte sie drei der fünf Blätter
       vollständig — auf dem Bild standen nur zwei da. Die Rückwand ist der
       ganze Ordner mit Reiter, die Klappe nur die vordere Lasche. */
    const RUECKEN = 'M4 14a8 8 0 0 1 8-8h44l12 12h90a8 8 0 0 1 8 8v66a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8Z';
    const KLAPPE = 'M4 8a8 8 0 0 1 8-8h146a8 8 0 0 1 8 8v17a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8Z';
    const papier = (vorn = false) => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', vorn ? '0 0 170 33' : '0 0 170 100');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const pfad = document.createElementNS(ns, 'path');
        pfad.setAttribute('d', vorn ? KLAPPE : RUECKEN);
        svg.append(pfad);
        return svg;
    };
    const bauen = (auftrag) => {
        const karte = el('div', 'ru-fach');
        const tiefe = auftrag.tiefe && auftrag.tiefe.length ? auftrag.tiefe : auftrag.kinder;
        let offen = false;
        let suchwort = '';
        /* ---- Zeile 1: Name und Zähler -------------------------------------- *
         * DER NAME STEHT OBEN UND NICHT UNTEN. Auf dem ersten Bild lag er unter
         * dem Ordner, die Suche darüber — und die aufgefächerten Blätter deckten
         * genau diese Suchzeile zu. Oben ist beides frei, und wer die Karte
         * aufschlägt, liest zuerst, welcher Ordner das ist (§55.1). */
        const kopf = el('div', 'ru-fach-kopf', karte);
        const name = el('p', 'ru-fach-name', kopf);
        name.textContent = auftrag.name;
        const zaehler = el('p', 'ru-fach-zaehler', kopf);
        zaehler.setAttribute('role', 'status');
        const punkt = el('i', 'ru-fach-punkt', zaehler);
        punkt.setAttribute('aria-hidden', 'true');
        const zahl = el('b', 'ru-fach-zahl', zaehler);
        const wort = el('span', 'ru-fach-wort', zaehler);
        /* ---- Zeile 2: die Suche, über die ganze Breite ---------------------- */
        const feld = document.createElement('label');
        feld.className = 'ru-fach-suche';
        const sr = el('span', 'ru-fach-sr', feld);
        sr.textContent = 'In „' + auftrag.name + '" suchen, auch in den Unterordnern';
        const eingabe = document.createElement('input');
        eingabe.type = 'search';
        eingabe.className = 'ru-fach-eingabe';
        /* „In diesem Ordner suchen …" stand als „In diesem Ordn…" da — und ein
           abgeschnittener Satz ist ein anderer Satz (§55.1). */
        eingabe.placeholder = 'Hier suchen …';
        feld.append(eingabe);
        karte.append(feld);
        /* ---- Der Ordner selbst -------------------------------------------- */
        const buehne = el('div', 'ru-fach-buehne', karte);
        const ruecken = el('div', 'ru-fach-ruecken', buehne);
        ruecken.append(papier());
        const blaetter = el('div', 'ru-fach-blaetter', buehne);
        const klappe = el('div', 'ru-fach-klappe', buehne);
        klappe.append(papier(true));
        el('i', 'ru-fach-marke', klappe).setAttribute('aria-hidden', 'true');
        /* Der Griff, der auf- und zuklappt. Ein KNOPF und kein Kästchen: die
           Vorgabe nimmt ein verstecktes `<input type=checkbox>` und `:checked`,
           aber ein Ordner, der sich öffnet, ist keine Auswahl, die man
           abschickt — er ist eine Aussage über „auf" und „zu", und dafür heisst
           das Attribut `aria-expanded` (§38). */
        const griff = document.createElement('button');
        griff.type = 'button';
        griff.className = 'ru-fach-griff';
        griff.setAttribute('aria-expanded', 'false');
        buehne.append(griff);
        /* Der Resttext ENTSTEHT HIER und nicht beim Zeichnen: sonst hängt er
           sich hinter den „Ordner öffnen"-Knopf, weil der da schon steht. */
        const mehr = el('p', 'ru-fach-rest', karte);
        /* ---- Was gerade gezeigt wird -------------------------------------- */
        const passend = () => {
            const s = suchwort.trim().toLowerCase();
            if (!s)
                return auftrag.kinder;
            return tiefe.filter(k => k.name.toLowerCase().includes(s));
        };
        const blattBauen = (stueck, nr) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'ru-fach-blatt';
            b.dataset['nr'] = String(nr);
            b.dataset['fachId'] = stueck.id;
            const glanz = el('i', 'ru-fach-glanz', b);
            glanz.setAttribute('aria-hidden', 'true');
            /* DIE ZEILE STEHT UNTEN. Vom Blatt darunter sieht man den unteren
               Streifen, nicht den oberen: das obere Blatt liegt weiter oben UND
               weiter vorn. Mit dem Namen am Kopf (so zeichnet die Vorgabe) war
               nur der Name des vordersten Blattes lesbar — auf dem Telefonbild
               standen vier farbige Streifen ohne ein Wort darauf. */
            const zeile = el('span', 'ru-fach-zeile', b);
            const text = el('span', 'ru-fach-text', zeile);
            text.textContent = stueck.name;
            /* DER GANZE NAME MUSS ERREICHBAR BLEIBEN. Vom Blatt darunter sieht
               man einen Streifen von 24 px — eine Zeile. Was nicht hineinpasst,
               endet sichtbar mit „…" (die CSS) und steht vollständig im Titel
               und im Vorlesenamen. Ein stumm abgeschnittener Name ist ein
               anderer Name (§55.1). */
            b.title = stueck.name + ' — ' + stueck.art + (stueck.weg ? ' (' + stueck.weg + ')' : '');
            b.setAttribute('aria-label', (stueck.ordner ? 'Ordner öffnen: ' : 'Öffnen: ') + b.title);
            const marke = el('span', 'ru-fach-art', zeile);
            /* Die Art als Wort. Ohne sie sagte die Farbe alles — und die sagt
               niemandem etwas (§38). */
            marke.textContent = stueck.art;
            if (stueck.weg) {
                const weg = el('span', 'ru-fach-weg', text);
                weg.textContent = ' \u00b7 ' + stueck.weg;
            }
            b.addEventListener('click', ereignis => {
                ereignis.stopPropagation();
                auftrag.beiWahl(stueck);
            });
            return b;
        };
        const zeichnen = () => {
            const liste = passend();
            const gezeigt = liste.slice(0, FAECHER);
            /* ZUGEKLAPPT STEHT KEIN BLATT IM BAUM. Sie nur mit `opacity:0` zu
               verstecken hiesse: ein Vorleser zählt fünf Knöpfe auf, die niemand
               sieht und niemand treffen kann (§38). */
            blaetter.replaceChildren(...(offen ? gezeigt.map(blattBauen) : []));
            const sucht = !!suchwort.trim();
            zahl.textContent = String(liste.length);
            /* Der Satz sagt, was die Zahl bedeutet, und ändert sich mit dem
               Zustand: ohne Suche die Anzahl im Ordner, mit Suche die Treffer. */
            wort.textContent = sucht
                ? (liste.length === 1 ? 'Treffer' : 'Treffer') + ' von ' + tiefe.length
                : (liste.length === 1 ? 'Sache' : 'Sachen');
            karte.dataset['sucht'] = sucht ? 'ja' : 'nein';
            karte.dataset['leer'] = liste.length ? 'nein' : 'ja';
            const rest = liste.length - gezeigt.length;
            mehr.textContent = liste.length === 0
                ? (sucht ? 'Kein Treffer in diesem Ordner.' : 'Dieser Ordner ist leer.')
                : (rest > 0 ? 'und ' + rest + ' weitere — such danach, um sie zu sehen' : '');
            mehr.hidden = !mehr.textContent;
        };
        const klappen = (auf) => {
            offen = auf === undefined ? !offen : auf;
            karte.dataset['offen'] = offen ? 'ja' : 'nein';
            griff.setAttribute('aria-expanded', offen ? 'true' : 'false');
            griff.setAttribute('aria-label', offen
                ? 'Ordner „' + auftrag.name + '" zuklappen'
                : 'In den Ordner „' + auftrag.name + '" hineinsehen');
            if (offen)
                zeichnen();
        };
        griff.addEventListener('click', () => klappen());
        eingabe.addEventListener('input', () => { suchwort = eingabe.value; zeichnen(); });
        /* Enter im Suchfeld darf kein Formular abschicken und nichts öffnen —
           es gibt keinen „ersten Treffer", den man erraten dürfte. */
        eingabe.addEventListener('keydown', ereignis => {
            if (ereignis.key === 'Enter')
                ereignis.preventDefault();
        });
        if (auftrag.beiOrdner) {
            const gehen = document.createElement('button');
            gehen.type = 'button';
            gehen.className = 'ru-fach-gehen btn weiter';
            gehen.textContent = 'Ordner öffnen';
            gehen.addEventListener('click', () => auftrag.beiOrdner?.());
            karte.append(gehen);
        }
        klappen(false);
        zeichnen();
        return { element: karte, klappen, offen: () => offen, entfernen: () => karte.remove() };
    };
    return { FAECHER, bauen };
})();
window.Ordnerkarte = Ordnerkarte;
