"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/dateien/ablage.ts (npm run bauen:ts). */
const Dateien = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const K = (n, standard) => (typeof KONSTANTEN !== 'undefined' && Number(KONSTANTEN[n])) || standard;
    const STUECK = K('STUECK', 1024 * 1024);
    const KLEIN = K('KLEIN', 256 * 1024);
    const GRENZE = K('DATEI_MAX', 500 * 1024 * 1024);
    const laufend = new Map();
    const adressen = new Map();
    const laufendeAdressen = new Map();
    const adressVersionen = new Map();
    const anmelden = async ({ name, groesse, typ, blockId, abgeleitet }) => {
        if (!groesse && groesse !== 0)
            throw new Error('Es fehlt die Grösse.');
        if (groesse > GRENZE)
            throw new Error('Diese Datei ist grösser als ' + Math.round(GRENZE / 1048576) +
                ' MB. So viel hält der Browser nicht.');
        const id = Store.uid();
        const teile = Math.max(1, Math.ceil(groesse / STUECK));
        const satz = {
            id, name: name || 'Datei', groesse, typ: typ || 'application/octet-stream',
            blockId: blockId || null, teile, angekommen: 0,
            abgeleitet: !!abgeleitet,
            zustand: 'wartet', angelegt: Store.now(), fertigAm: null
        };
        await Store.dateiPut(satz);
        laufend.set(id, { satz, abgebrochen: false });
        return satz;
    };
    const stueckSchicken = async (dateiId, nr, blob) => {
        const lauf = laufend.get(dateiId);
        const satz = (lauf && lauf.satz) || await Store.dateiHolen(dateiId);
        if (!satz)
            throw new Error('Diesen Upload gibt es nicht.');
        if (satz.zustand === 'fertig')
            throw new Error('Dieser Upload ist schon abgeschlossen.');
        if (nr < 0 || nr >= satz.teile)
            throw new Error('Stück ' + nr + ' gibt es nicht — es sind ' + satz.teile + '.');
        await Store.stueckPut({ id: dateiId + ':' + nr, dateiId, nr, blob });
        satz.angekommen = Math.max(satz.angekommen, nr + 1);
        satz.zustand = 'laeuft';
        await Store.dateiPut(satz);
        return { nr, von: satz.teile, anteil: satz.angekommen / satz.teile };
    };
    const bestaetigen = async (dateiId) => {
        const satz = await Store.dateiHolen(dateiId);
        if (!satz)
            throw new Error('Diesen Upload gibt es nicht.');
        const stuecke = await Store.stueckeVon(dateiId);
        if (stuecke.length !== satz.teile) {
            const da = new Set(stuecke.map((s) => s.nr));
            const fehlt = [];
            for (let i = 0; i < satz.teile; i++)
                if (!da.has(i))
                    fehlt.push(i);
            throw new Error('Es fehlen noch ' + fehlt.length + ' Stück(e): ' +
                fehlt.slice(0, 8).join(', ') + (fehlt.length > 8 ? ' …' : ''));
        }
        satz.zustand = 'fertig';
        satz.fertigAm = Store.now();
        await Store.dateiPut(satz);
        laufend.delete(dateiId);
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('import', 'Datei „' + satz.name + '" abgelegt (' +
                groesseText(satz.groesse) + ', ' + satz.teile + ' Stück)', { id: dateiId });
        return satz;
    };
    const abbrechen = async (dateiId) => {
        const lauf = laufend.get(dateiId);
        if (lauf)
            lauf.abgebrochen = true;
        await weg(dateiId);
        return true;
    };
    const ablegen = async (datei, opt) => {
        opt = opt || {};
        const dateiName = typeof File !== 'undefined' && datei instanceof File ? datei.name : '';
        const satz = await anmelden({
            name: opt.name || dateiName || 'Datei',
            groesse: datei.size, typ: datei.type, blockId: opt.blockId,
            abgeleitet: !!opt.abgeleitet
        });
        try {
            for (let nr = 0; nr < satz.teile; nr++) {
                const lauf = laufend.get(satz.id);
                if (lauf && lauf.abgebrochen)
                    throw new Error('Abgebrochen.');
                const von = nr * STUECK;
                await stueckSchicken(satz.id, nr, datei.slice(von, Math.min(von + STUECK, datei.size)));
                if (opt.beiFortschritt)
                    opt.beiFortschritt((nr + 1) / satz.teile, nr + 1, satz.teile);
            }
            return await bestaetigen(satz.id);
        }
        catch (e) {
            await weg(satz.id);
            throw e;
        }
    };
    const verknuepfen = async (dateiId, blockId) => {
        const satz = await Store.dateiHolen(dateiId);
        if (!satz)
            throw new Error('Diese Datei gibt es nicht mehr.');
        satz.blockId = blockId || null;
        await Store.dateiPut(satz);
        return satz;
    };
    const alsBlob = async (dateiId) => {
        const satz = await Store.dateiHolen(dateiId);
        if (!satz)
            return null;
        const stuecke = await Store.stueckeVon(dateiId);
        if (!stuecke.length)
            return null;
        if (typeof satz.teile === 'number' && satz.teile > 0 &&
            stuecke.length !== satz.teile) {
            if (typeof Reporter !== 'undefined')
                Reporter.warn('dateien', 'Datei „' + satz.name + '" ist unvollständig (' +
                    stuecke.length + ' von ' + satz.teile + ' Stücken) und wird nicht zusammengesetzt');
            return null;
        }
        return new Blob(stuecke.map((s) => s.blob), { type: satz.typ });
    };
    const adresseBekannt = (dateiId) => adressen.get(dateiId) || null;
    const adresse = (dateiId) => {
        const bekannte = adressen.get(dateiId);
        if (bekannte)
            return Promise.resolve(bekannte);
        const laufende = laufendeAdressen.get(dateiId);
        if (laufende)
            return laufende;
        const version = adressVersionen.get(dateiId) || 0;
        const arbeit = alsBlob(dateiId).then(blob => {
            if (!blob || version !== (adressVersionen.get(dateiId) || 0))
                return null;
            const url = URL.createObjectURL(blob);
            adressen.set(dateiId, url);
            return url;
        }).finally(() => {
            if (laufendeAdressen.get(dateiId) === arbeit)
                laufendeAdressen.delete(dateiId);
        });
        laufendeAdressen.set(dateiId, arbeit);
        return arbeit;
    };
    const adresseWeg = (dateiId) => {
        adressVersionen.set(dateiId, (adressVersionen.get(dateiId) || 0) + 1);
        laufendeAdressen.delete(dateiId);
        const url = adressen.get(dateiId);
        if (url) {
            try {
                URL.revokeObjectURL(url);
            }
            catch { }
            adressen.delete(dateiId);
        }
    };
    const herunterladen = async (dateiId) => {
        const satz = await Store.dateiHolen(dateiId);
        const nativeDateien = globalThis.RedionNativeDateien;
        if (nativeDateien && typeof nativeDateien.speichern === 'function') {
            if (!satz) {
                UI.toast('Diese Datei gibt es nicht mehr');
                return false;
            }
            const blob = await alsBlob(dateiId);
            if (!blob) {
                UI.toast('Diese Datei ist nicht vollständig lesbar');
                return false;
            }
            try {
                await nativeDateien.speichern(blob, String(satz.name || 'Datei'));
                UI.toast('Datei unter Auf meinem iPhone → Redion → Exporte gespeichert. Für iCloud Drive im Teilen-Menü „In Dateien sichern“ wählen.');
                if (typeof Protokoll !== 'undefined')
                    Protokoll.notieren('export', 'Datei „' + satz.name + '“ in iOS-Dateien exportiert', { id: dateiId });
                return true;
            }
            catch (err) {
                UI.toast('Datei konnte nicht gespeichert werden: ' +
                    (err instanceof Error ? err.message : String(err)));
                return false;
            }
        }
        const url = await adresse(dateiId);
        if (!url || !satz) {
            UI.toast('Diese Datei gibt es nicht mehr');
            return false;
        }
        const a = document.createElement('a');
        a.href = url;
        a.download = satz.name;
        a.click();
        if (typeof Protokoll !== 'undefined')
            Protokoll.notieren('export', 'Datei „' + satz.name + '" heruntergeladen', { id: dateiId });
        return true;
    };
    const weg = async (dateiId) => {
        const stuecke = await Store.stueckeVon(dateiId);
        for (const s of stuecke)
            await Store.stueckWeg(s.id);
        if (Store.dateiGrabstein)
            Store.dateiGrabstein(dateiId);
        await Store.dateiWeg(dateiId);
        adresseWeg(dateiId);
        laufend.delete(dateiId);
        return stuecke.length;
    };
    const verwaist = async () => {
        const alle = await Store.dateiAlle();
        const beansprucht = Store.dateiAnspruch
            ? Store.dateiAnspruch(true) : new Map();
        return alle.filter((d) => {
            if (d.zustand !== 'fertig')
                return true;
            if (beansprucht.has(String(d.id)))
                return false;
            if (!d.blockId)
                return false;
            const b = Store.getBlock(d.blockId);
            return !b || b.alive === false;
        });
    };
    const aufraeumen = async () => {
        const liste = await verwaist();
        let bytes = 0;
        for (const d of liste) {
            bytes += d.groesse || 0;
            await weg(d.id);
        }
        return { anzahl: liste.length, bytes };
    };
    const groesseText = (n) => {
        const b = Number(n) || 0;
        if (b < 1024)
            return b + ' B';
        if (b < 1048576)
            return (b / 1024).toFixed(1).replace('.0', '') + ' KB';
        if (b < 1073741824)
            return (b / 1048576).toFixed(1).replace('.0', '') + ' MB';
        return (b / 1073741824).toFixed(2) + ' GB';
    };
    const zahlen = async () => {
        const alle = await Store.dateiAlle();
        const fertig = alle.filter((d) => d.zustand === 'fertig');
        return {
            anzahl: alle.length,
            fertig: fertig.length,
            offen: alle.length - fertig.length,
            bytes: alle.reduce((n, d) => n + (d.groesse || 0), 0),
            stuecke: alle.reduce((n, d) => n + (d.teile || 0), 0)
        };
    };
    const lohntSich = (groesse) => Number(groesse) > KLEIN;
    const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] ?? c));
    const dialog = async () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(700px,95vw)">' +
                '<div class="fh">📎 Dateien <em id="da-zahl"></em>' +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" id="da-liste" style="padding:8px"></div>' +
                '<div class="fbtns">' +
                '<span id="da-summe" style="flex:1; font-size:12px; color:var(--text-faint); ' +
                'align-self:center"></span>' +
                '<button data-a="neu">Datei ablegen</button>' +
                '<button data-a="putz">Verwaistes aufräumen</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        const zeichne = async () => {
            const alle = (await Store.dateiAlle())
                .sort((a, b) => String(b.angelegt).localeCompare(String(a.angelegt)));
            const z = await zahlen();
            const zahlFeld = o.querySelector('#da-zahl'), summeFeld = o.querySelector('#da-summe'), listeFeld = o.querySelector('#da-liste');
            if (!zahlFeld || !summeFeld || !listeFeld)
                return;
            zahlFeld.textContent = String(z.anzahl);
            summeFeld.textContent =
                z.anzahl ? groesseText(z.bytes) + ' in ' + z.stuecke + ' Stücken' +
                    (z.offen ? ' · ' + z.offen + ' unfertig' : '')
                    : 'Noch nichts abgelegt.';
            listeFeld.innerHTML = alle.length
                ? alle.map((d) => {
                    const b = d.blockId ? Store.getBlock(d.blockId) : null;
                    const wo = b && b.alive !== false
                        ? esc((b.text || 'Ohne Titel').slice(0, 40))
                        : (d.blockId ? '<i>Block gelöscht</i>' : '<i>frei</i>');
                    const anteil = Math.round((d.angekommen / Math.max(1, d.teile)) * 100);
                    return '<div class="da-zeile">' +
                        `<span class="da-ic">${d.zustand === 'fertig' ? '📄' : '⏳'}</span>` +
                        `<div class="da-mitte"><b>${esc(d.name)}</b>` +
                        `<span>${esc(groesseText(d.groesse))} · ${d.teile} Stück · ${wo}` +
                        (d.zustand === 'fertig' ? '' : ` · ${anteil}%`) + '</span></div>' +
                        (d.zustand === 'fertig'
                            ? `<button data-lade="${d.id}" title="Herunterladen">⭳</button>` : '') +
                        `<button data-weg="${d.id}" data-loeschknopf title="Datei löschen">🗑</button>` +
                        '</div>';
                }).join('')
                : '<div style="padding:22px; color:var(--text-faint); font-size:14px">' +
                    'Noch keine Datei in Stücken abgelegt. Kleine Dateien gehen weiterhin ' +
                    'direkt in den Block — der Umweg lohnt sich erst ab ' +
                    groesseText(KLEIN) + '.</div>';
        };
        await zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const lade = elVon(e)?.closest('[data-lade]');
            if (lade?.dataset["lade"]) {
                try {
                    await herunterladen(lade.dataset["lade"]);
                }
                catch (err) {
                    if (typeof Reporter !== 'undefined')
                        Reporter.error('dateien', 'Herunterladen abgebrochen', err);
                    UI.toast('Datei konnte nicht heruntergeladen werden: ' +
                        (err instanceof Error ? err.message : String(err)));
                }
                return;
            }
            const w = elVon(e)?.closest('[data-weg]');
            if (w) {
                if (!w.dataset["weg"])
                    return;
                try {
                    await weg(w.dataset["weg"]);
                    await zeichne();
                    UI.toast('Datei gelöscht');
                }
                catch (err) {
                    if (typeof Reporter !== 'undefined')
                        Reporter.error('dateien', 'Löschen abgebrochen', err);
                    UI.toast('Datei wurde nicht gelöscht: ' +
                        (err instanceof Error ? err.message : String(err)));
                }
                return;
            }
            const a = elVon(e)?.closest('[data-a]');
            if (!a)
                return;
            if (a.dataset['a'] === 'putz') {
                try {
                    const erg = await aufraeumen();
                    await zeichne();
                    UI.toast(erg.anzahl
                        ? erg.anzahl + ' aufgeräumt, ' + groesseText(erg.bytes) + ' frei'
                        : 'Nichts aufzuräumen');
                }
                catch (err) {
                    if (typeof Reporter !== 'undefined')
                        Reporter.error('dateien', 'Aufräumen abgebrochen', err);
                    UI.toast('Aufräumen abgebrochen: ' +
                        (err instanceof Error ? err.message : String(err)));
                }
            }
            if (a.dataset['a'] === 'neu') {
                const inp = document.createElement('input');
                inp.type = 'file';
                inp.addEventListener('change', async () => {
                    const f = inp.files?.[0];
                    if (!f)
                        return;
                    const balken = document.createElement('div');
                    balken.className = 'da-fortschritt';
                    balken.innerHTML = '<b>' + esc(f.name) + '</b><i></i><span>0 %</span>';
                    o.querySelector('#da-liste')?.prepend(balken);
                    try {
                        await ablegen(f, { beiFortschritt: (anteil) => {
                                const i2 = balken.querySelector('i'), sp = balken.querySelector('span');
                                if (i2)
                                    i2.style.width = Math.round(anteil * 100) + '%';
                                if (sp)
                                    sp.textContent = Math.round(anteil * 100) + ' %';
                            } });
                        await zeichne();
                        UI.toast('„' + f.name + '" abgelegt');
                    }
                    catch (err) {
                        balken.remove();
                        UI.toast('Ging nicht: ' + (err instanceof Error ? err.message : String(err)));
                    }
                });
                inp.click();
            }
        });
    };
    return { STUECK, KLEIN, GRENZE,
        anmelden, stueckSchicken, bestaetigen, abbrechen, ablegen,
        verknuepfen,
        alsBlob, adresse, adresseBekannt, adresseWeg, herunterladen,
        weg, verwaist, aufraeumen, zahlen, groesseText, lohntSich, dialog };
})();
window.Dateien = Dateien;
