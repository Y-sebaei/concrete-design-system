# Concrete

An accessible React component library and design system for dense operator
interfaces, plus the box office console it was built against.

Light and dark are two mappings over one set of colour ramps, so no component in
the library contains a `dark:` variant and the two themes cannot drift. Every
semantic colour pair is checked against WCAG AA in both themes by a script that
fails the build. The modal and the combobox are written by hand against the ARIA
authoring practices rather than wrapped around a headless library.

- **[DESIGN.md](DESIGN.md)** covers the direction, what was rejected, and the
  six things the build proved wrong.
- **Storybook** documents every component and renders the palette, both type
  scales, the spacing ramp and the motion tokens as live specimens.

```
packages/ui        @y-sebaei/concrete-ui, the published package
apps/console       boxoffice-console, a client for the event ticketing API
e2e                keyboard-only Playwright runs against a built Storybook
```

## Install

```bash
npm install @y-sebaei/concrete-ui
```

React 18 is a peer dependency. Import the stylesheet once, at your entry point:

```ts
import '@y-sebaei/concrete-ui/styles.css';
```

That is the whole setup. The package ships compiled CSS, so **Tailwind is not
required** in the consuming application. If you do use Tailwind and want to
write `bg-surface-raised` in your own markup, import the token layer into your
Tailwind entry as well:

```css
@import 'tailwindcss';
@import '@y-sebaei/concrete-ui/tokens.css';
```

The two typefaces are a separate optional import, so you can self-host them
instead:

```ts
import '@y-sebaei/concrete-ui/fonts.css';
```

## Theming

Three states, because that is what a real preference control needs.

```html
<html>
  <!-- follows the operating system -->
  <html data-theme="light">
    <!-- pinned light -->
    <html data-theme="dark">
      <!-- pinned dark -->
    </html>
  </html>
</html>
```

Nothing else is required. `bg-surface-app` resolves to
`var(--ui-surface-app)`, and that variable is rebound by the attribute.

### Overriding tokens

Rebind the semantic layer, not the component. Every role is a CSS custom
property on `:root`:

```css
:root {
  --ui-accent: #1d4ed8;
  --ui-accent-hover: #1e40af;
  --ui-focus-ring: #1e3a8a;
}

:root[data-theme='dark'] {
  --ui-accent: #93c5fd;
}
```

Both themes have to be set. That is deliberate: the point of the system is that
a role is bound once per theme, and a consumer who rebinds only light gets a
dark theme that has silently stopped matching.

`@y-sebaei/concrete-ui/tokens` exports the ramps, the scales and the contrast
helpers if you would rather generate your own layer from them:

```ts
import { tokens } from '@y-sebaei/concrete-ui';

tokens.contrastRatio(
  tokens.resolve(tokens.light.text),
  tokens.resolve(tokens.light['surface-app']),
);
// 12.1
```

## A real usage example

This is the events table from the console, trimmed but not rewritten. The whole
screen is library components.

```tsx
import { Badge, Pagination, Table, type TableColumn } from '@y-sebaei/concrete-ui';
import { Link } from 'react-router-dom';

const columns: TableColumn<EventDocument>[] = [
  {
    key: 'title',
    header: 'Event',
    // A real link, not just a row click. Table's onRowActivate is a pointer
    // convenience and does not make the row keyboard operable.
    cell: (event) => (
      <Link to={`/events/${event.slug}`} className="cui-focus block truncate font-medium">
        {event.title}
      </Link>
    ),
  },
  { key: 'city', header: 'City', hideBelow: 'md', cell: (event) => event.city },
  {
    key: 'startsAt',
    header: 'Starts',
    // Only set sortable where the data source can really order by the column.
    sortable: true,
    cell: (event) => <span className="cui-tnum">{when(event.startsAt)}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (event) => <Badge tone="success" dot>{event.status}</Badge>,
  },
  {
    key: 'minPrice',
    header: 'From',
    numeric: true,
    sortable: true,
    cell: (event) => money(event.minPriceCents, event.currency),
  },
];

<Table
  columns={columns}
  rows={result.items}
  getRowId={(event) => event.eventId}
  caption="Events on sale"
  loading={loading}
  sort={sort}
  onSortChange={setSort}
  empty={{
    title: 'No events match these filters',
    description: 'Try a shorter search term, or clear the city filter.',
    action: <Button variant="secondary" onClick={clear}>Clear filters</Button>,
  }}
/>

<Pagination
  page={result.page}
  totalPages={result.totalPages}
  onPageChange={goToPage}
  totalLabel={`${result.total} events`}
/>
```

