/* Suite 182 — Der lokale Erkennungsdienst (§39, L53)
 * ============================================================================
 * L53 hielt am 24. August fest: „⌁ Erkennen" erwartet einen Dienst unter
 * `http://127.0.0.1:8765/ocr`, und Redion lieferte keinen mit. Der Knopf war
 * eine Sackgasse — der Code dahinter echt, der Weg endet im Nichts.
 *
 * Seit E150 liegt der Dienst bei: `dienste/ocr.mts`. Diese Suite prüft ihn.
 *
 * ─── DER TRICK: TESSERACT WIRD ERSETZT ──────────────────────────────────────
 * Geprüft wird MEIN Dienst, nicht Tesseract. Deshalb legt die Suite ein
 * eigenes `tesseract` in einen Ordner und setzt PATH darauf. Es tut, was das
 * echte tut — Bild rein, Text auf stdout —, aber vorhersagbar.
 *
 * Das hat zwei Vorteile und ist der einzige ehrliche Weg:
 *   · Die Suite läuft auf jedem Rechner, auch ohne Tesseract.
 *   · Der gute Weg wird WIRKLICH durchlaufen, statt übersprungen. Eine
 *     Prüfung, die sich selbst überspringt, wenn ein Programm fehlt, ist
 *     genau die Prüfung, die nie rot wird (§55.2).
 * Und §6 nimmt das Ersatzprogramm wieder weg — dann muss der Dienst SAGEN,
 * dass tesseract fehlt, statt zu schweigen.
 *
 *   node pruefungen/lauf/test216.mts
 * ==========================================================================*/
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createTesseractStub, withTestPath } from '../ocr-test-stub.mjs';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 8765;

let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

const werkbank = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-ocr-pruefung-'));
const stubOrdner = path.join(werkbank, 'bin');
await fs.mkdir(stubOrdner);

/* Windows 11: der Test erzeugt ein echtes tesseract.exe mit dem
   systemeigenen Windows-PowerShell-C#-Compiler. Unter Unix bleibt es beim
   bisherigen ausführbaren sh-Skript. Der Produktivdienst verwendet weiter
   spawn('tesseract', ..., { shell:false }) und bleibt unverändert. */
await createTesseractStub(stubOrdner);

/* Ein winziges, gültiges PNG (1×1, rot) — echte Bytes, kein Platzhalter. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64');

const starten = (pfad: string): ChildProcess => spawn(
  process.execPath, [path.join(WURZEL, 'dienste', 'ocr.mts'), '--port', String(PORT)],
  { env: withTestPath(process.env, pfad), stdio: ['ignore', 'pipe', 'pipe'] });

const wartenAufBereit = async (kind: ChildProcess): Promise<boolean> => {
  for (let versuch = 0; versuch < 60; versuch++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/gesund`);
      if (r.ok) return true;
    } catch { /* noch nicht oben */ }
    await new Promise(r => setTimeout(r, 100));
    if (kind.exitCode !== null) return false;
  }
  return false;
};

const senden = async (opts: { datei?: Buffer; name?: string; sprache?: string;
                              ohneDatei?: boolean } = {}): Promise<any> => {
  const form = new FormData();
  if (!opts.ohneDatei)
    form.append('file', new Blob([new Uint8Array(opts.datei ?? PNG)], { type: 'image/png' }),
      opts.name ?? 'ausschnitt.png');
  form.append('language', opts.sprache ?? 'deu+eng');
  form.append('kind', 'document');
  const antwort = await fetch(`http://127.0.0.1:${PORT}/ocr`, { method: 'POST', body: form });
  return { code: antwort.status, typ: antwort.headers.get('content-type') || '',
           koerper: await antwort.json().catch(() => null) };
};

const stoppen = async (kind: ChildProcess): Promise<void> => {
  kind.kill('SIGTERM');
  await new Promise(r => { kind.on('exit', r); setTimeout(r, 2000); });
};

/* ==========================================================================
 * §1 · Der Dienst startet und meldet sich
 * ========================================================================*/
console.log('\n1 · Der Dienst startet und meldet sich');
const dienst = starten(stubOrdner + path.delimiter + (process.env['PATH'] || process.env['Path'] || ''));
const fehlerstrom: string[] = [];
dienst.stderr?.on('data', (d: Buffer) => fehlerstrom.push(d.toString()));
p('Er ist innerhalb von sechs Sekunden oben', await wartenAufBereit(dienst),
  fehlerstrom.join(' ').slice(0, 200));

