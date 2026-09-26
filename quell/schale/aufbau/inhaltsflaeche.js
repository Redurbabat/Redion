"use strict";
/* ============================================================================
 * schale/aufbau/inhaltsflaeche.js — der Inhalt selbst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/inhaltsflaeche.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/inhaltsflaeche.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Was unter dem Kopf steht: das Wiki-Verzeichnis, die Blöcke, die
 * Rückverweise — und der Streifen am rechten Rand, der die Überschriften
 * abbildet.
 *
 * WAS DARAN LEICHT SCHIEFGEHT
 *
 * 1. Eine leere Seite bekommt hier von selbst einen Textblock. Das sieht nach
 *    einer Nebensache aus und ist keine: ohne ihn gäbe es auf einer frischen
 *    Seite nichts, worin man tippen könnte, und der Titel wäre eine
 *    Sackgasse.
 *
 * 2. Der Streifen erscheint erst ab **drei** Überschriften. Darunter wäre er
 *    nur Zierde. Er hängt sich an `#main` und nicht an die Seite, weil er
 *    beim Scrollen stehen bleiben muss — deshalb muss er auch von Hand
 *    entfernt werden, bevor er neu entsteht.
 *
 * 3. Der Zähler für nummerierte Listen läuft über die ganze Seite und wird
 *    von jedem anderen Blocktyp zurückgesetzt. Wer die Schleife anfasst,
 *    fasst die Nummerierung an.
 * ==========================================================================*/
