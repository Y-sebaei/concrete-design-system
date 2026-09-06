import '@testing-library/jest-dom/vitest';
import * as axeMatchers from 'vitest-axe/matchers';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

expect.extend(axeMatchers);

afterEach(() => {
  cleanup();
});

/*
 * jsdom implements neither of these, and both are load-bearing here.
 *
 * scrollIntoView is called by the Combobox every time the active option
 * changes, which is on every arrow key. Without a stub the first ArrowDown in
 * every combobox test throws, and the failure names scrollIntoView rather than
 * anything to do with the assertion that was being made.
 *
 * matchMedia is read by nothing in the library directly, but Testing Library's
 * user-event and several component tests assert reduced-motion behaviour, and a
 * missing matchMedia surfaces as an unrelated TypeError deep in a render.
 */
Element.prototype.scrollIntoView = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
