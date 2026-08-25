/* Redion · Lokaler Erkennungsdienst
 * ============================================================================
 * WARUM DAS HIER STEHT UND NICHT IN DER APP.
 *
 * Ein Browser kann keine Schrift aus einem Bild lesen. Redion kann also
 * entweder das Bild irgendwohin schicken — dann sind die Daten nicht mehr
 * beim Nutzer (§21, §24) — oder einen Dienst ansprechen, der auf DEMSELBEN
 * Rechner läuft. Redion tut das Zweite: `recognition.ts` sendet nur an
 * `localhost`, fragt jedes Mal, und das Original bleibt unberührt.
 *
 * Bis zum 25. August lieferte Redion aber keinen solchen Dienst mit und
 * beschrieb auch keinen. Der Knopf „⌁ Erkennen" fragte nach einer Adresse,
 * hinter der nichts war (L53). Das hier ist die Adresse.
 *
 * WAS ER TUT
 *
 *   POST /ocr   multipart/form-data mit `file`, `language`, `kind`
 *   →           { text, language, engine, version, confidence }
 *
 * Genau das erwartet `recognition.ts`. Was der Dienst zurückgibt, landet
 * neben dem Bild in `ocrText`; das Bild selbst wird nie verändert.
 *
 * WAS ER NICHT TUT
 *
 *   Er hört nur auf 127.0.0.1. Kein anderer Rechner erreicht ihn.
 *   Er schickt nichts weiter. Kein Netz, keine Cloud, kein Konto.
 *   Er behält nichts. Die Zwischendatei wird gelöscht, auch im Fehlerfall.
 *
 * WOMIT ER LIEST
 *
 * Mit `tesseract`, dem freien Erkenner, der auf jedem Betriebssystem in zwei
 * Zeilen installiert ist. Er wird als eigenes Programm aufgerufen, nicht
 * über eine Shell — ein Dateiname aus dem Browser kann damit nichts
 * ausführen.
 *
 * STARTEN
 *
 *   node dienste/ocr.mts
 *   node dienste/ocr.mts --port 8765 --sprachen deu+eng
 *
 * Die Anleitung mit Installation und Fehlersuche steht in
 * `doku/OCR-DIENST.md`.
 * ==========================================================================*/
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/* --- Grenzen -------------------------------------------------------------
   Dieselben Zahlen wie in `recognition.ts`. Stünden hier andere, hätte der
   Nutzer je nach Seite zwei verschiedene Antworten auf dieselbe Frage. */
const MAX_BYTES = 12 * 1024 * 1024;      /* so gross darf ein Ausschnitt sein */
const MAX_TEXT = 20000;                  /* so lang darf die Antwort sein */
const ZEITLIMIT = 60000;                 /* so lange darf tesseract rechnen */

const argument = (name: string, ersatz: string): string => {
  const i = process.argv.indexOf('--' + name);
  const wert = i >= 0 ? process.argv[i + 1] : undefined;
  return wert && !wert.startsWith('--') ? wert : ersatz;
};

const PORT = Number(argument('port', '8765'));
const STANDARD_SPRACHEN = argument('sprachen', 'deu+eng');

/* Nur das, was `tesseract` als Sprachkennung überhaupt annimmt. Alles andere
   wird verworfen, statt weitergereicht. */
const SPRACHEN_MUSTER = /^[a-z]{3}(\+[a-z]{3})*$/;

/** Ein Feld aus einem multipart-Körper. Absichtlich klein gehalten: der
    Dienst bekommt genau ein Bild und zwei kurze Zeichenketten. */
interface Feld { name: string; dateiname: string; daten: Buffer }

/**
 * Ein multipart-Körper, von Hand zerlegt.
 *
 * KEIN PAKET DAFÜR. Der Dienst soll ohne `npm install` laufen — sonst wäre
 * er wieder etwas, das erst eingerichtet werden muss, und genau das war das
 * Problem (§6: Redion bleibt einfach startbar).
 */
