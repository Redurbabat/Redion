/* Batterieaufgaben im ECHTEN Schaltplanblock, keine zweite Zeichenfläche.
 * Baut ausschliesslich Schaltplan-Teile; Leitungen, Raster, Undo, Speicherung,
 * Fang und Netzliste bleiben die des Redion-Editors.
 * Je Aufgabe: drei Eingaben/Anzeigen, nur ein Rechner BatterieKern. */
(function (wurzel) {
  'use strict';
  const AUFGABEN = [
    { id:'k9',   name:'Kap. 12.1 a · 9 V',          zahl:6,  u:1.5, ri:.3,  i:1,  q:.5,   zielU:9,   art:'Leclanché' },
    { id:'k15',  name:'Kap. 12.1 b · 1,5 V',        zahl:6,  u:1.5, ri:.3,  i:1,  q:.5,   zielU:1.5, art:'Leclanché' },
    { id:'k45',  name:'Kap. 12.1 c · 4,5 V',        zahl:6,  u:1.5, ri:.3,  i:1,  q:.5,   zielU:4.5, art:'Leclanché' },
    { id:'k3',   name:'Kap. 12.1 d · 3 V',          zahl:6,  u:1.5, ri:.3,  i:1,  q:.5,   zielU:3,   art:'Leclanché' },
    { id:'u9',   name:'Blatt 57 a · 9 V',           zahl:6,  u:1.5, ri:.5,  i:.5, q:.25,  zielU:9,   art:'Leclanché' },
    { id:'u15',  name:'Blatt 57 a · 1,5 V',         zahl:6,  u:1.5, ri:.5,  i:.5, q:.25,  zielU:1.5, art:'Leclanché' },
    { id:'u6',   name:'Blatt 57 b · 6 V',           zahl:6,  u:2,   ri:.05, i:12, q:72,   zielU:6,   art:'Bleiakku', annahme:'2 V je Bleiakku-Zelle angenommen.' },
    { id:'u4',   name:'Blatt 57 b · 4 V',           zahl:6,  u:2,   ri:.05, i:12, q:72,   zielU:4,   art:'Bleiakku', annahme:'2 V je Bleiakku-Zelle angenommen.' },
    { id:'a12',  name:'Kap. 12.2 · 12 A',          zahl:12, u:2,   ri:null,i:3,q:null,  zielI:12,  art:'Bleiakku', annahme:'2 V je Bleiakku-Zelle angenommen; Ri und Q nicht angegeben.' },
    { id:'a3',   name:'Kap. 12.2 · 3 A',           zahl:12, u:1.5, ri:null,i:1,q:null,  zielI:3,   art:'Leclanché', annahme:'1,5 V je Leclanché-Zelle angenommen; Ri und Q nicht angegeben.' }
  ];
  const esc = wert => String(wert == null ? '' : wert).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
  const zeige = (v,einheit) => v == null ? '–' : new Intl.NumberFormat('de-CH', {
    maximumFractionDigits: 4
  }).format(v) + ' ' + einheit;
  const get = id => AUFGABEN.find(x=>x.id===id) || AUFGABEN[0];

  /* Rein planbezogener Aufbau: dieselben Blöcke, die das Zeichnen-Werkzeug
     von Hand schreibt. Die Klemmen X+ und X− sind echte Fachzeichen;
     angeschlossen wird jeweils Klemme 1. */
  function planFuer(aufgabe) {
    const a = get(aufgabe);
    const plan = Schaltplan.neuerPlan('stromlauf-aufgeloest');
    plan.breite = 1000;
    plan.hoehe = 700;
    const teile = [];
    const einsetzen = (zeichen, bmk, x, y, werte) => {
      const t = {
        id:Schaltplan.uid(), zeichen, x,y, drehung:0, gespiegelt:false,
        bmk, nummern:{}, gruppe:'', ebene:'plan'
      };
      if (werte) t.werte=werte;
      plan.teile.push(t);
      return t;
    };
    const cols = a.zahl === 6 ? 2 : 3;
    const stepX = a.zahl === 6 ? 230 : 200;
    const stepY = a.zahl === 6 ? 165 : 140;
    for (let i=0;i<a.zahl;i++) {
      const row=Math.floor(i/cols), col=i%cols;
      const t=einsetzen('batterie','G'+(i+1),
        130 + stepX*col, 80 + stepY*row,
        {
          U:a.u, Imax:a.i,
          ...(a.ri===null ? {} : { Ri:a.ri }),
          ...(a.q===null ? {} : { Q:a.q })
        });
      teile.push(t.id);
    }
    const plus=einsetzen('klemme','X+',785,220);
    const minus=einsetzen('klemme','X−',785,430);
    const text=(x,y,t)=>plan.texte.push({id:Schaltplan.uid(),x,y,t,ebene:'plan'});
    text(850,220,'+ Ausgang');
    text(850,430,'− Ausgang');
    text(70,40,'Batteriezellen: Anschlüsse + / −');
    plan.batterieUebung={id:a.id, plus:plus.id, minus:minus.id, teile};
    return plan;
  }

  function erstelle(optionen) {
    const el=optionen.element;
    let wahl=(optionen.holePlan().batterieUebung || {}).id || 'k9';
    let widerstand='';
    let schalter=true;
    let zuletzt='';
    const hilfe='Wähle links das Werkzeug „Leitung ziehen“ und verbinde die ' +
      'Pole der Zellen mit den Klemmen X+ und X−. Der normale Redion-Zeichner ' +
      'speichert alle Leitungen und kann sie zurücknehmen.';

    const messung=()=>{
      const plan=optionen.holePlan();
      const meta=plan.batterieUebung;
      if (!meta) return null;
      if (!wurzel.BatterieKern || typeof Stromfluss === 'undefined')
        return { ok:false, grund:'Batterie-Rechner oder Netzliste nicht geladen.' };
      try {
        return wurzel.BatterieKern.ausPlan(plan,Stromfluss.netze(plan));
      } catch(e) {
        return { ok:false, grund:'Die Planverbindungen konnten nicht gelesen werden.' };
      }
    };
    const auswertung=(r,a)=>{
      if (!r) return '';
      if (!r.ok) return '<p class="sp-bat-fehler" role="status">' + esc(r.grund) + '</p>';
      const spannungOK=a.zielU === undefined || Math.abs(r.u-a.zielU)<1e-6;
      const stromOK=a.zielI === undefined || r.maxA + 1e-6 >= a.zielI;
      const richtig=spannungOK && stromOK;
      const meldung=richtig?'Ziel erreicht — richtig verdrahtet.':
        'Noch nicht richtig: Spannung oder Strombelastbarkeit passen nicht.';
      let html='<p class="' + (richtig?'sp-bat-gut':'sp-bat-fehler') +
        '" role="status">' + esc(meldung) + '</p>';
      const paar=[['U (Leerlauf)',zeige(r.u,'V')],
                  ['Ri (gesamt)',zeige(r.ri,'Ω')],
                  ['Imax (gesamt)',zeige(r.maxA,'A')],
                  ['Q (gesamt)',zeige(r.ah,'Ah')]];
      html+='<div class="sp-bat-werte">' +
        paar.map(p=>'<span><b>'+esc(p[0])+'</b> '+esc(p[1])+'</span>').join('') + '</div>';
      if (!widerstand.trim()) {
        html+='<p class="sp-bat-hinweis">Für die Laststrom-Rechnung den Widerstand R eingeben. ' +
          'Ohne R ist der Lampenstrom nicht bestimmbar.</p>';
      } else {
        const last=Number(widerstand);
        if (!Number.isFinite(last) || last<=0 || last>1000000) {
          html+='<p class="sp-bat-fehler">R muss zwischen 0 und 1 000 000 Ω liegen.</p>';
        } else if (!schalter) {
          html+='<p>Schalter offen: Strom am Verbraucher <b>0 A</b>.</p>';
        } else if (r.ri===null) {
          html+='<p class="sp-bat-hinweis">Ohne angegebenen Innenwiderstand Ri ist ' +
            'der tatsächliche Laststrom nicht bestimmbar.</p>';
        } else {
          const i=r.u/(last+r.ri), u=i*last;
          html+='<p>Laststrom <b>'+esc(zeige(i,'A'))+'</b> · ' +
            'Spannung am Verbraucher <b>'+esc(zeige(u,'V'))+'</b> · ' +
            'Leistung <b>'+esc(zeige(u*i,'W'))+'</b>' +
            (i>r.maxA+1e-8?' · <strong class="sp-bat-fehler">Nennstrom überschritten!</strong>':'') +
            '</p>';
        }
      }
      return html;
    };
    function aktualisiere() {
      if (!el || !el.isConnected) return;
      const plan=optionen.holePlan();
      const a=plan.batterieUebung ? get(plan.batterieUebung.id) : get(wahl);
      const zellen=plan.batterieUebung ? plan.batterieUebung.teile.length : a.zahl;
      const gewaehlt=optionen.holeAuswahl();
      const teil=plan.batterieUebung && gewaehlt.length===1
        ? plan.teile.find(t=>t.id===gewaehlt[0] && t.zeichen==='batterie') : null;
      const w=teil ? (teil.werte || {}) : {};
      let html='<div class="sp-bat-kopf"><strong>Batterien auf dieser Zeichenfläche</strong>' +
        '<span>Kapitel 12 · Reihen- / Parallelschaltung</span></div>';
      html+='<div class="sp-bat-bedienung">' +
        '<label>Aufgabe <select data-bat="wahl">' +
        AUFGABEN.map(e=>'<option value="'+esc(e.id)+'"'+(e.id===wahl?' selected':'')+'>'+
          esc(e.name)+'</option>').join('') +
        '</select></label><button type="button" data-bat="einsetzen">Aufgabe auf diese Fläche setzen</button></div>';
      if(!plan.batterieUebung) {
        html+='<p class="sp-bat-hinweis">Du kannst eine Schulaufgabe mit einzelnen Batteriezellen ' +
          'hier in den bestehenden Schaltplan einsetzen. Ein vorhandener Plan wird ' +
          'nur nach deiner Bestätigung ersetzt.</p>';
      } else {
        html+='<p class="sp-bat-hinweis">Aktiv: '+esc(a.name)+
          ' · '+zellen+' '+esc(a.art)+'-Zellen · je '+esc(zeige(a.u,'V'))+
          ' · Ri '+esc(zeige(a.ri,'Ω'))+
          ' · Imax '+esc(zeige(a.i,'A'))+
          ' · Q '+esc(zeige(a.q,'Ah'))+
          ' · Ziel '+esc(a.zielU===undefined?zeige(a.zielI,'A'):zeige(a.zielU,'V'))+
          (a.annahme?' · Annahme: '+esc(a.annahme):'')+
          '</p><p class="sp-bat-hinweis">'+hilfe+'</p>';
        if(teil) {
          html+='<fieldset class="sp-bat-eingaben"><legend>'+esc(teil.bmk||'Batterie')+
            ' · ausgewählte Zelle bearbeiten</legend>' +
            [['U','Spannung U (V)'],['Ri','Innenwiderstand Ri (Ω)'],
             ['Imax','Maximalstrom (A)'],['Q','Kapazität Q (Ah)']].map(([key,name])=>
              '<label>'+esc(name)+'<input type="number" inputmode="decimal" ' +
              'min="0" step="any" data-bat-wert="'+key+'" value="'+
              esc(w[key]===undefined?'':w[key])+'" placeholder="nicht angegeben"></label>').join('') +
            '<button type="button" data-bat="werte">Zellwerte übernehmen</button></fieldset>';
        } else {
          html+='<p class="sp-bat-hinweis">Eine Zelle auswählen, um ihre Nenndaten zu ändern.</p>';
        }
        html+='<div class="sp-bat-messung" aria-live="polite">' +
          auswertung(messung(),a)+'</div>' +
          '<div class="sp-bat-last">' +
          '<label>Verbraucher R (Ω)<input type="number" data-bat="last" min="0.01" ' +
            'max="1000000" step="any" value="'+esc(widerstand)+'" placeholder="z. B. 20"></label>' +
          '<label class="sp-bat-check"><input type="checkbox" data-bat="schalter" ' +
            (schalter?'checked':'')+'> Schalter geschlossen</label></div>';
      }
      el.innerHTML=html;
    }

    el.addEventListener('change',e=>{
      const t=e.target;
      if (!t || !t.dataset) return;
      if (t.dataset.bat==='wahl') {wahl=t.value; aktualisiere();}
      if (t.dataset.bat==='last') {widerstand=t.value; aktualisiere();}
      if (t.dataset.bat==='schalter') {schalter=t.checked; aktualisiere();}
    });
    el.addEventListener('click',e=>{
      const b=e.target.closest('[data-bat="einsetzen"],[data-bat="werte"]');
      if (!b) return;
      if(b.dataset.bat==='einsetzen') {
        const plan=optionen.holePlan();
        if ((plan.teile.length || plan.leitungen.length || plan.texte.length) &&
            !window.confirm('Die aktuelle Schaltung durch die Batterieaufgabe ersetzen?\n' +
              'Der bisherige Plan bleibt über Rückgängig wiederherstellbar.')) return;
        const neu=planFuer(wahl);
        optionen.aendere(()=>optionen.setzePlan(neu));
        optionen.nachPlanwechsel();
        aktualisiere();
        return;
      }
      const plan=optionen.holePlan(), ids=optionen.holeAuswahl();
      const t=ids.length===1?plan.teile.find(x=>x.id===ids[0]&&x.zeichen==='batterie'):null;
      if(!t)return;
      const daten={...t.werte};
      for(const f of el.querySelectorAll('[data-bat-wert]')) {
        const key=f.dataset.batWert, raw=f.value.trim().replace(',','.');
        if(!raw) {
          if(key==='U'||key==='Imax') {
            zuletzt='Spannung U und maximaler Strom Imax dürfen nicht leer sein.';
            window.alert(zuletzt); return;
          }
          delete daten[key]; continue;
        }
        const wert=Number(raw);
        if(!Number.isFinite(wert)||wert<=0||wert>1e6) {
          zuletzt='Nur positive, endliche Nenndaten bis 1 000 000 eingeben.';
          window.alert(zuletzt); return;
        }
        daten[key]=wert;
      }
      optionen.aendere(()=>{
        const aktuell=optionen.holePlan().teile.find(x=>x.id===t.id);
        if(aktuell) aktuell.werte=daten;
      });
    });
    return { aktualisiere };
  }

  wurzel.BatterieAufgaben={ erstelle, planFuer, aufgaben:AUFGABEN };
  if (typeof module!=='undefined'&&module.exports)
    module.exports={ erstelle, planFuer, aufgaben:AUFGABEN };
})(typeof window!=='undefined'?window:globalThis);
