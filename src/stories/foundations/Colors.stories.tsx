import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

// Foundations docs: render swatches off the live CSS variables (src/index.css)
// so the Storybook theme toolbar reflows light/dark automatically.
const TOKENS: { name: string; varName: string; description: string }[] = [
  { name: 'background', varName: '--color-background', description: 'App canvas' },
  { name: 'foreground', varName: '--color-foreground', description: 'Primary text' },
  { name: 'primary', varName: '--color-primary', description: 'Brand / actions (indigo)' },
  { name: 'primary-foreground', varName: '--color-primary-foreground', description: 'Text on primary' },
  { name: 'secondary', varName: '--color-secondary', description: 'Secondary surface' },
  { name: 'secondary-foreground', varName: '--color-secondary-foreground', description: 'Text on secondary' },
  { name: 'muted', varName: '--color-muted', description: 'Muted surface' },
  { name: 'muted-foreground', varName: '--color-muted-foreground', description: 'Muted text' },
  { name: 'accent', varName: '--color-accent', description: 'Accent surface' },
  { name: 'accent-foreground', varName: '--color-accent-foreground', description: 'Text on accent' },
  { name: 'card', varName: '--color-card', description: 'Card surface' },
  { name: 'border', varName: '--color-border', description: 'Borders / dividers' },
  { name: 'input', varName: '--color-input', description: 'Input borders' },
  { name: 'ring', varName: '--color-ring', description: 'Focus ring' },
  { name: 'destructive', varName: '--color-destructive', description: 'Errors / delete' },
  { name: 'success', varName: '--color-success', description: 'Success state' },
  { name: 'warning', varName: '--color-warning', description: 'Warning state' },
];

const CHART_TOKENS = ['--color-chart-1', '--color-chart-2', '--color-chart-3', '--color-chart-4', '--color-chart-5'];

const Swatch = ({ name, varName, description }: { name: string; varName: string; description: string }) => (
  <div className="flex items-center gap-3" data-testid={`swatch-${name}`}>
    <span
      className="h-12 w-12 shrink-0 rounded-lg border border-border shadow-sm"
      style={{ backgroundColor: `var(${varName})` }}
    />
    <div className="min-w-0">
      <p className="font-mono text-sm text-foreground">{name}</p>
      <p className="truncate text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

const Palette = () => (
  <div className="max-w-3xl space-y-8 p-6">
    <div>
      <h2 className="mb-1 text-lg font-semibold text-foreground">Semantic tokens</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Every color is a CSS variable; toggle the theme toolbar to see light/dark values.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOKENS.map(t => (
          <Swatch key={t.name} {...t} />
        ))}
      </div>
    </div>
    <div>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Chart palette</h2>
      <div className="flex gap-3">
        {CHART_TOKENS.map((varName, i) => (
          <span
            key={varName}
            className="h-12 w-12 rounded-lg border border-border shadow-sm"
            style={{ backgroundColor: `var(${varName})` }}
            title={`chart-${i + 1}`}
          />
        ))}
      </div>
    </div>
  </div>
);

const meta: Meta<typeof Palette> = {
  title: 'Foundations/Colors',
  component: Palette,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof Palette>;

export const Light: Story = {
  globals: { theme: 'light' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('swatch-primary')).toBeInTheDocument();
    await expect(canvas.getByText('destructive')).toBeInTheDocument();
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId('swatch-background')).toBeInTheDocument();
  },
};
