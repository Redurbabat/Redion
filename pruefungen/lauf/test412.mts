/* Suite 412 — Stil gehört in eine Stildatei (E418)
 * ============================================================================
 * Gefunden beim Nachzählen der Klassen, die der Code SETZT, gegen die Regeln
 * unter `quell/schale/stil/`: 69 ohne Regel. Fünfzehn davon hiessen
 * `produkt-onboarding-*` — die ganze Begrüssungsfläche. Das war kein Fehler
 * im Stil, sondern ein Fehler am Ort: 128 Zeilen CSS standen als Zeichenkette
 * in `produkt_onboarding.ts` und wurden bei Bedarf als `<style>` in die Seite
 * gehängt. §39 sagt dazu einen Satz: „Stil bleibt in Stil-Dateien unter
 * `quell/schale/stil/`. Keine grossen Inline-Style-Blöcke."
 *
 * Warum das mehr ist als Ordnung:
 *   · Die 128 Zeilen tragen Rückfallwerte wie `var(--border, #d9dce2)` —
 *     feste Hellwerte für den Fall, dass die Marke fehlt. Alle vier Marken
 *     GIBT es; die Rückfälle sind toter Text, der aussieht wie Vorsicht.
 *   · Ein Stilblock im Quelltext läuft nicht durch dieselben Prüfungen wie
 *     eine Stildatei — `test410` (fehlende Semikolon) liest Stildateien.
 *   · Und niemand findet die Regel, wenn er sie sucht.
 *
 *   §1 Kein Stilblock wird mehr in die laufende Seite gehängt.
 *   §2 Die Begrüssungsfläche steht trotzdem — in Hell UND in Dunkel.
 *   §3 Die Absage der KI sieht nicht aus wie eine Antwort.
 *   §4 Die Vorrat-Leiste holt ihr Aussehen aus ihrer Klasse.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `document.createElement('style')` irgendwo in `src/` wieder einbauen.
 *   §2 → die verschobenen Regeln aus `produktwelten.css` nehmen.
 *   §3 → die Regel `.msg-ohne-quelle` entfernen.
 *   §4 → die Klasse gegen `style.cssText` zurücktauschen.
 * Alle vier gelaufen, Ergebnisse im Bericht zu E418.
 *
 *   node pruefungen/lauf/test412.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9534;

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

/* ==========================================================================
 * §1 · KEIN STILBLOCK IM QUELLTEXT
 * --------------------------------------------------------------------------
 * Gesucht wird `createElement('style')` und NICHT jedes `<style>` überhaupt.
 * Der Unterschied ist der ganze Punkt: `werkzeuge.ts` schreibt drei
 * `<style>`-Blöcke, und alle drei stehen in AUSGELIEFERTEN HTML-Dokumenten —
 * Archiv, HTML-Export, Drucken. Die verlassen die App und haben keine
 * Stildatei bei sich; dort ist der Block richtig. Ein Wächter, der sie
 * mitmeldet, wird abgeschaltet.
 * ========================================================================*/
