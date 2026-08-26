/* ============================================================================
 * bereiche/elektro/formelheft.ts — das Formelheft, das mitschwebt
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/elektro/formelheft.ts`.
 * ----------------------------------------------------------------------------
 * WOZU EIN SCHWEBENDES HEFT
 *
 * Beim Zeichnen und Rechnen braucht man die Formel NEBEN der Arbeit, nicht
 * statt ihrer. Ein Heft, das die Seite ersetzt, zwingt zum Hin- und
 * Herspringen; eines, das darüber schwebt, bleibt offen, während man
 * weiterzeichnet. Deshalb ist es ein Fenster und kein Bereich:
 *
 *   · es liegt über allem und lässt sich frei verschieben
 *   · es bleibt offen, wenn die Seite wechselt
 *   · es merkt sich, wo es stand und welche Seite offen war
 *
 * ZWEI HEFTE IN EINEM
 *
 *   Formeln    Redions eigene Sammlung aus `register/elektroformeln.js` —
 *              durchsuchbar und RECHENBAR: Werte einsetzen, Ergebnis lesen,
 *              Rechenweg ansehen.
 *   Mein Heft  ein eigenes PDF, das man einmal lädt und danach durchblättert.
 *              Es bleibt als normaler Redion-Anhang liegen und geht durch
 *              Sicherung und Wiederherstellung wie jede andere Datei.
 *
 * WARUM KEIN HEFT MITGELIEFERT WIRD. Eine gescannte Formelsammlung ist
 * fremdes Lehrmaterial mit eigenem Urheberrecht. Redion liefert deshalb die
 * FÄHIGKEIT, ein Heft zu benutzen, und eine eigene, selbst geschriebene
 * Sammlung dazu — die Formeln selbst gehören niemandem, die Auswahl und der
 * Satz eines fremden Hefts schon.
 *
 * ALLES BLEIBT LOKAL. Das geladene PDF liegt in der IndexedDB dieses
 * Browsers, wie jeder andere Anhang. Es geht an keinen Server.
 * ==========================================================================*/