/* ==========================================================================
 * §2 · Ein Ausschnitt kommt als Text zurück
 * ========================================================================*/
console.log('\n2 · Ein Ausschnitt kommt als Text zurück');
const erkannt = await senden();
gleich('Die Antwort ist ein 200er', erkannt.code, 200);
p('Und JSON', /application\/json/.test(erkannt.typ), erkannt.typ);
p('Der Text ist da', /Verteiler UV3/.test(String(erkannt.koerper?.text || '')),
  JSON.stringify(erkannt.koerper).slice(0, 160));

/* DIE VIER FELDER, DIE `recognition.ts` LIEST. Nachgesehen, nicht geraten:
   `text`, `language`, `engine`, `version`, `confidence` — und `confidence`
   darf `null` sein, dann zeigt die App keine an. */
gleich('Die Sprache kommt zurück, wie sie geschickt wurde',
  erkannt.koerper?.language, 'deu+eng');
gleich('Der Erkenner nennt sich', erkannt.koerper?.engine, 'tesseract');
gleich('Und nennt seine Fassung', erkannt.koerper?.version, '5.9.0');
gleich('Eine Sicherheit wird NICHT erfunden', erkannt.koerper?.confidence, null);

/* Der Dienst muss die Datei wirklich hinschreiben — sonst hätte das
   Ersatzprogramm sie nicht lesen können. */
p('Das Bild kam als Datei an, mit allen Bytes',
  new RegExp('Bytes ' + PNG.length).test(String(erkannt.koerper?.text || '')),
  String(erkannt.koerper?.text || '').replace(/\n/g, ' · '));

/* ==========================================================================
 * §3 · Die Sprachangabe wird geprüft, nicht durchgereicht
 * --------------------------------------------------------------------------
 * Sie kommt aus dem Browser und landet in der Befehlszeile eines fremden
 * Programms. Was nicht wie eine Sprachkennung aussieht, wird verworfen.
 * ========================================================================*/
console.log('\n3 · Die Sprachangabe wird geprüft');
const boese = await senden({ sprache: 'deu; rm -rf /' });
gleich('Eine erfundene Sprachangabe wird durch die Vorgabe ersetzt',
  boese.koerper?.language, 'deu+eng');
p('Und erreicht das Programm nicht',
  !/rm -rf/.test(String(boese.koerper?.text || '')), String(boese.koerper?.text || ''));
const kurdisch = await senden({ sprache: 'kur' });
gleich('Eine echte Sprachkennung dagegen schon', kurdisch.koerper?.language, 'kur');

/* ==========================================================================
 * §4 · Was fehlt oder zu gross ist, wird gesagt
 * ========================================================================*/
console.log('\n4 · Was fehlt oder zu gross ist, wird gesagt');
const ohne = await senden({ ohneDatei: true });
gleich('Ohne Bild kommt ein 400er', ohne.code, 400);
p('Mit einem Satz, der es erklärt', /file/.test(String(ohne.koerper?.fehler || '')),
  String(ohne.koerper?.fehler || ''));

const zuGross = await senden({ datei: Buffer.alloc(13 * 1024 * 1024, 7), name: 'gross.png' })
  .catch((e: unknown) => ({ code: 0, koerper: { fehler: String(e) } } as any));
p('Ein zu grosser Ausschnitt wird abgelehnt', zuGross.code === 413 || zuGross.code === 0,
  `${zuGross.code} ${JSON.stringify(zuGross.koerper).slice(0, 90)}`);

/* Und der Dienst lebt danach weiter — ein abgelehnter Ausschnitt darf ihn
   nicht mitnehmen. */
const danach = await senden();
gleich('Der Dienst antwortet danach weiter', danach.code, 200);

/* ==========================================================================
 * §5 · Er hört nur auf 127.0.0.1
 * --------------------------------------------------------------------------
 * Ein Erkenner, den das ganze WLAN erreicht, ist ein Erkenner, an den jeder
 * Bilder schicken kann.
 * ========================================================================*/
