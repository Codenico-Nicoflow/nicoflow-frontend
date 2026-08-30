import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EditScopeDialog } from './EditScopeDialog';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  onChoose: vi.fn(),
  isLoading: false,
};

describe('EditScopeDialog', () => {
  it('renders both scope choices', () => {
    renderComponent(<EditScopeDialog {...defaultProps} />);
    expect(screen.getByTestId('edit-scope-occurrence')).toBeInTheDocument();
    expect(screen.getByTestId('edit-scope-series')).toBeInTheDocument();
  });

  it('calls onChoose("occurrence") when occurrence button is clicked', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    renderComponent(<EditScopeDialog {...defaultProps} onChoose={onChoose} />);
    await user.click(screen.getByTestId('edit-scope-occurrence'));
    expect(onChoose).toHaveBeenCalledWith('occurrence');
  });

  it('calls onChoose("series") when series button is clicked', async () => {
    const onChoose = vi.fn();
    const user = userEvent.setup();
    renderComponent(<EditScopeDialog {...defaultProps} onChoose={onChoose} />);
    await user.click(screen.getByTestId('edit-scope-series'));
    expect(onChoose).toHaveBeenCalledWith('series');
  });

  it('disables both scope buttons while isLoading', () => {
    renderComponent(<EditScopeDialog {...defaultProps} isLoading />);
    expect(screen.getByTestId('edit-scope-occurrence')).toBeDisabled();
    expect(screen.getByTestId('edit-scope-series')).toBeDisabled();
  });

  it('calls onOpenChange(false) when Cancel is clicked', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderComponent(<EditScopeDialog {...defaultProps} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('is not visible when open=false', () => {
    renderComponent(<EditScopeDialog {...defaultProps} open={false} />);
    expect(screen.queryByTestId('edit-scope-dialog')).not.toBeInTheDocument();
  });
});
