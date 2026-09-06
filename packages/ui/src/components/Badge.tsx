import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeShape = 'tag' | 'pill';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  shape?: BadgeShape;
  /**
   * Adds a filled dot before the label.
   *
   * Worth turning on for anything that encodes a status, because it gives the
   * badge a second visual channel besides hue. Six tones separated by colour
   * alone are six identical grey lozenges to a red-green colourblind reader,
   * and WCAG 1.4.1 is explicit that colour cannot be the only carrier. The
   * label is the real fallback; the dot makes the tone scannable for everyone
   * else without relying on the hue being distinguishable.
   */
  dot?: boolean;
  children: ReactNode;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   fill      --ui-{tone}-bg          accent-bg, danger-bg, warning-bg, info-bg
 *   text      --ui-{tone}-text
 *   boundary  --ui-{tone}-border
 *   geometry  --radius-sm (tag) or --radius-full (pill)
 *   type      --text-label, uppercase with +0.06em tracking
 *
 * Every tone pair is in the contrast contract at 4.5:1, in both themes.
 */

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-text-muted border-border',
  accent: 'bg-accent-bg text-accent-text border-accent-border',
  success: 'bg-success-bg text-success-text border-success-border',
  warning: 'bg-warning-bg text-warning-text border-warning-border',
  danger: 'bg-danger-bg text-danger-text border-danger-border',
  info: 'bg-info-bg text-info-text border-info-border',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-text-muted',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export function Badge({
  tone = 'neutral',
  shape = 'tag',
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-0.5',
        'font-ui text-label uppercase',
        // Under 32px tall, so radius-sm by the rule in scale.ts. The pill is
        // the documented exception for a single short word.
        shape === 'pill' ? 'rounded-full' : 'rounded-sm',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', dots[tone])} />
      ) : null}
      {children}
    </span>
  );
}
