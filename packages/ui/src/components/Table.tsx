import type { ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Skeleton } from './Skeleton';

export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string = string> {
  key: K;
  direction: SortDirection;
}

export interface Column<Row, K extends string = string> {
  key: K;
  header: ReactNode;
  /** Reads the cell. Return a node, not a string, when it needs a Badge. */
  cell: (row: Row) => ReactNode;
  /**
   * Only set this where the data source can actually sort by the column.
   *
   * A header that sorts the page you are looking at rather than the whole
   * result set is worse than a header that does not sort at all: it looks like
   * it worked, and the answer is wrong from row 26 onward. If the API cannot
   * order by a field, leave this off and say so in the column header tooltip.
   */
  sortable?: boolean;
  align?: 'start' | 'end';
  /**
   * Turns on tabular figures and right alignment. Set it for money, counts and
   * anything else read down a column.
   */
  numeric?: boolean;
  width?: string;
  /** Hides the column below the given breakpoint. */
  hideBelow?: 'sm' | 'md' | 'lg';
}

export interface TableEmptyState {
  title: string;
  /** Say what to do next. "No data" is not an empty state. */
  description: string;
  action?: ReactNode;
}

export interface TableProps<Row, K extends string = string> {
  columns: Column<Row, K>[];
  rows: Row[];
  getRowId: (row: Row) => string;
  /** Required. Describes the table for a screen reader. Visually hidden. */
  caption: string;
  sort?: SortState<K> | null;
  onSortChange?: (sort: SortState<K>) => void;
  loading?: boolean;
  skeletonRows?: number;
  empty: TableEmptyState;
  /**
   * Called when a row is clicked. A pointer convenience, and nothing more.
   *
   * It does NOT make the row keyboard operable, and it deliberately does not
   * try to. Giving the row a tabindex and a key handler would put a tab stop on
   * every row of the table and announce each one as a button, which on a
   * twelve-row page is twelve stops that all say the same thing.
   *
   * The accessible pattern is a real control inside one cell: a link if it
   * navigates, a button if it opens something. The row click then duplicates
   * what that control already does, for people using a mouse. Set this without
   * providing that control and the table is unusable from the keyboard, which
   * is exactly the bug this note exists to prevent.
   */
  onRowActivate?: (row: Row) => void;
  /** Adds the change flash to rows whose id is in this set. */
  flashedRowIds?: ReadonlySet<string>;
  className?: string;
}

const hideBelowClass = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const;

function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 10 12"
      width="10"
      height="12"
      className={cn('shrink-0', direction ? 'text-accent-text' : 'text-text-disabled')}
    >
      <path d="M5 1.5 8 5H2z" fill="currentColor" opacity={direction === 'desc' ? 0.25 : 1} />
      <path d="M5 10.5 2 7h6z" fill="currentColor" opacity={direction === 'asc' ? 0.25 : 1} />
    </svg>
  );
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   shell      --ui-surface-raised, --ui-border
 *   header     --ui-surface-sunken, --ui-text-muted, --text-label
 *   rows       --ui-text, --ui-border-subtle, --ui-accent-bg (hover)
 *   geometry   --radius-lg on the shell, --radius-none on the table itself
 *   motion     --duration-instant on row hover, cui-flash on changed rows
 *
 * WHY THE SHELL IS ROUNDED AND THE TABLE IS NOT
 *
 * The radius rule in scale.ts gives a full-bleed element zero radius, and a
 * table is full bleed inside whatever contains it. The rounding lives on the
 * wrapper, which also owns the overflow, so the corners are clipped rather than
 * drawn: a rounded <table> with square cells shows the cell corners poking
 * through the curve at every zoom level that is not 100%.
 *
 * SORTING AND aria-sort
 *
 * aria-sort belongs on the <th>, and the activator is a <button> inside it.
 * Putting the role on the button instead, which is the more common mistake,
 * means the sort state is announced when the button is focused and is invisible
 * when reading the row of headers, which is when it matters.
 *
 * Exactly one column carries aria-sort at a time. Marking every sortable column
 * with aria-sort="none" is permitted and is noise: it makes a screen reader read
 * "not sorted" nine times before reaching the column that is.
 */
