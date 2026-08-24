/* Suite 138 — Abgelegte Dateien überleben den Browser-Neustart (E98)
 * ============================================================================
 * DER FUND, gemessen am 19. August. Eine Datei über 256 KB wandert in Stücke
 * nach `dateien`/`stuecke` — richtig so. Dann aber holt der Aufrufer eine
 * `blob:`-Adresse und schreibt sie IN DEN BLOCK. Diese Adresse gehört dem
 * Dokument, das sie erzeugt hat: Browser zu, Adresse tot. Beim nächsten
 * Öffnen liest niemand `dateiId` zurück — die Bytes liegen unversehrt in
 * IndexedDB und sind trotzdem unerreichbar.
 *
 * Gemessen vor dem Eingriff, mit echtem Neustart des Browsers:
 *
 *     Stücke in der Ablage   5   (die Daten sind da)
 *     Bildbreite             0   (das Bild ist weg)
 *
 * Betroffen ist jedes Bild, Video und jeder Anhang über 256 KB — nicht nur
 * PDFs. Das ist Priorität 1 (§46: Daten sicher halten), nicht Feinschliff.
 *
 * WARUM DIESER LAUF ZWEI BROWSER-SITZUNGEN BRAUCHT. Ein blosses `reload()`
 * genügt NICHT: der Bildzwischenspeicher von Chromium liefert das Bild dann
 * weiterhin aus, obwohl `fetch(src)` schon scheitert. Gemessen — die erste
 * Fassung dieser Prüfung wäre grün gewesen und hätte nichts bewiesen (§55.2).
 * Deshalb: `launchPersistentContext`, schliessen, neu öffnen.
 *
 *   node pruefungen/lauf/test172.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8913;

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
const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'redion-t172-'));
const fehler: string[] = [];

console.log('\n1 · Sitzung eins: ein Bild und ein PDF über 256 KB anhängen');

let kontext = await chromium.launchPersistentContext(profil, {});
let seite = kontext.pages()[0] || await kontext.newPage();
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2600);

const eins = await seite.evaluate(async () => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  /* Und die Einrichtung der Hauptwelten: sie legt sich beim ersten Start
     über alles und fängt Klicks ab (E132). */
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.getElementById('rg-einladung')?.remove();
  const s = Store.addPage(null, { text: 'Grosse Anhänge' });

  /* Rauschen komprimiert nicht — das PNG wird sicher gross genug. */
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 900;
  const g = c.getContext('2d')!;
  const bild = g.createImageData(c.width, c.height);
  for (let i = 0; i < bild.data.length; i++) bild.data[i] = (Math.random() * 256) | 0;
  g.putImageData(bild, 0, 0);
  const blob: Blob = await new Promise(fertig => c.toBlob(b => fertig(b!), 'image/png'));

  const bildBlock = Store.addBlock(s.id, 'image', { text: 'gross.png' });
  const bildSatz = await (window as any).Dateien.ablegen(
    new File([blob], 'gross.png', { type: 'image/png' }), { blockId: bildBlock.id });

  /* Und dasselbe als Anhang — der Weg, den ein Schul-PDF nimmt. */
  const anhangBlock = Store.addBlock(s.id, 'file', { text: 'skript.pdf' });
  const anhangSatz = await (window as any).Dateien.ablegen(
    new File([blob], 'skript.pdf', { type: 'application/pdf' }), { blockId: anhangBlock.id });

  /* GENAU SO wie hochladen() es heute tut: die blob-Adresse wandert in den
     Block. Damit prüft dieser Lauf auch den BESTAND — Blöcke, die vor dem
     Eingriff angelegt wurden und diese tote Adresse für immer mit sich
     tragen. Sie müssen geheilt werden, nicht nur neue. */
  const bildUrl = await (window as any).Dateien.adresse(bildSatz.id);
  const anhangUrl = await (window as any).Dateien.adresse(anhangSatz.id);
  Store.updateBlock(bildBlock.id, { src: bildUrl, dateiId: bildSatz.id, text: 'gross.png' });
  Store.updateBlock(anhangBlock.id, { src: anhangUrl, dateiId: anhangSatz.id, text: 'skript.pdf' });

  /* Eine ZWEITE Datei auf einer eigenen Seite, die beim Neustart NICHT
     geöffnet wird. Ihre Adresse ist dort noch nie gebaut worden — nur das
     Nachreichen kann sie holen, der synchrone Weg findet nichts. So werden
     die zwei Wege einzeln prüfbar (gemessen: sonst deckt der zweite den
     ersten zu, und eine Gegenprobe am ersten bleibt grün). */
  const kalt = Store.addPage(null, { text: 'Kalte Seite' });
  const kaltBlock = Store.addBlock(kalt.id, 'image', { text: 'kalt.png' });
  const kaltSatz = await (window as any).Dateien.ablegen(
    new File([blob], 'kalt.png', { type: 'image/png' }), { blockId: kaltBlock.id });
  Store.updateBlock(kaltBlock.id, { dateiId: kaltSatz.id, text: 'kalt.png' });
  const kaltAnhang = Store.addBlock(kalt.id, 'file', { text: 'kalt.pdf' });
  const kaltAnhangSatz = await (window as any).Dateien.ablegen(
    new File([blob], 'kalt.pdf', { type: 'application/pdf' }), { blockId: kaltAnhang.id });
  Store.updateBlock(kaltAnhang.id, { dateiId: kaltAnhangSatz.id, text: 'kalt.pdf' });

  if (Store.flush) await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 700));
  const img = document.querySelector<HTMLImageElement>(`[data-bid="${bildBlock.id}"] img`);
  return {
    seite: s.id, bild: bildBlock.id, anhang: anhangBlock.id,
    kalteSeite: kalt.id, kaltBlock: kaltBlock.id, kaltAnhang: kaltAnhang.id,
    groesse: blob.size, lohnt: (window as any).Dateien.lohntSich(blob.size),
    teile: bildSatz.teile,
    breiteGleich: img ? img.naturalWidth : -1,
    bildUrlDa: !!bildUrl, anhangUrlDa: !!anhangUrl
  };
});
console.log('   ' + JSON.stringify({ groesse: (eins as any).groesse,
  teile: (eins as any).teile, lohnt: (eins as any).lohnt }));
