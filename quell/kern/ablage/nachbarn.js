"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/ablage/nachbarn.ts (npm run bauen:ts). */
const Nachbarn = (() => {
    const KANAL = 'redion-fenster';
    const FALLBACK = 'redion-fenster-notnagel';
    const meine = 'f' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    let kanal = null;
    let ueberSpeicher = false;
    const hoerer = new Set();
    const austeilen = (nachricht) => {
        const n = nachricht;
        if (!n || n.von === meine)
            return;
        hoerer.forEach(fn => {
            try {
                fn(n);
            }
            catch (err) {
                if (typeof Reporter !== 'undefined')
                    Reporter.error('nachbarn', 'Ein Zuhörer ist gestolpert', err);
            }
        });
    };
    const start = () => {
        if (kanal || ueberSpeicher)
            return true;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                kanal = new BroadcastChannel(KANAL);
                kanal.onmessage = (e) => austeilen(e.data);
                return true;
            }
        }
        catch {
            kanal = null;
        }
        try {
            if (typeof localStorage === 'undefined')
                return false;
            addEventListener('storage', (e) => {
                if (e.key !== FALLBACK || !e.newValue)
                    return;
                try {
                    austeilen(JSON.parse(e.newValue));
                }
                catch { }
            });
            ueberSpeicher = true;
            return true;
        }
        catch {
            return false;
        }
    };
    const sende = (nachricht) => {
        if (!nachricht)
            return false;
        const voll = Object.assign({ von: meine, wann: Date.now() }, nachricht);
        try {
            if (kanal) {
                kanal.postMessage(voll);
                return true;
            }
            if (ueberSpeicher) {
                localStorage.setItem(FALLBACK, JSON.stringify(voll));
                return true;
            }
        }
        catch (err) {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('nachbarn', 'Die anderen Fenster sind nicht erreichbar', err);
        }
        return false;
    };
    const beiNachricht = (fn) => {
        hoerer.add(fn);
        return () => { hoerer.delete(fn); };
    };
    const schliessen = () => {
        try {
            if (kanal)
                kanal.close();
        }
        catch { }
        kanal = null;
        ueberSpeicher = false;
        hoerer.clear();
    };
    return {
        start, sende, beiNachricht, schliessen,
        kennung: () => meine,
        offen: () => !!kanal || ueberSpeicher,
        weg: () => (kanal ? 'kanal' : ueberSpeicher ? 'speicher' : 'keiner')
    };
})();
window.Nachbarn = Nachbarn;
