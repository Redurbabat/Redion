/* Suite 93 — Grenzen für Agenten (L11)
 * ============================================================================
 * `LUECKEN.md` L11 stand auf „✗ es gibt keine Grenzen" und nannte fünf
 * Dinge. Nachgesehen am 8. August 2026 gab es zwei davon längst — sie
 * standen nur nicht in der Liste:
 *
 *   ✓ Rechte je Agent   jedes Werkzeug trägt `recht`, gefiltert wird über
 *                       `Konten.darf` — der Agent kann nie mehr als du
 *   ✓ Protokoll         `agent:laeufe`, die letzten 30 samt Rücknahme
 *
 * Drei fehlten wirklich, und alle drei betreffen den Fall, in dem niemand
 * hinsieht:
 *
 *   ✗ Notausschalter    Ein Agent liess sich nur anhalten, indem man das
 *                       Fenster schloss. Die Auslöser liefen weiter.
 *   ✗ Tageslimit        Das Guthaben gilt JE LAUF. Ein täglicher Auslöser
 *                       war damit unbegrenzt: acht Schritte, jeden Tag.
 *   ✗ Bestätigung       Ein Agent legte an, schrieb und änderte, ohne dass
 *                       jemand zustimmte. Zurücknehmen gibt es nur für
 *                       Angelegtes — was überschrieben wurde, war weg.
 *
 * WIE HIER GEMESSEN WIRD, OHNE DASS EIN MODELL LÄUFT. Der Agent fragt eine
 * lokale KI, die es im Prüflauf nicht gibt. Also wird `KI.frageKurz`
 * ersetzt: eine Vorgabe, die die Schritte der Reihe nach ausgibt. Damit
 * ist der Lauf bestimmt und schnell — und er prüft genau das, was hier
 * zählt: nicht was das Modell sagt, sondern was Redion daraufhin ZULÄSST.
 *
 *   node pruefungen/lauf/test129.mts
 * ==========================================================================*/
import { chromium } from 'playwright';
import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const WURZEL = path.resolve(import.meta.dirname, '../..');
const PORT = 9504;

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

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await seite.goto(`http://localhost:${PORT}/index.html`);
await seite.waitForTimeout(2400);

/**
 * Setzt eine Ersatz-KI ein, die die übergebenen Pläne der Reihe nach
 * ausgibt, und einen Agenten, der alles darf. Gibt die Zahl der wirklich
 * ausgeführten Werkzeuge zurück.
 */
const ruesten = (plaene: any[], grenzen: Record<string, unknown>) =>
  seite.evaluate(({ plaene: pl, grenzen: g }) => {
    /* Grenzen setzen */
    Object.entries(g).forEach(([k, v]) => Store.setMeta(k, v as any));
    /* Ein Agent, der jedes Werkzeug hat */
    Store.setMeta('agent:eigene', [{
      id: 'pruef', name: 'Prüfagent', icon: '🧪', anweisung: 'Prüfung.',
      werkzeuge: ['suchen', 'seiteAnlegen', 'fertig'], wissen: [],
      guthaben: 10, ausloeser: {}
    }]);
    /* Die Ersatz-KI: gibt Plan für Plan aus.
       DER ZÄHLER LIEGT AUSSEN. Erst lag er in dieser Funktion, und damit
       lief er über mehrere `laufen()`-Aufrufe hinweg weiter: der dritte
       Lauf bekam sofort „fertig" und legte nichts an. Die Prüfung meldete
       daraufhin einen Fehler in Redion, den es gar nicht gab — der Fehler
       war der Prüfstand. */
    (globalThis as any).__geplant = pl;
    (globalThis as any).__ki = 0;
    (globalThis as any).__echtKI = KI.frageKurz;
    KI.frageKurz = async () => {
      const g = globalThis as any;
      return JSON.stringify(g.__geplant[Math.min(g.__ki++, g.__geplant.length - 1)]);
    };
    /* Und mitzählen, was WIRKLICH angelegt wurde. */
    (globalThis as any).__angelegt = 0;
    const echt = Agent.WERKZEUGE['seiteAnlegen'].lauf;
    (globalThis as any).__echtAnlegen = echt;
    Agent.WERKZEUGE['seiteAnlegen'].lauf = async (...args: any[]) => {
      (globalThis as any).__angelegt++;
      return echt(...args);
    };
  }, { plaene, grenzen });

