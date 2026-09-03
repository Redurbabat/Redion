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
  type Anordnung = 'untereinander' | 'nebeneinander';
  /** `abBei`, `beiSchritt` und `abgebrochen` füllt der Auftragsläufer —
      im direkten Lauf sind sie leer und alles bleibt, wie es war. */
  type Optionen = { anordnung?: Anordnung; still?: boolean;
                    abBei?: number; wurzelVorgabe?: string | null;
                    beiSchritt?: (stand: Zwischenstand, text: string) => Promise<void> | void;
                    abgebrochen?: () => boolean };
  type Zahlen = { faecher: number; dokumente: number; pdfs: number; bilder: number;
                  seiten: number; anhaenge: number; unveraendert: number };
  /** Was ein unterbrochener Lauf braucht, um weiterzumachen: die Stelle im
      Plan, das Wurzelfach und die Zahlen. Mehr nicht — der Plan selbst
      entsteht beim Wiederaufnehmen neu aus derselben ZIP. */
  type Zwischenstand = { index: number; wurzelId: string | null; zahlen: Zahlen;
                         uebersprungen: string[]; fehler: string[] };
  type Ergebnis = {
    wurzelId: string | null; faecher: number; dokumente: number;
    pdfs: number; bilder: number; seiten: number; anhaenge: number;
    /* Schon da, unverändert — beim zweiten Einlesen derselben ZIP (E363). */
    unveraendert: number;
    uebersprungen: string[]; fehler: string[]; hinweis: string;
    /** Gesetzt, wenn der Lauf als Auftrag lief (E365) — sonst leer. */
    auftragId?: string;
    abgebrochen?: boolean;
  };
  type Eintrag = { name: string; teile: string[] };

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
  const MIME: Record<string, string> = {
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp',
    avif: 'image/avif', txt: 'text/plain', md: 'text/markdown', markdown: 'text/markdown',
    csv: 'text/csv', tsv: 'text/tab-separated-values', html: 'text/html', htm: 'text/html',
    mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav',
    zip: 'application/zip', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ods: 'application/vnd.oasis.opendocument.spreadsheet', epub: 'application/epub+zip'
  };
  const mimeVon = (name: string): string =>
    MIME[(name.toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] ?? ''] ?? '';

  /* --- Pfade ------------------------------------------------------------ */

  /** Einen Archivpfad in Segmente zerlegen. `null` heisst: nicht sicher —
      `..`, `.`, leer nach dem Säubern. Backslashes gelten als Trenner, weil
      alte Windows-Packer sie schreiben. */
  const segmente = (roh: string): string[] | null => {
    const teile = String(roh).replace(/\\/g, '/').split('/').filter(t => t.length > 0);
    if (!teile.length) return null;
    for (const t of teile) if (t === '.' || t === '..') return null;
    return teile;
  };

  /** Was kein Mensch im Regal sehen will: Apples Schattenordner, Finder-
      und Explorer-Beiwerk, AppleDouble-Dateien (`._foo`). */
  const istBeiwerk = (teile: string[]): boolean =>
    teile.some(t => t === '__MACOSX') ||
    /^(\.DS_Store|Thumbs\.db|desktop\.ini|\.directory)$/i.test(teile[teile.length - 1] ?? '') ||
    /^\._/.test(teile[teile.length - 1] ?? '');

  /** Ein Segment als Seitentitel: NFKC, ohne Steuerzeichen, höchstens 120. */
  const sauber = (segment: string): string => {
    const s = String(segment).normalize('NFKC')
      .replace(STEUER, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
    return s || 'Ohne Namen';
  };

  const stammVon = (dateiName: string): string => {
    const stamm = dateiName.replace(/\.[^.]+$/, '');
    return sauber(stamm || dateiName);
  };

  /* --- Fächer und Titel -------------------------------------------------- */

  const geschwister = (elternId: string | null): any[] =>
    (elternId ? Store.childrenOf(elternId) : Store.rootPages())
      .filter((k: any) => k && k.alive !== false && k.type === 'page');

  /** Ein Fach unter `elternId` — wiederverwendet, wenn es eines mit diesem
      Namen schon gibt. Nur ein FACH zählt als Treffer: eine gleichnamige
      gewöhnliche Seite könnte ein Dokument sein, und in ein Dokument legt
      man keine Ordner. */
  const fachFuer = (elternId: string | null, name: string): { id: string; neu: boolean } => {
    const da = geschwister(elternId).find((k: any) =>
      !k.system && k.heftArt === 'fach' && String(k.text || '') === name);
    if (da) return { id: da.id, neu: false };
    const p = Store.addPage(elternId, { text: name, icon: '🗂', heftArt: 'fach' });
    return { id: p.id, neu: true };
  };

  /** Ein Titel, den es im Fach noch nicht gibt: „Skript", „Skript (2)", … */
  const freierTitel = (elternId: string | null, wunsch: string): string => {
    const da = new Set(geschwister(elternId).map((k: any) => String(k.text || '')));
    if (!da.has(wunsch)) return wunsch;
    for (let n = 2; n < 1000; n++) {
      const t = wunsch + ' (' + n + ')';
      if (!da.has(t)) return t;
    }
    return wunsch + ' (' + Date.now() + ')';
  };

  /* --- Eine Datei wird ein Dokument ------------------------------------ */

  /**
   * Eine Datei als EIN Dokument unter `elternId` anlegen — so, wie das Regal
   * ein Dokument versteht. Wirft, wenn die Datei zu gross ist oder das
   * Ablegen scheitert; der Aufrufer zählt und nennt es.
   */
  const dateiAlsDokument = async (datei: File, elternId: string | null, opt: Optionen = {}):
      Promise<{ art: 'pdf' | 'bild' | 'seite' | 'anhang'; seiteId: string | null }> => {
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
      await PdfEinlesen.alsSeiten(datei, seite.id,
        { anordnung: opt.anordnung || 'untereinander', ueberGrenze: 'alle' });
      return { art: 'pdf', seiteId: seite.id };
    }

    if (OFFICE.test(lower) && typeof Einlesen !== 'undefined' && Einlesen.datei) {
      const erg = await Einlesen.datei(datei, elternId ?? undefined);
      if (erg) return { art: 'seite', seiteId: erg.seite ? erg.seite.id : null };
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
    const block = Store.addBlock(seite.id, istBild ? 'image' : 'file',
      istBild ? { caption: name } : { text: name, groesse: datei.size });
    const satz = await Dateien.ablegen(datei, { blockId: block.id, name });
    /* Nur die Kennung in den Block — die blob-Adresse gilt nur für diese
       Sitzung (E98); vorwärmen, damit das Bild sofort dasteht. */
    if (istBild) await Dateien.adresse(satz.id);
    Store.updateBlock(block.id, { dateiId: satz.id, typ: datei.type || mimeVon(name) });
    return { art: istBild ? 'bild' : 'anhang', seiteId: seite.id };
  };

  /* --- Die ZIP ----------------------------------------------------------- */

  const hinweisText = (e: Ergebnis, zipName: string): string => {
    const stuecke: string[] = [];
    if (e.pdfs) stuecke.push(e.pdfs + (e.pdfs === 1 ? ' PDF' : ' PDFs'));
    if (e.bilder) stuecke.push(e.bilder + (e.bilder === 1 ? ' Bild' : ' Bilder'));
    if (e.seiten) stuecke.push(e.seiten + (e.seiten === 1 ? ' Seite' : ' Seiten'));
    if (e.anhaenge) stuecke.push(e.anhaenge + (e.anhaenge === 1 ? ' Datei' : ' Dateien'));
    let s = '„' + zipName + '": ' + (stuecke.length ? stuecke.join(', ') : 'nichts Lesbares') +
            ' in ' + e.faecher + (e.faecher === 1 ? ' Fach' : ' Fächern');
    if (e.unveraendert) s += ' · ' + e.unveraendert + ' schon da (unverändert)';
    if (e.uebersprungen.length) s += ' · ' + e.uebersprungen.length + ' übersprungen';
    if (e.fehler.length) s += ' · ' + e.fehler.length + ' mit Fehler';
    return s;
  };

  /** Die Ansicht neu zeichnen, in der man gerade steht — Regal, Notizhefte
      oder die offene Seite. */
  const ansichtAuffrischen = (): void => {
    const ort = typeof App !== 'undefined' && App.schauplatz ? App.schauplatz() : '';
    const N = (globalThis as any).Notebook;
    if (ort === 'bibliothek' && typeof Bibliothek !== 'undefined') Bibliothek.oeffne();
    else if (ort === 'notizhefte' && N && N.oeffnen) N.oeffnen();
    else if (typeof App !== 'undefined') { App.zeichneSeite(); }
    if (typeof App !== 'undefined' && App.zeichneBaum) App.zeichneBaum();
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
  const planen = (zip: any, zipName: string): { gueltig: Eintrag[]; allesInEinem: boolean;
                                                wurzelName: string; uebersprungen: string[] } => {
    const gueltig: Eintrag[] = [];
    const uebersprungen: string[] = [];
    for (const name of zip.namen as string[]) {
      if (name.endsWith('/')) continue;   /* Ordnereinträge: die Fächer entstehen aus den Dateipfaden */
      const teile = segmente(name);
      if (!teile) { uebersprungen.push(name + ' (unsicherer Pfad)'); continue; }
      if (istBeiwerk(teile)) continue;
      gueltig.push({ name, teile });
    }
    /* Liegt alles in EINEM obersten Ordner, ist der das Wurzel-Fach; sonst
       heisst das Wurzel-Fach wie die ZIP. So bleibt „Elektro.zip" mit
       „Elektro/…" darin ein Fach „Elektro" — nicht zwei. */
    const oberste = new Set(gueltig.map(e => e.teile[0]));
    const allesInEinem = gueltig.length > 0 && oberste.size === 1 &&
                         gueltig.every(e => e.teile.length >= 2);
    const wurzelName = allesInEinem
      ? sauber([...oberste][0] as string)
      : sauber((zipName || 'Archiv').replace(/\.zip$/i, ''));
    return { gueltig, allesInEinem, wurzelName, uebersprungen };
  };

  /** Wie viele Dokumente eine ZIP anlegen wird — für die Schrittzahl des
      Auftrags, bevor er beginnt. */
  const umfang = async (blob: Blob, zipName: string): Promise<number> => {
    if (typeof Einlesen === 'undefined' || !Einlesen.zipLesenAusBlob) return 0;
    return planen(await Einlesen.zipLesenAusBlob(blob), zipName).gueltig.length;
  };

  const importZip = async (datei: File, zielId: string | null, opt: Optionen = {}): Promise<Ergebnis> => {
    if (typeof Einlesen === 'undefined' || !Einlesen.zipLesenAusBlob)
      throw new Error('Der ZIP-Leser ist nicht geladen.');
    const zip = await Einlesen.zipLesenAusBlob(datei);
    const ergebnis: Ergebnis = {
      wurzelId: null, faecher: 0, dokumente: 0, pdfs: 0, bilder: 0, seiten: 0, anhaenge: 0,
      unveraendert: 0, uebersprungen: [], fehler: [], hinweis: ''
    };

    const plan = planen(zip, datei.name || 'Archiv');
    const gueltig = plan.gueltig;
    const allesInEinem = plan.allesInEinem;
    /* Beim Wiederaufnehmen sind die unsicheren Pfade schon gezählt. */
    const abBei = Math.max(0, Number(opt.abBei) || 0);
    if (!abBei) ergebnis.uebersprungen.push(...plan.uebersprungen);

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
    const faecher = new Map<string, string>([['', wurzel.id]]);
    const fachAusPfad = (teile: string[]): string => {
      const schluessel = teile.join('/');
      const da = faecher.get(schluessel);
      if (da) return da;
      const eltern = fachAusPfad(teile.slice(0, -1));
      const f = fachFuer(eltern, sauber(teile[teile.length - 1] as string));
      if (f.neu) ergebnis.faecher++;
      faecher.set(schluessel, f.id);
      return f.id;
    };

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
    const einenEintrag = async (e: Eintrag, dateiName: string, rel: string[]): Promise<void> => {
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
      if (kennung && geschwister(elternId).some((k: any) => String(k.importKennung || '') === kennung)) {
        ergebnis.unveraendert++;
        return;
      }
      const blob = await zip.alsBlob(e.name);
      if (!blob) { ergebnis.uebersprungen.push(dateiName + ' (nicht lesbar)'); return; }
      const f = new File([blob], dateiName, { type: mimeVon(dateiName) });
      const erg = await dateiAlsDokument(f, elternId, opt);
      if (kennung && erg.seiteId) Store.updateBlock(erg.seiteId, { importKennung: kennung });
      ergebnis.dokumente++;
      if (erg.art === 'pdf') ergebnis.pdfs++;
      else if (erg.art === 'bild') ergebnis.bilder++;
      else if (erg.art === 'seite') ergebnis.seiten++;
      else ergebnis.anhaenge++;
    };

    for (const e of gueltig.slice(abBei)) {
      nr++;
      /* ABBRECHEN HEISST HIER AUFHÖREN, nicht zurückrollen: was schon im
         Regal steht, bleibt stehen (§46). Der Auftrag merkt sich die
         Stelle, an der Schluss war. */
      if (opt.abgebrochen && opt.abgebrochen()) { ergebnis.abgebrochen = true; nr--; break; }
      const rel = allesInEinem ? e.teile.slice(1) : e.teile;
      const dateiName = rel[rel.length - 1] as string;
      if (melder && melder.textContent !== undefined)
        melder.textContent = '„' + datei.name + '": Datei ' + nr + ' von ' + gueltig.length + ' — ' + dateiName;
      try {
        await einenEintrag(e, dateiName, rel);
      } catch (err: unknown) {
        const text = err instanceof Error ? err.message : String(err);
        /* Ein beschädigter Eintrag ist eine Eigenschaft der ZIP, kein Fehler
           von Redion — er steht bei den Übersprungenen, mit Grund. */
        if (/beschädigt/.test(text)) ergebnis.uebersprungen.push(dateiName + ' (beschädigt — die Prüfsumme stimmt nicht)');
        else ergebnis.fehler.push(dateiName + ': ' + text);
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
    if (melder && melder.remove) melder.remove();
    ergebnis.hinweis = hinweisText(ergebnis, datei.name || 'Archiv');
    if (!opt.still && !opt.beiSchritt) {
      if (typeof UI !== 'undefined' && UI.toast) UI.toast(ergebnis.hinweis, 9000);
      ansichtAuffrischen();
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

  const leereZahlen = (): Zahlen =>
    ({ faecher: 0, dokumente: 0, pdfs: 0, bilder: 0, seiten: 0, anhaenge: 0, unveraendert: 0 });

  /**
   * Der Läufer. Er bekommt den Auftrag und die Hilfe der Maschine und
   * arbeitet die ZIP ab — beim ersten Mal von vorn, danach ab der Stelle,
   * die im Auftrag steht.
   */
  const zipLaeufer = async (auftrag: any, hilfe: any): Promise<unknown> => {
    const ein = auftrag && auftrag.eingabe ? auftrag.eingabe : {};
    const dateiId = String(ein.dateiId || '');
    const zipName = String(ein.zipName || 'Archiv.zip');
    if (!dateiId) throw new Error('Dem Auftrag fehlt die Kennung der ZIP.');
    if (typeof Dateien === 'undefined' || !Dateien.alsBlob)
      throw new Error('Die Dateiablage steht nicht.');
    const blob = await Dateien.alsBlob(dateiId);
    if (!blob) throw new Error('Die Arbeitskopie der ZIP ist nicht mehr da — bitte noch einmal einlesen.');

    const stand = auftrag.stand && typeof auftrag.stand === 'object' ? auftrag.stand : null;
    const erg = await importZip(new File([blob], zipName, { type: 'application/zip' }),
      ein.zielId ? String(ein.zielId) : null,
      { anordnung: ein.anordnung, still: true,
        abBei: Math.max(0, Number(stand?.index) || 0),
        wurzelVorgabe: stand?.wurzelId ? String(stand.wurzelId) : null,
        beiSchritt: (s: Zwischenstand, text: string) => hilfe.schritt(s, text),
        abgebrochen: () => hilfe.abgebrochen() });

    /* Die Zahlen des Laufs sind die DIESES Durchgangs; was ein früherer
       Durchgang schon geschafft hat, steht im Stand. Zusammengezählt wird
       für den Menschen, nicht für die Ablage. */
    const vorher: Zahlen = (stand?.zahlen as Zahlen) || leereZahlen();
    const gesamt: Zahlen = {
      faecher: vorher.faecher + erg.faecher, dokumente: vorher.dokumente + erg.dokumente,
      pdfs: vorher.pdfs + erg.pdfs, bilder: vorher.bilder + erg.bilder,
      seiten: vorher.seiten + erg.seiten, anhaenge: vorher.anhaenge + erg.anhaenge,
      unveraendert: vorher.unveraendert + erg.unveraendert
    };
    const ganz: Ergebnis = { ...erg, ...gesamt, wurzelId: erg.wurzelId,
      uebersprungen: [...(stand?.uebersprungen || []), ...erg.uebersprungen].slice(-MERKGRENZE),
      fehler: [...(stand?.fehler || []), ...erg.fehler].slice(-MERKGRENZE), hinweis: '' };
    ganz.hinweis = hinweisText(ganz, zipName);

    /* Die Arbeitskopie geht — aber nur, wenn wirklich Schluss ist. Bei einem
       Abbruch bleibt sie liegen: der Auftrag lässt sich wieder aufnehmen. */
    if (!erg.abgebrochen && typeof Dateien.weg === 'function') {
      try { await Dateien.weg(dateiId); } catch { /* dann liegt sie eben noch da */ }
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
      Ereignisse.horche('auftrag.beendet', (d: any) => {
        if (!d || d.art !== AUFTRAG_ART) return;
        ansichtAuffrischen();
      });
    } catch { /* ohne Bus frischt der nächste Klick auf */ }
  }

  /**
   * Eine ZIP als Auftrag einlesen.
   *
   * Gibt den AUFTRAG zurück, nicht das Ergebnis — der Aufrufer wartet nicht
   * mehr auf siebenundachtzig Dateien.
   */
  const alsAuftrag = async (datei: File, zielId: string | null = null,
                            opt: Optionen = {}): Promise<{ auftrag: any; grund?: string; ergebnis?: Ergebnis }> => {
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

    const schritte = await umfang(datei, name);
    if (!schritte) {
      const ergebnis = await importZip(datei, zielId, opt);
      return { auftrag: null, grund: 'nichts Lesbares', ergebnis };
    }
    /* Die Arbeitskopie: abgeleitet, ohne Block — sie gehört keinem Dokument,
       sondern dem Auftrag. */
    const satz = await Dateien.ablegen(datei, { name, abgeleitet: true });
    const auftrag = await Auftraege.anlegen(AUFTRAG_ART,
      { dateiId: satz.id, zipName: name, zielId: zielId || null, anordnung: opt.anordnung || 'untereinander' },
      { schritte, text: '„' + name + '" wird entpackt' });
    if (!opt.still && typeof UI !== 'undefined' && UI.toast)
      UI.toast('„' + name + '": ' + schritte + (schritte === 1 ? ' Datei' : ' Dateien') +
               ' — läuft im Hintergrund weiter, auch wenn du weggehst.', 7000);
    return { auftrag };
  };

  /** Der Dateiwähler — wie `PdfEinlesen.waehlen`, aber für eine ZIP.
      Seit E365 legt er einen AUFTRAG an; zurück kommt, was `alsAuftrag`
      sagt (der Auftrag, oder das Ergebnis des direkten Laufs). */
  const waehlen = (zielId: string | null = null): Promise<any> => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip,application/zip,application/x-zip-compressed';
    input.style.display = 'none';
    document.body.appendChild(input);
    return new Promise(fertig => {
      let entschieden = false;
      const auf = async (): Promise<void> => {
        if (entschieden) return;
        entschieden = true;
        const f = input.files?.[0];
        input.remove();
        if (!f) { fertig(null); return; }
        try { fertig(await alsAuftrag(f, zielId)); }
        catch (e) {
          if (typeof UI !== 'undefined') UI.toast('Die ZIP liess sich nicht entpacken: ' +
            (e instanceof Error ? e.message : String(e)));
          fertig(null);
        }
      };
      input.addEventListener('change', () => { void auf(); });
      input.addEventListener('cancel', () => {
        if (entschieden) return;
        entschieden = true; input.remove(); fertig(null);
      });
      input.click();
    });
  };

  /* `zipLaeufer` steht im Rückgabeobjekt, damit ein Prüflauf den Zustand
     eines geschlossenen Tabs herstellen kann: Auftrag mit Stand hinein,
     abgebrochen heraus, und noch einmal hinein. Die Maschine ruft ihn
     ohnehin — hier ist er nur benennbar. */
  return { importZip, alsAuftrag, zipLaeufer, umfang, planen, AUFTRAG_ART, dateiAlsDokument, waehlen,
           ansichtAuffrischen, segmente, istBeiwerk, sauber };
})();

(window as any).ArchivImport = ArchivImport;
