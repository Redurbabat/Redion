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
        rang: rangNach[n.id] || 0
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

  /** Der Befund von jetzt. */
  const befund = (opt: any = {}): any => {
    const { seiten, verweise, themen } = sammeln();
    return KnowledgeGaps.finden(seiten, verweise, themen, opt);
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
      '</div>' +
    '</li>';
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

    const res = o.querySelector('#wl-res');
    if (res) {
      if (!b.funde.length) {
        res.innerHTML = '<div class="wl-leer">Nichts gefunden. ' +
          'Der Bestand hängt zusammen — oder es ist noch zu wenig darin.</div>';
      } else {
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
      }
    }

    /* Escape schliesst (§38). Das ist hier ausdrücklich hingeschrieben, weil
       Redion KEINEN gemeinsamen Escape-Griff für `.overlay` hat — der Graph
       und das Schlagwortregister schliessen deshalb bis heute nicht auf
       Escape. Das ist eine eigene Lücke (L105) und keine Ausrede, ein neues
       Fenster ohne den Griff zu bauen. */
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
      const auf = ziel?.closest<HTMLElement>('[data-open]');
      if (auf) { o.remove(); App.oeffne(auf.dataset.open); return; }
      if (e.target === o) o.remove();
    });
  };

  return { zeigen, befund, sammeln, seitentext, ARTEN, FRAGE_IST_INHALT };
})();

(window as any).Wissensluecken = Wissensluecken;
