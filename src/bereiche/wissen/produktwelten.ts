/* ============================================================================
 * bereiche/wissen/produktwelten.ts — Navigation und alte Routen, ein Datenbestand
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
    'pruefungen' | 'noten' | 'stundenplan' | 'schule' | 'ausbildung' | 'uni' |
    'arbeit' | 'fortschritt' | 'trainer';
  type Arbeitsansicht = 'start' | 'uebersicht' | 'seiten' | 'bibliothek' |
    'aufgaben' | 'kalender' | 'datenbanken' | 'whiteboards' | 'projekte' |
    'dateien' | 'wiki' | 'vorlagen';

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
    /* DEN GLIEDERUNGSSTREIFEN WEGNEHMEN. Er gehört zur zuletzt geöffneten
       Seite und hängt an `#main`; eine Produktwelt legt sich darüber, ohne
       ihn anzufassen. Gemessen am 25. August in der Bibliothek: vier Striche
       am rechten Rand, die zu „Willkommen in Redion" gehörten. Ein Klick
       darauf sprang zu einem Block, der gar nicht gezeichnet war — also
       nichts. `streifenZeichnen` baut ihn beim nächsten Seitenaufruf neu
       (`inhaltsflaeche.ts`), hier reicht das Wegnehmen. */
    document.getElementById('rand-toc')?.remove();
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
      ? new Set(['heute', 'lernen', 'lernweg', 'fehler', 'pruefungen', 'schule', 'uni', 'arbeit', 'fortschritt', 'trainer'])
      : new Set(['start', 'seiten', 'dateien', 'projekte', 'uebersicht', 'bibliothek',
                 'aufgaben', 'kalender', 'datenbanken', 'whiteboards', 'wiki', 'vorlagen']);
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
    /* Nur noch ein Kompatibilitätsweg für gespeicherte Links und Aufrufer.
       Die Ansichten wohnen jetzt in Bibliothek, Aufgaben und Kalender;
       keine neue Workspace-Schale und keine Migration von Inhaltsdaten. */
    const ziel = ansicht === 'start' || ansicht === 'seiten' || ansicht === 'projekte'
      ? 'uebersicht' : ansicht === 'dateien' ? 'bibliothek' : ansicht;
    weltSetzen('workspace');
    Store.setMeta(ARBEIT_META, ziel);
    reiterSetzen(ziel === 'aufgaben' ? 'aufgaben' : ziel === 'kalender' ? 'kalender' : 'bibliothek');
    const modul = arbeitsmodul();
    if (modul?.oeffnen) { modul.oeffnen(ziel); return; }
    if (modul?.open) { modul.open(ziel); return; }
    if (ziel === 'bibliothek' && typeof Bibliothek !== 'undefined') Bibliothek.oeffne();
    else if (ziel === 'aufgaben' && typeof Bibliothek !== 'undefined') Bibliothek.aufgaben();
    else if (typeof Ansichten !== 'undefined') Ansichten.seiten();
  };

  const bibliothek = (): void => {
    weltSetzen('workspace');
    reiterSetzen('bibliothek');
    if (typeof Bibliothek !== 'undefined') Bibliothek.oeffne();
  };
  const aufgaben = (): void => workspace('aufgaben');
  /* DER KALENDER IST EIN EIGENER ORT (E430, E431). Die Ansicht gab es die
     ganze Zeit — die Arbeitswelt zeichnet die Chronologie aller Datumsfelder.
     Es fehlte nur die Tür: der Navigationseintrag „Kalender" rief
     `Kalender.dialog()`, und das ist der Verbindungsdialog für Google und
     CalDAV.
     E431 hat die Tür dann noch einmal verlegt. Redur wollte den Kalender
     nicht als Abschnitt des Arbeitsbereichs, sondern als eigenen Ort — wie
     die Elektrotechnik, die auch nicht im Workspace wohnt. Also `zeigeSonder`
     statt `workspace('kalender')`: eigene Krume „📅 Kalender", eigene Adresse
     `#kalender`, keine Workspace-Seitenleiste. Gezeichnet wird trotzdem von
     der Arbeitswelt (§8: kein zweiter Katalog). */
  const kalender = (): void => {
    const modul = arbeitsmodul();
    if (modul?.kalenderOeffnen && modul.kalenderOeffnen()) return;
    /* Rückfall für alte Einzeldateien, in denen der eigene Ort noch fehlt. */
    workspace('kalender');
  };
  const whiteboards = (): void => workspace('whiteboards');

  const planung = (): void => {
    weltSetzen('lernen');
    reiterSetzen('bespr');
    if (typeof Ansichten !== 'undefined') Ansichten.termine();
  };

  /** Mehrfachzuordnung für bestehende Objekte. Der Dialog schreibt nur die
      kleinen Bereichskennungen; Inhalt und Objektkennung bleiben dieselben. */
  const bereicheDialog = async (objekt: any): Promise<void> => {
    const api = (globalThis as any).Lebensbereiche;
    /* ZWEI GRÜNDE, ZWEI SÄTZE (E434). Hier stand ein Satz für beide Fälle:
       „Die Lebensbereiche sind in dieser Fassung noch nicht geladen."
       Beim häufigeren Fall — kein Objekt zum Zuordnen — war er schlicht
       falsch und schickte den Nutzer auf die Suche nach einem Ladefehler,
       den es nicht gab. */
    if (!api) {
      UI.toast('Die Lebensbereiche sind in dieser Fassung noch nicht geladen.');
      return;
    }
    if (!objekt?.id) {
      UI.toast('Dafür braucht es eine Seite oder einen Block.');
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
    /* HIER STAND „Einrichtung öffnen" (weg mit E434). Der Knopf führte in
       die Begrüssungsfläche, und die gibt es nicht mehr. Anlegen und
       Zuordnen kann dieser Dialog selbst — dafür ist er da. */
    fuss.append(neu);
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
    /* DER DRITTE WERT IST DIE KURZFORM AM TELEFON, und „Workspace" ist keine
       (E137). Gemessen bei 390 px: vier von fünf Pillen liefen über den Rand
       — „Workspace" um 78 px, „Heute" um 41. §30 des Auftrags verlangt
       ausdrücklich, dass am iPhone nichts überläuft, und test114 misst es
       Breite für Breite.
       Der lange Name bleibt als Titel stehen; auf der Pille steht das kurze
       Wort, das Redion schon vorher benutzt hat. */
    mobileBeschriftung('hl-start', 'Heute', 'Heute');
    mobileBeschriftung('hl-lernen', 'Lernen & Alltag', 'Lernen');
    /* SEIT E236 GIBT ES `hl-seiten` NICHT MEHR — der Workspace steht im
       Mehr-Blatt unter „Wo du arbeitest". Die Zeile hier wäre eine Anweisung
       an einen Knopf, den niemand mehr baut.
       Und aus „Plan" wurde wieder „Termine": die Kurzform stammt aus der
       Zeit der waagerechten Pillen, wo Zeichen und Wort NEBENEINANDER
       standen und vier von fünf Namen überliefen (E137). Unten stehen sie
       übereinander, jeder Weg hat 78 px — „Termine" braucht bei 10.5 px
       rund 48. Der kurze Name kostete Deutlichkeit, die es nicht mehr zu
       sparen gibt. */
    mobileBeschriftung('hl-bespr', 'Planung und Termine', 'Termine');
    if (gestartet) return;
    gestartet = true;
    /* HIER STAND DER ZUHÖRER AM `weltwechsel` — bis E280 (L86).
       Den Umschalter gibt es seit E206 nicht mehr: `index.html` erklärt in
       einem eigenen Absatz, warum er wegfiel („ein dritter Weg zu zwei
       Orten, ganz oben, in der auffälligsten Zeile"). Der Zuhörer blieb
       und hing an nichts — `element('weltwechsel')` gab seither `null`,
       und `?.` schluckte es still.
       `Produktwelten.markieren()` läuft weiter über `[data-welt]`; findet
       es keins, geht `forEach` über eine leere Liste. Das war schon in
       E206 die ganze Rechnung. */
  };

  return {
    start, aktiv, markieren, wechseln: weltSetzen, zurAktivenWelt,
    lernen, workspace, bibliothek, aufgaben, kalender, whiteboards, planung, bereicheDialog,
    routeAusHash, routeOeffnen
  };
})();

(window as any).Produktwelten = Produktwelten;
