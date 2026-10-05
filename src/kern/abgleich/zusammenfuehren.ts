/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/abgleich/zusammenfuehren.ts (npm run bauen:ts). */
/* ============================================================================
 * zusammen.js — Zusammenführen statt Überschreiben
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/abgleich/zusammenfuehren.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/kern/abgleich/zusammenfuehren.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Idee 8 der 10000×-Liste: „Konfliktfreie Zusammenarbeit". Die Notion-KI
 * schreibt dazu selbst, warum Notion das nicht hat: Text-CRDTs sind schon
 * schwer, Datenbank- und Rechte-CRDTs deutlich schwerer.
 *
 * Der erste Abgleich hier konnte nur „meins oder deins": wer später
 * gespeichert hat, gewinnt, der andere verliert seine Arbeit — still, ohne
 * eine Zeile Hinweis. Das ist der schlimmste Datenverlust, den es gibt,
 * weil niemand merkt, dass er stattgefunden hat.
 *
 * Mit dem letzten gemeinsamen Stand geht mehr. Drei Fassungen liegen vor:
 *
 *      BASIS   – wie der Satz aussah, als beide Geräte ihn gleich sahen
 *      HIER    – wie er auf diesem Gerät jetzt aussieht
 *      DORT    – wie er auf dem anderen Gerät jetzt aussieht
 *
 * Daraus lässt sich sagen, WER WAS geändert hat. Hat nur einer ein Feld
 * angefasst, kommt seine Änderung durch. Haben beide dasselbe Feld
 * verschieden gesetzt, ist es wirklich ein Konflikt — und der wird gezeigt,
 * statt heimlich entschieden.
 *
 * Drei Stufen, von grob nach fein:
 *
 *   1. FELDWEISE   – A ändert den Status, B die Priorität: beides bleibt.
 *   2. WORTWEISE   – A schreibt am Anfang des Absatzes, B am Ende: beides
 *                    bleibt. Erst wenn beide dieselbe Stelle ändern, hakt es.
 *   3. LISTENWEISE – A hängt einen Block an, B löscht einen anderen: beides
 *                    bleibt, und die Reihenfolge stimmt danach noch.
 *
 * Was übrig bleibt, landet in der Konfliktliste mit beiden Fassungen
 * nebeneinander und einer Wahl. Nichts wird weggeworfen, bevor jemand
 * hingesehen hat.
 * ==========================================================================*/

