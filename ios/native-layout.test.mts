import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IOS_LAYOUT_CSS, IOS_PHONE_POLISH_CSS, IOS_LAYOUT_STYLE_ID, installIosNativeLayout, installIosSearchControls } from './native-layout.mts';

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
  assert.equal(nodes[0]!.id,IOS_LAYOUT_STYLE_ID);
  assert.equal(nodes[0]!.attrs['data-redion-native'],'layout');
  assert.equal(nodes[0]!.textContent,IOS_LAYOUT_CSS + IOS_PHONE_POLISH_CSS);
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

test('iPhone Today and search density preserve touch targets and readable text', () => {
  assert.match(IOS_LAYOUT_CSS,/\.lw-today \.lw-hero-compact \{[^}]*min-height:0/);
  assert.match(IOS_LAYOUT_CSS,/\.lw-today \.lw-actions button \{[^}]*min-height:44px/);
  assert.match(IOS_LAYOUT_CSS,/\.overlay \.finder\.such :is\(input,textarea\) \{font-size:16px/);
});

test('iPhone polish targets premium specificity without touching the dock or documents', () => {
  assert.match(IOS_PHONE_POLISH_CSS,/max-width:760px/);
  assert.match(IOS_PHONE_POLISH_CSS,/body\[data-schale="premium"\]/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.lw-today \.lw-hero-compact h2/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.redion-ios-search-close/);
  assert.match(IOS_PHONE_POLISH_CSS,/min-height:44px/);
  assert.doesNotMatch(IOS_PHONE_POLISH_CSS,/#handy-oben|#ho-pille|#ho-ziele/);
});

test('native search close control uses existing Escape route and is installed once', () => {
  let callback: (() => void) | undefined;
  let disconnected = false;
  const events: Array<{key:string}> = [];
  const attrs: Record<string,string> = {};
  const headings: any[] = [];
  const input = {
    setAttribute(name:string,value:string) { attrs[name]=value; },
    dispatchEvent(event:{key:string}) { events.push(event); }
  };
  const finder = {
    firstChild:input,
    querySelector(selector:string) {
      return selector === '#q' ? input : headings[0] || null;
    },
    insertBefore(heading:any) { headings.push(heading); }
  };
  const doc = {
    body:{},
    defaultView:{
      matchMedia:()=>({matches:true}),
      MutationObserver:class {
        constructor(fn:()=>void) { callback=fn; }
        observe() {}
        disconnect() { disconnected=true; }
      },
      KeyboardEvent:class {
        key:string;
        constructor(_type:string,options:{key:string}) { this.key=options.key; }
      }
    },
    querySelectorAll(selector:string) {
      return selector === '.overlay .finder.such' ? [finder] : [...headings];
    },
    createElement() {
      return {
        children:[] as any[],
        textContent:'',
        click:undefined as (()=>void)|undefined,
        setAttribute() {},
        append(...children:any[]) { this.children.push(...children); },
        addEventListener(_event:string, fn:()=>void) { this.click=fn; },
        remove() { const i=headings.indexOf(this); if(i>=0)headings.splice(i,1); }
      };
    }
  };
  const stop=installIosSearchControls(doc);
  assert.equal(headings.length,1);
  callback?.();
  assert.equal(headings.length,1);
  assert.equal(headings[0].children[0].textContent,'Suchen');
  assert.equal(headings[0].children[1].textContent,'Fertig');
  assert.equal(attrs.enterkeyhint,'search');
  headings[0].children[1].click();
  assert.equal(events.length,1);
  assert.equal(events[0]?.key,'Escape');
  stop();
  assert.equal(disconnected,true);
  assert.equal(headings.length,0);
});

test('iPhone document library keeps visible actions, flexible columns and 44pt targets', () => {
  assert.match(IOS_PHONE_POLISH_CSS,/\.bib\[data-bib-bereich\] \.bib-workspace-actions > button \{[^}]*min-height:44px/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.bib\[data-bib-bereich\] \.bib-gitter \{[^}]*grid-template-columns:repeat\(auto-fit/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.bib\[data-bib-bereich\] \.bib-deckel-mehr \{[^}]*min-width:44px/);
});

test('iPhone settings and menus respect the real keyboard viewport and keep existing switches', () => {
  assert.match(IOS_PHONE_POLISH_CSS,/\.einst-fenster \{[^}]*max-height:var\(--visual-height,100dvh\)/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.einst-fenster \.einst-nav button \{[^}]*min-height:48px/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.ez-steuer button:not\(\.schalter\) \{[^}]*min-height:44px/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.menu\.blatt \{[^}]*max-height:calc\(var\(--visual-height,100dvh\) - 16px\)/);
  assert.match(IOS_PHONE_POLISH_CSS,/\.overlay \.finder\.such \{[^}]*max-height:calc\(var\(--visual-height,100dvh\) - 16px\)/);
});
