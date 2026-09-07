# @ysebaei/concrete-ui

## 0.1.0

### Minor Changes

- bce1deb: Add `Banner`, an inline message about a condition.

  A toast reports an event: something happened, you may have missed it, here it is
  for six seconds. A banner reports a state that is true right now and stays on
  screen until it stops being true. The test is whether the message is still true
  in a minute.

  This came out of building the console, which had to report degraded search in a
  toast because there was nothing else. The message was gone six seconds later
  while still being true.

  Five tones, an optional dismiss and one action slot. `role="alert"` for the
  danger tone and `role="status"` for the rest, with `announce={false}` for a
  banner that is part of the page from the start. Colour is never the only
  carrier: a 3px bar in the full tone colour meets the 3:1 in WCAG 1.4.11 that the
  tinted background cannot, a drawn glyph backs it up, and the title says what
  happened.

- 3d851af: First release of Concrete.

  Thirteen components built on a token layer where light and dark are two mappings
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

### Patch Changes

- ad3cdb2: Fix `Modal` ignoring Escape when it is pressed before focus has moved into the
  dialog.

  Escape was handled by a keydown listener on the dialog element, which only fires
  once focus is inside it. Focus is moved in on the next animation frame, so there
  was a window between the dialog mounting and that frame in which the keypress
  landed on whatever had focus before and the dialog never saw it.

  It is now handled on the document, guarded two ways: a keypress a control inside
  the dialog has already called `preventDefault` on is left alone, so an open
  Combobox closing its listbox on Escape no longer closes the dialog behind it as
  well, and only the dialog opened last responds, so one Escape closes one dialog.
