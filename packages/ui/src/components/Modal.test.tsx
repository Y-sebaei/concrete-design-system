import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';
import { Button } from './Button';

/**
 * A harness that mounts a real trigger outside the dialog, because the two
 * behaviours worth testing here, focus moving in and focus coming back, are
 * both about the relationship between the trigger and the dialog. A test that
 * renders the modal already open cannot check either.
 */
function Harness({
  initialFocusSecond = false,
  closeOnScrimClick = true,
}: {
  initialFocusSecond?: boolean;
  closeOnScrimClick?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const secondRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open order
      </button>
      <button type="button">Somewhere else</button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Order 4d1f"
        description="Two tickets, paid."
        closeOnScrimClick={closeOnScrimClick}
        initialFocus={initialFocusSecond ? secondRef : undefined}
        footer={
          <Button variant="primary" onClick={() => setOpen(false)}>
            Refund
          </Button>
        }
      >
        <input ref={secondRef} aria-label="Reference" />
        <button type="button">Resend email</button>
      </Modal>
    </div>
  );
}

describe('Modal', () => {
  it('exposes a dialog with an accessible name and description', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Order 4d1f');
    expect(dialog).toHaveAccessibleDescription('Two tickets, paid.');
  });

  it('moves focus to the first tabbable element on open', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus(),
    );
  });

  it('honours initialFocus over the first tabbable element', async () => {
    const user = userEvent.setup();
    render(<Harness initialFocusSecond />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));

    await waitFor(() => expect(screen.getByLabelText('Reference')).toHaveFocus());
  });

  it('wraps Tab from the last element back to the first', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus());

    // Close -> Reference -> Resend email -> Refund, then round to Close.
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Refund' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus();
  });

  it('wraps Shift+Tab from the first element to the last', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Refund' })).toHaveFocus();
  });

  it('never lets focus reach a control behind the dialog', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus());

    const outside = screen.getByRole('button', { name: 'Somewhere else' });
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(outside).not.toHaveFocus();
    }
  });

  it('pulls focus back when something outside steals it', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close dialog' })).toHaveFocus());

    // The case Tab handling does not cover: a script, or the browser chrome,
    // moving focus directly to an element behind the dialog.
    screen.getByRole('button', { name: 'Somewhere else' }).focus();

    await waitFor(() =>
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true),
    );
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open order' });

    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('returns focus to the trigger after closing with a button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open order' });

    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Refund' }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('does not close on a scrim click when the caller opts out', async () => {
    const user = userEvent.setup();
    render(<Harness closeOnScrimClick={false} />);
    await user.click(screen.getByRole('button', { name: 'Open order' }));

    const scrim = document.querySelector('[aria-hidden="true"]');
    expect(scrim).not.toBeNull();
    await user.click(scrim as Element);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('locks and restores page scroll', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.body.style.overflow).toBe('');

    await user.click(screen.getByRole('button', { name: 'Open order' }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
  });

  it('survives its trigger being unmounted while open', async () => {
    // The row-deleted case: focus has to land somewhere real rather than being
    // dropped, which is what makes the next Tab press behave predictably.
    function Vanishing() {
      const [open, setOpen] = useState(false);
      const [showTrigger, setShowTrigger] = useState(true);
      return (
        <div>
          {showTrigger ? (
            <button type="button" onClick={() => setOpen(true)}>
              Open
            </button>
          ) : null}
          <Modal open={open} onClose={() => setOpen(false)} title="Gone">
            <button type="button" onClick={() => setShowTrigger(false)}>
              Delete the row
            </button>
          </Modal>
        </div>
      );
    }

    const user = userEvent.setup();
    const onError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Vanishing />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(await screen.findByRole('button', { name: 'Delete the row' }));
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onError).not.toHaveBeenCalled();
    onError.mockRestore();
  });
});
