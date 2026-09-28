/* ============================================================================
 * kalender.js — Kalender von draussen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/verbinden/kalender.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/verbinden/kalender.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Drei Wege, einen fremden Kalender hereinzuholen:
 *
 *   1. ICS-DATEI          jeder Kalender kann eine .ics ausgeben — Google,
 *                         iCloud, Outlook, Thunderbird. Läuft immer, auch
 *                         ohne Netz und ohne Konto.
 *   2. ICS-ABO            dieselbe Datei, aber als Adresse. Wird beim Öffnen
 *                         nachgeladen. Manche Anbieter lassen den Browser
 *                         nicht direkt heran — dann greift die Brücke.
 *   3. GOOGLE CALENDAR    die richtige Schnittstelle, mit Anmeldung. Lesen
 *                         und Schreiben, Termine gehen in beide Richtungen.
 *
 * iCloud hat keine offene Schnittstelle. Was geht: den Kalender in der
 * iCloud-App freigeben („Öffentlicher Kalender"), die webcal-Adresse
 * kopieren und hier als Abo eintragen. Das ist der Weg, den Apple selbst
 * für fremde Programme vorsieht.
 *
 * Und andersherum: jede Datenbank dieser App lässt sich als .ics ausgeben
 * und in Google, iCloud oder Outlook abonnieren.
 * ==========================================================================*/

