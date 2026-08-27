"use strict";
/* ============================================================================
 * sicherung.js — Wann wurde zuletzt gesichert, und wieviel Platz ist noch da
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/sicherung.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/kern/helfer/sicherung.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * `sicherungsstand()` stand in `bereiche/datenbanken/ansichten/dienst.ts` und
 * rechnete dort aus, wie alt die letzte Sicherung ist. Die Bibliothek stellt
 * jetzt dieselbe Frage — und ein Bereich darf nicht aus einem anderen
 * importieren (CLAUDE.md §5, Regel 1).
 *
 * Es abzuschreiben wäre schlimmer als bei der Vorschau. Bei einem Anriss
 * fällt es auf, wenn zwei Fassungen auseinanderlaufen; bei einer Frist nicht.
 * Eine Ansicht, die „gesichert" sagt, während die andere warnt, ist genau die
 * Sorte Fehler, die §46 meint: Priorität 1 ist, keine Daten zu verlieren, und
 * dazu gehört, ehrlich zu sagen, wie alt die letzte Sicherung ist.
 *
 * Und es handelt ohnehin von der Ablage, nicht von einem Bereich.
 *
 * WAS HIER STEHT
 *
 *     stand()     wie alt ist die letzte Sicherung, und ist das noch gut?
 *     merken(art) den Zeitpunkt festhalten — nach einer echten Sicherung
 *     papierkorb() wieviel liegt weg, und wann läuft die Frist ab?
 *     platz()     wieviel Platz belegt Redion auf dem Gerät? (gleichläufig
 *                 nicht möglich — der Browser gibt ihn nur als Versprechen)
 * ==========================================================================*/
