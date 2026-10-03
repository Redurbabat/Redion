/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/core/slides/folien.ts (npm run bauen:ts). */
/* ============================================================================
 * core/slides/folien.ts — wo eine Folie anfängt und was darauf steht
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/core/slides/folien.ts`. `npm run bauen:ts` schreibt
 * daraus `quell/core/slides/folien.js`.
 * ----------------------------------------------------------------------------
 * REIN: kennt weder DOM noch Ablage. Die Kinder eines Blocks kommen als
 * Funktion herein, die Zeit gar nicht vor. Damit lässt sich die Regel prüfen,
 * ohne einen Browser zu starten — und, wichtiger, sie steht nur EINMAL da.
 *
 * Vorher lag sie im Vortragsmodus (`wissen/werkzeuge.ts`, `praesentation`)
 * und wäre für jede zweite Ausgabe abgeschrieben worden. Zwei Teilungen, die
 * auseinanderlaufen, sind schlimmer als eine, die man an einer Stelle ändert:
 * der Vortrag zeigte dann etwas anderes als die abgegebene Datei, und
 * gemerkt hätte man es in der Schule.
 * ==========================================================================*/

const Folien = (() => {
  type Block = { id: string; type: string; text?: string; [k: string]: any };
  type Eintrag = { block: Block; tiefe: number };
  type Folie = { titel: string; eintraege: Eintrag[] };
  type Zeile = { text: string; tiefe: number; art: string };

  /** Eine neue Folie beginnt hier — wie in HedgeDoc und Marp. */
  const TRENNT = ['divider', 'h1', 'h2'];

  /** Diese zeichnen ihren Inhalt selbst; wer hier absteigt, hat ihn zweimal. */
  const EIGENE_KINDER = ['columns', 'columns3', 'blatt'];

  /**
   * Diese füllen eine Folie ALLEIN — zwei davon teilen sie sich nie (E544).
   *
   * Ein Blatt und eine PDF-Seite sind eine ganze Seite Papier. Zwei davon
   * untereinander auf einer Folie ergibt eine Spalte, die unten aus dem Bild
   * läuft, und keine Präsentation.
   *
   * Gefunden am .pptx-Einleser: der legt pro PowerPoint-Folie EINEN
   * `blatt`-Block als direktes Kind der Seite, ohne Trenner dazwischen.
   * Gemessen an drei Folien gab `teilen` **eine** zurück; Redurs echte Datei
   * hat 27. Der ganze Vortrag war eine endlose Spalte, und niemand hätte es
   * im Code gesehen — nur auf dem Bild (`bilder/l153-vorher.png`, §55).
   *
   * NUR AUF DER OBERSTEN EBENE. In Spalten gehören ein Blatt und eine
   * PDF-Seite ausdrücklich NEBENeinander auf dieselbe Folie — der Fall aus
   * `test183`, und dort ist es genau richtig so.
   */
  const EIGENE_FOLIE = ['blatt', 'pdfseite'];

  /** Und diese tragen ihre Kinder als eingerückte Zeilen. */
  const MIT_KINDERN = ['bullet', 'number', 'todo', 'toggle'];

  /**
   * Eine Seite in Folien teilen.
   *
   * @param wurzel     Der Seitenblock. Sein Text ist der Titel der ersten Folie.
   * @param kinderVon  Liefert die Kinder eines Blocks in Reihenfolge.
   */
  const teilen = (wurzel: Block, kinderVon: (id: string) => Block[]): Folie[] => {
    if (!wurzel || !wurzel.id) return [];
    const raus: Folie[] = [];
    let aktuell: Folie = { titel: String(wurzel.text || ''), eintraege: [] };
    const gesehen = new Set<string>();

    const sammle = (id: string, tiefe: number): void => {
      /* Eine Schranke gegen einen Bestand, der im Kreis zeigt. Sie ist
         hier billig und rettet den ganzen Vortrag; ohne sie hinge der
         Browser, und niemand wüsste warum (dieselbe Vorsicht wie in
         `verweise.ts:seiteVon`). */
      if (tiefe > 12 || gesehen.has(id)) return;
      gesehen.add(id);
      for (const b of kinderVon(id) || []) {
        if (!b || !b.type) continue;
        if (TRENNT.includes(b.type)) {
          /* Eine leere erste Folie entsteht, wenn die Seite mit einer
             Überschrift beginnt. Sie wäre eine Titelfolie ohne Inhalt und
             gehört weg — aber nur GANZ am Anfang. */
          const leerAmAnfang = !aktuell.eintraege.length && !raus.length &&
            aktuell.titel === String(wurzel.text || '');
          if (!leerAmAnfang) raus.push(aktuell);
          aktuell = { titel: b.type === 'divider' ? '' : String(b.text || ''),
                      eintraege: [] };
          continue;
        }
        if (tiefe === 0 && EIGENE_FOLIE.includes(b.type)) {
          /* Was bis hierher gesammelt wurde, ist fertig — ausser es ist die
             leere Auftaktfolie, die es gar nicht geben soll. */
          const leerAmAnfang = !aktuell.eintraege.length && !raus.length &&
            aktuell.titel === String(wurzel.text || '');
          /* UND NICHTS LEERES DAZWISCHEN. Nach dem ersten Blatt ist `aktuell`
             titellos und leer; ohne diese Prüfung stünde zwischen je zwei
             Folien eine schwarze. Gemessen: aus drei Blättern wurden fünf
             Folien, jede zweite leer. Ein Titel ohne Inhalt bleibt dagegen —
             eine Überschrift vor einem Blatt ist eine Zwischenfolie und
             gewollt. */
          const leer = !aktuell.eintraege.length && !aktuell.titel;
          if (!leerAmAnfang && !leer) raus.push(aktuell);
          /* OHNE TITEL: das Blatt trägt seine Überschrift selbst, als Marke
             oder als Text darauf. Ein `<h1>` darüber schriebe sie ein
             zweites Mal hin und nähme dem Blatt die halbe Höhe. */
          raus.push({ titel: '', eintraege: [{ block: b, tiefe }] });
          aktuell = { titel: '', eintraege: [] };
          continue;
        }
        aktuell.eintraege.push({ block: b, tiefe });
        if (EIGENE_KINDER.includes(b.type)) continue;
        if (MIT_KINDERN.includes(b.type)) sammle(b.id, tiefe + 1);
      }
    };

    sammle(wurzel.id, 0);
    /* Eine LEERE Folie am Ende ist nie gewollt. Sie entsteht, sobald eine
       Seite mit einem Trenner oder einem Blatt aufhört — bei einer
       eingelesenen Präsentation also IMMER, und der Vortrag endete auf einem
       schwarzen Bild. Die letzte Folie kommt nur mit, wenn etwas darauf steht. */
    if (aktuell.eintraege.length || aktuell.titel) raus.push(aktuell);
    /* Aber eine Seite ohne alles ergibt weiterhin genau eine Folie: der
       Vortrag liest `folien[0]` und zeigt darauf „Nichts zu zeigen". Ohne
       diese Zeile liefe er an `undefined`. */
    if (!raus.length) raus.push(aktuell);
    return raus;
  };

  /** Auszeichnung weg — PowerPoint bekommt Text, keine Sterne. */
  const ohneMarkierung = (t: unknown): string => String(t ?? '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*~]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  /**
   * Eine Folie als flache Textzeilen — für PPTX und für ein Handout.
   *
   * Was KEIN Text ist, wird benannt statt weggelassen: ein Bild als
   * „[Bild]", eine Tabelle mit ihrer Zeilenzahl. Eine Folie, auf der
   * schweigend die Hälfte fehlt, ist die schlimmere Ausgabe — man merkt es
   * erst beim Vortrag.
   */
  const alsZeilen = (folie: Folie, kinderVon: (id: string) => Block[]): Zeile[] => {
    const raus: Zeile[] = [];
    const nimm = (text: string, tiefe: number, art: string): void => {
      const t = ohneMarkierung(text);
      if (t) raus.push({ text: t, tiefe: Math.max(0, Math.min(8, tiefe)), art });
    };

    const eins = ({ block: b, tiefe }: Eintrag): void => {
      switch (b.type) {
        case 'h3': case 'h4':      nimm(b.text || '', tiefe, 'kopf'); return;
        case 'bullet':             nimm('• ' + (b.text || ''), tiefe, 'punkt'); return;
        case 'number':             nimm(b.text || '', tiefe, 'nummer'); return;
        case 'todo':               nimm((b.checked ? '☑ ' : '☐ ') + (b.text || ''),
                                        tiefe, 'aufgabe'); return;
        case 'quote':              nimm('„' + (b.text || '') + '"', tiefe, 'zitat'); return;
        case 'code':               nimm(b.text || '', tiefe, 'code'); return;
        case 'callout':            nimm((b.icon || '💡') + ' ' + (b.text || ''),
                                        tiefe, 'hinweis'); return;
        case 'equation':           nimm(b.text || '', tiefe, 'formel'); return;
        case 'image':              nimm('[Bild' + (b.text ? ': ' + b.text : '') + ']',
                                        tiefe, 'bild'); return;
        case 'pdfseite':           nimm('[PDF-Seite ' + (Number(b.nr) || 1) + ']',
                                        tiefe, 'bild'); return;
        case 'blatt':              nimm('[A4-Blatt]', tiefe, 'bild'); return;
        case 'file':               nimm('[Datei: ' + (b.text || 'ohne Namen') + ']',
                                        tiefe, 'datei'); return;
        case 'table': {
          const zeilen = (kinderVon(b.id) || []).length;
          nimm('[Tabelle' + (zeilen ? ', ' + zeilen + ' Zeilen' : '') + ']', tiefe, 'tabelle');
          return;
        }
        case 'database':           nimm('[Datenbank' + (b.text ? ': ' + b.text : '') + ']',
                                        tiefe, 'tabelle'); return;
        case 'columns': case 'columns3': {
          /* SPALTEN WERDEN FLACH. Eine Folie ist breit und flach; zwei
             Textsäulen nebeneinander gehen in PowerPoint nur mit zwei
             Formen, und dann stimmt die Reihenfolge beim Vorlesen nicht
             mehr. Untereinander ist ehrlicher als eine halbe Spalte. */
          for (const sp of kinderVon(b.id) || []) {
            const inhalt = sp.type === 'spalte' ? (kinderVon(sp.id) || []) : [sp];
            for (const k of inhalt) eins({ block: k, tiefe: tiefe + 1 });
          }
          return;
        }
        default:                   nimm(b.text || '', tiefe, 'text');
      }
    };

    folie.eintraege.forEach(eins);
    return raus;
  };

  return { teilen, alsZeilen, ohneMarkierung, TRENNT, EIGENE_KINDER, EIGENE_FOLIE, MIT_KINDERN };
})();

(window as any).Folien = Folien;
