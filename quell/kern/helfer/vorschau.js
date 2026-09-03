"use strict";
/* ============================================================================
 * vorschau.js — Eine Seite so zeigen, dass man sie wiedererkennt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/vorschau.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/kern/helfer/vorschau.js`. Wer das .js bearbeitet, verliert die
 * Änderung beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * E205 hat der Lernwelt beigebracht, eine Seite als kleines Abbild ihrer
 * selbst zu zeigen: Überschriften fett, Haken als Kästchen, Listenpunkte mit
 * Punkt. Das war die Antwort auf neun Zeilen, die alle „Zuletzt geöffnet ·
 * gerade eben" sagten und damit nichts.
 *
 * Die Bibliothek stellt dieselbe Frage — welche Seite ist das? — und ihre
 * Antwort war eine Tabelle mit einer Titelspalte. Zwei Bereiche, eine
 * Aufgabe. CLAUDE.md §5, Regel 1 ist an dieser Stelle eindeutig: ein Bereich
 * darf nicht aus einem anderen importieren, und was beide brauchen, gehört
 * nach `kern/`.
 *
 * Der bequeme Weg wäre gewesen, die dreissig Zeilen in `bibliothek.ts` noch
 * einmal hinzuschreiben. Dann gäbe es zwei Anrisse, die sich das erste Mal
 * unterscheiden, sobald jemand eine Markdown-Auszeichnung ergänzt — und
 * gemerkt hätte man es an der Stelle, die man gerade nicht ansieht.
 *
 * WAS HIER STEHT
 *
 *     klartext(roh)              Auszeichnungen weg, Text bleibt
 *     anriss(seiteId, titel)     der Anfang der Seite als EINE Zeile
 *     miniatur(seiteId, zeilen)  der Anfang der Seite als kleines Abbild
 *
 * Alle drei sind gleichläufig. `Store.childrenOf` liest den Spiegel im
 * Arbeitsspeicher; es gibt kein Warten, keinen zweiten Speicherweg und
 * keinen Ladezustand, den ein Aufrufer zeichnen müsste.
 *
 * WAS HIER NICHT STEHT: ein Vorschau-BILD. Redion legt zu keiner Seite eines
 * an, und eine Seite, die vor allem aus einem Schaltplan besteht, hat kaum
 * Text — genau die Seiten, die man am Bild am schnellsten wiedererkennt,
 * zeigen hier am wenigsten. Das steht als L61 in LUECKEN.md und wird nicht
 * dadurch besser, dass man es verschweigt.
 * ==========================================================================*/
