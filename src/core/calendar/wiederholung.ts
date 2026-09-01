/* ============================================================================
 * core/calendar/wiederholung.ts — Wiederholungsregeln, die wirklich gelesen
 *                                 werden
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/calendar/wiederholung.ts`. `npm run bauen:ts`
 * schreibt daraus `quell/core/calendar/wiederholung.js`.
 * ----------------------------------------------------------------------------
 * DER ANLASS IST EIN FALSCHES DATUM, NICHT EIN FEHLENDES.
 *
 * `verbinden/kalender.ts:145` liest aus einer Wiederholungsregel vier Teile:
 * FREQ, INTERVAL, UNTIL, COUNT. Alles andere fällt STILL weg. Für den
 * häufigsten Stundenplan der Welt —
 *
 *     RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
 *
 * — heisst das: aus drei Terminen je Woche wird EINER, am Wochentag des
 * Starts. Und niemand erfährt es. Ein fehlender Termin ist ärgerlich; ein
 * Kalender, der die falschen Tage anzeigt, ist schlimmer, weil man ihm
 * glaubt.
 *
 * Genauso still verschwinden EXDATE (eine abgesagte Stunde kommt zurück),
 * BYMONTHDAY („jeden 15."), BYSETPOS („letzter Freitag im Monat") und WKST.
 *
 * ─── DIE REGEL, DIE DARAUS FOLGT ────────────────────────────────────────────
 *
 * Was diese Datei nicht kann, SAGT sie. `nichtVerstanden` führt jeden Teil
 * der Regel auf, den sie nicht auswerten konnte, und der Aufrufer zeigt das
 * an. Stillschweigen ist bei Terminen die gefährlichste Antwort — dieselbe
 * Lehre wie beim Sicherungs-Manifest (§52.10) und beim Import (E284).
 *
 * ─── WAS SIE KANN ───────────────────────────────────────────────────────────
 *
 *     FREQ        DAILY, WEEKLY, MONTHLY, YEARLY
 *     INTERVAL    jedes n-te
 *     COUNT       so viele Termine — gezählt werden ERZEUGTE, nicht Runden
 *     UNTIL       bis einschliesslich
 *     BYDAY       MO,TU,… und mit Ordnungszahl: 2TU, -1FR
 *     BYMONTHDAY  1..31 und -1..-31 (vom Monatsende her)
 *     BYMONTH     1..12
 *     BYSETPOS    der wievielte aus dem Satz einer Runde, auch negativ
 *     WKST        wo die Woche beginnt (wichtig nur bei INTERVAL > 1)
 *     EXDATE      streicht Termine
 *     RDATE       legt Termine dazu
 *
 * ─── UND WAS SIE ABSICHTLICH NICHT TUT ──────────────────────────────────────
 *
 * Keine Zeitzonen. TZID wird gelesen und WEITERGEREICHT, nicht umgerechnet.
 * Eine halbe Zeitzonenrechnung ist schlimmer als gar keine: sie verschiebt
 * Termine um Stunden, und man sieht es erst im Sommer.
 * ==========================================================================*/

