import { renderComponent } from '__tests__/renderComponent';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { IGoogleEvent } from '@/lib/store';
import type { ITask } from '@/lib/types';
import { TaskPriority, TaskStatus } from '@/lib/types';

import HourGrid from './components/HourGrid';

const DAY = '2026-08-03';
const NOW = new Date('2026-08-03T09:00:00Z');

const task = (id: string, scheduledTime: string, estimatedMinutes: number | null = 60): ITask =>
  ({
    id,
    projectId: 'p1',
    title: id,
    status: TaskStatus.ACTIVE,
    priority: TaskPriority.MEDIUM,
    scheduledFor: DAY,
    scheduledTime,
    estimatedMinutes,
    displayOrder: 0,
    subtaskCount: 0,
    openSubtaskCount: 0,
    totalFocusSeconds: 0,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  }) as unknown as ITask;

const event = (id: string, from: string, to: string): IGoogleEvent => ({
  id,
  title: `Meeting ${id}`,
  start: `${DAY}T${from}:00+03:00`,
  end: `${DAY}T${to}:00+03:00`,
  allDay: false,
  calendarId: 'primary',
  htmlLink: `https://calendar.google.com/${id}`,
});

const allDayEvent = (id: string, title: string): IGoogleEvent => ({
  id,
  title,
  start: DAY,
  end: '2026-08-04',
  allDay: true,
  calendarId: 'holidays',
  htmlLink: '',
});

const renderGrid = (googleEvents: IGoogleEvent[], tasks: ITask[] = [], onSelectGoogleEvent = vi.fn()) =>
  renderComponent(
    <HourGrid
      days={[new Date(`${DAY}T00:00:00`)]}
      tasksByDay={new Map([[DAY, tasks]])}
      now={NOW}
      todayKey={DAY}
      onSelect={vi.fn()}
      googleEvents={googleEvents}
      onSelectGoogleEvent={onSelectGoogleEvent}
    />
  );

/** Inline geometry of a task block wrapper, which is what a reflow would move. */
const blockBox = (id: string) => {
  const element = screen.getByTestId(`calendar-block-wrapper-${id}`);
  const { top, height, insetInlineStart, width } = element.style;
  return { top, height, insetInlineStart, width };
};

