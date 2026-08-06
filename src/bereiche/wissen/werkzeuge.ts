/* ============================================================================
 * tools.js — Die Werkzeuge
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/werkzeuge.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/werkzeuge.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Hier steckt alles, was die anderen Notiz-Programme gross gemacht hat —
 * an einem Ort, in einer Oberfläche:
 *
 *   Befehlspalette      SilverBullet      Strg + Shift + K
 *   Tagesjournal        Logseq, Foam      Seitenleiste → Journal
 *   Schnellnotizen      Memos, Blinko     Seitenleiste → Schnellnotizen
 *   Vorlagen            Outline, Trilium  Seitenleiste → Vorlagen
 *   Karteikarten        SiYuan            Seitenleiste → Lernen
 *   Versionsverlauf     Standard Notes    Seitenmenü → Versionen
 *   Seite sperren       Notesnook         Seitenmenü → Sperren
 *   Fokus-Modus         MarkText, Zettlr  Seitenmenü → Fokus
 *   Präsentation        HedgeDoc          Seitenmenü → Präsentation
 *   Quelltext-Modus     MarkText, TUI     Seitenmenü → Markdown
 *   Schreibstatistik    Zettlr            Seitenmenü → Statistik
 *   Erinnerungen        Notesnook         Seitenmenü → Erinnerung
 *   Ordner-Abgleich     Joplin, Zettlr    Einstellungen → Ordner
 *   Eine HTML-Datei     TiddlyWiki        Einstellungen → Als eine Datei
 * ==========================================================================*/

