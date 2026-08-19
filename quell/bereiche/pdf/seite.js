"use strict";
/* ============================================================================
 * bereiche/pdf/seite.ts — eine PDF-Seite als Block
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/pdf/seite.ts`.
 * ----------------------------------------------------------------------------
 * Drei Schichten übereinander, in einem Kasten mit dem Seitenverhältnis der
 * echten Seite:
 *
 *   1. das Seitenbild aus der Stücke-Ablage (Adresse beim Zeichnen, E98)
 *   2. die Zeichenschicht (dieselbe wie beim A4-Blatt, E100/E103)
 *   3. die Werkzeugleiste darüber
 *
 * Zoom ist allein die Breite des Kastens — keine gespeicherte Zahl ändert
 * sich dabei. Deshalb liegt ein Strich auf jedem Bildschirm an derselben
 * Stelle der Seite, und deshalb braucht diese Datei pdf.js nicht: sie zeigt
 * ein Bild und ein SVG.
 *
 * WAS DIE SEITE ÜBER SICH WEISS, steht beim Umwandeln fest und wird danach
 * nur gelesen:
 *
 *   bw, bh      Breite und Höhe in Punkten (bei /Rotate 90 getauscht)
 *   nr          welche Seite des Dokuments
 *   bildDateiId das gerasterte Bild
 *   quelleId    das unveränderte Original
 *
 * Eine spätere Neurasterung benutzt diese Zahlen, sie liefert keine neuen —
 * sonst läge dieselbe Marke plötzlich woanders.
 * ==========================================================================*/
const PdfSeite = (() => {
    const zeichne = (block) => {
        const breite = Number(block.bw) || 595.28;
        const hoehe = Number(block.bh) || 841.89;
        const w = document.createElement('div');
        w.className = 'blatt-huelle pdfs';
        const schicht = Marken.schicht(block, breite, hoehe, 0);
        /* Die Leiste bekommt rechts die Seitenzahl — sie beantwortet die Frage
           „wo bin ich", ohne dass man zählen muss. */
        const werk = Marken.leiste(schicht, '<span class="blatt-trenn"></span>' +
            '<span class="pdfs-nr">Seite ' + (Number(block.nr) || 1) +
            (block.vonSeiten ? ' von ' + block.vonSeiten : '') + '</span>');
        w.appendChild(werk);
        const papier = document.createElement('div');
        papier.className = 'blatt-papier pdfs-papier';
        papier.style.setProperty('aspect-ratio', breite + ' / ' + hoehe);
        w.appendChild(papier);
        /* Das Bild: Adresse beim Zeichnen aus der Kennung holen, nie speichern
           (E98). Fehlt sie noch, steht ein Satz da statt eines leeren Kastens. */
        const bild = document.createElement('img');
        bild.className = 'pdfs-bild';
        bild.alt = 'Seite ' + (Number(block.nr) || 1);
        bild.decoding = 'async';
        bild.loading = 'lazy';
        papier.appendChild(bild);
        const hinweis = document.createElement('div');
        hinweis.className = 'pdfs-wartet';
        hinweis.textContent = 'Seite wird vorbereitet …';
        papier.appendChild(hinweis);
        const zeigeBild = (u) => {
            bild.src = u;
            hinweis.remove();
        };
        if (block.bildDateiId && typeof Dateien !== 'undefined') {
            const da = Dateien.adresseBekannt ? Dateien.adresseBekannt(block.bildDateiId) : null;
            if (da)
                zeigeBild(da);
            else
                Dateien.adresse(block.bildDateiId)
                    .then((u) => { if (u)
                    zeigeBild(u); })
                    .catch(() => { hinweis.textContent = 'Das Seitenbild fehlt — bitte neu einlesen.'; });
        }
        else {
            hinweis.textContent = 'Für diese Seite gibt es noch kein Bild.';
        }
        papier.appendChild(schicht.flaeche);
        return w;
    };
    return { zeichne };
})();
window.PdfSeite = PdfSeite;
