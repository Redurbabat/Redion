/* ============================================================================
 * schema.js — Das Datenmodell sehen und Kennzahlen bauen
 * ----------------------------------------------------------------------------
 * Zwei Ideen aus der 10000×-Liste, die Notion nicht hat:
 *
 *   18 · SCHEMA-ANSICHT — alle Datenbanken, ihre Eigenschaften und die
 *        Verknüpfungen dazwischen, als Diagramm. Notion zeigt nirgends,
 *        wie das eigene Datenmodell aussieht.
 *   15 · KENNZAHLEN-TAFEL — Zahlen aus mehreren Datenbanken nebeneinander,
 *        mit Ziel, Pfeil und Farbe. Notions Dashboards sind nur Seiten mit
 *        verknüpften Ansichten.
 *
 * Beides rechnet aus dem, was ohnehin da ist — nichts wird zusätzlich
 * gespeichert ausser der Tafel selbst.
 * ==========================================================================*/

const Schema = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ========================================================================
   * 1. DAS DATENMODELL
   * ======================================================================*/
  const modell = () => {
    const dbs = Object.values(Store.cache.collections).map(c => {
      const zeilen = Store.rowsOf(c.id);
      const felder = Object.entries(c.schema).map(([k, d]) => ({
        key: k, name: d.name, typ: d.type,
        ziel: d.type === 'relation' ? d.ziel : null,
        regeln: Datenbank.hatRegeln(d),
        gefuellt: zeilen.length
          ? Math.round(zeilen.filter(r => {
              const v = (r.props || {})[k];
              return !(v === undefined || v === null || v === '' ||
                       (Array.isArray(v) && !v.length));
            }).length / zeilen.length * 100)
          : 0
      }));
      return { id: c.id, name: c.name || 'Ohne Namen', zeilen: zeilen.length,
               felder, ansichten: Object.values(Store.cache.views)
                 .filter(v => v.collectionId === c.id).length };
    });

    const kanten = [];
    dbs.forEach(d => d.felder.forEach(f => {
      if (f.ziel && dbs.some(x => x.id === f.ziel))
        kanten.push({ von: d.id, nach: f.ziel, name: f.name });
    }));

    return { dbs, kanten };
  };

  const ansicht = () => {
    const m = modell();
    const o = document.createElement('div');
    o.className = 'overlay';

    const karte = (d) => {
      const raus = m.kanten.filter(k => k.von === d.id);
      const rein = m.kanten.filter(k => k.nach === d.id);
      return '<div class="sm-karte" data-db="' + d.id + '">' +
        `<div class="sm-kopf"><b>${esc(d.name)}</b>` +
          `<span>${d.zeilen} Zeilen · ${d.ansichten} Ansichten</span></div>` +
        '<div class="sm-felder">' +
          d.felder.slice(0, 14).map(f =>
            `<div class="sm-feld${f.ziel ? ' sm-rel' : ''}">` +
              `<span class="sm-typ">${esc(Datenbank.propTyp(f.typ).icon || '·')}</span>` +
              `<span class="sm-name">${esc(f.name)}</span>` +
              (f.regeln ? '<span class="sm-regel" title="Hat Prüfregeln">✔</span>' : '') +
              (f.ziel
                ? `<span class="sm-pfeil">→ ${esc((m.dbs.find(x => x.id === f.ziel) || {}).name || '?')}</span>`
                : `<span class="sm-fuell" title="${f.gefuellt}% gefüllt">` +
                  `<i style="width:${f.gefuellt}%"></i></span>`) +
            '</div>').join('') +
          (d.felder.length > 14 ? `<div class="sm-mehr">… und ${d.felder.length - 14} weitere</div>` : '') +
        '</div>' +
        (raus.length || rein.length
          ? '<div class="sm-kanten">' +
            raus.map(k => `<span>→ ${esc((m.dbs.find(x => x.id === k.nach) || {}).name)}</span>`).join('') +
            rein.map(k => `<span class="sm-rein">← ${esc((m.dbs.find(x => x.id === k.von) || {}).name)}</span>`).join('') +
            '</div>'
          : '') +
      '</div>';
    };

    o.innerHTML =
      '<div class="finder" style="width:min(1000px,96vw)">' +
        '<div class="fh">🗺 Datenmodell<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="dl-hinweis" style="padding:9px 18px">' +
          m.dbs.length + ' Datenbanken · ' + m.kanten.length + ' Verknüpfungen · ' +
          m.dbs.reduce((n, d) => n + d.zeilen, 0) + ' Zeilen insgesamt. ' +
          'Notion zeigt nirgends, wie das eigene Datenmodell aussieht.' +
        '</div>' +
        '<div class="res sm-gitter" style="max-height:68vh">' +
          (m.dbs.length ? m.dbs.map(karte).join('')
            : '<div class="pf-gut">Noch keine Datenbank angelegt.</div>') +
        '</div>' +
        '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const k = e.target.closest('[data-db]');
      if (!k) return;
      /* Zur Seite springen, auf der diese Datenbank steht */
      const block = Object.values(Store.cache.blocks)
        .find(b => b.type === 'database' && b.collectionId === k.dataset.db && b.alive);
      if (block && Store.getBlock(block.parentId)) { o.remove(); App.oeffne(block.parentId); }
      else UI.toast('Diese Datenbank steht auf keiner Seite');
    });
  };

  /* ========================================================================
   * 2. KENNZAHLEN-TAFEL
   * ------------------------------------------------------------------------
   * Eine Kennzahl ist: Datenbank + Rechnung + Spalte + optional ein Filter
   * und ein Ziel. Sie wird bei jedem Öffnen frisch gerechnet.
   * ======================================================================*/
  const kennzahlen = () => Store.getMeta('kennzahlen', []) || [];

  const rechne = (kz) => {
    const c = Store.getCollection(kz.db);
    if (!c) return { wert: 0, text: '—', fehlt: true };
    let zeilen = Store.rowsOf(c.id).filter(r => !r.archiviert);
    if (kz.filterKey && kz.filterWert !== undefined && kz.filterWert !== '') {
      const ops = Datenbank.OPERATOREN[c.schema[kz.filterKey]?.type] || Datenbank.OPERATOREN.text;
      zeilen = zeilen.filter(r => Datenbank.gruppeTrifftZu(r,
        { operator: 'and', rules: [{ key: kz.filterKey, op: kz.filterOp || ops[0], wert: kz.filterWert }] }, c));
    }
    const werte = kz.key ? zeilen.map(r => Datenbank.wert(r, kz.key, c)) : zeilen.map(() => 1);
    const w = Datenbank.pivotRechne(kz.art || 'anzahl', werte);
    return { wert: w, text: Formula.anzeige(Math.round(w * 100) / 100), zeilen: zeilen.length };
  };

  const tafel = () => {
    const liste = kennzahlen();
    const o = document.createElement('div');
    o.className = 'overlay';

    const zeichne = () => {
      const karten = kennzahlen().map((kz, i) => {
        const r = rechne(kz);
        const ziel = Number(kz.ziel);
        const anteil = ziel ? Math.min(100, Math.round(r.wert / ziel * 100)) : null;
        const gut = ziel ? (kz.richtung === 'runter' ? r.wert <= ziel : r.wert >= ziel) : null;
        return '<div class="kz-karte">' +
          `<div class="kz-name">${esc(kz.name || 'Kennzahl')}` +
            `<button data-weg="${i}" title="Entfernen">✕</button></div>` +
          `<div class="kz-wert${gut === null ? '' : (gut ? ' gut' : ' schlecht')}">${esc(r.text)}</div>` +
          (ziel
            ? `<div class="kz-ziel">Ziel ${esc(kz.ziel)} · ${anteil}%` +
              `<div class="kz-bar"><i style="width:${anteil}%"></i></div></div>`
            : `<div class="kz-ziel">${r.zeilen} Zeilen</div>`) +
        '</div>';
      }).join('');

      o.querySelector('#kz-gitter').innerHTML = karten ||
        '<div class="pf-gut">Noch keine Kennzahl. Unten eine anlegen.</div>';
    };

    const dbs = Object.values(Store.cache.collections);
    o.innerHTML =
      '<div class="finder" style="width:min(900px,96vw)">' +
        '<div class="fh">📊 Kennzahlen<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="kz-gitter" id="kz-gitter"></div>' +
        '<div class="kz-neu">' +
          '<input id="kz-name" placeholder="Name der Kennzahl">' +
          '<select id="kz-db">' + dbs.map(c =>
            `<option value="${c.id}">${esc(c.name || 'Ohne Namen')}</option>`).join('') + '</select>' +
          '<select id="kz-art">' + Datenbank.PIVOT_ARTEN.map(([id, n]) =>
            `<option value="${id}">${n}</option>`).join('') + '</select>' +
          '<select id="kz-key"></select>' +
          '<input id="kz-ziel" type="number" placeholder="Ziel" style="width:90px">' +
          '<button data-a="add" class="prim">Hinzufügen</button>' +
        '</div>' +
        '<div class="fbtns"><button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const felder = () => {
      const c = Store.getCollection(o.querySelector('#kz-db').value);
      o.querySelector('#kz-key').innerHTML = '<option value="">— nur zählen —</option>' +
        (c ? Object.keys(c.schema).map(k =>
          `<option value="${k}">${esc(c.schema[k].name)}</option>`).join('') : '');
    };
    if (dbs.length) felder();
    o.querySelector('#kz-db').addEventListener('change', felder);
    zeichne();

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const weg = e.target.closest('[data-weg]');
      if (weg) {
        const l = kennzahlen(); l.splice(+weg.dataset.weg, 1);
        Store.setMeta('kennzahlen', l); zeichne(); return;
      }
      if (e.target.closest('[data-a="add"]')) {
        const l = kennzahlen();
        l.push({
          name: o.querySelector('#kz-name').value || 'Kennzahl',
          db:   o.querySelector('#kz-db').value,
          art:  o.querySelector('#kz-art').value,
          key:  o.querySelector('#kz-key').value,
          ziel: o.querySelector('#kz-ziel').value
        });
        Store.setMeta('kennzahlen', l);
        o.querySelector('#kz-name').value = '';
        o.querySelector('#kz-ziel').value = '';
        zeichne();
      }
    });
  };

  return { modell, ansicht, kennzahlen, rechne, tafel };
})();

window.Schema = Schema;
