/* Suite 119 — Am Telefon sind Menüs Blätter, alle (L10)
 * ============================================================================
 * `Menue.menu` macht aus jedem Menü am Telefon ein Blatt von unten — mit
 * Grund, Wischgeste und Karten. Aber zwei Menüs waren VON HAND gebaut, am
 * Modul vorbei: das ⋯-Menü der Seitenleisten-Abschnitte und das
 * Umwandeln-Menü der Mehrfachauswahl. Am Telefon standen sie als
 * Rechner-Kästchen mitten im Bild.
 *
 * Und der Handbau hatte eine zweite Falle: sein once-Klick-Schliesser
 * entfernte nur das Menü. Am Telefon wäre der dunkle Grund STEHEN
 * geblieben — eine unsichtbare Wand vor der App.
 *
 *   node pruefungen/lauf/test155.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8863;

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
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();

console.log('\n1 · Das ⋯-Menü der Abschnitte, am Telefon');

const handy = await browser.newPage({ viewport: { width: 390, height: 844 } });
const fehler: string[] = [];
handy.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await handy.goto(`http://localhost:${PORT}/index.html`);
await handy.waitForTimeout(2400);
await handy.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

const blatt1 = await handy.evaluate(async () => {
  (window as any).Seitenleiste.abschnittMenue(
    document.body, 'Privat');
  await new Promise(r => setTimeout(r, 300));
  const m = document.querySelector('.menu');
  return {
    istBlatt: m?.classList.contains('blatt') ?? false,
    hatGrund: !!document.querySelector('.menu-grund'),
    hatGriff: !!m?.querySelector('.blatt-griff'),
    titel: m?.querySelector('.blatt-titel')?.textContent ?? '',
    karten: m?.querySelectorAll('.blatt-karte').length ?? 0
  };
});
gleich('Es ist ein Blatt', (blatt1 as any).istBlatt, true);
gleich('… mit dunklem Grund dahinter', (blatt1 as any).hatGrund, true);
gleich('… mit Griff', (blatt1 as any).hatGriff, true);
gleich('… und der Abschnittsname ist der Titel', (blatt1 as any).titel, 'Privat');
p('Die Einträge stehen in Karten', ((blatt1 as any).karten ?? 0) >= 2,
  String((blatt1 as any).karten));

/* Ein Eintrag angeklickt: Menü UND Grund müssen verschwinden — der
   stehengebliebene Grund war die unsichtbare Wand des Handbaus. */
const zu1 = await handy.evaluate(async () => {
  (document.querySelector('.menu [data-a="alleAuf"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 200));
  return { menu: !!document.querySelector('.menu'),
           grund: !!document.querySelector('.menu-grund') };
});
gleich('Nach dem Klick ist das Blatt weg', (zu1 as any).menu, false);
gleich('… und der Grund AUCH — keine unsichtbare Wand', (zu1 as any).grund, false);

console.log('\n2 · Das Umwandeln-Menü der Mehrfachauswahl, am Telefon');

const blatt2 = await handy.evaluate(async () => {
  const s = Store.addBlock(null, 'page', { text: 'Auswahlseite' });
  const a = Store.addBlock(s.id, 'text', { text: 'Eins' });
  const b = Store.addBlock(s.id, 'text', { text: 'Zwei' });
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  (Blocks as any).auswahlSetzen?.([a.id, b.id]);
  (Blocks as any).auswahlTypMenue?.(document.body);
  await new Promise(r => setTimeout(r, 300));
  const m = document.querySelector('.menu');
  return {
    da: !!m,
    istBlatt: m?.classList.contains('blatt') ?? false,
    titel: m?.querySelector('.blatt-titel')?.textContent ?? '',
    knoepfe: m?.querySelectorAll('[data-t]').length ?? 0,
    ids: { a: a.id, b: b.id }
  };
});
gleich('Auch dieses Menü ist ein Blatt', (blatt2 as any).istBlatt, true);
gleich('… betitelt', (blatt2 as any).titel, 'Umwandeln in');
p('Mit den einfachen Typen als Knöpfen', ((blatt2 as any).knoepfe ?? 0) >= 5,
  String((blatt2 as any).knoepfe));

const gewandelt = await handy.evaluate(async (ids: any) => {
  (document.querySelector('.menu [data-t="h2"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 300));
  return { typ: Store.getBlock(ids.a)?.type,
           menu: !!document.querySelector('.menu'),
           grund: !!document.querySelector('.menu-grund') };
}, (blatt2 as any).ids);
gleich('Der Klick wandelt wirklich um', (gewandelt as any).typ, 'h2');
gleich('Blatt weg', (gewandelt as any).menu, false);
gleich('Grund weg', (gewandelt as any).grund, false);

console.log('\n3 · Am Rechner bleiben beide beim Zeiger');

const rechner = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await rechner.goto(`http://localhost:${PORT}/index.html`);
await rechner.waitForTimeout(2400);
const amRechner = await rechner.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  (window as any).Seitenleiste.abschnittMenue(document.body, 'Privat');
  await new Promise(r => setTimeout(r, 200));
  const m = document.querySelector('.menu');
  const istBlatt = m?.classList.contains('blatt') ?? true;
  const grund = !!document.querySelector('.menu-grund');
  document.querySelectorAll('.menu, .menu-grund').forEach(x => x.remove());
  return { istBlatt, grund };
});
gleich('Kein Blatt am Rechner', (amRechner as any).istBlatt, false);
gleich('Kein Grund am Rechner', (amRechner as any).grund, false);
await rechner.close();

console.log('\n4 · Wer das Menü entfernt, nimmt den Grund mit');

/* Fast alle Aufrufer schliessen nach einer Aktion mit `menu.remove()` —
   vom Grund wissen sie nichts. Er blieb dann als unsichtbare dunkle Wand
   stehen und frass genau einen Tipp (gefunden beim Bau von E84). Der
   Wächter im Modul räumt ihn jetzt mit weg. */
const wandWeg = await handy.evaluate(async () => {
  const m = Menue.menu('<button>Eintrag</button>', 10, 10, { titel: 'Probe' });
  await new Promise(r => setTimeout(r, 150));
  const grundVorher = !!document.querySelector('.menu-grund');
  m.remove();                                   /* wie es die Aufrufer tun */
  await new Promise(r => setTimeout(r, 150));
  return { grundVorher, grundNachher: !!document.querySelector('.menu-grund') };
});
gleich('Der Grund stand', (wandWeg as any).grundVorher, true);
gleich('… und ist mit dem Menü verschwunden', (wandWeg as any).grundNachher, false);

console.log('\n5 · Und es gibt keine Handmenüs mehr am Modul vorbei');
const quellen = ['src/schale/aufbau/seitenleiste.ts',
                 'src/bereiche/editor/ansicht/editor.ts'];
for (const q of quellen) {
  const s = fs.readFileSync(path.join(WURZEL, q), 'utf8');
  p(q.split('/').pop() + ' baut kein .menu mehr von Hand',
    !/className = 'menu'/.test(s));
}

console.log('\n6 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 119 — Menüs sind Blätter: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
