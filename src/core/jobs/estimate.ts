/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/jobs/estimate.ts (npm run bauen:ts). */
/* ============================================================================
 * core/jobs/estimate.js — was ein langer Auftrag kosten wird
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/jobs/estimate.ts`. `npm run bauen:ts` schreibt
 * daraus diese Datei.
 * ==========================================================================*/

/* ===========================================================================
 * DIE SCHÄTZUNG VOR DEM START (E373, L114 Punkt 7)
 * ===========================================================================
 *
 * DAS PROBLEM. Wer vierzig Skripte à achtzig Seiten in Redion zieht, erfährt
 * erst hinterher, dass das zwanzig Minuten dauert. Der Fortschritt steht in
 * der Zeile — aber eine Zahl, die von 0 nach 3200 kriecht, sagt nichts
 * darüber, ob man Kaffee holen oder das Gerät stehen lassen soll.
 *
 * WAS DIESER KERN IST UND WAS NICHT. Er rechnet, und sonst nichts: kein
 * Zugriff auf die Ablage, keine Uhr, kein DOM. Die Erfahrung kommt als
 * Objekt herein und geht als Objekt hinaus; wer sie aufbewahrt, ist der
 * Bereich. Dieselbe Bauform wie `core/learning`, `core/calendar` und
 * `core/planning`.
 *
 * WARUM ERFAHRUNG UND KEINE KONSTANTEN. Eine feste Zahl „0,35 s je Seite"
 * stimmt auf dem Gerät, auf dem sie gemessen wurde, und sonst nirgends —
 * ein Telefon von 2019 und ein Rechner von 2025 liegen um den Faktor fünf
 * auseinander. Deshalb misst Redion beim Arbeiten mit und rechnet die
 * nächste Schätzung aus dem, was gerade wirklich passiert ist.
 *
 * DIE STARTWERTE unten sind gemessen, nicht geraten — am 3. September 2026,
 * im Prüfcontainer, mit den Läufen aus ENTSCHEIDUNGEN.md E373. Sie gelten
 * nur so lange, bis ein echter Lauf sie ersetzt; `laeufe: 0` sagt, dass noch
 * keiner stattgefunden hat, und die Oberfläche darf das dazusagen.
 *
 * UND DIE WICHTIGSTE REGEL DIESES BOGENS: Unter der Schwelle sagt die
 * Schätzung GAR NICHTS. Eine Anzeige, die immer etwas anzeigt, wird nicht
 * gelesen — das haben E284, E286, E288, E289 und E290 je einmal gekostet.
 * Wer drei Dateien einliest, will nichts über Minuten hören.
 */

type ImportArt = 'pdf' | 'bild' | 'text' | 'tabelle' | 'office' | 'sonst';

interface Posten {
  art: ImportArt;
  /** Rohgrösse in Byte, wie sie im ZIP-Verzeichnis steht. */
  bytes: number;
}

interface Erfahrung {
  /** Millisekunden je Datei, nach Art. */
  jeDatei: Record<ImportArt, number>;
  /** Millisekunden je PDF-Seite — der teure Teil. */
  jeSeite: number;
  /** Byte je PDF-Seite. Daraus wird die Seitenzahl geschätzt, BEVOR das
      PDF geöffnet ist; vorher weiss niemand, wie viele es sind. */
  bytesJeSeite: number;
  /** Wie viele echte Läufe eingegangen sind. 0 = nur die Startwerte. */
  laeufe: number;
}

interface Schaetzung {
  /** Erwartete Dauer in Millisekunden. */
  ms: number;
  /** Wie viele PDF-Seiten darin vermutet werden. */
  seiten: number;
  /** Wie viele Dateien gezählt wurden. */
  dateien: number;
  /** Steht die Schätzung auf echten Läufen? */
  gemessen: boolean;
}

