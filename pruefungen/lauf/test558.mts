/* Suite 558 — Die angemeldeten Geräte gibt es wirklich
 * ============================================================================
 * DER FUND. In den Einstellungen steht unter „Angemeldete Geräte" der Satz:
 *
 *     „Die Liste und der Freigabe-Code stehen im Wolke-Fenster"
 *
 * Den Freigabe-Code gibt es. **Die Liste nicht.** Das Wolke-Fenster zeigt
 * eine einzige Zeile — „Gerät: <dieses hier>" —, und das ist kein
 * Verzeichnis, sondern ein Spiegel. Wer wissen will, ob noch ein altes
 * Telefon an seinem Konto hängt, erfährt es nirgends; wer eines abmelden
 * will, kann es nicht.
 *
 * Und der Server weiss es die ganze Zeit. `sitzungen` hält seit dem ersten
 * Tag `geraet`, `angelegt` und `bis` — drei Spalten, die geschrieben und
 * nie gelesen werden (`sitzungGeben`, `server/kern.ts`). Es fehlte nur der
 * Weg, sie zu erfragen.
 *
 * Das ist §47 in seiner leisesten Form: nicht „im README versprechen, was
 * nicht läuft", sondern es in der Oberfläche versprechen, wo es noch
 * glaubwürdiger klingt.
 *
 * WAS DIESER LAUF HÄLT
 *
 *   1  Ohne Anmeldung gibt es keine Liste (§26: der Server entscheidet).
 *   2  Angemeldet kommt die Liste — und zwar NUR die eigenen Sitzungen.
 *   3  Kein Eintrag trägt den Token, weder roh noch als ganzen Abdruck
 *      (§40, §42). Was herauskommt, ist ein Stück des Abdrucks; daraus
 *      lässt sich der Token nicht zurückrechnen.
 *   4  Genau EIN Eintrag ist „aktuell" — der, mit dem gefragt wurde.
 *   5  Ein Gerät lässt sich abmelden, und danach ist sein Token tot.
 *   6  Ein FREMDES Gerät lässt sich nicht abmelden — und lebt danach noch.
 *   7  Eine Marke darf das alles nicht: sie ist ein Programm, kein Mensch.
 *
 * Kein Port, kein Browser: gemessen wird gegen den echten Kern mit der
 * Ablage im Arbeitsspeicher. Dieser Lauf darf deshalb neben einem vollen
 * Lauf gefahren werden (§30, L205).
 *
 *   node pruefungen/lauf/test558.mts
 * ==========================================================================*/
let ok = 0, weg = 0;
const p = (n: string, b: unknown, extra = ''): void => {
  if (b) { ok++; console.log('  ✓ ' + n); }
  else { weg++; console.log('  ✗ ' + n + (extra ? ' — ' + extra : '')); }
};

/* Nachladen statt festem Import — eine Gegenprobe, die etwas entfernt,
   soll rot werden und nicht beim Laden sterben (die Lehre aus test92). */
let beantworte: any = null, ablageSpeicher: any = null;
let ladefehler = '';
try {
  const k = await import('../../server/kern.ts');
  const a = await import('../../server/ablage.ts');
  beantworte = k.beantworte;
  ablageSpeicher = a.ablageSpeicher;
} catch (e: unknown) { ladefehler = e instanceof Error ? e.message : String(e); }

if (ladefehler || !beantworte || !ablageSpeicher) {
  console.log('\n  Der Kern lässt sich nicht laden: ' + (ladefehler || 'Wege fehlen'));
  console.log('\n  Suite 558 — Angemeldete Geräte: 0 ok, 1 offen');
  process.exit(1);
}

const hash = async (t: string) => {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
};

const jetzt = new Date().toISOString();
const inDreissig = new Date(Date.now() + 30 * 86400000).toISOString();

const ablage = ablageSpeicher();
await ablage.setze('konten', { id: 'k1', name: 'Redur', mail: 'r@example.invalid',
                               herkunft: 'probe', angelegt: jetzt });
await ablage.setze('konten', { id: 'k2', name: 'Fremd', mail: 'f@example.invalid',
                               herkunft: 'probe', angelegt: jetzt });

/* `sit_` MUSS davorstehen — `werFragt` entscheidet am Präfix, ob es eine
   Sitzung oder eine Marke ist (die Lehre aus test131). */
const RECHNER = 'sit_probe-rechner';
const TELEFON = 'sit_probe-telefon';
const FREMD   = 'sit_probe-fremdes-konto';
const H_RECHNER = await hash(RECHNER);
const H_TELEFON = await hash(TELEFON);
const H_FREMD   = await hash(FREMD);

