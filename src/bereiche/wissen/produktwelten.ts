/* ============================================================================
 * bereiche/wissen/produktwelten.ts — zwei Oberflächen, ein Datenbestand
 * ----------------------------------------------------------------------------
 * Dieser kleine Lotse besitzt bewusst keine Seiten, Karten oder Aufgaben.
 * Er merkt nur, in welcher Produktwelt man arbeitet, markiert die gemeinsame
 * Navigation und reicht den Aufruf an Lernwelt, Arbeitswelt oder die bereits
 * vorhandenen Ansichten weiter. So kann dasselbe Objekt in mehreren Sichten
 * auftauchen, ohne kopiert zu werden.
 * ==========================================================================*/

const Produktwelten = (() => {
  type Welt = 'lernen' | 'workspace';
  type Lernansicht = 'heute' | 'lernen' | 'lernweg' | 'pfad' | 'fehler' |
    'pruefungen' | 'schule' | 'ausbildung' | 'uni' | 'arbeit' | 'fortschritt';
  type Arbeitsansicht = 'start' | 'uebersicht' | 'seiten' | 'bibliothek' |
    'aufgaben' | 'kalender' | 'datenbanken' | 'projekte' | 'dateien' | 'wiki' |
    'vorlagen';

  const WELT_META = 'produkt:welt';
  const LERN_META = 'produkt:lernansicht';
  const ARBEIT_META = 'produkt:arbeitsansicht';

  const sichereWelt = (wert: unknown): Welt =>
    wert === 'workspace' ? 'workspace' : 'lernen';

  const aktiv = (): Welt => sichereWelt(Store.getMeta(WELT_META, 'lernen'));

  const element = (id: string): HTMLElement | null => document.getElementById(id);

  const mobileBeschriftung = (id: string, titel: string, kurz: string): void => {
    const knopf = element(id);
    if (!knopf) return;
    knopf.title = titel;
    const text = knopf.querySelector('b');
    if (text) text.textContent = kurz;
  };

  const markieren = (welt = aktiv()): void => {
    document.body.dataset.produktwelt = welt;
    document.querySelectorAll<HTMLElement>('[data-welt]').forEach(knopf => {
      const an = knopf.dataset.welt === welt;
      knopf.classList.toggle('an', an);
      knopf.setAttribute('aria-pressed', an ? 'true' : 'false');
    });
  };

  const weltSetzen = (welt: Welt): void => {
    Store.setMeta(WELT_META, welt);
    markieren(welt);
    document.dispatchEvent(new CustomEvent('redion:produktwelt', { detail: { welt } }));
  };

  const reiterSetzen = (id: string): void => {
    try {
      if (typeof Seitenleiste !== 'undefined' && Seitenleiste.reiter) {
        Seitenleiste.reiter(id);
        Seitenleiste.zeichne?.();
        Seitenleiste.handyLeiste?.();
      }
    } catch { /* Die Ansicht funktioniert auch ohne die Navigationsschale. */ }
  };

  const lernmodul = (): any => (globalThis as any).Lernwelt;
  const arbeitsmodul = (): any => (globalThis as any).Arbeitswelt;

  const routeSchreiben = (welt: Welt, ansicht: string): void => {
    const route = '#welt-' + welt + '-' + ansicht.replace(/[^a-z0-9-]/g, '');
    try { history.replaceState(history.state, '', location.pathname + location.search + route); }
    catch { location.hash = route; }
  };

  const routeAusHash = (hash = location.hash): { welt: Welt; ansicht: string } | null => {
    const treffer = /^#welt-(lernen|workspace)-([a-z0-9-]+)$/.exec(String(hash || '').toLowerCase());
    if (!treffer) return null;
    const welt = sichereWelt(treffer[1]);
    const erlaubte = welt === 'lernen'
      ? new Set(['heute', 'lernen', 'lernweg', 'fehler', 'pruefungen', 'schule', 'uni', 'arbeit', 'fortschritt'])
      : new Set(['uebersicht', 'bibliothek', 'aufgaben', 'kalender', 'datenbanken', 'wiki', 'vorlagen']);
    return erlaubte.has(treffer[2] as string) ? { welt, ansicht: treffer[2] as string } : null;
  };

  const lernen = (ansicht: Lernansicht = 'heute'): void => {
    const ziel = ansicht === 'pfad' ? 'lernweg'
      : ansicht === 'ausbildung' ? 'schule' : ansicht;
    weltSetzen('lernen');
    Store.setMeta(LERN_META, ziel);
    reiterSetzen(ziel === 'heute' ? 'start' : 'lernen');
    const modul = lernmodul();
    if (modul?.oeffnen) { modul.oeffnen(ziel); routeSchreiben('lernen', ziel); return; }
    if (modul?.open) { modul.open(ziel); routeSchreiben('lernen', ziel); return; }
    /* Rückfall für alte Einzeldateien, in denen das neue Modul noch fehlt. */
    if (ansicht === 'heute' && typeof Ansichten !== 'undefined') Ansichten.start();
    else if (typeof Learning !== 'undefined') Learning.open();
    routeSchreiben('lernen', ziel);
  };

  const workspace = (ansicht: Arbeitsansicht = 'start'): void => {
    const ziel = ansicht === 'start' || ansicht === 'seiten' ? 'uebersicht' : ansicht;
    weltSetzen('workspace');
    Store.setMeta(ARBEIT_META, ziel);
    reiterSetzen('workspace');
    const modul = arbeitsmodul();
    if (modul?.oeffnen) { modul.oeffnen(ziel); routeSchreiben('workspace', ziel); return; }
    if (modul?.open) { modul.open(ziel); routeSchreiben('workspace', ziel); return; }
    if (ziel === 'bibliothek' && typeof Bibliothek !== 'undefined') Bibliothek.oeffne();
    else if (ziel === 'aufgaben' && typeof Bibliothek !== 'undefined') Bibliothek.aufgaben();
    else if (typeof Ansichten !== 'undefined') Ansichten.seiten();
    routeSchreiben('workspace', ziel);
  };

  const bibliothek = (): void => workspace('bibliothek');
  const aufgaben = (): void => workspace('aufgaben');

  const planung = (): void => {
    weltSetzen('lernen');
    reiterSetzen('bespr');
    if (typeof Ansichten !== 'undefined') Ansichten.termine();
  };

  /** Mehrfachzuordnung für bestehende Objekte. Der Dialog schreibt nur die
      kleinen Bereichskennungen; Inhalt und Objektkennung bleiben dieselben. */
  const bereicheDialog = async (objekt: any): Promise<void> => {
    const api = (globalThis as any).Lebensbereiche;
    if (!api || !objekt?.id) {
      UI.toast('Die Lebensbereiche sind in dieser Fassung noch nicht geladen.');
      return;
    }
    const ref = { art: objekt.type === 'page' ? 'page' : 'block', id: String(objekt.id) };
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const dialog = document.createElement('section');
    dialog.className = 'finder produkt-bereiche-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'produkt-bereiche-titel');
    const kopf = document.createElement('div');
    kopf.className = 'fh';
    const titel = document.createElement('b');
    titel.id = 'produkt-bereiche-titel';
    titel.textContent = 'Lebensbereiche';
    const schliessen = document.createElement('button');
    schliessen.className = 'icon-btn';
    schliessen.type = 'button';
    schliessen.title = 'Schliessen';
    schliessen.textContent = '✕';
    kopf.append(titel, schliessen);
    const erklaerung = document.createElement('p');
    erklaerung.className = 'produkt-bereiche-hinweis';
    erklaerung.textContent = 'Dasselbe Objekt darf in mehreren Bereichen erscheinen. Es wird dabei nicht kopiert.';
    const liste = document.createElement('div');
    liste.className = 'produkt-bereiche-liste';
    const fuss = document.createElement('div');
    fuss.className = 'produkt-bereiche-fuss';
    const neu = document.createElement('button');
    neu.type = 'button';
    neu.dataset.aktion = 'neu';
    neu.textContent = '＋ Bereich anlegen';
    const onboarding = document.createElement('button');
    onboarding.type = 'button';
    onboarding.dataset.aktion = 'onboarding';
    onboarding.textContent = 'Einrichtung öffnen';
    fuss.append(neu, onboarding);
    dialog.append(kopf, erklaerung, liste, fuss);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const zeichnen = async (): Promise<void> => {
      const alle = api.auflisten();
      const direkt = new Set<string>(api.direkteBereichIds(objekt));
      const wirksam = new Set<string>((await api.bereicheVon(ref)).map((b: any) => String(b.id)));
      liste.replaceChildren();
      if (!alle.length) {
        const leer = document.createElement('div');
        leer.className = 'produkt-bereiche-leer';
        leer.textContent = 'Noch keine Bereiche. Starte die Einrichtung oder lege einen eigenen Bereich an.';
        liste.appendChild(leer);
        return;
      }
      alle.forEach((bereich: any) => {
        const knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.dataset.bereich = String(bereich.id);
        knopf.setAttribute('role', 'checkbox');
        knopf.setAttribute('aria-checked', direkt.has(String(bereich.id)) ? 'true' : 'false');
        const zeichen = document.createElement('span');
        zeichen.textContent = String(bereich.icon || '◉');
        const name = document.createElement('b');
        name.textContent = String(bereich.name || 'Bereich');
        const stand = document.createElement('span');
        stand.className = 'produkt-bereiche-stand';
        stand.textContent = direkt.has(String(bereich.id)) ? '✓ direkt'
          : wirksam.has(String(bereich.id)) ? 'übergeordnet' : '';
        knopf.append(zeichen, name, stand);
        liste.appendChild(knopf);
      });
    };

    schliessen.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('mousedown', ereignis => {
      if (ereignis.target === overlay) overlay.remove();
    });
    dialog.addEventListener('click', async ereignis => {
      const ziel = ereignis.target instanceof Element
        ? ereignis.target.closest<HTMLElement>('[data-bereich],[data-aktion]') : null;
      if (!ziel) return;
      try {
        if (ziel.dataset.bereich) {
          const direkt = new Set<string>(api.direkteBereichIds(objekt));
          if (direkt.has(ziel.dataset.bereich)) await api.entfernen(ref, ziel.dataset.bereich);
          else await api.zuordnen(ref, ziel.dataset.bereich);
          await zeichnen();
          App.zeichneBaum?.();
          return;
        }
        if (ziel.dataset.aktion === 'onboarding') {
          overlay.remove();
          const modul = (globalThis as any).ProduktOnboarding;
          if (modul?.oeffnen) modul.oeffnen();
          else UI.toast('Die Einrichtung ist in dieser Fassung noch nicht geladen.');
          return;
        }
        if (ziel.dataset.aktion === 'neu') {
          const name = await UI.frage('Name des neuen Bereichs', '');
          if (!String(name || '').trim()) return;
          await api.anlegen({ name: String(name).trim(), icon: '◉', art: 'frei' });
          await zeichnen();
        }
      } catch (fehler) {
        UI.banner(fehler instanceof Error ? fehler.message : String(fehler), 'fehler');
      }
    });
    await zeichnen();
    schliessen.focus();
  };

  const zurAktivenWelt = (): void => {
    if (aktiv() === 'workspace')
      workspace(String(Store.getMeta(ARBEIT_META, 'start')) as Arbeitsansicht);
    else lernen(String(Store.getMeta(LERN_META, 'heute')) as Lernansicht);
  };

  const routeOeffnen = (route = routeAusHash()): boolean => {
    if (!route) return false;
    if (route.welt === 'workspace') workspace(route.ansicht as Arbeitsansicht);
    else lernen(route.ansicht as Lernansicht);
    return true;
  };

  let gestartet = false;
  const start = (): void => {
    markieren();
    const startReiter = document.querySelector<HTMLElement>('#side-reiter [data-reiter="start"]');
    if (startReiter) {
      startReiter.title = 'Heute';
      const name = startReiter.querySelector('b');
      if (name) name.textContent = 'Heute';
    }
    mobileBeschriftung('hl-start', 'Heute', 'Heute');
    mobileBeschriftung('hl-lernen', 'Lernen', 'Lernen');
    mobileBeschriftung('hl-seiten', 'Workspace', 'Workspace');
    mobileBeschriftung('hl-bespr', 'Planung und Termine', 'Plan');
    if (gestartet) return;
    gestartet = true;
    /* Der Produktwelt-Schalter ist der einzige Zuhörer hier. Die übrigen
       Ziele bindet App.start(), damit jeder Knopf genau einen Besitzer hat. */
    element('weltwechsel')?.addEventListener('click', ereignis => {
      const ziel = ereignis.target instanceof Element
        ? ereignis.target.closest<HTMLElement>('[data-welt]') : null;
      if (ziel?.dataset.welt === 'workspace') workspace();
      else if (ziel?.dataset.welt === 'lernen') lernen('heute');
    });
  };

  return {
    start, aktiv, markieren, wechseln: weltSetzen, zurAktivenWelt,
    lernen, workspace, bibliothek, aufgaben, planung, bereicheDialog,
    routeAusHash, routeOeffnen
  };
})();

(window as any).Produktwelten = Produktwelten;
