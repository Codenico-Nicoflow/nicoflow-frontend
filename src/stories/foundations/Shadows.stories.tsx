import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

// Elevation scale from src/index.css @theme (--shadow-sm/md/lg, slate-tinted).
const SHADOWS: { name: string; varName: string }[] = [
  { name: 'sm', varName: '--shadow-sm' },
  { name: 'md', varName: '--shadow-md' },
  { name: 'lg', varName: '--shadow-lg' },
];

const Shadows = () => (
  <div className="flex max-w-3xl flex-wrap gap-10 p-10">
    {SHADOWS.map(s => (
      <div key={s.name} className="flex flex-col items-center gap-3" data-testid={`shadow-${s.name}`}>
        <span className="h-24 w-24 rounded-lg bg-card" style={{ boxShadow: `var(${s.varName})` }} />
        <p className="font-mono text-sm text-foreground">shadow-{s.name}</p>
      </div>
    ))}
  </div>
);

const meta: Meta<typeof Shadows> = {
  title: 'Foundations/Shadows',
  component: Shadows,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Shadows>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('shadow-md')).toBeInTheDocument();
  },
};
