import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from './Toast';
import { Button } from './Button';
import { Card } from './Card';

const meta = {
  title: 'Components/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Transient messages, announced properly.

**Use it for** something that happened without the user asking: the socket
dropped, a background request failed, a queued job finished.

**Do not use it for** the result of a form the user just submitted, when that
result belongs next to the form. Validation errors go on the field. A toast that
says "check the highlighted fields" is a message that has travelled to the wrong
end of the screen.

**Do not use it for** anything the user must act on before continuing. Toasts
disappear, and some people will not have read it. That is a dialog, or an inline
banner.

**Do not put more than one action in one.** A toast is not a dialog, and a
keyboard user has to tab to it to reach the action at all.

### How the announcing works

Two live regions, both rendered empty from first mount and never unmounted. A
live region inserted into the DOM at the same moment as its text is not reliably
announced by NVDA or VoiceOver, and that single detail is why most toast
implementations are silent in a screen reader while looking perfectly correct in
the markup.

Each region is cleared before the new message is written, in a separate commit.
Without that, an identical message twice in a row does not change the region text
and is never announced the second time, so a user who is not looking at the
screen hears about the first failed request and not the second.

Errors go to the assertive region and everything else to the polite one.
Assertive interrupts whatever is being read, which is right for "that request
failed" and wrong for "saved", and using it for both teaches people to ignore it.

The visible toast carries no live region of its own, so each message is announced
exactly once while its dismiss and action buttons stay reachable. Marking the
toast aria-hidden would also stop the duplicate, and would bury focusable
controls inside a hidden subtree, which is both an axe violation and a real dead
end.

### Timing

Errors do not auto-dismiss. An error that vanishes on its own is an error nobody
read. Everything else clears after six seconds, and the countdown pauses while
the pointer is over the toast or focus is inside it.
        `.trim(),
      },
    },
  },
  argTypes: {
    limit: { control: { type: 'number', min: 1, max: 8 } },
    defaultDuration: { control: { type: 'number', step: 500 } },
  },
  args: {
    limit: 4,
    defaultDuration: 6000,
    // The provider wraps its story's own demo component, so this is a
    // placeholder rather than the rendered tree.
    children: null,
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const { toast, dismissAll } = useToast();

  return (
    <Card className="max-w-lg">
      <p className="font-ui text-title text-text">Fire a toast</p>
      <p className="cui-prose mt-2 text-text-subtle">
        Turn on a screen reader and try the last two buttons in a row. Both messages are announced,
        which is the part that usually breaks.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => toast({ title: 'Holds released', description: 'Six seats returned to inventory.', tone: 'success' })}
        >
          Success
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: 'Search is degraded',
              description: 'Results are coming from the database, so ranking is off.',
              tone: 'warning',
            })
          }
        >
          Warning
        </Button>

        <Button
          variant="secondary"
          onClick={() => toast({ title: 'Live inventory reconnected', tone: 'info' })}
        >
          Info
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            toast({
              title: 'Could not load events',
              description: 'The API returned 503.',
              tone: 'danger',
              action: { label: 'Retry', onClick: () => toast({ title: 'Retrying', tone: 'info' }) },
            })
          }
        >
          Error with an action
        </Button>

        <Button
          variant="secondary"
          onClick={() => toast({ title: 'Request failed', tone: 'danger' })}
        >
          Repeat this one twice
        </Button>

        <Button variant="ghost" onClick={dismissAll}>
          Dismiss all
        </Button>
      </div>
    </Card>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Demo />
    </ToastProvider>
  ),
};

function ReconnectDemo() {
  const { toast } = useToast();
  return (
    <Card className="max-w-lg">
      <p className="font-ui text-title text-text">A socket reconnecting</p>
      <p className="cui-prose mt-2 text-text-subtle">
        Press this several times. Because every message shares a key, the eighth attempt updates
        the first toast in place instead of building a column of identical messages. This is the
        reason the key option exists.
      </p>
      <Button
        className="mt-4"
        variant="secondary"
        onClick={() =>
          toast({
            title: 'Live inventory disconnected',
            description: 'Reconnecting.',
            tone: 'warning',
            key: 'socket',
          })
        }
      >
        Drop the socket
      </Button>
    </Card>
  );
}

export const KeyedReplacement: Story = {
  name: 'Replacing instead of stacking',
  render: (args) => (
    <ToastProvider {...args}>
      <ReconnectDemo />
    </ToastProvider>
  ),
};
