import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `raised` is the default and steps one tone up from the page.
   * `overlay` is the highest surface and is what popovers and modals sit on.
   * `flat` keeps the page tone and draws only a hairline, for a card that is
   * grouping content rather than lifting it.
   */
  surface?: 'flat' | 'raised' | 'overlay';
  /** Removes the default padding, for a card wrapping a table or an image. */
  bleed?: boolean;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   surface   --ui-surface-raised, --ui-surface-overlay, --ui-surface-app
 *   boundary  --ui-border
 *   geometry  --radius-lg, --spacing-4
 *
 * ELEVATION, AND THE ONE LINE THAT MATTERS MOST HERE
 *
 * A card in Concrete is a tonal step, not a shadow. It also republishes
 * --ui-focus-ring-offset as its own background, which is what keeps the focus
 * ring correct: a button inside a raised card gets an inner ring in the card's
 * tone rather than in the page tone, so the ring reads the same whether the
 * control is on the page, on a card, or inside a modal. Every component that
 * establishes a surface does this, and it is the reason the focus treatment
 * survives being nested.
 */

const surfaces = {
  flat: 'bg-surface-app [--ui-focus-ring-offset:var(--ui-surface-app)]',
  raised: 'bg-surface-raised [--ui-focus-ring-offset:var(--ui-surface-raised)]',
  overlay: 'bg-surface-overlay [--ui-focus-ring-offset:var(--ui-surface-overlay)]',
} as const;

export function Card({ surface = 'raised', bleed = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border',
        surfaces[surface],
        !bleed && 'p-4',
        className,
      )}
      {...rest}
    />
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Rendered at the end of the header row, for a button or a badge. */
  actions?: ReactNode;
}

export function CardHeader({ actions, className, children, ...rest }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 border-b border-border pb-3', className)}
      {...rest}
    >
      <div className="min-w-0">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-ui text-title text-text', className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 font-ui text-dense text-text-subtle', className)} {...rest} />;
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-3', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-2 border-t border-border pt-3', className)}
      {...rest}
    />
  );
}
