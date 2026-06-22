import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Rail } from './index';

describe('Rail', () => {
  it('renders the primary destinations + settings', () => {
    renderComponent(<Rail />, { initialRoute: '/quick-access/today' });
    for (const id of ['rail-today', 'rail-inbox', 'rail-areas', 'rail-settings']) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
  });

  it('marks Areas active on a project route (prefix match)', () => {
    renderComponent(<Rail />, { initialRoute: '/projects/abc-123' });
    expect(screen.getByTestId('rail-areas')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('rail-today')).not.toHaveAttribute('aria-current');
  });
});
