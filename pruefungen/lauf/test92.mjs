/* Suite 57 — Der Anmeldeschlüssel geht nur dorthin, wo er hingehört
 * ----------------------------------------------------------------------------
 * DREI HÄLFTEN DESSELBEN LOCHS, gefunden beim Durchgehen der Muss-Regeln aus
 * dem Auftrag („keine ungeprüften Redirects nach OAuth"):
 *
 *   1. `server/kern.js` schickte den Sitzungsschlüssel mit
 *      `opener.postMessage(…, "*")` — also **an jeden Ursprung**. Wer eine
 *      eigene Seite baut, die das Anmeldefenster öffnet, ist `opener` und
 *      bekommt den Schlüssel geliefert. Es braucht dafür keinen Fehler beim
 *      Anbieter und keine manipulierte Adresse; es genügt, das Fenster
 *      aufzumachen.
 *
 *   2. `quell/kern/abgleich/maschine.js` prüfte beim Empfangen **nicht**, von
 *      wem die Nachricht kam. Damit ging es auch andersherum: jede Seite
 *      durfte einen Schlüssel hereinreichen, und die App nahm ihn. Von da an
 *      wären die Notizen des Menschen in den Bestand eines Fremden geflossen
 *      — nicht gestohlen, sondern hineingeschoben. Das ist die Richtung, die
 *      man leichter übersieht und die mehr kostet.
 *
 *   3. `?zurueck=` kam ungeprüft aus der Adresszeile und wurde zu
 *      `redirect_uri`. Dass GitHub und Google das ihrerseits prüfen, ist ein
 *      zweites Netz — aber ein Wert, der am Ende bestimmt, wohin ein
 *      Schlüssel geht, darf sich nicht auf ein fremdes Netz verlassen.
 *
 * WAS DABEI AUFFIEL: `bereiche/verbinden/konten.js` prüft den Ursprung seit
 * jeher (`if (e.origin !== location.origin) return;`). `maschine.js` nicht.
 * Zwei Empfänger derselben Sorte, einer richtig, einer nicht — genau das
 * Muster der zwanzig halben `esc`-Funktionen aus test90.
 *
 *   node pruefungen/lauf/test92.mjs
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese, join as _dazu } from 'node:path';
import { readFileSync as _lies } from 'node:fs';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

/* BEWUSST EIN NACHLADEN STATT EINES FESTEN `import`. Beim ersten Versuch stand
   hier `import { rueckAdresse } from '…/kern.js'`. Für die Gegenprobe — die
   Reparatur zurückdrehen und schauen, ob es rot wird — hiess das: der Lauf
   stirbt beim Laden mit „does not provide an export", noch bevor eine einzige
   Prüfung gelaufen ist. Rot war er damit zwar, aber er sagte nicht, WAS
   fehlte. Ein Lauf, der abstürzt, ist kein Beleg, sondern nur ein Ärgernis.
   So läuft jetzt jeder Abschnitt, den man ohne die neuen Funktionen prüfen
   kann, auch ohne sie durch. */
let rueckAdresse = null, erlaubteAdressen = null, ladefehler = null;
try {
  const m = await import('../../server/kern.js');
  rueckAdresse = m.rueckAdresse; erlaubteAdressen = m.erlaubteAdressen;
  if (!rueckAdresse || !erlaubteAdressen) ladefehler = 'kern.js bietet die Prüfung nicht an';
} catch (e) { ladefehler = e.message; }

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n, ist, soll) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

/* ========================================================================= *
 * 1 · DIE ERLAUBNISLISTE
 * ========================================================================= */
console.log('\n1 · Welche Rücksprung-Adresse ist erlaubt?');

p('server/kern.js bietet die Adressprüfung an', !ladefehler, ladefehler || '');
if (ladefehler) {
  console.log('    (Abschnitt 1 übersprungen — Abschnitt 2 läuft trotzdem.)');
  rueckAdresse = () => '__nicht_vorhanden__';
  erlaubteAdressen = () => ['__nicht_vorhanden__'];
}

