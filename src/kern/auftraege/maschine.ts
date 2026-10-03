/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/kern/auftraege/maschine.ts (npm run bauen:ts). */
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
  /** art -> wie es ein Mensch nennt. Siehe `anmelden`. */
  const namen = new Map<string, string>();
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
   * DIE LAGE DES GERÄTS (E342, L103 Punkt 5)
   *
   * `zeitplan.ts` nebenan rechnet, ob ein Auftrag jetzt laufen darf. Es
   * kennt weder Uhr noch `navigator` — beides steht hier. Dieselbe
   * Arbeitsteilung wie zwischen `modell.ts` und dieser Datei.
   * ======================================================================*/

  /**
   * Lädt das Gerät? `null`, solange es niemand sagen kann.
   *
   * `getBattery()` ist ein Promise und darf den Takt nicht aufhalten, also
   * wird der Wert EINMAL geholt und danach gepflegt. Bis die erste Antwort
   * da ist, steht `null` — und `null` erlaubt (siehe `zeitplan.ts`). Ein
   * Auftrag, der auf die erste Batterieauskunft wartet, wäre genau die
   * Sorte Auftrag, die nie läuft.
   *
   * Firefox und Safari haben die API nicht. Dort bleibt es für immer `null`,
   * und „nur am Strom" ist dort wirkungslos — das steht so in den
   * Einstellungen, statt still zu geschehen.
   */
  let laedt: boolean | null = null;
  let stromGefragt = false;

  const stromBeobachten = (): void => {
    if (stromGefragt) return;
    stromGefragt = true;
    const nav: any = (globalThis as any).navigator;
    if (!nav || typeof nav.getBattery !== 'function') return;
    try {
      nav.getBattery().then((akku: any) => {
        if (!akku) return;
        laedt = !!akku.charging;
        /* Beim Einstecken sofort nachsehen, statt bis zu vier Sekunden zu
           warten. Der Horcher hängt am Akku-Objekt, das so lange lebt wie
           die Seite — nichts abzumelden. */
        try {
          akku.addEventListener('chargingchange', () => {
            laedt = !!akku.charging;
            void takten();
          });
        } catch { /* ein Browser ohne Horcher liefert wenigstens den Wert */ }
      }).catch(() => { /* abgelehnt heisst unbekannt, und unbekannt erlaubt */ });
    } catch { /* dito */ }
  };

  /**
   * Kostet die Verbindung Geld? `null`, wenn es niemand sagt.
   *
   * NICHT `effectiveType`. Die misst Geschwindigkeit, nicht Kosten — ein
   * langsames WLAN im Keller sähe damit aus wie ein Mobilfunkvertrag, und
   * der Auftrag wartete auf etwas, das nie eintritt. Gemessen werden die
   * zwei Dinge, die wirklich „das kostet" heissen: der Datensparmodus und
   * eine Mobilfunkverbindung.
   */
  const teuerJetzt = (): boolean | null => {
    const nav: any = (globalThis as any).navigator;
    const v = nav && (nav.connection || nav.mozConnection || nav.webkitConnection);
    if (!v) return null;
    if (v.saveData === true) return true;
    if (typeof v.type === 'string') return v.type === 'cellular';
    /* Es gibt eine `connection`, aber weder `saveData` noch `type`. Dann
       weiss man es eben nicht — und das zu behaupten ist ehrlicher, als
       `false` zu raten. */
    return null;
  };

  /** Wie es jetzt aussieht, in der Form, die `zeitplan.ts` versteht. */
  const lage = (): { minute: number; laedt: boolean | null; teuer: boolean | null } => {
    const d = new Date();
    return { minute: d.getHours() * 60 + d.getMinutes(), laedt, teuer: teuerJetzt() };
  };

  /**
   * Warum dieser Auftrag gerade nicht darf — oder leer.
   *
   * Für das Fenster aus E322. Öffentlich, weil die Schale sonst
   * `Zeitplan.darf` selbst rufen und dafür die Lage kennen müsste; die Lage
   * gehört aber hierher (§5).
   */
  const wartetAuf = (a: any): string => {
    if (!a || a.zustand !== 'wartet') return '';
    if (typeof Zeitplan === 'undefined') return '';
    return Zeitplan.darf(a.bedingung, lage()).grund;
  };

  /** Der Schlüssel, unter dem der eingestellte Zeitplan liegt. */
  const PLAN_SCHLUESSEL = 'auftragPlan';

  /**
   * Was der Mensch unter Einstellungen → Speicher eingestellt hat.
   *
   * Gilt für JEDEN neuen Auftrag, der nicht ausdrücklich etwas anderes
   * sagt. Ohne Einstellung: `null` — und damit alles genau wie vor E342.
   */
  const standardBedingung = (): unknown => {
    if (typeof Zeitplan === 'undefined') return null;
    if (typeof Store === 'undefined' || !Store.getMeta) return null;
    try { return Zeitplan.sauber(Store.getMeta(PLAN_SCHLUESSEL, null)); }
    catch { return null; }
  };

  /** Den eingestellten Zeitplan lesen — für die Einstellungen. */
  const plan = (): unknown => standardBedingung();

  /**
   * Den Zeitplan setzen. `null` löscht ihn.
   *
   * ER WIRKT NUR AUF NEUE AUFTRÄGE, und das ist Absicht: einen laufenden
   * OCR-Lauf um Mitternacht anzuhalten, weil jemand gerade „nur nachts"
   * einschaltet, wäre die Überraschung, die niemand will. Was liegt, liegt.
   */
  const planSetzen = async (roh: unknown): Promise<unknown> => {
    if (typeof Zeitplan === 'undefined') return null;
    const b = Zeitplan.sauber(roh);
    if (typeof Store !== 'undefined' && Store.setMeta) await Store.setMeta(PLAN_SCHLUESSEL, b);
    return b;
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
  const anmelden = (art: string, werkzeug: Werkzeug, name?: string): (() => void) => {
    if (!art || typeof werkzeug !== 'function') {
      throw new Error('Eine Auftragsart braucht einen Namen und einen Läufer.');
    }
    werkzeuge.set(art, werkzeug);
    /* DER MENSCHLICHE NAME KOMMT VON DEM, DER DIE ART ANMELDET (E327).
       Vorher stand er in einer Liste im Fenster (`ueberlagerung/auftraege.ts`)
       — geraten, für fünf Arten, die es noch gar nicht gab. Die erste, die
       es dann wirklich gab, stand nicht darin, und im Fenster erschien ihr
       technischer Bezeichner: „pdf-bilder", als Überschrift, für einen
       Menschen. Gefunden auf einem Bild.
       Wer die Art anmeldet, weiss ihren Namen; die Schale muss ihn nicht
       raten, und §5 Regel 1 bleibt heil — der Bereich meldet ihn dem Kern,
       nicht der Schale. */
    if (name) namen.set(art, name);
    return () => { werkzeuge.delete(art); namen.delete(art); };
  };

  /** Welche Arten kennt diese Fassung? Für §47: was es nicht gibt, wird nicht angeboten. */
  const arten = (): string[] => [...werkzeuge.keys()];

  /** Der menschliche Name einer Art — leer, wenn sie keinen mitgebracht hat. */
  const artName = (art: string): string => namen.get(art) || '';

  /**
   * Einen Auftrag anlegen. Er ist damit DAUERHAFT da, auch ohne dass die
   * Arbeit begonnen hat — genau das ist der Sinn.
   */
  const anlegen = async (art: string, eingabe: unknown,
                         opt: { schritte?: number; maxVersuche?: number;
                                text?: string; id?: string;
                                bedingung?: unknown } = {}): Promise<any> => {
    if (typeof Store === 'undefined' || !Store.auftragPut) {
      throw new Error('Die Ablage steht noch nicht — Aufträge brauchen sie.');
    }
    const id = opt.id || Store.uid();
    /* DIE BEDINGUNG KOMMT VOM AUFRUFER ODER AUS DEN EINSTELLUNGEN (E342).
       Wer keine mitgibt, bekommt die, die der Mensch unter Einstellungen →
       Speicher eingestellt hat — und wer ausdrücklich `null` mitgibt,
       bekommt keine. Das ist der Unterschied zwischen „ist mir gleich" und
       „dieser hier nicht": `undefined` fragt nach, `null` sagt nein. */
    const bedingung = 'bedingung' in opt
      ? (typeof Zeitplan !== 'undefined' ? Zeitplan.sauber(opt.bedingung) : null)
      : standardBedingung();
    const a = JobModell.anlegen(id, art, eingabe, jetzt(), zeitText(),
                                { ...opt, bedingung });
    await Store.auftragPut(a);
    melde(ARTEN.auftragAngelegt, { id, art });
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
      melde(ARTEN.auftragBeendet, { id, art: a.art, zustand: 'abgebrochen' });
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
  /** Der Name des Schlosses, unter dem sich die Tabs absprechen. */
  const SCHLOSS = 'redion-auftraege';

  /**
   * NUR EIN TAB ARBEITET GLEICHZEITIG (L103 Punkt 4, E323).
   *
   * Die Pacht verhindert, dass zwei Tabs DENSELBEN Auftrag nehmen. Sie
   * verhindert nicht, dass jeder von ihnen einen ANDEREN nimmt — und auf
   * einem schwachen Gerät ist das doppelt so viel Last wie nötig, während
   * die Oberfläche in beiden Tabs ruckelt.
   *
   * `navigator.locks` mit `ifAvailable` ist dafür das richtige Werkzeug,
   * und ZWAR JE TAKT und nicht als dauerhafte Wahl eines Anführers.
   * Der Unterschied ist der Ausfall:
   *
   *   · Anführerwahl (ein Schloss für immer halten): wird es aus
   *     irgendeinem Grund nie erteilt, arbeitet NIE WIEDER ein Tab. Ein
   *     Zustand, aus dem man ohne Neustart nicht herauskommt.
   *   · Je Takt: wer es nicht bekommt, überspringt diesen einen Takt und
   *     versucht es in vier Sekunden wieder. Stirbt der Halter mitten im
   *     Takt, gibt der Browser das Schloss frei, und der nächste nimmt es.
   *
   * OHNE `navigator.locks` bleibt alles wie bisher. Das ist die ehrliche
   * Rückfallebene: doppelte Last ist unschön, aber nichts geht verloren —
   * die Pacht schützt weiterhin gegen den doppelten Auftrag. Ein Browser,
   * der die API nicht kennt, soll keine Aufträge verlieren.
   */
  const nurEiner = async (tun: () => Promise<boolean>): Promise<boolean> => {
    const schloesser: any = (globalThis as any).navigator?.locks;
    if (!schloesser || typeof schloesser.request !== 'function') return tun();
    let erg = false, gelaufen = false;
    try {
      await schloesser.request(SCHLOSS, { ifAvailable: true }, async (s: unknown) => {
        /* `null` heisst: ein anderer Tab arbeitet gerade. Kein Fehler,
           sondern genau der Fall, für den das hier da ist. */
        if (!s) return;
        gelaufen = true;
        erg = await tun();
      });
    } catch {
      /* Versagt das Schloss selbst, wird gearbeitet. Lieber doppelte Last
         als eine Maschine, die stillsteht (§46). */
      if (!gelaufen) erg = await tun();
    }
    return erg;
  };

  const takten = async (): Promise<boolean> => {
    if (laeuftGerade || !bereit) return false;
    if (typeof Store === 'undefined' || !Store.auftragNehmen) return false;
    /* KEIN LÄUFER, KEINE TRANSAKTION. Solange kein Bereich eine Art
       angemeldet hat, kann kein Auftrag laufen — dann muss auch nicht alle
       vier Sekunden das Fach gelesen werden. Das ist nicht nur sparsam:
       zweihundertvierzig Prüfläufe starten die App, und keiner von ihnen
       soll einen Takt bezahlen, der nichts tun kann. */
    if (!werkzeuge.size) return false;
    /* Erst das Schloss, dann die Sperre im eigenen Tab: `laeuftGerade`
       hält zwei Takte DESSELBEN Tabs auseinander, das Schloss zwei Tabs. */
    return nurEiner(taktenJetzt);
  };

  /** Ein Takt, wenn dieser Tab an der Reihe ist. */
  const taktenJetzt = async (): Promise<boolean> => {
    if (laeuftGerade) return false;
    laeuftGerade = true;
    try {
      const t = jetzt();
      /* Lesen und Pacht schreiben in EINER Transaktion — siehe Kopf. */
      const jetztLage = lage();
      const genommen = await Store.auftragNehmen((liste: any[]) => {
        /* ZWEI FILTER, UND SIE MEINEN VERSCHIEDENES. `werkzeuge.has` heisst
           „diese Fassung kann das nicht" — der Auftrag wartet auf ein
           anderes Fenster oder eine spätere Fassung. `Zeitplan.darf` heisst
           „nicht jetzt" — er wartet auf die Nacht, den Strom, das WLAN.
           Beide werden übersprungen, und beide sagen es im Fenster (E322):
           der erste durch sein Schweigen, der zweite durch seinen Grund. */
        const kandidaten = liste.filter(a =>
          werkzeuge.has(a.art) &&
          (typeof Zeitplan === 'undefined' || Zeitplan.darf(a.bedingung, jetztLage).ok));
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
      melde(ARTEN.auftragFehler, { fehler: String(e && e.message || e) });
      return false;
    } finally {
      laeuftGerade = false;
    }
  };

  /** Einen genommenen Auftrag wirklich ausführen. */
  const arbeiten = async (a: any): Promise<void> => {
    const werkzeug = werkzeuge.get(a.art);
    if (!werkzeug) return;
    melde(ARTEN.auftragBeginnt, { id: a.id, art: a.art, versuch: a.versuche });

    let stand = a;
    const schreiben = async (neu: any): Promise<void> => {
      stand = neu;
      await Store.auftragPut(neu);
    };

    const hilfe = {
      schritt: async (wert: unknown, text?: string): Promise<void> => {
        await schreiben(JobModell.schrittFertig(stand, wert, jetzt(), text, HALTEN_MS));
        melde(ARTEN.auftragSchritt, {
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
        melde(ARTEN.auftragBeendet, { id: a.id, art: a.art, zustand: 'abgebrochen' });
        return;
      }
      await schreiben(JobModell.fertig(
        { ...stand, stand: ergebnis === undefined ? stand.stand : ergebnis },
        zeitText()));
      melde(ARTEN.auftragBeendet, { id: a.id, art: a.art, zustand: 'fertig' });
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
      melde(ARTEN.auftragWiederaufgenommen, {
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
    /* Die Batterie EINMAL fragen, und zwar hier: `getBattery()` ist ein
       Promise, und der Takt darf nicht darauf warten (E342). */
    stromBeobachten();
    try {
      await wiederaufnehmen();
      await aufraeumen();
    } catch (e: any) {
      melde(ARTEN.auftragFehler, { fehler: String(e && e.message || e) });
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
    start, stopp, takten, anmelden, arten, artName, anlegen, abbrechen,
    nurEiner, SCHLOSS,
    alle, offen, einer, wiederaufnehmen, aufraeumen, leeren,
    wartetAuf, lage, plan, planSetzen, PLAN_SCHLUESSEL,
    ICH, TAKT_MS, AUFHEBEN_MS
  };
})();

(window as any).Auftraege = Auftraege;
