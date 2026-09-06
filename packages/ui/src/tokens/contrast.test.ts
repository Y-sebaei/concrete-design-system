import { describe, expect, it } from 'vitest';
import { check, contrastRatio, luminance } from './contrast';
import { concrete, moss, ramps, resolve } from './palette';
import { contrastRules, dark, light, type Theme } from './semantics';

describe('contrast maths', () => {
  it('agrees with the WCAG reference values', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    // The canonical mid grey, 4.54:1 against white.
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#2e5e45', '#faf9f5')).toBeCloseTo(
      contrastRatio('#faf9f5', '#2e5e45'),
      10,
    );
  });

  it('handles shorthand hex', () => {
    expect(luminance('#fff')).toBeCloseTo(luminance('#ffffff'), 10);
  });
});

describe('the contrast contract', () => {
  const results = check();

  it('covers both themes', () => {
    expect(results.filter((r) => r.theme === 'light')).toHaveLength(contrastRules.length);
    expect(results.filter((r) => r.theme === 'dark')).toHaveLength(contrastRules.length);
  });

  it.each(results)(
    '$theme: $fg on $bg is at least $min to 1 ($where)',
    ({ ratio, min, pass, fgHex, bgHex }) => {
      expect(
        pass,
        `${fgHex} on ${bgHex} is ${ratio.toFixed(2)}:1, needs ${min}:1`,
      ).toBe(true);
    },
  );
});

describe('the palette itself', () => {
  it('holds both themes over one ramp, with no hex values in either', () => {
    // The point of the whole arrangement: a theme is a mapping, not a palette.
    const themes: Theme[] = [light, dark];
    for (const theme of themes) {
      for (const [role, swatch] of Object.entries(theme)) {
        expect(Array.isArray(swatch), `${role} should be a swatch reference`).toBe(true);
        expect(ramps[swatch[0]], `${role} points at a ramp that exists`).toBeDefined();
        expect(resolve(swatch)).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  it('assigns every role in both themes', () => {
    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());
  });

  it('never uses a pure grey', () => {
    // Neutrals are pulled toward the moss accent. A ramp step with identical
    // red, green and blue channels would be a true grey, and next to a
    // saturated accent that is what makes an interface look unfinished.
    for (const [step, hex] of Object.entries(concrete)) {
      const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)];
      expect(r === g && g === b, `concrete.${step} (${hex}) is a pure grey`).toBe(false);
    }
  });

  it('runs each ramp from light to dark without reversing', () => {
    for (const [name, ramp] of Object.entries(ramps)) {
      const steps = Object.entries(ramp)
        .map(([step, hex]) => [Number(step), luminance(hex)] as const)
        .sort((a, b) => a[0] - b[0]);

      for (let i = 1; i < steps.length; i += 1) {
        expect(
          steps[i]![1],
          `${name}.${steps[i]![0]} is lighter than ${name}.${steps[i - 1]![0]}`,
        ).toBeLessThan(steps[i - 1]![1]);
      }
    }
  });

  it('lightens the accent in dark mode rather than reusing the light value', () => {
    // A fill that carries white text on paper cannot carry dark text on ink.
    // Reusing one value for both is the usual reason a dark theme misses AA.
    expect(resolve(light.accent)).toBe(moss[500]);
    expect(luminance(resolve(dark.accent))).toBeGreaterThan(luminance(resolve(light.accent)));
  });
});
