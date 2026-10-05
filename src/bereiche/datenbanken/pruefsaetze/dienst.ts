/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/datenbanken/pruefsaetze/dienst.ts (npm run bauen:ts). */
/* ============================================================================
 * pruefsatz.js — Prüfsätze für Formeln und Automationen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/datenbanken/pruefsaetze/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/datenbanken/pruefsaetze/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Idee 20 der 10000×-Liste. Die Notion-KI nennt dort auch gleich den Grund,
 * warum es das nirgends gibt: *„Tests sind ein Softwarekonzept; es müsste so
 * einfach werden, dass normale Nutzer es verstehen."*
 *
 * Deshalb heisst hier nichts „Test", „Assertion" oder „Fixture". Ein
 * Prüfsatz ist ein Satz in zwei Hälften:
 *
 *      WENN  Betrag = 100 und Land = "CH"
 *      DANN  ist MwSt gleich 8.1
 *
 * Und der wichtigste Weg dorthin geht gar nicht über ein Formular: man nimmt
 * eine Zeile, bei der es **stimmt**, und sagt „so soll es bleiben". Daraus
 * baut Redion den Prüfsatz selbst. Wer nie ein Formular ausfüllen will, muss
 * es auch nicht.
 *
 * Was das bringt: eine Formel zu ändern ist billig, sie kaputtzumachen auch.
 * Der Unterschied fällt oft erst Wochen später auf, wenn eine Zahl komisch
 * aussieht. Ein Prüfsatz merkt es sofort — und der Probelauf (probelauf.js)
 * kann vor einer Änderung sagen, welche Sätze danach anders ausgingen.
 *
 * Nichts hier fasst echte Daten an. Geprüft wird immer an einer erfundenen
 * Zeile, die nur für den Augenblick der Prüfung existiert.
 * ==========================================================================*/

