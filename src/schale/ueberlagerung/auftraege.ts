/* ============================================================================
 * schale/ueberlagerung/auftraege.ts — was gerade im Hintergrund läuft
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/ueberlagerung/auftraege.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/schale/ueberlagerung/auftraege.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen;
 * `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * EINE SACHE, DIE LÄUFT UND DIE NIEMAND SIEHT (L103 Punkt 3, E322).
 *
 * Die Auftragsmaschine (E286) meldet seit ihrem ersten Tag `auftrag.schritt`
 * mit Schritt, Schrittzahl und einem Satz für den Menschen. Zugehört hat
 * niemand. `Auftraege.offen()` und `Auftraege.abbrechen(id)` gab es auch —
 * benutzt hat sie keine Oberfläche.
 *
 * Das ist §47 von der leisen Seite. Nicht ein Knopf, der nichts tut, sondern
 * umgekehrt: eine Arbeit, die läuft, minutenlang dauern kann und über die
 * die App schweigt. Wer nicht weiss, dass etwas läuft, hält die App für
 * hängen — und wer nicht abbrechen kann, schliesst den Reiter.
 *
 * ─── ERSCHEINT NUR, WENN ETWAS LÄUFT ────────────────────────────────────────
 *
 * Derselbe Grundsatz wie bei der Glocke (E251): ohne offene Aufträge ist der
 * Knopf `hidden`. Ein dauerhaft sichtbares „0 Aufträge" wäre die Anzeige,
 * die immer anzeigt und deshalb nicht gelesen wird — und in einer Zeile, die
 * am Telefon ohnehin rollt, kostete sie einen Platz umsonst.
 *
 * ─── DER BALKEN LÜGT NICHT ──────────────────────────────────────────────────
 *
 * `schritte: 0` heisst „unbekannt viele" — das ist im Modell so vorgesehen.
 * Ein Balken, der daraus 0 % oder 100 % macht, behauptet etwas. Bei
 * unbekannter Gesamtzahl gibt es deshalb KEINEN Balken, sondern die Zahl der
 * fertigen Schritte. Eine ehrliche Zahl schlägt einen erfundenen Balken.
 * ==========================================================================*/

