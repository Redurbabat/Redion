/* ============================================================================
 * schale/bedienung/lader.ts — vier Bilder für „es läuft", und jedes sagt etwas
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/lader.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redion hat sechs Zustandswörter (`zustand.ts`) und einen Knopf,
 * der sie spricht (`zustandsknopf.ts`). Was ihm fehlte, war das Bild für
 * längere Vorgänge — und zwar EIN Bild je Sorte Auskunft, nicht ein
 * Kreisel für alles:
 *
 *   fluss    ES GIBT EINEN ECHTEN ANTEIL. Der Stand steigt wie eine
 *            Flüssigkeit, die Zahl steht daneben. Genau eine Stelle im
 *            ganzen Bestand liefert einen 0..1-Wert von aussen: der
 *            Modell-Download von WebLLM (`initProgressCallback`).
 *   sterne   ES LÄUFT, ABER NIEMAND WEISS WIE LANGE. Fünf Sterne drehen
 *            sich. Für Aufträge mit `schritte: 0` — dort verbietet sich
 *            ein Balken (E286), und bis hierher stand nur eine Zahl da.
 *   wort     ES LÄUFT ODER ES LÄUFT NICHT, mehr weiss man nicht. Die
 *            Buchstaben eines Wortes gehen der Reihe nach an. Für den
 *            Abgleich, der nur `laeuft` kennt.
 *   presse   EIN AUFTRAG MACHT BLÄTTER. Für die Auftragsart `pdf-bilder`:
 *            Seite für Seite kommt aus der Presse, und der Balken daneben
 *            sagt die echte Zahl.
 *
 * WOHER. Vier Vorgaben von Redur vom 6. September 2026 aus
 * `../ui-reserve/vorgaben/loader-sammlung.css`: der flüssige Ring, die
 * fünf Sterne, der Buchstabenring und die isometrische Druckpresse.
 *
 * DIE REGEL, DIE ÜBER ALLEN VIER STEHT. Ein Lader ist ein Bild und keine
 * Auskunft — die Auskunft ist der Text daneben. Deshalb trägt jeder Lader
 * `role="status"` mit einem Satz, jedes Bild ist `aria-hidden`, und
 * `fluss` schreibt seine Zahl als Text hin statt sie nur zu malen (§38).
 * Und keiner von ihnen erfindet einen Anteil: wer keinen bekommt, zeigt
 * keinen (Auftrag §0.8, E441).
 *
 * SVG-IDS SIND JE INSTANZ EINDEUTIG. Der flüssige Ring braucht eine Maske,
 * und eine Maske braucht eine ID. Zwei Lader auf einer Seite mit derselben
 * ID teilen sich die Maske — der Befund aus E440 zum KI-Funken. `zaehler`
 * vergibt deshalb je Instanz eine neue.
 * ==========================================================================*/

type LaderArt = 'fluss' | 'sterne' | 'wort' | 'presse';

interface LaderAuftrag {
  art: LaderArt;
  /** Der Satz, den der Lader vorliest. Ohne ihn steht der Standardsatz. */
  text?: string;
  /** 0..1 — NUR bei `fluss`, und nur, wenn es einen echten Wert gibt. */
  anteil?: number;
  /** Nur bei `wort`: das Wort, dessen Buchstaben angehen. */
  wort?: string;
}

interface LaderGriff {
  element: HTMLElement;
  /** Nachstellen. Was fehlt, bleibt wie es war. */
  setzen: (neu: { anteil?: number; text?: string }) => void;
  anteil: () => number | null;
  entfernen: () => void;
}

