/*! ERZEUGT — NICHT VON HAND ÄNDERN. Quelle: src/bereiche/verbinden/clipper.ts (npm run bauen:ts). */
/* ============================================================================
 * clipper.js — Der Web Clipper ohne Erweiterung
 * ----------------------------------------------------------------------------
 * ERZEUGT — NICHT VON HAND ÄNDERN.
 * Die Quelle ist `src/bereiche/verbinden/clipper.ts`. `npm run bauen:ts` schreibt daraus
 * `quell/bereiche/verbinden/clipper.js`. Wer das .js bearbeitet, verliert die Änderung beim
 * nächsten Bauen; `pruefungen/lauf/test105.mjs` meldet es vorher.
 * ----------------------------------------------------------------------------
 * Notions Clipper ist eine Browsererweiterung. Die kann diese App nicht sein —
 * aber es geht auch anders, und zwar mit etwas, das jeder Browser seit
 * dreissig Jahren kann: einem Lesezeichen, in dem statt einer Adresse ein
 * kleines Programm steht.
 *
 * SO LÄUFT ES
 *   1. Der Knopf unten wird einmal in die Lesezeichenleiste gezogen.
 *   2. Auf einer beliebigen Webseite draufklicken.
 *   3. Das Lesezeichen liest Titel, Adresse, Auswahl und den Fliesstext,
 *      packt alles zusammen und öffnet diese App damit.
 *   4. Die App legt daraus einen Eintrag in der Datenbank „Gesammelt" an.
 *
 * Es wird nichts verschickt und nichts hochgeladen. Die Daten laufen über
 * den Adressanhang (das Stück hinter dem #) direkt von der einen Seite in
 * die andere — das verlässt den Rechner nicht.
 * ==========================================================================*/

/**
 * Ein Fund aus dem Lesezeichen im Browser.
 *
 * Nur `url` ist wirklich nötig — alles andere kann fehlen, weil es aus einer
 * fremden Seite kommt und dort niemand verspricht, dass es da ist.
 */
type ClipperFund = {
  url?: string; titel?: string; autor?: string; kurz?: string;
  auswahl?: string; tags?: string[]; text?: string;
};

