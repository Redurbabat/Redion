/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/tab-shelf.ts (npm run bauen:ts). */
/* ============================================================================
 * schale/aufbau/tab-shelf.ts — die Zielleiste über der unteren Leiste (E749)
 * ----------------------------------------------------------------------------
 * ERZEUGT DARAUS WIRD `quell/schale/aufbau/tab-shelf.js` (npm run bauen:ts).
 * ----------------------------------------------------------------------------
 * Redur, 12. Oktober 2026, mit einem Bild — ein rotes Feld direkt über der
 * unteren Leiste, ein Pfeil vom Reiter „Dokumente" hinauf:
 *
 *   „hier will ich etwas neues haben , wenn ich bei dokemnt bin … das es mir
 *    so oben wo rot gezeichnet ist eine neu dock dort kommen und dort nur
 *    sachen die mit unteren zutun haben dann für alle so ich sollte direk mit
 *    hand ohne klick direk wächseln können es sollte flüssig sein mit appel
 *    efeck usw aber zuers nur bei handy"
 *
 * Und am 13. Oktober, 01:08 UTC, die Korrektur, die allem vorgeht:
 *
 *   „die neu dock nur wenn ich mit hand nach oven so zi eht kommt das doet
 *    aber beim klicken nicht"
 *
 * WAS SIE IST. Eine zweite Glaskapsel direkt über der Leiste. Sie erscheint
 * NUR, solange ein Finger von einem Reiter hinaufzieht, und zeigt die fünf
 * Ziele dieses Reiters (`Register.navigation.ziele`, E748). Wer loslässt,
 * wählt, was unter dem Finger leuchtet — genau einmal.
 *
 * WAS SIE NICHT IST.
 *   · Kein Tipp-Weg. Ein Tipp bleibt ein Tipp, und Halten öffnet nichts
 *     (Redurs Korrektur). Es gibt deshalb KEINEN „stehend offen"-Zustand für
 *     die Berührung — der einzige Weg ohne Geste ist die Tastatur (§38),
 *     und die ist kein Klick.
 *   · Kein zweiter Wechselweg. Ein Ort-Ziel geht über `go` — das ist der
 *     `dockWechsel` der Schale, derselbe Weg wie ein Tipp auf den Reiter.
 *   · Keine zweite Gestenmaschine. Den Finger hält `SelectionFlow.ziehbar`
 *     (E706); sie übergibt hierher, sobald er über die Oberkante steigt
 *     (`nimm`). Zwei Zuhörer auf derselben Leiste rennten um denselben Zeiger.
 *   · Kein Bereich. Die Schale kennt keinen Bereich beim Namen: der Schlüssel
 *     ist das Merkmal `data-ziele` am Reiter, die Liste liefert das Register.
 *
 * WARUM SIE NEBEN DER LEISTE STEHT UND NICHT DARIN. `#handy-oben` trägt
 * `backdrop-filter`, und ein Element mit Filter wird zum Bezugsrahmen für
 * jedes `position:fixed` darin — die Kapsel wäre an die Leiste gebunden und
 * von ihr beschnitten. Deshalb `bar.after(shelf)`.
 *
 * WARUM DIE TREFFER AUS DEM LAYOUT KOMMEN. Die Scheibe wächst auf der Feder
 * `sanft` aus dem Reiter heraus (`growFrom`, rund 0,8 s). Ein schneller
 * Finger ist nach 80 ms oben; ein `getBoundingClientRect` in dieser Zeit
 * misst die halb gewachsene Scheibe und trifft das falsche Ziel. Die Spalten
 * werden darum EINMAL gemessen, bevor die Scheibe wächst, und je Inhaltswechsel
 * aus `offsetLeft`/`offsetWidth` — Werte, die keine Verformung kennen. Das ist
 * die Regel aus `test541` §4: Trefferflächen wandern nie.
 *
 * WARUM `z-index: 955`. Über allem, was über der Leiste schwebt (Toast 900,
 * Drucker und Lader 901, Neu-Laden-Streifen 950), unter allem, was die Leiste
 * verdeckt — Blätter mit Abdunklung fangen die Berührung schon vorher ab. Sie
 * deckt diese Dinge nur zu, solange der Finger unten ist.
 *
 * BEWEGUNG nur über `SelectionFlow` (`growFrom`, `highlight`, `stagger`,
 * `folge`) und die Marken der Stilblätter — keine eigene Kurve (test581 §9).
 * Jede WAAPI-Bewegung hier fragt `AppEinstellung.wenigBewegung()`; unter
 * „Ruhige Darstellung" liefern die Federmarken sonst die volle Dauer.
 * ==========================================================================*/

