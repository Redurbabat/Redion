/* Suite 96 — Markdown in beide Richtungen (L20)
 * ============================================================================
 * `LUECKEN.md` L20 sagte „Markdown 23 von 48" und nannte als Fehlendes einen
 * ZEILE-FÜR-ZEILE-VERGLEICH. Der ist hier — und er hat beim ersten Ablauf
 * drei Dinge gefunden, die `doku/SLASH-UND-TASTEN.md` als ✅ führte:
 *
 *   `a.` und `i.` machten KEINE nummerierte Liste. Im Blockkatalog stand
 *   als einziges Kürzel `1.`; die Doku behauptete daneben `a.` und `i.`.
 *
 *   `~Text~` strich NICHTS durch. Der Zeichner kannte nur `~~Text~~`,
 *   Abschnitt 2.2 der Doku führte die einfache Tilde.
 *
 *   Und der grosse: Strg C schreibt die Auswahl seit jeher ALS MARKDOWN.
 *   Zurück ging es nicht. Wer eine Seite kopierte und in eine andere
 *   einfügte, bekam einen einzigen Block mit allen Rautezeichen darin —
 *   der Text war da, die Gliederung weg.
 *
 * WARUM DIE PUNKTE SO GESCHNITTEN SIND
 *
 *   Ein Kürzel wird GETIPPT, nicht gesetzt. `Store.updateBlock` würde jeden
 *   Punkt grün machen, ohne dass ein einziger Tastendruck geprüft wäre.
 *   Deshalb geht §1 durch `keyboard.type` — langsamer, aber es misst das,
 *   was ein Mensch tut.
 *
 *   §4 fügt echt ein, über `navigator.clipboard`. Ein direkter Aufruf von
 *   `mdLesen` prüft den Leser, nicht den Weg dorthin; der Fehler sass aber
 *   im Weg — es gab gar keinen `paste`-Griff.
 *
 *   §5 ist die Gegenprobe zu §4: im Codeblock DARF Markdown nicht gelesen
 *   werden. Eine Zeile `# hallo` in einem Stück Python ist eine
 *   Kommentarzeile und keine Überschrift.
 *
 *   node pruefungen/lauf/test132.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8801;

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
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 },
                                       permissions: ['clipboard-read', 'clipboard-write'] });
const seite = await ctx.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Kein Erstbesucher — sonst liegt das Willkommen über allem (E55). */
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.getElementById('rg-einladung')?.remove();
});

/* Eine leere Seite, auf der getippt werden kann. */
await seite.evaluate(() => {
  const w = window as any;
  const s = Store.addBlock(null, 'page', { text: 'Markdown-Probe' });
  w.__seite = s.id;
  App.oeffne(s.id);
});
await seite.waitForTimeout(600);

/** Einen frischen leeren Textblock anlegen und seine Kennung liefern. */
const frisch = async (): Promise<string> => {
  const id = await seite.evaluate(() => {
    const w = window as any;
    const b = Store.addBlock(w.__seite, 'text', { text: '' });
    App.zeichneSeite();
    return b.id as string;
  });
  await seite.waitForTimeout(160);
  return id;
};

/** Eingabe wirklich tippen und ablesen, was daraus wurde. */
const tippe = async (eingabe: string, dann = ''):
    Promise<{ typ: string; checked: boolean; lang: string; text: string; zeigt: string }> => {
  const id = await frisch();
  await seite.click(`.blk[data-bid="${id}"] .ct`);
  await seite.keyboard.type(eingabe, { delay: 10 });
  await seite.waitForTimeout(240);
  if (dann) { await seite.keyboard.type(dann, { delay: 10 }); await seite.waitForTimeout(200); }
  return seite.evaluate((bid) => {
    const b = Store.getBlock(bid) as any;
    const el = document.querySelector(`.blk[data-bid="${bid}"] .ct`);
    return { typ: b?.type ?? 'WEG', checked: !!b?.checked, lang: b?.lang ?? '',
             text: b?.text ?? '', zeigt: el?.textContent ?? '' };
  }, id);
};

console.log('\n1 · Blockkürzel beim Tippen — jedes einzeln getippt');

for (const [eingabe, soll] of [['# ', 'h1'], ['## ', 'h2'], ['### ', 'h3'],
                               ['- ', 'bullet'], ['* ', 'bullet'], ['+ ', 'bullet'],
                               ['> ', 'toggle'], ['" ', 'quote'],
                               ['--- ', 'divider'], ['*** ', 'divider'], ['___ ', 'divider'],
                               ['[] ', 'todo'], ['$$ ', 'equation']] as [string, string][]) {
  const r = await tippe(eingabe);
  gleich(`„${eingabe.replace(/ $/, '␣')}" wird ${soll}`, r.typ, soll);
}

