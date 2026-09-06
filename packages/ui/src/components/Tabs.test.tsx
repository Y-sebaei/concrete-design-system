import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabPanel, type TabItem } from './Tabs';

const items: TabItem[] = [
  { value: 'events', label: 'Events' },
  { value: 'orders', label: 'Orders' },
  { value: 'holds', label: 'Holds', disabled: true },
  { value: 'refunds', label: 'Refunds' },
];

function Harness({ activation }: { activation?: 'automatic' | 'manual' }) {
  const [value, setValue] = useState('events');
  return (
    <Tabs items={items} value={value} onChange={setValue} label="Console sections" activation={activation}>
      <TabPanel value="events">Events panel</TabPanel>
      <TabPanel value="orders">Orders panel</TabPanel>
      <TabPanel value="refunds">Refunds panel</TabPanel>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('wires each tab to its panel in both directions', () => {
    render(<Harness />);

    const tab = screen.getByRole('tab', { name: 'Events' });
    const panel = screen.getByRole('tabpanel');

    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });

  it('names the tablist', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Console sections' })).toBeInTheDocument();
  });

  it('keeps exactly one tab in the tab order', () => {
    render(<Harness />);

    const tabs = screen.getAllByRole('tab');
    const reachable = tabs.filter((tab) => tab.getAttribute('tabindex') === '0');

    expect(reachable).toHaveLength(1);
    expect(reachable[0]).toHaveAccessibleName('Events');
  });

  it('moves between tabs with the arrow keys and skips disabled ones', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('tab', { name: 'Events' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Orders' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Orders panel');

    // Holds is disabled, so the next stop is Refunds.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Refunds' })).toHaveFocus();

    // And it wraps.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveFocus();
  });

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('tab', { name: 'Events' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Refunds' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Events' })).toHaveFocus();
  });

  it('under manual activation, arrows move focus without switching panels', async () => {
    const user = userEvent.setup();
    render(<Harness activation="manual" />);

    screen.getByRole('tab', { name: 'Events' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Orders' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Events panel');

    await user.keyboard('{Enter}');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Orders panel');
  });

  it('renders only the active panel', () => {
    render(<Harness />);
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.queryByText('Orders panel')).not.toBeInTheDocument();
  });

  it('lets a keyboard user reach a panel that has no controls of its own', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole('tab', { name: 'Events' }).focus();
    await user.tab();

    expect(screen.getByRole('tabpanel')).toHaveFocus();
  });
});
