import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ramps, resolve, type RampName } from '../tokens/palette';
import { light, dark, contrastRules } from '../tokens/semantics';
import { contrastRatio } from '../tokens/contrast';
import { control, duration, easing, radius, space, text, measure } from '../tokens/scale';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const meta: Meta = {
  title: 'Foundations',
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: true } },
  },
};
export default meta;

type Story = StoryObj;

/* -------------------------------------------------------------------------- */
/* Shared page furniture                                                       */
/* -------------------------------------------------------------------------- */

function Page({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-app p-8">
      <header className="mb-8">
        <h1 className="font-ui text-display text-text">{title}</h1>
        <p className="cui-prose mt-3 text-text-subtle">{lede}</p>
      </header>
      <div className="flex flex-col gap-10">{children}</div>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-ui text-title text-text">{title}</h2>
      {note ? (
        <p className="cui-prose mt-2 mb-4 text-text-subtle">{note}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Colour                                                                      */
/* -------------------------------------------------------------------------- */

function RampRow({ name }: { name: RampName }) {
  const ramp = ramps[name] as Record<number, string>;
  const steps = Object.keys(ramp)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div>
      <p className="mb-2 font-ui text-label text-text-muted">{name}</p>
      <div className="flex overflow-hidden rounded-lg border border-border">
        {steps.map((step) => {
          const hex = ramp[step]!;
          // Label colour is picked from the swatch itself rather than assumed,
          // so the specimen stays legible at both ends of every ramp.
          const onLight = contrastRatio(hex, '#171a15') > contrastRatio(hex, '#faf9f5');
          return (
            <div
              key={step}
              className="flex h-20 flex-1 flex-col justify-end p-1.5"
              style={{ backgroundColor: hex }}
            >
              <span
                className="font-ui text-label"
                style={{ color: onLight ? '#171a15' : '#faf9f5' }}
              >
                {step}
              </span>
              <span
                className="cui-tnum font-mono text-[10px] leading-tight"
                style={{ color: onLight ? '#171a15' : '#faf9f5', opacity: 0.8 }}
              >
                {hex.replace('#', '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SemanticTable() {
  const roles = Object.keys(light) as (keyof typeof light)[];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-raised">
      {/* A focusable scroll container, for the reason given in Table.tsx. */}
      <div
        className="w-full overflow-x-auto"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="group"
        aria-label="Semantic roles, scrollable"
      >
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Every semantic role, with the ramp step it resolves to in each theme
          </caption>
          <thead>
            <tr className="border-b border-border bg-surface-sunken">
              {['Role', 'Light', 'Dark'].map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-3 py-2 font-ui text-label text-text-muted"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const lightSwatch = light[role];
              const darkSwatch = dark[role];
              return (
                <tr key={role} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-3 py-2 font-mono text-dense text-text">--ui-{role}</td>
                  {[lightSwatch, darkSwatch].map((swatch, i) => (
                    <td key={i} className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="size-5 shrink-0 rounded-sm border border-border"
                          style={{ backgroundColor: resolve(swatch) }}
                        />
                        <span className="font-ui text-dense text-text-muted">
                          {swatch[0]}.{swatch[1]}
                        </span>
                        <span className="cui-tnum font-mono text-[11px] text-text-subtle">
                          {resolve(swatch)}
                        </span>
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Colour: Story = {
  render: () => (
    <Page
      title="Colour"
      lede="One ramp set, two themes. Neither theme holds a hex value: both are mappings from a semantic role to a step, which is what stops them drifting apart. The neutrals are warm concrete pulled a few degrees toward the moss accent, and no step is a true grey."
    >
      <Section
        title="Primitive ramps"
        note="Steps are numbered by lightness, not by usage. concrete.100 means the third lightest step, never the app background."
      >
        <div className="flex flex-col gap-5">
          {(Object.keys(ramps) as RampName[]).map((name) => (
            <RampRow key={name} name={name} />
          ))}
        </div>
      </Section>

      <Section
        title="Semantic roles"
        note="Switch the toolbar theme to watch the right-hand column take effect. Every row here is generated from semantics.ts, so this table cannot fall out of date."
      >
        <SemanticTable />
      </Section>

      <Section
        title="The contrast contract"
        note={`${contrastRules.length} declared pairs, checked in both themes by npm run contrast, which fails the build. The list is maintained by hand so that every entry is a combination a component actually renders.`}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {contrastRules.slice(0, 8).map((rule, i) => {
            const ratio = contrastRatio(resolve(light[rule.fg]), resolve(light[rule.bg]));
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                style={{ backgroundColor: resolve(light[rule.bg]) }}
              >
                <span className="font-ui text-dense" style={{ color: resolve(light[rule.fg]) }}>
                  {rule.fg} on {rule.bg}
                </span>
                <span
                  className="cui-tnum font-mono text-[11px]"
                  style={{ color: resolve(light[rule.fg]) }}
                >
                  {ratio.toFixed(2)}:1
                </span>
              </div>
            );
          })}
        </div>
      </Section>
    </Page>
  ),
};

/* -------------------------------------------------------------------------- */
/* Typography                                                                  */
/* -------------------------------------------------------------------------- */

const SPECIMEN = 'Kreuzberg Jazz Sessions, 42 remaining';

export const Typography: Story = {
  render: () => {
    const uiSteps = Object.entries(text).filter(([key]) => !key.startsWith('prose-'));
    const proseSteps = Object.entries(text).filter(([key]) => key.startsWith('prose-'));

    return (
      <Page
        title="Typography"
        lede="Two families with one rule about which is which: Schibsted Grotesk for anything you operate, Newsreader for anything you read. Two scales, because a table cell is scanned and a paragraph is read continuously, and those want different sizes."
      >
        <Section
          title="Interface scale, Schibsted Grotesk"
          note="Ratio 1.2. Tracking tightens as size grows, which is the optical correction that makes a scale look drawn rather than scaled up."
        >
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-5">
            {uiSteps.map(([key, step]) => (
              <div key={key} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                <code className="w-28 shrink-0 font-mono text-[11px] text-text-subtle">{key}</code>
                <span className="cui-tnum w-40 shrink-0 font-mono text-[11px] text-text-subtle">
                  {step.size}/{step.leading} · {step.tracking >= 0 ? '+' : ''}
                  {step.tracking}em · {step.weight}
                </span>
                <span
                  className="text-text"
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: `${step.size}px`,
                    lineHeight: `${step.leading}px`,
                    letterSpacing: `${step.tracking}em`,
                    fontWeight: step.weight,
                    textTransform: key === 'label' ? 'uppercase' : undefined,
                  }}
                >
                  {SPECIMEN}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Prose scale, Newsreader"
          note={`Ratio 1.25, always inside a ${measure} measure. It starts at 17px rather than the interface's 15px because documentation is read continuously.`}
        >
          <div className="rounded-lg border border-border bg-surface-raised p-5">
            {proseSteps.map(([key, step]) => (
              <div key={key} className="mb-4 last:mb-0">
                <code className="font-mono text-[11px] text-text-subtle">
                  {key} · {step.size}/{step.leading} · {step.tracking}em
                </code>
                <p
                  className="mt-1 text-text"
                  style={{
                    fontFamily: 'var(--font-prose)',
                    fontSize: `${step.size}px`,
                    lineHeight: `${step.leading}px`,
                    letterSpacing: `${step.tracking}em`,
                    fontWeight: step.weight,
                    maxWidth: measure,
                    fontVariantNumeric: 'proportional-nums oldstyle-nums',
                  }}
                >
                  The box office holds 42 seats back for the door. Anything not sold by 20:45 is
                  released to the queue outside.
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Tabular figures"
          note="Lining tabular numerals are the document default, and prose opts out. Proportional figures in a right-aligned column are the most common typographic defect in an operator interface."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['Tabular, the default', 'cui-tnum'],
                ['Proportional, wrong here', 'cui-pnum'],
              ] as const
            ).map(([label, klass]) => (
              <div key={label} className="rounded-lg border border-border bg-surface-raised p-4">
                <p className="mb-2 font-ui text-label text-text-muted">{label}</p>
                <table className="w-full">
                  <tbody className={klass}>
                    {['1,118.00', '94.50', '1,001.25', '111.10'].map((n) => (
                      <tr key={n}>
                        <td className="py-0.5 text-right font-ui text-body text-text">{n}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Section>
      </Page>
    );
  },
};

/* -------------------------------------------------------------------------- */
/* Spacing                                                                     */
/* -------------------------------------------------------------------------- */

export const Spacing: Story = {
  render: () => (
    <Page
      title="Spacing"
      lede="Base 4, going non-linear above 32. The small end needs fine control because it sets the density of a table row, where 6 and 8 are genuinely different decisions. The large end does not: once a gap separates whole regions, 44 and 48 are the same gap, and offering both only invites inconsistency."
    >
      <Section title="The ramp">
        <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface-raised p-5">
          {Object.entries(space).map(([key, value]) => (
            <div key={key} className="flex items-center gap-4">
              <code className="w-14 shrink-0 font-mono text-[11px] text-text-subtle">{key}</code>
              <span className="cui-tnum w-12 shrink-0 font-mono text-[11px] text-text-subtle">
                {value}px
              </span>
              <span
                aria-hidden="true"
                className="h-4 rounded-sm bg-accent"
                style={{ width: Math.max(value, 1) }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Control heights"
        note="Three, and only the largest meets the WCAG 2.2 target size guidance on its own. The smaller two exist for controls that sit inside a table row, and they carry that caveat rather than being offered as equals."
      >
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface-raised p-5">
          {Object.entries(control).map(([key, spec]) => (
            <div key={key} className="flex flex-col gap-1.5">
              <code className="font-mono text-[11px] text-text-subtle">
                {key} · {spec.height}px
              </code>
              <Button size={key as 'sm' | 'md' | 'lg'} variant="secondary">
                Release holds
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </Page>
  ),
};

/* -------------------------------------------------------------------------- */
/* Radius and elevation                                                        */
/* -------------------------------------------------------------------------- */

export const RadiusAndElevation: Story = {
  name: 'Radius and elevation',
  render: () => (
    <Page
      title="Radius and elevation"
      lede="Radius is a function of how big the thing is, not a value chosen per component. Elevation is a tonal step, not a shadow: light Concrete has no shadows at all, and dark mode adds exactly one, for overlays."
    >
      <Section
        title="Radius by element size"
        note="A fixed radius looks tighter as the element grows, so holding one value across a 16px badge and a 640px modal makes the modal look sharper than the badge even though the number is identical. Full-bleed elements take zero, because a rounded corner flush with the viewport has nothing to be rounded against and reads as a rendering mistake."
      >
        <div className="flex flex-wrap gap-4">
          {(
            [
              ['none', 'full-bleed: table shell, toolbar, page header'],
              ['sm', 'under 32px tall: badges, chips'],
              ['md', '32 to 44px: inputs, buttons, select'],
              ['lg', 'cards, panels, popovers, listboxes'],
              ['xl', 'modals and sheets'],
              ['full', 'status dots and pills only'],
            ] as const
          ).map(([key, use]) => (
            <div key={key} className="flex w-56 flex-col gap-2">
              <div
                aria-hidden="true"
                className="h-20 border border-accent-border bg-accent-bg"
                style={{ borderRadius: radius[key] === 9999 ? 9999 : `${radius[key]}px` }}
              />
              <code className="font-mono text-[11px] text-text-subtle">
                --radius-{key} · {radius[key] === 9999 ? 'pill' : `${radius[key]}px`}
              </code>
              <p className="font-ui text-dense text-text-subtle">{use}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Elevation, as tone"
        note="Four levels. Selected and active states use an accent tint rather than a fifth step, because by the fourth step two adjacent surfaces are no longer reliably distinguishable on a mediocre monitor, and a tint says chosen where another grey step only says different."
      >
        <div className="rounded-lg bg-surface-sunken p-6">
          <p className="mb-3 font-ui text-label text-text-muted">surface-sunken</p>
          <div className="rounded-lg bg-surface-app p-6">
            <p className="mb-3 font-ui text-label text-text-muted">surface-app</p>
            <div className="rounded-lg bg-surface-raised p-6">
              <p className="mb-3 font-ui text-label text-text-muted">surface-raised</p>
              <div className="rounded-lg bg-surface-overlay p-6 shadow-overlay">
                <p className="font-ui text-label text-text-muted">
                  surface-overlay · shadow-overlay, which is none in light mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Page>
  ),
};

/* -------------------------------------------------------------------------- */
/* Motion                                                                      */
/* -------------------------------------------------------------------------- */

function MotionSpecimen({ label, ms, ease }: { label: string; ms: number; ease: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <code className="font-mono text-[11px] text-text-subtle">{label}</code>
        <span className="cui-tnum font-mono text-[11px] text-text-subtle">{ms}ms</span>
      </div>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        className="cui-focus w-full rounded-md bg-surface-sunken p-2 text-left"
        aria-label={`Play the ${label} specimen`}
      >
        <span
          aria-hidden="true"
          className="block h-6 w-6 rounded-sm bg-accent"
          style={{
            transform: on ? 'translateX(calc(100% * 6))' : 'translateX(0)',
            transitionProperty: 'transform',
            transitionDuration: `${ms}ms`,
            transitionTimingFunction: ease,
          }}
        />
      </button>
    </div>
  );
}

export const Motion: Story = {
  render: () => (
    <Page
      title="Motion"
      lede="Four durations and one easing for almost everything. The modal is the slowest thing in the system at 320ms, and that is a consequence of the elevation model rather than a taste call: a system with no shadow in light mode has only a tonal step and a scrim to announce a dialog with, and both are quiet enough to need a little more time to read."
    >
      <Section title="Durations" note="Click a specimen to play it.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(duration).map(([key, ms]) => (
            <MotionSpecimen key={key} label={`--duration-${key}`} ms={ms} ease={easing.standard} />
          ))}
        </div>
      </Section>

      <Section
        title="Easings"
        note="Standard for everything unless there is a reason. Exit starts fast so dismissal feels immediate. Enter decelerates hard at the end, for things arriving from nothing: a listbox, a toast."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {Object.entries(easing).map(([key, value]) => (
            <MotionSpecimen key={key} label={`--ease-${key}`} ms={duration.medium} ease={value} />
          ))}
        </div>
      </Section>

      <Section
        title="Reduced motion"
        note="Not a blanket switch-off. Decorative loops such as the skeleton sheen stop entirely and hold a static tone. Entrances collapse to a 1ms fade rather than vanishing, because an element that appears with no transition at all is harder to notice. The change flash keeps its full duration and loses only its movement, because it carries information: a number on this row is different from the number that was there a second ago."
      >
        <Card>
          <p className="cui-prose text-text-subtle">
            Turn on Reduce Motion in your operating system and reload this page to see all three
            treatments at once.
          </p>
        </Card>
      </Section>
    </Page>
  ),
};

/* -------------------------------------------------------------------------- */
/* Focus                                                                       */
/* -------------------------------------------------------------------------- */

export const Focus: Story = {
  render: () => (
    <Page
      title="Focus"
      lede="The focus ring is two layers, always: an inner 2px band in the colour of whatever surface the control is sitting on, then a 2px outer band in the focus colour. Tab through the buttons below on each surface to see it hold."
    >
      <Section
        title="Why two layers"
        note="A single-colour ring has to clear 3:1 against both the page behind the control and the control's own fill, and no one colour does that on a filled primary button, a ghost button on a card, and a selected row all at once. Putting the surface colour between the control and the ring turns one impossible constraint into two easy ones, and both are in the contrast contract."
      >
        <div className="flex flex-col gap-4">
          {/*
            The class names are written out rather than built from the loop
            variable. Tailwind scans source text for complete class names, so a
            template literal like `bg-surface-${surface}` produces markup that
            references utilities the compiler never generated, and the specimen
            silently renders on the wrong background.
          */}
          {(
            [
              ['app', 'bg-surface-app', 'var(--ui-surface-app)'],
              ['raised', 'bg-surface-raised', 'var(--ui-surface-raised)'],
              ['overlay', 'bg-surface-overlay', 'var(--ui-surface-overlay)'],
              ['sunken', 'bg-surface-sunken', 'var(--ui-surface-sunken)'],
            ] as const
          ).map(([surface, background, offset]) => (
            <div
              key={surface}
              className={`rounded-lg border border-border p-5 ${background}`}
              style={{ ['--ui-focus-ring-offset' as string]: offset }}
            >
              <p className="mb-3 font-ui text-label text-text-muted">surface-{surface}</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Not clipped"
        note="The outer band is an outline rather than a third box-shadow, because an outline is never clipped by an ancestor's overflow, and this library puts focusable controls inside a horizontally scrolling table."
      >
        <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface-raised p-4">
          <div className="flex w-[1200px] gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <Button key={i} variant="secondary">
                Column {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </Section>
    </Page>
  ),
};
