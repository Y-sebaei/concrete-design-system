# Concrete: the direction, and why

This records what was decided, what was rejected, and the handful of decisions
that turned out to be wrong once the thing was on screen.

## The brief this answers

The previous project looked like software nobody designed: near-black ground,
one orange accent, Inter, twelve CSS variables, unstyled native inputs. That
happened because nothing in its brief said how it should look, so nothing did.
This time the visual direction was chosen before any code, with acceptance
criteria, and the criteria were checked rather than asserted.

Three directions were proposed. This is the third.

## Concrete, in one paragraph

Mid-tone rather than light or dark. Elevation is a tonal step, never a shadow.
Radius is a function of how big a thing is rather than a value picked per
component. Two typefaces with one rule about which is which: Schibsted Grotesk
for anything you operate, Newsreader for anything you read. The neutrals are
warm concrete pulled a few degrees toward the moss accent, so no step in the
system is a true grey. The personality is unhurried and physical, like
well-made municipal equipment that expects to still be in service in fifteen
years.

## What was rejected

### The two other directions

**Drafting Table** was light, engineered and hairline-thin: ultramarine accent,
Archivo over IBM Plex Sans, near-zero radius, no shadows at all, depth drawn
with 1px rules. It was the safest of the three and the one most likely to end
up looking like every other developer tool with a blue accent.

**Marquee** was dark and chromatic: a deep ink-teal ground rather than a
near-black one, coral and brass as two accents, Bricolage Grotesque set narrow
over Instrument Sans, and screenprint registration shadows with zero blur. It
had the most personality and the least room for a data-dense screen. A console
is mostly table, and a table set on a loud ground is a table nobody can read
for eight hours.

Concrete was chosen because the mid-tone ground is the part that makes it
unusual, and because a tonal elevation model is a harder constraint to work
inside than a shadow. Constraints that bite produce systems; constraints that
do not produce style guides.

### Things ruled out before starting

The brief ruled these out and they stayed out: Inter, Space Grotesk and Roboto
as a primary face; a near-black ground with a single neon accent; a
purple-to-blue gradient; warm cream with a serif display and a terracotta
accent; one medium rounded corner on everything; emoji as icons or section
markers.

Worth adding what else was ruled out and why:

**Wrapping Radix or Headless UI.** The ARIA work is the skill on display. A
wrapper demonstrates that somebody else got the pattern right. The modal and the
combobox are written by hand against the authoring practices, and the bugs found
doing it are in the git log.

**A second green for success.** In a box office, "this worked" and "this is the
house colour" are the same green. A second unrelated green would be one green
too many, so `success` maps to the same ramp steps as `accent`.

**Red for an expired hold.** An expired hold is the inventory sweeper doing its
job and returning seats to the pool. Colouring routine housekeeping as a failure
is how operators learn to ignore red.

## The five decisions that shaped everything else

### 1. Light and dark are two mappings over one ramp

`palette.ts` holds the ramps. `semantics.ts` binds roles to steps, twice, and
contains no hex value at all:

```ts
export const light = {
  'surface-app': ['concrete', 100],
  accent: ['moss', 500],
};

export const dark = {
  'surface-app': ['concrete', 900],
  accent: ['moss', 300],
};
```

Changing `concrete[800]` moves every dark surface that references it. There is
no second palette to drift.

The accent lightens in dark mode rather than staying put. A fill that carries
white text on paper cannot also carry dark text on ink, and keeping one value
for both is the usual reason a dark theme misses AA.

### 2. No component contains a `dark:` variant

The semantic layer is re-exported to Tailwind through `@theme inline`, so
`bg-surface-app` compiles to `background-color: var(--ui-surface-app)` and
follows the theme on its own. Not one component in the library has a
theme-conditional class. That is the mechanical reason the two themes cannot
disagree: there is no code path where they could.

Three theme states, not two. Explicit light, explicit dark, and follow-the-system
when no attribute is set, which is what a real preference control needs.

### 3. Elevation is tone, and light mode has no shadows

