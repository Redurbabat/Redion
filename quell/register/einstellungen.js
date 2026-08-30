"use strict";
/* ============================================================================
 * register/einstellungen.js — jede Einstellung an einer Stelle
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/einstellungen.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/einstellungen.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Eine Einstellung lebte bisher an drei Orten: dem Schalter in der
 * Oberfläche, dem Schlüssel im Speicher und der Stelle, die ihn ausliest.
 * Wer eine hinzufügt, muss alle drei treffen — und wer eine umbenennt, bricht
 * sie still, weil der alte Schlüssel weiterhin im Bestand liegt.
 *
 * Hier steht sie einmal, mit Vorgabe und Bedeutung. Die Oberfläche zeichnet
 * sich daraus, und `lies`/`setze` sind der einzige Weg hinein.
 *
 * Eine Einstellung:
 *
 *     id       der Schlüssel im Bestand — ändert sich nie
 *     gruppe   wo sie in den Einstellungen steht
 *     name     was der Mensch liest
 *     art      'ja/nein' | 'auswahl' | 'zahl' | 'text' | 'farbe'
 *     vorgabe  was gilt, solange niemand etwas gesagt hat
 *     werte    bei 'auswahl': die Möglichkeiten
 *     was      ein Satz dazu, warum es das gibt
 * ==========================================================================*/
