import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast, type ToastOptions } from './Toast';

function Trigger({ options }: { options: ToastOptions }) {
  const { toast } = useToast();
  return (
    <button type="button" onClick={() => toast(options)}>
      Fire
    </button>
  );
}

function renderWithProvider(options: ToastOptions) {
  return render(
    <ToastProvider>
      <Trigger options={options} />
    </ToastProvider>,
  );
}

const politeRegion = () => document.querySelector('[aria-live="polite"]')!;
const assertiveRegion = () => document.querySelector('[aria-live="assertive"]')!;

/*
 * The visible toasts, scoped.
 *
 * Every message exists twice in the document on purpose: once in the hidden
 * live region that does the announcing, and once in the toast a sighted user
 * reads. Unscoped queries match both, so anything asserting on what is on
 * screen has to look inside the notifications region.
 */
const notifications = () => screen.getByRole('region', { name: 'Notifications' });

describe('Toast', () => {
  it('renders both live regions before any toast exists', () => {
    render(
      <ToastProvider>
        <span />
      </ToastProvider>,
    );

    // The regions must pre-exist. A live region inserted at the same moment as
    // its text is not reliably announced, which is the usual reason a toast
    // that looks correct in the DOM is silent in a screen reader.
    expect(politeRegion()).toBeInTheDocument();
    expect(assertiveRegion()).toBeInTheDocument();
    expect(politeRegion()).toBeEmptyDOMElement();
  });

  it('announces an ordinary toast politely', async () => {
    const user = userEvent.setup();
    renderWithProvider({ title: 'Order refunded', description: 'Two tickets released.' });

    await user.click(screen.getByRole('button', { name: 'Fire' }));

    await waitFor(() =>
      expect(politeRegion()).toHaveTextContent('Order refunded. Two tickets released.'),
    );
    expect(assertiveRegion()).toBeEmptyDOMElement();
  });

  it('announces an error assertively', async () => {
    const user = userEvent.setup();
    renderWithProvider({ title: 'Request failed', tone: 'danger' });

    await user.click(screen.getByRole('button', { name: 'Fire' }));

    await waitFor(() => expect(assertiveRegion()).toHaveTextContent('Request failed'));
    expect(politeRegion()).toBeEmptyDOMElement();
  });

  it('keeps the dismiss button reachable and named', async () => {
    const user = userEvent.setup();
    renderWithProvider({ title: 'Socket reconnected' });

    await user.click(screen.getByRole('button', { name: 'Fire' }));

    const dismiss = await screen.findByRole('button', { name: 'Dismiss: Socket reconnected' });
    await user.click(dismiss);

    await waitFor(() =>
      expect(within(notifications()).queryByText('Socket reconnected')).not.toBeInTheDocument(),
    );
  });

  it('exposes the notifications as a named region', async () => {
    const user = userEvent.setup();
    renderWithProvider({ title: 'Anything' });
    await user.click(screen.getByRole('button', { name: 'Fire' }));

    expect(screen.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('replaces a keyed toast instead of stacking duplicates', async () => {
    const user = userEvent.setup();

    function Reconnects() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() => toast({ title: 'Reconnecting', key: 'socket', tone: 'warning' })}
        >
          Retry
        </button>
      );
    }

    render(
      <ToastProvider>
        <Reconnects />
      </ToastProvider>,
    );

    const retry = screen.getByRole('button', { name: 'Retry' });
    await user.click(retry);
    await user.click(retry);
    await user.click(retry);

    expect(within(notifications()).getAllByText('Reconnecting')).toHaveLength(1);
  });
});

describe('Toast, timing', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('dismisses an ordinary toast on its own', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider({ title: 'Saved', duration: 3000 });

    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(within(notifications()).getByText('Saved')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    expect(within(notifications()).queryByText('Saved')).not.toBeInTheDocument();
  });

  it('leaves an error up until it is dismissed', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProvider({ title: 'Checkout failed', tone: 'danger' });

    await user.click(screen.getByRole('button', { name: 'Fire' }));

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    // An error that vanishes on its own is an error nobody read.
    expect(within(notifications()).getByText('Checkout failed')).toBeInTheDocument();
  });
});
