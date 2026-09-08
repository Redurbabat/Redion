/* Suite 477 — Der Leiterstift: die Adern beim Namen (E509)
 * ============================================================================
 * Redur, 8. September, mit dem Bild der Farbreihe:
 *
 *   „die Schutzleiter sollte hier sein wie eine Farbe, und wenn ich mit
 *    Maus drauf gehe, sollte mir dann zeigen Schutzleiter — und für die
 *    anderen Farben auch. Es sollte folgendes haben: ein spezieller Stift,
 *    füge oben, wo die Stift-Markierung ist … das ist speziell für
 *    Fachzeichen gedacht. Die Schutzleiter, die Neutralleiter sollte blau
 *    sein und es ist Strich Strich Strich, so nur Strich. Dann für L1
 *    braun, L2 schwarz und L3 grau. Und für S (Lampendraht) solltest du
 *    eine passende Farbe finden. Und Korrespondierende 1, 2, 3 bis 4
 *    sollten verschiedene Farben haben."
 *
 *   §1 EIN KATALOG DER ADERN, nicht zehn Stellen mit Farbwerten. Zehn
 *      Einträge mit Kürzel, Namen, Farbe und Strichart.
 *   §2 DIE FARBEN SIND DIE, DIE REDUR GENANNT HAT — und die vier
 *      Korrespondierenden sind wirklich verschieden, gemessen und nicht
 *      behauptet.
 *   §3 EIN EIGENER STIFT, und er schaltet die Farbreihe auf die Adern um.
 *   §4 JEDER TUPFER SAGT SEINEN NAMEN — beim Überfahren und für einen
 *      Vorleser (§38). Auch die fünf gewöhnlichen Farben, die bis hierher
 *      alle „Farbe" hiessen.
 *   §5 DER NEUTRALLEITER IST BLAU UND GESTRICHELT — nur Striche, keine
 *      Punkte. Der Schutzleiter bleibt grün-gelb mit Strich und Punkt.
 *   §6 EINE ADER WÄHLEN SETZT FARBE UND STRICHART in einem Zug.
 *   §7 UND SIE STEHT SCHON BEIM ÖFFNEN DA — der Fund des Bildes: §3
 *      klickt sich zum Stift durch und löst den Wechsel selbst aus.
 *   §8 QUELLEN, keine Seitenfehler.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Vor dem Bauen war sie es in §1 bis §6. Die Gegenproben danach stehen in
 * ENTSCHEIDUNGEN.md unter E509.
 *
 *   node pruefungen/lauf/test477.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import type { Page } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const App: any; declare const Marken: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9597;
const TYP: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.svg': 'image/svg+xml'
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll), `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);
const lies = (f: string): string => fs.readFileSync(path.join(WURZEL, f), 'utf8');

const browser = await chromium.launch();
const fehler: string[] = [];

const mitBlatt = async (): Promise<Page> => {
  const s = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    document.querySelector('.produkt-onboarding-lage')?.remove();
    document.getElementById('rg-willkommen')?.remove();
    const seite = Store.addPage(null, { text: 'Schaltplan' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  await s.click('.blatt-werk [data-wz="stift"]');
  return s;
};

/* ═══ §1/§2 Der Katalog ════════════════════════════════════════════════════ */
console.log('\n§1 Ein Katalog der Adern');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    da: Array.isArray(Marken.LEITER),
    liste: (Marken.LEITER || []).map(l => ({ id: l.id, kurz: l.kurz, name: l.name,
      farbe: l.farbe, stil: l.stil }))
  }))()`) as string);
  p('Es gibt einen Katalog `Marken.LEITER`', r.da);
  gleich('… mit zehn Adern', r.liste.length, 10);
  gleich('… und diesen Kürzeln',
    r.liste.map((l: any) => l.kurz), ['PE', 'N', 'L1', 'L2', 'L3', 'S', '1', '2', '3', '4']);
  p('Jede trägt einen Namen zum Vorlesen',
    r.liste.every((l: any) => typeof l.name === 'string' && l.name.length > 3),
    JSON.stringify(r.liste.map((l: any) => l.name)));

  console.log('\n§2 Die Farben, die Redur genannt hat');
  const nach = (kurz: string) => r.liste.find((l: any) => l.kurz === kurz);
  /* Gemessen wird der Farbton, nicht der Hexwert: „braun" ist eine Familie,
     kein einzelner Wert, und ein Prüflauf, der #7a4a21 verlangt, prüft
     meinen Geschmack statt Redurs Wunsch. */
  const hsl = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const rr = ((n >> 16) & 255) / 255, gg = ((n >> 8) & 255) / 255, bb = (n & 255) / 255;
    const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb), d = max - min;
    let h = 0;
    if (d) {
      if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0));
      else if (max === gg) h = (bb - rr) / d + 2;
      else h = (rr - gg) / d + 4;
      h *= 60;
    }
    const l = (max + min) / 2;
    const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    return { h: Math.round(h), s: Math.round(sat * 100), l: Math.round(l * 100) };
  };
  const n = hsl(nach('N').farbe), l1 = hsl(nach('L1').farbe);
  const l2 = hsl(nach('L2').farbe), l3 = hsl(nach('L3').farbe);
  console.log(`     N ${nach('N').farbe} · L1 ${nach('L1').farbe} · L2 ${nach('L2').farbe} · L3 ${nach('L3').farbe} · S ${nach('S').farbe}`);
  p('N ist blau', n.h > 195 && n.h < 250 && n.s > 40, JSON.stringify(n));
  p('L1 ist braun — ein dunkles Orange', l1.h > 10 && l1.h < 42 && l1.l < 42 && l1.s > 25,
    JSON.stringify(l1));
  p('L2 ist schwarz', l2.l < 15, JSON.stringify(l2));
  p('L3 ist grau — hell genug, um sich von Schwarz zu trennen',
    l3.s < 12 && l3.l > 40 && l3.l < 75, JSON.stringify(l3));
  const k = ['1', '2', '3', '4'].map(x => nach(x).farbe);
  gleich('Die vier Korrespondierenden sind vier verschiedene Farben',
    new Set(k).size, 4);
  /* Und wirklich UNTERSCHEIDBAR: der Farbton muss auseinanderliegen, nicht
     nur der Hexwert. Vier Nuancen desselben Rots wären vier Farben und
     doch eine (§38). */
  const toene = k.map(x => hsl(x).h).sort((a, b) => a - b);
  const luecken = toene.slice(1).map((v, i) => v - toene[i]!);
  console.log('     Korrespondierende: ' + k.join(' ') + ' → Töne ' + toene.join(', '));
  p('… und ihre Farbtöne liegen weit auseinander',
    luecken.every((d: number) => d >= 35), JSON.stringify(toene));
  p('Keine Ader hat die Farbe einer anderen',
    new Set(r.liste.map((l: any) => l.farbe)).size === 10);
  await s.close();
}

/* ═══ §3/§4 Der Stift und die Namen ════════════════════════════════════════ */
console.log('\n§3 Ein eigener Stift für das Fachzeichnen');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => JSON.stringify({
    stifte: Marken.STIFTE.map(x => x.id),
    hatLeiter: Marken.STIFTE.some(x => x.id === 'leiter')
  }))()`) as string);
  p('Es gibt einen Stift „leiter"', r.hatLeiter, JSON.stringify(r.stifte));
  p('… und die alten stehen unverändert davor',
    JSON.stringify(r.stifte.slice(0, 5)) ===
    JSON.stringify(['fueller', 'kugel', 'pinsel', 'bleistift', 'schutzleiter']),
    JSON.stringify(r.stifte));

  /* Den Leiterstift wählen und nachsehen, was in der Farbreihe steht. */
  const reihe = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knopf = werk.querySelector('[data-act="stil"]');
    for (let i = 0; i < 8 && knopf.dataset.stil !== 'leiter'; i++) knopf.click();
    /* NUR DIE SICHTBAREN. Die fünf festen Tupfer bleiben im Baum und
       werden ausgeblendet — sie tragen die gewählte Farbe in ihrer
       on-Klasse, und wer sie wegwürfe, müsste sie beim Zurückschalten neu
       erfinden. Ein Mensch sieht sie nicht, also zählt der Prüflauf sie
       auch nicht. */
    const tupfer = Array.from(werk.querySelectorAll('.blatt-farbe:not(.blatt-farbe-weg)'));
    return JSON.stringify({
      stil: knopf.dataset.stil,
      zahl: tupfer.length,
      titel: tupfer.map(t => t.getAttribute('title') || ''),
      namen: tupfer.map(t => t.getAttribute('aria-label') || ''),
      farben: tupfer.map(t => t.dataset.c || '')
    });
  })()`) as string);
  gleich('Der Stift lässt sich wählen', reihe.stil, 'leiter');
  p('Die Farbreihe zeigt die zehn Adern', reihe.zahl >= 10, String(reihe.zahl));
  p('… und der erste Tupfer ist der Schutzleiter',
    /Schutzleiter/.test(reihe.titel[0] || ''), reihe.titel[0]);

  console.log('\n§4 Jeder Tupfer sagt seinen Namen');
  p('Kein Tupfer heisst mehr bloss „Farbe"',
    reihe.titel.every((t: string) => t && t !== 'Farbe'), JSON.stringify(reihe.titel));
  p('… und jeder trägt einen Vorlesenamen (§38)',
    reihe.namen.every((t: string) => !!t), JSON.stringify(reihe.namen));
  p('Neutralleiter, L1, L2, L3, Lampendraht und die vier Korrespondierenden stehen da',
    ['Neutralleiter', 'L1', 'L2', 'L3', 'Lampendraht', 'Korrespondierende']
      .every(w => reihe.titel.some((t: string) => t.includes(w))),
    JSON.stringify(reihe.titel));

  /* Und die GEWÖHNLICHEN Farben, ohne Leiterstift. */
  const normal = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knopf = werk.querySelector('[data-act="stil"]');
    for (let i = 0; i < 8 && knopf.dataset.stil !== 'fueller'; i++) knopf.click();
    return JSON.stringify({ stil: knopf.dataset.stil,
      titel: Array.from(werk.querySelectorAll('.blatt-farbe:not(.blatt-farbe-weg)'))
        .map(t => t.getAttribute('title') || '') });
  })()`) as string);
  gleich('Zurück beim Füller', normal.stil, 'fueller');
  p('Auch die gewöhnlichen Farben heissen jetzt beim Namen',
    normal.titel.length >= 5 && normal.titel.slice(0, 5).every((t: string) => t && t !== 'Farbe'),
    JSON.stringify(normal.titel.slice(0, 5)));
  await s.close();
}

