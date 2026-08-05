"use strict";
/* ============================================================================
 * schale/ueberlagerung/hinweis.js — Toast und Banner
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/hinweis.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/hinweis.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Zwei Arten, etwas zu sagen, und sie werden gern verwechselt:
 *
 *   **Toast** — verschwindet von selbst. Für Bestätigungen: „Gespeichert",
 *   „3 Zeilen gelöscht". Wer ihn verpasst, hat nichts verpasst.
 *
 *   **Banner** — bleibt, bis jemand ihn wegklickt. Für Dinge, die man wissen
 *   muss: „Der Speicher ist hier gesperrt", „Der Schlüssel passt nicht".
 *
 * Ein Toast für etwas Wichtiges ist der häufigste Fehler in Oberflächen: die
 * Meldung erscheint, während man woanders hinsieht, und ist weg, bevor man
 * sie liest.
 * ==========================================================================*/
const Hinweis = (() => {
    let toastTimer;
    /* ------------------------------------------------------------------------
     * EIN FUND DES UMZUGS. Hier stand `document.getElementById('toast')` und
     * danach sofort `t.textContent = text` — ohne nachzusehen, ob es das
     * Element gibt.
     *
     * Meistens gibt es das. Aber `UI.toast` wird aus dreihundert Stellen
     * gerufen, auch aus welchen, die vor dem Aufbau der Schale laufen oder
     * wenn sie gar nicht da ist. Dort wirft die Zeile — und der Aufrufer
     * bricht mitten in seiner Arbeit ab, obwohl er nur etwas SAGEN wollte.
     *
     * Eine Meldung darf niemals das kaputtmachen, worüber sie berichtet.
     * Fehlt das Element, geht die Meldung in die Konsole und der Griff, den
     * `toast` zurückgibt, tut nichts — statt beim ersten Anfassen zu werfen.
     * ----------------------------------------------------------------------*/
    const toast = (text, dauer) => {
        const t = document.getElementById('toast');
        if (!t) {
            console.info('[Hinweis]', String(text));
            return { textContent: String(text ?? ''), remove() { } };
        }
        t.textContent = String(text ?? '');
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), dauer || 2600);
        return {
            set textContent(v) { if (t.classList.contains('show'))
                t.textContent = v; },
            get textContent() { return t.textContent || ''; },
            remove() { clearTimeout(toastTimer); t.classList.remove('show'); }
        };
    };
    /** Die Emoji-Auswahl mit Suchfeld liegt in notion.js. */
    const banner = (text, art = 'warn') => {
        document.getElementById('banner')?.remove();
        const d = document.createElement('div');
        d.id = 'banner';
        d.className = 'banner ' + art;
        d.innerHTML = `<span>${String(text)}</span><button title="Ausblenden">✕</button>`;
        d.querySelector('button')?.addEventListener('click', () => d.remove());
        document.body.appendChild(d);
        return d;
    };
    /* ==========================================================================
     * DER LEERE ZUSTAND
     * --------------------------------------------------------------------------
     * Ein Bereich ohne Inhalt darf nicht einfach leer sein. Leer heisst für den,
     * der davorsitzt: „hier ist nichts" — und er weiss nicht, ob das an ihm
     * liegt, an der App oder daran, dass er noch nichts angelegt hat.
     *
     * Drei Sätze beantworten das:
     *   ÜBERSCHRIFT   was hier steht, wenn etwas hier steht
     *   TEXT          warum gerade nichts da ist
     *   HANDLUNG      was man jetzt tun kann — als Verweis, nicht als Knopf
     *
     * Die Handlung ist absichtlich ein blauer Verweis und kein voller Knopf:
     * ein leerer Bereich ist keine Aufforderung, sondern ein Angebot. Ein
     * grosser bunter Knopf mitten auf einem leeren Bildschirm drängt.
     *
     * Diese Form stand schon im Posteingang, dort abgeschrieben. Jetzt steht
     * sie einmal hier — die Fassungen liefen sonst auseinander, und drei
     * verschiedene leere Zustände sind schlimmer als einer, der überall gleich
     * aussieht.
     * ========================================================================*/
    const leer = (o) => '<div class="pe-leer">' +
        `<div class="pe-ico">${o.zeichen}</div>` +
        `<div class="pe-gross">${o.gross}</div>` +
        `<div class="pe-klein">${o.klein}</div>` +
        (o.handlung
            ? `<button class="pe-link"${o.daten ? ' ' + o.daten : ''}>${o.handlung}</button>`
            : '') +
        '</div>';
    return { toast, banner, leer };
})();
window.Hinweis = Hinweis;