const Pruefsatz = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  const VERGLEICHE = [
    ['gleich',    'ist gleich'],
    ['ungleich',  'ist nicht'],
    ['enthaelt',  'enthält'],
    ['groesser',  'ist grösser als'],
    ['kleiner',   'ist kleiner als'],
    ['leer',      'ist leer'],
    ['fehler',    'gibt einen Fehler'],
    ['trifft',    'die Automation greift'],
    ['trifftNicht', 'die Automation greift nicht']
  ];

  const vergleichName = (v: any) => (VERGLEICHE.find(x => x[0] === v) || [v, v])[1];

  /* ========================================================================
   * 1 · SPEICHERN
   * ------------------------------------------------------------------------
   * Die Prüfsätze gehören zur Datenbank, nicht zur Ansicht: sie prüfen die
   * Regel, nicht die Brille. Damit wandern sie beim Abgleich mit und gelten
   * auf jedem Gerät.
   * ======================================================================*/

  const alle = (coll: any): any[] => (coll && coll.pruefsaetze) || [];

  const setzen = (coll: any, liste: any[]): any[] => {
    Store.updateCollection(coll.id, { pruefsaetze: liste });
    return liste;
  };

  const anlegen = (coll: any, satz: any): any => {
    const s = Object.assign({ id: Store.uid().slice(0, 8), name: '', art: 'formel',
                              spalte: '', gegeben: {}, vergleich: 'gleich', erwartet: '' }, satz);
    setzen(coll, [...alle(coll), s]);
    return s;
  };

  const loeschen = (coll: any, id: any) => setzen(coll, alle(coll).filter((s: any) => s.id !== id));

  /* ========================================================================
   * 2 · DIE ERFUNDENE ZEILE
   * ------------------------------------------------------------------------
   * Sie sieht aus wie eine echte, liegt aber nie in der Ablage. Deshalb kann
   * ein Prüfsatz auch nichts kaputtmachen — schlimmstenfalls ist er falsch.
   * ======================================================================*/

  const probeZeile = (coll: any, gegeben: any) => ({
    id: 'pruefsatz-probe',
    type: 'page',
    parentTable: 'collection',
    parentId: coll.id,
    text: (gegeben && gegeben.title) || 'Probe',
    props: Object.assign({}, gegeben),
    content: [],
    alive: true,
    created: Store.now(),
    edited: Store.now()
  });

  /* ========================================================================
   * 3 · EINEN SATZ LAUFEN LASSEN
   * ======================================================================*/

  const alsZahl = (v: unknown): number | null => {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isFinite(n) ? n : NaN;
  };

  const alsText = (v: unknown): string => {
    try { return Formula.anzeige(v); } catch { return String(v ?? ''); }
  };

  const trifftZu = (vergleich: string, ist: unknown, soll: unknown): boolean => {
    switch (vergleich) {
      case 'gleich':   return alsText(ist).trim() === String(soll ?? '').trim();
      case 'ungleich': return alsText(ist).trim() !== String(soll ?? '').trim();
      case 'enthaelt': return alsText(ist).toLowerCase().includes(String(soll ?? '').toLowerCase());
      case 'groesser': return (alsZahl(ist) ?? -Infinity) > (alsZahl(soll) ?? Infinity);
      case 'kleiner':  return (alsZahl(ist) ?? Infinity) < (alsZahl(soll) ?? -Infinity);
      case 'leer':     return ist === null || ist === undefined || alsText(ist) === '';
      case 'fehler':   return String(alsText(ist)).startsWith('⚠');
      default:         return false;
    }
  };

  /**
   * @returns {{ok:boolean, ist:string, text:string, fehler?:string}}
   */
  const laufe = (coll: any, satz: any): any => {
    if (!coll || !satz) return { ok: false, ist: '', text: 'Nichts zu prüfen.' };

    const zeile = probeZeile(coll, satz.gegeben);
    const wenn = Object.entries(satz.gegeben || {})
      .map(([k, v]) => (coll.schema[k] ? coll.schema[k].name : k) + ' = ' + alsText(v))
      .join(' und ') || 'nichts gesetzt';

    /* --- Automationen: greift die Bedingung? --------------------------- */
    if (satz.art === 'automation') {
      const a = (coll.automationen || [])[satz.index];
      if (!a) return { ok: false, ist: '—',
        text: 'Diese Automation gibt es nicht mehr.', fehler: 'weg' };
      let trifft = false;
      try {
        /* bedingungenTreffen nimmt die ganze Automation, nicht ihre Liste —
           wer nur die Liste übergibt, bekommt „trifft immer" zurück, weil
           every() auf einer leeren Liste wahr ist. */
        trifft = Datenbank.bedingungenTreffen(a, zeile, coll);
      } catch (e) {
        return { ok: false, ist: 'Fehler', text: 'Die Bedingung liess sich nicht prüfen: ' +
          (e instanceof Error ? e.message : String(e)),
                 fehler: e instanceof Error ? e.message : String(e) };
      }
      const soll = satz.vergleich !== 'trifftNicht';
      return {
        ok: trifft === soll,
        ist: trifft ? 'greift' : 'greift nicht',
        text: 'Wenn ' + wenn + ', dann ' + (soll ? 'greift' : 'greift nicht') + ' „' +
              (a.name || 'Automation') + '"'
      };
    }

    /* --- Formeln und jede andere Spalte --------------------------------- */
    const key = satz.spalte;
    const def = coll.schema[key];
    if (!def) return { ok: false, ist: '—',
      text: 'Diese Spalte gibt es nicht mehr: ' + esc(key), fehler: 'weg' };

    let ist: unknown;
    try { ist = Datenbank.wert(zeile, key, coll); }
    catch (e) { ist = '⚠ ' + (e instanceof Error ? e.message : String(e)); }

    const gut = trifftZu(satz.vergleich, ist, satz.erwartet);
    return {
      ok: gut,
      ist: alsText(ist),
      text: 'Wenn ' + wenn + ', dann ' + esc(def.name) + ' ' +
            vergleichName(satz.vergleich) +
            (['leer', 'fehler'].includes(satz.vergleich) ? '' : ' ' + esc(satz.erwartet))
    };
  };

  const alleLaufen = (coll: any): any => {
    const liste = alle(coll);
    const ergebnisse = liste.map((s: any) => ({ satz: s, ...laufe(coll, s) }));
    return {
      gesamt: liste.length,
      gut: ergebnisse.filter((e: any) => e.ok).length,
      schlecht: ergebnisse.filter((e: any) => !e.ok).length,
      ergebnisse
    };
  };

  /** Über alle Datenbanken — für den Gesundheitsbericht. */
  const ueberall = (): any => {
    const raus: any[] = [];
    Object.values<any>(Store.cache.collections).forEach(c => {
      if (!alle(c).length) return;
      const r = alleLaufen(c);
      raus.push({ coll: c, ...r });
    });
    return {
      datenbanken: raus.length,
      gesamt: raus.reduce((a: number, b: any) => a + b.gesamt, 0),
      schlecht: raus.reduce((a: number, b: any) => a + b.schlecht, 0),
      liste: raus
    };
  };

  /* ========================================================================
   * 4 · DER KURZE WEG: AUS EINER ECHTEN ZEILE
   * ------------------------------------------------------------------------
   * „Diese Zeile stimmt — halt das fest." Alles, was die Formel braucht,
   * wird aus der Zeile abgeschrieben; das Ergebnis wird das Erwartete. Wer
   * nie ein Formular ausfüllen will, kommt so trotzdem zu Prüfsätzen.
   * ======================================================================*/

  /** Welche Spalten nennt diese Formel beim Namen? */
  const zutaten = (coll: any, key: string): any => {
    const def = coll.schema[key] || {};
    if (def.type !== 'formula') return Object.keys(coll.schema).filter(k => k !== key);
    const text = String(def.formula || '');
    return Object.keys(coll.schema)
      .filter(k => k !== key && text.includes(coll.schema[k].name));
  };

  const ausZeile = (coll: any, rowId: string, key: string): any => {
    const row = Store.getBlock(rowId);
    if (!row || !coll.schema[key]) return null;

    const gegeben: Record<string, any> = {};
    zutaten(coll, key).forEach((k: string) => {
      const v = (row.props || {})[k];
      if (v !== undefined && v !== null && v !== '') gegeben[k] = v;
    });
    if (row.text) gegeben['title'] = row.text;

    let ist: unknown;
    try { ist = Datenbank.wert(row, key, coll); } catch { ist = ''; }

    return anlegen(coll, {
      name: (row.text || 'Zeile') + ' → ' + coll.schema[key].name,
      art: 'formel', spalte: key, gegeben,
      vergleich: 'gleich', erwartet: alsText(ist),
      ausZeile: rowId
    });
  };

  /* ========================================================================
   * 5 · DAS FENSTER
   * ======================================================================*/

  const fenster = (collId: string): HTMLElement | null => {
    const coll = Store.getCollection(collId);
    if (!coll) return null;

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(760px,96vw)">' +
      '<div class="fh">✔ Prüfsätze — ' + esc(coll.name || 'Datenbank') +
      '<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="ps-inhalt" style="padding:18px;max-height:72vh;overflow:auto"></div>' +
      '<div class="fbtns"><button data-a="neu">Prüfsatz anlegen</button>' +
      '<button data-a="laufen" class="prim">Alle prüfen</button></div></div>';
    document.body.appendChild(o);

    const zeichne = () => {
      const r = alleLaufen(coll);
      const ziel = o.querySelector("#ps-inhalt");
      if (!ziel) return;

      if (!r.gesamt) {
        ziel.innerHTML =
          '<p style="opacity:.8;margin-top:0">Noch kein Prüfsatz. Ein Prüfsatz ist ein Satz ' +
          'in zwei Hälften:</p>' +
          '<p style="margin:10px 0;padding:10px 12px;background:var(--bg-card);' +
          'border-radius:8px"><b>Wenn</b> Betrag = 100 und Land = „CH"<br>' +
          '<b>dann</b> ist MwSt gleich 8.1</p>' +
          '<p style="opacity:.8">Der schnellste Weg geht ohne dieses Fenster: eine Zeile, ' +
          'bei der es stimmt, mit der rechten Maustaste anklicken und <b>„Diesen Fall ' +
          'festhalten"</b> wählen. Redion schreibt den Prüfsatz dann selbst.</p>';
        return;
      }

      ziel.innerHTML =
        '<div style="margin-bottom:14px;font-weight:600">' +
          (r.schlecht
            ? '⚠️ ' + r.schlecht + ' von ' + r.gesamt + ' stimmen nicht mehr'
            : '✅ Alle ' + r.gesamt + ' stimmen') +
        '</div>' +
        r.ergebnisse.map((e: any) =>
          '<div style="border:1px solid ' + (e.ok ? 'var(--line,#ddd)' : 'var(--gefahr)') +
            ';border-radius:8px;padding:12px;margin-bottom:10px">' +
            '<div style="display:flex;gap:8px;align-items:start">' +
              '<div>' + (e.ok ? '✅' : '❌') + '</div>' +
              '<div style="flex:1">' +
                '<div style="font-weight:600">' + esc(e.satz.name || 'Ohne Namen') + '</div>' +
                '<div style="opacity:.75;margin-top:2px">' + e.text + '</div>' +
                (e.ok ? '' : '<div style="margin-top:6px;color:var(--gefahr)">' +
                  'Herausgekommen ist: <b>' + esc(e.ist) + '</b></div>') +
              '</div>' +
              '<button class="btn" data-weg="' + esc(e.satz.id) + '" data-loeschknopf aria-label="Prüfsatz löschen">🗑</button>' +
            '</div></div>').join('');
    };

    o.addEventListener('click', (e) => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="laufen"]')) {
        zeichne();
        const r = alleLaufen(coll);
        UI.toast(r.schlecht ? r.schlecht + ' stimmen nicht' : 'Alle ' + r.gesamt + ' stimmen');
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) { o.remove(); bearbeiten(coll); return; }
      const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (weg) { loeschen(coll, weg.dataset.weg); zeichne(); }
    });

    zeichne();
    return o;
  };

  /* --- Anlegen von Hand -------------------------------------------------- */
  const bearbeiten = (coll: any): HTMLElement => {
    const felder = Object.entries<any>(coll.schema);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(600px,95vw)">' +
      '<div class="fh">Neuer Prüfsatz<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" style="padding:18px;max-height:66vh;overflow:auto">' +
        '<label style="display:block;margin-bottom:12px">Name<br>' +
          '<input id="ps-name" placeholder="z. B. MwSt für die Schweiz" ' +
          'style="width:100%;padding:8px;border:1px solid var(--line,#ddd);border-radius:6px"></label>' +
        '<div style="font-weight:600;margin:14px 0 6px">Wenn …</div>' +
        felder.filter(([, d]) => !['formula', 'rollup', 'created', 'edited'].includes(d.type))
          .map(([k, d]) =>
            '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">' +
              '<span style="width:150px;opacity:.8">' + esc(d.name) + '</span>' +
              '<input data-wenn="' + esc(k) + '" placeholder="(leer lassen)" ' +
              'style="flex:1;padding:6px 8px;border:1px solid var(--line,#ddd);border-radius:6px">' +
            '</div>').join('') +
        '<div style="font-weight:600;margin:16px 0 6px">… dann</div>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
          '<select id="ps-spalte" style="padding:6px 8px">' +
            felder.map(([k, d]) => '<option value="' + esc(k) + '">' + esc(d.name) + '</option>').join('') +
          '</select>' +
          '<select id="ps-vgl" style="padding:6px 8px">' +
            VERGLEICHE.filter(v => !String(v[0]).startsWith('trifft'))
              .map(v => '<option value="' + v[0] + '">' + v[1] + '</option>').join('') +
          '</select>' +
          '<input id="ps-soll" placeholder="Erwartet" ' +
          'style="flex:1;padding:6px 8px;border:1px solid var(--line,#ddd);border-radius:6px">' +
        '</div>' +
        '<div id="ps-vorschau" style="margin-top:14px;opacity:.75"></div>' +
      '</div>' +
      '<div class="fbtns"><button data-a="zu">Abbrechen</button>' +
      '<button data-a="pruefen">Einmal ausprobieren</button>' +
      '<button data-a="ok" class="prim">Anlegen</button></div></div>';
    document.body.appendChild(o);

    const sammeln = () => {
      const gegeben: Record<string, string> = {};
      o.querySelectorAll<HTMLInputElement>('[data-wenn]').forEach(i => {
        const k = i.dataset['wenn'];
        if (k && i.value.trim() !== '') gegeben[k] = i.value.trim();
      });
      const wert = (id: string): string =>
        o.querySelector<HTMLInputElement | HTMLSelectElement>(id)?.value ?? '';
      return { name: wert('#ps-name').trim(),
               art: 'formel',
               spalte: wert('#ps-spalte'),
               vergleich: wert('#ps-vgl'),
               erwartet: wert('#ps-soll'),
               gegeben };
    };

    o.addEventListener('click', (e) => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="pruefen"]')) {
        const r = laufe(coll, sammeln());
        const vorschau = o.querySelector('#ps-vorschau');
        if (!vorschau) return;
        vorschau.innerHTML =
          (r.ok ? '✅ ' : '❌ ') + r.text + '<br>Herausgekommen ist: <b>' + esc(r.ist) + '</b>';
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) {
        const s = sammeln();
        if (!s.name) s.name = (coll.schema[s.spalte] || {}).name || 'Prüfsatz';
        anlegen(coll, s);
        o.remove();
        fenster(coll.id);
      }
    });
    return o;
  };

  return { VERGLEICHE, vergleichName, alle, setzen, anlegen, loeschen,
           probeZeile, laufe, alleLaufen, ueberall, ausZeile, zutaten,
           fenster, bearbeiten, trifftZu };
})();

(window as any).Pruefsatz = Pruefsatz;
