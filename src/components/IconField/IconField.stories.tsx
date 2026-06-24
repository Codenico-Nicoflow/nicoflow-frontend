import type { Meta, StoryObj } from '@storybook/react';
import { useForm } from 'react-hook-form';
import { expect, within } from 'storybook/test';

import { Form } from '@/components/ui/form';
import { ICON_IDS } from '@/lib/utils';

import { IconField } from '.';

type IconForm = { icon?: string };

type StoryArgs = {
  value?: string;
  label?: string;
  optional: boolean;
  delay: number;
};

const meta: Meta<StoryArgs> = {
  title: 'Components/Fields/IconField',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { value: undefined, label: '', optional: false, delay: 0.2 },
  argTypes: {
    value: { control: 'select', options: [undefined, ...ICON_IDS], description: 'Seeds the selected icon.' },
    label: { control: 'text' },
    optional: { control: 'boolean' },
    delay: { control: 'number' },
  },
  render: ({ value, ...props }) => {
    const Demo = () => {
      const form = useForm<IconForm>({ defaultValues: { icon: value } });
      return (
        <Form {...form}>
          <form className="w-[360px]">
            <IconField control={form.control} {...props} />
          </form>
        </Form>
      );
    };
    return <Demo />;
  },
};
export default meta;

type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // No label by default; assert the icon trigger renders.
    await expect(canvas.getByTestId('icon-trigger')).toBeInTheDocument();
  },
};

export const WithLabel: Story = {
  args: { label: 'Icon' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Icon')).toBeInTheDocument();
  },
};

export const WithIcon: Story = {
  args: { value: 'folder' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Icon-only trigger; the friendly name is the accessible name.
    await expect(canvas.getByTestId('icon-trigger')).toHaveAccessibleName('Folder');
  },
};

export const Optional: Story = { args: { optional: true } };
