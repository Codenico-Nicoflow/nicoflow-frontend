import type { ITask } from '@/lib/types';
import { TaskStatus } from '@/lib/types';

import { DEFAULT_BLOCK_MINUTES, HOUR_HEIGHT_PX, MIN_BLOCK_MINUTES, MINUTES_PER_DAY } from './data';
import { toDayKey, wallClockIn } from './utils';

/** A timed task placed on the grid, in pixels from the top of the day column. */
export interface BlockGeometry {
  top: number;
  height: number;
  /** True when the task carries no estimate and the height is a rendered default. */
  isUnestimated: boolean;
}

/** Horizontal share of a column for a task that overlaps others. */
export interface BlockLayout extends BlockGeometry {
  task: ITask;
  /** 0-based slot among the overlapping tasks. */
  column: number;
  /** How many slots the widest overlap in this cluster needs. */
  columns: number;
}

/**
 * Minutes from midnight for an "HH:MM" time, or null when absent/malformed.
 * Malformed input yields null rather than throwing: a bad value from the wire
 * should drop the task into the all-day rail, never blank the whole grid.
 */
export const parseMinutes = (time?: string | null): number | null => {
  if (!time) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

/**
 * Geometry for one timed task.
 *
 * The 30-minute default for an unestimated task is RENDERED, never stored — the
 * grid must not write `estimatedMinutes` just to draw a box. The caller gets
 * `isUnestimated` so it can style the block as an open-ended intention instead
 * of implying a duration the user never set.
 *
 * Height is clamped twice: up to a tappable minimum, and down so a block can
 * never run past midnight (the backend clamps the stored value the same way).
 */
export const blockGeometry = (task: ITask, hourHeight: number = HOUR_HEIGHT_PX): BlockGeometry | null => {
  const start = parseMinutes(task.scheduledTime);
  if (start === null) return null;

  const isUnestimated = task.estimatedMinutes == null;
  // A task with no estimate is drawn as half an hour. RENDERED, never stored —
  // the grid must not write `estimatedMinutes` just to draw a box — and the
  // caller gets `isUnestimated` so it can style it as an open-ended intention
  // rather than implying a duration the user never set.
  const minutes = isUnestimated ? DEFAULT_BLOCK_MINUTES : task.estimatedMinutes!;
  const clamped = Math.min(minutes, MINUTES_PER_DAY - start);

  return {
    top: (start / 60) * hourHeight,
    // The floor is expressed in MINUTES, not pixels, so it means the same thing
    // at every row height. A fixed px floor made a 15-minute block and a
    // 30-minute block render identically at 48px/hour — the grid stating a
    // duration it was not drawing.
    height: Math.max((clamped / 60) * hourHeight, (MIN_BLOCK_MINUTES / 60) * hourHeight),
    isUnestimated,
  };
};

/** End minute used for overlap maths — the drawn extent, not the stored one. */
const endMinutes = (task: ITask): number => {
  const start = parseMinutes(task.scheduledTime) ?? 0;
  const minutes = task.estimatedMinutes ?? DEFAULT_BLOCK_MINUTES;
  return Math.min(start + minutes, MINUTES_PER_DAY);
};

/**
 * Lay out a day's timed tasks, splitting column width across tasks that
 * overlap in time.
 *
 * Two tasks at the same hour is a genuine planning conflict, so the grid
 * surfaces it by showing both side by side rather than hiding one. Tasks are
 * clustered by transitive overlap: every task in a cluster shares the same
 * column count, so the columns line up instead of each block picking its own
 * width.
 */
export const layoutDay = (
  tasks: ITask[],
  hourHeight: number = HOUR_HEIGHT_PX,
  eventSpans: readonly [number, number][] = []
): BlockLayout[] => {
  const timed = tasks
    .filter(task => parseMinutes(task.scheduledTime) !== null)
    .sort((a, b) => {
      const byStart = parseMinutes(a.scheduledTime)! - parseMinutes(b.scheduledTime)!;
      return byStart !== 0 ? byStart : a.displayOrder - b.displayOrder;
    });

  const out: BlockLayout[] = [];
  let cluster: BlockLayout[] = [];
  let clusterEnd = -1;

  const flush = () => {
    // Every block in a cluster is drawn against the same divisor, so a 2-wide
    // overlap doesn't make an unrelated neighbour half-width.
    const taskColumns = cluster.reduce((max, block) => Math.max(max, block.column + 1), 1);
    // Google events sharing these minutes widen the divisor so the task stops
    // BEFORE the chip's lane instead of painting over it. Tasks keep the leading
    // columns — the user's own work is never the thing that yields — and
    // `eventChips` reserves exactly the same count from the other side, so the
    // two layers agree on one grid without either laying the other out.
    const from = Math.min(...cluster.map(block => (block.top / hourHeight) * 60));
    const to = Math.max(...cluster.map(block => ((block.top + block.height) / hourHeight) * 60));
    const columns = taskColumns + spanColumnsIn(eventSpans, from, to);

    cluster.forEach(block => out.push({ ...block, columns }));
    cluster = [];
    clusterEnd = -1;
  };

  timed.forEach(task => {
    const geometry = blockGeometry(task, hourHeight);
    if (!geometry) return;
    const start = parseMinutes(task.scheduledTime)!;

    if (start >= clusterEnd && cluster.length > 0) flush();

    // First free slot: reuse a column whose occupant has already ended.
    const taken = new Set(cluster.filter(block => endMinutes(block.task) > start).map(block => block.column));
    let column = 0;
    while (taken.has(column)) column += 1;

    cluster.push({ ...geometry, task, column, columns: 1 });
    clusterEnd = Math.max(clusterEnd, endMinutes(task));
  });

  if (cluster.length > 0) flush();
  return out;
};

/**
 * Widest stack of spans anywhere inside [from, to) — the number of columns the
 * tasks in that window must leave for the Google chips.
 *
 * The maximum over the window rather than a total count: three events spread
 * across an hour occupy one column between them, and charging the tasks three
 * would shrink them for a conflict that never existed.
 */
const spanColumnsIn = (spans: readonly [number, number][], from: number, to: number): number => {
  const overlapping = spans.filter(([start, end]) => start < to && end > from);
  if (overlapping.length === 0) return 0;

  return Math.max(...overlapping.map(([at]) => overlapping.filter(([start, end]) => start <= at && end > at).length));
};

/**
 * Tasks with no usable time — rendered in the all-day rail above the grid.
 *
 * Open work sorts ahead of completed work: the rail is capped, and a day whose
 * finished tasks pushed the open ones out of view would hide exactly what the
 * user still has to do.
 */
export const allDayTasks = (tasks: ITask[]): ITask[] =>
  tasks
    .filter(task => parseMinutes(task.scheduledTime) === null)
    .sort((a, b) => {
      const byDone = Number(a.status === TaskStatus.DONE) - Number(b.status === TaskStatus.DONE);
      return byDone !== 0 ? byDone : a.displayOrder - b.displayOrder;
    });

/**
 * Offset of the now-line. Returns null when `now` is not inside the rendered
 * day, so a week view draws the line only on today's column.
 *
 * Both the day match and the height are read in the account zone, because that
 * is the zone every `scheduledFor` and every block on this grid is keyed to. A
 * traveller reading browser-local time would get the line drawn hours away from
 * the blocks it is supposed to sit among.
 */
export const nowOffset = (
  now: Date,
  day: Date,
  timezone?: string,
  hourHeight: number = HOUR_HEIGHT_PX
): number | null => {
  const wall = wallClockIn(timezone, now);
  if (wall.dayKey !== toDayKey(day)) return null;
  return ((wall.hours * 60 + wall.minutes) / 60) * hourHeight;
};
