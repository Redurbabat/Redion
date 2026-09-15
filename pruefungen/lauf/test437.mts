/* Suite 437 — Das PDF-Schreibstudio: echter Import, eigener Speicher, Stifteingabe
 * ============================================================================
 * Redurs Lauf vom Zweig `codex/pdf-schreibstudio` (6. September 2026). Dort
 * hiess er test431; diese Nummer trug hier schon die Drucker-Karte (E458),
 * deshalb 437 (E464). Inhalt unverändert.
 *
 *   node pruefungen/lauf/test437.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..');
const types:Record<string,string>={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent((req.url||'/index.html').split('?')[0]!));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':(types[path.extname(file)]||'application/octet-stream')+'; charset=utf-8'});res.end(fs.readFileSync(file));
});
await new Promise<void>(r=>server.listen(9631,'127.0.0.1',r));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'});
page.setDefaultTimeout(15000);
let pass=0;const check=(name:string,ok:unknown)=>{assert.ok(ok,name);pass++;console.log(' ✓ '+name);};
const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
const pdf=()=>{
  const objs=['<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for(let n=1;n<=2;n++){
    let stream=`0.12 0.15 0.22 rg BT /F1 24 Tf 50 770 Td (Elektrotechnik - Kapitel ${n}) Tj ET\n`;
    stream+='BT /F1 14 Tf 50 725 Td (Mein Arbeitsblatt: Strom, Spannung und Widerstand) Tj ET\n';
    for(let y=675;y>150;y-=50)stream+=`0.4 0.4 0.4 rg BT /F1 11 Tf 50 ${y} Td (Eigene Notizen, Messwerte und Berechnungen:) Tj ET\n0.8 0.8 0.8 RG 50 ${y-28} m 545 ${y-28} l S\n`;
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let text='%PDF-1.4\n';const offsets:number[]=[];
  objs.forEach((obj,i)=>{offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${obj}\nendobj\n`;});
  const xref=Buffer.byteLength(text);text+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+offsets.map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('');
  return Buffer.from(text+`trailer\n<< /Size ${objs.length+1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`);
};
try{
  await page.goto('http://127.0.0.1:9631/index.html');
  await page.waitForFunction("typeof App!=='undefined' && document.body.dataset.studioNav");await page.waitForTimeout(800);
  await page.evaluate(`Store.setMeta('rundgangGesehen',true);Store.setMeta('neuerungenGesehen',Math.max(...Rundgang.NEUERUNGEN.map(n=>n.nr)));document.querySelectorAll('.overlay,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e=>e.remove());Bibliothek.oeffne()`);
  const chooser=page.waitForEvent('filechooser');await page.locator('.bib-studio-import').click();
  await(await chooser).setFiles({name:'Schreibstudio.pdf',mimeType:'application/pdf',buffer:pdf()});
  await page.locator('.document-workspace').waitFor();await page.waitForTimeout(700);
  check('Dokument nimmt volle Fensterbreite ein',await page.locator('.document-workspace').evaluate(e=>Math.abs(e.getBoundingClientRect().width-innerWidth)<3));
  check('Keine Bereichsnavigation im PDF',!await page.locator('#kante').isVisible()&&!await page.locator('#studio-bar').isVisible());
  check('Echte Dokument-Tabs sichtbar',await page.locator('#reiterleiste').isVisible());
  check('Original über der Arbeitskopie sichtbar',await page.locator('.document-source-master').isVisible());
  check('Original ausdrücklich geschützt',/geschützt/.test(await page.locator('.document-source-master').innerText()));
  check('Genau zwei kanonische PDF-Seiten',await page.locator('.document-stage').count()===2);
  check('Stift ist direkt bereit',await page.locator('.document-stage[data-aktiv] .blatt-marken').getAttribute('data-tool')==='stift');
  /* ZWÖLF SEIT E494 — die Elemente-Bibliothek steht im Studio mit in der
     Zeichenleiste. Vorher elf (E465 ff.). DREIZEHN SEIT E572: die obere
     Leiste schreibt den Katalog nicht mehr ab, sondern liest `Marken.WERKZEUGE`
     (dort stehen seit E512 dreizehn, siehe test365) — und damit ist auch der
     Laserpointer oben, der in der Abschrift fehlte.
     WARUM DAS HIER WEHTAT: dieser Lauf prüft mit `assert`, nicht mit einem
     Zähler. Die falsche Zahl liess ihn an Prüfung 8 STERBEN, und alles
     danach — Stiftpunkt, Originalbytes, Ausgabe — lief nie mehr. Eine Zahl
     ohne Nachzug kostet hier nicht eine Zusage, sondern den halben Lauf. */
  check('Dreizehn echte Zeichenwerkzeuge',await page.locator('[data-document-tool] svg').count()===13);
  const identity=await page.evaluate<any>(`(() => {const p=Store.getBlock(App.aktuelleSeite());const b=DocumentMode.documentsIn(p)[0];return {page:p.id,block:b.id,source:b.quelleId,image:b.bildDateiId};})()`);
  const originalBytes=await page.evaluate<number[]>(`Dateien.alsBlob(${JSON.stringify(identity.source)}).then(b=>b.arrayBuffer()).then(b=>Array.from(new Uint8Array(b)))`);
  const ink=page.locator('.document-stage[data-aktiv] .blatt-marken');
  const draw=async(kind:'dot'|'stroke')=>ink.evaluate((svg,kind)=>{
    const matrix=(svg as SVGSVGElement).getScreenCTM()!;
    const emit=(type:string,x:number,y:number,buttons:number)=>{
      const p=new DOMPoint(x,y).matrixTransform(matrix);
      svg.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:91,pointerType:'pen',isPrimary:true,button:0,buttons,pressure:buttons?.6:0,clientX:p.x,clientY:p.y}));
    };
    emit('pointerdown',80,160,1);
    if(kind==='stroke')emit('pointermove',130,165,1);
    emit('pointerup',kind==='dot'?80:200,kind==='dot'?160:180,0);
  },kind);
  await draw('dot');
  check('Stiftpunkt wird gespeichert',await page.evaluate(`Store.getBlock('${identity.block}').marken.length`)===1);
  await draw('stroke');
  check('Abhebeposition wird exakt erhalten',await page.evaluate(`JSON.stringify(Store.getBlock('${identity.block}').marken.at(-1).pts.at(-1))==='[200,180]'`));
  check('Druck beim Abheben fällt nicht auf null',await page.evaluate(`Store.getBlock('${identity.block}').marken.at(-1).pressure.at(-1)>0`));
  check('Browser übernimmt keinen Stiftstrich als Scrollgeste',await ink.evaluate(e=>getComputedStyle(e).touchAction)==='none');
  await page.locator('[data-document-action="ink-undo"]').click();
  check('Gemeinsames Undo entfernt nur letzten Strich',await page.evaluate(`Store.getBlock('${identity.block}').marken.length`)===1);
  await page.locator('[data-document-action="ink-redo"]').click();
  check('Gemeinsames Redo stellt Strich wieder her',await page.evaluate(`Store.getBlock('${identity.block}').marken.length`)===2);
  await page.locator('[data-document-tool="marker"]').click();
  check('Obere Leiste steuert echte Zeichenfläche',await ink.getAttribute('data-tool')==='marker');
  await page.locator('[data-document-tool="stift"]').click();
  await page.locator('[data-document-action="ink-options"]').click();
  check('Weitere bestehende Aktionen bleiben erreichbar',await page.locator('.document-stage[data-aktiv] [data-act="lineal"]').isVisible());
  await page.keyboard.press('Escape');
  check('Escape schließt Zubehör mit Fokus-Rückgabe',await page.locator('[data-document-action="ink-options"]').evaluate(e=>e===document.activeElement));
  await page.locator('[data-document-action="view"]').click();
  await page.locator('[data-document-action="read"]').click();
  // E468: Lesen heisst Hand — das Papier ist nicht mehr inert (Abdeckband und Verweise bleiben antippbar), die Zeichenschicht steht auf „schreiben".
  check('Lesemodus schützt Arbeitskopie vor versehentlichen Strichen',await ink.getAttribute('data-tool')==='schreiben');
  /* ══ ZURÜCK ÜBER DEN MODUSSCHALTER, NICHT ÜBER DAS WERKZEUG (E578) ════════
     Hier stand `[data-document-tool="stift"]').click()` — ein Klick auf ein
     Werkzeug MITTEN IM LESEMODUS, und er wirkte. Genau das war der Fehler:
     gemessen setzte so ein Klick die Schicht auf `auto` zurück, und der
     nächste Zug landete als Marke in einem Dokument, das man zum Lesen
     geöffnet hatte (test438 §4b hält es fest). Seit E578 ist die obere Reihe
     im Lesemodus abgeschaltet — dieser Klick wartete deshalb ins Leere.
     Der echte Weg zurück heisst „Annotieren" und steht daneben. */
  const annotieren=page.locator('[data-document-action="annotate"]');
  if(!await annotieren.isVisible()){await page.locator('[data-document-action="view"]').click();await page.waitForTimeout(200);}
  await annotieren.click();
  await page.waitForTimeout(400);
  check('Annotieren holt die Zeichenschicht zurück',await ink.getAttribute('data-tool')!=='schreiben');
  await page.locator('[data-document-tool="stift"]').click();
  for(const schema of ['hell','standard']){
    await page.evaluate(`Aussehen.setzen({schema:'${schema}'})`);
    for(const [width,height] of [[1366,900],[820,1180],[390,844]]){
      await page.setViewportSize({width:width!,height:height!});await page.waitForTimeout(250);
      if(process.argv.includes('--layout'))console.log(await page.locator('.document-stage[data-aktiv] .blatt-werk').evaluate(e=>({tool:(e as HTMLElement).dataset.tool,rect:e.getBoundingClientRect().toJSON(),children:Array.from(e.children).filter(c=>getComputedStyle(c).display!=='none').map(c=>({tag:c.tagName,group:(c as HTMLElement).dataset.gruppe,width:c.getBoundingClientRect().width}))})));
      check(`${schema} ${width}: kein Fensterüberlauf`,await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
      check(`${schema} ${width}: Stiftleiste ist breit und bedienbar`,await page.locator('.document-stage[data-aktiv] .blatt-werk').evaluate(e=>e.getBoundingClientRect().width>250));
      /* BILDER NUR AUF WUNSCH UND NUR NACH `bilder/` (§55.4, E464): Redurs
         Abnahmebilder unter `doku/studio-abnahme/` bleiben, wie er sie
         abgelegt hat — ein Prüflauf, der sie bei jedem Durchgang
         überschreibt, macht aus seiner Abnahme den jeweils letzten Stand. */
      if(process.argv.includes('--screenshots')){
        const out=path.join(root,'bilder/studio-abnahme');fs.mkdirSync(out,{recursive:true});
        await page.screenshot({path:path.join(out,`pdf-schreibstudio-${schema}-${width}.png`)});
      }
    }
  }
  check('Originaldatei bytegleich',JSON.stringify(originalBytes)===JSON.stringify(await page.evaluate<number[]>(`Dateien.alsBlob('${identity.source}').then(b=>b.arrayBuffer()).then(b=>Array.from(new Uint8Array(b)))`)));
  await page.evaluate('Store.flush()');await page.reload();await page.locator('.document-workspace').waitFor();
  check('Handschrift nach Neuladen erhalten',await page.evaluate(`Store.getBlock('${identity.block}').marken.length`)===2);
  check('Bild und Original behalten ihre Kennungen',await page.evaluate(`Store.getBlock('${identity.block}').quelleId==='${identity.source}'&&Store.getBlock('${identity.block}').bildDateiId==='${identity.image}'`));
  check('Keine Laufzeitfehler',errors.length===0);console.log(`\n${pass}/${pass} bestanden`);
}finally{await browser.close();await new Promise<void>(r=>server.close(()=>r()));}
