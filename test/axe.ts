import { axe, type AxeMatchers } from 'vitest-axe';
import type { RunOptions } from 'axe-core';

/**
 * The project's axe configuration.
 *
 * `color-contrast` is turned off, and that is not a way of dodging it. jsdom
 * does not do layout or cascade resolution, so every colour in these tests
 * resolves to the initial value and axe's contrast check reports either
 * nonsense or "incomplete" for every node. Contrast is verified properly and
 * exhaustively in packages/ui/src/tokens/contrast.ts, which runs against the
 * real token values in both themes and fails CI on its own.
 *
 * Everything else runs, and the WCAG 2.2 AA tag set is included rather than
 * just 2.1, so target-size and focus-appearance are in scope.
 */
export const axeOptions: RunOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
  },
};

export async function checkA11y(container: Element) {
  return axe(container, axeOptions);
}

export type { AxeMatchers };
