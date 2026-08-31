/* ============================================================================
 * kern/auftraege/maschine.ts — die Auftragsmaschine
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/kern/auftraege/maschine.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/kern/auftraege/maschine.js`.
 * ----------------------------------------------------------------------------
 * WOFÜR ES SIE GIBT.
 *
 * Redion kann heute lange Arbeit tun — PDF einlesen, OCR, grosser Import,
 * Sicherung, Embeddings bauen. Was es nicht konnte, ist sie ÜBERLEBEN.
 * Jede dieser Arbeiten lag im Arbeitsspeicher: Tab zu, Arbeit weg. Beim
 * Datei-Upload wurden im Fehlerfall sogar die schon geschriebenen Stücke
 * gelöscht (`dateien/ablage.ts:176`), und `verwaist()` erklärte jeden
 * unfertigen Upload zum Müll.
 *
 * Der Auftrag wird jetzt VOR der Arbeit geschrieben. Nach einem Neustart
 * weiss die App, was offenstand, und setzt beim letzten FERTIGEN Schritt
 * an — nicht von vorn.
 *
 * ─── DIE ARBEITSTEILUNG ─────────────────────────────────────────────────────
 *
 *   `core/jobs/modell.ts`   die REGELN. Reine Funktionen, keine Uhr, keine
 *                           Ablage. Ohne Browser prüfbar.
 *   diese Datei             die WIRKUNG. Ablage, Zeit, Takt, Meldung.
 *
 * ─── WARUM SIE NICHT AUF DEM EREIGNISBUS AUFSETZT ───────────────────────────
 *
 * Redurs Regel war richtig: keine Bereiche direkt verkabeln, alles über den
 * Bus. Nur kann Redions Bus das hier nicht tragen, und das ist gemessen
 * (LUECKEN.md L102 §4):
 *
 *   · `melde` verwirft den Rückgabewert. Ein Auftrag, der etwas mit
 *     IndexedDB tut, kann so nicht sagen, wann er fertig ist.
 *   · `frage` sammelt Promises als ROHE WERTE ein, statt sie abzuwarten.
 *   · Kein Abbruch, kein Veto, keine Reihenfolge, kein Nachreichen.
 *
 * Die Maschine benutzt den Bus deshalb zum MELDEN und nie zum Steuern. Wer
 * eine Arbeit beisteuert, meldet einen Läufer an (`anmelden`) — eine
 * gewöhnliche Funktion, die ein Promise gibt. Das ist keine Umgehung des
 * Busses, sondern die Anerkennung dessen, was er ist: ein Rufsystem, kein
 * Steuerwerk.
 *
 * Kein Bereich importiert einen anderen. Ein Bereich meldet seine Art an
 * und weiss von den anderen nichts (§5).
 *
 * ─── ZWEI TABS ──────────────────────────────────────────────────────────────
 *
 * Ohne Absprache nähmen zwei Tabs denselben Auftrag: doppeltes OCR,
 * doppelte Kosten, doppelte Daten. Ein Auftrag trägt deshalb eine PACHT —
 * wer ihn hält und bis wann.
 *
 * Die Sperre entsteht NICHT durch das Feld, sondern dadurch, dass
 * `Store.auftragNehmen` Lesen und Schreiben in EINE `readwrite`-Transaktion
 * legt. IndexedDB serialisiert die; der zweite Tab sieht die Pacht des
 * ersten. Läge das Lesen in einer eigenen Transaktion, sähen beide „frei".
 *
 * ─── UND WAS SIE NICHT TUT ──────────────────────────────────────────────────
 *
 * Sie arbeitet nicht selbst. Sie kennt keine PDFs, kein OCR, keine
 * Sicherung. Sie nimmt Läufer entgegen und ruft sie auf.
 * ==========================================================================*/

