/* Suite 184 — Die Besprechung wird eine Seite, und die Aufgabe eine Aufgabe (§41)
 * ============================================================================
 * §41 des Auftrags zählt sieben Dinge auf, die aus einer Besprechung werden
 * sollen — Audio, Transkript, Zusammenfassung, Entscheidungen, Aufgaben,
 * Zeitmarken, Quellen — und stellt einen Satz daneben, der wichtiger ist als
 * die Liste:
 *
 *     „Aufgabe aus Meeting bleibt normale Redion-Aufgabe."
 *
 * Das ist §52 in einem Satz: keine zweite Aufgabenwelt neben der ersten. Eine
 * Aufgabe aus einer Besprechung muss dort auftauchen, wo alle Aufgaben
 * auftauchen — sonst hat man zwei Listen, und die eine wird vergessen.
 *
 * `besprechung.ts` konnte das alles schon; NACHGESEHEN, welcher Prüflauf es
 * deckte: test32 prüft den Seitenleisten-Abschnitt, test35 einen Menüeintrag
 * für die KI-Anweisung. Die Auswertung selbst, die Seite, die Zeitmarken und
 * die Aufgaben-Datenbank waren ungeprüft. Das hier ist der fehlende Lauf.
 *
 * ─── WAS DIESE SUITE NICHT PRÜFT, UND WARUM ────────────────────────────────
 * `auswerten()` fragt die KI. Ohne Modell gibt es nichts zu messen, und mit
 * einem erfundenen Modell prüfte man die Erfindung. Geprüft wird deshalb
 * alles NACH der Auswertung: `seiteAnlegen` bekommt genau die Form, die der
 * Auftrag an die KI verlangt (`besprechung.ts`, Zeile 329 ff.) — nachgelesen,
 * nicht erfunden. Die Aufnahme selbst braucht ein Mikrofon; §5 prüft
 * stattdessen die Zeitmarken-Rechnung ohne Ton.
 *
 * ─── KANN DIESE SUITE ROT WERDEN? (§55.2) ───────────────────────────────────
 * §7 ist die Gegenrichtung: ein leeres Ergebnis darf KEINE Abschnitte
 * erfinden. Die Gegenproben stehen in E152.
 *
 *   node pruefungen/lauf/test218.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8976;

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
const seite = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
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
 * §1 · Aus einer Besprechung wird eine Seite mit allem, was §41 nennt
 * ========================================================================*/
console.log('\n1 · Aus einer Besprechung wird eine Seite');

const angelegt = await seite.evaluate(async () => {
  const M = (globalThis as any).Meeting;
  if (!M?.seiteAnlegen) return null;

  /* Ein echter Anhang auf dem echten Weg — kein erfundener Datensatz. */
  const ton = new File([new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4])],
    'Bauleitung.webm', { type: 'audio/webm' });
  const platz = Store.uid();
  const satz = await (globalThis as any).Dateien.ablegen(ton, { blockId: platz, name: ton.name });

  /* GENAU DIE FORM, DIE `auswerten` VERLANGT — nachgelesen in der Anweisung
     an die KI, nicht erfunden. */
  const ergebnis = {
    titel: 'Bauleitung Halle 3',
    zusammenfassung: ['Verteiler UV3 wird versetzt', 'Kabelweg über die Nordseite'],
    entscheidungen: ['Querschnitt bleibt bei 16 mm²'],
    aufgaben: [
      { was: 'Verteiler UV3 versetzen', wer: 'Redur', bis: '2026-09-04' },
      { was: 'Kabelliste nachführen', wer: '', bis: '' }
    ],
    themen: ['Elektro Installation', 'Baustelle'],
    beteiligte: ['Redur', 'Bauleitung']
  };
  const transkript = M.transkriptText([
    { sek: 0, text: 'Wir fangen an.' },
    { sek: 62, text: 'Der Verteiler muss versetzt werden.' },
    { sek: 125, text: 'Querschnitt bleibt.' }
  ]);
  const audio = { dateiId: satz.id, blockId: platz, name: ton.name, typ: ton.type,
    marken: [{ sek: 62, text: 'Verteiler' }, { sek: 125, text: 'Querschnitt' }] };

  const p = M.seiteAnlegen(ergebnis, transkript, 187, audio);
  await Store.flush();

  const kinder = Store.childrenOf(p.id);
  const ueber = kinder.filter((b: any) => b.type === 'h2').map((b: any) => String(b.text || ''));
  return {
    seite: p.id, titel: String(p.text || ''), besprechung: p.besprechung === true,
    icon: String(p.icon || ''),
    ueberschriften: ueber,
    arten: kinder.map((b: any) => b.type),
    texte: kinder.map((b: any) => String(b.text || '')),
    transkriptText: transkript,
    dateiId: satz.id, audioPlatz: platz
  };
});

