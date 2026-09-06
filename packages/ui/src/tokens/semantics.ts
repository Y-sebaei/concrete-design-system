import type { Swatch } from './palette';

/**
 * Semantic roles, expressed twice over one ramp.
 *
 * Neither theme contains a hex value. Both are mappings from a role to a step
 * in a ramp, which is what "light and dark derived from one source" means in
 * practice: changing concrete[800] moves every dark surface that references it,
 * and no hand-maintained second palette can drift out of step with the first.
 *
 * ELEVATION
 * Concrete has no shadows in light mode. Depth is a tonal step: sunken is
 * darker than the app ground, raised and overlay are lighter, and a 1px
 * hairline appears only where two surfaces at the same tone meet. Dark mode
 * runs the same four levels in the opposite direction and adds one soft shadow
 * for overlays, because past a certain distance from the page a tonal step
 * alone stops reading as "in front of".
 *
 * Four levels, not five. Selected and active states use an accent tint rather
 * than a fifth tonal step: by the fourth step the difference between two
 * adjacent surfaces is no longer reliably visible on a mediocre monitor, and a
 * tint says "chosen" where another grey step only says "different".
 */
export type Theme = Readonly<Record<string, Swatch>>;

export const light = {
  /* Surfaces, darkest to lightest. */
  'surface-sunken': ['concrete', 200],
  'surface-app': ['concrete', 100],
  'surface-raised': ['concrete', 50],
  'surface-overlay': ['concrete', 0],
  /* A scrim, not a surface. Opacity is applied where it is used. */
  'surface-scrim': ['concrete', 900],

  /* Text. */
  text: ['concrete', 900],
  /* 700, not 600. 600 misses AA against the sunken surface a table header
     uses, and a column header is the single most-read secondary text in the
     console. */
  'text-muted': ['concrete', 700],
  'text-subtle': ['concrete', 600],
  'text-disabled': ['concrete', 400],
  'text-on-accent': ['concrete', 0],

  /* Hairlines. `border` is decorative and exempt from 1.4.11; `border-strong`
     draws the boundary of a control and has to clear 3:1 on its own. */
  border: ['concrete', 200],
  'border-strong': ['concrete', 500],
  'border-subtle': ['concrete', 100],

  /* Primary accent. */
  accent: ['moss', 500],
  'accent-hover': ['moss', 600],
  'accent-active': ['moss', 700],
  'accent-text': ['moss', 600],
  /* 100, not 50.
     moss.50 has a relative luminance of 0.862 and surface-raised has 0.870, so
     a row tinted with it was very slightly darker than the row beside it and
     read as nothing at all. A tinted surface that cannot be told apart from the
     surface underneath is not a subtle design, it is an absent one. */
  'accent-bg': ['moss', 100],
  'accent-bg-hover': ['moss', 200],
  'accent-border': ['moss', 300],

  /* Danger. */
  danger: ['rust', 500],
  'danger-hover': ['rust', 600],
  'danger-active': ['rust', 700],
  'danger-text': ['rust', 600],
  'danger-bg': ['rust', 100],
  'danger-border': ['rust', 300],

  /* Attention. */
  warning: ['amber', 500],
  'warning-text': ['amber', 700],
  'warning-bg': ['amber', 100],
  'warning-border': ['amber', 300],

  /* Informational and live. */
  info: ['slate', 500],
  'info-text': ['slate', 600],
  'info-bg': ['slate', 100],
  'info-border': ['slate', 300],

  /* Success reuses the primary accent on purpose: in a box office, "this
     worked" and "this is the house colour" are the same green, and a second
     unrelated green would be one green too many. */
  success: ['moss', 500],
  'success-text': ['moss', 600],
  'success-bg': ['moss', 100],
  'success-border': ['moss', 300],

  /* Focus. See generate.ts for why the ring is drawn in two layers. */
  'focus-ring': ['moss', 700],

  /* Skeleton, low and high stop. */
  'skeleton-base': ['concrete', 200],
  'skeleton-sheen': ['concrete', 100],
} as const satisfies Theme;