const Inhaltsflaeche = (() => {
    /* ------------------------------------------------------------------------
     * DIE TABELLE BLEIBT IN DER DEFINITION. Beim Umzug stand sie kurz als
     * eigene Konstante darüber — sauberer zu lesen, und `test87` wurde rot:
     * die Regel „jedes esc ersetzt auch das Anführungszeichen" sucht `&quot;`
     * INNERHALB der Definition, weil ein `esc` ohne `"`-Schutz jedes
     * `title="…"` zu einer Einstiegsluke macht.
     *
     * Die Regel hätte sich lockern lassen. Sie deckt vierzig Module ab, und
     * eines davon zur Ausnahme zu machen kostet mehr als die zwei Zeilen, die
     * es gespart hätte. Also bleibt die Tabelle, wo der Prüflauf sie sieht.
     * ----------------------------------------------------------------------*/
    const esc = (s) => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c));
    let gebunden = {};
    const braucht = (name) => (...args) => {
        const fn = gebunden[name];
        if (typeof fn !== 'function') {
            throw new Error('Die Inhaltsfläche wurde ohne „' + name + '" gebunden. ' +
                'Die Inhaltsfläche.binde({ … }) gehört an den Anfang von App.start(), vor das erste Zeichnen.');
        }
        return fn(...args);
    };
    const binde = (teile) => {
        gebunden = Object.assign({}, gebunden, teile || {});
    };
    const aktuelleSeite = braucht('aktuelleSeite');
    /* ------------------------------------------------------------------------
     * INHALTS-STREIFEN AM RECHTEN RAND
     * ------------------------------------------------------------------------
     * Notion zeigt neben jeder längeren Seite ein paar kurze Striche — einen
     * je Überschrift. Wer darüberfährt, sieht die Namen; ein Klick springt hin.
     * Ab drei Überschriften lohnt es sich, darunter wäre es nur Zierde.
     * ----------------------------------------------------------------------*/
    const streifenZeichnen = () => {
        const seiteId = aktuelleSeite();
        document.getElementById('rand-toc')?.remove();
        const seite = seiteId ? Store.getBlock(seiteId) : null;
        if (!seite)
            return;
        /* Welche Blockarten Überschriften sind, sagt das Register — hier stand
           ['h1','h2','h3'] und damit eine Liste ohne die Toggle-Überschriften.
           Eine Seite, die mit einklappbaren Überschriften gegliedert ist, bekam
           deshalb keinen Gliederungsstreifen, obwohl das Inhaltsverzeichnis im
           Editor sie sehr wohl auflistete. */
        const stufen = (typeof Register !== 'undefined' && Register.bloecke?.ueberschriften)
            ? Register.bloecke.ueberschriften()
            : { h1: 1, h2: 2, h3: 3 };
        /* WAS NICHT IM TEXT STEHT, GEHÖRT NICHT IN SEINE GLIEDERUNG (E691).
           Der Streifen ist ein Bauteil der TEXTansicht: er zeigt, wo man in der
           rollenden Seite ist. Eine Überschrift, die auf „nur Fläche" steht,
           wird dort nicht gezeichnet — ein Strich dafür führte zu einer Stelle,
           die es nicht gibt. Gefunden hat das ein Leser beim Nachsehen, wer
           ausser der Inhaltsfläche noch die Kinder einer Seite liest. */
        const zeigtIn = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.zeigtIn : () => true;
        const kopfzeilen = Store.childrenOf(seite.id)
            .filter((b) => stufen[b.type] && (b.text || '').trim() && zeigtIn(b, 'seite'));
        if (kopfzeilen.length < 3)
            return;
        /* `#main` und `#scroll` gehören zur Schale. Fehlt eines, wird hier kein
           Streifen gezeichnet — vorher warf `appendChild` auf `null`, und zwar
           aus einer Funktion heraus, die nur schmückt. */
        const main = document.getElementById('main');
        const scroll = document.getElementById('scroll');
        if (!main || !scroll)
            return;
        const d = document.createElement('div');
        d.id = 'rand-toc';
        d.innerHTML = kopfzeilen.map((b) => `<button data-bid="${b.id}" class="rt-${b.type}" title="${esc(b.text)}">` +
            `<i></i><span>${esc(b.text)}</span></button>`).join('');
        main.appendChild(d);
        d.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const b = ziel?.closest('[data-bid]');
            if (!b)
                return;
            const el = document.querySelector(`[data-bid="${b.dataset['bid']}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        /* Der Strich, bei dem man gerade steht, wird hervorgehoben. */
        const mitlaufen = () => {
            if (!document.body.contains(d)) {
                scroll.removeEventListener('scroll', mitlaufen);
                return;
            }
            let jetzt = null;
            kopfzeilen.forEach((b) => {
                const el = document.querySelector(`.blk[data-bid="${b.id}"]`);
                if (el && el.getBoundingClientRect().top < 140)
                    jetzt = b.id;
            });
            d.querySelectorAll('button').forEach(x => x.classList.toggle('jetzt', x.dataset['bid'] === jetzt));
        };
        scroll.addEventListener('scroll', mitlaufen, { passive: true });
        mitlaufen();
    };
    /* Der Text, der dasteht, wenn gar keine Seite offen ist. */
    const leer = (wrap) => {
        wrap.innerHTML =
            '<div style="padding:22vh 0; text-align:center; color:var(--text-faint)">' +
                '<div style="font-size:44px; margin-bottom:14px">📓</div>' +
                '<div style="font-size:17px; margin-bottom:6px">Noch keine Seite geöffnet</div>' +
                '<div style="font-size:14px">Links auf <b>+</b> klicken oder <b>Strg + N</b> drücken</div></div>';
    };
    /**
     * Wiki-Verzeichnis, Blöcke, Rückverweise — in dieser Folge.
     *
     * @param wo Für welche Seite des Umschalters gezeichnet wird (E691):
     *        `'seite'` ist der Text (Vorgabe, also alle bisherigen Aufrufer),
     *        `'flaeche'` der Seitenkasten auf der Leinwand. Ein Block kann in
     *        einem von beiden stehen, in beiden oder — wenn er seinen eigenen
     *        Kasten hat — im Kasten gar nicht mehr.
     */
    const zeichne = (wrap, p, wo = 'seite') => {
        /* Wiki-Verzeichnis */
        if (p.wiki)
            Werkzeuge.wikiIndex(p, wrap);
        /* Blöcke */
        const kinder = Store.childrenOf(p.id);
        /* DIESE PRÜFUNG STEHT VOR DEM FILTERN, UND DAS IST KEIN ZUFALL (E691).
           Sie legt einen leeren Textblock an, wenn eine Seite gar keine Kinder
           hat. Stünde sie NACH dem Filtern, legte sie bei jeder Zeichnung einen
           neuen an, sobald alle Blöcke einer Seite auf „nur Fläche" stehen —
           eine Seite, die sich beim Ansehen selbst vollschreibt. Gezählt wird
           also, was da IST, nicht, was man gerade sieht (§9). */
        if (!kinder.length && !p.gesperrt) {
            const b = Store.addBlock(p.id, 'text');
            kinder.push(b);
        }
        /* WO ERSCHEINT DIESER BLOCK? Die Frage wird einmal im Register
           beantwortet (§8, `Register.seitenansichten.zeigtIn`), nicht hier.
           Dazu die eine Regel, die nur die Fläche betrifft: ein Block mit
           eigenem Ort liegt dort als eigener Kasten und nicht noch einmal im
           Seitenkasten. */
        const zeigtIn = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.zeigtIn
            : () => true;
        /* EIN UNLESBARER ORT IST KEIN ORT (§9) — und die Frage wird EINMAL
           beantwortet, im Register, nicht hier und nochmal auf der Fläche (§8).
           Antworteten die zwei Stellen je verschieden, wäre ein Block nirgends:
           aus dem Seitenkasten gefiltert und ohne eigenen Kasten. */
        const ortLesbar = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.ortLesbar
            : (o) => !!o;
        const sichtbar = kinder.filter((b) => zeigtIn(b, wo) && !(wo === 'flaeche' && ortLesbar(b.flaecheOrt)));
        let nr = 0;
        sichtbar.forEach((b) => {
            if (b.type === 'number') {
                nr++;
                b.nr = nr;
            }
            else
                nr = 0;
            wrap.appendChild(Blocks.render(b));
        });
        /* Rückverweise unter der Seite — aber nicht im Kasten auf der Leinwand.
           Dort sind sie kein Fuss der Seite, sondern eine Liste mitten im Bild,
           und sie machen den Kasten um ihre Höhe länger, ohne etwas zu zeigen,
           was auf eine Fläche gehört. AFFiNE zeigt sie im Edgeless ebenfalls
           nicht. */
        if (!p.ohneRueck && wo === 'seite')
            Links.fusszeile(p, wrap);
    };
    return { binde, zeichne, leer, streifen: streifenZeichnen };
})();
window.Inhaltsflaeche = Inhaltsflaeche;
