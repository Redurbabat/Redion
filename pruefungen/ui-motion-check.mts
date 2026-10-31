/* Redion Motion UI: echte CSS-Berechnung mit Playwright (nicht Teil des
 * 555-teiligen nummerierten Volltests; wird im schnellen CI-Job separat
 * ausgeführt). Keine öffentlichen URLs oder vertraulichen Nutzerdaten. */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
const cssDateien = [...index.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)]
  .map(x => x[1] as string);
if (!cssDateien.includes('quell/schale/stil/studio.css'))
  throw new Error('Die Studio-Gestaltung fehlt im index.html.');
const styles = cssDateien.map(datei => {
  const inhalt = fs.readFileSync(path.join(root,datei),'utf8');
  // Die Style-Elemente werden nur hier erzeugt, ausserhalb der Live-App.
  if (inhalt.toLowerCase().includes('</style')) throw new Error('Unerwartetes HTML in '+datei);
  return '<style>\n'+inhalt+'\n</style>';
}).join('\n');
/* GLASS WHEEL, NICHT KLASSISCH (E757, 30. Oktober 2026). Bis hier stand der
   Körper als `<body data-schale="premium">` da — das ist das klassische
   Design, und dieser Lauf hielt damit Liquid Glass IM KLASSISCHEN fest.
   Redur hat im Fragebogen „Klassische Bewegungen vom 13. Okt." gewählt:
   „Die 'Liquid Glass'-Änderungen von Codex (20./21. Okt.) im klassischen
   Design zurücknehmen …". Seither hängen die Regeln in studio.css an
   `:where([data-ui-shell="glass-wheel"])`, und genau dort prüft dieser Lauf
   sie weiter — jede Zusage unverändert, nur die Schale ist die des Glass
   Wheel. Dass das klassische Design wieder dem 13. Oktober folgt, hält
   test623 in der echten App. */
const html = '<!doctype html><html lang="de" data-theme="dark"><head>' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  styles + '</head><body data-schale="premium" data-ui-shell="glass-wheel">' +
  '<header id="studio-bar"><button class="studio-search">Suche</button></header>' +
  '<div class="bib"><button class="bib-pille" aria-expanded="true">Filter' +
  '<span class="bib-pille-pfeil">⌄</span></button></div>' +
  '<nav id="handy-oben"><button class="an" type="button">' +
  '<span class="ho-z">⌂</span><b>Heute</b></button></nav>' +
  '</body></html>';

let gut=0,rot=0;
const p=(n: string, richtig: boolean, wert='')=>{
  console.log((richtig?'✓ ':'✗ ')+n+(richtig?'':' — '+wert));
  richtig?gut++:rot++;
};
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport:{width:1280,height:800},reducedMotion:'no-preference'
  });
  await page.setContent(html, { waitUntil:'load' });
  const suche = page.locator('#studio-bar .studio-search');
  const glass = await suche.evaluate(el=>({
    backdrop: getComputedStyle(el).backdropFilter,
    property: getComputedStyle(el).transitionProperty,
    cssSupports: CSS.supports('backdrop-filter','blur(1px)')
  }));
  p('Desktop-Suche hat einen echten Glasfilter oder einen Browser-Fallback',
    glass.cssSupports?glass.backdrop!=='none':true,glass.backdrop);
  p('Studio-Suche animiert Transform statt Breite/Position',
    glass.property.includes('transform') &&
    !glass.property.includes('width'),glass.property);
  p('Regalfilter-Pfeil dreht sich im geöffneten Zustand',
    (await page.locator('.bib-pille-pfeil').evaluate(el =>
      getComputedStyle(el).transform)) !== 'none');

  await page.setViewportSize({width:390,height:844});
  const mobile = await page.locator('#handy-oben button.an .ho-z')
    .evaluate(el=>getComputedStyle(el).transform);
  p('iPhone-Breite aktiviert federnde Tab-Auswahl',
    mobile!=='none',mobile);

  await page.evaluate(()=>{document.body.dataset.bewegung='ruhig'});
  const ruhig = await page.locator('#handy-oben button.an .ho-z')
    .evaluate(el=>({transform:getComputedStyle(el).transform,
                   transition:getComputedStyle(el).transitionDuration}));
  p('Redions Ruhe-Schalter stoppt die Tab-Bewegung',
    ruhig.transform==='none' && ruhig.transition==='0s',
    JSON.stringify(ruhig));

  await page.evaluate(()=>{delete document.body.dataset.bewegung});
  await page.emulateMedia({reducedMotion:'reduce'});
  const reduziert = await page.locator('#handy-oben button.an .ho-z')
    .evaluate(el=>getComputedStyle(el).transform);
  p('prefers-reduced-motion deaktiviert die neuen Effekte',
    reduziert==='none',reduziert);

  await page.setViewportSize({width:1280,height:800});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{
    const o=document.createElement('div');o.className='overlay';
    o.innerHTML='<div class="einst-fenster">Einstellungen</div>';
    document.body.appendChild(o);
  });
  const anim = await page.locator('.einst-fenster').evaluate(el=>
    getComputedStyle(el).animationName);
  p('Einstellungen öffnen mit eigener Ankunftsanimation',
    anim.includes('redion-settings-arrive'),anim);

  await page.emulateMedia({reducedMotion:'reduce'});
  const ohne = await page.locator('.einst-fenster').evaluate(el=>
    getComputedStyle(el).animationDuration);
  p('Reduced Motion verkürzt die Ankunft praktisch auf null',
    ohne.split(',').every(t=>parseFloat(t)<.01),ohne);

  await page.emulateMedia({reducedMotion:'no-preference',forcedColors:'active'});
  const kontrast = await suche.evaluate(el=>getComputedStyle(el).backdropFilter);
  p('Forced Colors entfernt die Suche-Unschärfe',
    kontrast==='none',kontrast);
  await page.close();
} finally { await browser.close(); }
console.log('Motion-Browsercheck: '+gut+' bestanden, '+rot+' gescheitert');
if(rot) process.exitCode=1;
