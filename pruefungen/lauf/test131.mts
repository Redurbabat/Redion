/* Suite 95 — Weckrufe: Web Push, und was NICHT hinausgeht (L33, E54)
 * ============================================================================
 * `LUECKEN.md` L33: eine Erinnerung meldet sich nur, solange Redion offen
 * ist. Ist die App um acht Uhr geschlossen, passiert um acht Uhr nichts.
 * Ein Telefon zu wecken, ohne dass die Seite läuft, geht nur mit Web Push.
 *
 * DIE ENTSCHEIDUNG, DIE VOR DEM CODE FIEL: der Stoss trägt nichts.
 *
 * Ein Web Push kann Inhalt mitbringen. Er müsste dann verschlüsselt werden
 * — aber das ist nicht der Grund, ihn wegzulassen. Der Grund ist, dass der
 * Text einer Erinnerung Redions Server nichts angeht. „Zahnarzt 14:00" ist
 * genau die Sorte Satz, die local-first schützen soll.
 *
 * DESHALB IST ABSCHNITT 5 DER WICHTIGSTE DIESES LAUFS. Alles andere hier
 * kann man am Verhalten merken: ein Wecker, der nicht klingelt, fällt auf.
 * Dass ein Erinnerungstext mitgeschickt wird, fällt NIEMANDEM auf — nicht
 * dem, der es baut, und schon gar nicht dem, der die App benutzt. Genau
 * solche Fehler brauchen eine Prüfung.
 *
 * Gemessen wird gegen den echten Kern, mit der Ablage im Arbeitsspeicher
 * und einem `fetch`, das jeden Stoss mitschreibt, statt ihn zu senden.
 *
 *   node pruefungen/lauf/test131.mts
 * ==========================================================================*/
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};
const gleich = (n: string, ist: unknown, soll: unknown): void =>
  p(n, ist === soll, `ist ${JSON.stringify(ist)}, soll ${JSON.stringify(soll)}`);

/* Nachladen statt festem Import: eine Gegenprobe, die eine Funktion
   entfernt, soll rot werden und nicht beim Laden sterben (wie test92). */
let beantworte: any = null, ablageSpeicher: any = null, weckrufeFaellig: any = null;
let stossen: any = null, schluesselLesen: any = null, marke: any = null, b64u: any = null;
let ladefehler = '';
try {
  const k = await import('../../server/kern.ts');
  const a = await import('../../server/ablage.ts');
  const s = await import('../../server/sicherheit/push.ts');
  beantworte = k.beantworte; weckrufeFaellig = (k as any).weckrufeFaellig;
  ablageSpeicher = a.ablageSpeicher;
  stossen = s.stossen; schluesselLesen = s.schluesselLesen;
  marke = s.marke; b64u = s.b64u;
} catch (e: unknown) { ladefehler = e instanceof Error ? e.message : String(e); }

if (ladefehler || !beantworte || !weckrufeFaellig || !stossen) {
  console.log('\n  Der Kern lässt sich nicht laden: ' + (ladefehler || 'Wege fehlen'));
  console.log('\n  Suite 95 — Weckrufe: 0 ok, 1 offen');
  process.exit(1);
}

/* --------------------------------------------------------------------------
 * Aufbau: ein Konto mit Sitzung, damit die Wege überhaupt antworten.
 * ------------------------------------------------------------------------*/
const ablage = ablageSpeicher();
await ablage.setze('konten', { id: 'k1', name: 'Redur', mail: 'r@example.invalid',
                               herkunft: 'probe', angelegt: new Date().toISOString() });
/* Der Kern hasht Token; für die Prüfung reicht der Weg über die Ablage
   selbst — nachgesehen in `werFragt`. */
const kryptoHash = async (t: string) => {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
};
/* `sit_` MUSS DAVORSTEHEN: `werFragt` entscheidet daran, ob es eine
   Sitzung oder eine Marke ist. Ohne das Präfix sucht der Kern gar nicht
   erst nach und antwortet 401 — was beim ersten Versuch nach einem
   kaputten Weg aussah. */
