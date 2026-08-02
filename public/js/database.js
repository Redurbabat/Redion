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
    { id:'ki',         name:'KI-Feld',          icon:'✨' },
    /* --- ab hier neu, damit alle 29 Typen aus Teil 7 da sind ------------- */
    { id:'createdBy',  name:'Erstellt von',     icon:'👤' },
    { id:'editedBy',   name:'Zuletzt bearbeitet von', icon:'👥' },
    { id:'place',      name:'Ort',              icon:'📍' },
    { id:'duration',   name:'Zeitspanne',       icon:'⏱'  },
    { id:'verify',     name:'Prüfung',          icon:'✔'  },
    { id:'ki-fassung', name:'KI: Zusammenfassung', icon:'✨' },
    { id:'ki-sprache', name:'KI: Übersetzung',  icon:'✨' },
    { id:'ki-worte',   name:'KI: Schlagwörter', icon:'✨' },
    /* --- Felder, die an einer Verbindung hängen (Notion: mit ↑-Abzeichen) -- */
    { id:'gdrive',     name:'Google Drive Datei', icon:'🟢', dienst:'google' },
    { id:'figma',      name:'Figma Datei',      icon:'🎨', dienst:'figma'  },
    { id:'githubpr',   name:'GitHub-Pull-Request', icon:'🐙', dienst:'github' },
    { id:'zendesk',    name:'Zendesk Ticket',   icon:'🎫', dienst:'zendesk' }
  ];

  /* Diese vier zeigen ein verknüpftes Objekt von aussen: {url, titel, zusatz} */
  const DIENST_TYPEN = ['gdrive', 'figma', 'githubpr', 'zendesk'];

  /* Alle Felder, die die KI selbst füllt — sie teilen sich eine Mechanik. */
  const KI_TYPEN = ['ki', 'ki-fassung', 'ki-sprache', 'ki-worte'];
  const KI_AUFTRAG = {
    'ki':         'Fasse diesen Eintrag in einem kurzen Satz zusammen.',
    'ki-fassung': 'Fasse diesen Eintrag in einem kurzen Satz zusammen.',
    'ki-sprache': 'Übersetze den Titel dieses Eintrags ins Englische. Gib nur die Übersetzung zurück.',
    'ki-worte':   'Nenne drei bis fünf Schlagwörter zu diesem Eintrag, mit Komma getrennt.'
  };

  /* Felder, die die App selbst füllt und die niemand tippt. */
  const NUR_LESEN = ['formula','created','edited','rollup','uid','createdBy','editedBy'];

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
    button:   [],
    createdBy:['ist','ist nicht','enthält','ist leer','ist nicht leer'],
    editedBy: ['ist','ist nicht','enthält','ist leer','ist nicht leer'],
    place:    ['enthält','enthält nicht','ist','ist leer','ist nicht leer'],
    duration: ['ist gleich','ist nicht gleich','größer als','kleiner als','größer oder gleich','kleiner oder gleich','ist leer','ist nicht leer'],
    verify:   ['ist geprüft','ist nicht geprüft','ist abgelaufen','ist abgelehnt']
  };
  /* Die KI-Spalten filtern wie Text. */
  ['ki-fassung','ki-sprache','ki-worte'].forEach(t => { OPERATOREN[t] = OPERATOREN.ki; });

  /* Welche Rollup-Berechnungen gibt es? (Teil 14 der Doku, Kapitel 3.3) */
  /* Die 21 Berechnungsarten aus Teil 4 und Teil 8 der Dokumentation.
     Dieselbe Liste gilt für Rollups und für die Zeile unter der Spalte. */
  const ROLLUP_ARTEN = ['Original zeigen','Anzahl alle','Werte zählen','Eindeutige zählen','Leere zählen',
                        'Gefüllte zählen','Prozent leer','Prozent gefüllt',
                        'Summe','Durchschnitt','Median','Minimum','Maximum','Spanne',
                        'Frühestes Datum','Spätestes Datum','Zeitspanne',
                        'Aktivierte zählen','Nicht aktivierte zählen',
                        'Prozent aktiviert','Prozent nicht aktiviert'];

  /* Welche Berechnungen passen unter eine Spalte? */
  const RECHNUNGEN = {
    alle:     ['—','Anzahl alle','Werte zählen','Eindeutige zählen','Leere zählen','Gefüllte zählen',
               'Prozent leer','Prozent gefüllt','Original zeigen'],
    number:   ['Summe','Durchschnitt','Median','Minimum','Maximum','Spanne'],
    checkbox: ['Aktivierte zählen','Nicht aktivierte zählen','Prozent aktiviert','Prozent nicht aktiviert'],
    date:     ['Frühestes Datum','Spätestes Datum','Zeitspanne']
  };

  /* ========================================================================
   * WERTE LESEN UND ANZEIGEN
   * ======================================================================*/

  /** Liefert den Rohwert einer Spalte für eine Zeile. */
  /* ------------------------------------------------------------------------
   * Verknüpfungen in Formeln
   * ------------------------------------------------------------------------
   * Ein Seitenbezug sieht für die Formel wie sein Titel aus, merkt sich aber
   * die ID. Damit funktioniert beides:
   *     join(prop("Aufgaben"), ", ")                    → Titel
   *     map(prop("Aufgaben"), current.prop("Kosten"))   → Werte der Zielzeile
   * ----------------------------------------------------------------------*/
  let formelTiefe = 0;

  const seitenBezug = (id, name) => ({
    __seite: id, name,
    toString() { return this.name; },
    valueOf()  { return this.name; }
  });

  const seitenListe = (ids) => (ids || []).map(id => {
    const b = Store.getBlock(id);
    return seitenBezug(id, b ? (b.text || 'Ohne Titel') : 'Gelöscht');
  });

  /** Liest eine Eigenschaft einer verknüpften Zeile — current.prop("…"). */
  const fremdWert = (el, name) => {
    const id = typeof el === 'string' ? el : (el && (el.__seite || el.id));
    const z = id && Store.getBlock(id);
    if (!z) return null;
    const zc = z.parentTable === 'collection' ? Store.getCollection(z.parentId) : null;
    if (!zc) return name.toLowerCase() === 'titel' || name.toLowerCase() === 'name'
      ? (z.text || '') : null;
    const k = Object.keys(zc.schema).find(x => zc.schema[x].name === name) ||
              (/^(titel|name|title)$/i.test(name)
                 ? Object.keys(zc.schema).find(x => zc.schema[x].type === 'title') : null);
    if (!k) return null;
    const v = wert(z, k, zc);
    return zc.schema[k].type === 'relation' ? seitenListe(v) : v;
  };

  const wert = (row, key, coll) => {
    const def = coll.schema[key];
    if (!def) return null;

    if (def.type === 'title')   return row.text || '';
    if (def.type === 'created') return row.created;
    if (def.type === 'edited')  return row.edited;

    /* Ohne Konten gibt es nur einen Menschen: den, der hier sitzt. Sein Name
       steht in den Einstellungen und wird beim Anlegen mitgeschrieben. */
    if (def.type === 'createdBy') return row.erstelltVon || Store.getMeta('nutzer', '') || 'Ich';
    if (def.type === 'editedBy')  return row.geaendertVon || Store.getMeta('nutzer', '') || 'Ich';

    /* Zeitspanne: gespeichert wird in Minuten, angezeigt als 1 h 30 min */
    if (def.type === 'duration') {
      const v = (row.props || {})[key];
      return v === '' || v == null ? null : Number(v);
    }

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
      if (formelTiefe > 12) throw new Error('Die Formel dreht sich im Kreis');
      formelTiefe++;
      try {
        const r = Formula.run(def.formula || '',
          (name) => {
            const k = Object.keys(coll.schema).find(x => coll.schema[x].name === name);
            if (!k) return null;
            /* Verknüpfungen kommen als Seitenbezüge herein: sie zeigen ihren
               Titel an und lassen sich mit current.prop("…") weiterlesen. */
            if (coll.schema[k].type === 'relation') return seitenListe(wert(row, k, coll));
            return wert(row, k, coll);
          },
          fremdWert);
        return r.ok ? r.wert : '⚠ ' + (r.fehler || 'Fehler');
      } catch (e) {
        return '⚠ ' + e.message;
      } finally { formelTiefe--; }
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

    return zusammenfassen(def.rollup || 'Original zeigen', werte, zeilen2.length);
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

    if (DIENST_TYPEN.includes(def.type)) {
      const o = v && typeof v === 'object' ? v : (v ? { url: v } : null);
      if (!o || !o.url) return '<span style="color:var(--text-faint)">—</span>';
      return `<a class="dienst-chip" href="${esc(o.url)}" target="_blank" rel="noopener">` +
             `<span>${propTyp(def.type).icon}</span>` +
             `<span class="dc-t">${esc(o.titel || o.url)}</span>` +
             (o.zusatz ? `<span class="dc-z">${esc(o.zusatz)}</span>` : '') + '</a>';
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
      return liste.map(f => {
        const name = (f && typeof f === 'object') ? (f.name || 'Datei') : String(f);
        const quelle = (f && typeof f === 'object') ? f.src : String(f);
        const kurz = esc(name.length > 24 ? name.slice(0, 22) + '…' : name);
        return quelle
          ? `<a class="tag bg-gray" href="${esc(quelle)}" target="_blank" rel="noopener" ` +
            `download="${esc(name)}" title="${esc(name)}">📎 ${kurz}</a>`
          : `<span class="tag bg-gray">📎 ${kurz}</span>`;
      }).join('');
    }

    if (KI_TYPEN.includes(def.type) && !v)
      return '<span style="color:var(--text-faint)">✨ leer</span>';

    if (def.type === 'createdBy' || def.type === 'editedBy')
      return `<span class="tag bg-gray">👤 ${esc(v)}</span>`;

    if (def.type === 'duration') {
      if (v == null) return '<span style="color:var(--text-faint)">—</span>';
      return esc(dauerText(v));
    }

    if (def.type === 'place') {
      if (!v) return '<span style="color:var(--text-faint)">—</span>';
      const o = typeof v === 'object' ? v : { name: String(v) };
      const karte = o.lat != null
        ? `https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lon}#map=15/${o.lat}/${o.lon}`
        : 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(o.name || '');
      return `📍 <a href="${esc(karte)}" target="_blank" rel="noopener" ` +
             `style="color:var(--accent)">${esc(o.name || '')}</a>`;
    }

    if (def.type === 'verify') {
      const o = typeof v === 'object' && v ? v : null;
      if (!o || !o.stand) return '<span class="tag bg-gray">nicht geprüft</span>';
      const abgelaufen = o.bis && new Date(o.bis) < new Date();
      if (abgelaufen)      return `<span class="tag bg-orange" title="bis ${esc(o.bis)}">abgelaufen</span>`;
      if (o.stand === 'ok') return `<span class="tag bg-green" title="${esc(o.wer || '')}${o.bis ? ' · bis ' + esc(o.bis) : ''}">✔ geprüft</span>`;
      return '<span class="tag bg-red">abgelehnt</span>';
    }

    return esc(v) || '<span style="color:var(--text-faint)">—</span>';
  };

  /** 95 → „1 h 35 min" */
  const dauerText = (min) => {
    const m = Math.round(Number(min) || 0);
    if (!m) return '0 min';
    const h = Math.floor(Math.abs(m) / 60), r = Math.abs(m) % 60;
    const s = h ? (h + ' h' + (r ? ' ' + r + ' min' : '')) : (r + ' min');
    return (m < 0 ? '−' : '') + s;
  };

  /** „1h30", „90", „1:30" → 90 Minuten */
  const dauerLesen = (text) => {
    const t = String(text || '').trim().toLowerCase().replace(',', '.');
    if (!t) return null;
    const doppel = t.match(/^(\d+)\s*[:.]\s*(\d{1,2})$/);
    if (doppel) return (+doppel[1]) * 60 + (+doppel[2]);
    /* „1h30", „1 h 30", „1h 30min" — die Minuten hinter der Stunde zählen mit,
       auch wenn niemand „min" dazuschreibt. */
    const beides = t.match(/^([\d.]+)\s*(?:h|std|stunden?)\s*([\d.]+)\s*(?:m|min|minuten?)?$/);
    if (beides) return Math.round(parseFloat(beides[1]) * 60 + parseFloat(beides[2]));
    let min = 0, traf = false;
    const std = t.match(/([\d.]+)\s*(h|std|stunden?)/);
    if (std) { min += parseFloat(std[1]) * 60; traf = true; }
    const mi  = t.match(/([\d.]+)\s*(m|min|minuten?)\b/);
    if (mi)  { min += parseFloat(mi[1]); traf = true; }
    if (!traf) { const n = parseFloat(t); return isNaN(n) ? null : n; }
    return Math.round(min);
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

    /* Prüfung — geprüft, offen, abgelaufen, abgelehnt */
    if (op.startsWith('ist geprüft') || op === 'ist nicht geprüft' ||
        op === 'ist abgelaufen' || op === 'ist abgelehnt') {
      const o = v && typeof v === 'object' ? v : null;
      const abgelaufen = !!(o && o.bis && new Date(o.bis) < new Date());
      if (op === 'ist geprüft')       return !!o && o.stand === 'ok' && !abgelaufen;
      if (op === 'ist nicht geprüft') return !o || !o.stand;
      if (op === 'ist abgelaufen')    return abgelaufen;
      if (op === 'ist abgelehnt')     return !!o && o.stand === 'nein';
    }

    /* Beim Ort zählt der Name, nicht das ganze Objekt. */
    const roh = (v && typeof v === 'object' && def.type === 'place') ? (v.name || '') : v;
    const t = String(roh ?? '').toLowerCase();
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

  /** Notions Ladelimit: nicht alles auf einmal zeigen. */
  const begrenzen = (rows, view) => {
    const n = view.limit === 0 ? 0 : (view.limit || 50);
    return n && rows.length > n ? rows.slice(0, n) : rows;
  };

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

  /**
   * Alle Rohzeilen einer Ansicht — die eigene Datenquelle und, falls
   * eingerichtet, weitere. Notion nennt das seit 2025 „mehrere Datenquellen
   * in einer Ansicht"; im Menü heisst der Eintrag „Neue Datenquelle".
   */
  const rohZeilen = (coll, view) => {
    let alle = Store.rowsOf(coll.id);
    (view.extraDbs || []).forEach(x => {
      const c2 = Store.cache.collections[x.collectionId];
      if (!c2 || x.an === false) return;
      alle = alle.concat(Store.rowsOf(c2.id));
    });
    /* Archiviertes bleibt draussen, bis man es ausdrücklich sehen will */
    if (!view.archivZeigen) alle = alle.filter(r => !r.archiviert);
    return alle;
  };

  const zeilen = (coll, view) => {
    const alle = sortiert(gefiltert(rohZeilen(coll, view), view, coll), view, coll);
    return begrenzen(alle, view);
  };

  /** Wie viele wurden weggelassen? Das gehört dem Menschen gesagt. */
  const zeilenGesamt = (coll, view) =>
    sortiert(gefiltert(rohZeilen(coll, view), view, coll), view, coll).length;

  /* ========================================================================
   * BERECHNUNGEN UNTER DER SPALTE
   * ======================================================================*/
  /**
   * Die eine Stelle, an der gerechnet wird. Rollups und die Zeile unter
   * der Spalte benutzen dieselbe Liste und denselben Code — sonst laufen
   * die beiden auseinander.
   *
   * @param art      Name der Berechnung
   * @param werte    die Rohwerte
   * @param gesamt   Bezugsgrösse für Prozente (Standard: Anzahl der Werte)
   */
  const zusammenfassen = (art, werte, gesamt) => {
    const n        = gesamt == null ? werte.length : gesamt;
    const voll     = (v) => v != null && v !== '' && !(Array.isArray(v) && !v.length);
    const gefuellt = werte.filter(voll);
    const zahlen   = werte.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const daten    = gefuellt.map(v => new Date(v)).filter(d => !isNaN(d));
    const proz     = (x) => n ? Math.round(x / n * 100) + ' %' : '0 %';
    const tag      = (d) => d.toLocaleDateString('de-DE');

    switch (art) {
      case 'Original zeigen':         return werte.map(w2 => Formula.anzeige(w2)).filter(Boolean).join(', ');
      case 'Anzahl alle':             return n;
      case 'Werte zählen':            return gefuellt.length;
      case 'Eindeutige zählen':       return new Set(gefuellt.map(v => Formula.anzeige(v))).size;
      case 'Leere zählen':            return n - gefuellt.length;
      case 'Gefüllte zählen':         return gefuellt.length;
      case 'Prozent leer':            return proz(n - gefuellt.length);
      case 'Prozent gefüllt':         return proz(gefuellt.length);
      case 'Summe':                   return zahlen.reduce((s, x) => s + x, 0);
      case 'Durchschnitt':            return zahlen.length
                                        ? Math.round(zahlen.reduce((s, x) => s + x, 0) / zahlen.length * 100) / 100 : 0;
      case 'Median': {
        if (!zahlen.length) return 0;
        const s = zahlen.slice().sort((a, b) => a - b);
        const m = Math.floor(s.length / 2);
        return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
      }
      case 'Minimum':                 return zahlen.length ? Math.min(...zahlen) : 0;
      case 'Maximum':                 return zahlen.length ? Math.max(...zahlen) : 0;
      case 'Spanne':                  return zahlen.length ? Math.max(...zahlen) - Math.min(...zahlen) : 0;
      case 'Aktivierte zählen':       return werte.filter(Boolean).length;
      case 'Nicht aktivierte zählen': return werte.filter(v => !v).length;
      case 'Prozent aktiviert':       return proz(werte.filter(Boolean).length);
      case 'Prozent nicht aktiviert': return proz(werte.filter(v => !v).length);
      case 'Frühestes Datum':         return daten.length ? tag(new Date(Math.min(...daten))) : '—';
      case 'Spätestes Datum':         return daten.length ? tag(new Date(Math.max(...daten))) : '—';
      case 'Zeitspanne': {
        if (daten.length < 2) return daten.length ? '0 Tage' : '—';
        const t = Math.round((Math.max(...daten) - Math.min(...daten)) / 86400000);
        return t === 1 ? '1 Tag' : t + ' Tage';
      }
      default: return '';
    }
  };

  const rechne = (art, rows, key, coll) =>
    zusammenfassen(art, rows.map(r => wert(r, key, coll)), rows.length);

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
                    timeline:'▬', chart:'📊', form:'📝', feed:'📰', map:'🗺',
                    dashboard:'🧮' }[v.layout] || '▦';
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
    else if (view.layout === 'map')      koerper.appendChild(alsKarte(coll, view, rows));
    else if (view.layout === 'dashboard') koerper.appendChild(alsDashboard(coll, view, rows));
    else                                 koerper.appendChild(alsTabelle(coll, view, rows, block));
    w.appendChild(koerper);

    return w;
  };

  /* --- Tabelle ------------------------------------------------------------ */
  const alsTabelle = (coll, view, rows, block) => {
    /* Die Spalten, die Notion beim Einschalten von Unter-Elementen und
       Abhängigkeiten selbst anlegt, bleiben aus der Tabelle heraus — sie
       stehen auf der Zeilenseite und im Menü. */
    const sichtbar = Object.keys(coll.schema)
      .filter(k => !(view.hidden || []).includes(k))
      .filter(k => !coll.schema[k].eigen || (view.eigenZeigen || []).includes(k));

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
      th.innerHTML = `<span style="opacity:${def.icon ? 1 : .7}">${def.icon || propTyp(def.type).icon}</span> ${esc(def.name)}` +
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

    /* Zeilen — Unterelemente hängen unter ihrer Hauptzeile (Notions Sub-items).
       Beliebig tief; jede Elternzeile bekommt einen Schalter zum Auf- und
       Zuklappen, genau wie in Notion. */
    const tbody = document.createElement('tbody');
    const sichtbareIds = new Set(rows.map(r => r.id));
    const geordnet = [];
    const kinderVon = (id) => rows.filter(k => k.unterVon === id);
    const einhaengen = (r, tiefe) => {
      const kinder = kinderVon(r.id);
      geordnet.push({ row: r, tiefe, kinder: kinder.length });
      if (kinder.length && !(view.zu || []).includes(r.id))
        kinder.forEach(k => einhaengen(k, tiefe + 1));
    };
    rows.forEach(r => {
      if (r.unterVon && sichtbareIds.has(r.unterVon)) return;
      einhaengen(r, 0);
    });

    geordnet.forEach(({ row: r, tiefe, kinder }, nr) => {
      const zr = document.createElement('tr');
      if (tiefe) zr.classList.add('unterzeile');
      if (r.archiviert) zr.classList.add('archivzeile');
      /* Bedingte Farbe: die erste zutreffende Regel färbt die Zeile */
      const farbe = farbeFuerZeile(r, view, coll);
      if (farbe) zr.classList.add('farbzeile', 'bg-' + farbe);
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
          const zuJetzt = (view.zu || []).includes(r.id);
          td.innerHTML =
            (tiefe ? `<span class="tt-ein" style="padding-left:${(tiefe - 1) * 16}px">↳</span>` : '') +
            (kinder
              ? `<button class="tt-klapp" title="${zuJetzt ? 'Aufklappen' : 'Zuklappen'}">${zuJetzt ? '▸' : '▾'}</button>`
              : (coll.unterElemente ? '<span class="tt-klapp leer"></span>' : '')) +
            (r.archiviert ? '<span class="tt-archiv" title="Archiviert">🗄</span>' : '') +
            (() => {
              const b2 = blockiertDurch(r, coll);
              return b2.length
                ? `<span class="tt-blockiert" title="Wartet auf: ${esc(b2.map(x => x.text).join(', '))}">⏳</span>`
                : '';
            })() +
            `<span class="tt-t">${esc(r.text || 'Ohne Titel')}</span>` +
            (kinder ? `<span class="tt-anzahl">${kinder}</span>` : '') +
            `<button class="tt-auf" title="In der Vorschau öffnen">⤢ Öffnen</button>`;
          td.querySelector('.tt-klapp:not(.leer)')?.addEventListener('click', (e) => {
            e.stopPropagation();
            const zu = view.zu || [];
            Store.updateView(view.id,
              { zu: zu.includes(r.id) ? zu.filter(x => x !== r.id) : [...zu, r.id] });
            App.zeichneSeite();
          });
          td.querySelector('.tt-t').addEventListener('click', () => zeilePeek(r, coll));
          td.querySelector('.tt-auf').addEventListener('click', (e) => { e.stopPropagation(); App.oeffne(r.id); });
        } else {
          td.innerHTML = zelle(r, k, coll);
          td.tabIndex = 0;
          td.dataset.zelle = r.id + '|' + k;
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

    /* Mit Pfeilen von Zelle zu Zelle, Enter bearbeitet, Tab geht weiter —
       so, wie man es aus Tabellen kennt. */
    t.addEventListener('keydown', (e) => {
      const td = e.target.closest('td[data-zelle]');
      if (!td) return;
      const zeilenListe = [...t.querySelectorAll('tbody tr')];
      const zr2 = td.parentElement;
      const spalten = [...zr2.querySelectorAll('td[data-zelle]')];
      const y = zeilenListe.indexOf(zr2);
      const x = spalten.indexOf(td);

      const springe = (dy, dx) => {
        const zeile2 = zeilenListe[y + dy];
        if (!zeile2) return;
        const felder = [...zeile2.querySelectorAll('td[data-zelle]')];
        const ziel = felder[Math.max(0, Math.min(felder.length - 1, x + dx))];
        if (ziel) { ziel.focus(); e.preventDefault(); }
      };

      if (e.key === 'ArrowRight') springe(0, 1);
      if (e.key === 'ArrowLeft')  springe(0, -1);
      if (e.key === 'ArrowDown')  springe(1, 0);
      if (e.key === 'ArrowUp')    springe(-1, 0);
      if (e.key === 'Tab')        { e.preventDefault(); springe(0, e.shiftKey ? -1 : 1); }
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        const [rid, key] = td.dataset.zelle.split('|');
        const zeile3 = Store.getBlock(rid);
        if (zeile3) zelleBearbeiten(td, zeile3, key, coll);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const [rid, key] = td.dataset.zelle.split('|');
        if (!['formula','created','edited','rollup','uid'].includes(coll.schema[key]?.type)) {
          Store.setProp(rid, key, '');
          App.zeichneSeite();
        }
      }
    });

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
    const auftrag = def.auftrag || KI_AUFTRAG[def.type] ||
      'Fasse diesen Eintrag in einem kurzen Satz zusammen.';

    const zeileAlsText = Object.keys(coll.schema)
      .filter(k => k !== key && !KI_TYPEN.includes(coll.schema[k].type) && coll.schema[k].type !== 'button')
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
  /* ------------------------------------------------------------------------
   * FELDER, DIE AN EINER VERBINDUNG HÄNGEN
   * Google Drive, Figma, GitHub-Pull-Request, Zendesk. Die Adresse wird
   * eingefügt; ist der Dienst verbunden, holt die App Titel und Zustand
   * dazu. Ohne Verbindung bleibt die Adresse — das ist ehrlicher als ein
   * Feld, das ohne Konto gar nichts kann.
   * ----------------------------------------------------------------------*/
  const DIENST_HILFE = {
    gdrive:   ['Google Drive', 'https://drive.google.com/file/d/…/view'],
    figma:    ['Figma',        'https://figma.com/file/…'],
    githubpr: ['GitHub',       'https://github.com/besitzer/repo/pull/12'],
    zendesk:  ['Zendesk',      'https://deinefirma.zendesk.com/agent/tickets/123']
  };

  const dienstTitelHolen = async (typ, url) => {
    try {
      if (typ === 'githubpr') {
        const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
        if (!m || !Verbindungen.githubToken()) return null;
        const pr = await Verbindungen.githubRuf(`/repos/${m[1]}/${m[2]}/pulls/${m[3]}`);
        if (!pr || !pr.title) return null;
        return { titel: '#' + pr.number + ' ' + pr.title,
                 zusatz: pr.merged_at ? 'zusammengeführt' : pr.state === 'open' ? 'offen' : 'zu' };
      }
      if (typ === 'gdrive') {
        const m = url.match(/\/d\/([-\w]{10,})/) || url.match(/[?&]id=([-\w]{10,})/);
        const tok = Verbindungen.googleToken();
        if (!m || !tok) return null;
        const d = await Verbindungen.jsonRuf(
          'https://www.googleapis.com/drive/v3/files/' + m[1] + '?fields=name,mimeType',
          { headers: { Authorization: 'Bearer ' + tok.token } });
        if (!d || !d.name) return null;
        return { titel: d.name, zusatz: (d.mimeType || '').split('.').pop() };
      }
    } catch (e) { /* Ohne Verbindung bleibt es bei der Adresse. */ }
    return null;
  };

  const dienstFeld = async (td, row, key, coll) => {
    const def = coll.schema[key];
    const jetzt = wert(row, key, coll) || {};
    const [name, beispiel] = DIENST_HILFE[def.type] || ['Dienst', ''];
    const url = await UI.frage(name + '-Adresse einfügen — z. B. ' + beispiel, jetzt.url || '');
    if (url === null) return;
    if (!url.trim()) { Store.setProp(row.id, key, null); App.zeichneSeite(); return; }

    Store.setProp(row.id, key, { url: url.trim(), titel: jetzt.titel || '', zusatz: '' });
    App.zeichneSeite();

    const dazu = await dienstTitelHolen(def.type, url.trim());
    if (dazu) {
      Store.setProp(row.id, key, Object.assign({ url: url.trim() }, dazu));
      App.zeichneSeite();
      UI.toast(name + ': ' + dazu.titel);
    } else if (!jetzt.titel) {
      const t = await UI.frage('Wie soll die Verknüpfung heissen?', url.split('/').filter(Boolean).pop() || name);
      if (t) { Store.setProp(row.id, key, { url: url.trim(), titel: t, zusatz: '' }); App.zeichneSeite(); }
    }
  };

  const zelleBearbeiten = (td, row, key, coll) => {
    const def = coll.schema[key];

    if (def.type === 'relation') { relationWaehlen(row, key, coll); return; }
    if (def.type === 'button')   { knopfInZelle(row, key, coll); return; }
    if (DIENST_TYPEN.includes(def.type)) { dienstFeld(td, row, key, coll); return; }

    if (KI_TYPEN.includes(def.type)) {
      kiFeldFuellen(row, key, coll);
      return;
    }

    if (NUR_LESEN.includes(def.type)) {
      UI.toast('Dieses Feld wird berechnet und kann nicht direkt bearbeitet werden.');
      return;
    }

    /* Prüfung — Notions „Verification": geprüft, abgelehnt, mit Frist */
    if (def.type === 'verify') {
      const r = td.getBoundingClientRect();
      const jetzt = wert(row, key, coll) || {};
      const m = UI.menu(
        '<div class="grp">Prüfung</div>' +
        '<button data-p="ok"><span class="mi">✔</span>Geprüft</button>' +
        '<button data-p="nein"><span class="mi">✖</span>Abgelehnt</button>' +
        '<button data-p="offen"><span class="mi">○</span>Nicht geprüft</button>' +
        '<hr><button data-p="frist"><span class="mi">📅</span>Gültig bis …</button>' +
        (jetzt.wer ? `<div class="grp" style="font-weight:400">zuletzt: ${esc(jetzt.wer)}` +
                     (jetzt.wann ? ' am ' + esc(String(jetzt.wann).slice(0, 10)) : '') + '</div>' : ''),
        r.left, r.bottom + 2);
      m.addEventListener('click', async e => {
        const b = e.target.closest('button[data-p]');
        if (!b) return;
        const wer = Store.getMeta('nutzer', '') || 'Ich';
        if (b.dataset.p === 'frist') {
          m.remove();
          const bis = await UI.frage('Gültig bis (JJJJ-MM-TT)', jetzt.bis || '');
          if (bis == null) return;
          Store.setProp(row.id, key, Object.assign({}, jetzt, { bis }));
        } else if (b.dataset.p === 'offen') {
          m.remove();
          Store.setProp(row.id, key, null);
        } else {
          m.remove();
          Store.setProp(row.id, key, {
            stand: b.dataset.p === 'ok' ? 'ok' : 'nein',
            wer, wann: Store.now(), bis: jetzt.bis || ''
          });
        }
        App.zeichneSeite();
      });
      return;
    }

    /* Ort — Adresse eintippen, Nominatim sucht die Koordinaten dazu.
       Kostenlos, ohne Schlüssel; ohne Netz bleibt einfach der Text stehen. */
    if (def.type === 'place') {
      const jetzt = wert(row, key, coll);
      const alt = jetzt && typeof jetzt === 'object' ? jetzt.name : (jetzt || '');
      const inp = document.createElement('input');
      inp.value = alt || '';
      inp.placeholder = 'Adresse oder Ort';
      inp.style.cssText = 'width:100%; background:var(--bg-input); border:1px solid var(--accent); ' +
                          'border-radius:3px; padding:3px 5px; outline:none';
      td.innerHTML = '';
      td.appendChild(inp);
      inp.focus(); inp.select();
      let fertigSchon = false;
      const fertig = async () => {
        if (fertigSchon) return; fertigSchon = true;
        const name = inp.value.trim();
        if (!name) { Store.setProp(row.id, key, null); td.innerHTML = zelle(row, key, coll); return; }
        Store.setProp(row.id, key, { name });
        td.innerHTML = zelle(row, key, coll);
        const treffer = await ortSuchen(name).catch(() => null);
        if (treffer) {
          Store.setProp(row.id, key, { name, lat: treffer.lat, lon: treffer.lon, voll: treffer.name });
          td.innerHTML = zelle(row, key, coll);
        }
      };
      inp.addEventListener('blur', fertig);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        if (e.key === 'Escape') { fertigSchon = true; td.innerHTML = zelle(row, key, coll); }
      });
      return;
    }

    /* Zeitspanne — „1h30", „90", „1:30" ergeben alle 90 Minuten */
    if (def.type === 'duration') {
      const inp = document.createElement('input');
      const alt = wert(row, key, coll);
      inp.value = alt == null ? '' : dauerText(alt);
      inp.placeholder = 'z. B. 1h30 oder 90';
      inp.style.cssText = 'width:100%; background:var(--bg-input); border:1px solid var(--accent); ' +
                          'border-radius:3px; padding:3px 5px; outline:none';
      td.innerHTML = ''; td.appendChild(inp);
      inp.focus(); inp.select();
      const fertig = () => {
        Store.setProp(row.id, key, dauerLesen(inp.value));
        td.innerHTML = zelle(row, key, coll);
      };
      inp.addEventListener('blur', fertig);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        if (e.key === 'Escape') { td.innerHTML = zelle(row, key, coll); }
      });
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
      /* Notion zeigt bei Auswahl- und Status-Spalten alle Optionen als Spalte,
         auch die leeren. Wer sie loswerden will, schaltet sie im Menü aus. */
      if (!drin.length && view.leereGruppen === false) return;
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
  /* --- Kalender -----------------------------------------------------------
   * Drei Stufen wie in Notion Calendar: Tag, Woche, Monat — umschaltbar mit
   * den Tasten T/D, W und M. Neben der eigenen Datenbank können weitere
   * Datenbanken als zusätzliche Kalender eingeblendet werden, jede in ihrer
   * eigenen Farbe, ein- und ausschaltbar und in der Reihenfolge verschiebbar.
   * ----------------------------------------------------------------------*/
  const KAL_FARBEN = ['blue','green','orange','purple','pink','red','yellow','brown'];

  /** Alle Kalender dieser Ansicht: der eigene zuerst, dann die zugeschalteten. */
  const kalenderQuellen = (coll, view) => {
    const eigen = view.dateKey || Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
    const liste = [{
      coll, id: coll.id, name: coll.name, dateKey: eigen,
      endeKey: view.endeKey && coll.schema[view.endeKey] ? view.endeKey : null,
      farbe: view.farbe || 'blue', an: true, eigen: true
    }];

    (view.extraDbs || []).forEach((x, i) => {
      const c = Store.getCollection(x.collectionId);
      if (!c) return;
      const dk = x.dateKey && c.schema[x.dateKey]
        ? x.dateKey : Object.keys(c.schema).find(k => c.schema[k].type === 'date');
      if (!dk) return;
      liste.push({
        coll: c, id: c.id, name: c.name, dateKey: dk,
        endeKey: x.endeKey && c.schema[x.endeKey] ? x.endeKey : null,
        farbe: x.farbe || KAL_FARBEN[(i + 1) % KAL_FARBEN.length],
        an: x.an !== false, eigen: false
      });
    });
    return liste;
  };

  /** Die Termine einer Quelle für einen bestimmten Tag. */
  const termineAmTag = (q, tag, rows) => {
    const zeilen2 = rows || Store.rowsOf(q.id);
    const t0 = new Date(tag); t0.setHours(0, 0, 0, 0);
    const treffer = [];
    zeilen2.forEach(r => {
      const v = wert(r, q.dateKey, q.coll);
      if (!v) return;
      const dv = new Date(v);
      if (isNaN(dv)) return;
      const von = new Date(dv); von.setHours(0, 0, 0, 0);
      let bis = von;
      if (q.endeKey) {
        const e2 = new Date(wert(r, q.endeKey, q.coll));
        if (!isNaN(e2)) { bis = new Date(e2); bis.setHours(0, 0, 0, 0); }
      }
      if (t0 < von || t0 > bis) return;
      treffer.push({
        row: r, quelle: q,
        mehrtaegig: bis > von,
        anfang: t0.getTime() === von.getTime(),
        ende:   t0.getTime() === bis.getTime(),
        zeit:   String(v).length > 10 ? String(v).slice(11, 16) : '',
        stunde: String(v).length > 10 ? parseInt(String(v).slice(11, 13), 10) : null
      });
    });
    return treffer;
  };

  const terminKnopf = (e, view) => {
    const ev = document.createElement('div');
    ev.className = 'ev q-' + e.quelle.farbe +
      (e.mehrtaegig ? ' lang' : '') +
      (e.mehrtaegig && e.anfang ? ' anfang' : '') +
      (e.mehrtaegig && e.ende ? ' ende' : '');
    ev.textContent = (e.mehrtaegig && !e.anfang ? '· ' : '') +
                     (e.zeit ? e.zeit + ' ' : '') + (e.row.text || 'Ohne Titel');
    ev.title = e.quelle.name + ' · ' + (e.row.text || 'Ohne Titel');
    ev.addEventListener('click', ev2 => {
      ev2.stopPropagation();
      view.oeffnenAls === 'voll' ? App.oeffne(e.row.id) : zeilePeek(e.row, e.quelle.coll);
    });
    return ev;
  };

  const alsKalender = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'kal-block';
    const quellen = kalenderQuellen(coll, view).filter(q => q.an);

    if (!quellen.length || !quellen[0].dateKey) {
      w.innerHTML = '<div style="color:var(--text-faint)">Für den Kalender wird eine Datums-Spalte gebraucht.</div>';
      return w;
    }

    const stufe = view.kalStufe || 'monat';
    const stand = view.monat ? new Date(view.monat) : new Date();
    if (isNaN(stand)) stand.setTime(Date.now());
    const heuteStr = new Date().toDateString();
    const wsMontag = Einstellungen.wochenstart() === 1;

    /* Die Termine der Fremdkalender holen wir selbst, die eigenen sind
       schon durch Filter und Sortierung der Ansicht gelaufen. */
    const zeilenVon = (q) => q.eigen ? rows : Store.rowsOf(q.id);

    const wochenAnfang = (d) => {
      const x = new Date(d); x.setHours(0, 0, 0, 0);
      const start = wsMontag ? 1 : 0;
      x.setDate(x.getDate() - ((x.getDay() - start + 7) % 7));
      return x;
    };

    /* --- Kopfzeile ----------------------------------------------------- */
    const titel = stufe === 'monat'
      ? stand.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
      : stufe === 'woche'
        ? (() => { const a = wochenAnfang(stand), b2 = new Date(a); b2.setDate(a.getDate() + 6);
            return 'KW ' + kalenderwoche(a) + ' · ' + a.toLocaleDateString('de-DE', { day:'numeric', month:'short' }) +
                   ' – ' + b2.toLocaleDateString('de-DE', { day:'numeric', month:'short', year:'numeric' }); })()
        : stand.toLocaleDateString('de-DE', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    const kopf = document.createElement('div');
    kopf.className = 'kal-kopf';
    kopf.innerHTML =
      `<b>${esc(titel)}</b><span style="flex:1"></span>` +
      '<div class="kal-stufen">' +
        `<button data-s="tag"${stufe === 'tag' ? ' class="on"' : ''} title="Taste T oder D">Tag</button>` +
        `<button data-s="woche"${stufe === 'woche' ? ' class="on"' : ''} title="Taste W">Woche</button>` +
        `<button data-s="monat"${stufe === 'monat' ? ' class="on"' : ''} title="Taste M">Monat</button>` +
      '</div>' +
      '<button data-m="-1">‹</button>' +
      '<button data-m="0" class="heute">Heute</button>' +
      '<button data-m="1">›</button>';

    const springe = (richtung) => {
      const d = new Date(stand);
      if (richtung === 0) return new Date();
      if (stufe === 'monat') d.setMonth(d.getMonth() + richtung);
      else if (stufe === 'woche') d.setDate(d.getDate() + 7 * richtung);
      else d.setDate(d.getDate() + richtung);
      return d;
    };

    kopf.addEventListener('click', e => {
      const s = e.target.closest('button[data-s]');
      if (s) { Store.updateView(view.id, { kalStufe: s.dataset.s }); App.zeichneSeite(); return; }
      const b = e.target.closest('button[data-m]');
      if (!b) return;
      Store.updateView(view.id, { monat: springe(Number(b.dataset.m)).toISOString() });
      App.zeichneSeite();
    });
    w.appendChild(kopf);

    /* --- Eine Tageszelle, wie sie Monat und Woche brauchen -------------- */
    const tagesZelle = (tag, ausserhalb) => {
      const d = document.createElement('div');
      d.className = 'day' + (tag.toDateString() === heuteStr ? ' today' : '') +
                    (ausserhalb ? ' out' : '');
      d.innerHTML = `<div class="n">${tag.getDate()}</div>`;
      quellen.forEach(q => termineAmTag(q, tag, zeilenVon(q))
        .forEach(e => d.appendChild(terminKnopf(e, view))));
      d.addEventListener('dblclick', () => {
        const z = quellen.find(q => q.id === (view.neuIn || quellen[0].id)) || quellen[0];
        const p = (n) => String(n).padStart(2, '0');
        Store.addRow(z.id, { [z.dateKey]: tag.getFullYear() + '-' + p(tag.getMonth() + 1) + '-' + p(tag.getDate()) });
        App.zeichneSeite();
      });
      return d;
    };

    /* --- Monat ---------------------------------------------------------- */
    if (stufe === 'monat') {
      const g = document.createElement('div');
      g.className = 'cal';
      (wsMontag ? ['Mo','Di','Mi','Do','Fr','Sa','So'] : ['So','Mo','Di','Mi','Do','Fr','Sa'])
        .forEach(n => { const e = document.createElement('div'); e.className = 'dow'; e.textContent = n; g.appendChild(e); });

      const jahr = stand.getFullYear(), monat = stand.getMonth();
      const erster = new Date(jahr, monat, 1);
      let vorlauf = wsMontag ? erster.getDay() - 1 : erster.getDay();
      if (vorlauf < 0) vorlauf = 6;
      const tageImMonat = new Date(jahr, monat + 1, 0).getDate();

      for (let i = vorlauf; i > 0; i--) g.appendChild(tagesZelle(new Date(jahr, monat, 1 - i), true));
      for (let t = 1; t <= tageImMonat; t++) g.appendChild(tagesZelle(new Date(jahr, monat, t)));
      const rest = (7 - ((vorlauf + tageImMonat) % 7)) % 7;
      for (let i = 1; i <= rest; i++) g.appendChild(tagesZelle(new Date(jahr, monat + 1, i), true));
      w.appendChild(g);
    }

    /* --- Woche ---------------------------------------------------------- */
    if (stufe === 'woche') {
      const g = document.createElement('div');
      g.className = 'cal woche';
      const a = wochenAnfang(stand);
      for (let i = 0; i < 7; i++) {
        const t = new Date(a); t.setDate(a.getDate() + i);
        const e = document.createElement('div');
        e.className = 'dow' + (t.toDateString() === heuteStr ? ' jetzt' : '');
        e.textContent = t.toLocaleDateString('de-DE', { weekday: 'short' }) + ' ' + t.getDate() + '.';
        g.appendChild(e);
      }
      for (let i = 0; i < 7; i++) {
        const t = new Date(a); t.setDate(a.getDate() + i);
        g.appendChild(tagesZelle(t));
      }
      w.appendChild(g);
    }

    /* --- Tag ------------------------------------------------------------ */
    if (stufe === 'tag') {
      const g = document.createElement('div');
      g.className = 'kal-tag';
      const alle = [];
      quellen.forEach(q => termineAmTag(q, stand, zeilenVon(q)).forEach(e => alle.push(e)));

      const ganztags = alle.filter(e => e.stunde == null);
      if (ganztags.length) {
        const z = document.createElement('div');
        z.className = 'kt-zeile ganztags';
        z.innerHTML = '<div class="kt-std">ganztags</div>';
        const box = document.createElement('div');
        box.className = 'kt-inhalt';
        ganztags.forEach(e => box.appendChild(terminKnopf(e, view)));
        z.appendChild(box);
        g.appendChild(z);
      }

      for (let h = 0; h < 24; h++) {
        const drin = alle.filter(e => e.stunde === h);
        /* Nachts nur zeigen, was auch belegt ist — sonst scrollt man ewig. */
        if (!drin.length && (h < 7 || h > 21)) continue;
        const z = document.createElement('div');
        z.className = 'kt-zeile';
        z.innerHTML = `<div class="kt-std">${String(h).padStart(2, '0')}:00</div>`;
        const box = document.createElement('div');
        box.className = 'kt-inhalt';
        drin.forEach(e => box.appendChild(terminKnopf(e, view)));
        box.addEventListener('dblclick', () => {
          const q = quellen.find(x => x.id === (view.neuIn || quellen[0].id)) || quellen[0];
          const p = (n) => String(n).padStart(2, '0');
          Store.addRow(q.id, { [q.dateKey]: stand.getFullYear() + '-' + p(stand.getMonth() + 1) + '-' +
                                            p(stand.getDate()) + 'T' + p(h) + ':00' });
          App.zeichneSeite();
        });
        z.appendChild(box);
        g.appendChild(z);
      }
      if (!alle.length) {
        const leer = document.createElement('div');
        leer.className = 'db-leer';
        leer.textContent = 'Nichts an diesem Tag. Doppelklick auf eine Stunde legt einen Eintrag an.';
        g.appendChild(leer);
      }
      w.appendChild(g);
    }

    /* --- Fuss: Kalenderliste und Zeitraum-Spalte ------------------------ */
    const alleQuellen = kalenderQuellen(coll, view);
    const datumKeys2 = Object.keys(coll.schema).filter(k =>
      ['date','created','edited'].includes(coll.schema[k].type));

    const fuss = document.createElement('div');
    fuss.className = 'cal-fuss';
    fuss.innerHTML =
      '<span>Doppelklick legt einen Eintrag an · Tasten T, W, M</span>' +
      `<button data-a="kalender">Kalender: <b>${alleQuellen.filter(q => q.an).length}</b></button>` +
      '<button data-a="ende">Zeitraum bis: <b>' +
      `${view.endeKey && coll.schema[view.endeKey] ? esc(coll.schema[view.endeKey].name) : 'ein Tag'}</b></button>`;

    fuss.addEventListener('click', e => {
      const r2 = e.target.getBoundingClientRect();

      if (e.target.closest('[data-a="ende"]')) {
        const m = UI.menu('<div class="grp">Enddatum für mehrtägige Einträge</div>' +
          datumKeys2.map(k => `<button data-e="${k}">${esc(coll.schema[k].name)}</button>`).join('') +
          '<hr><button data-e="">nur ein Tag</button>', r2.left, r2.bottom + 4);
        m.addEventListener('click', ev => {
          const b2 = ev.target.closest('button[data-e]');
          if (!b2) return;
          Store.updateView(view.id, { endeKey: b2.dataset.e });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      if (e.target.closest('[data-a="kalender"]')) { kalenderListe(r2, coll, view); return; }
    });
    w.appendChild(fuss);

    /* Tastenkürzel T/D, W, M — nur solange dieser Kalender auf der Seite steht
       und niemand gerade in ein Feld tippt. */
    if (!w.dataset.tasten) {
      w.dataset.tasten = '1';
      const taste = (e) => {
        if (!document.body.contains(w)) { document.removeEventListener('keydown', taste); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const z = e.target;
        if (z && (z.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(z.tagName))) return;
        const k = e.key.toLowerCase();
        const neu = (k === 't' || k === 'd') ? 'tag' : k === 'w' ? 'woche' : k === 'm' ? 'monat' : null;
        if (!neu || neu === stufe) return;
        e.preventDefault();
        Store.updateView(view.id, { kalStufe: neu });
        App.zeichneSeite();
      };
      document.addEventListener('keydown', taste);
    }

    return w;
  };

  /** Welche Datenbanken liegen im Kalender übereinander? */
  const kalenderListe = (r, coll, view) => {
    const zeichnen = () => {
      const liste = kalenderQuellen(coll, view);
      return '<div class="grp">Kalender in dieser Ansicht</div>' +
        liste.map((q, i) =>
          `<button data-t="${i}"><span class="mi">${q.an ? '☑' : '☐'}</span>` +
          `<span class="kal-punkt bg-${q.farbe}"></span>${esc(q.name)}` +
          (q.eigen ? '<span class="ms">eigen</span>'
                   : `<span class="ms"><span data-hoch="${i}">↑</span> <span data-weg="${i}">✕</span></span>`) +
          '</button>').join('') +
        '<hr><button data-a="dazu"><span class="mi">＋</span>Weitere Datenbank einblenden</button>' +
        `<button data-a="neuin"><span class="mi">✚</span>Neue Einträge landen in: ` +
        `${esc((liste.find(q => q.id === (view.neuIn || liste[0].id)) || liste[0]).name)}</button>`;
    };

    const m = UI.menu(zeichnen(), r.left - 60, r.bottom + 4);

    m.addEventListener('click', e => {
      const hoch = e.target.closest('[data-hoch]');
      if (hoch) {
        const i = +hoch.dataset.hoch - 1;          /* 0 ist die eigene Datenbank */
        const x = view.extraDbs || [];
        if (i > 0) { [x[i - 1], x[i]] = [x[i], x[i - 1]]; Store.updateView(view.id, { extraDbs: x }); }
        m.innerHTML = zeichnen(); App.zeichneSeite();
        return;
      }
      const weg = e.target.closest('[data-weg]');
      if (weg) {
        const x = view.extraDbs || [];
        x.splice(+weg.dataset.weg - 1, 1);
        Store.updateView(view.id, { extraDbs: x });
        m.innerHTML = zeichnen(); App.zeichneSeite();
        return;
      }
      const t = e.target.closest('button[data-t]');
      if (t) {
        const i = +t.dataset.t;
        if (i === 0) { UI.toast('Die eigene Datenbank bleibt sichtbar'); return; }
        const x = view.extraDbs || [];
        x[i - 1].an = x[i - 1].an === false;
        Store.updateView(view.id, { extraDbs: x });
        m.innerHTML = zeichnen(); App.zeichneSeite();
        return;
      }

      if (e.target.closest('[data-a="dazu"]')) {
        const drin = new Set([coll.id, ...(view.extraDbs || []).map(x => x.collectionId)]);
        const frei = Object.values(Store.cache.collections).filter(c =>
          !drin.has(c.id) && Object.values(c.schema).some(d => d.type === 'date'));
        if (!frei.length) { UI.toast('Keine weitere Datenbank mit Datum gefunden'); return; }
        m.innerHTML = '<div class="grp">Welche Datenbank?</div>' +
          frei.map(c => `<button data-c="${c.id}">${esc(c.name || 'Ohne Namen')}</button>`).join('');
        m.addEventListener('click', ev => {
          const c = ev.target.closest('button[data-c]');
          if (!c) return;
          const x = view.extraDbs || [];
          x.push({ collectionId: c.dataset.c, an: true,
                   farbe: KAL_FARBEN[(x.length + 1) % KAL_FARBEN.length] });
          Store.updateView(view.id, { extraDbs: x });
          m.remove(); App.zeichneSeite();
          UI.toast('Kalender eingeblendet');
        });
        return;
      }

      if (e.target.closest('[data-a="neuin"]')) {
        const liste = kalenderQuellen(coll, view);
        m.innerHTML = '<div class="grp">Neue Einträge landen in</div>' +
          liste.map(q => `<button data-n="${q.id}">${esc(q.name)}</button>`).join('');
        m.addEventListener('click', ev => {
          const n = ev.target.closest('button[data-n]');
          if (!n) return;
          Store.updateView(view.id, { neuIn: n.dataset.n });
          m.remove(); App.zeichneSeite();
        });
      }
    });
  };

  /* --- Dashboard -----------------------------------------------------------
   * Notions elfter Ansichtstyp. Kein neues Datenmodell, sondern eine
   * Zusammenfassung: oben die Kennzahlen, darunter die Verteilung nach
   * einer Spalte und die letzten Einträge. Was gezeigt wird, stellt man
   * über „Kacheln" ein.
   * ------------------------------------------------------------------------*/
  const alsDashboard = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'dash';

    const zahlKeys = Object.keys(coll.schema)
      .filter(k => ['number','formula','rollup','duration'].includes(coll.schema[k].type));
    const gruppKeys = Object.keys(coll.schema)
      .filter(k => ['select','status','multi','checkbox','person'].includes(coll.schema[k].type));
    const datumKeys = Object.keys(coll.schema)
      .filter(k => ['date','created','edited'].includes(coll.schema[k].type));

    const kacheln = view.kacheln || [
      { art: 'anzahl' },
      ...(zahlKeys.slice(0, 2).map(k => ({ art: 'summe', key: k }))),
      ...(gruppKeys.slice(0, 1).map(k => ({ art: 'verteilung', key: k })))
    ];

    /* --- Kennzahlen ------------------------------------------------------ */
    const oben = document.createElement('div');
    oben.className = 'dash-zahlen';

    kacheln.filter(k => k.art !== 'verteilung').forEach(k => {
      const d = document.createElement('div');
      d.className = 'dash-karte';
      if (k.art === 'anzahl') {
        d.innerHTML = `<span class="dz-wert">${rows.length}</span>` +
                      `<span class="dz-name">Einträge</span>`;
      } else {
        const name = coll.schema[k.key]?.name || '?';
        const art = k.art === 'summe' ? 'Summe' : k.art === 'schnitt' ? 'Durchschnitt' : 'Maximum';
        const wert2 = zusammenfassen(art, rows.map(r => wert(r, k.key, coll)), rows.length);
        d.innerHTML = `<span class="dz-wert">${esc(Formula.anzeige(wert2))}</span>` +
                      `<span class="dz-name">${esc(art)} · ${esc(name)}</span>`;
      }
      oben.appendChild(d);
    });
    if (oben.children.length) w.appendChild(oben);

    /* --- Verteilung ------------------------------------------------------ */
    kacheln.filter(k => k.art === 'verteilung' && k.key).forEach(k => {
      const def = coll.schema[k.key];
      if (!def) return;
      const zaehler = new Map();
      rows.forEach(r => {
        let v = wert(r, k.key, coll);
        if (Array.isArray(v)) v.forEach(x => zaehler.set(String(x), (zaehler.get(String(x)) || 0) + 1));
        else {
          const s2 = def.type === 'checkbox' ? (v ? 'Ja' : 'Nein') : (Formula.anzeige(v) || '(leer)');
          zaehler.set(s2, (zaehler.get(s2) || 0) + 1);
        }
      });
      const paare = [...zaehler.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      const hoechst = Math.max(1, ...paare.map(p2 => p2[1]));

      const box = document.createElement('div');
      box.className = 'dash-block';
      box.innerHTML = `<h4>Verteilung nach ${esc(def.name)}</h4>` +
        paare.map(([n, anz]) => {
          const opt = (def.options || []).find(o => o.name === n);
          return '<div class="dash-balken">' +
            `<span class="db-name">${esc(n)}</span>` +
            `<span class="db-strich"><i class="bg-${opt ? opt.color : 'blue'}" ` +
            `style="width:${Math.round(anz / hoechst * 100)}%"></i></span>` +
            `<span class="db-zahl">${anz}</span></div>`;
        }).join('');
      w.appendChild(box);
    });

    /* --- Zuletzt geändert ------------------------------------------------ */
    const letzte = document.createElement('div');
    letzte.className = 'dash-block';
    const sortiertNach = rows.slice().sort((a, b) =>
      new Date(b.edited || b.created) - new Date(a.edited || a.created)).slice(0, 8);
    letzte.innerHTML = '<h4>Zuletzt geändert</h4>' +
      (sortiertNach.length
        ? sortiertNach.map(r =>
            `<button class="dash-zeile" data-rid="${r.id}">` +
            `<span>${esc(r.text || 'Ohne Titel')}</span>` +
            `<em>${esc(Einstellungen.datum(new Date(r.edited || r.created), true))}</em></button>`).join('')
        : '<div class="db-leer">Noch keine Einträge.</div>');
    letzte.addEventListener('click', e => {
      const b = e.target.closest('[data-rid]');
      if (b) zeilePeek(Store.getBlock(b.dataset.rid), coll);
    });
    w.appendChild(letzte);

    /* --- Nächste Termine ------------------------------------------------- */
    if (datumKeys.length) {
      const dk = datumKeys[0];
      const heute2 = new Date(); heute2.setHours(0, 0, 0, 0);
      const kommend = rows
        .map(r => ({ r, d: new Date(wert(r, dk, coll) || 0) }))
        .filter(x => !isNaN(x.d) && x.d >= heute2)
        .sort((a, b) => a.d - b.d).slice(0, 6);
      if (kommend.length) {
        const t = document.createElement('div');
        t.className = 'dash-block';
        t.innerHTML = `<h4>Als Nächstes · ${esc(coll.schema[dk].name)}</h4>` +
          kommend.map(x => `<button class="dash-zeile" data-rid="${x.r.id}">` +
            `<span>${esc(x.r.text || 'Ohne Titel')}</span>` +
            `<em>${x.d.toLocaleDateString('de-DE')}</em></button>`).join('');
        t.addEventListener('click', e => {
          const b = e.target.closest('[data-rid]');
          if (b) zeilePeek(Store.getBlock(b.dataset.rid), coll);
        });
        w.appendChild(t);
      }
    }

    /* --- Kacheln einstellen ---------------------------------------------- */
    const fuss = document.createElement('div');
    fuss.className = 'cal-fuss';
    fuss.innerHTML = '<span>Ein Überblick über diese Datenbank.</span>' +
                     '<button data-a="kacheln">Kacheln einstellen</button>';
    fuss.addEventListener('click', e => {
      if (!e.target.closest('[data-a="kacheln"]')) return;
      const r = e.target.getBoundingClientRect();
      const m = UI.menu(
        '<div class="grp">Kennzahl hinzufügen</div>' +
        '<button data-neu="anzahl">Anzahl der Einträge</button>' +
        zahlKeys.map(k => `<button data-neu="summe:${k}">Summe · ${esc(coll.schema[k].name)}</button>` +
          `<button data-neu="schnitt:${k}">Durchschnitt · ${esc(coll.schema[k].name)}</button>`).join('') +
        '<div class="grp">Verteilung</div>' +
        gruppKeys.map(k => `<button data-neu="verteilung:${k}">Nach ${esc(coll.schema[k].name)}</button>`).join('') +
        '<hr><button data-neu="leer">Alle Kacheln entfernen</button>',
        r.left - 160, r.top - 20);
      m.addEventListener('click', ev => {
        const b = ev.target.closest('[data-neu]');
        if (!b) return;
        const [art, key] = b.dataset.neu.split(':');
        const liste = art === 'leer' ? [] : [...kacheln, key ? { art, key } : { art }];
        Store.updateView(view.id, { kacheln: liste });
        m.remove(); App.zeichneSeite();
      });
    });
    w.appendChild(fuss);

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

  /* --- Karte: OpenStreetMap, kostenlos und ohne Schlüssel ----------------
   * Kein fremdes Kartenpaket: die Kacheln kommen direkt von openstreetmap.org,
   * die Umrechnung von Länge und Breite auf Kacheln steht unten.
   * Orte werden über Nominatim gesucht (ebenfalls kostenlos) und danach in
   * der Zeile gespeichert, damit dieselbe Adresse nie zweimal gesucht wird.
   * ----------------------------------------------------------------------*/
  const KACHEL = 256;

  const nachKachel = (lat, lon, z) => {
    const n = Math.pow(2, z);
    const x = (lon + 180) / 360 * n;
    const rad = lat * Math.PI / 180;
    const y = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * n;
    return { x, y };
  };

  /** Sucht eine Adresse — höchstens eine Anfrage je Sekunde, so will es Nominatim. */
  let letzteSuche = 0;
  const ortSuchen = async (text2) => {
    const warten = Math.max(0, 1100 - (Date.now() - letzteSuche));
    if (warten) await new Promise(r => setTimeout(r, warten));
    letzteSuche = Date.now();
    const r = await KI.holen('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
                            encodeURIComponent(text2), {}, { versuche: 3, basis: 1200 });
    if (!r.ok) throw new Error('Ortssuche antwortet mit ' + r.status);
    const d = await r.json();
    if (!d.length) return null;
    return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), name: d[0].display_name };
  };

  const alsKarte = (coll, view, rows) => {
    const w = document.createElement('div');
    w.className = 'karte-w';

    const ortKeys = Object.keys(coll.schema).filter(k =>
      ['text','title','select'].includes(coll.schema[k].type));
    const ortKey = view.ortKey && coll.schema[view.ortKey] ? view.ortKey : ortKeys[0];

    if (!ortKey) {
      w.innerHTML = '<div class="db-leer">Für die Karte braucht es eine Textspalte mit Orten.</div>';
      return w;
    }

    /* Was ist schon bekannt? */
    const punkte = rows.map(r => {
      const g = (r.geo || {})[ortKey];
      return g ? { row: r, lat: g.lat, lon: g.lon } : null;
    }).filter(Boolean);

    const offen = rows.filter(r => !(r.geo || {})[ortKey] &&
                                   String(wert(r, ortKey, coll) || '').trim());

    const kopf = document.createElement('div');
    kopf.className = 'karte-kopf';
    kopf.innerHTML =
      `<span>${punkte.length} auf der Karte</span>` +
      (offen.length ? `<button data-a="suchen">${offen.length} Orte nachschlagen</button>` : '') +
      '<button data-a="spalte">Ortsspalte: <b>' + esc(coll.schema[ortKey].name) + '</b></button>' +
      '<span class="karte-quelle">Karten © OpenStreetMap — kostenlos, ohne Schlüssel</span>';
    w.appendChild(kopf);

    const flaeche = document.createElement('div');
    flaeche.className = 'karte';
    w.appendChild(flaeche);

    /* Mittelpunkt und Zoom */
    let z = view.zoom || 5;
    let mitte = punkte.length
      ? { lat: punkte.reduce((a, p) => a + p.lat, 0) / punkte.length,
          lon: punkte.reduce((a, p) => a + p.lon, 0) / punkte.length }
      : { lat: 51.0, lon: 10.0 };

    const male = () => {
      const b = flaeche.clientWidth || 700, h = 420;
      flaeche.innerHTML = '';
      flaeche.style.height = h + 'px';

      const m = nachKachel(mitte.lat, mitte.lon, z);
      const linksOben = { x: m.x - b / 2 / KACHEL, y: m.y - h / 2 / KACHEL };
      const n = Math.pow(2, z);

      for (let dx = -1; dx <= Math.ceil(b / KACHEL); dx++) {
        for (let dy = -1; dy <= Math.ceil(h / KACHEL); dy++) {
          const tx = Math.floor(linksOben.x) + dx;
          const ty = Math.floor(linksOben.y) + dy;
          if (ty < 0 || ty >= n) continue;
          const bild = document.createElement('img');
          bild.className = 'kachel';
          bild.loading = 'lazy';
          bild.src = `https://tile.openstreetmap.org/${z}/${((tx % n) + n) % n}/${ty}.png`;
          bild.style.left = ((tx - linksOben.x) * KACHEL) + 'px';
          bild.style.top  = ((ty - linksOben.y) * KACHEL) + 'px';
          bild.addEventListener('error', () => { bild.style.opacity = '0'; });
          flaeche.appendChild(bild);
        }
      }

      punkte.forEach(p => {
        const k = nachKachel(p.lat, p.lon, z);
        const x = (k.x - linksOben.x) * KACHEL;
        const y = (k.y - linksOben.y) * KACHEL;
        if (x < -40 || y < -40 || x > b + 40 || y > h + 40) return;
        const nadel = document.createElement('button');
        nadel.className = 'nadel';
        nadel.style.left = x + 'px';
        nadel.style.top = y + 'px';
        nadel.innerHTML = '<span class="n-punkt"></span><span class="n-text">' +
                          esc(p.row.text || 'Ohne Titel') + '</span>';
        nadel.addEventListener('click', () => zeilePeek(p.row, coll));
        flaeche.appendChild(nadel);
      });

      const werkzeuge = document.createElement('div');
      werkzeuge.className = 'karte-zoom';
      werkzeuge.innerHTML = '<button data-z="1">+</button><button data-z="-1">−</button>';
      werkzeuge.addEventListener('click', e => {
        const b2 = e.target.closest('[data-z]');
        if (!b2) return;
        z = Math.max(2, Math.min(18, z + (+b2.dataset.z)));
        Store.updateView(view.id, { zoom: z });
        male();
      });
      flaeche.appendChild(werkzeuge);
    };

    /* Ziehen verschiebt die Karte */
    let zieht = false, zx = 0, zy = 0;
    flaeche.addEventListener('pointerdown', e => {
      if (e.target.closest('.nadel, .karte-zoom')) return;
      zieht = true; zx = e.clientX; zy = e.clientY;
      flaeche.setPointerCapture(e.pointerId);
    });
    flaeche.addEventListener('pointermove', e => {
      if (!zieht) return;
      const n = Math.pow(2, z);
      mitte.lon -= (e.clientX - zx) / KACHEL / n * 360;
      const dLat = (e.clientY - zy) / KACHEL / n * 360;
      mitte.lat = Math.max(-85, Math.min(85, mitte.lat + dLat * Math.cos(mitte.lat * Math.PI / 180)));
      zx = e.clientX; zy = e.clientY;
      male();
    });
    flaeche.addEventListener('pointerup', () => { zieht = false; });

    setTimeout(male, 0);

    kopf.addEventListener('click', async e => {
      if (e.target.closest('[data-a="spalte"]')) {
        const r = e.target.getBoundingClientRect();
        const m = UI.menu('<div class="grp">Welche Spalte enthält den Ort?</div>' +
          ortKeys.map(k => `<button data-k="${k}">${esc(coll.schema[k].name)}</button>`).join(''),
          r.left, r.bottom + 4);
        m.addEventListener('click', ev => {
          const k = ev.target.closest('button[data-k]');
          if (!k) return;
          Store.updateView(view.id, { ortKey: k.dataset.k });
          m.remove(); App.zeichneSeite();
        });
        return;
      }
      if (!e.target.closest('[data-a="suchen"]')) return;

      UI.toast(offen.length + ' Orte werden nachgeschlagen — das dauert etwa ' + offen.length + ' Sekunden');
      let n = 0;
      for (const r of offen) {
        const txt = String(wert(r, ortKey, coll) || '').trim();
        try {
          const g = await ortSuchen(txt);
          if (g) {
            const geo = Object.assign({}, r.geo || {});
            geo[ortKey] = { lat: g.lat, lon: g.lon, name: g.name };
            Store.updateBlock(r.id, { geo });
            n++;
          }
        } catch (err) {
          UI.banner('Ortssuche nicht möglich: ' + err.message +
                    ' — offline oder vom Browser blockiert.', 'warn');
          break;
        }
      }
      UI.toast(n + ' Orte gefunden');
      App.zeichneSeite();
    });

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

    /* Datumsstufe: Tag, Woche, Monat, Quartal oder Jahr — wie in Notion */
    const stufe = view.chartStufe || 'monat';
    const alsStufe = (roh) => {
      const d = new Date(roh);
      if (isNaN(d)) return String(roh);
      const j = d.getFullYear();
      if (stufe === 'tag')     return d.toISOString().slice(0, 10);
      if (stufe === 'woche')   {
        const start = Einstellungen.wochenstart();
        const t = new Date(d);
        t.setDate(t.getDate() - ((t.getDay() - start + 7) % 7));
        return t.toISOString().slice(0, 10) + ' (KW)';
      }
      if (stufe === 'quartal') return j + ' Q' + (Math.floor(d.getMonth() / 3) + 1);
      if (stufe === 'jahr')    return String(j);
      return d.toISOString().slice(0, 7);
    };

    /* Zusammenfassen — nicht nur Summe */
    const art = view.chartArt || (mKey ? 'Summe' : 'Anzahl');
    const map = new Map();
    rows.forEach(r => {
      let k = wert(r, gKey, coll);
      if (Array.isArray(k)) k = k.join(', ');
      if (['date','created','edited'].includes(coll.schema[gKey].type) && k) k = alsStufe(k);
      const name = (k === '' || k == null || k === false) ? '(leer)' : String(k);
      const v = mKey ? Formula.zahl(wert(r, mKey, coll)) : 1;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(isNaN(v) ? 0 : v);
    });

    const fasseZusammen = (liste) => {
      switch (art) {
        case 'Anzahl':        return liste.length;
        case 'Summe':         return liste.reduce((a, b) => a + b, 0);
        case 'Durchschnitt':  return liste.length ? +(liste.reduce((a, b) => a + b, 0) / liste.length).toFixed(2) : 0;
        case 'Median': {
          if (!liste.length) return 0;
          const so = liste.slice().sort((a, b) => a - b);
          const m2 = Math.floor(so.length / 2);
          return so.length % 2 ? so[m2] : (so[m2 - 1] + so[m2]) / 2;
        }
        case 'Minimum':          return liste.length ? Math.min(...liste) : 0;
        case 'Maximum':          return liste.length ? Math.max(...liste) : 0;
        case 'Spanne':           return liste.length ? Math.max(...liste) - Math.min(...liste) : 0;
        case 'Eindeutige zählen':return new Set(liste).size;
        case 'Gefüllte zählen':  return liste.filter(x => x !== 0).length;
        case 'Leere zählen':     return liste.filter(x => x === 0).length;
        case 'Prozent gefüllt':  return liste.length ? Math.round(liste.filter(x => x !== 0).length / liste.length * 100) : 0;
        default:                 return liste.reduce((a, b) => a + b, 0);
      }
    };

    const werte = [...map.entries()]
      .map(([name, liste]) => ({ name, wert: fasseZusammen(liste) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const leiste = document.createElement('div');
    leiste.className = 'chart-head';
    leiste.innerHTML =
      `<span class="chart-titel">${esc(coll.name)} — ${esc(coll.schema[gKey].name)}` +
      (mKey ? ' · ' + art + ' von ' + esc(coll.schema[mKey].name) : ' · ' + art) +
      (['date','created','edited'].includes(coll.schema[gKey].type) ? ' je ' + stufe : '') + '</span>' +
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
        gruppierbar.map(k => `<button data-g="${k}">${esc(coll.schema[k].name)}` +
          (k === gKey ? '<span class="ms">✓</span>' : '') + '</button>').join('') +
        '<div class="grp">Zeitstufe (bei Datum)</div>' +
        ['tag','woche','monat','quartal','jahr'].map(x =>
          `<button data-s="${x}">${x}${x === stufe ? '<span class="ms">✓</span>' : ''}</button>`).join('') +
        '<div class="grp">Werte</div>' +
        '<button data-m="">Anzahl der Einträge</button>' +
        messbar.map(k => `<button data-m="${k}">${esc(coll.schema[k].name)}` +
          (k === mKey ? '<span class="ms">✓</span>' : '') + '</button>').join('') +
        '<div class="grp">Zusammenfassen</div>' +
        ['Anzahl','Summe','Durchschnitt','Median','Minimum','Maximum','Spanne',
         'Eindeutige zählen','Gefüllte zählen','Leere zählen','Prozent gefüllt'].map(x =>
          `<button data-art="${esc(x)}">${x}${x === art ? '<span class="ms">✓</span>' : ''}</button>`).join(''),
        r.left, r.bottom + 4);
      m.addEventListener('click', ev => {
        const g = ev.target.closest('button[data-g]');
        const mm = ev.target.closest('button[data-m]');
        const st = ev.target.closest('button[data-s]');
        const ar = ev.target.closest('button[data-art]');
        if (g) Store.updateView(view.id, { chartGruppe: g.dataset.g });
        else if (mm) Store.updateView(view.id, { chartWert: mm.dataset.m });
        else if (st) Store.updateView(view.id, { chartStufe: st.dataset.s });
        else if (ar) Store.updateView(view.id, { chartArt: ar.dataset.art });
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
      !NUR_LESEN.includes(coll.schema[k].type) &&
      !KI_TYPEN.includes(coll.schema[k].type) &&
      coll.schema[k].type !== 'button' &&
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

      /* Die 13 Fragetypen aus Teil 8 — jeder bekommt das Feld, das zu ihm passt. */
      let eingabe;
      if (['select','status'].includes(def.type)) {
        eingabe = document.createElement('select');
        eingabe.innerHTML = '<option value=""></option>' +
          (def.options || []).map(o => `<option>${esc(o.name)}</option>`).join('');

      } else if (def.type === 'multi') {
        /* Mehrfachauswahl: eine Reihe Kästchen, wie in Notions Formular */
        eingabe = document.createElement('div');
        eingabe.className = 'form-mehr';
        eingabe.innerHTML = (def.options || []).map(o =>
          `<label class="tag bg-${o.color}"><input type="checkbox" data-o="${esc(o.name)}"> ${esc(o.name)}</label>`
        ).join('') || '<span style="color:var(--text-faint)">Noch keine Optionen</span>';

      } else if (def.type === 'checkbox') {
        eingabe = document.createElement('input');
        eingabe.type = 'checkbox';

      } else if (def.type === 'files') {
        eingabe = document.createElement('input');
        eingabe.type = 'file';
        eingabe.multiple = true;

      } else if (def.type === 'text') {
        /* Lange Antwort */
        eingabe = document.createElement('textarea');
        eingabe.rows = 3;
        eingabe.placeholder = def.beschreibung || '';

      } else if (def.type === 'person') {
        eingabe = document.createElement('input');
        eingabe.type = 'text';
        eingabe.setAttribute('list', 'fp-' + k);
        const namen = [...new Set(Store.rowsOf(coll.id)
          .map(r => wert(r, k, coll)).filter(Boolean).map(String))];
        const dl = document.createElement('datalist');
        dl.id = 'fp-' + k;
        dl.innerHTML = namen.map(n => `<option>${esc(n)}</option>`).join('');
        feld.appendChild(dl);

      } else {
        eingabe = document.createElement('input');
        eingabe.type = { date:'date', number:'number', url:'url', email:'email',
                         phone:'tel', duration:'text', place:'text' }[def.type] || 'text';
        if (def.type === 'duration') eingabe.placeholder = 'z. B. 1h30';
        if (def.type === 'place')    eingabe.placeholder = 'Adresse oder Ort';
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
      const dateiFelder = [];

      box.querySelectorAll('[data-k]').forEach(el => {
        const k = el.dataset.k;
        if (!coll.schema[k] || el.tagName === 'DATALIST') return;
        const versteckt = el.closest('.form-feld')?.style.display === 'none';
        const typ = coll.schema[k].type;
        let v;

        if (typ === 'multi') {
          v = [...el.querySelectorAll('input[data-o]:checked')].map(x => x.dataset.o);
        } else if (typ === 'files') {
          v = [];
          if (!versteckt && el.files && el.files.length) dateiFelder.push([k, el.files]);
        } else if (typ === 'duration') {
          v = dauerLesen(el.value);
        } else if (typ === 'place') {
          v = el.value.trim() ? { name: el.value.trim() } : null;
        } else {
          v = el.type === 'checkbox' ? el.checked : el.value;
        }

        const leer = v === '' || v === false || v == null || (Array.isArray(v) && !v.length);
        if (!versteckt && (view.pflicht || []).includes(k) && leer &&
            !(typ === 'files' && dateiFelder.some(d => d[0] === k))) fehlt = coll.schema[k].name;
        if (typ === 'title') titel = v;
        else props[k] = v;
      });
      if (fehlt) { UI.toast('Bitte „' + fehlt + '" ausfüllen'); return; }

      const r = Store.addRow(coll.id, props);
      Store.updateBlock(r.id, { text: titel || 'Ohne Titel' });
      setTimeout(() => automationenLaufen(r, coll, 'formular-neu'), 0);

      /* Angehängte Dateien bleiben lokal — als Data-URL am Eintrag. */
      dateiFelder.forEach(([k, dateien]) => {
        [...dateien].slice(0, 5).forEach(d => {
          if (d.size > 6 * 1024 * 1024) { UI.toast('„' + d.name + '" ist zu gross (über 6 MB)'); return; }
          const leser = new FileReader();
          leser.onload = () => {
            const alt = (Store.getBlock(r.id).props || {})[k] || [];
            Store.setProp(r.id, k, [...alt, { name: d.name, src: leser.result }]);
            App.zeichneSeite();
          };
          leser.readAsDataURL(d);
        });
      });

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
      z.innerHTML = `<span class="pp-n">${def.icon || propTyp(def.type).icon} ${esc(def.name)}</span>` +
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

    const m = UI.menuMitSuche(
      '<div class="grp">Seite</div>' +
      '<button data-a="fav"><span class="mi">☆</span>Zu Favoriten hinzufügen</button>' +
      '<button data-a="icon"><span class="mi">😀</span>Icon bearbeiten</button>' +
      '<button data-a="eigen"><span class="mi">☰</span>Eigenschaft bearbeiten<span class="ms">▸</span></button>' +
      '<hr>' +
      '<button data-a="peek"><span class="mi">◧</span>In der Vorschau öffnen</button>' +
      '<button data-a="voll"><span class="mi">⤢</span>Als ganze Seite öffnen</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentieren<span class="ms">Strg ⇧ M</span></button>' +
      '<hr>' +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren<span class="ms">Strg D</span></button>' +
      '<button data-a="oben"><span class="mi">↑</span>Darüber einfügen</button>' +
      '<button data-a="unten"><span class="mi">↓</span>Darunter einfügen</button>' +
      '<button data-a="unter"><span class="mi">↳</span>Unterelement anlegen</button>' +
      (coll.abhaengigkeiten
        ? '<button data-a="blockiert"><span class="mi">↪</span>Blockiert …</button>' +
          '<button data-a="blockiertvon"><span class="mi">↩</span>Blockiert von …</button>' : '') +
      '<button data-a="link"><span class="mi">🔗</span>Link kopieren</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentar</button>' +
      '<hr>' +
      `<button data-a="archiv"><span class="mi">🗄</span>${row.archiviert ? 'Aus dem Archiv holen' : 'Archivieren'}</button>` +
      '<button data-a="del"><span class="mi">🗑</span>In den Papierkorb<span class="ms">Entf</span></button>',
      r.left, r.bottom + 4,
      { platzhalter: 'Aktionen filtern …',
        fuss: 'Zuletzt bearbeitet von <b>' +
              esc(row.geaendertVon || row.erstelltVon || 'dir') + '</b><br>' +
              esc(Einstellungen.datum(new Date(row.edited || row.created), true)) });

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      m.remove();
      if (a === 'peek') zeilePeek(row, coll);
      if (a === 'icon') UI.emojiWaehlen(anker.getBoundingClientRect ? anker : document.body,
        (em) => { Store.updateBlock(row.id, { icon: em }); App.zeichneSeite(); });
      if (a === 'komm') Kommentare.panel(row.id);
      if (a === 'eigen') { zeilePeek(row, coll); }
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
        if (!coll.unterElemente) unterElementeAn(coll, true);
        const k = Store.addRow(coll.id, {});
        Store.updateBlock(k.id, { unterVon: row.id, text: 'Unterelement' });
        /* Auch in den beiden Spalten festhalten, damit Formeln es sehen */
        const eltern = (row.props || {})[UNTER_KEYS.kinder] || [];
        Store.setProp(row.id, UNTER_KEYS.kinder, [...eltern, k.id]);
        Store.setProp(k.id, UNTER_KEYS.eltern, [row.id]);
        App.zeichneSeite();
      }
      if (a === 'archiv') {
        Store.updateBlock(row.id, { archiviert: !row.archiviert });
        danach && danach();
        App.zeichneSeite();
        UI.toast(row.archiviert ? 'Aus dem Archiv geholt' : 'Archiviert — über die Ansicht wieder sichtbar');
      }
      if (a === 'blockiert' || a === 'blockiertvon') {
        const key = a === 'blockiert' ? ABH_KEYS.blockiert : ABH_KEYS.blockiertVon;
        const jetzt = (row.props || {})[key] || [];
        const andere = Store.rowsOf(coll.id).filter(z => z.id !== row.id);
        const m2 = UI.menuMitSuche(
          andere.map(z => `<button data-z="${z.id}">${esc(z.text || 'Ohne Titel')}` +
            `<span class="ms">${jetzt.includes(z.id) ? '✓' : ''}</span></button>`).join('') ||
          '<div class="menu-fuss">Keine andere Zeile da</div>',
          r.left, r.bottom + 4,
          { platzhalter: 'Zeile suchen …',
            kopf: `<div class="grp">${a === 'blockiert' ? 'Blockiert' : 'Blockiert von'}</div>` });
        m2.addEventListener('click', ev => {
          const z = ev.target.closest('[data-z]');
          if (!z) return;
          const id = z.dataset.z;
          const neu = jetzt.includes(id) ? jetzt.filter(x => x !== id) : [...jetzt, id];
          Store.setProp(row.id, key, neu);
          /* Gegenrichtung mitpflegen */
          const gegenKey = a === 'blockiert' ? ABH_KEYS.blockiertVon : ABH_KEYS.blockiert;
          const gegen = (Store.getBlock(id).props || {})[gegenKey] || [];
          Store.setProp(id, gegenKey,
            neu.includes(id) ? [...new Set([...gegen, row.id])] : gegen.filter(x => x !== row.id));
          m2.remove(); App.zeichneSeite();
        });
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

  /* Elf Ansichtstypen als Kachelraster — genau wie in Notion. */
  const neueAnsicht = (anker, coll, block) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Neue Ansicht hinzufügen</div>' +
      '<div class="dl-kacheln" style="padding:0 8px 8px; grid-template-columns:repeat(4,1fr)">' +
      LAYOUTS.map(([id, i, n]) =>
        `<button data-l="${id}"><span>${i}</span>${n}</button>`).join('') +
      '</div>' +
      '<hr><button data-a="quelle"><span class="mi">⛁</span>Neue Datenquelle</button>',
      r.left, r.bottom + 4);
    m.style.width = '320px';
    m.addEventListener('click', e => {
      if (e.target.closest('[data-a="quelle"]')) {
        m.remove();
        const p = Store.addPage(App.aktuelleSeite(), { text: 'Neue Datenbank' });
        Store.addDatabase(App.aktuelleSeite(), 'Neue Datenbank', null, 'table');
        App.zeichneSeite();
        UI.toast('Neue Datenquelle angelegt');
        return;
      }
      const b = e.target.closest('button[data-l]');
      if (!b) return;
      const v = Store.addView(coll.id, b.dataset.l);
      Store.updateBlock(block.id, { aktiveView: v.id });
      m.remove();
      App.zeichneSeite();
    });
  };

  const LAYOUT_NAMEN = { table:'Tabelle', board:'Board', list:'Liste', gallery:'Galerie',
    calendar:'Kalender', timeline:'Zeitleiste', chart:'Diagramm', form:'Formular',
    feed:'Feed', map:'Karte', dashboard:'Dashboard' };

  /** Gruppieren als eigenes kleines Menü — wird von zwei Stellen gebraucht. */
  /* ========================================================================
   * LAYOUT-PANEL
   * ------------------------------------------------------------------------
   * In Notion fährt rechts eine Leiste herein statt eines Menüs: neun
   * Kacheln für die Ansichtsart, darunter die Schalter, die zu dieser Art
   * passen. Genau so hier.
   * ======================================================================*/
  const LAYOUTS = [
    ['table',    '▦', 'Tabelle'],
    ['board',    '▤', 'Board'],
    ['timeline', '▬', 'Zeitleiste'],
    ['calendar', '📅', 'Kalender'],
    ['list',     '☰', 'Liste'],
    ['gallery',  '▩', 'Galerie'],
    ['chart',    '📊', 'Diagramm'],
    ['feed',     '📰', 'Feed'],
    ['map',      '🗺', 'Karte'],
    ['dashboard','🧮', 'Dashboard'],
    ['form',     '📝', 'Formular']
  ];

  /** Eine Leiste, die rechts hereinfährt. */
  const leiste = (titel, inhalt, beiSchliessen) => {
    document.querySelectorAll('.db-leiste').forEach(x => x.remove());
    const d = document.createElement('aside');
    d.className = 'db-leiste';
    d.innerHTML = `<div class="dl-kopf"><b>${esc(titel)}</b>` +
                  '<button class="icon-btn" data-a="zu">✕</button></div>' +
                  '<div class="dl-koerper">' + inhalt + '</div>';
    document.body.appendChild(d);
    d.addEventListener('click', e => {
      if (e.target.closest('[data-a="zu"]')) { d.remove(); beiSchliessen && beiSchliessen(); }
    });
    const weg = (e) => {
      if (!d.contains(e.target) && !e.target.closest('.menu, .overlay')) {
        d.remove(); document.removeEventListener('mousedown', weg);
        beiSchliessen && beiSchliessen();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', weg), 60);
    return d;
  };

  const schalter = (id, an, text, hinweis) =>
    `<div class="dl-zeile"><div class="dl-text"><b>${esc(text)}</b>` +
    (hinweis ? `<span>${esc(hinweis)}</span>` : '') + '</div>' +
    `<button class="schalter${an ? ' an' : ''}" data-s="${id}"><i></i></button></div>`;

  const layoutPanel = (coll, view, block) => {
    const zeichne = () => {
      const inhalt =
        '<div class="dl-kacheln">' + LAYOUTS.map(([id, ico, n]) =>
          `<button data-l="${id}" class="${view.layout === id ? 'on' : ''}">` +
          `<span>${ico}</span>${n}</button>`).join('') + '</div>' +

        schalter('titelZeigen', view.titelZeigen !== false, 'Titel der Datenquelle anzeigen') +
        (view.layout === 'table'
          ? schalter('linien', view.linien !== false, 'Vertikale Linien anzeigen') : '') +
        schalter('seitenIcon', view.seitenIcon !== false, 'Seiten-Icon anzeigen') +
        schalter('umbruchAlle', !!view.umbruchAlle, 'Zeilenumbruch für alle Inhalte') +
        `<div class="dl-zeile" data-w="oeffnen"><div class="dl-text"><b>Seiten öffnen als</b></div>` +
        `<span class="dl-wert">${view.oeffnenAls === 'voll' ? 'Ganze Seite' : 'Seitliche Vorschau'} ▸</span></div>` +
        `<div class="dl-zeile" data-w="limit"><div class="dl-text"><b>Ladelimit</b>` +
        '<span>Wie viele Einträge auf einmal</span></div>' +
        `<span class="dl-wert">${view.limit || 50} ▸</span></div>` +
        (['board','gallery'].includes(view.layout)
          ? `<div class="dl-zeile" data-w="karte"><div class="dl-text"><b>Kartengrösse</b></div>` +
            `<span class="dl-wert">${view.kartenGroesse || 'mittel'} ▸</span></div>` : '') +
        (view.layout === 'table'
          ? `<div class="dl-zeile" data-w="hoehe"><div class="dl-text"><b>Zeilenhöhe</b></div>` +
            `<span class="dl-wert">${view.hoehe || 'normal'} ▸</span></div>` : '');

      const d = leiste('Layout', inhalt);

      d.addEventListener('click', e => {
        const l = e.target.closest('[data-l]');
        if (l) {
          Store.updateView(view.id, { layout: l.dataset.l });
          App.zeichneSeite();
          setTimeout(zeichne, 30);
          return;
        }
        const sc = e.target.closest('[data-s]');
        if (sc) {
          const k = sc.dataset.s;
          const jetzt = k === 'umbruchAlle' ? !!view[k] : view[k] !== false;
          Store.updateView(view.id, { [k]: !jetzt });
          sc.classList.toggle('an', !jetzt);
          App.zeichneSeite();
          return;
        }
        const w = e.target.closest('[data-w]');
        if (!w) return;
        const r = w.getBoundingClientRect();
        const art = w.dataset.w;

        const auswahl = {
          oeffnen: [['peek','Seitliche Vorschau'], ['voll','Ganze Seite']],
          limit:   [[25,'25'], [50,'50'], [100,'100'], [250,'250'], [0,'alle']],
          karte:   [['klein','klein'], ['mittel','mittel'], ['gross','gross']],
          hoehe:   [['kompakt','kompakt'], ['normal','normal'], ['gross','gross']]
        }[art];
        const feld = { oeffnen:'oeffnenAls', limit:'limit', karte:'kartenGroesse', hoehe:'hoehe' }[art];

        const m = UI.menu(auswahl.map(([v, n]) =>
          `<button data-v="${v}">${n}</button>`).join(''), r.left - 140, r.bottom + 4);
        m.addEventListener('click', ev => {
          const b = ev.target.closest('button[data-v]');
          if (!b) return;
          const wert2 = art === 'limit' ? Number(b.dataset.v) : b.dataset.v;
          Store.updateView(view.id, { [feld]: wert2 });
          m.remove(); App.zeichneSeite();
          setTimeout(zeichne, 30);
        });
      });
    };
    zeichne();
  };

  /* ========================================================================
   * BEDINGTE FARBE
   * ------------------------------------------------------------------------
   * Eine Regel färbt die ganze Zeile, wenn eine Bedingung zutrifft. Notion
   * nennt das „Bedingte Farbe"; in Tabellenprogrammen heisst es bedingte
   * Formatierung. Die erste Regel, die zutrifft, gewinnt.
   * ======================================================================*/
  const FARBWAHL = ['red','orange','yellow','green','blue','purple','pink','brown','gray'];

  const farbregeln = (view) => view.farbregeln || [];

  const farbeFuerZeile = (row, view, coll) => {
    for (const r of farbregeln(view)) {
      if (r.an === false) continue;
      try { if (trifftZu(row, r, coll)) return r.farbe; } catch {}
    }
    return '';
  };

  const farbregelPanel = (coll, view, block) => {
    const zeichne = () => {
      const liste = farbregeln(view);
      const inhalt =
        '<div class="dl-hinweis">Die erste Regel, die zutrifft, färbt die Zeile.</div>' +
        (liste.length
          ? liste.map((r, i) =>
              `<div class="fr-zeile"><span class="fr-punkt bg-${r.farbe}"></span>` +
              `<span class="fr-text">${esc(coll.schema[r.key]?.name || '?')} ` +
              `${esc(r.op)} ${esc(r.wert || '')}</span>` +
              `<button data-an="${i}">${r.an === false ? '☐' : '☑'}</button>` +
              `<button data-weg="${i}">🗑</button></div>`).join('')
          : '<div class="dl-hinweis">Noch keine Regel.</div>') +
        '<button class="dl-knopf" data-a="neu">＋ Regel hinzufügen</button>';

      const d = leiste('Bedingte Farbe', inhalt);

      d.addEventListener('click', async e => {
        const an = e.target.closest('[data-an]');
        if (an) {
          const l = farbregeln(view);
          l[+an.dataset.an].an = l[+an.dataset.an].an === false;
          Store.updateView(view.id, { farbregeln: l });
          App.zeichneSeite(); setTimeout(zeichne, 20);
          return;
        }
        const weg = e.target.closest('[data-weg]');
        if (weg) {
          const l = farbregeln(view);
          l.splice(+weg.dataset.weg, 1);
          Store.updateView(view.id, { farbregeln: l });
          App.zeichneSeite(); setTimeout(zeichne, 20);
          return;
        }
        if (!e.target.closest('[data-a="neu"]')) return;

        const o = document.createElement('div');
        o.className = 'overlay';
        const keys = Object.keys(coll.schema);
        o.innerHTML = '<div class="finder" style="width:min(460px,94vw)">' +
          '<div class="fh">Neue Farbregel</div>' +
          '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
            '<label>Wenn<br><select id="fk">' +
              keys.map(k => `<option value="${k}">${esc(coll.schema[k].name)}</option>`).join('') +
            '</select></label>' +
            '<label>…<br><select id="fo"></select></label>' +
            '<label>diesen Wert<br><input id="fw"></label>' +
            '<label>dann färben<br><div class="fr-farben">' +
              FARBWAHL.map((c, i) => `<button data-c="${c}" class="bg-${c}` +
                `${i === 0 ? ' on' : ''}" title="${c}"></button>`).join('') +
            '</div></label>' +
          '</div>' +
          '<div class="fbtns"><button data-a="ok" class="prim">Anlegen</button>' +
          '<button data-a="zu">Abbrechen</button></div></div>';
        document.body.appendChild(o);

        let farbe = FARBWAHL[0];
        const ops = () => {
          const t = coll.schema[o.querySelector('#fk').value].type;
          o.querySelector('#fo').innerHTML = (OPERATOREN[t] || OPERATOREN.text)
            .map(x => `<option>${x}</option>`).join('');
        };
        ops();
        o.querySelector('#fk').addEventListener('change', ops);

        o.addEventListener('click', ev => {
          const c = ev.target.closest('[data-c]');
          if (c) {
            farbe = c.dataset.c;
            o.querySelectorAll('[data-c]').forEach(x => x.classList.remove('on'));
            c.classList.add('on');
            return;
          }
          if (ev.target === o || ev.target.closest('[data-a="zu"]')) { o.remove(); return; }
          if (!ev.target.closest('[data-a="ok"]')) return;
          const l = farbregeln(view);
          l.push({ key: o.querySelector('#fk').value, op: o.querySelector('#fo').value,
                   wert: o.querySelector('#fw').value, farbe, an: true });
          Store.updateView(view.id, { farbregeln: l });
          o.remove(); App.zeichneSeite(); setTimeout(zeichne, 20);
          UI.toast('Farbregel angelegt');
        });
      });
    };
    zeichne();
  };

  /** KI-Autofill: welche Spalte soll die KI für alle Zeilen füllen? */
  const kiAutofillMenue = (anker, coll, view) => {
    const r = anker.getBoundingClientRect();
    const kiSpalten = Object.keys(coll.schema).filter(k => KI_TYPEN.includes(coll.schema[k].type));
    const m = UI.menu(
      '<div class="grp">KI-Autofill</div>' +
      (kiSpalten.length
        ? kiSpalten.map(k => `<button data-k="${k}"><span class="mi">✨</span>` +
                             `${esc(coll.schema[k].name)} füllen</button>`).join('')
        : '<div class="grp" style="font-weight:400">Noch keine KI-Spalte. Lege eine ' +
          'Eigenschaft vom Typ „KI: Zusammenfassung" an.</div>'),
      r.left - 100, r.bottom + 4);
    m.addEventListener('click', async ev => {
      const b = ev.target.closest('button[data-k]');
      if (!b) return;
      m.remove();
      const zeilen2 = zeilen(coll, view).slice(0, 20);
      UI.toast('Die KI füllt ' + zeilen2.length + ' Zeilen …');
      for (const row of zeilen2) await kiFeldFuellen(row, b.dataset.k, coll);
      UI.toast('Fertig');
    });
  };

  const gruppierenMenue = (anker, coll, view, block, unter = false) => {
    const r = anker.getBoundingClientRect();
    const feld = unter ? 'subGroupBy' : 'groupBy';
    const m = UI.menu(
      `<div class="grp">${unter ? 'Untergruppieren' : 'Gruppieren'} nach</div>` +
      Object.keys(coll.schema)
        .filter(k => ['select','status','checkbox','multi','person','date','relation']
                     .includes(coll.schema[k].type))
        .map(k => `<button data-k="${k}"${view[feld] === k ? ' class="on"' : ''}>` +
                  `<span class="mi">${propTyp(coll.schema[k].type).icon}</span>` +
                  `${esc(coll.schema[k].name)}</button>`).join('') +
      '<hr><button data-k="">Keine Gruppierung</button>',
      r.left, r.bottom + 4);
    m.addEventListener('click', ev => {
      const kb = ev.target.closest('button[data-k]');
      if (!kb) return;
      Store.updateView(view.id, { [feld]: kb.dataset.k });
      m.remove(); App.zeichneSeite();
    });
  };

  /**
   * Datenquellen einer Ansicht. Notion zeigt hier die eigene Quelle, alle
   * zusätzlichen und den Knopf „Neue Datenquelle".
   */
  const quelleMenue = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const extra = view.extraDbs || [];
    const zeichnen = () => {
      const m = UI.menu(
        '<div class="grp">Datenquellen</div>' +
        `<button data-q="haupt"><span class="mi">⛁</span>${esc(coll.name)}` +
          `<span class="ms">${Store.rowsOf(coll.id).length}</span></button>` +
        extra.map((x, i) => {
          const c2 = Store.cache.collections[x.collectionId];
          if (!c2) return '';
          return `<button data-weg="${i}"><span class="mi">⛁</span>${esc(c2.name)}` +
                 `<span class="ms">${x.an === false ? 'aus' : Store.rowsOf(c2.id).length} ✕</span></button>`;
        }).join('') +
        '<hr>' +
        '<button data-q="neu"><span class="mi">＋</span>Neue Datenquelle</button>' +
        '<button data-q="wechseln"><span class="mi">⇄</span>Datenquelle wechseln …</button>' +
        '<div class="menu-fuss">Zeilen aus allen eingeschalteten Quellen erscheinen ' +
        'zusammen in dieser Ansicht.</div>',
        r.left, r.bottom + 4);

      m.addEventListener('click', e => {
        const weg = e.target.closest('[data-weg]');
        if (weg) {
          const i = +weg.dataset.weg;
          const neu = extra.filter((_, j) => j !== i);
          Store.updateView(view.id, { extraDbs: neu });
          m.remove(); App.zeichneSeite();
          return;
        }
        const b = e.target.closest('[data-q]');
        if (!b) return;
        if (b.dataset.q === 'haupt') { m.remove(); return; }
        m.remove();

        const drin = new Set([coll.id, ...extra.map(x => x.collectionId)]);
        const frei = Object.values(Store.cache.collections).filter(c => !drin.has(c.id));

        if (b.dataset.q === 'neu') {
          const m2 = UI.menuMitSuche(
            (frei.length
              ? frei.map(c => `<button data-c="${c.id}"><span class="mi">⛁</span>${esc(c.name)}</button>`).join('')
              : '') +
            '<hr><button data-c="__leer"><span class="mi">＋</span>Leere Datenquelle anlegen</button>',
            r.left, r.bottom + 4, { platzhalter: 'Datenquelle suchen …', kopf: '<div class="grp">Neue Datenquelle</div>' });
          m2.addEventListener('click', ev => {
            const c = ev.target.closest('[data-c]');
            if (!c) return;
            m2.remove();
            let ziel = c.dataset.c;
            if (ziel === '__leer') {
              const seite = Store.getBlock(App.aktuelleSeite());
              const neu = Store.addDatabase(seite ? seite.id : null, 'Neue Datenquelle', null, 'table');
              ziel = neu.collectionId;
            }
            Store.updateView(view.id, { extraDbs: [...extra, { collectionId: ziel, an: true }] });
            App.zeichneSeite();
            UI.toast('Datenquelle hinzugefügt');
          });
          return;
        }

        if (b.dataset.q === 'wechseln') {
          const alle = Object.values(Store.cache.collections);
          const m2 = UI.menuMitSuche(
            alle.map(c => `<button data-c="${c.id}"${c.id === coll.id ? ' class="on"' : ''}>` +
                          `<span class="mi">⛁</span>${esc(c.name)}</button>`).join(''),
            r.left, r.bottom + 4, { platzhalter: 'Datenquelle suchen …', kopf: '<div class="grp">Quelle wechseln</div>' });
          m2.addEventListener('click', ev => {
            const c = ev.target.closest('[data-c]');
            if (!c || c.dataset.c === coll.id) { m2.remove(); return; }
            Store.updateView(view.id, { collectionId: c.dataset.c, filters: { operator: 'and', rules: [] }, sorts: [] });
            m2.remove(); App.zeichneSeite();
            UI.toast('Ansicht zeigt jetzt: ' + (Store.cache.collections[c.dataset.c] || {}).name);
          });
        }
      });
    };
    zeichnen();
  };

  /* ------------------------------------------------------------------------
   * WEITERE EINSTELLUNGEN
   * Notion versteckt hinter „⋯ Weitere Einstellungen" fünf Dinge, die eine
   * Datenbank von einer Tabelle unterscheiden: Unter-Elemente,
   * Abhängigkeiten, Verbindungen, Seitenlayout und Aufgaben.
   * ----------------------------------------------------------------------*/

  /** Die zwei Spalten, die Notion beim Einschalten der Unter-Elemente anlegt. */
  const UNTER_KEYS = { eltern: 'unterEltern', kinder: 'unterKinder' };
  const ABH_KEYS   = { blockiert: 'abhBlockiert', blockiertVon: 'abhBlockiertVon' };

  const unterElementeAn = (coll, an) => {
    if (an) {
      coll.unterElemente = true;
      if (!coll.schema[UNTER_KEYS.eltern])
        coll.schema[UNTER_KEYS.eltern] = { name: 'Übergeordnetes Element', type: 'relation',
                                           ziel: coll.id, eigen: true };
      if (!coll.schema[UNTER_KEYS.kinder])
        coll.schema[UNTER_KEYS.kinder] = { name: 'Untergeordnete Elemente', type: 'relation',
                                           ziel: coll.id, eigen: true };
    } else {
      coll.unterElemente = false;
    }
    Store.updateCollection(coll.id, { schema: coll.schema, unterElemente: coll.unterElemente });
    App.zeichneSeite();
  };

  const abhaengigkeitenAn = (coll, an) => {
    if (an) {
      coll.abhaengigkeiten = true;
      if (!coll.schema[ABH_KEYS.blockiert])
        coll.schema[ABH_KEYS.blockiert] = { name: 'Blockiert', type: 'relation', ziel: coll.id, eigen: true };
      if (!coll.schema[ABH_KEYS.blockiertVon])
        coll.schema[ABH_KEYS.blockiertVon] = { name: 'Blockiert von', type: 'relation', ziel: coll.id, eigen: true };
    } else {
      coll.abhaengigkeiten = false;
    }
    Store.updateCollection(coll.id,
      { schema: coll.schema, abhaengigkeiten: coll.abhaengigkeiten });
    App.zeichneSeite();
  };

  /**
   * Ist eine Zeile blockiert? Notion verschiebt bei „Verschiebung
   * verwerfen" nichts; hier wird nur gewarnt, wenn eine blockierende
   * Zeile noch offen ist.
   */
  const blockiertDurch = (row, coll) => {
    if (!coll.abhaengigkeiten) return [];
    const ids = (row.props || {})[ABH_KEYS.blockiertVon] || [];
    return ids.map(id => Store.getBlock(id)).filter(z => {
      if (!z) return false;
      const st = Object.keys(coll.schema).find(k => coll.schema[k].type === 'status');
      const hk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'checkbox');
      if (hk) return !(z.props || {})[hk];
      if (st) return !/fertig|erledigt|done|abgeschlossen/i.test(String((z.props || {})[st] || ''));
      return true;
    });
  };

  const weitereEinstellungen = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Weitere Einstellungen</div>' +
      `<button data-w="unter"><span class="mi">⇥</span>Unter-Elemente` +
        `<span class="ms">${coll.unterElemente ? 'an' : 'aus'} ▸</span></button>` +
      `<button data-w="abh"><span class="mi">↪</span>Abhängigkeiten` +
        `<span class="ms">${coll.abhaengigkeiten ? 'an' : 'aus'} ▸</span></button>` +
      `<button data-w="verb"><span class="mi">⊞</span>Verbindungen` +
        `<span class="ms">${(coll.verbindungen || []).length || 'keine'} ▸</span></button>` +
      '<button data-w="layout"><span class="mi">▤</span>Seitenlayout individuell anpassen<span class="ms">▸</span></button>' +
      `<button data-w="aufgaben"><span class="mi">☑</span>In Aufgaben umwandeln` +
        `<span class="ms">${coll.istAufgaben ? 'an' : 'aus'}</span></button>`,
      r.left, r.bottom + 4);

    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-w]');
      if (!b) return;
      const w = b.dataset.w;
      m.remove();

      if (w === 'unter')     { unterElementePanel(coll); return; }
      if (w === 'abh')       { abhaengigkeitenPanel(coll); return; }
      if (w === 'verb')      { dbVerbindungenMenue(anker, coll); return; }
      if (w === 'layout')    { seitenLayoutPanel(coll); return; }
      if (w === 'aufgaben')  { aufgabenPanel(coll); return; }
    });
  };

  /** Ein kleiner Erklärkasten mit einem Schalter — wie bei Notion. */
  const schalterPanel = ({ titel, text, bild, an, anText, ausText, schalten }) => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder we-panel">' +
        `<div class="fh">${esc(titel)}<button class="icon-btn" data-a="zu">✕</button></div>` +
        `<div class="we-text">${text}</div>` +
        (bild ? `<div class="we-bild">${bild}</div>` : '') +
        `<div class="we-fuss"><button class="we-knopf" data-a="tun">${an ? ausText : anText}</button></div>` +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="tun"]')) { o.remove(); schalten(!an); }
    });
    return o;
  };

  const unterElementePanel = (coll) => schalterPanel({
    titel: 'Unter-Elemente',
    text: 'Teile Elemente in Schalter auf. Jede Zeile kann Unterzeilen tragen, ' +
          'die sich auf- und zuklappen lassen.',
    bild: '<div class="we-baum"><div>▾ <b>Element (übergeordnet)</b></div>' +
          '<div class="ein">▸ Element (untergeordnet)</div>' +
          '<div class="ein">▸ Element (untergeordnet)</div></div>',
    an: !!coll.unterElemente,
    anText: 'Unter-Elemente aktivieren',
    ausText: 'Unter-Elemente ausschalten',
    schalten: (an) => {
      unterElementeAn(coll, an);
      UI.toast(an ? 'Unter-Elemente sind an — im Zeilenmenü „Unterelement anlegen"'
                  : 'Unter-Elemente sind aus');
    }
  });

  const abhaengigkeitenPanel = (coll) => schalterPanel({
    titel: 'Abhängigkeiten',
    text: 'Halte fest, was worauf wartet. Eine Zeile kann andere <b>blockieren</b> ' +
          'oder <b>von</b> anderen blockiert werden. Solange etwas Blockierendes ' +
          'offen ist, warnt die Zeile.',
    bild: '<div class="we-baum"><div><b>Entwurf schreiben</b> → blockiert</div>' +
          '<div class="ein">Korrektur lesen</div></div>',
    an: !!coll.abhaengigkeiten,
    anText: 'Abhängigkeiten aktivieren',
    ausText: 'Abhängigkeiten ausschalten',
    schalten: (an) => {
      abhaengigkeitenAn(coll, an);
      UI.toast(an ? 'Zwei Spalten angelegt: Blockiert und Blockiert von' : 'Abhängigkeiten sind aus');
    }
  });

  const aufgabenPanel = (coll) => schalterPanel({
    titel: 'In Aufgaben umwandeln',
    text: 'Diese Datenbank gilt dann als Aufgabenquelle. Ihre Zeilen erscheinen ' +
          'unter <b>Meine Apps → Meine Aufgaben</b>, sobald eine Person-Spalte auf ' +
          'dich zeigt.',
    an: !!coll.istAufgaben,
    anText: 'Als Aufgaben führen',
    ausText: 'Nicht mehr als Aufgaben führen',
    schalten: (an) => {
      const s = coll.schema;
      if (an) {
        if (!Object.values(s).some(d => d.type === 'status') &&
            !Object.values(s).some(d => d.type === 'checkbox'))
          s.aufgFertig = { name: 'Fertig', type: 'checkbox' };
        if (!Object.values(s).some(d => d.type === 'person'))
          s.aufgWer = { name: 'Zuständig', type: 'person' };
        if (!Object.values(s).some(d => d.type === 'date'))
          s.aufgFrist = { name: 'Frist', type: 'date' };
      }
      Store.updateCollection(coll.id, { schema: s, istAufgaben: an });
      /* Die Aufgabenseite fragt diese Liste ab */
      const q = Store.getMeta('aufgabenQuellen', null);
      if (an && q && !q.includes(coll.id)) Store.setMeta('aufgabenQuellen', [...q, coll.id]);
      if (!an && q) Store.setMeta('aufgabenQuellen', q.filter(x => x !== coll.id));
      App.zeichneSeite();
      UI.toast(an ? 'Zeilen erscheinen jetzt unter Meine Aufgaben' : 'Nicht mehr als Aufgaben geführt');
    }
  });

  const dbVerbindungenMenue = (anker, coll) => {
    const r = anker.getBoundingClientRect();
    const dienste = Verbindungen.DIENSTE || [];
    const drin = coll.verbindungen || [];
    const m = UI.menu('<div class="grp">Verbindungen dieser Datenbank</div>' +
      dienste.map(d => `<button data-v="${d.id}"><span class="mi">${d.icon || '⊞'}</span>` +
        `${esc(d.name)}<span class="ms">${drin.includes(d.id) ? 'an' : 'aus'}</span></button>`).join('') +
      '<div class="menu-fuss">Verknüpfte Dienste dürfen Zeilen dieser Datenbank ' +
      'lesen und schreiben — etwa der GitHub-Spiegel.</div>',
      r.left, r.bottom + 4);
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      const id = b.dataset.v;
      const neu = drin.includes(id) ? drin.filter(x => x !== id) : [...drin, id];
      Store.updateCollection(coll.id, { verbindungen: neu });
      m.remove(); App.zeichneSeite();
    });
  };

  /** Notions „Seitenlayout individuell anpassen" für die Datensatzseite. */
  const seitenLayoutPanel = (coll) => {
    const l = coll.seitenLayout || { breite: 'normal', eigenschaften: 'oben', kommentare: true, rueck: true };
    const o = document.createElement('div');
    o.className = 'overlay';
    const zeichne = () => {
      o.innerHTML =
        '<div class="finder we-panel">' +
          '<div class="fh">Seitenlayout<button class="icon-btn" data-a="zu">✕</button></div>' +
          '<div class="we-text">So sehen die Seiten dieser Datenbank aus, wenn man ' +
          'eine Zeile öffnet.</div>' +
          '<div class="we-liste">' +
            ['<div class="grp">Breite</div>',
             ['normal', 'Normal'], ['breit', 'Volle Breite']]
              .map(x => Array.isArray(x)
                ? `<button data-b="${x[0]}">${x[1]}<span class="ms">${l.breite === x[0] ? '✓' : ''}</span></button>`
                : x).join('') +
            '<div class="grp">Eigenschaften</div>' +
            [['oben', 'Über dem Inhalt'], ['seite', 'Daneben'], ['zu', 'Eingeklappt']]
              .map(([id, n]) => `<button data-e="${id}">${n}<span class="ms">${l.eigenschaften === id ? '✓' : ''}</span></button>`).join('') +
            '<div class="grp">Auf der Seite</div>' +
            `<button data-s="kommentare">Kommentare<span class="ms">${l.kommentare ? 'an' : 'aus'}</span></button>` +
            `<button data-s="rueck">Rückverweise<span class="ms">${l.rueck ? 'an' : 'aus'}</span></button>` +
          '</div>' +
        '</div>';
    };
    zeichne();
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const b = e.target.closest('[data-b]'), ei = e.target.closest('[data-e]'), s = e.target.closest('[data-s]');
      if (b) l.breite = b.dataset.b;
      if (ei) l.eigenschaften = ei.dataset.e;
      if (s) l[s.dataset.s] = !l[s.dataset.s];
      if (!b && !ei && !s) return;
      Store.updateCollection(coll.id, { seitenLayout: l });
      zeichne(); App.zeichneSeite();
    });
  };

  /** „Datenquellen verwalten" — was gehört dieser Datenbank, wer nutzt sie? */
  const quellenVerwalten = (anker, coll, view, block) => {
    const nutzer = Object.values(Store.cache.views)
      .filter(v => v.collectionId === coll.id ||
                   (v.extraDbs || []).some(x => x.collectionId === coll.id));
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder we-panel">' +
        '<div class="fh">Datenquellen verwalten<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="we-liste">' +
          `<div class="grp">${esc(coll.name)}</div>` +
          `<button data-a="umben">Umbenennen<span class="ms">${esc(coll.name)}</span></button>` +
          `<button data-a="zeilen">Zeilen<span class="ms">${Store.rowsOf(coll.id).length}</span></button>` +
          `<button data-a="spalten">Spalten<span class="ms">${Object.keys(coll.schema).length}</span></button>` +
          '<div class="grp">Wird verwendet in</div>' +
          (nutzer.length
            ? nutzer.map(v => `<button data-v="${v.id}">${esc(v.name || 'Ansicht')}` +
                `<span class="ms">${LAYOUT_NAMEN[v.layout] || v.layout}</span></button>`).join('')
            : '<div class="menu-fuss">In keiner Ansicht</div>') +
          '<div class="grp">Gefahr</div>' +
          '<button data-a="leeren" class="rot">Alle Zeilen löschen</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', async e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'umben') {
        const n = await UI.frage('Name der Datenquelle', coll.name);
        if (n) { Store.updateCollection(coll.id, { name: n }); o.remove(); App.zeichneSeite(); }
      }
      if (b.dataset.a === 'leeren') {
        if (!confirm('Wirklich alle Zeilen dieser Datenquelle in den Papierkorb legen?')) return;
        Store.rowsOf(coll.id).forEach(r => Store.trashBlock(r.id));
        o.remove(); App.zeichneSeite(); UI.toast('Zeilen in den Papierkorb gelegt');
      }
    });
  };

  /**
   * „Als ganze Seite öffnen" — die Datenbank füllt den Hauptbereich allein,
   * ohne den Text drumherum. Zurück geht es über die Krume.
   */
  const ganzeSeite = (coll, view, block) => {
    App.zeigeSonder(coll.name || 'Datenbank', (wrap) => {
      const kopf = document.createElement('h1');
      kopf.className = 'db-vollkopf';
      kopf.textContent = (coll.icon ? coll.icon + ' ' : '') + (coll.name || 'Datenbank');
      wrap.appendChild(kopf);
      const b2 = block
        ? Object.assign({}, block, { aktiveView: view.id, voll: true })
        : { id: 'voll-' + coll.id, collectionId: coll.id, aktiveView: view.id, voll: true };
      wrap.appendChild(render(b2));
    });
  };

  const ansichtMenue = (anker, coll, view, block) => {
    const r = anker.getBoundingClientRect();
    const sichtbar = Object.keys(coll.schema).filter(k => !(view.hidden || []).includes(k)).length;
    const LAY_ICON = { table:'▦', board:'▤', list:'☰', gallery:'▩', calendar:'📅',
                      timeline:'▬', chart:'📊', form:'📝', feed:'📰', map:'🗺',
                      dashboard:'🧮' };
    const kopfKarte =
      '<div class="av-karte">' +
        `<span class="av-ico">${LAY_ICON[view.layout] || '▦'}</span>` +
        `<input class="av-name" value="${esc(view.name || 'Ansicht')}" spellcheck="false">` +
        '<button class="av-info" data-info="1" title="Beschreibung">ⓘ</button>' +
      '</div>' +
      (view.beschreibung ? `<div class="av-besch">${esc(view.beschreibung)}</div>` : '');

    const m = UI.menuMitSuche(
      '<div class="grp">Einstellungen ansehen</div>' +
      `<button data-a="layout"><span class="mi">▦</span>Layout` +
        `<span class="ms">${LAYOUT_NAMEN[view.layout] || view.layout} ▸</span></button>` +
      `<button data-a="sichtbar"><span class="mi">👁</span>Sichtbarkeit von Eigenschaften` +
        `<span class="ms">${sichtbar} ▸</span></button>` +
      `<button data-a="filter"><span class="mi">⚟</span>Filter` +
        `<span class="ms">${regelAnzahl(view.filters) || ''} ▸</span></button>` +
      `<button data-a="sort"><span class="mi">↕</span>Sortierung` +
        `<span class="ms">${(view.sorts || []).length || ''} ▸</span></button>` +
      `<button data-a="gruppe"><span class="mi">⊞</span>Gruppieren` +
        `<span class="ms">${view.groupBy ? esc(coll.schema[view.groupBy]?.name || '') : ''} ▸</span></button>` +
      `<button data-a="farbe"><span class="mi">🎨</span>Bedingte Farbe` +
        `<span class="ms">${(view.farbregeln || []).length || ''} ▸</span></button>` +
      '<button data-a="vlink"><span class="mi">🔗</span>Link zur Ansicht kopieren</button>' +
      '<hr>' +
      '<div class="grp">Einstellungen zu Datenquellen</div>' +
      `<button data-a="quelle"><span class="mi">⛁</span>Quelle<span class="ms">${esc(coll.name)}` +
        `${(view.extraDbs || []).length ? ' +' + view.extraDbs.length : ''} ▸</span></button>` +
      '<button data-a="eigen"><span class="mi">☰</span>Eigenschaften bearbeiten<span class="ms">▸</span></button>' +
      '<button data-a="auto"><span class="mi">⚡</span>Automatisierungen<span class="ms">▸</span></button>' +
      '<button data-a="kiauto"><span class="mi">✨</span>KI-Autofill<span class="ms">▸</span></button>' +
      `<button data-a="archiv"><span class="mi">🗄</span>Archivierte Seiten` +
        `<span class="ms">${view.archivZeigen ? 'sichtbar' : 'versteckt'}</span></button>` +
      '<button data-a="mehr"><span class="mi">⋯</span>Weitere Einstellungen<span class="ms">▸</span></button>' +
      '<hr>' +
      '<button data-a="ganzeseite"><span class="mi">⤢</span>Als ganze Seite öffnen</button>' +
      '<hr>' +
      '<button data-a="qverwalten"><span class="mi">⛁</span>Datenquellen verwalten<span class="ms">▸</span></button>' +
      `<button data-a="dblock"><span class="mi">🔒</span>${coll.gesperrt ? 'Datenbank entsperren' : 'Datenbank sperren'}</button>` +
      '<hr>' +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren</button>' +
      '<button data-a="lock"><span class="mi">🔒</span>' + (view.locked ? 'Entsperren' : 'Ansicht sperren') + '</button>' +
      '<button data-a="del"><span class="mi">🗑</span>Ansicht löschen</button>',
      r.left, r.bottom + 4,
      { platzhalter: 'Einstellung suchen …', breite: '300px',
        titel: 'Einstellungen', kopf: kopfKarte });

    /* Der ⓘ-Knopf in der Kopfkarte */
    m.querySelector('[data-info]')?.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const t = await UI.frage('Beschreibung dieser Ansicht', view.beschreibung || '');
      if (t !== null) { Store.updateView(view.id, { beschreibung: t }); m.remove(); App.zeichneSeite(); }
    });

    /* Name der Ansicht direkt in der Kopfkarte ändern */
    const nf = m.querySelector('.av-name');
    if (nf) {
      const uebernehmen = () => {
        const n = nf.value.trim();
        if (n && n !== view.name) { Store.updateView(view.id, { name: n }); App.zeichneSeite(); }
      };
      nf.addEventListener('blur', uebernehmen);
      nf.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); uebernehmen(); m.remove(); }
        ev.stopPropagation();
      });
    }

    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      m.remove();
      const a2 = b.dataset.a;
      if (a2 === 'layout')   { layoutPanel(coll, view, block); return; }
      if (a2 === 'sichtbar') { eigenschaftenMenue(anker, coll, view, block); return; }
      if (a2 === 'filter')   { filterMenue(anker, coll, view, block); return; }
      if (a2 === 'sort')     { sortMenue(anker, coll, view, block); return; }
      if (a2 === 'gruppe')   { gruppierenMenue(anker, coll, view, block); return; }
      if (a2 === 'farbe')    { farbregelPanel(coll, view, block); return; }
      if (a2 === 'auto')     { automationenMenue(anker, coll, view, block); return; }
      if (a2 === 'eigen')    { eigenschaftenMenue(anker, coll, view, block); return; }
      if (a2 === 'kiauto')   { kiAutofillMenue(anker, coll, view); return; }
      if (a2 === 'quelle')   { m.remove(); quelleMenue(anker, coll, view, block); return; }
      if (a2 === 'mehr')     { weitereEinstellungen(anker, coll, view, block); return; }
      if (a2 === 'ganzeseite') { ganzeSeite(coll, view, block); return; }

      if (a2 === 'qverwalten') { quellenVerwalten(anker, coll, view, block); return; }
      if (a2 === 'archiv') {
        Store.updateView(view.id, { archivZeigen: !view.archivZeigen });
        App.zeichneSeite();
        UI.toast(view.archivZeigen ? 'Archivierte Seiten versteckt' : 'Archivierte Seiten sichtbar');
        return;
      }
      if (a2 === 'dblock') {
        Store.updateCollection(coll.id, { gesperrt: !coll.gesperrt });
        App.zeichneSeite();
        UI.toast(coll.gesperrt ? 'Datenbank entsperrt' : 'Datenbank gesperrt — Aufbau lässt sich nicht mehr ändern');
        return;
      }
      if (a2 === 'vlink') {
        const link = location.origin + location.pathname + '#' +
                     (block ? block.id : coll.id) + '/' + view.id;
        navigator.clipboard?.writeText(link);
        UI.toast('Link zur Ansicht kopiert');
        return;
      }
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

  /**
   * Legt eine Eigenschaft an. `stelle` sagt, an welcher Position sie im
   * Schema landen soll — Notion nennt das „Links einfügen" und
   * „Rechts einfügen". Ohne Angabe kommt sie ans Ende.
   */
  const eigenschaftAnlegen = async (coll, t, stelle = -1) => {
    const name = await UI.frage('Name der Eigenschaft', propTyp(t).name);
    if (!name) return null;
    const key = Store.uid().slice(0, 5);
    const def = { name, type: t };
    if (['select','status','multi'].includes(t)) def.options = [];
    if (t === 'formula') {
      const f = await UI.frage('Formel eingeben, z. B.  prop("Zahl") * 2', '');
      def.formula = f || '';
    }
    if (t === 'relation') {
      const andere = Object.values(Store.cache.collections);
      def.ziel = (andere.find(c => c.id !== coll.id) || andere[0] || {}).id || '';
    }
    if (t === 'rollup') def.rollup = 'Anzahl alle';
    if (KI_TYPEN.includes(t)) def.auftrag = KI_AUFTRAG[t] || KI_AUFTRAG.ki;
    if (t === 'button') def.knopfText = 'Ausführen';

    if (stelle < 0) {
      coll.schema[key] = def;
    } else {
      /* Reihenfolge der Schlüssel bestimmt die Spaltenfolge — also neu bauen */
      const keys = Object.keys(coll.schema);
      const neu = {};
      keys.slice(0, stelle).forEach(k => { neu[k] = coll.schema[k]; });
      neu[key] = def;
      keys.slice(stelle).forEach(k => { neu[k] = coll.schema[k]; });
      coll.schema = neu;
    }
    Store.updateCollection(coll.id, { schema: coll.schema });
    App.zeichneSeite();
    if (t === 'rollup') rollupEditor(coll, key);
    if (t === 'relation') relationEinrichten(coll, key);
    return key;
  };

  /** Typauswahl mit Suche — dieselbe Liste wie beim Ändern eines Typs. */
  const typWahl = (anker, titel, danach) => {
    const r = anker.getBoundingClientRect();
    const html = TYP_GRUPPEN.map(([name, ids]) =>
      `<div class="grp">${name}</div>` +
      '<div class="typ-gitter">' +
        ids.filter(id => TYPEN.some(x => x.id === id)).map(id => {
          const t = TYPEN.find(x => x.id === id);
          return `<button data-t="${t.id}"><span class="mi">${t.icon}</span>${esc(t.name)}</button>`;
        }).join('') +
      '</div>').join('');
    const m = UI.menuMitSuche(html, r.left, r.bottom + 4,
      { platzhalter: 'Typ auswählen …', breite: '340px', kopf: `<div class="grp">${esc(titel)}</div>` });
    m.addEventListener('click', e => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      m.remove();
      danach(b.dataset.t);
    });
    return m;
  };

  const neueEigenschaft = (anker, coll, block) =>
    typWahl(anker, 'Neue Eigenschaft', t => eigenschaftAnlegen(coll, t, -1));

  const neueEigenschaftBei = (anker, coll, view, stelle) =>
    typWahl(anker, stelle === 0 ? 'Links einfügen' : 'Neue Eigenschaft',
      t => eigenschaftAnlegen(coll, t, stelle));

  /* ------------------------------------------------------------------------
   * TYP-AUSWAHL
   * ------------------------------------------------------------------------
   * Wie in Notion: oben die KI-Felder als eigene Gruppe, darunter alle Typen
   * in zwei Spalten, mit Suchfeld. Bei über dreissig Typen findet man sonst
   * nichts mehr.
   * ----------------------------------------------------------------------*/
  const TYP_GRUPPEN = [
    ['KI-Autofill',  ['ki-fassung','ki-sprache','ki-worte','ki']],
    ['Basis',        ['text','number','select','multi','status','date','person',
                      'files','checkbox','url','email','phone','duration','place']],
    ['Rechnen',      ['formula','relation','rollup','uid','button','verify']],
    ['Automatisch',  ['created','edited','createdBy','editedBy']],
    ['Verbindungen', ['gdrive','figma','githubpr','zendesk']]
  ];

  const typMenue = (anker, coll, key) => {
    const def = coll.schema[key];
    const r = anker.getBoundingClientRect();

    const html = TYP_GRUPPEN.map(([name, ids]) =>
      `<div class="grp">${name}</div>` +
      '<div class="typ-gitter">' +
        ids.filter(id => TYPEN.some(t => t.id === id)).map(id => {
          const t = TYPEN.find(x => x.id === id);
          return `<button data-t="${t.id}" class="${def.type === t.id ? 'on' : ''}">` +
                 `<span class="mi">${t.icon}</span>${esc(t.name)}</button>`;
        }).join('') +
      '</div>').join('');

    const m = UI.menuMitSuche(html, r.left, r.bottom + 2, {
      platzhalter: 'Typ auswählen …',
      breite: '340px',
      fuss: 'Jetzt: <b>' + esc(propTyp(def.type).name) + '</b>'
    });

    m.addEventListener('click', ev => {
      const t = ev.target.closest('button[data-t]');
      if (!t) return;
      def.type = t.dataset.t;
      if (['select','status','multi'].includes(def.type) && !def.options) def.options = [];
      if (def.type === 'formula' && !def.formula) def.formula = '';
      if (KI_TYPEN.includes(def.type) && !def.auftrag) def.auftrag = KI_AUFTRAG[def.type];
      Store.updateCollection(coll.id, { schema: coll.schema });
      m.remove(); App.zeichneSeite();
      UI.toast('Typ geändert: ' + propTyp(def.type).name);
    });
  };

  const spaltenMenue = (anker, coll, view, key, block) => {
    /* Eine gesperrte Datenbank lässt ihren Aufbau nicht mehr ändern —
       Werte darf man weiter eintragen. Genau wie bei Notion. */
    if (coll.gesperrt) {
      UI.toast('Diese Datenbank ist gesperrt. Über das Ansichtsmenü lässt sie sich entsperren.');
      return;
    }
    const r = anker.getBoundingClientRect();
    const def = coll.schema[key];
    const keys = Object.keys(coll.schema);
    const idx = keys.indexOf(key);
    const umbruchAn = (view.umbruch || []).includes(key);

    const m = UI.menu(
      /* Kopf wie bei Notion: Symbol, Namensfeld, ⓘ für die Beschreibung */
      '<div class="sp-kopf">' +
        `<button class="sp-icon" data-a="icon" title="Symbol wählen">${def.icon || propTyp(def.type).icon}</button>` +
        `<input class="sp-name" value="${esc(def.name)}" spellcheck="false" placeholder="Eigenschaftsnamen eingeben …">` +
        '<button class="sp-info" data-a="beschreibung" title="Beschreibung">ⓘ</button>' +
      '</div>' +
      (def.beschreibung ? `<div class="sp-besch">${esc(def.beschreibung)}</div>` : '') +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="type"><span class="mi">⇄</span>Typ ändern<span class="ms">' +
        esc(propTyp(def.type).name) + '</span></button>' +
      (def.type === 'formula'  ? '<button data-a="formula"><span class="mi">∑</span>Formel bearbeiten</button>' : '') +
      (['select','status','multi'].includes(def.type)
        ? '<button data-a="optionen"><span class="mi">⊙</span>Optionen bearbeiten</button>' : '') +
      (def.type === 'relation' ? '<button data-a="relein"><span class="mi">⇄</span>Verknüpfung einrichten</button>' : '') +
      (def.type === 'rollup'   ? '<button data-a="rollup"><span class="mi">⤴</span>Rollup einrichten</button>' : '') +
      (['number','formula','rollup'].includes(def.type)
        ? '<button data-a="anzeige"><span class="mi">▤</span>Anzeigen als …</button>' : '') +
      (def.type === 'uid'      ? '<button data-a="praefix"><span class="mi">ID</span>Vorsilbe setzen</button>' : '') +
      (KI_TYPEN.includes(def.type) ? '<button data-a="kiauftrag"><span class="mi">✨</span>Auftrag an die KI</button>' : '') +
      '<hr>' +
      '<button data-a="asc"><span class="mi">↑</span>Aufsteigend sortieren</button>' +
      '<button data-a="desc"><span class="mi">↓</span>Absteigend sortieren</button>' +
      '<button data-a="filter"><span class="mi">⚟</span>Nach dieser Spalte filtern</button>' +
      `<button data-a="gruppe"><span class="mi">⊞</span>Gruppe` +
        `<span class="ms">${view.groupBy === key ? 'an' : 'aus'}</span></button>` +
      '<button data-a="berechnen"><span class="mi">Σ</span>Berechnen' +
        `<span class="ms">${esc(((view.calc || {})[key]) || '—')} ▸</span></button>` +
      '<hr>' +
      `<button data-a="umbruch"><span class="mi">↵</span>Text umbrechen<span class="ms">${umbruchAn ? 'an' : 'aus'}</span></button>` +
      `<button data-a="fix"><span class="mi">📌</span>Spalte fixieren` +
        `<span class="ms">${(view.fixiert || []).includes(key) ? 'an' : 'aus'}</span></button>` +
      '<button data-a="links"><span class="mi">←</span>Nach links</button>' +
      '<button data-a="rechts"><span class="mi">→</span>Nach rechts</button>' +
      '<button data-a="hide"><span class="mi">👁</span>In dieser Ansicht ausblenden</button>' +
      '<hr>' +
      '<button data-a="neulinks"><span class="mi">⇤</span>Links einfügen</button>' +
      '<button data-a="neurechts"><span class="mi">⇥</span>Rechts einfügen</button>' +
      (def.type !== 'title'
        ? '<hr><button data-a="dup"><span class="mi">⧉</span>Eigenschaft duplizieren</button>' +
          '<button data-a="del"><span class="mi">🗑</span>Eigenschaft löschen</button>'
        : ''),
      r.left, r.bottom + 2);

    /* Der Name lässt sich direkt oben im Menü ändern — wie bei Notion. */
    const nameFeld = m.querySelector('.sp-name');
    if (nameFeld) {
      const uebernehmen = () => {
        const n = nameFeld.value.trim();
        if (!n || n === def.name) return;
        def.name = n;
        Store.updateCollection(coll.id, { schema: coll.schema });
        App.zeichneSeite();
      };
      nameFeld.addEventListener('blur', uebernehmen);
      nameFeld.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); uebernehmen(); m.remove(); }
        if (ev.key === 'Escape') { ev.preventDefault(); m.remove(); }
        ev.stopPropagation();
      });
      setTimeout(() => { nameFeld.focus(); nameFeld.select(); }, 30);
    }

    m.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      if (a === 'type') {
        m.remove();
        typMenue(anker, coll, key);
        return;
      }

      /* Eigenes Symbol für die Spalte */
      if (a === 'icon') {
        UI.emojiWaehlen(b, (em) => {
          def.icon = em;
          Store.updateCollection(coll.id, { schema: coll.schema });
          m.remove(); App.zeichneSeite();
        });
        return;
      }

      /* Gruppieren nach genau dieser Spalte — an oder aus */
      if (a === 'gruppe') {
        m.remove();
        const anJetzt = view.groupBy === key;
        Store.updateView(view.id, { groupBy: anJetzt ? '' : key });
        App.zeichneSeite();
        UI.toast(anJetzt ? 'Gruppierung aufgehoben' : 'Gruppiert nach ' + def.name);
        return;
      }

      /* Fussrechnung für diese Spalte */
      if (a === 'berechnen') {
        m.remove();
        rechnenMenue(anker, coll, view, key, Store.rowsOf(coll.id));
        return;
      }

      /* Neue Eigenschaft links oder rechts daneben */
      if (a === 'neulinks' || a === 'neurechts') {
        m.remove();
        const stelle = idx + (a === 'neurechts' ? 1 : 0);
        neueEigenschaftBei(anker, coll, view, stelle);
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
      `<button data-a="leere"><span class="mi">␀</span>Leere Gruppen<span class="ms">${view.leereGruppen === false ? 'aus' : 'zeigen'}</span></button>` +
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
        Store.updateView(view.id, { leereGruppen: view.leereGruppen === false });
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
          <br>Durch eine Verknüpfung lesen: <code>map(prop("Aufgaben"), current.prop("Kosten")).sum()</code>
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
          if (!k) return null;
          if (coll.schema[k].type === 'relation') return seitenListe(wert(erste, k, coll));
          return wert(erste, k, coll);
        }, fremdWert);
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
  /** Platzhalter in Vorlagen: heute, morgen, jetzt, {datum} … */
  const platzhalter = (v) => {
    if (typeof v !== 'string') return v;
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    const iso = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    if (v === 'heute')  return iso;
    if (v === 'jetzt')  return iso + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    if (v === 'morgen') { const t = new Date(d); t.setDate(t.getDate() + 1);
      return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()); }
    return v
      .replace(/\{datum\}/g, d.toLocaleDateString('de-DE'))
      .replace(/\{tag\}/g,   d.toLocaleDateString('de-DE', { weekday: 'long' }))
      .replace(/\{monat\}/g, d.toLocaleDateString('de-DE', { month: 'long' }))
      .replace(/\{jahr\}/g,  String(d.getFullYear()))
      .replace(/\{woche\}/g, 'KW ' + kalenderwoche(d));
  };

  const kalenderwoche = (d) => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const jahresstart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - jahresstart) / 86400000 + 1) / 7);
  };

  /** Einen Eintrag aus einer Vorlage anlegen — auch die Unterseiten kommen mit. */
  const ausVorlage = (coll, v) => {
    const props = JSON.parse(JSON.stringify(v.props || {}));
    Object.keys(props).forEach(k => { props[k] = platzhalter(props[k]); });
    const z = Store.addRow(coll.id, props);
    Store.updateBlock(z.id, { text: platzhalter(v.titel || v.name) });
    (v.inhalt || []).forEach(k => Store.baumEinfuegen(k, z.id));
    return z;
  };

  const vorlagenMenue = (anker, coll, view) => {
    const liste = coll.vorlagen || [];
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Neuer Eintrag mit Vorlage</div>' +
      (liste.length
        ? liste.map((v, i) =>
            `<button data-v="${i}"><span class="mi">${esc(v.icon || '🧩')}</span>${esc(v.name)}` +
            (v.wdh && v.wdh.art ? '<span class="ms" style="right:52px" title="wiederholt sich">🔁</span>' : '') +
            `<span class="ms" style="right:28px" data-vwdh="${i}" title="Wiederholung">⏱</span>` +
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
      const wdh = e.target.closest('[data-vwdh]');
      if (wdh) { m.remove(); wiederholungEinstellen(coll, +wdh.dataset.vwdh); return; }

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
      ausVorlage(coll, v);
      App.zeichneSeite();
      UI.toast('Eintrag aus Vorlage angelegt');
    });
  };

  /* ------------------------------------------------------------------------
   * Wiederkehrende Vorlagen — Notions „Repeat" an einer Datenbankvorlage.
   * Die Vorlage legt sich in einem festen Takt selbst an. Geprüft wird beim
   * Start und danach stündlich; jede Periode kommt höchstens einmal dran.
   * ----------------------------------------------------------------------*/
  const WDH_ARTEN = [
    ['',             'Nicht wiederholen'],
    ['taeglich',     'Jeden Tag'],
    ['wochentags',   'Montag bis Freitag'],
    ['woechentlich', 'Jede Woche'],
    ['monatlich',    'Jeden Monat'],
    ['jaehrlich',    'Jedes Jahr']
  ];
  const WOCHENTAGE = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

  const wdhPeriode = (art, d) => {
    const p = (n) => String(n).padStart(2, '0');
    if (art === 'jaehrlich')    return String(d.getFullYear());
    if (art === 'monatlich')    return d.getFullYear() + '-' + p(d.getMonth() + 1);
    if (art === 'woechentlich') return d.getFullYear() + '-KW' + p(kalenderwoche(d));
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  const wiederholungEinstellen = (coll, i) => {
    const v = (coll.vorlagen || [])[i];
    if (!v) return;
    const w = v.wdh || {};
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(460px,94vw)">' +
        `<div class="fh">🔁 Wiederholung — ${esc(v.name)}` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:13px">' +
          '<label>Takt<br><select id="wa">' +
            WDH_ARTEN.map(([id, n]) =>
              `<option value="${id}"${(w.art || '') === id ? ' selected' : ''}>${n}</option>`).join('') +
          '</select></label>' +
          '<label id="wtl">Wochentag<br><select id="wt">' +
            WOCHENTAGE.map((n, k) =>
              `<option value="${k}"${String(w.tag) === String(k) ? ' selected' : ''}>${n}</option>`).join('') +
          '</select></label>' +
          '<label id="wml">Tag im Monat<br><input id="wm" type="number" min="1" max="28" ' +
            `value="${w.tag != null ? esc(String(w.tag)) : 1}"></label>` +
          '<label>Ab welcher Uhrzeit<br><input id="ws" type="number" min="0" max="23" ' +
            `value="${w.stunde != null ? esc(String(w.stunde)) : 6}"></label>` +
          '<div style="font-size:13px;color:var(--text-faint);line-height:1.5">' +
            'Im Titel und in Textfeldern der Vorlage funktionieren <b>{datum}</b>, <b>{tag}</b>, ' +
            '<b>{woche}</b>, <b>{monat}</b> und <b>{jahr}</b>. In Datumsfeldern ' +
            '<b>heute</b>, <b>morgen</b> und <b>jetzt</b>.<br>' +
            'Geprüft wird, während die App offen ist — verpasste Tage werden beim nächsten ' +
            'Öffnen nachgeholt.</div>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Sichern</button>' +
          '<button data-a="jetzt">Einmal jetzt anlegen</button>' +
          '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const auffrischen = () => {
      const a = o.querySelector('#wa').value;
      o.querySelector('#wtl').style.display = a === 'woechentlich' ? '' : 'none';
      o.querySelector('#wml').style.display = a === 'monatlich' ? '' : 'none';
    };
    auffrischen();
    o.querySelector('#wa').addEventListener('change', auffrischen);

    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('[data-a="zu"]')) { o.remove(); return; }
      if (e.target.closest('[data-a="jetzt"]')) {
        ausVorlage(coll, v); o.remove(); App.zeichneSeite();
        UI.toast('Eintrag aus Vorlage angelegt'); return;
      }
      if (!e.target.closest('[data-a="ok"]')) return;
      const art = o.querySelector('#wa').value;
      if (!art) { delete v.wdh; }
      else {
        v.wdh = {
          art,
          tag: art === 'woechentlich' ? +o.querySelector('#wt').value
             : art === 'monatlich'    ? +o.querySelector('#wm').value : null,
          stunde: +o.querySelector('#ws').value || 0,
          zuletzt: (v.wdh || {}).zuletzt || null
        };
      }
      Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
      o.remove();
      UI.toast(art ? 'Wiederholung eingestellt' : 'Wiederholung ausgeschaltet');
    });
  };

  const vorlagenLaufen = () => {
    const jetzt = new Date();
    Object.values(Store.cache.collections).forEach(coll => {
      let geaendert = false;
      (coll.vorlagen || []).forEach(v => {
        const w = v.wdh;
        if (!w || !w.art) return;
        if (jetzt.getHours() < (w.stunde || 0)) return;
        if (w.art === 'wochentags' && (jetzt.getDay() === 0 || jetzt.getDay() === 6)) return;
        if (w.art === 'woechentlich' && w.tag != null && jetzt.getDay() !== +w.tag) return;
        if (w.art === 'monatlich' && w.tag && jetzt.getDate() !== +w.tag) return;
        const p = wdhPeriode(w.art, jetzt);
        if (w.zuletzt === p) return;
        w.zuletzt = p;
        geaendert = true;
        ausVorlage(coll, v);
      });
      if (geaendert) {
        Store.updateCollection(coll.id, { vorlagen: coll.vorlagen });
        UI.toast('🔁 Wiederkehrender Eintrag angelegt');
      }
    });
  };

  /* ========================================================================
   * AUTOMATIONEN
   * ------------------------------------------------------------------------
   * Notions Datenbank-Automationen: „Wenn etwas passiert, dann tu das."
   * Hier läuft alles im Browser — kein Dienst, keine Wartezeit.
   * ======================================================================*/
  const AUSLOESER = [
    ['zeile-neu',       'Ein Eintrag wird angelegt'],
    ['prop-geaendert',  'Eine Eigenschaft ändert sich'],
    ['prop-wert',       'Eine Eigenschaft bekommt einen bestimmten Wert'],
    ['zeile-geaendert', 'Ein Eintrag wird bearbeitet — egal welches Feld'],
    ['zeile-weg',       'Ein Eintrag verschwindet aus der Datenbank'],
    ['formular-neu',    'Über das Formular kommt eine Antwort'],
    ['zeit-vor',        'Einige Tage vor einem Datum'],
    ['zeit-nach',       'Einige Tage nach einem Datum']
  ];
  /* Diese Auslöser hängen an keiner einzelnen Spalte. */
  const OHNE_SPALTE = ['zeile-neu', 'zeile-geaendert', 'zeile-weg', 'formular-neu'];
  const AKTIONEN = [
    ['setze-prop',   'Eigenschaft setzen'],
    ['ki-fuellen',   'KI-Feld ausfüllen lassen'],
    ['erinnerung',   'Erinnerung anlegen'],
    ['unterseite',   'Unterseite im Eintrag anlegen'],
    ['zaehler',      'Zähler um eins erhöhen'],
    ['wiederholen',  'Nächsten Termin dieser Aufgabe anlegen'],
    ['fremd-setzen', 'Einträge einer anderen Datenbank ändern'],
    ['webhook',      'An eine Webadresse schicken'],
    ['melden',       'Kurze Meldung zeigen']
  ];

  /** „1 Woche", „3 Tage", „monatlich", „14" — alles wird zu einem Datumssprung. */
  const naechstesDatum = (basis, takt) => {
    const d = new Date(basis);
    if (isNaN(d)) return null;
    const t = String(takt || '1 Woche').toLowerCase();
    const n = parseInt(t.replace(/[^0-9]/g, ''), 10) || 1;
    /* Der 31. plus ein Monat ist der 30. — nicht der 1. des übernächsten. */
    const monateDazu = (anzahl) => {
      const tagImMonat = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + anzahl);
      const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(tagImMonat, letzter));
    };
    if (/jahr/.test(t))       monateDazu(12 * n);
    else if (/monat/.test(t)) monateDazu(n);
    else if (/woche/.test(t)) d.setDate(d.getDate() + 7 * n);
    else if (/werktag/.test(t)) {
      let offen = n;
      while (offen > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) offen--; }
    }
    else d.setDate(d.getDate() + n);
    const p = (x) => String(x).padStart(2, '0');
    const kurz = String(basis).length <= 10;
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
           (kurz ? '' : 'T' + p(d.getHours()) + ':' + p(d.getMinutes()));
  };

  let imLauf = false;   /* verhindert, dass Automationen sich gegenseitig auslösen */
  let wdhZaehler = 0;   /* Notbremse gegen Ketten, die sich selbst nachlegen */

  /**
   * Einträge einer anderen Datenbank ändern — Notions „Edit pages in".
   * Wahlweise alle, die durch den Filter einer Ansicht kommen, oder alle,
   * die einer Regel entsprechen. Höchstens 500 auf einmal.
   */
  const fremdSetzen = (d, row, coll) => {
    const ziel = Store.getCollection(d.ziel);
    if (!ziel) { UI.toast('Die Zieldatenbank gibt es nicht mehr'); return 0; }
    let zeilen = Store.rowsOf(ziel.id);

    if (d.ansicht) {
      const v = Store.getView(d.ansicht);
      if (v) zeilen = zeilen.filter(z => gruppeTrifftZu(z, v.filters, ziel));
    }
    if (d.filterKey && ziel.schema[d.filterKey]) {
      zeilen = zeilen.filter(z => trifftZu(z, {
        key: d.filterKey,
        op: d.filterOp || (OPERATOREN[ziel.schema[d.filterKey].type] || OPERATOREN.text)[0],
        wert: d.filterWert
      }, ziel));
    }
    if (d.nurVerknuepft && row) {
      const rel = Object.keys(ziel.schema).find(k =>
        ziel.schema[k].type === 'relation' && ziel.schema[k].collectionId === (coll || {}).id);
      if (rel) zeilen = zeilen.filter(z => (z.props?.[rel] || []).includes(row.id));
    }

    zeilen = zeilen.slice(0, 500);
    if (!ziel.schema[d.zielKey]) { UI.toast('Die Zieleigenschaft gibt es nicht mehr'); return 0; }

    zeilen.forEach(z => {
      let v = platzhalter(d.wert ?? '');
      if (v === '{titel}')  v = (row && row.text) || '';
      if (v === '{leer}')   v = '';
      if (ziel.schema[d.zielKey].type === 'checkbox') v = v === 'true' || v === 'ja' || v === true;
      if (ziel.schema[d.zielKey].type === 'number')   v = Formula.zahl(v);
      Store.setProp(z.id, d.zielKey, v);
    });
    return zeilen.length;
  };

  const automationenLaufen = (row, coll, art, key, neuerWert) => {
    if (imLauf || !coll || !(coll.automationen || []).length) return;
    imLauf = true;
    try {
      coll.automationen.forEach(a => {
        if (a.an === false) return;
        const w = a.wenn || {};
        if (w.art !== art) return;
        if (!OHNE_SPALTE.includes(w.art) && w.key && w.key !== key) return;
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
          /* Wiederkehrende Aufgabe: der erledigte Eintrag bleibt stehen,
             daneben entsteht der nächste Termin. */
          if (d.art === 'wiederholen') {
            if (wdhZaehler++ > 30) { UI.toast('Wiederholung gestoppt — zu viele auf einmal'); return; }
            const dk = d.key || Object.keys(coll.schema).find(k2 => coll.schema[k2].type === 'date');
            const alt = dk ? String(wert(row, dk, coll) || '') : '';
            const neuDatum = naechstesDatum(alt || new Date().toISOString().slice(0, 10), d.text);
            if (!neuDatum) { UI.toast('Kein Datum zum Weiterzählen gefunden'); return; }
            const props = JSON.parse(JSON.stringify(row.props || {}));
            if (dk) props[dk] = neuDatum;
            /* Das Feld, das die Automation ausgelöst hat, wird zurückgesetzt —
               sonst wäre der neue Eintrag sofort wieder erledigt. */
            if (key && coll.schema[key]) {
              props[key] = coll.schema[key].type === 'checkbox' ? false : '';
            }
            Object.keys(props).forEach(k2 => {
              const typ = coll.schema[k2] && coll.schema[k2].type;
              if (typ === 'formula' || typ === 'rollup' || typ === 'created' || typ === 'edited') delete props[k2];
            });
            const neu3 = Store.addRow(coll.id, props);
            Store.updateBlock(neu3.id, { text: row.text || '' });
            UI.toast('🔁 Nächster Termin: ' + neuDatum.slice(0, 10));
          }
          /* Einträge einer anderen Datenbank ändern — Notions „Edit pages in". */
          if (d.art === 'fremd-setzen' && d.ziel) {
            const n = fremdSetzen(d, row, coll);
            if (n) UI.toast(n + (n === 1 ? ' Eintrag geändert' : ' Einträge geändert'));
          }
          if (d.art === 'melden') {
            UI.toast('⚡ ' + (d.text || a.name || 'Automation ausgeführt'));
          }
          if (d.art === 'webhook') {
            const url = d.text || Store.getMeta('api:webhook', '');
            if (!url) { UI.toast('Keine Webhook-Adresse hinterlegt'); return; }
            const paket = { datenbank: coll.name, eintrag: row.text || '', zeit: Store.now(), werte: {} };
            Object.keys(coll.schema).forEach(k2 => {
              paket.werte[coll.schema[k2].name] = Formula.anzeige(wert(row, k2, coll));
            });
            KI.holen(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(paket) },
                     { versuche: 3, beiWartezeit: (sek, nr) =>
                         UI.toast('Webhook meldet sich nicht — Versuch ' + (nr + 1) + ' in ' + sek + ' s') })
              .then(() => UI.toast('An den Webhook geschickt'))
              .catch(err => UI.banner('Webhook nicht erreicht: ' + err.message +
                                      ' — viele Dienste erlauben keinen Zugriff direkt aus dem Browser.', 'warn'));
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
    setTimeout(vorlagenLaufen, 5000);
    setInterval(vorlagenLaufen, 1800000);
    setInterval(() => { wdhZaehler = 0; }, 3000);

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
        automationenLaufen(r, c, 'zeile-geaendert', key, value);
      }, 0);
      return erg;
    };

    /* Wird ein Eintrag weggeworfen, feuert das noch, solange es ihn gibt. */
    const altTrash = Store.trashBlock;
    Store.trashBlock = function (id) {
      const r = Store.getBlock(id);
      if (r && r.parentTable === 'collection') {
        const c = Store.getCollection(r.parentId);
        if (c) { try { automationenLaufen(r, c, 'zeile-weg'); } catch (e) {} }
      }
      return altTrash.call(Store, id);
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
          '<div id="afz" style="display:none; border:1px solid var(--line); border-radius:6px; ' +
               'padding:12px; display:none; flex-direction:column; gap:11px">' +
            '<label>In welcher Datenbank<br><select id="afd">' +
              Object.values(Store.cache.collections)
                .map(c => `<option value="${c.id}">${esc(c.name || 'Ohne Namen')}</option>`).join('') +
            '</select></label>' +
            '<label>Diese Eigenschaft setzen<br><select id="afk"></select></label>' +
            '<label>… auf diesen Wert<br><input id="afv" placeholder="Wert · {titel} · {leer} · heute"></label>' +
            '<label>Nur bei Einträgen, wo …<br>' +
              '<select id="aff"><option value="">alle Einträge</option></select> ' +
              '<input id="affv" placeholder="Wert" style="margin-top:5px"></label>' +
            '<label style="display:flex;gap:8px;align-items:center;font-size:13px">' +
              '<input type="checkbox" id="afr"> nur Einträge, die mit diesem hier verknüpft sind</label>' +
          '</div>' +
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
      /* Auslöser, die an keiner Spalte hängen, brauchen auch keine Auswahl */
      o.querySelector('#ak').closest('label').style.display =
        OHNE_SPALTE.includes(art0) ? 'none' : '';
      const d = o.querySelector('#ad').value;
      o.querySelector('#adk').style.display =
        ['setze-prop','ki-fuellen','zaehler','wiederholen'].includes(d) ? '' : 'none';
      o.querySelector('#adk').firstChild.textContent =
        d === 'wiederholen' ? '… welches Datum weitergezählt wird' : '… diese Eigenschaft';
      o.querySelector('#adw').style.display =
        ['setze-prop','erinnerung','unterseite','melden','webhook','wiederholen'].includes(d) ? '' : 'none';
      o.querySelector('#adv').placeholder =
        d === 'erinnerung'  ? 'in wie vielen Tagen? z. B. 3'
        : d === 'melden'    ? 'Text der Meldung'
        : d === 'webhook'   ? 'Adresse — leer nimmt die aus den Einstellungen'
        : d === 'wiederholen' ? 'Takt: 1 Woche · 3 Tage · 1 Monat · 5 Werktage'
        : 'Wert';
      o.querySelector('#afz').style.display = d === 'fremd-setzen' ? 'flex' : 'none';
    };

    /* Die Auswahl der Zieleigenschaften hängt an der gewählten Datenbank. */
    const zielFelder = () => {
      const z = Store.getCollection(o.querySelector('#afd').value);
      const ks = z ? Object.keys(z.schema) : [];
      o.querySelector('#afk').innerHTML =
        ks.map(k => `<option value="${k}">${esc(z.schema[k].name)}</option>`).join('');
      o.querySelector('#aff').innerHTML = '<option value="">alle Einträge</option>' +
        ks.map(k => `<option value="${k}">${esc(z.schema[k].name)} …</option>`).join('');
    };
    if (o.querySelector('#afd').options.length) zielFelder();
    o.querySelector('#afd').addEventListener('change', zielFelder);

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
      if (['setze-prop','ki-fuellen','zaehler','wiederholen'].includes(d)) dann.key = o.querySelector('#adk2').value;
      const wertFeld = o.querySelector('#adv').value;
      if (d === 'setze-prop') dann.wert = wertFeld === 'heute' ? new Date().toISOString().slice(0, 10) : wertFeld;
      if (d === 'erinnerung') dann.tage = wertFeld;
      if (d === 'unterseite' || d === 'melden' || d === 'webhook' || d === 'wiederholen') dann.text = wertFeld;
      if (d === 'fremd-setzen') {
        const zc = Store.getCollection(o.querySelector('#afd').value);
        dann.ziel    = o.querySelector('#afd').value;
        dann.zielKey = o.querySelector('#afk').value;
        dann.wert    = o.querySelector('#afv').value;
        dann.filterKey  = o.querySelector('#aff').value || null;
        dann.filterWert = o.querySelector('#affv').value;
        if (dann.filterKey && zc) {
          const typ = zc.schema[dann.filterKey].type;
          dann.filterOp = (OPERATOREN[typ] || OPERATOREN.text)[0];
        }
        dann.nurVerknuepft = o.querySelector('#afr').checked;
      }

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
           ortSuchen, alsKarte, fremdSetzen, vorlagenLaufen, naechstesDatum, platzhalter,
           rechne, zusammenfassen, dauerText, dauerLesen, RECHNUNGEN, KI_TYPEN, AUSLOESER, AKTIONEN,
           typMenue, TYP_GRUPPEN, alsDashboard, zeilenGesamt, begrenzen, layoutPanel, farbregelPanel, farbeFuerZeile,
           farbregeln, gruppierenMenue, kiAutofillMenue, LAYOUTS, leiste,
           kiFeldFuellenFuer: kiFeldFuellen,
           formelEditor, csvExport, csvImport, csvZerlegen,
           zeilePeek, zeilenMenue, rollupWert,
           unterElementeAn, abhaengigkeitenAn, blockiertDurch, UNTER_KEYS, ABH_KEYS,
           weitereEinstellungen, quellenVerwalten, seitenLayoutPanel };
})();