await ablage.setze('sitzungen', { token: H_RECHNER, kontoId: 'k1',
  geraet: 'Arbeitsrechner', angelegt: jetzt, bis: inDreissig });
await ablage.setze('sitzungen', { token: H_TELEFON, kontoId: 'k1',
  geraet: 'Telefon', angelegt: jetzt, bis: inDreissig });
await ablage.setze('sitzungen', { token: H_FREMD, kontoId: 'k2',
  geraet: 'Fremdes Gerät', angelegt: jetzt, bis: inDreissig });

/* Eine Marke fürs siebte Kapitel. */
await ablage.setze('marken', { wert: await hash('red_probe-marke'), kontoId: 'k1',
  name: 'Programm', angelegt: jetzt, bis: '' });

const ruf = (pfad: string, methode = 'GET', koerper: any = null, token?: string) =>
  beantworte({ pfad, methode, koerper: koerper || {},
               kopf: token ? { authorization: 'Bearer ' + token } : {}, suche: {} },
             ablage, {});

const alsObjekt = (a: any) => {
  try { return typeof a.koerper === 'string' ? JSON.parse(a.koerper) : a.koerper; }
  catch { return {}; }
};

console.log('\n' + '─'.repeat(60));
console.log('Suite 558 — Die angemeldeten Geräte gibt es wirklich');
console.log('─'.repeat(60));

/* ---------------------------------------------------------------------- */
console.log('\n1 · Ohne Anmeldung keine Liste');

const ohne = await ruf('/konto/geraete');
console.log('    ohne Kopfzeile: Status ' + ohne.status);
p('Ohne Anmeldung antwortet der Server 401 (§26)', ohne.status === 401,
  'Status ' + ohne.status + ' — ' + JSON.stringify(alsObjekt(ohne)).slice(0, 90));

/* ---------------------------------------------------------------------- */
console.log('\n2 · Angemeldet kommt die Liste — und nur die eigene');

const a1 = await ruf('/konto/geraete', 'GET', null, RECHNER);
const l1 = alsObjekt(a1);
const liste: any[] = Array.isArray(l1.geraete) ? l1.geraete : [];
console.log('    Status ' + a1.status + ' · Einträge: ' + liste.length);
if (liste.length) console.log('    ' + JSON.stringify(liste, null, 0).slice(0, 260));

p('Den Weg `konto/geraete` gibt es', a1.status === 200,
  'Status ' + a1.status + ' — den Weg gibt es nicht, und die Einstellungen ' +
  'versprechen trotzdem eine Liste');
p('Beide eigenen Geräte stehen darin', liste.length === 2, liste.length + ' statt 2');
/* DIESE VIER BRAUCHEN EINE VOLLE LISTE, sonst sind sie grün, WEIL nichts
   kam. Im ersten Anlauf waren genau sie grün gegen einen Weg, den es gar
   nicht gab — eine leere Liste enthält kein fremdes Konto und keinen
   Token, und zwei Kennungen aus null Einträgen sind auch verschieden.
   §55.2: wer eine Prüfung schreibt, prüft zuerst, ob sie rot werden KANN. */
p('Das fremde Konto steht NICHT darin',
  liste.length === 2 && !liste.some(g => String(g.geraet || '') === 'Fremdes Gerät'),
  liste.length ? 'ein anderes Konto wäre über diesen Weg sichtbar' : 'keine Liste'); 
p('Jeder Eintrag nennt sein Gerät',
  liste.length === 2 && liste.every(g => typeof g.geraet === 'string' && g.geraet),
  JSON.stringify(liste.map(g => g.geraet)));
p('Jeder Eintrag nennt, seit wann und bis wann',
  liste.length === 2 && liste.every(g => g.angelegt && g.bis));

/* ---------------------------------------------------------------------- */
console.log('\n3 · Und kein Eintrag trägt den Schlüssel (§40, §42)');

const alsText = JSON.stringify(liste);
const traegtRoh = alsText.includes(RECHNER) || alsText.includes(TELEFON);
const traegtAbdruck = alsText.includes(H_RECHNER) || alsText.includes(H_TELEFON);
console.log('    roher Token in der Antwort:     ' + traegtRoh);
console.log('    ganzer Abdruck in der Antwort:  ' + traegtAbdruck);
p('Kein roher Token geht hinaus', liste.length === 2 && !traegtRoh,
  liste.length ? 'der Token steht in der Antwort' : 'keine Liste');
