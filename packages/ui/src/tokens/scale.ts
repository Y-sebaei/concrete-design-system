/**
 * Everything in the system that is not a colour.
 *
 * Sizes are written in pixels here and emitted as rem, so the numbers stay
 * readable while the output still respects a user's browser font size.
 */

export const REM_BASE = 16;

export const px = (n: number): string => `${n / REM_BASE}rem`;

/* -------------------------------------------------------------------------- */
/* Spacing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Base 4, going non-linear above 32.
 *
 * The small end needs fine control because it sets the density of a table row,
 * where 6px and 8px are genuinely different decisions. The large end does not:
 * once a gap is separating whole regions of a page, 44 and 48 are the same gap,
 * and offering both only invites inconsistency. So the ramp thins out on
 * purpose rather than doubling forever.
 */
export const space = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  6: 24,
  8: 32,
  11: 44,
  16: 64,
  22: 88,
} as const;

export type SpaceStep = keyof typeof space;

/* -------------------------------------------------------------------------- */
/* Radius                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Radius is a function of how big the thing is, not a value picked per
 * component. The rule, in full:
 *
 *   full bleed (table shell, toolbar, page header)  ->  0
 *   under 32px tall (badges, chips, tags)           ->  3, or a pill if the
 *                                                       content is a single
 *                                                       short word
 *   32 to 44px tall (inputs, buttons, select)       ->  6
 *   cards, panels, popovers, listboxes              ->  10
 *   modals and sheets                               ->  16
 *
 * The reason full-bleed elements get 0 is that a rounded corner on an element
 * flush with the viewport has nothing to be rounded against; it reads as a
 * rendering mistake rather than as a decision. The reason the ramp climbs with
 * size at all is that a fixed radius looks tighter as the element grows, so
 * holding one value across a 16px badge and a 640px modal means the modal
 * looks sharper than the badge even though the number is identical.
 */
export const radius = {
  none: 0,
  /** Under 32px tall. */
  sm: 3,
  /** Controls, 32 to 44px tall. */
  md: 6,
  /** Cards, panels, popovers, listboxes. */
  lg: 10,
  /** Modals and sheets. */
  xl: 16,
  full: 9999,
} as const;

/** The rule above, as code, so a consumer can apply it to a custom element. */
export function radiusForHeight(heightPx: number, fullBleed = false): number {
  if (fullBleed) return radius.none;
  if (heightPx < 32) return radius.sm;
  if (heightPx <= 44) return radius.md;
  if (heightPx <= 200) return radius.lg;
  return radius.xl;
}

/* -------------------------------------------------------------------------- */
/* Type                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Two families, two scales, one rule about which is which:
 * Schibsted Grotesk for anything you operate, Newsreader for anything you read.
 *
 * Schibsted Grotesk was drawn for newspaper interfaces, which is exactly this
 * problem: it has to survive at 13px in a dense table row and still have enough
 * character at 29px to head a page, without a second display family.
 *
 * Newsreader is a screen-first text serif with low stroke contrast and a wide
 * roman. It only ever sets prose, always over a measure near 65 characters,
 * which is why the prose scale starts at 17px rather than the interface's 15px.
 * Documentation is read continuously; a table cell is scanned.
 */
export const fonts = {
  ui: "'Schibsted Grotesk Variable', 'Schibsted Grotesk', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
  prose: "'Newsreader Variable', 'Newsreader', ui-serif, Georgia, 'Times New Roman', serif",
  /** Order ids, ticket serials, trace ids. Nothing else. */
  mono: "ui-monospace, 'SF Mono', 'Cascadia Mono', 'Roboto Mono', Menlo, Consolas, monospace",
} as const;

export interface TypeStep {
  readonly size: number;
  readonly leading: number;
  /** em. Negative tightens. */
  readonly tracking: number;
  readonly weight: number;
  readonly family: keyof typeof fonts;
  readonly transform?: 'uppercase';
}

