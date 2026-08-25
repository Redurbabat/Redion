"use strict";
/* ============================================================================
 * apps/schreiben/auswahlleiste/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/editor/ansicht/auswahlleiste.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/editor/ansicht/auswahlleiste.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/
const Auswahl = (() => {
    let leiste = null;
    let letzteFarbe = 'yellow';
    const weg = () => { if (leiste) {
        leiste.remove();
        leiste = null;
    } };
    /* ------------------------------------------------------------------------
     * `getSelection()` gibt `Selection | null` — in einem abgetrennten Dokument
     * gibt es keine. Vorher stand hier siebenmal `s.rangeCount` ohne Nachsehen.
     * Das ist nicht theoretisch: die Auswahlleiste läuft auch, während eine
     * Seite neu gezeichnet wird.
     * ----------------------------------------------------------------------*/
    const auswahl = () => {
        const s = getSelection();
        return s && s.rangeCount ? s : null;
    };
    const markierterBlock = () => {
        const s = auswahl();
        if (!s)
            return null;
        const start = s.getRangeAt(0).startContainer;
        const n = start.nodeType === 3
            ? start.parentElement
            : (start instanceof Element ? start : null);
        const blk = n?.closest('.blk');
        return blk ? Store.getBlock(blk.dataset['bid']) : null;
    };
    /** Textposition innerhalb des sichtbaren Blockinhalts. Bei schlichtem Text
        ist sie auch die gespeicherte Position; bei gerendertem Markdown faellt
        der Lernweg bewusst auf die bisherige Textsuche zurueck. */
    const auswahlOffset = () => {
        const selection = auswahl();
        if (!selection)
            return -1;
        const range = selection.getRangeAt(0);
        const node = range.startContainer.nodeType === 3
            ? range.startContainer.parentElement : range.startContainer;
        const content = node?.closest('.ct');
        if (!content)
            return -1;
        try {
            const before = range.cloneRange();
            before.selectNodeContents(content);
            before.setEnd(range.startContainer, range.startOffset);
            return before.toString().length;
        }
        catch {
            return -1;
        }
    };
    /** Legt Marken um die Auswahl — genau wie Notions Strg + B. */
    const umschliesse = (marke) => {
        const txt = getSelection()?.toString() ?? '';
        if (!txt)
            return;
        const b = markierterBlock();
        if (!b)
            return;
        const neu = (b.text || '').replace(txt, marke + txt + marke);
        Store.updateBlock(b.id, { text: neu });
        App.zeichneSeite(b.id, 'ende');
        weg();
    };
    /**
     * Legt die markierte Stelle als Markdown-Link ab.
     *
     * Ein gemeinsamer Weg für die Auswahlleiste, Strg/Cmd+K und das Einfügen
     * einer Adresse. Vorher versprach die Kürzelliste Strg+K, tatsächlich
     * öffnete aber der globale Griff die Suche.
     */
    const linkSetzen = (adresse) => {
        const text = getSelection()?.toString() ?? '';
        if (!text)
            return false;
        const bl = markierterBlock();
        if (!bl)
            return false;
        const url = adresse ?? prompt('Adresse des Links', 'https://') ?? '';
        if (!url || url === 'https://')
            return false;
        Store.updateBlock(bl.id, { text: (bl.text || '').replace(text, `[${text}](${url})`) });
        App.zeichneSeite(bl.id, 'ende');
        weg();
        return true;
    };
    const zeigen = () => {
        const s = auswahl();
        const txt = s?.toString().trim();
        if (!s || !txt) {
            weg();
            return;
        }
        const bereich = s.getRangeAt(0);
        const start = bereich.startContainer.parentElement;
        if (!start || !start.closest('#page') || !start.closest('.ct')) {
            weg();
            return;
        }
        weg();
        const r = bereich.getBoundingClientRect();
        leiste = document.createElement('div');
        leiste.className = 'auswahlleiste';
        leiste.innerHTML =
            '<button data-a="ki" class="ki">✨ KI</button>' +
                '<span class="tr"></span>' +
                '<button data-a="turn">Umwandeln ▾</button>' +
                '<span class="tr"></span>' +
                '<button data-a="b" title="Fett — Strg B"><b>B</b></button>' +
                '<button data-a="i" title="Kursiv — Strg I"><i>I</i></button>' +
                '<button data-a="u" title="Unterstrichen — Strg U"><u>U</u></button>' +
                '<button data-a="s" title="Durchgestrichen — Strg Shift S"><s>S</s></button>' +
                '<button data-a="c" title="Code — Strg E">&lt;/&gt;</button>' +
                '<button data-a="m" title="Formel">∑</button>' +
                '<button data-a="cloze" title="Aus der Auswahl eine Lückenkarte anlegen">▣ Lücke</button>' +
                '<button data-a="link" title="Link — Strg K">🔗</button>' +
                '<span class="tr"></span>' +
                '<button data-a="komm" title="Kommentar — Strg Shift M">💬</button>' +
                '<button data-a="farbe" title="Farbe">🎨 ▾</button>';
        document.body.appendChild(leiste);
        const hoehe = leiste.getBoundingClientRect();
        leiste.style.left = Math.max(8, Math.min(r.left, innerWidth - hoehe.width - 10)) + 'px';
        leiste.style.top = Math.max(8, r.top - hoehe.height - 8) + 'px';
        leiste.addEventListener('mousedown', e => e.preventDefault());
        leiste.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const b = ziel?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset['a'];
            const block = markierterBlock();
            const text = getSelection()?.toString() ?? '';
            const textOffset = auswahlOffset();
            if (a === 'b')
                return umschliesse('**');
            if (a === 'i')
                return umschliesse('*');
            if (a === 'u')
                return umschliesse('__');
            if (a === 's')
                return umschliesse('~~');
            if (a === 'c')
                return umschliesse('`');
            if (a === 'm')
                return umschliesse('$');
            if (a === 'cloze') {
                weg();
                const learning = window.Learning;
                if (block && learning?.clozeFromSelection)
                    learning.clozeFromSelection(block, text, textOffset);
                else
                    UI.toast('Die Lernwerkzeuge sind noch nicht geladen.');
                return;
            }
            if (a === 'link') {
                linkSetzen();
                return;
            }
            if (a === 'ki') {
                weg();
                App.kiPanel(true);
                KI.frageMitAuswahl(text);
                return;
            }
            if (a === 'komm') {
                weg();
                if (block)
                    Kommentare.neu(block, text);
                return;
            }
            if (a === 'turn') {
                const rr = b.getBoundingClientRect();
                weg();
                if (block)
                    Blocks.umwandelnMenue(rr, block);
                return;
            }
            if (a === 'farbe') {
                const rr = b.getBoundingClientRect();
                const FARBEN = [['default', 'Standard'], ['gray', 'Grau'], ['brown', 'Braun'], ['orange', 'Orange'],
                    ['yellow', 'Gelb'], ['green', 'Grün'], ['blue', 'Blau'], ['purple', 'Lila'], ['pink', 'Pink'], ['red', 'Rot']];
                const m = UI.menu('<div class="grp">Textfarbe</div><div class="swatches">' +
                    FARBEN.map(([f, n]) => `<button data-c="${f}" title="${n}" style="background:var(--c-${f})"></button>`).join('') +
                    '</div><div class="grp">Hintergrund</div><div class="swatches">' +
                    FARBEN.slice(1).map(([f, n]) => `<button data-c="bg-${f}" title="${n}" style="background:var(--b-${f})"></button>`).join('') +
                    '</div>', rr.left, rr.bottom + 6);
                m.addEventListener('click', (ev) => {
                    const zielC = ev.target instanceof Element ? ev.target : null;
                    const c = zielC?.closest('button[data-c]');
                    const farbe = c?.dataset['c'];
                    if (!farbe || !block)
                        return;
                    letzteFarbe = farbe;
                    Store.updateBlock(block.id, { color: farbe === 'default' ? '' : farbe });
                    m.remove();
                    weg();
                    App.zeichneSeite();
                });
                return;
            }
        });
    };
    const letzteFarbeAnwenden = () => {
        const b = markierterBlock();
        if (!b)
            return;
        Store.updateBlock(b.id, { color: letzteFarbe });
        App.zeichneSeite();
    };
    /** Das Element, auf das geklickt wurde — oder nichts. */
    const elementVon = (e) => e.target instanceof Element ? e.target : null;
    const start = () => {
        document.addEventListener('mouseup', e => {
            const t = elementVon(e);
            if (t?.closest('.auswahlleiste') || t?.closest('.menu'))
                return;
            setTimeout(zeigen, 10);
        });
        document.addEventListener('keyup', e => {
            if (e.shiftKey && e.key.startsWith('Arrow'))
                setTimeout(zeigen, 10);
        });
        document.addEventListener('mousedown', e => {
            if (!elementVon(e)?.closest('.auswahlleiste'))
                weg();
        });
        document.addEventListener('scroll', weg, true);
    };
    return { start, zeigen, weg, umschliesse, linkSetzen, letzteFarbeAnwenden };
})();
window.Auswahl = Auswahl;
/* ==========================================================================
 * 3. ERWÄHNUNGEN UND EMOJIS
 * --------------------------------------------------------------------------
 * @ für Seite, Datum oder Person · : für Emoji — beides mitten im Text.
 * ========================================================================*/
