/* ============================================================================
 * plan.js — Später erinnern, Woche zurückblicken, Tag planen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/planen/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/planen/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Drei Dinge, die man in Notion von Hand nachbauen muss:
 *
 *   ZURÜCKSTELLEN — eine Seite oder Zeile für eine Weile aus dem Weg legen
 *     und zur richtigen Zeit wieder hochkommen lassen. Notion kennt nur
 *     Erinnerungen an einem Datum, kein „in drei Tagen wieder zeigen".
 *
 *   WOCHENRÜCKBLICK — was wurde erledigt, was ist liegengeblieben, was
 *     kommt. Notion hat dafür nur leere Vorlagen.
 *
 *   TAGESPLAN — die Aufgaben von heute, nach Zeit sortiert, mit einer
 *     ehrlichen Rechnung: passt das in den Tag?
 * ==========================================================================*/

const Plan = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const tagText = (d: unknown): string => new Date(d as any).toLocaleDateString('de-DE',
    { weekday: 'short', day: '2-digit', month: 'short' });
  const iso = (d: Date): string => {
    const x = new Date(d);
    const p = (n: number): string => String(n).padStart(2, '0');
    return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate());
  };
  const heute = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

  /* ========================================================================
   * 1. ZURÜCKSTELLEN
   * ======================================================================*/
  const FRISTEN: [string, string, () => Date][] = [
    ['spaeter',   'Später heute',   () => { const d = new Date(); d.setHours(d.getHours() + 3); return d; }],
    ['morgen',    'Morgen früh',    () => { const d = heute(); d.setDate(d.getDate() + 1); d.setHours(9); return d; }],
    ['uebermorgen','Übermorgen',    () => { const d = heute(); d.setDate(d.getDate() + 2); d.setHours(9); return d; }],
    ['woche',     'Nächste Woche',  () => { const d = heute(); d.setDate(d.getDate() + (8 - (d.getDay() || 7))); d.setHours(9); return d; }],
    ['zweiwochen','In zwei Wochen', () => { const d = heute(); d.setDate(d.getDate() + 14); d.setHours(9); return d; }],
    ['monat',     'Nächsten Monat', () => { const d = heute(); d.setMonth(d.getMonth() + 1); d.setDate(1); d.setHours(9); return d; }],
    ['quartal',   'In drei Monaten', () => { const d = heute(); d.setMonth(d.getMonth() + 3); d.setHours(9); return d; }]
  ];

  const liste = (): any[] => Store.getMeta('zurueckgestellt', []) || [];

  const zurueckstellen = (blockId: string, bis: string | Date, grund?: string): any => {
    const l = liste().filter((x: any) => x.id !== blockId);
    l.push({ id: blockId, bis: new Date(bis).toISOString(), grund: grund || '',
             seit: new Date().toISOString() });
    Store.setMeta('zurueckgestellt', l);
    Store.updateBlock(blockId, { zurueckBis: new Date(bis).toISOString() });
    App.zeichneBaum();
  };

  const holen = (blockId: string): any => {
    Store.setMeta('zurueckgestellt', liste().filter((x: any) => x.id !== blockId));
    Store.updateBlock(blockId, { zurueckBis: null });
    App.zeichneBaum();
  };

  /** Was ist jetzt wieder fällig? Wird beim Start und stündlich geprüft. */
  const faellige = (): any[] => {
    const jetzt = Date.now();
    return liste().filter((x: any) => new Date(x.bis).getTime() <= jetzt && Store.getBlock(x.id));
  };

  const pruefen = (): number => {
    const f = faellige();
    if (!f.length) return 0;
    f.forEach((x: any) => {
      Store.updateBlock(x.id, { zurueckBis: null });
      const b = Store.getBlock(x.id);
      /* `posteingangMelden` nimmt EIN Objekt, keine zwei Werte. Vorher stand
         hier ein Text und daneben die Kennung — `m.text` war damit
         `undefined`, und im Posteingang erschien eine leere Zeile ohne
         Hinweis darauf, welche Seite zurückkam. */
      if (typeof Werkzeuge !== 'undefined' && Werkzeuge.posteingangMelden)
        Werkzeuge.posteingangMelden({
          text: '⏰ Wieder da: ' + ((b && b.text) || 'Ohne Titel'),
          seite: x.id, art: 'hinweis' });
    });
    Store.setMeta('zurueckgestellt', liste().filter((x: any) => !f.some((y: any) => y.id === x.id)));
    UI.toast(f.length + (f.length === 1 ? ' zurückgestellte Seite ist wieder da'
                                        : ' zurückgestellte Seiten sind wieder da'));
    App.zeichneBaum();
    return f.length;
  };

  const menue = (anker: Element, blockId: string): void => {
    const r = anker.getBoundingClientRect();
    const schon = liste().find((x: any) => x.id === blockId);
    const m = UI.menu(
      '<div class="grp">Wann soll es wieder hochkommen?</div>' +
      FRISTEN.map(([id, n, fn]) =>
        `<button data-f="${id}"><span class="mi">⏰</span>${n}` +
        `<span class="ms">${tagText(fn())}</span></button>`).join('') +
      '<hr><button data-f="datum"><span class="mi">📅</span>Ein bestimmtes Datum …</button>' +
      (schon ? '<hr><button data-f="holen"><span class="mi">↩</span>Jetzt wieder holen<span class="ms">' +
               tagText(schon.bis) + '</span></button>' : ''),
      r.left, r.bottom + 4);

    m.addEventListener('click', async e => {
      const b = elVon(e)?.closest<HTMLElement>('[data-f]');
      if (!b) return;
      m.remove();
      if (b.dataset["f"] === 'holen') { holen(blockId); UI.toast('Wieder da'); return; }
      if (b.dataset["f"] === 'datum') {
        const t = await UI.frage('An welchem Tag? (JJJJ-MM-TT)', iso(new Date(Date.now() + 86400000)));
        if (!t) return;
        const d = new Date(t + 'T09:00');
        if (isNaN(d.getTime())) { UI.toast('Das ist kein Datum'); return; }
        zurueckstellen(blockId, d);
        UI.toast('Zurückgestellt bis ' + tagText(d));
        return;
      }
      const f = FRISTEN.find(x => x[0] === b.dataset["f"]);
      if (!f) return;
      zurueckstellen(blockId, f[2]());
      UI.toast('Zurückgestellt bis ' + tagText(f[2]()));
    });
  };

  const uebersicht = (): void => {
    const l = liste().filter((x: any) => Store.getBlock(x.id))
      .sort((a: any, b: any) => a.bis.localeCompare(b.bis));
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(600px,94vw)">' +
        `<div class="fh">⏰ Zurückgestellt <em>${l.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res">' + (l.length ? l.map((x: any) => {
          const b = Store.getBlock(x.id);
          const faellig = new Date(x.bis) <= new Date();
          return `<button data-id="${x.id}">` +
            `<span>${esc(b.icon || '📄')}</span>` +
            `<span style="flex:1">${esc(b.text || 'Ohne Titel')}` +
            `<span class="snip">${faellig ? 'jetzt fällig' : 'bis ' + tagText(x.bis)}</span></span>` +
            `<span class="pth" data-holen="${x.id}">jetzt holen</span></button>`;
        }).join('') : '<div class="pf-gut">Nichts zurückgestellt.</div>') + '</div>' +
        '<div class="fbtns"><button data-a="zu" class="prim">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const h = elVon(e)?.closest<HTMLElement>('[data-holen]');
      if (h?.dataset["holen"]) { holen(h.dataset["holen"]); o.remove(); uebersicht(); return; }
      const b = elVon(e)?.closest<HTMLElement>('[data-id]');
      if (b) { o.remove(); App.oeffne(b.dataset["id"]); }
    });
  };

  /* ========================================================================
   * 2. AUFGABEN EINSAMMELN
   * ------------------------------------------------------------------------
   * Alles, was nach einer Aufgabe aussieht: Kontrollkästchen-Blöcke und
   * Datenbankzeilen mit einer Status- oder Kontrollkästchen-Spalte.
   * ======================================================================*/
  const aufgaben = (): any[] => {
    const raus: any[] = [];

    /* Aufgabenblöcke auf Seiten */
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (b.alive === false || b.type !== 'todo') return;
      if (!(b.text || '').trim()) return;
      const seite = Store.getBlock(b.parentId);
      raus.push({ id: b.id, text: b.text, fertig: !!b.checked,
                  wo: seite ? (seite.text || 'Ohne Titel') : '', datum: null,
                  art: 'block', erledigtAm: b.erledigtAm || null });
    });

    /* Datenbankzeilen */
    Object.values<any>(Store.cache.collections).forEach(c => {
      const keys = Object.keys(c.schema);
      const statusKey = keys.find(k => c.schema[k].type === 'status') ||
                        keys.find(k => c.schema[k].type === 'select' &&
                          (c.schema[k].options || []).some((o: any) => /erledigt|fertig|done/i.test(o.name)));
      const hakenKey  = keys.find(k => c.schema[k].type === 'checkbox');
      const datumKey  = keys.find(k => c.schema[k].type === 'date');
      if (!statusKey && !hakenKey) return;
      Store.rowsOf(c.id).forEach((r: any) => {
        if (r.archiviert) return;
        const wert = statusKey ? String(Datenbank.wert(r, statusKey, c) || '') : '';
        const fertig = hakenKey ? !!Datenbank.wert(r, hakenKey, c)
                                : /erledigt|fertig|done|abgeschlossen/i.test(wert);
        raus.push({ id: r.id, text: r.text || 'Ohne Titel', fertig,
                    wo: c.name || 'Datenbank',
                    datum: datumKey ? Datenbank.wert(r, datumKey, c) : null,
                    art: 'zeile', status: wert, erledigtAm: r.erledigtAm || r.edited });
      });
    });
    return raus;
  };

  /* ========================================================================
   * 3. WOCHENRÜCKBLICK
   * ======================================================================*/
  const wochenDaten = (versatz = 0): any => {
    const start = heute();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7) + versatz * 7);
    const ende = new Date(start); ende.setDate(start.getDate() + 7);

    const alle = aufgaben();
    const inWoche = (d: unknown): boolean => { const x = new Date(d as any); return !isNaN(x.getTime()) && x >= start && x < ende; };

    const erledigt = alle.filter(a => a.fertig && a.erledigtAm && inWoche(a.erledigtAm));
    const offen    = alle.filter(a => !a.fertig);
    const ueberfaellig = offen.filter(a => a.datum && new Date(a.datum) < heute());
    const dieseWoche   = offen.filter(a => a.datum && inWoche(a.datum));

    /* Was wurde geschrieben? */
    const geaendert = Object.values<any>(Store.cache.blocks).filter(b =>
      b.alive !== false && b.type === 'page' && b.edited && inWoche(b.edited));
    const neu = Object.values<any>(Store.cache.blocks).filter(b =>
      b.alive !== false && b.type === 'page' && b.created && inWoche(b.created));

    /* Je Tag: wie viel wurde erledigt? */
    const proTag = Array.from({ length: 7 }, (_, i) => {
      const t = new Date(start); t.setDate(start.getDate() + i);
      return { tag: t,
               anzahl: erledigt.filter(a =>
                 new Date(a.erledigtAm).toDateString() === t.toDateString()).length };
    });

    return { start, ende, erledigt, offen, ueberfaellig, dieseWoche, geaendert, neu, proTag };
  };

  const wochenrueckblick = (versatz = 0): void => {
    const d = wochenDaten(versatz);
    const hoechst = Math.max(1, ...d.proTag.map((t: any) => t.anzahl));
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">📅 Wochenrückblick' +
          `<span class="wr-zeit">${tagText(d.start)} – ${tagText(new Date(d.ende - 86400000))}</span>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="wr-leiste">' +
          '<button data-v="-1">‹ Woche davor</button>' +
          '<button data-v="0">Diese Woche</button>' +
          `<button data-v="1"${versatz >= 0 ? ' disabled' : ''}>Woche danach ›</button>` +
        '</div>' +
        '<div class="wr-koerper">' +
          '<div class="wr-karten">' +
            `<div class="wr-k gut"><b>${d.erledigt.length}</b><span>erledigt</span></div>` +
            `<div class="wr-k"><b>${d.dieseWoche.length}</b><span>diese Woche fällig</span></div>` +
            `<div class="wr-k${d.ueberfaellig.length ? ' schlecht' : ''}">` +
              `<b>${d.ueberfaellig.length}</b><span>überfällig</span></div>` +
            `<div class="wr-k"><b>${d.neu.length}</b><span>neue Seiten</span></div>` +
          '</div>' +
          '<div class="wr-titel">Erledigt je Tag</div>' +
          '<div class="wr-balken">' + d.proTag.map((t: any) =>
            `<div class="wr-b"><i style="height:${Math.round(t.anzahl / hoechst * 56)}px" ` +
            `title="${t.anzahl}"></i><span>${t.tag.toLocaleDateString('de-DE', { weekday: 'short' })}</span>` +
            `<em>${t.anzahl || ''}</em></div>`).join('') + '</div>' +
          (d.ueberfaellig.length
            ? '<div class="wr-titel">Liegengeblieben — das zuerst</div>' +
              '<div class="wr-liste">' + d.ueberfaellig.slice(0, 10).map((a: any) =>
                `<div class="wr-z" data-id="${a.id}"><span class="wr-p">⚠</span>` +
                `<span>${esc(a.text)}</span><span class="wr-wo">${esc(a.wo)}</span>` +
                `<span class="wr-d">${a.datum ? tagText(a.datum) : ''}</span></div>`).join('') + '</div>'
            : '') +
          (d.erledigt.length
            ? '<div class="wr-titel">Geschafft</div>' +
              '<div class="wr-liste">' + d.erledigt.slice(0, 12).map((a: any) =>
                `<div class="wr-z" data-id="${a.id}"><span class="wr-p gut">✓</span>` +
                `<span>${esc(a.text)}</span><span class="wr-wo">${esc(a.wo)}</span></div>`).join('') + '</div>'
            : '<div class="pf-gut">In dieser Woche wurde noch nichts abgehakt.</div>') +
          (d.geaendert.length
            ? '<div class="wr-titel">Woran gearbeitet wurde</div>' +
              '<div class="wr-liste">' + d.geaendert.slice(0, 10).map((b: any) =>
                `<div class="wr-z" data-id="${b.id}"><span class="wr-p">${esc(b.icon || '📄')}</span>` +
                `<span>${esc(b.text || 'Ohne Titel')}</span>` +
                `<span class="wr-d">${tagText(b.edited)}</span></div>`).join('') + '</div>'
            : '') +
        '</div>' +
        '<div class="fbtns">' +
          '<button data-a="seite">Als Seite anlegen</button>' +
          '<button data-a="zu" class="prim">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const v = elVon(e)?.closest<HTMLElement>('[data-v]');
      if (v) { o.remove(); wochenrueckblick(versatz + (+(v.dataset["v"] ?? 0) || -versatz)); return; }
      const z = elVon(e)?.closest<HTMLElement>('[data-id]');
      if (z) { o.remove(); App.oeffne(z.dataset["id"]); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="seite"]')) {
        const s = Store.addBlock(null, 'page',
          { text: 'Wochenrückblick ' + tagText(d.start), icon: '📅' });
        const md =
          `## Zahlen\n\n- Erledigt: ${d.erledigt.length}\n- Diese Woche fällig: ${d.dieseWoche.length}\n` +
          `- Überfällig: ${d.ueberfaellig.length}\n- Neue Seiten: ${d.neu.length}\n\n` +
          (d.ueberfaellig.length ? '## Liegengeblieben\n\n' +
            d.ueberfaellig.map((a: any) => `- [ ] ${a.text} (${a.wo})`).join('\n') + '\n\n' : '') +
          (d.erledigt.length ? '## Geschafft\n\n' +
            d.erledigt.map((a: any) => `- [x] ${a.text}`).join('\n') + '\n\n' : '') +
          '## Nächste Woche\n\n- [ ] \n';
        Werkzeuge.ausMarkdown(s, md);
        o.remove(); App.zeichneBaum(); App.oeffne(s.id);
      }
    });
  };

  /* ========================================================================
   * 4. TAGESPLAN
   * ======================================================================*/
  const tagesplan = (): void => {
    const alle = aufgaben().filter(a => !a.fertig);
    const heuteStr = heute().toDateString();
    const heutige = alle.filter(a => a.datum && new Date(a.datum).toDateString() === heuteStr);
    const spaet   = alle.filter(a => a.datum && new Date(a.datum) < heute());
    const ohne    = alle.filter(a => !a.datum);

    const geschaetzt = Store.getMeta('planDauer', 30);
    const minuten = (heutige.length + spaet.length) * geschaetzt;
    const stunden = Math.floor(minuten / 60), rest = minuten % 60;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(680px,94vw)">' +
        `<div class="fh">☀ Tagesplan<span class="wr-zeit">${tagText(new Date())}</span>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="wr-koerper">' +
          '<div class="wr-karten">' +
            `<div class="wr-k"><b>${heutige.length}</b><span>heute fällig</span></div>` +
            `<div class="wr-k${spaet.length ? ' schlecht' : ''}"><b>${spaet.length}</b>` +
              '<span>überfällig</span></div>' +
            `<div class="wr-k"><b>${stunden}h ${rest}m</b><span>grob geschätzt</span></div>` +
            `<div class="wr-k"><b>${ohne.length}</b><span>ohne Datum</span></div>` +
          '</div>' +
          (minuten > 8 * 60
            ? '<div class="pl-warnung">Das passt nicht in einen Arbeitstag. ' +
              'Etwas davon sollte zurückgestellt werden.</div>' : '') +
          (spaet.length
            ? '<div class="wr-titel">Überfällig</div><div class="wr-liste">' +
              spaet.map(a => zeileHtml(a, true)).join('') + '</div>' : '') +
          '<div class="wr-titel">Heute</div>' +
          (heutige.length
            ? '<div class="wr-liste">' + heutige.map(a => zeileHtml(a)).join('') + '</div>'
            : '<div class="pf-gut">Für heute steht nichts an.</div>') +
          (ohne.length
            ? '<div class="wr-titel">Ohne Datum — ' + ohne.length + ' Stück, die ersten zehn</div>' +
              '<div class="wr-liste">' + ohne.slice(0, 10).map(a => zeileHtml(a)).join('') + '</div>'
            : '') +
        '</div>' +
        '<div class="fbtns">' +
          `<span class="pl-dauer">Aufgabe dauert etwa <input type="number" id="pl-d" ` +
            `value="${geschaetzt}" min="5" step="5"> Minuten</span>` +
          '<button data-a="seite">Als Seite anlegen</button>' +
          '<button data-a="zu" class="prim">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('change', e => {
      const feld = e.target instanceof HTMLInputElement ? e.target : null;
      if (feld?.id === 'pl-d') { Store.setMeta('planDauer', +feld.value || 30);
                                    o.remove(); tagesplan(); }
    });
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const sp = elVon(e)?.closest<HTMLElement>('[data-spaeter]');
      if (sp?.dataset["spaeter"]) { menue(sp, sp.dataset["spaeter"]); return; }
      const z = elVon(e)?.closest<HTMLElement>('[data-id]');
      if (z) { o.remove(); App.oeffne(z.dataset["id"]); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="seite"]')) {
        const s = Store.addBlock(null, 'page', { text: 'Tagesplan ' + tagText(new Date()), icon: '☀' });
        Werkzeuge.ausMarkdown(s,
          '## Heute\n\n' + [...spaet, ...heutige].map(a => `- [ ] ${a.text}`).join('\n') +
          '\n\n## Wenn Zeit bleibt\n\n' + ohne.slice(0, 5).map(a => `- [ ] ${a.text}`).join('\n'));
        o.remove(); App.zeichneBaum(); App.oeffne(s.id);
      }
    });
  };

  const zeileHtml = (a: any, warnung?: boolean): string =>
    `<div class="wr-z" data-id="${a.id}">` +
    `<span class="wr-p${warnung ? '' : ''}">${warnung ? '⚠' : '☐'}</span>` +
    `<span>${esc(a.text)}</span>` +
    `<span class="wr-wo">${esc(a.wo)}</span>` +
    (a.datum ? `<span class="wr-d">${tagText(a.datum)}</span>` : '') +
    `<button class="wr-spaeter" data-spaeter="${a.id}" title="Zurückstellen">⏰</button>` +
    '</div>';

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = (): void => {
    setTimeout(pruefen, 2500);
    setInterval(pruefen, 60 * 60 * 1000);
  };

  return { start, zurueckstellen, holen, faellige, pruefen, menue, uebersicht,
           aufgaben, wochenDaten, wochenrueckblick, tagesplan, liste, FRISTEN };
})();

(window as any).Plan = Plan;