p('Auch nicht der ganze Abdruck', liste.length === 2 && !traegtAbdruck,
  liste.length ? 'der volle Hash ist zwar kein Token, aber auch nicht nötig' : 'keine Liste');

const kennungen = liste.map(g => String(g.kennung || ''));
p('Jeder Eintrag hat eine Kennung zum Abmelden',
  kennungen.length === 2 && kennungen.every(x => x.length >= 8));
p('Die Kennungen sind verschieden',
  kennungen.length === 2 && new Set(kennungen).size === kennungen.length,
  kennungen.length + ' Kennungen');

/* ---------------------------------------------------------------------- */
console.log('\n4 · Genau eines ist das aktuelle');

const aktuelle = liste.filter(g => g.aktuell === true);
console.log('    als „aktuell" markiert: ' + aktuelle.length +
            (aktuelle[0] ? ' (' + aktuelle[0].geraet + ')' : ''));
p('Genau ein Eintrag ist „aktuell"', aktuelle.length === 1, aktuelle.length + ' Stück');
p('Und es ist der, mit dem gefragt wurde',
  aktuelle.length === 1 && aktuelle[0].geraet === 'Arbeitsrechner',
  aktuelle[0] ? aktuelle[0].geraet : 'keiner');

/* ---------------------------------------------------------------------- */
console.log('\n5 · Ein Gerät abmelden, und der Token ist tot');

const telefon = liste.find(g => g.geraet === 'Telefon');
const abmelden = telefon
  ? await ruf('/konto/geraete/weg', 'POST', { kennung: telefon.kennung }, RECHNER)
  : { status: 0 };
console.log('    Abmelden: Status ' + abmelden.status);
p('Das Telefon lässt sich abmelden', abmelden.status === 200,
  'Status ' + abmelden.status);

const nachher = await ruf('/konto/ich', 'GET', null, TELEFON);
console.log('    danach `konto/ich` mit dem Telefon-Token: ' + nachher.status);
p('Danach ist sein Token tot', nachher.status === 401,
  'Status ' + nachher.status + ' — die Sitzung lebt weiter');

const l2 = alsObjekt(await ruf('/konto/geraete', 'GET', null, RECHNER));
const rest: any[] = Array.isArray(l2.geraete) ? l2.geraete : [];
p('Und die Liste zählt nur noch eines', rest.length === 1, rest.length + ' Einträge');

/* ---------------------------------------------------------------------- */
console.log('\n6 · Ein fremdes Gerät lässt sich nicht abmelden');

const fremdKennung = H_FREMD.slice(0, 16);
const fremdWeg = await ruf('/konto/geraete/weg', 'POST', { kennung: fremdKennung }, RECHNER);
const fremdLebt = await ruf('/konto/ich', 'GET', null, FREMD);
console.log('    Versuch: Status ' + fremdWeg.status +
            ' · das fremde Gerät danach: ' + fremdLebt.status);
/* Auch hier: ein Weg, den es NICHT gibt, antwortet ebenfalls mit 404 —
   also gilt diese Zusage nur, wenn der Weg oben überhaupt geantwortet hat. */
p('Der Versuch scheitert', a1.status === 200 && fremdWeg.status >= 400,
  a1.status === 200 ? 'Status ' + fremdWeg.status : 'den Weg gibt es gar nicht');
p('Und die fremde Sitzung lebt noch', a1.status === 200 && fremdLebt.status === 200,
  a1.status === 200 ? 'Status ' + fremdLebt.status + ' — ein fremdes Konto wurde abgemeldet'
                    : 'den Weg gibt es gar nicht');

/* ---------------------------------------------------------------------- */
console.log('\n7 · Eine Marke ist ein Programm, kein Mensch');

const mitMarke = await ruf('/konto/geraete', 'GET', null, 'red_probe-marke');
console.log('    mit Marke: Status ' + mitMarke.status);
p('Eine Marke bekommt die Geräteliste nicht (§26)', mitMarke.status === 403,
  'Status ' + mitMarke.status);

/* ==========================================================================
 * 8 · UND DAS FENSTER, DAS DIE EINSTELLUNGEN VERSPRECHEN
 * ==========================================================================
 * Der Server kann die Liste jetzt. Das Versprechen stand aber in der
 * OBERFLÄCHE — „Die Liste … steht im Wolke-Fenster" —, also wird dort
 * gemessen. Der Server wird hier durch einen Stellvertreter ersetzt: es
 * geht um das Fenster, nicht noch einmal um den Weg.
 *
 * `Wolke` ist ein `const` im Skriptbereich (E207) und kein Feld an
 * `window` — sein RÜCKGABEOBJEKT ist trotzdem beschreibbar, und genau
 * darüber hängt der Stellvertreter.
 *
 * `listen(0)` statt einer festen Zahl (L205).
 * ========================================================================*/
