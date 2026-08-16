import type { IAttachment } from '@nicoflow/shared/types';
import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen } from 'storybook/test';

import { mockUser } from '@/stories/mocks';

import { AttachmentSection } from './AttachmentSection';

const API = 'http://localhost:8080/v1';

const attachment = (overrides: Partial<IAttachment> = {}): IAttachment => ({
  id: 'a1',
  ownerType: 'task',
  ownerId: 'task-1',
  fileName: 'design-spec.pdf',
  fileSize: 1_572_864,
  mimeType: 'application/pdf',
  createdAt: '2026-07-24T08:00:00Z',
  ...overrides,
});

const proState = { auth: { user: mockUser({ status: 'premium' }) } };
const freeState = { auth: { user: mockUser({ status: 'regular' }) } };

const meta: Meta<typeof AttachmentSection> = {
  title: 'Tasks/AttachmentSection',
  component: AttachmentSection,
  tags: ['autodocs'],
  args: { ownerType: 'task', ownerId: 'task-1' },
  decorators: [
    Story => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AttachmentSection>;

// Pro user with two confirmed attachments.
export const WithFiles: Story = {
  parameters: {
    preloadedState: proState,
    msw: {
      handlers: [
        http.get(`${API}/attachments`, () =>
          HttpResponse.json({
            data: [
              attachment(),
              attachment({ id: 'a2', fileName: 'notes.txt', fileSize: 4096, mimeType: 'text/plain' }),
            ],
            error: null,
          })
        ),
      ],
    },
  },
  play: async () => {
    await expect(await screen.findByText('design-spec.pdf')).toBeInTheDocument();
    await expect(screen.getByText('notes.txt')).toBeInTheDocument();
    await expect(screen.getByTestId('upload-zone-button')).toBeEnabled();
  },
};

// Pro user, nothing uploaded yet.
export const Empty: Story = {
  parameters: {
    preloadedState: proState,
    msw: { handlers: [http.get(`${API}/attachments`, () => HttpResponse.json({ data: [], error: null }))] },
  },
  play: async () => {
    await expect(await screen.findByTestId('attachment-empty')).toBeInTheDocument();
    await expect(screen.getByTestId('upload-zone-button')).toBeEnabled();
  },
};

// Free/downgraded user — existing files stay listed + downloadable + deletable,
// but the upload zone is replaced by a locked Pro CTA and the storage bar hides.
export const FreeUser: Story = {
  parameters: {
    preloadedState: freeState,
    msw: {
      handlers: [http.get(`${API}/attachments`, () => HttpResponse.json({ data: [attachment()], error: null }))],
    },
  },
  play: async () => {
    await expect(await screen.findByText('design-spec.pdf')).toBeInTheDocument();
    await expect(screen.getByTestId('attachment-pro-gate')).toBeInTheDocument();
    await expect(screen.getByTestId('attachment-upgrade-cta')).toBeInTheDocument();
    await expect(screen.queryByTestId('upload-zone')).not.toBeInTheDocument();
    await expect(screen.queryByTestId('storage-bar')).not.toBeInTheDocument();
  },
};
