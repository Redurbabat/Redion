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
 *   node pruefungen/lauf/test93.mts
 * ==========================================================================*/
let ok = 0, weg = 0;
const p = (n: any, b: any, extra = '') => { if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); } };
const gleich = (n: any, ist: any, soll: any) =>
  p(n, JSON.stringify(ist) === JSON.stringify(soll),
    `ist=${JSON.stringify(ist)} soll=${JSON.stringify(soll)}`);

let B = null, ladefehler = null;
try { B = await import('../../server/sicherheit/bremse.ts'); }
catch (e: unknown) { ladefehler = (e instanceof Error ? e.message : String(e)); }

p('Es gibt eine Bremse', !!B, ladefehler || '');
if (!B) { console.log('\n  Suite 58: Abbruch.'); process.exit(1); }

const { ablageSpeicher } = await import('../../server/ablage.ts');

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

const { starte } = await import('../../server/pruefserver.ts');
const srv = await starte(8800);   /* 8791 gehört test69 — geteilte Ports werden flockig */

/* Ein Konto, ein Bereich, eine veröffentlichte Seite mit Passwort. */
await srv.ablage.setze('konten', { id: 'k1', mail: 'a@b.ch', name: 'A', angelegt: new Date().toISOString() });
const token = 'sit_pruefung_' + Math.floor(1e9).toString(16);
const { abdruck } = await import('../../server/kern.ts');
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

const ruf = (pw: any, ip = '5.5.5.5') => fetch(
  srv.adresse + '/s/' + v.schluessel + (pw === null ? '' : '?pw=' + encodeURIComponent(pw)),
  { headers: { 'CF-Connecting-IP': ip } });

const mitRichtig = await ruf('richtig');
p('Mit dem richtigen Passwort kommt der Inhalt',
  mitRichtig.status === 200 && (await mitRichtig.text()).includes('Der Inhalt'));

/* Zehn Fehlversuche — die Grenze steht auf zehn. Der erste steht ausserhalb
   der Schleife, damit `letzte` mit Sicherheit eine Antwort trägt: sonst wäre
   die Zeile darunter eine Behauptung statt einer Prüfung. */
let letzte = await ruf('falsch0');
for (let i = 1; i < 10; i++) letzte = await ruf('falsch' + i);
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

/* ========================================================================= *
 * 5 · SICHERHEITSKOPFZEILEN (D3)
 * ---------------------------------------------------------------------------
 * `oeffentlich/_headers` setzt sie für die DATEIEN der App — Cloudflare Pages
 * liest das von selbst. Für die Antworten des Arbeiters gilt es nicht, und
 * dazu gehört ausgerechnet `/s/:schluessel`: die einzige Seite dieser App,
 * die ein FREMDER Browser darstellt. Sie bekam bisher keine einzige.
 * ========================================================================= */
console.log('\n5 · Was der Browser bei einer Antwort darf');

const kopfVon = (a: any) => Object.fromEntries([...a.headers].map(([k, v]) => [k.toLowerCase(), v]));

const seite = await ruf('richtig', '8.8.8.8');
await seite.text();
const kS = kopfVon(seite);

gleich('Die veröffentlichte Seite kommt durch', seite.status, 200);
p('Sie hat eine CSP', !!kS['content-security-policy'], JSON.stringify(kS['content-security-policy']));

/* DER TEIL, DER ZÄHLT. `sauber()` auf dem Server arbeitet mit regulären
   Ausdrücken statt mit einem Parser — und ein Ausdruck ist leichter zu
   überlisten. Falls dort je etwas durchkommt, hält diese Zeile es auf. */
p('Skripte sind auf der veröffentlichten Seite ganz abgeschaltet',
  /default-src 'none'/.test(kS['content-security-policy'] || '') &&
  !/script-src[^;]*unsafe/.test(kS['content-security-policy'] || ''),
  kS['content-security-policy']);

