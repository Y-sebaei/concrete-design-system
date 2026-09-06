import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText } from './Skeleton';
import { Card } from './Card';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A placeholder in the shape of the content that is arriving.

**Use it when** you know the shape of what is loading and the wait is likely to
be under a couple of seconds. A skeleton that matches the real layout stops the
page jumping when the data lands, which is the entire point.

**Do not use it when** you do not know the shape. A skeleton that guesses wrong
is worse than a spinner: the layout still jumps, and you have also lied about
what was coming.

**Do not use it for** a long or indeterminate wait. Past about five seconds a
skeleton stops reading as loading and starts reading as broken. Say what is
happening instead.

**It is silent.** Every skeleton carries aria-hidden, and the announcement is
made once for the whole region with aria-busy on the container. Announcing each
placeholder would produce a burst of noise proportional to the number of
rectangles on screen, which for a loading table is dozens.

**The animation is a sweep, not a pulse.** A pulsing block reads as a thing that
is broken; a sweep reads as a thing that is arriving. Under reduced motion it
stops entirely and holds a static tone, which still says loading.
        `.trim(),
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['text', 'block', 'circle'] },
  },
  args: { variant: 'text' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-md">
      <Skeleton {...args} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <p className="mb-2 font-ui text-label text-text-muted">text</p>
        <SkeletonText lines={4} />
      </div>
      <div>
        <p className="mb-2 font-ui text-label text-text-muted">block</p>
        <Skeleton variant="block" height={120} />
      </div>
      <div>
        <p className="mb-2 font-ui text-label text-text-muted">circle</p>
        <Skeleton variant="circle" width={40} height={40} />
      </div>
    </div>
  ),
};

export const MatchingTheLayout: Story = {
  name: 'Matching the real layout',
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <Card>
        <p className="mb-3 font-ui text-label text-text-muted">Loading</p>
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="45%" />
          <div className="mt-2 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="55%" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-ui text-label text-text-muted">Loaded</p>
        <div className="flex flex-col gap-3">
          <p className="font-ui text-title text-text">Kreuzberg Jazz Sessions</p>
          <p className="font-ui text-dense text-text-subtle">Prachtwerk, Berlin</p>
          <dl className="mt-2 grid grid-cols-3 gap-3">
            {[
              ['Capacity', '200'],
              ['Sold', '158'],
              ['Left', '42'],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-ui text-label text-text-muted">{label}</dt>
                <dd className="cui-tnum font-ui text-body text-text">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The two cards are close to the same height. That is the whole job: when the request resolves, nothing on the page moves.',
      },
    },
  },
};

export const RaggedLineEnds: Story = {
  name: 'Ragged line ends',
  render: () => (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <div>
        <p className="mb-2 font-ui text-label text-text-muted">SkeletonText</p>
        <SkeletonText lines={5} />
      </div>
      <div>
        <p className="mb-2 font-ui text-label text-text-muted">Identical bars, for comparison</p>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="text" />
          ))}
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'The left block reads as prose about to load. The right one reads as a table, or as a rendering fault. The only difference is that the line widths vary and the last line is short.',
      },
    },
  },
};
