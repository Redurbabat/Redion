"use strict";
/* ============================================================================
 * schale/bedienung/staffelei.ts — hell und dunkel als Bild auf einer Leinwand
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/staffelei.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redion hat acht Farbschemata, und jedes trägt einen Grundton:
 * `light` oder `dark`. Zwischen den beiden GRUNDTÖNEN wechselt man heute
 * an zwei Stellen — dem kleinen Knopf im Studio-Kopf und einer Wahlzeile
 * in den Einstellungen. Beide sagen es mit einem Wort und einem Fleck.
 *
 * Die Staffelei sagt es mit dem Bild selbst: links steht die Leinwand als
 * Bleistiftskizze (Tag), ein Pinsel fährt hinüber und malt sie in Nacht.
 * Das ist kein Schmuck neben der Sache — es IST die Sache. Wer hier
 * umschaltet, sieht vorher, was er bekommt.
 *
 * WOHER. Redurs Vorgabe `.theme-switch` vom 6. September 2026
 * (`ui-reserve/vorgaben/loader-sammlung.css`). Sie malt Sonne, Berge und
 * Wasser von der Skizze ins Bunte. Redion malt dieselbe Landschaft von
 * TAG auf NACHT, weil das die Bedeutung ist, die hier daranhängt: ein
 * rosa Sonnenuntergang wäre hübsch und hiesse nichts.
 *
 * WAS ES NICHT TUT. Es wählt kein Schema aus den acht — es wechselt den
 * GRUNDTON und überlässt die Wahl darunter der Kartenreihe, die es schon
 * gibt (§8). Welches Schema bei einem Wechsel kommt, entscheidet dieselbe
 * Regel wie im Studio-Kopf: das zuletzt benutzte dieses Grundtons.
 *
 * `role="switch"` und `aria-checked`, nicht `<input type="checkbox">`:
 * dasselbe wie bei der Ordnerkarte (E459) — ein Umschalter ist eine
 * Aussage über an und aus, kein Formularwert (§38). Der Zustand steht
 * ausserdem als WORT daneben, nicht nur im Bild.
 * ==========================================================================*/
const Staffelei = (() => {
    const el = (tag, klasse, eltern) => {
        const e = document.createElement(tag);
        e.className = klasse;
        if (eltern)
            eltern.append(e);
        return e;
    };
    /* Die Landschaft steht zweimal da: einmal als Skizze, einmal gemalt.
       Beide haben DIESELBEN Teile an denselben Stellen — nur die Farben
       unterscheiden sich. Sonst wäre der Wechsel ein Szenenwechsel und
       kein Anmalen. */
    const landschaft = (klasse) => {
        const s = el('div', klasse);
        el('i', 'ru-staff-himmel', s);
        el('i', 'ru-staff-gestirn', s);
        for (const nr of ['ru-staff-berg-1', 'ru-staff-berg-2', 'ru-staff-berg-3'])
            el('i', 'ru-staff-berg ' + nr, s);
        const wasser = el('i', 'ru-staff-wasser', s);
        for (const nr of ['ru-staff-welle-1', 'ru-staff-welle-2', 'ru-staff-welle-3'])
            el('i', 'ru-staff-welle ' + nr, wasser);
        return s;
    };
    const pinsel = () => {
        const p = el('div', 'ru-staff-pinsel');
        p.setAttribute('aria-hidden', 'true');
        el('i', 'ru-staff-stiel', p);
        el('i', 'ru-staff-zwinge', p);
        el('i', 'ru-staff-haare', p);
        return p;
    };
    const bauen = (auftrag) => {
        let hell = !!auftrag.hell;
        const knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.className = 'ru-staff';
        knopf.setAttribute('role', 'switch');
        const rahmen = el('div', 'ru-staff-rahmen', knopf);
        rahmen.setAttribute('aria-hidden', 'true');
        /* Die Skizze liegt unten, das gemalte Bild darüber in einer Blende,
           deren Breite von 0 auf 100 % wächst. So wird gemalt statt getauscht. */
        rahmen.append(landschaft('ru-staff-skizze'));
        const blende = el('div', 'ru-staff-blende', rahmen);
        blende.append(landschaft('ru-staff-bild'));
        rahmen.append(pinsel());
        const wort = el('span', 'ru-staff-wort', knopf);
        const stellen = () => {
            knopf.dataset['hell'] = hell ? 'ja' : 'nein';
            /* `aria-checked=true` heisst hier „dunkel an" — der Schalter heisst
               „Dunkles Schema", nicht „Helligkeit". Der Vorlesename sagt es. */
            knopf.setAttribute('aria-checked', hell ? 'false' : 'true');
            knopf.setAttribute('aria-label', 'Dunkles Schema' + (hell ? ' einschalten' : ' ausschalten'));
            knopf.title = hell ? 'Zum dunklen Schema wechseln' : 'Zum hellen Schema wechseln';
            /* DAS WORT SAGT DEN ZUSTAND, nicht die Handlung — sonst liest man
               auf einem Bild „Dunkel" und weiss nicht, ob das gerade gilt oder
               gleich passiert. */
            wort.textContent = hell ? 'Hell' : 'Dunkel';
        };
        knopf.addEventListener('click', () => {
            hell = !hell;
            stellen();
            auftrag.beiWechsel(hell);
        });
        /* DIE STAFFELEI FOLGT DEM DOKUMENT. Wird der Grundton anderswo
           gewechselt — Schema-Karte, Studio-Kopf, ein zweiter Tab —, sagt
           `data-theme` am Wurzelelement es zuerst. Ein Umschalter, der dann
           noch „Hell" zeigt, während die Seite dunkel ist, behauptet das
           Falsche; test435 §1 hat genau diesen Stand gefunden. Der Beobachter
           räumt sich weg, sobald die Staffelei nicht mehr im Baum hängt. */
        const beobachter = new MutationObserver(() => {
            if (!knopf.isConnected) {
                beobachter.disconnect();
                return;
            }
            const jetztHell = document.documentElement.dataset['theme'] === 'light';
            if (jetztHell !== hell) {
                hell = jetztHell;
                stellen();
            }
        });
        beobachter.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        stellen();
        return {
            element: knopf,
            setzen: (neu) => { hell = !!neu; stellen(); },
            hell: () => hell
        };
    };
    return { bauen };
})();
window.Staffelei = Staffelei;
