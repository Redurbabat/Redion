/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/ink/shapes.ts (npm run bauen:ts). */
/* ============================================================================
 * core/ink/shapes.ts — Formerkennung fuer Freihandstriche (E355)
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/ink/shapes.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/ink/shapes.js`.
 * ----------------------------------------------------------------------------
 * Wer in GoodNotes einen Kreis zieht und am Ende kurz haelt, bekommt einen
 * Kreis. Diese Datei beantwortet nur die geometrische Frage: Ist dieser
 * Linienzug eine LINIE, eine ELLIPSE (ein Kreis), ein RECHTECK oder ein
 * DREIECK (E471) — und wenn ja, mit welchen zwei Punkten? Ob gehalten wurde, ob der Schalter an ist,
 * welches Werkzeug fuehrte: das entscheidet die Zeichenschicht. Diese Datei
 * kennt weder Store noch DOM noch Zeit (E125, wie geometry.ts).
 *
 * Die Schwellen sind Erfahrungswerte, keine Masse. Sie sind so gewaehlt, dass
 * eine mit der Hand gezogene Form erkannt wird und ein Gekritzel nicht — die
 * Prueflaeufe in test347 halten beide Seiten fest.
 * ==========================================================================*/

type ShapePoint = [number, number];
type ShapeArt = 'line' | 'ellipse' | 'rectangle' | 'triangle';
/** `dreh` steht nur an einem gedrehten Dreieck (E478) — im Uhrzeigersinn,
 *  wie SVGs `rotate` und wie das Feld an der Marke (E466). */
type Shape = { art: ShapeArt; pts: ShapePoint[]; dreh?: number };

