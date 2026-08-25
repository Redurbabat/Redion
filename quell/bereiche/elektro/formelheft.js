"use strict";
/* ============================================================================
 * bereiche/elektro/formelheft.ts — das Formelheft, das mitschwebt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/elektro/formelheft.ts`.
 * ----------------------------------------------------------------------------
 * WOZU EIN SCHWEBENDES HEFT
 *
 * Beim Zeichnen und Rechnen braucht man die Formel NEBEN der Arbeit, nicht
 * statt ihrer. Ein Heft, das die Seite ersetzt, zwingt zum Hin- und
 * Herspringen; eines, das darüber schwebt, bleibt offen, während man
 * weiterzeichnet. Deshalb ist es ein Fenster und kein Bereich:
 *
 *   · es liegt über allem und lässt sich frei verschieben
 *   · es bleibt offen, wenn die Seite wechselt
 *   · es merkt sich, wo es stand und welche Seite offen war
 *
 * ZWEI HEFTE IN EINEM
 *
 *   Formeln    Redions eigene Sammlung aus `register/elektroformeln.js` —
 *              durchsuchbar und RECHENBAR: Werte einsetzen, Ergebnis lesen,
 *              Rechenweg ansehen.
 *   Mein Heft  ein eigenes PDF, das man einmal lädt und danach durchblättert.
 *              Es bleibt als normaler Redion-Anhang liegen und geht durch
 *              Sicherung und Wiederherstellung wie jede andere Datei.
 *
 * WARUM KEIN HEFT MITGELIEFERT WIRD. Eine gescannte Formelsammlung ist
 * fremdes Lehrmaterial mit eigenem Urheberrecht. Redion liefert deshalb die
 * FÄHIGKEIT, ein Heft zu benutzen, und eine eigene, selbst geschriebene
 * Sammlung dazu — die Formeln selbst gehören niemandem, die Auswahl und der
 * Satz eines fremden Hefts schon.
 *
 * ALLES BLEIBT LOKAL. Das geladene PDF liegt in der IndexedDB dieses
 * Browsers, wie jeder andere Anhang. Es geht an keinen Server.
 * ==========================================================================*/
