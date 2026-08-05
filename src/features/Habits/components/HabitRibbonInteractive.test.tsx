import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { makeHabitCell } from '@/mocks/handlers';

import { HabitRibbonInteractive } from './HabitRibbonInteractive';

const cells = [
  makeHabitCell({ date: '2026-08-01', satisfied: true }),
  makeHabitCell({ date: '2026-08-02', satisfied: false }),
  makeHabitCell({ date: '2026-08-03', satisfied: true }),
];

const editable = new Set(['2026-08-02', '2026-08-03']);

const render = (onToggleDay = vi.fn()) => {
  renderComponent(
    <HabitRibbonInteractive
      cells={cells}
      streakUnit="day"
      currentStreak={1}
      editableDates={editable}
      onToggleDay={onToggleDay}
    />
  );
  return onToggleDay;
};

describe('HabitRibbonInteractive', () => {
  it('makes editable days buttons and the rest inert', () => {
    render();

    expect(screen.getByTestId('habit-cell-2026-08-02').tagName).toBe('BUTTON');
    expect(screen.getByTestId('habit-cell-2026-08-03').tagName).toBe('BUTTON');
    // Outside the window: drawn, because the history is the point, but not a
    // control.
    expect(screen.getByTestId('habit-cell-2026-08-01').tagName).toBe('SPAN');
  });

  it('reports the day that was toggled', async () => {
    const user = userEvent.setup();
    const onToggle = render();

    await user.click(screen.getByTestId('habit-cell-2026-08-02'));

    expect(onToggle).toHaveBeenCalledWith('2026-08-02');
  });

  it('states each day’s status in its label', () => {
    render();

    expect(screen.getByTestId('habit-cell-2026-08-03')).toHaveAccessibleName(/done/i);
    expect(screen.getByTestId('habit-cell-2026-08-02')).toHaveAccessibleName(/not done/i);
    expect(screen.getByTestId('habit-cell-2026-08-03')).toHaveAttribute('aria-pressed', 'true');
  });

  // The whole reason the card's ribbon stays role="img": thirty tab stops per
  // habit is hostile. Here one ribbon is one stop, and arrows move within it.
  it('is a single tab stop with arrow-key movement inside', async () => {
    const user = userEvent.setup();
    render();

    // Only the roving cell is tabbable.
    expect(screen.getByTestId('habit-cell-2026-08-03')).toHaveAttribute('tabindex', '0');
    expect(screen.getByTestId('habit-cell-2026-08-02')).toHaveAttribute('tabindex', '-1');

    await user.tab();
    expect(screen.getByTestId('habit-cell-2026-08-03')).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByTestId('habit-cell-2026-08-02')).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByTestId('habit-cell-2026-08-03')).toHaveFocus();
  });

  it('does not move focus past the ends', async () => {
    const user = userEvent.setup();
    render();

    await user.tab();
    await user.keyboard('{ArrowRight}');

    // Already on the last editable cell; it stays put rather than wrapping.
    expect(screen.getByTestId('habit-cell-2026-08-03')).toHaveFocus();
  });

  it('describes the whole strip for a screen reader', () => {
    render();

    expect(screen.getByRole('group')).toHaveAccessibleName(/2 of 3 days completed/);
  });

  it('disables every control while a write is in flight', () => {
    renderComponent(
      <HabitRibbonInteractive
        cells={cells}
        streakUnit="day"
        currentStreak={1}
        editableDates={editable}
        onToggleDay={vi.fn()}
        isBusy
      />
    );

    expect(screen.getByTestId('habit-cell-2026-08-02')).toBeDisabled();
  });

  it('renders nothing without history', () => {
    renderComponent(
      <HabitRibbonInteractive
        cells={[]}
        streakUnit="day"
        currentStreak={0}
        editableDates={new Set()}
        onToggleDay={vi.fn()}
      />
    );

    expect(screen.queryByTestId('habit-ribbon-interactive')).not.toBeInTheDocument();
  });
});