const UMWELT = { ADRESSE: 'https://redion.example/', ADRESSEN: 'https://zweit.example' };

gleich('Die eigene Adresse des Servers ist erlaubt',
  rueckAdresse('https://redion.example', UMWELT), 'https://redion.example');
gleich('Auch mit Schrägstrich am Ende — der fällt weg',
  rueckAdresse('https://redion.example/', UMWELT), 'https://redion.example');
gleich('Eine zweite eingetragene Adresse ist erlaubt',
  rueckAdresse('https://zweit.example', UMWELT), 'https://zweit.example');

/* Und jetzt die Seite, um die es geht. */
gleich('Eine fremde Adresse ist nicht erlaubt',
  rueckAdresse('https://boese.example', UMWELT), '');
gleich('Auch keine Unterdomäne, die nur so aussieht',
  rueckAdresse('https://redion.example.boese.example', UMWELT), '');
gleich('Auch nicht mit vorangestelltem Namen',
  rueckAdresse('https://redion.example@boese.example', UMWELT), '');
gleich('Auch nicht als Pfad hinter der echten Adresse',
  rueckAdresse('https://boese.example/https://redion.example', UMWELT), '');
gleich('javascript: ist keine Adresse', rueckAdresse('javascript:alert(1)', UMWELT), '');
gleich('Leer bleibt leer', rueckAdresse('', UMWELT), '');
gleich('Unsinn bleibt leer', rueckAdresse('nicht-mal-eine-adresse', UMWELT), '');

/* Beim Entwickeln läuft die App auf einem anderen Port als der Server —
   ohne diese Ausnahme wäre die eigene Entwicklung nicht mehr anmeldbar.
   Eine Sperre, die die tägliche Arbeit bricht, wird umgangen statt benutzt. */
gleich('localhost bleibt beim Entwickeln erlaubt',
  rueckAdresse('http://localhost:8792', {}), 'http://localhost:8792');
gleich('127.0.0.1 ebenso', rueckAdresse('http://127.0.0.1:3000', {}), 'http://127.0.0.1:3000');

/* Ohne eingetragene Adresse ist die Liste leer — dann geht ausser localhost
   nichts. Das ist die richtige Vorgabe: lieber eine Anmeldung, die sagt
   „trag deine Adresse ein", als eine, die überallhin liefert. */
gleich('Ohne ADRESSE ist die Liste leer', erlaubteAdressen({}), []);
gleich('Ohne ADRESSE wird auch nichts Fremdes erlaubt',
  rueckAdresse('https://boese.example', {}), '');

gleich('Die Liste enthält Ursprünge, keine Pfade',
  erlaubteAdressen({ ADRESSE: 'https://redion.example/unterordner/' }),
  ['https://redion.example']);
gleich('Mehrere Adressen mit Komma',
  erlaubteAdressen({ ADRESSE: 'https://a.example', ADRESSEN: 'https://b.example, https://c.example' }),
  ['https://a.example', 'https://b.example', 'https://c.example']);
gleich('Doppelte werden nicht doppelt gezählt',
  erlaubteAdressen({ ADRESSE: 'https://a.example', ADRESSEN: 'https://a.example' }),
  ['https://a.example']);

/* ========================================================================= *
 * 2 · DER QUELLTEXT — die zwei Stellen, an denen es hing
 * ========================================================================= */
console.log('\n2 · Kein Stern mehr, und ein geprüfter Absender');

