import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import test from 'node:test';
import {chromium,webkit} from 'playwright';
import {appendSheetMarks,moveSheetMark,sheet} from '../server/mcp/visual-blocks.ts';

const output=process.env.REDION_SHEET_SCREENSHOTS;

for(const [engine,device,width] of [[chromium,'desktop',1366],[chromium,'mobile',390],[webkit,'mobile',390]] as const){
  test(`Native MCP-Zeichenmarken sind in ${engine.name()} (${width} px) sichtbar und bearbeitbar`,async()=>{
    const block=sheet('punkte');
    const marks=appendSheetMarks(block,[
      {id:'title',kind:'text',text:'Werkstatt · Messprotokoll',x:52,y:60,width:480,fontSize:28,bold:true},
      {id:'intro',kind:'text',text:'1. Trage deinen Messwert ein.\n2. Vergleiche die beiden Skizzen.',x:52,y:115,width:470,fontSize:19},
      {id:'frame',kind:'rectangle',color:'#2e77a5',points:[[54,220],[540,385]]},
      {id:'bar',kind:'marker',color:'#eab537',points:[[78,409],[258,409]],strokeWidth:15},
      {id:'pencil',kind:'stift',color:'#26749d',points:[[80,330],[130,300],[165,320],[215,265],[255,285],[300,247]]},
      {id:'arrow',kind:'arrow',color:'#228075',points:[[340,300],[480,300]],strokeWidth:3}
    ]);
    const move={elementId:'title',dx:4,dy:2};
    block.marken=marks;
    assert.throws(()=>moveSheetMark({...block,marken:marks.map(mark=>
      mark.id==='title'?{...mark,gesperrt:true}:mark)},move),/Gesperrte/);
    block.marken=moveSheetMark(block,move);
    const browser=await engine.launch();
    try{
      const page=await browser.newPage({viewport:{width,height:width===390?844:950},serviceWorkers:'block',reducedMotion:'reduce'});
      await page.goto(new URL('../index.html',import.meta.url).href);
      await page.waitForFunction(()=>typeof App!=='undefined'&&!!document.querySelector('#page')?.firstElementChild);
      const blockId=await page.evaluate(async({block,device})=>{
        Store.setMeta('rundgangGesehen',true);
        Store.setMeta('neuerungenGesehen',1e9);
        document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(node=>node.remove());
        App.theme(device==='mobile'?'dark':'light');
        const page=Store.addPage(null,{text:'A4 aus MCP'});
        const sheetBlock=Store.addBlock(page.id,'blatt',{text:'',...block});
        Store.updateBlock(page.id,{dokumentModus:true});
        await Store.flush();
        App.zeichneBaum();
        App.oeffne(page.id);
        return sheetBlock.id;
      },{block,device});
      const art=page.locator('.blatt-marken');
      const title=art.locator('[data-sid="title"]');
      await title.waitFor();
      assert.equal(await title.textContent(),'Werkstatt · Messprotokoll');
      assert.equal(await art.locator('[data-sid]').count(),6);
      assert.equal(await art.locator('[data-sid="bar"]').getAttribute('data-ink-art'),'marker');
      if(output){
        await mkdir(output,{recursive:true});
        await page.screenshot({path:join(output,`redion-pr236-a4-mcp-${engine.name()}-${width}.png`),animations:'disabled'});
      }
      await page.locator('[data-document-tool="text"]').click();
      await title.click();
      const editor=page.locator('.blatt-schreiber');
      assert.equal(await editor.textContent(),'Werkstatt · Messprotokoll');
      await editor.fill('Messprotokoll bearbeitet');
      await editor.press('Escape');
      await page.waitForFunction(id=>Store.getBlock(id)?.marken?.[0]?.text==='Messprotokoll bearbeitet',blockId);
      assert.equal(await title.textContent(),'Messprotokoll bearbeitet');
      assert.deepEqual(await page.evaluate(id=>Store.getBlock(id)?.marken?.[0]?.point,blockId),[56,62]);
    }finally{await browser.close();}
  });
}