const TOKEN = 'sit_probe-token-weckruf';
await ablage.setze('sitzungen', { token: await kryptoHash(TOKEN), kontoId: 'k1',
                                  angelegt: new Date().toISOString(), bis: '' });

const ruf = (pfad: string, methode = 'GET', koerper: any = null, umwelt: any = {}) =>
  beantworte({ pfad, methode, koerper: koerper || {},
               kopf: { authorization: 'Bearer ' + TOKEN }, suche: {} },
             ablage, umwelt);

const alsObjekt = (a: any) => {
  try { return typeof a.koerper === 'string' ? JSON.parse(a.koerper) : a.koerper; }
  catch { return {}; }
};

/* Ein Schlüsselpaar, echt gerechnet — nicht erfunden. */
const paar = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk: any = await crypto.subtle.exportKey('jwk', (paar as CryptoKeyPair).privateKey);
const roh = await crypto.subtle.exportKey('raw', (paar as CryptoKeyPair).publicKey);
const OEFFENTLICH = b64u(roh);
const PRIVAT = jwk.d;

const UMWELT = { VAPID_OEFFENTLICH: OEFFENTLICH, VAPID_PRIVAT: PRIVAT,
                 VAPID_ABSENDER: 'mailto:probe@example.invalid' };


console.log('\n1 · Ohne Schlüssel eine ehrliche Absage');

/* Ein Server ohne VAPID kann nicht wecken. Er soll das SAGEN, nicht eine
   leere Antwort geben — sonst versucht das Gerät es endlos und niemand
   erfährt, woran es liegt. */
const ohne = await ruf('/push/schluessel', 'GET', null, {});
gleich('Ohne Schlüssel: 503', ohne.status, 503);
p('… und der Satz nennt den Weg zur Einrichtung',
  /SERVER-EINRICHTEN/.test(String(ohne.koerper)), String(ohne.koerper).slice(0, 90));
p('… und sagt, dass die Erinnerungen trotzdem kommen',
  /solange Redion offen ist/.test(String(ohne.koerper)));

const mit = await ruf('/push/schluessel', 'GET', null, UMWELT);
gleich('Mit Schlüssel: 200', mit.status, 200);
gleich('… und der öffentliche Schlüssel kommt heraus',
  alsObjekt(mit).oeffentlich, OEFFENTLICH);


console.log('\n2 · Anmelden, wecken, abmelden');

const anmelden = await ruf('/push/anmelden', 'POST', {
  geraet: 'Telefon', endpunkt: 'https://push.example.invalid/abc',
  p256dh: 'aaa', auth: 'bbb' }, UMWELT);
gleich('Anmelden geht', anmelden.status, 200);
gleich('Ein Eintrag steht in der Ablage', (await ablage.finde('weckrufe')).length, 1);

/* EIN EINTRAG JE GERÄT. Zwei Anmeldungen desselben Geräts wären zwei
   Stösse für einen Wecker. */
await ruf('/push/anmelden', 'POST', {
  geraet: 'Telefon', endpunkt: 'https://push.example.invalid/abc2',
  p256dh: 'aaa', auth: 'bbb' }, UMWELT);
const nachZweitem = await ablage.finde('weckrufe');
gleich('Zweimal anmelden legt keinen zweiten Eintrag an', nachZweitem.length, 1);
gleich('… sondern frischt den Endpunkt auf',
  nachZweitem[0].endpunkt, 'https://push.example.invalid/abc2');

/* Eine Anmeldung ist noch kein Wecker. */
gleich('Nach dem Anmelden steht keine Zeit', nachZweitem[0].wann || '', '');

const wecken = await ruf('/push/wecken', 'POST',
  { geraet: 'Telefon', wann: '2026-08-09T06:00:00Z' }, UMWELT);
gleich('Wecken geht', wecken.status, 200);
gleich('… und die Zeit steht drin',
  (await ablage.finde('weckrufe'))[0].wann, '2026-08-09T06:00:00Z');

/* Eine Zeit, die kein Datum ist, wäre ein Wecker, der nie klingelt — und
   niemand würde je erfahren, warum. */