describe('Google event overlay', () => {
  it('renders a chip behind the grid for each timed event', () => {
    renderGrid([event('a', '09:00', '10:00')]);

    expect(screen.getByTestId(`google-chips-${DAY}`)).toBeInTheDocument();
    expect(screen.getByTestId('google-event-chip-a')).toBeInTheDocument();
  });

  it('renders no overlay when there are no events', () => {
    renderGrid([]);

    expect(screen.queryByTestId(`google-chips-${DAY}`)).not.toBeInTheDocument();
  });

  /**
   * The load-bearing guarantee of this feature: the overlay participates in no
   * layout, so events arriving late can never move the user's own work.
   */
  it('does not change task block position or width when events are present', () => {
    const tasks = [task('t1', '09:00'), task('t2', '11:00')];

    const withoutEvents = renderGrid([], tasks);
    const before = { t1: blockBox('t1'), t2: blockBox('t2') };
    withoutEvents.unmount();

    renderGrid([event('a', '09:00', '10:00'), event('b', '09:30', '12:00')], tasks);
    const after = { t1: blockBox('t1'), t2: blockBox('t2') };

    expect(after).toEqual(before);
  });

  /**
   * jsdom computes no real layout, so the assertion above cannot catch a layer
   * that takes up space. This pins the mechanism instead: the chip layer must be
   * absolutely positioned and out of flow, which is what makes "no reflow"
   * structural rather than incidental.
   */
  it('keeps the chip layer out of document flow', () => {
    renderGrid([event('a', '09:00', '10:00')], [task('t1', '09:00')]);

    expect(screen.getByTestId(`google-chips-${DAY}`).className).toContain('absolute');
  });

  it('paints chips beneath task blocks, never above them', () => {
    renderGrid([event('a', '09:00', '10:00')], [task('t1', '09:00')]);

    const chips = screen.getByTestId(`google-chips-${DAY}`);
    const block = screen.getByTestId('calendar-block-wrapper-t1');

    // The chip layer sits at z-0; a task block must never be painted behind it.
    expect(chips.className).toContain('z-0');
    expect(block.className).not.toContain('-z-');
    // DOM order is the tiebreaker at equal z-index — the chips come first.
    expect(chips.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps full column width for tasks that overlap an event', () => {
    renderGrid([event('a', '09:00', '10:00')], [task('t1', '09:00')]);

    // A single task owns the whole column — the event does not take a share.
    expect(blockBox('t1').width).toBe('100%');
  });

  // Events size themselves the way task blocks do: full column alone, split
  // only against each other.
  it('gives a lone event the full column width', () => {
    renderGrid([event('a', '09:00', '10:00')]);

    expect(screen.getByTestId('google-event-chip-a').style.width).toBe('100%');
  });

  it('splits width between events that overlap', () => {
    renderGrid([event('a', '09:00', '11:00'), event('b', '10:00', '12:00')]);

    expect(screen.getByTestId('google-event-chip-a').style.width).toBe('50%');
    expect(screen.getByTestId('google-event-chip-b').style.width).toBe('50%');
  });

  // The event gives up the width, never the task. Drawn at full width it would
  // sit under the block and read as a stray sliver.
  it('narrows an event beside the task it overlaps, leaving the task full width', () => {
    renderGrid([event('a', '09:00', '10:00')], [task('t1', '09:00')]);

    expect(screen.getByTestId('google-event-chip-a').style.width).toBe('50%');
    expect(blockBox('t1').width).toBe('100%');
  });

  it('shows an event count in the day header', () => {
    renderGrid([event('a', '09:00', '10:00'), event('b', '11:00', '12:00')]);

    expect(screen.getByTestId(`calendar-google-count-${DAY}`)).toHaveTextContent('2');
  });

  it('marks a task overlapping an event with a conflict accent', () => {
    renderGrid([event('a', '09:00', '10:00')], [task('t1', '09:30')]);

    expect(screen.getByTestId('calendar-block-t1')).toHaveAttribute('data-conflict', 'true');
  });

  it('does not mark a back-to-back task as conflicting', () => {
    renderGrid([event('a', '09:00', '10:00')], [task('t1', '10:00')]);

    expect(screen.getByTestId('calendar-block-t1')).not.toHaveAttribute('data-conflict');
  });

  it('opens the event that was clicked', async () => {
    const onSelectGoogleEvent = vi.fn();
    renderGrid([event('a', '09:00', '10:00')], [], onSelectGoogleEvent);

    await userEvent.click(screen.getByTestId('google-event-chip-a'));

    expect(onSelectGoogleEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('exposes each event as a labelled control', () => {
    renderGrid([event('a', '09:00', '10:00')]);

    expect(screen.getByRole('button', { name: /Meeting a/ })).toBeInTheDocument();
  });

  // The whole point of the redesign: a band said an hour was busy but not with
  // what, so identifying any meeting cost a click.
  it('names the event on the grid without needing a click', () => {
    renderGrid([event('a', '09:00', '10:00')]);

    const chip = screen.getByTestId('google-event-chip-a');
    expect(chip).toHaveTextContent('Meeting a');
    expect(chip).toHaveTextContent('09:00');
  });

  it('de-emphasises an event the user declined', () => {
    renderGrid([{ ...event('a', '09:00', '10:00'), responseStatus: 'declined' as const }]);

    expect(screen.getByTestId('google-event-chip-a')).toHaveAttribute('data-declined', 'true');
  });

  describe('all-day rail', () => {
    it('places all-day Google events in the rail', () => {
      renderGrid([allDayEvent('h1', 'Independence Day')]);

      expect(screen.getByTestId('calendar-allday-google-h1')).toHaveTextContent('Independence Day');
    });

    it('collapses past the row cap behind a "more" control', () => {
      renderGrid([allDayEvent('h1', 'One'), allDayEvent('h2', 'Two'), allDayEvent('h3', 'Three')]);

      expect(screen.getByTestId('calendar-all-day-expand')).toBeInTheDocument();
    });

    it('reveals the remainder when expanded', async () => {
      renderGrid([allDayEvent('h1', 'One'), allDayEvent('h2', 'Two'), allDayEvent('h3', 'Three')]);

      await userEvent.click(screen.getByTestId('calendar-all-day-expand'));

      expect(screen.getByTestId('calendar-allday-google-h3')).toBeInTheDocument();
    });
  });
});