const InkShapes = (() => {
  const points = (raw: unknown): ShapePoint[] => !Array.isArray(raw) ? [] : raw
    .filter((point: unknown) => Array.isArray(point) && point.length >= 2)
    .map((point: any[]) => [Number(point[0]) || 0, Number(point[1]) || 0] as ShapePoint);

  const distanceToSegment = (point: ShapePoint, start: ShapePoint, end: ShapePoint): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
    const amount = Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point[0] - (start[0] + amount * dx), point[1] - (start[1] + amount * dy));
  };

  const pathLength = (input: ShapePoint[]): number => {
    let sum = 0;
    for (let i = 1; i < input.length; i++)
      sum += Math.hypot(input[i]![0] - input[i - 1]![0], input[i]![1] - input[i - 1]![1]);
    return sum;
  };

  const r2 = (value: number): number => Math.round(value * 100) / 100;

  /**
   * ERKENNEN. Gibt die Form mit ihren zwei Punkten zurueck — Linie: Anfang
   * und Ende; Ellipse und Rechteck: die zwei Ecken ihres Kastens — oder
   * null, wenn der Zug keine der drei Formen ist.
   *
   *   Linie:    die Sehne ist fast der ganze Weg, und kein Punkt liegt weit
   *             neben ihr.
   *   Rechteck: der Zug ist geschlossen, fast alle Punkte liegen nahe an den
   *             vier Kanten des Kastens, und jede Ecke ist besucht.
   *   Ellipse:  der Zug ist geschlossen, und die Punkte halten ihren Abstand
   *             zur Mitte (auf die Halbachsen bezogen). Ist der Kasten fast
   *             quadratisch, wird ein Kreis daraus — der Kasten wird zum
   *             Quadrat um dieselbe Mitte.
   */
  const recognize = (raw: unknown): Shape | null => {
    const input = points(raw);
    const n = input.length;
    if (n < 8) return null;
    const xs = input.map(p => p[0]);
    const ys = input.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const w = x1 - x0, h = y1 - y0;
    const diag = Math.hypot(w, h);
    if (diag < 12) return null;
    const first = input[0]!;
    const last = input[n - 1]!;
    const chord = Math.hypot(last[0] - first[0], last[1] - first[1]);
    const length = pathLength(input);
    if (length <= 0) return null;

    /* LINIE */
    if (chord >= 0.9 * length) {
      let worst = 0;
      for (const p of input) worst = Math.max(worst, distanceToSegment(p, first, last));
      if (worst <= Math.max(3, 0.05 * length))
        return { art: 'line', pts: [[r2(first[0]), r2(first[1])], [r2(last[0]), r2(last[1])]] };
      return null;
    }

    /* GESCHLOSSEN? Anfang und Ende nahe beieinander, und der Weg ist
       laenger als der Umfang eines Halbbogens — sonst ist es ein Haken. */
    const closed = chord <= 0.2 * diag && length >= 1.5 * diag;
    if (!closed) return null;

    /* RECHTECK: fast alle Punkte nahe an den Kanten, und jede Ecke wirklich
       besucht. Die Ecke ist das Mass: ein Kreis kommt seinen Kastenecken nie
       naeher als 0,41 mal seinen Radius — bei 0,08 der Diagonale bleibt er
       draussen (der erste Entwurf liess ihn mit 0,18 hinein, und test347 §1
       sah einen Kreis als Rechteck). */
    const nah = 0.06 * diag;
    const anKante = input.filter(p => Math.min(
      Math.abs(p[0] - x0), Math.abs(p[0] - x1), Math.abs(p[1] - y0), Math.abs(p[1] - y1)) <= nah).length;
    const ecken: ShapePoint[] = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    const eckenBesucht = ecken.every(e => input.some(p => Math.hypot(p[0] - e[0], p[1] - e[1]) <= 0.08 * diag));
    if (anKante >= 0.85 * n && eckenBesucht)
      return { art: 'rectangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };

    /* ══ DREIECK (E471) ═══════════════════════════════════════════════════
       Vor der Ellipse, weil ein Dreieck seinen Abstand zur Mitte NICHT
       haelt und sonst als Ellipse durchginge, wenn die Schwelle je
       weicher wird. Drei Ecken werden so gesucht, wie man es von Hand
       taete: der Punkt am weitesten vom Anfang (B), dann der Punkt am
       weitesten von der Strecke A–B (C). Bei einem Dreieck sind das seine
       Ecken; bei allem anderen liegen die uebrigen Punkte nicht auf den
       drei Kanten.

       NUR AUFRECHTE DREIECKE. Redions `triangle`-Marke ist gleichschenklig
       mit der Spitze oben in der Mitte (E465) — sie kann gar keine andere
       Lage beschreiben. Ein auf den Kopf gezogenes Dreieck bekaeme also
       eine Spitze, die es nicht gezogen hat; darum bleibt es ein Strich.
       Was fehlt, steht in L133. */
    const eckA = first;
    let eckB = first, weit = 0;
    for (const p of input) {
      const d = Math.hypot(p[0] - eckA[0], p[1] - eckA[1]);
      if (d > weit) { weit = d; eckB = p; }
    }
    let eckC = first, weitC = 0;
    for (const p of input) {
      const d = distanceToSegment(p, eckA, eckB);
      if (d > weitC) { weitC = d; eckC = p; }
    }
    if (weitC > 0.12 * diag) {
      const kanten: [ShapePoint, ShapePoint][] = [[eckA, eckB], [eckB, eckC], [eckC, eckA]];
      const nahKante = 0.09 * diag;
      const anDreieck = input.filter(p =>
        Math.min(...kanten.map(k => distanceToSegment(p, k[0], k[1]))) <= nahKante).length;
      /* Die Flaeche sagt, dass es KEIN Rechteck ist: ein Dreieck deckt
         hoechstens die halbe Kastenflaeche, ein Rechteck fast die ganze. */
      const flaeche = Math.abs((eckB[0] - eckA[0]) * (eckC[1] - eckA[1])
                             - (eckC[0] - eckA[0]) * (eckB[1] - eckA[1])) / 2;
      const kasten = Math.max(1, w * h);
      const drei = [eckA, eckB, eckC].sort((p, q) => p[1] - q[1]);
      const spitze = drei[0]!, unten1 = drei[1]!, unten2 = drei[2]!;
      const aufrecht = spitze[1] <= y0 + 0.25 * h
        && unten1[1] >= y0 + 0.7 * h && unten2[1] >= y0 + 0.7 * h
        && Math.abs(spitze[0] - (x0 + w / 2)) <= 0.28 * w;
      const istDreieck = anDreieck >= 0.82 * n && flaeche <= 0.62 * kasten;
      /* ══ EIN GEDREHTES DREIECK (E478) ═══════════════════════════════════
         E471 erkannte nur AUFRECHTE Dreiecke, und der Grund stand in L133:
         die Marke `triangle` ist gleichschenklig mit der Spitze oben in
         der Mitte ihres Kastens — sie konnte gar keine andere Lage
         beschreiben. Seit E466 kann sie es doch, denn `dreh` steht an
         jeder Marke; und seit E474 rechnet die Geometrie damit, statt die
         Drehung nur anzuzeigen. Also kann ein Dreieck jetzt liegen, wie es
         gezogen wurde.

         WELCHE ECKE IST DIE SPITZE? Die, an der die zwei anliegenden
         Seiten am gleichsten lang sind — an ihr ist die Figur am
         gleichschenkligsten, und genau das ist die Form, die die Marke
         zeichnen kann. Sind die beiden Schenkel zu verschieden, wird gar
         kein Dreieck daraus: eine ungleichschenklige Figur zu einer
         gleichschenkligen zu machen hiesse, etwas anderes hinzustellen,
         als der Mensch gezogen hat — dann bleibt es ein Strich, wie vor
         E471 auch.

         Der aufrechte Fall oben bleibt Zeile für Zeile, wie er war: keine
         Drehung, kein neues Feld, und `test445` misst weiter dieselben
         Zahlen. */
      /* NULL heisst hier NICHT „keine Form", sondern „kein Dreieck": der
         Zug laeuft danach weiter durch Ellipse und Rechteck, genau wie
         vor E478. Ein `return null` an dieser Stelle haette die zwei
         Zweige darunter stillgelegt. */
      const gedrehtesDreieck = (): Shape | null => {
        if (!istDreieck) return null;
        const seite = (p: ShapePoint, q: ShapePoint): number => Math.hypot(p[0] - q[0], p[1] - q[1]);
        const ecken: ShapePoint[] = [eckA, eckB, eckC];
        /* ALLE DREI ECKEN WERDEN DURCHGERECHNET, nicht nur die scheinbar
           beste. Der Grund steht im Bild `bilder/e478-dreiecke.png`, und
           er war nicht vorherzusehen: bei einem FAST GLEICHSEITIGEN
           Dreieck sind alle drei Ecken gleich gute Spitzen, die Wahl
           zwischen ihnen entscheidet ein Hundertstel Laengenunterschied —
           und die drei Antworten liegen 120° auseinander. Ein aufrecht
           gezogenes Dreieck kam so mit `dreh: −120` heraus. */
        type Lage = { fehler: number; grad: number; breite: number; hoehe: number; cx: number; cy: number };
        const lagen: Lage[] = [];
        for (let i = 0; i < 3; i++) {
          const S = ecken[i]!, B1 = ecken[(i + 1) % 3]!, B2 = ecken[(i + 2) % 3]!;
          const l1 = seite(S, B1), l2 = seite(S, B2);
          const fehler = Math.abs(l1 - l2) / Math.max(1, Math.max(l1, l2));
          const M: ShapePoint = [(B1[0] + B2[0]) / 2, (B1[1] + B2[1]) / 2];
          const breite = seite(B1, B2);
          const laenge = seite(S, M);
          const hoehe = distanceToSegment(S, B1, B2) || laenge;
          if (!(breite > 1) || !(hoehe > 1) || !(laenge > 0)) continue;
          /* Der Weg von der Grundseite zur Spitze ist im ungedrehten Bild
             (0,−1). Gesucht ist der Winkel, der ihn dorthin dreht:
             rotate(θ)·(0,−1) = (sin θ, −cos θ). */
          const ux = (S[0] - M[0]) / laenge, uy = (S[1] - M[1]) / laenge;
          let grad = Math.atan2(ux, -uy) * 180 / Math.PI;
          if (grad > 180) grad -= 360;
          if (grad <= -180) grad += 360;
          lagen.push({ fehler, grad, breite, hoehe,
            cx: M[0] + ux * hoehe / 2, cy: M[1] + uy * hoehe / 2 });
        }
        if (!lagen.length) return null;
        /* Die gleichschenkligste gewinnt — und unter denen, die es fast
           gleich gut sind, die mit der KLEINSTEN DREHUNG. Ein Dreieck,
           das man gerade hinstellen kann, wird gerade hingestellt: das
           ist dieselbe Marke, ein Feld weniger, und es ist das, was der
           Mensch gezeichnet hat. */
        const besterFehler = Math.min(...lagen.map(l => l.fehler));
        const w = lagen.filter(l => l.fehler <= besterFehler + 0.06)
          .sort((a, b) => Math.abs(a.grad) - Math.abs(b.grad))[0]!;
        const { grad, breite, hoehe, cx, cy } = w;
        /* Fast aufrecht heisst aufrecht: ein Dreieck mit `dreh: 0.7` waere
           dasselbe Bild mit einem Feld mehr in jeder Sicherung. */
        if (Math.abs(grad) < 4) return { art: 'triangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };

        /* KEINE WEITERE PRUEFUNG AN DIESER STELLE, und das ist eine
           Entscheidung, keine Luecke (E478).

           Hier stand einmal eine Passprobe: die drei Ecken der fertigen
           Marke gegen die drei gefundenen Ecken des Zuges, und bei mehr
           als einem Achtel der Diagonalen Abweichung kein Dreieck. Sie
           ist wieder heraus, weil `test451` sie ABGESCHALTET hat und
           trotzdem gruen blieb — sie hat nie etwas ausgesiebt.

           Der Grund liegt in der Rechnung: die Spitze wird an der Ecke
           gewaehlt, an der die Figur am gleichschenkligsten ist, und die
           Marke sitzt dann von selbst nahe am Gezogenen. Nachgerechnet
           an drei absichtlich schiefen Dreiecken: hoechstens fuenf
           Prozent der Diagonalen daneben, die Schwelle lag bei
           zwoelfeinhalb. Ein Waechter, der nie rot werden kann, ist eine
           Behauptung (§55.2) — und schlimmer als keiner, weil der
           naechste Leser den Fall fuer abgedeckt haelt.

           Was WIRKLICH aussiebt, stehen zwei Bildschirmlaengen weiter
           oben: 82 % der Punkte an den drei Kanten und hoechstens 62 %
           der Kastenflaeche. Was das besteht, ist ein Dreieck, und ein
           Dreieck wird hier gleichschenklig — wie ein Rechteck rechtwinklig
           wird und ein Kreis rund. */
        return { art: 'triangle', dreh: r2(grad),
          pts: [[r2(cx - breite / 2), r2(cy - hoehe / 2)], [r2(cx + breite / 2), r2(cy + hoehe / 2)]] };
      };
      /* ERST DER GEDREHTE ZWEIG, DANN DER AUFRECHTE (E478). Andersherum
         war es beim ersten Lauf, und `test451` fand sofort, warum das
         falsch ist: die alte Aufrecht-Probe fragt die OBERSTE der drei
         Ecken, und bei 120° oder 15° steht dort zufaellig eine Grundecke
         nahe genug an der Mitte. Das Dreieck galt als aufrecht, und sein
         Winkel fiel weg — ein gedrehtes Dreieck, das gerade dasteht.
         Der gedrehte Zweig gibt selbst die aufrechte Form zurueck, wenn
         der Winkel unter vier Grad liegt; die alte Probe bleibt darunter
         als Auffangnetz fuer Figuren, an denen er nichts findet. */
      const schief = gedrehtesDreieck();
      if (schief) return schief;
      if (istDreieck && aufrecht)
        return { art: 'triangle', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
    }

    /* ELLIPSE: die Punkte halten ihren Abstand zur Mitte. */
    const cx = x0 + w / 2, cy = y0 + h / 2;
    const rx = Math.max(1, w / 2), ry = Math.max(1, h / 2);
    let abweichung = 0;
    for (const p of input) abweichung += Math.abs(Math.hypot((p[0] - cx) / rx, (p[1] - cy) / ry) - 1);
    abweichung /= n;
    if (abweichung <= 0.12) {
      if (Math.abs(w - h) <= 0.12 * Math.max(w, h)) {
        const r = (w + h) / 4;
        return { art: 'ellipse', pts: [[r2(cx - r), r2(cy - r)], [r2(cx + r), r2(cy + r)]] };
      }
      return { art: 'ellipse', pts: [[r2(x0), r2(y0)], [r2(x1), r2(y1)]] };
    }
    return null;
  };

  return { recognize };
})();

(window as any).InkShapes = InkShapes;
