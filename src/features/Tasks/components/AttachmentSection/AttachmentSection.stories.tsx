import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen } from 'storybook/test';

import type { IAttachment } from '@/lib/types';
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

// Free user — upload zone disabled, Pro hint shown, existing files still visible.
export const FreeUser: Story = {
  parameters: {
    preloadedState: freeState,
    msw: {
      handlers: [http.get(`${API}/attachments`, () => HttpResponse.json({ data: [attachment()], error: null }))],
    },
  },
  play: async () => {
    await expect(await screen.findByText('design-spec.pdf')).toBeInTheDocument();
    await expect(screen.getByTestId('upload-zone-button')).toBeDisabled();
    await expect(screen.getByTestId('attachment-hint')).toHaveTextContent(/Pro/i);
  },
};
