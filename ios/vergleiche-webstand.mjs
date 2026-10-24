/*
 * Web-Parität für den Redion-iOS-Build.
 *
 * Jede Web-Datei im nativen www/ muss bytegenau aus demselben
 * Redion-Quellstand stammen. Zwei Ausnahmen sind nur in www/ erlaubt:
 *  - der eine native Skript-Verweis direkt vor </body>
 *  - die dazugehörige native Brücke.
 *
 * Keine Veröffentlichung, keine Änderung am Website-Einstieg.
 * Das garantiert den gleichen Webstand im IPA-Paket, nicht dass
 * eine separat betriebene öffentliche Website bereits deployed ist.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const EINBINDUNG = '<script src="redion-native-sicherung.js"></script>\n';
const NATIVE_BRUECKE = 'redion-native-sicherung.js';
const KOPIERTE_ORDNER = ['quell', 'oeffentlich', 'fremd', 'lernpakete', 'lernen'];

const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const vorhanden = (pfad) => fs.existsSync(pfad);

function dateienAbsolut(ordner) {
  const gefunden = [];
  const durch = (wo, relativ) => {
    for (const eintrag of fs.readdirSync(wo, { withFileTypes: true })) {
      const name = path.posix.join(relativ, eintrag.name);
      const ziel = path.join(wo, eintrag.name);
      if (eintrag.isDirectory()) durch(ziel, name);
      else if (eintrag.isFile()) gefunden.push(name);
      else throw new Error('Unbekannter Dateityp oder Symlink: ' + name);
    }
  };
  durch(ordner, '');
  return gefunden.sort();
}

/** Rein lesende Prüfung; funktioniert auch in einem isolierten Testordner. */
export function vergleicheWebstand(wurzel = process.cwd()) {
  const web = path.join(wurzel, 'www');
  if (!vorhanden(web)) throw new Error('www/ fehlt.');
  const expected = ['index.html', 'sw.js'];
  for (const ordner of KOPIERTE_ORDNER) {
    const quelle = path.join(wurzel, ordner);
    if (vorhanden(quelle)) {
      for (const eintrag of dateienAbsolut(quelle)) {
        expected.push(path.posix.join(ordner, eintrag));
      }
    }
  }
  expected.sort();

  const found = dateienAbsolut(web);
  const permitted = [...expected, NATIVE_BRUECKE].sort();
  if (JSON.stringify(found) !== JSON.stringify(permitted)) {
    const fehlt = permitted.filter(f => !found.includes(f));
    const zuViel = found.filter(f => !permitted.includes(f));
    throw new Error('iOS-Webpaket weicht von der Website ab. Fehlend: ' +
      (fehlt.join(', ') || 'keine') + '; zusaetzlich: ' + (zuViel.join(', ') || 'keine'));
  }
  if (vorhanden(path.join(wurzel, NATIVE_BRUECKE))) {
    throw new Error('Native Bruecke darf nicht im Website-Stammverzeichnis liegen.');
  }

  const ergebnisse = [];
  for (const datei of expected) {
    const quellDatei = path.join(wurzel, datei);
    const zielDatei = path.join(web, datei);
    const quelle = fs.readFileSync(quellDatei);
    let imPaket = fs.readFileSync(zielDatei);
    if (datei === 'index.html') {
      const html = imPaket.toString('utf8');
      if (html.split(EINBINDUNG).length !== 2 ||
          !html.includes(EINBINDUNG + '</body>')) {
        throw new Error('Native Bruecke nicht genau einmal am Ende von www/index.html.');
      }
      imPaket = Buffer.from(html.replace(EINBINDUNG, ''), 'utf8');
    }
    const original = sha256(quelle);
    if (original !== sha256(imPaket)) {
      throw new Error('Web-App und iOS-App haben abweichende Inhalte: ' + datei);
    }
    ergebnisse.push({pfad: datei, sha256: original});
  }

  return {
    ergebnis: 'identischer Webstand',
    webDateien: ergebnisse.length,
    quelle: 'derselbe Git-Checkout',
    einschraenkung: 'Die separat veröffentlichte Website muss ihren Deploy selbst aktualisieren.',
    indexSha256: ergebnisse.find(e => e.pfad === 'index.html').sha256,
    swSha256: ergebnisse.find(e => e.pfad === 'sw.js').sha256
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const bericht = vergleicheWebstand();
    fs.mkdirSync('build', { recursive: true });
    fs.writeFileSync('build/ios-web-paritaet.json',
      JSON.stringify(bericht, null, 2) + '\n');
    console.log('OK:', bericht.webDateien,
      'Website-Dateien sind bytegleich zur iOS-App (ausser nativer Bruecke).');
  } catch (fehler) {
    console.error('Web-Paritaet fehlgeschlagen:', fehler.message);
    process.exitCode = 1;
  }
}
