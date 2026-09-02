/* ============================================================================
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/notebook.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/notebook.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * ==========================================================================*/
/* ==========================================================================
 * notebook.js — die Ansicht „Notizhefte" (E264, Bibliothek dazu in E265)
 *
 * Redur, wörtlich: „Ich brauche eine ganz neue Ansicht, komplett neu, wie
 * GoodNotes. Es sollte schnell zugreifbar sein — wenn man öffnet, muss man
 * direkt wissen, was man machen muss." Und zum Dossier: „Es muss so sein —
 * aber ohne unsere Funktionen zu löschen."
 *
 * Die Ansicht ist ein Regal aus Heft-Deckeln, das mit EINEM Tipp in ein
 * schreibbereites A4-Heft führt. Seit E265 ist sie zusätzlich die
 * Heft-Bibliothek aus dem GoodNotes-Dossier: Reiter (Dokumente, Favoriten,
 * Papierkorb), Fächer, Gitter oder Liste, Stern, Deckelfarbe und das
 * Verschlüsseln im Kontextmenü. GoodNotes liefert dabei nur die ABLÄUFE;
 * die Optik besteht vollständig aus Redions gezeichneten Deckeln und
 * Marken — nichts wird nachgebaut.
 *
 * EIN HEFT IST KEINE NEUE DATENART, sondern eine Ansichtsregel: eine
 * lebende Seite, deren direkte Kinder mindestens einen blatt-Block und
 * keinen pdfseite-Block enthalten. Kein gespeichertes Feld, keine
 * Migration (§9) — dieselbe Linie, mit der die Bibliothek ihre Deckel-Art
 * bestimmt (artVon: pdf hat Vorrang vor blatt). Das geöffnete Heft ist
 * der vorhandene Dokumentmodus; diese Datei steuert nur den kurzen Weg
 * dorthin bei.
 *
 * EIN FACH IST GENAUSO WENIG EINE DATENART: eine lebende Seite ohne
 * eigene Blätter, in der Hefte liegen. Das einzige gespeicherte Korn ist
 * `heftArt` — 'fach' am frisch angelegten, noch leeren Fach (sonst wäre
 * es unsichtbar, bis das erste Heft darin liegt) und 'heft' an einer
 * Seite, die IM REGAL verschlüsselt wurde (ihre Kinder sind dann
 * Chiffretext, die abgeleitete Regel wäre blind). Beides ist additiv,
 * nichts Bestehendes ändert seine Bedeutung.
 *
 * Die Ansicht heisst „Notizhefte" und nicht „Hefte", weil „Heft" seit
 * E207 in der Bibliothek die Quellen-Gruppierung meint — ein Wort darf
 * nicht zwei Dinge bezeichnen.
 * ========================================================================*/