export function Table<Row, K extends string = string>({
  columns,
  rows,
  getRowId,
  caption,
  sort,
  onSortChange,
  loading = false,
  skeletonRows = 8,
  empty,
  onRowActivate,
  flashedRowIds,
  className,
}: TableProps<Row, K>) {
  const showEmpty = !loading && rows.length === 0;

  function toggleSort(column: Column<Row, K>) {
    if (!column.sortable || !onSortChange) return;
    const next: SortDirection =
      sort?.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ key: column.key, direction: next });
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-surface-raised',
        '[--ui-focus-ring-offset:var(--ui-surface-raised)]',
        className,
      )}
    >
      {/*
        The horizontal scroller is a separate element from the rounded shell,
        and it is focusable with tabindex={0} plus a group role. A region that
        scrolls has to be reachable by keyboard, and a div with overflow-x alone
        is not: this is WCAG 2.1.1, and it is the single most common failure in
        responsive data tables.
      */}
      {/*
        The rule below is wrong for a scroll container. WCAG 2.1.1 requires a
        region that scrolls to be operable from the keyboard, and a div with
        overflow-x and no tabindex cannot be scrolled without a pointer. The
        role and the label are what stop it being an unexplained tab stop.
      */}
      <div
        className="w-full overflow-x-auto"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="group"
        aria-label={`${caption}, scrollable`}
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            {caption}
            {sort
              ? `, sorted by ${sort.key} ${sort.direction === 'asc' ? 'ascending' : 'descending'}`
              : ''}
          </caption>

          <thead>
            <tr className="border-b border-border bg-surface-sunken">
              {columns.map((column) => {
                const active = sort?.key === column.key;
                const direction = active ? sort!.direction : null;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={
                      active ? (direction === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className={cn(
                      'px-3 py-2 font-ui text-label text-text-muted',
                      (column.align === 'end' || column.numeric) && 'text-right',
                      column.hideBelow && hideBelowClass[column.hideBelow],
                    )}
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column)}
                        className={cn(
                          'cui-focus -mx-1 inline-flex items-center gap-1.5 rounded-sm px-1 py-0.5',
                          'font-ui text-label uppercase',
                          'transition-colors duration-instant ease-standard',
                          'hover:text-text',
                          active && 'text-accent-text',
                          (column.align === 'end' || column.numeric) && 'flex-row-reverse',
                        )}
                      >
                        {column.header}
                        <SortIcon direction={direction} />
                      </button>
                    ) : (
                      <span className="uppercase">{column.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody aria-busy={loading || undefined}>
            {loading
              ? Array.from({ length: skeletonRows }, (_, rowIndex) => (
                  <tr key={`skeleton-${rowIndex}`} className="border-b border-border-subtle">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-3 py-2.5',
                          column.hideBelow && hideBelowClass[column.hideBelow],
                        )}
                      >
                        {/*
                          Skeleton widths vary by column and by row so the
                          loading table has the ragged right edge that real
                          data has. A grid of identical bars reads as a broken
                          render rather than as content arriving.
                        */}
                        <Skeleton
                          variant="text"
                          width={`${58 + ((rowIndex * 13 + column.key.length * 7) % 38)}%`}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => {
                  const id = getRowId(row);
                  const interactive = Boolean(onRowActivate);

                  return (
                    <tr
                      key={id}
                      onClick={interactive ? () => onRowActivate!(row) : undefined}
                      className={cn(
                        'border-b border-border-subtle last:border-b-0',
                        'transition-colors duration-instant ease-standard',
                        interactive && 'cursor-pointer hover:bg-accent-bg',
                        flashedRowIds?.has(id) && 'cui-flash',
                      )}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-3 py-2.5 font-ui text-dense text-text',
                            (column.align === 'end' || column.numeric) && 'text-right',
                            // cui-tnum, not Tailwind's tabular-nums: the class
                            // sets lining figures as well, and the utility would
                            // override it with tabular alone.
                            column.numeric && 'cui-tnum',
                            column.hideBelow && hideBelowClass[column.hideBelow],
                          )}
                        >
                          {column.cell(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {showEmpty ? (
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          {/*
            A drawn mark rather than an icon font or an emoji. It is aria-hidden
            and carries no meaning; the copy does all the work.
          */}
          <svg
            aria-hidden="true"
            viewBox="0 0 48 32"
            width="48"
            height="32"
            className="text-border-strong"
          >
            <rect
              x="0.75"
              y="0.75"
              width="46.5"
              height="30.5"
              rx="3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M0.75 9.5h46.5M16 9.5V31M32 9.5V31"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.55"
            />
          </svg>

          <p className="mt-2 font-ui text-body font-medium text-text">{empty.title}</p>
          <p className="max-w-sm font-ui text-dense text-text-subtle">{empty.description}</p>
          {empty.action ? <div className="mt-2">{empty.action}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Alias, so a consumer can name the column type without the generic dance. */
export type { Column as TableColumn };
