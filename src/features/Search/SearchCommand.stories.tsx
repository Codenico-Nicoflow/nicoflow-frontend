import type { Meta, StoryObj } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import { expect, screen, userEvent, within } from 'storybook/test';

import { SearchCommand } from './SearchCommand';

const API = 'http://localhost:8080/v1';
const envelope = <T,>(data: T) => ({ data, error: null });

const mockResults = {
  tasks: [
    {
      id: 'task-1',
      title: 'Bucket task',
      excerpt: 'A capture about the inbox',
      projectName: 'Project Alpha',
      projectId: 'proj-1',
    },
  ],
  projects: [{ id: 'proj-1', name: 'Project Alpha', areaName: 'Work' }],
  areas: [{ id: 'area-1', name: 'Work' }],
};

const meta: Meta<typeof SearchCommand> = {
  title: 'Search/SearchCommand',
  component: SearchCommand,
  tags: ['autodocs'],
  args: {
    open: true,
    onOpenChange: () => undefined,
    onSelect: () => undefined,
  },
};
export default meta;

type Story = StoryObj<typeof SearchCommand>;

// Empty palette — no query typed yet.
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [http.get(`${API}/search`, () => HttpResponse.json(envelope({ tasks: [], projects: [], areas: [] })))],
    },
  },
  play: async ({ canvasElement }) => {
    // The dialog renders via a Radix portal into document.body, not canvasElement.
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('combobox')).toBeInTheDocument();
  },
};

// Loading state — query in-flight.
export const Loading: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/search`, () => new Promise(() => undefined))] },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = await body.findByRole('combobox');
    await userEvent.type(input, 'bu');
    await expect(await screen.findByTestId('search-loading')).toBeInTheDocument();
  },
};

// Populated — results in all three groups.
export const Populated: Story = {
  parameters: {
    msw: { handlers: [http.get(`${API}/search`, () => HttpResponse.json(envelope(mockResults)))] },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = await body.findByRole('combobox');
    await userEvent.type(input, 'bucket');
    await expect(await screen.findByTestId('result-task-task-1')).toBeInTheDocument();
    await expect(await screen.findByTestId('result-project-proj-1')).toBeInTheDocument();
    await expect(await screen.findByTestId('result-area-area-1')).toBeInTheDocument();
  },
};

// No results returned from API.
export const NoResults: Story = {
  parameters: {
    msw: {
      handlers: [http.get(`${API}/search`, () => HttpResponse.json(envelope({ tasks: [], projects: [], areas: [] })))],
    },
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const input = await body.findByRole('combobox');
    await userEvent.type(input, 'zzz');
    await expect(await screen.findByTestId('search-empty')).toBeInTheDocument();
  },
};
