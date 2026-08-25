/* Suite 189 — Der Weg zurück in die Besprechung, mit Sekunde (§44, L57)
 * ============================================================================
 * §44 des Auftrags nennt zwei Beispiele für den Weg zurück zur Quelle:
 *
 *     Karte    → PDF     → Seite 14 → Ausschnitt     seit E155
 *     Aufgabe  → Meeting → 00:07                     hier
 *
 * ─── WAS DIESE SUITE ANDERS MACHT ALS test220 §3 ────────────────────────────
 * test220 §3 baut sich seinen `sourceRef` VON HAND und prüft damit den
 * Zeichner: erscheint ein Knopf, nennt er die Besprechung, springt er hin.
 * Das ist richtig und beweist genau die halbe Sache.
 *
 * Denn das Produkt schrieb gar keinen. `besprechung.ts` legte Aufgabenblock
 * und Datenbankzeile an — ohne Herkunft. Der Knopf, den test220 prüft, wäre
 * an einer echten Besprechungsaufgabe nie erschienen (E161).
 *
 * Diese Suite geht deshalb den PRODUKTWEG: `Meeting.seiteAnlegen` mit einem
 * echten Protokoll, und dann wird nachgesehen, was dasteht.
 *
 * ─── UND DIE ERFUNDENE SEKUNDE ──────────────────────────────────────────────
 * Die KI darf zu jeder Aufgabe eine Zeitmarke nennen. Übernommen wird sie
 * nur, wenn es im Protokoll wirklich eine Zeile mit dieser Zeit gibt. §3
 * prüft genau das — eine geratene Zeitmarke ist schlechter als keine: man
 * springt hin, hört etwas anderes und hält die Aufnahme für kaputt.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Die Gegenproben stehen in E161. Die wichtigste ist §4: das Ziel liegt in
 * einer ZUGEKLAPPTEN Aufklappzeile. Es ist im DOM, `rolleZu` findet es und
 * meldet Erfolg — sichtbar ist es nicht. Deshalb misst §4 die Höhe der
 * Zeile und nicht ihr Vorhandensein.
 *
 *   node pruefungen/lauf/test223.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8981;

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
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1400, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
});

/* Ein Protokoll mit drei Zeitmarken — 00:07, 01:02, 02:30. */
const PROTOKOLL = [
  '[00:07] Der Verteiler UV3 steht noch an der alten Stelle.',
  '[01:02] Dann müssen wir den halt noch verschieben.',
  '[02:30] Und die Abnahme machen wir nächste Woche.'
].join('\n');

/* ==========================================================================
 * §1 · Die Anweisung fragt nach der Sekunde
 * ========================================================================*/
console.log('\n1 · Die Anweisung fragt nach der Sekunde');

const anweisung = await seite.evaluate(async (protokoll: string) => {
  let gesehen = '';
  const alt = KI.frageKurz;
  KI.frageKurz = async (_frage: unknown, anw: unknown) => {
    gesehen = String(anw || '');
    return JSON.stringify({ titel: 'Bauleitung KW 35', zusammenfassung: [],
      entscheidungen: [], aufgaben: [], themen: [], beteiligte: [] });
  };
  try { await Meeting.auswerten(protokoll, null); }
  finally { KI.frageKurz = alt; }
  return gesehen;
}, PROTOKOLL);

p('Sie nennt das Feld „sek"', /"sek"/.test(anweisung), anweisung.slice(0, 120));
p('Und sagt, woher die Zahl kommt', /\[mm:ss\]/.test(anweisung) && /Sekunden/.test(anweisung),
  anweisung.slice(-200));
p('Und dass Raten unerwünscht ist', /nicht sicher/.test(anweisung), anweisung.slice(-120));

/* ==========================================================================
 * §2 · Eine Aufgabe mit echter Zeitmarke findet ihre Zeile
 * ========================================================================*/
console.log('\n2 · Eine Aufgabe mit echter Zeitmarke findet ihre Zeile');