const abruesten = () => seite.evaluate(() => {
  if ((globalThis as any).__echtKI) KI.frageKurz = (globalThis as any).__echtKI;
  if ((globalThis as any).__echtAnlegen)
    Agent.WERKZEUGE['seiteAnlegen'].lauf = (globalThis as any).__echtAnlegen;
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
});

/* Drei Anlegeschritte, dann fertig. */
const PLAENE = [
  { gedanke: 'Erste Seite', werkzeug: 'seiteAnlegen', argument: { titel: 'A1', text: 'x' } },
  { gedanke: 'Zweite Seite', werkzeug: 'seiteAnlegen', argument: { titel: 'A2', text: 'x' } },
  { gedanke: 'Dritte Seite', werkzeug: 'seiteAnlegen', argument: { titel: 'A3', text: 'x' } },
  { gedanke: 'Schluss', werkzeug: 'fertig', argument: { antwort: 'Fertig.' } }
];


console.log('\n1 · Was es schon gab — und was L11 nicht wusste');

const vorhanden = await seite.evaluate(() => ({
  rechteJeWerkzeug: Object.values<any>(Agent.WERKZEUGE).every(w => !!w.recht),
  protokoll: typeof Agent.laeufe === 'function',
  ruecknahme: typeof Agent.zuruecknehmen === 'function'
}));
p('Jedes Werkzeug trägt ein Recht', vorhanden.rechteJeWerkzeug);
p('Es gibt ein Protokoll der Läufe', vorhanden.protokoll);
p('… und eine Rücknahme dazu', vorhanden.ruecknahme);


console.log('\n2 · Der Notausschalter hält wirklich alles an');

await ruesten(PLAENE, { 'agent:notaus': true, 'agent:fragen': 'nie',
                        'agent:tagesgrenze': 500, 'agent:tagesstand': null });
const beiNotaus = await seite.evaluate(async () => {
  const prot = await Agent.laufen('pruef', 'Leg drei Seiten an.');
  return { schritte: prot.schritte.length,
           angelegt: (globalThis as any).__angelegt,
           text: prot.schritte[0]?.ergebnis || '' };
});
p('Mit Notaus wird kein Werkzeug ausgeführt', beiNotaus.angelegt === 0,
  String(beiNotaus.angelegt) + ' Seiten angelegt');
p('… und der Lauf sagt warum', /Notausschalter/.test(beiNotaus.text), beiNotaus.text);
/* EIN ABGEBROCHENER LAUF IST TROTZDEM EINER. Stünde er nicht im
   Protokoll, suchte man später den Agenten, der „nichts getan hat". */
p('… und steht im Protokoll', await seite.evaluate(() => Agent.laeufe().length > 0));

/* Der Notaus gilt AUCH FÜR DIE AUSLÖSER — das ist sein eigentlicher Zweck.
   Ohne die Prüfung stünde er zwar, und um acht Uhr früh liefe es doch. */
const ausloeserStill = await seite.evaluate(async () => {
  Store.setMeta('agent:eigene', [{
    id: 'auto', name: 'Autoagent', icon: '⏰', anweisung: 'Prüfung.',
    werkzeuge: ['seiteAnlegen', 'fertig'], wissen: [], guthaben: 3,
    ausloeser: { art: 'taeglich', stunde: 0, auftrag: 'Leg an.', zuletzt: null }
  }]);
  (globalThis as any).__angelegt = 0;
  await Agent.ausloeserPruefen();
  return (globalThis as any).__angelegt;
});
p('Auch ein Auslöser läuft mit Notaus nicht', ausloeserStill === 0, String(ausloeserStill));
await abruesten();


console.log('\n3 · Das Tageslimit gilt über alle Läufe hinweg');

