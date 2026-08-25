/* Suite 185 — Der Obsidian-Rundlauf (§43)
 * ============================================================================
 * §43 verlangt nichts Neues. Er verlangt, dass etwas Bestehendes NICHT
 * kaputtgeht:
 *
 *     Bestehenden stabilen Import/Export erhalten.
 *     Keine Regression: redion-id · Pfad · Aliase · Wikilinks · Reimport ·
 *     keine unnötigen Duplikate
 *
 * Das ist die Sorte Anforderung, die ohne Prüflauf wertlos ist: „keine
 * Regression" kann nur etwas heissen, wenn jemand nachsieht. `AUFTRAG-STAND`
 * führte §43 deshalb zu Recht als ◐ — der Resolver aus E129 steht, aber
 * nichts lief den Weg einmal ganz durch.
 *
 * Diese Suite exportiert einen echten kleinen Vault, liest ihn wieder ein,
 * und liest ihn dann NOCH EINMAL ein. Der zweite Durchgang ist der
 * eigentliche Punkt: er darf nichts verdoppeln.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §6 ist die Gegenrichtung, und sie ist die schärfste: eine Datei mit
 * demselben TITEL, aber ohne `redion-id`, darf NICHT mit der vorhandenen
 * Seite verschmolzen werden — sonst frisst ein Import fremde Notizen auf.
 * Die Gegenproben stehen in E154.
 *
 *   node pruefungen/lauf/test219.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8977;

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
const kontext = await browser.newContext({ viewport: { width: 1300, height: 900 },
  acceptDownloads: true });
const seite = await kontext.newPage();
const fehler: string[] = [];
seite.on('pageerror', e => fehler.push('PAGEERROR: ' + e.message.slice(0, 140)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2700);
await seite.evaluate(() => {
  Store.setMeta('rundgangGesehen', true);
  document.getElementById('rg-willkommen')?.remove();
  document.querySelectorAll<HTMLElement>('.overlay, .produkt-onboarding-lage').forEach(o => o.remove());
});

/* ==========================================================================
 * §1 · Ein Vault mit allem, was §43 aufzählt
 * ========================================================================*/
console.log('\n1 · Ein Vault mit allem, was §43 aufzählt');

const gebaut = await seite.evaluate(async () => {
  const wurzel = Store.addPage(null, { text: 'Elektro', icon: '⚡' });
  const norm = Store.addPage(wurzel.id, { text: 'Normen und Regeln', icon: '📘' });
  Store.updateBlock(norm.id, { aliases: ['NIN', 'Niederspannungs-Installationsnorm'] });
  const kabel = Store.addPage(wurzel.id, { text: 'Kabelquerschnitt' });
  /* EIN WIKILINK, wie ihn Obsidian schreibt — auf den Alias, nicht den
     Titel. Genau das prüft der Resolver aus E129. */
  Store.addBlock(kabel.id, 'text', { text: 'Siehe [[NIN]] für die Grenzwerte.' });
  Store.addBlock(norm.id, 'text', { text: 'Die Norm gilt für Niederspannung.' });
  await Store.flush();
  return { wurzel: wurzel.id, norm: norm.id, kabel: kabel.id,
    seitenVorher: Object.values<any>(Store.cache.blocks)
      .filter(b => b?.alive !== false && b?.type === 'page' && b.parentTable !== 'collection').length };
});

/* Der Export lädt die Datei herunter; das Herunterladen selbst ist hier
   nicht der Prüfgegenstand, der Inhalt schon. */
const paket = await seite.evaluate(async () => {
  const blob = await (globalThis as any).Austausch.alsObsidianVault('Prüf-Vault');
  const zip = await (globalThis as any).Einlesen.zipLesenAusBlob(blob);
  const inhalt: Record<string, string> = {};
  for (const name of zip.namen) inhalt[name] = String(await zip.text(name) || '');
  return { namen: zip.namen as string[], inhalt, groesse: blob.size };
});

p('Es entsteht ein Archiv mit Inhalt', paket.groesse > 0, `${paket.groesse} Bytes`);
p('Mit einer .md-Datei je Seite',
  paket.namen.filter(n => n.endsWith('.md')).length >= 3, paket.namen.join(' | '));
