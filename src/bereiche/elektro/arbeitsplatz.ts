/* ============================================================================
 * bereiche/elektro/arbeitsplatz.ts — üben, prüfen, arbeiten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/elektro/arbeitsplatz.ts`.
 * ----------------------------------------------------------------------------
 * DREI SPALTEN, EINE ARBEIT (Punkt 100)
 *
 * Redur hat den Arbeitsplatz so beschrieben: „links Aufgaben/Fachzeichen, in
 * der Mitte PDF oder Schaltplan und rechts Formelblatt, Werte, Lösung und
 * persönliche Notizen."
 *
 * Der Grund für drei Spalten ist nicht Platz, sondern ZEIT. Eine Aufgabe
 * lösen heisst: lesen, zeichnen, nachschlagen, rechnen, aufschreiben — und
 * zwischen diesen fünf Dingen springt man ein Dutzend Mal hin und her. Wer
 * dafür die Ansicht wechseln muss, verliert bei jedem Sprung den Faden, und
 * am Ende hat er die Aufgabe dreimal neu gelesen.
 *
 * WAS HIER NICHT NEU IST
 *
 * Die Mitte ist ein gewöhnlicher Redion-Block — ein Schaltplan oder eine
 * PDF-Seite. Rechts steht das Formelheft, das es schon gibt. Links stehen
 * Aufgaben, die `Elektroaufgaben` erzeugt. Dieses Modul erfindet nichts
 * davon neu; es stellt es nebeneinander. Ein zweiter Schaltplaneditor „für
 * den Arbeitsplatz" wäre L34 in gross: zwei Editoren, die auseinanderlaufen,
 * und niemand merkt es, bis einer etwas kann, was der andere nicht kann.
 *
 * DER PRÜFUNGSMODUS (Punkt 99)
 *
 * Er ist dieselbe Aufgabenliste mit drei Unterschieden: die Erklärung kommt
 * erst am Schluss, die Aufgaben sind gemischt, und es gibt eine Auswertung.
 * Der Startwert der Prüfung wird angezeigt — damit lässt sich dieselbe
 * Prüfung noch einmal stellen, im Unterricht für alle gleich, und beim
 * Nachbesprechen zeigt sie wieder genau dieselben Aufgaben.
 * ==========================================================================*/

