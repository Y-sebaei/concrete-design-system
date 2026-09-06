import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const cities = [
  { value: 'berlin', label: 'Berlin' },
  { value: 'hamburg', label: 'Hamburg' },
  { value: 'leipzig', label: 'Leipzig' },
  { value: 'munich', label: 'Munich' },
  { value: 'dresden', label: 'Dresden, no events scheduled', disabled: true },
];

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A styled native select.

**Use it when** the value comes from a known list of roughly twenty options or
fewer. That covers far more cases than it looks like it should.

**Do not reach for Combobox by default.** Select is a real native control, so it
inherits the platform picker: a wheel on iOS, a searchable dropdown on Android,
keyboard type-ahead everywhere, and correct behaviour in every assistive
technology without a line of ARIA. Nothing hand-written matches that, including
the Combobox in this library. Move to Combobox only when the list is long enough
that scanning it is the bottleneck, or when the options come from a server.

**Do not use it for** actions. A select chooses a value; a list of things to do
is a menu.

**The trade being made** is that a native select cannot style its own option
list. The closed control is fully themed, the open list belongs to the operating
system. In a design system that is usually the right way round, because the open
list is where correctness matters most and where custom implementations most
often break.

**The placeholder is a value, not an instruction.** Pass "Any city", not "Select
a city": the first is a real filter state the user can choose, and the second is
a label pretending to be an option.
        `.trim(),
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
  },
  args: {
    label: 'City',
    options: cities,
    placeholder: 'Any city',
    size: 'md',
    required: false,
    disabled: false,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <Select {...args} />
    </div>
  ),
};

export const EveryState: Story = {
  name: 'Every state',
  render: () => (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Select label="Rest" options={cities} placeholder="Any city" />
      <Select label="Chosen" options={cities} defaultValue="hamburg" />
      <Select
        label="With a hint"
        options={cities}
        placeholder="Any city"
        hint="Only cities with a published event appear here."
      />
      <Select
        label="Error"
        options={cities}
        placeholder="Any city"
        error="Pick a city before running the report."
      />
      <Select label="Required" required options={cities} placeholder="Any city" />
      <Select label="Disabled" disabled options={cities} defaultValue="berlin" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col gap-3">
      <Select label="Small" size="sm" options={cities} placeholder="Any city" />
      <Select label="Medium" size="md" options={cities} placeholder="Any city" />
      <Select label="Large" size="lg" options={cities} placeholder="Any city" />
    </div>
  ),
};

export const SortOrder: Story = {
  name: 'A real one from the console',
  render: () => (
    <div className="flex max-w-xs flex-col gap-3">
      <Select
        label="Sort by"
        options={[
          { value: 'relevance', label: 'Relevance' },
          { value: 'date', label: 'Date, soonest first' },
          { value: 'price', label: 'Price, lowest first' },
        ]}
        defaultValue="date"
        hint="These are the three orderings the API can do server side."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Three options, a known set, no typing required. This is exactly the case Select is for, and reaching for a Combobox here would trade a correct native control for a hand-written one that does less.',
      },
    },
  },
};