/* ---------------------------------------------------------------------------
 * DER FEHLER, DEN NUR DAS HINSEHEN FINDET (CLAUDE.md §55.2)
 *
 * Alle dreizehn Zeilen darüber waren grün, seit es die Kürzel gibt. Der Typ
 * stimmte ja. Was niemand verglichen hat, war der TEXT — und der behielt das
 * Zeichen: „# Titel" wurde zu einer Überschrift namens „#Titel".
 *
 * Der Grund: der Tastendruck davor speichert „#" im Block. `ct.textContent`
 * zu leeren räumt nur das Feld; `umwandeln` zeichnet gleich darauf neu und
 * holt sich den Text aus dem Block zurück.
 * ------------------------------------------------------------------------*/
console.log('\n1b · Und das Zeichen selbst ist danach weg');
for (const [eingabe, wort] of [['# ', 'Titel'], ['## ', 'Zwischentitel'],
                               ['- ', 'Ein Punkt'], ['1. ', 'Eins'],
                               ['> ', 'Aufklappbar'], ['" ', 'Ein Zitat'],
                               ['[] ', 'Eine Aufgabe']] as [string, string][]) {
  const r = await tippe(eingabe, wort);
  gleich(`„${eingabe.replace(/ $/, '␣')}${wort}" heisst danach „${wort}"`, r.text, wort);
  p(`… und steht auch so auf dem Bildschirm`, r.zeigt === wort, JSON.stringify(r.zeigt));
}

console.log('\n2 · Die nummerierte Liste — nicht nur „1."');
/* Notion nimmt Ziffer, Buchstabe und römische Zahl, mit Punkt oder Klammer.
   Wir hatten nur „1.", die Doku behauptete daneben „a." und „i.". */
for (const eingabe of ['1. ', '1) ', 'a. ', 'a) ', 'i. ', 'i) ', 'A. ', 'I) ']) {
  const r = await tippe(eingabe);
  gleich(`„${eingabe.replace(/ $/, '␣')}" wird number`, r.typ, 'number');
}

console.log('\n3 · Was ein Kürzel ausser dem Typ noch sagt');
const abgehakt = await tippe('[x] ');
gleich('„[x]␣" wird eine Aufgabe', abgehakt.typ, 'todo');
p('… und sie ist gleich abgehakt', abgehakt.checked === true);
const offen = await tippe('[ ] ');
gleich('„[ ]␣" wird eine Aufgabe', offen.typ, 'todo');
p('… und die ist offen', offen.checked === false);

const zaun = await tippe('``` ');
gleich('„```␣" wird ein Codeblock', zaun.typ, 'code');
const zaunJs = await tippe('```js ');
gleich('„```js␣" wird ein Codeblock', zaunJs.typ, 'code');
gleich('… mit der Sprache JavaScript', zaunJs.lang, 'JavaScript');
const zaunPy = await tippe('```python ');
gleich('„```python␣" kennt die Sprache ausgeschrieben', zaunPy.lang, 'Python');
const zaunNix = await tippe('```quatsch ');
gleich('Eine unbekannte Sprache wird Plain Text, nicht leer', zaunNix.lang, 'Plain Text');

console.log('\n4 · Auszeichnung im Text');
/* `Blocks` ist ein `const` auf oberster Ebene, keine Eigenschaft von
   `window` — genau wie `Store` und `App`. Also ohne `window.` davor. */
const gezeichnet = (text: string) => seite.evaluate((t) =>
  String((Blocks as any).inline(t)), text);
for (const [text, tag] of [['**fett**', '<b>'], ['*kursiv*', '<i>'],
                           ['__unter__', '<u>'], ['~~weg~~', '<s>'],
                           ['~weg~', '<s>'], ['`code`', '<code>']] as [string, string][]) {
  p(`„${text}" zeichnet ${tag}`, (await gezeichnet(text)).includes(tag),
    await gezeichnet(text));
}
/* Die einfache Tilde darf nicht überall zuschlagen. */
p('„ca. 3~5 Grad" bleibt in Ruhe', !(await gezeichnet('ca. 3~5 Grad')).includes('<s>'),
  await gezeichnet('ca. 3~5 Grad'));
p('„~~doppelt~~" bleibt einmal durchgestrichen',
  (await gezeichnet('~~doppelt~~')) === '<s>doppelt</s>', await gezeichnet('~~doppelt~~'));

