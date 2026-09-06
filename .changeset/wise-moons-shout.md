---
'@y-sebaei/concrete-ui': minor
---

First release of Concrete.

Twelve components built on a token layer where light and dark are two mappings
over one set of ramps rather than two hand-maintained palettes. Modal and
Combobox are written by hand against the ARIA authoring practices rather than
wrapped around a headless library.

- Button, Input, Select, Combobox, Modal, Toast, Table, Pagination, Tabs, Badge,
  Card, Skeleton.
- Every semantic colour pair is checked against WCAG AA in both themes by
  `npm run contrast`, which fails the build.
- Components contain no `dark:` variants. The semantic layer is re-exported to
  Tailwind through `@theme inline`, so `bg-surface-app` follows the theme on its
  own and the two themes cannot drift.
