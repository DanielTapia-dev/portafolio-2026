// SSE encoding shared by the chat route and the browser client.
// Keep this file free of server-only and Node-only imports.
import type {ChatEvent} from '@/lib/avatar/protocol';

const EVENT_TYPES: readonly string[] = [
  'delta',
  'done',
  'error',
] satisfies ChatEvent['type'][];

export function encodeEvent(event: ChatEvent): string {
  // The event name carries the type, so the JSON payload leaves it out.
  const {type, ...data} = event;
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

function parseEvent(block: string): ChatEvent | null {
  let name = '';
  let data = '';
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) name = line.slice(7);
    else if (line.startsWith('data: ')) data = line.slice(6);
  }
  // Unknown names are ignored so the server can add events later.
  if (!EVENT_TYPES.includes(name)) return null;
  try {
    return {type: name, ...JSON.parse(data)} as ChatEvent;
  } catch {
    throw new Error('Malformed event');
  }
}

export async function* readEvents(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ChatEvent> {
  const reader = body.getReader();
  // stream: true keeps a multibyte character split across chunks intact.
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const {done, value} = await reader.read();
      buffer += decoder.decode(value, {stream: !done});
      let end;
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        const event = parseEvent(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        if (event) yield event;
      }
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}
