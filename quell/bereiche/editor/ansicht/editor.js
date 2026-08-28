"use strict";
/* ============================================================================
 * blocks.js — Der Block-Editor
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/editor/ansicht/editor.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/editor/ansicht/editor.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Alles ist ein Block. Ein Absatz ist ein Block, eine Überschrift ist ein
 * Block, eine Unterseite ist ein Block, eine Datenbank ist ein Block.
 * Genau wie bei Notion.
 *
 * Dieser Datei gehört:
 *   - der Katalog aller Blocktypen (mit Slash-Befehl und Tastenkürzel)
 *   - das Rendern eines Blocks ins DOM
 *   - die Tastatursteuerung im Editor
 *   - das Slash-Menü
 *   - die Markdown-Kürzel beim Tippen
 *   - das Block-Handle-Menü
 * ==========================================================================*/
const Blocks = (() => {
    /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
       und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
       stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
       kein Element ist, warf das mitten im Behandeln. */
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    /* ========================================================================
     * DER KATALOG
     * ------------------------------------------------------------------------
     * gruppe   – Überschrift im Slash-Menü
     * cmd      – die Wörter, auf die der Slash-Befehl reagiert
     * kurz     – Tastenkürzel, das den Blocktyp setzt
     * md       – Markdown-Kürzel, das beim Tippen sofort umwandelt
     * ======================================================================*/
    /* Die Liste steht in register/bloecke.js — dort wird eine neue Blockart
       angelegt, und sie ist danach überall da. */
    const TYPEN = Register.bloecke.alle();
    /* ========================================================================
     * EINBETTUNGEN
     * ------------------------------------------------------------------------
     * In Notion hat jeder Dienst einen eigenen Eintrag im Slash-Menü, obwohl
     * darunter immer derselbe Einbettungsblock steckt. Genauso hier: der Dienst
     * merkt sich nur, wie die normale Adresse in eine Einbettungsadresse
     * umgeschrieben wird. Alles ohne Schlüssel und ohne fremden Dienst.
     * ======================================================================*/
    const DIENSTE = [
        { id: 'youtube', name: 'YouTube', icon: '▶', hinweis: 'youtube.com/watch?v=…',
            um: (u) => {
                const m = u.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{6,})/);
                return m ? 'https://www.youtube.com/embed/' + m[1] : u;
            } },
        { id: 'vimeo', name: 'Vimeo', icon: '▶', hinweis: 'vimeo.com/123456',
            um: (u) => {
                const m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
                return m ? 'https://player.vimeo.com/video/' + m[1] : u;
            } },
        { id: 'maps', name: 'Google Maps', icon: '🗺', hinweis: 'Adresse oder Maps-Link',
            um: (u) => /^https?:/.test(u)
                ? (u.includes('output=embed') ? u : u + (u.includes('?') ? '&' : '?') + 'output=embed')
                : 'https://www.google.com/maps?q=' + encodeURIComponent(u) + '&output=embed' },
        { id: 'drive', name: 'Google Drive', icon: '📁', hinweis: 'drive.google.com/file/d/…',
            um: (u) => u.replace(/\/(view|edit)(\?.*)?$/, '/preview') },
        { id: 'gdocs', name: 'Google Docs', icon: '📝', hinweis: 'docs.google.com/document/d/…',
            um: (u) => u.replace(/\/edit(\?.*)?$/, '/preview') },
        { id: 'figma', name: 'Figma', icon: '🎨', hinweis: 'figma.com/file/…',
            um: (u) => u.includes('figma.com/embed') ? u
                : 'https://www.figma.com/embed?embed_host=share&url=' + encodeURIComponent(u) },
        { id: 'miro', name: 'Miro', icon: '🧲', hinweis: 'miro.com/app/board/…',
            um: (u) => u.replace('/app/board/', '/app/live-embed/') },
        { id: 'excalidraw', name: 'Excalidraw', icon: '✏', hinweis: 'excalidraw.com/#json=…', um: (u) => u },
        { id: 'loom', name: 'Loom', icon: '🎥', hinweis: 'loom.com/share/…',
            um: (u) => u.replace('/share/', '/embed/') },
        { id: 'spotify', name: 'Spotify', icon: '🎧', hinweis: 'open.spotify.com/track/…',
            um: (u) => u.replace(/open\.spotify\.com\/(?!embed)/, 'open.spotify.com/embed/') },
        { id: 'soundcloud', name: 'SoundCloud', icon: '🔊', hinweis: 'soundcloud.com/…',
            um: (u) => u.includes('w.soundcloud.com') ? u
                : 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(u) },
        { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', hinweis: 'x.com/name/status/…',
            um: (u) => {
                const m = u.match(/status\/(\d+)/);
                return m ? 'https://platform.twitter.com/embed/Tweet.html?id=' + m[1] : u;
            } },
        { id: 'gist', name: 'GitHub Gist', icon: '🐙', hinweis: 'gist.github.com/…',
            um: (u) => u.replace(/\/?$/, '').replace(/\.pibb$/, '') + '.pibb' },
        { id: 'codepen', name: 'CodePen', icon: '🖊', hinweis: 'codepen.io/name/pen/…',
            um: (u) => u.replace('/pen/', '/embed/') },
        { id: 'typeform', name: 'Typeform', icon: '📋', hinweis: 'form.typeform.com/to/…', um: (u) => u },
        { id: 'canva', name: 'Canva', icon: '🖼', hinweis: 'canva.com/design/…',
            um: (u) => u.includes('embed') ? u : u.replace(/\/view.*$/, '/view?embed') },
        { id: 'pdf', name: 'PDF', icon: '📕', hinweis: 'Adresse einer PDF-Datei', um: (u) => u }
    ];
    DIENSTE.forEach(d => TYPEN.push({
        id: 'embed-' + d.id, name: d.name, icon: d.icon, gruppe: 'Einbetten',
        cmd: [d.id, d.name.toLowerCase(), 'einbetten ' + d.id]
    }));
    const dienst = (id) => DIENSTE.find(d => d.id === id);
    /** Aus einer normalen Adresse die Adresse machen, die im Rahmen läuft. */
    const einbettungsAdresse = (dienstId, url) => {
        const d = dienst(dienstId);
        const u = String(url || '').trim();
        if (!d)
            return u;
        try {
            return d.um(u);
        }
        catch {
            return u;
        }
    };
    const typ = (id) => TYPEN.find((t) => t.id === id) || TYPEN[0];
    /* Ziffer → Blockart, aus dem Register. Hier standen dieselben zehn Paare
       DREIMAL als Literal: für Strg+Umschalt, für die Mac-Belegung Strg+Alt
       und für die Mehrfachauswahl. Zusammen mit dem `kurz`-Feld im Register
       waren es vier Kopien einer Zuordnung. */
    const ZIFFER_TYP = () => (typeof Register !== 'undefined' && Register.bloecke?.zifferZuTyp)
        ? Register.bloecke.zifferZuTyp()
        : { '0': 'text', '1': 'h1', '2': 'h2', '3': 'h3', '4': 'todo', '5': 'bullet',
            '6': 'number', '7': 'toggle', '8': 'code', '9': 'page' };
    /* Die Blocktypen, in die man einen bestehenden Block umwandeln kann. */
    const UMWANDELBAR = ['text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number', 'toggle', 'quote', 'callout',
        'code', 'equation', 'flashcard', 'page'];
    /* Die Sprachen des Codeblocks. Stand hier früher mitten im Zeichnen — jetzt
       oben, weil auch das Markdown-Kürzel ```js sie braucht. */
    const SPRACHEN = ['Plain Text', 'JavaScript', 'TypeScript', 'JSX', 'Python', 'HTML', 'XML', 'CSS', 'SCSS', 'Less', 'JSON', 'YAML', 'TOML',
        'SQL', 'GraphQL', 'Bash', 'Shell', 'PowerShell', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart',
        'PHP', 'Ruby', 'Perl', 'Lua', 'R', 'Julia', 'MATLAB', 'Haskell', 'Elixir', 'Erlang', 'Clojure', 'Scala', 'Objective-C',
        'Assembly', 'Docker', 'Makefile', 'Nginx', 'Diff', 'LaTeX', 'Markdown'];
    /* Wer ```js tippt, meint JavaScript. Nur die Kurzformen, die sich nicht
       von selbst ergeben — „python" findet SPRACHEN schon ohne Hilfe. */
    const SPRACH_KURZ = {
        js: 'JavaScript', ts: 'TypeScript', tsx: 'JSX', py: 'Python',
        sh: 'Bash', zsh: 'Bash', console: 'Shell', ps1: 'PowerShell',
        'c++': 'C++', cpp: 'C++', cs: 'C#', 'objective-c': 'Objective-C', objc: 'Objective-C',
        golang: 'Go', rs: 'Rust', kt: 'Kotlin', rb: 'Ruby', pl: 'Perl',
        yml: 'YAML', md: 'Markdown', tex: 'LaTeX', dockerfile: 'Docker',
        text: 'Plain Text', plain: 'Plain Text', txt: 'Plain Text'
    };
    /** „js" → „JavaScript". Unbekanntes bleibt Plain Text, statt zu verschwinden. */
    const sprachName = (roh) => {
        const k = String(roh ?? '').toLowerCase();
        if (SPRACH_KURZ[k])
            return SPRACH_KURZ[k];
        return SPRACHEN.find(s => s.toLowerCase() === k) || 'Plain Text';
    };
    /** Wie viele Stufen ist die Zeile eingerückt? Vier Leerzeichen = ein Tab. */
    const mdTiefe = (roh) => {
        const vorn = /^[\t ]*/.exec(roh)?.[0] ?? '';
        let n = 0;
        for (const z of vorn)
            n += z === '\t' ? 4 : 1;
        return Math.floor(n / 4); /* 0-3 Zeichen → 0, 4-7 → 1, 8-11 → 2 */
    };
    /**
     * Markdown-Text in Blöcke lesen. Gibt eine flache Liste mit Tiefenangabe
     * zurück — wer daraus einen Baum bauen will, tut es beim Einfügen.
     */
    const mdLesen = (roh) => {
        const zeilen = String(roh ?? '').replace(/\r\n?/g, '\n').split('\n');
        const raus = [];
        for (let i = 0; i < zeilen.length; i++) {
            const zeile = zeilen[i] ?? '';
            const tiefe = mdTiefe(zeile);
            const t = zeile.trim();
            /* Codezaun: alles bis zum schliessenden Zaun bleibt, wie es ist —
               auch die leeren Zeilen, auch die Rautezeichen darin. */
            const auf = /^```([a-zA-Z0-9+#.-]{0,20})\s*$/.exec(t);
            if (auf) {
                const inhalt = [];
                let zu = false;
                while (++i < zeilen.length) {
                    if (/^\s*```\s*$/.test(zeilen[i] ?? '')) {
                        zu = true;
                        break;
                    }
                    inhalt.push(zeilen[i] ?? '');
                }
                /* Ein Zaun ohne Ende ist kaputtes Markdown, aber der Text darin ist
                   echt — er wird zum Codeblock, statt verloren zu gehen. */
                void zu;
                raus.push({ typ: 'code', text: inhalt.join('\n'), tiefe,
                    lang: sprachName(auf[1] ?? '') });
                continue;
            }
            if (!t)
                continue; /* Leerzeilen weg */
            /* Verschachtelte Zitate tragen ihre Tiefe in den `>`-Marken, nicht
               zwingend in Leerzeichen: `> > Innen` ist eine Stufe unter
               `> Aussen`. Vorher wurde nur die erste Marke entfernt; die zweite
               blieb sichtbar im Text und beide Zitate lagen nebeneinander. */
            if (t.startsWith('>')) {
                let rest = t;
                let zitatStufen = 0;
                while (rest.startsWith('>')) {
                    zitatStufen++;
                    rest = rest.slice(1).replace(/^\s?/, '');
                }
                const zitatTiefe = tiefe + Math.max(0, zitatStufen - 1);
                if (/^💡\s*/.test(rest))
                    raus.push({ typ: 'callout', text: rest.replace(/^💡\s*/, ''), tiefe: zitatTiefe });
                else
                    raus.push({ typ: 'quote', text: rest, tiefe: zitatTiefe });
                continue;
            }
            /* Markdown-Tabelle (L20): eine |-Zeile, unmittelbar gefolgt von der
               Trennzeile (|---|---|). Alle |-Zeilen danach gehören dazu. Ohne
               Trennzeile ist es keine Tabelle — dann bleibt die Zeile Text,
               denn „| a | b |" kann auch einfach so gemeint sein. */
            if (/^\|.*\|$/.test(t)) {
                const naechste = (zeilen[i + 1] ?? '').trim();
                if (/^\|?[\s:|-]+\|?$/.test(naechste) && naechste.includes('-')) {
                    const spaltenVon = (z) => z.replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => x.trim());
                    const daten = [spaltenVon(t)];
                    i++; /* die Trennzeile überspringen */
                    while (i + 1 < zeilen.length && /^\|.*\|$/.test((zeilen[i + 1] ?? '').trim()))
                        daten.push(spaltenVon((zeilen[++i] ?? '').trim()));
                    raus.push({ typ: 'tabelle', text: '', tiefe, zellen: daten });
                    continue;
                }
            }
            if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
                raus.push({ typ: 'divider', text: '', tiefe });
                continue;
            }
            let m;
            if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) {
                raus.push({ typ: 'h' + (m[1] ?? '#').length, text: m[2] ?? '', tiefe });
                continue;
            }
            /* Aufgabe vor Aufzählung prüfen: „- [ ] x" ist beides, und das
               Kästchen ist die genauere Auskunft. */
            if ((m = /^[-*+]\s+\[([ xX])\]\s*(.*)$/.exec(t))) {
                raus.push({ typ: 'todo', text: m[2] ?? '', tiefe, checked: (m[1] ?? ' ') !== ' ' });
                continue;
            }
            if ((m = /^\[([ xX])\]\s+(.*)$/.exec(t))) {
                raus.push({ typ: 'todo', text: m[2] ?? '', tiefe, checked: (m[1] ?? ' ') !== ' ' });
                continue;
            }
            if ((m = /^[-*+]\s+(.*)$/.exec(t))) {
                raus.push({ typ: 'bullet', text: m[1] ?? '', tiefe });
                continue;
            }
            if ((m = /^(?:\d{1,9}|[a-zA-Z]|[ivxIVX]{1,6})[.)]\s+(.*)$/.exec(t))) {
                raus.push({ typ: 'number', text: m[1] ?? '', tiefe });
                continue;
            }
            raus.push({ typ: 'text', text: t, tiefe });
        }
        return raus;
    };
    /** Steckt Markdown genug Gliederung, dass daraus mehr als ein Block wird? */
    const mdIstStruktur = (roh) => {
        const teile = mdLesen(roh);
        return teile.length > 1 || (teile.length === 1 && teile[0].typ !== 'text');
    };
    /**
     * Gelesene Blöcke unter `elternId` ab `idx` einsetzen. Die Tiefe wird zu
     * echter Verschachtelung: ein eingerückter Punkt landet im Block darüber.
     * Gibt die Kennung des letzten eingesetzten Blocks zurück.
     */
    const mdEinsetzen = (teile, elternId, idx) => {
        /* Je Tiefe der zuletzt gesetzte Block — sein Kind kommt eine Stufe tiefer.
           Stufe 0 ist der Eltern-Block selbst, dort zählt der Einfügeplatz. */
        const stapel = [null];
        const gesetzt = [];
        teile.forEach(teil => {
            const tiefe = Math.min(teil.tiefe, stapel.length - 1);
            const ziel = tiefe === 0 ? elternId : stapel[tiefe];
            if (!ziel)
                return;
            /* Eine Markdown-Tabelle wird ein Tabellenblock (E88). Die Zellen
               gehen durch Spreadsheet.setze, damit aus „12" eine Zahl wird und
               aus „=A1+B1" eine Formel — genau wie beim Tippen. */
            if (teil.typ === 'tabelle' && teil.zellen &&
                typeof Spreadsheet !== 'undefined' && typeof CellRefs !== 'undefined') {
                const neuT = tiefe === 0
                    ? Store.addBlock(ziel, 'spreadsheet', { text: 'Tabelle' }, idx++)
                    : Store.addBlock(ziel, 'spreadsheet', { text: 'Tabelle' });
                const mappe = Spreadsheet.neueMappe('Tabelle');
                const blatt = mappe.blaetter[0];
                blatt.zeilen = Math.max(blatt.zeilen, teil.zellen.length);
                blatt.spalten = Math.max(blatt.spalten, teil.zellen.reduce((m, z) => Math.max(m, z.length), 1));
                teil.zellen.forEach((zeile, z) => zeile.forEach((wert, s) => {
                    if (wert !== '')
                        Spreadsheet.setze(blatt, CellRefs.schreibe(z, s), wert);
                }));
                /* Einmal durchrechnen: eingefügte =Formeln sollen ihren Wert
                   tragen, auch wenn das Raster nie geöffnet wird. */
                try {
                    Spreadsheet.rechneMappe(mappe);
                }
                catch { /* Zirkel zeigt die Zelle */ }
                Store.updateBlock(neuT.id, { mappe });
                stapel.length = tiefe + 1;
                stapel.push(neuT.id);
                gesetzt.push(neuT.id);
                return;
            }
            const props = { text: teil.text };
            if (teil.checked)
                props.checked = true;
            if (teil.lang)
                props.lang = teil.lang;
            const neu = tiefe === 0
                ? Store.addBlock(ziel, teil.typ, props, idx++)
                : Store.addBlock(ziel, teil.typ, props);
            stapel.length = tiefe + 1;
            stapel.push(neu.id);
            gesetzt.push(neu.id);
        });
        return gesetzt.length ? gesetzt[gesetzt.length - 1] : null;
    };
    /* ========================================================================
     * HILFEN
     * ======================================================================*/
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    /** Wandelt gespeicherten Text in Anzeige-HTML um (Fett, Kursiv, Code, Links). */
    const inline = (s) => {
        let h = esc(s)
            .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
            .replace(/(^|\W)\*(.+?)\*(\W|$)/g, '$1<i>$2</i>$3')
            .replace(/__(.+?)__/g, '<u>$1</u>')
            .replace(/~~(.+?)~~/g, '<s>$1</s>')
            /* Notion streicht auch mit einer einzelnen Tilde durch. Erst danach,
               damit ~~doppelt~~ nicht zu <s>~doppelt~</s> zerfällt — und nur, wenn
               kein Leerzeichen anschliesst, sonst trifft es „ca. 3~5 Grad". */
            .replace(/(^|[^~\w])~([^~\s](?:[^~]*[^~\s])?)~(?![~\w])/g, '$1<s>$2</s>')
            .replace(/`([^`]+?)`/g, '<code>$1</code>')
            .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
        /* Inline-Formel $a^2$ — der kleine Mathe-Satz aus canvas.js */
        if (typeof Zusatz !== 'undefined')
            h = h.replace(/\$([^$\n]{1,120})\$/g, (_, f) => Zusatz.mathe(f));
        /* Datumserwähnung @2026-08-02 */
        h = h.replace(/(^|[\s(])@(\d{4}-\d{2}-\d{2})/g, (_, vor, d) => `${vor}<span class="datum" title="${d}">📅 ${new Date(d + 'T12:00:00').toLocaleDateString('de-DE')}</span>`);
        /* Seitenlinks [[…]], Schlagwörter #… und Blockverweise ((…)) */
        return typeof Links !== 'undefined' ? Links.inline(h) : h;
    };
    /* Cursor ans Ende eines Elements setzen */
    const cursorAnsEnde = (el) => {
        el.focus();
        const r = document.createRange();
        r.selectNodeContents(el);
        r.collapse(false);
        const s = getSelection();
        if (!s)
            return;
        s.removeAllRanges();
        s.addRange(r);
    };
    /* Steht der Cursor ganz am Anfang des Blocks? */
    const amAnfang = (el) => {
        const s = getSelection();
        if (!s || !s.rangeCount)
            return false;
        const r = s.getRangeAt(0).cloneRange();
        r.selectNodeContents(el);
        r.setEnd(s.getRangeAt(0).startContainer, s.getRangeAt(0).startOffset);
        return r.toString().length === 0;
    };
    const amEnde = (el) => {
        const s = getSelection();
        if (!s || !s.rangeCount)
            return false;
        const r = s.getRangeAt(0).cloneRange();
        r.selectNodeContents(el);
        r.setStart(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
        return r.toString().length === 0;
    };
    /* ========================================================================
     * RENDERN
     * ======================================================================*/
    let zeitmarkenSpieler = null;
    /** Springt zu einer Tonstelle. Zuerst wird der sichtbare Audio-Block
        benutzt; bei einem Verweis von einer anderen Seite reicht auch die
        stabile Datei-Kennung. Alte Audio-Blöcke mit `src` bleiben davon
        unberührt und funktionieren weiterhin im normalen Player. */
    const audioRefSpielen = async (ref) => {
        const sek = Math.max(0, Number(ref?.sek) || 0);
        const blockId = String(ref?.blockId || '');
        const ziel = Array.from(document.querySelectorAll('.blk[data-bid]'))
            .find(el2 => el2.dataset.bid === blockId);
        const sichtbar = ziel?.querySelector('audio') || null;
        const spiele = (audio) => {
            const los = () => {
                try {
                    audio.currentTime = sek;
                }
                catch { /* Metadaten kommen gleich; `loadedmetadata` versucht erneut. */ }
                audio.play().catch(err => UI.toast('Ton konnte nicht starten: ' +
                    (err instanceof Error ? err.message : String(err))));
            };
            if (audio.readyState >= 1)
                los();
            else
                audio.addEventListener('loadedmetadata', los, { once: true });
        };
        if (sichtbar) {
            spiele(sichtbar);
            return;
        }
        if (!ref?.dateiId || typeof Dateien === 'undefined') {
            UI.toast('Der zugehörige Audio-Block ist auf dieser Seite nicht verfügbar.');
            return;
        }
        const adresse = await Dateien.adresse(String(ref.dateiId));
        if (!adresse) {
            UI.toast('Die Tondatei gibt es nicht mehr.');
            return;
        }
        if (zeitmarkenSpieler) {
            try {
                zeitmarkenSpieler.pause();
            }
            catch { }
        }
        zeitmarkenSpieler = new Audio(adresse);
        spiele(zeitmarkenSpieler);
    };
    /** Baut das DOM für einen Block samt Kindern. */
    const render = (block, tiefe = 0) => {
        const t = typ(block.type);
        const el = document.createElement('div');
        el.className = 'blk b-' + block.type;
        el.dataset.id = block.type;
        el.dataset.bid = block.id;
        /* Die Stufe für `h1`/`h2`/`h3` — gesetzt wird sie weiter unten auf dem
           TEXTFELD, nicht auf diesem Kasten. Siehe `machText`. */
        const stufe = { h1: '2', h2: '3', h3: '4' }[block.type];
        /* Der Griff links: Plus und Sechs-Punkte */
        const griffe = document.createElement('div');
        griffe.className = 'handles';
        griffe.innerHTML =
            '<button data-act="add" title="Block darunter einfügen">+</button>' +
                '<button data-act="menu" title="Ziehen zum Verschieben, Klick für Optionen">⋮⋮</button>';
        el.appendChild(griffe);
        /* Der Inhalt — je nach Typ verschieden */
        const box = document.createElement('div');
        box.style.cssText = 'flex:1; min-width:0; display:flex; align-items:flex-start';
        el.appendChild(box);
        /* Ist die Seite gegen Bearbeiten gesperrt? Dann nur lesen. */
        const seite = App.aktuelleSeite ? Store.getBlock(App.aktuelleSeite()) : null;
        const nurLesen = !!(seite && seite.gesperrt);
        const machText = (ph) => {
            const ct = document.createElement('div');
            ct.className = 'ct';
            ct.contentEditable = nurLesen ? 'false' : 'true';
            ct.spellcheck = !!Store.getMeta('rechtschreib', false);
            ct.dataset.ph = ph || t.ph || '';
            ct.innerHTML = inline(block.text || '');
            if (block.color)
                ct.classList.add(block.color.startsWith('bg-') ? block.color : 't-' + block.color);
            /* Grösse und Schriftart als KLASSEN aus dem Katalog (E101). Was dort
               nicht steht, ergibt keine Klasse — aus den Daten kann damit kein
               fremdes CSS kommen (§19). */
            Textstile.klassen(block.stil).forEach((k) => ct.classList.add(k));
            /* ÜBERSCHRIFTEN MÜSSEN AUCH ÜBERSCHRIFTEN SEIN.
               Jeder Block ist ein `<div>`, auch `h1`, `h2` und `h3` — sichtbar
               sind sie durch ihre Grösse, hörbar durch gar nichts. Wer nicht
               sieht, springt von Überschrift zu Überschrift; gemessen am
               7. August fand eine Seite mit Titel und Überschrift genau null.
      
               AUF DEM TEXTFELD, NICHT AUF DEM BLOCKKASTEN. Der Kasten enthält
               auch die Griffe ✚ und ⋮⋮; die Überschrift hiesse dann
               „+ ⋮⋮ Eine Überschrift".
      
               UND EINE STUFE TIEFER, als der Blockname sagt: die Stufe 1 gehört
               dem Seitentitel. Ein `h1`-Block ist die erste Gliederungsebene
               DARIN, also Stufe 2. Zwei Überschriften der Stufe 1 auf einer
               Seite heissen für ein Vorleseprogramm: hier fangen zwei Dokumente
               an. */
            if (stufe) {
                ct.setAttribute('role', 'heading');
                ct.setAttribute('aria-level', stufe);
            }
            return ct;
        };
        switch (block.type) {
            case 'divider':
                box.innerHTML = '<hr style="width:100%">';
                break;
            case 'todo': {
                const mk = document.createElement('div');
                mk.className = 'mk';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = !!block.checked;
                cb.addEventListener('change', () => {
                    Store.updateBlock(block.id, { checked: cb.checked });
                    el.classList.toggle('done', cb.checked);
                });
                mk.appendChild(cb);
                box.appendChild(mk);
                box.appendChild(machText());
                if (block.checked)
                    el.classList.add('done');
                break;
            }
            case 'bullet': {
                const mk = document.createElement('div');
                mk.className = 'mk';
                mk.textContent = tiefe % 3 === 0 ? '•' : tiefe % 3 === 1 ? '◦' : '▪';
                box.appendChild(mk);
                box.appendChild(machText());
                break;
            }
            case 'number': {
                const mk = document.createElement('div');
                mk.className = 'mk';
                mk.textContent = (block.nr || 1) + '.';
                box.appendChild(mk);
                box.appendChild(machText());
                break;
            }
            case 'toggle': {
                const mk = document.createElement('div');
                mk.className = 'mk';
                mk.textContent = '▸';
                mk.addEventListener('click', () => {
                    const auf = !el.classList.contains('open');
                    el.classList.toggle('open', auf);
                    Store.updateBlock(block.id, { open: auf });
                    const kids = el.nextElementSibling;
                    if (kids instanceof HTMLElement && kids.classList.contains('toggle-kids'))
                        kids.style.display = auf ? '' : 'none';
                });
                box.appendChild(mk);
                box.appendChild(machText());
                if (block.open)
                    el.classList.add('open');
                break;
            }
            case 'callout': {
                const kasten = document.createElement('div');
                kasten.className = 'box';
                if (block.color)
                    kasten.classList.add('bg-' + block.color.replace('bg-', ''));
                const emo = document.createElement('div');
                emo.className = 'emo';
                emo.textContent = block.icon || '💡';
                emo.title = 'Klicken für ein anderes Symbol';
                emo.addEventListener('click', () => {
                    UI.emojiWaehlen(emo, (e) => { emo.textContent = e; Store.updateBlock(block.id, { icon: e }); });
                });
                kasten.appendChild(emo);
                kasten.appendChild(machText('Hinweis schreiben …'));
                box.appendChild(kasten);
                break;
            }
            case 'code': {
                const wrap = document.createElement('div');
                wrap.style.cssText = 'width:100%; position:relative';
                const sprache = document.createElement('select');
                sprache.style.cssText =
                    'position:absolute; top:8px; right:10px; background:var(--bg-input); ' +
                        'border:1px solid var(--line); border-radius:4px; font-size:11.5px; ' +
                        'padding:2px 4px; color:var(--text-dim); outline:none; z-index:2';
                SPRACHEN.forEach(s => {
                    const o = document.createElement('option');
                    o.textContent = s;
                    if ((block.lang || 'Plain Text') === s)
                        o.selected = true;
                    sprache.appendChild(o);
                });
                sprache.addEventListener('change', () => Store.updateBlock(block.id, { lang: sprache.value }));
                const ct = machText('Code …');
                ct.textContent = block.text || ''; /* im Codeblock kein Inline-HTML */
                if (block.zeilenUm)
                    ct.classList.add('umbruch');
                /* Zeilennummern — Notion hat sie nicht, ab zwanzig Zeilen Code
                   sucht man sich ohne sie die Stelle mühsam zusammen. */
                const nummern = document.createElement('div');
                nummern.className = 'code-nr';
                const zaehleNummern = () => {
                    const t = Store.getBlock(block.id)?.text || '';
                    const n = Math.max(1, t.split('\n').length);
                    nummern.innerHTML = Array.from({ length: n }, (_, i) => `<i>${i + 1}</i>`).join('');
                };
                const nrAn = block.zeilennr !== false;
                if (nrAn)
                    wrap.classList.add('mit-nr');
                /* Eingefärbt anzeigen, solange niemand darin schreibt. */
                const faerbe = () => {
                    zaehleNummern();
                    if (document.activeElement === ct)
                        return;
                    const t = Store.getBlock(block.id)?.text || '';
                    ct.innerHTML = Zusatz.einfaerben(t, block.lang || '');
                };
                ct.addEventListener('focus', () => { ct.textContent = Store.getBlock(block.id)?.text || ''; });
                ct.addEventListener('blur', faerbe);
                ct.addEventListener('input', zaehleNummern);
                sprache.addEventListener('change', () => setTimeout(faerbe, 0));
                setTimeout(faerbe, 0);
                /* Werkzeuge oben rechts: kopieren, Nummern, Umbruch */
                const werk = document.createElement('div');
                werk.className = 'code-werk';
                werk.innerHTML =
                    '<button data-a="kopieren" title="Code kopieren">⧉</button>' +
                        `<button data-a="nr" title="Zeilennummern" class="${nrAn ? 'an' : ''}">№</button>` +
                        `<button data-a="um" title="Lange Zeilen umbrechen" class="${block.zeilenUm ? 'an' : ''}">↩</button>`;
                werk.addEventListener('click', e => {
                    const b2 = elVon(e)?.closest('button[data-a]');
                    if (!b2)
                        return;
                    if (b2.dataset.a === 'kopieren') {
                        Ablage.kopiereJetzt(Store.getBlock(block.id)?.text || '', 'Code kopiert');
                        return;
                    }
                    if (b2.dataset.a === 'nr') {
                        Store.updateBlock(block.id, { zeilennr: !nrAn });
                        App.zeichneSeite();
                        return;
                    }
                    if (b2.dataset.a === 'um') {
                        Store.updateBlock(block.id, { zeilenUm: !block.zeilenUm });
                        App.zeichneSeite();
                    }
                });
                wrap.appendChild(sprache);
                wrap.appendChild(werk);
                if (nrAn)
                    wrap.appendChild(nummern);
                wrap.appendChild(ct);
                box.appendChild(wrap);
                break;
            }
            case 'equation':
                /* Zeigt die gesetzte Formel; ein Klick öffnet die Quelle. */
                box.appendChild(Zusatz.formelBlock(block));
                break;
            case 'image':
            case 'video':
            case 'audio':
            case 'file':
            case 'bookmark':
            case 'embed':
                box.appendChild(medienBlock(block));
                break;
            case 'toc':
                box.appendChild(inhaltsverzeichnis(block));
                break;
            case 'breadcrumb': {
                const d = document.createElement('div');
                d.className = 'ct';
                d.style.color = 'var(--text-dim)';
                d.style.fontSize = '14px';
                d.textContent = Store.pathOf(App.aktuelleSeite()).map(p => p.text || 'Ohne Titel').join(' / ');
                box.appendChild(d);
                break;
            }
            case 'page': {
                const a = document.createElement('div');
                a.className = 'ct';
                a.style.cssText = 'padding:4px 2px; cursor:pointer; font-weight:500; ' +
                    'display:flex; align-items:center; gap:8px';
                a.innerHTML = `<span style="font-size:18px">${block.icon || '📄'}</span>` +
                    `<span style="border-bottom:1px solid var(--line)">${esc(block.text || 'Ohne Titel')}</span>`;
                a.dataset.seite = block.id;
                a.addEventListener('click', () => App.oeffne(block.id));
                box.appendChild(a);
                break;
            }
            case 'database':
                box.appendChild(Datenbank.render(block));
                break;
            /* Verknüpfte Ansicht: zeigt eine Datenbank, die woanders lebt.
               Eigene Filter und Sortierung, dieselben Daten — wie in Notion. */
            case 'linkeddb': {
                const w = document.createElement('div');
                w.style.width = '100%';
                if (!block.collectionId || !Store.getCollection(block.collectionId)) {
                    const b2 = document.createElement('button');
                    b2.className = 'sy-waehl';
                    b2.textContent = '⧉ Welche Datenbank soll hier erscheinen?';
                    b2.addEventListener('click', () => datenbankWaehlen(block));
                    w.appendChild(b2);
                }
                else {
                    const hinweis = document.createElement('div');
                    hinweis.className = 'linked-kopf';
                    const c = Store.getCollection(block.collectionId);
                    hinweis.innerHTML = `⧉ Verknüpfte Ansicht von <b>${esc(c.name)}</b>` +
                        '<button data-a="andere">andere wählen</button>';
                    hinweis.addEventListener('click', e => {
                        if (elVon(e)?.closest('[data-a="andere"]'))
                            datenbankWaehlen(block);
                    });
                    w.appendChild(hinweis);
                    w.appendChild(Datenbank.render(block));
                }
                box.appendChild(w);
                break;
            }
            case 'columns':
            case 'columns3': {
                const w = document.createElement('div');
                const n = block.type === 'columns3' ? 3 : (block.spalten || 2);
                /* Die Spaltenzahl steht als Variable da, damit sie auf schmalen
                   Bildschirmen per CSS auf eine Spalte fallen kann — wie in Notion. */
                w.className = 'spalten-block';
                w.style.setProperty('--sp', n);
                Store.childrenOf(block.id).forEach((k) => w.appendChild(render(k, tiefe)));
                box.appendChild(w);
                break;
            }
            /* Eine SPALTE ist ein Behälter, kein Inhalt (E102). Vorher waren die
               Kinder eines Spaltenblocks selbst die Spalten — je Spalte genau ein
               Block. Wer rechts eine zweite Zeile anfing und Enter drückte, legte
               ein Geschwister an, und daraus wurde eine DRITTE SPALTE: gemessen
               wurden aus zwei drei und aus drei vier, die Seite zerfiel beim
               normalen Schreiben.
               Jetzt liegt die Spalte dazwischen — der Elternteil des Inhalts ist
               sie, ein Geschwister bleibt also IN ihr. */
            case 'spalte': {
                const w = document.createElement('div');
                w.className = 'spalte';
                const kinder = Store.childrenOf(block.id);
                if (!kinder.length) {
                    /* Eine leere Spalte wäre eine unsichtbare Fläche, in die man nicht
                       hineinkommt. Also immer eine Zeile zum Hineinschreiben. */
                    const leer = Store.addBlock(block.id, 'text', { text: '' });
                    w.appendChild(render(leer, tiefe));
                }
                else {
                    kinder.forEach((k) => w.appendChild(render(k, tiefe)));
                }
                box.appendChild(w);
                break;
            }
            /* --- Verweis auf eine andere Seite (Notion „Link to page", Trilium-Klon) */
            case 'pageref': {
                const ziel = block.ziel ? Store.getBlock(block.ziel) : null;
                const a = document.createElement('div');
                a.className = 'ct pageref';
                if (ziel) {
                    a.innerHTML = `<span style="font-size:17px">${ziel.icon || '📄'}</span>` +
                        `<span class="pr-t">${esc(ziel.text || 'Ohne Titel')}</span>` +
                        `<span class="pr-i" title="Verweis — die Seite liegt woanders">↗</span>`;
                    a.dataset.seite = ziel.id;
                    a.addEventListener('click', () => App.oeffne(ziel.id));
                }
                else {
                    a.innerHTML = '<span class="pr-i">↗</span><span style="color:var(--text-faint)">Seite auswählen …</span>';
                    a.addEventListener('click', () => seiteWaehlen(block));
                }
                box.appendChild(a);
                break;
            }
            /* --- Synchronisierter Block: zeigt den Inhalt einer anderen Stelle --- */
            case 'synced': {
                const quelle = block.quelle ? Store.getBlock(block.quelle) : null;
                const w = document.createElement('div');
                w.className = 'synced';
                if (!quelle) {
                    w.innerHTML = '<div class="sy-kopf">⇄ Synchronisierter Block</div>';
                    const b = document.createElement('button');
                    b.className = 'sy-waehl';
                    b.textContent = 'Quelle wählen …';
                    b.addEventListener('click', () => quelleWaehlen(block));
                    w.appendChild(b);
                }
                else if (block.quelle === block.id || quelleImInneren(quelle.id, block.id)) {
                    /* Ein Spiegel, der sich selbst enthält, würde endlos zeichnen. */
                    w.innerHTML = '<div class="sy-kopf sy-warn">⇄ Diese Quelle enthält den Spiegel selbst — ' +
                        'das würde sich endlos wiederholen.</div>';
                    const b = document.createElement('button');
                    b.className = 'sy-waehl';
                    b.textContent = 'Andere Quelle wählen …';
                    b.addEventListener('click', () => quelleWaehlen(block));
                    w.appendChild(b);
                }
                else {
                    const kopien = Object.values(Store.cache.blocks)
                        .filter(b2 => b2.type === 'synced' && b2.quelle === block.quelle && b2.alive).length;
                    w.innerHTML =
                        `<div class="sy-kopf">⇄ synchron mit „${esc(quelle.text || 'Seite')}"` +
                            `<span class="sy-zahl" title="So viele Stellen zeigen denselben Inhalt">${kopien} ×</span>` +
                            '<button data-a="sy-quelle" title="Zur Quelle springen">↗</button>' +
                            '<button data-a="sy-neu" title="Andere Quelle wählen">⇄</button>' +
                            '<button data-a="sy-los" title="Verbindung lösen — der Inhalt bleibt als eigene Kopie">⛓</button>' +
                            '</div>';
                    Store.childrenOf(quelle.id).forEach((k) => w.appendChild(render(k, tiefe + 1)));
                    w.querySelector('.sy-kopf')?.addEventListener('click', e => {
                        const b2 = elVon(e)?.closest('button[data-a]');
                        if (!b2)
                            return;
                        if (b2.dataset.a === 'sy-quelle') {
                            App.oeffne(quelle.type === 'page' ? quelle.id : quelle.parentId);
                            return;
                        }
                        if (b2.dataset.a === 'sy-neu') {
                            quelleWaehlen(block);
                            return;
                        }
                        if (b2.dataset.a === 'sy-los') {
                            /* Inhalt echt kopieren, danach ist es ein normaler Absatzblock. */
                            const eltern = block.parentId;
                            const nach = Store.childrenOf(eltern).findIndex((x) => x.id === block.id);
                            Store.childrenOf(quelle.id).forEach((k, i) => Store.baumEinfuegen(Store.baum(k.id), eltern, nach + 1 + i));
                            Store.trashBlock(block.id);
                            UI.toast('Verbindung gelöst — der Inhalt steht jetzt eigenständig hier');
                            App.zeichneSeite();
                        }
                    });
                }
                box.appendChild(w);
                break;
            }
            /* --- Knopf: legt Blöcke oder Datenbankzeilen an (Notions Button) ----- */
            case 'button': {
                const w = document.createElement('div');
                w.className = 'knopf-blk';
                const b = document.createElement('button');
                b.className = 'knopf';
                b.textContent = block.text || 'Neuer Knopf';
                b.addEventListener('click', () => knopfAusfuehren(block));
                const s = document.createElement('button');
                s.className = 'knopf-set';
                s.textContent = '⚙';
                s.title = 'Was soll der Knopf tun?';
                s.addEventListener('click', () => knopfEinstellen(block));
                w.append(b, s);
                box.appendChild(w);
                break;
            }
            case 'html': {
                const w = document.createElement('div');
                w.style.width = '100%';
                const ct = machText('<b>HTML</b> hier einfügen');
                ct.textContent = block.text || '';
                ct.style.cssText = 'font:13px var(--mono); background:var(--bg-card); padding:10px 12px; border-radius:6px';
                const vorschau = document.createElement('div');
                vorschau.className = 'html-vorschau';
                vorschau.innerHTML = block.text || '';
                w.append(ct, vorschau);
                box.appendChild(w);
                break;
            }
            /* `tabelle` IST EINE ALTE SCHREIBWEISE, kein zweiter Block.
               „+ Neu → Neue Tabelle" legte seit E45 einen Block dieser Art an,
               und gezeichnet hat ihn nie jemand — gemessen 24 px, Inhalt „+⋮⋮".
               Der Weg legt jetzt eine Kalkulationstabelle an; wer aber schon
               einmal darauf getippt hat, hat so einen Block im Bestand.
      
               Er ist immer LEER, denn ohne Zeichnung konnte niemand etwas
               hineinschreiben — deshalb genügt es, ihn wie eine einfache Tabelle
               zu zeichnen. Nichts geht verloren (§46), und niemand muss Daten
               wandern lassen (§9). Die Zeile hier ist billiger als jede
               Migration und sagt dasselbe. */
            case 'tabelle':
            case 'table':
                box.appendChild(Zusatz.tabelle(block));
                break;
            /* Die Kalkulationstabelle. Sie zeichnet sich selbst und rechnet mit
               `core/spreadsheet` — der Editor weiss davon nichts weiter, als dass
               er sie einhaengt. */
            case 'spreadsheet':
                if (typeof SpreadsheetView !== 'undefined')
                    box.appendChild(SpreadsheetView.zeichne(block));
                break;
            /* Das A4-Blatt bringt seinen Text als eigene Kinder mit und zeichnet
               sie selbst — deshalb steht es hier und nicht in der Kinderliste
               weiter unten (E100). */
            case 'blatt':
                box.appendChild(Blatt.zeichne(block));
                break;
            /* Eine PDF-Seite: Bild unten, Zeichenschicht darüber (E103). */
            case 'pdfseite':
                box.appendChild(PdfSeite.zeichne(block));
                break;
            case 'whiteboard':
                box.appendChild(Zusatz.whiteboard(block));
                break;
            /* Ein Schaltplan: Symbolpalette links, Zeichenfläche rechts (Punkt 11). */
            case 'schaltplan':
                box.appendChild(Planflaeche.zeichne(block));
                break;
            case 'chart':
                box.appendChild(Zusatz.diagramm(block));
                break;
            case 'flashcard': {
                const w = document.createElement('div');
                w.className = 'fkarte';
                const [vorn, hinten] = Werkzeuge.teileKarte(block);
                const faellig = !block.sr || !block.sr.faellig || new Date(block.sr.faellig) <= new Date();
                w.innerHTML = `<div class="fk-kopf">🎴 Karteikarte` +
                    `<span class="fk-status">${faellig ? 'fällig' : 'nächste Wiederholung ' +
                        new Date(block.sr.faellig).toLocaleDateString('de-DE')}</span></div>`;
                const ct = machText('Frage :: Antwort');
                w.appendChild(ct);
                const vor = document.createElement('div');
                vor.className = 'fk-vor';
                /* Eine Karte kann ein BILD auf der Vorderseite tragen — so entsteht sie
                   aus einem Ausschnitt einer PDF-Seite (Punkt 43). `inline()` kann
                   keine Bilder (nachgesehen, nicht vermutet), also steht das Bild
                   ausdrücklich hier und nicht im Text. Es liegt als gewöhnlicher
                   Anhang und kommt damit in `.redion` mit. */
                if (block.bildId && typeof Dateien !== 'undefined') {
                    const bild = document.createElement('img');
                    bild.className = 'fk-bild';
                    bild.alt = 'Ausschnitt auf der Vorderseite';
                    bild.decoding = 'async';
                    const bekannt = Dateien.adresseBekannt ? Dateien.adresseBekannt(block.bildId) : null;
                    if (bekannt)
                        bild.src = bekannt;
                    else
                        Dateien.adresse(block.bildId)
                            .then((u) => { if (u)
                            bild.src = u; })
                            .catch(() => { bild.replaceWith(document.createTextNode('Der Ausschnitt fehlt.')); });
                    vor.appendChild(bild);
                }
                const zeilen = document.createElement('div');
                zeilen.className = 'fk-zeilen';
                zeilen.innerHTML = `<b>${inline(vorn)}</b><span>${inline(hinten)}</span>`;
                vor.appendChild(zeilen);
                w.appendChild(vor);
                box.appendChild(w);
                break;
            }
            case 'backlinks': {
                const d = document.createElement('div');
                d.style.width = '100%';
                const seite2 = Store.getBlock(App.aktuelleSeite());
                if (seite2)
                    Links.fusszeile(seite2, d);
                if (!d.children.length) {
                    d.innerHTML = '<div style="color:var(--text-faint); font-size:14px">' +
                        'Noch zeigt keine Seite hierher. Schreibe auf einer anderen Seite ' +
                        '<code>[[' + esc(seite2 ? (seite2.text || 'Titel') : 'Titel') + ']]</code>.</div>';
                }
                box.appendChild(d);
                break;
            }
            case 'h1':
            case 'h2':
            case 'h3': {
                if (block.toggleKopf) {
                    const mk = document.createElement('div');
                    mk.className = 'mk kopf-mk';
                    mk.textContent = '▸';
                    mk.addEventListener('click', () => {
                        Store.updateBlock(block.id, { open: !block.open });
                        App.zeichneSeite();
                    });
                    box.appendChild(mk);
                    if (block.open)
                        el.classList.add('open');
                }
                box.appendChild(machText());
                break;
            }
            default:
                box.appendChild(machText());
        }
        /* Eine normale Notiz kann auf eine Sekunde in einem Audio-Block zeigen.
           Der Text bleibt editierbar; der kleine Knopf ist nur die Navigation. */
        if (block.audioRef && Number.isFinite(Number(block.audioRef.sek))) {
            const marke = document.createElement('button');
            marke.className = 'audio-ref-marke';
            const sek = Math.max(0, Math.round(Number(block.audioRef.sek) || 0));
            marke.textContent = '▶ ' + String(Math.floor(sek / 60)).padStart(2, '0') + ':' +
                String(sek % 60).padStart(2, '0');
            marke.title = 'Ton ab dieser Stelle abspielen';
            marke.style.cssText = 'flex:0 0 auto; margin:2px 4px; padding:3px 7px; ' +
                'border:1px solid var(--line); border-radius:999px; color:var(--accent); font-size:12px';
            marke.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                audioRefSpielen(block.audioRef).catch(err => UI.toast('Ton konnte nicht geöffnet werden: ' +
                    (err instanceof Error ? err.message : String(err))));
            });
            el.appendChild(marke);
        }
        /* --- Zurück zur Quelle (§44) ------------------------------------------
           Eine Lernkarte, eine Notiz, eine erkannte Zeile: alles, was aus etwas
           anderem entstanden ist, trägt seit E130/E129 einen `sourceRef` — mit
           Seite, Block, Seitenzahl und sogar dem Ausschnitt. Bis zum 25. August
           las das nur der Dokumentmodus, und zwar in die andere Richtung: „welche
           Karten gehören zu dieser PDF-Seite".
    
           Der Weg zurück fehlte. Wer eine Karte vor sich hatte, kam nicht zu der
           Stelle, aus der sie stammt — obwohl die Angabe im Block stand und
           `App.zeigeBlock` sie hätte anspringen können.
    
           Der Knopf sagt, wohin er führt: „PDF · Seite 14" statt „Quelle". Ein
           Ziel, das es nicht mehr gibt, wird gar nicht erst angeboten — ein
           Knopf, der nichts tut, ist schlimmer als keiner. */
        const quelle = block.sourceRef || block.lernquelle;
        if (quelle && (quelle.blockId || quelle.pageId)) {
            const zielId = String(quelle.blockId || quelle.pageId || '');
            const ziel = zielId ? Store.getBlock(zielId) : null;
            if (ziel && ziel.alive !== false) {
                const seite = quelle.pageId ? Store.getBlock(String(quelle.pageId)) : null;
                const nr = Number(quelle.pageNumber);
                const wohin = quelle.kind === 'pdfseite' && Number.isFinite(nr) && nr > 0
                    ? 'PDF · Seite ' + nr
                    : quelle.kind === 'blatt' ? 'A4-Blatt'
                        : String(seite?.text || quelle.label || 'Quelle');
                /* Und die Sekunde, wenn es eine gibt (§44, E161). `zeit` ist fertig
                   formatiert, weil der Editor `bereiche/verbinden` nicht kennen darf
                   (CLAUDE.md §5 Regel 1) — die Zahl daneben (`sek`) bleibt die
                   Wahrheit, der Text ist nur die Beschriftung. */
                const zeit = String(quelle.zeit || '').trim();
                const knopf = document.createElement('button');
                knopf.className = 'quell-marke';
                knopf.type = 'button';
                knopf.textContent = '↩ ' + wohin + (zeit ? ' · ' + zeit : '');
                knopf.title = 'Dorthin springen, woraus das hier entstanden ist' +
                    (zeit ? ' — bei ' + zeit : '') +
                    (quelle.region ? ' — der Ausschnitt wird hervorgehoben' : '');
                knopf.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    App.zeigeBlock(zielId);
                });
                el.appendChild(knopf);
            }
        }
        /* Kommentarmarke */
        if ((block.kommentare || []).length) {
            const k = document.createElement('button');
            k.className = 'komm-marke';
            const offen = block.kommentare.filter((x) => !x.erledigt).length;
            k.textContent = '💬' + (offen || '');
            k.title = block.kommentare.map((x) => x.text).join('\n');
            k.addEventListener('click', () => Kommentare.panel(App.aktuelleSeite()));
            el.appendChild(k);
        }
        /* Kindblöcke einer Toggle-Überschrift */
        if (block.toggleKopf && ['h1', 'h2', 'h3'].includes(block.type)) {
            const kids = document.createElement('div');
            kids.className = 'toggle-kids';
            kids.style.marginLeft = '24px';
            if (!block.open)
                kids.style.display = 'none';
            Store.childrenOf(block.id).forEach((k) => kids.appendChild(render(k, tiefe + 1)));
            const huelle = document.createElement('div');
            huelle.appendChild(el);
            huelle.appendChild(kids);
            return huelle;
        }
        /* Kindblöcke — bei Toggle in einen eigenen Container */
        if (['bullet', 'number', 'todo', 'quote', 'callout'].includes(block.type) && (block.content || []).length) {
            const kids = document.createElement('div');
            kids.style.marginLeft = '24px';
            Store.childrenOf(block.id).forEach((k) => kids.appendChild(render(k, tiefe + 1)));
            const huelle = document.createElement('div');
            huelle.appendChild(el);
            huelle.appendChild(kids);
            return huelle;
        }
        if (block.type === 'toggle') {
            const kids = document.createElement('div');
            kids.className = 'toggle-kids';
            kids.style.marginLeft = '24px';
            if (!block.open)
                kids.style.display = 'none';
            Store.childrenOf(block.id).forEach((k) => kids.appendChild(render(k, tiefe + 1)));
            const huelle = document.createElement('div');
            huelle.appendChild(el);
            huelle.appendChild(kids);
            return huelle;
        }
        return el;
    };
    /* --- Medienblöcke ------------------------------------------------------- */
    /** Steckt der Spiegelblock selbst irgendwo in der Quelle? Dann bricht es. */
    const quelleImInneren = (quelleId, blockId, tiefe = 0) => {
        if (tiefe > 8)
            return true;
        return Store.childrenOf(quelleId).some((k) => k.id === blockId ||
            (k.type === 'synced' && k.quelle === blockId) ||
            quelleImInneren(k.id, blockId, tiefe + 1));
    };
    /** Ein Bild gross ansehen — Klick schliesst wieder. */
    const bildGross = (src, text) => {
        const o = document.createElement('div');
        o.className = 'overlay bild-voll';
        o.innerHTML = `<img src="${esc(src)}" alt="">` +
            (text ? `<div class="bv-text">${esc(text)}</div>` : '');
        o.addEventListener('click', () => o.remove());
        document.addEventListener('keydown', function esc2(e) {
            if (e.key === 'Escape') {
                o.remove();
                document.removeEventListener('keydown', esc2);
            }
        });
        document.body.appendChild(o);
    };
    const medienBlock = (block) => {
        const w = document.createElement('div');
        w.style.width = '100%';
        /* ======================================================================
         * WOHER DIE ADRESSE KOMMT (E98)
         * ----------------------------------------------------------------------
         * Eine in Stücken abgelegte Datei liegt in `dateien`/`stuecke`. Ihre
         * `blob:`-Adresse gehört dem Dokument, das sie erzeugt hat — Browser zu,
         * Adresse tot. Sie wurde trotzdem IN DEN BLOCK geschrieben, und niemand
         * las `dateiId` je zurück: gemessen lagen nach einem Neustart alle fünf
         * Stücke unversehrt da, und das Bild hatte Breite 0.
         *
         * Also: die Adresse wird beim ZEICHNEN geholt, nie gespeichert. Ist sie
         * schon gebaut, kommt sie synchron; sonst wird sie nachgereicht. Eine
         * gespeicherte tote `blob:`-Adresse wird übergangen — sie ist schlechter
         * als gar keine, weil der Browser sonst ein kaputtes Bild zeigt.
         * ====================================================================*/
        const nachtragen = [];
        const ausAblage = () => {
            const gespeichert = String(block.src || '');
            if (!block.dateiId || typeof Dateien === 'undefined')
                return gespeichert;
            const schonDa = Dateien.adresseBekannt ? Dateien.adresseBekannt(block.dateiId) : null;
            if (schonDa)
                return schonDa;
            Dateien.adresse(block.dateiId)
                .then((u) => { if (u)
                nachtragen.forEach(f => f(u)); })
                .catch(() => { });
            return gespeichert.startsWith('blob:') ? '' : gespeichert;
        };
        const quelle = ausAblage();
        /* Ohne Quelle UND ohne Kennung gibt es nichts zu zeigen. Die Kennung
           allein genügt: die Adresse kommt gleich nach. */
        if (!block.src && !block.dateiId) {
            /* Noch keine Quelle: Eingabefeld anzeigen */
            const feld = document.createElement('div');
            feld.style.cssText = 'display:flex; gap:8px; padding:12px 14px; background:var(--bg-card); ' +
                'border-radius:6px; align-items:center';
            const d = block.dienst ? dienst(block.dienst) : null;
            const HINWEIS = {
                image: 'Bild-URL', video: 'Video-URL', audio: 'Audio-URL',
                file: 'Datei-URL', bookmark: 'Adresse der Webseite', embed: 'Einbettungs-URL'
            };
            const info = d ? d.hinweis : HINWEIS[block.type];
            feld.innerHTML = `<span style="font-size:16px">${d ? d.icon : typ(block.type).icon}</span>`;
            const inp = document.createElement('input');
            inp.placeholder = (d ? d.name + ': ' + info : info) + ' einfügen und Enter drücken';
            inp.style.cssText = 'flex:1; background:none; border:none; outline:none; font-size:14px';
            inp.addEventListener('keydown', e => {
                if (e.key === 'Enter' && inp.value.trim()) {
                    const roh = inp.value.trim();
                    Store.updateBlock(block.id, {
                        src: block.dienst ? einbettungsAdresse(block.dienst, roh) : roh,
                        quelle: roh
                    });
                    App.zeichneSeite();
                }
            });
            const datei = document.createElement('button');
            datei.textContent = 'Hochladen';
            datei.style.cssText = 'font-size:13px; color:var(--accent); padding:4px 8px; border-radius:5px';
            datei.addEventListener('click', () => hochladen(block));
            feld.appendChild(inp);
            feld.appendChild(datei);
            w.appendChild(feld);
            return w;
        }
        if (block.type === 'image') {
            /* Grösse und Ausrichtung — Notion kann nur ziehen, hier gibt es
               zusätzlich feste Stufen und eine Ausrichtung je Bild. */
            const rahmen = document.createElement('div');
            rahmen.className = 'bild-rahmen aus-' + (block.ausricht || 'links');
            const i = document.createElement('img');
            i.src = quelle;
            i.alt = block.caption || block.text || '';
            nachtragen.push(u => { i.src = u; });
            i.style.width = (block.breite || 100) + '%';
            i.addEventListener('click', () => bildGross(i.src || quelle, block.caption));
            rahmen.appendChild(i);
            const werk = document.createElement('div');
            werk.className = 'bild-werk';
            werk.innerHTML =
                [['25', 'S'], ['50', 'M'], ['75', 'L'], ['100', 'Voll']].map(([b2, n]) => `<button data-b="${b2}" class="${String(block.breite || 100) === b2 ? 'an' : ''}">${n}</button>`).join('') +
                    '<span class="bw-trenn"></span>' +
                    [['links', '⭰'], ['mitte', '⭤'], ['rechts', '⭲']].map(([a2, ic]) => `<button data-aus="${a2}" class="${(block.ausricht || 'links') === a2 ? 'an' : ''}">${ic}</button>`).join('') +
                    '<span class="bw-trenn"></span><button data-a="voll" title="Gross ansehen">⛶</button>' +
                    (block.dateiId ? '<button data-a="ocr" title="Text mit lokalem OCR-Dienst erkennen">⌁</button>' : '');
            werk.addEventListener('click', e => {
                const b2 = elVon(e)?.closest('button');
                if (!b2)
                    return;
                if (b2.dataset.b) {
                    Store.updateBlock(block.id, { breite: +b2.dataset.b });
                    App.zeichneSeite();
                    return;
                }
                if (b2.dataset.aus) {
                    Store.updateBlock(block.id, { ausricht: b2.dataset.aus });
                    App.zeichneSeite();
                    return;
                }
                if (b2.dataset.a === 'voll')
                    bildGross(i.src || quelle, block.caption);
                if (b2.dataset.a === 'ocr') {
                    const page = Links.seiteVon(block.id);
                    if (page && typeof Recognition !== 'undefined')
                        void Recognition.fromImageBlock(page, block);
                }
            });
            rahmen.appendChild(werk);
            /* Rechter Rand zum Ziehen */
            const griff = document.createElement('span');
            griff.className = 'bild-griff';
            griff.addEventListener('pointerdown', ev => {
                ev.preventDefault();
                const start = ev.clientX;
                const b0 = i.getBoundingClientRect().width;
                const ganz = rahmen.getBoundingClientRect().width || 1;
                const zug = (e2) => {
                    const proz = Math.max(10, Math.min(100, (b0 + (e2.clientX - start)) / ganz * 100));
                    i.style.width = proz + '%';
                };
                const stop = () => {
                    removeEventListener('pointermove', zug);
                    removeEventListener('pointerup', stop);
                    Store.updateBlock(block.id, { breite: Math.round(parseFloat(i.style.width)) });
                };
                addEventListener('pointermove', zug);
                addEventListener('pointerup', stop);
            });
            rahmen.appendChild(griff);
            w.appendChild(rahmen);
        }
        else if (block.type === 'video') {
            const v = document.createElement('video');
            v.src = quelle;
            v.controls = true;
            v.style.maxWidth = '100%';
            nachtragen.push(u => { v.src = u; });
            w.appendChild(v);
        }
        else if (block.type === 'audio') {
            const a = document.createElement('audio');
            if (quelle)
                a.src = quelle;
            a.controls = true;
            a.style.width = '100%';
            a.dataset.audioBlock = block.id;
            nachtragen.push(u => { a.src = u; });
            w.appendChild(a);
            if (block.caption || block.text) {
                const beschriftung = document.createElement('div');
                beschriftung.style.cssText = 'font-size:12px;color:var(--text-dim);padding:3px 2px';
                beschriftung.textContent = block.caption || block.text;
                w.appendChild(beschriftung);
            }
        }
        else if (block.type === 'file') {
            /* `istPdf` schaut nur auf die Endung — die entscheidet, ob eine Vorschau
               angeboten wird. Das genügt für die Frage „welches Symbol zeige ich",
               aber nicht als Erlaubnis, die Adresse in einen Rahmen zu setzen:
               `javascript:…//.pdf` besteht diese Prüfung. Deshalb geht jede Adresse
               hier durch Saeubern, und zwar durch die zum Ort passende. */
            /* Der NAME entscheidet mit: eine in Stücken abgelegte Datei hat ihre
               Adresse erst, wenn sie nachgereicht wurde — bis dahin steht dort
               nichts, wonach man die Endung fragen könnte (E98). */
            const dateiName = String(block.text || block.caption || '');
            const istPdf = /\.pdf(\?|$)/i.test(quelle) || /^data:application\/pdf/i.test(quelle)
                || /\.pdf$/i.test(dateiName)
                || String(block.typ || '') === 'application/pdf';
            const zielAdresse = Sanitize.attachmentUrl(quelle);
            const rahmenSrc = Sanitize.frameUrl(quelle);
            const zeile = document.createElement('div');
            zeile.className = 'datei-zeile';
            zeile.innerHTML =
                `<span>${istPdf ? '📕' : '📎'}</span>` +
                    (zielAdresse
                        ? `<a href="${esc(zielAdresse)}" target="_blank" rel="noopener" download>${esc(block.text || block.caption || (istPdf ? 'PDF' : 'Datei'))}</a>`
                        /* Kein stiller Fehlschlag: der Name bleibt stehen und sagt, warum
                           er nicht anklickbar ist. Wegwerfen tun wir hier nichts. */
                        /* Solange die Adresse noch kommt, ist der Name KEIN Fehler — nur
                           noch nicht anklickbar. Ein Warnzeichen hier wäre eine Lüge. */
                        : (block.dateiId
                            ? `<span class="datei-wartet">${esc(block.text || block.caption || 'Datei')}</span>`
                            : `<span class="datei-gesperrt" title="Diese Adresse öffnet Redion nicht — sie führt keinen Verweis aus, sondern Code.">${esc(block.text || block.caption || 'Datei')} ⚠</span>`)) +
                    (istPdf && rahmenSrc ? `<button data-a="pdf">${block.pdfAuf ? 'Vorschau zu' : 'Vorschau'}</button>` : '');
            zeile.addEventListener('click', e => {
                if (!elVon(e)?.closest('[data-a="pdf"]'))
                    return;
                Store.updateBlock(block.id, { pdfAuf: !block.pdfAuf });
                App.zeichneSeite();
            });
            w.appendChild(zeile);
            /* Kommt die Adresse nach, wird der Verweis nachgezogen — statt die
               ganze Seite neu zu zeichnen und dabei den Schreibzeiger zu verlieren. */
            nachtragen.push(u => {
                const sicher = Sanitize.attachmentUrl(u);
                if (!sicher)
                    return;
                const wartet = zeile.querySelector('.datei-wartet');
                if (wartet) {
                    const a2 = document.createElement('a');
                    a2.href = sicher;
                    a2.target = '_blank';
                    a2.rel = 'noopener';
                    a2.setAttribute('download', '');
                    a2.textContent = wartet.textContent || 'Datei';
                    wartet.replaceWith(a2);
                }
                else {
                    const a2 = zeile.querySelector('a[href]');
                    if (a2)
                        a2.href = sicher;
                }
                const rahmen2 = w.querySelector('.pdf-rahmen iframe');
                const frameU = Sanitize.frameUrl(u);
                if (rahmen2 && frameU)
                    rahmen2.src = frameU;
            });
            /* PDF gleich hier ansehen — Notion zeigt nur einen Anhang zum Laden. */
            if (istPdf && rahmenSrc && block.pdfAuf) {
                const rahmen = document.createElement('div');
                rahmen.className = 'pdf-rahmen';
                const f = document.createElement('iframe');
                f.src = rahmenSrc;
                f.title = block.text || 'PDF';
                rahmen.appendChild(f);
                const fuss = document.createElement('div');
                fuss.className = 'pdf-fuss';
                fuss.innerHTML = '<button data-h="420">klein</button><button data-h="700">gross</button>' +
                    `<a href="${esc(zielAdresse || '')}" target="_blank" rel="noopener">In neuem Fenster ↗</a>`;
                fuss.addEventListener('click', e => {
                    const b2 = elVon(e)?.closest('button[data-h]');
                    if (!b2)
                        return;
                    Store.updateBlock(block.id, { pdfHoehe: Number(b2.dataset.h) });
                    App.zeichneSeite();
                });
                rahmen.style.height = (block.pdfHoehe || 420) + 'px';
                w.appendChild(rahmen);
                w.appendChild(fuss);
            }
        }
        else if (block.type === 'bookmark') {
            /* Ein Lesezeichen wird angeklickt — also die Anhang-Regel. Die Adresse
               BLEIBT unter dem Titel lesbar, auch wenn sie gesperrt ist: sonst wäre
               der Block leer und niemand wüsste, was dort einmal stand. */
            const ziel = Sanitize.attachmentUrl(block.src);
            const a = document.createElement(ziel ? 'a' : 'div');
            if (ziel) {
                a.href = ziel;
                a.target = '_blank';
                a.rel = 'noopener';
            }
            else
                a.title = 'Diese Adresse öffnet Redion nicht — sie führt keinen Verweis aus, sondern Code.';
            a.style.cssText = 'display:block; padding:14px 16px; border:1px solid var(--line); ' +
                'border-radius:6px; color:var(--text); text-decoration:none';
            let host = block.src;
            try {
                host = new URL(block.src).hostname.replace('www.', '');
            }
            catch { }
            a.innerHTML = `<div style="font-weight:500; margin-bottom:3px">${esc(block.text || host)}${ziel ? '' : ' ⚠'}</div>` +
                `<div style="font-size:12.5px; color:var(--text-dim)">${esc(block.src)}</div>`;
            w.appendChild(a);
        }
        else if (block.type === 'embed') {
            /* Der Rahmen läuft im Ursprung dieser Seite. Hier gilt die strenge
               Regel: http(s), blob: oder ein PDF — sonst gar kein Rahmen. */
            const rahmenSrc = Sanitize.frameUrl(block.src);
            if (rahmenSrc) {
                const f = document.createElement('iframe');
                f.src = rahmenSrc;
                f.setAttribute('allowfullscreen', '');
                f.setAttribute('referrerpolicy', 'no-referrer');
                w.appendChild(f);
            }
            else {
                const hinweis = document.createElement('div');
                hinweis.className = 'einbett-gesperrt';
                hinweis.textContent = 'Diese Einbettung wird nicht geöffnet: ' +
                    (block.src ? String(block.src).slice(0, 120) : '(ohne Adresse)') +
                    ' — ein Rahmen läuft im Ursprung dieser Seite, deshalb kommen dort nur ' +
                    'Web-Adressen hinein.';
                w.appendChild(hinweis);
            }
            /* Manche Seiten verbieten den Rahmen. Dann hilft der Weg zum Original. */
            const q = Sanitize.attachmentUrl(block.quelle || block.src);
            const zeile = document.createElement('div');
            zeile.style.cssText = 'font-size:12px; color:var(--text-dim); padding:3px 2px';
            zeile.innerHTML = (block.dienst ? esc(dienst(block.dienst)?.name || '') + ' · ' : '') +
                (q ? `<a href="${esc(q)}" target="_blank" rel="noopener" style="color:var(--text-dim)">` +
                    'Original öffnen ↗</a>'
                    : '<span>kein Verweis zum Original</span>');
            w.appendChild(zeile);
        }
        /* Beschriftung */
        const cap = document.createElement('div');
        cap.className = 'ct';
        cap.contentEditable = 'true';
        cap.dataset.ph = 'Beschriftung hinzufügen';
        cap.style.cssText = 'font-size:13px; color:var(--text-dim); padding:5px 2px';
        cap.textContent = block.caption || '';
        cap.addEventListener('input', () => Store.updateBlock(block.id, { caption: cap.textContent }));
        w.appendChild(cap);
        return w;
    };
    /** Datei einlesen und als Data-URL speichern — bleibt damit lokal. */
    const hochladen = (block) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = { image: 'image/*', video: 'video/*', audio: 'audio/*' }[block.type] || '*/*';
        inp.addEventListener('change', async () => {
            const f = inp.files?.[0];
            if (!f)
                return;
            /* --- Grosse Dateien gehen in Stücken --------------------------------
             * Bis 12 MB war früher Schluss, weil eine Data-URL vollständig im
             * Arbeitsspeicher liegt und beim Kodieren um ein Drittel wächst. In
             * Stücken abgelegt geht es bis 500 MB — und der Block trägt dann nur
             * noch die Kennung, nicht die Datei selbst.
             * ------------------------------------------------------------------ */
            if (typeof Dateien !== 'undefined' && Dateien.lohntSich(f.size)) {
                if (f.size > Dateien.GRENZE) {
                    UI.toast('Die Datei ist grösser als ' +
                        Dateien.groesseText(Dateien.GRENZE) + '. So viel hält der Browser nicht.');
                    return;
                }
                const melder = UI.toast('Wird abgelegt … 0 %', 60000);
                try {
                    const satz = await Dateien.ablegen(f, { blockId: block.id,
                        beiFortschritt: (anteil) => {
                            if (melder && melder.textContent !== undefined)
                                melder.textContent = 'Wird abgelegt … ' + Math.round(anteil * 100) + ' %';
                        } });
                    /* NUR die Kennung. Die blob-Adresse gilt nur für diese Sitzung und
                       hat in den Daten nichts verloren (E98) — gespeichert war sie der
                       Grund, warum jede grosse Datei nach dem Neustart unerreichbar war. */
                    await Dateien.adresse(satz.id); /* baut sie für JETZT auf */
                    Store.updateBlock(block.id, { dateiId: satz.id, text: f.name, typ: f.type });
                    if (melder && melder.remove)
                        melder.remove();
                    App.zeichneSeite();
                    UI.toast('„' + f.name + '" abgelegt (' + Dateien.groesseText(f.size) +
                        ' in ' + satz.teile + ' Stücken)');
                }
                catch (e) {
                    if (melder && melder.remove)
                        melder.remove();
                    UI.toast('Ging nicht: ' + (e instanceof Error ? e.message : String(e)));
                }
                return;
            }
            /* Kleine Dateien gehen weiter den kurzen Weg — für ein Bild von 40 KB
               wäre der Apparat oben Unfug. */
            const r = new FileReader();
            r.onload = () => {
                Store.updateBlock(block.id, { src: r.result, text: f.name });
                App.zeichneSeite();
                UI.toast('Datei lokal gespeichert');
            };
            r.readAsDataURL(f);
        });
        inp.click();
    };
    /* --- Inhaltsverzeichnis ------------------------------------------------- */
    /* Inhaltsverzeichnis — Redion sucht die Überschriften auf der ganzen Seite,
       also auch in Toggles, Spalten und Callouts, nimmt Toggle-Überschriften mit,
       kann durchnummerieren und hebt hervor, wo man gerade steht. Notions
       Verzeichnis kennt nur die oberste Ebene. */
    /* Aus dem Register, nicht abgeschrieben. Hier stand dieselbe Liste, die
       `schale/aufbau/inhaltsflaeche.ts` ein zweites Mal führte — dort ohne
       die Toggle-Überschriften. Eine Seite aus Toggle-Überschriften bekam
       deshalb hier Einträge und im Gliederungsstreifen keine. */
    const TOC_STUFEN = (typeof Register !== 'undefined' && Register.bloecke?.ueberschriften)
        ? Register.bloecke.ueberschriften()
        : { h1: 1, h2: 2, h3: 3, 'toggle-h1': 1, 'toggle-h2': 2, 'toggle-h3': 3 };
    const ueberschriftenDerSeite = (seitenId) => {
        const gefunden = [];
        const lauf = (id, tiefe) => {
            if (tiefe > 6)
                return;
            Store.childrenOf(id).forEach((k) => {
                if (k.type === 'page')
                    return; /* Unterseiten haben ihr eigenes */
                const stufe2 = TOC_STUFEN[k.type];
                if (stufe2)
                    gefunden.push({ block: k, stufe: stufe2 });
                if (['toggle', 'toggle-h1', 'toggle-h2', 'toggle-h3', 'callout', 'columns', 'columns3',
                    'column', 'quote'].includes(k.type) || k.type === 'spalte')
                    lauf(k.id, tiefe + 1);
            });
        };
        lauf(seitenId, 0);
        return gefunden;
    };
    const inhaltsverzeichnis = (block) => {
        const d = document.createElement('div');
        d.className = 'ct toc-liste';
        const seite = Store.getBlock(block.parentId);
        const liste = seite ? ueberschriftenDerSeite(seite.id) : [];
        const nummern = block.tocNummern === true;
        if (!liste.length) {
            d.innerHTML = '<span style="color:var(--text-faint); font-size:14px">' +
                'Noch keine Überschriften auf dieser Seite</span>';
            return d;
        }
        const zaehler = [0, 0, 0];
        liste.forEach(({ block: k, stufe }) => {
            const a = document.createElement('a');
            a.className = 'lvl' + stufe;
            a.dataset.ziel = k.id;
            let text = k.text || 'Ohne Titel';
            if (nummern) {
                zaehler[stufe - 1] = (zaehler[stufe - 1] ?? 0) + 1;
                for (let i = stufe; i < 3; i++)
                    zaehler[i] = 0;
                text = zaehler.slice(0, stufe).join('.') + '  ' + text;
            }
            a.textContent = text;
            a.addEventListener('click', () => {
                const ziel = document.querySelector(`[data-bid="${k.id}"]`);
                if (ziel) {
                    ziel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    ziel.classList.add('hebe-hervor');
                    setTimeout(() => ziel.classList.remove('hebe-hervor'), 1400);
                }
            });
            d.appendChild(a);
        });
        const zeile = document.createElement('div');
        zeile.className = 'toc-fuss';
        zeile.innerHTML = `<button data-a="nr">${nummern ? '✓ ' : ''}Nummerieren</button>` +
            `<span>${liste.length} Überschriften</span>`;
        zeile.addEventListener('click', e => {
            if (!elVon(e)?.closest('[data-a="nr"]'))
                return;
            Store.updateBlock(block.id, { tocNummern: !nummern });
            App.zeichneSeite();
        });
        d.appendChild(zeile);
        /* Mitlaufende Markierung: welche Überschrift steht gerade oben? */
        setTimeout(() => {
            const scroller = d.closest('#main') || document.querySelector('#main') || window;
            const merken = () => {
                if (!document.body.contains(d)) {
                    (scroller.removeEventListener || window.removeEventListener).call(scroller, 'scroll', merken);
                    return;
                }
                let aktiv = null;
                liste.forEach(({ block: k }) => {
                    const el = document.querySelector(`[data-bid="${k.id}"]`);
                    if (el && el.getBoundingClientRect().top < 140)
                        aktiv = k.id;
                });
                d.querySelectorAll('a').forEach(a => a.classList.toggle('jetzt', a.dataset.ziel === aktiv));
            };
            (scroller.addEventListener || window.addEventListener).call(scroller, 'scroll', merken, { passive: true });
            merken();
        }, 0);
        return d;
    };
    /* ========================================================================
     * TASTATUR
     * ------------------------------------------------------------------------
     * Hier steckt das Verhalten, das den Editor ausmacht.
     * ======================================================================*/
    const bindeEditor = (wurzel) => {
        /* --- Tippen: Text sichern und Markdown-Kürzel prüfen ----------------- */
        wurzel.addEventListener('input', (e) => {
            const ct = elVon(e)?.closest('.ct');
            if (!ct)
                return;
            const blk = ct.closest('.blk');
            if (!blk)
                return;
            const b = Store.getBlock(blk.dataset.bid);
            if (!b)
                return;
            const roh = ct.textContent;
            /* Markdown-Kürzel: nur am Zeilenanfang, nur einmal */
            if (b.type === 'text' && /\s$/.test(roh)) {
                const wort = roh.trim();
                const treffer = TYPEN.find((t) => {
                    if (!t.md)
                        return false;
                    const liste = Array.isArray(t.md) ? t.md : [t.md];
                    return liste.includes(wort);
                });
                if (treffer) {
                    /* Auch im Block löschen, nicht nur im Feld. Der vorige Tastendruck
                       hat „#" längst gespeichert; `umwandeln` zeichnet gleich neu und
                       holt es zurück. Genau das ist jahrelang passiert: aus „# Titel"
                       wurde eine Überschrift, die „#Titel" hiess. Kein Prüflauf sah es,
                       weil alle nur den TYP verglichen haben. */
                    ct.textContent = '';
                    Store.updateBlock(b.id, { text: '' });
                    umwandeln(b.id, treffer.id);
                    /* Zwei Kürzel sagen mehr als nur den Typ: „[x] " hakt gleich ab.
                       Nach umwandeln() ist die Seite neu gezeichnet, der Block aber
                       derselbe — deshalb reicht ein zweiter, kleiner Schreibvorgang. */
                    if (treffer.id === 'todo' && /^\[[xX]\]$/.test(wort)) {
                        Store.updateBlock(b.id, { checked: true });
                        App.zeichneSeite(b.id, 'ende');
                    }
                    return;
                }
                /* ```sprache — der Codeblock nimmt die Sprache gleich mit.
                   Das geht über keine Liste im Register: die Sprache ist frei. */
                const zaun = /^```([a-zA-Z0-9+#.-]{1,20})$/.exec(wort);
                if (zaun) {
                    ct.textContent = '';
                    Store.updateBlock(b.id, { text: '' });
                    umwandeln(b.id, 'code');
                    Store.updateBlock(b.id, { lang: sprachName(zaun[1] ?? '') });
                    App.zeichneSeite(b.id, 'ende');
                    return;
                }
            }
            Store.updateBlock(b.id, { text: roh });
            if (b.type === 'toc')
                return;
        });
        /* --- Einfügen: Markdown wird wieder zu Blöcken ------------------------
           Strg C schreibt die Auswahl als Markdown. Zurück ging es nicht — der
           ganze Text landete in einem einzigen Block, samt Rautezeichen. */
        wurzel.addEventListener('paste', (e) => {
            if (e.defaultPrevented)
                return; /* Tabelle und Kalkulation zuerst */
            const ct = elVon(e)?.closest('.ct');
            if (!ct)
                return;
            const blk = ct.closest('.blk');
            if (!blk)
                return;
            const b = Store.getBlock(blk.dataset.bid);
            if (!b)
                return;
            const text = e.clipboardData?.getData('text/plain');
            if (!text)
                return;
            /* Eine Webadresse über markiertem Text legt den Link DARÜBER,
               statt den lesbaren Text durch die Adresse zu ersetzen. Die
               Kürzelreferenz versprach diesen Notion-Weg bereits, der allgemeine
               Paste-Griff kannte ihn aber nicht. In Rohtextblöcken bleibt eine
               Adresse wörtlicher Inhalt. */
            const ROHTEXT = ['code', 'equation', 'html', 'flashcard'];
            const markiert = getSelection()?.toString() ?? '';
            let webAdresse = false;
            try {
                const u = new URL(text.trim());
                webAdresse = u.protocol === 'http:' || u.protocol === 'https:';
            }
            catch { /* Gewöhnlicher Text, kein Link. */ }
            if (markiert && webAdresse && !ROHTEXT.includes(b.type) &&
                typeof Auswahl !== 'undefined' && Auswahl.linkSetzen) {
                e.preventDefault();
                if (Auswahl.linkSetzen(text.trim()))
                    return;
            }
            /* Wo roher Text der Inhalt IST, wird kein Markdown gelesen. In einem
               Codeblock ist „# hallo" eine Kommentarzeile, in einer Formel steht
               TeX, und im HTML-Block steht HTML. Alles andere darf gliedern —
               auch ein Listenpunkt: wer eine Liste in eine Liste einfügt, will
               Punkte und keinen Absatz mit Bindestrichen darin. */
            const strukturiert = !ROHTEXT.includes(b.type) && mdIstStruktur(text);
            /* Immer selbst einsetzen: sonst legt der Browser das mitkopierte HTML
               mit all seinen Stilen in den Block, und beim nächsten Zeichnen ist
               es wieder weg — Text, der vor den Augen des Nutzers verschwindet. */
            e.preventDefault();
            if (!strukturiert) {
                document.execCommand('insertText', false, text);
                return;
            }
            const eltern = Store.getBlock(b.parentId);
            if (!eltern) {
                document.execCommand('insertText', false, text);
                return;
            }
            const teile = mdLesen(text);
            const letzte = mdEinsetzen(teile, b.parentId, eltern.content.indexOf(b.id) + 1);
            /* Der leere Block, in dem eingefügt wurde, hat seinen Zweck erfüllt —
               ob er ein Absatz war oder ein leerer Listenpunkt. */
            if (!ct.textContent.trim()) {
                Store.trashBlock(b.id);
                Store.purgeBlock(b.id);
            }
            App.zeichneSeite(letzte || b.id, 'ende');
            if (teile.length > 1)
                UI.toast(teile.length + ' Blöcke eingefügt');
        });
        /* --- Vorschlagsmodus -------------------------------------------------
           Ist er für die Seite an, wird beim Verlassen eines Blocks festgehalten,
           was vorher darinstand — daraus wird ein Vorschlag zum Annehmen oder
           Verwerfen. Ohne den Modus kostet das nichts: zwei Zeilen Vergleich. */
        wurzel.addEventListener('focusin', (e) => {
            const ct = elVon(e)?.closest('.ct');
            if (ct)
                ct.dataset.vorAlt = ct.textContent;
        });
        wurzel.addEventListener('focusout', (e) => {
            const ct = elVon(e)?.closest('.ct');
            if (!ct || ct.dataset.vorAlt === undefined)
                return;
            const alt = ct.dataset.vorAlt;
            const neu = ct.textContent;
            delete ct.dataset.vorAlt;
            if (alt === neu)
                return;
            const seite = Store.getBlock(App.aktuelleSeite());
            if (!seite || !seite.vorschlagModus)
                return;
            const bid = ct.closest('.blk')?.dataset.bid;
            if (!bid)
                return;
            const liste = [...(seite.vorschlaege || [])];
            /* Mehrfaches Tippen im selben Block bleibt ein Vorschlag */
            const schon = liste.findIndex(v => v.bid === bid);
            if (schon >= 0)
                liste[schon] = { ...liste[schon], neu, wann: Store.now() };
            else
                liste.push({ bid, alt, neu, von: (Konten.aktiv() || {}).name || 'Ich', wann: Store.now() });
            Store.updateBlock(seite.id, { vorschlaege: liste });
        });
        /* --- Tasten ---------------------------------------------------------- */
        wurzel.addEventListener('keydown', (e) => {
            const ct = elVon(e)?.closest('.ct');
            if (!ct)
                return;
            const blk = ct.closest('.blk');
            if (!blk)
                return;
            const b = Store.getBlock(blk.dataset.bid);
            if (!b)
                return;
            /* Slash-Menü öffnen */
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                setTimeout(() => slashMenue(ct, b), 0);
                return;
            }
            /* Enter — Strg + Enter hat eine eigene Bedeutung, siehe weiter unten */
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                /* Im Codeblock erzeugt Enter einen Zeilenumbruch */
                if (b.type === 'code')
                    return;
                e.preventDefault();
                /* Leerer Listenpunkt: zurück zu normalem Text */
                if (['bullet', 'number', 'todo', 'toggle', 'quote'].includes(b.type) && !ct.textContent.trim()) {
                    umwandeln(b.id, 'text');
                    return;
                }
                /* Neuen Block gleichen Typs darunter */
                const folge = ['bullet', 'number', 'todo'].includes(b.type) ? b.type : 'text';
                const eltern = Store.getBlock(b.parentId);
                const idx = eltern ? eltern.content.indexOf(b.id) + 1 : -1;
                const neu = Store.addBlock(b.parentId, folge, {}, idx);
                App.zeichneSeite(neu.id);
                return;
            }
            /* Backspace am Anfang */
            if (e.key === 'Backspace' && amAnfang(ct)) {
                if (b.type !== 'text') {
                    /* Erst den Typ zurücksetzen, wie in Notion */
                    e.preventDefault();
                    umwandeln(b.id, 'text');
                    return;
                }
                /* Leerer Textblock: löschen und zum vorherigen springen */
                if (!ct.textContent) {
                    e.preventDefault();
                    const eltern = Store.getBlock(b.parentId);
                    if (!eltern)
                        return;
                    const idx = eltern.content.indexOf(b.id);
                    if (idx <= 0)
                        return;
                    const vorher = Store.getBlock(eltern.content[idx - 1]);
                    Store.trashBlock(b.id);
                    Store.purgeBlock(b.id);
                    App.zeichneSeite(vorher ? vorher.id : null, 'ende');
                    return;
                }
            }
            /* Tab: einrücken */
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey)
                    ausruecken(b);
                else
                    einruecken(b);
                return;
            }
            /* Pfeil hoch/runter zwischen Blöcken */
            if (e.key === 'ArrowUp' && amAnfang(ct)) {
                const alle = [...wurzel.querySelectorAll('.ct')];
                const i = alle.indexOf(ct);
                if (i > 0) {
                    e.preventDefault();
                    cursorAnsEnde(alle[i - 1]);
                }
                return;
            }
            if (e.key === 'ArrowDown' && amEnde(ct)) {
                const alle = [...wurzel.querySelectorAll('.ct')];
                const i = alle.indexOf(ct);
                if (i >= 0 && i < alle.length - 1) {
                    e.preventDefault();
                    alle[i + 1].focus();
                }
                return;
            }
            /* Strg+Shift+Pfeil: Block verschieben */
            if (e.ctrlKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                verschiebe(b, e.key === 'ArrowUp' ? -1 : 1);
                return;
            }
            /* Blocktyp wechseln.
               Notion belegt das auf Windows mit Strg+Umschalt+Ziffer und auf dem
               Mac mit Cmd+Wahl+Ziffer. Hier gehen beide — und weil Umschalt+Ziffer
               auf deutschen Tastaturen ein Sonderzeichen liefert (Umschalt+1 = !),
               wird auch e.code ausgewertet. */
            const zifferAus = (ev) => {
                if (/^[0-9]$/.test(ev.key))
                    return ev.key;
                const m = /^Digit([0-9])$/.exec(ev.code || '');
                return m ? m[1] : null;
            };
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && zifferAus(e)) {
                e.preventDefault();
                const ziel = ZIFFER_TYP()[zifferAus(e) ?? ''];
                if (ziel === 'page') {
                    const p = Store.addPage(App.aktuelleSeite(), { text: ct.textContent });
                    Store.trashBlock(b.id);
                    App.zeichneSeite();
                    App.oeffne(p.id);
                }
                else if (ziel)
                    umwandeln(b.id, ziel);
                return;
            }
            /* Strg+Umschalt+E: Formelblock — wie in Notion */
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
                e.preventDefault();
                umwandeln(b.id, 'equation');
                return;
            }
            /* Strg+Alt+T: alle Toggles auf dieser Seite auf- oder zuklappen */
            if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 't') {
                e.preventDefault();
                alleToggles();
                return;
            }
            /* Strg+/: den Blocktyp dieses Blocks ändern — Notions „Blöcke bearbeiten" */
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                const griff = document.querySelector(`.blk[data-bid="${b.id}"] .handles button[data-act="menu"]`);
                if (griff) {
                    blockMenue(griff, b);
                    setTimeout(() => document.querySelector('.menu button[data-a="turn"]')?.click(), 0);
                }
                return;
            }
            /* Strg+Alt+Ziffer: Blocktyp wechseln (Mac-Belegung) */
            if ((e.ctrlKey || e.metaKey) && e.altKey && /^[0-9]$/.test(e.key)) {
                e.preventDefault();
                const ziel = ZIFFER_TYP()[e.key];
                if (ziel === 'page') {
                    const p = Store.addPage(App.aktuelleSeite(), { text: ct.textContent });
                    Store.trashBlock(b.id);
                    App.zeichneSeite();
                    App.oeffne(p.id);
                }
                else if (ziel)
                    umwandeln(b.id, ziel);
                return;
            }
            /* Strg + Enter: abhaken, auf- und zuklappen, Seite öffnen */
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (b.type === 'todo') {
                    Store.updateBlock(b.id, { checked: !b.checked });
                    App.zeichneSeite(b.id, 'ende');
                }
                else if (b.type === 'toggle' || b.toggleKopf) {
                    Store.updateBlock(b.id, { open: !b.open });
                    App.zeichneSeite(b.id, 'ende');
                }
                else if (b.type === 'page')
                    App.oeffne(b.id);
                else if (b.type === 'pageref' && b.ziel)
                    App.oeffne(b.ziel);
                return;
            }
            /* Strg + Shift + M: Kommentar am Block */
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                Kommentare.neu(b, getSelection()?.toString() ?? '');
                return;
            }
            /* --- Zum ersten und zum letzten Block der Seite --------------------
             * Notion springt mit Strg+Pos1 an den Anfang des Dokuments. Ohne das
             * scrollt man bei einer langen Seite mit dem Rad, obwohl die Hand
             * schon auf der Tastatur liegt.
             * ------------------------------------------------------------------ */
            if ((e.ctrlKey || e.metaKey) && (e.key === 'Home' || e.key === 'End')) {
                const alle = [...wurzel.querySelectorAll('.ct')];
                if (!alle.length)
                    return;
                e.preventDefault();
                cursorAnsEnde(e.key === 'Home' ? alle[0] : alle[alle.length - 1]);
                return;
            }
            /* Strg + Umschalt + C: Link auf genau diesen Block */
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                const adr = location.href.split('#')[0] + '#block=' + b.id;
                Ablage.kopiereJetzt(adr, 'Link auf diesen Block kopiert');
                return;
            }
            /* Strg + Umschalt + Rücktaste: den ganzen Block weg, ohne Rückfrage */
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Backspace') {
                e.preventDefault();
                const eltern = Store.getBlock(b.parentId);
                const idx = eltern ? eltern.content.indexOf(b.id) : -1;
                const vorher = idx > 0 ? Store.getBlock(eltern.content[idx - 1]) : null;
                Store.trashBlock(b.id);
                App.zeichneSeite(vorher ? vorher.id : null, 'ende');
                UI.toast('Block in den Papierkorb');
                return;
            }
            /* Strg + Umschalt + Enter: eine Seite rechts daneben öffnen */
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
                const ziel = b.type === 'page' ? b.id : (b.type === 'pageref' ? b.ziel : null);
                if (ziel && typeof Fenster !== 'undefined') {
                    e.preventDefault();
                    Fenster.teilen(ziel, 'quer');
                    return;
                }
            }
            /* Inline-Formatierung */
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                const k = e.key.toLowerCase();
                /* Im Editor bedeutet Strg/Cmd+K bei einer Textauswahl „Link". Ohne
                   Auswahl darf das Ereignis weiter zur globalen Suche blubbern. */
                if (k === 'k' && String(getSelection() || '')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof Auswahl !== 'undefined' && Auswahl.linkSetzen)
                        Auswahl.linkSetzen();
                    return;
                }
                if (k === 'b') {
                    e.preventDefault();
                    umschliesse('**');
                    return;
                }
                if (k === 'i') {
                    e.preventDefault();
                    umschliesse('*');
                    return;
                }
                if (k === 'u') {
                    e.preventDefault();
                    umschliesse('__');
                    return;
                }
                if (k === 'e') {
                    e.preventDefault();
                    umschliesse('`');
                    return;
                }
                if (e.shiftKey && k === 's') {
                    e.preventDefault();
                    umschliesse('~~');
                    return;
                }
                if (k === 'd') {
                    e.preventDefault();
                    dupliziere(b);
                    return;
                }
            }
        });
        /* --- Rechtsklick öffnet dasselbe Menü wie der Griff -------------------
         * Notion hat auf dem Desktop ein Kontextmenü; bei uns kam man bisher nur
         * über den Griff dorthin. Innerhalb von Text lassen wir das Menü des
         * Browsers stehen — dort will man Rechtschreibung und Einfügen.
         * -------------------------------------------------------------------- */
        wurzel.addEventListener('contextmenu', (e) => {
            /* Am Telefon gehört das lange Drücken der Hebe-Geste (E83). Android
               feuert trotzdem contextmenu — das öffnete das Rechner-Menü mitten
               ins Tragen hinein. Hier unterdrücken, die Geste liefert das Menü
               selbst beim Loslassen. */
            if (window.matchMedia('(max-width: 760px)').matches) {
                e.preventDefault();
                return;
            }
            if (e.shiftKey)
                return; /* Umschalt = Browsermenü */
            const blk = elVon(e)?.closest('.blk');
            if (!blk)
                return;
            const imText = elVon(e)?.closest('[contenteditable]');
            const auswahl = String(getSelection() || '');
            if (imText && auswahl)
                return; /* Text markiert: Browsermenü */
            const b = Store.getBlock(blk.dataset.bid);
            if (!b)
                return;
            e.preventDefault();
            const anker = { getBoundingClientRect: () => ({
                    left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY,
                    width: 0, height: 0, x: e.clientX, y: e.clientY
                }) };
            blockMenue(anker, b);
        });
        /* --- Klick auf die Griffe -------------------------------------------- */
        wurzel.addEventListener('click', (e) => {
            const btn = elVon(e)?.closest('.handles button');
            if (!btn)
                return;
            const blk = btn.closest('.blk');
            const b = Store.getBlock(blk?.dataset.bid);
            if (!b)
                return;
            if (btn.dataset.act === 'add') {
                const eltern = Store.getBlock(b.parentId);
                const idx = eltern ? eltern.content.indexOf(b.id) + 1 : -1;
                const neu = Store.addBlock(b.parentId, 'text', {}, idx);
                App.zeichneSeite(neu.id);
            }
            else {
                blockMenue(btn, b);
            }
        });
        /* --- Ziehen und Ablegen ---------------------------------------------- */
        let gezogen = null;
        wurzel.addEventListener('mousedown', (e) => {
            const griff = elVon(e)?.closest('.handles button[data-act="menu"]');
            if (!griff)
                return;
            const blk = griff.closest('.blk');
            if (!blk)
                return;
            blk.draggable = true;
            gezogen = blk.dataset.bid;
        });
        wurzel.addEventListener('dragstart', (e) => {
            const blk = elVon(e)?.closest('.blk');
            if (blk) {
                gezogen = blk.dataset.bid;
                blk.style.opacity = '.4';
            }
        });
        wurzel.addEventListener('dragend', (e) => {
            const blk = elVon(e)?.closest('.blk');
            if (blk) {
                blk.style.opacity = '';
                blk.draggable = false;
            }
        });
        /* Die Hilfslinie zeigt, wo der Block landet: oberhalb oder unterhalb. */
        let untenAblegen = false;
        wurzel.addEventListener('dragover', (e) => {
            e.preventDefault();
            const blk = elVon(e)?.closest('.blk');
            wurzel.querySelectorAll('.blk').forEach((x) => {
                x.style.borderTop = '';
                x.style.borderBottom = '';
            });
            if (!blk || blk.dataset.bid === gezogen)
                return;
            const r = blk.getBoundingClientRect();
            untenAblegen = (e.clientY - r.top) > r.height / 2;
            if (untenAblegen)
                blk.style.borderBottom = '2px solid var(--accent)';
            else
                blk.style.borderTop = '2px solid var(--accent)';
        });
        wurzel.addEventListener('drop', (e) => {
            e.preventDefault();
            wurzel.querySelectorAll('.blk').forEach((x) => {
                x.style.borderTop = '';
                x.style.borderBottom = '';
            });
            const ziel = elVon(e)?.closest('.blk');
            if (!ziel || !gezogen || ziel.dataset.bid === gezogen)
                return;
            /* Mit gedrückter Alt-Taste wird kopiert statt verschoben — wie in Notion. */
            if (e.altKey) {
                const z = Store.getBlock(ziel.dataset.bid);
                const daten = Store.baum(gezogen);
                const eltern = Store.getBlock(z.parentId);
                const idx = eltern ? eltern.content.indexOf(z.id) : -1;
                Store.baumEinfuegen(daten, z.parentId, idx);
                App.zeichneSeite();
                UI.toast('Block kopiert');
                gezogen = null;
                return;
            }
            lege(gezogen, ziel.dataset.bid, untenAblegen);
            gezogen = null;
        });
    };
    /* --- Textauszeichnung um die Auswahl legen ------------------------------ */
    const umschliesse = (marke) => {
        const s = getSelection();
        if (!s || !s.rangeCount)
            return;
        const txt = s.toString();
        if (!txt)
            return;
        const r = s.getRangeAt(0);
        r.deleteContents();
        r.insertNode(document.createTextNode(marke + txt + marke));
        /* Änderung sichern */
        const ct = r.startContainer.parentElement?.closest('.ct');
        if (ct) {
            const blk = ct.closest('.blk');
            if (!blk || !blk.dataset.bid)
                return;
            Store.updateBlock(blk.dataset.bid, { text: ct.textContent });
            App.zeichneSeite(blk.dataset.bid, 'ende');
        }
    };
    /* ========================================================================
     * BLOCK-OPERATIONEN
     * ======================================================================*/
    const umwandeln = (id, neuerTyp) => {
        const b = Store.getBlock(id);
        if (!b)
            return;
        /* Datenbank-Blöcke sind eigene Sache */
        if (neuerTyp.startsWith('db-')) {
            const layout = neuerTyp.slice(3);
            const eltern = Store.getBlock(b.parentId);
            const idx = eltern ? eltern.content.indexOf(b.id) : -1;
            Store.trashBlock(b.id);
            Store.purgeBlock(b.id);
            const { block } = Store.addDatabase(b.parentId, 'Neue Datenbank', null, layout);
            if (eltern && idx >= 0) {
                eltern.content = eltern.content.filter((x) => x !== block.id);
                eltern.content.splice(idx, 0, block.id);
                Store.updateBlock(eltern.id, { content: eltern.content });
            }
            App.zeichneSeite();
            return;
        }
        /* Einbettungen sind alle derselbe Block, nur mit gemerktem Dienst */
        if (neuerTyp.startsWith('embed-')) {
            Store.updateBlock(id, { type: 'embed', dienst: neuerTyp.slice(6), text: '', src: null });
            App.zeichneSeite();
            return;
        }
        /* KI-Blöcke lösen eine Aktion aus, statt einen Typ zu setzen */
        if (neuerTyp.startsWith('ai-')) {
            KI.blockAktion(neuerTyp, b);
            return;
        }
        if (neuerTyp === 'page') {
            const p = Store.addPage(App.aktuelleSeite(), { text: b.text || '' });
            Store.trashBlock(b.id);
            App.zeichneSeite();
            App.oeffne(p.id);
            return;
        }
        /* Toggle-Überschrift: normale Überschrift mit Klapp-Merkmal */
        if (neuerTyp.startsWith('toggle-h')) {
            Store.updateBlock(id, { type: neuerTyp.slice(7), toggleKopf: true, open: true });
            App.zeichneSeite(id, 'ende');
            return;
        }
        /* Spalten brauchen Kinder, sonst bleiben sie leer */
        if (neuerTyp === 'columns' || neuerTyp === 'columns3') {
            Store.updateBlock(id, { type: neuerTyp, text: '' });
            const n = neuerTyp === 'columns3' ? 3 : 2;
            /* Je Spalte ein `spalte`-Behälter mit einer leeren Zeile darin —
               nicht der Inhalt direkt (E102). */
            for (let i = Store.childrenOf(id).length; i < n; i++) {
                const sp = Store.addBlock(id, 'spalte', { text: '' });
                Store.addBlock(sp.id, 'text', { text: '' });
            }
            App.zeichneSeite();
            return;
        }
        Store.updateBlock(id, { type: neuerTyp });
        /* Zwei Typen fragen direkt nach ihrem Ziel */
        if (neuerTyp === 'pageref') {
            App.zeichneSeite();
            seiteWaehlen(Store.getBlock(id));
            return;
        }
        if (neuerTyp === 'synced') {
            App.zeichneSeite();
            quelleWaehlen(Store.getBlock(id));
            return;
        }
        if (neuerTyp === 'linkeddb') {
            App.zeichneSeite();
            datenbankWaehlen(Store.getBlock(id));
            return;
        }
        if (neuerTyp === 'button') {
            App.zeichneSeite();
            knopfEinstellen(Store.getBlock(id));
            return;
        }
        App.zeichneSeite(id, 'ende');
    };
    const einruecken = (b) => {
        const eltern = Store.getBlock(b.parentId);
        if (!eltern)
            return;
        const idx = eltern.content.indexOf(b.id);
        if (idx <= 0)
            return;
        const neuerElter = Store.getBlock(eltern.content[idx - 1]);
        if (!neuerElter)
            return;
        eltern.content.splice(idx, 1);
        neuerElter.content = neuerElter.content || [];
        neuerElter.content.push(b.id);
        Store.updateBlock(eltern.id, { content: eltern.content });
        Store.updateBlock(neuerElter.id, { content: neuerElter.content });
        Store.updateBlock(b.id, { parentId: neuerElter.id });
        App.zeichneSeite(b.id, 'ende');
    };
    const ausruecken = (b) => {
        const eltern = Store.getBlock(b.parentId);
        if (!eltern || !eltern.parentId)
            return;
        const gross = Store.getBlock(eltern.parentId);
        if (!gross)
            return;
        eltern.content = eltern.content.filter((x) => x !== b.id);
        const idx = gross.content.indexOf(eltern.id) + 1;
        gross.content.splice(idx, 0, b.id);
        Store.updateBlock(eltern.id, { content: eltern.content });
        Store.updateBlock(gross.id, { content: gross.content });
        Store.updateBlock(b.id, { parentId: gross.id });
        App.zeichneSeite(b.id, 'ende');
    };
    const verschiebe = (b, richtung) => {
        const eltern = Store.getBlock(b.parentId);
        if (!eltern)
            return;
        const i = eltern.content.indexOf(b.id);
        const j = i + richtung;
        if (j < 0 || j >= eltern.content.length)
            return;
        [eltern.content[i], eltern.content[j]] = [eltern.content[j], eltern.content[i]];
        Store.updateBlock(eltern.id, { content: eltern.content });
        App.zeichneSeite(b.id, 'ende');
    };
    const lege = (quelleId, zielId, danach = false) => {
        const q = Store.getBlock(quelleId), z = Store.getBlock(zielId);
        if (!q || !z)
            return;
        /* Ein Block darf nicht in sein eigenes Inneres fallen. Landet er neben
           einem seiner NACHKOMMEN, zeigt seine neue Elternkette auf ihn selbst
           zurück — der ganze Teilbaum hängt im Kreis und verschwindet von der
           Seite, ohne gelöscht zu sein. Das Loch war so alt wie das Ziehen am
           Rechner; gefunden hat es erst der Review der Telefon-Geste (E83).
    
           Mit Schranke, wie bei seiteVon: wäre der Bestand schon zyklisch
           kaputt (ein Elternkreis OHNE die Quelle), liefe die Kette sonst
           endlos — die Sicherung gegen den Kreis darf selbst keiner werden. */
        for (let el = z, tiefe = 0; el && tiefe < 100; el = Store.getBlock(el.parentId), tiefe++) {
            if (el.id === quelleId) {
                UI.toast('Ein Block lässt sich nicht in sein eigenes Inneres verschieben.');
                return;
            }
        }
        const qe = Store.getBlock(q.parentId), ze = Store.getBlock(z.parentId);
        if (!qe || !ze)
            return;
        qe.content = qe.content.filter((x) => x !== quelleId);
        Store.updateBlock(qe.id, { content: qe.content });
        const zi = ze.content.indexOf(zielId) + (danach ? 1 : 0);
        ze.content.splice(zi, 0, quelleId);
        Store.updateBlock(ze.id, { content: ze.content });
        Store.updateBlock(quelleId, { parentId: ze.id });
        App.zeichneSeite();
    };
    const dupliziere = (b) => {
        const eltern = Store.getBlock(b.parentId);
        const idx = eltern ? eltern.content.indexOf(b.id) + 1 : -1;
        const daten = Store.baum(b.id);
        const neu = Store.baumEinfuegen(daten, b.parentId, idx);
        App.zeichneSeite(neu ? neu.id : null);
    };
    /** Fügt einen Block dieses Typs am Ende der offenen Seite ein. */
    const einfuegenAmEnde = (typId) => {
        const seite = App.aktuelleSeite();
        if (!seite) {
            UI.toast('Erst eine Seite öffnen');
            return;
        }
        const b = Store.addBlock(seite, 'text');
        umwandeln(b.id, typId);
    };
    /** Das „Umwandeln in"-Menü, auch aus der Auswahlleiste heraus. */
    const umwandelnMenue = (rect, b) => {
        const m = UI.menu('<div class="grp">Umwandeln in</div>' +
            UMWANDELBAR.map(id => {
                const t = typ(id);
                return `<button data-t="${id}"><span class="mi">${t.icon}</span>${t.name}` +
                    (t.kurz ? `<span class="ms">${t.kurz}</span>` : '') + '</button>';
            }).join(''), rect.left, rect.bottom + 6);
        m.addEventListener('click', ev => {
            const t = elVon(ev)?.closest('button[data-t]');
            if (t) {
                m.remove();
                umwandeln(b.id, t.dataset.t);
            }
        });
    };
    /* --- Auswahlhilfen für Verweis- und Sync-Blöcke ------------------------- */
    const seitenPicker = (titel, beiWahl) => {
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder"><input id="sq" placeholder="' + titel + '" autocomplete="off">' +
                '<div class="res" id="sr"></div><div class="hint">Esc bricht ab</div></div>';
        document.body.appendChild(o);
        const inp = o.querySelector('#sq');
        const res = o.querySelector('#sr');
        if (!inp || !res)
            return;
        const zeichne = (q = '') => {
            res.innerHTML = Links.seiten()
                .filter(p => !q || (p.text || '').toLowerCase().includes(q.toLowerCase()))
                .slice(0, 30)
                .map(p => `<button data-id="${p.id}"><span>${p.icon || '📄'}</span>` +
                `<span style="flex:1">${esc(p.text || 'Ohne Titel')}</span></button>`).join('');
        };
        zeichne();
        inp.addEventListener('input', () => zeichne(inp.value));
        inp.addEventListener('keydown', e => { if (e.key === 'Escape')
            o.remove(); });
        res.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-id]');
            if (!b)
                return;
            o.remove();
            beiWahl(b.dataset.id);
        });
        inp.focus();
    };
    /** Welche vorhandene Datenbank soll die verknüpfte Ansicht zeigen? */
    const datenbankWaehlen = (block) => {
        const alle = Object.values(Store.cache.collections);
        if (!alle.length) {
            UI.toast('Es gibt noch keine Datenbank');
            return;
        }
        const m = UI.menu('<div class="grp">Verknüpfte Ansicht von …</div>' +
            alle.map(c => `<button data-c="${c.id}"><span class="mi">${esc(c.icon || '🗂')}</span>` +
                `${esc(c.name)}<span class="ms">${Store.rowsOf(c.id).length}</span></button>`).join(''), innerWidth / 2 - 140, 150);
        m.addEventListener('click', e => {
            const b = elVon(e)?.closest('button[data-c]');
            if (!b)
                return;
            m.remove();
            /* Eine eigene Ansicht anlegen, damit Filter hier unabhängig bleiben */
            const v = Store.addView(b.dataset.c, 'table', 'Verknüpft');
            if (!v)
                return;
            Store.updateBlock(block.id, { collectionId: b.dataset.c, aktiveView: v.id, verknuepft: true });
            App.zeichneSeite();
        });
    };
    const seiteWaehlen = (block) => seitenPicker('Auf welche Seite soll der Verweis zeigen?', (id) => {
        Store.updateBlock(block.id, { ziel: id });
        App.zeichneSeite();
    });
    const quelleWaehlen = (block) => seitenPicker('Welche Seite soll gespiegelt werden?', (id) => {
        Store.updateBlock(block.id, { quelle: id });
        App.zeichneSeite();
    });
    /* --- Knopf-Block (Notions Button) -------------------------------------- */
    const AKTIONS_NAMEN = {
        block: 'Block einfügen', zeile: 'Datenbankeintrag anlegen',
        seite: 'Unterseite anlegen', meldung: 'Meldung zeigen', timer: 'Timer',
        aendern: 'Einträge ändern', oeffnen: 'Seite öffnen',
        /* Die vier, die Notions Knöpfe haben und unsere noch nicht hatten */
        webhook: 'An eine Webadresse schicken', mail: 'E-Mail senden',
        benachricht: 'Benachrichtigung senden', variablen: 'Variablen festlegen'
    };
    const knopfAusfuehren = async (block) => {
        /* Mehrere Aktionen laufen der Reihe nach — Notions Button kann das auch. */
        const liste = block.aktionen && block.aktionen.length
            ? block.aktionen
            : (block.aktion ? [block.aktion] : []);
        if (!liste.length) {
            knopfEinstellen(block);
            return;
        }
        if (block.bestaetigen &&
            !confirm((block.text || 'Knopf') + ' ausführen?\n\n' +
                liste.length + (liste.length === 1 ? ' Aktion' : ' Aktionen')))
            return;
        knopfVars = {};
        for (const a of liste)
            eineAktion(block, a);
        App.zeichneSeite();
        UI.toast(liste.length === 1 ? 'Ausgeführt' : liste.length + ' Aktionen ausgeführt');
    };
    /* Variablen, die ein Knopf setzt, gelten für alle folgenden Aktionen
       desselben Klicks — als {{name}}. Wie in Notion. */
    let knopfVars = {};
    const mitKnopfVars = (v) => typeof v === 'string'
        ? v.replace(/\{\{\s*([A-Za-zÄÖÜäöüß0-9_]+)\s*\}\}/g, (_, n) => (n in knopfVars ? String(knopfVars[n]) : ''))
        : v;
    const eineAktion = (block, a) => {
        const datum = (v) => {
            if (v === 'heute')
                return new Date().toISOString().slice(0, 10);
            if (v === 'morgen') {
                const t = new Date();
                t.setDate(t.getDate() + 1);
                return t.toISOString().slice(0, 10);
            }
            if (v === 'jetzt')
                return new Date().toISOString().slice(0, 16);
            const m = String(v || '').match(/^heute\s*\+\s*(\d+)$/);
            if (m) {
                const t = new Date();
                t.setDate(t.getDate() + Number(m[1]));
                return t.toISOString().slice(0, 10);
            }
            return v;
        };
        /* --- Variablen festlegen ------------------------------------------ */
        if (a.art === 'variablen') {
            (a.vars || []).forEach((v) => {
                if (!v || !v.name)
                    return;
                const r = Formula.run(mitKnopfVars(v.formel || ''), () => null, null, {});
                knopfVars[v.name] = r.ok ? Formula.anzeige(r.wert) : '';
            });
            return;
        }
        /* --- An eine Webadresse schicken ----------------------------------- */
        if (a.art === 'webhook') {
            const url = mitKnopfVars(a.text || '') || Store.getMeta('webhookUrl', '');
            if (!url) {
                UI.toast('Keine Adresse hinterlegt');
                return;
            }
            KI.holen(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quelle: 'Redion', knopf: block.text || '',
                    seite: App.aktuelleSeite(), wann: new Date().toISOString(),
                    variablen: knopfVars }) })
                /* `KI.holen` wirft bei 401/403/404 nicht, sondern gibt die Antwort
                   zurück — sechs andere Aufrufer verlassen sich darauf. Wer hier
                   nur `.then(… geschickt)` schreibt, meldet also auch bei
                   „401 Unauthorized" Erfolg. */
                .then(r => r.ok
                ? UI.toast('An den Webhook geschickt')
                : UI.banner('Webhook antwortet mit ' + r.status +
                    (KI.FEHLERTEXT[r.status] ? ' — ' + KI.FEHLERTEXT[r.status] : ''), 'warn'))
                .catch(err => UI.banner('Webhook nicht erreicht: ' + err.message, 'warn'));
            return;
        }
        /* --- Benachrichtigung ---------------------------------------------- */
        if (a.art === 'benachricht') {
            Werkzeuge.posteingangMelden({
                text: mitKnopfVars(a.text || '') || (block.text || 'Knopf gedrückt'),
                quelle: 'Knopf', seite: App.aktuelleSeite(), art: 'knopf'
            });
            return;
        }
        /* --- E-Mail --------------------------------------------------------- */
        if (a.art === 'mail') {
            const betreff = mitKnopfVars(a.betreff || '') || (block.text || 'Redion');
            const koerper = mitKnopfVars(a.text || '');
            const an = mitKnopfVars(a.an || '');
            /* Hier stand `Mail.senden(…)` — die Funktion gibt es nicht. Das Mail-Modul
               kann lesen und antworten, aber nicht von sich aus verschicken. Weil
               `Mail.senden &&` davorstand, lief immer der `mailto:`-Weg; der bleibt
               jetzt der einzige und ehrliche. */
            location.href = 'mailto:' + encodeURIComponent(an) +
                '?subject=' + encodeURIComponent(betreff) + '&body=' + encodeURIComponent(koerper);
            return;
        }
        if (a.art === 'block') {
            const eltern = Store.getBlock(block.parentId);
            const idx = eltern ? eltern.content.indexOf(block.id) + 1 : -1;
            Store.addBlock(block.parentId, a.blockTyp || 'todo', { text: a.blockText || '' }, idx);
            return;
        }
        if (a.art === 'zeile') {
            const dbs = Object.values(Store.cache.collections);
            const c = a.collectionId ? Store.getCollection(a.collectionId) : dbs[0];
            if (!c) {
                UI.toast('Keine Datenbank gefunden');
                return;
            }
            const titelKey = Object.keys(c.schema).find(k => c.schema[k].type === 'title') || 'title';
            const props = {};
            /* Vorbelegte Felder aus der Einstellung übernehmen */
            Object.entries(a.felder || {}).forEach(([k, v]) => { props[k] = datum(v); });
            const r = Store.addRow(c.id, Object.assign(props, { [titelKey]: datum(a.zeilenText) || 'Neuer Eintrag' }));
            Store.updateBlock(r.id, { text: datum(a.zeilenText) || 'Neuer Eintrag' });
            return;
        }
        if (a.art === 'seite') {
            Store.addPage(App.aktuelleSeite(), { text: a.seitenTitel || 'Neue Seite' });
            App.zeichneBaum();
            return;
        }
        if (a.art === 'meldung') {
            UI.toast(a.text || 'Fertig');
            return;
        }
        /* Notions „Edit pages in": alle Einträge, die zum Filter passen, ändern. */
        if (a.art === 'aendern') {
            const n = Datenbank.fremdSetzen({
                ziel: a.collectionId, zielKey: a.zielKey, wert: datum(a.wert),
                filterKey: a.filterKey, filterOp: a.filterOp, filterWert: a.filterWert
            }, null, null);
            UI.toast(n + (n === 1 ? ' Eintrag geändert' : ' Einträge geändert'));
            return;
        }
        /* Zu einer Seite springen — Notions „Open page". */
        if (a.art === 'oeffnen') {
            if (a.seiteId && Store.getBlock(a.seiteId))
                App.oeffne(a.seiteId);
            else
                UI.toast('Die Seite gibt es nicht mehr');
            return;
        }
        /* Timer: erster Klick setzt den Start, der zweite das Ende. */
        if (a.art === 'timer') {
            const jetzt = new Date().toISOString().slice(0, 16);
            if (!block.timerStart) {
                Store.updateBlock(block.id, { timerStart: jetzt });
                UI.toast('Timer gestartet um ' + jetzt.slice(11));
            }
            else {
                const min = Math.round((new Date(jetzt).getTime() - new Date(block.timerStart).getTime()) / 60000);
                Store.addBlock(block.parentId, 'text', { text: `⏱ ${a.text || 'Zeit'}: ${min} Minuten (${block.timerStart.slice(11)} bis ${jetzt.slice(11)})` });
                Store.updateBlock(block.id, { timerStart: null });
                UI.toast(min + ' Minuten festgehalten');
            }
            return;
        }
    };
    const knopfEinstellen = (block) => {
        const a = (block.aktionen && block.aktionen[0]) || block.aktion ||
            { art: 'block', blockTyp: 'todo', blockText: '' };
        const gesammelt = (block.aktionen || (block.aktion ? [block.aktion] : [])).slice();
        const dbs = Object.values(Store.cache.collections);
        const o = document.createElement('div');
        o.className = 'overlay';
        o.innerHTML =
            '<div class="finder" style="width:min(520px,94vw)">' +
                '<div class="fh">Knopf einrichten</div>' +
                '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px; font-size:14px">' +
                `<label>Beschriftung<br><input id="kt" value="${esc(block.text || 'Neuer Knopf')}"></label>` +
                '<label>Was passiert beim Klick?<br><select id="ka">' +
                `<option value="block"${a.art === 'block' ? ' selected' : ''}>Block einfügen</option>` +
                `<option value="zeile"${a.art === 'zeile' ? ' selected' : ''}>Datenbankeintrag anlegen</option>` +
                `<option value="seite"${a.art === 'seite' ? ' selected' : ''}>Neue Unterseite anlegen</option>` +
                `<option value="meldung"${a.art === 'meldung' ? ' selected' : ''}>Kurze Meldung zeigen</option>` +
                `<option value="timer"${a.art === 'timer' ? ' selected' : ''}>Timer starten und stoppen</option>` +
                `<option value="aendern"${a.art === 'aendern' ? ' selected' : ''}>Einträge einer Datenbank ändern</option>` +
                `<option value="oeffnen"${a.art === 'oeffnen' ? ' selected' : ''}>Eine Seite öffnen</option>` +
                `<option value="variablen"${a.art === 'variablen' ? ' selected' : ''}>Variablen festlegen</option>` +
                `<option value="benachricht"${a.art === 'benachricht' ? ' selected' : ''}>Benachrichtigung senden</option>` +
                `<option value="mail"${a.art === 'mail' ? ' selected' : ''}>E-Mail senden</option>` +
                `<option value="webhook"${a.art === 'webhook' ? ' selected' : ''}>An eine Webadresse schicken</option>` +
                '</select></label>' +
                '<div id="kdet"></div>' +
                '<label style="display:flex; gap:10px; align-items:center; margin-top:4px">' +
                `<input type="checkbox" id="kb2"${block.bestaetigen ? ' checked' : ''} style="width:auto">` +
                '<span>Vor dem Ausführen nachfragen</span></label>' +
                '<div id="kliste" class="knopf-liste"></div>' +
                '</div>' +
                '<div class="fbtns">' +
                '<button data-a="mehr">＋ Weitere Aktion</button>' +
                '<button data-a="ok" class="prim">Speichern</button>' +
                '<button data-a="zu">Abbrechen</button></div>' +
                '</div>';
        document.body.appendChild(o);
        const det = o.querySelector('#kdet');
        if (!det)
            return;
        const zeichneDetail = () => {
            const art = o.querySelector('#ka')?.value ?? '';
            if (art === 'block') {
                det.innerHTML = '<label>Blocktyp<br><select id="kb">' +
                    UMWANDELBAR.map(t => `<option value="${t}"${a.blockTyp === t ? ' selected' : ''}>${typ(t).name}</option>`).join('') +
                    '</select></label><label style="display:block;margin-top:10px">Text<br>' +
                    `<input id="kx" value="${esc(a.blockText || '')}"></label>`;
            }
            else if (art === 'zeile') {
                det.innerHTML = '<label>Datenbank<br><select id="kc">' +
                    dbs.map(c => `<option value="${c.id}"${a.collectionId === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('') +
                    '</select></label><label style="display:block;margin-top:10px">Titel des Eintrags<br>' +
                    `<input id="kx" value="${esc(a.zeilenText || '')}"></label>`;
            }
            else if (art === 'meldung' || art === 'timer') {
                det.innerHTML = `<label>${art === 'timer' ? 'Bezeichnung der Zeit' : 'Text der Meldung'}` +
                    `<br><input id="kx" value="${esc(a.text || '')}"></label>`;
            }
            else if (art === 'aendern') {
                det.innerHTML =
                    '<label>Datenbank<br><select id="kc">' +
                        dbs.map(c => `<option value="${c.id}"${a.collectionId === c.id ? ' selected' : ''}>` +
                            `${esc(c.name || 'Ohne Namen')}</option>`).join('') +
                        '</select></label>' +
                        '<label style="display:block;margin-top:10px">Diese Eigenschaft setzen<br>' +
                        '<select id="kzk"></select></label>' +
                        '<label style="display:block;margin-top:10px">… auf diesen Wert<br>' +
                        `<input id="kx" value="${esc(a.wert || '')}" placeholder="Wert · heute · morgen · {leer}"></label>` +
                        '<label style="display:block;margin-top:10px">Nur bei Einträgen, wo …<br>' +
                        '<select id="kfk"><option value="">alle Einträge</option></select>' +
                        `<input id="kfv" value="${esc(a.filterWert || '')}" placeholder="Wert" style="margin-top:5px"></label>`;
                const felder = () => {
                    const c = Store.getCollection(det.querySelector('#kc')?.value);
                    const ks = c ? Object.keys(c.schema) : [];
                    const kzk = det.querySelector('#kzk'), kfk = det.querySelector('#kfk');
                    if (!c || !kzk || !kfk)
                        return;
                    kzk.innerHTML = ks.map(k => `<option value="${k}"${a.zielKey === k ? ' selected' : ''}>${esc(c.schema[k].name)}</option>`).join('');
                    kfk.innerHTML = '<option value="">alle Einträge</option>' + ks.map(k => `<option value="${k}"${a.filterKey === k ? ' selected' : ''}>${esc(c.schema[k].name)} …</option>`).join('');
                };
                if (dbs.length)
                    felder();
                det.querySelector('#kc')?.addEventListener('change', felder);
            }
            else if (art === 'oeffnen') {
                const seiten = Object.values(Store.cache.blocks)
                    .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
                    .sort((x, y) => (x.text || '').localeCompare(y.text || ''));
                det.innerHTML = '<label>Welche Seite<br><select id="kseite">' +
                    seiten.slice(0, 400).map(p => `<option value="${p.id}"${a.seiteId === p.id ? ' selected' : ''}>` +
                        `${esc(p.text || 'Ohne Titel')}</option>`).join('') +
                    '</select></label>';
            }
            else if (art === 'variablen') {
                det.innerHTML = '<label>Je Zeile: <code>name = Formel</code>. ' +
                    'Später als <code>{{name}}</code> einsetzbar.<br>' +
                    `<textarea id="kvars" rows="4" spellcheck="false">${esc((a.vars || []).map((v) => v.name + ' = ' + v.formel).join('\n'))}</textarea></label>`;
            }
            else if (art === 'benachricht') {
                det.innerHTML = `<label>Text der Benachrichtigung<br>` +
                    `<input id="kx" value="${esc(a.text || '')}" placeholder="Erledigt: {{name}}"></label>`;
            }
            else if (art === 'mail') {
                det.innerHTML =
                    `<label>An<br><input id="kmail-an" value="${esc(a.an || '')}" placeholder="name@beispiel.ch"></label>` +
                        `<label style="display:block;margin-top:10px">Betreff<br>` +
                        `<input id="kmail-b" value="${esc(a.betreff || '')}"></label>` +
                        `<label style="display:block;margin-top:10px">Nachricht<br>` +
                        `<textarea id="kmail-t" rows="3">${esc(a.text || '')}</textarea></label>`;
            }
            else if (art === 'webhook') {
                det.innerHTML = `<label>Adresse<br><input id="kx" value="${esc(a.text || '')}" ` +
                    `placeholder="https://… — leer nimmt die aus den Einstellungen"></label>`;
            }
            else {
                det.innerHTML = `<label>Titel der Seite<br><input id="kx" value="${esc(a.seitenTitel || '')}"></label>`;
            }
        };
        zeichneDetail();
        o.querySelector('#ka')?.addEventListener('change', zeichneDetail);
        const listeZeigen = () => {
            const kasten = o.querySelector('#kliste');
            if (!kasten)
                return;
            kasten.innerHTML = gesammelt.length
                ? '<div class="grp">Diese Aktionen laufen nacheinander</div>' +
                    gesammelt.map((x, i) => `<div class="ka-zeile"><span>${i + 1}.</span>` +
                        `<b>${esc((AKTIONS_NAMEN[x.art] || x.art))}</b>` +
                        `<span class="ez-grau">${esc(x.blockText || x.zeilenText || x.seitenTitel || x.text || '')}</span>` +
                        `<button data-kweg="${i}">✕</button></div>`).join('')
                : '';
        };
        listeZeigen();
        o.addEventListener('click', e => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const weg = elVon(e)?.closest('[data-kweg]');
            if (weg) {
                gesammelt.splice(Number(weg.dataset.kweg), 1);
                listeZeigen();
                return;
            }
            const mehr = elVon(e)?.closest('[data-a="mehr"]');
            const ok = elVon(e)?.closest('[data-a="ok"]');
            if (!mehr && !ok)
                return;
            const wert = (id) => o.querySelector(id)?.value ?? '';
            const art = wert('#ka');
            const x = wert('#kx');
            const neu = { art };
            if (art === 'block') {
                neu.blockTyp = wert('#kb');
                neu.blockText = x;
            }
            if (art === 'zeile') {
                neu.collectionId = wert('#kc');
                neu.zeilenText = x;
            }
            if (art === 'seite')
                neu.seitenTitel = x;
            if (art === 'meldung' || art === 'timer')
                neu.text = x;
            if (art === 'aendern') {
                neu.collectionId = wert('#kc');
                neu.zielKey = wert('#kzk');
                neu.wert = x;
                neu.filterKey = wert('#kfk') || null;
                neu.filterWert = wert('#kfv');
                const c2 = Store.getCollection(neu.collectionId);
                if (neu.filterKey && c2) {
                    const t2 = c2.schema[neu.filterKey].type;
                    neu.filterOp = (Datenbank.OPERATOREN[t2] || Datenbank.OPERATOREN['text'] || [])[0];
                }
            }
            if (art === 'oeffnen')
                neu.seiteId = wert('#kseite');
            if (art === 'variablen') {
                neu.vars = wert('#kvars').split('\n')
                    .map((z) => z.trim()).filter(Boolean)
                    .map((z) => {
                    const i = z.indexOf('=');
                    return i < 0 ? null : { name: z.slice(0, i).trim(), formel: z.slice(i + 1).trim() };
                })
                    .filter((x) => x && x.name);
            }
            if (art === 'benachricht' || art === 'webhook')
                neu.text = wert('#kx');
            if (art === 'mail') {
                neu.an = wert('#kmail-an');
                neu.betreff = wert('#kmail-b');
                neu.text = wert('#kmail-t');
            }
            if (mehr) {
                gesammelt.push(neu);
                listeZeigen();
                const kx = o.querySelector('#kx');
                if (kx)
                    kx.value = '';
                return;
            }
            const alle = gesammelt.length ? [...gesammelt, neu] : [neu];
            Store.updateBlock(block.id, {
                text: wert('#kt'),
                aktionen: alle,
                aktion: null,
                bestaetigen: o.querySelector('#kb2')?.checked ?? false
            });
            o.remove();
            App.zeichneSeite();
        });
    };
    /* ========================================================================
     * SLASH-MENÜ
     * ======================================================================*/
    const slashMenue = (ct, block) => {
        const rect = ct.getBoundingClientRect();
        /* Der Filter kommt aus dem tatsächlichen Text — nicht aus mitgezählten
           Tastendrücken. Sonst gehen schnell getippte Zeichen verloren. */
        const filterLesen = () => {
            /* Nur bis zum Schreibzeiger lesen. Wer mitten in einer Zeile / tippt,
               soll nicht den Rest des Satzes als Suchwort bekommen. */
            let bis = ct.textContent || '';
            const sel = window.getSelection();
            if (sel && sel.rangeCount && ct.contains(sel.anchorNode)) {
                const r = sel.getRangeAt(0).cloneRange();
                r.selectNodeContents(ct);
                r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
                bis = r.toString();
            }
            const m = bis.match(/\/([^\/]*)$/);
            return m ? m[1] : '';
        };
        let filter = filterLesen();
        /* Was zuletzt benutzt wurde, steht oben unter „Empfohlen" — so wie in
           Notion. Nach ein paar Tagen trifft das meistens zu, was man sucht. */
        const zuletzt = () => (Store.getMeta('slash:zuletzt', []) || [])
            .map((id) => TYPEN.find((t) => t.id === id)).filter(Boolean).slice(0, 4);
        const merken = (id) => {
            const l = [id, ...(Store.getMeta('slash:zuletzt', []) || []).filter((x) => x !== id)];
            Store.setMeta('slash:zuletzt', l.slice(0, 8));
        };
        const knopf = (t) => `<button data-t="${t.id}">` +
            `<span class="mi">${t.icon}</span>` +
            `<span class="sl-name">${t.name}</span>` +
            `<span class="sl-gruppe">${esc(t.gruppe)}</span>` +
            (t.kurz ? `<span class="ms">${t.kurz}</span>` : '') +
            '</button>';
        const bauen = () => {
            const q = filter.toLowerCase().replace(/^\//, '');
            const treffer = TYPEN.filter((t) => !q || t.name.toLowerCase().includes(q) || t.cmd.some((c) => c.startsWith(q)));
            if (!treffer.length)
                return '<div class="grp">Kein Treffer für „' + esc(q) + '"</div>';
            let html = '';
            /* Empfohlen nur, solange nichts getippt wurde */
            if (!q) {
                const empf = zuletzt();
                if (empf.length) {
                    html += '<div class="grp">Empfohlen</div>';
                    empf.forEach((t) => { html += knopf(t); });
                }
            }
            const gruppen = {};
            treffer.forEach((t) => (gruppen[t.gruppe] = gruppen[t.gruppe] || []).push(t));
            Object.entries(gruppen).forEach(([g, liste]) => {
                html += `<div class="grp">${g}</div>`;
                liste.forEach((t) => { html += knopf(t); });
            });
            return html;
        };
        const menu = UI.menu('<div class="sl-liste">' + bauen() + '</div>' +
            '<div class="sl-fuss">Menü schliessen<span>esc</span></div>', rect.left, rect.bottom + 4);
        menu.addEventListener('click', (e) => {
            const b = elVon(e)?.closest('button[data-t]');
            if (!b)
                return;
            merken(b.dataset.t ?? '');
            schliessen();
            const t = TYPEN.find((x) => x.id === b.dataset.t);
            /* Aktionen legen keinen Block an — sie tun etwas mit diesem hier. */
            if (t && t.aktion) {
                slashAktion(ct, block, t.aktion);
                return;
            }
            umwandelnNachSlash(ct, block, b.dataset.t);
        });
        const schliessen = () => {
            menu.remove();
            document.removeEventListener('keydown', tasten, true);
            ct.removeEventListener('input', beiEingabe);
        };
        /* Nach jedem Tastendruck den Filter aus dem Text neu lesen */
        const beiEingabe = () => {
            const vorher = filter;
            filter = filterLesen();
            /* Slash gelöscht? Dann ist das Menü fertig. */
            if (!/\/[^\/]*$/.test(ct.textContent || '')) {
                schliessen();
                return;
            }
            if (filter === vorher)
                return;
            const slListe = menu.querySelector('.sl-liste');
            if (slListe)
                slListe.innerHTML = bauen();
            const erste = menu.querySelector('button[data-t]');
            if (erste)
                erste.classList.add('on');
        };
        ct.addEventListener('input', beiEingabe);
        /* Pfeile wählen aus, Enter übernimmt */
        const tasten = (e) => {
            if (!document.body.contains(menu)) {
                schliessen();
                return;
            }
            const btns = [...menu.querySelectorAll('button[data-t]')];
            const aktiv = menu.querySelector('button.on');
            const i = aktiv ? btns.indexOf(aktiv) : -1;
            if (e.key === 'Escape') {
                e.stopPropagation();
                schliessen();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (aktiv)
                    aktiv.classList.remove('on');
                const j = e.key === 'ArrowDown'
                    ? (i + 1) % btns.length
                    : (i - 1 + btns.length) % btns.length;
                if (btns[j]) {
                    btns[j].classList.add('on');
                    btns[j].scrollIntoView({ block: 'nearest' });
                }
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                const ziel = aktiv || btns[0];
                if (ziel && ziel.dataset.t) {
                    merken(ziel.dataset.t);
                    schliessen();
                    umwandelnNachSlash(ct, block, ziel.dataset.t);
                }
                return;
            }
            if (e.key === 'Backspace' && !filter) {
                schliessen();
                return;
            }
        };
        const erste = menu.querySelector('button[data-t]');
        if (erste)
            erste.classList.add('on');
        document.addEventListener('keydown', tasten, true);
    };
    /** Entfernt den eingetippten Slash-Befehl und wandelt den Block um. */
    const umwandelnNachSlash = (ct, block, typId) => {
        ct.textContent = (ct.textContent || '').replace(/\/[^\/]*$/, '');
        Store.updateBlock(block.id, { text: ct.textContent });
        umwandeln(block.id, typId);
    };
    /**
     * Die Aktionen aus dem Slash-Menü: /turn, /color, /duplicate, /moveto,
     * /delete, /mention, /date, /reminder, /emoji, /comment.
     * Notion hat sie alle; sie legen keinen Block an, sondern greifen zu.
     */
    const slashAktion = (ct, block, was) => {
        /* Den getippten Befehl aus dem Text nehmen, bevor irgendetwas passiert */
        ct.textContent = (ct.textContent || '').replace(/\/[^\/]*$/, '');
        Store.updateBlock(block.id, { text: ct.textContent });
        const b = Store.getBlock(block.id) || block;
        const griff = document.querySelector(`.blk[data-bid="${b.id}"] .handles button[data-act="menu"]`);
        if (was === 'turn' || was === 'color') {
            /* Beide öffnen dasselbe Untermenü wie am Blockgriff — kein zweiter Weg,
               der auseinanderlaufen könnte. */
            if (!griff) {
                UI.toast('Der Block ist gerade nicht sichtbar');
                return;
            }
            blockMenue(griff, b);
            setTimeout(() => {
                const m = document.querySelector('.menu');
                const knopf = m && m.querySelector(`button[data-a="${was}"]`);
                if (knopf)
                    knopf.click();
            }, 0);
            return;
        }
        if (was === 'default') {
            Store.updateBlock(b.id, { color: '' });
            App.zeichneSeite(b.id, 'ende');
            return;
        }
        if (was === 'dup') {
            dupliziere(b);
            return;
        }
        if (was === 'moveto') {
            blockVerschiebenNach(b);
            return;
        }
        if (was === 'del') {
            Store.trashBlock(b.id);
            Store.purgeBlock(b.id);
            App.zeichneSeite();
            return;
        }
        if (was === 'komm') {
            Kommentare.neu(b);
            return;
        }
        /* Erwähnung, Datum, Erinnerung und Emoji schreiben ihr Zeichen und
           lassen dann das Menü aufgehen, das ohnehin daran hängt. */
        zeichenAusloesen(b.id, was);
    };
    /* ------------------------------------------------------------------------
     * DAS AUSLÖSEZEICHEN SCHREIBEN — EINMAL, FÜR ZWEI WEGE
     *
     * „@" öffnet die Erwähnung, „:" das Emoji-Menü. Beide hängen ohnehin am
     * Tippen; die Aktion tut nichts weiter, als das Zeichen zu setzen und so
     * zu tun, als sei es getippt worden.
     *
     * Das stand als Schwanz in `slashAktion` und wird seit E215 auch vom
     * Menüband gebraucht (L63). Zwei Kopien desselben Schwanzes wären zwei
     * Stellen, an denen jemand später ein Zeichen ändert — und eine, an der
     * er es vergisst.
     *
     * GELESEN WIRD AUS DEM SPEICHER, NICHT AUS DEM DOM. `slashAktion` hatte
     * `ct.textContent`; an der Stelle des Aufrufs ist beides gleich, aber der
     * Speicher gilt auch dann, wenn kein Feld im Bild steht — und genau das
     * ist beim Weg über das Menüband der Normalfall.
     * ----------------------------------------------------------------------*/
    const AUSLOESER = { mention: '@', date: '@', remind: '@remind ', emoji: ':' };
    const zeichenAusloesen = (blockId, was) => {
        const zeichen = AUSLOESER[was];
        if (!zeichen)
            return false;
        const b = Store.getBlock(blockId);
        if (!b)
            return false;
        Store.updateBlock(b.id, { text: (b.text || '') + zeichen });
        App.zeichneSeite(b.id, 'ende');
        setTimeout(() => {
            const feld = document.querySelector(`.blk[data-bid="${b.id}"] [contenteditable]`);
            if (feld) {
                feld.focus();
                cursorAnsEnde(feld);
                feld.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }
        }, 30);
        return true;
    };
    /**
     * DIESELBE AKTION, ABER OHNE SCHREIBZEIGER (L63).
     *
     * `slashAktion` braucht das Feld, in dem gerade getippt wird, und den
     * Block darunter. Ein Knopf im Menüband hat weder das eine noch das
     * andere — deshalb standen „Erwähnung", „Datum" und „Emoji" bisher nur im
     * Slash-Menü, obwohl sie inhaltlich unter „Einfügen" gehören.
     *
     * Hier wird stattdessen ein leerer Textblock ans Ende der Seite gehängt
     * und das Auslösezeichen dort geschrieben. Ab da ist es derselbe Weg wie
     * beim Tippen — dasselbe `zeichenAusloesen`, dasselbe Menü.
     *
     * NUR DIESE DREI. Die anderen acht Aktionen (Umwandeln, Farbe,
     * Duplizieren, Verschieben, Löschen, Kommentar …) handeln von EINEM
     * bestimmten Block. Ohne Schreibzeiger gibt es keinen, und einer, der
     * sich den letzten Block greift, würde irgendwann den falschen erwischen.
     * Ein Knopf, der manchmal das Richtige trifft, ist schlimmer als keiner.
     */
    /* ZWEI UND NICHT DREI — „Datum" IST DASSELBE MENÜ.
       Nachgemessen: `mention` und `date` schreiben beide „@" und öffnen damit
       dasselbe Menü. Das ist kein Fehler — dieses Menü führt Seiten, Personen
       UND Datumsangaben („heute", „morgen", „Datum wählen …"). Aber ein Knopf
       „Datum", der ein Menü mit der Überschrift „Seiten" aufmacht, führt in
       die Irre. Ein Einstieg, dessen Hinweis alle drei nennt, tut das nicht. */
    const AM_ENDE = ['mention', 'emoji'];
    const aktionAmEnde = (was) => {
        if (!AM_ENDE.includes(was))
            return false;
        const seite = App.aktuelleSeite();
        if (!seite) {
            UI.toast('Erst eine Seite öffnen');
            return false;
        }
        const b = Store.addBlock(seite, 'text');
        if (!b)
            return false;
        /* EMOJI GEHT NICHT ÜBER DAS AUSLÖSEZEICHEN.
    
           Gemessen: „:" allein öffnet nichts. Das Emoji-Menü hängt an
           `/(?:^|\s):([a-zäöü]{2,})$/` — es braucht MINDESTENS ZWEI
           Buchstaben nach dem Doppelpunkt, damit ein gewöhnlicher Doppelpunkt
           im Satz kein Menü aufklappt. Das ist beim Tippen richtig und beim
           Knopfdruck falsch: dort steht am Ende nur ein Doppelpunkt und sonst
           nichts. (Derselbe Weg über `slashAktion` hat dasselbe Problem.)
    
           Die volle Auswahl mit Suchfeld gibt es — `Erwaehnungen.emojiWaehler`.
           Sie liegt aber in einem ANDEREN Bereich, und ein Bereich darf keinen
           anderen aufrufen (CLAUDE.md §5, Regel 1). Der vorgesehene Weg dafür
           ist der Ereignisbus, und genau der wird hier benutzt.
    
           Hört niemand zu, bleibt es beim Doppelpunkt — dann ist es so gut wie
           vorher und nicht schlechter. */
        if (was === 'emoji' && typeof Ereignisse !== 'undefined') {
            try {
                /* ERST ZEICHNEN, DANN RUFEN. Der Block ist gerade erst im Speicher
                   entstanden; auf der Seite steht er noch nicht. Wer daran ein Menü
                   aufhängen will, findet nichts — gemessen kam beim ersten Versuch
                   kein einziges Menü, obwohl der Zuhörer lief. */
                App.zeichneSeite(b.id, 'ende');
                if (Ereignisse.melde('emojiWaehlen', { blockId: b.id }) > 0)
                    return true;
            }
            catch { /* dann eben das Zeichen */ }
        }
        return zeichenAusloesen(b.id, was);
    };
    /* ========================================================================
     * BLOCK-HANDLE-MENÜ
     * ======================================================================*/
    const blockMenue = (anker, b) => {
        const r = anker.getBoundingClientRect();
        const FARBEN = [
            ['default', 'Standard'], ['gray', 'Grau'], ['brown', 'Braun'], ['orange', 'Orange'], ['yellow', 'Gelb'],
            ['green', 'Grün'], ['blue', 'Blau'], ['purple', 'Lila'], ['pink', 'Pink'], ['red', 'Rot']
        ];
        const html = '<button data-a="turn"><span class="mi">⇄</span>Umwandeln in<span class="ms">▸</span></button>' +
            '<button data-a="color"><span class="mi">🎨</span>Farbe<span class="ms">▸</span></button>' +
            '<button data-a="groesse"><span class="mi">🔠</span>Schriftgrösse<span class="ms">▸</span></button>' +
            '<button data-a="schrift"><span class="mi">✍</span>Schriftart<span class="ms">▸</span></button>' +
            (b.type === 'callout'
                ? '<button data-a="ruficon"><span class="mi">😀</span>Symbol des Hinweises</button>' : '') +
            '<button data-a="ai"><span class="mi">✨</span>Mit KI bearbeiten</button>' +
            '<button data-a="komm"><span class="mi">💬</span>Kommentar<span class="ms">Ctrl+Shift+M</span></button>' +
            '<hr>' +
            '<button data-a="auswahl"><span class="mi">☑</span>Auswählen</button>' +
            '<button data-a="dup"><span class="mi">⧉</span>Duplizieren<span class="ms">Ctrl+D</span></button>' +
            '<button data-a="up"><span class="mi">↑</span>Nach oben<span class="ms">Ctrl+Shift+↑</span></button>' +
            '<button data-a="down"><span class="mi">↓</span>Nach unten<span class="ms">Ctrl+Shift+↓</span></button>' +
            '<button data-a="moveto"><span class="mi">➦</span>Verschieben nach …</button>' +
            '<hr>' +
            '<button data-a="copy"><span class="mi">⎘</span>Text kopieren<span class="ms">Ctrl+C</span></button>' +
            '<button data-a="cut"><span class="mi">✂</span>Ausschneiden<span class="ms">Ctrl+X</span></button>' +
            '<button data-a="link"><span class="mi">🔗</span>Link zum Block kopieren</button>' +
            '<button data-a="ref"><span class="mi">((</span>Blockverweis kopieren</button>' +
            '<button data-a="karte"><span class="mi">🎴</span>Zur Karteikarte machen</button>' +
            '<hr>' +
            '<button data-a="del"><span class="mi">🗑</span>Löschen<span class="ms">Del</span></button>';
        const menu = UI.menu(html, r.right + 6, r.top);
        menu.addEventListener('click', (e) => {
            const btn = elVon(e)?.closest('button[data-a]');
            if (!btn)
                return;
            const a = btn.dataset.a;
            if (a === 'turn') {
                menu.innerHTML = '<div class="grp">Umwandeln in</div>' +
                    UMWANDELBAR.map(id => {
                        const t = typ(id);
                        return `<button data-t="${id}"><span class="mi">${t.icon}</span>${t.name}</button>`;
                    }).join('');
                menu.addEventListener('click', (ev) => {
                    const t = elVon(ev)?.closest('button[data-t]');
                    if (t) {
                        menu.remove();
                        umwandeln(b.id, t.dataset.t);
                    }
                });
                return;
            }
            /* Grösse und Schriftart teilen sich einen Bauplan — zwei fast gleiche
               Menüs von Hand wären zwei Stellen zum Vergessen. Die Einträge zeigen
               sich selbst: „Gross" steht gross da. */
            if (a === 'groesse' || a === 'schrift') {
                const istGroesse = a === 'groesse';
                const liste = istGroesse ? Textstile.GROESSEN : Textstile.SCHRIFTEN;
                const feld = istGroesse ? 'groesse' : 'schrift';
                const vorsatz = istGroesse ? 'tg-' : 'ts-';
                const jetzt = (b.stil || {})[feld] ||
                    (istGroesse ? 'normal' : 'standard');
                menu.innerHTML =
                    `<div class="grp">${istGroesse ? 'Schriftgrösse' : 'Schriftart'}</div>` +
                        liste.map(([id, name]) => `<button data-s="${id}">` +
                            `<span class="stil-probe"><span class="${id === 'normal' || id === 'standard' ? '' : vorsatz + id}">` +
                            `${esc(name)}</span>${jetzt === id ? '<em>✓</em>' : ''}</span></button>`).join('');
                menu.addEventListener('click', (ev) => {
                    const s = elVon(ev)?.closest('button[data-s]');
                    if (!s)
                        return;
                    const stil = { ...(b.stil || {}) };
                    stil[feld] = s.dataset.s;
                    Store.updateBlock(b.id, { stil });
                    menu.remove();
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'color') {
                menu.innerHTML = '<div class="grp">Textfarbe</div><div class="swatches">' +
                    FARBEN.map(([f, n]) => `<button data-c="${f}" title="${n}" style="background:var(--c-${f})"></button>`).join('') +
                    '</div><div class="grp">Hintergrund</div><div class="swatches">' +
                    FARBEN.slice(1).map(([f, n]) => `<button data-c="bg-${f}" title="${n}" style="background:var(--b-${f})"></button>`).join('') +
                    '</div>';
                menu.addEventListener('click', (ev) => {
                    const c = elVon(ev)?.closest('button[data-c]');
                    if (c) {
                        Store.updateBlock(b.id, { color: c.dataset.c === 'default' ? '' : c.dataset.c });
                        menu.remove();
                        App.zeichneSeite();
                    }
                });
                return;
            }
            menu.remove();
            /* Der Einstieg in die Mehrfachauswahl — am Telefon der EINZIGE
               (E84): dort gibt es weder Esc noch Umschalt-Klick. Danach
               schaltet ein Tipp weitere Blöcke dazu, siehe auswahlEinklinken. */
            if (a === 'auswahl') {
                ankerId = b.id;
                auswahlSetzen([b.id]);
            }
            if (a === 'dup')
                dupliziere(b);
            if (a === 'up')
                verschiebe(b, -1);
            if (a === 'down')
                verschiebe(b, 1);
            if (a === 'link') {
                Ablage.kopiereJetzt(location.origin + location.pathname + '#' + App.aktuelleSeite() + ':' + b.id, 'Link zum Block kopiert');
            }
            if (a === 'ref') {
                Ablage.kopiereJetzt('((' + b.id + '))', 'Blockverweis kopiert — irgendwo einfügen');
            }
            if (a === 'copy') {
                Ablage.kopiereJetzt(b.text || '', 'Text kopiert');
            }
            if (a === 'cut') {
                /* ERST kopieren, DANN löschen — und nur dann. `purgeBlock` räumt
                   endgültig weg; wenn die Zwischenablage den Text nicht genommen
                   hat, gäbe es ihn danach nirgends mehr. Vorher stand das Löschen
                   gleichberechtigt daneben und lief auch, wenn das Kopieren
                   abgewiesen wurde. */
                Ablage.kopiere(b.text || '', 'Ausgeschnitten').then(ging => {
                    if (!ging)
                        return;
                    Store.trashBlock(b.id);
                    Store.purgeBlock(b.id);
                    App.zeichneSeite();
                });
            }
            if (a === 'komm')
                Kommentare.neu(b);
            /* Callout: eigenes Symbol wählen — Notion kann das, wir bisher nicht */
            if (a === 'ruficon') {
                UI.emojiWaehlen(anker, (sym) => {
                    Store.updateBlock(b.id, { icon: sym });
                    App.zeichneSeite();
                });
                return;
            }
            if (a === 'karte') {
                const t = b.text || '';
                Store.updateBlock(b.id, { type: 'flashcard', text: t.includes('::') ? t : t + ' :: ' });
                App.zeichneSeite(b.id, 'ende');
                UI.toast('Karteikarte — Frage :: Antwort');
            }
            if (a === 'moveto') {
                Blocks.blockVerschiebenNach(b);
            }
            if (a === 'ai')
                KI.blockAktion('ai-edit', b);
            if (a === 'del') {
                Store.trashBlock(b.id);
                Store.purgeBlock(b.id);
                App.zeichneSeite();
            }
        });
    };
    /** Einen Block auf eine andere Seite verschieben. */
    /**
     * Alle Toggles der Seite auf einmal auf- oder zuklappen (Strg+Alt+T).
     * Ist mindestens eines zu, gehen alle auf; sind alle offen, gehen alle zu —
     * genauso verhält sich Notion.
     */
    const alleToggles = () => {
        const seite = Store.getBlock(App.aktuelleSeite());
        if (!seite)
            return;
        const gefunden = [];
        const gehe = (id) => {
            const x = Store.getBlock(id);
            if (!x)
                return;
            if (x.type === 'toggle' || x.toggleKopf)
                gefunden.push(x);
            (x.content || []).forEach(gehe);
        };
        (seite.content || []).forEach(gehe);
        if (!gefunden.length) {
            UI.toast('Auf dieser Seite gibt es keine Toggles');
            return;
        }
        const auf = gefunden.some(x => !x.open);
        gefunden.forEach(x => Store.updateBlock(x.id, { open: auf }));
        App.zeichneSeite();
        UI.toast(auf ? gefunden.length + ' Toggles geöffnet' : gefunden.length + ' Toggles geschlossen');
    };
    const blockVerschiebenNach = (b) => {
        seitenPicker('Auf welche Seite verschieben?', (zielId) => {
            const daten = Store.baum(b.id);
            Store.baumEinfuegen(daten, zielId);
            Store.trashBlock(b.id);
            Store.purgeBlock(b.id);
            App.zeichneSeite();
            UI.toast('Block verschoben');
        });
    };
    /* ========================================================================
     * MEHRERE BLÖCKE AUF EINMAL
     * ------------------------------------------------------------------------
     * In Notion drückt man Esc und hat den Block ausgewählt; mit Umschalt und
     * den Pfeilen wächst die Auswahl, und dann gilt alles für alle: löschen,
     * duplizieren, umwandeln, einrücken, verschieben, kopieren.
     *
     * Bisher galt hier jede Taste immer nur für den Block unter dem Cursor.
     * Wer zehn Absätze in Listenpunkte verwandeln wollte, musste zehnmal
     * dasselbe tun. Das holt es nach — und bringt gleich fünfzehn Kürzel mit,
     * die sonst ins Leere gingen.
     *
     * Die Auswahl lebt nur im Fenster, nicht in der Datenbank: sie ist ein
     * Zustand der Bedienung, kein Inhalt.
     * ---------------------------------------------------------------------- */
    let ausgewaehlt = []; /* Block-IDs in Reihenfolge der Seite */
    let ankerId = null; /* von hier aus wächst die Auswahl */
    let ablage = null; /* ausgeschnittene oder kopierte Blöcke */
    /** Alle sichtbaren Blöcke der Seite, von oben nach unten. */
    const sichtbareBloecke = () => [...document.querySelectorAll('#page .blk[data-bid]')].map(el => el.dataset.bid);
    const auswahlZeigen = () => {
        document.querySelectorAll('#page .blk.gewaehlt')
            .forEach(el => el.classList.remove('gewaehlt'));
        ausgewaehlt.forEach(id => {
            const el = document.querySelector(`#page .blk[data-bid="${id}"]`);
            if (el)
                el.classList.add('gewaehlt');
        });
        let leiste = document.getElementById('auswahl-leiste');
        /* Am Rechner erscheint die Leiste ab zwei Blöcken — EIN gewählter
           Block hat dort seine Griffe und das Kontextmenü. Am Telefon ist
           sie ab dem ersten da: sie ist dort der einzige Beleg, dass man
           im Auswahl-Zustand ist, und der einzige Weg zu den Aktionen. */
        const mindest = window.matchMedia('(max-width: 760px)').matches ? 1 : 2;
        if (ausgewaehlt.length < mindest) {
            if (leiste)
                leiste.remove();
            return;
        }
        if (!leiste) {
            leiste = document.createElement('div');
            leiste.id = 'auswahl-leiste';
            document.body.appendChild(leiste);
            leiste.addEventListener('click', (e) => {
                const a = elVon(e)?.closest('[data-a]');
                if (!a)
                    return;
                if (a.dataset.a === 'weg')
                    auswahlLoeschen();
                if (a.dataset.a === 'dup')
                    auswahlDuplizieren();
                if (a.dataset.a === 'kopie')
                    auswahlKopieren();
                if (a.dataset.a === 'typ')
                    auswahlTypMenue(a);
                if (a.dataset.a === 'zu')
                    auswahlLeeren();
            });
        }
        leiste.innerHTML =
            `<b>${ausgewaehlt.length} ${ausgewaehlt.length === 1 ? 'Block' : 'Blöcke'}</b>` +
                '<button data-a="typ">Umwandeln ▾</button>' +
                '<button data-a="dup" title="Strg D">Duplizieren</button>' +
                '<button data-a="kopie" title="Strg C">Kopieren</button>' +
                '<button data-a="weg" class="rot" title="Entf">Löschen</button>' +
                '<button data-a="zu" title="Esc">✕</button>';
    };
    const auswahlSetzen = (ids) => {
        const reihe = sichtbareBloecke();
        ausgewaehlt = reihe.filter(id => ids.includes(id));
        auswahlZeigen();
    };
    const auswahlLeeren = () => { ausgewaehlt = []; ankerId = null; auswahlZeigen(); };
    /** Vom Anker bis hierhin — wie Umschalt+Klick in einer Dateiliste. */
    const auswahlBis = (id) => {
        const reihe = sichtbareBloecke();
        const a = reihe.indexOf(ankerId), b2 = reihe.indexOf(id);
        if (a < 0 || b2 < 0)
            return;
        auswahlSetzen(reihe.slice(Math.min(a, b2), Math.max(a, b2) + 1));
    };
    const auswahlBloecke = () => ausgewaehlt.map(Store.getBlock).filter(Boolean);
    const auswahlLoeschen = () => {
        const n = ausgewaehlt.length;
        if (!n)
            return;
        /* Über die Seite zurückholbar: erst in den Papierkorb, nicht endgültig */
        ausgewaehlt.forEach(id => Store.trashBlock(id));
        auswahlLeeren();
        App.zeichneSeite();
        UI.toast(n + (n === 1 ? ' Block in den Papierkorb' : ' Blöcke in den Papierkorb'));
    };
    const auswahlDuplizieren = () => {
        const liste = auswahlBloecke();
        if (!liste.length)
            return;
        liste.slice().reverse().forEach(b => dupliziere(b));
        const n = liste.length;
        auswahlLeeren();
        App.zeichneSeite();
        UI.toast(n + (n === 1 ? ' Block dupliziert' : ' Blöcke dupliziert'));
    };
    /** Die Auswahl als Markdown — so lässt sie sich überall einfügen. */
    const auswahlAlsText = () => auswahlBloecke().map(b => {
        const marke = { h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '1. ',
            todo: b.checked ? '- [x] ' : '- [ ] ', quote: '> ', toggle: '> ',
            callout: '> 💡 ' }[b.type] || '';
        if (b.type === 'divider')
            return '---';
        if (b.type === 'code')
            return '```' + (b.lang || '') + '\n' + (b.text || '') + '\n```';
        /* Der Tabellenblock geht als Markdown-Tabelle hinaus (E88) — die
           Gegenrichtung zum Einfügen. Was er sonst schriebe, wäre sein leerer
           `text`: die Tabelle wäre beim Kopieren einfach verschwunden. */
        if (b.type === 'spreadsheet' && b.mappe && b.mappe.blaetter &&
            typeof Spreadsheet !== 'undefined' && typeof CellRefs !== 'undefined') {
            const blatt = b.mappe.blaetter.find((x) => x.id === b.mappe.aktiv)
                || b.mappe.blaetter[0];
            if (blatt) {
                let hochZ = 0, hochS = 0;
                Object.keys(blatt.zellen || {}).forEach(a => {
                    const p = CellRefs.lies(a);
                    if (p) {
                        hochZ = Math.max(hochZ, p.zeile + 1);
                        hochS = Math.max(hochS, p.spalte + 1);
                    }
                });
                if (hochZ && hochS) {
                    const zeile = (z) => '| ' + Array.from({ length: hochS }, (_, s) => String(Spreadsheet.eingabe(blatt, CellRefs.schreibe(z, s)) ?? '')
                        .replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ') + ' |';
                    const trenner = '|' + Array.from({ length: hochS }, () => ' --- |').join('');
                    return [zeile(0), trenner,
                        ...Array.from({ length: hochZ - 1 }, (_, z) => zeile(z + 1))].join('\n');
                }
            }
        }
        return marke + (b.text || '');
    }).join('\n');
    const auswahlKopieren = async () => {
        const t = auswahlAlsText();
        ablage = auswahlBloecke().map(b => Store.baum(b.id));
        const n = ausgewaehlt.length;
        /* Ohne Meldung, weil hier mehr zu sagen ist als „ging" oder „ging
           nicht": die INTERNE Ablage steht in jedem Fall, innerhalb von Redion
           lässt sich also einfügen, auch wenn der Browser die Zwischenablage
           verweigert. Ein blosses „kopiert" verschwiege das, ein blosses
           „ging nicht" wäre zu düster. */
        const ging = await Ablage.kopiere(t);
        UI.toast(ging
            ? n + (n === 1 ? ' Block kopiert' : ' Blöcke kopiert')
            : n + ' hier gemerkt — für andere Programme hat der Browser das Kopieren abgelehnt');
    };
    const auswahlSchneiden = async () => {
        await auswahlKopieren();
        const n = ausgewaehlt.length;
        ausgewaehlt.forEach(id => Store.trashBlock(id));
        auswahlLeeren();
        App.zeichneSeite();
        UI.toast(n + ' Blöcke ausgeschnitten');
    };
    const auswahlEinfuegen = () => {
        if (!ablage || !ablage.length)
            return false;
        const ziel = App.aktuelleSeite();
        ablage.forEach((d) => Store.baumEinfuegen(d, ziel));
        App.zeichneSeite();
        UI.toast(ablage.length + ' Blöcke eingefügt');
        return true;
    };
    /* Bei mehreren Blöcken wird der Typ direkt gesetzt statt über umwandeln():
       das würde für jeden Block die Seite neu zeichnen und den Cursor
       hineinsetzen — bei zwanzig Blöcken zwanzigmal. */
    const EINFACHE_TYPEN = ['text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number',
        'toggle', 'quote', 'callout', 'code'];
    const auswahlUmwandeln = (typId) => {
        const n = ausgewaehlt.length;
        if (!n)
            return;
        if (!EINFACHE_TYPEN.includes(typId)) {
            /* Alles andere braucht die volle Behandlung — dann eben einzeln */
            ausgewaehlt.forEach(id => umwandeln(id, typId));
            auswahlLeeren();
            return;
        }
        ausgewaehlt.forEach(id => Store.updateBlock(id, { type: typId }));
        App.zeichneSeite();
        setTimeout(auswahlZeigen, 0);
        UI.toast(n + ' Blöcke umgewandelt');
    };
    const auswahlTypMenue = (anker) => {
        const r = anker.getBoundingClientRect();
        /* Über `Menue.menu` statt von Hand: von Hand wurde dieses Menü am
           Telefon nie zum Blatt. Am Rechner stand es ÜBER dem Anker (die
           Auswahl-Leiste sitzt unten) — das Modul klemmt die Lage selbst ins
           Bild, also reicht ein Wunschpunkt oberhalb. */
        /* `EINFACHE_TYPEN`, nicht dieselbe Liste zum zweiten Mal. Sie stand
           dreiundzwanzig Zeilen weiter oben wörtlich genauso — und dieses Menü
           darf genau die Typen anbieten, die `auswahlUmwandeln` auch direkt
           setzen kann. Zwei Listen hiessen: ein Knopf, der nichts tut, oder ein
           Typ, den man nicht auswählen kann. */
        const m = Menue.menu(TYPEN.filter((t) => EINFACHE_TYPEN.includes(t.id))
            .map((t) => `<button data-t="${t.id}"><span class="mi">${t.icon}</span>${esc(t.name)}</button>`).join(''), Math.max(8, r.left), Math.max(8, r.top - 8 - 44 * EINFACHE_TYPEN.length), { titel: 'Umwandeln in' });
        m.addEventListener('click', e => {
            const b2 = elVon(e)?.closest('[data-t]');
            if (b2)
                auswahlUmwandeln(b2.dataset.t);
            document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
        });
    };
    const auswahlEinruecken = (raus) => {
        auswahlBloecke().forEach(b => raus ? ausruecken(b) : einruecken(b));
        App.zeichneSeite();
        setTimeout(auswahlZeigen, 0);
    };
    const auswahlVerschieben = (richtung) => {
        const liste = auswahlBloecke();
        if (!liste.length)
            return;
        /* Nach oben von oben her, nach unten von unten her — sonst überholen
           sich die Blöcke gegenseitig. */
        (richtung < 0 ? liste : liste.slice().reverse()).forEach(b => verschiebe(b, richtung));
        App.zeichneSeite();
        setTimeout(auswahlZeigen, 0);
    };
    /* --- Die Tasten, die nur bei aktiver Auswahl gelten -------------------- */
    const auswahlTaste = (e) => {
        if (!ausgewaehlt.length)
            return false;
        const reihe = sichtbareBloecke();
        const k = e.key;
        const strg = e.ctrlKey || e.metaKey;
        if (k === 'Escape') {
            e.preventDefault();
            auswahlLeeren();
            return true;
        }
        if (k === 'ArrowDown' || k === 'ArrowUp') {
            e.preventDefault();
            if (strg && e.shiftKey) {
                auswahlVerschieben(k === 'ArrowUp' ? -1 : 1);
                return true;
            }
            const letzte = ausgewaehlt[k === 'ArrowUp' ? 0 : ausgewaehlt.length - 1];
            const i = reihe.indexOf(letzte) + (k === 'ArrowUp' ? -1 : 1);
            if (i < 0 || i >= reihe.length)
                return true;
            const ziel2 = reihe[i];
            if (!ziel2)
                return true;
            if (e.shiftKey)
                auswahlBis(ziel2);
            else {
                ankerId = ziel2;
                auswahlSetzen([ziel2]);
            }
            return true;
        }
        if (strg && k.toLowerCase() === 'a') {
            e.preventDefault();
            ankerId = reihe[0];
            auswahlSetzen(reihe);
            return true;
        }
        if (strg && k.toLowerCase() === 'c') {
            e.preventDefault();
            auswahlKopieren();
            return true;
        }
        if (strg && k.toLowerCase() === 'x') {
            e.preventDefault();
            auswahlSchneiden();
            return true;
        }
        if (strg && k.toLowerCase() === 'v') {
            e.preventDefault();
            auswahlEinfuegen();
            return true;
        }
        if (strg && k.toLowerCase() === 'd') {
            e.preventDefault();
            auswahlDuplizieren();
            return true;
        }
        if (k === 'Backspace' || k === 'Delete') {
            e.preventDefault();
            auswahlLoeschen();
            return true;
        }
        if (k === 'Tab') {
            e.preventDefault();
            auswahlEinruecken(e.shiftKey);
            return true;
        }
        if (k === 'Enter') {
            e.preventDefault();
            const erste = document.querySelector(`#page .blk[data-bid="${ausgewaehlt[0]}"] .ct`);
            auswahlLeeren();
            if (erste)
                cursorAnsEnde(erste);
            return true;
        }
        /* Leertaste öffnet — bei einer Seite die Seite, bei einem Toggle
           das Toggle. Notion macht es genauso. */
        if (k === ' ' || k === 'Spacebar') {
            e.preventDefault();
            const b2 = Store.getBlock(ausgewaehlt[0]);
            if (!b2)
                return true;
            if (b2.type === 'page') {
                auswahlLeeren();
                App.oeffne(b2.id);
            }
            else if (b2.type === 'pageref' && b2.ziel) {
                auswahlLeeren();
                App.oeffne(b2.ziel);
            }
            else if (b2.type === 'toggle' || b2.toggleKopf) {
                ausgewaehlt.forEach(id => {
                    const x = Store.getBlock(id);
                    if (x && (x.type === 'toggle' || x.toggleKopf))
                        Store.updateBlock(id, { open: !x.open });
                });
                App.zeichneSeite();
                setTimeout(auswahlZeigen, 0);
            }
            else if (b2.type === 'todo') {
                ausgewaehlt.forEach(id => {
                    const x = Store.getBlock(id);
                    if (x && x.type === 'todo')
                        Store.updateBlock(id, { checked: !x.checked });
                });
                App.zeichneSeite();
                setTimeout(auswahlZeigen, 0);
            }
            return true;
        }
        /* Strg + Umschalt + Enter: die erste ausgewählte Seite rechts öffnen */
        if (strg && e.shiftKey && k === 'Enter') {
            const b2 = Store.getBlock(ausgewaehlt[0]);
            const ziel = b2 && (b2.type === 'page' ? b2.id : (b2.type === 'pageref' ? b2.ziel : null));
            if (ziel && typeof Fenster !== 'undefined') {
                e.preventDefault();
                auswahlLeeren();
                Fenster.teilen(ziel, 'quer');
            }
            return true;
        }
        /* Blocktyp für alle auf einmal — dieselben Ziffern wie im Einzelfall */
        const ziffer = /^[0-9]$/.test(k) ? k : (/^Digit([0-9])$/.exec(e.code || '') || [])[1];
        if (strg && (e.shiftKey || e.altKey) && ziffer) {
            e.preventDefault();
            /* Ohne die 9: eine Mehrfachauswahl lässt sich nicht in EINE Seite
               verwandeln — dafür gibt es „Verschieben nach". */
            const ohneSeite = { ...ZIFFER_TYP(), '9': '' };
            const ziel = ohneSeite[ziffer ?? ''];
            if (ziel)
                auswahlUmwandeln(ziel);
            return true;
        }
        return false;
    };
    /**
     * Einklinken. Wird von App einmal aufgerufen; ein zweiter Aufruf tut nichts.
     */
    let auswahlBereit = false;
    const auswahlEinklinken = () => {
        if (auswahlBereit)
            return;
        auswahlBereit = true;
        document.addEventListener('keydown', (e) => {
            if (auswahlTaste(e))
                return;
            /* Esc im Text wählt den Block aus — Notions Einstieg in die Auswahl */
            if (e.key === 'Escape' && !ausgewaehlt.length) {
                const aktiv2 = document.activeElement;
                const ct = aktiv2 instanceof HTMLElement ? aktiv2.closest('.ct') : null;
                const blk = ct && ct.closest('.blk');
                if (ct && blk && blk.dataset.bid && !document.querySelector('.overlay, .menu')) {
                    ct.blur();
                    ankerId = blk.dataset.bid;
                    auswahlSetzen([blk.dataset.bid]);
                }
            }
        }, true);
        /* Umschalt- und Strg-Klick auf einen Block */
        document.addEventListener('click', (e) => {
            const blk = elVon(e)?.closest('#page .blk[data-bid]');
            if (!blk) {
                if (ausgewaehlt.length && !elVon(e)?.closest('#auswahl-leiste, .menu'))
                    auswahlLeeren();
                return;
            }
            /* Ohne Alt: mit Alt+Umschalt gehört der Klick dem Einzel-Umschalter
               weiter unten — sonst fräse „bis hierher" jeden zweiten Alt-Klick. */
            if (e.shiftKey && !e.altKey && ankerId && blk.dataset.bid) {
                e.preventDefault();
                auswahlBis(blk.dataset.bid);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && ausgewaehlt.length) {
                e.preventDefault();
                const id = blk.dataset.bid;
                auswahlSetzen(ausgewaehlt.includes(id)
                    ? ausgewaehlt.filter(x => x !== id) : [...ausgewaehlt, id]);
                return;
            }
            /* Alt+Umschalt+Klick wählt den Block — auch als ERSTEN (Notions
               Griff, letzter L20-Rest). Strg+Klick kann nur erweitern, weil
               der blosse Klick dem Schreibzeiger gehört; diese Kombination
               darf die Auswahl auch beginnen. */
            if (e.altKey && e.shiftKey && blk.dataset.bid) {
                e.preventDefault();
                const id = blk.dataset.bid;
                ankerId = id;
                auswahlSetzen(ausgewaehlt.includes(id)
                    ? ausgewaehlt.filter(x => x !== id) : [...ausgewaehlt, id]);
                return;
            }
            /* Am Telefon gibt es keine Strg-Taste: solange die Auswahl steht,
               schaltet ein Tipp den Block dazu oder wieder weg (E84). Der
               letzte weggetippte Block beendet die Auswahl von selbst. */
            if (window.matchMedia('(max-width: 760px)').matches &&
                ausgewaehlt.length && blk.dataset.bid) {
                e.preventDefault();
                e.stopPropagation();
                const id = blk.dataset.bid;
                ankerId = id;
                auswahlSetzen(ausgewaehlt.includes(id)
                    ? ausgewaehlt.filter(x => x !== id) : [...ausgewaehlt, id]);
                return;
            }
            if (ausgewaehlt.length)
                auswahlLeeren();
        }, true);
        /* Der Tipp, der einen Block dazuschaltet, darf nicht nebenbei das
           Schreibfeld öffnen — der Fokus fällt beim mousedown, nicht beim
           click. Bei stehender Auswahl wird er am Telefon deshalb hier
           abgefangen; die Tastatur bleibt unten. */
        document.addEventListener('mousedown', (e) => {
            if (!window.matchMedia('(max-width: 760px)').matches || !ausgewaehlt.length)
                return;
            if (elVon(e)?.closest('#page .blk[data-bid]'))
                e.preventDefault();
        }, true);
    };
    return {
        TYPEN, typ, render, bindeEditor, umwandeln, umwandelnMenue, inline, esc,
        cursorAnsEnde, slashMenue, slashAktion, aktionAmEnde, AM_ENDE, alleToggles, einfuegenAmEnde, dupliziere, verschiebe, lege,
        blockVerschiebenNach, seitenPicker, blockMenue, datenbankWaehlen,
        knopfAusfuehren, eineAktion, AKTIONS_NAMEN,
        DIENSTE, einbettungsAdresse,
        /* Mehrfachauswahl */
        auswahlEinklinken, auswahlSetzen, auswahlLeeren, auswahlZeigen, auswahlBis,
        auswahlLoeschen, auswahlDuplizieren, auswahlKopieren, auswahlSchneiden,
        auswahlEinfuegen, auswahlUmwandeln, auswahlEinruecken, auswahlVerschieben,
        auswahlAlsText, auswahlTaste, sichtbareBloecke, auswahlTypMenue,
        /* Markdown in beide Richtungen */
        mdLesen, mdEinsetzen, mdIstStruktur, sprachName,
        auswahl: () => ausgewaehlt.slice()
    };
})();