Four surface levels: `sunken`, `app`, `raised`, `overlay`. In light mode they
run 200, 100, 50, 0 and in dark mode 950, 900, 850, 800, which is the same
model in the opposite direction. Dark mode adds exactly one soft shadow, for
overlays, because past a certain distance from the page a tonal step alone
stops reading as "in front of".

**This changed during the build.** The proposal promised five tonal levels.
Four shipped, because by the fourth step two adjacent surfaces are not reliably
distinguishable on a mediocre monitor. Selected and active states use an accent
tint instead, which is a better answer anyway: a tint says "chosen" where another
grey step only says "different".

The modal is the slowest thing in the system at 320ms, and that is a consequence
of this model rather than a taste call. A system with no shadow in light mode has
only a tonal step and a scrim to announce a dialog with, and both are quiet
enough to need a little more time. A direction built on drop shadows could open a
dialog in 200ms and still read clearly.

### 4. Radius is a function of size

```
full bleed (table shell, toolbar)  ->  0
under 32px tall (badges, chips)    ->  3
32 to 44px (inputs, buttons)       ->  6
cards, panels, popovers, listboxes ->  10
modals and sheets                  ->  16
```

Two reasons. A fixed radius looks tighter as an element grows, so holding one
value across a 16px badge and a 640px modal makes the modal look sharper than
the badge even though the number is identical. And a rounded corner on an
element flush with the viewport has nothing to be rounded against; it reads as a
rendering mistake rather than a decision.

The rule is exported as `radiusForHeight()` so a consumer can apply it to
something the library does not ship.

### 5. The focus ring is two layers

An inner 2px band in the colour of whatever surface the control sits on, then a
2px outer band in the focus colour.

A single-colour ring has to clear 3:1 against both the page behind the control
and the control's own fill. No one colour does that on a filled primary button,
a ghost button on a card, and a selected row, all at once. Putting the surface
colour between the control and the ring turns one impossible constraint into two
easy ones, and both are in the contrast contract.

Every component that establishes a surface republishes
`--ui-focus-ring-offset` as its own background, so a button inside a card gets
an inner ring in the card's tone. That is why the treatment survives nesting.

The outer band is an `outline` rather than a third `box-shadow`, because an
outline is never clipped by an ancestor's overflow, and this library puts
focusable controls inside a horizontally scrolling table.

## Typography

**Schibsted Grotesk** for the interface. Drawn for newspaper interfaces, which is
this exact problem: it has to survive at 13px in a dense table row and still have
character at 29px heading a page, without a second display family.

**Newsreader** for prose. A screen-first text serif with low stroke contrast and
a wide roman, set at 17px over a 65 character measure.

Two scales, not one. The interface runs 11/13/15/17/20/24/29 on a 1.2 ratio and
prose runs 17/21/27/33/41 on 1.25. Prose starts higher because documentation is
read continuously and a table cell is scanned.

Tracking tightens as size grows, from +0.06em on the 11px label to -0.025em at
41px. That is the optical correction that makes a scale look drawn rather than
scaled: letterforms at 41px have proportionally more space between them than the
same forms at 15px, so leaving tracking at 0 makes every heading look loose.

Numerals are proportional by default and tabular where they align. `Table`
applies tabular figures to every numeric column and `Pagination` to the page
numbers, which covers the places digits are actually read down a column.

## What the build proved wrong

Six things were wrong. Five were found by running the thing rather than by
reading it, which is the argument for doing both.

### The contrast contract failed 14 of its first 108 pairs

Not close calls. `text-subtle` was at 3.28:1 against the app surface, and
`border-strong` at 2.16:1 for something WCAG 1.4.11 requires to clear 3:1. Four
role assignments moved a ramp step.

Three of the failures were the test being wrong rather than the colours. They
checked the focus ring directly against a filled button, which the two-layer
ring never puts adjacent. The tempting fix for a rule like that is to lower its
threshold, which quietly removes the check that was working. They were replaced
with the pairs that actually touch.

### tailwind-merge was deleting the font size from most of the library

