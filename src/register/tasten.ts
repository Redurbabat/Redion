/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/register/tasten.ts (npm run bauen:ts). */
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

(window as any).Register = (window as any).Register || {};

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
      /* AUF BLATT UND PDF-SEITE, wie in GoodNotes (E465): ein Buchstabe
         wechselt das Werkzeug — nur, solange niemand tippt. Die Griffe
         stehen in `marken.ts` (TASTEN); test438 haelt beide Listen zusammen. */
      ['Blatt und PDF', [
        ['P', 'Stift'], ['2', 'Bleistift'], ['H', 'Marker'], ['E', 'Radierer'],
        ['S', 'Form'], ['V', 'Auswahl'], ['T', 'Text'], ['A', 'Abdecken'],
        ['N', 'Haftnotiz'], ['M', 'Fachzeichen'], ['R', 'Lineal'], ['I', 'Bild'],
        ['Strg Z', 'Zurück'], ['Strg Shift Z', 'Vor'], ['Strg C · Strg V', 'Auswahl kopieren, einsetzen'],
        ['Entf', 'Auswahl löschen']
      ]],
      /* AUF DER SCHALTPLANFLÄCHE (E770, aus Redurs ZIP): ein Buchstabe oder
         eine Ziffer, nur solange niemand tippt und die Fläche den Fokus hat.
         Die Griffe stehen in `planflaeche.ts` (keydown der Fläche). */
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
      /* Diese Kürzel wandeln beim Tippen um, sobald das Leerzeichen kommt —
         genau wie Notions „Markdown style". Sie stehen im Blockkatalog als
         md-Feld und sind deshalb hier keine Behauptung, sondern eine Liste. */
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
      /* Einfügen ist die Gegenrichtung zu „Als Markdown kopieren". Wer eine
         Gliederung einfügt, bekommt sie wieder als Blöcke — nicht als einen
         Block voller Rautezeichen. */
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

  /**
   * Ein Kürzel: die Tasten und was sie tun. Zwei Zeichenketten, sonst
   * nichts — die Übersicht ist eine Tabelle und kein Datenmodell.
   */
  type Kuerzel = [taste: string, was: string];

  /** Eine Gruppe: eine Überschrift und ihre Kürzel. */
  type Gruppe = [name: string, kuerzel: Kuerzel[]];

  /* Eine Liste, und immer dieselbe — siehe register/bloecke.js. */
  const LISTE: Gruppe[] = EINGEBAUT.slice() as Gruppe[];

  /** Ein Kürzel nachtragen. Gruppe gibt es noch nicht? Dann entsteht sie. */
  const melde = (gruppe: string, taste: string, was: string): boolean => {
    if (!taste || !was) return false;
    let g = LISTE.find(x => x[0] === gruppe);
    if (!g) { g = [gruppe, []]; LISTE.push(g); }
    if (g[1].some(x => x[0] === taste)) return false;
    g[1].push([taste, was]);
    return true;
  };

  const alle = (): Gruppe[] => LISTE;
  const gruppen = (): string[] => LISTE.map(x => x[0]);
  const inGruppe = (g: string): Kuerzel[] => LISTE.find(x => x[0] === g)?.[1] ?? [];

  /** Alle Kürzel flach, mit Gruppe — für Suche und Prüfläufe. */
  const flach = (): { gruppe: string; taste: string; was: string }[] =>
    LISTE.flatMap(([g, liste]) => liste.map(([taste, was]) => ({ gruppe: g, taste, was })));

  const anzahl = (): number => flach().length;

  /**
   * Zweimal dieselbe Taste — aber nur innerhalb einer Gruppe ein Fehler.
   *
   * Über Gruppen hinweg ist eine Doppelbelegung Absicht und richtig: Esc
   * schliesst ein Menü, und wenn keines offen ist, wählt es den Block aus.
   * Strg K sucht, und bei markiertem Text setzt es einen Link. Wer solche
   * Fälle meldet, bekommt eine Liste, die nie leer wird — und dann sieht
   * niemand mehr hin, wenn wirklich zwei Griffe kollidieren.
   */
  const doppelte = (): { gruppe: string; taste: string; a: string; b: string }[] => {
    const raus: { gruppe: string; taste: string; a: string; b: string }[] = [];
    LISTE.forEach(([gruppe, liste]) => {
      const gesehen = new Map<string, string>();
      liste.forEach(([taste, was]) => {
        const t = String(taste).toLowerCase().replace(/\s+/g, ' ');
        if (gesehen.has(t)) raus.push({ gruppe, taste, a: gesehen.get(t) ?? '', b: was });
        else gesehen.set(t, was);
      });
    });
    return raus;
  };

  /** Dieselbe Taste in mehreren Gruppen — kein Fehler, aber gut zu wissen. */
  const mehrfach = (): { taste: string; stellen: string[] }[] => {
    const wo = new Map<string, { gruppe: string; taste: string; was: string }[]>();
    flach().forEach(k => {
      const t = k.taste.toLowerCase().replace(/\s+/g, ' ');
      const liste = wo.get(t) ?? [];
      liste.push(k);
      wo.set(t, liste);
    });
    return [...wo.values()].filter(v => v.length > 1)
      .map(v => ({ taste: v[0]?.taste ?? '', stellen: v.map(k => k.gruppe + ': ' + k.was) }));
  };

  const suche = (text: unknown) => {
    const t = String(text || '').toLowerCase();
    if (!t) return flach();
    return flach().filter(k =>
      k.taste.toLowerCase().includes(t) || k.was.toLowerCase().includes(t));
  };

  return { alle, gruppen, inGruppe, flach, anzahl, doppelte, mehrfach, suche, melde };
})();
