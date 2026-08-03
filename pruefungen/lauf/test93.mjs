/* Suite 58 — Die Bremse: wie oft jemand etwas versuchen darf
 * ----------------------------------------------------------------------------
 * WAS GEBREMST WERDEN MUSS, wurde gerechnet statt geraten:
 *
 *   Gerätecode      8 Zeichen aus 32 → 32^8 ≈ 1,1·10^12, zehn Minuten gültig
 *   Seitenschlüssel 12 Hexzeichen → 48 Bit
 *   PASSWORT einer  von einem Menschen gewählt — „sommer2026" fällt in
 *   öffentlichen    Sekunden, wenn man beliebig oft raten darf
 *   Seite
 *
 * Die ersten beiden sind stark genug. Das dritte ist die Stelle, an der es
 * wirklich hängt, und dort zieht die Bremse am schärfsten.
 *
 * ZWEI DINGE, DIE EINE BREMSE FALSCH MACHT, und beide werden hier geprüft —
 * denn eine Bremse, die den Falschen trifft, wird ausgebaut statt benutzt:
 *
 *   1. **Den Falschen aussperren.** Wer nach Herkunft zählt und keine hat,
 *      zählt alle in denselben Topf. Dann sperrt der erste Angreifer sämtliche
 *      Leser aus. Ohne erkennbare Herkunft wird deshalb pro Seite gezählt.
 *   2. **Den Richtigen mitzählen.** Gezählt werden nur FEHLVERSUCHE. Zählte
 *      man jeden Aufruf, sperrte sich eine viel gelesene öffentliche Seite von
 *      selbst — und der Fehler sähe aus wie ein Angriff.
 *
 * Dazu: eine Sperre muss sagen, WANN es wieder geht. „Zu viele Versuche" ohne
 * Zeitangabe ist eine Sackgasse.
 *
 *   node pruefungen/lauf/test93.mjs
 * ==========================================================================*/
import { fileURLToPath as _alsPfad } from 'node:url';
import { dirname as _ordner, resolve as _loese } from 'node:path';

const WURZEL = _loese(_ordner(_alsPfad(import.meta.url)), '../..');

let ok = 0, weg = 0;
const p = (n, b, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n, ist, soll) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

let B = null, ladefehler = null;
try { B = await import('../../server/sicherheit/bremse.js'); }
catch (e) { ladefehler = e.message; }

p('Es gibt eine Bremse', !!B, ladefehler || '');
if (!B) { console.log('\n  Suite 58: Abbruch.'); process.exit(1); }

const { ablageSpeicher } = await import('../../server/ablage.js');

/* ========================================================================= *
 * 1 · ZÄHLEN UND SPERREN
 * ========================================================================= */
console.log('\n1 · Zählen, sperren, wieder freigeben');

const frisch = async () => { const a = ablageSpeicher(); await a.einrichten(); return a; };
const KLEIN = { grenze: 3, fensterMs: 60000 };

let ablage = await frisch();
const s1 = 'pw:abc:1.2.3.4';

gleich('Vor dem ersten Versuch ist nichts gesperrt',
  (await B.istGesperrt(ablage, s1, KLEIN)).gesperrt, false);

const e1 = await B.zaehleFehlversuch(ablage, s1, KLEIN);
gleich('Nach einem Fehlversuch bleiben zwei', e1.rest, 2);
gleich('… und er ist noch erlaubt', e1.erlaubt, true);

await B.zaehleFehlversuch(ablage, s1, KLEIN);
const e3 = await B.zaehleFehlversuch(ablage, s1, KLEIN);
gleich('Nach dem dritten bleibt keiner', e3.rest, 0);
gleich('… der dritte selbst war noch erlaubt', e3.erlaubt, true);

gleich('Jetzt ist gesperrt', (await B.istGesperrt(ablage, s1, KLEIN)).gesperrt, true);

const e4 = await B.zaehleFehlversuch(ablage, s1, KLEIN);
gleich('Der vierte ist nicht mehr erlaubt', e4.erlaubt, false);

