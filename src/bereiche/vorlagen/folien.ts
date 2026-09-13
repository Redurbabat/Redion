/* ============================================================================
 * bereiche/vorlagen/folien.ts — fertige Folienlayouts
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/vorlagen/folien.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/vorlagen/folien.js`.
 * ----------------------------------------------------------------------------
 * Redur, 13. September 2026: „füge dort auch fertige Vorlagen."
 *
 * Ein Layout ist hier KEIN Bild und keine zweite Dokumentform, sondern eine
 * Liste von Marken auf einer 16:9-Folie — dieselben Marken, die der
 * `.pptx`-Einleser anlegt (E540) und die die Zeichenschicht seit E100
 * bearbeitet. Wer eine Vorlage nimmt, bekommt also nichts Besonderes,
 * sondern eine gewöhnliche Folie, auf der schon etwas steht: Titel
 * anklicken, Text ersetzen, fertig.
 *
 * WARUM NICHT IN `Register.vorlagen`. Dort stehen Vorlagen, die ganze
 * ARBEITSBEREICHE bauen — „Fitness-OS", „Redaktionsplan", zehn Datenbanken
 * mit Ansichten und Beispielzeilen. Ein Folienlayout ist etwas anderes: es
 * legt keine Seite an, es füllt eine. Beides in eine Liste zu werfen hiesse,
 * in der Galerie „Titelfolie" neben „Fitness-OS" zu zeigen — zwei Dinge
 * unter einem Namen, und §8 verbietet genau das aus dem umgekehrten Grund
 * (keine zwei Kataloge für DASSELBE; dies sind zwei Kataloge für ZWEIERLEI).
 * Der BEFEHL „Neue Folie" steht dagegen im Befehlsregister, wo er hingehört.
 *
 * DIE MASSE SIND FOLIENPUNKTE, KEINE BILDSCHIRMPUNKTE. Dieselbe Regel wie
 * E100: eine Folie folgt der Fensterbreite, und eine Marke bei x = 60 liegt
 * auf jedem Schirm an derselben Stelle des Papiers. Gerechnet wird gegen die
 * ÜBERGEBENE Foliengrösse, nicht gegen 960 × 540 — sonst läge bei einer
 * 4:3-Folie alles im linken Drittel.
 * ==========================================================================*/

