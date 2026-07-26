import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadError, type UploadProgress, uploadToS3 } from './uploadToS3';

// Minimal XMLHttpRequest fake: records what was opened/sent + the request headers
// set, and exposes hooks to drive progress/load/error/abort deterministically.
// jsdom's real XHR won't emit upload progress, so we stub the global.
class FakeXHR {
  static instances: FakeXHR[] = [];

  method = '';
  url = '';
  status = 0;
  sentBody: Blob | null = null;
  requestHeaders: Record<string, string> = {};
  aborted = false;

  upload: { onprogress: ((e: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;

  constructor() {
    FakeXHR.instances.push(this);
  }

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string): void {
    this.requestHeaders[key] = value;
  }

  send(body: Blob): void {
    this.sentBody = body;
  }

  abort(): void {
    this.aborted = true;
    this.onabort?.();
  }

  // Test drivers ---------------------------------------------------------------
  emitProgress(loaded: number, total: number, lengthComputable = true): void {
    this.upload.onprogress?.({ loaded, total, lengthComputable } as ProgressEvent);
  }

  finish(status: number): void {
    this.status = status;
    this.onload?.();
  }

  networkError(): void {
    this.onerror?.();
  }
}

const makeFile = (bytes = 100): File => {
  const file = new File(['x'], 'report.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
};

const lastXHR = (): FakeXHR => {
  const xhr = FakeXHR.instances.at(-1);
  if (!xhr) throw new Error('no XHR was created');
  return xhr;
};

beforeEach(() => {
  FakeXHR.instances = [];
  vi.stubGlobal('XMLHttpRequest', FakeXHR as unknown as typeof XMLHttpRequest);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('uploadToS3', () => {
  it('PUTs the raw file with the presigned headers', async () => {
    const file = makeFile();
    const promise = uploadToS3({
      url: 'https://s3.test/bucket/obj?X-Amz-Signature=abc',
      headers: { 'Content-Type': 'application/pdf' },
      file,
    });
    const xhr = lastXHR();
    xhr.finish(200);
    await promise;

    expect(xhr.method).toBe('PUT');
    // Body is the raw file, not a multipart form.
    expect(xhr.sentBody).toBe(file);
    expect(xhr.requestHeaders['Content-Type']).toBe('application/pdf');
  });

  it('reports increasing progress ratios and a final 1', async () => {
    const ratios: number[] = [];
    const onProgress = (p: UploadProgress) => ratios.push(p.ratio);

    const promise = uploadToS3({ url: 'https://s3.test', headers: {}, file: makeFile(100), onProgress });
    const xhr = lastXHR();
    xhr.emitProgress(25, 100);
    xhr.emitProgress(50, 100);
    xhr.emitProgress(100, 100);
    xhr.finish(200);
    await promise;

    expect(ratios).toEqual([0.25, 0.5, 1, 1]);
    // non-decreasing
    const sorted = [...ratios].sort((a, b) => a - b);
    expect(ratios).toEqual(sorted);
  });

  it('reports ratio 0 when total is not computable', async () => {
    const ratios: number[] = [];
    const promise = uploadToS3({
      url: 'https://s3.test',
      headers: {},
      file: makeFile(100),
      onProgress: p => ratios.push(p.ratio),
    });
    const xhr = lastXHR();
    xhr.emitProgress(10, 0, false);
    xhr.finish(200);
    await promise;

    expect(ratios[0]).toBe(0);
  });

  it('resolves on any 2xx', async () => {
    const promise = uploadToS3({ url: 'https://s3.test', headers: {}, file: makeFile() });
    lastXHR().finish(201);
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects with the status on a non-2xx', async () => {
    const promise = uploadToS3({ url: 'https://s3.test', headers: {}, file: makeFile() });
    lastXHR().finish(403);
    await expect(promise).rejects.toMatchObject({ status: 403 });
    await expect(promise).rejects.toBeInstanceOf(UploadError);
  });

  it('rejects with status 0 on a network error', async () => {
    const promise = uploadToS3({ url: 'https://s3.test', headers: {}, file: makeFile() });
    lastXHR().networkError();
    await expect(promise).rejects.toMatchObject({ status: 0 });
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadToS3({ url: 'https://s3.test', headers: {}, file: makeFile(), signal: controller.signal })
    ).rejects.toBeInstanceOf(UploadError);
    expect(FakeXHR.instances).toHaveLength(0);
  });

  it('aborts the request when the signal fires mid-flight', async () => {
    const controller = new AbortController();
    const promise = uploadToS3({ url: 'https://s3.test', headers: {}, file: makeFile(), signal: controller.signal });
    controller.abort();
    await expect(promise).rejects.toBeInstanceOf(UploadError);
    expect(lastXHR().aborted).toBe(true);
  });
});

// The upload lifecycle a consumer drives: idle → uploading → done, or → error.
// Modelled here over uploadToS3 directly (the RTK confirm step is a separate
// mutation) to assert the state transitions the UI hook will depend on.
describe('upload state machine', () => {
  type State = 'idle' | 'uploading' | 'done' | 'error';

  it('idle → uploading → done on success', async () => {
    const states: State[] = ['idle'];
    const promise = uploadToS3({
      url: 'https://s3.test',
      headers: {},
      file: makeFile(100),
      onProgress: () => {
        if (states[states.length - 1] === 'idle') states.push('uploading');
      },
    });
    const xhr = lastXHR();
    xhr.emitProgress(50, 100);
    xhr.finish(200);
    await promise.then(() => states.push('done')).catch(() => states.push('error'));

    expect(states).toEqual(['idle', 'uploading', 'done']);
  });

  it('idle → uploading → error on a failed upload', async () => {
    const states: State[] = ['idle'];
    const promise = uploadToS3({
      url: 'https://s3.test',
      headers: {},
      file: makeFile(100),
      onProgress: () => {
        if (states[states.length - 1] === 'idle') states.push('uploading');
      },
    });
    const xhr = lastXHR();
    xhr.emitProgress(50, 100);
    xhr.finish(500);
    await promise.then(() => states.push('done')).catch(() => states.push('error'));

    expect(states).toEqual(['idle', 'uploading', 'error']);
  });
});
