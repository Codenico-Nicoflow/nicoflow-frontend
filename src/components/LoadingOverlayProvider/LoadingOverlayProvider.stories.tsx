import type { Meta, StoryObj } from '@storybook/react';

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
};

export const DefaultMessages: Story = {
  render: () => <OverlayTriggerDefault />,
};
