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

/* ========================================================================= *
 * 3 · CORS — eine Regel statt sechsunddreissig
 * ---------------------------------------------------------------------------
 * `kern.js` setzte an 36 Stellen einzeln `Access-Control-Allow-Origin: '*'`.
 * Die Begründung dort stimmte zur Hälfte: bei `*` schickt der Browser keine
 * Zugangsdaten mit, und dieser Server nimmt seinen Schlüssel aus einer
 * Kopfzeile. Eine fremde Seite kann also keine angemeldete Anfrage stellen.
 *
 * Nicht abgedeckt war alles, was OHNE Schlüssel antwortet: `/api/stand` nennt
 * die Zahl der Konten, `/s/:schluessel` liefert eine veröffentlichte Seite,
 * und der Gerätecode-Weg gibt nach Freigabe einen Sitzungsschlüssel heraus.
 * ========================================================================= */
console.log('\n3 · Wer darf von aussen lesen?');

let mitCors = null, erlaubterUrsprung = null;
try {
  const m = await import('../../server/sicherheit/cors.js');
  mitCors = m.mitCors; erlaubterUrsprung = m.erlaubterUrsprung;
} catch { /* die Datei gibt es noch nicht — die Prüfungen melden es */ }

p('Es gibt eine Stelle, die über CORS entscheidet', !!mitCors && !!erlaubterUrsprung);

if (mitCors && erlaubterUrsprung) {
  const PROD = { ADRESSE: 'https://redion.example' };
  const anfrageVon = (ursprung) => ({ kopf: ursprung ? { origin: ursprung } : {} });
  const antwortMitStern = () => ({ status: 200, kopf: { 'Access-Control-Allow-Origin': '*' } });
  const kopfVon = (ursprung, umwelt) =>
    mitCors(antwortMitStern(), anfrageVon(ursprung), umwelt).kopf['Access-Control-Allow-Origin'];

  gleich('Die eigene App darf lesen — und bekommt ihren Ursprung, nicht den Stern',
    kopfVon('https://redion.example', PROD), 'https://redion.example');
  gleich('Eine fremde Seite bekommt gar keine Erlaubnis',
    kopfVon('https://boese.example', PROD), undefined);
  gleich('localhost bleibt beim Entwickeln erlaubt',
    kopfVon('http://localhost:5500', PROD), 'http://localhost:5500');

  /* OHNE eingetragene Adresse bleibt der Stern. Wer die App gerade von der
     Festplatte startet, soll nicht an einer Sperre scheitern, die er noch
     gar nicht einrichten konnte — eine Sicherheitsregel, die die erste
     Inbetriebnahme bricht, wird ausgebaut statt benutzt. */
  gleich('Ohne eingetragene Adresse bleibt es beim Stern',
    kopfVon('https://irgendwo.example', {}), '*');

  /* Ohne Herkunft im Kopf ist es kein Browser oder derselbe Ursprung —
     beides braucht keine CORS-Zeile. */
  gleich('Ohne Herkunft im Kopf gibt es keine Zeile', kopfVon('', PROD), undefined);

  /* DIE ZEILE, DIE MAN AM HÄUFIGSTEN VERGISST. Sobald die Antwort von der
     Herkunft abhängt, muss `Vary: Origin` dazu — sonst liefert ein
     Zwischenspeicher die Antwort für Herkunft A an Herkunft B aus. Das fällt
     erst unter Last auf und ist dann kaum zu finden. */
  gleich('Bei geprüfter Herkunft steht Vary: Origin dabei',
    mitCors(antwortMitStern(), anfrageVon('https://redion.example'), PROD).kopf.Vary, 'Origin');
  gleich('Beim Stern braucht es kein Vary',
    mitCors(antwortMitStern(), anfrageVon('https://x.example'), {}).kopf.Vary, undefined);

  /* Was der Kern nicht nach draussen geben wollte, gibt auch diese Stelle
     nicht nach draussen. Eine Hülle, die Zeilen HINZUFÜGT, wäre gefährlicher
     als gar keine. */
  const ohneZeile = mitCors({ status: 200, kopf: { 'Content-Type': 'text/html' } },
    anfrageVon('https://redion.example'), PROD);
  gleich('Eine Antwort ohne CORS-Zeile bekommt keine dazu',
    'Access-Control-Allow-Origin' in ohneZeile.kopf, false);

  gleich('Eine Unterdomäne, die nur so aussieht, darf nicht',
    erlaubterUrsprung('https://redion.example.boese.example', PROD), '');
}

/* Und der Quelltext-Beleg: die 36 Stellen dürfen bleiben, aber es muss eine
   Hülle geben, durch die sie hinausgehen. */
p('beantworte() geht durch die CORS-Hülle',
  /export const beantworte[\s\S]{0,200}mitCors\(/.test(server));

/* ========================================================================= *
 * 4 · DERSELBE FALL ÜBER ECHTES HTTP
 * ---------------------------------------------------------------------------
 * Abschnitt 3 fragt die Funktion. Dieser fragt den Server. Der Unterschied
 * ist der ganze Punkt: die Funktion kann richtig rechnen und trotzdem nie
 * gerufen werden. Genau das war beim Anmeldefenster der Fall — die Prüfung
 * stand da, die Verdrahtung fehlte.
 * ========================================================================= */
console.log('\n4 · Und derselbe Fall über echtes HTTP');

const { starte } = await import('../../server/pruefserver.js');
const srv = await starte(8793, { umwelt: { ADRESSE: 'https://redion.example' } });

const holeMit = async (herkunft) => {
  const a = await fetch(srv.adresse + '/api/stand',
    herkunft ? { headers: { Origin: herkunft } } : {});
  await a.text();
  return { erlaubt: a.headers.get('access-control-allow-origin'),
           vary: a.headers.get('vary'), status: a.status };
};

const eigene = await holeMit('https://redion.example');
gleich('Die eigene App bekommt ihren Ursprung zurück',
  eigene.erlaubt, 'https://redion.example');
gleich('… mit Vary: Origin', eigene.vary, 'Origin');

const fremde = await holeMit('https://boese.example');
gleich('Eine fremde Seite bekommt keine Erlaubnis', fremde.erlaubt, null);
p('… die Antwort selbst kommt trotzdem — CORS sperrt den Leser, nicht den Server',
  fremde.status === 200);

/* Auch die Vorabfrage (OPTIONS) muss mitziehen. Sie wird gern vergessen,
   weil sie im Alltag unsichtbar ist — und dann scheitert jede PATCH-Anfrage
   der eigenen App mit einer Meldung, die nach etwas ganz anderem aussieht. */
const vorab = await fetch(srv.adresse + '/bereich/liste',
  { method: 'OPTIONS', headers: { Origin: 'https://redion.example' } });
await vorab.text();
gleich('Auch die Vorabfrage antwortet mit dem geprüften Ursprung',
  vorab.headers.get('access-control-allow-origin'), 'https://redion.example');

const vorabFremd = await fetch(srv.adresse + '/bereich/liste',
  { method: 'OPTIONS', headers: { Origin: 'https://boese.example' } });
await vorabFremd.text();
gleich('Eine fremde Vorabfrage bekommt nichts',
  vorabFremd.headers.get('access-control-allow-origin'), null);

await srv.stopp();

console.log(`\n  Suite 57 — Anmeldeschlüssel und CORS: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