const Wiederholung = (() => {

  /** Die Wochentage, wie das Format sie schreibt. Index = getDay(). */
  const TAGE = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  /** Was diese Datei auswertet. Alles andere kommt in `nichtVerstanden`. */
  const BEKANNT = ['FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'BYDAY', 'BYMONTHDAY',
                   'BYMONTH', 'BYSETPOS', 'WKST'];

  type Tagwahl = { ord: number; tag: number };

  type Regel = {
    freq: string;
    interval: number;
    count: number;
    until: string;
    byday: Tagwahl[];
    bymonthday: number[];
    bymonth: number[];
    bysetpos: number[];
    wkst: number;
    /** Teile der Regel, die nicht ausgewertet werden konnten. */
    nichtVerstanden: string[];
  };

  const p2 = (n: number): string => String(n).padStart(2, '0');

  /** Ein Datum als `JJJJ-MM-TT`, in der Zeit des Geräts. */
  const tagText = (d: Date): string =>
    d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());

  /** Ein Datum mit Uhrzeit, wie Redion es speichert. */
  const zeitText = (d: Date): string =>
    tagText(d) + 'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());

  /**
   * Eine Regel lesen.
   *
   * Sie wirft nichts. Eine kaputte Regel ergibt `freq: ''`, und der Aufrufer
   * bekommt den Termin unverändert zurück — ein einzelner Termin ist die
   * sichere Auslegung von „ich verstehe die Wiederholung nicht".
   */
  const lesen = (rrule: string): Regel => {
    const r: Regel = {
      freq: '', interval: 1, count: 0, until: '',
      byday: [], bymonthday: [], bymonth: [], bysetpos: [],
      wkst: 1, nichtVerstanden: []
    };
    for (const stueck of String(rrule || '').split(';')) {
      const gleich = stueck.indexOf('=');
      if (gleich < 0) continue;
      const name = stueck.slice(0, gleich).trim().toUpperCase();
      const wert = stueck.slice(gleich + 1).trim();
      if (!name || !wert) continue;
      if (BEKANNT.indexOf(name) < 0) { r.nichtVerstanden.push(name); continue; }
      switch (name) {
        case 'FREQ':     r.freq = wert.toUpperCase(); break;
        case 'INTERVAL': r.interval = Math.max(1, Number(wert) || 1); break;
        case 'COUNT':    r.count = Math.max(0, Number(wert) || 0); break;
        case 'UNTIL':    r.until = wert; break;
        case 'WKST': {
          const i = TAGE.indexOf(wert.toUpperCase());
          if (i >= 0) r.wkst = i; else r.nichtVerstanden.push('WKST');
          break;
        }
        case 'BYMONTH':
          r.bymonth = wert.split(',').map(x => Number(x))
            .filter(n => Number.isFinite(n) && n >= 1 && n <= 12);
          break;
        case 'BYMONTHDAY':
          r.bymonthday = wert.split(',').map(x => Number(x))
            .filter(n => Number.isFinite(n) && n !== 0 && Math.abs(n) <= 31);
          break;
        case 'BYSETPOS':
          r.bysetpos = wert.split(',').map(x => Number(x))
            .filter(n => Number.isFinite(n) && n !== 0);
          break;
        case 'BYDAY': {
          for (const roh of wert.split(',')) {
            /* `2TU` = der zweite Dienstag, `-1FR` = der letzte Freitag. */
            const treffer = roh.trim().toUpperCase().match(/^([+-]?\d+)?([A-Z]{2})$/);
            if (!treffer) { r.nichtVerstanden.push('BYDAY:' + roh); continue; }
            const tag = TAGE.indexOf(treffer[2] || '');
            if (tag < 0) { r.nichtVerstanden.push('BYDAY:' + roh); continue; }
            r.byday.push({ ord: Number(treffer[1] || 0) || 0, tag });
          }
          break;
        }
      }
    }
    /* Doppelt genannte unbekannte Teile nur einmal melden. */
    r.nichtVerstanden = [...new Set(r.nichtVerstanden)];
    return r;
  };

  /** Ein Datum aus einer ICS-Zeichenkette (`20260831` oder `20260831T090000Z`). */
  const ausIcs = (s: string): Date | null => {
    const t = String(s || '').trim();
    const m = t.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
    if (!m) {
      const d = new Date(t);
      return isNaN(d.getTime()) ? null : d;
    }
    const [, jahr, monat, tag, std, min, sek, zulu] = m;
    if (!std) return new Date(Number(jahr), Number(monat) - 1, Number(tag), 12, 0, 0);
    if (zulu) return new Date(Date.UTC(Number(jahr), Number(monat) - 1, Number(tag),
                                       Number(std), Number(min), Number(sek || 0)));
    return new Date(Number(jahr), Number(monat) - 1, Number(tag),
                    Number(std), Number(min), Number(sek || 0));
  };

  /** Der Tag im Monat, auch von hinten gezählt: -1 ist der letzte. */
  const monatstagPasst = (d: Date, liste: number[]): boolean => {
    if (!liste.length) return true;
    const tag = d.getDate();
    const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return liste.some(n => n > 0 ? n === tag : letzter + n + 1 === tag);
  };

  /**
   * Alle Tage EINER Runde, die zu BYDAY passen.
   *
   * Die Runde ist je nach FREQ eine Woche, ein Monat oder ein Jahr. Bei
   * WEEKLY gibt es keine Ordnungszahl (`2TU` in einer Woche ist sinnlos),
   * bei MONTHLY und YEARLY schon.
   */
  const tageDerRunde = (anfang: Date, freq: string, r: Regel): Date[] => {
    const raus: Date[] = [];
    if (freq === 'WEEKLY') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(anfang);
        d.setDate(d.getDate() + i);
        if (r.byday.some(b => b.tag === d.getDay())) raus.push(d);
      }
      return raus;
    }
    /* MONTHLY und YEARLY: über den ganzen Zeitraum gehen. */
    const bis = new Date(anfang);
    if (freq === 'MONTHLY') bis.setMonth(bis.getMonth() + 1);
    else bis.setFullYear(bis.getFullYear() + 1);

    const alle: Date[] = [];
    const lauf = new Date(anfang);
    let schutz = 0;
    while (lauf < bis && schutz++ < 400) {
      alle.push(new Date(lauf));
      lauf.setDate(lauf.getDate() + 1);
    }

    for (const b of r.byday) {
      const passend = alle.filter(d => d.getDay() === b.tag);
      if (!b.ord) { raus.push(...passend); continue; }
      const i = b.ord > 0 ? b.ord - 1 : passend.length + b.ord;
      const treffer = passend[i];
      if (treffer) raus.push(treffer);
    }
    return raus;
  };

  type Ausrollen = {
    /** Die erzeugten Termine, als Text wie Redion sie speichert. */
    termine: string[];
    /** Was von der Regel nicht ausgewertet werden konnte. */
    nichtVerstanden: string[];
    /** true, wenn die Grenze zugeschlagen hat und es weitergegangen wäre. */
    abgeschnitten: boolean;
    /** Ein Satz im Klartext, oder leer wenn alles verstanden wurde. */
    satz: string;
  };

  type Optionen = {
    /** Wie weit in die Zukunft gerollt wird, in Tagen. */
    bisTage?: number;
    /** Höchstens so viele Termine. */
    hoechstens?: number;
    /** Gestrichene Termine (EXDATE), als ICS-Zeichenketten oder ISO. */
    exdate?: string[];
    /** Zusätzliche Termine (RDATE). */
    rdate?: string[];
    /** Ganztägig — dann ohne Uhrzeit im Text. */
    ganzerTag?: boolean;
    /** Jetzt, in Millisekunden. Für die Prüfung. */
    jetzt?: number;
  };

  /**
   * Eine Regel ausrollen.
   *
   * DER START IST IMMER DABEI. Das Format sagt, die Wiederholungsmenge
   * enthalte den Start; wenn der Start nicht zur Regel passt (Dienstag bei
   * `BYDAY=MO,WE,FR`), ist ein Termin zu viel weniger schlimm als der
   * fehlende erste.
   */
  const ausrollen = (start: string, rrule: string, opt: Optionen = {}): Ausrollen => {
    const r = lesen(rrule);
    const bisTage = typeof opt.bisTage === 'number' ? opt.bisTage : 400;
    const hoechstens = typeof opt.hoechstens === 'number' ? opt.hoechstens : 500;
    const jetzt = typeof opt.jetzt === 'number' ? opt.jetzt : Date.now();
    const ganzerTag = !!opt.ganzerTag;
    const alsText = (d: Date): string => ganzerTag ? tagText(d) : zeitText(d);

    const anfang = ausIcs(String(start).length === 10
      ? String(start).replace(/-/g, '')
      : String(start).replace(/[-:]/g, '').slice(0, 15));
    if (!anfang) {
      return { termine: [], nichtVerstanden: r.nichtVerstanden, abgeschnitten: false,
               satz: 'Der Starttermin liess sich nicht lesen.' };
    }
    if (!r.freq) {
      return { termine: [alsText(anfang)], nichtVerstanden: r.nichtVerstanden,
               abgeschnitten: false, satz: satzZu(r.nichtVerstanden, false) };
    }

    const grenze = new Date(jetzt);
    grenze.setDate(grenze.getDate() + bisTage);
    const bis = r.until ? (ausIcs(r.until) || grenze) : grenze;
    const schluss = bis < grenze ? bis : grenze;

    /* Gestrichene Termine als Tagesschlüssel — EXDATE trägt oft eine Uhrzeit,
       die nicht auf die Sekunde zum erzeugten Termin passt. Verglichen wird
       deshalb der TAG; eine Absage gilt für den Tag. */
    const gestrichen = new Set<string>();
    for (const x of (opt.exdate || [])) {
      const d = ausIcs(x);
      if (d) gestrichen.add(tagText(d));
    }

    const raus: string[] = [];
    const gesehen = new Set<string>();
    let abgeschnitten = false;
    /* GEZÄHLT WIRD, WAS DIE REGEL ERZEUGT — NICHT, WAS ÜBRIG BLEIBT.
       Das Format ist da eindeutig: die Regel erzeugt eine Menge, und EXDATE
       streicht DANACH daraus. `COUNT=4` mit einer Absage ergibt also drei
       Termine, nicht vier.
       Mein erster Entwurf strich vor dem Zählen und lieferte vier — der
       Prüflauf hat es gefunden. Der Unterschied fällt nur auf, wenn beides
       zusammenkommt, und dann verschiebt er jeden folgenden Termin. */
    let erzeugt = 0;

    const nimm = (d: Date): boolean => {
      if (d > schluss) return false;
      if (r.bymonth.length && r.bymonth.indexOf(d.getMonth() + 1) < 0) return true;
      if (!monatstagPasst(d, r.bymonthday)) return true;
      const text = alsText(d);
      if (gesehen.has(text)) return true;
      gesehen.add(text);
      erzeugt++;
      if (!gestrichen.has(tagText(d))) raus.push(text);
      if (r.count && erzeugt >= r.count) return false;
      if (erzeugt >= hoechstens) { abgeschnitten = true; return false; }
      return true;
    };

    /* Der Start gehört dazu. */
    let weiter = nimm(new Date(anfang));

    /* Der Anfang der ersten Runde. Bei WEEKLY ist das der WKST-Tag der Woche,
       in der der Start liegt — sonst zählt INTERVAL=2 („jede zweite Woche")
       ab einem willkürlichen Wochentag. */
    const rundenAnfang = new Date(anfang);
    if (r.freq === 'WEEKLY') {
      const versatz = (rundenAnfang.getDay() - r.wkst + 7) % 7;
      rundenAnfang.setDate(rundenAnfang.getDate() - versatz);
    } else if (r.freq === 'MONTHLY') {
      rundenAnfang.setDate(1);
    } else if (r.freq === 'YEARLY') {
      rundenAnfang.setMonth(0, 1);
    }

    let runde = 0;
    while (weiter && runde < 2000) {
      const anfangDieserRunde = new Date(rundenAnfang);
      if (r.freq === 'DAILY') anfangDieserRunde.setDate(anfangDieserRunde.getDate() + runde * r.interval);
      else if (r.freq === 'WEEKLY') anfangDieserRunde.setDate(anfangDieserRunde.getDate() + runde * 7 * r.interval);
      else if (r.freq === 'MONTHLY') anfangDieserRunde.setMonth(anfangDieserRunde.getMonth() + runde * r.interval);
      else if (r.freq === 'YEARLY') anfangDieserRunde.setFullYear(anfangDieserRunde.getFullYear() + runde * r.interval);
      else break;
      runde++;

      if (anfangDieserRunde > schluss && runde > 1) break;

      let satz: Date[];
      if (r.freq === 'DAILY') {
        satz = [anfangDieserRunde];
      } else if (r.byday.length) {
        satz = tageDerRunde(anfangDieserRunde, r.freq, r);
      } else if (r.freq === 'WEEKLY') {
        /* Ohne BYDAY wiederholt WEEKLY den Wochentag des Starts. */
        const d = new Date(anfangDieserRunde);
        d.setDate(d.getDate() + ((anfang.getDay() - r.wkst + 7) % 7));
        satz = [d];
      } else if (r.freq === 'MONTHLY') {
        const d = new Date(anfangDieserRunde);
        /* Ohne BYMONTHDAY der Tag des Starts. Gibt es ihn im Monat nicht
           (31. Februar), fällt der Termin AUS — er wird nicht auf den 1. März
           verschoben. Das ist die Regel des Formats, und sie ist die
           weniger überraschende. */
        const zielTag = r.bymonthday.length ? 1 : anfang.getDate();
        const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        if (!r.bymonthday.length && zielTag > letzter) { satz = []; }
        else if (r.bymonthday.length) {
          satz = [];
          for (let t = 1; t <= letzter; t++) {
            const kandidat = new Date(d.getFullYear(), d.getMonth(), t,
                                      anfang.getHours(), anfang.getMinutes());
            if (monatstagPasst(kandidat, r.bymonthday)) satz.push(kandidat);
          }
        } else {
          d.setDate(zielTag);
          satz = [d];
        }
      } else {
        const d = new Date(anfangDieserRunde);
        d.setMonth(anfang.getMonth(), anfang.getDate());
        satz = [d];
      }

      /* Uhrzeit vom Start übernehmen. */
      satz = satz.map(d => {
        const mit = new Date(d);
        mit.setHours(anfang.getHours(), anfang.getMinutes(), 0, 0);
        return mit;
      }).filter(d => d >= anfang)
        .sort((a, b) => a.getTime() - b.getTime());

      /* BYSETPOS wählt aus dem Satz DIESER Runde. */
      if (r.bysetpos.length && satz.length) {
        const gewaehlt: Date[] = [];
        for (const pos of r.bysetpos) {
          const i = pos > 0 ? pos - 1 : satz.length + pos;
          const treffer = satz[i];
          if (treffer) gewaehlt.push(treffer);
        }
        satz = gewaehlt.sort((a, b) => a.getTime() - b.getTime());
      }

      for (const d of satz) {
        if (!nimm(d)) { weiter = false; break; }
      }
      if (satz.length && satz[satz.length - 1]! > schluss) break;
    }

    /* RDATE zum Schluss — sie stehen ausserhalb der Regel. */
    for (const x of (opt.rdate || [])) {
      const d = ausIcs(x);
      if (!d) continue;
      const text = alsText(d);
      if (gesehen.has(text) || gestrichen.has(tagText(d))) continue;
      gesehen.add(text);
      raus.push(text);
    }
    raus.sort();

    return {
      termine: raus,
      nichtVerstanden: r.nichtVerstanden,
      abgeschnitten,
      satz: satzZu(r.nichtVerstanden, abgeschnitten)
    };
  };

  /**
   * Der Satz für den Menschen.
   *
   * Er entsteht NUR, wenn wirklich etwas fehlt. Ein Hinweis, der bei jeder
   * gewöhnlichen Regel erscheint, wird nach dem dritten Mal überlesen.
   */
  const satzZu = (nichtVerstanden: string[], abgeschnitten: boolean): string => {
    const teile: string[] = [];
    if (nichtVerstanden.length)
      teile.push('Diese Teile der Wiederholungsregel kennt Redion nicht: ' +
        nichtVerstanden.join(', ') + '. Die Termine daraus fehlen.');
    if (abgeschnitten)
      teile.push('Es wären mehr Termine geworden, als angezeigt werden.');
    return teile.join(' ');
  };

  return { lesen, ausrollen, ausIcs, tagText, zeitText, TAGE, BEKANNT };
})();

(window as any).Wiederholung = Wiederholung;