/* Eine Sperre ohne Zeitangabe ist eine Sackgasse. */
const sperre = await B.istGesperrt(ablage, s1, KLEIN);
p('Die Sperre sagt, wann es wieder geht', sperre.wiederIn > 0 && sperre.wiederIn <= 60,
  String(sperre.wiederIn));

/* ========================================================================= *
 * 2 · WAS NICHT PASSIEREN DARF
 * ========================================================================= */
console.log('\n2 · Wen die Bremse nicht treffen darf');

/* Ein anderer Zählschlüssel ist ein anderer Topf — sonst sperrt ein Angreifer
   auf Seite A die Leser von Seite B aus. */
gleich('Eine andere Seite ist davon nicht betroffen',
  (await B.istGesperrt(ablage, 'pw:xyz:1.2.3.4', KLEIN)).gesperrt, false);
gleich('Eine andere Herkunft ebenfalls nicht',
  (await B.istGesperrt(ablage, 'pw:abc:9.9.9.9', KLEIN)).gesperrt, false);

/* Nach einem geglückten Versuch ist die Zählung erledigt. Sonst summierten
   sich die Fehltritte von gestern zu einer Sperre von morgen. */
await B.bremseLoesen(ablage, s1);
gleich('Nach dem richtigen Passwort ist die Zählung weg',
  (await B.istGesperrt(ablage, s1, KLEIN)).gesperrt, false);

/* Das Fenster muss ablaufen. Geprüft, indem der Eintrag auf alt gesetzt wird
   — auf eine Minute zu warten ist kein Prüflauf. */
await B.zaehleFehlversuch(ablage, s1, KLEIN);
await B.zaehleFehlversuch(ablage, s1, KLEIN);
await B.zaehleFehlversuch(ablage, s1, KLEIN);
gleich('Erst gesperrt', (await B.istGesperrt(ablage, s1, KLEIN)).gesperrt, true);

const alt = await ablage.hole('bremse', { schluessel: s1 });
await ablage.setze('bremse', { ...alt, seit: new Date(Date.now() - 120000).toISOString() });
gleich('Nach Ablauf des Fensters wieder frei',
  (await B.istGesperrt(ablage, s1, KLEIN)).gesperrt, false);
const nachAblauf = await B.zaehleFehlversuch(ablage, s1, KLEIN);
gleich('… und die Zählung fängt von vorn an', nachAblauf.rest, 2);

/* ========================================================================= *
 * 3 · DER ZÄHLSCHLÜSSEL
 * ========================================================================= */
console.log('\n3 · Wonach gezählt wird');

gleich('Mit Herkunft wird pro Seite UND Herkunft gezählt',
  B.seitenSchluessel('abc', { kopf: { 'cf-connecting-ip': '1.2.3.4' } }),
  'pw:abc:1.2.3.4');

/* DIE ZEILE, DIE EINE BREMSE ZUR SELBSTSPERRE MACHT. Ohne Herkunft darf der
   Schlüssel nicht konstant werden — sonst zählen alle Leser aller Seiten in
   denselben Topf, und der erste Angreifer schliesst den ganzen Server. */
gleich('Ohne Herkunft wird pro Seite gezählt, nicht global',
  B.seitenSchluessel('abc', { kopf: {} }), 'pw:abc');
p('… und zwei Seiten bekommen ohne Herkunft trotzdem zwei Töpfe',
  B.seitenSchluessel('abc', {}) !== B.seitenSchluessel('xyz', {}));