export const dark = {
  'surface-sunken': ['concrete', 950],
  'surface-app': ['concrete', 900],
  'surface-raised': ['concrete', 850],
  'surface-overlay': ['concrete', 800],
  'surface-scrim': ['concrete', 950],

  text: ['concrete', 50],
  'text-muted': ['concrete', 300],
  'text-subtle': ['concrete', 400],
  'text-disabled': ['concrete', 600],
  'text-on-accent': ['concrete', 950],

  border: ['concrete', 700],
  /* 400, not 500. The overlay surface is the lightest ground in dark mode,
     and 500 lands at 2.96:1 against it. Four hundredths short is still short. */
  'border-strong': ['concrete', 400],
  'border-subtle': ['concrete', 800],

  /* The accent lightens in dark mode rather than staying put. A fill that
     carries white text on paper cannot also carry dark text on ink, and
     keeping one value for both is the usual reason a dark theme fails AA. */
  accent: ['moss', 300],
  'accent-hover': ['moss', 200],
  'accent-active': ['moss', 100],
  'accent-text': ['moss', 200],
  'accent-bg': ['moss', 900],
  'accent-bg-hover': ['moss', 800],
  'accent-border': ['moss', 700],

  danger: ['rust', 300],
  'danger-hover': ['rust', 200],
  'danger-active': ['rust', 100],
  'danger-text': ['rust', 200],
  'danger-bg': ['rust', 900],
  'danger-border': ['rust', 700],

  warning: ['amber', 300],
  'warning-text': ['amber', 200],
  'warning-bg': ['amber', 900],
  'warning-border': ['amber', 700],

  info: ['slate', 300],
  'info-text': ['slate', 200],
  'info-bg': ['slate', 900],
  'info-border': ['slate', 700],

  success: ['moss', 300],
  'success-text': ['moss', 200],
  'success-bg': ['moss', 900],
  'success-border': ['moss', 700],

  'focus-ring': ['moss', 200],

  'skeleton-base': ['concrete', 800],
  'skeleton-sheen': ['concrete', 700],
} as const satisfies Theme;

export type SemanticRole = keyof typeof light & keyof typeof dark;

/**
 * The contrast contract, checked in CI by `npm run contrast`.
 *
 * Every pair here is a combination a component actually produces. The list is
 * maintained by hand on purpose: an automatic sweep of every role against every
 * surface would generate hundreds of pairs nobody renders, and that noise would
 * make a real failure easy to ignore.
 */
export interface ContrastRule {
  readonly fg: SemanticRole;
  readonly bg: SemanticRole;
  /**
   * 4.5 for body text and 3 for non-text boundaries, both from WCAG.
   *
   * 1.15 is not a WCAG threshold and is not presented as one. It is a design
   * floor for a tinted surface: enough of a step that the tinted row is
   * distinguishable from the row beside it. The tint is never the only signal
   * for a state, because a step that small could not carry one on its own; the
   * accent bar and the text colour do that work, and both are checked at 3 and
   * 4.5 below.
   */
  readonly min: 1.15 | 3 | 4.5;
  readonly where: string;
}

/**
 * The four surfaces a component can sit on, and the shorter list of surfaces
 * that secondary text is actually allowed to sit on.
 *
 * `surface-sunken` is a special case. In light mode it is the darkest ground in
 * the system, and it exists for exactly two things: an input well and a table
 * header row. Sweeping every text role across it would flag pairs that no
 * component renders, so the roles that never appear there are declared against
 * the other three instead, and the restriction is enforced by review rather
 * than by the type system. If a component ever does put subtle text on a sunken
 * surface, this list is the thing that was wrong.
 */
const allSurfaces = [
  'surface-app',
  'surface-raised',
  'surface-overlay',
  'surface-sunken',
] as const satisfies readonly SemanticRole[];

const litSurfaces = ['surface-app', 'surface-raised', 'surface-overlay'] as const satisfies readonly SemanticRole[];

function on(
  bgs: readonly SemanticRole[],
  fg: SemanticRole,
  min: 1.15 | 3 | 4.5,
  where: string,
): ContrastRule[] {
  return bgs.map((bg) => ({ fg, bg, min, where }));
}

