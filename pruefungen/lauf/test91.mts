/* Suite 56 — Der Säuberer ist aufgehängt (A5, erster Teil)
 * ----------------------------------------------------------------------------
 * `quell/kern/sicherheit/saeubern.js` war 162 Zeilen lang, über test85 mit 13
 * Prüfungen belegt — und wurde **von keiner Stelle der App aufgerufen**. Ein
 * Sicherheitsnetz, das niemand aufgehängt hat.
 *
 * Beim Aufhängen kamen zwei Löcher heraus, die vorher niemand gesucht hatte.
 * Beide sind hier nachgestellt, beide wurden im Browser bestätigt, bevor eine
 * Zeile geändert wurde.
 *
 * ─── 1. EIN LOSGELÖSTES ELEMENT SCHÜTZT NICHT ───────────────────────────────
 *
 *     const d = document.createElement('div');       // nie angehängt
 *     d.innerHTML = html_aus_einer_fremden_mail;     // ← hier
 *     return d.textContent;
 *
 * Das stand zweimal in `verbinden/mail.js` — einmal für den Weg über Gmail,
 * einmal für den über die Brücke. Die Absicht ist harmlos: das Markup einer
 * Mail wegwerfen und nur den Text behalten. Nur feuert `<img src=x
 * onerror=…>` beim Zuweisen, **auch wenn das Element nie in der Seite
 * landet**. Nachgemessen:
 *
 *     div.innerHTML       → Handler läuft
 *     template.innerHTML  → nichts
 *     DOMParser           → nichts
 *
 * `Sanitize.textOnly` benutzt ein `<template>`. Genau deshalb.
 *
 * ─── 2. „IST DAS EIN PDF?" ENTSCHEIDET DIE ENDUNG ───────────────────────────
 *
 *     const istPdf = /\.pdf(\?|$)/i.test(block.src) || …
 *     if (istPdf && block.pdfAuf) { … f.src = block.src; … }
 *
 * `javascript:alert(1)//.pdf` besteht diese Prüfung: die zwei Schrägstriche
 * sind in JavaScript ein Kommentar, der Rest der Adresse blosse Zierde. Und
 * ein `<iframe src="javascript:…">` läuft **im Ursprung der Seite** — im
 * Versuch war aus dem Rahmen heraus `parent` erreichbar, also alle Notizen und
 * der KI-Schlüssel.
 *
 * ─── WARUM DIE PRÜFUNG BEIM ZEICHNEN SITZT UND NICHT AM EINGANG ─────────────
 *
 * `AUFGABEN.md` schlug vor, den Säuberer an die drei Eingänge zu hängen:
 * Import, Clipper, Schnittstelle. Nachgesehen sind es aber mehr — `bookmark`-
 * und `file`-Blöcke entstehen ausserdem beim Abgleich mit dem Server, beim
 * Einlesen einer Redion-Datei und über `/v1/`. Eine Prüfung pro Eingang hätte
 * man vier Mal schreiben und beim fünften vergessen müssen. Beim Zeichnen gibt
 * es dagegen genau sechs Stellen, an denen eine Adresse ins Dokument kommt,
 * und die decken alle Eingänge zugleich ab — auch die, die es noch nicht gibt.
 *
 * ─── WAS DABEI NICHT PASSIEREN DARF ─────────────────────────────────────────
 *
 * Nichts wegwerfen. Eine gesperrte Adresse bleibt sichtbar und sagt, warum sie
 * nicht anklickbar ist. Ein Anhang, der einfach verschwände, wäre schlimmer als
 * einer, der sich erklärt — und `data:application/pdf` muss weiter
 * funktionieren, sonst ist jeder Anhang der App kaputt.
 *
 *   node pruefungen/lauf/test91.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies, existsSync as _da } from 'node:fs';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');
const PORT = 8798;

let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

const TYP: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8', '.json': 'application/json',
              '.webmanifest': 'application/manifest+json', '.png': 'image/png',
              '.ico': 'image/x-icon' };

const server = createServer((a: IncomingMessage, b: ServerResponse) => {
  const rein = decodeURIComponent((a.url ?? '/').split('?')[0] ?? '/');
  const pfad = _dazu(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!pfad.startsWith(WURZEL) || !_da(pfad)) { b.writeHead(404); b.end(); return; }
  b.writeHead(200, { 'Content-Type': TYP[pfad.slice(pfad.lastIndexOf('.'))] || 'application/octet-stream' });
  b.end(_lies(pfad));
});
await new Promise<void>(f => { server.listen(PORT, () => f()); });

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: any[] = [];
seite.on('pageerror', e => fehler.push(e.message));

await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(() => typeof App !== 'undefined' && typeof Sanitize !== 'undefined',
                            null, { timeout: 20000 });

/* ========================================================================= *
 * 1 · DIE ZWEI NEUEN REGELN, DIREKT GEFRAGT
 * ========================================================================= */
