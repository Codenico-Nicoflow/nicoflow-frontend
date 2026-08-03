import type { Meta, StoryObj } from '@storybook/react';

import type { IGoogleCalendar, IGoogleEvent } from '@/lib/store';
import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import GoogleEventPopover from './GoogleEventPopover';

const event: IGoogleEvent = {
  id: 'evt-1',
  title: 'Design review',
  start: '2026-08-03T09:00:00+03:00',
  end: '2026-08-03T10:30:00+03:00',
  allDay: false,
  calendarId: 'team@example.com',
  htmlLink: 'https://calendar.google.com/evt-1',
};

const calendars: IGoogleCalendar[] = [
  { id: 'team@example.com', summary: 'Team', backgroundColor: '#0b8043', primary: false, selected: true },
];

const meta: Meta<typeof GoogleEventPopover> = {
  title: 'Features/Calendar/GoogleEventPopover',
  component: GoogleEventPopover,
  decorators: [withStoryProviders],
  args: { event, calendars, onClose: () => {} },
};

export default meta;
type Story = StoryObj<typeof GoogleEventPopover>;

/** Only what Google always sends: title, time and source calendar. */
export const Minimal: Story = {};

/** Everything the contract can carry. */
export const FullDetail: Story = {
  args: {
    event: {
      ...event,
      location: 'Meeting room 4, second floor',
      organizer: 'Ada Lovelace',
      attendeeCount: 6,
      responseStatus: 'accepted',
      description:
        'Walk through the overlay redesign, then decide whether the chip lane count is per day or per overlap cluster.',
    },
  },
};

/** Declined but still on the grid — the time really is blocked in Google. */
export const Declined: Story = {
  args: { event: { ...event, attendeeCount: 12, responseStatus: 'declined' } },
};

/** No hour to show, so the range gives way to a plain label. */
export const AllDay: Story = {
  args: { event: { ...event, title: 'Team offsite', allDay: true, start: '2026-08-03', end: '2026-08-05' } },
};

/** The calendar was unshared or deleted: the id stands in for a name. */
export const UnknownCalendar: Story = {
  args: { calendars: [] },
};