/* Und die Gegenrichtung: die Seite muss trotzdem funktionieren. Eine CSP,
   die das eigene Aussehen abschaltet, wird beim ersten Blick wieder
   ausgebaut — sie muss so streng sein, wie es die Seite verträgt, und keinen
   Strich strenger. */
p('Ihr eigenes Aussehen darf sie behalten',
  /style-src[^;]*unsafe-inline/.test(kS['content-security-policy'] || ''));
p('Bilder aus dem Inhalt dürfen geladen werden',
  /img-src[^;]*data:/.test(kS['content-security-policy'] || ''));
p('Das Passwortfeld darf zurückschicken',
  /form-action 'self'/.test(kS['content-security-policy'] || ''));
p('Niemand darf die Seite in seine eigene einbetten',
  /frame-ancestors 'none'/.test(kS['content-security-policy'] || '') &&
  kS['x-frame-options'] === 'DENY');

gleich('Der Dateityp wird nicht geraten', kS['x-content-type-options'], 'nosniff');
gleich('Die Adresse wird beim Weggehen nicht verraten', kS['referrer-policy'], 'no-referrer');

/* Die JSON-Antworten brauchen keine CSP — dort gibt es nichts darzustellen.
   Eine CSP auf einer JSON-Antwort ist Zierde, und Zierde in einer
   Sicherheitszeile macht die echten unglaubwürdig. */
const kA = kopfVon(await fetch(srv.adresse + '/api/stand'));
gleich('Auch die Schnittstelle lässt den Typ nicht raten',
  kA['x-content-type-options'], 'nosniff');
gleich('Aber sie bekommt keine CSP — dort gibt es nichts darzustellen',
  kA['content-security-policy'], undefined);

/* Und nichts überschreiben, was der Kern selbst gesetzt hat. Eine Hülle, die
   vorhandene Zeilen ersetzt, könnte eine bewusste Regel still austauschen. */
const gesperrtKopf = kopfVon(await ruf('wiederFalsch', '5.5.5.5'));
p('Die Sperre behält ihr Retry-After', !!gesperrtKopf['retry-after']);

/* ========================================================================= *
 * 6 · WAS BEI EINEM UNERWARTETEN FEHLER NACH DRAUSSEN GEHT (D4)
 * ---------------------------------------------------------------------------
 * Dort stand `fehler(500, …, e.message)` — die Meldung der Ausnahme ging
 * ungeprüft an den Aufrufer. Bequem beim Entwickeln, im Betrieb verrät es den
 * Innenbau: eine D1-Meldung nennt Tabellen und Spalten, eine JS-Meldung nennt
 * Feldnamen. Was sonst noch in einer Ausnahme steckt, weiss man vorher nicht
 * — das ist das Wesen einer unerwarteten Ausnahme.
 *
 * Zwei Regeln stehen hier gegeneinander, und beide gelten: „keine sensiblen
 * Daten nach draussen" und „keine stillen Fehlschläge, was nicht geht sagt
 * warum". Die Auflösung ist eine Kennung.
 * ========================================================================= */
console.log('\n6 · Ein unerwarteter Fehler verrät nichts');

/* Eine Ablage, die beim Nachschlagen umfällt — und zwar mit einer Meldung,
   die etwas Verräterisches enthält. */
const kaputt = ablageSpeicher();
await kaputt.einrichten();
const echtesHole = kaputt.hole.bind(kaputt);
kaputt.hole = async (tabelle, wo) => {
  if (tabelle === 'bereiche') throw new Error(
    'D1_ERROR: no such column: geheim_spalte in tabelle bereiche');
  return echtesHole(tabelle, wo);
};

/* Eine ECHTE Sitzung, sonst antwortet die Anmeldeprüfung mit 401, bevor die
   Route überhaupt drankommt — und der Abschnitt prüfte nur, dass ein
   ungültiges Token abgewiesen wird. Das tut er woanders schon. */
const tok2 = 'sit_pruefung_500';
await kaputt.setze('konten', { id: 'k9', mail: 'x@y.ch', name: 'X' });
await kaputt.setze('sitzungen', { token: await abdruck(tok2), kontoId: 'k9',
  bis: new Date(Date.now() + 86400000).toISOString() });

