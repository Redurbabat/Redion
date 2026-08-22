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
  const rueck: any[] = [], vor: any[] = [];
  let navSperre = false;

  const zurueck = () => {
    if (!rueck.length) { UI.toast('Kein Schritt zurück'); return; }
    const id = rueck.pop();
    if (seiteId) vor.push(seiteId);
    navSperre = true; oeffne(id); navSperre = false;
  };
  const vorwaerts = () => {
    if (!vor.length) { UI.toast('Kein Schritt vorwärts'); return; }
    const id = vor.pop();
    if (seiteId) rueck.push(seiteId);
    navSperre = true; oeffne(id); navSperre = false;
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
        const d = new Date(v);
        if (isNaN(d.getTime()) || d < heute || d > grenze) return;
        raus.push({ id: r.id, text: r.text || 'Ohne Titel', d,
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
    `<button data-a="${a}" class="mit-schalter"><span class="mi">${icon}</span>${text}` +
    `<span class="mschalter${an ? ' an' : ''}"><i></i></span></button>`;

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
          '<div style="margin-top:12px"><button data-a="verl" class="prim">Versionsverlauf öffnen</button></div>' +
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
         Titel und ⋯. Alles andere steht hier, sonst wäre es unerreichbar. */
      (UI.amTelefon()
        ? '<button data-a="teilen"><span class="mi">↗</span>Teilen und ausgeben</button>' +
          '<button data-a="verlauf"><span class="mi">🕘</span>Versionsverlauf</button>' +
          '<button data-a="kopf-komm"><span class="mi">💬</span>Kommentare</button>' +
          '<button data-a="auto"><span class="mi">⚡</span>Automationen</button><hr>'
        : '') +
      `<button data-a="fav"><span class="mi">${p.favorite ? '★' : '☆'}</span>` +
      `${p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}</button>` +
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

      /* Schalter bleiben im Menü stehen und kippen an Ort und Stelle */
      if (a === 'klein' || a === 'breit' || a === 'wz-gesperrt' || a === 'pfad') {
        const feld = a === 'klein' ? 'small' : a === 'breit' ? 'wide'
                   : a === 'pfad' ? 'pfad' : 'gesperrt';
        const neu = a === 'pfad' ? !(p.pfad !== false) : !p[feld];
        Store.updateBlock(p.id, { [feld]: neu });
        p[feld] = neu;
        b.querySelector('.mschalter')?.classList.toggle('an', neu);
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

      if (Werkzeuge.seitenMenueAktion(a, p)) return;

      /* Die vier, die auf dem Telefon aus der Kopfzeile hierher gewandert sind */
      if (a === 'teilen')    { Werkzeuge.teilenMenue(anker, p); return; }
      if (a === 'verlauf')   { Werkzeuge.versionen(p); return; }
      if (a === 'kopf-komm') { document.getElementById('btn-komm')?.click(); return; }
      if (a === 'auto')      { document.getElementById('btn-auto')?.click(); return; }
      if (a === 'fav')   { Store.updateBlock(p.id, { favorite: !p.favorite }); zeichneBaum(); }
      if (a === 'klein') { Store.updateBlock(p.id, { small: !p.small }); zeichneSeite(); }
      if (a === 'breit') { Store.updateBlock(p.id, { wide: !p.wide }); zeichneSeite(); }
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
  const zeigeSonder = (titel: string, zeichner: any) => {
    sonder = { titel, zeichner };
    seiteId = null;
    location.hash = '#' + titel.toLowerCase().replace(/[^a-z]+/g, '-');
    zeichneBaum();
    zeichneSeite();
    const scr = document.getElementById('scroll');
    if (scr) scr.scrollTop = 0;
  };

  const oeffne = (id?: string | null) => {
    sonder = null;
    if (seiteId && seiteId !== id && !navSperre) { rueck.push(seiteId); vor.length = 0; }
    if (seiteId && seiteId !== id) Werkzeuge.versionAutomatisch(seiteId);
    seiteId = id;
    if (id) {
      const p = Store.getBlock(id);
      if (p) Store.updateBlock(id, { aufrufe: (p.aufrufe || 0) + 1, zuletztGeoeffnet: Store.now() });
    }
    Store.setMeta('letzte', id);
    if (id) kuerzlichMerken(id);
    location.hash = id || '';
    zeichneBaum();
    zeichneSeite();
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
  const zeichneSeite = (fokus: string | null = null, wo = 'anfang') => {
    const wrap = document.getElementById('page');
    if (!wrap) return;

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
      wrap.className = 'wide document-page';
      DocumentMode.render(wrap, p);
    } else {
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
  const suche = () => {
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
            'mit <code>Strg ⇧ P</code>.</span></div>'
          : verlaufBlock();
        verlaufBinden();
        return;
      }
      res.innerHTML = verlaufBlock() + treffer.map((t, k) =>
        `<button data-i="${k}" ${k === i ? 'class="on"' : ''}>` +
          `<span>${t.page.icon || '📄'}</span>` +
          `<span style="flex:1"><span>${esc(t.page.text || 'Ohne Titel')}</span>` +
          (t.pfad ? `<span class="snip pfad">${esc(t.pfad)}</span>` : '') +
          (t.treffer === 'Inhalt' ? `<span class="snip">${esc(t.snippet)}</span>` : '') +
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
      const uiFilters = readUiFilters();
      const hasUiFilter = uiFilters.scope !== 'all' || uiFilters.documentType !== 'all' ||
        uiFilters.changed !== 'all' || !!uiFilters.location;
      if (!roh.trim() && !hasUiFilter) { zuletzt(); return; }

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
    zeichne();
    inp.focus();
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
  const sicherungGemerkt = (art: 'json' | 'redion'): void => {
    Store.setMeta('sicherung:zuletzt', new Date().toISOString());
    Store.setMeta('sicherung:art', art);
  };

  /**
   * Gibt zurück, ob die Sicherung wirklich zustande kam.
   *
   * Der `catch` unten fängt den Fehler und kehrt regulär zurück — richtig
   * für die Aufrufer, die nur einen Knopf drücken. Aber der Sichern-Knopf
   * in den Datenbank-Ansichten zeigte danach „✓ Gesichert", weil `.then`
   * eine reguläre Rückkehr nicht von einem Erfolg unterscheiden kann.
   * Deshalb: `true` heisst gesichert, `false` heisst nicht.
   */
  const sicherungSpeichern = async (): Promise<boolean> => {
    /* Erst holen, was nicht im Zwischenspeicher liegt — der Versionsverlauf.
       Er fehlte in jeder Sicherung, die diese App je geschrieben hat. */
    const stand = await Store.exportVorbereiten();
    const heute = new Date().toISOString().slice(0, 10);

    if (!stand.dateien) {
      const blob = new Blob([Store.exportAll()], { type: 'application/json' });
      const l = document.createElement('a');
      l.href = URL.createObjectURL(blob);
      l.download = 'redion-sicherung-' + heute + '.json';
      l.click();
      sicherungGemerkt('json');
      UI.toast('Sicherung gespeichert (' + stand.versionen + ' Fassungen im Verlauf)');
      return true;
    }

    UI.toast(stand.dateien + ' Anhänge kommen mit — das dauert einen Moment');
    try {
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
        (name: string, anteil: any) => { if (anteil >= 1) UI.toast('Geprüft: ' + name.replace('dateien/', '') + ' — wird verpackt'); });
      const l = document.createElement('a');
      l.href = URL.createObjectURL(blob);
      l.download = 'redion-sicherung-' + heute + '.redion';
      l.click();
      sicherungGemerkt('redion');
      UI.toast('Sicherung gespeichert — mit ' + (eintraege.length - 2) + ' Anhang/Anhängen');
      return true;
    } catch (err) {
      /* Kein stiller Fehlschlag. Wer glaubt, gesichert zu haben, und es nicht
         hat, ist schlechter dran als jemand, der es weiss. */
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
  const anhaengeEinspielen = async (zip: any, art: string) => {
    const roh = await zip.text('dateien.json');
    if (!roh) return 0;
    let karte;
    try { karte = JSON.parse(roh); } catch { return 0; }

    const STUECK = (typeof KONSTANTEN !== 'undefined') ? KONSTANTEN.STUECK : 1024 * 1024;
    const nachName: Record<string, string> = {};
    Object.entries<any>(karte.zuordnung || {}).forEach(([name, id]) => { nachName[id] = name; });

    let wieViele = 0;
    for (const satz of (karte.saetze || [])) {
      const name = nachName[satz.id];
      if (!name) continue;
      const roh2 = await zip.alsBlob(name);
      if (!roh2) continue;
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
      await Store.dateiPut(Object.assign({}, satz, {
        teile, angekommen: teile, zustand: 'fertig', groesse: blob.size }));
      wieViele++;
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
    return wieViele;
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
      const wieViele = Object.keys(vorschau.blocks || {}).length;
      const jetzt = Object.keys(Store.cache.blocks || {}).length;

      const wahl = await Dialog.wahl({
        titel: 'Sicherung einspielen',
        text: 'Die Datei enthält ' + wieViele + ' Blöcke' +
              (Array.isArray(vorschau.versions) ? ' und ' + vorschau.versions.length +
                ' Fassungen aus dem Verlauf' : '') + '. ' +
              'In diesem Bestand liegen gerade ' + jetzt + ' Blöcke.' +
              (vorschau.hinweis ? '\n\n' + vorschau.hinweis : ''),
        knoepfe: [
          { id: 'ersetzen', text: 'Ersetzen',
            hinweis: 'Der Bestand sieht danach aus wie die Sicherung. Was ' +
                     'nicht darin steht, wird gelöscht.' },
          { id: 'zusammenfuehren', text: 'Dazulegen',
            hinweis: 'Nichts wird gelöscht. Bei gleicher Kennung gewinnt die ' +
                     'Sicherung.' },
          { id: '', text: 'Abbrechen' }
        ]
      });
      if (!wahl) return;

      try {
        const erg = await Store.importAll(text, wahl);
        /* Die Anhänge NACH den Blöcken. Andersherum stünden die Dateien in
           der Ablage und würden beim „Ersetzen" gleich wieder mit gelöscht —
           `ersetzen` räumt weg, was nicht in der Sicherung steht. */
        let anhaenge = 0;
        if (zip) anhaenge = await anhaengeEinspielen(zip, wahl);
        danach && danach();
        zeichneBaum(); zeichneSeite();
        UI.toast('Sicherung geladen — ' + erg.bloecke + ' Blöcke' +
                 (erg.versionen ? ', ' + erg.versionen + ' Fassungen' : '') +
                 (anhaenge ? ', ' + anhaenge + ' Anhang/Anhänge' : ''));
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
  const ERSTELLEN: [string, string, string, string][] = [
    ['seite',    '📄', 'Neue Seite',       'Leere Seite anlegen'],
    ['memo',     '⚡', 'Schnellnotiz',     'Gedanken sofort festhalten'],
    ['db',       '▦', 'Neue Datenbank',   'Zeilen sind eigene Seiten'],
    ['tabelle',  '📊', 'Neue Tabelle',     'Rechnen wie in Excel'],
    ['aufgabe',  '☑', 'Aufgabe',          'Mit Datum planen'],
    ['karte',    '📚', 'Karteikarte',      'Später wiederholen'],
    ['scan',     '📷', 'Dokument scannen', 'Kamera, Foto oder PDF in den Eingang'],
    ['datei',    '📎', 'Datei hochladen',  'Bleibt auf diesem Gerät'],
    ['vorlage',  '🧩', 'Vorlage verwenden', 'Mit fertiger Struktur starten']
  ];

  const erstellenBlatt = (): void => {
    const html = '<div class="menu-liste">' +
      ERSTELLEN.map(([was, z, name, sub]) =>
        `<button data-neu="${was}"><span class="mi">${z}</span>` +
        `<span class="ne-txt"><b>${name}</b><i>${sub}</i></span>` +
        '<span class="ne-pfeil">›</span></button>').join('') +
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
      setTimeout(() => {
        if (was === 'seite')        neueSeite();
        else if (was === 'memo')    Werkzeuge.schnellnotizen();
        else if (was === 'datei')   Werkzeuge.dateienLesen();
        else if (was === 'scan')    Recognition.scan();
        else if (was === 'vorlage') Werkzeuge.vorlagen();
        else if (was === 'karte')   Werkzeuge.lernen();
        else {
          /* Datenbank, Tabelle und Aufgabe entstehen IN einer Seite — es
             gibt sie nicht ohne eine. Also erst die Seite, dann der Block
             darin, und der Cursor steht schon an der richtigen Stelle. */
          const p = neueSeite();
          setTimeout(() => {
            if (was === 'db')           Store.addDatabase(p.id, 'Ohne Namen');
            else if (was === 'tabelle') Store.addBlock(p.id, 'tabelle', {});
            else if (was === 'aufgabe') Store.addBlock(p.id, 'todo', { text: '' });
            zeichneSeite();
          }, 80);
        }
      }, 60);
    });
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
    griff.addEventListener('dblclick', () => {
      setze(260);
      Store.setMeta('seiteBreite', 260);
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
      if (k === '\\') { e.preventDefault(); document.getElementById('sidebar')?.classList.toggle('collapsed'); return; }
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

    /* Esc schliesst Menüs und Overlays */
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const m = document.querySelector('.menu');
      const o = document.querySelector('.overlay');
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
    if (aktuelleSeite() !== seite.id) oeffne(seite.id);
    else if (ansichtGeaendert) zeichneSeite();
    rolleZu(blockId);
    return true;
  };

  /** `#block=<kennung>` aus einer Adresse holen, sonst leer. */
  const blockAusHash = (roh: string): string => {
    const m = String(roh || '').replace(/^#/, '').match(/^block=(.+)$/);
    return m && m[1] ? decodeURIComponent(m[1]) : '';
  };

  const start = async () => {
    /* Die Seitenleiste bekommt, was ihr nicht gehört — hier und nur hier.
       Das muss vor allem anderen stehen: sobald irgendetwas zeichnet, ruft
       es `zeichneBaum`, und das läuft dann schon nach drüben. */
    Seitenleiste.binde({
      oeffne, aktuelleSeite, kuerzlich, kommendeTermine, seitenMenue, suche, papierkorb
    });
    Kopfleiste.binde({
      zeichneSeite, zeichneBaum, kiPanel, oeffne, aktuelleSeite,
      /* Ein Leser, keine Weiterreichung: die Sonderansicht ist ein Zustand
         der Schale, und die Pfadleiste muss den jeweils aktuellen sehen. */
      sonder: () => sonder
    });
    Inhaltsflaeche.binde({ aktuelleSeite });

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
    } catch (err) {
      UI.banner('Die App konnte nicht starten: ' +
        (err instanceof Error ? err.message : String(err)), 'fehler');
      throw err;
    }
  };

  const starteWirklich = async () => {
    await Store.load();

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
    const zielBlock = blockAusHash(location.hash);
    const ausHash = zielBlock
      ? ((typeof Links !== 'undefined' && Links.seiteVon)
          ? (Links.seiteVon(zielBlock) || {}).id || '' : '')
      : location.hash.slice(1).split(':')[0];
    const startSeite = (ausHash && Store.getBlock(ausHash)) ? ausHash
                : (Store.getMeta('letzte') && Store.getBlock(Store.getMeta('letzte')))
                  ? Store.getMeta('letzte')
                  : (Store.rootPages()[0] || {}).id;

    zeichneBaum();
    oeffne(startSeite);

    /* Kam der Start über einen Blocklink, steht jetzt die richtige Seite —
       aber oben. Also noch hinrollen. */
    if (zielBlock) zeigeBlock(zielBlock);

    /* Und für jeden Blocklink, der SPÄTER angeklickt wird. `oeffne` schreibt
       die Seitenkennung selbst in die Adresse; solche Änderungen laufen hier
       durch, weil sie nicht mit `block=` beginnen. */
    addEventListener('hashchange', () => {
      const b = blockAusHash(location.hash);
      if (b) zeigeBlock(b);
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
    if (window.matchMedia('(max-width: 760px)').matches && !ausHash) {
      try { Ansichten.start(); } catch { /* ohne Startbildschirm bleibt die Seite */ }
    }

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
    const wunsch = Store.getMeta('startAnsicht', 'letzte');
    if (!location.hash) {
      if (wunsch === 'start') setTimeout(() => Ansichten.start(), 60);
      if (wunsch === 'posteingang') setTimeout(() => Ansichten.posteingang(), 60);
      if (wunsch === 'journal') setTimeout(() => Werkzeuge.journal(), 60);
      if (wunsch === 'seite' && Store.getMeta('startSeite')) {
        const z = Store.getBlock(Store.getMeta('startSeite'));
        if (z) oeffne(z.id);
      }
    }

    /* Name und Symbol des Arbeitsbereichs */
    const wsBtn = document.getElementById('btn-settings');
    const wsIcon = wsBtn?.querySelector('.ws-icon');
    const wsName = wsBtn?.querySelectorAll('span')[1];
    if (wsIcon) wsIcon.textContent = Store.getMeta('arbeitsIcon', 'N');
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
    Blocks.auswahlEinklinken();
    Rundgang.vielleichtStarten();

    /* Seitenleiste und Kopfzeile */
    const an = (id: any, fn: any) => document.getElementById(id)?.addEventListener('click', fn);
    an('btn-search', suche);
    an('btn-cmd', () => Werkzeuge.palette());
    an('btn-home', () => Ansichten.start());
    an('btn-inbox', () => Ansichten.posteingang());
    an('btn-ai', () => kiPanel());
    an('btn-trash', papierkorb);
    an('btn-settings', einstellungen);
    an('btn-theme', () => theme());
    an('btn-side', () => document.getElementById('sidebar')?.classList.toggle('collapsed'));

    /* Breite der Seitenleiste ziehen — Notion kann das, aber merkt sie sich
       nicht je Gerät; hier bleibt sie gespeichert. */
    seitenleisteBreite();
    an('btn-new', () => neueSeite());
    an('btn-new-bottom', () => neueSeite());
    an('btn-neuer-chat', () => { Seitenleiste.reiter('chat'); zeichneBaum(); KI.neuerChat(); });

    /* Leiste am unteren Rand — nur auf dem Telefon sichtbar */
    /* --- Die untere Leiste am Telefon --------------------------------
     * Sie zeigt jetzt dieselben vier Bereiche wie die Reiterleiste am PC:
     * Start, Chats, Besprechungen, Posteingang. Bisher kam man an drei
     * davon nur über die Schublade — man musste also wissen, dass es sie
     * gibt. Der Kreis in der Mitte bleibt die KI.
     * ---------------------------------------------------------------- */
    an('hl-start', () => { PWA.schubladeZu && PWA.schubladeZu();
                           Seitenleiste.reiter('start'); zeichneBaum(); Ansichten.start(); handyLeiste(); });
    /* „Seiten" statt „Chats" (E38): Redion ist keine Chat-App. Die KI bleibt
       unten in der Leiste erreichbar und im R-Blatt, aber der Platz oben
       gehört dem, was man täglich sucht — den eigenen Seiten. */
    an('hl-seiten', () => { PWA.schubladeZu && PWA.schubladeZu();
                            /* Erst den Reiter setzen, dann zeichnen: `handyLeiste`
                               liest ihn, und ohne ihn bliebe die Pille auf „Start"
                               stehen, während daneben schon die Seiten stünden. */
                            Seitenleiste.reiter('seiten');
                            Ansichten.seiten(); handyLeiste(); });
    /* AM TELEFON AUF DIE BÜHNE, am Rechner in die Seitenleiste. Vorher zog
       dieser Reiter auch am Telefon die Schublade auf — also die
       Seitenleiste des Rechners auf 390 px geschoben, samt Baum und
       33-px-Zeilen. Genau davon ist das R-Blatt weggekommen (E38); ein
       Reiter, der sie wieder hereinholt, macht die Hälfte davon rückgängig. */
    an('hl-bespr', () => { PWA.schubladeZu && PWA.schubladeZu();
                           Seitenleiste.reiter('bespr');
                           if (window.matchMedia('(max-width: 760px)').matches) {
                             Ansichten.termine(); handyLeiste(); return;
                           }
                           zeichneBaum(); handyLeiste();
                           if (PWA.schubladeAuf) PWA.schubladeAuf(); });
    /* Die KI sitzt jetzt unten in der Mitte, nicht mehr in der Reiterleiste. */
    an('hu-ki', () => kiPanel(true));
    an('hu-suche', () => suche());
    /* Am Telefon das Blatt (Vorgabe §18), am Rechner der Direktweg: dort
       gibt es Strg+N, die Seitenleiste und die Befehlspalette. */
    an('hu-neu',   () => { if (window.matchMedia('(max-width: 760px)').matches)
                             erstellenBlatt(); else neueSeite(); });
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
    an('hl-konto', () => {
      if (!window.matchMedia('(max-width: 760px)').matches) {
        if (PWA.schubladeAuf) PWA.schubladeAuf();
        return;
      }
      PWA.schubladeZu && PWA.schubladeZu();
      rMenue();
    });
    /* „Mehr" statt „Eingang" (E42 §6): Werkzeuge, Hilfe, Sicherung, Import,
       Papierkorb und Einstellungen brauchen einen Platz oben — ein
       Posteingang, der meistens leer ist, nicht. Er wohnt jetzt als Zeile
       in Mehr und ist damit keinen Griff weiter weg als vorher.
       `reiter('mehr')`, nicht `'start'`: die Pille oben liest ihn. */
    an('hl-mehr', () => { PWA.schubladeZu && PWA.schubladeZu();
                          Seitenleiste.reiter('mehr'); Ansichten.mehr(); handyLeiste(); });
    an('btn-suche-handy', () => suche());
    an('btn-neu-handy',   () => neueSeite());
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
          '<span class="sub">Markdown, CSV, TSV, HTML, Excel, Word, EPUB</span></button>' +
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
    an('btn-hilfe', () => Werkzeuge.tastenkuerzel());
    an('btn-back', zurueck);
    an('btn-fwd', vorwaerts);
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
  };

  /* --- Beispielinhalt beim ersten Start ----------------------------------- */
  const beispielAnlegen = () => {
    const p = Store.addPage(null, { text: 'Willkommen', icon: '👋' });
    const b = (typ: string, text: string, extra?: any) => Store.addBlock(p.id, typ, Object.assign({ text }, extra || {}));

    b('h1', 'Willkommen in Redion');
    b('text', 'Alles hier liegt **lokal** in deinem Browser. Kein Konto, kein Server, keine Cloud.');
    b('callout', 'Tippe irgendwo `/` — dann öffnet sich das Blockmenü mit allen Bausteinen.', { icon: '💡' });

    b('h2', 'Was du sofort ausprobieren kannst');
    b('bullet', 'Strg + P sucht, Strg + Shift + P öffnet alle Befehle');
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
    markdownExport, markdownVonSeite, woerterZaehlen, dupliziereSeite, seitenMenue, coverWaehlen,
    kuerzlich, kommendeTermine,
    ABSCHNITTE, abschnittAn, abschnittSchalten, abschnitteAnpassen, reiterWechseln,
    sicherungSpeichern, sicherungLaden, zurueck, vorwaerts
  };
})();

/* Los geht's */
/* Kein Selbststart mehr: gestartet wird ausschliesslich in start.js.
   Wer die Datei einzeln lädt, bekommt eine Schale, die bereitsteht — aber
   nicht von selbst losläuft. Ein Einstiegspunkt, nicht fünf. */
