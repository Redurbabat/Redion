"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/auftraege/maschine.ts (npm run bauen:ts). */
const Auftraege = (() => {
    const TAKT_MS = 4000;
    const AUFHEBEN_MS = 24 * 3600 * 1000;
    const HALTEN_MS = 10000;
    const ICH = 'w' + Math.random().toString(36).slice(2, 10) + '-' + String(Date.now() % 100000);
    const werkzeuge = new Map();
    const namen = new Map();
    const abbrueche = new Set();
    let takt = null;
    let laeuftGerade = false;
    let bereit = false;
    const jetzt = () => Date.now();
    const zeitText = () => (typeof Store !== 'undefined' && Store.now) ? Store.now() : new Date().toISOString();
    const melde = (name, daten) => {
        if (typeof Ereignisse === 'undefined' || !Ereignisse.melde)
            return;
        try {
            Ereignisse.melde(name, daten);
        }
        catch { }
    };
    let laedt = null;
    let stromGefragt = false;
    const stromBeobachten = () => {
        if (stromGefragt)
            return;
        stromGefragt = true;
        const nav = globalThis.navigator;
        if (!nav || typeof nav.getBattery !== 'function')
            return;
        try {
            nav.getBattery().then((akku) => {
                if (!akku)
                    return;
                laedt = !!akku.charging;
                try {
                    akku.addEventListener('chargingchange', () => {
                        laedt = !!akku.charging;
                        void takten();
                    });
                }
                catch { }
            }).catch(() => { });
        }
        catch { }
    };
    const teuerJetzt = () => {
        const nav = globalThis.navigator;
        const v = nav && (nav.connection || nav.mozConnection || nav.webkitConnection);
        if (!v)
            return null;
        if (v.saveData === true)
            return true;
        if (typeof v.type === 'string')
            return v.type === 'cellular';
        return null;
    };
    const lage = () => {
        const d = new Date();
        return { minute: d.getHours() * 60 + d.getMinutes(), laedt, teuer: teuerJetzt() };
    };
    const wartetAuf = (a) => {
        if (!a || a.zustand !== 'wartet')
            return '';
        if (typeof Zeitplan === 'undefined')
            return '';
        return Zeitplan.darf(a.bedingung, lage()).grund;
    };
    const PLAN_SCHLUESSEL = 'auftragPlan';
    const standardBedingung = () => {
        if (typeof Zeitplan === 'undefined')
            return null;
        if (typeof Store === 'undefined' || !Store.getMeta)
            return null;
        try {
            return Zeitplan.sauber(Store.getMeta(PLAN_SCHLUESSEL, null));
        }
        catch {
            return null;
        }
    };
    const plan = () => standardBedingung();
    const planSetzen = async (roh) => {
        if (typeof Zeitplan === 'undefined')
            return null;
        const b = Zeitplan.sauber(roh);
        if (typeof Store !== 'undefined' && Store.setMeta)
            await Store.setMeta(PLAN_SCHLUESSEL, b);
        return b;
    };
    const anmelden = (art, werkzeug, name) => {
        if (!art || typeof werkzeug !== 'function') {
            throw new Error('Eine Auftragsart braucht einen Namen und einen Läufer.');
        }
        werkzeuge.set(art, werkzeug);
        if (name)
            namen.set(art, name);
        return () => { werkzeuge.delete(art); namen.delete(art); };
    };
    const arten = () => [...werkzeuge.keys()];
    const artName = (art) => namen.get(art) || '';
    const anlegen = async (art, eingabe, opt = {}) => {
        if (typeof Store === 'undefined' || !Store.auftragPut) {
            throw new Error('Die Ablage steht noch nicht — Aufträge brauchen sie.');
        }
        const id = opt.id || Store.uid();
        const bedingung = 'bedingung' in opt
            ? (typeof Zeitplan !== 'undefined' ? Zeitplan.sauber(opt.bedingung) : null)
            : standardBedingung();
        const a = JobModell.anlegen(id, art, eingabe, jetzt(), zeitText(), { ...opt, bedingung });
        await Store.auftragPut(a);
        melde(ARTEN.auftragAngelegt, { id, art });
        void takten();
        return a;
    };
    const alle = async () => (typeof Store !== 'undefined' && Store.auftragAlle) ? (await Store.auftragAlle()) || [] : [];
    const einer = async (id) => (typeof Store !== 'undefined' && Store.auftragHolen) ? await Store.auftragHolen(id) : null;
    const offen = async () => (await alle()).filter(a => !JobModell.beendet(a));
    const abbrechen = async (id) => {
        const a = await einer(id);
        if (!a || JobModell.beendet(a))
            return false;
        abbrueche.add(id);
        if (a.zustand === 'wartet') {
            await Store.auftragPut(JobModell.abbrechen(a, zeitText()));
            melde(ARTEN.auftragBeendet, { id, art: a.art, zustand: 'abgebrochen' });
            abbrueche.delete(id);
        }
        return true;
    };
    const SCHLOSS = 'redion-auftraege';
    const nurEiner = async (tun) => {
        const schloesser = globalThis.navigator?.locks;
        if (!schloesser || typeof schloesser.request !== 'function')
            return tun();
        let erg = false, gelaufen = false;
        try {
            await schloesser.request(SCHLOSS, { ifAvailable: true }, async (s) => {
                if (!s)
                    return;
                gelaufen = true;
                erg = await tun();
            });
        }
        catch {
            if (!gelaufen)
                erg = await tun();
        }
        return erg;
    };
    const takten = async () => {
        if (laeuftGerade || !bereit)
            return false;
        if (typeof Store === 'undefined' || !Store.auftragNehmen)
            return false;
        if (!werkzeuge.size)
            return false;
        return nurEiner(taktenJetzt);
    };
    const taktenJetzt = async () => {
        if (laeuftGerade)
            return false;
        laeuftGerade = true;
        try {
            const t = jetzt();
            const jetztLage = lage();
            const genommen = await Store.auftragNehmen((liste) => {
                const kandidaten = liste.filter(a => werkzeuge.has(a.art) &&
                    (typeof Zeitplan === 'undefined' || Zeitplan.darf(a.bedingung, jetztLage).ok));
                const naechst = JobModell.naechster(kandidaten, t, ICH);
                if (!naechst)
                    return null;
                return JobModell.nehmen(naechst, t, ICH, zeitText());
            });
            if (!genommen)
                return false;
            await arbeiten(genommen);
            return true;
        }
        catch (e) {
            melde(ARTEN.auftragFehler, { fehler: String(e && e.message || e) });
            return false;
        }
        finally {
            laeuftGerade = false;
        }
    };
    const arbeiten = async (a) => {
        const werkzeug = werkzeuge.get(a.art);
        if (!werkzeug)
            return;
        melde(ARTEN.auftragBeginnt, { id: a.id, art: a.art, versuch: a.versuche });
        let stand = a;
        const schreiben = async (neu) => {
            stand = neu;
            await Store.auftragPut(neu);
        };
        const hilfe = {
            schritt: async (wert, text) => {
                await schreiben(JobModell.schrittFertig(stand, wert, jetzt(), text, HALTEN_MS));
                melde(ARTEN.auftragSchritt, {
                    id: a.id, art: a.art, schritt: stand.schritt,
                    schritte: stand.schritte, text: stand.text
                });
            },
            abgebrochen: () => abbrueche.has(a.id),
            lebt: async () => {
                await schreiben(JobModell.halten(stand, jetzt(), HALTEN_MS));
            }
        };
        try {
            const ergebnis = await werkzeug(stand, hilfe);
            if (abbrueche.has(a.id)) {
                abbrueche.delete(a.id);
                await schreiben(JobModell.abbrechen(stand, zeitText()));
                melde(ARTEN.auftragBeendet, { id: a.id, art: a.art, zustand: 'abgebrochen' });
                return;
            }
            await schreiben(JobModell.fertig({ ...stand, stand: ergebnis === undefined ? stand.stand : ergebnis }, zeitText()));
            melde(ARTEN.auftragBeendet, { id: a.id, art: a.art, zustand: 'fertig' });
        }
        catch (e) {
            abbrueche.delete(a.id);
            const meldung = String(e && e.message || e);
            const danach = JobModell.gescheitert(stand, meldung, jetzt(), zeitText());
            await schreiben(danach);
            melde(danach.zustand === 'fehler' ? 'auftrag.beendet' : 'auftrag.fehler', { id: a.id, art: a.art, zustand: danach.zustand,
                fehler: meldung, versuche: danach.versuche });
        }
    };
    const wiederaufnehmen = async () => {
        const t = jetzt();
        let n = 0;
        for (const a of await alle()) {
            if (a.zustand !== 'laeuft')
                continue;
            if (a.geraet === ICH)
                continue;
            if (a.bisWann > t)
                continue;
            const neu = JobModell.zurueckstellen(a, t, zeitText());
            if (neu === a)
                continue;
            await Store.auftragPut(neu);
            n++;
            melde(ARTEN.auftragWiederaufgenommen, {
                id: a.id, art: a.art, schritt: a.schritt, zustand: neu.zustand
            });
        }
        return n;
    };
    const aufraeumen = async (haltenMs = AUFHEBEN_MS) => {
        const t = jetzt();
        let n = 0;
        for (const a of await alle()) {
            if (!JobModell.aufraeumbar(a, t, haltenMs))
                continue;
            await Store.auftragWeg(a.id);
            n++;
        }
        return n;
    };
    const start = async () => {
        if (bereit)
            return;
        bereit = true;
        stromBeobachten();
        try {
            await wiederaufnehmen();
            await aufraeumen();
        }
        catch (e) {
            melde(ARTEN.auftragFehler, { fehler: String(e && e.message || e) });
        }
        if (takt)
            clearInterval(takt);
        takt = setInterval(() => { void takten(); }, TAKT_MS);
        void takten();
    };
    const stopp = () => {
        if (takt)
            clearInterval(takt);
        takt = null;
        bereit = false;
    };
    const leeren = async () => {
        let n = 0;
        for (const a of await alle()) {
            await Store.auftragWeg(a.id);
            n++;
        }
        return n;
    };
    return {
        start, stopp, takten, anmelden, arten, artName, anlegen, abbrechen,
        nurEiner, SCHLOSS,
        alle, offen, einer, wiederaufnehmen, aufraeumen, leeren,
        wartetAuf, lage, plan, planSetzen, PLAN_SCHLUESSEL,
        ICH, TAKT_MS, AUFHEBEN_MS
    };
})();
window.Auftraege = Auftraege;
