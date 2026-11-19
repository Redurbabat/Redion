import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fault, type ActionResult } from '../../../windows/automation-contract.cts';
import { ResponseFrames, type BridgeResponse } from './response-frames.mts';

export function discoveryPath():string {
  if(process.env.REDION_MCP_DISCOVERY)return path.resolve(process.env.REDION_MCP_DISCOVERY);
  const profile=process.env.REDION_MCP_PROFILE||'auto';
  if(!['auto','production','development'].includes(profile))throw fault('INVALID_PROFILE','Unbekanntes Redion-Profil.');
  const appData=process.env.APPDATA||path.join(os.homedir(),'AppData','Roaming');
  if(profile==='auto') {
    const active=['Redion','Redion-Entwicklung'].map(name=>path.join(appData,name,'automation','connection.json')).filter(file=>{
      try{const marker=readRecord(path.join(path.dirname(file),'runtime.json'));if(!Number.isSafeInteger(marker.pid)||Number(marker.pid)<=0)return false;process.kill(Number(marker.pid),0);return true;}catch{return false;}
    });
    if(active.length>1)throw fault('AMBIGUOUS_PROFILE','Mehrere Redion-Profile sind aktiv. Das gewünschte Profil ausdrücklich wählen.');
    if(active.length===1)return active[0]!;
  }
  return path.join(appData,profile==='development'?'Redion-Entwicklung':'Redion','automation','connection.json');
}
function readRecord(file:string):Record<string,unknown> {
  const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384)throw fault('INVALID_DISCOVERY','Ungültige lokale Verbindungsdatei.');
  return JSON.parse(fs.readFileSync(file,'utf8')) as Record<string,unknown>;
}
function clientIdentity(file:string):string {
  const directory=path.dirname(file),stat=fs.lstatSync(directory);
  if(!stat.isDirectory()||stat.isSymbolicLink())throw fault('INVALID_DISCOVERY','Ungültiger Adapterordner.');
  const identityFile=path.join(directory,'mcp-client-identity.json');
  if(!fs.existsSync(identityFile)) {
    let descriptor:number|undefined;
    try{descriptor=fs.openSync(identityFile,'wx',0o600);fs.writeFileSync(descriptor,JSON.stringify({id:crypto.randomBytes(32).toString('hex')}));}
    catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
    finally{if(descriptor!==undefined)fs.closeSync(descriptor);}
  }
  const identity=readRecord(identityFile);
  if(typeof identity.id!=='string'||!/^[a-f0-9]{64}$/.test(identity.id))throw fault('INVALID_CLIENT_ID','Die lokale Adapterkennung ist beschädigt.');
  return identity.id;
}
export class BridgeClient {
  private socket:net.Socket|null=null;
  private connecting:Promise<void>|null=null;
  private pending:((result:BridgeResponse)=>void)|null=null;
  private pendingSocket:net.Socket|null=null;
  private queue:Promise<unknown>=Promise.resolve();
  private sessionId='';
  private expiresAt=0;
  private get file():string{return discoveryPath();}
  status():Record<string,unknown> {
    try {
      const runtime=readRecord(path.join(path.dirname(this.file),'runtime.json'));
      if(typeof runtime.pid!=='number')return {running:false,status:'APP_NOT_RUNNING'};
      try{process.kill(runtime.pid,0);}catch{return {running:false,status:'APP_NOT_RUNNING'};}
      return {running:true,status:fs.existsSync(this.file)?'AVAILABLE':'CONNECTION_DISABLED',connected:!!this.socket&&!this.socket.destroyed&&Date.now()<this.expiresAt,
        profile:runtime.profile,bridgeVersion:runtime.bridgeVersion||'unknown'};
    }catch(error){
      if((error as {code?:string}).code==='AMBIGUOUS_PROFILE')return {running:true,status:'AMBIGUOUS_PROFILE',connected:false,selectionRequired:true};
      return {running:false,status:'APP_NOT_RUNNING',connected:false};
    }
  }
  private async connect():Promise<void> {
    if(this.socket&&!this.socket.destroyed&&this.sessionId&&Date.now()<this.expiresAt)return;
    if(this.socket)this.close();
    if(this.connecting)return this.connecting;
    this.connecting=this.connectInner().finally(()=>{this.connecting=null;});return this.connecting;
  }
  private async connectInner():Promise<void> {
    let record:Record<string,unknown>;
    try{record=readRecord(this.file);}catch{throw fault(String(this.status().status),'Redion läuft nicht oder die Verbindung ist deaktiviert.');}
    if(record.protocol!==1||typeof record.token!=='string'||!/^[a-f0-9]{64}$/.test(record.token)||typeof record.pipe!=='string')
      throw fault('INVALID_DISCOVERY','Die App-Verbindung ist nicht vertrauenswürdig.');
    if(process.platform==='win32'&&!/^\\\\\.\\pipe\\redion-mcp-[a-f0-9]{40}$/.test(record.pipe))throw fault('INVALID_DISCOVERY','Unzulässiger Kommunikationskanal.');
    if(process.platform!=='win32'&&path.dirname(record.pipe)!==path.dirname(this.file))throw fault('INVALID_DISCOVERY','Unzulässiger Kommunikationskanal.');
    const socket=net.createConnection(record.pipe);this.socket=socket;const frames=new ResponseFrames();
    socket.on('data',(chunk:Buffer)=>{
      try {for(const result of frames.push(chunk)) {
        if(this.pendingSocket!==socket||!this.pending){socket.destroy();return;}
        const callback=this.pending;this.pending=null;this.pendingSocket=null;callback(result);
      }}catch{socket.destroy();}
    });
    const closed=()=>{
      if(this.socket===socket){this.socket=null;this.sessionId='';this.expiresAt=0;}
      if(this.pendingSocket!==socket)return;
      const callback=this.pending;this.pending=null;this.pendingSocket=null;
      callback?.({ok:false,error:{code:'RESULT_UNKNOWN',message:'Die App-Verbindung brach ab. Ergebnis vor erneutem Schreiben in Redion prüfen.'}});
    };
    socket.on('error',()=>{});socket.on('close',closed);
    await new Promise<void>((resolve,reject)=>{
      const timer=setTimeout(()=>{socket.destroy();reject(fault('APP_UNREACHABLE','Redion antwortet nicht.'));},5000);
      socket.once('connect',()=>{clearTimeout(timer);resolve();});
      socket.once('error',()=>{clearTimeout(timer);reject(fault('APP_UNREACHABLE','Redion ist nicht erreichbar.'));});
    });
    const result=await this.exchange({kind:'hello',protocol:1,token:record.token,client:'RED Ion MCP',clientId:clientIdentity(this.file)});
    if(!result.ok){socket.destroy();throw fault(result.error?.code||'UNAUTHORIZED','Die lokale Sitzung wurde nicht freigegeben.');}
    this.sessionId=String(result.data?.sessionId||'');
    this.expiresAt=Date.parse(String(result.data?.expires||''))||Date.now()+25*60*1000;
  }
  private exchange(frame:Record<string,unknown>):Promise<BridgeResponse> {
    return new Promise(resolve=>{
      const socket=this.socket;
      if(!socket||socket.destroyed){resolve({ok:false,error:{code:'APP_UNREACHABLE',message:'Redion ist nicht verbunden.'}});return;}
      const timer=setTimeout(()=>{
        if(this.pendingSocket===socket){this.pending=null;this.pendingSocket=null;}socket.destroy();resolve({ok:false,error:{code:'RESULT_UNKNOWN',message:'Zeitlimit erreicht. Ergebnis in Redion prüfen; nicht blind wiederholen.'}});
      },55000);
      this.pendingSocket=socket;this.pending=result=>{
        clearTimeout(timer);
        if(result.id!==frame.id){socket.destroy();resolve({ok:false,error:{code:'INVALID_FRAME',message:'Die Antwort gehört nicht zum Auftrag.'}});return;}
        const {id:_id,...payload}=result;resolve(payload);
      };socket.write(JSON.stringify(frame)+'\n');
    });
  }
  call(name:string,input:Record<string,unknown>):Promise<ActionResult> {
    const work=async():Promise<ActionResult>=>{
      try {
        if(name==='redion_launch_app'&&this.status().running!==true)return this.launch(input);
        if(name==='redion_get_status'&&!fs.existsSync(this.file))return {ok:true,data:this.status()};
        await this.connect();
        const result=await this.exchange({kind:'call',id:crypto.randomUUID(),tool:name,arguments:input});
        if(result.error?.code==='SESSION_EXPIRED')this.close();
        return result;
      }catch(e:unknown){return {ok:false,error:{code:(e as {code?:string}).code||'CONNECTION_FAILED',message:'Die freigegebene Redion-App konnte nicht verbunden werden.'}};}
    };
    const result=this.queue.then(work,work);this.queue=result.catch(()=>{});return result;
  }
  image(artifactId:string):Promise<BridgeResponse> {
    const work=async():Promise<BridgeResponse>=>{
      try{await this.connect();return await this.exchange({kind:'image',id:crypto.randomUUID(),artifactId});}
      catch{return {ok:false,error:{code:'IMAGE_UNAVAILABLE',message:'Das freigegebene Bild ist nicht mehr verfügbar.'}};}
    };
    const result=this.queue.then(work,work);this.queue=result.catch(()=>{});return result;
  }
  private launch(input:Record<string,unknown>):ActionResult {
    if(input.allowLaunch!==true)throw fault('CONSENT_REQUIRED','App-Start muss ausdrücklich erlaubt sein.');
    const record=readRecord(path.join(path.dirname(this.file),'launcher.json'));
    const policy=readRecord(path.join(path.dirname(this.file),'policy.json'));
    if(policy.enabled!==true||policy.allowLaunch!==true||!Array.isArray(policy.scopes)||!policy.scopes.includes('app')||record.allowed!==true||record.protocol!==1||typeof record.executable!=='string'||typeof record.sha256!=='string')throw fault('LAUNCH_DISABLED','App-Start ist in Redion nicht freigegeben.');
    const executable=fs.realpathSync(record.executable);
    if(!path.isAbsolute(executable)||!executable.toLowerCase().endsWith('.exe'))throw fault('UNTRUSTED_EXECUTABLE','Ungültiger App-Pfad.');
    const hash=crypto.createHash('sha256').update(fs.readFileSync(executable)).digest('hex');
    if(hash!==record.sha256)throw fault('EXECUTABLE_CHANGED','Die App wurde aktualisiert. Den Startpfad erneut in Redion freigeben.');
    const process=spawn(executable,[],{windowsHide:true,detached:true,stdio:'ignore'});process.on('error',()=>{});process.unref();
    return {ok:true,data:{launchRequested:true,connected:false}};
  }
  close():void {this.socket?.destroy();this.socket=null;this.sessionId='';this.expiresAt=0;}
}
