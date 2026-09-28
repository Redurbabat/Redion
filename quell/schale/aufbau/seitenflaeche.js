"use strict";
/* ============================================================================
 * schale/aufbau/seitenflaeche.ts — die Seite als Leinwand (AFFiNEs `edgeless`)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/seitenflaeche.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/schale/aufbau/seitenflaeche.js`; `test105` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * NACHGELESEN, DANN GEBAUT (`doku/karte/thema-ansichten.md`). AFFiNEs Fläche
 * ist kein zweites Dokument, sondern ein Blick auf dasselbe: Punktraster,
 * darin ein `gfx-viewport`, und der Seitentext steht darin als
 * verschiebbarer Kasten mit eigener Kopfzeile (Emoji, Titel, Einklappen).
 * Gezoomt wird von 10 % bis 600 %; Ausschnitt und Zoom werden GETRENNT vom
 * Scrollstand der Seite gemerkt.
 *
 * WAS HIER 1:1 IST: das Punktraster, der Kasten mit Kopfzeile an einer
 * gemerkten Stelle, Schieben, Zoomen, „ins Bild passen", der Prozentwert
 * unten, und dass der Wechsel KEINEN Text anfasst.
 *
 * DER VOLLAUSBAU (E691). Redur, 26. September: „ja mach den vollausbau,
 * jeder block auf die fläche ziehbar." Seither ist der Seitenkasten nicht
 * mehr der einzige: JEDER Block kann seinen eigenen Ort bekommen und wird
 * dann sein eigener Kasten. Zwei Felder tragen das, beide am Block, beide
 * optional (§9):
 *
 *     flaecheOrt   { x, y, w, raumVersion }        wo er liegt
 *     zeigen       'beides' | 'seite' | 'flaeche'  wo er erscheint
 *
 * Das ist AFFiNEs `displayMode` (`affine/model/src/consts/note.ts:38-42`),
 * eine Stufe feiner: dort ist die NOTIZ die kleinste Einheit auf der
 * Fläche, hier der BLOCK.
 *
 * WAS HIER NOCH NICHT IST — und es steht als Lücke geschrieben, nicht als
 * Versprechen (§32, L219): auf der Fläche ZEICHNEN (Stift, Formen,
 * Verbinder). Die Werkzeugleiste zeigt deshalb genau die zwei Werkzeuge,
 * die wirklich etwas tun — Zeiger und Hand. Eine Leiste mit zwölf Knöpfen,
 * von denen zehn nichts bewirken, wäre die schlechtere Antwort.
 *
 * DIE DREI STELLEN, AN DENEN ES LEICHT SCHIEFGEHT
 *
 * 1. ZWEI ZAHLENWELTEN. Alles, was der Mensch sieht, ist Bildschirm;
 *    alles, was gespeichert wird, ist Fläche. Die Umrechnung steht EINMAL
 *    hier (`ausFlaeche`/`inFlaeche`) — derselbe Fehler wie E623 und E686
 *    entstand beide Male dadurch, dass sie an zwei Stellen stand.
 *
 * 2. DER AUSSCHNITT IST KEIN INHALT. Wo man gerade hinsieht, gehört nicht
 *    in den Block — sonst verschiebt ein Blick am Telefon die Fläche am
 *    Rechner. Er liegt in `meta` unter `flaeche:<seite>`, so wie AFFiNE ihn
 *    in den `localStorage` legt. Die STELLE des Kastens gehört dagegen zum
 *    Dokument und steht am Block (`flaecheNotiz`, mit `raumVersion` nach dem
 *    Muster aus E686).
 *
 * 3. DER TEXT WIRD NICHT KOPIERT. Im Kasten steht derselbe Aufruf, der die
 *    normale Seite füllt — `Inhaltsflaeche.zeichne`. Wer hier eine zweite
 *    Zeichnung baut, hat zwei Editoren, und einer von beiden ist immer der
 *    veraltete.
 * ==========================================================================*/
