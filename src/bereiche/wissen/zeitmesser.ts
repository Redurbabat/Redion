/* ============================================================================
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/zeitmesser.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/zeitmesser.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ==========================================================================*/
/* ==========================================================================
 * zeitmesser.js — Stoppuhr und Timer mit Dokumentbezug (E268)
 *
 * Aus Redurs GoodNotes-Dossier (»Time Keeper«): eine kleine Uhr, die beim
 * Lernen mitläuft — Stoppuhr fürs Messen, Timer fürs Begrenzen — und die
 * sich MERKT, woran gearbeitet wurde. AUFGABEN.md verlangt seit Langem
 * »Pomodoro/Lernzeit echt messen statt schätzen«; hier ist der Anfang:
 * jede beendete Sitzung landet mit Dauer und Seite in `zeit:sitzungen`.
 *
 * Bewusst KEIN eigener Bereich, kein Blatt, kein Blocktyp: ein schwebendes
 * Feld über allem, das weiterläuft, wenn man es schliesst. Die Uhr gehört
 * zur Arbeit, nicht zu einer Seite — der DOKUMENTBEZUG entsteht beim
 * Start (welche Seite ist offen?), nicht durch einen Ort im Baum.
 * ========================================================================*/
const Zeitmesser = (() => {

  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  /* Höchstens so viele Sitzungen bleiben liegen — eine Lernwoche, kein
     unbegrenzt wachsender Verlauf (§15 gilt auch für Kleinkram). */
  const MERKGRENZE = 50;

  type Lauf = {
    art: 'stoppuhr' | 'timer';
    beginn: number;            /* Date.now() beim Start */
    sollSek: number;           /* 0 bei der Stoppuhr */
    vergangenSek: number;      /* aufgelaufen über Pausen hinweg — WACHE Zeit */
    uebersprungenSek: number;  /* Schlaf und verborgene Registerkarte: gesehen, nicht gezählt */
    zuletzt: number;           /* letzter Tick, für die Differenz */
    gesichert: number;         /* letztes Schreiben nach zeit:laufend */
    pausiert: boolean;
    seiteId: string;
    seitenName: string;
  };
  let lauf: Lauf | null = null;
  let ticker: number | null = null;

  /* WACHE ZEIT, NICHT WANDUHR (E364, L81 Punkt 2). Der Tick kommt alle
     500 ms; kommt er nach mehr als dreissig Sekunden, hat der Rechner
     geschlafen oder der Browser die Registerkarte eingeschläfert — die
     Spanne wird gesehen, aber nicht gezählt. Eine verborgene Registerkarte
     zählt auch nicht: gezählt wird, was man vor sich hat. Und alle fünf
     Sekunden geht der Stand in die Ablage, damit die Uhr ein Neuladen
     überlebt (Punkt 4). */
  const SCHLAF_GRENZE_MS = 30 * 1000;
  const SICHERN_ALLE_MS = 5 * 1000;
  const LAUFEND = 'zeit:laufend';
  const laufendSichern = (): void => {
    if (typeof Store === 'undefined') return;
    Store.setMeta(LAUFEND, lauf ? { ...lauf } : null);
    if (lauf) lauf.gesichert = Date.now();
  };

  const sitzungen = (): any[] => {
    const roh = Store.getMeta('zeit:sitzungen', []);
    return Array.isArray(roh) ? roh : [];
  };

  const uhrText = (sek: number): string => {
    const s = Math.max(0, Math.round(sek));
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  const restSek = (): number => !lauf ? 0
    : lauf.art === 'timer' ? Math.max(0, lauf.sollSek - lauf.vergangenSek)
    : lauf.vergangenSek;

  const seiteJetzt = (): { id: string; name: string } => {
    const id = (typeof App !== 'undefined' && App.aktuelleSeite && App.aktuelleSeite()) || '';
    const p = id ? Store.getBlock(id) : null;
    return { id: String(id || ''), name: String(p?.text || '').trim() || 'Ohne Seite' };
  };

  /** Eine beendete Sitzung festhalten — nur echte (ab 5 Sekunden), sonst
   *  füllte jedes Antippen den Verlauf. */
  const merken = (): void => {
    if (!lauf || lauf.vergangenSek < 5) return;
    const liste = sitzungen();
    liste.unshift({
      art: lauf.art, beginn: lauf.beginn,
      dauerSek: Math.round(lauf.vergangenSek),
      sollSek: lauf.sollSek || 0,
      seiteId: lauf.seiteId, seitenName: lauf.seitenName
    });
    Store.setMeta('zeit:sitzungen', liste.slice(0, MERKGRENZE));
  };

  const tick = (): void => {
    if (!lauf) return;
    const jetzt = Date.now();
    const delta = jetzt - lauf.zuletzt;
    lauf.zuletzt = jetzt;
    const sichtbar = typeof document === 'undefined' || document.visibilityState !== 'hidden';
    if (!lauf.pausiert) {
      /* Eine rückwärts gestellte Uhr (delta < 0) zählt weder vor noch zurück. */
      if (delta > 0 && delta <= SCHLAF_GRENZE_MS && sichtbar) lauf.vergangenSek += delta / 1000;
      else if (delta > 0) lauf.uebersprungenSek += delta / 1000;
    }
    if (lauf.art === 'timer' && lauf.sollSek - lauf.vergangenSek <= 0) {
      const name = lauf.seitenName;
      const minuten = Math.round(lauf.sollSek / 60);
      merken();
      lauf = null;
      laufendSichern();
      UI.toast(`⏰ Zeit um — ${minuten} Min an „${name}".`);
    } else if (jetzt - lauf.gesichert >= SICHERN_ALLE_MS) laufendSichern();
    zeichneStand();
    if (!lauf && ticker !== null) { clearInterval(ticker); ticker = null; }
  };

  const start = (art: 'stoppuhr' | 'timer' = 'stoppuhr', sollSek = 0): void => {
    if (lauf) merken();
    const wo = seiteJetzt();
    lauf = { art, beginn: Date.now(), sollSek: art === 'timer' ? Math.max(1, sollSek) : 0,
      vergangenSek: 0, uebersprungenSek: 0, zuletzt: Date.now(), gesichert: 0, pausiert: false,
      seiteId: wo.id, seitenName: wo.name };
    if (ticker === null) ticker = window.setInterval(tick, 500);
    laufendSichern();
    zeichneStand();
  };

  const pause = (): void => {
    if (!lauf) return;
    lauf.pausiert = !lauf.pausiert;
    lauf.zuletzt = Date.now();
    laufendSichern();
    zeichneStand();
  };

  const stopp = (): void => {
    if (!lauf) return;
    merken();
    lauf = null;
    laufendSichern();
    if (ticker !== null) { clearInterval(ticker); ticker = null; }
    zeichneStand();
  };

  /** DIE UHR ÜBERLEBT DAS NEULADEN (E364, L81 Punkt 4): der zuletzt
   *  gesicherte Stand wird wieder aufgenommen — die Spanne seit dem
   *  Sichern zählt nicht (sie war Schlaf oder Neuladen), die Uhr läuft von
   *  dort weiter. Angestossen, sobald die Ablage da ist; war sie beim
   *  Anmelden längst geladen, reicht der Bus die Meldung nach (E362). */
  const wiederaufnehmen = (): void => {
    if (lauf || typeof Store === 'undefined') return;
    const roh = Store.getMeta(LAUFEND);
    if (!roh || typeof roh !== 'object' || (roh.art !== 'stoppuhr' && roh.art !== 'timer')) return;
    lauf = { art: roh.art, beginn: Number(roh.beginn) || Date.now(), sollSek: Number(roh.sollSek) || 0,
      vergangenSek: Math.max(0, Number(roh.vergangenSek) || 0),
      uebersprungenSek: Math.max(0, Number(roh.uebersprungenSek) || 0),
      zuletzt: Date.now(), gesichert: Date.now(), pausiert: !!roh.pausiert,
      seiteId: String(roh.seiteId || ''), seitenName: String(roh.seitenName || 'Ohne Seite') };
    if (ticker === null) ticker = window.setInterval(tick, 500);
    zeichneStand();
  };
  if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined' && ARTEN.ablageGeladen) {
    try { Ereignisse.horche(ARTEN.ablageGeladen, wiederaufnehmen, { nachreichen: true }); }
    catch { /* dann eben nur in dieser Sitzung */ }
  }

  const stand = () => ({
    laeuft: !!lauf, pausiert: !!lauf?.pausiert,
    art: lauf?.art || '', sekunden: lauf ? Math.round(restSek()) : 0,
    uebersprungenSek: lauf ? Math.round(lauf.uebersprungenSek) : 0,
    seite: lauf?.seitenName || ''
  });


  /* ------------------------------------------------------------------ *
   * Das schwebende Feld — und die Pille, in die es sich zurückzieht
   * ------------------------------------------------------------------ *
   * DIE UHR LIEF UNSICHTBAR (E713): nach ✕ lief sie weiter, und nichts
   * sagte es. Jetzt zieht sich das Feld in eine dunkle PILLE zurück
   * („⏱ 24:13 · Seite"); ein Tipp, und sie geht wieder zur Karte auf —
   * Redurs Video, Szene 02 „EXPAND". Die Fahrt: EINE Feder (RedionSpring
   * „snappy" wie SelectionFlow, ω ≈ 17,5), nur `transform`/`opacity` als
   * einmal gerechnete Keyframes, die Unschärfe steht still (verwischte
   * Kopie, über `opacity` überblendet). Kein Goo: Pille und Karte sind EIN
   * Körper. Ohne Bewegung: sofort.
   * ------------------------------------------------------------------ */

  /** Weniger Bewegung — die EINE Frage aus E702, zwei Quellen. */
  const ruhig = (): boolean => {
    try {
      if (typeof AppEinstellung !== 'undefined' && AppEinstellung.wenigBewegung) return AppEinstellung.wenigBewegung();
    } catch { /* dann fragt die Seite selbst */ }
    return document.body?.dataset['bewegung'] === 'ruhig' ||
      !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  type Stand = ReturnType<typeof stand>;
  const zustandVon = (s: Stand): string => s.laeuft ? (s.pausiert ? 'pausiert' : 'laeuft') : 'bereit';
  const artText = (s: Stand): string =>
    (s.art === 'timer' ? 'Timer' : 'Stoppuhr') + (s.pausiert ? ' · pausiert' : '') +
    (s.uebersprungenSek >= 60 ? ' · ' + uhrText(s.uebersprungenSek) + ' Schlaf nicht gezählt' : '');

  /** Der Fortschritt des Timers — nur mit echtem Soll. Die Stoppuhr hat
   *  keines, also hat sie keinen Balken (nichts versprechen, §33). */
  const fortschritt = (): { soll: number; vergangen: number } | null =>
    lauf && lauf.art === 'timer' && lauf.sollSek > 0
      ? { soll: Math.round(lauf.sollSek), vergangen: Math.min(Math.round(lauf.sollSek), Math.round(lauf.vergangenSek)) }
      : null;
  const fortschrittText = (f: { soll: number; vergangen: number }): string =>
    Math.floor(f.vergangen / 60) + ' von ' + Math.round(f.soll / 60) + ' Minuten';

  const feldHtml = (): string => {
    const s = stand();
    const f = fortschritt();
    const liste = sitzungen().slice(0, 3).map(z =>
      `<li>${esc(uhrText(z.dauerSek))} · ${esc(z.seitenName || 'Ohne Seite')}` +
      `${z.art === 'timer' ? ' <i>(Timer)</i>' : ''}</li>`).join('');
    return `<div class="zm-kopf"><b>Zeitmesser</b>` +
      /* `data-esc-knopf`: diesen Knopf drückt der gemeinsame Escape-Griff
         (schale.ts, E302), wenn kein Menü und keine Überlagerung offen ist. */
      `<button class="rb zeichen" data-zm="zu" data-esc-knopf aria-label="Schliessen">✕</button></div>` +
      /* DIE SEITE IST DER TITEL (E713). `.zm-wo` bleibt der Träger — test268
         und test356 lesen dort Seite und „Schlaf nicht gezählt". */
      `<p class="zm-wo">${s.laeuft
        ? `<b class="zm-titel">${esc(s.seite)}</b><span class="zm-art">${esc(artText(s))}</span>`
        : 'Misst die Zeit an der offenen Seite.'}</p>` +
      `<div class="zm-uhr" aria-live="off">${uhrText(s.sekunden)}</div>` +
      (f ? `<div class="zm-fortschritt" role="progressbar" aria-label="Fortschritt des Timers" aria-valuemin="0"` +
           ` aria-valuemax="${f.soll}" aria-valuenow="${f.vergangen}" aria-valuetext="${esc(fortschrittText(f))}"><i></i></div>` : '') +
      `<div class="zm-reihe">` +
      `<button class="rb" data-zm="stoppuhr">Stoppuhr</button>` +
      `<button class="rb" data-zm="t5">5 Min</button>` +
      `<button class="rb" data-zm="t25">25 Min</button>` +
      `</div>` +
      /* `data-rmo-taste` ist rein für die Darstellung da (E535): der
         mechanische Dreierblock braucht je Taste eine Rolle, und `data-zm`
         taugt dafür nicht — dort heisst die Starttaste „stoppuhr" wie der
         Knopf eine Reihe höher. Der Klick liest weiterhin nur `data-zm`. */
      `<div class="zm-reihe rmo-transport" role="group" aria-label="Zeit steuern" data-zustand="${zustandVon(s)}">` +
      `<button class="rb haupt" data-rmo-taste="start" data-zm="stoppuhr" ${s.laeuft ? 'disabled' : ''}>Start</button>` +
      `<button class="rb" data-rmo-taste="pause" data-zm="pause" ${s.laeuft ? '' : 'disabled'}><span class="zm-wort">${s.pausiert ? 'Weiter' : 'Pause'}</span></button>` +
      `<button class="rb" data-rmo-taste="stopp" data-zm="stopp" ${s.laeuft ? '' : 'disabled'}>Beenden</button>` +
      `</div>` +
      (liste ? `<div class="zm-sitzungen"><span>Zuletzt</span><ul>${liste}</ul></div>` : '');
  };

  /** Der Balken zeigt den Anteil über `transform` (translateX in seiner
   *  Spur) — kein `width` je Tick. */
  const fortschrittSetzen = (wurzel: ParentNode): void => {
    const f = fortschritt();
    const fuellung = wurzel.querySelector<HTMLElement>('.zm-fortschritt i');
    if (f && fuellung) fuellung.style.setProperty('--zm-anteil', String(f.soll ? f.vergangen / f.soll : 0));
  };

  const zeichneStand = (): void => {
    pilleStand();
    const feld = document.querySelector<HTMLElement>('.zm-feld');
    const inhalt = feld?.querySelector<HTMLElement>('.zm-inhalt');
    if (!feld || !inhalt) return;
    const next = document.createElement('div');
    next.innerHTML = feldHtml();
    const currentState = inhalt.querySelector('.rmo-transport')?.getAttribute('data-zustand');
    const nextState = next.querySelector('.rmo-transport')?.getAttribute('data-zustand');
    const laufend = (z?: string | null): boolean => z === 'laeuft' || z === 'pausiert';
    /* Beim Tick bleiben die Tasten samt Fokus erhalten, seit E713 auch bei
       Pause ↔ Weiter (derselbe Knopf tauscht Wort und Zeichen). Nur ein
       Wechsel der Gestalt zeichnet die Steuerung neu. */
    const gleicheGestalt = (currentState === nextState || (laufend(currentState) && laufend(nextState))) &&
      !!inhalt.querySelector('.zm-fortschritt') === !!next.querySelector('.zm-fortschritt') &&
      !!inhalt.querySelector('.zm-titel') === !!next.querySelector('.zm-titel');
    if (gleicheGestalt) {
      const texte = next.querySelector('.zm-titel') ? ['.zm-uhr', '.zm-titel', '.zm-art', '.zm-wort'] : ['.zm-uhr', '.zm-wo', '.zm-wort'];
      for (const selector of texte) {
        const target = inhalt.querySelector(selector);
        const text = next.querySelector(selector)?.textContent || '';
        if (target && target.textContent !== text) target.textContent = text;
      }
      const leiste = inhalt.querySelector('.zm-fortschritt');
      const neueLeiste = next.querySelector('.zm-fortschritt');
      if (leiste && neueLeiste) for (const name of ['aria-valuenow', 'aria-valuetext', 'aria-valuemax']) {
        const wert = neueLeiste.getAttribute(name) || '';
        if (leiste.getAttribute(name) !== wert) leiste.setAttribute(name, wert);
      }
      fortschrittSetzen(inhalt);
      const transport = inhalt.querySelector('.rmo-transport');
      if (transport && nextState && transport.getAttribute('data-zustand') !== nextState)
        transport.setAttribute('data-zustand', nextState);
      return;
    }
    const focused = feld.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).dataset.zm : undefined;
    inhalt.replaceChildren(...Array.from(next.childNodes));
    fortschrittSetzen(inhalt);
    if (focused) inhalt.querySelector<HTMLButtonElement>(`[data-zm="${focused}"]:not(:disabled)`)?.focus();
  };

  /* ── Die Pille ─────────────────────────────────────────────────────── */

  /** Solange eine Fahrt läuft, schaltet der Tick die Pille nicht um. */
  let fahrt: { ende: () => void } | null = null;

  const pilleBauen = (): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'zm-pille';
    b.className = 'zm-pille';
    b.innerHTML = '<span class="zm-pille-lampe" aria-hidden="true"></span>' +
      '<span class="zm-pille-zeichen" data-sym="clock" data-sym-groesse="16" aria-hidden="true">⏱</span>' +
      '<b class="zm-pille-uhr"></b><span class="zm-pille-trenner" aria-hidden="true">·</span>' +
      '<span class="zm-pille-seite"></span>';
    try { (globalThis as any).Register?.symbole?.fuelle?.(b); } catch { /* dann bleibt ⏱ stehen */ }
    b.addEventListener('click', () => oeffnen(true));
    return b;
  };

  /** Pille zeigen, wenn die Uhr läuft und das Feld zu ist — sonst nicht. */
  const pilleStand = (): void => {
    let pille = document.getElementById('zm-pille');
    if (!lauf) {
      if (pille && !fahrt) pille.remove();
      return;
    }
    const feld = document.querySelector('.zm-feld');
    let neu = false;
    if (!pille) {
      if (feld) return;
      pille = pilleBauen();
      document.body.appendChild(pille);
      neu = true;
    }
    if (!fahrt) pille.hidden = !!feld;
    const s = stand();
    const uhr = uhrText(s.sekunden);
    const setze = (wahl: string, text: string): void => {
      const e = pille!.querySelector(wahl);
      if (e && e.textContent !== text) e.textContent = text;
    };
    setze('.zm-pille-uhr', uhr);
    setze('.zm-pille-seite', s.seite);
    const zustand = zustandVon(s);
    if (pille.dataset['zustand'] !== zustand) pille.dataset['zustand'] = zustand;
    /* DER NAME NENNT MINUTEN, NICHT SEKUNDEN (Durchsicht von E713). Nach
       dem Schliessen steht der Fokus HIER (§38: er kehrt zurück); ein Name,
       der jede Sekunde wechselt, liesse einen Bildschirmleser, der
       Namenswechsel am Fokus ansagt, im Sekundentakt sprechen. Die Sekunden
       stehen sichtbar in der Pille, der Name wechselt einmal je Minute. */
    const minuten = s.art === 'timer' ? 'noch ' + Math.ceil(s.sekunden / 60) + ' Min'
      : s.sekunden < 60 ? 'unter 1 Min gemessen' : Math.floor(s.sekunden / 60) + ' Min gemessen';
    const name = 'Zeitmesser: ' + minuten + ' an „' + s.seite + '"' + (s.pausiert ? ', pausiert' : '') + ' — öffnen';
    if (pille.getAttribute('aria-label') !== name) pille.setAttribute('aria-label', name);
    /* Eine neue Pille (etwa nach dem Neuladen) kommt sanft herein. */
    if (neu && !pille.hidden && !ruhig()) {
      const feder = typeof RedionSpring !== 'undefined' ? RedionSpring.token('smooth') : null;
      if (feder && feder.duration > 1)
        pille.animate([{ opacity: 0, transform: 'translateY(8px) scale(.94)' }, { opacity: 1, transform: 'none' }],
          { duration: feder.duration, easing: feder.easing });
    }
  };

  /* ── Die Fahrt ─────────────────────────────────────────────────────── */

  type Kasten = { left: number; top: number; width: number; height: number };
  const kasten = (e: Element): Kasten => {
    const r = e.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height };
  };

  /** Die Bahn eines Körpers mit Layout-Kasten `box` von `von` nach `nach`
   *  als `transform`-Keyframes, auf der Feder des Materials („snappy"). */
  const bahn = (box: Kasten, von: Kasten, nach: Kasten): { bilder: Keyframe[]; dauer: number } => {
    const feder = RedionSpring.preset('snappy');
    /* In Pixeln gerechnet: über 0…1 ruhte sie bei 1 % (Sprung am Ende). */
    const weit = Math.max(1, Math.abs(nach.left - von.left), Math.abs(nach.top - von.top),
      Math.abs(nach.width - von.width), Math.abs(nach.height - von.height));
    const roh = RedionSpring.sample(feder, 0, weit, 0, 8);
    const lauf01 = { values: roh.values.map(v => v / weit), duration: roh.duration };
    const bilder: Keyframe[] = lauf01.values.map(p => {
      const l = von.left + (nach.left - von.left) * p;
      const t = von.top + (nach.top - von.top) * p;
      const b = von.width + (nach.width - von.width) * p;
      const h = von.height + (nach.height - von.height) * p;
      return { transform: 'translate(' + (l - box.left).toFixed(2) + 'px,' + (t - box.top).toFixed(2) + 'px) scale(' +
        (b / box.width).toFixed(4) + ',' + (h / box.height).toFixed(4) + ')' };
    });
    return { bilder, dauer: lauf01.duration };
  };

  /** Eine Überblendung über Stützpunkte [Anteil, Deckkraft]. */
  const blende = (e: Element, punkte: Array<[number, number]>, dauer: number): Animation =>
    e.animate(punkte.map(([offset, opacity]) => ({ offset, opacity })), { duration: dauer, easing: 'linear', fill: 'both' });

  /** Eine laufende Fahrt sofort zu Ende bringen (neuer Tipp mitten drin). */
  const fahrtBeenden = (): void => { const f = fahrt; fahrt = null; f?.ende(); };
  /** Aufräumen, wenn alle Bahnen am Ziel sind (nach ihrer eigenen Uhr). */
  const nachDerFahrt = (laeufe: Animation[], ende: () => void): void => {
    Promise.all(laeufe.map(a => a.finished))
      .then(() => { if (fahrt?.ende === ende) fahrtBeenden(); })
      .catch(() => { /* abgebrochen, weil umgelenkt */ });
  };

  const aufgehen = (feld: HTMLElement, pille: HTMLElement, von: Kasten): void => {
    const inhalt = feld.querySelector<HTMLElement>('.zm-inhalt');
    const nach = kasten(feld);
    if (!inhalt || !nach.width || !von.width) { pille.hidden = true; return; }
    const karte = bahn(nach, von, nach);
    const tropfen = bahn(von, von, nach);
    const d = karte.dauer;
    /* Die verwischte Kopie: statisch unscharf, ohne Knöpfe und Namen. */
    const geist = inhalt.cloneNode(true) as HTMLElement;
    geist.className = 'zm-inhalt zm-geist';
    geist.setAttribute('aria-hidden', 'true');
    geist.inert = true;
    /* Auch `data-esc-knopf` geht aus der Kopie (Durchsicht von E713): der
       Escape-Griff nimmt den LETZTEN solchen Knopf — sonst den der Kopie,
       und Escape während der Fahrt täte nichts. */
    geist.querySelectorAll('[data-zm], [role], [data-rmo-taste], [data-esc-knopf]').forEach(x => {
      x.removeAttribute('data-zm'); x.removeAttribute('role'); x.removeAttribute('data-rmo-taste');
      x.removeAttribute('data-esc-knopf');
    });
    geist.querySelectorAll('.rmo-transport').forEach(x => x.classList.remove('rmo-transport'));
    feld.appendChild(geist);
    feld.style.transformOrigin = '0 0';
    pille.style.transformOrigin = '0 0';
    pille.classList.add('zm-fliegt');
    const laeufe: Animation[] = [
      feld.animate(karte.bilder, { duration: d, easing: 'linear', fill: 'both' }),
      blende(feld, [[0, 0], [0.08, 0], [0.4, 1], [1, 1]], d),
      blende(inhalt, [[0, 0], [0.3, 0], [0.72, 1], [1, 1]], d),
      blende(geist, [[0, 0], [0.12, 0], [0.35, 1], [0.72, 0], [1, 0]], d),
      pille.animate(tropfen.bilder, { duration: d, easing: 'linear', fill: 'both' }),
      blende(pille, [[0, 1], [0.15, 1], [0.5, 0], [1, 0]], d)
    ];
    const ende = (): void => {
      laeufe.forEach(a => a.cancel());
      geist.remove();
      feld.style.removeProperty('transform-origin');
      pille.style.removeProperty('transform-origin');
      pille.classList.remove('zm-fliegt');
      pille.hidden = true;
      if (fahrt?.ende === ende) fahrt = null;
    };
    fahrt = { ende };
    nachDerFahrt(laeufe, ende);
  };

  const zusammenziehen = (feld: HTMLElement, pille: HTMLElement): void => {
    const von = kasten(feld);
    pille.hidden = false;
    const nach = kasten(pille);
    const inhalt = feld.querySelector<HTMLElement>('.zm-inhalt');
    if (!nach.width || !von.width) { feld.remove(); return; }
    const karte = bahn(von, von, nach);
    const tropfen = bahn(nach, von, nach);
    const d = karte.dauer;
    feld.style.transformOrigin = '0 0';
    pille.style.transformOrigin = '0 0';
    pille.classList.add('zm-fliegt');
    const laeufe: Animation[] = [
      feld.animate(karte.bilder, { duration: d, easing: 'linear', fill: 'both' }),
      blende(feld, [[0, 1], [0.18, 1], [0.5, 0], [1, 0]], d),
      pille.animate(tropfen.bilder, { duration: d, easing: 'linear', fill: 'both' }),
      blende(pille, [[0, 0], [0.12, 0], [0.45, 1], [1, 1]], d)
    ];
    if (inhalt) laeufe.push(blende(inhalt, [[0, 1], [0.2, 0], [1, 0]], d));
    /* Die Schrift der Pille kommt zurück, sobald sie fast ihre Grösse hat. */
    for (const kind of Array.from(pille.children)) laeufe.push(blende(kind, [[0, 0], [0.55, 0], [0.85, 1], [1, 1]], d));
    const ende = (): void => {
      laeufe.forEach(a => a.cancel());
      feld.remove();
      pille.style.removeProperty('transform-origin');
      pille.classList.remove('zm-fliegt');
      if (fahrt?.ende === ende) fahrt = null;
      pilleStand();
    };
    fahrt = { ende };
    nachDerFahrt(laeufe, ende);
  };

  /* ── Öffnen und schliessen ─────────────────────────────────────────── */

  let vorherFokus: HTMLElement | null = null;

  const feldBauen = (): HTMLElement => {
    const feld = document.createElement('div');
    feld.className = 'zm-feld zm-karte';
    feld.setAttribute('role', 'dialog');
    feld.setAttribute('aria-label', 'Zeitmesser');
    const inhalt = document.createElement('div');
    inhalt.className = 'zm-inhalt';
    inhalt.innerHTML = feldHtml();
    feld.appendChild(inhalt);
    feld.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-zm]');
      if (!b || !inhalt.contains(b)) return;
      const was = b.dataset['zm'];
      if (was === 'zu') { schliessen(); return; }
      if (was === 'stoppuhr') return start('stoppuhr');
      if (was === 't5') return start('timer', 5 * 60);
      if (was === 't25') return start('timer', 25 * 60);
      if (was === 'pause') return pause();
      if (was === 'stopp') return stopp();
    });
    document.body.appendChild(feld);
    fortschrittSetzen(inhalt);
    return feld;
  };

  /** Das Feld aufmachen — aus der Pille heraus, wenn es eine gibt. */
  const oeffnen = (ausPille: boolean): void => {
    fahrtBeenden();
    document.querySelectorAll('.zm-karte.zm-geht').forEach(x => x.remove());
    if (document.querySelector('.zm-feld')) return;
    const aktiv = document.activeElement;
    vorherFokus = aktiv instanceof HTMLElement && aktiv !== document.body && aktiv.id !== 'zm-pille' ? aktiv : null;
    const pille = document.getElementById('zm-pille');
    const von = pille && !pille.hidden ? kasten(pille) : null;
    const feld = feldBauen();
    if (pille && von && !ruhig() && typeof RedionSpring !== 'undefined') aufgehen(feld, pille, von);
    else {
      if (pille) pille.hidden = true;
      /* Ohne Pille (aus dem Menü): die Karte steigt kurz auf. */
      if (!pille && !ruhig() && typeof RedionSpring !== 'undefined') {
        const feder = RedionSpring.token('snappy');
        if (feder.duration > 1)
          feld.animate([{ opacity: 0, transform: 'translateY(10px) scale(.97)' }, { opacity: 1, transform: 'none' }],
            { duration: feder.duration, easing: feder.easing });
      }
    }
    /* Aus der Pille geht der Fokus hinein. */
    if (ausPille) {
      const ziel = feld.querySelector<HTMLElement>('[data-zm="pause"]:not(:disabled)') ||
        feld.querySelector<HTMLElement>('[data-zm="zu"]');
      ziel?.focus({ preventScroll: true });
    }
  };

  /** Das Feld schliessen. Läuft die Uhr, zieht es sich in die Pille
   *  zurück, und der Fokus geht dorthin; sonst ist es einfach fort. */
  const schliessen = (): void => {
    fahrtBeenden();
    const feld = document.querySelector<HTMLElement>('.zm-feld');
    if (!feld) return;
    const fokusDrin = feld.contains(document.activeElement) || document.activeElement === document.body;
    /* Sofort nicht mehr „das Feld" — die Karte ist nur noch ihr Abgang. */
    feld.classList.remove('zm-feld');
    feld.classList.add('zm-geht');
    feld.removeAttribute('role');
    feld.setAttribute('aria-hidden', 'true');
    feld.inert = true;
    if (!lauf) {
      feld.remove();
      pilleStand();
      if (fokusDrin && vorherFokus?.isConnected) vorherFokus.focus({ preventScroll: true });
      return;
    }
    pilleStand();
    const pille = document.getElementById('zm-pille');
    if (!pille) { feld.remove(); return; }
    if (ruhig() || typeof RedionSpring === 'undefined') { feld.remove(); pille.hidden = false; }
    else zusammenziehen(feld, pille);
    if (fokusDrin) pille.focus({ preventScroll: true });
  };

  /** Das Feld öffnen oder schliessen. Die Uhr läuft unabhängig davon
   *  weiter — schliessen heisst „aus dem Blick", nicht „aus". */
  const panel = (): void => {
    if (document.querySelector('.zm-feld')) { schliessen(); return; }
    oeffnen(false);
  };

  return { panel, start, pause, stopp, stand, wiederaufnehmen };
})();

(window as any).Zeitmesser = Zeitmesser;
