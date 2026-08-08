/* src/editor/textBlock.ts — das ProseMirror-Modell EINES Textblocks (RM-7)
 * ----------------------------------------------------------------------------
 * Die Entscheidung aus dem Architektur-Text, wörtlich übernommen:
 * ProseMirror wird NICHT Redions Datenstruktur. Ein Textblock hält ein
 * PM-Dokument; Seiten, Datenbanken und der Blockbaum bleiben Redions
 * eigene Entitäten. Deshalb ist dieses Schema bewusst KLEIN — ein Absatz
 * mit Auszeichnungen, nicht „ein Dokument mit allem":
 *
 *   doc → paragraph+ → text mit strong / em / code
 *
 * Was ein eigener Block ist (Überschrift, Aufgabe, Zitat, Codeblock),
 * BLEIBT ein eigener Redion-Block. Die Grenze ist die gleiche wie im
 * Bestand — sonst wanderte die Blocklogik heimlich ins Editor-Dokument,
 * und genau davor warnt der Text („nicht alles zu einem einzigen
 * Editor-Dokument machen").
 */
import { Schema, Node as PmNode } from 'prosemirror-model';

export const textBlockSchema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'text*', toDOM: () => ['p', 0], parseDOM: [{ tag: 'p' }] },
    text: {}
  },
  marks: {
    strong: { toDOM: () => ['strong', 0], parseDOM: [{ tag: 'strong' }, { tag: 'b' }] },
    em:     { toDOM: () => ['em', 0],     parseDOM: [{ tag: 'em' }, { tag: 'i' }] },
    code:   { toDOM: () => ['code', 0],   parseDOM: [{ tag: 'code' }] }
  }
});

/**
 * Aus dem gespeicherten Blocktext ein PM-Dokument. Der Bestand hält
 * `text` als schlichten String (mit \n als Absatztrenner im Editor) —
 * diese Lesart bleibt, bis eine RM-Phase das Speicherformat je ÄNDERT,
 * und das wäre eine eigene Entscheidung mit Migration, keine Nebenwirkung.
 */
export const textToDoc = (text: string): PmNode => {
  const absaetze = String(text ?? '').split('\n').map((zeile) =>
    textBlockSchema.node('paragraph', null,
      zeile.length ? [textBlockSchema.text(zeile)] : []));
  return textBlockSchema.node('doc', null,
    absaetze.length ? absaetze : [textBlockSchema.node('paragraph')]);
};

/** Zurück zum gespeicherten Format: Absätze mit \n, Auszeichnungen gehen
 *  verloren — EHRLICH verloren, denn das gespeicherte Format kennt sie
 *  (noch) nicht. Wer sie speichern will, braucht die Formatentscheidung. */
export const docToText = (doc: PmNode): string => {
  const zeilen: string[] = [];
  doc.forEach((absatz) => { zeilen.push(absatz.textContent); });
  return zeilen.join('\n');
};
