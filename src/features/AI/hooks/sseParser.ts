import type { AIStreamEvent } from '../types';

// Incremental parser for the SSE-over-POST body (POST /ai/sessions/:id/messages).
// The stream is a sequence of `data: <json>\n\n` frames, but a network read can
// split a frame anywhere — mid-line or mid-multibyte-char. This buffers raw text,
// yields only whole frames (split on the blank-line delimiter), and keeps the
// trailing partial for the next feed. Non-`data:` lines and blank frames are
// ignored; a frame whose JSON is malformed or isn't a known event is skipped
// rather than throwing, so one bad frame never kills the stream.

const FRAME_DELIMITER = '\n\n';

const isStreamEvent = (value: unknown): value is AIStreamEvent => {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: unknown }).type;
  return type === 'delta' || type === 'done' || type === 'error' || type === 'tool_proposal';
};

// parseFrame extracts the event from one complete frame's text (the chars between
// two blank-line delimiters). Returns null for keep-alive/comment/unknown frames.
const parseFrame = (frame: string): AIStreamEvent | null => {
  const payload = frame
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice('data:'.length).trim())
    .join('');
  if (!payload) return null;

  try {
    const parsed: unknown = JSON.parse(payload);
    return isStreamEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// SSEParser turns a byte stream into typed events. Feed decoded text chunks; each
// feed returns the whole events that just completed. The trailing partial frame
// is retained internally until its delimiter arrives.
export class SSEParser {
  private buffer = '';

  feed(chunk: string): AIStreamEvent[] {
    this.buffer += chunk;
    const events: AIStreamEvent[] = [];

    let delimiter = this.buffer.indexOf(FRAME_DELIMITER);
    while (delimiter !== -1) {
      const frame = this.buffer.slice(0, delimiter);
      this.buffer = this.buffer.slice(delimiter + FRAME_DELIMITER.length);
      const event = parseFrame(frame);
      if (event) events.push(event);
      delimiter = this.buffer.indexOf(FRAME_DELIMITER);
    }

    return events;
  }
}
