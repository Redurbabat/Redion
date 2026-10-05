"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/ordnersicherung.ts (npm run bauen:ts). */
const OrdnerSicherung = (() => {
    const TAKT = 5 * 60 * 1000;
    const MUSTER = /^redion-sicherung-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})\.(redion|json)$/;
    const BEHALTEN_TAGE = 7;
    let uhr = null;
    let laeuft = false;
    let gestartet = false;
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
    const setzen = (name, wert) => {
        if (typeof Store === 'undefined' || typeof Store.setMeta !== 'function')
            return;
        try {
            Store.setMeta(name, wert);
        }
        catch { }
    };
    const moeglich = () => typeof window !== 'undefined' &&
        typeof window.showDirectoryPicker === 'function';
    const an = () => !!meta('sicherungOrdner', null);
    const name = () => String(meta('sicherungOrdnerName', '') || '');
    const fehler = () => String(meta('sicherungOrdnerFehler', '') || '');
    const zuletzt = () => String(meta('sicherungOrdnerZuletzt', '') || '');
    const melden = (text) => setzen('sicherungOrdnerFehler', text);
    const erlaubnis = async (ordner, fragen) => {
        if (!ordner)
            return false;
        try {
            if (typeof ordner.queryPermission === 'function') {
                const stand = await ordner.queryPermission({ mode: 'readwrite' });
                if (stand === 'granted')
                    return true;
            }
            if (!fragen || typeof ordner.requestPermission !== 'function')
                return false;
            return (await ordner.requestPermission({ mode: 'readwrite' })) === 'granted';
        }
        catch {
            return false;
        }
    };
    const standAbdruck = () => {
        if (typeof Store === 'undefined' || !Store.cache)
            return '';
        const c = Store.cache;
        let zahl = 0;
        let juengste = '';
        let streu = 0;
        for (const fach of ['blocks', 'collections', 'views']) {
            const o = c[fach];
            if (!o)
                continue;
            for (const k of Object.keys(o)) {
                zahl++;
                const e = o[k];
                const t = String((e && (e.edited || e.created)) || '');
                if (t > juengste)
                    juengste = t;
                const wort = k + '|' + t + '|' + String((e && e.text) || '').length;
                for (let i = 0; i < wort.length; i++)
                    streu = (streu * 31 + wort.charCodeAt(i)) | 0;
            }
        }
        const dateien = String(Store.getMeta
            ? (Store.getMeta('dateien:stand', 0) ?? 0) : 0);
        return zahl + ':' + juengste + ':' + (streu >>> 0).toString(36) + ':d' + dateien;
    };
    const zw = (n) => (n < 10 ? '0' : '') + n;
    const stempel = (d = new Date()) => d.getFullYear() + '-' + zw(d.getMonth() + 1) + '-' + zw(d.getDate()) +
        '-' + zw(d.getHours()) + zw(d.getMinutes());
    const zeitAus = (dateiname) => {
        const m = MUSTER.exec(dateiname);
        if (!m)
            return NaN;
        const [, jj, mm, tt, hh, min] = m;
        return new Date(Number(jj), Number(mm) - 1, Number(tt), Number(hh), Number(min)).getTime();
    };
    const zuLoeschen = (namen, jetzt, schutz = '') => {
        const unsere = [];
        for (const n of namen || []) {
            const t = zeitAus(String(n));
            if (Number.isNaN(t))
                continue;
            unsere.push({ n: String(n), t });
        }
        if (unsere.length < 2)
            return [];
        unsere.sort((a, b) => b.t - a.t);
        const behalten = new Set();
        if (schutz)
            behalten.add(schutz);
        const erste = unsere[0];
        if (erste)
            behalten.add(erste.n);
        const grenze = jetzt - BEHALTEN_TAGE * 86400000;
        const monatBelegt = new Set();
        for (const e of unsere) {
            if (e.t >= grenze) {
                behalten.add(e.n);
                continue;
            }
            const d = new Date(e.t);
            const monat = d.getFullYear() + '-' + zw(d.getMonth() + 1);
            if (!monatBelegt.has(monat)) {
                monatBelegt.add(monat);
                behalten.add(e.n);
            }
        }
        return unsere.filter(e => !behalten.has(e.n)).map(e => e.n);
    };
    const aufraeumen = async (ordner, schutz) => {
        if (!ordner || typeof ordner.values !== 'function')
            return 0;
        const namen = [];
        try {
            for await (const eintrag of ordner.values()) {
                if (eintrag && eintrag.kind === 'file')
                    namen.push(String(eintrag.name));
            }
        }
        catch {
            return 0;
        }
        const weg = zuLoeschen(namen, Date.now(), schutz);
        let zahl = 0;
        for (const n of weg) {
            try {
                await ordner.removeEntry(n);
                zahl++;
            }
            catch { }
        }
        return zahl;
    };
    const jetztSichern = async (laut = false) => {
        if (laeuft)
            return { ok: false, grund: 'Es läuft gerade schon eine Sicherung.' };
        const ordner = meta('sicherungOrdner', null);
        if (!ordner)
            return { ok: false, grund: 'Es ist kein Ordner gewählt.' };
        if (typeof App === 'undefined' || typeof App.sicherungPaketBauen !== 'function')
            return { ok: false, grund: 'Die App ist noch nicht bereit.' };
        laeuft = true;
        try {
            if (!await erlaubnis(ordner, false)) {
                const satz = 'Der Ordner „' + (name() || 'Sicherung') + '" ist nicht mehr ' +
                    'freigegeben. Das passiert, wenn der Browser die Erlaubnis zurückgesetzt ' +
                    'hat. Wähle ihn in den Einstellungen einmal neu — bis dahin wird NICHT ' +
                    'automatisch gesichert.';
                melden(satz);
                if (laut && typeof UI !== 'undefined' && UI.toast)
                    UI.toast(satz);
                return { ok: false, grund: satz };
            }
            const abdruck = standAbdruck();
            const paket = await App.sicherungPaketBauen(laut ? null : () => { });
            const dateiname = 'redion-sicherung-' + stempel() + paket.endung;
            const griff = await ordner.getFileHandle(dateiname, { create: true });
            const strom = await griff.createWritable();
            await strom.write(paket.blob);
            await strom.close();
            if (typeof Sicherung !== 'undefined')
                Sicherung.merken(paket.art);
            setzen('sicherungOrdnerAbdruck', abdruck);
            setzen('sicherungOrdnerZuletzt', new Date().toISOString());
            melden('');
            const weg = await aufraeumen(ordner, dateiname);
            if (laut && typeof UI !== 'undefined' && UI.toast)
                UI.toast('Im Ordner gesichert: ' + dateiname +
                    (weg ? ' — ' + weg + ' alte Sicherung(en) aufgeräumt' : ''));
            return { ok: true, grund: '', datei: dateiname };
        }
        catch (err) {
            const satz = 'Die Sicherung in den Ordner kam nicht zustande: ' +
                (err instanceof Error ? err.message : String(err));
            melden(satz);
            if (typeof Reporter !== 'undefined')
                Reporter.error('Sicherung', satz, err);
            if (laut && typeof UI !== 'undefined' && UI.toast)
                UI.toast(satz);
            return { ok: false, grund: satz };
        }
        finally {
            laeuft = false;
        }
    };
    const nachsehen = async () => {
        if (!an() || laeuft)
            return false;
        const jetzt = standAbdruck();
        if (!jetzt)
            return false;
        if (jetzt === String(meta('sicherungOrdnerAbdruck', '')))
            return false;
        const erg = await jetztSichern(false);
        return erg.ok;
    };
    const waehlen = async (zusagen) => {
        if (!moeglich())
            return { ok: false, grund: 'Dieser Browser kann keinen Ordner behalten. ' +
                    'Safari auf iPhone und iPad und Firefox können es nicht — dort bleibt ' +
                    'der Weg „Sicherung speichern" von Hand.' };
        let ordner = null;
        try {
            ordner = await window.showDirectoryPicker({
                id: 'redion-sicherung', mode: 'readwrite', startIn: 'documents'
            });
        }
        catch {
            return { ok: false, grund: '' };
        }
        if (!ordner)
            return { ok: false, grund: '' };
        if (!await erlaubnis(ordner, true))
            return { ok: false, grund: 'Ohne Schreibrecht kann Redion dort nichts ablegen.' };
        const wie = String(ordner.name || 'Ordner');
        const frage = 'Redion legt ab jetzt alle fünf Minuten eine vollständige ' +
            'Sicherung in „' + wie + '" ab — mit allen Seiten, Datenbanken und ' +
            'Anhängen, unverschlüsselt, so wie sie hier liegen.\n\n' +
            'Alte Sicherungen aus diesem Ordner räumt Redion selbst weg: die letzten ' +
            'sieben Tage bleiben vollständig, davor je Monat eine. Angefasst wird ' +
            'NUR, was Redion selbst geschrieben hat.\n\nSoll das so sein?';
        const ja = zusagen ? await zusagen(frage)
            : (typeof confirm === 'function' ? confirm(frage) : false);
        if (!ja)
            return { ok: false, grund: '' };
        setzen('sicherungOrdner', ordner);
        setzen('sicherungOrdnerName', wie);
        setzen('sicherungOrdnerAbdruck', '');
        melden('');
        starteUhr();
        return { ok: true, grund: '', name: wie };
    };
    const loesen = () => {
        setzen('sicherungOrdner', null);
        setzen('sicherungOrdnerAbdruck', '');
        melden('');
        if (uhr) {
            clearInterval(uhr);
            uhr = null;
        }
    };
    const starteUhr = () => {
        if (uhr) {
            clearInterval(uhr);
            uhr = null;
        }
        if (!an())
            return;
        uhr = setInterval(() => { nachsehen().catch(() => { }); }, TAKT);
    };
    const vielleichtErinnern = () => {
        if (typeof Sicherung === 'undefined')
            return;
        if (!meta('sicherungErinnern', false))
            return;
        const heute = new Date().toISOString().slice(0, 10);
        if (String(meta('sicherung:erinnertAm', '')) === heute)
            return;
        const s = Sicherung.stand();
        if (s.stufe === 'gut')
            return;
        setzen('sicherung:erinnertAm', heute);
        const wie = s.tage === null ? 'Es ist noch keine Sicherung bekannt.'
            : 'Die letzte Sicherung ist ' + s.tage + ' Tage alt.';
        if (typeof UI !== 'undefined' && UI.toast)
            UI.toast(wie + ' Mehr → Daten und Sicherheit → Sicherung speichern.');
    };
    const start = () => {
        if (gestartet)
            return;
        gestartet = true;
        starteUhr();
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState !== 'visible')
                    return;
                vielleichtErinnern();
                nachsehen().catch(() => { });
            });
        }
        setTimeout(() => { vielleichtErinnern(); nachsehen().catch(() => { }); }, 20000);
    };
    return { moeglich, an, name, fehler, zuletzt, waehlen, loesen,
        standAbdruck, jetztSichern, nachsehen, zuLoeschen, start,
        MUSTER, BEHALTEN_TAGE, TAKT };
})();
window.OrdnerSicherung = OrdnerSicherung;