const gebaut = await seite.evaluate(async (protokoll: string) => {
  const ergebnis = {
    titel: 'Bauleitung KW 35',
    zusammenfassung: ['Verteiler und Abnahme'],
    entscheidungen: [],
    aufgaben: [
      { was: 'Verteiler UV3 versetzen', wer: 'Redur', bis: '', sek: 7 },
      { was: 'Abnahme vorbereiten', wer: '', bis: '', sek: 999 },
      { was: 'Ohne Zeitangabe', wer: '', bis: '' }
    ],
    themen: [], beteiligte: ['Redur']
  };
  const p2 = Meeting.seiteAnlegen(ergebnis, protokoll, 180, null);
  await Store.flush();
  const kinder = Store.childrenOf(p2.id);
  const todos = kinder.filter((b: any) => b.type === 'todo');
  const toggle = kinder.find((b: any) => b.type === 'toggle');
  const zeilen = toggle ? Store.childrenOf(toggle.id) : [];
  return {
    seiteId: p2.id, titel: p2.text,
    todos: todos.map((b: any) => ({ text: b.text, quelle: b.sourceRef || null })),
    toggleId: toggle?.id || '', toggleOffen: toggle?.open === true,
    /* Die Zeit steht im TEXT der Zeile. `audioRef` gäbe es nur mit einer
       Aufnahme, und diese Prüfung legt bewusst keine an — sie prüft den
       Weg zurück, nicht das Abspielen. Die erste Fassung las `audioRef.sek`
       und fand überall `null`: die Suche nach der 7er-Zeile ging ins Leere
       und drei Punkte wurden aus dem falschen Grund rot. */
    zeilen: zeilen.map((z: any) => {
      const m = /^\[(?:(\d+):)?(\d{1,2}):(\d{2})\]/.exec(String(z.text || '').trim());
      return { id: z.id, text: z.text,
               sek: m ? Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null };
    })
  };
}, PROTOKOLL);

p('Es entstehen drei Aufgaben', gebaut.todos.length === 3, String(gebaut.todos.length));
p('Jede trägt jetzt eine Herkunft',
  gebaut.todos.every((t: any) => !!t.quelle),
  JSON.stringify(gebaut.todos.map((t: any) => !!t.quelle)));

const erste = gebaut.todos[0]?.quelle;
gleich('Die erste kennt ihre Sekunde', erste?.sek, 7);
gleich('Und trägt sie als Text daneben', erste?.zeit, '00:07');
const zeile7 = gebaut.zeilen.find((z: any) => z.sek === 7);
gleich('Sie zeigt auf genau die Zeile im Protokoll', erste?.blockId, zeile7?.id);
/* Das Etikett ist der SEITENTITEL, und der trägt das Datum: „Bauleitung
   KW 35 · 25.8.2026". Meine erste Erwartung war der blosse Titel — falsch,
   und zwar zugunsten des Produkts: wer die Seite umbenennt, soll den neuen
   Namen sehen, nicht den eingefrorenen von damals. */
p('Und nennt die Besprechung',
  String(erste?.label || '').startsWith('Bauleitung KW 35'), String(erste?.label));

/* ==========================================================================
 * §3 · Eine erfundene Sekunde wird NICHT übernommen
 * --------------------------------------------------------------------------
 * `sek: 999` steht in keiner Zeile. Eine Zeitmarke, die an der falschen
 * Stelle landet, ist schlechter als keine — man hört hin, hört etwas
 * anderes und glaubt, die Aufnahme sei kaputt (L57).
 * ========================================================================*/
console.log('\n3 · Eine erfundene Sekunde wird nicht übernommen');

const zweite = gebaut.todos[1]?.quelle;
p('Die zweite Aufgabe hat trotzdem eine Herkunft', !!zweite, JSON.stringify(zweite));
gleich('Aber keine Sekunde', zweite?.sek, undefined);
gleich('Und keinen Zeittext', zweite?.zeit, undefined);
gleich('Sie zeigt auf die Besprechungsseite selbst', zweite?.blockId, gebaut.seiteId);

const dritte = gebaut.todos[2]?.quelle;
p('Und eine Aufgabe ganz ohne Angabe ebenso', !!dritte && dritte.sek === undefined,
  JSON.stringify(dritte));

