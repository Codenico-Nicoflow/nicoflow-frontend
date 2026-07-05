import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';

import { mockTask } from '@/stories/mocks';

import FocusView from './index';

const API = 'http://localhost:8080/v1';
const items = <T,>(list: T[]) => ({ data: { items: list }, error: null });

const ranked = [
  mockTask({ id: 'f1', title: 'Reply to the designer', status: 'active', energy: 'low', estimatedMinutes: 10 }),
  mockTask({ id: 'f2', title: 'Draft the launch post', status: 'active', energy: 'medium', estimatedMinutes: 25 }),
  mockTask({ id: 'f3', title: 'Refactor the auth flow', status: 'inbox', energy: 'deep', estimatedMinutes: 90 }),
];

const meta: Meta<typeof FocusView> = {
  title: 'Focus/FocusView',
  component: FocusView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof FocusView>;

export const Ranked: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/focus`, () => HttpResponse.json(items(ranked)))] },
  },
};

export const EmptyOverBudget: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/focus`, () => HttpResponse.json(items([])))] },
  },
};
