/* Suite 201 — Asana und Apple Notes mit eigenem Einleser (L26, E182)
 * ============================================================================
 * L26 stand seit langem als „Asana und Apple Notes fehlen" da. Beim Nachsehen
 * stimmte das nur halb: die DATEN kamen herein — Asana über den allgemeinen
 * CSV-Weg, Apple Notes gar nicht. Was fehlte, war ein Einleser, der die
 * Eigenheiten des Exports KENNT.
 *
 * Der Unterschied ist nicht Bequemlichkeit. Der allgemeine CSV-Weg macht aus
 * jeder Spalte Text:
 *
 *     Section/Column  →  Text     statt  Status (und Gruppierung)
 *     Due Date        →  Text     statt  Datum
 *     Tags            →  Text     statt  Mehrfachauswahl
 *     Completed At    →  Text     statt  Haken
 *     Notes           →  EINE ZELLE mit der ganzen Beschreibung darin
 *
 * Das Letzte ist der eigentliche Verlust: eine Aufgabenbeschreibung in einer
 * Tabellenzelle kann man nicht lesen und nicht gliedern. Diese Suite misst
 * genau diesen Unterschied — die typisierten Spalten UND den Seiteninhalt —
 * und dass nichts verschwindet, was nicht erkannt wurde.
 *
 *   node pruefungen/lauf/test235.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

declare const Store: any; declare const Austausch: any;

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8992;

const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.json': 'application/json', '.mjs': 'text/javascript',
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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 120)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/* Ein echter Asana-Export, Spalte für Spalte wie Asana ihn schreibt — mit
   einem eigenen Feld („Aufwand") am Ende, das Redion nicht kennen kann. */
const ASANA_CSV =
  '"Task ID","Created At","Completed At","Last Modified","Name","Section/Column",' +
  '"Assignee","Assignee Email","Start Date","Due Date","Tags","Notes","Projects",' +
  '"Parent task","Priority","Aufwand"\n' +
  '"1","2026-01-02","","2026-02-01","Angebot schreiben","Zu tun","Hans","h@x.de",' +
  '"2026-03-01","2026-03-14","kunde, dringend","# Rahmen\n\nDrei Seiten, mit Preisliste.","Vertrieb",' +
  '"","Hoch","4h"\n' +
  '"2","2026-01-03","2026-02-10","2026-02-10","Preisliste prüfen","Erledigt","Eva","e@x.de",' +
  '"","2026-02-09","kunde","","Vertrieb","Angebot schreiben","Mittel","1h"\n' +
  '"3","2026-01-04","","2026-02-02","Termin vereinbaren","Zu tun","","",' +
  '"","","","Anrufen, nicht mailen.","Vertrieb","","Niedrig",""\n';

/* ==========================================================================
 * §1 · Der Einleser ist da und sagt nein zu Fremdem
 * ========================================================================*/
console.log('\n1 · Der Einleser ist da und sagt nein zu Fremdem');

const da = await seite.evaluate(() => ({
  asana:  typeof Austausch?.ausAsana === 'function',
  apple:  typeof Austausch?.ausAppleNotes === 'function',
  html:   typeof Austausch?.htmlZuMarkdown === 'function',
  quellen: (Austausch?.QUELLEN || []).map((q: any) => q[0])
}));
p('`ausAsana` gibt es', da.asana);
p('`ausAppleNotes` gibt es', da.apple);
p('`htmlZuMarkdown` gibt es — einmal, für beide HTML-Wege', da.html);
p('Beide stehen im Fenster zur Auswahl',
  da.quellen.includes('asana') && da.quellen.includes('apple'), da.quellen.join(','));
p('Der allgemeine CSV-Weg bleibt daneben stehen', da.quellen.includes('csv'), da.quellen.join(','));

/* Eine beliebige CSV ist KEIN Asana-Export. Ohne diese Grenze würde der
   Einleser raten statt lesen — und aus „Betrag" einen Abschnitt machen. */
const fremd = await seite.evaluate(() => {
  try { Austausch.ausAsana('Titel,Betrag\nMiete,1450\n', null); return 'ANGENOMMEN'; }
  catch (e: any) { return String(e?.message || e); }
});
p('Eine fremde CSV wird abgelehnt, nicht geraten', /Asana/.test(fremd) && /Name/.test(fremd), fremd);

