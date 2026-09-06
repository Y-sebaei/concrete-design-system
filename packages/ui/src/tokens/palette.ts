/**
 * The primitive ramps. Every colour in Concrete comes from this file and
 * nowhere else.
 *
 * Two rules govern the ramps:
 *
 * 1. No step is a pure grey. The neutral ramp is warm concrete pulled a few
 *    degrees toward the moss accent, so a surface and the accent sitting on it
 *    read as members of the same family rather than as two unrelated colours.
 *    Pure grey next to a saturated accent is the single most reliable way to
 *    make an interface look unfinished.
 *
 * 2. Steps are numbered by lightness, not by usage. `concrete[100]` means "the
 *    third lightest step", not "the app background". Which step plays which
 *    role is decided once, in semantics.ts, and differs between light and dark.
 *    That separation is what lets one ramp produce both themes.
 */

export type Ramp = Readonly<Record<number, string>>;

/** Warm neutral, hue held near 75, chroma low but never zero. */
export const concrete = {
  0: '#faf9f5',
  50: '#f1f0ea',
  100: '#e6e5dd',
  200: '#d6d6cb',
  300: '#bebfb2',
  400: '#9c9e90',
  500: '#7b7e71',
  600: '#5f6357',
  700: '#474b42',
  800: '#33362f',
  850: '#2b2e27',
  900: '#23261f',
  950: '#171a15',
} as const satisfies Ramp;

/** The primary accent. Deep enough to carry white text at 500. */
export const moss = {
  50: '#e9f1eb',
  100: '#cee1d5',
  200: '#a8c8b4',
  300: '#7cab90',
  400: '#4e8767',
  500: '#2e5e45',
  600: '#264e39',
  700: '#1e3e2e',
  800: '#172f23',
  900: '#102118',
} as const satisfies Ramp;

/** Attention, not danger. Holds about to expire, degraded search, stale data. */
export const amber = {
  50: '#fbf2e2',
  100: '#f5e0b8',
  200: '#e9c37c',
  300: '#d4a447',
  400: '#bf8724',
  500: '#a96c12',
  600: '#8c5810',
  700: '#6e450d',
  800: '#52330a',
  900: '#382306',
} as const satisfies Ramp;

/** Danger. Failed requests, cancelled events, destructive actions. */
export const rust = {
  50: '#faece8',
  100: '#f3d2c9',
  200: '#e5aa98',
  300: '#d18068',
  400: '#b95b43',
  500: '#a33b28',
  600: '#883021',
  700: '#6b261a',
  800: '#4f1c13',
  900: '#36130d',
} as const satisfies Ramp;

/** Informational and live. The socket is connected, this row just changed. */
export const slate = {
  50: '#e8f1f6',
  100: '#c8dfe9',
  200: '#99c1d4',
  300: '#659fb9',
  400: '#3f7e9d',
  500: '#33627f',
  600: '#2a5268',
  700: '#204052',
  800: '#18303d',
  900: '#102029',
} as const satisfies Ramp;

export const ramps = { concrete, moss, amber, rust, slate } as const;
export type RampName = keyof typeof ramps;

/** A reference into a ramp, e.g. `['concrete', 100]`. */
export type Swatch = readonly [RampName, number];

export function resolve([name, step]: Swatch): string {
  const value = (ramps[name] as Ramp)[step];
  if (!value) throw new Error(`no such swatch: ${name}.${step}`);
  return value;
}
