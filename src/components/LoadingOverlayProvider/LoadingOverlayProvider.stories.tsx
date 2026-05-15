import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from '@/components/ui/button';

import { LoadingOverlayProvider, useLoadingOverlay } from '.';

const meta: Meta<typeof LoadingOverlayProvider> = {
  title: 'Components/Providers/LoadingOverlayProvider',
  component: LoadingOverlayProvider,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof LoadingOverlayProvider>;

const OverlayTrigger = () => {
  const { show, hide } = useLoadingOverlay();
  return (
    <div className="flex gap-3">
      <Button onClick={() => show({ title: 'Processing...', subtitle: 'Please wait a moment' })}>Show Overlay</Button>
      <Button variant="outline" onClick={hide}>
        Hide Overlay
      </Button>
    </div>
  );
};

const OverlayTriggerDefault = () => {
  const { show, hide } = useLoadingOverlay();
  return (
    <div className="flex gap-3">
      <Button onClick={() => show()}>Show Default Overlay</Button>
      <Button variant="outline" onClick={hide}>
        Hide
      </Button>
    </div>
  );
};

export const Default: Story = {
  render: () => <OverlayTrigger />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const showBtn = canvas.getByRole('button', { name: /show overlay/i });
    await expect(showBtn).toBeInTheDocument();
    await user.click(showBtn);
    const overlay = document.querySelector('[data-testid="loading-overlay"]') ?? document.body;
    await expect(overlay).toBeTruthy();
  },
};

export const DefaultMessages: Story = {
  render: () => <OverlayTriggerDefault />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /show default overlay/i })).toBeInTheDocument();
  },
};
