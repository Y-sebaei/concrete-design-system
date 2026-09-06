import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Badge, cn, useToast } from '@y-sebaei/concrete-ui';
import { getSocket, type ConnectionState } from '../lib/socket';

/* -------------------------------------------------------------------------- */
/* Theme                                                                       */
/* -------------------------------------------------------------------------- */

type ThemePreference = 'light' | 'dark' | 'system';

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem('boxoffice.theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

/**
 * Three states, not a boolean.
 *
 * The token layer resolves light from :root, dark from a prefers-color-scheme
 * block guarded against an explicit light choice, and dark again from
 * [data-theme="dark"]. So "system" means removing the attribute rather than
 * computing a value, which is why this is a preference and not a toggle.
 */
function useThemePreference() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    const root = document.documentElement;
    if (preference === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', preference);

    try {
      localStorage.setItem('boxoffice.theme', preference);
    } catch {
      /* ignore */
    }
  }, [preference]);

  return [preference, setPreference] as const;
}

function ThemeControl() {
  const [preference, setPreference] = useThemePreference();
  const options: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'Auto' },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-md border border-border bg-surface-sunken p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={preference === option.value}
          onClick={() => setPreference(option.value)}
          className={cn(
            'cui-focus rounded-sm px-2 py-1 font-ui text-label uppercase',
            'transition-colors duration-instant ease-standard',
            preference === option.value
              ? 'bg-surface-overlay text-text'
              : 'text-text-muted hover:text-text',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Live connection                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Watches the shared socket and raises toasts on the transitions that matter.
 *
 * Every reconnect toast shares one key, so a socket flapping through a backoff
 * updates a single toast in place rather than stacking eight identical ones.
 * That is the reason ToastOptions has a key at all.
 */
function ConnectionStatus() {
  const { toast, dismiss } = useToast();
  const [state, setState] = useState<ConnectionState>('connecting');

  useEffect(() => {
    const socket = getSocket();
    // Was this connect the first one, or a recovery? Only the second is worth
    // telling anybody about.
    let hasConnected = socket.connected;

    const onConnect = () => {
      setState('connected');
      if (hasConnected) {
        dismiss('socket');
        toast({
          title: 'Live inventory reconnected',
          description: 'Remaining counts are current again.',
          tone: 'success',
          key: 'socket-recovered',
        });
      }
      hasConnected = true;
    };

    const onDisconnect = () => {
      setState('reconnecting');
      toast({
        title: 'Live inventory disconnected',
        description: 'Remaining counts are frozen until the socket is back. Reconnecting.',
        tone: 'warning',
        duration: null,
        key: 'socket',
      });
    };

    const onError = () => setState('reconnecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onError);
    if (socket.connected) setState('connected');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onError);
    };
  }, [toast, dismiss]);

  const tone = state === 'connected' ? 'success' : state === 'disconnected' ? 'danger' : 'warning';
  const label =
    state === 'connected' ? 'Live' : state === 'connecting' ? 'Connecting' : 'Reconnecting';

  return (
    <Badge tone={tone} dot shape="pill">
      <span className="sr-only">Live inventory connection: </span>
      {label}
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                       */
/* -------------------------------------------------------------------------- */

const navItems = [
  { to: '/events', label: 'Events' },
  { to: '/orders', label: 'Orders' },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-app">
      {/*
        A skip link, first in the tab order. On a screen whose header carries a
        nav, a theme control and a status badge, that is four stops before the
        table every single time without one.
      */}
      <a
        href="#main"
        className="cui-focus sr-only rounded-md bg-surface-overlay px-3 py-2 font-ui text-body text-text focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-border bg-surface-raised">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-ui text-title text-text">Box office</span>
            <span className="hidden font-ui text-dense text-text-subtle sm:inline">
              Operator console
            </span>
          </div>

          <nav aria-label="Sections" className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'cui-focus rounded-md px-3 py-1.5 font-ui text-body font-medium',
                    'transition-colors duration-instant ease-standard',
                    isActive
                      ? 'bg-accent-bg text-accent-text'
                      : 'text-text-muted hover:bg-surface-sunken hover:text-text',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ConnectionStatus />
            <ThemeControl />
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