const Werkzeuge = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  /* SEIT A4: was hier gerechnet wird, steht nebenan in dienst.js — die
     unscharfe Suche, das Wiederholungsverfahren, Markdown hin und zurück,
     die Zahlen der Statistik. Die Namen werden hereingeholt statt
     umgeschrieben, damit keine der Aufrufstellen darunter angefasst werden
     muss. Dieselbe Entscheidung wie bei `Datenbank` und bei `UI`. */
  const { esc, heute, WOCHENTAG, datumLang, unscharf, zeitKurz, planen,
          alsMarkdown, ausMarkdown, statistikZahlen, sauber, istUnter } = WissenDienst;


  /** Legt eine Systemseite an oder findet sie wieder (Journal, Vorlagen …). */
  const systemSeite = (schluessel: string, titel: string, icon: any) => {
    const id = Store.getMeta('sys:' + schluessel);
    const da = id && Store.getBlock(id);
    if (da && da.alive) return da;
    const p = Store.addPage(null, { text: titel, icon, system: schluessel });
    Store.setMeta('sys:' + schluessel, p.id);
    return p;
  };

  /* ========================================================================
   * 1. BEFEHLSPALETTE   (SilverBullet)
   * ------------------------------------------------------------------------
   * Ein Fenster, das jeden Befehl der App kennt. Strg + Shift + P.
   * ======================================================================*/
  const befehle = () => {
    const s = App.aktuelleSeite();
    const p = s ? Store.getBlock(s) : null;
    const b: any[] = [];
    const c = (gruppe: any, name: string, kurz: any, fn: any) => b.push({ gruppe, name, kurz, fn });

    c('Navigation', 'Suchen', 'Strg P', () => App.suche());
    c('Navigation', 'Neue Seite', 'Strg N', () => App.neueSeite());
    c('Navigation', 'Startseite', '', () => Ansichten.start());
    c('Navigation', 'Posteingang', '', () => Ansichten.posteingang());
    c('Navigation', 'Tagesjournal öffnen', 'Strg Shift J', () => journal());
    c('Navigation', 'Schnellnotizen', 'Strg Shift M', () => schnellnotizen());
    c('Navigation', 'Graph aller Seiten', 'Strg Shift G', () => Links.graph());
    c('Navigation', 'Schlagwörter', 'Strg Shift T', () => Links.tagRegister());
    c('Navigation', 'Vorlagen', '', () => vorlagen());
    c('Navigation', 'Vorlagengalerie', '', () => Galerie.oeffne());
    c('Navigation', 'Karteikarten lernen', '', () => lernen());
    c('Navigation', 'Papierkorb', '', () => App.papierkorb());
    c('Planen', 'Tagesplan', '', () => Plan.tagesplan());
    c('Planen', 'Wochenrückblick', '', () => Plan.wochenrueckblick());
    c('Planen', 'Zurückgestelltes ansehen', '', () => Plan.uebersicht());
    c('Navigation', 'Umsetzungsstand aller 16 Teile', '', () => Status.seiteAnlegen());
    c('Navigation', 'Zurück', 'Strg [', () => App.zurueck());
    c('Navigation', 'Vorwärts', 'Strg ]', () => App.vorwaerts());

    if (p) {
      c('Seite', 'Seite umbenennen', '', () => {
        const n = prompt('Neuer Titel', p.text); if (n !== null) { Store.updateBlock(p.id, { text: n }); App.zeichneBaum(); App.zeichneSeite(); }
      });
      c('Seite', 'Symbol ändern', '', () => document.querySelector<HTMLElement>('.pg-icon')?.click());
      c('Seite', p.favorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen', '',
        () => { Store.updateBlock(p.id, { favorite: !p.favorite }); App.zeichneBaum(); });
      c('Seite', 'Duplizieren', '', () => { App.dupliziereSeite(p.id, p.parentId); App.zeichneBaum(); UI.toast('Dupliziert'); });
      c('Seite', 'Verschieben nach …', '', () => verschiebenNach(p));
      c('Seite', 'Als Vorlage speichern', '', () => alsVorlage(p));
      c('Seite', 'Aus Vorlage einfügen', '', () => vorlageEinfuegen(p));
      c('Seite', 'Versionsverlauf', '', () => versionen(p));
      c('Seite', p.locked ? 'Seite entsperren' : 'Seite verschlüsseln', '', () => p.locked ? entsperren(p) : sperren(p));
      c('Seite', p.gesperrt ? 'Bearbeiten wieder erlauben' : 'Bearbeiten sperren', '',
        () => { Store.updateBlock(p.id, { gesperrt: !p.gesperrt }); App.zeichneSeite(); UI.toast(p.gesperrt ? 'Entsperrt' : 'Gesperrt'); });
      c('Seite', 'Fokus-Modus', 'Strg Shift F', () => fokus());
      c('Seite', 'Präsentation starten', '', () => praesentation(p));
      c('Seite', 'Markdown-Quelltext', '', () => quelltext(p));
      c('Seite', 'Schreibstatistik', '', () => statistik(p));
      c('Seite', 'Erinnerung setzen', '', () => erinnerungSetzen(p));
      c('Seite', 'Auf später zurückstellen', '', () =>
        Plan.menue(document.getElementById('btn-page-menu') || document.body, p.id));
      c('Seite', 'Als Markdown speichern', '', () => App.markdownExport(p));
      c('Seite', 'Als HTML speichern', '', () => htmlExport(p));
      c('Seite', 'Drucken / als PDF', 'Strg P', () => drucken(p));
      c('Seite', 'Link kopieren', '', () => { navigator.clipboard?.writeText(location.origin + location.pathname + '#' + p.id); UI.toast('Link kopiert'); });
      c('Seite', 'In den Papierkorb', '', () => { Store.trashBlock(p.id); App.zeichneBaum(); App.oeffne((Store.rootPages()[0]||{}).id); UI.toast('In den Papierkorb'); });
    }

    Blocks.TYPEN.forEach((t: any) => c('Einfügen', t.name, t.kurz || '', () => Blocks.einfuegenAmEnde(t.id)));

    c('Ansicht', 'Hell / Dunkel', 'Strg Shift L', () => App.theme());
    c('Ansicht', 'Seitenleiste ein- oder ausblenden', 'Strg \\', () =>
      document.getElementById('sidebar')?.classList.toggle('collapsed'));
    c('Ansicht', 'KI-Panel', 'Strg J', () => App.kiPanel());
    c('KI', 'Datenbank von der KI bauen lassen', '', async () => {
      const a = await UI.frage('Was soll die Datenbank können?', '');
      if (a) KI.datenbankBauen(a);
    });
    c('KI', 'Seitenaufbau von der KI', '', async () => {
      const a = await UI.frage('Worum geht es auf der Seite?', '');
      if (a) KI.seiteBauen(a);
    });
    c('KI', 'Nachschlagen bei Wikipedia', '', async () => {
      const a = await UI.frage('Was soll ich nachschlagen?', '');
      if (a) KI.nachschlagen(a);
    });
    c('KI', 'Protokoll: was die KI gebaut hat', '', () => KI.protokollZeigen());
    c('Ansicht', 'Alle Toggles öffnen oder schliessen', 'Strg Alt T', () => alleToggles());
    c('Ansicht', 'Tastenkürzel anzeigen', 'Strg /', () => tastenkuerzel());

    c('Daten', 'Einstellungen', 'Strg ,', () => App.einstellungen());
    c('Daten', 'Sicherung speichern', '', () => App.sicherungSpeichern());
    c('Daten', 'Sicherung laden', '', () => App.sicherungLaden());
    c('Daten', 'Alles in einen Ordner schreiben', '', () => ordnerSchreiben());
    c('Daten', 'Ordner mit Markdown einlesen', '', () => ordnerLesen());
    c('Daten', 'Alles als eine HTML-Datei', '', () => einzelDatei());
    c('Daten', 'Aus Trello, Evernote, Obsidian oder Notion einlesen', '', () => Austausch.dialog());
    if (p) c('Daten', 'Diese Seite als Word-Datei (.docx)', '', () => {
      Austausch.alsWord(p).then(() => UI.toast('Word-Datei erzeugt'))
        .catch((e: unknown) => UI.toast('Die Word-Datei kam nicht zustande: ' +
          (e instanceof Error ? e.message : String(e)))); });
    c('Daten', 'Alle Datenbanken als Excel-Mappe (.xlsx)', '', () =>
      /* `allesAlsExcel` gibt `null` zurück, wenn es keine Datenbank gibt —
         dann gibt es auch nichts abzufangen. */
      Austausch.allesAlsExcel()?.catch((e: unknown) =>
        UI.toast('Die Excel-Mappe kam nicht zustande: ' +
          (e instanceof Error ? e.message : String(e)))));
    if (p) c('Seite', 'Fassungen vergleichen', '', () => Vergleich.dialog(p));

    c('Ansicht', 'Aussehen: Farben, Schrift, Tastenkürzel', '', () => Aussehen.dialog());
    c('Ansicht', 'Tempo messen', '', () => Tempo.dialog());
    c('Ansicht', 'Neuer Reiter', 'Strg T', () => Fenster.neuerReiter());
    c('Ansicht', 'Reiter schliessen', 'Strg W', () => Fenster.schliessen(Fenster.aktiv()));
    c('Ansicht', 'Geteilte Ansicht ein oder aus', 'Strg Alt S', () =>
      Fenster.geteilt() ? Fenster.teilenAus() : Fenster.teilen());
    c('Ansicht', 'Datenmodell ansehen', '', () => Schema.ansicht());
    c('Ansicht', 'Kennzahlen-Tafel', '', () => Schema.tafel());
    c('Daten', 'Gesundheitsbericht und Erste Hilfe', '', () => Pflege.ersteHilfe());
    c('Daten', 'Verschlüsselte Sicherung', '', () => Krypto.dialog());
    c('Daten', 'Notion-Wissen öffnen', '', () => Wissen.oeffnen());
    c('Daten', 'Notion-Formate übersetzen', '', () => NotionFormat.dialog());
    c('Daten', 'Schnittstelle /v1/ und Token', '', () => Api.dialog());
    c('Daten', 'Interne Befehle und Transaktionen', '', () => Transaktion.dialog());
    c('Daten', 'Protokoll: was wann geschehen ist', '', () => Protokoll.dialog());
    c('Daten', 'Dateien in Stücken verwalten', '', () => Dateien.dialog());
    c('Daten', 'Wolke: anmelden und abgleichen', '', () => WolkeFenster.dialog());
    c('Daten', 'Zwei Fassungen — offene Konflikte', '', () => Zusammen.dialog());
    if (p) c('Seite', 'Probelauf: was hängt an dieser Seite?', '', () =>
      Probelauf.fenster({ art: 'seiteWeg', id: p.id }));
    c('Daten', 'Vorlagen: gibt es neuere Fassungen?', '', () => Fassung.uebersicht());
    if (p && p.vorlage) c('Seite', 'Diese Vorlage aktualisieren', '', () =>
      Fassung.fenster(p.id));
    if (p && Datenbank.sammlungAufSeite && Datenbank.sammlungAufSeite(p.id)) {
      const slg = Datenbank.sammlungAufSeite(p.id);
      c('Daten', 'Rechte je Spalte', '', () => Feldrechte.fenster(slg));
      c('Daten', 'Prüfsätze — stimmen die Formeln noch?', '', () => Pruefsatz.fenster(slg));
      c('Daten', 'Werte vorberechnen', '', () => Vorrat.fenster(slg));
    }
    if (p) c('Seite', 'Teilen und veröffentlichen (Wolke)', '', () =>
      WolkeFenster.teilenFenster(p.id));
    c('Navigation', 'Was Redion kann', '', () => Rundgang.uebersicht());
    c('Navigation', 'Führung starten', '', () => Rundgang.start());
    c('Daten', 'Erweiterungen', '', () => Erweiterung.dialog());
    c('Daten', 'Was hereinkommt — Eingänge von aussen', '', () => Eingang.dialog());
    /* Was Erweiterungen selbst angemeldet haben */
    (Erweiterung.angemeldet.befehle || []).forEach(x =>
      c('Erweiterungen', x.titel, '', () => {
        try { x.fn(); } catch (e: unknown) { UI.toast(e instanceof Error ? e.message : String(e)); } }));

    return b;
  };

  /* ------------------------------------------------------------------------
   * BEFEHLSPALETTE — unscharfe Suche und Gedächtnis
   * ------------------------------------------------------------------------
   * Notions Palette sucht wörtlich: „umb" findet „Umbenennen" nicht. Hier
   * zählen die Buchstaben in der richtigen Reihenfolge, und was man oft
   * benutzt, steht oben.
   * ---------------------------------------------------------------------- */

  const oftBenutzt = () => Store.getMeta('paletteOft', {}) || {};
  const merkeBefehl = (name: string) => {
    const m = oftBenutzt();
    m[name] = (m[name] || 0) + 1;
    Store.setMeta('paletteOft', m);
  };

  /* `vorgabe` füllt das Suchfeld vor. `register/module.js` ruft seit jeher
     `Werkzeuge.palette('datenbank')`, und der Wert fiel bisher stumm auf den
     Boden: die Palette ging auf, aber ungefiltert. */
  const palette = (vorgabe = '') => {
    /* Die eigenen Befehle stehen unten in befehle(); alles Weitere kommt
       aus register/befehle.js — dort meldet jeder Bereich seine eigenen an,
       ohne dass diese Datei davon wissen muss. */
    const liste = (typeof Register !== 'undefined' && Register.befehle)
      ? [...befehle(), ...Register.befehle.alle().map((x: any) => ({
          gruppe: x.gruppe || 'Weiteres', name: x.titel, kurz: x.kurz || '', fn: x.tun }))]
      : befehle();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<input id="cq" placeholder="Befehl suchen …" autocomplete="off">' +
        '<div class="res" id="cr"></div>' +
        '<div class="hint">↑ ↓ auswählen · Enter ausführen · Esc schliessen</div>' +
      '</div>';
    document.body.appendChild(o);

    const inp = o.querySelector<HTMLInputElement>('#cq');
    const res = o.querySelector<HTMLElement>('#cr');
    /* Ohne Eingabefeld und Trefferliste ist die Palette nicht die Palette. */
    if (!inp || !res) return;
    const oft = oftBenutzt();
    /* Ohne Eingabe: die meistbenutzten zuerst, sonst die Reihenfolge der Liste */
    const anfang = [...liste].sort((a, b) => (oft[b.name] || 0) - (oft[a.name] || 0));
    let treffer = anfang, i = 0;

    const zeichne = () => {
      let g = '';
      res.innerHTML = treffer.slice(0, 60).map((t, k) => {
        const kopf = t.gruppe !== g ? `<div class="grp">${esc(t.gruppe)}</div>` : '';
        g = t.gruppe;
        return kopf + `<button data-i="${k}"${k === i ? ' class="on"' : ''}>` +
               `<span style="flex:1">${esc(t.name)}</span>` +
               (t.kurz ? `<span class="pth">${esc(t.kurz)}</span>` : '') + '</button>';
      }).join('');
      res.querySelector('button.on')?.scrollIntoView({ block: 'nearest' });
    };
    zeichne();

    const fuehreAus = (t: any) => { o.remove(); merkeBefehl(t.name); setTimeout(() => t.fn(), 10); };

    inp.addEventListener('input', () => {
      const q = inp.value.trim();
      if (!q) { treffer = anfang; i = 0; zeichne(); return; }
      /* Befehle unscharf bewerten */
      const bewertet = liste.map(t => {
        const p1 = unscharf(t.name, q);
        const p2 = unscharf(t.gruppe + ' ' + t.name, q);
        const punkte = Math.max(p1, p2 - 40);
        return punkte < 0 ? null : { t, punkte: punkte + Math.min(60, (oft[t.name] || 0) * 12) };
      }).filter(Boolean).sort((a: any, b: any) => b.punkte - a.punkte).map((x: any) => x.t);

      /* Und die Seiten, die so heissen — wie in Notions Schnellsuche */
      const seiten = q.length < 2 ? [] : Object.values<any>(Store.cache.blocks)
        .filter(x => x.alive !== false && x.type === 'page' && unscharf(x.text || '', q) > 0)
        .sort((a, b) => unscharf(b.text || '', q) - unscharf(a.text || '', q))
        .slice(0, 6)
        .map(x => ({ gruppe: 'Seiten', name: (x.icon || '📄') + ' ' + (x.text || 'Ohne Titel'),
                     kurz: '', fn: () => App.oeffne(x.id) }));

      treffer = [...bewertet.slice(0, 40), ...seiten];
      i = 0; zeichne();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Escape') { o.remove(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); i = Math.min(i + 1, treffer.length - 1); zeichne(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); i = Math.max(i - 1, 0); zeichne(); }
      if (e.key === 'Enter' && treffer[i]) { e.preventDefault(); fuehreAus(treffer[i]); }
    });
    res.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-i]');
      if (b) fuehreAus(treffer[Number(b.dataset.i)]);
    });
    o.addEventListener('mousedown', e => { if (e.target === o) o.remove(); });
    inp.focus();
    if (vorgabe) { inp.value = vorgabe; inp.dispatchEvent(new Event('input')); }
  };

  /* ========================================================================
   * 2. TAGESJOURNAL   (Logseq, Foam, SiYuan)
   * ======================================================================*/
  const journalSeite = (iso = heute()) => {
    const eltern = systemSeite('journal', 'Journal', '📅');
    const titel = iso + ' · ' + WOCHENTAG[new Date(iso + 'T12:00:00').getDay()];
    const da = Store.childrenOf(eltern.id).find((k: any) => (k.text || '').startsWith(iso));
    if (da) return da;

    const p = Store.addPage(eltern.id, { text: titel, icon: '📆', journal: iso });
    Store.addBlock(p.id, 'h3', { text: datumLang(iso) });
    Store.addBlock(p.id, 'text', { text: '' });
    Store.updateBlock(eltern.id, { aufgeklappt: true });
    return p;
  };

  const journal = (iso = heute()) => {
    const p = journalSeite(iso);
    App.zeichneBaum();
    App.oeffne(p.id);
  };

  /* ========================================================================
   * 3. SCHNELLNOTIZEN   (Memos, Blinko)
   * ------------------------------------------------------------------------
   * Zeitleiste kurzer Notizen mit Schlagwörtern und einer Heatmap der
   * letzten zwölf Wochen.
   * ======================================================================*/
  const schnellnotizen = () => {
    const eltern = systemSeite('memos', 'Schnellnotizen', '⚡');

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder memos" style="width:min(720px,95vw)">' +
        '<div class="fh">⚡ Schnellnotizen <em id="mz"></em>' +
          '<button class="icon-btn" data-a="seite" title="Als normale Seite öffnen">↗</button>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="memo-neu">' +
          '<textarea id="mt" rows="2" placeholder="Was ist gerade? Mit #schlagwort ordnen … (Strg + Enter speichert)"></textarea>' +
          '<button id="mb" class="prim">Speichern</button>' +
        '</div>' +
        '<div id="mhm" class="heatmap"></div>' +
        '<div class="res" id="ml"></div>' +
      '</div>';
    document.body.appendChild(o);

    const liste = () => Store.childrenOf(eltern.id).slice().reverse();

    const zeichne = (): void => {
      const alle = liste();
      const zahl = o.querySelector('#mz');
      const listeEl = o.querySelector('#ml');
      const heat = o.querySelector('#mhm');
      if (!zahl || !listeEl || !heat) return;
      zahl.textContent = alle.length + '';
      listeEl.innerHTML = alle.length
        ? alle.map((m: any) =>
            `<div class="memo" data-id="${m.id}">` +
              `<div class="memo-kopf">${esc(zeitKurz(m.created))}` +
                `<button data-a="edit" title="Bearbeiten">✎</button>` +
                `<button data-a="seite2" title="Zu einer Seite machen">↗</button>` +
                `<button data-a="del" title="Löschen">🗑</button></div>` +
              `<div class="memo-txt">${Blocks.inline(m.text || '')}</div>` +
            '</div>').join('')
        : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
          'Noch nichts festgehalten. Oben eintippen und speichern.</div>';

      /* Heatmap der letzten zwölf Wochen */
      const zaehler: Record<string, number> = {};
      alle.forEach((m: any) => { const t = (m.created || '').slice(0, 10); zaehler[t] = (zaehler[t] || 0) + 1; });
      const zellen: string[] = [];
      const start = new Date(); start.setDate(start.getDate() - 83);
      for (let i = 0; i < 84; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const n = zaehler[iso] || 0;
        zellen.push(`<i class="hm${Math.min(4, n)}" title="${iso}: ${n}"></i>`);
      }
      heat.innerHTML = zellen.join('');
    };
    zeichne();

    const speichern = () => {
      const ta = o.querySelector<HTMLTextAreaElement>('#mt');
      if (!ta) return;
      const txt = ta.value.trim();
      if (!txt) return;
      Store.addBlock(eltern.id, 'text', { text: txt });
      ta.value = '';
      zeichne();
      App.zeichneBaum();
    };

    o.querySelector('#mb')?.addEventListener('click', speichern);
    o.querySelector('#mt')?.addEventListener('keydown', (e: Event) => {
      const t = e as KeyboardEvent;
      if (t.key === 'Enter' && (t.ctrlKey || t.metaKey)) { t.preventDefault(); speichern(); }
    });
    o.querySelector<HTMLElement>('#mt')?.focus();

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="seite"]')) { o.remove(); App.oeffne(eltern.id); return; }
      const memo = elVon(e)?.closest<HTMLElement>('.memo');
      if (!memo) return;
      const b = Store.getBlock(memo.dataset.id);
      if (!b) return;
      if (elVon(e)?.closest<HTMLElement>('[data-a="del"]')) { Store.trashBlock(b.id); zeichne(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="edit"]')) {
        const n = prompt('Notiz bearbeiten', b.text);
        if (n !== null) { Store.updateBlock(b.id, { text: n }); zeichne(); }
        return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="seite2"]')) {
        const p = Store.addPage(null, { text: (b.text || '').slice(0, 60), icon: '📄' });
        Store.addBlock(p.id, 'text', { text: b.text || '' });
        Store.trashBlock(b.id);
        o.remove(); App.zeichneBaum(); App.oeffne(p.id);
      }
    });
  };


  /* ========================================================================
   * 4. VORLAGEN   (Outline, Trilium, Anytype)
   * ======================================================================*/
  const alsVorlage = (p: any) => {
    const ordner = systemSeite('vorlagen', 'Vorlagen', '🧩');
    const daten = Store.baum(p.id);
    const neu = Store.baumEinfuegen(daten, ordner.id);
    if (!neu) { UI.toast('Die Vorlage liess sich nicht anlegen'); return; }
    Store.updateBlock(neu.id, { text: (p.text || 'Ohne Titel'), vorlage: true });
    Store.updateBlock(ordner.id, { aufgeklappt: true });
    App.zeichneBaum();
    UI.toast('Als Vorlage gespeichert');
  };

  const vorlagenListe = () => {
    const id = Store.getMeta('sys:vorlagen');
    return id && Store.getBlock(id) ? Store.childrenOf(id).filter((k: any) => k.type === 'page') : [];
  };

  const vorlageEinfuegen = (ziel: any) => {
    const liste = vorlagenListe();
    if (!liste.length) { UI.toast('Noch keine Vorlagen — erst eine Seite als Vorlage speichern'); return; }
    const html = '<div class="grp">Vorlage einfügen</div>' + liste.map((v: any) =>
      `<button data-v="${v.id}"><span class="mi">${esc(v.icon || '🧩')}</span>${esc(v.text || 'Ohne Titel')}</button>`).join('');
    const m = UI.menu(html, innerWidth / 2 - 130, 120);
    m.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-v]');
      if (!b) return;
      m.remove();
      if (!b.dataset.v) return;
      const daten = Store.baum(b.dataset.v);
      /* Nur den Inhalt übernehmen, nicht die Vorlagenseite selbst */
      (daten.kinder || []).forEach((k: any) => Store.baumEinfuegen(k, ziel.id));
      App.zeichneSeite();
      UI.toast('Vorlage eingefügt');
    });
  };

  const vorlagen = () => {
    Galerie.oeffne();
  };

  const vorlagenOrdner = () => {
    const ordner = systemSeite('vorlagen', 'Vorlagen', '🧩');
    App.zeichneBaum();
    App.oeffne(ordner.id);
  };

  /* ========================================================================
   * 5. KARTEIKARTEN   (SiYuan, Anki-Verfahren SM-2)
   * ======================================================================*/
  const karten = () => Object.values<any>(Store.cache.blocks)
    .filter(b => b.alive && b.type === 'flashcard');

  const faellig = () => {
    const jetzt = Date.now();
    return karten().filter(k => !k.sr || !k.sr.faellig || new Date(k.sr.faellig).getTime() <= jetzt);
  };


  const lernen = () => {
    const stapel = faellig();
    const alle = karten();

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder lern" style="width:min(620px,94vw)"></div>';
    document.body.appendChild(o);
    const box = o.querySelector('.lern');
    if (!box) return;

    let i = 0, offen = false, gelernt = 0;

    const zeichne = () => {
      if (!alle.length) {
        box.innerHTML =
          '<div class="fh">🎴 Karteikarten</div>' +
          '<div style="padding:26px; text-align:center; color:var(--text-dim); font-size:14px; line-height:1.7">' +
          'Noch keine Karteikarten.<br>Tippe auf einer Seite <code>/karteikarte</code> —<br>' +
          'vorne die Frage, hinten die Antwort.</div>' +
          '<div class="fbtns"><button data-a="zu">Schliessen</button></div>';
        return;
      }
      if (i >= stapel.length) {
        box.innerHTML =
          '<div class="fh">🎴 Fertig für heute</div>' +
          `<div style="padding:26px; text-align:center; font-size:15px; line-height:1.8">` +
          `${gelernt} Karten wiederholt.<br>` +
          `<span style="color:var(--text-dim); font-size:13.5px">Insgesamt ${alle.length} Karten · ` +
          `nächste Wiederholung nach Plan</span></div>` +
          '<div class="fbtns"><button data-a="zu" class="prim">Schliessen</button></div>';
        return;
      }
      const k = stapel[i];
      const [vorn, hinten] = teileKarte(k);
      const quelle = Links.seiteVon(k.id);
      box.innerHTML =
        `<div class="fh">🎴 Karteikarte <em>${i + 1} / ${stapel.length}</em>` +
          `<button class="icon-btn" data-a="zu">✕</button></div>` +
        `<div class="karte">` +
          `<div class="k-vorn">${Blocks.inline(vorn)}</div>` +
          (offen ? `<hr><div class="k-hinten">${Blocks.inline(hinten)}</div>` : '') +
          (quelle ? `<div class="k-quelle" data-a="quelle">aus: ${esc(quelle.text || 'Ohne Titel')}</div>` : '') +
        `</div>` +
        (offen
          ? '<div class="fbtns lern-btns">' +
              '<button data-n="1">Nochmal</button><button data-n="2">Schwer</button>' +
              '<button data-n="3" class="prim">Gut</button><button data-n="4">Leicht</button>' +
            '</div>'
          : '<div class="fbtns"><button data-a="auf" class="prim">Antwort zeigen</button></div>');
    };
    zeichne();

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="auf"]')) { offen = true; zeichne(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="quelle"]')) {
        const k = stapel[i]; const q = Links.seiteVon(k.id);
        if (q) { o.remove(); App.oeffne(q.id); }
        return;
      }
      const n = elVon(e)?.closest<HTMLElement>('[data-n]');
      if (n) { planen(stapel[i], Number(n.dataset.n)); gelernt++; i++; offen = false; zeichne(); }
    });

    document.addEventListener('keydown', function tast(e) {
      if (!document.body.contains(o)) { document.removeEventListener('keydown', tast); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!offen) { offen = true; zeichne(); } }
      if (offen && /^[1-4]$/.test(e.key)) { planen(stapel[i], +e.key); gelernt++; i++; offen = false; zeichne(); }
    });
  };

  const teileKarte = (k: any) => {
    const t = k.text || '';
    const i = t.indexOf('::');
    return i >= 0 ? [t.slice(0, i).trim(), t.slice(i + 2).trim()] : [t, '(noch keine Antwort — mit :: trennen)'];
  };

  /* ========================================================================
   * 6. VERSIONSVERLAUF   (Standard Notes, Trilium, Joplin)
   * ======================================================================*/
  const versionen = async (p: any) => {
    const liste = await Store.versionen(p.id);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(620px,94vw)">' +
        `<div class="fh">Versionsverlauf <em>${liste.length}</em>` +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="res">' +
          (liste.length ? liste.map(v =>
            `<button data-v="${v.id}">` +
              `<span>${esc(v.icon)}</span>` +
              `<span style="flex:1">${esc(v.titel)}` +
                `<span class="snip">${esc(new Date(v.zeit).toLocaleString('de-DE'))} · ${esc(v.anlass)}</span></span>` +
              `<span class="pth" data-vgl="${v.id}" style="color:var(--text-dim);cursor:pointer" ` +
                `title="Diese Fassung mit dem jetzigen Stand vergleichen">Vergleichen</span>` +
              `<span class="pth" data-a="zurueck" style="color:var(--accent);cursor:pointer">Wiederherstellen</span>` +
            '</button>').join('')
          : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
            'Noch keine gespeicherten Fassungen. Die App legt beim Bearbeiten automatisch welche an.</div>') +
        '</div>' +
        '<div class="fbtns">' +
          '<button data-a="vergleich">⇄ Vergleichen</button>' +
          '<button data-a="jetzt" class="prim">Jetzige Fassung sichern</button></div>' +
      '</div>';
    document.body.appendChild(o);

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="vergleich"]')) {
        o.remove(); Vergleich.dialog(p); return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="jetzt"]')) {
        await Store.versionSpeichern(p.id, 'von Hand');
        o.remove(); UI.toast('Fassung gesichert'); versionen(p);
        return;
      }
      const vgl = elVon(e)?.closest<HTMLElement>('[data-vgl]');
      if (vgl) { o.remove(); Vergleich.dialog(p, vgl.dataset.vgl); return; }
      const b = elVon(e)?.closest<HTMLElement>('button[data-v]');
      if (!b) return;
      const v = liste.find(x => x.id === b.dataset.v);
      if (!v) return;
      if (!confirm('Diese Fassung wiederherstellen? Der jetzige Inhalt wird vorher als Version gesichert.')) return;
      await Store.versionSpeichern(p.id, 'vor Wiederherstellung');
      Store.kinderLeeren(p.id);
      (v.daten.kinder || []).forEach((k: any) => Store.baumEinfuegen(k, p.id));
      Store.updateBlock(p.id, { text: v.daten.text, icon: v.daten.icon });
      o.remove(); App.zeichneBaum(); App.zeichneSeite();
      UI.toast('Fassung wiederhergestellt');
    });
  };

  /* Alle paar Minuten beim Seitenwechsel automatisch eine Fassung sichern. */
  let letzteSicherung: Record<string, number> = {};
  const versionAutomatisch = async (pageId: any) => {
    if (!pageId) return;
    const p = Store.getBlock(pageId);
    if (!p || p.locked) return;
    const jetzt = Date.now();
    if (letzteSicherung[pageId] && jetzt - letzteSicherung[pageId] < 4 * 60 * 1000) return;
    letzteSicherung[pageId] = jetzt;
    await Store.versionSpeichern(pageId, 'automatisch');
  };

  /* ========================================================================
   * 7. SEITE VERSCHLÜSSELN   (Standard Notes, Notesnook, Trilium)
   * ------------------------------------------------------------------------
   * AES-GCM mit einem Schlüssel aus PBKDF2. Das Passwort wird nirgends
   * gespeichert — vergessen heisst wirklich weg.
   * ======================================================================*/
  const schluesselCache = new Map();

  const schluessel = async (pass: any, salzB64: any) => {
    const salz = Uint8Array.from(atob(salzB64), c => c.charCodeAt(0));
    const roh = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salz, iterations: 250000, hash: 'SHA-256' },
      roh, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };

  /* Aus `core/helpers/bytes.ts`. Vorher stand hier die Fassung mit dem Spread:
     ab etwa 128 000 Bytes sprengt sie den Aufrufstapel — und das ist die
     Grösse einer längeren Seite, also genau der Fall, für den das Sperren
     gedacht ist. */
  const b64 = (buf: any) => Bytes.toBase64(buf);
  const vonB64 = (s: any): Uint8Array<ArrayBuffer> => Bytes.fromBase64(s) as Uint8Array<ArrayBuffer>;

  const sperren = async (p: any) => {
    if (!crypto.subtle) { alert('Verschlüsselung braucht einen sicheren Kontext (https oder lokale Datei).'); return; }
    const pass = prompt('Passwort für diese Seite festlegen.\n\nAchtung: Ohne dieses Passwort ist der Inhalt endgültig weg.');
    if (!pass) return;
    const pass2 = prompt('Passwort zur Sicherheit noch einmal:');
    if (pass !== pass2) { alert('Die Passwörter stimmen nicht überein.'); return; }

    const salz = b64(crypto.getRandomValues(new Uint8Array(16)));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const k = await schluessel(pass, salz);
    const klartext = JSON.stringify(Store.baum(p.id).kinder || []);
    const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(klartext));

    /* Vor dem Löschen prüfen, ob sich das Paket auch wirklich wieder öffnen lässt */
    try {
      const probe = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, chiffre);
      if (new TextDecoder().decode(probe) !== klartext) throw new Error('Probe fehlgeschlagen');
    } catch (err) { alert('Verschlüsselung fehlgeschlagen — es wurde nichts verändert.'); return; }

    Store.kinderLeeren(p.id);
    Store.updateBlock(p.id, { locked: { salz, iv: b64(iv), daten: b64(chiffre), zeit: Store.now() } });
    schluesselCache.delete(p.id);
    App.zeichneSeite(); App.zeichneBaum();
    UI.toast('Seite verschlüsselt');
  };

  const entsperren = async (p: any, passVorgabe?: any) => {
    const l = p.locked;
    if (!l) return true;
    const pass = passVorgabe || prompt('Passwort dieser Seite:');
    if (!pass) return false;
    try {
      const k = await schluessel(pass, l.salz);
      const klar = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: vonB64(l.iv) }, k, vonB64(l.daten));
      const kinder = JSON.parse(new TextDecoder().decode(klar));
      Store.kinderLeeren(p.id);
      kinder.forEach((kd: any) => Store.baumEinfuegen(kd, p.id));
      Store.updateBlock(p.id, { locked: null });
      App.zeichneSeite(); App.zeichneBaum();
      UI.toast('Seite entsperrt');
      return true;
    } catch (err) {
      UI.toast('Falsches Passwort');
      return false;
    }
  };

  /** Der Sperrbildschirm statt des Seiteninhalts. */
  const sperrAnsicht = (p: any, wrap: any) => {
    const d = document.createElement('div');
    d.className = 'gesperrt';
    d.innerHTML =
      '<div style="font-size:44px">🔒</div>' +
      '<div style="font-size:17px; margin:12px 0 4px">Diese Seite ist verschlüsselt</div>' +
      '<div style="font-size:13.5px; color:var(--text-dim); margin-bottom:16px">' +
        'Verschlüsselt am ' + esc(new Date(p.locked.zeit).toLocaleString('de-DE')) + '</div>' +
      '<input type="password" id="pw" placeholder="Passwort" autocomplete="off">' +
      '<button class="prim" id="auf">Entsperren</button>';
    wrap.appendChild(d);
    const inp = d.querySelector<HTMLInputElement>('#pw');
    if (!inp) return;
    const los = () => entsperren(p, inp.value);
    d.querySelector('#auf')?.addEventListener('click', los);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') los(); });
    setTimeout(() => inp.focus(), 50);
  };

  /* ========================================================================
   * 8. FOKUS-MODUS   (MarkText, Zettlr, iA Writer)
   * ======================================================================*/
  const fokus = (an?: any) => {
    const jetzt = an === undefined ? !document.body.classList.contains('fokus') : an;
    document.body.classList.toggle('fokus', jetzt);
    UI.toast(jetzt ? 'Fokus-Modus — Esc beendet ihn' : 'Fokus-Modus beendet');
    if (jetzt) {
      const raus = (e: any) => {
        if (e.key === 'Escape') { fokus(false); document.removeEventListener('keydown', raus); }
      };
      document.addEventListener('keydown', raus);
    }
  };

  /* ========================================================================
   * 9. PRÄSENTATION   (HedgeDoc, Marp)
   * ------------------------------------------------------------------------
   * Jede Überschrift 1 oder jede Trennlinie beginnt eine neue Folie.
   * ======================================================================*/
  const praesentation = (p: any) => {
    const folien: any[] = [];
    /* Eine Folie: Titel und die Blöcke darauf, jeder mit seiner Tiefe. */
    type Folie = { titel: string; bloecke: { b: any; tiefe: number }[] };
    let aktuell: Folie = { titel: p.text || '', bloecke: [] };

    /* Eine neue Folie beginnt bei einer Trennlinie und bei jeder
       Überschrift 1 oder 2 — so wie in HedgeDoc und Marp. */
    const trennt = (b: any) => b.type === 'divider' || b.type === 'h1' || b.type === 'h2';

    const sammle = (id: string, tiefe: number) => {
      Store.childrenOf(id).forEach((b: any) => {
        if (trennt(b)) {
          const leerAmAnfang = !aktuell.bloecke.length && !folien.length && aktuell.titel === p.text;
          if (!leerAmAnfang) folien.push(aktuell);
          aktuell = { titel: b.type === 'divider' ? '' : (b.text || ''), bloecke: [] };
          return;
        }
        aktuell.bloecke.push({ b, tiefe });
        if (['bullet','number','todo','toggle'].includes(b.type)) sammle(b.id, tiefe + 1);
      });
    };
    sammle(p.id, 0);
    folien.push(aktuell);

    const o = document.createElement('div');
    o.className = 'praesi';
    document.body.appendChild(o);
    let i = 0;

    const zeichne = () => {
      const f = folien[i];
      o.innerHTML =
        '<div class="folie">' +
          (f.titel ? `<h1>${Blocks.inline(f.titel)}</h1>` : '') +
          f.bloecke.map(({ b, tiefe }: { b: any; tiefe: number }) => folieBlock(b, tiefe)).join('') +
        '</div>' +
        `<div class="praesi-leiste">` +
          `<button data-a="vor">‹</button>` +
          `<span>${i + 1} / ${folien.length}</span>` +
          `<button data-a="zurueck">›</button>` +
          `<button data-a="zu">Beenden (Esc)</button>` +
        `</div>`;
    };

    const folieBlock = (b: any, tiefe: number) => {
      const ein = ` style="margin-left:${tiefe * 26}px"`;
      if (b.type === 'h1' || b.type === 'h2') return `<h2${ein}>${Blocks.inline(b.text || '')}</h2>`;
      if (b.type === 'h3') return `<h3${ein}>${Blocks.inline(b.text || '')}</h3>`;
      if (b.type === 'bullet') return `<li${ein}>${Blocks.inline(b.text || '')}</li>`;
      if (b.type === 'number') return `<li${ein} class="nr">${Blocks.inline(b.text || '')}</li>`;
      if (b.type === 'todo') return `<li${ein} class="td">${b.checked ? '☑' : '☐'} ${Blocks.inline(b.text || '')}</li>`;
      if (b.type === 'quote') return `<blockquote${ein}>${Blocks.inline(b.text || '')}</blockquote>`;
      if (b.type === 'code') return `<pre${ein}>${esc(b.text || '')}</pre>`;
      if (b.type === 'callout') return `<div class="cal"${ein}>${esc(b.icon || '💡')} ${Blocks.inline(b.text || '')}</div>`;
      if (b.type === 'image' && b.src) return `<img src="${esc(b.src)}" alt="">`;
      if (b.type === 'equation') return `<div class="eqp">${Zusatz.mathe(b.text || '')}</div>`;
      if (b.type === 'divider') return '<hr>';
      return b.text ? `<p${ein}>${Blocks.inline(b.text)}</p>` : '';
    };

    const weiter = (n: number) => { i = Math.max(0, Math.min(folien.length - 1, i + n)); zeichne(); };
    const tasten = (e: any) => {
      if (e.key === 'Escape') { schliessen(); return; }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); weiter(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); weiter(-1); }
      if (e.key === 'Home') weiter(-999);
      if (e.key === 'End') weiter(999);
    };
    const schliessen = () => {
      o.remove(); document.removeEventListener('keydown', tasten);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    o.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) return schliessen();
      if (elVon(e)?.closest<HTMLElement>('[data-a="vor"]')) return weiter(-1);
      if (elVon(e)?.closest<HTMLElement>('[data-a="zurueck"]')) return weiter(1);
    });
    document.addEventListener('keydown', tasten);
    zeichne();
    o.requestFullscreen?.().catch(() => {});
  };

  /* ========================================================================
   * 10. MARKDOWN-QUELLTEXT   (MarkText, TUI Editor, Zettlr)
   * ------------------------------------------------------------------------
   * Die Seite als reiner Text — und zurück. Datenbanken bleiben dabei
   * unangetastet, sie stehen als Platzhalter drin.
   * ======================================================================*/

  const quelltext = (p: any) => {
    const md = alsMarkdown(p);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(820px,95vw)">' +
        '<div class="fh">Markdown-Quelltext <em>' + esc(p.text || 'Ohne Titel') + '</em>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<textarea id="mdq" spellcheck="false"></textarea>' +
        '<div class="fbtns">' +
          '<button data-a="kopieren">Kopieren</button>' +
          '<button data-a="datei">Als .md speichern</button>' +
          '<button data-a="ok" class="prim">Übernehmen</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    const ta = o.querySelector<HTMLTextAreaElement>('#mdq');
    if (!ta) return;
    ta.value = md;
    ta.focus();

    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="kopieren"]')) { navigator.clipboard?.writeText(ta.value); UI.toast('Kopiert'); }
      if (elVon(e)?.closest<HTMLElement>('[data-a="datei"]')) App.markdownExport(p);
      if (elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) {
        if (ta.value !== md) {
          Store.versionSpeichern(p.id, 'vor Quelltext-Änderung');
          ausMarkdown(p, ta.value);
          App.zeichneSeite();
          UI.toast('Übernommen');
        }
        o.remove();
      }
    });
  };

  /* ========================================================================
   * 11. SCHREIBSTATISTIK   (Zettlr)
   * ======================================================================*/
  const statistik = (p: any) => {
    const { woerter, zeichen, saetze, blockAnzahl, lesezeit, sprechzeit,
            top, alleW } = statistikZahlen(p);

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(600px,94vw)">' +
        '<div class="fh">Statistik <em>' + esc(p.text || 'Ohne Titel') + '</em>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="stat-gitter">' +
          kachel(woerter, 'Wörter') + kachel(zeichen, 'Zeichen') +
          kachel(saetze, 'Sätze') + kachel(blockAnzahl, 'Blöcke') +
          kachel(lesezeit + ' min', 'Lesezeit') + kachel(sprechzeit + ' min', 'Vorlesezeit') +
        '</div>' +
        (top.length
          ? '<div class="stat-woerter"><div class="grp">Häufigste Wörter</div>' +
            top.map(([w, n]) => `<span class="tagpill">${esc(w)} <em>${n}</em></span>`).join('') + '</div>'
          : '') +
        `<div class="hint">Im ganzen Arbeitsbereich: ${alleW.toLocaleString('de-DE')} Wörter · ` +
        `${Links.seiten().length} Seiten</div>` +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) o.remove();
    });
  };

  const kachel = (wert: any, name: string) =>
    `<div class="stat-k"><b>${typeof wert === 'number' ? wert.toLocaleString('de-DE') : wert}</b><span>${name}</span></div>`;

  /* ========================================================================
   * 12. ERINNERUNGEN   (Notesnook, Notion @remind)
   * ======================================================================*/
  const erinnerungen = () => Store.getMeta('erinnerungen', []) || [];

  /* ------------------------------------------------------------------------
   * BENACHRICHTIGUNGEN
   * ------------------------------------------------------------------------
   * Notions Automationen können eine Benachrichtigung an bis zu 20 Personen
   * schicken. Hier gibt es einen Menschen — also landet sie im Posteingang,
   * dort wo auch Erinnerungen und Kommentare stehen.
   * --------------------------------------------------------------------- */
  const meldungen = () => Store.getMeta('meldungen', []) || [];

  const posteingangMelden = (m: any) => {
    const liste = meldungen();
    liste.unshift({
      id: Store.uid(), text: m.text || '', quelle: m.quelle || '',
      seite: m.seite || '', art: m.art || 'hinweis',
      wann: new Date().toISOString(), gelesen: false
    });
    Store.setMeta('meldungen', liste.slice(0, 200));
    /* Kurz sichtbar machen, damit man es auch ohne Posteingang mitbekommt */
    try { UI.toast('🔔 ' + (m.text || 'Neue Benachrichtigung')); } catch {}
    /* Und, falls erlaubt, als echte Benachrichtigung des Geräts */
    try {
      if (window.Notification && Notification.permission === 'granted')
        new Notification(m.text || 'Redion', { body: m.quelle || '', tag: 'redion' });
    } catch {}
    return liste[0];
  };

  const meldungGelesen = (id: string) => {
    const liste = meldungen().map((x: any) => x.id === id ? { ...x, gelesen: true } : x);
    Store.setMeta('meldungen', liste);
  };

  const meldungenLeeren = () => Store.setMeta('meldungen', []);

  /** Ein Datum, wie es ein `datetime-local`-Feld erwartet: ORTSZEIT.
   *
   *  Hier stand `toISOString().slice(0, 16)`, und das ist Weltzeit. In der
   *  Schweiz schlug der Dialog im Sommer zwei Stunden zu früh vor — „in
   *  einer Stunde" wurde zu „vor einer Stunde", und wer den Vorschlag
   *  übernahm, setzte eine Erinnerung in die Vergangenheit: sie meldete
   *  sich sofort. Der Fehler ist in London unsichtbar und in Zürich täglich. */
  const alsOrtszeit = (d: Date): string =>
    new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  /** Steht auf dieser Seite schon ein Datum? Dann ist es gemeint.
   *
   *  Ein Kalendereintrag IST eine Seite mit einer Datumsspalte. Wer dort
   *  „morgen 08:00" einträgt und danach eine Erinnerung setzt, meint diese
   *  Zeit und keine andere — sie am Telefon abzutippen wäre eine Zumutung. */
  const datumDerSeite = (p: any): string | null => {
    try {
      /* Nur Datenbankzeilen haben Spalten. `addRow` setzt `parentTable` auf
         'collection'; ein gewöhnlicher Block bleibt auf 'block'. */
      if (!p || p.parentTable !== 'collection') return null;
      const coll = Store.getCollection(p.parentId);
      if (!coll || !coll.schema) return null;
      /* Der Wert einer Datumsspalte ist eine ZEICHENKETTE, kein Objekt —
         nachgesehen in `datenbanken/dienst.ts:540`, `raster.ts:113` und
         `steuerung.ts:1569`, die alle `new Date(v)` darauf anwenden. Das
         `{von, bis}`-Paar gibt es nur bei `daterange()` in einer Formel. */
      for (const [feld, spalte] of Object.entries<any>(coll.schema)) {
        if (!spalte || spalte.type !== 'date') continue;
        const wert = (p.props || {})[feld];
        if (!wert) continue;
        const d = new Date(wert);
        if (isNaN(d.getTime())) continue;
        /* Ein Datum ohne Uhrzeit meint den Morgen, nicht Mitternacht —
           um 0:00 erinnert zu werden hat noch niemand gewollt. */
        if (d.getHours() === 0 && d.getMinutes() === 0) d.setHours(8, 0, 0, 0);
        return alsOrtszeit(d);
      }
    } catch { /* keine Datumsspalte gefunden ist kein Fehler */ }
    /* Genommen wird die ERSTE Datumsspalte. Eine Kalenderansicht kann über
       `view.dateKey` eine andere führen (`steuerung.ts:1812`) — welche das
       war, weiss die Seite allein nicht, sie kennt ihre Ansicht nicht. */
    return null;
  };

  const erinnerungSetzen = (p: any) => {
    const jetzt = new Date(Date.now() + 60 * 60 * 1000);
    const vorgabe = datumDerSeite(p) || alsOrtszeit(jetzt);
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(460px,94vw)">' +
        '<div class="fh">Erinnerung</div>' +
        '<div style="padding:16px 18px; display:flex; flex-direction:column; gap:12px">' +
          `<label style="font-size:13px; color:var(--text-dim)">Wann?<br>` +
          `<input type="datetime-local" id="ez" value="${vorgabe}" ` +
          `style="margin-top:6px; width:100%; padding:9px 10px; background:var(--bg-input); ` +
          `border:1px solid var(--line); border-radius:7px; outline:none"></label>` +
          `<label style="font-size:13px; color:var(--text-dim)">Text<br>` +
          `<input id="et" value="${esc(p.text || 'Erinnerung')}" ` +
          `style="margin-top:6px; width:100%; padding:9px 10px; background:var(--bg-input); ` +
          `border:1px solid var(--line); border-radius:7px; outline:none"></label>` +
          '<div style="font-size:12.5px; color:var(--text-faint); line-height:1.6">' +
          'Die Erinnerung meldet sich, <b>solange Redion offen ist</b> — auch in ' +
          'einem Hintergrund-Tab. Ist Redion zu dieser Zeit geschlossen, wartet sie ' +
          'und meldet sich beim nächsten Öffnen als verpasst.' +
          (/iPad|iPhone|iPod/.test(navigator.userAgent)
            ? '<br><br>Auf dem iPhone zeigt nur die <b>installierte App</b> ' +
              'Systemmeldungen (Teilen → „Zum Home-Bildschirm"). In Safari selbst ' +
              'erscheint die Erinnerung nur in Redion.'
            : ' Erlaubst du Benachrichtigungen, meldet sie sich auch im System.') +
          '</div>' +
        '</div>' +
        '<div class="fbtns"><button data-a="ok" class="prim">Erinnerung setzen</button>' +
        '<button data-a="zu">Abbrechen</button></div>' +
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }
      if (!elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) return;
      const zeit = o.querySelector<HTMLInputElement>('#ez')?.value ?? '';
      const text = o.querySelector<HTMLInputElement>('#et')?.value ?? '';
      if (!zeit) return;
      const liste = erinnerungen();
      liste.push({ id: Store.uid(), pageId: p.id, zeit, text, erledigt: false });
      Store.setMeta('erinnerungen', liste);
      if ('Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch {}
      }
      o.remove();
      UI.toast('Erinnerung gesetzt für ' + new Date(zeit).toLocaleString('de-DE'));
      App.zeichneSeite();
    });
  };

  const erinnerungenPruefen = () => {
    const liste = erinnerungen();
    let geaendert = false;
    const jetzt = Date.now();
    liste.forEach((e: any) => {
      if (e.erledigt) return;
      if (new Date(e.zeit).getTime() > jetzt) return;
      e.erledigt = true; geaendert = true;
      /* Wie spät ist es geworden? Eine Erinnerung, die um acht Uhr gemeint
         war und um halb elf erscheint, darf nicht so tun, als sei jetzt
         acht — am Telefon ist das der Normalfall, weil die App nicht die
         ganze Nacht offen war. Ab zwei Minuten steht die gemeinte Zeit dabei. */
      const gemeint = new Date(e.zeit);
      const spaet = jetzt - gemeint.getTime() > 120000;
      const wann = gemeint.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      UI.toast(spaet ? 'Verpasst um ' + wann + ': ' + e.text : '⏰ ' + e.text);
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const n = new Notification(spaet ? 'Verpasst um ' + wann : 'Erinnerung: ' + e.text,
            { body: spaet ? e.text : 'In Redion', tag: e.id });
          n.onclick = () => { window.focus(); App.oeffne(e.pageId); };
        } catch {}
      }
    });
    if (geaendert) Store.setMeta('erinnerungen', liste);
  };

  /* ========================================================================
   * 13. ORDNER-ABGLEICH   (Joplin, Zettlr, SilverBullet)
   * ======================================================================*/
  const ordnerSchreiben = async () => {
    if (!(window as any).showDirectoryPicker) {
      /* Fallback: alles in eine Markdown-Datei */
      const alles = Links.seiten().map(p => '# ' + (p.text || 'Ohne Titel') + '\n\n' + alsMarkdown(p)).join('\n\n---\n\n');
      lade(new Blob([alles], { type: 'text/markdown' }), 'notizen-alle-seiten.md');
      UI.toast('Dieser Browser kann keine Ordner öffnen — alles in eine Datei gespeichert');
      return;
    }
    try {
      const ordner = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      let n = 0;
      const schreibe = async (verzeichnis: any, seite: any) => {
        const name = sauber(seite.text || 'Ohne Titel');
        const kinder = Store.childrenOf(seite.id).filter((k: any) => k.type === 'page');
        const datei = await verzeichnis.getFileHandle(name + '.md', { create: true });
        const w = await datei.createWritable();
        await w.write('# ' + (seite.text || 'Ohne Titel') + '\n\n' + alsMarkdown(seite) + '\n');
        await w.close();
        n++;
        if (kinder.length) {
          const unter = await verzeichnis.getDirectoryHandle(name, { create: true });
          for (const k of kinder) await schreibe(unter, k);
        }
      };
      for (const p of Store.rootPages()) await schreibe(ordner, p);
      UI.toast(n + ' Seiten in den Ordner geschrieben');
    } catch (err: unknown) {
      if (!(err instanceof Error) || err.name !== 'AbortError')
        UI.toast('Ordner konnte nicht beschrieben werden');
    }
  };

  /** Einzelne Dateien einlesen — jedes Format, das die App kennt. */
  const dateienLesen = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.md,.markdown,.txt,.csv,.tsv,.html,.htm,.xlsx,.xlsm,.ods,.docx,.epub,image/*';
    inp.multiple = true;
    inp.addEventListener('change', async () => {
      let n = 0;
      for (const f of Array.from(inp.files ?? [])) {
        const name = f.name.toLowerCase();
        try {
          if (/\.(xlsx|xlsm|docx|epub)$/i.test(name)) {
            const erg = await Einlesen.datei(f);
            if (erg) { UI.toast(f.name + ': ' + erg.hinweis); n++; continue; }
          }
          const text = await f.text();
          if (/\.(html|htm)$/i.test(name)) {
            const p2 = Store.addPage(null, { text: f.name.replace(/\.[^.]+$/, ''), icon: '🌐' });
            ausHtml(p2.id, text);
          } else if (/\.(csv|tsv)$/i.test(name)) {
            const p2 = Store.addPage(null, { text: f.name.replace(/\.[^.]+$/, ''), icon: '📊' });
            Einlesen.alsDatenbank(p2.id, p2.text, Datenbank.csvZerlegen(text.replace(/^﻿/, '')));
          } else {
            await mdDateiAnlegen(f.name, text);
          }
          n++;
        } catch (err: unknown) { UI.banner(f.name + ': ' +
          (err instanceof Error ? err.message : String(err)), 'fehler'); }
      }
      App.zeichneBaum();
      UI.toast(n + (n === 1 ? ' Datei eingelesen' : ' Dateien eingelesen'));
    });
    inp.click();
  };

  const ordnerLesen = async () => {
    if (!(window as any).showDirectoryPicker) { dateienLesen(); return; }
    try {
      const ordner = await (window as any).showDirectoryPicker();
      let n = 0;
      const lies = async (verzeichnis: any, elternId: any) => {
        for await (const [name, eintrag] of verzeichnis.entries()) {
          if (eintrag.kind === 'file' && /\.(md|markdown|txt)$/i.test(name)) {
            const f = await eintrag.getFile();
            await mdDateiAnlegen(name, await f.text(), elternId);
            n++;
          } else if (eintrag.kind === 'directory') {
            const p = Store.addPage(elternId, { text: name, icon: '📁' });
            await lies(eintrag, p.id);
          }
        }
      };
      await lies(ordner, null);
      App.zeichneBaum();
      UI.toast(n + ' Dateien eingelesen');
    } catch (err: unknown) {
      if (!(err instanceof Error) || err.name !== 'AbortError')
        UI.toast('Ordner konnte nicht gelesen werden');
    }
  };

  const mdDateiAnlegen = async (dateiname: any, text: string, elternId?: any) => {
    const zeilen = text.split('\n');
    let titel = dateiname.replace(/\.(md|markdown|txt)$/i, '');
    const erste = zeilen[0] ?? '';
    if (/^#\s+/.test(erste)) { titel = erste.replace(/^#\s+/, '').trim(); zeilen.shift(); }
    const p = Store.addPage(elternId, { text: titel, icon: '📄' });
    ausMarkdown(p, zeilen.join('\n'));
    return p;
  };

  const lade = (blob: any, name: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ========================================================================
   * 14. ALLES ALS EINE HTML-DATEI   (TiddlyWiki)
   * ------------------------------------------------------------------------
   * Eine Datei, die alle Seiten enthält und ohne Server läuft. Zum Weitergeben,
   * Archivieren oder einfach als Sicherung, die man auch ohne diese App lesen kann.
   * ======================================================================*/
  const einzelDatei = () => {
    const seiten = Links.seiten();
    const daten = seiten.map(p => ({
      id: p.id, titel: p.text || 'Ohne Titel', icon: p.icon || '📄',
      eltern: p.parentId || null,
      html: seiteAlsHtml(p)
    }));

    const doc =
`<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Redion — Archiv</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
     background:#191919;color:#e9e9e7;display:flex;height:100vh;overflow:hidden}
#s{width:280px;background:#202020;border-right:1px solid #373737;overflow-y:auto;padding:14px}
#s h1{font-size:15px;margin-bottom:12px}
#s input{width:100%;padding:8px 10px;background:#2b2b2b;border:1px solid #373737;border-radius:6px;
         color:inherit;outline:none;font:inherit;font-size:13.5px;margin-bottom:10px}
#s a{display:block;padding:5px 8px;border-radius:5px;color:#9b9a97;text-decoration:none;font-size:14px;cursor:pointer}
#s a:hover,#s a.on{background:#2f2f2f;color:#e9e9e7}
#m{flex:1;overflow-y:auto;padding:44px 8vw 30vh}
h2{font-size:34px;margin-bottom:18px;letter-spacing:-.4px}
h3{font-size:24px;margin:22px 0 8px}h4{font-size:19px;margin:18px 0 6px}
p{margin:5px 0}li{margin-left:22px}blockquote{border-left:3px solid #666;padding-left:14px;margin:8px 0}
pre{background:#252525;padding:14px;border-radius:6px;overflow-x:auto;font-size:13.5px;margin:8px 0}
code{background:#252525;padding:1px 5px;border-radius:3px;font-size:13.5px}
hr{border:none;border-top:1px solid #373737;margin:14px 0}
table{border-collapse:collapse;margin:10px 0;font-size:14px}
td,th{border:1px solid #373737;padding:6px 9px;text-align:left}
.cal{background:#252525;border-radius:6px;padding:14px;margin:8px 0}
img{max-width:100%;border-radius:4px}
.tag{background:#454b4e;padding:1px 7px;border-radius:3px;font-size:12.5px}
@media(max-width:760px){body{flex-direction:column}#s{width:100%;height:180px}}
</style></head><body>
<div id="s"><h1>📓 Redion</h1><input id="q" placeholder="Suchen …"><div id="nav"></div></div>
<div id="m"></div>
<script>
const D = ${JSON.stringify(daten)};
const nav = document.getElementById('nav'), m = document.getElementById('m');
const zeichneNav = (f='') => {
  nav.innerHTML = '';
  D.filter(p => !f || (p.titel+p.html).toLowerCase().includes(f.toLowerCase())).forEach(p => {
    const a = document.createElement('a');
    a.textContent = p.icon + ' ' + p.titel;
    a.onclick = () => oeffne(p.id);
    a.dataset.id = p.id;
    nav.appendChild(a);
  });
};
const oeffne = (id) => {
  const p = D.find(x => x.id === id); if (!p) return;
  m.innerHTML = '<h2>' + p.icon + ' ' + p.titel + '</h2>' + p.html;
  m.scrollTop = 0;
  [...nav.children].forEach(a => a.classList.toggle('on', a.dataset.id === id));
  location.hash = id;
};
document.getElementById('q').oninput = e => zeichneNav(e.target.value);
zeichneNav();
oeffne(location.hash.slice(1) || (D[0] && D[0].id));
<\/script></body></html>`;

    lade(new Blob([doc], { type: 'text/html' }), 'notizen-archiv-' + heute() + '.html');
    UI.toast(seiten.length + ' Seiten in eine HTML-Datei gepackt');
  };

  /** Eine Seite als HTML — für Archiv, Einzelexport und Drucken. */
  const seiteAlsHtml = (p: any) => {
    const raus = (id: string, tiefe: number) => {
      let h = '';
      Store.childrenOf(id).forEach((b: any) => {
        const t = b.text || '';
        if (b.type === 'h1') h += `<h3>${Blocks.inline(t)}</h3>`;
        else if (b.type === 'h2') h += `<h4>${Blocks.inline(t)}</h4>`;
        else if (b.type === 'h3') h += `<h4>${Blocks.inline(t)}</h4>`;
        else if (b.type === 'bullet') h += `<li>${Blocks.inline(t)}</li>`;
        else if (b.type === 'number') h += `<li>${Blocks.inline(t)}</li>`;
        else if (b.type === 'todo') h += `<li>${b.checked ? '☑' : '☐'} ${Blocks.inline(t)}</li>`;
        else if (b.type === 'toggle') h += `<details open><summary>${Blocks.inline(t)}</summary>${raus(b.id, tiefe + 1)}</details>`;
        else if (b.type === 'quote') h += `<blockquote>${Blocks.inline(t)}</blockquote>`;
        else if (b.type === 'callout') h += `<div class="cal">${esc(b.icon || '💡')} ${Blocks.inline(t)}</div>`;
        else if (b.type === 'code') h += `<pre>${esc(t)}</pre>`;
        else if (b.type === 'equation') h += `<div>${Zusatz.mathe(t)}</div>`;
        else if (b.type === 'divider') h += '<hr>';
        else if (b.type === 'image' && b.src) h += `<img src="${esc(b.src)}" alt="${esc(b.caption || '')}">`;
        else if (b.type === 'table') h += tabelleHtml(b);
        else if (b.type === 'database') h += datenbankHtml(b);
        else if (b.type === 'page') h += `<p>📄 <b>${esc(t || 'Ohne Titel')}</b></p>`;
        else if (t) h += `<p>${Blocks.inline(t)}</p>`;
        /* NICHT in Unterseiten hineingehen. Eine Unterseite steht hier mit
           ihrem Titel da — und genau das hat der Mensch gesehen, als er auf
           „Veröffentlichen" drückte. Vorher lief diese Zeile auch über
           `page`, und der ganze Inhalt jeder Unterseite hing rekursiv mit
           im veröffentlichten HTML: wer „Projekt X" freigab, gab die
           Unterseite „Gehälter" gleich mit frei, ohne dass irgendwo etwas
           davon stand. Eine eigene Seite wird eigens veröffentlicht.
           `toggle` steht schon hier, weil es seine Kinder selbst einfügt. */
        if (b.type !== 'toggle' && b.type !== 'page') h += raus(b.id, tiefe + 1);
      });
      return h;
    };
    return raus(p.id, 0);
  };

  const tabelleHtml = (b: any) => {
    const rows = b.rows || [];
    return '<table>' + rows.map((z: any, i: any) => '<tr>' + z.map((c: any) =>
      (b.kopfZeile !== false && i === 0) ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
  };

  const datenbankHtml = (b: any) => {
    const c = Store.getCollection(b.collectionId);
    if (!c) return '';
    const keys = Object.keys(c.schema);
    return `<p><b>${esc(c.name || 'Datenbank')}</b></p><table><tr>` +
      keys.map(k => `<th>${esc(c.schema[k].name)}</th>`).join('') + '</tr>' +
      Store.rowsOf(c.id).map(r => '<tr>' + keys.map(k =>
        `<td>${esc(Formula.anzeige(Datenbank.wert(r, k, c)))}</td>`).join('') + '</tr>').join('') +
      '</table>';
  };

  const htmlExport = (p: any) => {
    const doc = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(p.text || 'Seite')}</title>` +
      '<style>body{font:16px/1.65 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px}' +
      'pre{background:#f5f5f4;padding:14px;border-radius:6px;overflow-x:auto}code{background:#f5f5f4;padding:1px 5px;border-radius:3px}' +
      'blockquote{border-left:3px solid #ddd;padding-left:14px;color:#555}table{border-collapse:collapse}' +
      'td,th{border:1px solid #ddd;padding:6px 9px}.cal{background:#f5f5f4;padding:14px;border-radius:6px}' +
      'img{max-width:100%}</style></head><body>' +
      `<h1>${esc(p.icon || '')} ${esc(p.text || 'Ohne Titel')}</h1>` + seiteAlsHtml(p) + '</body></html>';
    lade(new Blob([doc], { type: 'text/html' }), sauber(p.text) + '.html');
    UI.toast('Als HTML gespeichert');
  };

  const drucken = (p: any) => {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0';
    document.body.appendChild(f);
    const d = f.contentDocument;
    /* Ohne Dokument im Rahmen gibt es nichts zu drucken. */
    if (!d) { f.remove(); return; }
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(p.text || 'Seite') + '</title>' +
      '<style>body{font:12pt/1.6 Georgia,serif;margin:22mm}h1{font-size:22pt}h3{font-size:16pt}h4{font-size:13pt}' +
      'pre{background:#f2f2f2;padding:10px;white-space:pre-wrap}table{border-collapse:collapse;width:100%}' +
      'td,th{border:1px solid #999;padding:5px 8px;font-size:10.5pt}img{max-width:100%}' +
      '.cal{background:#f2f2f2;padding:10px;border-radius:4px}</style></head><body>' +
      '<h1>' + esc(p.text || 'Ohne Titel') + '</h1>' + seiteAlsHtml(p) + '</body></html>');
    d.close();
    setTimeout(() => {
      f.contentWindow?.focus(); f.contentWindow?.print();
      setTimeout(() => f.remove(), 1000);
    }, 300);
  };

  /* ========================================================================
   * 15. VERSCHIEBEN NACH   (Notion „Move to")
   * ======================================================================*/
  const verschiebenNach = (p: any) => {
    const ziele = Links.seiten().filter(z => z.id !== p.id && !istUnter(z.id, p.id));
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder">' +
        '<input id="vq" placeholder="Wohin verschieben? Seite suchen …" autocomplete="off">' +
        '<div class="res" id="vr"></div>' +
        '<div class="hint">Enter wählt · Esc bricht ab</div>' +
      '</div>';
    document.body.appendChild(o);
    const inp = o.querySelector<HTMLInputElement>('#vq');
    const res = o.querySelector<HTMLElement>('#vr');
    if (!inp || !res) return;

    const zeichne = (q = '') => {
      const liste = ziele.filter(z => !q || (z.text || '').toLowerCase().includes(q.toLowerCase())).slice(0, 30);
      res.innerHTML =
        '<button data-id="__root"><span>🏠</span><span style="flex:1">Oberste Ebene</span></button>' +
        liste.map(z => `<button data-id="${z.id}"><span>${esc(z.icon || '📄')}</span>` +
          `<span style="flex:1">${esc(z.text || 'Ohne Titel')}</span>` +
          `<span class="pth">${esc(Store.pathOf(z.id).slice(0, -1).map(x => x.text).join(' / '))}</span></button>`).join('');
    };
    zeichne();
    inp.addEventListener('input', () => zeichne(inp.value));
    inp.addEventListener('keydown', e => { if (e.key === 'Escape') o.remove(); });
    res.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-id]');
      if (!b) return;
      const ziel = b.dataset.id === '__root' ? null : b.dataset.id;
      verschiebe(p, ziel);
      o.remove();
    });
    inp.focus();
  };


  const verschiebe = (p: any, zielId: any) => {
    const alt = Store.getBlock(p.parentId);
    if (alt) {
      alt.content = alt.content.filter((x: any) => x !== p.id);
      Store.updateBlock(alt.id, { content: alt.content });
    }
    Store.updateBlock(p.id, { parentId: zielId });
    if (zielId) {
      const z = Store.getBlock(zielId);
      z.content = z.content || [];
      z.content.push(p.id);
      Store.updateBlock(z.id, { content: z.content, aufgeklappt: true });
    }
    App.zeichneBaum();
    App.zeichneSeite();
    UI.toast('Verschoben');
  };

  /* ========================================================================
   * 16. WIKI   (Notions „In Wiki umwandeln")
   * ------------------------------------------------------------------------
   * Eine Seite wird zum Verzeichnis ihrer Unterseiten — mit Besitzer und
   * dem Vermerk, ob der Inhalt geprüft ist.
   * ======================================================================*/
  const wikiUmwandeln = (p: any) => {
    Store.updateBlock(p.id, { wiki: !p.wiki, icon: p.wiki ? (p.icon || '📄') : '📚' });
    App.zeichneSeite(); App.zeichneBaum();
    UI.toast(p.wiki ? 'Wieder eine normale Seite' : 'In ein Wiki umgewandelt');
  };

  const wikiIndex = (p: any, wrap: any) => {
    const kinder = Store.childrenOf(p.id).filter((k: any) => k.type === 'page');

    const d = document.createElement('div');
    d.className = 'wiki';
    d.innerHTML =
      '<div class="wiki-kopf"><b>📚 Wiki</b>' +
      `<span>${kinder.length} Seiten · ${kinder.filter((k: any) => k.geprueft).length} geprüft</span>` +
      '<button data-a="neu">＋ Seite</button></div>' +
      (kinder.length
        ? '<table class="wiki-tab"><tr><th>Seite</th><th>Besitzer</th><th>Zuletzt geändert</th><th>Geprüft</th></tr>' +
          kinder.map((k: any) =>
            `<tr data-id="${k.id}">` +
              `<td class="w-t">${esc(k.icon || '📄')} ${esc(k.text || 'Ohne Titel')}</td>` +
              `<td>${esc(k.besitzer || Store.getMeta('nutzer', 'Ich'))}</td>` +
              `<td>${esc(zeitKurz(k.edited))}</td>` +
              `<td><button class="w-pruef${k.geprueft ? ' ja' : ''}" data-pruef="${k.id}">` +
              `${k.geprueft ? '✓ geprüft' : 'prüfen'}</button></td>` +
            '</tr>').join('') + '</table>'
        : '<div class="wiki-leer">Noch keine Unterseiten. Lege die erste an.</div>');

    d.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) {
        const k = Store.addPage(p.id, { text: '' });
        Store.updateBlock(p.id, { aufgeklappt: true });
        App.zeichneBaum(); App.oeffne(k.id);
        return;
      }
      const pr = elVon(e)?.closest<HTMLElement>('[data-pruef]');
      if (pr) {
        const k = Store.getBlock(pr.dataset.pruef);
        Store.updateBlock(k.id, { geprueft: !k.geprueft, besitzer: Store.getMeta('nutzer', 'Ich') });
        App.zeichneSeite();
        return;
      }
      const tr = elVon(e)?.closest<HTMLElement>('tr[data-id]');
      if (tr) App.oeffne(tr.dataset.id);
    });
    wrap.appendChild(d);
  };

  /* ========================================================================
   * 17. TEILEN   (Notions „Share")
   * ------------------------------------------------------------------------
   * Ohne Server gibt es niemanden, dem man etwas freigeben könnte — dafür
   * jede Form, die Seite aus der Hand zu geben.
   * ======================================================================*/
  const teilenMenue = (anker: any, p: any) => {
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      '<div class="grp">Diese Seite weitergeben</div>' +
      '<button data-a="link"><span class="mi">🔗</span>Link kopieren</button>' +
      '<button data-a="text"><span class="mi">⎘</span>Als Text kopieren</button>' +
      '<button data-a="md"><span class="mi">⭳</span>Als Markdown speichern</button>' +
      '<button data-a="html"><span class="mi">🌐</span>Als HTML-Seite speichern</button>' +
      '<button data-a="pdf"><span class="mi">🖨</span>Drucken oder als PDF</button>' +
      '<button data-a="word"><span class="mi">📘</span>Als Word-Datei (.docx)</button>' +
      '<button data-a="excel"><span class="mi">📗</span>Datenbanken als Excel (.xlsx)</button>' +
      '<hr>' +
      '<button data-a="alles"><span class="mi">📦</span>Alles als eine HTML-Datei</button>' +
      '<button data-a="ordner"><span class="mi">📁</span>Alles als Markdown-Ordner</button>' +
      '<hr>' +
      '<div class="teilen-hinweis">Es gibt keinen Server und kein Konto — ' +
      'deshalb auch keine Freigabe ins Netz. Weitergeben heisst hier: eine Datei erzeugen.</div>',
      r.right - 240, r.bottom + 6);

    m.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      m.remove();
      const a = b.dataset.a;
      if (a === 'link') { navigator.clipboard?.writeText(location.origin + location.pathname + '#' + p.id); UI.toast('Link kopiert'); }
      if (a === 'text') { navigator.clipboard?.writeText(alsMarkdown(p)); UI.toast('Text kopiert'); }
      if (a === 'md') App.markdownExport(p);
      if (a === 'html') htmlExport(p);
      if (a === 'pdf') drucken(p);
      if (a === 'word')  { Austausch.alsWord(p).then(() => UI.toast('Word-Datei erzeugt'))
        .catch((e: unknown) => UI.toast('Die Word-Datei kam nicht zustande: ' +
          (e instanceof Error ? e.message : String(e)))); }
      if (a === 'excel') { Austausch.allesAlsExcel()?.catch((e: unknown) =>
        UI.toast('Die Excel-Mappe kam nicht zustande: ' +
          (e instanceof Error ? e.message : String(e)))); }
      if (a === 'alles') einzelDatei();
      if (a === 'ordner') ordnerSchreiben();
    });
  };

  /* ========================================================================
   * 18. KLEINIGKEITEN
   * ======================================================================*/
  const alleToggles = () => {
    const bloecke = document.querySelectorAll<HTMLElement>('.b-toggle');
    const alleAuf = [...bloecke].every(b => b.classList.contains('open'));
    bloecke.forEach(b => {
      const id = b.dataset.bid;
      if (id) Store.updateBlock(id, { open: !alleAuf });
    });
    App.zeichneSeite();
  };

  /* ========================================================================
   * FORMEL-BIBLIOTHEK — eigene Funktionen
   * ------------------------------------------------------------------------
   * Notions Formelsprache hat kein LAMBDA: Logik, die man mehrfach braucht,
   * muss man mehrfach hinschreiben — und läuft dann in die 15-Ebenen-Grenze.
   * Hier definiert man sie einmal und ruft sie überall auf.
   * ======================================================================*/
  const BEISPIELE = [
    { name: 'istWerktag',  params: ['d'],
      koerper: 'not isWeekend(d)', beschreibung: 'Fällt das Datum auf Montag bis Freitag?' },
    { name: 'alter',       params: ['geburtstag'],
      koerper: 'dateBetween(today(), geburtstag, "years")', beschreibung: 'Alter in Jahren' },
    { name: 'restTage',    params: ['faellig'],
      koerper: 'dateBetween(faellig, today(), "days")', beschreibung: 'Tage bis zur Frist' },
    { name: 'ampel',       params: ['tage'],
      koerper: 'ifs(tage < 0, "🔴", tage <= 3, "🟡", "🟢")', beschreibung: 'Farbe nach Resttagen' },
    { name: 'mitMwst',     params: ['netto'],
      koerper: 'roundTo(netto * 1.081, 2)', beschreibung: 'Schweizer Mehrwertsteuer aufschlagen' },
    { name: 'balken',      params: ['anteil'],
      koerper: 'let(n, round(anteil * 10), repeat("█", n) + repeat("░", 10 - n))',
      beschreibung: 'Fortschrittsbalken aus einem Anteil zwischen 0 und 1' }
  ];

  const formelBibliothekLesen = () => Store.getMeta('formelBibliothek', []) || [];

  /** Beim Start einlesen, damit die Funktionen sofort in Formeln gelten. */
  const formelBibliothekAnwenden = () => {
    const kaputt = Formula.setzeBibliothek(formelBibliothekLesen());
    if (kaputt.length) UI.banner('Eigene Formelfunktion nicht lesbar: ' + kaputt.join(' · '), 'warn');
    return kaputt;
  };

  const formelBibliothek = () => {
    let liste = formelBibliothekLesen().slice();

    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(720px,95vw)">' +
        '<div class="fh">∑ Eigene Formelfunktionen<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="dl-hinweis" style="padding:10px 18px">' +
          'Einmal hier definiert, überall nutzbar — auch ineinander. ' +
          'Notion hat das nicht: dort muss dieselbe Logik in jeder Formel stehen.' +
        '</div>' +
        '<div class="res" id="fb-liste" style="max-height:52vh"></div>' +
        '<div class="fbtns">' +
          '<button data-a="neu">＋ Funktion</button>' +
          '<button data-a="beispiele">Beispiele einfügen</button>' +
          '<button data-a="ok" class="prim">Speichern</button>' +
          '<button data-a="zu">Schliessen</button></div>' +
      '</div>';
    document.body.appendChild(o);

    const zeichne = (): void => {
      const kasten = o.querySelector('#fb-liste');
      if (!kasten) return;
      kasten.innerHTML = liste.length
        ? liste.map((f: any, i: any) =>
            '<div class="fb-zeile" data-i="' + i + '">' +
              '<div class="fb-kopf">' +
                `<input class="fb-name" value="${esc(f.name || '')}" placeholder="name">` +
                `<span class="fb-klammer">(</span>` +
                `<input class="fb-params" value="${esc((f.params || []).join(', '))}" placeholder="a, b">` +
                `<span class="fb-klammer">) =</span>` +
                `<button data-weg="${i}" title="Löschen">🗑</button>` +
              '</div>' +
              `<textarea class="fb-koerper" rows="2" spellcheck="false" ` +
                `placeholder="Formel — die Parameter stehen als Namen zur Verfügung">${esc(f.koerper || '')}</textarea>` +
              `<input class="fb-besch" value="${esc(f.beschreibung || '')}" placeholder="Wozu ist sie gut?">` +
              '<div class="fb-probe"></div>' +
            '</div>').join('')
        : '<div style="padding:22px; color:var(--text-faint); font-size:14px; text-align:center">' +
          'Noch keine eigene Funktion. „Beispiele einfügen" zeigt sechs nützliche.</div>';
      pruefen();
    };

    /* Nach jeder Änderung wird jede Funktion geparst und, wenn sie ohne
       Parameter auskommt, gleich einmal ausgerechnet. */
    const einsammeln = () => {
      const wert = (z: Element, kl: string) =>
        (z.querySelector<HTMLInputElement>(kl)?.value ?? '').trim();
      liste = [...o.querySelectorAll('.fb-zeile')].map(z => ({
        name: wert(z, '.fb-name'),
        params: wert(z, '.fb-params').split(',').map((x: any) => x.trim()).filter(Boolean),
        koerper: wert(z, '.fb-koerper'),
        beschreibung: wert(z, '.fb-besch')
      })).filter(f => f.name);
      return liste;
    };

    const pruefen = () => {
      o.querySelectorAll('.fb-zeile').forEach(z => {
        const koerper = (z.querySelector<HTMLTextAreaElement>('.fb-koerper')?.value ?? '').trim();
        const feld = z.querySelector<HTMLElement>('.fb-probe');
        if (!feld) return;
        if (!koerper) { feld.textContent = ''; return; }
        const c = Formula.check(koerper);
        if (!c.ok) { feld.className = 'fb-probe schlecht'; feld.textContent = '⚠ ' + c.fehler; return; }
        feld.className = 'fb-probe gut';
        feld.textContent = '✓ lesbar';
      });
    };

    o.addEventListener('input', pruefen);
    o.addEventListener('click', e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) {
        if (!elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) { o.remove(); return; }
      }
      const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (weg) { einsammeln(); liste.splice(Number(weg.dataset.weg), 1); zeichne(); return; }
      if (elVon(e)?.closest<HTMLElement>('[data-a="neu"]')) {
        einsammeln();
        liste.push({ name: '', params: [], koerper: '', beschreibung: '' });
        zeichne(); return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="beispiele"]')) {
        einsammeln();
        BEISPIELE.forEach(b => { if (!liste.some((f: any) => f.name === b.name)) liste.push({ ...b }); });
        zeichne(); return;
      }
      if (elVon(e)?.closest<HTMLElement>('[data-a="ok"]')) {
        einsammeln();
        Store.setMeta('formelBibliothek', liste);
        const kaputt = formelBibliothekAnwenden();
        o.remove();
        UI.toast(kaputt.length
          ? liste.length + ' gespeichert, ' + kaputt.length + ' mit Fehler'
          : liste.length + ' eigene Funktionen stehen jetzt in jeder Formel bereit');
        App.zeichneSeite();
      }
    });

    zeichne();
  };

  const tastenkuerzel = () => {
    /* Die Liste steht in register/tasten.js — dort wird ein Kürzel
       eingetragen, und diese Übersicht zeigt es danach von selbst. */
    const G = Register.tasten.alle();
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML =
      '<div class="finder" style="width:min(760px,95vw)">' +
        '<div class="fh">Tastenkürzel' +
          `<em>${G.reduce((n: any, [, l]: any[]) => n + l.length, 0)}</em>` +
          '<button class="icon-btn" data-a="umlegen" title="Kürzel umbelegen">✎</button>' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        '<div class="kuerzel">' + G.map(([g, liste]: any[]) =>
          `<div class="kb"><div class="grp">${g}</div>` + liste.map(([k, w]: any[]) =>
            `<div class="kz"><code>${esc(k)}</code><span>${esc(w)}</span></div>`).join('') + '</div>').join('') +
        '</div></div>';
    document.body.appendChild(o);
    o.addEventListener('click', e => {
      if (elVon(e)?.closest<HTMLElement>('[data-a="umlegen"]')) { o.remove(); Aussehen.dialog(); return; }
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) o.remove();
    });
  };

  /* ========================================================================
   * ZUSATZEINTRÄGE IM SEITENMENÜ
   * ======================================================================*/
  const seitenMenueZusatz = (p: any) => (
    '<hr>' +
    '<button data-a="wz-vorlage"><span class="mi">🧩</span>Als Vorlage speichern</button>' +
    '<button data-a="wz-vorlage-ein"><span class="mi">＋</span>Aus Vorlage einfügen</button>' +
    '<button data-a="wz-versionen"><span class="mi">🕘</span>Versionsverlauf</button>' +
    `<button data-a="wz-wiki"><span class="mi">📚</span>${p.wiki ? 'Wiki auflösen' : 'In Wiki umwandeln'}</button>` +
    '<button data-a="wz-teilen"><span class="mi">↗</span>Teilen und ausgeben</button>' +
    '<button data-a="wz-erinnerung"><span class="mi">⏰</span>Erinnerung</button>' +
    '<hr>' +
    `<button data-a="wz-sperren"><span class="mi">🔒</span>${p.locked ? 'Entschlüsseln' : 'Verschlüsseln'}</button>` +
    '<hr>' +
    '<button data-a="wz-fokus"><span class="mi">◎</span>Fokus-Modus<span class="ms">Strg Shift F</span></button>' +
    '<button data-a="wz-quelltext"><span class="mi">⌨</span>Markdown-Quelltext</button>' +
    '<button data-a="wz-statistik"><span class="mi">📊</span>Statistik</button>' +
    '<hr>' +
    '<button data-a="wz-html"><span class="mi">⭳</span>Als HTML</button>' +
    '<button data-a="wz-drucken"><span class="mi">🖨</span>Drucken / PDF</button>'
  );

  const seitenMenueAktion = (a: any, p: any) => {
    const karte = {
      'wz-vorlage': () => alsVorlage(p),
      'wz-vorlage-ein': () => vorlageEinfuegen(p),
      'wz-verschieben': () => verschiebenNach(p),
      'wz-versionen': () => versionen(p),
      'wz-wiki': () => wikiUmwandeln(p),
      'wz-teilen': () => teilenMenue(document.getElementById('btn-page-menu'), p),
      'wz-erinnerung': () => erinnerungSetzen(p),
      'wz-sperren': () => p.locked ? entsperren(p) : sperren(p),
      'wz-gesperrt': () => {
        Store.updateBlock(p.id, { gesperrt: !p.gesperrt });
        App.zeichneSeite();
        UI.toast(p.gesperrt ? 'Bearbeiten wieder erlaubt' : 'Seite gegen Bearbeiten gesperrt');
      },
      'wz-fokus': () => fokus(),
      'wz-praesi': () => praesentation(p),
      'wz-quelltext': () => quelltext(p),
      'wz-statistik': () => statistik(p),
      'wz-html': () => htmlExport(p),
      'wz-drucken': () => drucken(p)
    };
    const tuIt = (karte as Record<string, () => void>)[a];
    if (!tuIt) return false;
    tuIt();
    return true;
  };

  /* ========================================================================
   * START
   * ======================================================================*/
  /**
   * Räumt den Papierkorb nach der eingestellten Frist auf (wie Notions
   * 30 Tage). Die Frist selbst steht in `kern/ablage` — hier reicht nur
   * noch der Name durch, weil er zur öffentlichen Fläche dieses Bereichs
   * gehört und aussen gerufen wird.
   *
   * Vorher rechnete diese Fassung die Frist selbst, und in
   * `bereiche/einstellungen/pflege.js` stand eine zweite, die auf zwei
   * Feldnamen zeigte, die es nie gab. Die eine räumte, die andere fand nie
   * etwas — und beide räumten nur Seiten, nie die weggelegten Blöcke.
   *
   * Aufgeräumt wird nur noch an einer Stelle. Gemeldet wird hier: eine
   * Zahl, die niemand sieht, ist keine Aufräumung, sondern ein Verschwinden.
   */
  const papierkorbAufraeumen = async () => {
    const weg = await Store.papierkorbAufraeumen();
    if (weg) UI.toast(weg + (weg === 1 ? ' Ding war' : ' Dinge waren') +
                      ' zu lange im Papierkorb und wurde' + (weg === 1 ? '' : 'n') +
                      ' endgültig gelöscht');
    return weg;
  };

  /* ========================================================================
   * DATEIEN AUF DIE SEITE ZIEHEN
   * ------------------------------------------------------------------------
   * Markdown, Text, CSV, TSV, HTML und Bilder — einfach fallen lassen.
   * ======================================================================*/
  const ziehenUndAblegen = () => {
    const bereich = document.getElementById('scroll');
    if (!bereich) return;

    bereich.addEventListener('dragover', e => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      bereich.classList.add('ablegen');
    });
    bereich.addEventListener('dragleave', e => {
      if (e.target === bereich) bereich.classList.remove('ablegen');
    });

    bereich.addEventListener('drop', async e => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      bereich.classList.remove('ablegen');
      const seite = App.aktuelleSeite();
      if (!seite) { UI.toast('Erst eine Seite öffnen'); return; }

      for (const f of e.dataTransfer.files) {
        const name = f.name.toLowerCase();

        if (f.type.startsWith('image/')) {
          if (f.size > 12 * 1024 * 1024) { UI.toast(f.name + ' ist grösser als 12 MB'); continue; }
          const daten = await new Promise(ok => {
            const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f);
          });
          Store.addBlock(seite, 'image', { src: daten, caption: f.name });
          continue;
        }

        /* Excel, Word und EPUB laufen über den eigenen ZIP-Leser */
        if (/\.(xlsx|xlsm|docx|epub)$/i.test(name)) {
          try {
            const erg = await Einlesen.datei(f, seite);
            if (erg) { UI.toast(f.name + ': ' + erg.hinweis); continue; }
          } catch (err: unknown) {
            UI.banner(f.name + ' liess sich nicht lesen: ' +
              (err instanceof Error ? err.message : String(err)), 'fehler');
            continue;
          }
        }

        const text = await f.text();

        if (name.endsWith('.csv') || name.endsWith('.tsv')) {
          const zeilen = Datenbank.csvZerlegen(text.replace(/^﻿/, ''));
          if (zeilen.length < 2) { UI.toast(f.name + ' enthält keine Tabelle'); continue; }
          const kopf2 = (zeilen[0] ?? []).map((x: any) => String(x).trim());
          const schema: Record<string, any> = { title: { name: kopf2[0] || 'Name', type: 'title' } };
          const karte = ['title'];
          kopf2.slice(1).forEach((n: any, i: any) => {
            const k = 's' + i;
            schema[k] = { name: n || 'Spalte ' + (i + 2), type: 'text' };
            karte.push(k);
          });
          const { collectionId } = Store.addDatabase(seite, f.name.replace(/\.(csv|tsv)$/i, ''), schema, 'table');
          zeilen.slice(1).forEach((z: any) => {
            const props: Record<string, any> = {};
            karte.forEach((k, i) => { if (k !== 'title') props[k] = z[i] ?? ''; });
            const r = Store.addRow(collectionId, props);
            Store.updateBlock(r.id, { text: z[0] || 'Ohne Titel' });
          });
          UI.toast(f.name + ': ' + (zeilen.length - 1) + ' Einträge als Datenbank angelegt');
          continue;
        }

        if (name.endsWith('.html') || name.endsWith('.htm')) {
          ausHtml(seite, text);
          UI.toast(f.name + ' eingelesen');
          continue;
        }

        if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
          const p2 = Store.addPage(seite, { text: f.name.replace(/\.(md|markdown|txt)$/i, ''), icon: '📄' });
          ausMarkdown(p2, text);
          UI.toast(f.name + ' als Unterseite angelegt');
          continue;
        }

        /* Alles andere als Datei anhängen */
        if (f.size <= 12 * 1024 * 1024) {
          const daten = await new Promise(ok => {
            const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f);
          });
          Store.addBlock(seite, 'file', { src: daten, text: f.name });
        } else UI.toast(f.name + ' ist grösser als 12 MB');
      }
      App.zeichneSeite();
      App.zeichneBaum();
    });
  };

  /** HTML in Blöcke übersetzen — für Ziehen und Ablegen und den Import. */
  const ausHtml = (seiteId: string, html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const raus = (knoten: any) => {
      knoten.childNodes.forEach((n: any) => {
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        const txt = (n.textContent || '').trim();
        if (['h1','h2','h3','h4','h5','h6'].includes(tag) && txt) {
          Store.addBlock(seiteId, tag === 'h1' ? 'h1' : tag === 'h2' ? 'h2' : 'h3', { text: txt });
        } else if (tag === 'p' && txt) {
          Store.addBlock(seiteId, 'text', { text: txt });
        } else if (tag === 'li' && txt) {
          Store.addBlock(seiteId, n.parentElement?.tagName === 'OL' ? 'number' : 'bullet', { text: txt });
        } else if (tag === 'blockquote' && txt) {
          Store.addBlock(seiteId, 'quote', { text: txt });
        } else if (tag === 'pre') {
          Store.addBlock(seiteId, 'code', { text: n.textContent || '' });
        } else if (tag === 'hr') {
          Store.addBlock(seiteId, 'divider');
        } else if (tag === 'img' && n.getAttribute('src')) {
          /* Die einzige Stelle in `ausHtml`, an der etwas anderes als Text aus
             dem fremden Dokument übernommen wird. `Sanitize.url` lässt
             http(s) und `data:image/…` durch und wirft `javascript:` weg. Ein
             `<img>` führt eine solche Adresse zwar nicht aus — aber der Wert
             bleibt gespeichert, und was morgen daraus liest, weiss niemand. */
          const bildSrc = Sanitize.url(n.getAttribute('src'));
          if (bildSrc)
            Store.addBlock(seiteId, 'image', { src: bildSrc, caption: n.getAttribute('alt') || '' });
          else
            Store.addBlock(seiteId, 'text',
              { text: '⚠ Bild ausgelassen — die Adresse war kein Verweis: ' +
                      String(n.getAttribute('src')).slice(0, 120) });
        } else if (tag === 'table') {
          const rows = [...n.querySelectorAll('tr')].map(tr =>
            [...tr.querySelectorAll('th,td')].map(td => (td.textContent || '').trim()));
          if (rows.length) Store.addBlock(seiteId, 'table', { rows, kopfZeile: true });
        } else {
          raus(n);
        }
      });
    };
    raus(doc.body);
  };

  const start = () => {
    ziehenUndAblegen();

    /* Erinnerungen alle halbe Minute prüfen */
    erinnerungenPruefen();
    setInterval(erinnerungenPruefen, 30000);
    /* Den Papierkorb stösst `Pflege.start()` an — einmal nach dem Start und
       danach täglich. Hier stand dasselbe noch einmal, drei Sekunden früher.
       Zwei Zeitgeber für dieselbe Arbeit sind kein doppelter Boden: sie
       sorgen dafür, dass man beim Suchen den falschen findet. */

    document.addEventListener('keydown', e => {
      const strg = e.ctrlKey || e.metaKey;
      if (!strg) return;
      /* Hat der Editor die Taste schon behandelt (z. B. Kommentar am Block)? */
      if (e.defaultPrevented) return;
      const k = e.key.toLowerCase();
      if (e.shiftKey && k === 'p') {
        e.preventDefault();
        const p2 = Store.getBlock(App.aktuelleSeite());
        if (p2) verschiebenNach(p2); else palette();
        return;
      }
      if (e.shiftKey && k === 'j') { e.preventDefault(); journal(); return; }
      if (e.shiftKey && k === 'm') { e.preventDefault(); schnellnotizen(); return; }
      if (e.shiftKey && k === 'g') { e.preventDefault(); Links.graph(); return; }
      if (e.shiftKey && k === 't') { e.preventDefault(); Links.tagRegister(); return; }
      if (e.shiftKey && k === 'f') { e.preventDefault(); fokus(); return; }
      if (e.altKey && k === 't')   { e.preventDefault(); alleToggles(); return; }
      /* Wie bei Notion: Strg+Alt+P präsentiert, Strg+Shift+P verschiebt.
         Die Palette rückt dafür auf Strg+Shift+K — beides steht in der
         Kürzelliste. */
      if (e.altKey && k === 'p')   {
        e.preventDefault();
        const p2 = Store.getBlock(App.aktuelleSeite());
        if (p2) praesentation(p2);
        return;
      }
      if (e.shiftKey && k === 'k') { e.preventDefault(); palette(); return; }
      if (k === '/')               { e.preventDefault(); tastenkuerzel(); return; }
    });
  };

  return {
    start, palette, befehle,
    journal, journalSeite, schnellnotizen, vorlagen, vorlagenOrdner, alsVorlage, vorlageEinfuegen, vorlagenListe,
    lernen, karten, faellig, teileKarte,
    versionen, versionAutomatisch, sperren, entsperren, sperrAnsicht,
    fokus, praesentation, quelltext, alsMarkdown, ausMarkdown, ausHtml, statistik,
    formelBibliothek, formelBibliothekLesen, formelBibliothekAnwenden,
    erinnerungSetzen, erinnerungen, erinnerungenPruefen, posteingangMelden, meldungen, meldungGelesen, meldungenLeeren,
    ordnerSchreiben, ordnerLesen, dateienLesen, einzelDatei,
    htmlExport, drucken, seiteAlsHtml, verschiebenNach, verschiebe,
    alleToggles, tastenkuerzel, systemSeite, datumLang, zeitKurz, papierkorbAufraeumen,
    wikiUmwandeln, wikiIndex, teilenMenue,
    seitenMenueZusatz, seitenMenueAktion
  };
})();

(window as any).Werkzeuge = Werkzeuge;
