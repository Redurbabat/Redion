/* ============================================================================
 * bereiche/datenbanken/dienst.js — was eine Datenbank rechnet, ohne sie zu zeigen
 * ----------------------------------------------------------------------------
 * Die Eigenschaftstypen, das Lesen eines Wertes, Filtern, Sortieren,
 * Gruppieren und die Berechnungen unter einer Spalte. 930 Zeilen, die vorher
 * am Anfang von `steuerung.js` standen — zwischen 7700 Zeilen Oberfläche.
 *
 * DER PUNKT DIESER DATEI IST, WAS SIE NICHT TUT: sie fasst das Dokument nicht
 * an. Kein `document`, kein `createElement`, kein `innerHTML`. Damit lässt
 * sie sich in Node laden und prüfen, ohne einen Browser zu starten — und ein
 * Prüflauf, der in achtzig Millisekunden fertig ist statt in zwölf Sekunden,
 * wird auch wirklich gelaufen.
 *
 * DASS DAS GING, WAR NICHT SELBSTVERSTÄNDLICH, und es wurde nachgerechnet
 * statt gehofft: über alle Namen gezählt braucht dieser Teil **nichts** aus
 * dem Rest der Datei, während der Rest sechzehn Namen von hier holt. Die
 * Abhängigkeit läuft nur in eine Richtung. Wäre es andersherum auch nur an
 * einer Stelle gewesen, hätte man die beiden nicht trennen können, ohne
 * Verhalten zu ändern.
 *
 * DREI DINGE, DIE DAFÜR NÖTIG WAREN:
 *
 * 1. `esc` kam aus `Blocks` — einem Modul, das zeichnet. Eine Datei, die
 *    nichts zeigen will, soll nicht am Editor hängen; die zwei Zeilen stehen
 *    jetzt hier. Wortgleich, damit sich nichts an der Ausgabe ändert.
 *
 * 2. `window.Tempo` wurde zu `typeof Tempo !== 'undefined'`. Das ist keine
 *    Geschmacksfrage: CLAUDE.md schreibt es vor, weil die Module dieser App
 *    gewöhnliche `const` auf oberster Ebene sind und nicht an `window`
 *    hängen. Und ohne `window` gibt es in Node kein Laden.
 *
 * 3. Am Ende hängt sich die Datei nur dann an `window`, wenn es eines gibt.
 *
 * WAS SIE WEITERHIN BRAUCHT, und das ist in Ordnung: `Store` für die Zeilen,
 * `Register` für die Typenliste, `Formula` zum Rechnen, `Datum` für Daten,
 * `Tempo` für den Formelspeicher. Alles Module ohne Oberfläche — ein Prüflauf
 * kann sie laden oder eine Attrappe hinstellen.
 * ==========================================================================*/