const leer = await seite.evaluate(() => {
  try { Austausch.ausAsana('"Name"\n', null); return 'ANGENOMMEN'; }
  catch (e: any) { return String(e?.message || e); }
});
/* NICHT `!== 'ANGENOMMEN'`: dann wäre der Punkt auch grün, wenn `ausAsana`
   gar nicht existiert und der Aufruf an `undefined` scheitert. Gemessen wird
   die MELDUNG, und die kann nur aus dem Einleser selbst kommen. */
p('Eine Datei ohne Zeilen wird abgelehnt', /keine Zeilen/.test(leer), leer);

/* ==========================================================================
 * §2 · Die Spalten bekommen ihren Typ — das ist der ganze Unterschied
 * ========================================================================*/
console.log('\n2 · Die Spalten bekommen ihren Typ');

const erg = await seite.evaluate((csv: string) => {
  const r = Austausch.ausAsana(csv, null, 'Vertrieb');
  const slg = Object.values<any>(Store.cache.collections)
    .find((c: any) => c.name === 'Vertrieb');
  const zeilen = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b.parentId === slg.id && b.alive !== false);
  return {
    hinweis: r.hinweis,
    seiteId: r.seite.id,
    schema: Object.fromEntries(Object.entries<any>(slg.schema)
      .map(([k, v]: any) => [k, v.type + ':' + v.name])),
    optionen: Object.fromEntries(Object.entries<any>(slg.schema)
      .filter(([, v]: any) => v.options)
      .map(([k, v]: any) => [k, v.options.map((o: any) => o.name)])),
    zeilen: zeilen.map((z: any) => ({
      titel: z.text,
      props: z.props,
      kinder: (z.content || []).length
    })).sort((a: any, b: any) => String(a.titel).localeCompare(String(b.titel)))
  };
}, ASANA_CSV);

gleich('„Section/Column" wird ein Status', erg.schema['abschnitt'], 'status:Abschnitt');
gleich('„Due Date" wird ein Datum', erg.schema['faellig'], 'date:Fällig');
gleich('„Start Date" wird ein Datum', erg.schema['beginn'], 'date:Beginn');
gleich('„Tags" wird eine Mehrfachauswahl', erg.schema['tags'], 'multi:Etiketten');
gleich('„Completed At" wird ein Haken', erg.schema['fertig'], 'checkbox:Erledigt');
gleich('„Priority" wird eine Auswahl', erg.schema['prio'], 'select:Priorität');
gleich('„Assignee" bleibt Text', erg.schema['wer'], 'text:Zuständig');
gleich('„Parent task" wird „Gehört zu"', erg.schema['ueber'], 'text:Gehört zu');

/* Das eigene Feld: Redion kennt „Aufwand" nicht und darf es trotzdem nicht
   wegwerfen. Es wird eine Textspalte mit einem nicht-numerischen Schlüssel
   (E96/E172) — und behält seinen Namen aus der Datei. */
gleich('Ein unbekanntes eigenes Feld kommt als Textspalte mit', erg.schema['a0'], 'text:Aufwand');
p('Sein Schlüssel ist nicht rein numerisch',
  Object.keys(erg.schema).every(k => !/^\d+$/.test(k)), Object.keys(erg.schema).join(','));

/* Die vier stummen Spalten werden NICHT zu Spalten. `Notes` wird Inhalt,
   `Completed At` wird der Haken, die Kennungen fallen weg. */
const namen = Object.values(erg.schema).map((v: any) => String(v).split(':')[1]);
p('„Notes" wird keine Spalte', !namen.includes('Notes'), namen.join(','));
p('„Task ID" wird keine Spalte', !namen.includes('Task ID'), namen.join(','));
p('„Assignee Email" wird keine Spalte', !namen.includes('Assignee Email'), namen.join(','));

/* ==========================================================================
 * §3 · Die Werte stehen richtig drin
 * ========================================================================*/
console.log('\n3 · Die Werte stehen richtig drin');

