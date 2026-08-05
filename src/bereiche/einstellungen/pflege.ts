/* ============================================================================
 * pflege.js — Bestand pflegen: Gesundheit, Dubletten, Papierkorb, Fehler
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/einstellungen/pflege.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/einstellungen/pflege.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Fünf Dinge, die Notion nicht hat und die in der Lückenliste stehen:
 *
 *   1. GESUNDHEITSBERICHT  — verwaiste Seiten, kaputte Verknüpfungen,
 *      ungenutzte Eigenschaften, leere Datenbanken, teure Formeln.
 *      (Idee 7 der 10000×-Liste: „Workspace-Wartungs-KI")
 *   2. DUBLETTEN finden und zusammenführen. (Idee 13/17)
 *   3. PAPIERKORB räumt nach der eingestellten Frist selbst auf.
 *   4. FEHLERLISTE — jeder JavaScript-Fehler wird gesammelt statt still
 *      verschluckt, mit Zeitpunkt und Stelle.
 *   5. ERSTE HILFE — prüfen, reparieren, sichern, an einem Ort.
 *
 * Alles rechnet lokal und ändert nichts ohne Bestätigung.
 * ==========================================================================*/

const Pflege = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ========================================================================
   * 1. GESUNDHEITSBERICHT
   * ======================================================================*/
  const befund = () => {
    const b = [];
    const seiten = Object.values<any>(Store.cache.blocks)
      .filter(x => x.type === 'page' && x.alive && x.parentTable !== 'collection');
    const sammlungen = Object.values<any>(Store.cache.collections);
    const ansichten = Object.values<any>(Store.cache.views);

    /* --- Verwaiste Seiten: keine Eltern, kein Verweis, kein Inhalt ------- */
    const verwaist = seiten.filter(p => {
      if (p.parentId && Store.getBlock(p.parentId)) return false;
      const leer = !(p.content || []).length;
      /* Hier stand `Links.rueckverweise` — die Funktion heisst `verweiseAuf`
         und hat nie existiert. Weil der Aufruf hinter `Links.rueckverweise ?`
         stand, zählte er immer 0: JEDE leere Seite galt als verwaist, auch
         wenn zehn andere auf sie zeigten. */
      const verlinkt = Links.verweiseAuf(p.id).length;
      return leer && !verlinkt && !p.favorite;
    });
    if (verwaist.length) b.push({
      art: 'hinweis', titel: verwaist.length + ' leere Seiten ohne Verweise',
      text: 'Sie hängen an keiner anderen Seite und enthalten nichts.',
      liste: verwaist.slice(0, 12).map(p => ({ id: p.id, text: p.text || 'Ohne Titel' })),
      tun: 'In den Papierkorb', wirkung: () => {
        verwaist.forEach(p => Store.trashBlock(p.id));
        return verwaist.length + ' Seiten in den Papierkorb gelegt';
      }
    });

    /* --- Verknüpfungen, die ins Leere zeigen ---------------------------- */
    const kaputt: any[] = [];
    sammlungen.forEach(c => {
      Object.entries<any>(c.schema).forEach(([k, def]) => {
        if (def.type !== 'relation') return;
        if (!def.ziel || !Store.getCollection(def.ziel)) {
          kaputt.push({ id: c.id, text: (c.name || 'Datenbank') + ' → ' + def.name +
                        ' zeigt auf eine gelöschte Datenbank' });
          return;
        }
        Store.rowsOf(c.id).forEach((r: any) => {
          const ids = (r.props || {})[k];
          (Array.isArray(ids) ? ids : []).forEach(id => {
            if (!Store.getBlock(id))
              kaputt.push({ id: r.id, text: (r.text || 'Zeile') + ' → ' + def.name +
                            ' verweist auf eine gelöschte Zeile' });
          });
        });
      });
      if (def_rollupKaputt(c)) kaputt.push({ id: c.id,
        text: (c.name || 'Datenbank') + ': ein Rollup hat keine gültige Verknüpfung' });
    });
    if (kaputt.length) b.push({
      art: 'warnung', titel: kaputt.length + ' kaputte Verknüpfungen',
      text: 'Sie zeigen auf etwas, das es nicht mehr gibt.',
      liste: kaputt.slice(0, 12),
      tun: 'Tote Verweise entfernen', wirkung: () => {
        let n = 0;
        sammlungen.forEach(c => {
          Object.entries<any>(c.schema).forEach(([k, def]) => {
            if (def.type !== 'relation') return;
            Store.rowsOf(c.id).forEach((r: any) => {
              const ids = (r.props || {})[k];
              if (!Array.isArray(ids)) return;
              const sauber = ids.filter(id => Store.getBlock(id));
              if (sauber.length !== ids.length) { Store.setProp(r.id, k, sauber); n++; }
            });
          });
        });
        return n + ' Zeilen bereinigt';
      }
    });

    /* --- Eigenschaften, in denen nie etwas steht ------------------------ */
    const ungenutzt: any[] = [];
    sammlungen.forEach(c => {
      const zeilen = Store.rowsOf(c.id);
      if (zeilen.length < 3) return;
      Object.entries<any>(c.schema).forEach(([k, def]) => {
        if (['title','formula','rollup','created','edited','createdBy','editedBy','uid','button'].includes(def.type)) return;
        const gefuellt = zeilen.some((r: any) => {
          const v = (r.props || {})[k];
          return !(v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length));
        });
        if (!gefuellt) ungenutzt.push({ id: c.id,
          text: (c.name || 'Datenbank') + ' → „' + def.name + '" ist überall leer' });
      });
    });
    if (ungenutzt.length) b.push({
      art: 'hinweis', titel: ungenutzt.length + ' Eigenschaften ohne einen einzigen Wert',
      text: 'Sie stehen in der Tabelle, wurden aber nie ausgefüllt.',
      liste: ungenutzt.slice(0, 12)
    });

    /* --- Prüfsätze, die nicht mehr stimmen -------------------------------
       Das ist der einzige Befund hier, den der Mensch selbst gesetzt hat.
       Deshalb steht er weit oben: er weiss besser als jede Heuristik, was
       richtig sein soll. */
    if (typeof Pruefsatz !== 'undefined') {
      const ps = Pruefsatz.ueberall();
      if (ps.schlecht) {
        const schlechte: any[] = [];
        ps.liste.forEach((x: any) => x.ergebnisse.filter((e: any) => !e.ok).forEach((e: any) =>
          schlechte.push({ id: x.coll.id,
            text: (x.coll.name || 'Datenbank') + ' → ' + (e.satz.name || 'Prüfsatz') +
                  ' (herausgekommen ist: ' + e.ist + ')' })));
        b.push({
          art: 'warnung',
          titel: ps.schlecht + ' Prüfsätze stimmen nicht mehr',
          text: 'Du hast festgehalten, was herauskommen soll. Das tut es gerade nicht.',
          liste: schlechte.slice(0, 12)
        });
      } else if (ps.gesamt) {
        b.push({
          art: 'hinweis',
          titel: 'Alle ' + ps.gesamt + ' Prüfsätze stimmen',
          text: 'In ' + ps.datenbanken + ' Datenbank(en) rechnen die Formeln so, wie du es ' +
                'festgehalten hast.'
        });
      }
    }

    /* --- Vorlagen mit einer neueren Fassung -------------------------------
       Das ist kein Fehler, sondern eine verpasste Verbesserung. Notion kann
       so etwas gar nicht melden, weil eine eingesetzte Vorlage dort nur eine
       Fotokopie ist und nicht weiss, woher sie kommt. */
    if (typeof Fassung !== 'undefined') {
      const alt2 = Fassung.veraltet();
      if (alt2.length) b.push({
        art: 'hinweis',
        titel: alt2.length + ' Seiten aus Vorlagen haben eine neuere Fassung',
        text: 'Es wird nur hinzugefügt — keine Zeile geändert, nichts gelöscht.',
        liste: alt2.slice(0, 12).map(x => ({ id: x.seite.id,
          text: (x.seite.text || 'Ohne Titel') + ' — Fassung ' + x.von + ' → ' + x.nach })),
        tun: 'Alle aktualisieren',
        wirkung: () => { alt2.forEach(x => Fassung.anwenden(x.seite.id)); }
      });
    }

    /* --- Datenbanken ohne Zeilen ---------------------------------------- */
    const leer = sammlungen.filter(c => !Store.rowsOf(c.id).length);
    if (leer.length) b.push({
      art: 'hinweis', titel: leer.length + ' Datenbanken ohne Einträge',
      text: 'Angelegt, aber nie gefüllt.',
      liste: leer.slice(0, 12).map(c => ({ id: c.id, text: c.name || 'Ohne Namen' }))
    });

    /* --- Teure Formeln: Notion warnt nur allgemein, wir messen ---------- */
    const teuer: any[] = [];
    sammlungen.forEach(c => {
      const zeilen = Store.rowsOf(c.id).slice(0, 40);
      if (!zeilen.length) return;
      Object.entries<any>(c.schema).forEach(([k, def]) => {
        if (def.type !== 'formula' && def.type !== 'rollup') return;
        const t0 = performance.now();
        zeilen.forEach((r: any) => { try { Datenbank.wert(r, k, c); } catch {} });
        const je = (performance.now() - t0) / zeilen.length;
        if (je > 1.2) teuer.push({ id: c.id,
          text: (c.name || 'Datenbank') + ' → „' + def.name + '" braucht ' +
                (Math.round(je * 100) / 100) + ' ms je Zeile' });
      });
    });
    if (teuer.length) b.push({
      art: 'warnung', titel: teuer.length + ' aufwendige Formeln',
      text: 'Sie machen grosse Ansichten langsam. Notion sagt nur, dass es langsam werden kann — hier steht, wo.',
      liste: teuer.slice(0, 12)
    });

    /* --- Ansichten, deren Filter alles wegfiltern ----------------------- */
    const blind = ansichten.filter(v => {
      const c = Store.getCollection(v.collectionId);
      if (!c || !v.filters || !(v.filters.rules || []).length) return false;
      const alle = Store.rowsOf(c.id);
      if (!alle.length) return false;
      return !alle.some((r: any) => Datenbank.gruppeTrifftZu(r, v.filters, c));
    });
    if (blind.length) b.push({
      art: 'hinweis', titel: blind.length + ' Ansichten zeigen nichts an',
      text: 'Der Filter lässt keine einzige Zeile durch.',
      liste: blind.slice(0, 12).map(v => ({ id: v.collectionId,
        text: (Store.getCollection(v.collectionId) || {}).name + ' → ' + (v.name || 'Ansicht') }))
    });

    /* --- Zeilen, die gegen ihre eigenen Prüfregeln verstossen ----------- */
    const regelbruch: any[] = [];
    sammlungen.forEach(c => {
      const hat = Object.values<any>(c.schema).some(d => Datenbank.hatRegeln(d));
      if (!hat) return;
      Store.rowsOf(c.id).forEach((r: any) => {
        const f = Datenbank.pruefeZeile(c, r);
        if (f.length) regelbruch.push({ id: r.id, text: (r.text || 'Zeile') + ' — ' + f[0] });
      });
    });
    if (regelbruch.length) b.push({
      art: 'warnung', titel: regelbruch.length + ' Zeilen verstossen gegen ihre Prüfregeln',
      text: 'Meist Zeilen, die es schon vor der Regel gab.',
      liste: regelbruch.slice(0, 12)
    });

    /* --- Papierkorb --------------------------------------------------- */
    const muell = Object.values<any>(Store.cache.blocks).filter(x => !x.alive);
    if (muell.length > 50) b.push({
      art: 'hinweis', titel: muell.length + ' Dinge liegen im Papierkorb',
      text: 'Sie belegen Platz, bis die Frist abläuft oder du aufräumst.',
      tun: 'Papierkorb jetzt leeren', wirkung: () => {
        muell.forEach(x => Store.purgeBlock(x.id));
        return muell.length + ' endgültig gelöscht';
      }
    });

    return b;
  };

  /** Ein Rollup ohne gültige Verknüpfung — kleine Hilfe für den Befund. */
  const def_rollupKaputt = (c: any) => Object.values<any>(c.schema).some(d =>
    d.type === 'rollup' && (!d.relation || !c.schema[d.relation] ||
                            c.schema[d.relation].type !== 'relation'));

  const gesundheit = () => {
    const liste = befund();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">🩺 Gesundheit des Bestands<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" id="pf-liste" style="max-height:66vh">' +
          (liste.length
            ? liste.map((x, i) =>
                `<div class="pf-karte pf-${x.art}">` +
                  `<div class="pf-titel">${x.art === 'warnung' ? '⚠' : 'ℹ'} ${esc(x.titel)}</div>` +
                  `<div class="pf-text">${esc(x.text)}</div>` +
                  (x.liste && x.liste.length
                    ? '<div class="pf-eintraege">' + x.liste.map(e =>
                        `<button data-open="${esc(e.id)}">${esc(e.text)}</button>`).join('') +
                      '</div>' : '') +
                  (x.tun ? `<button class="pf-tun" data-tun="${i}">${esc(x.tun)}</button>` : '') +
                '</div>').join('')
            : '<div class="pf-gut">✅ Alles in Ordnung. Keine verwaisten Seiten, keine kaputten ' +
              'Verknüpfungen, keine leeren Eigenschaften, keine teuren Formeln.</div>') +
        '</div>' +
        '<div class="fbtns"><button data-a="neu">Nochmal prüfen</button>' +
        '<button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) { o.remove(); gesundheit(); return; }
      const auf = elVon(e)?.closest<HTMLElement>('[data-open]');
      if (auf) { const id = auf.dataset.open;
        if (Store.getBlock(id)) { o.remove(); App.oeffne(id); } return; }
      const tun = elVon(e)?.closest<HTMLElement>('[data-tun]');
      if (tun) {
        const x = liste[Number(tun.dataset.tun)];
        if (!x || !x.wirkung) return;
        const meldung = x.wirkung();
        App.zeichneBaum(); App.zeichneSeite();
        o.remove();
        UI.toast(meldung);
        setTimeout(gesundheit, 300);
      }
    });
  };

  /* ========================================================================
   * 2. DUBLETTEN
   * ======================================================================*/
  const dubletten = (coll: any, key: any) => {
    const schluessel = key || Object.keys(coll.schema).find(k => coll.schema[k].type === 'title');
    const gruppen = new Map();
    Store.rowsOf(coll.id).forEach((r: any) => {
      const v = String(Datenbank.wert(r, schluessel, coll) ?? '').trim().toLowerCase();
      if (!v) return;
      if (!gruppen.has(v)) gruppen.set(v, []);
      gruppen.get(v).push(r);
    });
    return [...gruppen.entries()].filter(([, rs]) => rs.length > 1)
      .map(([wert, rs]) => ({ wert, zeilen: rs }));
  };

  const dublettenDialog = (coll: any) => {
    let schluessel = Object.keys(coll.schema).find(k => coll.schema[k].type === 'title');
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(720px,95vw)">' +
        `<div class="fh">⧉ Dubletten in „${esc(coll.name || 'Datenbank')}"` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:12px 18px">Vergleichen nach <select id="dk">' +
          Object.keys(coll.schema)
            .filter(k => !['formula','rollup','button'].includes(coll.schema[k].type))
            .map(k => `<option value="${k}"${k === schluessel ? ' selected' : ''}>` +
              esc(coll.schema[k].name) + '</option>').join('') +
        '</select></div>' +
        '<div class="res" id="dl" style="max-height:58vh"></div>' +
        '<div class="fbtns"><button data-a="alle">Überall die erste behalten</button>' +
        '<button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    /* Die gefundenen Gruppen lagen vorher als `o.__gruppen` am DOM-Knoten —
       ein Feld, das es an einem `div` gar nicht gibt. Hier tut es eine
       gewöhnliche Variable im selben Verschluss. */
    let gruppen: any[] = [];

    const zeichne = (): void => {
      const g = dubletten(coll, schluessel);
      const ziel = o.querySelector('#dl');
      if (!ziel) return;
      ziel.innerHTML = g.length
        ? g.map((x, i) =>
            '<div class="pf-karte">' +
              `<div class="pf-titel">${esc(x.wert)} — ${x.zeilen.length}×</div>` +
              '<div class="pf-eintraege">' + x.zeilen.map((r: any) =>
                `<button data-open="${r.id}">${esc(r.text || 'Ohne Titel')}</button>`).join('') + '</div>' +
              `<button class="pf-tun" data-merge="${i}">Zusammenführen — die erste behalten</button>` +
            '</div>').join('')
        : '<div class="pf-gut">✅ Keine Dubletten nach dieser Eigenschaft.</div>';
      gruppen = g;
    };
    zeichne();

    /* Zusammenführen: leere Felder der ersten Zeile aus den anderen füllen,
       dann die anderen archivieren. Nichts geht verloren. */
    const fuehreZusammen = (gruppe: any) => {
      const [erste, ...rest] = gruppe.zeilen;
      rest.forEach((r: any) => {
        Object.keys(coll.schema).forEach(k => {
          const alt = (erste.props || {})[k];
          const neu = (r.props || {})[k];
          const leer = alt === undefined || alt === null || alt === '' ||
                       (Array.isArray(alt) && !alt.length);
          if (leer && neu !== undefined && neu !== null && neu !== '') Store.setProp(erste.id, k, neu);
        });
        Store.updateBlock(r.id, { archiviert: true });
      });
      return rest.length;
    };

    o.addEventListener('change', e => {
      const feld = elVon(e);
      if (feld instanceof HTMLSelectElement && feld.id === 'dk') { schluessel = feld.value; zeichne(); }
    });
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const auf = elVon(e)?.closest<HTMLElement>('[data-open]');
      if (auf) { o.remove(); App.oeffne(auf.dataset.open); return; }
      const m = elVon(e)?.closest<HTMLElement>('[data-merge]');
      if (m) {
        const n = fuehreZusammen(gruppen[Number(m.dataset.merge)]);
        zeichne(); App.zeichneSeite();
        UI.toast(n + ' Zeilen zusammengeführt und archiviert');
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="alle"]')) {
        let n = 0;
        gruppen.forEach((g: any) => { n += fuehreZusammen(g); });
        zeichne(); App.zeichneSeite();
        UI.toast(n + ' Zeilen zusammengeführt');
      }
    });
  };

  /* ========================================================================
   * 3. PAPIERKORB RÄUMT SELBST AUF
   * ------------------------------------------------------------------------
   * Hier stand einmal eine eigene Fassung davon. Sie las `geloeschtAm` und
   * `papierkorbFrist` — zwei Namen, die im ganzen Quelltext niemand schreibt;
   * das Feld heisst `trashedAt`, die Einstellung `papierkorbTage`. Sie lief
   * beim Start und danach täglich und fand jedes Mal nichts. Ihr Knopf
   * „Papierkorb jetzt leeren" antwortete seit jeher „Nichts ist alt genug".
   *
   * Aufgefallen ist es nie, weil daneben eine zweite Fassung in
   * `bereiche/wissen/werkzeuge.js` lief, die es richtig machte. Zwei
   * Fassungen derselben Sache sind nicht doppelt sicher, sondern eine
   * richtige und eine, die niemand prüft.
   *
   * Jetzt steht die Frist in `kern/ablage` — sie handelt von der Ablage,
   * nicht von einem Bereich. Was hier bleibt, ist die Meldung an den
   * Menschen; die gehört an die Oberfläche und nicht in den Kern.
   * ======================================================================*/
  const papierkorbAufraeumen = async ({ still = true } = {}) => {
    const anzahl = await Store.papierkorbAufraeumen();
    if (anzahl && !still)
      UI.toast(anzahl + (anzahl === 1 ? ' Ding war' : ' Dinge waren') +
               ' zu lange im Papierkorb und wurde' + (anzahl === 1 ? '' : 'n') +
               ' endgültig gelöscht');
    return anzahl;
  };

  /** Was verschwindet demnächst? Für den Hinweis im Papierkorb. */
  const baldWeg = () => Store.papierkorbBaldWeg();

  /* ========================================================================
   * 4. FEHLERLISTE
   * ======================================================================*/
  /* Nimmt alles entgegen, was irgendwo geworfen wurde: einen Fehler, einen
     Text, ein fremdes Objekt. Aufrufer sollen nicht erst umwandeln müssen —
     sonst notieren sie im Zweifel gar nichts. */
  const fehlerMerken = (fehler: unknown, wo: unknown): void => {
    const text = fehler instanceof Error ? fehler.message : String(fehler);
    const liste = Store.getMeta('fehlerliste', []) || [];
    liste.unshift({ text: text.slice(0, 400), wo: String(wo ?? '').slice(0, 200),
                    wann: new Date().toISOString() });
    Store.setMeta('fehlerliste', liste.slice(0, 80));
  };

  const fehlerListe = () => {
    const liste = Store.getMeta('fehlerliste', []) || [];
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        `<div class="fh">🐞 Fehler <em>${liste.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" style="max-height:62vh">' +
          (liste.length
            ? liste.map((f: any) => '<div class="pf-karte pf-warnung">' +
                `<div class="pf-titel">${esc(f.text)}</div>` +
                `<div class="pf-text">${esc(f.wo)} · ${esc(Werkzeuge.zeitKurz(f.wann))}</div>` +
              '</div>').join('')
            : '<div class="pf-gut">✅ Kein einziger Fehler aufgezeichnet.</div>') +
        '</div>' +
        '<div class="fbtns"><button data-a="kopieren">Alles kopieren</button>' +
        '<button data-a="leeren">Liste leeren</button>' +
        '<button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="leeren"]')) {
        Store.setMeta('fehlerliste', []); o.remove(); UI.toast('Fehlerliste geleert'); return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="kopieren"]')) {
        navigator.clipboard?.writeText(liste.map((f: any) =>
          f.wann + ' — ' + f.text + ' (' + f.wo + ')').join('\n'));
        UI.toast('In die Zwischenablage kopiert');
      }
    });
  };

  /* ========================================================================
   * 5. BESTAND PRÜFEN UND REPARIEREN
   * ======================================================================*/
  const bestandPruefen = () => {
    const gefunden = { verwaisteBloecke: 0, toteKinder: 0, zeilenOhneDb: 0, ansichtenOhneDb: 0 };

    /* Kinder, die es nicht mehr gibt, aus den Inhaltslisten werfen */
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (!Array.isArray(b.content) || !b.content.length) return;
      const sauber = b.content.filter((id: any) => Store.cache.blocks[id]);
      if (sauber.length !== b.content.length) {
        gefunden.toteKinder += b.content.length - sauber.length;
        Store.updateBlock(b.id, { content: sauber });
      }
    });

    /* Blöcke, deren Eltern verschwunden sind */
    Object.values<any>(Store.cache.blocks).forEach(b => {
      if (!b.alive || !b.parentId) return;
      if (b.parentTable === 'collection') {
        if (!Store.getCollection(b.parentId)) { gefunden.zeilenOhneDb++; Store.trashBlock(b.id); }
      } else if (!Store.cache.blocks[b.parentId]) {
        gefunden.verwaisteBloecke++;
        Store.updateBlock(b.id, { parentId: null });
      }
    });

    /* Ansichten ohne Datenbank */
    Object.values<any>(Store.cache.views).forEach(v => {
      if (!Store.getCollection(v.collectionId)) { gefunden.ansichtenOhneDb++; Store.removeView(v.id); }
    });

    return gefunden;
  };

  const ersteHilfe = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    const zahlen = {
      seiten: Object.values<any>(Store.cache.blocks).filter(x => x.type === 'page' && x.alive).length,
      bloecke: Object.values<any>(Store.cache.blocks).filter(x => x.alive).length,
      dbs: Object.values<any>(Store.cache.collections).length,
      muell: Object.values<any>(Store.cache.blocks).filter(x => !x.alive).length,
      fehler: (Store.getMeta('fehlerliste', []) || []).length
    };
    o.innerHTML =
      '<div class="finder" style="width:min(620px,95vw)">' +
        '<div class="fh">🧰 Erste Hilfe<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:14px 18px; display:flex; flex-direction:column; gap:10px">' +
          `<div class="pf-zahlen">${zahlen.seiten} Seiten · ${zahlen.bloecke} Blöcke · ` +
            `${zahlen.dbs} Datenbanken · ${zahlen.muell} im Papierkorb · ` +
            `${zahlen.fehler} Fehler aufgezeichnet</div>` +
          '<button class="eh-knopf" data-a="gesund"><b>🩺 Gesundheit prüfen</b>' +
            '<span>Verwaiste Seiten, kaputte Verknüpfungen, teure Formeln</span></button>' +
          '<button class="eh-knopf" data-a="reparieren"><b>🔧 Bestand reparieren</b>' +
            '<span>Tote Verweise und verwaiste Blöcke in Ordnung bringen</span></button>' +
          '<button class="eh-knopf" data-a="sichern"><b>💾 Alles sichern</b>' +
            '<span>Vollständige Sicherung als Datei</span></button>' +
          '<button class="eh-knopf" data-a="papier"><b>🗑 Papierkorb aufräumen</b>' +
            '<span>Was älter ist als die Frist, endgültig löschen</span></button>' +
          '<button class="eh-knopf" data-a="fehler"><b>🐞 Fehler ansehen</b>' +
            '<span>Was ist schiefgegangen, wann und wo</span></button>' +
        '</div>' +
        '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const a = elVon(e)?.closest<HTMLElement>('[data-a]')?.dataset.a;
      if (a === 'gesund')    { o.remove(); gesundheit(); }
      if (a === 'fehler')    { o.remove(); fehlerListe(); }
      /* Hier stand `Einstellungen.sicherungSchreiben` — die Funktion gibt es
         nicht, die Sicherung schreibt `App.sicherungSpeichern`. Der Zweig
         war tot, es lief immer der Notweg über die Einzeldatei. */
      if (a === 'sichern')   { o.remove(); App.sicherungSpeichern(); }
      if (a === 'papier') {
        /* Das `await` ist nicht Zierde: ohne es stand hier eine Zusage über
           ein Versprechen statt über eine Zahl, und die Meldung hätte
           „[object Promise] endgültig gelöscht" gelautet. */
        const n = await papierkorbAufraeumen({ still: false });
        if (!n) UI.toast('Nichts ist alt genug — nichts gelöscht');
      }
      if (a === 'reparieren') {
        const g = bestandPruefen();
        const summe = g.toteKinder + g.verwaisteBloecke + g.zeilenOhneDb + g.ansichtenOhneDb;
        App.zeichneBaum(); App.zeichneSeite();
        UI.toast(summe
          ? `Repariert: ${g.toteKinder} tote Verweise, ${g.verwaisteBloecke} verwaiste Blöcke, ` +
            `${g.zeilenOhneDb} Zeilen ohne Datenbank, ${g.ansichtenOhneDb} Ansichten ohne Datenbank`
          : 'Nichts zu reparieren — der Bestand ist in Ordnung');
      }
    });
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  const start = () => {
    /* Fehler sammeln statt still verschlucken */
    addEventListener('error', (e) => {
      try { fehlerMerken(e.message || String(e.error),
        (e.filename || '').split('/').pop() + ':' + (e.lineno || '')); } catch {}
    });
    addEventListener('unhandledrejection', (e) => {
      try { fehlerMerken(e.reason?.message || String(e.reason), 'Versprechen'); } catch {}
    });

    /* Papierkorb einmal nach dem Start und danach täglich.
       `still: false` ist kein Detail: was hier endgültig gelöscht wird, ist
       endgültig gelöscht. Das darf der Mensch erfahren, auch wenn er es
       eingestellt hat — sonst verschwindet etwas, und niemand hat es gesagt. */
    setTimeout(() => papierkorbAufraeumen({ still: false }), 8000);
    setInterval(() => papierkorbAufraeumen({ still: false }), 86400000);
  };

  return { start, gesundheit, befund, dubletten, dublettenDialog,
           papierkorbAufraeumen, baldWeg, fehlerListe, fehlerMerken,
           bestandPruefen, ersteHilfe };
})();

(window as any).Pflege = Pflege;
