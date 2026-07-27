import { describe, expect, it } from 'vitest';

import { SSEParser } from './sseParser';

const frame = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;

describe('SSEParser', () => {
  it('yields whole events from complete frames', () => {
    const parser = new SSEParser();
    const events = parser.feed(
      frame({ type: 'delta', text: 'hi' }) + frame({ type: 'done', messageId: 'm', usage: {} })
    );
    expect(events).toEqual([
      { type: 'delta', text: 'hi' },
      { type: 'done', messageId: 'm', usage: {} },
    ]);
  });

  it('buffers a frame split across feeds until its delimiter arrives', () => {
    const parser = new SSEParser();
    const full = frame({ type: 'delta', text: 'chunk' });
    const mid = Math.floor(full.length / 2);

    expect(parser.feed(full.slice(0, mid))).toEqual([]);
    expect(parser.feed(full.slice(mid))).toEqual([{ type: 'delta', text: 'chunk' }]);
  });

  it('skips blank, comment and malformed frames without throwing', () => {
    const parser = new SSEParser();
    const events = parser.feed(': keep-alive\n\n' + 'data: not-json\n\n' + frame({ type: 'delta', text: 'ok' }));
    expect(events).toEqual([{ type: 'delta', text: 'ok' }]);
  });

  it('ignores a JSON frame that is not a known stream event', () => {
    const parser = new SSEParser();
    expect(parser.feed(frame({ type: 'mystery' }))).toEqual([]);
  });
});
