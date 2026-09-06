import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A small status label. Six tones, two shapes.

**Use it for** a status that belongs to a row or a record: paid, pending,
cancelled, live.

**Do not use it for** anything clickable. A badge is not a button and not a
filter chip. If it does something when clicked it needs to be a button, with a
focus ring and a hit area big enough to press.

**Do not use it to count things** unless the count is a status. A number beside
a tab label is fine. A number that is really data belongs in a table cell.

**Turn on the dot for status.** Six tones separated by hue alone are six
identical lozenges to a colourblind reader, and WCAG 1.4.1 is explicit that
colour cannot be the only carrier. The label is the real fallback; the dot makes
the tone scannable for everyone else without depending on the hue.
        `.trim(),
      },
    },
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'accent', 'success', 'warning', 'danger', 'info'],
    },
    shape: { control: 'inline-radio', options: ['tag', 'pill'] },
    dot: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: { tone: 'neutral', shape: 'tag', dot: false, children: 'Draft' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral">Draft</Badge>
      <Badge tone="accent">Published</Badge>
      <Badge tone="success">Paid</Badge>
      <Badge tone="warning">Pending</Badge>
      <Badge tone="danger">Failed</Badge>
      <Badge tone="info">Live</Badge>
    </div>
  ),
};

export const WithDots: Story = {
  name: 'With status dots',
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="neutral" dot>
        Draft
      </Badge>
      <Badge tone="success" dot>
        Paid
      </Badge>
      <Badge tone="warning" dot>
        Pending
      </Badge>
      <Badge tone="danger" dot>
        Failed
      </Badge>
      <Badge tone="info" dot>
        Live
      </Badge>
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge shape="tag" tone="accent">
        tag, 3px radius
      </Badge>
      <Badge shape="pill" tone="accent">
        pill
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The radius rule gives anything under 32px tall a 3px corner, with a pill as the documented exception for a single short word. A pill wrapped around three words reads as a button that has lost its fill.',
      },
    },
  },
};

export const OrderStatuses: Story = {
  name: 'The order statuses this console uses',
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone="warning" dot>
        Pending
      </Badge>
      <Badge tone="success" dot>
        Paid
      </Badge>
      <Badge tone="accent" dot>
        Fulfilled
      </Badge>
      <Badge tone="danger" dot>
        Failed
      </Badge>
      <Badge tone="neutral" dot>
        Expired
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The five values the ticketing API can return for an order. Expired is neutral rather than red on purpose: an expired hold is the system working correctly, not a failure, and colouring it as an error trains operators to ignore red.',
      },
    },
  },
};
