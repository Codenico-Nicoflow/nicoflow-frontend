import type { IGoogleEvent } from '@/lib/store';

import { MAX_WASH_DEPTH, washBands } from '../googleWash';

interface WashProps {
  events: IGoogleEvent[];
  dayKey: string;
}

/**
 * Tinted bands showing where Google says the day is booked (NIC-1863).
 *
 * Absolutely positioned and full-width inside the day column, sitting BEHIND
 * task blocks. It participates in no layout, so it cannot move a task block —
 * this is what guarantees a late-arriving events response never reflows the
 * user's own work.
 *
 * Kept alongside the labelled chips (NIC-1881) rather than replaced by them: the
 * chips occupy an inset strip, so the band is what still carries "this hour is
 * spoken for" across the full width a task block sits on. It stays inert
 * (`pointer-events-none`) — clicking is the chip's job, and a full-width control
 * under every task block would swallow drags meant for the grid.
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

export default GoogleWashLayer;
