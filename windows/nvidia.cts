export const NVIDIA_CHAT_PATH = '/ki/nvidia';

const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'moonshotai/kimi-k3.1-pro';
const MAX_BODY = 12 * 1024 * 1024;

const responseHeaders = { 'Cache-Control': 'no-store' };
const error = (status: number, message: string) => new Response(message, { status, headers: responseHeaders });

async function readPayload(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let text = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return JSON.parse(text + decoder.decode());
      size += value.byteLength;
      if (size > MAX_BODY) {
        await reader.cancel();
        throw new RangeError('NVIDIA-Anfrage ist zu gross.');
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

type Message = { role: 'system' | 'assistant' | 'user'; content: string | unknown[] };

function validContentPart(part: unknown): boolean {
  if (!part || typeof part !== 'object') return false;
  const data = part as Record<string, unknown>;
  if (data.type === 'text') return typeof data.text === 'string';
  if (data.type !== 'image_url' || !data.image_url || typeof data.image_url !== 'object') return false;
  const url = (data.image_url as Record<string, unknown>).url;
  return typeof url === 'string' && /^(https:\/\/|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(url);
}

function validMessage(message: unknown): message is Message {
  if (!message || typeof message !== 'object') return false;
  const { role, content } = message as Record<string, unknown>;
  if (role === 'system' || role === 'assistant') return typeof content === 'string';
  return role === 'user' && (typeof content === 'string' ||
    (Array.isArray(content) && content.length > 0 && content.every(validContentPart)));
}

export async function nvidiaChat(request: Request, ticket: string, send: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'POST') return error(405, 'Nur POST ist verfügbar.');
  if (!ticket || request.headers.get('x-redion-nvidia-ticket') !== ticket)
    return error(403, 'Freigabe vom Redion-Hauptfenster erforderlich.');
  const key = request.headers.get('authorization') ?? '';
  if (!/^Bearer [\w.~\-]{1,2048}$/.test(key)) return error(401, 'Ein NVIDIA-API-Schlüssel ist erforderlich.');
  if (Number(request.headers.get('content-length')) > MAX_BODY) return error(413, 'NVIDIA-Anfrage ist zu gross.');

  let value: unknown;
  try { value = await readPayload(request); }
  catch (cause) {
    return cause instanceof RangeError
      ? error(413, 'NVIDIA-Anfrage ist zu gross.')
      : error(400, 'Die NVIDIA-Anfrage ist ungültig.');
  }
  const messages = (value as { messages?: unknown } | null)?.messages;
  if (!Array.isArray(messages) || !messages.length || !messages.every(validMessage))
    return error(400, 'Die NVIDIA-Anfrage benötigt gültige Nachrichten.');

  try {
    const remote = await send(ENDPOINT, {
      method: 'POST',
      redirect: 'error',
      headers: { Authorization: key, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        model: MODEL,
        messages: messages.map(({ role, content }) => ({ role, content })),
        max_tokens: 16384,
        seed: 0,
        stream: true,
        reasoning_effort: 'low'
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(180_000)])
    });

    if (!remote.ok) {
      const headers = new Headers(responseHeaders);
      const retryAfter = remote.headers.get('retry-after');
      if (retryAfter && /^\d{1,4}$/.test(retryAfter)) headers.set('retry-after', retryAfter);
      await remote.body?.cancel();
      return new Response('NVIDIA hat die Anfrage abgewiesen.', { status: remote.status, headers });
    }
    if (remote.status !== 200 || !remote.body ||
        !remote.headers.get('content-type')?.toLowerCase().startsWith('text/event-stream')) {
      await remote.body?.cancel();
      return error(422, 'NVIDIA hat keinen Antwortstrom geliefert.');
    }
    return new Response(remote.body, { headers: { ...responseHeaders, 'Content-Type': 'text/event-stream' } });
  } catch {
    return error(503, 'Der NVIDIA-Dienst ist momentan nicht erreichbar.');
  }
}