const Zusammen = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  const gleich = (a: unknown, b: unknown): boolean => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

  /* Sehr grosse Texte werden nicht wortweise verglichen — der Vergleich
     kostet Länge × Länge, und ein 10 000-Wort-Block würde die Oberfläche
     einfrieren. Dann lieber ehrlich einen Konflikt melden. */
  const MAX_WORTE = 4000;

  /* ==========================================================================
   * 1 · WORTWEISE — der Vergleich zweier Texte
   * ========================================================================*/

  /** In Wörter und Zwischenräume zerlegen, so dass join('') wieder passt. */
  const teile = (s: any) => String(s ?? '').split(/(\s+)/).filter(x => x !== '');

  /**
   * Die längste gemeinsame Folge zweier Wortlisten.
   * Klassisch über eine Tabelle — für Blocktexte ist das schnell genug,
   * und die Grenze oben verhindert den Ausrutscher nach oben.
   * @returns {Array<{a:number,b:number}>} die Paare gleicher Wörter
   */
  /** Ein Paar gleicher Stellen: `a` in der einen, `b` in der anderen Fassung. */
  type Paar = { a: number; b: number };

  const lcs = (A: string[], B: string[]): Paar[] => {
    const n = A.length, m = B.length;
    /* Gleiche Anfänge und Enden vorweg abziehen — das macht den teuren
       Teil in der Praxis winzig, weil zwei Fassungen meist fast gleich sind. */
    let vorn = 0;
    while (vorn < n && vorn < m && A[vorn] === B[vorn]) vorn++;
    let hinten = 0;
    while (hinten < n - vorn && hinten < m - vorn &&
           A[n - 1 - hinten] === B[m - 1 - hinten]) hinten++;

    const a = A.slice(vorn, n - hinten), b = B.slice(vorn, m - hinten);
    const paare: Paar[] = [];
    for (let i = 0; i < vorn; i++) paare.push({ a: i, b: i });

    const ni = a.length, mi = b.length;
    if (ni && mi) {
      /* Dieselben zwei Handgriffe wie in `fassungen.ts`: die Tabelle ist
         (ni+1)×(mi+1) gross und die Schleifen laufen nur bis ni-1 bzw.
         mi-1 — jeder Zugriff trifft. TypeScript weiss das nicht, und
         zwölfmal `!` zu schreiben sagt weniger als zwei benannte Zeilen. */
      const t = Array.from({ length: ni + 1 }, () => new Uint32Array(mi + 1));
      const tab = (i: number, j: number): number => t[i]?.[j] ?? 0;
      const setzeTab = (i: number, j: number, w: number): void => { const z = t[i]; if (z) z[j] = w; };

      for (let i = ni - 1; i >= 0; i--)
        for (let j = mi - 1; j >= 0; j--)
          setzeTab(i, j, a[i] === b[j] ? tab(i + 1, j + 1) + 1
                                       : Math.max(tab(i + 1, j), tab(i, j + 1)));
      let i = 0, j = 0;
      while (i < ni && j < mi) {
        if (a[i] === b[j]) { paare.push({ a: vorn + i, b: vorn + j }); i++; j++; }
        else if (tab(i + 1, j) >= tab(i, j + 1)) i++;
        else j++;
      }
    }
    for (let k = 0; k < hinten; k++) paare.push({ a: n - hinten + k, b: m - hinten + k });
    return paare;
  };

  /**
   * Die Änderungen von `basis` nach `neu` als Stücke:
   * „ersetze basis[von…bis) durch diese Wörter".
   */
  const stuecke = (B: string[], N: string[]): { von: number; bis: number; ersatz: string[] }[] => {
    const paare = lcs(B, N);
    const out: { von: number; bis: number; ersatz: string[] }[] = [];
    let i = 0, j = 0;
    for (const p of [...paare, { a: B.length, b: N.length }]) {
      if (p.a > i || p.b > j) out.push({ von: i, bis: p.a, ersatz: N.slice(j, p.b) });
      i = p.a + 1; j = p.b + 1;
    }
    return out;
  };

  /**
   * Drei Texte zu einem machen.
   * @returns {{text:string, konflikt:boolean}}
   */
  const textDreiWege = (basis: unknown, hier: unknown, dort: unknown): any => {
    const b = String(basis ?? ''), h = String(hier ?? ''), d = String(dort ?? '');
    if (h === d) return { text: h, konflikt: false };
    if (b === h) return { text: d, konflikt: false };
    if (b === d) return { text: h, konflikt: false };

    const B = teile(b), H = teile(h), D = teile(d);
    if (B.length > MAX_WORTE || H.length > MAX_WORTE || D.length > MAX_WORTE)
      return { text: h, konflikt: true };

    const sh = stuecke(B, H), sd = stuecke(B, D);

    /* Überschneiden sich zwei Änderungen, ist es einer. Zwei Einfügungen an
       derselben Stelle überschneiden sich nicht — dann stehen beide da,
       meine zuerst. Lieber ein Satz zu viel als ein Satz zu wenig. */
    for (const x of sh)
      for (const y of sd)
        if (x.von < y.bis && y.von < x.bis) return { text: h, konflikt: true };

    const alle = [...sh, ...sd].sort((p, q) => p.von - q.von || p.bis - q.bis);
    const raus: string[] = [];
    let pos = 0;
    for (const x of alle) {
      if (x.von >= pos) raus.push(...B.slice(pos, x.von));
      raus.push(...x.ersatz);
      pos = Math.max(pos, x.bis);
    }
    raus.push(...B.slice(pos));
    return { text: raus.join(''), konflikt: false };
  };

  /* ==========================================================================
   * 2 · LISTENWEISE — Reihenfolgen mit Einfügen und Löschen
   * ========================================================================*/

  /**
   * Drei Listen von Kennungen (z. B. die Kinder einer Seite) zu einer machen.
   * Gelöscht wird, was einer gelöscht hat. Neu ist, was einer angehängt hat —
   * an der Stelle, an der er es angehängt hat.
   * @returns {{liste:Array, konflikt:boolean}}
   */
  const listeDreiWege = (basis: any[], hier: any[], dort: any[]): any => {
    const B = Array.isArray(basis) ? basis : [];
    const H = Array.isArray(hier) ? hier : [];
    const D = Array.isArray(dort) ? dort : [];
    if (gleich(H, D)) return { liste: H, konflikt: false };
    if (gleich(B, H)) return { liste: D, konflikt: false };
    if (gleich(B, D)) return { liste: H, konflikt: false };

    const inH = new Set(H), inD = new Set(D), inB = new Set(B);
    const weg = new Set(B.filter(x => !inH.has(x) || !inD.has(x)));

    /* Die gemeinsame Reihenfolge: hat nur einer umsortiert, gilt seine. */
    const nurAlte = (L: any) => L.filter((x: any) => inB.has(x) && !weg.has(x));
    const oB = B.filter(x => !weg.has(x)), oH = nurAlte(H), oD = nurAlte(D);
    let grund, konflikt = false;
    if (gleich(oH, oD))      grund = oH.slice();
    else if (gleich(oH, oB)) grund = oD.slice();
    else if (gleich(oD, oB)) grund = oH.slice();
    else { grund = oH.slice(); konflikt = true; }

    /* Neues einbauen — jeweils hinter das Element, hinter dem es stand. */
    const einbauen = (L: any[]): void => {
      L.forEach((x: any, i: any) => {
        if (inB.has(x) || grund.includes(x)) return;
        let anker = -1;
        for (let k = i - 1; k >= 0; k--) {
          const p = grund.indexOf(L[k]);
          if (p >= 0) { anker = p; break; }
        }
        /* Hat die andere Seite an derselben Stelle schon etwas eingehängt,
           dann dahinter — sonst überholt der zweite Neuzugang den ersten und
           die Reihenfolge kippt um. */
        while (anker + 1 < grund.length && !inB.has(grund[anker + 1])) anker++;
        grund.splice(anker + 1, 0, x);
      });
    };
    einbauen(H); einbauen(D);
    return { liste: grund, konflikt };
  };

  /* ==========================================================================
   * 3 · FELDWEISE — der ganze Satz
   * ========================================================================*/

  /* Felder, die nie ein Konflikt sind: Zeitstempel und Zählwerke. Bei ihnen
     gewinnt schlicht der grössere Wert. Ein „Konflikt" im Datum der letzten
     Änderung wäre eine Frage, auf die es keine sinnvolle Antwort gibt. */
  const ZEIT = new Set(['edited', 'updated', 'created', 'wolkeVersion', 'version',
                        'lastEdited', 'zuletzt']);

  /* Felder, deren Inhalt Text ist und deshalb wortweise zusammengeht. */
  const TEXT = new Set(['text', 'name', 'title', 'beschreibung', 'notiz', 'caption']);

  /* Felder, die Listen von Kennungen sind. */
  const LISTE = new Set(['content', 'children', 'viewIds', 'spalten', 'reihenfolge']);

  const istObjekt = (x: unknown): boolean => !!x && typeof x === 'object' && !Array.isArray(x);

  /**
   * Der Kern: drei Fassungen eines Satzes zu einer.
   *
   * @param {Object} basis  der letzte gemeinsame Stand (null = keiner bekannt)
   * @param {Object} hier   die Fassung auf diesem Gerät
   * @param {Object} dort   die Fassung vom Server
   * @returns {{satz:Object, konflikte:Array, zusammengefuehrt:boolean}}
   */
  const dreiWege = (basis: any, hier: any, dort: any): any => {
    const konflikte: any[] = [];

    /* Ohne gemeinsamen Stand bleibt nur der Zeitpunkt — dann ist es kein
       Zusammenführen, sondern eine Entscheidung, und die wird gemeldet. */
    if (!basis) {
      if (gleich(hier, dort)) return { satz: hier, konflikte: [], zusammengefuehrt: false };
      const neuerDort = String(dort?.edited || '') > String(hier?.edited || '');
      konflikte.push({
        pfad: [], feld: 'die ganze Seite', hier, dort,
        grund: 'Kein gemeinsamer Stand bekannt — beide Fassungen sind vollständig.'
      });
      return { satz: neuerDort ? dort : hier, konflikte, zusammengefuehrt: false };
    }

    let gemischt = false;

    const geheDurch = (b: any, h: any, d: any, pfad: string[]): Record<string, any> => {
      const raus: Record<string, any> = {};
      const namen = new Set([...Object.keys(b || {}), ...Object.keys(h || {}), ...Object.keys(d || {})]);

      for (const k of namen) {
        const B = (b || {})[k], H = (h || {})[k], D = (d || {})[k];
        const p = [...pfad, k];

        if (gleich(H, D))      { if (H !== undefined) raus[k] = H; continue; }
        if (gleich(B, H))      { if (D !== undefined) raus[k] = D; gemischt = true; continue; }
        if (gleich(B, D))      { if (H !== undefined) raus[k] = H; continue; }

        /* Ab hier haben beide dasselbe Feld angefasst. */

        if (ZEIT.has(k)) {
          const x = String(H ?? ''), y = String(D ?? '');
          raus[k] = (typeof H === 'number' || typeof D === 'number')
            ? Math.max(Number(H) || 0, Number(D) || 0)
            : (x > y ? H : D);
          continue;
        }

        if (TEXT.has(k) && typeof H === 'string' && typeof D === 'string') {
          const r = textDreiWege(B, H, D);
          raus[k] = r.text;
          if (r.konflikt) konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D,
            grund: 'Beide haben dieselbe Stelle im Text geändert.' });
          else gemischt = true;
          continue;
        }

        if (LISTE.has(k) && Array.isArray(H) && Array.isArray(D)) {
          const r = listeDreiWege(B, H, D);
          raus[k] = r.liste;
          if (r.konflikt) konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D,
            grund: 'Beide haben die Reihenfolge verschieden geändert.' });
          else gemischt = true;
          continue;
        }

        if (istObjekt(H) && istObjekt(D)) {   /* props, schema, format … */
          raus[k] = geheDurch(istObjekt(B) ? B : {}, H, D, p);
          continue;
        }

        /* Zwei einfache Werte, beide geändert: das ist ein echter Konflikt.
           Bis jemand entscheidet, bleibt der eigene Wert stehen — auf dem
           eigenen Gerät die eigene Arbeit zu sehen ist das Erwartbare. */
        raus[k] = H !== undefined ? H : D;
        konflikte.push({ pfad: p, feld: pfadName(p), hier: H, dort: D,
          grund: 'Beide haben diesen Wert verschieden gesetzt.' });
      }
      return raus;
    };

    const satz = geheDurch(basis, hier || {}, dort || {}, []);
    return { satz, konflikte, zusammengefuehrt: gemischt && !konflikte.length ? true : gemischt };
  };

  /** Aus einem Pfad einen lesbaren Namen machen. */
  const pfadName = (p: string[]): string => {
    if (!p.length) return 'die ganze Seite';
    const uebersetzt: Record<string, string> = { text: 'Text', props: 'Eigenschaft', schema: 'Spalte',
                         content: 'Reihenfolge', name: 'Name', format: 'Darstellung',
                         filter: 'Filter', sorts: 'Sortierung', type: 'Typ' };
    return p.map((x: any) => uebersetzt[x] || x).join(' › ');
  };

  /* ==========================================================================
   * 4 · DIE KONFLIKTLISTE
   * ========================================================================*/

  const MAX_KONFLIKTE = 200;

  const offene = (): any[] => Store.getMeta('konflikte', []) || [];

  /** Nach dem Abgleich: was übrig blieb, in die Liste. */
  const merke = (id: string, tabelle: string, liste: any[]): number => {
    if (!liste || !liste.length) return 0;
    const alt = offene();
    const jetzt = Store.now();
    liste.forEach((k: any) => {
      const schluessel = id + '|' + (k.pfad || []).join('.');
      /* Derselbe Konflikt zweimal ist einer — sonst wächst die Liste bei
         jedem Abgleich weiter, obwohl sich nichts geändert hat. */
      const i = alt.findIndex((x: any) => x.schluessel === schluessel);
      const satz = { schluessel, id, tabelle, pfad: k.pfad || [], feld: k.feld,
                     hier: k.hier, dort: k.dort, grund: k.grund, wann: jetzt };
      if (i >= 0) alt[i] = satz; else alt.push(satz);
    });
    Store.setMeta('konflikte', alt.slice(-MAX_KONFLIKTE));
    return liste.length;
  };

  /** Einen Wert tief in einem Satz setzen. */
  const setzeTief = (obj: any, pfad: string[], wert: unknown): any => {
    if (!pfad.length) return wert;
    let z = obj;
    for (let i = 0; i < pfad.length - 1; i++) {
      const s = pfad[i];
      if (s === undefined) continue;
      if (!istObjekt(z[s])) z[s] = {};
      z = z[s];
    }
    const letzt = pfad[pfad.length - 1];
    if (letzt === undefined) return obj;
    if (wert === undefined) delete z[letzt];
    else z[letzt] = wert;
    return obj;
  };

  const satzHolen = (tabelle: string, id: string): any =>
    tabelle === 'collections' ? Store.cache.collections[id]
    : tabelle === 'views'     ? Store.cache.views[id]
    : Store.cache.blocks[id];

  /**
   * Einen Konflikt entscheiden.
   * @param {string} schluessel
   * @param {'hier'|'dort'} wahl
   */
  const loese = (schluessel: string, wahl: string): boolean => {
    const liste = offene();
    const k = liste.find((x: any) => x.schluessel === schluessel);
    if (!k) return false;

    if (wahl === 'dort') {
      const satz = satzHolen(k.tabelle, k.id);
      if (satz) {
        if (!k.pfad.length) Object.assign(satz, k.dort);
        else setzeTief(satz, k.pfad, k.dort);
        satz.edited = Store.now();
        satz.id = k.id;
        Store.rohSetzen(k.tabelle, satz);
        try { App.zeichneSeite(); App.zeichneBaum(); } catch {}
      }
    }
    Store.setMeta('konflikte', liste.filter((x: any) => x.schluessel !== schluessel));
    return true;
  };

  const alleLoesen = (wahl: string): number => {
    const liste = offene();
    liste.slice().forEach((k: any) => loese(k.schluessel, wahl));
    return liste.length;
  };

  /* ==========================================================================
   * 5 · DAS FENSTER
   * ========================================================================*/

  const kurz = (v: unknown): string => {
    if (v === undefined) return '<i>gelöscht</i>';
    if (v === null || v === '') return '<i>leer</i>';
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return esc(s.length > 400 ? s.slice(0, 400) + ' …' : s);
  };

  const titelVon = (k: any): string => {
    const s = satzHolen(k.tabelle, k.id);
    if (!s) return 'Gelöschter Eintrag';
    return s.text || s.name || (k.tabelle === 'views' ? 'Ansicht' : 'Ohne Titel');
  };

  const dialog = (): HTMLElement => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(760px,96vw)">' +
      '<div class="fh">⚖ Zwei Fassungen<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div class="res" id="zu-inhalt" style="padding:18px;max-height:70vh;overflow:auto"></div></div>';
    document.body.appendChild(o);

    const zeichne = (): void => {
      const liste = offene();
      const ziel = o.querySelector('#zu-inhalt');
      /* Ohne das Ziel gibt es nichts zu zeichnen. Vorher stand hier
         ungeprüft `ziel.innerHTML = …`: wäre das Fenster in der Zwischenzeit
         geschlossen worden, hätte das mitten im Neuzeichnen geworfen. */
      if (!ziel) return;
      if (!liste.length) {
        ziel.innerHTML = '<p style="opacity:.75">Nichts offen. Der letzte Abgleich ging ' +
          'ohne Reibung durch — was auf beiden Geräten verschieden war, betraf ' +
          'verschiedene Felder und wurde zusammengeführt.</p>';
        return;
      }
      ziel.innerHTML =
        '<p style="opacity:.8;margin-top:0">' + liste.length + ' Stelle' +
        (liste.length === 1 ? '' : 'n') + ', an der beide Geräte dasselbe verschieden ' +
        'geändert haben. Bis hier eine Wahl steht, gilt die eigene Fassung — ' +
        'verworfen wird nichts.</p>' +
        '<div style="display:flex;gap:8px;margin:12px 0 18px">' +
          '<button class="btn" data-alle="hier">Überall meine behalten</button>' +
          '<button class="btn" data-alle="dort">Überall die anderen nehmen</button>' +
        '</div>' +
        liste.map((k: any) =>
          '<div style="border:1px solid var(--line,#ddd);border-radius:8px;padding:12px;margin-bottom:12px">' +
            '<div style="font-weight:600">' + esc(titelVon(k)) + '</div>' +
            '<div style="opacity:.7;font-size:.9em;margin-bottom:8px">' +
              esc(k.feld) + ' · ' + esc(k.grund || '') + '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
              '<div><div style="font-size:.85em;opacity:.7;margin-bottom:4px">Hier</div>' +
                '<div style="background:var(--bg-card);padding:8px;border-radius:6px;' +
                'white-space:pre-wrap;word-break:break-word">' + kurz(k.hier) + '</div>' +
                '<button class="btn" style="margin-top:6px;width:100%" ' +
                'data-w="hier" data-k="' + esc(k.schluessel) + '">Diese behalten</button></div>' +
              '<div><div style="font-size:.85em;opacity:.7;margin-bottom:4px">Anderes Gerät</div>' +
                '<div style="background:var(--bg-card);padding:8px;border-radius:6px;' +
                'white-space:pre-wrap;word-break:break-word">' + kurz(k.dort) + '</div>' +
                '<button class="btn" style="margin-top:6px;width:100%" ' +
                'data-w="dort" data-k="' + esc(k.schluessel) + '">Diese nehmen</button></div>' +
            '</div>' +
          '</div>').join('');
    };

    o.addEventListener('click', (e) => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const alle = elVon(e)?.closest<HTMLElement>('[data-alle]');
      if (alle) { alleLoesen(alle.dataset.alle ?? ''); zeichne(); melde(); return; }
      const w = elVon(e)?.closest<HTMLElement>('[data-w]');
      if (w) { loese(w.dataset.k ?? '', w.dataset.w ?? ''); zeichne(); melde(); }
    });

    zeichne();
    return o;
  };

  /* ==========================================================================
   * 6 · DER HINWEIS
   * ========================================================================*/

  /** Ein stiller Konflikt ist ein verlorener Konflikt — also nicht still. */
  const melde = (): number => {
    const n = offene().length;
    document.querySelectorAll<HTMLElement>('[data-konflikt-zahl]').forEach(el => {
      el.textContent = n ? String(n) : '';
      el.style.display = n ? '' : 'none';
    });
    return n;
  };

  const hinweisen = (): void => {
    const n = offene().length;
    if (!n) return;
    const t = UI.toast(n + ' Stelle' + (n === 1 ? '' : 'n') + ' braucht eine Entscheidung', 9000);
    /* Der Hinweis ist anklickbar — sonst weiss man, dass etwas ist, aber
       nicht, wo man hinschauen soll. Ein Konflikt, den man nicht findet,
       ist so gut wie keiner. */
    const el = document.getElementById('toast');
    if (el) {
      el.style.cursor = 'pointer';
      const auf = () => { el.removeEventListener('click', auf); if (t) t.remove(); dialog(); };
      el.addEventListener('click', auf);
      setTimeout(() => el.removeEventListener('click', auf), 9000);
    }
  };

  const start = () => { melde(); };

  return {
    dreiWege, textDreiWege, listeDreiWege, teile, stuecke, lcs,
    offene, merke, loese, alleLoesen, dialog, melde, hinweisen, start,
    pfadName, setzeTief
  };
})();

(window as any).Zusammen = Zusammen;