gleich('Drei Aufgaben übernommen', erg.zeilen.length, 3);
const angebot = erg.zeilen.find((z: any) => z.titel === 'Angebot schreiben');
const preis   = erg.zeilen.find((z: any) => z.titel === 'Preisliste prüfen');
const termin  = erg.zeilen.find((z: any) => z.titel === 'Termin vereinbaren');

p('Der Titel steht am Block, nicht nur in den Feldern', !!angebot, JSON.stringify(erg.zeilen.map((z:any)=>z.titel)));
gleich('Die Etiketten sind eine Liste, kein Text', angebot?.props?.tags, ['kunde', 'dringend']);
gleich('Das Fälligkeitsdatum ist ein Datum', angebot?.props?.faellig, '2026-03-14');
gleich('Der Abschnitt steht als Status', angebot?.props?.abschnitt, 'Zu tun');
gleich('Die Priorität steht als Auswahl', angebot?.props?.prio, 'Hoch');
gleich('Das eigene Feld hat seinen Wert behalten', angebot?.props?.a0, '4h');

/* Der Haken: `Completed At` leer → offen, gefüllt → erledigt. Genau DAS
   kann der allgemeine CSV-Weg nicht, und es ist die Information, nach der
   man in einer Aufgabenliste zuerst sucht. */
gleich('Ohne „Completed At" ist die Aufgabe offen', angebot?.props?.fertig, false);
gleich('Mit „Completed At" ist sie erledigt', preis?.props?.fertig, true);

/* Leere Zellen legen keine leeren Werte an — sonst steht in der Ansicht ein
   leeres Etikett, das man anklicken kann. */
p('Eine leere Zelle legt keinen Wert an',
  termin?.props?.tags === undefined && termin?.props?.faellig === undefined,
  JSON.stringify(termin?.props));

/* ==========================================================================
 * §4 · Die Beschreibung wird Seiteninhalt, nicht Zellinhalt
 * ========================================================================*/
console.log('\n4 · Die Beschreibung wird Seiteninhalt');

p('Die Zeile mit Beschreibung hat Kinderblöcke', (angebot?.kinder ?? 0) > 0, String(angebot?.kinder));
p('Die Zeile ohne Beschreibung hat keine', (preis?.kinder ?? 0) === 0, String(preis?.kinder));
p('Der Hinweis nennt beide Zahlen', /3 Aufgaben/.test(erg.hinweis) && /2 mit Beschreibung/.test(erg.hinweis), erg.hinweis);

const inhalt = await seite.evaluate(() => {
  /* Die Zeile wird über die SAMMLUNG gesucht, nicht über den Text allein:
     ein gleichnamiger Block anderswo im Bestand würde sonst mitgemessen. */
  const slg = Object.values<any>(Store.cache.collections).find((c: any) => c.name === 'Vertrieb');
  const zeile = Object.values<any>(Store.cache.blocks)
    .find((b: any) => b.parentId === slg.id && b.text === 'Angebot schreiben' && b.alive !== false);
  return (zeile.content || []).map((k: string) => {
    const b = Store.getBlock(k);
    return b ? b.type + ':' + b.text : '?';
  });
});
p('Aus der Überschrift im Markdown wird eine Überschrift',
  inhalt.some((x: string) => /^h1:Rahmen$/.test(x)), inhalt.join(' | '));
p('Der Absatz darunter steht als eigener Block',
  inhalt.some((x: string) => /^text:Drei Seiten/.test(x)), inhalt.join(' | '));

/* ==========================================================================
 * §5 · Die Ansicht gruppiert nach Abschnitt
 * ========================================================================*/
console.log('\n5 · Die Ansicht gruppiert nach Abschnitt');

const sicht = await seite.evaluate(() => {
  const slg = Object.values<any>(Store.cache.collections).find((c: any) => c.name === 'Vertrieb');
  const v = Object.values<any>(Store.cache.views).find((x: any) => x.collectionId === slg.id);
  /* Das Feld heisst `layout`. `type` gibt es an der Ansicht NICHT — die
     erste Fassung dieser Prüfung las `v.type`, bekam `undefined` und
     behauptete damit, es sei kein Board. */
  return { typ: v.layout, gruppe: v.groupBy };
});
gleich('Es ist ein Board', sicht.typ, 'board');
gleich('Gruppiert wird nach dem Abschnitt', sicht.gruppe, 'abschnitt');

