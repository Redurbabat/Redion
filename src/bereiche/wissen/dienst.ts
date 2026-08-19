/* ============================================================================
 * bereiche/wissen/dienst.js — was die Werkzeuge rechnen, ohne etwas zu zeigen
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/wissen/dienst.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/wissen/dienst.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Die unscharfe Suche der Befehlspalette, das Wiederholungsverfahren der
 * Karteikarten, Markdown hin und zurück, die Schreibstatistik und die
 * kleinen Datums- und Namenshelfer. Vorher standen sie verstreut zwischen
 * 1970 Zeilen Oberfläche in `werkzeuge.js`.
 *
 * WIE DIESE DATEI ZUSTANDE KAM, ist der interessantere Teil. `AUFGABEN.md`
 * nimmt für A4 an, `werkzeuge.js` liesse sich wie `steuerung.js` in eine
 * rechnende und eine zeichnende Hälfte teilen. Nachgemessen stimmt das
 * nicht: über alle vierzehn Abschnitte gezählt fasst **jeder** von ihnen
 * das Dokument an, zwischen 7 und 47 Mal. Es gibt hier keine rechnende
 * Hälfte, die man abschneiden könnte.
 *
 * Also wurde nicht geschnitten, sondern gesucht — nach den Stellen, die
 * wirklich nur rechnen. Es sind neun, und sie haben eine Gemeinsamkeit:
 * sie sind genau die Stellen, bei denen man sich fragt, ob sie richtig
 * rechnen. Ob „umb" wirklich „Umbenennen" findet. Ob eine Karte, die man
 * dreimal gewusst hat, in sechs Tagen wiederkommt oder in sechzehn. Ob eine
 * Markdown-Tabelle am Dateiende noch ankommt. Das lässt sich hier in
 * Millisekunden prüfen statt in einem Browser gar nicht.
 *
 * KEIN `document`, KEIN `window`, KEIN `App`, KEIN `UI`. Damit lädt die
 * Datei in Node. Was sie braucht, ist `Store` — ein Modul ohne Oberfläche,
 * das ein Prüflauf hinstellen kann.
 *
 * WAS DABEI AUFFIEL und mit umgezogen ist: `statistik` rechnete und zeichnete
 * in einem Zug. Die Rechnung steht jetzt als `statistikZahlen` hier, das
 * Fenster bleibt drüben. Das ist die einzige Stelle, an der nicht bloss
 * verschoben, sondern getrennt wurde — die Zahlen sind dieselben, nur
 * kommen sie jetzt aus einer Funktion, die man befragen kann.
 * ==========================================================================*/

