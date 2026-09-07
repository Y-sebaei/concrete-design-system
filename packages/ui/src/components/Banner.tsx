import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type BannerTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success';

export interface BannerProps {
  tone?: BannerTone;
  /** Required. State the condition, not the category. */
  title: string;
  /** What it means and what the reader can do about it. */
  children?: ReactNode;
  /** One control. A banner with three buttons is a dialog that forgot to open. */
  action?: ReactNode;
  /** Renders a dismiss button. Leave it out for a condition the user cannot clear. */
  onDismiss?: () => void;
  /** Removes the radius, for a banner that spans the full width of the viewport. */
  flush?: boolean;
  /**
   * Announce the banner when it appears. On by default.
   *
   * Turn it off for a banner that is part of the page from the start, such as a
   * permanent notice on an empty screen. A screen reader will reach it in the
   * reading order anyway, and a live region that fires on page load competes
   * with the page title.
   */
  announce?: boolean;
  className?: string;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   fill      --ui-{tone}-bg
 *   text      --ui-{tone}-text for the title, --ui-text for the body
 *   boundary  --ui-{tone}-border, plus a 3px leading bar in --ui-{tone}
 *   geometry  --radius-lg, or none when flush
 *   type      --text-body (title), --text-dense (body)
 *
 * WHY THE LEADING BAR
 *
 * Same reason as the active option in the combobox. The tinted background sits
 * around 1.2:1 against the surface it lies on, which is a perceptible tint and
 * nowhere near the 3:1 that WCAG 1.4.11 asks of anything identifying a state.
 * The bar is drawn in the full tone colour and clears 3:1 on its own, so the
 * tint and the icon reinforce a signal that does not depend on them. Colour is
 * never the only carrier either way: the title says what happened.
 */

const tones: Record<BannerTone, { shell: string; bar: string; title: string; icon: string }> = {
  neutral: {
    shell: 'bg-surface-sunken border-border',
    bar: 'bg-text-muted',
    title: 'text-text',
    icon: 'text-text-muted',
  },
  info: {
    shell: 'bg-info-bg border-info-border',
    bar: 'bg-info',
    title: 'text-info-text',
    icon: 'text-info',
  },
  warning: {
    shell: 'bg-warning-bg border-warning-border',
    bar: 'bg-warning',
    title: 'text-warning-text',
    icon: 'text-warning',
  },
  danger: {
    shell: 'bg-danger-bg border-danger-border',
    bar: 'bg-danger',
    title: 'text-danger-text',
    icon: 'text-danger',
  },
  success: {
    shell: 'bg-success-bg border-success-border',
    bar: 'bg-success',
    title: 'text-success-text',
    icon: 'text-success',
  },
};

/**
 * The glyphs are drawn rather than pulled from an icon font, and they are
 * aria-hidden. They are a second channel for the tone, not the message: the
 * title carries that.
 */
function ToneIcon({ tone }: { tone: BannerTone }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    'aria-hidden': true as const,
    focusable: 'false' as const,
  };

  if (tone === 'warning') {
    return (
      <svg {...common}>
        <path
          d="M8 2.4 14.6 13.6H1.4L8 2.4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8 6.4v3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.6" r="0.85" fill="currentColor" />
      </svg>
    );
  }

  if (tone === 'success') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="m5.1 8.2 2 2 3.8-4.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // info, danger and neutral share a disc, distinguished by the mark inside.
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {tone === 'danger' ? (
        <>
          <path d="M8 4.6v4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.1" r="0.85" fill="currentColor" />
        </>
      ) : (
        <>
          <circle cx="8" cy="5.1" r="0.85" fill="currentColor" />
          <path d="M8 7.4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/**
 * An inline message about a condition.
 *
 * The distinction from Toast is the whole reason this exists. A toast reports an
 * event: something happened, you may have missed it, here it is for six seconds.
 * A banner reports a state: this is true right now, and it stays on screen until
 * it stops being true. Search running degraded because Elasticsearch is
 * unreachable is a state. Putting it in a toast means it is gone six seconds
 * later while still being true, and the operator spends the rest of the session
 * looking at unranked results with nothing on screen to say so.
 */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  onDismiss,
  flush = false,
  announce = true,
  className,
}: BannerProps) {
  const style = tones[tone];

  return (
    <div
      /*
       * role="alert" is assertive and interrupts whatever is being read, which
       * is right for something broken and wrong for anything else. Everything
       * else is polite.
       *
       * Unlike Toast, this element does not need to pre-exist to be announced
       * reliably, and it does not need a hidden twin: a banner sits in the
       * reading order where the reader will meet it anyway. The live role only
       * decides whether they hear it sooner.
       */
      role={announce ? (tone === 'danger' ? 'alert' : 'status') : undefined}
      className={cn(
        'flex gap-3 overflow-hidden border p-3',
        flush ? 'rounded-none border-x-0' : 'rounded-lg',
        style.shell,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('w-[3px] shrink-0 rounded-full', style.bar)} />

      <span className={cn('mt-0.5 shrink-0', style.icon)}>
        <ToneIcon tone={tone} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('font-ui text-body font-medium', style.title)}>{title}</p>
        {children ? <div className="mt-1 font-ui text-dense text-text">{children}</div> : null}
        {action ? <div className="mt-2 flex items-center gap-2">{action}</div> : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss: ${title}`}
          className={cn(
            'cui-focus -mr-1 -mt-1 h-6 w-6 shrink-0 rounded-sm',
            'text-text-muted transition-colors duration-instant ease-standard',
            'hover:bg-surface-overlay hover:text-text',
          )}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 12 12"
            width="12"
            height="12"
            className="mx-auto"
          >
            <path
              d="m3 3 6 6m0-6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