const Folienvorlagen = (() => {

  /** PowerPoints Standardmass für 16:9, in Punkten (9144000 × 5143500 EMU). */
  const BREITE = 960;
  const HOEHE = 540;

  /* Eigen, nicht geliehen: jede Datei hat ihr `esc` (CLAUDE.md §19, und so
     steht es auch in `vorlagen/daten.ts`). Es ersetzt wirklich — der Fehler
     aus §19, der beim Lesen richtig aussieht, ist hier keiner. */
  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  type Marke = Record<string, any>;
  type Layout = {
    id: string;
    name: string;
    zeichen: string;
    text: string;
    /** Baut die Marken — `b` und `h` sind die Masse DIESER Folie. */
    bauen: (b: number, h: number) => Marke[];
  };

  /* Kennungen müssen je Folie eindeutig sein; zwei Marken mit derselben
     Kennung wären für `redraw` dieselbe (marken.ts). Ein Zähler reicht —
     er läuft nur innerhalb dieses Fensters und landet nie in einer Datei,
     in der eine fremde Kennung stünde. */
  let zaehler = 0;
  const kennung = (): string => 'fv' + (++zaehler).toString(36) +
    Math.random().toString(36).slice(2, 8);

  /** Ein Textkasten in Anteilen der Folie — so stimmt jedes Seitenmass. */
  const text = (b: number, h: number, opt: {
    x: number; y: number; breite: number; inhalt: string;
    grad: number; fett?: boolean; farbe?: string;
  }): Marke => ({
    id: kennung(), art: 'text',
    point: [Math.round(opt.x * b), Math.round(opt.y * h)],
    breiteBox: Math.round(opt.breite * b),
    text: opt.inhalt,
    fontSize: Math.round(opt.grad * h),
    fett: !!opt.fett,
    ...(opt.farbe ? { farbe: opt.farbe } : {}),
  });

  /**
   * Eine waagrechte Linie — als LINIE, nicht als Abdeckmarke (E553).
   *
   * HIER STAND `art: 'abdeck'`, „als flache Abdeckmarke in Akzentfarbe", und
   * das war mein Kurzschluss aus E548: eine Abdeckmarke ist gefüllt, eine
   * `rectangle` nicht, also nahm ich die gefüllte. Die Folge habe ich nicht
   * zu Ende gedacht.
   *
   * `abdeck` heisst nicht „gefüllter Kasten". Es heisst **eine zugedeckte
   * Antwort** (E266), und im Vortrag ist das ein Versprechen: anklickbar,
   * `cursor:pointer`, und beim Tipp verschwindet die Füllung. Der blaue
   * Zierstrich unter jeder Überschrift war damit eine Antwort, die es nie
   * gab — gemessen: er steht als ERSTER Deckel im Baum, also war er der,
   * den jede Suche zuerst fand, und ein Klick darauf löschte ihn einfach.
   *
   * Eine `line` mit Strichstärke tut dasselbe fürs Auge und behauptet
   * nichts. Die Dicke geht als `breite` an die Marke — so heisst das Feld
   * (nachgesehen in `marken.ts`, `strokeWidth`), und die Punkte sind Anfang
   * und Ende der MITTELLINIE, nicht zwei Ecken eines Kastens.
   */
  const linie = (b: number, h: number, opt: {
    x: number; y: number; breite: number; dicke?: number; farbe?: string;
  }): Marke => {
    const dick = Math.max(1, Math.round((opt.dicke ?? 0.012) * h));
    const y = Math.round((opt.y + (opt.dicke ?? 0.012) / 2) * h);
    return {
      id: kennung(), art: 'line', farbe: opt.farbe || '#2f6fed', breite: dick,
      pts: [[Math.round(opt.x * b), y],
            [Math.round((opt.x + opt.breite) * b), y]],
    };
  };

  /* ==========================================================================
   * DIE LAYOUTS
   * --------------------------------------------------------------------------
   * Es sind die, die PowerPoint selbst anbietet, in derselben Reihenfolge und
   * mit denselben deutschen Namen. Wer von dort kommt, sucht nicht.
   * ========================================================================*/
  const LISTE: Layout[] = [
    {
      id: 'titel', name: 'Titelfolie', zeichen: '🎬',
      text: 'Grosser Titel in der Mitte, Untertitel darunter',
      bauen: (b, h) => [
        text(b, h, { x: .10, y: .34, breite: .80, inhalt: 'Titel der Präsentation',
                     grad: .085, fett: true }),
        linie(b, h, { x: .10, y: .50, breite: .26 }),
        text(b, h, { x: .10, y: .55, breite: .80, inhalt: 'Untertitel oder Name', grad: .042 }),
      ],
    },
    {
      id: 'titelInhalt', name: 'Titel und Inhalt', zeichen: '📝',
      text: 'Der Normalfall — Überschrift oben, Text darunter',
      bauen: (b, h) => [
        text(b, h, { x: .07, y: .08, breite: .86, inhalt: 'Überschrift', grad: .066, fett: true }),
        linie(b, h, { x: .07, y: .20, breite: .18 }),
        text(b, h, { x: .07, y: .27, breite: .86, grad: .040,
                     inhalt: '• Erster Punkt\n• Zweiter Punkt\n• Dritter Punkt' }),
      ],
    },
    {
      id: 'zweiInhalte', name: 'Zwei Inhalte', zeichen: '🀫',
      text: 'Überschrift und zwei Spalten nebeneinander',
      bauen: (b, h) => [
        text(b, h, { x: .07, y: .08, breite: .86, inhalt: 'Überschrift', grad: .066, fett: true }),
        linie(b, h, { x: .07, y: .20, breite: .18 }),
        text(b, h, { x: .07, y: .28, breite: .40, grad: .038,
                     inhalt: '• Links\n• Zweiter Punkt' }),
        text(b, h, { x: .53, y: .28, breite: .40, grad: .038,
                     inhalt: '• Rechts\n• Zweiter Punkt' }),
      ],
    },
    {
      id: 'vergleich', name: 'Vergleich', zeichen: '⚖',
      text: 'Zwei Spalten, jede mit eigener Zwischenüberschrift',
      bauen: (b, h) => [
        text(b, h, { x: .07, y: .07, breite: .86, inhalt: 'Vergleich', grad: .062, fett: true }),
        text(b, h, { x: .07, y: .24, breite: .40, inhalt: 'Vorher', grad: .044, fett: true }),
        text(b, h, { x: .53, y: .24, breite: .40, inhalt: 'Nachher', grad: .044, fett: true }),
        linie(b, h, { x: .07, y: .33, breite: .40, dicke: .008 }),
        linie(b, h, { x: .53, y: .33, breite: .40, dicke: .008 }),
        text(b, h, { x: .07, y: .38, breite: .40, grad: .036, inhalt: '• Punkt\n• Punkt' }),
        text(b, h, { x: .53, y: .38, breite: .40, grad: .036, inhalt: '• Punkt\n• Punkt' }),
      ],
    },
    {
      id: 'abschnitt', name: 'Abschnittsüberschrift', zeichen: '🔖',
      text: 'Trennt ein Kapitel ab — grosse Zahl, grosser Name',
      bauen: (b, h) => [
        text(b, h, { x: .09, y: .28, breite: .20, inhalt: '01', grad: .150, fett: true,
                     farbe: '#2f6fed' }),
        text(b, h, { x: .09, y: .52, breite: .80, inhalt: 'Abschnitt', grad: .072, fett: true }),
        linie(b, h, { x: .09, y: .68, breite: .30 }),
      ],
    },
    {
      id: 'nurTitel', name: 'Nur Titel', zeichen: '🏷',
      text: 'Eine Überschrift, der Rest bleibt frei zum Zeichnen',
      bauen: (b, h) => [
        text(b, h, { x: .07, y: .08, breite: .86, inhalt: 'Überschrift', grad: .066, fett: true }),
        linie(b, h, { x: .07, y: .20, breite: .18 }),
      ],
    },
    {
      id: 'bildText', name: 'Bild mit Beschriftung', zeichen: '🖼',
      text: 'Platz fürs Bild links, Erklärung rechts',
      bauen: (b, h) => [
        text(b, h, { x: .07, y: .07, breite: .86, inhalt: 'Überschrift', grad: .058, fett: true }),
        /* Der Platzhalter ist ein RAHMEN, keine Fläche: er soll sagen „hier
           kommt ein Bild hin" und nicht selbst wie eines aussehen. */
        { id: kennung(), art: 'text', rahmen: true,
          point: [Math.round(.07 * b), Math.round(.26 * h)],
          breiteBox: Math.round(.44 * b),
          text: '\n   Bild hierher ziehen\n', fontSize: Math.round(.038 * h) },
        text(b, h, { x: .55, y: .26, breite: .38, grad: .036,
                     inhalt: 'Was auf dem Bild zu sehen ist\nund warum es hier steht.' }),
      ],
    },
    {
      id: 'leer', name: 'Leer', zeichen: '⬜',
      text: 'Weisse Folie — für alles, was kein Layout braucht',
      bauen: () => [],
    },
  ];

  const alle = (): Layout[] => LISTE.map(v => ({ ...v }));
  const eines = (id: string): Layout | null => LISTE.find(v => v.id === id) || null;

  /** Die Marken eines Layouts für eine Folie dieser Grösse. */
  const marken = (id: string, breite = BREITE, hoehe = HOEHE): Marke[] => {
    const v = eines(id);
    if (!v) return [];
    try { return v.bauen(Math.max(1, breite), Math.max(1, hoehe)); }
    catch { return []; }
  };

  /* ==========================================================================
   * DIE WEGE
   * ========================================================================*/

  /** Eine Folie an einen Foliensatz anhängen. */
  const neueFolie = (seiteId: string, layoutId = 'titelInhalt',
                     breite = BREITE, hoehe = HOEHE): any => {
    if (!seiteId) return null;
    const v = eines(layoutId);
    const block = Store.addBlock(seiteId, 'blatt', {
      text: v ? v.name : 'Folie', blattBreite: breite, blattHoehe: hoehe, papier: 'blanko' });
    const liste = marken(layoutId, breite, hoehe);
    if (liste.length) Store.updateBlock(block.id, { marken: liste });
    return Store.getBlock(block.id);
  };

  /**
   * Eine neue Präsentation — Seite, erste Folie, Dokumentmodus.
   *
   * `dokumentModus` ist dieselbe Flagge wie beim `.pptx`-Einleser (E546):
   * ohne sie stünde die Folie als Blatt in einem Texteditor, und der Weg
   * hätte das Ding angelegt, aber nicht geöffnet (E397).
   */
  const neuePraesentation = (layoutId = 'titel', titel = ''): any => {
    const seite = Store.addPage(null, { text: titel || 'Neue Präsentation', icon: '📽️' });
    neueFolie(seite.id, layoutId);
    Store.updateBlock(seite.id, { dokumentModus: true });
    return Store.getBlock(seite.id);
  };

  /* ==========================================================================
   * DER WÄHLER
   * --------------------------------------------------------------------------
   * Eine Karte je Layout, mit einer echten kleinen Vorschau statt eines
   * Zeichens: gezeichnet wird sie von `Marken.zeichneMarke` — derselben
   * Stelle wie Folie, Miniatur, Vortrag und Druck (§8, E547). Ein Layout,
   * das man nicht sieht, wählt niemand zweimal.
   * ========================================================================*/
  const vorschau = (layoutId: string): string => {
    const liste = marken(layoutId, BREITE, HOEHE);
    if (!liste.length || typeof Marken === 'undefined') return '';
    let innen = '';
    try {
      const defs = typeof Marken.verlaufDefs === 'function' ? Marken.verlaufDefs(liste) : null;
      if (defs) innen += defs.outerHTML;
      for (const m of liste) {
        const knoten = Marken.zeichneMarke(m);
        if (knoten) innen += knoten.outerHTML;
      }
    } catch { return ''; }
    return innen
      ? `<svg class="fv-bild" viewBox="0 0 ${BREITE} ${HOEHE}" preserveAspectRatio="none" ` +
        `aria-hidden="true">${innen}</svg>`
      : '';
  };

  /**
   * Den Wähler zeigen und das gewählte Layout zurückgeben.
   *
   * Aufgelöst wird mit `null`, wenn jemand abbricht — dann entsteht auch
   * keine Seite. Ein abgebrochener Wähler, der trotzdem etwas anlegt, ist
   * der Fehler, gegen den §47 „kein Weg, der ins Leere führt" steht.
   */
  const waehle = (kopf = 'Layout wählen'): Promise<string | null> =>
    new Promise(fertig => {
      const o = document.createElement('div');
      o.className = 'overlay';
      o.innerHTML =
        '<div class="finder" style="width:min(820px,95vw)">' +
          '<div class="fh">📽️ ' + esc(kopf) +
            '<button class="icon-btn" data-a="zu" aria-label="Schliessen">✕</button></div>' +
          '<div class="fv-gitter">' +
            LISTE.map(v =>
              `<button class="fv-karte" data-v="${esc(v.id)}">` +
                `<span class="fv-rahmen">${vorschau(v.id) ||
                  `<span class="fv-leer">${esc(v.zeichen)}</span>`}</span>` +
                `<b>${esc(v.name)}</b><span class="fv-text">${esc(v.text)}</span>` +
              '</button>').join('') +
          '</div>' +
        '</div>';
      document.body.appendChild(o);
      let beantwortet = false;
      const schliesse = (wahl: string | null): void => {
        if (beantwortet) return;
        beantwortet = true;
        o.remove();
        fertig(wahl);
      };
      o.addEventListener('click', e => {
        const ziel = e.target as Element | null;
        if (ziel === o || ziel?.closest('[data-a="zu"]')) { schliesse(null); return; }
        const karte = ziel?.closest<HTMLElement>('[data-v]');
        if (karte) schliesse(karte.dataset['v'] || null);
      });
      /* Escape schliesst — der gemeinsame Griff aus E302 nimmt `.overlay`
         von selbst; hier steht nur, was DANN geschehen soll (§38). */
      const taste = (e: KeyboardEvent): void => {
        if (e.key !== 'Escape') return;
        document.removeEventListener('keydown', taste, true);
        schliesse(null);
      };
      document.addEventListener('keydown', taste, true);
      o.querySelector<HTMLElement>('.fv-karte')?.focus();
    });

  /** „Neue Präsentation" mit Wähler — der Weg aus dem Anlegen-Menü. */
  const anlegenMitWahl = async (): Promise<any> => {
    const wahl = await waehle('Womit soll die erste Folie anfangen?');
    if (!wahl) return null;
    const seite = neuePraesentation(wahl);
    if (typeof App !== 'undefined') { App.zeichneBaum?.(); App.oeffne?.(seite.id); }
    return seite;
  };

  /** „Neue Folie" mit Wähler — der Befehl aus der Palette. */
  const folieMitWahl = async (seiteId?: string): Promise<any> => {
    const ziel = seiteId || (typeof App !== 'undefined' ? App.aktuelleSeite() : '');
    if (!ziel) { UI.toast('Erst eine Präsentation öffnen'); return null; }
    const wahl = await waehle('Layout der neuen Folie');
    if (!wahl) return null;
    /* Die neue Folie bekommt die Masse der VORHANDENEN — eine 4:3-Folie
       mitten in einem 16:9-Satz wäre ein Sprung im Vortrag. */
    const vorhanden = (Store.childrenOf(ziel) || []).find((b: any) => b.type === 'blatt');
    const folie = neueFolie(ziel, wahl,
      Number(vorhanden?.blattBreite) || BREITE,
      Number(vorhanden?.blattHoehe) || HOEHE);
    if (typeof App !== 'undefined') App.zeichneSeite?.();
    return folie;
  };

  /**
   * Ist DIESE Seite ein Foliensatz? Für `zeigen()` am Befehl und am Band.
   *
   * QUER, NICHT NUR „Blatt im Dokumentmodus" (E549). Ein Notizheft ist
   * dasselbe von aussen — Dokumentmodus, Blatt-Blöcke — und es ist keine
   * Präsentation. Der Unterschied, den man messen kann, ist das Papier:
   * eine Folie ist breiter als hoch, ein Heft hochkant. PowerPoints Vorgabe
   * ist 16:9, Redions eingelesene Folien auch (E540); ein A4-Heft ist 595
   * auf 842.
   *
   * Was das NICHT trifft: eine hochkant gebaute Präsentation. Die gibt es in
   * PowerPoint, sie ist aber selten, und die Verwechslung in die andere
   * Richtung wäre teurer — ein Menüband über jedem Notizheft.
   */
  const istFoliensatz = (seiteId: string): boolean => {
    const seite = seiteId ? Store.getBlock(seiteId) : null;
    if (!seite || !seite.dokumentModus) return false;
    return (Store.childrenOf(seiteId) || []).some((b: any) =>
      b && b.type === 'blatt' &&
      Number(b.blattBreite) > Number(b.blattHoehe));
  };

  /** Der offene Foliensatz, oder ''. */
  const offenerSatz = (): string => {
    const id = typeof App !== 'undefined' ? String(App.aktuelleSeite() || '') : '';
    return id && istFoliensatz(id) ? id : '';
  };

  /* ==========================================================================
   * DER REITER IM MENÜBAND (E549)
   * --------------------------------------------------------------------------
   * Redur: „oben mit Menü". Das Band gibt es seit langem — was fehlte, war
   * ein Reiter für Folien.
   *
   * KEIN EINZIGER KNOPF TUT HIER ETWAS NEUES. Das ist die wichtigste Regel
   * des Menübands (`register/menueband.ts`, ganz oben): ein Band ist eine
   * ZWEITE ANSICHT auf das, was Redion kann, keine zweite Fassung davon. Wo
   * hier eine eigene Rechnung stünde, liefe sie irgendwann von der ersten
   * weg, und zwar still.
   *
   * `zeigen()` an jedem Eintrag hält den ganzen Reiter aus dem Band heraus,
   * wenn kein Foliensatz offen ist — `reiter()` zeigt nur, was belegt ist.
   * ========================================================================*/
  const bandEintraege = (): any[] => {
    const satz = offenerSatz();
    if (!satz) return [];
    const da = (griff: () => unknown): boolean => {
      try { return typeof griff() === 'function'; } catch { return false; }
    };
    const eintrag = (o: any) => ({ reiter: 'praesentation', ...o,
      zeigen: () => !!offenerSatz() && (o.wenn ? o.wenn() : true) });

    return [
      eintrag({ gruppe: 'Folien', id: 'pv-neu', name: 'Neue Folie', zeichen: 'plus',
        gross: true, hinweis: 'Eine Folie anhängen — mit Layout zur Wahl',
        tun: () => { void folieMitWahl(); } }),
      eintrag({ gruppe: 'Folien', id: 'pv-liste', name: 'Folienliste', zeichen: 'page',
        hinweis: 'Die Folien links zeigen oder verbergen',
        wenn: () => typeof DocumentMode !== 'undefined',
        tun: () => {
          /* Derselbe Knopf, den die Dokumentleiste trägt — gedrückt, nicht
             nachgebaut (§8). Ohne ihn gäbe es zwei Wege zu einer Liste. */
          const knopf = [...document.querySelectorAll<HTMLElement>('button, a')]
            .find(b => /^▤\s*Seiten$/.test((b.textContent || '').trim()));
          if (knopf) knopf.click(); else UI.toast('Die Folienliste ist hier nicht da');
        } }),
      eintrag({ gruppe: 'Vortrag', id: 'pv-zeigen', name: 'Präsentieren', zeichen: 'play',
        gross: true, hinweis: 'Vollbild — ein Klick deckt die nächste Antwort auf',
        wenn: () => da(() => Werkzeuge.praesentation),
        tun: () => { void Werkzeuge.praesentation(Store.getBlock(offenerSatz())); } }),
      eintrag({ gruppe: 'Ausgeben', id: 'pv-pptx', name: 'Als PowerPoint', zeichen: 'download',
        hinweis: 'Die Folien als .pptx-Datei sichern',
        wenn: () => da(() => Austausch.alsPowerPoint),
        tun: () => { void Austausch.alsPowerPoint(Store.getBlock(offenerSatz())); } }),
      eintrag({ gruppe: 'Ausgeben', id: 'pv-pdf', name: 'Als PDF', zeichen: 'page',
        hinweis: 'Die Folien als PDF sichern',
        wenn: () => typeof DocumentMode !== 'undefined' && da(() => DocumentMode.alsPdf),
        tun: () => { void DocumentMode.alsPdf(Store.getBlock(offenerSatz())); } }),
      eintrag({ gruppe: 'Ausgeben', id: 'pv-drucken', name: 'Drucken', zeichen: 'printer',
        hinweis: 'Die Folien drucken',
        wenn: () => da(() => Werkzeuge.drucken),
        tun: () => { void Werkzeuge.drucken(Store.getBlock(offenerSatz())); } }),
    ];
  };

  if (typeof Register !== 'undefined' && Register.menueband?.meldeLieferant)
    Register.menueband.meldeLieferant(bandEintraege);

  /* Der Befehl gehört ins Befehlsregister, nicht in eine Liste hier (§8
     Regel 3). `zeigen()` hält ihn aus der Palette heraus, wo er nichts
     täte — ein Befehl, der dasteht und dann sagt, dass er hier nicht geht,
     ist die häufigste Enttäuschung überhaupt (register/befehle.ts). */
  if (typeof Register !== 'undefined' && Register.befehle) {
    Register.befehle.melde({
      titel: 'Neue Folie', gruppe: 'Anlegen',
      zeigen: () => typeof App !== 'undefined' && istFoliensatz(App.aktuelleSeite()),
      tun: () => { void folieMitWahl(); },
    });
    Register.befehle.melde({
      titel: 'Neue Präsentation', gruppe: 'Anlegen',
      tun: () => { void anlegenMitWahl(); },
    });
  }

  return { alle, eines, marken, vorschau, waehle,
           neueFolie, neuePraesentation, anlegenMitWahl, folieMitWahl,
           istFoliensatz, offenerSatz, bandEintraege, BREITE, HOEHE };
})();

(window as any).Folienvorlagen = Folienvorlagen;
