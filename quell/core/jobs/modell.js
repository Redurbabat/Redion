"use strict";
/* ============================================================================
 * core/jobs/modell.ts — was ein Auftrag ist und wann er was darf
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/jobs/modell.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/core/jobs/modell.js`. Wer das .js bearbeitet, verliert die Änderung
 * beim nächsten Bauen; `pruefungen/lauf/test105.mts` meldet es vorher.
 * ----------------------------------------------------------------------------
 * WARUM DIESE DATEI VON DER MASCHINE GETRENNT IST.
 *
 * Eine Auftragsmaschine hat zwei Hälften, die man leicht verwechselt:
 *
 *   DIE REGELN   Wann darf ein Auftrag laufen? Wie lange wartet er nach
 *                einem Fehler? Wann ist Schluss? Das ist Rechnen.
 *   DIE ARBEIT   Ablage öffnen, Transaktion, Zeit messen, Ereignis melden.
 *                Das ist Wirkung.
 *
 * Hier stehen nur die REGELN. Keine Ablage, keine Uhr, kein `Date.now()` —
 * die Zeit kommt als Zahl herein. Das ist nicht Sauberkeit um ihrer selbst
 * willen: eine Regel, die auf die echte Uhr wartet, lässt sich nur mit
 * echtem Warten prüfen, und dann prüft man sie eben nicht.
 *
 * Alles hier ist eine reine Funktion. Der Prüflauf dazu braucht keinen
 * Browser.
 *
 * ─── DIE ZUSTÄNDE, UND WARUM ES FÜNF SIND ───────────────────────────────────
 *
 *   wartet       angelegt, noch nicht dran. Auch: nach einem Fehler, der
 *                sich wiederholen lässt.
 *   laeuft       jemand hat ihn genommen und hält eine PACHT darauf.
 *   fertig       durch. Bleibt eine Weile liegen, damit man es sieht.
 *   fehler       endgültig gescheitert — die Versuche sind aufgebraucht.
 *                Bleibt LIEGEN und wird nicht weggeräumt: ein Auftrag, der
 *                still verschwindet, ist genau der Fehler, den niemand
 *                meldet.
 *   abgebrochen  ein Mensch hat abgebrochen. Kein Fehler.
 *
 * Es gibt bewusst KEINEN Zustand „pausiert". Wer pausieren will, bricht ab
 * und legt neu an; ein vierter Weg, der fast dasselbe tut, kostet mehr
 * Verwirrung als er bringt.
 *
 * ─── DIE PACHT, UND WARUM ES SIE GIBT ───────────────────────────────────────
 *
 * Redion kann in mehreren Tabs offen sein (§16). Ohne Absprache nähmen zwei
 * Tabs denselben Auftrag und täten die Arbeit doppelt — bei einem OCR-Lauf
 * heisst das doppelte Kosten, bei einem Import doppelte Daten.
 *
 * Ein Auftrag trägt deshalb, wer ihn hält (`geraet`) und bis wann
 * (`bisWann`). Wer ihn nehmen will, prüft beides. Und wenn ein Tab
 * abstürzt, läuft die Pacht ab und ein anderer darf.
 *
 * Das ist keine Sperre im strengen Sinn — die entsteht erst dadurch, dass
 * die Maschine Lesen und Schreiben in EINE IndexedDB-Transaktion legt.
 * Diese Datei sagt nur, was gilt; das Durchsetzen steht in `maschine.ts`.
 * ==========================================================================*/
