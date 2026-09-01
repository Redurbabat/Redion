"use strict";
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
    const elVon = (e) => e.target instanceof Element ? e.target : null;
    const esc = (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const p2 = (n) => String(n).padStart(2, '0');
    /* ========================================================================
     * 1. ICS LESEN
     * ------------------------------------------------------------------------
     * Das Format ist alt und eigenwillig: Zeilen dürfen umbrechen, Zeichen
     * werden maskiert, Zeiten kommen in drei Schreibweisen. Hier steht das
     * alles an einer Stelle.
     * ======================================================================*/
    /** Umgebrochene Zeilen wieder zusammenkleben (Fortsetzung beginnt mit Leerzeichen). */
    const zeilenFalten = (text) => String(text || '')
        .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        .replace(/\n[ \t]/g, '');
    const entmaskieren = (s) => String(s || '')
        .replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
    /** „20260815T140000Z", „20260815", „2026-08-15T14:00:00" → ISO-Text. */
    const icsZeit = (roh, parameter) => {
        const v = String(roh || '').trim();
        const ganzerTag = /^\d{8}$/.test(v) || /VALUE=DATE(?!-TIME)/i.test(parameter || '');
        const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
        if (!m) {
            const d = new Date(v);
            return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
        }
        if (ganzerTag || !m[4])
            return `${m[1]}-${m[2]}-${m[3]}`;
        if (m[7]) {
            /* Z heisst Weltzeit — in Ortszeit umrechnen, sonst stimmt die Stunde nicht */
            const d = new Date(Date.UTC(+(m[1] ?? 0), +(m[2] ?? 1) - 1, +(m[3] ?? 1), +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0)));
            return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
                'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
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
    const icsLesen = (text) => {
        const zeilen = zeilenFalten(text).split('\n');
        const termine = [];
        const aufgaben = [];
        let kalenderName = '';
        let jetzt = null;
        let inAlarm = false;
        /* 'termin' oder 'aufgabe' — welche Art gerade gelesen wird. */
        let art = '';
        zeilen.forEach(z => {
            const roh = z.trim();
            if (!roh)
                return;
            if (roh === 'BEGIN:VEVENT') {
                jetzt = { alarme: [] };
                art = 'termin';
                return;
            }
            if (roh === 'END:VEVENT') {
                if (jetzt && jetzt.start)
                    termine.push(jetzt);
                jetzt = null;
                art = '';
                return;
            }
            /* EINE AUFGABE BRAUCHT KEIN DATUM. „Steuererklärung" ohne Frist ist
               eine gültige Aufgabe; ein Termin ohne Anfang ist keiner. Deshalb
               wird hier auf den TITEL geprüft und nicht auf `start`. */
            if (roh === 'BEGIN:VTODO') {
                jetzt = { alarme: [], art: 'aufgabe' };
                art = 'aufgabe';
                return;
            }
            if (roh === 'END:VTODO') {
                if (jetzt && (jetzt.titel || jetzt.uid))
                    aufgaben.push(jetzt);
                jetzt = null;
                art = '';
                return;
            }
            if (roh === 'BEGIN:VALARM') {
                inAlarm = true;
                return;
            }
            if (roh === 'END:VALARM') {
                inAlarm = false;
                return;
            }
            const doppel = roh.indexOf(':');
            if (doppel < 0)
                return;
            const links = roh.slice(0, doppel);
            const inhalt = roh.slice(doppel + 1);
            const strich = links.indexOf(';');
            const name = (strich < 0 ? links : links.slice(0, strich)).toUpperCase();
            const parameter = strich < 0 ? '' : links.slice(strich + 1);
            if (!jetzt) {
                if (name === 'X-WR-CALNAME')
                    kalenderName = entmaskieren(inhalt);
                return;
            }
            if (inAlarm) {
                if (name === 'TRIGGER')
                    jetzt.alarme.push(inhalt);
                return;
            }
            switch (name) {
                case 'UID':
                    jetzt.uid = inhalt;
                    break;
                case 'SUMMARY':
                    jetzt.titel = entmaskieren(inhalt);
                    break;
                case 'DESCRIPTION':
                    jetzt.text = entmaskieren(inhalt);
                    break;
                case 'LOCATION':
                    jetzt.ort = entmaskieren(inhalt);
                    break;
                case 'URL':
                    jetzt.url = inhalt;
                    break;
                case 'STATUS':
                    jetzt.status = inhalt;
                    break;
                case 'ORGANIZER':
                    jetzt.wer = inhalt.replace(/^mailto:/i, '');
                    break;
                case 'CATEGORIES':
                    jetzt.kategorien = entmaskieren(inhalt).split(',').map(x => x.trim());
                    break;
                case 'RRULE':
                    jetzt.regel = inhalt;
                    break;
                /* EXDATE UND RDATE WURDEN BIS E290 GAR NICHT GELESEN.
                   Eine abgesagte Stunde kam damit bei jedem Einlesen zurück, und
                   ein zusätzlich angesetzter Termin fehlte. Beide dürfen mehrfach
                   vorkommen und mehrere Daten mit Komma tragen. */
                case 'EXDATE':
                    jetzt.exdate = (jetzt.exdate || [])
                        .concat(inhalt.split(',').map((x) => x.trim())
                        .filter(Boolean));
                    break;
                case 'RDATE':
                    jetzt.rdate = (jetzt.rdate || [])
                        .concat(inhalt.split(',').map((x) => x.trim())
                        .filter(Boolean));
                    break;
                case 'DTSTART':
                    jetzt.start = icsZeit(inhalt, parameter);
                    jetzt.ganzerTag = jetzt.start.length === 10;
                    break;
                case 'DTEND':
                    jetzt.ende = icsZeit(inhalt, parameter);
                    break;
                case 'DURATION':
                    jetzt.dauer = inhalt;
                    break;
                /* --- Nur bei Aufgaben (E326) --------------------------------- */
                case 'DUE':
                    if (art === 'aufgabe')
                        jetzt.faellig = icsZeit(inhalt, parameter);
                    break;
                case 'COMPLETED':
                    if (art === 'aufgabe')
                        jetzt.erledigtAm = icsZeit(inhalt, parameter);
                    break;
                case 'PERCENT-COMPLETE':
                    if (art === 'aufgabe')
                        jetzt.anteil = Math.max(0, Math.min(100, +inhalt || 0));
                    break;
                case 'PRIORITY':
                    if (art === 'aufgabe')
                        jetzt.prioritaet = +inhalt || 0;
                    break;
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
        return { name: kalenderName, termine, aufgaben };
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
    const DAUER_MUSTER = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
    /** `PT1H30M` → 5400000. Unlesbares, Null und Negatives geben `null`. */
    const dauerInMs = (text) => {
        const m = DAUER_MUSTER.exec(String(text ?? '').trim().toUpperCase());
        if (!m)
            return null;
        /* EIN MINUSZEICHEN IST KEIN FEHLER, SONDERN ETWAS ANDERES: negative
           Dauern gibt es in ICS, aber nur für Erinnerungen („15 Minuten
           VORHER"). Ein Termin, der vor seinem Anfang endet, ist keiner. */
        if (m[1] === '-')
            return null;
        const ms = ((+(m[2] ?? 0) * 7 + +(m[3] ?? 0)) * 86400 +
            +(m[4] ?? 0) * 3600 + +(m[5] ?? 0) * 60 + +(m[6] ?? 0)) * 1000;
        return ms > 0 ? ms : null;
    };
    const terminLaenge = (t) => {
        if (t && t.start && t.ende) {
            const a = new Date(String(t.start)).getTime();
            const b = new Date(String(t.ende)).getTime();
            if (Number.isFinite(a) && Number.isFinite(b) && b > a)
                return b - a;
        }
        /* `DURATION` ist der Zwilling von `DTEND` — ICS erlaubt genau eines
           von beiden, und manche Kalender schreiben lieber die Dauer. */
        return dauerInMs(t && t.dauer);
    };
    /** Beginn + Länge, im selben Format wie der Beginn. */
    const endeAus = (startIso, laenge, ganzerTag) => {
        if (!laenge || !startIso)
            return '';
        const d = new Date(startIso);
        if (!Number.isFinite(d.getTime()))
            return '';
        d.setTime(d.getTime() + laenge);
        /* Ganztägig wird ohne Uhrzeit gelesen und geschrieben — und eine
           Datumszeichenkette ohne Zeit ist Weltzeit, in beide Richtungen.
           Ortszeit-Getter würden hier je nach Zeitzone einen Tag danebenliegen. */
        if (ganzerTag)
            return d.toISOString().slice(0, 10);
        return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
            'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    };
    const wiederholungen = (termin, bisTage = 400) => {
        if (!termin.regel)
            return [termin];
        const W = window.Wiederholung;
        if (!W || typeof W.ausrollen !== 'function')
            return [termin];
        const erg = W.ausrollen(termin.start, termin.regel, {
            bisTage,
            exdate: termin.exdate || [],
            rdate: termin.rdate || [],
            ganzerTag: !!termin.ganzerTag
        });
        if (!erg.termine.length)
            return [termin];
        /* EINMAL bestimmt, nicht je Folge — die Länge gehört dem Termin und
           nicht dem Tag. */
        const laenge = terminLaenge(termin);
        return erg.termine.map((iso, i) => Object.assign({}, termin, {
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
    const terminSchluessel = (t) => {
        const uid = String(t?.uid || ((t?.titel || '') + '|' + (t?.start || '')));
        /* Ein einzelner Termin behält seine Kennung unverändert. Das ist keine
           Feinheit, sondern die Rückwärtsverträglichkeit: jede Zeile, die vor
           heute angelegt wurde, trägt genau diesen Wert. */
        const nr = Number(t?.folgeNr);
        if (!Number.isFinite(nr) || nr < 0)
            return uid;
        return uid + '#' + nr;
    };
    /* ========================================================================
     * 2. ICS SCHREIBEN
     * ======================================================================*/
    const maskieren = (s) => String(s ?? '')
        .replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
    const alsIcsZeit = (v, ganzerTag) => {
        const s = String(v || '');
        if (!s)
            return '';
        if (ganzerTag || s.length <= 10)
            return s.replace(/-/g, '');
        const d = new Date(s);
        if (isNaN(d.getTime()))
            return s.replace(/[-:]/g, '').slice(0, 15);
        return d.getUTCFullYear() + p2(d.getUTCMonth() + 1) + p2(d.getUTCDate()) + 'T' +
            p2(d.getUTCHours()) + p2(d.getUTCMinutes()) + '00Z';
    };
    /** Lange Zeilen umbrechen — das Format will höchstens 75 Zeichen. */
    const falten = (zeile) => {
        if (zeile.length <= 74)
            return zeile;
        const teile = [zeile.slice(0, 74)];
        let rest = zeile.slice(74);
        while (rest.length > 73) {
            teile.push(' ' + rest.slice(0, 73));
            rest = rest.slice(73);
        }
        if (rest)
            teile.push(' ' + rest);
        return teile.join('\r\n');
    };
    /** Eine Datenbank als ICS ausgeben. */
    const icsSchreiben = (coll, view) => {
        const dk = (view && view.dateKey) ||
            Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
        if (!dk)
            throw new Error('Diese Datenbank hat keine Datums-Spalte.');
        const endeKey = view && view.endeKey && coll.schema[view.endeKey] ? view.endeKey : null;
        const ortKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'place') ||
            Object.keys(coll.schema).find(k => /ort|location/i.test(coll.schema[k].name));
        const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Redion//DE',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
            'X-WR-CALNAME:' + maskieren(coll.name)];
        Store.rowsOf(coll.id).forEach((r) => {
            const start = Datenbank.wert(r, dk, coll);
            if (!start)
                return;
            const ganz = String(start).length <= 10;
            const ende = endeKey ? Datenbank.wert(r, endeKey, coll) : '';
            let ort = ortKey ? Datenbank.wert(r, ortKey, coll) : '';
            if (ort && typeof ort === 'object')
                ort = ort.name || '';
            /* Bei ganztägigen Terminen zeigt DTEND wieder auf den Tag danach */
            let dtEnde = ende;
            if (ganz && ende) {
                const d = new Date(ende + 'T12:00');
                d.setDate(d.getDate() + 1);
                dtEnde = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
            }
            zeilen.push('BEGIN:VEVENT');
            zeilen.push('UID:' + r.id + '@notizen');
            zeilen.push('DTSTAMP:' + alsIcsZeit(new Date().toISOString(), false));
            zeilen.push('DTSTART' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(start, ganz));
            if (dtEnde)
                zeilen.push('DTEND' + (ganz ? ';VALUE=DATE:' : ':') + alsIcsZeit(dtEnde, ganz));
            zeilen.push('SUMMARY:' + maskieren(r.text || 'Ohne Titel'));
            if (ort)
                zeilen.push('LOCATION:' + maskieren(ort));
            /* Alles andere kommt in die Beschreibung, damit nichts verloren geht */
            const rest = Object.keys(coll.schema)
                .filter(k => k !== dk && k !== endeKey && coll.schema[k].type !== 'title')
                .map(k => coll.schema[k].name + ': ' + Formula.anzeige(Datenbank.wert(r, k, coll)))
                .filter(x => !/: *$|: *—$/.test(x));
            if (rest.length)
                zeilen.push('DESCRIPTION:' + maskieren(rest.join('\n')));
            zeilen.push('END:VEVENT');
        });
        zeilen.push('END:VCALENDAR');
        return zeilen.map(falten).join('\r\n');
    };
    /* ========================================================================
     * 3. TERMINE IN EINE DATENBANK SCHREIBEN
     * ======================================================================*/
    const SCHEMA = () => ({
        title: { name: 'Termin', type: 'title' },
        start: { name: 'Beginn', type: 'date' },
        ende: { name: 'Ende', type: 'date' },
        ort: { name: 'Ort', type: 'place' },
        quelle: { name: 'Kalender', type: 'select', options: [] },
        text: { name: 'Notiz', type: 'text' },
        uid: { name: 'Kennung', type: 'text' },
        link: { name: 'Link', type: 'url' }
    });
    /** Legt die Termin-Datenbank an oder findet die vorhandene wieder. */
    const zielDatenbank = (seiteId, name = 'Termine') => {
        const da = Object.values(Store.cache.collections)
            .find(c => c.name === name && c.schema.uid && c.schema.start);
        if (da)
            return da;
        const { collectionId } = Store.addDatabase(seiteId || App.aktuelleSeite(), name, SCHEMA(), 'calendar');
        const c = Store.getCollection(collectionId);
        const v = Store.getView(c.viewIds[0]);
        Store.updateView(v.id, { dateKey: 'start', endeKey: 'ende' });
        return c;
    };
    /**
     * Termine übernehmen. Was schon da ist (gleiche Kennung), wird
     * aufgefrischt statt doppelt angelegt — sonst wächst die Liste bei
     * jedem Abgleich.
     */
    const uebernehmen = (coll, termine, quelle) => {
        const vorhanden = new Map();
        /* DER ZWEITE INDEX IST DER UMZUGSWEG (E335). Jede Zeile, die vor E335
           aus einer Reihe entstanden ist, trägt die nackte Reihenkennung —
           fünf Zeilen, fünfmal derselbe Wert. Über `terminSchluessel` findet
           sie niemand mehr, und ohne diesen zweiten Griff bekäme jeder
           Nutzer beim nächsten Abgleich seine Termine DOPPELT.
           Kennung + Beginn ist dafür genau richtig: es trifft die eine Zeile,
           die diese Folge wirklich meint, ganz gleich wie sie geschlüsselt war. */
        const nachBeginn = new Map();
        Store.rowsOf(coll.id).forEach((r) => {
            const u = (r.props || {}).uid;
            if (!u)
                return;
            vorhanden.set(u, r);
            const roh = String(u).replace(/#\d+$/, '');
            const beg = (r.props || {}).start || '';
            if (beg)
                nachBeginn.set(roh + '|' + beg, r);
        });
        /* Die Quelle als Option führen, damit man filtern kann */
        if (quelle && coll.schema.quelle) {
            const opts = coll.schema.quelle.options || [];
            if (!opts.some((o) => o.name === quelle)) {
                const farben = ['blue', 'green', 'orange', 'purple', 'pink', 'red', 'yellow', 'brown'];
                opts.push({ name: quelle, color: farben[opts.length % farben.length] });
                coll.schema.quelle.options = opts;
                Store.updateCollection(coll.id, { schema: coll.schema });
            }
        }
        /* WELCHE REIHEN DIESER LAUF ÜBERHAUPT GELIEFERT HAT (E336). Nur für
           die darf hinterher aufgeräumt werden — siehe unten. Eine Reihe, die
           gar nicht kam, sagt nichts darüber, ob es sie noch gibt. */
        const reihenImLauf = new Set();
        termine.forEach((t) => {
            const k = terminSchluessel(t);
            const raute = k.lastIndexOf('#');
            if (raute > 0)
                reihenImLauf.add(k.slice(0, raute));
        });
        let neu = 0, frisch = 0, umgezogen = 0;
        /* Was in DIESEM Durchgang schon beschrieben wurde. Ohne das könnten
           zwei Folgen wieder in derselben Zeile landen — genau der Fehler,
           den dieser Bogen abräumt, nur eine Ebene tiefer. */
        const belegt = new Set();
        termine.forEach((t) => {
            const schluessel = terminSchluessel(t);
            const props = {
                start: t.start || '', ende: t.ende || '',
                ort: t.ort ? { name: t.ort } : null,
                quelle: quelle || '', text: t.text || '',
                uid: schluessel, link: t.url || ''
            };
            let alt = vorhanden.get(schluessel);
            if (alt && belegt.has(alt.id))
                alt = null;
            if (!alt) {
                /* Der Umzugsweg: eine Zeile von vor E335 finden. */
                const roh = String(t.uid || ((t.titel || '') + '|' + (t.start || '')));
                const kandidat = nachBeginn.get(roh + '|' + (t.start || ''));
                if (kandidat && !belegt.has(kandidat.id)) {
                    alt = kandidat;
                    umgezogen++;
                }
            }
            if (alt) {
                belegt.add(alt.id);
                Object.entries(props).forEach(([k, w]) => Store.setProp(alt.id, k, w));
                Store.updateBlock(alt.id, { text: t.titel || 'Ohne Titel' });
                frisch++;
            }
            else {
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
            Store.rowsOf(coll.id).forEach((r) => {
                if (belegt.has(r.id))
                    return;
                const u = String((r.props || {}).uid || '');
                const raute = u.lastIndexOf('#');
                if (raute <= 0 || !/^\d+$/.test(u.slice(raute + 1)))
                    return;
                if (!reihenImLauf.has(u.slice(0, raute)))
                    return;
                Store.trashBlock(r.id);
                entfallen++;
            });
        }
        return { neu, frisch, umgezogen, entfallen };
    };
    /* ========================================================================
     * 4. ABOS
     * ======================================================================*/
    const abos = () => Store.getMeta('ics:abos', []) || [];
    const aboSpeichern = (liste) => Store.setMeta('ics:abos', liste);
    /** webcal:// ist nur https:// mit anderem Namen. */
    const adresseGerade = (u) => String(u || '').trim()
        .replace(/^webcal:\/\//i, 'https://');
    const aboHolen = async (abo) => {
        const url = adresseGerade(abo.url);
        let text;
        try {
            const r = await Verbindungen.ruf(url, { versuche: 2 });
            text = await r.text();
        }
        catch (e) {
            /* Zweiter Anlauf über die Brücke, falls eine eingetragen ist */
            if (!Store.getMeta('verb:proxy', ''))
                throw e;
            const r = await Verbindungen.ruf(url, { versuche: 2, ueberBruecke: true });
            text = await r.text();
        }
        if (!/BEGIN:VCALENDAR/i.test(text))
            throw new Error('Unter dieser Adresse liegt kein Kalender.');
        const gelesen = icsLesen(text);
        const alle = [];
        gelesen.termine.forEach(t => wiederholungen(t).forEach((x) => alle.push(x)));
        return { name: gelesen.name || abo.name || 'Abo', termine: alle,
            aufgaben: gelesen.aufgaben };
    };
    const alleAbosHolen = async (seiteId) => {
        const liste = abos().filter((a) => a.an !== false);
        if (!liste.length) {
            UI.toast('Kein Kalender abonniert');
            return;
        }
        const coll = zielDatenbank(seiteId);
        let neu = 0, frisch = 0, entfallen = 0, schief = [];
        /* Für den Sammelhinweis unten — die Termine selbst wandern in die
           Datenbank und sind danach nicht mehr in der Hand. */
        const alleTermine = [];
        /* AUFGABEN AUS DEM ABO (L106 Punkt 6, E326). Sie werden seit E326
           gelesen, landen aber noch nicht in der Kalendertabelle — eine Aufgabe
           mit Fälligkeit ist kein Termin, und sie mit `start` dort einzutragen
           hiesse, sie als Verabredung auszugeben. Verschwiegen werden sie
           trotzdem nicht: bis E326 fielen sie stumm durch, und niemand erfuhr,
           dass der Kalender überhaupt welche enthält (§35). */
        let offeneAufgaben = 0;
        for (const a of liste) {
            try {
                const k = await aboHolen(a);
                const e = uebernehmen(coll, k.termine, a.name || k.name);
                alleTermine.push(...k.termine);
                offeneAufgaben += (k.aufgaben || []).filter((x) => !x.fertig).length;
                neu += e.neu;
                frisch += e.frisch;
                entfallen += e.entfallen || 0;
                a.zuletzt = Store.now();
            }
            catch (err) {
                schief.push((a.name || a.url) + ': ' +
                    (err instanceof Error ? err.message : String(err)));
            }
        }
        aboSpeichern(abos());
        App.zeichneSeite();
        if (schief.length)
            UI.banner('Nicht geklappt — ' + schief.join(' · '), 'warn');
        /* WAS AN DEN REGELN NICHT GELESEN WERDEN KONNTE, WIRD GESAGT (E295,
           L106 Punkt 7). E290 gibt es jedem Termin mit — angezeigt hat es
           bis jetzt niemand, und ein Hinweis, den niemand sieht, ist derselbe
           Stillstand wie vorher.
    
           Gesammelt und EINMAL genannt, nicht je Termin: bei einem Kalender
           mit vierzig Wochenterminen stünde derselbe Satz vierzigmal da, und
           ab dem dritten liest ihn keiner mehr. */
        const unklar = new Set();
        for (const t of alleTermine)
            for (const x of (t.regelUnklar || []))
                unklar.add(String(x));
        if (unklar.size)
            UI.banner('Ein Teil der Wiederholungsregeln blieb ungelesen: ' +
                [...unklar].join(', ') + '. Die Termine daraus fehlen.', 'warn');
        /* UND DIE AUFGABEN, wenn welche da sind. Nur dann: ein Kalender ohne
           VTODO ist der Normalfall, und „0 Aufgaben" wäre die Zeile, die man
           nach dem zweiten Mal nicht mehr liest. */
        if (offeneAufgaben)
            UI.banner(offeneAufgaben + (offeneAufgaben === 1
                ? ' offene Aufgabe steht im Kalender'
                : ' offene Aufgaben stehen im Kalender') +
                ' — Redion liest sie, legt sie aber noch nicht an. ' +
                'Eine Aufgabe ist kein Termin, und sie hier einzutragen hiesse, ' +
                'sie als Verabredung auszugeben.', 'info');
        /* WAS DIE QUELLE GESTRICHEN HAT, WIRD GESAGT — und nur dann (E336).
           „0 entfallen" wäre die Zeile, die man nach dem zweiten Mal nicht
           mehr liest, und der Normalfall ist genau das. Der Satz nennt auch,
           WO die Termine hin sind: in den Papierkorb, nicht ins Nichts. */
        if (entfallen)
            UI.banner(entfallen + (entfallen === 1
                ? ' Termin steht nicht mehr im Kalender der Quelle und liegt jetzt '
                : ' Termine stehen nicht mehr im Kalender der Quelle und liegen jetzt ') +
                'im Papierkorb. Von dort holst du sie zurück, falls das ein Irrtum war.', 'info');
        UI.toast(neu + ' neu, ' + frisch + ' aufgefrischt');
    };
    /* ========================================================================
     * 5. GOOGLE CALENDAR
     * ======================================================================*/
    const GC = 'https://www.googleapis.com/calendar/v3';
    const googleKalender = async () => {
        const token = await Verbindungen.googleZugang(['profil', 'kalender']);
        const d = await Verbindungen.jsonRuf(GC + '/users/me/calendarList?maxResults=50', { token });
        return (d.items || []).map((c) => ({
            id: c.id, name: c.summary, farbe: c.backgroundColor,
            standard: !!c.primary, rolle: c.accessRole
        }));
    };
    const googleTermine = async (kalenderId, vonTagen = -30, bisTagen = 180) => {
        const token = await Verbindungen.googleZugang(['profil', 'kalender']);
        const von = new Date();
        von.setDate(von.getDate() + vonTagen);
        const bis = new Date();
        bis.setDate(bis.getDate() + bisTagen);
        const url = GC + '/calendars/' + encodeURIComponent(kalenderId) + '/events' +
            '?singleEvents=true&orderBy=startTime&maxResults=500' +
            '&timeMin=' + encodeURIComponent(von.toISOString()) +
            '&timeMax=' + encodeURIComponent(bis.toISOString());
        const d = await Verbindungen.jsonRuf(url, { token });
        return (d.items || []).map((e) => ({
            uid: e.id, titel: e.summary || 'Ohne Titel',
            text: e.description || '', ort: e.location || '',
            url: e.htmlLink || '',
            start: e.start?.date || (e.start?.dateTime || '').slice(0, 16),
            ende: e.end?.date || (e.end?.dateTime || '').slice(0, 16),
            ganzerTag: !!e.start?.date
        }));
    };
    /** Einen Eintrag dieser App in den Google-Kalender schreiben. */
    const nachGoogle = async (row, coll, kalenderId = 'primary') => {
        const token = await Verbindungen.googleZugang(['profil', 'kalender']);
        const dk = Object.keys(coll.schema).find(k => coll.schema[k].type === 'date');
        if (!dk)
            throw new Error('Ohne Datums-Spalte gibt es keinen Termin.');
        const start = String(Datenbank.wert(row, dk, coll) || '');
        if (!start)
            throw new Error('Dieser Eintrag hat kein Datum.');
        const ganz = start.length <= 10;
        const endeKey = Object.keys(coll.schema).find(k => k !== dk && coll.schema[k].type === 'date');
        let ende = endeKey ? String(Datenbank.wert(row, endeKey, coll) || '') : '';
        if (!ende) {
            if (ganz)
                ende = start;
            else {
                const d = new Date(start);
                d.setHours(d.getHours() + 1);
                ende = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
                    'T' + p2(d.getHours()) + ':' + p2(d.getMinutes());
            }
        }
        /* Google will bei ganztägigen Terminen den Tag danach als Ende */
        let gEnde = ende;
        if (ganz) {
            const d = new Date(ende + 'T12:00');
            d.setDate(d.getDate() + 1);
            gEnde = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
        }
        const koerper = {
            summary: row.text || 'Ohne Titel',
            description: 'Aus Redion übernommen',
            start: ganz ? { date: start } : { dateTime: new Date(start).toISOString() },
            end: ganz ? { date: gEnde } : { dateTime: new Date(gEnde).toISOString() }
        };
        const ortKey = Object.keys(coll.schema).find(k => coll.schema[k].type === 'place');
        if (ortKey) {
            const o = Datenbank.wert(row, ortKey, coll);
            if (o)
                koerper.location = typeof o === 'object' ? (o.name || '') : String(o);
        }
        const vorhandene = (row.props || {}).uid;
        const url = GC + '/calendars/' + encodeURIComponent(kalenderId) + '/events' +
            (vorhandene ? '/' + encodeURIComponent(vorhandene) : '');
        const d = await Verbindungen.jsonRuf(url, {
            token, method: vorhandene ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(koerper)
        });
        if (coll.schema.uid)
            Store.setProp(row.id, 'uid', d.id);
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
        const zeichne = () => {
            const z = Verbindungen.zustand();
            const kasten = o.querySelector('#kb');
            if (!kasten)
                return;
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
                        ? '<div class="abo-liste">' + abos().map((a, i) => `<div class="abo-zeile"><span class="frei-kreis bg-${a.farbe || 'blue'}">📅</span>` +
                            `<span class="frei-name"><b>${esc(a.name || 'Ohne Namen')}</b>` +
                            `<span>${esc(a.url).slice(0, 60)}…${a.zuletzt ? ' · zuletzt ' + esc(String(a.zuletzt).slice(0, 10)) : ''}</span></span>` +
                            `<button data-an="${i}" title="Ein oder aus">${a.an === false ? '☐' : '☑'}</button>` +
                            `<button data-weg="${i}" title="Entfernen">🗑</button></div>`).join('') + '</div>'
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
        o.addEventListener('click', async (e) => {
            if (e.target === o || elVon(e)?.closest('[data-a="zu"]')) {
                o.remove();
                return;
            }
            const an = elVon(e)?.closest('[data-an]');
            if (an) {
                const l = abos();
                const eintrag = l[Number(an.dataset.an)];
                if (eintrag) {
                    eintrag.an = eintrag.an === false;
                    aboSpeichern(l);
                    zeichne();
                }
                return;
            }
            const weg = elVon(e)?.closest('[data-weg]');
            if (weg) {
                const l = abos();
                l.splice(Number(weg.dataset.weg), 1);
                aboSpeichern(l);
                zeichne();
                return;
            }
            const b = elVon(e)?.closest('button[data-a]');
            if (!b)
                return;
            const a = b.dataset.a;
            try {
                if (a === 'g-setup') {
                    o.remove();
                    Verbindungen.dialog();
                    return;
                }
                if (a === 'g-liste') {
                    const liste = await googleKalender();
                    const gliste = o.querySelector('#gliste');
                    if (!gliste)
                        return;
                    gliste.innerHTML = '<div class="abo-liste">' + liste.map((k) => `<div class="abo-zeile"><span class="frei-kreis" style="background:${esc(k.farbe || '#888')}">📅</span>` +
                        `<span class="frei-name"><b>${esc(k.name)}${k.standard ? ' · Standard' : ''}</b>` +
                        `<span>${esc(k.rolle)}</span></span>` +
                        `<button data-gk="${esc(k.id)}">Holen</button></div>`).join('') + '</div>';
                    return;
                }
                const gk = elVon(e)?.closest('[data-gk]');
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
                    if (!url)
                        return;
                    const name = await UI.frage('Wie soll er heissen?', 'Kalender');
                    const l = abos();
                    l.push({ url: url.trim(), name: name || 'Kalender', an: true,
                        farbe: ['blue', 'green', 'orange', 'purple'][l.length % 4] });
                    aboSpeichern(l);
                    zeichne();
                    UI.toast('Eingetragen — jetzt abgleichen');
                    return;
                }
                if (a === 'abo-hol') {
                    await alleAbosHolen();
                    zeichne();
                    return;
                }
                if (a === 'ics-datei') {
                    const inp = document.createElement('input');
                    inp.type = 'file';
                    inp.accept = '.ics,text/calendar';
                    inp.multiple = true;
                    inp.addEventListener('change', async () => {
                        const coll = zielDatenbank();
                        let neu = 0, frisch = 0, entfallen = 0;
                        for (const f of Array.from(inp.files ?? [])) {
                            const text = await f.text();
                            const k = icsLesen(text);
                            const alle = [];
                            k.termine.forEach(t => wiederholungen(t).forEach((x) => alle.push(x)));
                            const erg = uebernehmen(coll, alle, k.name || f.name.replace(/\.ics$/i, ''));
                            neu += erg.neu;
                            frisch += erg.frisch;
                            entfallen += erg.entfallen || 0;
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
                    const dbs = Object.values(Store.cache.collections)
                        .filter(c => Object.values(c.schema).some(d => d.type === 'date'));
                    if (!dbs.length) {
                        UI.toast('Keine Datenbank mit Datum gefunden');
                        return;
                    }
                    const r = b.getBoundingClientRect();
                    const m = UI.menu('<div class="grp">Welche Datenbank?</div>' +
                        dbs.map(c => `<button data-c="${c.id}">${esc(c.name || 'Ohne Namen')}</button>`).join(''), r.left, r.bottom + 4);
                    m.addEventListener('click', ev => {
                        const c = ev.target instanceof Element
                            ? ev.target.closest('button[data-c]') : null;
                        if (!c)
                            return;
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
            }
            catch (err) {
                UI.banner(err instanceof Error ? err.message : String(err), 'warn');
            }
        });
    };
    return { icsLesen, icsSchreiben, icsZeit, wiederholungen, terminSchluessel,
        dauerInMs, terminLaenge, endeAus,
        zielDatenbank, uebernehmen,
        abos, aboHolen, alleAbosHolen, adresseGerade,
        googleKalender, googleTermine, nachGoogle, dialog };
})();
window.Kalender = Kalender;
