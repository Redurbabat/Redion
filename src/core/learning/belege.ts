/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/learning/belege.ts (npm run bauen:ts). */
/* ============================================================================
 * core/learning/belege.ts — andere Belege für Können als Karteikarten
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/learning/belege.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/learning/belege.js`.
 * ----------------------------------------------------------------------------
 * L106 Punkt 1: „Die Karteikarten sind die einzige Quelle. Prüfungsergebnisse,
 * Elektro-Aufgaben, der Lernpfad und die Simulationen sind auch Belege für
 * Können, und keiner davon zählt mit. `Kompetenz.jeThema` nimmt jede Liste mit
 * `sr` und `reviewVerlauf` — der Anschluss ist Arbeit an den Bereichen, nicht
 * am Kern."
 *
 * Das stimmte, und dieses Modul ist der Anschluss. Es rechnet nichts aus: es
 * ÜBERSETZT, was ein Bereich schon aufhebt, in die Form, die `kompetenz.ts`
 * seit E289 versteht.
 *
 * ─── WARUM EINE PRÜFUNGSSIMULATION ÜBERHAUPT EIN BELEG IST ──────────────────
 *
 * Sie ist sogar der bessere. Eine Karteikarte wird SELBST BEWERTET — man sagt
 * sich selbst, ob man es wusste. Eine Simulation zählt richtig und falsch,
 * ohne dass man sich etwas vormachen kann. Sie nicht mitzuzählen hiesse, die
 * härtere Auskunft wegzuwerfen und die weichere zu behalten.
 *
 * ─── UND WARUM SIE TROTZDEM KEINE KARTE IST ─────────────────────────────────
 *
 * Jeder erzeugte Satz trägt `quelle: 'pruefung'`. `kompetenz.ts` zählt nur
 * echte Karten als Karten — sonst stünde „20 Karten" bei zwölf Karten, und
 * das wäre genau die stille Falschaussage, gegen die E289 gebaut wurde.
 *
 * Reine Rechnung: keine Ablage, keine Uhr, kein DOM.
 * ==========================================================================*/

const Belege = (() => {
  'use strict';

  /** Ein Ergebnis, wie `lernwelt.ts` es in `meta` ablegt. */
  type SimErgebnis = {
    id?: string;
    beendet?: string;
    titel?: string;
    themen?: Array<{ thema?: string; gesamt?: number; fehler?: number }>;
  };

  type Karte = {
    id: string;
    thema: string;
    titel?: string;
    quelle: string;
    reviewVerlauf: Array<{ id: string; at: string; rating: number }>;
  };

  /**
   * DIE NOTEN SIND DIE DER KARTEIKARTEN, damit beides vergleichbar bleibt.
   * `kompetenz.ts` zählt ab 3 als richtig (`karteAus`); 4 heisst „leicht",
   * 1 heisst „nochmal". Eine Prüfungsantwort ist richtig oder falsch, also
   * gibt es nur diese beiden Werte — eine erfundene Abstufung dazwischen
   * wäre eine Behauptung über etwas, das gar nicht gemessen wurde.
   */
  const RICHTIG = 4;
  const FALSCH = 1;

  /** Wie `topicLabel` in `bereiche/wissen/learning.ts`. */
  const THEMA_MAX = 120;
  const themaAus = (roh: unknown): string => {
    const t = String(roh ?? '').trim().slice(0, THEMA_MAX);
    return t || 'Ohne Thema';
  };

  /**
   * Prüfungssimulationen in Belege übersetzen.
   *
   * EIN SATZ JE (SIMULATION, THEMA) und nicht je Antwort: mehr Sätze wären
   * mehr Rechnung ohne mehr Aussage, denn `jeThema` summiert sie ohnehin.
   * Die Kennung trägt beides, damit zwei Simulationen über dasselbe Thema
   * nicht zu einer verschmelzen.
   *
   * OHNE DATUM KEIN BELEG. `kompetenz.ts` ordnet Antworten in Zeitfenster
   * ein (`fensterTage`, E328); ein Eintrag ohne Zeit fiele dort still
   * heraus und zählte hier trotzdem mit — der Vergleich „letzte 90 Tage
   * gegen die 90 davor" ergäbe dann zwei verschiedene Grundgesamtheiten.
   */
  const ausSimulationen = (liste: unknown): Karte[] => {
    const raus: Karte[] = [];
    for (const s of (Array.isArray(liste) ? liste : []) as SimErgebnis[]) {
      if (!s || typeof s !== 'object') continue;
      const wann = String(s.beendet || '');
      if (!wann || !Number.isFinite(Date.parse(wann))) continue;
      const simId = String(s.id || wann);
      for (const t of (Array.isArray(s.themen) ? s.themen : [])) {
        const gesamt = Math.max(0, Math.floor(Number(t?.gesamt) || 0));
        if (!gesamt) continue;
        const fehler = Math.min(gesamt, Math.max(0, Math.floor(Number(t?.fehler) || 0)));
        const thema = themaAus(t?.thema);
        const verlauf: Karte['reviewVerlauf'] = [];
        for (let i = 0; i < gesamt; i++)
          verlauf.push({ id: simId + ':' + thema + ':' + i, at: wann,
                         rating: i < gesamt - fehler ? RICHTIG : FALSCH });
        raus.push({
          id: 'sim:' + simId + ':' + thema,
          thema, titel: String(s.titel || 'Prüfungssimulation'),
          quelle: 'pruefung',
          reviewVerlauf: verlauf
        });
      }
    }
    return raus;
  };

  return { ausSimulationen, themaAus, RICHTIG, FALSCH, THEMA_MAX };
})();

(window as any).Belege = Belege;
