import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';

import { makeArea, makeProject } from '@/mocks/handlers';

import { Rail } from './index';

const API = 'http://localhost:8080/v1';
const env = <T,>(data: T) => ({ data, error: null });

const tree = [
  {
    ...makeArea({ id: 'area-1', name: 'Work', color: '#c4622d', icon: 'briefcase' }),
    projects: [
      makeProject({ id: 'p1', name: 'Launch', areaId: 'area-1', isFavorite: true }),
      makeProject({ id: 'p2', name: 'Hiring', areaId: 'area-1' }),
    ],
  },
  {
    ...makeArea({ id: 'area-2', name: 'Personal', color: '#3d7a5a', icon: 'heart', displayOrder: 1 }),
    projects: [makeProject({ id: 'p3', name: 'Move flat', areaId: 'area-2' })],
  },
];

const meta: Meta<typeof Rail> = {
  title: 'Navigation/Rail',
  component: Rail,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: [http.get(`${API}/areas/with-projects`, () => HttpResponse.json(env(tree)))] },
  },
  decorators: [Story => <div className="h-[560px]">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Rail>;

/** Icon-only — the default for a user who has never toggled the rail. */
export const Collapsed: Story = {
  play: async ({ canvasElement }) => {
    window.localStorage.removeItem('nicoflow-rail');
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('rail-areas')).toBeInTheDocument();
    await expect(canvas.getByTestId('rail-settings')).toBeInTheDocument();
    await expect(canvas.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Labels plus the Area › Project tree. */
export const Expanded: Story = {
  beforeEach: () => {
    window.localStorage.setItem('nicoflow-rail', JSON.stringify({ expanded: true, closedAreaIds: [] }));
    return () => window.localStorage.removeItem('nicoflow-rail');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('rail-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(await canvas.findByTestId('rail-project-p1')).toBeInTheDocument();
  },
};

/** An area the user collapsed keeps its projects hidden across reloads. */
export const AreaCollapsed: Story = {
  beforeEach: () => {
    window.localStorage.setItem('nicoflow-rail', JSON.stringify({ expanded: true, closedAreaIds: ['area-1'] }));
    return () => window.localStorage.removeItem('nicoflow-rail');
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('rail-area-area-1')).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByTestId('rail-area-area-2')).toHaveAttribute('aria-expanded', 'true');
  },
};