p('Die Datei ist gross genug für den Stücke-Weg',
  (eins as any).lohnt === true && (eins as any).groesse > 256 * 1024,
  (eins as any).groesse + ' Bytes');
p('Sie steht sofort im Bild', (eins as any).breiteGleich > 0,
  String((eins as any).breiteGleich));

await new Promise(r => setTimeout(r, 800));
await kontext.close();

console.log('\n2 · Sitzung zwei: derselbe Browser, neu gestartet — der ehrliche Fall');

kontext = await chromium.launchPersistentContext(profil, {});
seite = kontext.pages()[0] || await kontext.newPage();
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2800);

const zwei = await seite.evaluate(async (arg: any) => {
  App.oeffne(arg.seite);
  await new Promise(r => setTimeout(r, 1200));
  const b = Store.getBlock(arg.bild) || {};
  const img = document.querySelector<HTMLImageElement>(`[data-bid="${arg.bild}"] img`);
  const verweis = document.querySelector<HTMLAnchorElement>(`[data-bid="${arg.anhang}"] a[href]`);
  return {
    stuecke: b.dateiId ? ((await Store.stueckeVon(b.dateiId)) || []).length : -1,
    dateiIdDa: !!b.dateiId,
    srcAnfang: (b.src || '(leer)').slice(0, 12),
    imgBreite: img ? img.naturalWidth : -1,
    anhangHref: (verweis?.getAttribute('href') || '(keiner)').slice(0, 12),
    anhangLebt: verweis
      ? await fetch(verweis.href).then(r => r.ok).catch(() => false)
      : false
  };
}, eins);
console.log('   ' + JSON.stringify(zwei));

p('Die Bytes liegen weiterhin in der Ablage', (zwei as any).stuecke > 0,
  String((zwei as any).stuecke));
p('Der Block kennt seine Datei-Kennung', (zwei as any).dateiIdDa);

/* DER KERN: das Bild muss wieder da sein. Vor dem Eingriff war es Breite 0. */
p('Das BILD ist nach dem Neustart wieder da', (zwei as any).imgBreite > 0,
  'Breite ' + (zwei as any).imgBreite + ' — die Bytes sind da, nur unerreichbar');

/* Und der Anhang muss sich wirklich öffnen lassen, nicht nur dastehen. */
p('Der ANHANG lässt sich nach dem Neustart öffnen', (zwei as any).anhangLebt,
  'Verweis ' + (zwei as any).anhangHref);

