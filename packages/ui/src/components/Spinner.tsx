import { cn } from '../lib/cn';

export interface SpinnerProps {
  /** Diameter in px. */
  size?: number;
  className?: string;
}

/**
 * A determinate-looking arc on an indeterminate track.
 *
 * Purely presentational: it carries aria-hidden and no role. Whatever is
 * loading is responsible for saying so, either with aria-busy on the region or
 * with a visually hidden label next to the spinner, which is what Button does.
 * A spinner that announces itself produces "Loading Loading" the moment anybody
 * labels it properly, and that is the more common bug.
 *
 * Under prefers-reduced-motion the base layer clamps the animation to 1ms,
 * which stops the rotation and leaves the arc as a static ring. That is the
 * right outcome: the ring still reads as a progress indicator sitting where
 * progress happens, and nothing spins.
 *
 * TOKENS: --ui-border (track), currentColor (arc), --ease-standard.
 */
export function Spinner({ size = 16, className }: SpinnerProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={cn('animate-spin', className)}
      style={{ animationDuration: '640ms', animationTimingFunction: 'linear' }}
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        stroke="var(--ui-border)"
        strokeWidth="1.75"
        opacity="0.7"
      />
      <path
        d="M8 1.75a6.25 6.25 0 0 1 6.25 6.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
