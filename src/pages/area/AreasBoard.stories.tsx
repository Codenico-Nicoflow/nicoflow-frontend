import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';
import { expect, within } from 'storybook/test';

import { makeAreaWithProjects, makeProject, makeUser } from '@/mocks/handlers';

import AreasBoard from './AreasBoard';

const URL = 'http://localhost:8080/v1/areas/with-projects';

const meta: Meta<typeof AreasBoard> = {
  title: 'Pages/Area/AreasBoard',
  component: AreasBoard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser(), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof AreasBoard>;

export const Filled: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(URL, () =>
          HttpResponse.json({
            data: [
              makeAreaWithProjects({
                id: 'area-1',
                name: 'Work',
                projects: [
                  makeProject({ id: 'p1', name: 'Website Redesign' }),
                  makeProject({ id: 'p2', name: 'Hiring' }),
                ],
              }),
              makeAreaWithProjects({ id: 'area-2', name: 'Personal', projects: [] }),
            ],
            error: null,
          })
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Your Areas')).toBeInTheDocument();
    await expect(await canvas.findByText('Work')).toBeInTheDocument();
  },
};

export const Empty: Story = {
  parameters: {
    msw: { handlers: [http.get(URL, () => HttpResponse.json({ data: [], error: null }))] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByTestId('board-empty')).toBeInTheDocument();
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
