import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const SearchIcon = () => (
  <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
    <circle cx="6" cy="6" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m9.5 9.5 3 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A single-line text field with its label, hint and error wired up.

**Use it for** free text and numbers the user types.

**Do not use it for** a value chosen from a known set. That is a Select, or a
Combobox once the set gets long. A text field that only accepts six particular
strings is a quiz.

**Do not use a placeholder as a label.** The placeholder disappears the moment
the user types, taking the only description of the field with it, and it fails
contrast in most implementations. The label prop is required here for that
reason. If the design has no room for a visible label, pass labelHidden and the
label stays for assistive technology.

**The well is recessed, not raised.** An input sits on the sunken surface, one
tone below the page, because it is a place content goes into. No inset shadow is
used to sell that, because light Concrete has no shadows.

**The hint survives the error.** Both are rendered and both are joined into
aria-describedby, error first. Swapping one for the other, which is the common
pattern, deletes the instruction at the exact moment the user has demonstrated
they need it.
        `.trim(),
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    numeric: { control: 'boolean' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    labelHidden: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
  },
  args: {
    label: 'Search events',
    placeholder: 'Title or venue',
    size: 'md',
    numeric: false,
    required: false,
    disabled: false,
    labelHidden: false,
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <Input {...args} />
    </div>
  ),
};

export const EveryState: Story = {
  name: 'Every state',
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <Input label="Rest" placeholder="Title or venue" />
      <Input label="Filled" defaultValue="Kreuzberg Jazz" />
      <Input label="With a hint" hint="Matches the title, the venue and the description." />
      <Input
        label="Error"
        error="No event has that slug."
        hint="Matches the title, the venue and the description."
        defaultValue="kreuzburg-jazz"
      />
      <Input label="Required" required placeholder="Customer email" />
      <Input label="Disabled" disabled defaultValue="Locked while the sale is live" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Hover and focus are live. The required marker is an asterisk carrying aria-hidden, with the real signal on the input attribute: reading the word "asterisk" after every label is worse than silence.',
      },
    },
  },
};

export const Numeric: Story = {
  render: () => (
    <div className="max-w-xs">
      <div className="flex flex-col gap-3">
        <Input label="Quantity" numeric defaultValue="2" hint="Up to ten per order." />
        <Input label="Face value" numeric defaultValue="24.00" />
        <Input label="Service fee" numeric defaultValue="1.80" />
        <Input label="Total" numeric defaultValue="49.80" />
      </div>
      <p className="cui-prose mt-3 text-text-subtle">
        Numeric fields are right aligned and use tabular figures, so the decimal points line up down
        the column.
      </p>
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With icons',
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Input
        label="Search events"
        labelHidden
        placeholder="Title or venue"
        iconStart={<SearchIcon />}
      />
      <Input label="Face value" numeric defaultValue="24.00" iconEnd={<span>EUR</span>} />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Input label="Small, 28px" size="sm" placeholder="Inside a table row" />
      <Input label="Medium, 36px" size="md" placeholder="The default" />
      <Input label="Large, 44px" size="lg" placeholder="Meets the WCAG 2.2 target size" />
    </div>
  ),
};
