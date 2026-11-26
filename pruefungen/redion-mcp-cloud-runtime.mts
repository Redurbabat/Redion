import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {build} from 'rolldown';
import {SCHEMA} from '../server/ablage.ts';
import {mcpStateD1} from '../server/mcp/state.ts';
import {createMcpOAuth,pkceChallenge} from '../server/mcp/oauth.ts';
import {schema6} from './hilfe/elektro-szenario.mts';

// Vorhandenes Wrangler verwenden. Kein Download, keine Kontoverbindung,
// keine entfernte Bindung. Der Test schlägt bei fehlender Laufzeit klar fehl.
const require=createRequire(import.meta.url);
const wranglerEntry=process.env.REDION_WRANGLER_ENTRY??require.resolve('wrangler');
const wranglerRequire=createRequire(wranglerEntry);
const {Miniflare,convertV4MiniflareOptions}=await import(pathToFileURL(wranglerRequire.resolve('miniflare')).href);

test('Cloudflare workerd: echter Worker, isoliertes D1, öffentliche DCR, SDK-Lesen und private Access-Grenze',async()=>{
  const output=path.resolve('bilder/redion-mcp/cloud/runtime-worker.mjs');
  await fs.mkdir(path.dirname(output),{recursive:true});
  await build({input:path.resolve('worker.ts'),platform:'neutral',
    output:{file:output,format:'esm',codeSplitting:false}});
  const outbound:string[]=[];
  const options={modules:true,script:await fs.readFile(output,'utf8'),compatibilityDate:'2025-04-01',
    d1Databases:{DB:'redion-oauth-synthetic-only'},
    bindings:{ACCESS_TEAM:'synthetic.cloudflareaccess.com',ACCESS_AUD:'synthetic-audience'},
    outboundService:(request:Request)=>{outbound.push(request.url);return new Response('Kein Netz im Test',{status:599});}};
  const mf=new Miniflare(typeof convertV4MiniflareOptions==='function'?convertV4MiniflareOptions(options):options);
  const {Client}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js',import.meta.url).href);
  const {StreamableHTTPClientTransport}=await import(new URL('../plugins/red-ion/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js',import.meta.url).href);
  let client:any,writer:any;
  try{
    const db=await mf.getD1Database('DB');
    const mcpSchema=await fs.readFile(new URL('../server/mcp/schema.sql',import.meta.url),'utf8');
    const statements=(sql:string)=>sql.replace(/\/\*[\s\S]*?\*\//g,'').replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean);
    for(const sql of statements(SCHEMA+'\n'+mcpSchema))await db.prepare(sql).run();
    await db.prepare('INSERT INTO konten(id,gesperrt) VALUES(?,0)').bind('runtime-owner').run();
    await db.prepare('INSERT INTO bereiche(id,name,besitzer) VALUES(?,?,?)').bind('runtime-workspace','Synthetic runtime','runtime-owner').run();
    await db.prepare('INSERT INTO saetze(id,bereich,tabelle,daten,verschluesselt,seite,version,geloescht) VALUES(?,?,?,?,0,?,1,0)')
      .bind('runtime-page','runtime-workspace','blocks',JSON.stringify({type:'page',text:'Test',inhalt:'Isolierte Testdaten'}),'runtime-page').run();
    for(const sql of statements(mcpSchema))await db.prepare(sql).run();
    const origin='https://runtime.example.test',resource=origin+'/mcp/cloud';
    const fetcher=async(input:string|URL|Request,init?:RequestInit):Promise<Response>=>{
      const request=new Request(input,init);
      const forwarded:{method:string;headers:Record<string,string>;body?:string}={method:request.method,headers:Object.fromEntries(request.headers)};
      if(!['GET','HEAD'].includes(request.method))forwarded.body=await request.text();
      const response=await mf.dispatchFetch(request.url,forwarded),bytes=await response.arrayBuffer();
      return new Response(bytes.byteLength?bytes:null,{status:response.status,headers:Object.fromEntries(response.headers)});
    };
    assert.equal((await fetcher(origin+'/.well-known/oauth-authorization-server')).status,200);
    assert.equal((await fetcher(resource)).status,401);
    for(const p of ['/mcp/authorize','/mcp/settings','/index.html','/sync/runter','/api/bruecke'])
      assert.equal((await fetcher(origin+p)).status,403,'Access muss erhalten bleiben: '+p);
    const registered=await fetcher(origin+'/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({redirect_uris:['https://ai.example.test/cb'],token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token']})});
    assert.equal(registered.status,201);const registration=await registered.json();
    // Die Zustimmung erfolgt hier direkt auf den künstlichen Daten; der
    // Browser-Ablauf und das echte Access-Konto werden getrennt geprüft.
    const oauth=createMcpOAuth({state:mcpStateD1(db),issuer:origin,resource,authorizationEndpoint:origin+'/mcp/authorize'});
    const verifier='t'.repeat(64),args={client_id:registration.client_id,redirect_uri:registration.redirect_uris[0],response_type:'code',
      resource,code_challenge:await pkceChallenge(verifier),code_challenge_method:'S256'};
    const start=await oauth.begin('runtime-owner',args);if(start.kind!=='consent')throw new Error('consent expected');
    const approval=await oauth.approve('runtime-owner',start.requestId,start.csrf,{allow:true,remember:true,workspaceIds:['runtime-workspace']});
    const tokenResponse=await fetcher(origin+'/token',{method:'POST',body:new URLSearchParams({grant_type:'authorization_code',
      client_id:registration.client_id,code:new URL(approval.redirect).searchParams.get('code')!,redirect_uri:args.redirect_uri,resource,code_verifier:verifier})});
    assert.equal(tokenResponse.status,200);const tokens=await tokenResponse.json();
    client=new Client({name:'synthetic-workerd-client',version:'1'});
    await client.connect(new StreamableHTTPClientTransport(new URL(resource),{fetch:fetcher,requestInit:{headers:{Authorization:'Bearer '+tokens.access_token}}}));
    assert.equal((await client.listTools()).tools.length,16);
    const result=await client.callTool({name:'redion_read_page',arguments:{workspaceId:'runtime-workspace',documentId:'runtime-page'}});
    assert.equal(JSON.parse(result.content[0].text).markdown,'Isolierte Testdaten');
    const {plan:kreuzplan,soll,schalter}=schema6();
    await db.prepare('INSERT INTO saetze(id,bereich,tabelle,daten,verschluesselt,seite,version,geloescht) VALUES(?,?,?,?,0,?,1,0)')
      .bind('runtime-schema6','runtime-workspace','blocks',JSON.stringify({
        type:'schaltplan',parentId:'runtime-page',parentTable:'block',plan:kreuzplan
      }),'runtime-page').run();
    await db.prepare("UPDATE saetze SET daten=json_set(daten,'$.content',json(?1)) WHERE bereich=?2 AND id=?3")
      .bind(JSON.stringify(['runtime-schema6']),'runtime-workspace','runtime-page').run();
    const switchTest={switchIds:schalter,targetId:'E1',expected:soll};
    const checkPlan=async(expectedVersion:number)=>{
      const response=await client.callTool({name:'redion_read_schematic',arguments:{
        workspaceId:'runtime-workspace',blockId:'runtime-schema6',expectedVersion,switchTest
      }});
      return {response,body:JSON.parse(response.content[0].text)};
    };
    const report=await checkPlan(1);
    assert.equal(report.response.isError,undefined,JSON.stringify(report.body));
    assert.equal(report.body.report.status,'bestanden');
    assert.deepEqual(report.body.report.faelle.map((fall:{ist:boolean})=>fall.ist),soll);
    assert.deepEqual((await checkPlan(1)).body,report.body);
    assert.equal((await checkPlan(2)).body.code,'conflict');
    const messen=async(position:number)=>{
      const response=await client.callTool({name:'redion_read_schematic',arguments:{
        workspaceId:'runtime-workspace',blockId:'runtime-schema6',expectedVersion:1,
        operatingPoint:{switches:[{componentId:'S1',position}],componentIds:['E1']}
      }});
      return JSON.parse(response.content[0].text);
    };
    const an=(await messen(0)).report;
    assert.equal(an.status,'berechnet');
    assert.equal(an.wechsel,true);
    assert.ok(Math.abs(an.messwerte[0].wert.Ubetrag-230)<0.01);
    assert.ok(Math.abs(an.messwerte[0].wert.Ibetrag-100/230)<0.001);
    assert.ok(Math.abs(an.messwerte[0].wert.P-100)<0.01);
    const aus=(await messen(1)).report.messwerte[0].wert;
    assert.equal(aus.Ubetrag,0);
    assert.equal(aus.Ibetrag,0);
    assert.equal((await messen(2)).code,'invalid_arguments');
    const unchanged=await db.prepare('SELECT daten,version FROM saetze WHERE bereich=? AND id=?')
      .bind('runtime-workspace','runtime-schema6').first();
    assert.equal(unchanged.version,1);
    assert.deepEqual(JSON.parse(unchanged.daten).plan,kreuzplan);
    const denied=await client.callTool({name:'redion_create_page',arguments:{workspaceId:'runtime-workspace',title:'Gesperrt',requestId:'runtime_request'}});
    assert.equal(denied.isError,true);
    // Real workerd/D1 integration: exercise the new write tools, not only read.
    const writeStart=await oauth.begin('runtime-owner',{...args,scope:'redion:read redion:write'});
    if(writeStart.kind!=='consent')throw new Error('write consent expected');
    const writeApproval=await oauth.approve('runtime-owner',writeStart.requestId,writeStart.csrf,{
      allow:true,remember:true,workspaceIds:['runtime-workspace'],allowWrite:true
    });
    const writeResponse=await fetcher(origin+'/token',{method:'POST',body:new URLSearchParams({
      grant_type:'authorization_code',client_id:registration.client_id,
      code:new URL(writeApproval.redirect).searchParams.get('code')!,redirect_uri:args.redirect_uri,
      resource,code_verifier:verifier
    })});
    assert.equal(writeResponse.status,200);
    const writeTokens=await writeResponse.json();
    writer=new Client({name:'synthetic-workerd-writer',version:'1'});
    await writer.connect(new StreamableHTTPClientTransport(new URL(resource),{
      fetch:fetcher,requestInit:{headers:{Authorization:'Bearer '+writeTokens.access_token}}
    }));
    const invoke=async(name:string,arguments_:Record<string,unknown>)=>{
      const res=await writer.callTool({name,arguments:arguments_});
      return {res,payload:JSON.parse(res.content[0].text) as any};
    };
    // Real SQLite-in-workerd recursion: a page has a direct child which
    // references a Unicode-bearing grandchild. No synthetic JS in-memory
    // traversal or privileged production storage is used here.
    const putRuntimeBlock=async(id:string,data:Record<string,unknown>,encrypted=0)=>{
      await db.prepare(
        'INSERT INTO saetze(id,bereich,tabelle,daten,verschluesselt,seite,version,geloescht) '+
        'VALUES(?,?,?,?,?,?,1,0)'
      ).bind(id,'runtime-workspace','blocks',JSON.stringify(data),encrypted,'runtime-page').run();
    };
    await putRuntimeBlock('runtime_search_parent',{
      type:'text',text:'Sichtbarer Elternblock',parentId:'runtime-page',
      content:['runtime_search_leaf'],alive:true
    });
    await putRuntimeBlock('runtime_search_leaf',{
      type:'text',text:'LÜFTUNGSANLAGE Werkraum',parentId:'runtime_search_parent',
      content:[],alive:true
    });
    await db.prepare('UPDATE saetze SET daten=?1 WHERE bereich=?2 AND id=?3')
      .bind(JSON.stringify({type:'page',text:'Test',inhalt:'Isolierte Testdaten',
        content:['runtime_search_parent']}),'runtime-workspace','runtime-page').run();
    const deepSearch=await invoke('redion_search',{
      workspaceId:'runtime-workspace',query:'lüftungsanlage'
    });
    assert.equal(deepSearch.res.isError,undefined);
    assert.deepEqual(deepSearch.payload.documents.map((d:any)=>d.documentId),
      ['runtime-page']);
    const miss=await invoke('redion_search',{
      workspaceId:'runtime-workspace',query:'nichtvorhandenerbegriff'
    });
    assert.deepEqual(miss.payload.documents,[]);
    // Genuine D1 44-visible-child page, plus an encrypted reference.
    // The legacy read_block call must no longer fail above 40 children.
    const many=Array.from({length:43},(_,i)=>'runtime_large_child_'+i);
    for(let i=0;i<many.length;i++){
      await putRuntimeBlock(many[i]!,{
        type:'text',text:'Sichtbarer Testblock '+i,parentId:'runtime-page',
        content:[],alive:true
      });
    }
    await putRuntimeBlock('runtime_large_hidden',{
      type:'text',text:'VERTRAULICH',parentId:'runtime-page',content:[],alive:true
    },1);
    await db.prepare('UPDATE saetze SET daten=?1 WHERE bereich=?2 AND id=?3')
      .bind(JSON.stringify({type:'page',text:'Test',inhalt:'Isolierte Testdaten',
        content:['runtime_search_parent',...many,'runtime_large_hidden']}),
        'runtime-workspace','runtime-page').run();
    const largePreview=await invoke('redion_read_page',{
      workspaceId:'runtime-workspace',documentId:'runtime-page'
    });
    assert.equal(largePreview.res.isError,undefined);
    assert.equal(largePreview.payload.blockPreview.length,20);
    assert.equal(largePreview.payload.nextBlockOffset,20);
    assert.ok(!JSON.stringify(largePreview.payload).includes('VERTRAULICH'));
    const bigBlock=await invoke('redion_read_block',{
      workspaceId:'runtime-workspace',blockId:'runtime-page'
    });
    assert.equal(bigBlock.res.isError,undefined);
    assert.equal(bigBlock.payload.children.length,40);
    assert.equal(bigBlock.payload.nextChildOffset,40);
    const bigTail=await invoke('redion_read_block',{
      workspaceId:'runtime-workspace',blockId:'runtime-page',childOffset:40
    });
    assert.equal(bigTail.res.isError,undefined);
    assert.equal(bigTail.payload.children.length,4);
    assert.equal(bigTail.payload.nextChildOffset,null);
    assert.ok(!JSON.stringify(bigTail.payload).includes('runtime_large_hidden'));
    const create=async(title:string,requestId:string,parentId?:string)=>{
      const {res,payload}=await invoke('redion_create_page',{
        workspaceId:'runtime-workspace',title,content:'Ausgang',requestId,...(parentId?{parentId}:{})
      });
      assert.notEqual(res.isError,true,title);
      return payload.documentId as string;
    };
    const rootA=await create('Ordner A','runtime_root_a_001');
    const rootB=await create('Ordner B','runtime_root_b_001');
    const child=await create('Unterseite','runtime_child_001',rootA);
    const childrenA=await invoke('redion_list_child_pages',{workspaceId:'runtime-workspace',parentId:rootA});
    assert.notEqual(childrenA.res.isError,true);
    assert.deepEqual(childrenA.payload.documents.map((d:any)=>d.documentId),[child]);
    const append=await invoke('redion_append_content',{
      workspaceId:'runtime-workspace',documentId:child,content:'Nachtrag',expectedVersion:1
    });
    assert.notEqual(append.res.isError,true);
    assert.equal(append.payload.version,2);
    const stale=await invoke('redion_append_content',{
      workspaceId:'runtime-workspace',documentId:child,content:'Alt',expectedVersion:1
    });
    assert.equal(stale.res.isError,true);
    assert.equal(stale.payload.code,'conflict');
    const move=await invoke('redion_move_page',{
      workspaceId:'runtime-workspace',documentId:child,newParentId:rootB,expectedVersion:2
    });
    assert.notEqual(move.res.isError,true);
    assert.equal(move.payload.version,3);
    const childrenB=await invoke('redion_list_child_pages',{workspaceId:'runtime-workspace',parentId:rootB});
    assert.deepEqual(childrenB.payload.documents.map((d:any)=>d.documentId),[child]);
    const cyclic=await invoke('redion_move_page',{
      workspaceId:'runtime-workspace',documentId:rootB,newParentId:child,expectedVersion:1
    });
    assert.equal(cyclic.res.isError,true);
    assert.equal(cyclic.payload.code,'invalid_arguments');
    const readAfter=await invoke('redion_read_page',{workspaceId:'runtime-workspace',documentId:child});
    assert.equal(readAfter.payload.markdown,'Ausgang\nNachtrag');
    const schematic=await invoke('redion_add_schematic',{
      workspaceId:'runtime-workspace',documentId:rootA,
      art:'installationsplan',titel:'Runtime Installationsplan',expectedVersion:1,
      requestId:'runtime_schematic_0001'
    });
    assert.equal(schematic.res.isError,undefined);
    const plan=await invoke('redion_read_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId
    });
    assert.equal(plan.res.isError,undefined);
    assert.equal(plan.payload.plan.art,'installationsplan');
    assert.deepEqual(plan.payload.plan.teile,[]);
    const retry=await invoke('redion_add_schematic',{
      workspaceId:'runtime-workspace',documentId:rootA,
      art:'installationsplan',titel:'Runtime Installationsplan',expectedVersion:1,
      requestId:'runtime_schematic_0001'
    });
    assert.equal(retry.payload.alreadyExists,true);
    const partA=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:1,operation:'add_component',
      componentId:'runtime_P1',symbolId:'bp-sonnerie',x:100,y:100,bmk:'P1'
    });
    assert.equal(partA.res.isError,undefined);
    assert.equal(partA.payload.version,2);
    const partB=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:2,operation:'add_component',
      componentId:'runtime_S1',symbolId:'bp-sonneriedruck',x:400,y:100,bmk:'S1'
    });
    assert.equal(partB.res.isError,undefined);
    const connection=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:3,operation:'connect_terminals',wireId:'runtime_wire_1',
      fromComponentId:'runtime_P1',fromTerminal:'X1',
      toComponentId:'runtime_S1',toTerminal:'3'
    });
    assert.equal(connection.res.isError,undefined);
    assert.equal(connection.payload.version,4);
    assert.equal(connection.payload.electricalValidation,false);
    const updatedPlan=await invoke('redion_read_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId
    });
    assert.equal(updatedPlan.payload.version,4);
    assert.equal(updatedPlan.payload.plan.teile.length,2);
    assert.equal(updatedPlan.payload.plan.leitungen.length,1);
    const staleEdit=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:3,operation:'add_label',labelId:'stale_label',
      labelText:'Darf nicht hinein',x:100,y:100
    });
    assert.equal(staleEdit.res.isError,true);
    assert.equal(staleEdit.payload.code,'conflict');
    const connectedMove=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:4,operation:'move_component',
      componentId:'runtime_P1',x:160,y:160
    });
    assert.equal(connectedMove.res.isError,true);
    assert.equal(connectedMove.payload.code,'invalid_arguments');
    const extraPart=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:4,operation:'add_component',
      componentId:'runtime_free',symbolId:'bp-sonnerie',x:650,y:300
    });
    assert.equal(extraPart.res.isError,undefined);
    assert.equal(extraPart.payload.version,5);
    const moved=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:5,operation:'move_component',
      componentId:'runtime_free',x:700,y:340
    });
    assert.equal(moved.res.isError,undefined);
    assert.equal(moved.payload.version,6);
    const label=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:6,operation:'add_label',
      labelId:'runtime_label',labelText:'Schulungsplan',x:700,y:400
    });
    assert.equal(label.res.isError,undefined);
    const movedLabel=await invoke('redion_update_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId,
      expectedVersion:7,operation:'move_label',labelId:'runtime_label',x:700,y:450
    });
    assert.equal(movedLabel.res.isError,undefined);
    const finalSchematic=await invoke('redion_read_schematic',{
      workspaceId:'runtime-workspace',blockId:schematic.payload.blockId
    });
    assert.equal(finalSchematic.payload.version,8);
    assert.equal(finalSchematic.payload.plan.teile.find((p:any)=>p.id==='runtime_free').x,700);
    assert.equal(finalSchematic.payload.plan.texte.find((p:any)=>p.id==='runtime_label').y,450);
    assert.deepEqual(finalSchematic.payload.plan.leitungen,updatedPlan.payload.plan.leitungen);



    const task=await invoke('redion_add_block',{
      workspaceId:'runtime-workspace',documentId:rootA,
      expectedVersion:2,typ:'todo',text:'ÜK-Auftrag wiederholen',
      requestId:'runtime_task_edit_01'
    });
    assert.equal(task.res.isError,undefined);
    const checkedTask=await invoke('redion_update_block',{
      workspaceId:'runtime-workspace',blockId:task.payload.blockId,
      expectedVersion:1,operation:'set_checked',checked:true
    });
    assert.equal(checkedTask.res.isError,undefined);
    assert.equal(checkedTask.payload.version,2);
    const dueTask=await invoke('redion_update_block',{
      workspaceId:'runtime-workspace',blockId:task.payload.blockId,
      expectedVersion:2,operation:'set_due_date',dueDate:'2026-12-12'
    });
    assert.equal(dueTask.res.isError,undefined);
    assert.equal(dueTask.payload.version,3);
    const textTask=await invoke('redion_update_block',{
      workspaceId:'runtime-workspace',blockId:task.payload.blockId,
      expectedVersion:3,operation:'set_text',text:'Praktischen Auftrag prüfen'
    });
    assert.equal(textTask.payload.version,4);
    const staleTask=await invoke('redion_update_block',{
      workspaceId:'runtime-workspace',blockId:task.payload.blockId,
      expectedVersion:2,operation:'set_checked',checked:false
    });
    assert.equal(staleTask.res.isError,true);
    assert.equal(staleTask.payload.code,'conflict');
    const readTask=await invoke('redion_read_block',{
      workspaceId:'runtime-workspace',blockId:task.payload.blockId
    });
    assert.equal(readTask.payload.version,4);
    assert.equal(readTask.payload.text,'Praktischen Auftrag prüfen');
    assert.equal(readTask.payload.data.checked,true);
    assert.equal(readTask.payload.data.faellig,'2026-12-12');
    const openTasks=await invoke('redion_list_tasks',{
      workspaceId:'runtime-workspace',nurOffen:true
    });
    assert.ok(!openTasks.payload.tasks.some((x:any)=>x.taskId===task.payload.blockId));
    await oauth.revokeGrant('runtime-owner',(await oauth.listGrants('runtime-owner'))[0]!.id);
    assert.equal((await fetcher(resource,{headers:{Authorization:'Bearer '+tokens.access_token}})).status,401);
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM saetze').first()).n,53);
    assert.deepEqual(outbound,[],'Keine ausgehenden Netzaufrufe');
  }finally{await Promise.allSettled([client?.close(),writer?.close()]);await mf.dispose();}
});
