import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { checkA11y } from '../../../../test/axe';

import { Badge } from './Badge';
import { Button } from './Button';
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription } from './Card';
import { Combobox } from './Combobox';
import { Input } from './Input';
import { Modal } from './Modal';
import { Pagination } from './Pagination';
import { Select } from './Select';
import { Skeleton, SkeletonText } from './Skeleton';
import { Table, type TableColumn } from './Table';
import { Tabs, TabPanel } from './Tabs';
import { ToastProvider, useToast } from './Toast';

/*
 * Every component, through axe, in the states that differ structurally.
 *
 * A rest-state sweep would pass while an open combobox, a dialog or a loading
 * table failed, and those are exactly the states where the ARIA is doing real
 * work. So the interactive components are opened before they are checked.
 *
 * Contrast is excluded here and verified exhaustively in
 * src/tokens/contrast.test.ts instead. jsdom does no cascade resolution, so
 * axe's colour rules have nothing real to measure. See test/axe.ts.
 */

async function expectNoViolations(container: Element) {
  expect(await checkA11y(container)).toHaveNoViolations();
}

describe('accessibility, static components', () => {
  it('Badge, every tone', async () => {
    const { container } = render(
      <div>
        <Badge tone="neutral">Draft</Badge>
        <Badge tone="success" dot>
          Paid
        </Badge>
        <Badge tone="warning" dot>
          Pending
        </Badge>
        <Badge tone="danger" dot>
          Failed
        </Badge>
        <Badge tone="info" shape="pill">
          Live
        </Badge>
      </div>,
    );
    await expectNoViolations(container);
  });

  it('Button, every variant and state', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Save</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Details</Button>
        <Button variant="danger">Refund</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
        <Button variant="ghost" aria-label="Close">
          <svg aria-hidden="true" width="12" height="12" />
        </Button>
      </div>,
    );
    await expectNoViolations(container);
  });

  it('Card, with a heading and a footer', async () => {
    const { container } = render(
      <Card>
        <CardHeader actions={<Button size="sm">Edit</Button>}>
          <CardTitle>Kreuzberg Jazz Sessions</CardTitle>
          <CardDescription>Thursday, 21:00</CardDescription>
        </CardHeader>
        <CardBody>Two hundred seats, forty two remaining.</CardBody>
        <CardFooter>
          <Button variant="primary">Open</Button>
        </CardFooter>
      </Card>,
    );
    await expectNoViolations(container);
  });

  it('Skeleton, which must be silent', async () => {
    const { container } = render(
      <div>
        <Skeleton variant="circle" />
        <SkeletonText lines={4} />
      </div>,
    );
    await expectNoViolations(container);
  });

  it('Pagination', async () => {
    const { container } = render(
      <Pagination page={4} totalPages={12} onPageChange={() => {}} totalLabel="142 events" />,
    );
    await expectNoViolations(container);
  });
});

describe('accessibility, form controls', () => {
  it('Input, at rest and in error', async () => {
    const { container } = render(
      <div>
        <Input label="Search events" placeholder="Title or venue" />
        <Input label="Quantity" numeric hint="Up to ten per order" defaultValue="2" />
        <Input label="Email" error="That address is not valid." required defaultValue="not-an-email" />
        <Input label="Locked" disabled defaultValue="x" />
      </div>,
    );
    await expectNoViolations(container);
  });

  it('Select', async () => {
    const { container } = render(
      <Select
        label="City"
        placeholder="Any city"
        options={[
          { value: 'berlin', label: 'Berlin' },
          { value: 'hamburg', label: 'Hamburg' },
        ]}
      />,
    );
    await expectNoViolations(container);
  });

  it('Combobox, closed', async () => {
    const { container } = render(
      <Combobox
        label="City"
        value={null}
        onChange={() => {}}
        options={[{ value: 'berlin', label: 'Berlin' }]}
      />,
    );
    await expectNoViolations(container);
  });

  it('Combobox, open with options', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Combobox
        label="City"
        value={null}
        onChange={() => {}}
        options={[
          { value: 'berlin', label: 'Berlin', description: 'DE' },
          { value: 'bern', label: 'Bern', description: 'CH', disabled: true },
        ]}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await expectNoViolations(container);
  });

  it('Combobox, open and empty', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Combobox
        label="Order"
        value={null}
        onChange={() => {}}
        options={[{ value: 'a', label: 'Order 1' }]}
      />,
    );

    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByRole('combobox'), 'zzzz');

    await expectNoViolations(container);
  });
});

describe('accessibility, composite components', () => {
  const columns: TableColumn<{ id: string; title: string; left: number }>[] = [
    { key: 'title', header: 'Event', cell: (r) => r.title },
    { key: 'left', header: 'Remaining', cell: (r) => r.left, numeric: true, sortable: true },
  ];

  const empty = {
    title: 'No events match these filters',
    description: 'Clear the city filter or widen the date range.',
  };

  it('Table, with rows and a sorted column', async () => {
    const { container } = render(
      <Table
        columns={columns}
        rows={[{ id: '1', title: 'Kreuzberg Jazz Sessions', left: 42 }]}
        getRowId={(r) => r.id}
        caption="Events"
        empty={empty}
        sort={{ key: 'left', direction: 'desc' }}
        onSortChange={() => {}}
      />,
    );
    await expectNoViolations(container);
  });

  it('Table, loading', async () => {
    const { container } = render(
      <Table
        columns={columns}
        rows={[]}
        getRowId={(r) => r.id}
        caption="Events"
        empty={empty}
        loading
      />,
    );
    await expectNoViolations(container);
  });

  it('Table, empty', async () => {
    const { container } = render(
      <Table columns={columns} rows={[]} getRowId={(r) => r.id} caption="Events" empty={empty} />,
    );
    await expectNoViolations(container);
  });

  it('Tabs, with a panel', async () => {
    function Harness() {
      const [value, setValue] = useState('events');
      return (
        <Tabs
          label="Sections"
          value={value}
          onChange={setValue}
          items={[
            { value: 'events', label: 'Events' },
            { value: 'orders', label: 'Orders', badge: <Badge tone="neutral">12</Badge> },
            { value: 'holds', label: 'Holds', disabled: true },
          ]}
        >
          <TabPanel value="events">Events panel</TabPanel>
        </Tabs>
      );
    }

    const { container } = render(<Harness />);
    await expectNoViolations(container);
  });

  it('Modal, open with a footer', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Order 4d1f"
            description="Two tickets, paid."
            footer={<Button variant="danger">Refund</Button>}
          >
            <Input label="Reason" />
          </Modal>
        </div>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Open' }));

    // The dialog is portalled to body, so the check runs against the document
    // rather than the render container.
    await expectNoViolations(document.body);
  });

  it('Toast, with an action', async () => {
    const user = userEvent.setup();

    function Fire() {
      const { toast } = useToast();
      return (
        <button
          type="button"
          onClick={() =>
            toast({
              title: 'Request failed',
              description: 'The events list could not be loaded.',
              tone: 'danger',
              action: { label: 'Retry', onClick: () => {} },
            })
          }
        >
          Fire
        </button>
      );
    }

    render(
      <ToastProvider>
        <Fire />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Fire' }));
    await screen.findByRole('region', { name: 'Notifications' });

    await expectNoViolations(document.body);
  });
});
