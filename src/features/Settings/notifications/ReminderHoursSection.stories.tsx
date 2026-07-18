import type { Meta, StoryObj } from '@storybook/react';

import { withStoryProviders } from '@/stories/decorators/withStoryProviders';

import { ReminderHoursSection } from './ReminderHoursSection';

const meta: Meta<typeof ReminderHoursSection> = {
  title: 'Features/Notifications/ReminderHoursSection',
  component: ReminderHoursSection,
  decorators: [withStoryProviders],
  parameters: { layout: 'centered' },
  args: { morningHour: 8, eveningHour: 20, isLoading: false, isSaving: false, onChange: () => {} },
};

export default meta;
type Story = StoryObj<typeof ReminderHoursSection>;

export const Default: Story = {};

export const CustomHours: Story = {
  args: { morningHour: 6, eveningHour: 22 },
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const Saving: Story = {
  args: { isSaving: true },
};
