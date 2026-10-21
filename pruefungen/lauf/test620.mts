/* Suite 620 — Cloudflare-Zugang und begrenzte Eingaben (Security Regression) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { torPruefen } from '../../server/sicherheit/tor.ts';
import { alsAnfrage } from '../../server/cloudflare.ts';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lies = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
/* functions/ liegt in der CommonJS-Wurzel. Cloudflare baut es als ESM,
 * Node lädt die rohe .ts sonst als CommonJS und verliert den benannten Export.
 * Mit TS als ESM übersetzen, dann dieselbe Laufzeitlogik ohne Netz testen. */
const proxyJs = ts.transpileModule(lies('functions/api/bruecke.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText;
const proxyModul = await import('data:text/javascript;base64,' +
  Buffer.from(proxyJs, 'utf8').toString('base64')) as {
    onRequest: (ctx: { request: Request }) => Promise<Response>
  };
const onRequest = proxyModul.onRequest;

let ok = 0, rot = 0;
const pruefe = (name: string, gut: boolean): void => {
  console.log((gut ? '✓ ' : '✗ ') + name);
  if (gut) ok++; else rot++;
};

const worker = lies('worker.ts');
const wrangler = lies('wrangler.toml');
const ignore = lies('.assetsignore');
pruefe('Worker prüft Access vor dem Routing',
  worker.includes('await torPruefen(request, env || {})') &&
  worker.indexOf('await torPruefen(') < worker.indexOf("url.pathname === '/api/bruecke'"));
pruefe('Cloudflare schickt auch Assets durch den Worker',
  /run_worker_first\s*=\s*true/.test(wrangler));
pruefe('Einzeldatei bleibt ausserhalb des Deployments',
  ignore.includes('/redion-einzeldatei.html'));
pruefe('Chronik bleibt für Offline-Cache vorhanden und ist durch Access geschützt',
  !ignore.split('\n').some(x => x.trim() === '/quell/bereiche/chronik/daten.js') &&
  worker.indexOf('await torPruefen(') < worker.indexOf('env.ASSETS.fetch(request)'));

const request = new Request('https://redion.example/index.html');
const nichtEingerichtet = await torPruefen(request, {});
pruefe('Access ohne Konfiguration schliesst (503)', nichtEingerichtet?.status === 503);
pruefe('Offener Betrieb muss explizit gewählt werden',
  await torPruefen(request, { TOR: 'offen' }) === null);
const gefaelscht = await torPruefen(request,
  { ACCESS_TEAM: 'test.cloudflareaccess.com', ACCESS_AUD: 'aud-test' });
pruefe('Access ohne JWT lehnt ab', gefaelscht?.status === 403);

const stream = new ReadableStream<Uint8Array>({
  start(controller) {
    controller.enqueue(new Uint8Array(700_000));
    controller.enqueue(new Uint8Array(700_000));
    controller.close();
  }
});
const grosseAnfrage = new Request('https://redion.example/api/stand', {
  method: 'POST', body: stream, duplex: 'half'
} as RequestInit & { duplex: string });
const zuGross = await alsAnfrage(grosseAnfrage);
pruefe('Mehr als 1 MiB ohne Content-Length -> 413-Signal',
  'zuGross' in zuGross && zuGross.zuGross === '/api/stand');

const fremd = await onRequest({ request: new Request(
  'https://redion.example/api/bruecke?ziel=https%3A%2F%2Fexample.org%2Ffeed.ics'
) });
pruefe('Beliebige .ics-Hosts sind gesperrt', fremd.status === 403);
const falscherOrigin = await onRequest({ request: new Request(
  'https://redion.example/api/bruecke?ziel=https%3A%2F%2Fapi.github.com',
  { headers: { Origin: 'https://fremd.example' } }
) });
pruefe('Fremde Origin erhält keine CORS-Freigabe', falscherOrigin.status === 403);

const originalFetch = globalThis.fetch;
let anzahl = 0;
try {
  globalThis.fetch = async () => {
    anzahl++;
    return new Response(null, { status: 302, headers: { Location: 'https://fremd.example/' } });
  };
  const umleitung = await onRequest({ request: new Request(
    'https://redion.example/api/bruecke?ziel=https%3A%2F%2Fapi.github.com'
  ) });
  pruefe('Redirect wird nicht an fremdes Ziel gefolgt', umleitung.status === 502 && anzahl === 1);
} finally { globalThis.fetch = originalFetch; }

// Gegenprobe des Integrationsreviews: normale Byte-Angaben dürfen nicht
// am Schutz scheitern. Kein Netz: nur die externe Gegenstelle wird ersetzt.
try {
  let body = '';
  globalThis.fetch = async (_url, init) => {
    anzahl++;
    body = await new Response(init?.body).text();
    return new Response('angenommen', { status: 200 });
  };
  const normal = await onRequest({ request: new Request(
    'https://redion.example/api/bruecke?ziel=https%3A%2F%2Fapi.github.com',
    { method: 'POST', headers: { 'Content-Length': '2', Origin: 'https://redion.example' }, body: '{}' }
  ) });
  pruefe('Gültige Content-Length wird akzeptiert und der Körper bleibt unverändert',
    normal.status === 200 && body === '{}');
  for (const laenge of ['unbekannt', '1048577']) {
    const vorher = anzahl;
    const antwort = await onRequest({ request: new Request(
      'https://redion.example/api/bruecke?ziel=https%3A%2F%2Fapi.github.com',
      { method: 'POST', headers: { 'Content-Length': laenge }, body: '{}' }
    ) });
    pruefe('Ungültige/zu grosse Content-Length bleibt gesperrt: ' + laenge,
      antwort.status === 413 && anzahl === vorher);
  }
  globalThis.fetch = async () => new Response(null, { status: 205 });
  let resetStatus = 0;
  try {
    resetStatus = (await onRequest({ request: new Request(
      'https://redion.example/api/bruecke?ziel=https%3A%2F%2Fapi.github.com'
    ) })).status;
  } catch { /* Der Test soll einen ungültigen Antwortkörper sichtbar machen. */ }
  pruefe('205 Reset Content bleibt eine gültige körperlose Antwort', resetStatus === 205);
} finally { globalThis.fetch = originalFetch; }

console.log('Suite 620: ' + ok + ' grün, ' + rot + ' rot');
if (rot) process.exitCode = 1;
