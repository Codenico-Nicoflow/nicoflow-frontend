import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { QuotaStatus } from '../../quota';
import { deriveQuota } from '../../quota';

import { QuotaIndicator } from './QuotaIndicator';

// Derive from real usage payloads so the stories exercise the same code path the
// app does, instead of hand-built status objects that could drift.
const freeQuota = (used: number) => deriveQuota({ used, limit: 5, scope: 'lifetime', month: null }) as QuotaStatus;
const proQuota = (used: number) => deriveQuota({ used, limit: 500, scope: 'month', month: '2026-07' }) as QuotaStatus;

const meta: Meta<typeof QuotaIndicator> = {
  title: 'AI/QuotaIndicator',
  component: QuotaIndicator,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <div className="w-[280px] border">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof QuotaIndicator>;

export const FreeUnderLimit: Story = {
  args: { quota: freeQuota(2) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-quota-label')).toHaveTextContent('2 / 5 free messages');
  },
};

export const FreeExhausted: Story = {
  args: { quota: freeQuota(5) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-quota-indicator')).toHaveAttribute('data-quota-state', 'exhausted');
  },
};

export const ProUnderLimit: Story = {
  args: { quota: proQuota(128) },
};

export const ProAtLimit: Story = {
  args: { quota: proQuota(500) },
};

export const Loading: Story = {
  args: { quota: undefined, isLoading: true },
};

// A failed usage read renders nothing at all rather than a misleading "0 / 0".
export const Unknown: Story = {
  args: { quota: undefined },
};