gleich('Cloudflares Kopfzeile wird bevorzugt',
  B.herkunft({ kopf: { 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' } }),
  '1.1.1.1');
gleich('x-forwarded-for nur ersatzweise, und nur der erste Eintrag',
  B.herkunft({ kopf: { 'x-forwarded-for': '3.3.3.3, 4.4.4.4' } }), '3.3.3.3');
gleich('Ohne beides bleibt es leer', B.herkunft({ kopf: {} }), '');

/* Die Zahlen selbst. Die Nachfrage-Grenze ist die heikelste: die App fragt im
   Sekundentakt, solange das Anmeldefenster offen ist. Zehn Minuten Gültigkeit
   heissen bis zu 600 ehrliche Anfragen — eine Grenze darunter bremst genau
   den Vorgang aus, den sie schützen soll. */
p('Die Passwortgrenze ist streng', B.GRENZEN.passwort.grenze <= 10);
p('Die Nachfrage-Grenze liegt über dem, was ehrliches Warten braucht',
  B.GRENZEN.codeFragen.grenze > 600,
  'ist ' + B.GRENZEN.codeFragen.grenze);

/* ========================================================================= *
 * 4 · UND JETZT AM ECHTEN SERVER
 * ---------------------------------------------------------------------------
 * Die Abschnitte darüber fragen die Funktion. Dieser fragt den Server —
 * der Unterschied ist der Punkt: eine Bremse, die richtig rechnet und nie
 * gerufen wird, bremst nichts.
 * ========================================================================= */
console.log('\n4 · Am echten Server');

const { starte } = await import('../../server/pruefserver.js');
const srv = await starte(8791);

/* Ein Konto, ein Bereich, eine veröffentlichte Seite mit Passwort. */
await srv.ablage.setze('konten', { id: 'k1', mail: 'a@b.ch', name: 'A', angelegt: new Date().toISOString() });
const token = 'sit_pruefung_' + Math.floor(1e9).toString(16);
const { abdruck } = await import('../../server/kern.js');
await srv.ablage.setze('sitzungen', { token: await abdruck(token), kontoId: 'k1',
  geraet: 'Prüfung', angelegt: new Date().toISOString(),
  bis: new Date(Date.now() + 86400000).toISOString() });
await srv.ablage.setze('bereiche', { id: 'b1', name: 'Test', besitzer: 'k1',
  angelegt: new Date().toISOString() });

const veroeffentlicht = await fetch(srv.adresse + '/veroeffentlichen', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  body: JSON.stringify({ bereich: 'b1', seite: 's1', titel: 'Geheim',
                         inhalt: '<p>Der Inhalt</p>', passwort: 'richtig' })
});
const v = await veroeffentlicht.json();
p('Die Seite ist veröffentlicht und passwortgeschützt',
  veroeffentlicht.status === 200 && v.passwortgeschuetzt === true,
  JSON.stringify(v).slice(0, 120));

const ruf = (pw, ip = '5.5.5.5') => fetch(
  srv.adresse + '/s/' + v.schluessel + (pw === null ? '' : '?pw=' + encodeURIComponent(pw)),
  { headers: { 'CF-Connecting-IP': ip } });

const mitRichtig = await ruf('richtig');
p('Mit dem richtigen Passwort kommt der Inhalt',
  mitRichtig.status === 200 && (await mitRichtig.text()).includes('Der Inhalt'));

/* Zehn Fehlversuche — die Grenze steht auf zehn. */
let letzte;
for (let i = 0; i < 10; i++) letzte = await ruf('falsch' + i);
gleich('Der zehnte Fehlversuch antwortet noch mit 401', letzte.status, 401);

const elfte = await ruf('falsch11');
gleich('Der elfte wird gesperrt', elfte.status, 429);
p('… und sagt, wann es wieder geht', !!elfte.headers.get('retry-after'),
  String(elfte.headers.get('retry-after')));

/* UND DAS WICHTIGSTE: die Sperre gilt für den, der geraten hat — nicht für
   jeden anderen Leser derselben Seite. */
const andererLeser = await ruf('richtig', '7.7.7.7');
p('Ein anderer Leser kommt trotzdem mit dem richtigen Passwort durch',
  andererLeser.status === 200 && (await andererLeser.text()).includes('Der Inhalt'));

/* Und eine andere Seite ist ohnehin unberührt — hier reicht der Nachweis,
   dass die Sperre am Schlüssel hängt und nicht am Server. */
const stand = await fetch(srv.adresse + '/api/stand');
gleich('Der Server selbst antwortet weiter', stand.status, 200);

await srv.stopp();

console.log(`\n  Suite 58 — Die Bremse: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