console.log('\n5 · Er hört nur auf 127.0.0.1');
const auswaerts = await new Promise<string>(fertig => {
  const netz = Object.values(os.networkInterfaces()).flat()
    .find(n => n && n.family === 'IPv4' && !n.internal);
  fertig(netz?.address || '');
});
if (auswaerts) {
  const erreichbar = await fetch(`http://${auswaerts}:${PORT}/gesund`)
    .then(() => true).catch(() => false);
  p('Von der eigenen Netzwerkadresse aus ist er NICHT erreichbar', !erreichbar, auswaerts);
} else {
  p('Diese Maschine hat keine äussere Adresse zum Prüfen', true, '(übersprungen)');
}
/* Die Gegenrichtung, damit der Punkt darüber etwas bedeutet. */
const innen = await fetch(`http://127.0.0.1:${PORT}/gesund`).then(r => r.ok).catch(() => false);
p('Über 127.0.0.1 dagegen schon', innen);

/* ==========================================================================
 * §6 · Ohne tesseract sagt er es, statt zu schweigen
 * --------------------------------------------------------------------------
 * Das ist die Lage von L53, nur eine Stufe weiter innen: der Nutzer hat den
 * Dienst gestartet, aber den Erkenner nicht installiert. Er muss erfahren,
 * was fehlt und wo es steht.
 * ========================================================================*/
console.log('\n6 · Ohne tesseract sagt er es');
await stoppen(dienst);
const leerOrdner = path.join(werkbank, 'leer');
await fs.mkdir(leerOrdner);
const nackt = starten(leerOrdner);
p('Der Dienst startet auch ohne Erkenner', await wartenAufBereit(nackt));
const ohneErkenner = await senden();
gleich('Der Versuch endet mit 500', ohneErkenner.code, 500);
const satz = String(ohneErkenner.koerper?.fehler || '');
p('Er sagt, dass tesseract fehlt', /tesseract/i.test(satz) && /nicht installiert/i.test(satz), satz);
p('Und wohin man dafür schaut', /OCR-DIENST\.md/.test(satz), satz);
await stoppen(nackt);

/* ==========================================================================
 * §7 · Die Anleitung gibt es wirklich
 * ========================================================================*/
console.log('\n7 · Die Anleitung gibt es wirklich');
const anleitung = await fs.readFile(path.join(WURZEL, 'doku', 'OCR-DIENST.md'), 'utf8')
  .catch(() => '');
p('doku/OCR-DIENST.md liegt im Verzeichnis', !!anleitung, `${anleitung.length} Zeichen`);
p('Sie nennt den Startbefehl', /node dienste\/ocr\.mts/.test(anleitung));
p('Sie sagt, wie tesseract installiert wird', /apt|brew|winget|choco/i.test(anleitung));
p('Und dass nichts den Rechner verlässt', /verl(ä|ae)sst|localhost|127\.0\.0\.1/i.test(anleitung));

/* ==========================================================================
 * §8 · Der Einrichtungsdialog nennt den Weg
 * --------------------------------------------------------------------------
 * Der Kern von L53 war nicht der fehlende Dienst, sondern die fehlende
 * Auskunft: ein Eingabefeld, das nach einer Adresse fragt, ohne zu sagen,
 * dass dahinter ein Programm laufen muss. Geprüft am Quelltext, weil der
 * Dialog nur beim allerersten Klick erscheint und ein Bild davon nichts
 * festhielte.
 * ========================================================================*/
console.log('\n8 · Der Einrichtungsdialog nennt den Weg');
const erkennung = await fs.readFile(
  path.join(WURZEL, 'quell', 'bereiche', 'dateien', 'recognition.js'), 'utf8').catch(() => '');
p('Das erzeugte Modul liegt da', !!erkennung, `${erkennung.length} Zeichen`);
p('Der Dialog nennt den Startbefehl', /node dienste\/ocr\.mts/.test(erkennung));
p('Und die Anleitung', /OCR-DIENST\.md/.test(erkennung));
p('Und sagt, dass nichts ins Netz geht', /nichts geht ins Netz/.test(erkennung));

/* ==========================================================================
 * §9 · Die Doku behauptet nicht mehr, es gebe kein OCR
 * ========================================================================*/
console.log('\n9 · Die Doku behauptet nicht mehr, es gebe kein OCR');
const mehr = await fs.readFile(path.join(WURZEL, 'doku', 'WAS-REDION-MEHR-KANN.md'), 'utf8')
  .catch(() => '');
p('Die Datei gibt es', !!mehr);
gleich('„Kein OCR" steht nicht mehr darin',
  (mehr.match(/Kein OCR/gi) || []).length, 0);

/* ========================================================================*/
await fs.rm(werkbank, { recursive: true, force: true });
console.log(`\n${ok}/${ok + weg} bestanden`);
process.exitCode = weg ? 1 : 0;