export const contrastRules: readonly ContrastRule[] = [
  /* Text that can appear anywhere, including inside an input well. */
  ...on(allSurfaces, 'text', 4.5, 'body copy, table cells, input value, labels'),
  ...on(allSurfaces, 'text-muted', 4.5, 'column headers, placeholder text, secondary copy'),

  /* Text that only ever sits on a lit surface. */
  ...on(litSurfaces, 'text-subtle', 4.5, 'timestamps, helper text, empty state body'),
  ...on(litSurfaces, 'accent-text', 4.5, 'links, ghost button label, active tab label'),
  ...on(litSurfaces, 'danger-text', 4.5, 'field error text, destructive ghost button'),
  ...on(litSurfaces, 'warning-text', 4.5, 'hold expiring warning'),
  ...on(litSurfaces, 'info-text', 4.5, 'socket status line'),
  ...on(litSurfaces, 'success-text', 4.5, 'paid and fulfilled status text'),

  /* Non-text contrast, WCAG 1.4.11. */
  ...on(allSurfaces, 'focus-ring', 3, 'outer focus ring against the surface behind the control'),
  ...on(litSurfaces, 'border-strong', 3, 'input and control boundary'),

  /* Labels on filled controls, in all three interaction states. A primary
     button that passes at rest and fails on hover is still a failure: hover is
     where the pointer is, which is where the eye is. */
  { fg: 'text-on-accent', bg: 'accent', min: 4.5, where: 'primary button label' },
  { fg: 'text-on-accent', bg: 'accent-hover', min: 4.5, where: 'primary button label, hover' },
  { fg: 'text-on-accent', bg: 'accent-active', min: 4.5, where: 'primary button label, active' },
  { fg: 'text-on-accent', bg: 'danger', min: 4.5, where: 'destructive button label' },
  { fg: 'text-on-accent', bg: 'danger-hover', min: 4.5, where: 'destructive button label, hover' },
  { fg: 'text-on-accent', bg: 'danger-active', min: 4.5, where: 'destructive button label, active' },

  /* Tinted status surfaces. */
  { fg: 'accent-text', bg: 'accent-bg', min: 4.5, where: 'accent badge, selected combobox option' },
  { fg: 'danger-text', bg: 'danger-bg', min: 4.5, where: 'danger badge, cancelled status' },
  { fg: 'warning-text', bg: 'warning-bg', min: 4.5, where: 'warning badge, pending status' },
  { fg: 'info-text', bg: 'info-bg', min: 4.5, where: 'info badge, live indicator' },
  { fg: 'success-text', bg: 'success-bg', min: 4.5, where: 'success badge, paid status' },

  /*
   * The focus ring on a filled control.
   *
   * The obvious rule to write here is "focus-ring against accent", and it is
   * the wrong rule: those two colours are never adjacent. The ring is drawn in
   * two layers, an inner 2px band in the colour of the surface the control sits
   * on and an outer 2px band in focus-ring, so the pairs that actually touch
   * are surface-against-fill on the inside and focus-ring-against-surface on
   * the outside. The second is already covered above. This is the first.
   *
   * Writing the naive rule instead would have failed the build for a
   * combination no user can see, and the usual fix for that is to lower the
   * threshold, which quietly removes the check that was working.
   */
  { fg: 'surface-app', bg: 'accent', min: 3, where: 'inner focus ring on a filled primary button' },
  { fg: 'surface-app', bg: 'danger', min: 3, where: 'inner focus ring on a filled destructive button' },
  { fg: 'surface-raised', bg: 'accent', min: 3, where: 'inner focus ring, primary button on a card' },
  { fg: 'surface-raised', bg: 'danger', min: 3, where: 'inner focus ring, destructive button on a card' },
  { fg: 'focus-ring', bg: 'accent-bg', min: 3, where: 'focus ring on a selected combobox option' },

  /*
   * The state indicators.
   *
   * The bar down the left of an active combobox option, and the sort arrow on
   * an active column header, are what actually communicate the state, so they
   * carry the WCAG 1.4.11 requirement of 3:1 against the surface behind them.
   * A tint alone cannot meet 3:1 without being dark enough to stop reading as a
   * tint, which is why several design systems quietly fail this.
   */
  { fg: 'accent', bg: 'surface-overlay', min: 3, where: 'active option bar, in a listbox' },
  { fg: 'accent', bg: 'surface-raised', min: 3, where: 'active option bar, on a card' },

  /*
   * The tints themselves, against the surfaces they are laid over. These use
   * the design floor rather than a WCAG threshold, for the reason given on
   * ContrastRule.min above.
   */
  { fg: 'accent-bg', bg: 'surface-overlay', min: 1.15, where: 'active or hovered listbox option' },
  { fg: 'accent-bg', bg: 'surface-raised', min: 1.15, where: 'hovered table row' },
  { fg: 'accent-bg-hover', bg: 'surface-overlay', min: 1.15, where: 'pressed ghost button on an overlay' },
  { fg: 'info-bg', bg: 'surface-raised', min: 1.15, where: 'the flash on a row that just changed' },
];
