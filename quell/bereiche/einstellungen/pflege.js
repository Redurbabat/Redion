"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/einstellungen/pflege.ts (npm run bauen:ts). */
const Pflege = (() => {
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const befund = () => {
        const b = [];
        const seiten = Object.values(Store.cache.blocks)
            .filter(x => x.type === 'page' && x.alive && x.parentTable !== 'collection');
        const sammlungen = Object.values(Store.cache.collections);
        const ansichten = Object.values(Store.cache.views);
        const verwaist = seiten.filter(p => {
            if (p.parentId && Store.getBlock(p.parentId))
                return false;
            const leer = !(p.content || []).length;
            const verlinkt = Links.verweiseAuf(p.id).length;
            return leer && !verlinkt && !p.favorite;
        });
        if (verwaist.length)
            b.push({
                art: 'hinweis', titel: verwaist.length + ' leere Seiten ohne Verweise',
                text: 'Sie hängen an keiner anderen Seite und enthalten nichts.',
                liste: verwaist.slice(0, 12).map(p => ({ id: p.id, text: p.text || 'Ohne Titel' })),
                tun: 'In den Papierkorb', wirkung: () => {
                    verwaist.forEach(p => Store.trashBlock(p.id));
                    return verwaist.length + ' Seiten in den Papierkorb gelegt';
                }
            });
        const kaputt = [];
        sammlungen.forEach(c => {
            Object.entries(c.schema).forEach(([k, def]) => {
                if (def.type !== 'relation')
                    return;
                if (!def.ziel || !Store.getCollection(def.ziel)) {
                    kaputt.push({ id: c.id, text: (c.name || 'Datenbank') + ' → ' + def.name +
                            ' zeigt auf eine gelöschte Datenbank' });
                    return;
                }
                Store.rowsOf(c.id).forEach((r) => {
                    const ids = (r.props || {})[k];
                    (Array.isArray(ids) ? ids : []).forEach(id => {
                        if (!Store.getBlock(id))
                            kaputt.push({ id: r.id, text: (r.text || 'Zeile') + ' → ' + def.name +
                                    ' verweist auf eine gelöschte Zeile' });
                    });
                });
            });
            if (def_rollupKaputt(c))
                kaputt.push({ id: c.id,
                    text: (c.name || 'Datenbank') + ': ein Rollup hat keine gültige Verknüpfung' });
        });
        if (kaputt.length)
            b.push({
                art: 'warnung', titel: kaputt.length + ' kaputte Verknüpfungen',
                text: 'Sie zeigen auf etwas, das es nicht mehr gibt.',
                liste: kaputt.slice(0, 12),
                tun: 'Tote Verweise entfernen', wirkung: () => {
                    let n = 0;
                    sammlungen.forEach(c => {
                        Object.entries(c.schema).forEach(([k, def]) => {
                            if (def.type !== 'relation')
                                return;
                            Store.rowsOf(c.id).forEach((r) => {
                                const ids = (r.props || {})[k];
                                if (!Array.isArray(ids))
                                    return;
                                const sauber = ids.filter(id => Store.getBlock(id));
                                if (sauber.length !== ids.length) {
                                    Store.setProp(r.id, k, sauber);
                                    n++;
                                }
                            });
                        });
                    });
                    return n + ' Zeilen bereinigt';
                }
            });
        const ungenutzt = [];
        sammlungen.forEach(c => {
            const zeilen = Store.rowsOf(c.id);
            if (zeilen.length < 3)
                return;
            Object.entries(c.schema).forEach(([k, def]) => {
                if (['title', 'formula', 'rollup', 'created', 'edited', 'createdBy', 'editedBy', 'uid', 'button'].includes(def.type))
                    return;
                const gefuellt = zeilen.some((r) => {
                    const v = (r.props || {})[k];
                    return !(v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length));
                });
                if (!gefuellt)
                    ungenutzt.push({ id: c.id,
                        text: (c.name || 'Datenbank') + ' → „' + def.name + '" ist überall leer' });
            });
        });
        if (ungenutzt.length)
            b.push({
                art: 'hinweis', titel: ungenutzt.length + ' Eigenschaften ohne einen einzigen Wert',
                text: 'Sie stehen in der Tabelle, wurden aber nie ausgefüllt.',
                liste: ungenutzt.slice(0, 12)
            });
        if (typeof Pruefsatz !== 'undefined') {
            const ps = Pruefsatz.ueberall();
            if (ps.schlecht) {
                const schlechte = [];
                ps.liste.forEach((x) => x.ergebnisse.filter((e) => !e.ok).forEach((e) => schlechte.push({ id: x.coll.id,
                    text: (x.coll.name || 'Datenbank') + ' → ' + (e.satz.name || 'Prüfsatz') +
                        ' (herausgekommen ist: ' + e.ist + ')' })));
                b.push({
                    art: 'warnung',
                    titel: ps.schlecht + ' Prüfsätze stimmen nicht mehr',
                    text: 'Du hast festgehalten, was herauskommen soll. Das tut es gerade nicht.',
                    liste: schlechte.slice(0, 12)
                });
            }
            else if (ps.gesamt) {
                b.push({
                    art: 'hinweis',
                    titel: 'Alle ' + ps.gesamt + ' Prüfsätze stimmen',
                    text: 'In ' + ps.datenbanken + ' Datenbank(en) rechnen die Formeln so, wie du es ' +
                        'festgehalten hast.'
                });
            }
        }
        if (typeof Fassung !== 'undefined') {
            const alt2 = Fassung.veraltet();
            if (alt2.length)
                b.push({
                    art: 'hinweis',
                    titel: alt2.length + ' Seiten aus Vorlagen haben eine neuere Fassung',
                    text: 'Es wird nur hinzugefügt — keine Zeile geändert, nichts gelöscht.',
                    liste: alt2.slice(0, 12).map(x => ({ id: x.seite.id,
                        text: (x.seite.text || 'Ohne Titel') + ' — Fassung ' + x.von + ' → ' + x.nach })),
                    tun: 'Alle aktualisieren',
                    wirkung: () => { alt2.forEach(x => Fassung.anwenden(x.seite.id)); }
                });
        }
        const leer = sammlungen.filter(c => !Store.rowsOf(c.id).length);
        if (leer.length)
            b.push({
                art: 'hinweis', titel: leer.length + ' Datenbanken ohne Einträge',
                text: 'Angelegt, aber nie gefüllt.',
                liste: leer.slice(0, 12).map(c => ({ id: c.id, text: c.name || 'Ohne Namen' }))
            });
        const teuer = [];
        sammlungen.forEach(c => {
            const zeilen = Store.rowsOf(c.id).slice(0, 40);
            if (!zeilen.length)
                return;
            Object.entries(c.schema).forEach(([k, def]) => {
                if (def.type !== 'formula' && def.type !== 'rollup')
                    return;
                const t0 = performance.now();
                zeilen.forEach((r) => { try {
                    Datenbank.wert(r, k, c);
                }
                catch { } });
                const je = (performance.now() - t0) / zeilen.length;
                if (je > 1.2)
                    teuer.push({ id: c.id,
                        text: (c.name || 'Datenbank') + ' → „' + def.name + '" braucht ' +
                            (Math.round(je * 100) / 100) + ' ms je Zeile' });
            });
        });
        if (teuer.length)
            b.push({
                art: 'warnung', titel: teuer.length + ' aufwendige Formeln',
                text: 'Sie machen grosse Ansichten langsam. Notion sagt nur, dass es langsam werden kann — hier steht, wo.',
                liste: teuer.slice(0, 12)
            });
        const blind = ansichten.filter(v => {
            const c = Store.getCollection(v.collectionId);
            if (!c || !v.filters || !(v.filters.rules || []).length)
                return false;
            const alle = Store.rowsOf(c.id);
            if (!alle.length)
                return false;
            return !alle.some((r) => Datenbank.gruppeTrifftZu(r, v.filters, c));
        });
        if (blind.length)
            b.push({
                art: 'hinweis', titel: blind.length + ' Ansichten zeigen nichts an',
                text: 'Der Filter lässt keine einzige Zeile durch.',
                liste: blind.slice(0, 12).map(v => ({ id: v.collectionId,
                    text: (Store.getCollection(v.collectionId) || {}).name + ' → ' + (v.name || 'Ansicht') }))
            });
        const regelbruch = [];
        sammlungen.forEach(c => {
            const hat = Object.values(c.schema).some(d => Datenbank.hatRegeln(d));
            if (!hat)
                return;
            Store.rowsOf(c.id).forEach((r) => {
                const f = Datenbank.pruefeZeile(c, r);
                if (f.length)
                    regelbruch.push({ id: r.id, text: (r.text || 'Zeile') + ' — ' + f[0] });
            });
        });
        if (regelbruch.length)
            b.push({
                art: 'warnung', titel: regelbruch.length + ' Zeilen verstossen gegen ihre Prüfregeln',
                text: 'Meist Zeilen, die es schon vor der Regel gab.',
                liste: regelbruch.slice(0, 12)
            });
        const muell = Object.values(Store.cache.blocks).filter(x => !x.alive);
        if (muell.length > 50)
            b.push({
                art: 'hinweis', titel: muell.length + ' Dinge liegen im Papierkorb',
                text: 'Sie belegen Platz, bis die Frist abläuft oder du aufräumst.',
                tun: 'Papierkorb jetzt leeren', wirkung: () => {
                    muell.forEach(x => Store.purgeBlock(x.id));
                    return muell.length + ' endgültig gelöscht';
                }
            });
        return b;
    };
    const def_rollupKaputt = (c) => Object.values(c.schema).some(d => d.type === 'rollup' && (!d.relation || !c.schema[d.relation] ||
        c.schema[d.relation].type !== 'relation'));
    const gesundheit = () => {
        const liste = befund();
        const pages = Object.values(Store.cache.blocks).filter(p => p.alive && p.type === 'page');
        const metrics = [[pages.length, 'Seiten'], [liste.filter(x => x.art === 'warnung').length, 'Warnungen'],
            [liste.filter(x => x.art !== 'warnung').length, 'Hinweise']];
        const days = Array.from({ length: 7 }, (_, index) => {
            const day = new Date();
            day.setHours(0, 0, 0, 0);
            day.setDate(day.getDate() - 6 + index);
            const next = new Date(day);
            next.setDate(next.getDate() + 1);
            return { day, count: pages.filter(p => {
                    const edited = new Date(p.edited).getTime();
                    return edited >= day.getTime() && edited < next.getTime();
                }).length };
        });
        const maximum = Math.max(1, ...days.map(day => day.count));
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(760px,95vw)">' +
                '<div class="fh">🩺 Gesundheit des Bestands<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" id="pf-liste" style="max-height:66vh">' +
                '<div class="rmo-health">' + metrics.map(([value, label]) => '<article class="rmo-health-metric"><strong>' + value + '</strong><span>' + label + '</span></article>').join('') + '</div>' +
                '<section class="rmo-health-history"><h3>Letzte Bearbeitungen · 7 Tage</h3><p>Seiten nach ihrem letzten Bearbeitungstag, keine vollständige Änderungshistorie.</p>' +
                '<div class="rmo-history">' + days.map(({ day, count }) => '<div><b>' + count + '</b>' +
                '<progress max="' + maximum + '" value="' + count + '" aria-label="' +
                day.toLocaleDateString('de-CH') + ': ' + count + ' Seiten"></progress><small>' +
                day.toLocaleDateString('de-CH', { weekday: 'short' }) + '</small></div>').join('') + '</div></section>' +
                (liste.length
                    ? liste.map((x, i) => `<div class="pf-karte pf-${x.art}">` +
                        `<div class="pf-titel">${x.art === 'warnung' ? '⚠' : 'ℹ'} ${esc(x.titel)}</div>` +
                        `<div class="pf-text">${esc(x.text)}</div>` +
                        (x.liste && x.liste.length
                            ? '<div class="pf-eintraege">' + x.liste.map(e => `<button data-open="${esc(e.id)}">${esc(e.text)}</button>`).join('') +
                                '</div>' : '') +
                        (x.tun ? `<button class="pf-tun" data-tun="${i}">${esc(x.tun)}</button>` : '') +
                        '</div>').join('')
                    : '<div class="pf-gut">✅ Alles in Ordnung. Keine verwaisten Seiten, keine kaputten ' +
                        'Verknüpfungen, keine leeren Eigenschaften, keine teuren Formeln.</div>') +
                '</div>' +
                '<div class="fbtns"><button data-a="neu">Nochmal prüfen</button>' +
                '<button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                o.remove();
                gesundheit();
                return;
            }
            const auf = elVon(e)?.closest('[data-open]');
            if (auf) {
                const id = auf.dataset.open;
                if (Store.getBlock(id)) {
                    o.remove();
                    App.oeffne(id);
                }
                return;
            }
            const tun = elVon(e)?.closest('[data-tun]');
            if (tun) {
                const x = liste[Number(tun.dataset.tun)];
                if (!x || !x.wirkung)
                    return;
                const meldung = x.wirkung();
                App.zeichneBaum();
                App.zeichneSeite();
                o.remove();
                UI.toast(meldung);
                setTimeout(gesundheit, 300);
            }
        });
    };
    const dubletten = (coll, key) => {
        const schluessel = key || Object.keys(coll.schema).find(k => coll.schema[k].type === 'title');
        const gruppen = new Map();
        Store.rowsOf(coll.id).forEach((r) => {
            const v = String(Datenbank.wert(r, schluessel, coll) ?? '').trim().toLowerCase();
            if (!v)
                return;
            if (!gruppen.has(v))
                gruppen.set(v, []);
            gruppen.get(v).push(r);
        });
        return [...gruppen.entries()].filter(([, rs]) => rs.length > 1)
            .map(([wert, rs]) => ({ wert, zeilen: rs }));
    };
    const dublettenDialog = (coll) => {
        let schluessel = Object.keys(coll.schema).find(k => coll.schema[k].type === 'title');
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(720px,95vw)">' +
                `<div class="fh">⧉ Dubletten in „${esc(coll.name || 'Datenbank')}"` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:12px 18px">Vergleichen nach <select id="dk">' +
                Object.keys(coll.schema)
                    .filter(k => !['formula', 'rollup', 'button'].includes(coll.schema[k].type))
                    .map(k => `<option value="${k}"${k === schluessel ? ' selected' : ''}>` +
                    esc(coll.schema[k].name) + '</option>').join('') +
                '</select></div>' +
                '<div class="res" id="dl" style="max-height:58vh"></div>' +
                '<div class="fbtns"><button data-a="alle">Überall die erste behalten</button>' +
                '<button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        let gruppen = [];
        const zeichne = () => {
            const g = dubletten(coll, schluessel);
            const ziel = o.querySelector('#dl');
            if (!ziel)
                return;
            ziel.innerHTML = g.length
                ? g.map((x, i) => '<div class="pf-karte">' +
                    `<div class="pf-titel">${esc(x.wert)} — ${x.zeilen.length}×</div>` +
                    '<div class="pf-eintraege">' + x.zeilen.map((r) => `<button data-open="${r.id}">${esc(r.text || 'Ohne Titel')}</button>`).join('') + '</div>' +
                    `<button class="pf-tun" data-merge="${i}">Zusammenführen — die erste behalten</button>` +
                    '</div>').join('')
                : '<div class="pf-gut">✅ Keine Dubletten nach dieser Eigenschaft.</div>';
            gruppen = g;
        };
        zeichne();
        const fuehreZusammen = (gruppe) => {
            const [erste, ...rest] = gruppe.zeilen;
            rest.forEach((r) => {
                Object.keys(coll.schema).forEach(k => {
                    const alt = (erste.props || {})[k];
                    const neu = (r.props || {})[k];
                    const leer = alt === undefined || alt === null || alt === '' ||
                        (Array.isArray(alt) && !alt.length);
                    if (leer && neu !== undefined && neu !== null && neu !== '')
                        Store.setProp(erste.id, k, neu);
                });
                Store.updateBlock(r.id, { archiviert: true });
            });
            return rest.length;
        };
        o.addEventListener('change', e => {
            const feld = elVon(e);
            if (feld instanceof HTMLSelectElement && feld.id === 'dk') {
                schluessel = feld.value;
                zeichne();
            }
        });
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const auf = elVon(e)?.closest('[data-open]');
            if (auf) {
                o.remove();
                App.oeffne(auf.dataset.open);
                return;
            }
            const m = elVon(e)?.closest('[data-merge]');
            if (m) {
                const n = fuehreZusammen(gruppen[Number(m.dataset.merge)]);
                zeichne();
                App.zeichneSeite();
                UI.toast(n + ' Zeilen zusammengeführt und archiviert');
                return;
            }
            if (elVon(e)?.closest('[data-a="alle"]')) {
                let n = 0;
                gruppen.forEach((g) => { n += fuehreZusammen(g); });
                zeichne();
                App.zeichneSeite();
                UI.toast(n + ' Zeilen zusammengeführt');
            }
        });
    };
    const papierkorbAufraeumen = async ({ still = true } = {}) => {
        const anzahl = await Store.papierkorbAufraeumen();
        if (anzahl && !still)
            UI.toast(anzahl + (anzahl === 1 ? ' Ding war' : ' Dinge waren') +
                ' zu lange im Papierkorb und wurde' + (anzahl === 1 ? '' : 'n') +
                ' endgültig gelöscht');
        return anzahl;
    };
    const baldWeg = () => Store.papierkorbBaldWeg();
    const fehlerMerken = (fehler, wo) => {
        const text = fehler instanceof Error ? fehler.message : String(fehler);
        const liste = Store.getMeta('fehlerliste', []) || [];
        liste.unshift({ text: text.slice(0, 400), wo: String(wo ?? '').slice(0, 200),
            wann: new Date().toISOString() });
        Store.setMeta('fehlerliste', liste.slice(0, 80));
    };
    const fehlerListe = () => {
        const liste = Store.getMeta('fehlerliste', []) || [];
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(760px,95vw)">' +
                `<div class="fh">🐞 Fehler <em>${liste.length}</em>` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" style="max-height:62vh">' +
                (liste.length
                    ? liste.map((f) => '<div class="pf-karte pf-warnung">' +
                        `<div class="pf-titel">${esc(f.text)}</div>` +
                        `<div class="pf-text">${esc(f.wo)} · ${esc(Werkzeuge.zeitKurz(f.wann))}</div>` +
                        '</div>').join('')
                    : '<div class="pf-gut">✅ Kein einziger Fehler aufgezeichnet.</div>') +
                '</div>' +
                '<div class="fbtns"><button data-a="kopieren">Alles kopieren</button>' +
                '<button data-a="leeren">Liste leeren</button>' +
                '<button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="leeren"]')) {
                Store.setMeta('fehlerliste', []);
                o.remove();
                UI.toast('Fehlerliste geleert');
                return;
            }
            if (elVon(e)?.closest('[data-a="kopieren"]')) {
                Ablage.kopiereJetzt(liste.map((f) => f.wann + ' — ' + f.text + ' (' + f.wo + ')').join('\n'));
                UI.toast('In die Zwischenablage kopiert');
            }
        });
    };
    const bestandPruefen = () => {
        const gefunden = { verwaisteBloecke: 0, toteKinder: 0, zeilenOhneDb: 0, ansichtenOhneDb: 0 };
        Object.values(Store.cache.blocks).forEach(b => {
            if (!Array.isArray(b.content) || !b.content.length)
                return;
            const sauber = b.content.filter((id) => Store.cache.blocks[id]);
            if (sauber.length !== b.content.length) {
                gefunden.toteKinder += b.content.length - sauber.length;
                Store.updateBlock(b.id, { content: sauber });
            }
        });
        Object.values(Store.cache.blocks).forEach(b => {
            if (!b.alive || !b.parentId)
                return;
            if (b.parentTable === 'collection') {
                if (!Store.getCollection(b.parentId)) {
                    gefunden.zeilenOhneDb++;
                    Store.trashBlock(b.id);
                }
            }
            else if (!Store.cache.blocks[b.parentId]) {
                gefunden.verwaisteBloecke++;
                Store.updateBlock(b.id, { parentId: null });
            }
        });
        Object.values(Store.cache.views).forEach(v => {
            if (!Store.getCollection(v.collectionId)) {
                gefunden.ansichtenOhneDb++;
                Store.removeView(v.id);
            }
        });
        return gefunden;
    };
    const ersteHilfe = () => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const zahlen = {
            seiten: Object.values(Store.cache.blocks).filter(x => x.type === 'page' && x.alive).length,
            bloecke: Object.values(Store.cache.blocks).filter(x => x.alive).length,
            dbs: Object.values(Store.cache.collections).length,
            muell: Object.values(Store.cache.blocks).filter(x => !x.alive).length,
            fehler: (Store.getMeta('fehlerliste', []) || []).length
        };
        o.innerHTML =
            '<div class="finder" style="width:min(620px,95vw)">' +
                '<div class="fh">🧰 Erste Hilfe<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:14px 18px; display:flex; flex-direction:column; gap:10px">' +
                `<div class="pf-zahlen">${zahlen.seiten} Seiten · ${zahlen.bloecke} Blöcke · ` +
                `${zahlen.dbs} Datenbanken · ${zahlen.muell} im Papierkorb · ` +
                `${zahlen.fehler} Fehler aufgezeichnet</div>` +
                '<button class="eh-knopf" data-a="gesund"><b>🩺 Gesundheit prüfen</b>' +
                '<span>Verwaiste Seiten, kaputte Verknüpfungen, teure Formeln</span></button>' +
                '<button class="eh-knopf" data-a="reparieren"><b>🔧 Bestand reparieren</b>' +
                '<span>Tote Verweise und verwaiste Blöcke in Ordnung bringen</span></button>' +
                '<button class="eh-knopf" data-a="sichern"><b>💾 Alles sichern</b>' +
                '<span>Vollständige Sicherung als Datei</span></button>' +
                '<button class="eh-knopf" data-a="papier"><b>🗑 Papierkorb aufräumen</b>' +
                '<span>Was älter ist als die Frist, endgültig löschen</span></button>' +
                '<button class="eh-knopf" data-a="fehler"><b>🐞 Fehler ansehen</b>' +
                '<span>Was ist schiefgegangen, wann und wo</span></button>' +
                '</div>' +
                '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const a = elVon(e)?.closest('[data-a]')?.dataset.a;
            if (a === 'gesund') {
                o.remove();
                gesundheit();
            }
            if (a === 'fehler') {
                o.remove();
                fehlerListe();
            }
            if (a === 'sichern') {
                o.remove();
                App.sicherungSpeichern();
            }
            if (a === 'papier') {
                const n = await papierkorbAufraeumen({ still: false });
                if (!n)
                    UI.toast('Nichts ist alt genug — nichts gelöscht');
            }
            if (a === 'reparieren') {
                const g = bestandPruefen();
                const summe = g.toteKinder + g.verwaisteBloecke + g.zeilenOhneDb + g.ansichtenOhneDb;
                App.zeichneBaum();
                App.zeichneSeite();
                UI.toast(summe
                    ? `Repariert: ${g.toteKinder} tote Verweise, ${g.verwaisteBloecke} verwaiste Blöcke, ` +
                        `${g.zeilenOhneDb} Zeilen ohne Datenbank, ${g.ansichtenOhneDb} Ansichten ohne Datenbank`
                    : 'Nichts zu reparieren — der Bestand ist in Ordnung');
            }
        });
    };
    const start = () => {
        addEventListener('error', (e) => {
            try {
                fehlerMerken(e.message || String(e.error), (e.filename || '').split('/').pop() + ':' + (e.lineno || ''));
            }
            catch { }
        });
        addEventListener('unhandledrejection', (e) => {
            try {
                fehlerMerken(e.reason?.message || String(e.reason), 'Versprechen');
            }
            catch { }
        });
        setTimeout(() => papierkorbAufraeumen({ still: false }), 8000);
        setInterval(() => papierkorbAufraeumen({ still: false }), 86400000);
    };
    return { start, gesundheit, befund, dubletten, dublettenDialog,
        papierkorbAufraeumen, baldWeg, fehlerListe, fehlerMerken,
        bestandPruefen, ersteHilfe };
})();
window.Pflege = Pflege;
