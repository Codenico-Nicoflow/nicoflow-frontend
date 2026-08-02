import type { Meta, StoryObj } from '@storybook/react';

import TimezoneDriftBanner from './TimezoneDriftBanner';

// Mid-July, so the rendered offsets are the DST ones a real traveller would see.
const NOW = new Date('2026-07-15T12:00:00Z');

const meta: Meta<typeof TimezoneDriftBanner> = {
  title: 'Calendar/TimezoneDriftBanner',
  component: TimezoneDriftBanner,
  tags: ['autodocs'],
  args: {
    now: NOW,
    drift: { accountZone: 'Asia/Jerusalem', browserZone: 'America/New_York' },
    onResolved: () => {},
  },
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof TimezoneDriftBanner>;

/** The common case: the account zone is authoritative, the device disagrees. */
export const Default: Story = {};

/** A half-hour zone, to prove the offset label isn't hour-only. */
export const HalfHourOffset: Story = {
  args: { drift: { accountZone: 'Europe/London', browserZone: 'Asia/Kolkata' } },
};

/** Long zone names must wrap rather than push the actions off a phone screen. */
export const LongZoneNames: Story = {
  args: { drift: { accountZone: 'America/Argentina/Buenos_Aires', browserZone: 'Australia/Lord_Howe' } },
};

/** Below 640px the actions stack and dismiss collapses to a corner icon. */
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
