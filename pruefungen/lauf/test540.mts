/* Suite 540 — Die gemerkte Seite überlebt eine Fenstergrösse (E644, P73)
 * ============================================================================
 * WAS HIER GEHALTEN WIRD. Seit E349 öffnet Redion ein Dokument dort, wo man
 * es verlassen hat — „GoodNotes öffnet ein Dokument dort, wo man es verlassen
 * hat; hier begann jedes Öffnen bei Seite 1". Gemerkt wird je Dokument als
 * Meta unter `dokSeite:<id>`.
 *
 * WAS SCHIEFGING. `test424` prüfte das schon, und zwar richtig — aber über
 * einen Weg, der das Ergebnis dem Zufall überliess: Dokument öffnen,
 * neuladen, nachsehen. Am 20. September war die Zeile rot, allein und im
 * Stapel, auf dem Zweig und auf `main`. Gemessen mit einem Haken auf
 * `Store.setMeta` sah der Weg so aus:
 *
 *     direkt nach dem Blättern   meta=1  aktiv=1
 *     vor dem Zurück ins Regal   meta=1  aktiv=1
 *     nach der Bildmatrix        meta=1  aktiv=null
 *     nach dem letzten Öffnen    meta=0  aktiv=0      ← hier
 *
 *     seiteMerken ⟵ nachziehen ⟵ beiGroesse
 *
 * `beiGroesse` ist der Fensterwechsel. Er ruft `nachziehen()`, und das
 * rechnet aus dem Rollstand, welche Seite in der Fenstermitte steht. Beim
 * frisch geöffneten Dokument ist der Rollstand 0 und die Wiederherstellung
 * steht noch im `requestAnimationFrame` — also lautet die Antwort „Seite 1",
 * und sie wird GEMERKT. Die zuletzt gelesene Seite ist damit weg.
 *
 * WARUM ES EIN WETTLAUF IST, und warum dieser Lauf ihn nicht dem Zufall
 * überlässt: derselbe Haken, der ihn sichtbar machte, machte ihn beim
 * zweiten Versuch auch unsichtbar — mit ein paar Millisekunden mehr Arbeit
 * im Haken lief derselbe Durchgang grün. Ein Wächter, der ein Rennen
 * zufällig gewinnt, ist keiner. Hier wird das Rennen deshalb GESTELLT: das
 * Fenster meldet seine neue Grösse ausdrücklich, bevor der rAF laufen kann.
 *
 *   §1 GESTELLTES RENNEN: `resize` vor der Wiederherstellung.
 *   §2 DER NORMALFALL bleibt heil — ohne Fenstermeldung geht nichts verloren.
 *   §3 GEGENPROBE: wer wirklich rollt, ändert die gemerkte Seite sehr wohl.
 *
 * ACHTUNG BEIM SCHREIBEN: was in `page.evaluate('…')` steht, ist reines
 * JavaScript im Browser. Ein `as HTMLElement` darin ist ein Syntaxfehler —
 * hier einmal gebaut und sofort gesehen. Typen gehören ausserhalb der
 * Zeichenkette, an das Ergebnis.
 *
 *   node pruefungen/lauf/test540.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent((req.url || '/').split('?')[0] || '/');
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8' });
  res.end(fs.readFileSync(file));
});
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
const PORT = (server.address() as { port: number }).port;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
page.setDefaultTimeout(10000);
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
let ok = 0, weg = 0;
const p = (name: string, wahr: unknown, extra = ''): void => {
  if (wahr) { ok++; console.log('  ✓ ' + name); }
  else { weg++; console.log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
};

/* Two real, original test PDF pages, no user file and no remote assets. */
const pdf = (): Buffer => {
  const objs: string[] = ['<< /Type /Pages /Count 2 /Kids [4 0 R 6 0 R] >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (let n = 1; n <= 2; n++) {
    const stream = `0.25 0.18 0.5 rg BT /F1 28 Tf 55 745 Td (REDION STUDIO) Tj ET\n0.15 0.15 0.18 rg BT /F1 17 Tf 55 690 Td (Elektrotechnik - Kapitel ${n}) Tj ET\nBT /F1 13 Tf 55 635 Td (Spannung, Strom und Widerstand) Tj ET\nBT /F1 13 Tf 55 600 Td (U = R x I) Tj ET\n0.8 0.8 0.85 RG 55 670 m 540 670 l S`;
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    objs.push(`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 2 0 R >> >> /Contents ${objs.length} 0 R >>`);
  }
  objs.push('<< /Type /Catalog /Pages 1 0 R >>');
  let content = '%PDF-1.4\n'; const offsets: number[] = [];
  objs.forEach((obj, i) => { offsets.push(Buffer.byteLength(content)); content += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = Buffer.byteLength(content);
  content += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('');
  content += `trailer\n<< /Size ${objs.length + 1} /Root ${objs.length} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(content);
};


const ZUR_SEITE = 1;

try {
  await page.goto(`http://127.0.0.1:${PORT}/index.html`);
  await page.waitForFunction("typeof App !== 'undefined' && typeof StudioSchale !== 'undefined' && Store.cache.blocks");
  await page.waitForTimeout(900);
  await page.evaluate(`(() => {
    Store.setMeta('rundgangGesehen', true);
    Store.setMeta('neuerungenGesehen', Math.max(...Rundgang.NEUERUNGEN.map(n => n.nr)));
    document.querySelectorAll('.overlay,.produkt-onboarding-lage,#rg-willkommen,#rg-einladung,#rg-neu').forEach(e=>e.remove());
    Bibliothek.oeffne(null);
  })()`);

  const choice = page.waitForEvent('filechooser');
  await page.locator('.bib-studio-import').click();
  await (await choice).setFiles({ name: 'Elektrotechnik Studio.pdf', mimeType: 'application/pdf', buffer: pdf() });
  await page.locator('.document-workspace').waitFor({ timeout: 60000 });
  const id = await page.locator('.document-workspace').getAttribute('data-page-id');
  p('Ein Dokument mit zwei Seiten liegt vor', !!id && await page.locator('.document-stage').count() === 2);

  /* Blättern wie ein Mensch: „☷ Ansicht" auf, dann ›. Nicht den Merker von
     Hand setzen — dann bliebe der Zustand im Arbeitsspeicher bei 0, und der
     Fall, um den es geht, käme gar nicht zustande. */
  const standJetzt = (): Promise<string | null> =>
    page.locator('.document-stage[data-aktiv]').getAttribute('data-stand-nr');
  /* Blättert, BIS die gewünschte Seite steht — statt einmal auf › zu
     tippen. Der Unterschied ist nicht Stil: auf der letzten Seite ist ›
     `disabled`, und ein Abschnitt, der die Ausgangslage seines Vorgängers
     annimmt, wird rot, sobald der Vorgänger sich ändert. */
  const aufSeiteTippen = async (ziel = ZUR_SEITE): Promise<void> => {
    for (let versuch = 0; versuch < 6; versuch++) {
      if (await standJetzt() === String(ziel)) return;
      const jetzt = Number(await standJetzt() ?? 0);
      if (!await page.locator('[data-document-action="next"]').isVisible())
        await page.locator('[data-document-action="view"]').click();
      await page.locator(jetzt < ziel ? '[data-document-action="next"]'
                                      : '[data-document-action="previous"]').click();
      await page.waitForTimeout(300);
    }
  };
  const merker = (): Promise<unknown> =>
    page.evaluate(`Store.getMeta('dokSeite:' + ${JSON.stringify(id)})`);

  console.log('\n1 · GESTELLTES RENNEN: das Fenster meldet sich vor der Wiederherstellung');
  await aufSeiteTippen();
  p('Nach dem Blättern steht die zweite Seite', await standJetzt() === String(ZUR_SEITE));
  p('Und sie ist gemerkt', await merker() === ZUR_SEITE, JSON.stringify(await merker()));

  await page.evaluate('Bibliothek.oeffne(null)');
  await page.waitForTimeout(250);

  /* DAS RENNEN. `App.oeffne` baut den Arbeitsraum neu: der Rollstand steht
     wieder auf 0, der gemerkte Stand ist noch 1, und die Wiederherstellung
     wartet auf den nächsten Bildaufbau. Genau dazwischen meldet das Fenster
     eine neue Grösse — auf einem Telefon reicht dafür das Drehen, am Rechner
     das Ziehen am Rand oder das Aufklappen der Seitenleiste. */
  const nachRennen = await page.evaluate(`(async () => {
    App.oeffne(${JSON.stringify(id)});
    window.dispatchEvent(new Event('resize'));
    await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)));
    window.dispatchEvent(new Event('resize'));
    await new Promise(f => setTimeout(f, 500));
    const c = document.querySelector('.document-center');
    return { meta: Store.getMeta('dokSeite:' + ${JSON.stringify(id)}),
             aktiv: document.querySelector('.document-stage[data-aktiv]')?.dataset.standNr ?? null,
             scrollTop: c ? c.scrollTop : null };
  })()`) as { meta: unknown; aktiv: string | null; scrollTop: number | null };

  p('Die gemerkte Seite überlebt die Fenstermeldung',
    nachRennen.meta === ZUR_SEITE, 'meta=' + JSON.stringify(nachRennen.meta));
  p('Und das Dokument steht auch wirklich dort',
    nachRennen.aktiv === String(ZUR_SEITE), 'aktiv=' + JSON.stringify(nachRennen.aktiv));
  p('Es ist hingerollt, nicht nur beschriftet',
    (nachRennen.scrollTop ?? 0) > 0, 'scrollTop=' + JSON.stringify(nachRennen.scrollTop));

  console.log('\n2 · DER NORMALFALL: ohne Fenstermeldung ging es auch vorher gut');
  /* EIGENE AUSGANGSLAGE, nicht die von §1. Wäre §1 rot, stünde hier schon
     eine 0 — und §2 wäre rot aus einem fremden Grund. Jeder Abschnitt
     stellt her, was er prüft. */
  await aufSeiteTippen();
  await page.evaluate('Bibliothek.oeffne(null)');
  await page.waitForTimeout(250);
  await page.evaluate(`App.oeffne(${JSON.stringify(id)})`);
  await page.waitForTimeout(600);
  p('Ohne `resize` bleibt die gemerkte Seite stehen', await merker() === ZUR_SEITE,
    JSON.stringify(await merker()));

  console.log('\n3 · GEGENPROBE: wer wirklich rollt, ändert die gemerkte Seite sehr wohl');
  /* Ohne diese Zeile könnte §1 grün sein, weil gar nichts mehr gemerkt wird.
     Ein Wächter, der eine Änderung verhindert, muss zeigen, dass die
     Änderung auf dem richtigen Weg noch ankommt (§55.2). */
  const nachRollen = await page.evaluate(`(async () => {
    const c = document.querySelector('.document-center');
    c.scrollTop = 0;
    c.dispatchEvent(new Event('scroll'));
    await new Promise(f => setTimeout(f, 400));
    return Store.getMeta('dokSeite:' + ${JSON.stringify(id)});
  })()`);
  p('Wer zurück an den Anfang rollt, merkt die erste Seite', nachRollen === 0,
    JSON.stringify(nachRollen));

  p('Keine Ausnahme im Browser', errors.length === 0, errors.slice(0, 2).join(' · '));
} catch (fehler) {
  p('Der Lauf kommt durch', false, (fehler as Error).message.slice(0, 200));
}

await browser.close();
server.close();
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
