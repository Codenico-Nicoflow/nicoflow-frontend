import type { Meta, StoryObj } from '@storybook/react';
import { ChevronsUpDown } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';

import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [Story => <div className="w-72">{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Subtasks</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Toggle">
            <ChevronsUpDown />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-1 text-sm text-muted-foreground">
        <p>Draft outline</p>
        <p>Review with team</p>
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle' }));
    await expect(canvas.getByText('Draft outline')).toBeInTheDocument();
  },
};
