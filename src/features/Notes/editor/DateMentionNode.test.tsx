import { renderComponent } from '__tests__/renderComponent';
import type { TiptapDoc } from '@nicoflow/shared/types';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { parseISODateLocal } from './DateMentionNode';
import { createNoteExtensions } from './extensions';
import { NoteEditor } from './NoteEditor';

const docWithMention: TiptapDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Follow up ' },
        { type: 'dateMention', attrs: { date: '2026-08-21' } },
      ],
    },
  ],
};

describe('DateMentionNode', () => {
  it('renders a chip with the formatted date, not the raw ISO string', async () => {
    renderComponent(<NoteEditor content={docWithMention} />);

    await waitFor(() => expect(screen.getByTestId('note-date-mention')).toBeInTheDocument());

    const chip = screen.getByTestId('note-date-mention');
    expect(chip).toHaveTextContent('2026');
    expect(chip.textContent).not.toBe('2026-08-21');
  });
});

describe('parseISODateLocal', () => {
  it('parses an ISO date string as a local date, not UTC', () => {
    const date = parseISODateLocal('2026-08-21');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(7); // 0-indexed
    expect(date.getDate()).toBe(21);
  });
});

describe('note date-mention extension registration', () => {
  it('registers the dateMention node used by DateMentionNode', () => {
    const extensions = createNoteExtensions({ placeholder: '' });
    expect(extensions.some(ext => ext.name === 'dateMention')).toBe(true);
  });
});
