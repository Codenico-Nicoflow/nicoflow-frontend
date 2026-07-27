import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import type { QuotaStatus } from '../../quota';
import { deriveQuota } from '../../quota';

import { AIDisabledBanner } from './AIDisabledBanner';
import { QuotaWall } from './QuotaWall';

const meta: Meta<typeof QuotaWall> = {
  title: 'AI/QuotaWall',
  component: QuotaWall,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // The upgrade CTA is a <Link>; the router comes from the global preview
  // decorator (withRouter), so wrapping again here would nest two routers.
  decorators: [
    Story => (
      <div className="w-[520px] border">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof QuotaWall>;

// Free lifetime cap → an upsell: the block is liftable right now.
export const FreeUpgradeCTA: Story = {
  args: { quota: deriveQuota({ used: 5, limit: 5, scope: 'lifetime', month: null }) as QuotaStatus },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-quota-upgrade-cta')).toHaveAttribute('href', '/settings');
  },
};

// Pro monthly cap → a notice, deliberately with NO CTA: there is nothing to buy.
export const ProResetNotice: Story = {
  args: { quota: deriveQuota({ used: 500, limit: 500, scope: 'month', month: '2026-07' }) as QuotaStatus },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-quota-reset-notice')).toBeInTheDocument();
    await expect(canvas.queryByTestId('ai-quota-upgrade-cta')).not.toBeInTheDocument();
  },
};

// The assistant switched off server-side (AI_UNAVAILABLE) — no retry offered,
// because retrying can't flip a server-side kill switch.
export const FeatureDisabled: StoryObj<typeof AIDisabledBanner> = {
  render: () => <AIDisabledBanner />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-disabled-banner')).toBeInTheDocument();
  },
};
