import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
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