/* Die Statusoptionen müssen VOR der ersten Zeile dastehen — sonst zeigt das
   Board eine Spalte, die es im Schema nicht gibt. */
gleich('Beide Abschnitte stehen als Option bereit',
  (erg.optionen['abschnitt'] || []).slice().sort(), ['Erledigt', 'Zu tun']);
gleich('Die Etiketten sind entdoppelt', (erg.optionen['tags'] || []).slice().sort(),
  ['dringend', 'kunde']);

/* ==========================================================================
 * §6 · Apple Notes: Ordner bleiben Ordner, Haken bleiben Haken
 * ========================================================================*/
console.log('\n6 · Apple Notes: Ordner bleiben Ordner');

const apfel = await seite.evaluate(async () => {
  /* Was ein Ordner-Auswahlfeld liefert: Dateien mit `webkitRelativePath`.
     Der oberste Ordner ist der gewählte und wird nicht mitgebaut. */
  const mach = (pfad: string, html: string) => {
    const f: any = new File([html], pfad.split('/').pop() as string, { type: 'text/html' });
    Object.defineProperty(f, 'webkitRelativePath', { value: pfad });
    return f;
  };
  const dateien = [
    mach('Notizen/Einkauf.html',
      '<html><head><title>Einkauf</title></head><body><h1>Einkauf</h1>' +
      '<ul><li>☑ Brot</li><li>☐ Milch</li><li>Zeitung</li></ul></body></html>'),
    mach('Notizen/Rezepte/Brot.html',
      '<html><head><title>Sauerteigbrot</title></head><body>' +
      '<h2>Sauerteigbrot</h2><p>500 g Mehl</p><p>350 g Wasser</p></body></html>'),
    mach('Notizen/Rezepte/Suppe.html',
      '<html><body><h1>Kürbissuppe</h1><p>Ein Kürbis.</p></body></html>'),
    mach('Notizen/beilage.txt', 'wird nicht gelesen')
  ];
  const r = await Austausch.ausAppleNotes(dateien, null);
  const baum = (id: string): any => {
    const b = Store.getBlock(id);
    return { text: b.text, typ: b.type, haken: b.checked === true,
             kinder: (b.content || []).map(baum) };
  };
  return { hinweis: r.hinweis, baum: baum(r.seite.id) };
});

p('Der Hinweis nennt die Zahl der Notizen', /3 Notizen/.test(apfel.hinweis), apfel.hinweis);
const oben = apfel.baum.kinder.map((k: any) => k.text).sort();
gleich('Oben stehen die Notiz und der Unterordner', oben, ['Einkauf', 'Rezepte']);

const rezepte = apfel.baum.kinder.find((k: any) => k.text === 'Rezepte');
gleich('Der Unterordner hat beide Notizen',
  rezepte.kinder.map((k: any) => k.text).sort(), ['Kürbissuppe', 'Sauerteigbrot']);
gleich('Der Ordner ist eine Seite, keine Notiz', rezepte.typ, 'page');

/* Der Titel kommt aus `<title>`, nicht aus dem Dateinamen: die Datei heisst
   „Brot.html", die Notiz heisst „Sauerteigbrot". */
p('Der Titel kommt aus dem Dokument, nicht aus dem Dateinamen',
  rezepte.kinder.some((k: any) => k.text === 'Sauerteigbrot'),
  rezepte.kinder.map((k: any) => k.text).join(','));
/* Und wenn es kein `<title>` gibt, aus der ersten Überschrift. */
p('Ohne `<title>` wird die erste Überschrift der Titel',
  rezepte.kinder.some((k: any) => k.text === 'Kürbissuppe'),
  rezepte.kinder.map((k: any) => k.text).join(','));

const einkauf = apfel.baum.kinder.find((k: any) => k.text === 'Einkauf');
const zeilen = einkauf.kinder.map((k: any) => k.typ + ':' + k.text + (k.haken ? ' [x]' : ''));
/* Der HAKEN wird gemessen, nicht nur die Blockart. Vorher stand hier
   `/^todo:Brot$/` — das ist auch dann grün, wenn beide Punkte UNERLEDIGT
   ankommen, und genau das wäre der Verlust. */
