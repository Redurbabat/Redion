import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { StringDecoder } from 'node:string_decoder';
import { fault, type ActionResult } from '../../../windows/automation-contract.cts';

export function discoveryPath():string {
  if(process.env.REDION_MCP_DISCOVERY)return path.resolve(process.env.REDION_MCP_DISCOVERY);
  const profile=process.env.REDION_MCP_PROFILE||'production';
  if(!['production','development'].includes(profile))throw fault('INVALID_PROFILE','Unbekanntes Redion-Profil.');
  const appData=process.env.APPDATA||path.join(os.homedir(),'AppData','Roaming');
  return path.join(appData,profile==='development'?'Redion-Entwicklung':'Redion','automation','connection.json');
}
function readRecord(file:string):Record<string,unknown> {
  const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384)throw fault('INVALID_DISCOVERY','Ungültige lokale Verbindungsdatei.');
  return JSON.parse(fs.readFileSync(file,'utf8')) as Record<string,unknown>;
}
export class BridgeClient {
  private socket:net.Socket|null=null;
  private connecting:Promise<void>|null=null;
  private pending:((result:ActionResult)=>void)|null=null;
  private pendingSocket:net.Socket|null=null;
  private queue:Promise<unknown>=Promise.resolve();
  private buffer='';
  private sessionId='';
  private readonly file=discoveryPath();
  status():Record<string,unknown> {
    try {
      const runtime=readRecord(path.join(path.dirname(this.file),'runtime.json'));
      if(typeof runtime.pid!=='number')return {running:false,status:'APP_NOT_RUNNING'};
      try{process.kill(runtime.pid,0);}catch{return {running:false,status:'APP_NOT_RUNNING'};}
      return {running:true,status:fs.existsSync(this.file)?'AVAILABLE':'CONNECTION_DISABLED',connected:!!this.socket&&!this.socket.destroyed};
    }catch{return {running:false,status:'APP_NOT_RUNNING',connected:false};}
  }
  private async connect():Promise<void> {
    if(this.socket&&!this.socket.destroyed&&this.sessionId)return;
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
    const socket=net.createConnection(record.pipe);this.socket=socket;this.buffer='';const decoder=new StringDecoder('utf8');
    socket.on('data',(chunk:Buffer)=>{
      this.buffer+=decoder.write(chunk);
      if(Buffer.byteLength(this.buffer)>2*1024*1024){socket.destroy();return;}
      const newline=this.buffer.indexOf('\n');if(newline<0)return;
      const raw=this.buffer.slice(0,newline);this.buffer=this.buffer.slice(newline+1);
      let result:ActionResult;
      try{result=JSON.parse(raw) as ActionResult;}catch{socket.destroy();return;}
      if(this.pendingSocket!==socket)return;
      const callback=this.pending;this.pending=null;this.pendingSocket=null;
      callback?.({ok:result.ok===true,...(result.data?{data:result.data}:{}),...(result.error?{error:result.error}:{}),...(result.operationId?{operationId:result.operationId}:{})});
    });
    const closed=()=>{
      if(this.socket===socket){this.socket=null;this.sessionId='';}
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
    const result=await this.exchange({kind:'hello',protocol:1,token:record.token,client:'RED Ion MCP'});
    if(!result.ok){socket.destroy();throw fault(result.error?.code||'UNAUTHORIZED','Die lokale Sitzung wurde nicht freigegeben.');}
    this.sessionId=String(result.data?.sessionId||'');
  }
  private exchange(frame:Record<string,unknown>):Promise<ActionResult> {
    return new Promise(resolve=>{
      const socket=this.socket;
      if(!socket||socket.destroyed){resolve({ok:false,error:{code:'APP_UNREACHABLE',message:'Redion ist nicht verbunden.'}});return;}
      const timer=setTimeout(()=>{
        if(this.pendingSocket===socket){this.pending=null;this.pendingSocket=null;}socket.destroy();resolve({ok:false,error:{code:'RESULT_UNKNOWN',message:'Zeitlimit erreicht. Ergebnis in Redion prüfen; nicht blind wiederholen.'}});
      },55000);
      this.pendingSocket=socket;this.pending=result=>{clearTimeout(timer);resolve(result);};socket.write(JSON.stringify(frame)+'\n');
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
  close():void {this.socket?.destroy();this.socket=null;this.sessionId='';}
}
