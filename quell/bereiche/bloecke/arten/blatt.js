"use strict";
/* ============================================================================
 * bereiche/bloecke/arten/blatt.ts — das A4-Blatt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/blatt.ts`.
 * ----------------------------------------------------------------------------
 * Ein Blatt Papier in A4, auf das man BEIDES kann: schreiben und malen.
 *
 * Geschrieben wird in gewöhnlichen Redion-Blöcken — sie sind Kinder dieses
 * Blocks. Damit erbt das Blatt alles, was der Editor kann: Slash-Menü,
 * Überschriften, Aufgabenlisten, Verweise, Suche, Export. Ein eigener
 * Texteditor auf dem Blatt wäre eine zweite Maschine für dieselbe Frage
 * (E29), und die zweite ist immer die schlechtere.
 *
 * Gemalt wird auf `Marken` — DERSELBEN Zeichenschicht, die auch die
 * PDF-Seite benutzt (E103). Sie lag zuerst hier; als die PDF-Seite sie
 * brauchte, wurde sie herausgelöst statt abgeschrieben (§34). Was sie kann
 * und warum sie nicht in Bildschirmpunkten rechnet, steht in E100.
 * ==========================================================================*/
const Blatt = (() => {
    /* ==========================================================================
     * PAPIERVORLAGEN
     * --------------------------------------------------------------------------
     * Blanko, liniert, kariert, Punktraster, Millimeterpapier — mehr braucht
     * niemand, und mehr wäre auch nicht mehr nachzuhalten.
     *
     * Es ist NUR Darstellung. Kein zweites Dokumentformat, kein zweiter
     * Speicher: ein Feld am Block, ein Hintergrundbild im Stilblatt. Wer eine
     * Vorlage wechselt, ändert nichts an seinem Text und nichts an seinen
     * Strichen — deshalb kann man beliebig hin- und herwechseln, ohne etwas zu
     * verlieren.
     *
     * DIE ABSTÄNDE STEHEN IN BLATTMASSEN, NICHT IN BILDSCHIRMPUNKTEN. Das ist
     * dieselbe Regel wie in E100, und sie ist hier genauso wichtig: das Blatt
     * folgt der Fensterbreite über `aspect-ratio`. Ein Kästchen in Pixeln wäre
     * am Telefon ein anderes Kästchen als am Rechner — und dann ist es kein
     * Karopapier mehr, sondern ein Muster. Gerechnet wird deshalb in Prozent
     * der Blattmasse, und die Prozentzahlen entstehen aus dem Block: bei einem
     * dreiseitigen Blatt ist die Höhe dreimal A4, und 5 mm sind dort ein
     * Drittel so viel Prozent. Der Abstand auf dem Papier bleibt derselbe.
     * ========================================================================*/
    const MM = 2.8346457; /* ein Millimeter in Punkt (72/25,4) */
    const PAPIERE = [
        { id: 'blanko', name: 'Blanko' },
        { id: 'liniert', name: 'Liniert' },
        { id: 'kariert', name: 'Kariert' },
        { id: 'punkte', name: 'Punktraster' },
        { id: 'mm', name: 'Millimeterpapier' },
    ];
    /** Was am Block steht — und bei allem Unbekannten: blanko. */
    const papierVon = (block) => {
        const wert = String(block?.papier ?? 'blanko');
        return PAPIERE.some(x => x.id === wert) ? wert : 'blanko';
    };
    /** Die Abstände als Prozentzahlen, damit CSS sie einsetzen kann. */
    const masse = (breite, hoehe) => {
        const quer = (mm) => (mm * MM / breite * 100) + '%';
        const hoch = (mm) => (mm * MM / hoehe * 100) + '%';
        return {
            /* Schulheft-Lineatur: 8,75 mm. */
            '--blatt-zeile': hoch(8.75),
            /* Karo: 5 mm, und quer wie hoch derselbe absolute Abstand. */
            '--blatt-karo-quer': quer(5),
            '--blatt-karo-hoch': hoch(5),
            /* Millimeterpapier: das feine Netz und die kräftige Zehnerlinie. */
            '--blatt-mm-quer': quer(1),
            '--blatt-mm-hoch': hoch(1),
            '--blatt-mm-zehn-quer': quer(10),
            '--blatt-mm-zehn-hoch': hoch(10),
        };
    };
    const waehler = (jetzt) => '<span class="blatt-trenn"></span>' +
        PAPIERE.map(art => `<button class="blatt-papierwahl${art.id === jetzt ? ' on' : ''}" ` +
            `data-papier="${art.id}" title="Papier: ${art.name}" aria-label="Papier: ${art.name}" ` +
            `aria-pressed="${art.id === jetzt ? 'true' : 'false'}">` +
            `<i data-vorschau="${art.id}"></i></button>`).join('');
    const zeichne = (block) => {
        const R = SheetSpace;
        const hoehe = Number(block.blattHoehe) || R.A4_HOEHE;
        const breite = Number(block.blattBreite) || R.A4_BREITE;
        const w = document.createElement('div');
        w.className = 'blatt-huelle';
        /* Die Zeichenschicht zuerst — die Leiste braucht ihre Schalter. */
        const schicht = Marken.schicht(block, breite, hoehe, R.A4_HOEHE);
        const jetzt = papierVon(block);
        const werk = Marken.leiste(schicht, '<span class="blatt-trenn"></span>' +
            '<button data-a="seite" title="Eine Seite anhängen">' +
            '<span class="zeichen">＋</span><span class="wort">Seite</span></button>' +
            waehler(jetzt));
        w.appendChild(werk);
        const papier = document.createElement('div');
        papier.className = 'blatt-papier';
        /* Die Höhe folgt der Breite über das Seitenverhältnis — dann stimmt das
           Blatt bei jeder Fensterbreite, ohne eine einzige gerechnete Zahl. */
        papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
        papier.dataset.papier = jetzt;
        for (const [name, wert] of Object.entries(masse(breite, hoehe)))
            papier.style.setProperty(name, wert);
        w.appendChild(papier);
        werk.addEventListener('click', e => {
            const b = e.target?.closest?.('button');
            if (!b)
                return;
            if (b.dataset.papier) {
                /* NUR DAS FELD, SONST NICHTS. Kein Neuzeichnen der Seite: der Text
                   steht in Kindblöcken, die Striche in der Zeichenschicht, und
                   beide würden beim Neuaufbau ihren Bearbeitungsstand verlieren —
                   der Cursor spränge mitten im Satz weg. Der Hintergrund ist eine
                   Eigenschaft des Papiers, also wird das Papier umgestellt. */
                const art = b.dataset.papier;
                Store.updateBlock(block.id, { papier: art });
                /* Das zuletzt gewählte Papier wird die Vorgabe für neue Hefte
                   (Notizhefte, E264). Store ist Kern — keine Bereichskopplung. */
                Store.setMeta('heft:papier', art);
                papier.dataset.papier = art;
                werk.querySelectorAll('[data-papier]').forEach(k => {
                    const an = k.dataset.papier === art;
                    k.classList.toggle('on', an);
                    k.setAttribute('aria-pressed', an ? 'true' : 'false');
                });
                return;
            }
            if (b.dataset.a !== 'seite')
                return;
            Store.updateBlock(block.id, {
                blattHoehe: hoehe + R.A4_HOEHE, blattBreite: breite,
                raumVersion: R.RAUM_VERSION
            });
            App.zeichneSeite();
        });
        /* Der Text: gewöhnliche Blöcke, im Satzspiegel. Ein Prozent-Innenabstand
           bezieht sich in CSS auf die BREITE — auch oben und unten. Also EIN
           Wert, sonst wären die Ränder oben schmaler als seitlich. */
        const inhalt = document.createElement('div');
        inhalt.className = 'blatt-inhalt';
        inhalt.style.padding = (R.RAND / breite * 100) + '%';
        /* `Blocks` liegt NICHT auf `window` — bei `module: none` teilen sich alle
           Dateien einen Namensraum, und der Editor hängt sich nirgends an. */
        const kinder = Store.childrenOf(block.id);
        if (!kinder.length) {
            /* EINE ZEILE MUSS DA SEIN (E118). Ohne sie ist das Papier eine Fläche
               ohne einziges bearbeitbares Element — man kann darauf malen und
               sonst nichts. Gemessen an einem Blatt aus dem Slash-Menü:
               `contenteditable` im Block = 0.
               Alle Wege, die bisher funktionierten, legten das Kind von Hand an
               (`PdfEinlesen.alsSeiten` tut es, `test174` tut es). Nur der Weg,
               den ein Mensch geht — `/blatt` tippen —, tat es nicht: `umwandeln`
               kennt keine Anfangskinder.
               Die Spalte daneben löst dasselbe seit E102 genau so. */
            const leer = Store.addBlock(block.id, 'text', { text: '' });
            inhalt.appendChild(Blocks.render(leer, 0));
        }
        else {
            kinder.forEach((k) => { inhalt.appendChild(Blocks.render(k, 0)); });
        }
        papier.appendChild(inhalt);
        papier.appendChild(schicht.flaeche);
        /* Beim Malen soll der Finger nicht durch den Text markieren. */
        const urspruenglich = schicht.setzeWerkzeug;
        schicht.setzeWerkzeug = (wz) => {
            urspruenglich(wz);
            papier.classList.toggle('malt', wz !== 'schreiben');
        };
        return w;
    };
    return { zeichne, PAPIERE, papierVon, masse };
})();
window.Blatt = Blatt;
