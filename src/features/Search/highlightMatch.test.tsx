import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { highlightMatch } from './highlightMatch';

const renderHighlight = (text: string, query: string) => render(<span>{highlightMatch(text, query)}</span>);

describe('highlightMatch', () => {
  it('marks a case-insensitive partial match', () => {
    renderHighlight('Testing task', 'testin');
    const mark = screen.getByText('Testin');
    expect(mark.tagName).toBe('MARK');
  });

  it('preserves the original text casing inside the mark', () => {
    renderHighlight('TESTING', 'test');
    expect(screen.getByText('TEST').tagName).toBe('MARK');
  });

  it('marks every query word', () => {
    const { container } = renderHighlight('Ship the bucket page', 'ship bucket');
    const marks = container.querySelectorAll('mark');
    expect([...marks].map(m => m.textContent)).toEqual(['Ship', 'bucket']);
  });

  it('returns the plain text when the query is empty', () => {
    const { container } = renderHighlight('Untouched', '   ');
    expect(container.querySelector('mark')).toBeNull();
    expect(container.textContent).toBe('Untouched');
  });

  it('treats regex metacharacters as literals', () => {
    renderHighlight('a+b value', 'a+b');
    expect(screen.getByText('a+b').tagName).toBe('MARK');
  });
});