const Clipper = (() => {

  /* ------------------------------------------------------------------------
   * EIN FUND DES UMZUGS: `esc` stand hier und wurde nirgends benutzt.
   *
   * Das ist nicht harmlos. Eine Fluchtfunktion, die dasteht, liest sich wie
   * eine Zusage — wer die Datei überfliegt, denkt, hier werde geschützt. In
   * Wahrheit baut dieses Modul sein HTML woanders. `noUnusedLocals` hat sie
   * gefunden; sie ist weg, und damit auch der falsche Eindruck.
   * ----------------------------------------------------------------------*/

  const SCHEMA = () => ({
    title:  { name: 'Titel',      type: 'title' },
    url:    { name: 'Adresse',    type: 'url' },
    seite:  { name: 'Webseite',   type: 'select', options: [] },
    dt:     { name: 'Gesammelt',  type: 'date' },
    tags:   { name: 'Schlagwörter', type: 'multi', options: [] },
    status: { name: 'Status',     type: 'status',
              options: [{ name:'Ungelesen', color:'blue' },
                        { name:'Gelesen',   color:'green' },
                        { name:'Archiv',    color:'gray' }] },
    autor:  { name: 'Autor',      type: 'text' },
    kurz:   { name: 'Zusammenfassung', type: 'text' },
    zitat:  { name: 'Markierte Stelle', type: 'text' }
  });

  const zielDatenbank = (): any => {
    const da = Object.values<any>(Store.cache.collections)
      .find(c => c.name === 'Gesammelt' && c.schema.url && c.schema.zitat);
    if (da) return da;
    let eltern = Store.rootPages().find((p: any) => p.text === 'Gesammelt');
    if (!eltern) eltern = Store.addPage(null, { text: 'Gesammelt', icon: '✂️' });
    const { collectionId } = Store.addDatabase(eltern.id, 'Gesammelt', SCHEMA(), 'gallery');
    const c = Store.getCollection(collectionId);
    Store.updateCollection(c.id, { icon: '✂️' });
    const v = Store.addView(c.id, 'table', 'Leseliste');
    if (v) Store.updateView(v.id, {
      filters: { operator: 'and', rules: [{ key: 'status', op: 'ist', wert: 'Ungelesen' }] },
      sorts: [{ key: 'dt', richtung: 'ab' }]
    });
    return c;
  };

  const optionSichern = (coll: any, key: string, name: string): void => {
    if (!name || !coll.schema[key]) return;
    const liste: { name: string; color: string }[] = coll.schema[key].options || [];
    if (liste.some(o => o.name === name)) return;
    const farben = ['blue','green','orange','purple','pink','red','yellow','brown','gray'];
    liste.push({ name, color: farben[liste.length % farben.length] ?? 'gray' });
    coll.schema[key].options = liste;
    Store.updateCollection(coll.id, { schema: coll.schema });
  };

  /* ------------------------------------------------------------------------
   * EINEN FUND ABLEGEN
   * ----------------------------------------------------------------------*/
  const ablegen = (fund: ClipperFund): any => {
    const coll = zielDatenbank();
    let host = '';
    try { host = new URL(fund.url ?? '').hostname.replace(/^www\./, ''); } catch {}
    optionSichern(coll, 'seite', host);
    (fund.tags || []).forEach(t => optionSichern(coll, 'tags', t));

    const r = Store.addRow(coll.id, {
      url: fund.url || '', seite: host, dt: new Date().toISOString().slice(0, 10),
      status: 'Ungelesen', autor: fund.autor || '',
      kurz: (fund.kurz || '').slice(0, 600),
      zitat: (fund.auswahl || '').slice(0, 2000),
      tags: fund.tags || []
    });
    Store.updateBlock(r.id, { text: fund.titel || fund.url || 'Ohne Titel' });

    /* Der Fliesstext kommt als Blöcke auf die Eintragsseite — so bleibt
       der Artikel lesbar, auch wenn die Quelle irgendwann verschwindet. */
    if (fund.text) {
      Store.addBlock(r.id, 'quote', { text: (fund.titel || '') + ' · ' + host });
      String(fund.text).split(/\n{2,}/).slice(0, 120).forEach(a => {
        const t = a.trim();
        if (!t) return;
        if (/^#{1,3} /.test(t)) {
          const stufe = (t.match(/^#+/) || ['#'])[0].length;
          Store.addBlock(r.id, 'h' + Math.min(stufe, 3), { text: t.replace(/^#+\s*/, '') });
        } else if (/^[-•*]\s/.test(t)) {
          t.split('\n').forEach(z => Store.addBlock(r.id, 'bullet', { text: z.replace(/^[-•*]\s*/, '') }));
        } else {
          Store.addBlock(r.id, 'text', { text: t.slice(0, 2000) });
        }
      });
      Store.addBlock(r.id, 'bookmark', { src: fund.url, text: fund.titel || host });
    }
    return r;
  };

  /* ------------------------------------------------------------------------
   * DER LESEZEICHEN-SCHNIPSEL
   * ------------------------------------------------------------------------
   * Er läuft auf der fremden Seite, sammelt dort ein und ruft diese App.
   * Bewusst kurz gehalten — ein Lesezeichen darf nicht endlos lang sein.
   * ----------------------------------------------------------------------*/
  const schnipsel = () => {
    const ziel = location.origin + location.pathname;
    const code = `(function(){
var d=document,s=(window.getSelection?String(window.getSelection()):'').trim();
var m=function(n){var e=d.querySelector('meta[name="'+n+'"],meta[property="'+n+'"]');return e?e.content:''};
var art=d.querySelector('article,main,[role=main]')||d.body;
var t='';art.querySelectorAll('h1,h2,h3,p,li,blockquote').forEach(function(e){
var x=(e.innerText||'').trim();if(!x||x.length<3)return;
var g=e.tagName;t+=(g=='H1'?'# ':g=='H2'?'## ':g=='H3'?'### ':g=='LI'?'- ':'')+x+'\\n\\n'});
var k=[];d.querySelectorAll('meta[property="article:tag"],meta[name="keywords"]').forEach(function(e){
(e.content||'').split(',').forEach(function(x){x=x.trim();if(x&&k.length<8)k.push(x)})});
var p={titel:d.title,url:location.href,auswahl:s,
kurz:m('description')||m('og:description'),autor:m('author')||m('article:author'),
tags:k,text:t.slice(0,60000)};
window.open('${ziel}#clip='+encodeURIComponent(JSON.stringify(p)),'_blank');
})();`;
    return 'javascript:' + encodeURIComponent(code.replace(/\n/g, ''));
  };

  /* ------------------------------------------------------------------------
   * ANNAHME — was das Lesezeichen schickt
   * ----------------------------------------------------------------------*/
  const pruefeAdresse = (): boolean => {
    const h = location.hash || '';
    const m = h.match(/[#&]clip=(.*)$/);
    if (!m?.[1]) return false;
    history.replaceState(null, '', location.pathname + location.search);
    let fund: ClipperFund;
    try { fund = JSON.parse(decodeURIComponent(m[1])) as ClipperFund; }
    catch { UI.banner('Der Fund war nicht lesbar.', 'warn'); return false; }

    const r = ablegen(fund);
    App.zeichneBaum();
    App.oeffne(r.id);
    UI.toast('✂️ Gespeichert: ' + (fund.titel || fund.url || '').slice(0, 40));
    return true;
  };

  const start = () => { setTimeout(pruefeAdresse, 300); };

  /* ------------------------------------------------------------------------
   * OBERFLÄCHE
   * ----------------------------------------------------------------------*/
  const dialog = () => {
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="finder" style="width:min(660px,94vw)">' +
      '<div class="fh">✂️ Web Clipper<button class="icon-btn" data-a="zu">✕</button></div>' +
      '<div style="padding:6px 18px 16px; max-height:72vh; overflow:auto">' +

        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🔖</span><b>Einmal einrichten</b></div>' +
          '<div class="verb-text">Zieh den Knopf in deine Lesezeichenleiste. ' +
            'Ist sie nicht sichtbar: <b>Strg + Umschalt + B</b>.</div>' +
          `<div class="clip-zieh"><a class="clip-knopf" href="${schnipsel()}" ` +
            'onclick="return false" draggable="true">✂️ In Redion sammeln</a></div>' +
          '<div class="verb-text" style="margin-top:10px">Klappt das Ziehen nicht, ' +
            'geht es auch von Hand: neues Lesezeichen anlegen und als Adresse den Text ' +
            'unten einfügen.</div>' +
          '<div class="verb-knoepfe"><button data-a="kopieren">Code kopieren</button></div>' +
        '</div>' +

        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>📥</span><b>Was gesammelt wird</b></div>' +
          '<div class="verb-text">Titel, Adresse, Autor, Kurzbeschreibung, Schlagwörter, ' +
            'die markierte Stelle und der Fliesstext des Artikels. Alles landet in der ' +
            'Datenbank <b>Gesammelt</b> — als Galerie und als Leseliste.</div>' +
          '<div class="verb-knoepfe"><button data-a="db">Datenbank öffnen</button>' +
            '<button data-a="hand">Von Hand eintragen</button></div>' +
        '</div>' +

        '<div class="verb-karte">' +
          '<div class="verb-kopf"><span>🔒</span><b>Wohin die Daten gehen</b></div>' +
          '<div class="verb-text">Nirgendwohin. Das Lesezeichen öffnet diese App und ' +
            'übergibt den Fund im Adressanhang. Es gibt keinen Server dazwischen, ' +
            'keinen Dienst und kein Konto.</div>' +
        '</div>' +

      '</div><div class="fbtns"><button data-a="zu" class="prim">Fertig</button></div></div>';
    document.body.appendChild(o);

    o.addEventListener('click', async e => {
      const ziel = e.target instanceof Element ? e.target : null;
      if (e.target === o || ziel?.closest('[data-a="zu"]')) { o.remove(); return; }
      const b = ziel?.closest<HTMLElement>('button[data-a]');
      if (!b) return;
      if (b.dataset['a'] === 'kopieren') {
        Ablage.kopiereJetzt(decodeURIComponent(schnipsel().slice('javascript:'.length)), 'Code kopiert — als Lesezeichen-Adresse einfügen');
      }
      if (b.dataset['a'] === 'db') {
        o.remove();
        const c = zielDatenbank();
        const block = Object.values<any>(Store.cache.blocks).find(x => x.collectionId === c.id);
        if (block) App.oeffne(block.parentId);
        App.zeichneBaum();
      }
      if (b.dataset['a'] === 'hand') {
        const url = await UI.frage('Adresse der Seite', '');
        if (!url) return;
        const titel = await UI.frage('Titel', '');
        const r = ablegen({ url, titel: titel || url });
        o.remove();
        App.zeichneBaum();
        App.oeffne(r.id);
        UI.toast('Eingetragen');
      }
    });
  };

  return { ablegen, zielDatenbank, schnipsel, pruefeAdresse, start, dialog };
})();

(window as any).Clipper = Clipper;
