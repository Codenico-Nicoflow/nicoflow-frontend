import type { Meta, StoryObj } from '@storybook/react';
import { expect, screen, userEvent, within } from 'storybook/test';

import { StoryFormWrapper } from '@/stories/helpers';

import { ColorField } from '.';

const meta: Meta<typeof ColorField> = {
  title: 'Components/Fields/ColorField',
  component: ColorField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    delay: { control: 'number' },
  },
};
export default meta;

type Story = StoryObj<typeof ColorField>;

type ColorForm = { color?: string };

export const Default: Story = {
  render: () => (
    <StoryFormWrapper<ColorForm> defaultValues={{ color: '#3B82F6' }}>
      {control => <ColorField control={control} label="Area Color" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Area Color')).toBeInTheDocument();
    // Trigger shows the friendly preset name, not the raw hex.
    await expect(canvas.getByTestId('color-trigger')).toHaveTextContent('Blue');
  },
};

export const EmberSelected: Story = {
  render: () => (
    <StoryFormWrapper<ColorForm> defaultValues={{ color: '#c4622d' }}>
      {control => <ColorField control={control} label="Area Color" />}
    </StoryFormWrapper>
  ),
};

export const PaletteOpen: Story = {
  render: () => (
    <StoryFormWrapper<ColorForm> defaultValues={{ color: '#3B82F6' }}>
      {control => <ColorField control={control} label="Area Color" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('color-trigger'));
    await expect(await screen.findByTestId('color-swatches')).toBeInTheDocument();
  },
};
