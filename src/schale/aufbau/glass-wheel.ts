/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/schale/aufbau/glass-wheel.ts (npm run bauen:ts). */
/* Optionale Projektion der vorhandenen Bereiche/Reiter. Keine Inhaltskopien.
 * Die zwei lokalen Anzeigepräferenzen gehören absichtlich NICHT in Store:
 * weder Sync noch Sicherungsimport dürfen das Gerät in einen Modus zwingen.
 */
const GlassWheel = (() => {
  type Mode = 'classic' | 'glass-wheel';
  type Area = {id:string; name:string; icon:string};
  type OpenTab = {index:number; id:string; title:string; kind:string};
  const MODE_KEY='redion:ui-shell:v1', AREA_KEY='redion:glass-wheel:area:v1';
  let current:Mode='classic', selected='', expanded=true, allOpen=false;
  let started=false, frame=0, paintFrame=0, generation=0, rotation=0, signature='';
  let host:HTMLElement|null=null, ring:HTMLElement|null=null, tray:HTMLElement|null=null;
  let areas:Area[]=[], drag:{id:number; angle:number; time:number; velocity:number; moved:boolean; x:number; y:number; startRotation:number}|null=null;
  let suppressClick=false, wheelTimer:ReturnType<typeof setTimeout>|undefined;
  let hostEvents:AbortController|null=null;

  const read=(key:string):string=>{try{return localStorage.getItem(key)||'';}catch{return '';}};
  const write=(key:string,value:string):boolean=>{
    try {localStorage.setItem(key,value);return true;}
    catch {UI.toast('Die Oberflächenwahl gilt nur für diese Sitzung: lokaler Speicher ist gesperrt.');return false;}
  };
  const calm=():boolean=>AppEinstellung.wenigBewegung();
  const button=(text:string,action:(event:MouseEvent)=>void,className=''):HTMLButtonElement=>{
    const node=document.createElement('button'); node.type='button';node.className=className;
    node.textContent=text;node.addEventListener('click',action);return node;
  };
  const readable=(id:string):boolean=>{
    const page=Store.getBlock(id);
    return !!page && page.alive!==false && Lesefrage.erlaubt('lesen',id) &&
      Store.pathOf(id).every((parent:any)=>parent.alive!==false);
  };
  const kindOf=(id:string):string=>{
    const page=Store.getBlock(id); if(page?.type==='database')return 'Datenbank';
    const children=Store.childrenOf(id);
    if(children.some((child:any)=>child.type==='pdfseite'))return 'PDF';
    if(children.some((child:any)=>child.type==='database'))return 'Datenbank';
    return page?.dokumentModus?'Dokument':'Notiz';
  };
  const saveArea=():void=>{write(AREA_KEY,selected);};
  const announce=():void=>{
    const live=host?.querySelector<HTMLElement>('.gw-announcement');
    if(live)live.textContent=areas.find(area=>area.id===selected)?.name
      ? areas.find(area=>area.id===selected)!.name+' ausgewählt' : 'Keine Lebensbereiche angelegt';
  };
  const paint=():void=>{
    if(!ring)return;
    const positions=GlassWheelGeometry.positions(areas.length,rotation);
    const radius=Math.min(176,ring.clientWidth*.34,(ring.clientHeight-52)/2);
    const shown=new Set(positions.map(position=>String(position.index)));
    ring.querySelectorAll<HTMLElement>('[data-gw-area]').forEach(node=>{
      const index=Number(node.dataset['gwArea']), point=positions.find(position=>position.index===index);
      node.hidden=!shown.has(String(index));
      if(!point)return;
      const radians=point.angle*Math.PI/180;
      node.style.setProperty('--gw-x',(Math.cos(radians)*radius).toFixed(2)+'px');
      node.style.setProperty('--gw-y',(Math.sin(radians)*radius).toFixed(2)+'px');
      node.setAttribute('aria-pressed',String(areas[index]?.id===selected));
      node.tabIndex=areas[index]?.id===selected?0:-1;
    });
    ring.querySelectorAll<HTMLElement>('[data-gw-spoke]').forEach(node=>{
      const point=positions.find(position=>position.index===Number(node.dataset['gwSpoke']));
      node.hidden=!point;
      if(point){node.style.transform=`rotate(${point.angle.toFixed(2)}deg) translateX(${(radius*.4).toFixed(2)}px)`;node.style.width=(radius*.58).toFixed(2)+'px';}
    });
    ring.style.setProperty('--gw-turn',rotation.toFixed(2)+'deg');
    ring.dataset['dragging']=String(!!drag);
    const center=host?.querySelector<HTMLElement>('.gw-center-name');
    if(center)center.textContent=areas.find(area=>area.id===selected)?.name||'Deine Bereiche';
    const count=host?.querySelector<HTMLElement>('.gw-count');
    if(count)count.textContent=areas.length?`${areas.findIndex(area=>area.id===selected)+1} / ${areas.length}`:'0 Bereiche';
    host?.querySelectorAll<HTMLButtonElement>('.gw-wheel-controls button').forEach(node=>node.disabled=areas.length<2);
    const selection=host?.querySelector<HTMLElement>('.gw-selection');
    if(selection)selection.textContent=areas.find(area=>area.id===selected)?.name||'';
  };
  const chooseRotation=(next:number,remember=true):void=>{
    rotation=next;
    const index=GlassWheelGeometry.wrap(Math.round(-rotation/GlassWheelGeometry.step(areas.length)),areas.length);
    selected=areas[index]?.id||'';
    if(remember){if(paintFrame)cancelAnimationFrame(paintFrame);paintFrame=0;paint();}
    else if(!paintFrame)paintFrame=requestAnimationFrame(()=>{paintFrame=0;paint();});
    if(remember){saveArea();announce();void refreshTray();}
  };
  const select=(index:number):void=>{
    const previous=areas.findIndex(area=>area.id===selected);
    const shift=GlassWheelGeometry.distance(index,previous,areas.length);
    chooseRotation(rotation-shift*GlassWheelGeometry.step(areas.length));
  };
  const turn=(direction:number):void=>{
    if(areas.length<2)return;
    chooseRotation(GlassWheelGeometry.settle(rotation-direction*GlassWheelGeometry.step(areas.length),0,areas.length,true));
  };
  const refreshTray=async():Promise<void>=>{
    const version=++generation, target=tray;
    if(current!=='glass-wheel'||!target)return;
    const tabs=Fenster.reiter().map((tab,index)=>({index,id:tab.id}));
    const projected:OpenTab[]=[];
    for(const tab of tabs){
      if(!readable(tab.id))continue;
      const membership=await Lebensbereiche.bereicheVon({art:'page',id:tab.id});
      if(!allOpen && (!selected || !membership.some(area=>area.id===selected)))continue;
      const page=Store.getBlock(tab.id);
      projected.push({...tab,title:String(page.text||'Ohne Titel'),kind:kindOf(tab.id)});
    }
    if(version!==generation||current!=='glass-wheel'||!target.isConnected)return;
    const active=Fenster.aktiv();
    const nextSignature=JSON.stringify([selected,allOpen,active,projected]);
    if(target.dataset['snapshot']===nextSignature)return;
    target.dataset['snapshot']=nextSignature;
    const focused=(document.activeElement as HTMLElement|null)?.dataset['gwTab'];
    target.replaceChildren();
    const title=document.createElement('h3');
    title.textContent=allOpen?'Alle geöffnet':`Geöffnet · ${areas.find(area=>area.id===selected)?.name||'Deine Bereiche'}`;
    const tools=document.createElement('div');tools.className='gw-tray-heading';tools.append(title);
    const all=button('Alle geöffnet',()=>{allOpen=true;void refreshTray();});all.setAttribute('aria-pressed',String(allOpen));
    const area=button('Im Bereich',()=>{allOpen=false;void refreshTray();});area.setAttribute('aria-pressed',String(!allOpen));
    tools.append(area,all);target.append(tools);
    const list=document.createElement('div');list.className='gw-open-list';list.setAttribute('aria-label',title.textContent);
    if(!projected.length){
      const empty=document.createElement('p');empty.className='gw-empty';
      empty.textContent=allOpen?'Noch keine lesbaren Dokumente geöffnet. Öffne einen Inhalt in Redion.'
        :'In diesem Bereich ist noch kein Dokument geöffnet. „Alle geöffnet“ zeigt auch Inhalte ohne Bereich.';
      list.append(empty);
    }
    for(const tab of projected){
      const card=document.createElement('div');card.className='gw-tab-card';card.draggable=true;
      const open=button('',()=>{if(readable(tab.id)){Fenster.wechseln(tab.index);setExpanded(false);}},'gw-tab-open');
      open.dataset['gwTab']=String(tab.index);open.setAttribute('aria-current',String(tab.index===active));
      const kind=document.createElement('small');kind.textContent=tab.kind;
      const name=document.createElement('strong');name.textContent=tab.title;open.title=tab.title;open.append(kind,name);
      const close=button('×',()=>{Fenster.schliessen(tab.index);schedule();},'gw-tab-close');
      close.setAttribute('aria-label',tab.title+' schliessen');close.disabled=tabs.length<=1;
      card.addEventListener('dragstart',event=>event.dataTransfer?.setData('text/redion-tab',String(tab.index)));
      card.addEventListener('dragover',event=>event.preventDefault());
      card.addEventListener('drop',event=>{
        event.preventDefault();const raw=event.dataTransfer?.getData('text/redion-tab');
        if(raw && /^\d+$/.test(raw))Fenster.verschieben(Number(raw),tab.index);
      });
      open.addEventListener('keydown',event=>{
        if(event.altKey && event.shiftKey && ['ArrowLeft','ArrowRight'].includes(event.key)){
          event.preventDefault();Fenster.verschieben(tab.index,tab.index+(event.key==='ArrowRight'?1:-1));
        }
      });
      card.append(open,close);list.append(card);
    }
    target.append(list);
    if(focused)target.querySelector<HTMLElement>(`[data-gw-tab="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});
  };
  const setExpanded=(value:boolean):void=>{
    expanded=value;if(!host)return;host.dataset['expanded']=String(value);
    const toggle=host.querySelector<HTMLElement>('[data-gw-expand]');
    toggle?.setAttribute('aria-expanded',String(value));
    if(toggle)toggle.textContent=value?'Rad einklappen':'Bereichsrad öffnen';
  };
  const cancelDrag=():void=>{
    if(drag){rotation=drag.startRotation;selected=areas[GlassWheelGeometry.wrap(Math.round(-rotation/GlassWheelGeometry.step(areas.length)),areas.length)]?.id||'';}
    drag=null;paint();
  };
  const refresh=async():Promise<void>=>{
    if(current!=='glass-wheel'||!host)return;
    const next=Lebensbereiche.auflisten(), nextSignature=JSON.stringify(next.map(area=>[area.id,area.name,area.icon]));
    if(signature!==nextSignature){
      cancelDrag();areas=next;signature=nextSignature;
      if(!areas.some(area=>area.id===selected))selected=areas[0]?.id||'';
      rotation=-Math.max(0,areas.findIndex(area=>area.id===selected))*GlassWheelGeometry.step(areas.length);
      ring?.querySelectorAll('[data-gw-area],[data-gw-spoke]').forEach(node=>node.remove());
      areas.forEach((area,index)=>{
        const item=button(area.name,event=>{if(!suppressClick||event.detail===0)select(index);},'gw-area');
        const label=document.createElement('span');label.className='gw-area-label';label.textContent=area.name;item.replaceChildren(label);
        item.dataset['gwArea']=String(index);item.title=area.name;item.setAttribute('aria-label',area.name);
        const spoke=document.createElement('span');spoke.className='gw-spoke';spoke.dataset['gwSpoke']=String(index);spoke.setAttribute('aria-hidden','true');
        ring?.append(spoke,item);
      });
      const empty=host.querySelector<HTMLElement>('.gw-no-areas');if(empty)empty.hidden=!!areas.length;
      saveArea();announce();
    }
    paint();await refreshTray();
  };
  const fail=(error:unknown):void=>{
    console.error('Glass Wheel konnte nicht dargestellt werden',error);
    setMode('classic');UI.toast('Glass Wheel ist nicht verfügbar. Klassisch ist wieder aktiv; deine Inhalte bleiben erhalten.');
  };
  const schedule=():void=>{
    if(current!=='glass-wheel'||frame)return;
    frame=requestAnimationFrame(()=>{frame=0;void refresh().catch(fail);});
  };
  const mount=():void=>{
    const main=document.getElementById('main'), scroll=document.getElementById('scroll');
    if(!main||!scroll)throw new Error('Die vorhandene Redion-Schale fehlt.');
    if(!getComputedStyle(document.body).getPropertyValue('--gw-paper').trim())
      throw new Error('Das Glass-Stilblatt fehlt.');
    host=document.createElement('section');host.id='glass-wheel-shell';host.className='gw-shell';
    host.setAttribute('aria-label','Glass Wheel – Lebensbereiche und offene Dokumente');host.dataset['keinWisch']='';
    host.innerHTML='<div class="gw-shell-heading"><span class="gw-identity">REDION <small>DEIN WISSENSRAUM</small></span></div>'+
      '<div class="gw-wheel-stage"><h2>Deine Bereiche</h2><p>Ein Raum für alles, was dich bewegt.</p>'+
      '<div class="gw-wheel" role="group" aria-label="Bereichsrad – ziehen, scrollen oder Pfeiltasten" tabindex="0">'+
      '<span class="gw-rim" aria-hidden="true"></span><div class="gw-hub"><b aria-hidden="true">R</b><span class="gw-center-name"></span></div></div>'+
      '<div class="gw-wheel-controls"><span class="gw-count"></span></div><p class="gw-selection"></p><p class="gw-no-areas">Noch keine Lebensbereiche. Lege sie in den vorhandenen Einstellungen an.</p></div>'+
      '<div class="gw-tray"></div><span class="gw-announcement" aria-live="polite" role="status"></span>';
    const heading=host.querySelector('.gw-shell-heading')!;
    const expand=button('',()=>{setExpanded(!expanded);paint();});expand.dataset['gwExpand']='';heading.append(expand);
    heading.append(button('Klassisch',()=>setMode('classic'),'gw-classic-return'));
    host.querySelector('.gw-no-areas')?.append(button('Bereiche verwalten',()=>Einstellungen.oeffne('bereiche')));
    ring=host.querySelector<HTMLElement>('.gw-wheel');tray=host.querySelector<HTMLElement>('.gw-tray');
    const controls=host.querySelector('.gw-wheel-controls')!;
    controls.prepend(button('←',()=>turn(-1)));controls.append(button('→',()=>turn(1)));
    controls.firstElementChild?.setAttribute('aria-label','Vorheriger Bereich');controls.lastElementChild?.setAttribute('aria-label','Nächster Bereich');
    main.insertBefore(host,scroll);setExpanded(expanded);signature='';
    hostEvents=new AbortController();const signal=hostEvents.signal;
    ring!.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      if(event.key==='Home')select(0);else if(event.key==='End')select(areas.length-1);
      else turn(['ArrowRight','ArrowDown'].includes(event.key)?1:-1);
    },{signal});
    const angle=(event:PointerEvent):number=>{
      const rect=ring!.getBoundingClientRect();return Math.atan2(event.clientY-rect.top-rect.height/2,event.clientX-rect.left-rect.width/2)*180/Math.PI;
    };
    ring!.addEventListener('pointerdown',event=>{
      if(drag && drag.id!==event.pointerId){suppressClick=true;cancelDrag();return;}
      suppressClick=false;if(areas.length<2||event.button!==0)return;
      drag={id:event.pointerId,angle:angle(event),time:event.timeStamp,velocity:0,moved:false,x:event.clientX,y:event.clientY,startRotation:rotation};
    },{signal});
    ring!.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      if(!drag.moved && Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8)return;
      const next=angle(event), change=GlassWheelGeometry.delta(drag.angle,next);
      drag.velocity=change/Math.max(1,event.timeStamp-drag.time);drag.time=event.timeStamp;drag.angle=next;
      if(!drag.moved){drag.moved=true;ring!.setPointerCapture(event.pointerId);}
      rotation+=change;chooseRotation(rotation,false);
    },{signal});
    ring!.addEventListener('pointerup',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      suppressClick=drag.moved;const velocity=event.timeStamp-drag.time>90?0:drag.velocity;
      drag=null;chooseRotation(GlassWheelGeometry.settle(rotation,velocity,areas.length,calm()));
    },{signal});
    ring!.addEventListener('pointercancel',()=>{cancelDrag();chooseRotation(GlassWheelGeometry.settle(rotation,0,areas.length,true));},{signal});
    ring!.addEventListener('wheel',event=>{
      if(event.ctrlKey||areas.length<2)return;event.preventDefault();
      rotation-=Math.max(-50,Math.min(50,(event.deltaY||event.deltaX)*.18));chooseRotation(rotation,false);
      clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>chooseRotation(GlassWheelGeometry.settle(rotation,0,areas.length,calm())),110);
    },{signal,passive:false});
    void refresh().catch(fail);
  };
  function setMode(value:Mode):boolean {
    if(value!=='classic'&&value!=='glass-wheel')return false;
    if(current===value)return true;
    generation++;current=value;write(MODE_KEY,value);
    if(value==='glass-wheel'){
      try {document.body.dataset['uiShell']=value;mount();
        // Beim Wechsel im Dokument bleibt die Arbeit sichtbar und erreichbar.
        if(document.querySelector('#title,.document-workspace,.sp-wrap'))setExpanded(false);
      }
      catch(error){fail(error);return false;}
    }else{
      hostEvents?.abort();hostEvents=null;clearTimeout(wheelTimer);cancelDrag();
      if(frame)cancelAnimationFrame(frame);frame=0;
      if(paintFrame)cancelAnimationFrame(paintFrame);paintFrame=0;
      host?.remove();host=null;ring=null;tray=null;
      delete document.body.dataset['uiShell'];
    }
    document.querySelectorAll<HTMLElement>('[data-gw-mode]').forEach(node=>node.setAttribute('aria-pressed',String(node.dataset['gwMode']===current)));
    return true;
  }
  const settings=():HTMLElement=>{
    const node=document.createElement('section');node.className='gw-settings';
    const title=document.createElement('h3');title.textContent='Oberfläche';node.append(title);
    const choices=document.createElement('div');choices.className='gw-mode-choices';
    for(const [mode,name,detail] of [['classic','Klassisch','Dein vertrauter Arbeitsplatz'],['glass-wheel','Glass Wheel','Lebensbereiche als drehbares Glasrad']] as const){
      const option=button('',()=>setMode(mode),'gw-mode-card');option.dataset['gwMode']=mode;
      option.setAttribute('aria-pressed',String(current===mode));
      const preview=document.createElement('span');preview.className='gw-mode-preview gw-preview-'+mode;preview.setAttribute('aria-hidden','true');
      const label=document.createElement('b');label.textContent=name;const hint=document.createElement('small');hint.textContent=detail;
      option.append(preview,label,hint);choices.append(option);
    }
    const note=document.createElement('p');note.textContent='Nur auf diesem Gerät · Dieselben Inhalte · Jederzeit zurück zu Klassisch';
    node.append(choices,note);return node;
  };
  const start=():void=>{
    if(started)return;started=true;selected=read(AREA_KEY);
    document.addEventListener('redion:reiter',schedule);
    document.addEventListener('redion:schauplatz',()=>{if(document.querySelector('#title'))setExpanded(false);schedule();});
    document.addEventListener('click',event=>{
      if(event.target instanceof Element && event.target.closest('#handy-oben,#kante,#sidebar'))setExpanded(false);
      schedule();
    });document.addEventListener('change',schedule);
    window.addEventListener('resize',schedule);Store.on(schedule);
    if(read(MODE_KEY)==='glass-wheel')setMode('glass-wheel');
  };
  return {start,setMode,mode:()=>current,settings,refresh,select,keys:Object.freeze({mode:MODE_KEY,area:AREA_KEY})};
})();
