"use strict";
/* ============================================================================
 * schale/bedienung/merkzeichen.ts — das Lesezeichen: ein Merker, eine Sprache
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/merkzeichen.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Das Feld heisst überall `favorite`, aber jede Stelle zeichnete es
 * anders: die Kopfleiste ein SVG mit der Klasse `on` und OHNE `aria-pressed`,
 * die Notizhefte ein „★" gegen ein „☆" mit `aria-pressed`, das Regal ein
 * Zeichen, das gar kein Knopf ist. Wer nicht sieht, ob etwas gedrückt ist,
 * hört es auch nicht — und in der Kopfleiste hörte man es nicht.
 *
 * Dieses Bauteil ist der eine Merker: ein Lesezeichen, das seinen Zustand
 * über FORM (gefüllt gegen offen), über TEXT (`aria-pressed`, `aria-label`)
 * und erst zusätzlich über Farbe sagt (§38).
 *
 * WOHER, und warum es EIN Zeichen ist und nicht zwei. Redur hat am
 * 6. September 2026 zwei Vorgaben geschickt: das Lesezeichen mit dem
 * Funkenkranz (`.ui-bookmark`) und das Herz mit dem rollenden Punkt
 * (`.love-heart`, beide in `loader-sammlung.css` im Vorgaben-Archiv).
 * Beide zeichnen denselben Vorgang: etwas anhaken, das man wiederfinden
 * will. Zwei Symbole für dasselbe Feld wären zwei Sprachen für eine Sache
 * (§8) — jemand, der in der Kopfleiste ein Herz und im Heft einen Stern
 * sieht, fragt zu Recht, was der Unterschied ist. Es gibt keinen.
 *
 * Also nimmt Redion die FORM des Lesezeichens — weil das Wort hier
 * „Favoriten" heisst und nicht „gefällt mir" — und die MECHANIK des
 * Herzens: der Punkt rollt in zwei Zügen an seinen Platz, und darauf
 * springt der Kranz auf. Beide Vorgaben stecken darin, keine zweimal.
 * ==========================================================================*/
const Merkzeichen = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    /* Das Band. Ein Pfad, kein Zeichen aus der Schrift: „★" gegen „☆" hängt
       davon ab, dass die Schrift beide hat, und auf dem Telefon hat sie oft
       nur eines — dann sieht „gemerkt" aus wie „nicht gemerkt". */
    const BAND = 'M6.5 3h11a1.5 1.5 0 0 1 1.5 1.5v16.2a.8.8 0 0 1-1.2.7L12 17.9l-5.8 3.5a.8.8 0 0 1-1.2-.7V4.5A1.5 1.5 0 0 1 6.5 3Z';
    const band = (an) => {
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        svg.classList.add('ru-merk-band');
        const pfad = document.createElementNS(NS, 'path');
        pfad.setAttribute('d', BAND);
        /* GEFÜLLT ODER OFFEN — das ist der Unterschied, den man auch ohne
           Farbe sieht. Die Farbe kommt oben drauf, nicht statt dessen. */
        pfad.setAttribute('fill', an ? 'currentColor' : 'none');
        pfad.setAttribute('stroke', 'currentColor');
        pfad.setAttribute('stroke-width', '1.7');
        pfad.setAttribute('stroke-linejoin', 'round');
        svg.append(pfad);
        return svg;
    };
    const satz = (an, name) => (an ? 'Aus Favoriten' : 'Zu Favoriten') + (name ? ': ' + name : '');
    /** Der Inhalt eines Merkknopfs: Band, Kranz, Funken, rollender Punkt. */
    const inneres = (auftrag) => {
        const teil = document.createDocumentFragment();
        teil.append(band(auftrag.an));
        for (const klasse of ['ru-merk-kreis', 'ru-merk-funken', 'ru-merk-punkt']) {
            const i = document.createElement('i');
            i.className = klasse;
            i.setAttribute('aria-hidden', 'true');
            teil.append(i);
        }
        return teil;
    };
    /**
     * Einen vorhandenen Knopf auf den Zustand stellen.
     *
     * DER KRANZ SPRINGT NUR AUF, WENN SICH ETWAS ÄNDERT — und nur beim
     * Anhaken. Ein Kranz bei jedem Neuzeichnen wäre ein Feuerwerk, sooft die
     * Seite sich rührt; einer beim Abhaken wäre eine Feier fürs Weggehen.
     */
    const markieren = (knopf, auftrag) => {
        const vorher = knopf.getAttribute('aria-pressed');
        const an = !!auftrag.an;
        knopf.classList.add('ru-merk');
        knopf.classList.toggle('ist-an', an);
        knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
        knopf.setAttribute('aria-label', satz(an, auftrag.name));
        knopf.title = satz(an, auftrag.name);
        knopf.replaceChildren(inneres({ an, ...(auftrag.name ? { name: auftrag.name } : {}) }));
        /* JEDES STELLEN RÄUMT DEN KRANZ ERST WEG. Ohne das blieb er nach dem
           Abhaken hängen, bis `animationend` kam — und ein Kranz, der eine
           Dreizehntelsekunde nach dem Abhaken noch dasteht, feiert das
           Falsche. (test433 §1 hat genau das gefunden.) */
        knopf.classList.remove('platzt');
        if (an && vorher === 'false') {
            /* Ein Neuzeichnen erzwingen, sonst läuft die Bewegung nicht noch
               einmal, wenn dieselbe Klasse im selben Zug ab- und wieder angeht. */
            void knopf.offsetWidth;
            knopf.classList.add('platzt');
            knopf.addEventListener('animationend', () => knopf.classList.remove('platzt'), { once: true });
        }
    };
    /**
     * Ein fertiger Merkknopf. `beiWechsel` bekommt den NEUEN Zustand; wer den
     * Wert wirklich speichert, entscheidet der Aufrufer — dieses Bauteil
     * kennt weder `Store` noch `favorite`.
     */
    const bauen = (auftrag) => {
        const knopf = document.createElement('button');
        knopf.type = 'button';
        let an = !!auftrag.an;
        knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
        markieren(knopf, auftrag);
        knopf.addEventListener('click', () => {
            an = !an;
            markieren(knopf, { an, ...(auftrag.name ? { name: auftrag.name } : {}) });
            auftrag.beiWechsel(an);
        });
        return knopf;
    };
    /**
     * Dasselbe als Zeichenkette — für die Stellen, die ihr Markup als Text
     * bauen (Notizhefte, Regal). `zusatz` kommt roh in den Knopf; wer dort
     * Nutzertext hineingibt, escapt ihn selbst (§19).
     */
    const html = (auftrag) => {
        const an = !!auftrag.an;
        const beschriftung = satz(an, auftrag.name);
        const sicher = String(beschriftung)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return '<button type="button" class="ru-merk' + (an ? ' ist-an' : '') +
            (auftrag.klasse ? ' ' + auftrag.klasse : '') + '" ' +
            'aria-pressed="' + (an ? 'true' : 'false') + '" ' +
            'title="' + sicher + '" aria-label="' + sicher + '" ' + (auftrag.zusatz || '') + '>' +
            '<svg class="ru-merk-band" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="' + BAND + '" fill="' + (an ? 'currentColor' : 'none') +
            '" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"></path></svg>' +
            '<i class="ru-merk-kreis" aria-hidden="true"></i>' +
            '<i class="ru-merk-funken" aria-hidden="true"></i>' +
            '<i class="ru-merk-punkt" aria-hidden="true"></i>' +
            '</button>';
    };
    return { BAND, satz, markieren, bauen, html };
})();
window.Merkzeichen = Merkzeichen;
