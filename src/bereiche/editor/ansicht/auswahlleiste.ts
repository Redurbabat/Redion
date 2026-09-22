/* ============================================================================
 * apps/schreiben/auswahlleiste/ansicht.js — aus notion.js herausgelöst
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/editor/ansicht/auswahlleiste.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/editor/ansicht/auswahlleiste.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Stammt aus der früheren Sammeldatei notion.js. Der Inhalt ist unverändert;
 * nur der Ort ist jetzt der, an dem man ihn sucht.
 * ==========================================================================*/

const Auswahl = (() => {

  let leiste: HTMLDivElement | null = null;
  let letzteFarbe = 'yellow';

  const weg = (): void => { if (leiste) { leiste.remove(); leiste = null; } };

  /* ------------------------------------------------------------------------
   * `getSelection()` gibt `Selection | null` — in einem abgetrennten Dokument
   * gibt es keine. Vorher stand hier siebenmal `s.rangeCount` ohne Nachsehen.
   * Das ist nicht theoretisch: die Auswahlleiste läuft auch, während eine
   * Seite neu gezeichnet wird.
   * ----------------------------------------------------------------------*/
  const auswahl = (): Selection | null => {
    const s = getSelection();
    return s && s.rangeCount ? s : null;
  };

  const markierterBlock = (): any => {
    const s = auswahl();
    if (!s) return null;
    const start = s.getRangeAt(0).startContainer;
    const n: Element | null = start.nodeType === 3
      ? start.parentElement
      : (start instanceof Element ? start : null);
    const blk = n?.closest<HTMLElement>('.blk');
    return blk ? Store.getBlock(blk.dataset['bid']) : null;
  };

  /** Textposition innerhalb des sichtbaren Blockinhalts. Bei schlichtem Text
      ist sie auch die gespeicherte Position; bei gerendertem Markdown faellt
      der Lernweg bewusst auf die bisherige Textsuche zurueck. */
  const auswahlOffset = (): number => {
    const selection = auswahl(); if (!selection) return -1;
    const range = selection.getRangeAt(0);
    const node = range.startContainer.nodeType === 3
      ? range.startContainer.parentElement : range.startContainer as Element;
    const content = node?.closest<HTMLElement>('.ct'); if (!content) return -1;
    try {
      const before = range.cloneRange(); before.selectNodeContents(content);
      before.setEnd(range.startContainer, range.startOffset);
      return before.toString().length;
    } catch { return -1; }
  };

  /** Der sichtbare Text des Blocks, in dem die Auswahl steht. */
  const sichtbarerText = (): string => {
    const selection = auswahl(); if (!selection) return '';
    const range = selection.getRangeAt(0);
    const node = range.startContainer.nodeType === 3
      ? range.startContainer.parentElement : range.startContainer as Element;
    return node?.closest<HTMLElement>('.ct')?.textContent ?? '';
  };

  /** Wie oft `was` in `wo` vor der Stelle `bis` beginnt. */
  const davor = (wo: string, was: string, bis: number): number => {
    let n = 0, i = -1;
    while ((i = wo.indexOf(was, i + 1)) !== -1 && i < bis) n++;
    return n;
  };

  /** Der Anfang des `n`-ten Vorkommens, von null gezählt; -1 wenn es fehlt. */
  const nteStelle = (wo: string, was: string, n: number): number => {
    let i = -1;
    for (let k = 0; k <= n; k++) {
      i = wo.indexOf(was, i + 1);
      if (i === -1) return -1;
    }
    return i;
  };

  /* ══ WELCHE STELLE GEMEINT IST (E650) ═══════════════════════════════════
   * Hier stand `(b.text || '').replace(txt, …)`, und zwar zweimal —
   * in `umschliesse` und in `linkSetzen`.
   *
   * `String.replace` mit einem STRING als Muster ersetzt das ERSTE
   * Vorkommen. Nicht das markierte. Wer in „Test und Test" das zweite Wort
   * markiert und auf Fett drückt, bekommt das erste fett, und an der Stelle,
   * die er angefasst hat, passiert nichts. Gemessen in `test542`:
   * `**Test** und Test` statt `Test und **Test**`.
   *
   * Das ist kein Absturz und keine Fehlermeldung — der Text ändert sich, nur
   * an der falschen Stelle. In einem langen Absatz merkt man es erst beim
   * Lesen, und dann steht schon nicht mehr da, was man geschrieben hat.
   *
   * DREI WEGE, IN DIESER REIHENFOLGE:
   *
   *   1  Der Normalfall. `auswahlOffset()` gibt die Zeichenzahl im
   *      SICHTBAREN Text; bei schlichtem Text ist das auch die gespeicherte
   *      Stelle. Wir prüfen das nach, statt es zu glauben: steht dort
   *      wirklich das gewählte Wort, ist die Sache entschieden.
   *
   *   2  Gerendertes Markdown. Ein `**fett**` davor verschiebt die
   *      Zeichenzahlen — die REIHENFOLGE aber nicht. Kommt das Wort im
   *      Sichtbaren genauso oft vor wie im Gespeicherten, dann ist das
   *      n-te hier auch das n-te dort.
   *
   *   3  Alles andere. Dann bleibt es beim alten Weg, und der Fehler
   *      bleibt in genau diesem Restfall bestehen. Das ist bewusst: ein
   *      Ratespiel an Nutzertext wäre schlimmer als ein bekannter Rest.
   * ====================================================================== */
  const stelleImText = (text: string, gewaehlt: string): number => {
    const off = auswahlOffset();
    if (off < 0 || !gewaehlt) return text.indexOf(gewaehlt);
    if (text.slice(off, off + gewaehlt.length) === gewaehlt) return off;

    const sicht = sichtbarerText();
    if (!sicht) return text.indexOf(gewaehlt);
    const imSicht = davor(sicht, gewaehlt, sicht.length);
    const imText = davor(text, gewaehlt, text.length);
    if (imSicht !== imText || imSicht === 0) return text.indexOf(gewaehlt);
    return nteStelle(text, gewaehlt, davor(sicht, gewaehlt, off));
  };

  /** `gewaehlt` an der gemeinten Stelle durch `ersatz` tauschen. */
  const tauscheDort = (text: string, gewaehlt: string, ersatz: string): string => {
    const i = stelleImText(text, gewaehlt);
    if (i < 0) return text;
    return text.slice(0, i) + ersatz + text.slice(i + gewaehlt.length);
  };

  /* ══ LIEGT DIE MARKE SCHON DRUM HERUM? (E668) ═══════════════════════════
   * Fett war ein Stempel und kein Schalter: wer ein fettes Wort markierte
   * und noch einmal auf Fett drückte, bekam `****Wort****`. Gezeichnet wird
   * daraus `**Wort**` als sichtbarer Text — die Marke steht dann IM Absatz.
   *
   * Geprüft wird an der gefundenen Stelle, nicht mit einer Suche: steht
   * unmittelbar davor und dahinter die Marke, ist sie schon da.
   *
   * DER FALL, DER EINEN SORGFÄLTIG MACHT: `*` ist die halbe `**`. In
   * `Ein **fetter** Satz` steht vor „fetter" ein `*` und dahinter auch —
   * wer das für Kursiv hielte, würde beim Abschalten `*fetter*` daraus
   * machen und das FETT löschen. Deshalb die zwei Zeilen darunter: eine
   * einzelne `*` gilt nur, wenn daneben keine zweite steht. */
  const istUmschlossen = (text: string, i: number, laenge: number, marke: string): boolean => {
    if (i < marke.length) return false;
    if (text.slice(i - marke.length, i) !== marke) return false;
    if (text.slice(i + laenge, i + laenge + marke.length) !== marke) return false;
    if (marke === '*' && (text[i - 2] === '*' || text[i + laenge + 1] === '*')) return false;
    return true;
  };

  /** Legt Marken um die Auswahl — oder nimmt sie weg, wenn sie schon da
   *  sind. Ein Schalter, wie in jedem Textprogramm (E668). */
  const umschliesse = (marke: string): void => {
    const txt = getSelection()?.toString() ?? '';
    if (!txt) return;
    const b = markierterBlock();
    if (!b) return;
    const alt = b.text || '';
    const i = stelleImText(alt, txt);
    const neu = (i >= 0 && istUmschlossen(alt, i, txt.length, marke))
      ? alt.slice(0, i - marke.length) + txt + alt.slice(i + txt.length + marke.length)
      : tauscheDort(alt, txt, marke + txt + marke);
    Store.updateBlock(b.id, { text: neu });
    App.zeichneSeite(b.id, 'ende');
    weg();
  };

  /**
   * Legt die markierte Stelle als Markdown-Link ab.
   *
   * Ein gemeinsamer Weg für die Auswahlleiste, Strg/Cmd+K und das Einfügen
   * einer Adresse. Vorher versprach die Kürzelliste Strg+K, tatsächlich
   * öffnete aber der globale Griff die Suche.
   */
  const linkSetzen = (adresse?: string): boolean => {
    const text = getSelection()?.toString() ?? '';
    if (!text) return false;
    const bl = markierterBlock();
    if (!bl) return false;
    const url = adresse ?? prompt('Adresse des Links', 'https://') ?? '';
    if (!url || url === 'https://') return false;
    Store.updateBlock(bl.id, { text: tauscheDort(bl.text || '', text, `[${text}](${url})`) });
    App.zeichneSeite(bl.id, 'ende');
    weg();
    return true;
  };

  const zeigen = (): void => {
    const s = auswahl();
    const txt = s?.toString().trim();
    if (!s || !txt) { weg(); return; }
    const bereich = s.getRangeAt(0);
    const start = bereich.startContainer.parentElement;
    if (!start || !start.closest('#page') || !start.closest('.ct')) { weg(); return; }

    weg();
    const r = bereich.getBoundingClientRect();
    leiste = document.createElement('div');
    leiste.className = 'auswahlleiste';
    leiste.innerHTML =
      '<button data-a="ki" class="ki">✨ KI</button>' +
      '<span class="tr"></span>' +
      '<button data-a="turn">Umwandeln ▾</button>' +
      '<span class="tr"></span>' +
      '<button data-a="b" title="Fett — Strg B"><b>B</b></button>' +
      '<button data-a="i" title="Kursiv — Strg I"><i>I</i></button>' +
      '<button data-a="u" title="Unterstrichen — Strg U"><u>U</u></button>' +
      '<button data-a="s" title="Durchgestrichen — Strg Shift S"><s>S</s></button>' +
      '<button data-a="c" title="Code — Strg E">&lt;/&gt;</button>' +
      '<button data-a="m" title="Formel">∑</button>' +
      '<button data-a="cloze" title="Aus der Auswahl eine Lückenkarte anlegen">▣ Lücke</button>' +
      '<button data-a="link" title="Link — Strg K">🔗</button>' +
      '<span class="tr"></span>' +
      '<button data-a="komm" title="Kommentar — Strg Shift M">💬</button>' +
      '<button data-a="farbe" title="Farbe">🎨 ▾</button>';

    document.body.appendChild(leiste);
    const mass = leiste.getBoundingClientRect();

    /* WOHIN DIE LEISTE GEHÖRT — EINE IDEE, DIE AM MASSBAND GESCHEITERT IST.
     *
     * Sie steht ÜBER der Auswahl und liegt damit auf der Zeile davor. Beim
     * Zeichnen des Entwurfs zu E218 war das der auffälligste Fehler im Bild:
     * man wählt einen Satz und verliert dafür den davor. Notion und Linear
     * machen es genauso, also schien der freie Rand rechts der bessere Ort —
     * im Entwurf waren dort 424 px Platz.
     *
     * NACHGEMESSEN AN DER LAUFENDEN APP bei 1440 px:
     *
     *     #scroll   240 … 1440    die Fläche
     *     #page     390 … 1290    die Textspalte, 900 px breit
     *     frei rechts   150 px
     *     die Leiste    552 px    (vierzehn Knöpfe, drei davon mit Wort)
     *
     * Es passt nicht, und zwar nicht knapp. Der Entwurf hatte eine schmalere
     * Spalte gezeichnet, als Redion sie hat — die Zahl 424 stammte aus dem
     * Bild, nicht aus der App.
     *
     * Der Umbau lag hier schon fertig, mit sauberem Rückfall auf den alten
     * Weg. Er wäre auf jedem Fenster in diesen Rückfall gelaufen, also
     * niemals sichtbar geworden: dreissig Zeilen, die nichts tun. Deshalb
     * steht hier wieder die eine Zeile und darüber, warum es bei ihr bleibt.
     * Wer es doch will, braucht zuerst eine schmalere Leiste — nicht eine
     * andere Position. */
    leiste.style.left = Math.max(8, Math.min(r.left, innerWidth - mass.width - 10)) + 'px';
    leiste.style.top = Math.max(8, r.top - mass.height - 8) + 'px';

    leiste.addEventListener('mousedown', e => e.preventDefault());
    leiste.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      const b = ziel?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      const a = b.dataset['a'];
      const block = markierterBlock();
      const text = getSelection()?.toString() ?? '';
      const textOffset = auswahlOffset();

      if (a === 'b') return umschliesse('**');
      if (a === 'i') return umschliesse('*');
      if (a === 'u') return umschliesse('__');
      if (a === 's') return umschliesse('~~');
      if (a === 'c') return umschliesse('`');
      if (a === 'm') return umschliesse('$');
      if (a === 'cloze') {
        weg();
        const learning = (window as any).Learning;
        if (block && learning?.clozeFromSelection) learning.clozeFromSelection(block, text, textOffset);
        else UI.toast('Die Lernwerkzeuge sind noch nicht geladen.');
        return;
      }
      if (a === 'link') {
        linkSetzen();
        return;
      }
      if (a === 'ki') {
        weg();
        App.kiPanel(true);
        KI.frageMitAuswahl(text);
        return;
      }
      if (a === 'komm') { weg(); if (block) Kommentare.neu(block, text); return; }
      if (a === 'turn') {
        const rr = b.getBoundingClientRect();
        weg();
        if (block) Blocks.umwandelnMenue(rr, block);
        return;
      }
      if (a === 'farbe') {
        const rr = b.getBoundingClientRect();
        /* Die Namen kommen aus `core/helpers/colors.ts` (E406). Hier standen
           sie als eigene Liste — und sagten „Lila" und „Pink", wo das
           Notizheft „Violett" und „Rosa" sagt. Zwei Namen für eine Farbe in
           derselben App sind kein Stil, sondern ein Fehler. */
        const FARBEN: Array<[string, string]> =
          Farben.alle().map(id => [id, Farben.name(id)]);
        const m = UI.menu(
          '<div class="grp">Textfarbe</div><div class="swatches">' +
          FARBEN.map(([f, n]) => `<button data-c="${f}" title="${n}" aria-label="Textfarbe ${n}" ` +
            `style="background:var(--c-${f})"></button>`).join('') +
          '</div><div class="grp">Hintergrund</div><div class="swatches">' +
          FARBEN.slice(1).map(([f, n]) => `<button data-c="bg-${f}" title="${n}" aria-label="Hintergrund ${n}" ` +
            `style="background:var(--b-${f})"></button>`).join('') +
          '</div>', rr.left, rr.bottom + 6);
        m.addEventListener('click', (ev: MouseEvent) => {
          const zielC = ev.target instanceof Element ? ev.target : null;
          const c = zielC?.closest<HTMLElement>('button[data-c]');
          const farbe = c?.dataset['c'];
          if (!farbe || !block) return;
          letzteFarbe = farbe;
          Store.updateBlock(block.id, { color: farbe === 'default' ? '' : farbe });
          m.remove(); weg(); App.zeichneSeite();
        });
        return;
      }
    });
  };

  const letzteFarbeAnwenden = (): void => {
    const b = markierterBlock();
    if (!b) return;
    Store.updateBlock(b.id, { color: letzteFarbe });
    App.zeichneSeite();
  };

  /** Das Element, auf das geklickt wurde — oder nichts. */
  const elementVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const start = (): void => {
    document.addEventListener('mouseup', e => {
      const t = elementVon(e);
      if (t?.closest('.auswahlleiste') || t?.closest('.menu')) return;
      setTimeout(zeigen, 10);
    });
    document.addEventListener('keyup', e => {
      if (e.shiftKey && e.key.startsWith('Arrow')) setTimeout(zeigen, 10);
    });
    document.addEventListener('mousedown', e => {
      if (!elementVon(e)?.closest('.auswahlleiste')) weg();
    });
    document.addEventListener('scroll', weg, true);
  };

  return { start, zeigen, weg, umschliesse, linkSetzen, letzteFarbeAnwenden };
})();
(window as any).Auswahl = Auswahl;


/* ==========================================================================
 * 3. ERWÄHNUNGEN UND EMOJIS
 * --------------------------------------------------------------------------
 * @ für Seite, Datum oder Person · : für Emoji — beides mitten im Text.
 * ========================================================================*/