p('Die Besprechungsfläche ist da', !!angelegt, 'Meeting.seiteAnlegen fehlt');
p('Der Titel trägt das Thema und ein Datum',
  /^Bauleitung Halle 3 · \d/.test(angelegt?.titel || ''), angelegt?.titel);
p('Die Seite ist als Besprechung erkennbar', angelegt?.besprechung === true);
gleich('Und trägt das Mikrofon-Zeichen', angelegt?.icon, '🎙');

/* §41 zählt sieben Dinge auf. Fünf davon sind eigene Abschnitte. */
for (const abschnitt of ['Zusammenfassung', 'Entscheidungen', 'Aufgaben', 'Themen',
                         'Aufnahme', 'Zeitmarken'])
  p(`§41 nennt „${abschnitt}" — die Seite hat den Abschnitt`,
    (angelegt?.ueberschriften || []).includes(abschnitt),
    (angelegt?.ueberschriften || []).join(' | '));

p('Die Entscheidung steht als Zitat da',
  (angelegt?.texte || []).some((t: string) => /16 mm²/.test(t)),
  (angelegt?.texte || []).join(' | ').slice(0, 160));
p('Und die beiden Aufgaben als Häkchen',
  (angelegt?.arten || []).filter((a: string) => a === 'todo').length === 2,
  (angelegt?.arten || []).join(', '));
p('Die Aufgabe nennt, wer und bis wann',
  (angelegt?.texte || []).some((t: string) => /Verteiler UV3 versetzen — Redur \(bis 2026-09-04\)/.test(t)),
  (angelegt?.texte || []).filter((t: string) => /Verteiler/.test(t)).join(' | '));

/* ==========================================================================
 * §2 · Die Aufgabe aus der Besprechung IST eine normale Redion-Aufgabe
 * --------------------------------------------------------------------------
 * Der Satz aus §41, und der Kern von §52. Geprüft wird nicht, dass es
 * irgendwo eine Zeile gibt, sondern dass sie in derselben Liste steht wie
 * jede andere Aufgabe.
 * ========================================================================*/
console.log('\n2 · Die Aufgabe ist eine normale Redion-Aufgabe');

const aufgaben = await seite.evaluate((ids: any) => {
  const alle = (globalThis as any).Bibliothek?.meineAufgaben
    ? (globalThis as any).Bibliothek.meineAufgaben() : null;
  const db = Object.values<any>(Store.cache.collections)
    .find(c => c.name === 'Aufgaben aus Besprechungen');
  const zeilen = db ? Store.rowsOf(db.id) : [];
  return {
    dbDa: !!db,
    /* Eine gewöhnliche Sammlung, kein Sonderfach: die Zeilen sind Blöcke
       mit `parentTable: 'collection'`, wie überall sonst. */
    zeilenSindBloecke: zeilen.every((r: any) => r.parentTable === 'collection'),
    zeilen: zeilen.map((r: any) => ({
      text: String(r.text || ''), wer: String(r.props?.wer || ''),
      bis: String(r.props?.bis || ''), status: String(r.props?.status || ''),
      quelle: String(r.props?.quelle || ''), seite: String(r.props?.seite || '')
    })),
    inMeineAufgaben: alle === null ? null
      : alle.filter((a: any) => /Verteiler UV3 versetzen|Kabelliste/.test(String(a.titel || a.text || '')))
            .map((a: any) => String(a.titel || a.text || '')),
    seite: ids.seite
  };
}, angelegt);

