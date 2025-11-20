import { renderComponent } from '__tests__/renderComponent.tsx';
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { DIALOG_ACCEPT_BUTTON, DIALOG_CANCEL_BUTTON } from '@/lib/test_ids';

import { CustomDialog } from '.';

describe('CustomDialog', () => {
  it('should open and close based on open prop', () => {
    const { rerender } = renderComponent(
      <CustomDialog open={false} onOpenChange={() => {}} title="Confirm Action" description="Are you sure?" />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<CustomDialog open={true} onOpenChange={() => {}} title="Confirm Action" description="Are you sure?" />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });
  it('should render dialog footer with custom actions', () => {
    renderComponent(
      <CustomDialog
        open
        onOpenChange={() => {}}
        title="Confirm Action"
        description="Are you sure?"
        acceptButton={{ text: 'Confirm', onClick: () => {} }}
        cancelButton={{ text: 'Cancel', onClick: () => {} }}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_ACCEPT_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON)).toBeInTheDocument();
  });
});
