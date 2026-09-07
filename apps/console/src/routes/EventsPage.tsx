import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Badge,
  Banner,
  Button,
  Combobox,
  Input,
  Pagination,
  Select,
  Table,
  useToast,
  type SortState,
  type TableColumn,
} from '@y-sebaei/concrete-ui';
import { ApiError, api, type EventDocument, type EventSort, type SearchResult } from '../lib/api';
import { money, when } from '../lib/format';

const PAGE_SIZE = 12;

/*
 * SORTING, AND WHAT THIS SCREEN CANNOT DO
 *
 * GET /events sorts on relevance, date or price, and nothing else. So Starts
 * and From are sortable columns and Event, Venue and City are not.
 *
 * The alternative would be to sort the twelve rows currently on screen by
 * title, which looks like it works and is wrong from page two onward. A header
 * that lies about the ordering of a result set is worse than a header that does
 * not sort, because the operator has no way to tell.
 */
const sortForColumn: Record<string, EventSort> = { startsAt: 'date', minPrice: 'price' };
const columnForSort: Record<EventSort, string | null> = {
  date: 'startsAt',
  price: 'minPrice',
  relevance: null,
};

const statusTone = {
  published: 'success',
  draft: 'neutral',
  cancelled: 'danger',
} as const;

export function EventsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* URL is the source of truth for the filters, so a filtered view is a link. */
  const q = params.get('q') ?? '';
  const city = params.get('city');
  const sort = (params.get('sort') as EventSort | null) ?? 'date';
  const page = Number(params.get('page') ?? '1');

  const [result, setResult] = useState<SearchResult | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);

  /* The search box is uncontrolled by the URL while the operator is typing. */
  const [draftQuery, setDraftQuery] = useState(q);

  /*
   * Whether the last response came from the database rather than Elasticsearch.
   *
   * This is state on the page, not a notification, because it is a condition:
   * it is true of the results currently on screen and stays true until the
   * stack recovers. It was a toast first, which was the wrong shape. See the
   * findings list in the README.
   */
  const [degraded, setDegraded] = useState(false);

  const setParam = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      // Any filter change invalidates the page number. Leaving it behind is how
      // a search lands on an empty page seven and looks like it found nothing.
      if (!('page' in patch)) next.delete('page');
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  /* Debounced free-text search. */
  useEffect(() => {
    if (draftQuery === q) return;
    const timer = setTimeout(() => setParam({ q: draftQuery }), 300);
    return () => clearTimeout(timer);
  }, [draftQuery, q, setParam]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .listCities(controller.signal)
      .then(setCities)
      .catch(() => {
        // A missing city list degrades the filter, not the page. No toast:
        // the events request below will already have said if the API is down.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setFailed(null);

    api
      .listEvents(
        { q: q || undefined, city: city ?? undefined, sort, page, pageSize: PAGE_SIZE },
        controller.signal,
      )
      .then((next) => {
        setResult(next);
        setLoading(false);

        /*
         * The API says which backend answered. A database result has no ranking
         * and no fuzzy matching and is otherwise indistinguishable from a
         * healthy one, so it gets a banner above the table for exactly as long
         * as it is true, and clears itself the moment search recovers.
         */
        setDegraded(next.source === 'database');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        const message =
          error instanceof ApiError
            ? error.operatorMessage
            : 'Something went wrong loading events.';
        /*
         * No toast here, deliberately.
         *
         * A failed load is not an event that has finished happening; the list
         * stays unloaded until somebody retries. It gets the banner below, once,
         * rather than a message that leaves after six seconds and a duplicate in
         * the table's empty state. The toasts left in this console are all
         * genuine events: a socket reconnect, an order reaching fulfilment, a
         * counter sale going through.
         */
        setFailed(message);
      });

    return () => controller.abort();
  }, [q, city, sort, page, toast, setParam, params]);

  const tableSort: SortState | null = useMemo(() => {
    const key = columnForSort[sort];
    return key ? { key, direction: 'asc' } : null;
  }, [sort]);

  const columns: TableColumn<EventDocument>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Event',
        /*
         * A real link, not just a row click.
         *
         * Table's onRowActivate is a pointer convenience and does not make the
         * row keyboard operable. Without this link a keyboard user can reach
         * the sort buttons and the pagination and has no way at all to open an
         * event, which is the entire job of this screen.
         */
        cell: (event) => (
          <Link
            to={`/events/${event.slug}`}
            className="cui-focus block max-w-[28ch] truncate rounded-sm font-medium text-text hover:text-accent-text hover:underline"
          >
            {event.title}
          </Link>
        ),
      },
      {
        key: 'venueName',
        header: 'Venue',
        hideBelow: 'lg',
        cell: (event) => <span className="text-text-muted">{event.venueName}</span>,
      },
      {
        key: 'city',
        header: 'City',
        hideBelow: 'md',
        cell: (event) => <span className="text-text-muted">{event.city}</span>,
      },
      {
        key: 'startsAt',
        header: 'Starts',
        sortable: true,
        cell: (event) => <span className="cui-tnum">{when(event.startsAt)}</span>,
      },
      {
        key: 'status',
        header: 'Status',
        hideBelow: 'sm',
        cell: (event) => (
          <Badge tone={statusTone[event.status] ?? 'neutral'} dot>
            {event.status}
          </Badge>
        ),
      },
      {
        key: 'minPrice',
        header: 'From',
        numeric: true,
        sortable: true,
        cell: (event) => money(event.minPriceCents, event.currency),
      },
    ],
    [],
  );

  const cityOptions = useMemo(() => cities.map((name) => ({ value: name, label: name })), [cities]);

  const hasFilters = Boolean(q || city);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-ui text-display text-text">Events</h1>
          <p className="cui-prose mt-1 text-text-subtle">
            Everything with a published sale. The catalogue API only returns published events, so
            drafts and cancellations are not reachable from here.
          </p>
        </div>
      </div>

      {/*
        The filter bar. Three controls, three different components, chosen for
        the shape of the data rather than for variety: free text is an Input,
        a long server-supplied list is a Combobox, and three fixed orderings are
        a native Select.
      */}
      <div className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
        <Input
          label="Search"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="Title, venue or description"
          hint="Matches the title, the venue name and the description."
          iconStart={
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
          }
        />

        <Combobox
          label="City"
          options={cityOptions}
          value={city}
          onChange={(next) => setParam({ city: next })}
          placeholder="Any city"
          emptyMessage="No city with that name has a published event"
        />

        <Select
          label="Sort by"
          options={[
            { value: 'date', label: 'Date, soonest first' },
            { value: 'price', label: 'Price, lowest first' },
            { value: 'relevance', label: 'Relevance' },
          ]}
          value={sort}
          onChange={(event) => setParam({ sort: event.target.value })}
          hint="The three orderings the API supports."
        />

        <Button
          variant="ghost"
          disabled={!hasFilters}
          onClick={() => {
            setDraftQuery('');
            setParams(new URLSearchParams(), { replace: true });
          }}
          className="lg:mb-[26px]"
        >
          Clear filters
        </Button>
      </div>

      {degraded ? (
        <Banner tone="warning" title="Search is running degraded">
          Elasticsearch is unreachable, so these results came from the database. There is no ranking
          and no fuzzy matching, so a misspelled search will find nothing rather than the near miss
          it would normally find.
        </Banner>
      ) : null}

      {failed ? (
        <Banner
          tone="danger"
          title="The events list could not be loaded"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setParam({ _r: String(Date.now()) })}
            >
              Try again
            </Button>
          }
        >
          {failed}
        </Banner>
      ) : null}

      {/*
        A failed load replaces the table rather than emptying it. An empty table
        with its headers still showing says "zero results matched", which is a
        different and untrue statement about the catalogue.
      */}
      {failed ? null : (
        <Table
          columns={columns}
          rows={result?.items ?? []}
          getRowId={(event) => event.eventId}
          caption="Events on sale"
          loading={loading}
          skeletonRows={PAGE_SIZE}
          sort={tableSort}
          onSortChange={(next) => setParam({ sort: sortForColumn[next.key] ?? 'date' })}
          onRowActivate={(event) => navigate(`/events/${event.slug}`)}
          empty={
            hasFilters
              ? {
                  title: 'No events match these filters',
                  description:
                    'Try a shorter search term, or clear the city filter. Only published events are in the catalogue.',
                  action: (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDraftQuery('');
                        setParams(new URLSearchParams(), { replace: true });
                      }}
                    >
                      Clear filters
                    </Button>
                  ),
                }
              : {
                  title: 'The catalogue is empty',
                  description:
                    'No events are published yet. Run npm run seed in the ticketing repo to load the sample catalogue.',
                }
          }
        />
      )}

      {result && result.totalPages > 1 ? (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          onPageChange={(next) => setParam({ page: String(next) })}
          disabled={loading}
          totalLabel={`${result.total} event${result.total === 1 ? '' : 's'}`}
          label="Events pages"
        />
      ) : null}
    </div>
  );
}