window.Register = window.Register || {};
Register.einstellungen = (() => {
    const EINGEBAUT = [
        { id: 'thema', gruppe: 'Aussehen', name: 'Farbschema', art: 'auswahl',
            werte: [['auto', 'Wie das System'], ['hell', 'Hell'], ['dunkel', 'Dunkel']],
            vorgabe: 'auto',
            was: 'Automatisch folgt der Einstellung des Rechners — auch wenn sie sich ' +
                'abends von selbst ändert.' },
        { id: 'schriftgroesse', gruppe: 'Aussehen', name: 'Schriftgrösse', art: 'zahl',
            vorgabe: 16, min: 12, max: 24,
            was: 'Gilt für den Text, nicht für die Oberfläche — die bleibt bedienbar.' },
        { id: 'breiteSeiten', gruppe: 'Aussehen', name: 'Breite Seiten', art: 'ja/nein',
            vorgabe: false,
            was: 'Ohne Rand ist mehr Platz, mit Rand liest es sich besser. Beides ist ' +
                'richtig, je nach Inhalt.' },
        { id: 'wochenstart', gruppe: 'Bereich', name: 'Woche beginnt am', art: 'auswahl',
            werte: [['1', 'Montag'], ['0', 'Sonntag']], vorgabe: '1',
            was: 'Gilt für Kalender, Wochenansichten und die Kalenderwoche.' },
        { id: 'datumsformat', gruppe: 'Bereich', name: 'Datum', art: 'auswahl',
            werte: [['de', '03.08.2026'], ['iso', '2026-08-03'], ['us', '08/03/2026']],
            vorgabe: 'de',
            was: 'Nur die Anzeige. Gespeichert wird immer nach ISO — sonst wäre eine ' +
                'Sicherung nicht mehr lesbar, wenn jemand die Einstellung ändert.' },
        { id: 'papierkorbTage', gruppe: 'Bereich', name: 'Papierkorb leeren nach', art: 'auswahl',
            werte: [['7', '7 Tagen'], ['30', '30 Tagen'], ['90', '90 Tagen'], ['0', 'nie']],
            vorgabe: '30',
            was: 'Danach ist es wirklich weg. „Nie" ist erlaubt und heisst: der ' +
                'Papierkorb wächst, bis jemand ihn leert.' },
        { id: 'autoVersionen', gruppe: 'Bereich', name: 'Fassungen automatisch merken', art: 'ja/nein',
            vorgabe: true,
            was: 'Beim Verlassen einer Seite wird eine Fassung abgelegt. Kostet Platz, ' +
                'rettet aber genau die Arbeit, die man versehentlich überschreibt.' },
        { id: 'protokollAus', gruppe: 'Bereich', name: 'Protokoll abschalten', art: 'ja/nein',
            vorgabe: false,
            was: 'Das Protokoll steht nur auf diesem Gerät. Wer es abschaltet, sieht ' +
                'später nicht mehr, was wann geschah.' },
        { id: 'kiModell', gruppe: 'KI', name: 'Modell', art: 'text', vorgabe: '',
            was: 'Bleibt leer, bis ein Schlüssel eingetragen ist. Ohne Schlüssel geht ' +
                'nichts hinaus — auch nicht versehentlich.' },
        { id: 'kiKontext', gruppe: 'KI', name: 'Kontext mitschicken', art: 'auswahl',
            werte: [['seite', 'Nur diese Seite'], ['auswahl', 'Nur das Markierte'],
                ['bereich', 'Seite und Unterseiten']],
            vorgabe: 'seite',
            was: 'Was die KI zu sehen bekommt. Weniger ist hier oft besser: kürzerer ' +
                'Kontext heisst genauere Antwort.' },
        /* SEIT E270 WIRD DIESER WERT WIRKLICH GELESEN (maschine.ts, takt()).
           Vorher stand er hier und nirgends sonst: der Abgleich nahm fest
           zwei Minuten. Die Beschriftung des Wertes `0` hiess „nur von Hand"
           und versprach damit zu viel — beim Öffnen des Fensters gleicht
           Redion weiterhin ab, und das soll auch so bleiben, sonst laufen
           zwei Geräte lautlos auseinander. Wer gar nichts schicken will,
           schaltet den Abgleich aus (Wolke → Nur lokal arbeiten). Die
           KENNUNG `0` bleibt, nur das Wort ist jetzt wahr. */
        { id: 'wolkeTakt', gruppe: 'Wolke', name: 'Abgleich alle', art: 'auswahl',
            werte: [['0', 'nur beim Öffnen und von Hand'],
                ['120', '2 Minuten'], ['600', '10 Minuten']],
            vorgabe: '120',
            was: 'Bei zwei Geräten sind zwei Minuten rund 1500 Anfragen am Tag — ein ' +
                'Sechzigstel der kostenlosen Grenze. Seltener heisst: das andere ' +
                'Gerät sieht deine Änderung später.' }
    ];
    const LISTE = EINGEBAUT.slice();
    const melde = (eintrag) => {
        const e = eintrag;
        if (!e || !e.id)
            return false;
        if (LISTE.some(x => x.id === e.id))
            return false;
        LISTE.push(e);
        return true;
    };
    const alle = () => LISTE;
    const eines = (id) => LISTE.find(x => x.id === id) || null;
    const gruppen = () => [...new Set(LISTE.map(x => x.gruppe))];
    const inGruppe = (g) => LISTE.filter(x => x.gruppe === g);
    /** Der jetzige Wert — oder die Vorgabe, wenn nie etwas gesagt wurde. */
    const lies = (id) => {
        const e = eines(id);
        if (!e)
            return undefined;
        if (typeof Store === 'undefined')
            return e.vorgabe;
        return Store.getMeta(id, e.vorgabe);
    };
    /**
     * Setzen — mit Prüfung. Ein Wert ausserhalb der Möglichkeiten wird
     * abgelehnt statt gespeichert; sonst steht später etwas im Bestand, das
     * keine Oberfläche mehr anzeigen kann.
     */
    const setze = (id, wert) => {
        const e = eines(id);
        if (!e)
            return false;
        if (e.art === 'auswahl' && !(e.werte || []).some(w => String(w[0]) === String(wert)))
            return false;
        if (e.art === 'zahl') {
            const n = Number(wert);
            if (!isFinite(n))
                return false;
            if (e.min !== undefined && n < e.min)
                return false;
            if (e.max !== undefined && n > e.max)
                return false;
            wert = n;
        }
        if (e.art === 'ja/nein')
            wert = !!wert;
        if (typeof Store !== 'undefined')
            Store.setMeta(id, wert);
        if (typeof Ereignisse !== 'undefined')
            Ereignisse.melde('einstellung.geaendert', { id, wert });
        return true;
    };
    /** Alles zurück auf Vorgabe — für „so wie am Anfang". */
    const zuruecksetzen = (nurGruppe) => {
        LISTE.filter(e => !nurGruppe || e.gruppe === nurGruppe)
            .forEach(e => { if (typeof Store !== 'undefined')
            Store.setMeta(e.id, e.vorgabe); });
    };
    return { alle, eines, gruppen, inGruppe, lies, setze, zuruecksetzen, melde,
        anzahl: () => LISTE.length };
})();