const TabShelf = (() => {

  /** Was `Register.navigation.ziele` liefert (E748). */
  type Target = {
    id: string; name: string; kurz?: string; zeichen: string; rang?: number; ort?: boolean;
    an?: () => boolean; zeigen?: () => boolean; tun: () => void;
  };
  /** Was `SelectionFlow.ziehbar` mit dem Finger macht, nachdem es übergeben hat. */
  type Handover = { move: (x: number, y: number) => void; up: (x: number, y: number) => void; cancel: () => void };
  type Go = (tab: HTMLElement, tun: () => void) => void;
  type Column = { left: number; right: number };
  type TabColumn = { tab: HTMLElement; left: number; width: number };
  type Place = { left: number; top: number; width: number; height: number };

  /** Wie weit über der Scheibe der Finger noch ein Ziel trifft (Entwurf, Zustand 3). */
  const REACH = 24;
  /** Der Tick unter dem Finger, wo es ihn gibt — dieselbe Zahl wie das Heben (E83). */
  const TICK_MS = 12;

  let bar: HTMLElement | null = null;
  let shelf: HTMLElement | null = null;
  let go: Go | null = null;

  /** 'finger' — ein Finger hält sie; 'keys' — die Tastatur hat sie geöffnet. */
  let mode: false | 'finger' | 'keys' = false;
  let tab: HTMLElement | null = null;
  let targets: Target[] = [];
  let items: HTMLElement[] = [];
  let aimed = -1;
  /** Gemessen beim Öffnen, VOR dem Wachsen (siehe Kopf). */
  let box = { left: 0, right: 0, top: 0 };
  let columns: Column[] = [];
  /** Die Lage jedes Ziels in der Scheibe (Masse von `offsetLeft`/`offsetTop`). */
  let places: Place[] = [];
  /** Die EINE Marke der Liste (`SelectionFlow.highlight`), einmal angelegt. */
  let marker: HTMLElement | null = null;
  let barTop = 0;
  /** Die Reiter der Leiste, gelesen beim Öffnen (die Leiste bewegt sich nicht). */
  let barLeft = 0;
  let tabCols: TabColumn[] = [];
  let fade: Animation | null = null;
  let blende: { dauer: number; kurve: string } | null = null;

  const calm = (): boolean => typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung();
  const token = (name: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const tabs = (): HTMLElement[] =>
    bar ? Array.from(bar.querySelectorAll<HTMLElement>(':scope > button[role="tab"]')) : [];
  const pill = (): HTMLElement | null => bar?.querySelector<HTMLElement>('#ho-pille') ?? null;
  const label = (t: HTMLElement): string =>
    (t.querySelector('b')?.textContent || t.getAttribute('title') || '').trim();

  /* ══ DIE PILLE ZEIGT, WESSEN ZIELE OBEN STEHEN ═══════════════════════════
   * Solange die Zielleiste offen ist, steht die Pille unter dem Reiter, dem
   * die Ziele gehören, und sein Wort leuchtet (`data-zielleiste` an der
   * Leiste, `data-anvisiert` am Reiter). Gewechselt wird dabei nichts (E646
   * Punkt 7): die Pille wandert nur.
   *
   * NICHT `data-gehalten`. So stand es im Entwurf („gehoben wie in E706"),
   * und das BILD hat es verworfen: gehalten bricht die Pille das Licht über
   * `url(#ru-linse-fahrt)`, und das Wort darunter stand doppelt und versetzt
   * da („Do…okumente") — beim Ziehen der Pille einen Augenblick lang, hier
   * so lange, wie der Finger oben ist. E641: „labels and icons must remain
   * legible throughout". Die Brechung bleibt der Fahrt (`.faehrt`). */
  const pillTo = (t: HTMLElement | null): void => {
    const p = pill();
    if (!p || typeof SelectionFlow === 'undefined') return;
    const ziel = t ?? bar?.querySelector<HTMLElement>(':scope > button[aria-selected="true"]') ?? null;
    /* Aus dem Merker, nicht aus `offsetLeft`: ein Lesen nach dem Schreiben
       erzwingt eine Stilrechnung, und davon gab es beim ersten Bau vier je
       Öffnen (gemessen, E749). */
    const c = tabCols.find(x => x.tab === ziel);
    if (c && c.width) SelectionFlow.folge(p, c.left, true, false);
  };
  const markTab = (t: HTMLElement | null): void => {
    tabs().forEach(b => { if (b !== t) b.removeAttribute('data-anvisiert'); });
    if (t) t.setAttribute('data-anvisiert', '');
  };

  /* ══ DER INHALT ══════════════════════════════════════════════════════════
   * Per DOM und `textContent` (§19); die Zeichen malt das Register. Die
   * Scheibe bleibt, nur ihre Knöpfe werden ersetzt — zwischen Reitern tauscht
   * der Inhalt, nicht das Glas. */
  const targetsOf = (t: HTMLElement): Target[] => {
    if (typeof Register === 'undefined' || !Register.navigation?.ziele) return [];
    return (Register.navigation.ziele(t.dataset['ziele'] || '') as Target[]).filter(z => z && typeof z.tun === 'function');
  };
  /** Nur SCHREIBEN — gemessen wird danach, einmal (`measure`). */
  const fill = (t: HTMLElement, neu: Target[]): void => {
    if (!shelf) return;
    shelf.querySelectorAll(':scope > button').forEach(b => b.remove());
    items = neu.map((z, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.tabIndex = i === 0 ? 0 : -1;
      b.dataset['ziel'] = z.id;
      const zeichen = document.createElement('span');
      zeichen.className = 'ho-z';
      zeichen.dataset['sym'] = z.zeichen;
      zeichen.dataset['symGroesse'] = '19';
      zeichen.setAttribute('aria-hidden', 'true');
      const wort = document.createElement('b');
      wort.textContent = z.kurz ?? z.name;
      b.append(zeichen, wort);
      let hier = false;
      try { hier = typeof z.an === 'function' && !!z.an(); } catch { /* ein kaputtes an() ist kein Ort */ }
      if (hier) b.setAttribute('aria-current', 'page');
      return b;
    });
    shelf.append(...items);
    try { Register.symbole?.fuelle?.(shelf); } catch { /* ohne Zeichen bleibt das Wort */ }
    targets = neu;
    tab = t;
    shelf.setAttribute('aria-label', 'Ziele in ' + label(t));
    tabs().forEach(b => b.setAttribute('aria-expanded', b === t ? 'true' : 'false'));
    aimed = -1;
  };
  /** Die Spalten aus dem Layout — `offsetLeft` kennt keine Verformung. */
  const measure = (): void => {
    if (!shelf) return;
    const kante = box.left + shelf.clientLeft;
    places = items.map(b => ({ left: b.offsetLeft, top: b.offsetTop, width: b.offsetWidth, height: b.offsetHeight }));
    columns = places.map(q => ({ left: kante + q.left, right: kante + q.left + q.width }));
  };

  /** Ein Ziel anpeilen (−1: keines). Marke, gehobenes Zeichen, Tick. */
  /* DIE MARKE VERSCHWINDET ÜBER EIN MERKMAL, NICHT ÜBER `hidden`. Jedes
     `hidden` kostet eine Stilrechnung der ganzen Seite (die `body:has(…)`-
     Regeln fragen danach; gemessen 17,7 ms bei 4× Drossel, ein `data-`-
     Merkmal 0). Ohne Ziel steht sie deshalb unsichtbar da
     (`data-marke-weg`), und das erste Ziel nach dem Öffnen setzt sie ohne
     Fahrt an ihren Ort — aus dem Merker, ohne zu messen. Danach gleitet sie
     über `highlight`, wie jede Marke einer Liste (E711). */
  const aim = (i: number): void => {
    if (!shelf) return;
    if (i === aimed) return;
    const war = aimed;
    aimed = i;
    const q = places[i];
    if (i < 0 || !q) shelf.setAttribute('data-marke-weg', '');
    else if (typeof SelectionFlow !== 'undefined') {
      if (war < 0 && marker) SelectionFlow.glide(marker, q, true);
      else SelectionFlow.highlight(shelf, items[i] ?? null, { still: true });
      shelf.removeAttribute('data-marke-weg');
    }
    items.forEach((b, k) => { if (k === i) b.setAttribute('data-anvisiert', ''); else b.removeAttribute('data-anvisiert'); });
    if (i >= 0 && mode === 'finger') {
      try { if (typeof navigator.vibrate === 'function') navigator.vibrate(TICK_MS); } catch { /* kein Tick */ }
    }
  };

  /* ══ AUF UND ZU ══════════════════════════════════════════════════════════ */
  /* ERST LESEN, DANN SCHREIBEN, DANN EINMAL LESEN. Der erste Bau las nach
     jedem Schreiben (die Scheibe, die Spalten, die Pille, die Marke), und
     jedes Lesen erzwang eine Stilrechnung der ganzen Seite: gemessen 130 ms
     im Horcher bei 4× Drossel. Jetzt: die Leiste lesen, solange nichts
     verändert ist; alles schreiben; die Scheibe einmal messen; dann bewegen. */
  const open = (t: HTMLElement, wie: 'finger' | 'keys', x = NaN, y = NaN): boolean => {
    if (!bar || !shelf || !t.dataset['ziele']) return false;
    /* Steht die Leiste da? Am Rechner, beim Schreiben, im Dokument und quer
       ist sie per Stilblatt weg — dann gibt es auch keine Zielleiste. */
    const rb = bar.getBoundingClientRect();
    if (!(rb.width > 0 && rb.height > 0)) return false;
    const neu = targetsOf(t);
    if (!neu.length) return false;
    barTop = rb.top;
    barLeft = rb.left + bar.clientLeft - bar.scrollLeft;
    tabCols = tabs().map(b => ({ tab: b, left: b.offsetLeft, width: b.offsetWidth }));
    const anker = t.getBoundingClientRect();

    fade?.cancel(); fade = null;
    shelf.getAnimations().forEach(a => a.cancel());
    shelf.removeAttribute('data-geht');
    fill(t, neu);
    shelf.hidden = false;
    mode = wie;
    /* Die Lupe (×1,3, Nachbarn ×1,13) nur mit Bewegung (Entwurf: „keine Lupe"). */
    if (calm()) shelf.removeAttribute('data-lupe'); else shelf.setAttribute('data-lupe', '');
    if (wie === 'finger') { bar.setAttribute('data-zielleiste', ''); markTab(t); }

    /* EINMAL GEMESSEN, BEVOR DIE SCHEIBE WÄCHST (siehe Kopf). */
    const r = shelf.getBoundingClientRect();
    box = { left: r.left, right: r.right, top: r.top };
    measure();
    /* Wachsen, solange der Stil noch gilt: `growFrom` liest seine Feder aus
       den Marken (`RedionSpring.token`) und bekommt das Mass mit. */
    if (!calm() && typeof SelectionFlow !== 'undefined')
      SelectionFlow.growFrom(shelf, anker, { left: r.left, top: r.top, width: r.width, height: r.height });
    if (wie === 'finger') {
      pillTo(t);
      /* Zuletzt die Marke, aus dem Merker gesetzt (siehe `aim`): kein
         `hidden`, kein Messen nach dem Schreiben. */
      if (Number.isFinite(x)) aim(itemAt(x, y));
    }
    return true;
  };

  const close = (): void => {
    if (!shelf || !bar) return;
    const war = mode;
    mode = false;
    aimed = -1;
    items.forEach(b => b.removeAttribute('data-anvisiert'));
    shelf.setAttribute('data-marke-weg', '');
    tabs().forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (war === 'finger') { bar.removeAttribute('data-zielleiste'); markTab(null); }
    window.removeEventListener('pointerdown', outside, true);
    if (shelf.hidden) return;
    /* Nur `opacity`, damit die Ankunft des neuen Bildschirms die einzige
       Bewegung ist; ohne Bewegung sofort weg. */
    if (calm()) { shelf.hidden = true; return; }
    /* Die Marken einmal gelesen, beim ersten Schliessen: `getComputedStyle`
       nach dem Schreiben wäre wieder eine Stilrechnung. */
    if (!blende) blende = { dauer: parseFloat(token('--motion-fast')), kurve: token('--ease-standard') || 'ease' };
    if (!(blende.dauer > 2)) { shelf.hidden = true; return; }
    shelf.setAttribute('data-geht', '');
    const a = shelf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: blende.dauer, easing: blende.kurve });
    fade = a;
    a.finished.then(() => {
      if (fade !== a || !shelf) return;
      fade = null;
      shelf.hidden = true;
      shelf.removeAttribute('data-geht');
      a.cancel();
    }).catch(() => { /* wieder geöffnet */ });
  };

  /** Ein Ziel wählen — genau einmal. Ort: der Reiterweg; Handlung: nur tun(). */
  const choose = (i: number): void => {
    const z = targets[i];
    const t = tab;
    close();
    if (!z || !t) return;
    if (z.ort && go) { go(t, z.tun); return; }
    pillTo(null);
    try { z.tun(); } catch (e) { console.error('[Zielleiste]', e); }
  };

  /* ══ DER FINGER ══════════════════════════════════════════════════════════
   * Drei Lagen: auf der Leiste (der Reiter darunter bekommt die Zielleiste),
   * im Zielbereich (24 px über der Scheibe bis zur Oberkante der Leiste,
   * seitlich in der Scheibe — das Ziel darunter leuchtet), sonst nichts. */
  const tabAt = (x: number): HTMLElement | null => {
    let best: HTMLElement | null = null, abstand = Infinity;
    for (const c of tabCols) {
      if (!c.width) continue;
      const d = Math.abs(barLeft + c.left + c.width / 2 - x);
      if (d < abstand) { abstand = d; best = c.tab; }
    }
    return best;
  };
  const itemAt = (x: number, y: number): number => {
    if (y >= barTop || y < box.top - REACH || x < box.left || x > box.right) return -1;
    let best = -1, abstand = Infinity;
    columns.forEach((c, i) => {
      const d = x < c.left ? c.left - x : x > c.right ? x - c.right : 0;
      if (d < abstand) { abstand = d; best = i; }
    });
    return best;
  };

  const move = (x: number, y: number): void => {
    if (mode !== 'finger') return;
    if (y >= barTop) {
      const t = tabAt(x);
      aim(-1);
      if (t && t !== tab && t.dataset['ziele']) {
        const neu = targetsOf(t);
        if (neu.length && shelf) {
          fill(t, neu);
          measure();
          if (typeof SelectionFlow !== 'undefined')
            SelectionFlow.stagger(shelf, items, items.map(b => (t.dataset['ziele'] || '') + ':' + (b.dataset['ziel'] || '')));
        }
      }
      markTab(t);
      pillTo(t);
      return;
    }
    const i = itemAt(x, y);
    aim(i);
    if (i >= 0) { markTab(tab); pillTo(tab); }
    else { markTab(null); pillTo(null); }
  };

  const up = (x: number, y: number): void => {
    if (mode !== 'finger') return;
    if (y >= barTop) {
      const t = tabAt(x);
      close();
      pillTo(null);
      /* Ein Reiter: GENAU EIN Klick — derselbe Weg wie ein Tipp (E706). */
      t?.click();
      return;
    }
    const i = itemAt(x, y);
    if (i >= 0) { choose(i); return; }
    close();
    pillTo(null);
  };

  const cancel = (): void => {
    if (!mode) return;
    close();
    pillTo(null);
  };

  /**
   * Die Übergabe aus `SelectionFlow.ziehbar` (E706): der Finger ist über die
   * Oberkante gestiegen — gerade hinauf (`'hoch'`) oder aus einem laufenden
   * Pillenzug (`'aus-zug'`). Ohne Leiste, ohne Ziele: `null`, und `ziehbar`
   * macht weiter wie zuvor.
   */
  const nimm = (k: HTMLElement, _wie: 'hoch' | 'aus-zug', x: number, y: number): Handover | null => {
    if (!open(k, 'finger', x, y)) return null;
    return { move, up, cancel };
  };

  /* ══ DIE TASTATUR (§38) ═════════════════════════════════════════════════
   * Der einzige Weg ohne Geste: Pfeil hinauf am Reiter. Im Menü laufen die
   * Pfeile rundum, Pos1 und Ende springen, Enter und Leertaste wählen,
   * Escape gibt den Fokus an den Reiter zurück, Tab schliesst. */
  const focusItem = (i: number): void => {
    const n = items.length;
    if (!n) return;
    const k = ((i % n) + n) % n;
    items.forEach((b, j) => { b.tabIndex = j === k ? 0 : -1; });
    items[k]?.focus();
    aim(k);
  };
  const outside = (e: Event): void => {
    const ziel = e.target instanceof Node ? e.target : null;
    if (mode === 'keys' && shelf && ziel && !shelf.contains(ziel)) close();
  };

  const onBarKey = (e: KeyboardEvent): void => {
    if (e.key !== 'ArrowUp' || mode) return;
    const t = e.target instanceof HTMLElement ? e.target.closest<HTMLElement>('button[role="tab"][data-ziele]') : null;
    if (!t || !bar?.contains(t)) return;
    if (!open(t, 'keys')) return;
    e.preventDefault();
    window.addEventListener('pointerdown', outside, true);
    focusItem(0);
  };

  const onShelfKey = (e: KeyboardEvent): void => {
    if (mode !== 'keys') return;
    const jetzt = items.findIndex(b => b === document.activeElement);
    const t = tab;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': focusItem(jetzt + 1); break;
      case 'ArrowLeft': case 'ArrowUp': focusItem(jetzt - 1); break;
      case 'Home': focusItem(0); break;
      case 'End': focusItem(items.length - 1); break;
      case 'Enter': case ' ': if (jetzt >= 0) choose(jetzt); break;
      case 'Escape':
        /* Ein Druck, ein Fenster (E302): der Griff der Schale sieht ihn nicht. */
        e.stopPropagation();
        close();
        t?.focus();
        break;
      case 'Tab': close(); return;
      default: return;
    }
    e.preventDefault();
  };

  /**
   * Einmal anbringen: die Scheibe neben der Leiste anlegen, die Reiter
   * auszeichnen, die Tastatur binden. `go(tab, tun)` ist der Reiterweg der
   * Schale (`dockWechsel`) — ein Ort-Ziel geht genau ihn.
   */
  const attach = (o: { bar: HTMLElement | null; go: Go }): void => {
    if (!o.bar || shelf) return;
    bar = o.bar;
    go = o.go;
    const s = document.createElement('div');
    s.id = 'ho-ziele';
    /* `growFrom` setzt die Klasse bei jedem Wachsen; steht sie schon da,
       ändert das Setzen nichts und erzwingt keine Stilrechnung. */
    s.className = 'ru-waechst';
    s.setAttribute('role', 'menu');
    s.setAttribute('aria-orientation', 'horizontal');
    s.hidden = true;
    s.addEventListener('keydown', onShelfKey);
    /* Ein Klick auf ein Ziel zählt nur, wenn die Tastatur das Menü geöffnet
       hat. Am Finger wählt das Loslassen; ein Klick des Browsers danach
       wäre die zweite Wahl. */
    s.addEventListener('click', e => {
      if (mode !== 'keys') return;
      const b = e.target instanceof Element ? e.target.closest<HTMLElement>('#ho-ziele > button') : null;
      const i = b ? items.indexOf(b) : -1;
      if (i >= 0) choose(i);
    });
    s.addEventListener('focusout', e => {
      const nach = e.relatedTarget instanceof Node ? e.relatedTarget : null;
      if (mode === 'keys' && (!nach || !s.contains(nach))) close();
    });
    bar.after(s);
    shelf = s;
    /* Die Linse der Marke (dieselbe wie die der Pille, `linse.ts`) — einmal
       hier, nicht beim Öffnen: sie hängt ein Element an. Ebenso die Marke
       selbst: angelegt, gezeigt und unsichtbar gestellt (siehe `aim`). */
    if (typeof Linse !== 'undefined') Linse.sicherstellen();
    if (typeof SelectionFlow !== 'undefined') {
      marker = SelectionFlow.highlight(s, null, { still: true });
      marker.hidden = false;
      s.setAttribute('data-marke-weg', '');
    }
    for (const t of tabs()) {
      if (!t.dataset['ziele']) continue;
      t.setAttribute('aria-haspopup', 'menu');
      t.setAttribute('aria-controls', 'ho-ziele');
      t.setAttribute('aria-expanded', 'false');
    }
    bar.addEventListener('keydown', onBarKey);
  };

  return { attach, nimm, offen: (): boolean => !!mode };
})();

(window as any).TabShelf = TabShelf;