const JobModell = (() => {
    /** Wie lange eine Pacht gilt, wenn niemand etwas anderes sagt. */
    const PACHT_MS = 30000;
    /** Wie oft es versucht wird, bevor endgültig Schluss ist. */
    const MAX_VERSUCHE = 3;
    /**
     * Ein neuer Auftrag.
     *
     * `jetzt` kommt herein, statt hier `Date.now()` zu rufen — siehe Kopf.
     */
    const anlegen = (id, art, eingabe, jetzt, zeitText, opt = {}) => ({
        id, art, zustand: 'wartet', eingabe,
        schritt: 0, schritte: opt.schritte || 0, stand: null,
        versuche: 0, maxVersuche: opt.maxVersuche || MAX_VERSUCHE,
        geraet: '', bisWann: 0, nachher: jetzt,
        angelegt: zeitText, begonnen: '', beendet: '',
        fehler: '', text: opt.text || ''
    });
    /**
     * Darf dieser Auftrag JETZT genommen werden?
     *
     * Drei Fälle sagen ja, und der dritte ist der wichtige:
     *   · er wartet und seine Wartezeit ist um
     *   · er läuft, aber die Pacht ist abgelaufen — der Halter ist weg
     *   · er läuft und ICH bin der Halter (Neustart desselben Tabs)
     */
    const nehmbar = (a, jetzt, geraet) => {
        if (!a)
            return false;
        if (a.zustand === 'wartet')
            return a.nachher <= jetzt;
        if (a.zustand !== 'laeuft')
            return false;
        return a.bisWann <= jetzt || a.geraet === geraet;
    };
    /**
     * Der genommene Auftrag.
     *
     * `versuche` steigt HIER, nicht beim Scheitern. Das ist Absicht: ein Tab,
     * der mitten in der Arbeit abstürzt, meldet nichts mehr — er kann gar
     * nicht mehr zählen. Zählt man erst beim Scheitern, läuft ein Auftrag,
     * der zuverlässig abstürzt, ewig weiter.
     */
    const nehmen = (a, jetzt, geraet, zeitText, pachtMs = PACHT_MS) => ({
        ...a,
        zustand: 'laeuft',
        versuche: a.versuche + 1,
        geraet,
        bisWann: jetzt + pachtMs,
        begonnen: a.begonnen || zeitText
    });
    /**
     * Die Pacht verlängern, während gearbeitet wird.
     *
     * Ein OCR-Lauf über achtzig Seiten dauert länger als jede vernünftige
     * Pacht. Ohne Verlängerung nähme ein zweiter Tab ihn mitten in der Arbeit
     * weg — und beide liefen weiter.
     */
    const halten = (a, jetzt, pachtMs = PACHT_MS) => ({ ...a, bisWann: jetzt + pachtMs });
    /**
     * Ein Schritt ist fertig.
     *
     * Das ist der Wiederaufsetzpunkt: was hier geschrieben wird, überlebt
     * einen Absturz. Wer erst am Ende schreibt, hat nach achtzig Seiten OCR
     * und einem Stromausfall nichts.
     */
    const schrittFertig = (a, stand, jetzt, text, pachtMs = PACHT_MS) => ({
        ...a,
        schritt: a.schritt + 1,
        stand,
        bisWann: jetzt + pachtMs,
        text: text === undefined ? a.text : text
    });
    const fertig = (a, zeitText, text) => ({
        ...a,
        zustand: 'fertig', geraet: '', bisWann: 0,
        beendet: zeitText, fehler: '',
        text: text === undefined ? a.text : text
    });
    const abbrechen = (a, zeitText) => ({
        ...a,
        zustand: 'abgebrochen', geraet: '', bisWann: 0, beendet: zeitText
    });
    /**
     * Wie lange nach dem n-ten Fehlversuch gewartet wird.
     *
     * Verdoppelnd ab einer Sekunde, gedeckelt bei fünf Minuten. Der Deckel
     * ist nötig: ohne ihn wartet der zehnte Versuch siebzehn Minuten, und
     * niemand sieht mehr, ob die Maschine noch lebt.
     *
     * Kein Zufallsanteil („jitter"): der wäre gegen einen Serverandrang durch
     * viele Geräte gedacht, und Redions Aufträge laufen auf EINEM Gerät.
     * Ein Zufallsanteil machte hier nur die Prüfung unzuverlässig.
     */
    const wartezeit = (versuche) => Math.min(300000, 1000 * Math.pow(2, Math.max(0, versuche - 1)));
    /**
     * Der Auftrag ist gescheitert.
     *
     * Sind die Versuche aufgebraucht, geht er auf `fehler` und BLEIBT LIEGEN.
     * Ein Auftrag, der nach dem dritten Fehlschlag still verschwindet, ist
     * die Sorte Fehler, die niemand meldet — der Mensch denkt, das OCR läuft
     * noch.
     */
    const gescheitert = (a, meldung, jetzt, zeitText) => {
        const aus = a.versuche >= a.maxVersuche;
        return {
            ...a,
            zustand: aus ? 'fehler' : 'wartet',
            geraet: '', bisWann: 0,
            nachher: aus ? a.nachher : jetzt + wartezeit(a.versuche),
            beendet: aus ? zeitText : '',
            fehler: String(meldung || 'Unbekannter Fehler')
        };
    };
    /**
     * Nach einem Neustart: was stand offen?
     *
     * Ein Auftrag auf `laeuft`, dessen Pacht abgelaufen ist, hat seinen
     * Halter verloren. Er geht zurück auf `wartet` — mit einer WARTEZEIT,
     * nicht sofort. Sofort hiesse: ein Auftrag, der den Tab zum Absturz
     * bringt, bringt ihn beim nächsten Start gleich wieder zum Absturz.
     */
    const zurueckstellen = (a, jetzt, zeitText) => {
        if (a.zustand !== 'laeuft')
            return a;
        if (a.versuche >= a.maxVersuche) {
            return { ...a, zustand: 'fehler', geraet: '', bisWann: 0,
                beendet: zeitText,
                fehler: a.fehler || 'Nach einem Neustart nicht fortgesetzt — ' +
                    'die Versuche waren aufgebraucht.' };
        }
        return { ...a, zustand: 'wartet', geraet: '', bisWann: 0,
            nachher: jetzt + wartezeit(a.versuche) };
    };
    /** Ist der Auftrag zu Ende — egal wie? */
    const beendet = (a) => a.zustand === 'fertig' || a.zustand === 'fehler' || a.zustand === 'abgebrochen';
    /**
     * Wie weit ist er, von 0 bis 1?
     *
     * Ohne bekannte Schrittzahl gibt es KEINE Zahl — dann `-1`. Ein
     * erfundener Fortschrittsbalken, der bei 90 % stehenbleibt, ist
     * schlimmer als gar keiner.
     */
    const fortschritt = (a) => {
        if (a.zustand === 'fertig')
            return 1;
        if (!a.schritte || a.schritte <= 0)
            return -1;
        return Math.min(1, Math.max(0, a.schritt / a.schritte));
    };
    /**
     * Welcher Auftrag ist als nächstes dran?
     *
     * Die Reihenfolge ist ausdrücklich: wer länger wartet, kommt zuerst.
     * Keine Prioritäten — die verleiten dazu, alles als wichtig zu
     * markieren, und dann ist wieder nichts wichtig. Wer etwas vorziehen
     * will, bricht das andere ab.
     */
    const naechster = (alle, jetzt, geraet) => {
        let best = null;
        for (const a of alle) {
            if (!nehmbar(a, jetzt, geraet))
                continue;
            if (!best || a.angelegt < best.angelegt ||
                (a.angelegt === best.angelegt && a.id < best.id))
                best = a;
        }
        return best;
    };
    /**
     * Was beim Aufräumen weg darf.
     *
     * NUR `fertig` und `abgebrochen`, und auch die erst nach einer Weile.
     * `fehler` bleibt immer — das ist der ganze Punkt einer Fehlerablage.
     */
    const aufraeumbar = (a, jetzt, haltenMs) => {
        if (a.zustand !== 'fertig' && a.zustand !== 'abgebrochen')
            return false;
        if (!a.beendet)
            return false;
        const t = Date.parse(a.beendet);
        if (!Number.isFinite(t))
            return false;
        return jetzt - t > haltenMs;
    };
    return {
        anlegen, nehmbar, nehmen, halten, schrittFertig, fertig, abbrechen,
        gescheitert, zurueckstellen, beendet, fortschritt, naechster,
        aufraeumbar, wartezeit,
        PACHT_MS, MAX_VERSUCHE
    };
})();
window.JobModell = JobModell;
