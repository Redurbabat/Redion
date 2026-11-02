/* Kapitel 12: echte, editierbare Akkuzellen und Pakete im Redion-Schaltplan.
 * Kein zusätzlicher Editor: Fachzeichen, Leitungen, Raster, Netzliste, Undo
 * und Speicherung kommen aus dem bestehenden Schaltplan-Werkzeug. */
(function (wurzel) {
  'use strict';
  const quelle=(n,u,i,ri=null,q=null)=>Array.from({length:n},()=>({u,i,ri,q}));
  const paket=(u,i)=>({u,i,ri:null,q:null});
  const AUFGABEN=[
    {id:'k9',name:'12.1 / 1a · 9 V',art:'Leclanché',zellen:quelle(6,1.5,1,.3,.5),zielU:9},
    {id:'k15',name:'12.1 / 1b · 1,5 V',art:'Leclanché',zellen:quelle(6,1.5,1,.3,.5),zielU:1.5},
    {id:'k45',name:'12.1 / 1c · 4,5 V',art:'Leclanché',zellen:quelle(6,1.5,1,.3,.5),zielU:4.5},
    {id:'k3',name:'12.1 / 1d · 3 V',art:'Leclanché',zellen:quelle(6,1.5,1,.3,.5),zielU:3},
    {id:'a12',name:'12.2 / 2 · 12 A',art:'Bleiakku',zellen:quelle(12,2,3),
      zielU:6,zielI:12,annahme:'2 V pro Bleiakku-Zelle als Annahme (im Blatt nicht ausdrücklich beschriftet).',
      info:'Alle zwölf Zellen und vier 2-Ω-Widerstände verwenden. Die Widerstände kannst du unten als Last vergleichen.'},
    {id:'a3',name:'12.2 / 3 · 3 A',art:'Leclanché',zellen:quelle(12,1.5,1),
      zielU:6,zielI:3,annahme:'1,5 V pro Leclanché-Zelle als Annahme.',
      info:'Alle zwölf Zellen verwenden. Voltmeter/Amperemeter im Lehrmittel; im Fach erscheinen U und I.'},
    {id:'taps',name:'12.3 / 4 · 4 Abgänge',art:'Bleiakku',zellen:quelle(36,2,10),
      anfang:11,ausgaenge:[
        {name:'4 V / 50 A',zielU:4,zielI:50},
        {name:'6 V / 40 A',zielU:6,zielI:40},
        {name:'8 V / 20 A',zielU:8,zielI:20},
        {name:'12 V / 10 A',zielU:12,zielI:10}
      ],annahme:'2 V je Bleiakku-Zelle (Nennwert).',
      info:'Gemeinsamer Minuspol, vier verschiedene Plus-Abgänge. Weitere Zellen selbst hinzufügen oder die Musterverdrahtung ansehen.'},
    {id:'pak24',name:'12.3 / 5 · 24 V / 12 A',art:'Akku-Pakete',
      zellen:[paket(12,6),paket(12,6),paket(6,12),paket(6,12)],zielU:24,zielI:12,
      links:[['aus-','n0'],['aus-','n1'],['p0','n2'],['p1','n2'],['p2','n3'],['p3','aus+']]},
    {id:'p6a',name:'12.4 / 6a · 24 V / 6 A',art:'Akku-Pakete',
      zellen:[paket(12,2),paket(12,4),paket(12,4),paket(6,2),paket(6,2)],zielU:24,zielI:6,
      links:[['aus-','n0'],['p0','n3'],['p3','n4'],['p4','aus+'],
             ['aus-','n1'],['p1','n2'],['p2','aus+']]},
    {id:'p6b',name:'12.4 / 6b · 12 V / 6 A',art:'Akku-Pakete',
      zellen:[paket(2,2),paket(4,2),paket(2,2),paket(4,6),paket(8,4)],zielU:12,zielI:6,
      links:[['aus-','n0'],['p0','n1'],['p1','n2'],['p2','n3'],
             ['aus-','n4'],['p4','n3'],['p3','aus+']]},
    {id:'p6c',name:'12.4 / 6c · 28 V / 10 A',art:'Akku-Pakete',
      zellen:[paket(12,10),paket(6,4),paket(8,6),paket(10,4),paket(8,6)],
      anfang:4,zielU:28,zielI:10,
      info:'Ein 8-V-/6-A-Akku wird zusätzlich benötigt.',
      links:[['aus-','n0'],['p0','n1'],['p0','n2'],['p1','n3'],['p2','n4'],
             ['p3','aus+'],['p4','aus+']]},
    {id:'u9',name:'Blatt 57 / 1a · 9 V',art:'Leclanché',zellen:quelle(6,1.5,.5,.5,.25),zielU:9},
    {id:'u15',name:'Blatt 57 / 1a · 1,5 V',art:'Leclanché',zellen:quelle(6,1.5,.5,.5,.25),zielU:1.5},
    {id:'u6',name:'Blatt 57 / 1b · 6 V',art:'Bleiakku',zellen:quelle(6,2,12,.05,72),zielU:6,
      annahme:'2 V je Bleiakku-Zelle angenommen.'},
    {id:'u4',name:'Blatt 57 / 1b · 4 V',art:'Bleiakku',zellen:quelle(6,2,12,.05,72),zielU:4,
      annahme:'2 V je Bleiakku-Zelle angenommen.'},
    {id:'b58-72',name:'Blatt 58 / 2 · 72 V / 12 A',art:'Akku-Pakete',
      zellen:[paket(72,6),paket(48,null),paket(null,6)],zielU:72,zielI:12,
      ergaenzen:[{i:1,Imax:6},{i:2,U:24}],
      info:'Fehlende Nenndaten selbst in den Akkus ergänzen.',
      links:[['aus-','n0'],['p0','aus+'],['aus-','n1'],['p1','n2'],['p2','aus+']]},
    {id:'b58-48',name:'Blatt 58 / 2 · 48 V / 12 A',art:'Akku-Pakete',
      zellen:[paket(24,4),paket(24,8),paket(12,4),paket(12,4),paket(24,8)],
      anfang:4,zielU:48,zielI:12,
      info:'Ein weiterer 24-V-/8-A-Akku ist zum Erreichen der Nenndaten nötig.',
      links:[['aus-','n0'],['p0','n2'],['p2','n3'],['p3','aus+'],
             ['aus-','n1'],['p1','n4'],['p4','aus+']]},
    {id:'b58-36',name:'Blatt 58 / 2 · 36 V / 18 A',art:'Akku-Pakete',
      zellen:[paket(36,null),paket(24,6),paket(24,6),
              paket(12,3),paket(12,3),paket(12,3),paket(12,3)],
      zielU:36,zielI:18,ergaenzen:[{i:0,Imax:6}],
      info:'Fehlenden Nennstrom ergänzen; die 12-V-Akkus passend parallel schalten.',
      links:[['aus-','n0'],['p0','aus+'],
             ['aus-','n1'],['p1','n3'],['p1','n4'],['p3','aus+'],['p4','aus+'],
             ['aus-','n2'],['p2','n5'],['p2','n6'],['p5','aus+'],['p6','aus+']]},
    {id:'frei',name:'Freies Üben · eigene Schaltung',art:'frei',
      zellen:quelle(6,1.5,1,.3,.5),
      info:'Erstelle eigene Reihen- und Parallelschaltungen. U, Ri, Imax, Q und den Laststrom kannst du direkt messen.'}
  ];
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[c]);
  const zeige=(v,e)=>v==null||!Number.isFinite(v)?'nicht angegeben':
    new Intl.NumberFormat('de-CH',{maximumFractionDigits:4}).format(v)+(e?' '+e:'');
  /* Keine vorgezeichneten Akkus: alles mit der normalen Palette selbst einsetzen. */
  const SELBST={id:'selbst',name:'Eigene Zeichnung · Batterien frei platzieren',
    art:'frei',zellen:[],
    info:'Batterien aus „Bauteile“ auf den Plan ziehen und mit Taste 2 verbinden. '+
      'Auch nachträglich platzierte Zellen werden automatisch mitgemessen. '+
      'Eine Batterie erhält ihre tatsächlichen Werte über „Akku einstellen“.'};
  const get=id=>id==='selbst'?SELBST:AUFGABEN.find(a=>a.id===id)||AUFGABEN[0];
  const soll=a=>a.zellen.length;
  const werteVon=p=>({
    ...(p.u==null?{}:{U:p.u}),
    ...(p.i==null?{}:{Imax:p.i}),
    ...(p.ri==null?{}:{Ri:p.ri}),
    ...(p.q==null?{}:{Q:p.q})
  });
  const zelleEinsetzen=(plan,p,index,x,y)=>{
    const t={id:Schaltplan.uid(),zeichen:'batterie',bmk:'G'+(index+1),
      x,y,drehung:0,gespiegelt:false,nummern:{},gruppe:'',ebene:'plan',
      werte:werteVon(p)};
    plan.teile.push(t);
    return t;
  };
  function planFuer(id) {
    const a=get(id),plan=Schaltplan.neuerPlan('stromlauf-aufgeloest');
    const mehr=!!a.ausgaenge;
    const einzeln=a.zellen.length===6 && a.zielU===a.zellen[0].u;
    const z=mehr?Math.min(a.anfang||soll(a),soll(a)):Math.min(a.anfang||soll(a),soll(a));
    const cols=mehr?6:einzeln?6:z>10?4:z>6?4:Math.max(1,Math.min(3,z));
    const dx=mehr?170:einzeln?145:175,dy=mehr?120:180;
    plan.breite=mehr?1660:Math.max(1150,160+cols*dx+300);
    plan.hoehe=mehr?1150:Math.max(720,200+Math.ceil(z/cols)*dy+150);
    const teile=[];
    for(let i=0;i<z;i++){
      const t=zelleEinsetzen(plan,a.zellen[i],i,105+(i%cols)*dx,
        (einzeln?300:120)+Math.floor(i/cols)*dy);
      teile.push(t.id);
    }
    const plusIds=[];
    const aus=a.ausgaenge||[{name:'Ausgang',zielU:a.zielU||0,zielI:a.zielI||0}];
    aus.forEach((o,i)=>{
      const x=mehr?1400:plan.breite-180,y=mehr?195+190*i:210;
      const t={id:Schaltplan.uid(),zeichen:'klemme',x,y,drehung:0,
        gespiegelt:false,bmk:'X'+(i+1)+'+',nummern:{},gruppe:'',ebene:'plan'};
      plan.teile.push(t); plusIds.push(t.id);
      plan.texte.push({id:Schaltplan.uid(),x:x+52,y:y-9,
        t:(mehr?o.name:'+')+' · PLUS',ebene:'plan'});
    });
    const mi={id:Schaltplan.uid(),zeichen:'klemme',x:mehr?1400:plan.breite-180,
      y:mehr?995:plan.hoehe-170,drehung:0,gespiegelt:false,
      bmk:'X−',nummern:{},gruppe:'',ebene:'plan'};
    plan.teile.push(mi);
    plan.texte.push({id:Schaltplan.uid(),x:mi.x+52,y:mi.y-9,t:'− MINUS',ebene:'plan'});
    plan.texte.push({id:Schaltplan.uid(),x:70,y:40,
      t:'Kapitel 12 · '+a.name+' · Zellen/Module selbst verbinden',ebene:'plan'});
    plan.batterieUebung={id:a.id,plus:plusIds[0],minus:mi.id,teile,
      ...(mehr?{ausgaenge:aus.map((o,i)=>({
        id:plusIds[i],name:o.name,zielU:o.zielU,zielI:o.zielI
      }))}:{})};
    return plan;
  }
  function gruppenFuer(a) {
    if(a.links) return a.links;
    if(a.ausgaenge) {
      const daten=[
        {n:2,anz:5,plus:'aus+0'},
        {n:3,anz:4,plus:'aus+1'},
        {n:4,anz:2,plus:'aus+2'},
        {n:6,anz:1,plus:'aus+3'}
      ];
      let start=0;const links=[];
      daten.forEach(d=>{
        for(let j=0;j<d.anz;j++){
          const von=start+j*d.n;
          links.push(['aus-','n'+von]);
          for(let k=1;k<d.n;k++)links.push(['p'+(von+k-1),'n'+(von+k)]);
          links.push(['p'+(von+d.n-1),d.plus]);
        }
        start+=d.n*d.anz;
      });
      return links;
    }
    const inReihe=a.zielU!=null?Math.round(a.zielU/a.zellen[0].u)
      :a.zellen.length;
    return wurzel.BatterieKern.reiheParallel(a.zellen.length,inReihe);
  }
  function beschriftungenNachziehen(plan) {
    const meta=plan.batterieUebung;
    if(!meta)return;
    const nachId=new Map(plan.teile.map(t=>[t.id,t]));
    const plusId=meta.ausgaenge?meta.ausgaenge.map(o=>o.id):[meta.plus];
    const labels=plan.texte.filter(t=>typeof t.t==='string'&&t.t.includes(' · PLUS'));
    plusId.forEach((id,i)=>{
      const t=nachId.get(id),label=labels[i];
      if(t&&label){label.x=t.x+52;label.y=t.y-9;}
    });
    const mi=nachId.get(meta.minus),neg=plan.texte.find(t=>t.t==='− MINUS');
    if(mi&&neg){neg.x=mi.x+52;neg.y=mi.y-9;}
  }

  /* Lehrmittel mit Mehrfachabgängen und verschachtelten Parallelläufen:
   * vorhersehbare Busschienen statt automatischem Wegfinden mit
   * unbeabsichtigten Leitungskreuzungen. */
  function schienenMuster(plan,a) {
    if(a.id!=='taps'&&a.id!=='b58-36')return false;
    const meta=plan.batterieUebung;
    const lookup=id=>plan.teile.find(t=>t.id===id);
    const zellen=meta.teile.map(lookup),minus=lookup(meta.minus);
    const out=meta.ausgaenge?meta.ausgaenge.map(x=>lookup(x.id)):[lookup(meta.plus)];
    const ort=(t,nr)=>Schaltplan.anschlussOrt(t,nr);
    const draht=(punkte,an=null,anNr=null,bis=null,bisNr=null)=>{
      plan.leitungen.push({id:Schaltplan.uid(),punkte:punkte.map(p=>({x:p.x,y:p.y})),
        ebene:'plan',
        ...(an?{vonTeil:an.id,vonNr:anNr}:{}),
        ...(bis?{nachTeil:bis.id,nachNr:bisNr}:{})});
    };
    const senkrecht=(t,nr,y)=>{const p=ort(t,nr);draht([p,{x:p.x,y}],t,nr);};
    const waagrecht=(t,nr,x)=>{const p=ort(t,nr);draht([p,{x,y:p.y}],t,nr);};
    if(a.id==='taps'){
      plan.breite=2700;plan.hoehe=1260;
      const gruppen=[{n:2,z:5},{n:3,z:4},{n:4,z:2},{n:6,z:1}];
      let spalte=0,index=0;
      for(let gi=0;gi<gruppen.length;gi++){
        const g=gruppen[gi],xs=[];
        for(let j=0;j<g.z;j++){
          const x=120+(spalte++)*180;xs.push(x+20);
          const kette=[];
          for(let k=0;k<g.n;k++){
            const t=zellen[index++];
            t.x=x;t.y=980-k*125;kette.push(t);
          }
          senkrecht(kette[0],'−',1110);
          for(let k=1;k<kette.length;k++){
            const unten=ort(kette[k-1],'+'),oben=ort(kette[k],'−');
            draht([unten,oben],kette[k-1],'+',kette[k],'−');
          }
          const bussY=980-(g.n-1)*125-70;
          senkrecht(kette[g.n-1],'+',bussY);
        }
        const y=980-(g.n-1)*125-70, p=out[gi];
        p.x=Math.max(...xs)+110-20;p.y=y;
        waagrecht(p,'1',Math.min(...xs));
      }
      minus.x=2450;minus.y=1110;
      waagrecht(minus,'1',140);
      beschriftungenNachziehen(plan);
      return true;
    }
    plan.breite=1780;plan.hoehe=1450;
    const pos=[[200,740],[650,840],[1100,840],[570,430],
               [710,430],[1020,430],[1180,430]];
    zellen.forEach((t,i)=>{t.x=pos[i][0];t.y=pos[i][1];});
    const plus=out[0];
    plus.x=1450;plus.y=130;minus.x=1450;minus.y=1290;
    waagrecht(plus,'1',220);
    waagrecht(minus,'1',220);
    for(const i of [0,3,4,5,6])senkrecht(zellen[i],'+',130);
    for(const i of [0,1,2])senkrecht(zellen[i],'−',1290);
    // Zwei unabhängige Mittelschienen: jeweils 24 V in Reihe
    // mit zwei parallelen 12-V-/3-A-Paketen.
    for(const [vor,parallel] of [[1,[3,4]],[2,[5,6]]]){
      const x0=ort(zellen[parallel[0]],'−').x;
      const x1=ort(zellen[parallel[1]],'−').x;
      senkrecht(zellen[vor],'+',660);
      parallel.forEach(i=>senkrecht(zellen[i],'−',660));
      draht([{x:x0,y:660},{x:x1,y:660}]);
    }
    beschriftungenNachziehen(plan);
    return true;
  }

  function musterFuer(plan) {
    const meta=plan&&plan.batterieUebung;
    if(!meta)throw Error('Keine Batterieaufgabe.');
    const a=get(meta.id);
    if(a.id==='selbst')throw Error('Für frei gezeichnete Schaltungen gibt es kein festes Muster.');
    const nachId=()=>new Map(plan.teile.map(t=>[t.id,t]));
    if(meta.teile.length>soll(a) && a.id!=='frei')
      throw Error('Für dieses Muster sind zusätzliche Zellen vorhanden.');
    const spalten=a.ausgaenge?6:Math.min(4,soll(a));
    while(meta.teile.length<soll(a)){
      const i=meta.teile.length;
      const t=zelleEinsetzen(plan,a.zellen[i],i,
        105+(i%spalten)*(a.ausgaenge?170:175),
        120+Math.floor(i/spalten)*(a.ausgaenge?120:180));
      meta.teile.push(t.id);
    }
    (a.ergaenzen||[]).forEach(e=>{
      const t=nachId().get(meta.teile[e.i]);
      if(t)t.werte={...t.werte,
        ...(e.U==null?{}:{U:e.U}),
        ...(e.Imax==null?{}:{Imax:e.Imax})};
    });
    const zellen=meta.teile.map(id=>nachId().get(id));
    if(zellen.some(t=>!t||t.zeichen!=='batterie'))
      throw Error('Zellen fehlen oder wurden durch andere Bauteile ersetzt.');
    const endpoints=new Map();
    zellen.forEach((t,i)=>{endpoints.set('n'+i,{t,nr:'−'});
                             endpoints.set('p'+i,{t,nr:'+'});});
    const plus=nachId().get(meta.plus),minus=nachId().get(meta.minus);
    if(!plus||!minus)throw Error('Ausgangsklemmen fehlen.');
    endpoints.set('aus+',{t:plus,nr:'1'});
    endpoints.set('aus-',{t:minus,nr:'1'});
    (meta.ausgaenge||[]).forEach((o,i)=>{
      const t=nachId().get(o.id);
      if(!t)throw Error('Ein Plus-Abgang fehlt.');
      endpoints.set('aus+'+i,{t,nr:'1'});
    });
    plan.leitungen=[];
    if(schienenMuster(plan,a))return plan;
    if(['p6c','b58-48'].includes(a.id)) {
      plan.breite=2200;plan.hoehe=1800;
      zellen.forEach((t,i)=>{t.x=150+(i%2)*350;t.y=230+Math.floor(i/2)*240;});
      plus.x=2020;plus.y=120;minus.x=2020;minus.y=1660;
    }
    const links=a.id==='frei'
      ? wurzel.BatterieKern.reiheParallel(meta.teile.length,meta.teile.length)
      : gruppenFuer(a);
    for(const [von,nach] of links){
      const x=endpoints.get(von),y=endpoints.get(nach);
      if(!x||!y)throw Error('Musteranschluss '+von+' / '+nach+' fehlt.');
      const start=Schaltplan.anschlussOrt(x.t,x.nr);
      const ziel=Schaltplan.anschlussOrt(y.t,y.nr);
      const pfad=Schaltplan.leitungFuehren(plan,start,ziel,
        {teil:x.t.id,nr:x.nr},{teil:y.t.id,nr:y.nr});
      if(!pfad||pfad.length<2)throw Error('Leitung konnte nicht geführt werden.');
      plan.leitungen.push({id:Schaltplan.uid(),punkte:pfad.map(p=>({x:p.x,y:p.y})),
        ebene:'plan',vonTeil:x.t.id,vonNr:x.nr,nachTeil:y.t.id,nachNr:y.nr});
    }
    beschriftungenNachziehen(plan);
    return plan;
  }
  function erstelle(optionen) {
    const el=optionen.element;
    let wahl=(optionen.holePlan().batterieUebung||{}).id||'k9';
    let ausgang=0,widerstand='10',schalter=false,lastart='eigen';
    let neuArt='leclanche',anzahl=1;
    const anschlussHilfe='Leitung ziehen (Taste 2): Plus/Minus der Akkus mit X+ und X− verbinden. '+
      'Reihe: + an − des nächsten Akkus. Parallel: alle Pluspole zusammen und alle Minuspole zusammen. '+
      'Leitungen und Zellwerte bleiben im normalen Redion-Schaltplan gespeichert.';
    const datenArt={
      leclanche:{u:1.5,i:1,ri:.3,q:.5},
      bleiak:  {u:2,i:10,ri:null,q:null},
      'akku-12':{u:12,i:6,ri:null,q:null},
      'akku-6': {u:6,i:12,ri:null,q:null},
      'akku-8': {u:8,i:6,ri:null,q:null}
    };
    function eigeneAusZeichnung() {
      const plan=optionen.holePlan();
      if(plan.batterieUebung)return true;
      const akkus=plan.teile.filter(t=>t.zeichen==='batterie');
      if(!akkus.length)return false;
      const x=Math.max(960,...plan.teile.map(t=>Number(t.x)||0))+160;
      const y=Math.max(260,...plan.teile.map(t=>Number(t.y)||0))+150;
      optionen.aendere(()=>{
        const plus={id:Schaltplan.uid(),zeichen:'klemme',bmk:'X+',
          x,y:180,drehung:0,gespiegelt:false,nummern:{},gruppe:'',ebene:'plan'};
        const minus={...plus,id:Schaltplan.uid(),bmk:'X−',y};
        plan.teile.push(plus,minus);
        plan.texte.push({id:Schaltplan.uid(),x:x+52,y:170,t:'X+ · PLUS',ebene:'plan'});
        plan.texte.push({id:Schaltplan.uid(),x:x+52,y:y-9,t:'− MINUS',ebene:'plan'});
        plan.batterieUebung={id:'selbst',plus:plus.id,minus:minus.id,
          teile:akkus.slice(0,64).map(t=>t.id)};
        plan.breite=Math.max(Number(plan.breite)||0,x+250);
        plan.hoehe=Math.max(Number(plan.hoehe)||0,y+160);
      });
      wahl='selbst';schalter=false;lastart='ohne';return true;
    }
    function messung(i) {
      const plan=optionen.holePlan();
      if(!plan.batterieUebung)return null;
      if(!wurzel.BatterieKern||typeof Stromfluss==='undefined')
        return {ok:false,grund:'Batterierechner oder Netzliste nicht geladen.'};
      try{return wurzel.BatterieKern.ausPlan(plan,Stromfluss.netze(plan),i||0);}
      catch(e){return {ok:false,grund:'Die Verbindungen konnten nicht gelesen werden.'};}
    }
    const passt=(r,ziel,plan,a)=>!!(r&&r.ok&&
      (!ziel.zielU||Math.abs(r.u-ziel.zielU)<1e-6)&&
      (!ziel.zielI||r.maxA+1e-7>=ziel.zielI)&&
      (a.id==='frei'||plan.batterieUebung.teile.length===soll(a)));
    const zahlen=r=>'<div class="sp-bat-werte">'+
      [['U (Leerlauf)',zeige(r.u,'V')],['Ri (gesamt)',zeige(r.ri,'Ω')],
       ['Imax',zeige(r.maxA,'A')],['Q (gesamt)',zeige(r.ah,'Ah')]].map(
        ([x,y])=>'<span><b>'+esc(x)+'</b> '+esc(y)+'</span>').join('')+'</div>';
    function wirksameLast() {
      const plan=optionen.holePlan();
      if(plan.batterieUebung&&wurzel.BatterieKern&&typeof Stromfluss!=='undefined'){
        try {
          const gezeichnet=wurzel.BatterieKern.lastAusPlan(
            plan,Stromfluss.netze(plan),ausgang);
          if(gezeichnet)return {...gezeichnet,gezeichnet:true};
        }catch(_e){/* Die Netzliste wird bei der eigentlichen Messung geprüft. */}
      }
      /* Eine offene selbst gezeichnete Last darf keine erfundene
         Stromstärke durch den Testwiderstand anzeigen. */
      if(plan.teile.some(t=>t.zeichen==='widerstand'))
        return {ok:false,gezeichnet:true,grund:'Gezeichneter Verbraucher offen: Widerstand mit X+ und X− verbinden.'};
      if(plan.batterieUebung&&plan.batterieUebung.id==='selbst'&&lastart==='ohne')
        return {ok:false,gezeichnet:false,grund:'Leerlauf: I = 0 A. Zeichne einen Widerstand oder wähle eine Testlast.'};
      const ohm=Number(widerstand);
      return {ok:Number.isFinite(ohm)&&ohm>0&&ohm<=1000000,
        ohm,gezeichnet:false,grund:'Gib einen positiven Testlastwiderstand in Ω ein.'};
    }
    function lastAnzeige(r) {
      const last=wirksameLast(),R=last.ohm;
      const strom=r&&r.ok&&schalter&&last.ok?r.u/(R+(r.ri||0)):0;
      const spannung=strom*R;
      const leuchtet=strom>1e-8;
      let txt='';
      if(!r||!r.ok)txt='Kein Strom: '+(r&&r.grund?r.grund:'Erst die Batterien verdrahten.');
      else if(!schalter)txt='Strom AUS · I = 0 A. '+(last.ok?'R der Last = '+zeige(R,'Ω'):'');
      else if(!last.ok)txt=last.grund;
      else txt='Strom I = '+zeige(strom,'A')+' · Last R = '+zeige(R,'Ω')+
        (last.gezeichnet?' (aus deiner Zeichnung)':' (einstellbare Testlast)')+
        ' · Gesamtwiderstand Ri + R = '+(r.ri===null?'nicht vollständig bekannt':
          zeige(R+r.ri,'Ω'))+
        ' · Lastspannung = '+zeige(spannung,'V')+
        ' · Leistung = '+zeige(strom*spannung,'W')+
        (r.ri===null?' · Idealmodell, da Innenwiderstand unbekannt':'')+
        (strom>r.maxA+1e-8?' · ACHTUNG: Nennstrom überschritten!':'');
      return '<div class="sp-bat-strombild"><span class="sp-bat-birne '+
        (leuchtet?'an':'')+'" role="img" aria-label="'+(leuchtet?'Verbraucher eingeschaltet':'Kein Stromfluss')+
        '">◉</span><span class="sp-bat-stromtext">'+esc(txt)+'</span></div>';
    }
    function ergebnis(r,ziel,plan,a) {
      if(!r)return '';
      if(!r.ok)return '<p class="sp-bat-fehler" role="status">'+esc(r.grund)+'</p>'+
        lastAnzeige(r);
      const ok=passt(r,ziel,plan,a);
      return '<p class="'+(ok?'sp-bat-gut':'sp-bat-fehler')+'" role="status">'+
        (a.id==='frei'?'Schaltung erkannt — vergleiche die Messwerte.':
          ok?'Richtig! Zielspannung und Nennstrom erreicht.':
          'Noch nicht am Ziel: U, Strombelastbarkeit oder Anzahl der Akkus passen nicht.')+
        '</p>'+zahlen(r)+
        (r.ignorierte?'<p class="sp-bat-hinweis">'+r.ignorierte+
          ' andere Zellen gehören zu weiteren Ausgängen.</p>':'')+
        (r.nennregel?'<p class="sp-bat-hinweis">Imax nach schulischer Reihen-/Parallel-Nennregel. '+
          'Ohne Ri sind reale Ausgleichsströme und Lastabfälle nicht berechenbar.</p>':'')+
        lastAnzeige(r);
    }
    function aktualisiere() {
      if(!el)return;
      const plan=optionen.holePlan(),meta=plan.batterieUebung;
      const a=meta?get(meta.id):get(wahl),ids=optionen.holeAuswahl();
      const t=meta&&ids.length===1?plan.teile.find(x=>
        x.id===ids[0]&&x.zeichen==='batterie'):null;
      const eigene=meta&&meta.id==='selbst';
      const gezeichnete=plan.teile.filter(x=>x.zeichen==='batterie').length;
      const w=t?t.werte||{}:{};
      const ziel=a.ausgaenge?a.ausgaenge[Math.min(ausgang,a.ausgaenge.length-1)]:a;
      let html='<div class="sp-bat-kopf"><strong>Kapitel 12 · Batterien live üben</strong>'+
        '<span>Reihe · Parallel · Akku-Pakete · Stromfluss</span></div>'+
        '<div class="sp-bat-bedienung"><label>Lehrmittel-Aufgabe <select data-bat="wahl">'+
        AUFGABEN.map(e=>'<option value="'+esc(e.id)+'"'+
          (e.id===wahl?' selected':'')+'>'+esc(e.name)+'</option>').join('')+
        '</select></label><button type="button" data-bat="einsetzen">Aufgabe einsetzen</button>'+
        '<button type="button" data-bat="leer">Leere Batteriezeichnung starten</button></div>';
      if(!meta){
        html+='<p class="sp-bat-hinweis">Batterien komplett selbst zeichnen? „Leere Batteriezeichnung starten“ '+
          'wählen oder mit der normalen Bauteilpalette Akkus platzieren und dann „Vorhandene Zeichnung messen“ anklicken.</p>'+
          '<button type="button" data-bat="uebernehmen">Vorhandene Zeichnung messen ('+
          gezeichnete+' Batterien)</button>';
      }else{
        html+='<p class="sp-bat-hinweis"><b>'+esc(a.name)+'</b> · '+
          (eigene?gezeichnete+' selbst gezeichnete Batterien':
            meta.teile.length+' von '+soll(a)+' geplanten '+esc(a.art)+'-Zellen/Paketen')+
          (a.zielU?' · Ziel '+zeige(a.zielU,'V'):'')+
          (a.zielI?' / '+zeige(a.zielI,'A'):'')+'.</p>';
        if(a.annahme)html+='<p class="sp-bat-hinweis">Annahme: '+esc(a.annahme)+'</p>';
        if(a.info)html+='<p class="sp-bat-hinweis">'+esc(a.info)+'</p>';
        html+='<details class="sp-bat-lernhilfe"><summary>So übst du die Schaltung Schritt für Schritt</summary>'+
          '<p><b>1. Batterien einsetzen:</b> Die Zellen erscheinen direkt in der Zeichenfläche. Zusätzliche Akkus mit „Weiteren Akku hinzufügen“ platzieren; eine Zelle anklicken, um U, Ri, Imax und Q zu bearbeiten.</p>'+
          '<p><b>2. Reihenschaltung:</b> Plus (+) mit dem Minus (−) der nächsten Batterie verbinden. Die Spannungen addieren sich, der zulässige Strom wird durch das schwächste Glied begrenzt.</p>'+
          '<p><b>3. Parallelschaltung:</b> Alle Pluspole miteinander und alle Minuspole miteinander verbinden. Nur Zweige mit gleicher Spannung parallel verbinden. Die zulässigen Ströme addieren sich im vereinfachten Schulmodell.</p>'+
          '<p><b>4. Leitungen ziehen:</b> Mit dem vorhandenen Werkzeug „Leitung ziehen“ (Taste 2) die Anschlüsse verbinden. Am Ende die Schaltung an die Klemmen X+ und X− anschliessen.</p>'+
          '<p><b>5. Testen:</b> „Jetzt prüfen“ anklicken, dann eine Last wählen und „Strom einschalten“ aktivieren. Angezeigt werden Spannung, Strom, Leistung und mögliche Fehler.</p>'+
          '<p><b>6. Lösung vergleichen:</b> „Musterverdrahtung zeigen“ verwenden; danach mit Rückgängig wieder selbst probieren.</p>'+
          '<p><b>Achtung:</b> Die Stromanzeige ist eine Lernsimulation, keine echte Stromversorgung. Bei unbekanntem Innenwiderstand wird die ideale Näherung verwendet.</p></details>';
        html+='<p class="sp-bat-hinweis">'+esc(anschlussHilfe)+'</p>'+
          '<div class="sp-bat-bedienung">'+
          (eigene?'':'<button type="button" data-bat="muster">Musterverdrahtung zeigen</button>')+
          '<button type="button" data-bat="pruefen">Jetzt prüfen</button></div>';
        html+='<div class="sp-bat-ergaenzen"><label>Weiteren Akku hinzufügen <select data-bat="neuArt">'+
          [['leclanche','1,5 V / 1 A · Leclanché'],['bleiak','2 V / 10 A · Bleiakku'],
           ['akku-12','12 V / 6 A · Akku'],['akku-6','6 V / 12 A · Akku'],
           ['akku-8','8 V / 6 A · Akku']].map(([v,n])=>
            '<option value="'+v+'"'+(neuArt===v?' selected':'')+'>'+n+'</option>').join('')+
          '</select></label><label>Anzahl <input type="number" data-bat="anzahl" min="1" max="16" value="'+
          esc(anzahl)+'"></label><button type="button" data-bat="hinzu">Einsetzen</button></div>';
        if(t) {
          html+='<fieldset class="sp-bat-eingaben"><legend>'+esc(t.bmk)+
            ' · ausgewählten Akku einstellen</legend>'+
            [['U','Spannung U (V)'],['Ri','Innenwiderstand Ri (Ω)'],
             ['Imax','Nenn-/Maximalstrom (A)'],['Q','Kapazität Q (Ah)']].map(([key,label])=>
              '<label>'+esc(label)+'<input type="number" inputmode="decimal" step="any" '+
              'min="0" data-bat-wert="'+key+'" value="'+esc(w[key]===undefined?'':w[key])+
              '" placeholder="nicht angegeben"></label>').join('')+
            '<button type="button" data-bat="werte">Werte übernehmen</button>'+
            '<button type="button" data-bat="loeschen">Akku entfernen</button></fieldset>';
        }else html+='<p class="sp-bat-hinweis">Akku im Schaltplan anklicken, um U, Ri, Imax und Q zu verändern.</p>';
        if(meta.ausgaenge&&meta.ausgaenge.length){
          html+='<div class="sp-bat-abgaenge"><label>Mess-Abgang <select data-bat="ausgang">'+
            meta.ausgaenge.map((o,i)=>'<option value="'+i+'"'+(i===ausgang?' selected':'')+'>'+
              esc(o.name)+'</option>').join('')+'</select></label></div>';
          const werte=meta.ausgaenge.map((o,i)=>({
            label:o.name,ok:passt(messung(i),o,plan,a)
          }));
          html+='<p class="sp-bat-hinweis">Alle Abgänge: '+
            werte.map(x=>esc(x.label)+' '+(x.ok?'✓':'✗')).join(' · ')+'</p>';
        }
        const r=messung(ausgang);
        html+='<div class="sp-bat-messung" aria-live="polite">'+ergebnis(r,ziel,plan,a)+'</div>'+
          '<div class="sp-bat-last"><p class="sp-bat-hinweis">Ist ein gezeichneter Widerstands-Stromkreis '+
          'zwischen X+ und X− geschlossen, wird dessen Ersatzwiderstand automatisch verwendet. '+
          'Sonst gilt die hier eingestellte Testlast.</p>'+
          '<label>Testlast aus Widerständen <select data-bat="lastart">'+
          [['ohne','Kein Verbraucher (Leerlauf)'],['eigen','Eigener Widerstand'],['einzeln','Ein Widerstand 2 Ω'],
           ['vierparallel','4 × 2 Ω parallel = 0,5 Ω'],
           ['vierreihe','4 × 2 Ω in Reihe = 8 Ω'],
           ['viergemischt','2+2 Ω parallel zu 2+2 Ω = 2 Ω']].map(([v,n])=>
            '<option value="'+v+'"'+(lastart===v?' selected':'')+'>'+n+'</option>').join('')+
          '</select></label><label>R (Ω) <input type="number" data-bat="last" min=".01" '+
          'step="any" value="'+esc(widerstand)+'"></label>'+
          '<label class="sp-bat-check"><input type="checkbox" data-bat="schalter" '+
          (schalter?'checked':'')+'> Strom einschalten</label></div>';
      }
      el.innerHTML=html;
    }
    el.addEventListener('change',e=>{
      const t=e.target;if(!t||!t.dataset)return;
      if(t.dataset.bat==='wahl')wahl=t.value;
      if(t.dataset.bat==='ausgang')ausgang=Number(t.value)||0;
      if(t.dataset.bat==='neuArt')neuArt=t.value;
      if(t.dataset.bat==='anzahl')anzahl=Math.min(16,Math.max(1,Number(t.value)||1));
      if(t.dataset.bat==='schalter'){
        schalter=t.checked;
        if(optionen.nachStromwechsel)optionen.nachStromwechsel();
      }
      if(t.dataset.bat==='last')widerstand=t.value.replace(',','.');
      if(t.dataset.bat==='lastart'){
        lastart=t.value;
        const werte={einzeln:2,vierparallel:.5,vierreihe:8,viergemischt:2};
        if(werte[lastart]!=null)widerstand=String(werte[lastart]);
      }
      aktualisiere();
    });
    el.addEventListener('click',e=>{
      const b=e.target.closest('[data-bat]');
      if(!b||!['einsetzen','leer','uebernehmen','muster','pruefen','hinzu','werte','loeschen'].includes(b.dataset.bat))
        return;
      const action=b.dataset.bat,plan=optionen.holePlan();
      if(action==='uebernehmen'){
        if(!eigeneAusZeichnung())window.alert('Platziere zuerst mindestens eine Batterie aus der Bauteilpalette.');
        aktualisiere();return;
      }
      if(action==='leer'){
        if((plan.teile.length||plan.leitungen.length||plan.texte.length)&&
          !window.confirm('Aktuellen Plan durch eine leere Batteriezeichnung ersetzen?'))return;
        const neu=planFuer('selbst');wahl='selbst';ausgang=0;schalter=false;lastart='ohne';
        optionen.aendere(()=>optionen.setzePlan(neu));
        optionen.nachPlanwechsel();aktualisiere();return;
      }
      if(action==='einsetzen'){
        if((plan.teile.length||plan.leitungen.length||plan.texte.length)&&
          !window.confirm('Aktuellen Plan durch diese Aufgabe ersetzen? Rückgängig bleibt möglich.'))return;
        const neu=planFuer(wahl);ausgang=0;schalter=false;lastart='eigen';
        optionen.aendere(()=>optionen.setzePlan(neu));
        optionen.nachPlanwechsel();aktualisiere();return;
      }
      if(!plan.batterieUebung)return;
      const a=get(plan.batterieUebung.id);
      if(action==='pruefen'){aktualisiere();return;}
      if(action==='muster'){
        if(plan.leitungen.length&&
          !window.confirm('Deine Verdrahtung durch das Muster ersetzen? Rückgängig stellt sie wieder her.'))return;
        const kopie=JSON.parse(JSON.stringify(plan));
        try{musterFuer(kopie);}
        catch(err){window.alert('Muster nicht einsetzbar: '+err.message);return;}
        optionen.aendere(()=>optionen.setzePlan(kopie));
        optionen.nachPlanwechsel();aktualisiere();return;
      }
      if(action==='hinzu'){
        const meta=plan.batterieUebung;
        if(meta.teile.length+anzahl>64){window.alert('Maximal 64 Akkus je Übung.');return;}
        const vorlage=datenArt[neuArt]||datenArt.leclanche;
        optionen.aendere(()=>{
          for(let k=0;k<anzahl;k++){
            const i=meta.teile.length;
            const t=zelleEinsetzen(plan,vorlage,i,
              115+(i%6)*165,160+Math.floor(i/6)*145);
            meta.teile.push(t.id);
            plan.breite=Math.max(plan.breite,t.x+400);
            plan.hoehe=Math.max(plan.hoehe,t.y+240);
          }
        });
        aktualisiere();return;
      }
      const ids=optionen.holeAuswahl();
      const t=ids.length===1?plan.teile.find(x=>x.id===ids[0]&&x.zeichen==='batterie'):null;
      if(!t)return;
      if(action==='loeschen'){
        if(!window.confirm('Diesen Akku aus der Aufgabe entfernen?'))return;
        optionen.aendere(()=>{
          plan.teile=plan.teile.filter(x=>x.id!==t.id);
          plan.leitungen=plan.leitungen.filter(x=>x.vonTeil!==t.id&&x.nachTeil!==t.id);
          plan.batterieUebung.teile=plan.batterieUebung.teile.filter(id=>id!==t.id);
        });
        aktualisiere();return;
      }
      const neu={...t.werte};
      for(const f of el.querySelectorAll('[data-bat-wert]')){
        const key=f.dataset.batWert,raw=f.value.trim().replace(',','.');
        if(!raw){delete neu[key];continue;}
        const wert=Number(raw);
        if(!Number.isFinite(wert)||wert<=0||wert>1e6){
          window.alert('Nur positive Nenndaten bis 1 000 000 verwenden.');return;
        }
        neu[key]=wert;
      }
      optionen.aendere(()=>{
        const aktuell=optionen.holePlan().teile.find(x=>x.id===t.id);
        if(aktuell)aktuell.werte=neu;
      });
      aktualisiere();
    });
    return {aktualisiere,stromAn:()=>schalter,
      stromSetzen:(an)=>{schalter=!!an;if(optionen.nachStromwechsel)optionen.nachStromwechsel();aktualisiere();},
      ausZeichnung:eigeneAusZeichnung};
  }
  wurzel.BatterieAufgaben={erstelle,planFuer,musterFuer,aufgaben:AUFGABEN};
  if(typeof module!=='undefined'&&module.exports)
    module.exports={erstelle,planFuer,musterFuer,aufgaben:AUFGABEN};
})(typeof window!=='undefined'?window:globalThis);
