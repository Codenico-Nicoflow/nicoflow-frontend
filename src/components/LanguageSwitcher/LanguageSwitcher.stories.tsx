import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';

import { LanguageSwitcher } from '.';

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Components/I18n/LanguageSwitcher',
  component: LanguageSwitcher,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};
export default meta;

type Story = StoryObj<typeof LanguageSwitcher>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();
    const trigger = canvas.getByRole('button');
    await expect(trigger).toBeInTheDocument();
    await user.click(trigger);
    const menu = document.querySelector('[role="menu"]');
    await expect(menu).toBeTruthy();
    // All three languages are offered, in their native script.
    await expect(document.body).toHaveTextContent('English');
    await expect(document.body).toHaveTextContent('עברית');
    await expect(document.body).toHaveTextContent('Русский');
  },
};
