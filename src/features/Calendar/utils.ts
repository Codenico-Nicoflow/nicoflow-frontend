import { addDays, endOfWeek, format, parseISO, startOfWeek } from 'date-fns';

import type { ITask } from '@/lib/types';

import { CALENDAR_VIEWS, type CalendarView, DEFAULT_VIEW } from './data';

/** The wire/URL date format, shared with `scheduledFor`. */
export const DAY_KEY = 'yyyy-MM-dd';

export const toDayKey = (date: Date): string => format(date, DAY_KEY);

/**
 * Parse a `?date=` param. Falls back to `fallback` for anything unparseable so
 * a hand-edited URL degrades to today instead of rendering an Invalid Date.
 */
export const parseDayParam = (value: string | null, fallback: Date): Date => {
  if (!value) return fallback;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
};

export const parseViewParam = (value: string | null): CalendarView =>
  CALENDAR_VIEWS.includes(value as CalendarView) ? (value as CalendarView) : DEFAULT_VIEW;

/**
 * Inclusive day span the given view covers. Week starts Monday to match the
 * product's week semantics.
 */
export const visibleDays = (view: CalendarView, anchor: Date): Date[] => {
  if (view === 'day') return [anchor];
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, offset) => addDays(start, offset));
};

/** Inclusive range to request for a view — exactly what the grid will draw. */
export const rangeFor = (view: CalendarView, anchor: Date): { scheduledFrom: string; scheduledTo: string } => {
  if (view === 'day') {
    const key = toDayKey(anchor);
    return { scheduledFrom: key, scheduledTo: key };
  }
  return {
    scheduledFrom: toDayKey(startOfWeek(anchor, { weekStartsOn: 1 })),
    scheduledTo: toDayKey(endOfWeek(anchor, { weekStartsOn: 1 })),
  };
};

/** Step one view-length forward (+1) or back (-1). */
export const shiftAnchor = (view: CalendarView, anchor: Date, direction: 1 | -1): Date =>
  addDays(anchor, direction * (view === 'day' ? 1 : 7));

/**
 * Bucket a flat range response by day key. The API already returns the window
 * ordered (scheduledFor, scheduledTime NULLS FIRST, displayOrder), so grouping
 * preserves that order and the grid needs no second sort.
 */
export const groupByDayKey = (tasks: ITask[]): Map<string, ITask[]> => {
  const map = new Map<string, ITask[]>();
  tasks.forEach(task => {
    if (!task.scheduledFor) return;
    const bucket = map.get(task.scheduledFor);
    if (bucket) bucket.push(task);
    else map.set(task.scheduledFor, [task]);
  });
  return map;
};
