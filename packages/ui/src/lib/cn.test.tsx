import { describe, expect, it } from 'vitest';
import { cn } from './cn';
import { text } from '../tokens/scale';

/*
 * These exist because of a real bug, not for coverage.
 *
 * Concrete renames the type scale, so tailwind-merge does not recognise
 * `text-dense` as a size and files it under text colour instead. That put it in
 * the same conflict group as `text-text`, and the merge dropped the size from
 * every element that carried both, which is most of them. The symptom was type
 * quietly inheriting from its parent across the whole library, which reads as a
 * design that is slightly off rather than as a defect.
 */
describe('cn', () => {
  it('keeps a size and a colour together', () => {
    const result = cn('font-ui text-dense text-text');
    expect(result).toContain('text-dense');
    expect(result).toContain('text-text');
  });

  it.each(Object.keys(text))('keeps text-%s alongside a colour', (step) => {
    const result = cn(`text-${step}`, 'text-text-muted');
    expect(result).toContain(`text-${step}`);
    expect(result).toContain('text-text-muted');
  });

  it('still lets one size override another', () => {
    expect(cn('text-body', 'text-title')).toBe('text-title');
  });

  it('still lets one colour override another', () => {
    expect(cn('text-text', 'text-accent-text')).toBe('text-accent-text');
  });

  it('keeps a font family alongside a size', () => {
    const result = cn('font-prose', 'text-prose-body');
    expect(result).toContain('font-prose');
    expect(result).toContain('text-prose-body');
  });

  it('lets one font family override another', () => {
    expect(cn('font-ui', 'font-prose')).toBe('font-prose');
  });

  it('resolves the motion tokens as their own groups', () => {
    expect(cn('duration-instant', 'duration-slow')).toBe('duration-slow');
    expect(cn('ease-standard', 'ease-enter')).toBe('ease-enter');
    // A duration and an easing are different properties and must both survive.
    const both = cn('duration-fast', 'ease-standard');
    expect(both).toContain('duration-fast');
    expect(both).toContain('ease-standard');
  });

  it('lets a caller override component padding, which is the point of merging', () => {
    expect(cn('px-3 py-2', 'px-6')).toBe('py-2 px-6');
  });
});
