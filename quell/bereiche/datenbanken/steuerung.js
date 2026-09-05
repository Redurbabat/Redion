"use strict";
/* ============================================================================
 * database.js — Datenbanken
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/steuerung.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/steuerung.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Eine Datenbank besteht aus drei Teilen, genau wie bei Notion:
 *
 *   block      type 'database'  – der sichtbare Container auf der Seite
 *   collection                  – das Schema: welche Spalten gibt es
 *   views                       – Layout, Filter, Sortierung, sichtbare Spalten
 *
 * Eine Zeile ist ein Block vom Typ 'page' mit parentTable 'collection'.
 * Dadurch kann jede Zeile eine eigene Seite mit eigenem Inhalt haben.
 * ==========================================================================*/
/* ----------------------------------------------------------------------------
 * SEIT A4: was diese Datei RECHNET, steht nebenan in dienst.js — die
 * Eigenschaftstypen, das Lesen eines Wertes, Filtern, Sortieren, Gruppieren
 * und die Berechnungen. Hier steht nur noch, was etwas ZEIGT.
 *
 * Die Namen werden hereingeholt statt umgeschrieben. Das ist dieselbe
 * Entscheidung wie bei `UI` → `Menue`/`Hinweis`/`Dialog` und bei
 * `App.zeichneBaum`: die siebentausend Zeilen darunter rufen `wert`,
 * `zelle`, `trifftZu` und die anderen an hunderten Stellen. Sie alle
 * umzuschreiben wäre viel Arbeit für keinen Gewinn und ein hohes Risiko —
 * jede übersehene Stelle wäre ein Fehler, den erst ein Mensch findet.
 * -------------------------------------------------------------------------- */
const Datenbank = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    /* Dasselbe für Eingaben: das Feld, in dem gerade getippt oder geklickt
       wurde. `(feldVon(e)?.value ?? '')` stand an zwei Dutzend Stellen ungeprüft da —
       bei einem Ereignis ohne Ziel warf jede davon. */
    const feldVon = (e) => e.target instanceof HTMLElement && 'value' in e.target
        ? e.target : null;
    /* Und für alles, was ein `HTMLElement` sein muss (classList, style, type). */
    const htmlVon = (e) => e.target instanceof HTMLElement ? e.target : null;
    /* Inhalt in einen Kasten schreiben — wenn es ihn gibt. Die Oberfläche wird
       aus Zeichenketten gebaut; fehlt ein Kasten, ist das kein Grund zu werfen,
       es gibt dann eben nichts zu füllen. Vorher stand an dreissig Stellen
       `o.querySelector<HTMLElement>('#x').innerHTML = …` ohne jede Prüfung. */
    const fuelle = (wo, sel, html) => {
        const el = wo && wo.querySelector(sel);
        if (el)
            el.innerHTML = html;
    };
    /* Einen Kasten zeigen oder verstecken — wenn es ihn gibt. Dieselbe
       Überlegung wie bei `fuelle`: ist der Kasten nicht da, gibt es auch
       nichts zu verstecken. `wie` ist die Anzeigeart im gezeigten Zustand;
       leer heisst „was das Stylesheet ohnehin vorsieht". */
    const zeige = (wo, sel, ob, wie = '') => {
        const el = wo && wo.querySelector(sel);
        if (el)
            el.style.display = ob ? wie : 'none';
    };
    const { esc, DIENST_TYPEN, FARBEN, KI_AUFTRAG, KI_TYPEN, MUSTER_VORLAGEN, NUR_LESEN, OPERATOREN, RECHNUNGEN, ROLLUP_ARTEN, TYPEN, begrenzen, dauerLesen, dauerText, formelUmgebung, fremdWert, gruppeTrifftZu, hatRegeln, propTyp, pruefeWert, pruefeZeile, rechne, regelAnzahl, rollupWert, seitenListe, trifftZu, wert, wertFrisch, zeilen, zeilenGesamt, zelle, zusammenfassen } = DatenbankDienst;
    /* ========================================================================
     * RENDERN
     * ======================================================================*/
    const render = (block) => {
        const coll = Store.getCollection(block.collectionId);
        const w = document.createElement('div');
        w.className = 'db';
        if (!coll) {
            w.innerHTML = '<div style="color:var(--text-faint)">Diese Datenbank wurde nicht gefunden.</div>';
            return w;
        }
        const viewId = block.aktiveView && coll.viewIds.includes(block.aktiveView)
            ? block.aktiveView : coll.viewIds[0];
        const view = Store.getView(viewId);
        const rows = zeilen(coll, view);
        /* --- Kopfzeile ------------------------------------------------------- */
        const kopf = document.createElement('div');
        kopf.className = 'db-head';
        const tabs = document.createElement('div');
        tabs.className = 'db-tabs';
        coll.viewIds.forEach((id) => {
            const v = Store.getView(id);
            if (!v)
                return;
            const b = document.createElement('button');
            b.className = 'db-tab' + (id === viewId ? ' on' : '');
            const ICO = { table: '▦', board: '▤', list: '☰', gallery: '▩', calendar: '📅',
                timeline: '▬', chart: '📊', form: '📝', feed: '📰', map: '🗺',
                dashboard: '🧮' };
            const ico = ICO[v.layout] || '▦';
            b.innerHTML = `<span>${ico}</span>${esc(v.name)}`;
            b.addEventListener('click', () => {
                if (id === viewId) {
                    ansichtMenue(b, coll, v, block);
                    return;
                }
                Store.updateBlock(block.id, { aktiveView: id });
                App.zeichneSeite();
            });
            tabs.appendChild(b);
        });
        const plus = document.createElement('button');
        plus.className = 'db-tab';
        plus.textContent = '+';
        plus.title = 'Neue Ansicht';
        plus.addEventListener('click', () => neueAnsicht(plus, coll, block));
        tabs.appendChild(plus);
        kopf.appendChild(tabs);
        /* --- Werkzeuge ------------------------------------------------------- */
        const tools = document.createElement('div');
        tools.className = 'db-tools';
        const anzahlFilter = regelAnzahl(view.filters);
        tools.innerHTML =
            `<button data-a="filter">⚟ Filter${anzahlFilter ? ' (' + anzahlFilter + ')' : ''}</button>` +
                `<button data-a="sort">↕ Sortieren${view.sorts?.length ? ' (' + view.sorts.length + ')' : ''}</button>` +
                `<button data-a="props">⚙ Eigenschaften</button>` +
                `<button data-a="auto" title="Automationen">⚡${(coll.automationen || []).length || ''}</button>` +
                `<button data-a="search">🔍</button>` +
                `<button data-a="menu">⋯</button>` +
                `<button class="new" data-a="new">Neu</button>` +
                `<button class="new pfeil" data-a="new-menu" title="Mit Vorlage anlegen">▾</button>`;
        kopf.appendChild(tools);
        w.appendChild(kopf);
        tools.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            if (a === 'new') {
                Store.addRow(coll.id, {});
                App.zeichneSeite();
            }
            if (a === 'new-menu')
                vorlagenMenue(b, coll, view);
            if (a === 'filter')
                filterMenue(b, coll, view, block);
            if (a === 'sort')
                sortMenue(b, coll, view, block);
            if (a === 'props')
                eigenschaftenMenue(b, coll, view, block);
            if (a === 'auto')
                automationenMenue(b, coll, view, block);
            if (a === 'search')
                suchFeld(w, coll, view, block);
            if (a === 'menu')
                dbMenue(b, coll, view, block);
        });
        /* --- Aktive Filter als Chips ---------------------------------------- */
        if (anzahlFilter) {
            const chips = document.createElement('div');
            chips.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px';
            view.filters.rules.forEach((r, i) => {
                const c = document.createElement('span');
                c.className = 'chip';
                if (r.rules !== undefined) {
                    c.innerHTML = `<b>Gruppe</b> ${r.operator === 'or' ? 'ODER' : 'UND'} · ` +
                        `${regelAnzahl(r)} Regeln <span class="x">✕</span>`;
                }
                else {
                    const name = coll.schema[r.key]?.name || '?';
                    c.innerHTML = `<b>${esc(name)}</b> ${esc(r.op)} ${esc(r.wert ?? '')} <span class="x">✕</span>`;
                }
                c.querySelector('.x')?.addEventListener('click', () => {
                    view.filters.rules.splice(i, 1);
                    Store.updateView(view.id, { filters: view.filters });
                    App.zeichneSeite();
                });
                chips.appendChild(c);
            });
            w.appendChild(chips);
        }
        /* --- Der eigentliche Inhalt ------------------------------------------ */
        const koerper = document.createElement('div');
        /* Vorberechnete Werte sind eine Abmachung, keine stille Beschleunigung:
           über der Tabelle steht, wann gerechnet wurde und was sich seither
           geändert hat. Ein Zwischenspeicher, den man nicht sieht, ist eine
           Falle — irgendwann steht eine Zahl da, die nicht mehr stimmt. */
        if (typeof Vorrat !== 'undefined') {
            const vl = Vorrat.leiste(coll);
            if (vl)
                koerper.appendChild(vl);
        }
        /* Tabelle, Liste und Galerie können gruppiert werden — mit eigener
           Berechnungszeile je Gruppe. Board bringt seine Gruppierung selbst mit. */
        if (view.groupBy && coll.schema[view.groupBy] &&
            ['table', 'list', 'gallery', undefined, ''].includes(view.layout)) {
            koerper.appendChild(alsGruppiert(coll, view, rows, block));
        }
        /* Das Raster kommt VOR der Gruppierung nicht in Frage und danach zuerst:
           es ist die einzige Ansicht, die von der Gruppierung nichts wissen will
           — ein Raster mit Zwischenüberschriften wäre keines mehr. */
        else if (view.layout === 'raster' && typeof DbRaster !== 'undefined')
            koerper.appendChild(DbRaster.zeichne(coll, view, rows));
        else if (view.layout === 'board')
            koerper.appendChild(alsBoard(coll, view, rows));
        else if (view.layout === 'list')
            koerper.appendChild(alsListe(coll, view, rows));
        else if (view.layout === 'gallery')
            koerper.appendChild(alsGalerie(coll, view, rows));
        else if (view.layout === 'calendar')
            koerper.appendChild(alsKalender(coll, view, rows));
        else if (view.layout === 'timeline')
            koerper.appendChild(alsZeitstrahl(coll, view, rows));
        else if (view.layout === 'chart')
            koerper.appendChild(alsDiagramm(coll, view, rows));
        else if (view.layout === 'form')
            koerper.appendChild(alsFormular(coll, view, block));
        else if (view.layout === 'feed')
            koerper.appendChild(alsFeed(coll, view, rows));
        else if (view.layout === 'map')
            koerper.appendChild(alsKarte(coll, view, rows));
        else if (view.layout === 'dashboard')
            koerper.appendChild(alsDashboard(coll, view, rows));
        else if (view.layout === 'pivot')
            koerper.appendChild(alsPivot(coll, view, rows));
        /* Am Telefon ist eine seitlich scrollende Tabelle unbrauchbar. Notion
           zeigt dort Karten. Wer die Tabelle will, schaltet sie im Menü an. */
        else if (UI.amTelefon() && view.handyTabelle !== true)
            koerper.appendChild(alsHandyKarten(coll, view, rows));
        else
            koerper.appendChild(alsTabelle(coll, view, rows, block));
        w.appendChild(koerper);
        /* ----------------------------------------------------------------------
         * WAS NICHT DASTEHT, MUSS DASTEHEN (L22, E180)
         * ----------------------------------------------------------------------
         * `begrenzen` zeigt 50 Zeilen und nimmt die übrigen weg. Gemessen an
         * 300 Zeilen: die Tabelle endet nach der fünfzigsten mit „+ Neu", und
         * NICHTS sagt, dass zweihundertfünfzig fehlen. Eine Tabelle, die einen
         * Teil zeigt und aussieht wie das Ganze, ist die gefährlichere Sorte
         * Unvollständigkeit — man merkt sie erst, wenn man etwas sucht, das
         * dasteht und nicht gefunden wird.
         *
         * HIER UND NICHT IN DER TABELLE: `begrenzen` gilt für jede Ansichtsart.
         * In den Tabellenfuss geschrieben, hätten Board, Galerie und Feed
         * weiter stumm abgeschnitten.
         *
         * Der Weg heraus steht daneben, nicht in einem Menü drei Ebenen tiefer:
         * die Ladegrenze gibt es zwar unter „Layout", aber wer nicht weiss,
         * dass abgeschnitten wird, sucht sie nicht.
         * -------------------------------------------------------------------- */
        const gesamt = zeilenGesamt(coll, view);
        if (gesamt > rows.length) {
            const fuss = document.createElement('div');
            fuss.className = 'db-grenze';
            fuss.innerHTML =
                `<span>${rows.length} von ${gesamt} Zeilen</span>` +
                    '<button data-a="mehr">Mehr laden</button>' +
                    '<button data-a="alle">Alle zeigen</button>';
            fuss.addEventListener('click', e => {
                const b = elVon(e)?.closest('button[data-a]');
                if (!b)
                    return;
                /* Die Grenze steht an der ANSICHT und bleibt damit stehen — wer
                   einmal alle sehen wollte, will es beim nächsten Öffnen wieder. */
                const jetzt = view.limit === 0 ? 0 : (view.limit || 50);
                Store.updateView(view.id, { limit: b.dataset.a === 'alle' ? 0 : jetzt + 50 });
                App.zeichneSeite();
            });
            w.appendChild(fuss);
        }
        return w;
    };
    /* ========================================================================
     * PIVOT — Kreuztabelle
     * ------------------------------------------------------------------------
     * Genau das, was Notion nicht hat und was in der Lückenliste an zweiter
     * Stelle steht: Zeilenfeld × Spaltenfeld × Wertefeld, mit Zwischensummen,
     * Gesamtsumme und Prozentwerten.
     *
     *   view.pivotZeile   – nach welcher Eigenschaft die Zeilen gruppiert werden
     *   view.pivotSpalte  – nach welcher die Spalten (leer = nur eine Spalte)
     *   view.pivotWert    – welche Eigenschaft zusammengerechnet wird
     *   view.pivotArt     – summe | schnitt | anzahl | eindeutig | min | max | median
     *   view.pivotProzent – aus | zeile | spalte | gesamt
     * ======================================================================*/
    const PIVOT_ARTEN = [
        ['summe', 'Summe'], ['schnitt', 'Durchschnitt'],
        ['anzahl', 'Anzahl'], ['eindeutig', 'Anzahl verschieden'],
        ['min', 'Minimum'], ['max', 'Maximum'],
        ['median', 'Median']
    ];
    const pivotRechne = (art, werte) => {
        const z = werte.map(Formula.zahl).filter((x) => isFinite(x));
        if (art === 'anzahl')
            return werte.length;
        if (art === 'eindeutig')
            return new Set(werte.map((x) => Formula.anzeige(x))).size;
        if (!z.length)
            return 0;
        if (art === 'summe')
            return z.reduce((a, b) => a + b, 0);
        if (art === 'schnitt')
            return z.reduce((a, b) => a + b, 0) / z.length;
        if (art === 'min')
            return Math.min(...z);
        if (art === 'max')
            return Math.max(...z);
        if (art === 'median') {
            const s = z.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2);
            return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
        }
        return 0;
    };
    const alsPivot = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'pivot-wrap';
        const keys = Object.keys(coll.schema);
        const zk = view.pivotZeile || keys.find(k => ['select', 'status', 'text', 'person', 'date'].includes(coll.schema[k].type)) || keys[0];
        const sk = view.pivotSpalte || '';
        const wk = view.pivotWert || keys.find(k => coll.schema[k].type === 'number') || '';
        const art = view.pivotArt || (wk ? 'summe' : 'anzahl');
        const proz = view.pivotProzent || 'aus';
        /* Der Kopf mit den vier Auswahlfeldern — wie eine Pivot-Tabelle in Excel */
        const feld = (id, wert, leerText) => `<select data-p="${id}"><option value="">${leerText}</option>` +
            keys.map(k => `<option value="${k}"${wert === k ? ' selected' : ''}>` +
                esc(coll.schema[k].name) + '</option>').join('') + '</select>';
        const kopf = document.createElement('div');
        kopf.className = 'pivot-kopf';
        kopf.innerHTML =
            '<label>Zeilen ' + feld('zeile', zk, '— wählen —') + '</label>' +
                '<label>Spalten ' + feld('spalte', sk, 'keine') + '</label>' +
                '<label>Werte ' + feld('wert', wk, 'nur zählen') + '</label>' +
                '<label>Rechnung <select data-p="art">' +
                PIVOT_ARTEN.map(([id, n]) => `<option value="${id}"${art === id ? ' selected' : ''}>${n}</option>`).join('') +
                '</select></label>' +
                '<label>Prozent <select data-p="prozent">' +
                [['aus', 'aus'], ['zeile', 'von der Zeile'], ['spalte', 'von der Spalte'], ['gesamt', 'vom Gesamt']]
                    .map(([id, n]) => `<option value="${id}"${proz === id ? ' selected' : ''}>${n}</option>`).join('') +
                '</select></label>' +
                '<button data-p="csv" title="Als CSV ausgeben">⭳ CSV</button>';
        w.appendChild(kopf);
        kopf.addEventListener('change', e => {
            const s = elVon(e)?.closest('[data-p]');
            if (!s)
                return;
            const FELDER = { zeile: 'pivotZeile', spalte: 'pivotSpalte',
                wert: 'pivotWert', art: 'pivotArt', prozent: 'pivotProzent' };
            const feldName = FELDER[s.dataset.p ?? ''];
            if (!feldName)
                return;
            Store.updateView(view.id, { [feldName]: s.value });
            App.zeichneSeite();
        });
        if (!zk) {
            w.innerHTML += '<div class="pivot-leer">Wähle oben, wonach die Zeilen gruppiert werden sollen.</div>';
            return w;
        }
        /* --- Gruppieren ------------------------------------------------------ */
        const schluessel = (r, k) => {
            if (!k)
                return '';
            const v = wert(r, k, coll);
            if (v === null || v === undefined || v === '' ||
                (Array.isArray(v) && !v.length))
                return '(leer)';
            if (coll.schema[k].type === 'date' && v) {
                const d = new Date(v);
                if (!isNaN(d.getTime()))
                    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            }
            return Formula.anzeige(v);
        };
        const zeilenNamen = [...new Set(rows.map((r) => schluessel(r, zk)))].sort((a, b) => a.localeCompare(b, 'de'));
        const spaltenNamen = sk
            ? [...new Set(rows.map((r) => schluessel(r, sk)))].sort((a, b) => a.localeCompare(b, 'de'))
            : ['Wert'];
        const zellen = {}; /* "zeile|spalte" -> Liste der Werte */
        rows.forEach((r) => {
            const z = schluessel(r, zk);
            const s = sk ? schluessel(r, sk) : 'Wert';
            const v = wk ? wert(r, wk, coll) : 1;
            (zellen[z + '\u0000' + s] = zellen[z + '\u0000' + s] || []).push(v);
        });
        const zelleWert = (z, s) => pivotRechne(art, zellen[z + '\u0000' + s] || []);
        const zeileSumme = (z) => pivotRechne(art, spaltenNamen.flatMap(s => zellen[z + '\u0000' + s] || []));
        const spalteSumme = (s) => pivotRechne(art, zeilenNamen.flatMap(z => zellen[z + '\u0000' + s] || []));
        const gesamt = pivotRechne(art, Object.values(zellen).flat());
        const zeig = (v, z, s) => {
            /* `Werkzeuge.zahlKurz` gibt es nicht — der Zweig war tot, es lief immer
               `rund`. Also gleich `rund`. */
            if (proz === 'aus')
                return rund(v);
            const bezug = proz === 'zeile' ? zeileSumme(z) : proz === 'spalte' ? spalteSumme(s) : gesamt;
            if (!bezug)
                return '0 %';
            return prozText(v, bezug);
        };
        const prozText = (v, bezug) => (Math.round(v / bezug * 1000) / 10).toString().replace('.', ',') + ' %';
        /* Die Ränder brauchen eine eigene Rechnung: längs zum Prozentbezug sind
           sie definitionsgemäss 100 %, quer dazu ist der Bezug die Gesamtsumme.
           Vorher lief auch der Rand durch `zeig(…, z, null)` — das suchte
           `spalteSumme(null)`, fand den Schlüssel nie, und in beiden Modi stand
           am ganzen Quer-Rand „0 %". */
        const randRechts = (z) => {
            const v = zeileSumme(z);
            if (proz === 'aus')
                return rund(v);
            if (proz === 'zeile')
                return v ? '100 %' : '0 %';
            return gesamt ? prozText(v, gesamt) : '0 %';
        };
        const randUnten = (s) => {
            const v = spalteSumme(s);
            if (proz === 'aus')
                return rund(v);
            if (proz === 'spalte')
                return v ? '100 %' : '0 %';
            return gesamt ? prozText(v, gesamt) : '0 %';
        };
        const rund = (v) => {
            const n = Math.round(v * 100) / 100;
            return String(n).replace('.', ',');
        };
        /* --- Zeichnen -------------------------------------------------------- */
        const t = document.createElement('table');
        t.className = 'pivot';
        const kopfZeile = ['<tr><th class="pv-ecke">' +
                esc(coll.schema[zk].name) + (sk ? ' ╲ ' + esc(coll.schema[sk].name) : '') + '</th>'];
        spaltenNamen.forEach(s => kopfZeile.push('<th>' + esc(s) + '</th>'));
        kopfZeile.push('<th class="pv-summe">Gesamt</th></tr>');
        const koerper = zeilenNamen.map(z => {
            const tds = spaltenNamen.map(s => {
                const v = zelleWert(z, s);
                const leer = !(zellen[z + '\u0000' + s] || []).length;
                return `<td${leer ? ' class="pv-null"' : ''}` +
                    (leer ? '' : ` data-z="${esc(z)}" data-s="${esc(s)}" class="pv-klick"`) +
                    `>${leer ? '' : esc(zeig(v, z, s))}</td>`;
            }).join('');
            return `<tr><th class="pv-zeile">${esc(z)}</th>${tds}` +
                `<td class="pv-summe">${esc(randRechts(z))}</td></tr>`;
        }).join('');
        const fuss = '<tr class="pv-fuss"><th>Gesamt</th>' +
            spaltenNamen.map(s => `<td>${esc(randUnten(s))}</td>`).join('') +
            `<td class="pv-summe">${esc(proz === 'aus' ? rund(gesamt) : (gesamt ? '100 %' : '0 %'))}</td></tr>`;
        t.innerHTML = '<thead>' + kopfZeile.join('') + '</thead><tbody>' + koerper + fuss + '</tbody>';
        w.appendChild(t);
        /* Hineinschauen: welche Zeilen stecken in dieser Zelle? */
        t.addEventListener('click', e => {
            const td = elVon(e)?.closest('td[data-z]');
            if (!td)
                return;
            const z = td.dataset.z, s2 = td.dataset.s;
            const drin = rows.filter((r) => schluessel(r, zk) === z && (!sk || schluessel(r, sk) === s2));
            drilldown(coll, view, z + (sk ? ' × ' + s2 : ''), drin, (PIVOT_ARTEN.find(x => x[0] === art) || [])[1] +
                (wk ? ' von „' + coll.schema[wk].name + '": ' : ': ') +
                Formula.anzeige(Math.round(zelleWert(z, s2) * 100) / 100));
        });
        const fussZeile = document.createElement('div');
        fussZeile.className = 'pivot-fuss';
        fussZeile.textContent = zeilenNamen.length + ' Zeilen × ' + spaltenNamen.length +
            ' Spalten aus ' + rows.length + ' Einträgen · ' +
            (PIVOT_ARTEN.find(x => x[0] === art) || [])[1] +
            (wk ? ' von „' + coll.schema[wk].name + '"' : '');
        w.appendChild(fussZeile);
        /* CSV — damit die Kreuztabelle in Excel weiterlebt */
        kopf.querySelector('[data-p="csv"]')?.addEventListener('click', () => {
            const zeilenCsv = [[coll.schema[zk].name, ...spaltenNamen, 'Gesamt']];
            zeilenNamen.forEach(z => zeilenCsv.push([z,
                ...spaltenNamen.map(s => zeig(zelleWert(z, s), z, s)), randRechts(z)]));
            zeilenCsv.push(['Gesamt', ...spaltenNamen.map(s => randUnten(s)),
                proz === 'aus' ? rund(gesamt) : (gesamt ? '100 %' : '0 %')]);
            const csv = zeilenCsv.map(r => r.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(';')).join('\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
            a.download = (coll.name || 'Pivot') + '.csv';
            a.click();
            UI.toast('Kreuztabelle als CSV gespeichert');
        });
        return w;
    };
    /* ------------------------------------------------------------------------
     * TABELLE AM TELEFON: KARTEN STATT SPALTEN
     * ------------------------------------------------------------------------
     * Auf 428 Pixeln passt keine Tabelle. Notion zeigt am Handy eine Liste,
     * in der jeder Eintrag als Karte steht: Titel gross, darunter die
     * sichtbaren Eigenschaften als Paare. Antippen öffnet die Zeile.
     * --------------------------------------------------------------------- */
    const alsHandyKarten = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'hk-liste';
        const titelKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'title');
        const sichtbar = Object.keys(coll.schema)
            .filter(k => k !== titelKey)
            .filter(k => !(view.hidden || []).includes(k))
            .filter(k => !coll.schema[k].eigen || (view.eigenZeigen || []).includes(k))
            .slice(0, 4);
        if (!rows.length) {
            w.innerHTML = '<div class="hk-leer">Noch keine Einträge. Unten auf „Neu" tippen.</div>';
            return w;
        }
        rows.forEach((r) => {
            const k = document.createElement('div');
            k.className = 'hk-karte';
            k.dataset.rid = r.id;
            const farbe = farbeFuerZeile(r, view, coll);
            if (farbe)
                k.classList.add('bg-' + farbe);
            if (r.archiviert)
                k.classList.add('hk-archiv');
            k.innerHTML =
                `<div class="hk-titel">${r.icon ? `<span>${esc(r.icon)}</span>` : ''}` +
                    `${esc(r.text || 'Ohne Titel')}</div>` +
                    (sichtbar.length
                        ? '<div class="hk-felder">' + sichtbar.map(key => {
                            const inhalt = zelle(r, key, coll);
                            if (!inhalt || /^<span style="color:var\(--text-faint\)">—<\/span>$/.test(inhalt))
                                return '';
                            return `<div class="hk-feld"><span class="hk-name">${esc(coll.schema[key].name)}</span>` +
                                `<span class="hk-wert">${inhalt}</span></div>`;
                        }).join('') + '</div>'
                        : '');
            w.appendChild(k);
        });
        w.addEventListener('click', (e) => {
            /* Kontrollkästchen direkt in der Karte schalten, sonst Zeile öffnen */
            const box = elVon(e)?.closest('input[type="checkbox"][data-k]');
            const karte = elVon(e)?.closest('.hk-karte');
            if (!karte)
                return;
            if (box && karte.dataset.rid && box.dataset.k) {
                Store.setProp(karte.dataset.rid, box.dataset.k, box.checked);
                return;
            }
            zeilePeek(Store.getBlock(karte.dataset.rid), coll);
        });
        return w;
    };
    /* --- Tabelle ------------------------------------------------------------ */
    /* ========================================================================
     * GRUPPIERTE ANSICHT
     * ------------------------------------------------------------------------
     * Notion gruppiert Tabellen, Listen und Galerien nach einer Eigenschaft.
     * Redion kann zusätzlich:
     *   · Datumsspalten in Zeitabschnitte legen (Tag, Woche, Monat, Quartal,
     *     Jahr) statt jeden einzelnen Tag zur eigenen Gruppe zu machen,
     *   · Zahlenspalten in Stufen zerlegen,
     *   · und zeigt in jeder Gruppenüberschrift die Summe der Gruppe.
     * ======================================================================*/
    const ZEIT_STUFEN = [['tag', 'Tag'], ['woche', 'Woche'], ['monat', 'Monat'],
        ['quartal', 'Quartal'], ['jahr', 'Jahr']];
    /** Der Gruppenschlüssel einer Zeile — bei Datum je nach Zeitstufe. */
    const gruppeVon = (r, gk, coll, view) => {
        const def = coll.schema[gk] || {};
        const v = wert(r, gk, coll);
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length))
            return ['(Leer)'];
        if (['date', 'created', 'edited'].includes(def.type)) {
            const d = new Date(v);
            if (isNaN(d.getTime()))
                return ['(Leer)'];
            const stufe = view.gruppeZeit || 'monat';
            if (stufe === 'tag')
                return [d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })];
            if (stufe === 'woche') {
                const mo = new Date(d);
                mo.setDate(mo.getDate() - ((mo.getDay() + 6) % 7));
                return ['KW ' + kalenderWoche(d) + ' · ' + mo.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })];
            }
            if (stufe === 'quartal')
                return ['Q' + (Math.floor(d.getMonth() / 3) + 1) + ' ' + d.getFullYear()];
            if (stufe === 'jahr')
                return [String(d.getFullYear())];
            return [d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })];
        }
        if (def.type === 'number') {
            const n = Number(v);
            if (isNaN(n))
                return ['(Leer)'];
            const st = Number(view.gruppeStufe) || 0;
            if (!st)
                return [Formula.anzeige(n)];
            const u = Math.floor(n / st) * st;
            return [Formula.anzeige(u) + ' – ' + Formula.anzeige(u + st)];
        }
        if (def.type === 'checkbox')
            return [v === true || v === 'true' ? 'Erledigt' : 'Offen'];
        if (Array.isArray(v))
            return v.map(x => String(x && x.name ? x.name : x));
        return [String(v)];
    };
    /** Alle Gruppen einer Ansicht, in der gewünschten Reihenfolge. */
    const gruppenListe = (coll, view, rows) => {
        const gk = view.groupBy;
        const def = coll.schema[gk] || {};
        const topf = new Map();
        rows.forEach((r) => gruppeVon(r, gk, coll, view).forEach(g => {
            if (!topf.has(g))
                topf.set(g, []);
            topf.get(g).push(r);
        }));
        let namen;
        if ((def.options || []).length && !['date', 'created', 'edited', 'number'].includes(def.type)) {
            namen = def.options.map((o) => o.name).filter((n) => view.leereGruppen !== false || topf.has(n));
            [...topf.keys()].forEach(k => { if (!namen.includes(k) && k !== '(Leer)')
                namen.push(k); });
        }
        else {
            namen = [...topf.keys()].filter((k) => k !== '(Leer)');
            if (['date', 'created', 'edited'].includes(def.type)) {
                /* Zeitgruppen nach dem frühesten Datum sortieren, nicht alphabetisch */
                const ersteZeit = (g) => Math.min(...topf.get(g).map((r) => {
                    const d = new Date(wert(r, gk, coll));
                    return isNaN(d.getTime()) ? Infinity : d.getTime();
                }));
                namen.sort((a, b) => ersteZeit(a) - ersteZeit(b));
            }
            else if (def.type === 'number') {
                namen.sort((a, b) => parseFloat(String(a).replace(/[^\d.,-]/g, '').replace(',', '.')) -
                    parseFloat(String(b).replace(/[^\d.,-]/g, '').replace(',', '.')));
            }
            else
                namen.sort((a, b) => String(a).localeCompare(String(b), 'de'));
        }
        const art = view.gruppeSort || 'manuell';
        if (art === 'alphabetisch')
            namen.sort((a, b) => a.localeCompare(b, 'de'));
        if (art === 'alphabetisch-ab')
            namen.sort((a, b) => b.localeCompare(a, 'de'));
        if (art === 'anzahl')
            namen.sort((a, b) => (topf.get(b) || []).length - (topf.get(a) || []).length);
        if (art === 'anzahl-auf')
            namen.sort((a, b) => (topf.get(a) || []).length - (topf.get(b) || []).length);
        if (topf.has('(Leer)'))
            namen.push('(Leer)');
        return namen.map((n) => ({
            name: n, rows: topf.get(n) || [],
            farbe: ((def.options || []).find((o) => o.name === n) || {}).color || null
        }));
    };
    const alsGruppiert = (coll, view, rows, block) => {
        const w = document.createElement('div');
        w.className = 'tgruppen';
        const gk = view.groupBy;
        const gruppen = gruppenListe(coll, view, rows);
        const zu = view.zuGruppen || [];
        /* Die Berechnung, die in der Überschrift stehen soll: die erste
           eingestellte Spaltenberechnung — so wie Notion es zeigt. */
        const calcKey = Object.keys(view.calc || {}).find(k => (view.calc || {})[k] &&
            (view.calc || {})[k] !== '—');
        gruppen.forEach((g) => {
            if (!g.rows.length && view.leereGruppen === false)
                return;
            const kasten = document.createElement('div');
            kasten.className = 'tg';
            const offen = !zu.includes(g.name);
            const kopf = document.createElement('div');
            kopf.className = 'tg-kopf';
            kopf.innerHTML = `<span class="tg-pfeil">${offen ? '▾' : '▸'}</span>` +
                `<span class="tag bg-${g.farbe || 'gray'}">${esc(g.name)}</span>` +
                `<em>${g.rows.length}</em>` +
                (calcKey
                    ? `<span class="tg-summe">${esc(coll.schema[calcKey].name)}: ` +
                        `${esc(rechne(view.calc[calcKey], g.rows, calcKey, coll))}</span>` : '') +
                '<button class="tg-neu" title="Eintrag in dieser Gruppe">+</button>';
            kopf.addEventListener('click', e => {
                if (elVon(e)?.closest('.tg-neu')) {
                    const vor = {};
                    const def = coll.schema[gk];
                    if (g.name !== '(Leer)' && ['select', 'status', 'text'].includes(def.type))
                        vor[gk] = g.name;
                    if (def.type === 'checkbox')
                        vor[gk] = g.name === 'Erledigt';
                    Store.addRow(coll.id, vor);
                    App.zeichneSeite();
                    return;
                }
                const liste = [...(view.zuGruppen || [])];
                const i = liste.indexOf(g.name);
                if (i >= 0)
                    liste.splice(i, 1);
                else
                    liste.push(g.name);
                Store.updateView(view.id, { zuGruppen: liste });
                App.zeichneSeite();
            });
            kasten.appendChild(kopf);
            if (offen) {
                const inhalt = view.layout === 'list' ? alsListe(coll, view, g.rows) :
                    view.layout === 'gallery' ? alsGalerie(coll, view, g.rows) :
                        (UI.amTelefon() && view.handyTabelle !== true)
                            ? alsHandyKarten(coll, view, g.rows)
                            : alsTabelle(coll, view, g.rows, block);
                inhalt.classList.add('tg-inhalt');
                kasten.appendChild(inhalt);
            }
            w.appendChild(kasten);
        });
        if (!gruppen.length)
            w.innerHTML = '<div class="db-leer">Noch keine Einträge.</div>';
        return w;
    };
    const alsTabelle = (coll, view, rows, block) => {
        /* Die Spalten, die Notion beim Einschalten von Unter-Elementen und
           Abhängigkeiten selbst anlegt, bleiben aus der Tabelle heraus — sie
           stehen auf der Zeilenseite und im Menü. */
        const sichtbar = Object.keys(coll.schema)
            .filter(k => !(view.hidden || []).includes(k))
            .filter(k => !coll.schema[k].eigen || (view.eigenZeigen || []).includes(k));
        const t = document.createElement('table');
        t.className = 'grid h-' + (view.hoehe || 'normal');
        /* Kopf */
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        /* Ganz links: Auswahlkästchen für alle Zeilen */
        const thAus = document.createElement('th');
        thAus.className = 'th-aus';
        thAus.innerHTML = '<input type="checkbox" title="Alle auswählen">';
        thAus.querySelector('input')?.addEventListener('change', (e) => {
            const an = (feldVon(e)?.checked ?? false);
            t.querySelectorAll('tbody input.zeilen-aus').forEach(cb => { cb.checked = an; });
            auswahlAuffrischen();
        });
        tr.appendChild(thAus);
        sichtbar.forEach(k => {
            const def = coll.schema[k];
            const th = document.createElement('th');
            th.innerHTML = `<span style="opacity:${def.icon ? 1 : .7}">${def.icon || propTyp(def.type).icon}</span> ${esc(def.name)}` +
                (def.beschreibung ? `<span class="th-info" title="${esc(def.beschreibung)}">ℹ</span>` : '') +
                '<span class="th-griff" title="Breite ziehen"></span>';
            const breite = (view.breiten || {})[k];
            if (breite) {
                th.style.width = breite + 'px';
                th.style.minWidth = breite + 'px';
            }
            if ((view.fixiert || []).includes(k))
                th.classList.add('fixiert');
            /* Spalten mit der Maus umsortieren */
            th.draggable = true;
            th.addEventListener('dragstart', e => e.dataTransfer?.setData('text/spalte', k));
            th.addEventListener('dragover', e => { e.preventDefault(); th.classList.add('ziel'); });
            th.addEventListener('dragleave', () => th.classList.remove('ziel'));
            th.addEventListener('drop', e => {
                e.preventDefault();
                th.classList.remove('ziel');
                const q = (e.dataTransfer?.getData('text/spalte') ?? '');
                if (!q || q === k)
                    return;
                spalteEinordnen(coll, q, k);
            });
            th.addEventListener('click', (e) => {
                if ((htmlVon(e)?.classList ?? new DOMTokenList()).contains('th-griff'))
                    return;
                spaltenMenue(th, coll, view, k, block);
            });
            /* Breite mit der Maus ziehen — wie in Notion */
            th.querySelector('.th-griff')?.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                /* Solange gezogen wird, darf der Browser die Spalte nicht als
                   Drag-and-drop behandeln — sonst kommen keine Bewegungen mehr an. */
                th.draggable = false;
                const start = e.clientX;
                const b0 = th.getBoundingClientRect().width;
                const zug = (ev) => {
                    const b = Math.max(70, Math.min(640, b0 + ev.clientX - start));
                    th.style.width = b + 'px';
                    th.style.minWidth = b + 'px';
                };
                const stop = () => {
                    removeEventListener('pointermove', zug);
                    removeEventListener('pointerup', stop);
                    const b = Math.round(th.getBoundingClientRect().width);
                    Store.updateView(view.id, { breiten: Object.assign({}, view.breiten, { [k]: b }) });
                    setTimeout(() => { th.draggable = true; }, 0);
                };
                addEventListener('pointermove', zug);
                addEventListener('pointerup', stop);
            });
            tr.appendChild(th);
        });
        const plus = document.createElement('th');
        plus.textContent = '+';
        plus.style.width = '40px';
        plus.title = 'Eigenschaft hinzufügen';
        plus.addEventListener('click', () => neueEigenschaft(plus, coll, block));
        tr.appendChild(plus);
        thead.appendChild(tr);
        t.appendChild(thead);
        /* Zeilen — Unterelemente hängen unter ihrer Hauptzeile (Notions Sub-items).
           Beliebig tief; jede Elternzeile bekommt einen Schalter zum Auf- und
           Zuklappen, genau wie in Notion. */
        const tbody = document.createElement('tbody');
        const sichtbareIds = new Set(rows.map((r) => r.id));
        const geordnet = [];
        const kinderVon = (id) => rows.filter((k) => k.unterVon === id);
        const einhaengen = (r, tiefe) => {
            const kinder = kinderVon(r.id);
            geordnet.push({ row: r, tiefe, kinder: kinder.length });
            if (kinder.length && !(view.zu || []).includes(r.id))
                kinder.forEach((k) => einhaengen(k, tiefe + 1));
        };
        rows.forEach((r) => {
            if (r.unterVon && sichtbareIds.has(r.unterVon))
                return;
            einhaengen(r, 0);
        });
        geordnet.forEach(({ row: r, tiefe, kinder }, nr) => {
            const zr = document.createElement('tr');
            if (tiefe)
                zr.classList.add('unterzeile');
            if (r.archiviert)
                zr.classList.add('archivzeile');
            /* Bedingte Farbe: die erste zutreffende Regel färbt die Zeile */
            const farbe = farbeFuerZeile(r, view, coll);
            if (farbe)
                zr.classList.add('farbzeile', 'bg-' + farbe);
            zr.dataset.rid = r.id;
            zr.draggable = true;
            /* Auswahl und Nummer */
            const tdAus = document.createElement('td');
            tdAus.className = 'td-aus';
            tdAus.innerHTML = `<span class="zeilen-nr">${nr + 1}</span>` +
                `<input type="checkbox" class="zeilen-aus" data-rid="${r.id}">`;
            tdAus.querySelector('input')?.addEventListener('change', auswahlAuffrischen);
            zr.appendChild(tdAus);
            /* Zeilen mit der Maus sortieren */
            zr.addEventListener('dragstart', e => {
                e.dataTransfer?.setData('text/zeile', r.id);
                zr.classList.add('zieht');
            });
            zr.addEventListener('dragend', () => zr.classList.remove('zieht'));
            zr.addEventListener('dragover', e => { e.preventDefault(); zr.classList.add('ziel'); });
            zr.addEventListener('dragleave', () => zr.classList.remove('ziel'));
            zr.addEventListener('drop', e => {
                e.preventDefault();
                zr.classList.remove('ziel');
                const quelle = (e.dataTransfer?.getData('text/zeile') ?? '');
                if (!quelle || quelle === r.id)
                    return;
                zeileEinordnen(coll, quelle, r.id);
            });
            zr.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                zeilenMenue({ x: e.clientX, y: e.clientY }, r, coll);
            });
            sichtbar.forEach(k => {
                const def = coll.schema[k];
                const td = document.createElement('td');
                if (def.type === 'title') {
                    td.className = 'tt';
                    const zuJetzt = (view.zu || []).includes(r.id);
                    td.innerHTML =
                        (tiefe ? `<span class="tt-ein" style="padding-left:${(tiefe - 1) * 16}px">↳</span>` : '') +
                            (kinder
                                ? `<button class="tt-klapp" title="${zuJetzt ? 'Aufklappen' : 'Zuklappen'}">${zuJetzt ? '▸' : '▾'}</button>`
                                : (coll.unterElemente ? '<span class="tt-klapp leer"></span>' : '')) +
                            (r.archiviert ? '<span class="tt-archiv" title="Archiviert">🗄</span>' : '') +
                            (() => {
                                const b2 = blockiertDurch(r, coll);
                                return b2.length
                                    ? `<span class="tt-blockiert" title="Wartet auf: ${esc(b2.map((x) => x.text).join(', '))}">⏳</span>`
                                    : '';
                            })() +
                            `<span class="tt-t">${esc(r.text || 'Ohne Titel')}</span>` +
                            (kinder ? `<span class="tt-anzahl">${kinder}</span>` : '') +
                            `<button class="tt-auf" title="In der Vorschau öffnen">⤢ Öffnen</button>`;
                    td.querySelector('.tt-klapp:not(.leer)')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const zu = view.zu || [];
                        Store.updateView(view.id, { zu: zu.includes(r.id) ? zu.filter((x) => x !== r.id) : [...zu, r.id] });
                        App.zeichneSeite();
                    });
                    td.querySelector('.tt-t')?.addEventListener('click', () => zeilePeek(r, coll));
                    td.querySelector('.tt-auf')?.addEventListener('click', (e) => { e.stopPropagation(); App.oeffne(r.id); });
                    /* Auch die Titelspalte gehört zur Tastaturnavigation. Bisher fing
                       die Reise erst bei der zweiten Spalte an — man kam mit dem Pfeil
                       nach links nie bis zum Namen der Zeile. */
                    td.tabIndex = 0;
                    td.dataset.zelle = r.id + '|title';
                }
                else {
                    td.innerHTML = zelle(r, k, coll);
                    td.tabIndex = 0;
                    td.dataset.zelle = r.id + '|' + k;
                    if ((view.umbruch || []).includes(k))
                        td.classList.add('umbruch');
                    td.addEventListener('click', (e) => {
                        if ((feldVon(e)?.type ?? '') === 'checkbox') {
                            Store.setProp(r.id, k, (feldVon(e)?.checked ?? false));
                            return;
                        }
                        /* Sterne direkt in der Zelle setzen — nochmal auf denselben
                           Stern tippt die Bewertung wieder weg. */
                        const stern = elVon(e)?.closest('.sterne i[data-n]');
                        if (stern) {
                            const n = Number(stern.dataset.n);
                            const jetzt = Formula.zahl(wert(r, k, coll));
                            Store.setProp(r.id, k, jetzt === n ? 0 : n);
                            App.zeichneSeite();
                            return;
                        }
                        if ((htmlVon(e)?.classList ?? new DOMTokenList()).contains('zellen-knopf')) {
                            knopfInZelle(r, k, coll);
                            return;
                        }
                        const rel = elVon(e)?.closest('[data-rel]');
                        if (rel) {
                            const z = Store.getBlock(rel.dataset.rel);
                            if (z) {
                                zeilePeek(z, zielColl(coll, k) || coll);
                                return;
                            }
                        }
                        zelleBearbeiten(td, r, k, coll);
                    });
                }
                zr.appendChild(td);
            });
            zr.appendChild(document.createElement('td'));
            tbody.appendChild(zr);
        });
        /* Zeile hinzufügen */
        const neu = document.createElement('tr');
        const ntd = document.createElement('td');
        ntd.colSpan = sichtbar.length + 2;
        ntd.style.cssText = 'color:var(--text-faint); cursor:pointer';
        ntd.textContent = '+ Neu';
        ntd.addEventListener('click', () => { Store.addRow(coll.id, {}); App.zeichneSeite(); });
        neu.appendChild(ntd);
        tbody.appendChild(neu);
        t.appendChild(tbody);
        /* Berechnungen */
        const tfoot = document.createElement('tfoot');
        const ftr = document.createElement('tr');
        ftr.appendChild(document.createElement('td'));
        sichtbar.forEach(k => {
            const td = document.createElement('td');
            const art = (view.calc || {})[k];
            td.style.cursor = 'pointer';
            td.textContent = art && art !== '—' ? art + ': ' + rechne(art, rows, k, coll) : 'Berechnen';
            if (!art || art === '—')
                td.style.opacity = '0';
            td.addEventListener('mouseenter', () => td.style.opacity = '1');
            td.addEventListener('mouseleave', () => { if (!art || art === '—')
                td.style.opacity = '0'; });
            td.addEventListener('click', () => rechnenMenue(td, coll, view, k, rows));
            ftr.appendChild(td);
        });
        ftr.appendChild(document.createElement('td'));
        tfoot.appendChild(ftr);
        t.appendChild(tfoot);
        /* Lange Tabellen fensterweise zeichnen — erst wenn die Tabelle im
           Dokument steht, sonst gibt es noch keine Masse. */
        if (typeof Tempo !== 'undefined')
            setTimeout(() => Tempo.fensterweise(t), 0);
        /* Mit Pfeilen von Zelle zu Zelle, Enter bearbeitet, Tab geht weiter —
           so, wie man es aus Tabellen kennt. */
        t.addEventListener('keydown', (e) => {
            const td = elVon(e)?.closest('td[data-zelle]');
            if (!td)
                return;
            const zeilenListe = [...t.querySelectorAll('tbody tr')];
            const zr2 = td.parentElement;
            if (!zr2)
                return;
            const spalten = [...zr2.querySelectorAll('td[data-zelle]')];
            const y = zeilenListe.indexOf(zr2);
            const x = spalten.indexOf(td);
            const springe = (dy, dx) => {
                const zeile2 = zeilenListe[y + dy];
                if (!zeile2)
                    return;
                const felder = [...zeile2.querySelectorAll('td[data-zelle]')];
                const ziel = felder[Math.max(0, Math.min(felder.length - 1, x + dx))];
                if (ziel) {
                    ziel.focus();
                    e.preventDefault();
                }
            };
            if (e.key === 'ArrowRight')
                springe(0, 1);
            if (e.key === 'ArrowLeft')
                springe(0, -1);
            if (e.key === 'ArrowDown')
                springe(1, 0);
            if (e.key === 'ArrowUp')
                springe(-1, 0);
            if (e.key === 'Tab') {
                e.preventDefault();
                springe(0, e.shiftKey ? -1 : 1);
            }
            /* Pos1 und Ende springen an den Rand der Zeile, mit Strg an den Rand
               der Tabelle — dasselbe, was man aus jeder Tabellenkalkulation kennt. */
            if (e.key === 'Home') {
                e.preventDefault();
                if (e.ctrlKey || e.metaKey) {
                    const erste = zeilenListe[0]?.querySelectorAll('td[data-zelle]')[0];
                    if (erste)
                        erste.focus();
                }
                else
                    spalten[0]?.focus();
            }
            if (e.key === 'End') {
                e.preventDefault();
                if (e.ctrlKey || e.metaKey) {
                    const letzteZeile = zeilenListe[zeilenListe.length - 1];
                    const felder = letzteZeile ? [...letzteZeile.querySelectorAll('td[data-zelle]')] : [];
                    felder[felder.length - 1]?.focus();
                }
                else
                    spalten[spalten.length - 1]?.focus();
            }
            /* --- Die Zeile als Seite ------------------------------------------
             * In Notion öffnet die Leertaste die Zeile in der Vorschau und
             * Strg+Enter als ganze Seite. Bisher musste man dafür zur Maus
             * greifen und den kleinen Öffnen-Knopf treffen.
             * ------------------------------------------------------------------ */
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                const rid = (td.dataset.zelle ?? '').split('|')[0];
                const zeile4 = Store.getBlock(rid);
                if (zeile4)
                    zeilePeek(zeile4, coll);
                return;
            }
            /* Erst die engere Bedingung prüfen — sonst fängt Strg+Enter das
               Strg+Umschalt+Enter mit ab und die geteilte Ansicht bliebe tot. */
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                if (typeof Fenster !== 'undefined')
                    Fenster.teilen((td.dataset.zelle ?? '').split('|')[0], 'quer');
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                App.oeffne((td.dataset.zelle ?? '').split('|')[0]);
                return;
            }
            /* Umschalt+Enter legt eine Zeile darunter an */
            if (e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                const neu = Store.addRow(coll.id, {});
                App.zeichneSeite();
                setTimeout(() => {
                    const z = document.querySelector(`td[data-zelle^="${neu.id}|"]`);
                    if (z)
                        z.focus();
                }, 60);
                return;
            }
            if (e.key === 'Enter' || e.key === 'F2') {
                e.preventDefault();
                const [rid, key] = (td.dataset.zelle ?? '').split('|');
                if (!rid || !key)
                    return;
                const zeile3 = Store.getBlock(rid);
                if (!zeile3)
                    return;
                /* Die Titelspalte ist keine gewöhnliche Zelle: dort steht der Name
                   der Zeile samt Klappknopf. Enter öffnet sie deshalb. */
                if (key === 'title')
                    zeilePeek(zeile3, coll);
                else
                    zelleBearbeiten(td, zeile3, key, coll);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const [rid, key] = (td.dataset.zelle ?? '').split('|');
                if (!rid || !key)
                    return;
                if (key === 'title')
                    return; /* der Name geht so nicht weg */
                e.preventDefault();
                if (!['formula', 'created', 'edited', 'rollup', 'uid'].includes(coll.schema[key]?.type)) {
                    Store.setProp(rid, key, '');
                    App.zeichneSeite();
                }
            }
            /* --- Strg+D und Strg+R: ausfüllen ---------------------------------
             * Notions einzige Datenbank-Tastenkürzel, die uns noch fehlten.
             * Strg+D nimmt den Wert dieser Zelle und schreibt ihn in dieselbe
             * Spalte aller Zeilen darunter — oder, wenn Zeilen ausgewählt sind,
             * genau in diese. Strg+R holt den Wert aus der Spalte links.
             * ---------------------------------------------------------------- */
            if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D' ||
                e.key === 'r' || e.key === 'R')) {
                e.preventDefault();
                const [rid, key] = (td.dataset.zelle ?? '').split('|');
                /* „title" steht nicht in props, sondern als Text am Block — beim
                   Ausfüllen wird sie deshalb übersprungen statt still verfälscht. */
                const gesperrt = (k) => k === 'title' ||
                    ['formula', 'created', 'edited', 'rollup', 'uid', 'createdBy', 'editedBy']
                        .includes(coll.schema[k]?.type);
                if (e.key.toLowerCase() === 'r') {
                    const links = spalten[x - 1];
                    if (!links) {
                        UI.toast('Links steht keine Spalte');
                        return;
                    }
                    const linkerKey = (links.dataset.zelle ?? '').split('|')[1] ?? '';
                    if (gesperrt(key)) {
                        UI.toast('Diese Spalte rechnet selbst');
                        return;
                    }
                    Store.setProp(rid, key, ((Store.getBlock(rid) || {}).props || {})[linkerKey] ?? '');
                    App.zeichneSeite();
                    UI.toast('Von links übernommen');
                    return;
                }
                if (gesperrt(key)) {
                    UI.toast('Diese Spalte rechnet selbst');
                    return;
                }
                const quelle = ((Store.getBlock(rid) || {}).props || {})[key ?? ''] ?? '';
                const gewaehlt = gewaehlteZeilen();
                const ziele = gewaehlt.length
                    ? gewaehlt.filter((id) => id !== rid)
                    : zeilenListe.slice(y + 1).map(tr => tr.dataset.rid).filter((x) => !!x);
                if (!ziele.length) {
                    UI.toast('Darunter steht keine Zeile');
                    return;
                }
                let gesetzt = 0;
                ziele.forEach((id) => {
                    const vor = JSON.stringify(((Store.getBlock(id) || {}).props || {})[key ?? '']);
                    Store.setProp(id, key, quelle);
                    if (JSON.stringify(((Store.getBlock(id) || {}).props || {})[key ?? '']) !== vor)
                        gesetzt++;
                });
                App.zeichneSeite();
                UI.toast(gesetzt + ' Zellen ausgefüllt' +
                    (gesetzt < ziele.length ? ' — ' + (ziele.length - gesetzt) + ' von einer Regel abgelehnt' : ''));
            }
        });
        const box = document.createElement('div');
        box.className = 'db-rollbox';
        box.style.overflowX = 'auto';
        box.appendChild(t);
        /* Die weiche Kante, wo die Tabelle über den Rand hinausgeht. Am Telefon
           ist das der Regelfall, sobald jemand im Ansichtsmenü „Tabelle statt
           Karten" wählt: 703 px Inhalt in 334 px Kasten. Ohne sie steht dort
           eine Zahl mit scharfer Kante — und `14500` liest sich als `1450`.
           Siehe `kern/helfer/rollrand.ts` und ENTSCHEIDUNGEN.md E63. */
        if (typeof Rollrand !== 'undefined')
            Rollrand.binde(box);
        return box;
    };
    /** Welche Zeilen sind gerade angehakt? */
    const gewaehlteZeilen = () => [...document.querySelectorAll('input.zeilen-aus:checked')].map(cb => cb.dataset.rid);
    /** Zeigt die Leiste mit den Sammelaktionen, sobald etwas angehakt ist. */
    const auswahlAuffrischen = () => {
        const ids = gewaehlteZeilen();
        document.getElementById('sammelleiste')?.remove();
        if (!ids.length)
            return;
        const erste = Store.getBlock(ids[0]);
        const coll = erste && Store.getCollection(erste.parentId);
        const l = document.createElement('div');
        l.id = 'sammelleiste';
        l.innerHTML =
            `<span><b>${ids.length}</b> ausgewählt</span>` +
                '<button data-a="dup">Duplizieren</button>' +
                '<button data-a="prop">Eigenschaft setzen</button>' +
                '<button data-a="del">Löschen</button>' +
                '<button data-a="weg">✕</button>';
        document.body.appendChild(l);
        l.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            if (a === 'weg') {
                document.querySelectorAll('input.zeilen-aus').forEach(cb => { cb.checked = false; });
                l.remove();
                return;
            }
            if (a === 'del') {
                if (!confirm(ids.length + ' Einträge löschen?'))
                    return;
                ids.forEach((id) => Store.trashBlock(id));
                l.remove();
                App.zeichneSeite();
                UI.toast(ids.length + ' Einträge gelöscht');
            }
            if (a === 'dup') {
                ids.forEach(id => {
                    const r = Store.getBlock(id);
                    if (!r || !coll)
                        return;
                    const k = Store.addRow(coll.id, JSON.parse(JSON.stringify(r.props || {})));
                    Store.updateBlock(k.id, { text: (r.text || '') + ' (Kopie)' });
                });
                l.remove();
                App.zeichneSeite();
            }
            if (a === 'prop' && coll) {
                const r = b.getBoundingClientRect();
                const m = UI.menu('<div class="grp">Welche Eigenschaft?</div>' +
                    Object.keys(coll.schema).filter(k => coll.schema[k].type !== 'title')
                        .map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join(''), r.left, r.top - 30);
                m.addEventListener('click', async (ev) => {
                    const kb = elVon(ev)?.closest('button[data-k]');
                    if (!kb)
                        return;
                    m.remove();
                    const kk = kb.dataset.k;
                    if (!kk)
                        return;
                    const wert2 = await UI.frage('Welcher Wert für „' + coll.schema[kk].name + '"?', '');
                    if (wert2 === null)
                        return;
                    ids.forEach(id => Store.setProp(id, kk, wert2));
                    l.remove();
                    App.zeichneSeite();
                    UI.toast(ids.length + ' Einträge geändert');
                });
            }
        });
    };
    /** Eine Zeile vor eine andere schieben — die eigene Reihenfolge merken. */
    const zeileEinordnen = (coll, quelleId, zielId) => {
        const alle = Store.rowsOf(coll.id);
        alle.forEach((r, i) => { if (r.ordnung == null)
            Store.updateBlock(r.id, { ordnung: i }); });
        const liste = Store.rowsOf(coll.id).slice().sort((a, b) => (a.ordnung ?? 0) - (b.ordnung ?? 0));
        const q = liste.findIndex(r => r.id === quelleId);
        const z = liste.findIndex(r => r.id === zielId);
        if (q < 0 || z < 0)
            return;
        const [weg] = liste.splice(q, 1);
        liste.splice(z, 0, weg);
        liste.forEach((r, i) => Store.updateBlock(r.id, { ordnung: i }));
        App.zeichneSeite();
    };
    /** Eine Spalte vor eine andere schieben. */
    const spalteEinordnen = (coll, quelle, ziel) => {
        const keys = Object.keys(coll.schema);
        const q = keys.indexOf(quelle), z = keys.indexOf(ziel);
        if (q < 0 || z < 0)
            return;
        keys.splice(q, 1);
        keys.splice(z, 0, quelle);
        const neu = {};
        keys.forEach(k => neu[k] = coll.schema[k]);
        Store.updateCollection(coll.id, { schema: neu });
        App.zeichneSeite();
    };
    /** Die Sammlung, auf die eine Verknüpfungsspalte zeigt. */
    const zielColl = (coll, key) => {
        const def = coll.schema[key];
        return def && def.type === 'relation' ? Store.getCollection(def.ziel) : null;
    };
    /** Ein Knopf in einer Zelle — legt einen Eintrag an oder setzt einen Wert. */
    const knopfInZelle = (row, key, coll) => {
        const def = coll.schema[key];
        const ziel = def.setzeKey;
        if (ziel && coll.schema[ziel]) {
            Store.setProp(row.id, ziel, def.setzeWert ?? '');
            UI.toast(`„${coll.schema[ziel].name}" gesetzt`);
            App.zeichneSeite();
            return;
        }
        /* Ohne Einstellung: fragen, was der Knopf tun soll */
        const m = UI.menu('<div class="grp">Was soll der Knopf setzen?</div>' +
            Object.keys(coll.schema).filter(k => k !== key && coll.schema[k].type !== 'title')
                .map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join(''), innerWidth / 2 - 120, 160);
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-k]');
            if (!b)
                return;
            m.remove();
            const w = await UI.frage('Welcher Wert soll gesetzt werden?', '');
            if (w === null)
                return;
            def.setzeKey = b.dataset.k;
            def.setzeWert = w;
            Store.updateCollection(coll.id, { schema: coll.schema });
            UI.toast('Knopf eingerichtet');
            App.zeichneSeite();
        });
    };
    /* --- KI-Feld: Notions „AI Autofill", nur lokal --------------------------- */
    /**
     * Gibt zurück, ob wirklich etwas Brauchbares in der Zelle steht.
     *
     * `false` heisst: die KI gab nichts, sie warf, oder das Schreiben prallte
     * am Spaltenrecht ab (`setProp` kehrt dann still zurück — das wird hier
     * durch Nachlesen erkannt, ohne die Rechteprüfung anzufassen). Die
     * Aufrufer im Automationslauf ignorieren den Wert; der KI-Agent zählt
     * damit, was er wirklich gefüllt hat, statt was er angefasst hat.
     */
    const kiFeldFuellen = async (row, key, coll) => {
        const def = coll.schema[key];
        const auftrag = def.auftrag || KI_AUFTRAG[def.type] ||
            'Fasse diesen Eintrag in einem kurzen Satz zusammen.';
        const zeileAlsText = Object.keys(coll.schema)
            .filter(k => k !== key && !KI_TYPEN.includes(coll.schema[k].type) && coll.schema[k].type !== 'button')
            .map(k => coll.schema[k].name + ': ' + Formula.anzeige(wert(row, k, coll)))
            .join('\n');
        Store.setProp(row.id, key, '… denkt nach');
        App.zeichneSeite();
        let antwort = '';
        try {
            antwort = await KI.frageKurz(auftrag + '\n\nDer Eintrag:\n' + zeileAlsText +
                '\n\nAntworte knapp, ohne Einleitung, in höchstens 20 Wörtern.');
        }
        catch (err) {
            /* Die Zelle darf nicht ewig „… denkt nach" zeigen — das sieht aus
               wie Arbeit und ist keine. Erst aufräumen, dann weiterwerfen. */
            Store.setProp(row.id, key, '(Fehler)');
            App.zeichneSeite();
            throw err;
        }
        const final = (antwort || '').trim();
        Store.setProp(row.id, key, final || '(keine Antwort)');
        App.zeichneSeite();
        /* Nachlesen statt glauben: prallte das Schreiben am Spaltenrecht ab,
           steht der Wert jetzt NICHT da — und genau das ist die Antwort. */
        return !!final && ((Store.getBlock(row.id) || {}).props || {})[key] === final;
    };
    /**
     * Setzt eine Verknüpfung und pflegt die Gegenrichtung.
     * Ist die Spalte wechselseitig eingerichtet, trägt sie sich auf der
     * anderen Seite selbst ein und wieder aus — wie in Notion.
     */
    const relationSetzen = (row, key, coll, neueIds) => {
        const def = coll.schema[key];
        const alt2 = wert(row, key, coll) || [];
        const grenze = def.limit === 1 ? neueIds.slice(-1) : neueIds;
        Store.setProp(row.id, key, grenze);
        if (!def.gegen)
            return;
        const ziel = Store.getCollection(def.ziel);
        if (!ziel || !ziel.schema[def.gegen])
            return;
        /* Bei den Weggefallenen austragen */
        alt2.filter((id) => !grenze.includes(id)).forEach((id) => {
            const z = Store.getBlock(id);
            if (!z)
                return;
            const liste = (z.props?.[def.gegen] || []).filter((x) => x !== row.id);
            Store.setProp(id, def.gegen, liste);
        });
        /* Bei den Neuen eintragen.
         *
         * DIE GEGENSEITE HAT IHRE EIGENE GRENZE, und die galt bis E306 nicht
         * (Redurs Punkt 12). Hier stand `[...liste, row.id]` — angehängt, ohne
         * zu fragen, wie viele drüben erlaubt sind. Eine Verknüpfung, die auf
         * beiden Seiten „nur eine" heisst, wurde damit auf der Gegenseite
         * stillschweigend zu „beliebig viele": zwei Zeilen konnten dieselbe
         * Zielzeile für sich beanspruchen, und beide sahen richtig aus.
         *
         * Jetzt gilt drüben, was drüben eingestellt ist. Ist die Gegenseite auf
         * eine begrenzt und schon belegt, wird die alte Verbindung GELÖST — das
         * ist, was „genau eine" heisst — und zwar auf BEIDEN Seiten. Ein
         * Verdrängter, der weiterhin auf sein altes Ziel zeigt, während das Ziel
         * ihn nicht mehr kennt, wäre der schlechtere Zustand: die Ansicht zeigt
         * dann je nach Blickrichtung etwas anderes (§46). */
        const gegenDef = ziel.schema[def.gegen] || {};
        grenze.filter((id) => !alt2.includes(id)).forEach((id) => {
            const z = Store.getBlock(id);
            if (!z)
                return;
            const liste = z.props?.[def.gegen] || [];
            if (liste.includes(row.id))
                return;
            if (gegenDef.limit === 1) {
                /* Die Verdrängten aus IHRER Spalte austragen, bevor die Zielzeile
                   umgehängt wird — sonst zeigen sie ins Leere. */
                liste.filter((x) => x !== row.id).forEach((verdraengt) => {
                    const v = Store.getBlock(verdraengt);
                    if (!v)
                        return;
                    const seine = (v.props?.[key] || []).filter((x) => x !== id);
                    Store.setProp(verdraengt, key, seine);
                });
                Store.setProp(id, def.gegen, [row.id]);
            }
            else {
                Store.setProp(id, def.gegen, [...liste, row.id]);
            }
        });
    };
    /** Was die Art im Klartext heisst — ein Satz, kein Fachwort. */
    const relationsartSatz = (art) => ({
        '1:1': 'Genau eine, und die gehört dann nur hierher. Trägst du sie ' +
            'woanders ein, wird sie hier gelöst.',
        '1:n': 'Hier eine, drüben beliebig viele.',
        'n:1': 'Hier beliebig viele, drüben nur eine.',
        'n:n': 'Beliebig viele auf beiden Seiten.',
        'einseitig': 'Nur in diese Richtung — die Gegenseite weiss nichts davon.',
        'einseitig, eine': 'Nur in diese Richtung, und höchstens eine.'
    }[art] || 'Noch kein Ziel gewählt.');
    /**
     * Die ART einer Verknüpfung, abgelesen aus den zwei Grenzen (E306,
     * Redurs Punkt 12).
     *
     * Redion hat die Art nie geführt, sondern nur je Seite eine Grenze. Das
     * ist dasselbe in klein — man muss es nur aussprechen, damit man beim
     * Einrichten sieht, was man gerade baut. Eine Fachlehrerin und ihr Fach
     * sind etwas anderes als ein Fach und seine Karteikarten, und wer das erst
     * merkt, wenn zwei Zeilen dieselbe Lehrerin für sich beanspruchen, hat es
     * zu spät gemerkt.
     *
     * Ohne Gegenrichtung gibt es keine Art — dann ist es ein einseitiger
     * Verweis, und das steht dann auch da.
     */
    const relationsart = (coll, key) => {
        const def = coll?.schema?.[key];
        if (!def || def.type !== 'relation')
            return '';
        if (!def.gegen)
            return def.limit === 1 ? 'einseitig, eine' : 'einseitig';
        const ziel = Store.getCollection(def.ziel);
        const gegen = ziel?.schema?.[def.gegen];
        if (!gegen)
            return def.limit === 1 ? 'einseitig, eine' : 'einseitig';
        const hier = def.limit === 1 ? '1' : 'n';
        const dort = gegen.limit === 1 ? '1' : 'n';
        return hier + ':' + dort;
    };
    /** Richtet eine Verknüpfung ein: Ziel, Gegenrichtung, Limit. */
    const relationEinrichten = (coll, key) => {
        const def = coll.schema[key];
        const alle = Object.values(Store.cache.collections);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(520px,94vw)">' +
                `<div class="fh">Verknüpfung „${esc(def.name)}"<button class="icon-btn" data-a="zu">✕</button></div>` +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
                '<label>Womit verknüpfen?<br><select id="rz">' +
                alle.map(c => `<option value="${c.id}"${c.id === def.ziel ? ' selected' : ''}>` +
                    `${esc(c.name)}</option>`).join('') +
                '</select></label>' +
                '<label>Wie viele je Zelle?<br><select id="rl">' +
                `<option value="0"${!def.limit ? ' selected' : ''}>Beliebig viele</option>` +
                `<option value="1"${def.limit === 1 ? ' selected' : ''}>Nur eine</option>` +
                '</select></label>' +
                '<label style="display:flex; gap:10px; align-items:center">' +
                `<input type="checkbox" id="rg"${def.gegen ? ' checked' : ''} style="width:auto">` +
                '<span>Wechselseitig — die Gegenseite bekommt eine eigene Spalte</span></label>' +
                '<div style="font-size:12.5px; color:var(--text-faint); line-height:1.5">' +
                'Wechselseitig heisst: Trägst du hier etwas ein, steht es auf der anderen Seite ' +
                'automatisch auch. Rollups brauchen das nicht, funktionieren damit aber sauberer.</div>' +
                /* DIE ART STEHT DA, WÄHREND MAN SIE EINSTELLT (E306). Sie ergibt
                   sich aus den zwei Grenzen und wurde deshalb nie ausgesprochen —
                   und wer sie nicht ausspricht, merkt erst beim dritten Eintrag,
                   dass er etwas anderes gebaut hat, als er meinte. */
                '<div class="rel-art" style="font-size:12.5px; line-height:1.5">' +
                'Art dieser Verknüpfung: <b>' + esc(relationsart(coll, key) || '—') + '</b>' +
                '<span style="color:var(--text-faint)"> — ' +
                esc(relationsartSatz(relationsart(coll, key))) + '</span></div>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (!elVon(e)?.closest('[data-a="ok"]'))
                return;
            const zielId = o.querySelector('#rz')?.value;
            const limit = Number(o.querySelector('#rl')?.value ?? 0);
            const wechsel = o.querySelector('#rg')?.checked;
            def.ziel = zielId;
            def.limit = limit;
            const ziel = Store.getCollection(zielId);
            if (wechsel && ziel) {
                if (!def.gegen || !ziel.schema[def.gegen]) {
                    const gk = Ids.short(5);
                    ziel.schema[gk] = { name: coll.name, type: 'relation', ziel: coll.id, gegen: key, limit: 0 };
                    def.gegen = gk;
                    Store.updateCollection(ziel.id, { schema: ziel.schema });
                }
            }
            else if (!wechsel && def.gegen && ziel) {
                delete ziel.schema[def.gegen];
                Store.updateCollection(ziel.id, { schema: ziel.schema });
                def.gegen = '';
            }
            Store.updateCollection(coll.id, { schema: coll.schema });
            o.remove();
            App.zeichneSeite();
            UI.toast('Verknüpfung eingerichtet');
        });
    };
    /* --- Verknüpfungen bearbeiten ------------------------------------------- */
    const relationWaehlen = (row, key, coll) => {
        const def = coll.schema[key];
        let ziel = Store.getCollection(def.ziel);
        /* Noch keine Zieldatenbank? Erst die auswählen. */
        if (!ziel) {
            const alle = Object.values(Store.cache.collections);
            if (!alle.length) {
                UI.toast('Es gibt noch keine zweite Datenbank');
                return;
            }
            const m = UI.menu('<div class="grp">Womit verknüpfen?</div>' +
                alle.map(c => `<button data-c="${c.id}">${esc(c.name)}</button>`).join(''), innerWidth / 2 - 120, 160);
            m.addEventListener('click', e => {
                const b = elVon(e)?.closest('button[data-c]');
                if (!b)
                    return;
                def.ziel = b.dataset.c;
                Store.updateCollection(coll.id, { schema: coll.schema });
                m.remove();
                relationWaehlen(row, key, coll);
            });
            return;
        }
        const gewaehlt = new Set(wert(row, key, coll) || []);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder">' +
                `<div class="fh">Verknüpfen mit „${esc(ziel.name)}"</div>` +
                '<input id="rq" placeholder="Eintrag suchen …" autocomplete="off">' +
                '<div class="res" id="rr"></div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Fertig</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const zeichne = (q = '') => {
            fuelle(o, '#rr', Store.rowsOf(ziel.id)
                .filter(z => !q || (z.text || '').toLowerCase().includes(q.toLowerCase()))
                .slice(0, 40)
                .map(z => `<button data-z="${z.id}"><span class="mi">${gewaehlt.has(z.id) ? '☑' : '☐'}</span>` +
                `<span style="flex:1">${esc(z.text || 'Ohne Titel')}</span></button>`).join('') +
                (q ? `<hr><button data-neu="${esc(q)}"><span class="mi">✚</span>„${esc(q)}" neu anlegen</button>` : ''));
        };
        zeichne();
        o.querySelector('#rq')?.addEventListener('input', e => zeichne((feldVon(e)?.value ?? '')));
        o.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="ok"]') || e.target === o) {
                relationSetzen(row, key, coll, [...gewaehlt]);
                o.remove();
                App.zeichneSeite();
                return;
            }
            const neu = elVon(e)?.closest('button[data-neu]');
            if (neu) {
                const z = Store.addRow(ziel.id, {});
                Store.updateBlock(z.id, { text: neu.dataset.neu });
                gewaehlt.add(z.id);
                zeichne();
                return;
            }
            const b = elVon(e)?.closest('button[data-z]');
            if (!b)
                return;
            if (gewaehlt.has(b.dataset.z))
                gewaehlt.delete(b.dataset.z);
            else {
                if (def.limit === 1)
                    gewaehlt.clear();
                gewaehlt.add(b.dataset.z);
            }
            zeichne(o.querySelector('#rq')?.value);
        });
        o.querySelector('#rq')?.focus();
    };
    /* --- Zelle bearbeiten --------------------------------------------------- */
    /* ------------------------------------------------------------------------
     * FELDER, DIE AN EINER VERBINDUNG HÄNGEN
     * Google Drive, Figma, GitHub-Pull-Request, Zendesk. Die Adresse wird
     * eingefügt; ist der Dienst verbunden, holt die App Titel und Zustand
     * dazu. Ohne Verbindung bleibt die Adresse — das ist ehrlicher als ein
     * Feld, das ohne Konto gar nichts kann.
     * ----------------------------------------------------------------------*/
    const DIENST_HILFE = {
        gdrive: ['Google Drive', 'https://drive.google.com/file/d/…/view'],
        figma: ['Figma', 'https://figma.com/file/…'],
        githubpr: ['GitHub', 'https://github.com/besitzer/repo/pull/12'],
        zendesk: ['Zendesk', 'https://deinefirma.zendesk.com/agent/tickets/123']
    };
    const dienstTitelHolen = async (typ, url) => {
        try {
            if (typ === 'githubpr') {
                const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
                if (!m || !Verbindungen.githubToken())
                    return null;
                const pr = await Verbindungen.githubRuf(`/repos/${m[1]}/${m[2]}/pulls/${m[3]}`);
                if (!pr || !pr.title)
                    return null;
                return { titel: '#' + pr.number + ' ' + pr.title,
                    zusatz: pr.merged_at ? 'zusammengeführt' : pr.state === 'open' ? 'offen' : 'zu' };
            }
            if (typ === 'gdrive') {
                const m = url.match(/\/d\/([-\w]{10,})/) || url.match(/[?&]id=([-\w]{10,})/);
                const tok = Verbindungen.googleToken();
                if (!m || !tok)
                    return null;
                const d = await Verbindungen.jsonRuf('https://www.googleapis.com/drive/v3/files/' + m[1] + '?fields=name,mimeType', { headers: { Authorization: 'Bearer ' + tok.token } });
                if (!d || !d.name)
                    return null;
                return { titel: d.name, zusatz: (d.mimeType || '').split('.').pop() };
            }
        }
        catch (e) { /* Ohne Verbindung bleibt es bei der Adresse. */ }
        return null;
    };
    const dienstFeld = async (_td, row, key, coll) => {
        const def = coll.schema[key];
        const jetzt = wert(row, key, coll) || {};
        const [name, beispiel] = DIENST_HILFE[def.type] || ['Dienst', ''];
        const url = await UI.frage(name + '-Adresse einfügen — z. B. ' + beispiel, jetzt.url || '');
        if (url === null)
            return;
        if (!url.trim()) {
            Store.setProp(row.id, key, null);
            App.zeichneSeite();
            return;
        }
        Store.setProp(row.id, key, { url: url.trim(), titel: jetzt.titel || '', zusatz: '' });
        App.zeichneSeite();
        const dazu = await dienstTitelHolen(def.type, url.trim());
        if (dazu) {
            Store.setProp(row.id, key, Object.assign({ url: url.trim() }, dazu));
            App.zeichneSeite();
            UI.toast(name + ': ' + dazu.titel);
        }
        else if (!jetzt.titel) {
            const t = await UI.frage('Wie soll die Verknüpfung heissen?', url.split('/').filter(Boolean).pop() || name);
            if (t) {
                Store.setProp(row.id, key, { url: url.trim(), titel: t, zusatz: '' });
                App.zeichneSeite();
            }
        }
    };
    const zelleBearbeiten = (td, row, key, coll) => {
        /* Sterne werden angeklickt, nicht getippt. */
        if (coll.schema[key] && coll.schema[key].type === 'sterne')
            return;
        const def = coll.schema[key];
        if (def.type === 'relation') {
            relationWaehlen(row, key, coll);
            return;
        }
        if (def.type === 'button') {
            knopfInZelle(row, key, coll);
            return;
        }
        if (DIENST_TYPEN.includes(def.type)) {
            dienstFeld(td, row, key, coll);
            return;
        }
        if (KI_TYPEN.includes(def.type)) {
            kiFeldFuellen(row, key, coll);
            return;
        }
        if (NUR_LESEN.includes(def.type)) {
            UI.toast('Dieses Feld wird berechnet und kann nicht direkt bearbeitet werden.');
            return;
        }
        /* Prüfung — Notions „Verification": geprüft, abgelehnt, mit Frist */
        if (def.type === 'verify') {
            const r = td.getBoundingClientRect();
            const jetzt = wert(row, key, coll) || {};
            const m = UI.menu('<div class="grp">Prüfung</div>' +
                '<button data-p="ok"><span class="mi">✔</span>Geprüft</button>' +
                '<button data-p="nein"><span class="mi">✖</span>Abgelehnt</button>' +
                '<button data-p="offen"><span class="mi">○</span>Nicht geprüft</button>' +
                '<hr><button data-p="frist"><span class="mi">📅</span>Gültig bis …</button>' +
                (jetzt.wer ? `<div class="grp" style="font-weight:400">zuletzt: ${esc(jetzt.wer)}` +
                    (jetzt.wann ? ' am ' + esc(String(jetzt.wann).slice(0, 10)) : '') + '</div>' : ''), r.left, r.bottom + 2);
            m.addEventListener('click', async (e) => {
                const b = elVon(e)?.closest('button[data-p]');
                if (!b)
                    return;
                const wer = Store.getMeta('nutzer', '') || 'Ich';
                if (b.dataset.p === 'frist') {
                    m.remove();
                    const bis = await UI.frage('Gültig bis (JJJJ-MM-TT)', jetzt.bis || '');
                    if (bis == null)
                        return;
                    Store.setProp(row.id, key, Object.assign({}, jetzt, { bis }));
                }
                else if (b.dataset.p === 'offen') {
                    m.remove();
                    Store.setProp(row.id, key, null);
                }
                else {
                    m.remove();
                    Store.setProp(row.id, key, {
                        stand: b.dataset.p === 'ok' ? 'ok' : 'nein',
                        wer, wann: Store.now(), bis: jetzt.bis || ''
                    });
                }
                App.zeichneSeite();
            });
            return;
        }
        /* Ort — Adresse eintippen, Nominatim sucht die Koordinaten dazu.
           Kostenlos, ohne Schlüssel; ohne Netz bleibt einfach der Text stehen. */
        if (def.type === 'place') {
            const jetzt = wert(row, key, coll);
            const alt = jetzt && typeof jetzt === 'object' ? jetzt.name : (jetzt || '');
            const inp = document.createElement('input');
            inp.value = alt || '';
            inp.placeholder = 'Adresse oder Ort';
            inp.style.cssText = 'width:100%; background:var(--bg-input); border:1px solid var(--accent); ' +
                'border-radius:3px; padding:3px 5px; outline:none';
            td.innerHTML = '';
            td.appendChild(inp);
            inp.focus();
            inp.select();
            let fertigSchon = false;
            const fertig = async () => {
                if (fertigSchon)
                    return;
                fertigSchon = true;
                const name = inp.value.trim();
                if (!name) {
                    Store.setProp(row.id, key, null);
                    td.innerHTML = zelle(row, key, coll);
                    return;
                }
                Store.setProp(row.id, key, { name });
                td.innerHTML = zelle(row, key, coll);
                const treffer = await ortSuchen(name).catch(() => null);
                if (treffer) {
                    Store.setProp(row.id, key, { name, lat: treffer.lat, lon: treffer.lon, voll: treffer.name });
                    td.innerHTML = zelle(row, key, coll);
                }
            };
            inp.addEventListener('blur', fertig);
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    inp.blur();
                }
                if (e.key === 'Escape') {
                    fertigSchon = true;
                    td.innerHTML = zelle(row, key, coll);
                }
            });
            return;
        }
        /* Zeitspanne — „1h30", „90", „1:30" ergeben alle 90 Minuten */
        if (def.type === 'duration') {
            const inp = document.createElement('input');
            const alt = wert(row, key, coll);
            inp.value = alt == null ? '' : dauerText(alt);
            inp.placeholder = 'z. B. 1h30 oder 90';
            inp.style.cssText = 'width:100%; background:var(--bg-input); border:1px solid var(--accent); ' +
                'border-radius:3px; padding:3px 5px; outline:none';
            td.innerHTML = '';
            td.appendChild(inp);
            inp.focus();
            inp.select();
            const fertig = () => {
                Store.setProp(row.id, key, dauerLesen(inp.value));
                td.innerHTML = zelle(row, key, coll);
            };
            inp.addEventListener('blur', fertig);
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    inp.blur();
                }
                if (e.key === 'Escape') {
                    td.innerHTML = zelle(row, key, coll);
                }
            });
            return;
        }
        if (def.type === 'select' || def.type === 'status' || def.type === 'multi') {
            const r = td.getBoundingClientRect();
            const aktuell = wert(row, key, coll);
            const html = (def.options || []).map((o) => `<button data-o="${esc(o.name)}"><span class="tag bg-${o.color}">${esc(o.name)}</span></button>`).join('') +
                '<hr><button data-o="__neu">+ Neue Option</button>' +
                (def.type !== 'multi' ? '<button data-o="">Leeren</button>' : '');
            const m = UI.menu(html, r.left, r.bottom + 2);
            m.addEventListener('click', (e) => {
                const b = elVon(e)?.closest('button[data-o]');
                if (!b)
                    return;
                let v = b.dataset.o;
                if (v === '__neu') {
                    const name = prompt('Name der neuen Option');
                    if (!name)
                        return;
                    def.options = def.options || [];
                    def.options.push({ name, color: FARBEN[def.options.length % FARBEN.length] });
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    v = name;
                }
                if (def.type === 'multi') {
                    const alt = Array.isArray(aktuell) ? aktuell : [];
                    const neu = alt.includes(v) ? alt.filter(x => x !== v) : [...alt, v];
                    Store.setProp(row.id, key, neu);
                }
                else {
                    Store.setProp(row.id, key, v);
                    m.remove();
                }
                App.zeichneSeite();
            });
            return;
        }
        /* Freies Eingabefeld direkt in der Zelle */
        const alt = wert(row, key, coll);
        const inp = document.createElement('input');
        inp.type = def.type === 'date' ? 'date'
            : def.type === 'number' ? 'number'
                : def.type === 'email' ? 'email'
                    : def.type === 'url' ? 'url' : 'text';
        inp.value = def.type === 'date' && alt ? String(alt).slice(0, 10) : (alt ?? '');
        inp.style.cssText = 'width:100%; background:var(--bg-input); border:1px solid var(--accent); ' +
            'border-radius:3px; padding:3px 5px; outline:none';
        td.innerHTML = '';
        td.appendChild(inp);
        inp.focus();
        inp.select();
        const fertig = () => {
            Store.setProp(row.id, key, inp.value);
            td.innerHTML = zelle(row, key, coll);
        };
        inp.addEventListener('blur', fertig);
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                inp.blur();
            }
            if (e.key === 'Escape') {
                td.innerHTML = zelle(row, key, coll);
            }
        });
    };
    /* --- Board -------------------------------------------------------------- */
    /** Bildquelle einer Zeile für die Kartenvorschau — Datei-, Bild- oder URL-Spalte. */
    const kartenBild = (r, coll, view) => {
        if (view.bildKey === '')
            return null;
        const kandidaten = view.bildKey && coll.schema[view.bildKey]
            ? [view.bildKey]
            : Object.keys(coll.schema).filter(k => ['files', 'url', 'text'].includes(coll.schema[k].type));
        for (const k of kandidaten) {
            const v = (r.props || {})[k];
            const liste = Array.isArray(v) ? v : (v ? [v] : []);
            for (const x of liste) {
                const u = typeof x === 'string' ? x : (x && (x.url || x.src)) || '';
                if (/^(https?:|data:image|blob:)/i.test(u) &&
                    (/\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(u) || /^data:image/i.test(u) || /^blob:/.test(u)))
                    return u;
            }
        }
        /* Sonst: das erste Bild im Seiteninhalt der Zeile */
        const kind = Store.childrenOf(r.id).find((b) => b.type === 'image' && b.props && b.props.src);
        return kind ? kind.props.src : null;
    };
    const alsBoard = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'board';
        /* Nach welcher Spalte gruppieren? Erste Select/Status-Spalte als Standard. */
        const gk = view.groupBy ||
            Object.keys(coll.schema).find(k => ['select', 'status'].includes(coll.schema[k].type));
        if (!gk) {
            w.innerHTML = '<div style="color:var(--text-faint)">Für ein Board wird eine Auswahl- oder Status-Spalte gebraucht.</div>';
            return w;
        }
        /* Bahnen (Swimlanes): eine zweite Gruppierung quer zum Board.
           Notion hat das nicht — dort geht immer nur eine Achse. */
        const bahnKey = view.bahnKey && coll.schema[view.bahnKey] && view.bahnKey !== gk
            ? view.bahnKey : null;
        if (bahnKey) {
            const bd = coll.schema[bahnKey];
            let werteB = [];
            if ((bd.options || []).length)
                werteB = bd.options.map((o) => o.name);
            else
                werteB = [...new Set(rows.map((r) => String(wert(r, bahnKey, coll) ?? '')).filter(Boolean))]
                    .sort((a, b) => a.localeCompare(b, 'de'));
            werteB.push('(Leer)');
            const aussen = document.createElement('div');
            aussen.className = 'bahnen';
            werteB.forEach((bw) => {
                const drin = rows.filter((r) => (String(wert(r, bahnKey, coll) ?? '') || '(Leer)') === bw);
                if (!drin.length && (bw === '(Leer)' || view.leereGruppen === false))
                    return;
                const bahn = document.createElement('div');
                bahn.className = 'bahn';
                const zu = (view.bahnenZu || []).includes(bw);
                bahn.innerHTML = `<div class="bahn-kopf" data-bahn="${esc(bw)}">` +
                    `<span class="bahn-pfeil">${zu ? '▸' : '▾'}</span>` +
                    `<b>${esc(bahnKey ? coll.schema[bahnKey].name + ': ' : '')}${esc(bw)}</b>` +
                    `<em>${drin.length}</em></div>`;
                if (!zu)
                    bahn.appendChild(boardSpalten(coll, view, drin, gk, bahnKey, bw));
                aussen.appendChild(bahn);
            });
            aussen.addEventListener('click', e => {
                const k = elVon(e)?.closest('[data-bahn]');
                if (!k)
                    return;
                const liste = [...(view.bahnenZu || [])];
                const i = liste.indexOf(k.dataset.bahn);
                if (i >= 0)
                    liste.splice(i, 1);
                else
                    liste.push(k.dataset.bahn);
                Store.updateView(view.id, { bahnenZu: liste });
                App.zeichneSeite();
            });
            w.className = '';
            w.appendChild(aussen);
            return w;
        }
        w.appendChild(boardSpalten(coll, view, rows, gk, null, null));
        return w;
    };
    /** Die Spalten eines Boards — einmal für das ganze Board oder je Bahn. */
    const boardSpalten = (coll, view, rows, gk, bahnKey, bahnWert) => {
        const w = document.createElement('div');
        w.className = 'board';
        const def = coll.schema[gk];
        let gruppen = [...(def.options || []).map((o) => o.name), '(Leer)'];
        /* Wie sollen die Gruppen selbst sortiert sein? Notion bietet dafür
           manuell (= Reihenfolge der Optionen), alphabetisch auf- und absteigend
           sowie nach Anzahl. „(Leer)" bleibt immer hinten. */
        const wieViele = (g) => rows.filter((r) => (wert(r, gk, coll) || '(Leer)') === g).length;
        const art = view.gruppeSort || 'manuell';
        if (art !== 'manuell') {
            const leer = gruppen.filter(g => g === '(Leer)');
            gruppen = gruppen.filter(g => g !== '(Leer)');
            if (art === 'alphabetisch')
                gruppen.sort((a, b) => a.localeCompare(b, 'de'));
            if (art === 'alphabetisch-ab')
                gruppen.sort((a, b) => b.localeCompare(a, 'de'));
            if (art === 'anzahl')
                gruppen.sort((a, b) => wieViele(b) - wieViele(a));
            if (art === 'anzahl-auf')
                gruppen.sort((a, b) => wieViele(a) - wieViele(b));
            gruppen = gruppen.concat(leer);
        }
        gruppen.forEach(g => {
            const drin = rows.filter((r) => (wert(r, gk, coll) || '(Leer)') === g);
            /* Die Sammelspalte für leere Werte nur zeigen, wenn wirklich etwas drin ist */
            if (g === '(Leer)' && !drin.length)
                return;
            /* Leere Gruppen ausblenden — ausser der Nutzer will sie sehen */
            /* Notion zeigt bei Auswahl- und Status-Spalten alle Optionen als Spalte,
               auch die leeren. Wer sie loswerden will, schaltet sie im Menü aus. */
            if (!drin.length && view.leereGruppen === false)
                return;
            const col = document.createElement('div');
            col.className = 'col k-' + (view.kartenGroesse || 'mittel');
            const opt = (def.options || []).find((o) => o.name === g);
            col.innerHTML = `<h4><span class="tag bg-${opt ? opt.color : 'gray'}">${esc(g)}</span><em>${drin.length}</em></h4>`;
            drin.forEach((r) => {
                const c = document.createElement('div');
                c.className = 'card';
                c.draggable = true;
                c.dataset.rid = r.id;
                let meta = '';
                Object.keys(coll.schema).forEach(k => {
                    if (k === gk || coll.schema[k].type === 'title')
                        return;
                    if ((view.hidden || []).includes(k))
                        return;
                    const z = zelle(r, k, coll);
                    if (z && !z.includes('—'))
                        meta += `<span class="mv">${z}</span>`;
                });
                const bild = view.bild === false ? null : kartenBild(r, coll, view);
                c.innerHTML =
                    (bild ? `<div class="kbild ${esc(view.bildPasst || 'deckt')}"><img src="${esc(bild)}" alt="" loading="lazy"></div>` : '') +
                        `<div>${esc(r.text || 'Ohne Titel')}</div>` + (meta ? `<div class="meta">${meta}</div>` : '');
                c.addEventListener('click', () => view.oeffnenAls === 'voll' ? App.oeffne(r.id) : zeilePeek(r, coll));
                c.addEventListener('contextmenu', e => { e.preventDefault(); zeilenMenue({ x: e.clientX, y: e.clientY }, r, coll); });
                c.addEventListener('dragstart', e => e.dataTransfer?.setData('text/plain', r.id));
                col.appendChild(c);
            });
            const add = document.createElement('button');
            add.textContent = '+ Neu';
            add.style.cssText = 'width:100%; text-align:left; padding:6px; color:var(--text-faint); font-size:13.5px; border-radius:5px';
            add.addEventListener('click', () => {
                const vor = g === '(Leer)' ? {} : { [gk]: g };
                if (bahnKey && bahnWert && bahnWert !== '(Leer)')
                    vor[bahnKey] = bahnWert;
                Store.addRow(coll.id, vor);
                App.zeichneSeite();
            });
            col.appendChild(add);
            col.addEventListener('dragover', e => { e.preventDefault(); col.style.outline = '2px solid var(--accent)'; });
            col.addEventListener('dragleave', () => col.style.outline = '');
            col.addEventListener('drop', e => {
                e.preventDefault();
                col.style.outline = '';
                const id = (e.dataTransfer?.getData('text/plain') ?? '');
                if (!id)
                    return;
                Store.setProp(id, gk, g === '(Leer)' ? '' : g);
                /* Über eine Bahn gezogen heisst: auch die zweite Gruppierung ändern. */
                if (bahnKey && bahnWert)
                    Store.setProp(id, bahnKey, bahnWert === '(Leer)' ? '' : bahnWert);
                App.zeichneSeite();
            });
            w.appendChild(col);
        });
        return w;
    };
    /* --- Liste -------------------------------------------------------------- */
    const alsListe = (coll, view, rows) => {
        const w = document.createElement('div');
        rows.forEach((r) => {
            const d = document.createElement('div');
            d.className = 'list-row';
            let meta = '';
            Object.keys(coll.schema).forEach(k => {
                if (coll.schema[k].type === 'title' || (view.hidden || []).includes(k))
                    return;
                const z = zelle(r, k, coll);
                if (z && !z.includes('—'))
                    meta += '<span style="font-size:12.5px">' + z + '</span>';
            });
            d.innerHTML = `<span style="flex:1">${esc(r.text || 'Ohne Titel')}</span>` +
                `<span style="display:flex;gap:6px;align-items:center">${meta}</span>`;
            d.addEventListener('click', () => App.oeffne(r.id));
            w.appendChild(d);
        });
        if (!rows.length)
            w.innerHTML = '<div style="color:var(--text-faint); padding:10px 0">Noch keine Einträge</div>';
        return w;
    };
    /* --- Galerie ------------------------------------------------------------ */
    const alsGalerie = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'gallery';
        rows.forEach((r) => {
            const c = document.createElement('div');
            c.className = 'card';
            let meta = '';
            Object.keys(coll.schema).forEach(k => {
                if (coll.schema[k].type === 'title' || (view.hidden || []).includes(k))
                    return;
                const z = zelle(r, k, coll);
                if (z && !z.includes('—'))
                    meta += `<span class="mv">${z}</span>`;
            });
            const bild = view.bild === false ? null : kartenBild(r, coll, view);
            c.innerHTML =
                (bild ? `<div class="kbild ${esc(view.bildPasst || 'deckt')}"><img src="${esc(bild)}" alt="" loading="lazy"></div>` : '') +
                    `<div style="font-weight:500; margin-bottom:6px">${esc(r.text || 'Ohne Titel')}</div>` +
                    `<div class="meta">${meta}</div>`;
            c.addEventListener('click', () => view.oeffnenAls === 'voll' ? App.oeffne(r.id) : zeilePeek(r, coll));
            c.addEventListener('contextmenu', e => { e.preventDefault(); zeilenMenue({ x: e.clientX, y: e.clientY }, r, coll); });
            w.appendChild(c);
        });
        return w;
    };
    /* --- Kalender ----------------------------------------------------------- */
    /* --- Kalender -----------------------------------------------------------
     * Drei Stufen wie in Notion Calendar: Tag, Woche, Monat — umschaltbar mit
     * den Tasten T/D, W und M. Neben der eigenen Datenbank können weitere
     * Datenbanken als zusätzliche Kalender eingeblendet werden, jede in ihrer
     * eigenen Farbe, ein- und ausschaltbar und in der Reihenfolge verschiebbar.
     * ----------------------------------------------------------------------*/
    const KAL_FARBEN = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown'];
    /* --------------------------------------------------------------------------
     * WELCHE SPALTE DAS ENDE IST, WENN NIEMAND ES GESAGT HAT (E410)
     *
     * `dateKey` hatte seit jeher einen Vorgabewert — die erste Datumsspalte.
     * `endeKey` hatte keinen. Damit stand jeder Termin immer nur an EINEM Tag,
     * auch wenn die Datenbank ein Enddatum trug. Ein Projekt vom 1. bis zum
     * 12. September stand am 1., und wer im Monat nachsah, was gerade laeuft,
     * sah es nicht.
     *
     * Der durchgehende Balken war die ganze Zeit gebaut (`spurenDerWoche`,
     * `balkenWoche`, `.cw-bar`) — er sprang nur nie an. Eine Funktion, deren
     * Schalter keinen Vorgabewert hat, ist eine Funktion, die es nicht gibt.
     *
     * GERATEN WIRD NUR, WAS DIE DATEN BELEGEN. Eine zweite Datumsspalte muss
     * nicht das Ende sein — sie kann „Erinnerung" heissen oder „zuletzt
     * geprueft". Ein Balken ueber die falsche Spanne waere schlimmer als gar
     * keiner. Deshalb drei Bedingungen, und alle drei muessen halten:
     *
     *   · Es gibt genau EINE weitere Datumsspalte.
     *   · Mindestens eine Zeile traegt beide Werte — sonst weiss man nichts.
     *   · Und bei JEDER Zeile, die beide traegt, liegt der zweite Wert nicht
     *     vor dem ersten. Ein einziges Gegenbeispiel genuegt zum Schweigen.
     *
     * `view.endeKey === undefined` heisst „nie entschieden"; `''` heisst
     * „ausdruecklich ein Tag" und wird nicht ueberstimmt.
     * ------------------------------------------------------------------------*/
    const endeGeraten = (coll, anfangKey) => {
        if (!anfangKey)
            return null;
        const weitere = Object.keys(coll.schema)
            .filter(k => k !== anfangKey && coll.schema[k].type === 'date');
        if (weitere.length !== 1)
            return null;
        const kandidat = weitere[0];
        let mitBeiden = 0;
        for (const r of Store.rowsOf(coll.id)) {
            const a = wert(r, anfangKey, coll);
            const b = wert(r, kandidat, coll);
            if (!a || !b)
                continue;
            const da = new Date(String(a)), db = new Date(String(b));
            if (isNaN(da.getTime()) || isNaN(db.getTime()))
                continue;
            /* Ein einziges frueheres Ende widerlegt die Annahme. */
            if (db.getTime() < da.getTime())
                return null;
            mitBeiden++;
        }
        return mitBeiden > 0 ? kandidat : null;
    };
    /** Die Endspalte einer Kalenderansicht — gewaehlt, geraten oder keine. */
    const kalEnde = (coll, view, anfangKey) => {
        if (view.endeKey && coll.schema[view.endeKey])
            return view.endeKey;
        if (view.endeKey !== undefined)
            return null; /* '' = ausdruecklich ein Tag */
        return endeGeraten(coll, anfangKey);
    };
    /** Alle Kalender dieser Ansicht: der eigene zuerst, dann die zugeschalteten. */
    const kalenderQuellen = (coll, view) => {
        const eigen = view.dateKey || Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
        const liste = [{
                coll, id: coll.id, name: coll.name, dateKey: eigen,
                endeKey: kalEnde(coll, view, eigen),
                farbe: view.farbe || 'blue', an: true, eigen: true
            }];
        (view.extraDbs || []).forEach((x, i) => {
            const c = Store.getCollection(x.collectionId);
            if (!c)
                return;
            const dk = x.dateKey && c.schema[x.dateKey]
                ? x.dateKey : Object.keys(c.schema).find(k => c.schema[k].type === 'date');
            if (!dk)
                return;
            liste.push({
                coll: c, id: c.id, name: c.name, dateKey: dk,
                endeKey: x.endeKey && c.schema[x.endeKey] ? x.endeKey : null,
                farbe: x.farbe || KAL_FARBEN[(i + 1) % KAL_FARBEN.length],
                an: x.an !== false, eigen: false
            });
        });
        return liste;
    };
    /** Die Termine einer Quelle für einen bestimmten Tag. */
    const termineAmTag = (q, tag, rows) => {
        const zeilen2 = rows || Store.rowsOf(q.id);
        const t0 = new Date(tag);
        t0.setHours(0, 0, 0, 0);
        const treffer = [];
        zeilen2.forEach((r) => {
            const v = wert(r, q.dateKey, q.coll);
            if (!v)
                return;
            const dv = new Date(v);
            if (isNaN(dv.getTime()))
                return;
            const von = new Date(dv);
            von.setHours(0, 0, 0, 0);
            let bis = von;
            if (q.endeKey) {
                const e2 = new Date(wert(r, q.endeKey, q.coll));
                if (!isNaN(e2.getTime())) {
                    bis = new Date(e2);
                    bis.setHours(0, 0, 0, 0);
                }
            }
            if (t0 < von || t0 > bis)
                return;
            treffer.push({
                row: r, quelle: q,
                mehrtaegig: bis > von,
                anfang: t0.getTime() === von.getTime(),
                ende: t0.getTime() === bis.getTime(),
                zeit: String(v).length > 10 ? String(v).slice(11, 16) : '',
                stunde: String(v).length > 10 ? parseInt(String(v).slice(11, 13), 10) : null
            });
        });
        return treffer;
    };
    const terminKnopf = (e, view) => {
        const ev = document.createElement('div');
        ev.className = 'ev q-' + e.quelle.farbe +
            (e.mehrtaegig ? ' lang' : '') +
            (e.mehrtaegig && e.anfang ? ' anfang' : '') +
            (e.mehrtaegig && e.ende ? ' ende' : '');
        ev.textContent = (e.mehrtaegig && !e.anfang ? '· ' : '') +
            (e.zeit ? e.zeit + ' ' : '') + (e.row.text || 'Ohne Titel');
        ev.title = e.quelle.name + ' · ' + (e.row.text || 'Ohne Titel');
        ev.addEventListener('click', ev2 => {
            ev2.stopPropagation();
            view.oeffnenAls === 'voll' ? App.oeffne(e.row.id) : zeilePeek(e.row, e.quelle.coll);
        });
        return ev;
    };
    const alsKalender = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'kal-block';
        const quellen = kalenderQuellen(coll, view).filter(q => q.an);
        if (!quellen.length || !quellen[0]?.dateKey) {
            w.innerHTML = '<div style="color:var(--text-faint)">Für den Kalender wird eine Datums-Spalte gebraucht.</div>';
            return w;
        }
        const stufe = view.kalStufe || 'monat';
        const stand = view.monat ? new Date(view.monat) : new Date();
        if (isNaN(stand.getTime()))
            stand.setTime(Date.now());
        const heuteStr = new Date().toDateString();
        const wsMontag = Einstellungen.wochenstart() === 1;
        /* Die Termine der Fremdkalender holen wir selbst, die eigenen sind
           schon durch Filter und Sortierung der Ansicht gelaufen. */
        const zeilenVon = (q) => q.eigen ? rows : Store.rowsOf(q.id);
        const wochenAnfang = (d) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            const start = wsMontag ? 1 : 0;
            x.setDate(x.getDate() - ((x.getDay() - start + 7) % 7));
            return x;
        };
        /* --- Kopfzeile ----------------------------------------------------- */
        const titel = stufe === 'monat'
            ? stand.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
            : stufe === 'woche'
                ? (() => {
                    const a = wochenAnfang(stand), b2 = new Date(a);
                    b2.setDate(a.getDate() + 6);
                    return 'KW ' + kalenderwoche(a) + ' · ' + a.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) +
                        ' – ' + b2.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
                })()
                : stand.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const kopf = document.createElement('div');
        kopf.className = 'kal-kopf';
        kopf.innerHTML =
            `<b>${esc(titel)}</b><span style="flex:1"></span>` +
                '<div class="kal-stufen">' +
                `<button data-s="tag"${stufe === 'tag' ? ' class="on"' : ''} title="Taste T oder D">Tag</button>` +
                `<button data-s="woche"${stufe === 'woche' ? ' class="on"' : ''} title="Taste W">Woche</button>` +
                `<button data-s="monat"${stufe === 'monat' ? ' class="on"' : ''} title="Taste M">Monat</button>` +
                '</div>' +
                '<button data-m="-1">‹</button>' +
                '<button data-m="0" class="heute">Heute</button>' +
                '<button data-m="1">›</button>';
        const springe = (richtung) => {
            const d = new Date(stand);
            if (richtung === 0)
                return new Date();
            if (stufe === 'monat')
                d.setMonth(d.getMonth() + richtung);
            else if (stufe === 'woche')
                d.setDate(d.getDate() + 7 * richtung);
            else
                d.setDate(d.getDate() + richtung);
            return d;
        };
        kopf.addEventListener('click', e => {
            const s = elVon(e)?.closest('button[data-s]');
            if (s) {
                Store.updateView(view.id, { kalStufe: s.dataset.s });
                App.zeichneSeite();
                return;
            }
            const b = elVon(e)?.closest('button[data-m]');
            if (!b)
                return;
            Store.updateView(view.id, { monat: springe(Number(b.dataset.m)).toISOString() });
            App.zeichneSeite();
        });
        w.appendChild(kopf);
        /* --- Alle Termine aller eingeschalteten Kalender, mit Zeitraum ------- */
        const alleTermine = () => {
            const liste = [];
            quellen.forEach(q => zeilenVon(q).forEach((r) => {
                const v = wert(r, q.dateKey, q.coll);
                if (!v)
                    return;
                const d = new Date(v);
                if (isNaN(d.getTime()))
                    return;
                const von = new Date(d);
                von.setHours(0, 0, 0, 0);
                let bis = new Date(von);
                if (q.endeKey) {
                    const e2 = new Date(wert(r, q.endeKey, q.coll));
                    if (!isNaN(e2.getTime())) {
                        bis = new Date(e2);
                        bis.setHours(0, 0, 0, 0);
                    }
                }
                if (bis < von)
                    bis = new Date(von);
                liste.push({
                    row: r, quelle: q, von, bis, mehrtaegig: bis > von,
                    zeit: String(v).length > 10 ? String(v).slice(11, 16) : '',
                    stunde: String(v).length > 10 ? parseInt(String(v).slice(11, 13), 10) : null,
                    minute: String(v).length > 10 ? parseInt(String(v).slice(14, 16), 10) || 0 : 0
                });
            }));
            return liste;
        };
        const termine = alleTermine();
        /* --- Eine Tageszelle, wie sie Monat und Woche brauchen -------------- */
        const tagesZelle = (tag, ausserhalb, ohneLange) => {
            const d = document.createElement('div');
            d.className = 'day' + (tag.toDateString() === heuteStr ? ' today' : '') +
                (ausserhalb ? ' out' : '');
            d.innerHTML = `<div class="n">${tag.getDate()}</div>`;
            quellen.forEach(q => termineAmTag(q, tag, zeilenVon(q))
                .forEach(e => { if (!(ohneLange && e.mehrtaegig))
                d.appendChild(terminKnopf(e, view)); }));
            d.addEventListener('dblclick', () => {
                const z = quellen.find(q => q.id === (view.neuIn || quellen[0]?.id)) || quellen[0];
                if (!z)
                    return;
                const p = (n) => String(n).padStart(2, '0');
                Store.addRow(z.id, { [z.dateKey ?? 'dt']: tag.getFullYear() + '-' + p(tag.getMonth() + 1) + '-' + p(tag.getDate()) });
                App.zeichneSeite();
            });
            return d;
        };
        /* Mehrtägige Termine einer Woche in Spuren legen, damit sich nichts
           überdeckt — das ist der durchgehende Balken, den Notion nicht zeichnet. */
        const spurenDerWoche = (wochenStart) => {
            const wEnde = new Date(wochenStart);
            wEnde.setDate(wochenStart.getDate() + 6);
            const drin = termine.filter(e => e.mehrtaegig && e.bis >= wochenStart && e.von <= wEnde)
                .sort((a, b) => a.von - b.von || b.bis - a.bis);
            const spuren = [];
            drin.forEach(e => {
                const a = Math.max(0, Math.round((e.von - wochenStart) / 86400000));
                const b2 = Math.min(6, Math.round((e.bis - wochenStart) / 86400000));
                let s = spuren.findIndex(sp => sp.every((x) => x.b < a || x.a > b2));
                if (s < 0) {
                    spuren.push([]);
                    s = spuren.length - 1;
                }
                spuren[s].push({ a, b: b2, e });
            });
            return spuren;
        };
        const balkenWoche = (wochenStart, spuren) => {
            const lage = document.createElement('div');
            lage.className = 'cw-balken';
            spuren.forEach((sp, si) => sp.forEach(({ a, b: b2, e }) => {
                const bar = document.createElement('div');
                bar.className = 'cw-bar q-' + e.quelle.farbe +
                    (e.von >= wochenStart ? ' anfang' : '') +
                    (e.bis <= new Date(wochenStart.getTime() + 6 * 86400000) ? ' ende' : '');
                bar.style.left = (a / 7 * 100) + '%';
                bar.style.width = ((b2 - a + 1) / 7 * 100) + '%';
                bar.style.top = (si * 20) + 'px';
                bar.textContent = (e.von < wochenStart ? '◂ ' : '') + (e.row.text || 'Ohne Titel');
                bar.title = e.quelle.name + ' · ' + (e.row.text || 'Ohne Titel') + ' · ' +
                    e.von.toLocaleDateString('de-DE') + ' – ' + e.bis.toLocaleDateString('de-DE');
                bar.addEventListener('click', ev => {
                    ev.stopPropagation();
                    view.oeffnenAls === 'voll' ? App.oeffne(e.row.id) : zeilePeek(e.row, e.quelle.coll);
                });
                lage.appendChild(bar);
            }));
            return lage;
        };
        /* --- Monat ---------------------------------------------------------- */
        if (stufe === 'monat') {
            const g = document.createElement('div');
            g.className = 'cal-monat';
            const namen = document.createElement('div');
            namen.className = 'cal-dow';
            (wsMontag ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'])
                .forEach(n => { const e = document.createElement('div'); e.className = 'dow'; e.textContent = n; namen.appendChild(e); });
            g.appendChild(namen);
            const jahr = stand.getFullYear(), monat = stand.getMonth();
            const erster = new Date(jahr, monat, 1);
            const start = wochenAnfang(erster);
            const letzter = new Date(jahr, monat + 1, 0);
            const wochen = Math.ceil((((letzter.getTime() - start.getTime()) / 86400000) + 1) / 7);
            for (let wi = 0; wi < wochen; wi++) {
                const wa = new Date(start);
                wa.setDate(start.getDate() + wi * 7);
                const spuren = spurenDerWoche(wa);
                const reihe = document.createElement('div');
                reihe.className = 'cal-woche';
                const tage = document.createElement('div');
                tage.className = 'cal';
                for (let i = 0; i < 7; i++) {
                    const t = new Date(wa);
                    t.setDate(wa.getDate() + i);
                    const z = tagesZelle(t, t.getMonth() !== monat, true);
                    /* 8 statt 5: die Balkenlage beginnt bei 4 px (bausteine.css), jeder
                       Balken ist 18 px hoch im 20er-Abstand. Der letzte endet damit
                       bei 4 + n*20 - 2; darunter braucht die Tageszahl noch Luft. */
                    if (spuren.length)
                        z.style.paddingTop = (8 + spuren.length * 20) + 'px';
                    tage.appendChild(z);
                }
                reihe.appendChild(tage);
                if (spuren.length)
                    reihe.appendChild(balkenWoche(wa, spuren));
                g.appendChild(reihe);
            }
            w.appendChild(g);
        }
        /* --- Woche: echtes Stundenraster wie in Notion Calendar -------------- */
        if (stufe === 'woche') {
            const a = wochenAnfang(stand);
            const tage7 = Array.from({ length: 7 }, (_, i) => {
                const t = new Date(a);
                t.setDate(a.getDate() + i);
                return t;
            });
            const g = document.createElement('div');
            g.className = 'kw';
            /* Kopf */
            const kw = document.createElement('div');
            kw.className = 'kw-kopf';
            kw.innerHTML = '<div class="kw-ecke"></div>' + tage7.map(t => `<div class="kw-tag${t.toDateString() === heuteStr ? ' jetzt' : ''}">` +
                `${t.toLocaleDateString('de-DE', { weekday: 'short' })} <b>${t.getDate()}.</b></div>`).join('');
            g.appendChild(kw);
            /* Ganztägige Termine und Balken über die Woche */
            const spuren = spurenDerWoche(a);
            const oben = document.createElement('div');
            oben.className = 'kw-ganz';
            oben.innerHTML = '<div class="kw-ecke">ganztags</div>';
            const gzFlaeche = document.createElement('div');
            gzFlaeche.className = 'kw-gz-flaeche';
            tage7.forEach(t => {
                const z = document.createElement('div');
                z.className = 'kw-gz';
                termine.filter(e => !e.mehrtaegig && e.stunde == null &&
                    e.von.toDateString() === t.toDateString())
                    .forEach(e => z.appendChild(terminKnopf(e, view)));
                gzFlaeche.appendChild(z);
            });
            if (spuren.length) {
                const lage = balkenWoche(a, spuren);
                lage.style.top = '2px';
                gzFlaeche.appendChild(lage);
                gzFlaeche.style.paddingTop = (spuren.length * 20 + 2) + 'px';
            }
            oben.appendChild(gzFlaeche);
            g.appendChild(oben);
            /* Stundenraster */
            const koerper = document.createElement('div');
            koerper.className = 'kw-koerper';
            const mitZeit = termine.filter(e => e.stunde != null && !e.mehrtaegig);
            const belegt = new Set(mitZeit.map(e => e.stunde));
            const vonStd = Math.min(7, ...(belegt.size ? [...belegt] : [7]));
            const bisStd = Math.max(21, ...(belegt.size ? [...belegt] : [21]));
            for (let h = vonStd; h <= bisStd; h++) {
                const z = document.createElement('div');
                z.className = 'kw-zeile';
                z.innerHTML = `<div class="kw-ecke">${String(h).padStart(2, '0')}:00</div>`;
                tage7.forEach(t => {
                    const zelle2 = document.createElement('div');
                    zelle2.className = 'kw-zelle' + (t.toDateString() === heuteStr ? ' heute' : '');
                    mitZeit.filter(e => e.stunde === h && e.von.toDateString() === t.toDateString())
                        .sort((x, y) => x.minute - y.minute)
                        .forEach(e => zelle2.appendChild(terminKnopf(e, view)));
                    zelle2.addEventListener('dblclick', () => {
                        const q = quellen.find(x => x.id === (view.neuIn || quellen[0]?.id)) || quellen[0];
                        if (!q)
                            return;
                        const p = (n) => String(n).padStart(2, '0');
                        Store.addRow(q.id, { [q.dateKey ?? 'dt']: t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' +
                                p(t.getDate()) + 'T' + p(h) + ':00' });
                        App.zeichneSeite();
                    });
                    z.appendChild(zelle2);
                });
                koerper.appendChild(z);
            }
            g.appendChild(koerper);
            w.appendChild(g);
            /* Jetzt-Linie */
            const nun = new Date();
            if (nun >= a && nun < new Date(a.getTime() + 7 * 86400000) &&
                nun.getHours() >= vonStd && nun.getHours() <= bisStd) {
                setTimeout(() => {
                    const zeilen2 = koerper.querySelectorAll('.kw-zeile');
                    const idx = nun.getHours() - vonStd;
                    const z = zeilen2[idx];
                    if (!z)
                        return;
                    const linie = document.createElement('div');
                    linie.className = 'kw-jetzt';
                    linie.style.top = (nun.getMinutes() / 60 * 100) + '%';
                    z.appendChild(linie);
                }, 0);
            }
        }
        /* --- Tag ------------------------------------------------------------ */
        if (stufe === 'tag') {
            const g = document.createElement('div');
            g.className = 'kal-tag';
            const alle = [];
            quellen.forEach(q => termineAmTag(q, stand, zeilenVon(q)).forEach(e => alle.push(e)));
            const ganztags = alle.filter(e => e.stunde == null);
            if (ganztags.length) {
                const z = document.createElement('div');
                z.className = 'kt-zeile ganztags';
                z.innerHTML = '<div class="kt-std">ganztags</div>';
                const box = document.createElement('div');
                box.className = 'kt-inhalt';
                ganztags.forEach(e => box.appendChild(terminKnopf(e, view)));
                z.appendChild(box);
                g.appendChild(z);
            }
            for (let h = 0; h < 24; h++) {
                const drin = alle.filter(e => e.stunde === h);
                /* Nachts nur zeigen, was auch belegt ist — sonst scrollt man ewig. */
                if (!drin.length && (h < 7 || h > 21))
                    continue;
                const z = document.createElement('div');
                z.className = 'kt-zeile';
                z.innerHTML = `<div class="kt-std">${String(h).padStart(2, '0')}:00</div>`;
                const box = document.createElement('div');
                box.className = 'kt-inhalt';
                drin.forEach(e => box.appendChild(terminKnopf(e, view)));
                box.addEventListener('dblclick', () => {
                    const q = quellen.find(x => x.id === (view.neuIn || quellen[0]?.id)) || quellen[0];
                    if (!q)
                        return;
                    const p = (n) => String(n).padStart(2, '0');
                    Store.addRow(q.id, { [q.dateKey ?? 'dt']: stand.getFullYear() + '-' + p(stand.getMonth() + 1) + '-' +
                            p(stand.getDate()) + 'T' + p(h) + ':00' });
                    App.zeichneSeite();
                });
                z.appendChild(box);
                g.appendChild(z);
            }
            if (!alle.length) {
                const leer = document.createElement('div');
                leer.className = 'db-leer';
                leer.textContent = 'Nichts an diesem Tag. Doppelklick auf eine Stunde legt einen Eintrag an.';
                g.appendChild(leer);
            }
            w.appendChild(g);
        }
        /* --- Fuss: Kalenderliste und Zeitraum-Spalte ------------------------ */
        const alleQuellen = kalenderQuellen(coll, view);
        const datumKeys2 = Object.keys(coll.schema).filter(k => ['date', 'created', 'edited'].includes(coll.schema[k].type));
        const fuss = document.createElement('div');
        fuss.className = 'cal-fuss';
        fuss.innerHTML =
            '<span>Doppelklick legt einen Eintrag an · Tasten T, W, M</span>' +
                `<button data-a="kalender">Kalender: <b>${alleQuellen.filter(q => q.an).length}</b></button>` +
                /* GERATEN WIRD GESAGT (E410). Eine stille Annahme ist schlimmer als
                   eine falsche: eine falsche kann der Nutzer berichtigen, eine stille
                   nicht einmal bemerken. */
                '<button data-a="ende">Zeitraum bis: <b>' +
                (() => {
                    if (view.endeKey && coll.schema[view.endeKey])
                        return esc(coll.schema[view.endeKey].name);
                    const geraten = kalEnde(coll, view, view.dateKey ||
                        Object.keys(coll.schema).find(k => coll.schema[k].type === 'date'));
                    return geraten ? esc(coll.schema[geraten].name) + ' (erkannt)' : 'ein Tag';
                })() + '</b></button>';
        fuss.addEventListener('click', e => {
            const r2 = (htmlVon(e) ?? document.body).getBoundingClientRect();
            if (elVon(e)?.closest('[data-a="ende"]')) {
                const m = UI.menu('<div class="grp">Enddatum für mehrtägige Einträge</div>' +
                    datumKeys2.map(k => `<button data-e="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
                    '<hr><button data-e="">nur ein Tag</button>', r2.left, r2.bottom + 4);
                m.addEventListener('click', ev => {
                    const b2 = elVon(ev)?.closest('button[data-e]');
                    if (!b2)
                        return;
                    Store.updateView(view.id, { endeKey: b2.dataset.e });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (elVon(e)?.closest('[data-a="kalender"]')) {
                kalenderListe(r2, coll, view);
                return;
            }
        });
        w.appendChild(fuss);
        /* Tastenkürzel T/D, W, M — nur solange dieser Kalender auf der Seite steht
           und niemand gerade in ein Feld tippt. */
        if (!w.dataset.tasten) {
            w.dataset.tasten = '1';
            const taste = (e) => {
                if (!document.body.contains(w)) {
                    document.removeEventListener('keydown', taste);
                    return;
                }
                if (e.ctrlKey || e.metaKey || e.altKey)
                    return;
                const z = e.target;
                if (z && (z.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(z.tagName)))
                    return;
                const k = e.key.toLowerCase();
                const neu = (k === 't' || k === 'd') ? 'tag' : k === 'w' ? 'woche' : k === 'm' ? 'monat' : null;
                if (!neu || neu === stufe)
                    return;
                e.preventDefault();
                Store.updateView(view.id, { kalStufe: neu });
                App.zeichneSeite();
            };
            document.addEventListener('keydown', taste);
        }
        return w;
    };
    /** Welche Datenbanken liegen im Kalender übereinander? */
    const kalenderListe = (r, coll, view) => {
        const zeichnen = () => {
            const liste = kalenderQuellen(coll, view);
            return '<div class="grp">Kalender in dieser Ansicht</div>' +
                liste.map((q, i) => `<button data-t="${i}"><span class="mi">${q.an ? '☑' : '☐'}</span>` +
                    `<span class="kal-punkt bg-${q.farbe}"></span>${esc(q.name)}` +
                    (q.eigen ? '<span class="ms">eigen</span>'
                        : `<span class="ms"><span data-hoch="${i}">↑</span> <span data-weg="${i}">✕</span></span>`) +
                    '</button>').join('') +
                '<hr><button data-a="dazu"><span class="mi">＋</span>Weitere Datenbank einblenden</button>' +
                `<button data-a="neuin"><span class="mi">✚</span>Neue Einträge landen in: ` +
                `${esc((liste.find(q => q.id === (view.neuIn || liste[0]?.id)) || liste[0])?.name)}</button>`;
        };
        const m = UI.menu(zeichnen(), r.left - 60, r.bottom + 4);
        m.addEventListener('click', e => {
            const hoch = elVon(e)?.closest('[data-hoch]');
            if (hoch) {
                const i = Number(hoch.dataset.hoch) - 1; /* 0 ist die eigene Datenbank */
                const x = view.extraDbs || [];
                if (i > 0) {
                    [x[i - 1], x[i]] = [x[i], x[i - 1]];
                    Store.updateView(view.id, { extraDbs: x });
                }
                m.innerHTML = zeichnen();
                App.zeichneSeite();
                return;
            }
            /* --- Probelauf ------------------------------------------------------
             * Hier stand ein „Testlauf", der die Automation WIRKLICH ausführte
             * und hinterher sagte, ob sich etwas geändert hat. Er hiess Test und
             * änderte echte Daten — wer ihn drückte, um zu sehen, ob seine Regel
             * stimmt, hatte sie danach angewendet. Bei „Eintrag in den Papierkorb"
             * war die Zeile weg, und rückgängig macht der Toast nichts.
             *
             * Jetzt zeigt er den PLAN: welche Aktion mit welchem Wert an der
             * Reihe wäre. Geschrieben wird nichts (`ctx.probe`).
             * ------------------------------------------------------------------ */
            const test = elVon(e)?.closest('[data-test]');
            if (test) {
                const a = coll.automationen[Number(test.dataset.test)];
                const zeile = Store.rowsOf(coll.id)[0];
                if (!zeile) {
                    UI.toast('Für einen Probelauf braucht es mindestens eine Zeile');
                    return;
                }
                const plan = [];
                const artT = a.wenn.art === 'wiederkehrend' ? 'wiederkehrend' : a.wenn.art;
                automationenLaufen(zeile, coll, artT, a.wenn.key, a.wenn.art === 'prop-wert' ? a.wenn.wert : undefined, { probe: plan });
                UI.menu('<div class="grp">Probelauf — ' + esc(a.name || 'Automation') + '</div>' +
                    '<div class="grp" style="font-weight:400; text-transform:none">' +
                    'Nichts davon ist passiert. So sähe der Lauf für „' +
                    esc(zeile.text || 'die erste Zeile') + '" aus.</div>' +
                    (plan.length
                        ? plan.map(s => '<button><span class="mi">→</span>' + esc(s.name) +
                            (s.ziel ? ': ' + esc(s.ziel) : '') +
                            (s.wert ? '<span class="ms">' + esc(s.wert) + '</span>' : '') +
                            '</button>').join('')
                        : '<button disabled>Keine Aktion käme zum Zug — prüfe Auslöser ' +
                            'und Bedingungen</button>'), test.getBoundingClientRect().left - 220, test.getBoundingClientRect().bottom + 4);
                return;
            }
            /* Laufverlauf ansehen */
            const verl = elVon(e)?.closest('[data-verlauf]');
            if (verl) {
                const a = coll.automationen[Number(verl.dataset.verlauf)];
                const liste = a.verlauf || [];
                UI.menu('<div class="grp">Laufverlauf — ' + esc(a.name || '') + '</div>' +
                    (liste.length
                        ? liste.slice(0, 30).map((l) => '<button><span class="mi">' + (l.fehler ? '⚠' : '✓') + '</span>' +
                            esc(Werkzeuge.zeitKurz(l.wann)) + ' — ' + esc(l.zeile || '(ohne Zeile)') +
                            (l.zweig === 'sonst' ? ' · sonst-Zweig' : '') +
                            '<span class="ms">' + esc((l.aktionen || []).join(', ')) + '</span></button>').join('')
                        : '<button disabled>Noch nie gelaufen</button>'), verl.getBoundingClientRect().left - 220, verl.getBoundingClientRect().bottom + 4);
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const x = view.extraDbs || [];
                x.splice(Number(weg.dataset.weg) - 1, 1);
                Store.updateView(view.id, { extraDbs: x });
                m.innerHTML = zeichnen();
                App.zeichneSeite();
                return;
            }
            const t = elVon(e)?.closest('button[data-t]');
            if (t) {
                const i = Number(t.dataset.t);
                if (i === 0) {
                    UI.toast('Die eigene Datenbank bleibt sichtbar');
                    return;
                }
                const x = view.extraDbs || [];
                x[i - 1].an = x[i - 1].an === false;
                Store.updateView(view.id, { extraDbs: x });
                m.innerHTML = zeichnen();
                App.zeichneSeite();
                return;
            }
            if (elVon(e)?.closest('[data-a="dazu"]')) {
                const drin = new Set([coll.id, ...(view.extraDbs || []).map((x) => x.collectionId)]);
                const frei = Object.values(Store.cache.collections).filter(c => !drin.has(c.id) && Object.values(c.schema).some(d => d.type === 'date'));
                if (!frei.length) {
                    UI.toast('Keine weitere Datenbank mit Datum gefunden');
                    return;
                }
                m.innerHTML = '<div class="grp">Welche Datenbank?</div>' +
                    frei.map(c => `<button data-c="${c.id}">${esc(c.name || 'Ohne Namen')}</button>`).join('');
                m.addEventListener('click', ev => {
                    const c = elVon(ev)?.closest('button[data-c]');
                    if (!c)
                        return;
                    const x = view.extraDbs || [];
                    x.push({ collectionId: c.dataset.c, an: true,
                        farbe: KAL_FARBEN[(x.length + 1) % KAL_FARBEN.length] });
                    Store.updateView(view.id, { extraDbs: x });
                    m.remove();
                    App.zeichneSeite();
                    UI.toast('Kalender eingeblendet');
                });
                return;
            }
            if (elVon(e)?.closest('[data-a="neuin"]')) {
                const liste = kalenderQuellen(coll, view);
                m.innerHTML = '<div class="grp">Neue Einträge landen in</div>' +
                    liste.map(q => `<button data-n="${q.id}">${esc(q.name)}</button>`).join('');
                m.addEventListener('click', ev => {
                    const n = elVon(ev)?.closest('button[data-n]');
                    if (!n)
                        return;
                    Store.updateView(view.id, { neuIn: n.dataset.n });
                    m.remove();
                    App.zeichneSeite();
                });
            }
        });
    };
    /* --- Dashboard -----------------------------------------------------------
     * Notions elfter Ansichtstyp. Kein neues Datenmodell, sondern eine
     * Zusammenfassung: oben die Kennzahlen, darunter die Verteilung nach
     * einer Spalte und die letzten Einträge. Was gezeigt wird, stellt man
     * über „Kacheln" ein.
     * ------------------------------------------------------------------------*/
    /* ==========================================================================
     * DAS DASHBOARD (L17)
     * --------------------------------------------------------------------------
     * Bis E185 zeigte es EINE Datenbank: die eigene. Vier Dinge fehlten, und
     * L17 nannte sie beim Namen — mehrere Datenquellen, KPI-Karten, Layout,
     * Diagrammquellen. Alle vier hängen an derselben Stelle, nämlich daran,
     * was in einer Kachel stehen darf:
     *
     *     { art: 'anzahl' }                          wie bisher
     *     { art: 'summe',       key }                wie bisher
     *     { art: 'verteilung',  key }                wie bisher
     *
     *     { art: 'kpi',         key, ziel, richtung } NEU — Wert gegen Ziel
     *     { art: 'verteilung',  key, wertKey }        NEU — Summe statt Anzahl
     *     { …,  quelle: <collectionId> }              NEU — aus einer FREMDEN
     *                                                 Datenbank
     *
     * `quelle` ist der Schlüssel zu allem: eine Kachel ohne `quelle` meint die
     * eigene Datenbank und die GEFILTERTEN Zeilen der Ansicht; eine Kachel mit
     * `quelle` holt sich die Zeilen der genannten Datenbank frisch.
     *
     * WARUM DIE FREMDEN ZEILEN UNGEFILTERT KOMMEN. Ein Filter gehört zu einer
     * Ansicht, und die fremde Datenbank hat ihre eigenen. Welche davon gälte?
     * Eine Kachel „Summe · Betrag aus Rechnungen" muss den Betrag ALLER
     * Rechnungen nennen, sonst nennt sie eine Zahl, deren Bedeutung von einer
     * Einstellung anderswo abhängt — und das ist die Sorte Zahl, der man nicht
     * trauen kann. Steht es unter der Karte, weiss man es.
     * ========================================================================*/
    /** Die Zeilen für eine Kachel: die eigenen gefilterten oder alle fremden. */
    const dashZeilen = (kachel, coll, rows) => {
        if (!kachel || !kachel.quelle || kachel.quelle === coll.id)
            return rows;
        const fremd = Store.getCollection(kachel.quelle);
        return fremd ? Store.rowsOf(fremd.id) : [];
    };
    /** Die Datenbank für eine Kachel — für Schema und Beschriftung. */
    const dashColl = (kachel, coll) => {
        if (!kachel || !kachel.quelle || kachel.quelle === coll.id)
            return coll;
        return Store.getCollection(kachel.quelle) || coll;
    };
    /** Steht der Name der fremden Datenbank unter der Karte? Nur wenn fremd. */
    const dashHerkunft = (kachel, coll) => {
        const c = dashColl(kachel, coll);
        return c && c.id !== coll.id ? (c.name || 'Andere Datenbank') : '';
    };
    const alsDashboard = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'dash';
        /* Die Spaltenlisten je Datenbank — auch für die fremden, weil das Menü
           sie anbieten muss. */
        const zahlKeysVon = (c) => Object.keys(c.schema)
            .filter(k => ['number', 'formula', 'rollup', 'duration'].includes(c.schema[k].type));
        const gruppKeysVon = (c) => Object.keys(c.schema)
            .filter(k => ['select', 'status', 'multi', 'checkbox', 'person'].includes(c.schema[k].type));
        const zahlKeys = zahlKeysVon(coll);
        const gruppKeys = gruppKeysVon(coll);
        const datumKeys = Object.keys(coll.schema)
            .filter(k => ['date', 'created', 'edited'].includes(coll.schema[k].type));
        const kacheln = view.kacheln || [
            { art: 'anzahl' },
            ...(zahlKeys.slice(0, 2).map(k => ({ art: 'summe', key: k }))),
            ...(gruppKeys.slice(0, 1).map(k => ({ art: 'verteilung', key: k })))
        ];
        /* Eine Kachel ändern oder wegnehmen. Die Liste wird IMMER ganz neu
           geschrieben — `view.kacheln` kann `undefined` sein (die Vorgabe oben),
           und dann gäbe es nichts, worin man an Stelle i etwas ändern könnte. */
        const kachelnSchreiben = (liste) => {
            Store.updateView(view.id, { kacheln: liste });
            App.zeichneSeite();
        };
        const kachelWeg = (i) => kachelnSchreiben(kacheln.filter((_, k) => k !== i));
        const kachelSchieben = (i, um) => {
            const ziel = i + um;
            if (ziel < 0 || ziel >= kacheln.length)
                return;
            const liste = kacheln.slice();
            const [x] = liste.splice(i, 1);
            liste.splice(ziel, 0, x);
            kachelnSchreiben(liste);
        };
        /* Die Griffe an einer Kachel — links, rechts, weg. Sie stehen an JEDER
           Kachel, nicht nur an den neuen: bis E185 gab es „Alle Kacheln
           entfernen" und sonst nichts, und wer eine falsche hinzugefügt hatte,
           musste alle wegwerfen. */
        const griffe = (d, i) => {
            /* Was Griffe trägt, IST eine Kachel. „Zuletzt geändert" und „Als
               Nächstes" tragen dieselbe Klasse `dash-block`, sind aber feste
               Teile des Dashboards und keine Kacheln — ohne diese Marke kann
               weder die CSS noch ein Prüflauf die beiden auseinanderhalten. */
            d.classList.add('dash-kachel');
            const g = document.createElement('div');
            g.className = 'dk-griffe';
            g.innerHTML =
                `<button data-g="hoch" title="Nach vorn" aria-label="Kachel nach vorn">‹</button>` +
                    `<button data-g="runter" title="Nach hinten" aria-label="Kachel nach hinten">›</button>` +
                    `<button data-g="weg" title="Entfernen" aria-label="Kachel entfernen">✕</button>`;
            g.addEventListener('click', e => {
                const b = elVon(e)?.closest('[data-g]');
                if (!b)
                    return;
                e.stopPropagation();
                if (b.dataset.g === 'weg')
                    kachelWeg(i);
                else
                    kachelSchieben(i, b.dataset.g === 'hoch' ? -1 : 1);
            });
            d.appendChild(g);
        };
        /* --- Kennzahlen ------------------------------------------------------ */
        const oben = document.createElement('div');
        oben.className = 'dash-zahlen';
        kacheln.forEach((k, i) => {
            if (k.art === 'verteilung')
                return;
            const kc = dashColl(k, coll);
            const kr = dashZeilen(k, coll, rows);
            const woher = dashHerkunft(k, coll);
            const d = document.createElement('div');
            d.className = 'dash-karte';
            if (k.art === 'anzahl') {
                d.innerHTML = `<span class="dz-wert">${kr.length}</span>` +
                    `<span class="dz-name">Einträge</span>`;
            }
            else if (k.art === 'kpi') {
                /* DIE KPI-KARTE. Eine Zahl allein ist keine Kennzahl — „48 000" sagt
                   nichts, „48 000 von 60 000" sagt alles. Dazu die Richtung: bei
                   Umsatz ist mehr besser, bei Fehlern weniger. Ohne sie müsste die
                   Farbe raten, und eine ratende Farbe ist schlimmer als keine. */
                const name = kc.schema[k.key]?.name || '?';
                const roh = zusammenfassen(k.summe === false ? 'Durchschnitt' : 'Summe', kr.map((r) => wert(r, k.key, kc)), kr.length);
                const zahl = Number(roh) || 0;
                const ziel = Number(k.ziel);
                const runter = k.richtung === 'runter';
                const hat = isFinite(ziel) && ziel !== 0;
                const anteil = hat ? zahl / ziel : 0;
                /* „Geschafft" heisst je nach Richtung etwas anderes. */
                const gut = hat && (runter ? zahl <= ziel : zahl >= ziel);
                const proz = hat ? Math.round(anteil * 100) : 0;
                /* Der Balken wird bei 100 % gekappt — sonst läuft er aus der Karte,
                   und 340 % sähen aus wie 100 %. Die ZAHL daneben sagt die Wahrheit. */
                const breit = Math.max(0, Math.min(100, runter ? (hat ? 100 - proz : 0) : proz));
                d.className = 'dash-karte dash-kpi ' + (hat ? (gut ? 'kpi-gut' : 'kpi-offen') : '');
                d.innerHTML =
                    `<span class="dz-wert">${esc(Formula.anzeige(zahl))}</span>` +
                        (hat ? `<span class="dz-ziel">${gut ? '✓' : (runter ? '▾' : '▴')} ` +
                            `${proz} % von ${esc(Formula.anzeige(ziel))}</span>` +
                            `<span class="dz-balken"><i style="width:${breit}%"></i></span>`
                            : `<span class="dz-ziel">Ohne Ziel</span>`) +
                        `<span class="dz-name">${esc(name)}${woher ? ' · ' + esc(woher) : ''}</span>`;
            }
            else {
                const name = kc.schema[k.key]?.name || '?';
                const art = k.art === 'summe' ? 'Summe' : k.art === 'schnitt' ? 'Durchschnitt' : 'Maximum';
                const wert2 = zusammenfassen(art, kr.map((r) => wert(r, k.key, kc)), kr.length);
                /* „Summe · Summe · Offene Rechnungen" stotterte: die Rechenart heisst
                   wie die Spalte. Heisst sie gleich, steht sie einmal da. */
                const bezeichnung = art.toLowerCase() === String(name).toLowerCase()
                    ? esc(name) : esc(art) + ' · ' + esc(name);
                d.innerHTML = `<span class="dz-wert">${esc(Formula.anzeige(wert2))}</span>` +
                    `<span class="dz-name">${bezeichnung}` +
                    `${woher ? ' · ' + esc(woher) : ''}</span>`;
            }
            griffe(d, i);
            oben.appendChild(d);
        });
        if (oben.children.length)
            w.appendChild(oben);
        /* --- Verteilung ------------------------------------------------------ */
        kacheln.forEach((k, i) => {
            if (k.art !== 'verteilung' || !k.key)
                return;
            const kc = dashColl(k, coll);
            const kr = dashZeilen(k, coll, rows);
            const def = kc.schema[k.key];
            if (!def)
                return;
            /* DIE DIAGRAMMQUELLE (L17). Bis E185 zählte die Verteilung immer nur
               ZEILEN: „12 Aufträge in Zürich". Was man wissen will, ist meistens
               „180 000 Umsatz in Zürich" — dieselbe Gruppierung, ein anderer Wert.
               `wertKey` nennt die Zahlenspalte; ohne ihn wird gezählt wie bisher. */
            const wertDef = k.wertKey ? kc.schema[k.wertKey] : null;
            const beitrag = (r) => wertDef ? (Formula.zahl(wert(r, k.wertKey, kc)) || 0) : 1;
            const zaehler = new Map();
            const dazu = (name, um) => zaehler.set(name, (zaehler.get(name) || 0) + um);
            kr.forEach((r) => {
                const v = wert(r, k.key, kc);
                const um = beitrag(r);
                /* Bei einer Mehrfachauswahl zählt die Zeile in JEDER ihrer Gruppen.
                   Die Summe der Balken ist dann grösser als das Ganze — das ist bei
                   Mehrfachauswahl richtig so und steht als Fussnote darunter. */
                if (Array.isArray(v))
                    v.forEach(x => dazu(String(x), um));
                else
                    dazu(def.type === 'checkbox' ? (v ? 'Ja' : 'Nein')
                        : (Formula.anzeige(v) || '(leer)'), um);
            });
            const paare = [...zaehler.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
            const hoechst = Math.max(1, ...paare.map(p2 => Math.abs(p2[1])));
            const box = document.createElement('div');
            box.className = 'dash-block';
            const woher = dashHerkunft(k, coll);
            const titel = (wertDef ? esc(wertDef.name) + ' nach ' : 'Verteilung nach ') + esc(def.name);
            box.innerHTML = `<h4>${titel}${woher ? ' · ' + esc(woher) : ''}</h4>` +
                (paare.length ? paare.map(([n, anz]) => {
                    const opt = (def.options || []).find((o) => o.name === n);
                    return '<div class="dash-balken">' +
                        `<span class="db-name">${esc(n)}</span>` +
                        `<span class="db-strich"><i class="bg-${opt ? opt.color : 'blue'}" ` +
                        `style="width:${Math.round(Math.abs(anz) / hoechst * 100)}%"></i></span>` +
                        `<span class="db-zahl">${esc(Formula.anzeige(wertDef ? Math.round(anz * 100) / 100 : anz))}</span></div>`;
                }).join('') : '<div class="db-leer">Noch keine Werte.</div>');
            griffe(box, i);
            w.appendChild(box);
        });
        /* --- Zuletzt geändert ------------------------------------------------ */
        const letzte = document.createElement('div');
        letzte.className = 'dash-block';
        const sortiertNach = rows.slice().sort((a, b) => new Date(b.edited || b.created).getTime() - new Date(a.edited || a.created).getTime()).slice(0, 8);
        letzte.innerHTML = '<h4>Zuletzt geändert</h4>' +
            (sortiertNach.length
                ? sortiertNach.map((r) => `<button class="dash-zeile" data-rid="${r.id}">` +
                    `<span>${esc(r.text || 'Ohne Titel')}</span>` +
                    `<em>${esc(Einstellungen.datum(new Date(r.edited || r.created), true))}</em></button>`).join('')
                : '<div class="db-leer">Noch keine Einträge.</div>');
        letzte.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-rid]');
            if (b)
                zeilePeek(Store.getBlock(b.dataset.rid), coll);
        });
        w.appendChild(letzte);
        /* --- Nächste Termine ------------------------------------------------- */
        if (datumKeys.length) {
            const dk = datumKeys[0];
            const heute2 = new Date();
            heute2.setHours(0, 0, 0, 0);
            const kommend = rows
                .map((r) => ({ r, d: new Date(wert(r, dk, coll) || 0) }))
                .filter((x) => !isNaN(x.d) && x.d >= heute2)
                .sort((a, b) => a.d - b.d).slice(0, 6);
            if (kommend.length) {
                const t = document.createElement('div');
                t.className = 'dash-block';
                t.innerHTML = `<h4>Als Nächstes · ${esc(coll.schema[dk ?? '']?.name)}</h4>` +
                    kommend.map((x) => `<button class="dash-zeile" data-rid="${x.r.id}">` +
                        `<span>${esc(x.r.text || 'Ohne Titel')}</span>` +
                        `<em>${x.d.toLocaleDateString('de-DE')}</em></button>`).join('');
                t.addEventListener('click', e => {
                    const b = elVon(e)?.closest('[data-rid]');
                    if (b)
                        zeilePeek(Store.getBlock(b.dataset.rid), coll);
                });
                w.appendChild(t);
            }
        }
        /* --- Kacheln einstellen ---------------------------------------------- */
        const fuss = document.createElement('div');
        fuss.className = 'cal-fuss';
        /* Andere Datenbanken derselben Ablage — die Quellen, die eine Kachel
           ausser der eigenen haben kann. Nach Namen sortiert, damit die Liste
           nicht bei jedem Öffnen anders aussieht. */
        const fremde = Object.values(Store.cache.collections)
            .filter((c) => c && c.id !== coll.id)
            .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        const anzahlWoher = kacheln.filter((k) => dashHerkunft(k, coll)).length;
        fuss.innerHTML =
            `<span>Ein Überblick${anzahlWoher ? ' — ' + anzahlWoher + ' Kachel' +
                (anzahlWoher === 1 ? '' : 'n') + ' aus anderen Datenbanken' :
                ' über diese Datenbank'}.</span>` +
                '<button data-a="kacheln">Kachel hinzufügen</button>';
        /* Das Menü für EINE Datenbank — die eigene oder eine fremde. `q` ist die
           Kennung, die in die Kachel wandert; leer heisst „die eigene". */
        const menueFuer = (c, q) => {
            const zk = zahlKeysVon(c), gk = gruppKeysVon(c);
            const p = q ? '@' + q : '';
            /* DER NAME DER FREMDEN DATENBANK GEHÖRT AN JEDEN EINTRAG, nicht nur in
               die Gruppenüberschrift. Der Filter von `menuMitSuche` liest den
               KNOPFTEXT — steht der Name nur oben, findet „Rechnung" null Einträge,
               und das Suchfeld ist eine Zusage, die es nicht hält. Gemessen: 0 von
               23 (E186).
      
               Er macht die Zeile ausserdem für sich lesbar. Wer weit gerollt hat,
               sieht die Überschrift nicht mehr und weiss sonst nicht, aus welcher
               Datenbank die Zeile unter dem Zeiger stammt. */
            const woher = q ? ' · ' + esc(c.name || 'Ohne Namen') : '';
            return '<button data-neu="anzahl' + p + '">Anzahl der Einträge' + woher + '</button>' +
                zk.map(k => `<button data-neu="summe:${k}${p}">Summe · ${esc(c.schema[k].name)}${woher}</button>` +
                    `<button data-neu="schnitt:${k}${p}">Durchschnitt · ${esc(c.schema[k].name)}${woher}</button>` +
                    `<button data-neu="kpi:${k}${p}">Kennzahl mit Ziel · ${esc(c.schema[k].name)}${woher}</button>`).join('') +
                gk.map(k => `<button data-neu="verteilung:${k}${p}">Verteilung nach ${esc(c.schema[k].name)}${woher}</button>` +
                    zk.map(z => `<button data-neu="verteilung:${k}:${z}${p}">` +
                        `${esc(c.schema[z].name)} nach ${esc(c.schema[k].name)}${woher}</button>`).join('')).join('');
        };
        fuss.addEventListener('click', e => {
            if (!elVon(e)?.closest('[data-a="kacheln"]'))
                return;
            const r = (htmlVon(e) ?? document.body).getBoundingClientRect();
            /* MIT SUCHE, NICHT OHNE (E186). Das Menü wächst mit dem Arbeitsbereich:
               je Datenbank eine Anzahl-Zeile, drei je Zahlenspalte und eine je
               Paar aus Gruppen- und Zahlenspalte. Eine Datenbank mit drei Zahlen-
               und zwei Gruppenspalten macht 18 Einträge; bei fünfzig Datenbanken
               sind es neunhundert. Durch neunhundert Knöpfe rollt niemand.
      
               `menuMitSuche` gibt es dafür seit langem und steht in dieser Datei
               schon dreimal. Ein zweiter Weg dafür wäre L34 in klein. */
            const m = UI.menuMitSuche(`<div class="grp">Aus dieser Datenbank</div>` + menueFuer(coll, '') +
                (fremde.length
                    ? fremde.map((c) => `<div class="grp">Aus „${esc(c.name || 'Ohne Namen')}"</div>` + menueFuer(c, c.id)).join('')
                    : '') +
                '<hr><button data-neu="leer">Alle Kacheln entfernen</button>', r.left - 160, r.top - 20, { platzhalter: 'Kachel oder Datenbank suchen …' });
            m.addEventListener('click', ev => {
                const b = elVon(ev)?.closest('[data-neu]');
                if (!b)
                    return;
                /* `art:key:wertKey@quelle` — die Quelle steht hinten, weil eine
                   Kennung Doppelpunkte enthalten könnte, ein `@` aber nicht. */
                const [vorn, quelle] = (b.dataset.neu ?? '').split('@');
                const [art, key, wertKey] = (vorn ?? '').split(':');
                if (art === 'leer') {
                    kachelnSchreiben([]);
                    m.remove();
                    return;
                }
                const neue = { art };
                if (key)
                    neue.key = key;
                if (wertKey)
                    neue.wertKey = wertKey;
                if (quelle)
                    neue.quelle = quelle;
                m.remove();
                /* Eine Kennzahl ohne Ziel ist keine Kennzahl — also gleich fragen.
                   Wer abbricht, bekommt trotzdem die Kachel, nur ohne Ziel: sie sagt
                   dann „Ohne Ziel" und lässt sich später nachrüsten. */
                if (art === 'kpi') {
                    void (async () => {
                        const c2 = quelle ? (Store.getCollection(quelle) || coll) : coll;
                        const antwort = await UI.frage('Welches Ziel soll „' + (c2.schema[key ?? '']?.name || '?') + '" erreichen?', '');
                        const zahl = Formula.zahl(antwort);
                        if (zahl || zahl === 0) {
                            neue.ziel = zahl;
                            /* Ein Ziel, das man UNTERschreiten will — Fehler, Kosten,
                               Rückstände. Ohne diese Frage müsste die Farbe raten. */
                            neue.richtung = (await Dialog.wahl({
                                titel: 'In welche Richtung ist gut?',
                                text: 'Bei Umsatz ist mehr besser, bei Fehlern weniger. ' +
                                    'Danach richtet sich, wann die Karte grün wird.',
                                knoepfe: [
                                    { id: 'hoch', text: 'Ziel erreichen',
                                        hinweis: 'Grün, sobald der Wert das Ziel erreicht' },
                                    { id: 'runter', text: 'Obergrenze halten',
                                        hinweis: 'Grün, solange der Wert darunter bleibt' }
                                ]
                            })) === 'runter' ? 'runter' : 'hoch';
                        }
                        kachelnSchreiben([...kacheln, neue]);
                    })();
                    return;
                }
                kachelnSchreiben([...kacheln, neue]);
            });
        });
        w.appendChild(fuss);
        return w;
    };
    /* --- Zeitstrahl ---------------------------------------------------------
     * Notions Timeline: jede Zeile ein Balken auf einer Zeitachse.
     * Redion kann dazu, was Notion nicht kann:
     *   · fünf Zoomstufen (Tag bis Jahr) statt der drei von Notion,
     *   · Abhängigkeitspfeile zwischen den Balken, wenn es eine Verknüpfung
     *     auf dieselbe Datenbank gibt („hängt ab von"),
     *   · Balken mit der Maus schieben und am rechten Rand länger ziehen,
     *   · eine feste Namensspalte links wie in einem Projektplan.
     * ----------------------------------------------------------------------*/
    const ZS_STUFEN = [
        ['tag', 'Tag', 42],
        ['woche', 'Woche', 15],
        ['monat', 'Monat', 5],
        ['quartal', 'Quartal', 2],
        ['jahr', 'Jahr', 0.8]
    ];
    const ZS_ZEILE = 32; /* Höhe einer Zeile in Pixeln */
    const ZS_KOPF = 34; /* Höhe der Zeitleiste oben   */
    /** Tagesbeginn als eigenes Datum — ohne die Uhrzeit der Vorlage. */
    const zsTag = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    /** Schreibt ein verschobenes Datum zurück und behält die Uhrzeit bei. */
    const zsSchreibe = (row, key, neu, alt) => {
        const roh = String(alt || '');
        const zeit = roh.length > 10 ? roh.slice(10, 16) : ''; /* "T08:30" */
        const p = (n) => String(n).padStart(2, '0');
        Store.setProp(row.id, key, neu.getFullYear() + '-' + p(neu.getMonth() + 1) + '-' + p(neu.getDate()) + zeit);
    };
    const alsZeitstrahl = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'zeitstrahl';
        const datumKeys = Object.keys(coll.schema).filter(k => ['date', 'created', 'edited'].includes(coll.schema[k].type));
        const startKey = view.startKey && coll.schema[view.startKey] ? view.startKey : datumKeys[0];
        const endeKey = view.endeKey && coll.schema[view.endeKey] ? view.endeKey : null;
        if (!startKey) {
            w.innerHTML = '<div class="db-leer">Für den Zeitstrahl braucht es eine Datums-Eigenschaft.</div>';
            return w;
        }
        /* Verknüpfungen auf dieselbe Datenbank taugen als Abhängigkeit. */
        const abhKeys = Object.keys(coll.schema).filter(k => coll.schema[k].type === 'relation' && coll.schema[k].ziel === coll.id);
        const abhKey = view.abhKey === '' ? null
            : (view.abhKey && coll.schema[view.abhKey] ? view.abhKey : abhKeys[0] || null);
        const eintraege = rows.map((r) => {
            const rohA = wert(r, startKey, coll);
            const a = new Date(rohA);
            const rohB = endeKey ? wert(r, endeKey, coll) : rohA;
            const b = new Date(rohB);
            if (isNaN(a.getTime()))
                return null;
            const bis = (isNaN(b.getTime()) || b < a) ? new Date(a) : b;
            return { row: r, von: zsTag(a), bis: zsTag(bis), rohA, rohB };
        }).filter(Boolean);
        if (!eintraege.length) {
            w.innerHTML = '<div class="db-leer">Noch keine Einträge mit Datum.</div>';
            return w;
        }
        const stufeId = view.zoom && ZS_STUFEN.some(s => s[0] === view.zoom) ? view.zoom : 'monat';
        const stufe = ZS_STUFEN.find(s => s[0] === stufeId) ?? ZS_STUFEN[0];
        /* Pixel je Tag. `ZS_STUFEN` steht als Liste da; die dritte Stelle ist die
           Breite. Ohne die Umwandlung liest TypeScript daraus `string | number`. */
        const px = Number(stufe?.[2] ?? 8);
        const minD = zsTag(new Date(Math.min(...eintraege.map((e) => e.von))));
        const maxD = zsTag(new Date(Math.max(...eintraege.map((e) => e.bis))));
        minD.setDate(minD.getDate() - (px > 8 ? 2 : 10));
        maxD.setDate(maxD.getDate() + (px > 8 ? 3 : 14));
        const tage = Math.max(1, Math.round((maxD.getTime() - minD.getTime()) / 86400000));
        const breiteG = tage * px;
        const xVon = (d) => Math.round((zsTag(d).getTime() - minD.getTime()) / 86400000 * px);
        eintraege.sort((a, b) => a.von - b.von || String(a.row.text || '').localeCompare(String(b.row.text || ''), 'de'));
        const platz = {};
        eintraege.forEach((e, i) => { platz[e.row.id] = i; });
        /* ---- Kopfzeile: je nach Zoomstufe Tage, Wochen, Monate oder Jahre ---- */
        const marken = [];
        const lauf = new Date(minD);
        if (stufeId === 'tag') {
            while (lauf <= maxD) {
                marken.push({ x: xVon(lauf), text: lauf.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
                    wochenende: lauf.getDay() === 0 || lauf.getDay() === 6 });
                lauf.setDate(lauf.getDate() + 1);
            }
        }
        else if (stufeId === 'woche') {
            while (lauf.getDay() !== 1)
                lauf.setDate(lauf.getDate() - 1);
            while (lauf <= maxD) {
                marken.push({ x: xVon(lauf), text: 'KW ' + kalenderWoche(lauf) });
                lauf.setDate(lauf.getDate() + 7);
            }
        }
        else if (stufeId === 'monat' || stufeId === 'quartal') {
            lauf.setDate(1);
            while (lauf <= maxD) {
                marken.push({ x: xVon(lauf),
                    text: stufeId === 'monat'
                        ? lauf.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
                        : 'Q' + (Math.floor(lauf.getMonth() / 3) + 1) + ' ' + lauf.getFullYear() });
                lauf.setMonth(lauf.getMonth() + (stufeId === 'monat' ? 1 : 3));
            }
        }
        else {
            lauf.setMonth(0, 1);
            while (lauf <= maxD) {
                marken.push({ x: xVon(lauf), text: String(lauf.getFullYear()) });
                lauf.setFullYear(lauf.getFullYear() + 1);
            }
        }
        /* ---- Gerüst ---------------------------------------------------------- */
        const leiste = document.createElement('div');
        leiste.className = 'zs-leiste';
        leiste.innerHTML =
            '<div class="zs-zoom">' + ZS_STUFEN.map(([id, n]) => `<button data-zoom="${id}"${id === stufeId ? ' class="an"' : ''}>${n}</button>`).join('') + '</div>' +
                `<span class="zs-info">${eintraege.length} Einträge · ${tage} Tage` +
                (abhKey ? ' · Pfeile aus „' + esc(coll.schema[abhKey].name) + '"' : '') + '</span>' +
                '<button data-a="heute">Heute</button>' +
                '<button data-a="felder">Felder</button>';
        w.appendChild(leiste);
        const raster = document.createElement('div');
        raster.className = 'zs-raster';
        const namen = document.createElement('div');
        namen.className = 'zs-namen';
        namen.innerHTML = `<div class="zs-namkopf" style="height:${ZS_KOPF}px"></div>` +
            eintraege.map((e) => `<div class="zs-name" style="height:${ZS_ZEILE}px" data-rid="${e.row.id}" ` +
                `title="${esc(e.row.text || 'Ohne Titel')}">${esc(e.row.text || 'Ohne Titel')}</div>`).join('');
        raster.appendChild(namen);
        const scroll = document.createElement('div');
        scroll.className = 'zs-scroll';
        const flaeche = document.createElement('div');
        flaeche.className = 'zs-flaeche';
        flaeche.style.width = breiteG + 'px';
        flaeche.style.height = (ZS_KOPF + eintraege.length * ZS_ZEILE + 8) + 'px';
        /* Kopf + Gitterlinien */
        let html = `<div class="zs-kopf" style="height:${ZS_KOPF}px">` +
            marken.map(m => `<span style="left:${m.x}px">${esc(m.text)}</span>`).join('') +
            marken.map(m => `<i class="zs-gitter${m.wochenende ? ' we' : ''}" style="left:${m.x}px"></i>`).join('') +
            '</div>';
        /* Heute-Linie */
        const jetzt = zsTag(new Date());
        if (jetzt >= minD && jetzt <= maxD)
            html += `<div class="zs-heute" style="left:${xVon(jetzt)}px; top:${ZS_KOPF - 6}px"></div>`;
        /* Balken */
        const balkenBreite = (e) => Math.max(px < 4 ? 6 : 22, ((e.bis - e.von) / 86400000 + 1) * px);
        eintraege.forEach((e, i) => {
            const links = xVon(e.von);
            const breite = balkenBreite(e);
            const farbe = FARBEN[i % FARBEN.length];
            html += `<div class="zs-balken bg-${farbe}" data-rid="${e.row.id}" ` +
                `style="left:${links}px; width:${breite}px; top:${ZS_KOPF + i * ZS_ZEILE + 3}px" ` +
                `title="${esc(e.row.text || 'Ohne Titel')} — ${e.von.toLocaleDateString('de-DE')}` +
                (endeKey ? ' bis ' + e.bis.toLocaleDateString('de-DE') : '') + '">' +
                `<span class="zs-txt">${esc(e.row.text || 'Ohne Titel')}</span>` +
                (endeKey ? '<i class="zs-griff"></i>' : '') + '</div>';
        });
        flaeche.innerHTML = html;
        /* ---- Abhängigkeitspfeile -------------------------------------------- */
        if (abhKey) {
            const linien = [];
            eintraege.forEach((e) => {
                const vor = e.row.props && e.row.props[abhKey];
                (Array.isArray(vor) ? vor : (vor ? [vor] : [])).forEach(id => {
                    const q = eintraege.find((x) => x.row.id === id);
                    if (!q)
                        return;
                    const y1 = ZS_KOPF + (platz[q.row.id] ?? 0) * ZS_ZEILE + ZS_ZEILE / 2;
                    const y2 = ZS_KOPF + (platz[e.row.id] ?? 0) * ZS_ZEILE + ZS_ZEILE / 2;
                    const x1 = xVon(q.von) + balkenBreite(q);
                    const x2 = xVon(e.von);
                    const mx = Math.max(x1 + 9, x2 - 9);
                    linien.push(`<path d="M ${x1} ${y1} H ${mx} V ${y2} H ${x2 - 5}" ` +
                        'fill="none" stroke="var(--text-faint)" stroke-width="1.4" marker-end="url(#zs-spitze)"/>');
                });
            });
            if (linien.length) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('class', 'zs-pfeile');
                svg.setAttribute('width', String(breiteG));
                svg.setAttribute('height', String(ZS_KOPF + eintraege.length * ZS_ZEILE + 8));
                svg.innerHTML =
                    '<defs><marker id="zs-spitze" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" ' +
                        'markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="var(--text-faint)"/></marker></defs>' +
                        linien.join('');
                flaeche.appendChild(svg);
            }
        }
        scroll.appendChild(flaeche);
        raster.appendChild(scroll);
        w.appendChild(raster);
        /* Erst nach dem Einhängen scrollen: zum heutigen Tag */
        setTimeout(() => {
            if (jetzt >= minD && jetzt <= maxD)
                scroll.scrollLeft = Math.max(0, xVon(jetzt) - scroll.clientWidth / 3);
        }, 0);
        /* ---- Schieben und Verlängern ---------------------------------------- */
        let zieh = null;
        flaeche.addEventListener('mousedown', ev => {
            const b = elVon(ev)?.closest('.zs-balken');
            if (!b || ev.button !== 0)
                return;
            const e = eintraege.find((x) => x.row.id === b.dataset.rid);
            if (!e)
                return;
            zieh = { b, e, x0: ev.clientX, links0: parseFloat(b.style.left), breit0: parseFloat(b.style.width),
                art: htmlVon(ev)?.classList.contains('zs-griff') ? 'ende' : 'schieben', bewegt: false };
            window.addEventListener('mousemove', beiBewegung);
            window.addEventListener('mouseup', beiLoslassen);
            ev.preventDefault();
        });
        const beiBewegung = (ev) => {
            if (!zieh)
                return;
            const d = ev.clientX - zieh.x0;
            if (Math.abs(d) > 3)
                zieh.bewegt = true;
            if (zieh.art === 'ende')
                zieh.b.style.width = Math.max(px, zieh.breit0 + d) + 'px';
            else
                zieh.b.style.left = (zieh.links0 + d) + 'px';
        };
        const beiLoslassen = () => {
            if (!zieh)
                return;
            const z = zieh;
            zieh = null;
            window.removeEventListener('mousemove', beiBewegung);
            window.removeEventListener('mouseup', beiLoslassen);
            if (!z.bewegt) {
                zeilePeek(z.e.row, coll);
                return;
            }
            const tageVerschoben = Math.round((parseFloat(z.b.style.left) - z.links0) / px);
            const tageLaenger = Math.round((parseFloat(z.b.style.width) - z.breit0) / px);
            if (z.art === 'schieben' && tageVerschoben) {
                const nv = new Date(z.e.von);
                nv.setDate(nv.getDate() + tageVerschoben);
                zsSchreibe(z.e.row, startKey, nv, z.e.rohA);
                if (endeKey) {
                    const nb = new Date(z.e.bis);
                    nb.setDate(nb.getDate() + tageVerschoben);
                    zsSchreibe(z.e.row, endeKey, nb, z.e.rohB);
                }
            }
            else if (z.art === 'ende' && tageLaenger && endeKey) {
                const nb = new Date(z.e.bis);
                nb.setDate(nb.getDate() + tageLaenger);
                if (nb < z.e.von)
                    nb.setTime(z.e.von.getTime());
                zsSchreibe(z.e.row, endeKey, nb, z.e.rohB);
            }
            App.zeichneSeite();
        };
        namen.addEventListener('click', ev => {
            const n = elVon(ev)?.closest('[data-rid]');
            if (!n)
                return;
            const e = eintraege.find((x) => x.row.id === n.dataset.rid);
            if (e)
                view.oeffnenAls === 'voll' ? App.oeffne(e.row.id) : zeilePeek(e.row, coll);
        });
        /* ---- Leiste ---------------------------------------------------------- */
        leiste.addEventListener('click', ev => {
            const z = elVon(ev)?.closest('[data-zoom]');
            if (z) {
                Store.updateView(view.id, { zoom: z.dataset.zoom });
                App.zeichneSeite();
                return;
            }
            if (elVon(ev)?.closest('[data-a="heute"]')) {
                scroll.scrollLeft = Math.max(0, xVon(new Date()) - scroll.clientWidth / 3);
                return;
            }
            if (!elVon(ev)?.closest('[data-a="felder"]'))
                return;
            const r = (htmlVon(ev) ?? document.body).getBoundingClientRect();
            const m = UI.menu('<div class="grp">Startdatum</div>' +
                datumKeys.map(k => `<button data-s="${k}">${k === startKey ? '✓ ' : ''}${esc(coll.schema[k].name)}</button>`).join('') +
                '<div class="grp">Enddatum</div>' +
                datumKeys.map(k => `<button data-e="${k}">${k === endeKey ? '✓ ' : ''}${esc(coll.schema[k].name)}</button>`).join('') +
                '<button data-e="">— kein Enddatum</button>' +
                (abhKeys.length
                    ? '<div class="grp">Abhängigkeit (Pfeile)</div>' +
                        abhKeys.map(k => `<button data-ab="${k}">${k === abhKey ? '✓ ' : ''}${esc(coll.schema[k].name)}</button>`).join('') +
                        '<button data-ab="">— keine Pfeile</button>'
                    : '<div class="grp">Abhängigkeit</div><div class="mhinweis">Dafür braucht es eine ' +
                        'Verknüpfung dieser Datenbank auf sich selbst.</div>'), r.left, r.bottom + 4);
            m.addEventListener('click', ev2 => {
                const s = elVon(ev2)?.closest('button[data-s]');
                const en = elVon(ev2)?.closest('button[data-e]');
                const ab = elVon(ev2)?.closest('button[data-ab]');
                if (s)
                    Store.updateView(view.id, { startKey: s.dataset.s });
                else if (en)
                    Store.updateView(view.id, { endeKey: en.dataset.e });
                else if (ab)
                    Store.updateView(view.id, { abhKey: ab.dataset.ab });
                else
                    return;
                m.remove();
                App.zeichneSeite();
            });
        });
        return w;
    };
    /** ISO-Kalenderwoche — für die Wochen-Zoomstufe. */
    const kalenderWoche = (d) => {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
        const ersterDo = new Date(x.getFullYear(), 0, 4);
        ersterDo.setDate(ersterDo.getDate() + 3 - ((ersterDo.getDay() + 6) % 7));
        return 1 + Math.round((x.getTime() - ersterDo.getTime()) / 604800000);
    };
    /* --- Karte: OpenStreetMap, kostenlos und ohne Schlüssel ----------------
     * Kein fremdes Kartenpaket: die Kacheln kommen direkt von openstreetmap.org,
     * die Umrechnung von Länge und Breite auf Kacheln steht unten.
     * Orte werden über Nominatim gesucht (ebenfalls kostenlos) und danach in
     * der Zeile gespeichert, damit dieselbe Adresse nie zweimal gesucht wird.
     * ----------------------------------------------------------------------*/
    const KACHEL = 256;
    const nachKachel = (lat, lon, z) => {
        const n = Math.pow(2, z);
        const x = (lon + 180) / 360 * n;
        const rad = lat * Math.PI / 180;
        const y = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n;
        return { x, y };
    };
    /** Sucht eine Adresse — höchstens eine Anfrage je Sekunde, so will es Nominatim. */
    let letzteSuche = 0;
    const ortSuchen = async (text2) => {
        const warten = Math.max(0, 1100 - (Date.now() - letzteSuche));
        if (warten)
            await new Promise(r => setTimeout(r, warten));
        letzteSuche = Date.now();
        const r = await KI.holen('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
            encodeURIComponent(text2), {}, { versuche: 3, basis: 1200 });
        if (!r.ok)
            throw new Error('Ortssuche antwortet mit ' + r.status);
        const d = await r.json();
        if (!d.length)
            return null;
        return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: d[0].display_name };
    };
    const alsKarte = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'karte-w';
        const ortKeys = Object.keys(coll.schema).filter(k => ['text', 'title', 'select'].includes(coll.schema[k].type));
        const ortKey = view.ortKey && coll.schema[view.ortKey] ? view.ortKey : ortKeys[0];
        if (!ortKey) {
            w.innerHTML = '<div class="db-leer">Für die Karte braucht es eine Textspalte mit Orten.</div>';
            return w;
        }
        /* Was ist schon bekannt? */
        const punkte = rows.map((r) => {
            const g = (r.geo || {})[ortKey];
            return g ? { row: r, lat: g.lat, lon: g.lon } : null;
        }).filter(Boolean);
        const offen = rows.filter((r) => !(r.geo || {})[ortKey] &&
            String(wert(r, ortKey, coll) || '').trim());
        const kopf = document.createElement('div');
        kopf.className = 'karte-kopf';
        kopf.innerHTML =
            `<span>${punkte.length} auf der Karte</span>` +
                (offen.length ? `<button data-a="suchen">${offen.length} Orte nachschlagen</button>` : '') +
                '<button data-a="spalte">Ortsspalte: <b>' + esc(coll.schema[ortKey].name) + '</b></button>' +
                '<span class="karte-quelle">Karten © OpenStreetMap — kostenlos, ohne Schlüssel</span>';
        w.appendChild(kopf);
        const flaeche = document.createElement('div');
        flaeche.className = 'karte';
        w.appendChild(flaeche);
        /* Mittelpunkt und Zoom */
        let z = view.zoom || 5;
        let mitte = punkte.length
            ? { lat: punkte.reduce((a, p) => a + p.lat, 0) / punkte.length,
                lon: punkte.reduce((a, p) => a + p.lon, 0) / punkte.length }
            : { lat: 51.0, lon: 10.0 };
        const male = () => {
            const b = flaeche.clientWidth || 700, h = 420;
            flaeche.innerHTML = '';
            flaeche.style.height = h + 'px';
            const m = nachKachel(mitte.lat, mitte.lon, z);
            const linksOben = { x: m.x - b / 2 / KACHEL, y: m.y - h / 2 / KACHEL };
            const n = Math.pow(2, z);
            for (let dx = -1; dx <= Math.ceil(b / KACHEL); dx++) {
                for (let dy = -1; dy <= Math.ceil(h / KACHEL); dy++) {
                    const tx = Math.floor(linksOben.x) + dx;
                    const ty = Math.floor(linksOben.y) + dy;
                    if (ty < 0 || ty >= n)
                        continue;
                    const bild = document.createElement('img');
                    bild.className = 'kachel';
                    bild.loading = 'lazy';
                    bild.src = `https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`;
                    bild.style.left = ((tx - linksOben.x) * KACHEL) + 'px';
                    bild.style.top = ((ty - linksOben.y) * KACHEL) + 'px';
                    bild.addEventListener('error', () => { bild.style.opacity = '0'; });
                    flaeche.appendChild(bild);
                }
            }
            punkte.forEach((p) => {
                const k = nachKachel(p.lat, p.lon, z);
                const x = (k.x - linksOben.x) * KACHEL;
                const y = (k.y - linksOben.y) * KACHEL;
                if (x < -40 || y < -40 || x > b + 40 || y > h + 40)
                    return;
                const nadel = document.createElement('button');
                nadel.className = 'nadel';
                nadel.style.left = x + 'px';
                nadel.style.top = y + 'px';
                nadel.innerHTML = '<span class="n-punkt"></span><span class="n-text">' +
                    esc(p.row.text || 'Ohne Titel') + '</span>';
                nadel.addEventListener('click', () => zeilePeek(p.row, coll));
                flaeche.appendChild(nadel);
            });
            const werkzeuge = document.createElement('div');
            werkzeuge.className = 'karte-zoom';
            werkzeuge.innerHTML = '<button data-z="1">+</button><button data-z="-1">−</button>';
            werkzeuge.addEventListener('click', e => {
                const b2 = elVon(e)?.closest('[data-z]');
                if (!b2)
                    return;
                z = Math.max(2, Math.min(18, z + (Number(b2.dataset.z))));
                Store.updateView(view.id, { zoom: z });
                male();
            });
            flaeche.appendChild(werkzeuge);
        };
        /* Ziehen verschiebt die Karte */
        let zieht = false, zx = 0, zy = 0;
        flaeche.addEventListener('pointerdown', e => {
            if (elVon(e)?.closest('.nadel, .karte-zoom'))
                return;
            zieht = true;
            zx = e.clientX;
            zy = e.clientY;
            flaeche.setPointerCapture(e.pointerId);
        });
        flaeche.addEventListener('pointermove', e => {
            if (!zieht)
                return;
            const n = Math.pow(2, z);
            mitte.lon -= (e.clientX - zx) / KACHEL / n * 360;
            const dLat = (e.clientY - zy) / KACHEL / n * 360;
            mitte.lat = Math.max(-85, Math.min(85, mitte.lat + dLat * Math.cos(mitte.lat * Math.PI / 180)));
            zx = e.clientX;
            zy = e.clientY;
            male();
        });
        flaeche.addEventListener('pointerup', () => { zieht = false; });
        setTimeout(male, 0);
        kopf.addEventListener('click', async (e) => {
            if (elVon(e)?.closest('[data-a="spalte"]')) {
                const r = (htmlVon(e) ?? document.body).getBoundingClientRect();
                const m = UI.menu('<div class="grp">Welche Spalte enthält den Ort?</div>' +
                    ortKeys.map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join(''), r.left, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const k = elVon(ev)?.closest('button[data-k]');
                    if (!k)
                        return;
                    Store.updateView(view.id, { ortKey: k.dataset.k });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (!elVon(e)?.closest('[data-a="suchen"]'))
                return;
            UI.toast(offen.length + ' Orte werden nachgeschlagen — das dauert etwa ' + offen.length + ' Sekunden');
            let n = 0;
            for (const r of offen) {
                const txt = String(wert(r, ortKey, coll) || '').trim();
                try {
                    const g = await ortSuchen(txt);
                    if (g) {
                        const geo = Object.assign({}, r.geo || {});
                        geo[ortKey] = { lat: g.lat, lon: g.lon, name: g.name };
                        Store.updateBlock(r.id, { geo });
                        n++;
                    }
                }
                catch (err) {
                    UI.banner('Ortssuche nicht möglich: ' + (err instanceof Error ? err.message : String(err)) +
                        ' — offline oder vom Browser blockiert.', 'warn');
                    break;
                }
            }
            UI.toast(n + ' Orte gefunden');
            App.zeichneSeite();
        });
        return w;
    };
    /* --- Feed: der Zeitstrom, neueste zuerst (Notions Feed-View) ----------- */
    const alsFeed = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'feed';
        const datumKey = view.datumKey && coll.schema[view.datumKey] ? view.datumKey
            : Object.keys(coll.schema).find(k => ['date', 'created', 'edited'].includes(coll.schema[k].type));
        const sortiert2 = rows.slice().sort((a, b) => {
            const av = datumKey ? wert(a, datumKey, coll) : a.created;
            const bv = datumKey ? wert(b, datumKey, coll) : b.created;
            return String(bv || '').localeCompare(String(av || ''));
        });
        if (!sortiert2.length) {
            w.innerHTML = '<div class="db-leer">Noch keine Einträge.</div>';
            return w;
        }
        sortiert2.forEach((r) => {
            const e = document.createElement('article');
            e.className = 'feed-eintrag';
            const wann = datumKey ? Formula.anzeige(wert(r, datumKey, coll)) : Werkzeuge.zeitKurz(r.created);
            const merkmale = Object.keys(coll.schema)
                .filter(k => k !== datumKey && coll.schema[k].type !== 'title' && !(view.hidden || []).includes(k))
                .map(k => zelle(r, k, coll))
                .filter(z => z && !z.includes('—'))
                .slice(0, 4).join(' ');
            /* Der Anfang des Seiteninhalts als Vorschau */
            const vorschau = Store.childrenOf(r.id)
                .map((b) => b.text || '').filter(Boolean).join(' ').slice(0, 220);
            e.innerHTML =
                `<div class="fe-kopf"><b>${esc(r.text || 'Ohne Titel')}</b><span>${esc(wann)}</span></div>` +
                    (merkmale ? `<div class="fe-merkmale">${merkmale}</div>` : '') +
                    (vorschau ? `<div class="fe-text">${esc(vorschau)}${vorschau.length >= 220 ? ' …' : ''}</div>` : '') +
                    `<div class="fe-fuss"><button data-a="oeffnen">Öffnen</button>` +
                    `<button data-a="komm">💬 Kommentar</button></div>`;
            e.addEventListener('click', ev => {
                if (elVon(ev)?.closest('[data-a="komm"]')) {
                    Kommentare.neu(r);
                    return;
                }
                if (elVon(ev)?.closest('[data-a="oeffnen"]') || elVon(ev)?.closest('.fe-kopf'))
                    view.oeffnenAls === 'voll' ? App.oeffne(r.id) : zeilePeek(r, coll);
            });
            e.addEventListener('contextmenu', ev => { ev.preventDefault(); zeilenMenue({ x: ev.clientX, y: ev.clientY }, r, coll); });
            w.appendChild(e);
        });
        return w;
    };
    /* --- Diagrammansicht ----------------------------------------------------
     * Notions Chart-View: gruppieren, zusammenfassen, zeichnen.
     * ----------------------------------------------------------------------*/
    const alsDiagramm = (coll, view, rows) => {
        const w = document.createElement('div');
        w.className = 'db-chart';
        const gruppierbar = Object.keys(coll.schema).filter(k => ['select', 'status', 'multi', 'checkbox', 'person', 'text', 'title', 'date'].includes(coll.schema[k].type));
        const messbar = Object.keys(coll.schema).filter(k => ['number', 'formula', 'rollup'].includes(coll.schema[k].type));
        const gKey = view.chartGruppe && coll.schema[view.chartGruppe] ? view.chartGruppe : gruppierbar[0];
        const mKey = view.chartWert && coll.schema[view.chartWert] ? view.chartWert : '';
        const typ = view.chartTyp || 'bar';
        if (!gKey) {
            w.innerHTML = '<div class="db-leer">Für ein Diagramm braucht es eine Spalte zum Gruppieren.</div>';
            return w;
        }
        /* Datumsstufe: Tag, Woche, Monat, Quartal oder Jahr — wie in Notion */
        const stufe = view.chartStufe || 'monat';
        const alsStufe = (roh) => {
            const d = new Date(roh);
            if (isNaN(d.getTime()))
                return String(roh);
            const j = d.getFullYear();
            if (stufe === 'tag')
                return d.toISOString().slice(0, 10);
            if (stufe === 'woche') {
                const start = Einstellungen.wochenstart();
                const t = new Date(d);
                t.setDate(t.getDate() - ((t.getDay() - start + 7) % 7));
                return t.toISOString().slice(0, 10) + ' (KW)';
            }
            if (stufe === 'quartal')
                return j + ' Q' + (Math.floor(d.getMonth() / 3) + 1);
            if (stufe === 'jahr')
                return String(j);
            return d.toISOString().slice(0, 7);
        };
        /* Zusammenfassen — nicht nur Summe */
        const art = view.chartArt || (mKey ? 'Summe' : 'Anzahl');
        /* Zu welcher Gruppe gehört eine Zeile? Wird auch zum Hineinschauen gebraucht. */
        const gruppeNamen = (r) => {
            let k = wert(r, gKey, coll);
            if (Array.isArray(k))
                k = k.join(', ');
            if (['date', 'created', 'edited'].includes(coll.schema[gKey].type) && k)
                k = alsStufe(k);
            return [(k === '' || k == null || k === false) ? '(leer)' : String(k)];
        };
        const map = new Map();
        rows.forEach((r) => {
            const name = gruppeNamen(r)[0];
            const v = mKey ? Formula.zahl(wert(r, mKey, coll)) : 1;
            if (!map.has(name))
                map.set(name, []);
            map.get(name).push(isNaN(v) ? 0 : v);
        });
        const fasseZusammen = (liste) => {
            switch (art) {
                case 'Anzahl': return liste.length;
                case 'Summe': return liste.reduce((a, b) => a + b, 0);
                case 'Durchschnitt': return liste.length ? +(liste.reduce((a, b) => a + b, 0) / liste.length).toFixed(2) : 0;
                case 'Median': {
                    if (!liste.length)
                        return 0;
                    const so = liste.slice().sort((a, b) => a - b);
                    const m2 = Math.floor(so.length / 2);
                    return so.length % 2 ? so[m2] : (so[m2 - 1] + so[m2]) / 2;
                }
                case 'Minimum': return liste.length ? Math.min(...liste) : 0;
                case 'Maximum': return liste.length ? Math.max(...liste) : 0;
                case 'Spanne': return liste.length ? Math.max(...liste) - Math.min(...liste) : 0;
                case 'Eindeutige zählen': return new Set(liste).size;
                case 'Gefüllte zählen': return liste.filter((x) => x !== 0).length;
                case 'Leere zählen': return liste.filter((x) => x === 0).length;
                case 'Prozent gefüllt': return liste.length ? Math.round(liste.filter((x) => x !== 0).length / liste.length * 100) : 0;
                default: return liste.reduce((a, b) => a + b, 0);
            }
        };
        const werte = [...map.entries()]
            .map(([name, liste]) => ({ name, wert: fasseZusammen(liste) }))
            .sort((a, b) => a.name.localeCompare(b.name));
        const leiste = document.createElement('div');
        leiste.className = 'chart-head';
        leiste.innerHTML =
            `<span class="chart-titel">${esc(coll.name)} — ${esc(coll.schema[gKey].name)}` +
                (mKey ? ' · ' + art + ' von ' + esc(coll.schema[mKey].name) : ' · ' + art) +
                (['date', 'created', 'edited'].includes(coll.schema[gKey].type) ? ' je ' + stufe : '') + '</span>' +
                '<div class="chart-typen">' +
                [['bar', 'Balken'], ['line', 'Linie'], ['area', 'Fläche'], ['donut', 'Ring'], ['kpi', 'Kennzahl']]
                    .map(([id, n]) => `<button data-ct="${id}"${id === typ ? ' class="on"' : ''}>${n}</button>`).join('') +
                '</div>' +
                '<button data-a="achsen" class="chart-daten">✎ Achsen</button>';
        w.appendChild(leiste);
        leiste.addEventListener('click', e => {
            const t = elVon(e)?.closest('[data-ct]');
            if (t) {
                Store.updateView(view.id, { chartTyp: t.dataset.ct });
                App.zeichneSeite();
                return;
            }
            if (!elVon(e)?.closest('[data-a="achsen"]'))
                return;
            const r = (htmlVon(e) ?? document.body).getBoundingClientRect();
            const m = UI.menu('<div class="grp">Gruppieren nach</div>' +
                gruppierbar.map(k => `<button data-g="${k}">${esc(coll.schema[k].name)}` +
                    (k === gKey ? '<span class="ms">✓</span>' : '') + '</button>').join('') +
                '<div class="grp">Zeitstufe (bei Datum)</div>' +
                ['tag', 'woche', 'monat', 'quartal', 'jahr'].map(x => `<button data-s="${x}">${x}${x === stufe ? '<span class="ms">✓</span>' : ''}</button>`).join('') +
                '<div class="grp">Werte</div>' +
                '<button data-m="">Anzahl der Einträge</button>' +
                messbar.map(k => `<button data-m="${k}">${esc(coll.schema[k].name)}` +
                    (k === mKey ? '<span class="ms">✓</span>' : '') + '</button>').join('') +
                '<div class="grp">Zusammenfassen</div>' +
                ['Anzahl', 'Summe', 'Durchschnitt', 'Median', 'Minimum', 'Maximum', 'Spanne',
                    'Eindeutige zählen', 'Gefüllte zählen', 'Leere zählen', 'Prozent gefüllt'].map(x => `<button data-art="${esc(x)}">${x}${x === art ? '<span class="ms">✓</span>' : ''}</button>`).join(''), r.left, r.bottom + 4);
            m.addEventListener('click', ev => {
                const g = elVon(ev)?.closest('button[data-g]');
                const mm = elVon(ev)?.closest('button[data-m]');
                const st = elVon(ev)?.closest('button[data-s]');
                const ar = elVon(ev)?.closest('button[data-art]');
                if (g)
                    Store.updateView(view.id, { chartGruppe: g.dataset.g });
                else if (mm)
                    Store.updateView(view.id, { chartWert: mm.dataset.m });
                else if (st)
                    Store.updateView(view.id, { chartStufe: st.dataset.s });
                else if (ar)
                    Store.updateView(view.id, { chartArt: ar.dataset.art });
                else
                    return;
                m.remove();
                App.zeichneSeite();
            });
        });
        if (!werte.length) {
            const l = document.createElement('div');
            l.className = 'db-leer';
            l.textContent = 'Noch keine Einträge.';
            w.appendChild(l);
            return w;
        }
        const flaeche = document.createElement('div');
        flaeche.className = 'chart-flaeche';
        flaeche.appendChild(Zusatz.chartSvg(typ, werte));
        w.appendChild(flaeche);
        const legende = document.createElement('div');
        legende.className = 'chart-legende';
        legende.innerHTML = werte.map((v, i) => `<span data-i="${i}"><i style="background:${Zusatz.PALETTE[i % Zusatz.PALETTE.length]}"></i>` +
            `${esc(v.name)} <b>${Formula.anzeige(v.wert)}</b></span>`).join('');
        w.appendChild(legende);
        /* Hineinschauen: ein Klick auf Balken, Segment oder Legende zeigt die
           Zeilen, aus denen die Zahl kommt. Notions Diagramme sind stumm. */
        const hinein = (i) => {
            const name = (werte[i] || {}).name;
            if (name === undefined)
                return;
            const drin = rows.filter((r) => gruppeNamen(r).includes(name));
            drilldown(coll, view, name, drin, coll.schema[gKey].name + ' = ' + name +
                (mKey ? ' · ' + art + ' von ' + coll.schema[mKey].name + ': ' +
                    Formula.anzeige(werte[i]?.wert) : ''));
        };
        flaeche.addEventListener('click', e => {
            const t = elVon(e)?.closest('[data-i]');
            if (t)
                hinein(Number(t.dataset.i));
        });
        legende.addEventListener('click', e => {
            const t = elVon(e)?.closest('[data-i]');
            if (t)
                hinein(Number(t.dataset.i));
        });
        return w;
    };
    /* Ein Fenster mit genau den Zeilen hinter einer Zahl. */
    const drilldown = (coll, _view, titel, zeilen2, untertitel) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        const keys = Object.keys(coll.schema).slice(0, 5);
        o.innerHTML =
            '<div class="finder" style="width:min(820px,95vw)">' +
                `<div class="fh">🔎 ${esc(String(titel))} <em>${zeilen2.length}</em>` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                (untertitel ? `<div class="dl-hinweis" style="padding:8px 18px">${esc(untertitel)}</div>` : '') +
                '<div class="res dd-liste">' +
                (zeilen2.length
                    ? '<table class="grid dd-tab"><thead><tr>' +
                        keys.map(k => `<th>${esc(coll.schema[k].name)}</th>`).join('') +
                        '</tr></thead><tbody>' +
                        zeilen2.map((r) => `<tr data-rid="${r.id}">` +
                            keys.map(k => `<td>${zelle(r, k, coll)}</td>`).join('') + '</tr>').join('') +
                        '</tbody></table>'
                    : '<div class="pf-gut">Hinter dieser Zahl steht keine einzelne Zeile.</div>') +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="csv">Diese Auswahl als CSV</button>' +
                '<button data-a="zu" class="prim">Schliessen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="csv"]')) {
                const kopf = Object.keys(coll.schema).map(k => coll.schema[k].name);
                const zeilenText = zeilen2.map((r) => Object.keys(coll.schema).map(k => {
                    const v = wert(r, k, coll);
                    const t = Array.isArray(v) ? v.map(x => (x && x.name) || x).join(', ') : Formula.anzeige(v);
                    return /[",;\n]/.test(String(t ?? '')) ? '"' + String(t).replace(/"/g, '""') + '"' : (t ?? '');
                }).join(','));
                const blob = new Blob(['\ufeff' + [kopf.join(','), ...zeilenText].join('\n')], { type: 'text/csv;charset=utf-8' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = (coll.name || 'Auswahl') + ' — ' + String(titel).replace(/[\\/:*?"<>|]/g, '-') + '.csv';
                a.click();
                UI.toast('CSV gespeichert');
                return;
            }
            const tr = elVon(e)?.closest('[data-rid]');
            if (tr) {
                o.remove();
                zeilePeek(Store.getBlock(tr.dataset.rid), coll);
            }
        });
    };
    /* --- Formularansicht ----------------------------------------------------
     * Notions Form-View: eine Eingabemaske, die neue Einträge anlegt.
     * ----------------------------------------------------------------------*/
    const alsFormular = (coll, view, block) => {
        const w = document.createElement('div');
        w.className = 'db-form';
        const felder = Object.keys(coll.schema).filter(k => !NUR_LESEN.includes(coll.schema[k].type) &&
            !KI_TYPEN.includes(coll.schema[k].type) &&
            coll.schema[k].type !== 'button' &&
            !(view.hidden || []).includes(k));
        w.innerHTML =
            `<div class="form-kopf"><b contenteditable="true" data-f="titel">${esc(view.formTitel || coll.name)}</b>` +
                `<div contenteditable="true" data-f="text" class="form-text">` +
                `${esc(view.formText || 'Alle Felder ausfüllen und abschicken.')}</div></div>`;
        const box = document.createElement('div');
        box.className = 'form-felder';
        felder.forEach(k => {
            const def = coll.schema[k];
            const feld = document.createElement('label');
            feld.className = 'form-feld';
            const pflicht = (view.pflicht || []).includes(k);
            const regel = (view.logik || {})[k];
            feld.dataset.k = k;
            if (regel)
                feld.dataset.zeigtWenn = regel.key + '|' + regel.wert;
            feld.innerHTML = `<span>${esc(def.name)}${pflicht ? ' <em>*</em>' : ''}` +
                (regel ? `<em class="fl-hinweis">nur wenn ${esc(coll.schema[regel.key]?.name || '?')} = ` +
                    `${esc(regel.wert)}</em>` : '') + '</span>';
            /* Die 13 Fragetypen aus Teil 8 — jeder bekommt das Feld, das zu ihm passt. */
            let eingabe;
            if (['select', 'status'].includes(def.type)) {
                eingabe = document.createElement('select');
                eingabe.innerHTML = '<option value=""></option>' +
                    (def.options || []).map((o) => `<option>${esc(o.name)}</option>`).join('');
            }
            else if (def.type === 'multi') {
                /* Mehrfachauswahl: eine Reihe Kästchen, wie in Notions Formular */
                eingabe = document.createElement('div');
                eingabe.className = 'form-mehr';
                eingabe.innerHTML = (def.options || []).map((o) => `<label class="tag bg-${o.color}"><input type="checkbox" data-o="${esc(o.name)}"> ${esc(o.name)}</label>`).join('') || '<span style="color:var(--text-faint)">Noch keine Optionen</span>';
            }
            else if (def.type === 'checkbox') {
                eingabe = document.createElement('input');
                eingabe.type = 'checkbox';
            }
            else if (def.type === 'files') {
                eingabe = document.createElement('input');
                eingabe.type = 'file';
                eingabe.multiple = true;
            }
            else if (def.type === 'text') {
                /* Lange Antwort */
                eingabe = document.createElement('textarea');
                eingabe.rows = 3;
                eingabe.placeholder = def.beschreibung || '';
            }
            else if (def.type === 'person') {
                eingabe = document.createElement('input');
                eingabe.type = 'text';
                eingabe.setAttribute('list', 'fp-' + k);
                const namen = [...new Set(Store.rowsOf(coll.id)
                        .map(r => wert(r, k, coll)).filter(Boolean).map(String))];
                const dl = document.createElement('datalist');
                dl.id = 'fp-' + k;
                dl.innerHTML = namen.map(n => `<option>${esc(n)}</option>`).join('');
                feld.appendChild(dl);
            }
            else {
                eingabe = document.createElement('input');
                eingabe.type = { date: 'date', number: 'number', url: 'url', email: 'email',
                    phone: 'tel', duration: 'text', place: 'text' }[def.type] || 'text';
                if (def.type === 'duration')
                    eingabe.placeholder = 'z. B. 1h30';
                if (def.type === 'place')
                    eingabe.placeholder = 'Adresse oder Ort';
            }
            eingabe.dataset.k = k;
            feld.appendChild(eingabe);
            box.appendChild(feld);
        });
        w.appendChild(box);
        const fuss = document.createElement('div');
        fuss.className = 'form-fuss';
        fuss.innerHTML = `<button class="prim" data-a="senden">${esc(view.formKnopf || 'Absenden')}</button>` +
            `<button data-a="pflicht">Pflichtfelder</button>` +
            `<button data-a="logik">Bedingte Fragen</button>` +
            `<button data-a="knopftext">Knopftext</button>` +
            `<button data-a="dank">Danke-Seite</button>` +
            `<button data-a="formlink">🔗 Link</button>` +
            `<span class="form-zahl">${Store.rowsOf(coll.id).length} Einträge · ` +
            `${Number(view.formAnzahl) || 0} über das Formular</span>`;
        w.appendChild(fuss);
        w.addEventListener('input', e => {
            const f = elVon(e)?.closest('[data-f]');
            if (!f)
                return;
            Store.updateView(view.id, f.dataset.f === 'titel'
                ? { formTitel: f.textContent } : { formText: f.textContent });
        });
        /* Bedingte Fragen: erst zeigen, wenn eine andere Antwort passt */
        const logikPruefen = () => {
            box.querySelectorAll('.form-feld[data-zeigt-wenn]').forEach(f => {
                const [k2, w2] = (f.dataset.zeigtWenn ?? '').split('|');
                const quelle = box.querySelector(`[data-k="${k2}"]`);
                const jetzt = quelle ? (quelle.type === 'checkbox' ? String(quelle.checked) : quelle.value) : '';
                f.style.display = (String(jetzt) === String(w2)) ? '' : 'none';
            });
        };
        box.addEventListener('input', logikPruefen);
        box.addEventListener('change', logikPruefen);
        setTimeout(logikPruefen, 0);
        fuss.addEventListener('click', async (e) => {
            if (elVon(e)?.closest('[data-a="knopftext"]')) {
                const t = await UI.frage('Was soll auf dem Knopf stehen?', view.formKnopf || 'Absenden');
                if (t !== null) {
                    Store.updateView(view.id, { formKnopf: t || 'Absenden' });
                    App.zeichneSeite();
                }
                return;
            }
            if (elVon(e)?.closest('[data-a="dank"]')) {
                const r2 = (htmlVon(e) ?? document.body).getBoundingClientRect();
                const m2 = UI.menu('<div class="grp">Nach dem Absenden</div>' +
                    '<button data-d="titel"><span class="mi">✎</span>Überschrift ändern' +
                    `<span class="ms">${esc(view.formDankTitel || 'Danke!')}</span></button>` +
                    '<button data-d="text"><span class="mi">✎</span>Text ändern</button>' +
                    `<button data-d="nochmal"><span class="mi">${view.formNochmal === false ? '☐' : '☑'}</span>` +
                    'Knopf „Noch eine Antwort"</button>' +
                    '<hr><button data-d="null"><span class="mi">↺</span>Zähler zurücksetzen' +
                    `<span class="ms">${Number(view.formAnzahl) || 0}</span></button>`, r2.left, r2.top - 30);
                m2.addEventListener('click', async (ev) => {
                    const d = elVon(ev)?.closest('button[data-d]');
                    if (!d)
                        return;
                    m2.remove();
                    if (d.dataset.d === 'titel') {
                        const t = await UI.frage('Überschrift der Danke-Seite', view.formDankTitel || 'Danke!');
                        if (t !== null)
                            Store.updateView(view.id, { formDankTitel: t });
                    }
                    if (d.dataset.d === 'text') {
                        const t = await UI.frage('Text der Danke-Seite', view.formDankText || 'Deine Antwort ist angekommen.');
                        if (t !== null)
                            Store.updateView(view.id, { formDankText: t });
                    }
                    if (d.dataset.d === 'nochmal')
                        Store.updateView(view.id, { formNochmal: view.formNochmal === false });
                    if (d.dataset.d === 'null')
                        Store.updateView(view.id, { formAnzahl: 0 });
                    App.zeichneSeite();
                });
                return;
            }
            if (elVon(e)?.closest('[data-a="formlink"]')) {
                const link = location.origin + location.pathname + '#' +
                    (block ? block.id : coll.id) + '/' + view.id;
                Ablage.kopiereJetzt(link, 'Link zum Formular kopiert — ohne Server gilt er auf diesem Gerät');
                return;
            }
            if (elVon(e)?.closest('[data-a="logik"]')) {
                const r = (htmlVon(e) ?? document.body).getBoundingClientRect();
                const m = UI.menu('<div class="grp">Welche Frage soll bedingt sein?</div>' +
                    felder.map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}` +
                        ((view.logik || {})[k] ? '<span class="ms">bedingt</span>' : '') + '</button>').join(''), r.left, r.top - 30);
                m.addEventListener('click', async (ev) => {
                    const b2 = elVon(ev)?.closest('button[data-k]');
                    if (!b2)
                        return;
                    m.remove();
                    const ziel = b2.dataset.k;
                    if (!ziel)
                        return;
                    view.logik = view.logik || {};
                    if (view.logik[ziel]) {
                        delete view.logik[ziel];
                        Store.updateView(view.id, { logik: view.logik });
                        App.zeichneSeite();
                        return;
                    }
                    const m2 = UI.menu('<div class="grp">Zeigen, wenn diese Frage …</div>' +
                        felder.filter(k => k !== ziel)
                            .map(k => `<button data-q="${k}">${esc(coll.schema[k].name)}</button>`).join(''), r.left, r.top - 30);
                    m2.addEventListener('click', async (ev2) => {
                        const q = elVon(ev2)?.closest('button[data-q]');
                        if (!q)
                            return;
                        m2.remove();
                        const w3 = await UI.frage('… diesen Wert hat', '');
                        if (w3 === null)
                            return;
                        view.logik[ziel] = { key: q.dataset.q, wert: w3 };
                        Store.updateView(view.id, { logik: view.logik });
                        App.zeichneSeite();
                        UI.toast('Bedingte Frage eingerichtet');
                    });
                });
                return;
            }
            if (elVon(e)?.closest('[data-a="pflicht"]')) {
                const r = (htmlVon(e) ?? document.body).getBoundingClientRect();
                const m = UI.menu('<div class="grp">Pflichtfelder</div>' + felder.map(k => `<button data-k="${k}"><span class="mi">${(view.pflicht || []).includes(k) ? '☑' : '☐'}</span>` +
                    `${esc(coll.schema[k].name)}</button>`).join(''), r.left, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const b = elVon(ev)?.closest('button[data-k]');
                    if (!b)
                        return;
                    const p = view.pflicht || [];
                    Store.updateView(view.id, { pflicht: p.includes(b.dataset.k) ? p.filter((x) => x !== b.dataset.k) : [...p, b.dataset.k] });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (!elVon(e)?.closest('[data-a="senden"]'))
                return;
            const props = {};
            let titel = '';
            let fehlt = null;
            const dateiFelder = [];
            box.querySelectorAll('[data-k]').forEach(el => {
                const k = el.dataset.k;
                if (!k || !coll.schema[k])
                    return;
                /* Nur echte Eingabefelder — die Beschriftung trägt denselben Schlüssel,
                   hat aber keinen Wert. Ohne diese Zeile hielt jedes Pflichtfeld die
                   ganze Antwort auf. */
                if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) &&
                    !el.classList.contains('form-mehr'))
                    return;
                const versteckt = el.closest('.form-feld')?.style.display === 'none';
                const typ = coll.schema[k].type;
                let v;
                if (typ === 'multi') {
                    v = [...el.querySelectorAll('input[data-o]:checked')].map(x => x.dataset.o);
                }
                else if (typ === 'files') {
                    v = [];
                    if (!versteckt && el.files && el.files.length)
                        dateiFelder.push([k, el.files]);
                }
                else if (typ === 'duration') {
                    v = dauerLesen(el.value);
                }
                else if (typ === 'place') {
                    v = el.value.trim() ? { name: el.value.trim() } : null;
                }
                else {
                    v = el.type === 'checkbox' ? el.checked : el.value;
                }
                const leer = v === '' || v === false || v == null || (Array.isArray(v) && !v.length);
                if (!versteckt && (view.pflicht || []).includes(k) && leer &&
                    !(typ === 'files' && dateiFelder.some(d => d[0] === k)))
                    fehlt = coll.schema[k].name;
                if (typ === 'title')
                    titel = String(v ?? '');
                else
                    props[k] = v;
            });
            if (fehlt) {
                UI.toast('Bitte „' + fehlt + '" ausfüllen');
                return;
            }
            const r = Store.addRow(coll.id, props);
            Store.updateBlock(r.id, { text: titel || 'Ohne Titel' });
            setTimeout(() => automationenLaufen(r, coll, 'formular-neu'), 0);
            /* Angehängte Dateien bleiben lokal — als Data-URL am Eintrag. */
            dateiFelder.forEach(([k, dateien]) => {
                [...dateien].slice(0, 5).forEach(d => {
                    if (d.size > 6 * 1024 * 1024) {
                        UI.toast('„' + d.name + '" ist zu gross (über 6 MB)');
                        return;
                    }
                    const leser = new FileReader();
                    leser.onload = () => {
                        const alt = (Store.getBlock(r.id).props || {})[k] || [];
                        Store.setProp(r.id, k, [...alt, { name: d.name, src: leser.result }]);
                        App.zeichneSeite();
                    };
                    leser.readAsDataURL(d);
                });
            });
            /* Danke-Seite statt nur einer Meldung — Notion zeigt hier eine
               Bestätigung mit eigenem Text und der Wahl, noch einmal zu antworten. */
            const zahl = (Number(view.formAnzahl) || 0) + 1;
            Store.updateView(view.id, { formAnzahl: zahl });
            w.innerHTML =
                '<div class="form-danke">' +
                    '<div class="fd-haken">✓</div>' +
                    `<div class="fd-gross" contenteditable="true" data-fd="titel">` +
                    `${esc(view.formDankTitel || 'Danke!')}</div>` +
                    `<div class="fd-text" contenteditable="true" data-fd="text">` +
                    `${esc(view.formDankText || 'Deine Antwort ist angekommen.')}</div>` +
                    '<div class="fd-knoepfe">' +
                    (view.formNochmal === false ? ''
                        : '<button data-a="nochmal" class="prim">Noch eine Antwort</button>') +
                    '<button data-a="ansehen">Antworten ansehen</button>' +
                    '</div>' +
                    `<div class="fd-zahl">${zahl} ${zahl === 1 ? 'Antwort' : 'Antworten'} über dieses Formular</div>` +
                    '</div>';
            w.addEventListener('input', ev => {
                const f = elVon(ev)?.closest('[data-fd]');
                if (!f)
                    return;
                Store.updateView(view.id, f.dataset.fd === 'titel'
                    ? { formDankTitel: f.textContent } : { formDankText: f.textContent });
            });
            w.addEventListener('click', ev => {
                if (elVon(ev)?.closest('[data-a="nochmal"]')) {
                    App.zeichneSeite();
                    return;
                }
                if (elVon(ev)?.closest('[data-a="ansehen"]')) {
                    drilldown(coll, view, 'Alle Antworten', Store.rowsOf(coll.id).filter(x => !x.archiviert), zahl + ' über dieses Formular');
                }
            });
        });
        return w;
    };
    /* ========================================================================
     * ZEILE ALS SEITENVORSCHAU  (Notions Side Peek)
     * ======================================================================*/
    /**
     * Der INHALT der Vorschau — Titel, Eigenschaften, Blöcke.
     *
     * Er steht hier für sich, weil ihn zwei Hüllen benutzen: das Seitenfenster
     * am Rechner und das Blatt von unten am Telefon (E371). Einen mobilen
     * Zwilling zu bauen wäre der teure Weg gewesen; ein Gefäss zu tauschen ist
     * der billige. Gibt das Element zurück, in dem die Blöcke stehen — der
     * Aufrufer muss `Blocks.bindeEditor` darauf rufen.
     */
    const peekInhalt = (koerper, row, coll) => {
        const titel = document.createElement('div');
        titel.className = 'peek-titel';
        titel.contentEditable = 'true';
        titel.textContent = row.text || '';
        titel.dataset.ph = 'Ohne Titel';
        titel.addEventListener('input', () => {
            Store.updateBlock(row.id, { text: titel.textContent });
        });
        koerper.appendChild(titel);
        /* Eigenschaften */
        const props = document.createElement('div');
        props.className = 'peek-props';
        Object.keys(coll.schema).forEach(k => {
            const def = coll.schema[k];
            if (def.type === 'title')
                return;
            const z = document.createElement('div');
            z.className = 'peek-prop';
            z.innerHTML = `<span class="pp-n">${def.icon || propTyp(def.type).icon} ${esc(def.name)}</span>` +
                `<span class="pp-w" data-k="${k}">${zelle(row, k, coll)}</span>`;
            z.querySelector('.pp-w')?.addEventListener('click', (e) => {
                if ((feldVon(e)?.type ?? '') === 'checkbox') {
                    Store.setProp(row.id, k, (feldVon(e)?.checked ?? false));
                    return;
                }
                zelleBearbeiten(e.currentTarget, row, k, coll);
            });
            props.appendChild(z);
        });
        koerper.appendChild(props);
        /* Inhalt der Zeile — eine Zeile ist eine vollwertige Seite */
        const inhalt = document.createElement('div');
        inhalt.className = 'peek-inhalt';
        inhalt.id = 'peek-page';
        const kinder = Store.childrenOf(row.id);
        if (!kinder.length)
            kinder.push(Store.addBlock(row.id, 'text'));
        kinder.forEach((b) => inhalt.appendChild(Blocks.render(b)));
        koerper.appendChild(inhalt);
        return inhalt;
    };
    /**
     * Die Vorschau am Telefon: ein Blatt von unten, das die Tabelle stehen
     * lässt.
     *
     * BIS E371 SPRANG SIE ZUR GANZEN SEITE. Das war bequem gebaut — dieselbe
     * Editorlogik, kein zweites Gefäss — und teuer benutzt: die Tabelle war
     * weg, die Rollposition auch, und zurück ging es nur über die Navigation.
     * Wer zehn Zeilen ansieht, navigiert zwanzig Mal. Ein 560-px-Seitenfenster
     * auf 390 px zu quetschen wäre die andere falsche Antwort gewesen; die
     * richtige ist die Form, die das Telefon dafür hat.
     */
    const zeilePeekBlatt = (row, coll) => {
        /* Ohne das Modul bleibt der alte Weg — er ist schlechter, aber er
           funktioniert. Eine Vorschau, die gar nichts tut, wäre schlimmer. */
        if (typeof Sheet === 'undefined') {
            App.oeffne(row.id);
            return;
        }
        const knopf = (zeichen, was) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.textContent = zeichen;
            b.title = was;
            b.setAttribute('aria-label', was);
            return b;
        };
        const voll = knopf('⤢', 'Als ganze Seite öffnen');
        const mehr = knopf('⋯', 'Mehr');
        Sheet.oeffne({
            titel: coll.name,
            hoehe: 'halb',
            kopfKnoepfe: [voll, mehr],
            aufbau: (koerper, griff) => {
                const inhalt = peekInhalt(koerper, row, coll);
                Blocks.bindeEditor(inhalt);
                voll.addEventListener('click', () => { griff.schliessen(); App.oeffne(row.id); });
                mehr.addEventListener('click', () => zeilenMenue(mehr, row, coll, () => griff.schliessen()));
                /* Wer im Titel oder in einem Block schreibt, will Platz. Das Blatt
                   zieht sich dann von selbst auf — sonst tippt man in einen
                   Streifen von 58 %, während die Tastatur die Hälfte davon nimmt. */
                koerper.addEventListener('focusin', e => {
                    const z = e.target instanceof Element ? e.target : null;
                    if (z?.closest('[contenteditable="true"], input, textarea'))
                        griff.setzeHoehe('voll');
                });
            },
        });
    };
    const zeilePeek = (row, coll) => {
        document.querySelectorAll('.peek').forEach(p => p.remove());
        const telefon = typeof AppEinstellung !== 'undefined'
            ? AppEinstellung.amTelefon()
            : typeof Menue !== 'undefined' && Menue.amTelefon();
        if (telefon) {
            zeilePeekBlatt(row, coll);
            return;
        }
        const p = document.createElement('aside');
        p.className = 'peek';
        const kopf = document.createElement('div');
        kopf.className = 'peek-kopf';
        kopf.innerHTML =
            '<button data-a="voll" title="Als ganze Seite öffnen">⤢</button>' +
                '<div class="peek-pfad">' + esc(coll.name) + '</div>' +
                '<button data-a="menu" title="Mehr">⋯</button>' +
                '<button data-a="zu" title="Schliessen">✕</button>';
        p.appendChild(kopf);
        const koerper = document.createElement('div');
        koerper.className = 'peek-koerper';
        const inhalt = peekInhalt(koerper, row, coll);
        p.appendChild(koerper);
        document.body.appendChild(p);
        Blocks.bindeEditor(inhalt);
        kopf.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'zu')
                p.remove();
            if (b.dataset.a === 'voll') {
                p.remove();
                App.oeffne(row.id);
            }
            if (b.dataset.a === 'menu')
                zeilenMenue(b, row, coll, () => p.remove());
        });
    };
    /* --- Rechtsklick auf eine Zeile ---------------------------------------- */
    const zeilenMenue = (anker, row, coll, danach) => {
        const r = anker.getBoundingClientRect
            ? anker.getBoundingClientRect()
            : { left: anker.x, bottom: anker.y, right: anker.x, top: anker.y };
        const m = UI.menuMitSuche('<div class="grp">Seite</div>' +
            '<button data-a="fav"><span class="mi">☆</span>Zu Favoriten hinzufügen</button>' +
            '<button data-a="icon"><span class="mi">😀</span>Icon bearbeiten</button>' +
            '<button data-a="eigen"><span class="mi">☰</span>Eigenschaft bearbeiten<span class="ms">▸</span></button>' +
            '<hr>' +
            '<button data-a="peek"><span class="mi">◧</span>In der Vorschau öffnen</button>' +
            '<button data-a="voll"><span class="mi">⤢</span>Als ganze Seite öffnen</button>' +
            '<button data-a="komm"><span class="mi">💬</span>Kommentieren<span class="ms">Strg ⇧ M</span></button>' +
            '<hr>' +
            '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
            '<button data-a="dup"><span class="mi">⧉</span>Duplizieren<span class="ms">Strg D</span></button>' +
            '<button data-a="oben"><span class="mi">↑</span>Darüber einfügen</button>' +
            '<button data-a="unten"><span class="mi">↓</span>Darunter einfügen</button>' +
            '<button data-a="unter"><span class="mi">↳</span>Unterelement anlegen</button>' +
            (coll.abhaengigkeiten
                ? '<button data-a="blockiert"><span class="mi">↪</span>Blockiert …</button>' +
                    '<button data-a="blockiertvon"><span class="mi">↩</span>Blockiert von …</button>' : '') +
            '<button data-a="link"><span class="mi">🔗</span>Link kopieren</button>' +
            '<button data-a="komm"><span class="mi">💬</span>Kommentar</button>' +
            '<hr>' +
            `<button data-a="archiv"><span class="mi">🗄</span>${row.archiviert ? 'Aus dem Archiv holen' : 'Archivieren'}</button>` +
            /* Der kurze Weg zu einem Prüfsatz: eine Zeile, bei der es stimmt,
               festhalten. Ein Formular auszufüllen macht sonst niemand. */
            (typeof Pruefsatz !== 'undefined' &&
                Object.values(coll.schema).some(d => d.type === 'formula')
                ? '<button data-a="festhalten"><span class="mi">✔</span>Diesen Fall festhalten</button>' : '') +
            '<button data-a="del"><span class="mi">🗑</span>In den Papierkorb<span class="ms">Entf</span></button>', r.left, r.bottom + 4, { platzhalter: 'Aktionen filtern …',
            fuss: 'Zuletzt bearbeitet von <b>' +
                esc(row.geaendertVon || row.erstelltVon || 'dir') + '</b><br>' +
                esc(Einstellungen.datum(new Date(row.edited || row.created), true)) });
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            m.remove();
            if (a === 'peek')
                zeilePeek(row, coll);
            if (a === 'festhalten') {
                const formeln = Object.entries(coll.schema).filter(([, d]) => d.type === 'formula');
                const machen = (key) => {
                    const s = Pruefsatz.ausZeile(coll, row.id, key);
                    UI.toast(s ? 'Festgehalten: ' + s.name : 'Ging nicht');
                    if (s)
                        Pruefsatz.fenster(coll.id);
                };
                if (formeln.length === 1)
                    machen(formeln[0]?.[0]);
                else {
                    const mm = UI.menu('<div class="grp">Welche Formel soll so bleiben?</div>' +
                        formeln.map(([k, d]) => `<button data-k="${k}">${esc(d.name)}</button>`).join(''), r.left, r.bottom + 4);
                    mm.addEventListener('click', ev => {
                        const kb = elVon(ev)?.closest('button[data-k]');
                        if (!kb)
                            return;
                        mm.remove();
                        machen(kb.dataset.k);
                    });
                }
            }
            if (a === 'icon')
                UI.emojiWaehlen(anker.getBoundingClientRect ? anker : document.body, (em) => { Store.updateBlock(row.id, { icon: em }); App.zeichneSeite(); });
            if (a === 'komm')
                Kommentare.panel(row.id);
            if (a === 'eigen') {
                zeilePeek(row, coll);
            }
            if (a === 'voll') {
                danach && danach();
                App.oeffne(row.id);
            }
            if (a === 'rename') {
                const n = await UI.frage('Neuer Titel', row.text || '');
                if (n !== null) {
                    Store.updateBlock(row.id, { text: n });
                    App.zeichneSeite();
                }
            }
            if (a === 'dup') {
                const kopie = Store.addRow(coll.id, JSON.parse(JSON.stringify(row.props || {})));
                Store.updateBlock(kopie.id, { text: (row.text || '') + ' (Kopie)' });
                App.zeichneSeite();
            }
            if (a === 'oben' || a === 'unten') {
                Store.addRow(coll.id, {});
                App.zeichneSeite();
            }
            if (a === 'unter') {
                if (!coll.unterElemente)
                    unterElementeAn(coll, true);
                const k = Store.addRow(coll.id, {});
                Store.updateBlock(k.id, { unterVon: row.id, text: 'Unterelement' });
                /* Auch in den beiden Spalten festhalten, damit Formeln es sehen */
                const eltern = (row.props || {})[UNTER_KEYS.kinder] || [];
                Store.setProp(row.id, UNTER_KEYS.kinder, [...eltern, k.id]);
                Store.setProp(k.id, UNTER_KEYS.eltern, [row.id]);
                App.zeichneSeite();
            }
            if (a === 'archiv') {
                Store.updateBlock(row.id, { archiviert: !row.archiviert });
                danach && danach();
                App.zeichneSeite();
                UI.toast(row.archiviert ? 'Aus dem Archiv geholt' : 'Archiviert — über die Ansicht wieder sichtbar');
            }
            if (a === 'blockiert' || a === 'blockiertvon') {
                const key = a === 'blockiert' ? ABH_KEYS.blockiert : ABH_KEYS.blockiertVon;
                const jetzt = (row.props || {})[key] || [];
                const andere = Store.rowsOf(coll.id).filter(z => z.id !== row.id);
                const m2 = UI.menuMitSuche(andere.map(z => `<button data-z="${z.id}">${esc(z.text || 'Ohne Titel')}` +
                    `<span class="ms">${jetzt.includes(z.id) ? '✓' : ''}</span></button>`).join('') ||
                    '<div class="menu-fuss">Keine andere Zeile da</div>', r.left, r.bottom + 4, { platzhalter: 'Zeile suchen …',
                    kopf: `<div class="grp">${a === 'blockiert' ? 'Blockiert' : 'Blockiert von'}</div>` });
                m2.addEventListener('click', ev => {
                    const z = elVon(ev)?.closest('[data-z]');
                    if (!z)
                        return;
                    const id = z.dataset.z;
                    const neu = jetzt.includes(id) ? jetzt.filter((x) => x !== id) : [...jetzt, id];
                    Store.setProp(row.id, key, neu);
                    /* Gegenrichtung mitpflegen */
                    const gegenKey = a === 'blockiert' ? ABH_KEYS.blockiertVon : ABH_KEYS.blockiert;
                    const gegen = (Store.getBlock(id).props || {})[gegenKey] || [];
                    Store.setProp(id, gegenKey, neu.includes(id) ? [...new Set([...gegen, row.id])] : gegen.filter((x) => x !== row.id));
                    m2.remove();
                    App.zeichneSeite();
                });
            }
            if (a === 'link') {
                Ablage.kopiereJetzt(location.origin + location.pathname + '#' + row.id, 'Link kopiert');
            }
            if (a === 'komm')
                Kommentare.neu(row);
            if (a === 'fav') {
                Store.updateBlock(row.id, { favorite: !row.favorite });
                App.zeichneBaum();
            }
            if (a === 'del') {
                Store.trashBlock(row.id);
                danach && danach();
                App.zeichneSeite();
                UI.toast('Eintrag gelöscht');
            }
        });
    };
    /* ========================================================================
     * MENÜS
     * ======================================================================*/
    /* Elf Ansichtstypen als Kachelraster — genau wie in Notion. */
    const neueAnsicht = (anker, coll, block) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Neue Ansicht hinzufügen</div>' +
            '<div class="dl-kacheln" style="padding:0 8px 8px; grid-template-columns:repeat(4,1fr)">' +
            LAYOUTS.map(([id, i, n]) => `<button data-l="${id}"><span>${i}</span>${n}</button>`).join('') +
            '</div>' +
            '<hr><button data-a="quelle"><span class="mi">⛁</span>Neue Datenquelle</button>', r.left, r.bottom + 4);
        m.style.width = '320px';
        m.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="quelle"]')) {
                m.remove();
                Store.addPage(App.aktuelleSeite(), { text: 'Neue Datenbank' });
                Store.addDatabase(App.aktuelleSeite(), 'Neue Datenbank', null, 'table');
                App.zeichneSeite();
                UI.toast('Neue Datenquelle angelegt');
                return;
            }
            const b = elVon(e)?.closest('button[data-l]');
            if (!b)
                return;
            const v = Store.addView(coll.id, b.dataset.l);
            if (v)
                Store.updateBlock(block.id, { aktiveView: v.id });
            m.remove();
            App.zeichneSeite();
        });
    };
    const LAYOUT_NAMEN = { table: 'Tabelle', board: 'Board', list: 'Liste', gallery: 'Galerie',
        calendar: 'Kalender', timeline: 'Zeitleiste', chart: 'Diagramm', form: 'Formular',
        feed: 'Feed', map: 'Karte', dashboard: 'Dashboard' };
    /** Gruppieren als eigenes kleines Menü — wird von zwei Stellen gebraucht. */
    /* ========================================================================
     * LAYOUT-PANEL
     * ------------------------------------------------------------------------
     * In Notion fährt rechts eine Leiste herein statt eines Menüs: neun
     * Kacheln für die Ansichtsart, darunter die Schalter, die zu dieser Art
     * passen. Genau so hier.
     * ======================================================================*/
    /* Die Liste steht in register/ansichten.js. */
    const LAYOUTS = Register.ansichten.alle();
    /** Eine Leiste, die rechts hereinfährt. */
    const leiste = (titel, inhalt, beiSchliessen) => {
        document.querySelectorAll('.db-leiste').forEach(x => x.remove());
        const d = document.createElement('aside');
        d.className = 'db-leiste';
        d.innerHTML = `<div class="dl-kopf"><b>${esc(titel)}</b>` +
            '<button class="icon-btn" data-a="zu">✕</button></div>' +
            '<div class="dl-koerper">' + inhalt + '</div>';
        document.body.appendChild(d);
        d.addEventListener('click', e => {
            if (elVon(e)?.closest('[data-a="zu"]')) {
                d.remove();
                beiSchliessen && beiSchliessen();
            }
        });
        const weg = (e) => {
            if (!d.contains(e.target) && !elVon(e)?.closest('.menu, .overlay')) {
                d.remove();
                document.removeEventListener('mousedown', weg);
                beiSchliessen && beiSchliessen();
            }
        };
        setTimeout(() => document.addEventListener('mousedown', weg), 60);
        return d;
    };
    const schalter = (id, an, text, hinweis) => `<div class="dl-zeile"><div class="dl-text"><b>${esc(text)}</b>` +
        (hinweis ? `<span>${esc(hinweis)}</span>` : '') + '</div>' +
        `<button class="schalter${an ? ' an' : ''}" data-s="${id}" role="switch" ` +
        `aria-checked="${an ? 'true' : 'false'}" aria-label="${esc(name)}"><i></i></button></div>`;
    const layoutPanel = (_coll, view, _block) => {
        const zeichne = () => {
            const inhalt = '<div class="dl-kacheln">' + LAYOUTS.map(([id, ico, n]) => `<button data-l="${id}" class="${view.layout === id ? 'on' : ''}">` +
                `<span>${ico}</span>${n}</button>`).join('') + '</div>' +
                schalter('titelZeigen', view.titelZeigen !== false, 'Titel der Datenquelle anzeigen') +
                (view.layout === 'table'
                    ? schalter('linien', view.linien !== false, 'Vertikale Linien anzeigen') : '') +
                schalter('seitenIcon', view.seitenIcon !== false, 'Seiten-Icon anzeigen') +
                schalter('umbruchAlle', !!view.umbruchAlle, 'Zeilenumbruch für alle Inhalte') +
                `<div class="dl-zeile" data-w="oeffnen"><div class="dl-text"><b>Seiten öffnen als</b></div>` +
                `<span class="dl-wert">${view.oeffnenAls === 'voll' ? 'Ganze Seite' : 'Seitliche Vorschau'} ▸</span></div>` +
                `<div class="dl-zeile" data-w="limit"><div class="dl-text"><b>Ladelimit</b>` +
                '<span>Wie viele Einträge auf einmal</span></div>' +
                `<span class="dl-wert">${view.limit || 50} ▸</span></div>` +
                (['board', 'gallery'].includes(view.layout)
                    ? `<div class="dl-zeile" data-w="karte"><div class="dl-text"><b>Kartengrösse</b></div>` +
                        `<span class="dl-wert">${view.kartenGroesse || 'mittel'} ▸</span></div>` : '') +
                (view.layout === 'table'
                    ? `<div class="dl-zeile" data-w="hoehe"><div class="dl-text"><b>Zeilenhöhe</b></div>` +
                        `<span class="dl-wert">${view.hoehe || 'normal'} ▸</span></div>` : '');
            const d = leiste('Layout', inhalt);
            d.addEventListener('click', e => {
                const l = elVon(e)?.closest('[data-l]');
                if (l) {
                    Store.updateView(view.id, { layout: l.dataset.l });
                    App.zeichneSeite();
                    setTimeout(zeichne, 30);
                    return;
                }
                const sc = elVon(e)?.closest('[data-s]');
                if (sc) {
                    const k = sc.dataset.s;
                    if (!k)
                        return;
                    const jetzt = k === 'umbruchAlle' ? !!view[k] : view[k] !== false;
                    Store.updateView(view.id, { [k]: !jetzt });
                    sc.classList.toggle('an', !jetzt);
                    App.zeichneSeite();
                    return;
                }
                const w = elVon(e)?.closest('[data-w]');
                if (!w)
                    return;
                const r = w.getBoundingClientRect();
                const art = w.dataset.w ?? '';
                const AUSWAHL = {
                    oeffnen: [['peek', 'Seitliche Vorschau'], ['voll', 'Ganze Seite']],
                    limit: [[25, '25'], [50, '50'], [100, '100'], [250, '250'], [0, 'alle']],
                    karte: [['klein', 'klein'], ['mittel', 'mittel'], ['gross', 'gross']],
                    hoehe: [['kompakt', 'kompakt'], ['normal', 'normal'], ['gross', 'gross']]
                };
                const FELD = { oeffnen: 'oeffnenAls', limit: 'limit', karte: 'kartenGroesse', hoehe: 'hoehe' };
                const auswahl = AUSWAHL[art], feld = FELD[art];
                if (!auswahl || !feld)
                    return;
                const m = UI.menu(auswahl.map(([v, n]) => `<button data-v="${v}">${n}</button>`).join(''), r.left - 140, r.bottom + 4);
                m.addEventListener('click', ev => {
                    const b = elVon(ev)?.closest('button[data-v]');
                    if (!b)
                        return;
                    const wert2 = art === 'limit' ? Number(b.dataset.v) : b.dataset.v;
                    Store.updateView(view.id, { [feld]: wert2 });
                    m.remove();
                    App.zeichneSeite();
                    setTimeout(zeichne, 30);
                });
            });
        };
        zeichne();
    };
    /* ========================================================================
     * BEDINGTE FARBE
     * ------------------------------------------------------------------------
     * Eine Regel färbt die ganze Zeile, wenn eine Bedingung zutrifft. Notion
     * nennt das „Bedingte Farbe"; in Tabellenprogrammen heisst es bedingte
     * Formatierung. Die erste Regel, die zutrifft, gewinnt.
     * ======================================================================*/
    const FARBWAHL = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'gray'];
    const farbregeln = (view) => view.farbregeln || [];
    const farbeFuerZeile = (row, view, coll) => {
        for (const r of farbregeln(view)) {
            if (r.an === false)
                continue;
            try {
                if (trifftZu(row, r, coll))
                    return r.farbe;
            }
            catch { }
        }
        return '';
    };
    const farbregelPanel = (coll, view, _block) => {
        const zeichne = () => {
            const liste = farbregeln(view);
            const inhalt = '<div class="dl-hinweis">Die erste Regel, die zutrifft, färbt die Zeile.</div>' +
                (liste.length
                    ? liste.map((r, i) => `<div class="fr-zeile"><span class="fr-punkt bg-${r.farbe}"></span>` +
                        `<span class="fr-text">${esc(coll.schema[r.key]?.name || '?')} ` +
                        `${esc(r.op)} ${esc(r.wert || '')}</span>` +
                        `<button data-an="${i}">${r.an === false ? '☐' : '☑'}</button>` +
                        `<button data-weg="${i}">🗑</button></div>`).join('')
                    : '<div class="dl-hinweis">Noch keine Regel.</div>') +
                '<button class="dl-knopf" data-a="neu">＋ Regel hinzufügen</button>';
            const d = leiste('Bedingte Farbe', inhalt);
            d.addEventListener('click', async (e) => {
                const an = elVon(e)?.closest('[data-an]');
                if (an) {
                    const l = farbregeln(view);
                    l[Number(an.dataset.an)].an = l[Number(an.dataset.an)].an === false;
                    Store.updateView(view.id, { farbregeln: l });
                    App.zeichneSeite();
                    setTimeout(zeichne, 20);
                    return;
                }
                const weg = elVon(e)?.closest('[data-weg]');
                if (weg) {
                    const l = farbregeln(view);
                    l.splice(Number(weg.dataset.weg), 1);
                    Store.updateView(view.id, { farbregeln: l });
                    App.zeichneSeite();
                    setTimeout(zeichne, 20);
                    return;
                }
                if (!elVon(e)?.closest('[data-a="neu"]'))
                    return;
                const o = document.createElement('div');
                o.className = 'overlay';
                const keys = Object.keys(coll.schema);
                o.innerHTML = '<div class="finder" style="width:min(460px,94vw)">' +
                    '<div class="fh">Neue Farbregel</div>' +
                    '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
                    '<label>Wenn<br><select id="fk">' +
                    keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
                    '</select></label>' +
                    '<label>…<br><select id="fo"></select></label>' +
                    '<label>diesen Wert<br><input id="fw"></label>' +
                    '<label>dann färben<br><div class="fr-farben">' +
                    FARBWAHL.map((c, i) => `<button data-c="${c}" class="bg-${c}` +
                        `${i === 0 ? ' on' : ''}" title="${esc(Farben.name(c))}" ` +
                        `aria-label="${esc(Farben.name(c))}" ` +
                        `aria-pressed="${i === 0 ? 'true' : 'false'}"></button>`).join('') +
                    '</div></label>' +
                    '</div>' +
                    '<div class="fbtns"><button data-a="ok" class="prim">Anlegen</button>' +
                    '<button data-a="zu">Abbrechen</button></div></div>';
                document.body.appendChild(o);
                let farbe = FARBWAHL[0];
                const ops = () => {
                    const t = coll.schema[o.querySelector('#fk')?.value ?? '']?.type;
                    fuelle(o, '#fo', (OPERATOREN[t] || OPERATOREN['text'] || [])
                        .map(x => `<option>${x}</option>`).join(''));
                };
                ops();
                o.querySelector('#fk')?.addEventListener('change', ops);
                o.addEventListener('click', ev => {
                    const c = elVon(ev)?.closest('[data-c]');
                    if (c) {
                        farbe = c.dataset.c;
                        o.querySelectorAll('[data-c]').forEach(x => x.classList.remove('on'));
                        c.classList.add('on');
                        return;
                    }
                    if (ev.target === o || elVon(ev)?.closest('[data-a="zu"]')) {
                        o.remove();
                        return;
                    }
                    if (!elVon(ev)?.closest('[data-a="ok"]'))
                        return;
                    const l = farbregeln(view);
                    l.push({ key: o.querySelector('#fk')?.value, op: o.querySelector('#fo')?.value,
                        wert: o.querySelector('#fw')?.value, farbe, an: true });
                    Store.updateView(view.id, { farbregeln: l });
                    o.remove();
                    App.zeichneSeite();
                    setTimeout(zeichne, 20);
                    UI.toast('Farbregel angelegt');
                });
            });
        };
        zeichne();
    };
    /** KI-Autofill: welche Spalte soll die KI für alle Zeilen füllen? */
    const kiAutofillMenue = (anker, coll, view) => {
        const r = anker.getBoundingClientRect();
        const kiSpalten = Object.keys(coll.schema).filter(k => KI_TYPEN.includes(coll.schema[k].type));
        const m = UI.menu('<div class="grp">KI-Autofill</div>' +
            (kiSpalten.length
                ? kiSpalten.map(k => `<button data-k="${k}"><span class="mi">✨</span>` +
                    `${esc(coll.schema[k].name)} füllen</button>`).join('')
                : '<div class="grp" style="font-weight:400">Noch keine KI-Spalte. Lege eine ' +
                    'Eigenschaft vom Typ „KI: Zusammenfassung" an.</div>'), r.left - 100, r.bottom + 4);
        m.addEventListener('click', async (ev) => {
            const b = elVon(ev)?.closest('button[data-k]');
            if (!b)
                return;
            m.remove();
            const zeilen2 = zeilen(coll, view).slice(0, 20);
            UI.toast('Die KI füllt ' + zeilen2.length + ' Zeilen …');
            for (const row of zeilen2)
                await kiFeldFuellen(row, b.dataset.k, coll);
            UI.toast('Fertig');
        });
    };
    const gruppierenMenue = (anker, coll, view, _block, unter = false) => {
        const r = anker.getBoundingClientRect();
        const feld = unter ? 'subGroupBy' : 'groupBy';
        const m = UI.menu(`<div class="grp">${unter ? 'Untergruppieren' : 'Gruppieren'} nach</div>` +
            Object.keys(coll.schema)
                .filter(k => ['select', 'status', 'checkbox', 'multi', 'person', 'date', 'relation']
                .includes(coll.schema[k].type))
                .map(k => `<button data-k="${k}"${view[feld] === k ? ' class="on"' : ''}>` +
                `<span class="mi">${propTyp(coll.schema[k].type).icon}</span>` +
                `${esc(coll.schema[k].name)}</button>`).join('') +
            '<hr><button data-k="">Keine Gruppierung</button>', r.left, r.bottom + 4);
        m.addEventListener('click', ev => {
            const kb = elVon(ev)?.closest('button[data-k]');
            if (!kb)
                return;
            Store.updateView(view.id, { [feld]: kb.dataset.k });
            m.remove();
            App.zeichneSeite();
        });
    };
    /**
     * Datenquellen einer Ansicht. Notion zeigt hier die eigene Quelle, alle
     * zusätzlichen und den Knopf „Neue Datenquelle".
     */
    const quelleMenue = (anker, coll, view, _block) => {
        const r = anker.getBoundingClientRect();
        const extra = view.extraDbs || [];
        const zeichnen = () => {
            const m = UI.menu('<div class="grp">Datenquellen</div>' +
                `<button data-q="haupt"><span class="mi">⛁</span>${esc(coll.name)}` +
                `<span class="ms">${Store.rowsOf(coll.id).length}</span></button>` +
                extra.map((x, i) => {
                    const c2 = Store.cache.collections[x.collectionId];
                    if (!c2)
                        return '';
                    return `<button data-weg="${i}"><span class="mi">⛁</span>${esc(c2.name)}` +
                        `<span class="ms">${x.an === false ? 'aus' : Store.rowsOf(c2.id).length} ✕</span></button>`;
                }).join('') +
                '<hr>' +
                '<button data-q="neu"><span class="mi">＋</span>Neue Datenquelle</button>' +
                '<button data-q="wechseln"><span class="mi">⇄</span>Datenquelle wechseln …</button>' +
                '<div class="menu-fuss">Zeilen aus allen eingeschalteten Quellen erscheinen ' +
                'zusammen in dieser Ansicht.</div>', r.left, r.bottom + 4);
            m.addEventListener('click', e => {
                const weg = elVon(e)?.closest('[data-weg]');
                if (weg) {
                    const i = Number(weg.dataset.weg);
                    const neu = extra.filter((_, j) => j !== i);
                    Store.updateView(view.id, { extraDbs: neu });
                    m.remove();
                    App.zeichneSeite();
                    return;
                }
                const b = elVon(e)?.closest('[data-q]');
                if (!b)
                    return;
                if (b.dataset.q === 'haupt') {
                    m.remove();
                    return;
                }
                m.remove();
                const drin = new Set([coll.id, ...extra.map((x) => x.collectionId)]);
                const frei = Object.values(Store.cache.collections).filter(c => !drin.has(c.id));
                if (b.dataset.q === 'neu') {
                    const m2 = UI.menuMitSuche((frei.length
                        ? frei.map(c => `<button data-c="${c.id}"><span class="mi">⛁</span>${esc(c.name)}</button>`).join('')
                        : '') +
                        '<hr><button data-c="__leer"><span class="mi">＋</span>Leere Datenquelle anlegen</button>', r.left, r.bottom + 4, { platzhalter: 'Datenquelle suchen …', kopf: '<div class="grp">Neue Datenquelle</div>' });
                    m2.addEventListener('click', ev => {
                        const c = elVon(ev)?.closest('[data-c]');
                        if (!c)
                            return;
                        m2.remove();
                        let ziel = c.dataset.c;
                        if (ziel === '__leer') {
                            const seite = Store.getBlock(App.aktuelleSeite());
                            const neu = Store.addDatabase(seite ? seite.id : null, 'Neue Datenquelle', null, 'table');
                            ziel = neu.collectionId;
                        }
                        Store.updateView(view.id, { extraDbs: [...extra, { collectionId: ziel, an: true }] });
                        App.zeichneSeite();
                        UI.toast('Datenquelle hinzugefügt');
                    });
                    return;
                }
                if (b.dataset.q === 'wechseln') {
                    const alle = Object.values(Store.cache.collections);
                    const m2 = UI.menuMitSuche(alle.map(c => `<button data-c="${c.id}"${c.id === coll.id ? ' class="on"' : ''}>` +
                        `<span class="mi">⛁</span>${esc(c.name)}</button>`).join(''), r.left, r.bottom + 4, { platzhalter: 'Datenquelle suchen …', kopf: '<div class="grp">Quelle wechseln</div>' });
                    m2.addEventListener('click', ev => {
                        const c = elVon(ev)?.closest('[data-c]');
                        if (!c || c.dataset.c === coll.id) {
                            m2.remove();
                            return;
                        }
                        Store.updateView(view.id, { collectionId: c.dataset.c, filters: { operator: 'and', rules: [] }, sorts: [] });
                        m2.remove();
                        App.zeichneSeite();
                        UI.toast('Ansicht zeigt jetzt: ' + (Store.cache.collections[c.dataset.c ?? ''] || {}).name);
                    });
                }
            });
        };
        zeichnen();
    };
    /* ------------------------------------------------------------------------
     * WEITERE EINSTELLUNGEN
     * Notion versteckt hinter „⋯ Weitere Einstellungen" fünf Dinge, die eine
     * Datenbank von einer Tabelle unterscheiden: Unter-Elemente,
     * Abhängigkeiten, Verbindungen, Seitenlayout und Aufgaben.
     * ----------------------------------------------------------------------*/
    /** Die zwei Spalten, die Notion beim Einschalten der Unter-Elemente anlegt. */
    const UNTER_KEYS = { eltern: 'unterEltern', kinder: 'unterKinder' };
    const ABH_KEYS = { blockiert: 'abhBlockiert', blockiertVon: 'abhBlockiertVon' };
    const unterElementeAn = (coll, an) => {
        if (an) {
            coll.unterElemente = true;
            if (!coll.schema[UNTER_KEYS.eltern])
                coll.schema[UNTER_KEYS.eltern] = { name: 'Übergeordnetes Element', type: 'relation',
                    ziel: coll.id, eigen: true };
            if (!coll.schema[UNTER_KEYS.kinder])
                coll.schema[UNTER_KEYS.kinder] = { name: 'Untergeordnete Elemente', type: 'relation',
                    ziel: coll.id, eigen: true };
        }
        else {
            coll.unterElemente = false;
        }
        Store.updateCollection(coll.id, { schema: coll.schema, unterElemente: coll.unterElemente });
        App.zeichneSeite();
    };
    const abhaengigkeitenAn = (coll, an) => {
        if (an) {
            coll.abhaengigkeiten = true;
            if (!coll.schema[ABH_KEYS.blockiert])
                coll.schema[ABH_KEYS.blockiert] = { name: 'Blockiert', type: 'relation', ziel: coll.id, eigen: true };
            if (!coll.schema[ABH_KEYS.blockiertVon])
                coll.schema[ABH_KEYS.blockiertVon] = { name: 'Blockiert von', type: 'relation', ziel: coll.id, eigen: true };
        }
        else {
            coll.abhaengigkeiten = false;
        }
        Store.updateCollection(coll.id, { schema: coll.schema, abhaengigkeiten: coll.abhaengigkeiten });
        App.zeichneSeite();
    };
    /**
     * Ist eine Zeile blockiert? Notion verschiebt bei „Verschiebung
     * verwerfen" nichts; hier wird nur gewarnt, wenn eine blockierende
     * Zeile noch offen ist.
     */
    const blockiertDurch = (row, coll) => {
        if (!coll.abhaengigkeiten)
            return [];
        const ids = (row.props || {})[ABH_KEYS.blockiertVon] || [];
        return ids.map((id) => Store.getBlock(id)).filter((z) => {
            if (!z)
                return false;
            const st = Object.keys(coll.schema).find(k => coll.schema[k].type === 'status');
            const hk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'checkbox');
            if (hk)
                return !(z.props || {})[hk];
            if (st)
                return !/fertig|erledigt|done|abgeschlossen/i.test(String((z.props || {})[st] || ''));
            return true;
        });
    };
    const weitereEinstellungen = (anker, coll, _view, _block) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Weitere Einstellungen</div>' +
            `<button data-w="unter"><span class="mi">⇥</span>Unter-Elemente` +
            `<span class="ms">${coll.unterElemente ? 'an' : 'aus'} ▸</span></button>` +
            `<button data-w="abh"><span class="mi">↪</span>Abhängigkeiten` +
            `<span class="ms">${coll.abhaengigkeiten ? 'an' : 'aus'} ▸</span></button>` +
            `<button data-w="verb"><span class="mi">⊞</span>Verbindungen` +
            `<span class="ms">${(coll.verbindungen || []).length || 'keine'} ▸</span></button>` +
            '<button data-w="layout"><span class="mi">▤</span>Seitenlayout individuell anpassen<span class="ms">▸</span></button>' +
            `<button data-w="aufgaben"><span class="mi">☑</span>In Aufgaben umwandeln` +
            `<span class="ms">${coll.istAufgaben ? 'an' : 'aus'}</span></button>`, r.left, r.bottom + 4);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-w]');
            if (!b)
                return;
            const w = b.dataset.w;
            m.remove();
            if (w === 'unter') {
                unterElementePanel(coll);
                return;
            }
            if (w === 'abh') {
                abhaengigkeitenPanel(coll);
                return;
            }
            if (w === 'verb') {
                dbVerbindungenMenue(anker, coll);
                return;
            }
            if (w === 'layout') {
                seitenLayoutPanel(coll);
                return;
            }
            if (w === 'aufgaben') {
                aufgabenPanel(coll);
                return;
            }
        });
    };
    /** Ein kleiner Erklärkasten mit einem Schalter — wie bei Notion. */
    const schalterPanel = ({ titel, text, bild, an, anText, ausText, schalten }) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder we-panel">' +
                `<div class="fh">${esc(titel)}<button class="icon-btn" data-a="zu">✕</button></div>` +
                `<div class="we-text">${text}</div>` +
                (bild ? `<div class="we-bild">${bild}</div>` : '') +
                `<div class="we-fuss"><button class="we-knopf" data-a="tun">${an ? ausText : anText}</button></div>` +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="tun"]')) {
                o.remove();
                schalten(!an);
            }
        });
        return o;
    };
    const unterElementePanel = (coll) => schalterPanel({
        titel: 'Unter-Elemente',
        text: 'Teile Elemente in Schalter auf. Jede Zeile kann Unterzeilen tragen, ' +
            'die sich auf- und zuklappen lassen.',
        bild: '<div class="we-baum"><div>▾ <b>Element (übergeordnet)</b></div>' +
            '<div class="ein">▸ Element (untergeordnet)</div>' +
            '<div class="ein">▸ Element (untergeordnet)</div></div>',
        an: !!coll.unterElemente,
        anText: 'Unter-Elemente aktivieren',
        ausText: 'Unter-Elemente ausschalten',
        schalten: (an) => {
            unterElementeAn(coll, an);
            UI.toast(an ? 'Unter-Elemente sind an — im Zeilenmenü „Unterelement anlegen"'
                : 'Unter-Elemente sind aus');
        }
    });
    const abhaengigkeitenPanel = (coll) => schalterPanel({
        titel: 'Abhängigkeiten',
        text: 'Halte fest, was worauf wartet. Eine Zeile kann andere <b>blockieren</b> ' +
            'oder <b>von</b> anderen blockiert werden. Solange etwas Blockierendes ' +
            'offen ist, warnt die Zeile.',
        bild: '<div class="we-baum"><div><b>Entwurf schreiben</b> → blockiert</div>' +
            '<div class="ein">Korrektur lesen</div></div>',
        an: !!coll.abhaengigkeiten,
        anText: 'Abhängigkeiten aktivieren',
        ausText: 'Abhängigkeiten ausschalten',
        schalten: (an) => {
            abhaengigkeitenAn(coll, an);
            UI.toast(an ? 'Zwei Spalten angelegt: Blockiert und Blockiert von' : 'Abhängigkeiten sind aus');
        }
    });
    const aufgabenPanel = (coll) => schalterPanel({
        titel: 'In Aufgaben umwandeln',
        text: 'Diese Datenbank gilt dann als Aufgabenquelle. Ihre Zeilen erscheinen ' +
            'unter <b>Meine Apps → Meine Aufgaben</b>, sobald eine Person-Spalte auf ' +
            'dich zeigt.',
        an: !!coll.istAufgaben,
        anText: 'Als Aufgaben führen',
        ausText: 'Nicht mehr als Aufgaben führen',
        schalten: (an) => {
            const s = coll.schema;
            if (an) {
                if (!Object.values(s).some(d => d.type === 'status') &&
                    !Object.values(s).some(d => d.type === 'checkbox'))
                    s.aufgFertig = { name: 'Fertig', type: 'checkbox' };
                if (!Object.values(s).some(d => d.type === 'person'))
                    s.aufgWer = { name: 'Zuständig', type: 'person' };
                if (!Object.values(s).some(d => d.type === 'date'))
                    s.aufgFrist = { name: 'Frist', type: 'date' };
            }
            Store.updateCollection(coll.id, { schema: s, istAufgaben: an });
            /* Die Aufgabenseite fragt diese Liste ab */
            const q = Store.getMeta('aufgabenQuellen', null);
            if (an && q && !q.includes(coll.id))
                Store.setMeta('aufgabenQuellen', [...q, coll.id]);
            if (!an && q)
                Store.setMeta('aufgabenQuellen', q.filter((x) => x !== coll.id));
            App.zeichneSeite();
            UI.toast(an ? 'Zeilen erscheinen jetzt unter Meine Aufgaben' : 'Nicht mehr als Aufgaben geführt');
        }
    });
    const dbVerbindungenMenue = (anker, coll) => {
        const r = anker.getBoundingClientRect();
        const dienste = Verbindungen.DIENSTE || [];
        const drin = coll.verbindungen || [];
        const m = UI.menu('<div class="grp">Verbindungen dieser Datenbank</div>' +
            dienste.map(d => `<button data-v="${d.id}"><span class="mi">${d.icon || '⊞'}</span>` +
                `${esc(d.name)}<span class="ms">${drin.includes(d.id) ? 'an' : 'aus'}</span></button>`).join('') +
            '<div class="menu-fuss">Verknüpfte Dienste dürfen Zeilen dieser Datenbank ' +
            'lesen und schreiben — etwa der GitHub-Spiegel.</div>', r.left, r.bottom + 4);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('[data-v]');
            if (!b)
                return;
            const id = b.dataset.v;
            const neu = drin.includes(id) ? drin.filter((x) => x !== id) : [...drin, id];
            Store.updateCollection(coll.id, { verbindungen: neu });
            m.remove();
            App.zeichneSeite();
        });
    };
    /** Notions „Seitenlayout individuell anpassen" für die Datensatzseite. */
    const seitenLayoutPanel = (coll) => {
        const l = coll.seitenLayout || { breite: 'normal', eigenschaften: 'oben', kommentare: true, rueck: true };
        const o = document.createElement('div');
        o.className = 'overlay';
        const zeichne = () => {
            o.innerHTML =
                '<div class="finder we-panel">' +
                    '<div class="fh">Seitenlayout<button class="icon-btn" data-a="zu">✕</button></div>' +
                    '<div class="we-text">So sehen die Seiten dieser Datenbank aus, wenn man ' +
                    'eine Zeile öffnet.</div>' +
                    '<div class="we-liste">' +
                    ['<div class="grp">Breite</div>',
                        ['normal', 'Normal'], ['breit', 'Volle Breite']]
                        .map(x => Array.isArray(x)
                        ? `<button data-b="${x[0]}">${x[1]}<span class="ms">${l.breite === x[0] ? '✓' : ''}</span></button>`
                        : x).join('') +
                    '<div class="grp">Eigenschaften</div>' +
                    [['oben', 'Über dem Inhalt'], ['seite', 'Daneben'], ['zu', 'Eingeklappt']]
                        .map(([id, n]) => `<button data-e="${id}">${n}<span class="ms">${l.eigenschaften === id ? '✓' : ''}</span></button>`).join('') +
                    '<div class="grp">Auf der Seite</div>' +
                    `<button data-s="kommentare">Kommentare<span class="ms">${l.kommentare ? 'an' : 'aus'}</span></button>` +
                    `<button data-s="rueck">Rückverweise<span class="ms">${l.rueck ? 'an' : 'aus'}</span></button>` +
                    '</div>' +
                    '</div>';
        };
        zeichne();
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('[data-b]'), ei = elVon(e)?.closest('[data-e]'), s = elVon(e)?.closest('[data-s]');
            if (b)
                l.breite = b.dataset.b;
            if (ei)
                l.eigenschaften = ei.dataset.e;
            if (s && s.dataset.s)
                l[s.dataset.s] = !l[s.dataset.s];
            if (!b && !ei && !s)
                return;
            Store.updateCollection(coll.id, { seitenLayout: l });
            zeichne();
            App.zeichneSeite();
        });
    };
    /** „Datenquellen verwalten" — was gehört dieser Datenbank, wer nutzt sie? */
    const quellenVerwalten = (_anker, coll, _view, _block) => {
        const nutzer = Object.values(Store.cache.views)
            .filter(v => v.collectionId === coll.id ||
            (v.extraDbs || []).some((x) => x.collectionId === coll.id));
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder we-panel">' +
                '<div class="fh">Datenquellen verwalten<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="we-liste">' +
                `<div class="grp">${esc(coll.name)}</div>` +
                `<button data-a="umben">Umbenennen<span class="ms">${esc(coll.name)}</span></button>` +
                `<button data-a="zeilen">Zeilen<span class="ms">${Store.rowsOf(coll.id).length}</span></button>` +
                `<button data-a="spalten">Spalten<span class="ms">${Object.keys(coll.schema).length}</span></button>` +
                '<div class="grp">Wird verwendet in</div>' +
                (nutzer.length
                    ? nutzer.map(v => `<button data-v="${v.id}">${esc(v.name || 'Ansicht')}` +
                        `<span class="ms">${LAYOUT_NAMEN[v.layout] || v.layout}</span></button>`).join('')
                    : '<div class="menu-fuss">In keiner Ansicht</div>') +
                '<div class="grp">Gefahr</div>' +
                '<button data-a="leeren" class="rot">Alle Zeilen löschen</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const b = elVon(e)?.closest('[data-a]');
            if (!b)
                return;
            if (b.dataset.a === 'umben') {
                const n = await UI.frage('Name der Datenquelle', coll.name);
                if (n) {
                    Store.updateCollection(coll.id, { name: n });
                    o.remove();
                    App.zeichneSeite();
                }
            }
            if (b.dataset.a === 'leeren') {
                if (!confirm('Wirklich alle Zeilen dieser Datenquelle in den Papierkorb legen?'))
                    return;
                Store.rowsOf(coll.id).forEach(r => Store.trashBlock(r.id));
                o.remove();
                App.zeichneSeite();
                UI.toast('Zeilen in den Papierkorb gelegt');
            }
        });
    };
    /**
     * „Als ganze Seite öffnen" — die Datenbank füllt den Hauptbereich allein,
     * ohne den Text drumherum. Zurück geht es über die Krume.
     */
    const ganzeSeite = (coll, view, block) => {
        App.zeigeSonder(coll.name || 'Datenbank', (wrap) => {
            const kopf = document.createElement('h1');
            kopf.className = 'db-vollkopf';
            kopf.textContent = (coll.icon ? coll.icon + ' ' : '') + (coll.name || 'Datenbank');
            wrap.appendChild(kopf);
            const b2 = block
                ? Object.assign({}, block, { aktiveView: view.id, voll: true })
                : { id: 'voll-' + coll.id, collectionId: coll.id, aktiveView: view.id, voll: true };
            wrap.appendChild(render(b2));
        });
    };
    const ansichtMenue = (anker, coll, view, block) => {
        const r = anker.getBoundingClientRect();
        const sichtbar = Object.keys(coll.schema).filter(k => !(view.hidden || []).includes(k)).length;
        const LAY_ICON = { table: '▦', board: '▤', list: '☰', gallery: '▩', calendar: '📅',
            timeline: '▬', chart: '📊', form: '📝', feed: '📰', map: '🗺',
            dashboard: '🧮' };
        const kopfKarte = '<div class="av-karte">' +
            `<span class="av-ico">${LAY_ICON[view.layout] || '▦'}</span>` +
            `<input class="av-name" value="${esc(view.name || 'Ansicht')}" spellcheck="false">` +
            '<button class="av-info" data-info="1" title="Beschreibung">ⓘ</button>' +
            '</div>' +
            (view.beschreibung ? `<div class="av-besch">${esc(view.beschreibung)}</div>` : '');
        const m = UI.menuMitSuche('<div class="grp">Einstellungen ansehen</div>' +
            `<button data-a="layout"><span class="mi">▦</span>Layout` +
            `<span class="ms">${LAYOUT_NAMEN[view.layout] || view.layout} ▸</span></button>` +
            `<button data-a="sichtbar"><span class="mi">👁</span>Sichtbarkeit von Eigenschaften` +
            `<span class="ms">${sichtbar} ▸</span></button>` +
            `<button data-a="filter"><span class="mi">⚟</span>Filter` +
            `<span class="ms">${regelAnzahl(view.filters) || ''} ▸</span></button>` +
            `<button data-a="sort"><span class="mi">↕</span>Sortierung` +
            `<span class="ms">${(view.sorts || []).length || ''} ▸</span></button>` +
            `<button data-a="gruppe"><span class="mi">⊞</span>Gruppieren` +
            `<span class="ms">${view.groupBy ? esc(coll.schema[view.groupBy]?.name || '') : ''} ▸</span></button>` +
            `<button data-a="farbe"><span class="mi">🎨</span>Bedingte Farbe` +
            `<span class="ms">${(view.farbregeln || []).length || ''} ▸</span></button>` +
            '<button data-a="vlink"><span class="mi">🔗</span>Link zur Ansicht kopieren</button>' +
            '<hr>' +
            '<div class="grp">Einstellungen zu Datenquellen</div>' +
            `<button data-a="quelle"><span class="mi">⛁</span>Quelle<span class="ms">${esc(coll.name)}` +
            `${(view.extraDbs || []).length ? ' +' + view.extraDbs.length : ''} ▸</span></button>` +
            '<button data-a="eigen"><span class="mi">☰</span>Eigenschaften bearbeiten<span class="ms">▸</span></button>' +
            '<button data-a="auto"><span class="mi">⚡</span>Automatisierungen<span class="ms">▸</span></button>' +
            '<button data-a="kiauto"><span class="mi">✨</span>KI-Autofill<span class="ms">▸</span></button>' +
            `<button data-a="archiv"><span class="mi">🗄</span>Archivierte Seiten` +
            `<span class="ms">${view.archivZeigen ? 'sichtbar' : 'versteckt'}</span></button>` +
            '<button data-a="mehr"><span class="mi">⋯</span>Weitere Einstellungen<span class="ms">▸</span></button>' +
            '<hr>' +
            '<button data-a="ganzeseite"><span class="mi">⤢</span>Als ganze Seite öffnen</button>' +
            '<hr>' +
            '<button data-a="qverwalten"><span class="mi">⛁</span>Datenquellen verwalten<span class="ms">▸</span></button>' +
            `<button data-a="dblock"><span class="mi">🔒</span>${coll.gesperrt ? 'Datenbank entsperren' : 'Datenbank sperren'}</button>` +
            '<hr>' +
            '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
            '<button data-a="dup"><span class="mi">⧉</span>Duplizieren</button>' +
            '<button data-a="vorlage"><span class="mi">🔖</span>Ansichtsvorlagen<span class="ms">▸</span></button>' +
            '<button data-a="lock"><span class="mi">🔒</span>' + (view.locked ? 'Entsperren' : 'Ansicht sperren') + '</button>' +
            '<button data-a="del"><span class="mi">🗑</span>Ansicht löschen</button>', r.left, r.bottom + 4, { platzhalter: 'Einstellung suchen …', breite: '300px',
            titel: 'Einstellungen', kopf: kopfKarte });
        /* Der ⓘ-Knopf in der Kopfkarte */
        m.querySelector('[data-info]')?.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            const t = await UI.frage('Beschreibung dieser Ansicht', view.beschreibung || '');
            if (t !== null) {
                Store.updateView(view.id, { beschreibung: t });
                m.remove();
                App.zeichneSeite();
            }
        });
        /* Name der Ansicht direkt in der Kopfkarte ändern */
        const nf = m.querySelector('.av-name');
        if (!nf)
            return;
        if (nf) {
            const uebernehmen = () => {
                const n = nf.value.trim();
                if (n && n !== view.name) {
                    Store.updateView(view.id, { name: n });
                    App.zeichneSeite();
                }
            };
            nf.addEventListener('blur', uebernehmen);
            nf.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    uebernehmen();
                    m.remove();
                }
                ev.stopPropagation();
            });
        }
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            m.remove();
            const a2 = b.dataset.a;
            if (a2 === 'layout') {
                layoutPanel(coll, view, block);
                return;
            }
            if (a2 === 'sichtbar') {
                eigenschaftenMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'filter') {
                filterMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'sort') {
                sortMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'gruppe') {
                gruppierenMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'farbe') {
                farbregelPanel(coll, view, block);
                return;
            }
            if (a2 === 'auto') {
                automationenMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'eigen') {
                eigenschaftenMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'kiauto') {
                kiAutofillMenue(anker, coll, view);
                return;
            }
            if (a2 === 'quelle') {
                m.remove();
                quelleMenue(anker, coll, view, block);
                return;
            }
            if (a2 === 'mehr') {
                weitereEinstellungen(anker, coll, view, block);
                return;
            }
            if (a2 === 'ganzeseite') {
                ganzeSeite(coll, view, block);
                return;
            }
            if (a2 === 'qverwalten') {
                quellenVerwalten(anker, coll, view, block);
                return;
            }
            if (a2 === 'archiv') {
                Store.updateView(view.id, { archivZeigen: !view.archivZeigen });
                App.zeichneSeite();
                UI.toast(view.archivZeigen ? 'Archivierte Seiten versteckt' : 'Archivierte Seiten sichtbar');
                return;
            }
            if (a2 === 'dblock') {
                Store.updateCollection(coll.id, { gesperrt: !coll.gesperrt });
                App.zeichneSeite();
                UI.toast(coll.gesperrt ? 'Datenbank entsperrt' : 'Datenbank gesperrt — Aufbau lässt sich nicht mehr ändern');
                return;
            }
            if (a2 === 'vlink') {
                const link = location.origin + location.pathname + '#' +
                    (block ? block.id : coll.id) + '/' + view.id;
                Ablage.kopiereJetzt(link, 'Link zur Ansicht kopiert');
                return;
            }
            if (b.dataset.a === 'rename') {
                const n = prompt('Name der Ansicht', view.name);
                if (n) {
                    Store.updateView(view.id, { name: n });
                    App.zeichneSeite();
                }
            }
            if (b.dataset.a === 'dup') {
                const v = Store.addView(coll.id, view.layout, view.name + ' Kopie');
                if (v)
                    Store.updateView(v.id, ansichtKopie(view));
                UI.toast('Ansicht dupliziert — alle Einstellungen übernommen');
                App.zeichneSeite();
            }
            if (b.dataset.a === 'vorlage') {
                ansichtVorlagen(anker, coll, view);
                return;
            }
            if (b.dataset.a === 'lock') {
                Store.updateView(view.id, { locked: !view.locked });
                App.zeichneSeite();
            }
            if (b.dataset.a === 'del') {
                Store.removeView(view.id);
                App.zeichneSeite();
            }
        });
    };
    /** Alle Einstellungen einer Ansicht — ohne das, was zur Ansicht selbst gehört. */
    const ANSICHT_EIGEN = ['id', 'collectionId', 'name', 'created'];
    const ansichtKopie = (view) => {
        const k = {};
        Object.keys(view).forEach(f => {
            if (ANSICHT_EIGEN.includes(f))
                return;
            k[f] = (view[f] && typeof view[f] === 'object') ? JSON.parse(JSON.stringify(view[f])) : view[f];
        });
        return k;
    };
    /* Ansichtsvorlagen: eine fertig eingerichtete Ansicht bekommt einen Namen
       und lässt sich auf jede andere Datenbank anwenden. Notion kennt nur
       Seitenvorlagen, keine Ansichtsvorlagen. */
    const ansichtVorlagen = (anker, coll, view) => {
        const r = anker.getBoundingClientRect();
        const liste = Store.getMeta('ansichtVorlagen', []) || [];
        const m = UI.menu('<div class="grp">Gespeicherte Ansichten</div>' +
            (liste.length
                ? liste.map((v, i) => `<button data-v="${i}"><span class="mi">🔖</span>${esc(v.name)}` +
                    `<span class="ms">${LAYOUT_NAMEN[v.daten.layout] || v.daten.layout}</span></button>`).join('')
                : '<div class="mhinweis">Noch keine Ansichtsvorlage gespeichert.</div>') +
            '<hr><button data-a="neu"><span class="mi">＋</span>Diese Ansicht als Vorlage speichern</button>' +
            (liste.length ? '<button data-a="weg"><span class="mi">🗑</span>Eine Vorlage löschen</button>' : ''), r.left, r.bottom + 4);
        m.addEventListener('click', async (e) => {
            const v = elVon(e)?.closest('[data-v]');
            const a = elVon(e)?.closest('[data-a]');
            if (v) {
                const vor = liste[Number(v.dataset.v)];
                const neu = Store.addView(coll.id, vor.daten.layout || 'table', vor.name);
                /* Nur Einstellungen übernehmen, deren Spalten es hier auch gibt. */
                const d = JSON.parse(JSON.stringify(vor.daten));
                const gibt = (k) => !k || !!coll.schema[k];
                if (!gibt(d.groupBy))
                    d.groupBy = '';
                if (!gibt(d.bahnKey))
                    d.bahnKey = '';
                if (!gibt(d.startKey))
                    delete d.startKey;
                if (!gibt(d.endeKey))
                    delete d.endeKey;
                d.sorts = (d.sorts || []).filter((s) => s.formel || gibt(s.key));
                d.hidden = (d.hidden || []).filter(gibt);
                d.calc = Object.fromEntries(Object.entries(d.calc || {}).filter(([k]) => gibt(k)));
                d.filters = { operator: (d.filters || {}).operator || 'and',
                    rules: ((d.filters || {}).rules || []).filter((x) => x.rules || gibt(x.key)) };
                delete d.extraDbs;
                if (neu)
                    Store.updateView(neu.id, d);
                m.remove();
                App.zeichneSeite();
                UI.toast('Ansicht „' + vor.name + '" angelegt');
                return;
            }
            if (a && a.dataset.a === 'neu') {
                m.remove();
                const n = await UI.frage('Name der Ansichtsvorlage', view.name || 'Ansicht');
                if (!n)
                    return;
                liste.push({ name: n, daten: ansichtKopie(view) });
                Store.setMeta('ansichtVorlagen', liste);
                UI.toast('Ansichtsvorlage „' + n + '" gespeichert');
                return;
            }
            if (a && a.dataset.a === 'weg') {
                m.innerHTML = '<div class="grp">Welche Vorlage löschen?</div>' +
                    liste.map((v2, i) => `<button data-del="${i}">🗑 ${esc(v2.name)}</button>`).join('');
                m.addEventListener('click', ev => {
                    const d = elVon(ev)?.closest('[data-del]');
                    if (!d)
                        return;
                    liste.splice(Number(d.dataset.del), 1);
                    Store.setMeta('ansichtVorlagen', liste);
                    m.remove();
                    UI.toast('Vorlage gelöscht');
                });
            }
        });
    };
    /* ------------------------------------------------------------------------
     * FILTER-EDITOR
     * ------------------------------------------------------------------------
     * Notions „Advanced filter": Regeln und Gruppen, UND oder ODER, mehrere
     * Ebenen tief. Jede Zeile lässt sich einzeln ändern.
     * ----------------------------------------------------------------------*/
    const filterMenue = (_anker, coll, view, _block) => {
        view.filters = view.filters || { operator: 'and', rules: [] };
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(700px,95vw)">' +
                '<div class="fh">⚟ Filter<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="filter-baum" id="fb"></div>' +
                '<div class="fbtns">' +
                '<button data-a="regel">＋ Regel</button>' +
                '<button data-a="gruppe">＋ Gruppe</button>' +
                '<button data-a="vorlagen">🔖 Vorlagen</button>' +
                '<button data-a="kifilter">✨ KI</button>' +
                '<button data-a="leeren">Alle entfernen</button>' +
                '<button data-a="ok" class="prim">Fertig</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        const keys = Object.keys(coll.schema);
        /* Braucht dieser Operator überhaupt einen Wert? */
        const ohneWert = (op) => /^(ist leer|ist nicht leer|ist aktiviert|ist nicht aktiviert|ist heute|ist gestern|ist morgen|ist diese Woche|ist letzte Woche|ist nächste Woche|ist dieser Monat|ist letzter Monat|ist in den|liegt in der)/.test(op);
        const zeichneGruppe = (gruppe, pfad, tiefe) => {
            const kopf = tiefe === 0 ? '' :
                `<div class="fg-kopf"><button class="fg-op" data-op="${pfad}">` +
                    `${gruppe.operator === 'or' ? 'ODER' : 'UND'}</button>` +
                    `<span>Gruppe</span>` +
                    `<button data-add-regel="${pfad}">＋ Regel</button>` +
                    `<button data-weg="${pfad}">🗑</button></div>`;
            const zeilen = gruppe.rules.map((r, i) => {
                const p2 = pfad ? pfad + '.' + i : String(i);
                if (r.rules !== undefined)
                    return zeichneGruppe(r, p2, tiefe + 1);
                const def = coll.schema[r.key] || {};
                const ops = OPERATOREN[def.type] || OPERATOREN['text'] || [];
                return '<div class="fr-zeile">' +
                    (i === 0 ? '<span class="fr-wo">Wenn</span>'
                        : `<button class="fg-op klein" data-op="${pfad}">` +
                            `${gruppe.operator === 'or' ? 'oder' : 'und'}</button>`) +
                    `<select data-k="${p2}">` +
                    keys.map(k => `<option value="${k}"${k === r.key ? ' selected' : ''}>` +
                        `${esc(coll.schema[k].name)}</option>`).join('') +
                    '</select>' +
                    `<select data-o="${p2}">` +
                    ops.map(op => `<option${op === r.op ? ' selected' : ''}>${esc(op)}</option>`).join('') +
                    '</select>' +
                    (ohneWert(r.op)
                        ? '<span class="fr-leer">—</span>'
                        : r.vergleich === 'feld'
                            ? `<select data-wk="${p2}" class="fr-feld">` +
                                keys.filter(k => k !== r.key).map(k => `<option value="${k}"${k === r.wertKey ? ' selected' : ''}>` +
                                    `${esc(coll.schema[k].name)}</option>`).join('') +
                                '</select>'
                            : `<input data-w="${p2}" value="${esc(r.wert ?? '')}" placeholder="Wert">`) +
                    (ohneWert(r.op) ? ''
                        : `<button data-vgl="${p2}" class="fr-vgl${r.vergleich === 'feld' ? ' an' : ''}" ` +
                            `title="${r.vergleich === 'feld' ? 'Vergleicht mit einer anderen Spalte' : 'Fester Wert — klicken für Spaltenvergleich'}">` +
                            `${r.vergleich === 'feld' ? '⇄' : '＝'}</button>`) +
                    `<button data-weg="${p2}" title="Regel entfernen">✕</button>` +
                    '</div>';
            }).join('');
            return `<div class="fg" data-tiefe="${tiefe}">${kopf}${zeilen ||
                '<div class="fg-leer">Noch keine Regel</div>'}</div>`;
        };
        const hole = (pfad) => {
            if (!pfad)
                return view.filters;
            let ziel = view.filters;
            const teile = pfad.split('.');
            teile.forEach((i, n) => {
                ziel = n === teile.length - 1 ? ziel.rules[+i] : ziel.rules[+i];
            });
            return ziel;
        };
        const eltern = (pfad) => {
            const teile = (pfad ?? '').split('.');
            const letzte = Number(teile.pop());
            let ziel = view.filters;
            teile.forEach((i) => ziel = ziel.rules[+i]);
            return { gruppe: ziel, index: letzte };
        };
        const speichern = () => {
            Store.updateView(view.id, { filters: view.filters });
            zeichne();
            App.zeichneSeite();
        };
        const zeichne = () => {
            fuelle(o, '#fb', `<div class="fg-wurzel"><button class="fg-op" data-op="">` +
                `${view.filters.operator === 'or' ? 'ODER' : 'UND'}</button>` +
                `<span>alle Regeln verbinden</span></div>` +
                zeichneGruppe(view.filters, '', 0));
        };
        zeichne();
        o.addEventListener('change', e => {
            const k = (htmlVon(e)?.dataset ?? {}).k, op = (htmlVon(e)?.dataset ?? {}).o, w = (htmlVon(e)?.dataset ?? {}).w;
            if (k !== undefined) {
                const r = hole(k);
                r.key = (feldVon(e)?.value ?? '');
                const ops = OPERATOREN[coll.schema[r.key].type] || OPERATOREN['text'] || [];
                if (!ops.includes(r.op))
                    r.op = ops[0];
                speichern();
            }
            if (op !== undefined) {
                hole(op).op = (feldVon(e)?.value ?? '');
                speichern();
            }
            if (w !== undefined) {
                hole(w).wert = (feldVon(e)?.value ?? '');
                speichern();
            }
            const wk = (htmlVon(e)?.dataset ?? {}).wk;
            if (wk !== undefined) {
                hole(wk).wertKey = (feldVon(e)?.value ?? '');
                speichern();
            }
        });
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]') || elVon(e)?.closest('[data-a="ok"]')) {
                o.remove();
                return;
            }
            const opB = elVon(e)?.closest('[data-op]');
            if (opB) {
                const g = hole(opB.dataset.op);
                g.operator = g.operator === 'or' ? 'and' : 'or';
                speichern();
                return;
            }
            const vgl = elVon(e)?.closest('[data-vgl]');
            if (vgl) {
                const r2 = hole(vgl.dataset.vgl);
                if (r2.vergleich === 'feld') {
                    r2.vergleich = 'wert';
                }
                else {
                    r2.vergleich = 'feld';
                    if (!r2.wertKey || r2.wertKey === r2.key)
                        r2.wertKey = keys.find(k => k !== r2.key && coll.schema[k].type === coll.schema[r2.key]?.type) ||
                            keys.find(k => k !== r2.key) || '';
                }
                speichern();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const { gruppe, index } = eltern(weg.dataset.weg);
                gruppe.rules.splice(index, 1);
                speichern();
                return;
            }
            const addR = elVon(e)?.closest('[data-add-regel]');
            if (addR) {
                const g = hole(addR.dataset.addRegel);
                const k = keys[0] ?? '';
                g.rules.push({ key: k, op: (OPERATOREN[coll.schema[k]?.type] || OPERATOREN['text'] || [])[0], wert: '' });
                speichern();
                return;
            }
            if (elVon(e)?.closest('[data-a="regel"]')) {
                const k = keys[0] ?? '';
                view.filters.rules.push({ key: k, op: (OPERATOREN[coll.schema[k]?.type] || OPERATOREN['text'] || [])[0], wert: '' });
                speichern();
                return;
            }
            if (elVon(e)?.closest('[data-a="gruppe"]')) {
                const k = keys[0] ?? '';
                view.filters.rules.push({ operator: 'or',
                    rules: [{ key: k, op: (OPERATOREN[String(coll.schema[k]?.type || 'text')] || OPERATOREN['text'] || [])[0], wert: '' }] });
                speichern();
                return;
            }
            if (elVon(e)?.closest('[data-a="leeren"]')) {
                view.filters = { operator: 'and', rules: [] };
                speichern();
                return;
            }
            if (elVon(e)?.closest('[data-a="kifilter"]')) {
                o.remove();
                KiBau.filterSchreiben(coll, view);
                return;
            }
            /* Filtervorlagen — Notion hat das nicht: einmal gebaute Filter
               bekommen einen Namen und lassen sich überall wieder anwenden. */
            if (elVon(e)?.closest('[data-a="vorlagen"]')) {
                const r2 = (htmlVon(e) ?? document.body).getBoundingClientRect();
                const liste = Store.getMeta('filterVorlagen', []) || [];
                const passend = liste.filter((v) => !v.collId || v.collId === coll.id);
                const m = UI.menu('<div class="grp">Gespeicherte Filter</div>' +
                    (passend.length ? passend.map((v, _i) => `<button data-v="${liste.indexOf(v)}"><span class="mi">🔖</span>${esc(v.name)}` +
                        `<span class="ms">${regelAnzahl(v.filters)}</span></button>`).join('')
                        : '<div class="mhinweis">Noch keine Vorlage gespeichert.</div>') +
                    '<hr><button data-a2="neu"><span class="mi">＋</span>Diesen Filter speichern</button>' +
                    (passend.length ? '<button data-a2="weg"><span class="mi">🗑</span>Eine Vorlage löschen</button>' : ''), r2.left, r2.top - 10);
                m.addEventListener('click', async (ev) => {
                    const v = elVon(ev)?.closest('[data-v]');
                    const a3 = elVon(ev)?.closest('[data-a2]');
                    if (v) {
                        view.filters = JSON.parse(JSON.stringify(liste[Number(v.dataset.v)].filters));
                        m.remove();
                        speichern();
                        return;
                    }
                    if (a3 && a3.dataset.a2 === 'neu') {
                        m.remove();
                        const n = await UI.frage('Name der Filtervorlage', '');
                        if (!n)
                            return;
                        liste.push({ name: n, collId: coll.id, filters: JSON.parse(JSON.stringify(view.filters)) });
                        Store.setMeta('filterVorlagen', liste);
                        UI.toast('Filtervorlage „' + n + '" gespeichert');
                        return;
                    }
                    if (a3 && a3.dataset.a2 === 'weg') {
                        m.innerHTML = '<div class="grp">Welche Vorlage löschen?</div>' +
                            passend.map((v2) => `<button data-del="${liste.indexOf(v2)}">🗑 ${esc(v2.name)}</button>`).join('');
                        m.addEventListener('click', ev2 => {
                            const d = elVon(ev2)?.closest('[data-del]');
                            if (!d)
                                return;
                            liste.splice(Number(d.dataset.del), 1);
                            Store.setMeta('filterVorlagen', liste);
                            m.remove();
                            UI.toast('Vorlage gelöscht');
                        });
                    }
                });
                return;
            }
        });
    };
    /* Mehrstufige Sortierung wie in Notion — dazu, was Notion nicht kann:
       nach einer Formel sortieren, ohne dafür eine Spalte anzulegen. */
    const sortMenue = (anker, coll, view, _block) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('', r.left, r.bottom + 4);
        m.style.minWidth = '270px';
        const zeichne = () => {
            const sorts = view.sorts || [];
            m.innerHTML =
                '<div class="grp">Sortierung</div>' +
                    (sorts.length
                        ? sorts.map((s, i) => '<div class="so-zeile">' +
                            `<span class="so-nr">${i + 1}</span>` +
                            `<span class="so-name">${s.formel ? 'ƒ ' + esc(s.formel.slice(0, 22)) : esc(coll.schema[s.key]?.name || s.key)}</span>` +
                            `<button data-dir="${i}" title="Richtung wechseln">${s.richtung === 'ab' ? '↓' : '↑'}</button>` +
                            (i > 0 ? `<button data-hoch="${i}" title="nach oben">⌃</button>` : '') +
                            `<button data-weg="${i}" title="Entfernen">✕</button>` +
                            '</div>').join('')
                        : '<div class="mhinweis">Noch keine Sortierung — es gilt die gezogene Reihenfolge.</div>') +
                    '<hr><div class="grp">Ebene hinzufügen</div>' +
                    Object.keys(coll.schema).map(k => `<button data-k="${k}"><span class="mi">${propTyp(coll.schema[k].type).icon}</span>` +
                        `${esc(coll.schema[k].name)}</button>`).join('') +
                    '<hr><button data-a="formel"><span class="mi">ƒ</span>Nach Formel sortieren …</button>' +
                    (sorts.length ? '<button data-a="clear"><span class="mi">✕</span>Sortierung entfernen</button>' : '');
        };
        zeichne();
        const sichern = (neu) => {
            Store.updateView(view.id, { sorts: neu });
            view.sorts = neu;
            zeichne();
            App.zeichneSeite();
        };
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button');
            if (!b)
                return;
            const sorts = [...(view.sorts || [])];
            if (b.dataset.dir !== undefined) {
                const i = Number(b.dataset.dir);
                sorts[i] = { ...sorts[i], richtung: sorts[i].richtung === 'ab' ? 'auf' : 'ab' };
                sichern(sorts);
                return;
            }
            if (b.dataset.hoch !== undefined) {
                const i = Number(b.dataset.hoch);
                [sorts[i - 1], sorts[i]] = [sorts[i], sorts[i - 1]];
                sichern(sorts);
                return;
            }
            if (b.dataset.weg !== undefined) {
                sorts.splice(Number(b.dataset.weg), 1);
                sichern(sorts);
                return;
            }
            if (b.dataset.a === 'clear') {
                sichern([]);
                return;
            }
            if (b.dataset.a === 'formel') {
                const f = await UI.frage('Formel — jede Zeile wird damit gerechnet und danach sortiert', 'prop("Name")');
                if (!f)
                    return;
                sorts.push({ formel: f, richtung: 'auf' });
                sichern(sorts);
                return;
            }
            if (b.dataset.k) {
                if (sorts.some(s => s.key === b.dataset.k)) {
                    UI.toast('Diese Spalte ist schon dabei');
                    return;
                }
                sorts.push({ key: b.dataset.k, richtung: 'auf' });
                sichern(sorts);
                return;
            }
        });
    };
    const eigenschaftenMenue = (anker, coll, view, block) => {
        const r = anker.getBoundingClientRect();
        const html = '<div class="grp">Sichtbare Eigenschaften</div>' +
            Object.keys(coll.schema).map(k => {
                const aus = (view.hidden || []).includes(k);
                return `<button data-k="${k}"><span class="mi">${aus ? '☐' : '☑'}</span>` +
                    `${esc(coll.schema[k].name)}</button>`;
            }).join('') +
            '<hr><button data-a="new"><span class="mi">+</span>Neue Eigenschaft</button>';
        const m = UI.menu(html, r.left, r.bottom + 4);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button');
            if (!b)
                return;
            if (b.dataset.a === 'new') {
                m.remove();
                neueEigenschaft(anker, coll, block);
                return;
            }
            const k = b.dataset.k;
            if (!k)
                return;
            const h = view.hidden || [];
            Store.updateView(view.id, { hidden: h.includes(k) ? h.filter((x) => x !== k) : [...h, k] });
            App.zeichneSeite();
            m.remove();
        });
    };
    /**
     * Legt eine Eigenschaft an. `stelle` sagt, an welcher Position sie im
     * Schema landen soll — Notion nennt das „Links einfügen" und
     * „Rechts einfügen". Ohne Angabe kommt sie ans Ende.
     */
    const eigenschaftAnlegen = async (coll, t, stelle = -1, neben = null) => {
        const name = await UI.frage('Name der Eigenschaft', propTyp(t).name);
        if (!name)
            return null;
        /* Ids.short, nie uid().slice: ein rein numerischer Schlüssel wandert
           in Object.keys an Position 0, und die Spalte stünde immer vorn (E96). */
        const key = Ids.short(5);
        const def = { name, type: t };
        if (['select', 'status', 'multi'].includes(t))
            def.options = [];
        if (t === 'formula') {
            const f = await UI.frage('Formel eingeben, z. B.  prop("Zahl") * 2', '');
            def.formula = f || '';
        }
        if (t === 'relation') {
            const andere = Object.values(Store.cache.collections);
            def.ziel = (andere.find(c => c.id !== coll.id) || andere[0] || {}).id || '';
        }
        if (t === 'rollup')
            def.rollup = 'Anzahl alle';
        if (KI_TYPEN.includes(t))
            def.auftrag = KI_AUFTRAG[t] || KI_AUFTRAG['ki'];
        if (t === 'button')
            def.knopfText = 'Ausführen';
        /* Die Stelle jetzt bestimmen, nicht vorhin: dazwischen lagen zwei
           Fragen an den Menschen, und das Schema kann sich geändert haben. */
        if (neben && neben.nebenKey) {
            const i = Object.keys(coll.schema).indexOf(neben.nebenKey);
            stelle = i < 0 ? Object.keys(coll.schema).length : i + (neben.versatz ?? 0);
        }
        if (stelle < 0) {
            coll.schema[key] = def;
        }
        else {
            /* Reihenfolge der Schlüssel bestimmt die Spaltenfolge — also neu bauen */
            const keys = Object.keys(coll.schema);
            const neu = {};
            keys.slice(0, stelle).forEach(k => { neu[k] = coll.schema[k]; });
            neu[key] = def;
            keys.slice(stelle).forEach(k => { neu[k] = coll.schema[k]; });
            coll.schema = neu;
        }
        Store.updateCollection(coll.id, { schema: coll.schema });
        App.zeichneSeite();
        if (t === 'rollup')
            rollupEditor(coll, key);
        if (t === 'relation')
            relationEinrichten(coll, key);
        return key;
    };
    /** Typauswahl mit Suche — dieselbe Liste wie beim Ändern eines Typs. */
    const typWahl = (anker, titel, danach) => {
        const r = anker.getBoundingClientRect();
        const html = typGruppen().map(([name, ids]) => `<div class="grp">${name}</div>` +
            '<div class="typ-gitter">' +
            ids.filter((id) => TYPEN.some((x) => x.id === id)).map((id) => {
                const t = TYPEN.find((x) => x.id === id);
                return `<button data-t="${t.id}"><span class="mi">${t.icon}</span>${esc(t.name)}</button>`;
            }).join('') +
            '</div>').join('');
        const m = UI.menuMitSuche(html, r.left, r.bottom + 4, { platzhalter: 'Typ auswählen …', breite: '340px', kopf: `<div class="grp">${esc(titel)}</div>` });
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-t]');
            if (!b)
                return;
            m.remove();
            danach(b.dataset.t);
        });
        return m;
    };
    const neueEigenschaft = (anker, coll, _block) => typWahl(anker, 'Neue Eigenschaft', (t) => eigenschaftAnlegen(coll, t, -1));
    /**
     * „Links einfügen" und „Rechts einfügen" — und zwar neben DIESER Spalte.
     *
     * HIER STAND EINE ZAHL, UND DAS WAR DER FEHLER. Das Spaltenmenü rechnete
     * beim Öffnen `idx = keys.indexOf(key)` aus und reichte `idx + 1` weiter.
     * Zwischen dem Öffnen des Menüs und dem Anlegen liegen aber zwei Fragen an
     * den Menschen — die Typwahl und der Name —, und in der Zeit kann sich das
     * Schema geändert haben. Fand `indexOf` den Schlüssel nicht, kam **−1**
     * heraus, und `−1 + 1` ist `0`: die neue Spalte landete **ganz vorn**.
     *
     * Nachgestellt: von drei Läufen einer. `test33` hat es als „flockig"
     * gemeldet, und das sah lange nach einem Fehler im Prüflauf aus.
     *
     * Jetzt wird die Stelle erst beim Anlegen bestimmt, aus dem Schema, das
     * dann wirklich da ist. Und wenn die Nachbarspalte inzwischen weg ist,
     * geht die neue ans **Ende** — nicht an den Anfang. Ans Ende ist harmlos
     * und nachvollziehbar; ganz vorn ist der einzige Platz, an dem niemand
     * sie sucht.
     */
    const neueEigenschaftNeben = (anker, coll, _view, nebenKey, versatz) => typWahl(anker, versatz === 0 ? 'Links einfügen' : 'Rechts einfügen', (t) => eigenschaftAnlegen(coll, t, -1, { nebenKey, versatz }));
    /* „Eigenschaft links/rechts einfügen". Der Unterstrich sagt: hier ruft im
       Modul selbst niemand an — der Weg führt über das Spaltenmenü, das
       `typWahl` und `eigenschaftAnlegen` direkt benutzt. Die Hülle bleibt,
       weil sie beide Schritte an einer Stelle zeigt. */
    const neueEigenschaftBei = (anker, coll, _view, stelle) => typWahl(anker, stelle === 0 ? 'Links einfügen' : 'Neue Eigenschaft', (t) => eigenschaftAnlegen(coll, t, stelle));
    /* ------------------------------------------------------------------------
     * TYP-AUSWAHL
     * ------------------------------------------------------------------------
     * Wie in Notion: oben die KI-Felder als eigene Gruppe, darunter alle Typen
     * in zwei Spalten, mit Suchfeld. Bei über dreissig Typen findet man sonst
     * nichts mehr.
     * ----------------------------------------------------------------------*/
    const TYP_GRUPPEN = [
        ['KI-Autofill', ['ki-fassung', 'ki-sprache', 'ki-worte', 'ki']],
        ['Basis', ['text', 'number', 'select', 'multi', 'status', 'date', 'person',
                'files', 'checkbox', 'sterne', 'prozent', 'url', 'email', 'phone',
                'duration', 'place']],
        ['Rechnen', ['formula', 'relation', 'rollup', 'uid', 'button', 'verify']],
        ['Automatisch', ['created', 'edited', 'createdBy', 'editedBy']],
        ['Verbindungen', ['gdrive', 'figma', 'githubpr', 'zendesk']]
    ];
    /* `title` steht mit Absicht in keiner Gruppe: eine Spalte lässt sich nicht
       in den Titel verwandeln, es gibt genau einen. */
    const NICHT_WAEHLBAR = ['title'];
    /**
     * Die Gruppen des Menüs — plus eine Auffanggruppe für alles, was im
     * Register steht und oben nicht genannt ist.
     *
     * WARUM DIE AUFFANGGRUPPE NÖTIG IST. `TYP_GRUPPEN` ist eine
     * Literalliste, `Register.eigenschaften` die Wahrheit. Heute decken sich
     * beide — 34 hier, 35 dort, und der Unterschied ist `title`. Wer aber
     * einen Typ ins Register einträgt und diese Liste vergisst, bekommt
     * einen Typ, den es gibt und den niemand auswählen kann: kein Fehler,
     * keine Meldung, nur ein Eintrag, der im Menü fehlt.
     *
     * Das Register hat für genau diesen Fall `inGruppe('Weiteres')`. Hier
     * dasselbe, damit nichts hinten runterfällt. `test142` prüft, dass die
     * Auffanggruppe im Normalfall LEER ist — sonst wäre sie eine Ausrede
     * dafür, die Gliederung nicht zu pflegen.
     */
    const typGruppen = () => {
        const genannt = new Set(TYP_GRUPPEN.flatMap(([, ids]) => ids).concat(NICHT_WAEHLBAR));
        const rest = TYPEN.map((t) => t.id).filter((id) => !genannt.has(id));
        return rest.length
            ? [...TYP_GRUPPEN, ['Weiteres', rest]]
            : TYP_GRUPPEN;
    };
    const typMenue = (anker, coll, key) => {
        const def = coll.schema[key];
        const r = anker.getBoundingClientRect();
        const html = typGruppen().map(([name, ids]) => `<div class="grp">${name}</div>` +
            '<div class="typ-gitter">' +
            ids.filter((id) => TYPEN.some((t) => t.id === id)).map((id) => {
                const t = TYPEN.find((x) => x.id === id);
                return `<button data-t="${t.id}" class="${def.type === t.id ? 'on' : ''}">` +
                    `<span class="mi">${t.icon}</span>${esc(t.name)}</button>`;
            }).join('') +
            '</div>').join('');
        const m = UI.menuMitSuche(html, r.left, r.bottom + 2, {
            platzhalter: 'Typ auswählen …',
            breite: '340px',
            fuss: 'Jetzt: <b>' + esc(propTyp(def.type).name) + '</b>'
        });
        m.addEventListener('click', ev => {
            const t = elVon(ev)?.closest('button[data-t]');
            if (!t)
                return;
            def.type = t.dataset.t;
            if (['select', 'status', 'multi'].includes(def.type) && !def.options)
                def.options = [];
            if (def.type === 'formula' && !def.formula)
                def.formula = '';
            if (KI_TYPEN.includes(def.type) && !def.auftrag)
                def.auftrag = KI_AUFTRAG[def.type];
            Store.updateCollection(coll.id, { schema: coll.schema });
            m.remove();
            App.zeichneSeite();
            UI.toast('Typ geändert: ' + propTyp(def.type).name);
        });
    };
    /**
     * Der Dialog für die Prüfregeln einer Spalte.
     * Zeigt am Ende, wie viele bestehende Zeilen die neuen Regeln verletzen —
     * damit man nicht blind eine Regel setzt, gegen die die halbe Datenbank
     * verstösst.
     */
    const regelnDialog = (coll, key) => {
        const def = coll.schema[key];
        const zahl = ['number', 'duration'].includes(def.type);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(560px,94vw)">' +
                `<div class="fh">✔ Prüfregeln für „${esc(def.name)}"` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
                '<label style="display:flex; gap:9px; align-items:center">' +
                `<input type="checkbox" id="rp"${def.pflicht ? ' checked' : ''}> ` +
                'Pflichtfeld — darf nicht leer bleiben</label>' +
                '<label style="display:flex; gap:9px; align-items:center">' +
                `<input type="checkbox" id="re"${def.eindeutig ? ' checked' : ''}> ` +
                'Eindeutig — jeder Wert nur einmal in dieser Datenbank</label>' +
                (zahl
                    ? '<div style="display:flex; gap:10px">' +
                        `<label style="flex:1">Kleinster Wert<br><input id="rmin" type="number" value="${def.regelMin ?? ''}"></label>` +
                        `<label style="flex:1">Grösster Wert<br><input id="rmax" type="number" value="${def.regelMax ?? ''}"></label>` +
                        '</div>'
                    : '<label>Muster, dem der Text entsprechen muss<br>' +
                        '<select id="rmv">' + MUSTER_VORLAGEN.map(([w, n]) => `<option value="${esc(w)}"${def.muster === w ? ' selected' : ''}>${n}</option>`).join('') +
                        '</select>' +
                        `<input id="rm" value="${esc(def.muster || '')}" placeholder="eigener regulärer Ausdruck" style="margin-top:6px">` +
                        `<input id="rmt" value="${esc(def.musterText || '')}" placeholder="Was soll dastehen, wenn es nicht passt?" style="margin-top:6px">` +
                        '</label>') +
                /* Statusübergänge — Notion kennt sie nicht: dort darf jeder Wert
                   auf jeden anderen springen. */
                ((def.type === 'status' || def.type === 'select') && (def.options || []).length
                    ? '<div class="ue-block"><b>Erlaubte Übergänge</b>' +
                        '<div class="ue-hinweis">Je Wert: worauf darf er springen? Nichts angehakt ' +
                        'heisst: alles erlaubt.</div>' +
                        def.options.map((o2) => `<div class="ue-zeile"><span class="tag bg-${o2.color || 'gray'}">${esc(o2.name)}</span>` +
                            '<span class="ue-pfeil">→</span>' +
                            def.options.filter((z) => z.name !== o2.name).map((z) => `<label class="ue-w"><input type="checkbox" data-von="${esc(o2.name)}" ` +
                                `data-nach="${esc(z.name)}"` +
                                (((def.uebergaenge || {})[o2.name] || []).includes(z.name) ? ' checked' : '') +
                                `> ${esc(z.name)}</label>`).join('') +
                            '</div>').join('') +
                        '</div>'
                    : '') +
                '<label>Freie Regel als Formel — sie muss wahr ergeben<br>' +
                `<input id="rr" value="${esc(def.regel || '')}" ` +
                'placeholder=\'if(prop("Status") == "Fertig", not empty(prop("Abschluss")), true)\'>' +
                `<input id="rrt" value="${esc(def.regelText || '')}" placeholder="Erklärung, wenn die Regel nicht zutrifft" style="margin-top:6px">` +
                '</label>' +
                '<div id="rbericht" style="font-size:13px; color:var(--text-dim)"></div>' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="pruefen">Bestehende Zeilen prüfen</button>' +
                '<button data-a="weg">Alle Regeln entfernen</button>' +
                '<button data-a="ok" class="prim">Speichern</button>' +
                '<button data-a="zu">Abbrechen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const lesen = () => ({
            pflicht: o.querySelector('#rp')?.checked,
            eindeutig: o.querySelector('#re')?.checked,
            muster: o.querySelector('#rm') ? o.querySelector('#rm')?.value.trim() : '',
            musterText: o.querySelector('#rmt') ? o.querySelector('#rmt')?.value.trim() : '',
            regelMin: o.querySelector('#rmin') ? o.querySelector('#rmin')?.value : '',
            regelMax: o.querySelector('#rmax') ? o.querySelector('#rmax')?.value : '',
            regel: o.querySelector('#rr')?.value.trim(),
            regelText: o.querySelector('#rrt')?.value.trim(),
            uebergaenge: (() => {
                const u = {};
                o.querySelectorAll('[data-von]').forEach(cb => {
                    if (!cb.checked || !cb.dataset.von)
                        return;
                    (u[cb.dataset.von] = u[cb.dataset.von] || []).push(cb.dataset.nach);
                });
                return Object.keys(u).length ? u : undefined;
            })()
        });
        o.querySelector('#rmv')?.addEventListener('change', (e) => {
            const w = feldVon(e)?.value ?? '';
            const rm = o.querySelector('#rm');
            if (w && rm)
                rm.value = w;
        });
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="pruefen"]')) {
                const probe = { ...def, ...lesen() };
                const alt = coll.schema[key];
                coll.schema[key] = probe;
                const schlecht = Store.rowsOf(coll.id)
                    .map(r => ({ r, f: pruefeWert(coll, key, r, (r.props || {})[key]) }))
                    .filter(x => !x.f.ok);
                coll.schema[key] = alt;
                fuelle(o, '#rbericht', schlecht.length
                    ? `⚠ <b>${schlecht.length}</b> von ${Store.rowsOf(coll.id).length} Zeilen verstossen dagegen:<br>` +
                        schlecht.slice(0, 6).map(x => '· ' + esc(x.r.text || 'Ohne Titel') + ' — ' + esc(x.f.fehler)).join('<br>') +
                        (schlecht.length > 6 ? `<br>… und ${schlecht.length - 6} weitere` : '')
                    : '✅ Alle ' + Store.rowsOf(coll.id).length + ' Zeilen halten die Regeln ein.');
                return;
            }
            if (elVon(e)?.closest('[data-a="weg"]')) {
                ['pflicht', 'eindeutig', 'muster', 'musterText', 'regelMin', 'regelMax', 'regel',
                    'regelText', 'uebergaenge'].forEach(k2 => delete coll.schema[key][k2]);
                Store.updateCollection(coll.id, { schema: coll.schema });
                o.remove();
                App.zeichneSeite();
                UI.toast('Regeln entfernt');
                return;
            }
            if (elVon(e)?.closest('[data-a="ok"]')) {
                Object.assign(coll.schema[key], lesen());
                /* Leere Angaben wieder wegräumen, damit hatRegeln() stimmt */
                ['muster', 'musterText', 'regel', 'regelText', 'regelMin', 'regelMax', 'uebergaenge']
                    .forEach(k2 => {
                    if (coll.schema[key][k2] === '' || coll.schema[key][k2] === undefined)
                        delete coll.schema[key][k2];
                });
                if (!coll.schema[key].pflicht)
                    delete coll.schema[key].pflicht;
                if (!coll.schema[key].eindeutig)
                    delete coll.schema[key].eindeutig;
                Store.updateCollection(coll.id, { schema: coll.schema });
                o.remove();
                App.zeichneSeite();
                UI.toast(hatRegeln(coll.schema[key]) ? 'Prüfregeln gespeichert' : 'Keine Regeln gesetzt');
            }
        });
    };
    const spaltenMenue = (anker, coll, view, key, _block) => {
        /* Eine gesperrte Datenbank lässt ihren Aufbau nicht mehr ändern —
           Werte darf man weiter eintragen. Genau wie bei Notion. */
        if (coll.gesperrt) {
            UI.toast('Diese Datenbank ist gesperrt. Über das Ansichtsmenü lässt sie sich entsperren.');
            return;
        }
        const r = anker.getBoundingClientRect();
        const def = coll.schema[key];
        const keys = Object.keys(coll.schema);
        const idx = keys.indexOf(key);
        const umbruchAn = (view.umbruch || []).includes(key);
        const m = UI.menu(
        /* Kopf wie bei Notion: Symbol, Namensfeld, ⓘ für die Beschreibung */
        '<div class="sp-kopf">' +
            `<button class="sp-icon" data-a="icon" title="Symbol wählen">${def.icon || propTyp(def.type).icon}</button>` +
            `<input class="sp-name" value="${esc(def.name)}" spellcheck="false" placeholder="Eigenschaftsnamen eingeben …">` +
            '<button class="sp-info" data-a="beschreibung" title="Beschreibung">ⓘ</button>' +
            '</div>' +
            (def.beschreibung ? `<div class="sp-besch">${esc(def.beschreibung)}</div>` : '') +
            '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
            '<button data-a="type"><span class="mi">⇄</span>Typ ändern<span class="ms">' +
            esc(propTyp(def.type).name) + '</span></button>' +
            (def.type === 'formula' ? '<button data-a="formula"><span class="mi">∑</span>Formel bearbeiten</button>' : '') +
            (['select', 'status', 'multi'].includes(def.type)
                ? '<button data-a="optionen"><span class="mi">⊙</span>Optionen bearbeiten</button>' : '') +
            (def.type === 'relation' ? '<button data-a="relein"><span class="mi">⇄</span>Verknüpfung einrichten</button>' : '') +
            (def.type === 'rollup' ? '<button data-a="rollup"><span class="mi">⤴</span>Rollup einrichten</button>' : '') +
            (['number', 'formula', 'rollup'].includes(def.type)
                ? '<button data-a="anzeige"><span class="mi">▤</span>Anzeigen als …</button>' : '') +
            (def.type === 'uid' ? '<button data-a="praefix"><span class="mi">ID</span>Vorsilbe setzen</button>' : '') +
            (KI_TYPEN.includes(def.type) ? '<button data-a="kiauftrag"><span class="mi">✨</span>Auftrag an die KI</button>' : '') +
            (!['formula', 'rollup', 'created', 'edited', 'createdBy', 'editedBy', 'uid', 'button'].includes(def.type)
                ? `<button data-a="regeln"><span class="mi">✔</span>Prüfregeln` +
                    `<span class="ms">${hatRegeln(def) ? 'an' : 'aus'}</span></button>` +
                    `<button data-a="standard"><span class="mi">↦</span>Standardwert` +
                    `<span class="ms">${def.standard ? esc(String(def.standard)).slice(0, 12) : 'keiner'}</span></button>`
                : '') +
            '<hr>' +
            '<button data-a="asc"><span class="mi">↑</span>Aufsteigend sortieren</button>' +
            '<button data-a="desc"><span class="mi">↓</span>Absteigend sortieren</button>' +
            '<button data-a="filter"><span class="mi">⚟</span>Nach dieser Spalte filtern</button>' +
            `<button data-a="gruppe"><span class="mi">⊞</span>Gruppe` +
            `<span class="ms">${view.groupBy === key ? 'an' : 'aus'}</span></button>` +
            '<button data-a="berechnen"><span class="mi">Σ</span>Berechnen' +
            `<span class="ms">${esc(((view.calc || {})[key]) || '—')} ▸</span></button>` +
            '<hr>' +
            `<button data-a="umbruch"><span class="mi">↵</span>Text umbrechen<span class="ms">${umbruchAn ? 'an' : 'aus'}</span></button>` +
            `<button data-a="fix"><span class="mi">📌</span>Spalte fixieren` +
            `<span class="ms">${(view.fixiert || []).includes(key) ? 'an' : 'aus'}</span></button>` +
            '<button data-a="links"><span class="mi">←</span>Nach links</button>' +
            '<button data-a="rechts"><span class="mi">→</span>Nach rechts</button>' +
            '<button data-a="hide"><span class="mi">👁</span>In dieser Ansicht ausblenden</button>' +
            /* Ausblenden versteckt nur — Rechte sperren wirklich. Deshalb stehen
               beide nebeneinander und heissen verschieden. */
            (typeof Feldrechte !== 'undefined'
                ? '<button data-a="feldrechte"><span class="mi">🔒</span>Rechte für diese Spalte' +
                    `<span class="ms">${Feldrechte.stufe(coll.id, key) === 'voll' ? 'offen' : 'gesperrt'}</span></button>`
                : '') +
            '<hr>' +
            '<button data-a="neulinks"><span class="mi">⇤</span>Links einfügen</button>' +
            '<button data-a="neurechts"><span class="mi">⇥</span>Rechts einfügen</button>' +
            (def.type !== 'title'
                ? '<hr><button data-a="dup"><span class="mi">⧉</span>Eigenschaft duplizieren</button>' +
                    '<button data-a="del"><span class="mi">🗑</span>Eigenschaft löschen</button>'
                : ''), r.left, r.bottom + 2);
        /* Der Name lässt sich direkt oben im Menü ändern — wie bei Notion. */
        const nameFeld = m.querySelector('.sp-name');
        if (!nameFeld)
            return;
        if (nameFeld) {
            const uebernehmen = () => {
                const n = nameFeld.value.trim();
                if (!n || n === def.name)
                    return;
                def.name = n;
                Store.updateCollection(coll.id, { schema: coll.schema });
                App.zeichneSeite();
            };
            nameFeld.addEventListener('blur', uebernehmen);
            nameFeld.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    uebernehmen();
                    m.remove();
                }
                if (ev.key === 'Escape') {
                    ev.preventDefault();
                    m.remove();
                }
                ev.stopPropagation();
            });
            setTimeout(() => { nameFeld.focus(); nameFeld.select(); }, 30);
        }
        m.addEventListener('click', async (e) => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            if (a === 'type') {
                m.remove();
                typMenue(anker, coll, key);
                return;
            }
            /* Eigenes Symbol für die Spalte */
            if (a === 'icon') {
                UI.emojiWaehlen(b, (em) => {
                    def.icon = em;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            /* Gruppieren nach genau dieser Spalte — an oder aus */
            if (a === 'gruppe') {
                m.remove();
                const anJetzt = view.groupBy === key;
                Store.updateView(view.id, { groupBy: anJetzt ? '' : key });
                App.zeichneSeite();
                UI.toast(anJetzt ? 'Gruppierung aufgehoben' : 'Gruppiert nach ' + def.name);
                return;
            }
            /* Fussrechnung für diese Spalte */
            if (a === 'berechnen') {
                m.remove();
                rechnenMenue(anker, coll, view, key, Store.rowsOf(coll.id));
                return;
            }
            /* Neue Eigenschaft links oder rechts daneben */
            if (a === 'neulinks' || a === 'neurechts') {
                m.remove();
                neueEigenschaftNeben(anker, coll, view, key, a === 'neurechts' ? 1 : 0);
                return;
            }
            /* Untermenüs */
            if (a === 'optionen') {
                m.remove();
                optionenEditor(coll, key);
                return;
            }
            if (a === 'rollup') {
                m.remove();
                rollupEditor(coll, key);
                return;
            }
            if (a === 'regeln') {
                m.remove();
                regelnDialog(coll, key);
                return;
            }
            if (a === 'standard') {
                m.remove();
                const jetzt = def.standard ?? '';
                const neu = prompt('Standardwert für neue Zeilen in „' + def.name + '"\n' +
                    'Erlaubt sind auch heute, morgen, jetzt, {datum}, {tag}, {monat}, {jahr}, {woche}.\n' +
                    'Leer lassen entfernt ihn.', jetzt);
                if (neu === null)
                    return;
                if (neu === '')
                    delete coll.schema[key].standard;
                else
                    coll.schema[key].standard = neu;
                Store.updateCollection(coll.id, { schema: coll.schema });
                UI.toast(neu ? 'Standardwert gesetzt' : 'Standardwert entfernt');
                return;
            }
            if (a === 'anzeige') {
                m.innerHTML = '<div class="grp">Anzeigen als</div>' +
                    '<button data-z="zahl">Zahl</button><button data-z="bar">Balken</button>' +
                    '<button data-z="ring">Ring</button>' +
                    '<button data-z="skala">Farbstreifen</button>' +
                    '<button data-z="heat">Heatmap</button>';
                m.addEventListener('click', ev => {
                    const z = elVon(ev)?.closest('button[data-z]');
                    if (!z)
                        return;
                    def.anzeige = z.dataset.z === 'zahl' ? '' : z.dataset.z;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'relein') {
                m.remove();
                relationEinrichten(coll, key);
                return;
            }
            if (a === 'relziel') {
                const alle = Object.values(Store.cache.collections);
                m.innerHTML = '<div class="grp">Zieldatenbank</div>' +
                    alle.map(c => `<button data-c="${c.id}">${esc(c.name)}</button>`).join('');
                m.addEventListener('click', ev => {
                    const c = elVon(ev)?.closest('button[data-c]');
                    if (!c)
                        return;
                    def.ziel = c.dataset.c;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            m.remove();
            if (a === 'rename') {
                const n = await UI.frage('Neuer Name', def.name);
                if (n) {
                    def.name = n;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    App.zeichneSeite();
                }
            }
            if (a === 'beschreibung') {
                const t = await UI.frage('Beschreibung dieser Spalte', def.beschreibung || '');
                if (t !== null) {
                    def.beschreibung = t;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    App.zeichneSeite();
                }
            }
            if (a === 'praefix') {
                const t = await UI.frage('Vorsilbe der laufenden Nummer, z. B. AUF', def.praefix || '');
                if (t !== null) {
                    def.praefix = t;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    App.zeichneSeite();
                }
            }
            if (a === 'kiauftrag') {
                const t = await UI.frage('Was soll die KI in dieses Feld schreiben?', def.auftrag || 'Fasse diesen Eintrag in einem kurzen Satz zusammen.');
                if (t !== null) {
                    def.auftrag = t;
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    App.zeichneSeite();
                }
            }
            if (a === 'formula')
                formelEditor(coll, key);
            if (a === 'asc') {
                Store.updateView(view.id, { sorts: [{ key, richtung: 'auf' }] });
                App.zeichneSeite();
            }
            if (a === 'desc') {
                Store.updateView(view.id, { sorts: [{ key, richtung: 'ab' }] });
                App.zeichneSeite();
            }
            if (a === 'filter') {
                const ops = OPERATOREN[def.type] || OPERATOREN['text'] || [];
                view.filters = view.filters || { operator: 'and', rules: [] };
                const wert2 = ['ist leer', 'ist nicht leer', 'ist aktiviert', 'ist nicht aktiviert'].includes(ops[0] ?? '')
                    ? '' : await UI.frage(`${def.name} ${ops[0]} …`, '');
                if (wert2 === null)
                    return;
                view.filters.rules.push({ key, op: ops[0], wert: wert2 });
                Store.updateView(view.id, { filters: view.filters });
                App.zeichneSeite();
            }
            if (a === 'fix') {
                const fx = view.fixiert || [];
                Store.updateView(view.id, { fixiert: fx.includes(key) ? fx.filter((x) => x !== key) : [...fx, key] });
                App.zeichneSeite();
            }
            if (a === 'umbruch') {
                const u = view.umbruch || [];
                Store.updateView(view.id, { umbruch: u.includes(key) ? u.filter((x) => x !== key) : [...u, key] });
                App.zeichneSeite();
            }
            if (a === 'links' || a === 'rechts') {
                const ziel = a === 'links' ? idx - 1 : idx + 1;
                if (ziel < 0 || ziel >= keys.length)
                    return;
                const neuOrdnung = keys.slice();
                neuOrdnung.splice(idx, 1);
                neuOrdnung.splice(ziel, 0, key);
                const neuSchema = {};
                neuOrdnung.forEach(k => neuSchema[k] = coll.schema[k]);
                Store.updateCollection(coll.id, { schema: neuSchema });
                App.zeichneSeite();
            }
            if (a === 'hide') {
                const h = view.hidden || [];
                Store.updateView(view.id, { hidden: [...h, key] });
                App.zeichneSeite();
            }
            if (a === 'feldrechte') {
                m.remove();
                Feldrechte.fenster(coll.id);
            }
            if (a === 'dup') {
                const neuKey = Ids.short(5);
                coll.schema[neuKey] = JSON.parse(JSON.stringify(def));
                coll.schema[neuKey].name = def.name + ' Kopie';
                Store.updateCollection(coll.id, { schema: coll.schema });
                Store.rowsOf(coll.id).forEach(r => Store.setProp(r.id, neuKey, (r.props || {})[key]));
                App.zeichneSeite();
            }
            if (a === 'del') {
                /* Erst zeigen, was daran hängt — ein „Wirklich löschen?" beantwortet
                   die falsche Frage. Die richtige ist: was geht dabei kaputt? */
                const tun = () => {
                    delete coll.schema[key];
                    Store.updateCollection(coll.id, { schema: coll.schema });
                    App.zeichneSeite();
                };
                if (typeof Probelauf !== 'undefined') {
                    Probelauf.fenster({ art: 'spalteWeg', coll, key }, tun);
                }
                else {
                    if (!confirm(`„${def.name}" löschen? Die Werte in dieser Spalte gehen verloren.`))
                        return;
                    tun();
                }
            }
        });
    };
    /* --- Auswahl-Optionen bearbeiten ---------------------------------------- */
    const optionenEditor = (coll, key) => {
        const def = coll.schema[key];
        def.options = def.options || [];
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(520px,94vw)">' +
                `<div class="fh">Optionen von „${esc(def.name)}"<button class="icon-btn" data-a="zu">✕</button></div>` +
                '<div class="res" id="op"></div>' +
                '<div class="fbtns"><input id="neu" placeholder="Neue Option …" ' +
                'style="flex:1; padding:8px 10px; background:var(--bg-input); border:1px solid var(--line); ' +
                'border-radius:7px; outline:none; color:var(--text)">' +
                '<button data-a="add" class="prim">Hinzufügen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const zeichne = () => {
            fuelle(o, '#op', def.options.length
                ? def.options.map((opt, i) => `<div class="opt-zeile"><span class="tag bg-${opt.color}">${esc(opt.name)}</span>` +
                    '<div class="opt-farben">' +
                    /* Der Titel war die rohe Kennung („purple"). Jetzt der Name,
                       und das Gewählte trägt seinen Zustand, statt ihn nur zu
                       färben (§38). */
                    FARBEN.map(f => `<button data-i="${i}" data-f="${f}" ` +
                        `title="${esc(Farben.name(f))}" aria-label="${esc(Farben.name(f))}" ` +
                        `aria-pressed="${opt.color === f ? 'true' : 'false'}" ` +
                        `style="background:var(--b-${f})"></button>`).join('') +
                    '</div><button data-del="' + i + '" title="Option löschen">🗑</button></div>').join('')
                : '<div style="padding:16px; color:var(--text-faint); font-size:14px">Noch keine Optionen.</div>');
        };
        zeichne();
        const speichern = () => {
            Store.updateCollection(coll.id, { schema: coll.schema });
            zeichne();
            App.zeichneSeite();
        };
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const f = elVon(e)?.closest('button[data-f]');
            if (f) {
                def.options[Number(f.dataset.i)].color = f.dataset.f;
                speichern();
                return;
            }
            const d = elVon(e)?.closest('button[data-del]');
            if (d) {
                def.options.splice(Number(d.dataset.del), 1);
                speichern();
                return;
            }
            if (elVon(e)?.closest('[data-a="add"]')) {
                const inp = o.querySelector('#neu');
                if (!inp)
                    return;
                if (!inp.value.trim())
                    return;
                def.options.push({ name: inp.value.trim(), color: FARBEN[def.options.length % FARBEN.length] });
                inp.value = '';
                speichern();
            }
        });
        o.querySelector('#neu')?.addEventListener('keydown', e => {
            if (e.key === 'Enter')
                o.querySelector('[data-a="add"]')?.click();
        });
    };
    /* --- Rollup einrichten --------------------------------------------------- */
    const rollupEditor = (coll, key) => {
        const def = coll.schema[key];
        const relKeys = Object.keys(coll.schema).filter(k => coll.schema[k].type === 'relation');
        if (!relKeys.length) {
            UI.toast('Für ein Rollup braucht es zuerst eine Verknüpfungs-Spalte');
            return;
        }
        const relKey = def.relation && coll.schema[def.relation] ? def.relation : relKeys[0];
        const ziel = Store.getCollection(coll.schema[relKey].ziel);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(520px,94vw)">' +
                `<div class="fh">Rollup „${esc(def.name)}"<button class="icon-btn" data-a="zu">✕</button></div>` +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
                '<label>Über welche Verknüpfung?<br><select id="rel">' +
                relKeys.map(k => `<option value="${k}"${k === relKey ? ' selected' : ''}>${esc(coll.schema[k].name)}</option>`).join('') +
                '</select></label>' +
                '<label>Welche Spalte der Zieldatenbank?<br><select id="zk">' +
                (ziel ? Object.keys(ziel.schema).map(k => `<option value="${k}"${k === def.zielKey ? ' selected' : ''}>${esc(ziel.schema[k].name)}</option>`).join('')
                    : '<option value="">— erst Zieldatenbank wählen —</option>') +
                '</select></label>' +
                '<label>Wie zusammenfassen?<br><select id="art">' +
                ROLLUP_ARTEN.map(a => `<option${a === def.rollup ? ' selected' : ''}>${a}</option>`).join('') +
                '</select></label>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (!elVon(e)?.closest('[data-a="ok"]'))
                return;
            def.relation = o.querySelector('#rel')?.value;
            def.zielKey = o.querySelector('#zk')?.value;
            def.rollup = o.querySelector('#art')?.value;
            Store.updateCollection(coll.id, { schema: coll.schema });
            o.remove();
            App.zeichneSeite();
        });
    };
    const rechnenMenue = (anker, coll, view, key, _rows) => {
        const r = anker.getBoundingClientRect();
        const def = coll.schema[key];
        let liste = [...RECHNUNGEN.alle];
        if (def.type === 'number' || def.type === 'formula')
            liste = liste.concat(RECHNUNGEN.number);
        if (def.type === 'checkbox')
            liste = liste.concat(RECHNUNGEN.checkbox);
        if (['date', 'created', 'edited'].includes(def.type))
            liste = liste.concat(RECHNUNGEN.date);
        const m = UI.menu('<div class="grp">Berechnen</div>' +
            liste.map(x => `<button data-c="${esc(x)}">${x}</button>`).join(''), r.left, r.top - 10);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-c]');
            if (!b)
                return;
            view.calc = view.calc || {};
            view.calc[key] = b.dataset.c;
            Store.updateView(view.id, { calc: view.calc });
            m.remove();
            App.zeichneSeite();
        });
    };
    /* ========================================================================
     * SPALTEN AUFRÄUMEN (L27, E178)
     * ------------------------------------------------------------------------
     * Die Rechnung steht in `cleanup.ts` und ändert nichts. Hier steht der
     * Weg dorthin und — der eigentliche Punkt — die VORSCHAU: welche Zeile
     * sähe danach wie aus. Erst dann gibt es einen Knopf, der schreibt.
     * ======================================================================*/
    const aufraeumenDialog = (coll) => {
        const spalten = Aufraeumen.spalten(coll);
        if (!spalten.length) {
            UI.toast('In dieser Tabelle steht kein Text zum Aufräumen.');
            return;
        }
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(720px,95vw)">' +
                '<div class="fh">Spalten aufräumen<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:14px; display:grid; gap:10px">' +
                '<label>Spalte <select id="au-spalte">' +
                spalten.map(k => `<option value="${esc(k)}">${esc(coll.schema[k].name)}</option>`).join('') +
                '</select></label>' +
                '<div class="au-griffe">' +
                Aufraeumen.GRIFFE.map((g) => `<label class="au-griff"><input type="checkbox" data-griff="${esc(g.id)}"` +
                    `${g.id === 'rand' ? ' checked' : ''}> ${esc(g.name)}` +
                    `<span class="au-was">${esc(g.was)}</span></label>`).join('') +
                '</div>' +
                '<div class="au-ersetzen">' +
                '<label>Ersetze <input id="au-suche" placeholder="Text, wörtlich"></label>' +
                '<label>durch <input id="au-durch" placeholder="(leer = löschen)"></label>' +
                '<label class="au-ganz"><input type="checkbox" id="au-ganz"> nur ganze Zelle</label>' +
                '</div>' +
                '<div id="au-vorschau" class="au-vorschau" role="status"></div>' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="zu">Abbrechen</button>' +
                '<button data-a="tu" class="prim" disabled>Übernehmen</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        let vorschau = null;
        const knopf = o.querySelector('[data-a="tu"]');
        const kasten = o.querySelector('#au-vorschau');
        const rechne = () => {
            const key = o.querySelector('#au-spalte').value;
            const griffe = [...o.querySelectorAll('[data-griff]')]
                .filter(x => x.checked).map(x => x.dataset.griff);
            vorschau = Aufraeumen.plan(coll, key, {
                griffe,
                ersetze: o.querySelector('#au-suche').value,
                durch: o.querySelector('#au-durch').value,
                nurGanz: o.querySelector('#au-ganz').checked
            });
            knopf.disabled = vorschau.betroffen === 0;
            if (!vorschau.betroffen) {
                kasten.innerHTML = '<div class="au-nichts">Nichts zu tun — in „' +
                    esc(vorschau.spalte) + '" ist keine Zeile betroffen.</div>';
                return;
            }
            /* HÖCHSTENS ZEHN ZEILEN ZEIGEN, und sagen, dass es mehr sind. Eine
               Vorschau mit dreihundert Zeilen liest niemand, und eine, die
               schweigend abschneidet, verspricht dreihundert und zeigt zehn. */
            const zeige = vorschau.zeilen.slice(0, 10);
            kasten.innerHTML =
                '<div class="au-kopf">' + vorschau.betroffen + ' von ' + vorschau.gesamt +
                    ' Zeilen ändern sich</div>' +
                    zeige.map((z) => '<div class="au-zeile"><span class="au-alt">' + esc(z.vorher || '(leer)') + '</span>' +
                        '<span class="au-pfeil">→</span>' +
                        '<span class="au-neu">' + esc(z.nachher || '(leer)') + '</span></div>').join('') +
                    (vorschau.betroffen > zeige.length
                        ? '<div class="au-mehr">… und ' + (vorschau.betroffen - zeige.length) +
                            ' weitere</div>' : '');
        };
        o.addEventListener('input', rechne);
        o.addEventListener('change', rechne);
        rechne();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="tu"]')) {
                if (!vorschau || !vorschau.betroffen)
                    return;
                const erg = Aufraeumen.wende(vorschau);
                App.zeichneSeite();
                o.remove();
                UI.toast(erg.geaendert + ' Zeile(n) aufgeräumt' +
                    (erg.ausgelassen ? ', ' + erg.ausgelassen + ' inzwischen anders und ausgelassen' : ''));
            }
        });
    };
    /* ========================================================================
     * WAS WÄRE, WENN (L28, E176)
     * ------------------------------------------------------------------------
     * Die Rechnung steht in `whatif.ts` und schreibt beim Suchen nichts. Hier
     * steht nur der Weg dorthin: welche Zeile, welche Stellschraube, welches
     * Ziel — und ein Knopf, der das Ergebnis übernimmt, wenn ein Mensch das
     * will.
     *
     * DAS ERGEBNIS WIRD ANGEZEIGT, NICHT EINGETRAGEN. Eine Zielwertsuche ist
     * eine Frage, keine Anweisung; wer sie stellt, will erst einmal die
     * Antwort sehen. Excel schreibt sofort und bietet danach „Rückgängig" an
     * — das ist einen Klick billiger und einen Gedanken teurer.
     * ======================================================================*/
    const wasWaereWenn = (coll, view) => {
        const zeilen = Datenbank.zeilen ? Datenbank.zeilen(coll, view) : Store.rowsOf(coll.id);
        if (!zeilen.length) {
            UI.toast('Diese Tabelle hat noch keine Zeile.');
            return;
        }
        const stellen = Object.keys(coll.schema).filter(k => WhatIf.stellbar(coll, k));
        const ziele = Object.keys(coll.schema).filter(k => WhatIf.zielbar(coll, k));
        if (!stellen.length) {
            UI.toast('Dafür braucht es eine Zahlenspalte zum Verstellen.');
            return;
        }
        if (!ziele.length) {
            UI.toast('Dafür braucht es eine gerechnete Spalte als Ziel.');
            return;
        }
        const auswahl = (id, keys) => `<select id="${id}">` + keys.map(k => `<option value="${esc(k)}">${esc(coll.schema[k].name)}</option>`).join('') + '</select>';
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,95vw)">' +
                '<div class="fh">Was wäre, wenn<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="ww-form" style="padding:14px; display:grid; gap:10px">' +
                '<label>Zeile ' +
                '<select id="ww-zeile">' + zeilen.map((z, i) => `<option value="${esc(z.id)}"${i === 0 ? ' selected' : ''}>` +
                `${esc(z.text || 'Ohne Titel')}</option>`).join('') + '</select></label>' +
                /* Der heutige Wert gehört NEBEN die Spalte, um die es geht, nicht
                   darüber: mit Augen gesehen stand „Ziel steht gerade bei 600"
                   eine Zeile über der Auswahl und sagte etwas über eine Spalte,
                   die man noch gar nicht gewählt hatte (§55). */
                '<label>Diese Spalte soll … ' + auswahl('ww-ziel', ziele) +
                '<span id="ww-jetzt" class="ww-jetzt"></span></label>' +
                '<label>… diesen Wert erreichen <input id="ww-wunsch" type="number" step="any"></label>' +
                '<label>… indem sich diese ändert ' + auswahl('ww-stell', stellen) + '</label>' +
                /* Die Antwort auf die gestellte Frage — nicht in Hinweisgrau. */
                '<div id="ww-ergebnis" class="ww-ergebnis" role="status"></div>' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="rechne" class="prim">Ausrechnen</button>' +
                '<button data-a="uebernimm" disabled>Übernehmen</button>' +
                '</div>' +
                '</div>';
        document.body.appendChild(o);
        const el = (id) => o.querySelector('#' + id);
        const erg = o.querySelector('#ww-ergebnis');
        const knopfUebernimm = o.querySelector('[data-a="uebernimm"]');
        let gefunden = null;
        const zeigeJetzt = () => {
            const row = Store.getBlock(el('ww-zeile').value);
            const w = row ? Datenbank.wert(row, el('ww-ziel').value, coll) : null;
            o.querySelector('#ww-jetzt').textContent =
                'steht gerade bei ' + (w === null || w === undefined || w === '' ? '—' : String(w));
            gefunden = null;
            knopfUebernimm.disabled = true;
            erg.textContent = '';
        };
        ['ww-zeile', 'ww-ziel', 'ww-stell'].forEach(id => el(id).addEventListener('change', zeigeJetzt));
        zeigeJetzt();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="rechne"]')) {
                const row = Store.getBlock(el('ww-zeile').value);
                const r = WhatIf.zielwert(coll, row, el('ww-stell').value, el('ww-ziel').value, el('ww-wunsch').value);
                if (!r.ok) {
                    gefunden = null;
                    knopfUebernimm.disabled = true;
                    erg.textContent = r.grund;
                    return;
                }
                gefunden = r.wert;
                knopfUebernimm.disabled = false;
                /* Gerundet ANGEZEIGT, ungerundet übernommen: „104,00000000001" liest
                   sich falsch, und „104" wäre gelogen, wenn es 104,3 heissen müsste. */
                erg.textContent = esc(coll.schema[el('ww-stell').value].name) + ' = ' +
                    (Math.round(r.wert * 1e6) / 1e6) + ' — dann steht ' +
                    esc(coll.schema[el('ww-ziel').value].name) + ' bei ' +
                    (Math.round(r.erreicht * 1e6) / 1e6) + '.';
            }
            if (elVon(e)?.closest('[data-a="uebernimm"]')) {
                if (gefunden === null)
                    return;
                Store.setProp(el('ww-zeile').value, el('ww-stell').value, gefunden);
                App.zeichneSeite();
                UI.toast('Übernommen');
                o.remove();
            }
        });
    };
    const dbMenue = (anker, coll, view, block) => {
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<button data-a="rename"><span class="mi">✎</span>Datenbank umbenennen</button>' +
            '<button data-a="icon"><span class="mi">😀</span>Symbol ändern</button>' +
            '<hr>' +
            '<button data-a="group"><span class="mi">⊞</span>Gruppieren nach …</button>' +
            '<button data-a="untergruppe"><span class="mi">⊟</span>Untergruppieren nach …</button>' +
            `<button data-a="hoehe"><span class="mi">↕</span>Zeilenhöhe<span class="ms">${view.hoehe || 'normal'}</span></button>` +
            `<button data-a="oeffnen"><span class="mi">◧</span>Einträge öffnen als` +
            `<span class="ms">${view.oeffnenAls === 'voll' ? 'Seite' : 'Vorschau'}</span></button>` +
            `<button data-a="kartengroesse"><span class="mi">▩</span>Kartengrösse<span class="ms">${view.kartenGroesse || 'mittel'}</span></button>` +
            (UI.amTelefon()
                ? `<button data-a="handytab"><span class="mi">▦</span>Am Telefon als` +
                    `<span class="ms">${view.handyTabelle ? 'Tabelle' : 'Karten'}</span></button>` : '') +
            (view.layout === 'board'
                ? `<button data-a="bahnen"><span class="mi">≡</span>Bahnen (zweite Achse)` +
                    `<span class="ms">${view.bahnKey && coll.schema[view.bahnKey] ? esc(coll.schema[view.bahnKey].name) : 'aus'}</span></button>` : '') +
            (['board', 'gallery'].includes(view.layout)
                ? `<button data-a="kbild"><span class="mi">🖼</span>Kartenbild` +
                    `<span class="ms">${view.bild === false ? 'aus' : (view.bildKey ? esc(coll.schema[view.bildKey]?.name || '') : 'automatisch')}</span></button>` : '') +
            (view.groupBy && ['date', 'created', 'edited'].includes(coll.schema[view.groupBy]?.type)
                ? `<button data-a="gzeit"><span class="mi">📅</span>Zeitabschnitt` +
                    `<span class="ms">${(ZEIT_STUFEN.find(s => s[0] === (view.gruppeZeit || 'monat')) || [])[1]}</span></button>` : '') +
            (view.groupBy && coll.schema[view.groupBy]?.type === 'number'
                ? `<button data-a="gstufe"><span class="mi">⇳</span>Zahlenstufe` +
                    `<span class="ms">${view.gruppeStufe || 'einzeln'}</span></button>` : '') +
            `<button data-a="gsort"><span class="mi">↕</span>Gruppen sortieren` +
            `<span class="ms">${{ manuell: 'manuell', 'alphabetisch': 'A → Z', 'alphabetisch-ab': 'Z → A',
                anzahl: 'meiste zuerst', 'anzahl-auf': 'wenigste zuerst' }[view.gruppeSort || 'manuell']}</span></button>` +
            `<button data-a="leere"><span class="mi">␀</span>Leere Gruppen<span class="ms">${view.leereGruppen === false ? 'aus' : 'zeigen'}</span></button>` +
            `<button data-a="limit"><span class="mi">≡</span>Höchstens anzeigen<span class="ms">${view.limit || 'alle'}</span></button>` +
            '<hr>' +
            '<button data-a="link"><span class="mi">🔗</span>Link zur Ansicht kopieren</button>' +
            '<button data-a="csv"><span class="mi">⭳</span>Als CSV exportieren</button>' +
            '<button data-a="xlsx"><span class="mi">📗</span>Als Excel-Mappe (.xlsx)</button>' +
            /* .ods für alle, die kein Excel haben — LibreOffice, OpenOffice und
               Google Sheets öffnen es ohne Umweg. */
            '<button data-a="ods"><span class="mi">📙</span>Als OpenDocument (.ods)</button>' +
            '<button data-a="csvin"><span class="mi">⭱</span>CSV einlesen</button>' +
            '<button data-a="ai"><span class="mi">✨</span>Mit KI auswerten</button>' +
            '<button data-a="dubletten"><span class="mi">⧉</span>Dubletten finden</button>' +
            /* Nur wo Text steht: eine Datenbank aus lauter Zahlen und Daten hat
               keine Leerzeichen am Rand (L27, E178). */
            (Aufraeumen.spalten(coll).length
                ? '<button data-a="putzen"><span class="mi">🧹</span>Spalten aufräumen …</button>' : '') +
            /* Nur wo es etwas zu rechnen gibt: ohne gerechnete Spalte hat eine
               Zielwertsuche kein Ziel, und ein Eintrag, der nur eine Absage
               zeigt, ist kein Eintrag (L28, E176). */
            (Object.values(coll.schema).some((d) => d && (d.type === 'formula' || d.type === 'rollup'))
                ? '<button data-a="wenn"><span class="mi">⚖</span>Was wäre, wenn …</button>' : '') +
            (typeof Pruefsatz !== 'undefined'
                ? `<button data-a="pruefsaetze"><span class="mi">✔</span>Prüfsätze` +
                    `<span class="ms">${Pruefsatz.alle(coll).length || 'keine'}</span></button>` : '') +
            (typeof Vorrat !== 'undefined'
                ? `<button data-a="vorrat"><span class="mi">❄</span>Werte vorberechnen` +
                    `<span class="ms">${Vorrat.aktiv(coll.id) ? 'an' : 'aus'}</span></button>` : '') +
            (typeof Feldrechte !== 'undefined'
                ? '<button data-a="feldrechte"><span class="mi">🔒</span>Rechte je Spalte</button>' : '') +
            '<hr><button data-a="del"><span class="mi">🗑</span>Datenbank löschen</button>', r.left - 120, r.bottom + 4);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            if (a === 'pruefsaetze') {
                m.remove();
                Pruefsatz.fenster(coll.id);
                return;
            }
            if (a === 'vorrat') {
                m.remove();
                Vorrat.fenster(coll.id);
                return;
            }
            if (a === 'feldrechte') {
                m.remove();
                Feldrechte.fenster(coll.id);
                return;
            }
            if (a === 'group' || a === 'untergruppe') {
                const feld = a === 'group' ? 'groupBy' : 'subGroupBy';
                m.innerHTML = `<div class="grp">${a === 'group' ? 'Gruppieren' : 'Untergruppieren'} nach</div>` +
                    Object.keys(coll.schema)
                        .filter(k => ['select', 'status', 'checkbox', 'multi', 'person', 'date', 'created',
                        'edited', 'number', 'text', 'formula'].includes(coll.schema[k].type))
                        .map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
                    '<hr><button data-k="">Keine</button>';
                m.addEventListener('click', ev => {
                    const kb = elVon(ev)?.closest('button[data-k]');
                    if (!kb)
                        return;
                    Store.updateView(view.id, { [feld]: kb.dataset.k });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'hoehe') {
                m.innerHTML = '<div class="grp">Zeilenhöhe</div>' +
                    ['klein', 'normal', 'gross'].map(h => `<button data-h="${h}">${h}</button>`).join('');
                m.addEventListener('click', ev => {
                    const h = elVon(ev)?.closest('button[data-h]');
                    if (!h)
                        return;
                    Store.updateView(view.id, { hoehe: h.dataset.h });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'bahnen') {
                m.innerHTML = '<div class="grp">Bahnen — zweite Gruppierung</div>' +
                    Object.keys(coll.schema)
                        .filter(k => ['select', 'status', 'person', 'checkbox', 'multi', 'text'].includes(coll.schema[k].type))
                        .map(k => `<button data-b="${k}">${k === view.bahnKey ? '✓ ' : ''}${esc(coll.schema[k].name)}</button>`).join('') +
                    '<hr><button data-b="">Keine Bahnen</button>';
                m.addEventListener('click', ev => {
                    const b2 = elVon(ev)?.closest('button[data-b]');
                    if (!b2)
                        return;
                    Store.updateView(view.id, { bahnKey: b2.dataset.b });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'kbild') {
                m.innerHTML = '<div class="grp">Kartenbild</div>' +
                    '<button data-bi="auto">Automatisch suchen</button>' +
                    Object.keys(coll.schema).filter(k => ['files', 'url', 'text'].includes(coll.schema[k].type))
                        .map(k => `<button data-bi="${k}">${k === view.bildKey ? '✓ ' : ''}${esc(coll.schema[k].name)}</button>`).join('') +
                    '<hr><button data-bi="aus">Kein Bild</button>' +
                    `<button data-bp="${view.bildPasst === 'passt' ? 'deckt' : 'passt'}">` +
                    `Darstellung: ${view.bildPasst === 'passt' ? 'ganz zeigen' : 'füllend'}</button>`;
                m.addEventListener('click', ev => {
                    const bi = elVon(ev)?.closest('button[data-bi]');
                    const bp = elVon(ev)?.closest('button[data-bp]');
                    if (bi)
                        Store.updateView(view.id, bi.dataset.bi === 'aus' ? { bild: false }
                            : { bild: true, bildKey: bi.dataset.bi === 'auto' ? '' : bi.dataset.bi });
                    else if (bp)
                        Store.updateView(view.id, { bildPasst: bp.dataset.bp });
                    else
                        return;
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'gzeit') {
                m.innerHTML = '<div class="grp">Datum gruppieren nach</div>' +
                    ZEIT_STUFEN.map(([id, n]) => `<button data-z="${id}">${id === (view.gruppeZeit || 'monat') ? '✓ ' : ''}${n}</button>`).join('');
                m.addEventListener('click', ev => {
                    const z = elVon(ev)?.closest('button[data-z]');
                    if (!z)
                        return;
                    Store.updateView(view.id, { gruppeZeit: z.dataset.z });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'gstufe') {
                m.innerHTML = '<div class="grp">Zahlen in Stufen</div>' +
                    [0, 5, 10, 25, 100, 1000].map(n => `<button data-st="${n}">${n ? 'je ' + n : 'jeder Wert einzeln'}</button>`).join('');
                m.addEventListener('click', ev => {
                    const s2 = elVon(ev)?.closest('button[data-st]');
                    if (!s2)
                        return;
                    Store.updateView(view.id, { gruppeStufe: Number(s2.dataset.st) });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'kartengroesse') {
                m.innerHTML = '<div class="grp">Kartengrösse</div>' +
                    ['klein', 'mittel', 'gross'].map(g => `<button data-g="${g}">${g}</button>`).join('');
                m.addEventListener('click', ev => {
                    const g = elVon(ev)?.closest('button[data-g]');
                    if (!g)
                        return;
                    Store.updateView(view.id, { kartenGroesse: g.dataset.g });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'limit') {
                m.innerHTML = '<div class="grp">Höchstens anzeigen</div>' +
                    [25, 50, 100, 0].map(n => `<button data-n="${n}">${n ? n + ' Einträge' : 'alle'}</button>`).join('');
                m.addEventListener('click', ev => {
                    const n = elVon(ev)?.closest('button[data-n]');
                    if (!n)
                        return;
                    Store.updateView(view.id, { limit: Number(n.dataset.n) || 0 });
                    m.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'icon') {
                m.remove();
                UI.emojiWaehlen(anker, (em) => {
                    Store.updateCollection(coll.id, { icon: em });
                    App.zeichneSeite();
                });
                return;
            }
            m.remove();
            if (a === 'rename') {
                const n = prompt('Name der Datenbank', coll.name);
                if (n) {
                    Store.updateCollection(coll.id, { name: n });
                    Store.updateBlock(block.id, { text: n });
                    App.zeichneSeite();
                }
            }
            if (a === 'oeffnen') {
                Store.updateView(view.id, { oeffnenAls: view.oeffnenAls === 'voll' ? 'peek' : 'voll' });
                App.zeichneSeite();
            }
            if (a === 'leere') {
                Store.updateView(view.id, { leereGruppen: view.leereGruppen === false });
                App.zeichneSeite();
            }
            if (a === 'handytab') {
                Store.updateView(view.id, { handyTabelle: !view.handyTabelle });
                App.zeichneSeite();
            }
            if (a === 'dubletten') {
                m.remove();
                Pflege.dublettenDialog(coll);
                return;
            }
            if (a === 'putzen') {
                m.remove();
                aufraeumenDialog(coll);
                return;
            }
            if (a === 'wenn') {
                m.remove();
                wasWaereWenn(coll, view);
                return;
            }
            if (a === 'gsort') {
                const folge = ['manuell', 'alphabetisch', 'alphabetisch-ab', 'anzahl', 'anzahl-auf'];
                const i = folge.indexOf(view.gruppeSort || 'manuell');
                Store.updateView(view.id, { gruppeSort: folge[(i + 1) % folge.length] });
                App.zeichneSeite();
            }
            if (a === 'link') {
                Ablage.kopiereJetzt(location.origin + location.pathname + '#' + App.aktuelleSeite() + ':' + view.id, 'Link zur Ansicht kopiert');
            }
            if (a === 'csv')
                csvExport(coll, view);
            if (a === 'xlsx') {
                Austausch.datenbankAlsExcel(coll)
                    .then(() => UI.toast('Excel-Mappe erzeugt'))
                    .catch(e => UI.toast('Die Excel-Mappe kam nicht zustande: ' + e.message));
            }
            if (a === 'ods') {
                Austausch.datenbankAlsOds(coll)
                    .then(() => UI.toast('OpenDocument-Tabelle erzeugt'))
                    .catch((e) => UI.toast('Die .ods kam nicht zustande: ' +
                    (e instanceof Error ? e.message : String(e))));
            }
            if (a === 'csvin')
                csvImport(coll);
            if (a === 'ai')
                KI.datenbankAuswerten(coll, view);
            if (a === 'del') {
                if (!confirm(`Datenbank „${coll.name}" mit allen Einträgen löschen?`))
                    return;
                Store.trashBlock(block.id);
                Store.purgeBlock(block.id);
                App.zeichneSeite();
            }
        });
    };
    /**
     * Rückt eine Formel lesbar ein: nach jeder öffnenden Klammer eine Ebene
     * tiefer, nach jedem Komma eine neue Zeile. Text in Anführungszeichen
     * bleibt unangetastet. Notion hat dafür nichts.
     */
    const formelEinruecken = (src) => {
        let aus = '', tiefe = 0, imText = false, anf = '';
        const zeilenumbruch = () => { aus += '\n' + '  '.repeat(tiefe); };
        for (let i = 0; i < src.length; i++) {
            const c = src[i];
            if (imText) {
                aus += c;
                if (c === anf && src[i - 1] !== '\\')
                    imText = false;
                continue;
            }
            if (c === '"' || c === "'") {
                imText = true;
                anf = c;
                aus += c;
                continue;
            }
            if (c === '(') {
                tiefe++;
                aus += c;
                zeilenumbruch();
                continue;
            }
            if (c === ')') {
                tiefe = Math.max(0, tiefe - 1);
                zeilenumbruch();
                aus += c;
                continue;
            }
            if (c === ',') {
                aus += c;
                zeilenumbruch();
                continue;
            }
            if (/\s/.test(c)) {
                if (!/\s$/.test(aus))
                    aus += ' ';
                continue;
            }
            aus += c;
        }
        return aus.split('\n').map(z => z.replace(/\s+$/, '')).filter(z => z.trim()).join('\n');
    };
    /**
     * Zerlegt eine Formel in ihre Teilausdrücke — jede vollständige Klammer
     * und die ganze Formel. So sieht man, was jeder Baustein für sich ergibt.
     */
    const teilausdruecke = (src) => {
        const raus = [];
        let imText = false, anf = '';
        const stapel = [];
        for (let i = 0; i < src.length; i++) {
            const c = src[i];
            if (imText) {
                if (c === anf && src[i - 1] !== '\\')
                    imText = false;
                continue;
            }
            if (c === '"' || c === "'") {
                imText = true;
                anf = c;
                continue;
            }
            if (c === '(') {
                /* Den Funktionsnamen davor mitnehmen, damit „sum(…)" dasteht */
                let j = i - 1;
                while (j >= 0 && /[A-Za-zÄÖÜäöüß0-9_.]/.test(src[j]))
                    j--;
                stapel.push(j + 1);
            }
            if (c === ')') {
                const von = stapel.pop();
                if (von !== undefined) {
                    const t = src.slice(von, i + 1).trim();
                    if (t.length > 3 && !raus.includes(t))
                        raus.push(t);
                }
            }
        }
        const ganz = src.trim();
        if (ganz && !raus.includes(ganz))
            raus.push(ganz);
        return raus.slice(-25); /* die letzten 25 reichen zum Verstehen */
    };
    /* --- Formel-Editor ------------------------------------------------------ */
    /** Was für ein Wert ist das? Für die Anzeige im Formeleditor. */
    const typName = (v) => {
        if (v === null || v === undefined || v === '')
            return 'leer';
        if (v instanceof Date)
            return 'Datum';
        if (typeof v === 'boolean')
            return 'Ja/Nein';
        if (typeof v === 'number')
            return Number.isInteger(v) ? 'Zahl (ganz)' : 'Zahl';
        if (Array.isArray(v))
            return 'Liste mit ' + v.length + (v.length === 1 ? ' Eintrag' : ' Einträgen');
        if (typeof v === 'object')
            return 'Objekt';
        if (typeof v === 'string' && v.startsWith('⚠'))
            return 'Fehler';
        return 'Text (' + String(v).length + ' Zeichen)';
    };
    const formelEditor = (coll, key) => {
        const def = coll.schema[key];
        const spalten = Object.values(coll.schema).map(s => s.name);
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.innerHTML = `
      <div class="finder" style="width:min(720px,94vw)">
        <div style="padding:14px 18px; border-bottom:1px solid var(--line); font-weight:600">
          Formel für „${esc(def.name)}"
        </div>
        <textarea id="fx" spellcheck="false" style="width:100%; min-height:150px; padding:14px 18px;
          background:var(--bg-input); border:none; outline:none; font:13.5px/1.5 var(--mono);
          resize:vertical">${esc(def.formula || '')}</textarea>
        <div id="fxout" style="padding:10px 18px; font-size:13px; border-top:1px solid var(--line);
          font-family:var(--mono); min-height:20px"></div>
        <div style="padding:10px 18px; font-size:12px; color:var(--text-dim); border-top:1px solid var(--line)">
          Spalten: ${spalten.map(s => `<code style="cursor:pointer" class="fxp">prop("${esc(s)}")</code>`).join(' ')}
          <br><br>Text wird mit <b>+</b> verkettet, nicht mit concat(). concat() ist nur für Listen.
          <br>Durch eine Verknüpfung lesen: <code>map(prop("Aufgaben"), current.prop("Kosten")).sum()</code>
          <details style="margin-top:10px">
            <summary style="cursor:pointer">Was hier mehr geht als in Notion</summary>
            <div style="margin-top:8px; line-height:1.9">
              <b>Die Zeile im Verhältnis zu den anderen</b> — Notion kann das nicht:<br>
              <code class="fxp">rowNumber()</code> <code class="fxp">previous("Betrag")</code>
              <code class="fxp">next("Betrag")</code> <code class="fxp">delta("Betrag")</code>
              <code class="fxp">runningSum("Betrag")</code> <code class="fxp">rank("Punkte")</code>
              <code class="fxp">percentOfTotal("Betrag")</code> <code class="fxp">total("Betrag")</code>
              <code class="fxp">average("Betrag")</code> <code class="fxp">rowCount()</code><br>
              <b>Eine andere Datenbank fragen</b> — ohne Verknüpfung:<br>
              <code class="fxp">countWhere("Rechnungen", current.prop("Kunde") == prop("Name"))</code><br>
              <code class="fxp">sumWhere("Rechnungen", current.prop("Kunde") == prop("Name"), current.prop("Betrag"))</code><br>
              <code class="fxp">findRows("Rechnungen", current.prop("Offen"))</code>
              <code class="fxp">firstWhere</code> <code class="fxp">lastWhere</code>
              <code class="fxp">maxWhere</code> <code class="fxp">minWhere</code><br>
              <b>Zufall</b> — Notion hat kein random():<br>
              <code class="fxp">random()</code> <code class="fxp">randomBetween(1, 6)</code>
              <code class="fxp">randomItem(prop("Karten"))</code> <code class="fxp">shuffle(prop("Karten"))</code><br>
              <b>Werktage, Zeiträume, Zeitzonen</b>:<br>
              <code class="fxp">businessDaysBetween(a, b)</code> <code class="fxp">addBusinessDays(d, 5)</code>
              <code class="fxp">isWeekend(d)</code> <code class="fxp">isWorkday(d)</code>
              <code class="fxp">startOfWeek(d)</code> <code class="fxp">endOfWeek(d)</code>
              <code class="fxp">startOfMonth(d)</code> <code class="fxp">endOfMonth(d)</code>
              <code class="fxp">startOfQuarter(d)</code> <code class="fxp">endOfQuarter(d)</code>
              <code class="fxp">startOfYear(d)</code> <code class="fxp">endOfYear(d)</code>
              <code class="fxp">quarter(d)</code> <code class="fxp">daysInMonth(d)</code>
              <code class="fxp">isLeapYear(d)</code>
              <code class="fxp">convertTimezone(d, "UTC", "Europe/Zurich")</code>
              <code class="fxp">timezoneOffset(d, "Europe/Zurich")</code><br>
              <b>Listen falten und gruppieren</b>:<br>
              <code class="fxp">reduce(liste, 0, acc + current)</code>
              <code class="fxp">sortBy(liste, current)</code>
              <code class="fxp">groupBy(liste, current)</code>
              <code class="fxp">groupKey(current)</code> <code class="fxp">groupItems(current)</code>
              <code class="fxp">groupCount(current)</code><br>
              <b>Statistik und Text</b>:<br>
              <code class="fxp">stdDev(liste)</code> <code class="fxp">variance(liste)</code>
              <code class="fxp">percentile(liste, 0.9)</code> <code class="fxp">clamp(x, 0, 10)</code>
              <code class="fxp">roundTo(x, 2)</code> <code class="fxp">padStart("7", 3, "0")</code>
              <code class="fxp">padEnd</code> <code class="fxp">startsWith</code>
              <code class="fxp">endsWith</code> <code class="fxp">capitalize</code>
              <code class="fxp">titleCase</code> <code class="fxp">slug</code>
              <code class="fxp">initials</code> <code class="fxp">wordCount</code>
              <code class="fxp">truncate(text, 20)</code> <code class="fxp">xor(a, b)</code>
              <code class="fxp">boolean(x)</code>
            </div>
          </details>
        </div>
        <div style="padding:12px 18px; display:flex; gap:8px; justify-content:flex-end;
          border-top:1px solid var(--line)">
          <button id="fxki" style="padding:7px 14px; border-radius:6px; margin-right:auto">✨ KI schreiben lassen</button>
          <button id="fxerkl" style="padding:7px 14px; border-radius:6px">✨ Erklären</button>
          <button id="fxfmt" style="padding:7px 14px; border-radius:6px">Formatieren</button>
          <button id="fxsteps" style="padding:7px 14px; border-radius:6px">Zwischenergebnisse</button>
          <button id="fxc" style="padding:7px 14px; border-radius:6px">Abbrechen</button>
          <button id="fxs" style="padding:7px 14px; border-radius:6px; background:var(--accent); color:var(--auf-accent)">Speichern</button>
        </div>
      </div>`;
        document.body.appendChild(overlay);
        const ta = overlay.querySelector('#fx');
        const out = overlay.querySelector('#fxout');
        if (!ta || !out)
            return;
        /* Namen, die in der Formel stehen, aber keine Spalte sind. Notion zeigt
           dafür einen Fehler; hier bleibt die Formel gültig — sie rechnet dann
           mit „leer" —, aber der Editor sagt es wenigstens. */
        const unbekannteSpalten = (src) => {
            const namen = new Set();
            String(src || '').replace(/prop\s*\(\s*(["'])([^"']*)\1\s*\)/g, (_, _q, n) => {
                if (!spalten.includes(n))
                    namen.add(n);
                return _;
            });
            return [...namen];
        };
        const pruefe = () => {
            const c = Formula.check(ta.value);
            if (!c.ok) {
                out.style.color = 'var(--c-red)';
                out.textContent = '⚠ ' + c.fehler;
                return;
            }
            const fehlend = unbekannteSpalten(ta.value);
            if (fehlend.length) {
                out.style.color = 'var(--c-orange)';
                out.textContent = '⚠ Diese Spalte gibt es nicht: ' +
                    fehlend.map(n => '„' + n + '"').join(', ') +
                    ' — die Formel rechnet damit als wäre sie leer.';
                return;
            }
            /* Mit der ersten Zeile testen, damit man das Ergebnis sieht */
            const erste = Store.rowsOf(coll.id)[0];
            if (erste) {
                const r = Formula.run(ta.value, (name) => {
                    const k = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
                    if (!k)
                        return null;
                    if (coll.schema[k].type === 'relation')
                        return seitenListe(wert(erste, k, coll));
                    return wert(erste, k, coll);
                }, fremdWert, formelUmgebung(erste, coll));
                out.style.color = r.ok ? 'var(--c-green)' : 'var(--c-red)';
                /* Notion sagt nie, was für ein Wert herauskommt. Hier steht es dabei. */
                out.textContent = r.ok
                    ? '✓ ' + typName(r.wert) + ' · Beispiel: ' + Formula.anzeige(r.wert)
                    : '⚠ ' + r.fehler;
            }
            else {
                out.style.color = 'var(--c-green)';
                out.textContent = '✓ Formel ist gültig';
            }
        };
        ta.addEventListener('input', pruefe);
        pruefe();
        ta.focus();
        overlay.querySelectorAll('.fxp').forEach(c => c.addEventListener('click', () => {
            ta.value += c.textContent;
            ta.focus();
            pruefe();
        }));
        /* ------------------------------------------------------------------
         * FORMEL-WERKSTATT
         * Zwei Dinge, die Notion nicht hat: eine Formel lesbar einrücken, und
         * Schritt für Schritt zeigen, was jeder Teilausdruck ergibt.
         * ---------------------------------------------------------------- */
        overlay.querySelector('#fxfmt')?.addEventListener('click', () => {
            ta.value = formelEinruecken(ta.value);
            pruefe();
            UI.toast('Formel eingerückt');
        });
        /* Die KI schreibt — geprüft wird trotzdem hier, an einer echten Zeile. */
        overlay.querySelector('#fxki')?.addEventListener('click', () => {
            KiBau.formelSchreiben(coll, key, ta.value, (neu) => {
                ta.value = neu;
                pruefe();
                UI.toast('Formel übernommen — noch nicht gespeichert');
            });
        });
        overlay.querySelector('#fxerkl')?.addEventListener('click', () => {
            if (!ta.value.trim()) {
                UI.toast('Erst eine Formel schreiben');
                return;
            }
            KiBau.formelErklaeren(coll, ta.value);
        });
        overlay.querySelector('#fxsteps')?.addEventListener('click', () => {
            const erste = Store.rowsOf(coll.id)[0];
            if (!erste) {
                UI.toast('Für Zwischenergebnisse braucht es eine Zeile');
                return;
            }
            const propFn = (name) => {
                const k = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
                if (!k)
                    return null;
                if (coll.schema[k].type === 'relation')
                    return seitenListe(wert(erste, k, coll));
                return wert(erste, k, coll);
            };
            const teile = teilausdruecke(ta.value);
            const zeilen = teile.map(t => {
                const r = Formula.run(t, propFn, fremdWert, formelUmgebung(erste, coll));
                return { t, wert: r.ok ? Formula.anzeige(r.wert) : '⚠ ' + r.fehler, ok: r.ok };
            });
            const o2 = document.createElement('div');
            o2.className = 'overlay';
            o2.innerHTML = '<div class="finder" style="width:min(720px,95vw)">' +
                `<div class="fh">Zwischenergebnisse an „${esc(erste.text || 'erster Zeile')}"` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" style="max-height:60vh">' +
                (zeilen.length
                    ? zeilen.map(z => '<div class="fx-schritt">' +
                        `<code>${esc(z.t)}</code>` +
                        `<span class="${z.ok ? 'gut' : 'schlecht'}">${esc(z.wert)}</span></div>`).join('')
                    : '<div style="padding:20px; color:var(--text-faint)">Nichts zum Zerlegen.</div>') +
                '</div></div>';
            document.body.appendChild(o2);
            o2.addEventListener('click', e => {
                if (e.target === o2 || elVon(e)?.closest('[data-a="zu"]'))
                    o2.remove();
            });
        });
        overlay.querySelector('#fxc')?.addEventListener('click', () => overlay.remove());
        overlay.querySelector('#fxs')?.addEventListener('click', () => {
            def.formula = ta.value;
            Store.updateCollection(coll.id, { schema: coll.schema });
            overlay.remove();
            App.zeichneSeite();
        });
        overlay.addEventListener('click', e => { if (e.target === overlay)
            overlay.remove(); });
    };
    /* --- Suche in der Datenbank -------------------------------------------- */
    const suchFeld = (wrap, _coll, _view, _block) => {
        let box = wrap.querySelector('.dbsuche');
        if (box) {
            box.remove();
            return;
        }
        box = document.createElement('input');
        box.className = 'dbsuche';
        box.placeholder = 'In dieser Datenbank suchen …';
        box.style.cssText = 'width:100%; padding:7px 10px; margin-bottom:8px; background:var(--bg-input); ' +
            'border:1px solid var(--line); border-radius:6px; outline:none; font-size:14px';
        wrap.insertBefore(box, wrap.children[1]);
        box.focus();
        box.addEventListener('input', () => {
            const q = box.value.toLowerCase();
            wrap.querySelectorAll('tbody tr').forEach((tr) => {
                tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
            });
        });
    };
    /* --- CSV-Export --------------------------------------------------------- */
    const csvExport = (coll, view) => {
        const keys = Object.keys(coll.schema);
        const rows = zeilen(coll, view);
        const feld = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
        const csv = [
            keys.map(k => feld(coll.schema[k].name)).join(','),
            ...rows.map((r) => keys.map(k => {
                const v = wert(r, k, coll);
                return feld(Array.isArray(v) ? v.join('; ') : Formula.anzeige(v));
            }).join(','))
        ].join('\n');
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = coll.name.replace(/[^\wäöüÄÖÜß -]/g, '') + '.csv';
        a.click();
        UI.toast('CSV heruntergeladen');
    };
    /* ========================================================================
     * ZEILENVORLAGEN   (Notions „New with template")
     * ======================================================================*/
    /** Platzhalter in Vorlagen: heute, morgen, jetzt, {datum} … */
    const platzhalter = (v) => {
        if (typeof v !== 'string')
            return v;
        const d = new Date();
        const p = (n) => String(n).padStart(2, '0');
        const iso = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
        if (v === 'heute')
            return iso;
        if (v === 'jetzt')
            return iso + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
        if (v === 'morgen') {
            const t = new Date(d);
            t.setDate(t.getDate() + 1);
            return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate());
        }
        return v
            .replace(/\{datum\}/g, d.toLocaleDateString('de-DE'))
            .replace(/\{tag\}/g, d.toLocaleDateString('de-DE', { weekday: 'long' }))
            .replace(/\{monat\}/g, d.toLocaleDateString('de-DE', { month: 'long' }))
            .replace(/\{jahr\}/g, String(d.getFullYear()))
            .replace(/\{woche\}/g, 'KW ' + kalenderwoche(d));
    };
    const kalenderwoche = (d) => {
        const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
        const jahresstart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
        return Math.ceil(((t.getTime() - jahresstart.getTime()) / 86400000 + 1) / 7);
    };
    /** Einen Eintrag aus einer Vorlage anlegen — auch die Unterseiten kommen mit. */
    const ausVorlage = (coll, v) => {
        const props = JSON.parse(JSON.stringify(v.props || {}));
        Object.keys(props).forEach(k => { props[k] = platzhalter(props[k]); });
        const z = Store.addRow(coll.id, props);
        Store.updateBlock(z.id, { text: platzhalter(v.titel || v.name) });
        (v.inhalt || []).forEach((k) => Store.baumEinfuegen(k, z.id));
        return z;
    };
    const vorlagenMenue = (anker, coll, _view) => {
        const liste = coll.vorlagen || [];
        const r = anker.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Neuer Eintrag mit Vorlage</div>' +
            (liste.length
                ? liste.map((v, i) => `<button data-v="${i}"><span class="mi">${esc(v.icon || '🧩')}</span>${esc(v.name)}` +
                    (v.wdh && v.wdh.art ? '<span class="ms" style="right:52px" title="wiederholt sich">🔁</span>' : '') +
                    `<span class="ms" style="right:28px" data-vwdh="${i}" title="Wiederholung">⏱</span>` +
                    `<span class="ms" data-vweg="${i}">✕</span></button>`).join('')
                : '<div class="grp" style="font-weight:400">Noch keine Vorlage</div>') +
            '<hr>' +
            '<button data-a="leer"><span class="mi">＋</span>Leerer Eintrag</button>' +
            '<button data-a="neu"><span class="mi">🧩</span>Vorlage aus einem Eintrag anlegen</button>', r.right - 240, r.bottom + 6);
        m.addEventListener('click', async (e) => {
            const weg = elVon(e)?.closest('[data-vweg]');
            if (weg) {
                coll.vorlagen.splice(Number(weg.dataset.vweg), 1);
                Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
                m.remove();
                UI.toast('Vorlage entfernt');
                return;
            }
            const wdh = elVon(e)?.closest('[data-vwdh]');
            if (wdh) {
                m.remove();
                wiederholungEinstellen(coll, Number(wdh.dataset.vwdh));
                return;
            }
            const b = elVon(e)?.closest('button[data-v], button[data-a]');
            if (!b)
                return;
            m.remove();
            if (b.dataset.a === 'leer') {
                Store.addRow(coll.id, {});
                App.zeichneSeite();
                return;
            }
            if (b.dataset.a === 'neu') {
                const zeilen = Store.rowsOf(coll.id);
                if (!zeilen.length) {
                    UI.toast('Erst einen Eintrag anlegen');
                    return;
                }
                const w = UI.menu('<div class="grp">Welcher Eintrag wird zur Vorlage?</div>' +
                    zeilen.slice(0, 30).map(z => `<button data-z="${z.id}">${esc(z.text || 'Ohne Titel')}</button>`).join(''), r.right - 240, r.bottom + 6);
                w.addEventListener('click', async (ev) => {
                    const zb = elVon(ev)?.closest('button[data-z]');
                    if (!zb)
                        return;
                    w.remove();
                    const z = Store.getBlock(zb.dataset.z);
                    const name = await UI.frage('Name der Vorlage', z.text || 'Vorlage');
                    if (!name)
                        return;
                    coll.vorlagen = coll.vorlagen || [];
                    coll.vorlagen.push({
                        name, icon: '🧩',
                        props: JSON.parse(JSON.stringify(z.props || {})),
                        titel: z.text || '',
                        inhalt: (Store.baum(z.id).kinder || [])
                    });
                    Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
                    UI.toast('Vorlage gespeichert');
                });
                return;
            }
            /* Aus einer Vorlage anlegen */
            const v = liste[Number(b.dataset.v)];
            if (!v)
                return;
            ausVorlage(coll, v);
            App.zeichneSeite();
            UI.toast('Eintrag aus Vorlage angelegt');
        });
    };
    /* ------------------------------------------------------------------------
     * Wiederkehrende Vorlagen — Notions „Repeat" an einer Datenbankvorlage.
     * Die Vorlage legt sich in einem festen Takt selbst an. Geprüft wird beim
     * Start und danach stündlich; jede Periode kommt höchstens einmal dran.
     * ----------------------------------------------------------------------*/
    const WDH_ARTEN = [
        ['', 'Nicht wiederholen'],
        ['taeglich', 'Jeden Tag'],
        ['wochentags', 'Montag bis Freitag'],
        ['woechentlich', 'Jede Woche'],
        ['monatlich', 'Jeden Monat'],
        ['jaehrlich', 'Jedes Jahr']
    ];
    const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const wdhPeriode = (art, d) => {
        const p = (n) => String(n).padStart(2, '0');
        if (art === 'jaehrlich')
            return String(d.getFullYear());
        if (art === 'monatlich')
            return d.getFullYear() + '-' + p(d.getMonth() + 1);
        if (art === 'woechentlich')
            return d.getFullYear() + '-KW' + p(kalenderwoche(d));
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    };
    const wiederholungEinstellen = (coll, i) => {
        const v = (coll.vorlagen || [])[i];
        if (!v)
            return;
        const w = v.wdh || {};
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(460px,94vw)">' +
                `<div class="fh">🔁 Wiederholung — ${esc(v.name)}` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
                '<label>Takt<br><select id="wa">' +
                WDH_ARTEN.map(([id, n]) => `<option value="${id}"${(w.art || '') === id ? ' selected' : ''}>${n}</option>`).join('') +
                '</select></label>' +
                '<label id="wtl">Wochentag<br><select id="wt">' +
                WOCHENTAGE.map((n, k) => `<option value="${k}"${String(w.tag) === String(k) ? ' selected' : ''}>${n}</option>`).join('') +
                '</select></label>' +
                '<label id="wml">Tag im Monat<br><input id="wm" type="number" min="1" max="28" ' +
                `value="${w.tag != null ? esc(String(w.tag)) : 1}"></label>` +
                '<label>Ab welcher Uhrzeit<br><input id="ws" type="number" min="0" max="23" ' +
                `value="${w.stunde != null ? esc(String(w.stunde)) : 6}"></label>` +
                '<div style="font-size:13px;color:var(--text-faint);line-height:1.5">' +
                'Im Titel und in Textfeldern der Vorlage funktionieren <b>{datum}</b>, <b>{tag}</b>, ' +
                '<b>{woche}</b>, <b>{monat}</b> und <b>{jahr}</b>. In Datumsfeldern ' +
                '<b>heute</b>, <b>morgen</b> und <b>jetzt</b>.<br>' +
                'Geprüft wird, während die App offen ist — verpasste Tage werden beim nächsten ' +
                'Öffnen nachgeholt.</div>' +
                '</div>' +
                '<div class="fbtns"><button data-a="ok" class="prim">Sichern</button>' +
                '<button data-a="jetzt">Einmal jetzt anlegen</button>' +
                '<button data-a="zu">Abbrechen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const auffrischen = () => {
            const a = o.querySelector('#wa')?.value;
            const wtl = o.querySelector('#wtl');
            const wml = o.querySelector('#wml');
            if (wtl)
                wtl.style.display = a === 'woechentlich' ? '' : 'none';
            if (wml)
                wml.style.display = a === 'monatlich' ? '' : 'none';
        };
        auffrischen();
        o.querySelector('#wa')?.addEventListener('change', auffrischen);
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            if (elVon(e)?.closest('[data-a="jetzt"]')) {
                ausVorlage(coll, v);
                o.remove();
                App.zeichneSeite();
                UI.toast('Eintrag aus Vorlage angelegt');
                return;
            }
            if (!elVon(e)?.closest('[data-a="ok"]'))
                return;
            const art = o.querySelector('#wa')?.value;
            if (!art) {
                delete v.wdh;
            }
            else {
                v.wdh = {
                    art,
                    tag: art === 'woechentlich' ? Number(o.querySelector('#wt')?.value)
                        : art === 'monatlich' ? Number(o.querySelector('#wm')?.value) : null,
                    stunde: Number(o.querySelector('#ws')?.value) || 0,
                    zuletzt: (v.wdh || {}).zuletzt || null
                };
            }
            Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
            o.remove();
            UI.toast(art ? 'Wiederholung eingestellt' : 'Wiederholung ausgeschaltet');
        });
    };
    const vorlagenLaufen = () => {
        const jetzt = new Date();
        Object.values(Store.cache.collections).forEach(coll => {
            let geaendert = false;
            (coll.vorlagen || []).forEach((v) => {
                const w = v.wdh;
                if (!w || !w.art)
                    return;
                if (jetzt.getHours() < (w.stunde || 0))
                    return;
                if (w.art === 'wochentags' && (jetzt.getDay() === 0 || jetzt.getDay() === 6))
                    return;
                if (w.art === 'woechentlich' && w.tag != null && jetzt.getDay() !== +w.tag)
                    return;
                if (w.art === 'monatlich' && w.tag && jetzt.getDate() !== +w.tag)
                    return;
                const p = wdhPeriode(w.art, jetzt);
                if (w.zuletzt === p)
                    return;
                w.zuletzt = p;
                geaendert = true;
                ausVorlage(coll, v);
            });
            if (geaendert) {
                Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
                UI.toast('🔁 Wiederkehrender Eintrag angelegt');
            }
        });
    };
    /* ========================================================================
     * AUTOMATIONEN
     * ------------------------------------------------------------------------
     * Notions Datenbank-Automationen: „Wenn etwas passiert, dann tu das."
     * Hier läuft alles im Browser — kein Dienst, keine Wartezeit.
     * ======================================================================*/
    const AUSLOESER = [
        ['zeile-neu', 'Ein Eintrag wird angelegt'],
        ['prop-geaendert', 'Eine Eigenschaft ändert sich'],
        ['prop-wert', 'Eine Eigenschaft bekommt einen bestimmten Wert'],
        ['zeile-geaendert', 'Ein Eintrag wird bearbeitet — egal welches Feld'],
        ['zeile-weg', 'Ein Eintrag verschwindet aus der Datenbank'],
        ['formular-neu', 'Über das Formular kommt eine Antwort'],
        ['zeit-vor', 'Einige Tage vor einem Datum'],
        ['zeit-nach', 'Einige Tage nach einem Datum'],
        /* Notions dritter Auslösertyp: „Every {frequency}". Er hängt an keiner
           Spalte und an keiner Änderung, sondern nur an der Uhr. */
        ['wiederkehrend', 'Wiederkehrend nach Zeitplan'],
        /* --- Sechs, die an etwas anderem hängen als an einer Spalte --------
         * Der Filter einer Ansicht ist eine Zustandsgrenze: eine Zeile ist
         * drin oder draussen. Interessant ist der Übergang — „ist gerade
         * hereingekommen" sagt mehr als „hat den Status geändert".
         * ------------------------------------------------------------------ */
        ['ansicht-rein', 'Ein Eintrag kommt neu in eine Ansicht'],
        ['ansicht-raus', 'Ein Eintrag fällt aus einer Ansicht heraus'],
        ['kommentar-neu', 'Jemand schreibt einen Kommentar'],
        ['erwaehnung', 'Jemand wird im Kommentar erwähnt'],
        ['datei-neu', 'Eine Datei wird angehängt'],
        ['zeile-zurueck', 'Ein Eintrag kommt aus dem Papierkorb zurück']
    ];
    /* Diese Auslöser hängen an keiner einzelnen Spalte. */
    const OHNE_SPALTE = ['zeile-neu', 'zeile-geaendert', 'zeile-weg', 'formular-neu',
        'wiederkehrend', 'ansicht-rein', 'ansicht-raus',
        'kommentar-neu', 'erwaehnung', 'zeile-zurueck'];
    /* ------------------------------------------------------------------------
     * BEDINGUNGEN
     * ------------------------------------------------------------------------
     * Bisher konnte man an eine Automation Filterregeln hängen — „Status ist
     * Fertig". Das beantwortet aber nur Fragen über den Zustand, nie über die
     * Veränderung: „war das Feld vorher leer?", „ist die Zahl gewachsen?",
     * „hat sich überhaupt etwas geändert?". Genau daran scheitern in Notion
     * die meisten Automationen — sie feuern auch, wenn derselbe Wert nochmal
     * geschrieben wird.
     *
     * Deshalb hier ein benannter Katalog. Eine Bedingung mit `art` wird von
     * dieser Liste beantwortet; eine ohne `art` bleibt eine gewöhnliche
     * Filterregel. Alte Automationen laufen also unverändert weiter.
     *
     * Spalte  = braucht eine Spalte      Zahl = braucht eine Zahl
     * Text    = braucht einen Text       —    = braucht nichts
     * ---------------------------------------------------------------------- */
    const BEDINGUNGEN = [
        /* Was mit dem Wert geschehen ist */
        ['wert-leer', 'Die Eigenschaft ist jetzt leer', 'spalte'],
        ['wert-gefuellt', 'Die Eigenschaft ist jetzt gefüllt', 'spalte'],
        ['war-leer', 'Sie war vorher leer', 'spalte'],
        ['wirklich-anders', 'Der Wert hat sich wirklich geändert', 'spalte'],
        ['wert-gewachsen', 'Die Zahl ist grösser als vorher', 'spalte'],
        ['wert-gefallen', 'Die Zahl ist kleiner als vorher', 'spalte'],
        ['wert-ist', 'Der Wert ist genau …', 'spalte,text'],
        ['wert-enthaelt', 'Der Wert enthält …', 'spalte,text'],
        ['wert-groesser', 'Die Zahl ist grösser als …', 'spalte,zahl'],
        ['wert-kleiner', 'Die Zahl ist kleiner als …', 'spalte,zahl'],
        /* Was für ein Eintrag es ist */
        ['zeile-jung', 'Der Eintrag ist jünger als … Tage', 'zahl'],
        ['zeile-alt', 'Der Eintrag ist älter als … Tage', 'zahl'],
        ['zeile-gesperrt', 'Der Eintrag ist gesperrt', ''],
        ['zeile-inhalt', 'Der Eintrag hat Inhalt auf seiner Seite', ''],
        ['zeile-kommentare', 'Am Eintrag hängt mindestens ein Kommentar', ''],
        ['zeile-archiviert', 'Der Eintrag ist archiviert', ''],
        ['formel-wahr', 'Eine freie Formel ergibt „wahr"', 'formel'],
        ['in-ansicht', 'Der Eintrag steht in der Ansicht …', 'ansicht'],
        /* Wann es geschieht */
        ['heute-werktag', 'Heute ist ein Werktag', ''],
        ['heute-wochenende', 'Heute ist Wochenende', ''],
        ['wochentag', 'Heute ist ein bestimmter Wochentag', 'wochentag'],
        ['uhrzeit-zwischen', 'Die Uhrzeit liegt zwischen … und …', 'zeitspanne'],
        ['datum-vergangen', 'Das Datum in der Spalte liegt zurück', 'spalte'],
        ['hoechstens', 'Diese Automation lief heute höchstens … mal', 'zahl']
    ];
    /* WOCHENTAGE steht schon weiter oben — hier wird dieselbe Liste benutzt. */
    /**
     * Beantwortet eine benannte Bedingung.
     * ctx trägt das, was eine reine Zustandsprüfung nicht wissen kann:
     * den alten Wert, die betroffene Spalte und die Automation selbst.
     */
    const bedingungTrifft = (b, row, coll, ctx) => {
        ctx = ctx || {};
        const k = b.key || ctx.key;
        const hier = () => (k && row && coll.schema[k]) ? wert(row, k, coll) : null;
        const leer = (v) => v === null || v === undefined || v === '' ||
            (Array.isArray(v) && !v.length);
        const zahl = (v) => (typeof Formula !== 'undefined' ? Formula.zahl(v) : (Number(v) || 0));
        const jetzt = new Date();
        switch (b.art) {
            case 'wert-leer': return leer(hier());
            case 'wert-gefuellt': return !leer(hier());
            case 'war-leer': return leer(ctx.alterWert);
            case 'wirklich-anders': return JSON.stringify(ctx.alterWert ?? null) !==
                JSON.stringify(hier() ?? null);
            case 'wert-gewachsen': return zahl(hier()) > zahl(ctx.alterWert);
            case 'wert-gefallen': return zahl(hier()) < zahl(ctx.alterWert);
            case 'wert-ist': return String(hier() ?? '') === String(b.wert ?? '');
            case 'wert-enthaelt': return String(hier() ?? '').toLowerCase()
                .includes(String(b.wert ?? '').toLowerCase());
            case 'wert-groesser': return zahl(hier()) > zahl(b.wert);
            case 'wert-kleiner': return zahl(hier()) < zahl(b.wert);
            case 'zeile-jung': {
                if (!row || !row.created)
                    return false;
                return (jetzt.getTime() - new Date(row.created).getTime()) / 86400000 < (Number(b.wert) || 1);
            }
            case 'zeile-alt': {
                if (!row || !row.created)
                    return false;
                return (jetzt.getTime() - new Date(row.created).getTime()) / 86400000 > (Number(b.wert) || 1);
            }
            case 'zeile-gesperrt': return !!(row && row.gesperrt);
            case 'zeile-inhalt': return !!(row && (row.content || []).length);
            case 'zeile-kommentare': return !!(row && (row.kommentare || []).length);
            case 'zeile-archiviert': return !!(row && row.archiviert);
            case 'formel-wahr': {
                if (typeof Formula === 'undefined' || !row)
                    return false;
                const r = Formula.run(String(b.wert || ''), (name) => {
                    const k2 = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
                    return k2 ? wert(row, k2, coll) : null;
                }, fremdWert, formelUmgebung(row, coll));
                return r.ok && !!r.wert && r.wert !== 'false' && r.wert !== 0;
            }
            case 'in-ansicht': {
                const v = Store.getView(b.wert);
                return !!v && !!row && gruppeTrifftZu(row, v.filters, coll);
            }
            case 'heute-werktag': return jetzt.getDay() !== 0 && jetzt.getDay() !== 6;
            case 'heute-wochenende': return jetzt.getDay() === 0 || jetzt.getDay() === 6;
            case 'wochentag': return WOCHENTAGE[jetzt.getDay()] === String(b.wert || '');
            case 'uhrzeit-zwischen': {
                const min = jetzt.getHours() * 60 + jetzt.getMinutes();
                const alsMin = (s) => {
                    const [h, m] = String(s || '').split(':').map(x => parseInt(x, 10) || 0);
                    return (h ?? 0) * 60 + (m ?? 0);
                };
                const von = alsMin(b.von || '08:00'), bis = alsMin(b.bis || '18:00');
                /* Über Mitternacht hinaus: 22:00–06:00 soll auch gelten */
                return von <= bis ? (min >= von && min <= bis) : (min >= von || min <= bis);
            }
            case 'datum-vergangen': {
                const v = hier();
                if (!v)
                    return false;
                const d = new Date(v);
                return !isNaN(d.getTime()) && d < jetzt;
            }
            case 'hoechstens': {
                const heute = jetzt.toISOString().slice(0, 10);
                const a = ctx.automation || {};
                const gezaehlt = (a.verlauf || [])
                    .filter((x) => String(x.wann || '').slice(0, 10) === heute).length;
                return gezaehlt < (Number(b.wert) || 1);
            }
            default: return true;
        }
    };
    /** Eine Bedingung als Satz — für die Liste und für den Prüfbericht. */
    const bedingungText = (b) => {
        const e = BEDINGUNGEN.find(x => x[0] === b.art);
        if (!e)
            return '';
        let t = e[1] ?? '';
        if (b.art === 'uhrzeit-zwischen')
            return `Die Uhrzeit liegt zwischen ${b.von || '08:00'} und ${b.bis || '18:00'}`;
        if (String(b.wert ?? '') !== '')
            t = t.replace('…', String(b.wert));
        return t;
    };
    /** Alle Bedingungen einer Automation prüfen — benannte und Filterregeln. */
    const bedingungenTreffen = (a, row, coll, ctx) => (a.bedingungen || []).every((b) => b && b.art
        ? bedingungTrifft(b, row, coll, Object.assign({ automation: a }, ctx))
        : trifftZu(row, b, coll));
    /**
     * Gespeicherte Automationen dürfen nach dem Löschen oder Ändern einer
     * Spalte nicht still so tun, als wäre ihre Bedingung bloss falsch. Dieser
     * reine Vorabcheck liefert deshalb einen benannten Fehler für Vorschau und
     * Laufverlauf; er verändert weder Automation noch Zeile.
     */
    const bedingungFehler = (b, coll) => {
        if (!b || typeof b !== 'object')
            return 'Die Bedingung ist leer oder beschädigt';
        if (!b.art) {
            if (!b.key || !coll.schema[b.key])
                return 'Die Eigenschaft der Bedingung wurde nicht gefunden';
            const erlaubt = OPERATOREN[coll.schema[b.key].type] || OPERATOREN['text'] || [];
            if (!b.op || !erlaubt.includes(b.op))
                return 'Der Operator „' + String(b.op || '—') + '“ ist für diese Eigenschaft ungültig';
            return '';
        }
        const eintrag = BEDINGUNGEN.find(x => x[0] === b.art);
        if (!eintrag)
            return 'Die Bedingungsart „' + String(b.art) + '“ ist unbekannt';
        const braucht = String(eintrag[2] || '').split(',').filter(Boolean);
        if (braucht.includes('spalte') && (!b.key || !coll.schema[b.key]))
            return 'Die Eigenschaft der Bedingung wurde nicht gefunden';
        if (braucht.includes('zahl') && (String(b.wert ?? '').trim() === '' || !isFinite(Number(b.wert))))
            return 'Die Bedingung braucht eine gültige Zahl';
        if ((braucht.includes('text') || braucht.includes('formel')) && String(b.wert ?? '').trim() === '')
            return braucht.includes('formel') ? 'Die Bedingung braucht eine Formel' : 'Die Bedingung braucht einen Wert';
        if (braucht.includes('ansicht') && !Store.getView(b.wert))
            return 'Die Ansicht der Bedingung wurde nicht gefunden';
        if (braucht.includes('wochentag') && !WOCHENTAGE.includes(String(b.wert || '')))
            return 'Der Wochentag der Bedingung ist ungültig';
        if (braucht.includes('zeitspanne') &&
            (!/^\d{2}:\d{2}$/.test(String(b.von || '')) || !/^\d{2}:\d{2}$/.test(String(b.bis || ''))))
            return 'Die Bedingung braucht zwei gültige Uhrzeiten';
        return '';
    };
    /* Die Takte für den wiederkehrenden Auslöser. Notion nennt in seiner Hilfe
       nur „every day, week, month, and so on" — hier sind sie ausgeschrieben. */
    const TAKTE = [
        ['stuendlich', 'Stündlich'],
        ['taeglich', 'Täglich'],
        ['werktags', 'An Werktagen'],
        ['woechentlich', 'Wöchentlich'],
        ['zweiwoechentlich', 'Alle zwei Wochen'],
        ['monatlich', 'Monatlich'],
        ['quartal', 'Vierteljährlich'],
        ['jaehrlich', 'Jährlich']
    ];
    const AKTIONEN = [
        ['setze-prop', 'Eigenschaft setzen'],
        ['ki-fuellen', 'KI-Feld ausfüllen lassen'],
        ['erinnerung', 'Erinnerung anlegen'],
        ['unterseite', 'Unterseite im Eintrag anlegen'],
        ['zaehler', 'Zähler um eins erhöhen'],
        ['wiederholen', 'Nächsten Termin dieser Aufgabe anlegen'],
        ['fremd-setzen', 'Einträge einer anderen Datenbank ändern'],
        ['webhook', 'An eine Webadresse schicken'],
        ['melden', 'Kurze Meldung zeigen'],
        /* --- Die vier, die Notion hat und uns fehlten --------------------- */
        ['variablen', 'Variablen festlegen'],
        ['neue-zeile', 'Seite in einer Datenbank anlegen'],
        ['benachricht', 'Benachrichtigung senden'],
        ['mail', 'E-Mail senden'],
        /* --- Sechs weitere, die Notion in seiner Liste führt ---------------- */
        ['archivieren', 'Eintrag archivieren'],
        ['loeschen', 'Eintrag in den Papierkorb'],
        ['leeren', 'Eigenschaft leeren'],
        ['duplizieren', 'Eintrag duplizieren'],
        ['kommentar', 'Kommentar an den Eintrag'],
        ['zurueckstellen', 'Eintrag auf später zurückstellen']
    ];
    /** „1 Woche", „3 Tage", „monatlich", „14" — alles wird zu einem Datumssprung. */
    const naechstesDatum = (basis, takt) => {
        const d = new Date(basis);
        if (isNaN(d.getTime()))
            return null;
        const t = String(takt || '1 Woche').toLowerCase();
        const n = parseInt(t.replace(/[^0-9]/g, ''), 10) || 1;
        /* Der 31. plus ein Monat ist der 30. — nicht der 1. des übernächsten. */
        const monateDazu = (anzahl) => {
            const tagImMonat = d.getDate();
            d.setDate(1);
            d.setMonth(d.getMonth() + anzahl);
            const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            d.setDate(Math.min(tagImMonat, letzter));
        };
        if (/jahr/.test(t))
            monateDazu(12 * n);
        else if (/monat/.test(t))
            monateDazu(n);
        else if (/woche/.test(t))
            d.setDate(d.getDate() + 7 * n);
        else if (/werktag/.test(t)) {
            let offen = n;
            while (offen > 0) {
                d.setDate(d.getDate() + 1);
                if (d.getDay() !== 0 && d.getDay() !== 6)
                    offen--;
            }
        }
        else
            d.setDate(d.getDate() + n);
        const p = (x) => String(x).padStart(2, '0');
        const kurz = String(basis).length <= 10;
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
            (kurz ? '' : 'T' + p(d.getHours()) + ':' + p(d.getMinutes()));
    };
    /* Die Kettentiefe (E86): >0, solange gerade Aktionen einer Automation
       laufen. Der setProp-Hook fängt sie SYNCHRON und reicht sie in seinen
       verzögerten Lauf weiter — so weiss die nächste Automation, die
       wievielte Stufe einer Kette sie ist. Ein globaler Lauf-Riegel kann das
       nicht leisten und würde bei kooperativen Mehrzeilenläufen sogar echte
       Folgeereignisse verschlucken. */
    let laufKette = 0;
    let wdhZaehler = 0; /* Notbremse gegen Ketten, die sich selbst nachlegen */
    const aktiveAutomationsLaeufe = new Map();
    let aktuellerAutomationsKontext = null;
    const automationsKontextKopie = () => aktuellerAutomationsKontext ? {
        lauf: aktuellerAutomationsKontext.lauf,
        trace: [...aktuellerAutomationsKontext.trace],
        kette: aktuellerAutomationsKontext.kette
    } : null;
    const neuerAutomationsLauf = (origin = 'ereignis') => {
        const lauf = {
            id: 'auto-' + Store.uid().slice(0, 10), origin, schritte: 0,
            maxSchritte: 1000, abgebrochen: false, status: 'laeuft',
            gestartet: new Date().toISOString()
        };
        aktiveAutomationsLaeufe.set(lauf.id, lauf);
        return lauf;
    };
    const automationAbbrechen = (laufId) => {
        const lauf = aktiveAutomationsLaeufe.get(laufId);
        if (!lauf || lauf.status !== 'laeuft')
            return false;
        lauf.abgebrochen = true;
        lauf.status = 'abgebrochen';
        return true;
    };
    const laufSchritt = (lauf) => {
        if (lauf.abgebrochen)
            return false;
        lauf.schritte++;
        if (lauf.schritte <= lauf.maxSchritte)
            return true;
        lauf.abgebrochen = true;
        lauf.status = 'abgebrochen';
        return false;
    };
    const SCHREIBAKTIONEN = new Set([
        'setze-prop', 'ki-fuellen', 'erinnerung', 'unterseite', 'zaehler',
        'wiederholen', 'fremd-setzen', 'neue-zeile', 'benachricht', 'mail',
        'archivieren', 'loeschen', 'leeren', 'duplizieren', 'kommentar',
        'zurueckstellen', 'webhook'
    ]);
    /**
     * Was eine Aktion im Probelauf zu melden hat — der Wert, mit dem sie
     * arbeiten WÜRDE, mit aufgelösten Variablen und Platzhaltern.
     *
     * Nur lesen. Diese Funktion darf nichts anfassen; sie läuft an der
     * Stelle, an der der Probelauf abbricht, und wäre sonst genau das Leck,
     * das er verhindern soll.
     */
    const probeWert = (d, mitVars, coll, row) => {
        const fuellen = (t) => String(mitVars(String(t ?? ''))).replace(/\{titel\}/g, row?.text || '');
        switch (d.art) {
            case 'setze-prop': {
                const v = fuellen(d.wert);
                return v === 'heute' ? new Date().toISOString().slice(0, 10)
                    : v === 'morgen' ? (() => {
                        const t = new Date();
                        t.setDate(t.getDate() + 1);
                        return t.toISOString().slice(0, 10);
                    })()
                        : v === 'jetzt' ? new Date().toISOString().slice(0, 16)
                            : v;
            }
            case 'leeren': return '(leer)';
            case 'zaehler': return String(Formula.zahl(wert(row, d.key, coll)) + 1);
            case 'neue-zeile': return fuellen(d.titel || '{titel}') + ' in „' +
                (Store.getCollection(d.zielDb)?.name || '?') + '"';
            case 'mail': return fuellen(d.betreff) + ' → ' + fuellen(d.an);
            case 'webhook': return String(d.url || '');
            case 'benachricht':
            case 'melden':
            case 'kommentar': return fuellen(d.text);
            case 'unterseite': return fuellen(d.titel || d.text);
            case 'wiederholen': return String(naechstesDatum(wert(row, d.key, coll), d.takt) ?? '—');
            case 'variablen': return (d.vars || []).map((v) => v?.name).filter(Boolean).join(', ');
            case 'fremd-setzen': return 'in „' + (Store.getCollection(d.ziel)?.name || '?') + '“';
            case 'zurueckstellen': return String(d.takt || d.wert || '');
            default: return fuellen(d.wert ?? '');
        }
    };
    /**
     * Einträge einer anderen Datenbank ändern — Notions „Edit pages in".
     * Wahlweise alle, die durch den Filter einer Ansicht kommen, oder alle,
     * die einer Regel entsprechen. Höchstens 500 auf einmal.
     */
    const fremdSetzen = (d, row, coll) => {
        const ziel = Store.getCollection(d.ziel);
        if (!ziel) {
            UI.toast('Die Zieldatenbank gibt es nicht mehr');
            return 0;
        }
        let zeilen = Store.rowsOf(ziel.id);
        if (d.ansicht) {
            const v = Store.getView(d.ansicht);
            if (v)
                zeilen = zeilen.filter(z => gruppeTrifftZu(z, v.filters, ziel));
        }
        if (d.filterKey && ziel.schema[d.filterKey]) {
            zeilen = zeilen.filter(z => trifftZu(z, {
                key: d.filterKey,
                op: d.filterOp || (OPERATOREN[ziel.schema[d.filterKey].type] || OPERATOREN['text'] || [])[0],
                wert: d.filterWert
            }, ziel));
        }
        if (d.nurVerknuepft && row) {
            const rel = Object.keys(ziel.schema).find(k => ziel.schema[k].type === 'relation' && ziel.schema[k].collectionId === (coll || {}).id);
            if (rel)
                zeilen = zeilen.filter(z => (z.props?.[rel] || []).includes(row.id));
        }
        zeilen = zeilen.slice(0, 500);
        if (!ziel.schema[d.zielKey]) {
            UI.toast('Die Zieleigenschaft gibt es nicht mehr');
            return 0;
        }
        zeilen.forEach(z => {
            let v = platzhalter(d.wert ?? '');
            if (v === '{titel}')
                v = (row && row.text) || '';
            if (v === '{leer}')
                v = '';
            if (ziel.schema[d.zielKey].type === 'checkbox')
                v = v === 'true' || v === 'ja' || v === true;
            if (ziel.schema[d.zielKey].type === 'number')
                v = Formula.zahl(v);
            Store.setProp(z.id, d.zielKey, v);
        });
        return zeilen.length;
    };
    /* Der Laufverlauf wird gebündelt gesichert — sonst schreibt jede Aktion
       die ganze Sammlung neu. */
    let verlaufTimer = null;
    const verlaufSichern = (coll) => {
        clearTimeout(verlaufTimer);
        verlaufTimer = setTimeout(() => {
            try {
                Store.updateCollection(coll.id, { automationen: coll.automationen });
            }
            catch { }
        }, 900);
    };
    /** Die eigene Datenbank für einen kontrollierten Mehrzeilenlauf auswählen. */
    const fuerJedeZeilen = (a, coll) => {
        const cfg = a.fuerJede || {};
        let zeilen = Store.rowsOf(coll.id).slice();
        const filter = cfg.filter || {};
        if (filter.key && !coll.schema[filter.key])
            return {
                zeilen: [], gefunden: 0, maximum: 0, ausgelassen: 0,
                fehler: 'Die Filtereigenschaft „' + filter.key + '“ wurde nicht gefunden'
            };
        if (filter.key && coll.schema[filter.key]) {
            const erlaubte = OPERATOREN[coll.schema[filter.key].type] || OPERATOREN['text'] || [];
            if (filter.op && !erlaubte.includes(filter.op))
                return {
                    zeilen: [], gefunden: 0, maximum: 0, ausgelassen: 0,
                    fehler: 'Der Filteroperator „' + filter.op + '“ ist für diese Eigenschaft ungültig'
                };
            zeilen = zeilen.filter((z) => trifftZu(z, {
                key: filter.key,
                op: filter.op || (OPERATOREN[coll.schema[filter.key].type] || OPERATOREN['text'] || [])[0],
                wert: filter.wert
            }, coll));
        }
        const sort = cfg.sort || {};
        if (sort.key && !coll.schema[sort.key])
            return {
                zeilen: [], gefunden: 0, maximum: 0, ausgelassen: 0,
                fehler: 'Die Sortiereigenschaft „' + sort.key + '“ wurde nicht gefunden'
            };
        if (sort.key && coll.schema[sort.key]) {
            const richtung = sort.richtung === 'ab' ? -1 : 1;
            zeilen.sort((x, y) => {
                const ax = wert(x, sort.key, coll), ay = wert(y, sort.key, coll);
                const nx = Number(ax), ny = Number(ay);
                if (String(ax ?? '') !== '' && String(ay ?? '') !== '' && isFinite(nx) && isFinite(ny))
                    return (nx - ny) * richtung;
                return String(ax ?? '').localeCompare(String(ay ?? ''), 'de', { numeric: true, sensitivity: 'base' }) * richtung;
            });
        }
        const gefunden = zeilen.length;
        const maximum = Math.max(1, Math.min(500, Number(cfg.max) || 100));
        return { zeilen: zeilen.slice(0, maximum), gefunden, maximum,
            ausgelassen: Math.max(0, gefunden - maximum) };
    };
    const automationenLaufen = async (row, coll, art, key, neuerWert, ctx) => {
        if (!coll || !(coll.automationen || []).length)
            return;
        ctx = ctx || {};
        const eigenerLauf = !ctx.lauf;
        ctx.lauf = ctx.lauf || neuerAutomationsLauf(ctx.probe ? 'vorschau' : art || 'ereignis');
        ctx.trace = Array.isArray(ctx.trace) ? ctx.trace : [];
        if (ctx.lauf.abgebrochen || ctx.signal?.aborted) {
            ctx.lauf.abgebrochen = true;
            ctx.lauf.status = 'abgebrochen';
            return;
        }
        try {
            for (const a of coll.automationen) {
                if (a.an === false)
                    continue;
                /* --- Mehrere Auslöser -------------------------------------------
                 * Notion kennt „wenn einer davon eintritt" und „wenn alle eintreten".
                 * Bei „alle" müssen sie innerhalb von rund drei Sekunden passieren —
                 * genau die Regel, die Notions Hilfe nennt.
                 * -------------------------------------------------------------- */
                const alleAusloeser = [a.wenn || {}, ...(a.weitereWenn || [])];
                const passt = (w) => {
                    if (w.art !== art)
                        return false;
                    if (!OHNE_SPALTE.includes(w.art) && w.key && w.key !== key)
                        return false;
                    if (w.art === 'prop-wert' && String(neuerWert ?? '') !== String(w.wert ?? ''))
                        return false;
                    /* Die Ansichts-Auslöser gelten je Ansicht — sonst würde eine
                       Automation für „Diese Woche" auch bei „Alle" feuern. */
                    if ((w.art === 'ansicht-rein' || w.art === 'ansicht-raus') &&
                        w.ansicht && w.ansicht !== ctx.ansicht)
                        return false;
                    /* Eine Datei-Automation darf an einer Spalte hängen */
                    if (w.art === 'datei-neu' && w.key && w.key !== key)
                        return false;
                    return true;
                };
                const getroffen = alleAusloeser.findIndex(passt);
                if (getroffen < 0)
                    continue;
                /* Dieselbe Automation darf in derselben Wirkungskette nicht wieder
                   zu sich zurückkehren. Das fängt insbesondere `zeile-neu → neue
                   Zeile` und `zeile-neu → duplizieren`, deren addRow-Hook früher
                   ohne Herkunft eine neue, endlose Kette begann. */
                if (ctx.trace.includes(a.id)) {
                    a.verlauf = [{ wann: new Date().toISOString(), zeile: row?.text || '',
                            aktionen: [], fehler: 'Schleife gestoppt: Automation „' +
                                (a.name || 'Ohne Namen') + '“ kam in demselben Lauf erneut vor',
                            runId: ctx.lauf.id }, ...(a.verlauf || [])].slice(0, 100);
                    verlaufSichern(coll);
                    continue;
                }
                /* --- Schleifenschutz, Stufe 2: der KETTEN-DECKEL (E86) ----------
                 * Fünf Stufen Automation-löst-Automation-aus sind erlaubt — eine
                 * ehrliche Kette braucht selten mehr als zwei. Ab der sechsten
                 * ist es fast sicher ein Kreisel mit wechselnden Werten, den der
                 * Gleichwert-Schutz nicht fangen kann. Der Halt steht im Verlauf:
                 * still verhungern lassen wäre gelogen. */
                if (((ctx && ctx.kette) || 0) >= 5) {
                    a.verlauf = [{ wann: new Date().toISOString(),
                            zeile: (row && row.text) || '', aktionen: [],
                            fehler: 'Ketten-Deckel: nach 5 Automations-Stufen angehalten — mögliche Endlosschleife' },
                        ...(a.verlauf || [])].slice(0, 100);
                    verlaufSichern(coll);
                    continue;
                }
                if ((a.weitereWenn || []).length && a.wennModus === 'alle') {
                    a.gefeuert = a.gefeuert || {};
                    const jetztMs = new Date().getTime();
                    a.gefeuert[getroffen] = jetztMs;
                    /* Zu alte Treffer zählen nicht mehr mit */
                    Object.keys(a.gefeuert).forEach(i => {
                        if (jetztMs - a.gefeuert[i] > 3000)
                            delete a.gefeuert[i];
                    });
                    if (Object.keys(a.gefeuert).length < alleAusloeser.length)
                        continue;
                    a.gefeuert = {};
                }
                const eineZeileLaufen = (row) => {
                    if (!row || ctx.lauf.abgebrochen || ctx.signal?.aborted)
                        return { geaendert: false, fehler: false, uebersprungen: true };
                    const ungueltig = (a.bedingungen || [])
                        .map((b) => bedingungFehler(b, coll)).find(Boolean) || '';
                    if (ungueltig) {
                        if (ctx.probe)
                            ctx.probe.push({ name: 'Bedingung der Automation',
                                art: 'bedingung', zeile: row?.text || '',
                                status: 'ungültige Bedingung', grund: ungueltig });
                        else {
                            a.verlauf = [{ wann: new Date().toISOString(), zeile: row?.text || '',
                                    aktionen: [], fehler: 'Ungültige Bedingung: ' + ungueltig,
                                    runId: ctx.lauf.id }, ...(a.verlauf || [])].slice(0, 100);
                            verlaufSichern(coll);
                        }
                        return { geaendert: false, fehler: true, uebersprungen: true };
                    }
                    const standVorher = (() => {
                        try {
                            return JSON.stringify(Store.getBlock(row.id));
                        }
                        catch {
                            return '';
                        }
                    })();
                    const probeStart = Array.isArray(ctx.probe) ? ctx.probe.length : 0;
                    /* Zusätzliche Bedingungen — alle müssen zutreffen. Benannte
                       Bedingungen dürfen auch nach dem alten Wert fragen.
            
                       Seit E85 entscheiden sie den ZWEIG, statt nur abzubrechen:
                       treffen sie zu, läuft `dann`; treffen sie nicht, läuft `sonst`.
                       Kein sonst heisst wie eh und je: nichts. Der Feldname `sonst`
                       ist deutsch, weil er so gespeichert wird — als Schwester des
                       bestehenden `dann` (§53.3); bei alten Automationen fehlt er
                       einfach, und fehlen heisst leer. */
                    const bedingungenOk = !(a.bedingungen || []).length ||
                        bedingungenTreffen(a, row, coll, { key, alterWert: ctx.alterWert, neuerWert });
                    const zweigListe = bedingungenOk ? (a.dann || []) : (a.sonst || []);
                    if (!bedingungenOk && !zweigListe.length)
                        return;
                    /* Gilt die Automation nur für eine Ansicht? Dann muss die Zeile
                       auch durch deren Filter kommen. */
                    if (a.nurAnsicht) {
                        const v = Store.getView(a.nurAnsicht);
                        if (v && !gruppeTrifftZu(row, v.filters, coll))
                            return;
                    }
                    /* --- Laufverlauf ------------------------------------------------
                     * Notion hat weder Protokoll noch Testlauf; wenn eine Automation
                     * nicht läuft, steht man im Dunkeln. Hier wird jeder Lauf notiert:
                     * wann, für welche Zeile, mit welchen Aktionen und welchem Fehler.
                     * -------------------------------------------------------------- */
                    const laufNotiz = { wann: new Date().toISOString(),
                        zeile: (row && row.text) || '', aktionen: [], fehler: '' };
                    let rechteFehler = false;
                    let sonstigerFehler = false;
                    if (!bedingungenOk)
                        laufNotiz.zweig = 'sonst';
                    /* Im Probelauf sagt die erste Zeile, welcher Zweig liefe — aber nur,
                       wenn es überhaupt einen sonst-Zweig gibt: Automationen ohne ihn
                       behalten ihre Vorschau unverändert. */
                    if (ctx.probe && (a.sonst || []).length) {
                        ctx.probe.push({ name: bedingungenOk
                                ? 'Bedingungen treffen — der dann-Zweig läuft'
                                : 'Bedingungen treffen nicht — der sonst-Zweig läuft' });
                    }
                    const notieren = () => {
                        a.verlauf = [laufNotiz, ...(a.verlauf || [])].slice(0, 100);
                        verlaufSichern(coll);
                        /* Und einmal ins gemeinsame Protokoll, damit man nicht in jeder
                           Datenbank einzeln nachsehen muss, was heute gelaufen ist. */
                        if (typeof Protokoll !== 'undefined')
                            Protokoll.notieren('automation', 'Automation „' + (a.name || 'Ohne Namen') + '" in „' + (coll.name || 'Datenbank') + '"', { seite: row && row.id, id: a.id,
                                wie: (laufNotiz.zeile ? 'für „' + laufNotiz.zeile + '"' : '') });
                    };
                    /* Variablen, die eine Aktion setzt, stehen allen folgenden zur
                       Verfügung — als {{name}} in jedem Textfeld. Genau wie Notions
                       „Define variables". */
                    const vars = {};
                    const mitVars = (v) => typeof v === 'string'
                        ? v.replace(/\{\{\s*([A-Za-zÄÖÜäöüß0-9_]+)\s*\}\}/g, (_, n) => (n in vars ? String(vars[n]) : ''))
                        : v;
                    /* Jede Aktion läuft EINMAL für diese Zeile.
                       Über mehrere Zeilen läuft nur `fremd-setzen` — es nimmt die
                       Zeilen einer anderen Datenbank, gefiltert über eine Ansicht, eine
                       eigene Regel oder die Verknüpfung zu dieser Zeile, und ändert sie
                       alle (höchstens 500).
                       Hier stand einmal, eine Aktion dürfe „mehrfach wiederholt werden".
                       Das konnte sie nie; es gibt kein Feld dafür und keinen Zweig, der
                       es läse. Ein Satz im Quelltext ist keine Funktion. */
                    /* Der Rumpf bleibt, wo er ist — er wird nur benannt, damit der Aufruf
                       darunter ihn einpacken kann. Ein `try` um zweihundert Zeilen wäre
                       dieselbe Wirkung mit einer Verschiebung jeder einzelnen davon. */
                    const eineAktion = (d) => {
                        /* --- Bedingung an der einzelnen Aktion — das „sonst" von
                               Notions Automationen, das es dort nicht gibt ------------- */
                        if (d.wenn) {
                            const fehler = bedingungFehler(d.wenn, coll);
                            if (fehler) {
                                const name = (AKTIONEN.find(x => x[0] === d.art) || ['', d.art])[1];
                                if (ctx.probe)
                                    ctx.probe.push({ name, art: d.art,
                                        zeile: row?.text || '', status: 'ungültige Bedingung', grund: fehler });
                                else
                                    laufNotiz.fehler = (laufNotiz.fehler ? laufNotiz.fehler + ' · ' : '') +
                                        name + ': ungültige Bedingung — ' + fehler;
                                sonstigerFehler = true;
                                return;
                            }
                            const ok2 = gruppeTrifftZu(row, { operator: 'and', rules: [{
                                        key: d.wenn.key,
                                        op: d.wenn.op || (OPERATOREN[coll.schema[d.wenn.key]?.type] || OPERATOREN['text'] || [])[0],
                                        wert: mitVars(d.wenn.wert)
                                    }] }, coll);
                            if (d.wenn.umkehren ? ok2 : !ok2) {
                                if (ctx.probe)
                                    ctx.probe.push({
                                        name: (AKTIONEN.find(x => x[0] === d.art) || ['', d.art])[1],
                                        art: d.art, zeile: row?.text || '', status: 'würde übersprungen',
                                        grund: 'Bedingung der Aktion trifft nicht'
                                    });
                                return;
                            }
                        }
                        /* --- Variablen festlegen ---------------------------------- */
                        if (d.art === 'variablen') {
                            (d.vars || []).forEach((v) => {
                                if (!v || !v.name)
                                    return;
                                const r = Formula.run(mitVars(v.formel || ''), (name) => {
                                    const k2 = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
                                    return k2 ? wert(row, k2, coll) : null;
                                }, fremdWert, formelUmgebung(row, coll));
                                vars[v.name] = r.ok ? Formula.anzeige(r.wert) : '';
                            });
                        }
                        /* =================================================================
                         * DER PROBELAUF ENDET HIER — und zwar an EINER Stelle.
                         *
                         * Alles oberhalb liest nur: die Bedingung an der Aktion fragt
                         * Werte ab, „Variablen festlegen" schreibt in ein Objekt, das
                         * beim Verlassen dieser Funktion verschwindet. Alles unterhalb
                         * schreibt: `Store.setProp`, `Store.addRow`, `Store.trashBlock`,
                         * `fetch`, `location.href`.
                         *
                         * Diese Reihenfolge ist der ganze Schutz. Eine neue Aktion, die
                         * jemand unten anhängt, ist damit automatisch mitgeschützt — und
                         * eine, die jemand versehentlich OBEN einfügt, fällt auf, weil
                         * `test133` §2 nach einem Probelauf die Zeile Feld für Feld
                         * vergleicht.
                         *
                         * Warum kein Nachbau der Aktionen für die Vorschau: dann gäbe es
                         * zwei Beschreibungen desselben Ablaufs, und die zweite läuft der
                         * ersten davon. Was der Probelauf zeigt, ist deshalb NICHT das
                         * Ergebnis, sondern der Plan — welche Aktion mit welchen Werten
                         * an der Reihe wäre.
                         * =============================================================== */
                        const aktionsName = (AKTIONEN.find(x => x[0] === d.art) || ['', d.art])[1];
                        const brauchtEigenesFeld = ['setze-prop', 'ki-fuellen', 'zaehler', 'leeren'].includes(d.art);
                        const feldFehlt = brauchtEigenesFeld && (!d.key || !coll.schema[d.key]);
                        const ohneRecht = brauchtEigenesFeld && d.key && typeof Feldrechte !== 'undefined' &&
                            Feldrechte.inKraft() && !Feldrechte.darfSchreiben(coll.id, d.key);
                        const zielFehlt = d.art === 'neue-zeile' && !Store.getCollection(d.zielDb) ||
                            d.art === 'fremd-setzen' && (!Store.getCollection(d.ziel) ||
                                !Store.getCollection(d.ziel)?.schema?.[d.zielKey]);
                        if (feldFehlt || zielFehlt || ohneRecht) {
                            const status = ohneRecht ? 'keine Berechtigung' : 'nicht gefunden';
                            const grund = ohneRecht ? 'Die Zieleigenschaft ist schreibgeschützt'
                                : feldFehlt ? 'Die Zieleigenschaft gibt es nicht mehr'
                                    : 'Zieldatenbank oder Zieleigenschaft gibt es nicht mehr';
                            if (ctx.probe)
                                ctx.probe.push({ name: aktionsName, art: d.art,
                                    zeile: row?.text || '', status, grund });
                            else
                                laufNotiz.fehler = (laufNotiz.fehler ? laufNotiz.fehler + ' · ' : '') +
                                    aktionsName + ': ' + grund;
                            if (ohneRecht)
                                rechteFehler = true;
                            else
                                sonstigerFehler = true;
                            return;
                        }
                        if (ctx.probe) {
                            let status = SCHREIBAKTIONEN.has(d.art) ? 'wird geändert' : 'würde ausgeführt';
                            const vorschauWert = probeWert(d, mitVars, coll, row);
                            if (d.art === 'setze-prop' && d.key &&
                                JSON.stringify(wert(row, d.key, coll)) === JSON.stringify(vorschauWert))
                                status = 'bleibt unverändert';
                            if (d.art === 'leeren' && d.key) {
                                const jetzt = wert(row, d.key, coll);
                                if (jetzt === '' || jetzt == null || (Array.isArray(jetzt) && !jetzt.length))
                                    status = 'bleibt unverändert';
                            }
                            if (d.art === 'archivieren' && row.archiviert)
                                status = 'bleibt unverändert';
                            ctx.probe.push({
                                name: aktionsName,
                                art: d.art,
                                ziel: d.key ? (coll.schema[d.key]?.name || d.key) : '',
                                wert: vorschauWert,
                                zeile: row?.text || '',
                                status
                            });
                            return;
                        }
                        if (d.art === 'setze-prop' && d.key) {
                            let v = mitVars(d.wert ?? '');
                            if (v === 'heute')
                                v = new Date().toISOString().slice(0, 10);
                            if (v === 'morgen') {
                                const t = new Date();
                                t.setDate(t.getDate() + 1);
                                v = t.toISOString().slice(0, 10);
                            }
                            if (v === 'jetzt')
                                v = new Date().toISOString().slice(0, 16);
                            Store.setProp(row.id, d.key, v);
                        }
                        /* --- Seite in einer Datenbank anlegen — Notions „Add page to" -- */
                        if (d.art === 'neue-zeile') {
                            const ziel = Store.getCollection(d.zielDb);
                            if (!ziel) {
                                UI.toast('Zieldatenbank nicht gefunden');
                                return;
                            }
                            const props = {};
                            (d.felder || []).forEach((fz) => {
                                if (!fz.key)
                                    return;
                                props[fz.key] = platzhalter(mitVars(String(fz.wert ?? ''))
                                    .replace(/\{titel\}/g, row.text || ''));
                            });
                            const neu = Store.addRow(ziel.id, props);
                            const titel = platzhalter(mitVars(String(d.titel || '{titel}'))
                                .replace(/\{titel\}/g, row.text || ''));
                            Store.updateBlock(neu.id, { text: titel });
                            UI.toast('Neue Seite in „' + (ziel.name || 'Datenbank') + '"');
                        }
                        /* --- Benachrichtigung — bei uns in den Posteingang ------------- */
                        if (d.art === 'benachricht') {
                            const text = platzhalter(mitVars(String(d.text || ''))
                                .replace(/\{titel\}/g, row.text || '')) || (row.text || coll.name);
                            Werkzeuge.posteingangMelden({
                                text, quelle: coll.name || 'Automation', seite: row.id, art: 'automation'
                            });
                        }
                        /* --- E-Mail senden -------------------------------------------- */
                        if (d.art === 'mail') {
                            const betreff = platzhalter(mitVars(String(d.betreff || ''))
                                .replace(/\{titel\}/g, row.text || '')) || (row.text || 'Redion');
                            const koerper = platzhalter(mitVars(String(d.text || ''))
                                .replace(/\{titel\}/g, row.text || ''));
                            /* Hier stand ein Zweig für `Mail.senden` — die Funktion gibt es
                               nicht, das Mail-Modul kann lesen und antworten, aber nicht
                               verschicken. Der Zweig war tot; es blieb ohnehin immer beim
                               Mailprogramm. */
                            {
                                location.href = 'mailto:' + encodeURIComponent(mitVars(d.an || '')) +
                                    '?subject=' + encodeURIComponent(betreff) +
                                    '&body=' + encodeURIComponent(koerper);
                            }
                        }
                        if (d.art === 'zaehler' && d.key) {
                            Store.setProp(row.id, d.key, Formula.zahl(wert(row, d.key, coll)) + 1);
                        }
                        if (d.art === 'ki-fuellen' && d.key) {
                            /* Läuft neben dem Lauf her, wie der Webhook: der Verlauf ist
                               längst geschrieben, wenn die KI scheitert. Ohne den `.catch`
                               war das eine unbehandelte Ablehnung, die Zelle blieb auf
                               „… denkt nach", und im Verlauf stand ✓. */
                            kiFeldFuellen(row, d.key, coll).catch((e) => {
                                const text = e instanceof Error ? e.message : String(e);
                                laufNotiz.fehler = (laufNotiz.fehler ? laufNotiz.fehler + ' · ' : '') +
                                    'KI-Feld: ' + text;
                                if (!ctx.probe) {
                                    verlaufSichern(coll);
                                    UI.toast('⚠ KI-Feld ging nicht: ' + text);
                                }
                            });
                        }
                        if (d.art === 'erinnerung') {
                            const zeit = new Date();
                            zeit.setDate(zeit.getDate() + (Number(d.tage) || 1));
                            const liste = Werkzeuge.erinnerungen();
                            liste.push({ id: Store.uid(), pageId: row.id, zeit: zeit.toISOString().slice(0, 16),
                                text: row.text || coll.name, erledigt: false });
                            Store.setMeta('erinnerungen', liste);
                        }
                        if (d.art === 'unterseite') {
                            Store.addBlock(row.id, 'text', { text: d.text || '' });
                        }
                        /* Wiederkehrende Aufgabe: der erledigte Eintrag bleibt stehen,
                           daneben entsteht der nächste Termin. */
                        if (d.art === 'wiederholen') {
                            if (wdhZaehler++ > 30) {
                                UI.toast('Wiederholung gestoppt — zu viele auf einmal');
                                return;
                            }
                            const dk = d.key || Object.keys(coll.schema).find(k2 => coll.schema[k2].type === 'date');
                            const alt = dk ? String(wert(row, dk, coll) || '') : '';
                            const neuDatum = naechstesDatum(alt || new Date().toISOString().slice(0, 10), d.text);
                            if (!neuDatum) {
                                UI.toast('Kein Datum zum Weiterzählen gefunden');
                                return;
                            }
                            const props = JSON.parse(JSON.stringify(row.props || {}));
                            if (dk)
                                props[dk] = neuDatum;
                            /* Das Feld, das die Automation ausgelöst hat, wird zurückgesetzt —
                               sonst wäre der neue Eintrag sofort wieder erledigt. */
                            if (key && coll.schema[key]) {
                                props[key] = coll.schema[key].type === 'checkbox' ? false : '';
                            }
                            Object.keys(props).forEach(k2 => {
                                const typ = coll.schema[k2] && coll.schema[k2].type;
                                if (typ === 'formula' || typ === 'rollup' || typ === 'created' || typ === 'edited')
                                    delete props[k2];
                            });
                            const neu3 = Store.addRow(coll.id, props);
                            Store.updateBlock(neu3.id, { text: row.text || '' });
                            UI.toast('🔁 Nächster Termin: ' + neuDatum.slice(0, 10));
                        }
                        /* Einträge einer anderen Datenbank ändern — Notions „Edit pages in". */
                        if (d.art === 'fremd-setzen' && d.ziel) {
                            const n = fremdSetzen(d, row, coll);
                            if (n)
                                UI.toast(n + (n === 1 ? ' Eintrag geändert' : ' Einträge geändert'));
                        }
                        if (d.art === 'melden') {
                            UI.toast('⚡ ' + (d.text || a.name || 'Automation ausgeführt'));
                        }
                        /* --- Die sechs neuen Aktionen ------------------------------- */
                        if (d.art === 'archivieren') {
                            Store.updateBlock(row.id, { archiviert: true, archiviertAm: Store.now() });
                        }
                        if (d.art === 'loeschen') {
                            Store.trashBlock(row.id);
                        }
                        if (d.art === 'leeren' && d.key) {
                            Store.setProp(row.id, d.key, coll.schema[d.key]?.type === 'multi' ? [] : '');
                        }
                        if (d.art === 'duplizieren') {
                            const kopie = Store.addRow(coll.id, { ...(row.props || {}) });
                            Store.updateBlock(kopie.id, { text: (row.text || '') + ' (Kopie)' });
                        }
                        if (d.art === 'kommentar') {
                            const text = platzhalter(mitVars(String(d.text || 'Von einer Automation'))
                                .replace(/\{titel\}/g, row.text || ''));
                            const liste2 = (Store.getBlock(row.id).kommentare || []).slice();
                            liste2.push({ id: Store.uid(), text, zitat: '', autor: a.name || 'Automation',
                                zeit: Store.now(), erledigt: false, antworten: [], reaktionen: {} });
                            Store.updateBlock(row.id, { kommentare: liste2 });
                        }
                        if (d.art === 'zurueckstellen' && typeof Plan !== 'undefined') {
                            const tage = parseInt(String(mitVars(d.wert ?? d.text ?? '1')), 10) || 1;
                            const bis = new Date();
                            bis.setDate(bis.getDate() + tage);
                            bis.setHours(9, 0, 0, 0);
                            Plan.zurueckstellen(row.id, bis, a.name || 'Automation');
                        }
                        if (d.art === 'webhook') {
                            const url = d.text || Store.getMeta('api:webhook', '');
                            if (!url) {
                                UI.toast('Keine Webhook-Adresse hinterlegt');
                                return;
                            }
                            const paket = { datenbank: coll.name, eintrag: row.text || '', zeit: Store.now(),
                                eintragId: row.id, automation: a.name || '', werte: {} };
                            Object.keys(coll.schema).forEach(k2 => {
                                paket.werte[coll.schema[k2].name] = Formula.anzeige(wert(row, k2, coll));
                            });
                            /* Anmeldung am Webhook — Notion schickt gar keine mit. Der
                               Schlüssel steht in den Einstellungen und bleibt im Gerät. */
                            const kopf = { 'Content-Type': 'application/json' };
                            const art = Store.getMeta('webhookAuthArt', 'keine');
                            const wert2 = Store.getMeta('api:webhookAuth', '');
                            if (wert2 && art === 'bearer')
                                kopf.Authorization = 'Bearer ' + wert2;
                            if (wert2 && art === 'basic')
                                kopf.Authorization = 'Basic ' + btoa(wert2);
                            if (wert2 && art === 'kopf')
                                kopf[Store.getMeta('webhookAuthName', 'X-Api-Key')] = wert2;
                            if (wert2 && art === 'geheim')
                                paket.geheimnis = wert2;
                            /* Der Webhook läuft neben dem Lauf her — `eineAktion` kehrt
                               zurück, bevor die Antwort da ist, und `notieren()` schreibt
                               den Verlauf mit ✓. Ein Fehler, der DANACH eintrifft, muss den
                               Eintrag noch auf ⚠ drehen: `notieren` legt `laufNotiz` als
                               Objekt in den Verlauf, die Referenz lebt also weiter, und
                               `verlaufSichern` schreibt den Stand erneut. Ohne das stand im
                               Verlauf ein Haken, obwohl nie etwas ankam. */
                            const webhookFehler = (text) => {
                                laufNotiz.fehler = (laufNotiz.fehler ? laufNotiz.fehler + ' · ' : '') +
                                    'Webhook: ' + text;
                                if (!ctx.probe)
                                    verlaufSichern(coll);
                            };
                            KI.holen(url, { method: 'POST', headers: kopf,
                                body: JSON.stringify(paket) }, { versuche: 3, beiWartezeit: (sek, nr) => UI.toast('Webhook meldet sich nicht — Versuch ' + (nr + 1) + ' in ' + sek + ' s') })
                                .then((r) => {
                                if (r.ok) {
                                    UI.toast('An den Webhook geschickt');
                                    return;
                                }
                                const text = 'antwortet mit ' + r.status +
                                    (KI.FEHLERTEXT[r.status] ? ' — ' + KI.FEHLERTEXT[r.status] : '');
                                webhookFehler(text);
                                UI.banner('Webhook ' + text, 'warn');
                            })
                                .catch((err) => {
                                const text = (err instanceof Error ? err.message : String(err));
                                webhookFehler(text);
                                UI.banner('Webhook nicht erreicht: ' + text +
                                    ' — viele Dienste erlauben keinen Zugriff direkt aus dem Browser.', 'warn');
                            });
                        }
                        laufNotiz.aktionen.push((AKTIONEN.find((x) => x[0] === d.art) || [])[1] || d.art);
                    };
                    /* --- Ein Fehler stoppt nicht alles Weitere ------------------------
                     * `laufNotiz.fehler` gab es seit jeher, und der Laufverlauf zeigt
                     * dafür ein ⚠. Gesetzt hat es nie jemand — das Feld stand auf ''
                     * und blieb dort. Ein Zeichen, das nie erscheint, ist schlimmer als
                     * keines: es sagt „hier wäre ein Fehler zu sehen".
                     *
                     * Und schlimmer noch war, was ohne diesen Griff geschah: eine
                     * Aktion, die wirft, riss den ganzen forEach mit. Die Aktionen
                     * DAHINTER liefen nicht, die Automation schrieb keinen Verlauf,
                     * und die nächste Automation der Datenbank kam nie an die Reihe —
                     * still, denn geworfen wurde in einen Aufruf, den niemand fängt.
                     * ---------------------------------------------------------------- */
                    /* Solange die Aktionen laufen, gilt die nächste Stufe der Kette —
                       jeder setProp darin fängt sie synchron (E86). */
                    const ketteVorher = laufKette;
                    const kontextVorher = aktuellerAutomationsKontext;
                    laufKette = ((ctx && ctx.kette) || 0) + 1;
                    aktuellerAutomationsKontext = {
                        lauf: ctx.lauf,
                        trace: [...ctx.trace, a.id],
                        kette: laufKette
                    };
                    try {
                        for (const d of zweigListe) {
                            if (!laufSchritt(ctx.lauf) || ctx.signal?.aborted) {
                                ctx.lauf.abgebrochen = true;
                                ctx.lauf.status = 'abgebrochen';
                                laufNotiz.fehler = (laufNotiz.fehler ? laufNotiz.fehler + ' · ' : '') +
                                    'Lauf abgebrochen oder Schrittmaximum erreicht';
                                break;
                            }
                            try {
                                eineAktion(d);
                            }
                            catch (e) {
                                const name = (AKTIONEN.find((x) => x[0] === d.art) || ['', d.art])[1];
                                const text = e instanceof Error ? e.message : String(e);
                                laufNotiz.fehler = (laufNotiz.fehler ? laufNotiz.fehler + ' · ' : '') +
                                    name + ': ' + text;
                                sonstigerFehler = true;
                                /* Nicht nur ins Protokoll: wer gerade zusieht, soll es sehen. */
                                if (!ctx.probe)
                                    UI.toast('⚠ „' + name + '“ ging nicht: ' + text);
                            }
                        }
                    }
                    finally {
                        laufKette = ketteVorher;
                        aktuellerAutomationsKontext = kontextVorher;
                    }
                    /* Ein Probelauf ist nicht gelaufen. Er darf deshalb weder im
                       Laufverlauf noch im gemeinsamen Protokoll stehen — sonst zeigte
                       die Automation morgen zwanzig Läufe, von denen keiner stattfand. */
                    if (!ctx.probe)
                        notieren();
                    const standNachher = (() => {
                        try {
                            return JSON.stringify(Store.getBlock(row.id));
                        }
                        catch {
                            return '';
                        }
                    })();
                    const probeNeu = Array.isArray(ctx.probe) ? ctx.probe.slice(probeStart) : [];
                    const probeAendert = probeNeu.some((x) => x.status === 'wird geändert');
                    return {
                        geaendert: probeAendert || standVorher !== standNachher ||
                            laufNotiz.aktionen.some((name) => {
                                const artId = AKTIONEN.find(x => x[1] === name)?.[0];
                                return !!artId && SCHREIBAKTIONEN.has(artId);
                            }),
                        ohneRecht: rechteFehler || probeNeu.some((x) => x.status === 'keine Berechtigung'),
                        fehler: sonstigerFehler || probeNeu.some((x) => x.status === 'Fehler' || x.status === 'nicht gefunden' ||
                            x.status === 'ungültige Bedingung'),
                        uebersprungen: !laufNotiz.aktionen.length && !probeAendert &&
                            !probeNeu.some((x) => x.status === 'würde ausgeführt')
                    };
                };
                const auswahl = a.fuerJede?.an
                    ? fuerJedeZeilen(a, coll)
                    : { zeilen: [row], gefunden: 1, maximum: 1, ausgelassen: 0 };
                const summe = {
                    geprueft: 0, geaendert: 0, unveraendert: 0, ohneRecht: 0,
                    fehler: 0, abgebrochen: 0, ausgelassen: auswahl.ausgelassen
                };
                if (auswahl.fehler) {
                    if (ctx.probe)
                        ctx.probe.push({ name: 'Zeilenauswahl', art: 'fuer-jede',
                            status: 'ungültige Bedingung', grund: auswahl.fehler });
                    else {
                        a.verlauf = [{ wann: new Date().toISOString(), zeile: 'Mehrzeilenlauf',
                                aktionen: [], fehler: auswahl.fehler, runId: ctx.lauf.id },
                            ...(a.verlauf || [])].slice(0, 100);
                        verlaufSichern(coll);
                    }
                    continue;
                }
                for (let zeilenIndex = 0; zeilenIndex < auswahl.zeilen.length; zeilenIndex++) {
                    const zielZeile = auswahl.zeilen[zeilenIndex];
                    if (ctx.lauf.abgebrochen || ctx.signal?.aborted) {
                        ctx.lauf.abgebrochen = true;
                        ctx.lauf.status = 'abgebrochen';
                        summe.abgebrochen = auswahl.zeilen.length - summe.geprueft;
                        break;
                    }
                    summe.geprueft++;
                    const ergebnis = eineZeileLaufen(zielZeile);
                    if (ergebnis?.ohneRecht)
                        summe.ohneRecht++;
                    else if (ergebnis?.fehler)
                        summe.fehler++;
                    else if (ergebnis?.geaendert)
                        summe.geaendert++;
                    else
                        summe.unveraendert++;
                    /* Ein Mehrzeilenlauf gibt dem Browser regelmässig Luft. Nur so
                       kann der sichtbare Abbruchknopf während eines 500-Zeilen-Laufs
                       tatsächlich angeklickt werden; ein synchroner Knopf wäre bloss
                       Dekoration. Vorschauen bleiben synchron und schreiben nie. */
                    if (!ctx.probe && a.fuerJede?.an && zeilenIndex + 1 < auswahl.zeilen.length &&
                        (zeilenIndex + 1) % 8 === 0)
                        await new Promise(resolve => setTimeout(resolve, 4));
                }
                if (a.fuerJede?.an) {
                    const zusammenfassung = `${summe.geprueft} Zeilen geprüft · ${summe.geaendert} geändert · ` +
                        `${summe.unveraendert} unverändert · ${summe.ohneRecht} ohne Recht · ${summe.fehler} Fehler` +
                        (summe.ausgelassen ? ` · ${summe.ausgelassen} wegen Maximum ausgelassen` : '') +
                        (summe.abgebrochen ? ` · ${summe.abgebrochen} nach Abbruch nicht bearbeitet` : '');
                    if (ctx.probe)
                        ctx.probe.push({ name: zusammenfassung,
                            art: 'zusammenfassung', status: 'Zusammenfassung', zusammenfassung: summe });
                    else {
                        a.verlauf = [{ wann: new Date().toISOString(), zeile: 'Mehrzeilenlauf',
                                aktionen: [], fehler: summe.fehler ? summe.fehler + ' Zeilen mit Fehler' : '',
                                runId: ctx.lauf.id, zusammenfassung: summe, text: zusammenfassung },
                            ...(a.verlauf || [])].slice(0, 100);
                        verlaufSichern(coll);
                    }
                }
            }
        }
        finally {
            if (eigenerLauf) {
                if (ctx.lauf.status === 'laeuft')
                    ctx.lauf.status = ctx.lauf.abgebrochen ? 'abgebrochen' : 'fertig';
                setTimeout(() => aktiveAutomationsLaeufe.delete(ctx.lauf.id), 1500);
            }
        }
    };
    /**
     * Zeitauslöser: „drei Tage vor dem Fälligkeitsdatum". Wird beim Start und
     * danach stündlich geprüft. Jede Zeile löst höchstens einmal je Automation aus.
     */
    /**
     * Wann war der letzte fällige Zeitpunkt eines Taktes vor „jetzt"?
     * Gibt eine Marke zurück wie „2026-08-02T09" — läuft die Automation schon
     * unter dieser Marke, passiert nichts mehr. So läuft sie genau einmal je
     * Takt, egal wie oft die App geöffnet wird.
     */
    /* ------------------------------------------------------------------------
     * ZEITZONEN
     * ------------------------------------------------------------------------
     * „Jeden Montag um 09:00" heisst: 09:00 wo? Bisher galt immer die Uhr des
     * Geräts — wer auf Reisen ist oder im Team über Länder hinweg arbeitet,
     * bekam den Lauf zur falschen Stunde. Jetzt darf jede wiederkehrende
     * Automation ihre eigene Zone haben.
     *
     * Der Trick: aus einem Zeitpunkt die Wanduhrzeit der Zielzone lesen und
     * daraus ein neues Datum bauen. Dessen Ortsgetter liefern dann genau die
     * Zahlen der Zielzone — Sommerzeit inbegriffen, weil Intl das rechnet.
     * ---------------------------------------------------------------------- */
    const inZone = (d, zone) => {
        if (!zone)
            return new Date(d);
        try {
            const f = new Intl.DateTimeFormat('en-CA', {
                timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit',
                day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const t = {};
            f.formatToParts(d).forEach(x => { t[x.type] = x.value; });
            return new Date(Number(t['year']), Number(t['month']) - 1, Number(t['day']), Number(t['hour']), Number(t['minute']), Number(t['second']));
        }
        catch {
            return new Date(d);
        } /* unbekannte Zone: lieber Gerätezeit als gar nichts */
    };
    /** Die Zonen, die der Browser kennt — sonst eine kurze, ehrliche Liste. */
    const ZONEN = () => {
        try {
            if (Intl.supportedValuesOf)
                return Intl.supportedValuesOf('timeZone');
        }
        catch { }
        return ['Europe/Zurich', 'Europe/Berlin', 'Europe/Vienna', 'Europe/London',
            'Europe/Istanbul', 'America/New_York', 'America/Chicago',
            'America/Los_Angeles', 'Asia/Dubai', 'Asia/Kolkata',
            'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'];
    };
    const eigeneZone = () => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        }
        catch {
            return '';
        }
    };
    const taktMarke = (takt, uhr, jetzt, zone) => {
        const [hh, mm] = String(uhr || '09:00').split(':').map(x => parseInt(x, 10) || 0);
        const p = (n) => String(n).padStart(2, '0');
        const d = inZone(jetzt, zone);
        if (takt === 'stuendlich') {
            return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours());
        }
        /* Alle anderen Takte haben eine feste Uhrzeit am Tag. Ist sie heute
           noch nicht erreicht, zählt der Tag davor. */
        const heuteFaellig = new Date(d);
        heuteFaellig.setHours(hh ?? 0, mm ?? 0, 0, 0);
        const bezug = d >= heuteFaellig ? new Date(d) : new Date(d.getTime() - 86400000);
        bezug.setHours(0, 0, 0, 0);
        const tag = bezug.getFullYear() + '-' + p(bezug.getMonth() + 1) + '-' + p(bezug.getDate());
        if (takt === 'taeglich')
            return tag;
        if (takt === 'werktags') {
            /* Am Wochenende läuft nichts — die Marke bleibt die vom Freitag */
            const w = bezug.getDay();
            if (w === 0 || w === 6)
                return null;
            return tag;
        }
        if (takt === 'woechentlich' || takt === 'zweiwoechentlich') {
            const t = new Date(Date.UTC(bezug.getFullYear(), bezug.getMonth(), bezug.getDate()));
            t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
            const jahresstart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
            const kw = Math.ceil(((t.getTime() - jahresstart.getTime()) / 86400000 + 1) / 7);
            if (takt === 'zweiwoechentlich' && kw % 2 === 1)
                return null;
            return t.getUTCFullYear() + '-KW' + p(kw);
        }
        if (takt === 'monatlich')
            return bezug.getFullYear() + '-' + p(bezug.getMonth() + 1);
        if (takt === 'quartal')
            return bezug.getFullYear() + '-Q' + (Math.floor(bezug.getMonth() / 3) + 1);
        if (takt === 'jaehrlich')
            return String(bezug.getFullYear());
        return tag;
    };
    /**
     * Der wiederkehrende Auslöser — Notions „Every {frequency}".
     * Er hängt an keiner Änderung, sondern an der Uhr, und läuft für jede
     * Zeile im Wirkungsbereich: ganze Datenbank oder eine bestimmte Ansicht.
     */
    const wiederkehrendeAutomationen = () => {
        const jetzt = new Date();
        Object.values(Store.cache.collections).forEach(coll => {
            let veraendert = false;
            (coll.automationen || []).forEach((a) => {
                if (a.an === false || !a.wenn || a.wenn.art !== 'wiederkehrend')
                    return;
                const w = a.wenn;
                /* Ab- und Enddatum beachten — in derselben Zone wie der Takt,
                   sonst endet ein Zeitplan in Tokio nach Zürcher Kalender. */
                const jetztZ = inZone(jetzt, w.zone);
                if (w.ab && jetztZ < new Date(w.ab))
                    return;
                if (w.bis && jetztZ > new Date(w.bis + 'T23:59:59'))
                    return;
                /* Die Zone steht in der Marke mit drin: wer sie umstellt, bekommt
                   den nächsten Lauf in der neuen Zone, statt einen zu verlieren.
                   Erst prüfen, dann anhängen — sonst würde aus „kein Lauf heute"
                   die Marke „null@Europe/Zurich" und die Automation liefe doch. */
                const roh = taktMarke(w.takt || 'taeglich', w.uhr, jetzt, w.zone);
                if (!roh)
                    return;
                const marke = roh + (w.zone ? '@' + w.zone : '');
                if (a.zuletzt === marke)
                    return;
                /* Auf welche Zeilen wirkt sie? */
                let zeilenListe = Store.rowsOf(coll.id).filter(r => !r.archiviert);
                if (a.nurAnsicht) {
                    const v = Store.getView(a.nurAnsicht);
                    if (v)
                        zeilenListe = zeilenListe.filter(r => gruppeTrifftZu(r, v.filters, coll));
                }
                if ((a.bedingungen || []).length)
                    zeilenListe = zeilenListe.filter(r => bedingungenTreffen(a, r, coll, {}));
                a.zuletzt = marke;
                veraendert = true;
                /* Ohne Zeilen läuft die Automation trotzdem einmal — für Aktionen,
                   die keine Zeile brauchen, etwa „Seite anlegen in". */
                const ziel = zeilenListe.length ? zeilenListe : [null];
                ziel.slice(0, 500).forEach(r => {
                    if (r)
                        automationenLaufen(r, coll, 'wiederkehrend', null);
                    else
                        automationenLaufen({ id: null, text: coll.name, props: {} }, coll, 'wiederkehrend', null);
                });
            });
            if (veraendert)
                Store.updateCollection(coll.id, { automationen: coll.automationen });
        });
    };
    const zeitAutomationen = () => {
        wiederkehrendeAutomationen();
        Object.values(Store.cache.collections).forEach(coll => {
            (coll.automationen || []).forEach((a) => {
                if (a.an === false)
                    return;
                if (a.wenn.art !== 'zeit-vor' && a.wenn.art !== 'zeit-nach')
                    return;
                const key = a.wenn.key;
                if (!coll.schema[key])
                    return;
                const tage = Number(a.wenn.wert) || 0;
                const heute2 = new Date();
                heute2.setHours(0, 0, 0, 0);
                Store.rowsOf(coll.id).forEach(row => {
                    const v = wert(row, key, coll);
                    if (!v)
                        return;
                    const d = new Date(v);
                    if (isNaN(d.getTime()))
                        return;
                    d.setHours(0, 0, 0, 0);
                    const ziel = new Date(d);
                    ziel.setDate(ziel.getDate() + (a.wenn.art === 'zeit-vor' ? -tage : tage));
                    if (ziel.getTime() !== heute2.getTime())
                        return;
                    const gemerkt = row.autoGelaufen || {};
                    const marke = a.id + ':' + heute2.toISOString().slice(0, 10);
                    if (gemerkt[marke])
                        return;
                    gemerkt[marke] = true;
                    Store.updateBlock(row.id, { autoGelaufen: gemerkt });
                    automationenLaufen(row, coll, a.wenn.art, key);
                });
            });
        });
    };
    /* An die Speicherfunktionen hängen, damit jede Änderung erfasst wird. */
    const automationenEinklinken = () => {
        setTimeout(zeitAutomationen, 4000);
        /* Stündlich reicht für Tages- und Wochentakte; der Stundentakt braucht
           einen engeren Puls, deshalb zusätzlich alle fünf Minuten. */
        setInterval(zeitAutomationen, 3600000);
        setInterval(wiederkehrendeAutomationen, 300000);
        setTimeout(vorlagenLaufen, 5000);
        setInterval(vorlagenLaufen, 1800000);
        setInterval(() => { wdhZaehler = 0; }, 3000);
        const altAddRow = Store.addRow;
        Store.addRow = function (collectionId, props) {
            const ursprung = automationsKontextKopie();
            /* Standardwerte je Spalte — Notion kann das nur über Vorlagen. */
            const c0 = Store.getCollection(collectionId);
            if (c0) {
                const mit = Object.assign({}, props || {});
                Object.entries(c0.schema).forEach(([k, d]) => {
                    if (d.standard === undefined || d.standard === '')
                        return;
                    if (mit[k] !== undefined && mit[k] !== '')
                        return;
                    mit[k] = platzhalter(String(d.standard));
                });
                props = mit;
            }
            const r = altAddRow.call(Store, collectionId, props);
            const c = Store.getCollection(collectionId);
            if (c)
                setTimeout(() => automationenLaufen(r, c, 'zeile-neu', undefined, undefined, ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace, kette: ursprung.kette } : undefined), 0);
            return r;
        };
        const altSetProp = Store.setProp;
        Store.setProp = function (rowId, key, value) {
            const ursprung = automationsKontextKopie();
            /* Erst prüfen, dann schreiben. Ein Wert, der gegen eine Regel
               verstösst, kommt gar nicht erst in die Datenbank — und der Mensch
               erfährt, warum. Wer das nicht will, schaltet es in den
               Einstellungen auf „nur warnen". */
            const zeile = Store.getBlock(rowId);
            const samml = zeile && zeile.parentTable === 'collection'
                ? Store.getCollection(zeile.parentId) : null;
            /* Gesperrt heisst gesperrt: eine gesperrte Zeile nimmt keine Werte an.
               Automationen dürfen weiter schreiben — sonst stünde die Sperre auch
               Aufräumarbeiten im Weg. */
            if (zeile && zeile.gesperrt && !aktuellerAutomationsKontext) {
                try {
                    UI.toast('🔒 Diese Zeile ist gesperrt');
                }
                catch { }
                return zeile;
            }
            if (samml && !aktuellerAutomationsKontext) {
                const pr = pruefeWert(samml, key, zeile, value);
                if (!pr.ok) {
                    const streng = Store.getMeta('regelnStreng', true) !== false;
                    try {
                        UI.toast((streng ? '⛔ ' : '⚠ ') + pr.fehler);
                    }
                    catch { }
                    if (streng)
                        return zeile;
                }
            }
            /* --- Vor dem Schreiben merken, was danach anders sein könnte ------
             * Für „kommt in eine Ansicht" reicht der Zustand nachher nicht; man
             * braucht das Vorher. Gemessen wird nur, wenn es solche Automationen
             * überhaupt gibt — sonst kostet jede Zuweisung unnötig Filterläufe.
             * ---------------------------------------------------------------- */
            const alterWert = zeile ? zeile.props?.[key] : undefined;
            const wachen = samml ? (samml.automationen || []).filter((a) => a.an !== false && a.wenn &&
                (a.wenn.art === 'ansicht-rein' || a.wenn.art === 'ansicht-raus') &&
                a.wenn.ansicht) : [];
            const vorher = {};
            wachen.forEach((a) => {
                const v = Store.getView(a.wenn.ansicht);
                if (v && zeile)
                    vorher[a.wenn.ansicht] = gruppeTrifftZu(zeile, v.filters, samml);
            });
            const dateiVorher = Array.isArray(alterWert) ? alterWert.length : 0;
            const erg = altSetProp.call(Store, rowId, key, value);
            const r = Store.getBlock(rowId);
            const c = r && r.parentTable === 'collection' ? Store.getCollection(r.parentId) : null;
            /* --- Schleifenschutz, Stufe 1: GLEICHWERT (E86) -------------------
             * „Eine Eigenschaft ändert sich" muss ändern heissen. Eine
             * Automation „wenn X sich ändert → setze X auf fest" lief sonst
             * endlos — gemessen: 720 Schreibvorgänge in drei Sekunden, für
             * immer. Der imLauf-Riegel hilft nicht, weil der Hook verzögert
             * feuert. Listen (Dateien, Verknüpfungen) werden nach Inhalt
             * verglichen, nicht nach Hülle. */
            const gleichGeblieben = alterWert === value ||
                (() => {
                    try {
                        return JSON.stringify(alterWert) === JSON.stringify(value);
                    }
                    catch {
                        return false;
                    }
                })();
            /* --- Stufe 2: KETTENTIEFE — synchron gefangen ---------------------
             * Läuft dieser setProp aus einer Automation heraus, trägt er ihre
             * Tiefe weiter. Ping-Pong mit WECHSELNDEN Werten (a→b→a→…) fängt
             * Stufe 1 nicht — den fängt der Deckel im Läufer. */
            const kette = ursprung?.kette ?? laufKette;
            if (c)
                setTimeout(() => {
                    if (!gleichGeblieben) {
                        const basis = ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace } : {};
                        automationenLaufen(r, c, 'prop-geaendert', key, value, { ...basis, alterWert, kette });
                        automationenLaufen(r, c, 'prop-wert', key, value, { ...basis, alterWert, kette });
                        automationenLaufen(r, c, 'zeile-geaendert', key, value, { ...basis, alterWert, kette });
                    }
                    /* Eine Datei ist dazugekommen */
                    if ((c.schema[key] || {}).type === 'files' &&
                        Array.isArray(value) && value.length > dateiVorher)
                        automationenLaufen(r, c, 'datei-neu', key, value, { ...(ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace } : {}), alterWert, kette });
                    /* Grenzübertritt in eine Ansicht — in beide Richtungen */
                    const gesehen = {};
                    wachen.forEach((a) => {
                        const vid = a.wenn.ansicht;
                        if (gesehen[vid])
                            return;
                        gesehen[vid] = true;
                        const v = Store.getView(vid);
                        if (!v)
                            return;
                        const nachher = gruppeTrifftZu(r, v.filters, c);
                        if (nachher === !!vorher[vid])
                            return;
                        automationenLaufen(r, c, nachher ? 'ansicht-rein' : 'ansicht-raus', key, value, { ...(ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace } : {}),
                            alterWert, ansicht: vid, kette });
                    });
                }, 0);
            return erg;
        };
        /* --- Kommentare und Erwähnungen ----------------------------------
         * Kommentare landen über updateBlock in der Zeile — egal ob als neuer
         * Faden, als Antwort oder aus einer Automation heraus. Ein Blick auf
         * die Länge der Liste genügt, um „da ist einer dazugekommen" zu sehen.
         * ---------------------------------------------------------------- */
        const altUpdate = Store.updateBlock;
        Store.updateBlock = function (id, patch) {
            const ursprung = automationsKontextKopie();
            let vorherAnzahl = -1, alteIds = null;
            if (patch && patch.kommentare) {
                const alt = Store.getBlock(id);
                if (alt && alt.parentTable === 'collection') {
                    vorherAnzahl = (alt.kommentare || []).length;
                    alteIds = new Set((alt.kommentare || []).map((k) => k.id));
                }
            }
            const erg = altUpdate.call(Store, id, patch);
            if (vorherAnzahl >= 0 && patch.kommentare.length > vorherAnzahl) {
                const r = Store.getBlock(id);
                const c = r ? Store.getCollection(r.parentId) : null;
                const neuKomm = patch.kommentare.find((k) => !(alteIds && alteIds.has(k.id))) || {};
                if (c)
                    setTimeout(() => {
                        automationenLaufen(r, c, 'kommentar-neu', null, neuKomm.text || '', { ...(ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace,
                                kette: ursprung.kette } : {}), kommentar: neuKomm });
                        if (/@[\wÄÖÜäöüß]/.test(String(neuKomm.text || '')))
                            automationenLaufen(r, c, 'erwaehnung', null, neuKomm.text || '', { ...(ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace,
                                    kette: ursprung.kette } : {}), kommentar: neuKomm });
                    }, 0);
            }
            return erg;
        };
        /* Aus dem Papierkorb zurück — der Gegenpol zu „zeile-weg". */
        const altRestore = Store.restoreBlock;
        Store.restoreBlock = function (id) {
            const ursprung = automationsKontextKopie();
            const erg = altRestore.call(Store, id);
            const r = Store.getBlock(id);
            if (r && r.parentTable === 'collection') {
                const c = Store.getCollection(r.parentId);
                if (c)
                    setTimeout(() => automationenLaufen(r, c, 'zeile-zurueck', undefined, undefined, ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace, kette: ursprung.kette } : undefined), 0);
            }
            return erg;
        };
        /* Wird ein Eintrag weggeworfen, feuert das noch, solange es ihn gibt. */
        const altTrash = Store.trashBlock;
        Store.trashBlock = function (id) {
            const ursprung = automationsKontextKopie();
            const r = Store.getBlock(id);
            if (r && r.parentTable === 'collection') {
                const c = Store.getCollection(r.parentId);
                if (c) {
                    try {
                        automationenLaufen(r, c, 'zeile-weg', undefined, undefined, ursprung ? { lauf: ursprung.lauf, trace: ursprung.trace, kette: ursprung.kette } : undefined);
                    }
                    catch (e) { }
                }
            }
            return altTrash.call(Store, id);
        };
    };
    const automationenMenue = (_anker, coll, _view, _block) => {
        const liste = coll.automationen || [];
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(620px,94vw)">' +
                `<div class="fh">⚡ Automationen <em>${liste.length}</em>` +
                '<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div class="res" id="al"></div>' +
                '<div class="fbtns">' +
                '<button data-a="kiauto">✨ Von der KI bauen lassen</button>' +
                '<button data-a="neu" class="prim">Automation anlegen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const namen = (k) => coll.schema[k]?.name || '?';
        const zeichne = () => {
            const laufHtml = [...aktiveAutomationsLaeufe.values()]
                .filter(l => l.status === 'laeuft')
                .map(l => '<div class="auto-zeile"><div class="auto-text"><b>Lauf ' +
                esc(l.id) + '</b><span>' + esc(l.origin) + ' · ' + l.schritte +
                ' Schritte</span></div><button data-abbruch="' + esc(l.id) +
                '" class="danger">Abbrechen</button></div>').join('');
            fuelle(o, '#al', laufHtml + ((coll.automationen || []).length
                ? coll.automationen.map((a, i) => `<div class="auto-zeile">` +
                    `<button class="schalter${a.an === false ? '' : ' an'}" data-an="${i}" ` +
                    `role="switch" aria-checked="${a.an === false ? 'false' : 'true'}" ` +
                    `aria-label="${esc(a.name || 'Automation')}"><i></i></button>` +
                    `<div class="auto-text"><b>${esc(a.name || 'Ohne Namen')}</b>` +
                    `<span>Wenn: ${esc((AUSLOESER.find(x => x[0] === a.wenn.art) || [])[1] || '')}` +
                    (a.wenn.key ? ' — ' + esc(namen(a.wenn.key)) : '') +
                    (a.wenn.art === 'prop-wert' ? ' = ' + esc(a.wenn.wert) : '') +
                    (a.wenn.ansicht ? ' — ' + esc((Store.getView(a.wenn.ansicht) || {}).name || 'Ansicht') : '') +
                    (a.wenn.zone ? ' · ' + esc(a.wenn.zone.replace(/_/g, ' ')) : '') +
                    (a.fuerJede?.an ? ' · Für jede eigene Zeile (max. ' +
                        esc(String(a.fuerJede.max || 100)) + ')' : '') +
                    /* Bedingungen sichtbar machen — sonst rätselt man, warum eine
                       Automation nicht läuft, obwohl der Auslöser stimmt. */
                    ((a.bedingungen || []).length
                        ? ' · Nur wenn: ' + esc(a.bedingungen.map((b) => b && b.art
                            ? bedingungText(b)
                            : `${namen(b.key)} ${b.op} ${b.wert}`).join(' und ')) : '') +
                    ` · Dann: ${a.dann.map((d) => esc((AKTIONEN.find(x => x[0] === d.art) || [])[1] || '')).join(', ')}` +
                    ((a.sonst || []).length
                        ? ` · Sonst: ${a.sonst.map((d) => esc((AKTIONEN.find((x) => x[0] === d.art) || [])[1] || '')).join(', ')}`
                        : '') +
                    `</span></div>` +
                    `<button data-test="${i}" title="Probelauf: zeigt den Plan, ändert nichts">▶</button>` +
                    `<button data-verlauf="${i}" title="Laufverlauf">🕘` +
                    ((a.verlauf || []).length ? `<span class="ms">${a.verlauf.length}</span>` : '') +
                    '</button>' +
                    `<button data-weg="${i}" title="Löschen">🗑</button>` +
                    '</div>').join('')
                : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
                    'Noch keine Automation. Zum Beispiel: <i>Wenn Status auf „Erledigt" springt, ' +
                    'dann setze das Datum von heute.</i></div>'));
        };
        zeichne();
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const abbruch = elVon(e)?.closest('[data-abbruch]');
            if (abbruch) {
                UI.toast(automationAbbrechen(abbruch.dataset.abbruch || '')
                    ? 'Automationslauf wird abgebrochen'
                    : 'Dieser Lauf ist bereits beendet');
                zeichne();
                return;
            }
            /* Der Knopf steht in DIESEM Fenster. Die frühere Behandlung lag
               versehentlich im Kalenderquellen-Menü und war deshalb im Produkt
               unerreichbar; Direktaufrufe in Prüfungen hatten das verdeckt. */
            const test = elVon(e)?.closest('[data-test]');
            if (test) {
                const a = coll.automationen[Number(test.dataset.test)];
                const zeile = Store.rowsOf(coll.id)[0];
                if (!a || !zeile) {
                    UI.toast('Für einen Probelauf braucht es mindestens eine Zeile');
                    return;
                }
                const vorher = JSON.stringify({
                    blocks: Store.cache.blocks, collections: Store.cache.collections,
                    meta: Store.cache.meta
                });
                const plan = [];
                automationenLaufen(zeile, coll, a.wenn.art, a.wenn.key, a.wenn.art === 'prop-wert' ? a.wenn.wert : undefined, { probe: plan });
                const nachher = JSON.stringify({
                    blocks: Store.cache.blocks, collections: Store.cache.collections,
                    meta: Store.cache.meta
                });
                const statusIcon = {
                    'wird geändert': '→', 'bleibt unverändert': '＝',
                    'würde übersprungen': '↷', 'keine Berechtigung': '⛔',
                    'ungültige Bedingung': '⚠', 'nicht gefunden': '?',
                    'Fehler': '⚠', 'Zusammenfassung': 'Σ',
                    'würde ausgeführt': '•'
                };
                UI.menu('<div class="grp">Probelauf — ' + esc(a.name || 'Automation') + '</div>' +
                    '<div class="grp" style="font-weight:400;text-transform:none">' +
                    (vorher === nachher
                        ? 'Vorschau bestätigt: Es wurde nichts geschrieben.'
                        : '⚠ Interner Fehler: Der Probelauf hat Daten verändert.') + '</div>' +
                    (plan.length ? plan.map(s => '<button disabled><span class="mi">' + esc(statusIcon[s.status] || '→') + '</span>' +
                        esc(s.status || 'würde ausgeführt') + ': ' + esc(s.name) +
                        (s.zeile ? '<span class="ms">' + esc(s.zeile) + '</span>' : '') +
                        (s.grund ? '<span class="sub">' + esc(s.grund) + '</span>' : '') +
                        '</button>').join('')
                        : '<button disabled>Keine Aktion käme zum Zug.</button>'), test.getBoundingClientRect().left - 260, test.getBoundingClientRect().bottom + 4, { titel: 'Probelauf' });
                return;
            }
            const verl = elVon(e)?.closest('[data-verlauf]');
            if (verl) {
                const a = coll.automationen[Number(verl.dataset.verlauf)];
                const eintraege = a?.verlauf || [];
                UI.menu('<div class="grp">Laufverlauf — ' + esc(a?.name || '') + '</div>' +
                    (eintraege.length ? eintraege.slice(0, 30).map((l) => '<button disabled><span class="mi">' + (l.fehler ? '⚠' : '✓') + '</span>' +
                        esc(Werkzeuge.zeitKurz(l.wann)) + ' — ' + esc(l.zeile || '(ohne Zeile)') +
                        (l.text ? '<span class="sub">' + esc(l.text) + '</span>' : '') +
                        '</button>').join('') : '<button disabled>Noch nie gelaufen</button>'), verl.getBoundingClientRect().left - 240, verl.getBoundingClientRect().bottom + 4, { titel: 'Laufverlauf' });
                return;
            }
            const an = elVon(e)?.closest('[data-an]');
            if (an) {
                const a = coll.automationen[Number(an.dataset.an)];
                a.an = a.an === false;
                Store.updateCollection(coll.id, { automationen: coll.automationen });
                zeichne();
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                coll.automationen.splice(Number(weg.dataset.weg), 1);
                Store.updateCollection(coll.id, { automationen: coll.automationen });
                zeichne();
                return;
            }
            if (elVon(e)?.closest('[data-a="kiauto"]')) {
                o.remove();
                KiBau.automationSchreiben(coll);
                return;
            }
            if (elVon(e)?.closest('[data-a="neu"]')) {
                o.remove();
                automationBauen(coll);
            }
        });
    };
    const automationBauen = (coll) => {
        const keys = Object.keys(coll.schema);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(560px,94vw)">' +
                '<div class="fh">Neue Automation<button class="icon-btn" data-a="zu">✕</button></div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
                '<label>Name<br><input id="an" value="Neue Automation"></label>' +
                '<label>Wenn …<br><select id="aw">' +
                AUSLOESER.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
                '</select></label>' +
                '<label>… bei dieser Eigenschaft<br><select id="ak">' +
                keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
                '</select></label>' +
                '<label id="awl">… mit diesem Wert<br><input id="av" placeholder="z. B. Erledigt"></label>' +
                /* Zeitplan — nur beim wiederkehrenden Auslöser sichtbar */
                '<div id="azp" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
                'padding:12px; flex-direction:column; gap:11px">' +
                '<label>Wie oft<br><select id="azt">' +
                TAKTE.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
                '</select></label>' +
                '<label>Um welche Uhrzeit<br><input id="azu" type="time" value="09:00"></label>' +
                '<label>Ab wann (leer = sofort)<br><input id="aza" type="date"></label>' +
                '<label>Bis wann (leer = ohne Ende)<br><input id="azb" type="date"></label>' +
                '<label>Nur für diese Ansicht<br><select id="azv">' +
                '<option value="">alle Einträge der Datenbank</option>' +
                Object.values(Store.cache.views).filter(v => v.collectionId === coll.id)
                    .map(v => `<option value="${v.id}">${esc(v.name || 'Ansicht')}</option>`).join('') +
                '</select></label>' +
                /* Zeitzone — „09:00 wo?" ist keine Kleinigkeit, sobald jemand
                   reist oder ein Team über Länder verteilt arbeitet. */
                '<label>In welcher Zeitzone<br><select id="azz">' +
                ZONEN().map(z => `<option value="${esc(z)}"${z === eigeneZone() ? ' selected' : ''}>` +
                    `${esc(z.replace(/_/g, ' '))}</option>`).join('') +
                '</select><span style="font-size:12px;color:var(--text-dim)">' +
                'Sommerzeit wird mitgerechnet.</span></label>' +
                '</div>' +
                /* Welche Ansicht ist gemeint? — für „kommt rein" und „fällt raus" */
                '<label id="aavl" style="display:none">… bei dieser Ansicht<br><select id="aav">' +
                Object.values(Store.cache.views).filter(v => v.collectionId === coll.id)
                    .map(v => `<option value="${v.id}">${esc(v.name || 'Ansicht')}</option>`).join('') +
                '</select></label>' +
                '<div class="ab-wenn"><label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
                '<input type="checkbox" id="afuer" style="width:auto"> für jede eigene Zeile ausführen</label>' +
                '<div id="afuer2" style="display:none;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px">' +
                '<label>Filterspalte<br><select id="afuerk"><option value="">alle Zeilen</option>' +
                keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
                '</select></label>' +
                '<label>Filterwert<br><input id="afuerw" placeholder="z. B. Offen"></label>' +
                '<label>Sortieren nach<br><select id="afuers"><option value="">Einfügereihenfolge</option>' +
                keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
                '</select></label>' +
                '<label>Richtung<br><select id="afuerr"><option value="auf">aufsteigend</option>' +
                '<option value="ab">absteigend</option></select></label>' +
                '<label>Maximale Anzahl (1–500)<br><input id="afuerm" type="number" min="1" max="500" value="100"></label>' +
                '<div style="font-size:12px;color:var(--text-faint);align-self:end">Vorschau und Echtlauf verwenden exakt dieselbe Auswahl.</div>' +
                '</div>' +
                '</div>' +
                '<hr style="border:none;border-top:1px solid var(--line)">' +
                '<label>Dann …<br><select id="ad">' +
                AKTIONEN.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
                '</select></label>' +
                '<label id="adk">… diese Eigenschaft<br><select id="adk2">' +
                keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
                '</select></label>' +
                '<label id="adw">… auf diesen Wert<br><input id="adv" placeholder="z. B. heute"></label>' +
                /* Der sonst-Zweig (E85): treffen die Bedingungen der Automation
                   NICHT zu, laufen die hier markierten Aktionen — statt gar
                   keiner. Der Hinweis ist Pflicht: ein sonst ohne Bedingungen
                   liefe nie, und ein Häkchen, das still nichts bewirkt, wäre
                   gelogen. */
                '<div class="ab-wenn"><label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
                '<input type="checkbox" id="adsonst" style="width:auto"> in den sonst-Zweig legen ' +
                '(läuft, wenn die Bedingungen NICHT zutreffen)</label>' +
                '<div id="sonst-hinweis" style="font-size:12px; color:var(--text-faint); margin-top:4px">' +
                'Der sonst-Zweig braucht Bedingungen („Nur wenn"): ohne sie treffen ' +
                'die Bedingungen immer zu, und sonst-Aktionen liefen nie.</div>' +
                '</div>' +
                /* Bedingung nur für diese eine Aktion — Notions Automationen
                   können das nicht, dort gilt jede Bedingung für alle Aktionen. */
                '<div class="ab-wenn"><label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
                '<input type="checkbox" id="adwenn"> nur wenn eine Bedingung stimmt</label>' +
                '<div id="adwenn2" style="display:none; gap:7px; margin-top:8px; flex-wrap:wrap">' +
                '<select id="adwk">' + keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') + '</select>' +
                '<select id="adwo"></select>' +
                '<input id="adwv" placeholder="Wert" style="flex:1;min-width:110px">' +
                '<label style="display:flex;gap:6px;align-items:center;font-size:12.5px">' +
                '<input type="checkbox" id="adwn" style="width:auto"> umkehren (sonst-Fall)</label>' +
                '</div></div>' +
                /* Variablen festlegen — je Zeile ein Name und eine Formel */
                '<div id="avz" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
                'padding:12px; flex-direction:column; gap:8px">' +
                '<div style="font-size:12.5px; color:var(--text-dim)">Je Zeile: ' +
                '<code>name = Formel</code>. In späteren Aktionen einsetzbar als ' +
                '<code>{{name}}</code>.</div>' +
                '<textarea id="avt" spellcheck="false" rows="4" ' +
                'placeholder="tage = dateBetween(prop(&quot;Fällig&quot;), today(), &quot;days&quot;)&#10;' +
                'stufe = if(tage &lt; 0, &quot;überfällig&quot;, &quot;offen&quot;)"></textarea>' +
                '</div>' +
                /* Seite in einer Datenbank anlegen */
                '<div id="anz" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
                'padding:12px; flex-direction:column; gap:11px">' +
                '<label>In welcher Datenbank<br><select id="and">' +
                Object.values(Store.cache.collections)
                    .map(c => `<option value="${c.id}">${esc(c.name || 'Ohne Namen')}</option>`).join('') +
                '</select></label>' +
                '<label>Titel der neuen Seite<br><input id="ant" value="{titel}" ' +
                'placeholder="{titel} · {datum} · {{variable}}"></label>' +
                '<label>Eigenschaft setzen (frei lassen, wenn nicht nötig)<br>' +
                '<select id="ank"></select>' +
                '<input id="anv" placeholder="Wert · heute · {titel} · {{variable}}" style="margin-top:5px"></label>' +
                '</div>' +
                /* Benachrichtigung */
                '<div id="abz" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
                'padding:12px; flex-direction:column; gap:11px">' +
                '<label>Text der Benachrichtigung<br><input id="abt" ' +
                'placeholder="{titel} ist überfällig"></label>' +
                '</div>' +
                /* E-Mail */
                '<div id="amz" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
                'padding:12px; flex-direction:column; gap:11px">' +
                '<label>An<br><input id="ama" placeholder="name@beispiel.ch"></label>' +
                '<label>Betreff<br><input id="amb" placeholder="{titel}"></label>' +
                '<label>Nachricht<br><textarea id="amt" rows="3" ' +
                'placeholder="Hallo,&#10;{titel} braucht deine Aufmerksamkeit."></textarea></label>' +
                '</div>' +
                '<div id="afz" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
                'padding:12px; display:none; flex-direction:column; gap:11px">' +
                '<label>In welcher Datenbank<br><select id="afd">' +
                Object.values(Store.cache.collections)
                    .map(c => `<option value="${c.id}">${esc(c.name || 'Ohne Namen')}</option>`).join('') +
                '</select></label>' +
                '<label>Diese Eigenschaft setzen<br><select id="afk"></select></label>' +
                '<label>… auf diesen Wert<br><input id="afv" placeholder="Wert · {titel} · {leer} · heute"></label>' +
                '<label>Nur bei Einträgen, wo …<br>' +
                '<select id="aff"><option value="">alle Einträge</option></select> ' +
                '<input id="affv" placeholder="Wert" style="margin-top:5px"></label>' +
                '<label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
                '<input type="checkbox" id="afr"> nur Einträge, die mit diesem hier verknüpft sind</label>' +
                '</div>' +
                /* --- Bedingungen für die ganze Automation ---------------------
                 * Der Katalog beantwortet Fragen über die Veränderung, nicht nur
                 * über den Zustand: „war vorher leer", „hat sich wirklich
                 * geändert", „ist gewachsen". Genau daran scheitern in Notion
                 * die meisten Automationen.
                 * ------------------------------------------------------------ */
                '<hr style="border:none;border-top:1px solid var(--line)">' +
                '<div style="border:1px solid var(--line); border-radius:6px; padding:12px; ' +
                'display:flex; flex-direction:column; gap:9px">' +
                '<div style="font-size:12.5px; color:var(--text-dim)">Bedingungen gelten für ' +
                'die ganze Automation — es müssen alle zutreffen.</div>' +
                '<select id="abda">' +
                '<option value="">Filterregel aus Spalte und Wert von oben</option>' +
                '<optgroup label="Was mit dem Wert geschehen ist">' +
                BEDINGUNGEN.slice(0, 10).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('') +
                '</optgroup><optgroup label="Was für ein Eintrag es ist">' +
                BEDINGUNGEN.slice(10, 18).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('') +
                '</optgroup><optgroup label="Wann es geschieht">' +
                BEDINGUNGEN.slice(18).map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join('') +
                '</optgroup>' +
                '</select>' +
                '<div id="abdf" style="display:flex; gap:7px; flex-wrap:wrap">' +
                '<select id="abdk" style="display:none">' + keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') + '</select>' +
                '<input id="abdw" placeholder="Wert" style="flex:1;min-width:110px;display:none">' +
                '<select id="abdv" style="display:none">' +
                Object.values(Store.cache.views).filter(v => v.collectionId === coll.id)
                    .map(v => `<option value="${v.id}">${esc(v.name || 'Ansicht')}</option>`).join('') +
                '</select>' +
                '<select id="abdt" style="display:none">' +
                WOCHENTAGE.map(t => `<option>${t}</option>`).join('') + '</select>' +
                '<input id="abdz1" type="time" value="08:00" style="display:none">' +
                '<input id="abdz2" type="time" value="18:00" style="display:none">' +
                '</div>' +
                '<div id="abdl" style="font-size:12.5px; color:var(--text-dim)">' +
                'Noch keine Bedingung.</div>' +
                '</div>' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="bedingung">＋ Bedingung</button>' +
                '<button data-a="mehr">＋ Weitere Aktion</button>' +
                '<button data-a="ok" class="prim">Anlegen</button>' +
                '<button data-a="zu">Abbrechen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const auffrischen = () => {
            const art0 = o.querySelector('#aw')?.value ?? '';
            const zeit = art0 === 'zeit-vor' || art0 === 'zeit-nach';
            const awl = o.querySelector('#awl');
            const av = o.querySelector('#av');
            const ak = o.querySelector('#ak')?.closest('label');
            const azp = o.querySelector('#azp');
            if (!awl || !av || !ak || !azp)
                return;
            awl.style.display = (art0 === 'prop-wert' || zeit) ? '' : 'none';
            if (awl.firstChild)
                awl.firstChild.textContent = zeit ? 'wie viele Tage?' : '… mit diesem Wert';
            av.placeholder = zeit ? 'z. B. 3' : 'z. B. Erledigt';
            /* Auslöser, die an keiner Spalte hängen, brauchen auch keine Auswahl */
            ak.style.display = OHNE_SPALTE.includes(art0) ? 'none' : '';
            /* Der Zeitplan gehört nur zum wiederkehrenden Auslöser */
            const wdh = art0 === 'wiederkehrend';
            azp.style.display = wdh ? 'flex' : 'none';
            if (wdh)
                awl.style.display = 'none';
            /* Die Ansichtsauswahl gehört nur zu den beiden Grenzauslösern */
            const anAnsicht = art0 === 'ansicht-rein' || art0 === 'ansicht-raus';
            const aavl = o.querySelector('#aavl');
            if (aavl)
                aavl.style.display = anAnsicht ? '' : 'none';
            if (anAnsicht)
                awl.style.display = 'none';
            /* Eine Datei-Automation darf sich auf eine Dateispalte beschränken */
            if (art0 === 'datei-neu') {
                ak.style.display = '';
                awl.style.display = 'none';
            }
            const fuerJedeAn = o.querySelector('#afuer')?.checked;
            const fuerJedeFelder = o.querySelector('#afuer2');
            if (fuerJedeFelder)
                fuerJedeFelder.style.display = fuerJedeAn ? 'grid' : 'none';
            /* Welche Felder braucht die gewählte Bedingung? */
            const bArt = o.querySelector('#abda')?.value;
            const eintrag = BEDINGUNGEN.find(x => x[0] === bArt);
            const braucht = eintrag ? String(eintrag[2] ?? '').split(',').filter(Boolean) : ['spalte', 'text'];
            const zeig = (id, an) => {
                const el = o.querySelector(id);
                if (el)
                    el.style.display = an ? '' : 'none';
            };
            zeig('#abdk', !bArt || braucht.includes('spalte'));
            zeig('#abdw', !bArt || braucht.includes('text') || braucht.includes('zahl') ||
                braucht.includes('formel'));
            zeig('#abdv', braucht.includes('ansicht'));
            zeig('#abdt', braucht.includes('wochentag'));
            zeig('#abdz1', braucht.includes('zeitspanne'));
            zeig('#abdz2', braucht.includes('zeitspanne'));
            const abdw = o.querySelector('#abdw');
            if (abdw)
                abdw.placeholder =
                    braucht.includes('zahl') ? 'Zahl, z. B. 3'
                        : braucht.includes('formel') ? 'z. B. prop("Kosten") > 1000'
                            : 'Wert';
            const d = o.querySelector('#ad')?.value ?? '';
            const adk = o.querySelector('#adk');
            const adw = o.querySelector('#adw');
            const adv = o.querySelector('#adv');
            if (adk) {
                adk.style.display =
                    ['setze-prop', 'ki-fuellen', 'zaehler', 'wiederholen', 'leeren'].includes(d) ? '' : 'none';
                if (adk.firstChild)
                    adk.firstChild.textContent =
                        d === 'wiederholen' ? '… welches Datum weitergezählt wird' : '… diese Eigenschaft';
            }
            if (adw)
                adw.style.display =
                    ['setze-prop', 'erinnerung', 'unterseite', 'melden', 'webhook', 'wiederholen',
                        'kommentar', 'zurueckstellen'].includes(d) ? '' : 'none';
            if (adv)
                adv.placeholder =
                    d === 'erinnerung' ? 'in wie vielen Tagen? z. B. 3'
                        : d === 'melden' ? 'Text der Meldung'
                            : d === 'webhook' ? 'Adresse — leer nimmt die aus den Einstellungen'
                                : d === 'wiederholen' ? 'Takt: 1 Woche · 3 Tage · 1 Monat · 5 Werktage'
                                    : d === 'kommentar' ? 'Text des Kommentars — {titel} setzt den Namen ein'
                                        : d === 'zurueckstellen' ? 'in wie vielen Tagen? z. B. 7'
                                            : 'Wert';
            /* Bedingung an der Aktion */
            const wennAn = o.querySelector('#adwenn')?.checked;
            const adwenn2 = o.querySelector('#adwenn2');
            if (adwenn2)
                adwenn2.style.display = wennAn ? 'flex' : 'none';
            if (wennAn) {
                const wk = o.querySelector('#adwk')?.value;
                const ops = OPERATOREN[coll.schema[wk ?? '']?.type] || OPERATOREN['text'] || [];
                const sel = o.querySelector('#adwo');
                if (!sel)
                    return;
                const alt3 = sel.value;
                sel.innerHTML = ops.map((x) => `<option>${esc(x)}</option>`).join('');
                if (ops.includes(alt3))
                    sel.value = alt3;
            }
            const afz = o.querySelector('#afz');
            if (afz)
                afz.style.display = d === 'fremd-setzen' ? 'flex' : 'none';
            zeige(o, '#avz', d === 'variablen', 'flex');
            zeige(o, '#anz', d === 'neue-zeile', 'flex');
            zeige(o, '#abz', d === 'benachricht', 'flex');
            zeige(o, '#amz', d === 'mail', 'flex');
            if (d === 'neue-zeile')
                zielFelderNeu();
        };
        /* Die Eigenschaftsliste für „Seite anlegen in" hängt an der Zieldatenbank */
        const zielFelderNeu = () => {
            const c = Store.getCollection(o.querySelector('#and')?.value);
            fuelle(o, '#ank', '<option value="">— keine Eigenschaft setzen —</option>' +
                (c ? Object.keys(c.schema).filter(k => !['title', 'formula', 'rollup', 'created', 'edited', 'uid'].includes(c.schema[k].type))
                    .map(k => `<option value="${k}">${esc(c.schema[k].name)}</option>`).join('') : ''));
        };
        /* Die Auswahl der Zieleigenschaften hängt an der gewählten Datenbank. */
        const zielFelder = () => {
            const z = Store.getCollection(o.querySelector('#afd')?.value);
            const ks = z ? Object.keys(z.schema) : [];
            fuelle(o, '#afk', ks.map(k => `<option value="${k}">${esc(z.schema[k].name)}</option>`).join(''));
            fuelle(o, '#aff', '<option value="">alle Einträge</option>' +
                ks.map(k => `<option value="${k}">${esc(z.schema[k].name)} …</option>`).join(''));
        };
        if (o.querySelector('#afd')?.options.length)
            zielFelder();
        o.querySelector('#afd')?.addEventListener('change', zielFelder);
        o.querySelector('#and')?.addEventListener('change', zielFelderNeu);
        auffrischen();
        o.querySelector('#aw')?.addEventListener('change', auffrischen);
        o.querySelector('#ad')?.addEventListener('change', auffrischen);
        o.querySelector('#adwenn')?.addEventListener('change', auffrischen);
        o.querySelector('#adwk')?.addEventListener('change', auffrischen);
        o.querySelector('#abda')?.addEventListener('change', auffrischen);
        o.querySelector('#afuer')?.addEventListener('change', auffrischen);
        const gesammelt = [];
        const gesammeltSonst = [];
        const bedingungen = [];
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            /* Zusätzliche Bedingung aufnehmen */
            if (elVon(e)?.closest('[data-a="bedingung"]')) {
                const bArt = o.querySelector('#abda')?.value;
                if (!bArt) {
                    /* Wie bisher: eine gewöhnliche Filterregel aus Spalte und Wert */
                    const k = o.querySelector('#ak')?.value ?? '';
                    const ops = OPERATOREN[coll.schema[k]?.type] || OPERATOREN['text'] || [];
                    bedingungen.push({ key: k, op: ops[0], wert: o.querySelector('#av')?.value });
                }
                else {
                    const eintrag = BEDINGUNGEN.find(x => x[0] === bArt) || ['', '', ''];
                    const braucht = (eintrag[2] ?? '').split(',').filter(Boolean);
                    /* WELCHE Felder dazukommen, sagt der Eintrag in BEDINGUNGEN — die
                       Bedingung „Wochentag ist" braucht einen Wochentag, „Zeitspanne"
                       braucht zwei Zeitpunkte, „Feld ist leer" nur eine Spalte. Darum
                       steht hier ein offener Satz von Feldern: `{ art: bArt }` allein
                       hiesse, es käme nie etwas dazu. */
                    const b = { art: bArt };
                    if (braucht.includes('spalte'))
                        b.key = o.querySelector('#abdk')?.value;
                    if (braucht.includes('text') || braucht.includes('zahl') ||
                        braucht.includes('formel'))
                        b.wert = o.querySelector('#abdw')?.value;
                    if (braucht.includes('ansicht'))
                        b.wert = o.querySelector('#abdv')?.value;
                    if (braucht.includes('wochentag'))
                        b.wert = o.querySelector('#abdt')?.value;
                    if (braucht.includes('zeitspanne')) {
                        b.von = o.querySelector('#abdz1')?.value;
                        b.bis = o.querySelector('#abdz2')?.value;
                    }
                    bedingungen.push(b);
                }
                const abdl = o.querySelector('#abdl');
                if (abdl)
                    abdl.textContent = bedingungen.map(b => b.art ? bedingungText(b)
                        : `${(coll.schema[b.key] || {}).name || b.key} ${b.op} ${b.wert}`).join('  ·  ');
                UI.toast(bedingungen.length + ' Bedingung(en) — alle müssen zutreffen');
                return;
            }
            if (!elVon(e)?.closest('[data-a="ok"]') && !elVon(e)?.closest('[data-a="mehr"]'))
                return;
            const d = o.querySelector('#ad')?.value ?? '';
            /* Wie bei der Bedingung: welche Felder eine Aktion mitbringt, hängt an
               ihrer Art — eine Mail hat Empfänger, Betreff und Text, ein Zähler nur
               eine Spalte. Der Satz ist offen, nicht `{ art: d }` und Schluss. */
            const dann = { art: d };
            if (['setze-prop', 'ki-fuellen', 'zaehler', 'wiederholen'].includes(d))
                dann.key = o.querySelector('#adk2')?.value;
            const wertFeld = o.querySelector('#adv')?.value;
            if (d === 'setze-prop')
                dann.wert = wertFeld === 'heute' ? new Date().toISOString().slice(0, 10) : wertFeld;
            if (d === 'erinnerung')
                dann.tage = wertFeld;
            if (d === 'unterseite' || d === 'melden' || d === 'webhook' || d === 'wiederholen' ||
                d === 'kommentar' || d === 'zurueckstellen')
                dann.text = wertFeld;
            if (d === 'zurueckstellen')
                dann.wert = wertFeld;
            /* Die Bedingung dieser einen Aktion */
            if (o.querySelector('#adwenn')?.checked) {
                dann.wenn = { key: o.querySelector('#adwk')?.value,
                    op: o.querySelector('#adwo')?.value,
                    wert: o.querySelector('#adwv')?.value,
                    umkehren: o.querySelector('#adwn')?.checked };
            }
            /* --- Die vier neuen Aktionen ---------------------------------- */
            if (d === 'variablen') {
                dann.vars = (o.querySelector('#avt')?.value || '').split('\n')
                    .map((z) => z.trim()).filter(Boolean)
                    .map((z) => {
                    const i = z.indexOf('=');
                    return i < 0 ? null : { name: z.slice(0, i).trim(), formel: z.slice(i + 1).trim() };
                })
                    .filter((x) => x && x.name);
            }
            if (d === 'neue-zeile') {
                dann.zielDb = o.querySelector('#and')?.value;
                dann.titel = o.querySelector('#ant')?.value || '{titel}';
                const fk = o.querySelector('#ank')?.value;
                dann.felder = fk ? [{ key: fk, wert: o.querySelector('#anv')?.value }] : [];
            }
            if (d === 'benachricht')
                dann.text = o.querySelector('#abt')?.value;
            if (d === 'mail') {
                dann.an = o.querySelector('#ama')?.value;
                dann.betreff = o.querySelector('#amb')?.value;
                dann.text = o.querySelector('#amt')?.value;
            }
            if (d === 'fremd-setzen') {
                const zc = Store.getCollection(o.querySelector('#afd')?.value);
                dann.ziel = o.querySelector('#afd')?.value;
                dann.zielKey = o.querySelector('#afk')?.value;
                dann.wert = o.querySelector('#afv')?.value;
                dann.filterKey = o.querySelector('#aff')?.value || null;
                dann.filterWert = o.querySelector('#affv')?.value;
                if (dann.filterKey && zc) {
                    const typ = zc.schema[dann.filterKey].type;
                    dann.filterOp = (OPERATOREN[typ] || OPERATOREN['text'] || [])[0];
                }
                dann.nurVerknuepft = o.querySelector('#afr')?.checked;
            }
            /* Das Häkchen entscheidet den Zweig (E85) */
            const sonstKasten = o.querySelector('#adsonst');
            if (sonstKasten?.checked)
                gesammeltSonst.push(dann);
            else
                gesammelt.push(dann);
            if (elVon(e)?.closest('[data-a="mehr"]')) {
                const beide = gesammelt.length + gesammeltSonst.length;
                UI.toast(beide + ' Aktion(en) gesammelt' +
                    (gesammeltSonst.length ? ' — davon ' + gesammeltSonst.length + ' im sonst-Zweig' : '') +
                    ' — noch eine einstellen');
                const adv = o.querySelector('#adv');
                if (adv)
                    adv.value = '';
                if (sonstKasten)
                    sonstKasten.checked = false;
                return;
            }
            coll.automationen = coll.automationen || [];
            coll.automationen.push({
                id: Store.uid().slice(0, 6),
                name: o.querySelector('#an')?.value,
                an: true,
                wenn: o.querySelector('#aw')?.value === 'wiederkehrend'
                    ? { art: 'wiederkehrend',
                        takt: o.querySelector('#azt')?.value,
                        uhr: o.querySelector('#azu')?.value || '09:00',
                        zone: o.querySelector('#azz')?.value || '',
                        ab: o.querySelector('#aza')?.value || '',
                        bis: o.querySelector('#azb')?.value || '' }
                    : { art: o.querySelector('#aw')?.value, key: o.querySelector('#ak')?.value,
                        wert: o.querySelector('#av')?.value,
                        ansicht: (o.querySelector('#aw')?.value === 'ansicht-rein' ||
                            o.querySelector('#aw')?.value === 'ansicht-raus')
                            ? o.querySelector('#aav')?.value : undefined },
                nurAnsicht: o.querySelector('#aw')?.value === 'wiederkehrend'
                    ? (o.querySelector('#azv')?.value || null) : null,
                fuerJede: o.querySelector('#afuer')?.checked ? (() => {
                    const filterKey = o.querySelector('#afuerk')?.value || '';
                    const typ = filterKey ? coll.schema[filterKey]?.type : '';
                    return {
                        an: true,
                        filter: filterKey ? {
                            key: filterKey,
                            op: (OPERATOREN[typ] || OPERATOREN['text'] || [])[0],
                            wert: o.querySelector('#afuerw')?.value || ''
                        } : null,
                        sort: {
                            key: o.querySelector('#afuers')?.value || '',
                            richtung: o.querySelector('#afuerr')?.value || 'auf'
                        },
                        max: Math.max(1, Math.min(500, Number(o.querySelector('#afuerm')?.value) || 100))
                    };
                })() : undefined,
                bedingungen: bedingungen,
                dann: gesammelt,
                sonst: gesammeltSonst
            });
            Store.updateCollection(coll.id, { automationen: coll.automationen });
            o.remove();
            const alleZahl = gesammelt.length + gesammeltSonst.length;
            UI.toast('Automation mit ' + alleZahl +
                (alleZahl === 1 ? ' Aktion' : ' Aktionen') +
                (gesammeltSonst.length
                    ? ' angelegt — davon ' + gesammeltSonst.length + ' im sonst-Zweig'
                    : ' angelegt'));
        });
    };
    /* ========================================================================
     * CSV EINLESEN
     * ------------------------------------------------------------------------
     * Notions Import für Tabellen: die Kopfzeile wird zum Schema, jede
     * weitere Zeile zu einem Eintrag. Fehlende Spalten werden angelegt.
     * ======================================================================*/
    const csvZerlegen = (text) => {
        const zeilen = [];
        let feld = '', zeile = [], inAnf = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inAnf) {
                if (c === '"' && text[i + 1] === '"') {
                    feld += '"';
                    i++;
                }
                else if (c === '"')
                    inAnf = false;
                else
                    feld += c;
            }
            else if (c === '"')
                inAnf = true;
            else if (c === ',' || c === ';' || c === '\t') {
                zeile.push(feld);
                feld = '';
            }
            else if (c === '\n') {
                zeile.push(feld);
                zeilen.push(zeile);
                zeile = [];
                feld = '';
            }
            else if (c !== '\r')
                feld += c;
        }
        if (feld || zeile.length) {
            zeile.push(feld);
            zeilen.push(zeile);
        }
        return zeilen.filter(z => z.some(x => String(x).trim()));
    };
    /* ------------------------------------------------------------------------
     * CSV EINLESEN — jetzt mit Vorschau, und mit dem richtigen Trennzeichen
     * ------------------------------------------------------------------------
     * ZWEI DINGE STANDEN HIER FALSCH, und beide kosten Daten.
     *
     * **1 · Das Trennzeichen.** `csvZerlegen` trennt bei Komma UND Semikolon
     * UND Tabulator, gleichzeitig. Eine deutsche oder Schweizer Datei benutzt
     * das Semikolon zum Trennen und das Komma als Dezimalzeichen:
     *
     *     Miete;1450,50;Januar
     *
     * Daraus wurden fünf Felder statt drei, und aus `1450,50` wurden `1450`
     * und `50`. Der Betrag war weg, und es sah nicht nach einem Fehler aus —
     * es sah nach zwei Spalten mehr aus. `Csv.zerlege` erkennt das Zeichen,
     * und zwar ausserhalb von Anführungszeichen gezählt, damit ein Komma in
     * „Meier, Hans" nicht mitredet.
     *
     * **2 · Es wurde nichts gefragt.** Einlesen legt Zeilen an und ergänzt
     * Spalten am Schema — das ist eine Massenänderung, und sie geschah
     * wortlos. Jetzt steht davor, was passieren wird: wie viele Zeilen, welche
     * Spalten zugeordnet werden und wie viele NEU angelegt werden. Die letzte
     * Zahl ist die wichtigere: eine falsch benannte Spalte in der Datei legt
     * sonst still eine zweite Spalte gleichen Inhalts an.
     * ----------------------------------------------------------------------*/
    const csvImport = (coll) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.csv,.tsv,.txt';
        inp.addEventListener('change', async () => {
            const f = inp.files?.[0];
            if (!f)
                return;
            const roh = await f.text();
            /* Der bessere Zerleger, wenn er da ist — sonst der alte. Ein Import,
               der ohne `core/spreadsheet/csv.js` gar nicht mehr ginge, wäre die
               schlechtere Abhängigkeit. */
            const zeilen = (typeof Csv !== 'undefined')
                ? Csv.zerlege(roh).filter(z => z.some(x => String(x).trim()))
                : csvZerlegen(roh.replace(/^﻿/, ''));
            if (zeilen.length < 2) {
                UI.toast('Die Datei enthält keine Daten');
                return;
            }
            const kopf = (zeilen[0] ?? []).map((x) => String(x).trim());
            const titelKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'title') || 'title';
            const plan = kopf.map((name, i) => {
                if (i === 0)
                    return { name, key: titelKey, neu: false, titel: true, typ: 'title' };
                const k = Object.keys(coll.schema).find(x => String(coll.schema[x].name).toLowerCase() === String(name).toLowerCase());
                if (k)
                    return { name, key: k, neu: false, typ: coll.schema[k].type };
                /* WELCHE SORTE die neue Spalte wird, statt „alles ist Text". Eine
                   Textspalte rechnet nicht: die Summe ergibt 0, Sortieren sortiert
                   alphabetisch (`100` vor `20`), und „grösser als" hat nichts zu
                   vergleichen. Der Mensch merkt das an der falschen Summe und nicht
                   am Import. Geraten wird vorsichtig — ein einziger Text in der
                   Spalte, und sie bleibt Text. */
                const spaltenWerte = zeilen.slice(1).map(z => z[i]);
                const erkannt = (typeof Spaltentyp !== 'undefined')
                    ? Spaltentyp.erkenne(spaltenWerte) : { typ: 'text', optionen: [] };
                return { name, key: '', neu: true, typ: erkannt.typ, optionen: erkannt.optionen };
            });
            const neueSpalten = plan.filter(x => x.neu);
            const getroffen = plan.filter(x => !x.neu && !x.titel);
            const vorschau = zeilen.slice(1, 4)
                .map(z => z.slice(0, 4).map(v => String(v).slice(0, 14)).join(' · ')).join('\n');
            const antwort = (typeof Dialog !== 'undefined')
                ? await Dialog.wahl({
                    titel: 'Einlesen: ' + f.name,
                    text: (zeilen.length - 1) + ' Zeilen × ' + kopf.length + ' Spalten\n' +
                        'Trennzeichen: ' +
                        (typeof Csv !== 'undefined'
                            ? (Csv.erkenneTrenner(roh) === '\t' ? 'Tabulator' : Csv.erkenneTrenner(roh))
                            : 'gemischt') + '\n\n' +
                        '„' + kopf[0] + '" wird der Titel\n' +
                        getroffen.length + ' Spalten passen zu vorhandenen' +
                        (neueSpalten.length
                            ? '\n' + neueSpalten.length + ' Spalten werden NEU angelegt:\n' +
                                neueSpalten.map(x => '   ' + x.name + ' — ' +
                                    (typeof Spaltentyp !== 'undefined' ? Spaltentyp.name(x.typ) : 'Text')).join('\n')
                            : '\nEs wird keine neue Spalte angelegt') +
                        '\n\n' + vorschau + (zeilen.length > 4 ? '\n…' : ''),
                    knoepfe: [
                        { id: 'ja', text: 'Einlesen',
                            hinweis: (zeilen.length - 1) + ' Zeilen kommen dazu — vorhandene bleiben' },
                        { id: '', text: 'Abbrechen', hinweis: 'Es wird nichts verändert' }
                    ]
                })
                : 'ja';
            if (antwort !== 'ja')
                return;
            /* Jetzt erst die neuen Spalten anlegen. */
            plan.forEach((x, i) => {
                if (!x.neu)
                    return;
                x.key = Ids.short(5);
                const def = { name: x.name || 'Spalte ' + (i + 1), type: x.typ || 'text' };
                /* Eine Auswahlspalte braucht ihre Möglichkeiten, sonst ist sie eine
                   Auswahl ohne Auswahl. Die Farben nimmt sie der Reihe nach — das
                   ist besser als alles grau und billiger als eine Frage mehr. */
                if (def.type === 'select') {
                    const farben = ['blue', 'green', 'orange', 'purple', 'pink', 'yellow', 'brown', 'red', 'gray'];
                    def.options = (x.optionen || []).map((o, j) => ({ name: o, color: farben[j % farben.length] }));
                }
                coll.schema[x.key] = def;
            });
            Store.updateCollection(coll.id, { schema: coll.schema });
            let n = 0;
            zeilen.slice(1).forEach(z => {
                const props = {};
                plan.forEach((x, i) => {
                    if (x.key === titelKey)
                        return;
                    /* Der Wert wird in die erkannte Sorte gebracht — sonst stünde in
                       einer Zahlenspalte der Text `1450,50`, und die Summe wäre
                       wieder 0. Genau das war der Anlass. */
                    props[x.key] = (typeof Spaltentyp !== 'undefined')
                        ? Spaltentyp.wandle(z[i] ?? '', x.typ || 'text')
                        : (z[i] ?? '');
                });
                const r = Store.addRow(coll.id, props);
                Store.updateBlock(r.id, { text: z[0] || 'Ohne Titel' });
                n++;
            });
            App.zeichneSeite();
            UI.toast(n + ' Einträge eingelesen' +
                (neueSpalten.length ? ', ' + neueSpalten.length + ' Spalten angelegt' : ''));
        });
        inp.click();
    };
    /* Automationen an den Speicher hängen — einmal beim Laden. */
    automationenEinklinken();
    /**
     * Die offene Datenbank samt Ansicht und Block — für die Kontextkante (L95).
     *
     * `sammlungAufSeite` gab nur eine Kennung zurück. Damit lässt sich keines
     * der Menüs aufrufen: sie wollen alle drei Stücke, und die Ansicht ist die,
     * die der Block gerade zeigt — nicht einfach die erste.
     */
    const offeneSammlung = (seiteId) => {
        let id = String(seiteId || '');
        if (!id) {
            try {
                id = String(App.aktuelleSeite() || '');
            }
            catch {
                id = '';
            }
        }
        const s = id ? Store.getBlock(id) : null;
        if (!s)
            return null;
        const block = s.collectionId ? s
            : (s.content || []).map((k) => Store.getBlock(k))
                .find((b) => b && b.collectionId && b.alive !== false);
        if (!block)
            return null;
        const coll = Store.cache.collections[block.collectionId];
        if (!coll)
            return null;
        const ids = coll.viewIds || [];
        /* `aktiveView` kann auf eine gelöschte Ansicht zeigen — dann gilt die
           erste, statt dass alles danach `undefined` liest. */
        const viewId = block.aktiveView && ids.includes(block.aktiveView)
            ? block.aktiveView : ids[0];
        const view = viewId ? Store.cache.views[viewId] : null;
        if (!view)
            return null;
        return { coll, view, block };
    };
    /** Welche Sammlung liegt auf dieser Seite? Für Befehle, die eine brauchen. */
    const sammlungAufSeite = (seiteId) => {
        const s = Store.getBlock(seiteId);
        if (!s)
            return null;
        if (s.collectionId)
            return s.collectionId;
        const kind = (s.content || [])
            .map((id) => Store.getBlock(id))
            .find((b) => b && b.collectionId && b.alive !== false);
        return kind ? kind.collectionId : null;
    };
    return { render, sammlungAufSeite, offeneSammlung, spaltenMenue, TYPEN, propTyp, wert, wertFrisch, zeilen, zelle, OPERATOREN, ROLLUP_ARTEN,
        /* Die vier Menüs standen nicht im Rückgabeobjekt — von aussen
           waren sie `undefined`, und genau daran scheiterte die
           Kontextkante der Datenbank (L95, dritter Punkt). */
        filterMenue, sortMenue, eigenschaftenMenue, /* `gruppierenMenue` steht schon weiter unten */
        /* `zelleBearbeiten` war nicht ausgeführt — der Mail-Bereich wollte
           es und griff deshalb ins Leere. */
        zelleBearbeiten,
        relationsart, relationsartSatz,
        automationenMenue, automationenLaufen, automationAbbrechen,
        automationsLaeufe: () => [...aktiveAutomationsLaeufe.values()].map(x => ({ ...x })),
        fuerJedeZeilen, gewaehlteZeilen,
        relationSetzen, relationEinrichten, gruppeTrifftZu, regelAnzahl, zeitAutomationen,
        ortSuchen, alsKarte, fremdSetzen, vorlagenLaufen, naechstesDatum, platzhalter,
        rechne, zusammenfassen, dauerText, dauerLesen, RECHNUNGEN, KI_TYPEN, AUSLOESER, AKTIONEN, TAKTE,
        wiederkehrendeAutomationen, taktMarke, inZone, ZONEN, eigeneZone,
        typGruppen, BEDINGUNGEN, bedingungTrifft, bedingungText, bedingungenTreffen, WOCHENTAGE,
        pruefeWert, pruefeZeile, hatRegeln, regelnDialog, MUSTER_VORLAGEN,
        alsPivot, pivotRechne, PIVOT_ARTEN, eigenschaftAnlegen, formelEinruecken, teilausdruecke,
        ansichtKopie, ansichtVorlagen, gruppenListe, gruppeVon, ZEIT_STUFEN, ZS_STUFEN, kartenBild,
        typName, drilldown,
        typMenue, TYP_GRUPPEN, alsDashboard, zeilenGesamt, begrenzen, layoutPanel, farbregelPanel, farbeFuerZeile,
        farbregeln, gruppierenMenue, kiAutofillMenue, LAYOUTS, leiste,
        kiFeldFuellenFuer: kiFeldFuellen,
        formelEditor, csvExport, csvImport, csvZerlegen,
        zeilePeek, zeilenMenue, rollupWert, neueEigenschaftBei,
        unterElementeAn, abhaengigkeitenAn, blockiertDurch, UNTER_KEYS, ABH_KEYS,
        weitereEinstellungen, quellenVerwalten, seitenLayoutPanel, dbMenue };
})();
/* ============================================================================
 * DIE KONTEXTKANTE DER DATENBANK (L95, E312)
 * ----------------------------------------------------------------------------
 * Drei Dinge fehlten, und alle drei stehen jetzt:
 *
 *   1 · Ein Schauplatz. `bereichJetzt()` kennt seit E312 „datenbank" —
 *       aber nur, wenn die Seite AUSSER der Datenbank nichts zeigt. Eine
 *       Seite mit Text davor und danach bleibt der Editor; dort will man
 *       ihn, und die Kante darf ihn nicht wegnehmen.
 *   2 · Ein Griff. `offeneSammlung()` liefert `{coll, view, block}` statt
 *       nur einer Kennung — ohne alle drei lässt sich kein Menü aufrufen.
 *   3 · Ausgeführte Menüs. Die vier standen nicht im Rückgabeobjekt und
 *       waren von aussen `undefined`.
 *
 * Und der Anker: die Kante gibt ihren Knopf an `tun` weiter (context-rail.ts).
 * `sortMenue` und `gruppierenMenue` lesen sofort `getBoundingClientRect()` —
 * ohne Anker hätten sie geworfen, und ein Knopf, der wirft, ist ein Knopf,
 * der nichts tut (§47).
 * ==========================================================================*/
if (typeof Register !== 'undefined' && Register.kontext) {
    const K = Register.kontext;
    /** Die dreizehn Ansichtsarten auf Strichzeichen. Emoji stehen im
        Ansichtenregister; an der Kante sind sie verboten (E202). */
    const ANSICHT_ZEICHEN = {
        table: 'grid', raster: 'grid', board: 'boxChecked', timeline: 'chart',
        calendar: 'calendar', list: 'pages', gallery: 'image', chart: 'chart',
        feed: 'history', map: 'compass', dashboard: 'graph', pivot: 'grid',
        form: 'clipboard'
    };
    /** Die offene Datenbank — oder nichts. Jeder Griff fragt zuerst hier. */
    const jetzt = () => {
        try {
            return Datenbank.offeneSammlung();
        }
        catch {
            return null;
        }
    };
    const da = () => !!jetzt();
    /** Ein Menü öffnen, das drei Stücke und einen Anker braucht. */
    const menue = (fn) => (anker) => {
        const o = jetzt();
        if (!o || !anker)
            return;
        try {
            fn(anker, o.coll, o.view, o.block);
        }
        catch { /* … */ }
    };
    K.melde({ bereich: 'datenbank', id: 'db-ansicht', name: 'Ansicht',
        zeichen: 'grid', rang: 10,
        zeigen: da,
        liefern: () => {
            const o = jetzt();
            if (!o)
                return [{ id: 'keine', name: 'Keine Datenbank offen.', tun: () => { } }];
            const ids = o.coll.viewIds || [];
            if (!ids.length)
                return [{ id: 'keine', name: 'Diese Datenbank hat keine Ansicht.',
                        tun: () => { } }];
            return ids.map((id) => {
                const v = Store.cache.views[id];
                const art = String(v?.type || 'table');
                return {
                    id: 'v-' + id,
                    name: String(v?.name || 'Ohne Namen'),
                    unter: (Register.ansichten?.alle?.() || [])
                        .find((x) => x[0] === art)?.[2] || art,
                    zeichen: ANSICHT_ZEICHEN[art] || 'grid',
                    an: id === o.view.id,
                    tun: () => {
                        Store.updateBlock(o.block.id, { aktiveView: id });
                        try {
                            App.oeffne(App.aktuelleSeite());
                        }
                        catch { /* … */ }
                    }
                };
            });
        }
    });
    K.melde({ bereich: 'datenbank', id: 'db-filter', name: 'Filter',
        zeichen: 'filter', rang: 20, zeigen: da, tun: menue(Datenbank.filterMenue) });
    K.melde({ bereich: 'datenbank', id: 'db-sort', name: 'Sortieren',
        zeichen: 'sort', rang: 30, zeigen: da, tun: menue(Datenbank.sortMenue) });
    K.melde({ bereich: 'datenbank', id: 'db-gruppe', name: 'Gruppieren',
        zeichen: 'pages', rang: 40, zeigen: da, tun: menue(Datenbank.gruppierenMenue) });
    K.melde({ bereich: 'datenbank', id: 'db-spalten', name: 'Spalten',
        zeichen: 'eye', rang: 50, zeigen: da, tun: menue(Datenbank.eigenschaftenMenue) });
}
