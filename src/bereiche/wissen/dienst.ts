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
   * Datenbanken, Zeichenflächen, Diagramme und Tabellen bleiben unangetastet:
   * sie stehen als Platzhalter im Text und werden beim Zurücklesen an
   * derselben Stelle wieder eingehängt. Ohne das wäre „Quelltext ansehen und
   * schliessen" ein Datenverlust.
   * ----------------------------------------------------------------------- */
  const alsMarkdown = (p: any): string => {
    const zeilen: string[] = [];
    const raus = (id: string, tiefe: number): void => {
      Store.childrenOf(id).forEach((b: any) => {
        const ein = '  '.repeat(tiefe);
        if (b.type === 'database') { zeilen.push(`<!--db:${b.id}-->`); return; }
        if (b.type === 'whiteboard') { zeilen.push(`<!--wb:${b.id}-->`); return; }
        if (b.type === 'chart') { zeilen.push(`<!--chart:${b.id}-->`); return; }
        if (b.type === 'table') { zeilen.push(`<!--tab:${b.id}-->`); return; }
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
    const alteDbs: Record<string, any> = {};
    Store.childrenOf(p.id).forEach((b: any) => {
      if (['database','whiteboard','chart','table'].includes(b.type)) alteDbs[b.id] = Store.baum(b.id);
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

      const platz = roh.trim().match(/^<!--(?:db|wb|chart|tab):([^>]+)-->$/);
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