const Sicherung = (() => {
    const TAG = 86400000;
    /** Ab hier erinnern (eine Woche) bzw. warnen (ein Monat). */
    const ERINNERN = 7;
    const WARNEN = 30;
    const meta = (name, standard) => {
        if (typeof Store === 'undefined' || typeof Store.getMeta !== 'function')
            return standard;
        try {
            return Store.getMeta(name, standard);
        }
        catch {
            return standard;
        }
    };
    /**
     * Wie alt ist die letzte Sicherung?
     *
     * `tage: null` heisst „keine bekannt" und nicht „null Tage alt". Die Stufe
     * ist dann `warnen` — ein unlesbarer oder fehlender Zeitstempel ist wie
     * keine Sicherung und nicht wie eine frische. Das stand schon in
     * `dienst.ts` so und ist der wichtigste Satz dieser Datei.
     */
    const stand = () => {
        const wann = String(meta('sicherung:zuletzt', '') || '');
        const art = String(meta('sicherung:art', '') || '');
        const zeit = wann ? Date.parse(wann) : NaN;
        if (!wann || Number.isNaN(zeit))
            return { stufe: 'warnen', tage: null, art, wann: '' };
        const tage = Math.max(0, Math.floor((Date.now() - zeit) / TAG));
        const stufe = tage >= WARNEN ? 'warnen'
            : tage >= ERINNERN ? 'erinnern' : 'gut';
        return { stufe, tage, art, wann };
    };
    /**
     * Den Zeitpunkt festhalten.
     *
     * NUR NACH EINER SICHERUNG, DIE WIRKLICH ZUSTANDE KAM. `schale.ts` ruft es
     * erst nach dem Klick auf den Herunterladen-Verweis; wer es vorher ruft,
     * beruhigt jemanden über eine Datei, die es nicht gibt.
     */
    const merken = (art) => {
        if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function')
            return;
        Store.setMeta('sicherung:zuletzt', new Date().toISOString());
        Store.setMeta('sicherung:art', art);
    };
    /** Wie lange dauert es noch, bis der Papierkorb sich selbst leert? */
    const papierkorb = () => {
        const tage = Number(meta('papierkorbTage', 30)) || 0;
        let weg = [];
        if (typeof Store !== 'undefined' && typeof Store.trashed === 'function') {
            try {
                weg = Store.trashed();
            }
            catch {
                weg = [];
            }
        }
        /* Wann läuft die NÄCHSTE Frist ab — also für das, was am längsten liegt?
           Das ist die Zahl, die zählt: sie sagt, wieviel Zeit noch bleibt, um
           etwas zurückzuholen. Ohne Frist (0 Tage) gibt es keine. */
        let naechste = null;
        if (tage) {
            for (const b of weg) {
                const t = Date.parse(String(b?.trashedAt || ''));
                if (Number.isNaN(t))
                    continue;
                const restTage = Math.max(0, Math.ceil((t + tage * TAG - Date.now()) / TAG));
                if (naechste === null || restTage < naechste)
                    naechste = restTage;
            }
        }
        return { anzahl: weg.length, tage, naechste };
    };
    /** Bytes als Text, den ein Mensch liest. */
    const groesse = (bytes) => {
        if (!bytes || bytes < 0)
            return '0 B';
        if (bytes < 1024)
            return bytes + ' B';
        const einheiten = ['KB', 'MB', 'GB', 'TB'];
        let wert = bytes / 1024, i = 0;
        while (wert >= 1024 && i < einheiten.length - 1) {
            wert /= 1024;
            i++;
        }
        return (wert >= 10 ? Math.round(wert) : Math.round(wert * 10) / 10)
            .toLocaleString('de-CH') + ' ' + einheiten[i];
    };
    /**
     * Wieviel Platz belegt Redion auf diesem Gerät?
     *
     * `navigator.storage.estimate()` gibt ein VERSPRECHEN und keine Zahl — es
     * geht deshalb nicht gleichläufig, anders als alles andere hier. Wer es
     * zeichnet, zeichnet erst ohne und trägt es nach.
     *
     * Die Aufteilung in Seiten und Anhänge kommt nicht vom Browser, sondern aus
     * dem Bestand: die Summe der Dateigrössen ist das, was die Anhänge belegen;
     * der Rest ist alles andere. Das ist eine SCHÄTZUNG und heisst hier auch
     * so — der Browser rechnet seinen eigenen Verwaltungsaufwand mit, und die
     * beiden Zahlen müssen deshalb nicht aufgehen.
     *
     * Kein `estimate` heisst kein Balken. Eine erfundene Zahl über den freien
     * Platz wäre schlimmer als keine: danach richtet jemand seine Entscheidung
     * aus, ob er noch ein Video einfügt.
     */
    const platz = async () => {
        /* Die Anhänge liegen NICHT im Spiegel im Arbeitsspeicher — `Store.cache`
           führt Blöcke, Sammlungen, Ansichten und Marken, sonst nichts. Der erste
           Entwurf las `Store.cache.dateien` und bekam `undefined`; die Summe wäre
           still 0 geblieben und der Balken hätte behauptet, Anhänge kosteten
           keinen Platz. `dateiAlle()` fragt die Ablage — asynchron, aber das ist
           diese Funktion ohnehin. */
        let anhaenge = 0;
        if (typeof Store !== 'undefined' && typeof Store.dateiAlle === 'function') {
            try {
                for (const d of await Store.dateiAlle())
                    anhaenge += Number(d?.groesse) || 0;
            }
            catch {
                anhaenge = 0;
            }
        }
        try {
            const schaetzung = await navigator.storage?.estimate?.();
            const belegt = Number(schaetzung?.usage) || 0;
            const gesamt = Number(schaetzung?.quota) || 0;
            if (!gesamt)
                return { belegt, frei: 0, gesamt: 0, anhaenge, bekannt: false };
            return { belegt, frei: Math.max(0, gesamt - belegt), gesamt, anhaenge, bekannt: true };
        }
        catch {
            return { belegt: 0, frei: 0, gesamt: 0, anhaenge, bekannt: false };
        }
    };
    return { stand, merken, papierkorb, platz, groesse, TAG, ERINNERN, WARNEN };
})();
window.Sicherung = Sicherung;