const WissenDienst = (() => {

  const esc = (s: unknown): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const heute = () => new Date().toISOString().slice(0, 10);
  const WOCHENTAG = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const MONAT = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  const datumLang = (iso: string): string => {
    const d = new Date(iso + 'T12:00:00');
    return `${WOCHENTAG[d.getDay()]}, ${d.getDate()}. ${MONAT[d.getMonth()]} ${d.getFullYear()}`;
  };

  /* --------------------------------------------------------------------------
   * DIE UNSCHARFE SUCHE der Befehlspalette
   * --------------------------------------------------------------------------
   * Notions Palette sucht wörtlich: „umb" findet „Umbenennen" nicht. Hier
   * zählen die Buchstaben in der richtigen Reihenfolge.
   * ----------------------------------------------------------------------- */
  /* Gibt PUNKTE zurück, nicht ja/nein: höher ist besser, `-1` heisst „passt
     gar nicht". Der Name sagt das nicht — er blieb, weil er an sechzig
     Stellen steht; der Rückgabetyp sagt es jetzt. */
  const unscharf = (text: unknown, suche: unknown): number => {
    const t = String(text ?? '').toLowerCase(), q = String(suche ?? '').toLowerCase();
    if (!q) return 0;
    if (t === q) return 1000;
    if (t.startsWith(q)) return 800 - t.length;
    const wort = t.indexOf(' ' + q);
    if (wort >= 0) return 600 - t.length;
    if (t.includes(q)) return 400 - t.length;
    /* Buchstabe für Buchstabe: alle in der richtigen Reihenfolge? */
    let i = 0, punkte = 0, letzte = -2;
    for (const c of q) {
      const stelle = t.indexOf(c, i);
      if (stelle < 0) return -1;
      punkte += (stelle === letzte + 1) ? 8 : 2;      /* zusammenhängend zählt mehr */
      letzte = stelle;
      i = stelle + 1;
    }
    return punkte;
  };

  const zeitKurz = (iso: string | number | Date): string => {
    if (!iso) return '';
    const d = new Date(iso), j = new Date();
    const gleich = d.toDateString() === j.toDateString();
    const uhr = d.toTimeString().slice(0, 5);
    if (gleich) return 'Heute ' + uhr;
    const gestern = new Date(j); gestern.setDate(j.getDate() - 1);
    if (d.toDateString() === gestern.toDateString()) return 'Gestern ' + uhr;
    return d.toLocaleDateString('de-DE') + ' ' + uhr;
  };

  /* --------------------------------------------------------------------------
   * DAS WIEDERHOLUNGSVERFAHREN der Karteikarten (SM-2, wie Anki)
   * ----------------------------------------------------------------------- */
  /** SM-2 in kurz: leichter beantwortet = längerer Abstand. */
  const planen = (k: any, note: number): any => {
    const sr = Object.assign({ ease: 2.5, intervall: 0, wdh: 0 }, k.sr || {});
    if (note < 3) { sr.wdh = 0; sr.intervall = note === 1 ? 0 : 1; }
    else {
      sr.wdh++;
      sr.intervall = sr.wdh === 1 ? 1 : sr.wdh === 2 ? 6 : Math.round(sr.intervall * sr.ease);
      sr.ease = Math.max(1.3, sr.ease + (0.1 - (4 - note) * (0.08 + (4 - note) * 0.02)));
    }
    const d = new Date();
    if (sr.intervall === 0) d.setMinutes(d.getMinutes() + 10);
    else d.setDate(d.getDate() + sr.intervall);
    sr.faellig = d.toISOString();
    sr.zuletzt = Store.now();
    Store.updateBlock(k.id, { sr });
    return sr;
  };

  /* --------------------------------------------------------------------------
   * MARKDOWN hin und zurück
   * --------------------------------------------------------------------------
   * „Quelltext ansehen" leert die Seite und baut sie aus dem Text neu auf.
   * Alles, was Markdown nicht tragen kann, muss deshalb als Platzhalter
   * überleben — sonst ist der Knopf ein Löschknopf.
   *
   * BIS E113 STAND DIE LISTE ANDERSHERUM: vier Blockarten (`database`,
   * `whiteboard`, `chart`, `table`) waren namentlich gerettet, alle anderen
   * fielen durch. Das ging so lange gut, wie es nur diese vier gab. Gemessen
   * an einer Schulaufgabe aus Spalten, PDF-Seite, A4-Blatt und Rechenblatt:
   *
   *     vorher   9 Blöcke · 1 PDF-Seite · 1 Blatt · 3 Spalten · 2 Striche
   *     nachher  3 Blöcke · 0           · 0       · 0         · 0
   *     Text danach: „# Mathe\n\n  \n    \n  \n      Meine Antwort"
   *
   * Ein Klick, und die Klausur ist weg. Der Kopfkommentar dieser Funktion
   * hat den Fall sogar vorhergesagt („Ohne das wäre … ein Datenverlust") —
   * und die Liste darunter wurde trotzdem bei jeder neuen Blockart
   * vergessen: bei `spreadsheet` (E29), bei `columns`/`spalte` (E102), bei
   * `blatt` (E100), bei `pdfseite` (E103).
   *
   * DESHALB JETZT UMGEDREHT. `MD_TRAEGT` zählt auf, was Markdown WIRKLICH
   * verlustfrei hin und zurück bringt. Alles andere bekommt einen
   * Platzhalter, ohne dass jemand daran denken muss. Eine neue Blockart ist
   * damit von sich aus sicher — sie muss sich das Durchreichen verdienen,
   * statt es geschenkt zu bekommen.
   * ----------------------------------------------------------------------- */

  /* Was `alsMarkdown` unten wirklich abbildet UND `ausMarkdown` wieder
     einliest. Wer hier etwas einträgt, muss beide Richtungen belegen —
     `test187` fährt sie ab. */
  const MD_TRAEGT = new Set([
    'text', 'h1', 'h2', 'h3', 'todo', 'bullet', 'number',
    'quote', 'callout', 'divider', 'code', 'equation', 'image', 'flashcard'
  ]);

  /* Drei Blockarten stehen zwar in der Liste, tragen aber je nach Inhalt
     mehr, als Markdown abbilden kann. Dann zählt der Block, nicht die Art. */
  const mdTraegt = (b: any): boolean => {
    if (!MD_TRAEGT.has(b.type)) return false;
    /* Ein Bild aus der eigenen Ablage hängt an `dateiId`; `src` ist dabei
       leer oder eine tote `blob:`-Adresse (E98). `![](…)` würde daraus ein
       Bild ohne Datei machen — sichtbar erst nach dem nächsten Neustart. */
    if (b.type === 'image' && b.dateiId) return false;
    /* Eine gelernte Karteikarte trägt ihren Lernstand in `sr`. Der ist das
       Wertvolle daran; die Frage abzutippen kostet eine Minute, sechs
       Monate Wiederholung nicht. */
    if (b.type === 'flashcard' && b.sr) return false;
    /* `> 💡` ist die einzige Callout-Form, die zurückgelesen wird — ein
       anderes Zeichen käme als 💡 wieder. */
    if (b.type === 'callout' && b.icon && b.icon !== '💡') return false;
    return true;
  };

  /* Die vier alten Marken bleiben, was sie waren — sie stehen in
     `test89` und in jedem Text, den jemand herauskopiert und aufgehoben
     hat. Alles Übrige bekommt `blk:`. */
  const MD_MARKE: Record<string, string> = {
    database: 'db', whiteboard: 'wb', chart: 'chart', table: 'tab'
  };
  /* Ein Satz, den ein Mensch neben dem Platzhalter lesen kann. Kein
     Bestandteil des Formats — er wird beim Zurücklesen verworfen. */
  const mdName = (b: any): string => {
    /* `pdfseite` und `spalte` stehen in keinem Register — sie sind
       Bausteine ohne Menüeintrag (doku/BLOCKTYPEN.md). Ihr Name muss
       deshalb hier stehen, sonst läse der Mensch „pdfseite". */
    const OHNE_REGISTER: Record<string, string> = {
      pdfseite: 'PDF-Seite', spalte: 'Spalte'
    };
    const art = OHNE_REGISTER[b.type] ||
      ((typeof Register !== 'undefined' && Register.bloecke?.eines)
        ? (Register.bloecke.eines(b.type)?.name || b.type)
        : b.type);
    const zusatz = b.type === 'pdfseite' && b.nr ? ' ' + Number(b.nr) : '';
    const titel = String(b.text || '').trim().slice(0, 40);
    return art + zusatz + (titel ? ': ' + titel : '');
  };

  const alsMarkdown = (p: any): string => {
    const zeilen: string[] = [];
    const raus = (id: string, tiefe: number): void => {
      Store.childrenOf(id).forEach((b: any) => {
        const ein = '  '.repeat(tiefe);
        /* Kann Markdown das nicht tragen, kommt es als Platzhalter durch —
           samt allem, was darunter hängt. Der Satz dahinter ist für den
           Menschen: ein nackter Kommentar mit einer Kennung sagt ihm nicht,
           dass dort seine PDF-Seite steht. Gelesen wird nur die Kennung. */
        if (!mdTraegt(b)) {
          const marke = MD_MARKE[b.type] || 'blk';
          zeilen.push(`<!--${marke}:${b.id}--> ${mdName(b)}`);
          return;
        }
        if (b.type === 'divider') { zeilen.push('---'); return; }
        if (b.type === 'code') { zeilen.push('```' + (b.lang || '')); zeilen.push(b.text || ''); zeilen.push('```'); return; }
        if (b.type === 'equation') { zeilen.push('$$' + (b.text || '') + '$$'); return; }
        if (b.type === 'image') { zeilen.push(`![${b.caption || ''}](${b.src || ''})`); return; }
        if (b.type === 'page') { zeilen.push(`${ein}[[${b.text || 'Ohne Titel'}]]`); return; }
        const marke = ({
          h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '1. ',
          todo: b.checked ? '- [x] ' : '- [ ] ', quote: '> ', toggle: '> ',
          callout: '> 💡 ', flashcard: '?? '
        } as Record<string, string>)[b.type] || '';
        zeilen.push(ein + marke + (b.text || ''));
        raus(b.id, tiefe + 1);
      });
    };
    raus(p.id, 0);
    return zeilen.join('\n');
  };

  /** Markdown zurück in Blöcke. Vorhandene Datenbanken werden erkannt. */
  const ausMarkdown = (p: any, text: string): void => {
    /* Dieselbe Regel wie beim Hinschreiben, nur andersherum gelesen:
       gerettet wird, was NICHT durch Markdown gegangen ist. `Store.baum`
       nimmt den ganzen Ast mit — bei einer Spalte also auch die PDF-Seite
       darin und deren Striche. */
    const alteDbs: Record<string, any> = {};
    Store.childrenOf(p.id).forEach((b: any) => {
      if (!mdTraegt(b)) alteDbs[b.id] = Store.baum(b.id);
    });

    Store.kinderLeeren(p.id);

    let imCode = false, codeText: string[] = [], codeLang = '';
    const zeilen = text.split('\n');

    /* --- Markdown-Tabellen -------------------------------------------------
     * | Kopf | Kopf |
     * |------|------|
     * | Wert | Wert |
     * wird zu einem echten Tabellenblock. Ohne das landet jede Tabelle als
     * Textwüste aus Strichen — und die halbe Dokumentation besteht daraus.
     * -------------------------------------------------------------------- */
    const istTabellenzeile = (z: string): boolean => /^\s*\|.*\|\s*$/.test(z);
    const istTrenner = (z: string): boolean => /^\s*\|[\s:|-]+\|\s*$/.test(z) && /-/.test(z);
    const zellen = (z: any) => z.trim().replace(/^\||\|$/g, '').split('|').map((x: any) => x.trim());

    let tabelle: string[][] | null = null;   /* sammelt die Zeilen der laufenden Tabelle */
    const tabelleAbschliessen = (): void => {
      if (!tabelle) return;
      if (tabelle.length) {
        const breite = Math.max(...tabelle.map((r: any) => r.length));
        const rows = tabelle.map((r: any) => { const k = r.slice();
          while (k.length < breite) k.push(''); return k; });
        Store.addBlock(p.id, 'table', { rows, kopfZeile: true });
      }
      tabelle = null;
    };

    zeilen.forEach((roh: any) => {
      /* Tabellen zuerst — sie laufen über mehrere Zeilen */
      if (!imCode && istTabellenzeile(roh)) {
        if (istTrenner(roh)) { if (!tabelle) tabelle = []; return; }
        if (!tabelle) tabelle = [];
        tabelle.push(zellen(roh));
        return;
      }
      if (tabelle) tabelleAbschliessen();

      /* Der Teil hinter `-->` ist der Lesehinweis für den Menschen und
         wird verworfen. Die Kennung selbst darf nur enthalten, was eine
         Kennung enthält — sonst könnte ein `-->` im Text die Zeile
         verschieben. */
      const platz = roh.trim().match(/^<!--(?:db|wb|chart|tab|blk):([A-Za-z0-9_-]+)-->\s*(?:.*)$/);
      if (platz?.[1] && alteDbs[platz[1]]) { Store.baumEinfuegen(alteDbs[platz[1]], p.id); return; }

      if (roh.trim().startsWith('```')) {
        if (imCode) {
          Store.addBlock(p.id, 'code', { text: codeText.join('\n'), lang: codeLang });
          imCode = false; codeText = []; codeLang = '';
        } else { imCode = true; codeLang = roh.trim().slice(3).trim(); }
        return;
      }
      if (imCode) { codeText.push(roh); return; }

      const z = roh.trim();
      if (!z) return;
      if (/^(---|\*\*\*|___)$/.test(z)) { Store.addBlock(p.id, 'divider'); return; }
      if (/^\$\$(.*)\$\$$/.test(z)) { Store.addBlock(p.id, 'equation', { text: z.slice(2, -2) }); return; }
      const bild = z.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
      if (bild) { Store.addBlock(p.id, 'image', { src: bild[2], caption: bild[1] }); return; }

      const m = z.match(/^(#{1,3})\s+(.*)$/);
      if (m) { Store.addBlock(p.id, ['h1','h2','h3'][m[1].length - 1], { text: m[2] }); return; }
      const todo = z.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
      if (todo) { Store.addBlock(p.id, 'todo', { text: todo[2], checked: todo[1].toLowerCase() === 'x' }); return; }
      if (/^[-*+]\s+/.test(z)) { Store.addBlock(p.id, 'bullet', { text: z.replace(/^[-*+]\s+/, '') }); return; }
      if (/^\d+\.\s+/.test(z)) { Store.addBlock(p.id, 'number', { text: z.replace(/^\d+\.\s+/, '') }); return; }
      if (/^>\s*💡\s*/.test(z)) { Store.addBlock(p.id, 'callout', { text: z.replace(/^>\s*💡\s*/, ''), icon: '💡' }); return; }
      if (/^>\s+/.test(z)) { Store.addBlock(p.id, 'quote', { text: z.replace(/^>\s+/, '') }); return; }
      if (/^\?\?\s+/.test(z)) { Store.addBlock(p.id, 'flashcard', { text: z.replace(/^\?\?\s+/, '') }); return; }
      Store.addBlock(p.id, 'text', { text: z });
    });
    if (imCode && codeText.length) Store.addBlock(p.id, 'code', { text: codeText.join('\n'), lang: codeLang });
    tabelleAbschliessen();   /* falls die Datei mit einer Tabelle endet */
  };

  /* --------------------------------------------------------------------------
   * DIE SCHREIBSTATISTIK — nur die Zahlen
   * --------------------------------------------------------------------------
   * Vorher stand diese Rechnung im ersten Drittel von `statistik()`, direkt
   * vor dem `document.createElement`. Getrennt, weil man die Zahlen prüfen
   * können soll, ohne ein Fenster zu öffnen: `woerter` und `saetze` sind
   * hier Anzahlen, nicht Listen — die Listen brauchte drüben niemand.
   * ----------------------------------------------------------------------- */
  const statistikZahlen = (p: any) => {
  const sammle = (id: string, tiefe = 0): string => {
    let t = '';
    Store.childrenOf(id).forEach((b: any) => { t += ' ' + (b.text || ''); t += sammle(b.id, tiefe + 1); });
    return t;
  };
  const text = ((p.text || '') + ' ' + sammle(p.id)).trim();
  const woerter = text.split(/\s+/).filter(Boolean);
  const saetze = text.split(/[.!?]+\s/).filter(x => x.trim().length > 1);
  const zeichen = text.length;
  const lesezeit = Math.max(1, Math.round(woerter.length / 200));
  const sprechzeit = Math.max(1, Math.round(woerter.length / 130));
  const blockAnzahl = (function zaehl(id: string): number {
    let n = 0; Store.childrenOf(id).forEach((b: any) => { n += 1 + zaehl(b.id); }); return n;
  })(p.id);

  const stop = new Set(('der die das und oder aber ich du er sie es wir ihr in im an auf für mit von zu ist sind ' +
    'war waren ein eine einen einem eines dem den des nicht auch als wie wenn dann noch nur schon so bei um am').split(' '));
  const haeufig: Record<string, number> = {};
  woerter.forEach((w: string) => {
    const k = w.toLowerCase().replace(/[^\wäöüß-]/g, '');
    if (k.length < 4 || stop.has(k)) return;
    haeufig[k] = (haeufig[k] || 0) + 1;
  });
  const top = Object.entries(haeufig).sort((a, b) => b[1] - a[1]).slice(0, 12);

  /* Ganzer Arbeitsbereich */
  const alleW = Object.values<any>(Store.cache.blocks)
    .filter(b => b.alive)
    .reduce((n: number, b) => n + (b.text || '').split(/\s+/).filter(Boolean).length, 0);

    return { woerter: woerter.length, zeichen, saetze: saetze.length,
             blockAnzahl, lesezeit, sprechzeit, top, alleW };
  };

  /* Zwei kleine Helfer: ein Dateiname ohne verbotene Zeichen, und die Frage,
     ob eine Seite unter einer anderen hängt (gegen Ringe beim Verschieben). */
  const sauber = (s: unknown): string => String(s).replace(/[\/\\:*?"<>|]/g, '-').slice(0, 80).trim() || 'Seite';

  const istUnter = (id: string, moeglicherElter: string): boolean => {
    let cur = Store.getBlock(id), n = 0;
    while (cur && n++ < 50) {
      if (cur.parentId === moeglicherElter) return true;
      cur = cur.parentId ? Store.getBlock(cur.parentId) : null;
    }
    return false;
  };

  return { esc, heute, WOCHENTAG, MONAT, datumLang, unscharf, zeitKurz, planen,
           alsMarkdown, ausMarkdown, statistikZahlen, sauber, istUnter };
})();

/* Nur, wenn es ein Fenster gibt. In Node gibt es keines — und genau das ist
   der Zweck dieser Datei. */
if (typeof window !== 'undefined') (window as any).WissenDienst = WissenDienst;