const krumm = await ruf('/push/wecken', 'POST',
  { geraet: 'Telefon', wann: 'morgen früh' }, UMWELT);
gleich('Eine unlesbare Zeit wird abgewiesen', krumm.status, 400);

const fremd = await ruf('/push/wecken', 'POST',
  { geraet: 'Gibtsnicht', wann: '2026-08-09T06:00:00Z' }, UMWELT);
gleich('Ein unbekanntes Gerät wecken geht nicht', fremd.status, 404);

const ohneGeraet = await ruf('/push/anmelden', 'POST',
  { endpunkt: 'https://push.example.invalid/x' }, UMWELT);
gleich('Ohne Gerätekennung: 400', ohneGeraet.status, 400);

const httpEndpunkt = await ruf('/push/anmelden', 'POST',
  { geraet: 'T2', endpunkt: 'http://unsicher.example.invalid/x' }, UMWELT);
gleich('Ein Endpunkt ohne https wird abgewiesen', httpEndpunkt.status, 400);


console.log('\n3 · Der geplante Lauf stösst, was fällig ist');

/* Ein `fetch`, das nichts sendet, sondern mitschreibt. */
type Stoss = { url: string; kopf: Record<string, string>; koerper: unknown; laenge: number };
let gesendet: Stoss[] = [];
let antwortStatus = 201;
const mitschreiben = (async (url: any, opt: any = {}) => {
  const kopf: Record<string, string> = {};
  Object.entries(opt.headers || {}).forEach(([k2, v]) => { kopf[k2] = String(v); });
  const k = opt.body;
  gesendet.push({ url: String(url), kopf, koerper: k,
                  laenge: k == null ? 0 : (typeof k === 'string' ? k.length : 1) });
  return { status: antwortStatus, ok: antwortStatus < 300 } as any;
}) as unknown as typeof fetch;

const laufen = (jetztZeit: string) => weckrufeFaellig(
  ablage, { ...UMWELT, holen: mitschreiben }, jetztZeit, stossen, schluesselLesen);

gesendet = [];
const zuFrueh = await laufen('2026-08-09T05:59:00Z');
gleich('Vor der Zeit wird nicht gestossen', gesendet.length, 0);
gleich('… und der Lauf sagt das auch', zuFrueh.gestossen, 0);

gesendet = [];
const jetzt = await laufen('2026-08-09T06:00:01Z');
gleich('Zur Zeit wird gestossen', gesendet.length, 1);
gleich('… und der Lauf zählt es', jetzt.gestossen, 1);
gleich('… an den richtigen Endpunkt',
  gesendet[0]?.url, 'https://push.example.invalid/abc2');

/* DIE ZEIT WIRD GELEERT, DER EINTRAG BLEIBT. Das Gerät ist ja weiter
   angemeldet; eine neue Erinnerung setzt einfach eine neue Zeit. */
const nachStoss = await ablage.finde('weckrufe');
gleich('Der Eintrag bleibt stehen', nachStoss.length, 1);
gleich('… aber die Zeit ist weg', nachStoss[0].wann || '', '');

gesendet = [];
await laufen('2026-08-09T07:00:00Z');
gleich('Ein zweiter Lauf stösst nicht noch einmal', gesendet.length, 0);


console.log('\n4 · Ein Gerät, das es nicht mehr gibt');

/* 404 oder 410 heisst: dieser Endpunkt ist tot. Dann den Eintrag löschen,
   nicht endlos wiederholen — sonst wächst die Tabelle mit Leichen, und
   jeder Lauf wird langsamer. */
await ruf('/push/wecken', 'POST',
  { geraet: 'Telefon', wann: '2026-08-09T08:00:00Z' }, UMWELT);
antwortStatus = 410;
gesendet = [];
const tot = await laufen('2026-08-09T08:00:01Z');
gleich('Ein 410 zählt als entfernt', tot.entfernt, 1);
gleich('… und der Eintrag ist weg', (await ablage.finde('weckrufe')).length, 0);
antwortStatus = 201;


console.log('\n5 · Und jetzt der wichtigste Abschnitt: was NICHT hinausgeht');