p('Der Pfad bildet die Verschachtelung ab',
  paket.namen.some(n => /Elektro\/Normen und Regeln\.md$/.test(n)), paket.namen.join(' | '));

const normDatei = paket.inhalt[paket.namen.find(n => /Normen und Regeln\.md$/.test(n)) || ''] || '';
p('Die Datei trägt eine redion-id', /^redion-id: /m.test(normDatei),
  normDatei.slice(0, 200));
p('Und zwar die echte Kennung der Seite',
  new RegExp('redion-id: "?' + gebaut.norm).test(normDatei), normDatei.slice(0, 200));
p('Sie trägt ihren Pfad', /^redion-path: /m.test(normDatei), normDatei.slice(0, 240));
p('Und beide Aliasse', /NIN/.test(normDatei) &&
  /Niederspannungs-Installationsnorm/.test(normDatei), normDatei.slice(0, 300));

const kabelDatei = paket.inhalt[paket.namen.find(n => /Kabelquerschnitt\.md$/.test(n)) || ''] || '';
p('Der Wikilink bleibt ein Wikilink', /\[\[.*\]\]/.test(kabelDatei), kabelDatei.slice(0, 300));

/* ==========================================================================
 * §2 · Zurücklesen ändert nichts — es ordnet zu
 * ========================================================================*/
console.log('\n2 · Zurücklesen ändert nichts');

/** Der Ordner, wie ihn der Browser bei „Ordner wählen" liefert: Dateien mit
    `webkitRelativePath`, alle unter einem gemeinsamen ersten Segment. */
const einlesen = async (wandeln?: (name: string, text: string) => string | null): Promise<any> =>
  seite.evaluate(async (arg: any) => {
    const dateien = arg.eintraege.map((e: any) => {
      const f = new File([e.text], String(e.name).split('/').pop() || 'x.md',
        { type: 'text/markdown' });
      Object.defineProperty(f, 'webkitRelativePath', { value: 'Prüf-Vault/' + e.name });
      return f;
    });
    const ziel = Store.getBlock(arg.ziel);
    const bericht = await (globalThis as any).Austausch.ausMarkdownOrdner(dateien, ziel);
    await Store.flush();
    const seiten = Object.values<any>(Store.cache.blocks)
      .filter(b => b?.alive !== false && b?.type === 'page' && b.parentTable !== 'collection');
    return {
      bericht: typeof bericht === 'string' ? bericht : JSON.stringify(bericht ?? null),
      seitenGesamt: seiten.length,
      titel: seiten.map((b: any) => String(b.text || '')),
      normNoch: !!Store.getBlock(arg.norm),
      normAliasse: (Store.getBlock(arg.norm)?.aliases || []).slice(),
      kabelText: Store.childrenOf(arg.kabel).map((b: any) => String(b.text || '')).join(' ')
    };
  }, {
    eintraege: paket.namen.filter(n => n.endsWith('.md')).map(n => ({
      name: n, text: wandeln ? (wandeln(n, paket.inhalt[n] || '') ?? (paket.inhalt[n] || ''))
                             : (paket.inhalt[n] || '')
    })).filter((e: any) => e.text !== null),
    ziel: gebaut.wurzel, norm: gebaut.norm, kabel: gebaut.kabel
  });

const ersteRunde = await einlesen();
p('Die Seite von vorher gibt es noch', ersteRunde.normNoch);
gleich('Und sie hat ihre Aliasse behalten',
  ersteRunde.normAliasse.slice().sort(), ['NIN', 'Niederspannungs-Installationsnorm']);
gleich('Es sind nicht mehr Seiten geworden',
  ersteRunde.seitenGesamt, gebaut.seitenVorher);
p('Es gibt kein zweites „Normen und Regeln"',
  ersteRunde.titel.filter((t: string) => t === 'Normen und Regeln').length === 1,
  ersteRunde.titel.join(' | '));

/* ==========================================================================
 * §3 · Und ein zweites Mal auch nicht
 * --------------------------------------------------------------------------
 * Der eigentliche Punkt von §43. Wer seinen Vault zweimal einliest — aus
 * Versehen, oder weil er nicht sicher war —, darf nicht alles doppelt haben.
 * ========================================================================*/
