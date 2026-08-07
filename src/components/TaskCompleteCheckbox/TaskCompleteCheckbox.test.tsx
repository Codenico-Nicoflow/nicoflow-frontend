import * as React from 'react';

import { renderComponent } from '__tests__/renderComponent';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TaskCompleteCheckboxHandle } from './index';
import { TaskCompleteCheckbox } from './index';

// Framer Motion's onAnimationComplete doesn't fire in jsdom (no real RAF).
// We mock the module so motion.div renders as a plain div, which makes the
// animation phase observable via data-animation-phase without needing timers.
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
      span: React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(({ children, ...props }, ref) => (
        <span ref={ref} {...props}>
          {children}
        </span>
      )),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useReducedMotion: vi.fn().mockReturnValue(false),
  };
});

const renderCheckbox = (props: Partial<React.ComponentProps<typeof TaskCompleteCheckbox>> = {}) => {
  const defaults = {
    checked: false,
    onToggle: vi.fn(),
    'aria-label': 'Complete task',
    'data-testid': 'test-checkbox',
  } as const;
  return renderComponent(<TaskCompleteCheckbox {...defaults} {...props} />);
};

describe('TaskCompleteCheckbox', () => {
  it('renders unchecked state correctly', () => {
    renderCheckbox({ checked: false });
    expect(screen.getByTestId('test-checkbox')).not.toBeChecked();
  });

  it('renders checked state correctly', () => {
    renderCheckbox({ checked: true });
    expect(screen.getByTestId('test-checkbox')).toBeChecked();
  });

  it('fires onToggle when clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderCheckbox({ onToggle });

    await user.click(screen.getByTestId('test-checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('fires onToggle on keyboard Space (Radix built-in)', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderCheckbox({ onToggle });

    screen.getByTestId('test-checkbox').focus();
    await user.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not bubble click to a parent onClick', async () => {
    const parentClick = vi.fn();
    const user = userEvent.setup();
    renderComponent(
      <div onClick={parentClick}>
        <TaskCompleteCheckbox checked={false} onToggle={vi.fn()} aria-label="complete" data-testid="test-checkbox" />
      </div>
    );
    await user.click(screen.getByTestId('test-checkbox'));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('does not fire onToggle when disabled', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderCheckbox({ onToggle, disabled: true });

    await user.click(screen.getByTestId('test-checkbox'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('sets animation phase to completing immediately when deferAnimation is false', async () => {
    const user = userEvent.setup();
    renderCheckbox({ checked: false, deferAnimation: false });

    const outer = screen.getByTestId('test-checkbox').closest('[data-animation-phase]');
    expect(outer?.getAttribute('data-animation-phase')).toBe('idle');

    await user.click(screen.getByTestId('test-checkbox'));
    expect(outer?.getAttribute('data-animation-phase')).toBe('completing');
  });

  it('does NOT animate on click when deferAnimation is true', async () => {
    const user = userEvent.setup();
    renderCheckbox({ checked: false, deferAnimation: true });

    const outer = screen.getByTestId('test-checkbox').closest('[data-animation-phase]');
    await user.click(screen.getByTestId('test-checkbox'));

    expect(outer?.getAttribute('data-animation-phase')).toBe('idle');
  });

  it('plays animation when playCompleteAnimation is called via ref', async () => {
    const ref = React.createRef<TaskCompleteCheckboxHandle>();
    renderComponent(
      <TaskCompleteCheckbox
        ref={ref}
        checked={false}
        onToggle={vi.fn()}
        deferAnimation
        aria-label="complete"
        data-testid="test-checkbox"
      />
    );

    const outer = screen.getByTestId('test-checkbox').closest('[data-animation-phase]');
    expect(outer?.getAttribute('data-animation-phase')).toBe('idle');

    ref.current?.playCompleteAnimation();

    await waitFor(() => expect(outer?.getAttribute('data-animation-phase')).toBe('completing'));
  });

  it('playCompleteAnimation is idempotent — no-op if already completing', async () => {
    const ref = React.createRef<TaskCompleteCheckboxHandle>();
    const user = userEvent.setup();
    renderComponent(
      <TaskCompleteCheckbox
        ref={ref}
        checked={false}
        onToggle={vi.fn()}
        deferAnimation={false}
        aria-label="complete"
        data-testid="test-checkbox"
      />
    );

    await user.click(screen.getByTestId('test-checkbox'));
    const outer = screen.getByTestId('test-checkbox').closest('[data-animation-phase]');
    expect(outer?.getAttribute('data-animation-phase')).toBe('completing');

    // Calling again should not throw and phase stays completing
    ref.current?.playCompleteAnimation();
    expect(outer?.getAttribute('data-animation-phase')).toBe('completing');
  });

  it('sets animation phase to uncompleting when clicking a checked checkbox', async () => {
    const user = userEvent.setup();
    renderCheckbox({ checked: true });

    const outer = screen.getByTestId('test-checkbox').closest('[data-animation-phase]');
    await user.click(screen.getByTestId('test-checkbox'));
    expect(outer?.getAttribute('data-animation-phase')).toBe('uncompleting');
  });

  it('renders the sm size class on the checkbox', () => {
    renderCheckbox({ size: 'sm' });
    const checkbox = screen.getByTestId('test-checkbox');
    expect(checkbox.className).toMatch(/size-5/);
  });

  it('renders the md size class on the checkbox', () => {
    renderCheckbox({ size: 'md' });
    const checkbox = screen.getByTestId('test-checkbox');
    expect(checkbox.className).toMatch(/size-6/);
  });

  it('external checked prop change alone does not set animation phase', async () => {
    const onToggle = vi.fn();
    const { rerender } = renderComponent(
      <TaskCompleteCheckbox checked={false} onToggle={onToggle} aria-label="complete" data-testid="test-checkbox" />
    );

    const outer = screen.getByTestId('test-checkbox').closest('[data-animation-phase]');
    expect(outer?.getAttribute('data-animation-phase')).toBe('idle');

    rerender(
      <TaskCompleteCheckbox checked={true} onToggle={onToggle} aria-label="complete" data-testid="test-checkbox" />
    );

    // Phase must remain idle — the prop change alone should not trigger animation
    expect(outer?.getAttribute('data-animation-phase')).toBe('idle');
  });

  it('renders zero burst particles when reduced motion is true', async () => {
    const { useReducedMotion } = await import('framer-motion');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const user = userEvent.setup();
    renderCheckbox({ checked: false, deferAnimation: false });

    await user.click(screen.getByTestId('test-checkbox'));

    // No burst particle spans should appear
    const burst = document.querySelectorAll('.bg-primary.rounded-full.pointer-events-none');
    expect(burst).toHaveLength(0);

    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  it('still fires onToggle when reduced motion is true', async () => {
    const { useReducedMotion } = await import('framer-motion');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderCheckbox({ onToggle, checked: false });

    await user.click(screen.getByTestId('test-checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);

    vi.mocked(useReducedMotion).mockReturnValue(false);
  });
});
