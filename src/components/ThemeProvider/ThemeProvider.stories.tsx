import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { ThemeProvider } from '.';

const meta: Meta<typeof ThemeProvider> = {
  title: 'Components/Providers/ThemeProvider',
  component: ThemeProvider,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof ThemeProvider>;

const ThemedCard = () => (
  <div className="p-6 rounded-lg bg-background border border-border space-y-3 w-72">
    <h3 className="font-semibold text-foreground">Themed Component</h3>
    <p className="text-sm text-muted-foreground">
      This card uses Tailwind CSS variable tokens: background, foreground, border, muted-foreground.
    </p>
    <div className="flex gap-2">
      <span className="px-2 py-0.5 rounded text-xs bg-primary text-primary-foreground">Primary</span>
      <span className="px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">Secondary</span>
      <span className="px-2 py-0.5 rounded text-xs bg-accent text-accent-foreground">Accent</span>
    </div>
  </div>
);

export const LightTheme: Story = {
  parameters: { globals: { theme: 'light' } },
  render: () => <ThemedCard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Themed Component')).toBeInTheDocument();
    await expect(canvas.getByText('Primary')).toBeInTheDocument();
  },
};

export const DarkTheme: Story = {
  parameters: { globals: { theme: 'dark' } },
  render: () => <ThemedCard />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Themed Component')).toBeInTheDocument();
  },
};
