import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [Story => <div className="w-80">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="active">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="done">Done</TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="pt-3 text-sm text-foreground">
        3 active tasks
      </TabsContent>
      <TabsContent value="done" className="pt-3 text-sm text-muted-foreground">
        12 completed tasks
      </TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('3 active tasks')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('tab', { name: 'Done' }));
    await expect(canvas.getByText('12 completed tasks')).toBeInTheDocument();
  },
};
