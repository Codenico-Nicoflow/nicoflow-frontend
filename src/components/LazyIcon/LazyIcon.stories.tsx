import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';

import { ICON_IDS } from '@/lib/utils';

import { LazyIcon } from '.';

const meta: Meta<typeof LazyIcon> = {
  title: 'Components/Presentational/LazyIcon',
  component: LazyIcon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    iconId: { control: 'select', options: ICON_IDS },
    className: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof LazyIcon>;

export const SingleIcon: Story = {
  args: {
    iconId: 'folder',
    className: 'w-6 h-6 text-foreground',
  },
  play: async ({ canvasElement }) => {
    // Lucide renders an aria-hidden <svg> (no img role); LazyIcon loads it
    // lazily, so wait until the svg mounts.
    await waitFor(() => expect(canvasElement.querySelector('svg')).toBeTruthy());
  },
};

export const AllIconsGrid: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4 p-4 max-w-lg">
      {ICON_IDS.map(id => (
        <div key={id} className="flex flex-col items-center gap-1">
          <LazyIcon iconId={id} className="w-5 h-5 text-foreground" />
          <span className="text-xs text-muted-foreground text-center leading-tight">{id}</span>
        </div>
      ))}
    </div>
  ),
};
