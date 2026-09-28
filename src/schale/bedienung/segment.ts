/* ============================================================================
 * schale/bedienung/segment.ts — der Umschalter für zwei bis vier Dinge
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/bedienung/segment.js`.
 * Die Quelle ist DIESE Datei. `npm run bauen:ts` schreibt das .js; wer das
 * .js bearbeitet, verliert die Änderung beim nächsten Bauen (test105).
 * ----------------------------------------------------------------------------
 * WOFÜR. Redion hatte für „Liste oder Raster", „Aufbauen · Simulieren ·
 * Messen" und jede andere Wahl zwischen wenigen sich ausschliessenden
 * Möglichkeiten kein gemeinsames Bauteil. Gemessen: nirgends im ganzen
 * `src/` ein `role="radiogroup"` oder etwas Gleichwertiges. Jede Stelle
 * baute sich ihre eigene Knopfreihe, und keine davon war mit der Tastatur
 * bedienbar.
 *
 * WARUM EIN EIGENER ORDNER. `schale/aufbau/` ist die feste Schale der App —
 * Seitenleiste, Kopfzeile, Menüband. `schale/ueberlagerung/` ist, was ÜBER
 * der Seite liegt — Dialog, Menü, Blatt, Hinweis. Ein Umschalter ist
 * weder das eine noch das andere: er steht IN der Fläche und gehört
 * niemandem. Deshalb `bedienung/` — der dritte Platz, für Bauteile, die
 * jeder Bereich benutzen darf.
 *
 * WAS ES NICHT IST. Kein Reiterband (`role="tablist"`): Reiter zeigen
 * verschiedene Inhalte im selben Rahmen und haben ihr eigenes Muster. Ein
 * Umschalter WÄHLT einen Wert; das ist eine Radiogruppe, und die
 * Tastaturbedienung ist eine andere.
 *
 * DIE TASTATUR IST DER EIGENTLICHE GEWINN.
 *
 *     Tab            springt IN die Gruppe und wieder heraus — einmal,
 *                    nicht einmal je Knopf
 *     ← ↑            eine Wahl zurück, am Anfang umlaufend
 *     → ↓            eine Wahl weiter, am Ende umlaufend
 *     Pos1 / Ende    erste / letzte Wahl
 *
 * Das ist „roving tabindex": genau ein Knopf trägt `tabindex="0"`, alle
 * anderen `-1`. Ohne das tabbt man sich durch vier Knöpfe, um an der Gruppe
 * VORBEIZUKOMMEN — bei drei Umschaltern auf einer Seite sind das zwölf
 * Anschläge für nichts.
 *
 * UND DIE WAHL WIRKT SOFORT. Pfeiltaste heisst wählen, nicht nur
 * hinbewegen. So steht es im ARIA-Muster für Radiogruppen, und es ist auch
 * das, was ein Mensch erwartet: der Umschalter zeigt das Ergebnis, nicht
 * eine Absicht.
 * ==========================================================================*/

interface SegmentWahl {
  /** Der Wert, der zurückgegeben wird. */
  id: string;
  /** Was dasteht. Deutsch (§3). */
  name: string;
  /** Kurzform für schmale Bildschirme; ohne sie bleibt `name` stehen. */
  kurz?: string;
  /** Ein Zeichen aus `Register.symbole`, links vom Namen. */
  zeichen?: string;
}

interface SegmentAuftrag {
  /** Wonach gefragt wird — wird zu `aria-label` der Gruppe. */
  name: string;
  wahlen: SegmentWahl[];
  /** Welche gilt. Unbekannt oder leer heisst: die erste. */
  gewaehlt?: string;
  /** Läuft bei jeder Änderung, mit der neuen Kennung. */
  gewechselt?: (id: string) => void;
}

interface SegmentGriff {
  /** Das fertige Element zum Einhängen. */
  element: HTMLElement;
  /** Was gerade gilt. */
  wert: () => string;
  /** Von aussen setzen — ohne `gewechselt` auszulösen. */
  setzen: (id: string) => void;
}

