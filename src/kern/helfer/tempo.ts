/* ============================================================================
 * tempo.js — Schnell bleiben, auch bei vielen Zeilen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/tempo.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/helfer/tempo.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion wird bei grossen Datenbanken spürbar zäh, und man erfährt nie,
 * woran es liegt. Hier stehen drei Antworten darauf:
 *
 *   1. FORMELSPEICHER — jede Formel wird je Zeile einmal gerechnet und
 *      gemerkt, bis sich an den Daten etwas ändert. Bei 500 Zeilen mit
 *      fünf Formeln sind das statt 2500 Rechnungen je Neuzeichnen null.
 *
 *   2. FENSTERWEISES ZEICHNEN — von einer langen Tabelle stehen nur die
 *      Zeilen im Dokument, die man sehen kann. Der Rest ist Platzhalter.
 *
 *   3. MESSUNG — eine Anzeige, die sagt, wie lange das Zeichnen gedauert
 *      hat, wie viele Formeln gerechnet wurden und welche die teuersten
 *      sind. Notion zeigt so etwas nirgends.
 * ==========================================================================*/

const Tempo = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ========================================================================
   * 1. FORMELSPEICHER
   * ------------------------------------------------------------------------
   * Der Schlüssel ist Zeile + Spalte. Gültig bleibt der Eintrag, solange
   * sich am Bestand nichts geändert hat: jede Schreiboperation zählt einen
   * Takt hoch, und ein Eintrag aus einem älteren Takt wird verworfen.
   * ======================================================================*/
  let takt = 0;
  let speicher = new Map<string, { takt: number; wert: unknown }>();
  const zahlen = { treffer: 0, fehlschlag: 0, zeit: 0, gerechnet: 0 };
  const teuer = new Map<string, { name: string; db: string; ms: number; anzahl: number }>();     /* key -> { name, ms, anzahl } */
  let an = true;

  const veraendert = () => { takt++; speicher.clear(); };

  const hole = (row: any, key: string, coll: any, rechne: () => unknown): unknown => {
    if (!an) return messen(row, key, coll, rechne);
    const k = row.id + '|' + key;
    const e = speicher.get(k);
    if (e && e.takt === takt) { zahlen.treffer++; return e.wert; }
    zahlen.fehlschlag++;
    const wert = messen(row, key, coll, rechne);
    speicher.set(k, { takt, wert });
    return wert;
  };

  const messen = (_row: any, key: string, coll: any, rechne: () => unknown): unknown => {
    const t0 = performance.now();
    const w = rechne();
    const ms = performance.now() - t0;
    zahlen.zeit += ms;
    zahlen.gerechnet++;
    const tk = coll.id + '|' + key;
    const alt = teuer.get(tk) || { name: (coll.schema[key] || {}).name || key,
                                   db: coll.name || 'Datenbank', ms: 0, anzahl: 0 };
    alt.ms += ms; alt.anzahl++;
    teuer.set(tk, alt);
    return w;
  };

  const leeren = () => { speicher.clear(); teuer.clear();
                         zahlen.treffer = zahlen.fehlschlag = zahlen.zeit = zahlen.gerechnet = 0; };

  /* ========================================================================
   * 2. ZEICHENDAUER
   * ======================================================================*/
  const dauer = { seite: 0, zeilen: 0, wann: 0 };

  const misstSeite = <T,>(fn: () => T): T => {
    const t0 = performance.now();
    const r = fn();
    dauer.seite = performance.now() - t0;
    dauer.wann = Date.now();
    anzeigeAuffrischen();
    return r;
  };

  /* ========================================================================
   * 3. FENSTERWEISES ZEICHNEN
   * ------------------------------------------------------------------------
   * Für eine Tabelle: alle Zeilen über der Schwelle werden ausgeblendet und
   * erst eingeblendet, wenn man in ihre Nähe scrollt. Das Dokument bleibt
   * damit klein, ohne dass etwas fehlt — Suchen im Browser findet die
   * versteckten Zeilen zwar nicht, dafür bleibt das Scrollen flüssig.
   * ======================================================================*/
  const SCHWELLE = () => Number(Store.getMeta('tempoSchwelle', 120)) || 120;

  const fensterweise = (tabelle: HTMLTableElement, scroller?: HTMLElement | null): (() => void) | undefined => {
    const koerper = tabelle.tBodies && tabelle.tBodies[0];
    if (!koerper) return;
    const zeilen = [...koerper.rows];
    if (zeilen.length < SCHWELLE()) return;
    if (Store.getMeta('tempoFenster', true) === false) return;

    const hoehe = 34;
    const puffer = 25;
    const kasten = scroller || document.getElementById('scroll') || document.documentElement;

    /* Damit die Bildlaufleiste stimmt: eine Zeile, die den Rest ausfüllt. */
    const oben = document.createElement('tr');
    oben.className = 'vs-luft';
    const unten = document.createElement('tr');
    unten.className = 'vs-luft';
    const zelleOben = document.createElement('td');
    const zelleUnten = document.createElement('td');
    const spalten = zeilen[0] ? zeilen[0].cells.length : 1;
    zelleOben.colSpan = spalten; zelleUnten.colSpan = spalten;
    oben.appendChild(zelleOben); unten.appendChild(zelleUnten);
    koerper.insertBefore(oben, koerper.firstChild);
    koerper.appendChild(unten);

    let vonAlt = -1, bisAlt = -1;
    const zeichne = () => {
      if (!document.body.contains(tabelle)) {
        kasten.removeEventListener('scroll', zeichne);
        return;
      }
      const k = tabelle.getBoundingClientRect();
      const sicht = kasten.clientHeight || innerHeight;
      const oberkante = Math.max(0, -k.top);
      const von = Math.max(0, Math.floor(oberkante / hoehe) - puffer);
      const bis = Math.min(zeilen.length, Math.ceil((oberkante + sicht) / hoehe) + puffer);
      if (von === vonAlt && bis === bisAlt) return;
      vonAlt = von; bisAlt = bis;
      zeilen.forEach((z, i) => {
        const zeigen = i >= von && i < bis;
        if (zeigen === (z.style.display !== 'none')) return;
        z.style.display = zeigen ? '' : 'none';
      });
      zelleOben.style.height = (von * hoehe) + 'px';
      zelleUnten.style.height = Math.max(0, (zeilen.length - bis) * hoehe) + 'px';
      dauer.zeilen = bis - von;
      anzeigeAuffrischen();
    };
    kasten.addEventListener('scroll', zeichne, { passive: true });
    zeichne();
    return zeichne;
  };

  /* ========================================================================
   * 4. SUCHREGISTER
   * ------------------------------------------------------------------------
   * Ein Wörterbuch von Wort auf Blockliste. Es wird beim ersten Suchen
   * gebaut und bei Änderungen verworfen — für ein paar tausend Blöcke ist
   * das in wenigen Millisekunden erledigt und danach ist jede Suche sofort da.
   * ======================================================================*/
  let register: Map<string, string[]> | null = null, registerTakt = -1;

  const bauen = () => {
    const t0 = performance.now();
    const r = new Map<string, string[]>();
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (b.alive === false) return;
      const text = String(b.text || '').toLowerCase();
      if (!text) return;
      new Set(text.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1)).forEach(w => {
        const liste = r.get(w) ?? [];
        r.set(w, liste);
        liste.push(b.id);
      });
    });
    register = r;
    registerTakt = takt;
    return { woerter: r.size, ms: performance.now() - t0 };
  };

  /** Alle Blöcke, deren Text dieses Wort enthält — über das Register. */
  const finde = (wort: unknown): string[] => {
    if (!register || registerTakt !== takt) bauen();
    /* `bauen()` setzt `register` — aber das steht in einer anderen Funktion,
       und TypeScript folgt dorthin nicht. Die Zeile schreibt hin, was ohnehin
       gilt, statt es anzunehmen. */
    const reg = register;
    if (!reg) return [];
    const w = String(wort || '').toLowerCase();
    if (w.length < 2) return [];
    /* Genaue Treffer zuerst, dann Wörter, die so anfangen. */
    const raus = new Set(reg.get(w) || []);
    if (raus.size < 200) {
      for (const [k, ids] of reg) {
        if (k !== w && k.startsWith(w)) ids.forEach((i: any) => raus.add(i));
        if (raus.size > 400) break;
      }
    }
    return [...raus];
  };

  /* ========================================================================
   * 5. ANZEIGE
   * ======================================================================*/
  const anzeigeAuffrischen = (): void => {
    const el = document.getElementById('tempo-anzeige');
    if (!el) return;
    const q = zahlen.treffer + zahlen.fehlschlag;
    el.innerHTML =
      `<b>${dauer.seite.toFixed(0)} ms</b> zeichnen · ` +
      `${zahlen.gerechnet} Formeln (${zahlen.zeit.toFixed(0)} ms) · ` +
      (q ? Math.round(zahlen.treffer / q * 100) : 0) + ' % aus dem Speicher' +
      (dauer.zeilen ? ` · ${dauer.zeilen} Zeilen sichtbar` : '');
  };

  const anzeigeAn = (zeigen: unknown): void => {
    document.getElementById('tempo-anzeige')?.remove();
    if (!zeigen) { Store.setMeta('tempoAnzeige', false); return; }
    Store.setMeta('tempoAnzeige', true);
    const d = document.createElement('div');
    d.id = 'tempo-anzeige';
    d.title = 'Klicken öffnet die Einzelheiten';
    d.addEventListener('click', () => dialog());
    document.body.appendChild(d);
    anzeigeAuffrischen();
  };

  const dialog = () => {
    const liste = [...teuer.values()].sort((a, b) => b.ms - a.ms).slice(0, 12);
    const q = zahlen.treffer + zahlen.fehlschlag;
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(660px,94vw)">' +
        '<div class="fh">⏱ Tempo<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="tp-koerper">' +
          '<div class="tp-karten">' +
            `<div class="tp-k"><b>${dauer.seite.toFixed(0)} ms</b><span>letztes Zeichnen</span></div>` +
            `<div class="tp-k"><b>${zahlen.gerechnet}</b><span>gerechnete Formeln</span></div>` +
            `<div class="tp-k"><b>${q ? Math.round(zahlen.treffer / q * 100) : 0} %</b>` +
              '<span>aus dem Speicher</span></div>' +
            `<div class="tp-k"><b>${Object.keys(Store.cache.blocks).length}</b><span>Blöcke</span></div>` +
          '</div>' +
          '<div class="tp-titel">Die teuersten Formeln</div>' +
          (liste.length
            ? '<div class="tp-liste">' + liste.map(x =>
                `<div class="tp-z"><span>${esc(x.db)} · ${esc(x.name)}</span>` +
                `<span class="tp-ms">${x.ms.toFixed(1)} ms</span>` +
                `<span class="tp-n">${x.anzahl}×</span></div>`).join('') + '</div>'
            : '<div class="pf-gut">Noch keine Formel gerechnet.</div>') +
          '<div class="tp-titel">Einstellungen</div>' +
          '<label class="tp-schalter"><input type="checkbox" id="tp-cache"' +
            (an ? ' checked' : '') + '> Formelspeicher benutzen</label>' +
          '<label class="tp-schalter"><input type="checkbox" id="tp-fenster"' +
            (Store.getMeta('tempoFenster', true) !== false ? ' checked' : '') +
            '> Lange Tabellen fensterweise zeichnen</label>' +
          '<label class="tp-schalter"><input type="checkbox" id="tp-anzeige"' +
            (Store.getMeta('tempoAnzeige', false) ? ' checked' : '') +
            '> Anzeige unten rechts einblenden</label>' +
          '<div class="tp-hinweis">Ab wie vielen Zeilen fensterweise gezeichnet wird: ' +
            `<input type="number" id="tp-schwelle" value="${SCHWELLE()}" min="40" step="20">` +
          '</div>' +
        '</div>' +
        '<div class="fbtns">' +
          '<button data-a="leeren">Zähler zurücksetzen</button>' +
          '<button data-a="zu" class="prim">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('change', e => {
      const feld = e.target instanceof HTMLInputElement ? e.target : null;
      if (!feld) return;
      if (feld.id === 'tp-cache')   { an = feld.checked; Store.setMeta('tempoCache', an); speicher.clear(); }
      if (feld.id === 'tp-fenster') Store.setMeta('tempoFenster', feld.checked);
      if (feld.id === 'tp-anzeige') anzeigeAn(feld.checked);
      if (feld.id === 'tp-schwelle') Store.setMeta('tempoSchwelle', +feld.value || 120);
    });
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="leeren"]')) { leeren(); o.remove(); dialog(); }
    });
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  /* Jede Schreiboperation macht den Speicher ungültig. Store meldet nicht
     jede einzelne, deshalb legen wir uns um die Schreibfunktionen herum. */
  const SCHREIBER = ['setProp', 'updateBlock', 'addBlock', 'addRow', 'trashBlock',
                     'restoreBlock', 'purgeBlock', 'updateCollection', 'updateView',
                     'addDatabase', 'addView', 'removeView', 'baumEinfuegen',
                     'kinderLeeren', 'addPage', 'importAll'];

  const start = () => {
    an = Store.getMeta('tempoCache', true) !== false;
    SCHREIBER.forEach(n => {
      const alt = (Store as Record<string, any>)[n];
      if (typeof alt !== 'function' || alt.__tempo) return;
      const neu: any = (...a: unknown[]) => { const r = alt(...a); veraendert(); return r; };
      neu.__tempo = true;
      (Store as Record<string, any>)[n] = neu;
    });
    Store.on(() => veraendert());
    if (Store.getMeta('tempoAnzeige', false)) anzeigeAn(true);
  };

  return { start, hole, veraendert, leeren, zahlen, teuer, dauer, misstSeite,
           fensterweise, bauen, finde, dialog, anzeigeAn,
           speicherGroesse: () => speicher.size, cacheAn: () => an,
           cacheSetzen: (v: unknown) => { an = !!v; speicher.clear(); } };
})();

(window as any).Tempo = Tempo;