const DatenbankDienst = (() => {

  /* Wortgleich mit `Blocks.esc`. Die Verdopplung ist der Preis dafür, dass
     diese Datei den Editor nicht kennt — zwei Zeilen gegen eine Abhängigkeit. */
  const esc = (s) => String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  /* ========================================================================
   * DIE EIGENSCHAFTSTYPEN
   * ======================================================================*/
  /* Die Liste steht in register/eigenschaften.js. */
  const TYPEN = Register.eigenschaften.alle();

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
    /* Notion behandelt URL, E-Mail und Telefon genau wie Text — mit allen
       acht Bedingungen. Beleg: Notion-API-Referenz „Filter data source
       entries", Rich-Text-Filter. */
    url:      ['enthält','enthält nicht','ist','ist nicht','beginnt mit','endet mit','ist leer','ist nicht leer'],
    email:    ['enthält','enthält nicht','ist','ist nicht','beginnt mit','endet mit','ist leer','ist nicht leer'],
    phone:    ['enthält','enthält nicht','ist','ist nicht','beginnt mit','endet mit','ist leer','ist nicht leer'],
    number:   ['ist gleich','ist nicht gleich','größer als','kleiner als','größer oder gleich','kleiner oder gleich','ist leer','ist nicht leer'],
    select:   ['ist','ist nicht','ist leer','ist nicht leer'],
    status:   ['ist','ist nicht','ist leer','ist nicht leer'],
    multi:    ['enthält','enthält nicht','ist leer','ist nicht leer'],
    person:   ['enthält','enthält nicht','ist leer','ist nicht leer'],
    date:     ['ist','ist vor','ist nach','ist am oder vor','ist am oder nach','ist heute','ist gestern','ist morgen',
               'ist diese Woche','ist letzte Woche','ist nächste Woche',
               'ist dieser Monat','ist letzter Monat','ist nächster Monat',
               'ist dieses Jahr','ist letztes Jahr','ist nächstes Jahr',
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
    /* Notion filtert Rollups auf zwei Weisen: über den zusammengefassten Wert
       und — bei Listen — über jedes einzelne Element mit any/every/none.
       Beides steht hier. */
    rollup:   ['ist gleich','ist nicht gleich','größer als','kleiner als','größer oder gleich','kleiner oder gleich',
               'enthält','enthält nicht','ist vor','ist nach','ist leer','ist nicht leer',
               'irgendeiner ist','irgendeiner enthält','irgendeiner ist grösser','irgendeiner ist kleiner',
               'irgendeiner ist leer','alle sind','alle enthalten','keiner ist','keiner enthält'],
    /* Die laufende Nummer ist eine Zahl und filtert wie eine. Notion nennt
       für ID keine Leer-Bedingungen — die Nummer ist ja nie leer. */
    uid:      ['ist gleich','ist nicht gleich','größer als','kleiner als','größer oder gleich','kleiner oder gleich'],
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

  /* Läuft gerade eine Spaltenabfrage? Schützt vor Formeln, die sich selbst
     über runningSum() oder rank() aufrufen würden. */
  const spaltenLauf = new Set();

  /* ========================================================================
   * PRÜFREGELN — was Notion nicht hat
   * ------------------------------------------------------------------------
   * Notion lässt jeden Wert zu: leere Pflichtfelder, doppelte Rechnungs-
   * nummern, kaputte E-Mail-Adressen. Das ist die meistgenannte Lücke gleich
   * nach Pivot. Hier bekommt jede Spalte Regeln, und ein falscher Wert wird
   * gar nicht erst geschrieben — mit einer Erklärung, warum.
   *
   * Regeln je Spalte (alle freiwillig):
   *   pflicht     – darf nicht leer sein
   *   eindeutig   – darf in dieser Datenbank nur einmal vorkommen
   *   muster      – regulärer Ausdruck, dem der Text entsprechen muss
   *   min / max   – Zahlenbereich
   *   regel       – eine Formel, die wahr ergeben muss
   *   regelText   – was dem Menschen gesagt wird, wenn sie nicht zutrifft
   * ======================================================================*/
  const MUSTER_VORLAGEN = [
    ['', 'Kein Muster'],
    ['^[^@\\s]+@[^@\\s]+\\.[A-Za-z]{2,}$', 'E-Mail-Adresse'],
    ['^\\+?[0-9 ()/-]{6,}$',               'Telefonnummer'],
    ['^https?://\\S+$',                    'Webadresse'],
    ['^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$',  'IBAN'],
    ['^[0-9]{4}$',                         'Vierstellige Zahl'],
    ['^[A-Z]{2,4}-[0-9]{1,6}$',            'Kennzeichen wie RE-1234']
  ];

  /** Hat diese Spalte überhaupt Regeln? */
  const hatRegeln = (def) => !!(def && (def.pflicht || def.eindeutig || def.muster ||
    (def.uebergaenge && Object.keys(def.uebergaenge).length) ||
    (def.regelMin !== undefined && def.regelMin !== '') ||
    (def.regelMax !== undefined && def.regelMax !== '') || def.regel));

  /**
   * Prüft einen Wert gegen die Regeln seiner Spalte.
   * @returns {{ok:boolean, fehler?:string}}
   */
  const pruefeWert = (coll, key, row, neuerWert) => {
    const def = coll && coll.schema && coll.schema[key];
    if (!def || !hatRegeln(def)) return { ok: true };
    const name = def.name || 'Diese Spalte';
    const leer = neuerWert === null || neuerWert === undefined || neuerWert === '' ||
                 (Array.isArray(neuerWert) && !neuerWert.length);

    if (def.pflicht && leer)
      return { ok: false, fehler: `„${name}" darf nicht leer bleiben.` };

    if (!leer && def.eindeutig) {
      const meiner = String(neuerWert).trim().toLowerCase();
      const doppelt = Store.rowsOf(coll.id).some(r =>
        r.id !== (row && row.id) &&
        String((r.props || {})[key] ?? '').trim().toLowerCase() === meiner);
      if (doppelt) return { ok: false, fehler: `„${neuerWert}" gibt es in „${name}" schon.` };
    }

    if (!leer && def.muster) {
      try {
        if (!new RegExp(def.muster).test(String(neuerWert)))
          return { ok: false, fehler: def.musterText ||
            `„${neuerWert}" passt nicht zum Muster von „${name}".` };
      } catch { /* kaputtes Muster blockiert nichts */ }
    }

    if (!leer && (def.type === 'number' || def.type === 'duration')) {
      const z = Number(neuerWert);
      if (isFinite(z)) {
        if (def.regelMin !== undefined && def.regelMin !== '' && z < Number(def.regelMin))
          return { ok: false, fehler: `„${name}" darf nicht kleiner als ${def.regelMin} sein.` };
        if (def.regelMax !== undefined && def.regelMax !== '' && z > Number(def.regelMax))
          return { ok: false, fehler: `„${name}" darf nicht grösser als ${def.regelMax} sein.` };
      }
    }

    /* Statusübergänge: von welchem Wert darf man zu welchem?
       Notion lässt jeden Sprung zu — hier steht in „uebergaenge" je Wert,
       welche Nachfolger erlaubt sind. Ein leerer Eintrag heisst: alles. */
    if (!leer && def.uebergaenge && (def.type === 'status' || def.type === 'select')) {
      const alt2 = String((row && row.props ? row.props[key] : '') ?? '').trim();
      const neu2 = String(neuerWert).trim();
      if (alt2 && alt2 !== neu2) {
        const erlaubt = def.uebergaenge[alt2];
        if (Array.isArray(erlaubt) && erlaubt.length && !erlaubt.includes(neu2))
          return { ok: false, fehler:
            `Von „${alt2}" darf „${name}" nur auf ${erlaubt.map(x => '„' + x + '"').join(' oder ')} ` +
            `springen — nicht auf „${neu2}".` };
      }
    }

    /* Die freie Regel als Formel — sie sieht die Zeile MIT dem neuen Wert,
       damit man „wenn Status = Fertig, dann muss Abschlussdatum stehen"
       schreiben kann. */
    if (def.regel && row) {
      const probe = { ...row, props: { ...(row.props || {}), [key]: neuerWert } };
      const r = Formula.run(def.regel, (n) => {
        const k2 = Object.keys(coll.schema).find(x => coll.schema[x].name === n);
        if (!k2) return null;
        if (coll.schema[k2].type === 'relation') return seitenListe(wert(probe, k2, coll));
        return wert(probe, k2, coll);
      }, fremdWert, formelUmgebung(probe, coll));
      if (r.ok && !Formula.wahr(r.wert))
        return { ok: false, fehler: def.regelText || `„${name}": die Regel trifft nicht zu.` };
    }

    return { ok: true };
  };

  /** Prüft eine ganze Zeile — für den Bericht und vor dem Import. */
  const pruefeZeile = (coll, row) => {
    const fehler = [];
    Object.keys(coll.schema).forEach(k => {
      const r = pruefeWert(coll, k, row, (row.props || {})[k]);
      if (!r.ok) fehler.push(r.fehler);
    });
    return fehler;
  };

  /**
   * Baut die Umgebung, die eine Formel über ihre eigene Zeile hinausschauen
   * lässt. Zwei Dinge stehen darin:
   *
   *   zeile — wo diese Zeile in der Ansicht steht (`index`), wie viele es
   *           sind (`anzahl`) und alle Werte einer Spalte in Ansichtsreihen-
   *           folge (`spalte`). Daraus entstehen rowNumber(), previous(),
   *           next(), runningSum(), rank(), percentOfTotal() …
   *   db    — die Zeilen einer ANDEREN Datenbank, über ihren Namen gefunden.
   *           Daraus entstehen findRows(), countWhere(), sumWhere() …
   *
   * Beides kann Notion nicht. Dort braucht jede Auswertung über die Zeile
   * hinaus eine Verknüpfung und ein Rollup.
   */
  const formelUmgebung = (row, coll) => {
    let zwischen = null;
    const reihen = () => {
      if (zwischen) return zwischen;
      if (ansichtOrdnung && ansichtOrdnung.collId === coll.id) {
        const liste = ansichtOrdnung.ids.map(id => Store.getBlock(id)).filter(Boolean);
        if (liste.some(r => r.id === row.id)) return (zwischen = liste);
      }
      return (zwischen = Store.rowsOf(coll.id));
    };
    const schluesselVon = (name) =>
      Object.keys(coll.schema).find(x => coll.schema[x].name === name) ||
      (/^(titel|name|title)$/i.test(name)
        ? Object.keys(coll.schema).find(x => coll.schema[x].type === 'title') : null);

    return {
      zeile: {
        index:  () => Math.max(0, reihen().findIndex(r => r.id === row.id)),
        anzahl: () => reihen().length,
        spalte: (name) => {
          const k = schluesselVon(name);
          if (!k) throw new Error(`Spalte nicht gefunden: ${name}`);
          const marke = coll.id + ':' + k;
          if (spaltenLauf.has(marke))
            throw new Error('Diese Formel bezieht sich auf sich selbst');
          spaltenLauf.add(marke);
          let selbst = null;
          try {
            const werte = reihen().map(r => {
              try {
                const v = wert(r, k, coll);
                /* Formula.run fängt den Fehler selbst ab und gibt ihn als Text
                   zurück — deshalb hier auf den Text schauen, nicht auf throw. */
                if (typeof v === 'string' && /sich selbst/.test(v))
                  selbst = new Error('Diese Formel bezieht sich auf sich selbst');
                return v;
              } catch (e) {
                if (/sich selbst/.test(e.message)) selbst = e;
                return null;
              }
            });
            /* Wenn die Spalte sich selbst gefragt hat, ist das keine Null,
               sondern ein Fehler — sonst stünde stillschweigend 0 da. */
            if (selbst) throw selbst;
            return werte;
          } finally { spaltenLauf.delete(marke); }
        }
      },
      db: (name) => {
        const gesucht = String(name).trim().toLowerCase();
        const c = Object.values(Store.cache.collections)
          .find(x => (x.name || '').trim().toLowerCase() === gesucht);
        if (!c) return null;
        return Store.rowsOf(c.id).map(r => seitenBezug(r.id, r.text || 'Ohne Titel'));
      }
    };
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

    /* Vorberechnet? Dann steht der Wert schon da. Bewusst vor dem
       Formelspeicher: der gilt nur für einen Datenstand, dieser hier über
       Änderungen und Neuladen hinweg — und die Tabelle sagt oben, wie alt
       er ist. */
    if ((def.type === 'rollup' || def.type === 'formula') &&
        typeof Vorrat !== 'undefined' && !formelTiefe && Vorrat.aktiv(coll.id)) {
      const v = Vorrat.hole(coll.id, row.id, key);
      if (v !== undefined) return v;
    }

    /* Rollup: rechnet über die verknüpften Zeilen */
    if (def.type === 'rollup') return rollupWert(row, def, coll);

    if (def.type === 'formula') {
      /* Gerechnet wird über den Formelspeicher: derselbe Wert für dieselbe
         Zeile wird nur einmal je Datenstand ausgerechnet. */
      if (typeof Tempo !== 'undefined' && !formelTiefe)
        return Tempo.hole(row, key, coll, () => formelRechnen(row, key, coll, def));
      return formelRechnen(row, key, coll, def);
    }

    const v = (row.props || {})[key];
    if (def.type === 'number')   return v === '' || v == null ? null : Number(v);
    if (def.type === 'sterne' || def.type === 'prozent')
      return v === '' || v == null ? 0 : Number(v);
    if (def.type === 'checkbox') return !!v;
    if (def.type === 'multi')    return Array.isArray(v) ? v : (v ? String(v).split(',').map(s=>s.trim()) : []);
    return v ?? '';
  };

  /** Die eigentliche Formelrechnung — ohne Speicher davor. */
  const formelRechnen = (row, key, coll, def) => {
    {
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
          fremdWert, formelUmgebung(row, coll));
        return r.ok ? r.wert : '⚠ ' + (r.fehler || 'Fehler');
      } catch (e) {
        return '⚠ ' + e.message;
      } finally { formelTiefe--; }
    }
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

  /**
   * Die Einzelwerte hinter einem Rollup, unzusammengefasst.
   * Notions Rollup-Filter „any / every / none" arbeiten darauf: nicht auf
   * der Summe, sondern auf jedem Element der Liste.
   */
  const rollupListe = (row, def, coll) => {
    const relDef = coll.schema[def.relation];
    if (!relDef || relDef.type !== 'relation') return [];
    const zielColl = Store.getCollection(relDef.ziel);
    if (!zielColl) return [];
    return (wert(row, def.relation, coll) || [])
      .map(id => Store.getBlock(id)).filter(Boolean)
      .map(z => wert(z, def.zielKey, zielColl));
  };

  /** Baut das HTML für eine Zelle. */
  const zelle = (row, key, coll) => {
    const def = coll.schema[key];
    const v = wert(row, key, coll);

    if (def.type === 'checkbox')
      return `<input type="checkbox" ${v ? 'checked' : ''} data-k="${key}" style="accent-color:var(--accent);cursor:pointer">`;

    /* Bewertung: fünf Sterne, anklickbar. Notion hat den Typ nicht. */
    if (def.type === 'sterne') {
      const n = Math.max(0, Math.min(5, Math.round(Formula.zahl(v))));
      return '<span class="sterne" data-k="' + key + '">' +
        [1,2,3,4,5].map(i =>
          `<i data-n="${i}" class="${i <= n ? 'an' : ''}">★</i>`).join('') +
        '</span>';
    }

    /* Fortschritt: Balken mit Prozentzahl. */
    if (def.type === 'prozent') {
      const n = Math.max(0, Math.min(100, Math.round(Formula.zahl(v))));
      return '<span class="proz"><i style="width:' + n + '%"></i>' +
             '<b>' + n + ' %</b></span>';
    }

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

    /* Farbskala und Heatmap — Notion hat keine bedingte Formatierung.
       Die Zelle wird nach ihrem Platz zwischen dem kleinsten und dem
       grössten Wert der Spalte eingefärbt: rot unten, grün oben. */
    if ((def.type === 'number' || def.type === 'formula' || def.type === 'rollup') && v != null &&
        (def.anzeige === 'skala' || def.anzeige === 'heat')) {
      const z = Formula.zahl(v);
      const alle = Store.rowsOf(coll.id).map(r2 => Formula.zahl(wert(r2, key, coll)))
        .filter(x => isFinite(x));
      const min = alle.length ? Math.min(...alle) : 0;
      const max = alle.length ? Math.max(...alle) : 1;
      const t = max === min ? 0.5 : (z - min) / (max - min);
      /* Von Rot (0°) über Gelb (55°) nach Grün (135°) */
      const ton = Math.round(t * 135);
      const stil = def.anzeige === 'heat'
        ? `background:hsl(${ton} 62% 42% / .55)`
        : `box-shadow:inset 3px 0 0 hsl(${ton} 65% 48%); padding-left:8px`;
      return `<span class="zell-skala" style="${stil}">${esc(Formula.anzeige(v))}</span>`;
    }

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
    /* Notion vergleicht nur mit einem festen Wert. Redion kann eine Spalte
       auch mit einer anderen Spalte derselben Zeile vergleichen — etwa
       „Ende ist vor Start" oder „Ist-Kosten sind grösser als Budget". */
    const z = (regel.vergleich === 'feld' && regel.wertKey && coll.schema[regel.wertKey])
      ? wert(row, regel.wertKey, coll)
      : regel.wert;

    const leer = v == null || v === '' || (Array.isArray(v) && !v.length);

    /* --- Rollup: any / every / none ---------------------------------------
     * Notions verschachtelte Rollup-Filter. Sie sehen nicht auf die Summe,
     * sondern auf jeden Einzelwert hinter der Verknüpfung.
     * -------------------------------------------------------------------- */
    if (def.type === 'rollup' &&
        /^(irgendeiner|alle|keiner)\b/.test(op)) {
      const liste = rollupListe(row, def, coll).map(x =>
        Array.isArray(x) ? x.join(', ') : x);
      const suche = String(z ?? '').toLowerCase();
      const einzeln = (x) => {
        const t = String(Formula.anzeige(x) ?? '').toLowerCase();
        if (/leer$/.test(op))              return x == null || x === '';
        if (/grösser$/.test(op))           return Formula.zahl(x) > Formula.zahl(z);
        if (/kleiner$/.test(op))           return Formula.zahl(x) < Formula.zahl(z);
        if (/enthält$|enthalten$/.test(op)) return t.includes(suche);
        return t === suche;                /* „ist" und „sind" */
      };
      if (!liste.length) return op.startsWith('keiner') || op.startsWith('alle');
      if (op.startsWith('irgendeiner')) return liste.some(einzeln);
      if (op.startsWith('alle'))        return liste.every(einzeln);
      if (op.startsWith('keiner'))      return !liste.some(einzeln);
    }

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
      /* Die drei, die Notions API kennt und uns noch fehlten:
         past_year, next_month, next_year. */
      if (op === 'ist letztes Jahr')  return dv.getFullYear() === jetzt.getFullYear() - 1;
      if (op === 'ist dieses Jahr')   return dv.getFullYear() === jetzt.getFullYear();
      if (op === 'ist nächstes Jahr') return dv.getFullYear() === jetzt.getFullYear() + 1;
      if (op === 'ist nächster Monat') {
        const n = new Date(jetzt.getFullYear(), jetzt.getMonth() + 1, 1);
        return dv.getMonth() === n.getMonth() && dv.getFullYear() === n.getFullYear();
      }
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
    /* Nach einer Formel sortieren, ohne dafür eine Spalte anzulegen —
       Notion verlangt dort immer eine echte Formel-Eigenschaft. */
    const formelWert = (r, s) => {
      try {
        const res = Formula.run(s.formel, (n) => {
          const k = Object.keys(coll.schema).find(x => coll.schema[x].name === n || x === n);
          return k ? wert(r, k, coll) : null;
        }, null, formelUmgebung(r, coll));
        const v = res && typeof res === 'object' && 'wert' in res ? (res.ok ? res.wert : null) : res;
        return v instanceof Date ? v.getTime() : v;
      } catch (e) { return null; }
    };
    return rows.slice().sort((a, b) => {
      for (const s of view.sorts) {
        let x, y;
        if (s.formel) { x = formelWert(a, s); y = formelWert(b, s); }
        else { x = wert(a, s.key, coll); y = wert(b, s.key, coll); }
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

  /**
   * Die zuletzt gezeichnete Reihenfolge einer Ansicht.
   * Formeln wie rowNumber(), previous(), runningSum() und rank() brauchen sie:
   * sie müssen wissen, wo diese Zeile in der Ansicht steht und was davor kam.
   * Notion kann das nicht — dort sieht eine Formel nur ihre eigene Zeile.
   */
  let ansichtOrdnung = null;

  const zeilen = (coll, view) => {
    const alle = sortiert(gefiltert(rohZeilen(coll, view), view, coll), view, coll);
    const sicht = begrenzen(alle, view);
    ansichtOrdnung = { collId: coll.id, ids: sicht.map(r => r.id) };
    return sicht;
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

  return { esc,
           DIENST_TYPEN,
           FARBEN,
           KI_AUFTRAG,
           KI_TYPEN,
           MUSTER_VORLAGEN,
           NUR_LESEN,
           OPERATOREN,
           RECHNUNGEN,
           ROLLUP_ARTEN,
           TYPEN,
           ansichtOrdnung,
           begrenzen,
           dauerLesen,
           dauerText,
           formelRechnen,
           formelTiefe,
           formelUmgebung,
           fremdWert,
           gefiltert,
           gruppeTrifftZu,
           hatRegeln,
           heute,
           propTyp,
           pruefeWert,
           pruefeZeile,
           rechne,
           regelAnzahl,
           rohZeilen,
           rollupListe,
           rollupWert,
           seitenBezug,
           seitenListe,
           sortiert,
           spaltenLauf,
           trifftZu,
           wert,
           zeilen,
           zeilenGesamt,
           zelle,
           zusammenfassen };
})();

/* Nur, wenn es ein Fenster gibt. In Node gibt es keines — und genau das ist
   der Zweck dieser Datei. */
if (typeof window !== 'undefined') window.DatenbankDienst = DatenbankDienst;