const Segment = (() => {

  const bauen = (auftrag: SegmentAuftrag): SegmentGriff => {
    const wahlen = auftrag.wahlen.filter(w => w && w.id);
    if (!wahlen.length) throw new Error('Ein Umschalter ohne Wahl ist keiner.');

    const gruppe = document.createElement('div');
    gruppe.className = 'ru-seg';
    gruppe.setAttribute('role', 'radiogroup');
    gruppe.setAttribute('aria-label', auftrag.name);
    /* E706: die Wahl fliegt vom alten zum neuen Knopf (`SelectionFlow`). */
    gruppe.dataset['material'] = 'segment';

    let jetzt = wahlen.some(w => w.id === auftrag.gewaehlt)
      ? String(auftrag.gewaehlt) : String(wahlen[0]?.id);

    const knoepfe: HTMLButtonElement[] = wahlen.map(wahl => {
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'ru-seg-wahl';
      k.setAttribute('role', 'radio');
      k.dataset['segWahl'] = wahl.id;
      /* DAS ZEICHEN IST SCHMUCK, DER NAME IST DIE AUSKUNFT. Deshalb steht
         das Zeichen `aria-hidden` — ein Screenreader liest sonst „Bild
         Liste" statt „Liste". */
      if (wahl.zeichen && typeof Register !== 'undefined' && Register.symbole?.hat?.(wahl.zeichen)) {
        const zeichen = document.createElement('span');
        zeichen.className = 'ru-seg-zeichen';
        zeichen.setAttribute('aria-hidden', 'true');
        zeichen.innerHTML = Register.symbole.alsSvg(wahl.zeichen);
        k.append(zeichen);
      }
      const text = document.createElement('span');
      text.className = 'ru-seg-name';
      text.textContent = wahl.name;
      k.append(text);
      /* Die Kurzform steht als zweites Element daneben und wird per CSS
         getauscht — nicht per JavaScript beim Umbau des Fensters. Eine
         Breite, die von einem Ereignis abhängt, ist beim ersten Zeichnen
         falsch. */
      if (wahl.kurz) {
        const kurz = document.createElement('span');
        kurz.className = 'ru-seg-kurz';
        kurz.textContent = wahl.kurz;
        k.append(kurz);
      }
      gruppe.append(k);
      return k;
    });

    const stellen = (): void => {
      knoepfe.forEach((k, i) => {
        const an = wahlen[i]?.id === jetzt;
        k.setAttribute('aria-checked', String(an));
        /* Roving tabindex — siehe Kopf. */
        k.tabIndex = an ? 0 : -1;
      });
    };

    const waehlen = (id: string, melden: boolean): void => {
      if (!wahlen.some(w => w.id === id) || id === jetzt) return;
      jetzt = id;
      stellen();
      if (melden) auftrag.gewechselt?.(jetzt);
    };

    const springen = (schritt: number, fokus: boolean): void => {
      const von = wahlen.findIndex(w => w.id === jetzt);
      const nach = (von + schritt + wahlen.length) % wahlen.length;
      const ziel = wahlen[nach];
      if (!ziel) return;
      waehlen(ziel.id, true);
      if (fokus) knoepfe[nach]?.focus();
    };

    gruppe.addEventListener('click', ereignis => {
      const ziel = ereignis.target instanceof Element
        ? ereignis.target.closest<HTMLElement>('[data-seg-wahl]') : null;
      if (ziel?.dataset['segWahl']) waehlen(ziel.dataset['segWahl'], true);
    });

    gruppe.addEventListener('keydown', ereignis => {
      const taste = ereignis.key;
      if (taste === 'ArrowRight' || taste === 'ArrowDown') {
        ereignis.preventDefault(); springen(1, true); return;
      }
      if (taste === 'ArrowLeft' || taste === 'ArrowUp') {
        ereignis.preventDefault(); springen(-1, true); return;
      }
      if (taste === 'Home') {
        ereignis.preventDefault();
        const erste = wahlen[0];
        if (erste) { waehlen(erste.id, true); knoepfe[0]?.focus(); }
        return;
      }
      if (taste === 'End') {
        ereignis.preventDefault();
        const letzte = wahlen[wahlen.length - 1];
        if (letzte) { waehlen(letzte.id, true); knoepfe[knoepfe.length - 1]?.focus(); }
      }
      /* Leertaste und Enter brauchen nichts: der Knopf ist ein echter
         `<button>`, und der löst darauf von selbst ein `click` aus. Wer
         hier `preventDefault` schriebe, nähme ihm das ab und müsste es
         nachbauen. */
    });

    stellen();
    return {
      element: gruppe,
      wert: () => jetzt,
      setzen: (id: string) => waehlen(id, false)
    };
  };

  return { bauen };
})();

(window as any).Segment = Segment;