/* DAS GUTHABEN GILT JE LAUF — genau das war die Lücke. Zehn Läufe zu acht
   Schritten sind achtzig, und niemand hat je zugestimmt. */
await ruesten(PLAENE, { 'agent:notaus': false, 'agent:fragen': 'nie',
                        'agent:tagesgrenze': 2, 'agent:tagesstand': null });
const beiLimit = await seite.evaluate(async () => {
  const g = globalThis as any;
  g.__ki = 0;
  const p1 = await Agent.laufen('pruef', 'Leg drei Seiten an.');
  g.__ki = 0;
  const p2 = await Agent.laufen('pruef', 'Und nochmal.');
  return { angelegt: (globalThis as any).__angelegt,
           stand: Store.getMeta('agent:tagesstand', null),
           zweiter: p2.schritte[p2.schritte.length - 1]?.ergebnis || '',
           ersterSchritte: p1.schritte.length };
});
p('Bei zwei erlaubten Schritten wird zweimal gehandelt', beiLimit.angelegt === 2,
  String(beiLimit.angelegt) + ' — das Guthaben allein hätte drei zugelassen');
p('Der zweite Lauf fängt gar nicht erst an',
  /Tageslimit/.test(beiLimit.zweiter), beiLimit.zweiter);
p('Der Stand wird mitgeschrieben',
  !!beiLimit.stand && (beiLimit.stand as any).schritte >= 2,
  JSON.stringify(beiLimit.stand));

/* UND ER GILT MITTEN IM LAUF, nicht nur davor. Sonst wäre es keine
   Grenze, sondern eine Bedingung fürs Anfangen: der letzte Lauf käme
   immer noch mit vollem Guthaben durch, egal wie voll der Tag war. */
const mittendrin = await seite.evaluate(async () => {
  Store.setMeta('agent:tagesgrenze', 12);
  Store.setMeta('agent:tagesstand', { tag: new Date().getFullYear() + '-' +
    String(new Date().getMonth() + 1).padStart(2, '0') + '-' +
    String(new Date().getDate()).padStart(2, '0'), schritte: 10 });
  (globalThis as any).__angelegt = 0;
  (globalThis as any).__ki = 0;
  const prot = await Agent.laufen('pruef', 'Leg drei Seiten an.');
  return { angelegt: (globalThis as any).__angelegt,
           letzte: prot.schritte[prot.schritte.length - 1]?.ergebnis || '' };
});
p('Mit zwei Restschritten hört der Lauf nach zweien auf',
  mittendrin.angelegt === 2, String(mittendrin.angelegt));
p('… und sagt es', /Tageslimit/.test(mittendrin.letzte), mittendrin.letzte);
await abruesten();


console.log('\n4 · Vor einer Änderung wird gefragt');

/* ZURÜCKNEHMEN GIBT ES NUR FÜR ANGELEGTES. Was ein Agent überschreibt,
   ist weg — deshalb wird davor gefragt, nicht danach. */
await ruesten(PLAENE, { 'agent:notaus': false, 'agent:fragen': 'immer',
                        'agent:tagesgrenze': 500, 'agent:tagesstand': null });
const laufFrage = seite.evaluate(async () => {
  (globalThis as any).__angelegt = 0;
  (globalThis as any).__ki = 0;
  const prot = await Agent.laufen('pruef', 'Leg drei Seiten an.');
  return { angelegt: (globalThis as any).__angelegt,
           erste: prot.schritte[0]?.ergebnis || '' };
});
await seite.waitForTimeout(700);
const frage = await seite.evaluate(() => {
  const d = document.querySelector<HTMLElement>('.overlay .fh');
  const kn = [...document.querySelectorAll<HTMLElement>('.overlay [data-w]')]
    .map(b => b.dataset['w']);
  const text = (document.querySelector('.overlay .finder > div:nth-child(2)')?.textContent || '');
  return { titel: (d?.textContent || '').trim(), knoepfe: kn, text };
});
p('Vor dem ersten ändernden Schritt steht eine Frage',
  /möchte etwas ändern/.test(frage.titel), frage.titel || '(keine Frage)');