const zerlege = (koerper: Buffer, grenze: string): Feld[] => {
  const marke = Buffer.from('--' + grenze);
  const felder: Feld[] = [];
  let start = koerper.indexOf(marke);
  while (start >= 0) {
    const nach = start + marke.length;
    /* `--` nach der Grenze heisst: das war das Ende. */
    if (koerper.slice(nach, nach + 2).toString() === '--') break;
    const kopfEnde = koerper.indexOf('\r\n\r\n', nach);
    if (kopfEnde < 0) break;
    const kopf = koerper.slice(nach, kopfEnde).toString('utf8');
    const naechste = koerper.indexOf(marke, kopfEnde);
    if (naechste < 0) break;
    /* Vor der nächsten Grenze steht ein CRLF, das nicht zum Wert gehört. */
    const daten = koerper.slice(kopfEnde + 4, naechste - 2);
    const name = /name="([^"]*)"/.exec(kopf)?.[1] || '';
    const dateiname = /filename="([^"]*)"/.exec(kopf)?.[1] || '';
    felder.push({ name, dateiname, daten });
    start = naechste;
  }
  return felder;
};

/** Die Endung, die `tesseract` am Dateinamen erkennen soll — und nur die. */
const endung = (dateiname: string): string => {
  const roh = path.extname(String(dateiname || '')).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.tif', '.tiff', '.bmp'].includes(roh) ? roh : '.png';
};

/**
 * `tesseract` als eigenes Programm, nicht über eine Shell.
 *
 * Das ist der Unterschied zwischen einem Dateinamen, der ein Dateiname ist,
 * und einem, der ein Befehl sein kann. `spawn` mit einer Liste übergibt die
 * Zeichenketten unverändert an das Programm; es gibt keine Stelle, an der
 * ein `;` oder ein `$(…)` etwas bedeuten würde.
 */
const tesseract = (bild: string, sprachen: string): Promise<{ text: string; version: string }> =>
  new Promise((fertig, schiefgegangen) => {
    const lauf = spawn('tesseract', [bild, 'stdout', '-l', sprachen], { shell: false });
    let raus = '', fehlerText = '';
    const uhr = setTimeout(() => { lauf.kill('SIGKILL'); }, ZEITLIMIT);
    lauf.stdout.on('data', (stueck: Buffer) => {
      raus += stueck.toString('utf8');
      if (raus.length > MAX_TEXT * 2) { lauf.kill('SIGKILL'); }
    });
    lauf.stderr.on('data', (stueck: Buffer) => { fehlerText += stueck.toString('utf8'); });
    lauf.on('error', (fehler: Error) => {
      clearTimeout(uhr);
      schiefgegangen(new Error(
        (fehler as NodeJS.ErrnoException).code === 'ENOENT'
          ? 'tesseract ist auf diesem Rechner nicht installiert. ' +
            'Siehe doku/OCR-DIENST.md, Abschnitt „Einmal einrichten".'
          : 'tesseract liess sich nicht starten: ' + fehler.message));
    });
    lauf.on('close', (code: number | null) => {
      clearTimeout(uhr);
      if (code === 0) {
        /* Die Version steht in einer eigenen Zeile von `stderr`, wenn
           `tesseract` sie meldet — sonst bleibt sie leer. Geraten wird
           nicht (E21). */
        const version = /tesseract\s+([\w.]+)/i.exec(fehlerText)?.[1] || '';
        fertig({ text: raus, version });
        return;
      }
      schiefgegangen(new Error('tesseract endete mit ' + code +
        (fehlerText.trim() ? ': ' + fehlerText.trim().slice(0, 200) : '.')));
    });
  });

const antwort = (b: ServerResponse, code: number, wert: unknown): void => {
  const text = JSON.stringify(wert);
  b.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    /* Der Browser, der fragt, kommt von `file://` oder von einem anderen
       Port — beides ist ein anderer Ursprung. Erlaubt wird das Lesen, nicht
       mehr: keine Zugangsdaten, keine Kopfzeilen ausser der einen. */
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '600'
  });
  b.end(text);
};

