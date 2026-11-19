import fs = require('node:fs');
import path = require('node:path');
import net = require('node:net');
import crypto = require('node:crypto');
import child = require('node:child_process');
import { definition, fault, SCOPES, TOOLS, validateCall, type ActionResult } from './automation-contract.cjs';
import { VisualArtifacts, type ImageMetadata } from './visual-artifacts.cjs';

export type Policy = { enabled: boolean; write: boolean; allowLaunch: boolean; scopes: string[];
  rememberClients: boolean; confirmCritical: boolean; confirmImages:boolean };
type Audit = { operationId: string; sessionId: string; tool: string; time: string; status: 'running'|'completed'|'failed'; code?: string;
  image?:{bytes:number;width:number;height:number;target:string} };
type Session = { id: string; socket: net.Socket; client: string; clientId?: string; persistent: boolean; expires: number; epoch: number;captures:number[] };
type ClientGrant = { id: string; client: string; approvedAt: string; policy: string };
type Options = { userData: string; profile: string; invoke: (tool: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
  confirm: (title: string, detail: string, signal?: AbortSignal,previewId?:number) => Promise<boolean>; changed: () => void; cancel: () => void;
  capture?: (input:Record<string,unknown>,check:()=>void,confirm:(title:string,detail:string,previewId?:number)=>Promise<boolean>,confirmImage:boolean)=>Promise<{bytes:Buffer;info:Omit<ImageMetadata,'artifactId'|'bytes'|'sha256'|'expires'>}>;
  focus: () => void; executable?: string; secure?: (directory: string) => void };
const canonical = (value: unknown): string => JSON.stringify(value, (_key, v: unknown) =>
  v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))) : v);