`empty` is required and takes a title and a description, not an optional string.
A component that lets you ship "No data" will get shipped with "No data".

## Components

Button, Input, Select, Combobox, Modal, Toast, Banner, Table, Pagination, Tabs,
Badge, Card, Skeleton.

Two are worth calling out because the pattern is the point.

**Modal** stores the focused element, moves focus in, wraps Tab and Shift+Tab
against a tabbable list recomputed on every keypress, catches focus arriving
from the browser chrome with a document-level `focusin` listener, and restores
focus on close, falling back to `body` if the trigger has since been unmounted.
Scroll locking is reference counted, so two overlapping overlays cannot leave
the page permanently unscrollable.

**Banner** and **Toast** split on one distinction. A toast reports an event:
something happened, you may have missed it, here it is for six seconds. A banner
reports a state that is true right now and stays on screen until it stops being
true. The test is whether the message is still true in a minute.

**Combobox** is an editable combobox with list autocomplete. `role="combobox"`
is on the input, not a wrapper, which changed in ARIA 1.2 and is the most common
thing to get wrong when copying an older example. Arrow keys move
`aria-activedescendant` and never DOM focus, so the user can keep typing.
Optional inline autocomplete completes forwards and, importantly, deletes
backwards. The result count goes to a polite live region because screen readers
announce the active option automatically and never announce the count.

## Running it

```bash
npm install
npm run dev:ui          # Storybook on 6006
```

The console needs the ticketing API. That is a separate repository, unmodified
by this one:

```bash
cd ../event-ticketing-platform && npm run up && npm run seed
cd ../concrete-design-system && npm run dev:console   # port 5174
```

Point it elsewhere with `VITE_API_URL`.

### A note if you keep this inside OneDrive

OneDrive dehydrates files it has synced into cloud placeholders, and some tools
enumerate a directory without hydrating what they find. Playwright silently
reported "No tests found" for two spec files that `grep`, `esbuild` and every
editor could read perfectly well; a byte-identical copy under a new name was
discovered immediately. Rewriting the file in place fixes it until OneDrive
dehydrates it again.

Nothing in the repository works around this, because it is not a repository
problem and CI never sees it. If a tool insists a file is not there, check
whether it is a placeholder before believing it.

To watch live inventory arrive over the socket, open an event and run
`node scripts/demo-checkout.mjs` in the ticketing repo. The remaining count
changes without a refresh, the row flashes, and the change is announced.

## Checks

```bash
npm run contrast        # every declared colour pair, both themes
npm run tokens:check    # the committed CSS matches its TypeScript source
npm test                # unit, accessibility and token suites
npm run e2e             # keyboard-only modal and combobox, in a real browser
npm run lint
npm run typecheck
```

229 unit, accessibility and token tests. 110 contrast pairs. 20 Playwright
tests. CI runs all of it plus a build of the published package.

Accessibility is checked three ways, because each catches what the others
cannot. `eslint-plugin-jsx-a11y` runs as errors and catches static markup
mistakes. `axe` runs over every component in the states that differ
structurally, including an open dialog and an open listbox, because a rest-state
sweep would pass while the states that do the real ARIA work failed. Colour
contrast is checked against the token source rather than through axe, because
jsdom resolves no cascade and axe's colour rules have nothing real to measure
there.

## Findings from building the console

The most useful output of the exercise. Two kinds: things the ticketing API
cannot do that the console wanted, and things the library could not express.

### The API

**1. There is no endpoint that lists orders, so the Orders screen cannot show
all orders.** `GET /orders/:id` requires an access token issued once at
checkout, and returns the same 404 for a missing order as for a wrong token so
it cannot be used to enumerate ids. That is correct for a public API and leaves
an operator console with nothing to page through.

