"use strict";
/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/tasten.ts (npm run bauen:ts). */
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
        ['Blatt und PDF', [
                ['P', 'Stift'], ['2', 'Bleistift'], ['H', 'Marker'], ['E', 'Radierer'],
                ['S', 'Form'], ['V', 'Auswahl'], ['T', 'Text'], ['A', 'Abdecken'],
                ['N', 'Haftnotiz'], ['M', 'Fachzeichen'], ['R', 'Lineal'], ['I', 'Bild'],
                ['Strg Z', 'Zurück'], ['Strg Shift Z', 'Vor'], ['Strg C · Strg V', 'Auswahl kopieren, einsetzen'],
                ['Entf', 'Auswahl löschen']
            ]],
        ['Schaltplan', [
                ['1 – 5', 'Zeigen, Leitung, Text, Stromschiene, Radierer'], ['B', 'Bauteilpalette auf/zu'],
                ['/', 'Bauteil suchen'], ['P', 'Strom ein / aus'], ['R', 'Drehen'], ['H', 'Spiegeln'],
                ['Alt Shift E', 'Elektro Studio'], ['Alt Shift P', 'Prüfzentrum'],
                ['Esc', 'Ziehen abbrechen, Auswahl aufheben']
            ]],
        ['Formatierung', [
                ['Strg B', 'Fett'], ['Strg I', 'Kursiv'], ['Strg U', 'Unterstrichen'],
                ['Strg Shift S', 'Durchgestrichen'], ['Strg E', 'Code'], ['Strg Shift H', 'Letzte Farbe'],
                ['Strg K', 'Link setzen (bei Auswahl)']
            ]],
        ['Markdown beim Tippen', [
                ['# ␣', 'Überschrift 1'], ['## ␣', 'Überschrift 2'], ['### ␣', 'Überschrift 3'],
                ['- ␣ · * ␣ · + ␣', 'Aufzählung'],
                ['1. ␣ · a. ␣ · i. ␣', 'Nummerierte Liste — auch mit Klammer: 1) a) i)'],
                ['[] ␣', 'Aufgabe'], ['[x] ␣', 'Aufgabe, schon abgehakt'],
                ['> ␣', 'Toggle'], ['" ␣', 'Zitat'],
                ['--- ␣ · *** ␣ · ___ ␣', 'Trennlinie'],
                ['``` ␣', 'Codeblock'], ['```js ␣', 'Codeblock in dieser Sprache'],
                ['$$ ␣', 'Formelblock'],
                ['**Text**', 'Fett'], ['*Text*', 'Kursiv'], ['`Text`', 'Code'],
                ['~Text~ · ~~Text~~', 'Durchgestrichen'], ['__Text__', 'Unterstrichen'],
                ['[Text](Adresse)', 'Link'], ['$a^2$', 'Formel im Text']
            ]],
        ['Markdown einfügen', [
                ['# Text', 'Eingefügt wird daraus eine Überschrift'],
                ['- [x] Text', 'Eine schon abgehakte Aufgabe'],
                ['``` … ```', 'Ein Codeblock — der Inhalt bleibt wörtlich'],
                ['Vier Leerzeichen', 'Eine Stufe tiefer, als Kind darüber'],
                ['Im Codeblock', 'Markdown bleibt Text und wird nicht gelesen']
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
                ['Strg Alt N', 'Neuer Reiter'], ['Strg Alt W', 'Reiter schliessen'],
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
    const LISTE = EINGEBAUT.slice();
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
    const flach = () => LISTE.flatMap(([g, liste]) => liste.map(([taste, was]) => ({ gruppe: g, taste, was })));
    const anzahl = () => flach().length;
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