const AuftragsAnzeige = (() => {

  /* MENSCHLICHE NAMEN — ZWEITE WAHL SEIT E327.
     Zuerst wird die Maschine gefragt: wer eine Art anmeldet, gibt ihren
     Namen mit (`Auftraege.anmelden(art, laeufer, name)`). Diese Liste hier
     bleibt als Rückfall für Arten, die noch keinen mitbringen — sie
     entstand, als es noch gar keine gab, und ihre fünf Einträge sind
     Vorgriffe. Genau daran fiel der Fehler auf: die ERSTE Art, die es
     wirklich gab, stand nicht darin, und im Fenster erschien „pdf-bilder"
     als Überschrift für einen Menschen. */
  const NAMEN: Record<string, string> = {
    'ocr': 'Text aus Bildern lesen',
    'pdf-einlesen': 'PDF einlesen',
    'sicherung': 'Sicherung schreiben',
    'embeddings': 'Gedächtnis bauen',
    'import': 'Import'
  };

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const artWort = (art: string): string => {
    const vonDerArt = (typeof Auftraege !== 'undefined' && Auftraege.artName)
      ? Auftraege.artName(art) : '';
    return vonDerArt || NAMEN[art] || String(art || 'Auftrag');
  };

  /**
   * Wie weit ist er — oder null, wenn es keinen ehrlichen Balken gibt.
   *
   * ZWEI FÄLLE OHNE BALKEN, und der zweite fiel erst auf dem Bild auf:
   *
   *   · `schritte: 0` heisst „unbekannt viele". Ein Balken daraus wäre
   *     erfunden.
   *   · `zustand: 'wartet'` heisst NOCH NICHT ANGEFANGEN. Ein leerer Balken
   *     dort sagt „0 % fertig" — das klingt nach Arbeit, die läuft und
   *     nicht vorankommt. „wartet" ist die Auskunft, und die steht schon
   *     darunter. Auf dem Bild standen ein leerer Balken und das Wort
   *     „wartet" untereinander und widersprachen sich.
   */
  const anteil = (a: any): number | null => {
    if (a?.zustand === 'wartet') return null;
    const ganz = Number(a?.schritte);
    const fertig = Number(a?.schritt);
    if (!Number.isFinite(ganz) || ganz <= 0) return null;
    if (!Number.isFinite(fertig) || fertig < 0) return 0;
    return Math.max(0, Math.min(1, fertig / ganz));
  };

  /**
   * Ein Satz zum Stand — und er sagt, was er weiss, nicht mehr.
   *
   * `wartet` ist ein eigener Zustand und kein Fortschritt: der Auftrag ist
   * angelegt und hat noch keinen Schritt gemacht. „0 von 12" dort wäre
   * wahr, aber „wartet" ist die Auskunft, die man sucht.
   */
  const standSatz = (a: any): string => {
    if (a?.zustand === 'wartet') return 'wartet';
    if (a?.zustand === 'fehler') return 'Fehler — wird erneut versucht';
    const ganz = Number(a?.schritte);
    const fertig = Number(a?.schritt) || 0;
    if (Number.isFinite(ganz) && ganz > 0) return fertig + ' von ' + ganz;
    return fertig === 1 ? '1 Schritt fertig' : fertig + ' Schritte fertig';
  };

  let fenster: HTMLElement | null = null;

  const zeileHtml = (a: any): string => {
    const q = anteil(a);
    return '<div class="arb-z" data-id="' + esc(a.id) + '">' +
      '<div class="arb-kopf">' +
        '<b>' + esc(artWort(a.art)) + '</b>' +
        '<button type="button" class="arb-stopp" data-stopp="' + esc(a.id) + '" ' +
          'aria-label="' + esc(artWort(a.art)) + ' abbrechen">Abbrechen</button>' +
      '</div>' +
      (a.text ? '<div class="arb-text">' + esc(a.text) + '</div>' : '') +
      /* Der Balken NUR bei bekannter Gesamtzahl — sonst die Zahl allein. */
      (q === null ? '' :
        '<div class="arb-balken" role="progressbar" aria-valuemin="0" aria-valuemax="100" ' +
          'aria-valuenow="' + Math.round(q * 100) + '">' +
          '<i style="width:' + Math.round(q * 100) + '%"></i></div>') +
      '<div class="arb-stand">' + esc(standSatz(a)) +
        (a.versuche > 1 ? ' · ' + a.versuche + '. Versuch' : '') + '</div>' +
    '</div>';
  };

  /** Die offenen holen und das Fenster neu füllen. */
  const auffrischen = async (): Promise<void> => {
    if (!fenster) return;
    let liste: any[] = [];
    try { liste = await Auftraege.offen(); } catch { liste = []; }
    const koerper = fenster.querySelector('.arb-liste');
    if (!koerper) return;
    koerper.innerHTML = liste.length
      ? liste.map(zeileHtml).join('')
      /* Wer das Fenster offen hat, während der letzte Auftrag fertig wird,
         soll nicht in eine leere Fläche schauen. */
      : '<div class="arb-leer">Nichts läuft mehr. Alles erledigt.</div>';
    koerper.querySelectorAll<HTMLElement>('[data-stopp]').forEach(b =>
      b.addEventListener('click', async () => {
        b.setAttribute('disabled', 'disabled');
        b.textContent = 'wird abgebrochen …';
        try { await Auftraege.abbrechen(b.dataset['stopp'] || ''); } catch { /* egal */ }
        await auffrischen();
      }));
  };

  /**
   * Der Knopf oben rechts: sichtbar NUR, solange etwas läuft.
   *
   * Wird bei jedem Auftragsereignis gerufen und beim Aufbau der Leiste.
   * Findet er den Knopf nicht (die Leiste ist gerade nicht gebaut), tut er
   * nichts — das ist kein Fehler, sondern der Normalfall am Telefon.
   */
  const knopfFrisch = async (): Promise<void> => {
    const b = document.getElementById('mb-auftraege');
    if (!b) return;
    let n = 0;
    try { n = (await Auftraege.offen()).length; } catch { n = 0; }
    b.hidden = n === 0;
    const zahl = b.querySelector('b');
    if (zahl) {
      zahl.textContent = String(n);
      (zahl as HTMLElement).hidden = n < 2;
    }
    /* Die Zahl ist nur Bild — die Wörter stehen im Label (§38). */
    const wort = n === 1 ? '1 Auftrag läuft' : n + ' Aufträge laufen';
    b.setAttribute('aria-label', wort);
    b.title = wort;
  };

  /** Das Fenster öffnen. */
  const oeffnen = (): void => {
    zu();
    const o = document.createElement('div');
    o.className = 'overlay arb-fenster';
    o.innerHTML =
      '<div class="arb-kasten" role="dialog" aria-label="Was gerade läuft">' +
        '<div class="arb-titel">Was gerade läuft' +
          '<button type="button" class="arb-zu" aria-label="Schliessen">×</button>' +
        '</div>' +
        '<div class="arb-liste"></div>' +
      '</div>';
    document.body.appendChild(o);
    fenster = o;
    o.querySelector('.arb-zu')?.addEventListener('click', zu);
    o.addEventListener('click', e => { if (e.target === o) zu(); });
    void auffrischen();
  };

  const zu = (): void => {
    document.querySelectorAll('.arb-fenster').forEach(x => x.remove());
    fenster = null;
  };

  const offenSichtbar = (): boolean => !!fenster;

  /**
   * Auf die Maschine hören.
   *
   * EINMAL, und das ist wichtig: die Menüleiste wird bei jedem Reiterwechsel
   * neu gebaut, und ein Horcher je Aufbau hiesse nach zehn Wechseln zehn
   * Auffrischungen für jeden Schritt.
   */
  let horcht = false;
  const anmelden = (): void => {
    if (horcht) return;
    horcht = true;
    const auf = () => { void knopfFrisch(); void auffrischen(); };
    for (const e of ['auftrag.angelegt', 'auftrag.beginnt', 'auftrag.schritt',
                     'auftrag.beendet', 'auftrag.fehler', 'auftrag.wiederaufgenommen']) {
      try { Ereignisse.horche(e, auf); } catch { /* ohne Bus keine Anzeige */ }
    }
  };

  return { oeffnen, zu, offenSichtbar, knopfFrisch, auffrischen, anmelden,
           artWort, anteil, standSatz, NAMEN };
})();

(window as any).AuftragsAnzeige = AuftragsAnzeige;
