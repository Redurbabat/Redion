/* Suite 620 — Cloudflare-Zugang und begrenzte Eingaben (Security Regression) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { torPruefen } from '../../server/sicherheit/tor.ts';
import { alsAnfrage } from '../../server/cloudflare.ts';
import { onRequest } from '../../functions/api/bruecke.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const lies = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');
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
pruefe('Chronik und Einzeldatei werden nicht als Assets verteilt',
  ignore.includes('/quell/bereiche/chronik/daten.js') &&
  ignore.includes('/redion-einzeldatei.html'));

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

console.log('Suite 620: ' + ok + ' grün, ' + rot + ' rot');
if (rot) process.exitCode = 1;
