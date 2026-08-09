import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, userEvent, within } from 'storybook/test';

import { mockTask } from '@/stories/mocks';

import FocusView from './index';

const API = 'http://localhost:8080/v1';
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

const ranked = [
  mockTask({ id: 'f1', title: 'Reply to the designer', status: 'active', energy: 'low', estimatedMinutes: 10 }),
  mockTask({ id: 'f2', title: 'Draft the launch post', status: 'active', energy: 'medium', estimatedMinutes: 25 }),
  mockTask({ id: 'f3', title: 'Refactor the auth flow', status: 'active', energy: 'deep', estimatedMinutes: 90 }),
];

const meta: Meta<typeof FocusView> = {
  title: 'Focus/FocusView',
  component: FocusView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof FocusView>;

// Default: the pick-time prompt, before any window is chosen.
export const PickTime: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/focus`, () => HttpResponse.json(items(ranked)))] },
  },
};

// After choosing a window: the ranked shortlist ready to Start.
export const Ranked: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/focus`, () => HttpResponse.json(items(ranked)))] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('focus-time-m30'));
    await expect(await canvas.findByTestId('focus-list')).toBeInTheDocument();
  },
};

// The execution loop: one task started as the NOW card, rest dimmed as up-next.
export const Session: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/focus`, () => HttpResponse.json(items(ranked)))] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('focus-time-m30'));
    await userEvent.click(await canvas.findByTestId('focus-start-f1'));
    await expect(await canvas.findByTestId('focus-now-card')).toBeInTheDocument();
  },
};

export const EmptyOverBudget: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/focus`, () => HttpResponse.json(items([])))] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByTestId('focus-time-m15'));
    await expect(await canvas.findByTestId('focus-empty')).toBeInTheDocument();
  },
};
