/* src/editor/TextBlockEditor.tsx — ein Textblock unter ProseMirror (RM-7)
 * ----------------------------------------------------------------------------
 * Der erste echte ProseMirror-Einsatz: Verlauf (Strg Z), Auszeichnungen
 * (Strg B / Strg I), Absätze. Der Inhalt kommt aus einem echten Block des
 * Bestands — und geht NIRGENDWO hin: die neue Schicht schreibt den Bestand
 * nicht (E78, Regel 1), und dieses Feld sagt das gross und ehrlich dazu.
 * `beiAenderung` bekommt den Klartext, damit die Werkstatt-Seite zeigen
 * kann, was GESPEICHERT WÜRDE — Konjunktiv, mit Absicht.
 */
import { useEffect, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { textBlockSchema, textToDoc, docToText } from './textBlock';
import './editor.css';

export interface TextBlockEditorProps {
  text: string;
  beiAenderung?: (klartext: string) => void;
}

export function TextBlockEditor({ text, beiAenderung }: TextBlockEditorProps) {
  const halter = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!halter.current) return;
    const state = EditorState.create({
      doc: textToDoc(text),
      plugins: [
        history(),
        keymap({
          'Mod-z': undo, 'Mod-y': redo, 'Mod-Shift-z': redo,
          'Mod-b': toggleMark(textBlockSchema.marks.strong!),
          'Mod-i': toggleMark(textBlockSchema.marks.em!),
          'Mod-e': toggleMark(textBlockSchema.marks.code!)
        }),
        keymap(baseKeymap)
      ]
    });
    const v = new EditorView(halter.current, {
      state,
      dispatchTransaction(tr) {
        const neu = v.state.apply(tr);
        v.updateState(neu);
        if (tr.docChanged && beiAenderung) beiAenderung(docToText(neu.doc));
      }
    });
    view.current = v;
    return () => { v.destroy(); view.current = null; };
    /* Bewusst nur einmal je Text-Wechsel: der Editor IST der Zustand. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <div className="tbe" ref={halter} />;
}
