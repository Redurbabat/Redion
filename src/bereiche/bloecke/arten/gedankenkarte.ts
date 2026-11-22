/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/arten/gedankenkarte.ts (npm run bauen:ts). */
/* ============================================================================
 * bereiche/bloecke/arten/gedankenkarte.ts — die Gedankenkarte (Mindmap)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/bloecke/arten/gedankenkarte.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/bloecke/arten/gedankenkarte.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen; `test105` meldet es
 * vorher.
 * ----------------------------------------------------------------------------
 * Ein zentrales Thema in der Mitte, Äste nach links und rechts, Text direkt am
 * Knoten — das, wofür man sonst XMind öffnet. Ohne Konto, ohne Wolke, ohne
 * Nachladen: die Karte ist ein gewöhnlicher Block und reist damit in jeder
 * `.redion`-Sicherung mit, ohne dass Sicherung oder Abgleich etwas davon
 * wissen müssen (§9).
 *
 * ZWEI ENTSCHEIDUNGEN, DIE DEN REST ERKLÄREN
 *
 * 1. DIE KNOTEN SIND HTML, NUR DIE LINIEN SIND SVG.
 *
 *    Der nächstliegende Weg wäre ein einziges <svg> mit <text> darin. Dann
 *    aber muss die Breite eines Knotens GESCHÄTZT werden — SVG bricht keinen
 *    Text um, und `getComputedTextLength` gibt es erst, wenn das Element
 *    schon hängt. Genau diese Schätzung steht seit L173 als offene Lücke in
 *    der PDF-Fläche, und sie war dort schon einmal um 18 % daneben.
 *
 *    Hier misst der Browser: jeder Knoten ist ein <div> mit `max-width` und
 *    Umbruch, wird eingehängt, und erst DANACH wird gerechnet. `offsetWidth`
 *    und `offsetHeight` sind die Wahrheit, keine Formel. Der Preis ist ein
 *    zweiter Durchgang beim Zeichnen; er kostet gemessen weniger als eine
 *    Millisekunde bei 60 Knoten und ist jede Schätzung wert.
 *
 * 2. DAS SCHREIBFELD IST EIN `contenteditable`-DIV, KEIN `<textarea>`.
 *
 *    Dasselbe wie in E597/E598 bei der freien Textmarke, aus demselben Grund
 *    und mit einer Falle weniger: `bausteine.css` setzt unter 760 px
 *    `input, textarea, select { font-size:16px !important }`, damit iOS beim
 *    Tippen nicht hineinzoomt. Ein `<textarea>` in einem Knoten würde am
 *    Telefon also plötzlich 16 px gross — und der Knoten spränge beim
 *    Antippen auf eine andere Breite als die, die er eben noch hatte. Ein
 *    Div ist von dieser Regel nicht betroffen; nachgesehen, nicht vermutet.
 *
 * ALLES GEHT ÜBER `aendere`. Wie beim Schaltplan (Planflaeche): eine einzige
 * Funktion schreibt in den Block, zeichnet neu und legt den Schritt auf den
 * Rückgängig-Stapel. Wer daneben an `karte.knoten` schraubt, verliert das
 * Rückgängig und merkt es erst, wenn jemand es braucht.
 * ==========================================================================*/

type GkKnoten = {
  id: string;
  text: string;
  eltern: string | null;
  seite?: 'links' | 'rechts';
  farbe?: string;
  zu?: boolean;
  /* DIE FORM DES KNOTENS (E628). Ein Feld, das es vorher nicht gab — und
     deshalb fehlt es in jeder schon gespeicherten Karte. Das ist der
     gutmütige Fall: kein Feld heisst `rund`, die Form von bisher. Nichts
     muss wandern, keine Sicherung wird unlesbar (§9). */
  form?: string;
};

/* ══ EINE FREIE VERBINDUNG (E628) ══════════════════════════════════════════
   Die Karte war bis hierher ein reiner BAUM: jeder Knoten hat einen
   Elternteil, und mehr an Beziehung gab es nicht. Redur, 19. September:
   „wenn ich oben mit Taster oben, links oder rechts oder unten klicke,
   sollte dort die eine Verbindung erstellen — ich sollte die Verbindungen
   löschen."

   Ein Baum kann das nicht: zwei Äste, die sich berühren, sind kein Baum
   mehr. Also kommt eine zweite, flache Liste dazu — `von` und `zu`, beides
   Knotenkennungen. Der Baum bleibt der Baum (er trägt den Aufbau), die
   Verbindungen liegen als gestrichelte Bögen darüber.

   WARUM EINE EIGENE LISTE UND NICHT EIN ZWEITER `eltern`-ZEIGER: ein
   zweiter Elternteil würde den Aufbau zerreissen — `aufbauen` rechnet
   Höhen über den Baum, und ein Knoten mit zwei Eltern stünde an zwei
   Orten. Die Liste daneben lässt den Aufbau in Ruhe und ist trotzdem Teil
   des Blocks, reist also in jeder `.redion`-Sicherung mit. */
type GkVerbindung = {
  id: string;
  von: string;
  zu: string;
};

type GkKarte = {
  knoten: GkKnoten[];
  verbindungen: GkVerbindung[];
  aufbau: string;
  sicht: { x: number; y: number; z: number };
};

type GkMass = { w: number; h: number };
type GkOrt = { x: number; y: number };

type GkAufbau = {
  orte: Record<string, GkOrt>;
  kinder: Record<string, string[]>;
  farben: Record<string, string>;
  wurzel: string | null;
  breite: number;
  hoehe: number;
};

