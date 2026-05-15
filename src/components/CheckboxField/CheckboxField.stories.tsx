import type { Meta, StoryObj } from '@storybook/react';
import { Star } from 'lucide-react';
import { expect, userEvent, within } from 'storybook/test';

import { StoryFormWrapper } from '@/stories/helpers';

import { CheckboxField } from '.';

const meta: Meta<typeof CheckboxField> = {
  title: 'Components/Fields/CheckboxField',
  component: CheckboxField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
};
export default meta;

type Story = StoryObj<typeof CheckboxField>;

type FavoriteForm = { isFavorite: boolean };

export const Unchecked: Story = {
  render: () => (
    <StoryFormWrapper<FavoriteForm> defaultValues={{ isFavorite: false }}>
      {control => <CheckboxField control={control} label="Mark as Favorite" icon={Star} fieldName="isFavorite" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const checkbox = canvas.getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};

export const Checked: Story = {
  render: () => (
    <StoryFormWrapper<FavoriteForm> defaultValues={{ isFavorite: true }}>
      {control => <CheckboxField control={control} label="Mark as Favorite" icon={Star} fieldName="isFavorite" />}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('checkbox')).toBeChecked();
  },
};

export const WithDescription: Story = {
  render: () => (
    <StoryFormWrapper<FavoriteForm> defaultValues={{ isFavorite: false }}>
      {control => (
        <CheckboxField
          control={control}
          label="Mark as Favorite"
          description="Favorited projects appear at the top of your sidebar."
          icon={Star}
          fieldName="isFavorite"
        />
      )}
    </StoryFormWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/favorited projects appear/i)).toBeInTheDocument();
  },
};

export const Optional: Story = {
  render: () => (
    <StoryFormWrapper<FavoriteForm> defaultValues={{ isFavorite: false }}>
      {control => (
        <CheckboxField optional control={control} label="Mark as Favorite" icon={Star} fieldName="isFavorite" />
      )}
    </StoryFormWrapper>
  ),
};
