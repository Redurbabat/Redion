"use strict";
/* ============================================================================
 * bereiche/datenbanken/raster.ts — eine Datenbank wie eine Tabelle bedienen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/raster.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/datenbanken/raster.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen;
 * `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ─── WAS DAS IST, UND WARUM ES DIE GRÖSSTE LÜCKE VON NOTION SCHLIESST ───────
 *
 * Notions Tabellenansicht sieht aus wie eine Tabelle und lässt sich nicht wie
 * eine bedienen. Man kann nicht mit den Pfeiltasten durchgehen. Man kann
 * keinen Bereich auswählen. Man kann nicht dreissig Zellen auf einmal aus
 * Excel einfügen. Für jede einzelne Zelle: klicken, tippen, Escape.
 *
 * Wer hundert Zeilen zu erfassen hat, macht das in Excel und kopiert es
 * hinterher irgendwie hinein. Genau dort verliert Notion die Leute, die
 * wirklich Daten haben.
 *
 * Diese Ansicht ist dieselbe Datenbank — mit der Bedienung eines
 * Tabellenprogramms:
 *
 *     Pfeiltasten · Umschalt+Pfeil für Bereiche · Tab und Enter
 *     Tippen fängt sofort an · Entf leert · Strg+A
 *     Kopieren und Einfügen als Tabulatortext, also mit Excel in BEIDE
 *     Richtungen — und Einfügen legt fehlende Zeilen an
 *
 * ─── DIE ZWEI STELLEN, AN DENEN DAS GEFÄHRLICH WIRD ─────────────────────────
 *
 * **1 · Einfügen ist eine Massenänderung.** Dreissig Zeilen aus der
 * Zwischenablage schreiben dreissig mal fünf Werte. Geht dabei etwas schief,
 * ist es viel auf einmal. Deshalb wird vorher gesagt, wie viel kommt und wie
 * viel überschrieben wird — nachgezählt, nicht geschätzt.
 *
 * **2 · Nicht jede Spalte lässt sich schreiben.** Eine Formelspalte, eine
 * Rollup-Spalte, „erstellt am" — die rechnen sich aus, und ein Wert von Hand
 * hätte dort keine Wirkung, aber es sähe aus, als hätte er eine. Sie sind
 * hier gesperrt und dabei sichtbar: gezeigt wird, was drinsteht, nur ändern
 * lässt es sich nicht.
 *
 * ─── UND WAS SIE NICHT IST ──────────────────────────────────────────────────
 *
 * Kein zweiter Editor für Zellen mit eigener Oberfläche. Auswahl-, Datums-
 * und Verknüpfungsspalten haben in der gewöhnlichen Tabellenansicht ihre
 * eigenen kleinen Fenster, und die sind dort richtig. Hier wird Text getippt
 * und beim Übernehmen umgewandelt — das ist die Bedienung, die man von einem
 * Raster erwartet.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu, also TypeScript
 * von Anfang an — E28.
 * ==========================================================================*/