const Lader = (() => {

  const NS = 'http://www.w3.org/2000/svg';
  let zaehler = 0;

  const SAETZE: Record<LaderArt, string> = {
    fluss: 'Wird geladen …',
    sterne: 'Läuft …',
    wort: 'Läuft …',
    presse: 'Seiten werden gerechnet …'
  };

  const el = (tag: string, klasse: string, eltern?: Element): HTMLElement => {
    const e = document.createElement(tag);
    e.className = klasse;
    if (eltern) eltern.append(e);
    return e;
  };
  const svgEl = (tag: string, eltern?: Element): SVGElement => {
    const e = document.createElementNS(NS, tag);
    if (eltern) eltern.append(e);
    return e;
  };

  /* ---- fluss: der Stand steigt, die Zahl steht daneben ----------------- *
   * Die Klumpen sind der Trick der Vorgabe: weichgezeichnete Formen, über
   * die ein hoher Kontrast läuft, fliessen ineinander. In einer Maske
   * heisst weiss „hier ist Flüssigkeit"; die Kanten dazwischen werden vom
   * Kontrast zu einer einzigen welligen Linie.
   * --------------------------------------------------------------------- */
  const flussBild = (id: string): SVGSVGElement => {
    const svg = svgEl('svg') as SVGSVGElement;
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.classList.add('ru-lader-bild');
    const defs = svgEl('defs', svg);
    const maske = svgEl('mask', defs);
    maske.setAttribute('id', id);
    const gruppe = svgEl('g', maske);
    gruppe.setAttribute('class', 'ru-lader-klumpen');
    /* Die Fläche unter der Oberfläche — ihre Höhe IST der Anteil. */
    const flaeche = svgEl('rect', gruppe);
    flaeche.setAttribute('class', 'ru-lader-spiegel');
    flaeche.setAttribute('x', '0');
    flaeche.setAttribute('width', '100');
    flaeche.setAttribute('fill', '#fff');
    /* Drei Wellen auf der Oberfläche, jede mit eigener Drehung. */
    for (let i = 0; i < 3; i++) {
      const welle = svgEl('ellipse', gruppe);
      welle.setAttribute('class', 'ru-lader-welle');
      welle.setAttribute('rx', String(30 - i * 6));
      welle.setAttribute('ry', String(11 - i * 2));
      welle.setAttribute('fill', '#fff');
      (welle as SVGElement).style.setProperty('--ru-schritt', String(i));
    }
    const glas = svgEl('circle', svg);
    glas.setAttribute('class', 'ru-lader-glas');
    glas.setAttribute('cx', '50'); glas.setAttribute('cy', '50'); glas.setAttribute('r', '47');
    const topf = svgEl('g', svg);
    topf.setAttribute('mask', 'url(#' + id + ')');
    const saft = svgEl('circle', topf);
    saft.setAttribute('class', 'ru-lader-saft');
    saft.setAttribute('cx', '50'); saft.setAttribute('cy', '50'); saft.setAttribute('r', '47');
    return svg;
  };

  /* ---- sterne: fünf, die sich drehen ---------------------------------- */
  const sterneBild = (): HTMLElement => {
    const b = el('div', 'ru-lader-bild ru-lader-sterne');
    b.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 5; i++)
      el('i', 'ru-lader-stern', b).style.setProperty('--ru-schritt', String(i));
    return b;
  };

  /* ---- wort: die Buchstaben gehen der Reihe nach an -------------------- */
  const wortBild = (wort: string): HTMLElement => {
    const b = el('div', 'ru-lader-bild ru-lader-wort');
    b.setAttribute('aria-hidden', 'true');
    el('i', 'ru-lader-ring', b);
    const zeile = el('span', 'ru-lader-buchstaben', b);
    /* Array.from und nicht split(''): ein Zeichen ausserhalb der
       Grundebene (ein Emoji im Wort) zerfiele sonst in zwei halbe. */
    Array.from(wort).forEach((zeichen, i) => {
      const s = el('span', 'ru-lader-buchstabe', zeile);
      s.textContent = zeichen;
      s.style.setProperty('--ru-schritt', String(i));
    });
    return b;
  };

  /* ---- presse: Blätter kommen heraus ---------------------------------- */
  const presseBild = (): HTMLElement => {
    const b = el('div', 'ru-lader-bild ru-lader-presse');
    b.setAttribute('aria-hidden', 'true');
    const raum = el('div', 'ru-lader-raum', b);
    for (let i = 0; i < 3; i++)
      el('i', 'ru-lader-walze', raum).style.setProperty('--ru-schritt', String(i));
    for (let i = 0; i < 3; i++)
      el('i', 'ru-lader-bogen', raum).style.setProperty('--ru-schritt', String(i));
    return b;
  };

  const bauen = (auftrag: LaderAuftrag): LaderGriff => {
    const wurzel = el('div', 'ru-lader');
    wurzel.dataset['art'] = auftrag.art;
    wurzel.setAttribute('role', 'status');
    let anteil: number | null = null;
    let spiegel: SVGElement | null = null;
    let wellen: SVGElement[] = [];
    let zahl: HTMLElement | null = null;

    if (auftrag.art === 'fluss') {
      const id = 'ru-lader-maske-' + (++zaehler);
      const bild = flussBild(id);
      wurzel.append(bild);
      spiegel = bild.querySelector('.ru-lader-spiegel');
      wellen = Array.from(bild.querySelectorAll<SVGElement>('.ru-lader-welle'));
      zahl = el('b', 'ru-lader-zahl', wurzel);
    } else if (auftrag.art === 'sterne') {
      wurzel.append(sterneBild());
    } else if (auftrag.art === 'wort') {
      wurzel.append(wortBild(auftrag.wort || 'Abgleich'));
    } else {
      wurzel.append(presseBild());
    }

    const satz = el('span', 'ru-lader-text', wurzel);
    satz.textContent = auftrag.text ?? SAETZE[auftrag.art];

    const stellen = (wert: number | null): void => {
      anteil = wert;
      if (!spiegel) return;
      const hoch = wert === null ? 0 : Math.max(0, Math.min(1, wert));
      /* Die Oberfläche steht bei `100 - 100·Anteil`; die Wellen sitzen
         genau darauf, damit sie den Rand verwischen und nicht die Mitte. */
      const kante = 100 - hoch * 100;
      spiegel.setAttribute('y', String(kante));
      spiegel.setAttribute('height', String(hoch * 100));
      wellen.forEach((w, i) => {
        w.setAttribute('cx', String(30 + i * 20));
        w.setAttribute('cy', String(kante));
      });
      if (zahl) {
        /* DIE ZAHL STEHT ALS TEXT DA, nicht nur als Höhe. Wer die Füllung
           nicht sieht, liest „42 %" (§38). Ohne Anteil steht nichts —
           „0 %" wäre eine Behauptung über etwas Unbekanntes. */
        zahl.textContent = wert === null ? '' : Math.round(hoch * 100) + ' %';
      }
      wurzel.dataset['anteil'] = wert === null ? 'unbekannt' : 'bekannt';
    };

    stellen(typeof auftrag.anteil === 'number' ? auftrag.anteil : null);

    const setzen = (neu: { anteil?: number; text?: string }): void => {
      if (typeof neu.anteil === 'number') stellen(neu.anteil);
      if (typeof neu.text === 'string') satz.textContent = neu.text;
    };

    return { element: wurzel, setzen, anteil: () => anteil,
             entfernen: () => wurzel.remove() };
  };

  return { SAETZE, bauen };
})();

(window as any).Lader = Lader;
