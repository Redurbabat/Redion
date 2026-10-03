"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/slides/folien.ts (npm run bauen:ts). */
const Folien = (() => {
    const TRENNT = ['divider', 'h1', 'h2'];
    const EIGENE_KINDER = ['columns', 'columns3', 'blatt'];
    const EIGENE_FOLIE = ['blatt', 'pdfseite'];
    const MIT_KINDERN = ['bullet', 'number', 'todo', 'toggle'];
    const teilen = (wurzel, kinderVon) => {
        if (!wurzel || !wurzel.id)
            return [];
        const raus = [];
        let aktuell = { titel: String(wurzel.text || ''), eintraege: [] };
        const gesehen = new Set();
        const sammle = (id, tiefe) => {
            if (tiefe > 12 || gesehen.has(id))
                return;
            gesehen.add(id);
            for (const b of kinderVon(id) || []) {
                if (!b || !b.type)
                    continue;
                if (TRENNT.includes(b.type)) {
                    const leerAmAnfang = !aktuell.eintraege.length && !raus.length &&
                        aktuell.titel === String(wurzel.text || '');
                    if (!leerAmAnfang)
                        raus.push(aktuell);
                    aktuell = { titel: b.type === 'divider' ? '' : String(b.text || ''),
                        eintraege: [] };
                    continue;
                }
                if (tiefe === 0 && EIGENE_FOLIE.includes(b.type)) {
                    const leerAmAnfang = !aktuell.eintraege.length && !raus.length &&
                        aktuell.titel === String(wurzel.text || '');
                    const leer = !aktuell.eintraege.length && !aktuell.titel;
                    if (!leerAmAnfang && !leer)
                        raus.push(aktuell);
                    raus.push({ titel: '', eintraege: [{ block: b, tiefe }] });
                    aktuell = { titel: '', eintraege: [] };
                    continue;
                }
                aktuell.eintraege.push({ block: b, tiefe });
                if (EIGENE_KINDER.includes(b.type))
                    continue;
                if (MIT_KINDERN.includes(b.type))
                    sammle(b.id, tiefe + 1);
            }
        };
        sammle(wurzel.id, 0);
        if (aktuell.eintraege.length || aktuell.titel)
            raus.push(aktuell);
        if (!raus.length)
            raus.push(aktuell);
        return raus;
    };
    const ohneMarkierung = (t) => String(t ?? '')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[*~]/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    const alsZeilen = (folie, kinderVon) => {
        const raus = [];
        const nimm = (text, tiefe, art) => {
            const t = ohneMarkierung(text);
            if (t)
                raus.push({ text: t, tiefe: Math.max(0, Math.min(8, tiefe)), art });
        };
        const eins = ({ block: b, tiefe }) => {
            switch (b.type) {
                case 'h3':
                case 'h4':
                    nimm(b.text || '', tiefe, 'kopf');
                    return;
                case 'bullet':
                    nimm('• ' + (b.text || ''), tiefe, 'punkt');
                    return;
                case 'number':
                    nimm(b.text || '', tiefe, 'nummer');
                    return;
                case 'todo':
                    nimm((b.checked ? '☑ ' : '☐ ') + (b.text || ''), tiefe, 'aufgabe');
                    return;
                case 'quote':
                    nimm('„' + (b.text || '') + '"', tiefe, 'zitat');
                    return;
                case 'code':
                    nimm(b.text || '', tiefe, 'code');
                    return;
                case 'callout':
                    nimm((b.icon || '💡') + ' ' + (b.text || ''), tiefe, 'hinweis');
                    return;
                case 'equation':
                    nimm(b.text || '', tiefe, 'formel');
                    return;
                case 'image':
                    nimm('[Bild' + (b.text ? ': ' + b.text : '') + ']', tiefe, 'bild');
                    return;
                case 'pdfseite':
                    nimm('[PDF-Seite ' + (Number(b.nr) || 1) + ']', tiefe, 'bild');
                    return;
                case 'blatt':
                    nimm('[A4-Blatt]', tiefe, 'bild');
                    return;
                case 'file':
                    nimm('[Datei: ' + (b.text || 'ohne Namen') + ']', tiefe, 'datei');
                    return;
                case 'table': {
                    const zeilen = (kinderVon(b.id) || []).length;
                    nimm('[Tabelle' + (zeilen ? ', ' + zeilen + ' Zeilen' : '') + ']', tiefe, 'tabelle');
                    return;
                }
                case 'database':
                    nimm('[Datenbank' + (b.text ? ': ' + b.text : '') + ']', tiefe, 'tabelle');
                    return;
                case 'columns':
                case 'columns3': {
                    for (const sp of kinderVon(b.id) || []) {
                        const inhalt = sp.type === 'spalte' ? (kinderVon(sp.id) || []) : [sp];
                        for (const k of inhalt)
                            eins({ block: k, tiefe: tiefe + 1 });
                    }
                    return;
                }
                default: nimm(b.text || '', tiefe, 'text');
            }
        };
        folie.eintraege.forEach(eins);
        return raus;
    };
    return { teilen, alsZeilen, ohneMarkierung, TRENNT, EIGENE_KINDER, EIGENE_FOLIE, MIT_KINDERN };
})();
window.Folien = Folien;
