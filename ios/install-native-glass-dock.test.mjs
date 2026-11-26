import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { injectNativeGlassDock } from './install-native-glass-dock.mjs';

const swift = fs.readFileSync(new URL('./native-glass-dock.swift', import.meta.url), 'utf8');
const installer = fs.readFileSync(new URL('./install-native-glass-dock.mjs', import.meta.url), 'utf8');
const original = [
  'import UIKit',
  'func application(_ application: UIApplication) -> Bool {',
  '    RedionPrivacyShield.start()',
  '    return true',
  '}',
  'private final class RedionPrivacyShield: NSObject {}'
].join('\n');

test('nur die echte UITabBar in generierte Capacitor AppDelegate einbauen', () => {
  const result = injectNativeGlassDock(original, swift);
  assert.match(result, /RedionPrivacyShield\.start\(\)\n\s*\/\/ REDION_IOS_NATIVE_GLASS_DOCK\n\s*RedionNativeDock\.start\(\)/);
  assert.match(result, /UITabBar\(frame: \.zero\)/);
  assert.match(result, /WKScriptMessageHandler/);
  assert.throws(() => injectNativeGlassDock(result, swift), /bereits eingebaut/);
});

test('bei unpassender Vorlage fail-closed, keine zweite Installation', () => {
  assert.throws(() => injectNativeGlassDock('import UIKit', swift), /fehlt/);
  assert.throws(() => injectNativeGlassDock(original + '\nRedionPrivacyShield.start()', swift), /nicht eindeutig/);
  assert.throws(() => injectNativeGlassDock(original, 'import SwiftUI'), /fehlt/);
});