/* HIER KANN DIESE PHASE SCHEITERN, OHNE DASS ES JEMAND MERKT. Ein Wecker,
   der nicht klingelt, fällt auf. Ein Erinnerungstext, der mitgeschickt
   wird, fällt niemandem auf. */
await ruf('/push/anmelden', 'POST', {
  geraet: 'Telefon', endpunkt: 'https://push.example.invalid/geheim',
  p256dh: 'aaa', auth: 'bbb' }, UMWELT);
await ruf('/push/wecken', 'POST',
  { geraet: 'Telefon', wann: '2026-08-09T09:00:00Z' }, UMWELT);

/* Ein Erinnerungstext, den es NUR auf dem Gerät gibt. Käme er irgendwo
   hier heraus, hätte ihn jemand mitgeschickt. */
const GEHEIM = 'Zahnarzt Dr. Müller 14:00';

gesendet = [];
await laufen('2026-08-09T09:00:01Z');
const stoss = gesendet[0];
p('Es wurde gestossen', !!stoss);
gleich('Der Stoss hat KEINEN Körper', stoss?.laenge ?? -1, 0);
p('… und meldet das auch so', stoss?.kopf['Content-Length'] === '0',
  JSON.stringify(stoss?.kopf));

/* Der ganze Stoss als Text — Adresse, Kopfzeilen, Körper. Nichts davon
   darf den Text kennen. Auch nicht in Teilen: „Zahnarzt" allein wäre
   schon zu viel. */
const alles = JSON.stringify(stoss || {});
p('Kein Erinnerungstext im Stoss', !alles.includes('Zahnarzt') &&
  !alles.includes('Müller') && !alles.includes(GEHEIM), alles.slice(0, 120));

/* Und die Ablage selbst: was der Server über den Menschen weiss, ist ein
   Zeitpunkt und die Adresse eines Push-Dienstes. Sonst nichts. */
await ruf('/push/wecken', 'POST',
  { geraet: 'Telefon', wann: '2026-08-10T09:00:00Z' }, UMWELT);
const gespeichert = (await ablage.finde('weckrufe'))[0];
const felder = Object.keys(gespeichert).sort().join(',');
gleich('Der Eintrag trägt genau acht Felder', felder,
  'angelegt,auth,endpunkt,geraet,id,kontoId,p256dh,wann');
p('… und keines davon ist ein Text, den der Mensch geschrieben hat',
  !JSON.stringify(gespeichert).includes('Zahnarzt'),
  JSON.stringify(gespeichert).slice(0, 120));

/* Der Weg `/push/wecken` nimmt einen Text gar nicht erst an: wer `text`
   mitschickt, dessen `text` landet nirgends. */
await ruf('/push/wecken', 'POST',
  { geraet: 'Telefon', wann: '2026-08-11T09:00:00Z', text: GEHEIM,
    titel: GEHEIM, seite: 'abc123' }, UMWELT);
const mitTextVersucht = (await ablage.finde('weckrufe'))[0];
p('Ein mitgeschickter Text wird nicht gespeichert',
  !JSON.stringify(mitTextVersucht).includes('Zahnarzt') &&
  !JSON.stringify(mitTextVersucht).includes('abc123'),
  JSON.stringify(mitTextVersucht));


console.log('\n6 · Die Unterschrift ist eine echte');

/* Ein JWT, das der Push-Dienst nicht prüfen kann, ist ein Wecker, der nie
   klingelt — und die Meldung dazu ist unbrauchbar („401 unauthorized").
   Also hier nachrechnen, mit dem öffentlichen Schlüssel. */
const t = await marke('https://push.example.invalid/abc',
  await schluesselLesen(PRIVAT, OEFFENTLICH),
  'mailto:probe@example.invalid', Date.parse('2026-08-09T09:00:00Z'));
const [kopfT, rumpfT, sigT] = t.split('.');
p('Das JWT hat drei Teile', !!kopfT && !!rumpfT && !!sigT);