console.log('\n3 · Und ein zweites Mal auch nicht');

const zweiteRunde = await einlesen();
gleich('Auch nach dem zweiten Einlesen dieselbe Anzahl',
  zweiteRunde.seitenGesamt, gebaut.seitenVorher);
gleich('Und weiterhin genau ein „Kabelquerschnitt"',
  zweiteRunde.titel.filter((t: string) => t === 'Kabelquerschnitt').length, 1);
p('Der Text steht auch nicht doppelt da',
  (zweiteRunde.kabelText.match(/Grenzwerte/g) || []).length <= 1,
  zweiteRunde.kabelText.slice(0, 200));

/* ==========================================================================
 * §4 · Ohne redion-id wird NICHT verschmolzen
 * --------------------------------------------------------------------------
 * Meine erste Fassung hiess hier „Ohne redion-id trägt der Pfad" und
 * erwartete, dass die Seite trotzdem wiedererkannt wird. NACHGESEHEN: das
 * Produkt tut bewusst das Gegenteil, und es hat recht.
 *
 * `ausgeben.ts` verlangt BEIDE Anker — Kennung UND Pfad — bevor es eine
 * vorhandene Seite überschreibt:
 *
 *     „Nur beide stabilen Anker gemeinsam erlauben ein destruktives
 *      Update. Eine passende ID ODER ein passender Pfad allein kann aus
 *      einer fremden Datei kopiert sein."
 *
 * Ein Pfad ist eben kein Geheimnis. Wer eine `Elektro/Normen und Regeln.md`
 * in seinen Ordner legt, hat damit noch kein Recht auf meine Seite. Fehlt
 * die Kennung, entsteht eine getrennte Fassung, und der Bericht sagt es.
 * §46 in einer Regel: lieber eine Seite zu viel als eine zerstörte.
 * ========================================================================*/
console.log('\n4 · Ohne redion-id wird NICHT verschmolzen');

const ohneId = await einlesen((_name, text) => text.replace(/^redion-id: .*$/m, ''));
p('Die alte Seite lebt unversehrt weiter', ohneId.normNoch);
gleich('Mit ihren Aliassen', ohneId.normAliasse.slice().sort(),
  ['NIN', 'Niederspannungs-Installationsnorm']);
p('Es entstehen getrennte Fassungen statt einer Verschmelzung',
  ohneId.seitenGesamt > gebaut.seitenVorher,
  `${ohneId.seitenGesamt} statt ${gebaut.seitenVorher}`);
p('Und der Bericht nennt die Konflikte beim Namen',
  /Konflikte getrennt behalten/.test(ohneId.bericht), ohneId.bericht.slice(0, 220));

/* ==========================================================================
 * §5 · Eine fremde Kennung wird nicht übernommen
 * ========================================================================*/
console.log('\n5 · Eine fremde Kennung wird nicht übernommen');

const fremdeId = await einlesen((name, text) =>
  /Kabelquerschnitt/.test(name)
    ? text.replace(/^redion-id: .*$/m, 'redion-id: "nicht-wirklich-eine-uuid"')
    : text);
p('Eine kaputte Kennung bringt die Einlesung nicht zu Fall',
  fremdeId.seitenGesamt >= gebaut.seitenVorher, `${fremdeId.seitenGesamt}`);
p('Und die vorhandene Seite bleibt unversehrt', fremdeId.normNoch);

/* ==========================================================================
 * §6 · Gleicher Titel ist KEIN Grund zu verschmelzen
 * --------------------------------------------------------------------------
 * Die Gegenrichtung, und die wichtigste. E129 sagt es ausdrücklich:
 * „mergen niemals allein nach Seitentitel". Täte Redion es doch, frässe ein
 * Import fremde Notizen auf, die zufällig gleich heissen.
 * ========================================================================*/
console.log('\n6 · Gleicher Titel ist kein Grund zu verschmelzen');

