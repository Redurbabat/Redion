/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/helfer/zeichenziel.ts (npm run bauen:ts). */
/* ============================================================================
 * zeichenziel.js — welche Zeichenfläche ist gerade gemeint?
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/helfer/zeichenziel.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/kern/helfer/zeichenziel.js`. Wer das .js
 * bearbeitet, verliert die Änderung beim nächsten Bauen;
 * `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * DER GRUND, WARUM ES DIESE DATEI GIBT
 *
 * Redion hat Zeichenwerkzeuge — Stift, Marker, Linie, Pfeil, Rechteck,
 * Ellipse, Text, Fachzeichen, Radierer — und sie funktionieren. Sie stehen
 * in einer Leiste, die `Marken.leiste()` baut, und diese Leiste hängt AN der
 * Fläche: an einer PDF-Seite, an einem A4-Blatt.
 *
 * Das Menüband (E210) hat einen Reiter „Zeichnen", und der kannte davon
 * nichts. Dort standen nur Blatt, Whiteboard und Schaltplan — also, WOMIT
 * man anfängt, nicht, WOMIT man zeichnet (L64).
 *
 * Der Grund war nicht Faulheit, sondern eine echte Frage: ein Knopf oben
 * müsste wissen, AUF WELCHE Fläche er wirkt. Auf einer Seite können mehrere
 * Blätter liegen. Ohne eine Antwort darauf wäre der Knopf entweder tot oder
 * er träfe die falsche Fläche — und beides ist schlimmer als kein Knopf.
 *
 * DIE ANTWORT
 *
 * Die Fläche, die zuletzt berührt wurde. Jede Fläche meldet sich hier an,
 * wenn sie gezeichnet wird, und meldet sich, wenn jemand sie anfasst.
 *
 *     melde(steuerung, name)   eine Fläche gibt es jetzt
 *     beruehrt(steuerung)      jemand hat sie angefasst — sie ist gemeint
 *     abmelden(steuerung)      sie ist weg (Block gelöscht, Seite gewechselt)
 *     aktive()                 die gemeinte Fläche, oder null
 *     setze(werkzeug)          das Werkzeug an der gemeinten Fläche
 *     jetzt()                  welches Werkzeug dort gerade an ist
 *     werkzeugVon(steuerung)   welches Werkzeug an EINER bestimmten Fläche
 *     setzeFarbe / setzeStrich       dasselbe für Farbe und Strichstärke
 *     jetztFarbe / jetztDicke        was dort gewählt ist
 *     farbeVon / dickeVon            was an einer bestimmten Fläche
 *     horche(fn) / vergiss(fn) wenn sich Fläche oder Werkzeug ändern
 *
 * Wer weg ist, wird beim nächsten Nachfragen von selbst entfernt: jede
 * Fläche kennt ihr Element, und ein Element weiss über `isConnected`, ob es
 * noch in der Seite hängt. Deshalb steht `abmelden` da, aber niemand muss
 * daran denken.
 *
 * WARUM ES „ZIEL" HEISST UND NICHT „FLÄCHE"
 *
 * Weil es die FRAGE benennt und nicht die Sache: worauf wirkt der Knopf, den
 * ich gerade drücke? Die Fläche selbst liegt weiterhin in
 * `bereiche/bloecke/arten/zeichenflaeche.ts` — und zwei Dateien desselben
 * Namens in verschiedenen Ordnern hätte der Nächste verwechselt.
 *
 * WARUM IM KERN UND NICHT IN EINEM BEREICH
 *
 * `bereiche/pdf/` und `bereiche/bloecke/arten/blatt` brauchen beide dasselbe,
 * und ein Bereich darf nicht aus einem anderen importieren (CLAUDE.md §5,
 * Regel 1). Es handelt ohnehin von keinem der beiden, sondern von der Frage
 * „was ist gerade gemeint" — und die gehört niemandem allein.
 *
 * WAS HIER NICHT STEHT
 *
 * Nichts vom Zeichnen selbst. Kein Strich, keine Farbe, keine Marke. Das
 * alles bleibt in `bereiche/pdf/marken.ts`, wo es geprüft ist. Diese Datei
 * hält einen Zeiger und ein Wort, mehr nicht — sonst hätte Redion die
 * Zeichenlogik an zwei Stellen, und die zweite liefe irgendwann von der
 * ersten weg.
 * ==========================================================================*/

