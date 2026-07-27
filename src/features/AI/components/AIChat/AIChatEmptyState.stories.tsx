import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';

import { AIChatPanel } from '../../AIChatPanel';

const envelope = (data: unknown) => HttpResponse.json({ data, error: null });

const session = (messages: unknown[]) =>
  envelope({
    id: 's1',
    title: 'Planning',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    messages,
  });

const meta: Meta<typeof AIChatPanel> = {
  title: 'AI/EmptyState',
  component: AIChatPanel,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        http.get('http://localhost:8080/v1/ai/sessions/s1', () => session([])),
        http.get('http://localhost:8080/v1/ai/usage', () =>
          envelope({ used: 0, limit: 5, scope: 'lifetime', month: null })
        ),
      ],
    },
  },
  decorators: [
    Story => (
      <div className="h-[420px] w-full">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof AIChatPanel>;

// Nothing selected yet — the pick-a-conversation prompt.
export const NoSessionSelected: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('ai-chat-empty')).toBeInTheDocument();
  },
};

// A session with no turns yet — the start-a-conversation prompt above the composer.
export const SessionWithNoMessages: Story = {
  args: { sessionId: 's1' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Start a conversation with your AI assistant')).toBeInTheDocument();
  },
};
