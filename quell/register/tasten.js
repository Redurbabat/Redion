"use strict";
/* ============================================================================
 * register/tasten.js — alle Tastenkürzel an einer Stelle
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/register/tasten.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/register/tasten.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Ein Tastenkürzel lebt bisher an zwei Orten: dort, wo es ausgeführt wird,
 * und dort, wo es in der Übersicht steht. Das läuft auseinander — und zwar
 * unsichtbar: die Übersicht zeigt ein Kürzel, das es nicht mehr gibt, und
 * niemand merkt es, weil beides für sich richtig aussieht.
 *
 * Hier steht die Liste. Die Übersicht liest sie, und ein Prüflauf kann
 * vergleichen, ob es zu jedem Eintrag auch einen Griff im Code gibt.
 *
 * Die Form ist ein Paar: ['Strg N', 'Neue Seite'], gruppiert nach Bereich.
 * Absichtlich so knapp — eine Tabelle mit acht Spalten schreibt niemand
 * nach, und eine Liste, die niemand nachschreibt, ist falsch.
 * ==========================================================================*/
window.Register = window.Register || {};
Register.tasten = (() => {
    const EINGEBAUT = [
        ['Allgemein', [
                ['Strg N', 'Neue Seite'], ['Strg P', 'Suchen'], ['Strg K', 'Suchen / Befehle'],
                ['Strg Shift K', 'Befehlspalette'], ['Strg Shift P', 'Verschieben nach'],
                ['Strg Alt P', 'Präsentieren'], ['Strg [', 'Zurück'], ['Strg ]', 'Vorwärts'],
                ['Strg \\', 'Seitenleiste'], ['Strg Shift L', 'Hell / Dunkel'], ['Strg ,', 'Einstellungen'],
                ['Strg J', 'KI-Panel'], ['Strg F', 'Auf der Seite suchen'], ['Strg /', 'Diese Übersicht'],
                ['Strg L', 'Link zur Seite kopieren'], ['Strg Shift U', 'Eine Ebene nach oben'],
                ['Strg +', 'Schrift grösser'], ['Strg −', 'Schrift kleiner'], ['Strg 0', 'Schrift zurücksetzen'],
                ['Strg Shift D', 'Seite verdoppeln'], ['Strg Shift Y', 'An- und abheften'],
                ['Strg Shift N', 'Unterseite hier anlegen'], ['Strg Shift B', 'Papierkorb'],
                ['Strg Shift O', 'Was Redion kann'],
                ['Esc', 'Menü oder Auswahl schliessen']
            ]],
        ['Blöcke', [
                ['/', 'Blockmenü'],
                ['Strg Shift 0-9', 'Blocktyp wechseln (wie Notion auf Windows)'],
                ['Strg Alt 0-9', 'Blocktyp wechseln (wie Notion auf dem Mac)'],
                ['Strg Shift E', 'Formelblock'], ['Tab', 'Einrücken'],
                ['Shift Tab', 'Ausrücken'], ['Strg D', 'Duplizieren'], ['Strg Shift ↑ ↓', 'Verschieben'],
                ['Strg Alt T', 'Alle Toggles auf/zu'], ['Strg Enter', 'Abhaken oder öffnen'],
                ['Shift Enter', 'Zeilenumbruch im Block'], ['Esc', 'Block auswählen']
            ]],
        ['Formatierung', [
                ['Strg B', 'Fett'], ['Strg I', 'Kursiv'], ['Strg U', 'Unterstrichen'],
                ['Strg Shift S', 'Durchgestrichen'], ['Strg E', 'Code'], ['Strg Shift H', 'Letzte Farbe'],
                ['Strg K', 'Link setzen (bei Auswahl)']
            ]],
        /* Diese Kürzel wandeln beim Tippen um, sobald das Leerzeichen kommt —
           genau wie Notions „Markdown style". Sie stehen im Blockkatalog als
           md-Feld und sind deshalb hier keine Behauptung, sondern eine Liste. */
        ['Markdown beim Tippen', [
                ['# ␣', 'Überschrift 1'], ['## ␣', 'Überschrift 2'], ['### ␣', 'Überschrift 3'],
                ['- ␣ oder * ␣', 'Aufzählung'], ['1. ␣', 'Nummerierte Liste'],
                ['[] ␣', 'Aufgabe'], ['> ␣', 'Toggle'], ['" ␣', 'Zitat'],
                ['--- ␣', 'Trennlinie'], ['``` ␣', 'Codeblock'], ['$$ ␣', 'Formelblock'],
                ['**Text**', 'Fett'], ['*Text*', 'Kursiv'], ['`Text`', 'Code'],
                ['~~Text~~', 'Durchgestrichen'], ['__Text__', 'Unterstrichen']
            ]],
        ['Verknüpfen', [
                ['[[', 'Seite verlinken'], ['@', 'Seite, Datum oder Person erwähnen'],
                ['#', 'Schlagwort'], ['((', 'Blockverweis'], [':', 'Emoji']
            ]],
        ['Einen einzelnen Block', [
                ['Strg Pos1', 'Zum ersten Block der Seite'],
                ['Strg Ende', 'Zum letzten Block'],
                ['Strg Shift C', 'Link auf genau diesen Block'],
                ['Strg Shift ⌫', 'Block sofort in den Papierkorb'],
                ['Strg Shift Enter', 'Unterseite rechts daneben öffnen'],
                ['Strg /', 'Blocktyp ändern'],
                ['Rechtsklick', 'Blockmenü'],
                ['Entf bei Auswahl', 'Block löschen']
            ]],
        ['Werkzeuge', [
                ['Strg Shift J', 'Tagesjournal'], ['Strg Shift M', 'Schnellnotiz'],
                ['Strg Shift G', 'Graph'], ['Strg Shift T', 'Schlagwörter'],
                ['Strg Shift F', 'Fokus-Modus'], ['Strg Z', 'Rückgängig'], ['Strg Y', 'Wiederholen']
            ]],
        ['Fenster — hat Notion nur in der Desktop-App', [
                ['Strg T', 'Neuer Reiter'], ['Strg W', 'Reiter schliessen'],
                ['Strg Tab', 'Nächster Reiter'], ['Strg Shift Tab', 'Vorheriger Reiter'],
                ['Strg 1 … 9', 'Direkt zu diesem Reiter'],
                ['Strg Alt S', 'Geteilte Ansicht ein oder aus'],
                ['Shift Klick', 'Seitenlink rechts öffnen']
            ]],
        ['Mehrere Blöcke auf einmal', [
                ['Esc', 'Block auswählen — und beim zweiten Mal wieder freigeben'],
                ['Shift ↑ ↓', 'Auswahl vergrössern'],
                ['↑ ↓', 'Auswahl verschieben'],
                ['Strg A', 'Alle Blöcke der Seite'],
                ['Shift Klick', 'Von hier bis dorthin'],
                ['Strg Klick', 'Einzelnen dazu oder weg'],
                ['Strg C', 'Als Markdown kopieren'],
                ['Strg X', 'Ausschneiden'],
                ['Strg V', 'Wieder einfügen'],
                ['Strg D', 'Alle duplizieren'],
                ['Entf', 'Alle in den Papierkorb'],
                ['Tab', 'Alle einrücken'],
                ['Shift Tab', 'Alle ausrücken'],
                ['Strg Shift ↑ ↓', 'Alle verschieben'],
                ['Strg Shift 0-9', 'Alle umwandeln'],
                ['Leertaste', 'Öffnen, auf- und zuklappen, abhaken'],
                ['Strg Shift Enter', 'Seite rechts daneben öffnen'],
                ['Enter', 'Wieder in den Text']
            ]],
        ['In Tabellen', [
                ['↑ ↓ ← →', 'Von Zelle zu Zelle'], ['Enter oder F2', 'Zelle bearbeiten'],
                ['Tab', 'Nächste Zelle'], ['Shift Tab', 'Vorherige Zelle'],
                ['Pos1 / Ende', 'An den Rand der Zeile'],
                ['Strg Pos1 / Ende', 'An den Rand der Tabelle'],
                ['Leertaste', 'Zeile in der Vorschau'],
                ['Strg Enter', 'Zeile als ganze Seite'],
                ['Strg Shift Enter', 'Zeile rechts daneben'],
                ['Shift Enter', 'Neue Zeile darunter'],
                ['Entf', 'Zelle leeren'],
                ['Strg D', 'Von oben nach unten füllen'],
                ['Strg R', 'Von links nach rechts füllen'],
                ['Rechtsklick', 'Zeilenmenü']
            ]],
        ['Im Kalender', [
                ['T oder D', 'Tagesansicht'], ['W', 'Wochenansicht'], ['M', 'Monatsansicht'],
                ['Doppelklick', 'Termin an dieser Stelle anlegen']
            ]],
        ['Am Telefon', [
                ['Lange drücken', 'Blockmenü'], ['Nach rechts wischen', 'Abhaken'],
                ['Nach links wischen', 'Archivieren oder löschen'],
                ['Leiste über der Tastatur', 'Formatieren ohne Menü']
            ]]
    ];
    /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
    const LISTE = EINGEBAUT.slice();
    /** Ein Kürzel nachtragen. Gruppe gibt es noch nicht? Dann entsteht sie. */
    const melde = (gruppe, taste, was) => {
        if (!taste || !was)
            return false;
        let g = LISTE.find(x => x[0] === gruppe);
        if (!g) {
            g = [gruppe, []];
            LISTE.push(g);
        }
        if (g[1].some(x => x[0] === taste))
            return false;
        g[1].push([taste, was]);
        return true;
    };
    const alle = () => LISTE;
    const gruppen = () => LISTE.map(x => x[0]);
    const inGruppe = (g) => LISTE.find(x => x[0] === g)?.[1] ?? [];
    /** Alle Kürzel flach, mit Gruppe — für Suche und Prüfläufe. */
    const flach = () => LISTE.flatMap(([g, liste]) => liste.map(([taste, was]) => ({ gruppe: g, taste, was })));
    const anzahl = () => flach().length;
    /**
     * Zweimal dieselbe Taste — aber nur innerhalb einer Gruppe ein Fehler.
     *
     * Über Gruppen hinweg ist eine Doppelbelegung Absicht und richtig: Esc
     * schliesst ein Menü, und wenn keines offen ist, wählt es den Block aus.
     * Strg K sucht, und bei markiertem Text setzt es einen Link. Wer solche
     * Fälle meldet, bekommt eine Liste, die nie leer wird — und dann sieht
     * niemand mehr hin, wenn wirklich zwei Griffe kollidieren.
     */
    const doppelte = () => {
        const raus = [];
        LISTE.forEach(([gruppe, liste]) => {
            const gesehen = new Map();
            liste.forEach(([taste, was]) => {
                const t = String(taste).toLowerCase().replace(/\s+/g, ' ');
                if (gesehen.has(t))
                    raus.push({ gruppe, taste, a: gesehen.get(t) ?? '', b: was });
                else
                    gesehen.set(t, was);
            });
        });
        return raus;
    };
    /** Dieselbe Taste in mehreren Gruppen — kein Fehler, aber gut zu wissen. */
    const mehrfach = () => {
        const wo = new Map();
        flach().forEach(k => {
            const t = k.taste.toLowerCase().replace(/\s+/g, ' ');
            const liste = wo.get(t) ?? [];
            liste.push(k);
            wo.set(t, liste);
        });
        return [...wo.values()].filter(v => v.length > 1)
            .map(v => ({ taste: v[0]?.taste ?? '', stellen: v.map(k => k.gruppe + ': ' + k.was) }));
    };
    const suche = (text) => {
        const t = String(text || '').toLowerCase();
        if (!t)
            return flach();
        return flach().filter(k => k.taste.toLowerCase().includes(t) || k.was.toLowerCase().includes(t));
    };
    return { alle, gruppen, inGruppe, flach, anzahl, doppelte, mehrfach, suche, melde };
})();
