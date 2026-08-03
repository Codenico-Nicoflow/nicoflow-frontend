import type { IGoogleEvent } from '@/lib/store';

import { eventHitAreas, MAX_WASH_DEPTH, washBands } from '../googleWash';

interface WashProps {
  events: IGoogleEvent[];
  dayKey: string;
}

interface HitTargetProps extends WashProps {
  onSelect: (event: IGoogleEvent) => void;
}

/**
 * Tinted bands showing where Google says the day is booked (NIC-1863).
 *
 * Absolutely positioned and full-width inside the day column, sitting BEHIND
 * task blocks. It participates in no layout, so it cannot move a task block —
 * this is what guarantees a late-arriving events response never reflows the
 * user's own work.
 *
 * The band itself is inert (`pointer-events-none`); a separate transparent hit
 * target per event handles clicks. Making the band clickable would put a
 * full-width control underneath every task block and swallow drags meant for
 * the grid.
 */
const GoogleWashLayer = ({ events, dayKey }: WashProps) => {
  const bands = washBands(events, dayKey);
  if (bands.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden data-testid={`google-wash-${dayKey}`}>
      {bands.map(band => (
        <div
          key={band.key}
          className="absolute inset-x-0 bg-primary"
          style={{
            top: `${band.top}px`,
            height: `${band.height}px`,
            // Overlapping meetings deepen the tint instead of splitting width.
            // Capped so a heavily double-booked hour stays a background, not a
            // slab that swallows the task text above it.
            opacity: 0.06 + 0.05 * Math.min(band.depth, MAX_WASH_DEPTH),
          }}
          data-testid={`google-wash-band-${dayKey}`}
          data-depth={band.depth}
        />
      ))}
    </div>
  );
};

/**
 * Transparent, keyboard-reachable hit targets for the wash.
 *
 * Rendered as a sibling of the wash rather than inside it so the visual band
 * can stay `aria-hidden` while the events remain operable — a screen reader
 * gets one button per meeting instead of a decorative rectangle.
 */
export const GoogleEventHitTargets = ({ events, dayKey, onSelect }: HitTargetProps) => {
  const placed = eventHitAreas(events, dayKey);
  if (placed.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0" data-testid={`google-hits-${dayKey}`}>
      {placed.map(({ event, top, height }) => (
        <button
          key={`hit-${event.id}-${dayKey}`}
          type="button"
          onClick={() => onSelect(event)}
          aria-label={event.title}
          className="absolute inset-x-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ top: `${top}px`, height: `${height}px` }}
          data-testid={`google-event-hit-${event.id}`}
        />
      ))}
    </div>
  );
};

export default GoogleWashLayer;
