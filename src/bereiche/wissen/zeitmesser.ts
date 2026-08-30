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
    vergangenSek: number;      /* aufgelaufen über Pausen hinweg */
    zuletzt: number;           /* letzter Tick, für die Differenz */
    pausiert: boolean;
    seiteId: string;
    seitenName: string;
  };
  let lauf: Lauf | null = null;
  let ticker: number | null = null;

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
    if (!lauf.pausiert) lauf.vergangenSek += (jetzt - lauf.zuletzt) / 1000;
    lauf.zuletzt = jetzt;
    if (lauf.art === 'timer' && lauf.sollSek - lauf.vergangenSek <= 0) {
      const name = lauf.seitenName;
      const minuten = Math.round(lauf.sollSek / 60);
      merken();
      lauf = null;
      UI.toast(`⏰ Zeit um — ${minuten} Min an „${name}".`);
    }
    zeichneStand();
    if (!lauf && ticker !== null) { clearInterval(ticker); ticker = null; }
  };

  const start = (art: 'stoppuhr' | 'timer' = 'stoppuhr', sollSek = 0): void => {
    if (lauf) merken();
    const wo = seiteJetzt();
    lauf = { art, beginn: Date.now(), sollSek: art === 'timer' ? Math.max(1, sollSek) : 0,
      vergangenSek: 0, zuletzt: Date.now(), pausiert: false,
      seiteId: wo.id, seitenName: wo.name };
    if (ticker === null) ticker = window.setInterval(tick, 500);
    zeichneStand();
  };

  const pause = (): void => {
    if (!lauf) return;
    lauf.pausiert = !lauf.pausiert;
    lauf.zuletzt = Date.now();
    zeichneStand();
  };

  const stopp = (): void => {
    if (!lauf) return;
    merken();
    lauf = null;
    if (ticker !== null) { clearInterval(ticker); ticker = null; }
    zeichneStand();
  };

  const stand = () => ({
    laeuft: !!lauf, pausiert: !!lauf?.pausiert,
    art: lauf?.art || '', sekunden: lauf ? Math.round(restSek()) : 0,
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
          (s.pausiert ? ' · pausiert' : '')
        : 'Misst die Zeit an der offenen Seite.'}</p>` +
      `<div class="zm-reihe">` +
      `<button class="rb" data-zm="stoppuhr">Stoppuhr</button>` +
      `<button class="rb" data-zm="t5">5 Min</button>` +
      `<button class="rb" data-zm="t25">25 Min</button>` +
      `</div>` +
      `<div class="zm-reihe">` +
      (s.laeuft
        ? `<button class="rb" data-zm="pause">${s.pausiert ? 'Weiter' : 'Pause'}</button>` +
          `<button class="rb" data-zm="stopp">Beenden</button>`
        : `<button class="rb haupt" data-zm="stoppuhr">Start</button>`) +
      `</div>` +
      (liste ? `<div class="zm-sitzungen"><span>Zuletzt</span><ul>${liste}</ul></div>` : '');
  };

  const zeichneStand = (): void => {
    const feld = document.querySelector<HTMLElement>('.zm-feld');
    if (!feld) return;
    feld.innerHTML = feldHtml();
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

  return { panel, start, pause, stopp, stand };
})();

(window as any).Zeitmesser = Zeitmesser;