console.log('\n8 · Und das Fenster, das die Einstellungen versprechen');

const { chromium } = await import('playwright');
const http = (await import('node:http')).default;
const fs = (await import('node:fs')).default;
const pfadM = (await import('node:path')).default;

const WURZEL = pfadM.resolve(import.meta.dirname, '../..');
const TYP: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon'
};
const server = http.createServer((q: any, r: any) => {
  const rein = decodeURIComponent((q.url ?? '/').split('?')[0] ?? '/');
  const datei = pfadM.join(WURZEL, rein === '/' ? 'index.html' : rein.slice(1));
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    r.writeHead(404); r.end(); return;
  }
  r.writeHead(200, { 'Content-Type': TYP[pfadM.extname(datei)] ?? 'application/octet-stream' });
  r.end(fs.readFileSync(datei));
});
await new Promise<void>(f => { server.listen(0, '127.0.0.1', () => f()); });
const PORT = (server.address() as { port: number }).port;

const browser = await chromium.launch();
const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const seite = await kontext.newPage();
const browserFehler: string[] = [];
seite.on('pageerror', (e: any) => browserFehler.push(String(e.message)));
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForFunction(
  'typeof Wolke !== "undefined" && typeof WolkeFenster !== "undefined"',
  null, { timeout: 30000 });
await seite.waitForTimeout(400);

const imFenster = await seite.evaluate(
  '(async () => {\n'
+ '  if (typeof WolkeFenster.geraeteFenster !== "function")\n'
+ '    return { fenster: false };\n'
+ '  Wolke.geraeteListe = async () => ({ geraete: [\n'
+ '    { kennung: "aaaabbbbccccdddd", geraet: "Arbeitsrechner",\n'
+ '      angelegt: "2026-09-01T10:00:00.000Z", bis: "2026-10-01T10:00:00.000Z", aktuell: true },\n'
+ '    { kennung: "1111222233334444", geraet: "Telefon <script>",\n'
+ '      angelegt: "2026-08-20T08:30:00.000Z", bis: "2026-09-19T08:30:00.000Z", aktuell: false }\n'
+ '  ] });\n'
+ '  let gebeten = null;\n'
+ '  Wolke.geraetWeg = async (kennung) => { gebeten = kennung; return { ok: true }; };\n'
+ '  await WolkeFenster.geraeteFenster();\n'
+ '  await new Promise(f => setTimeout(f, 350));\n'
+ '  const kasten = document.getElementById("wo-geraete");\n'
+ '  const text = kasten ? kasten.textContent || "" : "";\n'
+ '  const knoepfe = kasten ? Array.from(kasten.querySelectorAll("[data-weg]")) : [];\n'
+ '  const fremd = knoepfe.find(b => !b.dataset.selbst);\n'
+ '  if (fremd) fremd.click();\n'
+ '  await new Promise(f => setTimeout(f, 250));\n'
+ '  return { fenster: true, text,\n'
+ '           knoepfe: knoepfe.length,\n'
+ '           selbstMarkiert: knoepfe.filter(b => b.dataset.selbst).length,\n'
+ '           rohesSkript: kasten ? kasten.innerHTML.includes("<script>") : false,\n'
+ '           gebeten };\n'
+ '})()') as any;

console.log('    Fenster da: ' + imFenster.fenster +
            ' · Zeilen mit Knopf: ' + (imFenster.knoepfe ?? 0) +
            ' · als „dieses Gerät" markiert: ' + (imFenster.selbstMarkiert ?? 0));
console.log('    nach dem Klick zurückgezogen: ' + JSON.stringify(imFenster.gebeten ?? null));

p('Das Wolke-Fenster hat ein Gerätefenster', imFenster.fenster === true,
  'die Einstellungen versprechen eine Liste, die es nicht gibt');
p('Beide Geräte stehen mit Namen darin',
  imFenster.fenster && String(imFenster.text).includes('Arbeitsrechner')
                    && String(imFenster.text).includes('Telefon'),
  String(imFenster.text || '').slice(0, 90));
p('Das Anmeldedatum steht dabei',
  imFenster.fenster && /angemeldet am/.test(String(imFenster.text)));
p('Genau eines ist als „dieses Gerät" markiert', imFenster.selbstMarkiert === 1,
  (imFenster.selbstMarkiert ?? 0) + ' Stück');