Concrete renames the type scale, so tailwind-merge does not recognise
`text-dense` as a size and files it under text colour, in the same conflict
group as `text-text`. Every element carrying both a size and a colour, which is
nearly all of them, silently lost its size and inherited the parent's.

This is worth dwelling on, because nothing caught it. Every unit test passed.
Every axe check passed. The type scale was correct in the token source and
correct in the compiled CSS. It reads as a design that is slightly off rather
than as a bug, and it was found by opening a browser and inspecting one table
cell. `cn` now extends the merge configuration from the token source, and
`cn.test.tsx` locks every step of the scale against it.

### The combobox's active option was invisible

`accent-bg` was moss.50, which sits at 1.09:1 against the surface behind it. The
hover tint on a table row was 1.005:1, which is nothing at all. Correct in the
accessibility tree, invisible on screen.

Two changes. The light tinted surfaces moved one ramp step deeper, and the
active option gained a 2px accent bar as its real state indicator. A tint cannot
meet the 3:1 that WCAG 1.4.11 asks of a state indicator without ceasing to be a
tint, so the bar does that job and the tint reinforces it.

The contrast contract grew a third threshold for this: 1.15, labelled in the
source as a design floor and explicitly not a WCAG number. Dressing a design
threshold up as a standards one is worse than not having it.

### The scroll lock was not reference counted

Two overlaps and the page is permanently unscrollable, because the second lock
saves `hidden` as the value to restore. It showed up as a test that failed
about one run in three, which is the kind of thing that gets marked flaky and
retried.

### Tabular figures as a document default put a gap before every comma

The first version set `font-variant-numeric: tabular-nums` on `html`, reasoning
that roughly half an operator interface is digits in a column so the default
should serve the common case.

`tabular-nums` does not only affect digits. In most families the comma and the
full stop are numeric separators, set to the same fixed advance so they align in
a column of figures too. Applied to a whole document that puts a visible gap
before every comma in every sentence: "Kreuzberg Jazz Sessions , 42 remaining".
Ten pixels across a twenty-two character string, which is small enough to read
as slightly loose spacing rather than as a defect.

It was found by looking at the rendered type specimen in Storybook, which is
the argument for building that page rather than listing the values. The default
is now proportional and `.cui-tnum` opts in.

### The socket handler computed its diff inside a setState updater

The event detail screen built its set of changed ticket types inside a
`setEvent` updater and read that set on the next line. React does not run an
updater synchronously, so the set was always empty: the counts updated correctly
while the row flash never fired and the live region kept announcing that it was
waiting.

Nothing but running it against a real socket would have found this, and the part
that makes it easy to miss is that the visible numbers were right the whole
time. The diff is now computed against a ref that moves forward with the state.

## What I would change next

**The type scale has one step too many.** `body-lg` at 17px sits between `body`
and `title` and is used in exactly no component. A scale step that nothing
consumes is a decision waiting to be made inconsistently.

**Four surfaces is one short for the console.** The events page wants a toolbar
tone that is neither the page nor a card, and it currently uses `raised` with a
border. A fifth level would need the ramp to gain a step rather than the scale
to gain a name.

**The prose face is doing less work than the pairing promised.** Newsreader sets
documentation and the empty states beautifully and appears almost nowhere else,
because an operator console is not a reading surface. The pairing is right for
the library and slightly oversized for its first consumer.

## What the console asked for and got

The library shipped without an inline banner, and the console had to put a
degraded-search notice into a toast. That was the first entry in the README
findings list and the only one judged worth acting on rather than recording,
because the workaround was visibly wrong rather than merely inelegant: the
message was gone six seconds later while still being true.

`Banner` is the result, and the split it forces is now stated in both
components' documentation. A toast reports an event. A banner reports a state.
The test is whether the message is still true in a minute.

Building it exposed a second problem on the same screen. A failed load was
reporting itself three times over, in a toast, in the new banner, and in the
table's empty state. It is a standing condition too, so it now gets the banner
alone, and the table is not rendered at all rather than showing its headers over
nothing, which asserts that zero results matched. That is a different and untrue
statement about the catalogue.
