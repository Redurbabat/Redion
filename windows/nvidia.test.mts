import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const { nvidiaChat } = createRequire(import.meta.url)('./generated/nvidia.cjs');
const origin = 'redion-local://app';
const url = origin + '/ki/nvidia';
const ticket = 'desktop-test-ticket';
const headers = { 'x-redion-nvidia-ticket': ticket, authorization: 'Bearer nvapi-test', 'content-type': 'application/json' };
const messages = [{
  role: 'user',
  content: [{ type: 'text', text: 'Beschreibe das Beispiel.' },
    { type: 'image_url', image_url: { url: 'https://example.com/test.png' } }]
}];

test('Kimi streamt über den festen NVIDIA-Endpunkt mit explizitem Schlüssel', async () => {
  const sse = 'data: {"choices":[{"delta":{"content":"OK"}}]}\n\ndata: [DONE]\n\n';
  const request = new Request(url, { method: 'POST', headers, body: JSON.stringify({
    messages, model: 'fremd', max_tokens: 999999, url: 'https://example.com/'
  }) });
  const response = await nvidiaChat(request, ticket, async (target: string, init: RequestInit) => {
    assert.equal(target, 'https://integrate.api.nvidia.com/v1/chat/completions');
    assert.equal(init.redirect, 'error');
    const upstreamHeaders = new Headers(init.headers);
    assert.equal(upstreamHeaders.get('authorization'), 'Bearer nvapi-test');
    assert.equal(upstreamHeaders.get('x-redion-nvidia-ticket'), null);
    assert.deepEqual(JSON.parse(String(init.body)), {
      model: 'moonshotai/kimi-k3.1-pro', messages, max_tokens: 16384, seed: 0,
      stream: true, reasoning_effort: 'low'
    });
    return new Response(sse, { headers: { 'content-type': 'text/event-stream' } });
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(await response.text(), sse);
});

test('Nur gültige Anfragen aus der Windows-App erreichen NVIDIA', async () => {
  const send = () => assert.fail('Die ungültige Anfrage erreichte NVIDIA.');
  assert.equal((await nvidiaChat(new Request(url), ticket, send)).status, 405);
  for (const forbidden of ['', 'fremdes-ticket']) {
    const request = new Request(url, { method: 'POST', headers: { ...headers, 'x-redion-nvidia-ticket': forbidden }, body: '{}' });
    assert.equal((await nvidiaChat(request, ticket, send)).status, 403);
  }
  const anon = new Request(url, { method: 'POST', headers: { 'x-redion-nvidia-ticket': ticket }, body: '{}' });
  assert.equal((await nvidiaChat(anon, ticket, send)).status, 401);
  const malformed = new Request(url, { method: 'POST', headers, body: '{}' });
  assert.equal((await nvidiaChat(malformed, ticket, send)).status, 400);
  const large = new Request(url, { method: 'POST', headers: { ...headers, 'content-length': '30000000' }, body: '{}' });
  assert.equal((await nvidiaChat(large, ticket, send)).status, 413);
});

test('NVIDIA-Fehler werden ohne Antwortinhalt oder Schlüssel weitergegeben', async () => {
  const request = new Request(url, { method: 'POST', headers, body: JSON.stringify({ messages }) });
  const response = await nvidiaChat(request, ticket, async () => new Response('nvapi-test', { status: 429, headers: { 'retry-after': '10' } }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '10');
  assert.doesNotMatch(await response.text(), /nvapi-test/);
});