p('Ein abgehakter Punkt wird eine erledigte Aufgabe',
  zeilen.some((z: string) => /^todo:Brot \[x\]$/.test(z)), zeilen.join(' | '));
p('Ein offener Punkt bleibt offen',
  zeilen.some((z: string) => /^todo:Milch$/.test(z)), zeilen.join(' | '));
p('Ein Punkt ohne Kästchen bleibt ein Aufzählungspunkt',
  zeilen.some((z: string) => /^(list|bullet):Zeitung$/.test(z)), zeilen.join(' | '));
p('Das Kästchen steht nicht mehr im Text',
  !zeilen.some((z: string) => /☑|☐/.test(z)), zeilen.join(' | '));
p('Die doppelte Überschrift steht nicht noch einmal im Text',
  !zeilen.some((z: string) => /^h1:Einkauf$/.test(z)), zeilen.join(' | '));
p('Eine .txt im Ordner wird übergangen, nicht eingelesen',
  !apfel.baum.kinder.some((k: any) => /beilage/i.test(k.text)), oben.join(','));

const ohneHtml = await seite.evaluate(async () => {
  try { await Austausch.ausAppleNotes(
    [new File(['x'], 'a.txt', { type: 'text/plain' })], null); return 'ANGENOMMEN'; }
  catch (e: any) { return String(e?.message || e); }
});
p('Ein Ordner ohne HTML wird abgelehnt', ohneHtml !== 'ANGENOMMEN', ohneHtml);

/* ==========================================================================
 * §7 · Der Haken kommt aus derselben Funktion wie bei Evernote
 * ========================================================================*/
console.log('\n7 · Ein HTML-Leser, nicht zwei');

const gemeinsam = await seite.evaluate(() => {
  const h = Austausch.htmlZuMarkdown;
  return {
    haken:   h('<ul><li>☑ fertig</li><li>☐ offen</li></ul>'),
    attribut: h('<ul><li data-checked="true">so auch</li></ul>'),
    klammer: h('<ul><li>[x] eckig</li></ul>'),
    leer:    h(''),
    nichts:  h(null as any),
    ueber:   h('<h1>Eins</h1><h2>Zwei</h2><h3>Drei</h3><p>Text</p>')
  };
});
gleich('Das Kästchen wird zur Markdown-Aufgabe', gemeinsam.haken, '- [x] fertig\n\n- [ ] offen');
gleich('Auch als Datenattribut', gemeinsam.attribut, '- [x] so auch');
gleich('Auch in eckigen Klammern', gemeinsam.klammer, '- [x] eckig');
gleich('Leerer Text gibt leeren Text', gemeinsam.leer, '');
gleich('`null` wirft nicht', gemeinsam.nichts, '');
gleich('Die drei Überschriftgrade bleiben', gemeinsam.ueber, '# Eins\n\n## Zwei\n\n### Drei\n\nText');

/* ==========================================================================
 * §8 · Nichts kaputt: Evernote geht weiter, obwohl es jetzt teilt
 * ========================================================================*/
console.log('\n8 · Evernote geht weiter');

const enex = await seite.evaluate(() => {
  const xml = '<?xml version="1.0"?><en-export><note><title>Alte Notiz</title>' +
    '<content>&lt;div&gt;&lt;h1&gt;Kopf&lt;/h1&gt;&lt;p&gt;Rumpf&lt;/p&gt;&lt;/div&gt;</content>' +
    '<tag>alt</tag></note></en-export>';
  const r = Austausch.ausEvernote(xml, null);
  const notiz = Store.getBlock((Store.getBlock(r.seite.id).content || [])[0]);
  return {
    hinweis: r.hinweis,
    titel: notiz.text,
    tags: notiz.tags,
    inhalt: (notiz.content || []).map((k: string) => {
      const b = Store.getBlock(k); return b ? b.type + ':' + b.text : '?';
    })
  };
});
gleich('Der Titel der Notiz steht', enex.titel, 'Alte Notiz');
gleich('Die Etiketten stehen', enex.tags, ['alt']);
p('Die Überschrift wurde eine Überschrift',
  enex.inhalt.some((x: string) => /^h1:Kopf$/.test(x)), enex.inhalt.join(' | '));