p('Es gibt eine Datenbank „Aufgaben aus Besprechungen"', aufgaben.dbDa);
gleich('Mit beiden Aufgaben darin', aufgaben.zeilen.length, 2);
p('Ihre Zeilen sind gewöhnliche Sammlungszeilen', aufgaben.zeilenSindBloecke);
p('Die erste trägt Wer und Bis',
  aufgaben.zeilen.some((z: any) => z.text === 'Verteiler UV3 versetzen' &&
    z.wer === 'Redur' && z.bis === '2026-09-04'), JSON.stringify(aufgaben.zeilen[0]));
p('Beide stehen auf „Offen"',
  aufgaben.zeilen.every((z: any) => z.status === 'Offen'),
  aufgaben.zeilen.map((z: any) => z.status).join(', '));
p('Und zeigen auf die Besprechungsseite zurück',
  aufgaben.zeilen.every((z: any) => z.seite === aufgaben.seite),
  aufgaben.zeilen.map((z: any) => z.seite).join(', '));

/* DER PUNKT, AUF DEN ES ANKOMMT — und der, an dem etwas fehlte.
   Die Datenbank hat eine Spalte „Wer". Bis zum 25. August entschied allein,
   OB es eine Personenspalte gibt; eine LEERE Zelle darin hiess „gehört
   niemandem", und die Zeile stand in keiner Liste. Ausgerechnet die
   unverteilte Aufgabe — die, an die sich sonst niemand erinnert — war
   unsichtbar (E152).

   Erwartet wird jetzt genau eine: „Kabelliste nachführen" hat kein „Wer"
   und gehört damit dem, der die Besprechung angelegt hat. „Verteiler UV3
   versetzen" steht auf Redur und gehört in DESSEN Liste, nicht in meine —
   das ist richtig so und bleibt. */
gleich('Die unverteilte Aufgabe steht in meiner Liste',
  aufgaben.inMeineAufgaben, ['Kabelliste nachführen']);
p('Und die auf einen anderen Namen nicht',
  !(aufgaben.inMeineAufgaben || []).includes('Verteiler UV3 versetzen'),
  JSON.stringify(aufgaben.inMeineAufgaben));

/* ==========================================================================
 * §3 · Zeitmarken zeigen auf die Sekunde im Ton
 * ========================================================================*/
console.log('\n3 · Zeitmarken zeigen auf die Sekunde im Ton');

const marken = await seite.evaluate((ids: any) => {
  const kinder = Store.childrenOf(ids.seite);
  const audio = kinder.find((b: any) => b.type === 'audio');
  const mitVerweis = kinder.filter((b: any) => b.audioRef);
  return {
    audioDa: !!audio, audioId: String(audio?.id || ''),
    audioDatei: String(audio?.dateiId || ''),
    marken: mitVerweis.map((b: any) => ({
      text: String(b.text || ''), sek: b.audioRef.sek,
      zielBlock: String(b.audioRef.blockId || ''), zielDatei: String(b.audioRef.dateiId || '')
    }))
  };
}, angelegt);

p('Der Ton steht als Audio-Block auf der Seite', marken.audioDa);
gleich('Und trägt die Kennung aus der Dateiablage', marken.audioDatei, angelegt?.dateiId);
p('Zwei Zeitmarken zeigen auf ihn',
  marken.marken.filter((m: any) => /^\d\d:\d\d · /.test(m.text)).length === 2,
  JSON.stringify(marken.marken.map((m: any) => m.text)));
gleich('Mit der richtigen Sekunde',
  marken.marken.filter((m: any) => /·/.test(m.text)).map((m: any) => m.sek), [62, 125]);
