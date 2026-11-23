"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/einstellungen.ts (npm run bauen:ts). */
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
        { id: 'wolkeTakt', gruppe: 'Wolke', name: 'Abgleich alle', art: 'auswahl',
            werte: [['0', 'nur beim Öffnen und von Hand'],
                ['15', 'Nahezu live (15 Sekunden, nur bei offener App)'],
                ['120', '2 Minuten'], ['600', '10 Minuten']],
            vorgabe: '120',
            was: 'Die schnelle Option prüft alle 15 Sekunden, solange die App offen ist. ' +
                'Das verbraucht zusätzliche Anfragen und ist kein echter Sofort-Push. ' +
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
    const lies = (id) => {
        const e = eines(id);
        if (!e)
            return undefined;
        if (typeof Store === 'undefined')
            return e.vorgabe;
        return Store.getMeta(id, e.vorgabe);
    };
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
            Ereignisse.melde(ARTEN.einstellungGeaendert, { id, wert });
        return true;
    };
    const zuruecksetzen = (nurGruppe) => {
        LISTE.filter(e => !nurGruppe || e.gruppe === nurGruppe)
            .forEach(e => { if (typeof Store !== 'undefined')
            Store.setMeta(e.id, e.vorgabe); });
    };
    return { alle, eines, gruppen, inGruppe, lies, setze, zuruecksetzen, melde,
        anzahl: () => LISTE.length };
})();
