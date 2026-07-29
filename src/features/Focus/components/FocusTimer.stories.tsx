import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import FocusTimer from './FocusTimer';

// The stopwatch block on the NOW card: cumulative time-on-task, the display-only
// actual-vs-estimate ring, and the pause/resume control. Pure display — the
// lifecycle (segments, heartbeats, WS) lives in useFocusTimer.
const meta: Meta<typeof FocusTimer> = {
  title: 'Focus/FocusTimer',
  component: FocusTimer,
  tags: ['autodocs'],
  args: {
    seconds: 332,
    estimatedMinutes: 30,
    status: 'running',
    isBusy: false,
    onPause: fn(),
    onResume: fn(),
  },
  decorators: [
    Story => (
      <div className="max-w-md rounded-xl border border-border/60 bg-background p-4">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof FocusTimer>;

// Ticking under the estimate — the ring is partially filled.
export const Running: Story = {};

// Frozen with the paused badge; the control flips to Resume.
export const Paused: Story = {
  args: { status: 'paused' },
};

// A segment open request is in flight — skeleton, no stale clock.
export const Starting: Story = {
  args: { status: 'starting' },
};

// Past the estimate: the ring caps full and recolors — calm "over", never red.
export const OverEstimate: Story = {
  args: { seconds: 41 * 60, estimatedMinutes: 30 },
};

// No estimate on the task: clock only, no ring.
export const NoEstimate: Story = {
  args: { estimatedMinutes: null },
};

// Another tab or device took the session over.
export const EndedElsewhere: Story = {
  args: { status: 'endedElsewhere' },
};

// Past an hour the clock gains the hour digit.
export const LongRun: Story = {
  args: { seconds: 2 * 3600 + 15 * 60 + 9, estimatedMinutes: 120 },
};
