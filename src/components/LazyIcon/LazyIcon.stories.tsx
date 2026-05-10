import type { Meta, StoryObj } from '@storybook/react';

import { ICON_IDS } from '@/lib/utils';

import { LazyIcon } from '.';

const meta: Meta<typeof LazyIcon> = {
  title: 'Components/Presentational/LazyIcon',
  component: LazyIcon,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof LazyIcon>;

export const SingleIcon: Story = {
  args: {
    iconId: 'folder',
    className: 'w-6 h-6 text-foreground',
  },
};

export const AllIconsGrid: Story = {
  render: () => (
    <div className="grid grid-cols-6 gap-4 p-4">
      {ICON_IDS.map(id => (
        <div key={id} className="flex flex-col items-center gap-1">
          <LazyIcon iconId={id} className="w-5 h-5 text-foreground" />
          <span className="text-xs text-muted-foreground text-center leading-tight">{id}</span>
        </div>
      ))}
    </div>
  ),
};
