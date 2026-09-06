import { cn } from '../lib/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Shown alongside the controls, e.g. "37 events". Already formatted. */
  totalLabel?: string;
  /** Accessible name for the nav landmark. Set it when a page has two. */
  label?: string;
  /** Numbered buttons either side of the current page. */
  siblings?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Builds the page list with gaps, e.g. [1, '...', 6, 7, 8, '...', 42].
 *
 * The window is a fixed width, so the control never changes size as the user
 * moves through the pages. A pagination bar that grows and shrinks moves the
 * "next" button under the pointer between clicks, which turns paging through
 * results into a game of catch.
 */
function buildPages(page: number, totalPages: number, siblings: number): (number | 'gap')[] {
  const span = siblings * 2 + 5;
  if (totalPages <= span) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const left = Math.max(2, page - siblings);
  const right = Math.min(totalPages - 1, page + siblings);
  const pages: (number | 'gap')[] = [1];

  if (left > 2) pages.push('gap');
  for (let p = left; p <= right; p += 1) pages.push(p);
  if (right < totalPages - 1) pages.push('gap');
  pages.push(totalPages);

  return pages;
}

const stepButton = [
  'cui-focus inline-flex h-[var(--control-height-md)] items-center gap-1 rounded-md border px-3',
  'font-ui text-dense font-medium',
  'transition-colors duration-instant ease-standard',
].join(' ');

/*
 * TOKENS THIS COMPONENT READS
 *
 *   current   --ui-accent (fill), --ui-text-on-accent
 *   rest      --ui-text, --ui-border-strong, --ui-surface-overlay
 *   inert     --ui-border, --ui-text-disabled
 *   geometry  --control-height-md, --radius-md
 *   type      --text-dense, and tabular figures so the numbers do not shuffle
 *
 * ACCESSIBILITY
 *
 * A <nav> with an accessible name, containing a list. The current page is a
 * button with aria-current="page" rather than a disabled button: disabling it
 * removes it from the tab order, so a keyboard user tabbing along the row of
 * pages finds a hole exactly where they are.
 *
 * The previous and next buttons are genuinely disabled at the ends, because
 * there is nowhere for them to go and nothing transient about that.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  totalLabel,
  label = 'Pagination',
  siblings = 1,
  disabled = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && !totalLabel) return null;

  const pages = buildPages(page, Math.max(1, totalPages), siblings);
  const atStart = page <= 1 || disabled;
  const atEnd = page >= totalPages || disabled;

  return (
    <nav
      aria-label={label}
      className={cn('flex flex-wrap items-center justify-between gap-3', className)}
    >
      {totalLabel ? <p className="font-ui text-dense text-text-subtle">{totalLabel}</p> : <span />}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={atStart}
          className={cn(
            stepButton,
            atStart
              ? 'cursor-not-allowed border-border text-text-disabled'
              : 'border-border-strong bg-surface-overlay text-text hover:bg-surface-raised',
          )}
        >
          <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
            <path
              d="M7.5 2.5 4 6l3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Previous
        </button>

        <ol className="hidden items-center gap-1 sm:flex">
          {pages.map((entry, index) =>
            entry === 'gap' ? (
              <li
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 font-ui text-dense text-text-disabled"
              >
                &hellip;
              </li>
            ) : (
              <li key={entry}>
                <button
                  type="button"
                  onClick={() => onPageChange(entry)}
                  disabled={disabled}
                  aria-current={entry === page ? 'page' : undefined}
                  aria-label={`Page ${entry}`}
                  className={cn(
                    'cui-focus cui-tnum inline-flex h-[var(--control-height-md)] min-w-[var(--control-height-md)] items-center justify-center rounded-md border px-2',
                    'font-ui text-dense',
                    'transition-colors duration-instant ease-standard',
                    entry === page
                      ? 'border-transparent bg-accent font-medium text-text-on-accent'
                      : 'border-transparent text-text hover:bg-accent-bg hover:text-accent-text',
                  )}
                >
                  {entry}
                </button>
              </li>
            ),
          )}
        </ol>

        {/*
          Below the small breakpoint the numbers are replaced by a plain
          statement of where you are. Squeezing nine tap targets into 320px
          produces targets under the 24px minimum in WCAG 2.2, and the numbers
          were never the useful part on a phone anyway.
        */}
        <p className="cui-tnum px-2 font-ui text-dense text-text-muted sm:hidden">
          {page} / {totalPages}
        </p>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={atEnd}
          className={cn(
            stepButton,
            atEnd
              ? 'cursor-not-allowed border-border text-text-disabled'
              : 'border-border-strong bg-surface-overlay text-text hover:bg-surface-raised',
          )}
        >
          Next
          <svg aria-hidden="true" viewBox="0 0 12 12" width="12" height="12">
            <path
              d="M4.5 2.5 8 6l-3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