console.log('\n1 · anhangAdresse und rahmenAdresse');

const anhang = (u: any) => seite.evaluate(x => Sanitize.attachmentUrl(x), u);
const rahmen = (u: any) => seite.evaluate(x => Sanitize.frameUrl(x), u);

gleich('javascript: kommt nicht in einen Link', await anhang('javascript:alert(1)'), '');
gleich('… auch nicht mit angehängter Endung',
  await anhang('javascript:alert(1)//.pdf'), '');
gleich('… auch nicht mit Zeilenumbruch im Schema',
  await anhang('java\nscript:alert(1)'), '');
gleich('… auch nicht mit Leerzeichen im Schema',
  await anhang('java script:alert(1)'), '');
gleich('vbscript: auch nicht', await anhang('vbscript:msgbox'), '');
gleich('data:text/html auch nicht', await anhang('data:text/html,<script>x</script>'), '');
gleich('data:image/svg+xml auch nicht — SVG kann Code tragen',
  await anhang('data:image/svg+xml,<svg onload="x">'), '');

/* Und jetzt das Gegenstück: was durchkommen MUSS. Eine Sicherheitsprüfung,
   die alles sperrt, ist keine Prüfung, sondern ein kaputtes Programm. */
gleich('Eine gewöhnliche Web-Adresse kommt durch',
  await anhang('https://beispiel.ch/datei.pdf'), 'https://beispiel.ch/datei.pdf');
p('Ein PDF-Anhang als data: kommt durch — sonst ist jeder Anhang kaputt',
  (await anhang('data:application/pdf;base64,JVBERi0=')).startsWith('data:application/pdf'));
p('Auch ein ZIP-Anhang kommt durch',
  (await anhang('data:application/zip;base64,UEsDBA==')).startsWith('data:application/zip'));
p('Auch eine CSV kommt durch',
  (await anhang('data:text/csv;base64,YSxi')).startsWith('data:text/csv'));

/* DIESE VIER STANDEN NICHT VON ANFANG AN HIER, und sie sind der Grund, warum
   die erste Fassung von `anhangAdresse` falsch war. Sie suchte nach dem Wort
   „javascript" statt nach dem Schema — und sperrte damit jede Datei, deren
   NAME so anfängt. Eine Sicherheitsprüfung, die Anhänge verschluckt, tauscht
   einen seltenen Angriff gegen einen täglichen Datenverlust. */
gleich('Eine Datei namens javascriptbuch.pdf ist kein Angriff',
  await anhang('javascriptbuch.pdf'), 'javascriptbuch.pdf');
gleich('… und filezilla-handbuch.pdf auch nicht',
  await anhang('filezilla-handbuch.pdf'), 'filezilla-handbuch.pdf');
gleich('… und about-uns.html auch nicht',
  await anhang('about-uns.html'), 'about-uns.html');
gleich('Ein Pfad ohne Schema bleibt, wie er ist',
  await anhang('../ordner/bericht.pdf'), '../ordner/bericht.pdf');
gleich('mailto: bleibt — das ist ein Verweis, kein Code',
  await anhang('mailto:x@beispiel.ch'), 'mailto:x@beispiel.ch');

/* DER FALL, DER NUR IM ZUSAMMENSPIEL AUFGEHT und deshalb hier festgehalten
   wird: `&#106;avascript:x` ist HTML-kodiert. `anhangAdresse` lässt ihn durch
   — dort ist er kein Schema, sondern ein gewöhnlicher Text. Sicher wird er
   erst dadurch, dass `esc` das `&` ersetzt: der Browser sieht
   `&amp;#106;avascript:` und damit kein Schema, sondern einen relativen Pfad.
   Wer eines Tages das `&` aus einem `esc` nimmt, öffnet also nicht nur ein
   Loch, sondern auch dieses hier. Der Nachweis steht deshalb im Dokument und
   nicht bei der Funktion. */
