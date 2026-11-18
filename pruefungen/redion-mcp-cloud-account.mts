import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudFixture} from './helfer/mcp-cloud.mts';
import {cloudDatabase} from './helfer/mcp-cloud-database.mts';
import {cloudUserFromAccess,createCloudAuthorization} from '../server/mcp/account.ts';
import {schluesselVergessen} from '../server/sicherheit/tor.ts';
import {pkceChallenge} from '../server/mcp/oauth.ts';

const env={ACCESS_TEAM:'synthetic.cloudflareaccess.com',ACCESS_AUD:'synthetic-redion'};
const b64=(value:unknown)=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
const fixture=async()=>{
  const f=cloudFixture(),db=cloudDatabase(f.sqlite);
  const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
  const publicKey=await crypto.subtle.exportKey('jwk',pair.publicKey);
  const fetchKeys:typeof fetch=async()=>new Response(JSON.stringify({keys:[{...publicKey,kid:'synthetic-key'}]}),{headers:{'Content-Type':'application/json'}});
  const signed=async(patch:Record<string,unknown>={})=>{
    const data=b64({alg:'RS256',kid:'synthetic-key'})+'.'+b64({iss:'https://synthetic.cloudflareaccess.com',sub:'first-user',email:'synthetic@example.invalid',type:'app',
      aud:[env.ACCESS_AUD],exp:Math.floor(f.now()/1000)+3600,...patch});
    const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(data));
    return data+'.'+Buffer.from(signature).toString('base64url');
  };
  schluesselVergessen();return {...f,...db,fetchKeys,signed,options:{now:f.now,fetchKeys,create:true}};
};

test('Cloud-Konto entsteht nur aus geprüftem Access-Nachweis und bleibt getrennt von gleichen Mailadressen',async()=>{
  const f=await fixture();try{
    f.sqlite.prepare('INSERT INTO konten(id,mail,gesperrt) VALUES(?,?,0)').run('existing-google-account','synthetic@example.invalid');
    const token=await f.signed(),request=new Request('https://app.example.test/mcp/authorize',{headers:{'Cf-Access-Jwt-Assertion':token}});
    const first=await cloudUserFromAccess(request,f.database,env,f.options);assert.ok(first);assert.notEqual(first.id,'existing-google-account');
    assert.equal(first.workspaces.length,1);assert.equal(first.workspaces[0]!.canWrite,true);
    assert.deepEqual(await cloudUserFromAccess(request,f.database,env,f.options),first);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM konten').get()!.n,2);
    f.sqlite.prepare('UPDATE konten SET gesperrt=1 WHERE id=?').run(first.id);
    assert.equal(await cloudUserFromAccess(request,f.database,env,f.options),null);
  }finally{f.close();schluesselVergessen();}
});
test('Offenes Tor, gefälschter Header, fremde Audience/Issuer und Dienstidentität ergeben kein Cloud-Konto',async()=>{
  const f=await fixture();try{
    const request=(token:string)=>new Request('https://app.example.test/mcp/authorize',{headers:{'Cf-Access-Jwt-Assertion':token,'X-Redion-User':'owner'}});
    assert.equal(await cloudUserFromAccess(request(await f.signed()),f.database,{TOR:'offen'},f.options),null);
    assert.equal(await cloudUserFromAccess(request('not-a-signed-token'),f.database,env,f.options),null);
    for(const patch of [{aud:['foreign-audience']},{iss:'https://other.cloudflareaccess.com'},{sub:''},{type:'service'},{email:''},{exp:Math.floor(f.now()/1000)-1}])
      assert.equal(await cloudUserFromAccess(request(await f.signed(patch)),f.database,env,f.options),null);
    assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM konten').get()!.n,0);
  }finally{f.close();schluesselVergessen();}
});
test('Geschützte OAuth-Seite verbindet den echten Konto-Resolver mit dem vorhandenen Datenmodell',async()=>{
  const f=await fixture();try{
    const client=await f.oauth.register({client_name:'Synthetic AI',redirect_uris:['https://ai.example.test/cb']});
    const args=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0]!,response_type:'code',scope:'redion:read',
      resource:'https://mcp.example.test/mcp',code_challenge:await pkceChallenge('c'.repeat(64)),code_challenge_method:'S256'});
    const authorization=createCloudAuthorization({database:f.database,env,issuer:'https://mcp.example.test',authorizationEndpoint:'https://app.example.test/mcp/authorize',
      now:f.now,fetchKeys:f.fetchKeys});
    const response=await authorization(new Request('https://app.example.test/mcp/authorize?'+args,{headers:{Cookie:'CF_Authorization='+await f.signed()}}));
    assert.equal(response?.status,200);const html=await response!.text();assert.ok(html.includes('Mein Redion'));assert.ok(html.includes('workspace'));
    assert.equal(await authorization(new Request('https://app.example.test/index.html')),null);
  }finally{f.close();schluesselVergessen();}
});
