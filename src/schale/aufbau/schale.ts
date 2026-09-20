/* ============================================================================
 * app.js — Die Anwendung
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/schale/aufbau/schale.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/schale/aufbau/schale.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Hält alles zusammen: Seitenleiste, Seitenanzeige, Suche, Tastenkürzel,
 * Einstellungen, Papierkorb, Sicherung, Navigation.
 * ==========================================================================*/

/* ==========================================================================
 * KLEINE OBERFLÄCHENHELFER
 * ========================================================================*/


/* ==========================================================================
 * DIE ANWENDUNG
 * ========================================================================*/
const App = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  let seiteId: any = null;
  const esc = (s: any): string => String(s ?? '')
    .replace(/[<>&"]/g, c =>
      ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;' } as Record<string, string>)[c] ?? c);

  const aktuelleSeite = () => seiteId;
  const setzeSeite = (id: string | null) => { seiteId = id; };

  /* --- Navigationsverlauf (Strg + [ und Strg + ]) ------------------------ */
  type Navigationsort = { seite: string } | { titel: string; zeichner: any; hash: string };
  const rueck: Navigationsort[] = [], vor: Navigationsort[] = [];
  let navSperre = false;
  const navOrt = (): Navigationsort | null => seiteId ? { seite: String(seiteId) }
    : sonder ? { titel: sonder.titel, zeichner: sonder.zeichner, hash: location.hash } : null;
  const navMerken = (): void => {
    if (navSperre) return;
    const ort = navOrt();
    if (ort) { rueck.push(ort); if (rueck.length > 100) rueck.shift(); }
    vor.length = 0;
  };
  const navOeffnen = (ort: Navigationsort): void => {
    navSperre = true;
    try {
      if ('seite' in ort) oeffne(ort.seite);
      else { zeigeSonder(ort.titel, ort.zeichner); location.hash = ort.hash; }
    } finally { navSperre = false; navKnoepfeStellen(); }
  };

  /* DIE KNÖPFE SAGEN VORHER, OB SIE KÖNNEN (Audit F15).
     Vorher waren `‹` und `›` immer anklickbar und meldeten erst NACH dem
     Druck „Kein Schritt zurück". Ein Knopf, der aktiv aussieht und dann
     nichts tut, ist ein Fehlmoment, den niemand braucht — und für ein
     Vorleseprogramm war der Unterschied überhaupt nicht hörbar.

     `disabled` statt nur blass: dann überspringt ihn auch die Tabtaste,
     und der Zustand steht im Zugänglichkeitsbaum. Die Tastenkürzel
     Strg + [ und Strg + ] behalten ihre Meldung — dort gibt es keinen
     Knopf, an dem man den Zustand vorher sehen könnte. */
  const navKnoepfeStellen = (): void => {
    const setz = (id: string, kann: boolean): void => {
      const k = document.getElementById(id) as HTMLButtonElement | null;
      if (!k) return;
      k.disabled = !kann;
      k.title = kann
        ? (id === 'btn-back' ? 'Zurück (Strg + [)' : 'Vorwärts (Strg + ])')
        : (id === 'btn-back' ? 'Zurück — kein Schritt vorhanden'
                             : 'Vorwärts — kein Schritt vorhanden');
    };
    setz('btn-back', rueck.length > 0 || !!seiteId);
    if (!rueck.length && seiteId) {
      const back = document.getElementById('btn-back');
      if (back) back.title = 'Zur Dokumentübersicht (Strg + [)';
    }
    setz('btn-fwd', vor.length > 0);
  };

  const zurueck = () => {
    const ziel = rueck.pop();
    const jetzt = navOrt();
    if (!ziel && !seiteId) { UI.toast('Kein Schritt zurück'); return; }
    if (jetzt) vor.push(jetzt);
    if (ziel) navOeffnen(ziel);
    else {
      // A directly opened or restored page still needs a way out.
      navSperre = true;
      try { Register.navigation.eines('bibliothekOben')?.tun?.(); }
      finally { navSperre = false; navKnoepfeStellen(); }
    }
  };
  const vorwaerts = () => {
    if (!vor.length) { UI.toast('Kein Schritt vorwärts'); return; }
    const ziel = vor.pop()!;
    const jetzt = navOrt();
    if (jetzt) rueck.push(jetzt);
    navOeffnen(ziel);
  };

  /* ------------------------------------------------------------------------
   * Was zuletzt offen war — Notions „Kürzlich verwendet".
   * ----------------------------------------------------------------------*/
  const kuerzlichMerken = (id: string) => {
    const b = Store.getBlock(id);
    if (!b || b.type !== 'page' || b.parentTable === 'collection') return;
    const l = [id, ...(Store.getMeta('kuerzlich', []) || []).filter((x: any) => x !== id)];
    Store.setMeta('kuerzlich', l.slice(0, 12));
  };

  const kuerzlich = () => (Store.getMeta('kuerzlich', []) || [])
    .map((id: any) => Store.getBlock(id))
    .filter((b: any) => b && b.alive && b.type === 'page' && b.parentTable !== 'collection')
    .slice(0, 6);

  /* ------------------------------------------------------------------------
   * EIN TAG IST KEIN ZEITPUNKT (E229)
   * ------------------------------------------------------------------------
   * `new Date('2026-08-27')` ist nach ECMAScript-Regel UTC-Mitternacht, nicht
   * Mitternacht hier. Verglichen wurde danach mit LOKALER Mitternacht, und
   * angezeigt wurde eine Ortszeit. Gemessen an derselben Aufgabe, die kein
   * einziges Mal eine Uhrzeit hat:
   *
   *     UTC                 00:00  00:00  00:00
   *     Europe/Zurich       02:00  02:00  02:00
   *     Pacific/Auckland    12:00  12:00          ← nur noch ZWEI
   *
   * Die dritte fehlte. Die Verschiebung hatte sie über die Tagesgrenze aus
   * dem Fenster geschoben. Eine erfundene Uhrzeit ist ärgerlich; ein Termin,
   * der auf manchen Geräten gar nicht mehr dasteht, ist ein Datenfehler.
   *
   * Die Unterscheidung gibt es in Redion schon — die Kalenderansicht fragt
   * `String(v).length > 10`: zehn Zeichen sind ein Tag, mehr ist ein
   * Zeitpunkt. Sie stand nur nicht hier. Ein Wert, zwei Antworten, und die
   * zweite war falsch.
   * ----------------------------------------------------------------------*/
  /** Zehn Zeichen sind ein Kalendertag, alles Längere trägt eine Uhrzeit. */
  const nurTag = (wert: unknown): boolean => /^\d{4}-\d{2}-\d{2}$/.test(String(wert).trim());

  /** Ein Kalendertag wird zu Mitternacht HIER, nicht zu Mitternacht in UTC. */
  const alsDatum = (wert: unknown): Date => {
    const t = String(wert).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(t);
  };

  /** Die nächsten Termine aus allen Termin-Datenbanken. */
  const kommendeTermine = (wieViele = 3) => {
    const raus: any[] = [];
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    const grenze = new Date(heute); grenze.setDate(grenze.getDate() + 30);
    Object.values<any>(Store.cache.collections).forEach(c => {
      const dk = Object.keys(c.schema || {}).find(k => c.schema[k].type === 'date');
      if (!dk) return;
      Store.rowsOf(c.id).forEach(r => {
        const v = Datenbank.wert(r, dk, c);
        if (!v) return;
        const d = alsDatum(v);
        if (isNaN(d.getTime()) || d < heute || d > grenze) return;
        raus.push({ id: r.id, text: r.text || 'Ohne Titel', d, ganztags: nurTag(v),
                    wann: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }) });
      });
    });
    return raus.sort((a, b) => a.d - b.d).slice(0, wieViele);
  };

  /* ========================================================================
   * DIE SEITENLEISTE — sie liegt jetzt nebenan
   * ------------------------------------------------------------------------
   * Rund 600 Zeilen standen hier: Abschnitte, Reihenfolge, Klappen, Reiter,
   * der Baum. Sie liegen in `schale/aufbau/seitenleiste.js`.
   *
   * Was hier bleibt, sind Weiterreichungen — und zwar aus einem Grund, nicht
   * aus Bequemlichkeit: `zeichneBaum` steht an über fünfzig Stellen im
   * Projekt und an sechsundzwanzig weiteren in dieser Datei. Diese Aufrufe
   * alle umzuschreiben wäre viel Arbeit für keinen Gewinn und ein hohes
   * Risiko — jede übersehene Stelle wäre ein Fehler, den erst ein Mensch
   * findet. Genau so hält es `UI` für `Menue`, `Hinweis` und `Dialog`.
   * ======================================================================*/
  const zeichneBaum        = ()   => Seitenleiste.zeichne();
  const handyLeiste        = ()   => Seitenleiste.handyLeiste();
  const reiterWechseln     = (id: string) => Seitenleiste.reiterWechseln(id);
  const abschnitteAnpassen = ()   => Seitenleiste.abschnitteAnpassen();
  const abschnittAn        = (id: string) => Seitenleiste.abschnittAn(id);
  const abschnittSchalten  = (id: string) => Seitenleiste.abschnittSchalten(id);
  const ABSCHNITTE         = Seitenleiste.ABSCHNITTE;

  /* ========================================================================
   * DAS SEITENMENÜ (⋯) — der vollständige Notion-Umfang
   * ======================================================================*/
  /** Wie viele Wörter stehen auf der Seite? Notion zeigt das im Seitenmenü. */
  const woerterZaehlen = (seiteId: string) => {
    let n = 0;
    const zaehle = (id: string, tiefe: number) => {
      if (tiefe > 4) return;
      Store.childrenOf(id).forEach((b: any) => {
        if (b.type === 'page') return;
        if (b.text) n += b.text.trim().split(/\s+/).filter(Boolean).length;
        if (Array.isArray(b.rows)) n += b.rows.flat().join(' ').split(/\s+/).filter(Boolean).length;
        zaehle(b.id, tiefe + 1);
      });
    };
    zaehle(seiteId, 0);
    return n;
  };

  /* ------------------------------------------------------------------ *
   * ÜBERSETZEN, VORSCHLÄGE, BENACHRICHTIGUNGEN, VERBINDUNGEN
   * Vier Einträge, die es bei Notion im Seitenmenü gibt.
   * ------------------------------------------------------------------ */

  const SPRACHEN = [
    ['Deutsch', 'Deutsch'], ['Englisch', 'English'], ['Französisch', 'Français'],
    ['Italienisch', 'Italiano'], ['Spanisch', 'Español'], ['Portugiesisch', 'Português'],
    ['Niederländisch', 'Nederlands'], ['Polnisch', 'Polski'], ['Türkisch', 'Türkçe'],
    ['Russisch', 'Русский'], ['Japanisch', '日本語'], ['Koreanisch', '한국어'],
    ['Chinesisch (vereinfacht)', '简体中文']
  ];

  /* Notion kennt genau zwei Stufen, nicht drei. */
  const BENACHRICHTIGUNG = { alle: 'Kommentare', erwaehnungen: 'Erwähnungen' };

  /** Eine Menüzeile mit echtem Schalter rechts — so macht es Notion. */
  const schalterZeile = (a: any, icon: any, text: string, an: any) =>
    `<button data-a="${a}" class="mit-schalter" role="switch" aria-checked="${an ? 'true' : 'false'}">` +
    `<span class="mi">${icon}</span>${text}` +
    `<span class="mschalter${an ? ' an' : ''}"><i></i></span></button>`;

  /**
   * Der Schalter kippt an zwei Stellen, und bis hierher kippte nur die
   * FARBE: `.an` färbt die Pille ein, und mehr stand nirgends. Damit war
   * der Zustand ausschliesslich über Farbe zu erkennen — genau das, was
   * §38 verbietet, und ein Vorleseprogramm las eine Schaltfläche ohne
   * jeden Zustand vor. Beide Stellen gehen deshalb durch diese Funktion:
   * zwei Aufrufer, eine Wahrheit (§8).
   */
  const schalterKippen = (knopf: Element | null, an: boolean): void => {
    if (!knopf) return;
    knopf.querySelector('.mschalter')?.classList.toggle('an', an);
    knopf.setAttribute('aria-checked', an ? 'true' : 'false');
  };

  /**
   * „Mit KI verwenden" — bei Notion macht dieser Eintrag aus der Seite
   * selbst etwas für die KI: eine Fähigkeit, eine dauerhafte Anweisung
   * oder die Anweisung für Besprechungsnotizen. Darunter stehen bei uns
   * zusätzlich die Schreibbefehle.
   */
  const mitKiMenue = (anker: any, p: any) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<button data-k="faehig"><span class="mi">🧩</span>Als KI-Fähigkeit verwenden' +
        '<span class="sub">Der Seiteninhalt wird zur Anweisung, aufrufbar mit @</span></button>' +
      '<button data-k="anweisung"><span class="mi">📌</span>Als KI-Anweisung verwenden' +
        '<span class="sub">Gilt dann für jede Antwort</span></button>' +
      '<button data-k="meeting"><span class="mi">🎙</span>Als KI-Meeting-Anweisung verwenden' +
        '<span class="sub">Nur beim Auswerten von Besprechungen</span></button>' +
      '<hr>' +
      '<button data-k="schreiben"><span class="mi">✒️</span>Schreiben und bearbeiten …</button>',
      r.right + 4, r.top);

    m.addEventListener('click', async e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-k]');
      if (!b) return;
      m.remove();
      const inhalt = markdownVonSeite(p).trim();
      if (b.dataset.k !== 'schreiben' && !inhalt) {
        UI.toast('Diese Seite ist leer — sie kann noch keine Anweisung sein');
        return;
      }
      if (b.dataset.k === 'faehig') {
        const name = await UI.frage('Wie soll die Fähigkeit heissen?', p.text || 'Neue Fähigkeit');
        if (!name) return;
        KI.faehigkeitSichern({ id: 'seite-' + p.id.slice(0, 6), name,
                               icon: p.icon || '🧩', auftrag: inhalt, seiteId: p.id });
        UI.toast('Als Fähigkeit gemerkt: ' + name);
      }
      if (b.dataset.k === 'anweisung') {
        Store.setMeta('ki:persoenlich', inhalt);
        Store.setMeta('ki:anweisungSeite', p.id);
        UI.toast('Diese Seite ist jetzt die dauerhafte Anweisung der KI');
      }
      if (b.dataset.k === 'meeting') {
        Store.setMeta('meeting:anweisung', inhalt);
        Store.setMeta('meeting:anweisungSeite', p.id);
        UI.toast('Gilt ab jetzt beim Auswerten von Besprechungen');
      }
      if (b.dataset.k === 'schreiben') KI.schreibMenue(anker);
    });
  };

  const uebersetzenMenue = (anker: any, p: any) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menuMitSuche(
      SPRACHEN.map(([de, eigen]) =>
        `<button data-s="${esc(de)}">${esc(de)}<span class="ms">${esc(eigen)}</span></button>`).join(''),
      r.right + 4, r.top,
      { platzhalter: 'Sprache suchen …',
        kopf: '<div class="grp">Übersetzen</div>',
        fuss: 'Übersetzt wird mit dem Modell, das unter <b>Einstellungen → KI</b> eingestellt ist.' });

    m.addEventListener('click', async e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-s]');
      if (!b) return;
      const ziel = b.dataset.s;
      m.remove();

      const text = markdownVonSeite(p);
      if (!text.trim()) { UI.toast('Diese Seite ist leer'); return; }
      UI.toast('Übersetze nach ' + ziel + ' …');
      try {
        const antwort = await KI.frageKurz(
          `Übersetze den folgenden Text nach ${ziel}. Behalte die Markdown-Struktur ` +
          '(Überschriften, Listen, Zitate) genau bei. Gib nur die Übersetzung aus, ' +
          'ohne Vorrede.\n\n' + text);
        if (!antwort) { UI.toast('Keine Antwort erhalten'); return; }
        const neu = Store.addPage(p.parentId || null, {
          text: (p.text || 'Ohne Titel') + ' — ' + ziel, icon: '🅰'
        });
        Werkzeuge.ausMarkdown(neu, antwort);
        zeichneBaum(); oeffne(neu.id);
        UI.toast('Übersetzung als neue Seite angelegt');
      } catch (err) {
        UI.toast('Übersetzen ging nicht: ' + (err instanceof Error ? err.message : String(err)));
      }
    });
  };

  /**
   * Vorschlagsmodus. Solange er an ist, wird jede Textänderung als Vorschlag
   * festgehalten statt einfach übernommen — mit Balken zum Annehmen oder
   * Verwerfen, wie bei Notion.
   */
  const vorschlagModus = (p: any) => {
    const an = !p.vorschlagModus;
    Store.updateBlock(p.id, { vorschlagModus: an });
    document.getElementById('banner')?.remove();
    if (an) {
      const wer = (Konten.aktiv() || {}).name || 'Ich';
      const b = UI.banner('✍ Vorschlagsmodus an — Änderungen von <b>' + esc(wer) +
        '</b> werden als Vorschläge festgehalten. ' +
        '<u data-a="zeigen">Vorschläge ansehen</u> · <u data-a="ende">Beenden</u>', 'info');
      b.addEventListener('click', e => {
        const ziel = elVon(e);
        const wahl = ziel instanceof HTMLElement ? ziel.dataset.a : '';
        if (wahl === 'zeigen') vorschlaegeZeigen(Store.getBlock(p.id));
        if (wahl === 'ende') {
          Store.updateBlock(p.id, { vorschlagModus: false });
          b.remove(); zeichneSeite();
        }
      });
    }
    zeichneSeite();
  };

  const vorschlaegeZeigen = (p: any) => {
    const liste = p.vorschlaege || [];
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        `<div class="fh">Vorschläge <em>${liste.length}</em><button class="icon-btn" data-a="zu">✕</button></div>` +
        '<div class="res">' +
          (liste.length
            ? liste.map((v: any, i: any) =>
                '<div class="vor-eintrag">' +
                  `<div class="vor-wer">${esc(v.von)} · ${esc(Werkzeuge.zeitKurz(v.wann))}</div>` +
                  `<div class="vor-alt">${esc(v.alt || '(leer)')}</div>` +
                  `<div class="vor-neu">${esc(v.neu || '(gelöscht)')}</div>` +
                  `<div class="vor-tat"><button data-ok="${i}">Annehmen</button>` +
                  `<button data-weg="${i}">Verwerfen</button></div>` +
                '</div>').join('')
            : '<div style="padding:16px;color:var(--text-faint);font-size:14px">' +
              'Noch keine Vorschläge. Ändere Text, solange der Modus an ist.</div>') +
        '</div>' +
        '<div class="hint">Angenommene Vorschläge werden Teil der Seite, verworfene ' +
        'setzen den alten Text zurück.</div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const ok = elVon(e)?.closest<HTMLElement>('[data-ok]'), weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (!ok && !weg) return;
      const i = Number((ok || weg)?.dataset[ok ? 'ok' : 'weg']);
      const v = (p.vorschlaege || [])[i];
      if (!v) return;
      if (weg && Store.getBlock(v.bid)) Store.updateBlock(v.bid, { text: v.alt });
      const rest = (p.vorschlaege || []).filter((_: any, j: any) => j !== i);
      Store.updateBlock(p.id, { vorschlaege: rest });
      o.remove(); zeichneSeite(); vorschlaegeZeigen(Store.getBlock(p.id));
    });
  };

  const updatesUndAnalysen = async (p: any) => {
    const versionen = (await Store.versionen(p.id)) || [];
    const kinder = Store.childrenOf(p.id);
    const woerter = woerterZaehlen(p.id);
    const komm = Kommentare.offeneAnzahl(p.id);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<div class="fh">Updates und Analysen<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res" style="padding:14px 16px; font-size:14px; line-height:1.9">' +
          `<div>Aufrufe: <b>${p.aufrufe || 0}</b></div>` +
          `<div>Blöcke: <b>${kinder.length}</b> · Wörter: <b>${woerter}</b></div>` +
          `<div>Offene Kommentare: <b>${komm}</b></div>` +
          `<div>Gespeicherte Fassungen: <b>${versionen.length}</b></div>` +
          `<div>Angelegt: <b>${esc(Einstellungen.datum(new Date(p.created), true))}</b></div>` +
          `<div>Zuletzt bearbeitet: <b>${esc(Einstellungen.datum(new Date(p.edited || p.created), true))}</b>` +
          ` von <b>${esc(p.geaendertVon || p.erstelltVon || 'dir')}</b></div>` +
          '<div style="margin-top:12px"><button data-a="verl" class="btn prim">Versionsverlauf öffnen</button></div>' +
        '</div>' +
        '<div class="hint">Alle Zahlen stammen aus diesem Gerät — es wird nichts gemeldet.</div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="verl"]')) { o.remove(); Werkzeuge.versionen(p); }
    });
  };

  const benachrichtigungMenue = (anker: any, p: any) => {
    const r = anker.getBoundingClientRect();
    const jetzt = p.benachrichtigung || 'alle';
    const m = UI.menu(
      `<button data-b="alle">Alle Kommentare${jetzt === 'alle' ? '<span class="ms">✓</span>' : ''}</button>` +
      '<button data-b="erwaehnungen">Antworten und @-Erwähnungen' +
        (jetzt === 'erwaehnungen' ? '<span class="ms">✓</span>' : '') + '</button>' +
      '<div class="menu-fuss">Gilt für diese Seite und alle Unterseiten.</div>',
      r.right + 4, r.top);
    m.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-b]');
      if (!b) return;
      const wahl = b.dataset.b ?? 'alle';
      Store.updateBlock(p.id, { benachrichtigung: wahl });
      m.remove();
      UI.toast('Benachrichtigungen: ' + (BENACHRICHTIGUNG as Record<string, string>)[wahl]);
    });
  };

  const verbindungenMenue = (anker: any, p: any) => {
    const r = anker.getBoundingClientRect();
    const dienste = Verbindungen.DIENSTE || [];
    const zst = Verbindungen.zustand();
    const drin = p.verbindungen || [];
    const m = UI.menu('<div class="grp">Verbindungen</div>' +
      (dienste.length
        ? dienste.map(d =>
            `<button data-v="${d.id}"><span class="mi">${d.icon || '⊞'}</span>${esc(d.name || d.id)}` +
            `<span class="ms">${drin.includes(d.id) ? 'verknüpft'
              : ((zst[d.id] || {}).verbunden ? 'bereit' : 'aus')}</span></button>`).join('')
        : '<div class="menu-fuss">Keine</div>') +
      '<hr><button data-v="__einst"><span class="mi">⚙</span>Verbindungen einrichten …</button>',
      r.right + 4, r.top);
    m.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-v]');
      if (!b) return;
      m.remove();
      if (b.dataset.v === '__einst') { einstellungen('verbindungen'); return; }
      const id = b.dataset.v;
      const neu = drin.includes(id) ? drin.filter((x: any) => x !== id) : [...drin, id];
      Store.updateBlock(p.id, { verbindungen: neu });
      const name = (dienste.find(d => d.id === id) || {}).name || id;
      UI.toast(neu.includes(id) ? 'Seite mit ' + name + ' verknüpft' : 'Verknüpfung zu ' + name + ' gelöst');
    });
  };

  const seitenMenue = (anker: any, p: any) => {
    const r = anker.getBoundingClientRect();
    const bereichAnzahl = typeof Lebensbereiche !== 'undefined'
      ? Lebensbereiche.direkteBereichIds(p).length : 0;
    const m = UI.menuMitSuche(
      /* Darstellung */
      '<div class="schrift-kacheln">' +
        [['default','Ag','Standard'],['serif','Ag','Serife'],['mono','Ag','Mono']]
          .map(([id, ag, n]) =>
            `<button data-schrift="${id}" class="${(p.font || 'default') === id ? 'on' : ''}">` +
            `<b class="sk-${id}">${ag}</b><span>${n}</span></button>`).join('') +
      '</div>' +
      /* Seitenaktionen — Reihenfolge wie in Notions Menü */
      '<button data-a="link"><span class="mi">🔗</span>Link kopieren<span class="ms">Strg Alt L</span></button>' +
      '<button data-a="inhalt"><span class="mi">📋</span>Seiteninhalte kopieren</button>' +
      '<button data-a="dup"><span class="mi">⧉</span>Duplizieren<span class="ms">Strg D</span></button>' +
      '<button data-a="wz-verschieben"><span class="mi">➦</span>Verschieben nach<span class="ms">Strg ⇧ P</span></button>' +
      `<button data-a="archiv"><span class="mi">🗄</span>${p.archiviert ? 'Aus dem Archiv holen' : 'Archivieren'}</button>` +
      '<button data-a="del"><span class="mi">🗑</span>In den Papierkorb verschieben<span class="ms">Entf</span></button>' +
      '<hr>' +
      '<button data-a="wz-praesi"><span class="mi">▶</span>Präsentieren' +
        '<span class="kenn">Beta</span><span class="ms">Strg Alt P</span></button>' +
      schalterZeile('klein', '↕', 'Kleiner Text', p.small) +
      schalterZeile('breit', '↔', 'Volle Breite', p.wide) +
      schalterZeile('pfad', '🗂', 'Pfadnavigation anzeigen', p.pfad !== false) +
      '<button data-a="anpassen"><span class="mi">⚙</span>Seite anpassen<span class="ms">▸</span></button>' +
      '<hr>' +
      '<button data-a="offline"><span class="mi">⭳</span>Offline verfügbar' +
        '<span class="ms">immer</span></button>' +
      '<hr>' +
      schalterZeile('wz-gesperrt', '🔒', 'Seite sperren', p.gesperrt) +
      '<button data-a="mitki"><span class="mi">✨</span>Mit KI verwenden<span class="ms">▸</span></button>' +
      '<hr>' +
      /* Auf dem Telefon ist die Kopfzeile schmal wie in Notion: nur ☰, ‹,
         Titel und ⋯. Alles andere steht hier, sonst wäre es unerreichbar.
         In der ruhigen Fassung (E219) gilt derselbe Grund am Rechner: die
         fünf Zeichen sind aus der Kopfzeile heraus, und der EINZIGE Weg,
         den sie dann noch haben, ist dieser hier. Deshalb steht die
         Bedingung an genau der Stelle, an der auch das Verstecken hängt —
         wer eines ändert, sieht das andere. */
      ((UI.amTelefon() || (typeof Ruhig !== 'undefined' && Ruhig.an()))
        ? '<button data-a="teilen"><span class="mi">↗</span>Teilen und ausgeben</button>' +
          '<button data-a="verlauf"><span class="mi">🕘</span>Versionsverlauf</button>' +
          '<button data-a="kopf-komm"><span class="mi">💬</span>Kommentare</button>' +
          '<button data-a="auto"><span class="mi">⚡</span>Automationen</button><hr>'
        : '') +
      `<button data-a="fav"><span class="mi">${p.favorite ? '★' : '☆'}</span>` +
      `${p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}</button>` +
      `<button data-a="produkt-bereiche"><span class="mi">◎</span>Lebensbereiche` +
        `<span class="ms">${bereichAnzahl || 'Keine'} ▸</span></button>` +
      '<button data-a="rename"><span class="mi">✎</span>Umbenennen</button>' +
      '<button data-a="icon"><span class="mi">😀</span>Symbol ändern</button>' +
      '<button data-a="cover"><span class="mi">🖼</span>Cover ändern</button>' +
      '<button data-a="pid"><span class="mi">#</span>Seiten-ID kopieren</button>' +
      '<button data-a="komm"><span class="mi">💬</span>Kommentare</button>' +
      `<button data-a="vorschlag"><span class="mi">✍</span>Änderungen vorschlagen` +
        `<span class="ms">${p.vorschlagModus ? 'an' : 'aus'}</span></button>` +
      ((p.vorschlaege || []).length
        ? `<button data-a="vorschlaege"><span class="mi">📝</span>Vorschläge ansehen` +
          `<span class="ms">${p.vorschlaege.length}</span></button>` : '') +
      '<button data-a="uebersetzen"><span class="mi">🅰</span>Übersetzen<span class="ms">▸</span></button>' +
      '<button data-a="undo"><span class="mi">↶</span>Rückgängig machen<span class="ms">Strg Z</span></button>' +
      '<hr>' +
      /* Daten */
      '<button data-a="export"><span class="mi">⭳</span>Als Markdown</button>' +
      '<button data-a="import"><span class="mi">⭱</span>Markdown einlesen</button>' +
      Werkzeuge.seitenMenueZusatz(p) +
      '<hr>' +
      `<button data-a="stat2"><span class="mi">📈</span>Seitenaufrufe<span class="ms">${p.aufrufe || 0}</span></button>` +
      '<button data-a="updates"><span class="mi">🕘</span>Updates und Analysen</button>' +
      `<button data-a="benach"><span class="mi">🔔</span>Benachrichtigungen` +
        `<span class="ms">${(BENACHRICHTIGUNG as Record<string, string>)[p.benachrichtigung || 'alle']} ▸</span></button>` +
      `<button data-a="verbind"><span class="mi">⊞</span>Verbindungen` +
        `<span class="ms">${(p.verbindungen || []).length || 'Keine'} ▸</span></button>` +
      '<button data-a="papier"><span class="mi">🗑</span>Gelöschte Seiten</button>',
      r.right + 4, r.top,
      { platzhalter: 'Suchaktionen …', titel: 'Aktionen',
        fuss: `Wortzahl: <b>${woerterZaehlen(p.id)}</b> Wörter<br>` +
              `Zuletzt bearbeitet von <b>${esc(p.geaendertVon || p.erstelltVon || 'dir')}</b><br>` +
              esc(Einstellungen.datum(new Date(p.edited || p.created), true)) });

    m.addEventListener('click', async e => {
      /* Nur die Schriftkacheln im Menü, nicht der <body> — der trägt
         ebenfalls ein data-schrift für die Schriftgrösse. Ohne die
         Einschränkung auf button fing dieser Zweig jeden Klick ab. */
      const sk = elVon(e)?.closest<HTMLElement>('button[data-schrift]');
      if (sk) {
        Store.updateBlock(p.id, { font: sk.dataset.schrift });
        m.querySelectorAll('[data-schrift]').forEach(x => x.classList.remove('on'));
        sk.classList.add('on');
        zeichneSeite();
        return;
      }
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      /* Untermenüs bleiben offen */
      if (a === 'icon') {
        m.remove();
        UI.emojiWaehlen(anker, (em) => {
          Store.updateBlock(p.id, { icon: em });
          zeichneBaum();
          if (p.id === seiteId) zeichneSeite();
        });
        return;
      }
      if (a === 'inhalt') {
        const text = markdownVonSeite(p);
        Ablage.kopiereJetzt(text,
          'Seiteninhalte kopiert — ' + text.split('\n').length + ' Zeilen');
        m.remove();
        return;
      }
      if (a === 'offline') {
        UI.toast('Alles liegt ohnehin auf diesem Gerät — auch ohne Netz.');
        return;
      }

      /* „Volle Breite" hat seit E283 einen eigenen Griff und steht deshalb
         VOR dem Sammelzweig — der Schalter kippt trotzdem an Ort und Stelle,
         nur die Schreibarbeit macht `volleBreite`. */
      if (a === 'breit') {
        schalterKippen(b, volleBreite(p));
        return;
      }

      /* Schalter bleiben im Menü stehen und kippen an Ort und Stelle */
      if (a === 'klein' || a === 'wz-gesperrt' || a === 'pfad') {
        const feld = a === 'klein' ? 'small'
                   : a === 'pfad' ? 'pfad' : 'gesperrt';
        const neu = a === 'pfad' ? !(p.pfad !== false) : !p[feld];
        Store.updateBlock(p.id, { [feld]: neu });
        p[feld] = neu;
        schalterKippen(b, neu);
        zeichneSeite();
        return;
      }

      if (a === 'archiv') {
        m.remove();
        const neu = !p.archiviert;
        Store.updateBlock(p.id, { archiviert: neu, archiviertAm: neu ? Store.now() : '' });
        zeichneBaum();
        if (neu && p.id === seiteId) {
          const e2 = Store.rootPages().find(x => !x.archiviert && x.id !== p.id);
          oeffne(e2 ? e2.id : null);
        } else zeichneSeite();
        UI.toast(neu
          ? 'Archiviert — liegt weiter im Papierkorb-Menü unter „Archiv"'
          : 'Aus dem Archiv geholt');
        return;
      }

      if (a === 'mitki') {
        m.remove();
        mitKiMenue(anker, p);
        return;
      }
      if (a === 'stil') {
        m.innerHTML = '<div class="grp">Schrift</div>' +
          '<button data-f="default">Standard</button><button data-f="serif">Serif</button>' +
          '<button data-f="mono">Monospace</button>';
        m.addEventListener('click', ev => {
          const f = elVon(ev)?.closest<HTMLElement>('button[data-f]');
          if (!f) return;
          Store.updateBlock(p.id, { font: f.dataset.f });
          m.remove(); zeichneSeite();
        });
        return;
      }
      if (a === 'anpassen') {
        m.innerHTML = '<div class="grp">Was auf der Seite erscheint</div>' +
          `<button data-o="rueck">Rückverweise<span class="ms">${p.ohneRueck ? 'aus' : 'an'}</span></button>` +
          `<button data-o="werkzeuge">Werkzeugzeile<span class="ms">${p.ohneTools ? 'aus' : 'an'}</span></button>` +
          `<button data-o="gesperrt">Bearbeiten<span class="ms">${p.gesperrt ? 'gesperrt' : 'erlaubt'}</span></button>`;
        m.addEventListener('click', ev => {
          const o = elVon(ev)?.closest<HTMLElement>('button[data-o]');
          if (!o) return;
          if (o.dataset.o === 'rueck') Store.updateBlock(p.id, { ohneRueck: !p.ohneRueck });
          if (o.dataset.o === 'werkzeuge') Store.updateBlock(p.id, { ohneTools: !p.ohneTools });
          if (o.dataset.o === 'gesperrt') Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
          m.remove(); zeichneSeite();
        });
        return;
      }
      if (a === 'cover') {
        m.remove(); coverWaehlen(p);
        return;
      }

      m.remove();

      if (a === 'produkt-bereiche') {
        await Produktwelten.bereicheDialog(p);
        return;
      }

      if (Werkzeuge.seitenMenueAktion(a, p)) return;

      /* Die vier, die auf dem Telefon aus der Kopfzeile hierher gewandert sind */
      if (a === 'teilen')    { Werkzeuge.teilenMenue(anker, p); return; }
      if (a === 'verlauf')   { Werkzeuge.versionen(p); return; }
      if (a === 'kopf-komm') { document.getElementById('btn-komm')?.click(); return; }
      if (a === 'auto')      { document.getElementById('btn-auto')?.click(); return; }
      if (a === 'fav')   { Store.updateBlock(p.id, { favorite: !p.favorite }); zeichneBaum(); }
      if (a === 'klein') { Store.updateBlock(p.id, { small: !p.small }); zeichneSeite(); }
      if (a === 'breit') { volleBreite(p); }
      if (a === 'rename') {
        const n = await UI.frage('Neuer Titel', p.text);
        if (n !== null) { Store.updateBlock(p.id, { text: n }); zeichneBaum(); if (p.id === seiteId) zeichneSeite(); }
      }
      if (a === 'dup')  { dupliziereSeite(p.id, p.parentId); zeichneBaum(); UI.toast('Seite dupliziert'); }
      if (a === 'link') { Ablage.kopiereJetzt(location.origin + location.pathname + '#' + p.id, 'Link kopiert'); }
      if (a === 'pid') {
        Ablage.kopiereJetzt(p.id, 'Seiten-ID kopiert: ' + p.id);
      }
      if (a === 'komm') Kommentare.panel(p.id);
      if (a === 'vorschlag') vorschlagModus(p);
      if (a === 'vorschlaege') vorschlaegeZeigen(p);
      if (a === 'uebersetzen') uebersetzenMenue(anker, p);
      if (a === 'undo') Verlauf.zurueck();
      if (a === 'updates') updatesUndAnalysen(p);
      if (a === 'benach') benachrichtigungMenue(anker, p);
      if (a === 'verbind') verbindungenMenue(anker, p);
      if (a === 'export') markdownExport(p);
      if (a === 'import') {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = '.md,.markdown,.txt';
        inp.addEventListener('change', async () => {
          const f = inp.files?.[0]; if (!f) return;
          Werkzeuge.ausMarkdown(p, await f.text());
          zeichneSeite(); UI.toast('Markdown eingelesen');
        });
        inp.click();
      }
      if (a === 'stat2') {
        UI.toast(`Diese Seite wurde ${p.aufrufe || 0}-mal geöffnet · zuletzt geändert ` +
                 Werkzeuge.zeitKurz(p.edited));
      }
      if (a === 'papier') papierkorb();
      if (a === 'del') {
        Store.trashBlock(p.id);
        zeichneBaum();
        if (p.id === seiteId) { const e2 = Store.rootPages()[0]; oeffne(e2 ? e2.id : null); }
        UI.toast('In den Papierkorb verschoben');
      }
    });
  };

  /**
   * Der Cover-Wähler. Aufbau wie in Notions App: oben Entfernen · Titel ·
   * Schliessen, darunter Reiter, darunter Gruppen mit Kacheln.
   */

  const dupliziereSeite = (id: string, zielEltern?: any) => {
    const daten = Store.baum(id);
    const neu = Store.baumEinfuegen(daten, zielEltern);
    if (neu) Store.updateBlock(neu.id, { text: (Store.getBlock(id).text || 'Ohne Titel') + ' (Kopie)' });
    return neu;
  };

  /* ========================================================================
   * SEITE ANZEIGEN
   * ======================================================================*/
  /* Sonderansichten — Bibliothek, Meine Aufgaben. Sie ersetzen den Seiteninhalt,
     ohne eine echte Seite zu sein, genau wie bei Notion. */
  let sonder: any = null;

  /* ========================================================================
   * DER SCHAUPLATZ — wo man gerade ist (E272)
   * ------------------------------------------------------------------------
   * Die Kontextkante zeigt je Bereich andere Knöpfe; dafür muss sie
   * fragen können, welcher Bereich das gerade ist. Bisher wusste das
   * niemand ausser `zeigeSonder` und `oeffne` selbst — in einer lokalen
   * Variablen, die keiner sieht.
   *
   * `schauplatz()` gibt EINEN kleinen Bezeichner zurück, nicht das ganze
   * Innenleben: `'heute'`, `'bibliothek'`, `'seite'`, `'leer'`. Wer mehr
   * braucht — ob auf der Seite ein PDF liegt zum Beispiel —, fragt seinen
   * eigenen Bereich; die Schale soll nicht wissen müssen, was ein PDF ist.
   *
   * Und ein Ereignis dazu, damit niemand pollen muss. Es heisst
   * `redion:schauplatz` und trägt den Bezeichner im `detail`. Das ist die
   * Bauart, die §5 verlangt: die Kante hängt nicht an `App`, sondern hört
   * zu.
   * ====================================================================== */
  const SCHAUPLATZ_NAMEN: Record<string, string> = {
    'Lernen & Alltag': 'heute', 'Heute': 'heute', 'Start': 'heute',
    'Lernzentrum': 'lernen',
    'Bibliothek': 'bibliothek', 'Alle Seiten': 'bibliothek',
    'Dokumente': 'bibliothek', 'Seiten': 'bibliothek',
    'Seiten & Wissen': 'bibliothek', 'Dateien & PDFs': 'bibliothek',
    'Datenbanken': 'bibliothek', 'Whiteboards': 'bibliothek',
    'Wissen & Verweise': 'bibliothek', 'Vorlagen': 'bibliothek',
    'Notizhefte': 'notizhefte',
    /* BEIDE NAMEN, EIN ZIEL (Audit F16). „Workspace" heisst seit dem
       3. September „Arbeitsbereich"; der alte Name bleibt hier als Alias
       stehen, damit ein gemerkter Schauplatz, ein Verweis oder eine ältere
       Sicherung nicht ins Leere zeigt. Ein Alias ist kein Doppelkatalog:
       er führt zur selben Kennung. */
    'Arbeitsbereich': 'bibliothek', 'Workspace': 'bibliothek',
    'Meine Aufgaben': 'aufgaben',
    'Aufgaben': 'aufgaben', 'Posteingang': 'posteingang',
    'Elektrotechnik': 'elektro', 'Elektro': 'elektro',
    'Papierkorb': 'papierkorb', 'Kalender': 'kalender', 'Termine': 'kalender'
  };

  /* DREI NAMEN KAMEN MIT E273 DAZU — UND WARUM SIE NÖTIG WAREN.
     „Start", „Seiten" und „Termine" sind die Titel, unter denen
     `Ansichten.start/seiten/termine` sich seit E273 über `zeigeSonder`
     zeichnen. Ohne Eintrag hier bekämen sie aus dem Schnipsel unten die
     Schauplätze „start", „seiten" und „termine" — drei Kennungen, auf die
     sich niemand angemeldet hat, obwohl es dieselben Bildschirmfamilien
     sind wie „heute", „bibliothek" und „kalender".

     Umgekehrt gilt: 'Papierkorb' und 'Lernzentrum' stehen hier, ohne dass
     sie heute jemand ruft. Sie sind kein Schaden — ein Titel, den niemand
     benutzt, kostet nichts —, aber auch kein Beweis: wer eine Kante für
     'papierkorb' anmeldet, meldet sie an einen Schauplatz an, den es im
     Betrieb nicht gibt. Vorher nachsehen, wer `zeigeSonder` mit dem Titel
     ruft (heute: acht Stellen). */

  const schauplatz = (): string => {
    if (seiteId) return 'seite';
    if (!sonder) return 'leer';
    const titel = String(sonder.titel || '');
    if (SCHAUPLATZ_NAMEN[titel]) return SCHAUPLATZ_NAMEN[titel] as string;
    /* Ein unbekannter Titel wird zu einer brauchbaren Kennung statt zu
       „unbekannt": kleingeschrieben, ohne Sonderzeichen. So bekommt ein
       neuer Bereich von selbst einen Schauplatz, ohne dass jemand ihn
       hier einträgt — und die Kante kann sich darauf anmelden. */
    return titel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      || 'leer';
  };

  let letzterSchauplatz = '';
  /**
   * DIE SEITE ZÄHLT MIT (L95, E312).
   *
   * Bis hierher wurde nur gemeldet, wenn sich `schauplatz()` änderte. Von
   * einer Seite auf eine andere bleibt der aber „seite" — es kam also kein
   * Signal, und die Kontextkante zeichnete sich nicht neu.
   *
   * Das fiel erst mit der Datenbank-Kante auf, war aber schon vorher da:
   * `bereichJetzt()` verfeinert „seite" zu editor/pdf/datenbank, und beim
   * Wechsel von einer PDF auf eine Textseite blieben die PDF-Griffe stehen.
   * Ein Griff, der zur offenen Seite nicht gehört, ist schlimmer als keiner.
   *
   * Der `detail` bleibt der Schauplatz — wer nur ihn liest, merkt nichts.
   * Die zusätzlichen Meldungen kosten ein Neuzeichnen der Kante, und das
   * geschieht beim Seitenwechsel ohnehin schon zweimal.
   */
  const schauplatzMelden = (): void => {
    const jetzt = schauplatz();
    /* DIE ADRESSE ZÄHLT MIT (E393) — dieselbe Sorte Lücke wie die Seite
       oben, nur eine Ebene höher. Von „Heute" auf „Lernzentrum" bleibt
       `schauplatz()` bei `heute` (beide Ansichten heissen so) und `seiteId`
       bleibt leer. Es kam also kein Signal, und die Kontextkante liess
       ihre Markierung auf „Heute" stehen, obwohl man woanders war.
       `location.hash` unterscheidet die beiden — er sagt
       `#welt-lernen-heute` gegen `#welt-lernen-lernen`. */
    let adr = ''; try { adr = String(location.hash || ''); } catch { adr = ''; }
    const merkmal = jetzt + '|' + String(seiteId || '') + '|' + adr;
    if (merkmal === letzterSchauplatz) return;
    letzterSchauplatz = merkmal;
    try {
      window.dispatchEvent(new CustomEvent('redion:schauplatz', { detail: jetzt }));
    } catch { /* ohne CustomEvent bleibt der Rest */ }
  };

  const zeigeSonder = (titel: string, zeichner: any) => {
    if (seiteId || !sonder || sonder.titel !== titel) navMerken();
    sonder = { titel, zeichner };
    seiteId = null;
    navKnoepfeStellen();
    const ort = titel.toLowerCase().replace(/[^a-z]+/g, '-');
    location.hash = '#' + ort;
    /* WO MAN WAR, NICHT NUR WAS ZULETZT OFFEN WAR (E349). `letzte` zeigt
       weiter auf die zuletzt geöffnete Seite — „Weiter wo du warst" braucht
       sie. Ob der nächste Start diese Seite oder das Regal zeigt, entscheidet
       dieser Ort: `seite`, oder der Name der Sonderansicht. */
    Store.setMeta('zuletztOrt', ort);
    zeichneBaum();
    zeichneSeite();
    schauplatzMelden();
    const scr = document.getElementById('scroll');
    if (scr) scr.scrollTop = 0;
  };

  const oeffne = (id?: string | null) => {
    if (sonder || seiteId !== id) navMerken();
    sonder = null;
    if (seiteId && seiteId !== id) Werkzeuge.versionAutomatisch(seiteId);
    seiteId = id;
    navKnoepfeStellen();
    if (id) {
      const p = Store.getBlock(id);
      if (p) Store.updateBlock(id, { aufrufe: (p.aufrufe || 0) + 1, zuletztGeoeffnet: Store.now() });
    }
    Store.setMeta('letzte', id);
    Store.setMeta('zuletztOrt', id ? 'seite' : 'leer');
    if (id) kuerzlichMerken(id);
    location.hash = id || '';
    zeichneBaum();
    zeichneSeite();
    schauplatzMelden();
    if (typeof Fenster !== 'undefined' && id) Fenster.gemerkt(id);
    const scr = document.getElementById('scroll');
    if (scr) scr.scrollTop = 0;
  };


  /* ========================================================================
   * SEITE ZEICHNEN — das Zusammensetzen
   * ------------------------------------------------------------------------
   * Was hier steht, ist nur noch die Entscheidung, WAS gezeichnet wird:
   * eine Sonderansicht, gar nichts, oder eine echte Seite. Das WIE liegt in
   * `kopfleiste.js` und `inhaltsflaeche.js`.
   *
   * Der Rückgabewert von `Kopfleiste.zeichne` ist der wichtige Teil: false
   * heisst, die Seite ist verschlüsselt und danach kommt nichts mehr.
   * ======================================================================*/
  /**
   * Zeichnet die offene Seite neu.
   * @param {string} fokus  ID des Blocks, der danach den Cursor bekommt
   * @param {string} wo     'ende' setzt den Cursor ans Textende
   */
  /* ==========================================================================
   * DAS KI-FELD BLEIBT NICHT IM DOKUMENT STEHEN (E394, Audit F08)
   * --------------------------------------------------------------------------
   * GEMESSEN AM 4. SEPTEMBER auf 1360 × 900, mit einem A4-Blatt im
   * Dokumentmodus: `#ai` stand weiter da, 380 Pixel breit, und liess dem
   * Blatt 980 von 1360 — 28 % des Bildschirms für ein Feld, das man gerade
   * nicht braucht.
   *
   * E384 hat den Dokumentmodus damit begründet, dass „die ganze Schale
   * wegfällt", und die CSS blendet dort auch Menüband, Kopfzeile, untere
   * Leiste und Kontextkante aus. Das KI-Feld fehlte in dieser Liste.
   *
   * WARUM NICHT EINFACH `display:none` IN DER CSS. Weil man die KI IM
   * Dokument sehr wohl brauchen kann — „fasse diese Seite zusammen" ist
   * genau dort die Frage. Ein Feld, das sich nicht öffnen lässt, wäre die
   * Reparatur, die mehr kaputt macht als der Fehler.
   *
   * Also: beim EINTRETEN zuklappen und sich merken, dass es offen war; beim
   * VERLASSEN wieder aufklappen. Wer es im Dokument von Hand öffnet,
   * behält es — die Erinnerung wird beim Eintreten gesetzt, nicht laufend
   * nachgeführt. */
  let kiVorDokument = false;
  let warImDokument = false;
  const kiAmDokumentAnpassen = (imDokument: boolean): void => {
    if (imDokument === warImDokument) return;
    warImDokument = imDokument;
    const feld = document.getElementById('ai');
    if (!feld) return;
    if (imDokument) {
      kiVorDokument = feld.classList.contains('open');
      if (kiVorDokument) kiPanel(false);
    } else if (kiVorDokument) {
      kiVorDokument = false;
      kiPanel(true);
    }
  };

  const zeichneSeite = (fokus: string | null = null, wo = 'anfang') => {
    const wrap = document.getElementById('page');
    if (!wrap) return;

    /* EIN OFFENES DOKUMENT IST DER GANZE BILDSCHIRM (E384). Redurs Satz kam
       ein zweites Mal: „ich will das die pdf nicht im bereichen sich öffnet
       so wie goodnotes". E296 hatte den SEITENKOPF weggeraeumt — den Kasten
       INNERHALB der Seite. Was stehen blieb, war die Schale um sie herum,
       und genau die meint das Wort „Bereiche".

       Gemessen auf 1440x900: Menueband 37 + Kopfzeile 54 + Dokumentleiste 47
       + die Original-Karte 45 = die oberen 222 der 900 Pixel, bevor das
       erste Blatt anfaengt. Am Telefon 232 von 844, und unten stand noch
       die Reiterleiste. GoodNotes hat dort EINE Leiste und darunter Papier.

       Die Flagge steht am `body`, weil Menueband, Kopfzeile und die untere
       Leiste ausserhalb von `#page` liegen; ein Haken an `#page` erreicht
       sie nicht. Geloescht wird sie hier, gesetzt nur im Dokumentzweig —
       so faellt sie auch bei jedem fruehen Ausstieg zurueck (Sonderansicht,
       leere Seite, Sperrbildschirm). */
    delete document.body.dataset['dokument'];
    delete document.body.dataset['foliensatz'];
    kiAmDokumentAnpassen(false);

    if (sonder) {
      wrap.className = 'wide';
      wrap.innerHTML = '';
      document.body.dataset.font = 'default';
      document.body.dataset.small = '';
      sonder.zeichner(wrap);
      zeichneCrumbs();
      return;
    }

    const p = seiteId ? Store.getBlock(seiteId) : null;

    if (!p) {
      Inhaltsflaeche.leer(wrap);
      zeichneCrumbs();
      return;
    }

    wrap.className = p.wide ? 'wide' : '';
    document.body.dataset.font = p.font || 'default';
    document.body.dataset.small = p.small ? '1' : '';
    wrap.innerHTML = '';

    if (!Kopfleiste.zeichne(wrap, p)) { zeichneCrumbs(); return; }

    if (DocumentMode.active(p)) {
      /* DAS DOKUMENT IST DIE SEITE, NICHT EIN KASTEN AUF DER SEITE (E296).
         Bis hierher stand ueber dem Arbeitsraum noch der ganze Seitenkopf:
         Cover, das grosse Symbol, der Titel in Ueberschriftsgroesse und die
         Werkzeugzeile „Cover · Volle Breite · Dokumentmodus". Auf 1440x900
         gemessen frass das die oberen 380 der 900 Pixel — die PDF-Seite
         bekam, was uebrig blieb, und darunter standen dann noch ZWEI
         Werkzeugleisten uebereinander.

         Der Kopf wird trotzdem erst gezeichnet und dann weggeraeumt, denn an
         ihm haengen zwei Dinge, die auch hier gelten: der Sperrbildschirm
         einer verschluesselten Seite (er gibt `false` zurueck, dann sind wir
         eine Zeile darueber schon heraus) und der Fenstertitel. Verloren
         geht dabei nichts, was man braucht — der Titel steht ab jetzt in der
         Kopfzeile des Dokuments, und der Hinweis auf eine gegen Bearbeiten
         gesperrte Seite ebenso. */
      wrap.className = 'wide document-page';
      wrap.innerHTML = '';
      document.body.dataset['dokument'] = 'an';
      /* EIN FOLIENSATZ BEKOMMT SEIN MENÜBAND (E549). Redur: „oben mit Menü."
         `pdf-studio.css` räumt im Dokumentmodus alles Gerüst weg, auch
         `#menueband` — richtig für eine PDF und für ein Notizheft, wo die
         Dokumentleiste alles trägt. Eine Präsentation ist der eine Fall, für
         den PowerPoints Muster gilt: Reiter oben, Folien links.
         Die Marke steht hier und nicht im Stilblatt, weil nur hier bekannt
         ist, WELCHES Dokument offen ist. Das Stilblatt liest sie nur. */
      const folien = typeof Folienvorlagen !== 'undefined' &&
                     Folienvorlagen.istFoliensatz(p.id);
      if (folien) document.body.dataset['foliensatz'] = 'an';
      else delete document.body.dataset['foliensatz'];
      kiAmDokumentAnpassen(true);
      DocumentMode.render(wrap, p);
    } else {
      /* WER DAS DOKUMENT VERLAESST, LAESST pdf.js LOS (E473, Fund der
         Prüfung). Die Suche im Studio haelt je Quelle ein offenes
         pdf.js-Dokument; ohne diese Zeile blieben sie samt Arbeiter
         liegen, bis der Tab zuging. Jede Seitenzeichnung laeuft hier
         durch — Regal, „Normale Seite", ein anderer Ort. */
      DocumentMode.freigeben?.();
      Inhaltsflaeche.zeichne(wrap, p);
    }

    zeichneCrumbs();
    streifenZeichnen();

    /* Fokus setzen */
    if (fokus) {
      const ct = document.querySelector<HTMLElement>(`[data-bid="${fokus}"] .ct`);
      if (ct instanceof HTMLElement) { if (wo === 'ende') Blocks.cursorAnsEnde(ct); else ct.focus(); }
    }
  };

  /* Weiterreichungen. `zeichneCrumbs` steht an sechs Stellen in dieser Datei,
     `coverWaehlen` im Seitenmenü — die Namen bleiben, wo sie sind. */
  const zeichneCrumbs    = ()  => Kopfleiste.pfad();
  const coverWaehlen     = (p: any) => Kopfleiste.coverWaehlen(p);
  const streifenZeichnen = ()  => Inhaltsflaeche.streifen();



  /* ========================================================================
   * SUCHE
   * ======================================================================*/
  /**
   * Die grosse Suche.
   *
   * @param vorgabe Ein Wort, mit dem sie schon gefüllt aufgeht — für den
   *        Weg aus einer kleinen Suche heraus (E282: die Regal-Suche findet
   *        nur Titel und führt hierher, statt Inhalte nachzubauen, E29).
   *        Ohne Angabe geht sie leer auf, wie bisher.
   */
  const suche = (vorgabe?: string) => {
    /* DER PLATZHALTER IST AM TELEFON EIN ANDERER.
       Der lange nennt sechs Suchbefehle — am Rechner ist das die beste
       Stelle dafür, weil man sie sonst nie erfährt. Am Telefon passt ein
       Drittel davon ins Feld, und was übrig bleibt („Suchen — auch
       typ:seite, in:Projekte, nach:202") liest sich wie ein Fehler. Lieber
       ein Wort, das stimmt, als ein Satz, der abbricht. */
    const eng = matchMedia('(max-width:760px)').matches;
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder such" style="width:min(820px,95vw)">' +
        '<input id="q" placeholder="' + (eng ? 'Seiten, Zeilen und Inhalte suchen'
          : 'Suchen — z. B. titel:&quot;Projekt&quot;, tag:arbeit, geändert:heute, status:offen') +
          '" autocomplete="off">' +
        '<div class="such-filter">' +
          '<select id="f-wo"><option value="alles">Titel und Inhalt</option>' +
            '<option value="titel">nur Titel</option><option value="inhalt">nur Inhalt</option></select>' +
          '<select id="f-typ"><option value="alles">Alle Seiten</option>' +
            '<option value="seite">ohne Datenbank</option><option value="datenbank">mit Datenbank</option></select>' +
          '<select id="f-seit"><option value="alles">Jederzeit</option>' +
            '<option value="tag">heute geändert</option><option value="woche">diese Woche</option>' +
            '<option value="monat">dieser Monat</option></select>' +
          '<select id="f-ort"><option value="">Überall</option>' +
            Store.rootPages().map(p2 => `<option value="${p2.id}">in ${esc(p2.text || 'Ohne Titel')}</option>`).join('') +
          '</select>' +
        '</div>' +
        '<div class="such-koerper">' +
          '<div class="res" id="res"></div>' +
          '<div class="such-vorschau" id="vorschau"></div>' +
        '</div>' +
        /* Die Fusszeile hat zwei Hälften, und nur eine gilt überall.
           „↑ ↓ auswählen · Enter öffnen · Esc schliessen" nennt drei Tasten,
           die eine Telefontastatur nicht hat — das ist keine Hilfe, sondern
           eine Anleitung für ein anderes Gerät. Die Suchbefehle dagegen
           gelten auf beiden, also bleiben sie. Getrennt, damit das
           Stilblatt die eine Hälfte ausblenden kann und die andere nicht. */
        '<div class="hint">' +
          '<span class="hint-tasten">↑ ↓ auswählen · Enter öffnen · Esc schliessen · </span>' +
          '<span class="hint-befehle">Beispiele: <code>titel:&quot;Projekt&quot;</code> ' +
          '<code>tag:arbeit</code> <code>typ:seite</code> <code>geändert:heute</code> ' +
          '<code>status:offen</code></span></div>' +
      '</div>';
    document.body.appendChild(o);

    const inp = o.querySelector<HTMLInputElement>('#q');
    const res = o.querySelector<HTMLElement>('#res');
    if (!inp || !res) return;
    let treffer: any[] = [];
    let i = 0;
    let queryError = '';

    /* ----------------------------------------------------------------------
     * „ZULETZT GESUCHT" (Vorgabe §17)
     * ----------------------------------------------------------------------
     * Vorher war das leere Suchfeld ein leeres Fenster. Das ist der
     * häufigste Zustand überhaupt — man öffnet die Suche und hat noch
     * nichts getippt — und ausgerechnet dort stand nichts.
     *
     * Menschen suchen wiederholt dasselbe. Die letzten sechs Begriffe als
     * antippbare Marken sind deshalb kein Beiwerk, sondern die schnellste
     * Abkürzung, die eine Suche haben kann: einmal tippen statt elfmal.
     *
     * Gemerkt wird erst beim Öffnen eines Treffers, nicht bei jedem
     * Tastendruck — sonst stünde dort „f", „fo", „for", „form".
     * -------------------------------------------------------------------- */
    const letzteSuchen = (): string[] => {
      try { return (Store.getMeta('suchverlauf', []) || []).slice(0, 6); }
      catch { return []; }
    };
    const merkeSuche = (wort: string) => {
      const w = String(wort || '').trim();
      if (w.length < 2) return;
      const alt2 = letzteSuchen().filter(x => x.toLowerCase() !== w.toLowerCase());
      try { Store.setMeta('suchverlauf', [w, ...alt2].slice(0, 12)); } catch { }
    };

    /* Der Verlauf steht ÜBER der Liste, nicht statt ihrer. Das leere
       Suchfeld zeigt nämlich schon alle Seiten — mein erster Entwurf
       prüfte auf `!treffer.length` und griff deshalb nie. Gesehen hat das
       die Probe, nicht der Code. */
    const verlaufBlock = (): string => {
      if (inp.value) return '';
      const w = letzteSuchen();
      if (!w.length) return '';
      return '<div class="such-verlauf"><div class="sv-kopf">Zuletzt gesucht</div>' +
        '<div class="sv-marken">' +
        w.map(x => `<button data-wort="${esc(x)}">${esc(x)}</button>`).join('') +
        '</div></div>';
    };
    const verlaufBinden = () => {
      res.querySelectorAll<HTMLElement>('[data-wort]').forEach(b => {
        b.addEventListener('click', () => {
          inp.value = b.dataset['wort'] || '';
          inp.dispatchEvent(new Event('input'));
          inp.focus();
        });
      });
    };

    const zeichne = () => {
      if (!treffer.length) {
        res.innerHTML = queryError
          ? '<div class="such-leer" role="alert" data-query-error><b>Abfrage nicht verstanden</b>' +
            `<span>${esc(queryError)}</span></div>`
          : inp.value
          ? '<div class="such-leer"><b>Nichts gefunden</b>' +
            '<span>Versuche einen anderen Begriff — oder suche in den Befehlen ' +
            'mit <code>Strg ⇧ K</code>.</span></div>'
          : verlaufBlock();
        verlaufBinden();
        return;
      }
      res.innerHTML = verlaufBlock() + treffer.map((t, k) =>
        `<button data-i="${k}" ${k === i ? 'class="on"' : ''}>` +
          `<span>${t.page.icon || '📄'}</span>` +
          `<span style="flex:1"><span>${esc(t.page.text || 'Ohne Titel')}</span>` +
          (t.pfad ? `<span class="snip pfad">${esc(t.pfad)}</span>` : '') +
          /* Der Ausschnitt steht beim Inhaltstreffer — und seit E500 auch
             beim Dokumenttreffer, wo er die Stelle zeigt. */
          (t.snippet && (t.treffer === 'Inhalt' || t.blockId) ? `<span class="snip">${esc(t.snippet)}</span>` : '') +
          `</span><span class="pth">${t.treffer}</span></button>`).join('');
      verlaufBinden();
      res.querySelectorAll<HTMLElement>('button[data-i]').forEach(b => {
        b.addEventListener('click', () => {
          merkeSuche(inp.value);
          zumTreffer(treffer[Number(b.dataset.i)]); o.remove();
        });
        b.addEventListener('mouseenter', () => zeigeVorschau(Number(b.dataset.i)));
      });
      res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
      zeigeVorschau(i);
    };

    /* Rechts eine kleine Vorschau der markierten Seite */
    const zeigeVorschau = (k: any) => {
      const v = o.querySelector('#vorschau');
      if (!v) return;
      const t = treffer[k];
      if (!t) { v.innerHTML = ''; return; }
      const p2 = t.page;
      /* HÜLLEN SIND KEIN INHALT (E118).
         Gelesen wurden bisher nur die DIREKTEN Kinder der Seite. Seit E104
         ist „nebeneinander" die Vorgabe beim PDF-Einlesen, und dann ist das
         einzige direkte Kind ein `columns`-Block — der hat keinen `text`,
         also kam '' zurück, und die Vorschau behauptete „Diese Seite ist
         noch leer." über eine ganze Schulaufgabe. Genau der Satz, den E107
         abschaffen wollte, an genau der Anordnung, die Standard ist.
         Also hinabsteigen — aber nur in das, was selbst nichts zu sagen hat:
         Spaltenblock, Spalte, Blatt. In einen Textblock mit Kindern nicht;
         der hat seinen eigenen Satz, und die Vorschau ist eine Vorschau. */
      const HUELLE = new Set(['columns', 'columns3', 'spalte', 'blatt', 'toggle']);
      const zeilen: string[] = [];
      const GRENZE = 14;
      const sammle = (id: string, tiefe: number): void => {
        if (tiefe > 4) return;
        for (const b of Store.childrenOf(id) as any[]) {
          if (zeilen.length >= GRENZE) return;
          if (b.type === 'database') {
            const c = Store.getCollection(b.collectionId);
            zeilen.push(`<div class="vs-db">🗂 ${esc(c ? c.name : 'Datenbank')} · ` +
                        `${c ? Store.rowsOf(c.id).length : 0} Einträge</div>`);
            continue;
          }
          /* Eine PDF-Seite hat keinen `text` — sie ist ein Bild. Ihr erster
             Satz steht seit E107 in `suchtext`. */
          if (b.type === 'pdfseite') {
            const erste = String(b.suchtext || b.ocrText || '').split('\n')[0] || '';
            zeilen.push(`<div class="vs-t">📄 Seite ${esc(b.nr || '?')}` +
                        (erste ? ' · ' + esc(erste.slice(0, 80)) : '') + '</div>');
            continue;
          }
          if (HUELLE.has(b.type)) { sammle(b.id, tiefe + 1); continue; }
          if (!b.text) continue;
          const marke = ({ h1:'vs-h1', h2:'vs-h2', h3:'vs-h3' } as Record<string, string>)[b.type] || 'vs-t';
          zeilen.push(`<div class="${marke}">${esc(b.text.slice(0, 120))}</div>`);
        }
      };
      sammle(p2.id, 0);
      const inhalt = zeilen.join('');
      v.innerHTML =
        `<div class="vs-kopf">${esc(p2.icon || '📄')} <b>${esc(p2.text || 'Ohne Titel')}</b></div>` +
        `<div class="vs-meta">${esc(Store.pfadText(p2.id) || 'oberste Ebene')} · ` +
        `zuletzt ${esc(Werkzeuge.zeitKurz(p2.edited))}</div>` +
        (inhalt || '<div class="vs-t" style="opacity:.5">Diese Seite ist noch leer.</div>');
    };

    const zuletzt = () => {
      queryError = '';
      treffer = Object.values<any>(Store.cache.blocks)
        .filter(b => b.type === 'page' && b.alive && b.parentTable !== 'collection')
        .sort((a, b) => (b.edited || '').localeCompare(a.edited || ''))
        .slice(0, 8)
        .map(p => ({ page: p, treffer: 'Zuletzt', snippet: '' }));
      i = 0;
      zeichne();
    };
    zuletzt();

    const readUiFilters = (): SearchUiFilters => {
      const scopeValue = o.querySelector<HTMLSelectElement>('#f-wo')?.value ?? 'alles';
      const typeValue = o.querySelector<HTMLSelectElement>('#f-typ')?.value ?? 'alles';
      const changedValue = o.querySelector<HTMLSelectElement>('#f-seit')?.value ?? 'alles';
      return {
        scope: scopeValue === 'titel' ? 'title' : scopeValue === 'inhalt' ? 'content' : 'all',
        documentType: typeValue === 'seite' ? 'page' : typeValue === 'datenbank' ? 'database' : 'all',
        changed: changedValue === 'tag' ? 'today' : changedValue === 'woche' ? 'week'
          : changedValue === 'monat' ? 'month' : 'all',
        location: o.querySelector<HTMLSelectElement>('#f-ort')?.value ?? ''
      };
    };

    const valueList = (value: unknown, depth = 0): string[] => {
      if (value === null || value === undefined || depth > 2) return [];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
        return [String(value)];
      if (Array.isArray(value)) return value.flatMap(item => valueList(item, depth + 1));
      if (typeof value !== 'object') return [];
      const record = value as Record<string, unknown>;
      const named = record['name'] ?? record['value'] ?? record['text'];
      return named === undefined ? [] : valueList(named, depth + 1);
    };

    /* Der persistente Index aus Phase 18 liefert Seiten UND Datenbankzeilen.
       Er ist nur Beschleuniger: kann er nicht gelesen werden, entsteht die
       gleiche Dokumentform direkt aus dem echten Bestand. */
    let documentCache: SearchDocument[] | null = null;
    const queryDocuments = (): SearchDocument[] => {
      if (documentCache) return documentCache;
      let indexEntries: any[] = [];
      try {
        indexEntries = typeof Kontext !== 'undefined' && Kontext.holen
          ? (Kontext.holen().eintraege || []) : [];
      } catch { indexEntries = []; }

      if (!indexEntries.length) {
        indexEntries = Object.values<any>(Store.cache.blocks)
          .filter(block => block.alive && block.type === 'page')
          .map(block => ({ id: block.id, seiteId: block.id,
            art: block.parentTable === 'collection' ? 'zeile' : 'seite',
            titel: block.text || '', text: Store.childrenOf(block.id)
              /* Auch `suchtext` — sonst findet dieser Weg eine PDF-Seite
                 nicht, während `Store.search` sie findet (E124). Die beiden
                 müssen dasselbe sagen. */
              .map((child: any) => (child.text || child.suchtext || child.ocrText || '')).join(' '),
            geaendert: block.edited || block.created || '' }));
      }

      documentCache = indexEntries.map((entry: any): SearchDocument | null => {
        const block = Store.getBlock(entry.seiteId || entry.id);
        if (!block || !block.alive || block.type !== 'page') return null;
        if (typeof Konten !== 'undefined' && Konten.darf && !Konten.darf('lesen', block.id)) return null;
        const isRow = block.parentTable === 'collection';
        const collection = isRow ? Store.getCollection(block.parentId) : null;
        const hasDatabase = !isRow && (block.content || [])
          .some((id: string) => Store.getBlock(id)?.type === 'database');
        const schema = collection?.schema || {};
        const props = block.props || {};
        const statuses: string[] = [];
        const optionTags: string[] = [];
        Object.keys(schema).forEach(key => {
          const definition = schema[key] || {};
          const values = valueList(props[key]);
          const name = String(definition.name || '').toLocaleLowerCase('de-DE');
          if (definition.type === 'status' || name === 'status' || name === 'zustand')
            statuses.push(...values);
          if (definition.type === 'multi' || name === 'tags' || name === 'schlagwörter')
            optionTags.push(...values);
        });
        const title = String(entry.titel || block.text || 'Ohne Titel');
        const content = String(entry.text || '');
        const hashTags = [...(title + ' ' + content).matchAll(/#([\p{L}\p{N}_-]+)/gu)]
          .map(match => match[1] || '').filter(Boolean);
        const pathParts = isRow
          ? [collection?.name || 'Datenbank']
          : Store.pathOf(block.id).slice(0, -1).map((part: any) => part.text || 'Ohne Titel');
        const locations = isRow
          ? [String(collection?.id || ''), String(collection?.name || '')]
          : Store.pathOf(block.id).flatMap((part: any) => [String(part.id), String(part.text || '')]);
        return {
          id: block.id,
          title,
          content,
          path: pathParts.join(' / '),
          documentType: isRow ? 'row' : hasDatabase ? 'database' : 'page',
          changed: String(entry.geaendert || block.edited || block.created || ''),
          tags: [...new Set([...hashTags, ...optionTags])],
          statuses: [...new Set(statuses)],
          locations: locations.filter(Boolean)
        };
      }).filter((document: SearchDocument | null): document is SearchDocument => document !== null);
      return documentCache;
    };

    const suchen = () => {
      const roh = inp.value;
      /* ══ „Red-ur" ÖFFNET DIE CHRONIK (E514) ═══════════════════════════════
         Redur, 9. September: „wenn ich bei der Redion in der Suche 'Red-ur'
         schreibe, sollte dort direkt die Daten sich öffnen."

         HIER UND NICHT IN DER BEFEHLSPALETTE, weil er die SUCHE genannt hat
         — und weil eine Chronik über Redion selbst dort hingehört, wo man
         nach Dingen sucht, nicht wo man Befehle gibt. In der Palette steht
         sie trotzdem, über denselben Weg (§8): `Chronik.oeffnen`.

         DER TEXT MUSS GENAU PASSEN. Ein Treffer, der bei jedem „red"
         aufspringt, wäre eine Überraschung statt einer Tür — deshalb prüft
         `Chronik.trifft` auf das ganze Wort, mit oder ohne Bindestrich. */
      if (typeof Chronik !== 'undefined' && Chronik.trifft(roh)) {
        queryError = '';
        treffer = [];
        res.innerHTML =
          '<button class="chr-treffer on" data-chr-tuer>' +
          '<span>🧠</span><span style="flex:1"><span>Red-ur — die Chronik</span>' +
          '<span class="snip">Tage, Probleme, Arbeitsweise · braucht einen Zugangscode</span>' +
          '</span><span class="pth">Chronik</span></button>';
        res.querySelector('[data-chr-tuer]')?.addEventListener('click', () => {
          o.remove();
          void Chronik.oeffnen();
        });
        return;
      }
      const uiFilters = readUiFilters();
      const hasUiFilter = uiFilters.scope !== 'all' || uiFilters.documentType !== 'all' ||
        uiFilters.changed !== 'all' || !!uiFilters.location;
      if (!roh.trim() && !hasUiFilter) { zuletzt(); return; }

      /* EINE KENNUNG IST KEINE ABFRAGE (L23, E175).
         L23 nennt ausdrücklich „Titel, Inhalt, Zeilen UND KENNUNGEN".
         `Store.search` kann das seit Langem — es schneidet die Kennung sogar
         aus einer ganzen Seitenadresse heraus und findet auch Blöcke im
         Papierkorb, was bei einer Verwaltungssuche der Sinn der Sache ist.
         Das Suchfenster ging seit der Abfragesprache daran vorbei: es fragt
         `QueryLanguage.run` über die Dokumentenform, und die kennt nur
         Titel, Inhalt, Schlagwörter und Status. Wer eine Kennung einfügte,
         bekam „Nichts gefunden".

         Der Zweig steht hier und nicht in `query.ts`: die Sprache kennt
         weder DOM noch Ablage, und das soll so bleiben.

         WAS IHN SICHER MACHT, ist nicht der Ausdruck, sondern die zweite
         Bedingung: `Store.search` muss WIRKLICH über die Kennung gefunden
         haben. Der Zweig geht an der Abfragesprache vorbei und damit an
         ihren Filtern; griffe er schon, wenn der Text zufällig wie eine
         Kennung aussieht, zeigte „nur Titel" plötzlich Inhaltstreffer
         (test229 §4, gegengeprobt). Der Ausdruck davor spart nur den
         Aufruf bei jedem Tastendruck. */
      const alsKennung = roh.trim().replace(/^.*#block=/, '');
      if (/^[0-9a-f]{8}-?[0-9a-f]{4}/i.test(alsKennung)) {
        const gefunden = Store.search(alsKennung);
        if (gefunden.length && gefunden[0].treffer === 'Seiten-ID') {
          queryError = '';
          treffer = gefunden;
          i = 0;
          zeichne();
          return;
        }
      }

      const parsed = QueryLanguage.parse(roh);
      if (!parsed.ok) {
        queryError = parsed.issues.map(issue => issue.message).join(' ');
        treffer = [];
        i = 0;
        zeichne();
        return;
      }
      queryError = '';
      const query = QueryLanguage.applyUiFilters(parsed.query, uiFilters);
      treffer = QueryLanguage.run(queryDocuments(), query).map(match => ({
        page: Store.getBlock(match.document.id),
        treffer: match.reason,
        snippet: match.snippet,
        pfad: match.document.path
      })).filter(hit => !!hit.page);

      /* ══ BEI EINEM DOKUMENT DIE STELLE NACHLIEFERN (E500) ════════════════
         Die Schalensuche fand bisher SEITEN. Bei einem Skript mit
         zweihundert PDF-Seiten landete man damit auf Seite eins und musste
         dort ein zweites Mal suchen — genau der Weg, den die Suche im
         Studio (E468, E487) abgeschafft hat, nur eine Ebene höher.

         DIE FREIEN WÖRTER, NICHT DIE ABFRAGE. `titel:"Projekt"` und
         `tag:arbeit` sind Filter und stehen in keinem Seitentext; gesucht
         wird mit dem, was daneben steht. Das ist eine Näherung, und sie
         steht hier, weil die Abfragesprache ihren Klartext nicht
         herausgibt — sie kennt weder DOM noch Ablage, und das soll so
         bleiben (derselbe Grund wie beim Kennungszweig oben).

         NUR BEI DOKUMENTEN, und nur für die Treffer, die ohnehin schon da
         sind: `stelleIn` liest, was im Speicher liegt, nicht die PDF. */
      const freieWorte = roh.split(/\s+/)
        .filter(w => w && !/^[\p{L}]+:/u.test(w)).join(' ').replace(/["']/g, '').trim();
      const dok = typeof DocumentMode !== 'undefined' ? (DocumentMode as any) : null;
      if (freieWorte.length >= 2 && dok && typeof dok.stelleIn === 'function') {
        for (const hit of treffer) {
          if (!hit.page?.dokumentModus) continue;
          const stelle = dok.stelleIn(hit.page, freieWorte);
          if (!stelle) continue;
          hit.blockId = stelle.blockId;
          hit.treffer = 'Seite ' + stelle.nr;
          /* DER AUSSCHNITT DER STELLE SCHLÄGT DEN DER SEITE (Fund des
             Bildes). Die Abfragesprache schneidet aus dem Text der GANZEN
             Seite; bei einem Dokument ist das der Text aller Seiten
             hintereinander, und der Schnitt fiel mitten in ein Wort
             („…trom Kapitel 2 —"). `stelle.auszug` steht um das gesuchte
             Wort herum und sagt, was auf DIESER Seite steht. */
          hit.snippet = stelle.auszug;
        }

        /* ══ UND DIE STELLEN, DIE DIE ABFRAGESPRACHE NICHT KENNT ══════════
           Was ein Mensch auf ein Blatt SCHREIBT, steht in einer Marke — und
           Marken stehen in keinem Suchindex. Ein Skript, in dem „Knotensatz"
           nur handschriftlich als Textmarke steht, war über Strg P nicht zu
           finden; im Studio (E487) war es das längst.

           NUR BEI EINER REINEN WORTSUCHE. Dieser Zweig geht an der
           Abfragesprache vorbei und damit an ihren Filtern — dieselbe
           Gefahr, die E175 am Kennungszweig gefunden hat: griffe er auch
           bei „nur Titel", zeigte dieser Filter plötzlich Inhaltstreffer.
           Also nur, wenn nichts gefiltert ist und die Abfrage aus genau
           den freien Wörtern besteht. */
        if (!hasUiFilter && roh.trim() === freieWorte && typeof dok.stellenSuchen === 'function') {
          const schon = new Set(treffer.map(h => String(h.page?.id || '')));
          const gefunden = dok.stellenSuchen(freieWorte);
          for (const stelle of (gefunden?.liste || [])) {
            if (schon.has(stelle.seiteId)) continue;
            const seite = Store.getBlock(stelle.seiteId);
            if (!seite || seite.alive === false) continue;
            schon.add(stelle.seiteId);
            treffer.push({ page: seite, treffer: 'Seite ' + stelle.nr,
              snippet: stelle.auszug, pfad: Store.pfadText(seite.id) || '',
              blockId: stelle.blockId });
          }
        }
      }

      i = 0;
      zeichne();
    };
    inp.addEventListener('input', suchen);
    o.querySelectorAll('.such-filter select').forEach(s2 => s2.addEventListener('change', suchen));

    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { o.remove(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); i = Math.min(i + 1, treffer.length - 1); zeichne(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); i = Math.max(i - 1, 0); zeichne(); }
      if (e.key === 'Enter' && treffer[i]) { zumTreffer(treffer[i]); o.remove(); }
    });

    /* WELCHER FILTER IST GESETZT? Am Telefon sind die Filter Marken, und
       eine gesetzte Marke muss man sehen, ohne sie zu öffnen — sonst sucht
       man in einem Ausschnitt und weiss es nicht. `.leer` heisst: steht
       auf der Vorgabe, also unauffällig. */
    const filterMarken = () => {
      o.querySelectorAll<HTMLSelectElement>('.such-filter select').forEach(s2 => {
        const vorgabe = s2.options[0]?.value ?? '';
        s2.classList.toggle('leer', s2.value === vorgabe);
      });
    };
    o.querySelectorAll<HTMLSelectElement>('.such-filter select')
      .forEach(s2 => s2.addEventListener('change', filterMarken));
    filterMarken();

    o.addEventListener('mousedown', e => { if (e.target === o) o.remove(); });
    /* EINMAL ZEICHNEN, BEVOR JEMAND TIPPT. Ohne das blieb das leere
       Suchfeld ein leeres Fenster — und das ist der häufigste Zustand
       überhaupt: man öffnet die Suche und hat noch nichts eingegeben.
       Genau dort gehören die letzten Suchbegriffe hin. */
    /* Die Vorgabe VOR dem Zeichnen setzen, sonst zeigte der erste Aufbau
       den leeren Zustand („Zuletzt gesucht") und erst der nächste
       Tastendruck die Treffer — man sähe eine Suche, die ihr eigenes Wort
       nicht kennt. */
    if (vorgabe) inp.value = String(vorgabe);
    zeichne();
    inp.focus();
    /* Und den Anschlag ans Ende, nicht an den Anfang: wer aus dem Regal
       kommt, will weitertippen und nicht vor sein eigenes Wort geraten. */
    if (vorgabe) inp.setSelectionRange(inp.value.length, inp.value.length);
  };

  /**
   * Einen Suchtreffer öffnen.
   *
   * Kennt die Suche den Block, geht es dorthin — sonst zur Seite. Für einen
   * Treffer im Titel gibt es keinen Block, und für eine Seite, deren Inhalt
   * eine Zeile weit oben ist, wäre das Hinrollen auch keine Hilfe. Wo es
   * eine Hilfe ist: eine Fundstelle auf Seite 63 eines Skripts (E107).
   */
  const zumTreffer = (t: any): void => {
    if (!t) return;
    /* DER SPRUNG INS DOKUMENT BRAUCHT HIER NICHTS NEUES (E500, Fund der
       Gegenprobe). `zeigeBlock` kann ihn längst: es erkennt ein
       `pdfseite`/`blatt`-Ziel, wählt über `DocumentMode.select` DIE Seite
       und schaltet den Dokumentmodus notfalls ein. Der erste Entwurf hat
       daneben einen zweiten Weg gebaut — und der wäre am Rechteweg und an
       `Links.seiteVon` vorbeigelaufen (§8: keine zweite Tür).
       Neu ist nur, dass ein Suchtreffer jetzt eine `blockId` MITBRINGT. */
    if (t.blockId && zeigeBlock(t.blockId)) return;
    oeffne(t.page.id);
  };

  /** Suchen auf der offenen Seite — Strg + F. */
  const seitenSuche = () => {
    const alt = document.getElementById('findbar');
    if (alt) { alt.remove(); zeichneSeite(); return; }
    const bar = document.createElement('div');
    bar.id = 'findbar';
    bar.innerHTML = '<input placeholder="Auf dieser Seite suchen …"><span class="n"></span>' +
                    '<button data-a="zu">✕</button>';
    document.body.appendChild(bar);
    const inp = bar.querySelector<HTMLInputElement>('input');
    if (!inp) return;
    const n = bar.querySelector<HTMLElement>('.n');
    if (!n) return;

    const suchen = () => {
      document.querySelectorAll('#page mark').forEach(m => m.replaceWith(...m.childNodes));
      const q = inp.value.trim();
      if (!q) { n.textContent = ''; return; }
      let anzahl = 0;
      const seitenKasten = document.getElementById('page');
      if (!seitenKasten) return;
      const lauf = document.createTreeWalker(seitenKasten, NodeFilter.SHOW_TEXT);
      const knoten: Text[] = [];
      while (lauf.nextNode()) knoten.push(lauf.currentNode as Text);
      knoten.forEach(k => {
        const i = (k.nodeValue ?? '').toLowerCase().indexOf(q.toLowerCase());
        if (i < 0) return;
        const nach = k.splitText(i);
        nach.splitText(q.length);
        const mark = document.createElement('mark');
        mark.textContent = nach.nodeValue;
        nach.replaceWith(mark);
        if (!anzahl) mark.scrollIntoView({ block: 'center', behavior: 'smooth' });
        anzahl++;
      });
      n.textContent = anzahl ? anzahl + ' Treffer' : 'nichts';
    };
    inp.addEventListener('input', suchen);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { bar.remove(); zeichneSeite(); }
    });
    bar.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { bar.remove(); zeichneSeite(); }
    });
    inp.focus();
  };

  /* ========================================================================
   * PAPIERKORB
   * ======================================================================*/
  /** Wohin soll das Wiederhergestellte? Notion legt es immer an den alten Ort. */
  const wohin = (id: string, fertig: any) => {
    const b = Store.getBlock(id);
    if (!b) return;
    const kandidaten = Object.values<any>(Store.cache.blocks)
      .filter(x => x.alive !== false && x.type === 'page' && x.id !== id)
      .sort((a, c) => (a.text || '').localeCompare(c.text || '', 'de'))
      .slice(0, 200);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(560px,94vw)">' +
        `<div class="fh">↳ „${esc(b.text || 'Ohne Titel')}" wohin?` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<input id="wo-q" placeholder="Seite suchen …" autocomplete="off">' +
        '<div class="res" id="wo-r">' +
          '<button data-ziel=""><span>🏠</span><span style="flex:1">Ganz oben, als eigene Seite</span></button>' +
          kandidaten.map(x => `<button data-ziel="${x.id}"><span>${x.icon || '📄'}</span>` +
            `<span style="flex:1">${esc(x.text || 'Ohne Titel')}` +
            `<span class="snip">${esc(Store.pfadText ? Store.pfadText(x.id) : '')}</span></span></button>`).join('') +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    const inp = o.querySelector<HTMLInputElement>('#wo-q');
    if (!inp) return;
    setTimeout(() => inp.focus(), 40);
    inp.addEventListener('input', () => {
      const q = inp.value.toLowerCase();
      o.querySelectorAll<HTMLElement>('#wo-r button[data-ziel]').forEach(btn => {
        btn.style.display = !q || (btn.textContent ?? '').toLowerCase().includes(q) ? '' : 'none';
      });
    });
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      const z = elVon(e)?.closest<HTMLElement>('[data-ziel]');
      if (!z) return;
      const ziel = z.dataset.ziel;
      Store.restoreBlock(id);
      /* An den neuen Ort hängen */
      const alt = Store.getBlock(Store.getBlock(id).parentId);
      if (alt) Store.updateBlock(alt.id, { content: (alt.content || []).filter((x: any) => x !== id) });
      Store.updateBlock(id, { parentId: ziel || null });
      if (ziel) {
        const neuEltern = Store.getBlock(ziel);
        if (neuEltern && !(neuEltern.content || []).includes(id))
          Store.updateBlock(ziel, { content: [...(neuEltern.content || []), id] });
      }
      o.remove();
      UI.toast(ziel ? 'Wiederhergestellt unter „' + (Store.getBlock(ziel).text || 'Seite') + '"'
                    : 'Ganz oben wiederhergestellt');
      if (fertig) fertig();
    });
  };

  const papierkorb = () => {
    /* Wie bei Notion: Suchfeld oben, drei Filterknöpfe, je Zeile ein Pfeil
       zum Zurückholen und ein Eimer zum endgültigen Löschen. */
    let suche = '', filterVon = '', filterOrt = '', filterBereich = '';

    const o = document.createElement('div');
    o.className = 'overlay';
    document.body.appendChild(o);

    /* Ein weggelegter Block ist keine Seite und hat keinen Titel — er hat
       einen Anfang. Für die Liste ist der Anfang der Name, und dazu, woher
       er kam: ohne die Herkunft steht dort dreimal „Text" und niemand weiss,
       welches davon zurückzuholen ist. */
    const blockName = (b: any) => {
      const roh = String(b.text || '').replace(/\s+/g, ' ').trim();
      /* `Register.bloecke` ist kein Feld, sondern ein Katalog mit `eines(id)`.
         Der Unterschied kostet hier nichts und im Betrieb einen Absturz
         mitten im Zeichnen — deshalb steht der richtige Name jetzt da und
         nicht der geratene. */
      const art = (typeof Register !== 'undefined' && Register.bloecke &&
                   (Register.bloecke.eines(b.type) || {}).name) || b.type;
      return roh ? (roh.length > 60 ? roh.slice(0, 60) + '…' : roh) : art;
    };
    const blockHer = (b: any) => {
      const e = b.parentId ? Store.getBlock(b.parentId) : null;
      return e ? (e.text || 'Ohne Titel') : 'unbekannte Seite';
    };

    const zeichne = () => {
      const alle = Store.trashed();
      let liste = alle;
      if (suche) liste = liste.filter(p => (p.text || '').toLowerCase().includes(suche.toLowerCase()));
      if (filterVon) liste = liste.filter(p => (p.geaendertVon || p.erstelltVon || 'Ich') === filterVon);
      if (filterOrt) liste = liste.filter(p => (p.parentId || '') === filterOrt);
      if (filterBereich) liste = liste.filter(p => (p.bereich || '') === filterBereich);

      /* Weggelegte Blöcke. Bis hierher zeigte sie niemand: `Strg`+`Umschalt`+
         `Rücktaste` meldete „Block in den Papierkorb" und legte ihn an einen
         Ort, den es nicht gab. Er lag auf der Platte und war an keiner
         Oberfläche mehr zu erreichen — das ist schlimmer als gelöscht,
         weil es aussieht wie Absicht. */
      let bloecke = Store.papierkorbBloecke ? Store.papierkorbBloecke() : [];
      if (suche) bloecke = bloecke.filter(b =>
        (blockName(b) + ' ' + blockHer(b)).toLowerCase().includes(suche.toLowerCase()));
      if (filterVon) bloecke = bloecke.filter(b => (b.geaendertVon || b.erstelltVon || 'Ich') === filterVon);
      if (filterOrt) bloecke = bloecke.filter(b => (b.parentId || '') === filterOrt);

      const chip = (id: string, text: string, an: any) =>
        `<button class="pk-chip${an ? ' on' : ''}" data-f="${id}">${text}<span>⌄</span></button>`;

      /* Archiviertes ist nicht gelöscht — es steht als eigene Gruppe darüber */
      const archiv = Object.values<any>(Store.cache.blocks)
        .filter(x => x.type === 'page' && x.alive !== false && x.archiviert)
        .filter(x => !suche || (x.text || '').toLowerCase().includes(suche.toLowerCase()));

      o.innerHTML =
        '<div class="finder pk">' +
          `<div class="pk-suche"><input id="pk-suche" placeholder="Seiten im Papierkorb suchen" value="${esc(suche)}"></div>` +
          '<div class="pk-chips">' +
            chip('von', filterVon ? '👤 ' + esc(filterVon) : '👤 Zuletzt bearbeitet von', !!filterVon) +
            chip('ort', filterOrt ? '📄 ' + esc((Store.getBlock(filterOrt) || {}).text || 'Seite') : '📄 In', !!filterOrt) +
            chip('bereich', '👥 Bereiche', !!filterBereich) +
          '</div>' +
          '<div class="res pk-res">' +
            (archiv.length
              ? '<div class="grp">Archiv</div>' +
                archiv.map(x =>
                  `<button data-arch="${x.id}">` +
                  `<span>${x.icon || '🗄'}</span>` +
                  `<span style="flex:1">${esc(x.text || 'Ohne Titel')}` +
                  `<span class="snip">archiviert ${esc(Werkzeuge.zeitKurz(x.archiviertAm))}</span></span>` +
                  '<span class="pk-tat" data-a="entarchiv" title="Zurückholen">↩</span></button>').join('') +
                '<div class="grp">Papierkorb</div>'
              : '') +
            (liste.length
              ? (bloecke.length ? '<div class="grp">Seiten</div>' : '') +
                liste.map(p =>
                  `<button data-id="${p.id}">` +
                  `<span>${p.icon || '📄'}</span>` +
                  `<span style="flex:1">${esc(p.text || 'Ohne Titel')}` +
                  `<span class="snip">gelöscht ${esc(Werkzeuge.zeitKurz(p.trashedAt))}</span></span>` +
                  '<span class="pk-tat" data-a="restore" title="Wiederherstellen">↩</span>' +
                  '<span class="pk-tat" data-a="restore-wo" title="An anderer Stelle wiederherstellen">↳</span>' +
                  '<span class="pk-tat weg" data-a="purge" title="Endgültig löschen">🗑</span>' +
                  '</button>').join('')
              : (bloecke.length ? ''
                 : `<div class="pk-leer">${alle.length ? 'Nichts gefunden.' : 'Der Papierkorb ist leer'}</div>`)) +
            (bloecke.length
              ? '<div class="grp">Blöcke</div>' +
                bloecke.map(b =>
                  `<button data-id="${b.id}">` +
                  '<span>🧩</span>' +
                  `<span style="flex:1">${esc(blockName(b))}` +
                  `<span class="snip">aus „${esc(blockHer(b))}" · gelöscht ` +
                  `${esc(Werkzeuge.zeitKurz(b.trashedAt))}</span></span>` +
                  '<span class="pk-tat" data-a="restore" title="Wiederherstellen">↩</span>' +
                  '<span class="pk-tat weg" data-a="purge" title="Endgültig löschen">🗑</span>' +
                  '</button>').join('')
              : '') +
          '</div>' +
          /* Die Frist steht in den Einstellungen und nicht fest bei 30 — hier
             stand jahrelang „30 Tage", auch wenn jemand 7 eingestellt hatte.
             Eine Zusage, die von der Einstellung abweicht, ist schlimmer als
             gar keine: sie wird geglaubt. */
          '<div class="hint pk-hint">' + (() => {
            const t = Number(Store.getMeta('papierkorbTage', 30));
            return t ? `Nach ${t} Tagen im Papierkorb wird endgültig gelöscht. `
                     : 'Automatisch gelöscht wird nichts — so ist es eingestellt. ';
          })() + 'Endgültig Gelöschtes lässt sich nicht zurückholen.' +
          (alle.length + bloecke.length
            ? '<button class="pk-alle" data-a="alle">Papierkorb leeren</button>' : '') +
          '</div>' +
        '</div>';

      const inp = o.querySelector<HTMLInputElement>('#pk-suche');
      if (!inp) return;
      inp.addEventListener('input', () => {
        suche = inp.value;
        const stelle = inp.selectionStart;
        zeichne();
        const neu = o.querySelector<HTMLInputElement>('#pk-suche');
        if (neu) { neu.focus(); neu.setSelectionRange(stelle, stelle); }
      });
      inp.focus();
    };

    o.addEventListener('click', async e => {
      if (e.target === o) { o.remove(); return; }

      const f = elVon(e)?.closest<HTMLElement>('[data-f]');
      if (f) {
        const r = f.getBoundingClientRect();
        const alle = Store.trashed();
        let eintraege: string[][] = [];
        let setzen: (v: any) => void = () => {};
        if (f.dataset.f === 'von') {
          eintraege = [...new Set(alle.map(p => p.geaendertVon || p.erstelltVon || 'Ich'))]
            .map(n => [n, '👤 ' + n]);
          setzen = (v: any) => { filterVon = v; };
        } else if (f.dataset.f === 'ort') {
          eintraege = [...new Set(alle.map(p => p.parentId).filter(Boolean))]
            .map(id => [id, '📄 ' + ((Store.getBlock(id) || {}).text || 'Seite')]);
          setzen = (v: any) => { filterOrt = v; };
        } else {
          eintraege = (Store.getMeta('bereiche', []) || []).map((b: any) => [b.id, (b.icon || '👥') + ' ' + b.name]);
          setzen = (v: any) => { filterBereich = v; };
        }
        const m = UI.menu('<button data-v="">Alle</button>' +
          (eintraege.length
            ? eintraege.map(([v, t]) => `<button data-v="${esc(v)}">${esc(t)}</button>`).join('')
            : '<div class="grp">Nichts zur Auswahl</div>'),
          r.left, r.bottom + 4);
        m.addEventListener('click', ev => {
          const b2 = elVon(ev)?.closest<HTMLElement>('[data-v]');
          if (!b2) return;
          setzen(b2.dataset.v); m.remove(); zeichne();
        });
        return;
      }

      if (elVon(e)?.closest<HTMLElement>('[data-a="alle"]')) {
        const bl = Store.papierkorbBloecke ? Store.papierkorbBloecke() : [];
        const n = Store.trashed().length + bl.length;
        if (!confirm(`${n} ${n === 1 ? 'Ding' : 'Dinge'} endgültig löschen? ` +
                     'Mit ihnen gehen ihre Fassungen und Anhänge. ' +
                     'Das lässt sich nicht rückgängig machen.')) return;
        Store.trashed().forEach(p => Store.purgeBlock(p.id));
        bl.forEach(b => Store.purgeBlock(b.id));
        zeichne(); zeichneBaum(); App.zeichneSeite(); UI.toast('Papierkorb geleert');
        return;
      }

      const arch = elVon(e)?.closest<HTMLElement>('button[data-arch]');
      if (arch) {
        if (arch.dataset.arch)
          Store.updateBlock(arch.dataset.arch, { archiviert: false, archiviertAm: '' });
        zeichne(); zeichneBaum();
        UI.toast('Aus dem Archiv geholt');
        return;
      }

      const s = elVon(e)?.closest<HTMLElement>('[data-a]');
      const b = elVon(e)?.closest<HTMLElement>('button[data-id]');
      if (!b) return;
      const id = b.dataset.id;
      if (!id) return;
      if (s && s.dataset.a === 'restore') {
        /* Ist der alte Ort selbst im Papierkorb, käme die Seite nicht zurück —
           Notion sagt in dem Fall nichts und man sucht ewig. */
        const b2 = Store.getBlock(id);
        const eltern = b2 && b2.parentId ? Store.getBlock(b2.parentId) : null;
        if (eltern && eltern.alive === false) {
          UI.toast('Der alte Ort liegt selbst im Papierkorb — wähle einen neuen');
          wohin(id, () => { zeichne(); zeichneBaum(); });
          return;
        }
        Store.restoreBlock(id); zeichne(); zeichneBaum();
        /* Ein Block kommt auf einer Seite zurück, nicht im Baum. Ohne das
           Neuzeichnen stünde er wieder in der Ablage und nicht auf dem
           Bildschirm — und wer nichts sieht, klickt noch einmal. */
        App.zeichneSeite();
        UI.toast('Wiederhergestellt'); return;
      }
      if (s && s.dataset.a === 'restore-wo') { wohin(id, () => { zeichne(); zeichneBaum(); }); return; }
      if (s && s.dataset.a === 'purge') {
        const w = Store.getBlock(id);
        if (!confirm((w && w.type !== 'page' ? 'Diesen Block' : 'Das') +
                     ' endgültig löschen? Mit ihm gehen seine Fassungen und Anhänge. ' +
                     'Das lässt sich nicht rückgängig machen.')) return;
        Store.purgeBlock(id); zeichne(); App.zeichneSeite(); UI.toast('Endgültig gelöscht'); return;
      }
      /* Klick auf die Zeile selbst: zurückholen und hingehen. Bei einem
         Block ist „hin" nicht der Block — der ist keine Seite und liesse
         sich nicht öffnen —, sondern die Seite, auf der er wieder steht. */
      const w2 = Store.getBlock(id);
      Store.restoreBlock(id); o.remove();
      oeffne(w2 && w2.type !== 'page' ? (w2.parentId || id) : id);
    });

    zeichne();
  };

  /* ========================================================================
   * EINSTELLUNGEN
   * ======================================================================*/
  /* Der Einstellungsbereich liegt in einer eigenen Datei. */
  const einstellungen = (bereich?: any) => Einstellungen.oeffne(bereich);

  /* ==========================================================================
   * DAS R-BLATT — der Arbeitsbereich am Telefon (Phase 7)
   * --------------------------------------------------------------------------
   * Ein Blatt über den ganzen Bildschirm statt einer hereingeschobenen
   * Seitenleiste. Zwei Gruppen: oben die Wege, unten die Werkzeuge — und
   * ganz oben der Satz, der Redion von allem anderen unterscheidet.
   *
   * Die Zeilen sind 56 px hoch. Das ist keine Grosszügigkeit, sondern die
   * Rechnung: darunter trifft der Daumen die Nachbarzeile mit.
   * ========================================================================*/
  const rMenue = (): void => {
    const zeile = (was: string, zeichen: string, name: string, hinweis = '') =>
      `<button data-r="${was}"><span class="rm-z">${zeichen}</span>` +
      `<span class="rm-n">${name}</span>` +
      (hinweis ? `<span class="rm-h">${hinweis}</span>` : '') + '</button>';

    const o = document.createElement('div');
    o.id = 'r-blatt';
    o.innerHTML =
      '<div class="rm-kopf">' +
        '<div><b>Redion</b><span>Alles bleibt auf diesem Gerät</span></div>' +
        '<button class="rm-zu" data-r="zu" aria-label="Schliessen">✕</button>' +
      '</div>' +
      '<div class="rm-rollen">' +
        '<div class="rm-gruppe">' +
          zeile('suche', '🔍', 'Suchen') +
          zeile('befehle', '⌘', 'Befehle') +
          zeile('start', '🏠', 'Start') +
          zeile('seiten', '📄', 'Seiten') +
          /* „Mehr" statt „Posteingang" (E42 §16). Der Posteingang ist kein
             eigener Weg mehr, sondern eine Zeile IN Mehr — er ist meistens
             leer, und ein Platz in der Hauptnavigation gehört dem, was man
             oft braucht. Der Kompass steht bewusst NICHT hier: die Vorgabe
             sagt ausdrücklich, er sei eine Seite in Mehr, kein Reiter. */
          zeile('mehr', '🧭', 'Mehr') +
          zeile('neu', '✚', 'Neue Seite') +
          /* Die KI hat oben keinen Reiter mehr (E38). Sie ist deshalb NICHT
             weg: unten steht „KI fragen", und hier steht der Weg zu allem,
             was länger dauert als eine Frage. */
          zeile('ki', '✨', 'KI und Verlauf') +
        '</div>' +
        '<div class="rm-gruppe">' +
          zeile('import', '⭱', 'Importieren') +
          zeile('sichern', '⬇', 'Sichern', 'als Datei auf dieses Gerät') +
          zeile('papierkorb', '🗑', 'Papierkorb') +
          zeile('tasten', '⌨', 'Tastenkürzel') +
          zeile('einstellungen', '⚙', 'Einstellungen') +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    requestAnimationFrame(() => o.classList.add('auf'));

    /* DER SPEICHERBALKEN (Vorgabe §16). Er gehört genau hierher und
       nirgendwo sonst: das R-Blatt ist der Ort für den Arbeitsbereich, und
       „wie viel liegt hier eigentlich?" ist bei einer App, die alles auf
       dem Gerät hält, die erste Frage danach.

       NACHGETRAGEN, NICHT MITGEBAUT — `navigator.storage.estimate()` ist
       asynchron und braucht auf einem vollen Gerät spürbar Zeit. Darauf zu
       warten hiesse, das Blatt später zu öffnen; also kommt der Balken
       nach, wenn er da ist. Ist das Blatt bis dahin zu, passiert nichts. */
    void (async () => {
      let stand: { benutzt?: number | undefined;
                   verfuegbar?: number | undefined } | null = null;
      try { stand = await Store.usage(); } catch { }
      if (!stand || !stand.benutzt || !o.isConnected) return;
      const rollen = o.querySelector('.rm-rollen');
      if (!rollen) return;
      const mb = (n: number) => n >= 1073741824
        ? (n / 1073741824).toFixed(2).replace('.', ',') + ' GB'
        : Math.round(n / 1048576) + ' MB';
      const anteil = stand.verfuegbar
        ? Math.min(100, Math.round((stand.benutzt / stand.verfuegbar) * 100)) : 0;
      const k = document.createElement('div');
      k.className = 'rm-speicher';
      k.innerHTML =
        '<div class="rs-kopf"><span>Auf diesem Gerät</span>' +
        `<b>${mb(stand.benutzt)}</b></div>` +
        `<div class="rs-balken"><i style="width:${Math.max(2, anteil)}%"></i></div>` +
        `<div class="rs-fuss">${stand.verfuegbar
          ? anteil + ' % von ' + mb(stand.verfuegbar) + ' — der Browser gibt den Rest frei, wenn er ihn braucht'
          : 'Wie viel der Browser noch freigibt, sagt er nicht.'}</div>`;
      rollen.appendChild(k);
    })();

    const zu = () => { o.classList.remove('auf'); setTimeout(() => o.remove(), 200); };
    o.addEventListener('click', (e) => {
      const b = (e.target instanceof Element) ? e.target.closest<HTMLElement>('[data-r]') : null;
      if (!b) return;
      const was = b.dataset.r;
      zu();
      /* Erst schliessen, dann handeln: ein Dialog, der unter einem Blatt
         aufgeht, ist von aussen nicht erreichbar. */
      setTimeout(() => {
        if (was === 'ki')                kiPanel(true);
        else if (was === 'suche')        suche();
        else if (was === 'befehle')      Werkzeuge.palette();
        /* DERSELBE FUND WIE OBEN AN DEN REITERN, und hier stand er dreimal:
           `handyLeiste()` liest `Seitenleiste.reiter()`. Wer nur zeichnet,
           bekommt die Ansicht — und daneben eine Pille, die auf den vorigen
           Bereich zeigt. Erst den Reiter setzen, dann zeichnen. */
        else if (was === 'seiten')       { Seitenleiste.reiter('seiten');
                                           Ansichten.seiten(); handyLeiste(); }
        else if (was === 'start')        { Seitenleiste.reiter('start');
                                           Ansichten.start(); handyLeiste(); }
        else if (was === 'mehr')         { Seitenleiste.reiter('mehr');
                                           Ansichten.mehr(); handyLeiste(); }
        else if (was === 'neu')          neueSeite();
        else if (was === 'import')       Werkzeuge.dateienLesen();
        else if (was === 'sichern')      sicherungSpeichern();
        else if (was === 'papierkorb')   papierkorb();
        else if (was === 'tasten')       Werkzeuge.tastenkuerzel();
        else if (was === 'einstellungen') einstellungen();
      }, 60);
    });
    /* Zurück-Taste des Telefons schliesst das Blatt, statt die Seite zu
       verlassen — sonst ist der einzige Weg heraus das kleine Kreuz. */
    const zurueckTaste = () => { zu(); removeEventListener('popstate', zurueckTaste); };
    addEventListener('popstate', zurueckTaste);
  };

  /**
   * Die Sicherung schreiben.
   *
   * ZWEI FORMATE, UND DAS IST ABSICHT.
   *
   *   ohne Anhänge → `.json`, wie bisher. Lesbar, klein, in jedem Editor zu
   *                  öffnen. Für einen Bestand aus Text ist das genau richtig.
   *   mit Anhängen → `.redion`, ein ZIP: `daten.json` plus einen Ordner
   *                  `dateien/` mit den Anhängen unter ihren echten Namen.
   *
   * WARUM NICHT IMMER ZIP. Wer nur Text hat, soll seine Sicherung aufmachen
   * und lesen können. Ein Archiv um eine einzige JSON-Datei ist eine Hürde
   * ohne Gegenwert.
   *
   * WARUM DIE ANHÄNGE UNTER IHREN ECHTEN NAMEN LIEGEN. Ein `.redion` ist ein
   * gewöhnliches ZIP. Wer es in zehn Jahren öffnet — mit irgendeinem
   * Packprogramm, ohne Redion —, findet darin seine Bilder und Videos, jedes
   * mit seinem Namen. Das ist der eigentliche Sinn einer Sicherung: sie muss
   * die App überleben, die sie geschrieben hat.
   *
   * WARUM DAS 500-MB-VIDEO DURCHGEHT. Kein Anhang wird je ganz in den
   * Arbeitsspeicher geholt. Die Stücke liegen als Blob in der Ablage,
   * `Dateien.alsBlob` reiht sie aneinander, ohne sie zu lesen, und der
   * ZIP-Packer rechnet die Prüfsumme scheibchenweise. Was durch den Speicher
   * geht, ist immer nur ein Megabyte.
   */
  /**
   * Merkt sich, dass gerade gesichert wurde.
   *
   * WARUM DAS HIER FEHLTE UND WAS ES ANRICHTETE. Den Zeitstempel
   * `sicherung:zuletzt` schrieb bis jetzt einzig `Krypto.sicherungSchreiben`
   * — der Weg über den Verschlüsselungs-Dialog. Der Hauptweg, dieser hier,
   * schrieb ihn nicht: nicht aus den Einstellungen, nicht aus der PWA, nicht
   * aus der Befehlsleiste. Wer also normal sicherte — und das sind alle —
   * bekam bis in alle Ewigkeit „Noch nie gesichert." zu lesen. Eine Warnung,
   * die auch dann kommt, wenn alles in Ordnung ist, bringt einem bei, sie zu
   * übersehen; und dann übersieht man sie auch, wenn sie stimmt.
   *
   * `sicherung:art` steht daneben, weil die beiden Sicherungen nicht
   * dasselbe können: `.redion` nimmt die Anhänge mit, `.json` nicht. Wer nur
   * JSON gesichert hat, hat seine Bilder nicht gesichert — das darf die
   * Anzeige nicht verschweigen.
   */
  /* Der Zeitpunkt wird im Kern festgehalten (E208) — dieselbe Stelle, die
     ihn auch wieder ausliest. Zwei Schreiber auf einer Marke sind zwei
     Gelegenheiten, den Namen zu vertippen. */
  const sicherungGemerkt = (art: 'json' | 'redion'): void => Sicherung.merken(art);

  /**
   * Gibt zurück, ob die Sicherung wirklich zustande kam.
   *
   * Der `catch` unten fängt den Fehler und kehrt regulär zurück — richtig
   * für die Aufrufer, die nur einen Knopf drücken. Aber der Sichern-Knopf
   * in den Datenbank-Ansichten zeigte danach „✓ Gesichert", weil `.then`
   * eine reguläre Rückkehr nicht von einem Erfolg unterscheiden kann.
   * Deshalb: `true` heisst gesichert, `false` heisst nicht.
   */
  /**
   * DAS PAKET BAUEN — ohne es auszuliefern (E270).
   *
   * Vorher war Bauen und Ausliefern ein Stück: derselbe Ablauf las den
   * Bestand, packte das Archiv, hängte ein `<a download>` an den Browser
   * und meldete „Gesichert". Für den Knopf ist das richtig. Für die
   * automatische Sicherung in einen Ordner ist es unbrauchbar — sie will
   * genau dasselbe Paket, aber in eine Datei schreiben statt in den
   * Download-Ordner, und ohne dass ein Fenster aufgeht.
   *
   * Die Alternative wäre gewesen, das Packen ein zweites Mal zu
   * schreiben. Zwei Stellen, die eine Sicherung bauen, sind zwei
   * Gelegenheiten, dass die eine etwas auslässt, was die andere mitnimmt —
   * und man merkt es erst, wenn man die Sicherung braucht. Also einmal
   * bauen, zweimal ausliefern. Dasselbe, was `Krypto.paketBauen` vormacht.
   *
   * Wirft bei einem Fehler, statt `false` zurückzugeben: der Knopf zeigt
   * daraus einen `alert`, die automatische Sicherung darf das nicht (ein
   * Fenster, das im Hintergrund aufspringt, ist keine Meldung, sondern ein
   * Überfall). Wer ruft, entscheidet, wie er es sagt.
   *
   * @param melden Wohin die Zwischenstände gehen. Ohne Angabe: Toast.
   *        Die automatische Sicherung gibt hier eine stille Funktion mit.
   */
  const sicherungPaketBauen = async (
    melden?: ((text: string) => void) | null
  ): Promise<{ blob: Blob; art: 'json' | 'redion'; endung: string;
               anhaenge: number; versionen: number }> => {
    const sagen = melden || ((t: string) => UI.toast(t));
    /* Erst holen, was nicht im Zwischenspeicher liegt — der Versionsverlauf.
       Er fehlte in jeder Sicherung, die diese App je geschrieben hat. */
    const stand = await Store.exportVorbereiten();

    if (!stand.dateien) {
      return { blob: new Blob([Store.exportAll()], { type: 'application/json' }),
               art: 'json', endung: '.json',
               anhaenge: 0, versionen: stand.versionen };
    }

    sagen(stand.dateien + ' Anhänge kommen mit — das dauert einen Moment');
    {
      /* ABGELEITETES BLEIBT DRAUSSEN (E103). Ein gerastertes PDF-Seiten-
         bild entsteht beim Einlesen in Sekunden neu; mitgepackt kostet es
         bei 200 KB je Seite und 500 Seiten hundert Megabyte in JEDER
         Sicherung. Eine Sicherung, die man auf dem Telefon nicht mehr
         herunterladen kann, ist keine Sicherung.
         Gefiltert wird HIER und nicht in der Schleife unten, weil
         `dateien.json` aus derselben Liste entsteht: ein Satz darin, dessen
         Bytes fehlen, wäre ein Anhang, den der Block sucht und nicht
         findet. Lieber gar nicht erwähnt als falsch versprochen. */
      const saetze = (await Store.dateiAlle())
        .filter((s: any) => !(s && s.abgeleitet));
      const eintraege: { name: string; inhalt: any; kennung?: string }[] =
        [{ name: 'daten.json', inhalt: Store.exportAll(true) }];
      const belegt = new Set(['daten.json']);

      for (const satz of saetze) {
        const inhalt = await Dateien.alsBlob(satz.id);
        if (!inhalt) continue;             /* angefangener Upload ohne Stücke */
        /* Zwei Bilder dürfen „foto.jpg" heissen. Im Archiv darf ein Name nur
           einmal vorkommen, sonst überschreibt das Auspacken das eine mit dem
           anderen — still, wie immer bei dieser Sorte Fehler. */
        const roh = String(satz.name || 'Datei').replace(/[\\/:*?"<>|]/g, '-');
        let name = 'dateien/' + roh;
        if (belegt.has(name)) {
          const punkt = roh.lastIndexOf('.');
          const stamm = punkt > 0 ? roh.slice(0, punkt) : roh;
          const endung = punkt > 0 ? roh.slice(punkt) : '';
          let n = 2;
          while (belegt.has('dateien/' + stamm + '-' + n + endung)) n++;
          name = 'dateien/' + stamm + '-' + n + endung;
        }
        belegt.add(name);
        eintraege.push({ name, inhalt, kennung: satz.id } as { name: string; inhalt: any; kennung?: string });
      }

      /* Die Zuordnung Name → Kennung gehört in die Sicherung, sonst weiss
         beim Einspielen niemand, welcher Block welches Bild meint. */
      const karte: Record<string, string> = {};
      eintraege.forEach(e => { if (e.kennung) karte[e.name] = e.kennung; });
      eintraege.push({ name: 'dateien.json', inhalt: JSON.stringify({
        version: 1, saetze, zuordnung: karte }, null, 2) });

      /* „Gesichert: foto.jpg" log hier: der Fortschritt kommt aus der
         Prüfsummen-Schleife, das Archiv ist da noch gar nicht gebaut,
         geschweige denn heruntergeladen. Das Wort „Gesichert" gehört dem
         Abschluss-Toast unten — hier ist es nur ein Lebenszeichen. */
      const blob = await Austausch.zipSchreiben(eintraege,
        (name: string, anteil: any) => { if (anteil >= 1) sagen('Geprüft: ' + name.replace('dateien/', '') + ' — wird verpackt'); });
      return { blob, art: 'redion', endung: '.redion',
               anhaenge: eintraege.length - 2, versionen: stand.versionen };
    }
  };

  const sicherungSpeichern = async (): Promise<boolean> => {
    try {
      const paket = await sicherungPaketBauen();
      const heute = new Date().toISOString().slice(0, 10);
      const l = document.createElement('a');
      l.href = URL.createObjectURL(paket.blob);
      l.download = 'redion-sicherung-' + heute + paket.endung;
      l.click();
      sicherungGemerkt(paket.art);
      UI.toast(paket.art === 'json'
        ? 'Sicherung gespeichert (' + paket.versionen + ' Fassungen im Verlauf)'
        : 'Sicherung gespeichert — mit ' + paket.anhaenge + ' Anhang/Anhängen');
      return true;
    } catch (err) {
      /* Kein stiller Fehlschlag. Wer glaubt, gesichert zu haben, und es nicht
         hat, ist schlechter dran als jemand, der es weiss.
         Neu seit E270 deckt dieser Fang auch den JSON-Weg ab — der lief
         vorher ungeschützt, und ein Fehler dort verschwand in einer nicht
         behandelten Zusage. */
      alert('Die Sicherung kam nicht zustande: ' +
            (err instanceof Error ? err.message : String(err)) +
            '\n\nEs wurde nichts geschrieben.');
      return false;
    }
  };

  /**
   * Die Anhänge aus einem `.redion` zurück in die Ablage.
   *
   * MIT DEN ALTEN KENNUNGEN, und das ist der ganze Punkt. Ein Block zeigt
   * über die Kennung auf seine Datei. Legte man die Anhänge als neue Uploads
   * ab, bekäme jeder eine frische Kennung — die Bilder wären da und keiner
   * fände sie. Deshalb werden Dateisatz und Stücke von Hand geschrieben,
   * statt den bequemen Weg über `Dateien.ablegen` zu nehmen.
   *
   * In Stücke zerlegt wird wieder, weil die Ablage es so hält: `blob.slice`
   * schneidet, ohne zu lesen — auch bei einem halben Gigabyte.
   */
  /**
   * DIE ANHÄNGE KOMMEN NACH DEN BLÖCKEN — UND EINZELN (L101 Punkt 2, E317).
   *
   * Die Alles-oder-nichts-Zusage von `importAll` gilt für fünf Fächer. Die
   * Anhänge folgen danach, jeder in einer eigenen Transaktion; ein grosses
   * Video in EINER Transaktion würde die Ablage minutenlang blockieren
   * (§10), und daran ändert dieser Bogen nichts.
   *
   * Was er ändert, ist das SCHWEIGEN. Vorher stand hier zweimal `continue`
   * — fehlte ein Eintrag im Archiv oder liess er sich nicht lesen, wurde er
   * übersprungen, und am Ende meldete Redion nur, wie viele es geschafft
   * haben. Ein Block zeigte danach auf eine Datei, die es nicht gibt, und
   * niemand hatte etwas gesagt.
   *
   * Jetzt wird gezählt, was FEHLT, und beim Namen genannt. Und ein einzelner
   * Fehler bricht nicht mehr den Rest ab: wer neunzig von hundert Anhängen
   * retten kann, soll neunzig retten und die zehn benennen.
   *
   * ─── UND WAS ANKAM, IST NICHT ZWINGEND GANZ (L101 Punkt 4, E318) ─────────
   *
   * Der verschlüsselte Weg vergleicht die angekündigte Bytezahl mit der
   * gelieferten und nennt einen Eintrag „fehlt oder ist abgeschnitten"
   * (`krypto.ts`). Der offene Weg hatte dieselbe Zahl vorliegen — jeder
   * Dateisatz führt seine `groesse` mit — und sah nicht hin. Er schrieb die
   * TATSÄCHLICHE Länge in den Satz und stempelte `zustand: 'fertig'`. Ein
   * halbes Video hiess danach vollständig, und der einzige Hinweis war das
   * Video selbst.
   *
   * Weggeworfen wird deswegen nichts (§46): neunzig Prozent eines Fotos sind
   * neunzig Prozent, und im offenen Archiv ist eine Verkürzung viel eher
   * eine unvollständige Sicherung als ein Angriff — der verschlüsselte Weg
   * kann das über den AEAD-Anhänger unterscheiden, dieser nicht. Gesagt wird
   * es trotzdem, und in einer EIGENEN Liste: „fehlt" und „kam verkürzt an"
   * sind zwei verschiedene Sätze mit zwei verschiedenen Folgen.
   */
  const anhaengeEinspielen = async (zip: any, art: string) => {
    const leer = { da: 0, erwartet: 0, fehlend: [] as string[],
                   unvollstaendig: [] as string[] };
    const roh = await zip.text('dateien.json');
    if (!roh) return leer;

    /* NICHT `JSON.parse` (E318). `dateien.json` ist genauso fremd wie
       `daten.json`, und ihr Inhalt geht gleich durch `Object.assign` in die
       Ablage — das ist wörtlich das Loch, das E284 für die fünf Fächer
       geschlossen hat. Hier stand es noch offen, ein Stockwerk tiefer. */
    let karte: any;
    try { karte = ImportSicherheit.lesen(roh).wert; } catch { return leer; }
    if (!karte || typeof karte !== 'object') return leer;

    const STUECK = (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.STUECK : 1024 * 1024;
    /* Prototyplos, aus demselben Grund: eine Kennung `constructor` aus der
       Datei gäbe sonst `Object` zurück statt `undefined`, und die Prüfung
       „steht nicht im Archiv" verfehlte genau den Fall, für den sie da ist. */
    const nachName: Record<string, string> = Object.create(null);
    Object.entries<any>(karte.zuordnung || {}).forEach(([name, id]) => { nachName[id] = name; });

    let wieViele = 0;
    const fehlend: string[] = [];
    const unvollstaendig: string[] = [];
    const nichtGeschafft = (satz: any, warum: string): void => {
      fehlend.push(String(satz?.name || satz?.id || 'ohne Namen') + ' (' + warum + ')');
    };

    /**
     * Sagt, um wie viele Bytes ein Anhang zu kurz ankam — oder 0.
     *
     * SCHWEIGT IN DREI FÄLLEN, und jeder einzelne ist ein echter Normalfall,
     * kein Nachlassen:
     *
     *   · Die Sicherung nennt keine Grösse. Ältere `.redion` und fremde
     *     Werkzeuge tun das; ohne Zahl gibt es nichts zu vergleichen.
     *   · Der Satz war schon beim Sichern unfertig (`zustand` nicht
     *     `fertig`, oder `angekommen < teile`). Dann sind die kurzen Bytes
     *     genau das, was dasteht — ein laufender Upload zur Sicherungszeit.
     *   · Es kam MEHR an als angekündigt. Das ist keine Verkürzung; es wäre
     *     eine andere Frage, und eine Warnung dafür hätte hier nichts zu
     *     suchen.
     */
    const zuKurz = (satz: any, hat: number): number => {
      const soll = satz?.groesse;
      if (typeof soll !== 'number' || !Number.isFinite(soll) || soll <= 0) return 0;
      if (satz.zustand && satz.zustand !== 'fertig') return 0;
      if (typeof satz.angekommen === 'number' && typeof satz.teile === 'number' &&
          satz.angekommen < satz.teile) return 0;
      return hat < soll ? soll - hat : 0;
    };
    for (const satz of (karte.saetze || [])) {
     try {
      const name = nachName[satz.id];
      if (!name) { nichtGeschafft(satz, 'steht nicht im Archiv'); continue; }
      const roh2 = await zip.alsBlob(name);
      if (!roh2) { nichtGeschafft(satz, 'liess sich nicht lesen'); continue; }
      /* `alsBlob` hat die Bytes nie gelesen — hier bleibt es dabei. Der Typ
         kommt aus dem Dateisatz, nicht aus dem Archiv: ein ZIP kennt keine
         Medientypen, und ohne ihn zeigt der Browser ein Bild als Download. */
      const blob = roh2.type === (satz.typ || '') ? roh2
                 : new Blob([roh2], { type: satz.typ || 'application/octet-stream' });

      /* Alte Stücke derselben Kennung zuerst weg — sonst lägen beim
         Dazulegen zwei Fassungen übereinander und die Datei wäre doppelt
         so lang wie sie sein sollte. */
      for (const alt of await Store.stueckeVon(satz.id)) await Store.stueckWeg(alt.id);

      const teile = Math.max(1, Math.ceil(blob.size / STUECK));
      for (let nr = 0; nr < teile; nr++) {
        const von = nr * STUECK;
        await Store.stueckPut({ id: satz.id + ':' + nr, dateiId: satz.id, nr,
                                blob: blob.slice(von, Math.min(von + STUECK, blob.size)) });
      }
      /* DIE ANGEKÜNDIGTE LÄNGE GEGEN DIE GELIEFERTE (E318). Geschrieben wird
         die TATSÄCHLICHE — ein Satz, der eine Länge behauptet, die seine
         Stücke nicht hergeben, wäre die nächste stille Lüge. Gesagt wird die
         Differenz stattdessen. */
      const fehlt = zuKurz(satz, blob.size);
      if (fehlt > 0) {
        unvollstaendig.push(String(satz.name || satz.id) +
          ' (' + Dateien.groesseText(fehlt) + ' fehlen)');
      }
      await Store.dateiPut(Object.assign({}, satz, {
        teile, angekommen: teile, zustand: 'fertig', groesse: blob.size }));
      wieViele++;
     } catch (e: unknown) {
       /* EIN ANHANG BRICHT NICHT DEN REST AB. Voller Speicher, ein
          beschädigtes Stück, ein Blob, den der Browser nicht mag — das
          betrifft diese eine Datei, nicht die neunzig danach. */
       nichtGeschafft(satz, e instanceof Error ? e.message.slice(0, 60) : 'Fehler');
     }
    }

    /* ERSETZEN heisst: der Bestand sieht danach aus wie die Sicherung. Für
       die Anhänge gilt das nur, wenn die Sicherung sie überhaupt abdeckt —
       und genau das tut sie hier, sonst gäbe es keine `dateien.json`.
       Anhänge, die in ihr nicht vorkommen, gehören zu Seiten, die es jetzt
       auch nicht mehr gibt; sie blieben sonst für immer unerreichbar liegen.

       Bei einer `.json`-Sicherung geschieht das ausdrücklich NICHT: die sagt
       selbst, dass sie die Anhänge nicht enthält. Etwas wegzuwerfen, weil es
       in einer Datei fehlt, die zugibt, es nicht zu kennen, wäre die
       schlimmste Art von Datenverlust. */
    if (art === 'ersetzen') {
      const gehoertDazu = new Set((karte.saetze || []).map((s: any) => s.id));
      for (const alt of await Store.dateiAlle()) {
        if (gehoertDazu.has(alt.id)) continue;
        for (const st of await Store.stueckeVon(alt.id)) await Store.stueckWeg(st.id);
        await Store.dateiWeg(alt.id);
        /* Und die Adresse aus dem Zwischenspeicher — sonst zeigt ein Block,
           der noch auf diese Kennung zeigt, weiter das alte Bild (E106). */
        Dateien.adresseWeg(alt.id);
      }
    }
    return { da: wieViele, erwartet: (karte.saetze || []).length,
             fehlend, unvollstaendig };
  };

  const sicherungLaden = (danach?: any) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.redion,.zip';
    inp.addEventListener('change', async () => {
      const f = inp.files?.[0]; if (!f) return;

      /* Ein `.redion` ist ein ZIP mit `daten.json` darin. Erkannt wird es am
         Inhalt und nicht an der Endung: eine umbenannte Datei ist deswegen
         nicht kaputt, und eine `.json`, die in Wahrheit ein ZIP ist, wäre
         sonst „keine Sicherung". */
      let zip = null, text = '';
      const kopf = new Uint8Array(await f.slice(0, 4).arrayBuffer());
      const istZip = kopf[0] === 0x50 && kopf[1] === 0x4B;
      if (istZip) {
        try {
          zip = await Einlesen.zipLesenAusBlob(f);
          text = await zip.text('daten.json') || '';
        } catch (e) {
          alert('Dieses Archiv liess sich nicht öffnen: ' +
            (e instanceof Error ? e.message : String(e)));
          return;
        }
        if (!text) {
          alert('In diesem Archiv steckt keine „daten.json" — es ist keine ' +
                'Redion-Sicherung.');
          return;
        }
      } else {
        text = await f.text();
      }

      /* WAS SOLL GESCHEHEN? Vorher gab es diese Frage nicht, und das Ergebnis
         war keines von beidem: die Sicherung überschrieb den Zwischenspeicher
         und liess die Ablage stehen. Nach dem nächsten Neuladen lagen die
         alten Seiten wieder zwischen den eingespielten. Es sah aus wie ein
         geglückter Vorgang — die schlimmste Sorte Fehler, die diese App
         haben kann.

         `CLAUDE.md`: nichts löschen ohne Rückfrage. Also wird gefragt. */
      let vorschau: Record<string, any> = {};
      try { vorschau = JSON.parse(text); } catch {
        alert('Diese Datei ist keine Sicherung — sie lässt sich nicht lesen.');
        return;
      }
      /* --- WAS SICH ÄNDERT, NICHT WIE GROSS DIE DATEI IST (L101, E316) ---
         Hier stand: „Die Datei enthält 1247 Blöcke. In diesem Bestand
         liegen gerade 1180." Das sagt, wie GROSS die Sicherung ist, nicht
         was sie tut. Wer wissen will, ob die eigene Seite von gestern
         überlebt, erfuhr es erst danach — und dann war sie weg.

         Es ist die letzte Stelle vor einem Vorgang, der löscht. Genau dort
         gehört die Frage beantwortet, die ein Mensch wirklich hat.

         Gerechnet wird für BEIDE Wege getrennt, denn sie tun Verschiedenes:
         beim Dazulegen verschwindet nichts, beim Ersetzen schon. Der Satz
         steht deshalb am jeweiligen Knopf und nicht darüber. */
      const faecherJetzt = {
        blocks: Store.cache.blocks || {},
        collections: Store.cache.collections || {},
        views: Store.cache.views || {}
      };
      const faecherDatei = {
        blocks: vorschau.blocks || {},
        collections: vorschau.collections || {},
        views: vorschau.views || {}
      };
      const beimErsetzen = ImportVergleich.rechnen(faecherJetzt, faecherDatei, 'ersetzen');
      const beimDazu = ImportVergleich.rechnen(faecherJetzt, faecherDatei, 'zusammenfuehren');

      const wahl = await Dialog.wahl({
        titel: 'Sicherung einspielen',
        text: 'Die Datei enthält ' +
              Object.keys(vorschau.blocks || {}).length + ' Blöcke' +
              (Array.isArray(vorschau.versions) ? ' und ' + vorschau.versions.length +
                ' Fassungen aus dem Verlauf' : '') + '.' +
              (vorschau.hinweis ? '\n\n' + vorschau.hinweis : ''),
        knoepfe: [
          { id: 'ersetzen', text: 'Ersetzen',
            hinweis: ImportVergleich.satz(beimErsetzen) +
                     ' Vorher lädt Redion eine Sicherheitskopie des jetzigen ' +
                     'Standes herunter.' },
          { id: 'zusammenfuehren', text: 'Dazulegen',
            hinweis: ImportVergleich.satz(beimDazu) +
                     ' Es wird nichts gelöscht.' },
          { id: '', text: 'Abbrechen' }
        ]
      });
      if (!wahl) return;

      /* DAS NETZ UNTER DEM SEIL (E292, L101 Punkt 3).
         Der VERSCHLÜSSELTE Weg schreibt seit jeher eine Sicherheitskopie,
         bevor er ersetzt (`krypto.ts:935`, dort steht derselbe Satz). Der
         offene Weg tat es nicht — und das ist genau verkehrt herum zur
         Gefahr, denn den offenen Weg benutzen mehr Leute.

         Nur beim ERSETZEN, denn nur dort wird gelöscht. Beim Dazulegen
         bliebe alles stehen, und eine Kopie, die niemand braucht, ist eine
         Datei im Download-Ordner, die man nicht bestellt hat.

         `sicherungSpeichern` und nicht `Krypto.sicherungSchreiben`: dieser
         Weg nimmt auch ein `.redion`, und bei einem `.redion` löscht das
         Ersetzen auch ANHÄNGE (`anhaengeEinspielen` weiter unten). Eine
         Kopie in reinem JSON hätte die Anhänge nicht — ein Netz mit Löchern
         genau dort, wo die grössten Dateien fallen. `sicherungSpeichern`
         baut dieselbe Sicherung wie der Knopf „Sicherung speichern": mit
         Anhängen, wenn es welche gibt.

         Schlägt das Schreiben fehl, wird NICHT eingespielt. Ein Netz, das
         reisst, ist schlimmer als keines: man hätte sich darauf verlassen. */
      let kopie = false;
      if (wahl === 'ersetzen') {
        kopie = await sicherungSpeichern();
        if (!kopie) {
          alert('Es wurde NICHTS eingespielt — dein Bestand steht unverändert.\n\n' +
                'Ohne Sicherheitskopie wäre das Ersetzen ein Sprung ohne Netz.');
          return;
        }
      }

      try {
        const erg = await Store.importAll(text, wahl);
        /* Die Anhänge NACH den Blöcken. Andersherum stünden die Dateien in
           der Ablage und würden beim „Ersetzen" gleich wieder mit gelöscht —
           `ersetzen` räumt weg, was nicht in der Sicherung steht. */
        let anhaenge: { da: number; erwartet: number; fehlend: string[];
                        unvollstaendig: string[] } =
          { da: 0, erwartet: 0, fehlend: [], unvollstaendig: [] };
        if (zip) anhaenge = await anhaengeEinspielen(zip, wahl);
        danach && danach();
        zeichneBaum(); zeichneSeite();
        /* EIN Hinweis, nicht zwei. `UI.toast` schreibt in dasselbe Element:
           ein zweiter Aufruf direkt danach überschriebe den ersten, und
           gesehen hätte man nur die zweite Hälfte.

           Hat das Einspielen eine Entscheidung offen gelassen (L76), gehört
           sie in denselben Satz. Eine Frage, von der niemand weiss, dass
           sie wartet, ist ein stehender Abgleich ohne Grund — und der
           fällt erst auf, wenn das andere Gerät nichts mehr bekommt. */
        UI.toast('Sicherung geladen — ' + erg.bloecke + ' Blöcke' +
                 (kopie ? ' (der alte Stand liegt als Sicherheitskopie im ' +
                          'Download-Ordner)' : '') +
                 (erg.versionen ? ', ' + erg.versionen + ' Fassungen' : '') +
                 (anhaenge.da ? ', ' + anhaenge.da + ' Anhang/Anhänge' : '') +
                 /* WAS NICHT ANKAM, WIRD GENANNT (L101 Punkt 2, E317). Und
                    nur dann — „0 fehlen" ist eine Zeile, über die man
                    hinwegliest. */
                 (anhaenge.fehlend.length
                   ? '. ' + anhaenge.fehlend.length + ' von ' + anhaenge.erwartet +
                     ' Anhängen fehlen: ' + anhaenge.fehlend.slice(0, 3).join(', ') +
                     (anhaenge.fehlend.length > 3 ? ' …' : '') +
                     '. Die Sicherung liegt noch — du kannst sie erneut einspielen.'
                   : '') +
                 /* UND WAS VERKÜRZT ANKAM (L101 Punkt 4, E318). Eine eigene
                    Zeile, weil es eine andere Nachricht ist: die Datei IST
                    da, sie ist nur nicht ganz. Wer „fehlt" liest, sucht die
                    Datei; wer das hier liest, sieht sie und traut ihr nicht. */
                 (anhaenge.unvollstaendig.length
                   ? '. ' + anhaenge.unvollstaendig.length + ' Anhang/Anhänge ' +
                     'kamen verkürzt an: ' +
                     anhaenge.unvollstaendig.slice(0, 3).join(', ') +
                     (anhaenge.unvollstaendig.length > 3 ? ' …' : '') +
                     '. Sie wurden trotzdem übernommen — was da ist, ist da.'
                   : '') +
                 (erg.frage
                   ? '. Der Abgleich mit der Wolke steht still: dort liegt noch ' +
                     'der Stand von vorher. Entscheide unter „Mehr → Wolke", ob ' +
                     'dieses Gerät nur lokal weiterarbeitet oder vollständig neu ' +
                     'abgleicht.'
                   : ''),
                 erg.frage ? 14000 : undefined);
      } catch (err: unknown) { alert('Konnte nicht geladen werden: ' +
        (err instanceof Error ? err.message : String(err))); }
    });
    inp.click();
  };

  const setzeBreite = (px: any) => {
    const s = document.getElementById('sidebar');
    if (!s) return;
    s.style.width = px + 'px';
    s.style.flexBasis = px + 'px';
  };

  const theme = (was?: any) => {
    const neu = was || (document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    /* Mit einem eigenen Farbschema heisst „umschalten": zum passenden
       Gegenstück wechseln, nicht das Schema übergehen. */
    if (typeof Aussehen !== 'undefined') {
      const jetzt = Aussehen.einstellung();
      const s = Aussehen.SCHEMATA.find(x => x.id === jetzt.schema);
      if (s && s.grund !== neu) {
        const gegen = Aussehen.SCHEMATA.find(x => x.grund === neu &&
          (neu === 'light' ? x.id === 'hell' : x.id === 'standard'));
        if (gegen) Aussehen.setzen({ schema: gegen.id });
      }
    }
    document.documentElement.dataset.theme = neu;
    Store.setMeta('theme', neu);
  };

  /* ========================================================================
   * VOLLBILD  (E283 / L85 Punkt 1)
   * ------------------------------------------------------------------------
   * Nicht zu verwechseln mit `Werkzeuge.fokus()`. Der Fokus-Modus blendet
   * REDIONS eigene Oberfläche aus und lässt die Leisten des Browsers stehen;
   * Vollbild macht das Gegenteil — Redion bleibt vollständig, der Browser
   * verschwindet. Beide sind sinnvoll, und beide zusammen ergeben die
   * ruhigste Ansicht, die Redion hat.
   *
   * DREI DINGE, DIE DIE NAIVE FASSUNG FALSCH MACHT:
   *
   * 1. Ein gemerktes `let vollbild = false` geht am ersten Escape kaputt.
   *    Escape verlässt das Vollbild im BROWSER, ohne uns zu fragen — die
   *    Erinnerung stünde danach für immer falsch, und der Knopf zeigte „AN"
   *    über einem Fenster mit Adressleiste. Deshalb wird der Zustand nie
   *    gemerkt, sondern jedes Mal frisch an `document.fullscreenElement`
   *    abgelesen.
   * 2. `requestFullscreen()` gibt es nicht überall. Auf dem iPhone kennt
   *    Safari kein Element-Vollbild (nur `<video>`), und in einem
   *    eingebetteten Rahmen ohne `allowfullscreen` ist es gesperrt. Ein
   *    Knopf, der dort dasteht und nichts tut, ist §47 — `vollbildGeht()`
   *    beantwortet die Frage, und das Menüband blendet ihn danach aus.
   * 3. Der Aufruf kann auch dort ABGELEHNT werden, wo er möglich ist: ohne
   *    frische Nutzerhandlung wirft er. Deshalb ein `catch` mit einem Satz,
   *    der sagt was zu tun ist — und nicht eine Fehlermeldung in der Konsole,
   *    die niemand sieht.
   * ======================================================================*/

  /** Kann dieses Gerät überhaupt Vollbild? */
  const vollbildGeht = (): boolean =>
    !!(document.fullscreenEnabled &&
       typeof document.documentElement.requestFullscreen === 'function');

  /** Ist gerade Vollbild? IMMER frisch gelesen — siehe Punkt 1 oben. */
  const vollbildAn = (): boolean => !!document.fullscreenElement;

  /**
   * Vollbild an, aus oder umschalten.
   * @param an `undefined` schaltet um, `true`/`false` setzt hart.
   * @returns den Zustand NACH dem Versuch — nicht den gewünschten.
   */
  const vollbild = async (an?: boolean): Promise<boolean> => {
    if (!vollbildGeht()) {
      UI.toast('Dieser Browser kann kein Vollbild.');
      return false;
    }
    const ziel = an === undefined ? !vollbildAn() : !!an;
    try {
      if (ziel) await document.documentElement.requestFullscreen();
      else if (vollbildAn()) await document.exitFullscreen();
    } catch {
      /* Nicht verschweigen: der Knopf sah aus, als hätte er gewirkt. */
      UI.toast(ziel
        ? 'Vollbild wurde abgelehnt — der Browser lässt es nur direkt nach einem Klick zu.'
        : 'Das Vollbild liess sich nicht beenden — Escape hilft immer.');
    }
    return vollbildAn();
  };

  /* ========================================================================
   * VOLLE BREITE  (E283 / L85 Punkt 2)
   * ------------------------------------------------------------------------
   * DERSELBE SCHALTER STAND AN DREI STELLEN, nicht an zwei: L85 nannte das
   * Seitenmenü (`schale.ts`) und die Kopfleiste — der Schalter in der
   * Schalterzeile desselben Menüs war übersehen. Alle drei schrieben
   * `Store.updateBlock(p.id, { wide: !p.wide })` von Hand, jeder mit seinem
   * eigenen Nachlauf.
   *
   * Das ist genau die Sorte Verdopplung, die still auseinanderläuft: wer
   * morgen eine Regel ergänzt (etwa „am Telefon hat volle Breite keine
   * Wirkung", E156), ergänzt sie an einer Stelle und wundert sich, warum
   * der andere Weg sie nicht kennt.
   * ======================================================================*/

  /**
   * Volle Breite für eine Seite umschalten.
   * @param p   die Seite; ohne `id` passiert nichts (und es wird nichts
   *            behauptet — der Rückgabewert sagt es).
   * @param an  `undefined` schaltet um, `true`/`false` setzt hart.
   * @returns den Zustand danach.
   */
  const volleBreite = (p: any, an?: boolean): boolean => {
    if (!p || !p.id) return false;
    const neu = an === undefined ? !p.wide : !!an;
    Store.updateBlock(p.id, { wide: neu });
    /* Das übergebene Objekt MIT nachziehen: die Aufrufer zeichnen ihr Menü
       aus derselben Kopie weiter und zeigten sonst den alten Stand. */
    p.wide = neu;
    zeichneSeite();
    return neu;
  };

  /* ========================================================================
   * EXPORT
   * ======================================================================*/
  /** Die Seite als Markdown — für „Seiteninhalte kopieren" und den Export. */
  const markdownVonSeite = (p: any) =>
    `# ${p.text || 'Ohne Titel'}\n\n${Werkzeuge.alsMarkdown(p)}\n`;

  const markdownExport = (p: any) => {
    const md = markdownVonSeite(p);
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (p.text || 'seite').replace(/[^\wäöüÄÖÜß -]/g, '') + '.md';
    a.click();
    UI.toast('Als Markdown gespeichert');
  };

  /* ========================================================================
   * KI-PANEL
   * ======================================================================*/
  const kiPanel = (auf?: any) => {
    const p = document.getElementById('ai');
    if (!p) return;
    const an = auf === undefined ? !p.classList.contains('open') : auf;
    p.classList.toggle('open', an);
    document.getElementById('btn-ai')?.classList.toggle('on', an);
    /* BEIM ÖFFNEN NACH OLLAMA SEHEN, NICHT BEIM START (E233).
       Seit E233 fragt `KI.start()` nur noch, wenn Ollama schon einmal die
       Quelle war — sonst schweigt der Start. Damit hätte jemand, der Ollama
       installiert hat und Redion zum ERSTEN Mal öffnet, „Modell wählen"
       gesehen statt seines Modells. Hier ist der richtige Ort: er will
       gerade die KI, also darf jetzt gesucht werden. */
    if (an && typeof KI !== 'undefined' && KI.sucheOllamaJetzt) KI.sucheOllamaJetzt();
    if (an) setTimeout(() => document.getElementById('ai-input')?.focus(), 60);
  };

  const neueSeite = (elternId = null) => {
    const p = Store.addPage(elternId, { text: '' });
    zeichneBaum(); oeffne(p.id);
    setTimeout(() => document.getElementById('title')?.focus(), 60);
    return p;
  };

  /* ==========================================================================
   * „NEU ERSTELLEN" — das Blatt hinter dem Stift (E45, Vorgabe §18)
   * --------------------------------------------------------------------------
   * WAS DER STIFT VORHER TAT: sofort eine leere Seite anlegen. Das ist der
   * richtige Weg für den, der genau das will, und eine Sackgasse für alle
   * anderen. Redion kann Datenbanken, Tabellen, Aufgaben, Karteikarten,
   * Dateien und Vorlagen — und keines davon war von hier aus erreichbar.
   * Wer nicht wusste, dass es Karteikarten gibt, fand sie nie.
   *
   * Deshalb ein Blatt mit acht Wegen, und die leere Seite steht als erster
   * darin: wer sie will, tippt einmal mehr. Das ist der Preis dafür, dass
   * die anderen sieben überhaupt existieren.
   *
   * NUR AM TELEFON. Am Rechner gibt es Strg+N, die Seitenleiste und die
   * Befehlspalette — dort wäre ein Blatt ein Umweg, kein Wegweiser.
   * ========================================================================*/
  /* WAS HIER STEHT, MUSS IRGENDWOHIN FÜHREN. §47 verbietet, Dinge zu
     versprechen, die nicht funktionieren — deshalb steht neben jedem Weg
     die Funktion, die ihn ausführt, und `da()` prüft vor dem Zeichnen, ob
     es sie in dieser Fassung überhaupt gibt. Ein Eintrag ohne Ziel wird
     nicht gezeichnet, statt einen Fehler zu zeigen.

     DIE GRUPPEN SIND KEINE ZIERDE. Vierzehn Zeilen hintereinander liest
     niemand; sechs Überschriften sagen, wonach man sucht, bevor man liest.

     Die Reihenfolge ist die des Auftrags: was man HEREINHOLT, steht oben.
     Redur öffnet Redion, um an einer PDF weiterzuarbeiten — nicht, um eine
     leere Seite anzulegen. */
  type NeuWeg = {
    id: string; zeichen: string; name: string; sub: string;
    gruppe: string;
    /** Fehlt sie, ist der Weg in dieser Fassung nicht geladen. */
    da?: () => boolean;
  };

  const ERSTELLEN: NeuWeg[] = [
    /* --- Hereinholen ------------------------------------------------- */
    { gruppe: 'Hereinholen', id: 'pdf', zeichen: '📕', name: 'PDF einlesen',
      sub: 'Blättern, beschreiben, Text durchsuchen',
      da: () => typeof PdfEinlesen !== 'undefined' && !!PdfEinlesen.waehlen },
    { gruppe: 'Hereinholen', id: 'scan', zeichen: '📷', name: 'Dokument scannen',
      sub: 'Kamera, Foto oder PDF in den Eingang',
      da: () => typeof Recognition !== 'undefined' && !!Recognition.scan },
    { gruppe: 'Hereinholen', id: 'datei', zeichen: '📎', name: 'Datei hochladen',
      sub: 'Bleibt auf diesem Gerät' },
    { gruppe: 'Hereinholen', id: 'zip', zeichen: '🗜', name: 'ZIP entpacken',
      sub: 'Ordner bleiben Ordner, PDFs werden Dokumente',
      da: () => typeof ArchivImport !== 'undefined' && !!ArchivImport.waehlen },
    { gruppe: 'Hereinholen', id: 'umzug', zeichen: '⇤', name: 'Aus anderem Werkzeug',
      sub: 'Notion, Obsidian, Trello, Evernote, Anki …',
      da: () => typeof Austausch !== 'undefined' && !!Austausch.dialog },

    /* --- Schreiben ---------------------------------------------------- */
    /* DAS NOTIZBUCH FEHLTE (E513). Redur hat GoodNotes danebengehalten:
       dort steht hinter dem „+" Notizbuch, Textdokument, Whiteboard,
       Schnellnotiz. Alle vier gab es in Redion — nur das Notizbuch war von
       hier aus nicht erreichbar, obwohl es im Regal „Notizhefte" seit E264
       einen Knopf dafür gibt. Ein Weg, den man nur kennt, wenn man ihn
       schon kennt, ist keiner.
       Er steht ZUERST, weil er in GoodNotes zuerst steht und weil er das
       ist, womit die meisten anfangen. */
    { gruppe: 'Schreiben', id: 'heft', zeichen: '📓', name: 'Notizbuch',
      sub: 'Ein Heft mit Papier — liniert, kariert, blanko',
      da: () => typeof Notebook !== 'undefined' && !!(Notebook as any).createNotebook },
    { gruppe: 'Schreiben', id: 'seite', zeichen: '📄', name: 'Neue Seite',
      sub: 'Leere Seite anlegen' },
    { gruppe: 'Schreiben', id: 'memo', zeichen: '⚡', name: 'Schnellnotiz',
      sub: 'Gedanken sofort festhalten' },
    { gruppe: 'Schreiben', id: 'journal', zeichen: '📔', name: 'Journal-Eintrag',
      sub: 'Der heutige Tag',
      da: () => typeof Werkzeuge !== 'undefined' && !!Werkzeuge.journal },
    { gruppe: 'Schreiben', id: 'vorlage', zeichen: '🧩', name: 'Vorlage verwenden',
      sub: 'Mit fertiger Struktur starten' },
    { gruppe: 'Schreiben', id: 'ordner', zeichen: '🗂', name: 'Ordner',
      sub: 'Eine Seite, die andere hält' },

    /* --- Zeichnen ----------------------------------------------------- */
    { gruppe: 'Zeichnen', id: 'board', zeichen: '🖍', name: 'Whiteboard',
      sub: 'Freie Fläche zum Skizzieren' },
    /* DIE UNTERZEILE SAGT DEN ZWECK, NICHT NUR DAS PAPIER (E397). Sie hiess
       „A4 — liniert, kariert, Punktraster, Millimeter" und beschrieb damit
       den Bogen, nicht das, wofür man ihn nimmt. Wer mit der Hand schreiben
       will, sucht nicht nach Papiersorten.
       Der NAME bleibt „Blatt": so heisst die Blockart, so heisst die
       Werkzeugleiste, so heissen E100 und E359. Zwei Namen für dieselbe
       Sache laufen auseinander (§8). */
    { gruppe: 'Zeichnen', id: 'blatt', zeichen: '📐', name: 'Blatt',
      sub: 'Mit der Hand schreiben — A4, liniert, kariert, Punktraster' },
    /* DIE PRÄSENTATION IST EIN EIGENER WEG (E548). Redur: „könntest du so
       eine PowerPoint-Modus im Menü einfügen … so dass ich Präsentation
       erstellen könnte." Die ANSICHT gab es längst — der Dokumentmodus hat
       die Leiste oben und die Folienliste links (E546, E547). Was fehlte,
       war der Weg hinein: wer eine Präsentation wollte, legte eine Seite
       an, setzte ein Blatt hinein, stellte dessen Masse von Hand auf 16:9
       und suchte den Dokumentmodus selbst. */
    { gruppe: 'Zeichnen', id: 'praesentation', zeichen: '📽️', name: 'Präsentation',
      sub: 'Folien in 16:9 — mit fertigen Vorlagen',
      da: () => typeof Folienvorlagen !== 'undefined' && !!Folienvorlagen.anlegenMitWahl },
    { gruppe: 'Zeichnen', id: 'plan', zeichen: '⚡', name: 'Schaltplan',
      sub: 'Mit Fachzeichen und Stromsimulation' },

    /* --- Ordnen und rechnen ------------------------------------------- */
    { gruppe: 'Ordnen und rechnen', id: 'db', zeichen: '▦', name: 'Neue Datenbank',
      sub: 'Zeilen sind eigene Seiten' },
    { gruppe: 'Ordnen und rechnen', id: 'tabelle', zeichen: '📊', name: 'Neue Tabelle',
      sub: 'Rechnen wie in Excel' },
    { gruppe: 'Ordnen und rechnen', id: 'aufgabe', zeichen: '☑', name: 'Aufgabe',
      sub: 'Mit Datum planen' },
    { gruppe: 'Ordnen und rechnen', id: 'diagramm', zeichen: '📈', name: 'Diagramm',
      sub: 'Zahlen aus einer Datenbank zeichnen' },

    /* --- Lernen -------------------------------------------------------- */
    { gruppe: 'Lernen', id: 'karte', zeichen: '📚', name: 'Karteikarte',
      sub: 'Später wiederholen (SM-2)' },
    { gruppe: 'Lernen', id: 'lernen', zeichen: '🎓', name: 'Lernzentrale öffnen',
      sub: 'Fällige Karten, Fehler, Prüfungen',
      da: () => typeof Produktwelten !== 'undefined' && !!Produktwelten.lernen },

    /* --- Aufnehmen ------------------------------------------------------ */
    { gruppe: 'Aufnehmen', id: 'aufnahme', zeichen: '🎙', name: 'Besprechung aufnehmen',
      sub: 'Mitschnitt mit Marken und Notizen',
      da: () => typeof Meeting !== 'undefined' && !!Meeting.panel }
  ];

  /**
   * Der Arbeitsbereich — Name, Zeichen und der Baum aller Seiten.
   *
   * AM TELEFON DAS R-BLATT, AM RECHNER DIE SCHUBLADE. Das ist keine
   * Laune: E38 hat den Weg am Telefon ausdrücklich WEG von der Schublade
   * geführt — die ist die Seitenleiste des Rechners, auf 390 px
   * geschoben, samt Baum und 33-px-Zeilen.
   *
   * Herausgegeben seit E236: der Weg wird jetzt von drei Stellen
   * gebraucht — dem alten Kreis, dem Knopf rechts in der Menüleiste und
   * der Zeile im Mehr-Blatt. Drei Aufrufe, eine Entscheidung (§8).
   */
  const arbeitsbereich = (): void => {
    if (!window.matchMedia('(max-width: 760px)').matches) {
      /* AM RECHNER SEIT E272 PHASE G: die Datei-Fläche, Fach „Konto".
         Vorher ging hier die Seitenleisten-Schublade auf — und die
         verschwindet am Rechner in Phase F. Der Knopf hätte dann kein
         Ziel mehr gehabt; deshalb steht G vor F und nicht danach.
         Die Schublade bleibt der Notweg, solange die Fläche fehlt
         (Einzeldatei, halb geladenes Fenster, Prüflauf ohne das Modul). */
      const bs = (window as any).Backstage;
      if (bs?.oeffne) { bs.oeffne('konto'); return; }
      if (PWA.schubladeAuf) PWA.schubladeAuf();
      return;
    }
    PWA.schubladeZu && PWA.schubladeZu();
    rMenue();
  };

  /* Der da()-gefilterte Katalog, OHNE die da-Funktionen — für jeden, der
     die Wege anbieten will, ohne die fremden Module selbst zu kennen.
     Seit E265 fragt das Notizhefte-Regal hier nach: sein Neu-Menü darf
     keinen Weg versprechen, den diese Fassung nicht geladen hat (§47),
     und dürfte dafür nicht selbst nach PdfEinlesen greifen (§5). */
  const erstellenWege = (): { id: string; zeichen: string; name: string; sub: string }[] =>
    ERSTELLEN.filter(w => !w.da || w.da())
      .map(w => ({ id: w.id, zeichen: w.zeichen, name: w.name, sub: w.sub }));

  const erstellenBlatt = (): void => {
    /* Erst aussortieren, was es hier nicht gibt, DANN gruppieren — sonst
       bleibt eine Überschrift ohne Zeilen darunter stehen. */
    const wege = ERSTELLEN.filter(w => !w.da || w.da());
    const gruppen: string[] = [];
    for (const w of wege) if (!gruppen.includes(w.gruppe)) gruppen.push(w.gruppe);

    /* EINE LISTE, NICHT SECHS. Der erste Entwurf gab jeder Gruppe ihre
       eigene `.menu-liste` — und die trägt am Telefon `flex:1`, weil sie
       dort das ganze Blatt füllen soll. Sechs davon teilten sich die Höhe
       und schnitten sich gegenseitig ab: „Dokument scannen" war halb weg,
       „Neue Tabelle" halb weg, und gerollt hat keine von ihnen.
       Die Überschriften laufen deshalb IN der Liste mit — `.grp` ist genau
       dafür da und wird in jedem anderen Menü auch so verwendet. */
    const html = '<div class="menu-liste">' + gruppen.map(g =>
      `<div class="grp">${esc(g)}</div>` +
      wege.filter(w => w.gruppe === g).map(w =>
        `<button data-neu="${esc(w.id)}"><span class="mi">${esc(w.zeichen)}</span>` +
        `<span class="ne-txt"><b>${esc(w.name)}</b><i>${esc(w.sub)}</i></span>` +
        '<span class="ne-pfeil">›</span></button>').join('')).join('') +
      '</div>';

    const m = UI.menu(html, 0, 0, { titel: 'Neu erstellen' });
    m.addEventListener('click', (e: Event) => {
      const b = (e.target instanceof Element)
        ? e.target.closest<HTMLElement>('[data-neu]') : null;
      if (!b) return;
      const was = b.dataset['neu'];
      document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
      /* Erst schliessen, dann handeln — ein Dialog unter einem Blatt ist
         von aussen nicht erreichbar (derselbe Grund wie im R-Blatt). */
      setTimeout(() => { erstellenWeg(was || ''); }, 60);
    });
  };

  /* Führt genau EINEN Weg aus dem Katalog aus. Herausgelöst aus dem
     Klick-Handler von erstellenBlatt (E265), wörtlich — damit das
     Notizhefte-Regal dieselben Wege gehen kann, ohne eine zweite
     PDF-Anlege-Maschine zu bauen (E29). */
  const erstellenWeg = (was: string): void => {
    /* Wege, die kein Blatt Papier brauchen: sie öffnen etwas, das es
       schon gibt, oder einen Wähler. */
    if (was === 'heft')         { (Notebook as any).createNotebook(); return; }
    if (was === 'seite')        { neueSeite(); return; }
    if (was === 'memo')         { Werkzeuge.schnellnotizen(); return; }
    if (was === 'datei')        { Werkzeuge.dateienLesen(); return; }
    if (was === 'zip') {
      /* ZIP INS REGAL (E350): Ziel ist das offene Fach der Notizhefte, sonst
         die Wurzel — dort, wo „Dokumente" seine Deckel zeigt. */
      const fach = String(Store.getMeta('heft:fach') || '');
      const ziel = schauplatz() === 'notizhefte' && fach && Store.getBlock(fach) ? fach : null;
      void ArchivImport.waehlen(ziel);
      return;
    }
    if (was === 'scan')         { Recognition.scan(); return; }
    if (was === 'vorlage')      { Werkzeuge.vorlagen(); return; }
    if (was === 'karte')        { Werkzeuge.lernen(); return; }
    if (was === 'journal')      { Werkzeuge.journal(); return; }
    if (was === 'umzug')        { Austausch.dialog(); return; }
    if (was === 'pdf') {
      /* GEMESSEN UND EINE SACKGASSE GEFUNDEN. `PdfEinlesen.waehlen()`
         beginnt mit `App.aktuelleSeite()` und meldet „Erst eine Seite
         öffnen", wenn keine offen ist — und im Regal ist keine offen.
         Von dort führte der Weg also ins Nichts (§47).

         Aus dem Blatt „Neu erstellen" heraus ist das ohnehin die
         falsche Frage: wer hier klickt, will ein NEUES Dokument aus
         der PDF, keine PDF in einer bestehenden Seite. Also erst die
         Seite, dann hinein damit.

         Bricht jemand den Dateiwähler ab, bleibt eine leere,
         namenlose Seite übrig — die wandert in den Papierkorb, nicht
         in den Abgrund: `alive:false` ist umkehrbar (§46). */
      const ziel = neueSeite();
      void PdfEinlesen.waehlen(ziel.id).then((erg: any) => {
        if (erg) { zeichneBaum(); zeichneSeite(); return; }
        const jetzt = Store.getBlock(ziel.id);
        const leer = jetzt && !(jetzt.text || '').trim() &&
                     (Store.childrenOf(ziel.id) || [])
                       .filter((k: any) => k && k.alive !== false).length === 0;
        if (leer) { Store.updateBlock(ziel.id, { alive: false }); zeichneBaum(); }
      });
      return;
    }
    if (was === 'praesentation') {
      /* Der Wähler legt selbst an und öffnet selbst — und wenn jemand
         abbricht, entsteht GAR NICHTS. Der PDF-Weg zwei Zweige weiter oben
         muss dafür eine leere Seite in den Papierkorb schieben; hier ist
         die Reihenfolge herum, also gibt es den Fall nicht (§47). */
      void Folienvorlagen.anlegenMitWahl();
      return;
    }
    if (was === 'lernen')       { Produktwelten.lernen('lernen'); return; }
    if (was === 'aufnahme') {
      if (typeof Meeting !== 'undefined' && Meeting.panel) Meeting.panel();
      else UI.toast('Die Aufnahme ist in dieser Fassung nicht geladen.');
      return;
    }
    if (was === 'ordner') {
      /* EIN ORDNER IST KEINE NEUE DATENART. Er ist eine Seite, die
         andere hält — genau so liest die Bibliothek ihn auch wieder
         (E236, `artVon`). Ein eigenes Feld dafür wäre eine Migration
         für eine Ansicht (§9). Das Mappensymbol sagt, wozu sie da
         ist; wer sie vollschreibt, hat trotzdem eine Seite. */
      const ord = Store.addPage(null, { text: '', icon: '\ud83d\uddc2' });
      zeichneBaum(); oeffne(ord.id);
      setTimeout(() => document.getElementById('title')?.focus(), 60);
      return;
    }

    /* Alles andere entsteht IN einer Seite — es gibt es nicht ohne
       eine. Also erst die Seite, dann der Block darin, und der Cursor
       steht schon an der richtigen Stelle. */
    const p = neueSeite();
    setTimeout(() => {
      if (was === 'db')            Store.addDatabase(p.id, 'Ohne Namen');
      /* `spreadsheet`, NICHT `tabelle` — und das ist kein Schönheitsfehler.
         Es gibt gar keine Blockart `tabelle`: der Editor kennt `table`
         (Einfache Tabelle) und `spreadsheet` (Kalkulationstabelle).
         Gemessen wurde ein `tabelle`-Block 24 px hoch mit dem Inhalt
         „+⋮⋮" — nur der Griff, sonst nichts. Der Weg legte seit E45
         einen Block an, den niemand zeichnet.
         Welcher der beiden es sein muss, sagt der Weg selbst: unter
         „Neue Tabelle" steht „Rechnen wie in Excel". Das ist die
         Kalkulationstabelle (gemessen 513 px, mit A1, fx, CHF und %). */
      else if (was === 'tabelle')  Store.addBlock(p.id, 'spreadsheet', {});
      else if (was === 'board')    Store.addBlock(p.id, 'whiteboard', { text: 'Whiteboard' });
      else if (was === 'blatt') {
        Store.addBlock(p.id, 'blatt', { text: '' });
        /* UND GLEICH ZUM SCHREIBEN AUFSCHLAGEN (E397, Audit F10).
           GEMESSEN AM 4. SEPTEMBER: „Blatt" legte eine Seite mit den
           Blöcken ["text", "blatt"] an und liess `dokumentModus` auf
           `false`. Man landete also im Texteditor, mit einem leeren
           Absatz oben und dem Blatt als Kasten darunter — und musste
           „Dokumentmodus" erst selbst finden, um darauf schreiben zu
           können. Ein Weg, der das Ding anlegt, aber nicht öffnet.

           Die Notizhefte machen es längst richtig (`notebook.ts:348`
           und `:370` setzen die Flagge beim Anlegen). Hier fehlte sie. */
        Store.updateBlock(p.id, { dokumentModus: true });
      }
      else if (was === 'plan')     Store.addBlock(p.id, 'schaltplan', { text: '' });
      else if (was === 'diagramm') Store.addBlock(p.id, 'chart', { text: '' });
      else if (was === 'aufgabe')  Store.addBlock(p.id, 'todo', { text: '' });
      zeichneSeite();
    }, 80);
  };

  /* ------------------------------------------------------------------------
   * BREITE DER SEITENLEISTE
   * ---------------------------------------------------------------------- */
  const seitenleisteBreite = () => {
    const side = document.getElementById('sidebar');
    if (!side || side.querySelector('.side-griff')) return;
    const gespeichert = Number(Store.getMeta('seiteBreite', 0));
    const setze = (px: any) => {
      const b = Math.max(180, Math.min(460, px));
      side.style.width = b + 'px';
      side.style.flexBasis = b + 'px';
      document.documentElement.style.setProperty('--side-w', b + 'px');
      return b;
    };
    if (gespeichert) setze(gespeichert);

    const griff = document.createElement('div');
    griff.className = 'side-griff';
    griff.title = 'Breite ziehen — Doppelklick setzt zurück';
    side.appendChild(griff);

    griff.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const start = e.clientX;
      const b0 = side.getBoundingClientRect().width;
      document.body.classList.add('zieht-seite');
      const zug = (ev: any) => setze(b0 + ev.clientX - start);
      const stop = () => {
        removeEventListener('pointermove', zug);
        removeEventListener('pointerup', stop);
        document.body.classList.remove('zieht-seite');
        Store.setMeta('seiteBreite', Math.round(side.getBoundingClientRect().width));
      };
      addEventListener('pointermove', zug);
      addEventListener('pointerup', stop);
    });
    /* 240, nicht 260: die Startbreite steht seit §68 in `aufbau.css` auf 240,
       und `test245` verlangt 220–250. Der Rücksetzer sprang trotzdem auf 260 —
       also auf einen Wert, den die App selbst verbietet. Wer zurücksetzt,
       landet jetzt dort, wo er ohne Zutun auch stünde. */
    griff.addEventListener('dblclick', () => {
      setze(240);
      Store.setMeta('seiteBreite', 240);
      UI.toast('Breite zurückgesetzt');
    });
  };

  /* ========================================================================
   * TASTENKÜRZEL
   * ======================================================================*/
  const tasten = () => {
    document.addEventListener('keydown', e => {
      const strg = e.ctrlKey || e.metaKey;
      if (!strg) return;
      const k = e.key.toLowerCase();

      /* Selbst belegte Kürzel haben Vorrang vor den eingebauten. Wer nichts
         umbelegt hat, merkt davon nichts — dann greift die Liste unten. */
      if (typeof Aussehen !== 'undefined' && Object.keys(Aussehen.eigene()).length) {
        const tu: Record<string, () => void> = { suche, palette: () => Werkzeuge.palette(), neu: () => { neueSeite(); },
                     ki: () => kiPanel(), chat: () => KI.neuerChat && KI.neuerChat(),
                     seitenleiste: () => { document.getElementById('sidebar')?.classList.toggle('collapsed'); },
                     zurueck, vor: vorwaerts, hell: () => theme(),
                     hilfe: () => Werkzeuge.tastenkuerzel(),
                     einstellung: () => einstellungen(),
                     teilen: () => { Fenster.geteilt() ? Fenster.teilenAus() : Fenster.teilen(); },
                     reiterNeu: () => Fenster.neuerReiter(),
                     reiterZu: () => Fenster.schliessen(Fenster.aktiv()) };
        for (const id of Object.keys(Aussehen.eigene())) {
          const fn = tu[id];
          /* Auch alte, bereits gespeicherte Belegungen dürfen keine
             Browser- oder Bearbeitungstaste stehlen. Der Dialog verhindert
             neue Konflikte; diese zweite Grenze schützt Bestandsdaten. */
          if (fn && !Aussehen.reserviert(Aussehen.alsText(e)) && Aussehen.ist(id, e)) {
            e.preventDefault(); fn(); return;
          }
        }
        /* Ein eingebautes Kürzel, das jemand woandershin gelegt hat, darf
           an seiner alten Stelle nichts mehr auslösen. */
        const belegt = Object.keys(Aussehen.eigene());
        const jetzt = Aussehen.alsText(e).toLowerCase();
        const kollision = Aussehen.KUERZEL.find(([id, , std]: any[]) =>
          belegt.includes(id) && String(std ?? '').toLowerCase() === jetzt);
        if (kollision) return;
      }

      if (k === 'n' && !e.shiftKey) { e.preventDefault(); neueSeite(); return; }
      /* Strg+Alt+P gehört der Präsentation, nicht der Suche */
      if (k === 'p' && !e.shiftKey && !e.altKey) { e.preventDefault(); suche(); return; }
      if (k === 'k' && !e.shiftKey) { e.preventDefault(); suche(); return; }
      /* Strg+Backslash war „Seitenleiste auf/zu" und ist seit E272 Phase F
         „Kontextkante auf/zu" — dieselbe Taste, dasselbe Versprechen (die
         Spalte links weg oder da), nur ist die Spalte jetzt 54 statt 240
         Pixel breit. Am Telefon gibt es die Kante nicht; dort schaltet
         die Taste weiter die Schublade, damit sie nicht ins Leere geht. */
      if (k === '\\') {
        e.preventDefault();
        if (typeof Kontextkante !== 'undefined'
            && !window.matchMedia('(max-width: 760px)').matches) {
          Kontextkante.schalten();
        } else {
          document.getElementById('sidebar')?.classList.toggle('collapsed');
        }
        return;
      }
      /* Strg+M: die Lade der Kante auf und zu (E272 Phase F). Vorher war es
         „Mehr" in der Seitenleiste (E219); die gibt es am Rechner nicht
         mehr, am Telefon schon — deshalb beide, jeder an seinem Ort.
         Ohne beides ruft die Taste kein `preventDefault` und bleibt dem
         Browser. */
      if (k === 'm' && !e.shiftKey) {
        if (typeof Kontextkante !== 'undefined'
            && !window.matchMedia('(max-width: 760px)').matches) {
          e.preventDefault(); Kontextkante.ladeSchalten(); return;
        }
        if (typeof Ruhig !== 'undefined' && Ruhig.an()) {
          e.preventDefault(); Ruhig.schalten(); return;
        }
      }
      if (k === 'j' && !e.shiftKey) { e.preventDefault(); kiPanel(); return; }
      if (e.shiftKey && k === 'l') { e.preventDefault(); theme(); return; }
      if (k === ',') { e.preventDefault(); einstellungen(); return; }
      if (k === '[') { e.preventDefault(); zurueck(); return; }
      if (k === ']') { e.preventDefault(); vorwaerts(); return; }
      if (k === 'f' && !e.shiftKey) { e.preventDefault(); seitenSuche(); return; }
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); Verlauf.zurueck(); return; }
      /* Strg+Y ist Wiederholen — Strg+Umschalt+Y gehört den Favoriten,
         deshalb hier ausdrücklich ohne Umschalt. */
      if ((k === 'y' && !e.shiftKey) || (e.shiftKey && k === 'z')) {
        e.preventDefault(); Verlauf.vor(); return;
      }
      if (e.shiftKey && k === 'h') { e.preventDefault(); Auswahl.letzteFarbeAnwenden(); return; }

      /* --- Was Notion sonst noch belegt ---------------------------------- */

      /* Strg+L: Adresse dieser Seite kopieren */
      if (k === 'l' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        Ablage.kopiereJetzt(location.origin + location.pathname + '#' + aktuelleSeite(), 'Link zur Seite kopiert');
        return;
      }
      /* Strg+Umschalt+U: eine Ebene nach oben in der Seitenhierarchie */
      if (e.shiftKey && k === 'u') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        const eltern = b && b.parentId && Store.getBlock(b.parentId);
        if (eltern) oeffne(eltern.id);
        else UI.toast('Diese Seite liegt schon ganz oben');
        return;
      }
      /* Strg+Alt+T: alle Toggles der Seite auf- oder zuklappen */
      if (e.altKey && k === 't') { e.preventDefault(); Blocks.alleToggles(); return; }

      /* --- Fünf, die an der Seite selbst hängen --------------------------
       * Sie standen bisher nur in Menüs. Bewusst nur Buchstaben, die noch
       * frei sind: Umschalt+F gehört dem Fokus-Modus, Umschalt+P dem
       * Verschieben, Umschalt+G dem Graphen. Ein Kürzel, das ein anderes
       * überdeckt, ist kein Gewinn, sondern ein Fehler.
       * ------------------------------------------------------------------ */
      /* Strg+Umschalt+D: diese Seite verdoppeln */
      if (e.shiftKey && k === 'd') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        if (b) dupliziereSeite(b.id);
        return;
      }
      /* Strg+Umschalt+Y: an- und abheften */
      if (e.shiftKey && k === 'y') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        if (!b) return;
        Store.updateBlock(b.id, { favorite: !b.favorite });
        zeichneBaum();
        UI.toast(b.favorite ? 'Zu den Favoriten' : 'Von den Favoriten genommen');
        return;
      }
      /* Strg+Umschalt+N: eine Unterseite hier anlegen */
      if (e.shiftKey && k === 'n') {
        e.preventDefault();
        const b = Store.getBlock(aktuelleSeite());
        const p = Store.addPage(b ? b.id : null, { text: '' });
        zeichneBaum();
        oeffne(p.id);
        return;
      }
      /* Strg+Umschalt+B: Papierkorb */
      if (e.shiftKey && k === 'b') { e.preventDefault(); papierkorb(); return; }
      /* Strg+Umschalt+O: Übersicht „Was Redion kann" */
      if (e.shiftKey && k === 'o') {
        e.preventDefault();
        if (typeof Rundgang !== 'undefined') Rundgang.uebersicht();
        return;
      }
      /* Strg + Plus / Minus / 0: Textgrösse — Notion zoomt, wir vergrössern
         die Schrift, weil das im Browser dasselbe Ziel erreicht. */
      if (!e.shiftKey && (k === '+' || k === '-' || k === '0') && !e.altKey) {
        const stufen = ['klein', 'normal', 'gross'];
        const jetzt = Store.getMeta('schriftgroesse', 'normal');
        let neu = jetzt;
        if (k === '+') neu = stufen[Math.min(2, stufen.indexOf(jetzt) + 1)];
        if (k === '-') neu = stufen[Math.max(0, stufen.indexOf(jetzt) - 1)];
        if (k === '0') neu = 'normal';
        if (neu !== jetzt) {
          e.preventDefault();
          Store.setMeta('schriftgroesse', neu);
          Einstellungen.anwenden();
          UI.toast('Schrift: ' + neu);
        }
        return;
      }
    });

    /* ── Esc schliesst Menüs und Überlagerungen ────────────────────────
       DIE OBERSTE, NICHT DIE ERSTE (E272 Phase G).

       Hier stand `document.querySelector('.overlay')` — und das ist die
       ERSTE im Baum, nicht die vorderste auf dem Bildschirm. Liegt noch
       eine ältere Überlagerung weiter oben im Dokument, schloss Esc die
       unsichtbare dahinter und liess die vor der Nase stehen. Gemessen
       beim Bau der Datei-Fläche: sie ging mit Esc nicht zu, obwohl sie
       ganz vorne stand.

       `fokus.ts` rechnet seit E223 genauso — die letzte im Dokument ist
       die oberste. Dieselbe Regel an beiden Stellen, sonst schliesst Esc
       etwas anderes, als der Fokus gerade hält. */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const letztes = (wahl: string): Element | null => {
        const alle = document.querySelectorAll(wahl);
        return alle.length ? alle[alle.length - 1]! : null;
      };
      const m = letztes('.menu');
      const o = letztes('.overlay');
      if (m) m.remove();
      else if (o) o.remove();
    });
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  /* ==========================================================================
   * EIN LINK AUF GENAU EINEN BLOCK
   * --------------------------------------------------------------------------
   * Strg + Umschalt + C legt seit Langem eine Adresse der Form
   * `…#block=<kennung>` in die Zwischenablage und meldet „Link auf diesen
   * Block kopiert". GELESEN HAT SIE NIE JEMAND. Beim Start wurde der Hash als
   * Seitenkennung genommen — `Store.getBlock('block=abc')` gibt nichts, also
   * fiel der Start auf die zuletzt geöffnete Seite zurück. Der Link tat
   * etwas, nur nicht das Versprochene, und gemerkt hat es niemand, weil
   * „irgendeine Seite geht auf" wie ein Erfolg aussieht (E105).
   *
   * Jetzt führt er hin: Seite des Blocks suchen, sie öffnen, zum Block
   * rollen, ihn kurz hervorheben.
   * ========================================================================*/

  /** Erst rollen, wenn der Zeichner durch ist — und noch einmal, wenn ein
   *  Bild darin nachlädt und alles darunter verschiebt. */
  const rolleZu = (blockId: string): void => {
    const hin = (): boolean => {
      const ziel = document.querySelector(`[data-bid="${blockId}"]`);
      if (!ziel) return false;
      ziel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ziel.classList.add('hebe-hervor');
      setTimeout(() => ziel.classList.remove('hebe-hervor'), 1400);
      /* Ein PDF-Seitenbild kommt aus der Stücke-Ablage und ist beim ersten
         Rollen oft noch nicht da. Es ist genau das, was die Seite hoch
         macht — also noch einmal, wenn es steht. Kein fester Zeitwert:
         gewartet wird auf das Bild, nicht auf die Uhr. */
      const bild = ziel.querySelector('img');
      if (bild && !bild.complete)
        bild.addEventListener('load', () =>
          ziel.scrollIntoView({ behavior: 'smooth', block: 'center' }),
          { once: true });
      return true;
    };
    /* Zwei Bilder Zeit: `oeffne` setzt am Ende `scrollTop = 0`, und davor
       zu rollen hiesse, gegen diese Zeile anzurollen. */
    requestAnimationFrame(() => { if (!hin()) requestAnimationFrame(hin); });
  };

  /**
   * Aufklappzeilen über einem Ziel öffnen.
   *
   * EIN ZIEL IN EINER ZUGEKLAPPTEN AUFKLAPPZEILE IST DA UND UNSICHTBAR.
   * `.toggle-kids` steht auf `display:none`, die Kinder werden aber sehr
   * wohl gezeichnet — `rolleZu` findet `[data-bid=…]`, meldet Erfolg, und
   * auf dem Bildschirm passiert nichts.
   *
   * Aufgefallen beim Weg zurück in die Besprechung (E161): das volle
   * Transkript steht in einer Aufklappzeile, die zu ist. Der Sprung auf
   * „01:02" traf die richtige Zeile und zeigte sie nicht. Betroffen war
   * jeder Tieflink dorthin, nicht nur dieser.
   *
   * Die Tiefe ist begrenzt: eine kaputte Elternkette darf hier nicht
   * hängenbleiben.
   */
  const klappeAuf = (blockId: string): boolean => {
    let geaendert = false;
    let b = Store.getBlock(blockId);
    let tiefe = 0;
    while (b && b.parentTable === 'block' && b.parentId && tiefe++ < 64) {
      const eltern = Store.getBlock(String(b.parentId));
      if (!eltern) break;
      if ((eltern.type === 'toggle' || eltern.toggleKopf) && !eltern.open) {
        Store.updateBlock(eltern.id, { open: true });
        geaendert = true;
      }
      b = eltern;
    }
    return geaendert;
  };

  /**
   * Zu einem Block springen — Seite öffnen, hinrollen, hervorheben.
   * Gibt zurück, ob es geklappt hat.
   */
  const zeigeBlock = (blockId: string): boolean => {
    const b = blockId ? Store.getBlock(blockId) : null;
    if (!b || b.alive === false) {
      UI.toast('Dieser Block ist nicht mehr da.');
      return false;
    }
    const seite = (typeof Links !== 'undefined' && Links.seiteVon)
      ? Links.seiteVon(blockId) : null;
    if (!seite) {
      UI.toast('Zu diesem Block führt kein Weg — seine Seite fehlt.');
      return false;
    }
    /* Ein Dokumentmodus rendert absichtlich nur eine volle Seite. Ein
       Deep-Link muss diese Seite daher VOR dem Öffnen wählen, sonst gäbe es
       den Zielknoten im DOM noch nicht. */
    const dokumentZiel = b.type === 'pdfseite' || b.type === 'blatt';
    let ansichtGeaendert = false;
    if (dokumentZiel && typeof DocumentMode !== 'undefined' && DocumentMode.select(seite, b.id)) {
      /* `select` aendert nur den fluechtigen Ansichtsstand. Auch wenn der
         Dokumentmodus schon offen ist, muss dieselbe Seite neu gezeichnet
         werden, damit ein Link auf PDF-Seite 18 nicht weiter Seite 3 zeigt. */
      ansichtGeaendert = true;
      if (!seite.dokumentModus) Store.updateBlock(seite.id, { dokumentModus: true });
    } else if (!dokumentZiel && seite.dokumentModus) {
      /* Ein normaler Notiz-/Kartenblock kommt in der Ein-Seiten-Ansicht nicht
         vor. Quellsuche und Backlinks muessen deshalb fuer dieses Ziel in die
         normale Seite zurueckwechseln. */
      Store.updateBlock(seite.id, { dokumentModus: false });
      ansichtGeaendert = true;
    }
    /* Ist die Seite schon offen, NICHT neu öffnen: `oeffne` setzt den Lauf
       zurück auf null und zählt einen Aufruf mit. Rollen genügt. */
    const aufgeklappt = klappeAuf(blockId);
    if (aktuelleSeite() !== seite.id) oeffne(seite.id);
    else if (ansichtGeaendert || aufgeklappt) zeichneSeite();
    rolleZu(blockId);
    return true;
  };

  /** `#block=<kennung>` aus einer Adresse holen, sonst leer. */
  const blockAusHash = (roh: string): string => {
    const m = String(roh || '').replace(/^#/, '').match(/^block=(.+)$/);
    return m && m[1] ? decodeURIComponent(m[1]) : '';
  };

  /* DIE ORTE, DIE DER START WIEDERHERSTELLT (E349). Wer die App im Regal
     oder im Notizhefte-Regal verlassen hat, kommt dort wieder an. Alle
     anderen Sonderansichten — „Meine Aufgaben", „Lernen & Alltag",
     „Elektro" — führen zum Regal: das ist der Ort, an dem die Sachen
     liegen, und Redurs Wunsch für „nichts offen". */
  /* UND SEIT E431 AUCH DER KALENDER. Er ist mit demselben Bogen ein eigener
     Ort geworden — eigene Krume, eigene Adresse `#kalender`, keine
     Workspace-Schale. Ein Ort, an den man nicht zurückkommt, ist aber nur
     ein halber: wer die App im Kalender verlässt oder `#kalender` als
     Lesezeichen speichert, landete ohne diese Zeile im Regal.
     Die Tabelle ist beides — sie beantwortet „wo war ich zuletzt" UND
     „welcher Hash ist ein Ort" (`rohHash in SONDER_START`, weiter unten). */
  const SONDER_START: Record<string, () => void> = {
    dokumente: () => Bibliothek.oeffne(),
    'alle-seiten': () => (Bibliothek.alleZeigen ? Bibliothek.alleZeigen() : Bibliothek.oeffne()),
    'seiten-wissen': () => Arbeitswelt.oeffnen('uebersicht'),
    'dateien-pdfs': () => Arbeitswelt.oeffnen('bibliothek'),
    aufgaben: () => Arbeitswelt.oeffnen('aufgaben'),
    datenbanken: () => Arbeitswelt.oeffnen('datenbanken'),
    whiteboards: () => Arbeitswelt.oeffnen('whiteboards'),
    'wissen-verweise': () => Arbeitswelt.oeffnen('wiki'),
    vorlagen: () => Arbeitswelt.oeffnen('vorlagen'),
    workspace: () => Arbeitswelt.oeffnen('uebersicht'),
    arbeitsbereich: () => Arbeitswelt.oeffnen('uebersicht'),
    notizhefte: () => {
      const N = (globalThis as any).Notebook;
      if (N && typeof N.oeffnen === 'function') N.oeffnen(); else Bibliothek.oeffne();
    },
    kalender: () => {
      const P = (globalThis as any).Produktwelten;
      if (P && typeof P.kalender === 'function') P.kalender(); else Bibliothek.oeffne();
    },
  };

  /* DER VORHANG GEHT AUF (E463). `index.html` legt ihn als Text über die
     Seite, bevor das erste Skript läuft — die Sekunde, in der sonst leere
     Kästchen und halbe Leisten stünden. Hier geht er auf: nach dem Start,
     und auch nach einem gescheiterten Start, denn ein Vorhang vor einem
     Fehlerbanner wäre ein stiller Absturz (§7). Das Stilblatt zieht ihn
     ausserdem nach sechs Sekunden von selbst auf, falls diese Zeile nie
     erreicht wird. */
  const vorhangWeg = (): void => {
    const v = document.getElementById('ru-vorhang');
    if (!v || v.hidden) return;
    v.classList.add('ru-vorhang-weg');
    /* Erst nach der Blende verstecken — und nur, wenn ihn niemand in der
       Zwischenzeit wieder zugezogen hat (`bilder.mts` tut das fürs Bild). */
    setTimeout(() => { if (v.classList.contains('ru-vorhang-weg')) v.hidden = true; }, 600);
  };

  const start = async () => {
    /* DIE ZEICHEN DER OBERFLÄCHE ZUERST (E200).
       `index.html` schreibt nur die Stellen — `<span data-sym="search">` —,
       und hier werden sie gefüllt. Das steht ganz vorn, weil sonst zwischen
       Aufbau und Füllung ein Bild mit leeren Kästchen stünde; auf einem
       langsamen Gerät sieht man das.
       Fehlt das Register, bleibt es bei leeren Stellen: die Zeilen tragen
       ihren Namen als Text, also fehlt Bedeutung, nicht Bedienbarkeit. */
    if (typeof Register !== 'undefined' && (Register as any).symbole) {
      (Register as any).symbole.fuelle(document);
    }

    /* VORFÜHRMODUS: EIN BALKEN, DER NICHT ZU ÜBERSEHEN IST (L31, E177).
       `?demo` öffnet eine eigene Ablage (`notizen-demo`) — die echten Notizen
       liegen unberührt daneben. Genau das muss aber dastehen: eine App, die
       aussieht wie die eigene und es nicht ist, ist die unangenehmste Sorte
       Überraschung. Der Balken steht ganz oben, bleibt stehen und nennt den
       Weg zurück. */
    if (typeof Store !== 'undefined' && Store.istDemo && Store.istDemo()) {
      const balken = document.createElement('div');
      balken.id = 'demo-balken';
      balken.setAttribute('role', 'status');
      balken.innerHTML = '<b>Vorführung</b> — hier liegen Beispieldaten in ' +
        'einer eigenen Ablage. Deine eigenen Notizen sind davon nicht ' +
        'berührt. <a href="./index.html">Zu deinen Notizen</a>';
      document.body.prepend(balken);
      document.body.classList.add('hat-demo');
      /* Die Höhe GEMESSEN, nicht geschätzt: am Telefon bricht der Satz um,
         und eine feste Zahl läge dann über der App. */
      const hoeheSetzen = () => document.documentElement.style
        .setProperty('--demo-hoehe', balken.offsetHeight + 'px');
      hoeheSetzen();
      addEventListener('resize', hoeheSetzen);
    }

    /* ----------------------------------------------------------------------
     * WIE VIEL LUFT NEBEN DER SEITE STEHT (E409)
     *
     * Gemessen, nicht geraten: bei 1280 px Fenster ist `#page` 900 px breit
     * und seine Datenbank 708 — die Tabelle daneben braucht 1637 px. 57 %
     * davon lagen hinter einem waagerechten Roller, den niemand sieht. Bei
     * 1920 px Fenster ändert sich daran NICHTS: `#page` bleibt 900, und
     * links und rechts stehen je 483 px leer.
     *
     * Fliesstext soll schmal bleiben, das ist richtig. Eine Datenbank ist
     * kein Fliesstext. Sie darf über den Textrand hinaus — aber nur so weit,
     * wie wirklich Platz ist, und den kennt allein die Schale: die
     * Seitenleiste kann offen oder eingeklappt sein, und eine feste Zahl in
     * einer Media-Query wüsste davon nichts.
     *
     * Deshalb steht hier eine gemessene Zahl statt einer geschätzten.
     * `datenbanken.css` rechnet damit; ist sie 0, ändert sich nichts.
     * -------------------------------------------------------------------*/
    /* Eine feste Reserve statt der gemessenen Rollbalkenbreite. Mit
       `clientWidth` hing die Zahl davon ab, OB der senkrechte Rollbalken
       gerade da ist, und sprang beim Laden von Bildern um sechzehn Pixel
       hin und her.

       ABER: das ist NICHT die Reparatur der Schleifenmeldung, auch wenn es
       zuerst so aussah. Nachgemessen mit `test404 §8` — die Reserve allein
       liess den Fehler weiterbestehen, die Drosselung unten allein behob
       ihn. Diese Zeile macht die Breite ruhig, nicht den Beobachter. Wer
       sie herausnimmt, bekommt ein zuckendes Layout, keinen Fehler. */
    const ROLLER_RESERVE = 16;
    let luftZuletzt = -1;
    const luftMessen = () => {
      const roller = document.getElementById('scroll');
      const seite = document.getElementById('page');
      if (!roller || !seite) return;
      const wert = Math.max(0, Math.round(
        (roller.offsetWidth - ROLLER_RESERVE - seite.clientWidth) / 2));
      /* NUR BEI ÄNDERUNG SCHREIBEN, und erst ab acht Pixeln: unter dieser
         Schwelle ist der Gewinn nicht zu sehen, das erneute Zeichnen aber
         zu bezahlen. */
      if (Math.abs(wert - luftZuletzt) < 8) return;
      luftZuletzt = wert;
      seite.style.setProperty('--seite-luft', wert + 'px');
    };

    /* EINMAL JE BILD, NICHT JE MELDUNG — und DAS ist die Reparatur.
       Ein ResizeObserver, der in seinem eigenen Rückruf das Layout ändert,
       meldet „ResizeObserver loop completed with undelivered notifications",
       und Redion machte daraus eine Fehlerkarte quer über der Ansicht.
       Nachgemessen: ohne diese Drosselung erscheint der Fehler bei `list`,
       `gallery` und `chart` — überall dort, wo nach dem ersten Zeichnen noch
       etwas nachwächst. `test404 §8` hält es fest. */
    let luftGeplant = false;
    const luftBald = () => {
      if (luftGeplant) return;
      luftGeplant = true;
      requestAnimationFrame(() => { luftGeplant = false; luftMessen(); });
    };
    luftMessen();
    addEventListener('resize', luftBald, { passive: true });
    /* BEIDE BEOBACHTEN, und das ist der Punkt, an dem der erste Versuch
       scheiterte: beobachtet war nur `#scroll`. Das ändert seine Breite nie
       — die Seitenleiste schiebt es zwar zusammen, aber `#page` bekommt
       seine 900 px erst später. Gemessen wurde deshalb einmal, viel zu
       früh, mit dem Ergebnis 0, und danach kam nie wieder ein Anlass.
       Auf dem Bild sah das aus, als hätte die Regel nicht gegriffen. */
    if (typeof ResizeObserver !== 'undefined') {
      const beobachter = new ResizeObserver(luftBald);
      const roller = document.getElementById('scroll');
      const seite2 = document.getElementById('page');
      if (roller) beobachter.observe(roller);
      if (seite2) beobachter.observe(seite2);
    }

    /* Die Seitenleiste bekommt, was ihr nicht gehört — hier und nur hier.
       Das muss vor allem anderen stehen: sobald irgendetwas zeichnet, ruft
       es `zeichneBaum`, und das läuft dann schon nach drüben. */
    Seitenleiste.binde({
      oeffne, aktuelleSeite, kuerzlich, kommendeTermine, seitenMenue, suche, papierkorb
    });
    /* Die ruhige Fassung setzt nur ein Attribut am `body` (E219). Hier steht
       sie, damit der Schalter hängt und die Leiste nicht erst voll aufblitzt
       — aber `Store.getMeta` kann an dieser Stelle NOCH NICHTS wissen:
       `Store.load()` läuft erst 135 Zeilen weiter unten, in
       `starteWirklich`. Bis dahin gewinnt immer die Vorgabe.

       Genau das hat test248 §6 gemeldet: „ausgeschaltet" überlebte den
       Neustart nicht, obwohl der Wert richtig gespeichert war. Es ist
       dieselbe Falle wie beim Bibliotheks-Regal (E207) — gelesen, bevor
       die Ablage offen war. Deshalb steht unten ein zweites `anwenden`. */
    if (typeof Ruhig !== 'undefined') Ruhig.binde();
    Kopfleiste.binde({
      zeichneSeite, zeichneBaum, kiPanel, oeffne, aktuelleSeite,
      /* Seit E283 EIN Griff für „volle Breite" statt dreier Handgriffe. */
      volleBreite,
      /* Ein Leser, keine Weiterreichung: die Sonderansicht ist ein Zustand
         der Schale, und die Pfadleiste muss den jeweils aktuellen sehen. */
      sonder: () => sonder
    });
    Inhaltsflaeche.binde({ aktuelleSeite });
    /* DIE KONTEXTKANTE (E272 Phase F). Sie kommt NACH allen anderen: sie
       liest `App.schauplatz()` und hört auf `redion:schauplatz`, und beides
       gibt es erst, wenn die Schale steht. Ohne das Modul (Einzeldatei
       älteren Standes, Prüflauf ohne die Datei) bleibt der Platz leer und
       die Seitenleiste sichtbar — kein Absturz. */
    if (typeof Kontextkante !== 'undefined') Kontextkante.binde();

    /* DIE AUFTRAGSMASCHINE (E286). Nach der Ablage, weil sie sie braucht,
       und nach den Bereichen, weil die ihre Läufer anmelden. Ohne einen
       einzigen angemeldeten Läufer tut ihr Takt gar nichts — sie liest
       dann nicht einmal das Fach. */
    if (typeof Auftraege !== 'undefined') { void Auftraege.start(); }

    /* ----------------------------------------------------------------------
     * FEHLER SICHTBAR MACHEN — aber nur, wenn die Meldung etwas wert ist
     * ----------------------------------------------------------------------
     * Eine stumme Seite hilft niemandem. Ein Balken, der „Script error."
     * sagt und dann um Weitergabe bittet, aber auch nicht: dieser Text ist
     * die leere Hülle, die jeder Browser liefert, wenn ein Skript von einer
     * FREMDEN Adresse stolpert. Datei, Zeile und Stapel verschweigt er aus
     * Sicherheitsgründen — es gibt nichts zu melden, und die Bitte darum
     * lässt den Menschen mit einer Aufgabe zurück, die er nicht lösen kann.
     *
     * Woher so etwas kommt: die KI-Bibliothek von `esm.run`, eingebetteter
     * fremder Inhalt, oder — am häufigsten auf dem Telefon — eine
     * Browser-Erweiterung oder ein Inhaltsblocker. Redion läuft in all
     * diesen Fällen weiter, und genau das gehört dann dagestanden.
     *
     * Dazu zwei Kleinigkeiten, die vorher fehlten: Ort und Zeile werden
     * mitgenannt, wenn es sie gibt, und derselbe Fehler erscheint nur
     * einmal. Ein Fehler in einer Schleife baute vorher einen Balken pro
     * Durchgang, bis nichts anderes mehr zu sehen war.
     * -------------------------------------------------------------------- */
    const schonGemeldet = new Set<string>();
    const fehlerMelden = (text: string, ort: string, fremd: boolean) => {
      const schluessel = text + '|' + ort;
      if (schonGemeldet.has(schluessel)) return;
      schonGemeldet.add(schluessel);

      /* Für später aufheben — auf dem Telefon gibt es keine Konsole, in die
         man hineinsehen könnte. Zwanzig reichen; ältere fallen hinten raus. */
      try {
        const bisher = Store.getMeta('fehlerprotokoll', []) || [];
        bisher.push({ wann: new Date().toISOString(), text, ort, fremd });
        Store.setMeta('fehlerprotokoll', bisher.slice(-20));
      } catch { /* wenn nicht einmal das geht, hilft ein Balken auch nicht */ }

      fehlerKarte(fremd, text, ort);
    };

    /* ----------------------------------------------------------------------
     * DIE FEHLERKARTE (Telefon-Vorgabe, Phase 8)
     * ----------------------------------------------------------------------
     * Vorher war das ein Balken über die ganze Breite mit dem technischen
     * Text darin. Auf dem Telefon sah das aus wie ein kaputtes Stück Seite:
     * im Bildschirmfoto vom 6. August hatte Redur den Text markiert, weil
     * er wie Inhalt aussah und weil dort „bitte melde mir diesen Text"
     * stand.
     *
     * Jetzt: eine kleine Karte, ein Satz in Alltagssprache, und der
     * technische Teil hinter „Details kopieren". Wer ihn braucht, holt ihn;
     * wer ihn nicht braucht, sieht ihn nicht. Nicht markierbar, damit sie
     * nicht wie Text wirkt, den man anfassen soll.
     * -------------------------------------------------------------------- */
    const fehlerKarte = (fremd: boolean, text: string, ort: string) => {
      document.getElementById('fehler-karte')?.remove();
      const k = document.createElement('div');
      k.id = 'fehler-karte';
      k.setAttribute('role', 'alert');
      k.innerHTML =
        '<div class="fk-kopf"><span class="fk-zeichen">!</span>' +
          '<b>Etwas ist schiefgelaufen</b>' +
          '<button class="fk-zu" data-a="zu" aria-label="Meldung schliessen">✕</button></div>' +
        '<div class="fk-satz">' + (fremd
          ? 'Der Fehler kommt von ausserhalb — meist von einer Browser-Erweiterung ' +
            'oder eingebettetem Inhalt. Redion läuft weiter.'
          : 'Redion konnte diesen Schritt nicht ausführen. Deine Notizen sind davon ' +
            'nicht betroffen.') + '</div>' +
        '<div class="fk-knoepfe"><button data-a="kopieren">Details kopieren</button>' +
          '<button data-a="zu">Schliessen</button></div>';
      document.body.appendChild(k);
      requestAnimationFrame(() => k.classList.add('auf'));

      const einzelheiten = [text, ort, location.href, navigator.userAgent]
        .filter(Boolean).join('\n');
      k.addEventListener('click', async (ev) => {
        const b = (ev.target instanceof Element) ? ev.target.closest('button') : null;
        if (!b) return;
        if (b.dataset.a === 'zu') { k.remove(); return; }
        if (b.dataset.a !== 'kopieren') return;
        try {
          await Ablage.kopiere(einzelheiten);
          b.textContent = 'Kopiert';
        } catch {
          /* Ohne Zwischenablage (altes iOS, kein sicherer Kontext) wenigstens
             zeigen, statt nur „ging nicht" zu sagen. */
          b.textContent = 'Kopieren geht hier nicht';
          const pre = document.createElement('pre');
          pre.className = 'fk-roh';
          pre.textContent = einzelheiten;
          k.appendChild(pre);
        }
      });
    };

    addEventListener('error', (e) => {
      /* Kein Skriptfehler, sondern ein Bild oder eine Datei, die nicht kam.
         `e.message` ist dann leer, und der Balken sagte „undefined". */
      if (!(e instanceof ErrorEvent)) return;
      const text = String(e.message || (e.error && e.error.message) || '').trim();
      const ort = e.filename ? e.filename.split('/').pop() + ':' + e.lineno : '';
      /* Die Kennzeichen der leeren Hülle: genau dieser Satz, kein Ort, kein
         Fehlerobjekt. Fehlt eines davon, ist es ein echter Fehler von hier. */
      const fremd = (!text || /^script error/i.test(text)) && !e.filename && !e.error;
      fehlerMelden(text || 'Unbekannter Fehler', ort, fremd);
    });
    addEventListener('unhandledrejection', (e) => {
      const grund = e.reason;
      const text = String(grund?.message ?? grund ?? '').trim();
      fehlerMelden(text || 'Ein Versprechen wurde gebrochen, ohne Grund zu nennen',
                   '', /^script error/i.test(text));
    });
    Store.beiWarnung((text: string) => UI.banner(text, 'warn'));

    try {
      await starteWirklich();
      vorhangWeg();
    } catch (err) {
      vorhangWeg();
      UI.banner('Die App konnte nicht starten: ' +
        (err instanceof Error ? err.message : String(err)), 'fehler');
      throw err;
    }
  };

  const starteWirklich = async () => {
    await Store.load();

    /* JETZT erst steht in `Store.cache.meta`, was der Nutzer wollte. Ohne
       diese Zeile gewinnt oben immer die Vorgabe, und der Schalter in den
       Einstellungen wäre wirkungslos, ohne dass es jemand merkt (E219). */
    if (typeof Ruhig !== 'undefined') Ruhig.anwenden();

    /* Ist eine Sperre eingerichtet, geht ohne Passwort nichts weiter. */
    await Krypto.startPruefen();

    /* Die App hiess früher „Notizen" und heisst jetzt Redion. Wer den Namen
       nie selbst geändert hat, bekommt den neuen — wer einen eigenen gesetzt
       hat, behält ihn. */
    if (Store.getMeta('arbeitsName', '') === 'Notizen') Store.setMeta('arbeitsName', 'Redion');

    document.documentElement.dataset.theme = Store.getMeta('theme', 'dark');
    Aussehen.start();
    Einstellungen.anwenden();

    if (!Store.rootPages().length) beispielAnlegen();

    /* Das gesammelte Notion-Wissen als echte Seiten — beim ersten Start
       angelegt, danach nur noch, wenn der Text neuer geworden ist. */
    Wissen.sicherstellen();

    /* Eigene Formelfunktionen bereitstellen, bevor die erste Seite rechnet */
    Werkzeuge.formelBibliothekAnwenden();

    /* Fehler sammeln, Papierkorb nach Frist aufräumen */
    Pflege.start();

    /* Ein Blocklink nennt keine Seite, sondern einen Block. Welche Seite
       aufgehen muss, steht erst nach dem Hochlaufen fest — deshalb hier die
       Seite DES BLOCKS, und nicht der Hash selbst (E105). */
    const produktRoute = Produktwelten.routeAusHash(location.hash);
    const zielBlock = produktRoute ? '' : blockAusHash(location.hash);
    const rohHash = location.hash.slice(1).split(':')[0] || '';
    const ausHash = produktRoute ? '' : zielBlock
      ? ((typeof Links !== 'undefined' && Links.seiteVon)
          ? (Links.seiteVon(zielBlock) || {}).id || '' : '')
      : rohHash;
    /* NUR EINE SEITE IM HASH IST EIN ZIEL (E349). `#dokumente` steht nach
       jedem Besuch des Regals in der Adresse (`zeigeSonder`), und beim
       Neuladen sah der Start darin bisher eine Seitenkennung: die Bedingung
       für die Startansicht wurde falsch, das Regal kam nicht — stattdessen
       `letzte` oder die erste Wurzelseite. Ein Hash zählt nur, wenn es die
       Seite gibt; der Hash einer Sonderansicht ist ein ORT. */
    const hashSeite = (ausHash && Store.getBlock(ausHash)) ? ausHash : '';
    const sonderHash = (!produktRoute && !zielBlock && rohHash in SONDER_START) ? rohHash : '';
    const zuletztOffen = Store.getMeta('letzte');
    /* HIER GEMERKT UND NICHT WEITER UNTEN GEFRAGT (E236).
       `oeffne()` schreibt `letzte` selbst — schon zwei Zeilen später zeigt
       die Marke also auf die Seite, die gerade aufgegangen ist, und nicht
       mehr auf die von gestern. Wer weiter unten fragt „gab es ein
       zuletzt geöffnetes Dokument?", bekommt deshalb IMMER ja.
       Genau daran ist der erste Versuch gescheitert: das Regal ging nie
       auf, weil die Bedingung nie falsch wurde. */
    const zuletztBlock = zuletztOffen ? Store.getBlock(zuletztOffen) : null;
    /* Eine Seite im Papierkorb ist kein Ort zum Weiterarbeiten (E349). */
    const hatteDokument = !!(zuletztBlock && zuletztBlock.alive !== false);
    /* WO MAN WAR (E349). `zuletztOrt` sagt, ob zuletzt eine Seite offen war
       oder eine Sonderansicht; ein Bestand von vor E349 kennt den Ort nicht,
       und dann gilt, was vorher galt: die zuletzt geöffnete Seite. */
    const ortZuletzt = String(sonderHash || Store.getMeta('zuletztOrt', 'seite') || 'seite');
    const wiederDokument = hatteDokument && ortZuletzt === 'seite';
    /* EINMALIG (E349): „Heute" und „Workspace" als Startansicht stammten
       fast immer aus dem Onboarding, das sie ungefragt setzte — wer es
       durchlief, sah nie seine PDF, egal was E236 versprach. Beide fallen
       einmal auf „dokument" zurück; wer sie danach in den Einstellungen neu
       wählt, behält sie, denn die Marke steht dann schon. */
    if (!Store.getMeta('startAnsichtE349')) {
      const alt = Store.getMeta('startAnsicht');
      if (alt === 'start' || alt === 'workspace') Store.setMeta('startAnsicht', 'dokument');
      Store.setMeta('startAnsichtE349', true);
    }
    const wunsch = Store.getMeta('startAnsicht', 'dokument');
    const dokumentStart = wunsch === 'dokument' || wunsch === 'letzte';
    /* DAS REGAL BRAUCHT KEINE SEITE DAVOR (E349). Hier stand: keine Seite
       gemerkt, dann die erste Wurzelseite öffnen — und `oeffne()` schrieb
       sie als `letzte` und zählte einen Aufruf. Der ZWEITE Start zeigte
       deshalb „Willkommen" statt des Regals; das Regal hielt genau einen
       Start. Kommt das Regal, wird jetzt keine Seite geöffnet, keine Marke
       geschrieben, kein Zähler erhöht. Die Fläche ist einen Wimpernschlag
       leer, bis am Ende von start() das Regal steht. */
    const startSeite = hashSeite ? hashSeite
                : dokumentStart ? (wiederDokument ? zuletztOffen : '')
                : hatteDokument ? zuletztOffen
                  : (Store.rootPages()[0] || {}).id;

    zeichneBaum();
    if (startSeite) oeffne(startSeite);
    else { zeichneSeite(); schauplatzMelden(); }

    /* Kam der Start über einen Blocklink, steht jetzt die richtige Seite —
       aber oben. Also noch hinrollen. */
    if (zielBlock) zeigeBlock(zielBlock);

    /* Und für jeden Blocklink, der SPÄTER angeklickt wird. `oeffne` schreibt
       die Seitenkennung selbst in die Adresse; solche Änderungen laufen hier
       durch, weil sie nicht mit `block=` beginnen. */
    addEventListener('hashchange', () => {
      const b = blockAusHash(location.hash);
      if (b) { zeigeBlock(b); return; }
      const alt = Produktwelten.routeAusHash();
      if (alt?.welt === 'workspace') { Produktwelten.routeOeffnen(alt); return; }
      const ort = location.hash.slice(1);
      const jetzt = String(sonder?.titel || '').toLowerCase().replace(/[^a-z]+/g, '-');
      if (ort !== jetzt && SONDER_START[ort]) SONDER_START[ort]();
    });

    /* AM TELEFON BEGINNT REDION AUF „START", NICHT IN EINER SEITE (E37).
       Eine App, die mit einem halb gescrollten Text aufgeht, sieht aus wie
       eine Webseite; eine App beginnt bei ihrer Übersicht. Der Reiter
       stand oben schon auf „Start" — nur der Inhalt darunter war die
       zuletzt geöffnete Seite. Beides zeigte gleichzeitig etwas anderes.

       Nur beim ERSTEN Öffnen: wer über einen Link mit `#seite` kommt oder
       schon in dieser Sitzung gearbeitet hat, will dorthin zurück und
       nicht auf den Start geschickt werden. */
    /* `ausHash` von OBEN, nicht `location.hash` von hier: `oeffne()` schreibt
       die Seitenkennung selbst in die Adresse, und danach ist der Hash immer
       gesetzt. Die Bedingung war damit nie wahr. */
    /* HIER STAND EIN ZWEITER ENTSCHLUSS ÜBER DIESELBE FRAGE (E236).
       Der Absatz darüber begründet gut, warum eine App bei ihrer Übersicht
       beginnt und nicht in einem halb gescrollten Text. Nur traf er die
       Entscheidung ein zweites Mal — und ohne die Einstellung zu lesen.

       Die Folge: „Beim Öffnen zeigen: Zuletzt geöffnete Seite" gab es in
       den Einstellungen seit Langem, und am Telefon tat sie nichts. Wer
       sie wählte, landete trotzdem auf „Heute".

       Jetzt entscheidet die Wahl, und zwar an EINER Stelle: weiter unten
       bei `wunsch`. Was hier bleibt, ist nur noch die Vorgabe für den, der
       nie gewählt hat — und die heisst seit E236 „Dokument". */
    void 0;

    /* ----------------------------------------------------------------------
       WAS DAS ANDERE FENSTER GEÄNDERT HAT
       ----------------------------------------------------------------------
       `kern/ablage/nachbarn.js` hält den Draht, `indexdb.js` trägt fremde
       Sätze in den Zwischenspeicher ein. Was fehlt, ist das Sichtbarmachen —
       und das gehört hierher, weil der Kern die Oberfläche nicht kennt.

       DAS NEUZEICHNEN HAT EINE BEDINGUNG. Wer gerade tippt, verliert beim
       Neuzeichnen den Schreibzeiger und mitten im Satz den Faden. Deshalb
       wird der Zwischenspeicher IMMER aufgefrischt — daran hängt, dass
       nichts überschrieben wird —, gezeichnet aber nur, wenn niemand
       schreibt. Der Rest kommt beim nächsten Klick von selbst.

       Die Reihenfolge ist Absicht: erst der Baum (billig, fast immer
       sichtbar), dann die Seite. */
    const schreibtGerade = () => {
      const a = document.activeElement;
      if (!(a instanceof HTMLElement)) return false;
      return a.isContentEditable || a.tagName === 'INPUT' || a.tagName === 'TEXTAREA';
    };

    Store.on((was: any) => {
      if (was !== 'fremd' && was !== 'fremd-alles') return;
      if (was === 'fremd-alles') {
        /* Drüben wurde eine Sicherung eingespielt oder alles gelöscht. Was
           hier im Speicher liegt, ist danach nicht mehr derselbe Bestand —
           und einzelne Sätze nachzulesen hilft nicht. Ehrlicher ist die
           Bitte, neu zu laden, als eine Oberfläche, die halb stimmt. */
        UI.toast('Ein anderes Fenster hat den ganzen Bestand ausgetauscht — bitte neu laden');
        return;
      }
      if (schreibtGerade()) return;
      zeichneBaum();
      zeichneSeite();
    });

    /* Beim Öffnen zeigen: was in den Einstellungen gewählt ist */
    /* DIE VORGABE IST „DOKUMENT" (E236).
       Redur: „wenn ich die Webseite öffne, sollte die zuletzt geöffnete
       PDF sich öffnen; wenn keine offen war, direkt dort, wo die Dateien
       liegen." Das ist die Erwartung an ein Werkzeug, in dem man arbeitet
       — nicht an eine Webseite, die einen begrüsst.

       Wer schon einmal etwas anderes gewählt hat, behält seine Wahl:
       `getMeta` gibt den gespeicherten Wert zurück und die Vorgabe nur,
       wenn keiner da ist. */
    let startAnsichtZeigen: (() => void) | null = null;
    /* DIE STARTANSICHT DARF NICHT ÜBERSCHREIBEN, WAS SCHON OFFEN IST (E138).
       Hier stand ein blankes `setTimeout(…, 60)`. Wer in diesen 60 ms eine
       Seite anklickt — und beim Start liegt der Baum längst da —, sah sie
       einen Wimpernschlag lang und dann das Heute-Bild.

       Gemessen mit einem Whiteboard, das direkt nach dem Laden geöffnet
       wurde:

           sofort      Zeichenfläche da
           nach 600 ms Zeichenfläche weg, Lernwelt da

       Das war auch der wahre Grund für das falsche Papier-Bild in E136.
       Dort steht, `App.oeffne` räume die Sonderansicht nicht weg — das
       stimmt nicht: sie räumt sie weg, und die verspätete Startansicht holt
       sie zurück.

       Die Bedingung ist deshalb: nur zeigen, wenn seither niemand etwas
       anderes geöffnet hat. */
    /* NICHT „IN 60 MILLISEKUNDEN", SONDERN „AM ENDE VON start()" (E138).

       Hier stand `setTimeout(…, 60)`, und der Grund dafür ist gut: die
       Startansicht braucht `Produktwelten.start()`, und das läuft erst
       weiter unten. Nur ist eine Zeitspanne die falsche Art, auf eine
       Reihenfolge zu warten — sie ist ein Versprechen ohne Deckung.

       Was in diesen 60 ms passieren kann, ist alles: ein Klick im Baum,
       ein Aufruf von aussen. Gemessen mit `bilder.mts`, zwei Durchgänge
       hintereinander mit demselben Code:

           dunkel   Zeichenfläche da
           hell     Zeichenfläche weg, Heute-Bild da

       Zwei verschiedene Bilder aus demselben Aufruf — das ist ein Wettlauf,
       kein Fehler in der Ansicht. Die Startansicht wird deshalb GEMERKT und
       ganz am Ende von `start()` ausgeführt, wenn alle Module stehen. Danach
       kommt jedes `oeffne()` von aussen garantiert später und gewinnt. */
    if (!hashSeite && !produktRoute) {
      /* „DOKUMENT": das zuletzt geöffnete, sonst das Regal.
         `startSeite` weiter oben zeigt bereits auf `Store.getMeta('letzte')`,
         wenn es den Block noch gibt — dann ist die Seite schon offen und
         hier ist nichts zu tun. Gibt es sie nicht mehr (gelöscht, anderes
         Gerät, erster Start), geht das Regal auf.

         `letzte` ist derselbe Weg: die Wahl gab es in den Einstellungen
         schon, nur hat sie nie jemand ausgewertet. Sie führte über den
         Umweg „startAnsichtZeigen bleibt leer" zufällig zum richtigen
         Ergebnis — am Rechner. Am Telefon nicht: dort schickte der Block
         weiter oben JEDEN auf „Heute". */
      if (dokumentStart && !wiederDokument)
        startAnsichtZeigen = SONDER_START[ortZuletzt] || (() => Bibliothek.oeffne());
      if (wunsch === 'dokumente') startAnsichtZeigen = () => Bibliothek.oeffne();
      if (wunsch === 'start') startAnsichtZeigen = () => Produktwelten.lernen('heute');
      if (wunsch === 'workspace') startAnsichtZeigen = () => Produktwelten.workspace('start');
      if (wunsch === 'posteingang') startAnsichtZeigen = () => Ansichten.posteingang();
      if (wunsch === 'journal') startAnsichtZeigen = () => Werkzeuge.journal();
      /* Die Notizhefte (E264): beide Enden im SELBEN Schritt wie die
         Einstellungs-Werte verdrahtet — die E236-Lehre („die Wahl gab es,
         nur hat sie nie jemand ausgewertet") wiederholt sich nicht. */
      if (wunsch === 'notizhefte')
        startAnsichtZeigen = () => (globalThis as any).Notebook?.oeffnen?.();
      if (wunsch === 'notizheft')
        startAnsichtZeigen = () => (globalThis as any).Notebook?.resume?.();
      if (wunsch === 'seite' && Store.getMeta('startSeite')) {
        const z = Store.getBlock(Store.getMeta('startSeite'));
        if (z) oeffne(z.id);
      }
    }
    if (produktRoute) startAnsichtZeigen = () => Produktwelten.routeOeffnen(produktRoute);
    else if (sonderHash) startAnsichtZeigen = SONDER_START[sonderHash] || null;

    /* Name und Symbol des Arbeitsbereichs */
    const wsBtn = document.getElementById('btn-settings');
    /* ══ NACH BEDEUTUNG, NICHT NACH PLATZ (E590) ════════════════════════
       Hier stand `wsBtn?.querySelectorAll('span')[1]`. Das war einmal der
       Name — bis die Bewegungsschicht (`motion.ts`) eine `rmo-sliders`-
       Hülle als erstes Kind einsetzte. Seither ist `[1]` das ZEICHEN, und
       die Zeile darunter schrieb den Namen hinein: in der Seitenleiste
       stand zweimal „Redion" nebeneinander, und das eingestellte Zeichen
       kam dort nie an.
       Ein Zugriff nach Platz hält nur so lange, wie niemand etwas
       davorstellt — und genau das darf eine Schicht, die nichts von
       dieser Zeile weiss. */
    const wsName = wsBtn?.querySelector<HTMLElement>('.ws-name');
    /* Alle `.ws-icon` — die Schublade und die Einstellungen. Das Konto rechts
       in der Menüleiste trägt seit E456 ein Symbol statt des Zeichens. */
    document.querySelectorAll('.ws-icon').forEach(ico => {
      ico.textContent = Store.getMeta('arbeitsIcon', 'N');
    });
    if (wsName) wsName.textContent = Store.getMeta('arbeitsName', 'Redion');

    Blocks.bindeEditor(document.getElementById('page'));
    tasten();
    KI.bindePanel();
    KI.start();

    /* Die Zusatzschichten */
    Links.start();
    Werkzeuge.start();
    Verlauf.start();
    Auswahl.start();
    Erwaehnung.start();
    Mehrfach.start();
    Einstellungen.start();
    Mail.kuerzelStart();
    Clipper.start();
    Agent.start();
    MCP.start();
    PWA.start();
    Fenster.start();
    Tempo.start();
    Plan.start();
    Erweiterung.start();
    Eingang.start();
    Api.start();
    Protokoll.start();
    Zusammen.start();
    Fassung.start();
    Vorrat.start();
    Wolke.start();
    /* Die automatische Sicherung in einen Ordner (E270). Sie tut nichts,
       solange kein Ordner gewählt ist — `start()` setzt dann nicht einmal
       einen Zeitgeber. */
    if (typeof OrdnerSicherung !== 'undefined') OrdnerSicherung.start();
    Produktwelten.start();
    /* Das Menüband (E210). Es steht nach den Bereichen, weil sein Register
       beim Zeichnen `zeigen()` fragt — und das prüft, ob es die Module gibt.
       Vorher gefragt wäre die Antwort „nein" gewesen, und das Band wäre
       leer geblieben, ohne dass jemand einen Fehler gesehen hätte. */
    Menueband.start();
    if (typeof StudioSchale !== 'undefined') StudioSchale.start();
    Blocks.auswahlEinklinken();
    /* DER WILLKOMMENSBILDSCHIRM BLEIBT DER WILLKOMMENSBILDSCHIRM (E137).
       Hier stand `ProduktOnboarding.vielleichtStarten()` zuerst, und der
       Rundgang nur, „wenn das Onboarding nichts gezeigt hat". Damit hat die
       Einrichtung der Hauptwelten den Bildschirm übernommen, den E55
       ausdrücklich für den Rundgang beschlossen hatte — und E55 begründet
       das mit dem Satz, der auch für die Einrichtung gilt: „ein Fenster,
       das den Bildschirm nimmt, bevor man etwas getan hat, ist zudringlich."

       Nebenwirkungen, gemessen: der Rundgang kam beim ZWEITEN Start doch
       noch — zwei Begrüssungen an zwei Tagen (L52) —, und die Einrichtung
       fing als Modal jeden Klick ab, woran im vollen Durchgang mehrere
       Prüfläufe hängenblieben.

       Die Einrichtung ist deshalb ein Angebot statt einer Pflicht: sie steht
       in der Befehlspalette und als Karte auf dem Heute-Bild, solange sie
       noch nicht durchlaufen ist. `vielleichtStarten` bleibt im Modul — wer
       sie wieder von selbst öffnen lassen will, ruft sie hier auf. */
    Rundgang.vielleichtStarten();

    /* Seitenleiste und Kopfzeile */
    const an = (id: any, fn: any) => document.getElementById(id)?.addEventListener('click', fn);
    /* DIE OBERSTE GRUPPE HÄNGT AM REGISTER (L51, E160).
       Hier standen acht Zeilen `an('btn-…', …)`, und daneben stand ein
       Register, das dieselben Zeilen anders beschrieb — „Suchen" öffnete
       dort die Befehlspalette, „Posteingang" die Meldungsliste. Beides fiel
       nicht auf, weil das Register nie ausgeführt wurde.

       Jetzt gibt es die Handlung nur einmal. Das Aussehen bleibt in
       index.html, wo es hingehört; `knopfId` verbindet beide, und test222
       §5 vergleicht Markup und Register Zeile für Zeile. */
    if (typeof Register !== 'undefined' && Register.navigation) {
      /* Zwei Plätze, dieselbe Verdrahtung: die oberste Gruppe und der Fuss
         (E167). Beide tragen ihr Aussehen in index.html und ihre Handlung
         im Register. */
      [...Register.navigation.anPlatz('oben'),
       ...Register.navigation.anPlatz('fuss')].forEach((e: any) => {
        if (e.knopfId && e.tun) an(e.knopfId, () => {
          try {
            e.tun();
            /* WO BIN ICH? (E221)
             *
             * Bis hierher markierte nur `produktwelten.css` — zwei fest
             * verdrahtete Zeilen für „Lernzentrum" und „Workspace", und
             * sonst nichts. Ein Klick auf „Bibliothek" liess also
             * „Workspace" aufleuchten; ein Klick auf „Aufgaben" ebenso.
             *
             * Mit 32 Zeilen war das eine grobe Auskunft. Mit fünf (E219)
             * ist es falsch: „Workspace" steht dann gar nicht mehr da, und
             * die Leiste sagt überhaupt nichts mehr. Wer wenig zeigt, muss
             * das Wenige richtig zeigen.
             *
             * Deshalb hier, an der einen Stelle, an der ohnehin jeder
             * Eintrag durchkommt — kein zweiter Katalog, keine Liste von
             * Sonderfällen. Der Fuss („Importieren", „Papierkorb") wird
             * ausgenommen: das sind Handlungen, keine Orte. */
            if (e.platz === 'oben') {
              document.querySelectorAll('#sidebar .side-item[aria-current]')
                .forEach(k => k.removeAttribute('aria-current'));
              document.getElementById(e.knopfId)?.setAttribute('aria-current', 'page');
            }
          }
          catch (fehler: unknown) {
            if (typeof Reporter !== 'undefined')
              Reporter.error('Seitenleiste',
                e.knopfId + ': ' + (fehler instanceof Error ? fehler.message : String(fehler)), fehler);
          }
        });
      });
    }
    an('btn-ai', () => kiPanel());
    /* `btn-trash` hängt seit E167 am Register — die Zeile hier wäre die
       zweite Verdrahtung desselben Knopfes, und wohin das führt, steht in
       E160: ein Klick auf „Neue Seite" legte zwei Seiten an. */
    an('btn-settings', einstellungen);
    an('btn-theme', () => theme());
    an('btn-side', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));

    /* Breite der Seitenleiste ziehen — Notion kann das, aber merkt sie sich
       nicht je Gerät; hier bleibt sie gespeichert. */
    seitenleisteBreite();
    /* `btn-new` HING HIER EINMAL ZU VIEL. Die Schleife oben hängt jede Zeile
       der obersten Gruppe an, „Neue Seite" eingeschlossen — die Zeile hier
       kam dazu, und ein Klick legte ZWEI Seiten an. Gemessen: 13 Seiten
       vorher, 15 nachher.

       Keine Prüfung sah das. „Macht die Zeile etwas auf?" ist bei zwei
       Seiten genauso grün wie bei einer. test222 §5 zählt jetzt nach
       (E160). `btn-new-bottom` bleibt: den kennt das Register nicht. */
    an('btn-new-bottom', () => neueSeite());
    an('btn-neuer-chat', () => { Seitenleiste.reiter('chat'); zeichneBaum(); KI.neuerChat(); });

    /* Leiste am unteren Rand — nur auf dem Telefon sichtbar */
    /* --- Die untere Leiste am Telefon --------------------------------
     * Sie zeigt jetzt dieselben vier Bereiche wie die Reiterleiste am PC:
     * Start, Chats, Besprechungen, Posteingang. Bisher kam man an drei
     * davon nur über die Schublade — man musste also wissen, dass es sie
     * gibt. Der Kreis in der Mitte bleibt die KI.
     * ---------------------------------------------------------------- */
    /* DOKUMENTE — das Regal, wo Redion jetzt öffnet (E236). */
    /* Den Reiter setzt `Bibliothek.oeffne()` selbst — dort gehört er hin,
       weil das Regal auch vom Start, aus dem Mehr-Blatt und über einen
       Verweis aufgeht und die Markierung jedes Mal stimmen muss. */
    /* Erst die gemeinsame Dock-Fläche auf das getippte Ziel schicken.
       Der eigentliche Bildschirmaufbau folgt im nächsten Frame. So kann der
       Browser mindestens einen sichtbaren Compositor-Frame der Reise zeigen,
       bevor die neue Ansicht synchron DOM aufbaut. */
    const dockWechsel = (reiterId: string, oeffnen: () => void) => {
      Seitenleiste.reiter(reiterId);
      handyLeiste();
      requestAnimationFrame(() => oeffnen());
    };
    an('hl-dok', () => { PWA.schubladeZu && PWA.schubladeZu();
                         dockWechsel('dokumente', () => { Bibliothek.oeffne(); handyLeiste(); }); });
    an('hl-start', () => { PWA.schubladeZu && PWA.schubladeZu();
                           dockWechsel('start', () => { Produktwelten.lernen('heute'); handyLeiste(); }); });
    an('hl-lernen', () => { PWA.schubladeZu && PWA.schubladeZu();
                            dockWechsel('lernen', () => { Produktwelten.lernen('lernen'); handyLeiste(); }); });
    /* HIER STAND `an('hl-seiten', …)` — bis E280 (L86).
       Der Knopf war seit E236 in keinem Markup mehr; die Zeile blieb als
       Erklärung stehen, „bis Redur sagt, dass der Weg wirklich weg soll".
       Er hat es in E277 gesagt.
       Der Weg selbst bleibt: `Produktwelten.workspace('start')` steht in
       `register/navigation.ts` (Knopf `btn-workspace`), in der
       Befehlspalette und in der Mehr-Kante. */
    /* AM TELEFON AUF DIE BÜHNE, am Rechner in die Seitenleiste. Vorher zog
       dieser Reiter auch am Telefon die Schublade auf — also die
       Seitenleiste des Rechners auf 390 px geschoben, samt Baum und
       33-px-Zeilen. Genau davon ist das R-Blatt weggekommen (E38); ein
       Reiter, der sie wieder hereinholt, macht die Hälfte davon rückgängig. */
    an('hl-bespr', () => { PWA.schubladeZu && PWA.schubladeZu();
                           dockWechsel('bespr', () => { Produktwelten.planung(); handyLeiste(); }); });
    /* `hu-ki`, `hu-suche` und `hu-neu` gab es in der schwebenden Leiste
       unten. Sie ist mit E236 weggefallen — zwei Leisten am unteren Rand
       wären eine zu viel gewesen. Die drei Wege sind nicht weg:
         Suche → `mb-suche` rechts in der Menüleiste (und Strg+P)
         KI    → `mb-ki`    rechts in der Menüleiste (und Strg+J)
         Neu   → der „+ Neu"-Knopf im Regal und das Mehr-Blatt
       `an()` bindet still, wenn es das Element nicht gibt; die drei Zeilen
       hier stehenzulassen wäre trotzdem eine Lüge über den Aufbau. */
    /* Der Kreis links oben öffnet den Arbeitsbereich — dieselbe Schublade
       wie früher der ☰. */
    /* ----------------------------------------------------------------------
     * DAS R-MENÜ (Telefon-Vorgabe Phase 7)
     * ----------------------------------------------------------------------
     * Vorher zog der Kreis die Seitenleiste als Schublade herein — also die
     * Rechner-Oberfläche auf ein Telefon geschoben: Baum, Reiter, kleine
     * Zeilen. Am Telefon gehört an diese Stelle ein Blatt mit grossen
     * Zeilen und den Wegen, die man wirklich sucht.
     *
     * Am Rechner bleibt es bei der Schublade — dort ist die Seitenleiste
     * richtig, und ein Blatt von unten wäre dort der Fremdkörper.
     * -------------------------------------------------------------------- */
    /* UND HIER STAND `an('hl-konto', …)` — ebenfalls bis E280 (L86).
       Der R-Kreis steht seit E236 rechts in der Menüleiste; sein Klick
       hängt an `mb-konto` in `menueband.ts` und ruft dort `App.arbeitsbereich()`.
       Die Zeile hier band an nichts. */
    /* „Mehr" statt „Eingang" (E42 §6): Werkzeuge, Hilfe, Sicherung, Import,
       Papierkorb und Einstellungen brauchen einen Platz oben — ein
       Posteingang, der meistens leer ist, nicht. Er wohnt jetzt als Zeile
       in Mehr und ist damit keinen Griff weiter weg als vorher.
       `reiter('mehr')`, nicht `'start'`: die Pille oben liest ihn. */
    an('hl-mehr', () => { PWA.schubladeZu && PWA.schubladeZu();
                          dockWechsel('mehr', () => { Ansichten.mehr(); handyLeiste(); }); });
    an('btn-suche-handy', () => suche());
    /* HIER STAND `an('btn-suche-mitte', …)` — bis E272.
       Den Knopf gibt es seit dem Wegfall der grossen Suchbox nicht mehr.
       Die Zeile stehen zu lassen wäre die vierte tote Verdrahtung dieser
       Datei gewesen: `an()` bindet mit `?.` still ins Leere, und niemand
       merkt es (L86 führt die drei anderen). Die Suche selbst ist
       unverändert erreichbar — `mb-suche` in der Reiterzeile, Strg + P,
       `btn-search` in der Seitenleiste, `btn-suche-handy` am Telefon; alle
       vier rufen dasselbe `suche()`. */
    an('btn-neu-handy',   () => neueSeite());
    /* MIT DEM DAUMEN ZWISCHEN DEN BEREICHEN (E526). `Wischen` kennt keinen
       Bereich — es sucht den nächsten Reiter und DRÜCKT IHN, damit für die
       Geste alles gilt, was für den Tipp darüber gilt. Deshalb steht der
       Aufruf hier, hinter den fünf Bindungen, und nicht früher. */
    try { (window as any).Wischen?.starten?.(); } catch { /* ohne Geste */ }
    handyLeiste();

    /* Reiterleiste oben in der Seitenleiste */
    document.getElementById('side-reiter')?.addEventListener('click', (e) => {
      const b = elVon(e)?.closest<HTMLElement>('[data-reiter]');
      if (!b) return;
      /* Zweiter Klick auf denselben Reiter öffnet seine Einstellungen —
         genau wie bei Notion beim Home-Reiter. */
      const r = b.dataset.reiter;
      if (!r) return;
      if (r === Seitenleiste.reiter() && Seitenleiste.reiter() === 'start') {
        abschnitteAnpassen(); return;
      }
      if (r === 'start') { Produktwelten.lernen('heute'); return; }
      reiterWechseln(r);
    });
    an('btn-import', (e: any) => {
      const r = e.currentTarget.getBoundingClientRect();
      /* Am Telefon wird nur angeboten, was dort wirklich geht: Ordner wählen
         können Telefon-Browser nicht, und eine Datei auf die Seite ziehen
         kann auf einem Touchscreen niemand. Ein toter Knopf ist schlimmer
         als ein fehlender. */
      const telefon = window.matchMedia('(max-width: 760px)').matches;
      const m = UI.menu(
        '<div class="grp">Was soll hereinkommen?</div>' +
        '<button data-i="dateien"><span class="mi">📄</span>Dateien wählen' +
          '<span class="sub">Markdown, CSV, HTML, Word, PowerPoint, Excel, EPUB, PDF</span></button>' +
        (telefon ? '' :
          '<button data-i="ordner"><span class="mi">📁</span>Ganzen Ordner einlesen</button>') +
        '<hr><button data-i="werkzeug"><span class="mi">⭱</span>Aus einem anderen Werkzeug' +
          '<span class="sub">Trello, Evernote, Obsidian, Notion-Export, Asana</span></button>' +
        '<hr><div class="grp" style="font-weight:400">' +
          (telefon ? 'Die Auswahl öffnet die Dateien-App des Telefons.'
                   : 'Oder einfach eine Datei auf die Seite ziehen.') + '</div>',
        r.right + 6, r.top);
      m.addEventListener('click', ev => {
        const b = elVon(ev)?.closest<HTMLElement>('button[data-i]');
        if (!b) return;
        m.remove();
        if (b.dataset.i === 'dateien')      Werkzeuge.dateienLesen();
        else if (b.dataset.i === 'werkzeug') Austausch.dialog();
        else Werkzeuge.ordnerLesen();
      });
    });
    /* `btn-hilfe` ebenfalls — siehe E167. */
    an('btn-back', zurueck);
    an('btn-fwd', vorwaerts);
    /* DER ANFANGSZUSTAND IST DER WICHTIGE (F15): nach einem Neuladen ist der
       Verlauf leer, und genau da stand der Knopf bisher aktiv da. */
    navKnoepfeStellen();
    an('btn-komm', () => seiteId && Kommentare.panel(seiteId));
    an('btn-teilen', (e: any) => {
      const p = Store.getBlock(seiteId);
      if (p) Werkzeuge.teilenMenue(e.currentTarget, p);
    });
    an('btn-verlauf', () => seiteId && Werkzeuge.versionen(Store.getBlock(seiteId)));
    an('btn-link', () => {
      if (!seiteId) return;
      Ablage.kopiereJetzt(location.origin + location.pathname + '#' + seiteId, 'Link zur Seite kopiert');
    });
    an('btn-lock', () => {
      if (!seiteId) return;
      const p = Store.getBlock(seiteId);
      Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
      zeichneSeite(); zeichneCrumbs();
      UI.toast(p.gesperrt ? 'Seite ist gesperrt' : 'Bearbeiten wieder erlaubt');
    });
    an('btn-auto', (e: any) => {
      if (!seiteId) return;
      const dbs = Store.childrenOf(seiteId).filter((b: any) => b.type === 'database');
      if (!dbs.length) { UI.toast('Auf dieser Seite gibt es keine Datenbank'); return; }
      const oeffneAuto = (b: any) => {
        const c = Store.getCollection(b.collectionId);
        const v = Store.getView(b.aktiveView || (c && c.viewIds[0]));
        if (c) Datenbank.automationenMenue(e.currentTarget, c, v, b);
      };
      if (dbs.length === 1) { oeffneAuto(dbs[0]); return; }
      const r = e.currentTarget.getBoundingClientRect();
      const m = UI.menu('<div class="grp">Welche Datenbank?</div>' +
        dbs.map((b: any, i: any) => {
          const c = Store.getCollection(b.collectionId);
          return `<button data-i="${i}"><span class="mi">⚡</span>${esc(c ? c.name : 'Datenbank')}</button>`;
        }).join(''), r.left - 140, r.bottom + 6);
      m.addEventListener('click', ev => {
        const b2 = elVon(ev)?.closest<HTMLElement>('button[data-i]');
        if (!b2) return;
        m.remove();
        oeffneAuto(dbs[Number(b2.dataset.i)]);
      });
    });
    an('btn-fav', () => {
      if (!seiteId) return;
      const p = Store.getBlock(seiteId);
      Store.updateBlock(p.id, { favorite: !p.favorite });
      zeichneBaum(); zeichneCrumbs();
    });
    /* Glocke und Wolke-Punkt hängen NICHT hier (E251, zweiter Anlauf):
       die Kopfzeile gehört der Seite, die Menüleiste der App — dort
       zeichnet menueband.ts beide, und der Wolke-Dialog steht unter
       „Mehr → Wolke". */
    an('btn-page-menu', (e: any) => {
      const p = Store.getBlock(seiteId);
      if (p) seitenMenue(e.currentTarget, p);
    });

    /* Seitenleiste in der Breite ziehen — wie in Notion */
    const griff = document.createElement('div');
    griff.id = 'side-griff';
    document.getElementById('sidebar')?.appendChild(griff);
    const gespeicherteBreite = Store.getMeta('seitenleiste', 0);
    if (gespeicherteBreite) setzeBreite(gespeicherteBreite);
    griff.addEventListener('pointerdown', e => {
      e.preventDefault();
      const zug = (ev: any) => setzeBreite(Math.max(180, Math.min(460, ev.clientX)));
      const stop = () => {
        removeEventListener('pointermove', zug);
        removeEventListener('pointerup', stop);
        const leiste = document.getElementById('sidebar');
        if (leiste) Store.setMeta('seitenleiste', leiste.getBoundingClientRect().width);
      };
      addEventListener('pointermove', zug);
      addEventListener('pointerup', stop);
    });

    /* Beim Verlassen noch schnell alles sichern */
    addEventListener('beforeunload', () => { Store.flush().catch(() => {}); });

    /* GANZ ZUM SCHLUSS die Startansicht — siehe die Begründung oben. Alle
       Module stehen jetzt, und wer danach eine Seite öffnet, kommt später
       und bleibt sichtbar. */
    if (startAnsichtZeigen) {
      /* DER FANG SCHWEIGT NICHT MEHR (E236). Hier stand ein leeres
         `catch { }` mit dem Trost „ohne Startbildschirm bleibt die zuletzt
         geöffnete Seite". Das stimmt — und man erfährt nie, dass es
         schiefging. Beim Umbau auf „Dokument, sonst Regal" ging genau
         hier etwas schief, und die Suche danach kostete eine Stunde, weil
         nichts davon irgendwo stand.
         Der Nutzer bekommt weiterhin keine Meldung: er hat eine Seite,
         alles ist da, und ein Fehlerbanner für einen Startbildschirm wäre
         Lärm. Aber die Konsole sagt es, und ein Prüflauf kann es lesen. */
      try { startAnsichtZeigen(); }
      catch (fehler) {
        console.error('Die Startansicht konnte nicht geöffnet werden:', fehler);
      }
    }
  };

  /* --- Beispielinhalt beim ersten Start ----------------------------------- */
  const beispielAnlegen = () => {
    const p = Store.addPage(null, { text: 'Willkommen', icon: '👋' });
    const b = (typ: string, text: string, extra?: any) => Store.addBlock(p.id, typ, Object.assign({ text }, extra || {}));

    b('h1', 'Willkommen in Redion');
    /* E270: „kein Konto, kein Server, keine Cloud" stimmte, bis der Server
       gebaut war. Der erste Satz, den ein neuer Nutzer liest, darf nicht
       der erste sein, der nicht mehr gilt. Local-first bleibt die Wahrheit
       — nur ist es jetzt eine Wahl und keine Grenze. */
    b('text', 'Alles hier liegt **lokal** in deinem Browser — ohne Konto, ohne Server. ' +
              'Ein eigener Server für den Abgleich zwischen deinen Geräten ist ' +
              'möglich und freiwillig (Mehr → Wolke).');
    b('callout', 'Tippe irgendwo `/` — dann öffnet sich das Blockmenü mit allen Bausteinen.', { icon: '💡' });

    b('h2', 'Was du sofort ausprobieren kannst');
    b('bullet', 'Strg + P sucht, Strg + Shift + K öffnet alle Befehle');
    b('bullet', 'Schreibe [[Willkommen]] — so verlinkst du Seiten');
    b('bullet', 'Schreibe #ideen — so setzt du ein Schlagwort');
    b('bullet', 'Tippe @ für Seite, Datum oder Person, : für Emoji');
    b('bullet', 'Markiere diesen Text — dann erscheint die Werkzeugleiste');
    b('todo', 'Diese Aufgabe abhaken');
    b('flashcard', 'Wo liegen meine Daten? :: Lokal im Browser, in IndexedDB.');

    b('h2', 'Eine Datenbank');
    b('text', 'Darunter liegt eine echte Datenbank mit Ansichten, Filtern, Sortierung und Formeln.');

    const schema = {
      title: { name: 'Aufgabe', type: 'title' },
      st: { name: 'Status', type: 'status', options: [
        { name: 'Offen',     color: 'gray'   },
        { name: 'In Arbeit', color: 'blue'   },
        { name: 'Erledigt',  color: 'green'  }
      ]},
      pr: { name: 'Priorität', type: 'select', options: [
        { name: 'Niedrig', color: 'gray'   },
        { name: 'Mittel',  color: 'yellow' },
        { name: 'Hoch',    color: 'red'    }
      ]},
      dt: { name: 'Fällig', type: 'date' },
      fx: { name: 'Tage übrig', type: 'formula',
            formula: 'if(empty(prop("Fällig")), "—", format(dateBetween(prop("Fällig"), now(), "days")) + " Tage")' }
    };
    const { collectionId } = Store.addDatabase(p.id, 'Meine Aufgaben', schema, 'table');

    const inTagen = (n: number) => {
      const d = new Date(); d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    };
    Store.addRow(collectionId, { title: 'App ausprobieren', st: 'In Arbeit', pr: 'Hoch',   dt: inTagen(0) });
    Store.addRow(collectionId, { title: 'Eigene Seite anlegen', st: 'Offen',  pr: 'Mittel', dt: inTagen(2) });
    Store.addRow(collectionId, { title: 'Ollama installieren',  st: 'Offen',  pr: 'Niedrig',dt: inTagen(7) });
    Store.rowsOf(collectionId).forEach(r => {
      if (r.props && r.props.title) { r.text = r.props.title; Store.updateBlock(r.id, { text: r.text }); }
    });

    b('h2', 'Deine Daten gehören dir');
    b('text', 'Unter Einstellungen kannst du jederzeit eine Sicherung speichern und wieder einlesen.');
  };

  return {
    start, oeffne, zeigeSonder, zeichneSeite, zeichneBaum, zeichneCrumbs, aktuelleSeite, setzeSeite,
    zeigeBlock, blockAusHash,
    kiPanel, suche, seitenSuche, theme, einstellungen, papierkorb, neueSeite,
    /* E283 / L85: die zwei Griffe, die der Entwurf verlangte und die es
       vorher nur als verstreuten Code gab. `vollbildGeht` gehört dazu —
       ohne die Frage stünde im Menüband ein Knopf, der auf dem iPhone
       nichts tut (§47). */
    vollbild, vollbildAn, vollbildGeht, volleBreite,
    markdownExport, markdownVonSeite, woerterZaehlen, dupliziereSeite, seitenMenue, coverWaehlen,
    kuerzlich, kommendeTermine,
    /* Wo man gerade ist — für die Kontextkante (E272). */
    schauplatz,
    ABSCHNITTE, abschnittAn, abschnittSchalten, abschnitteAnpassen, reiterWechseln,
    sicherungSpeichern, sicherungPaketBauen, sicherungLaden, zurueck, vorwaerts, arbeitsbereich,
    /* Seit E317 auch einzeln: nur so lässt sich messen, was ein Archiv mit
       Loch macht — der Weg dorthin führt sonst über einen Dateiwähler, und
       den kann kein Prüflauf antippen. */
    anhaengeEinspielen,
    /* HERAUSGEGEBEN SEIT E236. Das Blatt „Neu erstellen" war eine interne
       Funktion hinter dem Stift am Telefon — und damit unerreichbar für den
       „+ Neu"-Knopf im Regal und für alles am Rechner. Es ist derselbe
       Katalog, nur endlich von überall erreichbar (§8). */
    erstellenBlatt,
    /* Seit E265 auch einzeln: die Liste der geladenen Wege und das
       Ausführen genau eines Wegs — für Menüs, die nur eine Auswahl des
       Katalogs zeigen (Notizhefte), ohne die Module dahinter zu kennen. */
    erstellenWege, erstellenWeg
  };
})();

/* Los geht's */
/* Kein Selbststart mehr: gestartet wird ausschliesslich in start.js.
   Wer die Datei einzeln lädt, bekommt eine Schale, die bereitsteht — aber
   nicht von selbst losläuft. Ein Einstiegspunkt, nicht fünf. */