p('… und sie nennt das Werkzeug und das Vorhaben',
  /seiteAnlegen/.test(frage.text) && /Erste Seite/.test(frage.text),
  frage.text.slice(0, 90));
/* DREI ANTWORTEN, NICHT ZWEI. „Für diesen Lauf" ist der Unterschied
   zwischen einer Sicherung, die man benutzt, und einer, die man abschaltet. */
p('… mit drei Antworten', frage.knoepfe.length === 3, JSON.stringify(frage.knoepfe));

/* Ablehnen: der Schritt fällt aus, der Lauf geht weiter. */
await seite.evaluate(() =>
  document.querySelector<HTMLElement>('.overlay [data-w="nein"]')?.click());
await seite.waitForTimeout(400);
/* Die folgenden Fragen ebenfalls ablehnen, bis der Lauf durch ist. */
for (let i = 0; i < 6; i++) {
  const offen = await seite.evaluate(() => {
    const b = document.querySelector<HTMLElement>('.overlay [data-w="nein"]');
    if (b) { b.click(); return true; }
    return false;
  });
  if (!offen) break;
  await seite.waitForTimeout(250);
}
const abgelehnt = await laufFrage;
p('Ein abgelehnter Schritt wird nicht ausgeführt', abgelehnt.angelegt === 0,
  String(abgelehnt.angelegt) + ' Seiten trotz Absage');
p('… und der Agent bekommt eine verständliche Absage',
  /abgelehnt/.test(abgelehnt.erste), abgelehnt.erste);
await abruesten();

/* „Für diesen Lauf erlauben" fragt genau EINMAL. */
await ruesten(PLAENE, { 'agent:notaus': false, 'agent:fragen': 'einmal',
                        'agent:tagesgrenze': 500, 'agent:tagesstand': null });
const laufEinmal = seite.evaluate(async () => {
  (globalThis as any).__angelegt = 0;
  (globalThis as any).__ki = 0;
  await Agent.laufen('pruef', 'Leg drei Seiten an.');
  return (globalThis as any).__angelegt;
});
let gefragt = 0;
for (let i = 0; i < 10; i++) {
  const kam = await seite.evaluate(() => {
    const b = document.querySelector<HTMLElement>('.overlay [data-w="lauf"]');
    if (b) { b.click(); return true; }
    return false;
  });
  if (kam) gefragt++;
  await seite.waitForTimeout(300);
}
const dreiAngelegt = await laufEinmal;
p('„Für diesen Lauf" wird nur einmal gefragt', gefragt === 1, String(gefragt) + ' Fragen');
p('… und danach laufen alle drei Schritte durch', dreiAngelegt === 3,
  String(dreiAngelegt));
await abruesten();


console.log('\n5 · Ohne Aufsicht nur lesen');

/* Ein Auslöser läuft um acht Uhr früh, während niemand hinsieht. Eine
   Rückfrage wäre dort keine Sicherung, sondern eine Sperre, die niemand
   beantwortet — der Lauf hinge bis zum nächsten Klick irgendwo in der App. */
const allein = await seite.evaluate(async () => {
  Store.setMeta('agent:notaus', false);
  Store.setMeta('agent:fragen', 'immer');
  Store.setMeta('agent:tagesgrenze', 500);
  Store.setMeta('agent:tagesstand', null);
  Store.setMeta('agent:eigene', [{
    id: 'pruef', name: 'Prüfagent', icon: '🧪', anweisung: 'Prüfung.',
    werkzeuge: ['suchen', 'seiteAnlegen', 'fertig'], wissen: [],
    guthaben: 4, ausloeser: {}
  }]);
  let i = 0;
  const pl = [{ gedanke: 'Anlegen', werkzeug: 'seiteAnlegen', argument: { titel: 'B1' } },
              { gedanke: 'Schluss', werkzeug: 'fertig', argument: { antwort: 'ok' } }];
  (globalThis as any).__echtKI = KI.frageKurz;
  KI.frageKurz = async () => JSON.stringify(pl[Math.min(i++, pl.length - 1)]);
  (globalThis as any).__angelegt = 0;
  const echt = Agent.WERKZEUGE['seiteAnlegen'].lauf;
  (globalThis as any).__echtAnlegen = echt;
  Agent.WERKZEUGE['seiteAnlegen'].lauf = async (...args: any[]) => {
    (globalThis as any).__angelegt++; return echt(...args);
  };
  const prot = await Agent.laufen('pruef', 'Leg an.', undefined, { unbeaufsichtigt: true });
  return { angelegt: (globalThis as any).__angelegt,
           erste: prot.schritte[0]?.ergebnis || '',
           fragen: document.querySelectorAll('.overlay [data-w]').length };
});
p('Ohne Aufsicht wird nicht geändert', allein.angelegt === 0,
  String(allein.angelegt) + ' Seiten angelegt, obwohl niemand zusah');