const srv2 = await starte(8802, { ablage: kaputt });
const stillerFehler = await fetch(srv2.adresse + '/bereich/gibtesnicht', {
  headers: { Authorization: 'Bearer ' + tok2 } });
const text500 = await stillerFehler.text();

/* Ob es wirklich der 500er-Weg war — sonst prüft der Abschnitt nichts. */
p('Der Fehler kommt als 500 an', stillerFehler.status === 500,
  stillerFehler.status + ': ' + text500.slice(0, 90));

if (stillerFehler.status === 500) {
  p('Die innere Meldung geht NICHT nach draussen',
    !/D1_ERROR|geheim_spalte|no such column/.test(text500), text500.slice(0, 120));
  p('Aber es bleibt nicht stumm — es kommt ein Satz',
    /schiefgegangen/.test(text500), text500.slice(0, 120));
  p('… mit einer Kennung, unter der man es wiederfindet',
    /Kennung [0-9a-f]{4,}/.test(text500), text500.slice(0, 160));
}

/* Und die Gegenprobe: erwartbare Fehler sagen weiterhin im Klartext, was
   los ist. Ein Fehler, mit dem gerechnet wurde, ist keine Ausnahme, sondern
   eine Antwort — den zu verschweigen wäre der andere Fehler. */
const ohneToken = await fetch(srv2.adresse + '/bereich/liste');
const t401 = await ohneToken.text();
p('Ein erwartbarer Fehler sagt weiterhin im Klartext, was los ist',
  ohneToken.status === 401 && t401.length > 20 && !/Kennung/.test(t401),
  ohneToken.status + ': ' + t401.slice(0, 90));

await srv2.stopp();

/* ========================================================================= *
 * 7 · ROLLEN FALLEN ZU, NICHT AUF (D1)
 * ---------------------------------------------------------------------------
 * Die Muss-Liste nennt „Eingaben validieren". Nachgemessen ist die Prüfung
 * da — sie steht nur an jeder Route einzeln statt an einem Ort. Das ist
 * Ordnung, nicht Sicherheit.
 *
 * Was wirklich zählt, ist die Richtung des Zweifels: eine unbekannte Rolle
 * muss SPERREN, nicht durchlassen. Diese eine Zeile lässt sich beim Umbauen
 * lautlos umdrehen, und niemand merkt es — deshalb steht sie hier.
 * ========================================================================= */
console.log('\n7 · Eine unbekannte Rolle sperrt');

const { darf, ROLLEN } = await import('../../server/kern.ts');

gleich('voll darf Rechte ändern', darf('voll', 'rechte'), true);
gleich('lesen darf nicht bearbeiten', darf('lesen', 'bearbeiten'), false);
gleich('Eine erfundene Rolle darf gar nichts', darf('superchef', 'lesen'), false);
gleich('Eine leere Rolle darf gar nichts', darf('', 'lesen'), false);
/* `darf` verspricht `rolle: string`. Die beiden Zeilen darunter prüfen
   absichtlich, was bei einem FEHLENDEN Wert geschieht — die Rolle kommt aus
   der Ablage und kann dort wirklich fehlen. Der Umweg über eine zweite Sicht
   auf dieselbe Funktion sagt genau das: hier wird die Zusage bewusst
   überschritten, nicht versehentlich. */
const darfRoh = darf as (rolle: unknown, was: string) => boolean;
gleich('undefined darf gar nichts', darfRoh(undefined, 'lesen'), false);
gleich('null darf gar nichts', darfRoh(null, 'lesen'), false);
p('Es gibt genau die fünf Rollen aus der Doku',
  JSON.stringify(Object.keys(ROLLEN).sort()) ===
  JSON.stringify(['edit', 'kein', 'komm', 'lesen', 'voll']),
  Object.keys(ROLLEN).join(', '));

console.log(`\n  Suite 58 — Bremse, Kopfzeilen, Fehler und Rollen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