const Notebook = (() => {

  /* Sicher escapen — mit `&quot;`, denn Heftnamen landen in Attributen. */
  const esc = (s: unknown): string => String(s ?? '').replace(/[&<>"]/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c] ?? c);

  /* DER ZUSTAND DES REGALS ÜBERLEBT DAS NEULADEN (E282 / L78 Punkt 3).
     Hier stand: „Reiter und offenes Fach sind Blickrichtungen, keine Orte
     — nach einem Neuladen beginnt das Regal vorn." Das war beim Bau von
     E265 eine vertretbare Grenze und ist beim Benutzen eine ärgerliche:
     wer in einem Fach arbeitet, ein Heft öffnet und zurückgeht, stand
     wieder an der Wurzel. Redur hat es in E277 entschieden.

     ZWEI WÄCHTER, und beide sind nötig. Ein gemerkter Reiter, den es
     nicht gibt, und ein gemerktes Fach, das gelöscht wurde, sind KEIN
     Zustand, sondern eine Sackgasse: das Regal öffnete sich in eine
     Brotkrume ohne Inhalt und mit einem Zurück-Knopf als einzigem Weg.
     Beide fallen deshalb auf die Wurzel zurück, statt zu zeigen, was
     nicht mehr da ist.

     Der Suchtext wird ABSICHTLICH nicht gemerkt. Er ist eine Frage, keine
     Blickrichtung — und eine Frage von vorgestern beim Öffnen wieder
     vorzufinden, mit einem halb leeren Regal darunter, sieht aus wie ein
     Fehler. */
  const REITER = ['dokumente', 'favoriten', 'papierkorb'] as const;
  type Reiter = typeof REITER[number];

  const gemerkterReiter = (): Reiter => {
    const w = String(Store.getMeta('heft:reiter', '') || '');
    return (REITER as readonly string[]).includes(w) ? (w as Reiter) : 'dokumente';
  };

  /** Das gemerkte Fach — aber nur, wenn es das noch gibt UND es noch ein
   *  Fach ist. Ein Heft, das sein letztes Unterheft verloren hat, ist
   *  keins mehr (siehe `istFach`); es als Fach zu öffnen zeigte eine
   *  leere Mappe. */
  const gemerktesFach = (): string | null => {
    const id = String(Store.getMeta('heft:fach', '') || '');
    if (!id) return null;
    const p = Store.getBlock(id);
    if (!p || p.alive === false || !istFach(p)) { Store.setMeta('heft:fach', ''); return null; }
    return id;
  };

  let searchText = '';
  let shelfRoot: HTMLElement | null = null;
  let tab: Reiter = 'dokumente';
  let fachId: string | null = null;

  /* ------------------------------------------------------------------ *
   * Die Heft-Regel — und seit E265 die Fach-Regel daneben
   * ------------------------------------------------------------------ */

  /** Heftartig OHNE die Frage, ob die Seite lebt — der Papierkorb-Reiter
   *  braucht dieselbe Regel für tote Seiten. `trashBlock` lässt die
   *  Kinder lebendig, `childrenOf` funktioniert also unverändert.
   *  Eine verschlüsselte Seite hat KEINE lesbaren Kinder mehr; sie
   *  zählt als Heft, solange sie gesperrt ist und den Merker trägt
   *  (gesetzt beim Sperren aus dem Regal). Sobald sie wieder offen ist,
   *  entscheidet allein die abgeleitete Regel — ein verwaister Merker
   *  kann so nie lügen. */
  const heftArtig = (p: any): boolean => {
    if (!p || p.type !== 'page' || p.system) return false;
    if (p.locked) return p.heftArt === 'heft';
    const kinder = Store.childrenOf(p.id);
    if (kinder.some((k: any) => k.type === 'pdfseite')) return false;
    return kinder.some((k: any) => k.type === 'blatt');
  };

  /** Eine Seite ist ein Heft, wenn sie lebt und heftartig ist. Nur
   *  direkte Kinder; der pdf-Vorrang ist deckungsgleich mit der
   *  Deckel-Art der Bibliothek. Grenzen stehen in LUECKEN.md. */
  const isNotebook = (p: any): boolean => !!p && p.alive !== false && heftArtig(p);

  /** Ein Fach: eine lebende Seite ohne eigene Blätter/PDF-Seiten, in der
   *  mindestens ein Heft liegt — oder die als Fach angelegt wurde
   *  (`heftArt:'fach'`), damit sie nicht unsichtbar ist, solange sie
   *  leer ist. Eine verschlüsselte Seite ist nie ein Fach: was in ihr
   *  liegt, ist von aussen nicht zu sehen. */
  const istFach = (p: any): boolean => {
    if (!p || p.type !== 'page' || p.alive === false || p.system || p.locked) return false;
    const kinder = Store.childrenOf(p.id);
    if (kinder.some((k: any) => k.type === 'blatt' || k.type === 'pdfseite')) return false;
    return kinder.some(isNotebook) || p.heftArt === 'fach';
  };

  const notebookPages = (): any[] =>
    Object.values<any>(Store.cache.blocks)
      .filter(isNotebook)
      .sort((a, b) => String(b.edited || '').localeCompare(String(a.edited || '')));

  /** Alle Fächer, flach und nach Namen — auch ein Fach in einem Fach
   *  steht an der Wurzel (EINE Ebene zeigt das Regal; nichts geht
   *  verloren, die Grenze steht in LUECKEN.md). */
  const faecher = (): any[] =>
    Object.values<any>(Store.cache.blocks)
      .filter(istFach)
      .sort((a, b) => String(a.text || '').localeCompare(String(b.text || ''), 'de'));

  /** Hefte, deren Eltern-Seite KEIN Fach ist — sie liegen lose im Regal
   *  (Hefte in gewöhnlichen Seiten bleiben so sichtbar, wie seit E264). */
  const loseHefte = (): any[] =>
    notebookPages().filter(p => !istFach(p.parentId ? Store.getBlock(p.parentId) : null));

  const fachHefte = (fid: string): any[] =>
    Store.childrenOf(fid).filter(isNotebook)
      .sort((a: any, b: any) => String(b.edited || '').localeCompare(String(a.edited || '')));

  /** Tote Hefte für den Papierkorb-Reiter. */
  const toteHefte = (): any[] => Store.trashed().filter(heftArtig);

  /** Wie viele A4-Blätter die Seite hat — echt gerechnet aus der
   *  Blatthöhe (E208: keine erfundene Zahl), je blatt-Block mindestens
   *  eines. */
  const sheetCount = (p: any): number => {
    const a4 = (typeof SheetSpace !== 'undefined' && SheetSpace.A4_HOEHE) || 842;
    return Store.childrenOf(p.id)
      .filter((k: any) => k.type === 'blatt')
      .reduce((n: number, k: any) =>
        n + Math.max(1, Math.round((Number(k.blattHoehe) || a4) / a4)), 0);
  };

  const wann = (p: any): string => {
    const bib = (globalThis as any).Bibliothek;
    /* wannText nimmt den ZEITSTEMPEL, nicht die Seite — der erste Wurf
       übergab die Seite und bekam für jedes Heft ein „—" (Bild-Fund). */
    return bib && typeof bib.wannText === 'function' ? bib.wannText(p.edited) : '';
  };

  /** „1 Blatt", „5 Blätter" — eine Einzahl, die „1 Blätter" sagt, sieht
   *  aus wie ein Rechenfehler. Bei einer verschlüsselten Seite wäre die
   *  Zahl 0 und damit gelogen — dort steht das ehrliche Wort. */
  const sheetLabel = (p: any): string => {
    if (p.locked) return 'Verschlüsselt';
    const n = sheetCount(p);
    return n === 1 ? '1 Blatt' : n + ' Blätter';
  };

  /* Die Deckelfarbe ist das BESTEHENDE Feld `color`, das an jeder Seite
     liegt und bei Seiten nie gezeichnet wurde — hier wird es zur Kante
     am Deckel. Nur diese Namen erzeugen ein Attribut: der Wert wandert
     in einen Stil, und ein Feld aus einer fremden Sicherung darf dort
     nichts einschleusen können (§19). */
  const FARBEN: ReadonlyArray<{ id: string; name: string }> = [
    { id: 'gray', name: 'Grau' }, { id: 'brown', name: 'Braun' },
    { id: 'orange', name: 'Orange' }, { id: 'yellow', name: 'Gelb' },
    { id: 'green', name: 'Grün' }, { id: 'blue', name: 'Blau' },
    { id: 'purple', name: 'Violett' }, { id: 'pink', name: 'Rosa' },
    { id: 'red', name: 'Rot' }
  ];
  const farbeVon = (p: any): string => {
    const wert = String(p?.color || '');
    return FARBEN.some(f => f.id === wert) ? wert : '';
  };

  /* ------------------------------------------------------------------ *
   * Öffnen und Anlegen
   * ------------------------------------------------------------------ */

  /** Den Cursor in die erste Textzeile des ersten Blatts setzen.
   *  `App.zeichneSeite(kindId)` ist der sanktionierte Weg; weil der
   *  Dokumentmodus asynchron nachzeichnet, folgt EIN rAF-Nachversuch
   *  direkt am Feld — mit Wache, dass die Seite noch offen ist. Danach
   *  wird ohne Fehler aufgegeben (der Nutzer klickt dann selbst). */
  const focusFirstLine = (pageId: string): void => {
    const sheet = Store.childrenOf(pageId).find((k: any) => k.type === 'blatt');
    if (!sheet) return;
    const line = Store.childrenOf(sheet.id).find((k: any) => k.type === 'text')
      || Store.childrenOf(sheet.id)[0];
    if (!line) return;
    App.zeichneSeite(line.id);
    requestAnimationFrame(() => {
      if (App.aktuelleSeite && App.aktuelleSeite() !== pageId) return;
      const feld = document.querySelector<HTMLElement>(
        `[data-bid="${esc(line.id)}"] .ct`);
      if (feld && document.activeElement !== feld) feld.focus();
    });
  };

  const openNotebook = (id: string): void => {
    const p = Store.getBlock(id);
    if (!p || p.alive === false) {
      /* Kein toter Knopf (E118): sagen, was los ist, und das Regal
         auffrischen, damit der Deckel verschwindet. */
      UI.toast('Dieses Heft gibt es nicht mehr.');
      renderShelf();
      return;
    }
    if (p.locked) {
      /* Eine gesperrte Seite öffnet ihren Sperrbildschirm über den ganz
         normalen Weg — kein Dokumentmodus, kein Fokusversuch in
         Chiffretext. */
      Store.setMeta('heft:zuletzt', id);
      App.oeffne(id);
      return;
    }
    if (!p.dokumentModus) Store.updateBlock(id, { dokumentModus: true });
    Store.setMeta('heft:zuletzt', id);
    App.oeffne(id);
    focusFirstLine(id);
  };

  /** Ein Heft anlegen und SOFORT schreibbereit öffnen — ohne Dialog.
   *  Im offenen Fach entsteht es IM Fach. Die Papierwahl liegt im
   *  geöffneten Heft einen Tipp entfernt (Blatt-Leiste); als Vorgabe
   *  gilt das zuletzt gewählte Papier — und wer im Neu-Menü ein Papier
   *  antippt, wählt es damit zugleich als neue Vorgabe. Das
   *  E118-Textkind wird hier selbst angelegt, damit der Fokusweg die
   *  Kennung kennt, statt auf den Renderer zu warten. */
  const createNotebook = (papier?: string): void => {
    const gewaehlt = papier || String(Store.getMeta('heft:papier', 'liniert'));
    if (papier) Store.setMeta('heft:papier', papier);
    const eltern = tab === 'dokumente' ? fachId : null;
    const datum = new Date().toLocaleDateString('de-DE',
      { day: 'numeric', month: 'short' });
    const p = Store.addPage(eltern, { text: 'Heft vom ' + datum, icon: '📓' });
    const sheet = Store.addBlock(p.id, 'blatt', { text: '', papier: gewaehlt });
    Store.addBlock(sheet.id, 'text', { text: '' });
    Store.updateBlock(p.id, { dokumentModus: true });
    Store.setMeta('heft:zuletzt', p.id);
    App.oeffne(p.id);
    focusFirstLine(p.id);
  };

  /** Ein Fach anlegen — eine gewöhnliche Seite mit Mappensymbol. Der
   *  `heftArt:'fach'`-Merker hält sie im Regal sichtbar, solange sie
   *  leer ist; sobald Hefte darin liegen, trüge sie sich auch ohne ihn
   *  selbst (istFach). */
  const createFach = async (): Promise<void> => {
    const name = await UI.frage('Name des Fachs', '');
    if (!name) return;
    Store.addPage(null, { text: name, icon: '🗂', heftArt: 'fach' });
    renderShelf();
  };

  /** Ein Heft in ein Fach hängen (oder mit zielId null zurück ins
   *  Regal). `Werkzeuge.verschiebe` pflegt beide content-Listen und
   *  zeichnet selbst neu; die Ring-Wache davor fehlt ihm — ein Fach,
   *  das UNTER dem Heft hängt, wäre sonst sein eigener Grossvater. */
  const moveToFach = (heftId: string, zielId: string | null): void => {
    const p = Store.getBlock(heftId);
    if (!p) return;
    if (zielId) {
      if (zielId === heftId ||
          (typeof WissenDienst !== 'undefined' && WissenDienst.istUnter(zielId, heftId))) {
        UI.toast('Das geht nicht — dieses Fach liegt im Heft selbst.');
        return;
      }
    }
    Werkzeuge.verschiebe(p, zielId);
  };

  const toggleFavorit = (id: string): void => {
    const p = Store.getBlock(id);
    if (!p) return;
    Store.updateBlock(id, { favorite: !p.favorite });
    renderShelf();
  };

  const setzeFarbe = (id: string, farbe: string): void => {
    Store.updateBlock(id, { color: FARBEN.some(f => f.id === farbe) ? farbe : '' });
    renderShelf();
  };

  /** Verschlüsseln aus dem Regal. NACH dem erfolgreichen Sperren wird
   *  `heftArt:'heft'` gesetzt — die Kinder sind dann Chiffretext, und
   *  ohne den Merker fiele das Heft aus seiner eigenen Bibliothek
   *  (Erfolg = das locked-Feld steht wirklich am Block; ein Abbruch im
   *  Passwortdialog ändert nichts). */
  const sperrenHier = async (id: string): Promise<void> => {
    const p = Store.getBlock(id);
    if (!p) return;
    await Werkzeuge.sperren(p);
    const danach = Store.getBlock(id);
    if (danach?.locked && danach.heftArt !== 'heft')
      Store.updateBlock(id, { heftArt: 'heft' });
    renderShelf();
  };

  const entsperrenHier = async (id: string): Promise<void> => {
    const p = Store.getBlock(id);
    if (!p) return;
    await Werkzeuge.entsperren(p);
    renderShelf();
  };

  /** Für die Startansicht „Zuletzt benutztes Heft": direkt hinein — und
   *  wenn es das Heft nicht mehr gibt, lautlos das Regal (§47). */
  const resume = (): void => {
    const id = String(Store.getMeta('heft:zuletzt', '') || '');
    const p = id ? Store.getBlock(id) : null;
    if (p && p.alive !== false) openNotebook(id);
    else oeffnen();
  };

  /* Beim Wechseln MERKEN, nicht beim Zeichnen (E282). `renderShelf` läuft
     auch bei jeder Datenänderung; dort zu schreiben hiesse, bei jedem
     Tastendruck in einem Heft eine Meta-Zeile zu setzen. */
  const openFach = (id: string): void => {
    fachId = id; Store.setMeta('heft:fach', id); renderShelf();
  };
  const closeFach = (): void => {
    fachId = null; Store.setMeta('heft:fach', ''); renderShelf();
  };

  /* ------------------------------------------------------------------ *
   * Das Regal
   * ------------------------------------------------------------------ */

  const form = (): 'gitter' | 'liste' =>
    Store.getMeta('heft:form', 'gitter') === 'liste' ? 'liste' : 'gitter';

  /** Ein Deckel im Regal. Die Optik ist die gezeichnete Deckelkarte der
   *  Bibliothek (Klassen `bib-deckel`/`bib-deckel-blatt`, E207) — das
   *  Markup steht hier bewusst NOCH EINMAL, denn ein Bereich importiert
   *  keinen anderen (§5); geteilt wird über die Stilklassen. Das
   *  Deckel-Blatt trägt das Papier des ersten Blatts: ein kariertes
   *  Heft sieht im Regal kariert aus. Stern und ⋯ sind GESCHWISTER des
   *  Deckel-Knopfs — ein Knopf im Knopf wäre keiner (§38). */
  const coverCard = (p: any): string => {
    const sheet = Store.childrenOf(p.id).find((k: any) => k.type === 'blatt');
    const papier = String(sheet?.papier || 'blanko');
    const farbe = farbeVon(p);
    const deckelBlatt = p.locked
      ? `<span class="bib-deckel-blatt is-leer is-gesperrt">` +
        `<span class="nh-schloss" aria-hidden="true">🔒</span></span>`
      : `<span class="bib-deckel-blatt is-leer" data-papier="${esc(papier)}">` +
        `<i class="bib-papier" aria-hidden="true"></i></span>`;
    return `<div class="nh-karte">` +
      `<button class="bib-deckel" data-id="${esc(p.id)}" data-art="blatt"` +
      (farbe ? ` data-farbe="${esc(farbe)}" style="--deckel-farbe:var(--c-${esc(farbe)})"` : '') +
      ` aria-label="Heft öffnen: ${esc(p.text || 'Ohne Titel')}">` +
      /* `is-leer` lässt das gezeichnete Papier durch — auf diesen Deckeln
         steht nie Vorschautext, das Papier IST die Vorschau. */
      deckelBlatt +
      `<span class="bib-deckel-name"><b>${esc(p.text || 'Ohne Titel')}</b></span>` +
      `<small>${esc(sheetLabel(p))}${p.locked ? '' : ' · ' + esc(wann(p))}</small>` +
      `</button>` +
      sternKnopf(p) +
      `<button class="nh-mehr" data-mehr="${esc(p.id)}" title="Mehr zu diesem Heft" ` +
      `aria-label="Mehr zu ${esc(p.text || 'diesem Heft')}">⋯</button></div>`;
  };

  /** Der Stern zeigt seinen Zustand über die FORM (★ gefüllt, ☆ leer)
   *  und `aria-pressed` — nicht nur über Farbe (§38). */
  const sternKnopf = (p: any): string =>
    `<button class="nh-stern${p.favorite ? ' an' : ''}" data-stern="${esc(p.id)}" ` +
    `aria-pressed="${p.favorite ? 'true' : 'false'}" ` +
    `title="${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}" ` +
    `aria-label="${p.favorite ? 'Aus Favoriten: ' : 'Zu Favoriten: '}` +
    `${esc(p.text || 'Ohne Titel')}">${p.favorite ? '★' : '☆'}</button>`;

  /** Die Fach-Karte: Redions gezeichnete Ordner-Mappe (`data-art="ordner"`
   *  aus der Bibliotheks-Anatomie) mit Symbol und ehrlicher Zählung. */
  const fachCard = (f: any): string => {
    const n = fachHefte(f.id).length;
    return `<div class="nh-karte nh-fach">` +
      `<button class="bib-deckel" data-fach="${esc(f.id)}" data-art="ordner" ` +
      `aria-label="Fach öffnen: ${esc(f.text || 'Ohne Namen')}">` +
      `<span class="bib-deckel-blatt is-leer">` +
      `<span class="nh-fach-icon" aria-hidden="true">${esc(f.icon || '🗂')}</span></span>` +
      `<span class="bib-deckel-name"><b>${esc(f.text || 'Ohne Namen')}</b></span>` +
      `<small>${n === 1 ? '1 Heft' : n + ' Hefte'}</small>` +
      `</button>` +
      `<button class="nh-mehr" data-mehr-fach="${esc(f.id)}" title="Mehr zu diesem Fach" ` +
      `aria-label="Mehr zu ${esc(f.text || 'diesem Fach')}">⋯</button></div>`;
  };

  /** Eine Zeile der Listenform — Mini-Deckel, Name, Blattzahl, Zeit. */
  const listRow = (p: any): string => {
    const sheet = Store.childrenOf(p.id).find((k: any) => k.type === 'blatt');
    const papier = String(sheet?.papier || 'blanko');
    const mini = p.locked
      ? `<span class="bib-deckel-blatt is-leer nh-mini is-gesperrt" aria-hidden="true">` +
        `<span class="nh-schloss">🔒</span></span>`
      : `<span class="bib-deckel-blatt is-leer nh-mini" data-papier="${esc(papier)}" ` +
        `aria-hidden="true"><i class="bib-papier"></i></span>`;
    const farbe = farbeVon(p);
    return `<div class="nh-zeile">` +
      `<button class="nh-zeile-auf" data-id="${esc(p.id)}"` +
      (farbe ? ` data-farbe="${esc(farbe)}" style="--deckel-farbe:var(--c-${esc(farbe)})"` : '') +
      `>` + mini +
      `<span class="nh-zeile-text"><b>${esc(p.text || 'Ohne Titel')}</b>` +
      `<small>${esc(sheetLabel(p))}${p.locked ? '' : ' · ' + esc(wann(p))}</small></span>` +
      `</button>` + sternKnopf(p) +
      `<button class="nh-mehr" data-mehr="${esc(p.id)}" title="Mehr zu diesem Heft" ` +
      `aria-label="Mehr zu ${esc(p.text || 'diesem Heft')}">⋯</button></div>`;
  };

  const fachRow = (f: any): string => {
    const n = fachHefte(f.id).length;
    return `<div class="nh-zeile nh-fach">` +
      `<button class="nh-zeile-auf" data-fach="${esc(f.id)}">` +
      `<span class="nh-mini nh-mini-fach" aria-hidden="true">${esc(f.icon || '🗂')}</span>` +
      `<span class="nh-zeile-text"><b>${esc(f.text || 'Ohne Namen')}</b>` +
      `<small>${n === 1 ? '1 Heft' : n + ' Hefte'}</small></span>` +
      `</button>` +
      `<button class="nh-mehr" data-mehr-fach="${esc(f.id)}" title="Mehr zu diesem Fach" ` +
      `aria-label="Mehr zu ${esc(f.text || 'diesem Fach')}">⋯</button></div>`;
  };

  /** Ein toter Deckel im Papierkorb-Reiter: nichts zu öffnen, nur der
   *  eine Wort-Knopf. Endgültig löschen gibt es hier NICHT — die eine
   *  Löschmaschine mit Rückfrage ist der Papierkorb selbst (E29). */
  const trashCard = (p: any): string => {
    const sheet = Store.childrenOf(p.id).find((k: any) => k.type === 'blatt');
    const papier = String(sheet?.papier || 'blanko');
    return `<div class="nh-karte nh-tot">` +
      `<div class="bib-deckel" data-art="blatt" aria-hidden="true">` +
      `<span class="bib-deckel-blatt is-leer" data-papier="${esc(papier)}">` +
      `<i class="bib-papier"></i></span>` +
      `<span class="bib-deckel-name"><b>${esc(p.text || 'Ohne Titel')}</b></span>` +
      `</div>` +
      `<button class="rb leise nh-herstellen" data-herstellen="${esc(p.id)}">` +
      `Wiederherstellen</button></div>`;
  };

  const resumeCard = (): string => {
    const id = String(Store.getMeta('heft:zuletzt', '') || '');
    const p = id ? Store.getBlock(id) : null;
    if (!p || !isNotebook(p)) return '';
    return `<button class="nh-weiter" data-id="${esc(p.id)}">` +
      `<span class="bib-deckel-blatt is-leer" aria-hidden="true">` +
      `<i class="bib-papier"></i></span>` +
      `<span class="nh-weiter-text"><strong>${esc(p.text || 'Ohne Titel')}</strong>` +
      `<small>Weiterschreiben · ${esc(wann(p))} · ${esc(sheetLabel(p))}</small>` +
      `</span></button>`;
  };

  const emptyState = (andereSeiten: boolean): string =>
    `<div class="nh-leer leer-zustand">` +
    `<button class="nh-neu nh-erstes" data-neu>` +
    `<span class="nh-neu-plus" aria-hidden="true">＋</span>` +
    `<span>Dein erstes Heft</span></button>` +
    `<p>Ein Heft ist eine Seite mit A4-Blättern — liniert, kariert, blanko, ` +
    `Punktraster oder Millimeterpapier.</p>` +
    (andereSeiten
      ? `<button class="rb leise" data-alle>Alle Dokumente ansehen</button>` : '') +
    `</div>`;

  /* ------------------------------------------------------------------ *
   * Der Kopf: Titel oder Brotkrume, Suche, Neu, Reiter, Formwahl
   * ------------------------------------------------------------------ */

  const kopfHtml = (): string => {
    const fach = fachId ? Store.getBlock(fachId) : null;
    const zeile1 =
      `<div class="nh-kopf-zeile">` +
      (fach
        ? `<button class="rb leise nh-zurueck" data-zurueck>← Notizhefte</button>` +
          `<h1>${esc(fach.icon || '🗂')} ${esc(fach.text || 'Ohne Namen')}</h1>`
        : `<h1>Notizhefte</h1>`) +
      `<input class="nh-suche" type="search" placeholder="Heft suchen …" ` +
      `aria-label="Notizhefte durchsuchen" value="${esc(searchText)}"` +
      `${searchText ? '' : ' hidden'}>` +
      `<button class="rb zeichen nh-suche-knopf" data-suche title="Heft suchen" ` +
      `aria-label="Notizhefte durchsuchen"><span data-sym="search"></span></button>` +
      `<button class="rb nh-neu-knopf" data-neu-menue>＋ Neu</button>` +
      `<button class="rb nh-alle" data-alle>Alle Dokumente</button>` +
      `</div>`;
    /* Die REITERZEILE nur an der Wurzel — im offenen Fach führt die
       Brotkrume zurück, und ein Reiterwechsel dort wäre zweideutig.

       DIE DARSTELLUNGSWAHL DAGEGEN STEHT ÜBERALL (E283, Nachlauf zu E282).
       Vorher fiel sie mit der Reiterzeile zusammen weg, und das war
       harmlos, solange ein offenes Fach flüchtig war: einmal zurück, und
       der Umschalter war wieder da.

       Seit E282 überlebt das Fach das Neuladen — und damit war der
       Umschalter genau dort unerreichbar, wo er noch WIRKT: der
       Fach-Inhalt liest `form()` weiter (siehe `shelfHtml`). Wer im Fach
       auf Liste stand, konnte nicht zurück auf Gitter, ohne das Fach zu
       verlassen. Ein Zustand, den man einstellen kann und nicht mehr
       ändern, ist §47 von der anderen Seite.

       Gefunden hat es test265 §4, das genau hier über den fehlenden
       Umschalter stolperte — die Prüfung hielt das alte Verhalten fest
       und wurde durch die Entscheidung rot. */
    const favN = notebookPages().filter(p => p.favorite).length;
    const korbN = toteHefte().length;
    const reiterHtml = fach ? '' :
      `<div class="nh-reiter" role="group" aria-label="Bestand">` +
      `<button data-reiter="dokumente"${tab === 'dokumente' ? ' class="on"' : ''}>Dokumente</button>` +
      `<button data-reiter="favoriten"${tab === 'favoriten' ? ' class="on"' : ''}>Favoriten` +
      `${favN ? ' (' + favN + ')' : ''}</button>` +
      `<button data-reiter="papierkorb"${tab === 'papierkorb' ? ' class="on"' : ''}>Papierkorb` +
      `${korbN ? ' (' + korbN + ')' : ''}</button>` +
      `</div>`;
    /* Im Papierkorb nicht: dort gibt es nur die Liste, und ein Umschalter
       ohne zweite Stellung ist eine Attrappe. */
    const formHtml = (!fach && tab === 'papierkorb') ? '' :
      `<div class="nh-form" role="group" aria-label="Darstellung">` +
      `<button data-form="gitter" aria-pressed="${form() === 'gitter'}"` +
      `${form() === 'gitter' ? ' class="on"' : ''}>Gitter</button>` +
      `<button data-form="liste" aria-pressed="${form() === 'liste'}"` +
      `${form() === 'liste' ? ' class="on"' : ''}>Liste</button>` +
      `</div>`;
    const zeile2 = (!reiterHtml && !formHtml) ? '' :
      `<div class="nh-kopf-zeile nh-kopf-zeile2">${reiterHtml}${formHtml}</div>`;
    return `<header class="nh-kopf" data-kopfzeile="eigene">${zeile1}${zeile2}</header>`;
  };

  /* ------------------------------------------------------------------ *
   * Der Inhalt je Reiter
   * ------------------------------------------------------------------ */

  const gefiltert = (liste: any[]): any[] => {
    const filter = searchText.trim().toLowerCase();
    return filter
      ? liste.filter(p => String(p.text || '').toLowerCase().includes(filter))
      : liste;
  };

  /* DER WEG ZUR GROSSEN SUCHE (E282 / L77 Punkt 1).
     Die Regal-Suche findet nur TITEL — das steht so in L77 und bleibt so:
     die grosse Suche kennt längst Inhalte und Handschrift-Erkanntes, und
     das Regal soll sie nicht nachbauen (E29), sondern dorthin führen.

     Bisher führte sie nirgendwohin. Wer „Ohmsches Gesetz" tippte und es
     im Titel keines Heftes stand, bekam „Kein Heft heisst ..." und musste
     selbst darauf kommen, dass es Strg+P gibt.

     Die Zeile steht bei JEDER Suche da, nicht nur bei null Treffern: auch
     wer drei Hefte findet, sucht vielleicht das vierte, in dem das Wort
     nur im Text vorkommt. Ein Angebot, das nur im Misserfolgsfall
     erscheint, findet man genau dann nicht, wenn man es bräuchte. */
  const weiterSuchenZeile = (): string =>
    !searchText.trim() ? '' :
    `<button class="rb leise nh-weitersuchen" data-weitersuchen>` +
    `<span data-sym="search" aria-hidden="true"></span> ` +
    `„${esc(searchText)}" im ganzen Bestand suchen — auch in Texten` +
    `</button>`;

  const nichtsSatz = (): string =>
    `<p class="nh-nichts">Kein Heft heisst „${esc(searchText)}".</p>`;

  const gitterHtml = (hefte: any[], mitNeu: boolean, mitFaechern: boolean): string =>
    `<div class="bib-gitter nh-gitter">` +
    (mitNeu
      ? `<button class="nh-neu" data-neu>` +
        `<span class="nh-neu-plus" aria-hidden="true">＋</span>` +
        `<span>Neues Heft</span></button>`
      : '') +
    (mitFaechern ? faecher().map(fachCard).join('') : '') +
    hefte.map(coverCard).join('') + `</div>`;

  const listeHtml = (hefte: any[], mitFaechern: boolean): string =>
    `<div class="nh-liste">` +
    (mitFaechern ? faecher().map(fachRow).join('') : '') +
    hefte.map(listRow).join('') + `</div>`;

  const korbHtml = (): string => {
    const tote = gefiltert(toteHefte());
    return `<div class="nh-korb">` +
      `<p class="nh-korb-hinweis">Gelöschte Hefte. Wiederherstellen geht hier — ` +
      `endgültig löschen nur im Papierkorb selbst, mit Rückfrage.</p>` +
      (tote.length
        ? `<div class="bib-gitter nh-gitter">` + tote.map(trashCard).join('') + `</div>`
        : `<p class="nh-nichts">Der Papierkorb hält kein Heft.</p>`) +
      `<button class="rb leise nh-korb-auf" data-korb-auf>Papierkorb ganz öffnen …</button>` +
      `</div>`;
  };

  const shelfHtml = (): string => {
    let inhalt = '';
    if (tab === 'papierkorb') {
      inhalt = korbHtml();
    } else if (tab === 'favoriten') {
      const favs = gefiltert(notebookPages().filter(p => p.favorite));
      inhalt = favs.length
        ? (form() === 'liste' ? listeHtml(favs, false) : gitterHtml(favs, false, false))
        : (searchText.trim() ? nichtsSatz()
           : `<p class="nh-nichts">Noch kein Heft mit Stern — der Stern sitzt ` +
             `an jeder Karte.</p>`);
    } else if (fachId && Store.getBlock(fachId)) {
      const hefte = gefiltert(fachHefte(fachId));
      inhalt = (searchText.trim() && !hefte.length) ? nichtsSatz()
        : (form() === 'liste' ? listeHtml(hefte, false) : gitterHtml(hefte, true, false));
    } else {
      if (fachId) fachId = null;     /* das Fach ist weg — zurück zur Wurzel */
      const alle = notebookPages();
      const filter = searchText.trim();
      if (!alle.length && !faecher().length) {
        inhalt = emptyState(Object.values<any>(Store.cache.blocks)
          .some((b: any) => b?.type === 'page' && b.alive !== false && !b.system));
      } else if (filter) {
        /* Während der Suche flach über ALLE Hefte — finden schlägt
           sortieren; die Fach-Karten träten nur dazwischen. */
        const hefte = gefiltert(alle);
        inhalt = resumeCard() + (hefte.length
          ? (form() === 'liste' ? listeHtml(hefte, false) : gitterHtml(hefte, false, false))
          : nichtsSatz());
      } else {
        const lose = loseHefte();
        inhalt = resumeCard() + (form() === 'liste'
          ? listeHtml(lose, true) : gitterHtml(lose, true, true));
      }
    }
    /* Die Brücke zur grossen Suche steht UNTER dem Ergebnis, nicht statt
       seiner — auch dann, wenn Treffer da sind (siehe `weiterSuchenZeile`). */
    return `<div class="nh-regal">` + kopfHtml() + inhalt + weiterSuchenZeile() +
      `<button class="nh-neu-fab" data-neu-menue aria-label="Neu">＋</button>` +
      `</div>`;
  };

  /* ------------------------------------------------------------------ *
   * Menüs
   * ------------------------------------------------------------------ */

  /** Das Neu-Menü am ＋-Knopf im Kopf und am Telefon-FAB. Die grosse
   *  ＋-Kachel im Gitter bleibt davon unberührt der EIN-Klick-Weg zum
   *  Heft (die Seele von E264). Fremde Wege laufen über den EINEN
   *  Katalog der Schale: `App.erstellenWege()` sagt, was diese Fassung
   *  geladen hat (§47), `App.erstellenWeg(id)` führt aus — so kennt
   *  dieser Bereich weder PdfEinlesen noch das Whiteboard (§5, E29). */
  const neuMenue = (anker: HTMLElement): void => {
    const geladen = new Set<string>(
      (App.erstellenWege ? App.erstellenWege() : []).map((w: any) => String(w.id)));
    const weg = (id: string, zeichen: string, name: string): string =>
      geladen.has(id)
        ? `<button data-w="${id}"><span class="mi">${zeichen}</span>${name}</button>`
        : '';
    const papiere = [
      ['liniert', 'Liniert'], ['kariert', 'Kariert'], ['blanko', 'Blanko'],
      ['punkte', 'Punktraster'], ['mm', 'Millimeterpapier']
    ].map(([id, name]) =>
      `<button class="nh-papierwahl" data-w-papier="${id}" title="Neues Heft: ${name}" ` +
      `aria-label="Neues Heft: ${name}">` +
      `<span class="bib-deckel-blatt is-leer nh-mini" data-papier="${id}" aria-hidden="true">` +
      `<i class="bib-papier"></i></span></button>`).join('');
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      `<button data-w="heft"><span class="mi">📓</span>Notizheft</button>` +
      `<div class="nh-papiere">${papiere}</div>` +
      `<button data-w="fach"><span class="mi">🗂</span>Neues Fach</button>` +
      `<div class="sep"></div>` +
      weg('pdf', '📕', 'PDF einlesen') +
      weg('zip', '🗜', 'ZIP entpacken') +
      weg('board', '🖍', 'Whiteboard') +
      weg('seite', '📄', 'Textseite') +
      `<div class="sep"></div>` +
      `<button data-w="alle">Alle Wege …</button>`,
      Math.min(r.left, innerWidth - 240), Math.min(r.bottom + 4, innerHeight - 300));
    m.addEventListener('click', (e: Event) => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel) return;
      const papier = ziel.closest<HTMLElement>('[data-w-papier]');
      const b = ziel.closest<HTMLElement>('[data-w]');
      if (!papier && !b) return;
      m.remove();
      if (papier) return createNotebook(String(papier.dataset['wPapier']));
      const was = String(b?.dataset['w'] || '');
      if (was === 'heft') return createNotebook();
      if (was === 'fach') { void createFach(); return; }
      if (was === 'alle') return App.erstellenBlatt();
      /* Erst schliessen, dann handeln — wie im Katalog-Blatt selbst. */
      setTimeout(() => App.erstellenWeg(was), 60);
    });
  };

  const farbMenue = (anker: HTMLElement, id: string): void => {
    const p = Store.getBlock(id);
    if (!p) return;
    const jetzt = farbeVon(p);
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      `<div class="swatches nh-farben">` +
      FARBEN.map(f =>
        `<button data-farbe="${f.id}" title="${f.name}" aria-label="${f.name}" ` +
        `aria-pressed="${jetzt === f.id}" style="background:var(--c-${f.id})">` +
        `${jetzt === f.id ? '✓' : ''}</button>`).join('') +
      `</div>` +
      `<button data-farbe="">Ohne Farbe</button>`,
      Math.min(r.left, innerWidth - 240), r.bottom + 4);
    m.addEventListener('click', (e: Event) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-farbe]');
      if (!b) return;
      m.remove();
      setzeFarbe(id, String(b.dataset['farbe'] || ''));
    });
  };

  const fachwahlMenue = (anker: HTMLElement, heftId: string): void => {
    const p = Store.getBlock(heftId);
    if (!p) return;
    const ziele = faecher().filter(f => f.id !== heftId &&
      !(typeof WissenDienst !== 'undefined' && WissenDienst.istUnter(f.id, heftId)));
    const imFach = istFach(p.parentId ? Store.getBlock(p.parentId) : null);
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      ziele.map(f =>
        `<button data-z="${esc(f.id)}"><span class="mi">${esc(f.icon || '🗂')}</span>` +
        `${esc(f.text || 'Ohne Namen')}</button>`).join('') +
      (imFach ? `<button data-z=""><span class="mi">▤</span>Regal (ohne Fach)</button>` : '') +
      `<div class="sep"></div>` +
      `<button data-z-neu><span class="mi">＋</span>Neues Fach …</button>`,
      Math.min(r.left, innerWidth - 240), r.bottom + 4);
    m.addEventListener('click', (e: Event) => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel) return;
      const neu = ziel.closest<HTMLElement>('[data-z-neu]');
      const b = ziel.closest<HTMLElement>('[data-z]');
      if (!neu && !b) return;
      m.remove();
      if (neu) {
        void (async () => {
          const name = await UI.frage('Name des Fachs', '');
          if (!name) return;
          const f = Store.addPage(null, { text: name, icon: '🗂', heftArt: 'fach' });
          moveToFach(heftId, f.id);
        })();
        return;
      }
      moveToFach(heftId, String(b?.dataset['z'] || '') || null);
    });
  };

  const kontextMenue = (anker: HTMLElement, id: string): void => {
    const p = Store.getBlock(id);
    if (!p) return;
    const r = anker.getBoundingClientRect();
    const html = p.locked
      ? `<button data-k="auf">Öffnen</button>` +
        `<button data-k="stern">${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}</button>` +
        `<button data-k="entsperren">Entschlüsseln</button>` +
        `<div class="sep"></div>` +
        `<button data-k="korb">In den Papierkorb</button>`
      : `<button data-k="auf">Öffnen</button>` +
        `<button data-k="stern">${p.favorite ? 'Aus Favoriten' : 'Zu Favoriten'}</button>` +
        `<button data-k="name">Umbenennen</button>` +
        `<button data-k="farbe">Farbe …</button>` +
        `<button data-k="fach">In Fach verschieben …</button>` +
        `<button data-k="sperren">Verschlüsseln</button>` +
        `<div class="sep"></div>` +
        `<button data-k="korb">In den Papierkorb</button>`;
    const m = UI.menu(html, Math.min(r.left - 140, innerWidth - 240), r.bottom + 4);
    m.addEventListener('click', (e: Event) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-k]');
      if (!b) return;
      m.remove();
      const k = b.dataset['k'];
      if (k === 'auf') return openNotebook(id);
      if (k === 'stern') return toggleFavorit(id);
      if (k === 'farbe') return farbMenue(anker, id);
      if (k === 'fach') return fachwahlMenue(anker, id);
      if (k === 'sperren') { void sperrenHier(id); return; }
      if (k === 'entsperren') { void entsperrenHier(id); return; }
      if (k === 'name') {
        void (async () => {
          const name = await UI.frage('Name des Hefts', String(p.text || ''));
          if (name) { Store.updateBlock(id, { text: name }); renderShelf(); }
        })();
        return;
      }
      if (k === 'korb') {
        /* Umkehrbar — der Papierkorb-Reiter holt es mit einem Klick zurück. */
        Store.trashBlock(id);
        UI.toast('Ins Papierkorb gelegt — Reiter „Papierkorb" holt es zurück.');
        renderShelf();
      }
    });
  };

  const fachKontextMenue = (anker: HTMLElement, id: string): void => {
    const f = Store.getBlock(id);
    if (!f) return;
    const r = anker.getBoundingClientRect();
    const m = UI.menu(
      `<button data-k="auf">Öffnen</button>` +
      `<button data-k="name">Umbenennen</button>` +
      `<div class="sep"></div>` +
      `<button data-k="korb">In den Papierkorb</button>`,
      Math.min(r.left - 140, innerWidth - 240), r.bottom + 4);
    m.addEventListener('click', (e: Event) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-k]');
      if (!b) return;
      m.remove();
      if (b.dataset['k'] === 'auf') return openFach(id);
      if (b.dataset['k'] === 'name') {
        void (async () => {
          const name = await UI.frage('Name des Fachs', String(f.text || ''));
          if (name) { Store.updateBlock(id, { text: name }); renderShelf(); }
        })();
        return;
      }
      if (b.dataset['k'] === 'korb') {
        /* Die Hefte darin bleiben lebendig und erscheinen als lose Hefte
           an der Wurzel — trashBlock nimmt nur das Fach heraus. */
        Store.trashBlock(id);
        UI.toast('Fach in den Papierkorb gelegt. Seine Hefte bleiben im Regal.');
        renderShelf();
      }
    });
  };

  /* ------------------------------------------------------------------ *
   * Verdrahtung
   * ------------------------------------------------------------------ */

  const bindShelf = (wurzel: HTMLElement): void => {
    wurzel.addEventListener('click', e => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel) return;
      const stern = ziel.closest<HTMLElement>('[data-stern]');
      if (stern && stern.dataset['stern']) return toggleFavorit(stern.dataset['stern']);
      const mehrFach = ziel.closest<HTMLElement>('[data-mehr-fach]');
      if (mehrFach && mehrFach.dataset['mehrFach'])
        return fachKontextMenue(mehrFach, mehrFach.dataset['mehrFach']);
      const mehr = ziel.closest<HTMLElement>('[data-mehr]');
      if (mehr && mehr.dataset['mehr']) return kontextMenue(mehr, mehr.dataset['mehr']);
      const menue = ziel.closest<HTMLElement>('[data-neu-menue]');
      if (menue) return neuMenue(menue);
      if (ziel.closest('[data-neu]')) return createNotebook();
      if (ziel.closest('[data-zurueck]')) return closeFach();
      if (ziel.closest('[data-korb-auf]')) { App.papierkorb(); return; }
      const herstellen = ziel.closest<HTMLElement>('[data-herstellen]');
      if (herstellen && herstellen.dataset['herstellen']) {
        Store.restoreBlock(herstellen.dataset['herstellen']);
        UI.toast('Wiederhergestellt.');
        renderShelf();
        return;
      }
      const reiter = ziel.closest<HTMLElement>('[data-reiter]');
      if (reiter) {
        tab = (reiter.dataset['reiter'] as Reiter) || 'dokumente';
        fachId = null;
        Store.setMeta('heft:reiter', tab);
        Store.setMeta('heft:fach', '');
        renderShelf();
        return;
      }
      const wahl = ziel.closest<HTMLElement>('[data-form]');
      if (wahl) {
        Store.setMeta('heft:form',
          wahl.dataset['form'] === 'liste' ? 'liste' : 'gitter');
        renderShelf();
        return;
      }
      if (ziel.closest('[data-alle]')) {
        const bib = (globalThis as any).Bibliothek;
        if (bib && typeof bib.oeffne === 'function') bib.oeffne();
        return;
      }
      if (ziel.closest('[data-weitersuchen]')) {
        /* Nicht selbst suchen — hinführen. Die grosse Suche nimmt das Wort
           mit, damit niemand es zweimal tippt. */
        App.suche(searchText);
        return;
      }
      if (ziel.closest('[data-suche]')) {
        const feld = wurzel.querySelector<HTMLInputElement>('.nh-suche');
        if (feld) { feld.hidden = false; feld.focus(); }
        return;
      }
      const fach = ziel.closest<HTMLElement>('[data-fach]');
      if (fach && fach.dataset['fach']) return openFach(fach.dataset['fach']);
      const deckel = ziel.closest<HTMLElement>(
        '.bib-deckel[data-id], .nh-weiter[data-id], .nh-zeile-auf[data-id]');
      if (deckel && deckel.dataset['id']) return openNotebook(deckel.dataset['id']);
    });
    wurzel.addEventListener('input', e => {
      const feld = e.target as HTMLInputElement;
      if (!feld.classList.contains('nh-suche')) return;
      searchText = feld.value;
      /* Nur den Inhalt neu, das Feld behält Fokus und Anschlag. */
      const alt = wurzel.querySelector('.nh-gitter, .nh-liste, .nh-nichts');
      if (!alt) return;
      const probe = document.createElement('div');
      probe.innerHTML = shelfHtml();
      const neu = probe.querySelector('.nh-gitter, .nh-liste, .nh-nichts');
      if (neu) alt.replaceWith(neu);
      /* UND DIE BRÜCKE ZUR GROSSEN SUCHE MIT (E282). Dieser Weg tauscht
         absichtlich nur den Ergebnisblock, damit das Feld Fokus und
         Anschlag behält — die Brücke steht daneben und wäre sonst beim
         Tippen nie zu sehen: sie erschiene erst beim nächsten vollen
         Zeichnen, also praktisch nie. Genau die Sorte Griff, die es gibt
         und die niemand findet. */
      const brueckeAlt = wurzel.querySelector('.nh-weitersuchen');
      const brueckeNeu = probe.querySelector('.nh-weitersuchen');
      if (brueckeAlt && brueckeNeu) brueckeAlt.replaceWith(brueckeNeu);
      else if (brueckeAlt) brueckeAlt.remove();
      else if (brueckeNeu) {
        /* Vor den FAB, damit sie unter dem Ergebnis steht und nicht
           darunter weg. */
        const fab = wurzel.querySelector('.nh-neu-fab');
        if (fab) fab.before(brueckeNeu); else wurzel.querySelector('.nh-regal')?.append(brueckeNeu);
      }
      /* UND DIE ZEICHEN NACHZIEHEN. `Register.symbole.fuelle()` läuft am
         Ende von `render()` — dieser Weg hier ruft `render` aber gerade
         NICHT, das ist ja sein Sinn. Ohne diese Zeile blieb das Suchzeichen
         in der Brücke ein leerer Platzhalter mit Breite.

         Gefunden beim Hinsehen, nicht beim Messen (§55.1): der Prüflauf
         fragte, ob die Brücke DA ist — sie war da, mit einer Lücke, wo das
         Zeichen sein sollte. Ein Bild zeigt so etwas in einer Sekunde. */
      if (typeof Register !== 'undefined') {
        const frisch = wurzel.querySelector('.nh-weitersuchen');
        if (frisch) Register.symbole?.fuelle?.(frisch);
      }
    });
    wurzel.addEventListener('keydown', e => {
      if ((e as KeyboardEvent).key !== 'Escape') return;
      const feld = e.target as HTMLElement;
      if (!feld.classList?.contains('nh-suche')) return;
      searchText = '';
      renderShelf();
    });
  };

  const render = (wrap: HTMLElement): void => {
    /* Das Inhaltsverzeichnis am Rand gehört zu Dokumentseiten, nicht
       hierher (dasselbe tun die Produktwelten beim Betreten). */
    document.getElementById('rand-toc')?.remove();
    wrap.innerHTML = shelfHtml();
    /* Die Lupe und andere [data-sym]-Zeichen malt das Register. */
    if (typeof Register !== 'undefined') Register.symbole?.fuelle?.(wrap);
    shelfRoot = wrap.querySelector('.nh-regal');
    if (shelfRoot) bindShelf(shelfRoot);
  };

  const renderShelf = (): void => {
    /* Nur auffrischen, wenn das Regal wirklich noch steht — sonst malte
       ein später Aufruf über eine offene Seite (die E136-Falle). */
    const wrap = shelfRoot?.parentElement;
    if (wrap && wrap.isConnected && document.querySelector('.nh-regal')) render(wrap);
  };

  const oeffnen = (): void => {
    /* DA WEITERMACHEN, WO MAN AUFGEHÖRT HAT (E282 / L78 Punkt 3).
       Hier stand „vorhersehbar beginnen: die Dokumente-Wurzel, nicht der
       Reiter von vorhin". Beim Benutzen ist es andersherum: wer in einem
       Fach arbeitet, ein Heft öffnet und zurückgeht, will das Fach
       wiedersehen und nicht die Wurzel.

       Die Wächter stehen in `gemerkterReiter`/`gemerktesFach` — ein
       gelöschtes Fach oder ein unbekannter Reiter fallen dort auf die
       Wurzel zurück, statt eine leere Brotkrume zu zeigen.

       Der Suchtext wird bewusst zurückgesetzt: eine Frage von vorgestern
       beim Öffnen wieder vorzufinden, mit halb leerem Regal darunter,
       sieht aus wie ein Fehler. */
    searchText = '';
    tab = gemerkterReiter();
    fachId = gemerktesFach();
    /* Ein Fach gehört zum Dokumente-Reiter. Steht der gemerkte Reiter auf
       Favoriten oder Papierkorb, zeigt die Kopfzeile gar keine Reiter
       (siehe `kopfHtml`) — dann wäre die Brotkrume der einzige Weg
       zurück, und der Reiter läge unsichtbar daneben. */
    if (fachId && tab !== 'dokumente') { tab = 'dokumente'; Store.setMeta('heft:reiter', tab); }
    App.zeigeSonder('Notizhefte', render);
  };

  return { oeffnen, open: oeffnen, resume, render };
})();

