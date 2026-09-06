import type { Meta, StoryObj } from '@storybook/react';
import { useMemo, useState } from 'react';
import { Table, type SortState, type TableColumn } from './Table';
import { Badge } from './Badge';
import { Button } from './Button';

interface Row {
  id: string;
  title: string;
  venue: string;
  city: string;
  startsAt: string;
  status: 'published' | 'draft' | 'cancelled';
  remaining: number;
  capacity: number;
}

const data: Row[] = [
  { id: '1', title: 'Kreuzberg Jazz Sessions', venue: 'Prachtwerk', city: 'Berlin', startsAt: '12 Mar, 21:00', status: 'published', remaining: 42, capacity: 200 },
  { id: '2', title: 'Hafenklang Late', venue: 'Hafenklang', city: 'Hamburg', startsAt: '14 Mar, 23:00', status: 'published', remaining: 0, capacity: 350 },
  { id: '3', title: 'Conne Island Allnighter', venue: 'Conne Island', city: 'Leipzig', startsAt: '15 Mar, 22:00', status: 'published', remaining: 118, capacity: 400 },
  { id: '4', title: 'Blitz Opening', venue: 'Blitz', city: 'Munich', startsAt: '21 Mar, 23:30', status: 'draft', remaining: 500, capacity: 500 },
  { id: '5', title: 'Gretchen Bass Night', venue: 'Gretchen', city: 'Berlin', startsAt: '22 Mar, 23:00', status: 'cancelled', remaining: 0, capacity: 300 },
  { id: '6', title: 'Uebel und Gefaehrlich', venue: 'Uebel', city: 'Hamburg', startsAt: '28 Mar, 22:00', status: 'published', remaining: 7, capacity: 250 },
];

const statusTone = {
  published: 'success',
  draft: 'neutral',
  cancelled: 'danger',
} as const;

const columns: TableColumn<Row>[] = [
  { key: 'title', header: 'Event', cell: (r) => <span className="font-medium">{r.title}</span> },
  { key: 'venue', header: 'Venue', cell: (r) => r.venue, hideBelow: 'md' },
  { key: 'city', header: 'City', cell: (r) => r.city, hideBelow: 'sm' },
  { key: 'startsAt', header: 'Starts', cell: (r) => r.startsAt, sortable: true },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => (
      <Badge tone={statusTone[r.status]} dot>
        {r.status}
      </Badge>
    ),
  },
  {
    key: 'remaining',
    header: 'Remaining',
    numeric: true,
    sortable: true,
    cell: (r) => (
      <span className={r.remaining === 0 ? 'text-danger-text' : undefined}>
        {r.remaining} / {r.capacity}
      </span>
    ),
  },
];

const empty = {
  title: 'No events match these filters',
  description: 'Clear the city filter or widen the date range. Draft events are never listed here, because the catalogue API only returns published ones.',
};

const meta = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A data table with sorting, a loading state and an empty state.

**Use it for** rows of the same kind of record, where the user compares values
down a column.

**Do not use it for** layout, and do not use it for one record. A single record
is a description list, and marking it up as a table makes a screen reader
announce a grid with one row.

**Do not use it below tablet width** without deciding what to drop. The
hideBelow prop hides a column at a breakpoint. Squeezing eight columns into
360px produces a table nobody can read and a horizontal scroll nobody finds.

### Only mark a column sortable if the data source can sort it

A header that reorders the page you are looking at, rather than the whole result
set, is worse than a header that does not sort at all. It looks like it worked,
and the answer is wrong from the second page onward. In the box office console
this library was built against, the catalogue API orders by date, by price and by
relevance, so those are the only sortable columns and the rest are plain headers.

### aria-sort goes on the header cell

The activator is a button inside the cell. Putting the sort state on the button
instead, which is the more common mistake, means it is announced when the button
is focused and is invisible while reading across the row of headers, which is
when it matters. Exactly one column carries aria-sort at a time: marking every
sortable column as "none" is permitted, and makes a screen reader read "not
sorted" eight times before reaching the column that is.

### The scroll container is focusable

A region that scrolls has to be reachable by keyboard. A div with overflow-x and
no tabindex is not, and that is the most common WCAG 2.1.1 failure in responsive
data tables.
        `.trim(),
      },
    },
  },
  args: {
    columns,
    rows: data,
    getRowId: (row) => row.id,
    caption: 'Events on sale',
    empty,
  },
  /*
   * Table is generic, so the meta is pinned to one row type with an
   * instantiation expression. Without the pin, Storybook widens Row to unknown
   * and the args below stop type checking against the columns they belong to.
   */
} satisfies Meta<typeof Table<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function PlaygroundStory() {
    const [sort, setSort] = useState<SortState | null>({ key: 'startsAt', direction: 'asc' });

    const rows = useMemo(() => {
      if (!sort) return data;
      const sorted = [...data].sort((a, b) => {
        if (sort.key === 'remaining') return a.remaining - b.remaining;
        return a.startsAt.localeCompare(b.startsAt);
      });
      return sort.direction === 'asc' ? sorted : sorted.reverse();
    }, [sort]);

    return (
      <div className="p-6">
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="Events on sale"
          empty={empty}
          sort={sort}
          onSortChange={setSort}
          onRowActivate={(row) => console.log('open', row.id)}
        />
      </div>
    );
  },
};

export const Loading: Story = {
  render: () => (
    <div className="p-6">
      <Table
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="Events on sale"
        empty={empty}
        loading
        skeletonRows={6}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton widths vary by row and by column so the loading table has the ragged right edge real data has. A grid of identical bars reads as a broken render rather than as content arriving. The body carries aria-busy, and the skeletons themselves are silent.',
      },
    },
  },
};

export const Empty: Story = {
  render: () => (
    <div className="p-6">
      <Table
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="Events on sale"
        empty={{
          ...empty,
          action: <Button variant="secondary">Clear all filters</Button>,
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The empty state says why the table is empty and what to do about it, and offers the action that fixes it. "No data" tells the user nothing they cannot already see.',
      },
    },
  },
};

export const LiveUpdates: Story = {
  name: 'Rows that changed',
  render: function LiveStory() {
    const [flashed, setFlashed] = useState<ReadonlySet<string>>(new Set());
    const [rows, setRows] = useState(data);

    return (
      <div className="flex flex-col gap-4 p-6">
        <Button
          className="self-start"
          variant="secondary"
          onClick={() => {
            const id = String(1 + Math.floor(Math.random() * 3));
            setRows((current) =>
              current.map((row) =>
                row.id === id ? { ...row, remaining: Math.max(0, row.remaining - 3) } : row,
              ),
            );
            setFlashed(new Set([id]));
            setTimeout(() => setFlashed(new Set()), 1400);
          }}
        >
          Simulate an inventory push
        </Button>

        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="Events on sale"
          empty={empty}
          flashedRowIds={flashed}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'The flash is a tint that decays over 1.2 seconds rather than a blink, and it runs longer than any motion token in the system. That is deliberate: this is a notification, not a state transition, and it has to catch an eye that was looking at another part of the screen. Under reduced motion it keeps its full duration and loses only its movement, because it carries information.',
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="p-6">
      <Table
        columns={columns}
        rows={data}
        getRowId={(r) => r.id}
        caption="Events on sale"
        empty={empty}
      />
      <p className="cui-prose mt-4 text-text-subtle">
        Narrow the viewport. Venue drops below the medium breakpoint and city below the small one,
        because those are the two an operator can infer from the event title. What is left still
        scrolls, and the scroller is reachable with the Tab key.
      </p>
    </div>
  ),
};