const Elektroarbeitsplatz = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Was sich der Arbeitsplatz merkt. Alles in `Store.meta` — es gehört dem
     Menschen und nicht einem Dokument. */
  const M_STAND    = 'elektro:uebungsstand';   /* richtig/falsch je Art */
  const M_ARTEN    = 'elektro:uebungsarten';   /* welche Arten gewählt sind */
  const M_PRUEFUNG = 'elektro:letztePruefung'; /* Startwert und Ergebnis */

  const merke = (k: string, w: unknown): void => {
    if (typeof Store !== 'undefined') Store.setMeta(k, w);
  };
  const gemerkt = <T>(k: string, vorgabe: T): T =>
    (typeof Store !== 'undefined') ? Store.getMeta(k, vorgabe) : vorgabe;

  type Stand = Record<string, { richtig: number; falsch: number }>;

  const stand = (): Stand => {
    const roh = gemerkt<Stand>(M_STAND, {});
    return (roh && typeof roh === 'object') ? roh : {};
  };

  /**
   * Einen Versuch verbuchen.
   *
   * Gezählt wird JE ART und nicht je Aufgabe: die einzelne Aufgabe ist
   * gewürfelt und kommt nie wieder, die Art bleibt. „Bei Anschlussnummern
   * liege ich in der Hälfte der Fälle daneben" ist eine Auskunft, mit der
   * man etwas anfangen kann; „Aufgabe 4711 war falsch" ist keine.
   */
  const verbuche = (art: string, richtig: boolean): Stand => {
    const s = stand();
    const e = s[art] || { richtig: 0, falsch: 0 };
    if (richtig) e.richtig++; else e.falsch++;
    s[art] = e;
    merke(M_STAND, s);
    return s;
  };

  /** Die schwächste Art — die, die als Nächste drankommen sollte. */
  const schwaeche = (): string | null => {
    const s = stand();
    let schlechteste: string | null = null;
    let quote = 1;
    Object.keys(s).forEach(art => {
      const e = s[art]!;
      const gesamt = e.richtig + e.falsch;
      if (gesamt < 3) return;               /* zu wenig, um etwas zu sagen */
      const q = e.richtig / gesamt;
      if (q < quote) { quote = q; schlechteste = art; }
    });
    return quote < 0.8 ? schlechteste : null;
  };

  const A = () => (typeof Elektroaufgaben !== 'undefined') ? Elektroaufgaben : null;

  /* ------------------------------------------------------------------------
   * EINE AUFGABE ZEICHNEN
   * ------------------------------------------------------------------------
   * Nur HTML, kein Zustand. Die Fläche unten hängt die Ereignisse dran.
   * ----------------------------------------------------------------------*/
  const aufgabeHtml = (a: any, opt: { beantwortet?: boolean; antwort?: string;
                                      richtig?: boolean; hinweis?: string;
                                      pruefung?: boolean } = {}): string => {
    if (!a) return `<div class="ea-leer"><p>Keine Aufgabe.</p></div>`;
    const fz = (typeof Register !== 'undefined' && Register.fachzeichen)
      ? Register.fachzeichen : null;

    /* Das Bild zur Frage: ein einzelnes Zeichen oder ein ganzer Plan. */
    let bild = '';
    if (a.zeichen && fz) {
      bild = `<div class="ea-bild">${fz.alsSvg(a.zeichen, { farbe: 'currentColor' })}</div>`;
    } else if (a.plan && typeof Schaltplan !== 'undefined') {
      /* Beim Stromweg wird IN den Plan getippt. Die angetippten Leitungen
         gehen als `auswahl` an denselben Zeichner, der sie auch im Editor
         hervorhebt — keine zweite Darstellung für dieselbe Sache. */
      const wege = a.antwortart === 'wege';
      /* Vor dem Antworten zeigt die Hervorhebung, was ANGETIPPT wurde.
         Danach zeigt sie, was RICHTIG gewesen wäre — sonst sähe man sein
         eigenes Kreuz und wüsste immer noch nicht, wo der Strom fliesst.
         Dass die Bedeutung wechselt, steht als Zeile darunter; eine
         Hervorhebung, die zwei Dinge heissen kann, ohne es zu sagen, ist
         schlimmer als keine. */
      const menge = (x: unknown) =>
        new Set(String(x ?? '').split(',').map(y => y.trim()).filter(Boolean));
      const zeigen: Set<string> = !wege ? new Set()
        : opt.beantwortet ? menge(a.loesung) : menge(opt.antwort);
      const tippbar = wege && !opt.beantwortet;
      const svg = Schaltplan.alsSvg(a.plan, {
        raster: false, anschluesse: false, nummern: false,
        ...(wege ? { auswahl: zeigen } : {}),
        ...(tippbar ? { tippbar: true } : {})
      });
      bild = `<div class="ea-bild ea-plan${tippbar ? ' ea-tippbar' : ''}"` +
        (tippbar ? ` role="group" aria-label="Leitungen antippen"` : '') +
        `>${svg}</div>` +
        (wege ? `<p class="ea-planhinweis">` +
          (opt.beantwortet
            ? 'Hervorgehoben: der Weg, den der Strom wirklich nimmt.'
            : 'Hervorgehoben: was du angetippt hast.') +
          `</p>` : '');
    }

    /* Die Frage kann mehrzeilig sein (Rechenaufgaben haben Gegeben/Gesucht). */
    const frage = String(a.frage).split('\n')
      .map((z: string, i: number) => i === 0
        ? `<p class="ea-frage">${esc(z)}</p>`
        : `<p class="ea-frage-zusatz">${esc(z)}</p>`).join('');

    let antwortfeld = '';
    if (a.antwortart === 'wahl') {
      antwortfeld = `<div class="ea-wahl">` + (a.optionen as string[]).map((o, i) => {
        const gewaehlt = opt.antwort === o;
        const istLoesung = o === a.loesung;
        /* Nach dem Antworten wird die richtige Antwort IMMER markiert — auch
           wenn man sie getroffen hat. Wer nur sieht „falsch", weiss immer
           noch nicht, was stimmt, und rät beim nächsten Mal wieder. */
        const klasse = !opt.beantwortet ? ''
          : istLoesung ? ' loesung'
          : gewaehlt ? ' daneben' : '';
        const svg = (a.optionZeichen && fz)
          ? fz.alsSvg(a.optionZeichen[i], { farbe: 'currentColor' }) : '';
        return `<button class="ea-option${klasse}${gewaehlt ? ' gewaehlt' : ''}" ` +
          `data-wahl="${esc(o)}"${opt.beantwortet ? ' disabled' : ''}>` +
          (svg ? `<span class="ea-optionbild">${svg}</span>` : '') +
          `<span class="ea-optiontext">${esc(o)}</span></button>`;
      }).join('') + `</div>`;
    } else if (a.antwortart === 'wege') {
      /* Kein Eingabefeld — die Antwort steht im Plan. Hier stehen nur der
         Zähler und der Knopf.
         Der Zähler nennt NICHT, wie viele es sein müssen: das wäre die halbe
         Lösung. Er sagt nur, wie viele man bisher angetippt hat, damit man
         weiss, dass ein Tipp angekommen ist. */
      const wieViele = String(opt.antwort ?? '')
        .split(',').map(x => x.trim()).filter(Boolean).length;
      antwortfeld =
        `<div class="ea-eingabe ea-wege">` +
        `<span class="ea-zaehler" aria-live="polite">` +
        (wieViele === 1 ? '1 Leitung markiert' : `${wieViele} Leitungen markiert`) +
        `</span>` +
        (opt.beantwortet ? ''
          : `<button data-a="wege-leeren"${wieViele ? '' : ' disabled'}>Zurücksetzen</button>` +
            `<button class="prim" data-a="wege-pruefen"${wieViele ? '' : ' disabled'}>Prüfen</button>`) +
        `</div>`;
    } else {
      antwortfeld =
        `<div class="ea-eingabe">` +
        `<input type="text" inputmode="decimal" class="ea-antwort" ` +
        `value="${esc(opt.antwort ?? '')}" placeholder="Antwort" ` +
        `aria-label="Antwort"${opt.beantwortet ? ' disabled' : ''}>` +
        (a.einheit ? `<span class="ea-einheit">${esc(a.einheit)}</span>` : '') +
        (opt.beantwortet ? '' : `<button class="prim" data-a="pruefen">Prüfen</button>`) +
        `</div>`;
    }

    /* Die Auflösung. Im Prüfungsmodus kommt sie erst am Schluss — sonst
       wäre die Prüfung eine Übung mit Zeitdruck. */
    const aufloesung = (opt.beantwortet && !opt.pruefung)
      ? `<div class="ea-aufloesung ${opt.richtig ? 'gut' : 'daneben'}">` +
        `<p class="ea-urteil">${opt.richtig ? '✓ Richtig' : '✗ ' + esc(opt.hinweis || '')}</p>` +
        `<p class="ea-warum">${esc(a.erklaerung)}</p>` +
        (a.weg ? `<ol class="ea-weg">` + (a.weg as string[])
          .map(z => `<li>${esc(z)}</li>`).join('') + `</ol>` : '') +
        `</div>`
      : (opt.beantwortet && opt.pruefung)
      ? `<div class="ea-aufloesung still"><p class="ea-urteil">Antwort notiert.</p></div>`
      : '';

    return `<article class="ea-aufgabe" data-art="${esc(a.art)}" data-saat="${esc(a.saat)}">` +
      `<div class="ea-kopfzeile"><span class="ea-artname">` +
      esc((A()?.artVon(a.art) || { name: a.art }).name) + `</span>` +
      `<span class="ea-stufe" title="Schwierigkeit">${'●'.repeat(a.stufe)}` +
      `<span class="ea-stufe-aus">${'●'.repeat(3 - a.stufe)}</span></span></div>` +
      bild + frage + antwortfeld + aufloesung + `</article>`;
  };

  /**
   * Die Griffe im Plan auf Fingergrösse bringen (§37, Punkt 59).
   *
   * Ein SVG wird auf die Breite seines Kastens verkleinert; ein Radius von
   * neun Planeinheiten wird dabei zu vier Bildschirmpixeln. Wie stark
   * verkleinert wird, steht erst fest, wenn das Bild im Baum hängt — CSS
   * kann es deshalb nicht wissen, und der Zeichner beim Erzeugen auch nicht.
   * Also wird hier gemessen und der Radius nachgestellt.
   *
   * `ZIEL` ist der Durchmesser in Bildschirmpixeln. 44 ist die Zahl aus §37.
   */
  const griffeGross = (wo: ParentNode): void => {
    const ZIEL = 44;
    wo.querySelectorAll('.ea-tippbar svg').forEach(el => {
      const svg = el as SVGSVGElement;
      const vb = (svg.getAttribute('viewBox') || '').split(/\s+/).map(Number);
      const breite = svg.getBoundingClientRect().width;
      if (!breite || !vb[2]) return;
      const faktor = breite / vb[2];
      if (faktor <= 0) return;
      const r = Math.max(9, (ZIEL / 2) / faktor);
      svg.querySelectorAll('.sp-griff').forEach(g =>
        (g as SVGCircleElement).setAttribute('r', String(Math.round(r * 10) / 10)));
    });
  };

  /* ------------------------------------------------------------------------
   * DIE ÜBUNGSFLÄCHE
   * ----------------------------------------------------------------------*/
  const uebung = (): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'ea-wrap';

    const arten = (): string[] => {
      const roh = gemerkt<string[]>(M_ARTEN, []);
      return Array.isArray(roh) ? roh : [];
    };

    let jetzt: any = null;
    let beantwortet = false;
    let antwort = '';
    let letzte: { richtig: boolean; hinweis: string } | null = null;

    const naechste = (artWunsch?: string): void => {
      const a = A(); if (!a) return;
      const gewaehlt = arten();
      /* Ohne Wunsch: die schwächste Art bevorzugen, wenn es eine gibt. Das
         ist der ganze Sinn einer Statistik — sonst übt man weiter das, was
         man ohnehin kann. */
      const art = artWunsch
        || (gewaehlt.length === 1 ? gewaehlt[0] : undefined)
        || (gewaehlt.length ? undefined : schwaeche() || undefined);
      let neu = a.erzeuge(art);
      /* Ist eine Auswahl getroffen, muss die Aufgabe dazu passen. */
      if (gewaehlt.length && neu && !gewaehlt.includes(neu.art)) {
        for (let i = 0; i < 20 && neu && !gewaehlt.includes(neu.art); i++)
          neu = a.erzeuge(gewaehlt[i % gewaehlt.length]);
      }
      jetzt = neu; beantwortet = false; antwort = ''; letzte = null;
      male();
    };

    const antworte = (wert: string): void => {
      const a = A(); if (!a || !jetzt || beantwortet) return;
      antwort = wert;
      letzte = a.pruefe(jetzt, wert);
      beantwortet = true;
      verbuche(jetzt.art, letzte.richtig);
      male();
    };

    const male = (): void => {
      const a = A();
      const s = stand();
      const gewaehlt = arten();
      const gesamt = Object.values(s).reduce(
        (n, e) => n + e.richtig + e.falsch, 0);
      const richtig = Object.values(s).reduce((n, e) => n + e.richtig, 0);

      wurzel.innerHTML =
        `<div class="ea-leiste">` +
        `<div class="ea-artwahl">` +
        `<button class="ea-art${gewaehlt.length ? '' : ' an'}" data-art="">Alles gemischt</button>` +
        (a ? (a.ARTEN as any[]).map(x =>
          `<button class="ea-art${gewaehlt.includes(x.id) ? ' an' : ''}" ` +
          `data-art="${esc(x.id)}" title="${esc(x.gruppe)}">${esc(x.name)}</button>`).join('') : '') +
        `</div></div>` +
        `<div class="ea-buehne">${aufgabeHtml(jetzt, {
          beantwortet, antwort, richtig: letzte?.richtig ?? false,
          hinweis: letzte?.hinweis ?? '' })}</div>` +
        `<div class="ea-fuss">` +
        `<span class="ea-stand">` +
        (gesamt
          ? `${richtig} von ${gesamt} richtig` +
            (schwaeche() ? ` · schwach: ${esc((a?.artVon(schwaeche()!) || { name: '' }).name)}` : '')
          : 'Noch nichts geübt') + `</span>` +
        `<button class="prim" data-a="weiter">${beantwortet ? 'Nächste Aufgabe' : 'Überspringen'}</button>` +
        `</div>`;

      /* Der auslaufende Rand an der Artenleiste — über `Rollrand`, wie
         überall sonst auch (E141, E151, E159, E188). Die Kante gehört an
         `.ea-leiste`: ein Pseudo-Element im Rollfeld rollte mit. */
      const band = wurzel.querySelector('.ea-artwahl') as HTMLElement | null;
      if (band && typeof Rollrand !== 'undefined')
        Rollrand.binde(band, { art: 'mehr',
                               an: band.closest('.ea-leiste') as HTMLElement | null });
      /* Und die gewählte Art ins Bild holen, sonst sieht man nicht, wo man ist. */
      const aktiv = band?.querySelector('.an') as HTMLElement | null;
      if (aktiv) aktiv.scrollIntoView({ block: 'nearest', inline: 'nearest' });

      /* Zweimal: einmal jetzt (für jedes Neuzeichnen im eingehängten Baum)
         und einmal im nächsten Bild. Beim ERSTEN Durchgang hängt `wurzel`
         noch nicht im Dokument — `uebung()` zeichnet, bevor `zeigeAls` das
         Ergebnis einsetzt —, und dann ist die gemessene Breite null. */
      griffeGross(wurzel);
      requestAnimationFrame(() => griffeGross(wurzel));

      /* Am Telefon ist der Tippplan breiter als das Fenster und wird
         geschoben. Ohne auslaufende Kante sieht ein abgeschnittener
         Schaltplan nach einem Fehler aus und nicht nach einer Einladung
         zum Wischen (E151, E159). */
      const tippfeld = wurzel.querySelector('.ea-plan.ea-tippbar') as HTMLElement | null;
      if (tippfeld && typeof Rollrand !== 'undefined')
        Rollrand.binde(tippfeld, { art: 'mehr' });
    };

    wurzel.addEventListener('click', e => {
      /* `.ea-art` und nicht bloss `[data-art]`.
         ------------------------------------------------------------------
         Die Aufgabe selbst trägt `data-art` als ANGABE — `<article
         class="ea-aufgabe" data-art="plan-fehler">` —, die Knöpfe der
         Artenleiste tragen es als BEFEHL. `closest('[data-art]')` sieht
         beide gleich, und damit landete jeder Klick irgendwo in die Aufgabe
         hinein beim Artenknopf: die Aufgabe wurde neu gewürfelt UND der
         gewählte Übungsbereich stillschweigend auf ihre Art umgestellt.
         Aufgefallen ist es beim Antippen einer Leitung (Punkt 59) — vorher
         gab es in der Aufgabe nichts, worauf man klickt. */
      const b = (e.target as Element).closest<HTMLElement>('[data-a],[data-wahl],.ea-art');
      if (!b) return;
      if (b.dataset.art !== undefined) {
        /* Mehrfachauswahl: mit gedrückter Umschalttaste dazu, sonst nur die
           eine. „Alles gemischt" leert die Auswahl. */
        const id = b.dataset.art;
        const alt = arten();
        const neu = !id ? []
          : (e as MouseEvent).shiftKey
            ? (alt.includes(id) ? alt.filter(x => x !== id) : [...alt, id])
            : (alt.length === 1 && alt[0] === id ? [] : [id]);
        merke(M_ARTEN, neu);
        naechste();
        return;
      }
      if (b.dataset.wahl !== undefined) { antworte(b.dataset.wahl); return; }
      if (b.dataset.a === 'weiter') { naechste(); return; }
      if (b.dataset.a === 'wege-leeren') { antwort = ''; male(); return; }
      if (b.dataset.a === 'wege-pruefen') { antworte(antwort); return; }
      if (b.dataset.a === 'pruefen') {
        const f = wurzel.querySelector('.ea-antwort') as HTMLInputElement | null;
        if (f) antworte(f.value);
        return;
      }
    });

    /* Tippen auf eine Leitung im Plan (Punkt 59).
       Eigener Zuhörer, weil der obere nur auf `[data-a]`, `[data-wahl]` und
       `[data-art]` hört — eine Leitung trägt keines davon, sondern die
       Kennung, die auch der Editor benutzt. */
    wurzel.addEventListener('click', e => {
      if (!jetzt || jetzt.antwortart !== 'wege' || beantwortet) return;
      const feld = (e.target as Element).closest('.ea-tippbar');
      if (!feld) return;
      const griff = (e.target as Element).closest('.sp-griff');
      const id = griff ? (griff as unknown as HTMLElement).dataset.id : '';
      if (!id) return;
      const bisher = new Set(antwort.split(',').map(x => x.trim()).filter(Boolean));
      if (bisher.has(id)) bisher.delete(id); else bisher.add(id);
      antwort = [...bisher].sort().join(',');
      male();
    });
    wurzel.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const f = e.target as HTMLElement;
      if (!f.classList.contains('ea-antwort')) return;
      e.preventDefault();
      if (beantwortet) naechste(); else antworte((f as HTMLInputElement).value);
    });

    naechste();
    return wurzel;
  };

  /* ------------------------------------------------------------------------
   * DER PRÜFUNGSMODUS (Punkt 99)
   * ----------------------------------------------------------------------*/
  type Pruefung = {
    saat: number; aufgaben: any[]; antworten: string[];
    jetzt: number; fertig: boolean;
  };

  const pruefungStarten = (anzahl = 10, saat?: number): Pruefung | null => {
    const a = A(); if (!a) return null;
    const s = (typeof saat === 'number') ? saat : Math.floor(Math.random() * 2147483647);
    const aufgaben = a.reihe(anzahl, { saat: s });
    if (!aufgaben.length) return null;
    return { saat: s, aufgaben, antworten: aufgaben.map(() => ''),
             jetzt: 0, fertig: false };
  };

  /** Auswerten — je Aufgabe und in der Summe. */
  const auswerten = (p: Pruefung): {
    richtig: number; gesamt: number; prozent: number;
    note: string; einzeln: Array<{ art: string; richtig: boolean; hinweis: string }>;
  } => {
    const a = A();
    const einzeln = p.aufgaben.map((auf, i) => {
      const pr = a ? a.pruefe(auf, p.antworten[i]) : { richtig: false, hinweis: '' };
      return { art: auf.art, richtig: pr.richtig, hinweis: pr.hinweis };
    });
    const richtig = einzeln.filter(x => x.richtig).length;
    const gesamt = einzeln.length;
    const prozent = gesamt ? Math.round(richtig / gesamt * 100) : 0;
    /* Die Schweizer Notenskala, linear von 1 bis 6. Sie steht hier, weil
       Redion für die Schweizer Grundbildung gebaut wird — und sie steht
       als FORMEL da, damit niemand sie für eine amtliche Bewertung hält. */
    const note = gesamt ? (1 + 5 * richtig / gesamt).toFixed(1) : '—';
    return { richtig, gesamt, prozent, note, einzeln };
  };

  const pruefungFlaeche = (anzahl = 10, saat?: number): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'ea-wrap ea-pruefung';
    let p = pruefungStarten(anzahl, saat);

    const male = (): void => {
      if (!p) {
        wurzel.innerHTML = `<div class="ea-leer"><p>Es lassen sich keine ` +
          `Aufgaben erzeugen. Fehlt ein Register?</p></div>`;
        return;
      }
      if (p.fertig) {
        const e = auswerten(p);
        merke(M_PRUEFUNG, { saat: p.saat, richtig: e.richtig, gesamt: e.gesamt });
        wurzel.innerHTML =
          `<div class="ea-ergebnis">` +
          `<h3>${e.richtig} von ${e.gesamt} richtig</h3>` +
          `<p class="ea-note">Note ${esc(e.note)} · ${e.prozent} %</p>` +
          `<ol class="ea-liste">` + e.einzeln.map((x, i) =>
            `<li class="${x.richtig ? 'gut' : 'daneben'}">` +
            `<b>${i + 1}.</b> ${esc((A()?.artVon(x.art) || { name: x.art }).name)}` +
            (x.richtig ? '' : ` — ${esc(x.hinweis)}`) + `</li>`).join('') + `</ol>` +
          /* Der Startwert wird angezeigt: damit lässt sich dieselbe Prüfung
             im Unterricht für alle gleich stellen und später Wort für Wort
             nachbesprechen. Ohne ihn ist jede Prüfung einmalig und die
             Besprechung eine Erinnerungsübung. */
          `<p class="ea-saat">Startwert dieser Prüfung: <code>${esc(p.saat)}</code>` +
          ` — damit kommt sie genau so wieder.</p>` +
          `<div class="ea-fuss"><button data-a="durchgehen">Aufgaben durchgehen</button>` +
          `<button class="prim" data-a="neu">Neue Prüfung</button></div></div>`;
        return;
      }
      const a = p.aufgaben[p.jetzt];
      wurzel.innerHTML =
        `<div class="ea-leiste"><span class="ea-fortschritt">` +
        `Aufgabe ${p.jetzt + 1} von ${p.aufgaben.length}</span>` +
        `<span class="ea-balken"><i style="width:${(p.jetzt / p.aufgaben.length * 100).toFixed(0)}%"></i></span>` +
        `</div>` +
        `<div class="ea-buehne">${aufgabeHtml(a, {
          beantwortet: false, antwort: p.antworten[p.jetzt] ?? '', pruefung: true })}</div>` +
        `<div class="ea-fuss">` +
        `<button data-a="zurueck"${p.jetzt ? '' : ' disabled'}>Zurück</button>` +
        `<button class="prim" data-a="vor">` +
        (p.jetzt + 1 === p.aufgaben.length ? 'Abgeben' : 'Weiter') + `</button></div>`;
    };

    const merkeAntwort = (): void => {
      if (!p) return;
      const feld = wurzel.querySelector('.ea-antwort') as HTMLInputElement | null;
      if (feld) p.antworten[p.jetzt] = feld.value;
    };

    wurzel.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-a],[data-wahl]');
      if (!b || !p) return;
      if (b.dataset.wahl !== undefined) {
        p.antworten[p.jetzt] = b.dataset.wahl;
        /* In der Prüfung geht es nach der Wahl WEITER — aber ohne Auflösung.
           Wer zurückblättert, sieht seine Antwort noch stehen und kann sie
           ändern; das ist bei jeder Prüfung auf Papier auch so. */
        if (p.jetzt + 1 < p.aufgaben.length) p.jetzt++;
        else p.fertig = true;
        male();
        return;
      }
      const was = b.dataset.a;
      if (was === 'vor') {
        merkeAntwort();
        if (p.jetzt + 1 < p.aufgaben.length) p.jetzt++; else p.fertig = true;
        male(); return;
      }
      if (was === 'zurueck') { merkeAntwort(); p.jetzt = Math.max(0, p.jetzt - 1); male(); return; }
      if (was === 'neu') { p = pruefungStarten(anzahl); male(); return; }
      if (was === 'durchgehen') {
        /* Nach der Abgabe darf alles gezeigt werden — jetzt ist es Lernstoff
           und keine Prüfung mehr. */
        const e2 = auswerten(p);
        wurzel.innerHTML = `<div class="ea-durchgang">` +
          p.aufgaben.map((auf, i) => aufgabeHtml(auf, {
            beantwortet: true, antwort: p!.antworten[i] ?? '',
            richtig: e2.einzeln[i]!.richtig, hinweis: e2.einzeln[i]!.hinweis
          })).join('') +
          `<div class="ea-fuss"><button class="prim" data-a="neu">Neue Prüfung</button></div>` +
          `</div>`;
        return;
      }
    });

    male();
    return wurzel;
  };

  /* ------------------------------------------------------------------------
   * DER ARBEITSPLATZ SELBST (Punkt 100)
   * ----------------------------------------------------------------------*/
  const arbeitsplatz = (mitte?: HTMLElement): HTMLElement => {
    const wurzel = document.createElement('div');
    wurzel.className = 'ea-platz';

    const links = document.createElement('div');
    links.className = 'ea-spalte ea-links';
    const mittel = document.createElement('div');
    mittel.className = 'ea-spalte ea-mitte';
    const rechts = document.createElement('div');
    rechts.className = 'ea-spalte ea-rechts';

    links.innerHTML = `<div class="ea-spaltenkopf">Aufgaben</div>`;
    links.appendChild(uebung());

    mittel.innerHTML = `<div class="ea-spaltenkopf">Plan</div>`;
    if (mitte) mittel.appendChild(mitte);
    else mittel.insertAdjacentHTML('beforeend',
      `<div class="ea-leer"><p>Hier steht dein Schaltplan oder eine PDF-Seite.</p>` +
      `<p class="ea-klein">Öffne eine Seite mit einem Schaltplan-Block, oder ` +
      `füge über das Plus einen neuen ein.</p></div>`);

    rechts.innerHTML = `<div class="ea-spaltenkopf">Notizen</div>` +
      `<textarea class="ea-notizen" placeholder="Eigene Notizen zu dieser Aufgabe …" ` +
      `aria-label="Notizen"></textarea>` +
      `<div class="ea-werkzeuge">` +
      `<button data-a="heft">📐 Formelheft</button>` +
      `<button data-a="pruefung">📝 Prüfung starten</button>` +
      `</div>`;

    /* Die Notizen gehören dem Menschen und überleben den Neustart. */
    const feld = rechts.querySelector('.ea-notizen') as HTMLTextAreaElement;
    feld.value = String(gemerkt('elektro:notizen', ''));
    let warten: number | undefined;
    feld.addEventListener('input', () => {
      window.clearTimeout(warten);
      warten = window.setTimeout(() => merke('elektro:notizen', feld.value), 400);
    });

    rechts.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'heft' && typeof Formelheft !== 'undefined')
        Formelheft.umschalten();
      if (b.dataset.a === 'pruefung') {
        mittel.querySelectorAll('.ea-wrap, .ea-leer').forEach(x => x.remove());
        mittel.appendChild(pruefungFlaeche(10));
      }
    });

    wurzel.appendChild(links);
    wurzel.appendChild(mittel);
    wurzel.appendChild(rechts);
    return wurzel;
  };

  /* Zwei Befehle, damit man überhaupt hierher kommt. */
  if (typeof Register !== 'undefined' && Register.befehle) {
    Register.befehle.melde({
      titel: 'Elektro: üben', gruppe: 'Elektro',
      tun: () => zeigeAls('Elektro üben', uebung())
    });
    Register.befehle.melde({
      titel: 'Elektro: Prüfung starten', gruppe: 'Elektro',
      tun: () => zeigeAls('Elektro-Prüfung', pruefungFlaeche(10))
    });
    Register.befehle.melde({
      titel: 'Elektro: Arbeitsplatz', gruppe: 'Elektro',
      tun: () => zeigeAls('Elektro-Arbeitsplatz', arbeitsplatz())
    });
  }

  /**
   * Etwas in einem grossen Fenster zeigen.
   *
   * Absichtlich schlicht: eine Überlagerung mit Titel und Schliessknopf.
   * Ein eigener Bereich mit eigener Navigation wäre mehr Bauwerk als Nutzen,
   * solange nicht klar ist, ob der Arbeitsplatz täglich oder wöchentlich
   * gebraucht wird.
   */
  const zeigeAls = (titel: string, inhalt: HTMLElement): void => {
    const o = document.createElement('div');
    o.className = 'overlay ea-overlay';
    o.innerHTML = `<div class="finder ea-fenster">` +
      `<div class="fh"><span>${esc(titel)}</span>` +
      `<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>` +
      `<div class="ea-inhalt"></div></div>`;
    (o.querySelector('.ea-inhalt') as HTMLElement).appendChild(inhalt);
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-a]');
      if (e.target === o || (b && b.dataset.a === 'zu')) o.remove();
    });
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      o.remove();
      document.removeEventListener('keydown', beiTaste);
    };
    document.addEventListener('keydown', beiTaste);
  };

  return { uebung, pruefungFlaeche, arbeitsplatz, aufgabeHtml, zeigeAls,
           stand, verbuche, schwaeche, pruefungStarten, auswerten };
})();

(window as any).Elektroarbeitsplatz = Elektroarbeitsplatz;