const Seitenflaeche = (() => {
    /** Zoomgrenzen und Schritt wie in AFFiNE (`framework/std/src/gfx/viewport.ts`). */
    const ZOOM_MIN = 0.1;
    const ZOOM_MAX = 6.0;
    /** Das Raster in Flächeneinheiten — 20, wie AFFiNEs Punktabstand. */
    const RASTER = 20;
    /** Die Fassung der Zahlen am Block. Eine spätere Umstellung erkennt daran,
     *  was sie vor sich hat, statt zu raten (E686). */
    const RAUM_VERSION = 1;
    /** Vorgabebreite des Kastens, wenn die Seite noch keine hat.
     *  SIE RICHTET SICH NACH DEM FENSTER, und das ist eine Lehre vom Telefon:
     *  mit festen 760 rechnete „ins Bild holen" auf 390 px Breite einen
     *  Massstab von 31 % aus — der Kasten war da, lesbar war er nicht. Eine
     *  VORGABE darf sich am Gerät orientieren; eine gespeicherte Breite nicht
     *  (die gehört dem Dokument und wäre sonst auf jedem Gerät eine andere). */
    const vorgabeBreite = () => Math.min(760, Math.max(280, (window.innerWidth || 760) - 40));
    /** Wohin ein neuer Kasten gehört, wenn die Fläche gerade zu sehen ist —
     *  in die Mitte des Ausschnitts, wie AFFiNEs Notiz-Werkzeug. Gesetzt von
     *  `zeichne`, geleert, sobald eine andere Seite gezeichnet wird: eine
     *  Mitte von gestern ist schlechter als gar keine. */
    let vorschlag = null;
    const zahl = (roh, ersatz) => {
        const n = Number(roh);
        return Number.isFinite(n) ? n : ersatz;
    };
    /* ------------------------------------------------------------------------
     * Der Ausschnitt lebt in `meta`, nicht am Block (Punkt 2 oben).
     * ----------------------------------------------------------------------*/
    const sichtSchluessel = (id) => 'flaeche:' + id;
    const sichtLesen = (id) => {
        const roh = Store.getMeta(sichtSchluessel(id), null);
        if (!roh || typeof roh !== 'object')
            return null;
        const s = roh;
        if (!Number.isFinite(Number(s['z'])))
            return null;
        return { x: zahl(s['x'], 0), y: zahl(s['y'], 0), z: zahl(s['z'], 1) };
    };
    const sichtSchreiben = (id, s) => {
        Store.setMeta(sichtSchluessel(id), { x: s.x, y: s.y, z: s.z });
    };
    /* ------------------------------------------------------------------------
     * Die Stelle des Kastens gehört zum Dokument.
     * ----------------------------------------------------------------------*/
    const notizLesen = (p) => {
        const roh = p?.flaecheNotiz;
        if (!roh || typeof roh !== 'object')
            return { x: 0, y: 0, w: vorgabeBreite() };
        return {
            x: zahl(roh.x, 0), y: zahl(roh.y, 0),
            /* Ein Kasten unter 240 wäre nicht mehr lesbar; die Zahl schützt vor
               einer kaputten Sicherung, nicht vor dem Menschen. */
            w: Math.max(240, zahl(roh.w, vorgabeBreite()))
        };
    };
    const notizSchreiben = (p, ort) => {
        Store.updateBlock(p.id, {
            flaecheNotiz: { x: Math.round(ort.x), y: Math.round(ort.y), w: Math.round(ort.w), raumVersion: RAUM_VERSION }
        });
    };
    /* ------------------------------------------------------------------------
     * Der Ort EINES BLOCKS auf der Fläche (E691)
     * --------------------------------------------------------------------------
     * Dasselbe Format wie beim Seitenkasten, nur an einem beliebigen Block —
     * und mit einer Vorgabebreite, die schmaler ist: ein einzelner Absatz
     * braucht keine 760 Punkte, und vier Kästen nebeneinander passen sonst auf
     * keinen Bildschirm.
     * ----------------------------------------------------------------------*/
    const BLOCK_BREITE = 380;
    /** Ist der Platz lesbar? Die Antwort steht EINMAL im Register (§8) —
     *  siehe dort, warum sie dort steht und nicht zweimal hier. */
    const ortLesbar = (roh) => (typeof Register !== 'undefined' && Register.seitenansichten)
        ? Register.seitenansichten.ortLesbar(roh)
        : !!roh;
    const blockOrt = (b) => {
        const roh = b?.flaecheOrt;
        if (!ortLesbar(roh))
            return { x: 0, y: 0, w: BLOCK_BREITE };
        return {
            x: zahl(roh.x, 0), y: zahl(roh.y, 0),
            w: Math.max(160, zahl(roh.w, BLOCK_BREITE))
        };
    };
    const blockOrtSchreiben = (b, ort) => {
        Store.updateBlock(b.id, {
            flaecheOrt: {
                x: Math.round(ort.x), y: Math.round(ort.y), w: Math.round(ort.w),
                raumVersion: RAUM_VERSION
            }
        });
    };
    /** Welche Blöcke einer Seite liegen als eigener Kasten auf der Fläche? */
    const eigeneKaesten = (p) => {
        const zeigtIn = (typeof Register !== 'undefined' && Register.seitenansichten)
            ? Register.seitenansichten.zeigtIn : () => true;
        const raus = [];
        for (const b of Store.childrenOf(p.id)) {
            if (!b || !b.flaecheOrt || !zeigtIn(b, 'flaeche'))
                continue;
            if (!ortLesbar(b.flaecheOrt)) {
                /* Nicht still übergehen: der Block steht danach im Seitenkasten,
                   und wer die Konsole ansieht, weiss auch, warum. */
                console.warn('Redion: Block „' + String(b.id) +
                    '" hat einen unlesbaren `flaecheOrt` und bleibt im Text.', b.flaecheOrt);
                continue;
            }
            raus.push(b);
        }
        return raus;
    };
    /* ------------------------------------------------------------------------
     * DIE FORMEN AUF DER FLAECHE (E693, L219)
     * --------------------------------------------------------------------------
     * DASSELBE FORMAT WIE DAS WHITEBOARD, und das ist eine Datenentscheidung,
     * keine Bequemlichkeit: `shapes` steht so in jedem Whiteboard, ist in
     * `doku/REDION-FORMAT.md` beschrieben und wird vom selben Zeichner im Kern
     * gemalt (`GfxShapes`). Ein zweites Format haette bedeutet, dass eine
     * Sicherung zwei Formate kennen muss und jeder spaetere Leser zweimal
     * hinsehen. Gezeichnet wird also hier wie dort.
     * ----------------------------------------------------------------------*/
    const formenLesen = (p) => Array.isArray(p?.shapes) ? p.shapes : [];
    const formenSchreiben = (p, formen) => {
        /* Keine leere Liste stehen lassen: wer die letzte Form wegradiert, hat
         * keine Zeichnung - nicht eine leere. Ein `shapes: []` in einer Sicherung
         * wuerde behaupten, hier sei einmal etwas gewesen, und `raumVersion` ohne
         * Formen deutet einen Raum, den niemand benutzt (§9, doku/REDION-FORMAT.md). */
        if (!formen.length) {
            Store.feldWeg(p.id, 'shapes', 'raumVersion');
            return;
        }
        Store.updateBlock(p.id, { shapes: formen, raumVersion: RAUM_VERSION });
    };
    /* ========================================================================
     * DIE DREI GRIFFE — sie wirken auch, wenn die Fläche gar nicht gezeichnet
     * ist.
     * --------------------------------------------------------------------------
     * Das ist kein Zufall, sondern der Grund, warum sie hier stehen und nicht
     * mitten im Zeichnen: der Weg über das Blockmenü (`editor.ts`, der einzige
     * Weg am Telefon) wird in der REDION-Ansicht benutzt, wo es keine Leinwand
     * gibt. Ein Griff, der eine gezeichnete Fläche braucht, wäre dort tot.
     * ======================================================================*/
    /**
     * Einen Block auf die Fläche legen.
     *
     * @param ort Wohin, in Flächeneinheiten. Ohne Angabe sucht die Funktion
     *        selbst eine Stelle — und zwar in dieser Reihenfolge: die Mitte
     *        des gerade sichtbaren Ausschnitts (wie AFFiNEs Notiz-Werkzeug),
     *        sonst, wenn keine Fläche gezeichnet ist, gerechnet neben oder
     *        unter dem Seitenkasten. Sie rät dabei nicht — sie zählt, was
     *        schon liegt.
     */
    /* `App`, NICHT `(window as any).App` — und das steht hier, weil derselbe
       Fehler in diesem Bogen ZWEIMAL passiert ist. `const App = (() => …)()`
       in einem gewöhnlichen `<script>` legt eine globale LEXIKALISCHE Bindung
       an; die steht nicht unter `window`. Der optionale Zugriff schluckt es
       still: das Feld wird geschrieben, der Bildschirm bleibt stehen, kein
       Fehler kommt. Beim ersten Mal (E690) sah es aus wie ein fehlender
       Zweig, beim zweiten wie ein fehlender Kasten. */
    const aufFlaeche = (b, ort) => {
        if (!b?.id)
            return;
        const seite = Store.getBlock(b.parentId);
        if (!seite)
            return;
        let stelle = ort;
        if (!stelle && vorschlag)
            stelle = vorschlag();
        if (!stelle) {
            /* KEINE FLÄCHE GEZEICHNET — also rechnen statt sehen. Der Weg über
               das Blockmenü wird in der Redion-Ansicht benutzt, wo es keine
               Leinwand gibt; dann gibt es auch keinen Ausschnitt, in dessen Mitte
               man legen könnte.
      
               RECHTS ODER DARUNTER, je nach Gerät. Der erste Stand legte immer
               rechts neben den Seitenkasten — auf einem 390 px breiten Telefon
               heisst das x = 410, und der Kasten lag ausserhalb des Bildes. Der
               Wächter hat es gemeldet („steht im Bild — rot"), bevor ein Mensch
               hinsah. Die STELLE ist Daten und bleibt, wo sie hingeschrieben
               wird; dass ihre Vorgabe vom Gerät abhängt, ist dasselbe Zugeständnis
               wie bei der Vorgabebreite in E690 — man legt etwas dorthin, wo der
               Mensch es sehen kann. */
            const sk = notizLesen(seite);
            const schon = eigeneKaesten(seite).length;
            const eng = (window.innerWidth || 1200) < 900;
            stelle = eng
                ? { x: sk.x, y: sk.y + 420 + schon * 150 }
                : { x: sk.x + sk.w + 60, y: sk.y + schon * 150 };
        }
        blockOrtSchreiben(b, { x: stelle.x, y: stelle.y, w: blockOrt(b).w });
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    /**
     * Zurück in den Text.
     *
     * `feldWeg` und nicht `updateBlock(id, { flaecheOrt: undefined })`: das
     * zweite liesse den Schlüssel stehen, und §9 ruht darauf, dass „kein
     * Feld" wirklich kein Feld ist (siehe `indexdb.ts`, `feldWeg`).
     *
     * Und `sichtbarIn` wird mit aufgeräumt: ein Block, der wieder im Text
     * steht, aber auf „nur Fläche" stünde, wäre nirgends zu sehen — der
     * Mensch hätte ihn zurückgeholt und sähe nichts.
     */
    const zurueckInText = (b) => {
        if (!b?.id)
            return;
        if (String(b.sichtbarIn) === 'flaeche')
            Store.updateBlock(b.id, { sichtbarIn: 'beides' });
        Store.feldWeg(b.id, 'flaecheOrt');
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    /** Wo der Block erscheinen soll — 'beides' | 'seite' | 'flaeche'. */
    const setzeZeigen = (b, wert) => {
        const kat = (typeof Register !== 'undefined') ? Register.seitenansichten : null;
        if (!b?.id || !kat || !kat.ZEIGEN.includes(wert))
            return;
        /* 'beides' ist die Vorgabe — und eine Vorgabe schreibt man nicht hin.
           Sonst trüge jeder je einmal umgeschaltete Block für immer ein Feld,
           das nichts sagt, und jede Sicherung würde grösser, ohne mehr zu
           wissen (§9). */
        if (wert === kat.ZEIGEN_VORGABE)
            Store.feldWeg(b.id, 'sichtbarIn');
        else
            Store.updateBlock(b.id, { sichtbarIn: wert });
        if (typeof App !== 'undefined')
            App.zeichneSeite();
    };
    /* ========================================================================
     * Zeichnen
     * ======================================================================*/
    const zeichne = (wrap, p) => {
        vorschlag = null;
        const flaeche = document.createElement('div');
        flaeche.className = 'pg-flaeche';
        flaeche.setAttribute('role', 'application');
        flaeche.setAttribute('aria-label', 'Fläche der Seite ' + (p.text || 'Ohne Titel'));
        /* Die bewegliche Ebene. Alles darin rechnet in Flächeneinheiten; der
           `transform` macht daraus Bildschirm (Punkt 1 oben). */
        const ebene = document.createElement('div');
        ebene.className = 'pg-fl-sicht';
        flaeche.appendChild(ebene);
        /* ======================================================================
         * DIE TINTE — eine SVG-Lage IN derselben bewegten Ebene wie die Kaesten
         * ----------------------------------------------------------------------
         * IN der Ebene, nicht daneben: so teilen sich Tinte und Kaesten EINEN
         * `transform`, und es gibt keine zweite Umrechnung. Genau daran ist es
         * zweimal schiefgegangen (E623 halbe Strichbreiten an zwei Stellen, E686
         * Handformel gegen Matrix); L219 hat es deshalb als Bedingung
         * aufgeschrieben, bevor eine Zeile entstand.
         *
         * `overflow: visible` statt eines riesigen Kastens: die Formen liegen in
         * Flaecheneinheiten um den Ursprung herum, und ein SVG von 1x1 zeigt sie
         * trotzdem alle. Ein Kasten von 40 000 Punkten waere dieselbe Sache mit
         * einer Zahl, die irgendwann jemand fuer eine Grenze haelt.
         *
         * `pointer-events: none` an der ganzen Lage: die Tinte faengt keinen
         * Griff. Wer in den Kasten tippt, trifft den Text; wer daneben tippt,
         * schiebt die Flaeche. Der Radierer sucht seine Form deshalb rechnend,
         * nicht ueber das getroffene Element - das ist ehrlicher, weil ein
         * Strich von 2,5 Punkten ohnehin kein Fingerziel ist. */
        const tinte = GfxShapes.sv('svg', { width: 1, height: 1, class: 'pg-fl-tinte' });
        const tinteDefs = GfxShapes.sv('defs');
        GfxShapes.pfeilMarke(tinteDefs, 'pfl' + String(p.id).slice(0, 6));
        tinte.appendChild(tinteDefs);
        ebene.appendChild(tinte);
        const kaesten = [];
        const kastenBauen = (plan) => {
            const b = plan.block;
            const kasten = document.createElement('div');
            kasten.className = 'pg-fl-notiz';
            if (plan.art === 'seite')
                kasten.dataset['flSeite'] = '1';
            else
                kasten.dataset['flBlock'] = String(b.id);
            kasten.style.left = plan.ort.x + 'px';
            kasten.style.top = plan.ort.y + 'px';
            kasten.style.width = plan.ort.w + 'px';
            const kopf = document.createElement('div');
            kopf.className = 'pg-fl-kopf';
            if (plan.art === 'seite') {
                /* DER KOPF DES SEITENKASTENS IST DER SEITENKOPF — UMGEZOGEN, NICHT
                   NACHGEBAUT. AFFiNEs Notiz trägt auf der Fläche Emoji und Titel in
                   einer eigenen Zeile (`edgeless-note-header.tsx:22-60`). Nachbauen
                   hiesse hier: ein zweites Titelfeld, das dieselbe Seite schreibt —
                   und eines von beiden wäre immer das veraltete (§8).
        
                   Stattdessen wandern die zwei Knoten, die `Kopfleiste.zeichne`
                   gerade angelegt hat, mit allen ihren Zuhörern hierher. Das hält
                   auch etwas am Leben, das niemand vermuten würde:
                   `menueband.ts:121` fragt `!!document.getElementById('title')`, um
                   zu wissen, ob überhaupt eine Seite offen ist. Ohne `#title` wäre
                   auf der Fläche das halbe Menüband aus. */
                const symAlt = wrap.querySelector('.pg-icon');
                const titelAlt = wrap.querySelector('#title');
                if (symAlt)
                    kopf.appendChild(symAlt);
                if (titelAlt)
                    kopf.appendChild(titelAlt);
                if (!symAlt) {
                    const sym = document.createElement('span');
                    sym.className = 'pg-icon';
                    sym.setAttribute('aria-hidden', 'true');
                    sym.textContent = b.icon || '📄';
                    kopf.appendChild(sym);
                }
                if (!titelAlt) {
                    const name = document.createElement('div');
                    name.className = 'pg-fl-name';
                    name.textContent = b.text || 'Ohne Titel';
                    kopf.appendChild(name);
                }
            }
            else {
                /* Ein Blockkasten sagt, WAS er ist — nicht, was drinsteht. Der Text
                   steht einen Zentimeter tiefer; ihn im Kopf zu wiederholen wäre
                   doppelt und bei einem langen Absatz eine abgeschnittene Zeile. */
                const typ = (typeof Register !== 'undefined' && Register.bloecke?.eines)
                    ? Register.bloecke.eines(b.type) : null;
                const sym = document.createElement('span');
                sym.className = 'pg-icon';
                sym.setAttribute('aria-hidden', 'true');
                sym.textContent = b.icon || typ?.icon || '¶';
                const name = document.createElement('div');
                name.className = 'pg-fl-name';
                name.textContent = typ?.name || 'Block';
                kopf.append(sym, name);
                /* „Nicht auf der Seite" — in WORTEN, nicht nur in einer Farbe (§38).
                   AFFiNE setzt dafür ein durchgestrichenes Auge
                   (`edgeless-auto-connect/src/index.ts:265-268`); ein Zeichen
                   allein sagt einem Vorleseprogramm nichts. */
                if (String(b.sichtbarIn) === 'flaeche') {
                    const hin = document.createElement('span');
                    hin.className = 'pg-fl-versteckt';
                    hin.textContent = 'nicht auf der Seite';
                    kopf.appendChild(hin);
                }
            }
            /* Der Menüknopf. Am Telefon ist er der EINZIGE Weg zurück — dort gibt
               es kein Rechtsklickmenü und keinen Griff (§37). */
            const menue = document.createElement('button');
            menue.type = 'button';
            menue.className = 'pg-fl-menue';
            menue.dataset['a'] = 'menu';
            menue.title = 'Was mit diesem Kasten geschehen soll';
            menue.setAttribute('aria-label', plan.art === 'seite' ? 'Menü des Seitenkastens' : 'Menü dieses Kastens');
            menue.textContent = '⋯';
            kopf.appendChild(menue);
            menue.addEventListener('click', (e) => { e.stopPropagation(); kastenMenue(menue, plan); });
            kasten.appendChild(kopf);
            const koerper = document.createElement('div');
            koerper.className = 'pg-fl-koerper';
            kasten.appendChild(koerper);
            if (plan.art === 'seite') {
                /* DERSELBE AUFRUF WIE AUF DER NORMALEN SEITE, nur mit dem anderen
                   Ort (E691). Wer hier eine zweite Zeichnung baut, hat zwei
                   Editoren, und einer von beiden ist immer der veraltete. */
                Inhaltsflaeche.zeichne(koerper, b, 'flaeche');
                if (!koerper.querySelector('.blk')) {
                    /* EIN LEERER SEITENKASTEN BLEIBT STEHEN, und er sagt, wofür.
                       Verschwände er, gäbe es kein Ziel mehr für den Rückweg — wer
                       alle Blöcke herausgezogen hat, käme nie wieder hinein. */
                    const leer = document.createElement('div');
                    leer.className = 'pg-fl-leer';
                    leer.textContent = 'Alles liegt auf der Fläche. Einen Kasten hierher ziehen bringt ihn zurück in den Text.';
                    koerper.appendChild(leer);
                }
            }
            else {
                koerper.appendChild(Blocks.render(b));
            }
            kaesten.push({ el: kasten, plan });
            ebene.appendChild(kasten);
            return kasten;
        };
        /* --- Das Menü eines Kastens ---------------------------------------- */
        const kastenMenue = (anker, plan) => {
            const r = anker.getBoundingClientRect();
            const b = plan.block;
            const nurFlaeche = String(b.sichtbarIn) === 'flaeche';
            const html = plan.art === 'seite'
                ? '<button data-a="fl-passend"><span class="mi">⛶</span>Alles ins Bild holen</button>'
                : '<button data-a="fl-zurueck"><span class="mi">▤</span>Zurück in den Text</button>' +
                    (nurFlaeche
                        ? '<button data-a="fl-zeigen"><span class="mi">👁</span>Auf der Seite wieder zeigen</button>'
                        : '<button data-a="fl-verstecken"><span class="mi">🚫</span>Auf der Seite ausblenden</button>');
            const menu = UI.menu(html, Math.min(r.left, innerWidth - 260), r.bottom + 4);
            menu.addEventListener('click', (e) => {
                const btn = e.target instanceof Element
                    ? e.target.closest('button[data-a]') : null;
                if (!btn)
                    return;
                menu.remove();
                if (btn.dataset['a'] === 'fl-passend')
                    passend();
                if (btn.dataset['a'] === 'fl-zurueck')
                    zurueckInText(b);
                if (btn.dataset['a'] === 'fl-verstecken')
                    setzeZeigen(b, 'flaeche');
                if (btn.dataset['a'] === 'fl-zeigen')
                    setzeZeigen(b, 'beides');
            });
        };
        /* --- Der Seitenkasten, dann die einzelnen ---------------------------- */
        const ort = notizLesen(p);
        const kasten = kastenBauen({
            art: 'seite', block: p, ort,
            merken: (neu) => { ort.x = neu.x; ort.y = neu.y; notizSchreiben(p, neu); }
        });
        for (const b of eigeneKaesten(p)) {
            const bo = blockOrt(b);
            kastenBauen({
                art: 'block', block: b, ort: bo,
                merken: (neu) => { bo.x = neu.x; bo.y = neu.y; blockOrtSchreiben(b, neu); }
            });
        }
        wrap.appendChild(flaeche);
        /* ======================================================================
         * Ausschnitt, Raster, Umrechnung
         * ====================================================================*/
        let sicht = sichtLesen(p.id) ?? { x: 0, y: 0, z: 1 };
        let werkzeug = 'zeiger';
        const stellen = (merken = true) => {
            const z = sicht.z;
            ebene.style.transform = `translate(${sicht.x}px, ${sicht.y}px) scale(${z})`;
            /* Das Raster wandert und wächst mit — genau das macht aus einer Fläche
               eine Fläche und nicht eine Seite mit Punkten darauf. */
            flaeche.style.backgroundSize = `${RASTER * z}px ${RASTER * z}px`;
            flaeche.style.backgroundPosition = `${sicht.x}px ${sicht.y}px`;
            const anzeige = flaeche.querySelector('.pg-fl-massstab');
            if (anzeige)
                anzeige.textContent = Math.round(z * 100) + ' %';
            if (merken)
                sichtSchreiben(p.id, sicht);
        };
        /** Bildschirm → Fläche. */
        const inFlaeche = (sx, sy) => {
            const k = flaeche.getBoundingClientRect();
            return { x: (sx - k.left - sicht.x) / sicht.z, y: (sy - k.top - sicht.y) / sicht.z };
        };
        /* Solange DIESE Fläche zu sehen ist, landet ein neuer Kasten in der
           Mitte des Ausschnitts — wie AFFiNEs Notiz-Werkzeug. */
        vorschlag = () => {
            const k = flaeche.getBoundingClientRect();
            const mitte = inFlaeche(k.left + k.width / 2, k.top + k.height / 3);
            return { x: Math.round(mitte.x - BLOCK_BREITE / 2), y: Math.round(mitte.y) };
        };
        /* Die Formen stehen HIER und nicht erst beim Malen weiter unten:
           `passend` rechnet sie mit, und eine Konstante, die erst nach ihrem
           ersten Leser entsteht, ist eine zeitliche Falle - sie geht gut, bis
           jemand den einen Aufruf vorzieht. */
        let formen = formenLesen(p).slice();
        let farbe = GfxShapes.PALETTE[0]?.[0] ?? '#529cca';
        let aktiv = null;
        /** Zoomen und dabei den Punkt unter dem Finger festhalten. */
        const massstab = (neu, haltX, haltY) => {
            const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, neu));
            const k = flaeche.getBoundingClientRect();
            const sx = haltX === undefined ? k.width / 2 : haltX - k.left;
            const sy = haltY === undefined ? k.height / 2 : haltY - k.top;
            /* Der Punkt in Flächeneinheiten, der unter dem Finger bleiben soll. */
            const fx = (sx - sicht.x) / sicht.z;
            const fy = (sy - sicht.y) / sicht.z;
            sicht = { x: sx - fx * z, y: sy - fy * z, z };
            stellen();
        };
        /** Alles ins Bild holen — AFFiNEs „Fit to screen". */
        const passend = () => {
            const k = flaeche.getBoundingClientRect();
            /* ALLES heisst ALLE KÄSTEN (E691). Der erste Stand rechnete nur mit
               dem Seitenkasten — und auf dem Bild hingen die zwei
               herausgezogenen Blöcke rechts ausserhalb, während die Leiste
               „100 %" meldete und der Knopf „ins Bild holen" hiess. Gefunden hat
               das nicht der Wächter, sondern das Bild (§55.1); seither hält
               `test574 §3b` es fest.
      
               `offsetWidth/Height` sind LAYOUT-Masse und vom `transform`
               unberührt — also schon Flächeneinheiten. Mit
               `getBoundingClientRect` wären sie mit z multipliziert, und die
               Rechnung liefe im Kreis. */
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            for (const { el, plan } of kaesten) {
                const bw = el.offsetWidth || plan.ort.w || vorgabeBreite();
                const bh = el.offsetHeight || 200;
                x0 = Math.min(x0, plan.ort.x);
                y0 = Math.min(y0, plan.ort.y);
                x1 = Math.max(x1, plan.ort.x + bw);
                y1 = Math.max(y1, plan.ort.y + bh);
            }
            /* UND DIE TINTE GEHOERT DAZU (E693). Zweimal in zwei Boegen hat das
               Bild dieselbe Luecke gezeigt: erst rechnete „ins Bild holen" nur mit
               dem Seitenkasten und liess die Bloecke draussen (E691), dann nur mit
               den Kaesten und liess die Formen draussen. Ein Knopf, der die
               Haelfte im Dunkeln laesst, ist ein falsches Versprechen (§32). */
            for (const form of formen) {
                const r = GfxShapes.rahmenVon(form);
                if (!Number.isFinite(r.x) || !Number.isFinite(r.y))
                    continue;
                x0 = Math.min(x0, r.x);
                y0 = Math.min(y0, r.y);
                x1 = Math.max(x1, r.x + r.w);
                y1 = Math.max(y1, r.y + r.h);
            }
            if (!Number.isFinite(x0)) {
                x0 = ort.x;
                y0 = ort.y;
                x1 = x0 + vorgabeBreite();
                y1 = y0 + 400;
            }
            const w = Math.max(1, x1 - x0);
            const h = Math.max(1, y1 - y0);
            if (!k.width || !k.height)
                return;
            const rand = 24;
            /* UNTEN STEHT DIE WERKZEUGLEISTE. Ohne diesen Streifen rechnet „ins
               Bild holen" den Kasten mittig und legt seine untere Hälfte hinter
               die Leiste — auf dem Telefon war genau das zu sehen. */
            const leisteHoch = 84;
            const nutzHoehe = Math.max(120, k.height - leisteHoch - rand);
            const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.min(1, (k.width - rand * 2) / w, (nutzHoehe - rand) / h)));
            sicht = {
                z,
                x: (k.width - w * z) / 2 - x0 * z,
                y: Math.max(rand, (nutzHoehe - h * z) / 2) - y0 * z
            };
            stellen();
        };
        /* ======================================================================
         * MALEN
         * ----------------------------------------------------------------------
         * Die Formen liegen am Seitenblock unter `shapes` - dasselbe Feld und
         * dasselbe Format wie im Whiteboard, gezeichnet vom selben Kern.
         * ====================================================================*/
        /** Die Tinte neu malen. Der `<defs>`-Knoten bleibt stehen - er traegt
         *  die Pfeilspitze, und wer ihn mit wegraeumt, nimmt jedem Pfeil die
         *  Spitze, ohne dass sich an den Formen etwas geaendert haette. */
        const malen = () => {
            [...tinte.childNodes].forEach(k => { if (k !== tinteDefs)
                tinte.removeChild(k); });
            for (const form of formen)
                tinte.appendChild(GfxShapes.zeichne(form, { pfeilMarke: 'pfl' + String(p.id).slice(0, 6) }));
        };
        /* Der Verlauf kommt aus dem Kern (E687) - derselbe wie im Whiteboard,
           in der Gedankenkarte und auf der Planflaeche. */
        const verlauf = GfxHistory.erstelle();
        /* Der Kern merkt sich ZEICHENKETTEN, keine Objekte - deshalb hier
           `JSON.stringify` und beim Zuruecknehmen `JSON.parse`. Eine Kopie als
           Objekt waere schneller und traegt dafuer das Risiko, dass zwei
           Staende heimlich dieselbe Liste teilen. */
        const abbild = () => JSON.stringify(formen);
        const merken = () => verlauf.merken(abbild());
        const sichern = () => { formenSchreiben(p, formen); malen(); };
        const schrittZurueck = () => {
            const vorher = verlauf.zurueck(abbild());
            if (vorher === null)
                return;
            formen = JSON.parse(vorher);
            sichern();
        };
        const schrittVor = () => {
            const nachher = verlauf.vor(abbild());
            if (nachher === null)
                return;
            formen = JSON.parse(nachher);
            sichern();
        };
        /** Welche Form liegt an dieser Stelle? Gerechnet, nicht ueber das
         *  getroffene Element: die Tinte nimmt keine Griffe an (siehe oben), und
         *  ein Strich von 2,5 Punkten waere ohnehin kein Fingerziel. */
        const formAn = (fx, fy, radius) => {
            for (let i = formen.length - 1; i >= 0; i--) {
                const form = formen[i];
                if (form?.art === 'stift') {
                    const pts = Array.isArray(form.pts) ? form.pts : [];
                    /* AN DER LINIE, NICHT NUR AN DEN PUNKTEN (E704). Seit das Absetzen
                       den Strich vereinfacht (RDP), hat eine gerade Linie nur noch ihre
                       zwei Enden — wer ihre Mitte radierte, traf nichts. Gemessen wird
                       der Abstand zu jedem Stück zwischen zwei Punkten; ein Punkt allein
                       ist ein Stück der Länge null, also trifft alles, was vorher traf. */
                    const nah = (a, b) => {
                        const ax = Number(a?.[0]), ay = Number(a?.[1]), bx = Number(b?.[0]), by = Number(b?.[1]);
                        const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
                        const t = l2 > 0 ? Math.max(0, Math.min(1, ((fx - ax) * dx + (fy - ay) * dy) / l2)) : 0;
                        return Math.hypot(ax + t * dx - fx, ay + t * dy - fy) <= radius;
                    };
                    if (pts.some((q, i) => nah(q, pts[i + 1] ?? q)))
                        return form;
                    continue;
                }
                const r = GfxShapes.rahmenVon(form);
                if (fx >= r.x - radius && fx <= r.x + r.w + radius &&
                    fy >= r.y - radius && fy <= r.y + r.h + radius)
                    return form;
            }
            return null;
        };
        const MALWERKZEUGE = ['stift', 'linie', 'pfeil', 'rechteck', 'ellipse'];
        const maltGerade = () => MALWERKZEUGE.includes(werkzeug) || werkzeug === 'radierer';
        malen();
        /* ======================================================================
         * Die Werkzeugleiste — dieselbe wie auf jeder anderen Fläche (E689)
         * ====================================================================*/
        const massstabZeigen = document.createElement('b');
        massstabZeigen.className = 'pg-fl-massstab';
        massstabZeigen.setAttribute('aria-live', 'polite');
        massstabZeigen.textContent = '100 %';
        const leiste = GfxToolbar.erstelle({
            klasse: 'pg-fl-tools',
            beschriftung: 'Werkzeuge der Fläche',
            /* Sechs Werkzeuge mehr als in E690, und jedes TUT etwas - genau das
               war die Bedingung aus L219: eine Leiste mit Knoepfen, die nichts
               bewirken, waere ein falsches Versprechen (Paragraph 32). */
            werkzeuge: Register.werkzeuge.auswahl(['zeiger', 'hand', 'stift', 'linie', 'pfeil', 'rechteck', 'ellipse', 'radierer']),
            aktiv: 'zeiger',
            aktionen: [
                { id: 'farbe', name: 'Farbe', titel: 'Farbe der Formen', sym: 'palette',
                    menue: true, kapsel: 'werkzeuge' },
                { id: 'zurueck', name: 'Rückgängig', titel: 'Rückgängig (Strg + Z)', sym: 'undo' },
                { id: 'kleiner', name: 'Kleiner', titel: 'Kleiner (Strg + Rad)', sym: 'minus' },
                { id: 'groesser', name: 'Grösser', titel: 'Grösser (Strg + Rad)', sym: 'plus' },
                { id: 'passend', name: 'Ins Bild', titel: 'Alles ins Bild holen', sym: 'maximize' }
            ],
            zusatz: { groesser: massstabZeigen },
            /* Das Farbmenue baut die Flaeche, der Kern zeigt es - dasselbe Muster
               wie im Whiteboard (E689). Jeder Tupfer traegt seinen NAMEN, weil
               Paragraph 38 keine Auskunft allein ueber Farbe zulaesst. */
            menue: (id) => {
                if (id !== 'farbe')
                    return null;
                const kasten = document.createElement('div');
                kasten.className = 'gfx-tb-farben';
                for (const [wert, name] of GfxShapes.PALETTE) {
                    const k = document.createElement('button');
                    k.type = 'button';
                    k.dataset['c'] = wert;
                    k.title = name;
                    k.setAttribute('aria-label', name);
                    k.style.background = wert;
                    if (wert === farbe)
                        k.classList.add('an');
                    k.addEventListener('click', () => { farbe = wert; leiste.schliesse(); });
                    kasten.appendChild(k);
                }
                return kasten;
            },
            aufWerkzeug: (id) => {
                werkzeug = id;
                flaeche.dataset['wz'] = id;
            },
            aufAktion: (id) => {
                if (id === 'zurueck')
                    schrittZurueck();
                if (id === 'kleiner')
                    massstab(sicht.z / 1.25);
                if (id === 'groesser')
                    massstab(sicht.z * 1.25);
                if (id === 'passend')
                    passend();
            }
        });
        flaeche.appendChild(leiste.element);
        flaeche.dataset['wz'] = werkzeug;
        if (typeof Register !== 'undefined' && Register.symbole)
            Register.symbole.fuelle(leiste.element);
        /* ======================================================================
         * Schieben, Ziehen, Zoomen
         * ====================================================================*/
        /** Was gerade unter dem Finger passiert. Bei `kasten` steht dabei,
         *  WELCHER — seit E691 sind es mehrere. */
        let zug = null;
        const finger = new Map();
        let kneifen = null;
        /* Wie auf der Tafel (E704). */
        let stiftGlatt = null;
        let stiftZeit = 0;
        let stiftBildGeplant = false;
        const r2 = (v) => Math.round(v * 100) / 100;
        const stiftNachziehen = () => {
            stiftBildGeplant = false;
            if (!aktiv || aktiv.art !== 'stift')
                return;
            const pfade = [...tinte.querySelectorAll('path')]
                .filter((pfad) => pfad.dataset.sid === String(aktiv.id));
            if (!pfade.length) {
                malen();
                return;
            }
            const d = GfxShapes.zeichne({ ...aktiv }).querySelector('path')?.getAttribute('d') || '';
            pfade.forEach((pfad) => pfad.setAttribute('d', d));
        };
        const beginnt = (e) => {
            finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (finger.size === 2) {
                const [a, b] = [...finger.values()];
                if (a && b)
                    kneifen = { abstand: Math.hypot(a.x - b.x, a.y - b.y), z: sicht.z };
                zug = null;
                return;
            }
            const ziel = e.target instanceof Element ? e.target : null;
            /* MIT EINEM MALWERKZEUG WIRD GEMALT - ausser ueber der Leiste und
               ausser im Kasten, denn dort gehoert der Zug dem Text. Genau
               deshalb liegt die Tinte auch ohne Griffe da: waere sie greifbar,
               muesste hier eine zweite Regel stehen, welche Lage gewinnt. */
            if (maltGerade() && !ziel?.closest('.gfx-tb-sockel') && !ziel?.closest('.pg-fl-notiz')) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                /* `setPointerCapture` WIRFT, wenn es den Zeiger nicht gibt - und ein
                   Wurf hier bricht den ganzen Handgriff ab, bevor die erste Form
                   entsteht. Das passiert nicht nur im Pruefstand: ein Zeiger, der
                   zwischen `pointerdown` und dieser Zeile schon wieder weg ist
                   (schneller Tipp, verlorener Stift, ein zweiter Finger), reicht.
                   Das Fangen ist eine Bequemlichkeit - ohne es endet der Strich,
                   wenn der Finger die Flaeche verlaesst -, kein Grund zum Abbruch. */
                try {
                    flaeche.setPointerCapture(e.pointerId);
                }
                catch { /* egal */ }
                merken();
                if (werkzeug === 'radierer') {
                    const treffer = formAn(punkt.x, punkt.y, 12 / sicht.z);
                    if (treffer) {
                        formen = formen.filter(x => x !== treffer);
                        sichern();
                    }
                    else
                        verlauf.letztenVerwerfen();
                    aktiv = { art: 'radieren' };
                    return;
                }
                aktiv = werkzeug === 'stift'
                    ? { id: Store.uid().slice(0, 8), art: 'stift', pts: [[r2(punkt.x), r2(punkt.y)]], farbe }
                    : { id: Store.uid().slice(0, 8), art: werkzeug, x: punkt.x, y: punkt.y, w: 0, h: 0, farbe };
                stiftGlatt = werkzeug === 'stift' && typeof InkStroke !== 'undefined'
                    ? InkStroke.glaetter([r2(punkt.x), r2(punkt.y)]) : null;
                stiftZeit = Number(e.timeStamp) || 0;
                formen.push(aktiv);
                malen();
                return;
            }
            /* AM KOPF ZIEHT MAN DEN KASTEN, sonst die Fläche. Der Körper des
               Kastens gehört dem Text: wer darin zieht, markiert Worte. */
            if (ziel?.closest('.pg-fl-menue')) {
                return;
            }
            else if (ziel?.closest('.pg-fl-kopf') && werkzeug === 'zeiger') {
                const el = ziel.closest('.pg-fl-notiz');
                const eintrag = kaesten.find(k => k.el === el);
                if (el && eintrag) {
                    zug = {
                        art: 'kasten', sx: e.clientX, sy: e.clientY,
                        ax: eintrag.plan.ort.x, ay: eintrag.plan.ort.y, el, plan: eintrag.plan
                    };
                }
            }
            else if (ziel?.closest('.gfx-tb-sockel')) {
                return;
            }
            else if (werkzeug === 'hand' || e.button === 1 || !ziel?.closest('.pg-fl-notiz')) {
                zug = { art: 'flaeche', sx: e.clientX, sy: e.clientY, ax: sicht.x, ay: sicht.y };
            }
            if (zug)
                flaeche.setPointerCapture(e.pointerId);
        };
        const bewegt = (e) => {
            if (finger.has(e.pointerId))
                finger.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (aktiv) {
                const punkt = inFlaeche(e.clientX, e.clientY);
                if (aktiv.art === 'radieren') {
                    const treffer = formAn(punkt.x, punkt.y, 12 / sicht.z);
                    if (treffer) {
                        formen = formen.filter(x => x !== treffer);
                        sichern();
                    }
                    return;
                }
                if (aktiv.art === 'stift') {
                    const gesammelt = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
                    for (const ereignis of (gesammelt.length ? gesammelt : [e])) {
                        const roh = inFlaeche(ereignis.clientX, ereignis.clientY);
                        const jetzt = Number(ereignis.timeStamp) || stiftZeit + 16;
                        const dt = Math.max(1, jetzt - stiftZeit);
                        stiftZeit = jetzt;
                        const q = stiftGlatt ? stiftGlatt([roh.x, roh.y], dt) : [roh.x, roh.y];
                        const letzter = aktiv.pts[aktiv.pts.length - 1];
                        if (letzter && Math.hypot(q[0] - letzter[0], q[1] - letzter[1]) < 0.6 / Math.max(0.1, sicht.z))
                            continue;
                        aktiv.pts.push([r2(q[0]), r2(q[1])]);
                    }
                    if (!stiftBildGeplant) {
                        stiftBildGeplant = true;
                        requestAnimationFrame(stiftNachziehen);
                    }
                    return;
                }
                aktiv.w = punkt.x - aktiv.x;
                aktiv.h = punkt.y - aktiv.y;
                malen();
                return;
            }
            if (kneifen && finger.size === 2) {
                const [a, b] = [...finger.values()];
                if (!a || !b)
                    return;
                const jetzt = Math.hypot(a.x - b.x, a.y - b.y);
                if (kneifen.abstand > 0)
                    massstab(kneifen.z * (jetzt / kneifen.abstand), (a.x + b.x) / 2, (a.y + b.y) / 2);
                return;
            }
            if (!zug)
                return;
            const dx = e.clientX - zug.sx;
            const dy = e.clientY - zug.sy;
            if (zug.art === 'flaeche') {
                sicht = { x: zug.ax + dx, y: zug.ay + dy, z: sicht.z };
                stellen(false);
            }
            else if (zug.el && zug.plan) {
                /* Der Kasten wandert in FLÄCHENEINHEITEN, also geteilt durch z —
                   ohne das läuft er bei 50 % Zoom doppelt so weit wie der Finger. */
                zug.plan.ort.x = zug.ax + dx / sicht.z;
                zug.plan.ort.y = zug.ay + dy / sicht.z;
                zug.el.style.left = zug.plan.ort.x + 'px';
                zug.el.style.top = zug.plan.ort.y + 'px';
                /* ÜBER DEM SEITENKASTEN HEISST: zurück in den Text. Der Kasten
                   darunter leuchtet, solange man darüber schwebt — sonst wäre das
                   Loslassen eine Überraschung. */
                if (zug.plan.art === 'block') {
                    const drueber = ueberSeitenkasten(e.clientX, e.clientY);
                    kasten.classList.toggle('pg-fl-ziel', drueber);
                    zug.el.classList.toggle('pg-fl-zurueck', drueber);
                }
            }
        };
        /** Liegt dieser Bildschirmpunkt über dem Seitenkasten? */
        const ueberSeitenkasten = (sx, sy) => {
            const r = kasten.getBoundingClientRect();
            return sx >= r.left && sx <= r.right && sy >= r.top && sy <= r.bottom;
        };
        const endet = (e) => {
            finger.delete(e.pointerId);
            if (finger.size < 2)
                kneifen = null;
            if (aktiv) {
                const fertig = aktiv;
                aktiv = null;
                if (fertig.art === 'radieren')
                    return;
                if (fertig.art === 'stift' && fertig.pts.length >= 2) {
                    /* Die Spitze endet, wo der Stift sich hob (E704). */
                    if (e.type === 'pointerup') {
                        const roh = inFlaeche(e.clientX, e.clientY);
                        const letzter = fertig.pts[fertig.pts.length - 1];
                        if (Math.hypot(roh.x - letzter[0], roh.y - letzter[1]) >= 0.3)
                            fertig.pts.push([r2(roh.x), r2(roh.y)]);
                    }
                    if (typeof InkGeometry !== 'undefined' && fertig.pts.length > 3) {
                        fertig.pts = InkGeometry.simplify(fertig.pts, 0.5 / Math.max(0.1, sicht.z))
                            .map((q) => [r2(Number(q[0])), r2(Number(q[1]))]);
                    }
                }
                stiftGlatt = null;
                /* EIN TIPP IST KEINE FORM. Ohne diese Zeile bleibt bei jedem Klick
                   ein Punkt oder ein Rechteck von null Punkten liegen - unsichtbar,
                   aber in der Sicherung. Dieselbe Regel hat das Whiteboard. */
                const klein = fertig.art === 'stift'
                    ? fertig.pts.length < 2
                    : Math.abs(fertig.w) < 4 && Math.abs(fertig.h) < 4;
                if (klein) {
                    formen = formen.filter(x => x !== fertig);
                    verlauf.letztenVerwerfen();
                }
                sichern();
                return;
            }
            if (!zug)
                return;
            const jetzt = zug;
            zug = null;
            if (jetzt.art === 'flaeche') {
                sichtSchreiben(p.id, sicht);
                return;
            }
            if (!jetzt.plan)
                return;
            kasten.classList.remove('pg-fl-ziel');
            jetzt.el?.classList.remove('pg-fl-zurueck');
            /* Losgelassen über dem Seitenkasten: der Block gehört wieder in den
               Text. Das ist der Rückweg, den §9 verlangt — was auf die Fläche
               kann, muss auch zurück. */
            if (jetzt.plan.art === 'block' && ueberSeitenkasten(e.clientX, e.clientY)) {
                zurueckInText(jetzt.plan.block);
                return;
            }
            jetzt.plan.merken(jetzt.plan.ort);
        };
        /* DIE TASTE GEHOERT DER FLAECHE (E682). Derselbe Griff wie im
           Whiteboard: die Flaeche ist fokussierbar, nimmt Strg+Z selbst und
           sagt der Schale mit `preventDefault`, dass die Taste genommen ist -
           sonst nimmt der Block seinen Schritt zurueck UND der Seitenverlauf
           baut die Seite neu, mit frischen Kennungen fuer jeden Block
           (test568). Im Text gilt das nicht: dort gehoert Strg+Z dem Feld. */
        flaeche.tabIndex = 0;
        flaeche.addEventListener('keydown', (e) => {
            const ziel = e.target;
            if (ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'TEXTAREA' || ziel.isContentEditable))
                return;
            if (!(e.ctrlKey || e.metaKey))
                return;
            const taste = e.key.toLowerCase();
            if (taste === 'z' && !e.shiftKey) {
                e.preventDefault();
                schrittZurueck();
            }
            else if ((taste === 'z' && e.shiftKey) || (taste === 'y' && !e.shiftKey)) {
                e.preventDefault();
                schrittVor();
            }
        });
        flaeche.addEventListener('pointerdown', beginnt);
        flaeche.addEventListener('pointermove', bewegt);
        flaeche.addEventListener('pointerup', endet);
        flaeche.addEventListener('pointercancel', endet);
        /* ======================================================================
         * EINEN BLOCK AUS DEM TEXT AUF DIE FLÄCHE ZIEHEN (E691)
         * ----------------------------------------------------------------------
         * Das Ziehen selbst gehört dem Editor — er kann es seit Langem
         * (`editor.ts:1990-2045`, HTML5 mit `draggable` am Griff `⋮⋮`). Hier
         * steht nur das ABLEGEN. Einen zweiten Ziehmechanismus daneben zu bauen
         * wäre genau das, wovor §8 warnt; darum reicht der Editor die Kennung
         * seit diesem Bogen über `dataTransfer` heraus, und die Fläche liest
         * sie.
         *
         * DER EIGENE MIME-NAME ist kein Schmuck: ohne ihn nähme die Fläche auch
         * eine Datei oder einen Text aus einem anderen Fenster für einen Block.
         * ====================================================================*/
        const istBlockZug = (e) => !!e.dataTransfer && [...e.dataTransfer.types].includes('application/x-redion-block');
        flaeche.addEventListener('dragover', (e) => {
            if (!istBlockZug(e))
                return;
            e.preventDefault();
            if (e.dataTransfer)
                e.dataTransfer.dropEffect = 'move';
            /* Nur wo der Block WIRKLICH landen würde. Über einem Kasten ordnet
               der Editor ihn ein, und dann wäre ein leuchtender Rand eine
               Lüge. */
            const ueberKasten = e.target instanceof Element && !!e.target.closest('.pg-fl-notiz');
            flaeche.classList.toggle('pg-fl-nimmt', !ueberKasten);
        });
        flaeche.addEventListener('dragleave', (e) => {
            if (e.target === flaeche)
                flaeche.classList.remove('pg-fl-nimmt');
        });
        flaeche.addEventListener('drop', (e) => {
            flaeche.classList.remove('pg-fl-nimmt');
            if (!istBlockZug(e))
                return;
            const id = e.dataTransfer?.getData('application/x-redion-block') ?? '';
            const b = id ? Store.getBlock(id) : null;
            if (!b)
                return;
            /* ÜBER EINEM KASTEN GEHÖRT DER ZUG DEM EDITOR. Dort ordnet er den
               Block zwischen zwei andere — dieselbe Geste, die sie auf der
               normalen Seite hat. Deshalb hier KEIN `stopPropagation`: der
               Zuhörer des Editors liegt eine Ebene höher und soll drankommen. */
            if (e.target instanceof Element && e.target.closest('.pg-fl-notiz'))
                return;
            e.preventDefault();
            e.stopPropagation();
            const fp = inFlaeche(e.clientX, e.clientY);
            aufFlaeche(b, { x: Math.round(fp.x), y: Math.round(fp.y) });
        });
        /* Rad schiebt, Strg + Rad zoomt — wie in AFFiNE und im Whiteboard. */
        flaeche.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                massstab(sicht.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX, e.clientY);
                return;
            }
            sicht = { x: sicht.x - e.deltaX, y: sicht.y - e.deltaY, z: sicht.z };
            stellen();
        }, { passive: false });
        /* Beim ERSTEN Öffnen ins Bild holen; danach steht, wo der Mensch war.
           `requestAnimationFrame`, weil die Höhe des Kastens erst nach dem
           Zeichnen bekannt ist — vorher wäre `offsetHeight` null und der
           Zoomfaktor eine Erfindung. */
        if (sichtLesen(p.id))
            stellen(false);
        else
            requestAnimationFrame(() => passend());
        stellen(false);
    };
    return { zeichne, aufFlaeche, zurueckInText, setzeZeigen };
})();
window.Seitenflaeche = Seitenflaeche;
