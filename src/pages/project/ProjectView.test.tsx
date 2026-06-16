import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { mockProject } from '@/mocks/handlers';

import { server } from '../../../__tests__/server';

import ProjectView from './ProjectView';

const PROJECT_URL = 'http://localhost:8080/v1/projects/project-1';
const envelope = <T,>(data: T) => ({ data, error: null });

const renderAt = () =>
  renderComponent(
    <Routes>
      <Route path="/projects/:projectId" element={<ProjectView />} />
    </Routes>,
    { initialRoute: '/projects/project-1' }
  );

describe('ProjectView', () => {
  it('renders the project header and description on success', async () => {
    server.use(http.get(PROJECT_URL, () => HttpResponse.json(envelope(mockProject))));

    renderAt();

    expect(await screen.findByText('Redesign')).toBeInTheDocument();
    expect(screen.getByTestId('project-description')).toBeInTheDocument();
    expect(screen.getByText(/Revamp the areas/)).toBeInTheDocument();
  });

  it('shows a not-found state when the project does not exist', async () => {
    server.use(
      http.get(PROJECT_URL, () =>
        HttpResponse.json({ data: null, error: { code: 'PROJECT_NOT_FOUND', message: 'not found' } }, { status: 404 })
      )
    );

    renderAt();

    expect(await screen.findByTestId('project-not-found')).toBeInTheDocument();
  });
});