(window as any).Notebook = Notebook;

/* Die Notizhefte melden ihre Kontextkante an (E273).
   Bis hierher war die Kante auf diesem Schauplatz LEER — vier Griffe, die
   es alle gibt, und keiner davon zu sehen. */
if (typeof Register !== 'undefined' && (Register as any).kontext) {
  const K = (Register as any).kontext;
  K.melde({ bereich: 'notizhefte', id: 'regal', name: 'Regal',
    zeichen: 'book', rang: 10, tun: () => Notebook.oeffnen() });
  /* WEITERSCHREIBEN NUR MIT HEFT — UND DIE KENNUNG ALLEIN REICHT NICHT.
     `resume` prüft beides (oben, Zeile 302-304): die Kennung UND ob der
     Block noch lebt. Ein gelöschtes Heft hinterlässt die Kennung; wer nur
     sie prüft, zeigt einen Knopf, der ins Regal fällt. */
  K.melde({ bereich: 'notizhefte', id: 'weiter', name: 'Weiterschreiben',
    zeichen: 'pencil', rang: 20,
    zeigen: () => {
      try {
        const id = String(Store.getMeta('heft:zuletzt', '') || '');
        const p = id ? Store.getBlock(id) : null;
        return !!p && p.alive !== false;
      } catch { return false; }
    },
    tun: () => Notebook.resume() });
  K.melde({ bereich: 'notizhefte', id: 'dokumente', name: 'Dokumente',
    zeichen: 'library', rang: 30,
    zeigen: () => typeof (globalThis as any).Bibliothek?.oeffne === 'function',
    tun: () => (globalThis as any).Bibliothek.oeffne() });
  K.melde({ bereich: 'notizhefte', id: 'papierkorb', name: 'Papierkorb',
    zeichen: 'trash', rang: 40, tun: () => App.papierkorb() });
}
