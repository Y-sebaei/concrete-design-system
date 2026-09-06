import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, type TableColumn, type SortState } from './Table';

interface Event {
  id: string;
  title: string;
  city: string;
  remaining: number;
}

const rows: Event[] = [
  { id: '1', title: 'Kreuzberg Jazz Sessions', city: 'Berlin', remaining: 42 },
  { id: '2', title: 'Hafenklang Late', city: 'Hamburg', remaining: 0 },
];

const columns: TableColumn<Event>[] = [
  { key: 'title', header: 'Event', cell: (row) => row.title },
  { key: 'city', header: 'City', cell: (row) => row.city },
  { key: 'remaining', header: 'Remaining', cell: (row) => row.remaining, numeric: true, sortable: true },
];

const empty = {
  title: 'No events match these filters',
  description: 'Clear the city filter or widen the date range to see more.',
};

describe('Table', () => {
  it('names itself with a caption for screen readers', () => {
    render(
      <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="Events" empty={empty} />,
    );
    expect(screen.getByRole('table', { name: /Events/ })).toBeInTheDocument();
  });

  it('makes the horizontal scroller reachable by keyboard', () => {
    render(
      <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="Events" empty={empty} />,
    );
    // WCAG 2.1.1: a scrollable region has to be operable without a pointer.
    const scroller = screen.getByRole('group', { name: /scrollable/ });
    expect(scroller).toHaveAttribute('tabindex', '0');
  });

  it('puts aria-sort on the header cell and only on the sorted one', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [sort, setSort] = useState<SortState | null>(null);
      return (
        <Table
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          caption="Events"
          empty={empty}
          sort={sort}
          onSortChange={setSort}
        />
      );
    }

    render(<Harness />);

    const headers = screen.getAllByRole('columnheader');
    expect(headers.every((header) => !header.hasAttribute('aria-sort'))).toBe(true);

    await user.click(screen.getByRole('button', { name: /Remaining/ }));

    const remaining = screen.getByRole('columnheader', { name: /Remaining/ });
    expect(remaining).toHaveAttribute('aria-sort', 'ascending');
    expect(
      screen.getByRole('columnheader', { name: 'Event' }).hasAttribute('aria-sort'),
    ).toBe(false);

    await user.click(screen.getByRole('button', { name: /Remaining/ }));
    expect(remaining).toHaveAttribute('aria-sort', 'descending');
  });

  it('offers no sort control for columns the data source cannot order', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="Events"
        empty={empty}
        onSortChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Event/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Remaining/ })).toBeInTheDocument();
  });

  it('marks the body busy and shows no empty state while loading', () => {
    const { container } = render(
      <Table
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="Events"
        empty={empty}
        loading
        skeletonRows={3}
      />,
    );

    expect(container.querySelector('tbody')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText(empty.title)).not.toBeInTheDocument();
    // Skeletons are aria-hidden, so the loading table announces once via
    // aria-busy rather than once per placeholder rectangle.
    expect(container.querySelectorAll('.cui-skeleton[aria-hidden="true"]').length).toBe(9);
  });

  it('shows an empty state with real copy once loading finishes', () => {
    render(
      <Table columns={columns} rows={[]} getRowId={(r) => r.id} caption="Events" empty={empty} />,
    );

    expect(screen.getByText('No events match these filters')).toBeInTheDocument();
    expect(screen.getByText(/Clear the city filter/)).toBeInTheDocument();
  });

  it('renders numeric cells with tabular figures', () => {
    render(
      <Table columns={columns} rows={rows} getRowId={(r) => r.id} caption="Events" empty={empty} />,
    );

    const firstRow = screen.getAllByRole('row')[1]!;
    const cells = within(firstRow).getAllByRole('cell');
    expect(cells[2]).toHaveClass('cui-tnum');
  });

  it('activates a row on click when the caller asks for it', async () => {
    const onRowActivate = vi.fn();
    const user = userEvent.setup();

    render(
      <Table
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        caption="Events"
        empty={empty}
        onRowActivate={onRowActivate}
      />,
    );

    await user.click(screen.getByText('Hafenklang Late'));
    expect(onRowActivate).toHaveBeenCalledWith(rows[1]);
  });
});
