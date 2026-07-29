import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import FocusTimer from './FocusTimer';

const baseProps = {
  seconds: 332,
  estimatedMinutes: 30,
  status: 'running' as const,
  isBusy: false,
  onPause: vi.fn(),
  onResume: vi.fn(),
};

describe('FocusTimer', () => {
  it('renders the cumulative clock while running', () => {
    renderComponent(<FocusTimer {...baseProps} />);
    expect(screen.getByTestId('focus-timer-clock')).toHaveTextContent('05:32');
    expect(screen.queryByTestId('focus-timer-paused')).not.toBeInTheDocument();
  });

  it('shows a skeleton while a segment is starting (no stale flash)', () => {
    renderComponent(<FocusTimer {...baseProps} status="starting" />);
    expect(screen.getByTestId('focus-timer-starting')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-timer-clock')).not.toBeInTheDocument();
  });

  it('freezes with a paused badge and a resume control when paused', () => {
    renderComponent(<FocusTimer {...baseProps} status="paused" />);
    expect(screen.getByTestId('focus-timer-paused')).toBeInTheDocument();
    expect(screen.getByTestId('focus-timer-resume')).toBeInTheDocument();
    expect(screen.queryByTestId('focus-timer-pause')).not.toBeInTheDocument();
  });

  it('says the session continued elsewhere on a cross-tab takeover', () => {
    renderComponent(<FocusTimer {...baseProps} status="endedElsewhere" />);
    expect(screen.getByText(/another tab or device/i)).toBeInTheDocument();
    expect(screen.getByTestId('focus-timer-resume')).toBeInTheDocument();
  });

  it('wires pause and resume clicks', async () => {
    const user = userEvent.setup();
    const onPause = vi.fn();
    const onResume = vi.fn();

    const { unmount } = renderComponent(<FocusTimer {...baseProps} onPause={onPause} />);
    await user.click(screen.getByTestId('focus-timer-pause'));
    expect(onPause).toHaveBeenCalledOnce();
    unmount();

    renderComponent(<FocusTimer {...baseProps} status="paused" onResume={onResume} />);
    await user.click(screen.getByTestId('focus-timer-resume'));
    expect(onResume).toHaveBeenCalledOnce();
  });

  it('disables the control while a request is in flight', () => {
    renderComponent(<FocusTimer {...baseProps} isBusy />);
    expect(screen.getByTestId('focus-timer-pause')).toBeDisabled();
  });

  it('draws the estimate ring only when an estimate exists', () => {
    const { container, unmount } = renderComponent(<FocusTimer {...baseProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.getByText(/of ~30m estimated/i)).toBeInTheDocument();
    unmount();

    const { container: bare } = renderComponent(<FocusTimer {...baseProps} estimatedMinutes={null} />);
    expect(bare.querySelector('svg.-rotate-90')).not.toBeInTheDocument();
    expect(screen.getByText(/no estimate/i)).toBeInTheDocument();
  });

  it('reads as over the estimate once actual exceeds it', () => {
    renderComponent(<FocusTimer {...baseProps} seconds={30 * 60 + 1} />);
    expect(screen.getByText(/over the ~30m estimate/i)).toBeInTheDocument();
  });
});