await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Kodiert' });
  Store.addBlock(s.id, 'bookmark', { src: '&#106;avascript:parent.__geerbt3=1', text: 'Kodiert' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(500);
p('Ein HTML-kodiertes javascript: wird kein ausführbarer Verweis',
  await seite.evaluate(() => {
    const a = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
      .find(x => /avascript/i.test(x.getAttribute('href') || ''));
    /* Der Browser hat den Wert geparst — steht dort ein Schema oder nicht? */
    return !a || !/^javascript:/i.test(a.href);
  }));

console.log('');
gleich('In einen Rahmen kommt kein javascript:',
  await rahmen('javascript:alert(1)//.pdf'), '');
gleich('In einen Rahmen kommt kein data:text/html',
  await rahmen('data:text/html,<script>x</script>'), '');
gleich('In einen Rahmen kommt auch kein data:image/svg+xml',
  await rahmen('data:image/svg+xml,<svg onload="x">'), '');
gleich('Aber https schon',
  await rahmen('https://www.youtube.com/embed/x'), 'https://www.youtube.com/embed/x');
p('Und ein PDF als data: — dafür ist die Vorschau da',
  (await rahmen('data:application/pdf;base64,JVBERi0=')).startsWith('data:application/pdf'));

/* ========================================================================= *
 * 2 · EIN ANHANG MIT EINER ADRESSE, DIE CODE IST
 * ========================================================================= */
console.log('\n2 · Ein file-Block mit javascript:…//.pdf');

/* DIE NUTZLAST SCHREIBT AUF `parent`, NICHT AUF `window`, und das ist keine
   Kleinigkeit. Im ersten Versuch stand hier `window.__geerbt=1`. Im Rahmen
   ausgeführt ist `window` aber der Rahmen selbst — der Code lief, schrieb in
   das falsche Fenster, und die Prüfung „nichts ist gelaufen" blieb auch mit
   zurückgedrehter Reparatur grün. Sie mass nichts.
   `parent` ist aus dem Rahmen heraus das Fenster der App — und im Fenster
   selbst (für den `javascript:`-Link) ist `parent` es auch. Eine Nutzlast,
   die an beiden Orten ankommt. */
const NUTZLAST = 'javascript:parent.__geerbt=1';

await seite.evaluate((n) => {
  (window as any).__geerbt = undefined;
  const s = Store.addPage(null, { text: 'Anhangseite' });
  Store.addBlock(s.id, 'file', { src: n + '//.pdf', text: 'Rechnung.pdf', pdfAuf: true });
  App.oeffne(s.id);
}, NUTZLAST);
await seite.waitForTimeout(700);

p('Kein iframe mit dieser Adresse im Dokument',
  await seite.evaluate(() => ![...document.querySelectorAll('iframe')]
    .some(f => /javascript:/i.test(f.getAttribute('src') || ''))));
p('Kein Link mit dieser Adresse im Dokument',
  await seite.evaluate(() => ![...document.querySelectorAll('a[href]')]
    .some(a => /javascript:/i.test(a.getAttribute('href') || ''))));

/* Draufklicken, falls doch einer dasteht — ein javascript:-Link tut nichts,
   bevor jemand ihn anfasst. Ohne den Klick wäre der Nachweis unvollständig. */
await seite.evaluate(() => {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="javascript:"]').forEach(a => {
    a.removeAttribute('target');            /* sonst öffnet er einen Reiter */
    a.click();
  });
});
await seite.waitForTimeout(500);
p('Nichts davon ist gelaufen — auch nach einem Klick',
  await seite.evaluate(() => (window as any).__geerbt) === undefined);

/* Nichts wegwerfen: der Name muss weiter dastehen. */
p('Der Dateiname steht trotzdem auf der Seite',
  await seite.evaluate(() => (document.getElementById('page')?.textContent || '')
    .includes('Rechnung.pdf')));
p('Und er sagt, dass er gesperrt ist',
  await seite.evaluate(() => !!document.querySelector('.datei-gesperrt[title]')));