p('Der Rumpf steht darunter',
  enex.inhalt.some((x: string) => /^text:Rumpf$/.test(x)), enex.inhalt.join(' | '));

/* ==========================================================================
 * §9 · Die Liste rollt, und man sieht es (E183)
 * ------------------------------------------------------------------------
 * Zwei Quellen mehr, und die achte stand 28 px unter der Kante — erreichbar,
 * aber ohne Beschreibung und ohne einen Hinweis darauf, dass da noch etwas
 * ist. Dasselbe wie bei der abgeschnittenen Tabelle in E180, nur senkrecht.
 *
 * Gemessen werden ZWEI Dinge, und das zweite ist das wichtigere:
 *   · am Rechner passt alles hinein
 *   · wo es NICHT hineinpasst, läuft die Kante aus
 * ========================================================================*/
console.log('\n9 · Die Liste rollt, und man sieht es');

const mass = async (breite: number, hoehe: number) => {
  const s2 = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  await s2.goto(`http://localhost:${PORT}/index.html`);
  await s2.waitForTimeout(2400);
  await s2.evaluate(() => { Store.setMeta('rundgangGesehen', true);
                            Store.setMeta('neuerungenGesehen', 99); });
  await s2.reload(); await s2.waitForTimeout(2400);
  await s2.evaluate(() => document.querySelectorAll('.overlay, #rg-willkommen')
    .forEach(x => (x as HTMLElement).remove()));
  await s2.evaluate(() => Austausch.dialog());
  await s2.waitForTimeout(500);
  const r = await s2.evaluate(() => {
    const l = document.querySelector('.ax-liste') as HTMLElement;
    const knoepfe = [...document.querySelectorAll('.ax-liste button')] as HTMLElement[];
    const letzter = knoepfe[knoepfe.length - 1] as HTMLElement;
    const lr = l.getBoundingClientRect(), kr = letzter.getBoundingClientRect();
    return {
      knoepfe: knoepfe.length,
      rollt: l.scrollHeight > l.clientHeight + 2,
      letzterGanzDrin: kr.bottom <= lr.bottom + 0.5,
      /* Hat die letzte Quelle ihre Beschreibung — der eigentliche Verlust. */
      letzterHatText: !!letzter.querySelector('.ax-text span')?.textContent?.trim(),
      rand: l.dataset['rand'] ?? '',
      maske: (getComputedStyle(l).maskImage || '') + (getComputedStyle(l).webkitMaskImage || '')
    };
  });
  await s2.close();
  return r;
};

const amRechner = await mass(1280, 860);
gleich('Acht Quellen stehen zur Wahl', amRechner.knoepfe, 8);
p('Am Rechner passen alle acht hinein', !amRechner.rollt, JSON.stringify(amRechner));
p('Die achte steht ganz im Bild', amRechner.letzterGanzDrin, JSON.stringify(amRechner));
p('Und sie hat ihre Beschreibung', amRechner.letzterHatText);
p('Ohne Rollen keine Kante', amRechner.rand === '', amRechner.rand);

const amHandy = await mass(390, 844);
/* Am Telefon passt es NICHT — 608 px Inhalt in 523 px Fenster. Das ist keine
   Fehlfunktion; die Antwort darauf ist die weiche Kante. Wäre `rollt` hier
   false, würde der Rest dieses Abschnitts nichts mehr messen. */
p('Am Telefon rollt die Liste — sonst misst der Rest nichts', amHandy.rollt);
gleich('Und sagt es mit der senkrechten Kante', amHandy.rand, 'unten');
p('Die Maske ist wirklich gesetzt, nicht nur das Merkmal',
  /linear-gradient/.test(amHandy.maske), amHandy.maske.slice(0, 80));

p('Keine Fehler auf der Seite', fehler.length === 0, fehler.join(' · '));

console.log(`\n${ok} bestanden, ${weg} gescheitert`);
await browser.close();
server.close();
process.exit(weg ? 1 : 0);
