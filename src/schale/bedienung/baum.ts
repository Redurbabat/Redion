/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/baum.ts (npm run bauen:ts). */
/* schale/bedienung/baum.ts — gemeinsame Baumansicht
   Quelle: Redion-Adaption der Uiverse-Baumidee von ashif_6672.
   Kein eigenes Datenmodell; Bereiche liefern nur Knoten und Zustand. */

interface BaumKnoten {
  id: string;
  name: string;
  zeichen?: string;
  /** Eine Kennung aus `Farben` (E672). Alles andere wird nicht gezeichnet. */
  farbe?: string;
  kinder?: BaumKnoten[];
  deaktiviert?: boolean;
}

interface BaumAuftrag {
  name: string;
  knoten: BaumKnoten[];
  gewaehlt?: string | null;
  offen?: string[];
  gewaehltGeaendert?: (id: string) => void;
  offenGeaendert?: (ids: string[]) => void;
}

interface BaumGriff {
  element: HTMLElement;
  gewaehlt: () => string | null;
  waehlen: (id: string | null) => void;
  offene: () => string[];
  oeffnen: (ids: string[]) => void;
}

const Baumansicht = (() => {
  const bauen = (auftrag: BaumAuftrag): BaumGriff => {
    const wurzel = document.createElement('div');
    wurzel.className = 'ru-baum';
    wurzel.setAttribute('role', 'tree');
    wurzel.setAttribute('aria-label', auftrag.name);

    const offen = new Set(auftrag.offen || []);
    let gewaehlt: string | null = auftrag.gewaehlt || null;
    const alle = new Map<string, BaumKnoten>();
    const eltern = new Map<string, string | null>();

    const aufnehmen = (knoten: BaumKnoten[], elternId: string | null): void => {
      for (const k of knoten) {
        if (!k?.id) continue;
        alle.set(k.id, k);
        eltern.set(k.id, elternId);
        aufnehmen(k.kinder || [], k.id);
      }
    };
    aufnehmen(auftrag.knoten || [], null);
    if (gewaehlt && !alle.has(gewaehlt)) gewaehlt = null;

    const sichtbar = (): HTMLElement[] =>
      [...wurzel.querySelectorAll<HTMLElement>('[data-baum-id]')]
        .filter(el => !el.closest('[hidden]'));

    const fokus = (ziel?: HTMLElement): void => {
      if (!ziel) return;
      sichtbar().forEach(el => { el.tabIndex = el === ziel ? 0 : -1; });
      ziel.focus();
    };

    const zeichne = (): void => {
      wurzel.replaceChildren();

      const gruppeBauen = (knoten: BaumKnoten[], ebene: number): HTMLElement => {
        const gruppe = document.createElement('div');
        gruppe.setAttribute('role', 'group');

        for (const k of knoten) {
          const hatKinder = !!k.kinder?.length;
          const zeile = document.createElement('div');
          zeile.className = 'ru-baum-zeile';
          zeile.dataset['baumId'] = k.id;
          zeile.setAttribute('role', 'treeitem');
          zeile.setAttribute('aria-level', String(ebene));
          zeile.setAttribute('aria-selected', String(gewaehlt === k.id));
          if (hatKinder) zeile.setAttribute('aria-expanded', String(offen.has(k.id)));
          if (k.deaktiviert) zeile.setAttribute('aria-disabled', 'true');
          zeile.tabIndex = gewaehlt === k.id ? 0 : -1;
          zeile.style.setProperty('--baum-ebene', String(ebene - 1));
          /* DIE FARBE DES KNOTENS (E672) — noch einmal durch die Whitelist,
             auch wenn der Aufrufer sie schon geprüft hat: dieser Baum ist
             eine gemeinsame Ansicht, und der nächste Aufrufer prüft
             vielleicht nicht. */
          const farbe = typeof Farben !== 'undefined' && Farben.kennung ? Farben.kennung(k.farbe) : '';
          if (farbe) {
            zeile.dataset['farbe'] = farbe;
            zeile.style.setProperty('--baum-farbe', 'var(--c-' + farbe + ')');
          }

          /* EIN `span`, KEIN `button`. Der Knick ist Zierat am Treeitem: die
             Zeile selbst ist das Bedienelement (Klick, Pfeiltasten, Enter),
             und der Klick auf den Knick wird über `closest()` an der Zeile
             erkannt. Als Knopf war er 20 × 24 gross, `aria-hidden` und
             `tabindex=-1` — für den Finger ein Ziel unter 44 px (§37), für
             den Vorleser ein Knopf, den es nicht gibt. test114 mass ihn. */
          const knick = document.createElement('span');
          knick.className = 'ru-baum-knick';
          knick.setAttribute('aria-hidden', 'true');
          knick.textContent = hatKinder ? (offen.has(k.id) ? '⌄' : '›') : '';

          const inhalt = document.createElement('span');
          inhalt.className = 'ru-baum-inhalt';

          if (k.zeichen) {
            const zeichen = document.createElement('span');
            zeichen.className = 'ru-baum-zeichen';
            zeichen.setAttribute('aria-hidden', 'true');
            if (typeof Register !== 'undefined' && Register.symbole?.hat?.(k.zeichen)) {
              zeichen.innerHTML = Register.symbole.alsSvg(k.zeichen);
            } else {
              zeichen.textContent = k.zeichen;
            }
            inhalt.append(zeichen);
          }

          const name = document.createElement('span');
          name.className = 'ru-baum-name';
          name.textContent = k.name;
          inhalt.append(name);
          zeile.append(knick, inhalt);
          gruppe.append(zeile);

          if (hatKinder) {
            const kinder = gruppeBauen(k.kinder || [], ebene + 1);
            kinder.classList.add('ru-baum-kinder');
            if (!offen.has(k.id)) kinder.hidden = true;
            gruppe.append(kinder);
          }
        }
        return gruppe;
      };

      wurzel.append(gruppeBauen(auftrag.knoten || [], 1));
      const zeilen = sichtbar();
      if (!zeilen.some(el => el.tabIndex === 0) && zeilen[0]) zeilen[0].tabIndex = 0;
    };

    const waehlen = (id: string | null, melden: boolean): void => {
      if (id && !alle.has(id)) return;
      gewaehlt = id;
      for (const zeile of wurzel.querySelectorAll<HTMLElement>('[data-baum-id]')) {
        const an = zeile.dataset['baumId'] === id;
        zeile.setAttribute('aria-selected', String(an));
        zeile.tabIndex = an ? 0 : -1;
      }
      if (melden && id) auftrag.gewaehltGeaendert?.(id);
    };

    const klappen = (id: string, wert?: boolean): void => {
      const k = alle.get(id);
      if (!k?.kinder?.length) return;
      const soll = wert ?? !offen.has(id);
      if (soll) offen.add(id); else offen.delete(id);
      zeichne();
      if (soll) {
        wurzel.querySelector<HTMLElement>(`[data-baum-id="${CSS.escape(id)}"]`)
          ?.nextElementSibling?.classList.add('ru-baum-auf');
      }
      auftrag.offenGeaendert?.([...offen]);
      fokus(wurzel.querySelector<HTMLElement>(`[data-baum-id="${CSS.escape(id)}"]`) || undefined);
    };

    wurzel.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-baum-id]') : null;
      if (!ziel) return;
      const id = ziel.dataset['baumId'];
      if (!id || ziel.getAttribute('aria-disabled') === 'true') return;
      if (e.target instanceof Element && e.target.closest('.ru-baum-knick')) {
        klappen(id);
        return;
      }
      waehlen(id, true);
      fokus(ziel);
    });

    wurzel.addEventListener('keydown', e => {
      const aktiv = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-baum-id]') : null;
      if (!aktiv) return;
      const id = aktiv.dataset['baumId'];
      if (!id) return;
      const zeilen = sichtbar();
      const pos = zeilen.indexOf(aktiv);
      const k = alle.get(id);
      const hatKinder = !!k?.kinder?.length;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const d = e.key === 'ArrowDown' ? 1 : -1;
        fokus(zeilen[Math.max(0, Math.min(zeilen.length - 1, pos + d))]);
        return;
      }
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        fokus(e.key === 'Home' ? zeilen[0] : zeilen[zeilen.length - 1]);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (hatKinder && !offen.has(id)) { klappen(id, true); return; }
        if (hatKinder) {
          const neu = sichtbar();
          const p = neu.findIndex(el => el.dataset['baumId'] === id);
          fokus(neu[p + 1]);
        }
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (hatKinder && offen.has(id)) { klappen(id, false); return; }
        const elternId = eltern.get(id);
        if (elternId) {
          fokus(wurzel.querySelector<HTMLElement>(`[data-baum-id="${CSS.escape(elternId)}"]`) || undefined);
        }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (aktiv.getAttribute('aria-disabled') !== 'true') {
          waehlen(id, true);
          fokus(aktiv);
        }
      }
    });

    zeichne();

    return {
      element: wurzel,
      gewaehlt: () => gewaehlt,
      waehlen: (id: string | null) => waehlen(id, false),
      offene: () => [...offen],
      oeffnen: (ids: string[]) => {
        offen.clear();
        ids.filter(id => alle.has(id)).forEach(id => offen.add(id));
        zeichne();
      }
    };
  };

  return { bauen };
})();

(window as any).Baumansicht = Baumansicht;