console.log('\n   Und ein echter Anhang funktioniert weiter:');
await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Echter Anhang' });
  Store.addBlock(s.id, 'file',
    { src: 'data:application/pdf;base64,JVBERi0xLjQK', text: 'Echt.pdf', pdfAuf: true });
  App.oeffne(s.id);
});
await seite.waitForTimeout(600);
p('Ein echtes PDF bekommt seinen Link',
  await seite.evaluate(() => [...document.querySelectorAll('a[href]')]
    .some(a => (a.getAttribute('href') || '').startsWith('data:application/pdf'))));
p('Ein echtes PDF bekommt seine Vorschau',
  await seite.evaluate(() => [...document.querySelectorAll('iframe')]
    .some(f => (f.getAttribute('src') || '').startsWith('data:application/pdf'))));

/* ========================================================================= *
 * 3 · LESEZEICHEN UND EINBETTUNG
 * ========================================================================= */
console.log('\n3 · bookmark und embed');

await seite.evaluate((n) => {
  (window as any).__geerbt2 = undefined;
  const s = Store.addPage(null, { text: 'Verweise' });
  Store.addBlock(s.id, 'bookmark', { src: n, text: 'Klick mich' });
  Store.addBlock(s.id, 'embed', { src: n, text: 'Rahmen' });
  App.oeffne(s.id);
}, NUTZLAST.replace('__geerbt', '__geerbt2'));
await seite.waitForTimeout(700);

p('Das Lesezeichen ist kein Link mehr',
  await seite.evaluate(() => ![...document.querySelectorAll('a[href]')]
    .some(a => /javascript:/i.test(a.getAttribute('href') || ''))));
p('Die Einbettung hat keinen Rahmen bekommen',
  await seite.evaluate(() => ![...document.querySelectorAll('iframe')]
    .some(f => /javascript:/i.test(f.getAttribute('src') || ''))));

await seite.evaluate(() => {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="javascript:"]').forEach(a => {
    a.removeAttribute('target'); a.click();
  });
});
await seite.waitForTimeout(500);
p('Nichts davon ist gelaufen — auch nach einem Klick',
  await seite.evaluate(() => (window as any).__geerbt2) === undefined);
p('Die Adresse bleibt trotzdem lesbar — nichts wird weggeworfen',
  await seite.evaluate(() => (document.getElementById('page')?.textContent || '')
    .includes('parent.__geerbt2=1')));
p('Die Einbettung sagt, warum sie zu ist',
  await seite.evaluate(() => !!document.querySelector('.einbett-gesperrt')));

await seite.evaluate(() => {
  const s = Store.addPage(null, { text: 'Echte Einbettung' });
  Store.addBlock(s.id, 'embed', { src: 'https://www.youtube.com/embed/abc' });
  App.oeffne(s.id);
});
await seite.waitForTimeout(500);
p('Eine echte Einbettung bekommt weiterhin ihren Rahmen',
  await seite.evaluate(() => [...document.querySelectorAll('iframe')]
    .some(f => (f.getAttribute('src') || '').includes('youtube.com/embed'))));

/* ========================================================================= *
 * 4 · MAIL-HTML — DAS LOSGELÖSTE ELEMENT
 * ========================================================================= */
console.log('\n4 · HTML aus einer Mail');

const mailErgebnis = await seite.evaluate(async () => {
  (window as any).__mail = [];
  /* ECHTER FEHLER, vom Umzug hereingetragen: in dieser Nutzlast stand
     `(window as any).__mail…`. Das ist HTML für den Browser — `as` ist dort
     ein Syntaxfehler, der Handler konnte nie feuern. */
  const giftig = '<p>Hallo</p><img src="x-gibt-es-nicht" ' +
                 'onerror="window.__mail.push(\'gelaufen\')">' +
                 '<style>p{color:red}</style><script>window.__mail.push("skript")<\/script>' +
                 '<p>Tschüss</p>';
  const text = Sanitize.textOnly(giftig);
  await new Promise(f => setTimeout(f, 700));
  return { text, gelaufen: (window as any).__mail };
});

