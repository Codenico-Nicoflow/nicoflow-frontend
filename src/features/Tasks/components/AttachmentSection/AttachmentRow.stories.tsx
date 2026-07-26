import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen, userEvent, within } from 'storybook/test';

import type { IAttachment } from '@/lib/types';
import { mockUser } from '@/stories/mocks';

import { AttachmentRow } from './AttachmentRow';

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

const meta: Meta<typeof AttachmentRow> = {
  title: 'Tasks/AttachmentRow',
  component: AttachmentRow,
  tags: ['autodocs'],
  parameters: { preloadedState: { auth: { user: mockUser({ status: 'premium' }) } } },
  decorators: [
    Story => (
      <ul className="max-w-lg p-4">
        <Story />
      </ul>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AttachmentRow>;

// A PDF — the FileType icon, name, size, download + delete controls.
export const Pdf: Story = { args: { attachment: attachment() } };

// An image type renders the image icon.
export const Image: Story = {
  args: { attachment: attachment({ fileName: 'screenshot.png', mimeType: 'image/png', fileSize: 240_000 }) },
};

// A spreadsheet type renders the sheet icon.
export const Spreadsheet: Story = {
  args: {
    attachment: attachment({
      fileName: 'budget.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 48_000,
    }),
  },
};

// Clicking delete arms an inline confirm — no dialog, no undo.
export const InlineDeleteConfirm: Story = {
  args: { attachment: attachment() },
  parameters: {
    msw: { handlers: [http.delete(`${API}/attachments/a1`, () => new HttpResponse(null, { status: 204 }))] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('attachment-delete-a1'));
    await expect(screen.getByTestId('attachment-delete-confirm-a1')).toBeInTheDocument();
    await expect(screen.getByTestId('attachment-delete-cancel-a1')).toBeInTheDocument();
  },
};
