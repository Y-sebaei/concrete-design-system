import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Shows a spinner and stops the click handler firing, while keeping the
   * button in the tab order. See the note on aria-disabled in the body.
   */
  loading?: boolean;
  /** Announced while `loading`. Defaults to "Loading". */
  loadingLabel?: string;
  /** Decorative. Give the button a visible label or an aria-label as well. */
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  block?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   fill and text   --ui-accent, --ui-accent-hover, --ui-accent-active
 *                   --ui-danger, --ui-danger-hover, --ui-danger-active
 *                   --ui-text-on-accent, --ui-accent-text, --ui-text
 *   boundary        --ui-border-strong (secondary), --ui-accent-bg (ghost)
 *   inert           --ui-border, --ui-text-disabled
 *   geometry        --control-height-*, --control-padding-*, --radius-md
 *   type            --text-body, --text-dense
 *   motion          --duration-instant, --ease-standard
 *   focus           --ui-focus-ring, --ui-focus-ring-offset (via .cui-focus)
 *
 * Radius is --radius-md at every size, which is the rule from scale.ts and not
 * an oversight: two of the three heights fall inside the 32 to 44px band, and
 * the 28px size sits one pixel outside it. Changing the corner treatment when
 * a button shrinks makes it read as a different component rather than a
 * smaller one, so the band is rounded to in that one case.
 */

const base = [
  'relative inline-flex items-center justify-center gap-2',
  'font-ui font-medium whitespace-nowrap select-none',
  'rounded-md border',
  'cui-focus',
  'transition-colors duration-instant ease-standard',
].join(' ');

/**
 * Interactive and inert styles are separate strings picked in JS rather than
 * one string relying on `disabled:` variants. Disabled styling has to beat
 * hover and active, and expressing that as variant ordering inside a class list
 * is the kind of thing that works until somebody reorders the list.
 */
const variants: Record<ButtonVariant, { idle: string; inert: string }> = {
  primary: {
    idle: 'border-transparent bg-accent text-text-on-accent hover:bg-accent-hover active:bg-accent-active',
    inert: 'border-transparent bg-border text-text-disabled',
  },
  secondary: {
    idle: 'border-border-strong bg-surface-overlay text-text hover:bg-surface-raised hover:border-text-subtle active:bg-surface-sunken',
    inert: 'border-border bg-transparent text-text-disabled',
  },
  ghost: {
    idle: 'border-transparent bg-transparent text-accent-text hover:bg-accent-bg active:bg-accent-bg-hover',
    inert: 'border-transparent bg-transparent text-text-disabled',
  },
  danger: {
    idle: 'border-transparent bg-danger text-text-on-accent hover:bg-danger-hover active:bg-danger-active',
    inert: 'border-transparent bg-border text-text-disabled',
  },
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-[var(--control-height-sm)] px-[var(--control-padding-sm)] text-dense',
  md: 'h-[var(--control-height-md)] px-[var(--control-padding-md)] text-body',
  lg: 'h-[var(--control-height-lg)] px-[var(--control-padding-lg)] text-body',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    loadingLabel = 'Loading',
    iconStart,
    iconEnd,
    block = false,
    className,
    children,
    disabled,
    onClick,
    type = 'button',
    ...rest
  },
  ref,
) {
  /*
   * A loading button uses aria-disabled, not disabled.
   *
   * `disabled` drops the element out of the tab order. If a button is focused
   * when it starts loading, which is the normal case because the user just
   * pressed it, the browser moves focus to <body>, and a keyboard user is left
   * at the top of the document in the middle of a task. aria-disabled keeps
   * focus where it is and still tells assistive technology the control is
   * unavailable; the click is stopped in the handler instead.
   *
   * A button the caller passed `disabled` to keeps the real attribute. That
   * state is not transient, so leaving the tab order is the correct behaviour.
   */
  const busy = loading && !disabled;
  const inert = busy || Boolean(disabled);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      onClick={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={cn(
        base,
        inert ? variants[variant].inert : variants[variant].idle,
        inert && 'cursor-not-allowed',
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {/*
        The label stays in the layout while loading, at zero opacity, so the
        button keeps its exact width. A button that shrinks to fit a spinner
        moves everything beside it, and in a toolbar that means the control
        somebody was about to click has moved by the time they reach it.
      */}
      <span className={cn('inline-flex items-center gap-2', busy && 'invisible')}>
        {iconStart ? (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {iconStart}
          </span>
        ) : null}
        {children}
        {iconEnd ? (
          <span aria-hidden="true" className="inline-flex shrink-0">
            {iconEnd}
          </span>
        ) : null}
      </span>

      {busy ? (
        <span className="absolute inset-0 inline-flex items-center justify-center">
          <Spinner size={size === 'sm' ? 14 : 16} />
          <span className="sr-only">{loadingLabel}</span>
        </span>
      ) : null}
    </button>
  );
});
