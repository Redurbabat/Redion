/* ==========================================================================
 * NOTIONFORMAT — Notions eigene Schreibweisen lesen und schreiben
 * --------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/dateien/format.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/dateien/format.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notion speichert einen Eigenschaftswert nicht als „80", sondern als
 *
 *     [["80"]]
 *
 * — eine Liste von Textstücken, und jedes Stück ist selbst eine Liste aus
 * Text und Auszeichnungen. Aus „Hallo" fett wird [["Hallo",[["b"]]]], aus
 * einem Datum [["‣",[["d",{…}]]]], aus einer Verknüpfung eine Kette aus
 * ‣-Zeichen und Kommas.
 *
 * Formeln speichert Notion als Baum:
 *
 *     {"type":"function","name":"add","args":[ … ]}
 *
 * Redion speichert beides bewusst anders: Werte flach, Formeln als Text.
 * Das ist einfacher zu lesen, einfacher zu sichern und einfacher zu
 * durchsuchen. Aber wer von Notion herüberkommt oder zurückwill, braucht
 * beide Richtungen — und ohne sie ist ein Notion-Export nur halb lesbar.
 *
 * Dieses Modul übersetzt. Es speichert nichts und ändert nichts; es nimmt
 * eine Form und gibt eine andere zurück.
 *
 * Warum überhaupt? Weil „wir machen das anders" keine Antwort ist, solange
 * die Daten des Menschen im anderen Format liegen.
 * ========================================================================*/
