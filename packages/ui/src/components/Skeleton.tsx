import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * `text` matches a line of body copy and inherits the line height, so a
   * skeleton paragraph occupies exactly the space the real paragraph will.
   */
  variant?: 'text' | 'block' | 'circle';
  width?: number | string;
  height?: number | string;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   fill    --ui-skeleton-base, --ui-skeleton-sheen
 *   motion  the cui-sheen keyframes in base.css, 1.6s, --ease-standard
 *
 * WHY THIS IS aria-hidden AND NOT role="status"
 *
 * A skeleton is a picture of content that is not there yet. Announcing each
 * placeholder produces a burst of noise proportional to the number of
 * rectangles on screen, which for a loading table is dozens. The correct
 * announcement is one message for the whole region, which is why Table and the
 * console's loading states put aria-busy on the container and a single polite
 * live message next to it. The skeletons themselves stay silent.
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const dimensions: CSSProperties = {
    width: width ?? (variant === 'circle' ? 32 : '100%'),
    height: height ?? (variant === 'circle' ? 32 : variant === 'text' ? undefined : 96),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'cui-skeleton',
        variant === 'text' && 'h-[1em] rounded-sm',
        variant === 'block' && 'rounded-lg',
        variant === 'circle' && 'rounded-full',
        className,
      )}
      style={dimensions}
      {...rest}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * A paragraph of skeleton lines.
 *
 * The last line is short, at a width that varies slightly with its index rather
 * than being the same 60% every time. A stack of identical full-width bars
 * reads as a table; ragged line ends read as prose, which is what is about to
 * load. It costs nothing and it is the difference between a placeholder that
 * looks designed and one that looks like a div with a background colour.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const widths = ['100%', '96%', '92%', '98%'];
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? ['58%', '64%', '48%'][i % 3] : widths[i % widths.length]}
        />
      ))}
    </div>
  );
}
