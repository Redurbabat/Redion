/* ============================================================================
 * canvas.js — Zeichenfläche, Diagramme, einfache Tabelle, Mathematik
 * ----------------------------------------------------------------------------
 * Vier Blöcke, die man sonst nur in anderen Programmen bekommt:
 *
 *   Whiteboard   frei zeichnen, Formen, Haftnotizen  (wie AFFiNE „edgeless")
 *   Diagramm     Balken, Linie, Ring                 (wie tui.editor / Notion Chart)
 *   Tabelle      einfache Tabelle ohne Datenbank     (Notions „Simple table")
 *   Mathematik   LaTeX-Formeln ohne fremde Pakete    (wie MarkText / Zettlr)
 *
 * Alles ohne Abhängigkeiten, alles offline.
 * ==========================================================================*/

const Zusatz = (() => {

  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const NS = 'http://www.w3.org/2000/svg';
  const sv = (name, attrs = {}) => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };

  const PALETTE = ['#529cca', '#4dab9a', '#ffa344', '#ff7369', '#9a6dd7', '#e255a1', '#ffdc49', '#9b9a97'];

  /* ========================================================================
   * 1. WHITEBOARD
   * ======================================================================*/
  const whiteboard = (block) => {
    const daten = block.shapes ? JSON.parse(JSON.stringify(block.shapes)) : [];
    let werkzeug = 'stift';
    let farbe = PALETTE[0];
    const hoehe = block.hoehe || 380;

    const w = document.createElement('div');
    w.className = 'wb';
    w.innerHTML =
      '<div class="wb-tools">' +
        [['zeiger', '⭠', 'Auswählen und verschieben'],
         ['stift', '✎', 'Freihand zeichnen'],
         ['linie', '╱', 'Linie'],
         ['pfeil', '→', 'Pfeil'],
         ['rechteck', '▭', 'Rechteck'],
         ['ellipse', '◯', 'Ellipse'],
         ['notiz', '🗒', 'Haftnotiz'],
         ['text', 'T', 'Text'],
         ['radierer', '⌫', 'Radierer']]
          .map(([id, ico, titel]) =>
            `<button data-wz="${id}" title="${titel}"${id === 'stift' ? ' class="on"' : ''}>${ico}</button>`).join('') +
        '<span class="wb-sep"></span>' +
        PALETTE.map(c => `<button class="wb-farbe" data-c="${c}" style="background:${c}"></button>`).join('') +
        '<span class="wb-sep"></span>' +
        '<button data-a="zurueck" title="Letztes rückgängig">↶</button>' +
        '<button data-a="leeren" title="Alles löschen">🗑</button>' +
        '<button data-a="png" title="Als Bild speichern">⭳</button>' +
      '</div>';

    const flaeche = sv('svg', { class: 'wb-flaeche', width: '100%', height: hoehe });
    flaeche.style.height = hoehe + 'px';
    w.appendChild(flaeche);

    const griff = document.createElement('div');
    griff.className = 'wb-griff';
    griff.title = 'Höhe ziehen';
    w.appendChild(griff);

    /* --- Zeichnen ------------------------------------------------------- */
    const sichern = () => Store.updateBlock(block.id, { shapes: daten });

    const male = () => {
      flaeche.innerHTML = '';
      const raster = sv('pattern', { id: 'r' + block.id.slice(0, 6), width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
      raster.appendChild(sv('circle', { cx: 1, cy: 1, r: 1, fill: 'currentColor', opacity: .18 }));
      const defs = sv('defs');
      defs.appendChild(raster);
      const spitze = sv('marker', { id: 'p' + block.id.slice(0, 6), markerWidth: 9, markerHeight: 9,
                                    refX: 8, refY: 3, orient: 'auto' });
      spitze.appendChild(sv('path', { d: 'M0,0 L9,3 L0,6 z', fill: 'context-stroke' }));
      defs.appendChild(spitze);
      flaeche.appendChild(defs);
      flaeche.appendChild(sv('rect', { width: '100%', height: '100%', fill: `url(#r${block.id.slice(0, 6)})` }));

      daten.forEach(s => flaeche.appendChild(formZeichnen(s)));
    };

    const formZeichnen = (s) => {
      if (s.art === 'stift' || s.art === 'linie' || s.art === 'pfeil') {
        const p = sv('path', {
          d: s.art === 'stift'
            ? 'M' + s.pts.map(q => q[0] + ' ' + q[1]).join(' L')
            : `M${s.x} ${s.y} L${s.x + s.w} ${s.y + s.h}`,
          stroke: s.farbe, 'stroke-width': 2.5, fill: 'none',
          'stroke-linecap': 'round', 'stroke-linejoin': 'round'
        });
        if (s.art === 'pfeil') p.setAttribute('marker-end', `url(#p${block.id.slice(0, 6)})`);
        p.dataset.sid = s.id;
        return p;
      }
      if (s.art === 'rechteck' || s.art === 'notiz') {
        const g = sv('g');
        const r = sv('rect', {
          x: Math.min(s.x, s.x + s.w), y: Math.min(s.y, s.y + s.h),
          width: Math.abs(s.w), height: Math.abs(s.h), rx: s.art === 'notiz' ? 3 : 5,
          fill: s.art === 'notiz' ? s.farbe : 'none', stroke: s.farbe, 'stroke-width': 2,
          'fill-opacity': s.art === 'notiz' ? .85 : 1
        });
        r.dataset.sid = s.id;
        g.appendChild(r);
        if (s.text) {
          const t = sv('text', {
            x: Math.min(s.x, s.x + s.w) + 10, y: Math.min(s.y, s.y + s.h) + 22,
            fill: s.art === 'notiz' ? '#1c1c1c' : s.farbe, 'font-size': 14
          });
          zeilenUmbruch(s.text, Math.abs(s.w) - 18).forEach((z, i) => {
            const ts = sv('tspan', { x: Math.min(s.x, s.x + s.w) + 10, dy: i ? 18 : 0 });
            ts.textContent = z;
            t.appendChild(ts);
          });
          g.appendChild(t);
        }
        return g;
      }
      if (s.art === 'ellipse') {
        const e = sv('ellipse', {
          cx: s.x + s.w / 2, cy: s.y + s.h / 2,
          rx: Math.abs(s.w / 2), ry: Math.abs(s.h / 2),
          fill: 'none', stroke: s.farbe, 'stroke-width': 2
        });
        e.dataset.sid = s.id;
        return e;
      }
      /* text */
      const t = sv('text', { x: s.x, y: s.y, fill: s.farbe, 'font-size': 17, 'font-weight': 500 });
      t.textContent = s.text || '';
      t.dataset.sid = s.id;
      return t;
    };

    const zeilenUmbruch = (text, breite) => {
      const proZeile = Math.max(6, Math.floor(breite / 7.4));
      const worte = String(text).split(/\s+/);
      const out = []; let zeile = '';
      worte.forEach(x => {
        if ((zeile + ' ' + x).trim().length > proZeile) { out.push(zeile.trim()); zeile = x; }
        else zeile += ' ' + x;
      });
      if (zeile.trim()) out.push(zeile.trim());
      return out.slice(0, 8);
    };

    const punkt = (e) => {
      const r = flaeche.getBoundingClientRect();
      return [Math.round(e.clientX - r.left), Math.round(e.clientY - r.top)];
    };

    let aktiv = null, verschiebt = null;

    flaeche.addEventListener('pointerdown', e => {
      flaeche.setPointerCapture(e.pointerId);
      const [x, y] = punkt(e);

      if (werkzeug === 'radierer') {
        const sid = e.target.dataset?.sid;
        if (sid) { const i = daten.findIndex(s => s.id === sid); if (i >= 0) { daten.splice(i, 1); male(); sichern(); } }
        return;
      }
      if (werkzeug === 'zeiger') {
        const sid = e.target.dataset?.sid;
        const s = daten.find(q => q.id === sid);
        if (s) verschiebt = { s, x, y };
        return;
      }
      if (werkzeug === 'text' || werkzeug === 'notiz') {
        const text = prompt(werkzeug === 'notiz' ? 'Text der Haftnotiz' : 'Text');
        if (text === null) return;
        daten.push(werkzeug === 'notiz'
          ? { id: Store.uid().slice(0, 8), art: 'notiz', x, y, w: 170, h: 110, farbe, text }
          : { id: Store.uid().slice(0, 8), art: 'text', x, y, farbe, text });
        male(); sichern();
        return;
      }
      aktiv = werkzeug === 'stift'
        ? { id: Store.uid().slice(0, 8), art: 'stift', pts: [[x, y]], farbe }
        : { id: Store.uid().slice(0, 8), art: werkzeug, x, y, w: 0, h: 0, farbe };
      daten.push(aktiv);
    });

    flaeche.addEventListener('pointermove', e => {
      const [x, y] = punkt(e);
      if (verschiebt) {
        const dx = x - verschiebt.x, dy = y - verschiebt.y;
        const s = verschiebt.s;
        if (s.art === 'stift') s.pts = s.pts.map(p => [p[0] + dx, p[1] + dy]);
        else { s.x += dx; s.y += dy; }
        verschiebt.x = x; verschiebt.y = y;
        male();
        return;
      }
      if (!aktiv) return;
      if (aktiv.art === 'stift') aktiv.pts.push([x, y]);
      else { aktiv.w = x - aktiv.x; aktiv.h = y - aktiv.y; }
      male();
    });

    const fertig = () => {
      if (aktiv) {
        /* Winzige Kritzler wieder entfernen */
        const klein = aktiv.art === 'stift' ? aktiv.pts.length < 2 : Math.abs(aktiv.w) < 4 && Math.abs(aktiv.h) < 4;
        if (klein) daten.pop();
        aktiv = null; sichern(); male();
      }
      if (verschiebt) { verschiebt = null; sichern(); }
    };
    flaeche.addEventListener('pointerup', fertig);
    flaeche.addEventListener('pointerleave', fertig);

    /* --- Werkzeugleiste -------------------------------------------------- */
    w.querySelector('.wb-tools').addEventListener('click', e => {
      const wz = e.target.closest('[data-wz]');
      if (wz) {
        werkzeug = wz.dataset.wz;
        w.querySelectorAll('[data-wz]').forEach(b => b.classList.toggle('on', b === wz));
        return;
      }
      const c = e.target.closest('[data-c]');
      if (c) {
        farbe = c.dataset.c;
        w.querySelectorAll('.wb-farbe').forEach(b => b.classList.toggle('on', b === c));
        return;
      }
      const a = e.target.closest('[data-a]');
      if (!a) return;
      if (a.dataset.a === 'zurueck') { daten.pop(); male(); sichern(); }
      if (a.dataset.a === 'leeren') {
        if (!daten.length || confirm('Die ganze Zeichenfläche leeren?')) { daten.length = 0; male(); sichern(); }
      }
      if (a.dataset.a === 'png') alsBild(flaeche, hoehe);
    });

    /* --- Höhe ziehen ----------------------------------------------------- */
    griff.addEventListener('pointerdown', e => {
      e.preventDefault();
      const start = e.clientY, h0 = flaeche.getBoundingClientRect().height;
      const zug = (ev) => {
        const h = Math.max(180, Math.min(1200, h0 + ev.clientY - start));
        flaeche.style.height = h + 'px';
        flaeche.setAttribute('height', h);
      };
      const stop = () => {
        removeEventListener('pointermove', zug); removeEventListener('pointerup', stop);
        Store.updateBlock(block.id, { hoehe: Math.round(flaeche.getBoundingClientRect().height) });
      };
      addEventListener('pointermove', zug); addEventListener('pointerup', stop);
    });

    male();
    return w;
  };

  /** SVG als PNG herunterladen — ohne fremde Pakete. */
  const alsBild = (svgEl, hoehe) => {
    const kopie = svgEl.cloneNode(true);
    const breite = Math.round(svgEl.getBoundingClientRect().width);
    kopie.setAttribute('width', breite);
    kopie.setAttribute('height', hoehe);
    kopie.setAttribute('xmlns', NS);
    const quelle = new XMLSerializer().serializeToString(kopie);
    const bild = new Image();
    bild.onload = () => {
      const c = document.createElement('canvas');
      c.width = breite * 2; c.height = hoehe * 2;
      const g = c.getContext('2d');
      g.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg') || '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.scale(2, 2);
      g.drawImage(bild, 0, 0);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = 'whiteboard.png';
      a.click();
      UI.toast('Als PNG gespeichert');
    };
    bild.onerror = () => UI.toast('Das Bild liess sich nicht erzeugen');
    bild.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(quelle)));
  };

  /* ========================================================================
   * 2. DIAGRAMM
   * ------------------------------------------------------------------------
   * Datenquelle: entweder eingetippte Zeilen „Name: Wert" oder eine
   * Datenbank auf derselben Seite.
   * ======================================================================*/
  const CHART_TYPEN = [['bar', 'Balken'], ['column', 'Säulen'], ['line', 'Linie'], ['donut', 'Ring'],
                       ['area', 'Fläche'], ['kpi', 'Kennzahl']];

  const diagramm = (block) => {
    const w = document.createElement('div');
    w.className = 'chart';

    const typ = block.chartTyp || 'bar';
    const werte = chartDaten(block);

    w.innerHTML =
      '<div class="chart-head">' +
        `<input class="chart-titel" value="${esc(block.text || '')}" placeholder="Titel des Diagramms">` +
        '<div class="chart-typen">' +
          CHART_TYPEN.map(([id, n]) =>
            `<button data-ct="${id}"${id === typ ? ' class="on"' : ''}>${n}</button>`).join('') +
        '</div>' +
        '<button class="chart-daten" title="Daten bearbeiten">✎ Daten</button>' +
      '</div>';

    const flaeche = document.createElement('div');
    flaeche.className = 'chart-flaeche';
    w.appendChild(flaeche);

    if (!werte.length) {
      flaeche.innerHTML = '<div class="chart-leer">Noch keine Daten. Klicke auf <b>✎ Daten</b> ' +
                          'und schreibe Zeilen wie <code>Montag: 12</code>.</div>';
    } else {
      flaeche.appendChild(chartSvg(typ, werte));
      const legende = document.createElement('div');
      legende.className = 'chart-legende';
      legende.innerHTML = werte.map((v, i) =>
        `<span><i style="background:${PALETTE[i % PALETTE.length]}"></i>${esc(v.name)} ` +
        `<b>${Formula.anzeige(v.wert)}</b></span>`).join('');
      w.appendChild(legende);
    }

    w.querySelector('.chart-titel').addEventListener('input', e =>
      Store.updateBlock(block.id, { text: e.target.value }));

    w.querySelector('.chart-head').addEventListener('click', e => {
      const t = e.target.closest('[data-ct]');
      if (t) { Store.updateBlock(block.id, { chartTyp: t.dataset.ct }); App.zeichneSeite(); return; }
      if (e.target.closest('.chart-daten')) datenEditor(block);
    });

    return w;
  };

  const chartDaten = (block) => {
    /* Aus einer Datenbank? */
    if (block.quelleDb) {
      const c = Store.getCollection(block.quelleDb);
      if (c) {
        const gruppe = block.gruppeNach, mess = block.messen;
        const zeilen = Store.rowsOf(c.id);
        if (gruppe) {
          const map = new Map();
          zeilen.forEach(r => {
            const k = Formula.anzeige(Datenbank.wert(r, gruppe, c)) || '(leer)';
            const v = mess ? Formula.zahl(Datenbank.wert(r, mess, c)) : 1;
            map.set(k, (map.get(k) || 0) + v);
          });
          return [...map.entries()].map(([name, wert]) => ({ name, wert }));
        }
      }
    }
    /* Aus dem Text */
    return String(block.daten || '').split('\n')
      .map(z => z.trim()).filter(Boolean)
      .map(z => {
        const m = z.match(/^(.*?)[:;,\t]\s*(-?[\d.,]+)\s*$/);
        return m ? { name: m[1].trim(), wert: parseFloat(m[2].replace(',', '.')) || 0 } : null;
      })
      .filter(Boolean);
  };

  const chartSvg = (typ, werte) => {
    const B = 640, H = 260, pad = 34;

    /* Kennzahl: eine grosse Zahl mit Vergleich — Notions „Number" */
    if (typ === 'kpi') {
      const summe = werte.reduce((a, v) => a + v.wert, 0);
      const letzter = werte[werte.length - 1]?.wert ?? 0;
      const vorletzter = werte[werte.length - 2]?.wert ?? 0;
      const diff = vorletzter ? Math.round((letzter - vorletzter) / Math.abs(vorletzter) * 100) : 0;
      const s2 = sv('svg', { viewBox: `0 0 ${B} ${H}`, class: 'chart-svg' });
      const t1 = sv('text', { x: B / 2, y: 118, 'text-anchor': 'middle', 'font-size': 64,
                              'font-weight': 700, fill: 'currentColor' });
      t1.textContent = Formula.anzeige(summe);
      s2.appendChild(t1);
      const t2 = sv('text', { x: B / 2, y: 152, 'text-anchor': 'middle', 'font-size': 15,
                              fill: 'currentColor', opacity: .6 });
      t2.textContent = 'Summe aus ' + werte.length + (werte.length === 1 ? ' Wert' : ' Werten');
      s2.appendChild(t2);
      if (werte.length > 1) {
        const t3 = sv('text', { x: B / 2, y: 186, 'text-anchor': 'middle', 'font-size': 16,
                                fill: diff >= 0 ? '#4dab9a' : '#ff7369' });
        t3.textContent = (diff >= 0 ? '▲ +' : '▼ ') + diff + ' % gegenüber davor';
        s2.appendChild(t3);
      }
      return s2;
    }

    const max = Math.max(...werte.map(v => v.wert), 1);
    const s = sv('svg', { viewBox: `0 0 ${B} ${H}`, class: 'chart-svg', preserveAspectRatio: 'xMidYMid meet' });

    if (typ === 'donut') {
      const summe = werte.reduce((a, v) => a + v.wert, 0) || 1;
      let winkel = -Math.PI / 2;
      const cx = B / 2, cy = H / 2, ra = 100, ri = 58;
      werte.forEach((v, i) => {
        const teil = v.wert / summe * Math.PI * 2;
        const gross = teil > Math.PI ? 1 : 0;
        const x1 = cx + Math.cos(winkel) * ra, y1 = cy + Math.sin(winkel) * ra;
        const x2 = cx + Math.cos(winkel + teil) * ra, y2 = cy + Math.sin(winkel + teil) * ra;
        const x3 = cx + Math.cos(winkel + teil) * ri, y3 = cy + Math.sin(winkel + teil) * ri;
        const x4 = cx + Math.cos(winkel) * ri, y4 = cy + Math.sin(winkel) * ri;
        const st = sv('path', {
          d: `M${x1} ${y1} A${ra} ${ra} 0 ${gross} 1 ${x2} ${y2} L${x3} ${y3} A${ri} ${ri} 0 ${gross} 0 ${x4} ${y4} Z`,
          fill: PALETTE[i % PALETTE.length], class: 'ch-teil'
        });
        st.dataset.i = i;
        st.appendChild(sv('title')).textContent = v.name + ': ' + Formula.anzeige(v.wert);
        s.appendChild(st);
        winkel += teil;
      });
      const t = sv('text', { x: cx, y: cy + 6, 'text-anchor': 'middle', 'font-size': 20, fill: 'currentColor' });
      t.textContent = Formula.anzeige(werte.reduce((a, v) => a + v.wert, 0));
      s.appendChild(t);
      return s;
    }

    /* Achsen */
    for (let i = 0; i <= 4; i++) {
      const y = pad + (H - pad * 2) * i / 4;
      s.appendChild(sv('line', { x1: pad, y1: y, x2: B - 8, y2: y, stroke: 'currentColor', opacity: .13 }));
      const t = sv('text', { x: pad - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 10, fill: 'currentColor', opacity: .55 });
      t.textContent = Math.round(max * (1 - i / 4));
      s.appendChild(t);
    }

    const n = werte.length;
    const feld = (B - pad - 12) / n;

    if (typ === 'line' || typ === 'area') {
      const punkte = werte.map((v, i) => [
        pad + feld * (i + 0.5),
        pad + (H - pad * 2) * (1 - v.wert / max)
      ]);
      if (typ === 'area') {
        s.appendChild(sv('path', {
          d: `M${punkte[0][0]} ${H - pad} L` + punkte.map(p => p.join(' ')).join(' L') +
             ` L${punkte[n - 1][0]} ${H - pad} Z`,
          fill: PALETTE[0], opacity: .22
        }));
      }
      s.appendChild(sv('path', {
        d: 'M' + punkte.map(p => p.join(' ')).join(' L'),
        stroke: PALETTE[0], 'stroke-width': 2.5, fill: 'none', 'stroke-linejoin': 'round'
      }));
      punkte.forEach((p, i) => {
        const c = sv('circle', { cx: p[0], cy: p[1], r: 4, fill: PALETTE[0], class: 'ch-teil' });
        c.dataset.i = i;
        c.appendChild(sv('title')).textContent = werte[i].name + ': ' + Formula.anzeige(werte[i].wert);
        s.appendChild(c);
      });
    } else {
      werte.forEach((v, i) => {
        const h = (H - pad * 2) * (v.wert / max);
        if (typ === 'bar' || typ === 'column') {
          const rc = sv('rect', {
            x: pad + feld * i + feld * 0.16, y: H - pad - h,
            width: feld * 0.68, height: Math.max(1, h),
            fill: PALETTE[i % PALETTE.length], rx: 3, class: 'ch-teil'
          });
          rc.dataset.i = i;
          rc.appendChild(sv('title')).textContent = v.name + ': ' + Formula.anzeige(v.wert);
          s.appendChild(rc);
          /* Der Wert über dem Balken — Notion zeigt ihn nur beim Überfahren. */
          const wt = sv('text', { x: pad + feld * i + feld * 0.5, y: Math.max(12, H - pad - h - 5),
                                  'text-anchor': 'middle', 'font-size': 10.5,
                                  fill: 'currentColor', opacity: .75 });
          wt.textContent = Formula.anzeige(v.wert);
          s.appendChild(wt);
        }
      });
    }

    /* Beschriftung unten */
    werte.forEach((v, i) => {
      const t = sv('text', {
        x: pad + feld * (i + 0.5), y: H - pad + 15, 'text-anchor': 'middle',
        'font-size': 10.5, fill: 'currentColor', opacity: .7
      });
      t.textContent = String(v.name).slice(0, 12);
      s.appendChild(t);
    });
    return s;
  };

  const datenEditor = (block) => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Daten des Diagramms</div>' +
        '<div style="padding:14px 18px">' +
          '<textarea id="cd" rows="10" style="width:100%; background:var(--bg-input); border:1px solid var(--line);' +
          'border-radius:8px; padding:10px 12px; outline:none; font:13.5px var(--mono); resize:vertical">' +
          esc(block.daten || 'Montag: 12\nDienstag: 18\nMittwoch: 9') + '</textarea>' +
          '<div style="margin-top:10px; font-size:12.5px; color:var(--text-dim)">' +
          'Eine Zeile je Wert: <code>Name: Zahl</code></div>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button>' +
        '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    const ta = o.querySelector('#cd');
    ta.focus();
    o.addEventListener('click', e => {
      if (e.target.closest('[data-a="ok"]')) {
        Store.updateBlock(block.id, { daten: ta.value });
        o.remove(); App.zeichneSeite();
      } else if (e.target.closest('[data-a="zu"]') || e.target === o) o.remove();
    });
  };

  /* ========================================================================
   * 3. EINFACHE TABELLE  (Notions „Simple table" — ohne Datenbank)
   * ======================================================================*/
  const tabelle = (block) => {
    const rows = block.rows && block.rows.length ? block.rows : [['', '', ''], ['', '', ''], ['', '', '']];
    const kopf = block.kopfZeile !== false;
    const kopfSpalte = !!block.kopfSpalte;

    const w = document.createElement('div');
    w.className = 'stab-wrap';

    const t = document.createElement('table');
    t.className = 'stab' + (kopf ? ' kopf' : '') + (kopfSpalte ? ' kopfspalte' : '');

    rows.forEach((zeile, y) => {
      const tr = document.createElement('tr');
      zeile.forEach((zelle, x) => {
        const td = document.createElement(kopf && y === 0 ? 'th' : 'td');
        td.contentEditable = 'true';
        td.spellcheck = false;
        td.innerHTML = Blocks.inline(zelle || '');
        td.dataset.x = x; td.dataset.y = y;
        td.addEventListener('input', () => {
          rows[y][x] = td.textContent;
          Store.updateBlock(block.id, { rows });
        });
        td.addEventListener('keydown', e => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const naechste = t.querySelectorAll('td,th');
            const i = [...naechste].indexOf(td);
            const z = naechste[i + (e.shiftKey ? -1 : 1)];
            if (z) { z.focus(); document.execCommand?.('selectAll', false, null); }
          }
        });
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    w.appendChild(t);

    /* --- Griffe über den Spalten und neben den Zeilen -------------------- */
    /* Genau wie in Notion: beim Überfahren erscheinen zwei kleine Griffe.
       Ein Klick öffnet das Menü für diese Spalte oder diese Zeile. */
    const gX = document.createElement('div'); gX.className = 'stab-griff x';
    const gY = document.createElement('div'); gY.className = 'stab-griff y';
    w.append(gX, gY);
    let aktivX = 0, aktivY = 0;

    t.addEventListener('mouseover', (e) => {
      const zelle = e.target.closest('td,th');
      if (!zelle) return;
      aktivX = +zelle.dataset.x; aktivY = +zelle.dataset.y;
      const rz = zelle.getBoundingClientRect();
      const rw = w.getBoundingClientRect();
      gX.style.left = (rz.left - rw.left) + 'px';
      gX.style.width = rz.width + 'px';
      gX.style.top = '2px';
      gY.style.top = (rz.top - rw.top) + 'px';
      gY.style.height = rz.height + 'px';
      gY.style.left = '2px';
      gX.classList.add('da'); gY.classList.add('da');
    });
    w.addEventListener('mouseleave', () => { gX.classList.remove('da'); gY.classList.remove('da'); });

    const sichern = () => { Store.updateBlock(block.id, { rows }); App.zeichneSeite(); };

    gX.addEventListener('click', () => {
      const r = gX.getBoundingClientRect();
      const m = UI.menu(
        `<div class="grp">Spalte ${aktivX + 1}</div>` +
        '<button data-a="links"><span class="mi">←</span>Spalte links einfügen</button>' +
        '<button data-a="rechts"><span class="mi">→</span>Spalte rechts einfügen</button>' +
        '<button data-a="vor"><span class="mi">⇤</span>Nach links schieben</button>' +
        '<button data-a="zurueck"><span class="mi">⇥</span>Nach rechts schieben</button>' +
        `<button data-a="kopfsp"><span class="mi">▤</span>Als Kopfspalte<span class="ms">${kopfSpalte ? 'an' : 'aus'}</span></button>` +
        '<button data-a="leeren"><span class="mi">␀</span>Inhalt leeren</button>' +
        '<hr><button data-a="weg"><span class="mi">🗑</span>Spalte löschen</button>',
        r.left, r.bottom + 6);
      m.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        const a = b.dataset.a; m.remove();
        if (a === 'links')  rows.forEach(z => z.splice(aktivX, 0, ''));
        if (a === 'rechts') rows.forEach(z => z.splice(aktivX + 1, 0, ''));
        if (a === 'weg' && rows[0].length > 1) rows.forEach(z => z.splice(aktivX, 1));
        if (a === 'leeren') rows.forEach(z => z[aktivX] = '');
        if (a === 'vor' && aktivX > 0)
          rows.forEach(z => z.splice(aktivX - 1, 0, z.splice(aktivX, 1)[0]));
        if (a === 'zurueck' && aktivX < rows[0].length - 1)
          rows.forEach(z => z.splice(aktivX + 1, 0, z.splice(aktivX, 1)[0]));
        if (a === 'kopfsp') { Store.updateBlock(block.id, { kopfSpalte: !kopfSpalte }); App.zeichneSeite(); return; }
        sichern();
      });
    });

    gY.addEventListener('click', () => {
      const r = gY.getBoundingClientRect();
      const m = UI.menu(
        `<div class="grp">Zeile ${aktivY + 1}</div>` +
        '<button data-a="oben"><span class="mi">↑</span>Zeile darüber einfügen</button>' +
        '<button data-a="unten"><span class="mi">↓</span>Zeile darunter einfügen</button>' +
        '<button data-a="hoch"><span class="mi">⇧</span>Nach oben schieben</button>' +
        '<button data-a="runter"><span class="mi">⇩</span>Nach unten schieben</button>' +
        `<button data-a="kopf"><span class="mi">▥</span>Als Kopfzeile<span class="ms">${kopf ? 'an' : 'aus'}</span></button>` +
        '<button data-a="dup"><span class="mi">⧉</span>Zeile duplizieren</button>' +
        '<button data-a="leeren"><span class="mi">␀</span>Inhalt leeren</button>' +
        '<hr><button data-a="weg"><span class="mi">🗑</span>Zeile löschen</button>',
        r.right + 6, r.top);
      m.addEventListener('click', e => {
        const b = e.target.closest('button[data-a]');
        if (!b) return;
        const a = b.dataset.a; m.remove();
        const leer = () => new Array(rows[0].length).fill('');
        if (a === 'oben')   rows.splice(aktivY, 0, leer());
        if (a === 'unten')  rows.splice(aktivY + 1, 0, leer());
        if (a === 'weg' && rows.length > 1) rows.splice(aktivY, 1);
        if (a === 'dup')    rows.splice(aktivY + 1, 0, rows[aktivY].slice());
        if (a === 'leeren') rows[aktivY] = leer();
        if (a === 'hoch' && aktivY > 0)
          rows.splice(aktivY - 1, 0, rows.splice(aktivY, 1)[0]);
        if (a === 'runter' && aktivY < rows.length - 1)
          rows.splice(aktivY + 1, 0, rows.splice(aktivY, 1)[0]);
        if (a === 'kopf') { Store.updateBlock(block.id, { kopfZeile: !kopf }); App.zeichneSeite(); return; }
        sichern();
      });
    });

    /* Rechtsklick in einer Zelle öffnet dasselbe Menü */
    t.addEventListener('contextmenu', (e) => {
      const zelle = e.target.closest('td,th');
      if (!zelle) return;
      e.preventDefault();
      aktivX = +zelle.dataset.x; aktivY = +zelle.dataset.y;
      gY.click();
    });

    const werkzeuge = document.createElement('div');
    werkzeuge.className = 'stab-tools';
    werkzeuge.innerHTML =
      '<button data-a="sp+">Spalte +</button><button data-a="sp-">Spalte −</button>' +
      '<button data-a="ze+">Zeile +</button><button data-a="ze-">Zeile −</button>' +
      `<button data-a="kopf" class="${kopf ? 'on' : ''}">Kopfzeile</button>` +
      `<button data-a="kopfsp" class="${kopfSpalte ? 'on' : ''}">Kopfspalte</button>` +
      '<button data-a="csv">Als CSV</button>';
    werkzeuge.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'sp+') rows.forEach(z => z.push(''));
      if (a === 'sp-' && rows[0].length > 1) rows.forEach(z => z.pop());
      if (a === 'ze+') rows.push(new Array(rows[0].length).fill(''));
      if (a === 'ze-' && rows.length > 1) rows.pop();
      if (a === 'kopf')   { Store.updateBlock(block.id, { kopfZeile: !kopf }); App.zeichneSeite(); return; }
      if (a === 'kopfsp') { Store.updateBlock(block.id, { kopfSpalte: !kopfSpalte }); App.zeichneSeite(); return; }
      if (a === 'csv') {
        const csv = rows.map(z => z.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const l = document.createElement('a');
        l.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        l.download = 'tabelle.csv'; l.click();
        UI.toast('Tabelle als CSV gespeichert');
        return;
      }
      Store.updateBlock(block.id, { rows });
      App.zeichneSeite();
    });
    w.appendChild(werkzeuge);
    return w;
  };

  /* ========================================================================
   * 4. MATHEMATIK
   * ------------------------------------------------------------------------
   * Ein kleiner LaTeX-Übersetzer. Deckt ab, was in Notizen wirklich
   * vorkommt: Brüche, Wurzeln, Hoch/Tief, Summen, griechische Buchstaben.
   * ======================================================================*/
  const GRIECHISCH = {
    alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', zeta:'ζ', eta:'η', theta:'θ',
    iota:'ι', kappa:'κ', lambda:'λ', mu:'μ', nu:'ν', xi:'ξ', pi:'π', rho:'ρ', sigma:'σ',
    tau:'τ', phi:'φ', chi:'χ', psi:'ψ', omega:'ω',
    Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Xi:'Ξ', Pi:'Π', Sigma:'Σ', Phi:'Φ', Psi:'Ψ', Omega:'Ω'
  };
  const ZEICHEN = {
    times:'×', div:'÷', pm:'±', mp:'∓', cdot:'·', leq:'≤', geq:'≥', neq:'≠', approx:'≈',
    equiv:'≡', propto:'∝', infty:'∞', partial:'∂', nabla:'∇', forall:'∀', exists:'∃',
    in:'∈', notin:'∉', subset:'⊂', supset:'⊃', cup:'∪', cap:'∩', emptyset:'∅',
    rightarrow:'→', leftarrow:'←', Rightarrow:'⇒', Leftarrow:'⇐', leftrightarrow:'↔',
    sum:'∑', prod:'∏', int:'∫', iint:'∬', oint:'∮', sqrt:'√', angle:'∠', deg:'°',
    ldots:'…', cdots:'⋯', therefore:'∴', because:'∵', ne:'≠', le:'≤', ge:'≥'
  };

  const mathe = (roh) => {
    let s = esc(roh || '');

    /* \frac{a}{b} */
    for (let i = 0; i < 4; i++) {
      s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,
        '<span class="mfrac"><span class="mz">$1</span><span class="mn">$2</span></span>');
    }
    /* \sqrt{a} und \sqrt[n]{a} */
    s = s.replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, '<sup class="mw">$1</sup>√<span class="munter">$2</span>');
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="munter">$1</span>');
    /* \text{…} */
    s = s.replace(/\\(?:text|mathrm)\{([^{}]*)\}/g, '<span class="mtext">$1</span>');
    /* Hoch und tief */
    s = s.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>').replace(/\^(\w)/g, '<sup>$1</sup>');
    s = s.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>').replace(/_(\w)/g, '<sub>$1</sub>');
    /* Befehle */
    s = s.replace(/\\([A-Za-z]+)/g, (_, name) =>
      GRIECHISCH[name] || ZEICHEN[name] || ('<span class="mop">' + name + '</span>'));
    /* Reste */
    s = s.replace(/[{}]/g, '');
    return '<span class="mathe">' + s + '</span>';
  };

  /** Der Formelblock: zeigt gerendert, beim Klick erscheint die Quelle. */
  const formelBlock = (block) => {
    const w = document.createElement('div');
    w.className = 'eq';

    const anzeige = document.createElement('div');
    anzeige.className = 'eq-out';
    anzeige.innerHTML = block.text ? mathe(block.text)
      : '<span style="color:var(--text-faint); font-size:14px">Formel eintippen — z. B. E = mc^2 oder \\frac{a}{b}</span>';

    const quelle = document.createElement('textarea');
    quelle.className = 'eq-src';
    quelle.value = block.text || '';
    quelle.rows = 2;
    quelle.spellcheck = false;
    quelle.style.display = 'none';
    quelle.placeholder = '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}';

    anzeige.addEventListener('click', () => {
      anzeige.style.display = 'none';
      quelle.style.display = '';
      quelle.focus();
    });
    const zurueck = () => {
      Store.updateBlock(block.id, { text: quelle.value });
      anzeige.innerHTML = quelle.value ? mathe(quelle.value)
        : '<span style="color:var(--text-faint); font-size:14px">Formel eintippen …</span>';
      quelle.style.display = 'none';
      anzeige.style.display = '';
    };
    quelle.addEventListener('blur', zurueck);
    quelle.addEventListener('input', () => Store.updateBlock(block.id, { text: quelle.value }));
    quelle.addEventListener('keydown', e => { if (e.key === 'Escape') zurueck(); });

    w.appendChild(anzeige);
    w.appendChild(quelle);
    return w;
  };

  /* ========================================================================
   * 5. SYNTAX-EINFÄRBUNG FÜR CODEBLÖCKE
   * ------------------------------------------------------------------------
   * Kein fremdes Paket, sondern ein kleiner Zerleger: Kommentare, Texte,
   * Zahlen, Schlüsselwörter. Deckt die Sprachen ab, die in Notizen
   * wirklich vorkommen.
   * ======================================================================*/
  const SCHLUESSEL = {
    javascript: 'const let var function return if else for while do switch case break continue new class extends super this typeof instanceof await async try catch finally throw import export default null undefined true false',
    typescript: 'const let var function return if else for while interface type enum implements public private readonly await async class extends import export null undefined true false',
    python:     'def class return if elif else for while in not and or is None True False import from as with try except finally raise lambda yield global pass break continue',
    java:       'public private protected class interface extends implements return if else for while new static final void int double String boolean true false null import package try catch',
    'c++':      'int double float char void class struct public private return if else for while new delete const static template typename namespace using include true false nullptr',
    'c#':       'public private class interface var return if else foreach for while new static void string int bool true false null using namespace try catch',
    go:         'func package import return if else for range var const type struct interface go defer chan map nil true false',
    rust:       'fn let mut struct enum impl trait pub use mod match if else for while loop return Some None Ok Err true false',
    php:        'function class return if else foreach for while new public private echo print require include namespace use true false null',
    ruby:       'def class module return if elsif else unless while do end require attr_accessor true false nil yield',
    sql:        'select from where group by order having join left right inner outer on as insert into values update set delete create table alter drop index and or not null distinct limit',
    html:       '',
    css:        '',
    json:       'true false null',
    bash:       'if then else fi for while do done case esac function return export echo cd ls sudo apt npm git',
    yaml:       'true false null',
    markdown:   ''
  };

  const einfaerben = (code, sprache) => {
    const lang = String(sprache || '').toLowerCase().replace('plain text', '');
    const roh = esc(code);
    if (!lang || lang === 'markdown') return roh;

    if (lang === 'html' || lang === 'xml') {
      return roh
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="c-kom">$1</span>')
        .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="c-schl">$2</span>')
        .replace(/([a-zA-Z-]+)=(&quot;[^&]*?&quot;|"[^"]*")/g,
                 '<span class="c-attr">$1</span>=<span class="c-txt">$2</span>');
    }
    if (lang === 'css' || lang === 'scss' || lang === 'less') {
      return roh
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="c-kom">$1</span>')
        .replace(/^([^{}\n]+)(\{)/gm, '<span class="c-schl">$1</span>$2')
        .replace(/([a-z-]+)(\s*:\s*)([^;\n]+)(;)/g,
                 '<span class="c-attr">$1</span>$2<span class="c-txt">$3</span>$4');
    }

    const woerter = (SCHLUESSEL[lang] || SCHLUESSEL.javascript).split(' ').filter(Boolean);
    let out = roh;

    /* Erst Texte und Kommentare wegsichern, damit dort nichts eingefärbt wird */
    /* Der Platzhalter darf keine Ziffern enthalten — sonst färbt die
       Zahlen-Regel weiter unten den Platzhalter selbst ein und zerstört ihn.
       Deshalb steckt der Index in einem Zeichen aus dem privaten Bereich. */
    const sicher = [];
    const parke = (treffer, klasse) => {
      sicher.push('<span class="' + klasse + '">' + treffer + '</span>');
      return '\u0002' + String.fromCharCode(0xE000 + sicher.length - 1) + '\u0002';
    };

    out = out
      .replace(/(&quot;[^&]*?&quot;|'[^'\n]*'|`[^`]*`|"[^"\n]*")/g, m => parke(m, 'c-txt'))
      .replace(/(\/\/[^\n]*|#[^\n]*|--[^\n]*)/g, m => parke(m, 'c-kom'))
      .replace(/(\/\*[\s\S]*?\*\/|&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, m => parke(m, 'c-kom'));

    if (woerter.length) {
      const re = new RegExp('\\b(' + woerter.join('|') + ')\\b', 'g');
      out = out.replace(re, '<span class="c-schl">$1</span>');
    }
    out = out.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="c-zahl">$1</span>');
    out = out.replace(/([a-zA-Z_][\w]*)(\()/g, '<span class="c-fkt">$1</span>$2');

    return out.replace(/\u0002([\uE000-\uF8FF])\u0002/g,
      (_, z) => sicher[z.charCodeAt(0) - 0xE000]);
  };

  return { whiteboard, diagramm, tabelle, mathe, formelBlock, chartSvg, chartDaten,
           einfaerben, SCHLUESSEL, PALETTE };
})();

window.Zusatz = Zusatz;
