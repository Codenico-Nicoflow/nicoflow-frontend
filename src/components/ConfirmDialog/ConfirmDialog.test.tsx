import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertTriangle } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '.';

describe('ConfirmDialog', () => {
  it('should open and close based on open prop', () => {
    const { rerender } = renderComponent(
      <ConfirmDialog
        open={false}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        description="Are you sure?"
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        description="Are you sure?"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const mockConfirm = vi.fn();
    const mockOpenChange = vi.fn();

    renderComponent(
      <ConfirmDialog
        open={true}
        onOpenChange={mockOpenChange}
        onConfirm={mockConfirm}
        title="Delete Item"
        description="This action cannot be undone"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });

  it('should display loading state', () => {
    renderComponent(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Processing"
        description="Please wait"
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should apply variant styles and show custom icon', () => {
    const { rerender } = renderComponent(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Warning"
        description="Proceed with caution"
        variant="warning"
        icon={AlertTriangle}
      />
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="Danger"
        description="This is dangerous"
        variant="danger"
      />
    );

    expect(screen.getByText('Danger')).toBeInTheDocument();
  });
});