const fingerprint = (tool: string, input: Record<string, unknown>): string => crypto.createHash('sha256').update(tool+canonical(input)).digest('hex');
const equal = (a: unknown,b: string): boolean => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
const defaults = (): Policy => ({enabled:false,write:false,allowLaunch:false,scopes:['app','documents'],rememberClients:true,confirmCritical:true,confirmImages:true});
export function secureDirectory(directory: string): void {
  if (fs.existsSync(directory) && (fs.lstatSync(directory).isSymbolicLink() || !fs.lstatSync(directory).isDirectory()))
    throw fault('UNSAFE_DIRECTORY','Das Verbindungsverzeichnis ist nicht vertrauenswürdig.');
  fs.mkdirSync(directory,{recursive:true,mode:0o700});
  if (process.platform === 'win32') {
    const identity=child.execFileSync('whoami.exe',['/user','/fo','csv','/nh'],{encoding:'utf8',windowsHide:true});
    const sid=identity.match(/S-1-\d+(?:-\d+)+/)?.[0];
    if (!sid) throw fault('ACL_FAILED','Die Windows-Benutzerkennung konnte nicht geprüft werden.');
    child.execFileSync('icacls.exe',[directory,'/inheritance:r','/grant:r','*'+sid+':(OI)(CI)F'],{stdio:'pipe',windowsHide:true});
  } else fs.chmodSync(directory,0o700);
}
export class AutomationBridge {
  private policy: Policy=defaults();
  private server: net.Server|null=null;
  private token='';
  private epoch=0;
  private queue: Promise<unknown>=Promise.resolve();
  private sessions=new Map<net.Socket,Session>();
  private sockets=new Set<net.Socket>();
  private approvals=new Map<string,{session:string;fingerprint:string;expires:number}>();
  private audit: Audit[]=[];
  private pairing:net.Socket|null=null;
  private consents=new Map<AbortController,net.Socket|null>();
  private trustedClients=new Map<string,ClientGrant>();
  private lastPairing=0;
  private readonly images=new VisualArtifacts();
  private readonly directory: string;
  readonly discovery: string;
  constructor(private readonly options: Options) {
    this.directory=path.join(options.userData,'automation');
    this.discovery=path.join(this.directory,'connection.json');
    try {
      if(!this.safeDirectory())throw new Error('Unsafe directory');
      const policyFile=path.join(this.directory,'policy.json'),stat=fs.lstatSync(policyFile);
      if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384)throw new Error('Unsafe policy');
      const p=JSON.parse(fs.readFileSync(policyFile,'utf8')) as Partial<Policy>;
      this.policy={enabled:p.enabled===true,write:p.write===true,allowLaunch:p.allowLaunch===true,
        // Eine alte gespeicherte Konfiguration erweitert keine vorhandene Freigabe.
        rememberClients:p.rememberClients===true,confirmCritical:p.confirmCritical!==false,confirmImages:p.confirmImages!==false,
        scopes:Array.isArray(p.scopes)?p.scopes.filter(s=>SCOPES.includes(s as typeof SCOPES[number])):defaults().scopes};
      const grantsFile=path.join(this.directory,'client-grants.json'),grantsStat=fs.lstatSync(grantsFile,{throwIfNoEntry:false});
      if(grantsStat?.isFile()&&!grantsStat.isSymbolicLink()&&grantsStat.size<=16384) {
        const saved=JSON.parse(fs.readFileSync(grantsFile,'utf8')) as {version?:unknown;clients?:unknown};
        if(saved.version===1&&Array.isArray(saved.clients)&&saved.clients.length<=20) {
          for(const g of saved.clients as Partial<ClientGrant>[]) {
            if(typeof g.id==='string'&&/^[a-f0-9]{64}$/.test(g.id)&&typeof g.client==='string'&&/^[A-Za-z0-9 ._-]{1,64}$/.test(g.client)&&
              typeof g.approvedAt==='string'&&g.approvedAt.length<=30&&g.policy===this.policyFingerprint())
              this.trustedClients.set(g.id,g as ClientGrant);
          }
        }
      }
    } catch { /* Fehlende oder kaputte Konfiguration bleibt aus. */ }
  }
  private safeDirectory():boolean {
    try{const stat=fs.lstatSync(this.directory);return stat.isDirectory()&&!stat.isSymbolicLink();}catch{return false;}
  }
  private writeLocal(name:string,value:unknown):void {
    if(!this.safeDirectory())throw fault('UNSAFE_DIRECTORY','Das Verbindungsverzeichnis ist umgeleitet oder ungültig.');
    const file=path.join(this.directory,name);
    const stat=fs.lstatSync(file,{throwIfNoEntry:false});
    if(stat){
      if(!stat.isFile()||stat.isSymbolicLink())throw fault('UNSAFE_DIRECTORY','Eine Verbindungsdatei ist umgeleitet oder ungültig.');
    }
    fs.writeFileSync(file,JSON.stringify(value),{mode:0o600});
  }
  private removeLocal(name:string):void {
    // Auch vor dem ersten erfolgreichen Start kann stop() aufgerufen werden.
    // Niemals durch eine vorhandene Junction in fremde Dateien greifen.
    if(!this.safeDirectory())return;
    const file=path.join(this.directory,name);
    if(!fs.existsSync(file))return;
    const stat=fs.lstatSync(file);if(stat.isFile()&&!stat.isSymbolicLink())fs.unlinkSync(file);
  }
  private policyFingerprint():string {
    return fingerprint('policy',{write:this.policy.write,scopes:[...this.policy.scopes].sort(),confirmCritical:this.policy.confirmCritical,confirmImages:this.policy.confirmImages});
  }
  private saveGrants():void {
    this.writeLocal('client-grants.json',{version:1,clients:[...this.trustedClients.values()]});
  }
  private async consent(title:string,detail:string,socket:net.Socket|null=null,previewId?:number):Promise<boolean> {
    if(socket?.destroyed)return false;
    const controller=new AbortController();this.consents.set(controller,socket);
    const timer=setTimeout(()=>controller.abort(),45_000);
    const cancelled=new Promise<boolean>(resolve=>controller.signal.addEventListener('abort',()=>resolve(false),{once:true}));
    try {
      return await Promise.race([cancelled,Promise.resolve().then(()=>controller.signal.aborted?false:this.options.confirm(title,detail,controller.signal,previewId)).catch(()=>false)]);
    }finally{clearTimeout(timer);this.consents.delete(controller);}
  }
  revokeClient(id?:string):void {
    if(id!==undefined&&!/^[a-f0-9]{64}$/.test(id))throw fault('INVALID_INPUT','Ungültige Adapterkennung.');
    if(id)this.trustedClients.delete(id);else this.trustedClients.clear();
    this.saveGrants();this.disconnect();
  }
  state(): Record<string,unknown> {
    return {enabled:this.policy.enabled,write:this.policy.write,allowLaunch:this.policy.allowLaunch,scopes:[...this.policy.scopes],
      rememberClients:this.policy.rememberClients,confirmCritical:this.policy.confirmCritical,confirmImages:this.policy.confirmImages,
      connected:this.sessions.size>0,profile:this.options.profile,bridgeVersion:'0.2.0',criticalConfirmation:this.policy.confirmCritical,pairing:!!this.pairing,
      trustedClients:[...this.trustedClients.values()].map(({id,client,approvedAt})=>({id,client,approvedAt})),
      sessions:[...this.sessions.values()].map(s=>({id:s.id,client:s.client,expires:new Date(s.expires).toISOString()})),
      activity:this.audit.slice(-30).map(({sessionId: _sessionId,...entry})=>entry)};
  }
  async start(): Promise<void> {
    (this.options.secure||secureDirectory)(this.directory);
    this.writeLocal('runtime.json',{pid:process.pid,profile:this.options.profile,bridgeVersion:'0.2.0'});
    if (this.policy.enabled) await this.listen();
  }
  async shutdown(): Promise<void> {
    this.removeLocal('runtime.json');
    await this.stop();
  }
  async configure(input: unknown): Promise<Record<string,unknown>> {
    if (!input || typeof input!=='object') throw fault('INVALID_INPUT','Ungültige Verbindungsoptionen.');
    const p=input as Record<string,unknown>;
    if (Object.keys(p).some(k=>!['enabled','write','allowLaunch','scopes','rememberClients','confirmCritical','confirmImages'].includes(k)) ||
      typeof p.enabled!=='boolean' || typeof p.write!=='boolean' || typeof p.allowLaunch!=='boolean' ||
      (p.rememberClients!==undefined&&typeof p.rememberClients!=='boolean') || (p.confirmCritical!==undefined&&typeof p.confirmCritical!=='boolean') ||
      (p.confirmImages!==undefined&&typeof p.confirmImages!=='boolean') ||
      !Array.isArray(p.scopes) || p.scopes.some(s=>typeof s!=='string'||!SCOPES.includes(s as typeof SCOPES[number])))
      throw fault('INVALID_INPUT','Ungültige Verbindungsoptionen.');
    const next:Policy={enabled:p.enabled,write:p.write,allowLaunch:p.allowLaunch,scopes:[...new Set(p.scopes as string[])],
      rememberClients:p.rememberClients as boolean??this.policy.rememberClients,confirmCritical:p.confirmCritical as boolean??this.policy.confirmCritical,
      confirmImages:p.confirmImages as boolean??this.policy.confirmImages};
    if(next.allowLaunch&&!this.options.executable)throw fault('UNSUPPORTED_MODE','App-Start kann nur in der installierten oder portablen App freigegeben werden.');
    if (next.enabled && (!this.policy.enabled || next.write&&!this.policy.write || next.allowLaunch&&!this.policy.allowLaunch ||
      next.rememberClients&&!this.policy.rememberClients || !next.confirmCritical&&this.policy.confirmCritical || !next.confirmImages&&this.policy.confirmImages || next.scopes.some(s=>!this.policy.scopes.includes(s)))) {
      const yes=await this.consent('ChatGPT & Automatisierung freigeben?',
        'Ein lokaler MCP-Client darf die gewählten Redion-Funktionen verwenden. Angeforderte Inhalte können dadurch an ChatGPT übertragen werden. '+
        'Keine automatische Übertragung aller Dokumente.\n\nSchreibzugriff: '+(next.write?'ja':'nein')+
        '\nFunktionen: '+next.scopes.join(', ')+'\nApp-Start erlauben: '+(next.allowLaunch?'ja':'nein')+
        '\nAdapterfreigabe nach Erstbestätigung merken: '+(next.rememberClients?'ja':'nein')+
        '\nKritische Aktionen einzeln bestätigen: '+(next.confirmCritical?'ja':'nein')+
        '\nBilder nach Vorschau einzeln bestätigen: '+(next.confirmImages?'ja':'nein')+
        (next.allowLaunch?'\nVertrauenswürdiger Startpfad: '+this.options.executable:''));
      if (!yes) throw fault('CONSENT_DENIED','Die Freigabe wurde abgebrochen.');
    }
    await this.stop();
    (this.options.secure||secureDirectory)(this.directory);
    this.policy=next;
    this.writeLocal('policy.json',next);
    this.trustedClients.clear();this.saveGrants();
    if (next.allowLaunch && this.options.executable) {
      const exe=fs.realpathSync(this.options.executable);
      const sha256=crypto.createHash('sha256').update(fs.readFileSync(exe)).digest('hex');
      this.writeLocal('launcher.json',{protocol:1,executable:exe,sha256,allowed:true});
    } else this.removeLocal('launcher.json');
    if (next.enabled) {
      try { await this.listen(); }
      catch (error) { this.policy.enabled=false; this.writeLocal('policy.json',this.policy); throw error; }
    }
    this.options.changed();
    return this.state();
  }
  disconnect(): void {
    for(const controller of this.consents.keys())controller.abort();this.pairing=null;
    this.epoch++; this.approvals.clear(); this.images.release();this.options.cancel();
    for (const socket of this.sockets) socket.destroy();
    this.sessions.clear(); this.options.changed();
  }
  async stop(): Promise<void> {
    this.disconnect();
    const old=this.server; this.server=null; this.token='';
    if (old) await new Promise<void>(resolve=>old.close(()=>resolve()));
    this.removeLocal('connection.json');
  }
  private async listen(): Promise<void> {
    if (this.server) return;
    (this.options.secure||secureDirectory)(this.directory);
    this.token=crypto.randomBytes(32).toString('hex');
    const suffix=crypto.randomBytes(20).toString('hex');
    const pipe=process.platform==='win32'?'\\\\.\\pipe\\redion-mcp-'+suffix:path.join(this.directory,'redion-mcp-'+suffix+'.sock');
    const server=net.createServer(socket=>this.accept(socket)); this.server=server;
    await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(pipe,()=>{server.removeListener('error',reject);resolve();});});
    server.on('error',()=>{this.disconnect();});
    try{this.writeLocal('connection.json',{protocol:1,pipe,token:this.token,pid:process.pid,profile:this.options.profile});}
    catch(error){await this.stop();throw error;}
  }
  private accept(socket: net.Socket): void {
    if (!this.policy.enabled || this.sockets.size>=4) { socket.destroy(); return; }
    this.sockets.add(socket);socket.setTimeout(60_000,()=>socket.destroy());
    let buffer=Buffer.alloc(0),busy=false;
    const send=(value:unknown):void=>{if(!socket.destroyed) socket.write(JSON.stringify(value)+'\n');};
    socket.on('data',(chunk:Buffer)=>{
      buffer=Buffer.concat([buffer,chunk]);
      if (buffer.length>256*1024) {socket.destroy();return;}
      const newline=buffer.indexOf(10);
      if (newline<0) return;
      if (busy || buffer.indexOf(10,newline+1)>=0) {socket.destroy();return;}
      let frame:Record<string,unknown>;
      try {frame=JSON.parse(buffer.subarray(0,newline).toString('utf8')) as Record<string,unknown>;
        if(!frame||typeof frame!=='object'||Array.isArray(frame))throw new Error('Invalid frame');
      } catch {socket.destroy();return;}
      buffer=buffer.subarray(newline+1);busy=true;
      void (async()=>{
        try {
          let session=this.sessions.get(socket);
          if (!session) {
            if (frame.kind!=='hello' || this.token.length!==64 || !equal(frame.token,this.token) || frame.protocol!==1 ||
                (frame.clientId!==undefined&&(typeof frame.clientId!=='string'||!/^[a-f0-9]{64}$/.test(frame.clientId))) ||
                typeof frame.client!=='string' || !/^[A-Za-z0-9 ._-]{1,64}$/.test(frame.client))
              throw fault('UNAUTHORIZED','Keine gültige lokale Verbindungsberechtigung.');
            const clientId=typeof frame.clientId==='string'?frame.clientId:undefined;
            const remembered=this.policy.rememberClients&&clientId?this.trustedClients.get(clientId):undefined;
            const epoch=this.epoch;let yes=remembered?.policy===this.policyFingerprint();
            if(!yes) {
              if (this.pairing || Date.now()-this.lastPairing<2000) throw fault('PAIRING_BUSY','Eine Verbindungsanfrage wird bereits geprüft.');
              this.pairing=socket;this.lastPairing=Date.now();
              try {yes=await this.consent('Lokale MCP-Sitzung verbinden?',
              'Der lokale Client „'+frame.client+'“ möchte die freigegebenen Funktionen verwenden. '+
              'Der Programmname ist eine Selbstauskunft, kein Signaturnachweis.\n\nSchreiben: '+(this.policy.write?'erlaubt':'gesperrt')+
              '\nProfil: '+this.options.profile+
              (this.policy.rememberClients&&clientId?'\nDiesen lokalen Adapter bis zum Widerruf merken. Rechteänderungen erfordern eine neue Freigabe.':'\nDiese Sitzung gilt höchstens 30 Minuten.'),socket);}
              finally {if(this.pairing===socket)this.pairing=null;}
            }
            if (!yes||epoch!==this.epoch||!this.policy.enabled||socket.destroyed) throw fault('CONSENT_DENIED','Sitzung nicht freigegeben.');
            if(this.policy.rememberClients&&clientId&&!remembered) {
              if(this.trustedClients.size>=20)this.trustedClients.delete(this.trustedClients.keys().next().value!);
              this.trustedClients.set(clientId,{id:clientId,client:frame.client,approvedAt:new Date().toISOString(),policy:this.policyFingerprint()});this.saveGrants();
            }
            session={id:crypto.randomUUID(),socket,client:frame.client,...(clientId?{clientId}:{}),persistent:!!(this.policy.rememberClients&&clientId),expires:Date.now()+30*60*1000,epoch,captures:[]};
            this.sessions.set(socket,session);this.options.changed();
            send({ok:true,data:{sessionId:session.id,expires:new Date(session.expires).toISOString()}});
          } else {
            if(typeof frame.id!=='string'||frame.id.length>80)throw fault('INVALID_REQUEST','Ungültiger Aufruf.');
            if(frame.kind==='image') {
              this.authorize(session,'redion_capture_view',{target:'window'});
              const image=this.images.read(session.id,frame.artifactId);
              // Erst eine kleine Kopfzeile, anschliessend unveränderte Binärbytes.
              send({id:frame.id,ok:true,data:image.metadata,binary:{length:image.bytes.length,sha256:image.metadata.sha256}});
              if(!socket.destroyed)socket.write(image.bytes,()=>image.bytes.fill(0));else image.bytes.fill(0);return;
            }
            if(frame.kind!=='call')throw fault('INVALID_REQUEST','Ungültiger Aufruf.');
            const operationId=crypto.randomUUID();
            const work=()=>this.call(session!,frame.tool,frame.arguments,operationId);
            const result=this.queue.then(work,work);this.queue=result.catch(()=>{});
            send({id:frame.id,...await result});
          }
        } catch (error) {
          const e=error as {code?:string};
          send({id:frame.id,ok:false,error:{code:e.code||'BRIDGE_ERROR',message:'Die Verbindung oder Aktion wurde abgewiesen.'}});
          if (!this.sessions.has(socket)) socket.destroy();
        } finally {busy=false;}
      })();
    });
    socket.on('error',()=>{});
    socket.on('close',()=>{for(const [controller,owner] of this.consents)if(owner===socket)controller.abort();if(this.pairing===socket)this.pairing=null;
      const session=this.sessions.get(socket);if(session)this.images.release(session.id);
      this.sockets.delete(socket);this.sessions.delete(socket);this.options.changed();});
  }
  private authorize(session:Session,name:unknown,input:unknown):ReturnType<typeof definition> {
    if (!this.policy.enabled||session.epoch!==this.epoch||session.expires<Date.now()||session.socket.destroyed)
      throw fault('SESSION_EXPIRED','Die Sitzung ist beendet; bitte neu verbinden.');
    if(session.persistent&&(!session.clientId||!this.trustedClients.has(session.clientId)))
      throw fault('SESSION_EXPIRED','Die gespeicherte Freigabe wurde widerrufen.');
    const tool=validateCall(name,input);
    if (!this.policy.scopes.includes(tool.scope)) throw fault('SCOPE_DENIED','Diese Funktionsgruppe ist nicht freigegeben.');
    if (tool.permission!=='read'&&!this.policy.write) throw fault('WRITE_DISABLED','Schreibzugriff ist in Redion gesperrt.');
    return tool;
  }
  private async call(session:Session,name:unknown,input:unknown,operationId:string):Promise<ActionResult> {
    const audit:Audit={operationId,sessionId:session.id,tool:typeof name==='string'&&TOOLS.some(t=>t.name===name)?name:'invalid',time:new Date().toISOString(),status:'running'};
    this.audit.push(audit);if(this.audit.length>200)this.audit.shift();
    try {
      const tool=this.authorize(session,name,input);
      const args={...(input as Record<string,unknown>)};
      let data:Record<string,unknown>;
      if (tool.name==='redion_get_status') data={...this.state(),activity:undefined,sessions:undefined,running:true};
      else if (tool.name==='redion_get_capabilities') data={tools:TOOLS.map(t=>({name:t.name,permission:t.permission,scope:t.scope,enabled:this.policy.scopes.includes(t.scope)}))};
      else if (tool.name==='redion_focus_app') {this.options.focus();data={focused:true};}
      else if (tool.name==='redion_launch_app') data={running:true,started:false};
      else if(tool.name==='redion_capture_view') {
        if(!this.options.capture)throw fault('UNSUPPORTED_ACTION','Diese App-Version unterstützt noch keine Bilder.');
        session.captures=session.captures.filter(time=>time>Date.now()-60_000);
        if(session.captures.length>=12)throw fault('RATE_LIMITED','Höchstens zwölf Bildaufnahmen je Minute und Sitzung.');
        session.captures.push(Date.now());
        const capture=await this.options.capture(args,()=>{this.authorize(session,tool.name,args);},
          (title,detail,previewId)=>this.consent(title,detail,session.socket,previewId),this.policy.confirmImages);
        try {this.authorize(session,tool.name,args);const image=this.images.put(session.id,capture.bytes,capture.info);data={image};
          audit.image={bytes:image.bytes,width:image.width,height:image.height,target:image.target};}
        finally{capture.bytes.fill(0);}
      }
      else if (tool.name==='redion_request_confirmation') {
        const target=this.authorize(session,args.tool,args.arguments);
        if (target.permission!=='critical') throw fault('INVALID_INPUT','Dieses Werkzeug benötigt keine kritische Bestätigung.');
        const targetArgs={...(args.arguments as Record<string,unknown>)};delete targetArgs.confirmationId;
        const yes=!this.policy.confirmCritical||await this.consent('Kritische MCP-Aktion bestätigen?',target.description+'\n\n'+canonical(targetArgs).slice(0,2500),session.socket);
        this.authorize(session,args.tool,targetArgs);
        if (!yes) throw fault('CONFIRMATION_DENIED','Die Aktion wurde nicht bestätigt.');
        const confirmationId=crypto.randomUUID();
        this.approvals.set(confirmationId,{session:session.id,fingerprint:fingerprint(target.name,targetArgs),expires:Date.now()+60_000});
        data={confirmationId,expiresInSeconds:60,tool:target.name};
      } else if (tool.name==='redion_get_operation_status') {
        const found=this.audit.find(a=>a.operationId===args.operationId&&a.sessionId===session.id);
        if(!found)throw fault('NOT_FOUND','Diese Operation gehört nicht zu dieser Sitzung.');
        data={operation:{...found,sessionId:undefined}};
      } else if (tool.name==='redion_get_activity_log'||tool.name==='redion_get_recent_errors') {
        data={entries:this.audit.filter(a=>a.sessionId===session.id&&(tool.name.endsWith('activity_log')||a.status==='failed')).slice(-30).map(({sessionId:_id,...a})=>a)};
      } else {
        if (tool.permission==='critical') {
          const key=String(args.confirmationId||''),approval=this.approvals.get(key);delete args.confirmationId;
          if (this.policy.confirmCritical&&(!approval||approval.session!==session.id||approval.expires<Date.now()||approval.fingerprint!==fingerprint(tool.name,args)))
            throw fault('CONFIRMATION_REQUIRED','Diese Aktion benötigt eine frische, passende Bestätigung in Redion.');
          this.approvals.delete(key);
        }
        this.authorize(session,tool.name,args);
        data=await this.options.invoke(tool.name,args);
      }
      audit.status='completed';this.options.changed();return {ok:true,data,operationId};
    } catch (error) {
      const e=error as {code?:string;message?:string};audit.status='failed';audit.code=e.code||'ACTION_FAILED';this.options.changed();
      return {ok:false,error:{code:audit.code,message:e.code?String(e.message||'Aktion abgewiesen.').slice(0,400):'Die App konnte die Aktion nicht abschliessen.'},operationId};
    }
  }
}
