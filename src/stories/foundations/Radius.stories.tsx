import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

// Radius scale from src/index.css @theme (--radius-sm … --radius-xl).
const RADII: { name: string; varName: string; px: string }[] = [
  { name: 'sm', varName: '--radius-sm', px: '6px' },
  { name: 'md', varName: '--radius-md', px: '10px' },
  { name: 'lg', varName: '--radius-lg', px: '14px' },
  { name: 'xl', varName: '--radius-xl', px: '20px' },
  { name: 'full', varName: '--radius-full', px: '9999px' },
];

const Radii = () => (
  <div className="flex max-w-3xl flex-wrap gap-6 p-6">
    {RADII.map(r => (
      <div key={r.name} className="flex flex-col items-center gap-2" data-testid={`radius-${r.name}`}>
        <span className="h-20 w-20 border border-border bg-primary/15" style={{ borderRadius: `var(${r.varName})` }} />
        <p className="font-mono text-sm text-foreground">{r.name}</p>
        <p className="text-xs text-muted-foreground">{r.px}</p>
      </div>
    ))}
  </div>
);

const meta: Meta<typeof Radii> = {
  title: 'Foundations/Radius',
  component: Radii,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Radii>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('radius-md')).toBeInTheDocument();
    await expect(canvas.getByTestId('radius-full')).toBeInTheDocument();
  },
};