console.log('\n§1 Kein Stilblock wird in die laufende Seite gehängt');
const tsDateien: string[] = [];
const sammeln = (d: string): void => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const voll = path.join(d, e.name);
    if (e.isDirectory()) sammeln(voll);
    else if (e.name.endsWith('.ts')) tsDateien.push(voll);
  }
};
sammeln(path.join(WURZEL, 'src'));
const mitStil = tsDateien.filter(f =>
  /createElement\(\s*['"]style['"]\s*\)/.test(fs.readFileSync(f, 'utf8')));
p('Der Wächter sieht überhaupt Dateien', tsDateien.length > 100, String(tsDateien.length));
p('Keine .ts hängt einen Stilblock in die Seite',
  mitStil.length === 0, mitStil.map(f => path.relative(WURZEL, f)).join(' | '));
/* Und die verschobenen Regeln stehen wirklich in einer Stildatei. */
const pw = fs.readFileSync(path.join(WURZEL, 'quell/schale/stil/produktwelten.css'), 'utf8');
p('Die Regeln der Begrüssungsfläche stehen in produktwelten.css',
  pw.includes('.produkt-onboarding-lage') && pw.includes('.produkt-onboarding-welt'), '');
/* Die Rückfallwerte sind mit weg. Sie sahen aus wie Vorsicht und waren
   feste Hellwerte in einer Datei, die auch dunkel gelesen wird. */
p('Und ohne feste Rückfallfarben',
  !/var\(--(border|bg|text|text-faint|accent|bg-card|bg-hover)\s*,\s*#/.test(
    pw.slice(pw.indexOf('.produkt-onboarding-lage'))), '');

const browser = await chromium.launch();
const fehler: string[] = [];

/* ==========================================================================
 * §2 · DIE FLÄCHE STEHT — IN BEIDEN THEMEN
 * ========================================================================*/
console.log('\n§2 Die Begrüssungsfläche steht, hell wie dunkel');
const flaeche = async (thema: 'light' | 'dark') => {
  const s = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  s.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
  await s.goto(`http://localhost:${PORT}/index.html`);
  await s.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                          null, { timeout: 30000 });
  await s.evaluate(`document.documentElement.setAttribute('data-theme', ${JSON.stringify(thema)})`);
  await s.waitForTimeout(300);
  await s.evaluate(`(async () => {
    ProduktOnboarding.zuruecksetzen();
    ProduktOnboarding.oeffnen();
    await new Promise(f => setTimeout(f, 500));
  })()`);
  const mass = await s.evaluate(`(() => {
    const lage = document.querySelector('.produkt-onboarding-lage');
    const k = document.querySelector('.produkt-onboarding');
    if (!lage || !k) return { fehlt: !lage ? 'lage' : 'karte' };
    const sl = getComputedStyle(lage), sk = getComputedStyle(k);
    const r = k.getBoundingClientRect();
    return { lagePos: sl.position, lageGrund: sl.backgroundColor,
             kGrund: sk.backgroundColor, kText: sk.color,
             kRadius: sk.borderRadius, breite: Math.round(r.width),
             hoehe: Math.round(r.height), links: Math.round(r.left) };
  })()`) as any;
  await s.close();
  return mass;
};
const hell = await flaeche('light');
const dunkel = await flaeche('dark');
p('Die Fläche liegt fest über der Seite', hell.lagePos === 'fixed', JSON.stringify(hell));
p('Die Karte hat eine echte Grösse',
  hell.breite > 400 && hell.hoehe > 200, JSON.stringify(hell));
p('… und steht mittig', Math.abs(hell.links - (1280 - hell.breite) / 2) < 12,
  `${hell.links} px bei ${hell.breite} px Breite`);
p('Die Ecken sind rund — die Regeln greifen wirklich',
  /1[0-9]px/.test(String(hell.kRadius)), String(hell.kRadius));
/* DER PUNKT, DER DIE VERSCHIEBUNG PRÜFT. Vorher standen feste Hellwerte als
   Rückfall im Block. Wären die Marken beim Verschieben verlorengegangen,
   sähe Dunkel genauso aus wie Hell — und genau das misst diese Zeile. */
p('In Dunkel ist die Karte wirklich dunkel, nicht dieselbe wie in Hell',
  dunkel.kGrund !== hell.kGrund, `hell ${hell.kGrund} · dunkel ${dunkel.kGrund}`);
p('… und ihre Schrift auch nicht dieselbe',
  dunkel.kText !== hell.kText, `hell ${hell.kText} · dunkel ${dunkel.kText}`);

/* ==========================================================================
 * §3 · DIE ABSAGE SIEHT NICHT AUS WIE EINE ANTWORT
 * --------------------------------------------------------------------------
 * Der Nur-Quellen-Modus (E305) verspricht: findet sich nichts, wird das
 * Modell GAR NICHT gefragt. Die Absage bekam dafür die Klasse
 * `msg-ohne-quelle` — und es gab keine Regel dazu. Der Satz stand da wie
 * jede Antwort, in derselben Schrift, an derselben Stelle.
 * ========================================================================*/
console.log('\n§3 Die Absage der KI');
const s3 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s3.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s3.goto(`http://localhost:${PORT}/index.html`);
await s3.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                         null, { timeout: 30000 });
const absage = await s3.evaluate(`(() => {
  /* Zwei Nachrichten nebeneinander in dieselbe Umgebung hängen und
     vergleichen — nur so ist „sieht anders aus" überhaupt eine Aussage. */
  const halter = document.createElement('div');
  halter.id = 'chat';
  const normal = document.createElement('div');
  normal.className = 'msg a';
  normal.textContent = 'Eine ganz gewöhnliche Antwort.';
  const nein = document.createElement('div');
  nein.className = 'msg a msg-ohne-quelle';
  nein.textContent = 'Dazu finde ich nichts in deinen Unterlagen.';
  halter.append(normal, nein);
  document.body.appendChild(halter);
  const a = getComputedStyle(normal), b = getComputedStyle(nein);
  const vor = getComputedStyle(nein, '::before');
  const vorRand = vor.marginRight;
  return {
    farbeGleich: a.color === b.color,
    randLinks: b.borderLeftWidth + ' ' + b.borderLeftStyle,
    randFarbe: b.borderLeftColor,
    polsterGleich: a.paddingLeft === b.paddingLeft,
    zeichenVor: (vor.content || '').replace(/^"|"$/g, ''),
    zeichenRand: vorRand,
    text: nein.textContent
  };
})()`) as any;
p('Die Absage trägt einen Streifen an der Seite',
  /^[1-9]/.test(absage.randLinks) && !/none/.test(absage.randLinks), JSON.stringify(absage));
p('… und steht eingerückt, nicht bündig wie eine Antwort',
  absage.polsterGleich === false, JSON.stringify(absage));
/* §38: KEINE INFORMATION NUR ÜBER FARBE. Ein farbiger Streifen allein sagt
   einem Menschen, der Farben nicht unterscheidet, gar nichts. Deshalb steht
   ein Zeichen davor — und es muss wirklich da sein, nicht nur gemeint. */
p('Und es steht ein Zeichen davor, nicht nur eine Farbe (§38)',
  absage.zeichenVor.length > 0 && absage.zeichenVor !== 'none', JSON.stringify(absage.zeichenVor));
/* UND ES IST KEIN KOMBINIERENDES ZEICHEN. Der erste Wurf nahm `⃠` (U+20E0).
   Im Quelltext sieht es aus wie ein eigenes Zeichen; es ist eine
   KOMBINIERENDE Marke und legt sich über den folgenden Buchstaben. Auf dem
   Bild klebte sie am „D" von „Dazu", und ein Leerzeichen im `content` half
   nicht — eine kombinierende Marke sucht sich ihren Nachbarn selbst.
   Gefunden auf dem Bild (§55.1), gehalten von dieser Zeile. */
const kombinierend = [...absage.zeichenVor].some(z => {
  const c = z.codePointAt(0) ?? 0;
  return (c >= 0x0300 && c <= 0x036f) || (c >= 0x20d0 && c <= 0x20f0);
});
p('… und das Zeichen steht für sich, klebt nicht am nächsten Buchstaben',
  !kombinierend, JSON.stringify(absage.zeichenVor));
p('Der Abstand kommt aus dem Stil, nicht aus einem Leerzeichen im Text',
  !/\s$/.test(absage.zeichenVor), JSON.stringify(absage.zeichenVor));
p('… sondern aus einem echten Rand daneben',
  /^[1-9]/.test(String(absage.zeichenRand)), String(absage.zeichenRand));
p('Der Text selbst bleibt unverändert',
  /Dazu finde ich nichts/.test(absage.text), absage.text);

/* ==========================================================================
 * §4 · DIE VORRAT-LEISTE
 * ========================================================================*/
console.log('\n§4 Die Vorrat-Leiste holt ihr Aussehen aus der Klasse');
const vorrat = await s3.evaluate(`(() => {
  const d = document.createElement('div');
  d.className = 'vorrat-leiste';
  d.innerHTML = '<span>Probe</span>';
  document.body.appendChild(d);
  const st = getComputedStyle(d);
  return { anzeige: st.display, luecke: st.gap, polster: st.padding,
           radius: st.borderRadius, grund: st.backgroundColor,
           eigenerStil: d.getAttribute('style') || '' };
})()`) as any;
p('Sie ist eine Reihe', vorrat.anzeige === 'flex', JSON.stringify(vorrat));
p('… mit Abstand, Polster und runden Ecken',
  vorrat.luecke !== 'normal' && vorrat.polster !== '0px' && vorrat.radius !== '0px',
  JSON.stringify(vorrat));
p('Und ohne eigenen style="…" am Element',
  vorrat.eigenerStil === '', JSON.stringify(vorrat.eigenerStil));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' | '));

console.log(`\n${ok} von ${ok + weg} Prüfungen grün`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
