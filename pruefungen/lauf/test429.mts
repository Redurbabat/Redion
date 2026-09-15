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
  /* ══ DIESE ZEILE MASS NIE, WAS IHR NAME SAGT (E582) ═══════════════════════
     Sie stand als `getComputedStyle(e).transform !== 'none'` da und war seit
     mindestens E571 rot — nicht, weil etwas kaputt war, sondern weil die
     Frage nicht zu beantworten ist. NACHGEMESSEN:

       Attribut   transform="rotate(36 12 12)"     ← da, wie gebaut
       CSS        getComputedStyle(...).transform  → "none"

     Die zehn Segmente werden mit einem SVG-PRÄSENTATIONSATTRIBUT verteilt,
     und das taucht in der berechneten CSS-`transform` nicht auf. Die
     Zusicherung konnte also gar nicht grün werden — genau der Fall aus
     §55.2, nur andersherum: eine Prüfung, die immer „kaputt" sagt, wird
     ebenso wenig gelesen wie eine, die immer „passt schon" sagt.

     GEPRÜFT WIRD JETZT, WAS DER NAME VERSPRICHT: dass die Segmente wirklich
     an verschiedenen Stellen liegen, also einen Ring bilden. Das misst die
     Wirkung statt der Schreibweise — und es wird rot, wenn eine
     Reduced-Motion-Regel ihnen eines Tages die Verteilung nimmt. */
  /* AN EINEM SICHTBAREN ABBILD MESSEN. Der erste Versuch las die Segmente
     dort, wo sie stehen — und bekam zwanzig Stück mit Ausdehnung 0: die
     Ladezeichen der Probe sind an dieser Stelle verborgen, und ein
     verborgenes Element hat kein Rechteck. Gemessen wird deshalb an einer
     Kopie, die für einen Augenblick sichtbar im Körper hängt; der
     Reduced-Motion-Zustand gilt dort genauso. */
  const verteilung = await page.evaluate(`(() => {
    const quelle = document.querySelector('#motion-probe .ru-aktivitaet');
    if (!quelle) return { anzahl: 0, verschieden: 0, breite: 0, hoehe: 0 };
    const kopie = quelle.cloneNode(true);
    const kasten = document.createElement('div');
    kasten.style.cssText = 'position:fixed;left:40px;top:40px;width:64px;height:64px;z-index:99999';
    kopie.style.width = '64px'; kopie.style.height = '64px';
    kasten.append(kopie); document.body.append(kasten);
    const segmente = Array.from(kopie.querySelectorAll('rect'));
    const mitten = segmente.map(r => { const b = r.getBoundingClientRect();
      return Math.round(b.left + b.width / 2) + '/' + Math.round(b.top + b.height / 2); });
    const xs = segmente.map(r => r.getBoundingClientRect().left);
    const ys = segmente.map(r => r.getBoundingClientRect().top);
    const raus = { anzahl: segmente.length, verschieden: new Set(mitten).size,
      breite: Math.round(Math.max(...xs) - Math.min(...xs)),
      hoehe: Math.round(Math.max(...ys) - Math.min(...ys)) };
    kasten.remove();
    return raus;
  })()`) as { anzahl: number; verschieden: number; breite: number; hoehe: number };
  check('Zehn Segmente sind überhaupt da', verteilung.anzahl === 10);
  check('… und behalten ihre räumliche Verteilung — ein Ring, kein Stapel',
    verteilung.verschieden >= 8 && verteilung.breite > 4 && verteilung.hoehe > 4);
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
