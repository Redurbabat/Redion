/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/bloecke/automatisierung.ts (npm run bauen:ts). */
/** Schaltplan-Aktionen benutzen Leser, Klemmenauflöser, Fang, Führung und Nachziehen. */
(() => {
  const R=RegisterAutomatisierung;
  const read=(id:string,c:AutomationContext,write=false)=>{
    const b=c.block(id,write);if(b.type!=='schaltplan')c.error('INVALID_SCHEMATIC');
    if(write&&document.querySelector('.sp-laeuft'))c.error('SIMULATION_RUNNING');
    return {b,plan:Schaltplan.lesen(b),page:c.pageOf(id),before:JSON.stringify(b.plan)};
  };
  const save=async(item:ReturnType<typeof read>,c:AutomationContext)=>{
    await c.prepare(item.page.id);c.block(item.b.id,true);
    if(document.querySelector('.sp-laeuft'))c.error('SIMULATION_RUNNING');
    if(JSON.stringify(Store.getBlock(item.b.id).plan)!==item.before)c.error('STALE_DOCUMENT');
    Store.updateBlock(item.b.id,{plan:item.plan,herkunft:'ki'});await c.finish(item.page.id);
  };
  const fit=(plan:any,part:any,c:AutomationContext):void=>{
    const a=Schaltplan.teilRahmen(part);
    if(a.l<0||a.o<0||a.r>plan.breite||a.u>plan.hoehe)c.error('PLACEMENT_OUTSIDE_PAGE');
    if(plan.teile.some((t:any)=>{if(t.id===part.id||t.ebene!==part.ebene)return false;const b=Schaltplan.teilRahmen(t);return a.l<b.r&&b.l<a.r&&a.o<b.u&&b.o<a.u;}))c.error('COMPONENT_OVERLAP');
  };
  R.melde('redion_open_schematic',(a,c)=>{const item=read(a.blockId,c);App.oeffne(item.page.id);return {blockId:item.b.id,documentId:item.page.id};});
  R.melde('redion_create_schematic',async(a,c)=>{
    const p=c.block(a.documentId,true);if(p.type!=='page')c.error('INVALID_DOCUMENT');await c.prepare(p.id);
    const b=Store.addBlock(p.id,'schaltplan',{text:a.title||'Schaltplan',plan:Schaltplan.neuerPlan(),herkunft:'ki'});await c.finish(p.id);return {blockId:b.id,documentId:p.id};
  });
  R.melde('redion_read_schematic',(a,c)=>{const item=read(a.blockId,c);return {blockId:item.b.id,plan:item.plan};});
  R.melde('redion_list_schematic_components',()=>({components:Register.fachzeichen.alle().map((x:any)=>({id:x.id,name:x.name,width:x.w,height:x.h,terminals:x.anschluesse}))}));
  R.melde('redion_add_schematic_component',async(a,c)=>{
    const item=read(a.blockId,c,true);if(!Register.fachzeichen.holen(a.componentType))c.error('UNKNOWN_COMPONENT');
    const part={id:Schaltplan.uid(),zeichen:a.componentType,x:Schaltplan.rasten(a.x),y:Schaltplan.rasten(a.y),drehung:0,gespiegelt:false,
      bmk:Schaltplan.naechstesBmk(item.plan,a.componentType),nummern:{},gruppe:'',ebene:'plan',...(a.label?{beschriftung:a.label}:{})};
    fit(item.plan,part,c);item.plan.teile.push(part);await save(item,c);return {blockId:item.b.id,component:part};
  });
  R.melde('redion_move_schematic_component',async(a,c)=>{
    const item=read(a.blockId,c,true),part=item.plan.teile.find(t=>t.id===a.componentId);if(!part)c.error('UNKNOWN_COMPONENT');
    const before=Schaltplan.vorherMerken(item.plan);part!.x=Schaltplan.rasten(a.x);part!.y=Schaltplan.rasten(a.y);fit(item.plan,part,c);
    const report=Schaltplan.nachziehen(item.plan,before,[part!.id],{heilen:true});
    if(Schaltplan.ueberlappungen(item.plan))c.error('WIRE_OVERLAP');await save(item,c);return {componentId:part!.id,report};
  });
  R.melde('redion_connect_schematic_components',async(a,c)=>{
    const item=read(a.blockId,c,true);
    const terminal=(arg:any)=>{
      const part=item.plan.teile.find(t=>t.id===arg.componentId);if(!part)c.error('UNKNOWN_COMPONENT');
      const nr=Schaltplan.klemmeFuer(part,arg.terminalId);const point=Schaltplan.anschlussOrt(part!,nr||'');if(!nr||!point)c.error('INVALID_TERMINAL');
      const snap=Schaltplan.fangeAnschluss(item.plan,point!,1);if(!snap||snap.teil!==part!.id)c.error('INVALID_TERMINAL');
      return {part:part!,nr:nr!,point:point!};
    };
    const from=terminal(a.from),to=terminal(a.to);
    if(from.part.id===to.part.id&&from.nr===to.nr)c.error('INVALID_TERMINAL');
    const points=Schaltplan.leitungFuehren(item.plan,from.point,to.point,{teil:from.part.id,nr:from.nr},{teil:to.part.id,nr:to.nr});
    if(points.length<2||Schaltplan.ueberlappt(points,item.plan.leitungen))c.error('WIRE_OVERLAP');
    const wire={id:Schaltplan.uid(),punkte:points,ebene:'plan',vonTeil:from.part.id,vonNr:from.nr,nachTeil:to.part.id,nachNr:to.nr};
    item.plan.leitungen.push(wire);await save(item,c);return {wireId:wire.id,from:{componentId:from.part.id,terminalId:from.nr},to:{componentId:to.part.id,terminalId:to.nr}};
  });
  R.melde('redion_export_schematic',(a,c)=>{const item=read(a.blockId,c);return {blockId:item.b.id,mimeType:'image/svg+xml',svg:Schaltplan.alsSvg(item.plan)};});
})();
