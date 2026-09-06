/**
 * Emits src/styles/tokens.css from the TypeScript token source.
 *
 * The generated file is committed, and CI re-runs this and fails if the result
 * differs. That is what stops somebody editing a hex value in the CSS and
 * quietly desynchronising it from the source of truth.
 *
 * WHY THE OUTPUT HAS THREE LAYERS
 *
 * 1. `@theme` holds the primitives: the raw ramps, spacing, radius, type,
 *    motion. These never change between light and dark. Tailwind turns them
 *    into utilities (bg-concrete-100, rounded-lg, duration-medium).
 *
 * 2. `:root` and its dark counterparts hold the semantic layer as plain custom
 *    properties (--ui-surface-app and friends). This is the only place a role
 *    is bound to a step, and it is bound twice: once for light, once for dark.
 *
 * 3. `@theme inline` re-exports the semantic layer to Tailwind. `inline` means
 *    the generated utility emits `var(--ui-surface-app)` rather than baking in
 *    a value, so `bg-surface-app` follows the theme with no `dark:` variant
 *    anywhere. Library components therefore contain zero theme-conditional
 *    classes, which is the main reason the two themes cannot drift.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ramps, resolve, type RampName } from './palette';
import { light, dark, type Theme } from './semantics';
import {
  control,
  duration,
  easing,
  fonts,
  measure,
  px,
  radius,
  shadow,
  space,
  text,
} from './scale';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolvePath(here, '../styles/tokens.css');

const banner = `/*
 * GENERATED FILE. DO NOT EDIT.
 *
 * Produced by src/tokens/generate.ts from palette.ts, semantics.ts and
 * scale.ts. Run \`npm run tokens\` after changing any of those. CI runs
 * \`npm run tokens:check\` and fails if this file is out of date.
 */`;

function semanticBlock(theme: Theme, indent = '  '): string {
  return Object.entries(theme)
    .map(([role, swatch]) => `${indent}--ui-${role}: ${resolve(swatch)};`)
    .join('\n');
}

function rampVars(): string {
  const lines: string[] = [];
  for (const [name, ramp] of Object.entries(ramps) as [RampName, Record<number, string>][]) {
    for (const [step, hex] of Object.entries(ramp)) {
      lines.push(`  --color-${name}-${step}: ${hex};`);
    }
  }
  return lines.join('\n');
}

function spaceVars(): string {
  return Object.entries(space)
    .map(([key, value]) => `  --spacing-${key}: ${value === 0 ? '0' : px(value)};`)
    .join('\n');
}

function radiusVars(): string {
  return Object.entries(radius)
    .map(([key, value]) =>
      key === 'full'
        ? `  --radius-full: 9999px;`
        : `  --radius-${key}: ${value === 0 ? '0' : px(value)};`,
    )
    .join('\n');
}

function typeVars(): string {
  const lines: string[] = [];
  for (const [key, step] of Object.entries(text)) {
    lines.push(`  --text-${key}: ${px(step.size)};`);
    lines.push(`  --text-${key}--line-height: ${px(step.leading)};`);
    lines.push(`  --text-${key}--letter-spacing: ${step.tracking}em;`);
    lines.push(`  --text-${key}--font-weight: ${step.weight};`);
  }
  return lines.join('\n');
}

function motionVars(): string {
  const d = Object.entries(duration).map(([k, v]) => `  --duration-${k}: ${v}ms;`);
  const e = Object.entries(easing).map(([k, v]) => `  --ease-${k}: ${v};`);
  return [...d, ...e].join('\n');
}

function controlVars(): string {
  return Object.entries(control)
    .flatMap(([key, spec]) => [
      `  --control-height-${key}: ${px(spec.height)};`,
      `  --control-padding-${key}: ${px(spec.paddingX)};`,
    ])
    .join('\n');
}

const css = `${banner}

@theme {
  /* ---- Colour primitives -------------------------------------------- */
${rampVars()}

  /* ---- Type families ------------------------------------------------- */
  --font-ui: ${fonts.ui};
  --font-prose: ${fonts.prose};
  --font-mono: ${fonts.mono};

  /* ---- Type scale ---------------------------------------------------- */
${typeVars()}

  /* ---- Spacing ------------------------------------------------------- */
${spaceVars()}

  /* ---- Radius, assigned by element size. See scale.ts. --------------- */
${radiusVars()}

  /* ---- Motion -------------------------------------------------------- */
${motionVars()}

  /* ---- Control geometry ---------------------------------------------- */
${controlVars()}

  /* ---- Measure ------------------------------------------------------- */
  --measure-prose: ${measure};
}

/*
 * The semantic layer.
 *
 * Three theme states, which is what a real preference control needs:
 * explicit light, explicit dark, and "follow the system", the last being what
 * you get when no attribute is set at all.
 */
:root {
${semanticBlock(light)}

  /* Light Concrete has no shadows. Depth is a tonal step. */
  --ui-shadow-overlay: none;
  --ui-shadow-popover: none;

  /* Filled by whichever surface a focusable control is sitting on, so the
     inner half of the focus ring always matches the real background rather
     than a guess. Components that establish a surface reset this. */
  --ui-focus-ring-offset: var(--ui-surface-app);

  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${semanticBlock(dark, '    ')}

    /* Dark mode is the only place shadows exist. Four tonal steps stop
       reading as depth once a surface is far enough from the page. */
    --ui-shadow-overlay: ${shadow.overlay};
    --ui-shadow-popover: ${shadow.popover};
    --ui-focus-ring-offset: var(--ui-surface-app);

    color-scheme: dark;
  }
}

:root[data-theme='dark'] {
${semanticBlock(dark)}

  --ui-shadow-overlay: ${shadow.overlay};
  --ui-shadow-popover: ${shadow.popover};
  --ui-focus-ring-offset: var(--ui-surface-app);

  color-scheme: dark;
}

/*
 * Re-exported to Tailwind. The inline keyword keeps the var() reference in the
 * generated utility, which is what lets bg-surface-app follow the theme with no
 * dark: variant anywhere in the library.
 */
@theme inline {
${Object.keys(light)
  .map((role) => `  --color-${role}: var(--ui-${role});`)
  .join('\n')}

  --shadow-overlay: var(--ui-shadow-overlay);
  --shadow-popover: var(--ui-shadow-popover);
}
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, css, 'utf8');

console.log(`tokens -> ${OUT} (${css.split('\n').length} lines)`);