console.log('\n3 · Der Bestand wird geheilt, nicht umgeschrieben');
/* Die tote Adresse DARF im Block stehenbleiben — sie zu löschen wäre eine
   Datenänderung ohne Gewinn. Sie darf nur nicht mehr BENUTZT werden. */
p('Die alte Adresse steht noch im Block, stört aber nicht mehr',
  String((zwei as any).srcAnfang).startsWith('blob:'), (zwei as any).srcAnfang);

console.log('\n4 · Auf einer nur EINMAL gezeichneten Seite trägt das Nachreichen');
/* Die kalte Seite wurde in dieser Sitzung noch nie gezeichnet, ihre Adresse
   also noch nie gebaut. Damit kann der synchrone Weg nichts liefern — was
   hier ankommt, hat das Nachreichen gebracht. */
const kalt = await seite.evaluate(async (arg: any) => {
  let male = 0;
  const orig = App.zeichneSeite;
  (App as any).zeichneSeite = function (this: unknown, ...a: unknown[]) {
    male++; return (orig as any).apply(App, a);
  };
  App.oeffne(arg.kalteSeite);
  const lies = () => {
    const img = document.querySelector<HTMLImageElement>(`[data-bid="${arg.kaltBlock}"] img`);
    const a2 = document.querySelector<HTMLAnchorElement>(`[data-bid="${arg.kaltAnhang}"] a[href]`);
    return { src: (img?.getAttribute('src') || '(leer)').slice(0, 5),
             breite: img ? img.naturalWidth : -1,
             anhangVerweis: !!a2 && (a2.getAttribute('href') || '').startsWith('blob:') };
  };
  await new Promise(r => setTimeout(r, 1200));
  const spaet = lies();
  (App as any).zeichneSeite = orig;
  return { male, spaet };
}, eins);
console.log('   ' + JSON.stringify(kalt));
p('Die Seite wurde kein zweites Mal gezeichnet', (kalt as any).male === 0,
  (kalt as any).male + ' zusätzliche Zeichnungen');
/* KEIN Punkt auf „anfangs noch leer": das wäre eine Behauptung über
   Langsamkeit. Gemessen kam die Adresse einmal nach 40 ms und einmal nach
   120 ms — eine Prüfung darauf kippt unter Last zufällig (E82). Was zählt:
   kein zweites Zeichnen UND das Bild ist da, also hat es das Nachreichen
   gebracht. */
p('Das Nachreichen trägt das Bild ein, ohne zweites Zeichnen',
  (kalt as any).spaet.breite > 0, JSON.stringify((kalt as any).spaet));
p('… und macht aus dem wartenden Anhang einen echten Verweis',
  (kalt as any).spaet.anhangVerweis, JSON.stringify((kalt as any).spaet));

console.log('\n5 · Beim Neuzeichnen flackert nichts');
/* Ohne Zeitannahme: SOFORT nach dem Neuzeichnen, im selben Tick, muss die
   Adresse schon dastehen. Sie kommt dann aus dem synchronen Weg — das
   Nachreichen käme erst später und liesse das Bild kurz leer. */
const ohneFlackern = await seite.evaluate((arg: any) => {
  App.zeichneSeite();
  const img = document.querySelector<HTMLImageElement>(`[data-bid="${arg.kaltBlock}"] img`);
  return (img?.getAttribute('src') || '(leer)').slice(0, 5);
}, eins);
p('Nach dem Neuzeichnen steht die Adresse sofort da', ohneFlackern === 'blob:',
  ohneFlackern);

console.log('\n6 · Der Quelltext holt die Adresse beim Zeichnen');
const quelle = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/editor/ansicht/editor.ts'), 'utf8');
p('Es gibt einen Weg von der Kennung zur lebenden Adresse',
  quelle.includes('ausAblage'));
p('Beim Hochladen wird keine blob-Adresse in den Block geschrieben',
  !/updateBlock\(block\.id, \{ src: url, dateiId/.test(quelle));

p('Keine Seitenfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await seite.screenshot({ path: path.join(WURZEL, 'bilder', 'test172-neustart.png') })
  .catch(() => {});
await kontext.close();
server.close();
fs.rmSync(profil, { recursive: true, force: true });

console.log(`\n${weg ? '✗' : '✓'} ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
