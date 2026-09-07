import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Banner } from './Banner';
import { Button } from './Button';

const meta = {
  title: 'Components/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
An inline message about a condition.

**Use it for** something that is true right now and stays true until it stops:
search running degraded, a read-only session, an event that has been cancelled,
a stale cache. The banner sits in the layout next to the thing it describes and
leaves when the condition does.

**Do not use it for** an event. Something that happened once and is already over
is a Toast. The test is whether the message is still true in a minute.

**Do not use it for** a field-level problem. That belongs on the field, in the
Input's error slot, where the person fixing it is looking.

**Do not use it for** something that must be answered before continuing. A
banner can be scrolled past. That is a Modal.

**Do not stack them.** Three banners above a table is a page apologising for
itself, and the operator reads none of them. If two conditions are true at once,
say so in one banner.

### The distinction from Toast, which is the reason this exists

A toast reports an event: something happened, you may have missed it, here it is
for six seconds. A banner reports a state.

This library shipped without one, and the console had to put a degraded-search
notice into a toast. The API reports when Elasticsearch is unreachable and it
answered from Postgres instead, which means no ranking and no fuzzy matching.
That is true until the stack recovers. In a toast it was gone six seconds later
while still being true, and the operator spent the rest of the session looking at
unranked results with nothing on screen to say so. It was the first entry in the
README's findings list and this component is the fix.

### Announcement

\`role="alert"\` for the danger tone, which interrupts whatever is being read.
\`role="status"\` for everything else, which waits. Using assertive for both
teaches people to ignore it.

Unlike Toast, a banner needs no pre-mounted live region and no hidden twin: it
sits in the reading order where a screen reader will meet it anyway, and the
live role only decides whether they hear it sooner. Pass \`announce={false}\` for
a banner that is part of the page from the start.

### Colour is never the only carrier

Three channels: a 3px bar in the full tone colour, a drawn glyph, and the title.
The bar is the one that meets the 3:1 in WCAG 1.4.11, because the tinted
background sits around 1.2:1 against the surface under it. The title is what
carries the meaning to somebody who can see neither.
        `.trim(),
      },
    },
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'warning', 'danger', 'success'],
    },
    title: { control: 'text' },
    flush: { control: 'boolean' },
    announce: { control: 'boolean' },
  },
  args: {
    tone: 'info',
    title: 'Live inventory is reconnecting',
    children: 'Remaining counts are frozen until the socket is back.',
    flush: false,
    announce: true,
  },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-2xl">
      <Banner {...args} />
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-3">
      <Banner tone="info" title="Live inventory is reconnecting">
        Remaining counts are frozen until the socket is back.
      </Banner>
      <Banner tone="warning" title="Search is running degraded">
        Elasticsearch is unreachable, so results are coming from the database with no ranking and no
        fuzzy matching.
      </Banner>
      <Banner tone="danger" title="The events list could not be loaded">
        The API returned 503. It may still be starting.
      </Banner>
      <Banner tone="success" title="All holds released">
        Six seats returned to inventory.
      </Banner>
      <Banner tone="neutral" title="This event is in the past">
        Sales closed on 12 March. The figures below are final.
      </Banner>
    </div>
  ),
};

export const WithAnAction: Story = {
  name: 'With an action',
  render: () => (
    <div className="max-w-2xl">
      <Banner
        tone="danger"
        title="The events list could not be loaded"
        action={
          <Button size="sm" variant="secondary">
            Try again
          </Button>
        }
      >
        The API returned 503. It may still be starting.
      </Banner>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'One action. A banner with three buttons is a dialog that forgot to open, and it will be scrolled past anyway.',
      },
    },
  },
};

export const Dismissible: Story = {
  render: function DismissibleStory() {
    const [shown, setShown] = useState(true);

    return (
      <div className="flex max-w-2xl flex-col gap-3">
        {shown ? (
          <Banner
            tone="warning"
            title="Search is running degraded"
            onDismiss={() => setShown(false)}
          >
            Results are coming from the database with no ranking or fuzzy matching.
          </Banner>
        ) : (
          <Button variant="secondary" onClick={() => setShown(true)}>
            Bring it back
          </Button>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only offer a dismiss where dismissing means something. A condition the operator cannot clear and needs to keep in mind should not have a button that makes it disappear, because it will be pressed and the condition will still be true.',
      },
    },
  },
};

export const Flush: Story = {
  render: () => (
    <div className="max-w-3xl overflow-hidden rounded-lg border border-border bg-surface-raised">
      <Banner flush tone="warning" title="This console is read only">
        You are signed in as an auditor. Counter sales and refunds are hidden.
      </Banner>
      <div className="p-4">
        <p className="cui-prose text-text-subtle">
          Flush drops the radius and the side borders, for a banner that spans the full width of a
          panel or the viewport. The radius rule gives a full-bleed element zero corners, because a
          curve flush with the edge has nothing to be rounded against.
        </p>
      </div>
    </div>
  ),
};

export const TitleOnly: Story = {
  name: 'Title only',
  render: () => (
    <div className="flex max-w-2xl flex-col gap-3">
      <Banner tone="neutral" title="Draft events are not shown here" announce={false} />
      <Banner tone="info" title="Figures update live" announce={false} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'A description is optional. Both of these are permanent notices rather than things that just became true, so they pass announce={false} and are left to be found in the reading order.',
      },
    },
  },
};