test('vier Apple Navigations-Items leiten zur bestehenden Redion Navigation weiter', () => {
  for (const label of ['Dokumente','Heute','Lernen','Mehr']) {
    assert.ok(swift.includes('"' + label + '"'));
  }
  assert.match(swift, /UITabBarItem\(title:/);
  assert.match(swift, /UIImage\(systemName:/);
  assert.match(swift, /__redionNativeDockSelect/);
  assert.match(swift, /b\.click\(\)/);
  assert.match(swift, /__redionNativeDockTargets/);
  assert.match(swift, /UISelectionFeedbackGenerator/);
});

test('keine SwiftUI Seiten oder zweiter Editor ueber der WebView', () => {
  assert.doesNotMatch(swift, /RedionNativeMoreCoordinator|RedionNativeLibraryCoordinator|UIHostingController|RedionNativeEditorModel/);
  assert.doesNotMatch(installer, /native-more\.swift|native-library\.swift|native-editor\.swift|injectNativeIosShell/);
  assert.match(installer, /const modified = injectNativeGlassDock\(delegate, source\)/);
  assert.doesNotMatch(swift, /(?:localStorage|indexedDB|deleteDatabase|removeItem)/);
  assert.doesNotMatch(swift, /glassEffect\(/);
});

test('nur das alte Web Dock unsichtbar, keine doppelten Tab-Bars', () => {
  assert.match(swift, /redion-native-only-tabbar-style/);
  assert.match(swift, /html\.redion-ios-native-dock #handy-oben \*/);
  assert.match(swift, /visibility:hidden!important;opacity:0!important/);
  assert.match(swift, /pointer-events:none!important/);
  assert.match(swift, /legacyBar\?\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(swift, /document\.documentElement\.classList\.add\('redion-ios-native-dock'\)/);
  assert.doesNotMatch(swift, /legacyBar\?\.remove\(/);
  assert.doesNotMatch(swift, /display:none!important/);
});

test('Tab-Bar wird bei Tastatur, Modal oder Sperrschirm verborgen', () => {
  assert.match(swift, /const locked = !!document\.getElementById\('sperrschirm'\)/);
  assert.match(swift, /visible: dockShown && !modal && !locked && !editing && !keyboard/);
  assert.match(swift, /bar\.isHidden = !visible/);
});

test('UIKit entscheidet ueber originales Systemmaterial', () => {
  assert.match(swift, /let bar = UITabBar\(frame: \.zero\)/);
  assert.doesNotMatch(swift, /UITabBarAppearance\(/);
  assert.doesNotMatch(swift, /UIBlurEffect|UIVisualEffectView|glassEffect/);
  const app = fs.readFileSync(new URL('./native-sicherung.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /native-glass-dock\.swift/);
});

test('vier Ziele und Suchkapsel im aelteren iOS-Fallback', () => {
  assert.match(swift, /let search = UIButton\(type: \.system\)/);
  assert.match(swift, /if #available\(iOS 26\.0, \*\)[\s\S]*?configuration = \.glass\(\)/);
  assert.match(swift, /configuration = \.gray\(\)/);
  assert.match(swift, /bar\.trailingAnchor\.constraint\(equalTo: search\.leadingAnchor/);
  assert.match(swift, /search\.widthAnchor\.constraint\(equalToConstant: 52\)/);
  assert.match(swift, /search\.accessibilityLabel = "Suchen"/);
  assert.match(swift, /__redionNativeDockSearch/);
  assert.match(swift, /getElementById\('btn-suche-handy'\)/);
  assert.match(swift, /searchButton\?\.isHidden = !visible/);
  assert.match(swift, /!keyboard && !drawing/);
  assert.match(swift, /\.document-studio, \.pg-flaeche, \.sp-voll/);
});


test('native Heute-first order routes and synchronizes by stable ID, not web order', () => {
  assert.match(swift, /private let labels = \["Heute", "Dokumente", "Lernen", "Mehr"\]/);
  assert.match(swift, /private let symbols = \["house", "book.closed", "graduationcap", "ellipsis"\]/);
  const bridge = swift.match(/private static let bridgeJavaScript = #"""([\s\S]*?)"""#/)[1];
  const domOrder = ['hl-dok', 'hl-start', 'hl-lernen', 'hl-bespr', 'hl-mehr'];
  const nativeOrder = ['hl-start', 'hl-dok', 'hl-lernen', 'hl-mehr'];
  const actions = [], messages = [], frames = [];
  let selected = 'hl-start', finderOpen = false;
  const bar = { getClientRects: () => [1], getAttribute: () => null, setAttribute() {} };
  const buttons = new Map(domOrder.map(id => [id, {
    parentElement: bar,
    getAttribute: name => name === 'aria-selected' && id === selected ? 'true' : 'false',
    click() { selected = id; actions.push(['select', id]); },
    dispatchEvent(event) { actions.push([event.key, id]); }
  }]));
  const root = { dataset: { theme: 'dark' }, classList: { add() {} }, appendChild() {} };
  const document = {
    documentElement: root, head: root, body: {}, activeElement: null,
    createElement: () => ({}), addEventListener() {},
    getElementById: id => id === 'handy-oben' ? bar : id === 'btn-suche-handy' ? { click() { actions.push(['search']); } } : buttons.get(id) ?? null,
    querySelector: selector => selector === '.finder.such' && finderOpen ? { getClientRects: () => [1] } : buttons.get(selector.split('#').pop()) ?? null,
    querySelectorAll: selector => selector.includes('button[role="tab"]') ? [...buttons.values()] : []
  };
  const window = { innerHeight: 800, webkit: { messageHandlers: {
    redionDock: { postMessage: message => messages.push(message) }
  } } };
  vm.runInNewContext(bridge, {
    document, window, getComputedStyle: () => ({display: 'flex', visibility: 'visible'}),
    MutationObserver: class { observe() {} },
    KeyboardEvent: class { constructor(type, options) { this.key = options.key; } },
    requestAnimationFrame: cb => frames.push(cb)
  });
  const flush = () => { while (frames.length) frames.shift()(); };
  flush();
  assert.equal(messages.at(-1).selected, 0);
  nativeOrder.forEach((id, index) => {
    window.__redionNativeDockSelect(index); flush();
    assert.deepEqual(actions.at(-1), ['select', id]);
    assert.equal(messages.at(-1).selected, index);
    window.__redionNativeDockTargets(index);
    assert.deepEqual(actions.at(-1), ['ArrowUp', id]);
  });
  window.__redionNativeDockSearch(); flush();
  assert.deepEqual(actions.at(-1), ['search']);
  assert.equal(messages.at(-1).selected, 3);
  selected = 'hl-bespr';
  window.__redionNativeDockSync(); flush();
  assert.equal(messages.at(-1).selected, 3);
  selected = 'hl-dok';
  window.__redionNativeDockSync(); flush();
  assert.equal(messages.at(-1).selected, 1);
  const count = messages.length;
  window.__redionNativeDockSync(); flush();
  assert.equal(messages.length, count, 'unchanged DOM does not flood Swift');
  window.__redionNativeDockSync(true); flush();
  assert.equal(messages.length, count + 1, 'resume can force fresh state');
  finderOpen = true;
  window.__redionNativeDockSync(); flush();
  assert.equal(messages.at(-1).visible, false);
  finderOpen = false;
  window.__redionNativeDockSync(); flush();
  assert.equal(messages.at(-1).visible, true);
});

test('iOS 26 uses three primary tabs, Mehr and system search without overflow', () => {
  assert.match(swift, /if #available\(iOS 26\.0, \*\) \{\s*if nativeController == nil \{ installSystemController/);
  assert.match(swift, /\} else if systemBar == nil \{/);
  assert.match(swift, /let controller = UITabBarController\(\)/);
  assert.doesNotMatch(swift, /prominentTabIdentifier|installNativeSearchButton/);
  assert.match(swift, /let search = UISearchTab/);
  assert.match(swift, /search\.automaticallyActivatesSearch = false/);
  assert.match(swift, /controller\.tabs = tabs \+ \[search\]/);
  assert.match(swift, /if tab is UISearchTab \{[\s\S]*?openSearch\(\)[\s\S]*?return false/);
  assert.match(swift, /@available\(iOS 18\.0, \*\)\s+func tabBarController\([^\n]+shouldSelectTab/);
  assert.match(swift, /@available\(iOS 18\.0, \*\)\s+func tabBarController\([^\n]+didSelectTab/);
  assert.match(swift, /controller\.setTabBarHidden\(!visible, animated: false\)/);
  assert.match(swift, /window\.rootViewController = controller/);
  assert.match(swift, /host\.addChild\(content\)/);
  assert.match(swift, /content\.removeFromParent\(\)/);
  assert.match(swift, /guard !applyingWebSelection/);
  assert.match(swift, /return tabBarController\.tabs\.contains/);
  for (const path of ['native-documents.swift', 'install-home-shortcuts.mjs', 'install-incoming-share-widget.mjs']) {
    const source = fs.readFileSync(new URL('./' + path, import.meta.url), 'utf8');
    assert.match(source, /redionBridgeWebView\(in: window\)/);
  }
});

test('Termine remains reachable under Mehr in native iOS without changing web navigation', () => {
  for (const path of ['../src/bereiche/datenbanken/ansichten/dienst.ts', '../quell/bereiche/datenbanken/ansichten/dienst.js']) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /classList\.contains\('redion-ios-native-dock'\) \? \[\{[^\n]+t: 'Termine'/);
    assert.match(source, /a === 'termine'\)[\s\S]*?getElementById\('hl-bespr'\)\?\.click\(\)/);
  }
});

test('iPhone keyboard, repeated tab and resume are coordinated natively', () => {
  assert.match(swift, /UIResponder\.keyboardWillShowNotification/);
  assert.match(swift, /UIResponder\.keyboardWillHideNotification/);
  assert.match(swift, /let visible = webDockVisible && !keyboardVisible/);
  assert.match(swift, /self\.updateDockVisibility\(\)/);
  assert.match(swift, /NSLayoutConstraint\.deactivate\(contentConstraints\)/);
  assert.match(swift, /tabBarController\.selectedTab\?\.identifier == tab\.identifier/);
  assert.match(swift, /webView\.evaluateJavaScript\(Self\.bridgeJavaScript/);
});

test('iPhone library presents a native action sheet while keeping Redion action handlers', () => {
  const menu = fs.readFileSync(new URL('./native-library-actions.swift', import.meta.url), 'utf8');
  assert.match(installer,/RedionNativeLibraryActions\.start\(\)/);
  assert.match(menu,/WKScriptMessageHandlerWithReply/);
  assert.match(menu,/preferredStyle: \.actionSheet/);
  assert.match(menu,/message\.frameInfo\.isMainFrame/);
  assert.match(menu,/buttons\[selected\]\.click\(\)/);
  assert.match(menu,/if \(!event\.isTrusted/);
  assert.match(menu,/document\.getElementById\('sperrschirm'\)/);
  assert.match(menu,/key:'Escape'/);
  assert.match(menu,/catch \{[\s\S]*?restore\(\)/);
  assert.doesNotMatch(menu,/localStorage|indexedDB|Store\.|Register\.aktionen\.tun/);
});

test('native library bridge supports mobile sheet without desktop role and safely falls back', async () => {
  const source=fs.readFileSync(new URL('./native-library-actions.swift',import.meta.url),'utf8');
  const bridge=source.match(/private static let bridge = #"""([\s\S]*?)"""#/)[1];
  for (const mode of ['select','cancel','unavailable','locked']) {
    let listener, callback, menu=null, clicks=0, cancelled=0, posted=0;
    const attrs=new Map([['aria-label','Aktionen für „Testdokument“'],['aria-expanded','true']]);
    const anchor={isConnected:true,disabled:false,getAttribute:k=>attrs.get(k)??null};
    const node=(initial={})=>{
      const map=new Map(Object.entries(initial));
      return {style:{visibility:''},getAttribute:k=>map.get(k)??null,
        setAttribute:(k,v)=>map.set(k,v),removeAttribute:k=>map.delete(k)};
    };
    const button={disabled:false,hidden:false,isConnected:true,getAttribute:()=>null,
      getClientRects:()=>[1],hasAttribute:()=>false,classList:{contains:()=>false},
      cloneNode:()=>({querySelectorAll:()=>[],textContent:'Öffnen'}),click(){clicks++;}};
    const backdrop=node({'aria-hidden':'true'});
    const sheet={...node({'aria-label':'Testdokument'}),isConnected:true,
      classList:{contains:k=>k==='blatt'},
      querySelector:k=>k==='.blatt-titel'?{textContent:'Testdokument'}:null,
      querySelectorAll:()=>[button]};
    let locked=false;
    const document={hidden:false,getElementById:()=>locked?{}:null,
      addEventListener:(name,fn)=>{if(name==='click')listener=fn;},
      querySelector:k=>k==='.menu-grund'?backdrop:k.includes('.menu.blatt')?menu:null,
      dispatchEvent:()=>{cancelled++;}};
    const window={webkit:{messageHandlers:{redionLibraryActions:{async postMessage(payload){
      posted++;assert.equal(payload.title,'Testdokument');
      assert.equal(sheet.style.visibility,'hidden');
      if(mode==='unavailable')throw Error('native unavailable');
      if(mode==='locked')locked=true;
      return mode==='cancel'?-1:0;
    }}}}};
    vm.runInNewContext(bridge,{document,window,setTimeout:fn=>{callback=fn;},KeyboardEvent:class {}});
    listener({isTrusted:true,detail:1,target:{closest:()=>anchor}});
    menu=sheet;
    await callback();
    assert.equal(posted,1);
    assert.equal(clicks,mode==='select'?1:0);
    assert.equal(cancelled,['cancel','locked'].includes(mode)?1:0);
    assert.equal(sheet.style.visibility,'');
    assert.equal(backdrop.getAttribute('aria-hidden'),'true');
  }
});

test('native library filters preserve active options, groups and existing selection handlers', async () => {
  const source=fs.readFileSync(new URL('./native-library-actions.swift',import.meta.url),'utf8');
  const bridge=source.match(/private static let bridge = #"""([\s\S]*?)"""#/)[1];
  for (const [attr,title] of [['data-orte','Ort'],['data-art-wahl','Art'],['data-form-wahl','Darstellung']]) {
    for (const mode of ['select','cancel','stale','wrong-title','too-many']) {
      let listener,callback,menu=null,posted=0,clicked=0,cancelled=0,selector='';
      const anchorAttrs=new Map([[attr,''],['aria-expanded','true']]);
      const anchor={isConnected:true,disabled:false,getAttribute:k=>anchorAttrs.get(k)??null};
      const button=(active,name)=>({isConnected:true,disabled:false,hidden:false,
        getAttribute:k=>k==='aria-checked'?String(active):null,
        getClientRects:()=>[1],hasAttribute:()=>false,classList:{contains:()=>false},
        closest:()=>({getAttribute:()=> 'group-name'}),
        cloneNode:()=>({querySelectorAll:()=>[],textContent:name}),click(){clicked++;}});
      const buttons=[button(true,'Alle'),button(false,'Andere')];
      const attrs=new Map([['aria-label',title]]);
      const sheet={isConnected:true,style:{visibility:''},classList:{contains:k=>k==='blatt'},
        getAttribute:k=>attrs.get(k)??null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),
        querySelector:k=>k==='.blatt-titel'?{textContent:mode==='wrong-title'?'Fremd':title}:null,
        querySelectorAll:k=>{selector=k;return mode==='too-many'?Array(25).fill(buttons[0]):buttons;}};
      const document={hidden:false,getElementById:k=>k==='group-name'?{textContent:'Orte'}:null,
        addEventListener:(name,fn)=>{if(name==='click')listener=fn;},
        querySelector:k=>k.includes('.menu.blatt')?menu:null,dispatchEvent:()=>{cancelled++;}};
      const window={webkit:{messageHandlers:{redionLibraryActions:{async postMessage(payload){
        posted++;
        assert.equal(payload.title,title);
        assert.equal(payload.rows[0].title,attr==='data-orte'?'✓ Orte: Alle':'✓ Alle');
        assert.equal(payload.rows[1].title,attr==='data-orte'?'Orte: Andere':'Andere');
        assert.ok(payload.rows.every(row=>row.destructive===false));
        if(mode==='stale')menu={};
        return mode==='cancel'?-1:1;
      }}}}};
      vm.runInNewContext(bridge,{document,window,setTimeout:fn=>{callback=fn;},KeyboardEvent:class {}});
      listener({isTrusted:true,detail:1,target:{closest:()=>anchor}});
      menu=sheet;
      await callback();
      const fallback=['wrong-title','too-many'].includes(mode);
      assert.equal(posted,fallback?0:1);
      if(mode!=='wrong-title')assert.equal(selector,'button[data-wahl][role="menuitemradio"]');
      assert.equal(clicked,mode==='select'?1:0);
      assert.equal(cancelled,mode==='cancel'?1:0);
      assert.equal(sheet.style.visibility,'');
    }
  }
});
