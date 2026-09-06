import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/cn';

export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Milliseconds. `null` keeps it up until dismissed. Errors default to null. */
  duration?: number | null;
  action?: { label: string; onClick: () => void };
  /**
   * Replaces any existing toast with the same key instead of stacking.
   *
   * The reason this exists: a socket that drops reconnects on a backoff, and
   * without a key every attempt adds another toast until the screen is a
   * column of identical messages. With one, the eighth attempt updates the
   * first toast in place.
   */
  key?: string;
}

interface ToastRecord extends ToastOptions {
  id: string;
  tone: ToastTone;
  duration: number | null;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }
  return context;
}

const tones: Record<ToastTone, { shell: string; bar: string }> = {
  neutral: { shell: 'border-border', bar: 'bg-text-muted' },
  success: { shell: 'border-success-border', bar: 'bg-success' },
  warning: { shell: 'border-warning-border', bar: 'bg-warning' },
  danger: { shell: 'border-danger-border', bar: 'bg-danger' },
  info: { shell: 'border-info-border', bar: 'bg-info' },
};

export interface ToastProviderProps {
  children: ReactNode;
  /** Newest first. Older toasts past this are dropped. */
  limit?: number;
  /** Default auto-dismiss for non-error toasts. */
  defaultDuration?: number;
}

/*
 * TOKENS THIS COMPONENT READS
 *
 *   surface   --ui-surface-overlay, republishes --ui-focus-ring-offset
 *   accent    --ui-{tone} for the leading bar, --ui-{tone}-border for the edge
 *   geometry  --radius-lg, --spacing-3
 *   shadow    --ui-shadow-popover, none in light mode
 *   motion    --duration-medium, --ease-enter, cui-slide-in
 *
 * THE LIVE REGIONS
 *
 * There are two, both rendered empty from first mount and never unmounted. A
 * live region that is inserted into the DOM at the same moment as its text is
 * not reliably announced by NVDA or VoiceOver, and that single detail is the
 * reason most toast implementations are silent in a screen reader while looking
 * perfectly correct in the markup.
 *
 * Errors go to the assertive region and everything else to the polite one.
 * Assertive interrupts whatever is being read, which is right for "that request
 * failed" and wrong for "saved", and using it for both trains people to ignore
 * it.
 *
 * The visible toast carries no live region of its own, so each message is
 * announced exactly once, from the hidden region, while the toast itself stays
 * a normal reachable part of the page.
 */
export function ToastProvider({ children, limit = 4, defaultDuration = 6000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const announceTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  /*
   * Announcing, in two steps.
   *
   * A live region is announced when its content changes, so setting it to the
   * same string twice says nothing the second time. That is not a hypothetical:
   * two failed requests in a row produce the identical message, and the second
   * failure would be silent for a screen reader user while being perfectly
   * visible to everyone else. Clearing the region first and setting the text in
   * a separate commit guarantees a mutation every time.
   */
  const announce = useCallback((tone: ToastTone, text: string) => {
    const setter = tone === 'danger' ? setAssertiveMessage : setPoliteMessage;
    setter('');
    const timer = setTimeout(() => {
      announceTimers.current.delete(timer);
      setter(text);
    }, 0);
    announceTimers.current.add(timer);
  }, []);

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [clearTimer],
  );

  const dismissAll = useCallback(() => {
    for (const id of timers.current.keys()) clearTimer(id);
    setToasts([]);
  }, [clearTimer]);

  const schedule = useCallback(
    (record: ToastRecord) => {
      if (record.duration === null) return;
      clearTimer(record.id);
      timers.current.set(
        record.id,
        setTimeout(() => dismiss(record.id), record.duration),
      );
    },
    [clearTimer, dismiss],
  );

  const toast = useCallback(
    (options: ToastOptions): string => {
      const tone = options.tone ?? 'neutral';
      // An error that vanishes on its own is an error nobody read. Anything the
      // user has to act on stays until they dismiss it.
      const duration =
        options.duration !== undefined
          ? options.duration
          : tone === 'danger'
            ? null
            : defaultDuration;

      counter.current += 1;
      const id = options.key ?? `toast-${counter.current}`;
      const record: ToastRecord = { ...options, id, tone, duration };

      setToasts((current) => {
        const withoutSameKey = current.filter((existing) => existing.id !== id);
        return [record, ...withoutSameKey].slice(0, limit);
      });

      const text = options.description ? `${options.title}. ${options.description}` : options.title;
      announce(tone, text);

      schedule(record);
      return id;
    },
    [announce, defaultDuration, limit, schedule],
  );

  useEffect(() => {
    const pending = timers.current;
    const pendingAnnouncements = announceTimers.current;
    return () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
      for (const timer of pendingAnnouncements) clearTimeout(timer);
      pendingAnnouncements.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport
        toasts={toasts}
        onDismiss={dismiss}
        onPause={(id) => clearTimer(id)}
        onResume={(id) => {
          const record = toasts.find((t) => t.id === id);
          if (record) schedule(record);
        }}
        politeMessage={politeMessage}
        assertiveMessage={assertiveMessage}
      />
    </ToastContext.Provider>
  );
}

interface ToastViewportProps {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  politeMessage: string;
  assertiveMessage: string;
}

function ToastViewport({
  toasts,
  onDismiss,
  onPause,
  onResume,
  politeMessage,
  assertiveMessage,
}: ToastViewportProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {politeMessage}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveMessage}
      </div>

      {/*
        A region landmark, so a keyboard user can jump to the notifications
        rather than tabbing the length of the page to reach a toast with an
        action button in it.
      */}
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            /*
              No aria-live and no role here, on purpose.
              The two regions above do the announcing. Marking this element
              aria-hidden would stop the duplicate announcement too, but it
              would also bury the dismiss and action buttons inside a hidden
              subtree: focusable content under aria-hidden is both an axe
              violation and a real dead end, because a keyboard user can tab to
              a button their screen reader refuses to describe. Leaving the
              element plain gives one announcement and a reachable control.
            */
            onMouseEnter={() => onPause(toast.id)}
            onMouseLeave={() => onResume(toast.id)}
            onFocusCapture={() => onPause(toast.id)}
            onBlurCapture={() => onResume(toast.id)}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm gap-3 overflow-hidden',
              'rounded-lg border bg-surface-overlay p-3 shadow-popover',
              '[--ui-focus-ring-offset:var(--ui-surface-overlay)]',
              tones[toast.tone].shell,
              'motion-safe:animate-[cui-slide-in_var(--duration-medium)_var(--ease-enter)]',
            )}
          >
            <span aria-hidden="true" className={cn('w-1 shrink-0 rounded-full', tones[toast.tone].bar)} />

            <div className="min-w-0 flex-1">
              <p className="font-ui text-body font-medium text-text">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 font-ui text-dense text-text-subtle">{toast.description}</p>
              ) : null}

              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    onDismiss(toast.id);
                  }}
                  className="cui-focus mt-2 rounded-sm font-ui text-dense font-medium text-accent-text underline underline-offset-2 hover:text-accent-hover"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label={`Dismiss: ${toast.title}`}
              className="cui-focus -mr-1 -mt-1 h-6 w-6 shrink-0 rounded-sm text-text-muted transition-colors duration-instant hover:bg-surface-app hover:text-text"
            >
              <svg
                aria-hidden="true"
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
          </div>
        ))}
      </section>
    </>,
    document.body,
  );
}
