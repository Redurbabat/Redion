/* Suite 178 — Der Dokumentmodus: Vorschläge, Verzeichnis, Kommentare (§23)
 * ============================================================================
 * §23 des Auftrags zählt zehn Dinge auf, die ein „richtiger Dokumentmodus"
 * können soll: Seitenansicht, Überschriften, Absätze, Listen, Tabellen,
 * Bilder, Inhaltsverzeichnis, Kommentare, Vorschläge, Druck/PDF.
 *
 * BEIM SCHREIBEN VON `doku/AUFTRAG-STAND.md` HABE ICH DEN VORSCHLAGSMODUS
 * ALS FEHLEND EINGETRAGEN. Er ist nicht fehlend — er steht vollständig in
 * `editor.ts` und `schale.ts`: an- und ausschalten, ein Band mit dem Namen
 * dessen, der schreibt, Festhalten beim Verlassen eines Blocks, ein Fenster
 * zum Annehmen und Verwerfen. Ich hatte gegrept, nicht gelesen.
 *
 * Eine falsche Lücke ist genauso schädlich wie eine übersehene: sie schickt
 * den Nächsten dazu, etwas zu bauen, das es schon gibt. Diese Suite ist die
 * Berichtigung — sie führt den Weg wirklich aus, statt ihn zu behaupten.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * Die Gegenproben stehen bei den Abschnitten. Der Vorschlagsmodus wird
 * einmal AUS geprüft: ohne ihn darf nichts festgehalten werden, sonst wäre
 * jede Tippkorrektur ein Vorschlag.
 *
 *   node pruefungen/lauf/test212.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8971;

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
const seite = await browser.newPage({ viewport: { width: 1300, height: 950 } });
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.querySelector('.produkt-onboarding-lage')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
});

/* ==========================================================================
 * §1 · Ein Dokument aus zehn Bausteinen
 * --------------------------------------------------------------------------
 * Erst der Bestand: was §23 aufzählt, muss es als Blockart geben und auf der
 * Seite erscheinen. Ein Verzeichnis, das keine Überschrift findet, wäre eine
 * leere Linie.
 * ========================================================================*/
console.log('\n1 · Ein Dokument aus zehn Bausteinen');

const dokument = await seite.evaluate(async () => {
  const s = Store.addPage(null, { text: 'Betriebsanleitung', icon: '📘' });
  Store.addBlock(s.id, 'h1', { text: 'Einleitung' });
  const absatz = Store.addBlock(s.id, 'text', { text: 'Dieser Abschnitt erklärt den Aufbau.' });
  Store.addBlock(s.id, 'bullet', { text: 'Erster Punkt' });
  Store.addBlock(s.id, 'number', { text: 'Erster Schritt' });
  Store.addBlock(s.id, 'h2', { text: 'Aufbau' });
  Store.addBlock(s.id, 'tabelle', { rows: [['Teil', 'Anzahl'], ['Schraube', '4']] });
  Store.addBlock(s.id, 'h2', { text: 'Wartung' });
  Store.addBlock(s.id, 'toc', {});
  await Store.flush();
  App.oeffne(s.id);
  await new Promise(r => setTimeout(r, 900));
  const bereich = document.getElementById('page');
  return {
    seite: s.id, absatz: absatz.id,
    arten: Store.childrenOf(s.id).map((b: any) => b.type),
    ueberschriften: bereich?.querySelectorAll('h1, h2, h3').length || 0,
    /* NACHGESEHEN: die Klasse heisst `toc-liste`, nicht `toc`
       (`editor.ts`, `inhaltsverzeichnis`). Mit `.toc` hätte dieser Punkt
       eine leere Zeichenkette gemessen und wäre rot geworden, ohne dass am
       Produkt etwas fehlt. */
    verzeichnis: (bereich?.querySelector('.toc-liste')?.textContent || '')
      .replace(/\s+/g, ' ').trim(),
    tabelle: bereich?.querySelectorAll('table, .tab-zelle, .tabelle').length || 0
  };
});
p('Die Seite trägt alle Bausteine',
  ['h1', 'text', 'bullet', 'number', 'h2', 'tabelle', 'toc']
    .every(art => dokument.arten.includes(art)), dokument.arten.join(', '));
