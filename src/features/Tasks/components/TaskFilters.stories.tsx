import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { ScheduleFilter, type TaskEnergy } from '@/lib/types';

import { TASK_FILTER, type TaskFilter } from '../filters';

import TaskFilters from './TaskFilters';

const counts = { all: 12, active: 5, done: 1, cancelled: 1 };

const meta: Meta<typeof TaskFilters> = {
  title: 'Tasks/TaskFilters',
  component: TaskFilters,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  render: () => {
    const Demo = () => {
      const [status, setStatus] = useState<TaskFilter>(TASK_FILTER.ALL);
      const [energy, setEnergy] = useState<TaskEnergy | 'all'>('all');
      const [schedule, setSchedule] = useState<(typeof ScheduleFilter)[keyof typeof ScheduleFilter]>(
        ScheduleFilter.ALL
      );
      return (
        <TaskFilters
          activeFilter={status}
          onFilterChange={setStatus}
          activeEnergy={energy}
          onEnergyChange={setEnergy}
          taskCounts={counts}
          scheduleFilter={schedule}
          onScheduleFilterChange={setSchedule}
        />
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<typeof TaskFilters>;

export const Default: Story = {};
