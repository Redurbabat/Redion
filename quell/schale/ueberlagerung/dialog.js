"use strict";
/* ============================================================================
 * schale/ueberlagerung/dialog.js — die Frage mit einem Eingabefeld
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/dialog.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/ueberlagerung/dialog.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Ersetzt `prompt()`. Nicht aus Schönheit: das eingebaute `prompt` hält den
 * ganzen Browser an, sieht in jedem System anders aus, lässt sich nicht mit
 * Esc abbrechen, ohne dass Text verlorengeht — und in mancher Umgebung ist es
 * abgeschaltet, dann steht die App ohne Erklärung.
 *
 * Gibt ein Versprechen zurück: der Text, oder null beim Abbrechen. Null und
 * leerer Text sind ausdrücklich verschieden — „nichts eingegeben" ist eine
 * andere Antwort als „abgebrochen".
 * ==========================================================================*/
const Dialog = (() => {
    /* ==========================================================================
     * ESCAPEN, EINMAL, GANZ OBEN
     * --------------------------------------------------------------------------
     * `wahl` hatte diese Funktion in sich, `frage` hatte sie nicht — und
     * `frage` setzte ihren `titel` roh ins `innerHTML`. Das war jahrelang
     * folgenlos, weil jeder Aufrufer eine feste Zeichenkette übergab
     * („Blatt umbenennen"). Mit E110 kam der erste Aufrufer mit FREMDEM Text:
     * dem Dateinamen eines PDFs.
     *
     * Nachgestellt und bestätigt: eine Datei namens
     *
     *     <img src=x onerror="…">.pdf
     *
     * liess den Code laufen. Es genügt, sie hereinzuziehen. §19 verbietet
     * genau das, und die Lücke sass nicht im Aufrufer, sondern hier — also
     * wird sie hier geschlossen, für alle Aufrufer auf einmal (§34, E112).
     *
     * Fünf Ersetzungen, wie in CLAUDE.md §19 aufgeschrieben. `'` gehört dazu,
     * auch wenn es im Elementinhalt harmlos ist: derselbe Text landet
     * anderswo in einem Attribut, und eine Escape-Funktion, die je nach
     * Fundort etwas anderes tut, ist keine.
     * ========================================================================*/
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    /**
     * Eine Frage mit einem Eingabefeld.
     *
     * `art: 'passwort'` macht daraus ein Passwortfeld: der Text wird nicht
     * angezeigt, der Browser bietet keine Vervollständigung an, und er merkt
     * ihn sich auch nicht. Ein PDF-Passwort gehört niemandem ausser dem
     * Menschen davor — es wird weitergereicht und nirgends abgelegt (E110).
     */
    const frageAlt = (titel, vorgabe = '', art = 'text') => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const feldArt = art === 'passwort'
            ? 'type="password" autocomplete="off" spellcheck="false"' : '';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                `<div class="fh">${esc(titel)}</div>` +
                `<div style="padding:16px 18px"><input id="fq" ${feldArt} ` +
                `value="${esc(vorgabe)}" ` +
                'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
                'border-radius:8px; outline:none; font-size:15px"></div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#fq');
        const fertig = (wert) => { o.remove(); ok(wert); };
        /* Ohne Eingabefeld gäbe es nichts zu fragen — dann lieber gleich
           abbrechen als eine Überlagerung stehenlassen, die nichts kann. */
        if (!inp) {
            fertig(null);
            return;
        }
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (ziel?.closest('[data-a="ok"]'))
                fertig(inp.value);
            else if (ziel?.closest('[data-a="zu"]') || e.target === o)
                fertig(null);
        });
        inp.addEventListener('keydown', e => {
            /* `preventDefault` (E710, Durchsicht 3. Oktober): sonst fällt dasselbe
               Enter als Tastendruck (`keypress`) auf den Knopf, dem Fokus nach dem
               Schliessen seinen Fokus zurückgibt — und der stellt die Frage sofort
               noch einmal (gemessen in `test587` §11: Antwort verloren, Fenster
               wieder offen). Das Fenster des Kits tut das schon. */
            if (e.key === 'Enter') {
                e.preventDefault();
                fertig(inp.value);
            }
            if (e.key === 'Escape')
                fertig(null);
        });
        inp.focus();
        inp.select();
    });
    /**
     * Die Frage mit mehreren Antworten — für Entscheidungen, die niemand
     * stillschweigend treffen darf.
     *
     * WARUM ES DIESE FUNKTION GIBT. `CLAUDE.md` sagt: nichts löschen ohne
     * Rückfrage. Bis hierher gab es dafür kein Werkzeug ausser `confirm()` —
     * und das kennt nur ja und nein. Eine Entscheidung wie „ersetzen oder
     * dazulegen" ist aber keine Ja-Nein-Frage: beide Antworten sind richtig,
     * je nachdem was der Mensch vorhat, und die falsche kostet Daten.
     *
     * Deshalb bekommt jeder Knopf einen eigenen **Hinweis** darunter. Wer
     * „Ersetzen" liest, soll nicht raten müssen, was mit dem übrigen Bestand
     * geschieht — es steht daneben.
     *
     * Gibt die `id` des gewählten Knopfes zurück, `''` beim Abbruch — und
     * nicht `null`: eine Kennung ist immer eine Zeichenkette, und wer
     * `if (!wahl) return;` schreibt, deckt damit beide Fälle.
     */
    const wahlAlt = ({ titel, text, knoepfe = [] }) => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            /* `wahl` STATT NUR `finder` (E486). Eine Wahl kann viele Knöpfe haben —
               die Farbsätze bringen bis zu elf. `.finder` schneidet ab
               (`overflow:hidden`) und hat am Rechner keine Höhengrenze: gemessen
               wurde das Fenster 1019 px hoch in einem 900 px hohen Bildschirm, und
               der LETZTE Knopf war nicht anklickbar. Ohne Hinweis, dass da noch
               etwas ist. Die eigene Klasse gibt dieser einen Form eine Grenze und
               eine Rolle; jeder andere `.finder` bleibt, wie er war. */
            '<div class="finder wahl" style="width:min(540px,94vw)">' +
                `<div class="fh">${esc(titel)}</div>` +
                '<div style="padding:16px 18px; font-size:14px; line-height:1.6; white-space:pre-wrap">' +
                esc(text) + '</div>' +
                '<div class="wahl-knoepfe">' +
                knoepfe.map((k, i) => `<button data-w="${esc(k.id)}"${i === 0 ? ' class="prim"' : ''}>` +
                    `<b>${esc(k.text)}</b>` +
                    (k.hinweis ? `<span>${esc(k.hinweis)}</span>` : '') +
                    '</button>').join('') +
                '</div></div>';
        document.body.appendChild(o);
        const fertig = (wert) => { o.remove(); document.removeEventListener('keydown', beiTaste); ok(wert); };
        const beiTaste = (e) => { if (e.key === 'Escape')
            fertig(''); };
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            const k = ziel?.closest('[data-w]');
            if (k) {
                fertig(k.dataset['w'] ?? '');
                return;
            }
            /* Auf den Hintergrund klicken heisst abbrechen — nicht die erste
               Antwort wählen. Bei einer Frage, die Daten kostet, ist die
               versehentliche Wahl das, was es zu verhindern gilt. */
            if (e.target === o)
                fertig('');
        });
        document.addEventListener('keydown', beiTaste);
        o.querySelector('[data-w]')?.focus();
    });
    /**
     * Die mehrzeilige Frage — für Texte, die länger als eine Zeile sind:
     * Haftnotizen (E267), später vielleicht die Whiteboard-Notiz, deren
     * `prompt()` in LUECKEN.md schon als Schwäche steht. Enter macht eine
     * neue Zeile; übernehmen heisst Strg+Enter oder der Knopf.
     */
    const mehrzeiligAlt = (titel, vorgabe = '') => new Promise(ok => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                `<div class="fh">${esc(titel)}</div>` +
                '<div style="padding:16px 18px"><textarea id="fq" rows="4" ' +
                'style="width:100%; padding:10px 12px; background:var(--bg-input); border:1px solid var(--line); ' +
                'border-radius:8px; outline:none; font-size:15px; font-family:inherit; resize:vertical">' +
                `${esc(vorgabe)}</textarea>` +
                '<p style="margin:6px 0 0; font-size:11.5px; color:var(--text-faint)">' +
                'Übernehmen mit Strg + Enter</p></div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
                '<button data-a="zu">Abbrechen</button></div></div>';
        document.body.appendChild(o);
        const feld = o.querySelector('#fq');
        const fertig = (wert) => { o.remove(); ok(wert); };
        if (!feld) {
            fertig(null);
            return;
        }
        o.addEventListener('click', e => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (ziel?.closest('[data-a="ok"]'))
                fertig(feld.value);
            else if (ziel?.closest('[data-a="zu"]') || e.target === o)
                fertig(null);
        });
        feld.addEventListener('keydown', e => {
            /* `preventDefault` wie oben bei `frageAlt` (E710, Durchsicht). */
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                fertig(feld.value);
            }
            if (e.key === 'Escape')
                fertig(null);
        });
        feld.focus();
        feld.select();
    });
    /* ==========================================================================
     * DAS FENSTER DES TOUCH KITS (E710, Stufe 1b von E699)
     * --------------------------------------------------------------------------
     * Redur, 27. September 2026, 21:49 UTC: „was du beim touckit gebaut hast ich
     * will alles so haben mit redion passende inhalten" — und 22:10 UTC: „…
     * ohne eine funktione löschen bessere ordnungen bessere übergagnge
     * besssere efeckten , bessere oberfläsche alles".
     *
     * Dieselben drei Fragen, dieselben Antworten, derselbe Auslöser — nur die
     * Ansicht ist jetzt der Dialog des Kits (`src/islands/dialog.tsx`): er
     * federt in der Mitte herein, statt als Kasten oben am Telefon zu kleben,
     * trägt Redions Glas und blendet beim Schliessen aus, statt zu
     * verschwinden. Am Telefon kommt eine Wahl ab drei Antworten als
     * Aktionsblatt von unten.
     *
     * DER TRÄGER IST EIN `.overlay`, mit `data-insel-traeger`. Dadurch sehen
     * Fokus (inert), der gemeinsame Escape-Griff und jeder Prüflauf, der nach
     * `.overlay #fq` oder `[data-w]` sucht, ein offenes Fenster — wie immer.
     * Das Kit zeichnet seine Ebene DARIN (`container`): für beide Systeme gibt
     * es genau eine oberste Ebene. Fokus und Tab-Falle überlässt Fokus dem Kit
     * (fokus.ts), Escape der gemeinsame Griff (schale.ts) — beide E710.
     *
     * DAS BISHERIGE FENSTER BLEIBT — als Rückweg, nicht als zweiter Katalog:
     * kommen die Inseln nicht (kein React geladen, eine Datei fehlt, beim
     * allerersten Besuch über ein langsames Netz länger als `WARTEN_MS`), zeigt
     * `…Alt` dieselbe Frage wie bisher. Keine Frage bleibt je unbeantwortet
     * stehen, weil etwas nicht lud (§43: nichts geht verloren).
     * ========================================================================*/
    /** So lange wartet die erste Frage höchstens auf die Inseln. */
    const WARTEN_MS = 1500;
    /** Die Inseln, wenn sie da sind oder rechtzeitig kommen — sonst `null` (dann der Rückweg). */
    const inselnHolen = () => {
        if (typeof Inseln === 'undefined')
            return Promise.resolve(null);
        if (Inseln.geladen() && window.RedionIslands)
            return Promise.resolve(window.RedionIslands);
        return new Promise(ok => {
            let entschieden = false;
            const zeit = setTimeout(() => { if (!entschieden) {
                entschieden = true;
                ok(null);
            } }, WARTEN_MS);
            Inseln.bereit().then(api => { if (!entschieden) {
                entschieden = true;
                clearTimeout(zeit);
                ok(api);
            } }, (e) => {
                if (typeof Reporter !== 'undefined')
                    Reporter.warn('Dialog', 'Die Inseln kamen nicht — die Frage kommt im bisherigen Fenster: ' +
                        (e instanceof Error ? e.message : String(e)));
                if (!entschieden) {
                    entschieden = true;
                    clearTimeout(zeit);
                    ok(null);
                }
            });
        });
    };
    /** Am Telefon? Dieselbe Frage, die auch die Menüs stellen (≤ 760 px oder grober Zeiger). */
    const amTelefon = () => typeof Menue !== 'undefined' && Menue.amTelefon();
    /**
     * Eine Frage im Fenster des Kits. `abbruch` ist die Antwort, wenn das
     * Fenster ohne Wahl verschwindet — auch, wenn jemand den Träger von
     * aussen wegnimmt (dann wartet kein Aufrufer für immer).
     */
    const imKit = (api, daten, abbruch) => new Promise((ok, fehler) => {
        /* Woher die Frage kam — dorthin geht der Fokus zurück. Jetzt gelesen,
           bevor Fokus die Seite dahinter stilllegt. */
        const vorher = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const o = document.createElement('div');
        o.className = 'overlay';
        o.setAttribute('data-insel-traeger', 'offen');
        document.body.appendChild(o);
        let beantwortet = false;
        const waechter = new MutationObserver(() => { if (!o.isConnected)
            antwort(abbruch); });
        /* STOLPERT DIE INSEL BEIM ZEICHNEN (Durchsicht, 5. Oktober), fängt ihre
           Fehlergrenze den Fehler (main.tsx) und meldet ihn als
           `redion-insel-fehler`. Im Träger stand dann statt des Fensters nur der
           Fehlersatz der Grenze — unsichtbar über der ganzen Seite, alles
           darunter still, Escape liess den Träger stehen, und die Frage kam nie.
           Jetzt gilt dasselbe wie, wenn die Inseln gar nicht kommen: der Träger
           geht, und das bisherige Fenster fragt (`kitOderAlt`). Nur, wenn es
           DIESES Fenster getroffen hat — sein Träger trägt dann den Fehlersatz. */
        const beiInselFehler = (e) => {
            if (beantwortet || e.detail?.insel !== 'dialog')
                return;
            setTimeout(() => {
                if (beantwortet || !o.querySelector('[data-insel-fehler]'))
                    return;
                beantwortet = true;
                waechter.disconnect();
                removeEventListener('redion-insel-fehler', beiInselFehler);
                weg();
                if (typeof Fokus !== 'undefined')
                    Fokus.inertAktualisieren();
                if (vorher?.isConnected)
                    vorher.focus({ preventScroll: true });
                fehler(new Error('Das Fenster des Kits stolperte beim Zeichnen.'));
            }, 0);
        };
        addEventListener('redion-insel-fehler', beiInselFehler);
        const antwort = (wert) => {
            if (beantwortet)
                return;
            beantwortet = true;
            waechter.disconnect();
            removeEventListener('redion-insel-fehler', beiInselFehler);
            /* Kein Fenster mehr für Fokus, Escape und Prüfläufe — die Seite ist
               sofort wieder bedienbar, während der Dialog ausblendet. */
            o.classList.remove('overlay');
            o.setAttribute('data-insel-traeger', 'geht');
            if (typeof Fokus !== 'undefined')
                Fokus.inertAktualisieren();
            const a = document.activeElement;
            if ((!a || a === document.body || o.contains(a)) && vorher?.isConnected)
                vorher.focus({ preventScroll: true });
            ok(wert);
        };
        const weg = () => {
            try {
                api.unmount(o);
            }
            catch { /* schon weg */ }
            o.remove();
        };
        try {
            api.mount(o, 'dialog', {
                ...daten,
                telefon: amTelefon(),
                traeger: o,
                onAntwort: (wert) => antwort((wert === null ? abbruch : wert)),
                onWeg: weg
            });
        }
        catch (e) {
            beantwortet = true;
            removeEventListener('redion-insel-fehler', beiInselFehler);
            o.remove();
            fehler(e);
            return;
        }
        waechter.observe(document.body, { childList: true });
    });
    /** Erst das Kit, sonst das bisherige Fenster — nie beides, nie keins. */
    const kitOderAlt = (daten, abbruch, alt) => inselnHolen().then(api => {
        if (!api)
            return alt();
        return imKit(api, daten, abbruch).catch((e) => {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('Dialog', 'Das Fenster des Kits liess sich nicht öffnen — das bisherige springt ein: ' +
                    (e instanceof Error ? e.message : String(e)));
            return alt();
        });
    });
    /** Eine Frage mit einem Eingabefeld: der Text, oder `null` beim Abbrechen. */
    const frage = (titel, vorgabe = '', art = 'text') => kitOderAlt({ art: art === 'passwort' ? 'passwort' : 'frage', titel: String(titel ?? ''), vorgabe: String(vorgabe ?? '') }, null, () => frageAlt(titel, vorgabe, art));
    /** Die Frage mit mehreren Antworten: die `id` des Knopfes, `''` beim Abbruch. */
    const wahl = ({ titel, text, knoepfe = [] }) => kitOderAlt({ art: 'wahl', titel: String(titel ?? ''), text: String(text ?? ''),
        knoepfe: knoepfe.map(k => ({ ...k })) }, '', () => wahlAlt({ titel, text, knoepfe }));
    /** Die mehrzeilige Frage: Enter macht eine Zeile, Strg+Enter übernimmt. */
    const mehrzeilig = (titel, vorgabe = '') => kitOderAlt({ art: 'mehrzeilig', titel: String(titel ?? ''), vorgabe: String(vorgabe ?? '') }, null, () => mehrzeiligAlt(titel, vorgabe));
    /**
     * JA ODER NEIN — statt `confirm()` (E710). Das Fenster des Browsers hält
     * die ganze Seite an, sieht in jedem System anders aus und kennt keinen
     * roten Knopf für „das löscht etwas". Dies ist eine Wahl mit einer
     * Antwort und „Abbrechen": `true` nur, wenn der Knopf gedrückt wurde.
     */
    const bestaetigen = ({ titel, text = '', ja = 'OK', gefahr = false }) => {
        const knopf = { id: 'ja', text: ja, gefahr };
        /* Im bisherigen Fenster (der Rückweg ohne Inseln) stand hier nur der
           eine Knopf — kein sichtbares „Abbrechen", am Telefon nur ein Tipp
           daneben; `confirm()` hatte eines (Durchsicht, 5. Oktober). Jetzt steht
           es da, bei Gefahr ZUERST: dort hat es den Fokus, und ein Enter löscht
           nichts. Das Kit-Fenster setzt sein „Abbrechen" selbst (dialog.tsx). */
        const abbruch = { id: '', text: 'Abbrechen' };
        return kitOderAlt({ art: 'wahl', titel: String(titel ?? ''), text: String(text ?? ''), knoepfe: [{ ...knopf }] }, '', () => wahlAlt({ titel, text, knoepfe: gefahr ? [abbruch, knopf] : [knopf, abbruch] }))
            .then(w => w === 'ja');
    };
    /**
     * NUR ZUR KENNTNIS — statt `alert()` (E710). Ein Knopf („OK"), Escape und
     * ein Tipp daneben schliessen ebenso; die Seite bleibt dabei lebendig.
     */
    const melden = ({ titel, text = '' }) => wahl({ titel, text, knoepfe: [{ id: '', text: 'OK' }] }).then(() => undefined);
    return { frage, wahl, mehrzeilig, bestaetigen, melden };
})();
window.Dialog = Dialog;
