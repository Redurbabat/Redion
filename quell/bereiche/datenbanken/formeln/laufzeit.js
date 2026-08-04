/* ============================================================================
 * formula.js — Die Formelsprache
 * ----------------------------------------------------------------------------
 * Eine Umsetzung von Notions Formelsprache 2.0: eigener Tokenizer, eigener
 * Parser, eigener Auswerter. Kein eval(), damit eine Formel niemals fremden
 * Code ausführen kann.
 *
 * Unterstützt:
 *   Zahlen, Texte, true/false
 *   prop("Name")
 *   + - * / % ^   == != > >= < <=   and or not   ? :
 *   if, ifs, empty, let, lets
 *   round floor ceil abs sqrt min max sum mean pow toNumber format length
 *   substring contains replace replaceAll lower upper trim split repeat join
 *   now today dateBetween dateAdd formatDate year month day date week hour minute
 *   style link
 *
 * WICHTIG — die Falle, an der fast jeder scheitert:
 *   Text wird mit + verkettet, NICHT mit concat().
 *   concat() ist ausschliesslich fuer Listen.
 * ==========================================================================*/

const Formula = (() => {

  /* ========================================================================
   * 1. TOKENIZER — Zeichen zu Wortmarken
   * ======================================================================*/
  const tokenize = (src) => {
    const out = [];
    let i = 0;

    const istZiffer = c => c >= '0' && c <= '9';
    const istBuchstabe = c => /[A-Za-zÄÖÜäöüß_]/.test(c);

    while (i < src.length) {
      const c = src[i];

      if (/\s/.test(c)) { i++; continue; }

      /* Text in Anführungszeichen */
      if (c === '"' || c === "'") {
        const ende = c;
        let s = '';
        i++;
        while (i < src.length && src[i] !== ende) {
          if (src[i] === '\\') { i++; s += src[i] === 'n' ? '\n' : src[i]; }
          else s += src[i];
          i++;
        }
        i++;
        out.push({ t: 'str', v: s });
        continue;
      }

      /* Zahl */
      if (istZiffer(c) || (c === '.' && istZiffer(src[i+1]))) {
        let s = '';
        while (i < src.length && (istZiffer(src[i]) || src[i] === '.')) s += src[i++];
        out.push({ t: 'num', v: parseFloat(s) });
        continue;
      }

      /* Name oder Schlüsselwort */
      if (istBuchstabe(c)) {
        let s = '';
        while (i < src.length && (istBuchstabe(src[i]) || istZiffer(src[i]))) s += src[i++];
        out.push({ t: 'name', v: s });
        continue;
      }

      /* Zwei-Zeichen-Operatoren zuerst */
      const zwei = src.slice(i, i + 2);
      if (['==','!=','>=','<=','&&','||'].includes(zwei)) {
        out.push({ t: 'op', v: zwei }); i += 2; continue;
      }

      /* Der Punkt gehört dazu, sonst funktioniert liste.map(...) nicht.
       * Zahlen wie 3.14 sind oben schon abgefangen. */
      if ('+-*/%^><(),?:[]!.'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }

      /* Unbekanntes Zeichen einfach überspringen, statt alles abzubrechen */
      i++;
    }

    out.push({ t: 'end' });
    return out;
  };

  /* ========================================================================
   * 2. PARSER — Wortmarken zu Baum
   * ------------------------------------------------------------------------
   * Rekursiver Abstieg mit den üblichen Vorrangstufen:
   *   ?:  <  or  <  and  <  Vergleich  <  + -  <  * / %  <  ^  <  unär  <  Atom
   * ======================================================================*/
  const parse = (tok) => {
    let p = 0;
    const schau = () => tok[p];
    const nimm = () => tok[p++];
    const istOp = (v) => tok[p].t === 'op' && tok[p].v === v;
    const istName = (v) => tok[p].t === 'name' && tok[p].v.toLowerCase() === v;

    const erwarte = (v) => {
      if (!istOp(v)) throw new Error(`"${v}" erwartet`);
      p++;
    };

    /* Unterste Ebene: Zahl, Text, Klammer, Funktionsaufruf, Liste */
    const atom = () => {
      const t = schau();

      if (t.t === 'num') { nimm(); return { k: 'num', v: t.v }; }
      if (t.t === 'str') { nimm(); return { k: 'str', v: t.v }; }

      if (istOp('(')) { nimm(); const e = ternaer(); erwarte(')'); return e; }

      /* Liste: [1, 2, 3] */
      if (istOp('[')) {
        nimm();
        const items = [];
        if (!istOp(']')) {
          items.push(ternaer());
          while (istOp(',')) { nimm(); items.push(ternaer()); }
        }
        erwarte(']');
        return { k: 'list', items };
      }

      if (t.t === 'name') {
        const name = nimm().v;
        const klein = name.toLowerCase();

        if (klein === 'true')  return { k: 'bool', v: true  };
        if (klein === 'false') return { k: 'bool', v: false };
        if (klein === 'null' || klein === 'empty' && !istOp('(')) return { k: 'null' };

        /* Funktionsaufruf */
        if (istOp('(')) {
          nimm();
          const args = [];
          if (!istOp(')')) {
            args.push(ternaer());
            while (istOp(',')) { nimm(); args.push(ternaer()); }
          }
          erwarte(')');
          return { k: 'call', name: klein, args };
        }

        /* Blosser Name = Variable (aus let/lets) */
        return { k: 'var', name };
      }

      throw new Error('Unerwartetes Zeichen in der Formel');
    };

    /* Methodenaufruf: text.upper()  oder  liste.length() */
    const punkt = () => {
      let links = atom();
      while (schau().t === 'op' && schau().v === '.') {
        nimm();
        const m = nimm().v.toLowerCase();
        const args = [links];
        if (istOp('(')) {
          nimm();
          if (!istOp(')')) {
            args.push(ternaer());
            while (istOp(',')) { nimm(); args.push(ternaer()); }
          }
          erwarte(')');
        }
        links = { k: 'call', name: m, args };
      }
      return links;
    };

    const unaer = () => {
      if (istOp('-')) { nimm(); return { k: 'neg', a: unaer() }; }
      if (istOp('!'))  { nimm(); return { k: 'not', a: unaer() }; }
      if (istName('not')) { nimm(); return { k: 'not', a: unaer() }; }
      return punkt();
    };

    const potenz = () => {
      let l = unaer();
      while (istOp('^')) { nimm(); l = { k: 'bin', op: '^', l, r: unaer() }; }
      return l;
    };

    const punktrechnung = () => {
      let l = potenz();
      while (istOp('*') || istOp('/') || istOp('%')) {
        const op = nimm().v;
        l = { k: 'bin', op, l, r: potenz() };
      }
      return l;
    };

    const strichrechnung = () => {
      let l = punktrechnung();
      while (istOp('+') || istOp('-')) {
        const op = nimm().v;
        l = { k: 'bin', op, l, r: punktrechnung() };
      }
      return l;
    };

    const vergleich = () => {
      let l = strichrechnung();
      while (istOp('==') || istOp('!=') || istOp('>') || istOp('>=') || istOp('<') || istOp('<=')) {
        const op = nimm().v;
        l = { k: 'bin', op, l, r: strichrechnung() };
      }
      return l;
    };

    const und = () => {
      let l = vergleich();
      while (istOp('&&') || istName('and')) { nimm(); l = { k: 'bin', op: 'and', l, r: vergleich() }; }
      return l;
    };

    const oder = () => {
      let l = und();
      while (istOp('||') || istName('or')) { nimm(); l = { k: 'bin', op: 'or', l, r: und() }; }
      return l;
    };

    const ternaer = () => {
      const bedingung = oder();
      if (istOp('?')) {
        nimm();
        const dann = ternaer();
        erwarte(':');
        const sonst = ternaer();
        return { k: 'call', name: 'if', args: [bedingung, dann, sonst] };
      }
      return bedingung;
    };

    const baum = ternaer();
    return baum;
  };

  /* ========================================================================
   * 3. AUSWERTER
   * ======================================================================*/

  const istLeer = (v) => v === null || v === undefined || v === '' ||
                         (Array.isArray(v) && v.length === 0);

  const zahl = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v instanceof Date) return v.getTime();
    if (istLeer(v)) return 0;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const text = (v) => {
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (Array.isArray(v)) return v.map(text).join(', ');
    if (typeof v === 'number') return String(Math.round(v * 1e10) / 1e10);
    /* Eine Gruppe aus groupBy liest sich als „Schlüssel (Anzahl)" */
    if (typeof v === 'object' && v.__gruppe) return v.schluessel + ' (' + v.eintraege.length + ')';
    return String(v);
  };

  const wahr = (v) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    return !istLeer(v);
  };

  const alsDatum = (v) => {
    if (v instanceof Date) return v;
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  };

  const TAG_MS = 86400000;

  /* ---------------------------------------------------------------------- *
   * ZEITZONEN — das, was Notion nicht hat
   *
   * `zonenWand` liefert ein Datum, dessen örtliche Felder (Jahr, Monat, Tag,
   * Stunde …) genau die Wanduhrzeit in der gewünschten Zone zeigen. Damit
   * lässt sich formatieren, ohne eine Bibliothek zu laden.
   * `alsInstant` geht den Weg zurück: es nimmt Wanduhrzeit in einer Zone und
   * sucht den echten Zeitpunkt dazu. Zweimal nachjustieren reicht auch an den
   * beiden Tagen im Jahr, an denen die Uhr umgestellt wird.
   * ---------------------------------------------------------------------- */
  const zonenWand = (d, zone) => {
    if (!zone) return d;
    try {
      const s = new Intl.DateTimeFormat('sv-SE', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(d);
      const g = new Date(s.replace(' ', 'T'));
      return isNaN(g.getTime()) ? d : g;
    } catch { return d; }
  };

  const alsInstant = (d, zone) => {
    if (!zone) return d;
    let t = d.getTime();
    for (let i = 0; i < 2; i++) {
      const versatz = zonenWand(new Date(t), zone).getTime() - t;
      t = d.getTime() - versatz;
    }
    return new Date(t);
  };

  /* Werktage: Montag bis Freitag. Wochenenden zählen nicht mit. */
  const istWochenende = (d) => d.getDay() === 0 || d.getDay() === 6;

  /* Kennzeichen für die Gruppen, die groupBy zurückgibt */
  const GRUPPE = '__gruppe';

  /* Die Funktionsbibliothek */
  const F = {
    /* --- Bedingungen ---------------------------------------------------- */
    /* Notion kennt beide Schreibweisen: „a and b" und „and(a, b)". */
    and: (a) => a.every(wahr),
    or:  (a) => a.some(wahr),
    not: (a) => !wahr(a[0]),
    xor: (a) => a.filter(wahr).length % 2 === 1,

    if:  (a) => wahr(a[0]) ? a[1] : a[2],
    ifs: (a) => {
      for (let i = 0; i + 1 < a.length; i += 2) if (wahr(a[i])) return a[i + 1];
      return a.length % 2 ? a[a.length - 1] : '';
    },
    empty:   (a) => a.length ? istLeer(a[0]) : '',
    equal:   (a) => a[0] === a[1],
    unequal: (a) => a[0] !== a[1],

    /* --- Mathematik ----------------------------------------------------- */
    add: a => zahl(a[0]) + zahl(a[1]),
    subtract: a => zahl(a[0]) - zahl(a[1]),
    multiply: a => zahl(a[0]) * zahl(a[1]),
    divide: a => zahl(a[1]) === 0 ? 0 : zahl(a[0]) / zahl(a[1]),
    mod: a => zahl(a[1]) === 0 ? 0 : zahl(a[0]) % zahl(a[1]),
    pow: a => Math.pow(zahl(a[0]), zahl(a[1])),
    abs: a => Math.abs(zahl(a[0])),
    round: a => a.length > 1
      ? Math.round(zahl(a[0]) * Math.pow(10, zahl(a[1]))) / Math.pow(10, zahl(a[1]))
      : Math.round(zahl(a[0])),
    floor: a => Math.floor(zahl(a[0])),
    ceil:  a => Math.ceil(zahl(a[0])),
    sqrt:  a => Math.sqrt(Math.max(0, zahl(a[0]))),
    cbrt:  a => Math.cbrt(zahl(a[0])),
    exp:   a => Math.exp(zahl(a[0])),
    ln:    a => zahl(a[0]) > 0 ? Math.log(zahl(a[0])) : 0,
    log10: a => zahl(a[0]) > 0 ? Math.log10(zahl(a[0])) : 0,
    log2:  a => zahl(a[0]) > 0 ? Math.log2(zahl(a[0])) : 0,
    sign:  a => Math.sign(zahl(a[0])),
    min: a => Math.min(...a.flat().map(zahl)),
    max: a => Math.max(...a.flat().map(zahl)),
    sum: a => a.flat().reduce((s, x) => s + zahl(x), 0),
    mean: a => { const f = a.flat(); return f.length ? f.reduce((s,x)=>s+zahl(x),0) / f.length : 0; },
    median: a => {
      const f = a.flat().map(zahl).sort((x, y) => x - y);
      if (!f.length) return 0;
      const m = Math.floor(f.length / 2);
      return f.length % 2 ? f[m] : (f[m-1] + f[m]) / 2;
    },
    pi: () => Math.PI,
    e:  () => Math.E,
    tonumber: a => zahl(a[0]),

    /* --- Text ------------------------------------------------------------ */
    format: a => text(a[0]),
    length: a => Array.isArray(a[0]) ? a[0].length : text(a[0]).length,
    substring: a => text(a[0]).substring(zahl(a[1]), a.length > 2 ? zahl(a[2]) : undefined),
    contains: a => Array.isArray(a[0]) ? a[0].includes(a[1]) : text(a[0]).includes(text(a[1])),
    includes: a => Array.isArray(a[0]) ? a[0].includes(a[1]) : text(a[0]).includes(text(a[1])),
    test: a => { try { return new RegExp(text(a[1])).test(text(a[0])); } catch { return false; } },
    match: a => { try { return (text(a[0]).match(new RegExp(text(a[1]), 'g')) || []); } catch { return []; } },
    replace: a => { try { return text(a[0]).replace(new RegExp(text(a[1])), text(a[2])); }
                    catch { return text(a[0]).replace(text(a[1]), text(a[2])); } },
    replaceall: a => { try { return text(a[0]).replace(new RegExp(text(a[1]), 'g'), text(a[2])); }
                       catch { return text(a[0]).split(text(a[1])).join(text(a[2])); } },
    lower: a => text(a[0]).toLowerCase(),
    upper: a => text(a[0]).toUpperCase(),
    trim:  a => text(a[0]).trim(),
    split: a => text(a[0]).split(text(a[1])),
    repeat: a => text(a[0]).repeat(Math.max(0, Math.min(500, Math.floor(zahl(a[1]))))),
    join: a => (Array.isArray(a[0]) ? a[0] : [a[0]]).map(text).join(text(a[1] ?? ', ')),

    /* --- Listen ---------------------------------------------------------- */
    at:    a => (a[0] || [])[zahl(a[1])],
    first: a => Array.isArray(a[0]) ? a[0][0] : text(a[0])[0],
    last:  a => Array.isArray(a[0]) ? a[0][a[0].length-1] : text(a[0]).slice(-1),
    slice: a => (a[0] || []).slice(zahl(a[1]), a.length > 2 ? zahl(a[2]) : undefined),
    concat: a => [].concat(...a.map(x => Array.isArray(x) ? x : [x])),
    reverse: a => (a[0] || []).slice().reverse(),
    unique: a => [...new Set(a[0] || [])],
    sort: a => (a[0] || []).slice().sort(),
    flat: a => (a[0] || []).flat(),

    /* --- Datum ----------------------------------------------------------- */
    /* Wahrheitswert und Datumsbereiche — die letzten Namen aus Teil 7 */
    boolean:   a => wahr(a[0]),
    daterange: a => ({ von: alsDatum(a[0]), bis: alsDatum(a[1]) }),
    datestart: a => (a[0] && a[0].von !== undefined ? a[0].von : alsDatum(a[0])),
    dateend:   a => (a[0] && a[0].bis !== undefined ? a[0].bis : alsDatum(a[0])),

    now:   () => new Date(),
    today: () => { const d = new Date(); d.setHours(0,0,0,0); return d; },
    dateadd: a => {
      const d = alsDatum(a[0]); if (!d) return null;
      const n = zahl(a[1]); const e = text(a[2]).toLowerCase();
      const r = new Date(d);
      if (e.startsWith('day'))   r.setDate(r.getDate() + n);
      if (e.startsWith('week'))  r.setDate(r.getDate() + n * 7);
      if (e.startsWith('month')) r.setMonth(r.getMonth() + n);
      if (e.startsWith('year'))  r.setFullYear(r.getFullYear() + n);
      if (e.startsWith('hour'))  r.setHours(r.getHours() + n);
      if (e.startsWith('minute'))r.setMinutes(r.getMinutes() + n);
      return r;
    },
    datesubtract: a => F.dateadd([a[0], -zahl(a[1]), a[2]]),
    datebetween: a => {
      const d1 = alsDatum(a[0]), d2 = alsDatum(a[1]);
      if (!d1 || !d2) return 0;
      const e = text(a[2] || 'days').toLowerCase();
      const ms = d1 - d2;
      if (e.startsWith('minute')) return Math.round(ms / 60000);
      if (e.startsWith('hour'))   return Math.round(ms / 3600000);
      if (e.startsWith('day'))    return Math.round(ms / TAG_MS);
      if (e.startsWith('week'))   return Math.round(ms / (TAG_MS * 7));
      if (e.startsWith('month'))  return (d1.getFullYear()-d2.getFullYear())*12 + (d1.getMonth()-d2.getMonth());
      if (e.startsWith('year'))   return d1.getFullYear() - d2.getFullYear();
      return Math.round(ms / TAG_MS);
    },
    timestamp: a => { const d = alsDatum(a[0]); return d ? d.getTime() : 0; },
    fromtimestamp: a => new Date(zahl(a[0])),
    parsedate: a => alsDatum(a[0]),
    year:   a => { const d = alsDatum(a[0]); return d ? d.getFullYear() : 0; },
    month:  a => { const d = alsDatum(a[0]); return d ? d.getMonth() + 1 : 0; },
    date:   a => { const d = alsDatum(a[0]); return d ? d.getDate() : 0; },
    /* Notion zählt den Wochentag ab Montag = 1 */
    day:    a => { const d = alsDatum(a[0]); return d ? (d.getDay() === 0 ? 7 : d.getDay()) : 0; },
    hour:   a => { const d = alsDatum(a[0]); return d ? d.getHours() : 0; },
    minute: a => { const d = alsDatum(a[0]); return d ? d.getMinutes() : 0; },
    week:   a => {
      const d = alsDatum(a[0]); if (!d) return 0;
      const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const wt = t.getUTCDay() || 7;
      t.setUTCDate(t.getUTCDate() + 4 - wt);
      const jahresanfang = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
      return Math.ceil((((t - jahresanfang) / TAG_MS) + 1) / 7);
    },
    /* ==================================================================== *
     * ÜBER NOTION HINAUS — Datum
     * Notion hat weder Werktage noch Feiertage noch Zeitzonen. Hier sind sie.
     * ==================================================================== */

    /** Fällt das Datum auf Samstag oder Sonntag? */
    isweekend: a => { const d = alsDatum(a[0]); return d ? istWochenende(d) : false; },
    /** Montag bis Freitag? */
    isworkday: a => { const d = alsDatum(a[0]); return d ? !istWochenende(d) : false; },

    /**
     * businessDaysBetween(a, b) — Werktage zwischen zwei Daten.
     * Der Starttag zählt nicht mit, der Zieltag schon — wie man rechnet,
     * wenn man sagt „drei Arbeitstage ab heute".
     */
    businessdaysbetween: a => {
      const von = alsDatum(a[0]), bis = alsDatum(a[1]);
      if (!von || !bis) return 0;
      const rueckwaerts = bis < von;
      let x = new Date(Math.min(von, bis)); x.setHours(0,0,0,0);
      const ende = new Date(Math.max(von, bis)); ende.setHours(0,0,0,0);
      let n = 0, sicher = 0;
      while (x < ende && sicher++ < 40000) {
        x = new Date(x.getTime() + TAG_MS);
        if (!istWochenende(x)) n++;
      }
      return rueckwaerts ? -n : n;
    },

    /** addBusinessDays(datum, n) — n Werktage dazuzählen (n darf negativ sein). */
    addbusinessdays: a => {
      const d = alsDatum(a[0]); if (!d) return null;
      let n = Math.trunc(zahl(a[1]));
      const schritt = n < 0 ? -TAG_MS : TAG_MS;
      let x = new Date(d.getTime()), sicher = 0;
      while (n !== 0 && sicher++ < 40000) {
        x = new Date(x.getTime() + schritt);
        if (!istWochenende(x)) n += n > 0 ? -1 : 1;
      }
      return x;
    },

    /** Anfang und Ende von Tag, Woche, Monat, Quartal, Jahr. */
    startofday:  a => { const d = alsDatum(a[0]); if (!d) return null; const x = new Date(d); x.setHours(0,0,0,0); return x; },
    endofday:    a => { const d = alsDatum(a[0]); if (!d) return null; const x = new Date(d); x.setHours(23,59,59,999); return x; },
    startofweek: a => { const d = alsDatum(a[0]); if (!d) return null;
      const x = new Date(d); x.setHours(0,0,0,0);
      x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; },   /* Montag */
    endofweek:   a => { const d = alsDatum(a[0]); if (!d) return null;
      const x = new Date(d); x.setHours(23,59,59,999);
      x.setDate(x.getDate() + (6 - ((x.getDay() + 6) % 7))); return x; },
    startofmonth: a => { const d = alsDatum(a[0]); if (!d) return null;
      return new Date(d.getFullYear(), d.getMonth(), 1); },
    endofmonth:   a => { const d = alsDatum(a[0]); if (!d) return null;
      return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); },
    startofquarter: a => { const d = alsDatum(a[0]); if (!d) return null;
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1); },
    endofquarter:   a => { const d = alsDatum(a[0]); if (!d) return null;
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0, 23, 59, 59, 999); },
    startofyear:  a => { const d = alsDatum(a[0]); if (!d) return null; return new Date(d.getFullYear(), 0, 1); },
    endofyear:    a => { const d = alsDatum(a[0]); if (!d) return null; return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999); },
    quarter:      a => { const d = alsDatum(a[0]); return d ? Math.floor(d.getMonth() / 3) + 1 : 0; },
    daysinmonth:  a => { const d = alsDatum(a[0]); return d ? new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() : 0; },
    isleapyear:   a => { const d = alsDatum(a[0]); if (!d) return false;
      const j = d.getFullYear(); return (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0; },

    /**
     * convertTimezone(datum, vonZone, nachZone)
     * Liest das Datum als Wanduhrzeit in `vonZone` und gibt die Wanduhrzeit
     * in `nachZone` zurück. Zonennamen wie "Europe/Zurich", "UTC", "Asia/Istanbul".
     */
    converttimezone: a => {
      const d = alsDatum(a[0]); if (!d) return null;
      const von = a.length > 1 ? text(a[1]) : '';
      const nach = a.length > 2 ? text(a[2]) : text(a[1] || '');
      return zonenWand(alsInstant(d, von), nach);
    },
    /** timezoneOffset(datum, zone) — Abstand zur Weltzeit in Minuten. */
    timezoneoffset: a => {
      const d = alsDatum(a[0]); if (!d) return 0;
      const zone = text(a[1] || 'UTC');
      return Math.round((zonenWand(d, zone).getTime() - zonenWand(d, 'UTC').getTime()) / 60000);
    },

    /* ==================================================================== *
     * ÜBER NOTION HINAUS — Zufall
     * Notion schreibt ausdrücklich, dass es kein random() gibt. Hier gibt es eins.
     * ==================================================================== */
    random: () => Math.random(),
    randombetween: a => {
      const u = Math.ceil(Math.min(zahl(a[0]), zahl(a[1])));
      const o = Math.floor(Math.max(zahl(a[0]), zahl(a[1])));
      return o < u ? u : u + Math.floor(Math.random() * (o - u + 1));
    },
    /** randomItem(liste) — ein zufälliger Eintrag, z. B. die Karteikarte des Tages. */
    randomitem: a => {
      const l = Array.isArray(a[0]) ? a[0] : (a[0] == null ? [] : [a[0]]);
      return l.length ? l[Math.floor(Math.random() * l.length)] : null;
    },
    /** shuffle(liste) — zufällige Reihenfolge. */
    shuffle: a => {
      const l = (Array.isArray(a[0]) ? a[0] : []).slice();
      for (let i = l.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [l[i], l[j]] = [l[j], l[i]];
      }
      return l;
    },

    /* ==================================================================== *
     * ÜBER NOTION HINAUS — Listen und Statistik
     * ==================================================================== */
    groupkey:   a => (a[0] && a[0][GRUPPE]) ? a[0].schluessel : null,
    groupitems: a => (a[0] && a[0][GRUPPE]) ? a[0].eintraege : [],
    groupcount: a => (a[0] && a[0][GRUPPE]) ? a[0].eintraege.length : 0,

    /** Standardabweichung und Varianz — für Auswertungen, die Notion nicht hat. */
    stddev: a => {
      const l = (Array.isArray(a[0]) ? a[0] : a).map(zahl).filter(isFinite);
      if (l.length < 2) return 0;
      const m = l.reduce((x, y) => x + y, 0) / l.length;
      return Math.sqrt(l.reduce((s, x) => s + (x - m) ** 2, 0) / (l.length - 1));
    },
    variance: a => {
      const l = (Array.isArray(a[0]) ? a[0] : a).map(zahl).filter(isFinite);
      if (l.length < 2) return 0;
      const m = l.reduce((x, y) => x + y, 0) / l.length;
      return l.reduce((s, x) => s + (x - m) ** 2, 0) / (l.length - 1);
    },
    /** percentile(liste, 0.9) — der Wert, unter dem 90 % liegen. */
    percentile: a => {
      const l = (Array.isArray(a[0]) ? a[0] : []).map(zahl).filter(isFinite).sort((x, y) => x - y);
      if (!l.length) return 0;
      const p = Math.min(1, Math.max(0, zahl(a[1])));
      const i = (l.length - 1) * p, u = Math.floor(i), o = Math.ceil(i);
      return u === o ? l[u] : l[u] + (l[o] - l[u]) * (i - u);
    },
    /** clamp(wert, min, max) — auf einen Bereich begrenzen. */
    clamp: a => Math.min(Math.max(zahl(a[0]), zahl(a[1])), zahl(a[2])),
    /** roundTo(zahl, stellen) — auf n Nachkommastellen runden. */
    roundto: a => { const f = Math.pow(10, Math.trunc(zahl(a[1]))); return Math.round(zahl(a[0]) * f) / f; },

    /* ==================================================================== *
     * ÜBER NOTION HINAUS — Text
     * ==================================================================== */
    padstart: a => text(a[0]).padStart(Math.trunc(zahl(a[1])), text(a[2] || ' ')),
    padend:   a => text(a[0]).padEnd(Math.trunc(zahl(a[1])), text(a[2] || ' ')),
    startswith: a => text(a[0]).startsWith(text(a[1])),
    endswith:   a => text(a[0]).endsWith(text(a[1])),
    capitalize: a => { const s = text(a[0]); return s ? s[0].toUpperCase() + s.slice(1) : ''; },
    titlecase:  a => text(a[0]).replace(/\S+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()),
    /** slug("Mein Titel!") -> "mein-titel" — für Adressen und Dateinamen. */
    slug: a => text(a[0]).toLowerCase()
      .replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    /** initials("Redur Babat") -> "RB" */
    initials: a => text(a[0]).split(/\s+/).filter(Boolean).map(w => w[0].toUpperCase()).join(''),
    wordcount: a => (text(a[0]).match(/\S+/g) || []).length,
    truncate: a => { const s = text(a[0]), n = Math.trunc(zahl(a[1]));
      return s.length <= n ? s : s.slice(0, Math.max(0, n - 1)) + '…'; },

    /**
     * formatNumber(zahl, art, stellen) — die letzte Funktion, die Notion hat
     * und die hier gefehlt hat. Notions Beispiel:
     *   formatNumber(prop("Number"), "usd", 0)
     * Die Doku nennt nur "usd"; hier sind die gängigen Arten dabei.
     */
    formatnumber: a => {
      const n = zahl(a[0]);
      if (!isFinite(n)) return '';
      const art = text(a[1] || 'number').toLowerCase();
      const stellen = a.length > 2 ? Math.max(0, Math.min(20, zahl(a[2]))) : undefined;

      const WAEHRUNG = {
        usd: ['USD', 'en-US'], eur: ['EUR', 'de-DE'], chf: ['CHF', 'de-CH'],
        gbp: ['GBP', 'en-GB'], jpy: ['JPY', 'ja-JP'], try: ['TRY', 'tr-TR'],
        cad: ['CAD', 'en-CA'], aud: ['AUD', 'en-AU'], cny: ['CNY', 'zh-CN']
      };
      const opt = {};
      if (stellen !== undefined) { opt.minimumFractionDigits = stellen; opt.maximumFractionDigits = stellen; }

      try {
        if (WAEHRUNG[art]) {
          const [w, loc] = WAEHRUNG[art];
          return new Intl.NumberFormat(loc, { style: 'currency', currency: w, ...opt }).format(n);
        }
        if (art === 'percent' || art === 'prozent')
          return new Intl.NumberFormat('de-CH', { style: 'percent', ...opt }).format(n);
        if (art === 'commas' || art === 'tausender')
          return new Intl.NumberFormat('de-CH', { useGrouping: true, ...opt }).format(n);
        if (art === 'plain' || art === 'schlicht')
          return new Intl.NumberFormat('de-CH', { useGrouping: false, ...opt }).format(n);
        /* Eine Zahl als Muster: formatNumber(3.14159, 2) → 3.14 */
        if (/^[0-9]+$/.test(art))
          return n.toFixed(Math.min(20, Number(art)));
        return new Intl.NumberFormat('de-CH', opt).format(n);
      } catch { return String(n); }
    },

    formatdate: a => {
      let d = alsDatum(a[0]); if (!d) return '';
      /* Drittes Argument: Zeitzone. Notion kann das nicht — wir schon.
         formatDate(now(), "DD.MM.YYYY HH:mm", "Asia/Istanbul") */
      if (a.length > 2 && text(a[2])) d = zonenWand(d, text(a[2]));
      const f = text(a[1] || 'YYYY-MM-DD');
      const zwei = n => String(n).padStart(2, '0');
      const tage  = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
      const kurz  = ['So','Mo','Di','Mi','Do','Fr','Sa'];
      const monate= ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
      /* Text in eckigen Klammern bleibt wörtlich stehen: "YYYY-[W]WW" -> "2026-W31".
       * Deshalb erst herausnehmen, am Ende wieder einsetzen. */
      const woertlich = [];
      let vorlage = f.replace(/\[([^\]]*)\]/g, (_, inhalt) => {
        woertlich.push(inhalt);
        return '\u0001' + (woertlich.length - 1) + '\u0001';
      });

      return vorlage
        .replace(/YYYY/g, d.getFullYear())
        .replace(/YY/g,   String(d.getFullYear()).slice(-2))
        .replace(/MMMM/g, monate[d.getMonth()])
        .replace(/MMM/g,  monate[d.getMonth()].slice(0,3))
        .replace(/MM/g,   zwei(d.getMonth() + 1))
        .replace(/DD/g,   zwei(d.getDate()))
        .replace(/dddd/g, tage[d.getDay()])
        .replace(/ddd/g,  kurz[d.getDay()])
        .replace(/HH/g,   zwei(d.getHours()))
        .replace(/mm/g,   zwei(d.getMinutes()))
        .replace(/WW/g,   zwei(F.week([d])))
        .replace(/\u0001(\d+)\u0001/g, (_, n) => woertlich[+n]);
    },

    /* --- Darstellung ----------------------------------------------------- */
    style: a => text(a[0]),          /* Auszeichnung wird beim Rendern gesetzt */
    unstyle: a => text(a[0]),
    link: a => text(a[0]),
    id: () => '',
    name: a => text(a[0]),
    email: a => text(a[0])
  };

  /* ==========================================================================
   * DEUTSCHE NAMEN — dieselben Funktionen, die Excel-Schreibweise
   * --------------------------------------------------------------------------
   * Nachgemessen (`doku/EXCEL-IN-REDION-RECHERCHE.md`): von den 63 Funktionen
   * des Excel-Startpakets liefen **37 bereits** — und **keine einzige unter
   * ihrem deutschen Namen**. Wer aus Excel kam und `SUMME(1;2;3)` tippte,
   * bekam „Unbekannte Funktion". `sum` hätte gerechnet.
   *
   * Es fehlten also nicht 63 Funktionen, sondern 26 Funktionen und 37 Namen.
   * Die Namen sind das hier — eine Tabelle, kein Projekt.
   *
   * WARUM DAS SO BILLIG IST. Der Zerteiler kennt Umlaute schon
   * (`/[A-Za-zÄÖÜäöüß_]/`), und Namen werden vor dem Nachschlagen
   * kleingeschrieben. `SUMME`, `Summe` und `summe` landen deshalb von selbst
   * am selben Ort; hier steht nur, wo dieser Ort ist.
   *
   * ─── WARUM EINE NAMENSTABELLE UND KEINE ZEIGER IN `F` ───────────────────
   *
   * Der erste Versuch schrieb `F.summe = F.sum` — Zeiger auf dieselben
   * Funktionen, scheinbar sauber. Er hatte einen Fehler, der erst beim
   * Weiterbauen auffiel:
   *
   * `evaluate` behandelt dreizehn Namen besonders, **bevor** es in `F`
   * schaut — darunter `if` und `ifs`, die ihre Zweige faul auswerten, damit
   * der nicht genommene Zweig nicht rechnet. Diese Sonderbehandlung hängt am
   * Namen. Ein Alias, der nur in `F` steht, läuft daran vorbei:
   *
   *     if(true, 1, teuer())     rechnet teuer() nicht
   *     WENN(true, 1, teuer())   rechnete es
   *
   * Beide gaben 1 zurück, und deshalb fiel es nicht auf — der Prüflauf
   * verglich Ergebnisse, und die waren gleich.
   *
   * Deshalb steht der deutsche Name jetzt **vor** allem anderen und wird auf
   * seinen englischen zurückgeführt. Danach gibt es im ganzen Auswerter nur
   * noch einen Namen je Funktion, und jede Sonderbehandlung — die heutigen
   * dreizehn und jede spätere — gilt für beide Schreibweisen von selbst.
   *
   * MITTELWERT ZEIGT AUF `mean`, NICHT AUF `average`. `average` ist ein
   * Spaltenaggregat und antwortet ausserhalb einer Datenbankspalte mit „Das
   * geht nur in einer Datenbankspalte". Excels MITTELWERT nimmt Argumente —
   * das ist `mean`. Beim ersten Zählen ging genau das daneben.
   *
   * Die englischen Namen bleiben. Ein Alias, der das Original verdrängt,
   * hätte jede bestehende Formel in jedem Bestand gebrochen.
   * ======================================================================== */
  /* ==========================================================================
   * NACHGEBAUT FÜR EXCEL — Funktionen, die es hier noch nicht gab
   * --------------------------------------------------------------------------
   * Vierzehn Stück. Sie stehen bewusst **unter englischem Namen** in der
   * Funktionstabelle und bekommen ihren deutschen über `ALIAS` — dieselbe
   * Regel wie für alles andere, damit es nicht zwei Sorten Funktionen gibt.
   *
   * WARUM `rounddown` UND `roundup` NEBEN `floor` UND `ceil` STEHEN. Sie sind
   * nicht dasselbe, und der Unterschied zeigt sich erst bei negativen Zahlen:
   *
   *                      Excel      floor/ceil
   *     ABRUNDEN(-2,5)     -2          -3
   *     AUFRUNDEN(-2,1)    -3          -2
   *
   * Excel rundet **zur Null hin** und **von der Null weg**; `floor` und
   * `ceil` runden nach unten und nach oben. Bei positiven Zahlen ist das
   * dasselbe — deshalb zeigten die ersten Aliase (`abrunden: 'floor'`) auch
   * kein falsches Ergebnis, solange niemand eine negative Zahl rundete. Wer
   * eine Ausgabenliste rundet, tut genau das.
   *
   * `GANZZAHL` ist der Name für das, was `floor` tut: immer nach unten.
   *
   * WARUM `findtext` UND NICHT `find`. `find` ist die Listenfunktion und wird
   * in `evaluate` besonders behandelt — ein `F.find` würde davon verdeckt und
   * nie aufgerufen. Excels FINDEN sucht in Text und braucht deshalb einen
   * eigenen Namen.
   * ======================================================================== */
  Object.assign(F, {
    /* --- Zahlen ---------------------------------------------------------- */
    product: (a) => a.reduce((n, x) => n * zahl(x), 1),
    /* ANZAHL zählt nur, was wirklich eine Zahl ist — Text zählt nicht mit. */
    count:  (a) => a.filter(x => x !== null && x !== '' && !isNaN(Number(x))).length,
    /* ANZAHL2 zählt alles, was nicht leer ist. */
    counta: (a) => a.filter(x => x !== null && x !== undefined && x !== '').length,
    power:  (a) => Math.pow(zahl(a[0]), zahl(a[1])),
    /* Zur Null hin bzw. von der Null weg — nicht nach unten bzw. oben. */
    rounddown: (a) => Math.trunc(zahl(a[0])),
    roundup:   (a) => { const n = zahl(a[0]); return n < 0 ? Math.floor(n) : Math.ceil(n); },
    int:    (a) => Math.floor(zahl(a[0])),

    /* --- Datum ----------------------------------------------------------- */
    /* ZEIT gibt eine Uhrzeit als hh:mm:ss — die Form, die auch `format`
       wieder lesen kann. */
    time: (a) => {
      const zwei = (n) => String(Math.max(0, Math.floor(n))).padStart(2, '0');
      return zwei(zahl(a[0])) + ':' + zwei(zahl(a[1] ?? 0)) + ':' + zwei(zahl(a[2] ?? 0));
    },
    /* WOCHENTAG wie in Excel mit Typ 1: Sonntag = 1 … Samstag = 7. */
    weekday: (a) => {
      const d = new Date(text(a[0]));
      return isNaN(d.getTime()) ? 0 : d.getUTCDay() + 1;
    },

    /* --- Text ------------------------------------------------------------ */
    left:  (a) => text(a[0]).slice(0, Math.max(0, Math.floor(zahl(a[1] ?? 1)))),
    right: (a) => { const n = Math.max(0, Math.floor(zahl(a[1] ?? 1)));
                    return n === 0 ? '' : text(a[0]).slice(-n); },
    /* SÄUBERN wirft Steuerzeichen weg — dieselben, die `test87` im Quelltext
       verbietet, und aus demselben Grund: sie richten unterwegs Schaden an
       und sind nicht zu sehen. */
    clean: (a) => text(a[0]).replace(/[\u0000-\u001F\u007F]/g, ''),
    /* SUCHEN ist blind für Gross und Klein, FINDEN nicht — wie in Excel.
       Beide zählen ab 1; 0 heisst „nicht gefunden". */
    search: (a) => text(a[0]) === '' ? 1
      : text(a[1]).toLowerCase().indexOf(text(a[0]).toLowerCase()) + 1,
    findtext: (a) => text(a[0]) === '' ? 1
      : text(a[1]).indexOf(text(a[0])) + 1,

    /* --- Information ----------------------------------------------------- */
    /* ISTZAHL fragt nach dem Typ, nicht danach, ob sich etwas umwandeln
       lässt: "42" ist Text und keine Zahl — sonst wäre die Funktion nutzlos,
       weil sie für fast alles wahr sagte. */
    isnumber: (a) => typeof a[0] === 'number' && !isNaN(a[0]),
    istext:   (a) => typeof a[0] === 'string'
  });

  /* ==========================================================================
   * SUCHEN UND VERWEISEN — die Gruppe, wegen der man bei Excel bleibt
   * --------------------------------------------------------------------------
   * Gemessen war sie mit 3 von 13 die schwächste und zugleich die wichtigste:
   * `SVERWEIS` und `SUMMEWENN` sind das, wofür Menschen Excel öffnen.
   *
   * ─── DIE BEDINGUNGSSPRACHE ────────────────────────────────────────────────
   *
   * Excel schreibt Bedingungen als Text: `ZÄHLENWENN(A1:A9; ">100")`. Das ist
   * eine eigene kleine Sprache — `>`, `>=`, `<`, `<=`, `<>`, `=`, dazu die
   * Platzhalter `*` (beliebig viele Zeichen) und `?` (genau eines).
   *
   * Redion hätte auch einen eigenen Weg: `filter(liste, current > 100)` gibt
   * es längst und ist mächtiger. Verstanden wird hier trotzdem die
   * Excel-Sprache, aus einem Grund: Wer diese Funktionen sucht, kommt aus
   * Excel und tippt, was er kennt. Eine Funktion, die `ZÄHLENWENN` heisst und
   * etwas anderes verlangt, ist eine Falle mit vertrautem Namen.
   *
   * Wer den Redion-Weg will, hat ihn weiterhin: `filter`, `find`,
   * `countWhere`.
   *
   * KEIN `eval`, KEIN `RegExp` AUS NUTZERTEXT OHNE MASKIERUNG. Das Muster
   * wird Zeichen für Zeichen aufgebaut und alles ausser `*` und `?` maskiert
   * — sonst wäre ein `.` oder `(` im Suchtext ein Regex-Sonderzeichen und die
   * Bedingung träfe still das Falsche.
   * ======================================================================== */

  /** Aus `">100"` oder `"Z*"` eine Prüffunktion machen. */
  const bedingung = (roh) => {
    /* Eine Zahl ohne Anführungszeichen ist ein Gleichheitsvergleich. */
    if (typeof roh === 'number') return (x) => zahl(x) === roh;
    if (typeof roh === 'boolean') return (x) => wahr(x) === roh;

    const s = text(roh).trim();
    const m = s.match(/^(<>|>=|<=|=|>|<)\s*(.*)$/);
    const op = m ? m[1] : '=';
    const rest = m ? m[2] : s;

    /* Zahlenvergleich, wenn beide Seiten Zahlen sind. */
    const alsZahl = rest === '' ? NaN : Number(rest);
    const istZahl = !isNaN(alsZahl);

    if (op === '>' || op === '>=' || op === '<' || op === '<=') {
      if (!istZahl) return () => false;   /* „>abc" ergibt in Excel nichts */
      return (x) => {
        const n = Number(x);
        if (isNaN(n)) return false;
        return op === '>'  ? n >  alsZahl
             : op === '>=' ? n >= alsZahl
             : op === '<'  ? n <  alsZahl
             :               n <= alsZahl;
      };
    }

    /* Gleich oder ungleich. Bei Zahlen wird gerechnet, bei Text verglichen —
       blind für Gross und Klein, mit Platzhaltern, wie in Excel. */
    const trifft = istZahl
      ? (x) => x !== null && x !== '' && Number(x) === alsZahl
      : (() => {
          if (!/[*?]/.test(rest)) {
            const klein = rest.toLowerCase();
            return (x) => text(x).toLowerCase() === klein;
          }
          /* Platzhalter in ein Muster übersetzen — alles andere maskiert. */
          const muster = '^' + rest.split('').map(c =>
            c === '*' ? '.*' :
            c === '?' ? '.'  :
            c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + '$';
          const re = new RegExp(muster, 'i');
          return (x) => re.test(text(x));
        })();

    return op === '<>' ? (x) => !trifft(x) : trifft;
  };

  /** Die Stellen, an denen alle Bedingungspaare zutreffen. */
  const treffer = (paare, laenge) => {
    const stellen = [];
    for (let i = 0; i < laenge; i++) {
      let alle = true;
      for (const [liste, pruefe] of paare) {
        /* Ungleich lange Listen brechen nichts: was fehlt, trifft nicht.
           In Excel ist das ein Fehler — hier kann eine Sicherung oder ein
           Import Listen verschiedener Länge liefern, und ein Absturz mitten
           in einer Ansicht ist die schlechtere Antwort. */
        if (i >= liste.length || !pruefe(liste[i])) { alle = false; break; }
      }
      if (alle) stellen.push(i);
    }
    return stellen;
  };

  const alsListe = (x) => Array.isArray(x) ? x : (x === null || x === undefined ? [] : [x]);

  /** Paare aus (Liste, Bedingung) einsammeln — ab Position `ab`. */
  const paareAus = (a, ab) => {
    const paare = [];
    for (let i = ab; i + 1 < a.length; i += 2)
      paare.push([alsListe(a[i]), bedingung(a[i + 1])]);
    return paare;
  };

  const laengsteListe = (paare) => paare.reduce((n, [l]) => Math.max(n, l.length), 0);

  /* ==========================================================================
   * GLEICHER NAME IST NICHT GLEICHE BEDEUTUNG
   * --------------------------------------------------------------------------
   * Acht der ersten siebenunddreissig Zuordnungen waren nach
   * **Namensähnlichkeit** gemacht statt nach Bedeutung — und sieben davon
   * rechneten deshalb etwas anderes als Excel. Sie bekommen hier eigene
   * Funktionen; die englischen Namen behalten ihre bisherige Bedeutung, weil
   * jede bestehende Formel in jedem Bestand daran hängt.
   *
   *   deutsch          zeigte auf     tut jetzt
   *   TEIL             slice          ab Zeichen n, m Stück (ab 1 gezählt)
   *   TEXTKETTE        concat         Text aneinanderhängen (concat ist für Listen)
   *   TEXTVERKETTEN    join           Trenner zuerst, dann die Teile
   *   DATUM            date           aus Jahr, Monat, Tag
   *   ERSETZEN         replace        nach Stelle und Anzahl, nicht per Regex
   *   WECHSELN         replaceall     Suchtext wörtlich, nicht als Regex
   *   TEXT             format         mit Muster
   *   VERGLEICH        match          die Stelle, nicht die Textsuche
   *
   * `WECHSELN` ist das lehrreichste davon: `replaceall` nimmt einen regulären
   * Ausdruck. Bei „a.b.c" mit Suchtext „." trifft der Punkt **jedes** Zeichen
   * — heraus kam „-----". Für Suchtexte ohne Sonderzeichen wäre das nie
   * aufgefallen.
   * ======================================================================== */
  Object.assign(F, {
    /* Excel zählt ab 1 und nimmt eine Anzahl; `slice` zählt ab 0 und nimmt
       eine Endstelle. */
    mid: (a) => {
      const s = text(a[0]);
      const von = Math.max(0, Math.floor(zahl(a[1])) - 1);
      return a[2] === undefined ? s.slice(von)
                                : s.slice(von, von + Math.max(0, Math.floor(zahl(a[2]))));
    },
    /* Text aneinanderhängen. `concat` bleibt für Listen — so steht es seit
       jeher im Kopf dieser Datei, und Formeln verlassen sich darauf. */
    concattext: (a) => a.map(x => text(x)).join(''),
    /* Excel: TEXTVERKETTEN(Trenner; Leere_ignorieren; Text1; …). Das zweite
       Argument lassen wir weg — leere Teile werden immer übersprungen, weil
       alles andere in einer Liste aus Datenbankwerten nur Trenner ohne
       Inhalt ergäbe. */
    textjoin: (a) => {
      const trenner = text(a[0]);
      const teile = [];
      for (let i = 1; i < a.length; i++) {
        for (const x of (Array.isArray(a[i]) ? a[i] : [a[i]])) {
          const t = text(x);
          if (t !== '') teile.push(t);
        }
      }
      return teile.join(trenner);
    },
    /* Excel: DATUM(Jahr; Monat; Tag). `date` liest dagegen einen Text. */
    datefromparts: (a) => {
      const zwei = (n) => String(Math.floor(n)).padStart(2, '0');
      const j = Math.floor(zahl(a[0]));
      const d = new Date(Date.UTC(j, Math.floor(zahl(a[1])) - 1, Math.floor(zahl(a[2]))));
      if (isNaN(d.getTime())) return '';
      return d.getUTCFullYear() + '-' + zwei(d.getUTCMonth() + 1) + '-' + zwei(d.getUTCDate());
    },
    /* Excel: ERSETZEN(Text; Erstes_Zeichen; Anzahl_Zeichen; Neuer_Text). */
    replaceat: (a) => {
      const s = text(a[0]);
      const von = Math.max(0, Math.floor(zahl(a[1])) - 1);
      const wieViele = Math.max(0, Math.floor(zahl(a[2])));
      return s.slice(0, von) + text(a[3]) + s.slice(von + wieViele);
    },
    /* Excel: WECHSELN(Text; Alt; Neu) — wörtlich, nicht als Regex. */
    substitute: (a) => {
      const alt = text(a[1]);
      return alt === '' ? text(a[0]) : text(a[0]).split(alt).join(text(a[2]));
    },
    /* Excel lässt das Vorzeichen dem **Teiler** folgen, JavaScript dem
       Dividenden: REST(-7;3) ist in Excel 2, `-7 % 3` ist -1. Wer Wochentage
       oder Zyklen rechnet, bekommt sonst negative Zwischenstände. */
    excelmod: (a) => {
      const t = zahl(a[1]);
      if (t === 0) return 0;
      return ((zahl(a[0]) % t) + t) % t;
    },
    /* Excel rundet die Hälfte **von der Null weg**: RUNDEN(-2,5) ist -3.
       `Math.round` rundet immer nach oben und macht daraus -2. */
    excelround: (a) => {
      const n = zahl(a[0]);
      const stellen = a[1] === undefined ? 0 : Math.floor(zahl(a[1]));
      const f = Math.pow(10, stellen);
      const x = n * f;
      return (x < 0 ? -Math.round(-x) : Math.round(x)) / f;
    },
    /* Excel: VERGLEICH(Suchkriterium; Matrix) — die Stelle, ab 1 gezählt.
       0 heisst „nicht gefunden"; Excel gäbe dort #NV, und Fehlerwerte gibt es
       hier nicht (ENTSCHEIDUNGEN.md E24, Nachtrag 3). */
    matchpos: (a) => {
      const liste = Array.isArray(a[1]) ? a[1] : [a[1]];
      const gesucht = bedingung(a[0]);
      for (let i = 0; i < liste.length; i++) if (gesucht(liste[i])) return i + 1;
      return 0;
    },
    /* Excel: TEXT(Wert; Muster). Excels Formatsprache ist riesig; hier stehen
       die Muster, die im Alltag vorkommen. Was nicht erkannt wird, bleibt
       unverändert — lieber der rohe Wert als eine falsche Darstellung. */
    textformat: (a) => {
      const muster = text(a[1]);
      if (!muster) return text(a[0]);
      const n = zahl(a[0]);

      if (muster.includes('%')) {
        const nach = (muster.split('.')[1] || '').replace(/[^0#]/g, '').length;
        return (n * 100).toFixed(nach) + '%';
      }
      if (/^[#,0]*\.?0*$/.test(muster)) {
        const nach = (muster.split('.')[1] || '').length;
        let s = n.toFixed(nach);
        if (muster.includes(',')) {
          /* Schweizer Schreibweise mit dem hohen Komma — dieselbe, die die
             App sonst überall benutzt. */
          const [ganz, rest] = s.split('.');
          s = ganz.replace(/\B(?=(\d{3})+(?!\d))/g, '’') + (rest ? '.' + rest : '');
        }
        return s;
      }
      return text(a[0]);
    }
  });

  Object.assign(F, {
    countif:  (a) => {
      const liste = alsListe(a[0]);
      return treffer([[liste, bedingung(a[1])]], liste.length).length;
    },
    countifs: (a) => {
      const paare = paareAus(a, 0);
      return treffer(paare, laengsteListe(paare)).length;
    },
    /* SUMMEWENN(prüfliste; bedingung; summenliste?) — ohne dritte Liste wird
       die geprüfte Liste selbst summiert, genau wie in Excel. */
    sumif: (a) => {
      const pruef = alsListe(a[0]);
      const summen = a[2] === undefined ? pruef : alsListe(a[2]);
      return treffer([[pruef, bedingung(a[1])]], pruef.length)
        .reduce((n, i) => n + zahl(summen[i]), 0);
    },
    /* SUMMEWENNS(summenliste; prüfliste1; bedingung1; …) — die Summenliste
       steht vorn. Das ist Excels Reihenfolge und dreht sich gegenüber
       SUMMEWENN um; nachgebaut wird, was Excel tut, nicht was hübscher wäre. */
    sumifs: (a) => {
      const summen = alsListe(a[0]);
      const paare = paareAus(a, 1);
      return treffer(paare, laengsteListe(paare))
        .reduce((n, i) => n + zahl(summen[i]), 0);
    },
    averageif: (a) => {
      const pruef = alsListe(a[0]);
      const werte = a[2] === undefined ? pruef : alsListe(a[2]);
      const st = treffer([[pruef, bedingung(a[1])]], pruef.length);
      /* Ohne Treffer 0 statt NaN — eine Ansicht voller „NaN" hilft niemandem. */
      return st.length ? st.reduce((n, i) => n + zahl(werte[i]), 0) / st.length : 0;
    },
    averageifs: (a) => {
      const werte = alsListe(a[0]);
      const paare = paareAus(a, 1);
      const st = treffer(paare, laengsteListe(paare));
      return st.length ? st.reduce((n, i) => n + zahl(werte[i]), 0) / st.length : 0;
    },

    /* --- Verweise -------------------------------------------------------- */
    /* Alle geben bei „nichts gefunden" eine leere Zeichenkette zurück und
       werfen nicht. Excel gibt dort #NV; Redion hat keine Fehlerwerte
       (siehe ENTSCHEIDUNGEN.md E24, Nachtrag 3), und eine geworfene Ausnahme
       nähme die ganze Formel mit, nicht nur diese eine Zelle. */
    vlookup: (a) => {
      const zeilen = alsListe(a[1]);
      const spalte = Math.floor(zahl(a[2])) - 1;
      const gesucht = bedingung(a[0]);
      for (const zeile of zeilen) {
        const z = alsListe(zeile);
        if (z.length && gesucht(z[0]))
          return spalte >= 0 && spalte < z.length ? z[spalte] : '';
      }
      return '';
    },
    hlookup: (a) => {
      const zeilen = alsListe(a[1]);
      const zeile  = Math.floor(zahl(a[2])) - 1;
      const kopf = alsListe(zeilen[0]);
      const gesucht = bedingung(a[0]);
      for (let s = 0; s < kopf.length; s++) {
        if (gesucht(kopf[s])) {
          const z = alsListe(zeilen[zeile]);
          return zeile >= 0 && zeile < zeilen.length && s < z.length ? z[s] : '';
        }
      }
      return '';
    },
    xlookup: (a) => {
      const suchliste = alsListe(a[1]);
      const ergebnis  = alsListe(a[2]);
      const gesucht = bedingung(a[0]);
      for (let i = 0; i < suchliste.length; i++)
        if (gesucht(suchliste[i])) return i < ergebnis.length ? ergebnis[i] : '';
      return a[3] === undefined ? '' : a[3];
    },
    /* INDEX zählt ab 1 — wie in Excel und nicht wie JavaScript. Das ist die
       häufigste Verwechslung bei dieser Funktion. */
    index: (a) => {
      const daten = alsListe(a[0]);
      const zeile = Math.floor(zahl(a[1])) - 1;
      if (zeile < 0 || zeile >= daten.length) return '';
      const z = daten[zeile];
      if (a[2] === undefined) return z;
      const spalte = Math.floor(zahl(a[2])) - 1;
      const zz = alsListe(z);
      return spalte >= 0 && spalte < zz.length ? zz[spalte] : '';
    }
  });

  const ALIAS = {
    /* --- Suchen und Verweisen -------------------------------------------- */
    'zählenwenn': 'countif',
    'zählenwenns': 'countifs',
    summewenn: 'sumif',
    summewenns: 'sumifs',
    mittelwertwenn: 'averageif',
    mittelwertwenns: 'averageifs',
    sverweis: 'vlookup',
    wverweis: 'hlookup',
    xverweis: 'xlookup',
    /* INDEX heisst in beiden Sprachen gleich und braucht keinen Eintrag.
       FILTER auch — aber `filter` wird in `evaluate` faul behandelt, und
       genau deshalb muss der Grossbuchstaben-Name über diese Tabelle laufen
       und nicht über die Funktionstabelle. Kleingeschrieben ist er ohnehin
       schon `filter`, also fällt er von selbst richtig. */

    /* --- Zahlen ---------------------------------------------------------- */
    /* MIN, MAX und ABS heissen in beiden Sprachen gleich und brauchen keinen
       Eintrag. Sie stehen in `register/formeln.js` trotzdem beschrieben. */
    summe: 'sum',
    mittelwert: 'mean',
    wurzel: 'sqrt',
    rest: 'excelmod',
    runden: 'excelround',
    abrunden: 'rounddown',
    aufrunden: 'roundup',
    produkt: 'product',
    anzahl: 'count',
    anzahl2: 'counta',
    potenz: 'power',
    ganzzahl: 'int',

    /* --- Logik ----------------------------------------------------------- */
    wenn: 'if',
    wenns: 'ifs',
    und: 'and',
    oder: 'or',
    nicht: 'not',

    /* --- Datum ----------------------------------------------------------- */
    zeit: 'time',
    wochentag: 'weekday',
    heute: 'today',
    jetzt: 'now',
    datum: 'datefromparts',
    jahr: 'year',
    monat: 'month',
    tag: 'date',
    kalenderwoche: 'week',

    /* --- Text ------------------------------------------------------------ */
    links: 'left',
    rechts: 'right',
    'säubern': 'clean',
    suchen: 'search',
    finden: 'findtext',
    'länge': 'length',
    teil: 'mid',
    'glätten': 'trim',
    gross: 'upper',
    klein: 'lower',
    wechseln: 'substitute',
    ersetzen: 'replaceat',
    text: 'textformat',
    wert: 'tonumber',
    textkette: 'concattext',
    textverketten: 'textjoin',

    /* --- Information ----------------------------------------------------- */
    istleer: 'empty',
    istzahl: 'isnumber',
    isttext: 'istext',

    /* --- Suchen und Verweisen -------------------------------------------- */
    vergleich: 'matchpos',
    sortieren: 'sort',
    eindeutig: 'unique'
  };

  /* Der eigentliche Auswerter */
  /* ------------------------------------------------------------------------
   * EIGENE FUNKTIONEN
   * ------------------------------------------------------------------------
   * Notions Formelsprache hat kein LAMBDA und keine Möglichkeit, Logik einmal
   * zu benennen und wiederzuverwenden — das ist Punkt 7 der Lückenliste.
   * Hier gibt es eine kleine Bibliothek: Name, Parameter, Rumpf. Der Rumpf
   * wird einmal geparst und dann wie jede andere Funktion aufgerufen.
   * --------------------------------------------------------------------- */
  let EIGENE = {};

  /**
   * @param {Array} liste  [{ name, params:['a','b'], koerper:'…', beschreibung }]
   * @returns {Array} die Namen, deren Rumpf nicht lesbar war
   */
  const setzeBibliothek = (liste) => {
    EIGENE = {};
    const kaputt = [];
    (liste || []).forEach(f => {
      if (!f || !f.name) return;
      try {
        EIGENE[String(f.name).toLowerCase()] = {
          params: (f.params || []).map(x => String(x)),
          baum: parse(tokenize(f.koerper || '')),
          beschreibung: f.beschreibung || ''
        };
      } catch (e) { kaputt.push(f.name + ': ' + e.message); }
    });
    cache.clear();          /* alte Bäume könnten alte Namen enthalten */
    return kaputt;
  };

  const bibliothek = () => Object.entries(EIGENE).map(([n, f]) =>
    ({ name: n, params: f.params, beschreibung: f.beschreibung }));

  const evaluate = (knoten, ctx) => {
    switch (knoten.k) {
      case 'num':  return knoten.v;
      case 'str':  return knoten.v;
      case 'bool': return knoten.v;
      case 'null': return null;
      case 'list': return knoten.items.map(x => evaluate(x, ctx));
      case 'var':  return knoten.name in ctx.vars ? ctx.vars[knoten.name] : null;
      case 'neg':  return -zahl(evaluate(knoten.a, ctx));
      case 'not':  return !wahr(evaluate(knoten.a, ctx));

      case 'bin': {
        const { op } = knoten;
        /* Kurzschluss bei and/or — spart Arbeit und vermeidet Fehler */
        if (op === 'and') return wahr(evaluate(knoten.l, ctx)) && wahr(evaluate(knoten.r, ctx));
        if (op === 'or')  return wahr(evaluate(knoten.l, ctx)) || wahr(evaluate(knoten.r, ctx));

        const l = evaluate(knoten.l, ctx);
        const r = evaluate(knoten.r, ctx);

        /* DER Kernpunkt: + verkettet Text, wenn eine Seite Text ist */
        if (op === '+') {
          if (typeof l === 'string' || typeof r === 'string') return text(l) + text(r);
          return zahl(l) + zahl(r);
        }
        if (op === '-') return zahl(l) - zahl(r);
        if (op === '*') return zahl(l) * zahl(r);
        if (op === '/') return zahl(r) === 0 ? 0 : zahl(l) / zahl(r);
        if (op === '%') return zahl(r) === 0 ? 0 : zahl(l) % zahl(r);
        if (op === '^') return Math.pow(zahl(l), zahl(r));

        if (op === '==') return typeof l === typeof r ? l === r : text(l) === text(r);
        if (op === '!=') return typeof l === typeof r ? l !== r : text(l) !== text(r);

        const beideZahlen = !isNaN(parseFloat(l)) && !isNaN(parseFloat(r));
        const a = beideZahlen ? zahl(l) : text(l);
        const b = beideZahlen ? zahl(r) : text(r);
        if (op === '>')  return a >  b;
        if (op === '>=') return a >= b;
        if (op === '<')  return a <  b;
        if (op === '<=') return a <= b;
        return null;
      }

      case 'call': {
        /* Zuerst den deutschen Namen auf den englischen zurückführen — vor
           jeder Sonderbehandlung. Sonst liefe `WENN` an der faulen
           Auswertung von `if` vorbei und rechnete den toten Zweig mit. */
        const n = ALIAS[knoten.name] || knoten.name;

        /* prop() greift auf die Zeile zu.
         * Mit zwei Argumenten — geschrieben als current.prop("Feld") —
         * greift es auf eine verknüpfte Zeile zu. So liest eine Formel
         * durch eine Verknüpfung hindurch, genau wie in Notion:
         *   map(prop("Aufgaben"), current.prop("Kosten")).sum()          */
        if (n === 'prop') {
          if (knoten.args.length >= 2) {
            const el   = evaluate(knoten.args[0], ctx);
            const feld = text(evaluate(knoten.args[1], ctx));
            if (!ctx.fremd) throw new Error('Hier lassen sich keine verknüpften Zeilen lesen');
            return ctx.fremd(el, feld);
          }
          const feld = evaluate(knoten.args[0], ctx);
          return ctx.props(text(feld));
        }

        /* if und ifs werten faul aus, damit der falsche Zweig nicht rechnet */
        if (n === 'if') {
          return wahr(evaluate(knoten.args[0], ctx))
            ? evaluate(knoten.args[1], ctx)
            : (knoten.args[2] !== undefined ? evaluate(knoten.args[2], ctx) : '');
        }
        if (n === 'ifs') {
          const as = knoten.args;
          for (let i = 0; i + 1 < as.length; i += 2)
            if (wahr(evaluate(as[i], ctx))) return evaluate(as[i+1], ctx);
          return as.length % 2 ? evaluate(as[as.length-1], ctx) : '';
        }

        /* let(name, wert, ausdruck) */
        if (n === 'let') {
          const name = knoten.args[0].k === 'var' ? knoten.args[0].name : text(evaluate(knoten.args[0], ctx));
          const wert = evaluate(knoten.args[1], ctx);
          const neu = { ...ctx, vars: { ...ctx.vars, [name]: wert } };
          return evaluate(knoten.args[2], neu);
        }

        /* lets(n1, w1, n2, w2, …, ausdruck) — spätere sehen frühere */
        if (n === 'lets') {
          const as = knoten.args;
          let neu = { ...ctx, vars: { ...ctx.vars } };
          let i = 0;
          for (; i + 2 < as.length; i += 2) {
            const name = as[i].k === 'var' ? as[i].name : text(evaluate(as[i], neu));
            neu.vars[name] = evaluate(as[i+1], neu);
          }
          return evaluate(as[as.length-1], neu);
        }

        /* map / filter / find über Listen — 'current' ist das Element */
        if (['map','filter','find','some','every','findindex'].includes(n)) {
          const liste = evaluate(knoten.args[0], ctx);
          const arr = Array.isArray(liste) ? liste : (liste == null ? [] : [liste]);
          const ausdruck = knoten.args[1];
          const mit = (el, idx) => evaluate(ausdruck, {
            ...ctx, vars: { ...ctx.vars, current: el, index: idx }
          });
          if (n === 'map')    return arr.map(mit);
          if (n === 'filter') return arr.filter((e,i) => wahr(mit(e,i)));
          if (n === 'find')   return arr.find((e,i) => wahr(mit(e,i)));
          if (n === 'findindex') return arr.findIndex((e,i) => wahr(mit(e,i)));
          if (n === 'some')   return arr.some((e,i) => wahr(mit(e,i)));
          if (n === 'every')  return arr.every((e,i) => wahr(mit(e,i)));
        }

        /* ================================================================ *
         * ÜBER NOTION HINAUS — Listen falten, sortieren, gruppieren
         * Auch das sind Sonderformen: der Ausdruck darf erst laufen, wenn
         * `current`, `index` und bei reduce auch `acc` gesetzt sind.
         * ================================================================ */
        if (['reduce', 'sortby', 'groupby'].includes(n)) {
          const liste = evaluate(knoten.args[0], ctx);
          const arr = Array.isArray(liste) ? liste : (liste == null ? [] : [liste]);

          if (n === 'reduce') {
            /* reduce(liste, start, ausdruck) — im Ausdruck stehen acc und current */
            let acc = evaluate(knoten.args[1], ctx);
            const ausdruck = knoten.args[2];
            arr.forEach((el, i) => {
              acc = evaluate(ausdruck, { ...ctx, vars: { ...ctx.vars, acc, current: el, index: i } });
            });
            return acc;
          }

          const schluessel = (el, i) =>
            evaluate(knoten.args[1], { ...ctx, vars: { ...ctx.vars, current: el, index: i } });

          if (n === 'sortby') {
            const paare = arr.map((el, i) => ({ el, k: schluessel(el, i) }));
            const absteigend = knoten.args[2] !== undefined && wahr(evaluate(knoten.args[2], ctx));
            paare.sort((a, b) => {
              const x = a.k, y = b.k;
              const zahlen = !isNaN(parseFloat(x)) && !isNaN(parseFloat(y));
              const v = zahlen ? zahl(x) - zahl(y) : text(x).localeCompare(text(y), 'de');
              return absteigend ? -v : v;
            });
            return paare.map(p => p.el);
          }

          /* groupBy — gibt eine Liste von Gruppen zurück.
             Auslesen mit groupKey(), groupItems(), groupCount(). */
          const karte = new Map();
          arr.forEach((el, i) => {
            const k = text(schluessel(el, i));
            if (!karte.has(k)) karte.set(k, []);
            karte.get(k).push(el);
          });
          return [...karte.entries()].map(([k, v]) =>
            ({ [GRUPPE]: true, schluessel: k, eintraege: v }));
        }

        /* ================================================================ *
         * ÜBER NOTION HINAUS — Abfragen über eine ANDERE Datenbank
         * Notion braucht dafür zwingend eine Verknüpfung. Hier reicht der
         * Name der Datenbank. In der Bedingung steht `current` für die Zeile.
         *   sumWhere("Rechnungen", current.prop("Kunde") == prop("Name"), current.prop("Betrag"))
         * ================================================================ */
        if (['findrows','rows','countwhere','sumwhere','firstwhere','lastwhere','maxwhere','minwhere'].includes(n)) {
          if (!ctx.db) throw new Error('Hier lassen sich keine anderen Datenbanken lesen');
          const name = text(evaluate(knoten.args[0], ctx));
          const alle = ctx.db(name);
          if (!alle) throw new Error(`Datenbank nicht gefunden: ${name}`);

          const bedingung = knoten.args[1];
          const passt = bedingung === undefined ? alle : alle.filter((el, i) =>
            wahr(evaluate(bedingung, { ...ctx, vars: { ...ctx.vars, current: el, index: i } })));

          if (n === 'findrows' || n === 'rows') return passt;
          if (n === 'countwhere') return passt.length;
          if (n === 'firstwhere') return passt.length ? passt[0] : null;
          if (n === 'lastwhere')  return passt.length ? passt[passt.length - 1] : null;

          const werte = passt.map((el, i) => knoten.args[2] === undefined ? 1
            : zahl(evaluate(knoten.args[2], { ...ctx, vars: { ...ctx.vars, current: el, index: i } })));
          if (n === 'sumwhere') return werte.reduce((a, b) => a + b, 0);
          if (n === 'maxwhere') return werte.length ? Math.max(...werte) : 0;
          if (n === 'minwhere') return werte.length ? Math.min(...werte) : 0;
        }

        /* ================================================================ *
         * EIGENE FUNKTIONEN — Notion hat kein LAMBDA
         * Einmal im Bestand definiert, in jeder Formel nutzbar:
         *     istWerktag(d) = not isWeekend(d)
         *     alter(g)      = dateBetween(today(), g, "years")
         * ================================================================ */
        if (EIGENE[n]) {
          const f = EIGENE[n];
          if ((ctx.tiefe || 0) > 20) throw new Error(`Eigene Funktion ${n}() ruft sich endlos selbst auf`);
          const werte = knoten.args.map(x => evaluate(x, ctx));
          const neueVars = { ...ctx.vars };
          f.params.forEach((pn, i) => { neueVars[pn] = werte[i]; });
          return evaluate(f.baum, { ...ctx, vars: neueVars, tiefe: (ctx.tiefe || 0) + 1 });
        }

        const args = knoten.args.map(x => evaluate(x, ctx));

        /* ================================================================ *
         * ÜBER NOTION HINAUS — die Zeile im Verhältnis zu den anderen
         * Notion-Formeln sehen nur ihre eigene Zeile. Diese hier sehen die
         * Ansicht: ihre Nummer darin, die Zeile davor, die laufende Summe,
         * den Rang. Das ist der grösste einzelne Unterschied zu Notion.
         * ================================================================ */
        if (['rownumber','runningcount','previous','next','runningsum','runningmax','runningmin',
             'rank','percentoftotal','total','average','rowcount','delta'].includes(n)) {
          const z = ctx.zeile;
          if (!z) throw new Error('Das geht nur in einer Datenbankspalte');
          const i = z.index();
          if (n === 'rownumber' || n === 'runningcount') return i + 1;
          if (n === 'rowcount') return z.anzahl();

          const spalte = z.spalte(text(args[0] ?? ''));
          if (n === 'previous') return i > 0 ? spalte[i - 1] : null;
          if (n === 'next')     return i + 1 < spalte.length ? spalte[i + 1] : null;
          if (n === 'delta')    return i > 0 ? zahl(spalte[i]) - zahl(spalte[i - 1]) : 0;

          const bisHier = spalte.slice(0, i + 1).map(zahl).filter(x => isFinite(x));
          if (n === 'runningsum') return bisHier.reduce((a, b) => a + b, 0);
          if (n === 'runningmax') return bisHier.length ? Math.max(...bisHier) : 0;
          if (n === 'runningmin') return bisHier.length ? Math.min(...bisHier) : 0;

          const alleZahlen = spalte.map(zahl).filter(x => isFinite(x));
          const summe = alleZahlen.reduce((a, b) => a + b, 0);
          if (n === 'total')   return summe;
          if (n === 'average') return alleZahlen.length ? summe / alleZahlen.length : 0;
          if (n === 'percentoftotal') return summe === 0 ? 0 : zahl(spalte[i]) / summe;
          if (n === 'rank') {
            const meiner = zahl(spalte[i]);
            const absteigend = args[1] === undefined ? true : wahr(args[1]);
            return 1 + alleZahlen.filter(x => absteigend ? x > meiner : x < meiner).length;
          }
        }

        if (F[n]) return F[n](args);
        throw new Error(`Unbekannte Funktion: ${n}()`);
      }
    }
    return null;
  };

  /* --- Zwischenspeicher für geparste Formeln ----------------------------- */
  const cache = new Map();

  /**
   * Wertet eine Formel aus.
   * @param {string} src        die Formel als Text
   * @param {Function} propFn   liefert den Wert einer Spalte: name => wert
   * @param {Function} [fremdFn] liefert den Wert einer verknüpften Zeile:
   *                            (element, name) => wert
   * @returns {{ok:boolean, wert:*, fehler:string}}
   */
  const run = (src, propFn, fremdFn, umgebung) => {
    if (!src || !src.trim()) return { ok: true, wert: '' };
    try {
      let baum = cache.get(src);
      if (!baum) { baum = parse(tokenize(src)); cache.set(src, baum); }
      const wert = evaluate(baum, {
        props: propFn, fremd: fremdFn, vars: {},
        /* zeile: { index(), anzahl(), spalte(name) } — für rowNumber, previous,
           runningSum, rank … · db: name => Liste der Zeilen einer anderen
           Datenbank — für findRows, sumWhere, countWhere … */
        zeile: umgebung && umgebung.zeile,
        db:    umgebung && umgebung.db
      });
      return { ok: true, wert };
    } catch (e) {
      return { ok: false, wert: '', fehler: e.message };
    }
  };

  /** Prüft eine Formel, ohne sie auf echte Daten loszulassen. */
  const check = (src) => {
    try { parse(tokenize(src)); return { ok: true }; }
    catch (e) { return { ok: false, fehler: e.message }; }
  };

  /** Für die Anzeige in einer Tabellenzelle. */
  const anzeige = (wert) => {
    if (wert instanceof Date) return F.formatdate([wert, 'DD.MM.YYYY']);
    if (typeof wert === 'boolean') return wert ? '✅' : '☐';
    return text(wert);
  };

  /** Der Baum zu einer Formel — für Werkzeuge, die daran arbeiten wollen. */
  const baumVon = (src) => parse(tokenize(src));

  /** Alle Funktionsnamen, die diese Maschine wirklich kennt.
      register/formeln.js vergleicht damit seine Beschreibungen: eine
      Funktion ohne Beschreibung findet niemand, eine Beschreibung ohne
      Funktion ist ein Versprechen, das beim Tippen bricht. */
  const namen = () => [...Object.keys(F), ...Object.keys(ALIAS), ...Object.keys(EIGENE),
    /* Diese dreizehn stehen nicht in `F`: `evaluate` behandelt sie selbst,
       weil sie ihre Argumente faul auswerten oder auf die Zeile zugreifen.
       Sie fehlten hier trotzdem — die Maschine konnte sie, sagte es aber
       nicht. Damit meldete `Register.formeln.abgleich()` jede Beschreibung
       für sie als „Versprechen ohne Funktion", und die Vervollständigung im
       Formeleditor bot sie nie an. */
    'if','ifs','let','lets','map','filter','find','findindex','some','every','prop',
    'rownumber','runningcount','previous','next','runningsum','runningmax','runningmin',
    'rank','percentoftotal','total','average','rowcount','delta',
    'countwhere','sumwhere','findrows','firstwhere','lastwhere','maxwhere','minwhere',
    'random','randombetween','reduce','groupby','sortby',
    'businessdaysbetween','addbusinessdays','isweekend','converttimezone',
    'startofmonth','endofmonth','startofweek','endofweek',
    'startofquarter','endofquarter','startofyear','endofyear'];

  return { run, check, anzeige, text, zahl, wahr, F, setzeBibliothek, bibliothek,
           baumVon, tokenize, parse, namen };
})();

window.Formula = Formula;
