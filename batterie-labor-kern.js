/* Batterieanlagen: reine Netzprüfung für die Zeichenübungen.
 * Keine ideale Parallelschaltung ungleicher Spannungen, keine Lade-/Entladekurve.
 * Im Browser und mit node --test verwendbar. */
(function (wurzel) {
  'use strict';

  const fehler = (grund) => ({ ok: false, grund });
  const idMinus = (i) => 'n' + i;
  const idPlus = (i) => 'p' + i;
  const AUS_MINUS = 'aus-';
  const AUS_PLUS = 'aus+';

  function reiheParallel(anzahl, inReihe) {
    if (!Number.isInteger(anzahl) || anzahl < 1 ||
        !Number.isInteger(inReihe) || inReihe < 1 || anzahl % inReihe)
      throw new Error('Die Zellen müssen vollständig auf gleich lange Zweige verteilt werden.');
    const leitungen = [];
    const zweige = anzahl / inReihe;
    for (let z = 0; z < zweige; z++) {
      const von = z * inReihe;
      leitungen.push([AUS_MINUS, idMinus(von)]);
      for (let k = 1; k < inReihe; k++)
        leitungen.push([idPlus(von + k - 1), idMinus(von + k)]);
      leitungen.push([idPlus(von + inReihe - 1), AUS_PLUS]);
    }
    return leitungen;
  }

  function gleichung(loesung, rechte) {
    const n = rechte.length;
    const a = loesung.map((r, i) => [...r, rechte[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let r = c + 1; r < n; r++)
        if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
      if (Math.abs(a[p][c]) < 1e-11) return null;
      [a[c], a[p]] = [a[p], a[c]];
      const teiler = a[c][c];
      for (let j = c; j <= n; j++) a[c][j] /= teiler;
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const faktor = a[r][c];
        for (let j = c; j <= n; j++) a[r][j] -= faktor * a[c][j];
      }
    }
    return a.map(r => r[n]);
  }

  /* Einfache Nennstrom-Regeln auch für Akku-Pakete mit unterschiedlichen
   * Spannungen. Nur Reihen-/Parallelschaltungen mit derselben
   * Ausgangsspannung pro parallelem Zweig sind erlaubt.
   * Für unbekanntes Ri ist die Nennstrom-Angabe eine
   * Schaltungsregel (Engpass-Flow), keine physikalische Lastkurve. */
  function maximalfluss(kanten, von, nach, feld) {
    const nachbarn = new Map();
    const add = (a,b,c) => {
      if(!nachbarn.has(a)) nachbarn.set(a,[]);
      if(!nachbarn.has(b)) nachbarn.set(b,[]);
      const v=nachbarn.get(a),w=nachbarn.get(b);
      v.push({zu:b,rest:c,rev:w.length});
      w.push({zu:a,rest:0,rev:v.length-1});
    };
    kanten.forEach(k=>add(k.a,k.b,k.z[feld]));
    let summe=0;
    for(let versuch=0;versuch<256;versuch++) {
      const eltern=new Map([[von,null]]), queue=[von];
      while(queue.length && !eltern.has(nach)){
        const ort=queue.shift();
        for(let j=0;j<(nachbarn.get(ort)||[]).length;j++){
          const k=nachbarn.get(ort)[j];
          if(k.rest>1e-10 && !eltern.has(k.zu)){
            eltern.set(k.zu,[ort,j]);queue.push(k.zu);
          }
        }
      }
      if(!eltern.has(nach)) break;
      let rest=Infinity,jetzt=nach;
      while(jetzt!==von){
        const [alt,j]=eltern.get(jetzt);
        rest=Math.min(rest,nachbarn.get(alt)[j].rest);
        jetzt=alt;
      }
      if(!Number.isFinite(rest)) break;
      jetzt=nach;
      while(jetzt!==von){
        const [alt,j]=eltern.get(jetzt),k=nachbarn.get(alt)[j];
        k.rest-=rest;
        nachbarn.get(jetzt)[k.rev].rest+=rest;
        jetzt=alt;
      }
      summe+=rest;
    }
    return summe;
  }

  function pruefen(zellen, leitungen, optionen) {
    if (!Array.isArray(zellen) || !zellen.length || zellen.length > 64)
      return fehler('Keine gültige Anzahl von Batteriezellen oder Akku-Paketen.');
    if (!Array.isArray(leitungen)) return fehler('Die Verbindungen sind ungültig.');
    const ids = [AUS_MINUS, AUS_PLUS];
    zellen.forEach((_, i) => ids.push(idMinus(i), idPlus(i)));
    const bekannt = new Set(ids);
    const eltern = new Map(ids.map(x => [x, x]));
    const finde = (id) => {
      let p = id;
      while (eltern.get(p) !== p) p = eltern.get(p);
      while (id !== p) {
        const alt = eltern.get(id);
        eltern.set(id, p);
        id = alt;
      }
      return p;
    };
    for (const paar of leitungen) {
      if (!Array.isArray(paar) || paar.length !== 2 ||
          !bekannt.has(paar[0]) || !bekannt.has(paar[1]) ||
          paar[0] === paar[1]) return fehler('Eine Leitung hat ungültige Endpunkte.');
      eltern.set(finde(paar[0]), finde(paar[1]));
    }
    const n = finde(AUS_MINUS), p = finde(AUS_PLUS);
    if (n === p) return fehler('Kurzschluss: Ausgang + und − sind direkt verbunden.');
    const kanten = [];
    for (let i = 0; i < zellen.length; i++) {
      const z = zellen[i], a = finde(idMinus(i)), b = finde(idPlus(i));
      if (!z || !Number.isFinite(z.u) || z.u <= 0 ||
          !Number.isFinite(z.maxA) || z.maxA <= 0)
        return fehler('Die Nenndaten von G' + (i + 1) + ' fehlen oder sind ungültig. Zelle auswählen und U/Imax ergänzen.');
      if (a === b) return fehler('Kurzschluss an Zelle/Akku G' + (i + 1) + '.');
      kanten.push({ a, b, i, z, r: Number.isFinite(z.ri) && z.ri > 0 ? z.ri : 1 });
    }

    const zugang = (start, rueckwaerts, liste) => {
      const gesehen=new Set([start]), queue=[start];
      while(queue.length) {
        const ort=queue.shift();
        for(const k of liste) {
          const von=rueckwaerts?k.b:k.a, zu=rueckwaerts?k.a:k.b;
          if(von===ort&&!gesehen.has(zu)){gesehen.add(zu);queue.push(zu);}
        }
      }
      return gesehen;
    };
    const vonMinus=zugang(n,false,kanten),nachPlus=zugang(p,true,kanten);
    const aktive=kanten.filter(k=>vonMinus.has(k.a)&&nachPlus.has(k.b));
    if(!aktive.length) {
      const undirected=new Set([n]),queue=[n];
      while(queue.length){
        const ort=queue.shift();
        for(const k of kanten){
          const zu=k.a===ort?k.b:k.b===ort?k.a:null;
          if(zu!==null&&!undirected.has(zu)){undirected.add(zu);queue.push(zu);}
        }
      }
      return fehler(undirected.has(p)
        ? 'Die Polarität am Ausgang ist vertauscht oder eine Zelle ist gegenpolig.'
        : 'Ausgang + und − sind noch nicht über Zellen verbunden.');
    }
    if(!optionen?.nurAusgang && aktive.length!==kanten.length)
      return fehler('Mindestens eine Zelle liegt in einem offenen Nebenast.');

    // Spannungspotenziale: Uneinheitliche Zellen in Serie sind erlaubt.
    // Unterschiedliche Gesamtspannung paralleler Zweige ist dagegen
    // widersprüchlich (Ausgleichsstrom) und wird nicht idealisiert.
    const spannung=new Map([[n,0]]),offen=[n];
    while(offen.length){
      const ort=offen.shift();
      for(const k of aktive){
        let zu=null,delta=0;
        if(k.a===ort){zu=k.b;delta=k.z.u;}
        else if(k.b===ort){zu=k.a;delta=-k.z.u;}
        if(zu===null)continue;
        const soll=spannung.get(ort)+delta;
        if(spannung.has(zu)){
          if(Math.abs(spannung.get(zu)-soll)>1e-7)
            return fehler('Unterschiedliche Zweigspannungen oder gegenpolig verbundene Akkus: Ausgleichsstrom-Gefahr.');
        }else{spannung.set(zu,soll);offen.push(zu);}
      }
    }
    if(!spannung.has(p)||spannung.get(p)<=0)
      return fehler('Die Polarität am Ausgang ist vertauscht.');
    const u=spannung.get(p);

    // Teststrom 1 A für den Gesamtinnenwiderstand bzw. für die
    // Stromanteile bei bekannter, passender Innenwiderstandsangabe.
    const orte=[...new Set(aktive.flatMap(k=>[k.a,k.b]))].filter(x=>x!==n);
    const index=new Map(orte.map((x,i)=>[x,i]));
    const matrix=orte.map(()=>orte.map(()=>0));
    const rechte=orte.map(x=>x===p?1:0);
    for(const k of aktive){
      const g=1/k.r,a=index.get(k.a),b=index.get(k.b);
      if(a!==undefined)matrix[a][a]+=g;
      if(b!==undefined)matrix[b][b]+=g;
      if(a!==undefined&&b!==undefined){matrix[a][b]-=g;matrix[b][a]-=g;}
    }
    const v=gleichung(matrix,rechte);
    if(!v)return fehler('Das Leitungsnetz lässt sich nicht eindeutig berechnen.');
    const anteile=aktive.map(k=>Math.abs(
      ((index.has(k.b)?v[index.get(k.b)]:0)-
       (index.has(k.a)?v[index.get(k.a)]:0))/k.r));
    const riBekannt=aktive.every(k=>Number.isFinite(k.z.ri)&&k.z.ri>0);
    const qBekannt=aktive.every(k=>Number.isFinite(k.z.ah)&&k.z.ah>0);
    const grenze=(feld)=>Math.min(...aktive.map((k,i)=>
      anteile[i]<1e-10?Infinity:k.z[feld]/anteile[i]));
    const maxA=riBekannt?grenze('maxA'):maximalfluss(aktive,n,p,'maxA');
    const ah=qBekannt
      ? (riBekannt?grenze('ah'):maximalfluss(aktive,n,p,'ah')) : null;
    if(!Number.isFinite(maxA)||maxA<=0)
      return fehler('Der Stromweg ist unvollständig oder die Zellströme sind ungültig.');
    return {
      ok:true, reihe:null, u,
      ri:riBekannt?v[index.get(p)]:null,
      maxA, ah, anteile, alle:aktive.length,
      ignorierte:zellen.length-aktive.length,
      nennregel:!riBekannt
    };
  }

  /* Die echte Redion-Planfläche liefert Netze. Keine zweite Geometrie und
   * keine zweite Definition von Kreuzung/Verbindung: genau die Netzliste
   * des bestehenden Elektrozeichners gilt auch für die Batterieübung. */
  function ausPlan(plan, netze, ausgangIndex) {
    const uebung = plan && plan.batterieUebung;
    if (!uebung || !Array.isArray(uebung.teile) ||
        (uebung.id !== 'selbst' && !uebung.teile.length) || uebung.teile.length > 64)
      return fehler('Keine Batterieübung in diesem Schaltplan.');
    const teile = Array.isArray(plan.teile) ? plan.teile : [];
    const nachId = new Map(teile.map(t => [String(t.id), t]));
    /* Beim freien Zeichnen gelten auch per normaler Bauteilpalette
       eingesetzte Batterien. Lehrmittel-Aufgaben bleiben dagegen strikt. */
    const eigene = uebung.id === 'selbst';
    const zellIds = eigene ? teile.filter(t => t.zeichen === 'batterie').map(t => t.id)
                           : uebung.teile;
    if (!zellIds.length || zellIds.length > 64)
      return fehler('Setze 1 bis 64 Batterien auf den Plan.');
    const mehr=Array.isArray(uebung.ausgaenge) && uebung.ausgaenge.length>0;
    const index=Number.isInteger(ausgangIndex)?ausgangIndex:0;
    const plusId=mehr && uebung.ausgaenge[index]
      ? String(uebung.ausgaenge[index].id) : uebung.plus;
    if (!nachId.has(plusId) || !nachId.has(uebung.minus) ||
        nachId.get(plusId).zeichen !== 'klemme' ||
        nachId.get(uebung.minus).zeichen !== 'klemme')
      return fehler('Die Ausgangsklemmen X+ und X− fehlen.');
    if (!netze || !(netze.netzVon instanceof Map))
      return fehler('Die Netzliste steht nicht zur Verfügung.');
    const zellen = [];
    const punkte = [
      { id: AUS_MINUS, klemme: 'k:' + uebung.minus + ':1' },
      { id: AUS_MINUS, klemme: 'k:' + uebung.minus + ':2' },
      { id: AUS_PLUS, klemme: 'k:' + plusId + ':1' },
      { id: AUS_PLUS, klemme: 'k:' + plusId + ':2' }
    ];
    for (let i = 0; i < zellIds.length; i++) {
      const t = nachId.get(zellIds[i]);
      if (!t || t.zeichen !== 'batterie')
        return fehler('Eine Zelle der Aufgabe wurde entfernt oder ersetzt.');
      const w = t.werte || {};
      const maxA = Number(w.Imax);
      if (!Number.isFinite(maxA) || maxA <= 0)
        return fehler('Bei ' + (t.bmk || 'einer Zelle') + ' fehlt der zulässige Strom Imax.');
      zellen.push({
        u: Number(w.U), ri: w.Ri == null ? null : Number(w.Ri),
        maxA, ah: w.Q == null ? null : Number(w.Q)
      });
      punkte.push(
        { id: idMinus(i), klemme: 'k:' + t.id + ':−' },
        { id: idPlus(i), klemme: 'k:' + t.id + ':+' }
      );
    }
    const nachNetz = new Map();
    for (const p of punkte) {
      const nr = netze.netzVon.get(p.klemme);
      if (nr === undefined) return fehler('Ein Anschluss ist in der Netzliste nicht vorhanden.');
      const liste = nachNetz.get(nr) || [];
      liste.push(p.id);
      nachNetz.set(nr, liste);
    }
    const leitungen = [];
    nachNetz.forEach(liste => {
      for (let i = 1; i < liste.length; i++)
        if (liste[0] !== liste[i]) leitungen.push([liste[0], liste[i]]);
    });
    return pruefen(zellen, leitungen, {nurAusgang:mehr});
  }

  /* Widerstände, die tatsächlich im gezeichneten Stromkreis zwischen
   * X+ und X− liegen, bestimmen die Last. Mit einem 1-A-Probestrom wird
   * der Ersatzwiderstand eines beliebigen ohmschen Netzwerks ermittelt.
   * Unverbundene Bauteile zählen nicht. Kein stillschweigender Kurzschluss. */
  function lastAusPlan(plan, netze, ausgangIndex) {
    const m = plan && plan.batterieUebung;
    if (!m || !netze || !(netze.netzVon instanceof Map))
      return {ok:false, grund:'Kein gültiger Batterieplan.'};
    const pos = m.ausgaenge && m.ausgaenge[ausgangIndex || 0]
      ? m.ausgaenge[ausgangIndex || 0].id : m.plus;
    /* X+ und X− sind im Plan je eine zweipolige Reihenklemme.
       In der Batterieübung gehören beide Anschlussseiten zum selben
       Ausgang (auch wenn Stromfluss.netze sie einzeln nummeriert). */
    const plusNetze=[1,2].map(n=>netze.netzVon.get('k:'+pos+':'+n))
      .filter(n=>n!==undefined);
    const minusNetze=[1,2].map(n=>netze.netzVon.get('k:'+m.minus+':'+n))
      .filter(n=>n!==undefined);
    if(!plusNetze.length||!minusNetze.length||
       plusNetze.some(n=>minusNetze.includes(n)))
      return {ok:false, grund:'Die Ausgangsklemmen sind kurzgeschlossen oder fehlen.'};
    const von='Xminus',nach='Xplus';
    const zuAusgang=n=>plusNetze.includes(n)?nach:minusNetze.includes(n)?von:n;
    const kanten = [];
    for (const t of (plan.teile || [])) {
      if (t.zeichen !== 'widerstand') continue;
      const a = netze.netzVon.get('k:' + t.id + ':1');
      const b = netze.netzVon.get('k:' + t.id + ':2');
      if (a === undefined || b === undefined) continue;
      const standard = (typeof Stromfluss !== 'undefined' && Stromfluss.verhalten)
        ? Stromfluss.verhalten('widerstand') : null;
      const ohm = t.werte && t.werte.R != null ? Number(t.werte.R)
        : (standard && Number.isFinite(standard.wert) ? standard.wert : 100);
      if (!Number.isFinite(ohm) || ohm <= 0)
        return {ok:false, grund:'Ein gezeichneter Widerstand hat keinen gültigen R-Wert.'};
      const x=zuAusgang(a),y=zuAusgang(b);
      if (x !== y) kanten.push({a:x,b:y,ohm});
    }
    if (!kanten.length) return null;
    const gesehen = new Set([nach]), offen = [nach];
    while (offen.length) {
      const n = offen.shift();
      for (const k of kanten) {
        const zu = k.a === n ? k.b : k.b === n ? k.a : null;
        if (zu !== null && !gesehen.has(zu)) { gesehen.add(zu); offen.push(zu); }
      }
    }
    if (!gesehen.has(von)) return null; // Noch kein vollständiger Lastpfad
    const aktiv = kanten.filter(k => gesehen.has(k.a) && gesehen.has(k.b));
    const orte = [...gesehen].filter(n => n !== von);
    const ix = new Map(orte.map((n,i) => [n,i]));
    const mat = orte.map(() => orte.map(() => 0));
    const rechts = orte.map(n => n === nach ? 1 : 0);
    for (const k of aktiv) {
      const g = 1 / k.ohm, a = ix.get(k.a), b = ix.get(k.b);
      if (a !== undefined) mat[a][a] += g;
      if (b !== undefined) mat[b][b] += g;
      if (a !== undefined && b !== undefined) {mat[a][b] -= g; mat[b][a] -= g;}
    }
    const v = gleichung(mat, rechts);
    if (!v || !Number.isFinite(v[ix.get(nach)]) || v[ix.get(nach)] <= 0)
      return {ok:false, grund:'Der gezeichnete Lastwiderstand ist nicht berechenbar.'};
    return {ok:true, ohm:v[ix.get(nach)], anzahl:aktiv.length};
  }

  const api = { pruefen, ausPlan, lastAusPlan, reiheParallel, idMinus, idPlus, AUS_MINUS, AUS_PLUS };
  wurzel.BatterieKern = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
