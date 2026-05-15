import { renderComponent } from '__tests__/renderComponent';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { LoadingOverlayProvider, useLoadingOverlay } from '.';

const TestConsumer = () => {
  const { show, hide } = useLoadingOverlay();
  return (
    <div>
      <button onClick={() => show({ title: 'Loading...', subtitle: 'Please wait' })}>Show</button>
      <button onClick={() => show({ title: 'Custom title' })}>Show Custom</button>
      <button onClick={hide}>Hide</button>
    </div>
  );
};

describe('LoadingOverlayProvider', () => {
  it('renders children without overlay visible by default', () => {
    renderComponent(
      <LoadingOverlayProvider>
        <div>Child content</div>
      </LoadingOverlayProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('shows overlay with title and subtitle when show() is called', async () => {
    const user = userEvent.setup();
    renderComponent(
      <LoadingOverlayProvider>
        <TestConsumer />
      </LoadingOverlayProvider>
    );

    await user.click(screen.getByRole('button', { name: /show$/i }));

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });
  });

  it('shows overlay with custom title', async () => {
    const user = userEvent.setup();
    renderComponent(
      <LoadingOverlayProvider>
        <TestConsumer />
      </LoadingOverlayProvider>
    );

    await user.click(screen.getByRole('button', { name: /show custom/i }));

    await waitFor(() => {
      expect(screen.getByText('Custom title')).toBeInTheDocument();
    });
  });

  it('hides overlay when hide() is called', async () => {
    const user = userEvent.setup();
    renderComponent(
      <LoadingOverlayProvider>
        <TestConsumer />
      </LoadingOverlayProvider>
    );

    await user.click(screen.getByRole('button', { name: /show$/i }));
    await waitFor(() => expect(screen.getByText('Loading...')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /hide/i }));
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
  });

  it('throws when useLoadingOverlay is used outside provider', () => {
    const BadConsumer = () => {
      useLoadingOverlay();
      return null;
    };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // render bare — no LoadingOverlayProvider in the tree
    expect(() => render(<BadConsumer />)).toThrow('useLoadingOverlay must be used within LoadingOverlayProvider');
    consoleSpy.mockRestore();
  });
});