const Auftraege = (() => {

  /** Wie oft nachgesehen wird, ob etwas zu tun ist. */
  const TAKT_MS = 4000;

  /** Wie lange ein fertiger Auftrag noch liegenbleibt, damit man ihn sieht. */
  const AUFHEBEN_MS = 24 * 3600 * 1000;

  /** Wie oft die Pacht während der Arbeit verlängert wird. */
  const HALTEN_MS = 10000;

  /**
   * Wer dieses Fenster ist.
   *
   * Nicht gespeichert: die Kennung soll je Tab verschieden sein, und ein
   * gemerkter Wert wäre nach `öffnen im neuen Tab` derselbe. Genau dann
   * bräuchte man sie aber.
   */
  const ICH = 'w' + Math.random().toString(36).slice(2, 10) + '-' + String(Date.now() % 100000);

  /** Ein Läufer: bekommt den Auftrag, tut einen Teil, sagt was er tat. */
  type Werkzeug = (
    auftrag: any,
    hilfe: {
      /** Einen Schritt als fertig festschreiben — der Wiederaufsetzpunkt. */
      schritt: (stand: unknown, text?: string) => Promise<void>;
      /** Wurde abgebrochen? In jeder Schleife fragen. */
      abgebrochen: () => boolean;
      /** Die Pacht verlängern, ohne einen Schritt zu melden. */
      lebt: () => Promise<void>;
    }
  ) => Promise<unknown>;

  const werkzeuge = new Map<string, Werkzeug>();
  const abbrueche = new Set<string>();
  let takt: any = null;
  let laeuftGerade = false;
  let bereit = false;

  const jetzt = (): number => Date.now();
  const zeitText = (): string =>
    (typeof Store !== 'undefined' && Store.now) ? Store.now() : new Date().toISOString();

  const melde = (name: string, daten: unknown): void => {
    if (typeof Ereignisse === 'undefined' || !Ereignisse.melde) return;
    try { Ereignisse.melde(name, daten); } catch { /* ein Horcher darf nichts anhalten */ }
  };

  /* ========================================================================
   * ANMELDEN UND ANLEGEN
   * ======================================================================*/

  /**
   * Eine Auftragsart und ihren Läufer anmelden.
   *
   * @returns eine Funktion zum Abmelden — sonst hinge der Läufer eines
   *          entladenen Bereichs für immer.
   */
  const anmelden = (art: string, werkzeug: Werkzeug): (() => void) => {
    if (!art || typeof werkzeug !== 'function') {
      throw new Error('Eine Auftragsart braucht einen Namen und einen Läufer.');
    }
    werkzeuge.set(art, werkzeug);
    return () => { werkzeuge.delete(art); };
  };

  /** Welche Arten kennt diese Fassung? Für §47: was es nicht gibt, wird nicht angeboten. */
  const arten = (): string[] => [...werkzeuge.keys()];

  /**
   * Einen Auftrag anlegen. Er ist damit DAUERHAFT da, auch ohne dass die
   * Arbeit begonnen hat — genau das ist der Sinn.
   */
  const anlegen = async (art: string, eingabe: unknown,
                         opt: { schritte?: number; maxVersuche?: number;
                                text?: string; id?: string } = {}): Promise<any> => {
    if (typeof Store === 'undefined' || !Store.auftragPut) {
      throw new Error('Die Ablage steht noch nicht — Aufträge brauchen sie.');
    }
    const id = opt.id || Store.uid();
    const a = JobModell.anlegen(id, art, eingabe, jetzt(), zeitText(), opt);
    await Store.auftragPut(a);
    melde('auftrag.angelegt', { id, art });
    /* Nicht auf den nächsten Takt warten: wer etwas anstösst, will es
       laufen sehen. `void`, weil `anlegen` nicht auf die ganze Arbeit
       warten soll. */
    void takten();
    return a;
  };

  const alle = async (): Promise<any[]> =>
    (typeof Store !== 'undefined' && Store.auftragAlle) ? (await Store.auftragAlle()) || [] : [];

  const einer = async (id: string): Promise<any | null> =>
    (typeof Store !== 'undefined' && Store.auftragHolen) ? await Store.auftragHolen(id) : null;

  /** Die offenen — für die Anzeige. */
  const offen = async (): Promise<any[]> =>
    (await alle()).filter(a => !JobModell.beendet(a));

  /**
   * Abbrechen.
   *
   * Zwei Wege, und beide werden gebraucht: ein WARTENDER Auftrag wird
   * sofort umgeschrieben; ein LAUFENDER bekommt eine Marke, die sein Läufer
   * beim nächsten `abgebrochen()` sieht. Einen laufenden hart zu beenden
   * ginge nicht — er steckt vielleicht mitten in einer Transaktion.
   */
  const abbrechen = async (id: string): Promise<boolean> => {
    const a = await einer(id);
    if (!a || JobModell.beendet(a)) return false;
    abbrueche.add(id);
    if (a.zustand === 'wartet') {
      await Store.auftragPut(JobModell.abbrechen(a, zeitText()));
      melde('auftrag.beendet', { id, art: a.art, zustand: 'abgebrochen' });
      abbrueche.delete(id);
    }
    return true;
  };

  /* ========================================================================
   * DER TAKT
   * ======================================================================*/

  /**
   * Einmal nachsehen und höchstens EINEN Auftrag laufen lassen.
   *
   * Höchstens einen, und das ist Absicht: zwei parallele Aufträge auf
   * demselben Gerät konkurrieren um dieselbe IndexedDB und dieselbe CPU,
   * und der Nutzer tippt daneben. Ein Auftrag nach dem anderen ist
   * langsamer und fühlt sich schneller an.
   *
   * `laeuftGerade` verhindert, dass zwei Takte einander überholen — der
   * Takt ist ausdrücklich idempotent.
   */
  const takten = async (): Promise<boolean> => {
    if (laeuftGerade || !bereit) return false;
    if (typeof Store === 'undefined' || !Store.auftragNehmen) return false;
    /* KEIN LÄUFER, KEINE TRANSAKTION. Solange kein Bereich eine Art
       angemeldet hat, kann kein Auftrag laufen — dann muss auch nicht alle
       vier Sekunden das Fach gelesen werden. Das ist nicht nur sparsam:
       zweihundertvierzig Prüfläufe starten die App, und keiner von ihnen
       soll einen Takt bezahlen, der nichts tun kann. */
    if (!werkzeuge.size) return false;
    laeuftGerade = true;
    try {
      const t = jetzt();
      /* Lesen und Pacht schreiben in EINER Transaktion — siehe Kopf. */
      const genommen = await Store.auftragNehmen((liste: any[]) => {
        const kandidaten = liste.filter(a => werkzeuge.has(a.art));
        const naechst = JobModell.naechster(kandidaten, t, ICH);
        if (!naechst) return null;
        return JobModell.nehmen(naechst, t, ICH, zeitText());
      });
      if (!genommen) return false;
      await arbeiten(genommen);
      return true;
    } catch (e: any) {
      /* Ein Fehler im TAKT darf die Maschine nicht anhalten — sonst
         genügte ein kaputter Auftrag, damit nie wieder einer läuft. */
      melde('auftrag.fehler', { fehler: String(e && e.message || e) });
      return false;
    } finally {
      laeuftGerade = false;
    }
  };

  /** Einen genommenen Auftrag wirklich ausführen. */
  const arbeiten = async (a: any): Promise<void> => {
    const werkzeug = werkzeuge.get(a.art);
    if (!werkzeug) return;
    melde('auftrag.beginnt', { id: a.id, art: a.art, versuch: a.versuche });

    let stand = a;
    const schreiben = async (neu: any): Promise<void> => {
      stand = neu;
      await Store.auftragPut(neu);
    };

    const hilfe = {
      schritt: async (wert: unknown, text?: string): Promise<void> => {
        await schreiben(JobModell.schrittFertig(stand, wert, jetzt(), text, HALTEN_MS));
        melde('auftrag.schritt', {
          id: a.id, art: a.art, schritt: stand.schritt,
          schritte: stand.schritte, text: stand.text
        });
      },
      abgebrochen: (): boolean => abbrueche.has(a.id),
      lebt: async (): Promise<void> => {
        await schreiben(JobModell.halten(stand, jetzt(), HALTEN_MS));
      }
    };

    try {
      const ergebnis = await werkzeug(stand, hilfe);
      if (abbrueche.has(a.id)) {
        abbrueche.delete(a.id);
        await schreiben(JobModell.abbrechen(stand, zeitText()));
        melde('auftrag.beendet', { id: a.id, art: a.art, zustand: 'abgebrochen' });
        return;
      }
      await schreiben(JobModell.fertig(
        { ...stand, stand: ergebnis === undefined ? stand.stand : ergebnis },
        zeitText()));
      melde('auftrag.beendet', { id: a.id, art: a.art, zustand: 'fertig' });
    } catch (e: any) {
      abbrueche.delete(a.id);
      const meldung = String(e && e.message || e);
      const danach = JobModell.gescheitert(stand, meldung, jetzt(), zeitText());
      await schreiben(danach);
      melde(danach.zustand === 'fehler' ? 'auftrag.beendet' : 'auftrag.fehler',
            { id: a.id, art: a.art, zustand: danach.zustand,
              fehler: meldung, versuche: danach.versuche });
    }
  };

  /* ========================================================================
   * START UND WIEDERAUFNAHME
   * ======================================================================*/

  /**
   * Was beim letzten Mal offenstand.
   *
   * Aufträge auf `laeuft`, deren Pacht abgelaufen ist, haben ihren Halter
   * verloren — der Tab ist zu. Sie gehen zurück auf `wartet`, aber MIT
   * Wartezeit: sofort hiesse, dass ein Auftrag, der den Tab zum Absturz
   * bringt, ihn beim nächsten Start gleich wieder zum Absturz bringt.
   *
   * Ein Auftrag DIESES Fensters wird nicht angefasst — beim ersten Start
   * gibt es keinen, und ein zweiter Aufruf soll nichts kaputtmachen.
   */
  const wiederaufnehmen = async (): Promise<number> => {
    const t = jetzt();
    let n = 0;
    for (const a of await alle()) {
      if (a.zustand !== 'laeuft') continue;
      if (a.geraet === ICH) continue;
      if (a.bisWann > t) continue;
      const neu = JobModell.zurueckstellen(a, t, zeitText());
      if (neu === a) continue;
      await Store.auftragPut(neu);
      n++;
      melde('auftrag.wiederaufgenommen', {
        id: a.id, art: a.art, schritt: a.schritt, zustand: neu.zustand
      });
    }
    return n;
  };

  /** Fertige und abgebrochene Aufträge, die lange genug lagen. */
  const aufraeumen = async (haltenMs = AUFHEBEN_MS): Promise<number> => {
    const t = jetzt();
    let n = 0;
    for (const a of await alle()) {
      if (!JobModell.aufraeumbar(a, t, haltenMs)) continue;
      await Store.auftragWeg(a.id);
      n++;
    }
    return n;
  };

  /**
   * Die Maschine anwerfen.
   *
   * Reihenfolge: erst wiederaufnehmen, dann aufräumen, dann takten. Wer
   * zuerst aufräumt, könnte einen Auftrag wegwerfen, den die
   * Wiederaufnahme gerade gebraucht hätte.
   */
  const start = async (): Promise<void> => {
    if (bereit) return;
    bereit = true;
    try {
      await wiederaufnehmen();
      await aufraeumen();
    } catch (e: any) {
      melde('auftrag.fehler', { fehler: String(e && e.message || e) });
    }
    if (takt) clearInterval(takt);
    takt = setInterval(() => { void takten(); }, TAKT_MS);
    void takten();
  };

  /** Anhalten — für Prüfläufe und für das Schliessen. */
  const stopp = (): void => {
    if (takt) clearInterval(takt);
    takt = null;
    bereit = false;
  };

  /**
   * Alles wegwerfen.
   *
   * Wird beim Einspielen mit „Ersetzen" gebraucht: die Aufträge zeigen auf
   * Blöcke und Dateien, die es danach nicht mehr gibt. Ein Auftrag, der
   * eine verschwundene Datei sucht, scheitert dreimal und landet in der
   * Fehlerablage — für nichts.
   */
  const leeren = async (): Promise<number> => {
    let n = 0;
    for (const a of await alle()) { await Store.auftragWeg(a.id); n++; }
    return n;
  };

  return {
    start, stopp, takten, anmelden, arten, anlegen, abbrechen,
    alle, offen, einer, wiederaufnehmen, aufraeumen, leeren,
    ICH, TAKT_MS, AUFHEBEN_MS
  };
})();

(window as any).Auftraege = Auftraege;
