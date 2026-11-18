import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {_electron as electron,type ElectronApplication,type Page} from 'playwright';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
declare const App:any,Store:any,RegisterAutomatisierung:any;
const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'../../..');
const packagedArg=process.argv.find(arg=>arg.startsWith('--packaged='));
const packaged=packagedArg?path.resolve(packagedArg.slice('--packaged='.length)):null;
const profileToken=crypto.randomBytes(16).toString('hex');
if(packaged){
  const asar=require(path.join(root,'windows/node_modules/@electron/asar'));
  const bundled=asar.extractFile(path.join(path.dirname(packaged),'resources/app.asar'),'main.cjs');
  assert.ok(bundled.equals(fs.readFileSync(path.join(root,'windows/main.cjs'))),'Nur die aktuelle EXE mit sicherem Testprofil darf gestartet werden');
  assert.ok(bundled.toString().includes('--redion-test-profile='));
}
const output=path.join(root,'bilder/redion-mcp',...(packaged?['paket']:[]));fs.mkdirSync(output,{recursive:true});
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'redion-mcp-electron-'));
const appData=packaged?path.join(os.tmpdir(),'Redion-Testprofile',profileToken):path.join(temporary,'appdata');
if(packaged){
  const {secureDirectory}=require(path.join(root,'windows/generated/automation-bridge.cjs'));
  secureDirectory(path.dirname(appData));secureDirectory(appData);
}else fs.mkdirSync(appData);
const bootstrap=path.join(temporary,'bootstrap.cjs');
fs.writeFileSync(bootstrap,`const {app}=require('electron');app.setPath('appData',${JSON.stringify(appData)});require(${JSON.stringify(path.join(root,'windows/main.cjs'))});`);
const entry=packaged?path.join(path.dirname(packaged),'resources/redion-mcp/server/dist/index.mjs'):path.join(root,'plugins/red-ion/server/dist/index.mjs');
const env=Object.fromEntries(Object.entries(process.env).filter(([k,v])=>k!=='ELECTRON_RUN_AS_NODE'&&v!==undefined)) as Record<string,string>;
env.REDION_MCP_DISCOVERY=path.join(appData,'Redion/automation/connection.json');
const messages:string[]=[];const nativeErrors:string[]=[];let native:ElectronApplication|null=null;let page:Page;
async function openApp():Promise<void>{
  native=await electron.launch({executablePath:packaged||require(path.join(root,'windows/node_modules/electron')),
    args:packaged?['--redion-test-profile='+profileToken]:[bootstrap],env});
  if(packaged)assert.equal(await native.evaluate(({app})=>app.getPath('userData')),path.join(appData,'Redion'),'Die EXE muss vor Zugriff auf Daten isoliert sein');
  // Nur der menschliche native Dialog wird für synthetische Testdaten beantwortet.
  // Alle IPC-, Berechtigungs-, Named-Pipe-, MCP- und Speicherwege sind echt.
  native.process().stderr?.on('data',chunk=>{const text=String(chunk);if(text.includes('MCP_NATIVE_ERROR:'))nativeErrors.push(text);});
  await native.evaluate(({dialog,app})=>{(globalThis as any).__mcpConsent=0;(globalThis as any).__mcpPreviewOwned=false;
    dialog.showMessageBox=async(...args:any[])=>{(globalThis as any).__mcpConsent++;
      if(args[1]?.title==='Dieses Redion-Bild übertragen?'){
        if(args[0]?.getTitle()!=='RED Ion · Bildfreigabe')throw new Error('Bildfreigabe gehört nicht zur Vorschau');
        (globalThis as any).__mcpPreviewOwned=true;
      }
      return {response:1,checkboxChecked:false};};
    // Unerwartete native Fehler dürfen weder durch einen modalen Dialog hängen
    // bleiben noch einen funktional erfolgreichen Lauf fälschlich grün machen.
    dialog.showErrorBox=(title:string,detail:string)=>{process.stderr.write('MCP_NATIVE_ERROR:'+title+':'+detail+'\n');app.exit(91);};
  });
  page=await native.firstWindow();page.setDefaultTimeout(20000);page.on('pageerror',e=>messages.push(e.message));
  await page.waitForFunction(()=>typeof App!=='undefined'&&typeof Store!=='undefined'&&!!document.querySelector('#page')?.firstElementChild);
  await page.waitForFunction(()=>document.getElementById('ru-vorhang')?.hidden===true);
  await page.evaluate(()=>{
    Store.setMeta('rundgangGesehen',true);Store.setMeta('neuerungenGesehen',99);Store.setMeta('kartenGemeldet',new Date().toISOString().slice(0,10));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung').forEach(el=>el.remove());
  });
}
type Result={ok:boolean;data?:Record<string,any>;error?:{code:string;message:string};operationId?:string};
const client=new Client({name:'RED Ion Integrationstest',version:'0.1.0'});
const stdio=new StdioClientTransport({command:process.execPath,args:[entry],env,stderr:'pipe'});
let stdioErrors='';stdio.stderr?.on('data',chunk=>stdioErrors+=String(chunk));
const raw=async(name:string,args:Record<string,unknown>={}):Promise<Result>=>{
  const response=await client.callTool({name,arguments:args});return response.structuredContent as Result;
};
const call=async(name:string,args:Record<string,unknown>={}):Promise<Record<string,any>>=>{
  const result=await raw(name,args);assert.equal(result.ok,true,name+': '+JSON.stringify(result.error));console.log('✓ '+name);return result.data!;
};
const report:Record<string,unknown>={synthetic:true,runtime:packaged?'packaged-windows':'development-electron',physicalDevice:'NICHT GETESTET',chatGPT:'NICHT GETESTET',tunnel:'NICHT GETESTET'};
let httpProcess:ReturnType<typeof spawn>|null=null;
let httpClient:Client|null=null;
try {
  await client.connect(stdio);const tools=(await client.listTools()).tools;
  console.log('MCP-Handshake und Werkzeugliste über stdio bestanden.');
  assert.ok(tools.length>=35);report.toolCount=tools.length;
  assert.equal((await call('redion_get_status')).running,false,'Kein App-Prozess wird vorgetäuscht');
  await openApp();
  console.log('Isolierte Electron-App gestartet.');
  const disabled=await call('redion_get_status');assert.equal(disabled.status,'CONNECTION_DISABLED');
  assert.equal((await raw('redion_create_page',{title:'Nicht erlaubt'})).ok,false);
  await page!.evaluate(()=>App.einstellungen('mcp'));
  await page!.locator('[data-automation-policy="enabled"]').check();
  await page!.locator('[data-automation-policy="write"]').check();
  for(const checkbox of await page!.locator('[data-automation-scope]').all())await checkbox.check();
  await page!.locator('[data-automation-apply]').click();
  await page!.waitForFunction(()=>document.querySelector('[data-automation-status]')?.textContent?.includes('Aktiviert'));
  await page!.evaluate(()=>{document.querySelector('#ei')!.scrollTop=0;});
  await page!.screenshot({path:path.join(output,'01-freigabe-dunkel.png')});
  await page!.locator('.einst-zu').click();
  const status=await call('redion_get_status');assert.equal(status.running,true);assert.equal(status.connected,true);
  const names=await page!.evaluate(()=>RegisterAutomatisierung.namen());
  const nativeTools=new Set(['redion_get_status','redion_get_capabilities','redion_focus_app','redion_launch_app','redion_request_confirmation','redion_get_operation_status','redion_get_activity_log','redion_get_recent_errors']);
  assert.deepEqual(tools.map(t=>t.name).filter(n=>!nativeTools.has(n)).sort(),names.sort(),'Jedes beworbene App-Werkzeug ist wirklich registriert');
  await native!.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.minimize());
  await call('redion_focus_app');assert.equal(await native!.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0]!.isMinimized()),false);
  const workspace=await call('redion_list_workspaces');assert.deepEqual(workspace.workspaces.map((w:any)=>w.id),['lernen','workspace']);
  await call('redion_open_workspace',{workspaceId:'workspace'});await call('redion_open_home');
  const created=await call('redion_create_page',{title:'MCP · Live-Test',blocks:Array.from({length:5},(_,i)=>({type:'h2',text:'Überschrift '+(i+1)}))});
  const documentId=created.document.id;report.documentId=documentId;
  await page!.evaluate(()=>{
    const publicBox=document.createElement('div');publicBox.id='synthetic-mcp-public';
    publicBox.style.cssText='position:fixed;left:300px;top:230px;width:220px;height:120px;background:rgb(0,255,0);z-index:2147483646';document.body.append(publicBox);
    const box=document.createElement('div');box.id='synthetic-mcp-private';box.dataset.mcpPrivate='';
    box.textContent='NUR KÜNSTLICHER GEHEIMNIS-TEST';box.style.cssText='position:fixed;left:320px;top:250px;width:160px;height:80px;background:rgb(255,0,0);z-index:2147483647';document.body.append(box);
  });
  const visual=await client.callTool({name:'redion_capture_view',arguments:{target:'window',documentId,crop:{x:300,y:230,width:220,height:120},maxEdge:320}});
  const picture=(visual.content as any[]).find((part:any)=>part.type==='image') as {type:'image';data:string;mimeType:string}|undefined;
  assert.ok(picture,'Der echte SDK-Client erhält einen MCP-Bildblock, keinen JSON-Bildtext');
  assert.equal(picture.mimeType,'image/png');
  assert.equal(await native!.evaluate(()=>(globalThis as any).__mcpPreviewOwned),true,'Die Bestätigung steht im tatsächlichen Vorschaufenster');
  fs.writeFileSync(path.join(output,'04-mcp-bild-maskiert.png'),Buffer.from(picture.data,'base64'));
  const decoded=await native!.evaluate(({nativeImage},base64)=>{
    const image=nativeImage.createFromBuffer(Buffer.from(base64,'base64')),size=image.getSize(),bitmap=image.toBitmap();
    const pixel=(x:number,y:number)=>{const offset=(Math.floor(y*size.height/120)*size.width+Math.floor(x*size.width/220))*4;return [...bitmap.subarray(offset,offset+4)];};
    return {size,pixel:pixel(30,30),publicPixel:pixel(5,5)};
  },picture.data);
  assert.ok(decoded.size.width<=320&&decoded.size.height<=320);assert.ok(Math.abs(decoded.size.width/decoded.size.height-220/120)<0.02,'Ausschnitt behält bei Windows-Skalierung sein Seitenverhältnis');
  assert.deepEqual(decoded.pixel,[255,255,255,255],'Vertraulicher Bereich wurde vor der Übertragung überschrieben');
  assert.deepEqual(decoded.publicPixel,[0,255,0,255],'Der übrige sichtbare Inhalt wird tatsächlich übertragen');
  assert.equal((visual.structuredContent as Result).data?.image.documentId,documentId);
  await page!.evaluate(()=>{document.getElementById('synthetic-mcp-private')!.remove();document.getElementById('synthetic-mcp-public')!.remove();});
  assert.equal(await page!.locator('#redion-mcp-mask').count(),0,'Die Maskierung bleibt nicht in der Arbeitsfläche hängen');
  assert.equal((await raw('redion_capture_view',{target:'editor',documentId:'wrong-document'})).error?.code,'STALE_DOCUMENT');
  await native!.evaluate(({dialog})=>{dialog.showMessageBox=async()=>({response:0,checkboxChecked:false});});
  assert.equal((await raw('redion_capture_view',{target:'editor',documentId})).error?.code,'CONSENT_DENIED');
  assert.equal(await page!.locator('#redion-mcp-mask').count(),0,'Auch die verweigerte Aufnahme räumt ihre Maske auf');
  await native!.evaluate(({dialog})=>{dialog.showMessageBox=async()=>{(globalThis as any).__mcpConsent++;return {response:1,checkboxChecked:false};};});
  await page!.evaluate(async()=>{
    const desktop=(window as any).RedionDesktop,p=await desktop.automationState();
    await desktop.automationConfigure({enabled:p.enabled,write:p.write,allowLaunch:p.allowLaunch,scopes:p.scopes,
      rememberClients:p.rememberClients,confirmCritical:p.confirmCritical,confirmImages:false});
  });
  // Testdialoge antworten sofort. Die echte Bridge begrenzt neue Kopplungen
  // auch nach einer Rechteänderung auf höchstens eine Anfrage je zwei Sekunden.
  await new Promise(resolve=>setTimeout(resolve,2100));
  await call('redion_get_status');
  const approvalsBefore=await native!.evaluate(()=>(globalThis as any).__mcpConsent);
  const delegated=await client.callTool({name:'redion_capture_view',arguments:{target:'editor',documentId,maxEdge:800}});
  assert.ok((delegated.content as any[]).some(part=>part.type==='image'));
  assert.equal(await native!.evaluate(()=>(globalThis as any).__mcpConsent),approvalsBefore,'Explizite Bilddelegation fragt nicht bei jeder Aufnahme erneut');
  assert.equal(await native!.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().filter((w:any)=>w.getTitle()==='RED Ion · Bildfreigabe').length),1,'Die Vorschau erscheint auch ohne erneute Bestätigung');
  report.visual={mcpImage:true,mask:true,crop:true,documentBinding:true,refusal:true,source:'own-window-only',chatGPT:'NICHT GETESTET'};
  assert.equal((await call('redion_get_active_document')).document.id,documentId);
  assert.equal((await call('redion_get_current_view')).documentId,documentId);
  assert.equal((await call('redion_get_capabilities')).tools.length,tools.length);
  assert.ok((await call('redion_list_documents')).documents.some((d:any)=>d.id===documentId));
  assert.ok((await call('redion_search',{query:'MCP · Live-Test'})).documents.some((d:any)=>d.id===documentId));
  assert.equal(await page!.locator('#page').getByText('Überschrift 5',{exact:true}).count(),1,'Änderung steht im echten Renderer');
  assert.equal((await call('redion_read_page',{documentId})).blocks.length,5);
  assert.equal((await raw('redion_replace_text',{documentId,find:'Überschrift',replacement:'Doppeldeutig'})).error?.code,'AMBIGUOUS_TEXT');
  assert.equal((await raw('redion_read_page',{documentId:'missing-document'})).error?.code,'INVALID_DOCUMENT');
  const inserted=await call('redion_insert_block',{documentId,block:{type:'text',text:'Eine echte Notiz · äöü ⚡'}});
  await call('redion_update_block',{blockId:inserted.block.id,text:'Eine korrigierte Notiz',expectedText:'Eine echte Notiz · äöü ⚡'});
  assert.equal((await raw('redion_update_block',{blockId:inserted.block.id,text:'Veraltet',expectedText:'Alt'})).error?.code,'STALE_DOCUMENT');
  await call('redion_undo');assert.ok((await call('redion_read_page',{documentId})).blocks.some((b:any)=>b.text==='Eine echte Notiz · äöü ⚡'));
  await call('redion_redo');await call('redion_replace_text',{documentId,find:'korrigierte',replacement:'verbundene'});
  const rich=await call('redion_insert_block',{documentId,block:{type:'text',text:'Eine **formatierte** Notiz'}});
  await call('redion_replace_text',{documentId,find:'formatierte',replacement:'formatierte Erklärung'});
  assert.equal(await page!.evaluate(id=>Store.getBlock(id).text,rich.block.id),'Eine **formatierte Erklärung** Notiz');
  assert.equal(await page!.locator('#page .ct b').filter({hasText:'formatierte Erklärung'}).count(),1,'Bestehendes Markdown bleibt wirklich sichtbar formatiert');
  const literalText='<Klemme> &amp; <img src=x onerror="window.__mcpInjected=true">';
  const characters=await call('redion_create_page',{title:'MCP · Zeichenprüfung',blocks:[{type:'text',text:'Start <L> &amp;'}],open:false});
  assert.equal(characters.blocks[0].text,'Start <L> &amp;');
  const literal=await call('redion_insert_block',{documentId:characters.document.id,block:{type:'text',text:literalText}});
  assert.equal(await page!.evaluate(id=>Store.getBlock(id).text,literal.block.id),literalText,'Store erhält rohe Zeichen, keine vorab maskierten HTML-Entities');
  assert.equal((await call('redion_read_page',{documentId:characters.document.id})).blocks.find((b:any)=>b.id===literal.block.id).text,literalText);
  assert.equal(await page!.locator('[data-bid="'+literal.block.id+'"] .ct').textContent(),literalText);
  assert.equal(await page!.locator('[data-bid="'+literal.block.id+'"] .ct img').count(),0,'HTML bleibt sichtbarer Text');
  assert.equal(await page!.evaluate(()=>Boolean((window as any).__mcpInjected)),false,'Darstellung maskiert HTML selbst');
  await call('redion_replace_text',{documentId:characters.document.id,find:'<Klemme>',replacement:'$& <Anschluss>'});
  assert.equal(await page!.evaluate(id=>Store.getBlock(id).text,literal.block.id),literalText.replace('<Klemme>',()=>'$& <Anschluss>'),'Ersetzung übernimmt auch Dollarzeichen wörtlich');
  const small=await call('redion_create_page',{title:'MCP · Kopiervorlage',blocks:[{type:'text',text:'Kopie prüfen'}]});
  const copy=await call('redion_duplicate_page',{documentId:small.document.id});assert.notEqual(copy.documentId,small.document.id);
  await call('redion_move_page',{documentId:copy.documentId,parentId:documentId});
  await call('redion_update_page',{documentId:copy.documentId,title:'MCP · Kopie verschoben'});
  await call('redion_open_document',{documentId});
  const task=await call('redion_create_task',{documentId,text:'Testaufgabe <N> &amp;'});await call('redion_update_task',{blockId:task.blockId,checked:true});
  assert.equal(await page!.evaluate(id=>Store.getBlock(id).text,task.blockId),'Testaufgabe <N> &amp;');
  const cards=await call('redion_create_flashcards',{documentId,cards:Array.from({length:20},(_,i)=>({question:'Schaltung '+i+(i===0?' <L> &amp;':''),answer:'Antwort '+i}))});assert.equal(cards.count,20);
  assert.equal(await page!.evaluate(id=>Store.getBlock(id).text,cards.cardIds[0]),'Schaltung 0 <L> &amp; :: Antwort 0');
  const db=await call('redion_create_database',{documentId,name:'MCP-Testtabelle'});
  const row=await call('redion_add_database_row',{databaseId:db.databaseId,properties:{title:'Zeile 1'}});
  await call('redion_update_database_row',{rowId:row.rowId,properties:{title:'Zeile geändert'}});
  const rows=await call('redion_list_database_rows',{databaseId:db.databaseId});assert.equal(rows.rows[0].properties.title,'Zeile geändert');
  assert.equal((await raw('redion_add_database_row',{databaseId:db.databaseId,properties:{unknown:'x'}})).ok,false);
  assert.equal((await raw('redion_delete_block',{blockId:inserted.block.id})).error?.code,'CONFIRMATION_REQUIRED');
  const permission=await call('redion_request_confirmation',{tool:'redion_delete_block',arguments:{blockId:inserted.block.id}});
  await call('redion_delete_block',{blockId:inserted.block.id,confirmationId:permission.confirmationId});
  assert.equal((await raw('redion_delete_block',{blockId:inserted.block.id,confirmationId:permission.confirmationId})).ok,false);
  const schematic=await call('redion_create_schematic',{documentId,title:'MCP-Schaltung'});
  const components=(await call('redion_list_schematic_components')).components;
  const kind=components.find((c:any)=>c.id==='ausschalter')||components.find((c:any)=>c.terminals?.length===2&&c.width<100&&c.height<100);assert.ok(kind);
  const first=await call('redion_add_schematic_component',{blockId:schematic.blockId,componentType:kind.id,x:100,y:150});
  const second=await call('redion_add_schematic_component',{blockId:schematic.blockId,componentType:kind.id,x:320,y:150});
  assert.equal((await raw('redion_add_schematic_component',{blockId:schematic.blockId,componentType:kind.id,x:100,y:150})).error?.code,'COMPONENT_OVERLAP');
  await call('redion_connect_schematic_components',{blockId:schematic.blockId,from:{componentId:first.component.id,terminalId:kind.terminals[0].nr},to:{componentId:second.component.id,terminalId:kind.terminals[0].nr}});
  await call('redion_move_schematic_component',{blockId:schematic.blockId,componentId:second.component.id,x:360,y:150});
  assert.equal((await call('redion_read_schematic',{blockId:schematic.blockId})).plan.leitungen.length,1);
  const svgApproval=await call('redion_request_confirmation',{tool:'redion_export_schematic',arguments:{blockId:schematic.blockId}});
  assert.match((await call('redion_export_schematic',{blockId:schematic.blockId,confirmationId:svgApproval.confirmationId})).svg,/<svg/);
  const textApproval=await call('redion_request_confirmation',{tool:'redion_export_page',arguments:{documentId}});
  assert.match((await call('redion_export_page',{documentId,confirmationId:textApproval.confirmationId})).text,/Überschrift 5/);
  const operation=await raw('redion_get_settings');assert.equal((await call('redion_get_operation_status',{operationId:operation.operationId})).operation.status,'completed');
  await raw('redion_read_page',{documentId:'missing-again'});assert.ok((await call('redion_get_recent_errors')).entries.some((e:any)=>e.code==='INVALID_DOCUMENT'));
  await call('redion_launch_app',{allowLaunch:true});
  await call('redion_open_schematic',{blockId:schematic.blockId});await page!.screenshot({path:path.join(output,'02-live-inhalte.png')});
  const schematicImage=await client.callTool({name:'redion_capture_view',arguments:{target:'schematic',documentId,blockId:schematic.blockId,maxEdge:1200}});
  const planImage=(schematicImage.content as any[]).find((part:any)=>part.type==='image') as {data:string}|undefined;
  assert.ok(planImage,'Der tatsächliche Schaltplan wird als Bild übertragen: '+JSON.stringify(schematicImage.structuredContent));
  fs.writeFileSync(path.join(output,'05-mcp-schaltplan.png'),Buffer.from(planImage.data,'base64'));
  const log=JSON.stringify(await call('redion_get_activity_log'));assert.ok(!log.includes('Eine echte Notiz'));assert.ok(!log.includes('Schaltung 19'));
  const stateBefore=await page!.evaluate(id=>({id:Store.getBlock(id).id,text:Store.getBlock(id).text,
    content:Store.getBlock(id).content,children:Store.childrenOf(id).map((b:any)=>({id:b.id,type:b.type,text:b.text,checked:b.checked,plan:b.plan,collectionId:b.collectionId}))}),documentId);
  const firstProcess=native!.process();await native!.close();native=null;
  assert.equal(firstProcess.exitCode,0,JSON.stringify(nativeErrors));
  assert.equal((await call('redion_get_status')).running,false);
  await openApp();
  assert.equal((await call('redion_read_page',{documentId})).document.id,documentId);
  assert.equal(await native!.evaluate(()=>(globalThis as any).__mcpConsent),0,'Der bestätigte Adapter benötigt nach App-Neustart keine neue Freigabe');
  assert.equal((await call('redion_read_page',{documentId:characters.document.id})).blocks.find((b:any)=>b.id===literal.block.id).text,literalText.replace('<Klemme>',()=>'$& <Anschluss>'));
  assert.deepEqual(await page!.evaluate(id=>({id:Store.getBlock(id).id,text:Store.getBlock(id).text,
    content:Store.getBlock(id).content,children:Store.childrenOf(id).map((b:any)=>({id:b.id,type:b.type,text:b.text,checked:b.checked,plan:b.plan,collectionId:b.collectionId}))}),documentId),stateBefore,'IDs und Inhalte bleiben nach echtem Prozessneustart erhalten');
  await call('redion_open_document',{documentId});
  await call('redion_update_setting',{key:'theme',value:'light'});
  assert.equal((await call('redion_get_settings')).settings.theme,'light');
  await page!.evaluate(()=>App.einstellungen('mcp'));await page!.screenshot({path:path.join(output,'03-freigabe-hell.png')});
  await page!.locator('[data-automation-apply]').scrollIntoViewIfNeeded();await page!.screenshot({path:path.join(output,'04-sitzung-und-protokoll.png')});await page!.locator('.einst-zu').click();
  const token=crypto.randomBytes(32).toString('hex');let startup='';
  httpProcess=spawn(process.execPath,[entry,'--http'],{env:{...env,REDION_MCP_HTTP_TOKEN:token,REDION_MCP_PORT:'0'},stdio:['ignore','ignore','pipe'],windowsHide:true});
  const url=await new Promise<string>((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('HTTP-Start fehlt')),15000);
    httpProcess!.stderr!.on('data',chunk=>{startup+=String(chunk);for(const line of startup.split('\n')){try{const data=JSON.parse(line);if(data.url){clearTimeout(timeout);resolve(data.url);}}catch{}}});
    httpProcess!.once('exit',code=>reject(new Error('HTTP-Server beendet: '+code+' '+startup)));
  });
  assert.equal((await fetch(url,{method:'POST'})).status,401);
  assert.equal((await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,Origin:'https://attacker.invalid'}})).status,403);
  httpClient=new Client({name:'RED Ion HTTP-Test',version:'0.1.0'});
  await httpClient.connect(new StreamableHTTPClientTransport(new URL(url),{requestInit:{headers:{Authorization:'Bearer '+token}}}));
  assert.equal((await httpClient.listTools()).tools.length,tools.length);
  // Die zweite echte Sitzung wartet die native Begrenzung neuer Freigabedialoge ab.
  await new Promise(resolve=>setTimeout(resolve,2100));
  const httpRead=await httpClient.callTool({name:'redion_read_page',arguments:{documentId}});assert.equal((httpRead.structuredContent as Result).ok,true,JSON.stringify(httpRead.structuredContent));
  const httpImage=await httpClient.callTool({name:'redion_capture_view',arguments:{target:'editor',documentId,maxEdge:800}});
  assert.ok((httpImage.content as any[]).some(part=>part.type==='image'&&part.data.length>100),'Auch HTTP liefert einen echten Bildblock');
  await httpClient.close();report.http={handshake:true,read:true,image:true,unauthorized401:true,origin403:true};
  await page!.evaluate(async()=>{await (window as any).RedionDesktop.automationConfigure({enabled:false,write:false,allowLaunch:false,scopes:['app','documents']});});
  assert.equal((await raw('redion_create_page',{title:'Muss abgewiesen werden'})).ok,false);
  const count=await page!.evaluate(()=>Object.keys(Store.cache.blocks).length);
  await page!.context().setOffline(true);assert.equal(await page!.evaluate(()=>navigator.onLine),false);
  const offline=await page!.evaluate(()=>Store.addPage(null,{text:'Offline bleibt nutzbar'}).id);await page!.evaluate(async()=>Store.flush());
  assert.equal(await page!.evaluate(()=>Object.keys(Store.cache.blocks).length),count+1);assert.ok(offline);
  assert.equal(stdioErrors.includes('Eine echte Notiz'),false);
  const finalProcess=native!.process();await native!.close();native=null;
  assert.equal(finalProcess.exitCode,0,JSON.stringify(nativeErrors));assert.deepEqual(nativeErrors,[]);
  assert.deepEqual(messages,[]);report.electron=true;report.restart=true;report.revocation=true;report.offline=true;report.stdio=true;report.cleanExit=true;report.rememberedConsent=true;
  fs.writeFileSync(path.join(output,'nachweis.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
} finally {await httpClient?.close().catch(()=>{});await client.close().catch(()=>{});httpProcess?.kill();await (native as ElectronApplication|null)?.close().catch(()=>{});}
