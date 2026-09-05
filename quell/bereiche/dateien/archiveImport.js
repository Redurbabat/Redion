"use strict";
/* ==========================================================================
 * ArchivImport — eine ZIP so ins Regal holen, wie sie ist (E350)
 * --------------------------------------------------------------------------
 * Redur: „wenn ich eine ZIP-Datei beim Dokumente-Teil hochlade, sollte die
 * ZIP so, wie sie ist, alles herausholen — eine Datei in einem Ordner soll
 * dort bleiben, also gleich wie es ist."
 *
 * Bis E350 wurde eine ZIP beim Hereinziehen ein Anhang — nachdem sie
 * vorher vollständig als TEXT in den Arbeitsspeicher gelesen worden war.
 * Der einzige Ordner-erhaltende ZIP-Weg war der Notion-Export, und der
 * machte aus jeder PDF einen Anhang.
 *
 * WAS DIESER WEG TUT:
 *   · Ordner werden Fächer (`heftArt: 'fach'`), verschachtelt so tief, wie
 *     das Archiv es ist. Ein Fach, das es unter demselben Eltern schon
 *     gibt, wird wiederverwendet — zweimal dieselbe ZIP legt keine
 *     Doppel-Fächer an.
 *   · Jede Datei wird EIN Dokument, so wie GoodNotes es zeigt: eine PDF
 *     wird über `PdfEinlesen.alsSeiten` zu Seiten mit Original, ein Bild
 *     eine Seite mit Bildblock, Text eine Seite, Word/Excel gehen ihren
 *     eigenen Leser, alles andere wird eine Seite mit Dateianhang.
 *   · Gelesen wird stückweise: `Einlesen.zipLesenAusBlob` schneidet je
 *     Eintrag einen Blob aus dem Archiv, `Dateien.ablegen` legt ihn in
 *     1-MB-Stücken ab. Das Archiv liegt nie ganz im Arbeitsspeicher (§9,
 *     §11, §36) — derselbe Weg, den der .redion-Import geht.
 *   · Eintragsnamen sind Fremddaten (§19/§40): `..`, absolute Pfade und
 *     Backslashes werden nicht angelegt, sondern gezählt und genannt;
 *     `__MACOSX`, `.DS_Store` und Co. fliegen still hinaus; eine ZIP in
 *     der ZIP wird NICHT entpackt (Zip-Bombe), sondern als Datei abgelegt.
 *   · Nichts wird überschrieben oder gelöscht (§46): ein Titel, den es im
 *     Fach schon gibt, bekommt „ (2)".
 *
 * Kein anderer Bereich wird importiert (§5): `PdfEinlesen`, `Einlesen`,
 * `Werkzeuge`, `Dateien` sind Globals mit typeof-Wache — so, wie es
 * `recognition.ts` und `werkzeuge.ts` seit E103 halten.
 * ========================================================================*/