const Zeichenziel = (() => {

  /**
   * Die Steuerung, die `Marken.schicht()` zurückgibt — aber nur das, was
   * hier auch benutzt wird. Sie bringt mehr mit (`marken`, `state`,
   * `beiAenderung`), und das bleibt drüben.
   *
   * `flaeche` steht hier, weil es die einzige Frage beantwortet, die diese
   * Datei sonst nicht beantworten kann: LEBT diese Fläche noch? Eine
   * Steuerung ist ein Objekt und weiss von sich aus nicht, dass ihr Blatt
   * längst aus der Seite genommen wurde. Ihr Element weiss es —
   * `isConnected`.
   *
   * Der Typ ist `Element` und nicht `HTMLElement`: es ist ein
   * `SVGSVGElement`. Der erste Entwurf schrieb `HTMLElement`, der
   * Typprüfer meldete es, und die Antwort darauf war, das Feld ganz zu
   * streichen. Das war die falsche Antwort auf die richtige Meldung — ohne
   * das Feld wuchs die Liste bei jedem Seitenwechsel um eine tote Fläche,
   * und der Zeiger blieb auf der ersten davon stehen (gemessen: nach fünf
   * Wechseln sechs Flächen, gemeint war die erste, sichtbar die sechste).
   */
  type Steuerung = {
    flaeche?: Element;
    setzeWerkzeug?: (name: string) => void;
    setzeFarbe?: (wert: string) => void;
    setzeStrich?: (wert: number) => void;
    undo?: () => void;
    redo?: () => void;
    deleteSelection?: () => void;
  };

  /**
   * `gesehen` heisst: dieses Element hing schon einmal in der Seite.
   *
   * `farbe` und `dicke` stehen neben `werkzeug`, weil dieselbe Frage für
   * sie gilt: das Menüband will anzeigen, WAS gerade gewählt ist, und die
   * Leiste an der Fläche will es auch. Zwei Anzeigen, ein Zustand — sonst
   * läuft die eine der anderen hinterher, wie es beim Werkzeug schon
   * einmal passiert ist.
   *
   * Die WERTE stehen nicht hier. Welche fünf Farben und welche drei
   * Strichstärken es gibt, sagt `Marken.FARBEN` und `Marken.BREITEN` —
   * eine zweite Liste im Kern wäre ein zweiter Katalog (CLAUDE.md §8).
   */
  type Eintrag = { steuerung: Steuerung; name: string; gesehen: boolean;
                   werkzeug: string; farbe: string; dicke: number };

  /* Alle Flächen, die es gerade gibt — in der Reihenfolge ihres Auftauchens.
     Mehrere sind der Normalfall: eine Seite kann drei Blätter tragen. */
  const flaechen: Eintrag[] = [];

  /** Wer zuletzt berührt wurde. `-1` heisst „noch keine". */
  let zuletzt = -1;

  const horcher: Array<() => void> = [];
  const melden = (): void => {
    for (const h of horcher) { try { h(); } catch { /* ein Horcher reisst nicht alles mit */ } }
  };

  const finde = (steuerung: Steuerung): number =>
    flaechen.findIndex(f => f.steuerung === steuerung);

  /**
   * TOTE FLÄCHEN WEGRÄUMEN.
   *
   * Niemand meldet eine Fläche ab. `abmelden` gibt es, aber der Aufrufer
   * fehlt: eine Seite wird neu gezeichnet, das alte Blatt fällt aus dem
   * Baum, und keine Zeile Code merkt das. Gemessen wuchs die Liste bei
   * jedem Seitenwechsel um eins — und `zuletzt` blieb auf der ERSTEN, weil
   * `melde` den Zeiger nur setzt, wenn es noch keinen gab. Nach fünf
   * Wechseln hätte der Stift im Menüband auf ein Blatt gewirkt, das seit
   * vier Wechseln nicht mehr auf dem Bildschirm steht.
   *
   * Statt einen Abmelde-Aufruf an jede Stelle zu setzen, die eine Seite neu
   * zeichnet — und die nächste zu vergessen — fragt es das Element selbst.
   * `isConnected` ist die einzige Quelle, die nicht vergessen werden kann.
   *
   * WANN EINE FLÄCHE ALS TOT GILT — DREI WEGE ZUR SELBEN ANTWORT
   *
   * Nicht jede unverbundene Fläche ist tot. `Marken.leiste()` meldet die
   * Fläche, WÄHREND das Blatt noch ausserhalb des Dokuments zusammengebaut
   * wird (blatt.ts baut in eine lose Hülle und hängt sie erst danach ein).
   * In diesem Moment ist `isConnected` falsch, und wer da wegräumt, wirft
   * die frische Fläche weg, bevor sie jemand gesehen hat.
   *
   * Drei Merkmale, von denen jedes für sich genügt:
   *
   *   `gesehen`      sie hing schon einmal drin, also kann sie herausfallen
   *   `jemandLebt`   eine ANDERE Fläche hängt gerade drin — dann ist der
   *                  Aufbau fertig, und wer jetzt draussen ist, ist alt
   *   nicht die letzte   nur die zuletzt gemeldete kann mitten im Aufbau
   *                  stecken; alle davor sind es sicher nicht
   *
   * Der erste allein reichte NICHT, und das kostete einen falschen grünen
   * Punkt. `gesehen` wird nur gesetzt, wenn jemand nachfragt, solange die
   * Fläche hängt. Beim Wechsel von Seite zu Seite fragt niemand: das
   * Menüband zeichnet nur neu, wenn sich ändert, OB eine Seite offen ist,
   * und das bleibt gleich. In meiner Handmessung fragte das Messgerät nach
   * jedem Wechsel — und setzte damit selbst, was es zu prüfen glaubte. Erst
   * test247 §11 ohne diese Zwischenfrage zeigte drei Flächen bei einem
   * Blatt.
   */
  const lebt = (e: Eintrag): boolean => e.steuerung.flaeche?.isConnected === true;

  let raeumt = false;
  const aufraeumen = (): void => {
    if (raeumt || !flaechen.length) return;
    raeumt = true;
    try {
      const gemeint = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] as Eintrag : null;
      let jemandLebt = false;
      for (const e of flaechen) { if (lebt(e)) { e.gesehen = true; jemandLebt = true; } }
      const letzte = flaechen[flaechen.length - 1];
      let weg = 0;
      for (let i = flaechen.length - 1; i >= 0; i--) {
        const e = flaechen[i] as Eintrag;
        if (!e.steuerung.flaeche) continue;     /* ohne Element nicht prüfbar */
        if (lebt(e)) continue;
        if (!e.gesehen && !jemandLebt && e === letzte) continue;
        flaechen.splice(i, 1); weg++;
      }
      if (!weg) return;
      const wieder = gemeint ? flaechen.indexOf(gemeint) : -1;
      zuletzt = wieder >= 0 ? wieder : (flaechen.length ? flaechen.length - 1 : -1);
      melden();
    } finally { raeumt = false; }
  };

  /**
   * Eine Fläche gibt es jetzt.
   *
   * Wird beim Zeichnen gerufen, nicht beim Anfassen. Die erste Fläche einer
   * Seite wird gleich die gemeinte — bei genau einer ist die Frage „welche"
   * ohnehin beantwortet, und ohne das müsste man erst hineinklicken, bevor
   * das Menüband etwas kann.
   */
  const melde = (steuerung: Steuerung, name = 'Fläche'): void => {
    if (!steuerung || typeof steuerung.setzeWerkzeug !== 'function') return;
    aufraeumen();
    if (finde(steuerung) >= 0) return;
    flaechen.push({ steuerung, name: String(name), werkzeug: 'schreiben',
                    farbe: '', dicke: 0,
                    gesehen: steuerung.flaeche?.isConnected === true });
    /* Eine neue Fläche wird die gemeinte, wenn keine mehr da ist. Ohne das
       zeigte der Zeiger nach einem Seitenwechsel ins Leere, obwohl gerade
       ein frisches Blatt vor einem liegt. */
    if (zuletzt < 0 || zuletzt >= flaechen.length) zuletzt = flaechen.length - 1;
    melden();
  };

  /** Jemand hat sie angefasst — ab jetzt ist sie gemeint. */
  const beruehrt = (steuerung: Steuerung): void => {
    const i = finde(steuerung);
    if (i < 0 || i === zuletzt) return;
    zuletzt = i;
    melden();
  };

  /**
   * Sie ist weg.
   *
   * Wichtig für den Fall, dass die gemeinte Fläche verschwindet: dann rückt
   * die nächste nach, statt dass ein Zeiger auf etwas Gelöschtes stehen
   * bleibt. Ein Knopf, der auf eine entfernte Fläche zeigt, tut still nichts
   * — und das ist genau die Sorte Fehler, die diese Datei verhindern soll.
   */
  const abmelden = (steuerung: Steuerung): void => {
    const i = finde(steuerung);
    if (i < 0) return;
    flaechen.splice(i, 1);
    if (flaechen.length === 0) zuletzt = -1;
    else if (zuletzt >= flaechen.length) zuletzt = flaechen.length - 1;
    else if (i < zuletzt) zuletzt--;
    melden();
  };

  /** Alle abmelden — beim Seitenwechsel. */
  const leeren = (): void => {
    if (!flaechen.length) return;
    flaechen.length = 0;
    zuletzt = -1;
    melden();
  };

  /** Die gemeinte Fläche, oder `null`. */
  const aktive = (): Steuerung | null => {
    aufraeumen();
    return zuletzt >= 0 && zuletzt < flaechen.length ? (flaechen[zuletzt] as Eintrag).steuerung : null;
  };

  /** Gibt es überhaupt eine? */
  const da = (): boolean => aktive() !== null;

  /** Wie viele, und wie heissen sie — für einen ehrlichen Hinweis. */
  const anzahl = (): number => { aufraeumen(); return flaechen.length; };
  const namen = (): string[] => { aufraeumen(); return flaechen.map(f => f.name); };

  /** Welches Werkzeug ist an der gemeinten Fläche gerade an? */
  const jetzt = (): string => {
    aufraeumen();
    return zuletzt >= 0 && zuletzt < flaechen.length ? (flaechen[zuletzt] as Eintrag).werkzeug : '';
  };

  /**
   * Welches Werkzeug ist an DIESER Fläche an — nicht an der gemeinten.
   *
   * Die Leiste an einem Blatt braucht ihren eigenen Stand. Läge auf einer
   * Seite ein zweites Blatt, würde sie mit `jetzt()` das Werkzeug des
   * anderen anzeigen: eine Leiste, die etwas anderes behauptet als das
   * Blatt darunter tut.
   */
  const werkzeugVon = (steuerung: Steuerung): string => {
    const i = finde(steuerung);
    return i < 0 ? '' : (flaechen[i] as Eintrag).werkzeug;
  };

  /**
   * Ein Werkzeug wählen.
   *
   * Gibt `false` zurück, wenn es keine Fläche gibt — der Aufrufer soll das
   * sagen können, statt so zu tun, als sei etwas passiert.
   */
  const setze = (werkzeug: string): boolean => {
    const e = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] as Eintrag : null;
    if (!e || typeof e.steuerung.setzeWerkzeug !== 'function') return false;
    try { e.steuerung.setzeWerkzeug(werkzeug); } catch { return false; }
    e.werkzeug = String(werkzeug);
    melden();
    return true;
  };

  /**
   * Die Leiste hat selbst umgeschaltet — nur mitschreiben, nicht nochmal
   * setzen.
   *
   * Der Unterschied zu `setze` ist die Richtung: dort kommt der Befehl von
   * aussen und geht an die Fläche, hier ist er an der Fläche schon
   * passiert. Wer hier `setzeWerkzeug` nochmal riefe, würde die Auswahl
   * löschen (das tut sie bei jedem Wechsel) — bei einem Wechsel, den es gar
   * nicht gab.
   */
  const uebernehme = (steuerung: Steuerung, werkzeug: string): void => {
    const i = finde(steuerung);
    if (i < 0) return;
    (flaechen[i] as Eintrag).werkzeug = String(werkzeug);
    if (zuletzt !== i) zuletzt = i;
    melden();
  };

  /**
   * Farbe und Strichstärke gehen denselben Weg wie das Werkzeug — beide
   * Richtungen, und beide werden gemerkt.
   *
   * Der erste Entwurf reichte nur weiter, ohne zu merken. Damit hätte das
   * Menüband fünf Farbknöpfe gezeigt und keinen davon markiert, während
   * die Leiste an der Fläche sehr wohl einen markiert — genau der Fehler,
   * der beim Werkzeug schon einmal auf dem Bildschirmfoto stand.
   */
  const setzeFarbe = (wert: string): boolean => {
    const e = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] as Eintrag : null;
    if (!e || typeof e.steuerung.setzeFarbe !== 'function') return false;
    try { e.steuerung.setzeFarbe(wert); } catch { return false; }
    e.farbe = String(wert);
    melden();
    return true;
  };
  const setzeStrich = (wert: number): boolean => {
    const e = zuletzt >= 0 && zuletzt < flaechen.length ? flaechen[zuletzt] as Eintrag : null;
    if (!e || typeof e.steuerung.setzeStrich !== 'function') return false;
    try { e.steuerung.setzeStrich(wert); } catch { return false; }
    e.dicke = Number(wert);
    melden();
    return true;
  };

  /** Die Leiste hat selbst umgeschaltet — nur mitschreiben (wie `uebernehme`). */
  const uebernehmeFarbe = (steuerung: Steuerung, wert: string): void => {
    const i = finde(steuerung);
    if (i < 0) return;
    (flaechen[i] as Eintrag).farbe = String(wert);
    if (zuletzt !== i) zuletzt = i;
    melden();
  };
  const uebernehmeStrich = (steuerung: Steuerung, wert: number): void => {
    const i = finde(steuerung);
    if (i < 0) return;
    (flaechen[i] as Eintrag).dicke = Number(wert);
    if (zuletzt !== i) zuletzt = i;
    melden();
  };

  /** Was ist an — an der gemeinten Fläche, und an einer bestimmten. */
  const jetztFarbe = (): string => { aufraeumen();
    return zuletzt >= 0 && zuletzt < flaechen.length ? (flaechen[zuletzt] as Eintrag).farbe : ''; };
  const jetztDicke = (): number => { aufraeumen();
    return zuletzt >= 0 && zuletzt < flaechen.length ? (flaechen[zuletzt] as Eintrag).dicke : 0; };
  const farbeVon = (steuerung: Steuerung): string => {
    const i = finde(steuerung);
    return i < 0 ? '' : (flaechen[i] as Eintrag).farbe;
  };
  const dickeVon = (steuerung: Steuerung): number => {
    const i = finde(steuerung);
    return i < 0 ? 0 : (flaechen[i] as Eintrag).dicke;
  };

  /** Zurück, Vor, Löschen — dieselben drei wie an der Leiste. */
  const ruf = (was: 'undo' | 'redo' | 'deleteSelection'): boolean => {
    const s = aktive();
    const fn = s && (s as any)[was];
    if (typeof fn !== 'function') return false;
    try { fn.call(s); return true; } catch { return false; }
  };

  /** Bescheid, wenn sich Fläche oder Werkzeug ändern. */
  const horche = (fn: () => void): void => {
    if (typeof fn === 'function' && !horcher.includes(fn)) horcher.push(fn);
  };

  /**
   * Nicht mehr zuhören.
   *
   * Jede Leiste hängt einen Horcher ein, und jede Leiste hält damit ihre
   * Knöpfe fest. Ohne diesen Weg zurück bliebe von jedem Blatt, das je
   * gezeichnet wurde, ein Stück Seite im Speicher liegen — dieselbe
   * Rechnung wie bei den toten Flächen oben, nur eine Ebene höher.
   */
  const vergiss = (fn: () => void): void => {
    const i = horcher.indexOf(fn);
    if (i >= 0) horcher.splice(i, 1);
  };

  return { melde, beruehrt, abmelden, leeren, aktive, da, anzahl, namen,
           jetzt, werkzeugVon, setze, uebernehme,
           setzeFarbe, setzeStrich, uebernehmeFarbe, uebernehmeStrich,
           jetztFarbe, jetztDicke, farbeVon, dickeVon,
           ruf, horche, vergiss };
})();

(window as any).Zeichenziel = Zeichenziel;
