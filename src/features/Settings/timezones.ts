// IANA zone names for the Settings picker.
//
// Modern browsers expose the whole database via Intl.supportedValuesOf, which is
// the honest answer — the backend validates against Go's full tzdata, so a
// hand-picked shortlist would refuse zones the server happily accepts. The list
// below is only a fallback for engines without that API (and for jsdom, where it
// is often absent), chosen to span the populated offsets rather than to be
// exhaustive.
const FALLBACK_TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Asia/Jerusalem',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

// Intl.supportedValuesOf is ES2022 and not in every TS lib target we compile
// against, so it's probed rather than called directly — a missing API must
// degrade to the fallback, never throw at module load.
type IntlWithSupportedValues = {
  supportedValuesOf?: (key: 'timeZone') => string[];
};

const listTimeZones = (): string[] => {
  const intl = Intl as unknown as IntlWithSupportedValues;
  if (typeof intl.supportedValuesOf !== 'function') return FALLBACK_TIMEZONES;
  try {
    const zones = intl.supportedValuesOf('timeZone');
    return zones.length > 0 ? zones : FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
};

export const SUPPORTED_TIMEZONES = listTimeZones();
