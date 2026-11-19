import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import {execFileSync} from 'node:child_process';
import type {AddressInfo} from 'node:net';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {cloudFixture} from './helfer/mcp-cloud.mts';
import {pkceChallenge} from '../server/mcp/oauth.ts';

test('Synthetischer HTTPS-Browser: Freigabe, Arbeitsbereichswahl, gemerkte Zustimmung und Widerruf',async()=>{
  const output=path.resolve('bilder/redion-mcp/cloud');await fs.mkdir(output,{recursive:true});
  const certificate=path.join(output,'synthetisch-'+crypto.randomUUID()+'.pfx');
  execFileSync('pwsh.exe',['-NoProfile','-File',fileURLToPath(new URL('./helfer/mcp-cloud-tls.ps1',import.meta.url)),'-OutputFile',certificate],{windowsHide:true,stdio:'pipe'});
  const tls=await fs.readFile(certificate);await fs.unlink(certificate);
  let fixture:ReturnType<typeof cloudFixture>|undefined;
  const server=https.createServer({pfx:tls,passphrase:''},async(request,response)=>{
    try{
      if(!fixture)throw new Error('Test fixture not ready');
      const base='https://127.0.0.1:'+(server.address() as AddressInfo).port;
      const chunks:Buffer[]=[];let length=0;
      for await(const chunk of request){length+=chunk.length;if(length>16384)throw new Error('Synthetic request too large');chunks.push(chunk);}
      const init:RequestInit={method:request.method!,headers:new Headers(Object.entries(request.headers).flatMap(([k,v]):[string,string][]=>typeof v==='string'?[[k,v]]:[]))};
      if(chunks.length)init.body=Buffer.concat(chunks).toString('utf8');
      const result=await fixture.fetcher(base+request.url,init);
      response.writeHead(result.status,Object.fromEntries(result.headers));response.end(await result.text());
    }catch{response.writeHead(500);response.end('Synthetic server failed');}
  });
  const callbackServer=http.createServer((_request,response)=>{response.writeHead(200,{'Content-Type':'text/plain'});response.end('Synthetischer Callback');});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  await new Promise<void>(resolve=>callbackServer.listen(0,'127.0.0.1',resolve));
  const origin='https://127.0.0.1:'+(server.address() as AddressInfo).port;
  const callbackOrigin='http://127.0.0.1:'+(callbackServer.address() as AddressInfo).port;
  const f=cloudFixture({issuer:origin,authorizationEndpoint:origin+'/mcp/authorize'});fixture=f;
  let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
  try{
    browser=await chromium.launch({headless:true});
    const client=await f.oauth.register({client_name:'Künstlicher KI-Testclient',redirect_uris:[callbackOrigin+'/callback']});
    const auth=new URL(origin+'/mcp/authorize');
    auth.search=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0]!,response_type:'code',scope:'redion:read',
      resource:origin+'/mcp',code_challenge:await pkceChallenge('x'.repeat(64)),code_challenge_method:'S256',state:'synthetic-state'}).toString();
    for(const [name,width,height,theme] of [['desktop-light',1100,1080,'light'],['desktop-dark',1100,1080,'dark'],['mobile-light',390,1000,'light']] as const){
      /* Nur dieser isolierte Testkontext vertraut seinem flüchtigen Zertifikat. */
      const context=await browser.newContext({viewport:{width,height},colorScheme:theme,ignoreHTTPSErrors:true});
      const page=await context.newPage();const violations:string[]=[];
      page.on('console',message=>{if(message.type()==='error'&&message.text().includes('Content Security Policy'))violations.push(message.text());});
      await page.goto(auth.href);
      await page.getByRole('heading',{name:'KI mit RED Ion verbinden'}).waitFor();
      assert.equal(await page.locator('input[name=workspace]:checked').count(),0);
      assert.equal(await page.locator('input[name=write]').count(),0);
      assert.ok(await page.getByText('Diese Freigabe bis zum Widerruf merken').isVisible());
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});
      if(name==='desktop-light'){
        await page.getByLabel('Künstlicher Unterricht').check();
        await page.getByRole('button',{name:'Verbindung erlauben'}).click();
        await page.waitForURL(url=>url.origin===callbackOrigin&&url.pathname==='/callback',{timeout:5000});
        assert.deepEqual(violations,[],'Browser-CSP darf den registrierten OAuth-Rückweg nicht blockieren.');
        assert.ok(new URL(page.url()).searchParams.get('code'));
        await page.goto(auth.href);await page.waitForURL(url=>url.origin===callbackOrigin&&url.pathname==='/callback');
        assert.deepEqual((await f.oauth.listGrants('owner'))[0]?.scopes,['redion:read']);
        const upgrade=new URL(auth);upgrade.searchParams.set('scope','redion:read redion:write');
        await page.goto(upgrade.href);
        await page.getByRole('heading',{name:'KI mit RED Ion verbinden'}).waitFor();
        assert.equal(await page.locator('input[name=write]').isChecked(),false);
        await page.screenshot({path:path.join(output,'schreibfreigabe-aus.png'),fullPage:true});
        await page.goto(origin+'/mcp/settings');
        await page.getByRole('heading',{name:'Freigegebene KI-Verbindungen'}).waitFor();
        await page.screenshot({path:path.join(output,'freigaben-light.png'),fullPage:true});
        await page.getByRole('button',{name:'Freigabe widerrufen'}).click();
        await page.getByText('Keine KI-Verbindung ist freigegeben.').waitFor();
        assert.equal((await f.oauth.listGrants('owner')).length,0);
      }
      await context.close();
    }
  }finally{
    await browser?.close();
    await Promise.all([server,callbackServer].map(listener=>new Promise<void>((resolve,reject)=>listener.close(error=>error?reject(error):resolve()))));
    f.close();
  }
});