const ArchivImport = (() => {
    const TEXT = /\.(md|markdown|txt)$/i;
    const HTML = /\.(html?|htm)$/i;
    const TABELLE = /\.(csv|tsv)$/i;
    const OFFICE = /\.(xlsx|xlsm|ods|docx|epub)$/i;
    /* HEIC zeigt kein Chromium und kein Firefox — bleibt eine Datei. */
    const BILD = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
    /* Steuerzeichen (0–31, 127) als Zeichenklasse — über Codes gebaut, damit
       kein unsichtbares Zeichen im Quelltext steht. */
    const STEUER = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(31) +
        String.fromCharCode(127) + ']', 'g');
    const BOM = new RegExp('^' + String.fromCharCode(0xFEFF));
    const MIME = {
        pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
        avif: 'image/avif', txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown',
        csv: 'text/csv', tsv: 'text/tab-separated-values', html: 'text/html', htm: 'text/html',
        mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav',
        zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ods: 'application/vnd.oasis.opendocument.spreadsheet', epub: 'application/epub+zip'
    };
    const mimeVon = (name) => MIME[(name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] ?? ''] ?? '';
    /* --- Pfade ------------------------------------------------------------ */
    /** Einen Archivpfad in Segmente zerlegen. `null` heisst: nicht sicher —
        `..`, `.`, leer nach dem Säubern. Backslashes gelten als Trenner, weil
        alte Windows-Packer sie schreiben. */
    const segmente = (roh) => {
        const teile = String(roh).replace(/\\/g, '/').split('/').filter(t => t.length > 0);
        if (!teile.length)
            return null;
        for (const t of teile)
            if (t === '.' || t === '..')
                return null;
        return teile;
    };
    /** Was kein Mensch im Regal sehen will: Apples Schattenordner, Finder-
        und Explorer-Beiwerk, AppleDouble-Dateien (`._foo`). */
    const istBeiwerk = (teile) => teile.some(t => t === '__MACOSX') ||
        /^(\.DS_Store|Thumbs\.db|desktop\.ini|\.directory)$/i.test(teile[teile.length - 1] ?? '') ||
        /^\._/.test(teile[teile.length - 1] ?? '');
    /** Ein Segment als Seitentitel: NFKC, ohne Steuerzeichen, höchstens 120. */
    const sauber = (segment) => {
        const s = String(segment).normalize('NFKC')
            .replace(STEUER, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
        return s || 'Ohne Namen';
    };
    const stammVon = (dateiName) => {
        const stamm = dateiName.replace(/\.[^.]+$/, '');
        return sauber(stamm || dateiName);
    };
    /* --- Fächer und Titel -------------------------------------------------- */
    const geschwister = (elternId) => (elternId ? Store.childrenOf(elternId) : Store.rootPages())
        .filter((k) => k && k.alive !== false && k.type === 'page');
    /** Ein Fach unter `elternId` — wiederverwendet, wenn es eines mit diesem
        Namen schon gibt. Nur ein FACH zählt als Treffer: eine gleichnamige
        gewöhnliche Seite könnte ein Dokument sein, und in ein Dokument legt
        man keine Ordner. */
    const fachFuer = (elternId, name) => {
        const da = geschwister(elternId).find((k) => !k.system && k.heftArt === 'fach' && String(k.text || '') === name);
        if (da)
            return { id: da.id, neu: false };
        const p = Store.addPage(elternId, { text: name, icon: '🗂', heftArt: 'fach' });
        return { id: p.id, neu: true };
    };
    /** Ein Titel, den es im Fach noch nicht gibt: „Skript", „Skript (2)", … */
    const freierTitel = (elternId, wunsch) => {
        const da = new Set(geschwister(elternId).map((k) => String(k.text || '')));
        if (!da.has(wunsch))
            return wunsch;
        for (let n = 2; n < 1000; n++) {
            const t = wunsch + ' (' + n + ')';
            if (!da.has(t))
                return t;
        }
        return wunsch + ' (' + Date.now() + ')';
    };
    /* --- Eine Datei wird ein Dokument ------------------------------------ */
    /**
     * Eine Datei als EIN Dokument unter `elternId` anlegen — so, wie das Regal
     * ein Dokument versteht. Wirft, wenn die Datei zu gross ist oder das
     * Ablegen scheitert; der Aufrufer zählt und nennt es.
     */
    const dateiAlsDokument = async (datei, elternId, opt = {}) => {
        const name = datei.name || 'Datei';
        const lower = name.toLowerCase();
        if (typeof Dateien !== 'undefined' && Dateien.GRENZE && datei.size > Dateien.GRENZE)
            throw new Error('ist grösser als ' + Dateien.groesseText(Dateien.GRENZE) + ' — so viel hält der Browser nicht.');
        /* Eine PDF wird ein Dokument mit Seiten (E103), das Original bleibt
           Byte für Byte als Anhang darin. Ohne Rückfrage je Datei (E350):
           „Nur die Seiten" und alle Seiten — genau das, was im Dokumentmodus
           gezeigt wird. */
        if (/\.pdf$/i.test(lower) && typeof PdfEinlesen !== 'undefined' && PdfEinlesen.alsSeiten) {
            const seite = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: '📕' });
            await PdfEinlesen.alsSeiten(datei, seite.id, { anordnung: opt.anordnung || 'untereinander', ueberGrenze: 'alle' });
            return { art: 'pdf', seiteId: seite.id };
        }
        if (OFFICE.test(lower) && typeof Einlesen !== 'undefined' && Einlesen.datei) {
            const erg = await Einlesen.datei(datei, elternId ?? undefined);
            if (erg)
                return { art: 'seite', seiteId: erg.seite ? erg.seite.id : null };
        }
        if (TEXT.test(lower)) {
            const p = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: '📄' });
            Werkzeuge.ausMarkdown(p, await datei.text());
            return { art: 'seite', seiteId: p.id };
        }
        if (HTML.test(lower)) {
            const p = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: '🌐' });
            Werkzeuge.ausHtml(p.id, await datei.text());
            return { art: 'seite', seiteId: p.id };
        }
        if (TABELLE.test(lower) && typeof Datenbank !== 'undefined' && Einlesen.alsDatenbank) {
            const titel = freierTitel(elternId, stammVon(name));
            const p = Store.addPage(elternId, { text: titel, icon: '📊' });
            const zeilen = Datenbank.csvZerlegen((await datei.text()).replace(BOM, ''));
            Einlesen.alsDatenbank(p.id, titel, zeilen);
            return { art: 'seite', seiteId: p.id };
        }
        /* Bild oder sonstige Datei: eine Seite mit einem Block, die Datei in
           Stücken — nie als Data-URL, auch wenn sie klein ist. So ist jedes
           Dokument aus einer ZIP gleich gebaut und gleich sicherbar (§14). Eine
           ZIP in der ZIP landet hier mit Absicht: nicht entpackt. */
        const istBild = BILD.test(lower);
        const seite = Store.addPage(elternId, { text: freierTitel(elternId, stammVon(name)), icon: istBild ? '🖼' : '📎' });
        const block = Store.addBlock(seite.id, istBild ? 'image' : 'file', istBild ? { caption: name } : { text: name, groesse: datei.size });
        const satz = await Dateien.ablegen(datei, { blockId: block.id, name });
        /* Nur die Kennung in den Block — die blob-Adresse gilt nur für diese
           Sitzung (E98); vorwärmen, damit das Bild sofort dasteht. */
        if (istBild)
            await Dateien.adresse(satz.id);
        Store.updateBlock(block.id, { dateiId: satz.id, typ: datei.type || mimeVon(name) });
        return { art: istBild ? 'bild' : 'anhang', seiteId: seite.id };
    };
    /* --- Die ZIP ----------------------------------------------------------- */
    const hinweisText = (e, zipName) => {
        const stuecke = [];
        if (e.pdfs)
            stuecke.push(e.pdfs + (e.pdfs === 1 ? ' PDF' : ' PDFs'));
        if (e.bilder)
            stuecke.push(e.bilder + (e.bilder === 1 ? ' Bild' : ' Bilder'));
        if (e.seiten)
            stuecke.push(e.seiten + (e.seiten === 1 ? ' Seite' : ' Seiten'));
        if (e.anhaenge)
            stuecke.push(e.anhaenge + (e.anhaenge === 1 ? ' Datei' : ' Dateien'));
        let s = '„' + zipName + '": ' + (stuecke.length ? stuecke.join(', ') : 'nichts Lesbares') +
            ' in ' + e.faecher + (e.faecher === 1 ? ' Fach' : ' Fächern');
        if (e.unveraendert)
            s += ' · ' + e.unveraendert + ' schon da (unverändert)';
        if (e.uebersprungen.length)
            s += ' · ' + e.uebersprungen.length + ' übersprungen';
        if (e.fehler.length)
            s += ' · ' + e.fehler.length + ' mit Fehler';
        return s;
    };
    /**
     * Die Ansicht neu zeichnen — und mit `wurzelId` DORTHIN GEHEN (E380).
     *
     * Bis hierher wurde nur aufgefrischt. Wer eine ZIP mit siebenundachtzig
     * Dateien entpackte, sah danach denselben Bildschirm wie vorher und einen
     * Toast, der neun Sekunden lang sagte, dass etwas passiert sei. Wo es
     * hingekommen war, musste er selbst suchen — und im flachen Regal lag der
     * neue Ordner zwischen sechzig frisch berührten Einzeldokumenten.
     *
     * Redur hat GoodNotes danebengehalten: dort ist man nach dem Entpacken
     * IM Ordner. Die Kennung dafür gab es die ganze Zeit — `importZip` setzt
     * sie seit E350 als `wurzelId` und niemand las sie.
     */
    const ansichtAuffrischen = (wurzelId) => {
        const ort = typeof App !== 'undefined' && App.schauplatz ? App.schauplatz() : '';
        const N = globalThis.Notebook;
        const ziel = wurzelId && typeof Store !== 'undefined' && Store.getBlock
            && Store.getBlock(wurzelId) ? String(wurzelId) : null;
        if (ziel && typeof Bibliothek !== 'undefined' && Bibliothek.oeffne) {
            /* Auch wenn man gerade woanders steht: nach dem Entpacken will man
               sehen, was entpackt wurde. Das ist keine Entführung, sondern die
               Antwort auf die Handlung, die man selbst ausgelöst hat. */
            Bibliothek.oeffne(ziel);
        }
        else if (ort === 'bibliothek' && typeof Bibliothek !== 'undefined')
            Bibliothek.oeffne();
        else if (ort === 'notizhefte' && N && N.oeffnen)
            N.oeffnen();
        else if (typeof App !== 'undefined') {
            App.zeichneSeite();
        }
        if (typeof App !== 'undefined' && App.zeichneBaum)
            App.zeichneBaum();
    };
    /**
     * Eine ZIP unter `zielId` (null = Wurzel) so anlegen, wie sie ist.
     * Liest stückweise, legt Fächer verschachtelt an, macht aus jeder Datei
     * ein Dokument, zählt, was nicht ging, und sagt es am Ende.
     */
    /**
     * DER PLAN — was in dieser ZIP steckt, ohne dass ein Byte entpackt ist.
     *
     * Eigener Schritt seit E365, und das ist der Angelpunkt der Wiederaufnahme:
     * derselbe Plan entsteht aus derselben ZIP immer wieder gleich (die
     * Reihenfolge kommt aus dem Inhaltsverzeichnis, nicht aus einer Uhr oder
     * einem Zufall). Ein unterbrochener Auftrag merkt sich deshalb nur die
     * STELLE — Nummer 40 von 87 — und nicht die Liste.
     */
    const planen = (zip, zipName) => {
        const gueltig = [];
        const uebersprungen = [];
        for (const name of zip.namen) {
            if (name.endsWith('/'))
                continue; /* Ordnereinträge: die Fächer entstehen aus den Dateipfaden */
            const teile = segmente(name);
            if (!teile) {
                uebersprungen.push(name + ' (unsicherer Pfad)');
                continue;
            }
            if (istBeiwerk(teile))
                continue;
            gueltig.push({ name, teile });
        }
        /* Liegt alles in EINEM obersten Ordner, ist der das Wurzel-Fach; sonst
           heisst das Wurzel-Fach wie die ZIP. So bleibt „Elektro.zip" mit
           „Elektro/…" darin ein Fach „Elektro" — nicht zwei. */
        const oberste = new Set(gueltig.map(e => e.teile[0]));
        const allesInEinem = gueltig.length > 0 && oberste.size === 1 &&
            gueltig.every(e => e.teile.length >= 2);
        const wurzelName = allesInEinem
            ? sauber([...oberste][0])
            : sauber((zipName || 'Archiv').replace(/\.zip$/i, ''));
        return { gueltig, allesInEinem, wurzelName, uebersprungen };
    };
    /** Wie viele Dokumente eine ZIP anlegen wird — für die Schrittzahl des
        Auftrags, bevor er beginnt. */
    const umfang = async (blob, zipName) => {
        if (typeof Einlesen === 'undefined' || !Einlesen.zipLesenAusBlob)
            return 0;
        return planen(await Einlesen.zipLesenAusBlob(blob), zipName).gueltig.length;
    };
    /* ========================================================================
     * WAS ES KOSTEN WIRD (E373, L114 Punkt 7)
     * ------------------------------------------------------------------------
     * Der Fortschritt in der Zeile sagt, WO man ist. Er sagt nicht, wie lange
     * es noch dauert — und das ist die Frage, die man vor dem Anfangen hat.
     * Vierzig Skripte à achtzig Seiten sind zwanzig Minuten; wer das vorher
     * weiss, holt Kaffee statt zu warten.
     *
     * Der Kern (`core/jobs/estimate.ts`) rechnet; hier wird nur gesammelt und
     * aufbewahrt. Die Erfahrung steht in `meta` unter `importErfahrung` und
     * wächst mit jedem Lauf.
     * ======================================================================*/
    const ERFAHRUNG_SCHLUESSEL = 'importErfahrung';
    const leeresMessbuch = () => ({ jeArt: {}, pdf: { seiten: 0, bytes: 0, ms: 0 } });
    const buchen = (buch, art, ms, pdf) => {
        if (!buch)
            return;
        const e = buch.jeArt[art] || (buch.jeArt[art] = { dateien: 0, ms: 0 });
        e.dateien += 1;
        /* Bei einer PDF gehört die SEITENZEIT nicht zur Datei — sonst zählte
           eine mit 300 Seiten wie eine mit zwei. Der Datei bleibt der Aufschlag
           fürs Öffnen, der Rest geht auf die Seiten. */
        if (pdf && pdf.seiten > 0) {
            const jeSeiteRoh = ms / pdf.seiten;
            buch.pdf.seiten += pdf.seiten;
            buch.pdf.bytes += pdf.bytes;
            buch.pdf.ms += ms;
            e.ms += Math.max(0, ms - jeSeiteRoh * pdf.seiten);
        }
        else {
            e.ms += ms;
        }
    };
    const erfahrungLesen = () => {
        if (typeof Schaetzer === 'undefined')
            return null;
        try {
            return Schaetzer.ausAblage(Store.getMeta(ERFAHRUNG_SCHLUESSEL, null));
        }
        catch {
            return Schaetzer.frisch();
        }
    };
    /** Die Posten einer ZIP, wie der Schätzer sie braucht: Art und Rohgrösse.
        Die Grösse steht im ZIP-Verzeichnis — dafür muss nichts entpackt
        werden. */
    const posten = (zip, gueltig) => {
        if (typeof Schaetzer === 'undefined')
            return [];
        const groesse = (name) => {
            try {
                const e = zip && typeof zip.eintrag === 'function' ? zip.eintrag(name) : null;
                return Math.max(0, Number(e?.groesse ?? 0) || 0);
            }
            catch {
                return 0;
            }
        };
        return gueltig.map(e => ({ art: Schaetzer.artVon(e.name), bytes: groesse(e.name) }));
    };
    /**
     * Was der Import kosten wird — Satz und Zahlen, oder null.
     *
     * LEER IST DER NORMALFALL: unter zwanzig Sekunden gibt der Kern keinen
     * Satz heraus, und dann steht hier nichts. Eine Anzeige, die immer etwas
     * anzeigt, wird nicht gelesen (E288).
     */
    const schaetzung = async (blob, zipName) => {
        if (typeof Schaetzer === 'undefined' || typeof Einlesen === 'undefined' ||
            !Einlesen.zipLesenAusBlob)
            return null;
        try {
            const zip = await Einlesen.zipLesenAusBlob(blob);
            const plan = planen(zip, zipName);
            const s = Schaetzer.schaetze(posten(zip, plan.gueltig), erfahrungLesen());
            return { ...s, satz: Schaetzer.satz(s) };
        }
        catch {
            return null;
        }
    };
    /** Was wirklich gebraucht wurde, in die Erfahrung einrechnen. */
    const lernen = (gemessen) => {
        if (typeof Schaetzer === 'undefined')
            return;
        try {
            Store.setMeta(ERFAHRUNG_SCHLUESSEL, Schaetzer.lerne(erfahrungLesen(), gemessen));
        }
        catch { /* ohne Ablage lernt es eben nicht */ }
    };
    const importZip = async (datei, zielId, opt = {}) => {
        if (typeof Einlesen === 'undefined' || !Einlesen.zipLesenAusBlob)
            throw new Error('Der ZIP-Leser ist nicht geladen.');
        const zip = await Einlesen.zipLesenAusBlob(datei);
        const ergebnis = {
            wurzelId: null, faecher: 0, dokumente: 0, pdfs: 0, bilder: 0, seiten: 0, anhaenge: 0,
            unveraendert: 0, uebersprungen: [], fehler: [], hinweis: ''
        };
        const plan = planen(zip, datei.name || 'Archiv');
        const gueltig = plan.gueltig;
        const allesInEinem = plan.allesInEinem;
        /* Beim Wiederaufnehmen sind die unsicheren Pfade schon gezählt. */
        const abBei = Math.max(0, Number(opt.abBei) || 0);
        if (!abBei)
            ergebnis.uebersprungen.push(...plan.uebersprungen);
        /* DAS WURZELFACH ÜBERLEBT DIE UNTERBRECHUNG (E365): beim Wiederaufnehmen
           kommt seine Kennung aus dem Auftrag, statt neu angelegt zu werden —
           `fachFuer` fände es zwar am Namen wieder, aber nur, solange niemand
           es umbenannt hat. */
        const vorgabe = opt.wurzelVorgabe ? Store.getBlock(opt.wurzelVorgabe) : null;
        const wurzel = vorgabe && vorgabe.alive !== false
            ? { id: String(opt.wurzelVorgabe), neu: false }
            : fachFuer(zielId, plan.wurzelName);
        ergebnis.wurzelId = wurzel.id;
        ergebnis.faecher = wurzel.neu ? 1 : 0;
        const faecher = new Map([['', wurzel.id]]);
        const fachAusPfad = (teile) => {
            const schluessel = teile.join('/');
            const da = faecher.get(schluessel);
            if (da)
                return da;
            const eltern = fachAusPfad(teile.slice(0, -1));
            const f = fachFuer(eltern, sauber(teile[teile.length - 1]));
            if (f.neu)
                ergebnis.faecher++;
            faecher.set(schluessel, f.id);
            return f.id;
        };
        const buch = leeresMessbuch();
        const melder = !opt.still && !opt.beiSchritt && typeof UI !== 'undefined' && UI.toast
            ? UI.toast('„' + datei.name + '" wird entpackt …', 600000) : null;
        let nr = abBei;
        /* JEDER EINTRAG IST EIN SCHRITT — auch einer, der übersprungen wird
           (E365, gefunden von test357 §4). Der erste Wurf meldete den Schritt
           nur nach einem angelegten Dokument; eine ZIP, deren Dateien alle
           schon da sind (E363), rückte damit nie vor: der Fortschritt stand
           bei 0 von 87, und eine Wiederaufnahme hätte wieder von vorn
           angefangen. Deshalb steht die Arbeit an einem Eintrag jetzt in einer
           eigenen Funktion, die `return` sagt statt `continue` — und der
           Schritt danach gilt immer. */
        const einenEintrag = async (e, dateiName, rel) => {
            /* Die ROHGRÖSSE steht im Verzeichnis, bevor ein Byte entpackt ist —
               ein Eintrag, der 1 KB gepackt und 10 GB roh ist, wird gar nicht
               erst durch den Entpacker geschickt. */
            const roh = zip.groesse ? Number(zip.groesse(e.name)) : -1;
            if (typeof Dateien !== 'undefined' && Dateien.GRENZE && roh > Dateien.GRENZE) {
                ergebnis.uebersprungen.push(dateiName + ' (grösser als ' + Dateien.groesseText(Dateien.GRENZE) + ')');
                return;
            }
            /* WAS DAS VERZEICHNIS SCHON WEISS (E363): verschlüsselt heisst
               übersprungen, bevor ein Byte gelesen ist; und aus Name, Grösse
               und Prüfsumme wird die Kennung, an der ein Dokument sich beim
               zweiten Einlesen wiedererkennt (L114 Punkt 6). Fächer werden
               weiterverwendet, ein unverändertes Dokument bleibt EINES —
               kein „ (2)" mehr für dieselbe Datei. Eine geänderte Datei ist
               eine andere Kennung und kommt daneben, wie bisher: nichts wird
               überschrieben, Anmerkungen am alten Dokument bleiben (§46). */
            const details = zip.eintrag ? zip.eintrag(e.name) : null;
            if (details && details.verschluesselt) {
                ergebnis.uebersprungen.push(dateiName + ' (verschlüsselt — Redion kann das nicht lesen)');
                return;
            }
            const elternId = fachAusPfad(rel.slice(0, -1));
            const kennung = details && Number.isFinite(Number(details.crc)) && roh >= 0
                ? 'zip:' + dateiName + '|' + roh + '|' + ZipDetails.crc32Hex(Number(details.crc)) : '';
            if (kennung && geschwister(elternId).some((k) => String(k.importKennung || '') === kennung)) {
                ergebnis.unveraendert++;
                return;
            }
            const blob = await zip.alsBlob(e.name);
            if (!blob) {
                ergebnis.uebersprungen.push(dateiName + ' (nicht lesbar)');
                return;
            }
            const f = new File([blob], dateiName, { type: mimeVon(dateiName) });
            /* GEMESSEN WIRD HIER, nicht hinterher geschätzt (E373). Eine
               Schätzung, die aus ihrer eigenen Schätzung lernt, wird nur
               selbstsicherer, nicht besser. */
            const t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
            const erg = await dateiAlsDokument(f, elternId, opt);
            const gebraucht = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
            if (erg.art === 'pdf') {
                const kinder = erg.seiteId ? Store.childrenOf(erg.seiteId) : [];
                const seiten = kinder.filter((k) => k && k.type === 'pdfseite').length;
                buchen(buch, 'pdf', gebraucht, { seiten, bytes: Math.max(0, roh > 0 ? roh : blob.size) });
            }
            else {
                buchen(buch, typeof Schaetzer !== 'undefined' ? Schaetzer.artVon(dateiName) : 'sonst', gebraucht);
            }
            if (kennung && erg.seiteId)
                Store.updateBlock(erg.seiteId, { importKennung: kennung });
            ergebnis.dokumente++;
            if (erg.art === 'pdf')
                ergebnis.pdfs++;
            else if (erg.art === 'bild')
                ergebnis.bilder++;
            else if (erg.art === 'seite')
                ergebnis.seiten++;
            else
                ergebnis.anhaenge++;
        };
        for (const e of gueltig.slice(abBei)) {
            nr++;
            /* ABBRECHEN HEISST HIER AUFHÖREN, nicht zurückrollen: was schon im
               Regal steht, bleibt stehen (§46). Der Auftrag merkt sich die
               Stelle, an der Schluss war. */
            if (opt.abgebrochen && opt.abgebrochen()) {
                ergebnis.abgebrochen = true;
                nr--;
                break;
            }
            const rel = allesInEinem ? e.teile.slice(1) : e.teile;
            const dateiName = rel[rel.length - 1];
            if (melder && melder.textContent !== undefined)
                melder.textContent = '„' + datei.name + '": Datei ' + nr + ' von ' + gueltig.length + ' — ' + dateiName;
            try {
                await einenEintrag(e, dateiName, rel);
            }
            catch (err) {
                const text = err instanceof Error ? err.message : String(err);
                /* Ein beschädigter Eintrag ist eine Eigenschaft der ZIP, kein Fehler
                   von Redion — er steht bei den Übersprungenen, mit Grund. */
                if (/beschädigt/.test(text))
                    ergebnis.uebersprungen.push(dateiName + ' (beschädigt — die Prüfsumme stimmt nicht)');
                else
                    ergebnis.fehler.push(dateiName + ': ' + text);
            }
            /* JEDE FERTIGE DATEI IST EIN WIEDERAUFSETZPUNKT (E365). Geschrieben
               wird sie vom Auftragsläufer; hier steht nur, WAS er schreiben soll. */
            if (opt.beiSchritt)
                await opt.beiSchritt({
                    index: nr, wurzelId: ergebnis.wurzelId,
                    zahlen: { faecher: ergebnis.faecher, dokumente: ergebnis.dokumente,
                        pdfs: ergebnis.pdfs, bilder: ergebnis.bilder, seiten: ergebnis.seiten,
                        anhaenge: ergebnis.anhaenge, unveraendert: ergebnis.unveraendert },
                    uebersprungen: ergebnis.uebersprungen.slice(-MERKGRENZE),
                    fehler: ergebnis.fehler.slice(-MERKGRENZE)
                }, dateiName + ' (' + nr + ' von ' + gueltig.length + ')');
            /* Zwischen zwei Dateien einmal atmen — die Oberfläche bleibt bedienbar. */
            await new Promise(f => setTimeout(f, 0));
        }
        if (melder && melder.remove)
            melder.remove();
        ergebnis.hinweis = hinweisText(ergebnis, datei.name || 'Archiv');
        /* Gelernt wird NUR aus einem Lauf, der auch etwas getan hat. Ein
           Abbruch nach drei Dateien würde die Zahlen sonst mit einer
           Stichprobe verschieben, die nichts über den Rest sagt. */
        if (!ergebnis.abgebrochen && ergebnis.dokumente > 0)
            lernen(buch);
        if (!opt.still && !opt.beiSchritt) {
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast(ergebnis.hinweis, 9000);
            ansichtAuffrischen(ergebnis.wurzelId || null);
        }
        return ergebnis;
    };
    /* ========================================================================
     * DER IMPORT ALS AUFTRAG (E365, L114 Punkt 1)
     * ------------------------------------------------------------------------
     * Bis hierher lief der Import im Tab. Wer ihn bei Datei 40 von 87 schloss,
     * hatte 39 Dokumente und KEIN WISSEN darüber, was fehlt — das war die
     * Lücke, und sie ist die unangenehme Sorte: es sieht aus, als sei alles da.
     *
     * Als Auftrag ist er dauerhaft. Dafür muss die ZIP selbst dauerhaft sein:
     * ein `File` aus dem Dateiwähler überlebt kein Neuladen, also wandert sie
     * zuerst in die Ablage — als ABGELEITETE Datei (E103), damit sie nicht mit
     * in die Wolke geht und beim Aufräumen erkannt wird. Der Auftrag trägt nur
     * ihre Kennung; nach dem letzten Dokument wird die Arbeitskopie gelöscht.
     *
     * Ist die ZIP grösser als die Ablage sie nimmt, gibt es keinen Auftrag,
     * sondern den direkten Lauf mit einem ehrlichen Satz dazu.
     * ======================================================================*/
    const AUFTRAG_ART = 'zip-import';
    /** So viele Namen je Liste wandern in den Auftrag — er soll nicht wachsen. */
    const MERKGRENZE = 50;
    const leereZahlen = () => ({ faecher: 0, dokumente: 0, pdfs: 0, bilder: 0, seiten: 0, anhaenge: 0, unveraendert: 0 });
    /**
     * Der Läufer. Er bekommt den Auftrag und die Hilfe der Maschine und
     * arbeitet die ZIP ab — beim ersten Mal von vorn, danach ab der Stelle,
     * die im Auftrag steht.
     */
    const zipLaeufer = async (auftrag, hilfe) => {
        const ein = auftrag && auftrag.eingabe ? auftrag.eingabe : {};
        const dateiId = String(ein.dateiId || '');
        const zipName = String(ein.zipName || 'Archiv.zip');
        if (!dateiId)
            throw new Error('Dem Auftrag fehlt die Kennung der ZIP.');
        if (typeof Dateien === 'undefined' || !Dateien.alsBlob)
            throw new Error('Die Dateiablage steht nicht.');
        const blob = await Dateien.alsBlob(dateiId);
        if (!blob)
            throw new Error('Die Arbeitskopie der ZIP ist nicht mehr da — bitte noch einmal einlesen.');
        const stand = auftrag.stand && typeof auftrag.stand === 'object' ? auftrag.stand : null;
        const erg = await importZip(new File([blob], zipName, { type: 'application/zip' }), ein.zielId ? String(ein.zielId) : null, { anordnung: ein.anordnung, still: true,
            abBei: Math.max(0, Number(stand?.index) || 0),
            wurzelVorgabe: stand?.wurzelId ? String(stand.wurzelId) : null,
            beiSchritt: (s, text) => hilfe.schritt(s, text),
            abgebrochen: () => hilfe.abgebrochen() });
        /* Die Zahlen des Laufs sind die DIESES Durchgangs; was ein früherer
           Durchgang schon geschafft hat, steht im Stand. Zusammengezählt wird
           für den Menschen, nicht für die Ablage. */
        const vorher = stand?.zahlen || leereZahlen();
        const gesamt = {
            faecher: vorher.faecher + erg.faecher, dokumente: vorher.dokumente + erg.dokumente,
            pdfs: vorher.pdfs + erg.pdfs, bilder: vorher.bilder + erg.bilder,
            seiten: vorher.seiten + erg.seiten, anhaenge: vorher.anhaenge + erg.anhaenge,
            unveraendert: vorher.unveraendert + erg.unveraendert
        };
        const ganz = { ...erg, ...gesamt, wurzelId: erg.wurzelId,
            uebersprungen: [...(stand?.uebersprungen || []), ...erg.uebersprungen].slice(-MERKGRENZE),
            fehler: [...(stand?.fehler || []), ...erg.fehler].slice(-MERKGRENZE), hinweis: '' };
        ganz.hinweis = hinweisText(ganz, zipName);
        /* Die Arbeitskopie geht — aber nur, wenn wirklich Schluss ist. Bei einem
           Abbruch bleibt sie liegen: der Auftrag lässt sich wieder aufnehmen. */
        if (!erg.abgebrochen && typeof Dateien.weg === 'function') {
            try {
                await Dateien.weg(dateiId);
            }
            catch { /* dann liegt sie eben noch da */ }
        }
        return { ...ganz, abgebrochen: !!erg.abgebrochen, dateiId };
    };
    if (typeof Auftraege !== 'undefined' && Auftraege.anmelden)
        Auftraege.anmelden(AUFTRAG_ART, zipLaeufer, 'ZIP entpacken');
    /* Was der Mensch davon sieht: das Auftragsfenster zeigt den Fortschritt
       von selbst (E286). Hier wird nur die ANSICHT aufgefrischt, wenn ein
       Lauf zu Ende ist — sonst stünde das Regal still, obwohl fünfzig
       Dokumente darin liegen. */
    if (typeof Ereignisse !== 'undefined' && Ereignisse.horche) {
        try {
            Ereignisse.horche(ARTEN.auftragBeendet, (d) => {
                if (!d || d.art !== AUFTRAG_ART)
                    return;
                /* WOHIN, STEHT IM FERTIGEN AUFTRAG (E380). Die Meldung selbst trägt
                   nur `{id, art, zustand}` — das Ergebnis des Läufers landet im
                   Auftrag unter `stand` (maschine.ts:474). Von dort kommt die
                   Kennung des entstandenen Wurzelfachs.
        
                   Ein ABGEBROCHENER Lauf springt nicht: dort ist die Hälfte da, und
                   den Bildschirm eines Menschen wegzuschieben, während er etwas
                   anderes tut, wäre keine Antwort, sondern eine Störung. */
                if (d.zustand !== 'fertig') {
                    ansichtAuffrischen();
                    return;
                }
                const holen = (typeof Auftraege !== 'undefined' && Auftraege.einer)
                    ? Auftraege.einer(String(d.id)) : null;
                Promise.resolve(holen).then((a) => {
                    const wurzel = a && a.stand && a.stand.wurzelId ? String(a.stand.wurzelId) : null;
                    ansichtAuffrischen(wurzel);
                }).catch(() => ansichtAuffrischen());
            });
        }
        catch { /* ohne Bus frischt der nächste Klick auf */ }
    }
    /**
     * Eine ZIP als Auftrag einlesen.
     *
     * Gibt den AUFTRAG zurück, nicht das Ergebnis — der Aufrufer wartet nicht
     * mehr auf siebenundachtzig Dateien.
     */
    const alsAuftrag = async (datei, zielId = null, opt = {}) => {
        const name = datei.name || 'Archiv.zip';
        if (typeof Auftraege === 'undefined' || !Auftraege.anlegen ||
            typeof Dateien === 'undefined' || !Dateien.ablegen) {
            /* Ohne Maschine bleibt der alte Weg — und der Mensch erfährt, dass er
               den Tab offen lassen muss. */
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast('„' + name + '" wird hier im Fenster entpackt — bitte offen lassen.', 6000);
            return { auftrag: null, grund: 'ohne Maschine', ergebnis: await importZip(datei, zielId, opt) };
        }
        if (Dateien.GRENZE && datei.size > Dateien.GRENZE) {
            if (typeof UI !== 'undefined' && UI.toast)
                UI.toast('„' + name + '" ist grösser als ' + Dateien.groesseText(Dateien.GRENZE) +
                    ' — sie wird hier im Fenster entpackt, bitte offen lassen.', 8000);
            return { auftrag: null, grund: 'zu gross', ergebnis: await importZip(datei, zielId, opt) };
        }
        const vorab = await schaetzung(datei, name);
        const schritte = await umfang(datei, name);
        if (!schritte) {
            const ergebnis = await importZip(datei, zielId, opt);
            return { auftrag: null, grund: 'nichts Lesbares', ergebnis };
        }
        /* Die Arbeitskopie: abgeleitet, ohne Block — sie gehört keinem Dokument,
           sondern dem Auftrag. */
        const satz = await Dateien.ablegen(datei, { name, abgeleitet: true });
        const auftrag = await Auftraege.anlegen(AUFTRAG_ART, { dateiId: satz.id, zipName: name, zielId: zielId || null,
            anordnung: opt.anordnung || 'untereinander',
            /* Die Schätzung reist mit dem Auftrag: sie steht auch dann noch da,
               wenn der Tab dazwischen zu war (E365). */
            schaetzungMs: vorab && vorab.ms ? vorab.ms : 0 }, { schritte, text: '„' + name + '" wird entpackt' });
        /* DER SATZ ÜBER DIE ZEIT KOMMT NUR, WENN ES EINEN GIBT. Unter zwanzig
           Sekunden gibt der Schätzer nichts heraus, und dann steht hier auch
           nichts — sonst läse ihn nach der dritten ZIP niemand mehr (E288). */
        if (!opt.still && typeof UI !== 'undefined' && UI.toast) {
            const zeit = vorab && vorab.satz ? ' · ' + vorab.satz : '';
            UI.toast('„' + name + '": ' + schritte + (schritte === 1 ? ' Datei' : ' Dateien') + zeit +
                ' — läuft im Hintergrund weiter, auch wenn du weggehst.', zeit ? 9000 : 7000);
        }
        return { auftrag, schaetzung: vorab };
    };
    /** Der Dateiwähler — wie `PdfEinlesen.waehlen`, aber für eine ZIP.
        Seit E365 legt er einen AUFTRAG an; zurück kommt, was `alsAuftrag`
        sagt (der Auftrag, oder das Ergebnis des direkten Laufs). */
    const waehlen = (zielId = null) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,application/zip,application/x-zip-compressed';
        input.style.display = 'none';
        document.body.appendChild(input);
        return new Promise(fertig => {
            let entschieden = false;
            const auf = async () => {
                if (entschieden)
                    return;
                entschieden = true;
                const f = input.files?.[0];
                input.remove();
                if (!f) {
                    fertig(null);
                    return;
                }
                try {
                    fertig(await alsAuftrag(f, zielId));
                }
                catch (e) {
                    if (typeof UI !== 'undefined')
                        UI.toast('Die ZIP liess sich nicht entpacken: ' +
                            (e instanceof Error ? e.message : String(e)));
                    fertig(null);
                }
            };
            input.addEventListener('change', () => { void auf(); });
            input.addEventListener('cancel', () => {
                if (entschieden)
                    return;
                entschieden = true;
                input.remove();
                fertig(null);
            });
            input.click();
        });
    };
    /* `zipLaeufer` steht im Rückgabeobjekt, damit ein Prüflauf den Zustand
       eines geschlossenen Tabs herstellen kann: Auftrag mit Stand hinein,
       abgebrochen heraus, und noch einmal hinein. Die Maschine ruft ihn
       ohnehin — hier ist er nur benennbar. */
    return { importZip, alsAuftrag, zipLaeufer, umfang, planen, AUFTRAG_ART, dateiAlsDokument, waehlen,
        ansichtAuffrischen, segmente, istBeiwerk, sauber,
        schaetzung, lernen, erfahrungLesen, ERFAHRUNG_SCHLUESSEL };
})();
window.ArchivImport = ArchivImport;