p('Überschriften stehen als Überschriften da', dokument.ueberschriften >= 3,
  `${dokument.ueberschriften}`);
p('Das Inhaltsverzeichnis listet sie auf',
  /Einleitung/.test(dokument.verzeichnis) && /Aufbau/.test(dokument.verzeichnis) &&
  /Wartung/.test(dokument.verzeichnis), dokument.verzeichnis);
p('Und die Tabelle ist gezeichnet', dokument.tabelle >= 1, `${dokument.tabelle}`);

/* ==========================================================================
 * §2 · Ohne Vorschlagsmodus wird nichts festgehalten
 * --------------------------------------------------------------------------
 * Das ist die wichtigere Richtung: wäre jede Änderung ein Vorschlag, wäre
 * das Schreiben kaputt.
 * ========================================================================*/
console.log('\n2 · Ohne Vorschlagsmodus wird nichts festgehalten');

const ohne = await seite.evaluate(async (ids: any) => {
  const feld = document.querySelector<HTMLElement>(`[data-bid="${ids.absatz}"] .ct`);
  if (!feld) return null;
  feld.focus();
  feld.textContent = 'Ohne Modus einfach geändert.';
  feld.blur();
  await new Promise(r => setTimeout(r, 400));
  return {
    vorschlaege: (Store.getBlock(ids.seite)?.vorschlaege || []).length,
    modus: !!Store.getBlock(ids.seite)?.vorschlagModus
  };
}, dokument);
p('Der Absatz ist beschreibbar', !!ohne, 'kein .ct gefunden');
gleich('Der Modus ist aus', ohne?.modus, false);
gleich('Und es wurde nichts als Vorschlag festgehalten', ohne?.vorschlaege, 0);

/* ==========================================================================
 * §3 · Mit Vorschlagsmodus wird der alte Text festgehalten
 * --------------------------------------------------------------------------
 * Gegenprobe: mit `if (!seite.vorschlagModus) return;` zurückgenommen wären
 * die Zahlen in §2 und §3 dieselben — die Suite prüft beide Richtungen.
 * ========================================================================*/
console.log('\n3 · Mit Vorschlagsmodus wird der alte Text festgehalten');

const mit = await seite.evaluate(async (ids: any) => {
  Store.updateBlock(ids.seite, { vorschlagModus: true });
  App.zeichneSeite();
  await new Promise(r => setTimeout(r, 500));
  const feld = document.querySelector<HTMLElement>(`[data-bid="${ids.absatz}"] .ct`);
  if (!feld) return null;
  const vorher = feld.textContent || '';
  feld.focus();
  feld.textContent = 'Mit Modus vorgeschlagen.';
  feld.blur();
  await new Promise(r => setTimeout(r, 500));
  const liste = Store.getBlock(ids.seite)?.vorschlaege || [];
  return {
    vorher, anzahl: liste.length,
    alt: String(liste[0]?.alt || ''), neu: String(liste[0]?.neu || ''),
    von: String(liste[0]?.von || ''), bid: String(liste[0]?.bid || '')
  };
}, dokument);
p('Der Absatz ist noch da', !!mit, 'kein .ct gefunden');
gleich('Genau ein Vorschlag ist entstanden', mit?.anzahl, 1);
gleich('Er merkt sich den alten Text', mit?.alt, 'Ohne Modus einfach geändert.');
gleich('Und den neuen', mit?.neu, 'Mit Modus vorgeschlagen.');
p('Er nennt, von wem er kommt', !!mit?.von, mit?.von);
gleich('Und hängt am richtigen Block', mit?.bid, dokument.absatz);

/* Zweimal ändern bleibt EIN Vorschlag — sonst hätte man nach fünf
   Tippfehlern fünf Einträge für denselben Satz. */
