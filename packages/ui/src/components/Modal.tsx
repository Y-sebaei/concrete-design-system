import { useCallback, useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';
import { getTabbable, lockScroll } from '../lib/focus';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Required. A dialog with no accessible name is unusable with a screen reader. */
  title: ReactNode;
  /** Wired to aria-describedby when present. */
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Where focus lands when the dialog opens. Defaults to the first tabbable
   * element, falling back to the dialog itself.
   */
  initialFocus?: RefObject<HTMLElement>;
  /** Set false for a dialog the user must answer. Escape still works. */
  closeOnScrimClick?: boolean;
  /** Hides the corner close button. The dialog must then have its own way out. */
  hideCloseButton?: boolean;
  className?: string;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
} as const;

/*
 * TOKENS THIS COMPONENT READS
 *
 *   surface   --ui-surface-overlay, and it republishes
 *             --ui-focus-ring-offset so controls inside get a correct ring
 *   scrim     --ui-surface-scrim at 55% (light) via colour-mix
 *   boundary  --ui-border
 *   geometry  --radius-xl (16px, the largest in the system: modals and sheets)
 *   shadow    --ui-shadow-overlay, which is `none` in light mode by design
 *   motion    --duration-slow (320ms), --ease-standard, cui-lift-in
 *
 * WHY 320ms, THE SLOWEST THING IN THE SYSTEM
 *
 * Light Concrete has no shadows. A dialog therefore has only two things to
 * announce itself with: one tonal step and a scrim. Both are quiet compared to
 * a drop shadow, so the transition needs slightly more time to be legible. A
 * design built on elevation shadows could open a dialog in 200ms and still be
 * clear. This is an example of a motion token being a consequence of the
 * elevation model rather than a taste call.
 *
 * FOCUS BEHAVIOUR, IN FULL
 *
 * 1. On open, the currently focused element is stored.
 * 2. Focus moves to `initialFocus`, else the first tabbable element, else the
 *    dialog container, which carries tabindex={-1} for exactly this case.
 * 3. Tab and Shift+Tab wrap inside the dialog. The tabbable list is recomputed
 *    on every keypress, so controls that appear or become enabled while the
 *    dialog is open are included.
 * 4. A focusin listener on the document catches focus that escaped by any
 *    other route, which in practice means the browser address bar and back:
 *    Tab handling alone does not cover that, and it is the usual reason a trap
 *    that passes a keyboard test still leaks in a real browser.
 * 5. On close, focus returns to the stored element, unless it has left the
 *    document in the meantime, in which case it goes to body rather than
 *    nowhere.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  initialFocus,
  closeOnScrimClick = true,
  hideCloseButton = false,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  /* Escape, and Tab wrapping. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const tabbable = getTabbable(dialog);
      if (tabbable.length === 0) {
        // Nothing to move to, so hold focus on the dialog itself rather than
        // letting Tab walk out into the page behind.
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = tabbable[0]!;
      const last = tabbable[tabbable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  /* Open and close: store focus, move it in, lock scroll, put it back. */
  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const releaseScroll = lockScroll();

    // A frame is needed because the dialog has only just been portalled in and
    // is not measurable yet, and getTabbable filters on client rects.
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const target = initialFocus?.current ?? getTabbable(dialog)[0] ?? dialog;
      target.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      releaseScroll();

      const previous = restoreRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      } else {
        // The trigger was unmounted while the dialog was open, which happens
        // when the dialog deletes the row it was opened from. Focus has to go
        // somewhere real, and body is the only guaranteed target.
        document.body.focus();
      }
      restoreRef.current = null;
    };
  }, [open, initialFocus]);

  /*
   * The backstop.
   *
   * Tab handling covers keyboard movement inside the page. It does not cover
   * focus arriving from outside it, which is what happens when somebody tabs
   * into the browser chrome and back, or when a script calls focus() on
   * something behind the dialog. Without this listener a focus trap can pass
   * every keyboard test and still leak in a real browser.
   */
  useEffect(() => {
    if (!open) return;

    function onFocusIn(event: FocusEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;
      const target = event.target as Node | null;
      if (target && !dialog.contains(target)) {
        const tabbable = getTabbable(dialog);
        (tabbable[0] ?? dialog).focus();
      }
    }

    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
      // The scrim is a sibling concern: this element is the positioning
      // context, and the scrim below is what the click lands on.
    >
      {/*
        The scrim is a pointer affordance and nothing else. It is aria-hidden and
        has no keyboard equivalent because it does not need one: Escape closes
        the dialog, and the close button is the first element in its tab order.
        Making the scrim a button would put a control with no accessible name
        into the tab order in front of the dialog's own content.
      */}
      <div
        aria-hidden="true"
        onClick={closeOnScrimClick ? onClose : undefined}
        className={cn(
          'fixed inset-0',
          // colour-mix keeps the scrim tied to the neutral ramp instead of
          // being an untokenised rgba(0,0,0,.5). In dark mode the scrim is the
          // same hue as the page, only deeper, so the dialog reads as lifted
          // off the page rather than as a hole cut in it.
          '[background:color-mix(in_srgb,var(--ui-surface-scrim)_62%,transparent)]',
          'motion-safe:animate-[cui-fade-in_var(--duration-slow)_var(--ease-standard)]',
        )}
      />

      {/*
        The dialog owns Escape and the Tab wrapping, so the handler belongs on
        the container rather than on whichever control inside happens to have
        focus. role="dialog" is not an interactive role, which is what the rule
        below objects to, and moving the handler onto a child would break the
        trap the moment the dialog contains nothing focusable.
      */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          'relative z-10 w-full',
          sizes[size],
          'rounded-xl border border-border bg-surface-overlay shadow-overlay',
          '[--ui-focus-ring-offset:var(--ui-surface-overlay)]',
          'motion-safe:animate-[cui-lift-in_var(--duration-slow)_var(--ease-standard)]',
          'focus-visible:outline-none',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-ui text-title text-text">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 font-ui text-dense text-text-subtle">
                {description}
              </p>
            ) : null}
          </div>

          {!hideCloseButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close dialog"
              className="-mr-1 -mt-1 shrink-0 px-2"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 14 14" width="14" height="14">
                <path
                  d="m3.5 3.5 7 7m0-7-7 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </Button>
          ) : null}
        </div>

        {children ? <div className="p-4">{children}</div> : null}

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
