/* BlockSuite-Dokumentstruktur, Rich Text, Mindmap und echte Anhänge. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
const repo=path.resolve(import.meta.dirname,'..'),browser=await chromium.launch();let checked=0;
const check=(name:string,value:unknown)=>{assert.ok(value,name);checked++;console.log('✓ '+name);};
try{
 const context=await browser.newContext({viewport:{width:1366,height:950},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(repo,'index.html')).href);await page.waitForFunction(()=>typeof App!=='undefined'&&!!document.querySelector('#page')?.firstElementChild);
 const input=await page.evaluate(async()=>{
  Store.setMeta('rundgangGesehen',true);Store.setMeta('neuerungenGesehen',1e9);document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e=>e.remove());App.theme('light');
  const existing=Store.addPage(null,{text:'Bestehende Seite',seitenAnsicht:'flaeche'});Store.addBlock(existing.id,'text',{text:'Dieser Inhalt bleibt.'});App.zeichneBaum();App.oeffne(existing.id);
  const rt=(text:string)=>({'$blocksuite:internal:text$':true,delta:[{insert:text}]});
  const block=(id:string,flavour:string,props:any,children:any[]=[])=>({type:'block',id,flavour,version:1,props,children});
  const doc={type:'page',meta:{id:'doc-a',title:'Entwurf'},blocks:block('root','affine:page',{title:rt('AFFiNE-Projekt')},[
   block('surface','affine:surface',{elements:{
    n1:{id:'n1',type:'shape',shapeType:'rect',xywh:'[0,0,140,70]',radius:.1,strokeColor:'--affine-palette-line-blue',fillColor:'--affine-palette-shape-yellow',filled:true,text:'Zentrum'},
    n2:{id:'n2',type:'shape',shapeType:'ellipse',xywh:'[240,0,140,70]',text:'Ast'},
    map:{id:'map',type:'mindmap',children:{'affine:surface:ymap':true,json:{n1:{index:'a0'},n2:{parent:'n1',index:'a1'}}}}
   }}),
   block('note','affine:note',{xywh:'[30,120,450,350]'},[
    block('heading','affine:paragraph',{type:'h2',text:rt('Projektübersicht')}),
    block('paragraph','affine:paragraph',{type:'text',text:{$blocksuite:true,delta:[{insert:'Wichtig',attributes:{bold:true}},{insert:' prüfen'}]}}),
    block('todo','affine:list',{type:'todo',checked:true,text:rt('Schaltung testen')}),
    block('list','affine:list',{type:'bulleted',text:rt('Anforderung')},[block('nested','affine:list',{type:'numbered',text:rt('Unterpunkt')})]),
    block('code','affine:code',{language:'typescript',text:rt('const u = 24;')}),
    block('image','affine:image',{sourceId:'picture',caption:'Skizze'}),
    block('ref','affine:embed-linked-doc',{pageId:'doc-b'}),
    block('unknown','affine:custom-fixture',{payload:{behalten:true}})
   ])])};
  const second={type:'page',meta:{id:'doc-b'},blocks:block('root-b','affine:page',{title:rt('Anforderungen')},[block('p-b','affine:paragraph',{type:'text',text:rt('Zielseite')})])};
  const canvas=document.createElement('canvas');canvas.width=40;canvas.height=30;canvas.getContext('2d')!.fillRect(0,0,40,30);const png=await new Promise<Blob>(r=>canvas.toBlob(b=>r(b!)));
  const zip=await Austausch.zipSchreiben([{name:'workspace.json',inhalt:JSON.stringify({docs:[doc,second]})},{name:'assets/picture',inhalt:png}]);
  return {bytes:[...new Uint8Array(await zip.arrayBuffer())],png:[...new Uint8Array(await png.arrayBuffer())],existing:existing.id};
 });
 await page.locator('.pg-fl-tools [data-a="objekte"]').click();await page.locator('.gfx-inspector').getByRole('button',{name:'Austausch',exact:true}).click();
 await page.getByLabel('AFFiNE-Dokumente importieren',{exact:true}).setInputFiles({name:'Workspace.zip',mimeType:'application/zip',buffer:Buffer.from(input.bytes)});
 await page.getByRole('button',{name:'Importierte Dokumente öffnen',exact:true}).waitFor({timeout:10000}).catch(async error=>{console.log(await page.locator('.gfx-inspector').innerText());throw error;});
 check('Nicht unterstützter Block wird sichtbar gemeldet',(await page.locator('.gfx-inspector-body').innerText()).includes('affine:custom-fixture'));
 await page.getByRole('button',{name:'Importierte Dokumente öffnen',exact:true}).click();
 const state=await page.evaluate(async()=>{
  const root=Store.getBlock(App.aktuelleSeite()),pages=Store.childrenOf(root.id).filter((b:any)=>b.type==='page');
  const first=pages.find((p:any)=>p.text==='AFFiNE-Projekt'),second=pages.find((p:any)=>p.text==='Anforderungen');
  const all:any[]=[];const visit=(id:string)=>Store.childrenOf(id).forEach((b:any)=>{all.push(b);visit(b.id);});visit(first.id);
  const image=all.find(b=>b.type==='image'),bytes=[...new Uint8Array(await (await Dateien.alsBlob(image.dateiId))!.arrayBuffer())];
  const original=Store.childrenOf(root.id).find((b:any)=>b.type==='file');
  return {root:root.id,first:first.id,pages:pages.length,text:all.find(b=>b.affineSource?.id==='paragraph').text,
   todo:all.find(b=>b.type==='todo').checked,nested:all.find(b=>b.affineSource?.id==='nested').parentId!==first.id,
   target:all.find(b=>b.type==='pageref').ziel===second.id,original:!!await Dateien.alsBlob(original.dateiId),bytes,
   unsupported:all.some(b=>b.affineUnsupported),shapes:first.shapes,ids:all.every(b=>b.id!==b.affineSource?.id)};
 });
 check('Zwei Dokumente werden als neue Seiten angelegt',state.pages===2&&state.ids);
 check('Rich Text bleibt im bestehenden Editor bearbeitbar',state.text==='**Wichtig** prüfen');
 check('Aufgabenstatus und Verschachtelung bleiben erhalten',state.todo&&state.nested);
 check('Dokumentverweis zeigt auf die neu vergebene Zielkennung',state.target);
 check('Bild und Originalexport sind vollständig',state.original&&JSON.stringify(state.bytes)===JSON.stringify(input.png));
 check('Unbekannte Blockdaten bleiben sichtbar erhalten',state.unsupported);
 check('Gedankenkarte enthält bearbeitbare Knoten und Verbinder',state.shapes.filter((s:any)=>s.art==='verbindung').length===1&&state.shapes.filter((s:any)=>s.art!=='verbindung').every((s:any)=>!!s.groupId));
 check('Abgerundete Form und AFFiNE-Palette werden übersetzt',state.shapes.some((s:any)=>s.cornerRadius===.1&&s.fillColor==='#ffdc49'));
 await page.evaluate(id=>App.oeffne(id),state.first);await page.getByText('Projektübersicht',{exact:true}).waitFor();
 check('Formatierung wird tatsächlich gezeichnet',await page.locator('.ct b').getByText('Wichtig',{exact:true}).count()===1);
 if(process.argv.includes('--capture'))await page.screenshot({path:path.join(repo,'bilder','affine-elektro','dokumentimport-1366.png')});
 const result=await page.evaluate(async({existing,root})=>{
  const before=JSON.stringify(Store.cache.blocks),count=Object.keys(Store.cache.blocks).length;
  const bad={type:'page',meta:{id:'bad'},blocks:{id:'p',flavour:'affine:page',props:{title:'Defekt'},children:[{id:'i',flavour:'affine:image',props:{sourceId:'fehlt'},children:[]}]}};
  let rejected=false;try{await AffineImport.file(new File([JSON.stringify(bad)],'missing.json'));}catch{rejected=true;}
  const unchanged=before===JSON.stringify(Store.cache.blocks)&&Object.keys(Store.cache.blocks).length===count;
  const packet=await App.sicherungPaketBauen(),zip=await Einlesen.zipLesenAusBlob(packet.blob);await Store.importAll(await zip.text('daten.json'),'ersetzen');
  return {rejected,unchanged,existing:Store.childrenOf(existing)[0].text==='Dieser Inhalt bleibt.',restored:Store.childrenOf(root).filter((b:any)=>b.type==='page').length===2};
 },{existing:input.existing,root:state.root});
 check('Fehlender Anhang bricht ohne halbe Seiten ab',result.rejected&&result.unchanged);
 check('Bestehende Seiten und Dokumentimport überstehen .redion',result.existing&&result.restored);
 check('Keine Browserfehler',!errors.length);console.log(`${checked} Zusagen erfüllt`);
}finally{await browser.close();}
