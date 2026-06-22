import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

// Tailwind 4 spacing scale (4px base). Shown as reference bars; the project
// uses these via gap-*/p-*/m-* utilities rather than custom tokens.
const STEPS: { step: string; rem: string; px: string }[] = [
  { step: '1', rem: '0.25rem', px: '4px' },
  { step: '2', rem: '0.5rem', px: '8px' },
  { step: '3', rem: '0.75rem', px: '12px' },
  { step: '4', rem: '1rem', px: '16px' },
  { step: '6', rem: '1.5rem', px: '24px' },
  { step: '8', rem: '2rem', px: '32px' },
  { step: '12', rem: '3rem', px: '48px' },
  { step: '16', rem: '4rem', px: '64px' },
];

const Spacing = () => (
  <div className="max-w-3xl space-y-3 p-6">
    {STEPS.map(s => (
      <div key={s.step} className="flex items-center gap-4" data-testid={`space-${s.step}`}>
        <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">{s.step}</span>
        <span className="h-4 rounded bg-primary" style={{ width: s.rem }} />
        <span className="font-mono text-xs text-muted-foreground">
          {s.rem} · {s.px}
        </span>
      </div>
    ))}
  </div>
);

const meta: Meta<typeof Spacing> = {
  title: 'Foundations/Spacing',
  component: Spacing,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Spacing>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('space-4')).toBeInTheDocument();
  },
};