const Vorschau = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    /**
     * Auszeichnungen weg, Text bleibt.
     *
     * Der Anriss kommt aus `block.text`, und dort steht Redions Markdown so,
     * wie es getippt wurde. Auf dem Bild vom 26. August stand deshalb „Alles
     * hier liegt **lokal** in dein…" — mit Sternen. Eine Vorschau ist eine
     * Vorschau und keine Quelltextzeile.
     *
     * Die Muster sind dieselben wie in `inline()` im Editor, nur behalten sie
     * den Inhalt statt ihn einzuwickeln. Wer dort eine Auszeichnung ergänzt,
     * muss sie hier ergänzen — sonst steht ihr Zeichen wieder im Anriss.
     *
     * Die Reihenfolge ist nicht beliebig: das Bild VOR dem Link, sonst bleibt
     * ein „!" stehen, und `**` vor `*`, sonst frisst der eine Stern den anderen.
     */
    const klartext = (roh) => String(roh ?? '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/\(\(([^)]+)\)\)/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/~~(.+?)~~/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`([^`]+?)`/g, '$1')
        .replace(/^\s{0,3}[-*+]\s+/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/\s+/g, ' ')
        .trim();
    /**
     * Die lebenden Kindblöcke einer Seite — oder nichts, wenn es sie nicht gibt.
     *
     * `Store` STEHT NICHT AN `window`, und das hat diese Datei einmal still
     * kaputtgemacht. Hier stand `const store = (globalThis as any).Store`, und
     * damit war `store` immer `undefined`: `Store` ist ein `const` auf oberster
     * Ebene im gemeinsamen Skript-Bereich (`module: "none"`), kein Feld am
     * Fenster. `typeof undefined?.childrenOf !== 'function'` ist wahr, also kam
     * ein leeres Feld zurück — kein Wurf, keine Meldung in der Konsole, nur
     * überall die Zeile „Dieses Heft ist noch leer".
     *
     * Gemessen: 16 Kinder mit Text, 0 Zeichen Miniatur. Gefunden hat es das
     * Bild und keine Prüfung (§55) — eine Vorschau, die nichts zeigt, sieht
     * aus wie ein leerer Bestand und nicht wie ein Fehler.
     *
     * `typeof Store` fängt den Fall ab, dass die Datei ohne die Ablage geladen
     * wird (Einzeldatei im Aufbau, Prüfläufe ohne Schale).
     */
    const kinder = (seiteId) => {
        if (!seiteId || typeof Store === 'undefined' ||
            typeof Store.childrenOf !== 'function')
            return [];
        try {
            return Store.childrenOf(seiteId);
        }
        catch {
            return [];
        }
    };
    /**
     * Der Anfang einer Seite als EINE Zeile.
     *
     * `titel` ist bewusst dabei: die erste Zeile einer Seite wiederholt oft
     * ihre Überschrift, und zweimal dasselbe in zwei Zeilen ist genau der
     * Zustand, den ein Anriss beheben soll.
     *
     * ABER NUR, WENN DER REST FÜR SICH STEHT. Der erste Versuch schnitt blind
     * ab und machte aus „Willkommen in Redion. Alles hier liegt lokal …" den
     * Anriss „in Redion Alles hier liegt lokal …" — er begann mitten im Satz
     * mit einem kleinen „in". Der Titel war dort nicht die Überschrift,
     * sondern der Anfang des Satzes. Erkennbar am nächsten Zeichen: geht es
     * gross oder mit einer Ziffer weiter, war es eine Überschrift; geht es
     * klein weiter, war es ein Satz.
     */
    const anriss = (seiteId, titel = '', laenge = 90) => {
        let text = '';
        for (const kind of kinder(seiteId)) {
            const stueck = klartext(String(kind?.text || ''));
            if (!stueck)
                continue;
            if (!text && titel && stueck.toLowerCase().startsWith(titel.toLowerCase())) {
                const rest = stueck.slice(titel.length).replace(/^[\s—–:·.,;-]+/, '');
                if (!rest)
                    continue;
                if (/^[A-ZÄÖÜ0-9„"«]/.test(rest)) {
                    text = rest;
                    continue;
                }
            }
            /* Zwei Blöcke sind zwei Absätze. Mit einem Leerzeichen aneinander-
               gehängt werden sie ein Satz, den so niemand geschrieben hat —
               „Willkommen in Redion Alles hier liegt lokal". Ein Trennpunkt sagt,
               dass hier etwas Neues anfängt; nach einem Satzzeichen braucht es
               ihn nicht. */
            text += (text ? (/[.!?:…]$/.test(text) ? ' ' : ' · ') : '') + stueck;
            if (text.length >= laenge)
                break;
        }
        return text.length > laenge ? text.slice(0, laenge - 1).trimEnd() + '…' : text;
    };
    /** Ein Zeichen aus dem Register, oder nichts.
        `Register` hängt sich mit `(window as any).Register = … || {}` wirklich
        ans Fenster an — anders als `Store`, siehe oben. */
    const zeichen = (id) => {
        const reg = globalThis.Register;
        return reg?.symbole?.alsSvg ? reg.symbole.alsSvg(id, 12) : '';
    };
    /**
     * Eine Seite als kleines Abbild ihrer selbst.
     *
     * Nicht ein Anriss in einer Zeile, sondern die ersten Blöcke so, wie sie
     * auf der Seite stehen. Das ist der Unterschied zwischen „ich erkenne die
     * Seite wieder" und „ich lese fünf Titel und muss raten".
     *
     * ALLES HIER IST SATZINHALT und darf es auch sein: die Karte, in der das
     * landet, ist gelegentlich ein `<button>`, und ein Knopf darf keine
     * Absätze enthalten. Ein `<hr>` wäre schon zu viel — deshalb ist die
     * Trennlinie ein `<span>` mit Rand.
     */
    /**
     * Ein Block OHNE TEXT — und trotzdem etwas zu sehen (L61).
     *
     * Eine Seite aus einem Schaltplan, drei PDF-Seiten und einem A4-Blatt
     * hatte bis hierher eine vollkommen leere Miniatur. Gemessen: sechs
     * Blöcke, `umfang` 6, Miniatur 0 Zeichen. Die Karte fiel also nicht
     * heraus — sie stand nur weiss da. Genau die Seiten, die man am Bild am
     * schnellsten wiedererkennt, zeigten am wenigsten.
     *
     * Der Name kommt aus `Register.bloecke` — kein zweiter Katalog (§8).
     * Was dort NICHT steht, bekommt einen neutralen Streifen: `pdfseite` und
     * `zeichenflaeche` sind keine einfügbaren Arten und haben deshalb
     * nirgends einen deutschen Namen. Einen hier zu erfinden hiesse, ihn an
     * einer zweiten Stelle zu pflegen; ein Streifen sagt immerhin „hier steht
     * etwas" statt gar nichts. Der Rest steht in LUECKEN.md.
     *
     * DAS IST KEIN VORSCHAUBILD. Ein echtes Abbild des Schaltplans wäre eine
     * Speicheränderung mit eigenem Plan (§9, §30); L61 bleibt dafür offen.
     */
    const OHNE_TEXT = (art) => {
        const reg = globalThis.Register;
        let name = '', icon = '';
        try {
            const t = reg?.bloecke?.eines ? reg.bloecke.eines(art) : null;
            if (t) {
                name = String(t.name || '');
                icon = String(t.icon || '');
            }
        }
        catch { /* ohne Register bleibt der Streifen */ }
        if (!name)
            return '<span class="mini-obj mini-obj-leer"></span>';
        return '<span class="mini-obj">' + esc(icon) + ' ' + esc(name) + '</span>';
    };
    /* Welche Arten hier gemeint sind: die, die ihren Inhalt NICHT im `text`
       tragen. Ein leerer Absatz bleibt leer und soll es auch — sonst stünde
       in jeder Miniatur ein Streifen für jede Leerzeile. */
    const TRAEGT_KEINEN_TEXT = new Set([
        'blatt', 'schaltplan', 'pdfseite', 'zeichenflaeche', 'whiteboard',
        'image', 'video', 'audio', 'file', 'pdf', 'table', 'spreadsheet',
        'database', 'chart', 'dashboard', 'embed', 'simulation'
    ]);
    const miniatur = (seiteId, zeilen = 5) => {
        const raus = [];
        for (const block of kinder(seiteId)) {
            if (raus.length >= zeilen)
                break;
            const art = String(block?.type || 'text');
            if (art === 'divider') {
                raus.push('<span class="mini-hr"></span>');
                continue;
            }
            const text = klartext(String(block?.text || ''));
            if (!text && TRAEGT_KEINEN_TEXT.has(art)) {
                raus.push(OHNE_TEXT(art));
                continue;
            }
            if (!text)
                continue;
            const kurz = esc(text.length > 120 ? text.slice(0, 119) + '…' : text);
            if (art === 'h1' || art === 'h2' || art === 'h3' || art.startsWith('toggle-h')) {
                raus.push('<b>' + kurz + '</b>');
                continue;
            }
            if (art === 'todo') {
                raus.push('<span class="mini-todo">' +
                    zeichen(block?.checked ? 'boxChecked' : 'box') + kurz + '</span>');
                continue;
            }
            if (art === 'bullet' || art === 'number' || art === 'toggle') {
                raus.push('<span class="mini-li">' + kurz + '</span>');
                continue;
            }
            if (art === 'code' || art === 'equation') {
                raus.push('<code>' + kurz + '</code>');
                continue;
            }
            if (art === 'quote' || art === 'callout') {
                raus.push('<span class="mini-q">' + kurz + '</span>');
                continue;
            }
            raus.push('<span>' + kurz + '</span>');
        }
        return raus.join('');
    };
    /** Wie viele lebende Blöcke hängen an dieser Seite? Eine Ebene, gezählt. */
    const umfang = (seiteId) => kinder(seiteId).length;
    /* ==========================================================================
     * DAS BILD EINER SEITE (L61, E313)
     * --------------------------------------------------------------------------
     * `miniatur` liest TEXT. Genau die Seiten, die man am Bild am schnellsten
     * wiedererkennt — ein eingelesenes PDF, ein Foto, ein beschriebenes
     * Blatt —, haben kaum welchen; ihr Deckel stand deshalb weiss da, mit dem
     * Wort „PDF" darauf.
     *
     * ─── WARUM HIER NICHTS GERENDERT UND NICHTS GESPEICHERT WIRD ─────────────
     *
     * L61 schlug vor, beim Speichern ein kleines Bild MITZUSCHREIBEN. Das
     * wäre eine Speicheränderung mit eigenem Plan (§9), und sie hätte einen
     * zweiten Bestand erzeugt, der veralten kann: ein Vorschaubild von
     * gestern zeigt die Seite von gestern.
     *
     * Der kürzere Weg: die allermeisten dieser Seiten HABEN das Bild schon.
     * Eine eingelesene PDF-Seite trägt `bildDateiId`, ein Bildblock `dateiId`
     * — beides sind echte Dateien in der Ablage. Die Vorschau zeigt also den
     * INHALT und nicht eine Kopie davon: sie kann nicht veralten, sie kostet
     * kein Byte, und sie reist mit der Sicherung mit, weil die Datei es tut.
     *
     * Was damit NICHT geht, steht in LUECKEN.md: ein leeres Blatt, auf das
     * nur von Hand gezeichnet wurde, hat keine Datei. Dafür bräuchte es das
     * Rendern — und dann auch den eigenen Plan.
     */
    /** Blockarten, die ihr Bild als Datei tragen, und unter welchem Feld. */
    const BILDFELD = {
        pdfseite: 'bildDateiId',
        image: 'dateiId',
        bild: 'dateiId'
    };
    /**
     * Die Kennung der Datei, die eine Seite am besten zeigt — oder nichts.
     *
     * Genommen wird die ERSTE gefundene in Lesereihenfolge: bei einem
     * eingelesenen PDF ist das Seite 1, und das ist die Seite, die ein Mensch
     * als Deckel erwartet.
     */
    const bildDatei = (seiteId, tiefe = 3) => {
        const gesehen = new Set();
        const suche = (id, rest) => {
            if (!id || rest < 0 || gesehen.has(id))
                return null;
            gesehen.add(id);
            const b = Store.getBlock(id);
            if (!b)
                return null;
            const feld = BILDFELD[String(b.type || '')];
            if (feld && b[feld])
                return String(b[feld]);
            for (const k of b.content || []) {
                const kind = Store.getBlock(k);
                if (!kind || kind.alive === false)
                    continue;
                const treffer = suche(k, rest - 1);
                if (treffer)
                    return treffer;
            }
            return null;
        };
        return suche(seiteId, tiefe);
    };
    /* ========================================================================
     * DER DECKEL EINES HANDBESCHRIEBENEN BLATTES (E374, L61 Rest)
     * ------------------------------------------------------------------------
     * `bildDatei` findet nichts, wenn auf einem A4-Blatt NUR von Hand
     * geschrieben wurde: eine handgeschriebene Seite hat keine Datei. In einem
     * Regal voller solcher Hefte sind das alle Deckel, und ein Regal aus
     * weissen Rechtecken ist eine Liste ohne Namen.
     *
     * Gerechnet wird im Kern (`core/ink/thumbnail.ts`); hier steht nur, wie
     * daraus ein SVG wird — und dass jeder Wert aus den Nutzerdaten durch
     * `esc` geht, bevor er in einem Attribut landet (§19).
     * ======================================================================*/
    /** Die Blattmasse, so wie `bereiche/pdf/marken.ts` sie schreibt. */
    const TINTE_BLOCK = new Set(['blatt', 'pdfseite', 'zeichenflaeche']);
    /** Der erste Block mit Handschrift in Lesereihenfolge, oder nichts. */
    const tinteBlock = (seiteId, tiefe = 3) => {
        const gesehen = new Set();
        const suche = (id, rest) => {
            if (!id || rest < 0 || gesehen.has(id))
                return null;
            gesehen.add(id);
            const b = Store.getBlock(id);
            if (!b)
                return null;
            if (TINTE_BLOCK.has(String(b.type || '')) &&
                Array.isArray(b.marken) && b.marken.length)
                return b;
            for (const k of b.content || []) {
                const kind = Store.getBlock(k);
                if (!kind || kind.alive === false)
                    continue;
                const treffer = suche(k, rest - 1);
                if (treffer)
                    return treffer;
            }
            return null;
        };
        return suche(seiteId, tiefe);
    };
    /**
     * Ein SVG mit der Handschrift einer Seite — oder eine leere Zeichenkette.
     *
     * LEER IST EIN ERGEBNIS, kein Fehler: eine Seite ohne Handschrift bekommt
     * nichts, und der Deckel bleibt, was er war.
     */
    const tinteSvg = (seiteId, breite = 160, hoehe = 226) => {
        if (typeof InkThumbnail === 'undefined')
            return '';
        const b = tinteBlock(seiteId);
        if (!b)
            return '';
        const quelle = { breite: Number(b.blattBreite) || 794,
            hoehe: Number(b.blattHoehe) || 1123 };
        const d = InkThumbnail.deckel(b.marken, quelle, { breite, hoehe });
        if (!InkThumbnail.hatInhalt(d))
            return '';
        /* `esc` auf jeden Wert, obwohl der Kern schon prüft. Zwei Schlösser an
           einer Tür, die auf fremde Daten zeigt, sind eines zu wenig. */
        const pfade = d.zuege.map((z) => '<path d="' + esc(z.d) + '" stroke="' + esc(z.farbe) +
            '" stroke-width="' + esc(String(Math.round(z.breite * 10) / 10)) +
            '" opacity="' + esc(String(z.deckkraft)) +
            '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>').join('');
        return '<svg class="vs-tinte" viewBox="0 0 ' + breite + ' ' + hoehe + '" ' +
            'width="100%" height="100%" aria-hidden="true" focusable="false">' +
            pfade + '</svg>';
    };
    /**
     * Die Adressen aller `[data-vorschau]` in einem Baumstück nachtragen.
     *
     * Die Karten entstehen als Zeichenkette; eine Adresse aus der Ablage
     * kommt aber erst später. Deshalb steht im `img` zuerst nur die Kennung,
     * und dieser Griff füllt `src` nach — wer kein Bild bekommt, verliert
     * seines wieder, statt als kaputtes Bildzeichen stehen zu bleiben.
     */
    const bilderNachtragen = (wurzel) => {
        if (!wurzel || typeof Dateien === 'undefined')
            return;
        wurzel.querySelectorAll('img[data-vorschau]').forEach(el => {
            const id = el.dataset['vorschau'] || '';
            if (!id)
                return;
            const da = Dateien.adresseBekannt ? Dateien.adresseBekannt(id) : null;
            if (da) {
                el.src = da;
                return;
            }
            Dateien.adresse(id).then((u) => {
                if (!el.isConnected)
                    return;
                if (u)
                    el.src = u;
                else
                    el.remove();
            }, () => { el.remove(); });
        });
    };
    return { klartext, anriss, miniatur, umfang, bildDatei, bilderNachtragen,
        tinteSvg, tinteBlock };
})();
window.Vorschau = Vorschau;