/**
 * Tracking tightens as size grows. This is the optical correction that makes a
 * type scale look drawn rather than scaled: letterforms set at 41px have
 * proportionally more space between them than the same forms at 15px, so
 * leaving tracking at 0 across the scale makes every heading look loose.
 */
export const text = {
  /* Interface scale, ratio 1.2. */
  label: { size: 11, leading: 16, tracking: 0.06, weight: 600, family: 'ui', transform: 'uppercase' },
  dense: { size: 13, leading: 20, tracking: 0, weight: 400, family: 'ui' },
  body: { size: 15, leading: 22, tracking: 0, weight: 400, family: 'ui' },
  'body-lg': { size: 17, leading: 26, tracking: -0.005, weight: 400, family: 'ui' },
  title: { size: 20, leading: 26, tracking: -0.01, weight: 600, family: 'ui' },
  heading: { size: 24, leading: 30, tracking: -0.015, weight: 600, family: 'ui' },
  display: { size: 29, leading: 34, tracking: -0.02, weight: 600, family: 'ui' },

  /* Prose scale, ratio 1.25, Newsreader, always inside a 65ch measure. */
  'prose-body': { size: 17, leading: 29, tracking: 0, weight: 400, family: 'prose' },
  'prose-lead': { size: 21, leading: 30, tracking: -0.01, weight: 400, family: 'prose' },
  'prose-h3': { size: 21, leading: 28, tracking: -0.01, weight: 600, family: 'prose' },
  'prose-h2': { size: 27, leading: 34, tracking: -0.015, weight: 600, family: 'prose' },
  'prose-h1': { size: 33, leading: 38, tracking: -0.02, weight: 600, family: 'prose' },
  'prose-display': { size: 41, leading: 46, tracking: -0.025, weight: 600, family: 'prose' },
} as const satisfies Record<string, TypeStep>;

export type TypeToken = keyof typeof text;

/** The measure. Prose is unreadable much wider than this and childish narrower. */
export const measure = '65ch';

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Four durations, one easing for almost everything.
 *
 * The modal is the slowest thing in the system at 320ms, and that is a
 * consequence of the elevation model rather than a taste call: a system with no
 * shadow in light mode has nothing to fade a dialog in with except its own
 * tonal step and a scrim, so it needs a little more time for the change to be
 * legible. Directions built on drop shadows can afford to be faster.
 */
export const duration = {
  /** A colour tint on hover. Any slower and the control feels sticky. */
  instant: 100,
  /** A control changing state: press, check, toggle. */
  fast: 160,
  /** A popover, a listbox, a toast. */
  medium: 240,
  /** A modal. */
  slow: 320,
} as const;

export const easing = {
  /** Everything, unless there is a reason. */
  standard: 'cubic-bezier(0.3, 0, 0.2, 1)',
  /** Leaving the screen. Starts fast, so dismissal feels immediate. */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Arriving from nothing: listbox, toast. Decelerates hard at the end. */
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/* -------------------------------------------------------------------------- */
/* Control sizes                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Three control heights. 44px is the comfortable one and the only one that
 * meets the WCAG 2.2 target size guidance on its own; 36 and 28 are for dense
 * operator screens where controls sit inside a table row, and they carry a
 * documented caveat rather than being offered as equals.
 */
export const control = {
  sm: { height: 28, paddingX: 8, text: 'dense' },
  md: { height: 36, paddingX: 12, text: 'body' },
  lg: { height: 44, paddingX: 16, text: 'body' },
} as const;

export type ControlSize = keyof typeof control;

/**
 * Dark mode only. In light mode this resolves to `none`, which is the point of
 * the direction: light Concrete has no shadows at all.
 */
export const shadow = {
  overlay: '0 12px 32px -8px rgb(0 0 0 / 0.45), 0 2px 8px -2px rgb(0 0 0 / 0.3)',
  popover: '0 6px 16px -4px rgb(0 0 0 / 0.4)',
} as const;
