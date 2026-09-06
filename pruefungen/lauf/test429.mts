/* Uiverse-Motion: echte UI-Controller, isolierte Testdaten, kein KI-Netzaufruf.
   Ein kontrollierter Testserver ersetzt nur die externe KI-Antwort. */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '../..');
const types: Record<string,string> = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent((req.url || '/index.html').split('?')[0]!));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end(); return;}
  res.writeHead(200,{'Content-Type':(types[path.extname(file)] || 'application/octet-stream')+'; charset=utf-8'}); res.end(fs.readFileSync(file));
});
await new Promise<void>(r=>server.listen(9629,'127.0.0.1',r));
const browser = await chromium.launch();
const page = await browser.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'});
let pass=0;
const check=(name:string,ok:unknown)=>{assert.ok(ok,name);pass++;console.log('  ✓ '+name);};
const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
let release: (()=>void) | undefined;
const antwortFreigeben = (): void => { assert.ok(release, 'KI-Testanfrage angekommen'); release(); };
let fail = false;
await page.route('**/*',async route=>{
  const url = new URL(route.request().url());
  if (url.pathname === '/api/chat') {
    await new Promise<void>(r=>{release=r;});
    await route.fulfill({status:fail?500:200,contentType:'application/x-ndjson',body:JSON.stringify({message:{content:'Geprüfte Testantwort.'}})+'\n'});
  } else if (url.port === '9629') await route.continue();
  else await route.abort();
});
try {
  await page.goto('http://127.0.0.1:9629/index.html');
  await page.waitForFunction("typeof StudioSchale !== 'undefined' && document.body.dataset.studioNav && typeof Zustand.aktivitaet === 'function'");
  await page.waitForTimeout(900);
  await page.evaluate(`(() => {
    Store.setMeta('rundgangGesehen',true);
    Store.setMeta('neuerungenGesehen',Math.max(...Rundgang.NEUERUNGEN.map(n=>n.nr)));
    document.querySelectorAll('.overlay,#rg-willkommen,#rg-neu').forEach(e=>e.remove());
    const p=Store.addPage(null,{text:'Motion-Test'}); Store.addBlock(p.id,'text',{text:'Nur Testinhalt.'}); App.oeffne(p.id);
    const host=document.createElement('section'); host.id='motion-probe'; document.querySelector('#page').append(host);
    window.motionButton=Zustandsknopf.bauen({art:'erzeugen',texte:{bereit:'Erzeugen',arbeitet:'KI arbeitet …',fertig:'Fertig'},fertigNach:0,
      aktion:()=>new Promise(r=>{window.motionFertig=r})});
    host.append(window.motionButton.element,Zustand.pille({art:'laeuft',text:'Datei wird gelesen …'}),Zustand.pille({art:'laeuft'}));
    host.append(Baumansicht.bauen({name:'Testbaum',knoten:[{id:'ordner',name:'Ordner',kinder:[{id:'seite',name:'Seite'}]}]}).element);
  })()`);
  check('Zehn Segmente pro neutralem Ladezeichen',await page.locator('#motion-probe .ru-aktivitaet rect').count()===20);
  check('Keine SVG-ID-Kollisionen',await page.locator('#motion-probe svg [id]').count()===0);
  check('Neutrale Aktivität animiert nur Segmente',await page.locator('#motion-probe rect').first().evaluate(e=>getComputedStyle(e).animationName)==='ru-segment');
  await page.locator('#motion-probe .ru-zk').click();
  check('Drei KI-Funken bei tatsächlich wartender Aktion',await page.locator('#motion-probe .ru-zk .ru-aktivitaet path').count()===3);
  check('KI-Funken animieren',await page.locator('#motion-probe .ru-zk path').first().evaluate(e=>getComputedStyle(e).animationName)==='ru-funken');
  await page.evaluate('window.motionFertig()');
  await page.waitForFunction("window.motionButton.zustand()==='fertig'");
  check('Erfolg entfernt die Ladeanimation',await page.locator('#motion-probe .ru-zk .ru-aktivitaet').count()===0);
  await page.locator('#motion-probe [data-baum-id="ordner"]').focus(); await page.keyboard.press('ArrowRight');
  check('Tastatur öffnet den echten Baum mit Übergang',await page.locator('#motion-probe .ru-baum-auf').evaluate(e=>getComputedStyle(e).animationName)==='ru-baum-oeffnen');
  check('Fokus bleibt am aufgeklappten Ordner',await page.locator('#motion-probe [data-baum-id="ordner"]').evaluate(e=>e===document.activeElement));
  await page.emulateMedia({reducedMotion:'reduce'});
  check('Reduced Motion stoppt Spinner und Baum',await page.locator('#motion-probe .ru-aktivitaet rect,#motion-probe .ru-baum-auf').evaluateAll(es=>es.every(e=>getComputedStyle(e).animationName==='none')));
  check('Zehn Segmente behalten ihre räumliche Verteilung',await page.locator('#motion-probe rect').nth(1).evaluate(e=>getComputedStyle(e).transform!=='none'));
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate("KI.zustand.quelle='ollama'; KI.zustand.modell='motion-test'; KI.zustand.bereit=true; window.kiMotion=KI.schreibLauf({name:'Zusammenfassen',icon:''},'Fasse zusammen.'); void 0");
  await page.locator('.ki-aktivitaet').waitFor();
  check('Echter KI-Schreibcontroller zeigt Status mit drei Funken',await page.locator('.ki-aktivitaet path').count()===3);
  await page.waitForTimeout(100); antwortFreigeben();
  await page.evaluate('window.kiMotion');
  check('Nach Antwort verschwindet der KI-Status',await page.locator('.ki-aktivitaet').count()===0);
  check('Streaming-Antwort bleibt erhalten',(await page.locator('#chat').innerText()).includes('Geprüfte Testantwort.'));
  fail=true; release=undefined;
  await page.evaluate("window.kiMotion=KI.schreibLauf({name:'Zusammenfassen',icon:''},'Test'); void 0");
  await page.locator('.ki-aktivitaet').waitFor(); await page.waitForTimeout(100); antwortFreigeben();
  await page.evaluate('window.kiMotion');
  check('Auch Fehler entfernen die Animation',await page.locator('.ki-aktivitaet').count()===0);
  check('Fehler bleibt sichtbar',(await page.locator('#chat').innerText()).includes('Ollama antwortet mit 500'));
  check('Keine JavaScript-Laufzeitfehler',errors.length===0);
  console.log(`\n${pass}/${pass} bestanden`);
} finally {release?.(); await browser.close(); await new Promise<void>(r=>server.close(()=>r()));}
