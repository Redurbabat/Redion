"use strict";
/* ============================================================================
 * bereiche/bloecke/arten/gedankenkarte.ts — die Gedankenkarte (Mindmap)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/gedankenkarte.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/bloecke/arten/gedankenkarte.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen; `test105` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Ein zentrales Thema in der Mitte, Äste nach links und rechts, Text direkt am
 * Knoten — das, wofür man sonst XMind öffnet. Ohne Konto, ohne Wolke, ohne
 * Nachladen: die Karte ist ein gewöhnlicher Block und reist damit in jeder
 * `.redion`-Sicherung mit, ohne dass Sicherung oder Abgleich etwas davon
 * wissen müssen (§9).
 *
 * ZWEI ENTSCHEIDUNGEN, DIE DEN REST ERKLÄREN
 *
 * 1. DIE KNOTEN SIND HTML, NUR DIE LINIEN SIND SVG.
 *
 *    Der nächstliegende Weg wäre ein einziges <svg> mit <text> darin. Dann
 *    aber muss die Breite eines Knotens GESCHÄTZT werden — SVG bricht keinen
 *    Text um, und `getComputedTextLength` gibt es erst, wenn das Element
 *    schon hängt. Genau diese Schätzung steht seit L173 als offene Lücke in
 *    der PDF-Fläche, und sie war dort schon einmal um 18 % daneben.
 *
 *    Hier misst der Browser: jeder Knoten ist ein <div> mit `max-width` und
 *    Umbruch, wird eingehängt, und erst DANACH wird gerechnet. `offsetWidth`
 *    und `offsetHeight` sind die Wahrheit, keine Formel. Der Preis ist ein
 *    zweiter Durchgang beim Zeichnen; er kostet gemessen weniger als eine
 *    Millisekunde bei 60 Knoten und ist jede Schätzung wert.
 *
 * 2. DAS SCHREIBFELD IST EIN `contenteditable`-DIV, KEIN `<textarea>`.
 *
 *    Dasselbe wie in E597/E598 bei der freien Textmarke, aus demselben Grund
 *    und mit einer Falle weniger: `bausteine.css` setzt unter 760 px
 *    `input, textarea, select { font-size:16px !important }`, damit iOS beim
 *    Tippen nicht hineinzoomt. Ein `<textarea>` in einem Knoten würde am
 *    Telefon also plötzlich 16 px gross — und der Knoten spränge beim
 *    Antippen auf eine andere Breite als die, die er eben noch hatte. Ein
 *    Div ist von dieser Regel nicht betroffen; nachgesehen, nicht vermutet.
 *
 * ALLES GEHT ÜBER `aendere`. Wie beim Schaltplan (Planflaeche): eine einzige
 * Funktion schreibt in den Block, zeichnet neu und legt den Schritt auf den
 * Rückgängig-Stapel. Wer daneben an `karte.knoten` schraubt, verliert das
 * Rückgängig und merkt es erst, wenn jemand es braucht.
 * ==========================================================================*/