p('Jede Zeile hat einen Knopf zum Zurückziehen', imFenster.knoepfe === 2,
  (imFenster.knoepfe ?? 0) + ' statt 2');
p('Der Knopf zieht genau dieses Gerät zurück',
  imFenster.gebeten === '1111222233334444', JSON.stringify(imFenster.gebeten ?? null));
/* §19: der Gerätename kommt vom Server und ist Nutzertext. */
p('Ein Gerätename wird escapt (§19)',
  imFenster.fenster === true && imFenster.rohesSkript === false,
  imFenster.fenster ? 'ein `<script>` im Gerätenamen landet roh im Markup'
                    : 'ohne Fenster nicht messbar');
/* ── UND AM TELEFON SIND DIE KNÖPFE ZU TREFFEN (§37) ─────────────────────
   Das BILD hat es gezeigt und die Messung es bestätigt: „Zurückziehen" und
   „Abmelden" standen als blosser Text da, 18 px hoch. §37 erlaubt einem
   Nebenweg 32 px — mit geschriebenem Grund. 18 px sind auch das nicht, und
   ein Knopf, der ein Gerät abmeldet, ist keiner, den man versehentlich
   verfehlen soll. Gemessen wird die GERENDERTE Box, nicht eine Zeile im
   Stilblatt: das ist die Lehre aus L206. */
const handy = await browser.newContext({
  viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const h = await handy.newPage();
h.on('pageerror', (e: any) => browserFehler.push('handy: ' + String(e.message)));
await h.goto(`http://localhost:${PORT}/index.html`);
await h.waitForFunction('typeof Wolke !== "undefined" && typeof WolkeFenster !== "undefined"',
  null, { timeout: 30000 });
await h.waitForTimeout(600);

const amHandy = await h.evaluate(
  '(async () => {\n'
+ '  Wolke.geraeteListe = async () => ({ geraete: [\n'
+ '    { kennung: "aaaabbbbccccdddd", geraet: "Arbeitsrechner",\n'
+ '      angelegt: "2026-09-01T10:00:00.000Z", bis: "2026-12-01T10:00:00.000Z", aktuell: true },\n'
+ '    { kennung: "1111222233334444", geraet: "Telefon",\n'
+ '      angelegt: "2026-08-20T08:30:00.000Z", bis: "2026-12-19T08:30:00.000Z", aktuell: false }\n'
+ '  ] });\n'
+ '  await WolkeFenster.geraeteFenster();\n'
+ '  await new Promise(f => setTimeout(f, 400));\n'
+ '  const kasten = document.getElementById("wo-geraete");\n'
+ '  if (!kasten) return { da: false };\n'
+ '  const k = Array.from(kasten.querySelectorAll("[data-weg]")).map(x => {\n'
+ '    const r = x.getBoundingClientRect();\n'
+ '    return { t: (x.textContent || "").trim(),\n'
+ '             b: Math.round(r.width), h: Math.round(r.height),\n'
+ '             rechts: Math.round(r.right) };\n'
+ '  });\n'
+ '  const f = document.querySelector(".finder");\n'
+ '  const fr = f ? f.getBoundingClientRect() : null;\n'
+ '  return { da: true, knoepfe: k, fenster: innerWidth,\n'
+ '           blattRechts: fr ? Math.round(fr.right) : 0 };\n'
+ '})()') as any;

console.log('    am Telefon: ' + ((amHandy.knoepfe || [])
  .map((k: any) => k.t + ' ' + k.b + '×' + k.h).join(' · ') || 'keine Knöpfe'));

const klein = (amHandy.knoepfe || []).filter((k: any) => k.h < 44);
p('Die Knöpfe zum Abmelden messen am Telefon 44 px (§37)',
  amHandy.da && (amHandy.knoepfe || []).length === 2 && klein.length === 0,
  klein.length ? klein.map((k: any) => k.t + ' (' + k.h + ' px)').join(', ')
               : 'keine Knöpfe gefunden');
p('Und sie stehen im Bild',
  amHandy.da && (amHandy.knoepfe || []).every((k: any) => k.rechts <= amHandy.fenster),
  'ein Knopf ragt über den Rand');

await handy.close();

p('Keine Ausnahme im Browser', browserFehler.length === 0,
  browserFehler.slice(0, 2).join(' · '));

await kontext.close();
await browser.close();
server.close();

console.log(`\n${ok}/${ok + weg} bestanden`);
process.exit(weg ? 1 : 0);
