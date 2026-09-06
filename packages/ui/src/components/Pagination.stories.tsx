import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Page controls for a server-paged list.

**Use it when** the total is known and the user might want to reach a specific
page or the end of the list.

**Do not use it when** the total is unknown or expensive to compute. A page count
that changes as you page through it is worse than no page count. Use a cursor and
a Next button.

**Do not use it for** an infinite feed. Paging is for lists you work through, not
lists you browse.

### The details

The number window is a fixed width, so the control never changes size as the user
moves through the pages. A pagination bar that grows and shrinks moves the Next
button out from under the pointer between clicks.

The current page is a button carrying aria-current, not a disabled button.
Disabling it takes it out of the tab order, so a keyboard user tabbing along the
row finds a hole exactly where they are. Previous and Next are genuinely disabled
at the ends, because there is nowhere for them to go and nothing transient about
it.

Below the small breakpoint the numbers are replaced by a plain statement of
position. Squeezing nine tap targets into 320px produces targets under the 24px
minimum in WCAG 2.2, and the numbers were never the useful part on a phone.
        `.trim(),
      },
    },
  },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 1 } },
    siblings: { control: { type: 'number', min: 0, max: 3 } },
    disabled: { control: 'boolean' },
    totalLabel: { control: 'text' },
  },
  args: {
    page: 6,
    totalPages: 42,
    siblings: 1,
    disabled: false,
    totalLabel: '498 events',
    // Required by the component; the stories that need state override it.
    onPageChange: () => {},
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [page, setPage] = useState(args.page);
    return (
      <div className="max-w-2xl">
        <Pagination {...args} page={page} onPageChange={setPage} />
      </div>
    );
  },
};

export const Positions: Story = {
  name: 'The window never changes width',
  render: () => (
    <div className="flex max-w-2xl flex-col gap-5">
      {[1, 2, 6, 21, 41, 42].map((page) => (
        <div key={page}>
          <p className="mb-1.5 font-mono text-[11px] text-text-subtle">page {page} of 42</p>
          <Pagination page={page} totalPages={42} onPageChange={() => {}} />
        </div>
      ))}
    </div>
  ),
};

export const ShortLists: Story = {
  name: 'Short lists',
  render: () => (
    <div className="flex max-w-2xl flex-col gap-5">
      {[1, 3, 7].map((total) => (
        <div key={total}>
          <p className="mb-1.5 font-mono text-[11px] text-text-subtle">{total} pages</p>
          <Pagination
            page={1}
            totalPages={total}
            onPageChange={() => {}}
            totalLabel={`${total * 12} events`}
          />
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Below the window width every page gets a number and the gaps disappear. With a single page and no total label the component renders nothing at all, because a pagination control for one page is furniture.',
      },
    },
  },
};

export const Disabled: Story = {
  name: 'While the next page loads',
  render: () => (
    <div className="max-w-2xl">
      <Pagination page={6} totalPages={42} onPageChange={() => {}} disabled totalLabel="Loading" />
    </div>
  ),
};