p('Und 62 Sekunden stehen als 01:02 da',
  marken.marken.some((m: any) => m.text.startsWith('01:02 · Verteiler')),
  JSON.stringify(marken.marken.map((m: any) => m.text)));
p('Jeder Verweis nennt denselben Audio-Block',
  marken.marken.every((m: any) => m.zielBlock === marken.audioId),
  marken.marken.map((m: any) => m.zielBlock).join(', '));

/* ==========================================================================
 * §4 · Das volle Transkript ist da — eingeklappt, mit Sprungmarken
 * ========================================================================*/
console.log('\n4 · Das volle Transkript ist da');

const transkript = await seite.evaluate((ids: any) => {
  const t = Store.childrenOf(ids.seite).find((b: any) => b.type === 'toggle');
  if (!t) return null;
  const zeilen = Store.childrenOf(t.id);
  return {
    titel: String(t.text || ''), offen: t.open === true,
    zeilen: zeilen.map((b: any) => ({ text: String(b.text || ''), sek: b.audioRef?.sek ?? null }))
  };
}, angelegt);

p('Es steht in einem Aufklapper', !!transkript, 'kein toggle-Block');
gleich('Der „Volles Transkript" heisst', transkript?.titel, 'Volles Transkript');
p('Und zugeklappt ist — sonst wäre die Seite eine Wand aus Text',
  transkript?.offen === false, `open: ${transkript?.offen}`);
gleich('Alle drei Zeilen sind da', transkript?.zeilen.length, 3);
gleich('Und jede kennt ihre Sekunde', transkript?.zeilen.map((z: any) => z.sek), [0, 62, 125]);

/* ==========================================================================
 * §5 · Die Zeitrechnung stimmt, auch ohne Mikrofon
 * ========================================================================*/
console.log('\n5 · Die Zeitrechnung stimmt');

const zeiten = await seite.evaluate(() => {
  const M = (globalThis as any).Meeting;
  return {
    text: [0, 9, 62, 125, 600, 3661].map((s: number) => M.zeitText(s)),
    /* `transkriptText` ist die Form, in der das Protokoll gespeichert wird —
       sie muss zu dem Muster passen, das `seiteAnlegen` wieder ausliest. */
    protokoll: M.transkriptText([{ sek: 5, text: 'Erstens' }, { sek: 605, text: 'Zweitens' }]),
    /* Ohne laufende Aufnahme gibt es keine Marke — statt einer erfundenen. */
    ohneAufnahme: M.markieren('Test')
  };
});
gleich('Sekunden werden zu Minuten und Sekunden',
  zeiten.text, ['00:00', '00:09', '01:02', '02:05', '10:00', '61:01']);
gleich('Das Protokoll trägt die Zeit vorn',
  zeiten.protokoll, '[00:05] Erstens\n[10:05] Zweitens');
gleich('Ohne laufende Aufnahme gibt es keine Zeitmarke', zeiten.ohneAufnahme, null);

/* ==========================================================================
 * §6 · Was der Nutzer nicht will, wird nicht gespeichert
 * ========================================================================*/
console.log('\n6 · Was der Nutzer nicht will, wird nicht gespeichert');

const sparsam = await seite.evaluate(async () => {
  const M = (globalThis as any).Meeting;
  Store.setMeta('meet:audio', false);
  Store.setMeta('meet:transkriptWeg', true);
  const p = M.seiteAnlegen(
    { titel: 'Kurz', zusammenfassung: ['Eins'], entscheidungen: [], aufgaben: [], themen: [], beteiligte: [] },
    '[00:00] Etwas gesagt', 30,
    { dateiId: 'x', blockId: 'y', name: 'a.webm', typ: 'audio/webm', marken: [{ sek: 3, text: 'M' }] });
  await Store.flush();
  Store.setMeta('meet:audio', true);
  Store.setMeta('meet:transkriptWeg', false);
  const kinder = Store.childrenOf(p.id);
  return {
    arten: kinder.map((b: any) => b.type),
    ueber: kinder.filter((b: any) => b.type === 'h2').map((b: any) => String(b.text || ''))
  };
});
gleich('Ohne „Ton behalten" gibt es keinen Audio-Block',
  sparsam.arten.filter((a: string) => a === 'audio').length, 0);
