import { createMockStore, renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import type { IAttachment } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeUser } from '@/mocks/handlers';

import { AttachmentSection } from './AttachmentSection';

// Uploads are Pro-only; every upload test renders with a premium user in the store.
const proStore = () => createMockStore({ auth: { user: makeUser({ status: 'premium' }) } });
const renderPro = () => renderComponent(<AttachmentSection ownerType="task" ownerId="t1" />, { store: proStore() });

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

// uploadToS3 is raw XHR (no progress via fetch), so it's mocked at the module
// seam — its own unit test covers the real transport. The default impl fires a
// mid-flight progress tick then resolves; individual tests override it.
const uploadToS3 = vi.hoisted(() => vi.fn());
vi.mock('@/lib/utils', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/utils')>();
  return { ...actual, uploadToS3 };
});

const API = 'http://localhost:8080/v1';

const makeAttachment = (overrides: Partial<IAttachment> = {}): IAttachment => ({
  id: 'a1',
  ownerType: 'task',
  ownerId: 't1',
  fileName: 'report.pdf',
  fileSize: 2048,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
  ...overrides,
});

const pdf = (name: string) => new File(['data'], name, { type: 'application/pdf' });

afterEach(() => uploadToS3.mockReset());

describe('AttachmentSection', () => {
  it('runs the full flow and shows the confirmed file in the list (AC5)', async () => {
    uploadToS3.mockResolvedValue(undefined);

    let listCall = 0;
    server.use(
      http.get(`${API}/attachments`, () => {
        listCall += 1;
        // First list is empty; after confirm invalidates the tag, the file appears.
        const data = listCall === 1 ? [] : [makeAttachment({ fileName: 'report.pdf' })];
        return HttpResponse.json({ data, error: null });
      }),
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({
          data: { url: 'https://s3.test', headers: { 'Content-Type': 'application/pdf' }, s3Key: 's3/k' },
          error: null,
        })
      ),
      http.post(`${API}/attachments`, () =>
        HttpResponse.json({ data: makeAttachment({ fileName: 'report.pdf' }), error: null }, { status: 201 })
      )
    );

    const user = userEvent.setup();
    renderPro();

    await screen.findByTestId('attachment-empty');
    await user.upload(screen.getByTestId('upload-zone-input'), pdf('report.pdf'));

    await waitFor(() => expect(screen.getByText('report.pdf')).toBeInTheDocument());
    expect(uploadToS3).toHaveBeenCalledTimes(1);
    // The presigned PUT url + headers are forwarded to uploadToS3.
    expect(uploadToS3.mock.calls[0]?.[0]).toMatchObject({
      url: 'https://s3.test',
      headers: { 'Content-Type': 'application/pdf' },
    });
  });

  it('rejects an SVG client-side with no upload request (AC2)', async () => {
    server.use(http.get(`${API}/attachments`, () => HttpResponse.json({ data: [], error: null })));

    const user = userEvent.setup();
    renderPro();
    await screen.findByTestId('attachment-empty');

    const svg = new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' });
    await user.upload(screen.getByTestId('upload-zone-input'), svg);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("isn't allowed"));
    expect(uploadToS3).not.toHaveBeenCalled();
  });

  it('rejects an oversized file client-side (AC2)', async () => {
    server.use(http.get(`${API}/attachments`, () => HttpResponse.json({ data: [], error: null })));

    const user = userEvent.setup();
    renderPro();
    await screen.findByTestId('attachment-empty');

    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 30 * 1024 * 1024 });
    await user.upload(screen.getByTestId('upload-zone-input'), big);

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('20 MB'));
    expect(uploadToS3).not.toHaveBeenCalled();
  });

  it('maps STORAGE_LIMIT_EXCEEDED to a delete-files toast, not an upgrade prompt (AC4)', async () => {
    uploadToS3.mockResolvedValue(undefined);

    server.use(
      http.get(`${API}/attachments`, () => HttpResponse.json({ data: [], error: null })),
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://s3.test', headers: {}, s3Key: 's3/k' }, error: null })
      ),
      http.post(`${API}/attachments`, () =>
        HttpResponse.json(
          { data: null, error: { code: 'STORAGE_LIMIT_EXCEEDED', message: 'storage full' } },
          { status: 403 }
        )
      )
    );

    const user = userEvent.setup();
    renderPro();
    await screen.findByTestId('attachment-empty');
    await user.upload(screen.getByTestId('upload-zone-input'), pdf('report.pdf'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/storage is full/i)));
    // Not an upgrade prompt.
    expect(toast.error).not.toHaveBeenCalledWith(expect.stringMatching(/upgrade/i));
    // The row stays with a retry affordance.
    expect(await screen.findByText(/upload failed/i)).toBeInTheDocument();
  });

  it('uploads two files concurrently, each with its own progress bar (AC3)', async () => {
    // Hold both uploads open so both progress bars coexist before either resolves.
    const gates: Array<() => void> = [];
    uploadToS3.mockImplementation(({ onProgress }: { onProgress?: (p: { ratio: number }) => void }) => {
      onProgress?.({ ratio: 0.5 });
      return new Promise<void>(resolve => gates.push(resolve));
    });

    server.use(
      http.get(`${API}/attachments`, () => HttpResponse.json({ data: [], error: null })),
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://s3.test', headers: {}, s3Key: 's3/k' }, error: null })
      ),
      http.post(`${API}/attachments`, () => HttpResponse.json({ data: makeAttachment(), error: null }, { status: 201 }))
    );

    const user = userEvent.setup();
    renderPro();
    await screen.findByTestId('attachment-empty');

    await user.upload(screen.getByTestId('upload-zone-input'), [pdf('one.pdf'), pdf('two.pdf')]);

    // Scoped to the per-upload bars — the account storage bar is also a progressbar.
    await waitFor(() => {
      const bars = screen.getAllByTestId(/^upload-progress-/);
      expect(bars).toHaveLength(2);
      bars.forEach(bar => expect(bar).toHaveAttribute('aria-valuenow', '50'));
    });

    // Let both uploads finish; both rows leave once confirmed.
    gates.forEach(resolve => resolve());
    await waitFor(() => expect(screen.queryAllByTestId(/^upload-progress-/)).toHaveLength(0));
  });

  it('surfaces the count cap when more files than the remaining slots are added (AC — count cap)', async () => {
    // 19 existing + drop 2 → 1 accepted, cap toast for the overflow.
    const existing = Array.from({ length: 19 }, (_, i) => makeAttachment({ id: `a${i}`, fileName: `f${i}.pdf` }));
    uploadToS3.mockResolvedValue(undefined);
    server.use(
      http.get(`${API}/attachments`, () => HttpResponse.json({ data: existing, error: null })),
      http.post(`${API}/attachments/upload-url`, () =>
        HttpResponse.json({ data: { url: 'https://s3.test', headers: {}, s3Key: 's3/k' }, error: null })
      ),
      http.post(`${API}/attachments`, () => HttpResponse.json({ data: makeAttachment(), error: null }, { status: 201 }))
    );

    const user = userEvent.setup();
    renderPro();
    await waitFor(() => expect(screen.getByTestId('attachment-row-a0')).toBeInTheDocument());

    await user.upload(screen.getByTestId('upload-zone-input'), [pdf('x.pdf'), pdf('y.pdf')]);

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/up to 20 files/i));
    // only one slot was free → one upload started
    expect(uploadToS3).toHaveBeenCalledTimes(1);
  });

  it('replaces the upload zone with a Pro gate for free users', async () => {
    server.use(http.get(`${API}/attachments`, () => HttpResponse.json({ data: [], error: null })));

    const store = createMockStore({ auth: { user: makeUser({ status: 'regular' }) } });
    renderComponent(<AttachmentSection ownerType="task" ownerId="t1" />, { store });

    await screen.findByTestId('attachment-empty');
    // No upload affordance at all — a locked Pro panel + upgrade CTA instead.
    expect(screen.getByTestId('attachment-pro-gate')).toBeInTheDocument();
    expect(screen.getByTestId('attachment-upgrade-cta')).toBeInTheDocument();
    expect(screen.queryByTestId('upload-zone')).not.toBeInTheDocument();
  });
});
