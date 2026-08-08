/* ============================================================================
 * bereiche/spreadsheet/ansicht.ts — der Tabellenblock, wie man ihn sieht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/spreadsheet/ansicht.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/bereiche/spreadsheet/ansicht.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen;
 * `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Das Rechnen steht in `core/spreadsheet/engine.ts` und weiss nichts von
 * einem Bildschirm. Diese Datei weiss nichts vom Rechnen. Das ist die Regel
 * aus `AUFGABEN.md` A4, und hier ist sie von Anfang an eingehalten statt
 * hinterher hergestellt.
 *
 * Die Gestaltungsentscheidungen stehen in `DESIGN-TABELLE.md`, die Farben
 * und Masse in `quell/schale/stil/tabelle.css`.
 *
 * ─── WARUM NICHT ALLE ZELLEN GEZEICHNET WERDEN ──────────────────────────────
 *
 * Ein Blatt hat 50 × 20 Zellen, das wären tausend Knoten — noch tragbar.
 * Sobald jemand eine CSV mit fünftausend Zeilen einliest, sind es
 * hunderttausend, und der Tab steht. Gezeichnet wird deshalb nur, was zu
 * sehen ist: die Zeilen liegen absolut in einem Platzhalter voller Höhe, und
 * beim Rollen wird neu bestückt.
 *
 * ─── DIE DREI STELLEN, AN DENEN SO ETWAS SCHIEFGEHT ─────────────────────────
 *
 * **1 · Der Rahmen der Auswahl darf das Raster nicht verschieben.** Deshalb
 * liegt er innen (`inset box-shadow`). Ein `border` wäre zwei Pixel breit und
 * die ganze Tabelle zuckte bei jedem Klick.
 *
 * **2 · Beim Neuzeichnen darf die Auswahl nicht verlorengehen.** Sie steht
 * deshalb hier oben und nicht im DOM: das DOM wird weggeworfen und neu
 * gebaut, die Auswahl überlebt es.
 *
 * **3 · Das blosse ÖFFNEN einer Seite darf nichts speichern.** Der erste
 * Entwurf rief nach dem ersten Rechnen `Store.updateBlock` — und damit stand
 * beim reinen Ansehen einer Seite ein neues `edited`-Datum in der Ablage, ein
 * Schritt im Rückgängig-Stapel und ein Schreibvorgang. Beim Abgleich ist das
 * kein Schönheitsfehler: das Gerät, auf dem jemand nur nachgesehen hat, gilt
 * als das neuere und überschreibt die echte Änderung vom anderen. Gespeichert
 * wird deshalb nur, wenn sich der Inhalt wirklich unterscheidet.
 *
 * SPRACHE. Namen englisch, Erklärungen deutsch — E27. Neu, also TypeScript
 * von Anfang an — E28.
 * ==========================================================================*/

