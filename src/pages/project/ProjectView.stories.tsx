import type { Meta, StoryObj } from '@storybook/react';
import { delay, http, HttpResponse } from 'msw';
import { expect, screen, within } from 'storybook/test';
import { reactRouterParameters } from 'storybook-addon-remix-react-router';

import { makeProject, makeUser } from '@/mocks/handlers';

import ProjectView from './ProjectView';

const projectHandler = (id: string, name: string) =>
  http.get(`http://localhost:8080/v1/projects/${id}`, () =>
    HttpResponse.json({ data: makeProject({ id, name }), error: null })
  );

// ProjectView reads :projectId from the route.
const routeFor = (id: string) =>
  reactRouterParameters({ location: { pathParams: { projectId: id } }, routing: { path: '/projects/:projectId' } });

const meta: Meta<typeof ProjectView> = {
  title: 'Pages/Project/ProjectView',
  component: ProjectView,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    preloadedState: { auth: { user: makeUser(), token: 't', isLoading: false } },
  },
};
export default meta;

type Story = StoryObj<typeof ProjectView>;

export const Loaded: Story = {
  parameters: {
    reactRouter: routeFor('p1'),
    msw: { handlers: [projectHandler('p1', 'Website Redesign')] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('heading', { name: 'Website Redesign' })).toBeInTheDocument();
  },
};

export const NotFound: Story = {
  parameters: {
    reactRouter: routeFor('missing'),
    msw: {
      handlers: [
        http.get('http://localhost:8080/v1/projects/missing', () =>
          HttpResponse.json(
            { data: null, error: { code: 'RESOURCE_NOT_FOUND', message: 'Not found' } },
            { status: 404 }
          )
        ),
      ],
    },
  },
  play: async () => {
    await expect(await screen.findByText('Project not found')).toBeInTheDocument();
  },
};

export const Loading: Story = {
  parameters: {
    reactRouter: routeFor('p1'),
    msw: {
      handlers: [
        http.get('http://localhost:8080/v1/projects/p1', async () => {
          await delay('infinite');
          return HttpResponse.json({ data: null, error: null });
        }),
      ],
    },
  },
};