const Formelheft = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /**
   * `R_V` wird zu R mit tiefgestelltem V.
   *
   * Im Register steht `R_V`, weil eine Zeichenkette keine Tiefstellung hat
   * und der Unterstrich seit jeher dafür steht. Im gedruckten Heft steht
   * dort ein tiefgestelltes V — und der Unterschied ist nicht Schönheit,
   * sondern Lesbarkeit: `X_L − X_C` liest sich als drei Zeichen mit
   * Strichen dazwischen, `X` mit tiefem `L` minus `X` mit tiefem `C` liest
   * sich als eine Differenz zweier Grössen.
   *
   * ERST ESCAPEN, DANN AUSZEICHNEN. Die Reihenfolge ist die ganze Sicherheit
   * dieser Funktion (§19): das `<sub>` kommt NACH dem Escapen hinein, also
   * kann aus dem Inhalt kein Tag werden. Umgekehrt wäre es eine Lücke.
   *
   * Unicode-Tiefstellungen (U₀, Rᵢ, N₁) bleiben, wie sie sind — sie sehen
   * bereits richtig aus und haben keinen Unterstrich.
   */
  const tief = (wert: unknown): string =>
    esc(wert).replace(/_([A-Za-zÄÖÜäöüß0-9]+)/g, '<sub>$1</sub>');

  /* Was sich das Heft über Sitzungen hinweg merkt. Alles in `Store.meta` —
     es gehört dem Menschen, nicht einem Dokument. */
  const M_ORT       = 'elektro:heftOrt';        /* wo das Fenster stand */
  const M_KAPITEL   = 'elektro:heftKapitel';    /* welches Kapitel offen war */
  const M_FAVORITEN = 'elektro:heftFavoriten';  /* gemerkte Formeln */
  const M_PDF       = 'elektro:heftPdf';        /* Kennung des eigenen Hefts */
  const M_PDFSEITE  = 'elektro:heftPdfSeite';   /* welche Seite zuletzt offen */
  const M_PDFFAV    = 'elektro:heftPdfFavoriten'; /* gemerkte PDF-Seiten */
  const M_ANSICHT   = 'elektro:heftAnsicht';    /* 'kapitel' oder 'buch' */
  const M_SEITE     = 'elektro:heftSeite';      /* welche Buchseite offen war */

  const merke = (schluessel: string, wert: unknown): void => {
    if (typeof Store !== 'undefined') Store.setMeta(schluessel, wert);
  };
  const gemerkt = <T>(schluessel: string, vorgabe: T): T =>
    (typeof Store !== 'undefined') ? Store.getMeta(schluessel, vorgabe) : vorgabe;

  const favoriten = (): string[] => {
    const roh = gemerkt<string[]>(M_FAVORITEN, []);
    return Array.isArray(roh) ? roh.map(String) : [];
  };
  const favoritUmschalten = (id: string): boolean => {
    const liste = favoriten();
    const i = liste.indexOf(id);
    if (i >= 0) liste.splice(i, 1); else liste.push(id);
    merke(M_FAVORITEN, liste);
    return i < 0;
  };

  const seitenFavoriten = (): number[] => {
    const roh = gemerkt<number[]>(M_PDFFAV, []);
    return Array.isArray(roh) ? roh.map(Number).filter(n => n > 0) : [];
  };
  const seiteUmschalten = (nr: number): boolean => {
    const liste = seitenFavoriten();
    const i = liste.indexOf(nr);
    if (i >= 0) liste.splice(i, 1); else liste.push(nr);
    liste.sort((a, b) => a - b);
    merke(M_PDFFAV, liste);
    return i < 0;
  };

  /* Nur EIN Heft zur Zeit — ein zweites Fenster wäre ein zweiter Zustand. */
  let fenster: HTMLElement | null = null;

  const offen = (): boolean => !!fenster && document.body.contains(fenster);
  const schliessen = (): void => { fenster?.remove(); fenster = null; };

  /* ------------------------------------------------------------------------
   * DER RECHNER AN DER FORMEL (Punkte 61–90)
   * ------------------------------------------------------------------------
   * Jede Formel bekommt Eingabefelder für ihre Grössen und eine Auswahl,
   * WONACH gesucht wird. Das gesuchte Feld wird gesperrt, statt es zu
   * verstecken: so sieht man, welche Grösse gerade herauskommt, und die
   * Felder springen beim Umschalten nicht durcheinander.
   * ----------------------------------------------------------------------*/
  const rechnerHtml = (id: string): string => {
    const f = Register.elektroformeln.holen(id);
    if (!f) return '';
    const loesbar = Register.elektroformeln.loesbarNach(id);
    return `<div class="fh-rechner" data-formel="${esc(id)}">` +
      `<div class="fh-gesucht"><span>Gesucht</span>` +
      loesbar.map((z: string, i: number) =>
        `<button data-gesucht="${esc(z)}"${i === 0 ? ' class="an"' : ''}>${tief(z)}</button>`).join('') +
      `</div>` +
      `<div class="fh-felder">` +
      f.groessen.map((x: any) =>
        `<label class="fh-feld" data-fuer="${esc(x.zeichen)}">` +
        `<span class="fh-zeichen">${tief(x.zeichen)}</span>` +
        `<input type="text" inputmode="decimal" data-g="${esc(x.zeichen)}" ` +
        `placeholder="${esc(x.name)}" aria-label="${esc(x.name)}">` +
        `<span class="fh-einheit">${esc(x.einheit)}</span></label>`).join('') +
      `</div>` +
      (f.annahme ? `<p class="fh-annahme">⚠ ${esc(f.annahme)}</p>` : '') +
      `<div class="fh-ergebnis" role="status" aria-live="polite"></div>` +
      `</div>`;
  };

  const formelHtml = (f: any, fav: string[]): string =>
    `<article class="fh-formel" data-id="${esc(f.id)}">` +
    `<header><b>${tief(f.schreibweise)}</b>` +
    `<button class="fh-stern${fav.includes(f.id) ? ' an' : ''}" data-fav="${esc(f.id)}" ` +
    `title="Merken" aria-label="Formel merken">★</button></header>` +
    `<p class="fh-erkl">${esc(f.erklaerung)}</p>` +
    `<div class="fh-groessen">` + f.groessen.map((x: any) =>
      `<span title="${esc(x.was || x.name)}"><i>${tief(x.zeichen)}</i> ${esc(x.name)}` +
      (x.einheit ? ` <em>${esc(x.einheit)}</em>` : '') + `</span>`).join('') + `</div>` +
    rechnerHtml(f.id) + `</article>`;

  /* ========================================================================
   * DIE BUCHSEITE (E194)
   * ------------------------------------------------------------------------
   * Redion schreibt sein Formelbuch selbst — eigene Gestaltung, eigene
   * Skizzen — aber mit DENSELBEN SEITENZAHLEN wie das gedruckte Heft. Wer
   * beides nebeneinander liegen hat, blättert in beiden auf 14 und findet
   * beide Male die Wechselstromwiderstände.
   *
   * Das ist der ganze Zweck, und er ist nicht dasselbe wie „das PDF
   * anzeigen": ein Scan ist ein Bild und bleibt eines. Eine Buchseite in
   * Redion ist RECHENBAR — jede Formel darauf lässt sich antippen und mit
   * Werten füllen —, sie ist durchsuchbar, sie folgt Hell und Dunkel, und
   * sie wird auf dem Telefon nicht kleiner, sondern anders angeordnet.
   *
   * WAS DIE SEITE ZEIGT, KOMMT AUS DEM REGISTER. Die Abschnitte, ihre
   * Reihenfolge und ihre Seitenzahl stehen in `Register.elektroformeln`;
   * hier wird nur gesetzt. Eine Seite, die Redion noch nicht geschrieben
   * hat, sagt das — statt leer zu bleiben und wie ein Fehler auszusehen.
   * ======================================================================*/

  const seiteJetzt = (): number => {
    const n = Number(gemerkt(M_SEITE, 4)) || 4;
    return Math.max(1, Math.min(Register.elektroformeln.letzteSeite(), Math.round(n)));
  };

  /** Die nächste Seite in `richtung`, auf der wirklich etwas steht. */
  const naechsteVolle = (von: number, richtung: 1 | -1): number => {
    const voll = Register.elektroformeln.seitenMitInhalt() as number[];
    if (!voll.length) return von;
    const treffer = richtung > 0
      ? voll.find(n => n > von)
      : [...voll].reverse().find(n => n < von);
    /* Am Ende stehenbleiben statt umzuspringen: wer vorwärts blättert und
       plötzlich auf Seite 4 landet, hat den Faden verloren. */
    return treffer ?? von;
  };

  /** Ein Abschnitt mit Überschrift, Skizze und seinen Formeln. */
  const abschnittHtml = (a: any, formeln: any[], fav: string[]): string => {
    const skizze = (typeof Elektroskizzen !== 'undefined') ? Elektroskizzen.zu(a.id) : '';
    /* Die Grössen EINMAL für den ganzen Abschnitt, nicht je Formel: im Buch
       steht die Legende auch einmal neben der Gruppe. Doppelte Zeilen sind
       hier kein Fehler, sondern Lärm. */
    const gesehen = new Set<string>();
    const legende: string[] = [];
    formeln.forEach(f => (f.groessen || []).forEach((x: any) => {
      if (gesehen.has(x.zeichen)) return;
      gesehen.add(x.zeichen);
      legende.push(`<span title="${esc(x.was || x.name)}"><i>${tief(x.zeichen)}</i> ` +
        `${esc(x.name)}${x.einheit ? ` <em>${esc(x.einheit)}</em>` : ''}</span>`);
    }));
    return `<section class="bs-abschnitt" data-abschnitt="${esc(a.id)}">` +
      `<h3>${esc(a.titel)}</h3>` +
      `<div class="bs-koerper">` +
      (skizze ? `<div class="bs-skizze">${skizze}</div>` : '') +
      `<div class="bs-formeln">` + formeln.map(f =>
        `<button type="button" class="bs-formel${fav.includes(f.id) ? ' gemerkt' : ''}" ` +
        `data-buchformel="${esc(f.id)}" ` +
        `title="${esc(f.erklaerung)}">${tief(f.schreibweise)}</button>`).join('') +
      `</div></div>` +
      `<div class="bs-legende">${legende.join('')}</div>` +
      `</section>`;
  };

  const buchseiteHtml = (nr: number, fav: string[]): string => {
    const R = Register.elektroformeln;
    const teile = R.aufSeite(nr) as Array<{ abschnitt: any; formeln: any[] }>;
    const kapitel = [...new Set(teile.map(t => t.abschnitt.buch))]
      .map(k => `${k} · ${R.buchkapitelName(k)}`);
    const letzte = R.letzteSeite();
    const voll = R.seitenMitInhalt() as number[];
    return `<div class="bs-blatt" data-seite="${nr}">` +
      `<div class="bs-kopf">` +
      `<div class="bs-kapitel">${kapitel.length
          ? kapitel.map(k => `<span>${esc(k)}</span>`).join('')
          : '<span class="bs-offen">noch nicht geschrieben</span>'}</div>` +
      `<div class="bs-seitenzahl">Seite ${nr} <span>von ${letzte}</span></div>` +
      `</div>` +
      (teile.length
        ? teile.map(t => abschnittHtml(t.abschnitt, t.formeln, fav)).join('')
        : `<div class="bs-leer">` +
          `<p>Diese Seite gibt es im gedruckten Heft, in Redion noch nicht.</p>` +
          `<p class="fh-klein">Geschrieben sind ${voll.length} Seiten: ` +
          `${esc(voll.join(', '))}.</p></div>`) +
      `</div>`;
  };

  /* ------------------------------------------------------------------------
   * DAS EIGENE PDF
   * ------------------------------------------------------------------------
   * Es liegt als normaler Redion-Anhang in der IndexedDB — dieselbe Ablage
   * wie Bilder und Aufnahmen, also stückweise gespeichert und in `.redion`
   * mitgesichert. Gerendert wird mit demselben pdf.js, das der PDF-Bereich
   * schon benutzt: kein zweiter Leser, keine zweite Bibliothek.
   * ----------------------------------------------------------------------*/
  const pdfLaden = async (): Promise<void> => {
    const eingabe = document.createElement('input');
    eingabe.type = 'file';
    eingabe.accept = '.pdf,application/pdf';
    eingabe.addEventListener('change', async () => {
      const datei = eingabe.files?.[0];
      if (!datei) return;
      UI.toast('Heft wird abgelegt …');
      try {
        /* Über den gewöhnlichen Dateiweg — stückweise, ohne alles in den
           Arbeitsspeicher zu holen (§14). Ein 90-seitiges Heft kann gross
           sein, und es soll auch auf dem Telefon gehen. */
        const angelegt = await Dateien.ablegen(datei, null);
        merke(M_PDF, angelegt.id);
        merke(M_PDFSEITE, 1);
        UI.toast('✅ Heft geladen: ' + datei.name);
        neuMalen();
      } catch (e) {
        UI.toast('⛔ ' + (e instanceof Error ? e.message : String(e)));
      }
    });
    eingabe.click();
  };

  /** Das geladene Heft wieder entfernen — die Datei bleibt in der Ablage. */
  const pdfLoesen = (): void => {
    merke(M_PDF, '');
    merke(M_PDFSEITE, 1);
    neuMalen();
  };

  type PdfStand = { seiten: number; nr: number; bild: string };
  let pdfDoc: any = null;
  let pdfDateiId = '';

  /** Eine Seite des eigenen Hefts zeichnen. Gibt null, wenn keins da ist. */
  const pdfSeite = async (nr: number, breite: number): Promise<PdfStand | null> => {
    const id = String(gemerkt(M_PDF, ''));
    if (!id) return null;
    if (!pdfDoc || pdfDateiId !== id) {
      const lib = await PdfFremd.laden();
      const blob = await Dateien.alsBlob(id);
      if (!blob) return null;
      pdfDoc = await lib.getDocument({ data: await blob.arrayBuffer() }).promise;
      pdfDateiId = id;
    }
    const anzahl = pdfDoc.numPages;
    const seite = Math.max(1, Math.min(anzahl, Math.round(nr) || 1));
    const s = await pdfDoc.getPage(seite);
    const roh = s.getViewport({ scale: 1 });
    /* Auf die Fensterbreite skalieren, aber nicht kleiner als lesbar. */
    const skala = Math.max(0.7, Math.min(3, breite / roh.width));
    const vp = s.getViewport({ scale: skala });
    const leinwand = document.createElement('canvas');
    leinwand.width = Math.round(vp.width);
    leinwand.height = Math.round(vp.height);
    await s.render({ canvasContext: leinwand.getContext('2d'), viewport: vp }).promise;
    return { seiten: anzahl, nr: seite, bild: leinwand.toDataURL('image/png') };
  };

  /* ------------------------------------------------------------------------
   * DAS FENSTER
   * ----------------------------------------------------------------------*/
  let neuMalen: () => void = () => {};

  const oeffne = (kapitelWunsch?: string): HTMLElement => {
    if (offen()) {
      if (kapitelWunsch) { merke(M_KAPITEL, kapitelWunsch); neuMalen(); }
      return fenster!;
    }

    const f = document.createElement('div');
    f.className = 'fh-fenster';
    f.setAttribute('role', 'dialog');
    f.setAttribute('aria-label', 'Formelheft');
    fenster = f;

    /* Wo es zuletzt stand — aber nie ausserhalb des Bildes. Ein Fenster,
       das nach einem Bildschirmwechsel unerreichbar ist, ist verloren. */
    /* `null` heisst „noch nie gemerkt" — und das ist NICHT dasselbe wie
       „gemerkt bei 0". Hier stand `ort.x || vorgabe`, und damit vergass das
       Heft seinen Platz genau dann, wenn man es an den linken oder oberen
       Rand geschoben hatte: 0 ist falsch im Sinne von JavaScript und richtig
       im Sinne des Menschen. Derselbe Fehler wie eine Zahl, die zu einer
       anderen Zahl wird — er sieht aus wie Absicht. */
    const ort = gemerkt<{ x: number; y: number; w: number; h: number } | null>(
      M_ORT, null);
    const zahl = (wert: unknown, vorgabe: number): number =>
      (typeof wert === 'number' && Number.isFinite(wert)) ? wert : vorgabe;

    const breite = Math.min(Math.max(zahl(ort?.w, 420), 320), window.innerWidth - 20);
    const hoehe = Math.min(Math.max(zahl(ort?.h, 520), 260), window.innerHeight - 20);
    f.style.width = breite + 'px';
    f.style.height = hoehe + 'px';
    /* Im Bild bleiben, aber die Kante DARF die Kante sein. Ein erzwungener
       Rand von 8 px verschiebt jedes gemerkte Fenster bei jedem Öffnen. */
    f.style.left = Math.max(0, Math.min(zahl(ort?.x, window.innerWidth - breite - 30),
                                        Math.max(0, window.innerWidth - breite))) + 'px';
    f.style.top = Math.max(0, Math.min(zahl(ort?.y, 90),
                                       Math.max(0, window.innerHeight - hoehe))) + 'px';

    document.body.appendChild(f);

    /* --- Inhalt ---------------------------------------------------------- */
    let suchtext = '';
    let pdfModus = false;
    /* Welche der beiden eigenen Ansichten offen ist. Sie überlebt das
       Schliessen: wer im Buch liest, liest beim nächsten Öffnen weiter. */
    let buchModus = String(gemerkt(M_ANSICHT, 'kapitel')) === 'buch';
    /* Welche Formel nach dem nächsten Malen aufgeklappt werden soll — der
       Weg von einem Suchtreffer zur Formel auf ihrer Seite. Wird nach dem
       Malen wieder geleert, sonst klappt sie bei jedem Blättern erneut auf. */
    let buchOeffnen = '';

    const male = async (): Promise<void> => {
      const kapitel = String(gemerkt(M_KAPITEL, 'grund'));
      const fav = favoriten();
      const hatPdf = !!String(gemerkt(M_PDF, ''));

      const kopf =
        `<div class="fh-kopf" data-griff>` +
        `<span class="fh-titel">📐 Formelheft</span>` +
        `<div class="fh-kopfknoepfe">` +
        `<button data-a="buch" class="${buchModus && !pdfModus ? 'an' : ''}" ` +
        `title="Nach Buchseiten" aria-label="Nach Buchseiten blättern">📖</button>` +
        `<button data-a="pdf" class="${pdfModus ? 'an' : ''}" ` +
        `title="Mein eigenes Heft" aria-label="Mein eigenes Heft">📕</button>` +
        `<button data-a="zu" title="Schliessen" aria-label="Schliessen">✕</button>` +
        `</div></div>`;

      if (pdfModus) {
        const nr = Number(gemerkt(M_PDFSEITE, 1)) || 1;
        const favS = seitenFavoriten();
        if (!hatPdf) {
          f.innerHTML = kopf +
            `<div class="fh-leer">` +
            `<p>Hier kommt <b>dein eigenes Formelheft</b> hin — als PDF.</p>` +
            `<p class="fh-klein">Es bleibt in diesem Browser und geht an keinen Server. ` +
            `In der Sicherung ist es mit dabei.</p>` +
            `<button class="prim" data-a="laden">Heft als PDF laden</button></div>`;
          return;
        }
        f.innerHTML = kopf +
          `<div class="fh-pdf"><div class="fh-pdfbild">Seite wird geholt …</div></div>` +
          `<div class="fh-pdffuss">` +
          `<button data-a="zurueck" aria-label="Vorige Seite">‹</button>` +
          `<input class="fh-nr" type="number" min="1" value="${nr}" aria-label="Seite">` +
          `<span class="fh-von">von …</span>` +
          `<button data-a="vor" aria-label="Nächste Seite">›</button>` +
          `<button class="fh-stern${favS.includes(nr) ? ' an' : ''}" data-a="seitefav" ` +
          `title="Seite merken" aria-label="Seite merken">★</button>` +
          (favS.length ? `<span class="fh-favseiten">` + favS.map(s =>
            `<button data-springe="${s}"${s === nr ? ' class="an"' : ''}>${s}</button>`).join('') +
            `</span>` : '') +
          `<button data-a="loesen" class="fh-loesen" title="Anderes Heft laden">⤒</button>` +
          `</div>`;
        const kasten = f.querySelector('.fh-pdf') as HTMLElement;
        const stand = await pdfSeite(nr, kasten.clientWidth - 16);
        if (!stand) {
          kasten.innerHTML = '<div class="fh-leer"><p>Das Heft lässt sich nicht öffnen.</p></div>';
          return;
        }
        kasten.innerHTML = `<img src="${stand.bild}" alt="Seite ${stand.nr}">`;
        const von = f.querySelector('.fh-von');
        if (von) von.textContent = 'von ' + stand.seiten;
        const feld = f.querySelector('.fh-nr') as HTMLInputElement;
        if (feld) { feld.max = String(stand.seiten); feld.value = String(stand.nr); }
        return;
      }

      /* Redions eigenes Buch, Seite für Seite (E194).

         Die Suche gilt AUCH hier: wer etwas sucht, will es finden und nicht
         erst die richtige Seite raten. Ein Treffer sagt dann, auf welcher
         Seite er steht — und ein Tipp darauf blättert hin. */
      if (buchModus) {
        const nr = seiteJetzt();
        const R = Register.elektroformeln;
        const letzte = R.letzteSeite();
        if (suchtext) {
          const treffer = R.suche(suchtext) as any[];
          f.innerHTML = kopf +
            `<div class="fh-suche"><input type="search" ` +
            `placeholder="Formel oder Grösse suchen …" ` +
            `value="${esc(suchtext)}" aria-label="Formel suchen"></div>` +
            `<div class="fh-inhalt bs-treffer">` +
            (treffer.length
              ? treffer.map(x => {
                  const seite = R.seiteVon(x.id);
                  return `<button type="button" class="bs-treffer-zeile" ` +
                    `data-buchseite="${seite}" data-buchformel="${esc(x.id)}">` +
                    `<b>${tief(x.schreibweise)}</b>` +
                    `<span>Seite ${seite || '–'}</span></button>`;
                }).join('')
              : `<div class="fh-leer"><p>Nichts gefunden.</p></div>`) +
            `</div>`;
          return;
        }
        f.innerHTML = kopf +
          `<div class="fh-suche"><input type="search" ` +
          `placeholder="Formel oder Grösse suchen …" ` +
          `value="" aria-label="Formel suchen"></div>` +
          `<div class="fh-inhalt bs-inhalt">${buchseiteHtml(nr, fav)}</div>` +
          `<div class="fh-pdffuss">` +
          `<button data-a="zurueckSeite" aria-label="Vorige Seite"${nr <= 1 ? ' disabled' : ''}>‹</button>` +
          `<input class="fh-nr bs-nr" type="number" min="1" max="${letzte}" value="${nr}" ` +
          `aria-label="Buchseite">` +
          `<span class="fh-von">von ${letzte}</span>` +
          `<button data-a="vorSeite" aria-label="Nächste Seite"${nr >= letzte ? ' disabled' : ''}>›</button>` +
          `<button data-a="vorherVoll" title="Vorige geschriebene Seite" ` +
          `aria-label="Vorige geschriebene Seite">«</button>` +
          `<button data-a="naechsteVoll" title="Nächste geschriebene Seite" ` +
          `aria-label="Nächste geschriebene Seite">»</button>` +
          `</div>`;
        return;
      }

      /* Die eigene Sammlung */
      const kapitelListe = Register.elektroformeln.kapitel() as Array<[string, string, string]>;
      const treffer = suchtext
        ? Register.elektroformeln.suche(suchtext)
        : (kapitel === 'fav'
            ? fav.map((id: string) => Register.elektroformeln.holen(id)).filter(Boolean)
            : Register.elektroformeln.imKapitel(kapitel));

      f.innerHTML = kopf +
        `<div class="fh-suche"><input type="search" placeholder="Formel oder Grösse suchen …" ` +
        `value="${esc(suchtext)}" aria-label="Formel suchen"></div>` +
        `<div class="fh-band"><div class="fh-kapitel">` +
        (fav.length ? `<button data-k="fav"${kapitel === 'fav' && !suchtext ? ' class="an"' : ''}>` +
          `★ ${fav.length}</button>` : '') +
        kapitelListe.map(k =>
          `<button data-k="${esc(k[0])}"${k[0] === kapitel && !suchtext ? ' class="an"' : ''}>` +
          `${esc(k[1])}</button>`).join('') + `</div></div>` +
        `<div class="fh-inhalt">` +
        (treffer.length
          ? treffer.map((x: any) => formelHtml(x, fav)).join('')
          : `<div class="fh-leer"><p>Nichts gefunden.</p></div>`) +
        `</div>`;

      /* Zwei Dinge am Kapitelband, und beide fielen erst beim Hinsehen auf:
         es lief rechts scharf aus dem Fenster („Leistung und E…"), und das
         aktive Kapitel stand ausserhalb des Bildes, sodass gar kein Kapitel
         hervorgehoben AUSSAH. Wer nicht weiss, wo er ist, blättert nicht
         weiter — er sucht.

         Der auslaufende Rand kommt von `Rollrand` und nicht von einer
         vierten abgeschriebenen Rechnung (E141, E151, E159 sind die drei
         vorigen). */
      const band = f.querySelector('.fh-kapitel') as HTMLElement | null;
      if (band) {
        /* Der Verlauf gehört an die HÜLLE `.fh-band`, nicht ans Rollfeld: ein
           Pseudo-Element im Rollfeld rollt mit und wäre nach dem ersten Wisch
           weg. Die Hülle steht deshalb im Markup und wird nicht nachträglich
           gesucht — `parentElement` wäre hier das ganze Fenster gewesen, und
           der Verlauf hätte über die volle Höhe gelegen. */
        const huelle = band.closest('.fh-band') as HTMLElement | null;
        if (typeof Rollrand !== 'undefined')
          Rollrand.binde(band, { art: 'mehr', an: huelle });
        const aktiv = band.querySelector('.an') as HTMLElement | null;
        if (aktiv) aktiv.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };

    neuMalen = () => {
      void male().then(() => {
        if (!buchOeffnen) return;
        const ziel = f.querySelector<HTMLElement>(
          `[data-buchformel="${CSS.escape(buchOeffnen)}"]`);
        buchOeffnen = '';
        ziel?.click();
      });
    };

    /* --- Verschieben und Grösse ändern ------------------------------------ */
    let zieht: null | { dx: number; dy: number; art: 'ort' | 'groesse' } = null;
    f.addEventListener('pointerdown', e => {
      const ziel = e.target as HTMLElement;
      const amGriff = ziel.closest('[data-griff]');
      const amRand = ziel.classList.contains('fh-groesse');
      if (!amGriff && !amRand) return;
      if (ziel.closest('button')) return;
      const r = f.getBoundingClientRect();
      zieht = amRand
        ? { dx: e.clientX - r.width, dy: e.clientY - r.height, art: 'groesse' }
        : { dx: e.clientX - r.left, dy: e.clientY - r.top, art: 'ort' };
      f.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    f.addEventListener('pointermove', e => {
      if (!zieht) return;
      if (zieht.art === 'ort') {
        /* Immer im Bild bleiben — sonst schiebt man das Heft weg und
           bekommt es nicht zurück. */
        const b = f.offsetWidth, h = f.offsetHeight;
        f.style.left = Math.max(0, Math.min(window.innerWidth - b, e.clientX - zieht.dx)) + 'px';
        f.style.top = Math.max(0, Math.min(window.innerHeight - h, e.clientY - zieht.dy)) + 'px';
      } else {
        f.style.width = Math.max(300, Math.min(window.innerWidth - 20, e.clientX - zieht.dx)) + 'px';
        f.style.height = Math.max(240, Math.min(window.innerHeight - 20, e.clientY - zieht.dy)) + 'px';
      }
    });
    const zugEnde = (): void => {
      if (!zieht) return;
      const war = zieht.art;
      zieht = null;
      const r = f.getBoundingClientRect();
      merke(M_ORT, { x: Math.round(r.left), y: Math.round(r.top),
                     w: Math.round(r.width), h: Math.round(r.height) });
      if (war === 'groesse' && pdfModus) neuMalen();
    };
    f.addEventListener('pointerup', zugEnde);
    f.addEventListener('pointercancel', zugEnde);

    /* --- Klicks ----------------------------------------------------------- */
    f.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>(
        '[data-a],[data-k],[data-fav],[data-gesucht],[data-springe],' +
        '[data-buchformel],[data-buchseite]');
      if (!b) return;

      if (b.dataset.a === 'zu') return schliessen();
      if (b.dataset.a === 'buch') {
        buchModus = !buchModus; pdfModus = false;
        merke(M_ANSICHT, buchModus ? 'buch' : 'kapitel');
        return neuMalen();
      }
      if (b.dataset.a === 'pdf') { pdfModus = !pdfModus; return neuMalen(); }
      if (b.dataset.a === 'zurueckSeite' || b.dataset.a === 'vorSeite') {
        merke(M_SEITE, seiteJetzt() + (b.dataset.a === 'vorSeite' ? 1 : -1));
        return neuMalen();
      }
      if (b.dataset.a === 'vorherVoll' || b.dataset.a === 'naechsteVoll') {
        merke(M_SEITE, naechsteVolle(seiteJetzt(),
          b.dataset.a === 'naechsteVoll' ? 1 : -1));
        return neuMalen();
      }
      /* Ein Treffer aus der Suche: erst hinblättern, dann die Formel öffnen. */
      if (b.dataset.buchseite) {
        const seite = Number(b.dataset.buchseite);
        if (seite > 0) merke(M_SEITE, seite);
        suchtext = '';
        buchOeffnen = b.dataset.buchformel || '';
        return neuMalen();
      }
      /* Eine Formel auf der Buchseite antippen: der Rechner klappt darunter
         auf. Nur einer zur Zeit — zwei offene Rechner sind zwei Zustände,
         und man verliert, welcher gerade gemeint ist. */
      if (b.dataset.buchformel) {
        const id = b.dataset.buchformel;
        const abschnitt = b.closest('.bs-abschnitt');
        const schon = abschnitt?.querySelector<HTMLElement>('.bs-rechner');
        const warEs = schon?.dataset.fuer === id;
        f.querySelectorAll('.bs-rechner').forEach(x => x.remove());
        f.querySelectorAll('.bs-formel.offen').forEach(x => x.classList.remove('offen'));
        if (warEs) return;
        b.classList.add('offen');
        const kasten = document.createElement('div');
        kasten.className = 'bs-rechner';
        kasten.dataset.fuer = id;
        const formel = Register.elektroformeln.holen(id);
        kasten.innerHTML =
          `<p class="fh-erkl">${esc(formel ? formel.erklaerung : '')}</p>` +
          rechnerHtml(id);
        b.closest('.bs-koerper')?.insertAdjacentElement('afterend', kasten);
        const r = kasten.querySelector('.fh-rechner') as HTMLElement | null;
        if (r) rechne(r);
        kasten.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (b.dataset.a === 'laden') return void pdfLaden();
      if (b.dataset.a === 'loesen') return pdfLoesen();
      if (b.dataset.a === 'zurueck' || b.dataset.a === 'vor') {
        const nr = Number(gemerkt(M_PDFSEITE, 1)) || 1;
        merke(M_PDFSEITE, Math.max(1, nr + (b.dataset.a === 'vor' ? 1 : -1)));
        return neuMalen();
      }
      if (b.dataset.a === 'seitefav') {
        seiteUmschalten(Number(gemerkt(M_PDFSEITE, 1)) || 1);
        return neuMalen();
      }
      if (b.dataset.springe) { merke(M_PDFSEITE, Number(b.dataset.springe)); return neuMalen(); }
      if (b.dataset.k) { merke(M_KAPITEL, b.dataset.k); suchtext = ''; return neuMalen(); }
      if (b.dataset.fav) { favoritUmschalten(b.dataset.fav); return neuMalen(); }

      /* Die gesuchte Grösse umschalten — und gleich neu rechnen. */
      if (b.dataset.gesucht) {
        const rechner = b.closest('.fh-rechner') as HTMLElement;
        rechner.querySelectorAll('[data-gesucht]').forEach(x => x.classList.remove('an'));
        b.classList.add('an');
        return rechne(rechner);
      }
    });

    /* --- Eingaben --------------------------------------------------------- */
    f.addEventListener('input', e => {
      const feld = e.target as HTMLInputElement;
      if (feld.type === 'search') { suchtext = feld.value; return neuMalen(); }
      if (feld.classList.contains('bs-nr')) {
        merke(M_SEITE, Math.max(1, Number(feld.value) || 1));
        return neuMalen();
      }
      if (feld.classList.contains('fh-nr')) {
        merke(M_PDFSEITE, Math.max(1, Number(feld.value) || 1));
        return neuMalen();
      }
      const rechner = feld.closest('.fh-rechner') as HTMLElement | null;
      if (rechner) rechne(rechner);
    });

    /* --- Rechnen ---------------------------------------------------------- */
    const rechne = (rechner: HTMLElement): void => {
      const id = rechner.dataset.formel || '';
      const gesucht = (rechner.querySelector('[data-gesucht].an') as HTMLElement)?.dataset.gesucht || '';
      const werte: Record<string, number> = {};
      rechner.querySelectorAll<HTMLInputElement>('[data-g]').forEach(feld => {
        const z = feld.dataset.g || '';
        /* Das gesuchte Feld wird gesperrt statt versteckt — sonst springen
           die Felder beim Umschalten, und man verliert die Übersicht. */
        const istGesucht = z === gesucht;
        feld.disabled = istGesucht;
        feld.closest('.fh-feld')?.classList.toggle('gesucht', istGesucht);
        if (istGesucht) return;
        /* Komma UND Punkt annehmen — auf einer Schweizer Tastatur tippt man
           1450,5, und daran darf keine Rechnung scheitern. */
        const roh = feld.value.trim().replace(',', '.');
        if (roh !== '') werte[z] = Number(roh);
      });
      const anzeige = rechner.querySelector('.fh-ergebnis') as HTMLElement;
      if (!gesucht) { anzeige.textContent = ''; return; }

      const erg = Register.elektroformeln.rechne(id, gesucht, werte);
      if (!erg.ok) {
        anzeige.className = 'fh-ergebnis fh-wartet';
        anzeige.textContent = erg.fehler;
        /* Das gesuchte Feld bleibt leer, solange nichts herauskommt. */
        const feld = rechner.querySelector<HTMLInputElement>(`[data-g="${CSS.escape(gesucht)}"]`);
        if (feld) feld.value = '';
        return;
      }
      const gerundet = Math.round(erg.wert * 10000) / 10000;
      anzeige.className = 'fh-ergebnis fh-fertig';
      anzeige.innerHTML =
        `<b>${tief(gesucht)} = ${esc(zahlText(gerundet))} ${esc(erg.einheit)}</b>` +
        `<ol class="fh-weg">` + erg.weg.map((s: string) =>
          `<li>${esc(s)}</li>`).join('') + `</ol>`;
      const feld = rechner.querySelector<HTMLInputElement>(`[data-g="${CSS.escape(gesucht)}"]`);
      if (feld) feld.value = zahlText(gerundet);
    };

    /**
     * Zahlen lesbar schreiben (Punkt 70).
     *
     * Sehr grosse und sehr kleine Werte in technischer Schreibweise, alles
     * dazwischen normal. `0,000008` liest niemand; `8e-6` schon.
     */
    const zahlText = (n: number): string => {
      if (!isFinite(n)) return '—';
      const b = Math.abs(n);
      if (b !== 0 && (b >= 1e6 || b < 1e-4)) {
        const e = Math.floor(Math.log10(b) / 3) * 3;
        const m = n / Math.pow(10, e);
        return (Math.round(m * 1000) / 1000).toString().replace('.', ',') + '·10' + hoch(e);
      }
      return (Math.round(n * 10000) / 10000).toString().replace('.', ',');
    };
    const hoch = (e: number): string => {
      const zeichen: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²',
        '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
      return String(e).split('').map(c => zeichen[c] || c).join('');
    };

    /* Der Griff zum Grösseändern, unten rechts. */
    const griff = document.createElement('div');
    griff.className = 'fh-groesse';
    griff.setAttribute('aria-hidden', 'true');
    f.appendChild(griff);

    /* Escape schliesst (§38). */
    f.addEventListener('keydown', e => { if (e.key === 'Escape') schliessen(); });

    if (kapitelWunsch) merke(M_KAPITEL, kapitelWunsch);
    neuMalen();
    return f;
  };

  /** Auf- und zuklappen — für Tastenkürzel und Menüeinträge. */
  const umschalten = (kapitel?: string): void => {
    if (offen()) schliessen(); else oeffne(kapitel);
  };

  /* ------------------------------------------------------------------------
   * DER WEG HIERHER
   * ------------------------------------------------------------------------
   * Zwei Eingänge, und beide sind nötig.
   *
   * Der Knopf in der Planfläche ist der wichtigere — dort wird gezeichnet,
   * und dort wird nachgeschlagen. Aber eine Formel braucht man auch beim
   * Schreiben einer Aufgabe, beim Ausfüllen einer Tabelle und beim
   * Nachrechnen einer Rechnung, und für diese Fälle steht der Befehl in der
   * Palette (Strg K → „Formelheft"). Beides zeigt DASSELBE Fenster: es gibt
   * nur eines, und `umschalten` findet es wieder.
   *
   * Angemeldet wird beim Laden, nicht beim ersten Öffnen. Ein Befehl, der
   * erst existiert, nachdem man ihn einmal anders benutzt hat, ist kein
   * Befehl — er ist ein Andenken.
   * ----------------------------------------------------------------------*/
  if (typeof Register !== 'undefined' && Register.befehle) {
    Register.befehle.melde({
      titel: 'Formelheft öffnen',
      gruppe: 'Elektro',
      tun: () => umschalten()
    });
    Register.befehle.melde({
      titel: 'Formelheft: eigenes PDF laden',
      gruppe: 'Elektro',
      tun: () => { oeffne(); void pdfLaden(); }
    });
  }

  return { oeffne, schliessen, umschalten, offen,
           favoriten, favoritUmschalten, seitenFavoriten, seiteUmschalten,
           pdfLaden, pdfLoesen };
})();

(window as any).Formelheft = Formelheft;
