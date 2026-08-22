import { renderComponent } from '__tests__/renderComponent';
import { type IBucket, ProcessingResult } from '@nicoflow/shared/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArchivedBucketItem } from '.';

const bucket = (overrides: Partial<IBucket> = {}): IBucket => ({
  id: 'b1',
  userId: 'u1',
  content: 'Something captured',
  processedAt: '2026-03-01T08:00:00Z',
  processingResult: ProcessingResult.TRASH,
  createdTaskId: null,
  createdNoteId: null,
  projectId: null,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-03-01T08:00:00Z',
  ...overrides,
});

describe('ArchivedBucketItem', () => {
  it('links "view what this became" to the note full-page route when createdNoteId is set', () => {
    renderComponent(
      <ArchivedBucketItem
        bucket={bucket({ processingResult: ProcessingResult.NOTE, createdNoteId: 'note-1' })}
        index={0}
      />
    );

    expect(screen.getByTestId('bucket-view-created')).toHaveAttribute('href', '/notes/note-1');
  });

  it('renders no link when the bucket item was trashed', () => {
    renderComponent(<ArchivedBucketItem bucket={bucket({ processingResult: ProcessingResult.TRASH })} index={0} />);

    expect(screen.queryByTestId('bucket-view-created')).not.toBeInTheDocument();
  });
});
