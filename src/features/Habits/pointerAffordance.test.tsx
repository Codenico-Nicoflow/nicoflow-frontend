import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { makeHabit, makeHabitCell } from '@/mocks/handlers';

import { HabitCard } from './components/HabitCard';
import { HabitRibbonInteractive } from './components/HabitRibbonInteractive';

// Anything clickable has to LOOK clickable. The shared <Button> carries
// cursor-pointer already, so the gap is always the raw <button> elements this
// feature uses for its custom controls — the ring, the ribbon cells, the card's
// open-detail target. Those are exactly the ones that get forgotten, so they
// are asserted rather than eyeballed.
//
// Keyboard reachability is checked alongside it: a control that a mouse can hit
// and a keyboard cannot is the same omission wearing a different hat.
const isPointer = (el: HTMLElement) => el.className.includes('cursor-pointer');

describe('clickable habit controls look and behave clickable', () => {
  it('gives the check-in ring a pointer cursor', () => {
    renderComponent(<HabitCard habit={makeHabit()} />);

    expect(isPointer(screen.getByTestId('habit-ring-habit-1'))).toBe(true);
  });

  it('gives the card’s open-detail target a pointer cursor', () => {
    renderComponent(<HabitCard habit={makeHabit()} />);

    expect(isPointer(screen.getByTestId('habit-open-habit-1'))).toBe(true);
  });

  it('keeps the open-detail target reachable by keyboard', () => {
    renderComponent(<HabitCard habit={makeHabit()} />);

    // A real <button>, so it is in the tab order without a tabindex of its own.
    expect(screen.getByTestId('habit-open-habit-1').tagName).toBe('BUTTON');
  });

  it('gives editable ribbon cells a pointer cursor', () => {
    renderComponent(
      <HabitRibbonInteractive
        cells={[makeHabitCell({ date: '2026-08-04' })]}
        streakUnit="day"
        currentStreak={0}
        editableDates={new Set(['2026-08-04'])}
        onToggleDay={() => {}}
      />
    );

    expect(isPointer(screen.getByTestId('habit-cell-2026-08-04'))).toBe(true);
  });

  // A disabled control must NOT invite a click it will ignore.
  it('shows a not-allowed cursor on a ring that cannot be tapped', () => {
    renderComponent(<HabitCard habit={makeHabit({ dueToday: false, completedToday: false })} />);

    const ring = screen.getByTestId('habit-ring-habit-1');
    expect(ring).toBeDisabled();
    expect(ring.className).toContain('cursor-not-allowed');
  });

  // Read-only history is not a control, so it should not look like one.
  it('leaves non-editable ribbon cells without a pointer cursor', () => {
    renderComponent(
      <HabitRibbonInteractive
        cells={[makeHabitCell({ date: '2026-07-01' })]}
        streakUnit="day"
        currentStreak={0}
        editableDates={new Set()}
        onToggleDay={() => {}}
      />
    );

    expect(isPointer(screen.getByTestId('habit-cell-2026-07-01'))).toBe(false);
  });
});
