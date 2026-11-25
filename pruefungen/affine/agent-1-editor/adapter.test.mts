import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../../src/bereiche/editor/affine-adapter.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const api = runInNewContext(compiled + '\nRedionAffineEditor;', { structuredClone, JSON, Map, Set, Error }) as typeof RedionAffineEditor;
function fixture(): RedionAffineSnapshot {
  return { rootId: 'p', blocks: [
    { id: 'p', type: 'page', content: ['a', 'b'], custom: { keep: true } },
    { id: 'a', parentId: 'p', type: 'h1', text: 'Titel', content: ['c'] },
    { id: 'b', parentId: 'p', type: 'text', text: 'Text', dateiId: 'asset' },
    { id: 'c', parentId: 'a', type: 'todo', checked: true, text: 'Aufgabe' }
  ] };
}
test('Kennungen und unbekannte Felder bleiben erhalten', () => {
  const input = fixture();
  const output = api.validate(input);
  assert.equal(JSON.stringify(output), JSON.stringify(input));
  output.blocks[0]!.content!.pop();
  assert.equal(input.blocks[0]!.content!.length, 2);
});
test('Ungültige Bäume werden abgelehnt', () => {
  const input = fixture();
  input.blocks[0]!.content!.push('a');
  assert.throws(() => api.validate(input));
  const missing = fixture();
  missing.blocks.pop();
  assert.throws(() => api.validate(missing));
});
test('Gliederung folgt der Baumreihenfolge', () => {
  assert.equal(JSON.stringify(api.outline(fixture())), JSON.stringify([{ id: 'a', text: 'Titel', level: 1 }]));
});
test('Adapter delegiert Bearbeitung und Verlauf, schützt fremde IDs und Schreibschutz', () => {
  const data = fixture();
  let change = () => {};
  let notifications = 0, renders = 0, cleaned = 0, undo = 0, redo = 0, moves = 0;
  const adapter = api.create({
    read: () => data, open: () => {},
    render: () => { renders++; return () => { cleaned++; }; },
    subscribe: listener => { change = listener; return () => { change = () => {}; }; },
    updateText: (id, text) => { data.blocks.find(block => block.id === id)!.text = text; change(); },
    move: () => { moves++; }, undo: () => { undo++; }, redo: () => { redo++; }
  });
  adapter.loadDocument('p');
  adapter.mount({} as HTMLElement);
  adapter.onChange(() => { notifications++; });
  assert.throws(() => adapter.updateText('b', 'nein'));
  adapter.readonly(false);
  adapter.updateText('b', '**Neu**');
  assert.equal(notifications, 1);
  assert.equal(adapter.parseJSON(adapter.exportJSON()).blocks[2]!.text, '**Neu**');
  assert.throws(() => adapter.move('a', 'c'));
  assert.throws(() => adapter.updateText('fremd', 'nein'));
  adapter.move('a', 'b', true);
  adapter.undo(); adapter.redo();
  assert.equal(moves, 1); assert.equal(undo, 1); assert.equal(redo, 1);
  adapter.unmount();
  assert.equal(renders, cleaned);
  assert.throws(() => adapter.serializeDocument());
});