gleich('Kein Handler aus der Mail ist gelaufen', mailErgebnis.gelaufen, []);
p('Der Text der Mail bleibt vollständig',
  mailErgebnis.text.includes('Hallo') && mailErgebnis.text.includes('Tschüss'),
  JSON.stringify(mailErgebnis.text));
p('Das CSS aus <style> landet nicht als Text in der Notiz',
  !mailErgebnis.text.includes('color:red'), JSON.stringify(mailErgebnis.text));

/* Die Gegenprobe im selben Lauf: dass das alte Muster wirklich feuert.
   Ohne sie wäre nicht bewiesen, dass hier überhaupt etwas gemessen wird —
   ein Handler, der nie feuern kann, macht jede Prüfung darüber wertlos. */
const gegenprobe = await seite.evaluate(async () => {
  (window as any).__alt = [];
  const d = document.createElement('div');            /* das alte Muster */
  d.innerHTML = '<img src="x-gibt-es-nicht" onerror="window.__alt.push(1)">';
  await new Promise(f => setTimeout(f, 700));
  return (window as any).__alt.length;
});
p('Gegenprobe: mit dem alten Muster wäre der Handler gelaufen',
  gegenprobe === 1, 'gelaufen: ' + gegenprobe);

/* ========================================================================= *
 * 5 · DER QUELLTEXT — WO DER SÄUBERER JETZT HÄNGT
 * ========================================================================= */
console.log('\n5 · Aufgehängt, nicht nur vorhanden');

const quellen = {
  editor: _lies(_dazu(WURZEL, 'quell/bereiche/editor/ansicht/editor.js'), 'utf8'),
  mail: _lies(_dazu(WURZEL, 'quell/bereiche/verbinden/mail.js'), 'utf8'),
  werkzeuge: _lies(_dazu(WURZEL, 'quell/bereiche/wissen/werkzeuge.js'), 'utf8')
};

p('editor.js ruft Sanitize', /Sanitize\.(attachmentUrl|frameUrl)/.test(quellen.editor));
p('mail.js ruft Sanitize.textOnly', /Sanitize\.textOnly/.test(quellen.mail));
p('werkzeuge.js prüft die Bildadresse', /Sanitize\.url/.test(quellen.werkzeuge));

/* Und das alte Muster darf nirgends mehr stehen: ein losgelöstes div, dem
   fremdes HTML zugewiesen wird. */
const altesMuster = /createElement\('div'\);?\s*\n?\s*\w+\.innerHTML\s*=\s*(inhalt|entpacke)/;
p('Kein `div.innerHTML = <fremdes HTML>` mehr in mail.js',
  !altesMuster.test(quellen.mail));

/* ========================================================================= *
 * 6 · DIE POSITIVLISTE GEGEN EINE SAMMLUNG VON ANGRIFFEN
 * ---------------------------------------------------------------------------
 * Die Abschnitte davor prüfen, dass der Säuberer an der richtigen Stelle
 * hängt. Hier geht es um ihn selbst: hält die Positivliste, was sie
 * verspricht — und lässt sie dabei gewöhnliches HTML in Ruhe?
 *
 * Beides gehört zusammen. Ein Säuberer, der alles wegwirft, ist sicher und
 * unbrauchbar; der teurere Fehler ist nicht der durchgelassene Angriff,
 * sondern der Absatz, der beim Import verschwindet. Deshalb stehen hier
 * beide Sorten Eingaben.
 *
 * Entstanden beim Umzug nach `core/security/sanitize.ts`: dort wurden alte
 * und neue Fassung über diese Liste geschickt und Zeichen für Zeichen
 * verglichen. Der Vergleich ist mit der alten Fassung vergangen — die Liste
 * bleibt, weil sie das eigentlich Wertvolle daran war.
 * ========================================================================= */
console.log('\n6 · Die Positivliste gegen eine Sammlung von Angriffen');

