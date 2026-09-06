import { defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Three projects, run together by `npm test` and separately in CI.
 *
 * Splitting behaviour from accessibility is not cosmetic. When a run goes red
 * the job name is the first thing anybody reads, and "a11y" failing says
 * something different from "unit" failing: one means a component stopped doing
 * its job, the other means it started excluding someone. Mixed into a single
 * suite an axe regression looks like any other broken test, and gets triaged
 * like one.
 *
 * The tokens project runs in node rather than jsdom. It has no DOM to check;
 * it reads the palette and does arithmetic.
 */
export default defineWorkspace([
  {
    plugins: [react()],
    test: {
      name: 'unit',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['packages/*/src/**/*.test.tsx'],
      exclude: ['**/*.a11y.test.tsx'],
      css: false,
    },
  },
  {
    plugins: [react()],
    test: {
      name: 'a11y',
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      include: ['packages/*/src/**/*.a11y.test.tsx'],
      css: false,
    },
  },
  {
    test: {
      name: 'tokens',
      globals: true,
      environment: 'node',
      include: ['packages/*/src/tokens/**/*.test.ts'],
    },
  },
]);