const Kalender = (() => {

  /* Das angeklickte Element — oder nichts. `e.target` ist `EventTarget | null`
     und muss ein `Element` sein, bevor `closest` daran etwas findet. Vorher
     stand hier ungeprüft `e.target.closest(…)`: bei einem Klick, dessen Ziel
     kein Element ist, warf das mitten im Behandeln. */
  const elVon = (e: Event): Element | null =>
    e.target instanceof Element ? e.target : null;

  const esc = (s: string) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const p2 = (n: number) => String(n).padStart(2, '0');

  /* ========================================================================
   * 1. ICS LESEN
   * ------------------------------------------------------------------------
   * Das Format ist alt und eigenwillig: Zeilen dürfen umbrechen, Zeichen
   * werden maskiert, Zeiten kommen in drei Schreibweisen. Hier steht das
   * alles an einer Stelle.
   * ======================================================================*/

  /** Umgebrochene Zeilen wieder zusammenkleben (Fortsetzung beginnt mit Leerzeichen). */
  const zeilenFalten = (text: string) => String(text || '')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '');

  const entmaskieren = (s: string) => String(s || '')
    .replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');

  /** „20260815T140000Z", „20260815", „2026-08-15T14:00:00" → ISO-Text. */
  /**
   * Zonen, die dieser Browser nicht kennt (E344).
   *
   * Gesammelt statt sofort gemeldet: ein Kalender mit vierzig Terminen aus
   * einer unbekannten Zone soll den Satz EINMAL sagen, nicht vierzigmal.
   * Wird von `icsLesen` vor jedem Durchgang geleert und danach
   * mitgeliefert; die Anzeige übernimmt `alleAbosHolen`.
   */
  const unbekannteZonen = new Set<string>();

  const icsZeit = (roh: any, parameter?: any): string => {
    const v = String(roh || '').trim();
    const ganzerTag = /^\d{8}$/.test(v) || /VALUE=DATE(?!-TIME)/i.test(parameter || '');
    const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
    if (!m) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
    }
    if (ganzerTag || !m[4]) return `${m[1]}-${m[2]}-${m[3]}`;
    if (m[7]) {
      /* Z heisst Weltzeit — in Ortszeit umrechnen, sonst stimmt die Stunde nicht */
      const d = new Date(Date.UTC(+(m[1] ?? 0), +(m[2] ?? 1) - 1, +(m[3] ?? 1),
                                  +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)));
      return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
             'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    }
    /* ─── EINE FREMDE ZEITZONE (E344, L106 Punkt 5) ────────────────────
       `DTSTART;TZID=America/New_York:20260907T080000` hiess hier bis eben
       `2026-09-07T08:00`. Für jemanden in Berlin ist dieser Termin um 14
       Uhr. Sechs Stunden falsch, ohne ein Wort — genau die Sorte stiller
       Fehler, die §46 an erste Stelle setzt.

       L106 nannte es „bewusst so", weil „eine halbe Zeitzonenrechnung
       schlimmer ist als keine". Der Satz stimmt; die GANZE Rechnung ist
       nur seit Jahren im Browser eingebaut. Sie steht in
       `core/calendar/zeitzone.ts`, samt der Erklärung, warum sie zweimal
       rechnen muss.

       KENNT DER BROWSER DIE ZONE NICHT — und Outlooks
       `W. Europe Standard Time` kennt er nicht —, bleibt alles, wie es
       war, und `zoneUnklar` sagt es weiter. Eine Tabelle mit hundert
       Windows-Namen wäre die halbe Lösung, vor der L106 gewarnt hat. */
    const tz = /TZID=([^;:]+)/i.exec(String(parameter || ''));
    if (tz && tz[1]) {
      const zone = tz[1].trim().replace(/^"|"$/g, '');
      if (typeof Zeitzone !== 'undefined' && Zeitzone.kennt(zone)) {
        const um = Zeitzone.alsOrtszeit(+(m[1] ?? 0), +(m[2] ?? 1), +(m[3] ?? 1),
                                        +(m[4] ?? 0), +(m[5] ?? 0), zone);
        if (um) return um;
      } else if (zone) {
        unbekannteZonen.add(zone);
      }
    }
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  };

  /**
   * Ein ICS-Text wird zu einer Liste Termine — UND einer Liste Aufgaben.
   *
   * ─── VTODO WURDE BIS E326 GAR NICHT GELESEN (L106 Punkt 6) ──────────────
   *
   * Der Leser kannte nur VEVENT. Alles zwischen `BEGIN:VTODO` und
   * `END:VTODO` fiel durch — die Zeilen darin sahen aus wie Zeilen ausserhalb
   * eines Blocks und wurden übersprungen. Wer einen Kalender abonnierte, in
   * dem Termine UND Aufgaben stehen, bekam die Aufgaben nie zu sehen und
   * erfuhr auch nicht, dass es sie gibt.
   *
   * SIE LANDEN NOCH NICHT IN DER KALENDERTABELLE, und das ist Absicht: eine
   * Aufgabe mit Fälligkeit ist kein Termin. Sie mit `start` in dieselbe
   * Tabelle zu schreiben hiesse, sie als Verabredung auszugeben — genau die
   * Sorte stille Falschaussage, die E290 beim Kalender abgeräumt hat. Wohin
   * sie gehören, ist eine eigene Entscheidung; gelesen und gezählt werden
   * sie ab jetzt, und der Einleser SAGT, wie viele er gefunden hat (§35).
   */
  const icsLesen = (text: string) => {
    /* Frisch je Durchgang (E344) — sonst trüge der zweite Kalender die
       unbekannten Zonen des ersten mit sich herum. */
    unbekannteZonen.clear();
    const zeilen = zeilenFalten(text).split('\n');
    const termine: any[] = [];
    const aufgaben: any[] = [];
    let kalenderName = '';
    let jetzt: any = null;
    let inAlarm = false;
    /* 'termin' oder 'aufgabe' — welche Art gerade gelesen wird. */
    let art = '';

    zeilen.forEach(z => {
      const roh = z.trim();
      if (!roh) return;

      if (roh === 'BEGIN:VEVENT') { jetzt = { alarme: [] }; art = 'termin'; return; }
      if (roh === 'END:VEVENT')   { if (jetzt && jetzt.start) termine.push(jetzt); jetzt = null; art = ''; return; }
      /* EINE AUFGABE BRAUCHT KEIN DATUM. „Steuererklärung" ohne Frist ist
         eine gültige Aufgabe; ein Termin ohne Anfang ist keiner. Deshalb
         wird hier auf den TITEL geprüft und nicht auf `start`. */
      if (roh === 'BEGIN:VTODO')  { jetzt = { alarme: [], art: 'aufgabe' }; art = 'aufgabe'; return; }
      if (roh === 'END:VTODO')    { if (jetzt && (jetzt.titel || jetzt.uid)) aufgaben.push(jetzt); jetzt = null; art = ''; return; }
      if (roh === 'BEGIN:VALARM') { inAlarm = true; return; }
      if (roh === 'END:VALARM')   { inAlarm = false; return; }

      const doppel = roh.indexOf(':');
      if (doppel < 0) return;
      const links = roh.slice(0, doppel);
      const inhalt = roh.slice(doppel + 1);
      const strich = links.indexOf(';');
      const name = (strich < 0 ? links : links.slice(0, strich)).toUpperCase();
      const parameter = strich < 0 ? '' : links.slice(strich + 1);

      if (!jetzt) {
        if (name === 'X-WR-CALNAME') kalenderName = entmaskieren(inhalt);
        return;
      }
      if (inAlarm) {
        if (name === 'TRIGGER') jetzt.alarme.push(inhalt);
        return;
      }

      switch (name) {
        case 'UID':          jetzt.uid = inhalt; break;
        case 'SUMMARY':      jetzt.titel = entmaskieren(inhalt); break;
        case 'DESCRIPTION':  jetzt.text = entmaskieren(inhalt); break;
        case 'LOCATION':     jetzt.ort = entmaskieren(inhalt); break;
        case 'URL':          jetzt.url = inhalt; break;
        case 'STATUS':       jetzt.status = inhalt; break;
        case 'ORGANIZER':    jetzt.wer = inhalt.replace(/^mailto:/i, ''); break;
        case 'CATEGORIES':   jetzt.kategorien = entmaskieren(inhalt).split(',').map(x => x.trim()); break;
        case 'RRULE':        jetzt.regel = inhalt; break;
        /* EXDATE UND RDATE WURDEN BIS E290 GAR NICHT GELESEN.
           Eine abgesagte Stunde kam damit bei jedem Einlesen zurück, und
           ein zusätzlich angesetzter Termin fehlte. Beide dürfen mehrfach
           vorkommen und mehrere Daten mit Komma tragen. */
        case 'EXDATE':       jetzt.exdate = (jetzt.exdate || [])
                               .concat(inhalt.split(',').map((x: string) => x.trim())
                                 .filter(Boolean)); break;
        case 'RDATE':        jetzt.rdate = (jetzt.rdate || [])
                               .concat(inhalt.split(',').map((x: string) => x.trim())
                                 .filter(Boolean)); break;
        case 'DTSTART':      jetzt.start = icsZeit(inhalt, parameter);
                             jetzt.ganzerTag = jetzt.start.length === 10; break;
        case 'DTEND':        jetzt.ende = icsZeit(inhalt, parameter); break;
        /* EIN TERMIN, DER EINE FOLGE ERSETZT (E338). Er trägt dieselbe
           Kennung wie die Reihe und dazu die URSPRÜNGLICHE Zeit der Folge,
           die er ablöst — so schreibt es jeder Kalender, wenn man eine
           einzelne Stunde verlegt. Bis E338 fiel er still durch: er wurde
           als gewöhnlicher Termin gelesen und stand DOPPELT da, einmal
           verlegt und einmal an der alten Stelle aus der Regel. */
        case 'RECURRENCE-ID': jetzt.ersetzt = icsZeit(inhalt, parameter); break;
        case 'DURATION':     jetzt.dauer = inhalt; break;
        /* --- Nur bei Aufgaben (E326) --------------------------------- */
        case 'DUE':          if (art === 'aufgabe') jetzt.faellig = icsZeit(inhalt, parameter); break;
        case 'COMPLETED':    if (art === 'aufgabe') jetzt.erledigtAm = icsZeit(inhalt, parameter); break;
        case 'PERCENT-COMPLETE':
                             if (art === 'aufgabe') jetzt.anteil = Math.max(0, Math.min(100, +inhalt || 0)); break;
        case 'PRIORITY':     if (art === 'aufgabe') jetzt.prioritaet = +inhalt || 0; break;
      }
      /* `STATUS` gilt für beide, heisst bei einer Aufgabe aber etwas
         anderes. COMPLETED ist der einzige Wert, der „fertig" bedeutet —
         CANCELLED heisst abgesagt und IN-PROCESS heisst angefangen. */
      if (art === 'aufgabe' && name === 'STATUS')
        jetzt.fertig = /^COMPLETED$/i.test(inhalt.trim());
    });

    /* Bei ganztägigen Terminen zeigt DTEND auf den Tag danach — das
       verwirrt jeden, der es sieht. Also einen Tag zurück. */
    termine.forEach(t => {
      if (t.ganzerTag && t.ende && t.ende.length === 10) {
        const d = new Date(t.ende + 'T12:00');
        d.setDate(d.getDate() - 1);
        const zurueck = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        t.ende = zurueck === t.start ? '' : zurueck;
      }
    });

    return { name: kalenderName, termine, aufgaben,
             zonenUnklar: [...unbekannteZonen] };
  };

  /**
   * Wiederholungen ausrollen.
   *
   * BIS E290 STAND HIER EINE EIGENE, VIEL ZU KLEINE RECHNUNG. Sie las vier
   * Teile der Regel — FREQ, INTERVAL, UNTIL, COUNT — und warf alles andere
   * STILL weg. Für den häufigsten Stundenplan der Welt,
   * `FREQ=WEEKLY;BYDAY=MO,WE,FR`, wurden aus drei Terminen je Woche einer,
   * am Wochentag des Starts. Kein Hinweis, keine Meldung; man sah einen
   * Kalender, der plausibel aussah und falsch war.
   *
   * Die Rechnung steht jetzt in `core/calendar/wiederholung.ts` und sagt
   * ausserdem, was sie NICHT verstanden hat. Fehlt das Modul (eine alte
   * Einzeldatei), bleibt der Termin einzeln stehen — das ist die sichere
   * Auslegung von „ich kann die Wiederholung nicht lesen".
   */
  /**
   * Wie lange ein Termin dauert, in Millisekunden — oder `null`.
   *
   * ────────────────────────────────────────────────────────────────────────
   * BIS E337 VERLOR JEDE WIEDERHOLUNG IHRE DAUER. `wiederholungen` setzte
   * `ende: ''` für ALLE Folgen, auch für die erste, bei der das Ende
   * richtig gelesen worden war.
   *
   * Der Grund war ein guter: `DTEND` in einer Reihe ist ein absoluter
   * Zeitpunkt und gilt nur für die erste Folge. Ihn unverändert auf alle
   * fünf zu schreiben hiesse, dass die Mathematikstunde am 5. Oktober um
   * 11:30 am 7. SEPTEMBER endet — schlimmer als gar kein Ende.
   *
   * Nur ist „gar kein Ende" auch falsch. Im Stundenplan stand jede Stunde
   * ohne Dauer da; wer sie exportierte, gab einen Termin ohne `DTEND` ab,
   * und jeder empfangende Kalender rät sich dann etwas zurecht.
   *
   * Die richtige Antwort steht in ICS selbst: nicht das ENDE wiederholt
   * sich, sondern die DAUER. Also einmal die Länge bestimmen — aus
   * `DTEND − DTSTART` oder aus `DURATION` — und sie an jede Folge hängen.
   *
   * Reine Rechnung ohne Ablage und ohne Uhr.
   */
  const DAUER_MUSTER =
    /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

  /** `PT1H30M` → 5400000. Unlesbares, Null und Negatives geben `null`. */
  const dauerInMs = (text: unknown): number | null => {
    const m = DAUER_MUSTER.exec(String(text ?? '').trim().toUpperCase());
    if (!m) return null;
    /* EIN MINUSZEICHEN IST KEIN FEHLER, SONDERN ETWAS ANDERES: negative
       Dauern gibt es in ICS, aber nur für Erinnerungen („15 Minuten
       VORHER"). Ein Termin, der vor seinem Anfang endet, ist keiner. */
    if (m[1] === '-') return null;
    const ms = ((+(m[2] ?? 0) * 7 + +(m[3] ?? 0)) * 86400 +
                +(m[4] ?? 0) * 3600 + +(m[5] ?? 0) * 60 + +(m[6] ?? 0)) * 1000;
    return ms > 0 ? ms : null;
  };

  const terminLaenge = (t: any): number | null => {
    if (t && t.start && t.ende) {
      const a = new Date(String(t.start)).getTime();
      const b = new Date(String(t.ende)).getTime();
      if (Number.isFinite(a) && Number.isFinite(b) && b > a) return b - a;
    }
    /* `DURATION` ist der Zwilling von `DTEND` — ICS erlaubt genau eines
       von beiden, und manche Kalender schreiben lieber die Dauer. */
    return dauerInMs(t && t.dauer);
  };

  /** Beginn + Länge, im selben Format wie der Beginn. */
  const endeAus = (startIso: string, laenge: number | null,
                   ganzerTag: boolean): string => {
    if (!laenge || !startIso) return '';
    const d = new Date(startIso);
    if (!Number.isFinite(d.getTime())) return '';
    d.setTime(d.getTime() + laenge);
    /* Ganztägig wird ohne Uhrzeit gelesen und geschrieben — und eine
       Datumszeichenkette ohne Zeit ist Weltzeit, in beide Richtungen.
       Ortszeit-Getter würden hier je nach Zeitzone einen Tag danebenliegen. */
    if (ganzerTag) return d.toISOString().slice(0, 10);
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
           'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
  };

  const wiederholungen = (termin: any, bisTage = 400) => {
    if (!termin.regel) return [termin];
    const W = (window as any).Wiederholung;
    if (!W || typeof W.ausrollen !== 'function') return [termin];

    const erg = W.ausrollen(termin.start, termin.regel, {
      bisTage,
      exdate: termin.exdate || [],
      rdate: termin.rdate || [],
      ganzerTag: !!termin.ganzerTag
    });
    if (!erg.termine.length) return [termin];

    /* EINMAL bestimmt, nicht je Folge — die Länge gehört dem Termin und
       nicht dem Tag. */
    const laenge = terminLaenge(termin);

    return erg.termine.map((iso: string, i: number) =>
      Object.assign({}, termin, {
        /* `folgeNr` IST DER SCHLÜSSEL DER ZEILE, nicht nur eine Zählung —
           siehe `terminSchluessel` weiter unten. Die Kennung eines Termins
           gilt in ICS für die GANZE Reihe; ohne eine zweite Zahl daneben
           sind fünf Mathematikstunden fünfmal dasselbe. */
        start: iso, folge: i > 0, folgeNr: i,
        /* Die erste Folge behält ihr gelesenes Ende WÖRTLICH, wenn sie
           wirklich am Anfang steht — dann ist nichts zu rechnen und nichts
           zu runden. Alle anderen bekommen Beginn + Länge. */
        ende: (iso === termin.start && termin.ende) ? termin.ende
              : endeAus(iso, laenge, !!termin.ganzerTag),
        /* Was an der Regel nicht gelesen werden konnte, reist MIT. Der
           Aufrufer zeigt es an, statt dass es hier verschwindet. */
        regelUnklar: erg.nichtVerstanden.length ? erg.nichtVerstanden : undefined,
        regelSatz: erg.satz || undefined
      }));
  };

  /**
   * Eine ganze Kalenderdatei ausrollen — Reihen zu Folgen, und Ersätze an
   * die Stelle der Folge, die sie meinen.
   *
   * DIESER SCHRITT STAND DREIMAL WÖRTLICH IM CODE (Abo holen, Datei
   * einlesen, Google). Seit E338 gibt es einen zusätzlichen Handgriff, und
   * dreimal denselben zusätzlichen Handgriff einzutragen ist der Anfang
   * davon, dass er an einer der drei Stellen fehlt.
   */
  const ausrollenAlle = (termine: any[], bisTage = 400): any[] => {
    const raus: any[] = [];
    const ersaetze: any[] = [];
    for (const t of termine || []) {
      if (t && t.ersetzt) { ersaetze.push(t); continue; }
      for (const x of wiederholungen(t, bisTage)) raus.push(x);
    }
    for (const e of ersaetze) {
      /* AN DIE STELLE, NICHT DANEBEN. Wer eine Stunde verlegt, hat eine
         Stunde — nicht zwei. */
      const i = raus.findIndex((x: any) =>
        String(x.uid || '') === String(e.uid || '') &&
        String(x.start || '') === String(e.ersetzt || ''));
      if (i >= 0) {
        const alt = raus[i];
        raus[i] = Object.assign({}, alt, e,
          { folgeNr: alt.folgeNr, folge: alt.folge, ersetzt: undefined });
      } else {
        /* Kennt niemand — etwa weil die Reihe gar nicht mitgeliefert wurde
           oder die Regel bis dahin nicht reicht. Dann ist er ein eigener
           Termin; ihn wegzuwerfen wäre der stille Verlust (§35). */
        raus.push(e);
      }
    }
    return raus;
  };

  /**
   * Der Schlüssel einer Zeile in der Termintabelle.
   *
   * ────────────────────────────────────────────────────────────────────────
   * DAS WAR EIN ECHTER DATENSCHADEN, und er sah harmlos aus.
   *
   * In ICS gilt `UID` für die GANZE Reihe: alle fünf Mathematikstunden
   * eines `RRULE:FREQ=WEEKLY;COUNT=5` tragen dieselbe. `uebernehmen`
   * suchte die vorhandene Zeile allein über diese Kennung — also fanden
   * alle fünf Folgen DIESELBE Zeile und schrieben nacheinander hinein.
   *
   * Beim ersten Abgleich fiel das nicht auf: es gab noch keine Zeile, also
   * wurden fünf angelegt. Beim zweiten auch nicht, solange sich nichts
   * geändert hatte — die letzte Folge schrieb genau das hinein, was schon
   * dastand. Gemessen wurde der Schaden erst im Fall, für den ein Abgleich
   * überhaupt da ist:
   *
   *     Die Schule verlegt Mathematik von 8:00 auf 9:00.
   *     Danach standen VIER Stunden weiter auf 8:00 und EINE auf 9:00.
   *     Gemeldet wurden „5 aufgefrischt".
   *
   * Wer dem Kalender glaubt, steht viermal eine Stunde zu früh da. Genau
   * die Sorte Fehler, die §46 meint: nicht ein Absturz, sondern eine
   * Anzeige, die ruhig etwas Falsches behauptet.
   *
   * DIE ZWEITE ZAHL IST DIE FOLGENUMMER und nicht das Datum. Beides wäre
   * möglich, und das Datum wäre sogar das, was ICS dafür vorsieht
   * (`RECURRENCE-ID`). Es hilft hier aber nicht: verschiebt die Quelle die
   * Reihe, ändern sich ALLE Daten, kein Schlüssel passt mehr, und aus fünf
   * verschobenen Stunden würden fünf neue neben fünf alten. Die Nummer
   * bleibt.
   *
   * Reine Rechnung, ohne Ablage — damit ein Prüflauf sie mit erfundenen
   * Terminen füttern kann.
   */
  const terminSchluessel = (t: any): string => {
    const uid = String(t?.uid || ((t?.titel || '') + '|' + (t?.start || '')));
    /* Ein einzelner Termin behält seine Kennung unverändert. Das ist keine
       Feinheit, sondern die Rückwärtsverträglichkeit: jede Zeile, die vor
       heute angelegt wurde, trägt genau diesen Wert. */
    const nr = Number(t?.folgeNr);
    if (!Number.isFinite(nr) || nr < 0) return uid;
    return uid + '#' + nr;
  };

  /* ========================================================================
   * 2. ICS SCHREIBEN
   * ======================================================================*/
  const maskieren = (s: string) => String(s ?? '')
    .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const alsIcsZeit = (v: any, ganzerTag?: any): string => {
    const s = String(v || '');
    if (!s) return '';
    if (ganzerTag || s.length <= 10) return s.replace(/-/g, '');
    const d = new Date(s);
    if (isNaN(d.getTime())) return s.replace(/[-:]/g, '').slice(0, 15);
    return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + 'T' +
           p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + '00Z';
  };

  /** Lange Zeilen umbrechen — das Format will höchstens 75 Zeichen. */
  const falten = (zeile: any) => {
    if (zeile.length <= 74) return zeile;
    const teile = [zeile.slice(0, 74)];
    let rest = zeile.slice(74);
    while (rest.length > 73) { teile.push(' ' + rest.slice(0, 73)); rest = rest.slice(73); }
    if (rest) teile.push(' ' + rest);
    return teile.join('\r\n');
  };

  /** Eine Datenbank als ICS ausgeben. */
  const icsSchreiben = (coll: any, view: any) => {
    const dk = (view && view.dateKey) ||
      Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
    if (!dk) throw new Error('Diese Datenbank hat keine Datums-Spalte.');
    const endeKey = view && view.endeKey && coll.schema[view.endeKey] ? view.endeKey : null;
    const ortKey  = Object.keys(coll.schema).find(k => coll.schema[k].type === 'place') ||
                    Object.keys(coll.schema).find(k => /ort|location/i.test(coll.schema[k].name));

    const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Redion//DE',
                    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
                    'X-WR-CALNAME:' + maskieren(coll.name)];

    /* ─── REIHEN ERKENNEN (E338, L106 Punkt 8) ──────────────────────────
       Bis hier gab jede Zeile einen eigenen VEVENT ohne Regel. Was Redion
       einlas, konnte es nicht wieder ausgeben: aus einem wöchentlichen
       Stundenplan wurden vierzig Einzeltermine, und die Reihe war fort.

       FÜNF ZEILEN MIT DEMSELBEN `RRULE` AUSZUGEBEN WÄRE SCHLIMMER als gar
       keins — der empfangende Kalender sähe fünf unendliche Reihen. Also
       so, wie ICS es vorsieht:

         die erste Folge      als VEVENT mit `RRULE`
         eine verschobene     als VEVENT mit `RECURRENCE-ID` (die URSPRÜNGLICHE
                              Zeit) und der neuen `DTSTART`
         eine fehlende        als `EXDATE` am Kopf
         alle übrigen         gar nicht — sie stehen in der Regel

       WANN GAR NICHT: ohne Regel am Kopf, ohne Kopf, oder ohne das Modul
       `Wiederholung`. Dann bleibt es beim alten Weg, und der ist nicht
       falsch, nur ausführlich. */
    const alleZeilen = Store.rowsOf(coll.id);
    const regelKey = coll.schema && coll.schema.regel ? 'regel' : '';
    /* Reihenkennung -> { kopf, folgen: Map<Nr, Zeile> } */
    const reihen = new Map<string, { kopf: any; folgen: Map<number, any> }>();
    if (regelKey) {
      alleZeilen.forEach((r: any) => {
        const u = String((r.props || {}).uid || '');
        const raute = u.lastIndexOf('#');
        if (raute <= 0 || !/^\d+$/.test(u.slice(raute + 1))) return;
        const id = u.slice(0, raute);
        const nr = Number(u.slice(raute + 1));
        let e = reihen.get(id);
        if (!e) { e = { kopf: null, folgen: new Map() }; reihen.set(id, e); }
        e.folgen.set(nr, r);
        if (nr === 0) e.kopf = r;
      });
      /* Eine Reihe ohne Kopf oder ohne Regel am Kopf ist keine, mit der
         sich etwas anfangen lässt — die Zeilen gehen einzeln hinaus. */
      for (const [id, e] of [...reihen])
        if (!e.kopf || !String(Datenbank.wert(e.kopf, 'regel', coll) || '').trim())
          reihen.delete(id);
    }

    /* Welche Zeile wird von einer Regel schon abgedeckt? */
    const inReihe = new Map<string, { id: string; nr: number }>();
    for (const [id, e] of reihen)
      for (const [nr, r] of e.folgen) inReihe.set(r.id, { id, nr });

    const W = (window as any).Wiederholung;

    /**
     * Einen VEVENT schreiben. `zusatz` trägt, was diese Zeile zusätzlich
     * braucht: die Regel am Kopf, die ursprüngliche Zeit an einer
     * verschobenen Folge.
     */
    const schreibeTermin = (r: any, uid: string, zusatz: string[] = []): void => {
      const start = Datenbank.wert(r, dk, coll);
      if (!start) return;
      const ganz = String(start).length <= 10;
      const ende = endeKey ? Datenbank.wert(r, endeKey, coll) : '';
      let ort = ortKey ? Datenbank.wert(r, ortKey, coll) : '';
      if (ort && typeof ort === 'object') ort = ort.name || '';

      /* Bei ganztägigen Terminen zeigt DTEND wieder auf den Tag danach */
      let dtEnde = ende;
      if (ganz && ende) {
        const d = new Date(ende + 'T12:00');
        d.setDate(d.getDate() + 1);
        dtEnde = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
      }

      zeilen.push('BEGIN:VEVENT');
      zeilen.push('UID:' + uid);
      zeilen.push('DTSTAMP:' + alsIcsZeit(new Date().toISOString(), false));
      zeilen.push('DTSTART' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(start, ganz));
      if (dtEnde) zeilen.push('DTEND' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(dtEnde, ganz));
      zeilen.push('SUMMARY:' + maskieren(r.text || 'Ohne Titel'));
      if (ort) zeilen.push('LOCATION:' + maskieren(ort));
      for (const z of zusatz) zeilen.push(z);

      /* Alles andere kommt in die Beschreibung, damit nichts verloren geht.
         DIE REGEL NICHT — sie steht seit E338 als `RRULE` da, wo sie
         hingehört, und zweimal dieselbe Angabe ist eine zu viel. */
      const rest = Object.keys(coll.schema)
        .filter(k => k !== dk && k !== endeKey && k !== regelKey &&
                     coll.schema[k].type !== 'title')
        .map(k => coll.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(r, k, coll)))
        .filter(x => !/: *$|: *—$/.test(x));
      if (rest.length) zeilen.push('DESCRIPTION:' + maskieren(rest.join('\n')));
      zeilen.push('END:VEVENT');
    };

    /* ── ZUERST DIE REIHEN ──────────────────────────────────────────────── */
    for (const [id, e] of reihen) {
      const regel = String(Datenbank.wert(e.kopf, 'regel', coll) || '').trim();
      const kopfStart = String(Datenbank.wert(e.kopf, dk, coll) || '');
      const ganz = kopfStart.length <= 10;

      /* WAS DIE REGEL ERGEBEN WÜRDE — dagegen wird verglichen. Ohne das
         Modul lässt sich nichts vergleichen; dann geht der Kopf mit seiner
         Regel hinaus und die Folgen einzeln, was ausführlich, aber nicht
         falsch ist. */
      const soll: string[] = (W && typeof W.ausrollen === 'function')
        ? (W.ausrollen(kopfStart, regel, { bisTage: 4000, ganzerTag: ganz })
             .termine || [])
        : [];

      const fehlend: string[] = [];
      const verschoben: Array<{ r: any; ur: string }> = [];
      soll.forEach((ur: string, nr: number) => {
        const zeile = e.folgen.get(nr);
        /* NICHT DA HEISST GESTRICHEN, und das gehört als `EXDATE` an den
           Kopf. Ohne diese Zeile käme jede von Hand gelöschte Stunde beim
           Empfänger zurück — genau der Fehler, den E290 beim EINLESEN
           abgeräumt hat, nur in der anderen Richtung. */
        if (!zeile) { fehlend.push(ur); return; }
        if (nr === 0) return;                    /* der Kopf selbst */
        const ist = String(Datenbank.wert(zeile, dk, coll) || '');
        if (ist && ist !== ur) verschoben.push({ r: zeile, ur });
      });

      const zusatz = ['RRULE:' + regel];
      for (const ur of fehlend)
        zusatz.push('EXDATE' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(ur, ganz));
      schreibeTermin(e.kopf, id, zusatz);

      /* Eine verschobene Folge trägt DIESELBE Kennung und dazu die
         URSPRÜNGLICHE Zeit — daran erkennt der Empfänger, welche der
         Reihe sie ersetzt. Ohne `RECURRENCE-ID` wäre es ein zweiter
         Termin neben dem alten. */
      for (const v of verschoben)
        schreibeTermin(v.r, id,
          ['RECURRENCE-ID' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(v.ur, ganz)]);
    }

    /* ── UND DANN ALLES, WAS ZU KEINER REIHE GEHÖRT ──────────────────────── */
    alleZeilen.forEach((r: any) => {
      if (inReihe.has(r.id)) return;
      schreibeTermin(r, r.id + '@notizen');
    });

    zeilen.push('END:VCALENDAR');
    return zeilen.map(falten).join('\r\n');
  };

  /* ========================================================================
   * 3. TERMINE IN EINE DATENBANK SCHREIBEN
   * ======================================================================*/
  const SCHEMA = () => ({
    title: { name: 'Termin',   type: 'title' },
    start: { name: 'Beginn',   type: 'date' },
    ende:  { name: 'Ende',     type: 'date' },
    ort:   { name: 'Ort',      type: 'place' },
    quelle:{ name: 'Kalender', type: 'select', options: [] },
    text:  { name: 'Notiz',    type: 'text' },
    uid:   { name: 'Kennung',  type: 'text' },
    link:  { name: 'Link',     type: 'url' },
    /* DIE WIEDERHOLUNGSREGEL, roh wie sie in der Datei steht (E338). Sie
       steht nur an der ERSTEN Folge einer Reihe — sie gilt für die ganze,
       und fünfmal dieselbe Regel wäre fünfmal dieselbe Wahrheit. Roh und
       nicht als Satz, weil sie beim Ausgeben wieder gebraucht wird; der
       lesbare Satz entsteht daraus jederzeit neu (`Wiederholung.lesen`). */
    regel: { name: 'Wiederholung', type: 'text' }
  });

  /** Legt die Termin-Datenbank an oder findet die vorhandene wieder. */
  const zielDatenbank = (seiteId?: string, name = 'Termine') => {
    const da = Object.values<any>(Store.cache.collections)
      .find(c => c.name === name && c.schema.uid && c.schema.start);
    if (da) {
      /* EINE SPALTE NACHTRAGEN IST DAS EINZIGE, WAS HIER GEFAHRLOS GEHT
         (E338, §9). Sie kommt leer dazu, keine vorhandene Zeile ändert
         sich, und wer sie nicht will, löscht sie wie jede andere. Eine
         Spalte UMzubenennen oder ihren Typ zu ändern wäre etwas ganz
         anderes — das wäre eine Datenmigration und bräuchte einen eigenen
         Bogen. */
      if (!da.schema.regel) {
        da.schema.regel = { name: 'Wiederholung', type: 'text' };
        Store.updateCollection(da.id, { schema: da.schema });
      }
      return da;
    }
    const { collectionId } = Store.addDatabase(seiteId || App.aktuelleSeite(), name, SCHEMA(), 'calendar');
    const c = Store.getCollection(collectionId);
    const v = Store.getView(c.viewIds[0]);
    Store.updateView(v.id, { dateKey: 'start', endeKey: 'ende' });
    return c;
  };

  /* ========================================================================
   * AUFGABEN AUS DEM KALENDER (E345, L106 Punkt 6 Rest)
   * ------------------------------------------------------------------------
   * E326 hat `VTODO` lesbar gemacht. Seitdem stand in L106:
   *
   *     „die Aufgaben landen in keinem Aufgabenmodell. Sie werden gelesen
   *      und genannt, aber nicht einsortiert — bewusst, denn eine Aufgabe
   *      mit Fälligkeit als Termin in die Kalendertabelle zu schreiben wäre
   *      die stille Falschaussage, die E290 gerade abgeräumt hat."
   *
   * Der Einwand galt der falschen TABELLE, nicht der Sache. Redion hat ein
   * Aufgabenmodell — eine Sammlung mit `istAufgaben` und einem Eintrag in
   * `aufgabenQuellen` erscheint unter „Meine Apps → Meine Aufgaben"
   * (`datenbanken/steuerung.ts`, `wissen/bibliothek.ts`). Dorthin gehören
   * sie, und dorthin gehen sie jetzt.
   *
   * DIE SPALTEN HEISSEN, WIE DAS AUFGABENMODELL SIE ERWARTET —
   * `aufgFertig`, `aufgFrist`, `aufgWer`. Ein eigener Satz Namen wäre eine
   * Tabelle, die aussieht wie Aufgaben und in „Meine Aufgaben" nicht
   * auftaucht: §47 von der leisen Seite.
   *
   * UND SIE ENTSTEHT NUR, WENN ES WIRKLICH AUFGABEN GIBT. Eine leere
   * Aufgabentabelle, die bei jedem Kalender-Abo mit angelegt wird, ist
   * genau die Anzeige, die immer etwas anzeigt und deshalb nichts sagt —
   * die Falle, in die E284, E286, E288, E289 und E290 gelaufen sind.
   * ======================================================================*/

  const AUFGABEN_SCHEMA = () => ({
    title:      { name: 'Aufgabe',   type: 'title' },
    aufgFertig: { name: 'Fertig',    type: 'checkbox' },
    aufgFrist:  { name: 'Frist',     type: 'date' },
    aufgWer:    { name: 'Zuständig', type: 'person' },
    quelle:     { name: 'Kalender',  type: 'select', options: [] },
    text:       { name: 'Notiz',     type: 'text' },
    uid:        { name: 'Kennung',   type: 'text' }
  });

  /**
   * Die Aufgabentabelle — angelegt, wenn es sie noch nicht gibt.
   *
   * Sie wird in `aufgabenQuellen` eingetragen, denn ohne diesen Eintrag
   * fragt „Meine Aufgaben" sie nie ab. Die Sammlung allein genügt nicht;
   * das ist genau die Verdrahtung, die `steuerung.ts` beim Umschalten von
   * Hand vornimmt.
   */
  const aufgabenDatenbank = (seiteId?: string, name = 'Kalender-Aufgaben') => {
    const anmelden = (c: any) => {
      const q = Store.getMeta('aufgabenQuellen', null) || [];
      if (!q.includes(c.id)) Store.setMeta('aufgabenQuellen', [...q, c.id]);
      return c;
    };
    const da = Object.values<any>(Store.cache.collections)
      .find(c => c.name === name && c.schema.uid && c.schema.aufgFertig);
    if (da) return anmelden(da);
    const { collectionId } = Store.addDatabase(
      seiteId || App.aktuelleSeite(), name, AUFGABEN_SCHEMA(), 'check');
    const c = Store.getCollection(collectionId);
    Store.updateCollection(c.id, { istAufgaben: true });
    return anmelden(Store.getCollection(c.id));
  };

  /**
   * Aufgaben übernehmen — derselbe Bau wie `uebernehmen` für Termine:
   * über die Kennung wiederfinden, auffrischen statt doppeln.
   *
   * OHNE AUFRÄUMEN. Eine Aufgabe, die die Quelle nicht mehr liefert, bleibt
   * stehen. Das ist nicht Nachlässigkeit, sondern derselbe Grund wie bei
   * L112: ohne ein Gedächtnis am Abo lässt sich nicht sagen, ob sie
   * gestrichen wurde. Das Gedächtnis aus E343 zählt Termine; es auf
   * Aufgaben auszuweiten ist ein eigener Schritt und kein Beifang.
   */
  const aufgabenUebernehmen = (coll: any, aufgaben: any[], quelle?: string) => {
    const vorhanden = new Map<string, any>();
    Store.rowsOf(coll.id).forEach((r: any) => {
      const u = (r.props || {}).uid;
      if (u) vorhanden.set(String(u), r);
    });

    if (quelle && coll.schema.quelle) {
      const opts = coll.schema.quelle.options || [];
      if (!opts.some((o: any) => o.name === quelle)) {
        const farben = ['blue','green','orange','purple','pink','red','yellow','brown'];
        opts.push({ name: quelle, color: farben[opts.length % farben.length] });
        coll.schema.quelle.options = opts;
        Store.updateCollection(coll.id, { schema: coll.schema });
      }
    }

    let neu = 0, frisch = 0;
    aufgaben.forEach((a: any) => {
      const u = String(a.uid || ((a.titel || '') + '|' + (a.faellig || '')));
      const props: Record<string, unknown> = {
        aufgFertig: !!a.fertig,
        aufgFrist: a.faellig || '',
        quelle: quelle || '',
        text: a.text || '',
        uid: u
      };
      const alt = vorhanden.get(u);
      if (alt) {
        /* `aufgWer` wird NICHT geschrieben. Wer zuständig ist, entscheidet
           der Mensch hier — die Quelle weiss es nicht, und ein Feld, das
           bei jedem Abgleich zurückgesetzt wird, ist schlimmer als ein
           leeres (§9). */
        Object.entries<any>(props).forEach(([k, w]) => Store.setProp(alt.id, k, w));
        Store.updateBlock(alt.id, { text: a.titel || 'Ohne Titel' });
        frisch++;
      } else {
        const r = Store.addRow(coll.id, props);
        Store.updateBlock(r.id, { text: a.titel || 'Ohne Titel' });
        neu++;
      }
    });
    return { neu, frisch };
  };

  /**
   * Termine übernehmen. Was schon da ist (gleiche Kennung), wird
   * aufgefrischt statt doppelt angelegt — sonst wächst die Liste bei
   * jedem Abgleich.
   */
  const uebernehmen = (coll: any, termine: any, quelle?: any,
                       vorherGeliefert?: string[]) => {
    const vorhanden = new Map();
    /* DER ZWEITE INDEX IST DER UMZUGSWEG (E335). Jede Zeile, die vor E335
       aus einer Reihe entstanden ist, trägt die nackte Reihenkennung —
       fünf Zeilen, fünfmal derselbe Wert. Über `terminSchluessel` findet
       sie niemand mehr, und ohne diesen zweiten Griff bekäme jeder
       Nutzer beim nächsten Abgleich seine Termine DOPPELT.
       Kennung + Beginn ist dafür genau richtig: es trifft die eine Zeile,
       die diese Folge wirklich meint, ganz gleich wie sie geschlüsselt war. */
    const nachBeginn = new Map();
    Store.rowsOf(coll.id).forEach((r: any) => {
      const u = (r.props || {}).uid;
      if (!u) return;
      vorhanden.set(u, r);
      const roh = String(u).replace(/#\d+$/, '');
      const beg = (r.props || {}).start || '';
      if (beg) nachBeginn.set(roh + '|' + beg, r);
    });

    /* Die Quelle als Option führen, damit man filtern kann */
    if (quelle && coll.schema.quelle) {
      const opts = coll.schema.quelle.options || [];
      if (!opts.some((o: any) => o.name === quelle)) {
        const farben = ['blue','green','orange','purple','pink','red','yellow','brown'];
        opts.push({ name: quelle, color: farben[opts.length % farben.length] });
        coll.schema.quelle.options = opts;
        Store.updateCollection(coll.id, { schema: coll.schema });
      }
    }

    /* WELCHE REIHEN DIESER LAUF ÜBERHAUPT GELIEFERT HAT (E336). Nur für
       die darf hinterher aufgeräumt werden — siehe unten. Eine Reihe, die
       gar nicht kam, sagt nichts darüber, ob es sie noch gibt. */
    const reihenImLauf = new Set<string>();
    termine.forEach((t: any) => {
      const k = terminSchluessel(t);
      const raute = k.lastIndexOf('#');
      if (raute > 0) reihenImLauf.add(k.slice(0, raute));
    });

    let neu = 0, frisch = 0, umgezogen = 0;
    /* Was in DIESEM Durchgang schon beschrieben wurde. Ohne das könnten
       zwei Folgen wieder in derselben Zeile landen — genau der Fehler,
       den dieser Bogen abräumt, nur eine Ebene tiefer. */
    const belegt = new Set<string>();
    /* Und wie sie HEISSEN — das Gedächtnis des Abos (E343, siehe unten). */
    const belegtSchluessel = new Set<string>();
    termine.forEach((t: any) => {
      const schluessel = terminSchluessel(t);
      belegtSchluessel.add(schluessel);
      const props: Record<string, unknown> = {
        start: t.start || '', ende: t.ende || '',
        ort: t.ort ? { name: t.ort } : null,
        quelle: quelle || '', text: t.text || '',
        uid: schluessel, link: t.url || ''
      };
      /* DIE REGEL NUR AN DIE ERSTE FOLGE (E338). Sie gilt für die ganze
         Reihe; an jeder Folge stünde fünfmal dieselbe Wahrheit, und beim
         Ausgeben wären es fünf Reihen statt einer. Und nur, wenn die
         Tabelle die Spalte überhaupt führt — eine Sammlung, die jemand von
         Hand gebaut hat, bekommt sie nicht untergeschoben. */
      if (coll.schema && coll.schema.regel)
        props.regel = (t.regel && Number(t.folgeNr) === 0) ? String(t.regel) : '';
      let alt = vorhanden.get(schluessel);
      if (alt && belegt.has(alt.id)) alt = null;
      if (!alt) {
        /* Der Umzugsweg: eine Zeile von vor E335 finden. */
        const roh = String(t.uid || ((t.titel || '') + '|' + (t.start || '')));
        const kandidat = nachBeginn.get(roh + '|' + (t.start || ''));
        if (kandidat && !belegt.has(kandidat.id)) { alt = kandidat; umgezogen++; }
      }
      if (alt) {
        belegt.add(alt.id);
        Object.entries<any>(props).forEach(([k, w]) => Store.setProp(alt.id, k, w));
        Store.updateBlock(alt.id, { text: t.titel || 'Ohne Titel' });
        frisch++;
      } else {
        const r = Store.addRow(coll.id, props);
        belegt.add(r.id);
        Store.updateBlock(r.id, { text: t.titel || 'Ohne Titel' });
        neu++;
      }
    });
    /* ─── WAS DIE QUELLE NICHT MEHR HAT (E336, L112) ────────────────────
       Verkürzt die Schule eine Reihe — die letzten zwei Stunden vor den
       Ferien fallen aus —, blieben die überzähligen Zeilen bisher mit
       ihren alten Daten stehen. Im Stundenplan standen zwei Stunden, die
       es nicht mehr gibt, und nichts sagte es.

       ZWEI SPERREN, UND JEDE EINZELNE IST NÖTIG:

         · Nur Zeilen einer Reihe, die DIESER Lauf geliefert hat. Kommt
           eine Reihe gar nicht — Netzstörung, leere Antwort, Abo
           abgeschaltet —, wird nichts angefasst. Das ist der Unterschied
           zwischen „die Reihe ist kürzer" und „ich habe nichts gehört",
           und ohne ihn hätte ein Wackler im WLAN den Kalender geleert.
         · Nie ein Einzeltermin. Der trägt keine Folgenummer, also lässt
           sich über ihn gar nichts sagen — er kann von Hand angelegt
           worden sein.

       EINE DRITTE SPERRE STAND HIER KURZ und war falsch: „nur Zeilen
       DIESER Quelle". Sie klang vernünftig — zwei Kalender könnten
       dieselbe Kennung führen. Der Prüflauf zeigte, dass es diesen Fall
       gar nicht gibt: `uebernehmen` findet die Zeile über die Kennung,
       ganz gleich welcher Name danebensteht, also entsteht für dieselbe
       Kennung nie eine zweite Zeile. Was die Sperre stattdessen bewirkte,
       war ein Schaden: BENENNT jemand sein Abo um, tragen die
       aufgefrischten Zeilen den neuen Namen und die überzähligen den
       alten — und wären damit für immer unaufräumbar. Eine Sperre gegen
       einen Fall, den es nicht gibt, sperrt am Ende den, den es gibt.

       UND ES WIRD NICHT GELÖSCHT, SONDERN IN DEN PAPIERKORB GELEGT. Eine
       Zeile kann eigene Notizen tragen, eigene Spalten, eine Verknüpfung
       zu einer Seite (§9, §13). `trashBlock` nimmt sie aus der Ansicht
       (`rowsOf` filtert `alive`), lässt aber alles stehen und ist mit
       einem Klick rückgängig — und seit E250 erreicht es auch den Server. */
    let entfallen = 0;
    if (reihenImLauf.size) {
      Store.rowsOf(coll.id).forEach((r: any) => {
        if (belegt.has(r.id)) return;
        const u = String((r.props || {}).uid || '');
        const raute = u.lastIndexOf('#');
        if (raute <= 0 || !/^\d+$/.test(u.slice(raute + 1))) return;
        if (!reihenImLauf.has(u.slice(0, raute))) return;
        Store.trashBlock(r.id);
        entfallen++;
      });
    }

    /* ─── UND DER EINZELNE GESTRICHENE TERMIN (E343, L112 Rest) ──────────
       E336 hat die Reihen abgeräumt. Für einen Termin, der zu keiner Reihe
       gehört, stand in L112: „über einen Einzeltermin lässt sich nichts
       sagen. Er kann von Hand angelegt worden sein, er kann aus einer Datei
       stammen, er kann zu einem Abo gehören, das gerade nur ein kürzeres
       Zeitfenster liefert."

       Das stimmte, SOLANGE man nur die Zeile ansieht. Was gefehlt hat, war
       ein Gedächtnis: WELCHE Kennungen hat dieses Abo beim letzten Mal
       geliefert? Steht eine Kennung in dieser Liste und kommt sie diesmal
       nicht mehr, dann — und nur dann — ist der Satz „die Quelle hat ihn
       gestrichen" belegt statt geraten.

       DIE LISTE MACHT DIE HEIKELSTEN FÄLLE VON SELBST SICHER, und das ist
       der eigentliche Gewinn: ein von Hand angelegter Termin war NIE in
       ihr, ein eingelesener auch nicht. Es braucht keine Heuristik, die
       „sieht von Hand angelegt aus" rät — die Frage stellt sich gar nicht.

       DREI SPERREN:

         · Ohne alte Liste passiert nichts. Jedes Abo, das es heute gibt,
           hat noch keine — der erste Lauf nach dieser Fassung SCHREIBT sie
           nur. Ohne diese Sperre räumte genau dieser erste Lauf alles weg,
           was gerade nicht geliefert wird.
         · Ein leerer Lauf räumt nicht auf. Dieselbe Sperre wie oben bei den
           Reihen, und aus demselben Grund: „die Quelle hat nichts mehr" und
           „ich habe nichts gehört" sehen gleich aus und sind es nicht.
         · Nur Kennungen aus der EIGENEN alten Liste. Zwei Abos in derselben
           Tabelle räumen einander nicht ab.

       WAS ES KOSTET, und es ist benannt: liefert ein Abo plötzlich ein
       kürzeres Zeitfenster, wandern die Termine ausserhalb in den
       Papierkorb. Das ist derselbe Handel, den E336 für Reihen eingegangen
       ist — und wieder in den Papierkorb, nicht ins Nichts (§9, §13). */
    const geliefert = [...belegtSchluessel];
    if (termine.length && vorherGeliefert && vorherGeliefert.length) {
      const jetztDa = new Set(geliefert);
      const frueher = new Set(vorherGeliefert);
      Store.rowsOf(coll.id).forEach((r: any) => {
        if (belegt.has(r.id)) return;
        const u = String((r.props || {}).uid || '');
        if (!u || jetztDa.has(u) || !frueher.has(u)) return;
        Store.trashBlock(r.id);
        entfallen++;
      });
    }

    return { neu, frisch, umgezogen, entfallen, geliefert };
  };

  /* ========================================================================
   * 4. ABOS
   * ======================================================================*/
  const abos = () => Store.getMeta('ics:abos', []) || [];
  const aboSpeichern = (liste: any) => Store.setMeta('ics:abos', liste);

  /** webcal:// ist nur https:// mit anderem Namen. */
  const adresseGerade = (u: any) => String(u || '').trim()
    .replace(/^webcal:\/\//i, 'https://');

  const aboHolen = async (abo: any) => {
    const url = adresseGerade(abo.url);
    let text;
    try {
      const r = await Verbindungen.ruf(url, { versuche: 2 });
      text = await r.text();
    } catch (e) {
      /* Zweiter Anlauf über die Brücke, falls eine eingetragen ist */
      if (!Store.getMeta('verb:proxy', '')) throw e;
      const r = await Verbindungen.ruf(url, { versuche: 2, ueberBruecke: true });
      text = await r.text();
    }
    if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('Unter dieser Adresse liegt kein Kalender.');
    const gelesen = icsLesen(text);
    const alle = ausrollenAlle(gelesen.termine);
    return { name: gelesen.name || abo.name || 'Abo', termine: alle,
             aufgaben: gelesen.aufgaben, zonenUnklar: gelesen.zonenUnklar || [] };
  };

  const alleAbosHolen = async (seiteId?: string) => {
    const liste = abos().filter((a: any) => a.an !== false);
    if (!liste.length) { UI.toast('Kein Kalender abonniert'); return; }
    const coll = zielDatenbank(seiteId);
    let neu = 0, frisch = 0, entfallen = 0, schief = [];
    /* Für den Sammelhinweis unten — die Termine selbst wandern in die
       Datenbank und sind danach nicht mehr in der Hand. */
    const alleTermine: any[] = [];
    /* AUFGABEN AUS DEM ABO (L106 Punkt 6, E326). Sie werden seit E326
       gelesen, landen aber noch nicht in der Kalendertabelle — eine Aufgabe
       mit Fälligkeit ist kein Termin, und sie mit `start` dort einzutragen
       hiesse, sie als Verabredung auszugeben. Verschwiegen werden sie
       trotzdem nicht: bis E326 fielen sie stumm durch, und niemand erfuhr,
       dass der Kalender überhaupt welche enthält (§35). */
    let offeneAufgaben = 0;
    /* Zeitzonen, die dieser Browser nicht kennt (E344). Gesammelt und
       EINMAL genannt — bei vierzig Terminen aus derselben Outlook-Zone
       stünde derselbe Satz sonst vierzigmal da. */
    const fremdeZonen = new Set<string>();
    let aufgNeu = 0, aufgFrisch = 0;
    for (const a of liste) {
      try {
        const k = await aboHolen(a);
        /* DAS GEDÄCHTNIS DES ABOS (E343, L112 Rest). Was dieses Abo beim
           letzten Mal geliefert hat, geht hinein; was es diesmal liefert,
           kommt heraus und wird gemerkt. Nur so lässt sich von einem
           EINZELNEN Termin sagen, dass die Quelle ihn gestrichen hat —
           statt es zu raten.

           Die Liste hängt am Abo und nicht an der Tabelle: zwei Abos in
           derselben Kalendertabelle sollen einander nicht abräumen. Und
           sie steht in `ics:abos`, also reist sie mit der Sicherung (§11)
           — ohne sie wäre nach einem Einspielen der erste Lauf wieder ein
           Lauf ohne Gedächtnis, und das ist zwar harmlos, aber unnötig. */
        const e = uebernehmen(coll, k.termine, a.name || k.name,
                              Array.isArray(a.geliefert) ? a.geliefert : undefined);
        /* NUR NACH EINEM LAUF, DER WIRKLICH ETWAS BRACHTE. Eine leere
           Antwort darf das Gedächtnis nicht löschen — beim nächsten Mal
           wäre sonst alles „neu geliefert" und nichts mehr aufräumbar.
           Der Fehlerfall kommt hier ohnehin nicht an; er liegt im `catch`. */
        if (k.termine.length) a.geliefert = e.geliefert;
        alleTermine.push(...k.termine);
        offeneAufgaben += (k.aufgaben || []).filter((x: any) => !x.fertig).length;
        for (const z of (k.zonenUnklar || [])) fremdeZonen.add(String(z));
        /* DIE AUFGABEN IN IHRE EIGENE TABELLE (E345). Erst hier, und nur
           wenn dieser Kalender welche hat — eine leere Aufgabentabelle bei
           jedem Termin-Abo wäre die Anzeige, die immer etwas anzeigt. */
        if ((k.aufgaben || []).length) {
          const ac = aufgabenDatenbank(seiteId);
          const ae = aufgabenUebernehmen(ac, k.aufgaben, a.name || k.name);
          aufgNeu += ae.neu; aufgFrisch += ae.frisch;
        }
        neu += e.neu; frisch += e.frisch; entfallen += e.entfallen || 0;
        a.zuletzt = Store.now();
      } catch (err) {
        schief.push((a.name || a.url) + ': ' +
          (err instanceof Error ? err.message : String(err)));
      }
    }
    aboSpeichern(abos());
    App.zeichneSeite();
    if (schief.length) UI.banner('Nicht geklappt — ' + schief.join(' · '), 'warn');

    /* WAS AN DEN REGELN NICHT GELESEN WERDEN KONNTE, WIRD GESAGT (E295,
       L106 Punkt 7). E290 gibt es jedem Termin mit — angezeigt hat es
       bis jetzt niemand, und ein Hinweis, den niemand sieht, ist derselbe
       Stillstand wie vorher.

       Gesammelt und EINMAL genannt, nicht je Termin: bei einem Kalender
       mit vierzig Wochenterminen stünde derselbe Satz vierzigmal da, und
       ab dem dritten liest ihn keiner mehr. */
    /* WAS AN ZEITZONEN NICHT GELESEN WERDEN KONNTE (E344, L106 Punkt 5).
       Outlook schreibt `TZID=W. Europe Standard Time` — ein Windows-Name,
       den keine IANA-Datenbank kennt. Die Zeiten daraus stehen dann so da,
       wie sie in der Datei stehen, und das ist ein Unterschied, den man
       wissen muss. Nur wenn es wirklich einen gibt: der Normalfall ist ein
       Kalender mit `Z` oder mit einer richtigen Zone, und der schweigt. */
    if (fremdeZonen.size)
      UI.banner('Diese Zeitzonen kennt dein Browser nicht: ' +
        [...fremdeZonen].join(', ') + '. Die Termine daraus stehen mit der ' +
        'Uhrzeit da, die in der Datei steht — ohne Umrechnung.', 'warn');

    const unklar = new Set<string>();
    for (const t of alleTermine)
      for (const x of (t.regelUnklar || [])) unklar.add(String(x));
    if (unklar.size)
      UI.banner('Ein Teil der Wiederholungsregeln blieb ungelesen: ' +
        [...unklar].join(', ') + '. Die Termine daraus fehlen.', 'warn');

    /* UND DIE AUFGABEN, wenn welche da sind. Nur dann: ein Kalender ohne
       VTODO ist der Normalfall, und „0 Aufgaben" wäre die Zeile, die man
       nach dem zweiten Mal nicht mehr liest. */
    /* WOHIN DIE AUFGABEN GEGANGEN SIND (E345). Bis eben stand hier „Redion
       liest sie, legt sie aber noch nicht an" — richtig gesagt und
       trotzdem eine Sackgasse. Jetzt sagt der Satz, WO sie sind.

       Und er nennt die offenen, nicht alle: eine Aufgabe, die die Quelle
       schon als erledigt liefert, ist keine, die jemanden interessiert. */
    if (aufgNeu || aufgFrisch)
      UI.banner(
        (aufgNeu ? aufgNeu + (aufgNeu === 1 ? ' Aufgabe neu' : ' Aufgaben neu') : '') +
        (aufgNeu && aufgFrisch ? ', ' : '') +
        (aufgFrisch ? aufgFrisch + ' aufgefrischt' : '') +
        ' — unter <b>Meine Aufgaben</b>, nicht im Kalender. Eine Aufgabe mit ' +
        'Frist ist kein Termin, und sie in die Kalendertabelle zu schreiben ' +
        'hiesse, sie als Verabredung auszugeben.' +
        (offeneAufgaben ? ' Davon ' + offeneAufgaben +
          (offeneAufgaben === 1 ? ' noch offen.' : ' noch offen.') : ''), 'info');

    /* WAS DIE QUELLE GESTRICHEN HAT, WIRD GESAGT — und nur dann (E336).
       „0 entfallen" wäre die Zeile, die man nach dem zweiten Mal nicht
       mehr liest, und der Normalfall ist genau das. Der Satz nennt auch,
       WO die Termine hin sind: in den Papierkorb, nicht ins Nichts. */
    if (entfallen)
      UI.banner(entfallen + (entfallen === 1
          ? ' Termin steht nicht mehr im Kalender der Quelle und liegt jetzt '
          : ' Termine stehen nicht mehr im Kalender der Quelle und liegen jetzt ') +
        'im Papierkorb. Von dort holst du sie zurück, falls das ein Irrtum war.',
        'info');

    UI.toast(neu + ' neu, ' + frisch + ' aufgefrischt');
  };

  /* ========================================================================
   * 5. GOOGLE CALENDAR
   * ======================================================================*/
  const GC = 'https://www.googleapis.com/calendar/v3';

  const googleKalender = async () => {
    const token = await Verbindungen.googleZugang(['profil', 'kalender']);
    const d = await Verbindungen.jsonRuf(GC + '/users/me/calendarList?maxResults=50', { token });
    return (d.items || []).map((c: any) => ({
      id: c.id, name: c.summary, farbe: c.backgroundColor,
      standard: !!c.primary, rolle: c.accessRole
    }));
  };

  const googleTermine = async (kalenderId: any, vonTagen = -30, bisTagen = 180) => {
    const token = await Verbindungen.googleZugang(['profil', 'kalender']);
    const von = new Date(); von.setDate(von.getDate() + vonTagen);
    const bis = new Date(); bis.setDate(bis.getDate() + bisTagen);
    const url = GC + '/calendars/' + encodeURIComponent(kalenderId) + '/events' +
      '?singleEvents=true&orderBy=startTime&maxResults=500' +
      '&timeMin=' + encodeURIComponent(von.toISOString()) +
      '&timeMax=' + encodeURIComponent(bis.toISOString());
    const d = await Verbindungen.jsonRuf(url, { token });
    return (d.items || []).map((e: any) => ({
      uid: e.id, titel: e.summary || 'Ohne Titel',
      text: e.description || '', ort: e.location || '',
      url: e.htmlLink || '',
      start: e.start?.date || (e.start?.dateTime || '').slice(0, 16),
      ende:  e.end?.date   || (e.end?.dateTime   || '').slice(0, 16),
      ganzerTag: !!e.start?.date
    }));
  };

  /** Einen Eintrag dieser App in den Google-Kalender schreiben. */
  const nachGoogle = async (row: any, coll: any, kalenderId = 'primary') => {
    const token = await Verbindungen.googleZugang(['profil', 'kalender']);
    const dk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
    if (!dk) throw new Error('Ohne Datums-Spalte gibt es keinen Termin.');
    const start = String(Datenbank.wert(row, dk, coll) || '');
    if (!start) throw new Error('Dieser Eintrag hat kein Datum.');
    const ganz = start.length <= 10;

    const endeKey = Object.keys(coll.schema).find(k => k !== dk && coll.schema[k].type === 'date');
    let ende = endeKey ? String(Datenbank.wert(row, endeKey, coll) || '') : '';
    if (!ende) {
      if (ganz) ende = start;
      else { const d = new Date(start); d.setHours(d.getHours() + 1);
             ende = d.getFullYear() + '-' + p2(d.getMonth()+1) + '-' + p2(d.getDate()) +
                    'T' + p2(d.getHours()) + ':' + p2(d.getMinutes()); }
    }
    /* Google will bei ganztägigen Terminen den Tag danach als Ende */
    let gEnde = ende;
    if (ganz) { const d = new Date(ende + 'T12:00'); d.setDate(d.getDate() + 1);
                gEnde = d.getFullYear() + '-' + p2(d.getMonth()+1) + '-' + p2(d.getDate()); }

    const koerper: Record<string, any> = {
      summary: row.text || 'Ohne Titel',
      description: 'Aus Redion übernommen',
      start: ganz ? { date: start } : { dateTime: new Date(start).toISOString() },
      end:   ganz ? { date: gEnde } : { dateTime: new Date(gEnde).toISOString() }
    };
    const ortKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'place');
    if (ortKey) {
      const o = Datenbank.wert(row, ortKey, coll);
      if (o) koerper.location = typeof o === 'object' ? (o.name || '') : String(o);
    }

    const vorhandene = (row.props || {}).uid;
    const url = GC + '/calendars/' + encodeURIComponent(kalenderId) + '/events' +
                (vorhandene ? '/' + encodeURIComponent(vorhandene) : '');
    const d = await Verbindungen.jsonRuf(url, {
      token, method: vorhandene ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(koerper)
    });
    if (coll.schema.uid) Store.setProp(row.id, 'uid', d.id);
    return d;
  };

  /* ========================================================================
   * 6. DIE OBERFLÄCHE
   * ======================================================================*/
  const dialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(720px,95vw)">' +
      '<div class="fh">📅 Kalender verbinden<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div id="kb" style="padding:4px 18px 16px; max-height:72vh; overflow:auto"></div>' +
      '<div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
    document.body.appendChild(o);

    const zeichne = (): void => {
      const z = Verbindungen.zustand();
      const kasten = o.querySelector('#kb');
      if (!kasten) return;
      kasten.innerHTML =
        /* Google */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🔵</span><b>Google Kalender</b>' +
            `<span class="verb-status ${z.google.verbunden ? 'an' : ''}">` +
            `${z.google.verbunden ? 'verbunden' : 'nicht verbunden'}</span></div>` +
          '<div class="verb-text">Liest deine Kalender und schreibt Termine zurück. ' +
            'Braucht die Client-ID aus den Verbindungen.</div>' +
          '<div class="verb-knoepfe"><button data-a="g-liste">Kalender zeigen</button>' +
            '<button data-a="g-hol">Termine holen</button>' +
            '<button data-a="g-setup">Verbindungen öffnen</button></div>' +
          '<div id="gliste"></div>' +
        '</div>' +

        /* Abos */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>📡</span><b>Abonnierte Kalender</b>' +
            `<span class="verb-status ${abos().length ? 'an' : ''}">${abos().length}</span></div>` +
          '<div class="verb-text">Jede ICS-Adresse — iCloud, Outlook, Feiertage, Sportpläne. ' +
            'Bei iCloud: Kalender freigeben, „Öffentlicher Kalender" anhaken, Adresse kopieren.</div>' +
          (abos().length
            ? '<div class="abo-liste">' + abos().map((a: any, i: any) =>
                `<div class="abo-zeile"><span class="frei-kreis bg-${a.farbe || 'blue'}">📅</span>` +
                `<span class="frei-name"><b>${esc(a.name || 'Ohne Namen')}</b>` +
                `<span>${esc(a.url).slice(0, 60)}…${a.zuletzt ? ' · zuletzt ' + esc(String(a.zuletzt).slice(0,10)) : ''}</span></span>` +
                `<button data-an="${i}" title="Ein oder aus">${a.an === false ? '☐' : '☑'}</button>` +
                `<button data-weg="${i}" data-loeschknopf="Entfernen" title="Kalender-Abo entfernen">🗑</button></div>`).join('') + '</div>'
            : '') +
          '<div class="verb-knoepfe"><button data-a="abo-neu">＋ Adresse eintragen</button>' +
            '<button data-a="abo-hol">Jetzt abgleichen</button>' +
            '<button data-a="ics-datei">ICS-Datei einlesen</button></div>' +
        '</div>' +

        /* Ausgeben */
        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>⭳</span><b>Eigene Termine ausgeben</b></div>' +
          '<div class="verb-text">Legt eine .ics-Datei an, die sich in Google, iCloud, ' +
            'Outlook und Thunderbird einlesen lässt.</div>' +
          '<div class="verb-knoepfe"><button data-a="ics-raus">Als ICS speichern</button></div>' +
        '</div>';
    };
    zeichne();

    o.addEventListener('click', async e => {
      if (e.target === o || elVon(e)?.closest<HTMLElement>('[data-a="zu"]')) { o.remove(); return; }

      const an = elVon(e)?.closest<HTMLElement>('[data-an]');
      if (an) {
        const l = abos();
        const eintrag = l[Number(an.dataset.an)];
        if (eintrag) { eintrag.an = eintrag.an === false; aboSpeichern(l); zeichne(); }
        return;
      }
      const weg = elVon(e)?.closest<HTMLElement>('[data-weg]');
      if (weg) { const l = abos(); l.splice(Number(weg.dataset.weg), 1); aboSpeichern(l); zeichne(); return; }

      const b = elVon(e)?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      const a = b.dataset.a;

      try {
        if (a === 'g-setup') { o.remove(); Verbindungen.dialog(); return; }

        if (a === 'g-liste') {
          const liste = await googleKalender();
          const gliste = o.querySelector('#gliste');
          if (!gliste) return;
          gliste.innerHTML = '<div class="abo-liste">' + liste.map((k: any) =>
            `<div class="abo-zeile"><span class="frei-kreis" style="background:${esc(k.farbe || '#888')}">📅</span>` +
            `<span class="frei-name"><b>${esc(k.name)}${k.standard ? ' · Standard' : ''}</b>` +
            `<span>${esc(k.rolle)}</span></span>` +
            `<button data-gk="${esc(k.id)}">Holen</button></div>`).join('') + '</div>';
          return;
        }

        const gk = elVon(e)?.closest<HTMLElement>('[data-gk]');
        if (gk || a === 'g-hol') {
          const id = (gk ? gk.dataset.gk : 'primary') ?? 'primary';
          const termine = await googleTermine(id);
          const coll = zielDatenbank();
          const erg = uebernehmen(coll, termine, 'Google' + (gk ? ' · ' + id.slice(0, 20) : ''));
          App.zeichneSeite();
          UI.toast(erg.neu + ' neu, ' + erg.frisch + ' aufgefrischt');
          return;
        }

        if (a === 'abo-neu') {
          const url = await UI.frage('Adresse des Kalenders (ICS oder webcal)', '');
          if (!url) return;
          const name = await UI.frage('Wie soll er heissen?', 'Kalender');
          const l = abos();
          l.push({ url: url.trim(), name: name || 'Kalender', an: true,
                   farbe: ['blue','green','orange','purple'][l.length % 4] });
          aboSpeichern(l);
          zeichne();
          UI.toast('Eingetragen — jetzt abgleichen');
          return;
        }

        if (a === 'abo-hol') { await alleAbosHolen(); zeichne(); return; }

        if (a === 'ics-datei') {
          const inp = document.createElement('input');
          inp.type = 'file'; inp.accept = '.ics,text/calendar'; inp.multiple = true;
          inp.addEventListener('change', async () => {
            const coll = zielDatenbank();
            let neu = 0, frisch = 0, entfallen = 0;
            for (const f of Array.from(inp.files ?? [])) {
              const text = await f.text();
              const k = icsLesen(text);
              const alle = ausrollenAlle(k.termine);
              const erg = uebernehmen(coll, alle, k.name || f.name.replace(/\.ics$/i, ''));
              neu += erg.neu; frisch += erg.frisch; entfallen += erg.entfallen || 0;
            }
            App.zeichneSeite();
            if (entfallen)
              UI.banner(entfallen + (entfallen === 1 ? ' Termin liegt' : ' Termine liegen') +
                ' jetzt im Papierkorb — die Datei führt sie nicht mehr.', 'info');
            UI.toast(neu + ' Termine übernommen, ' + frisch + ' aufgefrischt');
          });
          inp.click();
          return;
        }

        if (a === 'ics-raus') {
          const dbs = Object.values<any>(Store.cache.collections)
            .filter(c => Object.values<any>(c.schema).some(d => d.type === 'date'));
          if (!dbs.length) { UI.toast('Keine Datenbank mit Datum gefunden'); return; }
          const r = b.getBoundingClientRect();
          const m = UI.menu('<div class="grp">Welche Datenbank?</div>' +
            dbs.map(c => `<button data-c="${c.id}">${esc(c.name || 'Ohne Namen')}</button>`).join(''),
            r.left, r.bottom + 4);
          m.addEventListener('click', ev => {
            const c = ev.target instanceof Element
              ? ev.target.closest<HTMLElement>('button[data-c]') : null;
            if (!c) return;
            m.remove();
            const coll = Store.getCollection(c.dataset.c);
            const text = icsSchreiben(coll, Store.getView(coll.viewIds[0]));
            const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
            const a2 = document.createElement('a');
            a2.href = URL.createObjectURL(blob);
            a2.download = (coll.name || 'kalender').replace(/[^\w\-]+/g, '-') + '.ics';
            a2.click();
            setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
            UI.toast('ICS gespeichert');
          });
          return;
        }
      } catch (err: unknown) {
        UI.banner(err instanceof Error ? err.message : String(err), 'warn');
      }
    });
  };

  return { icsLesen, icsSchreiben, icsZeit, wiederholungen, ausrollenAlle,
           terminSchluessel, dauerInMs, terminLaenge, endeAus,
           zielDatenbank, uebernehmen,
           abos, aboHolen, alleAbosHolen, adresseGerade,
           aufgabenDatenbank, aufgabenUebernehmen,
           googleKalender, googleTermine, nachGoogle, dialog };
})();

(window as any).Kalender = Kalender;
