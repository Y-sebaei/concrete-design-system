import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { text } from '../tokens/scale';
import { duration, easing } from '../tokens/scale';

/*
 * WHY THIS IS NOT JUST twMerge(clsx(...))
 *
 * tailwind-merge decides which of two classes wins by working out which group
 * each belongs to, and it only knows Tailwind's stock scale. Concrete renames
 * the type scale, so `text-dense` is not a size it recognises. Its fallback for
 * an unknown `text-*` class is the text-colour group, which puts `text-dense`
 * and `text-text` in the same group, and the merge then drops one of them.
 *
 * The visible symptom is subtle and system-wide: any element carrying both a
 * size and a colour, which is most of them, silently loses its font size and
 * inherits whatever the parent had. It looks like a slightly-off design rather
 * than a bug, which is exactly why it survives review.
 *
 * The group definitions below are derived from the token source rather than
 * typed out, so adding a step to the type scale cannot leave this behind.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: Object.keys(text) }],
      'font-family': [{ font: ['ui', 'prose', 'mono'] }],
      duration: [{ duration: Object.keys(duration) }],
      ease: [{ ease: Object.keys(easing) }],
      shadow: [{ shadow: ['overlay', 'popover'] }],
    },
  },
});

/**
 * Joins class names and lets a later Tailwind utility beat an earlier one in
 * the same group, so a consumer passing `className="px-6"` to a component that
 * already sets `px-3` gets six rather than both.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
