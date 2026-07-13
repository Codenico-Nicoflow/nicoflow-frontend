import { renderComponent } from '__tests__/renderComponent';
import { server } from '__tests__/server';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeBucket } from '@/mocks/handlers';

import { BucketProcessDialog } from './index';

const API = 'http://localhost:8080/v1';

const withOneProject = () =>
  server.use(
    http.get(`${API}/projects`, () =>
      HttpResponse.json({ data: { items: [{ id: 'p1', name: 'Inbox project' }] }, error: null })
    )
  );

describe('BucketProcessDialog pre-fill (parseBucketContent)', () => {
  it('pre-fills the task title from the first line and notes from the rest', async () => {
    withOneProject();
    const bucket = makeBucket({ id: 'b1', content: 'Buy milk\nfrom the corner shop' });

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('Buy milk');
    });
    expect(screen.getByTestId('description-textarea')).toHaveValue('from the corner shop');
  });

  it('pre-fills only the title when the content is a single line', async () => {
    withOneProject();
    const bucket = makeBucket({ id: 'b2', content: 'Call the dentist' });

    renderComponent(<BucketProcessDialog bucket={bucket} open onOpenChange={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('Call the dentist');
    });
    expect(screen.getByTestId('description-textarea')).toHaveValue('');
  });
});