const angriffe = await seite.evaluate(() => {
  const BOESE = [
    '<script>alert(1)</script>',
    '<p>vor</p><script>alert(1)</script><p>nach</p>',
    '<img src=x onerror="alert(1)">',
    '<img src="x" ONERROR="alert(1)">',
    '<div onclick="alert(1)">klick</div>',
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="java\nscript:alert(1)">x</a>',
    '<a href="  javascript:alert(1)">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<a href="file:///etc/passwd">x</a>',
    '<a href="about:blank">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<object data="x"></object><embed src="y">',
    '<form action="x"><input name="a"></form>',
    '<button formaction="javascript:alert(1)">x</button>',
    '<svg><script>alert(1)</script></svg>',
    '<svg onload="alert(1)"></svg>',
    '<style>body{display:none}</style>',
    '<link rel="stylesheet" href="x.css">',
    '<meta http-equiv="refresh" content="0;url=x">',
    '<base href="https://boese.example/">',
    '<p style="background:url(javascript:alert(1))">x</p>',
    '<p style="width:expression(alert(1))">x</p>',
    '<a xlink:href="javascript:alert(1)">x</a>',
    '<template><p>versteckt</p></template>',
    '<frameset><frame src="x"></frameset>',
    '<applet code="x"></applet>'
  ];

  /* Gefährlich ist, was AUSGEFÜHRT wird. `javascript:` als blosser Text in
     einem <p> sind Buchstaben auf dem Bildschirm — deshalb steht im Ausdruck
     ein `=` davor: nur im Attribut zählt es. */
  const GEFAEHRLICH =
    /<script|<iframe|<object|<embed|<style|<link|<meta|<base|<svg|<form|<applet|<frame|\son\w+\s*=|=\s*["']?\s*(javascript|vbscript|file|about):|srcdoc=|formaction=|xlink:href=/i;

  const durch = [];
  for (const b of BOESE) {
    const r = String(Sanitize.html(b));
    if (GEFAEHRLICH.test(r)) durch.push(b + '  ->  ' + r);
  }

  /* Die Gegenprobe: gewöhnliches HTML muss ankommen. Ohne sie wäre ein
     Säuberer, der schlicht '' zurückgibt, in allem oben grün. */
  /* Paar aus Eingabe und dem, was darin überleben muss — als Paar
     geschrieben, sonst wäre beides „Text oder Liste von Text" und `muss`
     hätte kein `filter`. */
  const HARMLOS: [string, string[]][] = [
    ['<p>Text mit <b>fett</b> und <i>kursiv</i></p>', ['<b>', '<i>', 'fett']],
    ['<h1>Titel</h1><ul><li>eins</li></ul>',          ['<h1>', '<li>', 'eins']],
    ['<a href="https://example.org" title="hin">L</a>', ['href="https://example.org"', 'title="hin"']],
    ['<img src="data:image/png;base64,iVBORw0KGgo=" alt="B">', ['<img', 'alt="B"']],
    ['<table><tr><td colspan="2">1</td></tr></table>', ['<td', 'colspan="2"']],
    ['<section><p>im unbekannten Tag</p></section>',   ['im unbekannten Tag']],
    ['<blockquote><pre><code>const a = 1;</code></pre></blockquote>', ['<code>', 'const a = 1;']],
    ['<p style="color:red">Stil</p>',                  ['style="color:red"']]
  ];
  const verloren = [];
  for (const [ein, muss] of HARMLOS) {
    const r = String(Sanitize.html(ein));
    const fehlt = muss.filter(m => !r.includes(m));
    if (fehlt.length) verloren.push(ein + '  ->  ' + r + '   (fehlt: ' + fehlt.join(', ') + ')');
  }

  /* Und ein Link nach draussen bekommt seinen Riegel. */
  const blank = String(Sanitize.html('<a href="https://x.ch" target="_blank">x</a>'));

  return { geprueft: BOESE.length, durch, verloren,
           blankHatNoopener: /rel="noopener noreferrer"/.test(blank) };
});

p('Kein Angriff kommt durch die Positivliste',
  angriffe.durch.length === 0, angriffe.durch.slice(0, 3).join('  |  '));
p('Und es wurden wirklich welche geprüft', angriffe.geprueft >= 30, String(angriffe.geprueft));
p('Gewöhnliches HTML bleibt vollständig',
  angriffe.verloren.length === 0, angriffe.verloren.slice(0, 2).join('  |  '));
p('target="_blank" bekommt rel="noopener noreferrer"', angriffe.blankHatNoopener);

p('Kein JS-Fehler in der Konsole', fehler.length === 0, fehler.slice(0, 2).join(' · '));

await browser.close();
server.close();

console.log(`\n  Suite 56 — Der Säuberer hängt: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
