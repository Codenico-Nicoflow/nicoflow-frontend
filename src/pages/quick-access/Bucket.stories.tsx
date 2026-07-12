import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';

import { makeBucket, makeUser } from '@/mocks/handlers';

import Bucket from './Bucket';

const URL = 'http://localhost:8080/v1/bucket';

const meta: Meta<typeof Bucket> = {
  title: 'Pages/QuickAccess/Bucket',
  component: Bucket,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser(), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof Bucket>;

const unprocessed = [
  makeBucket({ id: 'b1', content: 'Draft the Q3 launch email and get sign-off from marketing' }),
  makeBucket({ id: 'b2', content: 'Call the dentist to reschedule' }),
  makeBucket({ id: 'b3', content: 'Idea: weekly review template with energy tags' }),
];

const processed = [
  makeBucket({
    id: 'a1',
    content: 'Ship the bucket page',
    processedAt: '2026-07-12T09:00:00Z',
    processingResult: 'task',
    createdTaskId: 't1',
  }),
  makeBucket({
    id: 'a2',
    content: 'Random late-night thought that went nowhere',
    processedAt: '2026-07-11T22:00:00Z',
    processingResult: 'trash',
  }),
  makeBucket({
    id: 'a3',
    content: 'Note to self about the onboarding copy',
    processedAt: '2026-07-10T14:00:00Z',
    processingResult: 'note',
  }),
];

export const Filled: Story = {
  parameters: {
    msw: {
      handlers: [http.get(URL, () => HttpResponse.json({ data: [...unprocessed, ...processed], error: null }))],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('bucket-tab-inbox')).toBeInTheDocument();
    await expect(await canvas.findByText('Call the dentist to reschedule')).toBeInTheDocument();
  },
};

export const InboxZero: Story = {
  parameters: {
    msw: { handlers: [http.get(URL, () => HttpResponse.json({ data: processed, error: null }))] },
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [http.get(URL, () => HttpResponse.json({ data: [], error: null }))] },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(URL, async () => {
          await delay('infinite');
          return HttpResponse.json({ data: [], error: null });
        }),
      ],
    },
  },
};
