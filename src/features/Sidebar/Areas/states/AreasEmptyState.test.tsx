import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '@/components/ui/sidebar';

import { renderComponent } from '../../../../../__tests__/renderComponent';

import { AreasEmptyState } from './index';

describe('AreasEmptyState', () => {
  it('renders a real CTA button and fires onCreateArea when clicked', async () => {
    const onCreateArea = vi.fn();
    const user = userEvent.setup();

    renderComponent(
      <SidebarProvider>
        <AreasEmptyState onCreateArea={onCreateArea} />
      </SidebarProvider>
    );

    const button = screen.getByTestId('areas-empty-create');
    expect(button).toHaveTextContent('Create your first Area');

    await user.click(button);

    expect(onCreateArea).toHaveBeenCalledTimes(1);
  });
});
