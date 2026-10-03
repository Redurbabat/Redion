"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/ablage.ts (npm run bauen:ts). */
const Ablage = (() => {
    const ueberFeld = (text) => {
        try {
            const feld = document.createElement('textarea');
            feld.value = text;
            feld.setAttribute('readonly', '');
            feld.style.cssText = 'position:fixed; top:0; left:-9999px; opacity:0';
            document.body.appendChild(feld);
            const vorher = document.getSelection()?.rangeCount
                ? document.getSelection().getRangeAt(0) : null;
            const warAktiv = document.activeElement instanceof HTMLElement
                ? document.activeElement : null;
            feld.select();
            feld.setSelectionRange(0, text.length);
            const ging = document.execCommand('copy');
            feld.remove();
            if (warAktiv && warAktiv !== feld) {
                try {
                    warAktiv.focus();
                }
                catch { }
            }
            if (vorher) {
                const s = document.getSelection();
                s?.removeAllRanges();
                s?.addRange(vorher);
            }
            return ging;
        }
        catch {
            return false;
        }
    };
    const kopiere = async (text, meldung) => {
        const t = String(text ?? '');
        let ging = false;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(t);
                ging = true;
            }
        }
        catch {
        }
        if (!ging)
            ging = ueberFeld(t);
        if (meldung && typeof UI !== 'undefined' && UI.toast) {
            UI.toast(ging ? meldung
                : 'Der Browser lässt das Kopieren nicht zu — bitte von Hand markieren.');
        }
        return ging;
    };
    const kopiereJetzt = (text, meldung) => {
        kopiere(text, meldung).catch(() => { });
    };
    return { kopiere, kopiereJetzt, ueberFeld };
})();
window.Ablage = Ablage;
