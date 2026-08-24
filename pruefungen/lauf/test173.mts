/* Suite 139 — Ziehen-und-Ablegen kennt nur noch eine Grenze (E99)
 * ============================================================================
 * Zwei Wege, zwei Ergebnisse — gemessen am 19. August:
 *
 *   Datei-Block, eigener Knopf   Stücke, bis 500 MB
 *   Datei auf die Seite ZIEHEN   Data-Adresse, bis 12 MB, darüber nur ein
 *                                Hinweis — die Datei war weg
 *
 * Ein 20-MB-Schulskript verschwand also beim Ziehen und klappte über den
 * Knopf. CLAUDE.md §14 nennt genau diese 12-MB-Grenze als nicht endgültig,
 * und §34 verlangt: ein Wert, der an zwei Stellen steht, gehört an eine.
 * Jetzt entscheidet `Dateien.lohntSich` beide Male.
 *
 *   node pruefungen/lauf/test173.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8917;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = path.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !fs.existsSync(pfad) || fs.statSync(pfad).isDirectory()) {
    b.writeHead(404); b.end(); return;
  }
  b.writeHead(200, { 'Content-Type': TYP[path.extname(pfad)] ?? 'application/octet-stream' });
  b.end(fs.readFileSync(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

const browser = await chromium.launch();
const seite = await browser.newPage();
await seite.setViewportSize({ width: 1280, height: 800 });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Eine Datei wirklich fallen lassen — über ein echtes DataTransfer. */
const fallenLassen = async (name: string, typ: string, mb: number) => {
  return seite.evaluate(async (arg: any) => {
    const bytes = new Uint8Array(arg.groesse);
    for (let i = 0; i < bytes.length; i += 4096) bytes[i] = (i * 31) & 255;
    const datei = new File([bytes], arg.name, { type: arg.typ });
    const dt = new DataTransfer();
    dt.items.add(datei);
    /* Der Zuhörer sitzt auf #scroll — nachgesehen, nicht geraten
       (werkzeuge.ts: `const bereich = document.getElementById('scroll')`). */
    const ziel = document.getElementById('scroll');
    if (!ziel) return { angelegt: -1, art: 'KEIN #scroll', hatKennung: false,
                        srcAnfang: '', stuecke: 0 };
    ziel.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 2500));
    const seiteId = App.aktuelleSeite();
    const kinder = Store.childrenOf(seiteId).filter((b: any) =>
      b.type === 'file' || b.type === 'image');
    const letzter = kinder[kinder.length - 1] || {};
    return {
      angelegt: kinder.length,
      art: letzter.type || '(keiner)',
      hatKennung: !!letzter.dateiId,
      srcAnfang: String(letzter.src || '(leer)').slice(0, 5),
      stuecke: letzter.dateiId ? ((await Store.stueckeVon(letzter.dateiId)) || []).length : 0
    };
  }, { name, typ, groesse: Math.round(mb * 1024 * 1024) });
};

await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Abwurfplatz' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(500);

console.log('\n1 · Ein 20-MB-PDF fallen lassen — vorher verschwand es');
const gross = await fallenLassen('skript.pdf', 'application/pdf', 20);
console.log('   ' + JSON.stringify(gross));
p('Ein Block ist entstanden', (gross as any).angelegt >= 1,
  'angelegt ' + (gross as any).angelegt);
p('Er trägt eine Datei-Kennung', (gross as any).hatKennung);
p('Die Bytes liegen in Stücken in der Ablage', (gross as any).stuecke > 1,
  (gross as any).stuecke + ' Stücke');
p('Und KEINE Data-Adresse im Block', !String((gross as any).srcAnfang).startsWith('data:'),
  (gross as any).srcAnfang);

console.log('\n2 · Etwas Kleines geht weiter den kurzen Weg');
/* Kein .txt — das wird absichtlich zur Unterseite statt zum Anhang
   (nachgesehen im drop-Zweig). Ein kleines Bild nimmt den kurzen Weg. */
const klein = await fallenLassen('klein.png', 'image/png', 0.05);
console.log('   ' + JSON.stringify(klein));
p('Auch hier entsteht ein Block', (klein as any).angelegt >= 2,
  'angelegt ' + (klein as any).angelegt);
p('… als Bild', (klein as any).art === 'image', (klein as any).art);
p('Kleines braucht keine Stücke', (klein as any).stuecke === 0,
  (klein as any).stuecke + ' Stücke');
p('… und trägt seine Daten direkt', String((klein as any).srcAnfang).startsWith('data:'),
  (klein as any).srcAnfang);

console.log('\n3 · Der Quelltext kennt nur noch eine Grenze');
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/werkzeuge.ts'), 'utf8');
p('Die willkürliche 12-MB-Grenze ist weg',
  !/12 \* 1024 \* 1024/.test(quelle));
p('Stattdessen entscheidet Dateien.lohntSich',
  quelle.includes('Dateien.lohntSich(f.size)'));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();
console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
