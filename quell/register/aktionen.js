"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/aktionen.ts (npm run bauen:ts). */
window.Register = window.Register || {};
const RegisterAktionen = (() => {
    const GRUPPEN = ['oeffnen', 'merken', 'bearbeiten', 'ablegen', 'teilen'];
    const eintraege = [];
    const melde = (e) => {
        if (!e || !e.id || typeof e.tun !== 'function') {
            console.warn('Register.aktionen: Eintrag ohne id oder tun abgewiesen', e);
            return;
        }
        const alt = eintraege.findIndex(x => x.id === e.id);
        if (alt >= 0)
            eintraege.splice(alt, 1, e);
        else
            eintraege.push(e);
    };
    const gilt = (e, ding, ort) => {
        if (!ding || ding.alive === false)
            return false;
        if (!e.gilt)
            return true;
        try {
            return !!e.gilt(ding, ort);
        }
        catch (f) {
            console.warn('Register.aktionen: gilt() von „' + e.id + '" warf', f);
            return false;
        }
    };
    const rangVon = (e) => {
        const g = e.gefahr ? 99 : GRUPPEN.indexOf(e.gruppe);
        return (g < 0 ? GRUPPEN.length : g) * 1000 + (e.rang ?? 500);
    };
    const fuer = (ding, ort) => {
        const o = ort || { kontext: '' };
        return eintraege
            .map((e, i) => ({ e, i }))
            .filter(({ e }) => gilt(e, ding, o))
            .sort((a, b) => rangVon(a.e) - rangVon(b.e) || a.i - b.i)
            .map(({ e }) => {
            let name = '';
            try {
                name = typeof e.name === 'function' ? e.name(ding, o) : e.name;
            }
            catch {
                name = e.id;
            }
            return { id: e.id, name: String(name || e.id), zeichen: e.zeichen || '',
                gruppe: e.gefahr ? 'gefahr' : e.gruppe, gefahr: !!e.gefahr, taste: e.taste || '' };
        });
    };
    const scheitern = (e, ding, o, f) => {
        console.error('Register.aktionen: „' + e.id + '" schlug fehl', f);
        let name = e.id;
        try {
            name = String((typeof e.name === 'function' ? e.name(ding, o) : e.name) || e.id);
        }
        catch { }
        if (typeof UI !== 'undefined' && UI.toast)
            UI.toast('„' + name + '“ hat nicht geklappt.');
    };
    const tun = (id, ding, ort) => {
        const e = eintraege.find(x => x.id === id);
        const o = ort || { kontext: '' };
        if (!e || !gilt(e, ding, o))
            return false;
        try {
            const r = e.tun(ding, o);
            if (r && typeof r.catch === 'function')
                r.catch(f => scheitern(e, ding, o, f));
        }
        catch (f) {
            scheitern(e, ding, o, f);
            return false;
        }
        return true;
    };
    const taste = (t, ding, ort) => {
        const z = fuer(ding, ort).find(x => x.taste === t);
        return z ? window.Register.aktionen.tun(z.id, ding, ort) : false;
    };
    const alle = () => eintraege.map(e => e.id);
    return { melde, fuer, tun, taste, alle, GRUPPEN };
})();
window.Register.aktionen = RegisterAktionen;
