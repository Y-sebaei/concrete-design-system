import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and lets a later Tailwind utility beat an earlier one in
 * the same group. Without the merge, a consumer passing `className="px-6"` to a
 * component that already sets `px-3` gets both, and which one wins depends on
 * the order they happen to appear in the compiled stylesheet.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
