"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/zugang/rechte.ts (npm run bauen:ts). */
const Feldrechte = (() => {
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const STUFEN = [
        ['voll', 'Sehen und ändern'],
        ['lesen', 'Nur sehen'],
        ['kein', 'Gar nicht']
    ];
    const alleKarten = () => Store.getMeta('feldrechteMeins', {}) || {};
    const karte = (sammlungId) => alleKarten()[sammlungId] || {};
    const karteSetzen = (sammlungId, k) => {
        const alle = alleKarten();
        if (k && Object.keys(k).length)
            alle[sammlungId] = k;
        else
            delete alle[sammlungId];
        Store.setMeta('feldrechteMeins', alle);
    };
    const inKraft = () => Object.keys(alleKarten()).length > 0;
    const stufe = (sammlungId, feld) => {
        if (!inKraft())
            return 'voll';
        return karte(sammlungId)[feld] || 'voll';
    };
    const darfSehen = (sammlungId, feld) => stufe(sammlungId, feld) !== 'kein';
    const darfSchreiben = (sammlungId, feld) => stufe(sammlungId, feld) === 'voll';
    const zeichen = (sammlungId, feld) => {
        const s = stufe(sammlungId, feld);
        return s === 'kein' ? '⃠' : s === 'lesen' ? '🔒' : '';
    };
    const holen = async (sammlungId) => {
        if (typeof Wolke === 'undefined' || !Wolke.angemeldet())
            return null;
        const a = await Wolke.ruf('/feldrecht?bereich=' + encodeURIComponent(Wolke.bereich()) +
            '&sammlung=' + encodeURIComponent(sammlungId), { m: 'GET' });
        karteSetzen(sammlungId, a.meins || {});
        return a;
    };
    const setzen = async (sammlungId, feld, konto, rolle, entfernen = false) => {
        const a = await Wolke.ruf('/feldrecht', { m: 'POST', k: {
                bereich: Wolke.bereich(), sammlung: sammlungId, feld,
                konto: konto || '*', rolle, entfernen: !!entfernen
            } });
        await holen(sammlungId);
        return a;
    };
    const auffrischen = async () => {
        if (typeof Wolke === 'undefined' || !Wolke.angemeldet() || !Wolke.bereich())
            return;
        try {
            const a = await Wolke.ruf('/feldrecht?bereich=' +
                encodeURIComponent(Wolke.bereich()), { m: 'GET' });
            const meins = {};
            const ich = (Wolke.zustand.konto || {}).id;
            (a.feldrechte || []).forEach((f) => {
                if (f.kontoId !== '*' && f.kontoId !== ich)
                    return;
                const fuerSammlung = meins[f.sammlung] ?? {};
                meins[f.sammlung] = fuerSammlung;
                if (f.kontoId === ich || fuerSammlung[f.feld] === undefined)
                    fuerSammlung[f.feld] = f.rolle;
            });
            Store.setMeta('feldrechteMeins', (ich && ich === a.besitzer) ? {} : meins);
        }
        catch { }
    };
    const fenster = async (sammlungId) => {
        const coll = Store.getCollection(sammlungId);
        if (!coll)
            return undefined;
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML = '<div class="finder" style="width:min(720px,96vw)">' +
            '<div class="fh">🔒 Rechte je Spalte — ' + esc(coll.name || 'Datenbank') +
            '<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="res" id="fr-inhalt" style="padding:18px;max-height:72vh;overflow:auto"></div></div>';
        document.body.appendChild(o);
        const zeichne = async () => {
            const ziel = o.querySelector('#fr-inhalt');
            if (!ziel)
                return;
            if (typeof Wolke === 'undefined' || !Wolke.angemeldet()) {
                ziel.innerHTML =
                    '<p style="opacity:.8;margin-top:0">Spaltenrechte brauchen einen Server — sie ' +
                        'werden dort geprüft, nicht hier. Solange alles nur auf diesem Gerät liegt, ' +
                        'gibt es niemanden, vor dem etwas zu verbergen wäre.</p>' +
                        '<button class="btn prim" data-a="wolke">Wolke einrichten</button>';
                return;
            }
            ziel.innerHTML = '<p style="opacity:.7">Wird geholt …</p>';
            let daten;
            try {
                daten = await holen(sammlungId);
            }
            catch (e) {
                const grund = e instanceof Error ? e.message : String(e);
                ziel.innerHTML = '<p style="color:var(--gefahr)">' + esc(grund) + '</p>';
                return;
            }
            const liste = daten?.feldrechte || [];
            const proFeld = {};
            liste.forEach(f => { (proFeld[f.feld] = proFeld[f.feld] || []).push(f); });
            ziel.innerHTML =
                '<p style="opacity:.8;margin-top:0">Wer nichts eingetragen bekommt, darf die Spalte ' +
                    'sehen und ändern. Der Besitzer des Bereichs ist immer aussen vor.</p>' +
                    '<p style="opacity:.65;font-size:.9em">Das gilt für <b>geteilte</b> Seiten. ' +
                    'Verschlüsselte kann der Server nicht filtern — dort hat ohnehin nur einer den Schlüssel.</p>' +
                    Object.entries(coll.schema).map(([k, d]) => {
                        const eintraege = proFeld[k] || [];
                        return '<div style="border:1px solid var(--line,#ddd);border-radius:8px;' +
                            'padding:12px;margin:10px 0">' +
                            '<div style="font-weight:600;margin-bottom:8px">' + esc(d.name || k) +
                            '<span style="opacity:.6;font-weight:400"> · ' + esc(d.type) + '</span></div>' +
                            (eintraege.length
                                ? eintraege.map((f) => '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
                                    '<span style="flex:1">' + esc(f.kontoId === '*' ? 'Alle anderen' : f.kontoId) + '</span>' +
                                    '<span style="opacity:.75">' +
                                    esc((STUFEN.find(s => s[0] === f.rolle) || ['', f.rolle])[1]) + '</span>' +
                                    '<button class="btn" data-weg="' + esc(k) + '|' + esc(f.kontoId) + '">aufheben</button>' +
                                    '</div>').join('')
                                : '<div style="opacity:.6;margin-bottom:6px">Keine Einschränkung.</div>') +
                            '<div style="display:flex;gap:6px;margin-top:8px">' +
                            '<input placeholder="Mail oder * für alle" data-mail="' + esc(k) + '" ' +
                            'style="flex:1;padding:6px 8px;border:1px solid var(--line,#ddd);border-radius:6px">' +
                            '<select data-stufe="' + esc(k) + '" style="padding:6px 8px">' +
                            STUFEN.map(s => '<option value="' + s[0] + '">' + s[1] + '</option>').join('') +
                            '</select>' +
                            '<button class="btn prim" data-setz="' + esc(k) + '">Setzen</button>' +
                            '</div></div>';
                    }).join('');
        };
        const satzVon = (err) => err instanceof Error ? err.message : String(err);
        o.addEventListener('click', async (e) => {
            const ziel = e.target instanceof Element ? e.target : null;
            if (e.target === o || ziel?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (ziel?.closest('[data-a="wolke"]')) {
                o.remove();
                WolkeFenster.dialog();
                return;
            }
            const setz = ziel?.closest('[data-setz]');
            if (setz) {
                const k = setz.dataset['setz'];
                if (!k)
                    return;
                const mailFeld = o.querySelector('[data-mail="' + CSS.escape(k) + '"]');
                const stufeFeld = o.querySelector('[data-stufe="' + CSS.escape(k) + '"]');
                if (!mailFeld || !stufeFeld)
                    return;
                const mail = (mailFeld.value || '*').trim() || '*';
                setz.disabled = true;
                try {
                    await setzen(sammlungId, k, mail, stufeFeld.value);
                    UI.toast('Gesetzt');
                }
                catch (err) {
                    UI.toast(satzVon(err));
                }
                setz.disabled = false;
                await zeichne();
                return;
            }
            const weg = ziel?.closest('[data-weg]');
            if (weg) {
                const [k, konto] = (weg.dataset['weg'] || '').split('|');
                if (!k || !konto)
                    return;
                try {
                    await setzen(sammlungId, k, konto, 'voll', true);
                    UI.toast('Aufgehoben');
                }
                catch (err) {
                    UI.toast(satzVon(err));
                }
                await zeichne();
            }
        });
        await zeichne();
        return o;
    };
    return { STUFEN, karte, karteSetzen, stufe, darfSehen, darfSchreiben, zeichen,
        inKraft, holen, setzen, auffrischen, fenster };
})();
window.Feldrechte = Feldrechte;
