import * as React from 'react';

import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

import type { TaskCompleteCheckboxHandle } from './index';
import { TaskCompleteCheckbox } from './index';

const meta: Meta<typeof TaskCompleteCheckbox> = {
  title: 'Components/TaskCompleteCheckbox',
  component: TaskCompleteCheckbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    checked: false,
    onToggle: () => {},
    'aria-label': 'Complete task',
    'data-testid': 'story-checkbox',
  },
};
export default meta;

type Story = StoryObj<typeof TaskCompleteCheckbox>;

export const Default: Story = {
  args: { checked: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByTestId('story-checkbox');
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
  },
};

export const Checked: Story = {
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('story-checkbox')).toBeChecked();
  },
};

export const SmallSize: Story = {
  args: { size: 'sm', checked: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('story-checkbox')).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { disabled: true, checked: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('story-checkbox')).toBeDisabled();
  },
};

const DeferredAnimationRender = (args: React.ComponentProps<typeof TaskCompleteCheckbox>) => {
  const ref = React.useRef<TaskCompleteCheckboxHandle>(null);
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <TaskCompleteCheckbox {...args} ref={ref} checked={checked} onToggle={() => setChecked(c => !c)} deferAnimation />
      <button
        type="button"
        className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        onClick={() => ref.current?.playCompleteAnimation()}
        data-testid="play-animation-button"
      >
        Play animation (simulate confirm)
      </button>
    </div>
  );
};

export const DeferredAnimation: Story = {
  render: args => <DeferredAnimationRender {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByTestId('play-animation-button');
    await userEvent.click(trigger);
    await waitFor(() => expect(canvas.getByTestId('story-checkbox')).toBeInTheDocument());
  },
};

const reducedMotionDecorator: Decorator = Story => {
  // Stub useReducedMotion at the module level is not possible in Storybook
  // without vitest — instead we show the story at face value and document
  // the intent. The animation.test.ts covers the reduced-motion code paths.
  return (
    <div style={{ filter: 'none' }}>
      <Story />
    </div>
  );
};

export const ReducedMotion: Story = {
  args: { checked: false },
  decorators: [reducedMotionDecorator],
  parameters: {
    docs: {
      description: {
        story:
          'Simulates the reduced-motion path. In real usage, Framer Motion reads prefers-reduced-motion and skips scale keyframes + burst particles.',
      },
    },
  },
};

const rtlDecorator: Decorator = Story => (
  <div dir="rtl">
    <Story />
  </div>
);

export const RTL: Story = {
  args: { checked: false },
  decorators: [rtlDecorator],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('story-checkbox')).toBeInTheDocument();
  },
};
