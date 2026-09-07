import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Banner } from './Banner';

describe('Banner', () => {
  it('announces politely by default', () => {
    render(<Banner tone="warning" title="Search is running degraded" />);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Search is running degraded');
  });

  it('announces assertively when something is broken', () => {
    // Assertive interrupts whatever is being read. Right for a failure, wrong
    // for anything else, and using it for both teaches people to ignore it.
    render(<Banner tone="danger" title="The events list could not be loaded" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('can be silent, for a banner that is part of the page from the start', () => {
    render(<Banner tone="info" title="Read only" announce={false} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    // Still content, still in the reading order.
    expect(screen.getByText('Read only')).toBeInTheDocument();
  });

  it('renders a description and an action', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <Banner
        tone="danger"
        title="Could not load events"
        action={
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        }
      >
        The API returned 503.
      </Banner>,
    );

    expect(screen.getByText('The API returned 503.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has no dismiss button unless the condition can be cleared', () => {
    render(<Banner title="Search is running degraded" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('names its dismiss button after the thing being dismissed', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();

    render(<Banner title="Search is running degraded" onDismiss={onDismiss} />);

    // "Dismiss" alone is useless in a list of controls read out of context.
    const button = screen.getByRole('button', { name: 'Dismiss: Search is running degraded' });
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('keeps the tone icon out of the accessible name', () => {
    render(<Banner tone="danger" title="Checkout failed" />);
    // The title carries the meaning. The icon and the bar are a second channel
    // for people who can see them, and must not be read as content.
    expect(screen.getByRole('alert')).toHaveTextContent(/^Checkout failed$/);
  });

  it('drops its radius when flush', () => {
    const { container, rerender } = render(<Banner title="Rounded" />);
    expect(container.firstElementChild).toHaveClass('rounded-lg');

    rerender(<Banner title="Flush" flush />);
    expect(container.firstElementChild).toHaveClass('rounded-none');
  });
});
