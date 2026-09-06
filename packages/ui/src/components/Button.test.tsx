import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to type=button so it cannot submit a form by accident', () => {
    render(<Button>Filter</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('calls onClick when it is idle', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Apply</Button>);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('leaves the tab order when genuinely disabled', () => {
    render(<Button disabled>Refund</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  describe('loading', () => {
    it('stays focusable so a keyboard user is not dumped at the top of the page', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button loading>Refund</Button>
          <button type="button">Next</button>
        </>,
      );

      const button = screen.getByRole('button', { name: /Refund/ });

      // aria-disabled, not disabled: the button was focused when it started
      // loading, and `disabled` would move focus to <body> mid-task.
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toBeDisabled();

      await user.tab();
      expect(button).toHaveFocus();
    });

    it('reports itself busy and announces the state', () => {
      render(
        <Button loading loadingLabel="Refunding">
          Refund
        </Button>,
      );
      const button = screen.getByRole('button', { name: /Refund/ });

      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAccessibleName(
        expect.stringContaining('Refunding') as unknown as string,
      );
    });

    it('does not fire onClick', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Button loading onClick={onClick}>
          Refund
        </Button>,
      );

      await user.click(screen.getByRole('button', { name: /Refund/ }));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps the label in the layout so the button does not change width', () => {
      render(<Button loading>Refund</Button>);
      // The label is present but invisible, rather than replaced. A button that
      // shrinks to fit a spinner moves every control beside it in a toolbar.
      expect(screen.getByText('Refund')).toBeInTheDocument();
      expect(screen.getByText('Refund').closest('span')).toHaveClass('invisible');
    });

    it('yields to an explicit disabled prop', () => {
      render(
        <Button loading disabled>
          Refund
        </Button>,
      );
      const button = screen.getByRole('button');

      // Not transient, so leaving the tab order is correct here.
      expect(button).toBeDisabled();
      expect(button).not.toHaveAttribute('aria-busy');
    });
  });

  it('hides decorative icons from assistive technology', () => {
    render(<Button iconStart={<svg data-testid="icon" />}>Export</Button>);
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});
