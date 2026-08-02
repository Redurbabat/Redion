/* ============================================================================
 * database.js — Datenbanken
 * ----------------------------------------------------------------------------
 * Eine Datenbank besteht aus drei Teilen, genau wie bei Notion:
 *
 *   block      type 'database'  – der sichtbare Container auf der Seite
 *   collection                  – das Schema: welche Spalten gibt es
 *   views                       – Layout, Filter, Sortierung, sichtbare Spalten
 *
 * Eine Zeile ist ein Block vom Typ 'page' mit parentTable 'collection'.
 * Dadurch kann jede Zeile eine eigene Seite mit eigenem Inhalt haben.
 * ==========================================================================*/

const Datenbank = (() => {

  const esc = Blocks.esc;

  /* ========================================================================
   * DIE EIGENSCHAFTSTYPEN
   * ======================================================================*/
  const TYPEN = [
    { id:'title',      name:'Titel',            icon:'T'  },
    { id:'text',       name:'Text',             icon:'≡'  },
    { id:'number',     name:'Zahl',             icon:'#'  },
    { id:'select',     name:'Auswahl',          icon:'⊙'  },
    { id:'multi',      name:'Mehrfachauswahl',  icon:'⊞'  },
    { id:'status',     name:'Status',           icon:'◐'  },
    { id:'date',       name:'Datum',            icon:'📅' },
    { id:'person',     name:'Person',           icon:'👤' },
    { id:'checkbox',   name:'Kontrollkästchen', icon:'☑'  },
    { id:'url',        name:'URL',              icon:'🔗' },
    { id:'email',      name:'E-Mail',           icon:'✉'  },
    { id:'phone',      name:'Telefon',          icon:'☎'  },
    { id:'formula',    name:'Formel',           icon:'∑'  },
    { id:'created',    name:'Erstellt am',      icon:'🕐' },
    { id:'edited',     name:'Zuletzt geändert', icon:'🕑' },
    { id:'files',      name:'Dateien',          icon:'📎' },
    { id:'relation',   name:'Verknüpfung',      icon:'⇄'  },
    { id:'rollup',     name:'Rollup',           icon:'⤴'  },
    { id:'uid',        name:'Laufende Nummer',  icon:'ID' },
    { id:'button',     name:'Knopf',            icon:'🔘' },
    { id:'ki',         name:'KI-Feld',          icon:'✨' }
  ];

  const propTyp = (id) => TYPEN.find(t => t.id === id) || TYPEN[1];

  const FARBEN = ['gray','brown','orange','yellow','green','blue','purple','pink','red'];

  /* Welche Filter-Operatoren gibt es zu welchem Typ? (aus Teil 7 der Doku) */
  const OPERATOREN = {
    text:     ['enthält','enthält nicht','ist','ist nicht','beginnt mit','endet mit','ist leer','ist nicht leer'],
    title:    ['enthält','enthält nicht','ist','ist nicht','beginnt mit','endet mit','ist leer','ist nicht leer'],
    url:      ['enthält','enthält nicht','ist','ist leer','ist nicht leer'],
    email:    ['enthält','enthält nicht','ist','ist leer','ist nicht leer'],
    phone:    ['enthält','enthält nicht','ist','ist leer','ist nicht leer'],
    number:   ['ist gleich','ist nicht gleich','größer als','kleiner als','größer oder gleich','kleiner oder gleich','ist leer','ist nicht leer'],
    select:   ['ist','ist nicht','ist leer','ist nicht leer'],
    status:   ['ist','ist nicht','ist leer','ist nicht leer'],
    multi:    ['enthält','enthält nicht','ist leer','ist nicht leer'],
    person:   ['enthält','enthält nicht','ist leer','ist nicht leer'],
    date:     ['ist','ist vor','ist nach','ist am oder vor','ist am oder nach','ist heute','ist gestern','ist morgen',
               'ist diese Woche','ist letzte Woche','ist nächste Woche','ist dieser Monat','ist letzter Monat',
               'ist in den letzten 7 Tagen','ist in den letzten 30 Tagen','ist in den nächsten 7 Tagen',
               'ist in den nächsten 30 Tagen','liegt in der Vergangenheit','liegt in der Zukunft','ist leer','ist nicht leer'],
    created:  ['ist','ist vor','ist nach','ist heute','ist gestern','ist diese Woche','ist letzte Woche','ist dieser Monat',
               'ist in den letzten 7 Tagen','ist in den letzten 30 Tagen'],
    edited:   ['ist','ist vor','ist nach','ist heute','ist gestern','ist diese Woche','ist letzte Woche','ist dieser Monat',
               'ist in den letzten 7 Tagen','ist in den letzten 30 Tagen'],
    checkbox: ['ist aktiviert','ist nicht aktiviert'],
    formula:  ['enthält','ist','ist gleich','größer als','kleiner als','ist aktiviert','ist nicht aktiviert','ist leer','ist nicht leer'],
    files:    ['ist leer','ist nicht leer'],
    relation: ['enthält','enthält nicht','ist leer','ist nicht leer'],
    rollup:   ['ist gleich','ist nicht gleich','größer als','kleiner als','enthält','ist leer','ist nicht leer'],
    uid:      ['ist gleich','größer als','kleiner als'],
    ki:       ['enthält','enthält nicht','ist','ist leer','ist nicht leer'],
    button:   []
  };

  /* Welche Rollup-Berechnungen gibt es? (Teil 14 der Doku, Kapitel 3.3) */
  const ROLLUP_ARTEN = ['Original zeigen','Anzahl alle','Eindeutige zählen','Werte zählen','Leere zählen',
                        'Gefüllte zählen','Summe','Durchschnitt','Median','Minimum','Maximum','Spanne',
                        'Frühestes Datum','Spätestes Datum','Prozent aktiviert'];

  /* Welche Berechnungen passen unter eine Spalte? */
  const RECHNUNGEN = {
    alle:     ['—','Anzahl alle','Werte zählen','Eindeutige zählen','Leere zählen','Gefüllte zählen','Prozent leer','Prozent gefüllt'],
    number:   ['Summe','Durchschnitt','Median','Minimum','Maximum','Spanne'],
    checkbox: ['Aktivierte zählen','Nicht aktivierte zählen','Prozent aktiviert'],
    date:     ['Frühestes Datum','Spätestes Datum','Zeitspanne']
  };

  /* ========================================================================
   * WERTE LESEN UND ANZEIGEN
   * ======================================================================*/

  /** Liefert den Rohwert einer Spalte für eine Zeile. */
  const wert = (row, key, coll) => {
    const def = coll.schema[key];
    if (!def) return null;

    if (def.type === 'title')   return row.text || '';
    if (def.type === 'created') return row.created;
    if (def.type === 'edited')  return row.edited;

    /* Laufende Nummer: die Position in der Sammlung, wie Notions Unique ID */
    if (def.type === 'uid') {
      const i = Store.rowsOf(coll.id).findIndex(r => r.id === row.id);
      return (def.praefix ? def.praefix + '-' : '') + (i + 1);
    }

    /* Verknüpfung: Liste von IDs anderer Datenbankzeilen oder Seiten */
    if (def.type === 'relation') {
      const v = (row.props || {})[key];
      return Array.isArray(v) ? v : (v ? [v] : []);
    }

    /* Rollup: rechnet über die verknüpften Zeilen */
    if (def.type === 'rollup') return rollupWert(row, def, coll);

    if (def.type === 'formula') {
      const r = Formula.run(def.formula || '', (name) => {
        const k = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
        return k ? wert(row, k, coll) : null;
      });
      return r.ok ? r.wert : '⚠ ' + (r.fehler || 'Fehler');
    }

    const v = (row.props || {})[key];
    if (def.type === 'number')   return v === '' || v == null ? null : Number(v);
    if (def.type === 'checkbox') return !!v;
    if (def.type === 'multi')    return Array.isArray(v) ? v : (v ? String(v).split(',').map(s=>s.trim()) : []);
    return v ?? '';
  };

  /**
   * Rechnet einen Rollup aus: über die Verknüpfung in die Zieldatenbank
   * schauen, dort eine Spalte einsammeln und zusammenfassen.
   */
  const rollupWert = (row, def, coll) => {
    const relDef = coll.schema[def.relation];
    if (!relDef || relDef.type !== 'relation') return '⚠ keine Verknüpfung gewählt';
    const zielColl = Store.getCollection(relDef.ziel);
    if (!zielColl) return '⚠ Zieldatenbank fehlt';

    const ids = wert(row, def.relation, coll) || [];
    const zeilen2 = ids.map(id => Store.getBlock(id)).filter(Boolean);
    const werte = zeilen2.map(z => wert(z, def.zielKey, zielColl));

    const zahlen = werte.map(Formula.zahl).filter(x => !isNaN(x));
    const art = def.rollup || 'Original zeigen';

    switch (art) {
      case 'Original zeigen':   return werte.map(w2 => Formula.anzeige(w2)).join(', ');
      case 'Anzahl alle':       return zeilen2.length;
      case 'Werte zählen':      return werte.filter(w2 => w2 !== '' && w2 != null).length;
      case 'Eindeutige zählen': return new Set(werte.map(w2 => Formula.anzeige(w2))).size;
      case 'Leere zählen':      return werte.filter(w2 => w2 === '' || w2 == null).length;
      case 'Gefüllte zählen':   return werte.filter(w2 => w2 !== '' && w2 != null).length;
      case 'Summe':             return zahlen.reduce((a, b) => a + b, 0);
      case 'Durchschnitt':      return zahlen.length ? +(zahlen.reduce((a, b) => a + b, 0) / zahlen.length).toFixed(2) : 0;
      case 'Median': {
        if (!zahlen.length) return 0;
        const s = zahlen.slice().sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
      }
      case 'Minimum':           return zahlen.length ? Math.min(...zahlen) : 0;
      case 'Maximum':           return zahlen.length ? Math.max(...zahlen) : 0;
      case 'Spanne':            return zahlen.length ? Math.max(...zahlen) - Math.min(...zahlen) : 0;
      case 'Frühestes Datum':   return werte.filter(Boolean).sort()[0] || '';
      case 'Spätestes Datum':   return werte.filter(Boolean).sort().slice(-1)[0] || '';
      case 'Prozent aktiviert': return werte.length
                                  ? Math.round(werte.filter(Boolean).length / werte.length * 100) + ' %' : '0 %';
      default:                  return werte.join(', ');
    }
  };

  /** Baut das HTML für eine Zelle. */
  const zelle = (row, key, coll) => {
    const def = coll.schema[key];
    const v = wert(row, key, coll);

    if (def.type === 'checkbox')
      return `<input type="checkbox" ${v ? 'checked' : ''} data-k="${key}" style="accent-color:var(--accent);cursor:pointer">`;

    if (def.type === 'select' || def.type === 'status') {
      if (!v) return '<span style="color:var(--text-faint)">—</span>';
      const opt = (def.options || []).find(o => o.name === v);
      return `<span class="tag bg-${opt ? opt.color : 'gray'}">${esc(v)}</span>`;
    }

    if (def.type === 'multi') {
      if (!v.length) return '<span style="color:var(--text-faint)">—</span>';
      return v.map(x => {
        const opt = (def.options || []).find(o => o.name === x);
        return `<span class="tag bg-${opt ? opt.color : 'gray'}">${esc(x)}</span>`;
      }).join('');
    }

    if (def.type === 'date' || def.type === 'created' || def.type === 'edited') {
      if (!v) return '<span style="color:var(--text-faint)">—</span>';
      const d = new Date(v);
      if (isNaN(d)) return esc(v);
      return esc(Einstellungen.datum(d, def.type !== 'date'));
    }

    if (def.type === 'url' && v)
      return `<a href="${esc(v)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(v)}</a>`;
    if (def.type === 'email' && v)
      return `<a href="mailto:${esc(v)}" style="color:var(--accent)">${esc(v)}</a>`;

    if ((def.type === 'number' || def.type === 'formula' || def.type === 'rollup') && v != null &&
        (def.anzeige === 'bar' || def.anzeige === 'ring')) {
      const max = def.max || 100;
      const p = Math.max(0, Math.min(100, (Formula.zahl(v) / max) * 100));
      if (def.anzeige === 'ring') {
        return '<div class="ring" style="--p:' + p + '">' +
               '<svg viewBox="0 0 36 36"><circle class="r-bg" cx="18" cy="18" r="15.5"></circle>' +
               '<circle class="r-an" cx="18" cy="18" r="15.5" ' +
               'stroke-dasharray="' + (p * 0.974) + ' 100"></circle></svg>' +
               '<span>' + esc(Formula.anzeige(v)) + '</span></div>';
      }
      return `<div>${esc(Formula.anzeige(v))}<div class="bar"><i style="width:${p}%"></i></div></div>`;
    }

    if (def.type === 'number' && v != null) return String(v);

    if (def.type === 'formula') return esc(Formula.anzeige(v));

    if (def.type === 'uid')
      return `<span style="color:var(--text-dim); font-family:var(--mono); font-size:12.5px">${esc(v)}</span>`;

    if (def.type === 'relation') {
      if (!v.length) return '<span style="color:var(--text-faint)">—</span>';
      return v.map(id => {
        const z = Store.getBlock(id);
        return `<span class="tag bg-blue" data-rel="${id}">${esc(z ? (z.text || 'Ohne Titel') : 'gelöscht')}</span>`;
      }).join('');
    }

    if (def.type === 'rollup')
      return `<span title="${esc(def.rollup || '')}">${esc(Formula.anzeige(v))}</span>`;

    if (def.type === 'button')
      return `<button class="zellen-knopf" data-k="${key}">${esc(def.knopfText || 'Ausführen')}</button>`;

    if (def.type === 'files') {
      const liste = Array.isArray(v) ? v : (v ? [v] : []);
      if (!liste.length) return '<span style="color:var(--text-faint)">—</span>';
      return liste.map(f => `<span class="tag bg-gray">📎 ${esc(String(f).slice(0, 24))}</span>`).join('');
    }

    if (def.type === 'ki' && !v)
      return '<span style="color:var(--text-faint)">✨ leer</span>';

    return esc(v) || '<span style="color:var(--text-faint)">—</span>';
  };

  /* ========================================================================
   * FILTERN, SORTIEREN, GRUPPIEREN
   * ======================================================================*/

  const heute = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

  const trifftZu = (row, regel, coll) => {
    const v = wert(row, regel.key, coll);
    const def = coll.schema[regel.key];
    if (!def) return true;
    const op = regel.op;
    const z = regel.wert;

    const leer = v == null || v === '' || (Array.isArray(v) && !v.length);

    if (op === 'ist leer')        return leer;
    if (op === 'ist nicht leer')  return !leer;
    if (op === 'ist aktiviert')       return !!v;
    if (op === 'ist nicht aktiviert') return !v;

    const t = String(v ?? '').toLowerCase();
    const s = String(z ?? '').toLowerCase();

    if (op === 'enthält')       return Array.isArray(v) ? v.some(x => String(x).toLowerCase().includes(s)) : t.includes(s);
    if (op === 'enthält nicht') return Array.isArray(v) ? !v.some(x => String(x).toLowerCase().includes(s)) : !t.includes(s);
    if (op === 'ist')           return t === s;
    if (op === 'ist nicht')     return t !== s;
    if (op === 'beginnt mit')   return t.startsWith(s);
    if (op === 'endet mit')     return t.endsWith(s);

    const a = parseFloat(v), b = parseFloat(z);
    if (op === 'ist gleich')          return a === b;
    if (op === 'ist nicht gleich')    return a !== b;
    if (op === 'größer als')          return a >  b;
    if (op === 'kleiner als')         return a <  b;
    if (op === 'größer oder gleich')  return a >= b;
    if (op === 'kleiner oder gleich') return a <= b;

    /* Datumsvergleiche */
    const dv = v ? new Date(v) : null;
    if (dv && !isNaN(dv)) {
      const dz = z ? new Date(z) : null;
      const tag = new Date(dv); tag.setHours(0,0,0,0);
      const h = heute();
      const tage = (n) => { const d = new Date(h); d.setDate(d.getDate() + n); return d; };
      /* Wochenanfang nach Einstellung (Montag oder Sonntag) */
      const wocheAb = (versatz) => {
        const start = Einstellungen.wochenstart();
        const d = new Date(h);
        const diff = (d.getDay() - start + 7) % 7;
        d.setDate(d.getDate() - diff + versatz * 7);
        return d;
      };
      const jetzt = new Date();

      if (op === 'ist heute')    return tag.getTime() === h.getTime();
      if (op === 'ist gestern')  return tag.getTime() === tage(-1).getTime();
      if (op === 'ist morgen')   return tag.getTime() === tage(1).getTime();
      if (op === 'ist diese Woche')   return tag >= wocheAb(0)  && tag < new Date(wocheAb(1));
      if (op === 'ist letzte Woche')  return tag >= wocheAb(-1) && tag < new Date(wocheAb(0));
      if (op === 'ist nächste Woche') return tag >= wocheAb(1)  && tag < new Date(wocheAb(2));
      if (op === 'ist dieser Monat')  return dv.getMonth() === jetzt.getMonth() && dv.getFullYear() === jetzt.getFullYear();
      if (op === 'ist letzter Monat') {
        const l = new Date(jetzt.getFullYear(), jetzt.getMonth() - 1, 1);
        return dv.getMonth() === l.getMonth() && dv.getFullYear() === l.getFullYear();
      }
      if (op === 'ist in den letzten 7 Tagen')  return tag >= tage(-7)  && tag <= h;
      if (op === 'ist in den letzten 30 Tagen') return tag >= tage(-30) && tag <= h;
      if (op === 'ist in den nächsten 7 Tagen') return tag >= h && tag <= tage(7);
      if (op === 'ist in den nächsten 30 Tagen')return tag >= h && tag <= tage(30);
      if (op === 'liegt in der Vergangenheit')  return dv < jetzt;
      if (op === 'liegt in der Zukunft')        return dv > jetzt;
      if (dz && !isNaN(dz)) {
        if (op === 'ist')             return tag.getTime() === new Date(dz.setHours(0,0,0,0)).getTime();
        if (op === 'ist vor')         return dv <  dz;
        if (op === 'ist nach')        return dv >  dz;
        if (op === 'ist am oder vor') return dv <= dz;
        if (op === 'ist am oder nach')return dv >= dz;
      }
    }
    return true;
  };

  /**
   * Prüft eine Filtergruppe. Eine Gruppe hat einen Operator und Regeln;
   * eine Regel kann selbst wieder eine Gruppe sein — beliebig tief.
   */
  const gruppeTrifftZu = (row, gruppe, coll, tiefe = 0) => {
    if (!gruppe || !(gruppe.rules || []).length) return true;
    if (tiefe > 5) return true;
    const pruef = (r) => (r.rules !== undefined)
      ? gruppeTrifftZu(row, r, coll, tiefe + 1)
      : trifftZu(row, r, coll);
    return gruppe.operator === 'or'
      ? gruppe.rules.some(pruef)
      : gruppe.rules.every(pruef);
  };

  /** Zählt alle Regeln einer Gruppe, auch die in Untergruppen. */
  const regelAnzahl = (gruppe) => (gruppe?.rules || []).reduce(
    (n, r) => n + (r.rules !== undefined ? regelAnzahl(r) : 1), 0);

  const gefiltert = (rows, view, coll) => {
    const f = view.filters || { operator:'and', rules:[] };
    if (!f.rules || !f.rules.length) return rows;
    return rows.filter(r => gruppeTrifftZu(r, f, coll));
  };

  const sortiert = (rows, view, coll) => {
    /* Ohne eigene Sortierregel gilt die von Hand gezogene Reihenfolge. */
    if (!(view.sorts || []).length && rows.some(r => r.ordnung != null)) {
      return rows.slice().sort((a, b) =>
        (a.ordnung ?? 1e9) - (b.ordnung ?? 1e9) || a.created.localeCompare(b.created));
    }
    if (!view.sorts || !view.sorts.length) return rows;
    return rows.slice().sort((a, b) => {
      for (const s of view.sorts) {
        let x = wert(a, s.key, coll), y = wert(b, s.key, coll);
        if (x instanceof Date) x = x.getTime();
        if (y instanceof Date) y = y.getTime();
        if (typeof x === 'string' && typeof y === 'string') {
          const c = x.localeCompare(y, 'de');
          if (c) return s.richtung === 'ab' ? -c : c;
        } else {
          const nx = parseFloat(x) || 0, ny = parseFloat(y) || 0;
          if (nx !== ny) return s.richtung === 'ab' ? ny - nx : nx - ny;
        }
      }
      return 0;
    });
  };

  const zeilen = (coll, view) => {
    const alle = sortiert(gefiltert(Store.rowsOf(coll.id), view, coll), view, coll);
    return view.limit ? alle.slice(0, view.limit) : alle;
  };

  /* ========================================================================
   * BERECHNUNGEN UNTER DER SPALTE
   * ======================================================================*/
  const rechne = (art, rows, key, coll) => {
    const werte = rows.map(r => wert(r, key, coll));
    const zahlen = werte.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const gefuellt = werte.filter(v => v != null && v !== '' && !(Array.isArray(v) && !v.length));

    switch (art) {
      case 'Anzahl alle':        return rows.length;
      case 'Werte zählen':       return gefuellt.length;
      case 'Eindeutige zählen':  return new Set(gefuellt.map(String)).size;
      case 'Leere zählen':       return rows.length - gefuellt.length;
      case 'Gefüllte zählen':    return gefuellt.length;
      case 'Prozent leer':       return rows.length ? Math.round((rows.length - gefuellt.length) / rows.length * 100) + '%' : '0%';
      case 'Prozent gefüllt':    return rows.length ? Math.round(gefuellt.length / rows.length * 100) + '%' : '0%';
      case 'Summe':              return zahlen.reduce((s, x) => s + x, 0);
      case 'Durchschnitt':       return zahlen.length ? Math.round(zahlen.reduce((s,x)=>s+x,0) / zahlen.length * 100) / 100 : 0;
      case 'Median': {
        const s = zahlen.slice().sort((a,b)=>a-b);
        if (!s.length) return 0;
        const m = Math.floor(s.length/2);
        return s.length % 2 ? s[m] : (s[m-1]+s[m])/2;
      }
      case 'Minimum':            return zahlen.length ? Math.min(...zahlen) : 0;
      case 'Maximum':            return zahlen.length ? Math.max(...zahlen) : 0;
      case 'Spanne':             return zahlen.length ? Math.max(...zahlen) - Math.min(...zahlen) : 0;
      case 'Aktivierte zählen':      return werte.filter(Boolean).length;
      case 'Nicht aktivierte zählen':return werte.filter(v => !v).length;
      case 'Prozent aktiviert':  return rows.length ? Math.round(werte.filter(Boolean).length / rows.length * 100) + '%' : '0%';
      case 'Frühestes Datum': {
        const d = gefuellt.map(v => new Date(v)).filter(d => !isNaN(d));
        return d.length ? new Date(Math.min(...d)).toLocaleDateString('de-DE') : '—';
      }
      case 'Spätestes Datum': {
        const d = gefuellt.map(v => new Date(v)).filter(d => !isNaN(d));
        return d.length ? new Date(Math.max(...d)).toLocaleDateString('de-DE') : '—';
      }
      default: return '';
    }
  };

  /* ========================================================================
   * RENDERN
   * ======================================================================*/
  const render = (block) => {
    const coll = Store.getCollection(block.collectionId);
    const w = document.createElement('div');
    w.className = 'db';

    if (!coll) {
      w.innerHTML = '<div style="color:var(--text-faint)">Diese Datenbank wurde nicht gefunden.</div>';
      return w;
    }

    const viewId = block.aktiveView && coll.viewIds.includes(block.aktiveView)
      ? block.aktiveView : coll.viewIds[0];
    const view = Store.getView(viewId);
    const rows = zeilen(coll, view);

    /* --- Kopfzeile ------------------------------------------------------- */
    const kopf = document.createElement('div');
    kopf.className = 'db-head';

    const tabs = document.createElement('div');
    tabs.className = 'db-tabs';
    coll.viewIds.forEach(id => {
      const v = Store.getView(id);
      if (!v) return;
      const b = document.createElement('button');
      b.className = 'db-tab' + (id === viewId ? ' on' : '');
      const ico = { table:'▦', board:'▤', list:'☰', gallery:'▩', calendar:'📅',
                    timeline:'▬', chart:'📊', form:'📝', feed:'📰' }[v.layout] || '▦';
      b.innerHTML = `<span>${ico}</span>${esc(v.name)}`;
      b.addEventListener('click', () => {
        if (id === viewId) { ansichtMenue(b, coll, v, block); return; }
        Store.updateBlock(block.id, { aktiveView: id });
        App.zeichneSeite();
      });
      tabs.appendChild(b);
    });
    const plus = document.createElement('button');
    plus.className = 'db-tab';
    plus.textContent = '+';
    plus.title = 'Neue Ansicht';
    plus.addEventListener('click', () => neueAnsicht(plus, coll, block));
    tabs.appendChild(plus);
    kopf.appendChild(tabs);

    /* --- Werkzeuge ------------------------------------------------------- */
    const tools = document.createElement('div');
    tools.className = 'db-tools';

    const anzahlFilter = regelAnzahl(view.filters);
    tools.innerHTML =
      `<button data-a="filter">⚟ Filter${anzahlFilter ? ' (' + anzahlFilter + ')' : ''}</button>` +
      `<button data-a="sort">↕ Sortieren${view.sorts?.length ? ' (' + view.sorts.length + ')' : ''}</button>` +
      `<button data-a="props">⚙ Eigenschaften</button>` +
      `<button data-a="auto" title="Automationen">⚡${(coll.automationen||[]).length || ''}</button>` +
      `<button data-a="search">🔍</button>` +
      `<button data-a="menu">⋯</button>` +
      `<button class="new" data-a="new">Neu</button>` +
      `<button class="new pfeil" data-a="new-menu" title="Mit Vorlage anlegen">▾</button>`;
    kopf.appendChild(tools);
    w.appendChild(kopf);

    tools.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'new')      { Store.addRow(coll.id, {}); App.zeichneSeite(); }
      if (a === 'new-menu') vorlagenMenue(b, coll, view);
      if (a === 'filter') filterMenue(b, coll, view, block);
      if (a === 'sort')   sortMenue(b, coll, view, block);
      if (a === 'props')  eigenschaftenMenue(b, coll, view, block);
      if (a === 'auto')   automationenMenue(b, coll, view, block);
      if (a === 'search') suchFeld(w, coll, view, block);
      if (a === 'menu')   dbMenue(b, coll, view, block);
    });

    /* --- Aktive Filter als Chips ---------------------------------------- */
    if (anzahlFilter) {
      const chips = document.createElement('div');
      chips.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px';
      view.filters.rules.forEach((r, i) => {
        const c = document.createElement('span');
        c.className = 'chip';
        if (r.rules !== undefined) {
          c.innerHTML = `<b>Gruppe</b> ${r.operator === 'or' ? 'ODER' : 'UND'} · ` +
                        `${regelAnzahl(r)} Regeln <span class="x">✕</span>`;
        } else {
          const name = coll.schema[r.key]?.name || '?';
          c.innerHTML = `<b>${esc(name)}</b> ${esc(r.op)} ${esc(r.wert ?? '')} <span class="x">✕</span>`;
        }
        c.querySelector('.x').addEventListener('click', () => {
          view.filters.rules.splice(i, 1);
          Store.updateView(view.id, { filters: view.filters });
          App.zeichneSeite();
        });
        chips.appendChild(c);
      });
      w.appendChild(chips);
    }

    /* --- Der eigentliche Inhalt ------------------------------------------ */
    const koerper = document.createElement('div');
    if (view.layout === 'board')         koerper.appendChild(alsBoard(coll, view, rows));
    else if (view.layout === 'list')     koerper.appendChild(alsListe(coll, view, rows));
    else if (view.layout === 'gallery')  koerper.appendChild(alsGalerie(coll, view, rows));
    else if (view.layout === 'calendar') koerper.appendChild(alsKalender(coll, view, rows));
    else if (view.layout === 'timeline') koerper.appendChild(alsZeitstrahl(coll, view, rows));
    else if (view.layout === 'chart')    koerper.appendChild(alsDiagramm(coll, view, rows));
    else if (view.layout === 'form')     koerper.appendChild(alsFormular(coll, view, block));
    else if (view.layout === 'feed')     koerper.appendChild(alsFeed(coll, view, rows));
    else                                 koerper.appendChild(alsTabelle(coll, view, rows, block));
    w.appendChild(koerper);

    return w;
  };

  /* --- Tabelle ------------------------------------------------------------ */
  const alsTabelle = (coll, view, rows, block) => {
    const sichtbar = Object.keys(coll.schema).filter(k => !(view.hidden || []).includes(k));

    const t = document.createElement('table');
    t.className = 'grid h-' + (view.hoehe || 'normal');

    /* Kopf */
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');

    /* Ganz links: Auswahlkästchen für alle Zeilen */
    const thAus = document.createElement('th');
    thAus.className = 'th-aus';
    thAus.innerHTML = '<input type="checkbox" title="Alle auswählen">';
    thAus.querySelector('input').addEventListener('change', (e) => {
      const an = e.target.checked;
      t.querySelectorAll('tbody input.zeilen-aus').forEach(cb => { cb.checked = an; });
      auswahlAuffrischen();
    });
    tr.appendChild(thAus);

    sichtbar.forEach(k => {
      const def = coll.schema[k];
      const th = document.createElement('th');
      th.innerHTML = `<span style="opacity:.7">${propTyp(def.type).icon}</span> ${esc(def.name)}` +
                     (def.beschreibung ? `<span class="th-info" title="${esc(def.beschreibung)}">ℹ</span>` : '') +
                     '<span class="th-griff" title="Breite ziehen"></span>';
      const breite = (view.breiten || {})[k];
      if (breite) { th.style.width = breite + 'px'; th.style.minWidth = breite + 'px'; }
      if ((view.fixiert || []) .includes(k)) th.classList.add('fixiert');

      /* Spalten mit der Maus umsortieren */
      th.draggable = true;
      th.addEventListener('dragstart', e => e.dataTransfer.setData('text/spalte', k));
      th.addEventListener('dragover', e => { e.preventDefault(); th.classList.add('ziel'); });
      th.addEventListener('dragleave', () => th.classList.remove('ziel'));
      th.addEventListener('drop', e => {
        e.preventDefault(); th.classList.remove('ziel');
        const q = e.dataTransfer.getData('text/spalte');
        if (!q || q === k) return;
        spalteEinordnen(coll, q, k);
      });
      th.addEventListener('click', (e) => {
        if (e.target.classList.contains('th-griff')) return;
        spaltenMenue(th, coll, view, k, block);
      });

      /* Breite mit der Maus ziehen — wie in Notion */
      th.querySelector('.th-griff').addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        /* Solange gezogen wird, darf der Browser die Spalte nicht als
           Drag-and-drop behandeln — sonst kommen keine Bewegungen mehr an. */
        th.draggable = false;
        const start = e.clientX;
        const b0 = th.getBoundingClientRect().width;
        const zug = (ev) => {
          const b = Math.max(70, Math.min(640, b0 + ev.clientX - start));
          th.style.width = b + 'px';
          th.style.minWidth = b + 'px';
        };
        const stop = () => {
          removeEventListener('pointermove', zug);
          removeEventListener('pointerup', stop);
          const b = Math.round(th.getBoundingClientRect().width);
          Store.updateView(view.id, { breiten: Object.assign({}, view.breiten, { [k]: b }) });
          setTimeout(() => { th.draggable = true; }, 0);
        };
        addEventListener('pointermove', zug);
        addEventListener('pointerup', stop);
      });
      tr.appendChild(th);
    });
    const plus = document.createElement('th');
    plus.textContent = '+';
    plus.style.width = '40px';
    plus.title = 'Eigenschaft hinzufügen';
    plus.addEventListener('click', () => neueEigenschaft(plus, coll, block));
    tr.appendChild(plus);
    thead.appendChild(tr);
    t.appendChild(thead);

    /* Zeilen — Unterelemente hängen unter ihrer Hauptzeile (Notions Sub-items) */
    const tbody = document.createElement('tbody');
    const sichtbareIds = new Set(rows.map(r => r.id));
    const geordnet = [];
    rows.forEach(r => {
      if (r.unterVon && sichtbareIds.has(r.unterVon)) return;
      geordnet.push({ row: r, tiefe: 0 });
      rows.filter(k => k.unterVon === r.id).forEach(k => geordnet.push({ row: k, tiefe: 1 }));
    });

    geordnet.forEach(({ row: r, tiefe }, nr) => {
      const zr = document.createElement('tr');
      if (tiefe) zr.classList.add('unterzeile');
      zr.dataset.rid = r.id;
      zr.draggable = true;

      /* Auswahl und Nummer */
      const tdAus = document.createElement('td');
      tdAus.className = 'td-aus';
      tdAus.innerHTML = `<span class="zeilen-nr">${nr + 1}</span>` +
                        `<input type="checkbox" class="zeilen-aus" data-rid="${r.id}">`;
      tdAus.querySelector('input').addEventListener('change', auswahlAuffrischen);
      zr.appendChild(tdAus);

      /* Zeilen mit der Maus sortieren */
      zr.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/zeile', r.id);
        zr.classList.add('zieht');
      });
      zr.addEventListener('dragend', () => zr.classList.remove('zieht'));
      zr.addEventListener('dragover', e => { e.preventDefault(); zr.classList.add('ziel'); });
      zr.addEventListener('dragleave', () => zr.classList.remove('ziel'));
      zr.addEventListener('drop', e => {
        e.preventDefault(); zr.classList.remove('ziel');
        const quelle = e.dataTransfer.getData('text/zeile');
        if (!quelle || quelle === r.id) return;
        zeileEinordnen(coll, quelle, r.id);
      });
      zr.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        zeilenMenue({ x: e.clientX, y: e.clientY }, r, coll);
      });
      sichtbar.forEach(k => {
        const def = coll.schema[k];
        const td = document.createElement('td');
        if (def.type === 'title') {
          td.className = 'tt';
          td.innerHTML = (tiefe ? '<span class="tt-ein">↳</span>' : '') +
                         `<span class="tt-t">${esc(r.text || 'Ohne Titel')}</span>` +
                         `<button class="tt-auf" title="In der Vorschau öffnen">⤢ Öffnen</button>`;
          td.querySelector('.tt-t').addEventListener('click', () => zeilePeek(r, coll));
          td.querySelector('.tt-auf').addEventListener('click', (e) => { e.stopPropagation(); App.oeffne(r.id); });
        } else {
          td.innerHTML = zelle(r, k, coll);
          if ((view.umbruch || []).includes(k)) td.classList.add('umbruch');
          td.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') {
              Store.setProp(r.id, k, e.target.checked);
              return;
            }
            if (e.target.classList.contains('zellen-knopf')) { knopfInZelle(r, k, coll); return; }
            const rel = e.target.closest('[data-rel]');
            if (rel) { const z = Store.getBlock(rel.dataset.rel); if (z) { zeilePeek(z, zielColl(coll, k) || coll); return; } }
            zelleBearbeiten(td, r, k, coll);
          });
        }
        zr.appendChild(td);
      });
      zr.appendChild(document.createElement('td'));
      tbody.appendChild(zr);
    });

    /* Zeile hinzufügen */
    const neu = document.createElement('tr');
    const ntd = document.createElement('td');
    ntd.colSpan = sichtbar.length + 2;
    ntd.style.cssText = 'color:var(--text-faint); cursor:pointer';
    ntd.textContent = '+ Neu';
    ntd.addEventListener('click', () => { Store.addRow(coll.id, {}); App.zeichneSeite(); });
    neu.appendChild(ntd);
    tbody.appendChild(neu);
    t.appendChild(tbody);

    /* Berechnungen */
    const tfoot = document.createElement('tfoot');
    const ftr = document.createElement('tr');
    ftr.appendChild(document.createElement('td'));
    sichtbar.forEach(k => {
      const td = document.createElement('td');
      const art = (view.calc || {})[k];
      td.style.cursor = 'pointer';
      td.textContent = art && art !== '—' ? art + ': ' + rechne(art, rows, k, coll) : 'Berechnen';
      if (!art || art === '—') td.style.opacity = '0';
      td.addEventListener('mouseenter', () => td.style.opacity = '1');
      td.addEventListener('mouseleave', () => { if (!art || art === '—') td.style.opacity = '0'; });
      td.addEventListener('click', () => rechnenMenue(td, coll, view, k, rows));
      ftr.appendChild(td);
    });
    ftr.appendChild(document.createElement('td'));
    tfoot.appendChild(ftr);
    t.appendChild(tfoot);

    const box = document.createElement('div');
    box.style.overflowX = 'auto';
    box.appendChild(t);
    return box;
  };

  /** Welche Zeilen sind gerade angehakt? */
  const gewaehlteZeilen = () =>
    [...document.querySelectorAll('input.zeilen-aus:checked')].map(cb => cb.dataset.rid);

  /** Zeigt die Leiste mit den Sammelaktionen, sobald etwas angehakt ist. */
  const auswahlAuffrischen = () => {
    const ids = gewaehlteZeilen();
    document.getElementById('sammelleiste')?.remove();
    if (!ids.length) return;

    const erste = Store.getBlock(ids[0]);
    const coll = erste && Store.getCollection(erste.parentId);
    const l = document.createElement('div');
    l.id = 'sammelleiste';
    l.innerHTML =
      `<span><b>${ids.length}</b> ausgewählt</span>` +
      '<button data-a="dup">Duplizieren</button>' +
      '<button data-a="prop">Eigenschaft setzen</button>' +
      '<button data-a="del">Löschen</button>' +
      '<button data-a="weg">✕</button>';
    document.body.appendChild(l);

    l.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'weg') {
        document.querySelectorAll('input.zeilen-aus').forEach(cb => cb.checked = false);
        l.remove(); return;
      }
      if (a === 'del') {
        if (!confirm(ids.length + ' Einträge löschen?')) return;
        ids.forEach(id => Store.trashBlock(id));
        l.remove(); App.zeichneSeite();
        UI.toast(ids.length + ' Einträge gelöscht');
      }
      if (a === 'dup') {
        ids.forEach(id => {
          const r = Store.getBlock(id);
          if (!r || !coll) return;
          const k = Store.addRow(coll.id, JSON.parse(JSON.stringify(r.props || {})));
          Store.updateBlock(k.id, { text: (r.text || '') + ' (Kopie)' });
        });
        l.remove(); App.zeichneSeite();
      }
      if (a === 'prop' && coll) {
        const r = b.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Welche Eigenschaft?</div>' +
          Object.keys(coll.schema).filter(k => coll.schema[k].type !== 'title')
            .map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join(''),
          r.left, r.top - 30);
        m.addEventListener('click', async ev => {
          const kb = ev.target.closest('button[data-k]');
          if (!kb) return;
          m.remove();
          const wert2 = await UI.frage('Welcher Wert für „' + coll.schema[kb.dataset.k].name + '"?', '');
          if (wert2 === null) return;
          ids.forEach(id => Store.setProp(id, kb.dataset.k, wert2));
          l.remove(); App.zeichneSeite();
          UI.toast(ids.length + ' Einträge geändert');
        });
      }
    });
  };

  /** Eine Zeile vor eine andere schieben — die eigene Reihenfolge merken. */
  const zeileEinordnen = (coll, quelleId, zielId) => {
    const alle = Store.rowsOf(coll.id);
    alle.forEach((r, i) => { if (r.ordnung == null) Store.updateBlock(r.id, { ordnung: i }); });
    const liste = Store.rowsOf(coll.id).slice().sort((a, b) => (a.ordnung ?? 0) - (b.ordnung ?? 0));
    const q = liste.findIndex(r => r.id === quelleId);
    const z = liste.findIndex(r => r.id === zielId);
    if (q < 0 || z < 0) return;
    const [weg] = liste.splice(q, 1);
    liste.splice(z, 0, weg);
    liste.forEach((r, i) => Store.updateBlock(r.id, { ordnung: i }));
    App.zeichneSeite();
  };

  /** Eine Spalte vor eine andere schieben. */
  const spalteEinordnen = (coll, quelle, ziel) => {
    const keys = Object.keys(coll.schema);
    const q = keys.indexOf(quelle), z = keys.indexOf(ziel);
    if (q < 0 || z < 0) return;
    keys.splice(q, 1);
    keys.splice(z, 0, quelle);
    const neu = {};
    keys.forEach(k => neu[k] = coll.schema[k]);
    Store.updateCollection(coll.id, { schema: neu });
    App.zeichneSeite();
  };

  /** Die Sammlung, auf die eine Verknüpfungsspalte zeigt. */
  const zielColl = (coll, key) => {
    const def = coll.schema[key];
    return def && def.type === 'relation' ? Store.getCollection(def.ziel) : null;
  };

  /** Ein Knopf in einer Zelle — legt einen Eintrag an oder setzt einen Wert. */
  const knopfInZelle = (row, key, coll) => {
    const def = coll.schema[key];
    const ziel = def.setzeKey;
    if (ziel && coll.schema[ziel]) {
      Store.setProp(row.id, ziel, def.setzeWert ?? '');
      UI.toast(`„${coll.schema[ziel].name}" gesetzt`);
      App.zeichneSeite();
      return;
    }
    /* Ohne Einstellung: fragen, was der Knopf tun soll */
    const m = UI.menu('<div class="grp">Was soll der Knopf setzen?</div>' +
      Object.keys(coll.schema).filter(k => k !== key && coll.schema[k].type !== 'title')
        .map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join(''),
      innerWidth / 2 - 120, 160);
    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      m.remove();
      const w = await UI.frage('Welcher Wert soll gesetzt werden?', '');
      if (w === null) return;
      def.setzeKey = b.dataset.k;
      def.setzeWert = w;
      Store.updateCollection(coll.id, { schema: coll.schema });
      UI.toast('Knopf eingerichtet');
      App.zeichneSeite();
    });
  };

  /* --- KI-Feld: Notions „AI Autofill", nur lokal --------------------------- */
  const kiFeldFuellen = async (row, key, coll) => {
    const def = coll.schema[key];
    const auftrag = def.auftrag ||
      'Fasse diesen Eintrag in einem kurzen Satz zusammen.';

    const zeileAlsText = Object.keys(coll.schema)
      .filter(k => k !== key && !['ki','button'].includes(coll.schema[k].type))
      .map(k => coll.schema[k].name + ': ' + Formula.anzeige(wert(row, k, coll)))
      .join('\n');

    Store.setProp(row.id, key, '… denkt nach');
    App.zeichneSeite();

    const antwort = await KI.frageKurz(
      auftrag + '\n\nDer Eintrag:\n' + zeileAlsText +
      '\n\nAntworte knapp, ohne Einleitung, in höchstens 20 Wörtern.');

    Store.setProp(row.id, key, (antwort || '').trim() || '(keine Antwort)');
    App.zeichneSeite();
  };

  /**
   * Setzt eine Verknüpfung und pflegt die Gegenrichtung.
   * Ist die Spalte wechselseitig eingerichtet, trägt sie sich auf der
   * anderen Seite selbst ein und wieder aus — wie in Notion.
   */
  const relationSetzen = (row, key, coll, neueIds) => {
    const def = coll.schema[key];
    const alt2 = wert(row, key, coll) || [];
    const grenze = def.limit === 1 ? neueIds.slice(-1) : neueIds;
    Store.setProp(row.id, key, grenze);

    if (!def.gegen) return;
    const ziel = Store.getCollection(def.ziel);
    if (!ziel || !ziel.schema[def.gegen]) return;

    /* Bei den Weggefallenen austragen */
    alt2.filter(id => !grenze.includes(id)).forEach(id => {
      const z = Store.getBlock(id);
      if (!z) return;
      const liste = (z.props?.[def.gegen] || []).filter(x => x !== row.id);
      Store.setProp(id, def.gegen, liste);
    });
    /* Bei den Neuen eintragen */
    grenze.filter(id => !alt2.includes(id)).forEach(id => {
      const z = Store.getBlock(id);
      if (!z) return;
      const liste = z.props?.[def.gegen] || [];
      if (!liste.includes(row.id)) Store.setProp(id, def.gegen, [...liste, row.id]);
    });
  };

  /** Richtet eine Verknüpfung ein: Ziel, Gegenrichtung, Limit. */
  const relationEinrichten = (coll, key) => {
    const def = coll.schema[key];
    const alle = Object.values(Store.cache.collections);

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(520px,94vw)">' +
        `<div class="fh">Verknüpfung „${esc(def.name)}"<button class="icon-btn" data-a="zu">✕</button></div>` +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
          '<label>Womit verknüpfen?<br><select id="rz">' +
            alle.map(c => `<option value="${c.id}"${c.id === def.ziel ? ' selected' : ''}>` +
                          `${esc(c.name)}</option>`).join('') +
          '</select></label>' +
          '<label>Wie viele je Zelle?<br><select id="rl">' +
            `<option value="0"${!def.limit ? ' selected' : ''}>Beliebig viele</option>` +
            `<option value="1"${def.limit === 1 ? ' selected' : ''}>Nur eine</option>` +
          '</select></label>' +
          '<label style="display:flex; gap:10px; align-items:center">' +
            `<input type="checkbox" id="rg"${def.gegen ? ' checked' : ''} style="width:auto">` +
            '<span>Wechselseitig — die Gegenseite bekommt eine eigene Spalte</span></label>' +
          '<div style="font-size:12.5px; color:var(--text-faint); line-height:1.5">' +
            'Wechselseitig heisst: Trägst du hier etwas ein, steht es auf der anderen Seite ' +
            'automatisch auch. Rollups brauchen das nicht, funktionieren damit aber sauberer.</div>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (!e.target.closest('[data-a="ok"]')) return;

      const zielId = o.querySelector('#rz').value;
      const limit = +o.querySelector('#rl').value;
      const wechsel = o.querySelector('#rg').checked;

      def.ziel = zielId;
      def.limit = limit;

      const ziel = Store.getCollection(zielId);
      if (wechsel && ziel) {
        if (!def.gegen || !ziel.schema[def.gegen]) {
          const gk = Store.uid().slice(0, 5);
          ziel.schema[gk] = { name: coll.name, type: 'relation', ziel: coll.id, gegen: key, limit: 0 };
          def.gegen = gk;
          Store.updateCollection(ziel.id, { schema: ziel.schema });
        }
      } else if (!wechsel && def.gegen && ziel) {
        delete ziel.schema[def.gegen];
        Store.updateCollection(ziel.id, { schema: ziel.schema });
        def.gegen = '';
      }

      Store.updateCollection(coll.id, { schema: coll.schema });
      o.remove();
      App.zeichneSeite();
      UI.toast('Verknüpfung eingerichtet');
    });
  };

  /* --- Verknüpfungen bearbeiten ------------------------------------------- */
  const relationWaehlen = (row, key, coll) => {
    const def = coll.schema[key];
    let ziel = Store.getCollection(def.ziel);

    /* Noch keine Zieldatenbank? Erst die auswählen. */
    if (!ziel) {
      const alle = Object.values(Store.cache.collections);
      if (!alle.length) { UI.toast('Es gibt noch keine zweite Datenbank'); return; }
      const m = UI.menu('<div class="grp">Womit verknüpfen?</div>' +
        alle.map(c => `<button data-c="${c.id}">${esc(c.name)}</button>`).join(''),
        innerWidth / 2 - 120, 160);
      m.addEventListener('click', e => {
        const b = e.target.closest('button[data-c]');
        if (!b) return;
        def.ziel = b.dataset.c;
        Store.updateCollection(coll.id, { schema: coll.schema });
        m.remove();
        relationWaehlen(row, key, coll);
      });
      return;
    }

    const gewaehlt = new Set(wert(row, key, coll) || []);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        `<div class="fh">Verknüpfen mit „${esc(ziel.name)}"</div>` +
        '<input id="rq" placeholder="Eintrag suchen …" autocomplete="off">' +
        '<div class="res" id="rr"></div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Fertig</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const zeichne = (q = '') => {
      o.querySelector('#rr').innerHTML = Store.rowsOf(ziel.id)
        .filter(z => !q || (z.text || '').toLowerCase().includes(q.toLowerCase()))
        .slice(0, 40)
        .map(z => `<button data-z="${z.id}"><span class="mi">${gewaehlt.has(z.id) ? '☑' : '☐'}</span>` +
                  `<span style="flex:1">${esc(z.text || 'Ohne Titel')}</span></button>`).join('') +
        (q ? `<hr><button data-neu="${esc(q)}"><span class="mi">✚</span>„${esc(q)}" neu anlegen</button>` : '');
    };
    zeichne();
    o.querySelector('#rq').addEventListener('input', e => zeichne(e.target.value));
    o.addEventListener('click', e => {
      if (e.target.closest('[data-a="ok"]') || e.target === o) {
        relationSetzen(row, key, coll, [...gewaehlt]);
        o.remove(); App.zeichneSeite();
        return;
      }
      const neu = e.target.closest('button[data-neu]');
      if (neu) {
        const z = Store.addRow(ziel.id, {});
        Store.updateBlock(z.id, { text: neu.dataset.neu });
        gewaehlt.add(z.id);
        zeichne(); return;
      }
      const b = e.target.closest('button[data-z]');
      if (!b) return;
      if (gewaehlt.has(b.dataset.z)) gewaehlt.delete(b.dataset.z);
      else {
        if (def.limit === 1) gewaehlt.clear();
        gewaehlt.add(b.dataset.z);
      }
      zeichne(o.querySelector('#rq').value);
    });
    o.querySelector('#rq').focus();
  };

  /* --- Zelle bearbeiten --------------------------------------------------- */
  const zelleBearbeiten = (td, row, key, coll) => {
    const def = coll.schema[key];

    if (def.type === 'relation') { relationWaehlen(row, key, coll); return; }
    if (def.type === 'button')   { knopfInZelle(row, key, coll); return; }

    if (def.type === 'ki') {
      kiFeldFuellen(row, key, coll);
      return;
    }

    if (['formula','created','edited','rollup','uid'].includes(def.type)) {
      UI.toast('Dieses Feld wird berechnet und kann nicht direkt bearbeitet werden.');
      return;
    }

    if (def.type === 'select' || def.type === 'status' || def.type === 'multi') {
      const r = td.getBoundingClientRect();
      const aktuell = wert(row, key, coll);
      const html =
        (def.options || []).map(o =>
          `<button data-o="${esc(o.name)}"><span class="tag bg-${o.color}">${esc(o.name)}</span></button>`).join('') +
        '<hr><button data-o="__neu">+ Neue Option</button>' +
        (def.type !== 'multi' ? '<button data-o="">Leeren</button>' : '');
      const m = UI.menu(html, r.left, r.bottom + 2);
      m.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-o]');
        if (!b) return;
        let v = b.dataset.o;
        if (v === '__neu') {
          const name = prompt('Name der neuen Option');
          if (!name) return;
          def.options = def.options || [];
          def.options.push({ name, color: FARBEN[def.options.length % FARBEN.length] });
          Store.updateCollection(coll.id, { schema: coll.schema });
          v = name;
        }
        if (def.type === 'multi') {
          const alt = Array.isArray(aktuell) ? aktuell : [];
          const neu = alt.includes(v) ? alt.filter(x => x !== v) : [...alt, v];
          Store.setProp(row.id, key, neu);
        } else {
          Store.setProp(row.id, key, v);
          m.remove();
        }
        App.zeichneSeite();
      });
      return;
    }

    /* Freies Eingabefeld direkt in der Zelle */
    const alt = wert(row, key, coll);
    const inp = document.createElement('input');
    inp.type = def.type === 'date' ? 'date'
             : def.type === 'number' ? 'number'
             : def.type === 'email' ? 'email'
             : def.type === 'url' ? 'url' : 'text';
    inp.value = def.type === 'date' && alt ? String(alt).slice(0, 10) : (alt ?? '');
    inp.style.cssText = 'width:100%; background:var(--bg-input); border:1px solid var(--accent); ' +
                        'border-radius:3px; padding:3px 5px; outline:none';
    td.innerHTML = '';
    td.appendChild(inp);
    inp.focus();
    inp.select();

    const fertig = () => {
      Store.setProp(row.id, key, inp.value);
      td.innerHTML = zelle(row, key, coll);
    };
    inp.addEventListener('blur', fertig);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
      if (e.key === 'Escape') { td.innerHTML = zelle(row, key, coll); }
    });
  };

  /* --- Board -------------------------------------------------------------- */
  const alsBoard = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'board';

    /* Nach welcher Spalte gruppieren? Erste Select/Status-Spalte als Standard. */
    const gk = view.groupBy ||
      Object.keys(coll.schema).find(k => ['select','status'].includes(coll.schema[k].type));

    if (!gk) {
      w.innerHTML = '<div style="color:var(--text-faint)">Für ein Board wird eine Auswahl- oder Status-Spalte gebraucht.</div>';
      return w;
    }

    const def = coll.schema[gk];
    const gruppen = [...(def.options || []).map(o => o.name), '(Leer)'];

    gruppen.forEach(g => {
      const drin = rows.filter(r => (wert(r, gk, coll) || '(Leer)') === g);
      /* Die Sammelspalte für leere Werte nur zeigen, wenn wirklich etwas drin ist */
      if (g === '(Leer)' && !drin.length) return;
      /* Leere Gruppen ausblenden — ausser der Nutzer will sie sehen */
      if (!drin.length && !view.leereGruppen) return;
      const col = document.createElement('div');
      col.className = 'col k-' + (view.kartenGroesse || 'mittel');
      const opt = (def.options || []).find(o => o.name === g);
      col.innerHTML = `<h4><span class="tag bg-${opt ? opt.color : 'gray'}">${esc(g)}</span><em>${drin.length}</em></h4>`;

      drin.forEach(r => {
        const c = document.createElement('div');
        c.className = 'card';
        c.draggable = true;
        c.dataset.rid = r.id;
        let meta = '';
        Object.keys(coll.schema).forEach(k => {
          if (k === gk || coll.schema[k].type === 'title') return;
          if ((view.hidden || []).includes(k)) return;
          const z = zelle(r, k, coll);
          if (z && !z.includes('—')) meta += `<span class="mv">${z}</span>`;
        });
        c.innerHTML = `<div>${esc(r.text || 'Ohne Titel')}</div>` + (meta ? `<div class="meta">${meta}</div>` : '');
        c.addEventListener('click', () => view.oeffnenAls === 'voll' ? App.oeffne(r.id) : zeilePeek(r, coll));
        c.addEventListener('contextmenu', e => { e.preventDefault(); zeilenMenue({ x: e.clientX, y: e.clientY }, r, coll); });
        c.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', r.id));
        col.appendChild(c);
      });

      const add = document.createElement('button');
      add.textContent = '+ Neu';
      add.style.cssText = 'width:100%; text-align:left; padding:6px; color:var(--text-faint); font-size:13.5px; border-radius:5px';
      add.addEventListener('click', () => {
        Store.addRow(coll.id, g === '(Leer)' ? {} : { [gk]: g });
        App.zeichneSeite();
      });
      col.appendChild(add);

      col.addEventListener('dragover', e => { e.preventDefault(); col.style.outline = '2px solid var(--accent)'; });
      col.addEventListener('dragleave', () => col.style.outline = '');
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.style.outline = '';
        const id = e.dataTransfer.getData('text/plain');
        if (id) { Store.setProp(id, gk, g === '(Leer)' ? '' : g); App.zeichneSeite(); }
      });

      w.appendChild(col);
    });
    return w;
  };

  /* --- Liste -------------------------------------------------------------- */
  const alsListe = (coll, view, rows) => {
    const w = document.createElement('div');
    rows.forEach(r => {
      const d = document.createElement('div');
      d.className = 'list-row';
      let meta = '';
      Object.keys(coll.schema).forEach(k => {
        if (coll.schema[k].type === 'title' || (view.hidden || []).includes(k)) return;
        const z = zelle(r, k, coll);
        if (z && !z.includes('—')) meta += '<span style="font-size:12.5px">' + z + '</span>';
      });
      d.innerHTML = `<span style="flex:1">${esc(r.text || 'Ohne Titel')}</span>` +
                    `<span style="display:flex;gap:6px;align-items:center">${meta}</span>`;
      d.addEventListener('click', () => App.oeffne(r.id));
      w.appendChild(d);
    });
    if (!rows.length) w.innerHTML = '<div style="color:var(--text-faint); padding:10px 0">Noch keine Einträge</div>';
    return w;
  };

  /* --- Galerie ------------------------------------------------------------ */
  const alsGalerie = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'gallery';
    rows.forEach(r => {
      const c = document.createElement('div');
      c.className = 'card';
      let meta = '';
      Object.keys(coll.schema).forEach(k => {
        if (coll.schema[k].type === 'title' || (view.hidden || []).includes(k)) return;
        const z = zelle(r, k, coll);
        if (z && !z.includes('—')) meta += `<span class="mv">${z}</span>`;
      });
      c.innerHTML = `<div style="font-weight:500; margin-bottom:6px">${esc(r.text || 'Ohne Titel')}</div>` +
                    `<div class="meta">${meta}</div>`;
      c.addEventListener('click', () => view.oeffnenAls === 'voll' ? App.oeffne(r.id) : zeilePeek(r, coll));
      c.addEventListener('contextmenu', e => { e.preventDefault(); zeilenMenue({ x: e.clientX, y: e.clientY }, r, coll); });
      w.appendChild(c);
    });
    return w;
  };

  /* --- Kalender ----------------------------------------------------------- */
  const alsKalender = (coll, view, rows) => {
    const w = document.createElement('div');
    const dk = view.dateKey || Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');

    if (!dk) {
      w.innerHTML = '<div style="color:var(--text-faint)">Für den Kalender wird eine Datums-Spalte gebraucht.</div>';
      return w;
    }

    const stand = view.monat ? new Date(view.monat) : new Date();
    const jahr = stand.getFullYear(), monat = stand.getMonth();

    const kopf = document.createElement('div');
    kopf.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:8px';
    kopf.innerHTML =
      `<b style="font-size:15px">${stand.toLocaleDateString('de-DE',{month:'long',year:'numeric'})}</b>` +
      `<span style="flex:1"></span>` +
      `<button data-m="-1" style="padding:3px 8px;border-radius:4px">‹</button>` +
      `<button data-m="0"  style="padding:3px 8px;border-radius:4px;font-size:13px">Heute</button>` +
      `<button data-m="1"  style="padding:3px 8px;border-radius:4px">›</button>`;
    kopf.addEventListener('click', e => {
      const b = e.target.closest('button[data-m]');
      if (!b) return;
      const d = b.dataset.m === '0' ? new Date() : new Date(jahr, monat + Number(b.dataset.m), 1);
      Store.updateView(view.id, { monat: d.toISOString() });
      App.zeichneSeite();
    });
    w.appendChild(kopf);

    const g = document.createElement('div');
    g.className = 'cal';
    /* Beginnt die Woche am Montag oder am Sonntag? Steht in den Einstellungen. */
    const wsMontag = Einstellungen.wochenstart() === 1;
    const tage = wsMontag ? ['Mo','Di','Mi','Do','Fr','Sa','So'] : ['So','Mo','Di','Mi','Do','Fr','Sa'];
    tage.forEach(d => {
      const e = document.createElement('div');
      e.className = 'dow';
      e.textContent = d;
      g.appendChild(e);
    });

    const ersterTag = new Date(jahr, monat, 1);
    let start = wsMontag ? ersterTag.getDay() - 1 : ersterTag.getDay();
    if (start < 0) start = 6;
    const tageImMonat = new Date(jahr, monat + 1, 0).getDate();
    const heuteStr = new Date().toDateString();

    for (let i = 0; i < start; i++) {
      const d = document.createElement('div');
      d.className = 'day out';
      g.appendChild(d);
    }

    for (let t = 1; t <= tageImMonat; t++) {
      const tag = new Date(jahr, monat, t);
      const d = document.createElement('div');
      d.className = 'day' + (tag.toDateString() === heuteStr ? ' today' : '');
      d.innerHTML = `<div class="n">${t}</div>`;

      rows.forEach(r => {
        const v = wert(r, dk, coll);
        if (!v) return;
        const dv = new Date(v);
        if (isNaN(dv)) return;
        if (dv.toDateString() !== tag.toDateString()) return;
        const ev = document.createElement('div');
        ev.className = 'ev';
        ev.textContent = r.text || 'Ohne Titel';
        ev.addEventListener('click', () => App.oeffne(r.id));
        d.appendChild(ev);
      });

      d.addEventListener('dblclick', () => {
        const iso = tag.toISOString().slice(0, 10);
        Store.addRow(coll.id, { [dk]: iso });
        App.zeichneSeite();
      });
      g.appendChild(d);
    }

    w.appendChild(g);
    const hinweis = document.createElement('div');
    hinweis.style.cssText = 'font-size:12px; color:var(--text-faint); margin-top:6px';
    hinweis.textContent = 'Doppelklick auf einen Tag legt einen Eintrag an.';
    w.appendChild(hinweis);
    return w;
  };

  /* --- Zeitstrahl ---------------------------------------------------------
   * Notions Timeline: jede Zeile ein Balken auf einer Zeitachse.
   * ----------------------------------------------------------------------*/
  const alsZeitstrahl = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'zeitstrahl';

    const datumKeys = Object.keys(coll.schema).filter(k =>
      ['date','created','edited'].includes(coll.schema[k].type));
    const startKey = view.startKey && coll.schema[view.startKey] ? view.startKey : datumKeys[0];
    const endeKey  = view.endeKey && coll.schema[view.endeKey] ? view.endeKey : null;

    if (!startKey) {
      w.innerHTML = '<div class="db-leer">Für den Zeitstrahl braucht es eine Datums-Eigenschaft.</div>';
      return w;
    }

    const eintraege = rows.map(r => {
      const a = new Date(wert(r, startKey, coll));
      const b = endeKey ? new Date(wert(r, endeKey, coll)) : new Date(a);
      if (isNaN(a)) return null;
      if (isNaN(b) || b < a) b.setTime(a.getTime());
      return { row: r, von: a, bis: b };
    }).filter(Boolean);

    if (!eintraege.length) {
      w.innerHTML = '<div class="db-leer">Noch keine Einträge mit Datum.</div>';
      return w;
    }

    const minD = new Date(Math.min(...eintraege.map(e => e.von)));
    const maxD = new Date(Math.max(...eintraege.map(e => e.bis)));
    minD.setDate(minD.getDate() - 2);
    maxD.setDate(maxD.getDate() + 3);
    const spanne = Math.max(1, (maxD - minD) / 86400000);

    /* Massstab: Monatsbeschriftungen */
    const kopf = document.createElement('div');
    kopf.className = 'zs-kopf';
    const monate = [];
    const lauf = new Date(minD);
    lauf.setDate(1);
    while (lauf <= maxD) {
      const von = Math.max(0, (lauf - minD) / 86400000);
      monate.push({ text: lauf.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }), pos: von / spanne * 100 });
      lauf.setMonth(lauf.getMonth() + 1);
    }
    kopf.innerHTML = monate.map(m =>
      `<span style="left:${m.pos}%">${esc(m.text)}</span>`).join('');
    w.appendChild(kopf);

    /* Heute-Markierung */
    const jetzt = new Date();
    if (jetzt >= minD && jetzt <= maxD) {
      const linie = document.createElement('div');
      linie.className = 'zs-heute';
      linie.style.left = ((jetzt - minD) / 86400000 / spanne * 100) + '%';
      linie.title = 'Heute';
      w.appendChild(linie);
    }

    eintraege.sort((a, b) => a.von - b.von).forEach((e, i) => {
      const zeile = document.createElement('div');
      zeile.className = 'zs-zeile';
      const links = ((e.von - minD) / 86400000) / spanne * 100;
      const breite = Math.max(2.5, ((e.bis - e.von) / 86400000 + 1) / spanne * 100);
      const farbe = FARBEN[i % FARBEN.length];
      zeile.innerHTML =
        `<div class="zs-balken bg-${farbe}" style="left:${links}%; width:${breite}%" ` +
        `title="${esc(e.row.text || 'Ohne Titel')} — ${e.von.toLocaleDateString('de-DE')}` +
        (endeKey ? ' bis ' + e.bis.toLocaleDateString('de-DE') : '') + '">' +
        esc(e.row.text || 'Ohne Titel') + '</div>';
      zeile.querySelector('.zs-balken').addEventListener('click', () => zeilePeek(e.row, coll));
      w.appendChild(zeile);
    });

    /* Umschalter für die Datumsfelder */
    const fuss = document.createElement('div');
    fuss.className = 'zs-fuss';
    fuss.innerHTML =
      `<span>Start: <b>${esc(coll.schema[startKey].name)}</b></span>` +
      `<span>Ende: <b>${endeKey ? esc(coll.schema[endeKey].name) : 'wie Start'}</b></span>` +
      '<button data-a="felder">Datumsfelder wählen</button>';
    fuss.addEventListener('click', e => {
      if (!e.target.closest('[data-a="felder"]')) return;
      const r = e.target.getBoundingClientRect();
      const m = UI.menu('<div class="grp">Startdatum</div>' +
        datumKeys.map(k => `<button data-s="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
        '<div class="grp">Enddatum</div>' +
        datumKeys.map(k => `<button data-e="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
        '<button data-e="">— kein Enddatum</button>', r.left, r.bottom + 4);
      m.addEventListener('click', ev => {
        const s = ev.target.closest('button[data-s]');
        const en = ev.target.closest('button[data-e]');
        if (s) Store.updateView(view.id, { startKey: s.dataset.s });
        else if (en) Store.updateView(view.id, { endeKey: en.dataset.e });
        else return;
        m.remove(); App.zeichneSeite();
      });
    });
    w.appendChild(fuss);
    return w;
  };

  /* --- Feed: der Zeitstrom, neueste zuerst (Notions Feed-View) ----------- */
  const alsFeed = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'feed';

    const datumKey = view.datumKey && coll.schema[view.datumKey] ? view.datumKey
      : Object.keys(coll.schema).find(k => ['date','created','edited'].includes(coll.schema[k].type));

    const sortiert2 = rows.slice().sort((a, b) => {
      const av = datumKey ? wert(a, datumKey, coll) : a.created;
      const bv = datumKey ? wert(b, datumKey, coll) : b.created;
      return String(bv || '').localeCompare(String(av || ''));
    });

    if (!sortiert2.length) {
      w.innerHTML = '<div class="db-leer">Noch keine Einträge.</div>';
      return w;
    }

    sortiert2.forEach(r => {
      const e = document.createElement('article');
      e.className = 'feed-eintrag';

      const wann = datumKey ? Formula.anzeige(wert(r, datumKey, coll)) : Werkzeuge.zeitKurz(r.created);
      const merkmale = Object.keys(coll.schema)
        .filter(k => k !== datumKey && coll.schema[k].type !== 'title' && !(view.hidden || []).includes(k))
        .map(k => zelle(r, k, coll))
        .filter(z => z && !z.includes('—'))
        .slice(0, 4).join(' ');

      /* Der Anfang des Seiteninhalts als Vorschau */
      const vorschau = Store.childrenOf(r.id)
        .map(b => b.text || '').filter(Boolean).join(' ').slice(0, 220);

      e.innerHTML =
        `<div class="fe-kopf"><b>${esc(r.text || 'Ohne Titel')}</b><span>${esc(wann)}</span></div>` +
        (merkmale ? `<div class="fe-merkmale">${merkmale}</div>` : '') +
        (vorschau ? `<div class="fe-text">${esc(vorschau)}${vorschau.length >= 220 ? ' …' : ''}</div>` : '') +
        `<div class="fe-fuss"><button data-a="oeffnen">Öffnen</button>` +
        `<button data-a="komm">💬 Kommentar</button></div>`;

      e.addEventListener('click', ev => {
        if (ev.target.closest('[data-a="komm"]')) { Kommentare.neu(r); return; }
        if (ev.target.closest('[data-a="oeffnen"]') || ev.target.closest('.fe-kopf'))
          view.oeffnenAls === 'voll' ? App.oeffne(r.id) : zeilePeek(r, coll);
      });
      e.addEventListener('contextmenu', ev => { ev.preventDefault(); zeilenMenue({ x: ev.clientX, y: ev.clientY }, r, coll); });
      w.appendChild(e);
    });
    return w;
  };

  /* --- Diagrammansicht ----------------------------------------------------
   * Notions Chart-View: gruppieren, zusammenfassen, zeichnen.
   * ----------------------------------------------------------------------*/
  const alsDiagramm = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'db-chart';

    const gruppierbar = Object.keys(coll.schema).filter(k =>
      ['select','status','multi','checkbox','person','text','title','date'].includes(coll.schema[k].type));
    const messbar = Object.keys(coll.schema).filter(k =>
      ['number','formula','rollup'].includes(coll.schema[k].type));

    const gKey = view.chartGruppe && coll.schema[view.chartGruppe] ? view.chartGruppe : gruppierbar[0];
    const mKey = view.chartWert && coll.schema[view.chartWert] ? view.chartWert : '';
    const typ = view.chartTyp || 'bar';

    if (!gKey) {
      w.innerHTML = '<div class="db-leer">Für ein Diagramm braucht es eine Spalte zum Gruppieren.</div>';
      return w;
    }

    const map = new Map();
    rows.forEach(r => {
      let k = wert(r, gKey, coll);
      if (Array.isArray(k)) k = k.join(', ');
      if (coll.schema[gKey].type === 'date' && k) k = String(k).slice(0, 7);
      const name = (k === '' || k == null || k === false) ? '(leer)' : String(k);
      const v = mKey ? Formula.zahl(wert(r, mKey, coll)) : 1;
      map.set(name, (map.get(name) || 0) + (isNaN(v) ? 0 : v));
    });
    const werte = [...map.entries()].map(([name, w2]) => ({ name, wert: w2 }));

    const leiste = document.createElement('div');
    leiste.className = 'chart-head';
    leiste.innerHTML =
      `<span class="chart-titel">${esc(coll.name)} — ${esc(coll.schema[gKey].name)}` +
      (mKey ? ' nach ' + esc(coll.schema[mKey].name) : ' (Anzahl)') + '</span>' +
      '<div class="chart-typen">' +
        [['bar','Balken'],['line','Linie'],['area','Fläche'],['donut','Ring'],['kpi','Kennzahl']]
          .map(([id, n]) => `<button data-ct="${id}"${id === typ ? ' class="on"' : ''}>${n}</button>`).join('') +
      '</div>' +
      '<button data-a="achsen" class="chart-daten">✎ Achsen</button>';
    w.appendChild(leiste);

    leiste.addEventListener('click', e => {
      const t = e.target.closest('[data-ct]');
      if (t) { Store.updateView(view.id, { chartTyp: t.dataset.ct }); App.zeichneSeite(); return; }
      if (!e.target.closest('[data-a="achsen"]')) return;
      const r = e.target.getBoundingClientRect();
      const m = UI.menu(
        '<div class="grp">Gruppieren nach</div>' +
        gruppierbar.map(k => `<button data-g="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
        '<div class="grp">Werte</div>' +
        '<button data-m="">Anzahl der Einträge</button>' +
        messbar.map(k => `<button data-m="${k}">Summe von ${esc(coll.schema[k].name)}</button>`).join(''),
        r.left, r.bottom + 4);
      m.addEventListener('click', ev => {
        const g = ev.target.closest('button[data-g]');
        const mm = ev.target.closest('button[data-m]');
        if (g) Store.updateView(view.id, { chartGruppe: g.dataset.g });
        else if (mm) Store.updateView(view.id, { chartWert: mm.dataset.m });
        else return;
        m.remove(); App.zeichneSeite();
      });
    });

    if (!werte.length) {
      const l = document.createElement('div');
      l.className = 'db-leer';
      l.textContent = 'Noch keine Einträge.';
      w.appendChild(l);
      return w;
    }

    const flaeche = document.createElement('div');
    flaeche.className = 'chart-flaeche';
    flaeche.appendChild(Zusatz.chartSvg(typ, werte));
    w.appendChild(flaeche);

    const legende = document.createElement('div');
    legende.className = 'chart-legende';
    legende.innerHTML = werte.map((v, i) =>
      `<span><i style="background:${Zusatz.PALETTE[i % Zusatz.PALETTE.length]}"></i>` +
      `${esc(v.name)} <b>${Formula.anzeige(v.wert)}</b></span>`).join('');
    w.appendChild(legende);
    return w;
  };

  /* --- Formularansicht ----------------------------------------------------
   * Notions Form-View: eine Eingabemaske, die neue Einträge anlegt.
   * ----------------------------------------------------------------------*/
  const alsFormular = (coll, view, block) => {
    const w = document.createElement('div');
    w.className = 'db-form';

    const felder = Object.keys(coll.schema).filter(k =>
      !['formula','created','edited','rollup','uid','button'].includes(coll.schema[k].type) &&
      !(view.hidden || []).includes(k));

    w.innerHTML =
      `<div class="form-kopf"><b contenteditable="true" data-f="titel">${esc(view.formTitel || coll.name)}</b>` +
      `<div contenteditable="true" data-f="text" class="form-text">` +
      `${esc(view.formText || 'Alle Felder ausfüllen und abschicken.')}</div></div>`;

    const box = document.createElement('div');
    box.className = 'form-felder';
    felder.forEach(k => {
      const def = coll.schema[k];
      const feld = document.createElement('label');
      feld.className = 'form-feld';
      const pflicht = (view.pflicht || []).includes(k);
      const regel = (view.logik || {})[k];
      feld.dataset.k = k;
      if (regel) feld.dataset.zeigtWenn = regel.key + '|' + regel.wert;
      feld.innerHTML = `<span>${esc(def.name)}${pflicht ? ' <em>*</em>' : ''}` +
        (regel ? `<em class="fl-hinweis">nur wenn ${esc(coll.schema[regel.key]?.name || '?')} = ` +
                 `${esc(regel.wert)}</em>` : '') + '</span>';

      let eingabe;
      if (['select','status'].includes(def.type)) {
        eingabe = document.createElement('select');
        eingabe.innerHTML = '<option value=""></option>' +
          (def.options || []).map(o => `<option>${esc(o.name)}</option>`).join('');
      } else if (def.type === 'checkbox') {
        eingabe = document.createElement('input');
        eingabe.type = 'checkbox';
      } else if (def.type === 'date') {
        eingabe = document.createElement('input');
        eingabe.type = 'date';
      } else if (def.type === 'number') {
        eingabe = document.createElement('input');
        eingabe.type = 'number';
      } else {
        eingabe = document.createElement('input');
        eingabe.type = 'text';
      }
      eingabe.dataset.k = k;
      feld.appendChild(eingabe);
      box.appendChild(feld);
    });
    w.appendChild(box);

    const fuss = document.createElement('div');
    fuss.className = 'form-fuss';
    fuss.innerHTML = `<button class="prim" data-a="senden">${esc(view.formKnopf || 'Absenden')}</button>` +
                     `<button data-a="pflicht">Pflichtfelder</button>` +
                     `<button data-a="logik">Bedingte Fragen</button>` +
                     `<span class="form-zahl">${Store.rowsOf(coll.id).length} Einträge bisher</span>`;
    w.appendChild(fuss);

    w.addEventListener('input', e => {
      const f = e.target.closest('[data-f]');
      if (!f) return;
      Store.updateView(view.id, f.dataset.f === 'titel'
        ? { formTitel: f.textContent } : { formText: f.textContent });
    });

    /* Bedingte Fragen: erst zeigen, wenn eine andere Antwort passt */
    const logikPruefen = () => {
      box.querySelectorAll('.form-feld[data-zeigt-wenn]').forEach(f => {
        const [k2, w2] = f.dataset.zeigtWenn.split('|');
        const quelle = box.querySelector(`[data-k="${k2}"]`);
        const jetzt = quelle ? (quelle.type === 'checkbox' ? String(quelle.checked) : quelle.value) : '';
        f.style.display = (String(jetzt) === String(w2)) ? '' : 'none';
      });
    };
    box.addEventListener('input', logikPruefen);
    box.addEventListener('change', logikPruefen);
    setTimeout(logikPruefen, 0);

    fuss.addEventListener('click', e => {
      if (e.target.closest('[data-a="logik"]')) {
        const r = e.target.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Welche Frage soll bedingt sein?</div>' +
          felder.map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}` +
            ((view.logik || {})[k] ? '<span class="ms">bedingt</span>' : '') + '</button>').join(''),
          r.left, r.top - 30);
        m.addEventListener('click', async ev => {
          const b2 = ev.target.closest('button[data-k]');
          if (!b2) return;
          m.remove();
          const ziel = b2.dataset.k;
          view.logik = view.logik || {};
          if (view.logik[ziel]) { delete view.logik[ziel]; Store.updateView(view.id, { logik: view.logik }); App.zeichneSeite(); return; }

          const m2 = UI.menu('<div class="grp">Zeigen, wenn diese Frage …</div>' +
            felder.filter(k => k !== ziel)
              .map(k => `<button data-q="${k}">${esc(coll.schema[k].name)}</button>`).join(''),
            r.left, r.top - 30);
          m2.addEventListener('click', async ev2 => {
            const q = ev2.target.closest('button[data-q]');
            if (!q) return;
            m2.remove();
            const w3 = await UI.frage('… diesen Wert hat', '');
            if (w3 === null) return;
            view.logik[ziel] = { key: q.dataset.q, wert: w3 };
            Store.updateView(view.id, { logik: view.logik });
            App.zeichneSeite();
            UI.toast('Bedingte Frage eingerichtet');
          });
        });
        return;
      }
      if (e.target.closest('[data-a="pflicht"]')) {
        const r = e.target.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Pflichtfelder</div>' + felder.map(k =>
          `<button data-k="${k}"><span class="mi">${(view.pflicht || []).includes(k) ? '☑' : '☐'}</span>` +
          `${esc(coll.schema[k].name)}</button>`).join(''), r.left, r.bottom + 4);
        m.addEventListener('click', ev => {
          const b = ev.target.closest('button[data-k]');
          if (!b) return;
          const p = view.pflicht || [];
          Store.updateView(view.id, { pflicht: p.includes(b.dataset.k) ? p.filter(x => x !== b.dataset.k) : [...p, b.dataset.k] });
          m.remove(); App.zeichneSeite();
        });
        return;
      }
      if (!e.target.closest('[data-a="senden"]')) return;

      const props = {};
      let titel = '';
      let fehlt = null;
      box.querySelectorAll('input[data-k], select[data-k]').forEach(el => {
        const k = el.dataset.k;
        const versteckt = el.closest('.form-feld')?.style.display === 'none';
        const v = el.type === 'checkbox' ? el.checked : el.value;
        if (!versteckt && (view.pflicht || []).includes(k) && (v === '' || v === false)) fehlt = coll.schema[k].name;
        if (coll.schema[k].type === 'title') titel = v;
        else props[k] = v;
      });
      if (fehlt) { UI.toast('Bitte „' + fehlt + '" ausfüllen'); return; }

      const r = Store.addRow(coll.id, props);
      Store.updateBlock(r.id, { text: titel || 'Ohne Titel' });
      UI.toast('Eintrag angelegt');
      App.zeichneSeite();
    });

    return w;
  };

  /* ========================================================================
   * ZEILE ALS SEITENVORSCHAU  (Notions Side Peek)
   * ======================================================================*/
  const zeilePeek = (row, coll) => {
    document.querySelectorAll('.peek').forEach(p => p.remove());
    const p = document.createElement('aside');
    p.className = 'peek';

    const kopf = document.createElement('div');
    kopf.className = 'peek-kopf';
    kopf.innerHTML =
      '<button data-a="voll" title="Als ganze Seite öffnen">⤢</button>' +
      '<div class="peek-pfad">' + esc(coll.name) + '</div>' +
      '<button data-a="menu" title="Mehr">⋯</button>' +
      '<button data-a="zu" title="Schliessen">✕</button>';
    p.appendChild(kopf);

    const koerper = document.createElement('div');
    koerper.className = 'peek-koerper';

    const titel = document.createElement('div');
    titel.className = 'peek-titel';
    titel.contentEditable = 'true';
    titel.textContent = row.text || '';
    titel.dataset.ph = 'Ohne Titel';
    titel.addEventListener('input', () => {
      Store.updateBlock(row.id, { text: titel.textContent });
    });
    koerper.appendChild(titel);

    /* Eigenschaften */
    const props = document.createElement('div');
    props.className = 'peek-props';
    Object.keys(coll.schema).forEach(k => {
      const def = coll.schema[k];
      if (def.type === 'title') return;
      const z = document.createElement('div');
      z.className = 'peek-prop';
      z.innerHTML = `<span class="pp-n">${propTyp(def.type).icon} ${esc(def.name)}</span>` +
                    `<span class="pp-w" data-k="${k}">${zelle(row, k, coll)}</span>`;
      z.querySelector('.pp-w').addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') { Store.setProp(row.id, k, e.target.checked); return; }
        zelleBearbeiten(e.currentTarget, row, k, coll);
      });
      props.appendChild(z);
    });
    koerper.appendChild(props);

    /* Inhalt der Zeile — eine Zeile ist eine vollwertige Seite */
    const inhalt = document.createElement('div');
    inhalt.className = 'peek-inhalt';
    inhalt.id = 'peek-page';
    const kinder = Store.childrenOf(row.id);
    if (!kinder.length) kinder.push(Store.addBlock(row.id, 'text'));
    kinder.forEach(b => inhalt.appendChild(Blocks.render(b)));
    koerper.appendChild(inhalt);
    p.appendChild(koerper);

    document.body.appendChild(p);
    Blocks.bindeEditor(inhalt);

    kopf.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'zu') p.remove();
      if (b.dataset.a === 'voll') { p.remove(); App.oeffne(row.id); }
      if (b.dataset.a === 'menu') zeilenMenue(b, row, coll, () => p.remove());
    });
  };

  /* --- Rechtsklick auf eine Zeile ---------------------------------------- */
  const zeilenMenue = (anker, row, coll, danach) => {
    const r = anker.getBoundingClientRect
      ? anker.getBoundingClientRect()
      : { left: anker.x, bottom: anker.y, right: anker.x, top: anker.y };

    const m = UI.menu(
      '<button data-a="peek"><span class="mi">◧</span>In der Vorschau öffnen</button>' +
      '<button data-a="voll"><span class="mi">⤢</span>Als ganze Seite öffnen</button>' +
      '<hr>' +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren</button>' +
      '<button data-a="oben"><span class="mi">↑</span>Darüber einfügen</button>' +
      '<button data-a="unten"><span class="mi">↓</span>Darunter einfügen</button>' +
      '<button data-a="unter"><span class="mi">↳</span>Unterelement anlegen</button>' +
      '<button data-a="link"><span class="mi">🔗</span>Link kopieren</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentar</button>' +
      '<button data-a="fav"><span class="mi">☆</span>Zu Favoriten</button>' +
      '<hr>' +
      '<button data-a="del"><span class="mi">🗑</span>Löschen</button>',
      r.left, r.bottom + 4);

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      m.remove();
      if (a === 'peek') zeilePeek(row, coll);
      if (a === 'voll') { danach && danach(); App.oeffne(row.id); }
      if (a === 'rename') {
        const n = await UI.frage('Neuer Titel', row.text || '');
        if (n !== null) { Store.updateBlock(row.id, { text: n }); App.zeichneSeite(); }
      }
      if (a === 'dup') {
        const kopie = Store.addRow(coll.id, JSON.parse(JSON.stringify(row.props || {})));
        Store.updateBlock(kopie.id, { text: (row.text || '') + ' (Kopie)' });
        App.zeichneSeite();
      }
      if (a === 'oben' || a === 'unten') { Store.addRow(coll.id, {}); App.zeichneSeite(); }
      if (a === 'unter') {
        const k = Store.addRow(coll.id, {});
        Store.updateBlock(k.id, { unterVon: row.id, text: 'Unterelement' });
        App.zeichneSeite();
      }
      if (a === 'link') { navigator.clipboard?.writeText(location.origin + location.pathname + '#' + row.id); UI.toast('Link kopiert'); }
      if (a === 'komm') Kommentare.neu(row);
      if (a === 'fav') { Store.updateBlock(row.id, { favorite: !row.favorite }); App.zeichneBaum(); }
      if (a === 'del') {
        Store.trashBlock(row.id);
        danach && danach();
        App.zeichneSeite();
        UI.toast('Eintrag gelöscht');
      }
    });
  };

  /* ========================================================================
   * MENÜS
   * ======================================================================*/

  const neueAnsicht = (anker, coll, block) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Neue Ansicht</div>' +
      [['table','▦','Tabelle'],['board','▤','Board'],['list','☰','Liste'],
       ['gallery','▩','Galerie'],['calendar','📅','Kalender'],
       ['timeline','▬','Zeitstrahl'],['chart','📊','Diagramm'],['form','📝','Formular'],
       ['feed','📰','Feed']]
        .map(([id,i,n]) => `<button data-l="${id}"><span class="mi">${i}</span>${n}</button>`).join(''),
      r.left, r.bottom + 4);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-l]');
      if (!b) return;
      const v = Store.addView(coll.id, b.dataset.l);
      Store.updateBlock(block.id, { aktiveView: v.id });
      m.remove();
      App.zeichneSeite();
    });
  };

  const ansichtMenue = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren</button>' +
      '<button data-a="lock"><span class="mi">🔒</span>' + (view.locked ? 'Entsperren' : 'Ansicht sperren') + '</button>' +
      '<hr><button data-a="del"><span class="mi">🗑</span>Ansicht löschen</button>',
      r.left, r.bottom + 4);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      m.remove();
      if (b.dataset.a === 'rename') {
        const n = prompt('Name der Ansicht', view.name);
        if (n) { Store.updateView(view.id, { name: n }); App.zeichneSeite(); }
      }
      if (b.dataset.a === 'dup') {
        const v = Store.addView(coll.id, view.layout, view.name + ' Kopie');
        Store.updateView(v.id, { filters: JSON.parse(JSON.stringify(view.filters)),
                                 sorts: [...view.sorts], hidden: [...(view.hidden||[])] });
        App.zeichneSeite();
      }
      if (b.dataset.a === 'lock') { Store.updateView(view.id, { locked: !view.locked }); App.zeichneSeite(); }
      if (b.dataset.a === 'del')  { Store.removeView(view.id); App.zeichneSeite(); }
    });
  };

  /* ------------------------------------------------------------------------
   * FILTER-EDITOR
   * ------------------------------------------------------------------------
   * Notions „Advanced filter": Regeln und Gruppen, UND oder ODER, mehrere
   * Ebenen tief. Jede Zeile lässt sich einzeln ändern.
   * ----------------------------------------------------------------------*/
  const filterMenue = (anker, coll, view, block) => {
    view.filters = view.filters || { operator: 'and', rules: [] };

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(700px,95vw)">' +
        '<div class="fh">⚟ Filter<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="filter-baum" id="fb"></div>' +
        '<div class="fbtns">' +
          '<button data-a="regel">＋ Regel</button>' +
          '<button data-a="gruppe">＋ Gruppe</button>' +
          '<button data-a="leeren">Alle entfernen</button>' +
          '<button data-a="ok" class="prim">Fertig</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);

    const keys = Object.keys(coll.schema);

    /* Braucht dieser Operator überhaupt einen Wert? */
    const ohneWert = (op) => /^(ist leer|ist nicht leer|ist aktiviert|ist nicht aktiviert|ist heute|ist gestern|ist morgen|ist diese Woche|ist letzte Woche|ist nächste Woche|ist dieser Monat|ist letzter Monat|ist in den|liegt in der)/.test(op);

    const zeichneGruppe = (gruppe, pfad, tiefe) => {
      const kopf = tiefe === 0 ? '' :
        `<div class="fg-kopf"><button class="fg-op" data-op="${pfad}">` +
        `${gruppe.operator === 'or' ? 'ODER' : 'UND'}</button>` +
        `<span>Gruppe</span>` +
        `<button data-add-regel="${pfad}">＋ Regel</button>` +
        `<button data-weg="${pfad}">🗑</button></div>`;

      const zeilen = gruppe.rules.map((r, i) => {
        const p2 = pfad ? pfad + '.' + i : String(i);
        if (r.rules !== undefined) return zeichneGruppe(r, p2, tiefe + 1);

        const def = coll.schema[r.key] || {};
        const ops = OPERATOREN[def.type] || OPERATOREN.text;
        return '<div class="fr-zeile">' +
          (i === 0 ? '<span class="fr-wo">Wenn</span>'
                   : `<button class="fg-op klein" data-op="${pfad}">` +
                     `${gruppe.operator === 'or' ? 'oder' : 'und'}</button>`) +
          `<select data-k="${p2}">` +
            keys.map(k => `<option value="${k}"${k === r.key ? ' selected' : ''}>` +
                          `${esc(coll.schema[k].name)}</option>`).join('') +
          '</select>' +
          `<select data-o="${p2}">` +
            ops.map(op => `<option${op === r.op ? ' selected' : ''}>${esc(op)}</option>`).join('') +
          '</select>' +
          (ohneWert(r.op) ? '<span class="fr-leer">—</span>'
            : `<input data-w="${p2}" value="${esc(r.wert ?? '')}" placeholder="Wert">`) +
          `<button data-weg="${p2}" title="Regel entfernen">✕</button>` +
        '</div>';
      }).join('');

      return `<div class="fg" data-tiefe="${tiefe}">${kopf}${zeilen ||
        '<div class="fg-leer">Noch keine Regel</div>'}</div>`;
    };

    const hole = (pfad) => {
      if (pfad === '') return view.filters;
      let ziel = view.filters;
      const teile = pfad.split('.');
      teile.forEach((i, n) => {
        ziel = n === teile.length - 1 ? ziel.rules[+i] : ziel.rules[+i];
      });
      return ziel;
    };
    const eltern = (pfad) => {
      const teile = pfad.split('.');
      const letzte = +teile.pop();
      let ziel = view.filters;
      teile.forEach(i => ziel = ziel.rules[+i]);
      return { gruppe: ziel, index: letzte };
    };

    const speichern = () => {
      Store.updateView(view.id, { filters: view.filters });
      zeichne();
      App.zeichneSeite();
    };

    const zeichne = () => {
      o.querySelector('#fb').innerHTML =
        `<div class="fg-wurzel"><button class="fg-op" data-op="">` +
        `${view.filters.operator === 'or' ? 'ODER' : 'UND'}</button>` +
        `<span>alle Regeln verbinden</span></div>` +
        zeichneGruppe(view.filters, '', 0);
    };
    zeichne();

    o.addEventListener('change', e => {
      const k = e.target.dataset.k, op = e.target.dataset.o, w = e.target.dataset.w;
      if (k !== undefined) {
        const r = hole(k);
        r.key = e.target.value;
        const ops = OPERATOREN[coll.schema[r.key].type] || OPERATOREN.text;
        if (!ops.includes(r.op)) r.op = ops[0];
        speichern();
      }
      if (op !== undefined) { hole(op).op = e.target.value; speichern(); }
      if (w !== undefined)  { hole(w).wert = e.target.value; speichern(); }
    });

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]') || e.target.closest('[data-a="ok"]')) {
        o.remove(); return;
      }
      const opB = e.target.closest('[data-op]');
      if (opB) {
        const g = hole(opB.dataset.op);
        g.operator = g.operator === 'or' ? 'and' : 'or';
        speichern(); return;
      }
      const weg = e.target.closest('[data-weg]');
      if (weg) {
        const { gruppe, index } = eltern(weg.dataset.weg);
        gruppe.rules.splice(index, 1);
        speichern(); return;
      }
      const addR = e.target.closest('[data-add-regel]');
      if (addR) {
        const g = hole(addR.dataset.addRegel);
        const k = keys[0];
        g.rules.push({ key: k, op: (OPERATOREN[coll.schema[k].type] || OPERATOREN.text)[0], wert: '' });
        speichern(); return;
      }
      if (e.target.closest('[data-a="regel"]')) {
        const k = keys[0];
        view.filters.rules.push({ key: k, op: (OPERATOREN[coll.schema[k].type] || OPERATOREN.text)[0], wert: '' });
        speichern(); return;
      }
      if (e.target.closest('[data-a="gruppe"]')) {
        const k = keys[0];
        view.filters.rules.push({ operator: 'or',
          rules: [{ key: k, op: (OPERATOREN[coll.schema[k].type] || OPERATOREN.text)[0], wert: '' }] });
        speichern(); return;
      }
      if (e.target.closest('[data-a="leeren"]')) {
        view.filters = { operator: 'and', rules: [] };
        speichern(); return;
      }
    });
  };

  const sortMenue = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const html =
      '<div class="grp">Sortieren nach</div>' +
      Object.keys(coll.schema).map(k =>
        `<button data-k="${k}"><span class="mi">${propTyp(coll.schema[k].type).icon}</span>` +
        `${esc(coll.schema[k].name)}</button>`).join('') +
      (view.sorts?.length ? '<hr><button data-a="clear">Sortierung entfernen</button>' : '');

    const m = UI.menu(html, r.left, r.bottom + 4);
    m.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'clear') {
        Store.updateView(view.id, { sorts: [] });
        m.remove(); App.zeichneSeite(); return;
      }
      const k = b.dataset.k;
      if (!k) return;
      m.innerHTML = '<div class="grp">Richtung</div>' +
        '<button data-d="auf">↑ Aufsteigend</button>' +
        '<button data-d="ab">↓ Absteigend</button>';
      m.addEventListener('click', ev => {
        const d = ev.target.closest('button[data-d]');
        if (!d) return;
        Store.updateView(view.id, { sorts: [{ key: k, richtung: d.dataset.d }] });
        m.remove(); App.zeichneSeite();
      });
    });
  };

  const eigenschaftenMenue = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const html = '<div class="grp">Sichtbare Eigenschaften</div>' +
      Object.keys(coll.schema).map(k => {
        const aus = (view.hidden || []).includes(k);
        return `<button data-k="${k}"><span class="mi">${aus ? '☐' : '☑'}</span>` +
               `${esc(coll.schema[k].name)}</button>`;
      }).join('') +
      '<hr><button data-a="new"><span class="mi">+</span>Neue Eigenschaft</button>';

    const m = UI.menu(html, r.left, r.bottom + 4);
    m.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.a === 'new') { m.remove(); neueEigenschaft(anker, coll, block); return; }
      const k = b.dataset.k;
      if (!k) return;
      const h = view.hidden || [];
      Store.updateView(view.id, { hidden: h.includes(k) ? h.filter(x => x !== k) : [...h, k] });
      App.zeichneSeite();
      m.remove();
    });
  };

  const neueEigenschaft = (anker, coll, block) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Neue Eigenschaft</div>' +
      TYPEN.filter(t => t.id !== 'title')
           .map(t => `<button data-t="${t.id}"><span class="mi">${t.icon}</span>${t.name}</button>`).join(''),
      r.left, r.bottom + 4);
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      const t = b.dataset.t;
      const name = prompt('Name der Eigenschaft', propTyp(t).name);
      if (!name) { m.remove(); return; }
      const key = Store.uid().slice(0, 5);
      coll.schema[key] = { name, type: t };
      if (['select','status','multi'].includes(t)) coll.schema[key].options = [];
      if (t === 'formula') {
        const f = prompt('Formel eingeben, z. B.  prop("Zahl") * 2', '');
        coll.schema[key].formula = f || '';
      }
      if (t === 'relation') {
        const andere = Object.values(Store.cache.collections);
        coll.schema[key].ziel = (andere.find(c => c.id !== coll.id) || andere[0] || {}).id || '';
      }
      if (t === 'rollup') coll.schema[key].rollup = 'Anzahl alle';
      if (t === 'ki') coll.schema[key].auftrag = 'Fasse diesen Eintrag in einem kurzen Satz zusammen.';
      if (t === 'button') coll.schema[key].knopfText = 'Ausführen';
      Store.updateCollection(coll.id, { schema: coll.schema });
      m.remove();
      App.zeichneSeite();
      if (t === 'rollup') rollupEditor(coll, key);
      if (t === 'relation') relationEinrichten(coll, key);
    });
  };

  const spaltenMenue = (anker, coll, view, key, block) => {
    const r = anker.getBoundingClientRect();
    const def = coll.schema[key];
    const keys = Object.keys(coll.schema);
    const idx = keys.indexOf(key);
    const umbruchAn = (view.umbruch || []).includes(key);

    const m = UI.menu(
      `<div class="grp">${esc(def.name)}</div>` +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="type"><span class="mi">⇄</span>Typ ändern</button>' +
      '<button data-a="beschreibung"><span class="mi">ℹ</span>Beschreibung</button>' +
      (def.type === 'formula'  ? '<button data-a="formula"><span class="mi">∑</span>Formel bearbeiten</button>' : '') +
      (['select','status','multi'].includes(def.type)
        ? '<button data-a="optionen"><span class="mi">⊙</span>Optionen bearbeiten</button>' : '') +
      (def.type === 'relation' ? '<button data-a="relein"><span class="mi">⇄</span>Verknüpfung einrichten</button>' : '') +
      (def.type === 'rollup'   ? '<button data-a="rollup"><span class="mi">⤴</span>Rollup einrichten</button>' : '') +
      (['number','formula','rollup'].includes(def.type)
        ? '<button data-a="anzeige"><span class="mi">▤</span>Anzeigen als …</button>' : '') +
      (def.type === 'uid'      ? '<button data-a="praefix"><span class="mi">ID</span>Vorsilbe setzen</button>' : '') +
      (def.type === 'ki'       ? '<button data-a="kiauftrag"><span class="mi">✨</span>Auftrag an die KI</button>' : '') +
      '<hr>' +
      '<button data-a="asc"><span class="mi">↑</span>Aufsteigend sortieren</button>' +
      '<button data-a="desc"><span class="mi">↓</span>Absteigend sortieren</button>' +
      '<button data-a="filter"><span class="mi">⚟</span>Nach dieser Spalte filtern</button>' +
      '<hr>' +
      `<button data-a="umbruch"><span class="mi">↵</span>Text umbrechen<span class="ms">${umbruchAn ? 'an' : 'aus'}</span></button>` +
      `<button data-a="fix"><span class="mi">📌</span>Spalte fixieren` +
        `<span class="ms">${(view.fixiert || []).includes(key) ? 'an' : 'aus'}</span></button>` +
      '<button data-a="links"><span class="mi">←</span>Nach links</button>' +
      '<button data-a="rechts"><span class="mi">→</span>Nach rechts</button>' +
      '<button data-a="hide"><span class="mi">👁</span>In dieser Ansicht ausblenden</button>' +
      (def.type !== 'title'
        ? '<hr><button data-a="dup"><span class="mi">⧉</span>Eigenschaft duplizieren</button>' +
          '<button data-a="del"><span class="mi">🗑</span>Eigenschaft löschen</button>'
        : ''),
      r.left, r.bottom + 2);

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      if (a === 'type') {
        m.innerHTML = '<div class="grp">Typ ändern</div>' +
          TYPEN.map(t => `<button data-t="${t.id}"><span class="mi">${t.icon}</span>${t.name}</button>`).join('');
        m.addEventListener('click', ev => {
          const t = ev.target.closest('button[data-t]');
          if (!t) return;
          def.type = t.dataset.t;
          if (['select','status','multi'].includes(def.type) && !def.options) def.options = [];
          if (def.type === 'formula' && !def.formula) def.formula = '';
          Store.updateCollection(coll.id, { schema: coll.schema });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      /* Untermenüs */
      if (a === 'optionen') { m.remove(); optionenEditor(coll, key); return; }
      if (a === 'rollup')   { m.remove(); rollupEditor(coll, key); return; }
      if (a === 'anzeige') {
        m.innerHTML = '<div class="grp">Anzeigen als</div>' +
          '<button data-z="zahl">Zahl</button><button data-z="bar">Balken</button>' +
          '<button data-z="ring">Ring</button>';
        m.addEventListener('click', ev => {
          const z = ev.target.closest('button[data-z]');
          if (!z) return;
          def.anzeige = z.dataset.z === 'zahl' ? '' : z.dataset.z;
          Store.updateCollection(coll.id, { schema: coll.schema });
          m.remove(); App.zeichneSeite();
        });
        return;
      }
      if (a === 'relein') { m.remove(); relationEinrichten(coll, key); return; }
      if (a === 'relziel') {
        const alle = Object.values(Store.cache.collections);
        m.innerHTML = '<div class="grp">Zieldatenbank</div>' +
          alle.map(c => `<button data-c="${c.id}">${esc(c.name)}</button>`).join('');
        m.addEventListener('click', ev => {
          const c = ev.target.closest('button[data-c]');
          if (!c) return;
          def.ziel = c.dataset.c;
          Store.updateCollection(coll.id, { schema: coll.schema });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      m.remove();

      if (a === 'rename') {
        const n = await UI.frage('Neuer Name', def.name);
        if (n) { def.name = n; Store.updateCollection(coll.id, { schema: coll.schema }); App.zeichneSeite(); }
      }
      if (a === 'beschreibung') {
        const t = await UI.frage('Beschreibung dieser Spalte', def.beschreibung || '');
        if (t !== null) { def.beschreibung = t; Store.updateCollection(coll.id, { schema: coll.schema }); App.zeichneSeite(); }
      }
      if (a === 'praefix') {
        const t = await UI.frage('Vorsilbe der laufenden Nummer, z. B. AUF', def.praefix || '');
        if (t !== null) { def.praefix = t; Store.updateCollection(coll.id, { schema: coll.schema }); App.zeichneSeite(); }
      }
      if (a === 'kiauftrag') {
        const t = await UI.frage('Was soll die KI in dieses Feld schreiben?',
          def.auftrag || 'Fasse diesen Eintrag in einem kurzen Satz zusammen.');
        if (t !== null) { def.auftrag = t; Store.updateCollection(coll.id, { schema: coll.schema }); App.zeichneSeite(); }
      }
      if (a === 'formula') formelEditor(coll, key);
      if (a === 'asc')  { Store.updateView(view.id, { sorts:[{key, richtung:'auf'}] }); App.zeichneSeite(); }
      if (a === 'desc') { Store.updateView(view.id, { sorts:[{key, richtung:'ab'}]  }); App.zeichneSeite(); }
      if (a === 'filter') {
        const ops = OPERATOREN[def.type] || OPERATOREN.text;
        view.filters = view.filters || { operator: 'and', rules: [] };
        const wert2 = ['ist leer','ist nicht leer','ist aktiviert','ist nicht aktiviert'].includes(ops[0])
          ? '' : await UI.frage(`${def.name} ${ops[0]} …`, '');
        if (wert2 === null) return;
        view.filters.rules.push({ key, op: ops[0], wert: wert2 });
        Store.updateView(view.id, { filters: view.filters });
        App.zeichneSeite();
      }
      if (a === 'fix') {
        const fx = view.fixiert || [];
        Store.updateView(view.id, { fixiert: fx.includes(key) ? fx.filter(x => x !== key) : [...fx, key] });
        App.zeichneSeite();
      }
      if (a === 'umbruch') {
        const u = view.umbruch || [];
        Store.updateView(view.id, { umbruch: u.includes(key) ? u.filter(x => x !== key) : [...u, key] });
        App.zeichneSeite();
      }
      if (a === 'links' || a === 'rechts') {
        const ziel = a === 'links' ? idx - 1 : idx + 1;
        if (ziel < 0 || ziel >= keys.length) return;
        const neuOrdnung = keys.slice();
        neuOrdnung.splice(idx, 1);
        neuOrdnung.splice(ziel, 0, key);
        const neuSchema = {};
        neuOrdnung.forEach(k => neuSchema[k] = coll.schema[k]);
        Store.updateCollection(coll.id, { schema: neuSchema });
        App.zeichneSeite();
      }
      if (a === 'hide') {
        const h = view.hidden || [];
        Store.updateView(view.id, { hidden: [...h, key] });
        App.zeichneSeite();
      }
      if (a === 'dup') {
        const neuKey = Store.uid().slice(0, 5);
        coll.schema[neuKey] = JSON.parse(JSON.stringify(def));
        coll.schema[neuKey].name = def.name + ' Kopie';
        Store.updateCollection(coll.id, { schema: coll.schema });
        Store.rowsOf(coll.id).forEach(r => Store.setProp(r.id, neuKey, (r.props || {})[key]));
        App.zeichneSeite();
      }
      if (a === 'del') {
        if (!confirm(`„${def.name}" löschen? Die Werte in dieser Spalte gehen verloren.`)) return;
        delete coll.schema[key];
        Store.updateCollection(coll.id, { schema: coll.schema });
        App.zeichneSeite();
      }
    });
  };

  /* --- Auswahl-Optionen bearbeiten ---------------------------------------- */
  const optionenEditor = (coll, key) => {
    const def = coll.schema[key];
    def.options = def.options || [];

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(520px,94vw)">' +
        `<div class="fh">Optionen von „${esc(def.name)}"<button class="icon-btn" data-a="zu">✕</button></div>` +
        '<div class="res" id="op"></div>' +
        '<div class="fbtns"><input id="neu" placeholder="Neue Option …" ' +
        'style="flex:1; padding:8px 10px; background:var(--bg-input); border:1px solid var(--line); ' +
        'border-radius:7px; outline:none; color:var(--text)">' +
        '<button data-a="add" class="prim">Hinzufügen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const zeichne = () => {
      o.querySelector('#op').innerHTML = def.options.length
        ? def.options.map((opt, i) =>
            `<div class="opt-zeile"><span class="tag bg-${opt.color}">${esc(opt.name)}</span>` +
            '<div class="opt-farben">' +
            FARBEN.map(f => `<button data-i="${i}" data-f="${f}" title="${f}" ` +
              `style="background:var(--b-${f})"></button>`).join('') +
            '</div><button data-del="' + i + '" title="Option löschen">🗑</button></div>').join('')
        : '<div style="padding:16px; color:var(--text-faint); font-size:14px">Noch keine Optionen.</div>';
    };
    zeichne();

    const speichern = () => {
      Store.updateCollection(coll.id, { schema: coll.schema });
      zeichne();
      App.zeichneSeite();
    };

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const f = e.target.closest('button[data-f]');
      if (f) { def.options[+f.dataset.i].color = f.dataset.f; speichern(); return; }
      const d = e.target.closest('button[data-del]');
      if (d) { def.options.splice(+d.dataset.del, 1); speichern(); return; }
      if (e.target.closest('[data-a="add"]')) {
        const inp = o.querySelector('#neu');
        if (!inp.value.trim()) return;
        def.options.push({ name: inp.value.trim(), color: FARBEN[def.options.length % FARBEN.length] });
        inp.value = '';
        speichern();
      }
    });
    o.querySelector('#neu').addEventListener('keydown', e => {
      if (e.key === 'Enter') o.querySelector('[data-a="add"]').click();
    });
  };

  /* --- Rollup einrichten --------------------------------------------------- */
  const rollupEditor = (coll, key) => {
    const def = coll.schema[key];
    const relKeys = Object.keys(coll.schema).filter(k => coll.schema[k].type === 'relation');
    if (!relKeys.length) {
      UI.toast('Für ein Rollup braucht es zuerst eine Verknüpfungs-Spalte');
      return;
    }
    const relKey = def.relation && coll.schema[def.relation] ? def.relation : relKeys[0];
    const ziel = Store.getCollection(coll.schema[relKey].ziel);

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(520px,94vw)">' +
        `<div class="fh">Rollup „${esc(def.name)}"<button class="icon-btn" data-a="zu">✕</button></div>` +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
          '<label>Über welche Verknüpfung?<br><select id="rel">' +
            relKeys.map(k => `<option value="${k}"${k === relKey ? ' selected' : ''}>${esc(coll.schema[k].name)}</option>`).join('') +
          '</select></label>' +
          '<label>Welche Spalte der Zieldatenbank?<br><select id="zk">' +
            (ziel ? Object.keys(ziel.schema).map(k =>
              `<option value="${k}"${k === def.zielKey ? ' selected' : ''}>${esc(ziel.schema[k].name)}</option>`).join('')
                  : '<option value="">— erst Zieldatenbank wählen —</option>') +
          '</select></label>' +
          '<label>Wie zusammenfassen?<br><select id="art">' +
            ROLLUP_ARTEN.map(a => `<option${a === def.rollup ? ' selected' : ''}>${a}</option>`).join('') +
          '</select></label>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Übernehmen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (!e.target.closest('[data-a="ok"]')) return;
      def.relation = o.querySelector('#rel').value;
      def.zielKey  = o.querySelector('#zk').value;
      def.rollup   = o.querySelector('#art').value;
      Store.updateCollection(coll.id, { schema: coll.schema });
      o.remove();
      App.zeichneSeite();
    });
  };

  const rechnenMenue = (anker, coll, view, key, rows) => {
    const r = anker.getBoundingClientRect();
    const def = coll.schema[key];
    let liste = [...RECHNUNGEN.alle];
    if (def.type === 'number' || def.type === 'formula') liste = liste.concat(RECHNUNGEN.number);
    if (def.type === 'checkbox') liste = liste.concat(RECHNUNGEN.checkbox);
    if (['date','created','edited'].includes(def.type)) liste = liste.concat(RECHNUNGEN.date);

    const m = UI.menu('<div class="grp">Berechnen</div>' +
      liste.map(x => `<button data-c="${esc(x)}">${x}</button>`).join(''),
      r.left, r.top - 10);

    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-c]');
      if (!b) return;
      view.calc = view.calc || {};
      view.calc[key] = b.dataset.c;
      Store.updateView(view.id, { calc: view.calc });
      m.remove();
      App.zeichneSeite();
    });
  };

  const dbMenue = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<button data-a="rename"><span class="mi">✎</span>Datenbank umbenennen</button>' +
      '<button data-a="icon"><span class="mi">😀</span>Symbol ändern</button>' +
      '<hr>' +
      '<button data-a="group"><span class="mi">⊞</span>Gruppieren nach …</button>' +
      '<button data-a="untergruppe"><span class="mi">⊟</span>Untergruppieren nach …</button>' +
      `<button data-a="hoehe"><span class="mi">↕</span>Zeilenhöhe<span class="ms">${view.hoehe || 'normal'}</span></button>` +
      `<button data-a="oeffnen"><span class="mi">◧</span>Einträge öffnen als` +
        `<span class="ms">${view.oeffnenAls === 'voll' ? 'Seite' : 'Vorschau'}</span></button>` +
      `<button data-a="kartengroesse"><span class="mi">▩</span>Kartengrösse<span class="ms">${view.kartenGroesse || 'mittel'}</span></button>` +
      `<button data-a="leere"><span class="mi">␀</span>Leere Gruppen<span class="ms">${view.leereGruppen ? 'zeigen' : 'aus'}</span></button>` +
      `<button data-a="limit"><span class="mi">≡</span>Höchstens anzeigen<span class="ms">${view.limit || 'alle'}</span></button>` +
      '<hr>' +
      '<button data-a="link"><span class="mi">🔗</span>Link zur Ansicht kopieren</button>' +
      '<button data-a="csv"><span class="mi">⭳</span>Als CSV exportieren</button>' +
      '<button data-a="csvin"><span class="mi">⭱</span>CSV einlesen</button>' +
      '<button data-a="ai"><span class="mi">✨</span>Mit KI auswerten</button>' +
      '<hr><button data-a="del"><span class="mi">🗑</span>Datenbank löschen</button>',
      r.left - 120, r.bottom + 4);

    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      if (a === 'group' || a === 'untergruppe') {
        const feld = a === 'group' ? 'groupBy' : 'subGroupBy';
        m.innerHTML = `<div class="grp">${a === 'group' ? 'Gruppieren' : 'Untergruppieren'} nach</div>` +
          Object.keys(coll.schema)
            .filter(k => ['select','status','checkbox','multi','person','date'].includes(coll.schema[k].type))
            .map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
          '<hr><button data-k="">Keine</button>';
        m.addEventListener('click', ev => {
          const kb = ev.target.closest('button[data-k]');
          if (!kb) return;
          Store.updateView(view.id, { [feld]: kb.dataset.k });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      if (a === 'hoehe') {
        m.innerHTML = '<div class="grp">Zeilenhöhe</div>' +
          ['klein','normal','gross'].map(h => `<button data-h="${h}">${h}</button>`).join('');
        m.addEventListener('click', ev => {
          const h = ev.target.closest('button[data-h]');
          if (!h) return;
          Store.updateView(view.id, { hoehe: h.dataset.h });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      if (a === 'kartengroesse') {
        m.innerHTML = '<div class="grp">Kartengrösse</div>' +
          ['klein','mittel','gross'].map(g => `<button data-g="${g}">${g}</button>`).join('');
        m.addEventListener('click', ev => {
          const g = ev.target.closest('button[data-g]');
          if (!g) return;
          Store.updateView(view.id, { kartenGroesse: g.dataset.g });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      if (a === 'limit') {
        m.innerHTML = '<div class="grp">Höchstens anzeigen</div>' +
          [25, 50, 100, 0].map(n => `<button data-n="${n}">${n ? n + ' Einträge' : 'alle'}</button>`).join('');
        m.addEventListener('click', ev => {
          const n = ev.target.closest('button[data-n]');
          if (!n) return;
          Store.updateView(view.id, { limit: +n.dataset.n || 0 });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      if (a === 'icon') {
        m.remove();
        UI.emojiWaehlen(anker, (em) => {
          Store.updateCollection(coll.id, { icon: em });
          App.zeichneSeite();
        });
        return;
      }

      m.remove();
      if (a === 'rename') {
        const n = prompt('Name der Datenbank', coll.name);
        if (n) {
          Store.updateCollection(coll.id, { name: n });
          Store.updateBlock(block.id, { text: n });
          App.zeichneSeite();
        }
      }
      if (a === 'oeffnen') {
        Store.updateView(view.id, { oeffnenAls: view.oeffnenAls === 'voll' ? 'peek' : 'voll' });
        App.zeichneSeite();
      }
      if (a === 'leere') {
        Store.updateView(view.id, { leereGruppen: !view.leereGruppen });
        App.zeichneSeite();
      }
      if (a === 'link') {
        navigator.clipboard?.writeText(location.origin + location.pathname + '#' + App.aktuelleSeite() + ':' + view.id);
        UI.toast('Link zur Ansicht kopiert');
      }
      if (a === 'csv') csvExport(coll, view);
      if (a === 'csvin') csvImport(coll);
      if (a === 'ai')  KI.datenbankAuswerten(coll, view);
      if (a === 'del') {
        if (!confirm(`Datenbank „${coll.name}" mit allen Einträgen löschen?`)) return;
        Store.trashBlock(block.id);
        Store.purgeBlock(block.id);
        App.zeichneSeite();
      }
    });
  };

  /* --- Formel-Editor ------------------------------------------------------ */
  const formelEditor = (coll, key) => {
    const def = coll.schema[key];
    const spalten = Object.values(coll.schema).map(s => s.name);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="finder" style="width:min(720px,94vw)">
        <div style="padding:14px 18px; border-bottom:1px solid var(--line); font-weight:600">
          Formel für „${esc(def.name)}"
        </div>
        <textarea id="fx" spellcheck="false" style="width:100%; min-height:150px; padding:14px 18px;
          background:var(--bg-input); border:none; outline:none; font:13.5px/1.5 var(--mono);
          resize:vertical">${esc(def.formula || '')}</textarea>
        <div id="fxout" style="padding:10px 18px; font-size:13px; border-top:1px solid var(--line);
          font-family:var(--mono); min-height:20px"></div>
        <div style="padding:10px 18px; font-size:12px; color:var(--text-dim); border-top:1px solid var(--line)">
          Spalten: ${spalten.map(s => `<code style="cursor:pointer" class="fxp">prop("${esc(s)}")</code>`).join(' ')}
          <br><br>Text wird mit <b>+</b> verkettet, nicht mit concat(). concat() ist nur für Listen.
        </div>
        <div style="padding:12px 18px; display:flex; gap:8px; justify-content:flex-end;
          border-top:1px solid var(--line)">
          <button id="fxc" style="padding:7px 14px; border-radius:6px">Abbrechen</button>
          <button id="fxs" style="padding:7px 14px; border-radius:6px; background:var(--accent); color:#fff">Speichern</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const ta  = overlay.querySelector('#fx');
    const out = overlay.querySelector('#fxout');

    const pruefe = () => {
      const c = Formula.check(ta.value);
      if (!c.ok) { out.style.color = 'var(--c-red)'; out.textContent = '⚠ ' + c.fehler; return; }
      /* Mit der ersten Zeile testen, damit man das Ergebnis sieht */
      const erste = Store.rowsOf(coll.id)[0];
      if (erste) {
        const r = Formula.run(ta.value, (name) => {
          const k = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
          return k ? wert(erste, k, coll) : null;
        });
        out.style.color = r.ok ? 'var(--c-green)' : 'var(--c-red)';
        out.textContent = r.ok ? '✓ Beispiel: ' + Formula.anzeige(r.wert) : '⚠ ' + r.fehler;
      } else {
        out.style.color = 'var(--c-green)';
        out.textContent = '✓ Formel ist gültig';
      }
    };

    ta.addEventListener('input', pruefe);
    pruefe();
    ta.focus();

    overlay.querySelectorAll('.fxp').forEach(c => c.addEventListener('click', () => {
      ta.value += c.textContent;
      ta.focus();
      pruefe();
    }));

    overlay.querySelector('#fxc').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#fxs').addEventListener('click', () => {
      def.formula = ta.value;
      Store.updateCollection(coll.id, { schema: coll.schema });
      overlay.remove();
      App.zeichneSeite();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  };

  /* --- Suche in der Datenbank -------------------------------------------- */
  const suchFeld = (wrap, coll, view, block) => {
    let box = wrap.querySelector('.dbsuche');
    if (box) { box.remove(); return; }
    box = document.createElement('input');
    box.className = 'dbsuche';
    box.placeholder = 'In dieser Datenbank suchen …';
    box.style.cssText = 'width:100%; padding:7px 10px; margin-bottom:8px; background:var(--bg-input); ' +
                        'border:1px solid var(--line); border-radius:6px; outline:none; font-size:14px';
    wrap.insertBefore(box, wrap.children[1]);
    box.focus();
    box.addEventListener('input', () => {
      const q = box.value.toLowerCase();
      wrap.querySelectorAll('tbody tr').forEach(tr => {
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  };

  /* --- CSV-Export --------------------------------------------------------- */
  const csvExport = (coll, view) => {
    const keys = Object.keys(coll.schema);
    const rows = zeilen(coll, view);
    const feld = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const csv = [
      keys.map(k => feld(coll.schema[k].name)).join(','),
      ...rows.map(r => keys.map(k => {
        const v = wert(r, k, coll);
        return feld(Array.isArray(v) ? v.join('; ') : Formula.anzeige(v));
      }).join(','))
    ].join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = coll.name.replace(/[^\wäöüÄÖÜß -]/g, '') + '.csv';
    a.click();
    UI.toast('CSV heruntergeladen');
  };

  /* ========================================================================
   * ZEILENVORLAGEN   (Notions „New with template")
   * ======================================================================*/
  const vorlagenMenue = (anker, coll, view) => {
    const liste = coll.vorlagen || [];
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Neuer Eintrag mit Vorlage</div>' +
      (liste.length
        ? liste.map((v, i) =>
            `<button data-v="${i}"><span class="mi">${esc(v.icon || '🧩')}</span>${esc(v.name)}` +
            `<span class="ms" data-vweg="${i}">✕</span></button>`).join('')
        : '<div class="grp" style="font-weight:400">Noch keine Vorlage</div>') +
      '<hr>' +
      '<button data-a="leer"><span class="mi">＋</span>Leerer Eintrag</button>' +
      '<button data-a="neu"><span class="mi">🧩</span>Vorlage aus einem Eintrag anlegen</button>',
      r.right - 240, r.bottom + 6);

    m.addEventListener('click', async e => {
      const weg = e.target.closest('[data-vweg]');
      if (weg) {
        coll.vorlagen.splice(+weg.dataset.vweg, 1);
        Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
        m.remove(); UI.toast('Vorlage entfernt');
        return;
      }
      const b = e.target.closest('button[data-v], button[data-a]');
      if (!b) return;
      m.remove();

      if (b.dataset.a === 'leer') { Store.addRow(coll.id, {}); App.zeichneSeite(); return; }

      if (b.dataset.a === 'neu') {
        const zeilen = Store.rowsOf(coll.id);
        if (!zeilen.length) { UI.toast('Erst einen Eintrag anlegen'); return; }
        const w = UI.menu('<div class="grp">Welcher Eintrag wird zur Vorlage?</div>' +
          zeilen.slice(0, 30).map(z => `<button data-z="${z.id}">${esc(z.text || 'Ohne Titel')}</button>`).join(''),
          r.right - 240, r.bottom + 6);
        w.addEventListener('click', async ev => {
          const zb = ev.target.closest('button[data-z]');
          if (!zb) return;
          w.remove();
          const z = Store.getBlock(zb.dataset.z);
          const name = await UI.frage('Name der Vorlage', z.text || 'Vorlage');
          if (!name) return;
          coll.vorlagen = coll.vorlagen || [];
          coll.vorlagen.push({
            name, icon: '🧩',
            props: JSON.parse(JSON.stringify(z.props || {})),
            titel: z.text || '',
            inhalt: (Store.baum(z.id).kinder || [])
          });
          Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
          UI.toast('Vorlage gespeichert');
        });
        return;
      }

      /* Aus einer Vorlage anlegen */
      const v = liste[+b.dataset.v];
      if (!v) return;
      const neu2 = Store.addRow(coll.id, JSON.parse(JSON.stringify(v.props || {})));
      Store.updateBlock(neu2.id, { text: v.titel || v.name });
      (v.inhalt || []).forEach(k => Store.baumEinfuegen(k, neu2.id));
      App.zeichneSeite();
      UI.toast('Eintrag aus Vorlage angelegt');
    });
  };

  /* ========================================================================
   * AUTOMATIONEN
   * ------------------------------------------------------------------------
   * Notions Datenbank-Automationen: „Wenn etwas passiert, dann tu das."
   * Hier läuft alles im Browser — kein Dienst, keine Wartezeit.
   * ======================================================================*/
  const AUSLOESER = [
    ['zeile-neu',      'Ein Eintrag wird angelegt'],
    ['prop-geaendert', 'Eine Eigenschaft ändert sich'],
    ['prop-wert',      'Eine Eigenschaft bekommt einen bestimmten Wert'],
    ['zeit-vor',       'Einige Tage vor einem Datum'],
    ['zeit-nach',      'Einige Tage nach einem Datum']
  ];
  const AKTIONEN = [
    ['setze-prop',   'Eigenschaft setzen'],
    ['ki-fuellen',   'KI-Feld ausfüllen lassen'],
    ['erinnerung',   'Erinnerung anlegen'],
    ['unterseite',   'Unterseite im Eintrag anlegen'],
    ['zaehler',      'Zähler um eins erhöhen'],
    ['melden',       'Kurze Meldung zeigen']
  ];

  let imLauf = false;   /* verhindert, dass Automationen sich gegenseitig auslösen */

  const automationenLaufen = (row, coll, art, key, neuerWert) => {
    if (imLauf || !coll || !(coll.automationen || []).length) return;
    imLauf = true;
    try {
      coll.automationen.forEach(a => {
        if (a.an === false) return;
        const w = a.wenn || {};
        if (w.art !== art) return;
        if (w.art !== 'zeile-neu' && w.key && w.key !== key) return;
        if (w.art === 'prop-wert' && String(neuerWert ?? '') !== String(w.wert ?? '')) return;

        /* Zusätzliche Bedingungen — alle müssen zutreffen */
        if ((a.bedingungen || []).length &&
            !a.bedingungen.every(b => trifftZu(row, b, coll))) return;

        /* Gilt die Automation nur für eine Ansicht? Dann muss die Zeile
           auch durch deren Filter kommen. */
        if (a.nurAnsicht) {
          const v = Store.getView(a.nurAnsicht);
          if (v && !gruppeTrifftZu(row, v.filters, coll)) return;
        }

        (a.dann || []).forEach(d => {
          if (d.art === 'setze-prop' && d.key) {
            let v = d.wert ?? '';
            if (v === 'heute')  v = new Date().toISOString().slice(0, 10);
            if (v === 'morgen') { const t = new Date(); t.setDate(t.getDate() + 1); v = t.toISOString().slice(0, 10); }
            if (v === 'jetzt')  v = new Date().toISOString().slice(0, 16);
            Store.setProp(row.id, d.key, v);
          }
          if (d.art === 'zaehler' && d.key) {
            Store.setProp(row.id, d.key, Formula.zahl(wert(row, d.key, coll)) + 1);
          }
          if (d.art === 'ki-fuellen' && d.key) {
            kiFeldFuellen(row, d.key, coll);
          }
          if (d.art === 'erinnerung') {
            const zeit = new Date();
            zeit.setDate(zeit.getDate() + (Number(d.tage) || 1));
            const liste = Werkzeuge.erinnerungen();
            liste.push({ id: Store.uid(), pageId: row.id, zeit: zeit.toISOString().slice(0, 16),
                         text: row.text || coll.name, erledigt: false });
            Store.setMeta('erinnerungen', liste);
          }
          if (d.art === 'unterseite') {
            Store.addBlock(row.id, 'text', { text: d.text || '' });
          }
          if (d.art === 'melden') {
            UI.toast('⚡ ' + (d.text || a.name || 'Automation ausgeführt'));
          }
        });
      });
    } finally {
      imLauf = false;
    }
  };

  /**
   * Zeitauslöser: „drei Tage vor dem Fälligkeitsdatum". Wird beim Start und
   * danach stündlich geprüft. Jede Zeile löst höchstens einmal je Automation aus.
   */
  const zeitAutomationen = () => {
    Object.values(Store.cache.collections).forEach(coll => {
      (coll.automationen || []).forEach(a => {
        if (a.an === false) return;
        if (a.wenn.art !== 'zeit-vor' && a.wenn.art !== 'zeit-nach') return;
        const key = a.wenn.key;
        if (!coll.schema[key]) return;
        const tage = Number(a.wenn.wert) || 0;
        const heute2 = new Date(); heute2.setHours(0, 0, 0, 0);

        Store.rowsOf(coll.id).forEach(row => {
          const v = wert(row, key, coll);
          if (!v) return;
          const d = new Date(v);
          if (isNaN(d)) return;
          d.setHours(0, 0, 0, 0);
          const ziel = new Date(d);
          ziel.setDate(ziel.getDate() + (a.wenn.art === 'zeit-vor' ? -tage : tage));
          if (ziel.getTime() !== heute2.getTime()) return;

          const gemerkt = row.autoGelaufen || {};
          const marke = a.id + ':' + heute2.toISOString().slice(0, 10);
          if (gemerkt[marke]) return;
          gemerkt[marke] = true;
          Store.updateBlock(row.id, { autoGelaufen: gemerkt });
          automationenLaufen(row, coll, a.wenn.art, key);
        });
      });
    });
  };

  /* An die Speicherfunktionen hängen, damit jede Änderung erfasst wird. */
  const automationenEinklinken = () => {
    setTimeout(zeitAutomationen, 4000);
    setInterval(zeitAutomationen, 3600000);

    const altAddRow = Store.addRow;
    Store.addRow = function (collectionId, props) {
      const r = altAddRow.call(Store, collectionId, props);
      const c = Store.getCollection(collectionId);
      if (c) setTimeout(() => automationenLaufen(r, c, 'zeile-neu'), 0);
      return r;
    };
    const altSetProp = Store.setProp;
    Store.setProp = function (rowId, key, value) {
      const erg = altSetProp.call(Store, rowId, key, value);
      const r = Store.getBlock(rowId);
      const c = r && r.parentTable === 'collection' ? Store.getCollection(r.parentId) : null;
      if (c) setTimeout(() => {
        automationenLaufen(r, c, 'prop-geaendert', key, value);
        automationenLaufen(r, c, 'prop-wert', key, value);
      }, 0);
      return erg;
    };
  };

  const automationenMenue = (anker, coll, view, block) => {
    const liste = coll.automationen || [];
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">⚡ Automationen <em>${liste.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" id="al"></div>' +
        '<div class="fbtns"><button data-a="neu" class="prim">Automation anlegen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const namen = (k) => coll.schema[k]?.name || '?';
    const zeichne = () => {
      o.querySelector('#al').innerHTML = (coll.automationen || []).length
        ? coll.automationen.map((a, i) =>
            `<div class="auto-zeile">` +
              `<button class="schalter${a.an === false ? '' : ' an'}" data-an="${i}"><i></i></button>` +
              `<div class="auto-text"><b>${esc(a.name || 'Ohne Namen')}</b>` +
              `<span>Wenn: ${esc((AUSLOESER.find(x => x[0] === a.wenn.art) || [])[1] || '')}` +
              (a.wenn.key ? ' — ' + esc(namen(a.wenn.key)) : '') +
              (a.wenn.art === 'prop-wert' ? ' = ' + esc(a.wenn.wert) : '') +
              ` · Dann: ${a.dann.map(d => esc((AKTIONEN.find(x => x[0] === d.art) || [])[1] || '')).join(', ')}` +
              `</span></div>` +
              `<button data-weg="${i}" title="Löschen">🗑</button>` +
            '</div>').join('')
        : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
          'Noch keine Automation. Zum Beispiel: <i>Wenn Status auf „Erledigt" springt, ' +
          'dann setze das Datum von heute.</i></div>';
    };
    zeichne();

    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }

      const an = e.target.closest('[data-an]');
      if (an) {
        const a = coll.automationen[+an.dataset.an];
        a.an = a.an === false;
        Store.updateCollection(coll.id, { automationen: coll.automationen });
        zeichne();
        return;
      }
      const weg = e.target.closest('[data-weg]');
      if (weg) {
        coll.automationen.splice(+weg.dataset.weg, 1);
        Store.updateCollection(coll.id, { automationen: coll.automationen });
        zeichne();
        return;
      }
      if (e.target.closest('[data-a="neu"]')) { o.remove(); automationBauen(coll); }
    });
  };

  const automationBauen = (coll) => {
    const keys = Object.keys(coll.schema);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(560px,94vw)">' +
        '<div class="fh">Neue Automation<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
          '<label>Name<br><input id="an" value="Neue Automation"></label>' +
          '<label>Wenn …<br><select id="aw">' +
            AUSLOESER.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
          '</select></label>' +
          '<label>… bei dieser Eigenschaft<br><select id="ak">' +
            keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
          '</select></label>' +
          '<label id="awl">… mit diesem Wert<br><input id="av" placeholder="z. B. Erledigt"></label>' +
          '<hr style="border:none;border-top:1px solid var(--line)">' +
          '<label>Dann …<br><select id="ad">' +
            AKTIONEN.map(([id, n]) => `<option value="${id}">${n}</option>`).join('') +
          '</select></label>' +
          '<label id="adk">… diese Eigenschaft<br><select id="adk2">' +
            keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
          '</select></label>' +
          '<label id="adw">… auf diesen Wert<br><input id="adv" placeholder="z. B. heute"></label>' +
        '</div>' +
        '<div class="fbtns">' +
          '<button data-a="bedingung">＋ Bedingung</button>' +
          '<button data-a="mehr">＋ Weitere Aktion</button>' +
          '<button data-a="ok" class="prim">Anlegen</button>' +
          '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const auffrischen = () => {
      const art0 = o.querySelector('#aw').value;
      const zeit = art0 === 'zeit-vor' || art0 === 'zeit-nach';
      o.querySelector('#awl').style.display = (art0 === 'prop-wert' || zeit) ? '' : 'none';
      o.querySelector('#awl').firstChild.textContent = zeit ? 'wie viele Tage?' : '… mit diesem Wert';
      o.querySelector('#av').placeholder = zeit ? 'z. B. 3' : 'z. B. Erledigt';
      const d = o.querySelector('#ad').value;
      o.querySelector('#adk').style.display = ['setze-prop','ki-fuellen','zaehler'].includes(d) ? '' : 'none';
      o.querySelector('#adw').style.display = ['setze-prop','erinnerung','unterseite','melden'].includes(d) ? '' : 'none';
      o.querySelector('#adv').placeholder = d === 'erinnerung' ? 'in wie vielen Tagen? z. B. 3'
                                          : d === 'melden' ? 'Text der Meldung' : 'Wert';
    };
    auffrischen();
    o.querySelector('#aw').addEventListener('change', auffrischen);
    o.querySelector('#ad').addEventListener('change', auffrischen);

    const gesammelt = [];
    const bedingungen = [];

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }

      /* Zusätzliche Bedingung aufnehmen */
      if (e.target.closest('[data-a="bedingung"]')) {
        const k = o.querySelector('#ak').value;
        const ops = OPERATOREN[coll.schema[k].type] || OPERATOREN.text;
        bedingungen.push({ key: k, op: ops[0], wert: o.querySelector('#av').value });
        UI.toast(bedingungen.length + ' Bedingung(en) — alle müssen zutreffen');
        return;
      }

      if (!e.target.closest('[data-a="ok"]') && !e.target.closest('[data-a="mehr"]')) return;
      const d = o.querySelector('#ad').value;
      const dann = { art: d };
      if (['setze-prop','ki-fuellen','zaehler'].includes(d)) dann.key = o.querySelector('#adk2').value;
      const wertFeld = o.querySelector('#adv').value;
      if (d === 'setze-prop') dann.wert = wertFeld === 'heute' ? new Date().toISOString().slice(0, 10) : wertFeld;
      if (d === 'erinnerung') dann.tage = wertFeld;
      if (d === 'unterseite' || d === 'melden') dann.text = wertFeld;

      gesammelt.push(dann);

      if (e.target.closest('[data-a="mehr"]')) {
        UI.toast(gesammelt.length + ' Aktionen gesammelt — noch eine einstellen');
        o.querySelector('#adv').value = '';
        return;
      }

      coll.automationen = coll.automationen || [];
      coll.automationen.push({
        id: Store.uid().slice(0, 6),
        name: o.querySelector('#an').value,
        an: true,
        wenn: { art: o.querySelector('#aw').value, key: o.querySelector('#ak').value,
                wert: o.querySelector('#av').value },
        bedingungen: bedingungen,
        dann: gesammelt
      });
      Store.updateCollection(coll.id, { automationen: coll.automationen });
      o.remove();
      UI.toast('Automation mit ' + gesammelt.length +
               (gesammelt.length === 1 ? ' Aktion angelegt' : ' Aktionen angelegt'));
    });
  };

  /* ========================================================================
   * CSV EINLESEN
   * ------------------------------------------------------------------------
   * Notions Import für Tabellen: die Kopfzeile wird zum Schema, jede
   * weitere Zeile zu einem Eintrag. Fehlende Spalten werden angelegt.
   * ======================================================================*/
  const csvZerlegen = (text) => {
    const zeilen = [];
    let feld = '', zeile = [], inAnf = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inAnf) {
        if (c === '"' && text[i + 1] === '"') { feld += '"'; i++; }
        else if (c === '"') inAnf = false;
        else feld += c;
      } else if (c === '"') inAnf = true;
      else if (c === ',' || c === ';' || c === '\t') { zeile.push(feld); feld = ''; }
      else if (c === '\n') { zeile.push(feld); zeilen.push(zeile); zeile = []; feld = ''; }
      else if (c !== '\r') feld += c;
    }
    if (feld || zeile.length) { zeile.push(feld); zeilen.push(zeile); }
    return zeilen.filter(z => z.some(x => String(x).trim()));
  };

  const csvImport = (coll) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.csv,.tsv,.txt';
    inp.addEventListener('change', async () => {
      const f = inp.files[0];
      if (!f) return;
      const zeilen = csvZerlegen((await f.text()).replace(/^﻿/, ''));
      if (zeilen.length < 2) { UI.toast('Die Datei enthält keine Daten'); return; }

      const kopf = zeilen[0].map(x => String(x).trim());
      const titelKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'title') || 'title';

      /* Spalten zuordnen — was fehlt, wird als Text angelegt */
      const karte = kopf.map((name, i) => {
        if (i === 0) return titelKey;
        let k = Object.keys(coll.schema).find(x => coll.schema[x].name.toLowerCase() === name.toLowerCase());
        if (!k) {
          k = Store.uid().slice(0, 5);
          coll.schema[k] = { name: name || 'Spalte ' + (i + 1), type: 'text' };
        }
        return k;
      });
      Store.updateCollection(coll.id, { schema: coll.schema });

      let n = 0;
      zeilen.slice(1).forEach(z => {
        const props = {};
        karte.forEach((k, i) => { if (k !== titelKey) props[k] = z[i] ?? ''; });
        const r = Store.addRow(coll.id, props);
        Store.updateBlock(r.id, { text: z[0] || 'Ohne Titel' });
        n++;
      });

      App.zeichneSeite();
      UI.toast(n + ' Einträge eingelesen');
    });
    inp.click();
  };

  /* Automationen an den Speicher hängen — einmal beim Laden. */
  automationenEinklinken();

  return { render, TYPEN, propTyp, wert, zeilen, zelle, OPERATOREN, ROLLUP_ARTEN,
           automationenMenue, automationenLaufen, gewaehlteZeilen,
           relationSetzen, relationEinrichten, gruppeTrifftZu, regelAnzahl, zeitAutomationen,
           formelEditor, csvExport, csvImport, csvZerlegen,
           zeilePeek, zeilenMenue, rollupWert };
})();
