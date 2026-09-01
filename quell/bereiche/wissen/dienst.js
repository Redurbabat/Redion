"use strict";
/* ============================================================================
 * bereiche/wissen/dienst.js — was die Werkzeuge rechnen, ohne etwas zu zeigen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die unscharfe Suche der Befehlspalette, das Wiederholungsverfahren der
 * Karteikarten, Markdown hin und zurück, die Schreibstatistik und die
 * kleinen Datums- und Namenshelfer. Vorher standen sie verstreut zwischen
 * 1970 Zeilen Oberfläche in `werkzeuge.js`.
 *
 * WIE DIESE DATEI ZUSTANDE KAM, ist der interessantere Teil. `AUFGABEN.md`
 * nimmt für A4 an, `werkzeuge.js` liesse sich wie `steuerung.js` in eine
 * rechnende und eine zeichnende Hälfte teilen. Nachgemessen stimmt das
 * nicht: über alle vierzehn Abschnitte gezählt fasst **jeder** von ihnen
 * das Dokument an, zwischen 7 und 47 Mal. Es gibt hier keine rechnende
 * Hälfte, die man abschneiden könnte.
 *
 * Also wurde nicht geschnitten, sondern gesucht — nach den Stellen, die
 * wirklich nur rechnen. Es sind neun, und sie haben eine Gemeinsamkeit:
 * sie sind genau die Stellen, bei denen man sich fragt, ob sie richtig
 * rechnen. Ob „umb" wirklich „Umbenennen" findet. Ob eine Karte, die man
 * dreimal gewusst hat, in sechs Tagen wiederkommt oder in sechzehn. Ob eine
 * Markdown-Tabelle am Dateiende noch ankommt. Das lässt sich hier in
 * Millisekunden prüfen statt in einem Browser gar nicht.
 *
 * KEIN `document`, KEIN `window`, KEIN `App`, KEIN `UI`. Damit lädt die
 * Datei in Node. Was sie braucht, ist `Store` — ein Modul ohne Oberfläche,
 * das ein Prüflauf hinstellen kann.
 *
 * WAS DABEI AUFFIEL und mit umgezogen ist: `statistik` rechnete und zeichnete
 * in einem Zug. Die Rechnung steht jetzt als `statistikZahlen` hier, das
 * Fenster bleibt drüben. Das ist die einzige Stelle, an der nicht bloss
 * verschoben, sondern getrennt wurde — die Zahlen sind dieselben, nur
 * kommen sie jetzt aus einer Funktion, die man befragen kann.
 * ==========================================================================*/
