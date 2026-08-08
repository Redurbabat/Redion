/* tests/textBlock.test.ts — der Kreis Text → Dokument → Text (RM-7)
 * ----------------------------------------------------------------------------
 * Solange das Speicherformat schlichter Text ist, muss der Kreis verlustfrei
 * sein — sonst veränderte schon das ÖFFNEN des Editors den Inhalt, der
 * gespeichert würde.
 */
import { describe, it, expect } from 'vitest';
import { textToDoc, docToText } from '../src/editor/textBlock';

describe('textToDoc / docToText', () => {
  it('der Kreis ist verlustfrei — auch mit Absätzen', () => {
    for (const t of ['', 'Eine Zeile', 'Zwei\nZeilen', 'a\n\nb', '  Rand  '])
      expect(docToText(textToDoc(t))).toBe(t);
  });

  it('spitze Klammern bleiben Text — das Dokument kennt kein HTML', () => {
    const rund = docToText(textToDoc('<b>hallo</b>'));
    expect(rund).toBe('<b>hallo</b>');
  });

  it('jede Zeile wird ein Absatz', () => {
    const doc = textToDoc('eins\nzwei\ndrei');
    expect(doc.childCount).toBe(3);
  });
});