p('… und es wird auch nicht gefragt', allein.fragen === 0,
  'eine Frage, die niemand beantwortet, ist eine Sperre, kein Schutz');
p('… der Agent erfährt, dass ihm das Werkzeug fehlt',
  /darfst es nicht|gibt es nicht/.test(allein.erste), allein.erste);

/* Mit ausdrücklicher Erlaubnis darf er es doch — sonst wäre die
   Einstellung ein Knopf ohne Wirkung. */
const alleinErlaubt = await seite.evaluate(async () => {
  const l = Store.getMeta('agent:eigene', []);
  l[0].darfAllein = true;
  Store.setMeta('agent:eigene', l);
  let i = 0;
  const pl = [{ gedanke: 'Anlegen', werkzeug: 'seiteAnlegen', argument: { titel: 'B2' } },
              { gedanke: 'Schluss', werkzeug: 'fertig', argument: { antwort: 'ok' } }];
  KI.frageKurz = async () => JSON.stringify(pl[Math.min(i++, pl.length - 1)]);
  (globalThis as any).__angelegt = 0;
  await Agent.laufen('pruef', 'Leg an.', undefined, { unbeaufsichtigt: true });
  return (globalThis as any).__angelegt;
});
p('Mit „darf allein ändern" schon', alleinErlaubt === 1, String(alleinErlaubt));
await abruesten();


console.log('\n6 · Und man sieht die Grenzen, ohne im Speicher zu graben');

const fenster = await seite.evaluate(async () => {
  Store.setMeta('agent:notaus', false);
  Agent.panel();
  await new Promise(f => setTimeout(f, 400));
  const streifen = document.querySelector<HTMLElement>('.ag-grenzstreifen');
  const text = (streifen?.textContent || '').trim();
  /* Notaus umlegen und nachsehen, ob es dasteht — nicht nur rot ist. */
  document.querySelector<HTMLElement>('.ag-grenzstreifen [data-a="notaus"]')?.click();
  await new Promise(f => setTimeout(f, 250));
  const nachher = document.querySelector<HTMLElement>('.ag-grenzstreifen');
  return { text, aus: (nachher?.textContent || '').trim(),
           klasse: nachher?.className || '',
           gesetzt: !!Store.getMeta('agent:notaus', false) };
});
p('Der Streifen nennt den Tagesstand', /Schritten|Tageslimit/.test(fenster.text),
  fenster.text);
p('Der Knopf legt den Notaus wirklich um', fenster.gesetzt === true);
/* KEINE AUSKUNFT NUR ÜBER FARBE (CLAUDE.md §38) — ausgerechnet bei einer
   Sicherung darf man nicht raten müssen, ob sie greift. */
p('… und der Zustand steht in Worten da, nicht nur in Rot',
  /Angehalten/.test(fenster.aus) && /aus/.test(fenster.klasse), fenster.aus);

await seite.evaluate(() => {
  Store.setMeta('agent:notaus', false);
  document.querySelectorAll('.overlay, .menu, .menu-grund').forEach(x => x.remove());
});

await browser.close();
server.close();

console.log(`\n  Suite 93 — Agentengrenzen: ${ok} ok, ${weg} offen`);
process.exit(weg ? 1 : 0);