const fremdeSeite = await seite.evaluate(async (arg: any) => {
  const vorherListe = Object.values<any>(Store.cache.blocks)
    .filter(b => b?.alive !== false && b?.type === 'page' && b.parentTable !== 'collection');
  const vorher = vorherListe.length;
  const vorherIds = new Set(vorherListe.map((b: any) => String(b.id)));
  const alteKinderVorher = Store.childrenOf(arg.norm).length;
  const f = new File([
    '---\ntitle: "Normen und Regeln"\naliases: []\n---\n\nGanz andere Notizen.\n'
  ], 'Normen und Regeln.md', { type: 'text/markdown' });
  Object.defineProperty(f, 'webkitRelativePath',
    { value: 'Fremder-Vault/Woanders/Normen und Regeln.md' });
  const roh = await (globalThis as any).Austausch.ausMarkdownOrdner([f], Store.getBlock(arg.wurzel));
  await Store.flush();
  const seiten = Object.values<any>(Store.cache.blocks)
    .filter(b => b?.alive !== false && b?.type === 'page' && b.parentTable !== 'collection');
  /* NUR, WAS DIESER IMPORT ANGELEGT HAT. Vorher zählte dieser Abschnitt alle
     Seiten mit dem Titel — und fand vier: §4 hinterlässt absichtlich zwei
     getrennte Fassungen, und die zählten mit. Gemessen wird der Unterschied
     zwischen vorher und nachher, nicht der Bestand. */
  const neue = seiten.filter((b: any) => !vorherIds.has(b.id) && b.text === 'Normen und Regeln');
  return {
    vorher, nachher: seiten.length,
    bericht: String(roh?.hinweis || ''),
    wurzelTitel: String(roh?.seite?.text || ''),
    neueGleichnamige: neue.length,
    neueSeiten: seiten.filter((b: any) => !vorherIds.has(b.id)).map((b: any) => String(b.text || '')),
    neueEltern: neue.map((b: any) => String(Store.getBlock(b.parentId)?.text || '(Wurzel)')),
    alteNochDa: !!Store.getBlock(arg.norm),
    alteAliasse: (Store.getBlock(arg.norm)?.aliases || []).slice(),
    alteKinderVorher, alteKinderNachher: Store.childrenOf(arg.norm).length,
    alterText: Store.childrenOf(arg.norm).map((b: any) => String(b.text || '')).join(' ')
  };
}, gebaut);

/* GEZÄHLT WIRD, WAS DER BERICHT SAGT, nicht wie viele Seiten dazukommen.
   Der Import legt ausser der Notiz auch eine Vault-Wurzel und die Ordner an;
   eine Zahl wie „+1" wäre eine Behauptung über die Ordnerstruktur, nicht
   über das Wiedererkennen. Gemessen: +3, davon zwei Ordnerseiten. */
p('Der Import legt eine eigene Vault-Wurzel an',
  /^Aus Obsidian · /.test(fremdeSeite.wurzelTitel), fremdeSeite.wurzelTitel);
p('Der Bericht meldet die Notiz als NEU, nicht als wiedererkannt',
  /1 neu, 0 wiedererkannt/.test(fremdeSeite.bericht), fremdeSeite.bericht);
gleich('Es entsteht GENAU EINE neue Seite dieses Namens',
  fremdeSeite.neueGleichnamige, 1);
gleich('Die neue liegt in ihrem eigenen Ordner', fremdeSeite.neueEltern, ['Woanders']);
gleich('Und daneben nur die Vault-Wurzel und der Ordner',
  fremdeSeite.neueSeiten.filter((x: string) => x !== 'Normen und Regeln').sort(),
  ['Aus Obsidian · Fremder-Vault', 'Woanders']);
p('Die alte lebt unverändert weiter', fremdeSeite.alteNochDa);
gleich('Mit ihren Aliassen', fremdeSeite.alteAliasse.slice().sort(),
  ['NIN', 'Niederspannungs-Installationsnorm']);
gleich('Und mit genau so vielen Kindern wie vorher',
  fremdeSeite.alteKinderNachher, fremdeSeite.alteKinderVorher);
p('Ihr eigener Text steht noch da', /Niederspannung/.test(fremdeSeite.alterText),
  fremdeSeite.alterText.slice(0, 160));
p('Ohne den fremden dazwischen', !/Ganz andere Notizen/.test(fremdeSeite.alterText),
  fremdeSeite.alterText.slice(0, 200));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
