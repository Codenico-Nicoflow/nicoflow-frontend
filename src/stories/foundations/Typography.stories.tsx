import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

// Type specimens for the Geist sans + mono stacks (--font-sans / --font-mono).
const SIZES: { name: string; className: string }[] = [
  { name: 'text-xs', className: 'text-xs' },
  { name: 'text-sm', className: 'text-sm' },
  { name: 'text-base', className: 'text-base' },
  { name: 'text-lg', className: 'text-lg' },
  { name: 'text-xl', className: 'text-xl' },
  { name: 'text-2xl', className: 'text-2xl' },
  { name: 'text-3xl', className: 'text-3xl' },
  { name: 'text-4xl', className: 'text-4xl' },
];

const WEIGHTS: { name: string; className: string }[] = [
  { name: 'normal (400)', className: 'font-normal' },
  { name: 'medium (500)', className: 'font-medium' },
  { name: 'semibold (600)', className: 'font-semibold' },
  { name: 'bold (700)', className: 'font-bold' },
];

const Type = () => (
  <div className="max-w-3xl space-y-10 p-6">
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Sizes — Geist Sans</h2>
      <div className="space-y-3">
        {SIZES.map(s => (
          <div key={s.name} className="flex items-baseline gap-4" data-testid={`size-${s.name}`}>
            <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{s.name}</span>
            <span className={`${s.className} text-foreground`}>The quick brown fox</span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Weights</h2>
      <div className="space-y-3">
        {WEIGHTS.map(w => (
          <div key={w.name} className="flex items-baseline gap-4">
            <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">{w.name}</span>
            <span className={`${w.className} text-lg text-foreground`}>The quick brown fox</span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Monospace — Geist Mono</h2>
      <pre className="rounded-lg border border-border bg-muted p-4 font-mono text-sm text-foreground">
        const flow = capture =&gt; process(capture);
      </pre>
    </section>
  </div>
);

const meta: Meta<typeof Type> = {
  title: 'Foundations/Typography',
  component: Type,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Type>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Sizes — Geist Sans')).toBeInTheDocument();
    await expect(canvas.getByTestId('size-text-base')).toBeInTheDocument();
  },
};
