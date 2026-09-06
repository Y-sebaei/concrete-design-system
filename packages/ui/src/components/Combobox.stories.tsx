import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Combobox, type ComboboxOption } from './Combobox';

const cities: ComboboxOption[] = [
  { value: 'berlin', label: 'Berlin', description: 'Germany' },
  { value: 'bern', label: 'Bern', description: 'Switzerland' },
  { value: 'bremen', label: 'Bremen', description: 'Germany' },
  { value: 'cologne', label: 'Cologne', description: 'Germany' },
  { value: 'dresden', label: 'Dresden', description: 'Germany, no events scheduled', disabled: true },
  { value: 'hamburg', label: 'Hamburg', description: 'Germany' },
  { value: 'leipzig', label: 'Leipzig', description: 'Germany' },
  { value: 'munich', label: 'Munich', description: 'Germany' },
  { value: 'vienna', label: 'Vienna', description: 'Austria' },
  { value: 'zurich', label: 'Zurich', description: 'Switzerland' },
];

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An editable combobox with list autocomplete, following the ARIA Authoring
Practices combobox pattern. Written by hand rather than wrapped, because the
pattern is the thing worth getting right.

**Use it when** the list is long enough that scanning it is the bottleneck,
roughly past twenty options, or when the user needs to filter by typing rather
than jump by first letter. Also use it when the options come from a server.

**Do not use it for** short lists. \`Select\` is the right answer far more often
than it looks: it is a real native control, so it inherits the platform picker,
keyboard type-ahead, and correct behaviour in every assistive technology without
a line of ARIA. Nothing hand-written matches that, this component included.

**Do not use it as a menu.** A combobox chooses a value. A list of actions is a
menu, and a menu has different keyboard semantics.

### The parts that are easy to get wrong

\`role="combobox"\` sits on the input itself, not on a wrapping div. That changed
in ARIA 1.2, and copying an older example produces a control that NVDA and JAWS
both describe incorrectly.

DOM focus never leaves the input. Arrow keys move \`aria-activedescendant\` to an
option id, which is what lets the user keep typing while an option is
highlighted. Two things follow: the active option has to be scrolled into view
by hand, since the browser only does that for real focus, and the highlight has
to look distinct without being a focus ring, since the real focus ring is on the
input where it belongs.

The result count goes into a polite live region, because screen readers announce
the active option automatically but never announce how many options the filter
left.

The empty state sits beside the listbox rather than inside it. A \`role="listbox"\`
may only contain options, and an empty state offered as an option is a dead end:
the user arrows onto it, presses Enter, and nothing happens.

### Keyboard

| Key | Behaviour |
| --- | --- |
| Down | Opens and highlights the first option, or moves to the next |
| Alt + Down | Opens without moving the highlight |
| Up | Opens and highlights the last option, or moves to the previous |
| Alt + Up | Commits the highlighted option and closes |
| Enter | Commits the highlighted option |
| Escape | Closes; a second press clears the field |
| Tab | Commits the highlight, then moves focus on normally |
| Home, End | Left to the text caret, deliberately |
| Page Up, Page Down | Moves ten options at a time |
        `.trim(),
      },
    },
  },
  argTypes: {
    autocomplete: { control: 'inline-radio', options: ['list', 'both'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    clearable: { control: 'boolean' },
    label: { control: 'text' },
    hint: { control: 'text' },
    error: { control: 'text' },
    placeholder: { control: 'text' },
  },
  args: {
    label: 'City',
    options: cities,
    value: null,
    // Required by the component, so it has to be here even though every story
    // below overrides it with a stateful wrapper.
    onChange: () => {},
    placeholder: 'Start typing a city',
    autocomplete: 'list',
    size: 'md',
    loading: false,
    disabled: false,
    clearable: true,
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

function Controlled(args: React.ComponentProps<typeof Combobox>) {
  const [value, setValue] = useState<string | null>(args.value);
  return (
    <div className="max-w-sm">
      <Combobox {...args} value={value} onChange={setValue} />
      <p className="mt-3 font-mono text-[11px] text-text-subtle">value: {String(value)}</p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <Controlled {...args} />,
};

export const WithHint: Story = {
  name: 'With a hint',
  render: (args) => (
    <Controlled {...args} hint="Only cities with a published event are listed." />
  ),
};

export const Error: Story = {
  name: 'Error',
  render: (args) => (
    <Controlled
      {...args}
      error="Pick a city before running the report."
      hint="Only cities with a published event are listed."
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The hint is not replaced by the error. Most field components swap one for the other, which throws away the instruction at the exact moment the user has shown they need it. Both are rendered, and both are joined into aria-describedby with the error first.',
      },
    },
  },
};

export const InlineAutocomplete: Story = {
  name: 'Inline autocomplete',
  render: (args) => <Controlled {...args} autocomplete="both" />,
  parameters: {
    docs: {
      description: {
        story:
          'Type "bre". The rest of the match is completed in the field and selected, so the next keystroke replaces it. Use this only when the labels have distinct prefixes: on a list where many entries start with the same words it fights the user on every keystroke. Backspace deletes rather than re-completing, which sounds obvious and is the bug most implementations of this ship with.',
      },
    },
  },
};

export const Empty: Story = {
  name: 'Empty state',
  render: (args) => (
    <Controlled
      {...args}
      options={[]}
      emptyMessage="No orders match that reference"
      label="Order"
      placeholder="Order id or customer email"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The empty message is real copy about the thing being searched, not "No results". The default, used when no emptyMessage is given, also suggests what to do next.',
      },
    },
  },
};