const WissenDienst = (() => {
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const heute = () => new Date().toISOString().slice(0, 10);
    const WOCHENTAG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const MONAT = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const datumLang = (iso) => {
        const d = new Date(iso + 'T12:00:00');
        return `${WOCHENTAG[d.getDay()]}, ${d.getDate()}. ${MONAT[d.getMonth()]} ${d.getFullYear()}`;
    };
    /* --------------------------------------------------------------------------
     * DIE UNSCHARFE SUCHE der Befehlspalette
     * --------------------------------------------------------------------------
     * Notions Palette sucht wörtlich: „umb" findet „Umbenennen" nicht. Hier
     * zählen die Buchstaben in der richtigen Reihenfolge.
     * ----------------------------------------------------------------------- */
    /* Gibt PUNKTE zurück, nicht ja/nein: höher ist besser, `-1` heisst „passt
       gar nicht". Der Name sagt das nicht — er blieb, weil er an sechzig
       Stellen steht; der Rückgabetyp sagt es jetzt. */
    const unscharf = (text, suche) => {
        const t = String(text ?? '').toLowerCase(), q = String(suche ?? '').toLowerCase();
        if (!q)
            return 0;
        if (t === q)
            return 1000;
        if (t.startsWith(q))
            return 800 - t.length;
        const wort = t.indexOf(' ' + q);
        if (wort >= 0)
            return 600 - t.length;
        if (t.includes(q))
            return 400 - t.length;
        /* Buchstabe für Buchstabe: alle in der richtigen Reihenfolge? */
        let i = 0, punkte = 0, letzte = -2;
        for (const c of q) {
            const stelle = t.indexOf(c, i);
            if (stelle < 0)
                return -1;
            punkte += (stelle === letzte + 1) ? 8 : 2; /* zusammenhängend zählt mehr */
            letzte = stelle;
            i = stelle + 1;
        }
        return punkte;
    };
    const zeitKurz = (iso) => {
        if (!iso)
            return '';
        const d = new Date(iso), j = new Date();
        const gleich = d.toDateString() === j.toDateString();
        const uhr = d.toTimeString().slice(0, 5);
        if (gleich)
            return 'Heute ' + uhr;
        const gestern = new Date(j);
        gestern.setDate(j.getDate() - 1);
        if (d.toDateString() === gestern.toDateString())
            return 'Gestern ' + uhr;
        return d.toLocaleDateString('de-DE') + ' ' + uhr;
    };
    /* --------------------------------------------------------------------------
     * DAS WIEDERHOLUNGSVERFAHREN der Karteikarten (SM-2, wie Anki)
     * ----------------------------------------------------------------------- */
    /** Welches Verfahren gilt gerade? SM-2, solange niemand etwas anderes sagt. */
    const verfahren = () => (typeof Fsrs !== 'undefined' && Store.getMeta('lernVerfahren', 'sm2') === 'fsrs')
        ? 'fsrs' : 'sm2';
    /**
     * SM-2 in kurz: leichter beantwortet = längerer Abstand.
     *
     * SEIT E303 GIBT ES EIN ZWEITES VERFAHREN, und drei Dinge daran sind
     * Absicht:
     *
     *   SM-2 BLEIBT DIE VORGABE. Eine Karte wechselt nur, wenn ein Mensch es
     *   sagt. Ein Verfahren, das rückwirkend alle Termine verschiebt, ist genau
     *   die Sorte Änderung, die man erst merkt, wenn die Prüfung vorbei ist.
     *
     *   DER ÜBERGANG WIRD PROTOKOLLIERT. Eine Karte mit SM-2-Vergangenheit hat
     *   keine Stabilität; sie wird aus dem letzten Abstand GESCHÄTZT. Das steht
     *   als `uebergang: true` im Verlauf, damit man später weiss, ab wann die
     *   Zahlen gerechnet und ab wann sie geraten sind.
     *
     *   `ease` UND `wdh` BLEIBEN STEHEN, solange FSRS läuft. Wer zurückschaltet,
     *   landet auf seinem letzten SM-2-Stand statt auf der Vorgabe.
     */
    const planen = (k, note) => {
        const sr = Object.assign({ ease: 2.5, intervall: 0, wdh: 0 }, k.sr || {});
        /* Der Verlauf ist additiv. Die Rechnung darunter bleibt absichtlich
           dieselbe SM-2-Rechnung wie bisher; insbesondere verändert ein Fehler
           die Leichtigkeit nicht. Statistik und Fehlertraining lesen nur dieses
           objektbasierte Protokoll und verschieben keinen Termin von selbst. */
        const vorher = {
            due: String(sr.faellig || ''),
            interval: Number(sr.intervall) || 0,
            ease: Number(sr.ease) || 2.5,
            repetitions: Number(sr.wdh) || 0
        };
        const art = verfahren();
        let uebergang = false;
        if (art === 'fsrs') {
            /* Wie viele Tage sind seit der letzten Antwort vergangen? Ohne letzte
               Antwort ist es die erste — dann kennt der Kern den Fall selbst. */
            const zuletzt = sr.zuletzt ? new Date(String(sr.zuletzt)).getTime() : 0;
            const tage = zuletzt ? Math.max(0, (Date.now() - zuletzt) / 86400000) : 0;
            let stand = (sr.fsrs && typeof sr.fsrs === 'object' &&
                Number(sr.fsrs.stabilitaet) > 0)
                ? { stabilitaet: Number(sr.fsrs.stabilitaet),
                    schwierigkeit: Number(sr.fsrs.schwierigkeit) || 5 }
                : null;
            if (!stand && (Number(sr.intervall) > 0 || Number(sr.wdh) > 0)) {
                stand = Fsrs.ausSm2(Number(sr.intervall) || 1, Number(sr.ease) || 2.5);
                uebergang = true;
            }
            const ziel = Math.min(0.97, Math.max(0.8, Number(Store.getMeta('lernZielrate', 0.9)) || 0.9));
            const erg = Fsrs.antworten(stand, Math.max(1, Math.min(4, Number(note))), tage, ziel);
            sr.fsrs = { stabilitaet: erg.stand.stabilitaet,
                schwierigkeit: erg.stand.schwierigkeit };
            /* Der Abstand wird auf ganze Tage gerundet, weil ein Termin ein Tag
               ist. Unter einem Tag heisst „gleich nochmal" — dieselben zehn
               Minuten wie bei SM-2, damit sich der Rest der App nicht ändert. */
            sr.intervall = erg.abstandTage < 1 ? 0 : Math.round(erg.abstandTage);
        }
        else if (note < 3) {
            sr.wdh = 0;
            sr.intervall = note === 1 ? 0 : 1;
        }
        else {
            sr.wdh++;
            sr.intervall = sr.wdh === 1 ? 1 : sr.wdh === 2 ? 6 : Math.round(sr.intervall * sr.ease);
            sr.ease = Math.max(1.3, sr.ease + (0.1 - (4 - note) * (0.08 + (4 - note) * 0.02)));
        }
        const d = new Date();
        if (sr.intervall === 0)
            d.setMinutes(d.getMinutes() + 10);
        else
            d.setDate(d.getDate() + sr.intervall);
        sr.faellig = d.toISOString();
        sr.zuletzt = Store.now();
        const alt = Array.isArray(k.reviewVerlauf)
            ? Object.fromEntries(k.reviewVerlauf
                .filter((entry) => entry && typeof entry === 'object')
                .map((entry, index) => [String(entry.id || 'legacy-' + index + '-' + (entry.at || '')), entry]))
            : (k.reviewVerlauf && typeof k.reviewVerlauf === 'object' ? { ...k.reviewVerlauf } : {});
        /* `WissenDienst` bleibt als reine Logik auch mit einem kleinen Store-
           Adapter pruefbar. In der App kommt die kanonische Kennung vom Store;
           der Rueckfall braucht nur innerhalb dieses Verlaufs eindeutig zu sein. */
        const reviewId = typeof Store.uid === 'function'
            ? Store.uid()
            : 'review-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
        alt[reviewId] = {
            id: reviewId,
            version: 1,
            at: sr.zuletzt,
            rating: Number(note),
            algorithm: art,
            ...(uebergang ? { uebergang: true } : {}),
            ...(art === 'fsrs' ? { fsrs: { ...sr.fsrs } } : {}),
            lapse: note < 3,
            before: vorher,
            after: {
                due: sr.faellig,
                interval: sr.intervall,
                ease: sr.ease,
                repetitions: sr.wdh
            }
        };
        const behalten = Object.values(alt)
            .sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')) || String(a.id || '').localeCompare(String(b.id || '')))
            .slice(-500);
        const reviewVerlauf = Object.fromEntries(behalten.map(entry => [String(entry.id), entry]));
        /* `lernAlgorithmus` stand hier fest auf `'sm2'` — und wäre seit E303
           eine Lüge am Block gewesen: die Karte lief nach FSRS und behauptete
           SM-2. Gefunden vom Anschluss-Prüflauf, nicht beim Schreiben. */
        Store.updateBlock(k.id, { sr, reviewVerlauf, lernAlgorithmus: art });
        return sr;
    };
    /* --------------------------------------------------------------------------
     * MARKDOWN hin und zurück
     * --------------------------------------------------------------------------
     * „Quelltext ansehen" leert die Seite und baut sie aus dem Text neu auf.
     * Alles, was Markdown nicht tragen kann, muss deshalb als Platzhalter
     * überleben — sonst ist der Knopf ein Löschknopf.
     *
     * BIS E113 STAND DIE LISTE ANDERSHERUM: vier Blockarten (`database`,
     * `whiteboard`, `chart`, `table`) waren namentlich gerettet, alle anderen
     * fielen durch. Das ging so lange gut, wie es nur diese vier gab. Gemessen
     * an einer Schulaufgabe aus Spalten, PDF-Seite, A4-Blatt und Rechenblatt:
     *
     *     vorher   9 Blöcke · 1 PDF-Seite · 1 Blatt · 3 Spalten · 2 Striche
     *     nachher  3 Blöcke · 0           · 0       · 0         · 0
     *     Text danach: „# Mathe\n\n  \n    \n  \n      Meine Antwort"
     *
     * Ein Klick, und die Klausur ist weg. Der Kopfkommentar dieser Funktion
     * hat den Fall sogar vorhergesagt („Ohne das wäre … ein Datenverlust") —
     * und die Liste darunter wurde trotzdem bei jeder neuen Blockart
     * vergessen: bei `spreadsheet` (E29), bei `columns`/`spalte` (E102), bei
     * `blatt` (E100), bei `pdfseite` (E103).
     *
     * DESHALB JETZT UMGEDREHT. `MD_TRAEGT` zählt auf, was Markdown WIRKLICH
     * verlustfrei hin und zurück bringt. Alles andere bekommt einen
     * Platzhalter, ohne dass jemand daran denken muss. Eine neue Blockart ist
     * damit von sich aus sicher — sie muss sich das Durchreichen verdienen,
     * statt es geschenkt zu bekommen.
     * ----------------------------------------------------------------------- */
    /* Was `alsMarkdown` unten wirklich abbildet UND `ausMarkdown` wieder
       einliest. Wer hier etwas einträgt, muss beide Richtungen belegen —
       `test187` fährt sie ab. */
    const MD_TRAEGT = new Set([
        'text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number',
        'quote', 'callout', 'divider', 'code', 'equation', 'image', 'flashcard'
    ]);
    /* Drei Blockarten stehen zwar in der Liste, tragen aber je nach Inhalt
       mehr, als Markdown abbilden kann. Dann zählt der Block, nicht die Art. */
    const mdTraegt = (b) => {
        if (!MD_TRAEGT.has(b.type))
            return false;
        /* Ein Bild aus der eigenen Ablage hängt an `dateiId`; `src` ist dabei
           leer oder eine tote `blob:`-Adresse (E98). `![](…)` würde daraus ein
           Bild ohne Datei machen — sichtbar erst nach dem nächsten Neustart. */
        if (b.type === 'image' && b.dateiId)
            return false;
        /* Eine gelernte Karteikarte trägt ihren Lernstand in `sr`. Der ist das
           Wertvolle daran; die Frage abzutippen kostet eine Minute, sechs
           Monate Wiederholung nicht. */
        if (b.type === 'flashcard' && b.sr)
            return false;
        /* `> 💡` ist die einzige Callout-Form, die zurückgelesen wird — ein
           anderes Zeichen käme als 💡 wieder. */
        if (b.type === 'callout' && b.icon && b.icon !== '💡')
            return false;
        return true;
    };
    /* Die vier alten Marken bleiben, was sie waren — sie stehen in
       `test89` und in jedem Text, den jemand herauskopiert und aufgehoben
       hat. Alles Übrige bekommt `blk:`. */
    const MD_MARKE = {
        database: 'db', whiteboard: 'wb', chart: 'chart', table: 'tab'
    };
    /* Ein Satz, den ein Mensch neben dem Platzhalter lesen kann. Kein
       Bestandteil des Formats — er wird beim Zurücklesen verworfen. */
    const mdName = (b) => {
        /* `pdfseite` und `spalte` stehen in keinem Register — sie sind
           Bausteine ohne Menüeintrag (doku/BLOCKTYPEN.md). Ihr Name muss
           deshalb hier stehen, sonst läse der Mensch „pdfseite". */
        const OHNE_REGISTER = {
            pdfseite: 'PDF-Seite', spalte: 'Spalte'
        };
        const art = OHNE_REGISTER[b.type] ||
            ((typeof Register !== 'undefined' && Register.bloecke?.eines)
                ? (Register.bloecke.eines(b.type)?.name || b.type)
                : b.type);
        const zusatz = b.type === 'pdfseite' && b.nr ? ' ' + Number(b.nr) : '';
        const titel = String(b.text || '').trim().slice(0, 40);
        return art + zusatz + (titel ? ': ' + titel : '');
    };
    const alsMarkdown = (p) => {
        const zeilen = [];
        const raus = (id, tiefe) => {
            Store.childrenOf(id).forEach((b) => {
                const ein = '  '.repeat(tiefe);
                /* Kann Markdown das nicht tragen, kommt es als Platzhalter durch —
                   samt allem, was darunter hängt. Der Satz dahinter ist für den
                   Menschen: ein nackter Kommentar mit einer Kennung sagt ihm nicht,
                   dass dort seine PDF-Seite steht. Gelesen wird nur die Kennung. */
                if (!mdTraegt(b)) {
                    const marke = MD_MARKE[b.type] || 'blk';
                    zeilen.push(`<!--${marke}:${b.id}--> ${mdName(b)}`);
                    return;
                }
                if (b.type === 'divider') {
                    zeilen.push('---');
                    return;
                }
                if (b.type === 'code') {
                    zeilen.push('```' + (b.lang || ''));
                    zeilen.push(b.text || '');
                    zeilen.push('```');
                    return;
                }
                if (b.type === 'equation') {
                    zeilen.push('$$' + (b.text || '') + '$$');
                    return;
                }
                if (b.type === 'image') {
                    zeilen.push(`![${b.caption || ''}](${b.src || ''})`);
                    return;
                }
                if (b.type === 'page') {
                    zeilen.push(`${ein}[[${b.text || 'Ohne Titel'}]]`);
                    return;
                }
                const marke = {
                    h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '1. ',
                    todo: b.checked ? '- [x] ' : '- [ ] ', quote: '> ', toggle: '> ',
                    callout: '> 💡 ', flashcard: '?? '
                }[b.type] || '';
                zeilen.push(ein + marke + (b.text || ''));
                raus(b.id, tiefe + 1);
            });
        };
        raus(p.id, 0);
        return zeilen.join('\n');
    };
    /** Markdown zurück in Blöcke. Vorhandene Datenbanken werden erkannt.
        Beim Reimport eines von Redion exportierten Vaults bleiben die IDs der
        nicht verlustfrei in Markdown darstellbaren Teilbaeume erhalten. */
    const ausMarkdown = (p, text, optionen = {}) => {
        /* Dieselbe Regel wie beim Hinschreiben, nur andersherum gelesen:
           gerettet wird, was NICHT durch Markdown gegangen ist. `Store.baum`
           nimmt den ganzen Ast mit — bei einer Spalte also auch die PDF-Seite
           darin und deren Striche. */
        const alteDbs = {};
        const erhaltene = new Map();
        if (optionen.preserveOpaqueIds) {
            /* Nicht kopieren: Eine Kopie bekaeme frische Block-IDs. Dateien sind
               aber ueber genau diese ID mit PDF-, Bild- und Audiobloecken
               verbunden. Deshalb den aeussersten opaken Ast kurz aus der
               `content`-Kette nehmen, bevor die Markdown-Bloecke geloescht werden. */
            const detach = (parentId) => {
                [...Store.childrenOf(parentId)].forEach((b) => {
                    if (mdTraegt(b)) {
                        detach(b.id);
                        return;
                    }
                    erhaltene.set(b.id, b);
                    const parent = Store.getBlock(parentId);
                    if (parent)
                        Store.updateBlock(parent.id, {
                            content: (parent.content || []).filter((id) => id !== b.id)
                        });
                    /* Bis der Platzhalter gelesen ist, gehoert der lebende Block zur
                       Importseite, steht aber absichtlich noch nicht in deren Liste. */
                    Store.updateBlock(b.id, { parentId: p.id, parentTable: 'block' });
                });
            };
            detach(p.id);
        }
        else {
            Store.childrenOf(p.id).forEach((b) => {
                if (!mdTraegt(b))
                    alteDbs[b.id] = Store.baum(b.id);
            });
        }
        const attachErhaltenen = (id, parentId) => {
            const block = erhaltene.get(id);
            const parent = Store.getBlock(parentId);
            if (!block || !parent || block.alive === false)
                return null;
            const vorher = Store.getBlock(block.parentId);
            if (vorher && vorher.id !== parent.id && (vorher.content || []).includes(block.id))
                Store.updateBlock(vorher.id, {
                    content: vorher.content.filter((kind) => kind !== block.id)
                });
            if (!(parent.content || []).includes(block.id))
                Store.updateBlock(parent.id, { content: [...(parent.content || []), block.id] });
            Store.updateBlock(block.id, { parentId: parent.id, parentTable: 'block' });
            erhaltene.delete(id);
            return block;
        };
        const retteUebrige = () => {
            /* Ein extern geloeschter oder verschobener Platzhalter darf niemals
               still echte Dateien/Unterseiten loeschen. Ohne eindeutigen Ort
               landen solche Bloecke sichtbar am Ende der Seite. */
            [...erhaltene.keys()].forEach(id => attachErhaltenen(id, p.id));
        };
        const gemerkt = [];
        const merke = (id) => {
            Store.childrenOf(id).forEach((b) => {
                if (!mdTraegt(b))
                    return;
                const stil = b.stil && typeof b.stil === 'object' && Object.keys(b.stil).length
                    ? { ...b.stil } : null;
                gemerkt.push({ id: String(b.id), type: String(b.type || ''),
                    text: String(b.text || ''),
                    ...(b.color ? { color: String(b.color) } : {}),
                    ...(stil ? { stil } : {}) });
                merke(b.id);
            });
        };
        merke(p.id);
        /** Was dieser Block einmal war — Kennung, Farbe, Schrift. Höchstens einmal. */
        const holeGemerktes = (typ, text) => {
            const i = gemerkt.findIndex(x => x.type === typ && x.text === String(text ?? ''));
            if (i < 0)
                return null;
            const [treffer] = gemerkt.splice(i, 1);
            return treffer ?? null;
        };
        try {
            Store.kinderLeeren(p.id);
            let imCode = false, codeText = [], codeLang = '';
            const zeilen = text.split('\n');
            /* ==========================================================================
             * EINRÜCKUNG IST STRUKTUR (E120)
             * --------------------------------------------------------------------------
             * `alsMarkdown` schreibt sie seit jeher — `'  '.repeat(tiefe)` —, und
             * `ausMarkdown` warf sie weg: jede Zeile wurde mit `trim()` beschnitten und
             * landete direkt unter der Seite. Gemessen an einer dreistufigen Liste:
             *
             *     - Oben eins            bullet
             *       - Darunter A           bullet        →   alle sieben Blöcke
             *         - Noch tiefer          bullet          nebeneinander auf
             *       - Darunter B           bullet          Ebene null
             *     - Oben zwei            bullet
             *
             * Eine Unterliste kam eine Ebene flach zurück, und eine Aufgabe verlor
             * ihre Unteraufgaben. Beim Einlesen einer `.md`-Datei dasselbe: dort ist
             * die Einrückung sogar die einzige Strukturangabe, die es gibt.
             *
             * Der Stapel hält je Tiefe den Elternteil. `stapel[0]` ist die Seite; wer
             * auf Tiefe t schreibt, hängt unter `stapel[t]` und wird selbst zu
             * `stapel[t+1]`.
             *
             * ZWEI SCHRITTE JE EBENE, nicht vier: das ist, was `alsMarkdown` schreibt.
             * Ein Tabulator zählt als zwei — Menschen tippen ihn, und in einer
             * `.md`-Datei aus anderer Hand steht er oft.
             *
             * Und: WER TIEFER SPRINGT, ALS ES EBENEN GIBT, landet eine Ebene tiefer
             * als der Vorgänger und nicht im Nichts (`Math.min`). Markdown erlaubt
             * das, und ein verlorener Block wäre schlimmer als eine Ebene daneben. */
            const stapel = [p.id];
            const tiefeVon = (roh) => {
                const vorn = (roh.match(/^[ \t]*/)?.[0] || '').replace(/\t/g, '  ');
                return Math.floor(vorn.length / 2);
            };
            const elternFuer = (roh) => {
                const t = Math.min(tiefeVon(roh), stapel.length - 1);
                stapel.length = t + 1;
                return stapel[t];
            };
            /* Anlegen UND als möglichen Elternteil der nächsten Ebene merken.
               Die EINZIGE Stelle, an der beim Übernehmen ein Block entsteht —
               deshalb steht die Wiederverwendung genau hier und nirgends sonst. */
            const lege = (roh, typ, felder) => {
                const alt = holeGemerktes(typ, felder ? felder['text'] : '');
                const mit = { ...(felder || {}) };
                if (alt) {
                    /* Die Kennung des Blocks, der hier stand. `Store.kinderLeeren` hat
                       ihn eben endgültig gelöscht, sie ist also frei. */
                    mit['id'] = alt.id;
                    if (alt.color)
                        mit['color'] = alt.color;
                    if (alt.stil)
                        mit['stil'] = alt.stil;
                }
                const b = Store.addBlock(elternFuer(roh), typ, mit);
                stapel.push(b.id);
                return b;
            };
            /* --- Markdown-Tabellen -------------------------------------------------
             * | Kopf | Kopf |
             * |------|------|
             * | Wert | Wert |
             * wird zu einem echten Tabellenblock. Ohne das landet jede Tabelle als
             * Textwüste aus Strichen — und die halbe Dokumentation besteht daraus.
             * -------------------------------------------------------------------- */
            const istTabellenzeile = (z) => /^\s*\|.*\|\s*$/.test(z);
            const istTrenner = (z) => /^\s*\|[\s:|-]+\|\s*$/.test(z) && /-/.test(z);
            const zellen = (z) => z.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
            let tabelle = null; /* sammelt die Zeilen der laufenden Tabelle */
            let tabelleZeile = ''; /* ihre erste Zeile — für die Einrückung */
            let codeZeile = ''; /* dasselbe für den Codeblock */
            let codeEinzug = ''; /* und wie weit SEIN Zaun eingerückt war */
            const tabelleAbschliessen = () => {
                if (!tabelle)
                    return;
                if (tabelle.length) {
                    const breite = Math.max(...tabelle.map((r) => r.length));
                    const rows = tabelle.map((r) => {
                        const k = r.slice();
                        while (k.length < breite)
                            k.push('');
                        return k;
                    });
                    /* Die Tabelle hängt dort, wo ihre ERSTE Zeile stand — nicht dort, wo
                       die Zeile danach steht (E120). */
                    lege(tabelleZeile, 'table', { rows, kopfZeile: true });
                }
                tabelle = null;
                tabelleZeile = '';
            };
            zeilen.forEach((roh) => {
                /* Tabellen zuerst — sie laufen über mehrere Zeilen */
                if (!imCode && istTabellenzeile(roh)) {
                    if (istTrenner(roh)) {
                        if (!tabelle) {
                            tabelle = [];
                            tabelleZeile = roh;
                        }
                        return;
                    }
                    if (!tabelle) {
                        tabelle = [];
                        tabelleZeile = roh;
                    }
                    tabelle.push(zellen(roh));
                    return;
                }
                if (tabelle)
                    tabelleAbschliessen();
                /* Der Teil hinter `-->` ist der Lesehinweis für den Menschen und
                   wird verworfen. Die Kennung selbst darf nur enthalten, was eine
                   Kennung enthält — sonst könnte ein `-->` im Text die Zeile
                   verschieben. */
                const platz = roh.trim().match(/^<!--(?:db|wb|chart|tab|blk):([A-Za-z0-9_-]+)-->\s*(?:.*)$/);
                if (platz?.[1] && (erhaltene.has(platz[1]) || alteDbs[platz[1]])) {
                    const neu = erhaltene.has(platz[1])
                        ? attachErhaltenen(platz[1], elternFuer(roh))
                        : Store.baumEinfuegen(alteDbs[platz[1]], elternFuer(roh));
                    if (neu)
                        stapel.push(neu.id);
                    return;
                }
                if (roh.trim().startsWith('```')) {
                    if (imCode) {
                        lege(codeZeile, 'code', { text: codeText.join('\n'), lang: codeLang });
                        imCode = false;
                        codeText = [];
                        codeLang = '';
                    }
                    else {
                        imCode = true;
                        codeLang = roh.trim().slice(3).trim();
                        codeZeile = roh;
                        codeEinzug = roh.match(/^[ \t]*/)?.[0] || '';
                    }
                    return;
                }
                if (imCode) {
                    /* NUR DEN EINZUG DES ZAUNS abziehen, nicht `trim()` (E120).
                       Ein Codeblock in einem Listenpunkt steht eingerückt:
            
                           - Aufgabe
                             ```js
                             if (x) {
                               tuWas();
                             }
                             ```
            
                       Der Zaun hat zwei Leerzeichen, die zum Markdown gehören; die zwei
                       weiteren vor `tuWas()` gehören zum CODE. `trim()` nähme beide und
                       machte aus eingerücktem Code flachen. Also genau den Zaun-Einzug
                       abziehen und den Rest stehen lassen. */
                    codeText.push(codeEinzug && roh.startsWith(codeEinzug)
                        ? roh.slice(codeEinzug.length) : roh);
                    return;
                }
                const z = roh.trim();
                if (!z)
                    return;
                if (/^(---|\*\*\*|___)$/.test(z)) {
                    lege(roh, 'divider');
                    return;
                }
                if (/^\$\$(.*)\$\$$/.test(z)) {
                    lege(roh, 'equation', { text: z.slice(2, -2) });
                    return;
                }
                const bild = z.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
                if (bild) {
                    lege(roh, 'image', { src: bild[2], caption: bild[1] });
                    return;
                }
                const m = z.match(/^(#{1,3})\s+(.*)$/);
                if (m) {
                    lege(roh, ['h1', 'h2', 'h3'][m[1].length - 1], { text: m[2] });
                    return;
                }
                const todo = z.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
                if (todo) {
                    lege(roh, 'todo', { text: todo[2], checked: todo[1].toLowerCase() === 'x' });
                    return;
                }
                if (/^[-*+]\s+/.test(z)) {
                    lege(roh, 'bullet', { text: z.replace(/^[-*+]\s+/, '') });
                    return;
                }
                if (/^\d+\.\s+/.test(z)) {
                    lege(roh, 'number', { text: z.replace(/^\d+\.\s+/, '') });
                    return;
                }
                if (/^>\s*💡\s*/.test(z)) {
                    lege(roh, 'callout', { text: z.replace(/^>\s*💡\s*/, ''), icon: '💡' });
                    return;
                }
                if (/^>\s+/.test(z)) {
                    lege(roh, 'quote', { text: z.replace(/^>\s+/, '') });
                    return;
                }
                if (/^\?\?\s+/.test(z)) {
                    lege(roh, 'flashcard', { text: z.replace(/^\?\?\s+/, '') });
                    return;
                }
                lege(roh, 'text', { text: z });
            });
            if (imCode && codeText.length)
                lege(codeZeile, 'code', { text: codeText.join('\n'), lang: codeLang });
            tabelleAbschliessen(); /* falls die Datei mit einer Tabelle endet */
        }
        finally {
            retteUebrige();
            /* Hier stand bis E174 ein zweiter Durchgang, der die Farben nachträglich
               wieder aufsetzte. Er ist fort: `lege` gibt sie jetzt beim Anlegen mit,
               zusammen mit der Kennung und nach derselben Regel. Ein Durchgang
               statt zwei, und eine Zuordnung statt zweier, die auseinanderlaufen
               können. */
        }
    };
    /* --------------------------------------------------------------------------
     * DIE SCHREIBSTATISTIK — nur die Zahlen
     * --------------------------------------------------------------------------
     * Vorher stand diese Rechnung im ersten Drittel von `statistik()`, direkt
     * vor dem `document.createElement`. Getrennt, weil man die Zahlen prüfen
     * können soll, ohne ein Fenster zu öffnen: `woerter` und `saetze` sind
     * hier Anzahlen, nicht Listen — die Listen brauchte drüben niemand.
     * ----------------------------------------------------------------------- */
    const statistikZahlen = (p) => {
        const sammle = (id, tiefe = 0) => {
            let t = '';
            Store.childrenOf(id).forEach((b) => { t += ' ' + (b.text || ''); t += sammle(b.id, tiefe + 1); });
            return t;
        };
        const text = ((p.text || '') + ' ' + sammle(p.id)).trim();
        const woerter = text.split(/\s+/).filter(Boolean);
        const saetze = text.split(/[.!?]+\s/).filter(x => x.trim().length > 1);
        const zeichen = text.length;
        const lesezeit = Math.max(1, Math.round(woerter.length / 200));
        const sprechzeit = Math.max(1, Math.round(woerter.length / 130));
        const blockAnzahl = (function zaehl(id) {
            let n = 0;
            Store.childrenOf(id).forEach((b) => { n += 1 + zaehl(b.id); });
            return n;
        })(p.id);
        const stop = new Set(('der die das und oder aber ich du er sie es wir ihr in im an auf für mit von zu ist sind ' +
            'war waren ein eine einen einem eines dem den des nicht auch als wie wenn dann noch nur schon so bei um am').split(' '));
        const haeufig = {};
        woerter.forEach((w) => {
            const k = w.toLowerCase().replace(/[^\wäöüß-]/g, '');
            if (k.length < 4 || stop.has(k))
                return;
            haeufig[k] = (haeufig[k] || 0) + 1;
        });
        const top = Object.entries(haeufig).sort((a, b) => b[1] - a[1]).slice(0, 12);
        /* Ganzer Arbeitsbereich */
        const alleW = Object.values(Store.cache.blocks)
            .filter(b => b.alive)
            .reduce((n, b) => n + (b.text || '').split(/\s+/).filter(Boolean).length, 0);
        return { woerter: woerter.length, zeichen, saetze: saetze.length,
            blockAnzahl, lesezeit, sprechzeit, top, alleW };
    };
    /* Zwei kleine Helfer: ein Dateiname ohne verbotene Zeichen, und die Frage,
       ob eine Seite unter einer anderen hängt (gegen Ringe beim Verschieben). */
    const sauber = (s) => String(s).replace(/[\/\\:*?"<>|]/g, '-').slice(0, 80).trim() || 'Seite';
    const istUnter = (id, moeglicherElter) => {
        let cur = Store.getBlock(id), n = 0;
        while (cur && n++ < 50) {
            if (cur.parentId === moeglicherElter)
                return true;
            cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
        }
        return false;
    };
    return { esc, heute, WOCHENTAG, MONAT, datumLang, unscharf, zeitKurz, planen,
        alsMarkdown, ausMarkdown, statistikZahlen, sauber, istUnter };
})();
/* Nur, wenn es ein Fenster gibt. In Node gibt es keines — und genau das ist
   der Zweck dieser Datei. */
if (typeof window !== 'undefined')
    window.WissenDienst = WissenDienst;
