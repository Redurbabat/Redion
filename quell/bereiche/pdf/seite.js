"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/pdf/seite.ts (npm run bauen:ts). */
const PdfSeite = (() => {
    const zeichne = (block) => {
        const breite = Number(block.bw) || 595.28;
        const hoehe = Number(block.bh) || 841.89;
        const w = document.createElement('div');
        w.className = 'blatt-huelle pdfs';
        const seite = (typeof Links !== 'undefined' && Links.seiteVon)
            ? Links.seiteVon(block.id) : null;
        const randAnteil = Math.max(0, Math.min(1.5, Number(seite?.randBreite) || 0));
        const rand = Math.round(breite * randAnteil);
        const schicht = Marken.schicht(block, breite, hoehe, 0, rand);
        const werk = Marken.leiste(schicht, '<button data-a="anker" aria-label="Verweis auf diese Seite kopieren" ' +
            'title="Verweis auf genau diese Seite kopieren">🔗</button>' +
            (block.quelleId && (Number(block.bildBreite) || 1654) < 3308
                ? '<button data-a="feiner" aria-label="Diese Seite feiner rechnen" ' +
                    'title="Diese Seite feiner rechnen — schärfer beim Hineinzoomen">⊕</button>'
                : '') +
            '<button data-a="karte" aria-label="Rechteck als Lernkarte ausschneiden" ' +
            'title="Das zuletzt gezeichnete Rechteck als Karteikarte ausschneiden">✂</button>' +
            '<span class="blatt-trenn"></span>' +
            '<span class="pdfs-nr">Seite ' + (Number(block.nr) || 1) +
            (Number(block.vonSeiten) ? ' von ' + Number(block.vonSeiten) : '') +
            '</span>');
        werk.addEventListener('click', e => {
            const k = e.target?.closest?.('button');
            if (k?.dataset.a === 'feiner') {
                k.setAttribute('disabled', 'disabled');
                k.textContent = '…';
                PdfEinlesen.schaerfer(block).then((erg) => {
                    if (erg && erg.ok)
                        return;
                    if (!k.isConnected)
                        return;
                    k.removeAttribute('disabled');
                    k.textContent = '⊕';
                    if (erg && erg.grund)
                        UI.toast(erg.grund);
                });
                return;
            }
            if (k?.dataset.a === 'karte') {
                void alsLernkarte();
                return;
            }
            if (k?.dataset.a !== 'anker')
                return;
            const adr = location.href.split('#')[0] + '#block=' + block.id;
            Ablage.kopiereJetzt(adr, 'Verweis auf Seite ' +
                (Number(block.nr) || 1) + ' kopiert');
        });
        w.appendChild(werk);
        const papier = document.createElement('div');
        papier.className = 'blatt-papier pdfs-papier';
        papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
        let flur = null;
        if (rand > 0) {
            flur = document.createElement('div');
            flur.className = 'blatt-flur';
            flur.style.setProperty('--seiten-anteil', (100 * breite / (breite + rand)).toFixed(4) + '%');
            flur.style.setProperty('--flur-faktor', ((breite + rand) / breite).toFixed(4));
            const randfeld = document.createElement('div');
            randfeld.className = 'blatt-randfeld';
            flur.appendChild(papier);
            flur.appendChild(randfeld);
            w.appendChild(SheetSpace.drehHuelle(block, flur));
        }
        else {
            w.appendChild(SheetSpace.drehHuelle(block, papier));
        }
        const bild = document.createElement('img');
        bild.className = 'pdfs-bild';
        bild.alt = 'Seite ' + (Number(block.nr) || 1);
        bild.decoding = 'async';
        bild.loading = 'lazy';
        const hinweis = document.createElement('div');
        hinweis.className = 'pdfs-wartet';
        hinweis.textContent = 'Seite wird vorbereitet …';
        papier.appendChild(hinweis);
        const wegZeigen = (text) => {
            hinweis.textContent = '';
            const satz = document.createElement('div');
            satz.textContent = text;
            hinweis.appendChild(satz);
            if (!block.quelleId)
                return;
            const k = document.createElement('button');
            k.type = 'button';
            k.className = 'pdfs-neu';
            k.textContent = 'Aus dem Original zurückholen';
            k.addEventListener('click', () => {
                k.disabled = true;
                k.textContent = 'wird gerechnet …';
                const zurueck = () => {
                    if (!k.isConnected)
                        return;
                    k.disabled = false;
                    k.textContent = 'Aus dem Original zurückholen';
                };
                const aus = [];
                const fertig = (d) => {
                    if (!d || d.art !== 'pdf-bilder')
                        return;
                    aus.forEach(f => f());
                    aus.length = 0;
                    zurueck();
                };
                if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
                    aus.push(Ereignisse.horche(ARTEN.auftragBeendet, fertig));
                    aus.push(Ereignisse.horche(ARTEN.auftragFehler, fertig));
                }
                PdfEinlesen.neuBerechnen(block.quelleId).then((e) => {
                    if (!e || !e.auftrag)
                        fertig({ art: 'pdf-bilder' });
                }, () => fertig({ art: 'pdf-bilder' }));
            });
            hinweis.appendChild(k);
        };
        const zeigeBild = (u) => {
            bild.src = u;
            papier.insertBefore(bild, papier.firstChild);
            hinweis.remove();
        };
        if (block.bildDateiId && typeof Dateien !== 'undefined') {
            const da = Dateien.adresseBekannt ? Dateien.adresseBekannt(block.bildDateiId) : null;
            if (da)
                zeigeBild(da);
            else
                Dateien.adresse(block.bildDateiId)
                    .then((u) => {
                    if (u)
                        zeigeBild(u);
                    else
                        wegZeigen('Das Seitenbild fehlt.');
                })
                    .catch(() => wegZeigen('Das Seitenbild fehlt.'));
        }
        else {
            wegZeigen('Für diese Seite gibt es noch kein Bild.');
        }
        const alsLernkarte = async () => {
            const rechtecke = schicht.marken
                .filter(m => m && m.art === 'rectangle' && Array.isArray(m.pts) && m.pts.length >= 2);
            const letztes = rechtecke[rechtecke.length - 1];
            if (!letztes) {
                UI.toast('Zeichne zuerst ein Rechteck um das, was du ausschneiden willst.');
                return;
            }
            if (!bild.naturalWidth || !bild.isConnected) {
                UI.toast('Das Seitenbild ist noch nicht da.');
                return;
            }
            const pts = InkGeometry.points(letztes.pts);
            const a = pts[0], b = pts[1];
            const jeX = bild.naturalWidth / breite;
            const jeY = bild.naturalHeight / hoehe;
            const x = Math.max(0, Math.min(a[0], b[0]) * jeX);
            const y = Math.max(0, Math.min(a[1], b[1]) * jeY);
            const w2 = Math.min(bild.naturalWidth - x, Math.abs(b[0] - a[0]) * jeX);
            const h2 = Math.min(bild.naturalHeight - y, Math.abs(b[1] - a[1]) * jeY);
            if (w2 < 8 || h2 < 8) {
                UI.toast('Das Rechteck ist zu klein für einen Ausschnitt.');
                return;
            }
            const frage = await UI.frage('Was steht auf der Rückseite der Karte?', '');
            if (frage === null)
                return;
            const tafel = document.createElement('canvas');
            tafel.width = Math.round(w2);
            tafel.height = Math.round(h2);
            const stift = tafel.getContext('2d');
            if (!stift) {
                UI.toast('Der Ausschnitt lässt sich nicht zeichnen.');
                return;
            }
            stift.drawImage(bild, x, y, w2, h2, 0, 0, tafel.width, tafel.height);
            const brocken = await new Promise(fertig => tafel.toBlob(b3 => fertig(b3), 'image/png'));
            if (!brocken) {
                UI.toast('Der Ausschnitt liess sich nicht speichern.');
                return;
            }
            try {
                const name = 'ausschnitt-seite-' + (Number(block.nr) || 1) + '.png';
                const datei = await Dateien.ablegen(new File([brocken], name, { type: 'image/png' }), null);
                const ziel = App.aktuelleSeite();
                if (!ziel) {
                    UI.toast('Keine Seite offen.');
                    return;
                }
                const karte = Store.addBlock(ziel, 'flashcard', {
                    text: 'Was ist das? :: ' + (frage || '')
                });
                Store.updateBlock(karte.id, { bildId: datei.id });
                App.zeichneSeite();
                UI.toast('✅ Karteikarte angelegt');
            }
            catch (e) {
                UI.toast('Der Ausschnitt liess sich nicht ablegen: ' +
                    (e instanceof Error ? e.message : String(e)));
            }
        };
        (flur ?? papier).appendChild(schicht.flaeche);
        return w;
    };
    return { zeichne };
})();
window.PdfSeite = PdfSeite;