const Gedankenkarte = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const NS = 'http://www.w3.org/2000/svg';
  const sv = (name: string, attrs: Record<string, unknown> = {}): SVGElement => {
    const e = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)));
    return e as SVGElement;
  };

  /* DIE FARBE BRAUCHT EINEN NAMEN (§38: keine Information nur über Farbe).
     Dieselbe Begründung wie im Whiteboard — der Farbwähler liest den Namen
     vor, und wer die Farben nicht unterscheiden kann, hört sie. */
  const PALETTE: ReadonlyArray<readonly [string, string]> = [
    ['#d9534f', 'Rot'],    ['#e08a2e', 'Orange'],  ['#c9a227', 'Gelb'],
    ['#4a9d5f', 'Grün'],   ['#2f8ab5', 'Blau'],    ['#7a5cc5', 'Violett'],
    ['#c2549b', 'Rosa'],   ['#3fa3a0', 'Türkis'],
  ];

  /* Die Farbe an Stelle i — mit demselben Helfer und aus demselben Grund wie
     `farbeVon` im Whiteboard (E414): `PALETTE[i]` ist ein PAAR, und als
     Zeichenkette ergibt das „#d9534f,Rot". SVG malt dann schwarz. */
  /* ══ DIE FORMEN (E628) ══════════════════════════════════════════════════
     Redur: „es sollte so verschiedene Formen haben". Sechs, nicht zwanzig —
     eine Form muss auf dreissig Pixel Höhe noch als DIESE Form erkennbar
     sein, und ein Achteck ist bei der Grösse ein Kreis mit Ecken.

     Kennung und Name — KEIN Zeichen. Zuerst standen hier sechs: ▢ ▭ ▰ ⬭ ◇ ⬡.
     Auf dem Bild vom 19. September war ▰ (U+25B0) ein schwarzer Klecks und
     sagte alles Mögliche, nur nicht „Pille" — dieselbe Sorte Fund wie der
     Stift, der wie eine Büroklammer aussah (§55.1). Jeder Knopf zeigt
     stattdessen die Form SELBST, aus demselben Stil wie der Knoten; der
     Name steht im `aria-label` und im Tooltip (§38).

     Der Wert `rund` steht nie in den Daten: er ist, was ein Knoten OHNE
     Feld ist, und genau so bleibt jede schon gespeicherte Karte
     unverändert (§9). */
  const FORMEN: ReadonlyArray<readonly [string, string]> = [
    ['rund',     'Abgerundet'],
    ['kasten',   'Rechteck'],
    ['pille',    'Pille'],
    ['ellipse',  'Ellipse'],
    ['raute',    'Raute'],
    ['sechseck', 'Sechseck'],
  ];

  const farbeVon = (i: number): string =>
    PALETTE[((i % PALETTE.length) + PALETTE.length) % PALETTE.length]?.[0] ?? '#2f8ab5';

  /* DIE ASTFARBE AUF HELLEM GRUND (E705): gespeichert bleibt sie (§9);
     daneben derselbe Ton mit 4,6 : 1 für das helle Thema, oder `null`. */
  const astHell = (farbe: string): string | null => {
    if (typeof Farben === 'undefined' || !Farben.parse(farbe)) return null;
    const hell = Farben.inkOnLight(farbe);
    return hell && hell !== Farben.toHex(Farben.parse(farbe) ?? [0, 0, 0]) ? hell : null;
  };

  const uid = (): string => (typeof Ids !== 'undefined' && Ids.short)
    ? 'gk' + Ids.short()
    : 'gk' + Math.floor(performance.now() * 1000).toString(36);

  /* --------------------------------------------------------------------------
   * DAS MODELL
   * ------------------------------------------------------------------------*/

  const zahl = (wert: unknown, ersatz: number): number =>
    typeof wert === 'number' && Number.isFinite(wert) ? wert : ersatz;

  /** Eine frische Karte mit einem einzigen Knoten. */
  const neueKarte = (titel = 'Zentrales Thema'): GkKarte => ({
    knoten: [{ id: 'w', text: titel, eltern: null }],
    verbindungen: [],
    aufbau: 'karte',
    sicht: { x: 0, y: 0, z: 1 },
  });

  const MARKDOWN_GROESSE = 256 * 1024;
  const MARKDOWN_MAX_KNOTEN = 250;
  const MARKDOWN_MAX_TIEFE = 20;

  const ausMarkdown = (markdown: string, dateiname = 'Zentrales Thema'): GkKarte => {
    if (markdown.length > MARKDOWN_GROESSE) throw new Error('Die Markdown-Datei ist zu gross.');
    const karte = neueKarte(dateiname);
    const abschnitte: Array<{ ebene: number; id: string }> = [];
    const liste: Array<{ einzug: number; id: string }> = [];
    const text = (s: string): string => s.trim().replace(/\\([\\`*_[\]#<>!&{}~+.\-()|])/g, '$1');
    const fuegeHinzu = (titel: string, eltern: string): string => {
      if (karte.knoten.length >= MARKDOWN_MAX_KNOTEN)
        throw new Error('Eine Markdown-Datei darf höchstens 250 Themen enthalten.');
      const id = 'md-' + karte.knoten.length;
      karte.knoten.push({ id, text: titel, eltern });
      return id;
    };
    let titelGelesen = false;
    let frontmatter = false;
    let codeZaun = '';
    for (const [nummer, zeile] of markdown.replace(/^\uFEFF/, '').split(/\r\n?|\n/).entries()) {
      if (nummer === 0 && zeile.trim() === '---') { frontmatter = true; continue; }
      if (frontmatter) { if (/^(---|\.\.\.)\s*$/.test(zeile)) frontmatter = false; continue; }
      const zaun = /^\s*(`{3,}|~{3,})/.exec(zeile)?.[1];
      if (codeZaun) {
        if (zaun && zaun[0] === codeZaun[0] && zaun.length >= codeZaun.length &&
            zeile.trim() === zaun) codeZaun = '';
        continue;
      }
      if (zaun) { codeZaun = zaun; continue; }
      const ueberschrift = /^ {0,3}(#{1,6})[ \t]+(.+?)\s*$/.exec(zeile);
      if (ueberschrift && ueberschrift[1] && ueberschrift[2]?.trim()) {
        const ebene = ueberschrift[1].length;
        const titel = text(ueberschrift[2].replace(/[ \t]+#+$/, ''));
        liste.length = 0;
        if (!titelGelesen && karte.knoten.length === 1 && ebene === 1) {
          const wurzel = karte.knoten[0];
          if (wurzel) wurzel.text = titel;
          titelGelesen = true;
          continue;
        }
        while ((abschnitte.at(-1)?.ebene ?? 0) >= ebene) abschnitte.pop();
        const id = fuegeHinzu(titel, abschnitte.at(-1)?.id ?? 'w');
        abschnitte.push({ ebene, id });
        continue;
      }
      const punkt = /^([ \t]*)(?:[-+*]|\d+[.)])[ \t]+(\S.*)$/.exec(zeile);
      if (!punkt || punkt[1] === undefined || !punkt[2]) continue;
      const einzug = punkt[1].replace(/\t/g, '    ').length;
      while ((liste.at(-1)?.einzug ?? -1) >= einzug) liste.pop();
      if (abschnitte.length + liste.length >= MARKDOWN_MAX_TIEFE)
        throw new Error('Die Markdown-Gliederung ist zu tief.');
      const id = fuegeHinzu(text(punkt[2]), liste.at(-1)?.id ?? abschnitte.at(-1)?.id ?? 'w');
      liste.push({ einzug, id });
    }
    if (!titelGelesen && karte.knoten.length === 1)
      throw new Error('Die Datei enthält keine Markdown-Überschriften oder Listen.');
    return karte;
  };

  // Markdown enthält auch Themen, deren Äste gerade eingeklappt sind.
  const alsMarkdown = (karte: GkKarte): string => {
    const { wurzel, kinder } = baum(karte);
    if (!wurzel) return '';
    const knoten = new Map(karte.knoten.map(k => [k.id, k]));
    const zeile = (id: string): string => (knoten.get(id)?.text ?? '').replace(/\s+/g, ' ').trim()
      .replace(/[\\`*_[\]#<>!&{}~+.\-()|]/g, '\\$&') || 'Ohne Titel';
    const ausgabe = ['# ' + zeile(wurzel), ''];
    const stapel = (kinder[wurzel] ?? []).slice().reverse().map(id => ({ id, tiefe: 0 }));
    while (stapel.length) {
      const k = stapel.pop();
      if (!k) break;
      ausgabe.push('  '.repeat(k.tiefe) + '- ' + zeile(k.id));
      for (const id of (kinder[k.id] ?? []).slice().reverse()) stapel.push({ id, tiefe: k.tiefe + 1 });
    }
    return ausgabe.join('\n') + '\n';
  };

  /* ══ FERTIGE VORLAGEN (E628) ════════════════════════════════════════════
     Redur: „fertige Vorlagen usw." — sechs Karten, die man kennt, statt
     eines leeren Blatts.

     KEIN ZEICHEN VOR DEM NAMEN, und das ist Absicht. Die Leiste hat schon
     einmal gelehrt, was ein falsch gelesenes Zeichen kostet: der Stift U+270E
     sah auf dem Bild wie eine Büroklammer aus, die Ausrichtungsknöpfe wie
     Klammern (§55.1). Sechs Vorlagenzeichen wären sechs neue Gelegenheiten
     dafür — und der Name sagt ohnehin mehr als jedes Zeichen.

     Der Inhalt ist deutsch, weil ein Mensch ihn liest (§3). Die Kennungen
     sind es nicht: sie stehen nie in den Daten, sondern nur im Menü. */
  type GkVorlage = {
    id: string;
    name: string;
    hinweis: string;
    wurzel: string;
    /** Je Ast: sein Name, dann seine Unterthemen. */
    aeste: ReadonlyArray<ReadonlyArray<string>>;
  };

  const VORLAGEN: ReadonlyArray<GkVorlage> = [
    {
      id: 'projekt', name: 'Projekt', hinweis: 'Ziel · Aufgaben · Termine · Beteiligte · Risiken',
      wurzel: 'Projekt',
      aeste: [
        ['Ziel', 'Warum', 'Fertig, wenn …'],
        ['Aufgaben', 'Als Nächstes', 'Später'],
        ['Termine', 'Start', 'Abgabe'],
        ['Beteiligte', 'Wer entscheidet'],
        ['Risiken', 'Was kann schiefgehen'],
      ],
    },
    {
      id: 'woche', name: 'Diese Woche', hinweis: 'Muss · Sollte · Kann · Wartet auf',
      wurzel: 'Diese Woche',
      aeste: [['Muss'], ['Sollte'], ['Kann'], ['Wartet auf'], ['Erledigt']],
    },
    {
      id: 'entscheidung', name: 'Entscheidung', hinweis: 'Dafür · Dagegen · Offene Fragen · Frist',
      wurzel: 'Zu entscheiden',
      aeste: [
        ['Dafür'], ['Dagegen'],
        ['Offene Fragen', 'Wen fragen?'],
        ['Frist', 'Wer entscheidet'],
      ],
    },
    {
      id: 'pruefung', name: 'Prüfung vorbereiten', hinweis: 'Themen · Lücken · Übungen · Termine',
      wurzel: 'Prüfung',
      aeste: [
        ['Themen', 'Sitzt', 'Wackelt'],
        ['Lücken', 'Zuerst'],
        ['Übungen', 'Altfragen'],
        ['Material', 'Skript', 'Notizen'],
        ['Termine', 'Prüfungstag'],
      ],
    },
    {
      id: 'vierfelder', name: 'Vier Felder', hinweis: 'Stärken · Schwächen · Chancen · Risiken',
      wurzel: 'Lage',
      aeste: [['Stärken'], ['Schwächen'], ['Chancen'], ['Risiken']],
    },
    {
      id: 'sammeln', name: 'Thema sammeln', hinweis: 'Was ich weiss · Was fehlt · Ideen · Quellen',
      wurzel: 'Thema',
      aeste: [
        ['Was ich weiss'], ['Was fehlt', 'Nachsehen'],
        ['Ideen'], ['Quellen', 'Gelesen'],
      ],
    },
  ];

  /**
   * Aus einer Vorlage eine Karte bauen.
   *
   * Die Äste wechseln die Seite (rechts, links, rechts …) und bekommen der
   * Reihe nach eine Farbe. Beides ist dasselbe, was ein Mensch von Hand täte,
   * und beides ist keine Datenfrage: `seite` und `farbe` stehen schon im
   * Modell, es kommt kein neues Feld dazu (§9).
   *
   * Die Wurzel heisst `'w'` wie bei `neueKarte` — aus demselben Grund: eine
   * gewürfelte Wurzelkennung überlebt kein Neuzeichnen.
   */
  const vorlageKarte = (v: GkVorlage): GkKarte => {
    const knoten: GkKnoten[] = [{ id: 'w', text: v.wurzel, eltern: null }];
    v.aeste.forEach((reihe, i) => {
      const name = reihe[0];
      if (!name) return;
      const id = uid();
      knoten.push({
        id, text: name, eltern: 'w',
        seite: i % 2 === 0 ? 'rechts' : 'links',
        farbe: farbeVon(i),
      });
      reihe.slice(1).forEach(text => knoten.push({ id: uid(), text, eltern: id }));
    });
    return { knoten, verbindungen: [], aufbau: 'karte', sicht: { x: 0, y: 0, z: 1 } };
  };

  /**
   * Die Karte aus einem Block lesen — und dabei gutmütig sein.
   *
   * Ein Block aus einer fremden oder älteren Fassung kann alles Mögliche in
   * `karte` haben. Statt abzustürzen wird geprüft und ergänzt: was kein
   * Knoten ist, fliegt raus; wer keinen Text hat, bekommt einen leeren; wer
   * keine Kennung hat, bekommt eine. Kaputte Daten sollen abgefangen werden,
   * nicht still wirken (§9).
   *
   * WICHTIG: Die Wurzelkennung der Standardkarte ist fest `'w'` und nicht
   * gewürfelt. Sonst bekäme derselbe Block bei jedem Zeichnen eine andere
   * Kennung, und die Auswahl überlebte kein Neuzeichnen.
   */
  const leseKarte = (block: any): GkKarte => {
    const roh = block && typeof block.karte === 'object' && block.karte ? block.karte : null;
    if (!roh || !Array.isArray(roh.knoten) || !roh.knoten.length) return neueKarte(block?.text || undefined);

    const gesehen = new Set<string>();
    const knoten: GkKnoten[] = [];
    roh.knoten.forEach((k: any) => {
      if (!k || typeof k !== 'object') return;
      let id = typeof k.id === 'string' && k.id ? k.id : uid();
      while (gesehen.has(id)) id = uid();
      gesehen.add(id);
      const eintrag: GkKnoten = {
        id,
        text: typeof k.text === 'string' ? k.text : String(k.text ?? ''),
        eltern: typeof k.eltern === 'string' && k.eltern ? k.eltern : null,
      };
      if (k.seite === 'links' || k.seite === 'rechts') eintrag.seite = k.seite;
      if (typeof k.farbe === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(k.farbe)) eintrag.farbe = k.farbe;
      if (k.zu === true) eintrag.zu = true;
      /* EINE UNBEKANNTE FORM BLEIBT STEHEN (§18). Hier stand einmal
         `FORMEN.some(...)` — damit hätte eine Karte aus einer NEUEREN
         Fassung ihre Sternform beim ersten Öffnen verloren, still und
         endgültig. Geprüft wird jetzt nur die Gestalt des Wertes, nicht
         seine Bekanntheit: Kleinbuchstaben, Ziffern, Bindestrich, höchstens
         24 Zeichen. Was der Stil nicht kennt, sieht rund aus — und ist beim
         nächsten Sichern noch da. */
      if (typeof k.form === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(k.form)) eintrag.form = k.form;
      knoten.push(eintrag);
    });
    if (!knoten.length) return neueKarte(block?.text || undefined);
    /* Ohne Wurzel wäre die Karte unzeichenbar — der erste Knoten wird eine. */
    if (!knoten.some(k => !k.eltern)) { const erster = knoten[0]; if (erster) erster.eltern = null; }

    /* DIE VERBINDUNGEN, UND ZWAR NUR DIE, DIE BEIDE ENDEN HABEN (E628).
       Eine Verbindung zu einem gelöschten Knoten ist kein Fehler im Sinne
       von „kaputt", sondern der Normalfall nach einem gelöschten Ast — sie
       fällt still weg, statt eine Linie ins Nichts zu zeichnen (§9: kaputte
       Daten abfangen, nicht still wirken lassen). */
    const da = new Set(knoten.map(k => k.id));
    const verbindungen: GkVerbindung[] = [];
    const schonV = new Set<string>();
    if (Array.isArray(roh.verbindungen)) roh.verbindungen.forEach((v: any) => {
      if (!v || typeof v !== 'object') return;
      const von = typeof v.von === 'string' ? v.von : '';
      const zu = typeof v.zu === 'string' ? v.zu : '';
      if (!da.has(von) || !da.has(zu) || von === zu) return;
      /* Zweimal dieselbe Verbindung ist eine Linie auf einer Linie — man
         sieht sie nicht und kann nur eine davon löschen. */
      const paar = von < zu ? von + '|' + zu : zu + '|' + von;
      if (schonV.has(paar)) return;
      schonV.add(paar);
      let id = typeof v.id === 'string' && v.id ? v.id : uid();
      while (gesehen.has(id)) id = uid();
      gesehen.add(id);
      verbindungen.push({ id, von, zu });
    });

    const s = roh.sicht && typeof roh.sicht === 'object' ? roh.sicht : {};
    return {
      knoten,
      verbindungen,
      aufbau: typeof roh.aufbau === 'string' ? roh.aufbau : 'karte',
      sicht: {
        x: zahl(s.x, 0),
        y: zahl(s.y, 0),
        z: Math.min(4, Math.max(.2, zahl(s.z, 1))),
      },
    };
  };

  /**
   * Der Baum hinter der flachen Liste — und die Stelle, an der ein kaputter
   * Bestand aufgefangen wird.
   *
   * Zwei Sorten Schaden sind denkbar und beide kommen aus dem echten Leben:
   * ein Knoten zeigt auf einen Elternteil, den es nicht (mehr) gibt, und ein
   * Knoten hängt über Umwege an sich selbst. Der erste Fall entsteht beim
   * Zusammenführen zweier Geräte, der zweite beim Verschieben eines Astes in
   * sich hinein.
   *
   * Beide enden hier gleich: der Knoten hängt sich an die Wurzel. Er ist
   * dann vielleicht am falschen Platz — aber er ist SICHTBAR, und sein Text
   * ist da. Ein Knoten, der wegen eines kaputten Zeigers gar nicht gezeichnet
   * wird, sieht aus wie gelöscht (§51).
   */
  const baum = (karte: GkKarte): { kinder: Record<string, string[]>; wurzel: string | null } => {
    const kinder: Record<string, string[]> = {};
    karte.knoten.forEach(k => { kinder[k.id] = []; });
    const wurzel = karte.knoten.find(k => !k.eltern) ?? karte.knoten[0];
    if (!wurzel) return { kinder, wurzel: null };

    const nach = new Map<string, GkKnoten>(karte.knoten.map(k => [k.id, k]));

    /** Führt der Weg nach oben wirklich zur Wurzel, ohne Ring? */
    const traegt = (k: GkKnoten): boolean => {
      const weg = new Set<string>([k.id]);
      let p: string | null = k.eltern;
      let schritte = 0;
      while (p && schritte++ < 4096) {
        if (weg.has(p) || !nach.has(p)) return false;
        if (p === wurzel.id) return true;
        weg.add(p);
        p = nach.get(p)?.eltern ?? null;
      }
      return false;
    };

    karte.knoten.forEach(k => {
      if (k.id === wurzel.id) return;
      const ziel = traegt(k) ? (k.eltern as string) : wurzel.id;
      kinder[ziel]?.push(k.id);
    });
    return { kinder, wurzel: wurzel.id };
  };

  /* --------------------------------------------------------------------------
   * DER AUFBAU — reines Rechnen, ohne DOM
   *
   * Die Funktion bekommt die gemessenen Grössen herein und gibt Orte heraus.
   * Genau deshalb kann ein Prüflauf sie rechnen lassen, ohne je einen Zeiger
   * zu bewegen — dieselbe Trennung wie zwischen `schaltplan` und
   * `planflaeche`.
   * ------------------------------------------------------------------------*/

  /* DIE UNTERGRENZE FÜR DEN ERSTEN BLICK — und warum sie gemessen ist.
     Ohne sie passt die App die Karte beim Öffnen IMMER ganz ein. Auf dem
     Bild vom 16. September am iPhone 13 Pro Max hiess das: 33 %. Ein Knoten
     mit 14 px Schrift stand dort mit 4,6 px am Bildschirm — sichtbar, aber
     nicht lesbar, und lesbar ist der Punkt einer Gedankenkarte.
     10 px sind die Grenze, unter der man aufhört zu lesen und anfängt zu
     raten. 10 / 13,5 ergibt 0,74; gerundet 0,72, weil die Schrift am Telefon
     14 px ist und dort schon 0,72 reichen. Wer wirklich alles sehen will,
     drückt ⤢ — der Knopf kennt diese Grenze nicht. */
  const LESBAR = .72;

  const LUECKE_X = 54;   /* Abstand zwischen zwei Ebenen */
  const LUECKE_Y = 14;   /* Abstand zwischen Geschwistern */
  const RAND = 28;       /* Luft um die ganze Karte */

  const aufbauen = (karte: GkKarte, masse: Record<string, GkMass>): GkAufbau => {
    const { kinder, wurzel } = baum(karte);
    const orte: Record<string, GkOrt> = {};
    const farben: Record<string, string> = {};
    if (!wurzel) return { orte, kinder, farben, wurzel: null, breite: 0, hoehe: 0 };

    const zuMerk = new Map<string, boolean>(karte.knoten.map(k => [k.id, !!k.zu]));
    const eigen = new Map<string, string | undefined>(karte.knoten.map(k => [k.id, k.farbe]));
    const sichtbar = (id: string): string[] => zuMerk.get(id) ? [] : (kinder[id] ?? []);
    const mass = (id: string): GkMass => masse[id] ?? { w: 140, h: 34 };

    const hMerk: Record<string, number> = {};
    const astHoehe = (id: string): number => {
      const schon = hMerk[id];
      if (schon !== undefined) return schon;
      hMerk[id] = mass(id).h;               /* Ringschutz: erst setzen, dann rechnen */
      const ks = sichtbar(id);
      let wert = mass(id).h;
      if (ks.length) {
        const summe = ks.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (ks.length - 1);
        wert = Math.max(wert, summe);
      }
      hMerk[id] = wert;
      return wert;
    };

    /* Welche Äste gehen nach rechts, welche nach links? Wer eine eigene Seite
       gespeichert hat, behält sie — sonst wechseln sie sich ab. Das hält die
       Karte beim Wachsen von selbst im Gleichgewicht, statt sie nach einer
       Seite kippen zu lassen. */
    const ebene1 = sichtbar(wurzel);
    const rechts: string[] = [];
    const links: string[] = [];
    ebene1.forEach((id, i) => {
      const k = karte.knoten.find(n => n.id === id);
      const seite = k?.seite ?? (i % 2 === 0 ? 'rechts' : 'links');
      (seite === 'links' ? links : rechts).push(id);
    });

    /* Die Farbe: jeder Ast der ersten Ebene bekommt eine, und alles darunter
       erbt sie. Eine eigene Farbe am Knoten schlägt das Erbe. */
    const faerben = (id: string, farbe: string): void => {
      farben[id] = eigen.get(id) || farbe;
      (kinder[id] ?? []).forEach(k => faerben(k, farben[id] as string));
    };
    farben[wurzel] = eigen.get(wurzel) || 'var(--accent)';
    ebene1.forEach((id, i) => faerben(id, farbeVon(i)));
    /* Eingeklappte Äste bekommen trotzdem eine Farbe — sie werden zwar nicht
       gezeichnet, aber ihr Zähler steht am Elternknoten. */
    karte.knoten.forEach(k => { if (!farben[k.id]) farben[k.id] = eigen.get(k.id) || 'var(--text-dim)'; });

    const legen = (id: string, kante: number, mitteY: number, richtung: 1 | -1): void => {
      const m = mass(id);
      orte[id] = { x: richtung > 0 ? kante : kante - m.w, y: mitteY - m.h / 2 };
      const ks = sichtbar(id);
      if (!ks.length) return;
      const gesamt = ks.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (ks.length - 1);
      let oben = mitteY - gesamt / 2;
      const naechste = richtung > 0 ? kante + m.w + LUECKE_X : kante - m.w - LUECKE_X;
      ks.forEach(k => {
        const h = astHoehe(k);
        legen(k, naechste, oben + h / 2, richtung);
        oben += h + LUECKE_Y;
      });
    };

    const wm = mass(wurzel);
    orte[wurzel] = { x: -wm.w / 2, y: -wm.h / 2 };
    const seiteLegen = (liste: string[], richtung: 1 | -1): void => {
      if (!liste.length) return;
      const gesamt = liste.reduce((s, k) => s + astHoehe(k), 0) + LUECKE_Y * (liste.length - 1);
      let oben = -gesamt / 2;
      const kante = richtung > 0 ? wm.w / 2 + LUECKE_X : -wm.w / 2 - LUECKE_X;
      liste.forEach(k => {
        const h = astHoehe(k);
        legen(k, kante, oben + h / 2, richtung);
        oben += h + LUECKE_Y;
      });
    };
    seiteLegen(rechts, 1);
    seiteLegen(links, -1);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    Object.entries(orte).forEach(([id, o]) => {
      const m = mass(id);
      minX = Math.min(minX, o.x);
      minY = Math.min(minY, o.y);
      maxX = Math.max(maxX, o.x + m.w);
      maxY = Math.max(maxY, o.y + m.h);
    });
    if (!Number.isFinite(minX)) return { orte, kinder, farben, wurzel, breite: 0, hoehe: 0 };
    Object.values(orte).forEach(o => { o.x += RAND - minX; o.y += RAND - minY; });
    return {
      orte, kinder, farben, wurzel,
      breite: Math.round(maxX - minX + RAND * 2),
      hoehe: Math.round(maxY - minY + RAND * 2),
    };
  };

  /* --------------------------------------------------------------------------
   * DAS BILD
   * ------------------------------------------------------------------------*/

  const zeichne = (block: any): HTMLElement => {
    let karte = leseKarte(block);
    let gewaehlt: string | null = karte.knoten.find(k => !k.eltern)?.id ?? null;
    let schreibt: string | null = null;
    /* Was gerade gewählt ist, ist ENTWEDER ein Knoten ODER eine Verbindung —
       nie beides. Sonst löschte die Entf-Taste zwei Dinge auf einmal, und
       man sähe nur eines davon verschwinden. */
    let gewaehlteVerb: string | null = null;
    let letzterAufbau: GkAufbau | null = null;
    let letzteMasse: Record<string, GkMass> = {};
    const hoehe = Math.max(220, zahl(block.hoehe, 420));
    /* HAT DER NUTZER JE EINE SICHT GEWÄHLT? Wenn nicht, wird beim ersten Bild
       eingepasst — sonst begänne jede Karte oben links, und auf dem Bild vom
       16. September lag die halbe Karte ausserhalb des Kastens; am Telefon
       war nicht einmal das zentrale Thema zu sehen.
       Eingepasst wird OHNE zu speichern: eine Karte, die sich beim Öffnen von
       selbst zurechtrückt, ist angenehmer als eine, die beim blossen Ansehen
       den Block ändert. Wer selbst schiebt oder zoomt, speichert — ab dann
       gilt seine Sicht. */
    let mussEinpassen = !(block && block.karte && typeof block.karte.sicht === 'object'
                          && block.karte.sicht);

    const w = document.createElement('div');
    w.className = 'gk';

    /* --- Leiste ------------------------------------------------------------
       DIE KNÖPFE SIND NICHT DIE BEQUEME FASSUNG DER TASTATUR (§37).
       Am Rechner legt Tab ein Kind an und Enter ein Geschwister — am Telefon
       gibt es beide Tasten nicht. Ohne diese Leiste wäre die Gedankenkarte
       dort eine Karte zum Ansehen, und §37 sagt: kein Desktop-only für
       Kernfunktionen. Deshalb kann jeder Weg hier auch mit dem Finger
       gegangen werden. */
    const LEISTE: ReadonlyArray<readonly [string, string, string]> = [
      ['kind',    '＋', 'Unterthema anlegen (Tab)'],
      ['neben',   '⏎',  'Thema daneben anlegen (Enter)'],
      /* `T` UND NICHT `✎` (angesehen, nicht vermutet). Der Stift U+270E wird
         von der Emoji-Schrift als schräg liegender Stift gezeichnet, und auf
         dem Bild vom 16. September sah er aus wie eine BÜROKLAMMER — dieselbe
         Sorte Fund wie die Ausrichtungsknöpfe, die wie Klammern aussahen
         (§55.1). Ein Buchstabe kann nicht falsch gelesen werden. */
      ['text',    'T',  'Umbenennen (F2)'],
      ['klapp',   '⊟',  'Ast auf- oder zuklappen (Leertaste)'],
      ['weg',     '🗑', 'Ast löschen (Entf)'],
    ];
    w.innerHTML =
      '<div class="gk-leiste">' +
        LEISTE.map(([id, ico, titel]) =>
          `<button data-a="${id}" title="${esc(titel)}" aria-label="${esc(titel)}">${ico}</button>`).join('') +
        '<span class="gk-trenn"></span>' +
        /* Die acht Farben und das ✕ sind EINE Gruppe. Am Telefon bricht die
           Leiste um, und auf dem Bild vom 16. September stand das ✕ allein am
           Anfang der zweiten Zeile — weit weg von den Farben, die es aufhebt.
           Dieselbe Lehre wie bei `.wb-zoom`: ein Regler in zwei Zeilen ist
           keiner mehr. */
        '<span class="gk-farben">' +
          PALETTE.map(([c, n]) => `<button class="gk-farbe" data-c="${c}" style="background:${c}" ` +
            `title="Ast einfärben: ${n}" aria-label="Ast einfärben: ${n}"></button>`).join('') +
          `<button class="gk-farbe gk-farbe-weg" data-c="" title="Eigene Farbe entfernen" ` +
            `aria-label="Eigene Farbe entfernen">✕</button>` +
        '</span>' +
        '<span class="gk-trenn"></span>' +
        /* ══ DIE FORMEN (E628) ═══════════════════════════════════════════
           Eine Gruppe wie die Farben, und aus demselben Grund beieinander:
           am Telefon bricht die Leiste um, und eine Form allein am
           Zeilenanfang gehört sichtbar zu nichts mehr. */
        '<span class="gk-formen">' +
          FORMEN.map(([id, name]) =>
            `<button class="gk-form" data-f="${id}" title="Form: ${esc(name)}" ` +
            `aria-label="Form: ${esc(name)}"><i></i></button>`).join('') +
        '</span>' +
        '<span class="gk-trenn"></span>' +
        /* ══ VORLAGEN (E628) ══════════════════════════════════════════════
           „fertige Vorlagen usw." — sechs Karten, die man kennt, statt
           eines leeren Blatts. Der Knopf öffnet eine Liste; was sie tut,
           steht dort, und sie fragt nach, wenn die Karte nicht leer ist. */
        '<button data-a="vorlage" title="Fertige Vorlage einsetzen" ' +
          'aria-label="Fertige Vorlage einsetzen" aria-haspopup="menu">▤</button>' +
        '<button data-a="markdown" title="Markdown-Gliederung importieren oder exportieren" ' +
          'aria-label="Markdown-Gliederung" aria-haspopup="menu">MD</button>' +
        '<span class="gk-trenn"></span>' +
        /* Die vier Zoomknöpfe bleiben beieinander — am Telefon bricht die
           Leiste sonst zwischen „−" und „＋" um, und ein Regler in zwei
           Zeilen ist keiner mehr (dieselbe Lehre wie im Whiteboard). */
        '<span class="gk-zoom">' +
          '<button data-a="kleiner" title="Verkleinern" aria-label="Verkleinern">−</button>' +
          '<b class="gk-massstab" aria-live="polite">100 %</b>' +
          '<button data-a="groesser" title="Vergrössern" aria-label="Vergrössern">＋</button>' +
          '<button data-a="passend" title="Alles ins Bild holen" aria-label="Alles ins Bild holen">⤢</button>' +
        '</span>' +
        '<span class="gk-trenn"></span>' +
        '<button data-a="zurueck" title="Schritt zurück" aria-label="Schritt zurück" disabled>↶</button>' +
        '<button data-a="vor" title="Schritt vorwärts" aria-label="Schritt vorwärts" disabled>↷</button>' +
      '</div>';

    const buehne = document.createElement('div');
    buehne.className = 'gk-buehne';
    buehne.tabIndex = 0;
    buehne.setAttribute('role', 'tree');
    buehne.setAttribute('aria-label', 'Gedankenkarte');
    buehne.style.height = hoehe + 'px';
    w.appendChild(buehne);

    const welt = document.createElement('div');
    welt.className = 'gk-welt';
    buehne.appendChild(welt);

    const linien = sv('svg', { class: 'gk-linien' }) as SVGSVGElement;
    welt.appendChild(linien);

    const griff = document.createElement('div');
    griff.className = 'gk-griff';
    griff.title = 'Höhe ziehen';
    w.appendChild(griff);

    /* --- Rückgängig ----------------------------------------------------- */
    const SCHRITTE = 40;
    /* Der Stapel wohnt im Kern (E687, `GfxHistory`) — Zeile für Zeile war er
       hier derselbe wie im Whiteboard. */
    const verlauf = GfxHistory.erstelle(SCHRITTE);
    const abbild = (): string => JSON.stringify(karte);
    const standZeigen = (): void => {
      const z = w.querySelector<HTMLButtonElement>('[data-a="zurueck"]');
      const v = w.querySelector<HTMLButtonElement>('[data-a="vor"]');
      if (z) z.disabled = !verlauf.kannZurueck();
      if (v) v.disabled = !verlauf.kannVor();
    };
    const merken = (): void => { verlauf.merken(abbild()); };

    const sichern = (): void => {
      Store.updateBlock(block.id, { karte: JSON.parse(JSON.stringify(karte)) });
    };

    /** Der einzige Weg, die Karte zu ändern. */
    const aendere = (tun: () => void): void => {
      merken();
      tun();
      sichern();
      male();
      standZeigen();
    };

    const einsetzen = (roh: string): void => {
      karte = leseKarte({ karte: JSON.parse(roh) });
      if (gewaehlt && !karte.knoten.some(k => k.id === gewaehlt)) gewaehlt = null;
      sichern();
      male();
      standZeigen();
    };

    /* --- Helfer am Modell ------------------------------------------------ */
    const knotenVon = (id: string | null): GkKnoten | null =>
      id ? (karte.knoten.find(k => k.id === id) ?? null) : null;
    const kinderVon = (id: string): string[] => letzterAufbau?.kinder[id] ?? [];

    /** Der Ast unter `id`, samt `id` selbst. */
    const ast = (id: string): string[] => {
      const raus: string[] = [];
      const stapel = [id];
      const gesehen = new Set<string>();
      while (stapel.length) {
        const k = stapel.pop();
        if (!k || gesehen.has(k)) continue;
        gesehen.add(k);
        raus.push(k);
        kinderVon(k).forEach(x => stapel.push(x));
      }
      return raus;
    };

    /* --- Messen und Malen ------------------------------------------------ */

    /**
     * Ein Knoten als DOM-Element. Noch ohne Ort — der kommt erst, wenn
     * gemessen wurde.
     */
    const knotenEl = (k: GkKnoten, ebene: number, kinderZahl: number): HTMLElement => {
      const el = document.createElement('div');
      el.className = 'gk-kn' + (k.eltern ? '' : ' gk-wurzel') + (k.id === gewaehlt ? ' on' : '');
      el.dataset.k = k.id;
      el.setAttribute('role', 'treeitem');
      el.setAttribute('aria-level', String(ebene));
      el.tabIndex = -1;
      if (kinderZahl) el.setAttribute('aria-expanded', k.zu ? 'false' : 'true');

      const txt = document.createElement('span');
      txt.className = 'gk-txt';
      /* `textContent`, nicht `innerHTML` — der Text kommt aus den Daten des
         Nutzers und darf nie als Auszeichnung gelesen werden (§19). */
      txt.textContent = k.text || '';
      if (!k.text) txt.classList.add('gk-leer');
      el.appendChild(txt);

      if (kinderZahl && k.zu) {
        const zahlEl = document.createElement('span');
        zahlEl.className = 'gk-zahl';
        zahlEl.textContent = String(kinderZahl);
        zahlEl.title = kinderZahl === 1 ? 'Ein verborgenes Unterthema'
                                        : kinderZahl + ' verborgene Unterthemen';
        el.appendChild(zahlEl);
      }

      /* Die Form steht am Knoten, nicht im Stil einer Klasse je Form: so
         braucht `bausteine`… — hier `werkzeuge.css` — genau einen Wähler je
         Form, und ein unbekannter Wert (aus einer neueren Fassung) fällt
         still auf die runde Grundform zurück, statt den Knoten zu
         verstümmeln (§18: unbekannte Werte nicht löschen). */
      if (k.form && k.form !== 'rund') el.dataset.form = k.form;

      /* ══ DIE VIER GRIFFE (E628) ═══════════════════════════════════════
         Nur am GEWÄHLTEN Knoten. An jedem Knoten wären es bei vierzig
         Themen hundertsechzig Knöpfe — und vier Punkte an jedem Kasten
         sehen aus wie ein Raster, nicht wie ein Angebot.

         Jeder Griff kann zweierlei, und das ist Absicht:
           tippen  → ein neues Thema in dieser Richtung
           ziehen  → eine freie Verbindung zu dem Knoten, auf dem man
                     loslässt
         Dieselbe Doppelung wie beim Platz-Griff der Zeichenleiste (E620):
         der kurze Weg bleibt ein Tipp, der lange wird ein Zug. */
      if (k.id === gewaehlt) griffeBauen(el);
      return el;
    };

    /**
     * Die vier Griffe an EINEN Knoten hängen.
     *
     * Eigener Helfer, weil zwei Wege hierher führen und beide gebraucht
     * werden: das Neuzeichnen (`knotenEl`) und das blosse Wählen (`waehle`).
     * Der zweite zeichnet die Karte NICHT neu — er setzt nur die Marke `on`
     * um. Ohne diesen Helfer erschienen die Griffe deshalb erst beim
     * nächsten Neuzeichnen, also nach der nächsten Änderung: angeklickt,
     * und nichts passiert. Gemessen im ersten Lauf von `test538`: null
     * Griffe am gewählten Knoten statt vier.
     */
    const griffeBauen = (el: HTMLElement): void => {
      const RICHTUNGEN: ReadonlyArray<readonly [string, string]> = [
        ['oben',   'darüber'],
        ['rechts', 'rechts daneben'],
        ['unten',  'darunter'],
        ['links',  'links daneben'],
      ];
      RICHTUNGEN.forEach(([r, wohin]) => {
        const g = document.createElement('button');
        g.type = 'button';
        g.className = 'gk-griffel gk-griffel-' + r;
        g.dataset.r = r;
        g.title = `Neues Thema ${wohin} — oder auf einen anderen Knoten ziehen: das gibt eine Verbindung`;
        g.setAttribute('aria-label', `Neues Thema ${wohin}`);
        el.appendChild(g);
      });
    };

    /** Eine Verbindung von Elternteil zu Kind — ein weicher Bogen. */
    const bogen = (von: GkOrt, vonM: GkMass, zu: GkOrt, zuM: GkMass, farbe: string, dick: number): SVGElement => {
      const rechtsHerum = zu.x + zuM.w / 2 >= von.x + vonM.w / 2;
      const px = rechtsHerum ? von.x + vonM.w : von.x;
      const py = von.y + vonM.h / 2;
      const cx = rechtsHerum ? zu.x : zu.x + zuM.w;
      const cy = zu.y + zuM.h / 2;
      const dx = (cx - px) / 2;
      const ast = sv('path', {
        d: `M ${px.toFixed(1)} ${py.toFixed(1)} C ${(px + dx).toFixed(1)} ${py.toFixed(1)}, ` +
           `${(cx - dx).toFixed(1)} ${cy.toFixed(1)}, ${cx.toFixed(1)} ${cy.toFixed(1)}`,
        fill: 'none', stroke: farbe, 'stroke-width': dick, 'stroke-linecap': 'round',
      });
      /* Im Hellen dunklere Tinte (E705, grund.css). */
      const hell = astHell(farbe);
      if (hell) { ast.setAttribute('data-tinte', 'strich'); ast.style.setProperty('--tinte-hell', hell); }
      return ast;
    };

    /* ══ EINE FREIE VERBINDUNG ZEICHNEN (E628) ═══════════════════════════
       Sie darf NICHT aussehen wie ein Ast. Ein Ast sagt „gehört dazu", eine
       Verbindung sagt „hat damit zu tun" — zwei Auskünfte, also zwei
       Gestalten: gestrichelt, dünner, in der gedämpften Textfarbe, und mit
       einer Spitze am Ziel.

       Sie hängt sich an die NÄCHSTEN Kanten der beiden Kästen, nicht an
       ihre Mitten; sonst liefe die Linie quer durch den eigenen Knoten und
       käme auf der anderen Seite wieder heraus.

       UND SIE MACHT EINEN BOGEN ZUR SEITE — das ist keine Verzierung.
       Zuerst lief sie gerade: zwei Äste links und rechts der Wurzel auf
       gleicher Höhe ergaben eine waagerechte Linie MITTEN DURCH die Wurzel.
       Gemessen im ersten Lauf von `test538`: der Kasten der Linie war
       181 × 0 px, sie lag komplett hinter dem Wurzelknoten, und ein Klick
       darauf traf die Wurzel statt die Verbindung. Der Bogen weicht
       senkrecht zur Verbindung aus, und zwar WEG von der Mitte der Karte —
       dort steht das meiste im Weg. */
    const verbBogen = (a: GkOrt, aM: GkMass, b: GkOrt, bM: GkMass,
                       mitte: GkOrt, id: string, an: boolean): SVGElement => {
      const amx = a.x + aM.w / 2, amy = a.y + aM.h / 2;
      const bmx = b.x + bM.w / 2, bmy = b.y + bM.h / 2;
      const waagerecht = Math.abs(bmx - amx) >= Math.abs(bmy - amy);
      const p1 = waagerecht
        ? { x: bmx >= amx ? a.x + aM.w : a.x, y: amy }
        : { x: amx, y: bmy >= amy ? a.y + aM.h : a.y };
      const p2 = waagerecht
        ? { x: bmx >= amx ? b.x : b.x + bM.w, y: bmy }
        : { x: bmx, y: bmy >= amy ? b.y : b.y + bM.h };
      const sx = p2.x - p1.x, sy = p2.y - p1.y;
      const laenge = Math.hypot(sx, sy) || 1;
      /* Die Senkrechte auf der Verbindung — und die Richtung, in die sie
         zeigen soll: vom Mittelpunkt der Karte fort. Liegt die Verbindung
         genau auf der Mitte (der Fall oben), gilt „nach oben". */
      let nx = -sy / laenge, ny = sx / laenge;
      const mx = (p1.x + p2.x) / 2 - mitte.x, my = (p1.y + p2.y) / 2 - mitte.y;
      const weg = nx * mx + ny * my;
      if (weg < 0 || (weg === 0 && ny > 0)) { nx = -nx; ny = -ny; }
      const hoch = Math.min(110, Math.max(60, laenge * .25));
      const d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} C `
        + `${(p1.x + sx / 3 + nx * hoch).toFixed(1)} ${(p1.y + sy / 3 + ny * hoch).toFixed(1)}, `
        + `${(p2.x - sx / 3 + nx * hoch).toFixed(1)} ${(p2.y - sy / 3 + ny * hoch).toFixed(1)}, `
        + `${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      const g = sv('g', { class: 'gk-verb' + (an ? ' on' : ''), 'data-v': id });
      /* ZWEI PFADE ÜBEREINANDER. Der untere ist breit und unsichtbar — er
         ist die Trefffläche. Eine zwei Pixel dünne Linie mit der Maus zu
         treffen ist Glückssache, mit dem Finger unmöglich (§37). */
      g.appendChild(sv('path', { d, class: 'gk-verb-fang', fill: 'none' }));
      g.appendChild(sv('path', {
        d, class: 'gk-verb-linie', fill: 'none',
        'marker-end': 'url(#gk-spitze)',
      }));
      return g;
    };

    const sichtAnwenden = (): void => {
      welt.style.transform = `translate(${(-karte.sicht.x).toFixed(1)}px, ` +
                             `${(-karte.sicht.y).toFixed(1)}px) scale(${karte.sicht.z})`;
      const m = w.querySelector('.gk-massstab');
      if (m) m.textContent = Math.round(karte.sicht.z * 100) + ' %';
    };

    /**
     * Zeichnen in zwei Durchgängen: erst einhängen und messen, dann rechnen
     * und setzen. Siehe Kopf der Datei, Punkt 1.
     */
    const male = (): void => {
      if (schreibt) return;   /* wer gerade tippt, verliert sonst den Zeiger */
      welt.querySelectorAll('.gk-kn').forEach(el => el.remove());

      const { kinder, wurzel } = baum(karte);
      if (!wurzel) return;

      /* Ebenen für `aria-level` — eine Karte ist für ein Vorleseprogramm ein
         Baum, und ein Baum ohne Ebenen ist eine Liste. */
      const ebenen: Record<string, number> = { [wurzel]: 1 };
      const reihe = [wurzel];
      while (reihe.length) {
        const id = reihe.shift() as string;
        (kinder[id] ?? []).forEach(k => { ebenen[k] = (ebenen[id] ?? 1) + 1; reihe.push(k); });
      }

      const zuMerk = new Map<string, boolean>(karte.knoten.map(k => [k.id, !!k.zu]));
      const sichtbare: GkKnoten[] = [];
      const stapel = [wurzel];
      while (stapel.length) {
        const id = stapel.shift() as string;
        const k = karte.knoten.find(n => n.id === id);
        if (k) sichtbare.push(k);
        if (!zuMerk.get(id)) (kinder[id] ?? []).forEach(x => stapel.push(x));
      }

      const els: Record<string, HTMLElement> = {};
      sichtbare.forEach(k => {
        const el = knotenEl(k, ebenen[k.id] ?? 1, (kinder[k.id] ?? []).length);
        els[k.id] = el;
        welt.appendChild(el);
      });

      /* Erst JETZT messen. */
      const masse: Record<string, GkMass> = {};
      Object.entries(els).forEach(([id, el]) => { masse[id] = { w: el.offsetWidth, h: el.offsetHeight }; });

      /* DIE KARTE DARF NICHT SPRINGEN, WENN SIE WÄCHST.
         `aufbauen` schiebt das Ergebnis so, dass die linke obere Ecke bei
         `RAND` liegt — sonst hätte die Welt negative Koordinaten und das SVG
         müsste sie tragen. Die Folge: wächst die Karte nach LINKS, wandert
         in Weltkoordinaten alles nach rechts, und der Ausschnitt zeigt
         plötzlich etwas anderes. Beim Anlegen eines Unterthemas auf der
         linken Seite hüpfte damit die ganze Karte weg.
         Deshalb wird der Ausschnitt um genau denselben Betrag mitgezogen,
         um den die Wurzel gewandert ist. Für das Auge bleibt dann alles
         stehen, egal auf welcher Seite etwas dazukommt. */
      const wurzelVorher = letzterAufbau?.orte[wurzel];
      letzteMasse = masse;
      const plan = aufbauen(karte, masse);
      const wurzelNachher = plan.orte[wurzel];
      if (wurzelVorher && wurzelNachher && !mussEinpassen) {
        karte.sicht.x += (wurzelNachher.x - wurzelVorher.x) * karte.sicht.z;
        karte.sicht.y += (wurzelNachher.y - wurzelVorher.y) * karte.sicht.z;
      }
      letzterAufbau = plan;

      Object.entries(els).forEach(([id, el]) => {
        const o = plan.orte[id];
        if (!o) { el.remove(); return; }
        el.style.left = o.x.toFixed(1) + 'px';
        el.style.top = o.y.toFixed(1) + 'px';
        el.style.setProperty('--ast', plan.farben[id] ?? 'var(--text-dim)');
        const hell = astHell(plan.farben[id] ?? '');
        if (hell) el.style.setProperty('--ast-hell', hell); else el.style.removeProperty('--ast-hell');
      });

      welt.style.width = plan.breite + 'px';
      welt.style.height = plan.hoehe + 'px';
      linien.setAttribute('width', String(plan.breite));
      linien.setAttribute('height', String(plan.hoehe));
      linien.setAttribute('viewBox', `0 0 ${plan.breite} ${plan.hoehe}`);
      while (linien.firstChild) linien.removeChild(linien.firstChild);

      sichtbare.forEach(k => {
        const o = plan.orte[k.id];
        const m = masse[k.id];
        if (!o || !m || zuMerk.get(k.id)) return;
        (kinder[k.id] ?? []).forEach(kid => {
          const ko = plan.orte[kid];
          const km = masse[kid];
          if (!ko || !km) return;
          const dick = (ebenen[kid] ?? 2) <= 2 ? 3 : 2;
          linien.appendChild(bogen(o, m, ko, km, plan.farben[kid] ?? 'var(--text-dim)', dick));
        });
      });

      /* DIE FREIEN VERBINDUNGEN ZULETZT — sie liegen über den Ästen, denn
         sie sind das Seltenere und sollen nicht unter einem dicken Ast der
         ersten Ebene verschwinden. */
      if (karte.verbindungen.length) {
        const spitze = sv('marker', {
          id: 'gk-spitze', viewBox: '0 0 10 10', refX: '9', refY: '5',
          markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse',
        });
        spitze.appendChild(sv('path', { d: 'M 0 1 L 9 5 L 0 9 z', class: 'gk-spitze' }));
        const defs = sv('defs');
        defs.appendChild(spitze);
        linien.appendChild(defs);
        karte.verbindungen.forEach(v => {
          const a = plan.orte[v.von], b = plan.orte[v.zu];
          const aM = masse[v.von], bM = masse[v.zu];
          /* Ein Ende in einem zugeklappten Ast: die Linie liefe ins Leere.
             Sie fällt weg, bis der Ast wieder auf ist — die Verbindung
             selbst bleibt in den Daten stehen. */
          if (!a || !b || !aM || !bM) return;
          linien.appendChild(verbBogen(a, aM, b, bM,
            { x: plan.breite / 2, y: plan.hoehe / 2 }, v.id, v.id === gewaehlteVerb));
        });
      }

      sichtAnwenden();
      if (mussEinpassen && buehne.getBoundingClientRect().width > 4) {
        mussEinpassen = false;
        einpassen(1, false, LESBAR);
      }
    };

    /* --- Schreiben -------------------------------------------------------
       Wie in E597/E598: ein `contenteditable`-Div, kein `<textarea>`. Die
       Begründung steht im Kopf der Datei. */
    const schreiberSchliessen = (weiter: 'kind' | 'neben' | null): void => {
      const id = schreibt;
      if (!id) return;
      schreibt = null;
      const el = welt.querySelector<HTMLElement>(`.gk-kn[data-k="${CSS.escape(id)}"] .gk-txt`);
      const neu = (el?.innerText ?? '').replace(/ /g, ' ').replace(/\s+$/, '');
      if (el) { el.contentEditable = 'false'; el.classList.remove('gk-schreibt'); }
      const k = knotenVon(id);
      if (k && k.text !== neu) aendere(() => { k.text = neu; });
      else male();
      if (weiter === 'kind') neuesKind(id);
      else if (weiter === 'neben') neuesGeschwister(id);
      else buehne.focus();
    };

    const bearbeite = (id: string | null): void => {
      if (!id) return;
      const el = welt.querySelector<HTMLElement>(`.gk-kn[data-k="${CSS.escape(id)}"] .gk-txt`);
      if (!el) return;
      gewaehlt = id;
      schreibt = id;
      el.classList.remove('gk-leer');
      el.classList.add('gk-schreibt');
      el.contentEditable = 'true';
      el.spellcheck = false;
      /* Ein neu angelegtes Unterthema kann ausserhalb des Ausschnitts liegen —
         dann tippte man in etwas, das man nicht sieht. */
      const kasten = el.closest<HTMLElement>('.gk-kn');
      if (kasten) insBild(kasten);
      el.focus();
      const bereich = document.createRange();
      bereich.selectNodeContents(el);
      const auswahl = window.getSelection();
      auswahl?.removeAllRanges();
      auswahl?.addRange(bereich);
    };

    /* --- Die Wege --------------------------------------------------------- */
    const neuesKind = (elternId: string | null): void => {
      const eltern = knotenVon(elternId);
      if (!eltern) return;
      const neu: GkKnoten = { id: uid(), text: '', eltern: eltern.id };
      aendere(() => {
        if (eltern.zu) delete eltern.zu;
        /* Direkt hinter den letzten schon vorhandenen Nachfahren — sonst
           stünde ein neues Unterthema in der Liste vor seinen älteren
           Geschwistern, und die Reihenfolge am Bild wäre eine andere als
           die in den Daten. */
        const kinder = kinderVon(eltern.id);
        const letzterKind = kinder.length ? kinder[kinder.length - 1] : null;
        const nach = letzterKind
          ? Math.max(...ast(letzterKind).map(x => karte.knoten.findIndex(n => n.id === x)))
          : karte.knoten.findIndex(n => n.id === eltern.id);
        karte.knoten.splice(nach + 1, 0, neu);
      });
      bearbeite(neu.id);
    };

    const neuesGeschwister = (id: string | null): void => {
      const k = knotenVon(id);
      if (!k) return;
      if (!k.eltern) { neuesKind(k.id); return; }   /* die Wurzel hat keine Geschwister */
      const neu: GkKnoten = { id: uid(), text: '', eltern: k.eltern };
      aendere(() => {
        const nach = Math.max(...ast(k.id).map(x => karte.knoten.findIndex(n => n.id === x)));
        karte.knoten.splice(nach + 1, 0, neu);
      });
      bearbeite(neu.id);
    };

    const loeschen = (id: string | null): void => {
      const k = knotenVon(id);
      if (!k) return;
      if (!k.eltern) { UI.toast('Das zentrale Thema bleibt — eine Karte ohne Mitte gibt es nicht.'); return; }
      const weg = new Set(ast(k.id));
      const eltern = k.eltern;
      aendere(() => { karte.knoten = karte.knoten.filter(n => !weg.has(n.id)); });
      gewaehlt = eltern;
      male();
      UI.toast(weg.size === 1 ? 'Thema gelöscht — mit ↶ zurückholen'
                              : weg.size + ' Themen gelöscht — mit ↶ zurückholen');
    };

    /* ══ EIN NEUES THEMA IN EINER RICHTUNG (E628) ════════════════════════
       Was ein Griff tut, hängt davon ab, was der Aufbau in dieser Richtung
       überhaupt KANN — und das ehrlich, statt etwas zu versprechen, das
       hinterher woanders landet:

         links / rechts   ein KIND. Die Karte wächst waagerecht: Äste gehen
                          nach links und rechts. Bei einem Thema der ersten
                          Ebene wird die Seite gleich festgeschrieben, sonst
                          suchte sich `aufbauen` selbst eine aus und der
                          Knoten spränge auf die andere Seite.
         oben / unten     ein GESCHWISTER. Senkrecht stehen in diesem Aufbau
                          die Geschwister; ein Kind „über" dem Elternteil
                          gibt es nicht. `vor` sagt, ob es davor oder
                          dahinter einsortiert wird.

       Das ist keine Ausrede, sondern die Zuordnung, die das Auge ohnehin
       erwartet: der neue Kasten erscheint dort, wo der Griff sitzt. */
    const neuerNachbar = (id: string | null, richtung: string): void => {
      const k = knotenVon(id);
      if (!k) return;
      if (richtung === 'links' || richtung === 'rechts') {
        const neu: GkKnoten = { id: uid(), text: '', eltern: k.id };
        /* Nur die erste Ebene hat eine eigene Seite — darunter erbt jeder
           Ast die des Zweiges, und ein `seite` täte dort nichts. */
        if (!k.eltern) neu.seite = richtung;
        aendere(() => {
          if (k.zu) delete k.zu;
          const ks = kinderVon(k.id);
          const letzter = ks.length ? ks[ks.length - 1] : null;
          const nach = letzter
            ? Math.max(...ast(letzter).map(x => karte.knoten.findIndex(n => n.id === x)))
            : karte.knoten.findIndex(n => n.id === k.id);
          karte.knoten.splice(nach + 1, 0, neu);
        });
        bearbeite(neu.id);
        return;
      }
      /* oben / unten */
      if (!k.eltern) {
        /* Die Wurzel hat keine Geschwister — dort ist „darüber" so nah an
           „ein neues Unterthema", dass ein Tipp nicht ins Leere gehen soll. */
        neuesKind(k.id);
        return;
      }
      const vor = richtung === 'oben';
      const neu: GkKnoten = { id: uid(), text: '', eltern: k.eltern };
      if (k.seite) neu.seite = k.seite;
      aendere(() => {
        const eigene = ast(k.id).map(x => karte.knoten.findIndex(n => n.id === x));
        const stelle = vor ? Math.min(...eigene) : Math.max(...eigene) + 1;
        karte.knoten.splice(stelle, 0, neu);
      });
      bearbeite(neu.id);
    };

    /* ══ EINE FREIE VERBINDUNG ANLEGEN UND LÖSCHEN (E628) ════════════════ */
    const verbinden = (vonId: string, zuId: string): void => {
      if (vonId === zuId) { UI.toast('Ein Thema mit sich selbst zu verbinden sagt nichts.'); return; }
      const paar = (a: string, b: string): string => (a < b ? a + '|' + b : b + '|' + a);
      const schon = karte.verbindungen.find(v => paar(v.von, v.zu) === paar(vonId, zuId));
      if (schon) { gewaehlteVerb = schon.id; gewaehlt = null; male(); UI.toast('Diese Verbindung gibt es schon.'); return; }
      /* Eine Verbindung zwischen Elternteil und Kind wäre eine zweite Linie
         auf einer, die schon da ist — der Ast. */
      const kEltern = knotenVon(vonId)?.eltern, zEltern = knotenVon(zuId)?.eltern;
      if (kEltern === zuId || zEltern === vonId) {
        UI.toast('Die beiden hängen schon aneinander — das ist ihr Ast.');
        return;
      }
      const neu: GkVerbindung = { id: uid(), von: vonId, zu: zuId };
      aendere(() => { karte.verbindungen.push(neu); });
      gewaehlteVerb = neu.id;
      gewaehlt = null;
      male();
      UI.toast('Verbindung gezogen — Entf löscht sie, ↶ nimmt sie zurück.');
    };

    const verbindungWeg = (id: string | null): void => {
      if (!id) return;
      if (!karte.verbindungen.some(v => v.id === id)) return;
      aendere(() => { karte.verbindungen = karte.verbindungen.filter(v => v.id !== id); });
      gewaehlteVerb = null;
      male();
      UI.toast('Verbindung gelöscht — mit ↶ zurückholen');
    };

    /* ══ DIE FORM (E628) ═════════════════════════════════════════════════ */
    const formSetzen = (id: string | null, form: string): void => {
      const k = knotenVon(id);
      if (!k) return;
      aendere(() => { if (form && form !== 'rund') k.form = form; else delete k.form; });
    };

    const klappen = (id: string | null): void => {
      const k = knotenVon(id);
      if (!k || !kinderVon(k.id).length) return;
      aendere(() => { if (k.zu) delete k.zu; else k.zu = true; });
    };

    const faerben = (id: string | null, farbe: string): void => {
      const k = knotenVon(id);
      if (!k) return;
      aendere(() => { if (farbe) k.farbe = farbe; else delete k.farbe; });
    };

    /* --- Nachbarn für die Pfeiltasten ------------------------------------ */
    const nachbar = (id: string, richtung: 'links' | 'rechts' | 'hoch' | 'runter'): string | null => {
      const plan = letzterAufbau;
      if (!plan) return null;
      const mein = plan.orte[id];
      if (!mein) return null;
      const kandidaten = Object.entries(plan.orte).filter(([x]) => x !== id);
      const passt = ([, o]: [string, GkOrt]): boolean =>
        richtung === 'rechts' ? o.x > mein.x
        : richtung === 'links' ? o.x < mein.x
        : richtung === 'runter' ? o.y > mein.y
        : o.y < mein.y;
      const naehe = ([, o]: [string, GkOrt]): number => {
        const dx = o.x - mein.x, dy = o.y - mein.y;
        /* Quer zur Richtung wiegt schwerer — sonst springt „nach rechts" in
           einen weit entfernten Ast, nur weil er ein Pixel weiter rechts
           beginnt. */
        return richtung === 'links' || richtung === 'rechts'
          ? Math.abs(dx) + Math.abs(dy) * 3
          : Math.abs(dy) + Math.abs(dx) * 3;
      };
      const treffer = kandidaten.filter(passt).sort((a, b) => naehe(a) - naehe(b))[0];
      return treffer ? treffer[0] : null;
    };

    const waehle = (id: string | null): void => {
      if (!id) return;
      /* Ein Thema zu wählen hebt die gewählte Verbindung auf — sonst stünden
         zwei Dinge markiert da und die Entf-Taste wäre nicht mehr eindeutig. */
      if (gewaehlteVerb) { gewaehlteVerb = null; male(); }
      gewaehlt = id;
      welt.querySelectorAll('.gk-kn.on').forEach(el => el.classList.remove('on'));
      welt.querySelectorAll('.gk-griffel').forEach(g => g.remove());
      const el = welt.querySelector<HTMLElement>(`.gk-kn[data-k="${CSS.escape(id)}"]`);
      el?.classList.add('on');
      if (el) griffeBauen(el);
      if (el) insBild(el);
    };

    /** Holt einen Knoten ins Bild, wenn er danebenliegt. */
    const insBild = (el: HTMLElement): void => {
      const b = buehne.getBoundingClientRect();
      const k = el.getBoundingClientRect();
      let dx = 0, dy = 0;
      if (k.left < b.left + 8) dx = k.left - (b.left + 8);
      else if (k.right > b.right - 8) dx = k.right - (b.right - 8);
      if (k.top < b.top + 8) dy = k.top - (b.top + 8);
      else if (k.bottom > b.bottom - 8) dy = k.bottom - (b.bottom - 8);
      if (!dx && !dy) return;
      karte.sicht.x += dx;
      karte.sicht.y += dy;
      sichtAnwenden();
    };

    /* --- Massstab --------------------------------------------------------- */
    const zoomen = (faktor: number): void => {
      const alt = karte.sicht.z;
      const neu = Math.min(4, Math.max(.2, alt * faktor));
      if (neu === alt) return;
      /* Um die Mitte der Bühne, nicht um die linke obere Ecke — sonst wandert
         beim Verkleinern alles aus dem Bild. */
      const b = buehne.getBoundingClientRect();
      karte.sicht.x = (karte.sicht.x + b.width / 2) * (neu / alt) - b.width / 2;
      karte.sicht.y = (karte.sicht.y + b.height / 2) * (neu / alt) - b.height / 2;
      karte.sicht.z = neu;
      sichtAnwenden();
      sichern();
    };

    /**
     * Die ganze Karte in den Kasten holen und mittig stellen.
     *
     * `hoechstens` deckelt den Massstab. Der Knopf ⤢ sagt „alles ins Bild"
     * und darf dafür auch VERGRÖSSERN — eine Karte mit drei Knoten füllt dann
     * den Kasten. Der erste Blick beim Öffnen deckelt dagegen bei 1: eine
     * kleine Karte auf 340 % aufgeblasen sieht nicht nach Sorgfalt aus,
     * sondern nach einem Fehler.
     */
    const einpassen = (hoechstens: number, speichern: boolean, mindestens = .2): void => {
      const plan = letzterAufbau;
      if (!plan || !plan.breite || !plan.hoehe) return;
      const b = buehne.getBoundingClientRect();
      const breite = b.width > 4 ? b.width : 900;
      const hoch = b.height > 4 ? b.height : hoehe;
      const passt = Math.min(breite / plan.breite, hoch / plan.hoehe);
      const z = Math.min(hoechstens, Math.max(mindestens, passt));
      karte.sicht.z = z;
      const wurzelOrt = plan.wurzel ? plan.orte[plan.wurzel] : null;
      const wurzelMass = plan.wurzel ? letzteMasse[plan.wurzel] : null;
      if (passt >= mindestens || !wurzelOrt || !wurzelMass) {
        /* Es passt — die ganze Karte mittig in den Kasten. */
        karte.sicht.x = (plan.breite * z - breite) / 2;
        karte.sicht.y = (plan.hoehe * z - hoch) / 2;
      } else {
        /* Es passt NICHT, ohne unlesbar zu werden. Dann lieber die Mitte
           zeigen und den Rest erschieben lassen, als alles hineinquetschen. */
        const mx = wurzelOrt.x + wurzelMass.w / 2;
        const my = wurzelOrt.y + wurzelMass.h / 2;
        karte.sicht.x = mx * z - breite / 2;
        karte.sicht.y = my * z - hoch / 2;
      }
      sichtAnwenden();
      if (speichern) sichern();
    };

    /* ══ DAS VORLAGEN-MENÜ (E628) ═══════════════════════════════════════
       Eine Vorlage ERSETZT die Karte. Das ist der gefährlichste Knopf in
       dieser Leiste, und deshalb hat er als einziger eine Rückfrage — aber
       nur dann, wenn wirklich etwas auf dem Spiel steht (§9).

       „Leer" heisst hier: ein einziger Knoten, dessen Text noch der ist, den
       eine frische Karte mitbringt, und keine Verbindung. Wer zwei Wörter
       getippt hat, wird gefragt; wer die Karte gerade angelegt hat, nicht —
       eine Rückfrage, die immer kommt, wird nicht mehr gelesen (§55.3). */
    const karteLeer = (): boolean =>
      karte.knoten.length <= 1 &&
      !karte.verbindungen.length &&
      (!karte.knoten[0] || !karte.knoten[0].text.trim() ||
       karte.knoten[0].text === 'Zentrales Thema');

    const vorlageEinsetzen = (v: GkVorlage): void => {
      void (async () => {
        if (!karteLeer()) {
          const antwort = await Dialog.wahl({
            titel: 'Vorlage „' + v.name + '" einsetzen?',
            text: 'Die jetzige Karte wird dabei ersetzt — alle Themen und '
                + 'Verbindungen darin verschwinden.',
            knoepfe: [
              { id: 'ja', text: 'Ersetzen',
                hinweis: 'Der Schritt-zurück-Knopf ↶ holt die alte Karte wieder.' },
              { id: '', text: 'Abbrechen', hinweis: 'Die Karte bleibt, wie sie ist.' },
            ],
          });
          if (antwort !== 'ja') return;
        }
        const frisch = vorlageKarte(v);
        aendere(() => { karte = frisch; });
        gewaehlteVerb = null;
        waehle('w');
        einpassen(1, true);
        UI.toast('Vorlage „' + v.name + '" eingesetzt — ↶ nimmt sie zurück');
      })();
    };

    const vorlagenMenue = (anker: HTMLElement): void => {
      const r = anker.getBoundingClientRect();
      const m = UI.menu(
        '<div class="grp">Fertige Vorlage</div>' +
        VORLAGEN.map(v =>
          `<button data-v="${esc(v.id)}"><span>${esc(v.name)}` +
          `<span class="sub">${esc(v.hinweis)}</span></span></button>`).join(''),
        Math.max(8, r.left - 40), r.bottom + 6,
        { titel: 'Fertige Vorlage' });
      m.addEventListener('click', e => {
        const b = (e.target as Element).closest<HTMLElement>('[data-v]');
        if (!b) return;
        m.remove();
        const v = VORLAGEN.find(x => x.id === b.dataset.v);
        if (v) vorlageEinsetzen(v);
      });
    };

    const markdownEinfuegen = (text: string, titel?: string): void => {
      if (!w.isConnected) return;
      try {
        const importiert = ausMarkdown(text, titel);
        let fokus = 'w';
        aendere(() => {
          if (karteLeer()) { karte = importiert; return; }
          const wurzel = baum(karte).wurzel;
          const neueIds = new Map(importiert.knoten.map(k => [k.id, uid()]));
          fokus = neueIds.get('w') ?? 'w';
          for (const k of importiert.knoten) {
            karte.knoten.push({
              ...k,
              id: neueIds.get(k.id) ?? k.id,
              eltern: k.eltern ? (neueIds.get(k.eltern) ?? wurzel) : wurzel,
            });
          }
        });
        gewaehlteVerb = null;
        waehle(fokus);
        einpassen(1, true);
        UI.toast(importiert.knoten.length + ' Markdown-Themen importiert');
      } catch (fehler) {
        UI.toast(fehler instanceof Error ? fehler.message : 'Markdown konnte nicht gelesen werden.');
      }
    };

    const markdownEinlesen = (): void => {
      const eingang = document.createElement('input');
      eingang.type = 'file';
      eingang.accept = '.md,.markdown,.txt,text/markdown,text/plain';
      eingang.addEventListener('change', async () => {
        const datei = eingang.files?.[0];
        if (!datei) return;
        try {
          if (datei.size > MARKDOWN_GROESSE) throw new Error('Die Markdown-Datei ist zu gross.');
          markdownEinfuegen(await datei.text(), datei.name.replace(/\.[^.]+$/, '') || undefined);
        } catch (fehler) {
          UI.toast(fehler instanceof Error ? fehler.message : 'Markdown konnte nicht gelesen werden.');
        }
      }, { once: true });
      eingang.click();
    };

    const markdownMenue = (anker: HTMLElement): void => {
      const r = anker.getBoundingClientRect();
      const m = UI.menu(
        '<button data-md="import">Markdown-Datei öffnen</button>' +
        '<button data-md="paste">Markdown-Text einfügen</button>' +
        '<button data-md="export">Gliederung als Markdown speichern</button>',
        r.left, r.bottom + 6, { titel: 'Markdown-Gliederung' });
      m.addEventListener('click', e => {
        const aktion = (e.target as Element).closest<HTMLElement>('[data-md]')?.dataset.md;
        if (!aktion) return;
        m.remove();
        if (aktion === 'import') { markdownEinlesen(); return; }
        if (aktion === 'paste') {
          void Dialog.mehrzeilig('Markdown-Gliederung einfügen').then(text => {
            if (text) markdownEinfuegen(text, 'Markdown-Gliederung');
          });
          return;
        }
        const blob = new Blob([alsMarkdown(karte)], { type: 'text/markdown;charset=utf-8' });
        void Ereignisse.frageAsync(ARTEN.frageDateiExport, { blob, name: 'Redion-Gedankenkarte.md' });
      });
    };

    /* --- Ereignisse ------------------------------------------------------- */
    const elVon = (e: Event): Element | null => e.target instanceof Element ? e.target : null;

    w.querySelector('.gk-leiste')?.addEventListener('click', e => {
      const farbKnopf = elVon(e)?.closest<HTMLElement>('.gk-farbe');
      if (farbKnopf) { faerben(gewaehlt, farbKnopf.dataset.c || ''); return; }
      const formKnopf = elVon(e)?.closest<HTMLElement>('.gk-form');
      if (formKnopf) { formSetzen(gewaehlt, formKnopf.dataset.f || ''); return; }
      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      switch (b.dataset.a) {
        case 'kind':     neuesKind(gewaehlt); break;
        case 'neben':    neuesGeschwister(gewaehlt); break;
        case 'text':     bearbeite(gewaehlt); break;
        case 'klapp':    klappen(gewaehlt); break;
        case 'weg':      loeschen(gewaehlt); break;
        case 'kleiner':  zoomen(1 / 1.25); break;
        case 'groesser': zoomen(1.25); break;
        case 'passend':  einpassen(4, true); break;
        case 'vorlage':  vorlagenMenue(b); break;
        case 'markdown': markdownMenue(b); break;
        case 'zurueck': {
          const roh = verlauf.zurueck(abbild());
          if (roh === null) return;
          einsetzen(roh);
          break;
        }
        case 'vor': {
          const roh = verlauf.vor(abbild());
          if (roh === null) return;
          einsetzen(roh);
          break;
        }
        default: break;
      }
    });

    buehne.addEventListener('pointerdown', e => {
      /* ══ EIN GRIFF KANN ZWEIERLEI (E628) ═══════════════════════════════
         Tippen legt ein Thema an, Ziehen zieht eine Verbindung. Entschieden
         wird am Weg: unter sechs Pixeln ist es ein Tipp. Dieselbe Schwelle
         und derselbe Grund wie beim Platz-Griff der Zeichenleiste (E620) —
         ein Finger wackelt immer ein wenig. */
      const griffel = elVon(e)?.closest<HTMLElement>('.gk-griffel');
      if (griffel) {
        e.preventDefault();
        e.stopPropagation();
        const vonId = griffel.closest<HTMLElement>('.gk-kn')?.dataset.k || '';
        const richtung = griffel.dataset.r || 'rechts';
        const startX = e.clientX, startY = e.clientY;
        let zieht = false;
        const ziel = (ev: PointerEvent): HTMLElement | null => {
          const unten = document.elementFromPoint(ev.clientX, ev.clientY);
          const kn = unten && (unten as Element).closest
            ? (unten as Element).closest<HTMLElement>('.gk-kn') : null;
          return kn && kn.dataset.k && kn.dataset.k !== vonId ? kn : null;
        };
        const bewegen = (ev: PointerEvent): void => {
          if (!zieht && Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 6) return;
          if (!zieht) { zieht = true; buehne.classList.add('gk-zieht-verb'); }
          welt.querySelectorAll('.gk-kn.gk-ziel').forEach(x => x.classList.remove('gk-ziel'));
          ziel(ev)?.classList.add('gk-ziel');
        };
        const aus = (ev: PointerEvent): void => {
          window.removeEventListener('pointermove', bewegen);
          window.removeEventListener('pointerup', aus);
          window.removeEventListener('pointercancel', aus);
          buehne.classList.remove('gk-zieht-verb');
          welt.querySelectorAll('.gk-kn.gk-ziel').forEach(x => x.classList.remove('gk-ziel'));
          if (!zieht) { neuerNachbar(vonId, richtung); return; }
          const treffer = ziel(ev);
          if (treffer?.dataset.k) verbinden(vonId, treffer.dataset.k);
        };
        window.addEventListener('pointermove', bewegen);
        window.addEventListener('pointerup', aus);
        window.addEventListener('pointercancel', aus);
        return;
      }

      /* Eine Verbindung anfassen: sie wird gewählt, der Knoten nicht. */
      const verb = elVon(e)?.closest<SVGElement>('.gk-verb');
      if (verb) {
        /* OHNE `preventDefault` NIMMT DER BROWSER DEN FOKUS WIEDER WEG.
           Gemessen: nach dem Klick auf die Linie stand `document.activeElement`
           auf dem Körper der Seite, nicht auf der Bühne — und die Entf-Taste
           lief ins Leere. Ein Knoten ist ein `div` und gibt den Fokus an die
           Bühne weiter; ein SVG-Pfad tut das nicht. */
        e.preventDefault();
        const id = verb.getAttribute('data-v') || '';
        if (schreibt) schreiberSchliessen(null);
        gewaehlteVerb = id;
        gewaehlt = null;
        male();
        buehne.focus();
        return;
      }

      const kn = elVon(e)?.closest<HTMLElement>('.gk-kn');
      if (kn && kn.dataset.k) {
        gewaehlteVerb = null;
        if (schreibt && schreibt !== kn.dataset.k) schreiberSchliessen(null);
        waehle(kn.dataset.k);
        if (!schreibt) buehne.focus();
        return;
      }
      if (schreibt) { schreiberSchliessen(null); return; }
      /* Auf leerer Fläche: schieben. */
      const startX = e.clientX, startY = e.clientY;
      const vonX = karte.sicht.x, vonY = karte.sicht.y;
      buehne.classList.add('gk-schiebt');
      const zug = (ev: PointerEvent): void => {
        karte.sicht.x = vonX - (ev.clientX - startX);
        karte.sicht.y = vonY - (ev.clientY - startY);
        sichtAnwenden();
      };
      const aus = (): void => {
        window.removeEventListener('pointermove', zug);
        window.removeEventListener('pointerup', aus);
        buehne.classList.remove('gk-schiebt');
        sichern();
      };
      window.addEventListener('pointermove', zug);
      window.addEventListener('pointerup', aus);
    });

    buehne.addEventListener('dblclick', e => {
      const kn = elVon(e)?.closest<HTMLElement>('.gk-kn');
      if (kn?.dataset.k) bearbeite(kn.dataset.k);
    });

    buehne.addEventListener('wheel', e => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomen(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    }, { passive: false });

    buehne.addEventListener('keydown', e => {
      /* Beim Schreiben gehört die Tastatur dem Text — bis auf die drei
         Tasten, die XMind dort anders belegt. */
      if (schreibt) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); schreiberSchliessen('neben'); return; }
        if (e.key === 'Tab')   { e.preventDefault(); e.stopPropagation(); schreiberSchliessen('kind'); return; }
        if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); schreiberSchliessen(null); return; }
        return;
      }
      const strg = e.ctrlKey || e.metaKey;
      if (strg && e.key.toLowerCase() === 'z') {
        e.preventDefault(); e.stopPropagation();
        const roh = e.shiftKey ? verlauf.vor(abbild()) : verlauf.zurueck(abbild());
        if (roh === null) return;
        einsetzen(roh);
        return;
      }
      if (strg) return;
      switch (e.key) {
        case 'Tab':       e.preventDefault(); e.stopPropagation(); neuesKind(gewaehlt); return;
        case 'Enter':     e.preventDefault(); e.stopPropagation(); neuesGeschwister(gewaehlt); return;
        case 'F2':        e.preventDefault(); e.stopPropagation(); bearbeite(gewaehlt); return;
        case ' ':         e.preventDefault(); e.stopPropagation(); klappen(gewaehlt); return;
        case 'Delete':
        case 'Backspace':
          e.preventDefault(); e.stopPropagation();
          /* Gewählt ist ENTWEDER ein Thema ODER eine Verbindung (E628) —
             also löscht dieselbe Taste das eine oder das andere, nie beides. */
          if (gewaehlteVerb) verbindungWeg(gewaehlteVerb);
          else loeschen(gewaehlt);
          return;
        case 'ArrowRight': case 'ArrowLeft': case 'ArrowUp': case 'ArrowDown': {
          if (!gewaehlt) return;
          e.preventDefault(); e.stopPropagation();
          const richtung = e.key === 'ArrowRight' ? 'rechts' : e.key === 'ArrowLeft' ? 'links'
                         : e.key === 'ArrowUp' ? 'hoch' : 'runter';
          waehle(nachbar(gewaehlt, richtung));
          return;
        }
        default: return;
      }
    });

    /* Ein Zeichen tippen, während ein Knoten gewählt ist, ersetzt seinen Text
       — wie in XMind. Das läuft über `keypress`-artiges `beforeinput` nicht,
       weil die Bühne selbst nicht editierbar ist; deshalb hier. */
    buehne.addEventListener('keypress', e => {
      if (schreibt || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return;
      const k = knotenVon(gewaehlt);
      if (!k) return;
      e.preventDefault();
      const zeichen = e.key;
      aendere(() => { k.text = zeichen; });
      bearbeite(k.id);
      const el = welt.querySelector<HTMLElement>(`.gk-kn[data-k="${CSS.escape(k.id)}"] .gk-txt`);
      if (el) {
        const bereich = document.createRange();
        bereich.selectNodeContents(el);
        bereich.collapse(false);
        const auswahl = window.getSelection();
        auswahl?.removeAllRanges();
        auswahl?.addRange(bereich);
      }
    });

    /* Beim Einfügen kommt reiner Text, keine Auszeichnung — sonst käme
       fremdes HTML über die Zwischenablage in einen Knoten (§19). */
    welt.addEventListener('paste', e => {
      if (!schreibt) return;
      e.preventDefault();
      const roh = e.clipboardData?.getData('text/plain') ?? '';
      if (roh) document.execCommand('insertText', false, roh);
    });
    welt.addEventListener('drop', e => { if (schreibt) e.preventDefault(); });

    welt.addEventListener('focusout', e => {
      if (!schreibt) return;
      const ziel = (e as FocusEvent).relatedTarget as Element | null;
      /* Ein Klick auf die eigene Leiste soll das Schreiben nicht beenden —
         dieselbe Ausnahme wie bei der freien Textmarke (E599). */
      if (ziel && typeof ziel.closest === 'function' && ziel.closest('.gk-leiste')) return;
      schreiberSchliessen(null);
    });

    /* --- Höhe ziehen ------------------------------------------------------ */
    griff.addEventListener('pointerdown', e => {
      e.preventDefault();
      const startY = e.clientY;
      const vonH = buehne.getBoundingClientRect().height;
      const zug = (ev: PointerEvent): void => {
        const neu = Math.max(220, Math.round(vonH + (ev.clientY - startY)));
        buehne.style.height = neu + 'px';
      };
      const aus = (): void => {
        window.removeEventListener('pointermove', zug);
        window.removeEventListener('pointerup', aus);
        Store.updateBlock(block.id, { hoehe: Math.round(buehne.getBoundingClientRect().height) });
      };
      window.addEventListener('pointermove', zug);
      window.addEventListener('pointerup', aus);
    });

    /* Solange der Kasten noch nicht hängt, misst der Browser 0 — dann wäre
       jeder Knoten 0 breit und die ganze Karte läge übereinander. Beim ersten
       echten Anblick wird deshalb neu gezeichnet. */
    if (typeof ResizeObserver !== 'undefined') {
      let hatte = false;
      const beobachter = new ResizeObserver(() => {
        const b = buehne.getBoundingClientRect();
        if (b.width > 4 && !hatte) { hatte = true; male(); }
      });
      beobachter.observe(buehne);
    }

    male();
    standZeigen();
    return w;
  };

  return { zeichne, leseKarte, neueKarte, aufbauen, baum, ausMarkdown, alsMarkdown, PALETTE, farbeVon };
})();

(window as any).Gedankenkarte = Gedankenkarte;
