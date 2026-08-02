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
    if (Array.isArray(v)) return v.join(', ');
    if (typeof v === 'number') return String(Math.round(v * 1e10) / 1e10);
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
    formatdate: a => {
      const d = alsDatum(a[0]); if (!d) return '';
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

  /* Der eigentliche Auswerter */
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
        const n = knoten.name;

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

        const args = knoten.args.map(x => evaluate(x, ctx));

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
  const run = (src, propFn, fremdFn) => {
    if (!src || !src.trim()) return { ok: true, wert: '' };
    try {
      let baum = cache.get(src);
      if (!baum) { baum = parse(tokenize(src)); cache.set(src, baum); }
      const wert = evaluate(baum, { props: propFn, fremd: fremdFn, vars: {} });
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

  return { run, check, anzeige, text, zahl, wahr, F };
})();
