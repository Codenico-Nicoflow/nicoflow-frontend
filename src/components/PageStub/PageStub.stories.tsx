import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import PageStub from './PageStub';

const meta: Meta<typeof PageStub> = {
  title: 'Components/Presentational/PageStub',
  component: PageStub,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: { title: { control: 'text' } },
};
export default meta;

type Story = StoryObj<typeof PageStub>;

export const Default: Story = {
  args: { title: 'Next 7 Days' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Next 7 Days')).toBeInTheDocument();
    await expect(canvas.getByText('Coming soon')).toBeInTheDocument();
  },
};
