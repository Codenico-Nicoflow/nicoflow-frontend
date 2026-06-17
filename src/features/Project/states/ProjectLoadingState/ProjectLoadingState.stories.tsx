import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ProjectLoadingState } from '.';

const meta: Meta<typeof ProjectLoadingState> = {
  title: 'Project/states/LoadingState',
  component: ProjectLoadingState,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [Story => <div className="mx-auto max-w-3xl p-6">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof ProjectLoadingState>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  },
};
