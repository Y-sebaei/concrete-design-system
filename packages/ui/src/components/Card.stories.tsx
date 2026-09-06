import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A surface, one tonal step from the page.

**Use it to** group content that belongs together and needs to be separable from
what surrounds it.

**Do not use it** for everything. A page made entirely of cards has no hierarchy
left: if every region is lifted, none of them is. In a dense console most regions
should sit on the page ground with a rule between them, and cards belong to
things that genuinely are objects.

**The detail that matters** is that Card republishes the focus ring offset as its
own background. A button inside a raised card gets an inner focus ring in the
card tone rather than the page tone, so the ring reads identically whether the
control is on the page, on a card, or inside a modal. Every component in this
library that establishes a surface does the same.
        `.trim(),
      },
    },
  },
  argTypes: {
    surface: { control: 'inline-radio', options: ['flat', 'raised', 'overlay'] },
    bleed: { control: 'boolean' },
  },
  args: { surface: 'raised', bleed: false },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} className="max-w-md">
      <CardHeader
        actions={
          <Badge tone="success" dot>
            On sale
          </Badge>
        }
      >
        <CardTitle>Kreuzberg Jazz Sessions</CardTitle>
        <CardDescription>Thursday 12 March, 21:00 · Prachtwerk, Berlin</CardDescription>
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-3 gap-3">
          {[
            ['Capacity', '200'],
            ['Sold', '158'],
            ['Remaining', '42'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-ui text-label text-text-muted">{label}</dt>
              <dd className="cui-tnum mt-0.5 font-ui text-title text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </CardBody>
      <CardFooter>
        <Button variant="ghost">Export</Button>
        <Button variant="primary">Open event</Button>
      </CardFooter>
    </Card>
  ),
};

export const Surfaces: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['flat', 'raised', 'overlay'] as const).map((surface) => (
        <Card key={surface} surface={surface} className="max-w-md">
          <p className="font-ui text-label text-text-muted">surface-{surface}</p>
          <p className="cui-prose mt-2 text-text">
            Tab into the button to see the focus ring pick up this surface tone.
          </p>
          <Button className="mt-3" variant="secondary">
            Focus me
          </Button>
        </Card>
      ))}
    </div>
  ),
};

export const Bleed: Story = {
  name: 'Without padding',
  render: () => (
    <Card bleed className="max-w-md overflow-hidden">
      <div className="border-b border-border bg-surface-sunken px-4 py-2">
        <p className="font-ui text-label text-text-muted">Ticket types</p>
      </div>
      <ul>
        {[
          ['Early bird', '18.00', 'Sold out'],
          ['Standard', '24.00', '42 left'],
          ['Door', '28.00', 'Not on sale'],
        ].map(([name, price, note]) => (
          <li
            key={name}
            className="flex items-baseline justify-between border-b border-border-subtle px-4 py-2.5 last:border-b-0"
          >
            <span className="font-ui text-body text-text">{name}</span>
            <span className="flex items-baseline gap-3">
              <span className="cui-tnum font-ui text-body text-text">{price}</span>
              <span className="font-ui text-dense text-text-subtle">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Set bleed when the card wraps something that owns its own padding, such as a table or a list with full-width row separators. Padding on both leaves the separators floating short of the edge.',
      },
    },
  },
};