const SpreadsheetView = (() => {

  const kern = (): any => (typeof Spreadsheet !== 'undefined') ? Spreadsheet : null;
  const refs = (): any => (typeof CellRefs !== 'undefined') ? CellRefs : null;

  /* Die Zeilenhöhe steht an ZWEI Stellen: hier und als `--tbl-zh` in
     `tabelle.css`. Sie MÜSSEN übereinstimmen — das fensterweise Zeichnen
     rechnet mit dieser Zahl aus, welche Zeilen im Bild sind, und schon zwei
     Pixel Unterschied verschieben die Platzhalter gegen den Inhalt.
     `test137` vergleicht beide Zahlen, statt sich auf diesen Satz zu
     verlassen. */
  const ZH = 32;
  /* 44 und nicht 40. CLAUDE.md §37 nennt 44 px als Mindestmass für alles,
     was mit dem Finger getroffen wird, und eine Zelle wird angetippt, um
     sie auszuwählen. Hier stand 40 mit dem Kommentar „32 px trifft man mit
     dem Finger nicht" — richtig erkannt, nur nicht zu Ende gerechnet.
     Gekostet hat es eine Zeile: 660 px Blockhöhe zeigen jetzt 14 statt 16. */
  const ZH_HANDY = 44;
  const SB = 110;         /* Spaltenbreite, Vorgabe — --tbl-sb */
  const SB_MIN = 48;
  const PUFFER = 6;       /* Zeilen über und unter dem Sichtfenster */

  const amTelefon = (): boolean =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 760px)').matches : false;

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  /* ==========================================================================
   * ANZEIGE EINES WERTES
   * ------------------------------------------------------------------------
   * Was in der Zelle steht, ist nicht immer, was gespeichert ist: eine Zahl
   * bekommt Schweizer Schreibweise, ein Datum ein Format, ein Fehlerwert
   * bleibt wie er ist.
   *
   * Wahrheitswerte heissen WAHR und FALSCH und nicht ✅ und ☐ wie in der
   * Datenbank. In einer Tabelle sind sie ein Wert, mit dem gerechnet wird —
   * ein Kästchen sähe aus wie etwas zum Anklicken.
   * ========================================================================*/
  const zeigeWert = (wert: unknown, format?: any): string => {
    if (wert === null || wert === undefined || wert === '') return '';
    if (typeof wert === 'string' && wert.startsWith('#')) return wert;   /* Fehlerwert */
    if (wert instanceof Date) return wert.toLocaleDateString('de-CH');
    if (typeof wert === 'boolean') return wert ? 'WAHR' : 'FALSCH';
    if (typeof wert === 'number') {
      if (!isFinite(wert)) return '#ZAHL!';
      const art = format && format.art;
      const stellen = format && typeof format.stellen === 'number' ? format.stellen : undefined;
      if (art === 'prozent')
        return (wert * 100).toLocaleString('de-CH', {
          minimumFractionDigits: stellen ?? 0, maximumFractionDigits: stellen ?? 1 }) + ' %';
      if (art === 'waehrung')
        return wert.toLocaleString('de-CH', {
          minimumFractionDigits: stellen ?? 2, maximumFractionDigits: stellen ?? 2 }) +
          ' ' + ((format && format.waehrung) || 'CHF');
      if (stellen !== undefined)
        return wert.toLocaleString('de-CH', {
          minimumFractionDigits: stellen, maximumFractionDigits: stellen });
      return wert.toLocaleString('de-CH', { maximumFractionDigits: 10 });
    }
    return String(wert);
  };

  const istFehler = (wert: unknown): boolean =>
    typeof wert === 'string' && /^#[A-Z/0-9]+[!?]$/.test(wert);

  /* ==========================================================================
   * WAS EIN FEHLERWERT HEISST
   * ------------------------------------------------------------------------
   * `#NAME?` allein ist keine Meldung, sondern ein Rätsel — und zwar eines,
   * das Tabellenprogramme seit dreissig Jahren aufgeben. Die Fusszeile
   * beantwortet die drei Fragen, die eine Meldung beantworten muss: was ist
   * passiert, warum zählt es, was kann ich tun.
   * ========================================================================*/
  const FEHLER_TEXT: Record<string, string> = {
    '#NAME?':  'Diese Funktion kennt Redion nicht. Tippe = und die ersten Buchstaben — ' +
               'dann steht die richtige Schreibweise da.',
    '#BEZUG!': 'Ein Bezug zeigt ins Leere. Meist wurde die Zeile oder Spalte gelöscht, ' +
               'oder zwei Zellen lesen sich im Kreis.',
    '#WERT!':  'Die Formel liess sich nicht lesen. Meist fehlt eine Klammer oder ein ' +
               'Semikolon zwischen zwei Werten.',
    '#ZAHL!':  'Das Ergebnis ist keine Zahl mehr — zu gross, zu klein, oder die Wurzel ' +
               'aus einer negativen Zahl.',
    '#DIV/0!': 'Hier wird durch null geteilt. Meist ist die Zelle im Nenner noch leer — ' +
               'eine leere Zelle zählt als null.'
  };
  const erklaere = (wert: unknown): string =>
    (typeof wert === 'string' && FEHLER_TEXT[wert]) || '';

  /** Drei Striche als Zeichen für die Ausrichtung — ohne fremdes Symbolpaket. */
  const strichIcon = (art: 'links' | 'mitte' | 'rechts'): string => {
    const kurz = art === 'links' ? 'x="1"' : art === 'rechts' ? 'x="5"' : 'x="3"';
    return '<svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true" fill="currentColor">' +
      '<rect x="1" y="1" width="12" height="1.6" rx=".8"/>' +
      '<rect ' + kurz + ' y="5.2" width="8" height="1.6" rx=".8"/>' +
      '<rect x="1" y="9.4" width="12" height="1.6" rx=".8"/></svg>';
  };

  /* ==========================================================================
   * BEDINGTE FORMATIERUNG (L15)
   * --------------------------------------------------------------------------
   * Eine Regel gehört dem BLATT, nicht der Zelle. Der Unterschied ist nicht
   * kosmetisch: eine Farbe an der Zelle müsste bei jeder Änderung mitgeführt,
   * beim Einfügen einer Zeile verschoben und beim Löschen aufgeräumt werden.
   * Eine Regel am Blatt sagt stattdessen, WANN gefärbt wird, und überlebt
   * jede Umstellung der Daten darunter.
   *
   * SIE ÄNDERT DIE DATEN NICHT. Was in `wert` steht, bleibt, was es war —
   * eine bedingte Farbe ist eine Sicht darauf, keine Bearbeitung. Deshalb
   * lässt sie sich abschalten, ohne dass etwas zurückzunehmen wäre.
   *
   * DIE ERSTE REGEL, DIE ZUTRIFFT, GEWINNT — dieselbe Regel wie bei den
   * bedingten Farben der Datenbanken. Zwei Regeln, die dieselbe Zelle
   * einfärben wollen, sind kein Fehler, sondern der Normalfall („über 100
   * grün, über 1000 blau"); es braucht nur eine feste Reihenfolge.
   * ========================================================================*/

  /** Die neun Marken aus dem Farbsystem — dieselben wie in den Datenbanken. */
  const REGELFARBEN: Record<string, string> = {
    rot: 'red', orange: 'orange', gelb: 'yellow', gruen: 'green',
    blau: 'blue', lila: 'purple'
  };

  const REGELARTEN: Array<[string, string]> = [
    ['groesser', 'ist grösser als'],
    ['kleiner', 'ist kleiner als'],
    ['gleich', 'ist gleich'],
    ['zwischen', 'liegt zwischen'],
    ['enthaelt', 'enthält den Text'],
    ['leer', 'ist leer'],
    ['nichtLeer', 'ist nicht leer'],
    ['doppelt', 'kommt mehrfach vor'],
    ['ueberfaellig', 'ist ein Datum in der Vergangenheit'],
    ['faelligBald', 'wird fällig in den nächsten … Tagen'],
    ['skala', 'Farbverlauf klein → gross'],
    ['balken', 'Balken nach Wert'],
    ['symbol', 'Symbol nach Wert']
  ];

  /**
   * Die Symbolsätze. Drei Stufen, immer in der Reihenfolge klein → gross.
   *
   * Warum genau drei und nicht Excels fünf: eine vierte Stufe unterscheidet
   * sich auf einem Telefonbildschirm nicht mehr erkennbar von der dritten,
   * und ein Symbol, das man nicht auseinanderhält, sagt weniger als keines.
   */
  const SYMBOLSAETZE: Record<string, [string, string, string]> = {
    ampel:  ['🔴', '🟡', '🟢'],
    pfeile: ['▼', '▬', '▲'],
    formen: ['◆', '■', '●'],
    noten:  ['✗', '~', '✓']
  };

  /**
   * Ein Datum aus einer Zelle — als ORTSZEIT um Mitternacht.
   *
   * `new Date('2026-08-10')` liest ISO-Daten als UTC. Wer östlich von
   * Greenwich sitzt, bekäme damit den Vortag um zwei Uhr nachts, und
   * „überfällig" spränge einen Tag zu früh an. Deshalb aus den Teilen
   * gebaut, nicht geparst. Dieselbe Rechnung wie in `steuerung.ts`, wo
   * „Nächste Termine" seit jeher `setHours(0,0,0,0)` nimmt.
   */
  const alsDatum = (v: unknown): number => {
    const t = String(v ?? '').trim();
    if (!t) return NaN;
    let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
    if (m) return new Date(+m[1]!, +m[2]! - 1, +m[3]!).getTime();
    m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(t);          /* 10.08.2026 */
    if (m) return new Date(+m[3]!, +m[2]! - 1, +m[1]!).getTime();
    return NaN;
  };

  /** Heute um Mitternacht, in der Zeitzone des Geräts. */
  const heuteUm0 = (): number => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  /* Welche Arten welches Feld brauchen — an EINER Stelle, weil dieselbe
     Liste vorher an drei Stellen stand und beim Dazukommen einer Art an
     zwei davon vergessen worden wäre. */
  const OHNE_WERT  = ['leer', 'nichtLeer', 'doppelt', 'ueberfaellig', 'skala', 'balken'];
  const OHNE_FARBE = ['skala', 'balken', 'symbol'];

  /** Ein Bereich `A1:C20` als Zeilen-/Spaltengrenzen. Leer = ganzes Blatt. */
  const bereichLesen = (text: string, R: any, blatt: any):
      { vonZ: number; bisZ: number; vonS: number; bisS: number } => {
    const ganz = { vonZ: 0, bisZ: (blatt.zeilen || 1) - 1,
                   vonS: 0, bisS: (blatt.spalten || 1) - 1 };
    const t = String(text || '').trim().toUpperCase();
    if (!t || !R) return ganz;
    const teile = t.split(':');
    const a = R.lies(teile[0]);
    const b = teile[1] ? R.lies(teile[1]) : a;
    if (!a || !b) return ganz;
    return {
      vonZ: Math.min(a.zeile, b.zeile), bisZ: Math.max(a.zeile, b.zeile),
      vonS: Math.min(a.spalte, b.spalte), bisS: Math.max(a.spalte, b.spalte)
    };
  };

  const inBereich = (z: number, s: number, g: any): boolean =>
    z >= g.vonZ && z <= g.bisZ && s >= g.vonS && s <= g.bisS;

  const alsZahl = (v: unknown): number => {
    if (typeof v === 'number') return v;
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isFinite(n) ? n : NaN;
  };

  /**
   * Was in einem Bereich steht — einmal je Regel gerechnet, nicht je Zelle.
   *
   * `skala` und `balken` brauchen das kleinste und grösste, `doppelt` die
   * Häufigkeiten. Ohne diesen Schritt liefe je Zelle eine Schleife über den
   * ganzen Bereich: bei 1000 × 26 wären das 26 Millionen Vergleiche für
   * eine Farbe.
   */
  const bereichsWerte = (g: any, blatt: any, R: any) => {
    let min = Infinity, max = -Infinity;
    const wieOft = new Map<string, number>();
    for (let z = g.vonZ; z <= g.bisZ; z++) {
      for (let s = g.vonS; s <= g.bisS; s++) {
        const zelle = blatt.zellen[R.schreibe(z, s)];
        const v = zelle ? zelle.wert : '';
        if (v === '' || v == null) continue;
        const n = alsZahl(v);
        if (isFinite(n)) { if (n < min) min = n; if (n > max) max = n; }
        const k = String(v);
        wieOft.set(k, (wieOft.get(k) || 0) + 1);
      }
    }
    return { min, max, wieOft };
  };

  /** Trifft eine Vergleichsregel auf einen Wert zu? */
  const regelTrifft = (regel: any, wert: unknown, hilf: any): boolean => {
    const leer = wert === '' || wert == null;
    switch (regel.art) {
      case 'leer':      return leer;
      case 'nichtLeer': return !leer;
      case 'doppelt':   return !leer && (hilf.wieOft.get(String(wert)) || 0) > 1;
      case 'enthaelt':  return !leer && String(wert).toLowerCase()
                                 .includes(String(regel.wert ?? '').toLowerCase());
      case 'gleich': {
        if (leer) return false;
        const a = alsZahl(wert), b = alsZahl(regel.wert);
        if (isFinite(a) && isFinite(b)) return a === b;
        return String(wert).toLowerCase() === String(regel.wert ?? '').toLowerCase();
      }
      case 'groesser': { const a = alsZahl(wert); return isFinite(a) && a > alsZahl(regel.wert); }
      case 'kleiner':  { const a = alsZahl(wert); return isFinite(a) && a < alsZahl(regel.wert); }
      case 'zwischen': {
        const a = alsZahl(wert);
        const u = alsZahl(regel.wert), o = alsZahl(regel.wert2);
        return isFinite(a) && isFinite(u) && isFinite(o) &&
               a >= Math.min(u, o) && a <= Math.max(u, o);
      }
      /* Was kein Datum ist, ist nicht überfällig — sondern gar nichts.
         Die Zahl 5 in einer Datumsspalte darf nicht rot werden, nur weil
         sie kleiner ist als irgendetwas. */
      case 'ueberfaellig': {
        const d = alsDatum(wert);
        return isFinite(d) && d < heuteUm0();
      }
      case 'faelligBald': {
        const d = alsDatum(wert);
        if (!isFinite(d)) return false;
        const tage = alsZahl(regel.wert);
        const spanne = isFinite(tage) && tage > 0 ? tage : 7;
        const heute = heuteUm0();
        /* Heute zählt mit, gestern nicht — das ist `ueberfaellig`. */
        return d >= heute && d <= heute + spanne * 86400000;
      }
      default: return false;
    }
  };

  /**
   * Welche der drei Stufen? Gibt 0, 1 oder 2 zurück — oder -1 für „kein Wert".
   *
   * Ohne eigene Grenzen wird der Bereich gedrittelt. Mit `wert`/`wert2`
   * gelten die als Grenzen, und dann zählt nur, was der Mensch eingetragen
   * hat: bei „Ampel ab 50 und ab 80" soll die 79 gelb sein, egal ob im
   * Blatt zufällig eine 900 steht.
   */
  const symbolStufe = (regel: any, wert: unknown, hilf: any): number => {
    const n = alsZahl(wert);
    if (!isFinite(n)) return -1;
    const u = alsZahl(regel.wert), o = alsZahl(regel.wert2);
    let stufe: number;
    if (isFinite(u) && isFinite(o)) {
      const klein = Math.min(u, o), gross = Math.max(u, o);
      stufe = n < klein ? 0 : n < gross ? 1 : 2;
    } else {
      if (!isFinite(hilf.min) || !isFinite(hilf.max)) return -1;
      const spanne = hilf.max - hilf.min;
      const t = spanne === 0 ? 1 : (n - hilf.min) / spanne;
      stufe = t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2;
    }
    /* „Tage überfällig" ist ein Wert, bei dem klein gut ist. Ohne diesen
       Schalter müsste man den Symbolsatz rückwärts lesen. */
    return regel.umgekehrt ? 2 - stufe : stufe;
  };

  /**
   * Was eine Zelle an Aussehen bekommt — Klasse und/oder Inline-Stil.
   *
   * Gibt `null` zurück, wenn keine Regel greift. Der Inline-Stil ist hier
   * die richtige Wahl und nicht der Ausnahmefall: die Farbe hängt vom WERT
   * ab, es gäbe also eine Klasse je möglichem Wert.
   */
  const regelAussehen = (z: number, s: number, wert: unknown, vorbereitet: any[]):
      { klasse?: string; stil?: string } | null => {
    for (const v of vorbereitet) {
      if (!inBereich(z, s, v.g)) continue;
      const leer = wert === '' || wert == null;

      if (v.regel.art === 'skala' || v.regel.art === 'balken') {
        if (leer) continue;
        const n = alsZahl(wert);
        if (!isFinite(n) || !isFinite(v.hilf.min) || !isFinite(v.hilf.max)) continue;
        /* DER BALKEN MISST VON NULL, die Skala von klein nach gross — und
           das ist kein Versehen, sondern der Unterschied zwischen den
           beiden.

           Ein Balken zeigt eine GRÖSSE. Bei 340, 890, 1200, 2400, 3100
           wäre der kleinste Wert mit einer Skala von min bis max null
           Pixel lang, und 340 sähe aus wie „nichts" — dabei ist es ein
           Neuntel des grössten. Genau so lügen Diagramme mit
           abgeschnittener Achse. Gesehen am Bildschirmfoto vom 8. August,
           nicht im Quelltext.

           `Math.min(0, …)` hält den Fall mit negativen Zahlen offen: dann
           beginnt der Balken wieder unten, weil es sonst keinen ehrlichen
           Nullpunkt gäbe.

           Eine SKALA zeigt dagegen einen PLATZ in einer Reihe — dort ist
           der kleinste Wert zu Recht am einen Ende. */
        const unten = v.regel.art === 'balken' ? Math.min(0, v.hilf.min) : v.hilf.min;
        const oben  = v.regel.art === 'balken' ? Math.max(0, v.hilf.max) : v.hilf.max;
        const spanne = oben - unten;
        const t = spanne === 0 ? 1 : (n - unten) / spanne;
        if (v.regel.art === 'skala') {
          /* Von Rot (0°) über Gelb (55°) nach Grün (135°) — dieselbe
             Farbfolge wie die Heatmap der Datenbanken, damit dasselbe
             Bild dasselbe bedeutet. */
          const ton = Math.round(t * 135);
          return { klasse: ' regel-skala',
                   stil: `background:hsl(${ton} 62% 42% / .5)` };
        }
        const p = Math.round(Math.max(0, Math.min(1, t)) * 100);
        /* Der Balken liegt HINTER dem Text, nicht daneben: eine Spalte
           ist selten breit genug für beides, und die Zahl ist wichtiger
           als ihr Bild. */
        return { klasse: ' regel-balken',
                 stil: `--regel-balken:${p}%` };
      }

      /* Ein Symbol färbt nicht, es stellt sich davor. Deshalb steht es
         nicht bei den Vergleichsregeln: es trifft nicht zu oder nicht zu,
         es sagt bei jedem Wert etwas. */
      if (v.regel.art === 'symbol') {
        if (leer) continue;
        const stufe = symbolStufe(v.regel, wert, v.hilf);
        if (stufe < 0) continue;
        const satz = SYMBOLSAETZE[v.regel.satz || 'ampel'] || SYMBOLSAETZE['ampel']!;
        /* Über eine CSS-Eigenschaft, nicht über den Zellinhalt: `wert`
           bleibt damit unangetastet, und beim Kopieren nach Excel geht
           kein Emoji als Text mit. */
        return { klasse: ' regel-symbol',
                 stil: `--regel-symbol:'${satz[stufe] ?? ''}'` };
      }

      if (regelTrifft(v.regel, wert, v.hilf)) {
        const marke = REGELFARBEN[v.regel.farbe || 'gelb'] || 'yellow';
        return { klasse: ' regel-farbe bg-' + marke };
      }
    }
    return null;
  };

  /* ==========================================================================
   * DER BLOCK
   * ========================================================================*/
  const zeichne = (block: any): HTMLElement => {
    const K = kern(), R = refs();

    const w = document.createElement('div');
    w.className = 'tbl';

    if (!K || !R) {
      w.textContent = 'Der Tabellenkern ist nicht geladen.';
      return w;
    }

    /* --- Die Daten ------------------------------------------------------
       Ein Block ohne Mappe bekommt eine. Nichts wird überschrieben: gibt es
       schon eine, wird sie benutzt, wie sie ist. */
    const hatteMappe = !!(block.mappe && block.mappe.blaetter && block.mappe.blaetter.length);
    if (!hatteMappe) block.mappe = K.neueMappe(block.text || 'Tabelle');

    /* WELCHES BLATT GERADE OFFEN IST, steht in der Mappe und nicht hier —
       so überlebt es das Neuzeichnen und den Neustart. Zeigt `aktiv` auf ein
       Blatt, das es nicht mehr gibt, wird es das erste: eine Mappe ohne
       sichtbares Blatt wäre eine leere Fläche ohne Erklärung. */
    let blatt: any = block.mappe.blaetter.find((b: any) => b.id === block.mappe.aktiv)
                     || block.mappe.blaetter[0];
    block.mappe.aktiv = blatt.id;
    if (!blatt.breiten) blatt.breiten = {};

    /* Die Auswahl lebt hier, nicht im DOM — sie überlebt jedes Neuzeichnen. */
    let gewaehlt = 'A1';
    let anker = 'A1';                   /* für die Bereichsauswahl */
    /* Beim Ziehen am Anfasser: wohin der Zeiger gerade zeigt. Nur das —
       ob überhaupt gezogen wird, steht in den Zuhörern, die `beimZiehen`
       auf- und wieder abbaut, und nicht noch einmal in einer Fahne hier. */
    let fuellZiel: { z: number; s: number } | null = null;
    let zirkel: string[] = [];

    /* ----------------------------------------------------------------------
     * WIE BREIT EINE SPALTE AM TELEFON SEIN MUSS — gemessen, nicht geschätzt.
     *
     * `redion-mobile-ux` nennt zwei Zahlen, und zusammen ergeben sie eine
     * dritte: mindestens 88 px breit, und mindestens 16 px Schrift. Bei
     * 16 px ist `1’450.00 CHF` neunundneunzig Pixel breit, dazu zweimal
     * sieben Pixel Innenabstand und eine Linie — macht 114. In eine 110 px
     * breite Spalte passt das nicht, und der Block tat genau das Richtige:
     * er schrieb `###`.
     *
     * Auf dem Bildschirm hiess das: in einem Haushaltsplan stand bei JEDEM
     * Betrag `###`. Die Regel war richtig, die Spalte zu schmal.
     *
     * Also 128 px am Telefon statt 110, und die Untergrenze 112 statt 88 —
     * 88 stammt aus einer Welt mit kleinerer Schrift. Die Folge ist, dass
     * zweieinhalb Spalten ins Bild passen statt drei. Das ist richtig so:
     * waagerecht rollen ist am Telefon vorgesehen, `###` nicht.
     * --------------------------------------------------------------------*/
    const handy = amTelefon();
    const vorgabeBreite = handy ? 128 : SB;
    const minBreite = handy ? 112 : SB_MIN;
    const breiteVon = (s: number): number =>
      Math.max(minBreite, Number(blatt.breiten[s]) || vorgabeBreite);

    const zh = handy ? ZH_HANDY : ZH;

    /* ======================================================================
     * SPEICHERN — und zwar nur, wenn es etwas zu speichern gibt
     * --------------------------------------------------------------------
     * Siehe Punkt 3 im Kopf. `geaendert` steht bewusst NICHT im Vergleich:
     * sonst unterschiede sich der Stand bei jedem Rechnen von sich selbst,
     * und die Prüfung wäre keine.
     * ====================================================================*/
    /* Verglichen wird die GANZE Mappe. Mit einem Blatt allein bliebe eine
       Änderung auf einem anderen Blatt ungespeichert — und zwar genau die,
       die eine blattübergreifende Formel gerade ausgelöst hat. */
    const standVon = (): string => JSON.stringify(block.mappe.blaetter);
    let letzterStand = hatteMappe ? standVon() : '';

    const sichere = (): boolean => {
      const jetzt = standVon();
      if (jetzt === letzterStand) return false;
      letzterStand = jetzt;
      block.mappe.geaendert = new Date().toISOString();
      if (typeof Store !== 'undefined' && Store.updateBlock)
        Store.updateBlock(block.id, { mappe: block.mappe });
      return true;
    };

    /* --- Bearbeitungszeile ---------------------------------------------- */
    const kopf = document.createElement('div');
    kopf.className = 'tbl-kopf';
    const adresse = document.createElement('div');
    adresse.className = 'tbl-adresse';
    const fx = document.createElement('div');
    fx.className = 'tbl-fx';
    fx.textContent = 'fx';
    /* IN WELCHER FORMELWELT MAN STEHT. Redion hat zwei: die der Datenbank
       (`prop("Preis") * 1.081`) und die der Tabelle (`=B2*1,081`). Beide
       laufen durch dieselbe Maschine, sehen aber verschieden aus — und wer
       das nicht weiss, tippt hier die falsche und versteht die Meldung
       nicht. Ein Wort im Titel kostet nichts und beantwortet es. */
    fx.title = 'Tabellenformel — beginnt mit =, Zellen heissen A1, Bereiche A1:A9';
    const eingabe = document.createElement('input');
    eingabe.className = 'tbl-eingabe';
    eingabe.setAttribute('aria-label', 'Inhalt der ausgewählten Zelle');
    eingabe.placeholder = 'Wert oder =Formel';
    const werkzeuge = document.createElement('div');
    werkzeuge.className = 'tbl-werkzeuge';
    /* ------------------------------------------------------------------
     * ELF KNÖPFE AM RECHNER, ZWEI AM TELEFON.
     *
     * Gemessen, nicht geschätzt: 48 px Adresse + 30 px fx + elf Knöpfe zu
     * 34 px sind über 410 px. Auf einem iPhone mit 390 px hiess das
     * zweierlei, und beides war schlimm — das Eingabefeld wurde auf null
     * Pixel gequetscht, und die letzten Knöpfe standen ausserhalb des
     * Bildes. Darunter der ⋯-Knopf, also der ganze Weg zu „Als Excel
     * speichern". Eine Funktion, die man am Telefon nicht erreicht, gibt es
     * am Telefon nicht.
     *
     * Die Lösung ist nicht, dieselben elf Knöpfe kleiner zu machen — 38 px
     * sind unter den 44, die ein Finger braucht. Sondern: **Format** öffnet
     * ein Blatt von unten mit allem, was gestaltet, und **⋯** den Rest. Zwei
     * grosse Ziele statt elf kleiner.
     * ----------------------------------------------------------------*/
    const AUSRICHTUNG =
      '<button data-a="links" title="Linksbündig" aria-label="Linksbündig">' + strichIcon('links') + '</button>' +
      '<button data-a="mitte" title="Zentriert" aria-label="Zentriert">' + strichIcon('mitte') + '</button>' +
      '<button data-a="rechts" title="Rechtsbündig" aria-label="Rechtsbündig">' + strichIcon('rechts') + '</button>';

    werkzeuge.innerHTML = handy
      ? '<button data-a="format" title="Format" aria-label="Format">Format</button>' +
        '<button data-a="mehr" title="Mehr" aria-label="Weitere Befehle">⋯</button>'
      : '<button data-a="fett" title="Fett" aria-label="Fett"><b>F</b></button>' +
        '<button data-a="kursiv" title="Kursiv" aria-label="Kursiv"><i>K</i></button>' +
        /* DREI STRICHE STATT ⟨ ≡ ⟩. Die Klammern sahen auf dem Bildschirm aus
           wie „(" und „)" — ein Knopf, dessen Bedeutung man raten muss, ist
           keiner. Drei Linien unterschiedlicher Länge sind das Zeichen für
           Ausrichtung in jedem Programm, das es gibt. */
        AUSRICHTUNG +
        '<button data-a="waehrung" title="Währung" aria-label="Währung">CHF</button>' +
        '<button data-a="prozent" title="Prozent" aria-label="Prozent">%</button>' +
        '<button data-a="zeile" title="Zeile anhängen" aria-label="Zeile anhängen">+↓</button>' +
        '<button data-a="spalte" title="Spalte anhängen" aria-label="Spalte anhängen">+→</button>' +
        '<button data-a="mehr" title="Mehr" aria-label="Weitere Befehle">⋯</button>';
    kopf.append(adresse, fx, eingabe, werkzeuge);

    /* --- Rollfeld -------------------------------------------------------- */
    const feld = document.createElement('div');
    feld.className = 'tbl-feld';
    feld.tabIndex = 0;
    feld.setAttribute('role', 'grid');
    feld.setAttribute('aria-label', 'Tabelle ' + (blatt.name || ''));

    const spaltenKopf = document.createElement('div');
    spaltenKopf.className = 'tbl-spalten';
    const koerper = document.createElement('div');
    koerper.className = 'tbl-koerper';
    feld.append(spaltenKopf, koerper);

    /* Die weiche Kante rechts, wo die Tabelle über den Bildrand hinausgeht.
       Am Telefon stand `1'450.00 CHF` dort als `1'45` — eine gültige Zahl,
       nur eine andere. Siehe `kern/helfer/rollrand.ts`. */
    if (typeof Rollrand !== 'undefined') Rollrand.binde(feld);

    const fuss = document.createElement('div');
    fuss.className = 'tbl-fuss';

    /* ======================================================================
     * DIE BLATTREITER
     * --------------------------------------------------------------------
     * Unten, wie in jedem Tabellenprogramm. Oben wären sie über der
     * Bearbeitungszeile und damit über dem, was man liest; unten sind sie
     * dort, wo man sie sucht — und am Telefon in Daumenreichweite.
     * ====================================================================*/
    const reiter = document.createElement('div');
    reiter.className = 'tbl-reiter';
    reiter.setAttribute('role', 'tablist');
    reiter.setAttribute('aria-label', 'Blätter');

    w.append(kopf, feld, reiter, fuss);

    /* ======================================================================
     * ZEICHNEN
     * ====================================================================*/
    const bereich = (): { vonZ: number; bisZ: number; vonS: number; bisS: number } | null => {
      const a = R.lies(anker), b = R.lies(gewaehlt);
      if (!a || !b) return null;
      return {
        vonZ: Math.min(a.zeile, b.zeile), bisZ: Math.max(a.zeile, b.zeile),
        vonS: Math.min(a.spalte, b.spalte), bisS: Math.max(a.spalte, b.spalte)
      };
    };

    /* Was der Anfasser gerade überstreicht — die Vorschau beim Ziehen. */
    const fuellBereich = (): { vonZ: number; bisZ: number; vonS: number; bisS: number } | null => {
      const b = bereich();
      if (!b || !fuellZiel) return null;
      if (fuellZiel.z > b.bisZ) return { vonZ: b.bisZ + 1, bisZ: fuellZiel.z, vonS: b.vonS, bisS: b.bisS };
      if (fuellZiel.s > b.bisS) return { vonZ: b.vonZ, bisZ: b.bisZ, vonS: b.bisS + 1, bisS: fuellZiel.s };
      return null;
    };

    const spaltenZeichnen = (): void => {
      const b = bereich();
      spaltenKopf.innerHTML = '';
      const ecke = document.createElement('div');
      ecke.className = 'tbl-ecke';
      ecke.title = 'Alles auswählen';
      spaltenKopf.appendChild(ecke);
      for (let s = 0; s < blatt.spalten; s++) {
        const d = document.createElement('div');
        d.className = 'tbl-sp' + (b && s >= b.vonS && s <= b.bisS ? ' aktiv' : '');
        d.style.flex = '0 0 ' + breiteVon(s) + 'px';
        d.dataset.s = String(s);
        d.textContent = R.spalteZuText(s);
        /* Der Griff zum Breiterziehen — 6 px am rechten Rand. */
        const griff = document.createElement('span');
        griff.className = 'tbl-griff';
        griff.dataset.griff = String(s);
        d.appendChild(griff);
        spaltenKopf.appendChild(d);
      }
    };

    /* Nur das Sichtbare. Der Platzhalter trägt die volle Höhe, damit die
       Rolleiste stimmt. */
    const koerperZeichnen = (): void => {
      koerper.style.height = (blatt.zeilen * zh) + 'px';
      const oben = Math.max(0, Math.floor(feld.scrollTop / zh) - PUFFER);
      const sichtbar = Math.ceil(feld.clientHeight / zh) + PUFFER * 2;
      const unten = Math.min(blatt.zeilen, oben + sichtbar);
      const b = bereich();
      const fb = fuellBereich();

      /* Die Regeln EINMAL je Zeichnung vorbereiten, nicht je Zelle. Bei
         1000 × 26 Zellen wäre das sonst eine Schleife über den ganzen
         Bereich pro Zelle — Millionen Vergleiche für eine Farbe. */
      const regeln = (blatt.regeln || []).filter((r: any) => r && r.an !== false);
      const vorbereitet = regeln.map((regel: any) => {
        const g = bereichLesen(regel.bereich, R, blatt);
        return { regel, g, hilf: bereichsWerte(g, blatt, R) };
      });

      koerper.innerHTML = '';
      for (let z = oben; z < unten; z++) {
        const zeile = document.createElement('div');
        zeile.className = 'tbl-zeile';
        zeile.style.top = (z * zh) + 'px';

        const nr = document.createElement('div');
        nr.className = 'tbl-zn' + (b && z >= b.vonZ && z <= b.bisZ ? ' aktiv' : '');
        nr.dataset.z = String(z);
        nr.textContent = String(z + 1);
        zeile.appendChild(nr);

        for (let s = 0; s < blatt.spalten; s++) {
          const a = R.schreibe(z, s);
          const zelle = blatt.zellen[a];
          const wert = zelle ? zelle.wert : '';
          const stil = (zelle && zelle.stil) || {};
          const d = document.createElement('div');

          const klassen = ['tbl-z'];
          const imB = !!(b && z >= b.vonZ && z <= b.bisZ && s >= b.vonS && s <= b.bisS);
          /* Der Anfasser sitzt an der letzten Zelle des Bereichs, nicht an
             der aktiven — sonst zöge man von der falschen Ecke. */
          const istEcke = !!(b && z === b.bisZ && s === b.bisS);
          if (a === gewaehlt) klassen.push('gewaehlt');
          else if (imB) klassen.push('imBereich');
          if (istEcke) klassen.push('ecke');
          if (fb && z >= fb.vonZ && z <= fb.bisZ && s >= fb.vonS && s <= fb.bisS)
            klassen.push('fuellvorschau');
          if (zelle && zelle.formel) klassen.push('formel');
          if (istFehler(wert)) klassen.push('fehler');
          else if (typeof wert === 'number') klassen.push('zahl');
          if (stil.fett) klassen.push('fett');
          if (stil.kursiv) klassen.push('kursiv');
          if (stil.ausrichtung) klassen.push(stil.ausrichtung);
          d.className = klassen.join(' ');
          d.style.flex = '0 0 ' + breiteVon(s) + 'px';

          /* Die bedingte Farbe kommt VOR der Auswahl und dem Fehlerzustand
             in die Klassenliste, aber NACH ihnen im Stilblatt: eine
             gewählte Zelle muss gewählt aussehen, auch wenn eine Regel sie
             färbt. Sonst verliert man beim Malen die Stelle, an der man
             gerade steht. */
          if (vorbereitet.length) {
            const aus = regelAussehen(z, s, wert, vorbereitet);
            if (aus) {
              if (aus.klasse) d.className += aus.klasse;
              if (aus.stil) d.style.cssText += ';' + aus.stil;
            }
          }

          const voll = zeigeWert(wert, stil.format);
          const passend = passendMachen(voll, wert, s, stil);
          if (passend.klasse) d.className += passend.klasse;
          if (passend.titel) d.title = passend.titel;

          d.dataset.a = a;
          d.setAttribute('role', 'gridcell');
          /* Vorgelesen wird IMMER der volle Wert — die Kürzung ist eine
             Sache des Platzes auf dem Bildschirm, nicht des Inhalts. */
          d.setAttribute('aria-label', a + (wert === '' ? ' leer' : ': ' + voll));
          d.textContent = passend.text;
          zeile.appendChild(d);
        }
        koerper.appendChild(zeile);
      }
    };

    /* ----------------------------------------------------------------------
     * ### STATT EINER FALSCHEN ZAHL
     * ----------------------------------------------------------------------
     * DER GEFÄHRLICHSTE FEHLER, DEN DIESER BLOCK HATTE — und er sah aus wie
     * ein Schönheitsfehler. Eine Zahl steht rechtsbündig; passt sie nicht in
     * die Spalte, schneidet der Browser sie VORNE ab. Aus `634.2166666667`
     * wurde auf dem Bildschirm `34.2166666667`, und das ist keine
     * abgeschnittene Zahl mehr, sondern **eine andere Zahl**. Sie sieht
     * vollständig aus, sie ist plausibel, und niemand rechnet nach.
     *
     * Excel macht seit dreissig Jahren `####` daraus, und zwar genau
     * deswegen. Lieber sichtbar nichts zeigen als unsichtbar etwas Falsches.
     *
     * Gemessen wird in EINEM Durchgang nach dem Bauen: erst alle Knoten
     * setzen, dann alle lesen. Abwechselnd schreiben und messen zwänge den
     * Browser zu einem Umbruch je Zelle.
     * --------------------------------------------------------------------*/
    /* ----------------------------------------------------------------------
     * PASST DIE ZAHL IN DIE SPALTE?
     * ----------------------------------------------------------------------
     * DER GEFÄHRLICHSTE FEHLER, DEN DIESER BLOCK HATTE — und er sah aus wie
     * ein Schönheitsfehler. Eine Zahl steht rechtsbündig; passt sie nicht in
     * die Spalte, schneidet der Browser sie VORNE ab. Aus `634.2166666667`
     * wurde auf dem Bildschirm `34.2166666667`, und das ist keine
     * abgeschnittene Zahl mehr, sondern **eine andere Zahl**. Sie sieht
     * vollständig aus, sie ist plausibel, und niemand rechnet nach.
     *
     * ─── DER ERSTE VERSUCH MASS DAS FALSCHE ────────────────────────────────
     *
     * Er verglich `scrollWidth` mit `clientWidth`. Gemessen ergab das für
     * eine 21-stellige Zahl in einer 109 px breiten Zelle: 109 gegen 109.
     * Der Grund ist Flexbox — der Text ist ein anonymes Flex-Element und
     * wird GESTAUCHT statt überzustehen. Es gibt also gar keinen
     * überstehenden Inhalt zu messen; abgeschnitten wird trotzdem.
     *
     * Eine Prüfung, die immer „passt schon" sagt, ist keine Prüfung.
     *
     * ─── JETZT WIRD DIE SCHRIFT GEMESSEN ───────────────────────────────────
     *
     * Über eine Leinwand: `measureText` braucht kein DOM, erzwingt keinen
     * Umbruch und kostet nichts. Und es geschieht BEIM BAUEN der Zelle statt
     * hinterher — kein zweiter Durchgang, kein Zurücklesen des Layouts.
     *
     * Passt die Zahl nicht, wird sie erst KÜRZER GESCHRIEBEN, nicht sofort
     * verworfen: `98.1166666667` ist keine Zahl, die nicht passt, sondern
     * eine, die zu genau dasteht. Erst wenn nicht einmal die Vorkommastellen
     * hineingehen, steht `###` da — so wie in Excel, und aus demselben
     * Grund: der Mensch will die Grössenordnung sehen.
     * --------------------------------------------------------------------*/
    const STUFEN = [6, 4, 2, 1, 0];
    let messer: CanvasRenderingContext2D | null = null;
    let schriftBasis = '14px sans-serif';

    /* Die Kurzschreibweise von CSS verlangt diese Reihenfolge: Stil, Gewicht,
       Grösse, Familie. Anders herum nimmt die Leinwand die Angabe nicht an
       und misst still mit der Vorgabeschrift weiter. */
    const schriftFuer = (stil: any): string =>
      ((stil && stil.kursiv) ? 'italic ' : '') +
      ((stil && stil.fett) ? '700 ' : '') + schriftBasis;

    const breiteDesTextes = (text: string, stil: any): number => {
      if (!messer) {
        const leinwand = document.createElement('canvas');
        messer = leinwand.getContext('2d');
      }
      if (!messer) return 0;
      messer.font = schriftFuer(stil);
      return messer.measureText(text).width;
    };

    /**
     * Der Text, der wirklich in der Zelle stehen darf.
     * Gibt zusätzlich zurück, ob gekürzt oder ganz aufgegeben wurde.
     */
    const passendMachen = (
      text: string, wert: unknown, spalte: number, stil: any
    ): { text: string; klasse: string; titel: string } => {
      const platz = breiteVon(spalte) - 15;      /* 2 × 7 px Innenabstand + Linie */
      /* Zwei Pixel Luft: `measureText` kennt `tabular-nums` nicht und liegt
         um Haaresbreite daneben. Lieber einmal zu viel anzeigen als eine
         Zahl grundlos verstümmeln. */
      if (typeof wert !== 'number' || breiteDesTextes(text, stil) <= platz + 2)
        return { text, klasse: '', titel: '' };

      const voll = text;
      if (!(stil && stil.format && stil.format.art)) {
        for (const stellen of STUFEN) {
          const kurz = (wert as number).toLocaleString('de-CH', {
            minimumFractionDigits: 0, maximumFractionDigits: stellen });
          if (breiteDesTextes(kurz, stil) <= platz + 2)
            return { text: kurz, klasse: ' gekuerzt', titel: voll };
        }
      }
      return { text: '###', klasse: ' zuEng',
               titel: voll + ' — die Spalte ist zu schmal. Ziehe sie breiter.' };
    };

    const fussZeichnen = (): void => {
      const b = bereich();
      let zahlen = 0, summe = 0, kleinste = Infinity, groesste = -Infinity;
      if (b) {
        for (let z = b.vonZ; z <= b.bisZ; z++)
          for (let s = b.vonS; s <= b.bisS; s++) {
            const zelle = blatt.zellen[R.schreibe(z, s)];
            if (zelle && typeof zelle.wert === 'number' && isFinite(zelle.wert)) {
              zahlen++; summe += zelle.wert;
              if (zelle.wert < kleinste) kleinste = zelle.wert;
              if (zelle.wert > groesste) groesste = zelle.wert;
            }
          }
      }
      const gefuellt = Object.keys(blatt.zellen).length;
      fuss.innerHTML = '';
      const teil = (text: string, klasse = ''): void => {
        const s = document.createElement('span');
        if (klasse) s.className = klasse;
        s.innerHTML = text;
        fuss.appendChild(s);
      };

      /* DER LEERE ZUSTAND. Ein Raster ohne einen Wert erklärt sich nicht von
         selbst — wer noch nie eine Formel getippt hat, weiss nicht, dass sie
         mit `=` anfängt. Das steht leise in der Fusszeile und nicht als
         Kasten über dem Raster: ein Kasten müsste weggeklickt werden, und
         beim zweiten Mal ist er nur noch im Weg. */
      if (!gefuellt) {
        teil('Tippe einen Wert — oder <code>=SUMME(A1:A5)</code> für eine Formel.', 'tbl-tipp');
        return;
      }

      const feldNamen = b && (b.vonZ !== b.bisZ || b.vonS !== b.bisS)
        ? R.schreibe(b.vonZ, b.vonS) + ':' + R.schreibe(b.bisZ, b.bisS) : gewaehlt;
      teil('<b>' + esc(feldNamen) + '</b>');
      if (zahlen > 1) {
        teil('Summe <b>' + esc(zeigeWert(summe)) + '</b>');
        teil('Mittel <b>' + esc(zeigeWert(Math.round((summe / zahlen) * 1000) / 1000)) + '</b>');
        teil('Kleinste <b>' + esc(zeigeWert(kleinste)) + '</b>');
        teil('Grösste <b>' + esc(zeigeWert(groesste)) + '</b>');
        teil('Anzahl <b>' + zahlen + '</b>');
      }
      teil(gefuellt + ' gefüllt');

      /* Steht in der gewählten Zelle ein Fehlerwert, sagt die Fusszeile, was
         er heisst. Ohne das steht dort `#NAME?` und sonst nichts. */
      const aktiv = blatt.zellen[gewaehlt];
      const erklaerung = erklaere(aktiv && aktiv.wert);
      if (erklaerung)
        teil('<b>' + esc(aktiv.wert) + '</b> ' + esc(erklaerung), 'tbl-erklaerung');

      if (zirkel.length)
        teil('Zirkelbezug: ' + esc(zirkel.slice(0, 6).join(', ')) +
             (zirkel.length > 6 ? ' …' : ''), 'tbl-warnung');
    };

    const kopfZeichnen = (): void => {
      adresse.textContent = gewaehlt;
      if (document.activeElement !== eingabe)
        eingabe.value = K.eingabe(blatt, gewaehlt);
      const zelle = blatt.zellen[gewaehlt];
      const stil = (zelle && zelle.stil) || {};
      werkzeuge.querySelectorAll('button').forEach((b) => {
        const a = (b as HTMLElement).dataset.a || '';
        const an = (a === 'fett' && stil.fett) || (a === 'kursiv' && stil.kursiv) ||
                   (a === stil.ausrichtung) ||
                   (a === 'waehrung' && stil.format && stil.format.art === 'waehrung') ||
                   (a === 'prozent' && stil.format && stil.format.art === 'prozent');
        b.classList.toggle('on', !!an);
      });
    };

    /* ----------------------------------------------------------------------
     * DIE REITER ZEICHNEN
     * --------------------------------------------------------------------
     * Bei EINEM Blatt bleiben sie unsichtbar. Ein einzelner Reiter über
     * einer einzelnen Tabelle erklärt nichts und kostet eine Zeile Höhe in
     * jedem Block, den jemals jemand angelegt hat.
     * ------------------------------------------------------------------*/
    const reiterZeichnen = (): void => {
      const viele = block.mappe.blaetter.length > 1;
      reiter.classList.toggle('einzeln', !viele);
      reiter.innerHTML = '';

      block.mappe.blaetter.forEach((b: any) => {
        const r = document.createElement('button');
        r.className = 'tbl-reiter-eins' + (b.id === blatt.id ? ' aktiv' : '');
        r.dataset.blatt = b.id;
        r.setAttribute('role', 'tab');
        r.setAttribute('aria-selected', b.id === blatt.id ? 'true' : 'false');
        r.textContent = b.name || 'Ohne Namen';
        r.title = viele ? b.name + ' — Doppelklick zum Umbenennen' : b.name;
        reiter.appendChild(r);
      });

      const plus = document.createElement('button');
      plus.className = 'tbl-reiter-plus';
      plus.dataset.a = 'neu';
      plus.textContent = '+';
      plus.title = 'Neues Blatt';
      plus.setAttribute('aria-label', 'Neues Blatt');
      reiter.appendChild(plus);
    };

    const zuBlatt = (id: string): void => {
      const neu = block.mappe.blaetter.find((b: any) => b.id === id);
      if (!neu || neu.id === blatt.id) return;
      blatt = neu;
      if (!blatt.breiten) blatt.breiten = {};
      block.mappe.aktiv = blatt.id;
      /* Die Auswahl gehört zum Blatt, nicht zur Mappe — beim Wechseln fängt
         sie oben links an, wie in jedem Tabellenprogramm. */
      gewaehlt = anker = 'A1';
      feld.scrollTop = 0;
      sichere();
      alles();
    };

    const alles = (): void => {
      spaltenZeichnen(); koerperZeichnen(); fussZeichnen(); kopfZeichnen(); reiterZeichnen();
    };

    const rechneUndZeichne = (): void => {
      /* Die MAPPE rechnen, nicht das Blatt: `Januar!A1` darf auf
         `Februar!B2` zeigen, und ein Kreis über zwei Blätter fiele beim
         blattweisen Rechnen gar nicht auf. */
      const erg = K.rechneMappe(block.mappe);
      zirkel = erg.zirkel || [];
      sichere();
      alles();
    };

    /* ======================================================================
     * DAS FENSTER FÜR DIE BEDINGTE FORMATIERUNG (L15)
     * ----------------------------------------------------------------------
     * Eine Liste und ein Formular darunter. Kein Assistent in drei Schritten:
     * eine Regel ist ein Satz — „B2:B40 ist grösser als 100, dann rot" —,
     * und ein Satz gehört in eine Zeile.
     *
     * DER BEREICH IST VORAUSGEFÜLLT mit dem, was gerade markiert ist. Das
     * ist der ganze Unterschied zwischen „ich probiere das mal aus" und
     * „ich muss erst nachsehen, wie meine Spalte heisst".
     * ====================================================================*/
    const regelFenster = (): void => {
      const o = document.createElement('div');
      o.className = 'overlay';
      const b0 = bereich();
      const vorschlag = b0
        ? R.schreibe(b0.vonZ, b0.vonS) + ':' + R.schreibe(b0.bisZ, b0.bisS)
        : '';

      o.innerHTML = '<div class="finder" style="width:min(620px,94vw)">' +
        '<div class="fh">🎨 Bedingte Formatierung' +
          '<button class="icon-btn" data-a="zu">✕</button></div>' +
        /* Eigene Klasse, weil `.dl-hinweis` keinen seitlichen Rand hat — es
           steht sonst in einem Kasten, der selbst schon einen hat. Hier
           liegt es direkt im Fenster, und der Satz stiess bei 390 px an
           den Rahmen. */
        '<div class="dl-hinweis rg-hinweis">Die erste Regel, die zutrifft, färbt ' +
          'die Zelle. Die Werte selbst bleiben unverändert — eine Regel ist eine ' +
          'Sicht, keine Bearbeitung.</div>' +
        /* NICHT `.res`. Das ist die Trefferliste des Finders, und dort gilt
           `button { width:100% }` — die beiden kleinen Knöpfe ☑ und 🗑
           sprangen damit auf je eine eigene Zeile, und aus einer Regel
           wurden drei Zeilen Papier. Gefunden beim Hinsehen (§55), nicht
           beim Lesen: im Quelltext sah es richtig aus. */
        '<div class="rg-liste" id="rg-liste"></div>' +
        '<div class="rg-neu">' +
          `<input id="rg-bereich" placeholder="Bereich, z. B. B2:B40" value="${esc(vorschlag)}">` +
          '<select id="rg-art">' +
            REGELARTEN.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('') +
          '</select>' +
          '<input id="rg-wert" placeholder="Wert" style="max-width:110px">' +
          '<input id="rg-wert2" placeholder="bis" style="max-width:80px; display:none">' +
          '<select id="rg-satz" style="display:none">' +
            Object.entries(SYMBOLSAETZE).map(([id, z]) =>
              `<option value="${id}">${z.join(' ')}</option>`).join('') +
          '</select>' +
          '<label id="rg-umlabel" style="display:none; align-items:center; gap:6px; ' +
            'font-size:13px; color:var(--text-dim)">' +
            '<input type="checkbox" id="rg-um" style="width:auto">klein ist gut</label>' +
          '<select id="rg-farbe">' +
            Object.keys(REGELFARBEN).map(f =>
              `<option value="${f}">${f}</option>`).join('') +
          '</select>' +
          '<button data-a="add" class="prim">Hinzufügen</button>' +
        '</div>' +
        '<div class="fbtns"><button data-a="zu">Fertig</button></div></div>';
      document.body.appendChild(o);

      const satz = (r: any): string => {
        const name = (REGELARTEN.find(x => x[0] === r.art) || ['', r.art])[1];
        const wert = r.art === 'zwischen' ? `${r.wert ?? ''} und ${r.wert2 ?? ''}`
                   : OHNE_WERT.includes(r.art)
                     ? '' : String(r.wert ?? '');
        const anhang = r.art === 'symbol'
          ? ' ' + (SYMBOLSAETZE[r.satz || 'ampel'] || []).join('') : '';
        return `${r.bereich || 'ganzes Blatt'} ${name}${wert ? ' ' + wert : ''}${anhang}`;
      };

      const zeichneListe = (): void => {
        const k = o.querySelector('#rg-liste');
        if (!k) return;
        const l = blatt.regeln || [];
        k.innerHTML = l.length
          ? l.map((r: any, i: number) =>
              '<div class="fr-zeile">' +
              (r.art === 'symbol'
                ? `<span class="fr-punkt fr-symbol">${esc((SYMBOLSAETZE[r.satz || 'ampel'] || [])[2] ?? '')}</span>`
                : r.art === 'skala' || r.art === 'balken'
                ? '<span class="fr-punkt fr-verlauf"></span>'
                : `<span class="fr-punkt bg-${REGELFARBEN[r.farbe || 'gelb'] || 'yellow'}"></span>`) +
              `<span class="fr-text">${esc(satz(r))}</span>` +
              `<button data-an="${i}" title="An oder aus">${r.an === false ? '☐' : '☑'}</button>` +
              `<button data-weg="${i}" title="Regel löschen">🗑</button></div>`).join('')
          : '<div style="padding:18px; color:var(--text-faint); font-size:14px">' +
            'Noch keine Regel. Unten eine anlegen — der Bereich ist schon ' +
            'ausgefüllt, wenn du vorher etwas markiert hast.</div>';
      };
      zeichneListe();

      /* Welche Felder eine Art überhaupt braucht — ein Feld, das nichts tut,
         ist eine Frage ohne Antwort. */
      const felderAnpassen = (): void => {
        const art = o.querySelector<HTMLSelectElement>('#rg-art')?.value || '';
        const w1 = o.querySelector<HTMLElement>('#rg-wert');
        const w2 = o.querySelector<HTMLElement>('#rg-wert2');
        const fa = o.querySelector<HTMLElement>('#rg-farbe');
        const sa = o.querySelector<HTMLElement>('#rg-satz');
        const um = o.querySelector<HTMLElement>('#rg-umlabel');
        const w1f = o.querySelector<HTMLInputElement>('#rg-wert');
        if (w1) w1.style.display = OHNE_WERT.includes(art) ? 'none' : '';
        if (w2) w2.style.display = (art === 'zwischen' || art === 'symbol') ? '' : 'none';
        if (fa) fa.style.display = OHNE_FARBE.includes(art) ? 'none' : '';
        if (sa) sa.style.display = art === 'symbol' ? '' : 'none';
        if (um) um.style.display = art === 'symbol' ? 'flex' : 'none';
        /* Der Platzhalter sagt, was das Feld hier bedeutet — „Wert" heisst
           bei drei Arten drei verschiedene Dinge. */
        if (w1f) w1f.placeholder = art === 'symbol' ? 'ab' 
                                 : art === 'faelligBald' ? 'Tage' : 'Wert';
      };
      felderAnpassen();
      o.querySelector('#rg-art')?.addEventListener('change', felderAnpassen);

      o.addEventListener('click', e => {
        const ziel = e.target instanceof Element ? e.target : null;
        if (e.target === o || ziel?.closest('[data-a="zu"]')) { o.remove(); return; }

        const an = ziel?.closest<HTMLElement>('[data-an]');
        if (an) {
          const l = blatt.regeln || [];
          const i = Number(an.dataset['an']);
          if (l[i]) l[i].an = l[i].an === false;
          blatt.regeln = l;
          sichere(); alles(); zeichneListe();
          return;
        }
        const weg = ziel?.closest<HTMLElement>('[data-weg]');
        if (weg) {
          const l = blatt.regeln || [];
          l.splice(Number(weg.dataset['weg']), 1);
          blatt.regeln = l;
          sichere(); alles(); zeichneListe();
          return;
        }
        if (!ziel?.closest('[data-a="add"]')) return;

        const art = o.querySelector<HTMLSelectElement>('#rg-art')?.value || 'groesser';
        const regel: Record<string, unknown> = {
          bereich: (o.querySelector<HTMLInputElement>('#rg-bereich')?.value || '').trim(),
          art, an: true
        };
        if (!OHNE_WERT.includes(art))
          regel['wert'] = o.querySelector<HTMLInputElement>('#rg-wert')?.value ?? '';
        if (art === 'zwischen' || art === 'symbol')
          regel['wert2'] = o.querySelector<HTMLInputElement>('#rg-wert2')?.value ?? '';
        if (!OHNE_FARBE.includes(art))
          regel['farbe'] = o.querySelector<HTMLSelectElement>('#rg-farbe')?.value || 'gelb';
        if (art === 'symbol') {
          regel['satz'] = o.querySelector<HTMLSelectElement>('#rg-satz')?.value || 'ampel';
          regel['umgekehrt'] = o.querySelector<HTMLInputElement>('#rg-um')?.checked ?? false;
        }

        blatt.regeln = (blatt.regeln || []).concat([regel]);
        sichere(); alles(); zeichneListe();
      });
    };

    /* ======================================================================
     * BEDIENEN
     * ====================================================================*/
    const waehle = (a: string, mitAnker = false): void => {
      if (!R.gueltig(a)) return;
      gewaehlt = a;
      if (!mitAnker) anker = a;
      alles();
      /* Ins Sichtfeld rollen — sonst wandert die Auswahl aus dem Bild. */
      const l = R.lies(a);
      if (l) {
        const oben = l.zeile * zh, unten = oben + zh;
        if (oben < feld.scrollTop) feld.scrollTop = oben;
        else if (unten > feld.scrollTop + feld.clientHeight)
          feld.scrollTop = unten - feld.clientHeight;
      }
    };

    const waehleBereich = (vonZ: number, vonS: number, bisZ: number, bisS: number): void => {
      anker = R.schreibe(vonZ, vonS);
      gewaehlt = R.schreibe(bisZ, bisS);
      alles();
    };

    const uebernimm = (text: string): void => {
      K.setze(blatt, gewaehlt, text);
      rechneUndZeichne();
    };

    /* Ein echtes Eingabefeld über der Zelle — kein contenteditable. Es
       verhält sich wie überall sonst: Auswahl, Einfügen, Rückgängig. */
    const bearbeite = (start?: string): void => {
      const d = koerper.querySelector('[data-a="' + gewaehlt + '"]') as HTMLElement | null;
      if (!d) return;
      const feldchen = document.createElement('input');
      feldchen.value = start !== undefined ? start : K.eingabe(blatt, gewaehlt);
      feldchen.setAttribute('aria-label', 'Zelle ' + gewaehlt);
      d.appendChild(feldchen);
      feldchen.focus();
      if (start === undefined) feldchen.select();
      /* DIE TASTATUR BELEGT AM TELEFON DEN HALBEN BILDSCHIRM. Steht die
         Zelle in der unteren Hälfte, tippt man ab jetzt blind. Also erst
         einmal in die Mitte rollen — die Browser tun das teils selbst, aber
         nicht alle und nicht zuverlässig, und „teils" reicht hier nicht. */
      if (handy && d.scrollIntoView)
        setTimeout(() => d.scrollIntoView({ block: 'center', inline: 'nearest' }), 50);

      let beendet = false;
      const schliesse = (nehmen: boolean, dann?: () => void): void => {
        if (beendet) return;
        beendet = true;
        const wert = feldchen.value;
        feldchen.remove();
        if (nehmen) uebernimm(wert); else alles();
        feld.focus();
        if (dann) dann();
      };

      feldchen.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter')  { e.preventDefault(); schliesse(true,  () => waehle(R.versetzt(gewaehlt, 1, 0) || gewaehlt)); }
        else if (e.key === 'Tab') { e.preventDefault(); schliesse(true, () => waehle(R.versetzt(gewaehlt, 0, 1) || gewaehlt)); }
        else if (e.key === 'Escape') { e.preventDefault(); schliesse(false); }
      });
      feldchen.addEventListener('blur', () => schliesse(true));
    };

    /* ======================================================================
     * ZIEHEN — Auswahl, Ausfüllen, Spaltenbreite
     * --------------------------------------------------------------------
     * ALLE DREI HÄNGEN SICH NUR SOLANGE ANS DOKUMENT, WIE SIE ZIEHEN.
     *
     * Der erste Entwurf hatte ein festes `document.addEventListener('mouseup')`
     * pro Block. `App.zeichneSeite()` läuft aber bei jeder Kleinigkeit —
     * Häkchen setzen, Block aufklappen, Farbe wechseln — und jedes Mal
     * entstand ein Zuhörer mehr, der nie wieder ging. Nach einer Stunde
     * Arbeit an einer Seite hingen Hunderte daran. Nichts stürzt dabei ab;
     * die App wird nur langsam, und niemand weiss wovon.
     * ====================================================================*/
    const beimZiehen = (bewegen: (e: MouseEvent) => void, fertig: () => void): void => {
      const auf = (e: MouseEvent): void => { bewegen(e); };
      const ab = (): void => {
        document.removeEventListener('mousemove', auf);
        document.removeEventListener('mouseup', ab);
        fertig();
      };
      document.addEventListener('mousemove', auf);
      document.addEventListener('mouseup', ab);
    };

    const zelleUnter = (e: MouseEvent): { z: number; s: number } | null => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const z = el && el.closest ? el.closest('.tbl-z') as HTMLElement | null : null;
      if (!z || !z.dataset.a) return null;
      const l = R.lies(z.dataset.a);
      return l ? { z: l.zeile, s: l.spalte } : null;
    };

    /* --- Maus im Raster --------------------------------------------------- */
    koerper.addEventListener('mousedown', (e) => {
      const ziel = e.target as HTMLElement;
      const z = ziel.closest('.tbl-z') as HTMLElement | null;

      /* Der Anfasser: die unteren rechten 10 × 10 Pixel der Eckzelle. */
      if (z && z.classList.contains('ecke')) {
        const r = z.getBoundingClientRect();
        if (e.clientX > r.right - 10 && e.clientY > r.bottom - 10) {
          e.preventDefault();
          fuellZiel = null;
          beimZiehen(
            (ev) => { const p = zelleUnter(ev); if (p) { fuellZiel = p; koerperZeichnen(); } },
            () => {
              const b = bereich(), fz = fuellZiel;
              fuellZiel = null;
              if (b && fz && (fz.z > b.bisZ || fz.s > b.bisS)) {
                K.fuelle(blatt, b, Math.max(fz.z, b.bisZ), Math.max(fz.s, b.bisS));
                gewaehlt = R.schreibe(Math.max(fz.z, b.bisZ), Math.max(fz.s, b.bisS));
                rechneUndZeichne();
              } else alles();
            });
          return;
        }
      }

      if (!z || !z.dataset.a) return;
      waehle(z.dataset.a, e.shiftKey);
      feld.focus();
      beimZiehen(
        (ev) => { const p = zelleUnter(ev); if (p) waehle(R.schreibe(p.z, p.s), true); },
        () => { /* nichts nachzuräumen — die Auswahl steht schon */ });
    });

    koerper.addEventListener('dblclick', (e) => {
      const z = (e.target as HTMLElement).closest('.tbl-z') as HTMLElement | null;
      if (z && z.dataset.a) { waehle(z.dataset.a); bearbeite(); }
    });

    feld.addEventListener('scroll', () => koerperZeichnen());

    /* DER FOKUS DES RASTERS. `DESIGN-TABELLE.md` sagt: der Auswahlrahmen ist
       zugleich der Fokusring. Ein zweiter, 2 px starker Rahmen um das ganze
       Raster stritt sichtbar mit ihm — auf dem Bildschirm zog sich eine
       blaue Linie am rechten Rand entlang, und man wusste nicht, was sie
       bedeutet. Also färbt sich stattdessen der Rahmen des Blocks: leise,
       eindeutig, und ohne dem Auswahlrahmen die Aufmerksamkeit zu nehmen.

       Als Klasse und nicht über `:has()`, damit es auch dort gilt, wo `:has`
       fehlt — ein Fokuszeichen, das mancherorts ausfällt, ist keines. */
    feld.addEventListener('focus', () => w.classList.add('imFokus'));
    feld.addEventListener('blur', () => w.classList.remove('imFokus'));

    /* --- Zeilen- und Spaltenköpfe ---------------------------------------- */
    koerper.addEventListener('click', (e) => {
      const nr = (e.target as HTMLElement).closest('.tbl-zn') as HTMLElement | null;
      if (!nr || nr.dataset.z === undefined) return;
      const z = Number(nr.dataset.z);
      waehleBereich(z, 0, z, blatt.spalten - 1);
      feld.focus();
    });

    spaltenKopf.addEventListener('mousedown', (e) => {
      const ziel = e.target as HTMLElement;

      /* Breite ziehen */
      if (ziel.dataset && ziel.dataset.griff !== undefined) {
        e.preventDefault();
        const s = Number(ziel.dataset.griff);
        const startX = e.clientX;
        const startB = breiteVon(s);
        beimZiehen(
          (ev) => {
            blatt.breiten[s] = Math.max(SB_MIN, Math.round(startB + (ev.clientX - startX)));
            spaltenZeichnen(); koerperZeichnen();
          },
          () => { sichere(); });
        return;
      }

      const sp = ziel.closest('.tbl-sp') as HTMLElement | null;
      if (sp && sp.dataset.s !== undefined) {
        const s = Number(sp.dataset.s);
        waehleBereich(0, s, blatt.zeilen - 1, s);
        feld.focus();
        return;
      }

      if (ziel.closest('.tbl-ecke')) {
        waehleBereich(0, 0, blatt.zeilen - 1, blatt.spalten - 1);
        feld.focus();
      }
    });

    /* ======================================================================
     * DAS KONTEXTMENÜ AN DEN KÖPFEN
     * --------------------------------------------------------------------
     * Zeile einfügen und löschen, Spalte einfügen und löschen, sortieren.
     * `Menue.menu` macht daraus am Telefon von allein ein Blatt, das von
     * unten hochfährt — deshalb steht hier keine einzige Zeile für Touch.
     * ====================================================================*/
    const menuFuer = (art: 'zeile' | 'spalte', index: number, x: number, y: number): void => {
      if (typeof Menue === 'undefined') return;
      const was = art === 'zeile' ? 'Zeile' : 'Spalte';
      const name = art === 'zeile' ? String(index + 1) : R.spalteZuText(index);
      const html =
        `<button data-a="vor"><span class="mi">⬆</span>${was} davor einfügen</button>` +
        `<button data-a="nach"><span class="mi">⬇</span>${was} danach einfügen</button>` +
        '<hr>' +
        (art === 'spalte'
          ? '<button data-a="auf"><span class="mi">↑</span>Aufsteigend sortieren</button>' +
            '<button data-a="abv"><span class="mi">↓</span>Absteigend sortieren</button><hr>'
          : '') +
        `<button data-a="del"><span class="mi">🗑</span>${was} ${esc(name)} löschen</button>`;
      const m = Menue.menu(html, x, y, { titel: was + ' ' + name });
      m.addEventListener('click', (ev: MouseEvent) => {
        const b = (ev.target as HTMLElement).closest('button') as HTMLElement | null;
        if (!b || !b.dataset.a) return;
        const a = b.dataset.a;
        m.remove();
        document.querySelectorAll('.menu-grund').forEach(g => g.remove());
        if (a === 'vor' || a === 'nach') {
          const bei = a === 'vor' ? index : index + 1;
          if (art === 'zeile') K.zeileEinfuegen(blatt, bei); else K.spalteEinfuegen(blatt, bei);
        } else if (a === 'del') {
          if (art === 'zeile') {
            if (blatt.zeilen <= 1) return;
            K.zeileLoeschen(blatt, index);
          } else {
            if (blatt.spalten <= 1) return;
            K.spalteLoeschen(blatt, index);
            /* Die Breiten rücken mit — sonst trägt die neue Spalte C
               plötzlich die Breite der gelöschten. */
            const neu: Record<string, number> = {};
            Object.keys(blatt.breiten).forEach(k => {
              const s = Number(k);
              if (s < index) neu[s] = blatt.breiten[k];
              else if (s > index) neu[s - 1] = blatt.breiten[k];
            });
            blatt.breiten = neu;
          }
        } else if (a === 'auf' || a === 'abv') {
          K.sortiere(blatt, index, 0, blatt.zeilen - 1, a === 'auf');
        }
        rechneUndZeichne();
      });
    };

    const aufKopfMenue = (e: MouseEvent): void => {
      const ziel = e.target as HTMLElement;
      const nr = ziel.closest('.tbl-zn') as HTMLElement | null;
      const sp = ziel.closest('.tbl-sp') as HTMLElement | null;
      if (nr && nr.dataset.z !== undefined) {
        e.preventDefault();
        menuFuer('zeile', Number(nr.dataset.z), e.clientX, e.clientY);
      } else if (sp && sp.dataset.s !== undefined) {
        e.preventDefault();
        menuFuer('spalte', Number(sp.dataset.s), e.clientX, e.clientY);
      }
    };
    koerper.addEventListener('contextmenu', aufKopfMenue);
    spaltenKopf.addEventListener('contextmenu', aufKopfMenue);
    /* Am Telefon gibt es keine rechte Maustaste: ein langer Druck tut es. */
    let druckUhr = 0;
    const langerDruck = (e: TouchEvent): void => {
      const t = e.touches[0];
      if (!t) return;
      const x = t.clientX, y = t.clientY;
      const ziel = e.target as HTMLElement;
      druckUhr = window.setTimeout(() => {
        const nr = ziel.closest('.tbl-zn') as HTMLElement | null;
        const sp = ziel.closest('.tbl-sp') as HTMLElement | null;
        if (nr && nr.dataset.z !== undefined) menuFuer('zeile', Number(nr.dataset.z), x, y);
        else if (sp && sp.dataset.s !== undefined) menuFuer('spalte', Number(sp.dataset.s), x, y);
      }, 500);
    };
    const druckWeg = (): void => { if (druckUhr) { clearTimeout(druckUhr); druckUhr = 0; } };
    [koerper, spaltenKopf].forEach(el => {
      el.addEventListener('touchstart', langerDruck as EventListener, { passive: true });
      el.addEventListener('touchend', druckWeg);
      el.addEventListener('touchmove', druckWeg, { passive: true });
    });

    /* ======================================================================
     * TASTATUR
     * --------------------------------------------------------------------
     * Die Tabelle ist EIN Tabstopp. Wer hineinspringt, bewegt sich mit den
     * Pfeilen darin — sich durch tausend Zellen zu tabben wäre keine
     * Bedienbarkeit, sondern eine Strafe.
     * ====================================================================*/
    feld.addEventListener('keydown', (e) => {
      const k = e.key;
      const mit = e.shiftKey;
      const strg = e.ctrlKey || e.metaKey;
      const springe = (dz: number, ds: number): void => {
        const ziel = R.versetzt(gewaehlt, dz, ds);
        if (ziel) { e.preventDefault(); waehle(ziel, mit); }
      };

      if (strg && (k === 'a' || k === 'A')) {
        e.preventDefault();
        return waehleBereich(0, 0, blatt.zeilen - 1, blatt.spalten - 1);
      }
      if (k === 'ArrowUp')    return springe(-1, 0);
      if (k === 'ArrowDown')  return springe(1, 0);
      if (k === 'ArrowLeft')  return springe(0, -1);
      if (k === 'ArrowRight') return springe(0, 1);
      if (k === 'PageDown') { e.preventDefault(); const l = R.lies(gewaehlt);
        return waehle(R.schreibe(Math.min(blatt.zeilen - 1, (l ? l.zeile : 0) + 20), l ? l.spalte : 0), mit); }
      if (k === 'PageUp') { e.preventDefault(); const l = R.lies(gewaehlt);
        return waehle(R.schreibe(Math.max(0, (l ? l.zeile : 0) - 20), l ? l.spalte : 0), mit); }
      if (k === 'Tab')   { e.preventDefault(); return waehle(R.versetzt(gewaehlt, 0, mit ? -1 : 1) || gewaehlt); }
      if (k === 'Enter') { e.preventDefault(); return bearbeite(); }
      if (k === 'F2')    { e.preventDefault(); return bearbeite(); }
      if (k === 'Delete' || k === 'Backspace') {
        e.preventDefault();
        const b = bereich();
        if (b) for (let z = b.vonZ; z <= b.bisZ; z++)
          for (let s = b.vonS; s <= b.bisS; s++) K.setze(blatt, R.schreibe(z, s), '');
        return rechneUndZeichne();
      }
      if (k === 'Home') { e.preventDefault(); const l = R.lies(gewaehlt);
        return waehle(R.schreibe(strg ? 0 : (l ? l.zeile : 0), 0), mit); }
      if (k === 'End') { e.preventDefault(); const l = R.lies(gewaehlt);
        return waehle(R.schreibe(strg ? blatt.zeilen - 1 : (l ? l.zeile : 0), blatt.spalten - 1), mit); }
      /* Ein sichtbares Zeichen fängt das Bearbeiten an — wie in Excel. */
      if (k.length === 1 && !strg && !e.altKey) {
        e.preventDefault(); return bearbeite(k);
      }
    });

    /* --- Kopieren und Einfügen -------------------------------------------
       Über die Zwischenablage als Tabulatortext: so versteht Excel es, und
       Excel versteht uns. Das ist der Weg, auf dem Daten wirklich wandern. */
    feld.addEventListener('copy', (e) => {
      const b = bereich();
      if (!b || !e.clipboardData) return;
      const zeilen: string[] = [];
      for (let z = b.vonZ; z <= b.bisZ; z++) {
        const sp: string[] = [];
        for (let s = b.vonS; s <= b.bisS; s++) sp.push(K.eingabe(blatt, R.schreibe(z, s)));
        zeilen.push(sp.join('\t'));
      }
      e.clipboardData.setData('text/plain', zeilen.join('\n'));
      e.preventDefault();
    });

    feld.addEventListener('paste', (e) => {
      if (!e.clipboardData) return;
      const text = e.clipboardData.getData('text/plain');
      if (!text) return;
      e.preventDefault();
      const start = R.lies(gewaehlt);
      if (!start) return;
      const zeilen = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
      zeilen.forEach((zeile, dz) => {
        zeile.split('\t').forEach((wert, ds) => {
          /* Das Blatt wächst mit dem, was hineinkommt — sonst fällt der
             Rest der Zwischenablage lautlos weg. */
          if (start.zeile + dz + 1 > blatt.zeilen) blatt.zeilen = start.zeile + dz + 1;
          if (start.spalte + ds + 1 > blatt.spalten) blatt.spalten = start.spalte + ds + 1;
          K.setze(blatt, R.schreibe(start.zeile + dz, start.spalte + ds), wert);
        });
      });
      rechneUndZeichne();
    });

    /* --- Bearbeitungszeile ------------------------------------------------ */
    eingabe.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); uebernimm(eingabe.value); feld.focus(); }
      if (e.key === 'Escape') { e.preventDefault(); kopfZeichnen(); feld.focus(); }
    });
    eingabe.addEventListener('blur', () => {
      if (eingabe.value !== K.eingabe(blatt, gewaehlt)) uebernimm(eingabe.value);
    });

    /* ======================================================================
     * AUSGEBEN
     * --------------------------------------------------------------------
     * Excel und CSV, und beides über das, was `dateien/ausgeben.js` schon
     * kann. Eine zweite ZIP-Schreiberei für xlsx wäre die Sorte Arbeit, die
     * man zweimal pflegt und einmal vergisst.
     * ====================================================================*/
    const alsZeilen = (): string[][] => {
      const raus: string[][] = [];
      let letzteVolle = 0;
      for (let z = 0; z < blatt.zeilen; z++) {
        const eine: string[] = [];
        let etwasDrin = false;
        for (let s = 0; s < blatt.spalten; s++) {
          const zelle = blatt.zellen[R.schreibe(z, s)];
          const wert = zelle ? zelle.wert : '';
          const t = zeigeWert(wert, zelle && zelle.stil && zelle.stil.format);
          if (t !== '') etwasDrin = true;
          eine.push(t);
        }
        raus.push(eine);
        if (etwasDrin) letzteVolle = raus.length;
      }
      /* Ein Blatt hat 50 Zeilen, gefüllt sind meist zehn. Die vierzig leeren
         gehören nicht in die Datei — eine CSV mit vierzig leeren Zeilen am
         Ende sieht in jedem anderen Programm nach einem Fehler aus. */
      return raus.slice(0, letzteVolle);
    };

    /* Geschrieben wird über `core/spreadsheet/csv.ts` — dieselbe Stelle, die
       auch einliest. Zwei eigene Regeln fürs Anführen liefen auseinander,
       und dann öffnet die eigene Datei sich selbst nicht mehr richtig. */
    const alsCsv = (): string => Csv.schreibe(alsZeilen(), ';');

    const gibAus = (art: 'csv' | 'xlsx'): void => {
      const name = (blatt.name || block.mappe.name || 'Tabelle').replace(/[\\/:*?"<>|]/g, '-');
      if (art === 'xlsx') {
        if (typeof Austausch === 'undefined') return;
        Austausch.alsExcel([{ name: blatt.name || 'Tabelle', zeilen: alsZeilen() }], name);
        return;
      }
      /* CSV mit Semikolon und BOM: so öffnet Excel im deutschen Sprachraum
         die Datei richtig, statt alles in eine Spalte zu legen. */
      const blob = new Blob([Csv.mitBom(alsCsv())], { type: 'text/csv;charset=utf-8' });
      if (typeof Austausch !== 'undefined' && Austausch.laden) Austausch.laden(blob, name + '.csv');
      else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }
    };

    /* ======================================================================
     * EINLESEN
     * --------------------------------------------------------------------
     * DAS LOCH, DAS DAS AUSGEBEN AUFGEMACHT HAT. „Als Excel speichern" ohne
     * „Excel öffnen" ist ein Rundlauf, der nicht rundläuft.
     *
     * ─── UND WARUM ERST GEFRAGT WIRD ──────────────────────────────────────
     *
     * Einlesen überschreibt Zellen. `redion-mobile-ux` sagt zum Import:
     * *Datei wählen → Vorschau → Ziel wählen → Import starten → Ergebnis.
     * Nie direkt alles übernehmen.* Und die oberste Regel dieses Projekts
     * heisst: keine Datenverluste.
     *
     * Also steht vor dem Übernehmen eine Frage, und die sagt **nachgezählt**,
     * was passieren wird: wie viele Zeilen und Spalten kommen, und wie viele
     * gefüllte Zellen dabei überschrieben werden. „Bist du sicher?" ist keine
     * Frage — „37 gefüllte Zellen werden überschrieben" ist eine.
     * ====================================================================*/
    const einlesen = (): void => {
      const eingang = document.createElement('input');
      eingang.type = 'file';
      eingang.accept = '.csv,.tsv,.txt,.xlsx,.xlsm';
      eingang.style.display = 'none';
      document.body.appendChild(eingang);

      eingang.addEventListener('change', async () => {
        const datei = eingang.files && eingang.files[0];
        eingang.remove();
        if (!datei) return;

        let zeilen: string[][] = [];
        let quelle = datei.name;
        try {
          if (/\.(xlsx|xlsm)$/i.test(datei.name)) {
            if (typeof Einlesen === 'undefined') throw new Error('Der Excel-Leser ist nicht geladen.');
            const blaetter = await Einlesen.xlsxLesen(await datei.arrayBuffer());
            if (!blaetter || !blaetter.length) throw new Error('In dieser Datei steckt kein Tabellenblatt.');
            /* Nur das erste Blatt — mehrere Blätter je Block gibt es noch
               nicht, und es stillschweigend zu verschlucken wäre schlimmer,
               als es zu sagen. */
            zeilen = blaetter[0].zeilen || [];
            quelle = datei.name + (blaetter.length > 1
              ? ' · Blatt „' + (blaetter[0].name || '1') + '" von ' + blaetter.length : '');
          } else {
            zeilen = Csv.zerlege(await datei.text());
          }
        } catch (e: any) {
          if (typeof UI !== 'undefined' && UI.toast)
            UI.toast('Die Datei liess sich nicht lesen: ' + (e && e.message ? e.message : e));
          return;
        }

        if (!zeilen.length) {
          if (typeof UI !== 'undefined' && UI.toast) UI.toast('Die Datei ist leer.');
          return;
        }

        const breite = zeilen.reduce((m, z) => Math.max(m, z.length), 0);
        const start = R.lies(gewaehlt) || { zeile: 0, spalte: 0 };

        /* NACHGEZÄHLT, nicht geschätzt: wie viele gefüllte Zellen fallen
           weg, wenn ab hier eingelesen wird? */
        const zaehleUeberschrieben = (vonZ: number, vonS: number): number => {
          let n = 0;
          for (let z = 0; z < zeilen.length; z++)
            for (let s = 0; s < (zeilen[z] as string[]).length; s++) {
              const alt = blatt.zellen[R.schreibe(vonZ + z, vonS + s)];
              if (alt && alt.wert !== '' && alt.wert !== undefined) n++;
            }
          return n;
        };

        const gefuellt = Object.keys(blatt.zellen)
          .filter(a => { const c = blatt.zellen[a]; return c && c.wert !== '' && c.wert !== undefined; }).length;

        const vorschau = (zeilen.slice(0, 3) as string[][])
          .map(z => z.slice(0, 4).map(v => String(v).slice(0, 14)).join(' · ')).join('\n');

        const knoepfe: any[] = [
          { id: 'a1', text: 'Ab A1 einlesen',
            hinweis: gefuellt ? zaehleUeberschrieben(0, 0) + ' gefüllte Zellen werden überschrieben'
                              : 'Das Blatt ist leer — nichts geht verloren' }
        ];
        if (gewaehlt !== 'A1')
          knoepfe.push({ id: 'hier', text: 'Ab ' + gewaehlt + ' einlesen',
            hinweis: zaehleUeberschrieben(start.zeile, start.spalte) +
                     ' gefüllte Zellen werden überschrieben' });
        knoepfe.push({ id: '', text: 'Abbrechen', hinweis: 'Es wird nichts verändert' });

        const antwort = typeof Dialog !== 'undefined'
          ? await Dialog.wahl({
              titel: 'Einlesen: ' + quelle,
              text: zeilen.length + ' Zeilen × ' + breite + ' Spalten\n\n' + vorschau +
                    (zeilen.length > 3 ? '\n…' : ''),
              knoepfe })
          : 'a1';
        if (!antwort) return;

        const vonZ = antwort === 'hier' ? start.zeile : 0;
        const vonS = antwort === 'hier' ? start.spalte : 0;

        /* Das Blatt wächst mit dem, was hineinkommt — sonst fällt der Rest
           der Datei lautlos weg, und das ist genau die Sorte Verlust, die
           niemand bemerkt. */
        if (vonZ + zeilen.length > blatt.zeilen) blatt.zeilen = vonZ + zeilen.length;
        if (vonS + breite > blatt.spalten) blatt.spalten = vonS + breite;

        zeilen.forEach((zeile, z) => (zeile || []).forEach((wert, sp) =>
          K.setze(blatt, R.schreibe(vonZ + z, vonS + sp), wert)));

        gewaehlt = anker = R.schreibe(vonZ, vonS);
        rechneUndZeichne();
        if (typeof UI !== 'undefined' && UI.toast)
          UI.toast(zeilen.length + ' Zeilen eingelesen');
      });

      eingang.click();
    };

    /* Eine Stelle für beides: die Leiste am Rechner und das Blatt am
       Telefon rufen dasselbe auf. Zwei Kopien liefen auseinander, und die
       am Telefon wäre die vergessene. */
    const stilSetzen = (a: string): void => {
      const ber = bereich();
      if (!ber) return;

      if (a === 'fuellRunter' || a === 'fuellRechts') {
        const runter = a === 'fuellRunter';
        const bisZ = runter ? Math.min(blatt.zeilen - 1, ber.bisZ + 10) : ber.bisZ;
        const bisS = runter ? ber.bisS : Math.min(blatt.spalten - 1, ber.bisS + 5);
        K.fuelle(blatt, ber, bisZ, bisS);
        gewaehlt = R.schreibe(bisZ, bisS);
        return rechneUndZeichne();
      }

      for (let z = ber.vonZ; z <= ber.bisZ; z++)
        for (let s = ber.vonS; s <= ber.bisS; s++) {
          const adr = R.schreibe(z, s);
          /* Eine leere Zelle bekommt erst dann einen Eintrag, wenn sie einen
             Stil trägt — sonst füllt sich das Blatt mit Nichts und die
             Sicherung wächst ohne Inhalt. */
          const zelle = blatt.zellen[adr] || (blatt.zellen[adr] = { wert: '' });
          zelle.stil = zelle.stil || {};
          if (a === 'fett')   zelle.stil.fett = !zelle.stil.fett;
          if (a === 'kursiv') zelle.stil.kursiv = !zelle.stil.kursiv;
          if (a === 'links' || a === 'mitte' || a === 'rechts')
            zelle.stil.ausrichtung = zelle.stil.ausrichtung === a ? undefined : a;
          if (a === 'waehrung')
            zelle.stil.format = (zelle.stil.format && zelle.stil.format.art === 'waehrung')
              ? undefined : { art: 'waehrung', stellen: 2, waehrung: 'CHF' };
          if (a === 'prozent')
            zelle.stil.format = (zelle.stil.format && zelle.stil.format.art === 'prozent')
              ? undefined : { art: 'prozent', stellen: 1 };
        }
      rechneUndZeichne();
    };

    /* --- Werkzeuge -------------------------------------------------------- */
    werkzeuge.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!b || !b.dataset.a) return;
      const a = b.dataset.a;

      if (a === 'zeile')  { blatt.zeilen += 1;  rechneUndZeichne(); return; }
      if (a === 'spalte') { blatt.spalten += 1; rechneUndZeichne(); return; }

      /* DAS FORMAT-BLATT AM TELEFON. Dieselben Befehle wie oben am Rechner,
         nur als Blatt von unten — dort, wo der Daumen hinkommt. `Menue.menu`
         macht daraus von allein eines. */
      if (a === 'format') {
        if (typeof Menue === 'undefined') return;
        const zelle = blatt.zellen[gewaehlt];
        const stil = (zelle && zelle.stil) || {};
        const an = (bedingung: unknown): string => bedingung ? ' ✓' : '';
        const m = Menue.menu(
          '<button data-a="fett"><span class="mi"><b>F</b></span>Fett' + an(stil.fett) + '</button>' +
          '<button data-a="kursiv"><span class="mi"><i>K</i></span>Kursiv' + an(stil.kursiv) + '</button><hr>' +
          '<button data-a="links"><span class="mi">' + strichIcon('links') + '</span>Linksbündig' + an(stil.ausrichtung === 'links') + '</button>' +
          '<button data-a="mitte"><span class="mi">' + strichIcon('mitte') + '</span>Zentriert' + an(stil.ausrichtung === 'mitte') + '</button>' +
          '<button data-a="rechts"><span class="mi">' + strichIcon('rechts') + '</span>Rechtsbündig' + an(stil.ausrichtung === 'rechts') + '</button><hr>' +
          '<button data-a="waehrung"><span class="mi">CHF</span>Währung' + an(stil.format && stil.format.art === 'waehrung') + '</button>' +
          '<button data-a="prozent"><span class="mi">%</span>Prozent' + an(stil.format && stil.format.art === 'prozent') + '</button><hr>' +
          '<button data-a="fuellRunter"><span class="mi">⬇</span>Nach unten ausfüllen</button>' +
          '<button data-a="fuellRechts"><span class="mi">➡</span>Nach rechts ausfüllen</button>',
          0, innerHeight, { titel: 'Format · ' + gewaehlt });
        m.addEventListener('click', (ev: MouseEvent) => {
          const t = (ev.target as HTMLElement).closest('button') as HTMLElement | null;
          if (!t || !t.dataset.a) return;
          m.remove();
          document.querySelectorAll('.menu-grund').forEach(g => g.remove());
          stilSetzen(t.dataset.a);
        });
        return;
      }

      if (a === 'mehr') {
        if (typeof Menue === 'undefined') return;
        const r = b.getBoundingClientRect();
        const m = Menue.menu(
          '<button data-a="oeffnen"><span class="mi">📂</span>Excel oder CSV öffnen</button><hr>' +
          '<button data-a="xlsx"><span class="mi">📊</span>Als Excel speichern</button>' +
          '<button data-a="csv"><span class="mi">📄</span>Als CSV speichern</button><hr>' +
          '<button data-a="regeln"><span class="mi">🎨</span>Bedingte Formatierung' +
            ((blatt.regeln || []).length
              ? '<span class="ms">' + (blatt.regeln || []).length + '</span>' : '') +
          '</button><hr>' +
          '<button data-a="zeilen"><span class="mi">⬇</span>20 Zeilen anhängen</button>' +
          '<button data-a="spalten"><span class="mi">➡</span>5 Spalten anhängen</button><hr>' +
          '<button data-a="breiten"><span class="mi">↔</span>Spaltenbreiten zurücksetzen</button>',
          r.left, r.bottom + 4, { titel: 'Tabelle' });
        m.addEventListener('click', (ev: MouseEvent) => {
          const t = (ev.target as HTMLElement).closest('button') as HTMLElement | null;
          if (!t || !t.dataset.a) return;
          m.remove();
          document.querySelectorAll('.menu-grund').forEach(g => g.remove());
          if (t.dataset.a === 'oeffnen') return einlesen();
          if (t.dataset.a === 'xlsx') return gibAus('xlsx');
          if (t.dataset.a === 'csv')  return gibAus('csv');
          if (t.dataset.a === 'regeln') return regelFenster();
          if (t.dataset.a === 'zeilen')  blatt.zeilen += 20;
          if (t.dataset.a === 'spalten') blatt.spalten += 5;
          if (t.dataset.a === 'breiten') blatt.breiten = {};
          rechneUndZeichne();
        });
        return;
      }

      stilSetzen(a);
    });

    /* ======================================================================
     * DIE REITER BEDIENEN
     * --------------------------------------------------------------------
     * Klicken wechselt · Doppelklick benennt um · Rechtsklick oder langer
     * Druck öffnet das Menü · `+` legt an.
     *
     * DAS LÖSCHEN IST DIE STELLE, AN DER MAN AUFPASSEN MUSS. Ein Blatt zu
     * löschen, auf das Formeln zeigen, macht diese Formeln kaputt — und zwar
     * auf einem ANDEREN Blatt, das man gerade nicht sieht. Deshalb wird
     * vorher nachgezählt und gesagt, wie viele es sind.
     * ====================================================================*/
    const blattMenue = (b: any, x: number, y: number): void => {
      if (typeof Menue === 'undefined') return;
      const m = Menue.menu(
        '<button data-a="um"><span class="mi">✏️</span>Umbenennen</button>' +
        '<button data-a="kopie"><span class="mi">⧉</span>Verdoppeln</button><hr>' +
        (block.mappe.blaetter.length > 1
          ? '<button data-a="del"><span class="mi">🗑</span>Blatt „' + esc(b.name) + '" löschen</button>'
          : '<button data-a="" disabled><span class="mi">🗑</span>Das letzte Blatt bleibt</button>'),
        x, y, { titel: b.name });

      m.addEventListener('click', async (ev: MouseEvent) => {
        const t = (ev.target as HTMLElement).closest('button') as HTMLElement | null;
        if (!t || !t.dataset.a) return;
        const a = t.dataset.a;
        m.remove();
        document.querySelectorAll('.menu-grund').forEach(g => g.remove());

        if (a === 'um') return umbenennen(b);

        if (a === 'kopie') {
          const kopie = JSON.parse(JSON.stringify(b));
          kopie.id = (typeof Ids !== 'undefined') ? Ids.short(8)
            : 'x' + Math.random().toString(36).slice(2, 10);
          kopie.name = freierName(b.name + ' Kopie');
          block.mappe.blaetter.push(kopie);
          zuBlatt(kopie.id);
          return;
        }

        if (a === 'del') {
          /* NACHGEZÄHLT: wie viele Formeln auf ANDEREN Blättern zeigen
             hierher? Sie stehen woanders, man sieht sie gerade nicht, und
             sie werden gleich alle `#BEZUG!`. */
          let betroffen = 0;
          block.mappe.blaetter.forEach((andere: any) => {
            if (andere.id === b.id) return;
            Object.keys(andere.zellen || {}).forEach(adr => {
              const z = andere.zellen[adr];
              if (z && z.formel && K.uebersetze(z.formel, andere.name).liest
                    .some((n: string) => K.trenneBlatt(n).blatt === b.name)) betroffen++;
            });
          });

          const gefuellt = Object.keys(b.zellen || {}).length;
          const antwort = typeof Dialog !== 'undefined'
            ? await Dialog.wahl({
                titel: 'Blatt „' + b.name + '" löschen?',
                text: gefuellt + ' gefüllte Zellen' +
                  (betroffen ? '\n\n' + betroffen + ' Formeln auf anderen Blättern zeigen hierher. ' +
                               'Sie zeigen danach ins Leere und stehen als #BEZUG! da.'
                             : '\n\nKeine Formel auf einem anderen Blatt zeigt hierher.'),
                knoepfe: [
                  { id: '', text: 'Behalten', hinweis: 'Es wird nichts verändert' },
                  { id: 'ja', text: 'Löschen', hinweis: gefuellt + ' Zellen gehen verloren' }
                ] })
            : 'ja';
          if (antwort !== 'ja') return;

          const i = block.mappe.blaetter.indexOf(b);
          block.mappe.blaetter.splice(i, 1);
          const naechstes = block.mappe.blaetter[Math.max(0, i - 1)];
          blatt = naechstes;
          block.mappe.aktiv = naechstes.id;
          gewaehlt = anker = 'A1';
          rechneUndZeichne();
        }
      });
    };

    /** Ein Name, den es noch nicht gibt — sonst zeigen zwei Blätter auf eins. */
    const freierName = (wunsch: string): string => {
      const belegt = new Set(block.mappe.blaetter.map((b: any) => b.name));
      if (!belegt.has(wunsch)) return wunsch;
      for (let i = 2; i < 999; i++) if (!belegt.has(wunsch + ' ' + i)) return wunsch + ' ' + i;
      return wunsch + ' ' + Date.now();
    };

    const umbenennen = async (b: any): Promise<void> => {
      if (typeof Dialog === 'undefined') return;
      const neu = await Dialog.frage('Blatt umbenennen', b.name);
      if (!neu || neu === b.name) return;
      /* Kein `!` im Namen: er steht in jeder Formel vor dem Ausrufezeichen,
         und ein zweites darin wäre nicht mehr eindeutig zu lesen. */
      const sauber = String(neu).replace(/[!'"]/g, '').trim().slice(0, 40);
      if (!sauber) return;
      const alt = b.name;
      b.name = freierName(sauber);

      /* JEDE FORMEL AUF JEDEM BLATT NACHZIEHEN. Ohne das zeigt nach dem
         Umbenennen alles ins Leere — und zwar sofort und überall. */
      block.mappe.blaetter.forEach((andere: any) => {
        Object.keys(andere.zellen || {}).forEach(adr => {
          const z = andere.zellen[adr];
          if (z && z.formel) z.formel = K.blattUmbenannt(z.formel, alt, b.name);
        });
      });
      rechneUndZeichne();
    };

    reiter.addEventListener('click', (e) => {
      const ziel = e.target as HTMLElement;
      if (ziel.dataset && ziel.dataset.a === 'neu') {
        const neu = K.neuesBlatt(freierName('Tabelle ' + (block.mappe.blaetter.length + 1)));
        block.mappe.blaetter.push(neu);
        zuBlatt(neu.id);
        return;
      }
      const r = ziel.closest('.tbl-reiter-eins') as HTMLElement | null;
      if (r && r.dataset.blatt) zuBlatt(r.dataset.blatt);
    });

    reiter.addEventListener('dblclick', (e) => {
      const r = (e.target as HTMLElement).closest('.tbl-reiter-eins') as HTMLElement | null;
      if (!r || !r.dataset.blatt) return;
      const b = block.mappe.blaetter.find((x: any) => x.id === r.dataset.blatt);
      if (b) umbenennen(b);
    });

    reiter.addEventListener('contextmenu', (e) => {
      const r = (e.target as HTMLElement).closest('.tbl-reiter-eins') as HTMLElement | null;
      if (!r || !r.dataset.blatt) return;
      e.preventDefault();
      const b = block.mappe.blaetter.find((x: any) => x.id === r.dataset.blatt);
      if (b) blattMenue(b, e.clientX, e.clientY);
    });

    /* Am Telefon gibt es keine rechte Maustaste — ein langer Druck tut es. */
    let reiterUhr = 0;
    reiter.addEventListener('touchstart', (e: TouchEvent) => {
      const t = e.touches[0];
      const r = (e.target as HTMLElement).closest('.tbl-reiter-eins') as HTMLElement | null;
      if (!t || !r || !r.dataset.blatt) return;
      const x = t.clientX, y = t.clientY, id = r.dataset.blatt;
      reiterUhr = window.setTimeout(() => {
        const b = block.mappe.blaetter.find((z: any) => z.id === id);
        if (b) blattMenue(b, x, y);
      }, 500);
    }, { passive: true });
    const reiterLos = (): void => { if (reiterUhr) { clearTimeout(reiterUhr); reiterUhr = 0; } };
    reiter.addEventListener('touchend', reiterLos);
    reiter.addEventListener('touchmove', reiterLos, { passive: true });

    /* --- Erster Aufbau ---------------------------------------------------- */
    rechneUndZeichne();
    /* EINMAL NACH DEM EINHÄNGEN, aus zwei Gründen auf einmal:
       · Erst dann steht die Höhe fest — sonst stünde nur die erste Zeile da.
       · Erst dann steht die wirkliche Schrift fest. Vorher gäbe
         `getComputedStyle` die des Dokuments zurück, und die Breitenmessung
         läge daneben — mal zu grosszügig, mal zu streng. */
    setTimeout(() => {
      const eine = koerper.querySelector('.tbl-z') as HTMLElement | null;
      if (eine) {
        const g = getComputedStyle(eine);
        schriftBasis = g.fontSize + ' ' + g.fontFamily;
      }
      koerperZeichnen();
    }, 0);

    return w;
  };

  /* REGELARTEN und SYMBOLSAETZE geben wir mit heraus: `test130` §11 fragt
     den Katalog, statt eine zweite Liste danebenzustellen — eine Liste, die
     jemand nachschreiben müsste, läuft mit der Zeit auseinander. */
  return { zeichne, zeigeWert, istFehler, REGELARTEN, SYMBOLSAETZE };
})();

(window as any).SpreadsheetView = SpreadsheetView;
