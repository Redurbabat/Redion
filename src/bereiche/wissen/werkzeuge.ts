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

  const aliasDialog = (page: any): void => {
    if (!page?.id) return;
    const overlay = document.createElement('div'); overlay.className = 'overlay';
    const panel = document.createElement('div'); panel.className = 'finder';
    const header = document.createElement('div'); header.className = 'fh'; header.textContent = 'Aliasse · ' + (page.text || 'Ohne Titel');
    const close = document.createElement('button'); close.className = 'icon-btn'; close.textContent = '✕'; header.appendChild(close);
    const content = document.createElement('div'); content.style.padding = '16px';
    const hint = document.createElement('p');
    hint.textContent = 'Ein Alias pro Zeile, zum Beispiel FI, RCD oder Residual Current Device. Mehrdeutige Aliasse werden nie automatisch verlinkt.';
    hint.style.color = 'var(--text-dim)';
    const area = document.createElement('textarea'); area.rows = 8;
    area.style.cssText = 'width:100%;min-height:160px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text)';
    area.value = Links.aliasesVon(page).join('\n');
    const actions = document.createElement('div'); actions.className = 'fbtns';
    const cancel = document.createElement('button'); cancel.textContent = 'Abbrechen';
    const save = document.createElement('button'); save.className = 'prim'; save.textContent = 'Speichern';
    actions.append(cancel, save); content.append(hint, area, actions); panel.append(header, content); overlay.appendChild(panel); document.body.appendChild(overlay);
    const remove = () => overlay.remove(); close.addEventListener('click', remove); cancel.addEventListener('click', remove);
    overlay.addEventListener('mousedown', event => { if (event.target === overlay) remove(); });
    save.addEventListener('click', () => {
      const result = Links.aliasesSetzen(page.id, area.value.split(/[\n,;]+/));
      if (!result) return;
      remove(); App.zeichneBaum(); App.zeichneSeite();
      if (result.collisions.length) {
        UI.banner('Gespeichert. Mehrdeutig und deshalb nicht automatisch verlinkt: ' +
          result.collisions.map((entry: any) => entry.alias).join(', '), 'warn');
      } else UI.toast(result.aliases.length + (result.aliases.length === 1 ? ' Alias gespeichert' : ' Aliasse gespeichert'));
    });
    area.focus();
  };

  const obsidianVaultExport = async (): Promise<void> => {
    try {
      await Austausch.alsObsidianVault('Redion-Obsidian-' + heute());
      UI.toast('Obsidian-Vault mit stabilen IDs und Alias-Frontmatter gespeichert.');
    } catch (error) {
      UI.banner('Obsidian-Vault konnte nicht erzeugt werden: ' +
        (error instanceof Error ? error.message : String(error)), 'fehler');
    }
  };

  /* ========================================================================
   * 1. BEFEHLSPALETTE   (SilverBullet)
   * ------------------------------------------------------------------------
   * Ein Fenster, das jeden Befehl der App kennt. Strg + Shift + K.
   * ======================================================================*/
  const befehle = () => {
    const s = App.aktuelleSeite();
    const p = s ? Store.getBlock(s) : null;
    const b: any[] = [];
    const c = (gruppe: any, name: string, kurz: any, fn: any) => b.push({ gruppe, name, kurz, fn });

    c('Navigation', 'Suchen', 'Strg P', () => App.suche());
    c('Navigation', 'Neue Seite', 'Strg N', () => App.neueSeite());
    c('Navigation', 'Heute – Lernen & Alltag', '', () => Produktwelten.lernen('heute'));
    c('Navigation', 'Lernzentrum', '', () => Produktwelten.lernen('lernen'));
    c('Navigation', 'Lernpfad', '', () => Produktwelten.lernen('pfad'));
    c('Navigation', 'Fehlertraining', '', () => Produktwelten.lernen('fehler'));
    c('Navigation', 'Prüfungszentrum', '', () => Produktwelten.lernen('pruefungen'));
    c('Navigation', 'Arbeitsbereich', '', () => Produktwelten.workspace('start'));
    c('Navigation', 'Bibliothek', '', () => Produktwelten.bibliothek());
    c('Navigation', 'Aufgaben', '', () => Produktwelten.aufgaben());
    c('Navigation', 'Whiteboards', '', () => Produktwelten.whiteboards());
    /* DIE DREI DOMÄNEN FEHLTEN (Auftrag §29). Die Palette kannte „Lernpfad"
       und „Prüfungszentrum", aber nicht „Schule öffnen" — obwohl §29 genau
       diesen Satz als Beispiel nennt. Über die Reiter kommt man hin; wer
       Strg+Umschalt+P benutzt, sucht aber nicht erst die Reiterleiste. */
    c('Navigation', 'Schule und Ausbildung öffnen', '', () => Produktwelten.lernen('schule'));
    c('Navigation', 'Uni öffnen', '', () => Produktwelten.lernen('uni'));
    c('Navigation', 'Arbeit öffnen', '', () => Produktwelten.lernen('arbeit'));
    c('Navigation', 'Lernfortschritt', '', () => Produktwelten.lernen('fortschritt'));
    c('Navigation', 'Planung und Termine', '', () => Produktwelten.planung());
    c('Navigation', 'Hauptwelten und Lebensbereiche einrichten', '', () => ProduktOnboarding.oeffnen());
    c('Navigation', 'Posteingang', '', () => Ansichten.posteingang());
    c('Navigation', 'Tagesjournal öffnen', 'Strg Shift J', () => journal());
    c('Navigation', 'Schnellnotizen', 'Strg Shift M', () => schnellnotizen());
    c('Navigation', 'Graph aller Seiten', 'Strg Shift G', () => Links.graph());
    c('Navigation', 'Schlagwörter', 'Strg Shift T', () => Links.tagRegister());
    c('Navigation', 'Vorlagen', '', () => vorlagen());
    c('Navigation', 'Vorlagengalerie', '', () => Galerie.oeffne());
    c('Navigation', 'Karteikarten lernen', '', () => lernen());
    c('Navigation', 'Papierkorb', '', () => App.papierkorb());
    /* ANLEGEN, NICHT NUR HINGEHEN (Auftrag §29 und §46). Bis hierher konnte
       die Palette eine Ansicht öffnen, aber nichts Neues erzeugen ausser
       einer Seite. Die fünf Wege dahinter gibt es alle — sie standen nur
       nicht in der Liste, in der man sie sucht. */
    c('Anlegen', 'Neue Seite anlegen', 'Strg N', () => App.neueSeite());
    c('Anlegen', 'Neue Aufgabe', '', () => {
      const seite = App.neueSeite();
      setTimeout(() => {
        if (seite?.id) Store.addBlock(seite.id, 'todo', { text: '' });
        App.zeichneSeite();
      }, 80);
    });
    c('Anlegen', 'Neue Lernkarte', '', () => {
      const seite = App.neueSeite();
      setTimeout(() => {
        if (seite?.id) Store.addBlock(seite.id, 'flashcard', { text: '' });
        App.zeichneSeite();
      }, 80);
    });
    c('Anlegen', 'Neues Whiteboard', '', () => {
      const seite = App.neueSeite();
      setTimeout(() => {
        if (seite?.id) Store.addBlock(seite.id, 'whiteboard', { text: 'Whiteboard' });
        App.zeichneSeite();
      }, 80);
    });
    c('Anlegen', 'PDF oder Datei importieren', '', () => dateienLesen());
    c('Anlegen', 'Aufnahme starten', '', () => {
      if (typeof Meeting !== 'undefined' && Meeting.panel) Meeting.panel();
      else UI.toast('Die Aufnahme ist in dieser Fassung nicht geladen.');
    });
    c('Planen', 'Tagesplan', '', () => Plan.tagesplan());
    c('Planen', 'Wochenrückblick', '', () => Plan.wochenrueckblick());
    c('Planen', 'Zurückgestelltes ansehen', '', () => Plan.uebersicht());
    c('Navigation', 'Umsetzungsstand aller 16 Teile', '', () => Status.seiteAnlegen());
    c('Navigation', 'Zurück', 'Strg [', () => App.zurueck());
    c('Navigation', 'Vorwärts', 'Strg ]', () => App.vorwaerts());

    if (p) {
      c('Seite', 'Lebensbereiche zuordnen', '', () => Produktwelten.bereicheDialog(p));
      c('Seite', 'Seite umbenennen', '', () => {
        const n = prompt('Neuer Titel', p.text); if (n !== null) { Store.updateBlock(p.id, { text: n }); App.zeichneBaum(); App.zeichneSeite(); }
      });
      c('Seite', 'Aliasse bearbeiten', '', () => aliasDialog(p));
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
      c('Seite', 'Link kopieren', '', () => { Ablage.kopiereJetzt(location.origin + location.pathname + '#' + p.id, 'Link kopiert'); });
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
    c('Daten', 'Als Obsidian-Vault (.zip)', '', () => void obsidianVaultExport());
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
    /* Strg T und Strg W standen hier bis E300 — beide gehören dem Browser
       und werden von Redion gar nicht gebunden (die Begründung steht in
       `reiter.ts` bei `tasten`). Wer sie hier las und drückte, schloss sein
       Browserfenster; das ist ein Kürzel, das etwas anderes tut als
       angeschrieben. */
    c('Ansicht', 'Neuer Reiter', 'Strg Alt N', () => Fenster.neuerReiter());
    c('Ansicht', 'Reiter schliessen', 'Strg Alt W', () => Fenster.schliessen(Fenster.aktiv()));
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

    /* ══ SO VIELE ZEILEN WERDEN GEZEICHNET — UND NUR SO WEIT GEHT DER PFEIL
       ══ (E400)
       Hier stand `treffer.slice(0, 60)` beim Zeichnen und
       `Math.min(i + 1, treffer.length - 1)` beim Pfeil. Ohne Eingabe ist
       `treffer` die ganze Liste — und die ist laenger, als das Lesen des
       Quelltextes vermuten laesst: 163 Eintraege. (Von den 105 `c(`-Aufrufen
       sind zwei SCHLEIFEN — eine erzeugt 66 Befehle aus `Register.bloecke`,
       eine 0..n aus den Erweiterungen. Auf dem Bildschirm abgelesen: „103
       weitere" unter 60 gezeichneten Zeilen.)

       Ab dem 61. Druck auf ↓ zeigte also KEIN gezeichneter Knopf mehr `.on`,
       `scrollIntoView` fiel still durch das `?.`, auf dem Bildschirm bewegte
       sich nichts — und Enter fuehrte einen Befehl aus, den der Nutzer nie
       gesehen hatte. 103 Befehle waren so erreichbar, ohne sichtbar zu sein.

       Eine Zahl, nicht zwei: `GEZEIGT` steht jetzt an beiden Stellen. Kein
       Prüflauf fiel darüber, weil test51 immer erst etwas eintippt und damit
       unter 46 Treffern bleibt (40 bewertete + 6 Seiten). */
    const GEZEIGT = 60;

    const zeichne = () => {
      let g = '';
      const sicht = treffer.slice(0, GEZEIGT);
      res.innerHTML = sicht.map((t, k) => {
        const kopf = t.gruppe !== g ? `<div class="grp">${esc(t.gruppe)}</div>` : '';
        g = t.gruppe;
        return kopf + `<button data-i="${k}"${k === i ? ' class="on"' : ''}>` +
               `<span style="flex:1">${esc(t.name)}</span>` +
               (t.kurz ? `<span class="pth">${esc(t.kurz)}</span>` : '') + '</button>';
      }).join('') +
      /* UND WAS NICHT DASTEHT, WIRD GESAGT. Eine abgeschnittene Liste, die
         so tut, als wäre sie vollständig, ist dieselbe Lüge in klein. Der
         Satz erscheint nur, wenn wirklich etwas fehlt — sonst wäre er ein
         Hinweis, den niemand mehr liest. */
      (treffer.length > GEZEIGT
        ? `<div class="grp mehr">${treffer.length - GEZEIGT} weitere — ` +
          'tipp einen Namen, um sie zu finden</div>'
        : '');
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
      if (e.key === 'ArrowDown') { e.preventDefault();
        i = Math.min(i + 1, Math.min(treffer.length, GEZEIGT) - 1); zeichne(); }
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
  const lernModul = (): any => typeof window !== 'undefined'
    ? (window as any).Learning : null;

  const karten = () => lernModul()?.cards?.() || Object.values<any>(Store.cache.blocks)
    .filter(b => b.alive && b.type === 'flashcard');

  const faellig = () => {
    const neu = lernModul();
    if (neu?.due) return neu.due();
    const jetzt = Date.now();
    return karten().filter((k: any) => !k.sr || !k.sr.faellig || new Date(k.sr.faellig).getTime() <= jetzt);
  };


  const lernen = () => {
    /* Learning V2 zeichnet Tagesqueue, Fehlertraining und Statistik. Der
       alte Dialog bleibt als belastbarer Rückfall erhalten, falls das neue
       Modul in einer eingebetteten Ein-Datei-Ausgabe noch nicht geladen ist. */
    const neu = lernModul();
    if (neu?.open) { neu.open(); return; }
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
    const neu = lernModul();
    if (neu?.splitCard) return neu.splitCard(k);
    const t = k.text || '';
    const i = t.indexOf('::');
    return i >= 0 ? [t.slice(0, i).trim(), t.slice(i + 2).trim()] : [t, '(noch keine Antwort — mit :: trennen)'];
  };

  /* ========================================================================
   * 6. VERSIONSVERLAUF   (Standard Notes, Trilium, Joplin)
   * ======================================================================*/
  const versionen = async (p: any) => {
    /* „Keine Fassungen" und „nicht nachsehen können" sahen im Verlauf gleich
       aus — beides eine leere Liste. Der Unterschied entscheidet, ob man
       die Seite beruhigt überschreibt oder besser nicht. */
    let liste: any[];
    try { liste = await Store.versionen(p.id); }
    catch (err) {
      UI.toast('Der Versionsverlauf ist gerade nicht lesbar — bitte nichts überschreiben');
      if (typeof Reporter !== 'undefined')
        Reporter.error('wissen', 'Versionsverlauf nicht lesbar', err);
      return;
    }
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

    /* WAS ANDERE ÜBER DIESE SEITE WISSEN, BEVOR SIE ZU IST (E364, L78 Punkt 4):
       gesperrt sind ihre Kinder Chiffretext — wer sie DANACH einordnen
       will (das Regal: „ist das ein Heft?"), kann es nicht mehr. Also wird
       vorher gefragt, über den Bus, und was die Antworten sagen, wandert
       mit ins Sperren. Diese Datei kennt die Heft-Regel damit nicht; sie
       trägt nur, was ihr gesagt wird. Das Schloss selbst darf keine
       Antwort umschreiben. */
    const mitgabe: Record<string, unknown> = {};
    if (typeof Ereignisse !== 'undefined' && typeof ARTEN !== 'undefined' && ARTEN.seiteWirdGesperrt) {
      try {
        for (const a of Ereignisse.frage(ARTEN.seiteWirdGesperrt, { id: p.id }))
          if (a && typeof a === 'object') Object.assign(mitgabe, a);
      } catch { /* dann eben ohne Mitgabe */ }
    }
    delete mitgabe['locked']; delete mitgabe['id'];
    Store.kinderLeeren(p.id);
    Store.updateBlock(p.id, { ...mitgabe, locked: { salz, iv: b64(iv), daten: b64(chiffre), zeit: Store.now() } });
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
  const praesentation = async (p: any) => {
    /* Die Seitenbilder vorher holen — `folieBlock` zeichnet synchron. Für
       den Bildschirm genügen blob-Adressen (E109). */
    const bilder = (await bilderSammeln(p, false)).adressen;
    /* WO EINE FOLIE ANFÄNGT, STEHT IM KERN (E297).
       Die Regel — eine neue Folie bei jeder Trennlinie und jeder Überschrift
       1 oder 2, wie in HedgeDoc und Marp — stand bis hierher NUR an dieser
       Stelle. Der .pptx-Weg hätte sie abschreiben müssen, und zwei
       Teilungen, die auseinanderlaufen, sind schlimmer als eine: der Vortrag
       zeigte dann etwas anderes als die abgegebene Datei, und gemerkt hätte
       man es in der Schule.

       Was der Kern mitbringt und hier vorher stand: SPALTEN BLEIBEN SPALTEN
       (vorher stieg die Sammlung gar nicht hinab, und eine Schulaufgabe war
       als Vortrag vollständig leer), und die drei Blockarten, die ihren
       Inhalt selbst zeichnen, werden nicht ein zweites Mal aufgeklappt. */
    const folien = Folien.teilen(p, (id: string) => Store.childrenOf(id))
      .map((f: any) => ({ titel: f.titel,
        bloecke: f.eintraege.map((e: any) => ({ b: e.block, tiefe: e.tiefe })) }));

    const o = document.createElement('div');
    o.className = 'praesi';
    document.body.appendChild(o);
    let i = 0;

    const zeichne = () => {
      const f = folien[i];
      /* Eine Seite ohne einen einzigen Block ergibt keine Folie. Vorher wäre
         hier `f.titel` an `undefined` gelaufen und der Vortrag mit einem
         leeren schwarzen Bild stehen geblieben — mitten in der Klasse die
         unangenehmste Sorte Fehler (§47: kein Weg, der ins Leere führt). */
      if (!f) {
        o.innerHTML = '<div class="folie"><h1>Nichts zu zeigen</h1>' +
          '<p>Auf dieser Seite steht noch kein Inhalt.</p></div>' +
          '<div class="praesi-leiste"><button data-a="zu">Beenden (Esc)</button></div>';
        return;
      }
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

      /* WAS SEIT DAMALS DAZUKAM. Diese Kette ist die zweite in dieser Datei,
         und das ist in Ordnung — Folien sind ein anderes Medium als
         Fliesstext. Nicht in Ordnung war, dass sie beim Stand von damals
         stehen blieb: Tabelle, Datenbank, PDF-Seite und A4-Blatt gab es
         hier nicht, und jede Folie mit so etwas darauf war leer. Der
         wiederkehrende Befund dieses Projekts: nicht „vergessen", sondern
         „an einer Stelle getan und an der Nachbarstelle nicht" (L38). */
      if (b.type === 'table') return tabelleHtml(b);
      if (b.type === 'database') return datenbankHtml(b);
      if (b.type === 'columns' || b.type === 'columns3') {
        /* ZWEI BAUFORMEN, und beide gibt es wirklich (E118).
           Seit E102 liegt zwischen dem Spaltenblock und seinem Inhalt eine
           `spalte`-Hülle. Der Bestand von davor hat sie nicht — dort IST das
           Kind die Spalte, und der Editor zeichnet ihn deshalb weiter
           (editor.ts, `case 'columns'`: `childrenOf(block.id)` direkt).
           Hier stand nur die neue Form. Ein alter Spaltenblock fiel auf der
           Folie ersatzlos weg — nicht gemeldet, nur leer. Genau die Klasse
           Fehler, gegen die der Kommentar zwei Zeilen weiter oben geschrieben
           wurde: „an einer Stelle getan und an der Nachbarstelle nicht". */
        const spalten = Store.childrenOf(b.id)
          .map((sp: any) => '<div class="folie-spalte">' +
            (sp.type === 'spalte'
              ? Store.childrenOf(sp.id).map((k: any) => folieBlock(k, 0)).join('')
              : folieBlock(sp, 0)) +
            '</div>').join('');
        return `<div class="folie-spalten">${spalten}</div>`;
      }
      if (b.type === 'pdfseite') {
        const bw = Number(b.bw) || 595.28, bh = Number(b.bh) || 841.89;
        const adr = bilder[b.id] || '';
        /* Das Seitenverhältnis steht am KASTEN, nicht am Bild — genau wie
           beim Blatt daneben. Sonst regiert `.praesi img{max-height:52vh}`
           die Höhe, und zwei gleich grosse A4-Seiten stehen unterschiedlich
           hoch nebeneinander (gemessen: 442 gegen 541 px, §55). */
        return '<figure class="folie-blatt" ' +
          `style="aspect-ratio:${bw} / ${bh}">` +
          (adr ? `<img src="${esc(adr)}" alt="Seite ${esc(b.nr || '')}">`
               : `<div class="fehlt">Seite ${esc(b.nr || '')} — kein Bild</div>`) +
          markenAlsSvg(b, bw, bh) + '</figure>';
      }
      if (b.type === 'blatt') {
        const bw = Number(b.blattBreite) || 595.28;
        const bh = Number(b.blattHoehe) || 841.89;
        return '<figure class="folie-blatt papier" ' +
          `style="aspect-ratio:${bw} / ${bh}">` +
          '<div class="blatt-text">' +
          Store.childrenOf(b.id).map((k: any) => folieBlock(k, 0)).join('') +
          '</div>' + markenAlsSvg(b, bw, bh) + '</figure>';
      }
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
        /* Was „Übernehmen" wirklich tut, steht daneben — nicht erst im
           Nachhinein im Versionsverlauf. Markdown trägt keine Farben und
           keine Schriftgrössen (E101), und verschachtelte Listen kommen
           eine Ebene flach zurück. Alles, was Markdown gar nicht abbilden
           kann, steht seit E113 als Platzhalter im Text und bleibt
           unangetastet — man darf die Zeile nur nicht löschen. */
        '<div class="hint" style="padding:0 14px 10px; line-height:1.5">' +
          'Die Zeilen wie <code>&lt;!--blk:…--&gt;</code> sind PDF-Seiten, ' +
          'Blätter, Tabellen und Spalten. Sie bleiben unverändert, solange ' +
          'die Zeile stehen bleibt.<br>' +
          'Farben, Schriftgrössen und die Verschachtelung von Listen kann ' +
          'Markdown nicht tragen — sie gehen beim Übernehmen verloren. ' +
          'Eine Fassung wird vorher gesichert.' +
        '</div>' +
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
      if (elVon(e)?.closest<HTMLElement>('[data-a="kopieren"]')) { Ablage.kopiereJetzt(ta.value, 'Kopiert'); }
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

  /* ==========================================================================
   * EINE MELDUNG DES GERÄTS ZEIGEN — über das Dienst-Skript, nicht über
   * `new Notification()`
   * --------------------------------------------------------------------------
   * DER FEHLER, GEGEN DEN DAS STEHT (7. August 2026). Hier stand zweimal
   *
   *     try { new Notification(text, { … }); } catch {}
   *
   * und auf einem iPhone ist das eine Zeile, die nichts tut. Eine
   * installierte Web-App kennt den Konstruktor `Notification` dort gar
   * nicht — Apple unterstützt ausschliesslich
   * `ServiceWorkerRegistration.showNotification()`. Der Aufruf wirft
   * `Illegal constructor`, das `catch` verschluckte es, und übrig blieb der
   * Hinweis in der App. Wer Redion geschlossen hatte, bekam nichts; wer sie
   * offen hatte, bekam den Toast und hielt das für alles, was es gibt.
   *
   * Das ist genau die Funktion, um die Redur gebeten hatte („wenn ich beim
   * Kalender sage morgen um 08:00 Uhr aufstehen, sollte mir in dieser
   * Uhrzeit erinnern") — und sie scheiterte auf seinem Gerät lautlos.
   *
   * Deshalb zuerst der Weg über die Registrierung. Er ist nicht nur der
   * einzige, den iOS kann, er ist auch der bessere: eine so gezeigte
   * Meldung überlebt das Schliessen des Fensters, und der Tipp darauf
   * landet im Dienst-Skript, das die Seite öffnen kann.
   *
   * `new Notification` bleibt als Rückfall für Browser ohne Dienst-Skript
   * — etwa beim Öffnen per Doppelklick aus dem Dateisystem, wo sich keines
   * registrieren lässt (§6: die App muss auch so laufen).
   * ========================================================================*/
  const geraeteMeldung = async (
    titel: string, text: string, kennung: string, seite = ''
  ): Promise<'dienst' | 'fenster' | 'nein'> => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return 'nein';
    try {
      /* `serviceWorker.ready` WARTET EWIG, WENN NIE EINES KOMMT — es wird
         nie abgelehnt, es bleibt einfach offen. Ohne die Frist hätte
         dieser Zweig die Erinnerung ganz verschluckt statt sie über den
         Rückfall zu zeigen: schlimmer als der Fehler, den er behebt.
         Gefunden hat das der eigene Prüflauf, der daran hängenblieb. */
      const reg: any = navigator.serviceWorker && await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(fertig => setTimeout(() => fertig(null), 1500))
      ]);
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(titel, {
          body: text, tag: kennung, data: { seite }
        } as NotificationOptions);
        return 'dienst';
      }
    } catch { /* dann der Rückfall darunter */ }
    try {
      const n = new Notification(titel, { body: text, tag: kennung });
      n.onclick = () => { window.focus(); if (seite) App.oeffne(seite); };
      return 'fenster';
    } catch { return 'nein'; }
  };

  const posteingangMelden = (m: any) => {
    const liste = meldungen();
    liste.unshift({
      id: Store.uid(), text: m.text || '', quelle: m.quelle || '',
      seite: m.seite || '', art: m.art || 'hinweis',
      wann: new Date().toISOString(), gelesen: false
    });
    Store.setMeta('meldungen', liste.slice(0, 200));
    meldungenGeaendert();
    /* Kurz sichtbar machen, damit man es auch ohne Posteingang mitbekommt */
    try { UI.toast('🔔 ' + (m.text || 'Neue Benachrichtigung')); } catch {}
    /* Und, falls erlaubt, als echte Benachrichtigung des Geräts */
    void geraeteMeldung(m.text || 'Redion', m.quelle || '', 'redion', m.seite || '');
    return liste[0];
  };

  const meldungGelesen = (id: string) => {
    const liste = meldungen().map((x: any) => x.id === id ? { ...x, gelesen: true } : x);
    Store.setMeta('meldungen', liste);
    meldungenGeaendert();
  };

  const meldungenLeeren = () => { Store.setMeta('meldungen', []); meldungenGeaendert(); };

  /**
   * Alle Meldungen als gelesen markieren — der HARMLOSE Zwilling zu
   * `meldungenLeeren` (E276, L96).
   *
   * Beide räumen den Punkt an der Glocke weg, und genau deshalb sehen sie
   * aus wie dasselbe. Sie sind es nicht: `meldungenLeeren` WIRFT WEG. Was
   * dort stand, ist danach nicht mehr da — auch die Zeile, die auf eine
   * Seite zeigte, die man noch hätte ansehen wollen.
   *
   * An einen Knopf, den ein Klick ohne Rückfrage auslöst, gehört deshalb
   * dieser hier und nicht jener. Er tut, was `meldungGelesen(id)` tut, nur
   * über alle: er ändert ein Feld, er nimmt nichts.
   *
   * Gibt zurück, WIE VIELE ungelesen waren. Wer den Knopf zeigt, will das
   * wissen — ohne offene Meldung hat er nichts zu tun und gehört nicht hin
   * (§47).
   */
  const meldungenAlleGelesen = (): number => {
    const liste = meldungen();
    const offen = liste.filter((x: any) => !x.gelesen).length;
    if (!offen) return 0;
    Store.setMeta('meldungen', liste.map((x: any) => x.gelesen ? x : { ...x, gelesen: true }));
    meldungenGeaendert();
    return offen;
  };

  /* Wer den Zähler zeigt (die Glocke in der Kopfzeile, E251), erfährt es
     hier — als DOM-Ereignis, nicht als Direktaufruf: der Bereich kennt
     die Schale nicht (Regel 1). */
  const meldungenGeaendert = () => {
    try { document.dispatchEvent(new CustomEvent('redion:meldungen')); } catch {}
  };

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
      /* Und, wenn ein Server da ist, den Weckruf legen — dann klingelt es
         auch, wenn Redion zu dieser Zeit geschlossen ist (E54). Kein
         Grund, darauf zu warten: die Erinnerung steht lokal schon, und
         wenn der Server nicht mag, ist das kein Fehler dieses Dialogs. */
      void weckrufLegen();
      o.remove();
      UI.toast('Erinnerung gesetzt für ' + new Date(zeit).toLocaleString('de-DE'));
      App.zeichneSeite();
    });
  };

  /* ==========================================================================
   * DER WECKRUF — damit es auch klingelt, wenn Redion zu ist (L33, E54)
   * --------------------------------------------------------------------------
   * Bis hierher meldete sich eine Erinnerung nur, solange Redion offen war.
   * Ist die App um acht Uhr geschlossen, passiert um acht Uhr nichts; sie
   * wartet bis zum nächsten Öffnen und sagt dann „Verpasst um 08:00".
   *
   * Ein Telefon zu wecken, ohne dass die Seite läuft, geht nur mit Web Push.
   * Was dabei an den Server geht, ist ein **Zeitpunkt** — nicht der Text,
   * nicht die Seite, nicht der Grund. Der Stoss sagt später nur „wach auf";
   * was fällig ist, liest das Dienst-Skript aus der lokalen Ablage.
   *
   * ALLES DARAN IST FREIWILLIG UND DARF FEHLSCHLAGEN. Kein Server, kein
   * Dienst-Skript, keine Erlaubnis, kein Push im Browser — jedes Mal wird
   * still aufgehört. Die Erinnerung steht dann trotzdem, sie meldet sich
   * eben nur beim nächsten Öffnen. Eine Zugabe, die den Grundfall kaputt
   * macht, wäre keine (CLAUDE.md §22).
   * ========================================================================*/

  /** Der nächste noch offene Zeitpunkt — oder leer, wenn keiner ansteht. */
  const naechsteErinnerung = (): string => {
    const jetzt = Date.now();
    const offen = erinnerungen()
      .filter((e: any) => e && !e.erledigt && e.zeit && new Date(e.zeit).getTime() > jetzt)
      .map((e: any) => new Date(e.zeit).getTime())
      .sort((a: number, b: number) => a - b);
    return offen.length ? new Date(offen[0]!).toISOString() : '';
  };

  const b64uZuBytes = (text: string): Uint8Array => {
    const s = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
    const roh = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
    const b = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) b[i] = roh.charCodeAt(i);
    return b;
  };

  const bytesZuB64u = (b: ArrayBuffer | null): string => {
    if (!b) return '';
    const x = new Uint8Array(b);
    let s = '';
    for (const c of x) s += String.fromCharCode(c);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const weckrufLegen = async (): Promise<'gelegt' | 'kein-server' | 'nein'> => {
    try {
      if (typeof Wolke === 'undefined' || !Wolke.angemeldet()) return 'kein-server';
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'nein';
      if (!('Notification' in window) || Notification.permission !== 'granted') return 'nein';

      const schluessel = await Wolke.ruf('/push/schluessel');
      const oeffentlich = schluessel && schluessel.oeffentlich;
      if (!oeffentlich) return 'kein-server';

      const reg: any = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise(f => setTimeout(() => f(null), 2000))
      ]);
      if (!reg || !reg.pushManager) return 'nein';

      /* Eine vorhandene Anmeldung weiterverwenden. Zwei Anmeldungen
         desselben Geräts wären zwei Stösse für einen Wecker — und der
         Browser gibt beim zweiten `subscribe` ohnehin dieselbe zurück,
         solange der Schlüssel derselbe ist. */
      let ab = await reg.pushManager.getSubscription();
      if (!ab) ab = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64uZuBytes(oeffentlich)
      });
      if (!ab) return 'nein';

      const geraet = Wolke.geraeteName();
      await Wolke.ruf('/push/anmelden', { m: 'POST', k: {
        geraet, endpunkt: ab.endpoint,
        p256dh: bytesZuB64u(ab.getKey ? ab.getKey('p256dh') : null),
        auth:   bytesZuB64u(ab.getKey ? ab.getKey('auth') : null)
      } });

      /* UND HIER GEHT DIE EINZIGE ANGABE HINAUS, die etwas über den
         Menschen sagt: WANN. Nicht was, nicht wo, nicht warum. */
      await Wolke.ruf('/push/wecken', { m: 'POST',
        k: { geraet, wann: naechsteErinnerung() } });
      return 'gelegt';
    } catch { return 'nein'; }
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
      void geraeteMeldung(
        spaet ? 'Verpasst um ' + wann : 'Erinnerung: ' + e.text,
        spaet ? e.text : 'In Redion',
        e.id, e.pageId || '');
    });
    if (geaendert) {
      Store.setMeta('erinnerungen', liste);
      /* Eine erledigte Erinnerung verschiebt den nächsten Weckruf. Ohne
         das stünde am Server weiter die Zeit von gestern, und der Stoss
         käme zu einer Erinnerung, die es nicht mehr gibt. */
      void weckrufLegen();
    }
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
    inp.accept = '.md,.markdown,.txt,.csv,.tsv,.html,.htm,.xlsx,.xlsm,.ods,.docx,.epub,.pdf,.zip,image/*';
    inp.multiple = true;
    inp.addEventListener('change', async () => {
      let n = 0;
      for (const f of Array.from(inp.files ?? [])) {
        const name = f.name.toLowerCase();
        try {
          if (/\.zip$/i.test(name) && typeof ArchivImport !== 'undefined') {
            const erg = await ArchivImport.importZip(f, null, { still: true });
            UI.toast(erg.hinweis, 9000); n++; continue;
          }
          /* PDF UND ALLES BINÄRE WERDEN DOKUMENTE (E350) — vorher wurde eine
             über „Alle Dateien" gewählte PDF zur Textseite mit Binärsalat. */
          const textig = /\.(html?|htm|csv|tsv|md|markdown|txt)$/i.test(name) || f.type.startsWith('text/');
          if (!textig && !/\.(xlsx|xlsm|docx|epub)$/i.test(name) && typeof ArchivImport !== 'undefined') {
            await ArchivImport.dateiAlsDokument(f, null); n++; continue;
          }
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
      if (typeof ArchivImport !== 'undefined') ArchivImport.ansichtAuffrischen();
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

  /**
   * Eine Seite als HTML — für Archiv, Einzelexport und Drucken.
   *
   * `sonderfall` darf einzelne Blockarten selbst bauen. Gibt er etwas
   * zurück, gilt das statt der Kette unten UND statt des Absteigens in die
   * Kinder — der Sonderfall entscheidet dann selbst, ob er hinabsteigt.
   * Damit kann der Druckweg PDF-Seiten und Blätter mit ihren Bildern und
   * Strichen setzen, ohne dass es eine zweite Baumwanderung gäbe (E108).
   */
  const seiteAlsHtml = (
    p: any,
    sonderfall?: (b: any, tiefe: number, hinab: (id: string, t: number) => string) => string | null
  ) => {
    const raus = (id: string, tiefe: number): string => {
      let h = '';
      /* Welche Liste gerade offen ist — siehe `listeHalten` unten. */
      let offen: '' | 'ul' | 'ol' = '';
      const listeHalten = (art: '' | 'ul' | 'ol'): void => {
        if (art === offen) return;
        if (offen) h += '</' + offen + '>';
        if (art) h += '<' + art + '>';
        offen = art;
      };
      const LISTENART: Record<string, 'ul' | 'ol'> =
        { bullet: 'ul', todo: 'ul', number: 'ol' };

      Store.childrenOf(id).forEach((b: any) => {
        listeHalten(LISTENART[b.type] || '');
        if (sonderfall) {
          const eigen = sonderfall(b, tiefe, raus);
          if (eigen !== null && eigen !== undefined) { h += eigen; return; }
        }
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
        /* Eine PDF-Seite hat keinen `text`, fiel also aus der Kette heraus und
           kam gar nicht vor. Im Export und in der Veröffentlichung steht
           jetzt wenigstens, DASS sie da ist — das Bild selbst gehört nicht
           hinein: es ist eine blob-Adresse, die nach der Sitzung tot wäre
           (E98), und in einer öffentlichen Seite hat ein Schulskript ohnehin
           nichts verloren. Zum DRUCKEN gibt es den Sonderfall (E108). */
        else if (b.type === 'pdfseite')
          h += `<p>📄 Seite ${esc(b.nr || '?')}` +
               (b.vonSeiten ? ' von ' + esc(b.vonSeiten) : '') + '</p>';
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
      listeHalten('');
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

  /* ========================================================================
   * DRUCKEN: EINE BESCHRIEBENE SEITE ZUM WEITERGEBEN
   * ------------------------------------------------------------------------
   * Vorher kam beim Drucken einer Schulaufgabe die Notizzeile heraus und
   * sonst nichts — kein Seitenbild, kein einziger Strich. Nicht hässlich,
   * sondern LEER, und genau in dem Fall, für den Redur das alles wollte:
   * lösen und abgeben.
   *
   * DIE STRICHE KOMMEN AUS `Marken.zeichneMarke`, derselben Stelle, die sie
   * auch auf dem Bildschirm zeichnet. Ein zweiter Pfad-Bauer wäre eine
   * zweite Wahrheit über dieselbe Linie (§34) — und als SVG bleiben sie beim
   * Drucken scharf, egal wie fein der Drucker ist.
   * ======================================================================*/

  /** Eine abgelegte Datei als Daten-Adresse — der Druckrahmen braucht das. */
  const alsDatenAdresse = async (dateiId: string): Promise<string> => {
    try {
      const blob = await Dateien.alsBlob(dateiId);
      if (!blob) return '';
      return await new Promise<string>(fertig => {
        const leser = new FileReader();
        leser.onload = () => fertig(String(leser.result || ''));
        leser.onerror = () => fertig('');
        leser.readAsDataURL(blob);
      });
    } catch { return ''; }
  };

  /**
   * Alle Seitenbilder einer Seite einsammeln, bevor gezeichnet wird.
   *
   * `alsDaten` entscheidet, WELCHE Adresse. Zum Drucken muss es eine
   * Daten-Adresse sein: der Druckrahmen ist ein eigenes Dokument, und eine
   * blob-Adresse wäre dort — und erst recht in einer gespeicherten Datei —
   * nach der Sitzung tot (E98). Für die Präsentation, die im selben
   * Dokument läuft, genügt die blob-Adresse: sie kostet nichts und lädt
   * sofort (E109).
   */
  /* EINE OBERGRENZE FÜR DEN DRUCK (E117).
     Eine Daten-Adresse ist eine Zeichenkette im Arbeitsspeicher, und beim
     Drucken werden ALLE zugleich gehalten: einmal in der Karte, einmal im
     zusammengebauten HTML des Druckrahmens. Bei 200 KB je Seitenbild sind
     das schon bei achtzig Seiten rund 43 MB — doppelt, plus Base64-Aufschlag
     ein Drittel obendrauf. Ein Skript mit fünfhundert Seiten sprengt jedes
     Telefon (§36: „Große Dateien nicht vollständig in RAM laden").
     Also eine Grenze — und, weil §35 gilt, KEINE stille: was nicht mehr
     hineinpasst, wird gezählt, im Ausdruck an seinem Platz benannt und dem
     Menschen gesagt. Eine Prüfung, die schweigend die Hälfte weglässt, sieht
     aus wie eine vollständige. */
  const DRUCK_BILDER_MAX = 40 * 1024 * 1024;

  const bilderSammeln = async (p: any, alsDaten = true):
      Promise<{ adressen: Record<string, string>; ausgelassen: string[] }> => {
    const adressen: Record<string, string> = {};
    const ausgelassen: string[] = [];
    let summe = 0;
    const gehe = async (id: string, tiefe: number): Promise<void> => {
      if (tiefe > 6) return;
      for (const b of Store.childrenOf(id)) {
        if (b.type === 'page') continue;
        if (b.type === 'pdfseite' && b.bildDateiId) {
          if (!alsDaten) {
            /* Für die Präsentation: eine `blob:`-Adresse kostet nichts —
               der Browser hält die Bytes ohnehin schon (E109). */
            adressen[b.id] = (await Dateien.adresse(b.bildDateiId)) || '';
          } else {
            const satz = await Store.dateiHolen(b.bildDateiId);
            const gross = Number(satz?.groesse) || 0;
            /* `summe > 0` ist die Ausnahme für den ersten: EIN Bild kommt
               immer mit, auch wenn es allein die Grenze reisst. Sonst
               druckte ein Dokument aus einer einzigen grossen Seite gar
               nichts, und „gar nichts" ist ein schlechteres Ergebnis als
               „einmal zu viel Speicher". Redions eigener Rasterer liefert
               rund 200 KB je Seite; über 40 MB kommt nur, was von aussen
               eingespielt wurde. */
            if (summe + gross > DRUCK_BILDER_MAX && summe > 0) {
              ausgelassen.push(b.id);
            } else {
              adressen[b.id] = await alsDatenAdresse(b.bildDateiId);
              summe += gross;
            }
          }
        }
        await gehe(b.id, tiefe + 1);
      }
    };
    await gehe(p.id, 0);
    return { adressen, ausgelassen };
  };

  /** Die Striche eines Blocks als SVG-Text. */
  /**
   * Die Striche eines Blocks als SVG-Text.
   *
   * @param rand Zusatzbreite rechts (E301). Ohne sie wäre alles, was neben
   *        der Seite steht, auf dem Ausdruck abgeschnitten — und das merkt
   *        man erst, wenn das Blatt aus dem Drucker kommt.
   */
  const markenAlsSvg = (block: any, breite: number, hoehe: number,
                        rand = 0): string => {
    const marken = Array.isArray(block.marken) ? block.marken : [];
    if (!marken.length || typeof Marken === 'undefined') return '';
    const teile = marken
      .map((m: any) => Marken.zeichneMarke(m))
      .filter(Boolean)
      .map((k: any) => k.outerHTML)
      .join('');
    if (!teile) return '';
    return `<svg class="marken" viewBox="0 0 ${breite + Math.max(0, rand)} ${hoehe}" ` +
           `preserveAspectRatio="none">${teile}</svg>`;
  };

  const DRUCK_STIL =
    '.blatt-druck{position:relative; width:100%; margin:0 0 8mm; ' +
      'break-inside:avoid; page-break-inside:avoid}' +
    '.blatt-druck img{display:block; width:100%}' +
    '.blatt-druck.papier{background:#fff; border:1px solid #ccc}' +
    '.blatt-druck .blatt-text{padding:9.5%; font-size:11pt}' +
    '.blatt-druck .marken{position:absolute; inset:0; width:100%; height:100%; ' +
      'color:#111}' +
    /* Der Randstreifen auf Papier: das Bild nimmt seinen Anteil, der Rest
       bleibt weiss, und die Striche liegen über beidem (E301). */
    '.blatt-druck.mit-rand img{width:var(--seiten-anteil,100%)}' +
    '.blatt-druck.mit-rand{background:#fff}' +
    '.blatt-druck .fehlt{padding:30mm 10mm; text-align:center; color:#666; ' +
      'border:1px dashed #bbb}';

  const drucken = async (p: any) => {
    const { adressen: bilder, ausgelassen } = await bilderSammeln(p);
    const zuGross = new Set(ausgelassen);
    if (ausgelassen.length)
      UI.toast(ausgelassen.length + ' Seitenbild' +
        (ausgelassen.length === 1 ? '' : 'er') + ' ist für einen Ausdruck zu ' +
        'gross und bleibt leer — drucke das Dokument in Abschnitten.', 8000);
    /* Der Sonderfall setzt PDF-Seiten und Blätter; alles andere macht die
       gewöhnliche Kette. `null` heisst „nicht meine Sache". */
    const inhalt = seiteAlsHtml(p, (b: any, tiefe: number, hinab): string | null => {
      if (b.type === 'pdfseite') {
        const bw = Number(b.bw) || 595.28, bh = Number(b.bh) || 841.89;
        const adr = bilder[b.id] || '';
        /* `esc(adr)` und nicht `adr`: die Daten-Adresse traegt ihren
           MIME-Teil WOERTLICH aus dem Datei-Satz — und der stammt bei einer
           eingespielten Sicherung aus fremder Hand. `image/png" onerror="…`
           ueberlebt den Blob-Bauer (nur Zeichen ausserhalb U+0020–U+007E
           werden dort verworfen, `"` gehoert nicht dazu) und stuende hier
           mitten im Attribut. Bei einer ECHTEN Daten-Adresse aendert `esc`
           nichts: das Base64-Alphabet enthaelt keines der fuenf Zeichen.
           Die Folie daneben macht es seit E109 richtig; hier fehlte es
           schlicht (E112). */
        /* Drei Fälle, drei Sätze. „Leer" ist keiner davon: wer eine leere
           Seite im Ausdruck findet, muss wissen, WARUM sie leer ist (§35). */
        const fehlt = zuGross.has(b.id)
          ? `Seite ${esc(b.nr || '')} — dieses Dokument ist für einen ` +
            'Ausdruck am Stück zu gross. Die Striche stehen unten trotzdem; ' +
            'für das Seitenbild drucke das Dokument in Abschnitten.'
          : `Seite ${esc(b.nr || '')} — das Bild fehlt in diesem Bestand. ` +
            'Hol es in Redion aus dem Original zurück.';
        /* MIT RANDSTREIFEN WIRD DAS BILD SCHMALER, NICHT DIE SEITE BREITER
           (E301). Sonst stünde auf dem Papier alles, was daneben steht,
           ausserhalb — und gemerkt hätte man es erst am Drucker. */
        const randDruck = Math.round(bw * Math.max(0, Math.min(1.5,
          Number(p.randBreite) || 0)));
        const anteil = (100 * bw / (bw + randDruck)).toFixed(4) + '%';
        return '<figure class="blatt-druck' + (randDruck ? ' mit-rand' : '') +
          '" style="--seiten-anteil:' + anteil + '">' +
          (adr ? `<img src="${esc(adr)}" alt="Seite ${esc(b.nr || '')}">`
               : `<div class="fehlt">${fehlt}</div>`) +
          markenAlsSvg(b, bw, bh, randDruck) + '</figure>';
      }
      if (b.type === 'blatt') {
        const bw = Number(b.blattBreite) || 595.28;
        const bh = Number(b.blattHoehe) || 841.89;
        return '<figure class="blatt-druck papier" ' +
          `style="aspect-ratio:${bw} / ${bh}">` +
          '<div class="blatt-text">' + hinab(b.id, tiefe + 1) + '</div>' +
          markenAlsSvg(b, bw, bh) + '</figure>';
      }
      /* Spalten kommen beim Drucken UNTEREINANDER. Nebeneinander auf A4
         hochkant wären zwei Spalten von je 90 mm — lesbar ist das nicht, und
         die Reihenfolge Seite, Blatt, Seite, Blatt bleibt eindeutig. */
      if (b.type === 'columns' || b.type === 'columns3' || b.type === 'spalte')
        return hinab(b.id, tiefe + 1);
      return null;
    });

    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed; right:0; bottom:0; width:0; height:0; border:0';
    document.body.appendChild(f);
    const d = f.contentDocument;
    /* Ohne Dokument im Rahmen gibt es nichts zu drucken. */
    if (!d) { f.remove(); return; }
    /* KOPFZEILE, DATUM UND SEITENZAHLEN (E244). Sie leben in den
       @page-Randkästen: der Browser wiederholt sie auf JEDER gedruckten
       Seite und zählt selbst — genau das kann kein Element im Fluss.
       Die erste Seite trägt keine Kopfzeile, dort steht der H1 schon.
       In einer CSS-content-Zeichenkette escapen \ und " — ein Titel
       `Bericht "Q3"` darf die Regel nicht sprengen. Browser ohne
       Randkästen drucken wie bisher, nur mit @page- statt body-Rand. */
    const inhaltText = (wert: string): string =>
      wert.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').slice(0, 60);
    const heute = new Date();
    const druckDatum = heute.getDate() + '. ' +
      ['Januar','Februar','März','April','Mai','Juni','Juli','August',
       'September','Oktober','November','Dezember'][heute.getMonth()] + ' ' +
      heute.getFullYear();
    const randStil = 'font:9pt Georgia,serif;color:#555';
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(p.text || 'Seite') + '</title>' +
      '<style>' +
      '@page{size:A4;margin:20mm 18mm 22mm;' +
        '@top-left{content:"' + inhaltText(p.text || 'Ohne Titel') + '";' + randStil + '}' +
        '@top-right{content:"' + inhaltText(druckDatum) + '";' + randStil + '}' +
        '@bottom-center{content:"Seite " counter(page) " von " counter(pages);' + randStil + '}}' +
      '@page:first{@top-left{content:none}@top-right{content:none}}' +
      'body{font:12pt/1.6 Georgia,serif;margin:0}h1{font-size:22pt}h3{font-size:16pt}h4{font-size:13pt}' +
      'pre{background:#f2f2f2;padding:10px;white-space:pre-wrap}table{border-collapse:collapse;width:100%}' +
      'td,th{border:1px solid #999;padding:5px 8px;font-size:10.5pt}img{max-width:100%}' +
      '.cal{background:#f2f2f2;padding:10px;border-radius:4px}' + DRUCK_STIL +
      '</style></head><body>' +
      '<h1>' + esc(p.text || 'Ohne Titel') + '</h1>' + inhalt + '</body></html>');
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


  /** `stillerHinweis` unterdrückt NUR den Satz „Verschoben" — für Aufrufer,
   *  die selbst einen besseren sagen (E368: das Ziehen im Regal nennt Heft
   *  und Ziel). Ohne den Zusatz bleibt alles, wie es war; zwei Sätze für
   *  eine Handlung wären einer zu viel, und der bessere ist nicht dieser. */
  const verschiebe = (p: any, zielId: any, stillerHinweis = false) => {
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
    if (!stillerHinweis) UI.toast('Verschoben');
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
   * OHNE KONTO heisst Weitergeben: eine Datei erzeugen — und davon gibt es
   * jede Form. MIT KONTO kommt die echte Freigabe dazu (Link ins Netz,
   * widerrufbar, nur die freigegebene Seite). Bis E270 behauptete dieses
   * Menü, es gäbe „keinen Server und kein Konto" — vierzehn Zeilen unter
   * einem Aufruf des Freigabe-Fensters (Zeile 279).
   * ======================================================================*/
  const wolkeDa = (): boolean => {
    const w = (globalThis as any).Wolke;
    return !!(w?.angemeldet?.() && (globalThis as any).WolkeFenster?.teilenFenster);
  };

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
      '<button data-a="obsidian"><span class="mi">🔮</span>Als Obsidian-Vault (.zip)</button>' +
      '<hr>' +
      /* HIER STAND, ES GÄBE KEINEN SERVER (E270) — vierzehn Zeilen unter
         einem Aufruf von `WolkeFenster.teilenFenster`, der genau das tut.
         Jetzt sagt das Menü, was wirklich geht: mit Konto eine Freigabe,
         ohne Konto eine Datei. */
      (wolkeDa()
        ? '<button data-a="wolke"><span class="mi">↗</span>Teilen und veröffentlichen …</button>' +
          '<div class="teilen-hinweis">Eine Freigabe ist ein Link ins Netz — ' +
          'nur die Seite, die du freigibst, und widerrufbar.</div>'
        : '<div class="teilen-hinweis">Ohne Konto heisst Weitergeben: eine Datei ' +
          'erzeugen. Mit einem Konto (Wolke) geht auch eine Freigabe ins Netz.</div>'),
      r.right - 240, r.bottom + 6);

    m.addEventListener('click', e => {
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      m.remove();
      const a = b.dataset.a;
      if (a === 'wolke') { (globalThis as any).WolkeFenster.teilenFenster(p.id); return; }
      if (a === 'link') { Ablage.kopiereJetzt(location.origin + location.pathname + '#' + p.id, 'Link kopiert'); }
      if (a === 'text') { Ablage.kopiereJetzt(alsMarkdown(p), 'Text kopiert'); }
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
      if (a === 'obsidian') void obsidianVaultExport();
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

    /* ======================================================================
     * EINE GRENZE STATT ZWEIER (E99)
     * ----------------------------------------------------------------------
     * Bis hierher nahm das Ziehen-und-Ablegen Dateien bis 12 MB als
     * Data-Adresse und warf alles Grössere mit einem Hinweis weg — während
     * der Knopf am Datei-Block dieselbe Datei bis 500 MB in Stücken ablegte.
     * Dieselbe Datei, zwei Ergebnisse, je nachdem wie man sie hereinbrachte.
     * §14 nennt genau diese 12-MB-Grenze als nicht endgültig.
     *
     * Jetzt entscheidet `Dateien.lohntSich` an EINER Stelle, wie beim Knopf.
     * ====================================================================*/
    const anhaengen = async (seite: string, f: File, art: 'image' | 'file'): Promise<void> => {
      const grund: Record<string, unknown> = art === 'image'
        ? { caption: f.name } : { text: f.name };

      if (typeof Dateien !== 'undefined' && Dateien.lohntSich(f.size)) {
        if (f.size > Dateien.GRENZE) {
          UI.toast('„' + f.name + '" ist grösser als ' +
                   Dateien.groesseText(Dateien.GRENZE) + '. So viel hält der Browser nicht.');
          return;
        }
        const b = Store.addBlock(seite, art, grund);
        const melder = UI.toast('„' + f.name + '" wird abgelegt … 0 %', 60000);
        try {
          const satz = await Dateien.ablegen(f, { blockId: b.id,
            beiFortschritt: (anteil: number) => {
              if (melder && melder.textContent !== undefined)
                melder.textContent = '„' + f.name + '" wird abgelegt … ' +
                                     Math.round(anteil * 100) + ' %';
            } });
          /* Nur die Kennung in den Block — die blob-Adresse gilt nur für
             diese Sitzung (E98). */
          await Dateien.adresse(satz.id);
          Store.updateBlock(b.id, { dateiId: satz.id, typ: f.type });
          if (melder && melder.remove) melder.remove();
          UI.toast('„' + f.name + '" abgelegt (' + Dateien.groesseText(f.size) +
                   ' in ' + satz.teile + ' Stücken)');
        } catch (err: unknown) {
          if (melder && melder.remove) melder.remove();
          UI.toast('„' + f.name + '" ging nicht: ' +
                   (err instanceof Error ? err.message : String(err)));
        }
        return;
      }

      /* Kleines geht weiter den kurzen Weg — für ein Bild von 40 KB wäre
         der Apparat oben Unfug. */
      const daten = await new Promise(ok => {
        const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(f);
      });
      Store.addBlock(seite, art, { ...grund, src: daten });
    };

    bereich.addEventListener('drop', async e => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      bereich.classList.remove('ablegen');
      const seite = App.aktuelleSeite();
      /* IM REGAL GIBT ES KEINE SEITE — ALSO WIRD JEDE DATEI EIN DOKUMENT (E350).
         Bis hierher hiess es „Erst eine Seite öffnen", und genau dort, wo
         die Dokumente liegen, ging nichts. Jetzt: eine ZIP wird entpackt,
         wie sie ist, alles andere wird ein Dokument an der Wurzel — oder im
         offenen Fach der Notizhefte. */
      const ort = typeof App.schauplatz === 'function' ? App.schauplatz() : '';
      const imRegal = !seite && (ort === 'bibliothek' || ort === 'notizhefte');
      if (!seite && !imRegal) { UI.toast('Erst eine Seite öffnen'); return; }
      if (imRegal) {
        if (typeof ArchivImport === 'undefined') { UI.toast('Erst eine Seite öffnen'); return; }
        const fach = String(Store.getMeta('heft:fach') || '');
        const ziel = ort === 'notizhefte' && fach && Store.getBlock(fach) ? fach : null;
        let n = 0;
        for (const f of e.dataTransfer.files) {
          try {
            if (/\.zip$/i.test(f.name)) {
              const erg = await ArchivImport.importZip(f, ziel, { still: true });
              UI.toast(erg.hinweis, 9000);
            } else { await ArchivImport.dateiAlsDokument(f, ziel); n++; }
          } catch (err: unknown) {
            UI.toast('„' + f.name + '" ging nicht: ' + (err instanceof Error ? err.message : String(err)));
          }
        }
        if (n) UI.toast(n + (n === 1 ? ' Dokument angelegt' : ' Dokumente angelegt'));
        ArchivImport.ansichtAuffrischen();
        return;
      }

      for (const f of e.dataTransfer.files) {
        const name = f.name.toLowerCase();

        if (f.type.startsWith('image/')) { await anhaengen(seite, f, 'image'); continue; }

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

        /* EINE ZIP WIRD ENTPACKT, WIE SIE IST (E350) — unter der offenen Seite. */
        if (/\.zip$/i.test(name) && typeof ArchivImport !== 'undefined') {
          try {
            const erg = await ArchivImport.importZip(f, seite, { still: true });
            UI.toast(erg.hinweis, 9000);
          } catch (err: unknown) {
            UI.toast('„' + f.name + '" ging nicht: ' + (err instanceof Error ? err.message : String(err)));
          }
          continue;
        }

        /* NUR TEXT WIRD ALS TEXT GELESEN (E350). Hier stand `await f.text()`
           für ALLES, was bis hierher kam — auch für ein 400-MB-Video, das
           gleich darauf ohnehin Anhang wurde. */
        const istText = /\.(csv|tsv|html?|htm|md|markdown|txt)$/i.test(name);
        const text = istText ? await f.text() : '';

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

        /* Ein PDF wird zu beschreibbaren Seiten (E103) — das Original
           legt `alsSeiten` selbst als Anhang ab, Byte für Byte. */
        if (/\.pdf$/i.test(name) && typeof PdfEinlesen !== 'undefined') {
          try { await PdfEinlesen.alsSeiten(f, seite); continue; }
          catch { /* Nichts verschlucken (E104): `alsSeiten` hängt die Datei
                     selbst an, sobald es sie abgelegt hat, und wirft nur
                     dann noch, wenn nicht einmal DAS ging. Dann ist der
                     gewöhnliche Weg genau der richtige — vorher stand hier
                     `continue`, und ein kaputtes PDF hinterliess eine leere
                     Seite (test173). */ }
        }

        /* Alles andere als Datei anhängen — ohne willkürliche Grenze. */
        await anhaengen(seite, f, 'file');
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
    erinnerungSetzen, erinnerungen, erinnerungenPruefen, geraeteMeldung, posteingangMelden, meldungen, meldungGelesen, meldungenAlleGelesen, meldungenLeeren,
    weckrufLegen, naechsteErinnerung,
    ordnerSchreiben, ordnerLesen, dateienLesen, einzelDatei,
    htmlExport, drucken, seiteAlsHtml, verschiebenNach, verschiebe,
    alleToggles, tastenkuerzel, systemSeite, datumLang, zeitKurz, papierkorbAufraeumen,
    wikiUmwandeln, wikiIndex, teilenMenue,
    seitenMenueZusatz, seitenMenueAktion
  };
})();

(window as any).Werkzeuge = Werkzeuge;

/* ============================================================================
 * DIE KONTEXTKANTE EINER OFFENEN SEITE (E272 Phase F)
 * ----------------------------------------------------------------------------
 * Hier meldet sich der Editor selbst an. Die Kante kennt diesen Bereich
 * nicht — sie fragt `Register.kontext.fuer('editor')` und zeichnet, was
 * zurückkommt (§5).
 *
 * KEIN EINZIGER NEUER GRIFF. Jede Zeile ruft dieselbe Funktion wie das
 * Menüband und das Seitenmenü. Eine Kante mit eigener Logik wäre eine
 * dritte Stelle, an der „Fassungen" etwas anderes bedeutet.
 * ==========================================================================*/
if (typeof Register !== 'undefined' && (Register as any).kontext) {
  const K = (Register as any).kontext;
  const seite = (): any => {
    try {
      const id = App.aktuelleSeite();
      return id ? Store.getBlock(id) : null;
    } catch { return null; }
  };

  K.melde({
    bereich: 'editor', id: 'seitenwerkzeuge', name: 'Seitenwerkzeuge',
    zeichen: 'settings', rang: 10,
    liefern: () => {
      const p = seite();
      if (!p) return [];
      return [
        { id: 'statistik', name: 'Statistik', unter: 'Wörter, Zeichen, Lesezeit',
          zeichen: 'chart', tun: () => Werkzeuge.statistik(p) },
        { id: 'drucken', name: 'Drucken oder als PDF', zeichen: 'printer',
          tun: () => { void Werkzeuge.drucken(p); } },
        { id: 'sperren', name: p.locked ? 'Entsperren' : 'Gegen Bearbeiten sperren',
          zeichen: p.locked ? 'lockOpen' : 'lock',
          tun: () => (p.locked ? Werkzeuge.entsperren(p) : Werkzeuge.sperren(p)) },
        { id: 'fokus', name: 'Fokusmodus', unter: 'Strg + Umschalt + F',
          zeichen: 'eye', tun: () => Werkzeuge.fokus() },
        { id: 'praesentation', name: 'Präsentation', zeichen: 'play',
          tun: () => { void Werkzeuge.praesentation(p); } }
      ];
    }
  });

  K.melde({
    bereich: 'editor', id: 'fassungen', name: 'Fassungen',
    zeichen: 'history', rang: 20,
    zeigen: () => !!seite(),
    tun: () => { const p = seite(); if (p) Werkzeuge.versionen(p); }
  });

  /* `karten()` GIBT EINE LISTE ZURÜCK und öffnet nichts — nachgesehen,
     nicht geraten (Zeile 567). Der Weg zum Lernen ist `lernen()`. */
  K.melde({
    bereich: 'editor', id: 'karteikarten', name: 'Karteikarten',
    zeichen: 'cards', rang: 40,
    liefern: () => {
      let liste: any[] = [];
      try { liste = Werkzeuge.karten() || []; } catch { liste = []; }
      const raus: any[] = [{ id: 'lernen', name: 'Lernzentrum öffnen',
        unter: liste.length + ' Karten im Bestand', zeichen: 'learn',
        tun: () => Werkzeuge.lernen() }];
      for (const k of liste.slice(0, 10)) raus.push({
        id: 'karte-' + k.id,
        name: (String(k.text || 'Karte').split('::')[0] || 'Karte').trim(),
        zeichen: 'cards',
        tun: () => { try { App.zeigeBlock(k.id); } catch { /* … */ } }
      });
      return raus;
    }
  });

  /* DERSELBE KATALOG WIE „EINFÜGEN" (§8). Ein zweiter Blockkatalog wäre
     eine Liste, die bei jeder neuen Blockart vergessen wird. */
  K.melde({
    bereich: 'editor', id: 'bloecke', name: 'Blöcke',
    zeichen: 'plus', rang: 30,
    zeigen: () => !!(typeof Register !== 'undefined' && Register.bloecke?.alle),
    liefern: () => {
      const p = seite();
      if (!p) return [];
      return (Register.bloecke.alle() || []).slice(0, 24).map((b: any) => ({
        id: 'blk-' + b.id, name: String(b.name || b.id), zeichen: b.zeichen,
        tun: () => {
          try { Store.addBlock(p.id, b.id, {}); App.zeichneSeite(); }
          catch { /* eine Blockart, die es nicht mehr gibt, tut nichts */ }
        }
      }));
    }
  });
}
