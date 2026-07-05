import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import type { TaskEnergy } from '@/lib/types';

import TaskFilters from './TaskFilters';

const counts = { all: 12, inbox: 3, active: 5, someday: 2, done: 1, cancelled: 1 };

const meta: Meta<typeof TaskFilters> = {
  title: 'Tasks/TaskFilters',
  component: TaskFilters,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  render: () => {
    const Demo = () => {
      const [status, setStatus] = useState('all');
      const [energy, setEnergy] = useState<TaskEnergy | 'all'>('all');
      return (
        <TaskFilters
          activeFilter={status}
          onFilterChange={setStatus}
          activeEnergy={energy}
          onEnergyChange={setEnergy}
          taskCounts={counts}
        />
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<typeof TaskFilters>;

export const Default: Story = {};
