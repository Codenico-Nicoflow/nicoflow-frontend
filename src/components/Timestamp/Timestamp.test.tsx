import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Timestamp } from '.';

describe('Timestamp', () => {
  it('renders relative time string with "ago" suffix by default', () => {
    const date = new Date(Date.now() - 60 * 1000);
    renderComponent(<Timestamp date={date} />);

    const el = screen.getByTestId('timestamp');
    expect(el.textContent).toMatch(/ago|less than/i);
  });

  it('renders with a custom data-testid', () => {
    renderComponent(<Timestamp date={new Date()} data-testid="my-timestamp" />);
    expect(screen.getByTestId('my-timestamp')).toBeInTheDocument();
  });

  it('omits "ago" when addSuffix={false}', () => {
    const date = new Date(Date.now() - 2 * 60 * 1000);
    renderComponent(<Timestamp date={date} addSuffix={false} />);

    const el = screen.getByTestId('timestamp');
    expect(el.textContent).not.toMatch(/\bago\b/i);
  });

  it('accepts a date string', () => {
    renderComponent(<Timestamp date="2020-01-01T00:00:00.000Z" />);
    const el = screen.getByTestId('timestamp');
    expect(el.textContent?.length).toBeGreaterThan(0);
  });
});