export const Loading: Story = {
  render: (args) => (
    <Controlled {...args} loading options={[]} label="Order" placeholder="Searching orders" />
  ),
};

export const Disabled: Story = {
  render: (args) => <Controlled {...args} disabled value="berlin" />,
};

export const ServerBacked: Story = {
  name: 'Server backed',
  render: function ServerBackedStory(args) {
    const [query, setQuery] = useState('');
    const [value, setValue] = useState<string | null>(null);

    /*
     * Stands in for a request. The important part is that the caller owns the
     * filtering: when onInputChange is supplied, the component stops filtering
     * locally, because the server may have matched on a field the option list
     * does not contain. Here that field is the customer email.
     */
    const results = useMemo<ComboboxOption[]>(() => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) return [];
      return [
        { value: 'ord-4d1f', label: 'Order 4d1f', description: 'ada@example.berlin, 2 tickets' },
        { value: 'ord-91ac', label: 'Order 91ac', description: 'grace@example.berlin, 1 ticket' },
        { value: 'ord-c30b', label: 'Order c30b', description: 'alan@example.berlin, 4 tickets' },
      ].filter(
        (option) =>
          option.label.toLowerCase().includes(q) || option.description.toLowerCase().includes(q),
      );
    }, [query]);

    return (
      <div className="max-w-sm">
        <Combobox
          {...args}
          label="Order"
          placeholder="Order id or customer email"
          hint="Type at least two characters."
          options={results}
          value={value}
          onChange={setValue}
          inputValue={query}
          onInputChange={setQuery}
          emptyMessage={query.trim().length < 2 ? 'Keep typing' : 'No orders match that'}
        />
        <p className="mt-3 font-mono text-[11px] text-text-subtle">
          query: {JSON.stringify(query)} · value: {String(value)}
        </p>
        <p className="cui-prose mt-2 text-text-subtle">
          Search for <strong>ada</strong>. That string appears in no option label, so a component
          that re-filtered locally would show nothing.
        </p>
      </div>
    );
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-4">
      <Controlled {...args} size="sm" label="Small" />
      <Controlled {...args} size="md" label="Medium" />
      <Controlled {...args} size="lg" label="Large" />
    </div>
  ),
};
