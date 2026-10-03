"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/elektro/formelheft.ts (npm run bauen:ts). */
const Formelheft = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const tief = (wert) => esc(wert).replace(/_([\p{L}\p{N}%]+)/gu, '<sub>$1</sub>');
    const M_ORT = 'elektro:heftOrt';
    const M_KAPITEL = 'elektro:heftKapitel';
    const M_FAVORITEN = 'elektro:heftFavoriten';
    const M_PDF = 'elektro:heftPdf';
    const M_PDFSEITE = 'elektro:heftPdfSeite';
    const M_PDFFAV = 'elektro:heftPdfFavoriten';
    const M_ANSICHT = 'elektro:heftAnsicht';
    const M_SEITE = 'elektro:heftSeite';
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
    let fenster = null;
    const offen = () => !!fenster && document.body.contains(fenster);
    const horcher = new Set();
    const horche = (fn) => { horcher.add(fn); };
    const vergiss = (fn) => { horcher.delete(fn); };
    const sagen = () => {
        horcher.forEach(fn => { try {
            fn();
        }
        catch { } });
    };
    const schliessen = () => { fenster?.remove(); fenster = null; sagen(); };
    const rechnerHtml = (id) => {
        const f = Register.elektroformeln.holen(id);
        if (!f)
            return '';
        const loesbar = Register.elektroformeln.loesbarNach(id);
        return `<div class="fh-rechner" data-formel="${esc(id)}">` +
            `<div class="fh-gesucht"><span>Gesucht</span>` +
            loesbar.map((z, i) => `<button data-gesucht="${esc(z)}"${i === 0 ? ' class="an"' : ''}>${tief(z)}</button>`).join('') +
            `</div>` +
            `<div class="fh-felder">` +
            f.groessen.map((x) => `<label class="fh-feld" data-fuer="${esc(x.zeichen)}">` +
                `<span class="fh-zeichen">${tief(x.zeichen)}</span>` +
                `<input type="text" inputmode="decimal" data-g="${esc(x.zeichen)}" ` +
                `placeholder="${esc(x.name)}" aria-label="${esc(x.name)}">` +
                `<span class="fh-einheit">${esc(x.einheit)}</span></label>`).join('') +
            `</div>` +
            (f.annahme ? `<p class="fh-annahme">⚠ ${esc(f.annahme)}</p>` : '') +
            `<div class="fh-ergebnis" role="status" aria-live="polite"></div>` +
            `</div>`;
    };
    const formelHtml = (f, fav) => `<article class="fh-formel" data-id="${esc(f.id)}">` +
        `<header><b>${tief(f.schreibweise)}</b>` +
        `<button class="fh-stern${fav.includes(f.id) ? ' an' : ''}" data-fav="${esc(f.id)}" ` +
        `title="Merken" aria-label="Formel merken">★</button></header>` +
        `<p class="fh-erkl">${esc(f.erklaerung)}</p>` +
        `<div class="fh-groessen">` + f.groessen.map((x) => `<span title="${esc(x.was || x.name)}"><i>${tief(x.zeichen)}</i> ${esc(x.name)}` +
        (x.einheit ? ` <em>${esc(x.einheit)}</em>` : '') + `</span>`).join('') + `</div>` +
        rechnerHtml(f.id) + `</article>`;
    const seiteJetzt = () => {
        const n = Number(gemerkt(M_SEITE, 4)) || 4;
        return Math.max(1, Math.min(Register.elektroformeln.letzteSeite(), Math.round(n)));
    };
    const naechsteVolle = (von, richtung) => {
        const voll = Register.elektroformeln.seitenMitInhalt();
        if (!voll.length)
            return von;
        const treffer = richtung > 0
            ? voll.find(n => n > von)
            : [...voll].reverse().find(n => n < von);
        return treffer ?? von;
    };
    const abschnittHtml = (a, zeilen, fav) => {
        const skizze = (typeof Elektroskizzen !== 'undefined') ? Elektroskizzen.zu(a.id) : '';
        const groessen = (a.groessen || []).slice();
        if (!groessen.length) {
            const gesehen = new Set();
            zeilen.forEach(z => {
                const f = z.id ? Register.elektroformeln.holen(z.id) : null;
                (f ? f.groessen || [] : []).forEach((x) => {
                    if (gesehen.has(x.zeichen))
                        return;
                    gesehen.add(x.zeichen);
                    groessen.push(x);
                });
            });
        }
        const legende = groessen.map((x) => `<span title="${esc(x.was || x.name)}"><i>${tief(x.zeichen)}</i> ` +
            `${tief(x.name)}${x.einheit ? ` <em>${esc(x.einheit)}</em>` : ''}</span>`).join('');
        const formelnHtml = zeilen.map(z => {
            const eintrag = z.id ? Register.elektroformeln.holen(z.id) : null;
            if (eintrag) {
                return `<button type="button" class="bs-formel` +
                    `${fav.includes(eintrag.id) ? ' gemerkt' : ''}" ` +
                    `data-buchformel="${esc(eintrag.id)}" ` +
                    `title="${esc(eintrag.erklaerung)}">${tief(z.f)}</button>`;
            }
            return `<span class="bs-zeile">${tief(z.f)}</span>`;
        }).join('');
        const tabelle = (a.tabelle && a.tabelle.length)
            ? `<div class="bs-tabelle"><table>` +
                `<thead><tr>` + a.tabelle[0].map((z) => `<th>${tief(z)}</th>`).join('') + `</tr></thead>` +
                `<tbody>` + a.tabelle.slice(1).map(reihe => `<tr>` + reihe.map(z => `<td>${tief(z)}</td>`).join('') + `</tr>`).join('') +
                `</tbody></table></div>`
            : '';
        const nurBild = !formelnHtml && !legende && !tabelle;
        return `<section class="bs-abschnitt${nurBild ? ' bs-nurbild' : ''}" ` +
            `data-abschnitt="${esc(a.id)}">` +
            `<h3>${tief(a.titel)}</h3>` +
            (a.hinweis ? `<p class="bs-hinweis">${tief(a.hinweis)}</p>` : '') +
            `<div class="bs-koerper">` +
            (skizze ? `<div class="bs-skizze">${skizze}</div>` : '') +
            (legende ? `<div class="bs-groessen">${legende}</div>` : '') +
            `<div class="bs-formeln">${formelnHtml}</div>` +
            `</div>` +
            tabelle +
            `</section>`;
    };
    const buchseiteHtml = (nr, fav) => {
        const R = Register.elektroformeln;
        const teile = R.aufSeite(nr);
        const kapitel = [...new Set(teile.map(t => t.abschnitt.buch))]
            .map(k => `${k} · ${R.buchkapitelName(k)}`);
        const letzte = R.letzteSeite();
        const voll = R.seitenMitInhalt();
        return `<div class="bs-blatt" data-seite="${nr}">` +
            `<div class="bs-kopf">` +
            `<div class="bs-kapitel">${kapitel.length
                ? kapitel.map(k => `<span>${esc(k)}</span>`).join('')
                : '<span class="bs-offen">noch nicht geschrieben</span>'}</div>` +
            `<div class="bs-seitenzahl">Seite ${nr} <span>von ${letzte}</span></div>` +
            `</div>` +
            (teile.length
                ? teile.map(t => abschnittHtml(t.abschnitt, t.zeilen, fav)).join('')
                : `<div class="bs-leer">` +
                    `<p>Diese Seite gibt es im gedruckten Heft, in Redion noch nicht.</p>` +
                    `<p class="fh-klein">Geschrieben sind ${voll.length} Seiten: ` +
                    `${esc(voll.join(', '))}.</p></div>`) +
            `</div>`;
    };
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
    const pdfLoesen = () => {
        merke(M_PDF, '');
        merke(M_PDFSEITE, 1);
        neuMalen();
    };
    let pdfDoc = null;
    let pdfDateiId = '';
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
        const skala = Math.max(0.7, Math.min(3, breite / roh.width));
        const vp = s.getViewport({ scale: skala });
        const leinwand = document.createElement('canvas');
        leinwand.width = Math.round(vp.width);
        leinwand.height = Math.round(vp.height);
        await s.render({ canvasContext: leinwand.getContext('2d'), viewport: vp }).promise;
        return { seiten: anzahl, nr: seite, bild: leinwand.toDataURL('image/png') };
    };
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
        const ort = gemerkt(M_ORT, null);
        const zahl = (wert, vorgabe) => (typeof wert === 'number' && Number.isFinite(wert)) ? wert : vorgabe;
        const breite = Math.min(Math.max(zahl(ort?.w, 420), 320), window.innerWidth - 20);
        const hoehe = Math.min(Math.max(zahl(ort?.h, 520), 260), window.innerHeight - 20);
        f.style.width = breite + 'px';
        f.style.height = hoehe + 'px';
        f.style.left = Math.max(0, Math.min(zahl(ort?.x, window.innerWidth - breite - 30), Math.max(0, window.innerWidth - breite))) + 'px';
        const leiste = document.querySelector('.document-drawingbar');
        const untenVon = leiste
            ? Math.round(leiste.getBoundingClientRect().bottom) + 10
            : 0;
        f.style.top = Math.max(0, Math.min(Math.max(zahl(ort?.y, 90), untenVon), Math.max(0, window.innerHeight - hoehe))) + 'px';
        document.body.appendChild(f);
        let suchtext = '';
        const ansicht = String(gemerkt(M_ANSICHT, 'kapitel'));
        const hatEigenes = () => !!String(gemerkt(M_PDF, ''));
        let pdfModus = ansicht === 'pdf' && hatEigenes();
        let buchModus = ansicht === 'buch';
        const ansichtMerken = () => merke(M_ANSICHT, pdfModus ? 'pdf' : (buchModus ? 'buch' : 'kapitel'));
        let buchOeffnen = '';
        const male = async () => {
            const kapitel = String(gemerkt(M_KAPITEL, 'grund'));
            const fav = favoriten();
            const hatPdf = !!String(gemerkt(M_PDF, ''));
            const kopf = `<div class="fh-kopf" data-griff>` +
                `<span class="fh-titel">📐 Formelheft</span>` +
                `<div class="fh-kopfknoepfe">` +
                `<button data-a="buch" class="${buchModus && !pdfModus ? 'an' : ''}" ` +
                `title="Nach Buchseiten" aria-label="Nach Buchseiten blättern">📖</button>` +
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
            if (buchModus) {
                const nr = seiteJetzt();
                const R = Register.elektroformeln;
                const letzte = R.letzteSeite();
                if (suchtext) {
                    const treffer = R.suche(suchtext);
                    f.innerHTML = kopf +
                        `<div class="fh-suche"><input type="search" ` +
                        `placeholder="Formel oder Grösse suchen …" ` +
                        `value="${esc(suchtext)}" aria-label="Formel suchen"></div>` +
                        `<div class="fh-inhalt bs-treffer">` +
                        (treffer.length
                            ? treffer.map(x => {
                                const seite = R.seiteVon(x.id);
                                return `<button type="button" class="bs-treffer-zeile" ` +
                                    `data-buchseite="${seite}" data-buchformel="${esc(x.id)}">` +
                                    `<b>${tief(x.schreibweise)}</b>` +
                                    `<span>Seite ${seite || '–'}</span></button>`;
                            }).join('')
                            : `<div class="fh-leer"><p>Nichts gefunden.</p></div>`) +
                        `</div>`;
                    return;
                }
                f.innerHTML = kopf +
                    `<div class="fh-suche"><input type="search" ` +
                    `placeholder="Formel oder Grösse suchen …" ` +
                    `value="" aria-label="Formel suchen"></div>` +
                    `<div class="fh-inhalt bs-inhalt">${buchseiteHtml(nr, fav)}</div>` +
                    `<div class="fh-pdffuss">` +
                    `<button data-a="zurueckSeite" aria-label="Vorige Seite"${nr <= 1 ? ' disabled' : ''}>‹</button>` +
                    `<input class="fh-nr bs-nr" type="number" min="1" max="${letzte}" value="${nr}" ` +
                    `aria-label="Buchseite">` +
                    `<span class="fh-von">von ${letzte}</span>` +
                    `<button data-a="vorSeite" aria-label="Nächste Seite"${nr >= letzte ? ' disabled' : ''}>›</button>` +
                    `<button data-a="vorherVoll" title="Vorige geschriebene Seite" ` +
                    `aria-label="Vorige geschriebene Seite">«</button>` +
                    `<button data-a="naechsteVoll" title="Nächste geschriebene Seite" ` +
                    `aria-label="Nächste geschriebene Seite">»</button>` +
                    `</div>`;
                return;
            }
            const kapitelListe = Register.elektroformeln.kapitel();
            const treffer = suchtext
                ? Register.elektroformeln.suche(suchtext)
                : (kapitel === 'fav'
                    ? fav.map((id) => Register.elektroformeln.holen(id)).filter(Boolean)
                    : Register.elektroformeln.imKapitel(kapitel));
            f.innerHTML = kopf +
                `<div class="fh-suche"><input type="search" placeholder="Formel oder Grösse suchen …" ` +
                `value="${esc(suchtext)}" aria-label="Formel suchen"></div>` +
                `<div class="fh-band"><div class="fh-kapitel">` +
                (fav.length ? `<button data-k="fav"${kapitel === 'fav' && !suchtext ? ' class="an"' : ''}>` +
                    `★ ${fav.length}</button>` : '') +
                kapitelListe.map(k => `<button data-k="${esc(k[0])}"${k[0] === kapitel && !suchtext ? ' class="an"' : ''}>` +
                    `${esc(k[1])}</button>`).join('') + `</div></div>` +
                `<div class="fh-inhalt">` +
                (treffer.length
                    ? treffer.map((x) => formelHtml(x, fav)).join('')
                    : `<div class="fh-leer"><p>Nichts gefunden.</p></div>`) +
                `</div>`;
            const band = f.querySelector('.fh-kapitel');
            if (band) {
                const huelle = band.closest('.fh-band');
                if (typeof Rollrand !== 'undefined')
                    Rollrand.binde(band, { art: 'mehr', an: huelle });
                const aktiv = band.querySelector('.an');
                if (aktiv)
                    aktiv.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        };
        neuMalen = () => {
            void male().then(() => {
                f.appendChild(griff);
                if (!buchOeffnen)
                    return;
                const ziel = f.querySelector(`[data-buchformel="${CSS.escape(buchOeffnen)}"]`);
                buchOeffnen = '';
                ziel?.click();
            });
        };
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
            try {
                f.setPointerCapture(e.pointerId);
            }
            catch { }
            e.preventDefault();
        });
        f.addEventListener('pointermove', e => {
            if (!zieht)
                return;
            if (zieht.art === 'ort') {
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
        f.addEventListener('click', e => {
            const b = e.target.closest('[data-a],[data-k],[data-fav],[data-gesucht],[data-springe],' +
                '[data-buchformel],[data-buchseite]');
            if (!b)
                return;
            if (b.dataset.a === 'zu')
                return schliessen();
            if (b.dataset.a === 'buch') {
                buchModus = !buchModus;
                pdfModus = false;
                ansichtMerken();
                return neuMalen();
            }
            if (b.dataset.a === 'pdf') {
                pdfModus = !pdfModus;
                ansichtMerken();
                return neuMalen();
            }
            if (b.dataset.a === 'zurueckSeite' || b.dataset.a === 'vorSeite') {
                merke(M_SEITE, seiteJetzt() + (b.dataset.a === 'vorSeite' ? 1 : -1));
                return neuMalen();
            }
            if (b.dataset.a === 'vorherVoll' || b.dataset.a === 'naechsteVoll') {
                merke(M_SEITE, naechsteVolle(seiteJetzt(), b.dataset.a === 'naechsteVoll' ? 1 : -1));
                return neuMalen();
            }
            if (b.dataset.buchseite) {
                const seite = Number(b.dataset.buchseite);
                if (seite > 0)
                    merke(M_SEITE, seite);
                suchtext = '';
                buchOeffnen = b.dataset.buchformel || '';
                return neuMalen();
            }
            if (b.dataset.buchformel) {
                const id = b.dataset.buchformel;
                const abschnitt = b.closest('.bs-abschnitt');
                const schon = abschnitt?.querySelector('.bs-rechner');
                const warEs = schon?.dataset.fuer === id;
                f.querySelectorAll('.bs-rechner').forEach(x => x.remove());
                f.querySelectorAll('.bs-formel.offen').forEach(x => x.classList.remove('offen'));
                if (warEs)
                    return;
                b.classList.add('offen');
                const kasten = document.createElement('div');
                kasten.className = 'bs-rechner';
                kasten.dataset.fuer = id;
                const formel = Register.elektroformeln.holen(id);
                kasten.innerHTML =
                    `<p class="fh-erkl">${esc(formel ? formel.erklaerung : '')}</p>` +
                        rechnerHtml(id);
                b.closest('.bs-koerper')?.insertAdjacentElement('afterend', kasten);
                const r = kasten.querySelector('.fh-rechner');
                if (r)
                    rechne(r);
                kasten.scrollIntoView({ block: 'nearest' });
                return;
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
            if (b.dataset.gesucht) {
                const rechner = b.closest('.fh-rechner');
                rechner.querySelectorAll('[data-gesucht]').forEach(x => x.classList.remove('an'));
                b.classList.add('an');
                return rechne(rechner);
            }
        });
        f.addEventListener('input', e => {
            const feld = e.target;
            if (feld.type === 'search') {
                suchtext = feld.value;
                return neuMalen();
            }
            if (feld.classList.contains('bs-nr')) {
                merke(M_SEITE, Math.max(1, Number(feld.value) || 1));
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
        const rechne = (rechner) => {
            const id = rechner.dataset.formel || '';
            const gesucht = rechner.querySelector('[data-gesucht].an')?.dataset.gesucht || '';
            const werte = {};
            rechner.querySelectorAll('[data-g]').forEach(feld => {
                const z = feld.dataset.g || '';
                const istGesucht = z === gesucht;
                feld.disabled = istGesucht;
                feld.closest('.fh-feld')?.classList.toggle('gesucht', istGesucht);
                if (istGesucht)
                    return;
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
                const feld = rechner.querySelector(`[data-g="${CSS.escape(gesucht)}"]`);
                if (feld)
                    feld.value = '';
                return;
            }
            const gerundet = Math.round(erg.wert * 10000) / 10000;
            anzeige.className = 'fh-ergebnis fh-fertig';
            anzeige.innerHTML =
                `<b>${tief(gesucht)} = ${esc(zahlText(gerundet))} ${esc(erg.einheit)}</b>` +
                    `<ol class="fh-weg">` + erg.weg.map((s) => `<li>${esc(s)}</li>`).join('') + `</ol>`;
            const feld = rechner.querySelector(`[data-g="${CSS.escape(gesucht)}"]`);
            if (feld)
                feld.value = zahlText(gerundet);
        };
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
        const griff = document.createElement('div');
        griff.className = 'fh-groesse';
        griff.setAttribute('aria-hidden', 'true');
        f.appendChild(griff);
        f.addEventListener('keydown', e => { if (e.key === 'Escape')
            schliessen(); });
        if (kapitelWunsch)
            merke(M_KAPITEL, kapitelWunsch);
        neuMalen();
        sagen();
        return f;
    };
    const umschalten = (kapitel) => {
        if (offen())
            schliessen();
        else
            oeffne(kapitel);
    };
    if (typeof Register !== 'undefined' && Register.befehle) {
        Register.befehle.melde({
            titel: 'Formelheft öffnen',
            gruppe: 'Elektro',
            tun: () => umschalten()
        });
        Register.befehle.melde({
            titel: 'Formelheft: eigenes PDF laden',
            gruppe: 'Elektro',
            tun: () => { oeffne(); void pdfLaden(); }
        });
    }
    return { oeffne, schliessen, umschalten, offen, horche, vergiss,
        favoriten, favoritUmschalten, seitenFavoriten, seiteUmschalten,
        pdfLaden, pdfLoesen };
})();
window.Formelheft = Formelheft;
