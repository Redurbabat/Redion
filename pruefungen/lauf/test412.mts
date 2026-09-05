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
 *   §2 Die Begrüssungsfläche ist fort — und jeder Weg dorthin (E434).
 *   §3 Die Absage der KI sieht nicht aus wie eine Antwort.
 *   §4 Die Vorrat-Leiste holt ihr Aussehen aus ihrer Klasse.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 *   §1 → `document.createElement('style')` irgendwo in `src/` wieder einbauen.
 *   §2 → das Modul wieder einhängen, oder den Streifen zurückholen.
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
/* HIER STANDEN ZWEI PUNKTE UEBER DIE VERSCHOBENEN REGELN (E418): dass sie
   in `produktwelten.css` stehen, und dass sie keine festen Rueckfallfarben
   mehr tragen. Mit E434 ist die Flaeche fort und die Regeln mit ihr — die
   Punkte haetten keinen Gegenstand mehr.
   DIE FRAGE BLEIBT, nur ohne diesen einen Fall: keine Stildatei soll feste
   Hellwerte als Rueckfall hinter einer Marke tragen. Das galt fuer die
   Begruessungsflaeche und gilt fuer jede andere Datei genauso, und so
   gemessen ist es der staerkere Punkt. */
const stilOrdner = path.join(WURZEL, 'quell/schale/stil');
const stilDateien = fs.readdirSync(stilOrdner).filter(f => f.endsWith('.css'));
const mitRueckfall: string[] = [];
for (const datei of stilDateien) {
  const text = fs.readFileSync(path.join(stilOrdner, datei), 'utf8');
  /* Nur echte Regeln, keine Kommentare — ein Beispiel in einer Erklaerung
     ist kein Rueckfall. Das ist die test361-Lehre von heute Morgen. */
  const ohneWorte = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const treffer = ohneWorte.match(
    /var\(--(border|bg|text|text-faint|accent|bg-card|bg-hover)\s*,\s*#[0-9a-fA-F]{3,8}\)/g);
  if (treffer) mitRueckfall.push(datei + ': ' + treffer.slice(0, 3).join(', '));
}
p('Der Waechter sieht ueberhaupt Stildateien', stilDateien.length > 5,
  String(stilDateien.length));
p('Keine Stildatei traegt feste Hellwerte als Rueckfall hinter einer Marke',
  mitRueckfall.length === 0, mitRueckfall.slice(0, 3).join(' | '));
/* Und die Flaeche selbst hinterlaesst keine Regeln ohne Elemente. */
const pw = fs.readFileSync(path.join(stilOrdner, 'produktwelten.css'), 'utf8');
p('Keine Regel der entfernten Begruessungsflaeche steht noch im Stil',
  !/^\s*\.produkt-onboarding/m.test(pw.replace(/\/\*[\s\S]*?\*\//g, '')), '');

const browser = await chromium.launch();
const fehler: string[] = [];

/* ==========================================================================
 * §2 · DIE BEGRÜSSUNGSFLÄCHE IST FORT — UND JEDER WEG DORTHIN (E434)
 * --------------------------------------------------------------------------
 * Hier stand bis zum 6. September das Gegenteil: „Die Fläche steht — in Hell
 * UND in Dunkel", sechs Punkte über Position, Grösse, Rundung und die beiden
 * Themen. Sie prüften richtig, was E418 gebaut hatte.
 *
 * Redur hat die Fläche dann weggenommen. Sie bot an, zwischen zwei
 * Hauptwelten zu wählen — „Lernen" und „Workspace" —, und den Workspace
 * löst er gerade auf: seine Abschnitte werden einzelne Orte (E435). Eine
 * Wahl zwischen zwei Dingen, von denen eines verschwindet, ist keine Frage,
 * sondern eine Verzögerung.
 *
 * DIE PUNKTE BLEIBEN, NUR ANDERSHERUM. Eine Fläche, die weg soll, kommt
 * zurück, wenn niemand hinsieht: ein Streifen hier, ein Palettenbefehl dort,
 * eine Datei, die noch im Dienststock steht. Deshalb wird JEDER Weg geprüft
 * und nicht nur die Fläche.
 * ========================================================================*/
console.log('\n§2 Die Begrüssungsfläche ist fort — und jeder Weg dorthin');

const s2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
s2.on('pageerror', e => fehler.push(e.message.slice(0, 140)));
await s2.goto(`http://localhost:${PORT}/index.html`);
await s2.waitForFunction("typeof App !== 'undefined' && typeof Store !== 'undefined'",
                         null, { timeout: 30000 });
await s2.waitForTimeout(900);

const fort = JSON.parse(await s2.evaluate(`JSON.stringify({
  /* 1. Das Modul selbst. */
  modul: typeof window.ProduktOnboarding,
  /* 2. Die Fläche, auch ungefragt beim Start. */
  lage: document.querySelectorAll('.produkt-onboarding-lage').length,
  karte: document.querySelectorAll('.produkt-onboarding').length,
  /* 3. Der Streifen auf dem Heute-Bild. Er kam nur fuer ein Profil mit
        Status "neu" — und genau das ist ein frischer Bestand hier. */
  streifen: document.querySelectorAll('.lw-setup').length,
  /* 4. Und der Griff, an dem er hing. */
  griff: document.querySelectorAll('[data-lw-action="setup"]').length
})`) as string);
p('Das Modul ProduktOnboarding gibt es nicht mehr', fort.modul === 'undefined',
  String(fort.modul));
p('Beim Start liegt keine Begrüssungsfläche über der Seite',
  fort.lage === 0 && fort.karte === 0, JSON.stringify(fort));

/* Das Heute-Bild ausdrücklich aufmachen — der Streifen stand dort, nicht
   auf dem Startbildschirm. */
await s2.evaluate(`(async () => {
  Produktwelten.lernen('heute');
  await new Promise(f => setTimeout(f, 900));
})()`);
const heute = JSON.parse(await s2.evaluate(`JSON.stringify({
  streifen: document.querySelectorAll('.lw-setup').length,
  griff: document.querySelectorAll('[data-lw-action="setup"]').length,
  text: (document.querySelector('.lw-today') || document.body)
          .textContent.replace(/\\s+/g, ' ').slice(0, 400)
})`) as string);
p('Auf dem Heute-Bild steht kein Einrichten-Streifen mehr',
  heute.streifen === 0 && heute.griff === 0, JSON.stringify(heute).slice(0, 200));
p('… und auch der Text „Redion einrichten" nicht',
  !/Redion einrichten/.test(heute.text), heute.text.slice(0, 200));

/* Und kein Befehl in der Palette führt noch dorthin.
   DIE PALETTE WIRD WIRKLICH AUFGEMACHT, nicht das Register befragt. Der
   erste Wurf las `Register.befehle` und war gruen, ohne etwas zu pruefen:
   die Zeile stand in `befehle()` in `werkzeuge.ts`, einer eigenen Liste,
   die die Palette VOR das Register haengt. Ein Punkt, der am falschen Ort
   nachsieht, meldet Ordnung, wo keine ist (§55.2) — derselbe Fehler wie in
   test423 §4 zwei Tage vorher. */
await s2.evaluate(`(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  Werkzeuge.palette();
  await new Promise(f => setTimeout(f, 500));
})()`);
const befehle = JSON.parse(await s2.evaluate(`JSON.stringify((() => {
  const feld = document.querySelector('#cq');
  const zeilen = [...document.querySelectorAll('#cr *')]
    .map(e => e.textContent || '').filter(Boolean);
  return { feldDa: !!feld,
           treffer: zeilen.filter(t => /Hauptwelt|einrichten/i.test(t))
                          .map(t => t.replace(/\s+/g, ' ').trim().slice(0, 60)),
           anzahl: zeilen.length };
})())`) as string);
p('Die Palette geht auf und zeigt Befehle', befehle.feldDa === true && befehle.anzahl > 5,
  JSON.stringify(befehle.anzahl));
p('Kein Befehl verspricht noch „Hauptwelten einrichten"',
  befehle.treffer.length === 0, JSON.stringify(befehle.treffer));

/* UND DER ERSATZ TUT WIRKLICH ETWAS. An die Stelle des entfernten Befehls
   kam „Lebensbereiche dieser Seite" — und der Dialog dahinter kehrt ohne
   Objekt sofort um. Ein Ersatz, der nur einen Hinweis wirft, waere derselbe
   Knopf ohne Draht, den E410 und E417 gekostet haben.
   Geprueft wird BEIDES: mit offener Seite geht der Dialog auf, ohne offene
   Seite kommt ein ehrlicher Satz statt eines falschen. */
const ersatz = JSON.parse(await s2.evaluate(`(async () => {
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  const seite = Store.addPage(null, { text: 'Bereichsprobe' });
  await Store.flush();
  App.oeffne(seite.id);
  await new Promise(f => setTimeout(f, 500));
  Werkzeuge.palette();
  await new Promise(f => setTimeout(f, 400));
  const zeile = [...document.querySelectorAll('#cr *')]
    .find(e => /Lebensbereiche dieser Seite/.test(e.textContent || ''));
  const gefunden = !!zeile;
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  /* Den Weg nehmen, den der Befehl nimmt — nicht den Klick nachbauen. */
  Produktwelten.bereicheDialog(Store.getBlock(seite.id));
  await new Promise(f => setTimeout(f, 600));
  const auf = !!document.querySelector('.produkt-bereiche-dialog');
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  return JSON.stringify({ gefunden, auf });
})()`) as string);
p('Der Ersatzbefehl „Lebensbereiche dieser Seite" steht in der Palette',
  ersatz.gefunden === true, JSON.stringify(ersatz));
p('… und sein Dialog geht mit einer Seite wirklich auf',
  ersatz.auf === true, JSON.stringify(ersatz));
await s2.close();

/* Und die Datei ist wirklich weg, nicht nur unerreichbar. Eine Datei, die
   im Dienststock steht und nicht existiert, bricht die Offline-Fassung. */
p('Die Quelldatei gibt es nicht mehr',
  !fs.existsSync(path.join(WURZEL, 'src/bereiche/wissen/produkt_onboarding.ts')) &&
  !fs.existsSync(path.join(WURZEL, 'quell/bereiche/wissen/produkt_onboarding.js')));
const indexHtml = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');
const dienst = fs.readFileSync(path.join(WURZEL, 'src/dienst/sw.ts'), 'utf8');
p('index.html lädt sie nicht mehr', !indexHtml.includes('produkt_onboarding'));
p('Und der Dienststock führt sie nicht mehr', !dienst.includes('produkt_onboarding'));

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