const server = _lies(_dazu(WURZEL, 'server/kern.js'), 'utf8');
const ohneKommentare = server.replace(/\/\*[\s\S]*?\*\//g, ' ');

p('server/kern.js schickt nicht mehr an jeden Ursprung',
  !/postMessage\([^)]*,\s*["']\*["']\s*\)/.test(ohneKommentare));
p('server/kern.js baut den Zielursprung aus der geprüften Adresse',
  /zielUrsprung/.test(ohneKommentare) && /new URL\(weiterZu\)\.origin/.test(ohneKommentare));
p('Die Rücksprung-Adresse wird geprüft, bevor der Vorgang beginnt',
  /rueckAdresse\(suche\.zurueck/.test(ohneKommentare));

const maschine = _lies(_dazu(WURZEL, 'quell/kern/abgleich/maschine.js'), 'utf8');
const mOhne = maschine.replace(/\/\*[\s\S]*?\*\//g, ' ');
p('maschine.js prüft jetzt den Absender der Nachricht',
  /e\.origin\s*!==\s*serverUrsprung/.test(mOhne));

/* Die Gegenprobe zur Prüfung selbst: beide Empfänger im Repo müssen sie
   haben. Fände der Ausdruck sie nirgends, wäre die Prüfung oben wertlos. */
const konten = _lies(_dazu(WURZEL, 'quell/bereiche/verbinden/konten.js'), 'utf8');
p('Der zweite Empfänger prüft ihn ebenfalls — und tat es schon vorher',
  /e\.origin\s*!==\s*location\.origin/.test(konten));

/* Kein Empfänger am FENSTER darf ohne Ursprungsprüfung dastehen. Diese Zeile
   ist die eigentliche Regel; die zwei oben sind ihre Beispiele.
 *
 * WARUM „am Fenster" und nicht „überhaupt": beim ersten Versuch prüfte diese
 * Stelle jedes `addEventListener('message')` — und meldete
 * `verbinden/schnittstelle.js` als Lücke. Dort steht aber
 * `navigator.serviceWorker.addEventListener('message', …)`, und dorthin kann
 * nur der eigene Servicearbeiter senden: er bedient ausschliesslich Seiten
 * seines eigenen Ursprungs. Ein `e.origin`-Vergleich wäre da keine Sicherheit,
 * sondern Rauschen — und Rauschen ist, was Prüfungen unglaubwürdig macht.
 * Dieselbe Sorte Fehler wie die Sperre, die `javascriptbuch.pdf` verschluckte:
 * eine Regel, die mehr fängt als sie soll, kostet mehr als sie bringt. */
const empfaenger = [];
for (const datei of ['quell/kern/abgleich/maschine.js',
                     'quell/bereiche/verbinden/konten.js',
                     'quell/bereiche/verbinden/schnittstelle.js',
                     'quell/kern/zugang/sitzung.js']) {
  let t;
  try { t = _lies(_dazu(WURZEL, datei), 'utf8'); } catch { continue; }
  const amFenster = /(^|[^.\w])(window\.)?addEventListener\(\s*['"]message['"]/m.test(
    t.replace(/navigator\.serviceWorker\.addEventListener/g, 'ARBEITER_addEventListener'));
  if (amFenster && !/\.origin\s*!==/.test(t)) empfaenger.push(datei);
}
gleich('Kein Fenster-Empfänger ohne Ursprungsprüfung', empfaenger, []);

/* Und die Gegenprobe dazu, damit die Regel oben nicht bloss deshalb grün ist,
   weil sie gar nichts findet: der Ausdruck muss einen echten Empfänger
   erkennen können. */
p('Der Ausdruck erkennt einen Fenster-Empfänger überhaupt',
  /(^|[^.\w])(window\.)?addEventListener\(\s*['"]message['"]/m
    .test("window.addEventListener('message', f)"));
p('… und lässt den Servicearbeiter in Ruhe',
  !/(^|[^.\w])(window\.)?addEventListener\(\s*['"]message['"]/m.test(
    "navigator.serviceWorker.addEventListener('message', f)"
      .replace(/navigator\.serviceWorker\.addEventListener/g, 'ARBEITER_addEventListener')));

console.log(`\n  Suite 57 — Anmeldeschlüssel: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