const DbRaster = (() => {
    const SB = 150; /* Spaltenbreite, Vorgabe */
    const SB_MIN = 60;
    const ZH = 32;
    /* 44 und nicht 40 — aus zwei Gründen, und der zweite wiegt schwerer.
       §37 verlangt 44 px für alles, was mit dem Finger getroffen wird, und
       eine Rasterzelle wird angetippt.
       Vor allem aber teilt sich das Raster die CSS mit dem Tabellenblock:
       `class="tbl tbl-db"`, also gilt `--tbl-zh` hier mit. Als E64 die
       Variable auf 44 setzte, rechnete dieses Modul weiter mit 40 — und die
       Zeilennummern standen versetzt zu ihren Zellen. Beide Zahlen gehören
       zusammen; `test137` §2b misst es jetzt auch für das Raster. */
    const ZH_HANDY = 44;
    const PUFFER = 6;
    const amTelefon = () => typeof window !== 'undefined' && typeof AppEinstellung !== 'undefined'
        ? AppEinstellung.amTelefon()
        : typeof window !== 'undefined' && window.matchMedia
            ? window.matchMedia('(max-width: 760px)').matches : false;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    /**
     * Spalten, die sich ausrechnen und deshalb nicht von Hand geschrieben
     * werden können.
     *
     * Sie sind hier gesperrt und trotzdem zu sehen. Der andere Weg — sie
     * ausblenden — wäre schlechter: dann fehlte in der Ansicht genau die
     * Spalte, wegen der man hinsieht.
     */
    const GERECHNET = ['formula', 'rollup', 'created', 'edited', 'createdBy', 'editedBy', 'uid'];
    const schreibbar = (def) => !!def && !GERECHNET.includes(def.type);
    /** Spalten, deren Wert ein Zeitpunkt ist — auch wenn er als Text ankommt. */
    const ZEITSPALTEN = ['date', 'created', 'edited'];
    /**
     * Was in der Zelle steht — als Text, wie ihn auch die CSV bekäme.
     *
     * DER ZEITSTEMPEL IST DER FALL, DEN MAN ÜBERSIEHT. `created` und `edited`
     * kommen nicht als `Date` zurück, sondern als ISO-Zeichenkette:
     *
     *     2026-08-04T17:57:39.184Z
     *
     * Das ging durch jede Prüfung — es ist ja ein gültiger Text — und stand
     * dann so in der Spalte „Kunde seit". Niemand liest das, und in eine
     * Spalte, die 130 Pixel breit ist, passt es auch nicht. Gesehen habe ich
     * es erst auf dem Bildschirmfoto.
     */
    const alsText = (row, key, coll) => {
        if (typeof Datenbank === 'undefined')
            return '';
        const v = Datenbank.wert(row, key, coll);
        if (v === null || v === undefined || v === '')
            return '';
        if (Array.isArray(v))
            return v.map((x) => (x && x.name) || x).join('; ');
        if (v instanceof Date)
            return v.toLocaleDateString('de-CH');
        if (typeof v === 'boolean')
            return v ? 'WAHR' : 'FALSCH';
        const def = coll && coll.schema ? coll.schema[key] : null;
        if (def && ZEITSPALTEN.includes(def.type) && typeof v === 'string') {
            const d = new Date(v);
            if (!isNaN(d.getTime())) {
                /* Bei „erstellt am" gehört die Uhrzeit dazu — zwei Zeilen am selben
                   Tag unterscheiden sich sonst nicht. Bei einer gewöhnlichen
                   Datumsspalte nicht: dort hat der Mensch ein Datum gemeint. */
                return def.type === 'date'
                    ? d.toLocaleDateString('de-CH')
                    : d.toLocaleDateString('de-CH') + ' ' +
                        d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
            }
        }
        if (typeof Formula !== 'undefined' && Formula.anzeige)
            return String(Formula.anzeige(v));
        return String(v);
    };
    /**
     * Einen getippten Text in den Wert der Spalte umwandeln.
     *
     * DAS DEUTSCHE KOMMA ZÄHLT MIT: wer `1,5` in eine Zahlenspalte tippt, meint
     * eineinhalb. Ohne diese Zeile stünde dort Text, die Spaltensumme wäre um
     * diesen Betrag zu klein — und niemand sähe, warum.
     */
    const ausText = (text, def) => {
        const t = String(text ?? '').trim();
        if (!def)
            return t;
        switch (def.type) {
            case 'number':
            case 'duration': {
                if (t === '')
                    return '';
                const n = Number(t.replace(/[’']/g, '').replace(',', '.').replace(/[^\d.\-eE]/g, ''));
                return isFinite(n) ? n : '';
            }
            case 'checkbox':
                return /^(wahr|ja|x|1|true|✓)$/i.test(t);
            case 'multi':
                return t ? t.split(/[;,]/).map(s => s.trim()).filter(Boolean) : [];
            default:
                return t;
        }
    };
    /* ==========================================================================
     * ZEICHNEN
     * ========================================================================*/
    const zeichne = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'tbl tbl-db';
        if (typeof Datenbank === 'undefined' || !coll || !coll.schema) {
            w.textContent = 'Diese Datenbank lässt sich nicht als Raster zeigen.';
            return w;
        }
        const spalten = Object.keys(coll.schema)
            .filter(k => !((view && view.hidden) || []).includes(k));
        const zeilen = rows || [];
        const handy = amTelefon();
        const zh = handy ? ZH_HANDY : ZH;
        /* Die Breiten gehören zur ANSICHT und nicht zur Datenbank: zwei Ansichten
           auf dieselben Daten dürfen verschieden breit sein. */
        if (!view.breiten)
            view.breiten = {};
        const breiteVon = (k) => Math.max(handy ? 110 : SB_MIN, Number(view.breiten[k]) || (handy ? 170 : SB));
        let gewaehlt = { z: 0, s: 0 };
        let anker = { z: 0, s: 0 };
        /* Die Ansicht sichern. Hier standen zwei Wege — `Store.saveView(view)`
           und `Store.save('views', view)` —, und es gibt weder das eine noch das
           andere: die Ablage kennt nur `updateView`. Beide Zweige waren tot, also
           wurde beim Ändern einer Spaltenbreite nie etwas gespeichert; nach dem
           Neuladen standen die alten Breiten wieder da. */
        const sichere = () => {
            if (typeof Store !== 'undefined' && view && view.id)
                Store.updateView(view.id, view);
        };
        /* --- Kopf ------------------------------------------------------------ */
        const kopf = document.createElement('div');
        kopf.className = 'tbl-kopf';
        const adresse = document.createElement('div');
        adresse.className = 'tbl-adresse';
        const fx = document.createElement('div');
        fx.className = 'tbl-fx';
        fx.textContent = '≡';
        fx.title = 'Datenbankraster — hier wird der Wert getippt, keine Formel';
        const eingabe = document.createElement('input');
        eingabe.className = 'tbl-eingabe';
        eingabe.setAttribute('aria-label', 'Inhalt der ausgewählten Zelle');
        eingabe.placeholder = 'Wert';
        const werkzeuge = document.createElement('div');
        werkzeuge.className = 'tbl-werkzeuge';
        werkzeuge.innerHTML =
            '<button data-a="zeile" title="Zeile anhängen" aria-label="Zeile anhängen">+↓</button>' +
                '<button data-a="breiten" title="Spaltenbreiten zurücksetzen" aria-label="Spaltenbreiten zurücksetzen">↔</button>';
        kopf.append(adresse, fx, eingabe, werkzeuge);
        const feld = document.createElement('div');
        feld.className = 'tbl-feld';
        feld.tabIndex = 0;
        feld.setAttribute('role', 'grid');
        feld.setAttribute('aria-label', 'Raster ' + (coll.name || ''));
        /* Dieselbe weiche Kante wie im Tabellenblock — dasselbe Raster, derselbe
           Fund: am Telefon stand `14500` als `1450` da. */
        if (typeof Rollrand !== 'undefined')
            Rollrand.binde(feld);
        const spaltenKopf = document.createElement('div');
        spaltenKopf.className = 'tbl-spalten';
        const koerper = document.createElement('div');
        koerper.className = 'tbl-koerper';
        feld.append(spaltenKopf, koerper);
        const fuss = document.createElement('div');
        fuss.className = 'tbl-fuss';
        w.append(kopf, feld, fuss);
        const bereich = () => ({
            vonZ: Math.min(anker.z, gewaehlt.z), bisZ: Math.max(anker.z, gewaehlt.z),
            vonS: Math.min(anker.s, gewaehlt.s), bisS: Math.max(anker.s, gewaehlt.s)
        });
        const spaltenZeichnen = () => {
            const b = bereich();
            spaltenKopf.innerHTML = '';
            const ecke = document.createElement('div');
            ecke.className = 'tbl-ecke';
            spaltenKopf.appendChild(ecke);
            spalten.forEach((k, i) => {
                const def = coll.schema[k];
                const d = document.createElement('div');
                d.className = 'tbl-sp' + (i >= b.vonS && i <= b.bisS ? ' aktiv' : '') +
                    (schreibbar(def) ? '' : ' gerechnet');
                d.style.flex = '0 0 ' + breiteVon(k) + 'px';
                d.dataset.s = String(i);
                d.textContent = def.name || k;
                d.title = (def.name || k) + (schreibbar(def) ? '' : ' — wird gerechnet, nicht getippt');
                const griff = document.createElement('span');
                griff.className = 'tbl-griff';
                griff.dataset.griff = k;
                d.appendChild(griff);
                spaltenKopf.appendChild(d);
            });
        };
        const koerperZeichnen = () => {
            koerper.style.height = (zeilen.length * zh) + 'px';
            const oben = Math.max(0, Math.floor(feld.scrollTop / zh) - PUFFER);
            const sichtbar = Math.ceil(feld.clientHeight / zh) + PUFFER * 2;
            const unten = Math.min(zeilen.length, oben + sichtbar);
            const b = bereich();
            koerper.innerHTML = '';
            for (let z = oben; z < unten; z++) {
                const row = zeilen[z];
                const zeile = document.createElement('div');
                zeile.className = 'tbl-zeile';
                zeile.style.top = (z * zh) + 'px';
                const nr = document.createElement('div');
                nr.className = 'tbl-zn' + (z >= b.vonZ && z <= b.bisZ ? ' aktiv' : '');
                nr.dataset.z = String(z);
                nr.textContent = String(z + 1);
                zeile.appendChild(nr);
                spalten.forEach((k, s) => {
                    const def = coll.schema[k];
                    const text = alsText(row, k, coll);
                    const d = document.createElement('div');
                    const klassen = ['tbl-z'];
                    if (z === gewaehlt.z && s === gewaehlt.s)
                        klassen.push('gewaehlt');
                    else if (z >= b.vonZ && z <= b.bisZ && s >= b.vonS && s <= b.bisS)
                        klassen.push('imBereich');
                    if (z === b.bisZ && s === b.bisS)
                        klassen.push('ecke');
                    if (!schreibbar(def))
                        klassen.push('gerechnet');
                    if (def.type === 'number' || def.type === 'duration')
                        klassen.push('zahl');
                    d.className = klassen.join(' ');
                    d.style.flex = '0 0 ' + breiteVon(k) + 'px';
                    d.dataset.z = String(z);
                    d.dataset.s = String(s);
                    d.setAttribute('role', 'gridcell');
                    d.setAttribute('aria-label', (def.name || k) + ': ' + (text || 'leer'));
                    if (!schreibbar(def))
                        d.setAttribute('aria-readonly', 'true');
                    d.textContent = text;
                    zeile.appendChild(d);
                });
                koerper.appendChild(zeile);
            }
        };
        const fussZeichnen = () => {
            const b = bereich();
            let zahlen = 0, summe = 0;
            for (let z = b.vonZ; z <= b.bisZ; z++)
                for (let s = b.vonS; s <= b.bisS; s++) {
                    const k = spalten[s];
                    if (!k)
                        continue;
                    const v = Datenbank.wert(zeilen[z], String(k), coll);
                    if (typeof v === 'number' && isFinite(v)) {
                        zahlen++;
                        summe += v;
                    }
                }
            fuss.innerHTML = '';
            const teil = (t, klasse = '') => {
                const sp = document.createElement('span');
                if (klasse)
                    sp.className = klasse;
                sp.innerHTML = t;
                fuss.appendChild(sp);
            };
            teil('<b>' + esc(zeilen.length) + ' Zeilen</b>');
            teil(spalten.length + ' Spalten');
            if (zahlen > 1) {
                teil('Summe <b>' + esc(summe.toLocaleString('de-CH', { maximumFractionDigits: 4 })) + '</b>');
                teil('Anzahl <b>' + zahlen + '</b>');
            }
            const def = coll.schema[spalten[gewaehlt.s] || ''];
            if (def && !schreibbar(def))
                teil('<b>' + esc(def.name) + '</b> wird gerechnet — hier nicht änderbar', 'tbl-tipp');
            if (!zeilen.length)
                teil('Noch keine Zeile. <code>+↓</code> legt eine an — oder füge aus Excel ein.', 'tbl-tipp');
        };
        const kopfZeichnen = () => {
            const k = spalten[gewaehlt.s];
            const def = k ? coll.schema[k] : null;
            adresse.textContent = def ? String(def.name || k).slice(0, 14) : '—';
            if (document.activeElement !== eingabe)
                eingabe.value = zeilen[gewaehlt.z] ? alsText(zeilen[gewaehlt.z], String(k), coll) : '';
            eingabe.disabled = !schreibbar(def);
            eingabe.placeholder = schreibbar(def) ? 'Wert' : 'wird gerechnet';
        };
        const alles = () => {
            spaltenZeichnen();
            koerperZeichnen();
            fussZeichnen();
            kopfZeichnen();
        };
        /* ======================================================================
         * SCHREIBEN
         * ====================================================================*/
        const schreibe = (z, s, text) => {
            const row = zeilen[z];
            const k = spalten[s];
            if (!row || !k)
                return false;
            const def = coll.schema[k];
            if (!schreibbar(def))
                return false;
            if (def.type === 'title') {
                if (typeof Store !== 'undefined')
                    Store.updateBlock(row.id, { text: String(text) });
                row.text = String(text);
                return true;
            }
            const wert = ausText(text, def);
            if (typeof Store !== 'undefined')
                Store.setProp(row.id, k, wert);
            row.props = row.props || {};
            row.props[k] = wert;
            return true;
        };
        const waehle = (z, s, mitAnker = false) => {
            gewaehlt = {
                z: Math.max(0, Math.min(zeilen.length - 1, z)),
                s: Math.max(0, Math.min(spalten.length - 1, s))
            };
            if (!mitAnker)
                anker = { ...gewaehlt };
            alles();
            const oben = gewaehlt.z * zh, unten = oben + zh;
            if (oben < feld.scrollTop)
                feld.scrollTop = oben;
            else if (unten > feld.scrollTop + feld.clientHeight)
                feld.scrollTop = unten - feld.clientHeight;
        };
        const bearbeite = (start) => {
            const def = coll.schema[spalten[gewaehlt.s] || ''];
            if (!schreibbar(def)) {
                if (typeof UI !== 'undefined' && UI.toast)
                    UI.toast((def && def.name ? def.name : 'Diese Spalte') + ' wird gerechnet und lässt sich hier nicht ändern');
                return;
            }
            const d = koerper.querySelector('[data-z="' + gewaehlt.z + '"][data-s="' + gewaehlt.s + '"]');
            if (!d)
                return;
            const feldchen = document.createElement('input');
            feldchen.value = start !== undefined ? start
                : alsText(zeilen[gewaehlt.z], String(spalten[gewaehlt.s]), coll);
            feldchen.setAttribute('aria-label', 'Zelle bearbeiten');
            d.appendChild(feldchen);
            feldchen.focus();
            if (start === undefined)
                feldchen.select();
            let fertig = false;
            const schliesse = (nehmen, dann) => {
                if (fertig)
                    return;
                fertig = true;
                const t = feldchen.value;
                feldchen.remove();
                if (nehmen)
                    schreibe(gewaehlt.z, gewaehlt.s, t);
                alles();
                feld.focus();
                if (dann)
                    dann();
            };
            feldchen.addEventListener('keydown', (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                    e.preventDefault();
                    schliesse(true, () => waehle(gewaehlt.z + 1, gewaehlt.s));
                }
                else if (e.key === 'Tab') {
                    e.preventDefault();
                    schliesse(true, () => waehle(gewaehlt.z, gewaehlt.s + 1));
                }
                else if (e.key === 'Escape') {
                    e.preventDefault();
                    schliesse(false);
                }
            });
            feldchen.addEventListener('blur', () => schliesse(true));
        };
        /* ======================================================================
         * MAUS
         * ====================================================================*/
        const beimZiehen = (bewegen, fertig) => {
            const auf = (e) => bewegen(e);
            const ab = () => {
                document.removeEventListener('mousemove', auf);
                document.removeEventListener('mouseup', ab);
                fertig();
            };
            document.addEventListener('mousemove', auf);
            document.addEventListener('mouseup', ab);
        };
        koerper.addEventListener('mousedown', (e) => {
            const z = e.target.closest('.tbl-z');
            if (!z || z.dataset.z === undefined)
                return;
            /* Ohne preventDefault ging die Tastatur nach einem Zellklick ins
               LEERE: waehle() zeichnet neu, das Ereignisziel hängt damit ab, und
               die Browser-Standardaktion nach mousedown findet am abgehängten
               Ziel keinen fokussierbaren Vorfahren mehr — sie warf den Fokus auf
               BODY, NACHDEM feld.focus() unten schon gelaufen war. Pfeile,
               Kopieren, Enter: alles erst nach einem Tab. Gefunden beim Bau der
               Ausfüll-Kürzel (L20). */
            e.preventDefault();
            waehle(Number(z.dataset.z), Number(z.dataset.s), e.shiftKey);
            feld.focus();
            beimZiehen((ev) => {
                const el = document.elementFromPoint(ev.clientX, ev.clientY);
                const c = el && el.closest ? el.closest('.tbl-z') : null;
                if (c && c.dataset.z !== undefined)
                    waehle(Number(c.dataset.z), Number(c.dataset.s), true);
            }, () => { });
        });
        koerper.addEventListener('dblclick', (e) => {
            const z = e.target.closest('.tbl-z');
            if (z && z.dataset.z !== undefined) {
                waehle(Number(z.dataset.z), Number(z.dataset.s));
                bearbeite();
            }
        });
        koerper.addEventListener('click', (e) => {
            const nr = e.target.closest('.tbl-zn');
            if (!nr || nr.dataset.z === undefined)
                return;
            const z = Number(nr.dataset.z);
            anker = { z, s: 0 };
            gewaehlt = { z, s: spalten.length - 1 };
            alles();
            feld.focus();
        });
        spaltenKopf.addEventListener('mousedown', (e) => {
            const ziel = e.target;
            if (ziel.dataset && ziel.dataset.griff !== undefined) {
                e.preventDefault();
                const k = ziel.dataset.griff;
                const startX = e.clientX;
                const startB = breiteVon(k);
                beimZiehen((ev) => {
                    view.breiten[k] = Math.max(SB_MIN, Math.round(startB + (ev.clientX - startX)));
                    spaltenZeichnen();
                    koerperZeichnen();
                }, () => sichere());
                return;
            }
            const sp = ziel.closest('.tbl-sp');
            if (sp && sp.dataset.s !== undefined) {
                const s = Number(sp.dataset.s);
                anker = { z: 0, s };
                gewaehlt = { z: Math.max(0, zeilen.length - 1), s };
                alles();
                feld.focus();
            }
        });
        feld.addEventListener('scroll', () => koerperZeichnen());
        feld.addEventListener('focus', () => w.classList.add('imFokus'));
        feld.addEventListener('blur', () => w.classList.remove('imFokus'));
        /* ======================================================================
         * TASTATUR
         * ====================================================================*/
        feld.addEventListener('keydown', (e) => {
            const k = e.key;
            const mit = e.shiftKey;
            const strg = e.ctrlKey || e.metaKey;
            if (strg && (k === 'a' || k === 'A')) {
                e.preventDefault();
                anker = { z: 0, s: 0 };
                gewaehlt = { z: Math.max(0, zeilen.length - 1), s: spalten.length - 1 };
                return alles();
            }
            if (k === 'ArrowUp') {
                e.preventDefault();
                return waehle(gewaehlt.z - 1, gewaehlt.s, mit);
            }
            if (k === 'ArrowDown') {
                e.preventDefault();
                return waehle(gewaehlt.z + 1, gewaehlt.s, mit);
            }
            if (k === 'ArrowLeft') {
                e.preventDefault();
                return waehle(gewaehlt.z, gewaehlt.s - 1, mit);
            }
            if (k === 'ArrowRight') {
                e.preventDefault();
                return waehle(gewaehlt.z, gewaehlt.s + 1, mit);
            }
            if (k === 'PageDown') {
                e.preventDefault();
                return waehle(gewaehlt.z + 20, gewaehlt.s, mit);
            }
            if (k === 'PageUp') {
                e.preventDefault();
                return waehle(gewaehlt.z - 20, gewaehlt.s, mit);
            }
            if (k === 'Home') {
                e.preventDefault();
                return waehle(strg ? 0 : gewaehlt.z, 0, mit);
            }
            if (k === 'End') {
                e.preventDefault();
                return waehle(strg ? zeilen.length - 1 : gewaehlt.z, spalten.length - 1, mit);
            }
            if (k === 'Tab') {
                e.preventDefault();
                return waehle(gewaehlt.z, gewaehlt.s + (mit ? -1 : 1));
            }
            if (k === 'Enter') {
                e.preventDefault();
                return bearbeite();
            }
            if (k === 'F2') {
                e.preventDefault();
                return bearbeite();
            }
            if (k === 'Delete' || k === 'Backspace') {
                e.preventDefault();
                const b = bereich();
                let n = 0;
                for (let z = b.vonZ; z <= b.bisZ; z++)
                    for (let s = b.vonS; s <= b.bisS; s++)
                        if (schreibe(z, s, ''))
                            n++;
                alles();
                if (typeof UI !== 'undefined' && UI.toast && n > 1)
                    UI.toast(n + ' Zellen geleert');
                return;
            }
            /* Ausfüllen wie in Excel und Notion (L20): Strg+D nimmt die oberste
               Zeile der Auswahl für alle darunter — bei einer einzelnen den Wert
               DARÜBER. Strg+R dasselbe nach rechts. Nur hier im fokussierten
               Raster: global gehört Strg+R dem Browser und Strg+D dem
               Duplizieren (E62). stopPropagation, damit Strg+D nicht zugleich
               den ganzen Datenbank-Block dupliziert. */
            if (strg && (k === 'd' || k === 'D' || k === 'r' || k === 'R')) {
                e.preventDefault();
                e.stopPropagation();
                const runter = (k === 'd' || k === 'D');
                const b = bereich();
                let n = 0;
                if (runter) {
                    if (b.bisZ > b.vonZ) {
                        for (let s = b.vonS; s <= b.bisS; s++) {
                            const w = alsText(zeilen[b.vonZ], String(spalten[s]), coll);
                            for (let z = b.vonZ + 1; z <= b.bisZ; z++)
                                if (schreibe(z, s, w))
                                    n++;
                        }
                    }
                    else if (b.vonZ > 0) {
                        for (let s = b.vonS; s <= b.bisS; s++)
                            if (schreibe(b.vonZ, s, alsText(zeilen[b.vonZ - 1], String(spalten[s]), coll)))
                                n++;
                    }
                }
                else {
                    if (b.bisS > b.vonS) {
                        for (let z = b.vonZ; z <= b.bisZ; z++) {
                            const w = alsText(zeilen[z], String(spalten[b.vonS]), coll);
                            for (let s = b.vonS + 1; s <= b.bisS; s++)
                                if (schreibe(z, s, w))
                                    n++;
                        }
                    }
                    else if (b.vonS > 0) {
                        for (let z = b.vonZ; z <= b.bisZ; z++)
                            if (schreibe(z, b.vonS, alsText(zeilen[z], String(spalten[b.vonS - 1]), coll)))
                                n++;
                    }
                }
                alles();
                /* Auch das Nichts wird gesagt — ein Kürzel, das still nichts tut,
                   lässt einen an der eigenen Hand zweifeln. */
                if (typeof UI !== 'undefined' && UI.toast)
                    UI.toast(n
                        ? n + (n === 1 ? ' Zelle' : ' Zellen') + (runter ? ' nach unten' : ' nach rechts') + ' ausgefüllt'
                        : 'Nichts auszufüllen — ' + (runter ? 'darüber' : 'links davon') + ' ist keine Zelle');
                return;
            }
            if (k.length === 1 && !strg && !e.altKey) {
                e.preventDefault();
                return bearbeite(k);
            }
        });
        /* ======================================================================
         * KOPIEREN UND EINFÜGEN — der eigentliche Grund für diese Ansicht
         * --------------------------------------------------------------------
         * Tabulatortext ist das, was Excel in die Zwischenablage legt und was es
         * von dort auch wieder annimmt. Damit wandern Daten in BEIDE Richtungen,
         * ohne dass jemand eine Datei anfassen muss.
         * ====================================================================*/
        feld.addEventListener('copy', (e) => {
            if (!e.clipboardData)
                return;
            const b = bereich();
            const raus = [];
            for (let z = b.vonZ; z <= b.bisZ; z++) {
                const sp = [];
                for (let s = b.vonS; s <= b.bisS; s++)
                    sp.push(alsText(zeilen[z], String(spalten[s]), coll));
                raus.push(sp.join('\t'));
            }
            e.clipboardData.setData('text/plain', raus.join('\n'));
            e.preventDefault();
        });
        feld.addEventListener('paste', async (e) => {
            if (!e.clipboardData)
                return;
            const text = e.clipboardData.getData('text/plain');
            if (!text)
                return;
            e.preventDefault();
            const eingefuegt = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n')
                .map(z => z.split('\t'));
            const hochZ = eingefuegt.length;
            const hochS = eingefuegt.reduce((m, z) => Math.max(m, z.length), 0);
            /* NACHGEZÄHLT, was passieren wird — Einfügen ist hier eine
               Massenänderung, und dreissig Zeilen auf einmal sind viel, wenn es
               schiefgeht. */
            let neueZeilen = 0, ueberschrieben = 0, gesperrt = 0;
            for (let z = 0; z < hochZ; z++) {
                const zielZ = gewaehlt.z + z;
                if (zielZ >= zeilen.length) {
                    neueZeilen++;
                    continue;
                }
                for (let s = 0; s < eingefuegt[z].length; s++) {
                    const k = spalten[gewaehlt.s + s];
                    if (!k)
                        continue;
                    if (!schreibbar(coll.schema[k])) {
                        gesperrt++;
                        continue;
                    }
                    if (alsText(zeilen[zielZ], k, coll) !== '')
                        ueberschrieben++;
                }
            }
            const zielSpalte = coll.schema[String(spalten[gewaehlt.s] ?? '')] || {};
            const antwort = (hochZ * hochS > 4 && typeof Dialog !== 'undefined')
                ? await Dialog.wahl({
                    titel: 'Einfügen: ' + hochZ + ' Zeilen × ' + hochS + ' Spalten',
                    text: (neueZeilen ? neueZeilen + ' neue Zeilen werden angelegt\n' : '') +
                        ueberschrieben + ' gefüllte Zellen werden überschrieben' +
                        (gesperrt ? '\n' + gesperrt + ' Werte fallen weg — die Spalte wird gerechnet' : ''),
                    knoepfe: [
                        { id: 'ja', text: 'Einfügen',
                            hinweis: 'Ab ' + (zielSpalte.name || '') + ', Zeile ' + (gewaehlt.z + 1) },
                        { id: '', text: 'Abbrechen', hinweis: 'Es wird nichts verändert' }
                    ]
                })
                : 'ja';
            if (antwort !== 'ja')
                return;
            /* Fehlende Zeilen anlegen — sonst fällt der Rest der Zwischenablage
               lautlos weg, und genau das merkt niemand. */
            const titelKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'title') || '';
            while (zeilen.length < gewaehlt.z + hochZ) {
                const neu = Store.addRow ? Store.addRow(coll.id, {}) : null;
                if (!neu)
                    break;
                zeilen.push(neu);
            }
            let n = 0;
            eingefuegt.forEach((zeile, z) => zeile.forEach((wert, s) => {
                if (schreibe(gewaehlt.z + z, gewaehlt.s + s, wert))
                    n++;
            }));
            alles();
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast(n + ' Zellen eingefügt' + (neueZeilen ? ', ' + neueZeilen + ' Zeilen angelegt' : ''));
            void titelKey;
        });
        /* --- Bearbeitungszeile ------------------------------------------------ */
        eingabe.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                schreibe(gewaehlt.z, gewaehlt.s, eingabe.value);
                alles();
                feld.focus();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                kopfZeichnen();
                feld.focus();
            }
        });
        werkzeuge.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b || !b.dataset.a)
                return;
            if (b.dataset.a === 'zeile') {
                const neu = Store.addRow ? Store.addRow(coll.id, {}) : null;
                if (neu) {
                    zeilen.push(neu);
                    waehle(zeilen.length - 1, 0);
                }
                return;
            }
            if (b.dataset.a === 'breiten') {
                view.breiten = {};
                sichere();
                alles();
            }
        });
        alles();
        setTimeout(() => koerperZeichnen(), 0);
        return w;
    };
    return { zeichne, alsText, ausText, schreibbar, GERECHNET };
})();
window.DbRaster = DbRaster;
