import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A dialog with a focus trap and focus restore, written by hand.

**Use it when** the task genuinely interrupts: a destructive confirmation, or a
short form whose result changes what is behind it.

**Do not use it for** anything the user might want to refer back to while
working. A modal hides the page, so a dialog showing an order while the operator
is reading the events table behind it is the wrong shape. That is a detail panel.

**Do not stack them.** A modal opening another modal means the first one was not
a decision point. The scroll lock in this library is reference counted so that
stacking does not break the page, but that is damage control, not permission.

**Do not use it for** errors that arrive on their own. That is a Toast.

### What the focus trap actually does

1. On open, the currently focused element is stored.
2. Focus moves to initialFocus, else the first tabbable element, else the dialog
   itself, which carries tabindex of minus one for exactly this case.
3. Tab and Shift+Tab wrap. The tabbable list is recomputed on every keypress, so
   controls that appear or become enabled while the dialog is open are included.
   A trap built on a list captured at open time sends focus to elements that are
   no longer there.
4. A focusin listener on the document catches focus arriving from anywhere else,
   which in practice means the browser chrome. Tab handling alone does not cover
   that, and it is the usual reason a trap that passes a keyboard test still
   leaks in a real browser.
5. On close, focus returns to the stored element, or to the body if that element
   has since left the document, which happens when the dialog deletes the row it
   was opened from.

### Why it opens in 320ms, the slowest thing in the system

Light Concrete has no shadows, so a dialog has only a tonal step and a scrim to
announce itself with. Both are quiet next to a drop shadow, so the transition
needs slightly more time to be legible. A system built on elevation shadows could
open a dialog in 200ms and still read clearly. The duration is a consequence of
the elevation model, not a taste call.
        `.trim(),
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    closeOnScrimClick: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    // Overridden by every story; present because the component requires them.
    open: false,
    onClose: () => {},
    size: 'md',
    closeOnScrimClick: true,
    hideCloseButton: false,
    title: 'Order 4d1f',
    description: 'Two tickets for Kreuzberg Jazz Sessions.',
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open order
        </Button>

        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Refund
              </Button>
            </>
          }
        >
          <dl className="grid grid-cols-2 gap-4">
            {[
              ['Status', <Badge key="s" tone="success" dot>Paid</Badge>],
              ['Customer', 'ada@example.berlin'],
              ['Total', '49.80 EUR'],
              ['Paid at', '12 March, 20:14'],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="font-ui text-label text-text-muted">{label}</dt>
                <dd className="mt-1 font-ui text-body text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      </div>
    );
  },
};

export const KeyboardOnly: Story = {
  name: 'Keyboard only',
  render: function KeyboardStory(args) {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="cui-prose text-text-subtle">
          Open this with the keyboard and keep going with the keyboard. Tab wraps at both ends,
          Escape closes, and focus returns to the button you opened it from. The button after it is
          there to prove focus never reaches the page behind.
        </p>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => setOpen(true)}>
            Open dialog
          </Button>
          <Button variant="ghost">Behind the dialog</Button>
        </div>

        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          title="Refund order 4d1f"
          description="This releases two seats back to inventory."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Refund 49.80 EUR
              </Button>
            </>
          }
        >
          <Input label="Reason" placeholder="Shown on the customer receipt" />
        </Modal>
      </div>
    );
  },
};

export const InitialFocus: Story = {
  name: 'Choosing where focus lands',
  render: function InitialFocusStory(args) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Record a counter sale
        </Button>

        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          title="Counter sale"
          description="Focus goes to the email field rather than the close button."
          initialFocus={inputRef}
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Take payment
            </Button>
          }
        >
          <div className="flex flex-col gap-3">
            <Input ref={inputRef} label="Customer email" placeholder="name@example.com" required />
            <Input label="Quantity" numeric defaultValue="1" />
          </div>
        </Modal>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'By default focus goes to the first tabbable element, which is usually the close button. For a dialog whose job is data entry, point initialFocus at the first field instead so the user can start typing straight away.',
      },
    },
  },
};

export const MustAnswer: Story = {
  name: 'A decision the user must make',
  render: function MustAnswerStory(args) {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Cancel the event
        </Button>

        <Modal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          size="sm"
          title="Cancel Kreuzberg Jazz Sessions?"
          description="158 tickets have been sold. Every holder is refunded and emailed."
          closeOnScrimClick={false}
          hideCloseButton
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Keep the event
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Cancel and refund
              </Button>
            </>
          }
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'With closeOnScrimClick off and the corner button hidden, the dialog has two explicit ways out and no accidental one. Escape still works, and that is deliberate: removing it would trap a keyboard user in a dialog that a mouse user can leave by clicking away.',
      },
    },
  },
};

export const Sizes: Story = {
  render: function SizesStory(args) {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
    return (
      <div className="flex gap-2">
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <Button key={s} variant="secondary" onClick={() => setSize(s)}>
            Open {s}
          </Button>
        ))}

        <Modal
          {...args}
          open={size !== null}
          onClose={() => setSize(null)}
          size={size ?? 'md'}
          title={`Size ${size ?? ''}`}
          description="All three take the 16px radius, the largest in the system."
        >
          <p className="cui-prose text-text">
            The measure is capped so that body copy inside a large dialog does not run to a line
            length nobody can read.
          </p>
        </Modal>
      </div>
    );
  },
};
