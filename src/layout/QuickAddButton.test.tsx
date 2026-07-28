import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import QuickAddButton from './QuickAddButton';

const renderAt = (pathname: string) => renderComponent(<QuickAddButton />, { initialRoute: pathname });

describe('QuickAddButton', () => {
  it('renders the FAB on an ordinary page', () => {
    renderAt('/quick-access/today');
    expect(screen.getByTestId('quick-add-fab')).toBeInTheDocument();
  });

  it('hides the FAB on the bucket page, which is already the capture surface', () => {
    renderAt('/quick-access/bucket');
    expect(screen.queryByTestId('quick-add-fab')).toBeNull();
  });

  // The FAB is fixed bottom-right and would sit on top of the AI composer's send
  // button, swallowing the click.
  it('hides the FAB on the AI routes so it cannot cover the composer send button', () => {
    renderAt('/ai');
    expect(screen.queryByTestId('quick-add-fab')).toBeNull();

    renderAt('/ai/session-123');
    expect(screen.queryByTestId('quick-add-fab')).toBeNull();
  });
});
