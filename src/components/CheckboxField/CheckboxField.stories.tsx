import type { Meta, StoryObj } from '@storybook/react';
import { Star } from 'lucide-react';

import { StoryFormWrapper } from '@/stories/helpers';

import { CheckboxField } from '.';

const meta: Meta<typeof CheckboxField> = {
  title: 'Components/Fields/CheckboxField',
  component: CheckboxField,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
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
};

export const Checked: Story = {
  render: () => (
    <StoryFormWrapper<FavoriteForm> defaultValues={{ isFavorite: true }}>
      {control => <CheckboxField control={control} label="Mark as Favorite" icon={Star} fieldName="isFavorite" />}
    </StoryFormWrapper>
  ),
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
