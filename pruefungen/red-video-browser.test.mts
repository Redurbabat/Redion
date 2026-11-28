import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {renderVideoPreview} from '../tools/red-video-preview.mts';

test('Offline video preview: browser playback, pause, navigation and inert text',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({offline:true,viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.setContent(renderVideoPreview({version:1,title:'Lernvideo',scenes:[
   {title:'Start',body:'<img src=x onerror=alert(1)>',seconds:2},
   {title:'Zweite Szene',body:'U = R × I',seconds:2}
  ]}));
  assert.equal(await page.locator('section:visible h2').innerText(),'Start');
  assert.equal(await page.locator('img').count(),0);
  assert.equal(await page.locator('section:visible p').innerText(),'<img src=x onerror=alert(1)>');
  await page.getByRole('button',{name:'Abspielen'}).click();
  await page.clock.runFor(2100);
  assert.equal(await page.locator('section:visible h2').innerText(),'Zweite Szene');
  await page.getByRole('button',{name:'Pause'}).click();
  await page.clock.runFor(3000);
  assert.equal(await page.locator('section:visible h2').innerText(),'Zweite Szene');
  await page.getByRole('button',{name:'Zurück'}).click();
  assert.equal(await page.locator('section:visible h2').innerText(),'Start');
  await page.getByRole('button',{name:'Weiter'}).click();
  await page.getByRole('button',{name:'Abspielen'}).click();
  await page.clock.runFor(2200);
  assert.equal(await page.locator('progress').getAttribute('value'),'1');
  assert.equal(await page.getByRole('button',{name:'Abspielen'}).count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close();}
});