const vonB64u = (x: string) => {
  const s = x.replace(/-/g, '+').replace(/_/g, '/');
  const r = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  const b = new Uint8Array(r.length);
  for (let i = 0; i < r.length; i++) b[i] = r.charCodeAt(i);
  return b;
};
const kopfObj = JSON.parse(new TextDecoder().decode(vonB64u(kopfT!)));
const rumpfObj = JSON.parse(new TextDecoder().decode(vonB64u(rumpfT!)));
gleich('Der Kopf sagt ES256', kopfObj.alg, 'ES256');
/* `aud` ist die HERKUNFT, nicht der ganze Pfad — mit dem Pfad weist jeder
   Dienst den Stoss ab. */
gleich('`aud` ist die Herkunft, nicht der Pfad',
  rumpfObj.aud, 'https://push.example.invalid');
p('`exp` liegt in der Zukunft, aber unter 24 Stunden',
  rumpfObj.exp > Date.parse('2026-08-09T09:00:00Z') / 1000 &&
  rumpfObj.exp <= Date.parse('2026-08-09T09:00:00Z') / 1000 + 86400,
  String(rumpfObj.exp));

const echt = await crypto.subtle.verify(
  { name: 'ECDSA', hash: 'SHA-256' }, (paar as CryptoKeyPair).publicKey,
  vonB64u(sigT!), new TextEncoder().encode(kopfT + '.' + rumpfT));
/* DIE FALLE: `crypto.subtle.sign` gibt bei ECDSA rohe r‖s zurück, genau
   das, was JWS will. Wer eine Bibliothek gewohnt ist, die DER liefert,
   baut hier eine Umwandlung ein — und dann schlägt genau diese Zeile fehl. */
p('Die Unterschrift geht mit dem öffentlichen Schlüssel auf', echt === true,
  'sonst: r‖s versus DER');
gleich('Sie ist 64 Byte lang (r‖s, nicht DER)', vonB64u(sigT!).length, 64);


console.log('\n7 · Eine Marke darf keine Weckrufe legen');

/* Eine Marke ist ein Schlüssel für ein Programm; ein Weckruf ist ein
   Wecker für einen Menschen an einem Gerät. Dürfte eine Marke ihn legen,
   könnte ein Skript mit `schreiben`-Recht fremde Telefone um drei Uhr
   nachts klingeln lassen — und das steht in keiner Rechteliste. */
let markenTor: any = null;
try {
  const m = await import('../../server/sicherheit/marken.ts');
  markenTor = m.torPruefen;
  p('`push` steht bei den Wegen, die nur ein Mensch geht',
    (m.NUR_MIT_SITZUNG || []).includes('push'),
    JSON.stringify(m.NUR_MIT_SITZUNG));
} catch { p('Die Markenprüfung lässt sich laden', false); }

if (markenTor) {
  const sperre = markenTor({ marke: { rechte: 'alles' } }, 'push', 'POST');
  p('Eine Marke wird abgewiesen', !!sperre && sperre.status === 403,
    JSON.stringify(sperre));
  const mensch = markenTor({ konto: { id: 'k1' } }, 'push', 'POST');
  p('Ein Mensch darf', mensch === null);
}


console.log('\n8 · Ohne Server ändert sich nichts');

/* Web Push ist eine Zugabe des Cloud-Modus, keine Voraussetzung
   (CLAUDE.md §22). Ohne VAPID tut der geplante Lauf gar nichts — er darf
   dabei nicht werfen, sonst stirbt der Worker bei jedem Cron-Tick. */
/* Der zweite Punkt stand hier als `p(…, true)` — ein Literal, das nie rot
   werden kann (§55.2). Das Werfen wird jetzt wirklich gefangen: wirft der
   Lauf, ist der Punkt rot UND die Suite läuft trotzdem zu Ende. */
let leer: any = null, geworfen = '';
try {
  leer = await weckrufeFaellig(ablage, {}, '2030-01-01T00:00:00Z',
    stossen, schluesselLesen);
} catch (e) { geworfen = e instanceof Error ? e.message : String(e); }
gleich('Ohne Schlüssel wird nichts gestossen', leer?.gestossen, 0);
p('… und es wird auch nicht geworfen', geworfen === '', geworfen);

console.log(`\n  Suite 95 — Weckrufe: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