const NotionFormat = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  /* Das Zeichen, mit dem Notion einen Verweis markiert (U+2023). */
  const MARKE = '‣';

  /* ========================================================================
   * 1 · WERTE LESEN — aus Notions Form in eine schlichte
   * ======================================================================*/

  /**
   * [["80"]] → "80"   ·   [["‣",[["d",{start_date:"2026-08-03"}]]]] → "2026-08-03"
   *
   * @param {Array} roh   Notions verschachtelte Form
   * @param {string} typ  unser Spaltentyp, wenn bekannt — hilft bei Zahl,
   *                      Haken und Mehrfachauswahl
   */
  const wertLesen = (roh: any, typ?: string): any => {
    if (roh === null || roh === undefined) return '';
    /* Schon flach? Dann unverändert zurück — so darf man die Funktion
       auf gemischte Daten loslassen, ohne vorher zu prüfen. */
    if (!Array.isArray(roh)) return roh;

    const stuecke = roh.map(teil => {
      if (!Array.isArray(teil)) return String(teil ?? '');
      const text = String(teil[0] ?? '');
      const marken = Array.isArray(teil[1]) ? teil[1] : [];

      for (const m of marken) {
        if (!Array.isArray(m)) continue;
        const art = m[0];
        if (art === 'd') {                       /* Datum */
          const d = m[1] || {};
          const anfang = d.start_date || '';
          const zeit = d.start_time ? 'T' + d.start_time : '';
          const ende = d.end_date ? ' → ' + d.end_date : '';
          return anfang + zeit + ende;
        }
        if (art === 'u') return String(m[1] ?? '');   /* Person */
        if (art === 'p') return String(m[1] ?? '');   /* Seite / Verknüpfung */
        if (art === 'a') return String(m[1] ?? '');   /* Adresse hinter dem Text */
        if (art === 'e') return String(m[1] ?? '');   /* Formel im Text */
      }
      return text;
    });

    /* Verknüpfungen und Mehrfachauswahl kommen als Kette mit Kommas */
    if (typ === 'relation' || typ === 'multi' || typ === 'person') {
      return stuecke.filter(s => s !== ',' && s !== MARKE && s.trim() !== '')
                    .flatMap(s => (typ === 'multi' ? s.split(',') : [s]))
                    .map(s => s.trim()).filter(Boolean);
    }

    const ganz = stuecke.join('');
    if (typ === 'number')   return ganz === '' ? '' : Number(ganz);
    if (typ === 'checkbox') return ganz === 'Yes' || ganz === 'true';
    return ganz;
  };

  /** Eine ganze Zeile: { schluessel: [[…]] } → { schluessel: wert } */
  const zeileLesen = (props: any, schema: any): any => {
    const raus: Record<string, any> = {};
    Object.entries(props || {}).forEach(([k, v]) => {
      raus[k] = wertLesen(v, (schema && schema[k] || {}).type);
    });
    return raus;
  };

  /* ========================================================================
   * 2 · WERTE SCHREIBEN — aus unserer Form in Notions
   * ======================================================================*/

  /** "80" → [["80"]]   ·   ["a","b"] bei multi → [["a,b"]] */
  const wertSchreiben = (wert: any, typ: string): any => {
    if (wert === null || wert === undefined || wert === '') return [];

    if (typ === 'checkbox' || typeof wert === 'boolean')
      return [[wert === true || wert === 'true' || wert === 'Yes' ? 'Yes' : 'No']];

    if (typ === 'date') {
      const s = String(wert);
      const [tag, zeit] = s.split('T');
      const d: Record<string, any> = { type: zeit ? 'datetime' : 'date', start_date: tag };
      if (zeit) d['start_time'] = zeit.slice(0, 5);
      return [[MARKE, [['d', d]]]];
    }

    if (typ === 'relation' || typ === 'person') {
      const liste = Array.isArray(wert) ? wert : [wert];
      const art = typ === 'person' ? 'u' : 'p';
      const raus: any[] = [];
      liste.filter(Boolean).forEach((id, i) => {
        if (i) raus.push([',']);
        raus.push([MARKE, [[art, String(id)]]]);
      });
      return raus;
    }

    if (typ === 'multi')
      return [[(Array.isArray(wert) ? wert : [wert]).filter(Boolean).join(',')]];

    if (typ === 'files') {
      const liste = Array.isArray(wert) ? wert : [wert];
      const raus: any[] = [];
      liste.filter(Boolean).forEach((f, i) => {
        if (i) raus.push([',']);
        const name = f && f.name ? f.name : String(f);
        const adr  = f && f.url  ? f.url  : String(f);
        raus.push([name, [['a', adr]]]);
      });
      return raus;
    }

    return [[String(wert)]];
  };

  const zeileSchreiben = (props: any, schema: any): any => {
    const raus: Record<string, any> = {};
    Object.entries(props || {}).forEach(([k, v]) => {
      raus[k] = wertSchreiben(v, (schema && schema[k] || {}).type);
    });
    return raus;
  };

  /* ========================================================================
   * 3 · AUSZEICHNUNGEN — Notions Marken und unser Markdown
   * ======================================================================*/
  const MARKEN = [['b', '**'], ['i', '*'], ['s', '~~'], ['_', '__'], ['c', '`']];

  /** [["Hallo",[["b"]]]," Welt"] → "**Hallo** Welt" */
  const alsMarkdown = (roh: any): string => {
    if (!Array.isArray(roh)) return String(roh ?? '');
    return roh.map(teil => {
      if (!Array.isArray(teil)) return String(teil ?? '');
      let t = String(teil[0] ?? '');
      const marken = Array.isArray(teil[1]) ? teil[1] : [];
      /* Ein Link umschliesst den Text, die anderen legen sich darum */
      const link = marken.find(m => Array.isArray(m) && m[0] === 'a');
      MARKEN.forEach(([kurz, zeichen]) => {
        if (marken.some(m => Array.isArray(m) && m[0] === kurz)) t = zeichen + t + zeichen;
      });
      if (link) t = '[' + t + '](' + (link[1] || '') + ')';
      return t;
    }).join('');
  };

  /** "**Hallo** Welt" → [["Hallo",[["b"]]],[" Welt"]] */
  const ausMarkdown = (text: string): any => {
    const s = String(text ?? '');
    if (!s) return [];
    const raus = [];
    /* Reihenfolge zählt: ** vor *, ~~ vor ~ — sonst frisst das kürzere
       Zeichen den Anfang des längeren. */
    const muster = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(~~([^~]+)~~)|(`([^`]+)`)|(\*([^*]+)\*)/g;
    let zuletzt = 0, m;
    while ((m = muster.exec(s)) !== null) {
      if (m.index > zuletzt) raus.push([s.slice(zuletzt, m.index)]);
      if (m[1])      raus.push([m[2], [['a', m[3]]]]);
      else if (m[4]) raus.push([m[5], [['b']]]);
      else if (m[6]) raus.push([m[7], [['_']]]);
      else if (m[8]) raus.push([m[9], [['s']]]);
      else if (m[10]) raus.push([m[11], [['c']]]);
      else if (m[12]) raus.push([m[13], [['i']]]);
      zuletzt = m.index + m[0].length;
    }
    if (zuletzt < s.length) raus.push([s.slice(zuletzt)]);
    return raus;
  };

  /* ========================================================================
   * 4 · FORMELN — Notions Baum, Version 2
   * ------------------------------------------------------------------------
   * Notion legt eine Formel als JSON-Baum ab. Operatoren sind dort keine
   * Zeichen, sondern Funktionen: aus a + b wird add(a, b). Unser Parser
   * baut einen eigenen Baum; hier werden beide ineinander übersetzt.
   * ======================================================================*/

  /* Notions Namen für unsere Operatoren */
  const OP_ZU_NOTION = {
    '+': 'add', '-': 'subtract', '*': 'multiply', '/': 'divide',
    '%': 'mod', '^': 'pow', '==': 'equal', '!=': 'unequal',
    '>': 'larger', '>=': 'largerEq', '<': 'smaller', '<=': 'smallerEq',
    'and': 'and', 'or': 'or'
  };
  const NOTION_ZU_OP = Object.fromEntries(
    Object.entries(OP_ZU_NOTION).map(([a, b]) => [b, a]));

  /* Welcher Ergebnistyp gehört zu welcher Funktion? Notion schreibt ihn
     an jeden Knoten. Wir raten ihn aus dem Namen — falsch geraten schadet
     nichts, denn gerechnet wird bei uns ohnehin nicht danach. */
  const ART = (name: string): string => {
    if (['add','subtract','multiply','divide','mod','pow','abs','round','ceil',
         'floor','sqrt','length','toNumber','sum','min','max','mean','median',
         'timestamp','day','month','year','hour','minute','dateBetween']
        .includes(name)) return 'number';
    if (['equal','unequal','larger','largerEq','smaller','smallerEq','and','or',
         'not','empty','contains','test','startsWith','endsWith'].includes(name))
      return 'checkbox';
    if (['now','today','dateAdd','dateSubtract','date','parseDate','fromTimestamp',
         'dateStart','dateEnd'].includes(name)) return 'date';
    return 'text';
  };

  /** Unser Baum → Notions Baum. */
  const alsNotionBaum = (knoten: any): any => {
    if (!knoten || typeof knoten !== 'object') return null;
    const k = knoten.k;

    if (k === 'num')  return { type: 'constant', result_type: 'number',
                               value_type: 'number', value: String(knoten.v) };
    if (k === 'str')  return { type: 'constant', result_type: 'text',
                               value_type: 'string', value: String(knoten.v) };
    if (k === 'bool') return { type: 'constant', result_type: 'checkbox',
                               value_type: 'boolean', value: knoten.v ? 'true' : 'false' };
    if (k === 'null') return { type: 'constant', result_type: 'text',
                               value_type: 'string', value: '' };
    if (k === 'var')  return { type: 'symbol', result_type: 'text', name: knoten.name };

    if (k === 'neg')  return { type: 'operator', result_type: 'number', name: 'subtract',
                               args: [{ type: 'constant', result_type: 'number',
                                        value_type: 'number', value: '0' },
                                      alsNotionBaum(knoten.a)] };
    if (k === 'not')  return { type: 'function', result_type: 'checkbox', name: 'not',
                               args: [alsNotionBaum(knoten.a)] };

    if (k === 'bin') {
      const name = (OP_ZU_NOTION as Record<string, string>)[knoten.op] || knoten.op;
      /* Notion nennt die Rechenzeichen „operator", die Wörter „function" */
      const istZeichen = !['and', 'or'].includes(knoten.op);
      return { type: istZeichen ? 'operator' : 'function', result_type: ART(name),
               name, args: [alsNotionBaum(knoten.l), alsNotionBaum(knoten.r)] };
    }

    if (k === 'list') return { type: 'function', result_type: 'text', name: 'concat',
                               args: knoten.items.map(alsNotionBaum) };

    if (k === 'call') {
      /* prop("Preis") ist in Notion kein Aufruf, sondern ein eigener Knoten */
      if (knoten.name === 'prop' && knoten.args[0] && knoten.args[0].k === 'str')
        return { type: 'property', result_type: 'text',
                 name: knoten.args[0].v, id: knoten.args[0].v };
      return { type: 'function', result_type: ART(knoten.name),
               name: knoten.name, args: (knoten.args || []).map(alsNotionBaum) };
    }
    return null;
  };

  /** Formeltext → Notions Baum (JSON-fähig). */
  const formelAlsNotion = (text: string): any => {
    if (typeof Formula === 'undefined' || !Formula.baumVon) return null;
    try { return alsNotionBaum(Formula.baumVon(String(text || ''))); }
    catch { return null; }
  };

  /* --- Und zurück ------------------------------------------------------- */

  /** Setzt Klammern nur, wo sie nötig sind — sonst wird jede Formel ein Igel. */
  const RANG = { 'or': 1, 'and': 2, '==': 3, '!=': 3, '>': 3, '>=': 3, '<': 3, '<=': 3,
                 '+': 4, '-': 4, '*': 5, '/': 5, '%': 5, '^': 6 };

  const ausNotionBaum = (n: any, aussenRang = 0): any => {
    if (!n || typeof n !== 'object') return '';
    const typ = n.type;

    if (typ === 'constant') {
      if (n.value_type === 'number' || n.value_type === 'boolean') return String(n.value);
      return '"' + String(n.value ?? '').replace(/"/g, '\\"') + '"';
    }
    if (typ === 'property') return 'prop("' + String(n.name ?? '') + '")';
    if (typ === 'symbol')   return String(n.name ?? '');

    const args = Array.isArray(n.args) ? n.args : [];
    const op = (NOTION_ZU_OP as Record<string, string>)[n.name];

    if (op && args.length === 2) {
      const rang = (RANG as Record<string, number>)[op] || 0;
      const s = ausNotionBaum(args[0], rang) + ' ' + op + ' ' + ausNotionBaum(args[1], rang + 1);
      return rang < aussenRang ? '(' + s + ')' : s;
    }
    if (n.name === 'not' && args.length === 1) return 'not(' + ausNotionBaum(args[0]) + ')';

    return String(n.name ?? '') + '(' + args.map((a: any) => ausNotionBaum(a)).join(', ') + ')';
  };

  /** Notions Baum → Formeltext, den unser Parser wieder liest. */
  const formelAusNotion = (baum: any): string => {
    const b = typeof baum === 'string' ? (() => { try { return JSON.parse(baum); }
                                                  catch { return null; } })() : baum;
    return b ? ausNotionBaum(b) : '';
  };

  /**
   * Hin und zurück, zum Prüfen: kommt derselbe Sinn wieder heraus?
   * Gibt { ok, hin, zurueck } — hin ist Notions Baum, zurueck unser Text.
   */
  const rundlauf = (text: string): any => {
    const hin = formelAlsNotion(text);
    if (!hin) return { ok: false, hin: null, zurueck: '', fehler: 'Formel nicht lesbar' };
    const zurueck = formelAusNotion(hin);
    const pruef = typeof Formula !== 'undefined' ? Formula.check(zurueck) : { ok: true };
    return { ok: !!pruef.ok, hin, zurueck, fehler: pruef.fehler || '' };
  };

  /* ========================================================================
   * 5 · SEITEN-IDS
   * ------------------------------------------------------------------------
   * Notion schreibt IDs mal mit, mal ohne Bindestriche. Beim Einlesen eines
   * Exports stehen sie ohne — verglichen wird aber mit welchen.
   * ======================================================================*/
  const idMitStrichen = (id: unknown): string => {
    const s = String(id || '').replace(/-/g, '');
    if (s.length !== 32) return String(id || '');
    return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' +
           s.slice(16, 20) + '-' + s.slice(20);
  };
  const idOhneStriche = (id: unknown): string => String(id || '').replace(/-/g, '');

  /* ========================================================================
   * 6 · EIN FENSTER ZUM ANSCHAUEN
   * ------------------------------------------------------------------------
   * Damit das hier nicht nur eine Bibliothek ist, die niemand sieht: ein
   * kleines Werkzeug, in das man beides hineinwerfen kann.
   * ======================================================================*/
  /* ------------------------------------------------------------------------
   * NOCH EIN UNGENUTZTES `esc`, wie in clipper.ts. Das Fenster unten setzt
   * jeden Text über `textContent` ein, nicht über `innerHTML` — dort gibt es
   * nichts zu entschärfen, weil der Browser den Text ohnehin als Text
   * behandelt.
   *
   * Eine Fluchtfunktion, die trotzdem dasteht, liest sich wie eine Zusage.
   * Wer die Datei überfliegt, denkt, hier werde geschützt — und übersieht
   * beim nächsten Umbau, dass `innerHTML` an dieser Stelle NICHT erlaubt
   * wäre. `noUnusedLocals` hat sie gefunden; sie ist weg.
   * ----------------------------------------------------------------------*/

  const dialog = (): void => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(720px,95vw)">' +
        '<div class="fh">🔁 Notion-Formate <button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" style="padding:16px; display:flex; flex-direction:column; gap:14px">' +
          '<div style="font-size:12.5px; color:var(--text-dim); line-height:1.6">' +
            'Notion speichert Werte verschachtelt (<code>[["80"]]</code>) und Formeln als ' +
            'Baum. Redion speichert beides flach. Hier lässt sich beides ineinander ' +
            'übersetzen — nützlich beim Umzug in die eine oder die andere Richtung.' +
          '</div>' +
          '<label style="font-size:13px">Formel<br>' +
            '<input id="nf-formel" spellcheck="false" ' +
              'value=\'if(prop("Menge") * prop("Preis") > 100, "teuer", "günstig")\'></label>' +
          '<div style="display:flex; gap:8px; flex-wrap:wrap">' +
            '<button data-a="hin" class="prim">In Notions Baum</button>' +
            '<button data-a="rund">Hin und zurück prüfen</button>' +
          '</div>' +
          '<pre id="nf-aus" style="font-size:12px; background:var(--bg-code,rgba(0,0,0,.05)); ' +
            'padding:11px; border-radius:7px; max-height:210px; overflow:auto; ' +
            'white-space:pre-wrap; margin:0"></pre>' +
          '<hr style="border:none;border-top:1px solid var(--line)">' +
          '<label style="font-size:13px">Notions Wert<br>' +
            '<input id="nf-wert" spellcheck="false" value=\'[["Hallo",[["b"]]],[" Welt"]]\'></label>' +
          '<div style="display:flex; gap:8px; flex-wrap:wrap">' +
            '<button data-a="lesen">Flach lesen</button>' +
            '<button data-a="md">Als Markdown</button>' +
          '</div>' +
          '<pre id="nf-aus2" style="font-size:12px; background:var(--bg-code,rgba(0,0,0,.05)); ' +
            'padding:11px; border-radius:7px; max-height:150px; overflow:auto; ' +
            'white-space:pre-wrap; margin:0"></pre>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);

    const zeig = (id: string, t: string): void => { const el = o.querySelector(id); if (el) el.textContent = t; };
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const a = elVon(e)?.closest<HTMLElement>('[data-a]');
      if (!a) return;
      const formel = o.querySelector<HTMLTextAreaElement | HTMLInputElement>('#nf-formel')?.value ?? '';
      const wert = o.querySelector<HTMLTextAreaElement | HTMLInputElement>('#nf-wert')?.value ?? '';

      if (a.dataset.a === 'hin') {
        const b = formelAlsNotion(formel);
        zeig('#nf-aus', b ? JSON.stringify(b, null, 2) : 'Die Formel liess sich nicht lesen.');
      }
      if (a.dataset.a === 'rund') {
        const r = rundlauf(formel);
        zeig('#nf-aus', (r.ok ? '✅ Hin und zurück ergibt wieder eine gültige Formel:\n\n'
                              : '⚠ ' + r.fehler + '\n\n') + r.zurueck +
                        '\n\n— Notions Baum —\n' + JSON.stringify(r.hin, null, 2));
      }
      if (a.dataset.a === 'lesen' || a.dataset.a === 'md') {
        let roh;
        try { roh = JSON.parse(wert); }
        catch { zeig('#nf-aus2', 'Das ist kein gültiges JSON.'); return; }
        zeig('#nf-aus2', a.dataset.a === 'md'
          ? alsMarkdown(roh)
          : JSON.stringify(wertLesen(roh, 'text'), null, 2));
      }
    });
  };

  return { wertLesen, wertSchreiben, zeileLesen, zeileSchreiben,
           alsMarkdown, ausMarkdown, MARKEN, MARKE,
           formelAlsNotion, formelAusNotion, alsNotionBaum, ausNotionBaum, rundlauf,
           OP_ZU_NOTION, NOTION_ZU_OP,
           idMitStrichen, idOhneStriche, dialog };
})();

(window as any).NotionFormat = NotionFormat;
