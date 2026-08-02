/**
 * Timezone drift between the account zone and the browser zone.
 *
 * `users.timezone` is authoritative: a bare `09:00` means 9am to that user, and
 * every reminder sweep is keyed to it. When the browser disagrees, the grid
 * would draw a task at a time that differs from when its reminder fires — so
 * the mismatch is surfaced and never silently applied. Auto-adopting the
 * browser zone because someone opened a laptop abroad would shift every
 * reminder they have.
 *
 * Framework-agnostic and Intl-injectable so it survives the E-033 shared
 * package extraction and can be tested without stubbing globals.
 */

export interface TimezoneDrift {
  /** The authoritative zone from `users.timezone`. */
  accountZone: string;
  /** The zone the browser reports right now. */
  browserZone: string;
}

/**
 * Wall-clock offset of a zone at a given instant, in minutes east of UTC.
 *
 * Derived by formatting the instant in the zone and reading it back as UTC —
 * the difference is the offset. Uses `en-CA` for a `YYYY-MM-DD` date so the
 * parts reassemble without locale guesswork. Returns null for a zone Intl
 * rejects, which the caller treats as "cannot compare".
 */
export const zoneOffsetMinutes = (timezone: string, at: Date): number | null => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(at);

    const read = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find(part => part.type === type)?.value);

    // Intl renders midnight as hour 24 on some engines; 24:00 is 00:00 the same day.
    const hour = read('hour') % 24;
    const asUtc = Date.UTC(read('year'), read('month') - 1, read('day'), hour, read('minute'), read('second'));
    if (Number.isNaN(asUtc)) return null;

    // Second-resolution on both sides, so the subtraction can't inherit the
    // instant's milliseconds and land a whole minute off.
    return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
  } catch {
    return null;
  }
};

/**
 * The drift worth prompting about, or null when there is nothing to say.
 *
 * Zones are compared by their *current offset*, not by name. `Europe/Berlin`
 * and `Europe/Paris` are different strings that show the identical wall clock,
 * and nagging someone to "fix" a zone that changes no time they can see is
 * noise that trains them to dismiss the banner reflexively.
 *
 * Returns null when either zone is missing or unresolvable — an account with no
 * stored zone has nothing to drift from, and a zone Intl refuses is a bug to
 * fall back on, not one to prompt about.
 */
export const detectTimezoneDrift = (
  accountZone: string | undefined | null,
  browserZone: string | undefined | null,
  at: Date
): TimezoneDrift | null => {
  if (!accountZone || !browserZone || accountZone === browserZone) return null;

  const accountOffset = zoneOffsetMinutes(accountZone, at);
  const browserOffset = zoneOffsetMinutes(browserZone, at);
  if (accountOffset === null || browserOffset === null) return null;
  if (accountOffset === browserOffset) return null;

  return { accountZone, browserZone };
};

/** `UTC+05:30` style label for a zone, or null when the zone is unresolvable. */
export const formatZoneOffset = (timezone: string, at: Date): string | null => {
  const offset = zoneOffsetMinutes(timezone, at);
  if (offset === null) return null;

  const sign = offset < 0 ? '-' : '+';
  const absolute = Math.abs(offset);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
};