console.log('\n5 · Markdown einfügen — die Gegenrichtung zu Strg C');
/* Genau die Form, die auswahlAlsText() schreibt. */
const EINGEFUEGT = [
  '# Titel',
  'Ein Absatz.',
  '- Erster Punkt',
  '- Zweiter Punkt',
  '    - Eingerückt darunter',
  '1. Eins',
  '2. Zwei',
  '- [x] Erledigt',
  '- [ ] Offen',
  '> Ein Zitat',
  '> 💡 Ein Hinweis',
  '---',
  '```js',
  'const a = 1;',
  '',
  '# keine Überschrift, sondern Code',
  '```'
].join('\n');

/* EINE EIGENE SEITE. Die Abschnitte davor haben rund dreissig Blöcke
   getippt; wer hier `childrenOf` der alten Seite liest, zählt sie mit und
   bekommt „zwei nummerierte Listen" als zehn. Der erste Ablauf tat genau
   das und meldete drei Punkte rot, die in Ordnung waren. */
const eingefuegt = await seite.evaluate(async (text) => {
  const w = window as any;
  const s = Store.addBlock(null, 'page', { text: 'Einfüge-Probe' });
  w.__ziel = s.id;
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 300));
  const b = Store.addBlock(s.id, 'text', { text: '' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 200));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${b.id}"] .ct`);
  if (!ct) return { fehler: 'kein Feld' };
  ct.focus();
  /* Ein echter Cursor. Ohne ihn tut execCommand('insertText') nichts, und
     der einzeilige Fall wäre grün gemessen, obwohl nichts ankommt. */
  const r = document.createRange();
  r.selectNodeContents(ct); r.collapse(false);
  const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  ct.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 400));
  const kinder = Store.childrenOf(s.id).filter((x: any) => x.alive);
  return {
    leerWeg: !Store.getBlock(b.id)?.alive,
    typen: kinder.map((x: any) => x.type),
    texte: kinder.map((x: any) => x.text),
    haken: kinder.filter((x: any) => x.type === 'todo').map((x: any) => !!x.checked),
    code: kinder.find((x: any) => x.type === 'code'),
    tiefer: kinder.filter((x: any) => (x.content || []).length)
                  .map((x: any) => Store.childrenOf(x.id).map((k: any) => k.text))
  };
}, EINGEFUEGT);

const typen: string[] = (eingefuegt as any).typen ?? [];
p('Der leere Block, in dem eingefügt wurde, ist weg', (eingefuegt as any).leerWeg === true);
p('Aus einer Zeile wird ein Block, nicht alles einer',
  typen.length >= 10, typen.length + ' Blöcke: ' + typen.join(','));
p('„# Titel" wird eine Überschrift', typen.includes('h1'));
p('„- Punkt" wird eine Aufzählung', typen.filter(t => t === 'bullet').length >= 2);
p('„1. Eins" wird eine nummerierte Liste', typen.filter(t => t === 'number').length === 2);
p('„> Zitat" wird ein Zitat', typen.includes('quote'));
p('„> 💡 Hinweis" wird ein Callout, kein Zitat', typen.includes('callout'));
p('„---" wird eine Trennlinie', typen.includes('divider'));
p('Ein Absatz bleibt ein Absatz', typen.includes('text'));
p('Zwei Aufgaben, eine abgehakt und eine offen',
  JSON.stringify((eingefuegt as any).haken) === '[true,false]',
  JSON.stringify((eingefuegt as any).haken));
p('Die Rautezeichen sind aus dem Text verschwunden',
  !((eingefuegt as any).texte ?? []).some((t: string) => /^[#>-]/.test(t)),
  JSON.stringify((eingefuegt as any).texte));
p('Die eingerückte Zeile sitzt im Punkt darüber',
  JSON.stringify((eingefuegt as any).tiefer) === '[["Eingerückt darunter"]]',
  JSON.stringify((eingefuegt as any).tiefer));

const code = (eingefuegt as any).code;
p('Der Codezaun wird ein Codeblock', !!code);
gleich('… mit der Sprache aus dem Zaun', code?.lang, 'JavaScript');
p('… und sein Inhalt bleibt wörtlich, samt Leerzeile und Raute',
  code?.text === 'const a = 1;\n\n# keine Überschrift, sondern Code',
  JSON.stringify(code?.text));

console.log('\n6 · Wo Markdown NICHT gelesen werden darf');
const imCode = await seite.evaluate(async () => {
  const w = window as any;
  const b = Store.addBlock(w.__ziel, 'code', { text: '' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 200));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${b.id}"] .ct`);
  if (!ct) return { fehler: 'kein Feld' };
  ct.focus();
  /* Ein echter Cursor. Ohne ihn tut execCommand('insertText') nichts, und
     der einzeilige Fall wäre grün gemessen, obwohl nichts ankommt. */
  const r = document.createRange();
  r.selectNodeContents(ct); r.collapse(false);
  const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
  const dt = new DataTransfer();
  dt.setData('text/plain', '# eine Raute\n- ein Strich');
  ct.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 300));
  return { typ: Store.getBlock(b.id)?.type, text: Store.getBlock(b.id)?.text,
           kinder: Store.childrenOf(w.__ziel).filter((x: any) => x.alive).length };
});
gleich('Im Codeblock bleibt der Block ein Codeblock', (imCode as any).typ, 'code');
p('… und die Raute steht noch da', String((imCode as any).text ?? '').includes('# eine Raute'),
  JSON.stringify((imCode as any).text));