_Decided:_ the console keeps an operator-side registry of orders it has issued
or been handed, in `localStorage`, and the combobox searches that. Honest
consequences, all in `lib/orderRegistry.ts`: the registry is per browser, orders
taken through the storefront never appear, and clearing site data loses tokens
that cannot be reissued. Doing it properly needs an authenticated `GET /orders`
in the other repo, which this project is not allowed to modify.

**2. Only three columns can be sorted.** `GET /events` orders by `relevance`,
`date` or `price`. Event, Venue and City are therefore plain headers.

_Decided:_ leave them unsortable. Sorting the twelve rows currently on screen by
title looks like it worked and is wrong from page two onward, and the operator
has no way to tell. `Table` only renders a sort control where `sortable` is set,
so the absence is visible rather than silent.

**3. Draft and cancelled events are unreachable.** The catalogue endpoint filters
to `status = 'published'`. A box office arguably wants to see a draft before it
goes on sale.

_Decided:_ say so on the screen rather than pretend the catalogue is everything.
The Badge component supports the draft and cancelled tones already, for when the
API can return them.

**4. Fulfilment is asynchronous and only observable over the socket.** An order
is `paid` immediately and `fulfilled` when a Kafka consumer finishes. Polling
would be the obvious way to notice.

_Decided:_ subscribe to `order:updated` per order. Not a gap, but worth
recording as the reason the Orders screen holds a socket subscription per row.

### The library

**5. No inline banner, and the degraded-search notice went to a Toast instead.
Fixed.** When Elasticsearch is unreachable the API answers from Postgres and
says so in `source`. That is a _condition_, not an event: it stays true until
the stack recovers, and a toast that disappears after six seconds is the wrong
shape for it. The operator spent the rest of the session looking at unranked
results with nothing on screen to say so.

_Decided:_ this was the one finding worth acting on rather than recording, so
`Banner` now exists and the console uses it. Working on it surfaced a second
problem in the same screen: a failed load was reporting itself three times, in a
toast, in a banner and in the table's empty state. A failed load is a standing
condition too, so it now gets the banner alone, and the table is not rendered at
all rather than showing empty headers that assert zero results matched. The
toasts left in the console are all genuine events: a socket reconnect, an order
reaching fulfilment, a counter sale going through.

**6. No stat tile.** Capacity, Sold and Remaining on the event detail screen are
hand-built from `Card` plus a label and a number.

_Decided:_ accept. It is three lines of composition and a `Stat` component would
be a `Card` with a fixed internal layout, which is the kind of component that
gets forked the first time somebody wants a trend arrow in it.

**7. No layout primitive for a filter bar.** Aligning a button's baseline with
the input beside it, when the input has a label and a hint above and below,
needs a hand-tuned bottom margin. The console carries `lg:mb-[26px]`, which is
the height of the hint line, in exactly one place.

_Decided:_ accept, and flag it. A `Field.Row` that distributes label, control and
hint across a row would fix it properly. A magic number in one file is cheaper
than a layout component designed from one example.

**8. `Table` cannot make a row keyboard operable, and initially the console was
broken because of it.** `onRowActivate` is wired to `onClick` only. The events
table shipped with no way for a keyboard user to open an event at all: the sort
buttons and the pagination were reachable and the rows were not.

_Decided:_ fix the console and document the contract, rather than change the
component. Giving the row a tabindex and a key handler would put a tab stop on
every row and announce each as a button, which on a twelve-row page is twelve
identical stops. The accessible answer is a real control in one cell, a link if
it navigates and a button if it opens something, with the row click duplicating
it for a pointer. `onRowActivate` now says so in its own JSDoc, because a prop
that quietly requires something of you should say what.

**9. `Select` could not be used for the ticket type picker at first.** The label
needed to be a composed string with a price and a remaining count. It works, but
the component takes `{ value, label }` where `label` is a string, so anything
richer than text is impossible.

_Decided:_ accept. A render prop here would mean giving up the native `<option>`,
and the native control is the whole reason to reach for `Select` over `Combobox`.

## Releasing

Changesets. Add one with `npm run changeset` for anything that reaches the
published package.

Token value changes are a **major** bump, not a minor one. A design system's
rendered output is its API: moving a ramp step moves every surface that
references it, and a consumer on a caret range would get that without asking.

## Licence

MIT.