p('Und keine Zeitmarken, die auf nichts zeigen',
  !sparsam.ueber.includes('Zeitmarken'), sparsam.ueber.join(' | '));
p('Mit „Transkript löschen" auch keinen Aufklapper',
  !sparsam.arten.includes('toggle'), sparsam.arten.join(', '));
p('Die Zusammenfassung bleibt aber', sparsam.ueber.includes('Zusammenfassung'),
  sparsam.ueber.join(' | '));

/* ==========================================================================
 * §7 · Ein leeres Ergebnis erfindet keine Abschnitte
 * --------------------------------------------------------------------------
 * Die Gegenrichtung zu §1. Ohne sie wäre „die Seite hat den Abschnitt"
 * auch dann grün, wenn die Seite ihn IMMER hätte.
 * ========================================================================*/
console.log('\n7 · Ein leeres Ergebnis erfindet keine Abschnitte');

const leer = await seite.evaluate(async () => {
  const M = (globalThis as any).Meeting;
  const p = M.seiteAnlegen({ titel: 'Ohne Inhalt' }, '', 0, null);
  await Store.flush();
  const kinder = Store.childrenOf(p.id);
  const db = Object.values<any>(Store.cache.collections)
    .find(c => c.name === 'Aufgaben aus Besprechungen');
  return {
    ueber: kinder.filter((b: any) => b.type === 'h2').map((b: any) => String(b.text || '')),
    arten: kinder.map((b: any) => b.type),
    zeilen: db ? Store.rowsOf(db.id).length : -1
  };
});
gleich('Keine einzige Überschrift', leer.ueber, []);
gleich('Kein Audio, kein Aufklapper, kein Häkchen',
  leer.arten.filter((a: string) => ['audio', 'toggle', 'todo'].includes(a)), []);
p('Nur der Kopf mit Datum und Dauer', leer.arten.includes('callout'), leer.arten.join(', '));
gleich('Und die Aufgabendatenbank wächst nicht', leer.zeilen, 2);

/* ==========================================================================
 * §8 · Wem eine Aufgabe gehört — und wem nicht
 * --------------------------------------------------------------------------
 * Steht hier, weil §2 die Frage aufgeworfen hat. Beim Messen dafür kam etwas
 * heraus, das mit Besprechungen nichts zu tun hat und schwerer wiegt:
 *
 *     Name in den Einstellungen leer („Ich")   5 Aufgaben
 *     Name „Redur"                             0 Aufgaben
 *
 * Derselbe Bestand, nur der eigene Name geändert — und die ganze
 * Aufgabenliste war weg. `Store.addRow` schrieb `erstelltVon` gar nicht, und
 * der Vergleich lief gegen den Ersatzwert (L56, E153).
 *
 * Die Regel ist jetzt in einem Satz zu sagen: eine gefüllte Personenzelle
 * sagt, wem die Zeile gehört; steht nirgends ein Name, gehört sie dem, der
 * zusieht. Und sie steht an zwei Stellen gleich — `bibliothek.ts` und
 * `lebensbereiche.ts` —, was §4 nachprüft.
 * ========================================================================*/
console.log('\n8 · Wem eine Aufgabe gehört — und wem nicht');

