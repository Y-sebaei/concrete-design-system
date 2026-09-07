# Concrete

An accessible React component library for dense operator interfaces.

Light and dark are two mappings over one set of colour ramps, so no component
contains a `dark:` variant and the two themes cannot drift. Every semantic
colour pair is checked against WCAG AA in both themes by a script that fails the
build. The modal and the combobox are written by hand against the ARIA authoring
practices rather than wrapped around a headless library.

Thirteen components: Button, Input, Select, Combobox, Modal, Toast, Banner,
Table, Pagination, Tabs, Badge, Card, Skeleton.

The full write-up, including the design direction and the list of things that
turned out to be wrong once it was on screen, is in the
[repository](https://github.com/Y-sebaei/concrete-design-system).

## Install

```bash
npm install @y-sebaei/concrete-ui
```

React 18 is a peer dependency, and the package is **ESM only**: it declares no
`require` condition, so a CommonJS consumer gets
`ERR_PACKAGE_PATH_NOT_EXPORTED` rather than a confusing runtime error. Any
current bundler is fine. Import the stylesheet once, at your entry point:

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

The two typefaces, Schibsted Grotesk and Newsreader, are a separate optional
import so you can self-host them instead:

```ts
import '@y-sebaei/concrete-ui/fonts.css';
```

## Theming

Three states, because that is what a real preference control needs.

```text
<html>                       follows the operating system
<html data-theme="light">    pinned light
<html data-theme="dark">     pinned dark
```

Nothing else is required. `bg-surface-app` resolves to `var(--ui-surface-app)`,
and that variable is rebound by the attribute.

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

Both themes have to be set. That is deliberate: a role is bound once per theme,
and a consumer who rebinds only light gets a dark theme that has quietly stopped
matching.

`@y-sebaei/concrete-ui/tokens` exports the ramps, the scales and the contrast
helpers if you would rather generate your own layer from them.

## Usage

```tsx
import { Badge, Banner, Pagination, Table, type TableColumn } from '@y-sebaei/concrete-ui';

const columns: TableColumn<Event>[] = [
  {
    key: 'title',
    header: 'Event',
    // A real link, not just a row click. onRowActivate is a pointer
    // convenience and does not make the row keyboard operable.
    cell: (event) => <a href={`/events/${event.slug}`}>{event.title}</a>,
  },
  { key: 'city', header: 'City', hideBelow: 'md', cell: (event) => event.city },
  {
    key: 'startsAt',
    header: 'Starts',
    // Only set sortable where the data source can really order by the column.
    sortable: true,
    cell: (event) => event.startsAt,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (event) => (
      <Badge tone="success" dot>
        {event.status}
      </Badge>
    ),
  },
  { key: 'price', header: 'From', numeric: true, cell: (event) => event.price },
];

<Table
  columns={columns}
  rows={events}
  getRowId={(event) => event.id}
  caption="Events on sale"
  loading={loading}
  empty={{
    title: 'No events match these filters',
    description: 'Try a shorter search term, or clear the city filter.',
  }}
/>;
```

`empty` is required and takes a title and a description, not an optional string.
A component that lets you ship "No data" will get shipped with "No data".

## A few components worth knowing about

**Modal** stores the focused element, moves focus in, wraps Tab and Shift+Tab
against a tabbable list recomputed on every keypress, catches focus arriving
from the browser chrome with a document-level `focusin` listener, and restores
focus on close, falling back to `body` if the trigger has since been unmounted.
Escape is handled on the document, so it works before focus has moved in.
Scroll locking is reference counted, so two overlapping overlays cannot leave
the page permanently unscrollable.

**Combobox** is an editable combobox with list autocomplete. `role="combobox"`
is on the input, not a wrapper, which changed in ARIA 1.2 and is the most common
thing to get wrong when copying an older example. Arrow keys move
`aria-activedescendant` and never DOM focus, so the user can keep typing. The
result count goes to a polite live region, because screen readers announce the
active option automatically and never announce the count.

**Banner** and **Toast** split on one distinction. A toast reports an event:
something happened, you may have missed it, here it is for six seconds. A banner
reports a state that is true right now and stays on screen until it stops being
true. The test is whether the message is still true in a minute.

**Select** is a styled native `<select>`, and it is the right answer more often
than it looks. It inherits the platform picker, keyboard type-ahead, and correct
behaviour in every assistive technology. Reach for Combobox only when the list
is long enough that scanning it is the bottleneck, or when the options come from
a server.

## Licence

MIT.
