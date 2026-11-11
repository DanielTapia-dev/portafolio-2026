import {describe, expect, it} from 'vitest';
import type {ChatEvent} from '@/lib/avatar/protocol';
import {encodeEvent, readEvents} from '@/lib/avatar/sse';

const utf8 = (text: string) => new TextEncoder().encode(text);

async function collect(events: AsyncGenerator<ChatEvent>) {
  const out: ChatEvent[] = [];
  for await (const event of events) out.push(event);
  return out;
}

function streamOf(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

describe('SSE format', () => {
  it('encodes an event as SSE', () => {
    expect(encodeEvent({type: 'delta', text: 'Hola'})).toBe(
      'event: delta\ndata: {"text":"Hola"}\n\n'
    );
  });

  it('reads back every event type', async () => {
    const events: ChatEvent[] = [
      {type: 'delta', text: 'a'},
      {
        type: 'done',
        signature: 'f'.repeat(64),
        topic: 'stack',
        lang: 'es',
        mode: 'full',
        remaining: 19,
      },
      {type: 'error', code: 'refusal'},
    ];
    const body = streamOf([utf8(events.map(encodeEvent).join(''))]);
    expect(await collect(readEvents(body))).toEqual(events);
  });

  it('joins an event split across chunks', async () => {
    const bytes = utf8(encodeEvent({type: 'delta', text: 'Hola mundo'}));
    const middle = bytes.indexOf(utf8('mundo')[0]) + 2;
    for (const cut of [7, middle]) {
      const body = streamOf([bytes.slice(0, cut), bytes.slice(cut)]);
      expect(await collect(readEvents(body))).toEqual([
        {type: 'delta', text: 'Hola mundo'},
      ]);
    }
  });

  it('keeps multibyte characters split across chunks', async () => {
    const bytes = utf8(encodeEvent({type: 'delta', text: 'Diseño 🚀 ágil'}));
    const cut = bytes.indexOf(0xc3) + 1; // inside the "ñ"
    const body = streamOf([bytes.slice(0, cut), bytes.slice(cut)]);
    expect(await collect(readEvents(body))).toEqual([
      {type: 'delta', text: 'Diseño 🚀 ágil'},
    ]);
  });

  it('ignores unknown event names', async () => {
    const body = streamOf([utf8('event: ping\ndata: {}\n\n')]);
    expect(await collect(readEvents(body))).toEqual([]);
  });

  it('throws on malformed data', async () => {
    const body = streamOf([utf8('event: delta\ndata: {no json\n\n')]);
    await expect(collect(readEvents(body))).rejects.toThrow('Malformed event');
  });
});