const besitz = await seite.evaluate(async () => {
  const B = (globalThis as any).Bibliothek;
  const s = Store.addPage(null, { text: 'Baustelle' });

  /* Eine Datenbank OHNE Personenspalte — der Normalfall für eine eigene
     Liste. */
  const ohne = Store.addDatabase(s.id, 'Ohne Personen',
    { title: { name: 'Aufgabe', type: 'title' }, fertig: { name: 'Fertig', type: 'checkbox' } });
  const z1 = Store.addRow(ohne.collectionId, { fertig: false });
  Store.updateBlock(z1.id, { text: 'Eigene Zeile' });

  /* Und eine MIT Personenspalte, in drei Ausprägungen. */
  const mit = Store.addDatabase(s.id, 'Mit Personen', {
    title: { name: 'Aufgabe', type: 'title' }, wer: { name: 'Wer', type: 'person' },
    fertig: { name: 'Fertig', type: 'checkbox' } });
  const leerZelle = Store.addRow(mit.collectionId, { wer: '', fertig: false });
  Store.updateBlock(leerZelle.id, { text: 'Niemandem zugeteilt' });
  const fremd = Store.addRow(mit.collectionId, { wer: 'Sara', fertig: false });
  Store.updateBlock(fremd.id, { text: 'Für Sara' });
  const meine = Store.addRow(mit.collectionId, { wer: 'Redur', fertig: false });
  Store.updateBlock(meine.id, { text: 'Für Redur' });
  await Store.flush();

  const titel = (): string[] => (B.meineAufgaben() || []).map((a: any) => String(a.titel || a.text || ''));
  const alt = Store.getMeta('nutzer', '');
  const ohneNamen = titel();
  Store.setMeta('nutzer', 'Redur');
  const alsRedur = titel();
  Store.setMeta('nutzer', alt);
  return {
    ohneNamen: ohneNamen.filter((x: string) => /Eigene Zeile|zugeteilt|Sara|Redur/.test(x)),
    alsRedur: alsRedur.filter((x: string) => /Eigene Zeile|zugeteilt|Sara|Redur/.test(x)),
    /* Und der Vermerk, der bis zum 25. August fehlte. */
    vermerk: String(Store.getBlock(z1.id)?.erstelltVon || '')
  };
});

gleich('Ohne eigenen Namen gehören mir die zuteilungsfreien Zeilen',
  besitz.ohneNamen.sort(), ['Eigene Zeile', 'Niemandem zugeteilt']);
gleich('Mit dem Namen „Redur" kommt seine Zeile dazu — und die Liste bleibt',
  besitz.alsRedur.sort(), ['Eigene Zeile', 'Für Redur', 'Niemandem zugeteilt']);
p('Saras Zeile bleibt in beiden Fällen draussen',
  !besitz.ohneNamen.includes('Für Sara') && !besitz.alsRedur.includes('Für Sara'),
  JSON.stringify([besitz.ohneNamen, besitz.alsRedur]));
p('Und eine neue Zeile vermerkt jetzt, wer sie angelegt hat',
  !!besitz.vermerk, besitz.vermerk || '(leer)');

/* ==========================================================================
 * §9 · Und beide Aufgabenlisten antworten gleich
 * --------------------------------------------------------------------------
 * `bibliothek.ts` und `lebensbereiche.ts` entscheiden dieselbe Frage. Zwei
 * Listen mit zwei Antworten sind schlimmer als eine schlechte (E147).
 * ========================================================================*/
console.log('\n9 · Und beide Aufgabenlisten antworten gleich');

const quelltext = fs.readFileSync(
  path.join(WURZEL, 'src/bereiche/wissen/lebensbereiche.ts'), 'utf8');
p('Die zweite Liste vergleicht nicht mehr mit dem Anleger',
  !/erstelltVon \|\| 'Ich'\), 160\)\.toLocaleLowerCase\('de-CH'\) === name/.test(quelltext));
p('Sondern zählt die eingetragenen Personen',
  /if \(!eingetragen\.length\) return true;/.test(quelltext));

/* ========================================================================*/
console.log(`\n${ok}/${ok + weg} bestanden`);
if (fehler.length) console.log('Browserfehler:\n  ' + fehler.join('\n  '));
p('Keine unbehandelten Browserfehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
await new Promise<void>(f => { server.close(() => f()); });
process.exitCode = weg ? 1 : 0;
