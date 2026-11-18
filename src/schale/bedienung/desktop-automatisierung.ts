/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/bedienung/desktop-automatisierung.ts (npm run bauen:ts). */
/** Ausschliesslich der schmale native Adapter. Kein HTTP-Port und kein zweiter Store. */
const RedionAutomation = (() => {
  const pending=new Set<string>();
  let started=false;
  const error=(code:string):never=>{throw Object.assign(new Error('Redion-Aktion abgewiesen.'),{code});};
  const pageOf=(id:string):any=>{
    let b=Store.getBlock(id);const seen=new Set<string>();
    while(b&&b.type!=='page') {
      if(seen.has(b.id)||seen.size>100) error('INVALID_DOCUMENT');seen.add(b.id);
      b=b.parentTable==='collection' ? Object.values<any>(Store.cache.blocks).find(x=>x.alive&&x.type==='database'&&x.collectionId===b.parentId) : Store.getBlock(b.parentId);
    }
    if(!b||b.alive===false) error('INVALID_DOCUMENT'); return b;
  };
  const block=(id:string,write=false):any=>{
    const b=Store.getBlock(id);if(!b||b.alive===false)error('INVALID_DOCUMENT');
    const p=pageOf(id);
    if(!Konten.darf(write?'bearbeiten':'lesen',id)||!Konten.darf(write?'bearbeiten':'lesen',p.id)) error('PERMISSION_DENIED');
    if(write&&(b.locked||p.locked))error('DOCUMENT_LOCKED');
    return b;
  };
  const editing=():boolean=>{
    const el=document.activeElement;
    return el instanceof HTMLElement && el.isContentEditable && !!document.getElementById('page')?.contains(el);
  };
  const start=():void=>{
    const desktop=(window as any).RedionDesktop;
    if(started||!desktop?.onAutomationRequest||desktop.automationSupported===false)return;started=true;
    desktop.onAutomationCancel((id?:string)=>{if(id)pending.delete(id);else pending.clear();});
    desktop.onAutomationRequest(async(request:{id:string;tool:string;arguments:Record<string,unknown>})=>{
      pending.add(request.id);
      const check=():void=>{if(!pending.has(request.id))error('ACTION_CANCELLED');};
      const context:AutomationContext={check,block,pageOf,error,
        prepare:async(documentId:string)=>{
          if(editing())error('EDITOR_BUSY');
          const p=block(documentId,true);if(p.type!=='page')error('INVALID_DOCUMENT');
          if(App.aktuelleSeite()!==p.id)App.oeffne(p.id);
          await Store.versionSpeichern(p.id,'vor ChatGPT-Änderung');check();
          block(documentId,true);if(editing())error('EDITOR_BUSY');Verlauf.merke(true);
        },
        finish:async(documentId?:string)=>{
          await Store.flush();check();
          if(Store.speichertNicht())error('PERSISTENCE_UNAVAILABLE');
          App.zeichneBaum();
          if(documentId&&App.aktuelleSeite()===documentId&&!editing())App.zeichneSeite();
          if(documentId)UI.toast('ChatGPT: Änderung gespeichert');
        }};
      try {
        const data=await RegisterAutomatisierung.ausfuehren(request.tool,request.arguments,context);check();
        await desktop.automationReply({id:request.id,ok:true,data});
      } catch(e:unknown) {
        await desktop.automationReply({id:request.id,ok:false,error:{code:(e as {code?:string}).code||'ACTION_FAILED'}});
      } finally {pending.delete(request.id);}
    });
    void desktop.automationReady().catch(()=>{});
  };
  return {start};
})();
RegisterAutomatisierung.melde('redion_get_current_view',(_a,c)=>{
  const id=App.aktuelleSeite(),p=id?c.block(id):null;
  return {documentId:p?.id||null,view:location.hash.slice(0,160),workspaceId:Store.getMeta('produkt:welt','lernen'),
    editor:p?(document.querySelector('.sp-wrap')?'schematic':document.querySelector('.pdf-document-mode')?'pdf':'page'):null};
});
RegisterAutomatisierung.melde('redion_get_active_document',(_a,c)=>{
  const id=App.aktuelleSeite();const p=id?c.block(id):null;
  return {document:p?{id:p.id,title:p.text||'',type:p.type}:null};
});
