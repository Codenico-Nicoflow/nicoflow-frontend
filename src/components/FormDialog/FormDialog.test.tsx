import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { FORM_DIALOG_CANCEL_BUTTON, FORM_DIALOG_SUBMIT_BUTTON } from '@/lib/test_ids';

import { FormDialog } from '.';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Create Item',
  onSubmit: vi.fn(),
};

describe('FormDialog', () => {
  it('does not render dialog when open={false}', () => {
    renderComponent(
      <FormDialog {...defaultProps} open={false}>
        <div>form content</div>
      </FormDialog>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog when open={true}', () => {
    renderComponent(
      <FormDialog {...defaultProps}>
        <div>form content</div>
      </FormDialog>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create Item')).toBeInTheDocument();
  });

  it('renders title and description', () => {
    renderComponent(
      <FormDialog {...defaultProps} description="Fill out the details below">
        <div>content</div>
      </FormDialog>
    );

    expect(screen.getByText('Create Item')).toBeInTheDocument();
    expect(screen.getByText('Fill out the details below')).toBeInTheDocument();
  });

  it('shows "Create" submit button text when isEditMode is false', () => {
    renderComponent(
      <FormDialog {...defaultProps} isEditMode={false}>
        <div>content</div>
      </FormDialog>
    );

    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toHaveTextContent('Create');
  });

  it('shows "Save Changes" submit button text when isEditMode is true', () => {
    renderComponent(
      <FormDialog {...defaultProps} isEditMode={true}>
        <div>content</div>
      </FormDialog>
    );

    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toHaveTextContent('Save Changes');
  });

  it('submit button is disabled when hasChanges={false}', () => {
    renderComponent(
      <FormDialog {...defaultProps} hasChanges={false}>
        <div>content</div>
      </FormDialog>
    );

    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toBeDisabled();
  });

  it('shows "Creating..." with spinner when isLoading=true and isEditMode=false', () => {
    renderComponent(
      <FormDialog {...defaultProps} isLoading={true} isEditMode={false}>
        <div>content</div>
      </FormDialog>
    );

    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toHaveTextContent('Creating...');
    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toBeDisabled();
  });

  it('shows "Saving..." with spinner when isLoading=true and isEditMode=true', () => {
    renderComponent(
      <FormDialog {...defaultProps} isLoading={true} isEditMode={true}>
        <div>content</div>
      </FormDialog>
    );

    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toHaveTextContent('Saving...');
    expect(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON)).toBeDisabled();
  });

  it('clicking Cancel calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const mockOpenChange = vi.fn();

    renderComponent(
      <FormDialog {...defaultProps} onOpenChange={mockOpenChange}>
        <div>content</div>
      </FormDialog>
    );

    await user.click(screen.getByTestId(FORM_DIALOG_CANCEL_BUTTON));
    expect(mockOpenChange).toHaveBeenCalledWith(false);
  });

  it('submitting form calls onSubmit', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    renderComponent(
      <FormDialog {...defaultProps} onSubmit={mockSubmit}>
        <div>content</div>
      </FormDialog>
    );

    await user.click(screen.getByTestId(FORM_DIALOG_SUBMIT_BUTTON));
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});
