import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { AIMessage } from './AIMessage';

const meta: Meta<typeof AIMessage> = {
  title: 'AI/AIMessage',
  component: AIMessage,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    role: { control: 'inline-radio', options: ['user', 'assistant'] },
    status: { control: 'inline-radio', options: [undefined, 'sending', 'streaming', 'done', 'error'] },
  },
};
export default meta;

type Story = StoryObj<typeof AIMessage>;

export const UserTurn: Story = {
  args: { role: 'user', content: 'Break down my launch project into tasks.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-message-user')).toBeInTheDocument();
  },
};

export const AssistantTurn: Story = {
  args: {
    role: 'assistant',
    content: 'Sure — here is a first pass:\n1. Draft the copy\n2. Design the hero\n3. Set up analytics',
  },
};

export const Streaming: Story = {
  args: { role: 'assistant', content: 'Thinking through the steps', status: 'streaming', streaming: true },
};

export const FailedUserTurn: Story = {
  args: {
    role: 'user',
    content: 'Plan my week',
    status: 'error',
    errorCode: 'AI_LIMIT_REACHED',
    onRetry: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('ai-message-retry')).toBeInTheDocument();
  },
};
