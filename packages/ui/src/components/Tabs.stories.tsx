import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TabPanel, Tabs } from './Tabs';
import { Badge } from './Badge';
import { Card } from './Card';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Tabs following the ARIA tabs pattern, with a roving tabindex.

**Use them for** alternative views of the same subject, where the user swaps
between them and does not need to compare.

**Do not use them for** steps in a sequence. That is a wizard, and tabs give the
user no sense of order or progress.

**Do not use them to** hide content the user needs at the same time as what is
already on screen. If two panels have to be compared, they are two regions, not
two tabs.

**Do not use them for** navigation between pages. If each tab is a URL, they are
links, and they should behave like links: middle-clickable, and announced as
navigation.

### Roving tabindex

Exactly one tab is in the tab order, the selected one, and arrow keys move
between the rest. Without it, a keyboard user presses Tab once per tab to get
past the tablist, so a nine-tab list costs nine keystrokes to reach the content
the tabs describe.

### Automatic or manual activation

Automatic selects a tab as soon as it receives focus, which is the ARIA default
and correct when switching is instant. Use manual when a panel loads data:
automatic activation fires a request for every tab the user arrows past on the
way to the one they wanted.

### Why an underline and not a filled pill

Tabs in this system usually sit directly above a table, and a filled tab puts a
second band of colour immediately above the table header, which already has one.
An underline puts the emphasis on the boundary between the tab and its panel,
which is the relationship the control is describing.
        `.trim(),
      },
    },
  },
  argTypes: {
    activation: { control: 'inline-radio', options: ['automatic', 'manual'] },
    label: { control: 'text' },
  },
  args: {
    activation: 'automatic',
    label: 'Console sections',
    // Required by the component. Each story drives these from its own state.
    items: [],
    value: '',
    onChange: () => {},
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const items = [
  { value: 'events', label: 'Events' },
  {
    value: 'orders',
    label: 'Orders',
    badge: (
      <Badge tone="neutral" shape="pill">
        12
      </Badge>
    ),
  },
  { value: 'holds', label: 'Holds', disabled: true },
  { value: 'refunds', label: 'Refunds' },
];

export const Playground: Story = {
  render: function PlaygroundStory(args) {
    const [value, setValue] = useState('events');
    return (
      <div className="max-w-2xl">
        <Tabs {...args} items={items} value={value} onChange={setValue}>
          <TabPanel value="events" focusable>
            <Card surface="flat">Every event with a published sale.</Card>
          </TabPanel>
          <TabPanel value="orders" focusable>
            <Card surface="flat">Orders this console has issued.</Card>
          </TabPanel>
          <TabPanel value="refunds" focusable>
            <Card surface="flat">Refunds raised in the last thirty days.</Card>
          </TabPanel>
        </Tabs>
        <p className="cui-prose mt-4 text-text-subtle">
          Tab once to reach the tablist, then use the arrow keys. Holds is disabled and is stepped
          over rather than landed on. Home and End jump to the ends.
        </p>
      </div>
    );
  },
};

export const ManualActivation: Story = {
  name: 'Manual activation',
  render: function ManualStory(args) {
    const [value, setValue] = useState('events');
    const [loads, setLoads] = useState<string[]>(['events']);

    return (
      <div className="max-w-2xl">
        <Tabs
          {...args}
          activation="manual"
          items={items}
          value={value}
          onChange={(next) => {
            setValue(next);
            setLoads((current) => [...current, next]);
          }}
        >
          <TabPanel value="events" focusable>
            <Card surface="flat">Events</Card>
          </TabPanel>
          <TabPanel value="orders" focusable>
            <Card surface="flat">Orders</Card>
          </TabPanel>
          <TabPanel value="refunds" focusable>
            <Card surface="flat">Refunds</Card>
          </TabPanel>
        </Tabs>

        <p className="cui-prose mt-4 text-text-subtle">
          Arrow from Events to Refunds. Focus moves through Orders without selecting it, so no
          request is fired for a panel the user was only passing through. Press Enter to commit.
        </p>
        <p className="mt-2 font-mono text-[11px] text-text-subtle">
          panels loaded: {loads.join(', ')}
        </p>
      </div>
    );
  },
};

export const WithCounts: Story = {
  name: 'With counts',
  render: function CountsStory(args) {
    const [value, setValue] = useState('all');
    return (
      <div className="max-w-2xl">
        <Tabs
          {...args}
          label="Order status"
          value={value}
          onChange={setValue}
          items={[
            { value: 'all', label: 'All', badge: <Badge shape="pill">128</Badge> },
            {
              value: 'pending',
              label: 'Pending',
              badge: (
                <Badge tone="warning" shape="pill">
                  9
                </Badge>
              ),
            },
            {
              value: 'failed',
              label: 'Failed',
              badge: (
                <Badge tone="danger" shape="pill">
                  2
                </Badge>
              ),
            },
          ]}
        >
          <TabPanel value={value} focusable>
            <Card surface="flat">Showing {value} orders.</Card>
          </TabPanel>
        </Tabs>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'A count beside a tab label is a status, which is the one case a badge should carry a number. The badge is inside the tab button, so it is part of the tab accessible name and gets read with it.',
      },
    },
  },
};