const Gedankenkarte = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const NS = 'http://www.w3.org/2000/svg';
    const sv = (name, attrs = {}) => {
        const e = document.createElementNS(NS, name);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
        return e;
    };
    /* DIE FARBE BRAUCHT EINEN NAMEN (§38: keine Information nur über Farbe).
       Dieselbe Begründung wie im Whiteboard — der Farbwähler liest den Namen
       vor, und wer die Farben nicht unterscheiden kann, hört sie. */
    const PALETTE = [
        ['#d9534f', 'Rot'], ['#e08a2e', 'Orange'], ['#c9a227', 'Gelb'],
        ['#4a9d5f', 'Grün'], ['#2f8ab5', 'Blau'], ['#7a5cc5', 'Violett'],
        ['#c2549b', 'Rosa'], ['#3fa3a0', 'Türkis'],
    ];
    /* Die Farbe an Stelle i — mit demselben Helfer und aus demselben Grund wie
       `farbeVon` im Whiteboard (E414): `PALETTE[i]` ist ein PAAR, und als
       Zeichenkette ergibt das „#d9534f,Rot". SVG malt dann schwarz. */
    const farbeVon = (i) => PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]?.[0] ?? '#2f8ab5';
    const uid = () => (typeof Ids !== 'undefined' && Ids.short)
        ? 'gk' + Ids.short()
        : 'gk' + Math.floor(performance.now() * 1000).toString(36);
    /* --------------------------------------------------------------------------
     * DAS MODELL
     * ------------------------------------------------------------------------*/
    const zahl = (wert, ersatz) => typeof wert === 'number' && Number.isFinite(wert) ? wert : ersatz;
    /** Eine frische Karte mit einem einzigen Knoten. */
    const neueKarte = (titel = 'Zentrales Thema') => ({
        knoten: [{ id: 'w', text: titel, eltern: null }],
        aufbau: 'karte',
        sicht: { x: 0, y: 0, z: 1 },
    });
    /**
     * Die Karte aus einem Block lesen — und dabei gutmütig sein.
     *
     * Ein Block aus einer fremden oder älteren Fassung kann alles Mögliche in
     * `karte` haben. Statt abzustürzen wird geprüft und ergänzt: was kein
     * Knoten ist, fliegt raus; wer keinen Text hat, bekommt einen leeren; wer
     * keine Kennung hat, bekommt eine. Kaputte Daten sollen abgefangen werden,
     * nicht still wirken (§9).
     *
     * WICHTIG: Die Wurzelkennung der Standardkarte ist fest `'w'` und nicht
     * gewürfelt. Sonst bekäme derselbe Block bei jedem Zeichnen eine andere
     * Kennung, und die Auswahl überlebte kein Neuzeichnen.
     */
    const leseKarte = (block) => {
        const roh = block && typeof block.karte === 'object' && block.karte ? block.karte : null;
        if (!roh || !Array.isArray(roh.knoten) || !roh.knoten.length)
            return neueKarte(block?.text || undefined);
        const gesehen = new Set();
        const knoten = [];
        roh.knoten.forEach((k) => {
            if (!k || typeof k !== 'object')
                return;
            let id = typeof k.id === 'string' && k.id ? k.id : uid();
            while (gesehen.has(id))
                id = uid();
            gesehen.add(id);
            const eintrag = {
                id,
                text: typeof k.text === 'string' ? k.text : String(k.text ?? ''),
                eltern: typeof k.eltern === 'string' && k.eltern ? k.eltern : null,
            };
            if (k.seite === 'links' || k.seite === 'rechts')
                eintrag.seite = k.seite;
            if (typeof k.farbe === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(k.farbe))
                eintrag.farbe = k.farbe;
            if (k.zu === true)
                eintrag.zu = true;
            knoten.push(eintrag);
        });
        if (!knoten.length)
            return neueKarte(block?.text || undefined);
        /* Ohne Wurzel wäre die Karte unzeichenbar — der erste Knoten wird eine. */
        if (!knoten.some(k => !k.eltern)) {
            const erster = knoten[0];
            if (erster)
                erster.eltern = null;
        }
        const s = roh.sicht && typeof roh.sicht === 'object' ? roh.sicht : {};
        return {
            knoten,
            aufbau: typeof roh.aufbau === 'string' ? roh.aufbau : 'karte',
            sicht: {
                x: zahl(s.x, 0),
                y: zahl(s.y, 0),
                z: Math.min(4, Math.max(.2, zahl(s.z, 1))),
            },
        };
    };
    /**
     * Der Baum hinter der flachen Liste — und die Stelle, an der ein kaputter
     * Bestand aufgefangen wird.
     *
     * Zwei Sorten Schaden sind denkbar und beide kommen aus dem echten Leben:
     * ein Knoten zeigt auf einen Elternteil, den es nicht (mehr) gibt, und ein
     * Knoten hängt über Umwege an sich selbst. Der erste Fall entsteht beim
     * Zusammenführen zweier Geräte, der zweite beim Verschieben eines Astes in
     * sich hinein.
     *
     * Beide enden hier gleich: der Knoten hängt sich an die Wurzel. Er ist
     * dann vielleicht am falschen Platz — aber er ist SICHTBAR, und sein Text
     * ist da. Ein Knoten, der wegen eines kaputten Zeigers gar nicht gezeichnet
     * wird, sieht aus wie gelöscht (§51).
     */
    const baum = (karte) => {
        const kinder = {};
        karte.knoten.forEach(k => { kinder[k.id] = []; });
        const wurzel = karte.knoten.find(k => !k.eltern) ?? karte.knoten[0];
        if (!wurzel)
            return { kinder, wurzel: null };
        const nach = new Map(karte.knoten.map(k => [k.id, k]));
        /** Führt der Weg nach oben wirklich zur Wurzel, ohne Ring? */
        const traegt = (k) => {
            const weg = new Set([k.id]);
            let p = k.eltern;
            let schritte = 0;
            while (p && schritte++ < 4096) {
                if (weg.has(p) || !nach.has(p))
                    return false;
                if (p === wurzel.id)
                    return true;
                weg.add(p);
                p = nach.get(p)?.eltern ?? null;
            }
            return false;
        };
        karte.knoten.forEach(k => {
            if (k.id === wurzel.id)
                return;
            const ziel = traegt(k) ? k.eltern : wurzel.id;
            kinder[ziel]?.push(k.id);
        });
        return { kinder, wurzel: wurzel.id };
    };
    /* --------------------------------------------------------------------------
     * DER AUFBAU — reines Rechnen, ohne DOM
     *
     * Die Funktion bekommt die gemessenen Grössen herein und gibt Orte heraus.
     * Genau deshalb kann ein Prüflauf sie rechnen lassen, ohne je einen Zeiger
     * zu bewegen — dieselbe Trennung wie zwischen `schaltplan` und
     * `planflaeche`.
     * ------------------------------------------------------------------------*/
    /* DIE UNTERGRENZE FÜR DEN ERSTEN BLICK — und warum sie gemessen ist.
       Ohne sie passt die App die Karte beim Öffnen IMMER ganz ein. Auf dem
       Bild vom 16. September am iPhone 13 Pro Max hiess das: 33 %. Ein Knoten
       mit 14 px Schrift stand dort mit 4,6 px am Bildschirm — sichtbar, aber
       nicht lesbar, und lesbar ist der Punkt einer Gedankenkarte.
       10 px sind die Grenze, unter der man aufhört zu lesen und anfängt zu
       raten. 10 / 13,5 ergibt 0,74; gerundet 0,72, weil die Schrift am Telefon
       14 px ist und dort schon 0,72 reichen. Wer wirklich alles sehen will,
       drückt ⤢ — der Knopf kennt diese Grenze nicht. */
    const LESBAR = .72;
    const LUECKE_X = 54; /* Abstand zwischen zwei Ebenen */
    const LUECKE_Y = 14; /* Abstand zwischen Geschwistern */
    const RAND = 28; /* Luft um die ganze Karte */
    const aufbauen = (karte, masse) => {
        const { kinder, wurzel } = baum(karte);
        const orte = {};
        const farben = {};
        if (!wurzel)
            return { orte, kinder, farben, wurzel: null, breite: 0, hoehe: 0 };
        const zuMerk = new Map(karte.knoten.map(k => [k.id, !!k.zu]));
        const eigen = new Map(karte.knoten.map(k => [k.id, k.farbe]));
        const sichtbar = (id) => zuMerk.get(id) ? [] : (kinder[id] ?? []);
        const mass = (id) => masse[id] ?? { w: 140, h: 34 };
        const hMerk = {};
        const astHoehe = (id) => {
            const schon = hMerk[id];
            if (schon !== undefined)
                return schon;
            hMerk[id] = mass(id).h; /* Ringschutz: erst setzen, dann rechnen */
            const ks = sichtbar(id);
            let wert = mass(id).h;
            if (ks.length) {
                const summe = ks.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (ks.length - 1);
                wert = Math.max(wert, summe);
            }
            hMerk[id] = wert;
            return wert;
        };
        /* Welche Äste gehen nach rechts, welche nach links? Wer eine eigene Seite
           gespeichert hat, behält sie — sonst wechseln sie sich ab. Das hält die
           Karte beim Wachsen von selbst im Gleichgewicht, statt sie nach einer
           Seite kippen zu lassen. */
        const ebene1 = sichtbar(wurzel);
        const rechts = [];
        const links = [];
        ebene1.forEach((id, i) => {
            const k = karte.knoten.find(n => n.id === id);
            const seite = k?.seite ?? (i % 2 === 0 ? 'rechts' : 'links');
            (seite === 'links' ? links : rechts).push(id);
        });
        /* Die Farbe: jeder Ast der ersten Ebene bekommt eine, und alles darunter
           erbt sie. Eine eigene Farbe am Knoten schlägt das Erbe. */
        const faerben = (id, farbe) => {
            farben[id] = eigen.get(id) || farbe;
            (kinder[id] ?? []).forEach(k => faerben(k, farben[id]));
        };
        farben[wurzel] = eigen.get(wurzel) || 'var(--accent)';
        ebene1.forEach((id, i) => faerben(id, farbeVon(i)));
        /* Eingeklappte Äste bekommen trotzdem eine Farbe — sie werden zwar nicht
           gezeichnet, aber ihr Zähler steht am Elternknoten. */
        karte.knoten.forEach(k => { if (!farben[k.id])
            farben[k.id] = eigen.get(k.id) || 'var(--text-dim)'; });
        const legen = (id, kante, mitteY, richtung) => {
            const m = mass(id);
            orte[id] = { x: richtung > 0 ? kante : kante - m.w, y: mitteY - m.h / 2 };
            const ks = sichtbar(id);
            if (!ks.length)
                return;
            const gesamt = ks.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (ks.length - 1);
            let oben = mitteY - gesamt / 2;
            const naechste = richtung > 0 ? kante + m.w + LUECKE_X : kante - m.w - LUECKE_X;
            ks.forEach(k => {
                const h = astHoehe(k);
                legen(k, naechste, oben + h / 2, richtung);
                oben += h + LUECKE_Y;
            });
        };
        const wm = mass(wurzel);
        orte[wurzel] = { x: -wm.w / 2, y: -wm.h / 2 };
        const seiteLegen = (liste, richtung) => {
            if (!liste.length)
                return;
            const gesamt = liste.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (liste.length - 1);
            let oben = -gesamt / 2;
            const kante = richtung > 0 ? wm.w / 2 + LUECKE_X : -wm.w / 2 - LUECKE_X;
            liste.forEach(k => {
                const h = astHoehe(k);
                legen(k, kante, oben + h / 2, richtung);
                oben += h + LUECKE_Y;
            });
        };
        seiteLegen(rechts, 1);
        seiteLegen(links, -1);
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        Object.entries(orte).forEach(([id, o]) => {
            const m = mass(id);
            minX = Math.min(minX, o.x);
            minY = Math.min(minY, o.y);
            maxX = Math.max(maxX, o.x + m.w);
            maxY = Math.max(maxY, o.y + m.h);
        });
        if (!Number.isFinite(minX))
            return { orte, kinder, farben, wurzel, breite: 0, hoehe: 0 };
        Object.values(orte).forEach(o => { o.x += RAND - minX; o.y += RAND - minY; });
        return {
            orte, kinder, farben, wurzel,
            breite: Math.round(maxX - minX + RAND * 2),
            hoehe: Math.round(maxY - minY + RAND * 2),
        };
    };
    /* --------------------------------------------------------------------------
     * DAS BILD
     * ------------------------------------------------------------------------*/
    const zeichne = (block) => {
        let karte = leseKarte(block);
        let gewaehlt = karte.knoten.find(k => !k.eltern)?.id ?? null;
        let schreibt = null;
        let letzterAufbau = null;
        let letzteMasse = {};
        const hoehe = Math.max(220, zahl(block.hoehe, 420));
        /* HAT DER NUTZER JE EINE SICHT GEWÄHLT? Wenn nicht, wird beim ersten Bild
           eingepasst — sonst begänne jede Karte oben links, und auf dem Bild vom
           16. September lag die halbe Karte ausserhalb des Kastens; am Telefon
           war nicht einmal das zentrale Thema zu sehen.
           Eingepasst wird OHNE zu speichern: eine Karte, die sich beim Öffnen von
           selbst zurechtrückt, ist angenehmer als eine, die beim blossen Ansehen
           den Block ändert. Wer selbst schiebt oder zoomt, speichert — ab dann
           gilt seine Sicht. */
        let mussEinpassen = !(block && block.karte && typeof block.karte.sicht === 'object'
            && block.karte.sicht);
        const w = document.createElement('div');
        w.className = 'gk';
        /* --- Leiste ------------------------------------------------------------
           DIE KNÖPFE SIND NICHT DIE BEQUEME FASSUNG DER TASTATUR (§37).
           Am Rechner legt Tab ein Kind an und Enter ein Geschwister — am Telefon
           gibt es beide Tasten nicht. Ohne diese Leiste wäre die Gedankenkarte
           dort eine Karte zum Ansehen, und §37 sagt: kein Desktop-only für
           Kernfunktionen. Deshalb kann jeder Weg hier auch mit dem Finger
           gegangen werden. */
        const LEISTE = [
            ['kind', '＋', 'Unterthema anlegen (Tab)'],
            ['neben', '⏎', 'Thema daneben anlegen (Enter)'],
            /* `T` UND NICHT `✎` (angesehen, nicht vermutet). Der Stift U+270E wird
               von der Emoji-Schrift als schräg liegender Stift gezeichnet, und auf
               dem Bild vom 16. September sah er aus wie eine BÜROKLAMMER — dieselbe
               Sorte Fund wie die Ausrichtungsknöpfe, die wie Klammern aussahen
               (§55.1). Ein Buchstabe kann nicht falsch gelesen werden. */
            ['text', 'T', 'Umbenennen (F2)'],
            ['klapp', '⊟', 'Ast auf- oder zuklappen (Leertaste)'],
            ['weg', '🗑', 'Ast löschen (Entf)'],
        ];
        w.innerHTML =
            '<div class="gk-leiste">' +
                LEISTE.map(([id, ico, titel]) => `<button data-a="${id}" title="${esc(titel)}" aria-label="${esc(titel)}">${ico}</button>`).join('') +
                '<span class="gk-trenn"></span>' +
                /* Die acht Farben und das ✕ sind EINE Gruppe. Am Telefon bricht die
                   Leiste um, und auf dem Bild vom 16. September stand das ✕ allein am
                   Anfang der zweiten Zeile — weit weg von den Farben, die es aufhebt.
                   Dieselbe Lehre wie bei `.wb-zoom`: ein Regler in zwei Zeilen ist
                   keiner mehr. */
                '<span class="gk-farben">' +
                PALETTE.map(([c, n]) => `<button class="gk-farbe" data-c="${c}" style="background:${c}" ` +
                    `title="Ast einfärben: ${n}" aria-label="Ast einfärben: ${n}"></button>`).join('') +
                `<button class="gk-farbe gk-farbe-weg" data-c="" title="Eigene Farbe entfernen" ` +
                `aria-label="Eigene Farbe entfernen">✕</button>` +
                '</span>' +
                '<span class="gk-trenn"></span>' +
                /* Die vier Zoomknöpfe bleiben beieinander — am Telefon bricht die
                   Leiste sonst zwischen „−" und „＋" um, und ein Regler in zwei
                   Zeilen ist keiner mehr (dieselbe Lehre wie im Whiteboard). */
                '<span class="gk-zoom">' +
                '<button data-a="kleiner" title="Verkleinern" aria-label="Verkleinern">−</button>' +
                '<b class="gk-massstab" aria-live="polite">100 %</b>' +
                '<button data-a="groesser" title="Vergrössern" aria-label="Vergrössern">＋</button>' +
                '<button data-a="passend" title="Alles ins Bild holen" aria-label="Alles ins Bild holen">⤢</button>' +
                '</span>' +
                '<span class="gk-trenn"></span>' +
                '<button data-a="zurueck" title="Schritt zurück" aria-label="Schritt zurück" disabled>↶</button>' +
                '<button data-a="vor" title="Schritt vorwärts" aria-label="Schritt vorwärts" disabled>↷</button>' +
                '</div>';
        const buehne = document.createElement('div');
        buehne.className = 'gk-buehne';
        buehne.tabIndex = 0;
        buehne.setAttribute('role', 'tree');
        buehne.setAttribute('aria-label', 'Gedankenkarte');
        buehne.style.height = hoehe + 'px';
        w.appendChild(buehne);
        const welt = document.createElement('div');
        welt.className = 'gk-welt';
        buehne.appendChild(welt);
        const linien = sv('svg', { class: 'gk-linien' });
        welt.appendChild(linien);
        const griff = document.createElement('div');
        griff.className = 'gk-griff';
        griff.title = 'Höhe ziehen';
        w.appendChild(griff);
        /* --- Rückgängig ----------------------------------------------------- */
        const SCHRITTE = 40;
        const zurueckStapel = [];
        const vorStapel = [];
        const abbild = () => JSON.stringify(karte);
        const standZeigen = () => {
            const z = w.querySelector('[data-a="zurueck"]');
            const v = w.querySelector('[data-a="vor"]');
            if (z)
                z.disabled = !zurueckStapel.length;
            if (v)
                v.disabled = !vorStapel.length;
        };
        const merken = () => {
            zurueckStapel.push(abbild());
            if (zurueckStapel.length > SCHRITTE)
                zurueckStapel.shift();
            vorStapel.length = 0;
        };
        const sichern = () => {
            Store.updateBlock(block.id, { karte: JSON.parse(JSON.stringify(karte)) });
        };
        /** Der einzige Weg, die Karte zu ändern. */
        const aendere = (tun) => {
            merken();
            tun();
            sichern();
            male();
            standZeigen();
        };
        const einsetzen = (roh) => {
            karte = leseKarte({ karte: JSON.parse(roh) });
            if (gewaehlt && !karte.knoten.some(k => k.id === gewaehlt))
                gewaehlt = null;
            sichern();
            male();
            standZeigen();
        };
        /* --- Helfer am Modell ------------------------------------------------ */
        const knotenVon = (id) => id ? (karte.knoten.find(k => k.id === id) ?? null) : null;
        const kinderVon = (id) => letzterAufbau?.kinder[id] ?? [];
        /** Der Ast unter `id`, samt `id` selbst. */
        const ast = (id) => {
            const raus = [];
            const stapel = [id];
            const gesehen = new Set();
            while (stapel.length) {
                const k = stapel.pop();
                if (!k || gesehen.has(k))
                    continue;
                gesehen.add(k);
                raus.push(k);
                kinderVon(k).forEach(x => stapel.push(x));
            }
            return raus;
        };
        /* --- Messen und Malen ------------------------------------------------ */
        /**
         * Ein Knoten als DOM-Element. Noch ohne Ort — der kommt erst, wenn
         * gemessen wurde.
         */
        const knotenEl = (k, ebene, kinderZahl) => {
            const el = document.createElement('div');
            el.className = 'gk-kn' + (k.eltern ? '' : ' gk-wurzel') + (k.id === gewaehlt ? ' on' : '');
            el.dataset.k = k.id;
            el.setAttribute('role', 'treeitem');
            el.setAttribute('aria-level', String(ebene));
            el.tabIndex = -1;
            if (kinderZahl)
                el.setAttribute('aria-expanded', k.zu ? 'false' : 'true');
            const txt = document.createElement('span');
            txt.className = 'gk-txt';
            /* `textContent`, nicht `innerHTML` — der Text kommt aus den Daten des
               Nutzers und darf nie als Auszeichnung gelesen werden (§19). */
            txt.textContent = k.text || '';
            if (!k.text)
                txt.classList.add('gk-leer');
            el.appendChild(txt);
            if (kinderZahl && k.zu) {
                const zahlEl = document.createElement('span');
                zahlEl.className = 'gk-zahl';
                zahlEl.textContent = String(kinderZahl);
                zahlEl.title = kinderZahl === 1 ? 'Ein verborgenes Unterthema'
                    : kinderZahl + ' verborgene Unterthemen';
                el.appendChild(zahlEl);
            }
            return el;
        };
        /** Eine Verbindung von Elternteil zu Kind — ein weicher Bogen. */
        const bogen = (von, vonM, zu, zuM, farbe, dick) => {
            const rechtsHerum = zu.x + zuM.w / 2 >= von.x + vonM.w / 2;
            const px = rechtsHerum ? von.x + vonM.w : von.x;
            const py = von.y + vonM.h / 2;
            const cx = rechtsHerum ? zu.x : zu.x + zuM.w;
            const cy = zu.y + zuM.h / 2;
            const dx = (cx - px) / 2;
            return sv('path', {
                d: `M ${px.toFixed(1)} ${py.toFixed(1)} C ${(px + dx).toFixed(1)} ${py.toFixed(1)}, ` +
                    `${(cx - dx).toFixed(1)} ${cy.toFixed(1)}, ${cx.toFixed(1)} ${cy.toFixed(1)}`,
                fill: 'none', stroke: farbe, 'stroke-width': dick, 'stroke-linecap': 'round',
            });
        };
        const sichtAnwenden = () => {
            welt.style.transform = `translate(${(-karte.sicht.x).toFixed(1)}px, ` +
                `${(-karte.sicht.y).toFixed(1)}px) scale(${karte.sicht.z})`;
            const m = w.querySelector('.gk-massstab');
            if (m)
                m.textContent = Math.round(karte.sicht.z * 100) + ' %';
        };
        /**
         * Zeichnen in zwei Durchgängen: erst einhängen und messen, dann rechnen
         * und setzen. Siehe Kopf der Datei, Punkt 1.
         */
        const male = () => {
            if (schreibt)
                return; /* wer gerade tippt, verliert sonst den Zeiger */
            welt.querySelectorAll('.gk-kn').forEach(el => el.remove());
            const { kinder, wurzel } = baum(karte);
            if (!wurzel)
                return;
            /* Ebenen für `aria-level` — eine Karte ist für ein Vorleseprogramm ein
               Baum, und ein Baum ohne Ebenen ist eine Liste. */
            const ebenen = { [wurzel]: 1 };
            const reihe = [wurzel];
            while (reihe.length) {
                const id = reihe.shift();
                (kinder[id] ?? []).forEach(k => { ebenen[k] = (ebenen[id] ?? 1) + 1; reihe.push(k); });
            }
            const zuMerk = new Map(karte.knoten.map(k => [k.id, !!k.zu]));
            const sichtbare = [];
            const stapel = [wurzel];
            while (stapel.length) {
                const id = stapel.shift();
                const k = karte.knoten.find(n => n.id === id);
                if (k)
                    sichtbare.push(k);
                if (!zuMerk.get(id))
                    (kinder[id] ?? []).forEach(x => stapel.push(x));
            }
            const els = {};
            sichtbare.forEach(k => {
                const el = knotenEl(k, ebenen[k.id] ?? 1, (kinder[k.id] ?? []).length);
                els[k.id] = el;
                welt.appendChild(el);
            });
            /* Erst JETZT messen. */
            const masse = {};
            Object.entries(els).forEach(([id, el]) => { masse[id] = { w: el.offsetWidth, h: el.offsetHeight }; });
            /* DIE KARTE DARF NICHT SPRINGEN, WENN SIE WÄCHST.
               `aufbauen` schiebt das Ergebnis so, dass die linke obere Ecke bei
               `RAND` liegt — sonst hätte die Welt negative Koordinaten und das SVG
               müsste sie tragen. Die Folge: wächst die Karte nach LINKS, wandert
               in Weltkoordinaten alles nach rechts, und der Ausschnitt zeigt
               plötzlich etwas anderes. Beim Anlegen eines Unterthemas auf der
               linken Seite hüpfte damit die ganze Karte weg.
               Deshalb wird der Ausschnitt um genau denselben Betrag mitgezogen,
               um den die Wurzel gewandert ist. Für das Auge bleibt dann alles
               stehen, egal auf welcher Seite etwas dazukommt. */
            const wurzelVorher = letzterAufbau?.orte[wurzel];
            letzteMasse = masse;
            const plan = aufbauen(karte, masse);
            const wurzelNachher = plan.orte[wurzel];
            if (wurzelVorher && wurzelNachher && !mussEinpassen) {
                karte.sicht.x += (wurzelNachher.x - wurzelVorher.x) * karte.sicht.z;
                karte.sicht.y += (wurzelNachher.y - wurzelVorher.y) * karte.sicht.z;
            }
            letzterAufbau = plan;
            Object.entries(els).forEach(([id, el]) => {
                const o = plan.orte[id];
                if (!o) {
                    el.remove();
                    return;
                }
                el.style.left = o.x.toFixed(1) + 'px';
                el.style.top = o.y.toFixed(1) + 'px';
                el.style.setProperty('--ast', plan.farben[id] ?? 'var(--text-dim)');
            });
            welt.style.width = plan.breite + 'px';
            welt.style.height = plan.hoehe + 'px';
            linien.setAttribute('width', String(plan.breite));
            linien.setAttribute('height', String(plan.hoehe));
            linien.setAttribute('viewBox', `0 0 ${plan.breite} ${plan.hoehe}`);
            while (linien.firstChild)
                linien.removeChild(linien.firstChild);
            sichtbare.forEach(k => {
                const o = plan.orte[k.id];
                const m = masse[k.id];
                if (!o || !m || zuMerk.get(k.id))
                    return;
                (kinder[k.id] ?? []).forEach(kid => {
                    const ko = plan.orte[kid];
                    const km = masse[kid];
                    if (!ko || !km)
                        return;
                    const dick = (ebenen[kid] ?? 2) <= 2 ? 3 : 2;
                    linien.appendChild(bogen(o, m, ko, km, plan.farben[kid] ?? 'var(--text-dim)', dick));
                });
            });
            sichtAnwenden();
            if (mussEinpassen && buehne.getBoundingClientRect().width > 4) {
                mussEinpassen = false;
                einpassen(1, false, LESBAR);
            }
        };
        /* --- Schreiben -------------------------------------------------------
           Wie in E597/E598: ein `contenteditable`-Div, kein `<textarea>`. Die
           Begründung steht im Kopf der Datei. */
        const schreiberSchliessen = (weiter) => {
            const id = schreibt;
            if (!id)
                return;
            schreibt = null;
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(id)}"] .gk-txt`);
            const neu = (el?.innerText ?? '').replace(/ /g, ' ').replace(/\s+$/, '');
            if (el) {
                el.contentEditable = 'false';
                el.classList.remove('gk-schreibt');
            }
            const k = knotenVon(id);
            if (k && k.text !== neu)
                aendere(() => { k.text = neu; });
            else
                male();
            if (weiter === 'kind')
                neuesKind(id);
            else if (weiter === 'neben')
                neuesGeschwister(id);
            else
                buehne.focus();
        };
        const bearbeite = (id) => {
            if (!id)
                return;
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(id)}"] .gk-txt`);
            if (!el)
                return;
            gewaehlt = id;
            schreibt = id;
            el.classList.remove('gk-leer');
            el.classList.add('gk-schreibt');
            el.contentEditable = 'true';
            el.spellcheck = false;
            /* Ein neu angelegtes Unterthema kann ausserhalb des Ausschnitts liegen —
               dann tippte man in etwas, das man nicht sieht. */
            const kasten = el.closest('.gk-kn');
            if (kasten)
                insBild(kasten);
            el.focus();
            const bereich = document.createRange();
            bereich.selectNodeContents(el);
            const auswahl = window.getSelection();
            auswahl?.removeAllRanges();
            auswahl?.addRange(bereich);
        };
        /* --- Die Wege --------------------------------------------------------- */
        const neuesKind = (elternId) => {
            const eltern = knotenVon(elternId);
            if (!eltern)
                return;
            const neu = { id: uid(), text: '', eltern: eltern.id };
            aendere(() => {
                if (eltern.zu)
                    delete eltern.zu;
                /* Direkt hinter den letzten schon vorhandenen Nachfahren — sonst
                   stünde ein neues Unterthema in der Liste vor seinen älteren
                   Geschwistern, und die Reihenfolge am Bild wäre eine andere als
                   die in den Daten. */
                const kinder = kinderVon(eltern.id);
                const letzterKind = kinder.length ? kinder[kinder.length - 1] : null;
                const nach = letzterKind
                    ? Math.max(...ast(letzterKind).map(x => karte.knoten.findIndex(n => n.id === x)))
                    : karte.knoten.findIndex(n => n.id === eltern.id);
                karte.knoten.splice(nach + 1, 0, neu);
            });
            bearbeite(neu.id);
        };
        const neuesGeschwister = (id) => {
            const k = knotenVon(id);
            if (!k)
                return;
            if (!k.eltern) {
                neuesKind(k.id);
                return;
            } /* die Wurzel hat keine Geschwister */
            const neu = { id: uid(), text: '', eltern: k.eltern };
            aendere(() => {
                const nach = Math.max(...ast(k.id).map(x => karte.knoten.findIndex(n => n.id === x)));
                karte.knoten.splice(nach + 1, 0, neu);
            });
            bearbeite(neu.id);
        };
        const loeschen = (id) => {
            const k = knotenVon(id);
            if (!k)
                return;
            if (!k.eltern) {
                UI.toast('Das zentrale Thema bleibt — eine Karte ohne Mitte gibt es nicht.');
                return;
            }
            const weg = new Set(ast(k.id));
            const eltern = k.eltern;
            aendere(() => { karte.knoten = karte.knoten.filter(n => !weg.has(n.id)); });
            gewaehlt = eltern;
            male();
            UI.toast(weg.size === 1 ? 'Thema gelöscht — mit ↶ zurückholen'
                : weg.size + ' Themen gelöscht — mit ↶ zurückholen');
        };
        const klappen = (id) => {
            const k = knotenVon(id);
            if (!k || !kinderVon(k.id).length)
                return;
            aendere(() => { if (k.zu)
                delete k.zu;
            else
                k.zu = true; });
        };
        const faerben = (id, farbe) => {
            const k = knotenVon(id);
            if (!k)
                return;
            aendere(() => { if (farbe)
                k.farbe = farbe;
            else
                delete k.farbe; });
        };
        /* --- Nachbarn für die Pfeiltasten ------------------------------------ */
        const nachbar = (id, richtung) => {
            const plan = letzterAufbau;
            if (!plan)
                return null;
            const mein = plan.orte[id];
            if (!mein)
                return null;
            const kandidaten = Object.entries(plan.orte).filter(([x]) => x !== id);
            const passt = ([, o]) => richtung === 'rechts' ? o.x > mein.x
                : richtung === 'links' ? o.x < mein.x
                    : richtung === 'runter' ? o.y > mein.y
                        : o.y < mein.y;
            const naehe = ([, o]) => {
                const dx = o.x - mein.x, dy = o.y - mein.y;
                /* Quer zur Richtung wiegt schwerer — sonst springt „nach rechts" in
                   einen weit entfernten Ast, nur weil er ein Pixel weiter rechts
                   beginnt. */
                return richtung === 'links' || richtung === 'rechts'
                    ? Math.abs(dx) + Math.abs(dy) * 3
                    : Math.abs(dy) + Math.abs(dx) * 3;
            };
            const treffer = kandidaten.filter(passt).sort((a, b) => naehe(a) - naehe(b))[0];
            return treffer ? treffer[0] : null;
        };
        const waehle = (id) => {
            if (!id)
                return;
            gewaehlt = id;
            welt.querySelectorAll('.gk-kn.on').forEach(el => el.classList.remove('on'));
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(id)}"]`);
            el?.classList.add('on');
            if (el)
                insBild(el);
        };
        /** Holt einen Knoten ins Bild, wenn er danebenliegt. */
        const insBild = (el) => {
            const b = buehne.getBoundingClientRect();
            const k = el.getBoundingClientRect();
            let dx = 0, dy = 0;
            if (k.left < b.left + 8)
                dx = k.left - (b.left + 8);
            else if (k.right > b.right - 8)
                dx = k.right - (b.right - 8);
            if (k.top < b.top + 8)
                dy = k.top - (b.top + 8);
            else if (k.bottom > b.bottom - 8)
                dy = k.bottom - (b.bottom - 8);
            if (!dx && !dy)
                return;
            karte.sicht.x += dx;
            karte.sicht.y += dy;
            sichtAnwenden();
        };
        /* --- Massstab --------------------------------------------------------- */
        const zoomen = (faktor) => {
            const alt = karte.sicht.z;
            const neu = Math.min(4, Math.max(.2, alt * faktor));
            if (neu === alt)
                return;
            /* Um die Mitte der Bühne, nicht um die linke obere Ecke — sonst wandert
               beim Verkleinern alles aus dem Bild. */
            const b = buehne.getBoundingClientRect();
            karte.sicht.x = (karte.sicht.x + b.width / 2) * (neu / alt) - b.width / 2;
            karte.sicht.y = (karte.sicht.y + b.height / 2) * (neu / alt) - b.height / 2;
            karte.sicht.z = neu;
            sichtAnwenden();
            sichern();
        };
        /**
         * Die ganze Karte in den Kasten holen und mittig stellen.
         *
         * `hoechstens` deckelt den Massstab. Der Knopf ⤢ sagt „alles ins Bild"
         * und darf dafür auch VERGRÖSSERN — eine Karte mit drei Knoten füllt dann
         * den Kasten. Der erste Blick beim Öffnen deckelt dagegen bei 1: eine
         * kleine Karte auf 340 % aufgeblasen sieht nicht nach Sorgfalt aus,
         * sondern nach einem Fehler.
         */
        const einpassen = (hoechstens, speichern, mindestens = .2) => {
            const plan = letzterAufbau;
            if (!plan || !plan.breite || !plan.hoehe)
                return;
            const b = buehne.getBoundingClientRect();
            const breite = b.width > 4 ? b.width : 900;
            const hoch = b.height > 4 ? b.height : hoehe;
            const passt = Math.min(breite / plan.breite, hoch / plan.hoehe);
            const z = Math.min(hoechstens, Math.max(mindestens, passt));
            karte.sicht.z = z;
            const wurzelOrt = plan.wurzel ? plan.orte[plan.wurzel] : null;
            const wurzelMass = plan.wurzel ? letzteMasse[plan.wurzel] : null;
            if (passt >= mindestens || !wurzelOrt || !wurzelMass) {
                /* Es passt — die ganze Karte mittig in den Kasten. */
                karte.sicht.x = (plan.breite * z - breite) / 2;
                karte.sicht.y = (plan.hoehe * z - hoch) / 2;
            }
            else {
                /* Es passt NICHT, ohne unlesbar zu werden. Dann lieber die Mitte
                   zeigen und den Rest erschieben lassen, als alles hineinquetschen. */
                const mx = wurzelOrt.x + wurzelMass.w / 2;
                const my = wurzelOrt.y + wurzelMass.h / 2;
                karte.sicht.x = mx * z - breite / 2;
                karte.sicht.y = my * z - hoch / 2;
            }
            sichtAnwenden();
            if (speichern)
                sichern();
        };
        /* --- Ereignisse ------------------------------------------------------- */
        const elVon = (e) => e.target instanceof Element ? e.target : null;
        w.querySelector('.gk-leiste')?.addEventListener('click', e => {
            const farbKnopf = elVon(e)?.closest('.gk-farbe');
            if (farbKnopf) {
                faerben(gewaehlt, farbKnopf.dataset.c || '');
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            switch (b.dataset.a) {
                case 'kind':
                    neuesKind(gewaehlt);
                    break;
                case 'neben':
                    neuesGeschwister(gewaehlt);
                    break;
                case 'text':
                    bearbeite(gewaehlt);
                    break;
                case 'klapp':
                    klappen(gewaehlt);
                    break;
                case 'weg':
                    loeschen(gewaehlt);
                    break;
                case 'kleiner':
                    zoomen(1 / 1.25);
                    break;
                case 'groesser':
                    zoomen(1.25);
                    break;
                case 'passend':
                    einpassen(4, true);
                    break;
                case 'zurueck': {
                    const roh = zurueckStapel.pop();
                    if (roh === undefined)
                        return;
                    vorStapel.push(abbild());
                    einsetzen(roh);
                    break;
                }
                case 'vor': {
                    const roh = vorStapel.pop();
                    if (roh === undefined)
                        return;
                    zurueckStapel.push(abbild());
                    einsetzen(roh);
                    break;
                }
                default: break;
            }
        });
        buehne.addEventListener('pointerdown', e => {
            const kn = elVon(e)?.closest('.gk-kn');
            if (kn && kn.dataset.k) {
                if (schreibt && schreibt !== kn.dataset.k)
                    schreiberSchliessen(null);
                waehle(kn.dataset.k);
                if (!schreibt)
                    buehne.focus();
                return;
            }
            if (schreibt) {
                schreiberSchliessen(null);
                return;
            }
            /* Auf leerer Fläche: schieben. */
            const startX = e.clientX, startY = e.clientY;
            const vonX = karte.sicht.x, vonY = karte.sicht.y;
            buehne.classList.add('gk-schiebt');
            const zug = (ev) => {
                karte.sicht.x = vonX - (ev.clientX - startX);
                karte.sicht.y = vonY - (ev.clientY - startY);
                sichtAnwenden();
            };
            const aus = () => {
                window.removeEventListener('pointermove', zug);
                window.removeEventListener('pointerup', aus);
                buehne.classList.remove('gk-schiebt');
                sichern();
            };
            window.addEventListener('pointermove', zug);
            window.addEventListener('pointerup', aus);
        });
        buehne.addEventListener('dblclick', e => {
            const kn = elVon(e)?.closest('.gk-kn');
            if (kn?.dataset.k)
                bearbeite(kn.dataset.k);
        });
        buehne.addEventListener('wheel', e => {
            if (!e.ctrlKey && !e.metaKey)
                return;
            e.preventDefault();
            zoomen(e.deltaY < 0 ? 1.1 : 1 / 1.1);
        }, { passive: false });
        buehne.addEventListener('keydown', e => {
            /* Beim Schreiben gehört die Tastatur dem Text — bis auf die drei
               Tasten, die XMind dort anders belegt. */
            if (schreibt) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    schreiberSchliessen('neben');
                    return;
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    e.stopPropagation();
                    schreiberSchliessen('kind');
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    schreiberSchliessen(null);
                    return;
                }
                return;
            }
            const strg = e.ctrlKey || e.metaKey;
            if (strg && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                e.stopPropagation();
                const roh = e.shiftKey ? vorStapel.pop() : zurueckStapel.pop();
                if (roh === undefined)
                    return;
                (e.shiftKey ? zurueckStapel : vorStapel).push(abbild());
                einsetzen(roh);
                return;
            }
            if (strg)
                return;
            switch (e.key) {
                case 'Tab':
                    e.preventDefault();
                    e.stopPropagation();
                    neuesKind(gewaehlt);
                    return;
                case 'Enter':
                    e.preventDefault();
                    e.stopPropagation();
                    neuesGeschwister(gewaehlt);
                    return;
                case 'F2':
                    e.preventDefault();
                    e.stopPropagation();
                    bearbeite(gewaehlt);
                    return;
                case ' ':
                    e.preventDefault();
                    e.stopPropagation();
                    klappen(gewaehlt);
                    return;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    e.stopPropagation();
                    loeschen(gewaehlt);
                    return;
                case 'ArrowRight':
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'ArrowDown': {
                    if (!gewaehlt)
                        return;
                    e.preventDefault();
                    e.stopPropagation();
                    const richtung = e.key === 'ArrowRight' ? 'rechts' : e.key === 'ArrowLeft' ? 'links'
                        : e.key === 'ArrowUp' ? 'hoch' : 'runter';
                    waehle(nachbar(gewaehlt, richtung));
                    return;
                }
                default: return;
            }
        });
        /* Ein Zeichen tippen, während ein Knoten gewählt ist, ersetzt seinen Text
           — wie in XMind. Das läuft über `keypress`-artiges `beforeinput` nicht,
           weil die Bühne selbst nicht editierbar ist; deshalb hier. */
        buehne.addEventListener('keypress', e => {
            if (schreibt || e.ctrlKey || e.metaKey || e.altKey)
                return;
            if (e.key.length !== 1)
                return;
            const k = knotenVon(gewaehlt);
            if (!k)
                return;
            e.preventDefault();
            const zeichen = e.key;
            aendere(() => { k.text = zeichen; });
            bearbeite(k.id);
            const el = welt.querySelector(`.gk-kn[data-k="${CSS.escape(k.id)}"] .gk-txt`);
            if (el) {
                const bereich = document.createRange();
                bereich.selectNodeContents(el);
                bereich.collapse(false);
                const auswahl = window.getSelection();
                auswahl?.removeAllRanges();
                auswahl?.addRange(bereich);
            }
        });
        /* Beim Einfügen kommt reiner Text, keine Auszeichnung — sonst käme
           fremdes HTML über die Zwischenablage in einen Knoten (§19). */
        welt.addEventListener('paste', e => {
            if (!schreibt)
                return;
            e.preventDefault();
            const roh = e.clipboardData?.getData('text/plain') ?? '';
            if (roh)
                document.execCommand('insertText', false, roh);
        });
        welt.addEventListener('drop', e => { if (schreibt)
            e.preventDefault(); });
        welt.addEventListener('focusout', e => {
            if (!schreibt)
                return;
            const ziel = e.relatedTarget;
            /* Ein Klick auf die eigene Leiste soll das Schreiben nicht beenden —
               dieselbe Ausnahme wie bei der freien Textmarke (E599). */
            if (ziel && typeof ziel.closest === 'function' && ziel.closest('.gk-leiste'))
                return;
            schreiberSchliessen(null);
        });
        /* --- Höhe ziehen ------------------------------------------------------ */
        griff.addEventListener('pointerdown', e => {
            e.preventDefault();
            const startY = e.clientY;
            const vonH = buehne.getBoundingClientRect().height;
            const zug = (ev) => {
                const neu = Math.max(220, Math.round(vonH + (ev.clientY - startY)));
                buehne.style.height = neu + 'px';
            };
            const aus = () => {
                window.removeEventListener('pointermove', zug);
                window.removeEventListener('pointerup', aus);
                Store.updateBlock(block.id, { hoehe: Math.round(buehne.getBoundingClientRect().height) });
            };
            window.addEventListener('pointermove', zug);
            window.addEventListener('pointerup', aus);
        });
        /* Solange der Kasten noch nicht hängt, misst der Browser 0 — dann wäre
           jeder Knoten 0 breit und die ganze Karte läge übereinander. Beim ersten
           echten Anblick wird deshalb neu gezeichnet. */
        if (typeof ResizeObserver !== 'undefined') {
            let hatte = false;
            const beobachter = new ResizeObserver(() => {
                const b = buehne.getBoundingClientRect();
                if (b.width > 4 && !hatte) {
                    hatte = true;
                    male();
                }
            });
            beobachter.observe(buehne);
        }
        male();
        standZeigen();
        return w;
    };
    return { zeichne, leseKarte, neueKarte, aufbauen, baum, PALETTE, farbeVon };
})();
window.Gedankenkarte = Gedankenkarte;