const server = http.createServer((a: IncomingMessage, b: ServerResponse) => {
  if (a.method === 'OPTIONS') { antwort(b, 204, {}); return; }
  const weg = (a.url || '/').split('?')[0];
  if (weg === '/gesund') { antwort(b, 200, { ok: true, dienst: 'redion-ocr' }); return; }
  if (a.method !== 'POST' || weg !== '/ocr') {
    antwort(b, 404, { fehler: 'Dieser Dienst kennt nur POST /ocr.' });
    return;
  }

  const typ = String(a.headers['content-type'] || '');
  const grenze = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(typ);
  if (!grenze) {
    antwort(b, 400, { fehler: 'Erwartet wird multipart/form-data mit einem Feld „file".' });
    return;
  }

  const stuecke: Buffer[] = [];
  let gross = 0;
  a.on('data', (stueck: Buffer) => {
    gross += stueck.length;
    /* Abbrechen, BEVOR der Speicher vollläuft — nicht danach (§36). */
    if (gross > MAX_BYTES) {
      antwort(b, 413, { fehler: 'Der Ausschnitt ist grösser als ' +
        Math.round(MAX_BYTES / 1048576) + ' MB.' });
      a.destroy();
      return;
    }
    stuecke.push(stueck);
  });

  a.on('end', () => { void (async () => {
    let datei = '';
    try {
      const felder = zerlege(Buffer.concat(stuecke), (grenze[1] || grenze[2] || '').trim());
      const bild = felder.find(f => f.name === 'file');
      if (!bild || !bild.daten.length) {
        antwort(b, 400, { fehler: 'Im Körper steckt kein Feld „file".' });
        return;
      }
      const gewuenscht = felder.find(f => f.name === 'language')?.daten.toString('utf8').trim() || '';
      const sprachen = SPRACHEN_MUSTER.test(gewuenscht) ? gewuenscht : STANDARD_SPRACHEN;

      const ordner = await fs.mkdtemp(path.join(os.tmpdir(), 'redion-ocr-'));
      datei = path.join(ordner, 'ausschnitt' + endung(bild.dateiname));
      await fs.writeFile(datei, bild.daten);

      const { text, version } = await tesseract(datei, sprachen);
      const sauber = text.replace(/\r\n/g, '\n').trim();
      if (!sauber) { antwort(b, 422, { fehler: 'Kein Text erkannt.' }); return; }

      antwort(b, 200, {
        text: sauber.slice(0, MAX_TEXT),
        language: sprachen,
        engine: 'tesseract',
        version,
        /* KEINE ERFUNDENE ZAHL. `tesseract stdout` liefert keine Sicherheit
           mit; eine hier hingeschriebene wäre eine Behauptung über eine
           Messung, die nie stattgefunden hat. `recognition.ts` verträgt
           `null` und zeigt dann keine an. */
        confidence: null
      });
    } catch (fehler: unknown) {
      antwort(b, 500, { fehler: fehler instanceof Error ? fehler.message : String(fehler) });
    } finally {
      /* Die Zwischendatei geht weg — auch wenn es schiefging. */
      if (datei) await fs.rm(path.dirname(datei), { recursive: true, force: true }).catch(() => {});
    }
  })(); });
});

/* NUR 127.0.0.1. Ohne diese Angabe hört Node auf allen Netzwerkkarten, und
   der Dienst wäre aus dem ganzen WLAN erreichbar — ein Erkenner, an den
   jeder Bilder schicken kann. */
server.listen(PORT, '127.0.0.1', () => {
  console.log('Redion-Erkennungsdienst läuft auf http://127.0.0.1:' + PORT + '/ocr');
  console.log('Sprachen: ' + STANDARD_SPRACHEN + ' · Beenden mit Strg + C');
  console.log('In Redion eintragen unter „⌁ Erkennen" → Adresse des lokalen Diensts.');
});