const zweimal = await seite.evaluate(async (ids: any) => {
  const feld = document.querySelector<HTMLElement>(`[data-bid="${ids.absatz}"] .ct`);
  if (!feld) return -1;
  feld.focus();
  feld.textContent = 'Noch einmal geändert.';
  feld.blur();
  await new Promise(r => setTimeout(r, 500));
  return (Store.getBlock(ids.seite)?.vorschlaege || []).length;
}, dokument);
gleich('Zweimal tippen bleibt ein Vorschlag', zweimal, 1);

/* ==========================================================================
 * §4 · Annehmen und Verwerfen
 * --------------------------------------------------------------------------
 * Der Unterschied ist der ganze Sinn: Annehmen lässt den neuen Text stehen,
 * Verwerfen setzt den alten zurück. Beides wird hier über das Fenster
 * gemacht, nicht über die Datenschicht.
 * ========================================================================*/
console.log('\n4 · Annehmen und Verwerfen');

const verworfen = await seite.evaluate(async (ids: any) => {
  /* ÜBER DAS SEITENMENÜ, NICHT ÜBER EINE INNERE FUNKTION. `vorschlaegeZeigen`
     steht nicht auf der öffentlichen Fläche von `App` — und das ist richtig
     so. Geprüft wird der Weg, den ein Mensch nimmt: ⋯ → „Vorschläge
     ansehen". Der Eintrag erscheint nur, wenn es Vorschläge gibt; damit
     prüft dieser Abschnitt nebenbei auch das. */
  document.querySelectorAll<HTMLElement>('.overlay, .menu, .menu-grund').forEach(o => o.remove());
  App.seitenMenue(document.getElementById('btn-page-menu'), Store.getBlock(ids.seite));
  await new Promise(r => setTimeout(r, 350));
  const eintragDa = !!document.querySelector('[data-a="vorschlaege"]');
  (document.querySelector('[data-a="vorschlaege"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 450));
  const fenster = document.querySelector('.overlay .finder');
  const eintraege = document.querySelectorAll('.vor-eintrag').length;
  (document.querySelector('[data-weg="0"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 500));
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  return {
    eintragDa, fensterDa: !!fenster, eintraege,
    text: String(Store.getBlock(ids.absatz)?.text || ''),
    rest: (Store.getBlock(ids.seite)?.vorschlaege || []).length
  };
}, dokument);
p('Das Seitenmenü bietet „Vorschläge ansehen" an', verworfen.eintragDa);
p('Das Vorschlagsfenster öffnet sich', verworfen.fensterDa);
gleich('Es zeigt den einen Vorschlag', verworfen.eintraege, 1);
gleich('Verwerfen setzt den alten Text zurück', verworfen.text, 'Ohne Modus einfach geändert.');
gleich('Und nimmt den Vorschlag aus der Liste', verworfen.rest, 0);

const angenommen = await seite.evaluate(async (ids: any) => {
  const feld = document.querySelector<HTMLElement>(`[data-bid="${ids.absatz}"] .ct`);
  if (!feld) return null;
  feld.focus();
  feld.textContent = 'Diesmal angenommen.';
  feld.blur();
  await new Promise(r => setTimeout(r, 500));
  document.querySelectorAll<HTMLElement>('.overlay, .menu, .menu-grund').forEach(o => o.remove());
  App.seitenMenue(document.getElementById('btn-page-menu'), Store.getBlock(ids.seite));
  await new Promise(r => setTimeout(r, 350));
  (document.querySelector('[data-a="vorschlaege"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 450));
  (document.querySelector('[data-ok="0"]') as HTMLElement | null)?.click();
  await new Promise(r => setTimeout(r, 500));
  document.querySelectorAll<HTMLElement>('.overlay').forEach(o => o.remove());
  return {
    text: String(Store.getBlock(ids.absatz)?.text || ''),
    rest: (Store.getBlock(ids.seite)?.vorschlaege || []).length
  };
}, dokument);
gleich('Annehmen lässt den neuen Text stehen', angenommen?.text, 'Diesmal angenommen.');
gleich('Und die Liste ist wieder leer', angenommen?.rest, 0);

/* ==========================================================================
 * §5 · Kommentare hängen am Block, nicht an einer Zeile Text
 * ========================================================================*/
console.log('\n5 · Kommentare hängen am Block, nicht an einer Zeile Text');

/* ÜBER `Kommentare.neu`, NICHT ÜBER DAS FELD. Meine erste Fassung schrieb
   `{ von, wann }` direkt in den Block — geraten, und falsch: die Felder
   heissen `autor`, `zeit`, `erledigt`, `antworten` (`faden.ts`). Ein Test,
   der seine eigenen Felder erfindet, prüft nur sich selbst.
   `neu()` fragt über `UI.frage`; die Antwort wird hier vorgegeben. */
const kommentiert = await seite.evaluate(async (ids: any) => {
  const K = (globalThis as any).Kommentare;
  if (!K?.neu || !K?.alle) return null;
  const echt = UI.frage;
  (UI as any).frage = async () => 'Bitte hier eine Zahl ergänzen.';
  try {
    await K.neu(Store.getBlock(ids.absatz));
    await new Promise(r => setTimeout(r, 500));
  } finally { (UI as any).frage = echt; }
  const liste = K.alle(ids.seite);
  const eintrag = (Store.getBlock(ids.absatz)?.kommentare || [])[0];
  return {
    anzahl: liste.length,
    offen: K.offeneAnzahl(ids.seite),
    text: String(eintrag?.text || ''),
    autor: String(eintrag?.autor || ''),
    erledigt: eintrag?.erledigt,
    /* `alle()` gibt `{ block, k }` zurück — nachgesehen, nicht geraten. */
    amBlock: String(liste[0]?.block?.id || '') === String(ids.absatz)
  };
}, dokument);
p('Die Kommentar-Fläche ist da', !!kommentiert, 'Kommentare.neu fehlt');
gleich('Ein Kommentar ist entstanden', kommentiert?.anzahl, 1);
gleich('Er trägt seinen Text', kommentiert?.text, 'Bitte hier eine Zahl ergänzen.');
p('Und einen Autor', !!kommentiert?.autor, kommentiert?.autor);
gleich('Er gilt als offen', kommentiert?.erledigt, false);
gleich('Und die Seite zählt ihn', kommentiert?.offen, 1);
p('Er hängt am Absatz', kommentiert?.amBlock === true);

/* ==========================================================================
 * §6 · Drucken nimmt das ganze Dokument mit
 * --------------------------------------------------------------------------
 * §23 nennt „Druck/PDF" als letzten Punkt. Geprüft wird der Inhalt des
 * Druckrahmens, nicht der Drucker.
 * ========================================================================*/
console.log('\n6 · Drucken nimmt das ganze Dokument mit');

const gedruckt = await seite.evaluate(async (ids: any) => {
  (window as any).__druckAufrufe = 0;
  const echt = window.print;
  (window as any).print = () => { (window as any).__druckAufrufe++; };
  try {
    await (globalThis as any).Werkzeuge.drucken(Store.getBlock(ids.seite));
    await new Promise(r => setTimeout(r, 700));
    const rahmen = [...document.querySelectorAll('iframe')]
      .filter(f => (f as HTMLIFrameElement).style.position === 'fixed').pop() as HTMLIFrameElement | undefined;
    const inhalt = (rahmen?.contentDocument?.body?.textContent || '').replace(/\s+/g, ' ').trim();
    return { aufrufe: (window as any).__druckAufrufe, inhalt: inhalt.slice(0, 400) };
  } finally { (window as any).print = echt; }
}, dokument);
p('Der Druck wurde ausgelöst', gedruckt.aufrufe >= 1, `${gedruckt.aufrufe}`);
p('Der Titel steht im Druckbild', /Betriebsanleitung/.test(gedruckt.inhalt),
  gedruckt.inhalt.slice(0, 120));
p('Die Überschriften auch',
  /Einleitung/.test(gedruckt.inhalt) && /Wartung/.test(gedruckt.inhalt),
  gedruckt.inhalt.slice(0, 200));
p('Und der Absatz mit dem angenommenen Vorschlag',
  /Diesmal angenommen/.test(gedruckt.inhalt), gedruckt.inhalt.slice(0, 300));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