/* ═══ §5/§6 Wie sie aussehen ═══════════════════════════════════════════════ */
console.log('\n§5 Der Neutralleiter ist blau und gestrichelt');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const seite = Store.getBlock(App.aktuelleSeite());
    const blatt = Store.getBlock(seite.content[0]);
    Store.updateBlock(blatt.id, { marken: [
      { id: 'n', art: 'stift', stil: 'neutralleiter', farbe: '#1f6fd0', breite: 2.4,
        pts: [[60, 100], [400, 100]] },
      { id: 'pe', art: 'stift', stil: 'schutzleiter', farbe: '#158a3a', breite: 2.4,
        pts: [[60, 160], [400, 160]] }
    ] });
    App.zeichneSeite();
    return JSON.stringify({ gemalt: true });
  })()`) as string);
  p('Die zwei Leitungen sind gesetzt', r.gemalt);
  await s.waitForTimeout(700);
  const bild = JSON.parse(await s.evaluate(`(() => {
    const n = document.querySelector('[data-sid="n"]');
    const pe = document.querySelector('[data-sid="pe"]');
    const nPfad = n && n.tagName === 'g' ? n.querySelector('path') : n;
    return JSON.stringify({
      nDa: !!n, peDa: !!pe,
      nFarbe: nPfad ? nPfad.getAttribute('stroke') : '',
      nMuster: nPfad ? String(nPfad.getAttribute('stroke-dasharray') || '') : '',
      peGruppe: pe ? pe.tagName : '',
      peMuster: pe && pe.querySelectorAll('path').length > 1
        ? String(pe.querySelectorAll('path')[1].getAttribute('stroke-dasharray') || '') : ''
    });
  })()`) as string);
  p('Der Neutralleiter steht da', bild.nDa);
  p('… in Blau', /^#1f6fd0$/i.test(String(bild.nFarbe)) || /^rgb\\(31, 111, 208\\)$/.test(String(bild.nFarbe)),
    String(bild.nFarbe));
  const nZahlen = String(bild.nMuster).split(/[ ,]+/).filter(Boolean).map(Number);
  console.log('     Neutralleiter-Muster: ' + JSON.stringify(nZahlen));
  p('… und gestrichelt', nZahlen.length >= 2, JSON.stringify(nZahlen));
  p('… mit NUR Strichen, keinem Punkt — jeder Strich ist lang',
    nZahlen.length === 2 && nZahlen[0]! > 1, JSON.stringify(nZahlen));
  const peZahlen = String(bild.peMuster).split(/[ ,]+/).filter(Boolean).map(Number);
  console.log('     Schutzleiter-Muster: ' + JSON.stringify(peZahlen));
  p('Der Schutzleiter bleibt Strich UND Punkt (vier Zahlen)',
    peZahlen.length === 4, JSON.stringify(peZahlen));
  await s.close();
}

console.log('\n§6 Eine Ader wählen setzt Farbe und Strichart');
{
  const s = await mitBlatt();
  const r = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const knopf = werk.querySelector('[data-act="stil"]');
    for (let i = 0; i < 8 && knopf.dataset.stil !== 'leiter'; i++) knopf.click();
    const n = Array.from(werk.querySelectorAll('.blatt-farbe'))
      .find(t => (t.getAttribute('title') || '').includes('Neutralleiter'));
    n.click();
    const flaeche = document.querySelector('.blatt-marken');
    const k = flaeche.getBoundingClientRect();
    const ev = (typ, dx, buttons) => flaeche.dispatchEvent(new PointerEvent(typ,
      { bubbles: true, cancelable: true, clientX: k.left + 60 + dx, clientY: k.top + 300,
        pointerId: 9, pointerType: 'pen', isPrimary: true, button: 0, buttons, pressure: 0.6 }));
    ev('pointerdown', 0, 1);
    for (let i = 1; i <= 10; i++) ev('pointermove', i * 14, 1);
    ev('pointerup', 140, 0);
    const seite = Store.getBlock(App.aktuelleSeite());
    const blatt = Store.getBlock(seite.content[0]);
    const m = (blatt.marken || [])[blatt.marken.length - 1];
    return JSON.stringify({ da: !!m, farbe: m ? m.farbe : '', stil: m ? (m.stil || '') : '',
      leiter: m ? (m.leiter || '') : '' });
  })()`) as string);
  p('Ein Strich ist entstanden', r.da, JSON.stringify(r));
  gleich('… in der Farbe des Neutralleiters', String(r.farbe).toLowerCase(), '#1f6fd0');
  gleich('… mit seiner Strichart', r.stil, 'neutralleiter');
  gleich('… und er weiss, welche Ader er ist', r.leiter, 'n');
  await s.close();
}

