import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Four variants, three sizes, and every state drawn rather than defaulted.

**Use it for** an action the user takes: submitting, refunding, releasing a
hold, opening a dialog.

**Do not use it for** navigation. Something that changes the URL is a link, and
a link is what a screen reader user needs to hear so they know a new page is
coming, and what a middle click needs to open in a new tab. A button styled as
a link is a bug that only shows up for people who are not using a mouse.

**Variant, in one line each.** \`primary\` is the one action a screen is for,
and there should be at most one on screen. \`secondary\` is the default and
covers almost everything. \`ghost\` is for actions in a dense row, where four
outlined buttons would out-shout the data. \`danger\` is for destructive work,
and it does not replace a confirmation.

**Loading is not disabled.** A loading button keeps \`aria-disabled\` and stays
in the tab order, because \`disabled\` moves focus to the document body at the
exact moment the user has pressed the button, which strands a keyboard user
mid-task. The label also stays in the layout at zero opacity, so the button
does not change width and move everything beside it.
        `.trim(),
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    block: { control: 'boolean' },
    children: { control: 'text' },
    loadingLabel: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Release holds',
    variant: 'secondary',
    size: 'md',
    loading: false,
    disabled: false,
    block: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-3">
      <Button {...args} size="sm">
        Small, 28px
      </Button>
      <Button {...args} size="md">
        Medium, 36px
      </Button>
      <Button {...args} size="lg">
        Large, 44px
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Only the 44px size meets the WCAG 2.2 target size guidance on its own. The two smaller sizes exist for controls inside a table row, where 44px would double the row height, and they should be surrounded by enough spacing to make up the difference.',
      },
    },
  },
};

export const EveryState: Story = {
  name: 'Every state',
  render: () => (
    <div className="flex flex-col gap-6">
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          <code className="w-20 shrink-0 font-mono text-[11px] text-text-subtle">{variant}</code>
          <Button variant={variant}>Rest</Button>
          <Button variant={variant} loading>
            Loading
          </Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
        </div>
      ))}
      <p className="cui-prose text-text-subtle">
        Hover and active states are live, so they are worth trying with a pointer rather than
        reading. Focus is best seen with the Tab key: every button here draws the two-layer ring
        described in Foundations, Focus.
      </p>
    </div>
  ),
};

export const WithIcons: Story = {
  name: 'With icons',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        iconStart={
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path
              d="M6 2v8M2 6h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        }
      >
        New counter sale
      </Button>

      <Button
        variant="ghost"
        iconEnd={
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path
              d="M4.5 2.5 8 6l-3.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
      >
        Open order
      </Button>

      <Button variant="secondary" aria-label="Refresh the events list">
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
          <path
            d="M12 7a5 5 0 1 1-1.5-3.5M12 1.5V4H9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Icons are wrapped in aria-hidden, so an icon-only button needs an aria-label of its own. The third button here has one; without it, a screen reader announces "button" and nothing else.',
      },
    },
  },
};

export const LoadingKeepsWidth: Story = {
  name: 'Loading keeps its width',
  render: function LoadingDemo() {
    const [loading, setLoading] = useState(false);
    return (
      <Card className="w-fit">
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            loading={loading}
            loadingLabel="Releasing holds"
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2200);
            }}
          >
            Release expired holds
          </Button>
          <Button variant="ghost">Cancel</Button>
        </div>
        <p className="cui-prose mt-3 text-text-subtle">
          Press it. The button holds its width, so Cancel does not move under the pointer, and focus
          stays on the button that was pressed rather than jumping to the top of the page.
        </p>
      </Card>
    );
  },
};