/* ==========================================================================
 * §4 · Der Knopf nennt die Zeit — und der Klick zeigt die Zeile WIRKLICH
 * --------------------------------------------------------------------------
 * Das Transkript steht in einer zugeklappten Aufklappzeile. Ihre Kinder
 * werden gezeichnet und stehen auf `display:none`: `rolleZu` findet
 * `[data-bid=…]`, meldet Erfolg, und zu sehen ist nichts. Gemessen wird
 * deshalb die HÖHE der Zeile, nicht ihr Vorhandensein.
 * ========================================================================*/
console.log('\n4 · Der Knopf nennt die Zeit, und der Klick zeigt die Zeile');

const gesprungen = await seite.evaluate(async (daten: any) => {
  const arbeit = Store.addPage(null, { text: 'Offene Punkte' });
  await Store.flush();
  App.oeffne(arbeit.id);
  await new Promise(r => setTimeout(r, 700));
  /* Die Aufgabe steht auf der Besprechungsseite — dort ansehen. */
  App.oeffne(daten.seiteId);
  await new Promise(r => setTimeout(r, 900));
  const erstesTodo = [...document.querySelectorAll<HTMLElement>('.blk')]
    .find(el => (el.textContent || '').includes('Verteiler UV3 versetzen'));
  const marke = erstesTodo?.querySelector<HTMLElement>('.quell-marke');
  const beschriftung = (marke?.textContent || '').trim();
  marke?.click();
  await new Promise(r => setTimeout(r, 1200));
  const ziel = document.querySelector<HTMLElement>(`[data-bid="${daten.zielId}"]`);
  const kasten = ziel?.getBoundingClientRect();
  return {
    beschriftung,
    imDom: !!ziel,
    hoehe: kasten ? Math.round(kasten.height) : 0,
    toggleOffen: Store.getBlock(daten.toggleId)?.open === true
  };
}, { seiteId: gebaut.seiteId, toggleId: gebaut.toggleId, zielId: erste?.blockId });

p('Der Knopf nennt Besprechung und Zeit',
  /^↩ Bauleitung KW 35 .*· 00:07$/.test(gesprungen.beschriftung), gesprungen.beschriftung);
p('Die Zielzeile steht im Bild', gesprungen.imDom);
p('Und sie ist wirklich zu sehen, nicht nur da',
  gesprungen.hoehe > 0, `${gesprungen.hoehe} px hoch`);
p('Die Aufklappzeile wurde dafür geöffnet', gesprungen.toggleOffen);

/* ==========================================================================
 * §5 · Die Zeile in der Aufgaben-Datenbank kennt denselben Weg
 * --------------------------------------------------------------------------
 * In „Meine Aufgaben" steht dieselbe Aufgabe noch einmal. Ohne Herkunft
 * nennt die Spalte „quelle" dort einen Titel, den man nicht anklicken kann.
 * ========================================================================*/
console.log('\n5 · Auch die Datenbankzeile kennt den Weg');

const zeilen = await seite.evaluate((seiteId: string) => {
  /* BEIM VOLLEN NAMEN. `/Aufgabe/i` traf auch die Beispieldatenbank des
     Startbestands, und die hat keine Zeile aus dieser Besprechung — die
     Prüfung meldete dann „[]" und log dabei nicht einmal. */
  const db = Object.values<any>(Store.cache.collections)
    .find((c: any) => String(c.name || '') === 'Aufgaben aus Besprechungen');
  if (!db) return null;
  const meine = Object.values<any>(Store.cache.blocks)
    .filter((b: any) => b.parentTable === 'collection' && b.parentId === db.id &&
                        b.props?.seite === seiteId);
  return meine.map((b: any) => ({ text: b.text, sek: b.sourceRef?.sek ?? null,
    blockId: b.sourceRef?.blockId || '', label: b.sourceRef?.label || '' }));
}, gebaut.seiteId);

p('Es gibt die drei Zeilen', (zeilen || []).length === 3, JSON.stringify(zeilen));
p('Jede trägt ihre Herkunft',
  (zeilen || []).every((z: any) => !!z.blockId), JSON.stringify(zeilen));
const dbErste = (zeilen || []).find((z: any) => /Verteiler UV3/.test(z.text));
gleich('Und die erste dieselbe Sekunde wie ihr Block', dbErste?.sek, 7);
gleich('Und dasselbe Ziel', dbErste?.blockId, zeile7?.id);

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