/* ═══ §7 Die Reihe stimmt auch beim ÖFFNEN ════════════════════════════════ */
console.log('\n§7 Die Adernreihe steht schon beim Öffnen da');
{
  /* DER FUND DES BILDES (E509). §3 klickt sich zum Leiterstift durch und
     löst den Wechsel damit selbst aus — es prüfte also den Wechsel, nicht
     den Zustand. Wer Redion MIT dem Leiterstift schliesst und wieder
     aufmacht, klickt nichts, und die Reihe muss trotzdem stimmen. */
  const s = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  s.on('dialog', d => d.dismiss().catch(() => {}));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Marken !== 'undefined'");
  await s.evaluate(`(async () => {
    Store.setMeta('rundgangGesehen', true);
    document.querySelectorAll('.overlay').forEach(o => o.remove());
    Store.setMeta('zeichnen:stift', 'leiter');
    Store.setMeta('zeichnen:leiter', 'l1');
    const seite = Store.addPage(null, { text: 'Plan' });
    Store.addBlock(seite.id, 'blatt', { text: '', blattBreite: 595.28, blattHoehe: 841.89,
      raumVersion: 1, marken: [] });
    await Store.flush();
    App.oeffne(seite.id);
  })()`);
  await s.waitForSelector('.blatt-werk [data-wz="stift"]', { timeout: 15000 });
  await s.waitForTimeout(400);
  /* DEN STIFT WÄHLEN, sonst zeigt die Leiste die Farbgruppe gar nicht —
     sie erscheint nur zum passenden Werkzeug (E356). Das ist KEIN Klick
     auf den Stiftwechsel: der Leiterstift steht schon in `meta`. */
  await s.click('.blatt-werk [data-wz="stift"]');
  await s.waitForTimeout(500);
  const r = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const sichtbar = Array.from(werk.querySelectorAll('.blatt-farbe:not(.blatt-farbe-weg)'));
    return JSON.stringify({
      stil: werk.querySelector('[data-act="stil"]').dataset.stil,
      zahl: sichtbar.length,
      erste: sichtbar.map(t => t.getAttribute('title') || '').slice(0, 3),
      gewaehlt: sichtbar.filter(t => t.classList.contains('on'))
        .map(t => t.dataset.leiter || '')
    });
  })()`) as string);
  gleich('Der Leiterstift ist geführt, ohne dass jemand geklickt hat', r.stil, 'leiter');
  gleich('… und die Adernreihe steht da', r.zahl, 10);
  p('… mit dem Schutzleiter vorn', /Schutzleiter/.test(r.erste[0] || ''), JSON.stringify(r.erste));
  gleich('… und die zuletzt geführte Ader ist hervorgehoben', r.gewaehlt, ['l1']);

  /* UND SIE SIND WIRKLICH WEG, nicht nur mit einer Klasse versehen.
     Der Prüflauf fragte bis hierher `:not(.blatt-farbe-weg)` — das ist die
     KLASSE, und die stimmte, während die CSS-Regel dazu in einer kaputten
     Regel steckte und nichts tat. Auf dem Bild standen fünfzehn Tupfer.
     Ein Prüflauf, der die Absicht misst statt das Ergebnis, sieht so etwas
     nie (§55). Jetzt wird der Kasten gemessen. */
  const wirklich = JSON.parse(await s.evaluate(`(() => {
    const werk = document.querySelector('.blatt-werk');
    const alle = Array.from(werk.querySelectorAll('.blatt-farbe, .blatt-farbe-neu'));
    const sichtbar = alle.filter(t => {
      const k = t.getBoundingClientRect();
      return k.width > 0 && k.height > 0;
    });
    return JSON.stringify({
      alle: alle.length, sichtbar: sichtbar.length,
      istAder: sichtbar.every(t => t.classList.contains('blatt-farbe-leiter'))
    });
  })()`) as string);
  console.log(`     Tupfer im Baum: ${wirklich.alle} · davon sichtbar: ${wirklich.sichtbar}`);
  gleich('Sichtbar sind genau die zehn Adern', wirklich.sichtbar, 10);
  p('… und keine gewöhnliche Farbe steht daneben', wirklich.istAder);
  await s.close();
}

/* ═══ §8 Quellen ═══════════════════════════════════════════════════════════ */
console.log('\n§8 Quellen');
{
  const m = lies('src/bereiche/pdf/marken.ts');
  p('Der Katalog steht EINMAL da', /const LEITER = \[/.test(m)
    && (m.match(/'Korrespondierende 1'/g) || []).length === 1
    && (m.match(/const LEITER = \[/g) || []).length === 1);
  p('Der Schutzleiter des Katalogs und der Stift teilen ihre Farbe',
    /LEITER[\s\S]{0,4000}PE_GRUEN|PE_GRUEN[\s\S]{0,4000}LEITER/.test(m));
  p('Der Neutralleiter hat ein eigenes Muster', /N_MUSTER|neutralleiter/.test(m));
  p('Das erzeugte JS trägt es', /const LEITER = \[/.test(lies('quell/bereiche/pdf/marken.js')));
  p('Keine Seitenfehler', fehler.length === 0, fehler.join(' | '));
}

console.log(`\n${ok}/${ok + weg} bestanden · ✗=${weg}`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
