/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/wissen/zeitmesser.ts (npm run bauen:ts). */
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
   * Das schwebende Feld
   * ------------------------------------------------------------------ */

  const feldHtml = (): string => {
    const s = stand();
    const liste = sitzungen().slice(0, 3).map(z =>
      `<li>${esc(uhrText(z.dauerSek))} · ${esc(z.seitenName || 'Ohne Seite')}` +
      `${z.art === 'timer' ? ' <i>(Timer)</i>' : ''}</li>`).join('');
    return `<div class="zm-kopf"><b>Zeitmesser</b>` +
      `<button class="rb zeichen" data-zm="zu" aria-label="Schliessen">✕</button></div>` +
      `<div class="zm-uhr" aria-live="off">${uhrText(s.sekunden)}</div>` +
      `<p class="zm-wo">${s.laeuft
        ? (s.art === 'timer' ? 'Timer' : 'Stoppuhr') + ' · ' + esc(s.seite) +
          (s.pausiert ? ' · pausiert' : '') +
          (s.uebersprungenSek >= 60 ? ' · ' + esc(uhrText(s.uebersprungenSek)) + ' Schlaf nicht gezählt' : '')
        : 'Misst die Zeit an der offenen Seite.'}</p>` +
      `<div class="zm-reihe">` +
      `<button class="rb" data-zm="stoppuhr">Stoppuhr</button>` +
      `<button class="rb" data-zm="t5">5 Min</button>` +
      `<button class="rb" data-zm="t25">25 Min</button>` +
      `</div>` +
      /* `data-rmo-taste` ist rein für die Darstellung da (E535): der
         mechanische Dreierblock braucht je Taste eine Rolle, und `data-zm`
         taugt dafür nicht — dort heisst die Starttaste „stoppuhr" wie der
         Knopf eine Reihe höher. Der Klick liest weiterhin nur `data-zm`. */
      `<div class="zm-reihe rmo-transport" role="group" aria-label="Zeit steuern" data-zustand="${s.laeuft ? (s.pausiert ? 'pausiert' : 'laeuft') : 'bereit'}">` +
      `<button class="rb haupt" data-rmo-taste="start" data-zm="stoppuhr" ${s.laeuft ? 'disabled' : ''}>Start</button>` +
      `<button class="rb" data-rmo-taste="pause" data-zm="pause" ${s.laeuft ? '' : 'disabled'}>${s.pausiert ? 'Weiter' : 'Pause'}</button>` +
      `<button class="rb" data-rmo-taste="stopp" data-zm="stopp" ${s.laeuft ? '' : 'disabled'}>Beenden</button>` +
      `</div>` +
      (liste ? `<div class="zm-sitzungen"><span>Zuletzt</span><ul>${liste}</ul></div>` : '');
  };

  const zeichneStand = (): void => {
    const feld = document.querySelector<HTMLElement>('.zm-feld');
    if (!feld) return;
    /* Beim Tick bleiben die Tasten samt Fokus erhalten. Nur ein echter
       Zustandswechsel zeichnet die Steuerung neu. */
    const next = document.createElement('div');
    next.innerHTML = feldHtml();
    const currentState = feld.querySelector('.rmo-transport')?.getAttribute('data-zustand');
    const nextState = next.querySelector('.rmo-transport')?.getAttribute('data-zustand');
    if (currentState === nextState) {
      for (const selector of ['.zm-uhr', '.zm-wo']) {
        const target = feld.querySelector(selector);
        const text = next.querySelector(selector)?.textContent || '';
        if (target && target.textContent !== text) target.textContent = text;
      }
      return;
    }
    const focused = feld.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).dataset.zm : undefined;
    feld.replaceChildren(...Array.from(next.childNodes));
    if (focused) feld.querySelector<HTMLButtonElement>(`.rmo-transport [data-zm="${focused}"]:not(:disabled)`)?.focus();
  };

  /** Das Feld öffnen oder schliessen. Die Uhr läuft unabhängig davon
   *  weiter — schliessen heisst „aus dem Blick", nicht „aus". */
  const panel = (): void => {
    const offen = document.querySelector<HTMLElement>('.zm-feld');
    if (offen) { offen.remove(); return; }
    const feld = document.createElement('div');
    feld.className = 'zm-feld';
    feld.setAttribute('role', 'dialog');
    feld.setAttribute('aria-label', 'Zeitmesser');
    /* Escape schliesst es — über den EINEN gemeinsamen Griff der Schale
       (E302, E710), nicht über einen eigenen. Das Feld ist kein `.overlay`:
       es bleibt beim Arbeiten offen und legt nichts still. */
    feld.setAttribute('data-esc-schliesst', '');
    feld.innerHTML = feldHtml();
    feld.addEventListener('click', e => {
      const b = (e.target as Element).closest<HTMLElement>('[data-zm]');
      if (!b) return;
      const was = b.dataset['zm'];
      if (was === 'zu') { feld.remove(); return; }
      if (was === 'stoppuhr') return start('stoppuhr');
      if (was === 't5') return start('timer', 5 * 60);
      if (was === 't25') return start('timer', 25 * 60);
      if (was === 'pause') return pause();
      if (was === 'stopp') return stopp();
    });
    document.body.appendChild(feld);
  };

  return { panel, start, pause, stopp, stand, wiederaufnehmen };
})();

(window as any).Zeitmesser = Zeitmesser;