const Schaetzer = (() => {

  /* Unter dieser Dauer wird nichts über Zeit gesagt. Zwanzig Sekunden sind
     die Grenze, ab der ein Mensch anfängt, auf die Uhr zu sehen. */
  const SCHWELLE_MS = 20_000;

  /* Wie stark ein neuer Lauf die Erfahrung verschiebt. Beim ersten zählt er
     ganz, danach immer weniger — nach acht Läufen ändert einer noch ein
     Achtel. So folgt die Zahl einem neuen Gerät schnell und zappelt bei
     einem Ausreisser nicht. */
  const GEDAECHTNIS = 8;

  /* DIE STARTWERTE, UND WOHER JEDER KOMMT.
     Das ist keine Formalie: eine Zahl ohne Herkunft ist eine Erfindung, und
     eine Erfindung in einer Schätzung merkt niemand.

       text: 3.4      GEMESSEN am 3. September 2026 im Prüfcontainer —
                      20/60/120 Markdown-Dateien in einer ZIP ergaben
                      3.6 / 3.1 / 3.5 ms je Datei, also flach.
       jeSeite: 350   NICHT selbst gemessen. Die Zahl stammt aus der
       bytesJeSeite   Beobachtung, die beim Bau von E350 in LUECKEN.md L114
                      Punkt 7 festgehalten wurde („je Seite rund 0,35 s und
                      200 KB"). Der Versuch, sie hier nachzumessen, ist
                      GESCHEITERT: die PDF-Umwandlung kam im Container auch
                      bei vier Seiten in zwei Minuten nicht durch. Ob das an
                      der Kopflosigkeit liegt oder am gebauten Prüf-PDF, ist
                      offen und steht in L117.
       bild/tabelle/  Aus dem Verhältnis zu `text` geschätzt. Sie sind die
       office/sonst   unwichtigsten Zahlen hier — ihr Anteil an einem langen
                      Import ist klein, und der erste echte Lauf ersetzt sie.

     Genau deshalb lernt dieser Kern. Ein Startwert muss nicht stimmen, er
     muss nur einen Anfang machen, den die Wirklichkeit korrigiert — und
     `gemessen: false` sagt der Oberfläche, dass sie das dazuschreiben soll,
     solange noch kein Lauf eingegangen ist. */
  const STARTWERT: Erfahrung = {
    jeDatei: { pdf: 40, bild: 25, text: 3.4, tabelle: 12, office: 60, sonst: 8 },
    jeSeite: 350,
    bytesJeSeite: 200 * 1024,
    laeufe: 0,
  };

  const frisch = (): Erfahrung => ({
    jeDatei: { ...STARTWERT.jeDatei },
    jeSeite: STARTWERT.jeSeite,
    bytesJeSeite: STARTWERT.bytesJeSeite,
    laeufe: 0,
  });

  /** Eine gespeicherte Erfahrung wieder brauchbar machen — fehlende Felder
      kommen aus dem Startwert, unsinnige ebenso. Eine Zahl aus der Ablage
      ist eine Behauptung, kein Versprechen (E284). */
  const ausAblage = (roh: unknown): Erfahrung => {
    const e = frisch();
    if (!roh || typeof roh !== 'object') return e;
    const r = roh as Record<string, unknown>;
    const zahl = (w: unknown, ersatz: number): number => {
      const n = Number(w);
      return Number.isFinite(n) && n > 0 && n < 3_600_000 ? n : ersatz;
    };
    const jd = (r['jeDatei'] || {}) as Record<string, unknown>;
    (Object.keys(e.jeDatei) as ImportArt[]).forEach(a => {
      e.jeDatei[a] = zahl(jd[a], e.jeDatei[a]);
    });
    e.jeSeite = zahl(r['jeSeite'], e.jeSeite);
    e.bytesJeSeite = zahl(r['bytesJeSeite'], e.bytesJeSeite);
    const l = Number(r['laeufe']);
    e.laeufe = Number.isFinite(l) && l > 0 ? Math.min(Math.floor(l), 9999) : 0;
    return e;
  };

  /** Die Art aus dem Dateinamen. Nur der Name — die Bytes kennt der
      Aufrufer, den Inhalt kennt hier niemand. */
  const artVon = (name: string): ImportArt => {
    const n = String(name || '').toLowerCase();
    if (/\.pdf$/.test(n)) return 'pdf';
    if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/.test(n)) return 'bild';
    if (/\.(md|markdown|txt|html?|htm)$/.test(n)) return 'text';
    if (/\.(csv|tsv)$/.test(n)) return 'tabelle';
    if (/\.(xlsx|xlsm|ods|docx|epub|pptx)$/.test(n)) return 'office';
    return 'sonst';
  };

  /** Wie viele Seiten in einem PDF dieser Grösse zu erwarten sind.
      Mindestens eine — ein PDF ohne Seite gibt es nicht. */
  const seitenAus = (bytes: number, e: Erfahrung): number =>
    Math.max(1, Math.round(bytes / Math.max(1024, e.bytesJeSeite)));

  const schaetze = (posten: Posten[], erfahrung?: Erfahrung): Schaetzung => {
    const e = erfahrung || frisch();
    let ms = 0, seiten = 0;
    for (const p of posten) {
      const art: ImportArt = (p && p.art) in e.jeDatei ? p.art : 'sonst';
      ms += e.jeDatei[art];
      if (art === 'pdf') {
        const s = seitenAus(Math.max(0, Number(p.bytes) || 0), e);
        seiten += s;
        ms += s * e.jeSeite;
      }
    }
    return { ms: Math.round(ms), seiten, dateien: posten.length, gemessen: e.laeufe > 0 };
  };

  /* --- Der Satz für Menschen ---------------------------------------------
     Deutsch, gerundet, und ohne Nachkommastellen: „rund 4 Minuten" hilft,
     „3,7 Minuten" tut nur so. Über einer Stunde wird in Stunden gerundet,
     denn dort ist die Minute ohnehin nicht mehr die Frage. */
  const dauerSatz = (ms: number): string => {
    if (ms < SCHWELLE_MS) return '';
    const s = Math.round(ms / 1000);
    if (s < 90) return 'rund eine halbe Minute';
    const min = Math.round(s / 60);
    if (min < 60) return 'rund ' + min + ' Minuten';
    const std = ms / 3_600_000;
    if (std < 1.75) return 'gut eine Stunde';
    return 'rund ' + Math.round(std) + ' Stunden';
  };

  /**
   * Der ganze Satz für die Oberfläche, oder eine leere Zeichenkette.
   *
   * LEER IST DER NORMALFALL. Drei Bilder und zwei Notizen sagen nichts über
   * Zeit — und genau deshalb wird der Satz gelesen, wenn er einmal dasteht.
   */
  const satz = (s: Schaetzung): string => {
    const dauer = dauerSatz(s.ms);
    if (!dauer) return '';
    const kern = s.seiten > 0
      ? s.seiten + (s.seiten === 1 ? ' PDF-Seite' : ' PDF-Seiten') + ' — ' + dauer
      : dauer;
    /* Ohne einen einzigen echten Lauf ist es eine Vermutung, und das gehört
       dazu. Eine Zahl ohne ihre Grundlage ist die Sorte Anzeige, die man
       ein Mal glaubt und danach nicht mehr (E289). */
    return s.gemessen ? kern : kern + ' (geschätzt, noch ohne Messung)';
  };

  /**
   * Aus einem gelaufenen Import lernen.
   *
   * `gemessen` trägt, was WIRKLICH passiert ist: je Art die Zahl der Dateien
   * und die dafür gebrauchte Zeit, dazu die PDF-Seiten und ihre Bytes. Was
   * nicht vorkam, bleibt unverändert — ein Lauf ohne PDFs darf die
   * Seitenzahl nicht anfassen.
   */
  const lerne = (erfahrung: Erfahrung | undefined, gemessen: {
    jeArt?: Partial<Record<ImportArt, { dateien: number; ms: number }>>;
    pdf?: { seiten: number; bytes: number; ms: number };
  }): Erfahrung => {
    const e = erfahrung ? ausAblage(erfahrung) : frisch();
    const gewicht = 1 / Math.min(e.laeufe + 1, GEDAECHTNIS);
    const misch = (alt: number, neu: number): number =>
      Number.isFinite(neu) && neu > 0 ? alt + (neu - alt) * gewicht : alt;

    const jeArt = gemessen.jeArt || {};
    (Object.keys(e.jeDatei) as ImportArt[]).forEach(a => {
      const m = jeArt[a];
      if (m && m.dateien > 0) e.jeDatei[a] = misch(e.jeDatei[a], m.ms / m.dateien);
    });

    /* Die PDF-Zeit steckt in `jeSeite`, nicht in `jeDatei.pdf` — sonst
       zählte eine 300-Seiten-Datei wie eine mit zwei Seiten. Deshalb
       kommt die reine Seitenzeit herein, und `jeDatei.pdf` bleibt der
       Aufschlag fürs Öffnen. */
    const pdf = gemessen.pdf;
    if (pdf && pdf.seiten > 0) {
      e.jeSeite = misch(e.jeSeite, pdf.ms / pdf.seiten);
      if (pdf.bytes > 0) e.bytesJeSeite = misch(e.bytesJeSeite, pdf.bytes / pdf.seiten);
    }
    e.laeufe = Math.min(e.laeufe + 1, 9999);
    return e;
  };

  return { schaetze, satz, dauerSatz, lerne, artVon, seitenAus,
           frisch, ausAblage, SCHWELLE_MS, GEDAECHTNIS, STARTWERT };
})();

(globalThis as any).Schaetzer = Schaetzer;