test('Ein MCP-Blatt wird an der Querformatgrenze in zwei native Seiten geteilt',async()=>{
  const block=sheet('punkte',2,'landscape');
  block.marken=appendSheetMarks(block,[
    {id:'one',kind:'text',text:'Querformat · Seite 1',x:60,y:55,width:480,fontSize:30,bold:true},
    {id:'two',kind:'text',text:'Querformat · Seite 2',x:640,y:645.28,width:175,fontSize:14}
  ]);
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:1366,height:950},reducedMotion:'reduce',serviceWorkers:'block'});
    await page.goto(new URL('../index.html',import.meta.url).href);
    await page.waitForFunction(()=>typeof App!=='undefined'&&!!document.querySelector('#page')?.firstElementChild);
    const documentId=await page.evaluate(async block=>{
      Store.setMeta('rundgangGesehen',true);
      Store.setMeta('neuerungenGesehen',1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(node=>node.remove());
      const doc=Store.addPage(null,{text:'A4 quer aus MCP'});
      Store.addBlock(doc.id,'blatt',{text:'',...block});
      Store.updateBlock(doc.id,{dokumentModus:true});
      await Store.flush();
      App.oeffne(doc.id);
      return doc.id;
    },block);
    const boundaries=page.locator('.blatt-marken .blatt-umbruch');
    await boundaries.first().waitFor({state:'attached'});
    assert.equal(await boundaries.count(),1);
    assert.equal(await boundaries.getAttribute('y1'),'595.28');
    await page.locator('[data-document-action="inspector"]').click();
    await page.locator('[data-document-action="page-split"]').click();
    await page.locator('.overlay [data-w="ja"]').click();
    await page.waitForFunction(id=>Store.childrenOf(id).filter((child:{type:string})=>child.type==='blatt').length===2,documentId);
    await page.waitForFunction(()=>
      document.querySelector('.document-title-meta')?.textContent==='Notizheft · 2 Seiten');
    const sheets=await page.evaluate(id=>{
      const blocks=Store.childrenOf(id) as Array<{
        type:string;blattBreite:number;blattHoehe:number;blattAusrichtung?:string;
        marken:[{id:string;point:[number,number]}];
      }>;
      return blocks.filter(block=>block.type==='blatt').map(block=>({
        width:block.blattBreite,height:block.blattHoehe,orientation:block.blattAusrichtung,
        id:block.marken[0].id,point:block.marken[0].point.map(n=>Math.round(n*100)/100)
      }));
    },documentId);
    assert.deepEqual(sheets,[
      {width:841.89,height:595.28,orientation:'quer',id:'one',point:[60,55]},
      {width:841.89,height:595.28,orientation:'quer',id:'two',point:[640,50]}
    ]);
    if(output){
      await mkdir(output,{recursive:true});
      await page.screenshot({path:join(output,'redion-pr236-a4-mcp-landscape.png'),animations:'disabled'});
    }
  }finally{await browser.close();}
});

test('Vom PDF-Import vorbereitete Seite zeigt und bearbeitet MCP-Anmerkungen',async()=>{
  const require=createRequire(import.meta.url);
  const {PDFDocument}=require('../quell/fremd/pdf-lib/library.js');
  const pdf=await PDFDocument.create();
  const source=pdf.addPage([595,842]);
  source.drawText('Messprotokoll', {x:56,y:755,size:32});
  source.drawText('Widerstand, Spannung und Stromstaerke', {x:56,y:700,size:18});
  const bytes=Array.from(await pdf.save() as Uint8Array);
  const browser=await chromium.launch();
  try{
    const page=await browser.newPage({viewport:{width:1366,height:950},reducedMotion:'reduce',serviceWorkers:'block'});
    await page.goto(new URL('../index.html',import.meta.url).href);
    await page.waitForFunction(()=>typeof App!=='undefined'&&!!document.querySelector('#page')?.firstElementChild);
    const imported=await page.evaluate(async data=>{
      Store.setMeta('rundgangGesehen',true);
      Store.setMeta('neuerungenGesehen',1e9);
      document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(node=>node.remove());
      const documentPage=Store.addPage(null,{text:'PDF aus MCP-Test',dokumentModus:true});
      const file=new File([new Uint8Array(data)],'probe.pdf',{type:'application/pdf'});
      await PdfEinlesen.alsSeiten(file,documentPage.id,{anordnung:'untereinander'});
      const block=Store.childrenOf(documentPage.id).find((child:{type:string})=>child.type==='pdfseite');
      return {documentId:documentPage.id,block};
    },bytes);
    assert.match(imported.block.suchtext,/Widerstand, Spannung/);
    const marks=appendSheetMarks(imported.block,[
      {id:'highlight',kind:'marker',points:[[56,137],[370,137]],color:'#e9ba43',strokeWidth:18},
      {id:'feedback',kind:'text',text:'Messwerte hier ergänzen',x:56,y:200,width:420,fontSize:22}
    ]);
    await page.evaluate(async({imported,marks})=>{
      Store.updateBlock(imported.block.id,{marken:marks});
      await Store.flush();
      App.oeffne(imported.documentId);
    },{imported,marks});
    const note=page.locator('.blatt-marken [data-sid="feedback"]');
    await note.waitFor();
    const highlight=page.locator('.blatt-marken [data-sid="highlight"]');
    await highlight.waitFor({state:'attached'});
    assert.equal(await highlight.getAttribute('stroke-width'),'18');
    if(output){
      await mkdir(output,{recursive:true});
      await page.screenshot({path:join(output,'redion-pr236-pdf-mcp-1366.png'),animations:'disabled'});
    }
    const dock=page.locator('.document-pdf-dock');
    await dock.getByRole('button',{name:'PDF-Werkzeuge',exact:true}).click();
    await dock.getByRole('button',{name:'Text',exact:true}).click();
    await note.click();
    const editor=page.locator('.blatt-schreiber');
    await editor.fill('Ergänzung geprüft');
    await editor.press('Escape');
    await page.waitForFunction(id=>Store.getBlock(id)?.marken?.[1]?.text==='Ergänzung geprüft',imported.block.id);
  }finally{await browser.close();}
});
