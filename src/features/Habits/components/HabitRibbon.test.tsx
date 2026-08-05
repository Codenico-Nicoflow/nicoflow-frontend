import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeHabitCell } from '@/mocks/handlers';

import { HabitRibbon } from './HabitRibbon';

const cell = (date: string, satisfied: boolean, scheduled = true) => makeHabitCell({ date, satisfied, scheduled });

describe('HabitRibbon', () => {
  it('renders one element per cell', () => {
    renderComponent(
      <HabitRibbon
        cells={[cell('2026-08-01', true), cell('2026-08-02', true), cell('2026-08-03', false)]}
        streakUnit="day"
        currentStreak={2}
      />
    );

    expect(screen.getByTestId('habit-ribbon-cell-2026-08-01')).toBeInTheDocument();
    expect(screen.getByTestId('habit-ribbon-cell-2026-08-03')).toBeInTheDocument();
  });

  // Consecutive satisfied cells belong to one run so they render as a single
  // continuous bar — the shape is the point.
  it('marks consecutive satisfied cells as one run', () => {
    renderComponent(
      <HabitRibbon cells={[cell('2026-08-01', true), cell('2026-08-02', true)]} streakUnit="day" currentStreak={2} />
    );

    expect(screen.getByTestId('habit-ribbon-cell-2026-08-01')).toHaveAttribute('data-kind', 'run');
    expect(screen.getByTestId('habit-ribbon-cell-2026-08-02')).toHaveAttribute('data-kind', 'run');
    expect(screen.getByTestId('habit-ribbon-cell-2026-08-01')).toHaveAttribute('data-segment', '0');
    expect(screen.getByTestId('habit-ribbon-cell-2026-08-02')).toHaveAttribute('data-segment', '0');
  });

  it('cuts the bar at a missed day', () => {
    renderComponent(
      <HabitRibbon
        cells={[cell('2026-08-01', true), cell('2026-08-02', false), cell('2026-08-03', true)]}
        streakUnit="day"
        currentStreak={1}
      />
    );

    expect(screen.getByTestId('habit-ribbon-cell-2026-08-02')).toHaveAttribute('data-kind', 'gap');
    // The run after the gap is a new segment, so the bar visibly breaks.
    expect(screen.getByTestId('habit-ribbon-cell-2026-08-03')).toHaveAttribute('data-segment', '2');
  });

  // The rule the ribbon exists for: a Mon/Wed/Fri habit must read as one
  // continuous bar, not four failures a week.
  it('bridges an unscheduled day without breaking the run', () => {
    renderComponent(
      <HabitRibbon
        cells={[cell('2026-08-03', true), cell('2026-08-04', false, false), cell('2026-08-05', true)]}
        streakUnit="day"
        currentStreak={2}
      />
    );

    const cells = ['2026-08-03', '2026-08-04', '2026-08-05'].map(d => screen.getByTestId(`habit-ribbon-cell-${d}`));

    expect(cells.every(c => c.getAttribute('data-segment') === '0')).toBe(true);
    expect(cells[1]).toHaveAttribute('data-kind', 'run');
  });

  // Thirty tab stops per card is hostile, so the strip is a single labelled
  // image and the label carries what a sighted user reads from the shape.
  it('is one labelled image rather than a set of focusable cells', () => {
    renderComponent(
      <HabitRibbon cells={[cell('2026-08-01', true), cell('2026-08-02', false)]} streakUnit="day" currentStreak={1} />
    );

    const ribbon = screen.getByRole('img');
    expect(ribbon).toHaveAccessibleName(/1 of 2 days completed/);
    expect(ribbon.querySelectorAll('button')).toHaveLength(0);
  });

  it('describes a quota habit in weeks', () => {
    renderComponent(<HabitRibbon cells={[cell('2026-08-03', true)]} streakUnit="week" currentStreak={1} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(/weeks completed/);
  });

  it('renders nothing without history', () => {
    renderComponent(<HabitRibbon cells={[]} streakUnit="day" currentStreak={0} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
