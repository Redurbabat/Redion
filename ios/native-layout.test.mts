import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IOS_LAYOUT_CSS, IOS_LAYOUT_STYLE_ID, installIosNativeLayout } from './native-layout.mts';

type TestStyle = {
  id: string;
  textContent: string;
  attrs: Record<string, string>;
  setAttribute(name: string, value: string): void;
  remove(): void;
};
function harness() {
  const nodes: TestStyle[] = [];
  const doc = {
    head: { appendChild(node: TestStyle) { nodes.push(node); } },
    createElement(tag: string): TestStyle {
      assert.equal(tag, 'style');
      return { id: '', textContent: '', attrs: {} as Record<string, string>,
        setAttribute(name: string, value: string) { this.attrs[name] = value; },
        remove() { const i=nodes.indexOf(this); if(i>=0)nodes.splice(i,1); }
      };
    },
    getElementById(id: string) { return nodes.find(n => n.id === id) || null; }
  };
  return { doc, nodes };
}
test('Native CSS wird genau einmal eingefuegt und entfernt', () => {
  const {doc,nodes}=harness();
  const stop=installIosNativeLayout(doc);
  const second=installIosNativeLayout(doc);
  assert.equal(nodes.length,1);
  assert.equal(nodes[0].id,IOS_LAYOUT_STYLE_ID);
  assert.equal(nodes[0].attrs['data-redion-native'],'layout');
  assert.equal(nodes[0].textContent,IOS_LAYOUT_CSS);
  second();assert.equal(nodes.length,1);
  stop();assert.equal(nodes.length,0);
  assert.equal(typeof installIosNativeLayout({}), 'function');
});
test('Nur Telefon; bestehendes Dock und alle Aktionen bleiben unangetastet', () => {
  assert.match(IOS_LAYOUT_CSS,/max-width:760px/);
  assert.match(IOS_LAYOUT_CSS,/pointer:coarse/);
  assert.doesNotMatch(IOS_LAYOUT_CSS,/#handy-oben|#ho-ziele|#ho-pille/);
  assert.doesNotMatch(IOS_LAYOUT_CSS,/display\s*:\s*none/i);
  assert.doesNotMatch(IOS_LAYOUT_CSS,/position\s*:\s*fixed/i);
  assert.equal((IOS_LAYOUT_CSS.match(/\{/g)||[]).length,(IOS_LAYOUT_CSS.match(/\}/g)||[]).length);
});
test('Notch nur einmal reserviert und Fingerziele mindestens 44px', () => {
  assert.match(IOS_LAYOUT_CSS,/#main\s*>\s*#topbar\s*\{[^}]*padding-top:0/s);
  assert.match(IOS_LAYOUT_CSS,/#topbar\s+\.top-btn\s*\{[^}]*min-height:44px/s);
  assert.match(IOS_LAYOUT_CSS,/scroll-padding-block-end:calc\(var\(--hunten/);
});
test('Dokumente, Lernen, Termine, Mehr sind an vorhandene Elemente gebunden', () => {
  for (const selector of [
    '.bib[data-bib-bereich]', '.bib-workspace-actions',
    '.lernwelt .lw-next-step', '.lernwelt .lw-desk',
    '.home-karten', '.home-liste', '.einst-nav', '.menu.blatt'
  ]) assert.ok(IOS_LAYOUT_CSS.includes(selector),'Selector fehlt: '+selector);
  assert.match(IOS_LAYOUT_CSS,/\.lernwelt\s+\.lw-paper-stack\s*\{/);
});
test('Native Bruecke aktiviert die Korrektur, Web-App nicht', () => {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const native=fs.readFileSync(path.join(root,'ios/native-sicherung.ts'),'utf8');
  const web=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.match(native,/from '\.\/native-layout\.mts'/);
  assert.match(native,/installIosNativeLayout\(document\)/);
  assert.match(native,/Capacitor\.getPlatform\(\) === 'ios'/);
  assert.doesNotMatch(web,/native-layout\.mts|redion-ios-layout-fixes/);
});