const einzeilig = await seite.evaluate(async () => {
  const w = window as any;
  const b = Store.addBlock(w.__ziel, 'text', { text: '' });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 200));
  const ct = document.querySelector<HTMLElement>(`.blk[data-bid="${b.id}"] .ct`);
  if (!ct) return {};
  ct.focus();
  /* Ein echter Cursor. Ohne ihn tut execCommand('insertText') nichts, und
     der einzeilige Fall wäre grün gemessen, obwohl nichts ankommt. */
  const r = document.createRange();
  r.selectNodeContents(ct); r.collapse(false);
  const sel = getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
  const dt = new DataTransfer();
  dt.setData('text/plain', 'Nur ein Satz ohne Gliederung.');
  ct.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 250));
  return { lebt: !!Store.getBlock(b.id)?.alive, text: Store.getBlock(b.id)?.text };
});
p('Ein gewöhnlicher Satz legt keinen neuen Block an', (einzeilig as any).lebt === true);
p('… und steht danach im Block', String((einzeilig as any).text ?? '').includes('ohne Gliederung'),
  JSON.stringify((einzeilig as any).text));

console.log('\n7 · Hin und zurück');
/* Der Punkt, an dem sich beide Richtungen treffen: was auswahlAlsText()
   schreibt, muss mdLesen() wieder als dieselben Typen zurückgeben. */
const rund = await seite.evaluate(() => {
  const TYPEN = ['h1', 'h2', 'h3', 'bullet', 'number', 'todo', 'quote', 'callout', 'divider'];
  const hin = TYPEN.map((t, i) => {
    const marke = ({ h1: '# ', h2: '## ', h3: '### ', bullet: '- ', number: '1. ',
      todo: '- [ ] ', quote: '> ', callout: '> 💡 ' } as Record<string, string>)[t] ?? '';
    return t === 'divider' ? '---' : marke + 'Zeile ' + i;
  }).join('\n');
  return { soll: TYPEN, ist: (Blocks as any).mdLesen(hin).map((x: any) => x.typ) };
});
p('Jeder Typ, den Strg C schreiben kann, kommt als derselbe zurück',
  JSON.stringify((rund as any).ist) === JSON.stringify((rund as any).soll),
  JSON.stringify((rund as any).ist));

console.log('\n8 · Die Übersicht in der App sagt dasselbe');
const uebersicht = await seite.evaluate(() => {
  const w = window as any;
  const g = w.Register.tasten.alle().find((x: any) => x[0] === 'Markdown beim Tippen');
  const e = w.Register.tasten.alle().find((x: any) => x[0] === 'Markdown einfügen');
  return { tippen: (g?.[1] ?? []).map((k: any) => k[0]), einfuegen: (e?.[1] ?? []).length };
});
const alle = ((uebersicht as any).tippen ?? []).join(' | ');
p('Die Übersicht nennt „a." und „i."', /a\. .*i\./.test(alle) || alle.includes('a. ␣'), alle);
p('… und die einfache Tilde', alle.includes('~Text~'), alle);
p('… und „[x]"', alle.includes('[x]'), alle);
p('… und die Sprache am Zaun', alle.includes('```js'), alle);
p('Einfügen hat eine eigene Gruppe', ((uebersicht as any).einfuegen ?? 0) >= 4);
/* Zweimal dieselbe Taste mit zwei Erklärungen ist schlimmer als gar keine
   Übersicht — test65 prüft es fürs Ganze, hier für die neue Gruppe. */
const doppelt = await seite.evaluate(() =>
  (window as any).Register.tasten.mehrfach()
    .filter((x: any) => x.stellen.some((s: string) => s.startsWith('Markdown'))));
p('Kein Markdown-Eintrag beschriftet eine fremde Taste um',
  Array.isArray(doppelt) && doppelt.length === 0, JSON.stringify(doppelt));

console.log('\n9 · Die Konsole');
p('Kein Skriptfehler', fehler.length === 0, fehler.slice(0, 3).join(' | '));

await browser.close();
server.close();

console.log(`\n  Suite 96 — Markdown: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