const Formelheft = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    /* Was sich das Heft über Sitzungen hinweg merkt. Alles in `Store.meta` —
       es gehört dem Menschen, nicht einem Dokument. */
    const M_ORT = 'elektro:heftOrt'; /* wo das Fenster stand */
    const M_KAPITEL = 'elektro:heftKapitel'; /* welches Kapitel offen war */
    const M_FAVORITEN = 'elektro:heftFavoriten'; /* gemerkte Formeln */
    const M_PDF = 'elektro:heftPdf'; /* Kennung des eigenen Hefts */
    const M_PDFSEITE = 'elektro:heftPdfSeite'; /* welche Seite zuletzt offen */
    const M_PDFFAV = 'elektro:heftPdfFavoriten'; /* gemerkte PDF-Seiten */
    const merke = (schluessel, wert) => {
        if (typeof Store !== 'undefined')
            Store.setMeta(schluessel, wert);
    };
    const gemerkt = (schluessel, vorgabe) => (typeof Store !== 'undefined') ? Store.getMeta(schluessel, vorgabe) : vorgabe;
    const favoriten = () => {
        const roh = gemerkt(M_FAVORITEN, []);
        return Array.isArray(roh) ? roh.map(String) : [];
    };
    const favoritUmschalten = (id) => {
        const liste = favoriten();
        const i = liste.indexOf(id);
        if (i >= 0)
            liste.splice(i, 1);
        else
            liste.push(id);
        merke(M_FAVORITEN, liste);
        return i < 0;
    };
    const seitenFavoriten = () => {
        const roh = gemerkt(M_PDFFAV, []);
        return Array.isArray(roh) ? roh.map(Number).filter(n => n > 0) : [];
    };
    const seiteUmschalten = (nr) => {
        const liste = seitenFavoriten();
        const i = liste.indexOf(nr);
        if (i >= 0)
            liste.splice(i, 1);
        else
            liste.push(nr);
        liste.sort((a, b) => a - b);
        merke(M_PDFFAV, liste);
        return i < 0;
    };
    /* Nur EIN Heft zur Zeit — ein zweites Fenster wäre ein zweiter Zustand. */
    let fenster = null;
    const offen = () => !!fenster && document.body.contains(fenster);
    const schliessen = () => { fenster?.remove(); fenster = null; };
    /* ------------------------------------------------------------------------
     * DER RECHNER AN DER FORMEL (Punkte 61–90)
     * ------------------------------------------------------------------------
     * Jede Formel bekommt Eingabefelder für ihre Grössen und eine Auswahl,
     * WONACH gesucht wird. Das gesuchte Feld wird gesperrt, statt es zu
     * verstecken: so sieht man, welche Grösse gerade herauskommt, und die
     * Felder springen beim Umschalten nicht durcheinander.
     * ----------------------------------------------------------------------*/
    const rechnerHtml = (id) => {
        const f = Register.elektroformeln.holen(id);
        if (!f)
            return '';
        const loesbar = Register.elektroformeln.loesbarNach(id);
        return `<div class="fh-rechner" data-formel="${esc(id)}">` +
            `<div class="fh-gesucht"><span>Gesucht</span>` +
            loesbar.map((z, i) => `<button data-gesucht="${esc(z)}"${i === 0 ? ' class="an"' : ''}>${esc(z)}</button>`).join('') +
            `</div>` +
            `<div class="fh-felder">` +
            f.groessen.map((x) => `<label class="fh-feld" data-fuer="${esc(x.zeichen)}">` +
                `<span class="fh-zeichen">${esc(x.zeichen)}</span>` +
                `<input type="text" inputmode="decimal" data-g="${esc(x.zeichen)}" ` +
                `placeholder="${esc(x.name)}" aria-label="${esc(x.name)}">` +
                `<span class="fh-einheit">${esc(x.einheit)}</span></label>`).join('') +
            `</div>` +
            (f.annahme ? `<p class="fh-annahme">⚠ ${esc(f.annahme)}</p>` : '') +
            `<div class="fh-ergebnis" role="status" aria-live="polite"></div>` +
            `</div>`;
    };
    const formelHtml = (f, fav) => `<article class="fh-formel" data-id="${esc(f.id)}">` +
        `<header><b>${esc(f.schreibweise)}</b>` +
        `<button class="fh-stern${fav.includes(f.id) ? ' an' : ''}" data-fav="${esc(f.id)}" ` +
        `title="Merken" aria-label="Formel merken">★</button></header>` +
        `<p class="fh-erkl">${esc(f.erklaerung)}</p>` +
        `<div class="fh-groessen">` + f.groessen.map((x) => `<span title="${esc(x.was || x.name)}"><i>${esc(x.zeichen)}</i> ${esc(x.name)}` +
        (x.einheit ? ` <em>${esc(x.einheit)}</em>` : '') + `</span>`).join('') + `</div>` +
        rechnerHtml(f.id) + `</article>`;
    /* ------------------------------------------------------------------------
     * DAS EIGENE PDF
     * ------------------------------------------------------------------------
     * Es liegt als normaler Redion-Anhang in der IndexedDB — dieselbe Ablage
     * wie Bilder und Aufnahmen, also stückweise gespeichert und in `.redion`
     * mitgesichert. Gerendert wird mit demselben pdf.js, das der PDF-Bereich
     * schon benutzt: kein zweiter Leser, keine zweite Bibliothek.
     * ----------------------------------------------------------------------*/
    const pdfLaden = async () => {
        const eingabe = document.createElement('input');
        eingabe.type = 'file';
        eingabe.accept = '.pdf,application/pdf';
        eingabe.addEventListener('change', async () => {
            const datei = eingabe.files?.[0];
            if (!datei)
                return;
            UI.toast('Heft wird abgelegt …');
            try {
                /* Über den gewöhnlichen Dateiweg — stückweise, ohne alles in den
                   Arbeitsspeicher zu holen (§14). Ein 90-seitiges Heft kann gross
                   sein, und es soll auch auf dem Telefon gehen. */
                const angelegt = await Dateien.ablegen(datei, null);
                merke(M_PDF, angelegt.id);
                merke(M_PDFSEITE, 1);
                UI.toast('✅ Heft geladen: ' + datei.name);
                neuMalen();
            }
            catch (e) {
                UI.toast('⛔ ' + (e instanceof Error ? e.message : String(e)));
            }
        });
        eingabe.click();
    };
    /** Das geladene Heft wieder entfernen — die Datei bleibt in der Ablage. */
    const pdfLoesen = () => {
        merke(M_PDF, '');
        merke(M_PDFSEITE, 1);
        neuMalen();
    };
    let pdfDoc = null;
    let pdfDateiId = '';
    /** Eine Seite des eigenen Hefts zeichnen. Gibt null, wenn keins da ist. */
    const pdfSeite = async (nr, breite) => {
        const id = String(gemerkt(M_PDF, ''));
        if (!id)
            return null;
        if (!pdfDoc || pdfDateiId !== id) {
            const lib = await PdfFremd.laden();
            const blob = await Dateien.alsBlob(id);
            if (!blob)
                return null;
            pdfDoc = await lib.getDocument({ data: await blob.arrayBuffer() }).promise;
            pdfDateiId = id;
        }
        const anzahl = pdfDoc.numPages;
        const seite = Math.max(1, Math.min(anzahl, Math.round(nr) || 1));
        const s = await pdfDoc.getPage(seite);
        const roh = s.getViewport({ scale: 1 });
        /* Auf die Fensterbreite skalieren, aber nicht kleiner als lesbar. */
        const skala = Math.max(0.7, Math.min(3, breite / roh.width));
        const vp = s.getViewport({ scale: skala });
        const leinwand = document.createElement('canvas');
        leinwand.width = Math.round(vp.width);
        leinwand.height = Math.round(vp.height);
        await s.render({ canvasContext: leinwand.getContext('2d'), viewport: vp }).promise;
        return { seiten: anzahl, nr: seite, bild: leinwand.toDataURL('image/png') };
    };
    /* ------------------------------------------------------------------------
     * DAS FENSTER
     * ----------------------------------------------------------------------*/
    let neuMalen = () => { };
    const oeffne = (kapitelWunsch) => {
        if (offen()) {
            if (kapitelWunsch) {
                merke(M_KAPITEL, kapitelWunsch);
                neuMalen();
            }
            return fenster;
        }
        const f = document.createElement('div');
        f.className = 'fh-fenster';
        f.setAttribute('role', 'dialog');
        f.setAttribute('aria-label', 'Formelheft');
        fenster = f;
        /* Wo es zuletzt stand — aber nie ausserhalb des Bildes. Ein Fenster,
           das nach einem Bildschirmwechsel unerreichbar ist, ist verloren. */
        const ort = gemerkt(M_ORT, { x: 0, y: 0, w: 0, h: 0 });
        const breite = Math.min(Math.max(ort.w || 420, 320), window.innerWidth - 20);
        const hoehe = Math.min(Math.max(ort.h || 520, 260), window.innerHeight - 20);
        f.style.width = breite + 'px';
        f.style.height = hoehe + 'px';
        f.style.left = Math.max(8, Math.min(ort.x || (window.innerWidth - breite - 30), window.innerWidth - breite - 8)) + 'px';
        f.style.top = Math.max(8, Math.min(ort.y || 90, window.innerHeight - hoehe - 8)) + 'px';
        document.body.appendChild(f);
        /* --- Inhalt ---------------------------------------------------------- */
        let suchtext = '';
        let pdfModus = false;
        const male = async () => {
            const kapitel = String(gemerkt(M_KAPITEL, 'grund'));
            const fav = favoriten();
            const hatPdf = !!String(gemerkt(M_PDF, ''));
            const kopf = `<div class="fh-kopf" data-griff>` +
                `<span class="fh-titel">📐 Formelheft</span>` +
                `<div class="fh-kopfknoepfe">` +
                `<button data-a="pdf" class="${pdfModus ? 'an' : ''}" ` +
                `title="Mein eigenes Heft" aria-label="Mein eigenes Heft">📕</button>` +
                `<button data-a="zu" title="Schliessen" aria-label="Schliessen">✕</button>` +
                `</div></div>`;
            if (pdfModus) {
                const nr = Number(gemerkt(M_PDFSEITE, 1)) || 1;
                const favS = seitenFavoriten();
                if (!hatPdf) {
                    f.innerHTML = kopf +
                        `<div class="fh-leer">` +
                        `<p>Hier kommt <b>dein eigenes Formelheft</b> hin — als PDF.</p>` +
                        `<p class="fh-klein">Es bleibt in diesem Browser und geht an keinen Server. ` +
                        `In der Sicherung ist es mit dabei.</p>` +
                        `<button class="prim" data-a="laden">Heft als PDF laden</button></div>`;
                    return;
                }
                f.innerHTML = kopf +
                    `<div class="fh-pdf"><div class="fh-pdfbild">Seite wird geholt …</div></div>` +
                    `<div class="fh-pdffuss">` +
                    `<button data-a="zurueck" aria-label="Vorige Seite">‹</button>` +
                    `<input class="fh-nr" type="number" min="1" value="${nr}" aria-label="Seite">` +
                    `<span class="fh-von">von …</span>` +
                    `<button data-a="vor" aria-label="Nächste Seite">›</button>` +
                    `<button class="fh-stern${favS.includes(nr) ? ' an' : ''}" data-a="seitefav" ` +
                    `title="Seite merken" aria-label="Seite merken">★</button>` +
                    (favS.length ? `<span class="fh-favseiten">` + favS.map(s => `<button data-springe="${s}"${s === nr ? ' class="an"' : ''}>${s}</button>`).join('') +
                        `</span>` : '') +
                    `<button data-a="loesen" class="fh-loesen" title="Anderes Heft laden">⤒</button>` +
                    `</div>`;
                const kasten = f.querySelector('.fh-pdf');
                const stand = await pdfSeite(nr, kasten.clientWidth - 16);
                if (!stand) {
                    kasten.innerHTML = '<div class="fh-leer"><p>Das Heft lässt sich nicht öffnen.</p></div>';
                    return;
                }
                kasten.innerHTML = `<img src="${stand.bild}" alt="Seite ${stand.nr}">`;
                const von = f.querySelector('.fh-von');
                if (von)
                    von.textContent = 'von ' + stand.seiten;
                const feld = f.querySelector('.fh-nr');
                if (feld) {
                    feld.max = String(stand.seiten);
                    feld.value = String(stand.nr);
                }
                return;
            }
            /* Die eigene Sammlung */
            const kapitelListe = Register.elektroformeln.kapitel();
            const treffer = suchtext
                ? Register.elektroformeln.suche(suchtext)
                : (kapitel === 'fav'
                    ? fav.map((id) => Register.elektroformeln.holen(id)).filter(Boolean)
                    : Register.elektroformeln.imKapitel(kapitel));
            f.innerHTML = kopf +
                `<div class="fh-suche"><input type="search" placeholder="Formel oder Grösse suchen …" ` +
                `value="${esc(suchtext)}" aria-label="Formel suchen"></div>` +
                `<div class="fh-kapitel">` +
                (fav.length ? `<button data-k="fav"${kapitel === 'fav' && !suchtext ? ' class="an"' : ''}>` +
                    `★ ${fav.length}</button>` : '') +
                kapitelListe.map(k => `<button data-k="${esc(k[0])}"${k[0] === kapitel && !suchtext ? ' class="an"' : ''}>` +
                    `${esc(k[1])}</button>`).join('') + `</div>` +
                `<div class="fh-inhalt">` +
                (treffer.length
                    ? treffer.map((x) => formelHtml(x, fav)).join('')
                    : `<div class="fh-leer"><p>Nichts gefunden.</p></div>`) +
                `</div>`;
        };
        neuMalen = () => { void male(); };
        /* --- Verschieben und Grösse ändern ------------------------------------ */
        let zieht = null;
        f.addEventListener('pointerdown', e => {
            const ziel = e.target;
            const amGriff = ziel.closest('[data-griff]');
            const amRand = ziel.classList.contains('fh-groesse');
            if (!amGriff && !amRand)
                return;
            if (ziel.closest('button'))
                return;
            const r = f.getBoundingClientRect();
            zieht = amRand
                ? { dx: e.clientX - r.width, dy: e.clientY - r.height, art: 'groesse' }
                : { dx: e.clientX - r.left, dy: e.clientY - r.top, art: 'ort' };
            f.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        f.addEventListener('pointermove', e => {
            if (!zieht)
                return;
            if (zieht.art === 'ort') {
                /* Immer im Bild bleiben — sonst schiebt man das Heft weg und
                   bekommt es nicht zurück. */
                const b = f.offsetWidth, h = f.offsetHeight;
                f.style.left = Math.max(0, Math.min(window.innerWidth - b, e.clientX - zieht.dx)) + 'px';
                f.style.top = Math.max(0, Math.min(window.innerHeight - h, e.clientY - zieht.dy)) + 'px';
            }
            else {
                f.style.width = Math.max(300, Math.min(window.innerWidth - 20, e.clientX - zieht.dx)) + 'px';
                f.style.height = Math.max(240, Math.min(window.innerHeight - 20, e.clientY - zieht.dy)) + 'px';
            }
        });
        const zugEnde = () => {
            if (!zieht)
                return;
            const war = zieht.art;
            zieht = null;
            const r = f.getBoundingClientRect();
            merke(M_ORT, { x: Math.round(r.left), y: Math.round(r.top),
                w: Math.round(r.width), h: Math.round(r.height) });
            if (war === 'groesse' && pdfModus)
                neuMalen();
        };
        f.addEventListener('pointerup', zugEnde);
        f.addEventListener('pointercancel', zugEnde);
        /* --- Klicks ----------------------------------------------------------- */
        f.addEventListener('click', e => {
            const b = e.target.closest('[data-a],[data-k],[data-fav],[data-gesucht],[data-springe]');
            if (!b)
                return;
            if (b.dataset.a === 'zu')
                return schliessen();
            if (b.dataset.a === 'pdf') {
                pdfModus = !pdfModus;
                return neuMalen();
            }
            if (b.dataset.a === 'laden')
                return void pdfLaden();
            if (b.dataset.a === 'loesen')
                return pdfLoesen();
            if (b.dataset.a === 'zurueck' || b.dataset.a === 'vor') {
                const nr = Number(gemerkt(M_PDFSEITE, 1)) || 1;
                merke(M_PDFSEITE, Math.max(1, nr + (b.dataset.a === 'vor' ? 1 : -1)));
                return neuMalen();
            }
            if (b.dataset.a === 'seitefav') {
                seiteUmschalten(Number(gemerkt(M_PDFSEITE, 1)) || 1);
                return neuMalen();
            }
            if (b.dataset.springe) {
                merke(M_PDFSEITE, Number(b.dataset.springe));
                return neuMalen();
            }
            if (b.dataset.k) {
                merke(M_KAPITEL, b.dataset.k);
                suchtext = '';
                return neuMalen();
            }
            if (b.dataset.fav) {
                favoritUmschalten(b.dataset.fav);
                return neuMalen();
            }
            /* Die gesuchte Grösse umschalten — und gleich neu rechnen. */
            if (b.dataset.gesucht) {
                const rechner = b.closest('.fh-rechner');
                rechner.querySelectorAll('[data-gesucht]').forEach(x => x.classList.remove('an'));
                b.classList.add('an');
                return rechne(rechner);
            }
        });
        /* --- Eingaben --------------------------------------------------------- */
        f.addEventListener('input', e => {
            const feld = e.target;
            if (feld.type === 'search') {
                suchtext = feld.value;
                return neuMalen();
            }
            if (feld.classList.contains('fh-nr')) {
                merke(M_PDFSEITE, Math.max(1, Number(feld.value) || 1));
                return neuMalen();
            }
            const rechner = feld.closest('.fh-rechner');
            if (rechner)
                rechne(rechner);
        });
        /* --- Rechnen ---------------------------------------------------------- */
        const rechne = (rechner) => {
            const id = rechner.dataset.formel || '';
            const gesucht = rechner.querySelector('[data-gesucht].an')?.dataset.gesucht || '';
            const werte = {};
            rechner.querySelectorAll('[data-g]').forEach(feld => {
                const z = feld.dataset.g || '';
                /* Das gesuchte Feld wird gesperrt statt versteckt — sonst springen
                   die Felder beim Umschalten, und man verliert die Übersicht. */
                const istGesucht = z === gesucht;
                feld.disabled = istGesucht;
                feld.closest('.fh-feld')?.classList.toggle('gesucht', istGesucht);
                if (istGesucht)
                    return;
                /* Komma UND Punkt annehmen — auf einer Schweizer Tastatur tippt man
                   1450,5, und daran darf keine Rechnung scheitern. */
                const roh = feld.value.trim().replace(',', '.');
                if (roh !== '')
                    werte[z] = Number(roh);
            });
            const anzeige = rechner.querySelector('.fh-ergebnis');
            if (!gesucht) {
                anzeige.textContent = '';
                return;
            }
            const erg = Register.elektroformeln.rechne(id, gesucht, werte);
            if (!erg.ok) {
                anzeige.className = 'fh-ergebnis fh-wartet';
                anzeige.textContent = erg.fehler;
                /* Das gesuchte Feld bleibt leer, solange nichts herauskommt. */
                const feld = rechner.querySelector(`[data-g="${CSS.escape(gesucht)}"]`);
                if (feld)
                    feld.value = '';
                return;
            }
            const gerundet = Math.round(erg.wert * 10000) / 10000;
            anzeige.className = 'fh-ergebnis fh-fertig';
            anzeige.innerHTML =
                `<b>${esc(gesucht)} = ${esc(zahlText(gerundet))} ${esc(erg.einheit)}</b>` +
                    `<ol class="fh-weg">` + erg.weg.map((s) => `<li>${esc(s)}</li>`).join('') + `</ol>`;
            const feld = rechner.querySelector(`[data-g="${CSS.escape(gesucht)}"]`);
            if (feld)
                feld.value = zahlText(gerundet);
        };
        /**
         * Zahlen lesbar schreiben (Punkt 70).
         *
         * Sehr grosse und sehr kleine Werte in technischer Schreibweise, alles
         * dazwischen normal. `0,000008` liest niemand; `8e-6` schon.
         */
        const zahlText = (n) => {
            if (!isFinite(n))
                return '—';
            const b = Math.abs(n);
            if (b !== 0 && (b >= 1e6 || b < 1e-4)) {
                const e = Math.floor(Math.log10(b) / 3) * 3;
                const m = n / Math.pow(10, e);
                return (Math.round(m * 1000) / 1000).toString().replace('.', ',') + '·10' + hoch(e);
            }
            return (Math.round(n * 10000) / 10000).toString().replace('.', ',');
        };
        const hoch = (e) => {
            const zeichen = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²',
                '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
            return String(e).split('').map(c => zeichen[c] || c).join('');
        };
        /* Der Griff zum Grösseändern, unten rechts. */
        const griff = document.createElement('div');
        griff.className = 'fh-groesse';
        griff.setAttribute('aria-hidden', 'true');
        f.appendChild(griff);
        /* Escape schliesst (§38). */
        f.addEventListener('keydown', e => { if (e.key === 'Escape')
            schliessen(); });
        if (kapitelWunsch)
            merke(M_KAPITEL, kapitelWunsch);
        neuMalen();
        return f;
    };
    /** Auf- und zuklappen — für Tastenkürzel und Menüeinträge. */
    const umschalten = (kapitel) => {
        if (offen())
            schliessen();
        else
            oeffne(kapitel);
    };
    return { oeffne, schliessen, umschalten, offen,
        favoriten, favoritUmschalten, seitenFavoriten, seiteUmschalten,
        pdfLaden, pdfLoesen };
})();
window.Formelheft = Formelheft;
