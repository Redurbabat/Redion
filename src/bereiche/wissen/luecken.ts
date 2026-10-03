/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/luecken.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/wissen/luecken.ts — die Lückenansicht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/luecken.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/bereiche/wissen/luecken.js`.
 * ----------------------------------------------------------------------------
 * `core/knowledge/gaps.ts` FINDET. Diese Datei SAMMELT und ZEIGT: sie holt
 * Seiten, Verweise, Schlagwörter und den Rang aus dem Bestand, reicht sie
 * hinein und stellt das Ergebnis dar.
 *
 * ─── UND SIE MACHT E285 ENDLICH SICHTBAR ────────────────────────────────────
 *
 * Der Wissensrang wurde gebaut und danach von niemandem benutzt — 400 Zeilen
 * gerechneter PageRank, den kein Mensch je zu sehen bekam. Hier bekommt er
 * seine erste Aufgabe: „wichtig, aber lange nicht angefasst" lässt sich ohne
 * ihn gar nicht stellen. Der Grad täte es nicht; eine Seite, auf die zwanzig
 * Wegwerfnotizen zeigen, ist nicht wichtig.
 *
 * ─── WAS BEIM SAMMELN WEGGELASSEN WIRD, UND WARUM ───────────────────────────
 *
 * Karteikarten. Eine Karteikarte IST eine Frage — sie hier als „offene
 * Frage" zu listen hiesse, jedem Lernenden seine eigene Kartei als
 * Wissenslücke vorzuwerfen. Bei einem Bestand mit dreihundert Karten wäre
 * die Liste damit unbrauchbar, und zwar auf die schlimmste Art: sie sähe
 * voll und fleissig aus.
 *
 * Dasselbe gilt für Prüfungsfragen, Umfragen und alles andere, wo die Frage
 * der Inhalt ist. Die Liste steht als Wert in `FRAGE_IST_INHALT`.
 * ==========================================================================*/

const Wissensluecken = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /**
   * Blockarten, in denen eine Frage der INHALT ist und keine Lücke.
   * Als Wert und nicht als `if` im Code, damit eine neue Blockart hier
   * eingetragen werden kann, ohne die Sammelschleife zu verstehen.
   */
  const FRAGE_IST_INHALT = ['flashcard', 'quiz', 'pruefungsfrage', 'umfrage', 'code'];

  /** Was jede Fundart im Kopf trägt: Zeichen, Name, ein Satz zur Art. */
  const ARTEN: Record<string, { zeichen: string; name: string; was: string }> = {
    geist:      { zeichen: '👻', name: 'Geisterverweise',
                  was: 'Erwähnt, aber nie geschrieben.' },
    mehrdeutig: { zeichen: '🔀', name: 'Mehrdeutige Verweise',
                  was: 'Der Verweis passt auf mehrere Seiten.' },
    verstaubt:  { zeichen: '🕸', name: 'Wichtig, aber verstaubt',
                  was: 'Trägt viel im Netz und wurde lange nicht angefasst.' },
    frage:      { zeichen: '❓', name: 'Offene Fragen',
                  was: 'Selbst aufgeschrieben und nie beantwortet.' },
    insel:      { zeichen: '🏝', name: 'Inseln',
                  was: 'Hängt an nichts.' },
    thema:      { zeichen: '🌱', name: 'Dünne Themen',
                  was: 'Ein Schlagwort an genau einer Seite.' }
  };

  /* ------------------------------------------------------------------------
   * SAMMELN
   * ---------------------------------------------------------------------- */

  /** Der Text einer Seite mitsamt ihren Blöcken — ohne die Frage-Blockarten. */
  const seitentext = (seiteId: string): string => {
    const teile: string[] = [];
    const gesehen = new Set<string>();
    const gehe = (id: string, tiefe: number): void => {
      if (tiefe > 40 || gesehen.has(id)) return;
      gesehen.add(id);
      const b = Store.getBlock(id);
      if (!b || b.alive === false) return;
      if (id !== seiteId && FRAGE_IST_INHALT.includes(String(b.type))) return;
      if (b.text) teile.push(String(b.text));
      for (const kind of (b.content || [])) gehe(kind, tiefe + 1);
    };
    gehe(seiteId, 0);
    return teile.join('\n');
  };

  /**
   * Alles zusammentragen, was `KnowledgeGaps.finden` braucht.
   * Getrennt vom Zeichnen, damit die Prüfung es ohne Fenster messen kann.
   */
  const sammeln = (): any => {
    const vorbereitet = Links.graphVorbereiten();
    const index = vorbereitet.index;

    /* Der Rang: erst rechnen, dann in Punkte von 0 bis 100 umsetzen. */
    const knoten = [...index.nodes.values()].filter((n: any) => n.kind !== 'tag')
      .map((n: any) => ({ id: n.id, kind: n.kind, edited: n.edited }));
    const kanten = index.edges.filter((e: any) => e.kind !== 'tag')
      .map((e: any) => ({ source: e.source, target: e.target, kind: e.kind }));
    const ergebnis = KnowledgeRank.rank(knoten, kanten);
    const punkte = KnowledgeRank.punkte(ergebnis, knoten);
    const rangNach: Record<string, number> = Object.create(null);
    for (const p of punkte) rangNach[p.id] = p.punkte;

    /* Der Grad — ohne Schlagwortkanten, denn ein Tag verbindet alles mit
       allem und würde jede Insel zur Halbinsel machen. */
    const grad: Record<string, number> = Object.create(null);
    for (const e of kanten) {
      grad[e.source] = (grad[e.source] || 0) + 1;
      grad[e.target] = (grad[e.target] || 0) + 1;
    }

    const seiten = knoten.map((n: any) => {
      const b = Store.getBlock(n.id);
      return {
        id: n.id,
        titel: (b && b.text) || (index.nodes.get(n.id) || {}).name || 'Ohne Titel',
        text: seitentext(n.id),
        edited: (b && (b.edited || b.created)) || n.edited || '',
        grad: grad[n.id] || 0,
        rang: rangNach[n.id] || 0,
        /* DIE ABSICHT (E329, L105 Punkt 4). `gesperrt` ist das einzige
           Zeichen, mit dem ein Mensch Redion sagt „hier bin ich fertig" —
           und die Lückensuche fragte nie danach. */
        gesperrt: !!(b && b.gesperrt)
      };
    });

    const verweise = Links.alleSeitenverweise().map((v: any) => ({
      vonId: v.vonId, vonTitel: v.vonTitel, ziel: v.ziel,
      status: v.status, kandidaten: v.kandidaten
    }));

    const themen = Links.alleTags().map((t: any) => ({
      tag: t.tag, seiten: t.seiten.map((p: any) => p.id)
    }));

    return { seiten, verweise, themen };
  };

  /* ==========================================================================
   * DER MERKER (L105 Punkt 3, E330)
   * --------------------------------------------------------------------------
   * L105 sagte: „Die Ansicht rechnet bei jedem Öffnen neu. PageRank über den
   * ganzen Graphen, alle Verweise auflösen, jede Seite nach Fragen
   * durchsuchen. Bei Redions Demobestand sind das Millisekunden; bei
   * zehntausend Seiten wird es spürbar, und es gibt keinen
   * Fortschrittsbalken. Genau dafür gibt es seit E286 die Auftragsmaschine."
   *
   * GEMESSEN, BEVOR GEBAUT WURDE (§55.2 sinngemäss — erst nachsehen, ob es
   * das Problem gibt, das man lösen will):
   *
   *     Seiten   sammeln   finden
   *         63     28 ms    12 ms
   *        263     43 ms    12 ms
   *        763     88 ms    19 ms
   *       1763    173 ms    28 ms
   *
   * Zwei Dinge stehen darin, und beide ändern den Plan.
   *
   * ERSTENS: sechsundachtzig Prozent der Zeit liegen im SAMMELN, nicht im
   * Finden. Zwischenzuspeichern ist also das Sammeln, und das ist die
   * billigere Hälfte der Arbeit — kein Auftrag, keine Maschine, kein
   * Fortschrittsbalken.
   *
   * ZWEITENS: 173 ms bei 1763 Seiten. Hochgerechnet auf die zehntausend aus
   * der Lücke wäre es ungefähr eine Sekunde. Das ist spürbar, aber es ist
   * KEINE Arbeit, die einen Auftrag braucht — ein Auftrag lohnt bei Minuten,
   * nicht bei einer Sekunde. Was L105 vorschlug, wäre also mehr Maschinerie
   * gewesen als das Problem gross ist. Die Zahl steht deshalb in der Lücke,
   * und der Auftrag bleibt ungebaut.
   *
   * WAS DER MERKER WIRKLICH BRINGT, und das steht so nicht in der Lücke:
   * `befund()` wird nicht nur beim Öffnen gerufen, sondern auch nach JEDEM
   * Haken (E324). Ein Haken ändert `erledigt` — und `erledigt` geht gar
   * nicht ins Sammeln ein. Vorher kostete jeder Haken den ganzen Graphen
   * noch einmal.
   * ========================================================================*/

  /**
   * Ein Fingerabdruck des Bestands: WIE VIELE Blöcke, WELCHER ist der
   * neueste, und die SUMME aller Zeitstempel.
   *
   * Die Summe ist nicht Zierde. Ohne sie wäre der Abdruck aus Zahl und
   * neuestem Stempel blind gegen zwei Änderungen in derselben Millisekunde
   * an verschiedenen Blöcken: die Zahl bliebe gleich, der neueste auch. Mit
   * ihr nicht, denn ein Block kann seinen Stempel nur vorwärts bewegen.
   *
   * Gerechnet wird ab 2020, damit die Summe klein bleibt: rohe Millisekunden
   * seit 1970 ergäben bei zehntausend Blöcken 1,7 · 10^16 und damit mehr,
   * als eine Fliesskommazahl noch genau hält.
   */
  const BASIS = Date.UTC(2020, 0, 1);

  const abdruck = (): string => {
    const bl = (typeof Store !== 'undefined' && Store.cache && Store.cache.blocks) || {};
    let n = 0, neuste = '', summe = 0;
    for (const id in bl) {
      n++;
      const b = bl[id];
      const t = (b && (b.edited || b.created)) || '';
      if (t > neuste) neuste = t;
      const ms = Date.parse(t);
      if (Number.isFinite(ms)) summe += ms - BASIS;
    }
    return n + '|' + neuste + '|' + summe;
  };

  let merker: { abdruck: string; wert: any } | null = null;

  /** Den Merker wegwerfen. Für Prüfläufe und für alles, was am Bestand rüttelt. */
  const vergessen = (): void => { merker = null; };

  const gesammelt = (): any => {
    const jetzt = abdruck();
    if (merker && merker.abdruck === jetzt) return merker.wert;
    const wert = sammeln();
    merker = { abdruck: jetzt, wert };
    return wert;
  };

  /* ------------------------------------------------------------------------
   * ERLEDIGTES (L105 Punkt 2, E324)
   * ------------------------------------------------------------------------
   * Wer einen Fund gesehen und für unwichtig befunden hat, sah ihn beim
   * nächsten Öffnen wieder. Für Geister ist das richtig — sie verschwinden
   * von selbst, sobald die Seite da ist. Für offene Fragen und Inseln nicht:
   * manche Frage bleibt absichtlich offen, und eine Liste, die einen
   * beharrlich auf dieselbe Stelle stösst, hört man nach dem dritten Mal
   * nicht mehr.
   *
   * GEMERKT WIRD NUR EINE KENNUNG, nie ein Fund. Wer eine Seite löscht und
   * neu anlegt, bekommt seinen Haken zurück; wer seine Frage umformuliert,
   * bekommt sie wieder vorgelegt. Beides ist richtig so — abgehakt ist der
   * FUND, nicht die Zeile.
   * ---------------------------------------------------------------------- */

  const SCHL_ERLEDIGT = 'wissen:luecken:erledigt';

  const erledigte = (): string[] => {
    const l = Store.getMeta(SCHL_ERLEDIGT, []);
    return Array.isArray(l) ? l.filter((x: unknown) => typeof x === 'string') : [];
  };

  const abhaken = (id: string): void => {
    if (!id) return;
    const l = erledigte();
    if (l.indexOf(id) >= 0) return;
    Store.setMeta(SCHL_ERLEDIGT, l.concat([id]));
  };

  /** Alles wieder hervorholen. Rückgängig, immer — nichts wurde gelöscht. */
  const wiederZeigen = (): number => {
    const n = erledigte().length;
    Store.setMeta(SCHL_ERLEDIGT, []);
    return n;
  };

  /**
   * Der Befund von jetzt.
   *
   * Das SAMMELN kommt aus dem Merker, wenn sich am Bestand nichts geändert
   * hat; das FINDEN läuft immer. Das ist kein Geiz, sondern die Trennlinie:
   * `erledigt` und `jetzt` gehen ins Finden ein und nicht ins Sammeln. Ein
   * zwischengespeicherter Befund wäre falsch, sobald ein Tag vergeht — ein
   * zwischengespeicherter Graph nicht.
   */
  const befund = (opt: any = {}): any => {
    const { seiten, verweise, themen } = gesammelt();
    return KnowledgeGaps.finden(seiten, verweise, themen,
      { erledigt: erledigte(), ...opt });
  };

  /* ------------------------------------------------------------------------
   * ZEIGEN
   * ---------------------------------------------------------------------- */

  const fundHtml = (f: any, nr: number): string => {
    const art = ARTEN[f.art] || { zeichen: '•', name: f.art, was: '' };
    /* Die Stärke steht als ZAHL da und nicht nur als Balkenlänge — §38:
       keine Auskunft nur über Farbe oder Form. */
    const stufe = f.staerke >= 70 ? 'hoch' : f.staerke >= 40 ? 'mittel' : 'schwach';
    const wort = stufe === 'hoch' ? 'deutlich'
               : stufe === 'mittel' ? 'wahrscheinlich' : 'schwach';
    const quellen = (f.quellen || []).slice(0, 4);
    return '<li class="wl-fund" data-nr="' + nr + '">' +
      '<span class="wl-zeichen" aria-hidden="true">' + art.zeichen + '</span>' +
      '<div class="wl-mitte">' +
        '<div class="wl-titel">' + esc(f.titel) + '</div>' +
        '<div class="wl-satz">' + esc(f.satz) + '</div>' +
        (quellen.length
          ? '<div class="wl-quellen">' + quellen.map((q: any) =>
              '<button type="button" class="wl-quelle" data-open="' + esc(q.id) + '">' +
              esc(q.titel) + '</button>').join('') +
            ((f.quellen || []).length > quellen.length
              ? '<span class="wl-mehr">+' + ((f.quellen || []).length - quellen.length) + '</span>'
              : '') +
            '</div>'
          : '') +
      '</div>' +
      '<div class="wl-rechts">' +
        '<span class="wl-staerke wl-' + stufe + '" title="Sicherheit: ' + wort + '">' +
          f.staerke + '</span>' +
        (f.art === 'geist'
          ? '<button type="button" class="rb wl-tun" data-anlegen="' + esc(f.titel) + '">' +
            'Seite anlegen</button>'
          : f.seiteId
            ? '<button type="button" class="rb wl-tun" data-open="' + esc(f.seiteId) + '">' +
              'Öffnen</button>'
            : '') +
        /* Abhaken, und der Titel sagt, dass es zurückgeht (E324). */
        '<button type="button" class="wl-hak" data-hak="' + esc(f.id || '') + '" ' +
          'title="Abhaken — kommt nicht wieder, bis du sie wieder zeigst" ' +
          'aria-label="„' + esc(f.titel) + '" abhaken">✓</button>' +
      '</div>' +
    '</li>';
  };

  /** Kopf und Liste neu füllen — nach jedem Haken. */
  const fuellen = (o: HTMLElement): void => {
    const b = befund();

    const kopf = o.querySelector('.wl-kopf');
    const titelZahl = o.querySelector('#wl-titel em');
    if (titelZahl) titelZahl.textContent = String(b.gezaehlt);
    if (kopf) {
      const zaehlung = Object.entries(b.jeArt)
        .sort((x: any, y: any) => y[1] - x[1])
        .map(([art, n]: any) => '<span class="wl-zaehler">' +
          (ARTEN[art] ? ARTEN[art].zeichen + ' ' + ARTEN[art].name : esc(art)) +
          ' <em>' + n + '</em></span>').join('');
      kopf.innerHTML = esc(b.satz) +
        (zaehlung ? '<div class="wl-zaehlung">' + zaehlung + '</div>' : '') +
        /* DER WEG ZURÜCK, und nur wenn es einen zu gehen gibt. Ein „0
           abgehakt · wieder zeigen" stünde bei jedem Öffnen da und wäre nach
           dem zweiten Mal unsichtbar. */
        (b.versteckt
          ? '<div class="wl-zurueck">' + b.versteckt +
            (b.versteckt === 1 ? ' Fund ist abgehakt' : ' Funde sind abgehakt') +
            ' <button type="button" class="wl-wieder">wieder zeigen</button></div>'
          : '');
    }

    const res = o.querySelector('#wl-res');
    if (!res) return;
    if (!b.funde.length) {
      res.innerHTML = '<div class="wl-leer">' +
        (b.versteckt
          ? 'Alles abgehakt. Nichts steht mehr offen.'
          : 'Nichts gefunden. Der Bestand hängt zusammen — oder es ist noch ' +
            'zu wenig darin.') + '</div>';
      return;
    }
    const stark = b.funde.filter((f: any) => f.staerke >= KnowledgeGaps.VORGABE.schwelle);
    const schwach = b.funde.filter((f: any) => f.staerke < KnowledgeGaps.VORGABE.schwelle);
    res.innerHTML =
      (stark.length ? '<ul class="wl-ul">' +
        stark.map((f: any, i: number) => fundHtml(f, i)).join('') + '</ul>' : '') +
      (schwach.length
        ? '<details class="wl-schwach"><summary>' + schwach.length +
          ' schwächere Beobachtung' + (schwach.length === 1 ? '' : 'en') +
          ' — zu unsicher zum Zählen</summary><ul class="wl-ul">' +
          schwach.map((f: any, i: number) => fundHtml(f, stark.length + i)).join('') +
          '</ul></details>'
        : '');
  };

  const zeigen = (): void => {
    const b = befund();

    const o = document.createElement('div');
    o.className = 'overlay';
    const zaehlung = Object.entries(b.jeArt)
      .sort((x: any, y: any) => y[1] - x[1])
      .map(([art, n]: any) => '<span class="wl-zaehler">' +
        (ARTEN[art] ? ARTEN[art].zeichen + ' ' + ARTEN[art].name : esc(art)) +
        ' <em>' + n + '</em></span>').join('');

    o.innerHTML =
      '<div class="finder wl-box" role="dialog" aria-modal="true" ' +
           'aria-labelledby="wl-titel" style="width:min(760px,94vw)">' +
        '<div class="fh" id="wl-titel">Wissenslücken <em>' + b.gezaehlt + '</em></div>' +
        '<div class="wl-kopf">' + esc(b.satz) +
          (zaehlung ? '<div class="wl-zaehlung">' + zaehlung + '</div>' : '') +
        '</div>' +
        '<div class="res wl-liste" id="wl-res"></div>' +
        '<div class="hint">Alles hier kommt aus deinem eigenen Bestand — ' +
          'keine KI, kein Netz. Die Zahl rechts sagt, wie sicher der Fund ist.</div>' +
      '</div>';
    document.body.appendChild(o);

    fuellen(o);

    /* Escape schliesst (§38).

       HIER STAND EINMAL, Redion habe KEINEN gemeinsamen Escape-Griff für
       `.overlay`. Das war falsch und wurde am 1. September 2026 mit E302
       widerlegt: der Griff steht seit E272 Phase G in `schale.ts` und nimmt
       das oberste Fenster. L105 Punkt 1 hält den Irrtum fest — er entstand
       aus dem Gedächtnis statt aus einer Messung.

       Der eigene Griff hier bleibt trotzdem stehen und schadet nicht: beide
       zusammen schliessen genau ein Fenster, und test296 misst das. */
    const aufEscape = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      o.remove();
    };
    document.addEventListener('keydown', aufEscape);
    const wegRaeumen = new MutationObserver(() => {
      if (!document.body.contains(o)) {
        document.removeEventListener('keydown', aufEscape);
        wegRaeumen.disconnect();
      }
    });
    wegRaeumen.observe(document.body, { childList: true });

    o.addEventListener('click', e => {
      const ziel = (e.target as HTMLElement | null);
      const anlegen = ziel?.closest<HTMLElement>('[data-anlegen]');
      if (anlegen) {
        const name = anlegen.dataset.anlegen || '';
        o.remove();
        Links.oeffneOderAnlegen(name);
        return;
      }
      const hak = ziel?.closest<HTMLElement>('[data-hak]');
      if (hak) {
        abhaken(hak.dataset.hak || '');
        fuellen(o);
        return;
      }
      if (ziel?.closest('.wl-wieder')) {
        const n = wiederZeigen();
        fuellen(o);
        try { UI.toast(n === 1 ? 'Ein Fund ist wieder da.'
                               : n + ' Funde sind wieder da.'); } catch { /* egal */ }
        return;
      }
      const auf = ziel?.closest<HTMLElement>('[data-open]');
      if (auf) { o.remove(); App.oeffne(auf.dataset.open); return; }
      if (e.target === o) o.remove();
    });
  };

  return { zeigen, befund, sammeln, gesammelt, abdruck, vergessen,
           seitentext, ARTEN, FRAGE_IST_INHALT,
           erledigte, abhaken, wiederZeigen, SCHL_ERLEDIGT };
})();

(window as any).Wissensluecken = Wissensluecken;
