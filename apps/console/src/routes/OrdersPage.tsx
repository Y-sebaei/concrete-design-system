import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Combobox,
  Input,
  Modal,
  Skeleton,
  Table,
  useToast,
  type BadgeTone,
  type TableColumn,
} from '@y-sebaei/concrete-ui';
import { ApiError, api, type Order, type OrderStatus } from '../lib/api';
import { orderRegistry, type RegisteredOrder } from '../lib/orderRegistry';
import { subscribeToOrder } from '../lib/socket';
import { money, relativeToNow, shortId, when } from '../lib/format';

/*
 * Expired is neutral, not red.
 *
 * An expired hold is the inventory sweeper doing its job and returning seats to
 * the pool. Colouring routine housekeeping as a failure is how operators learn
 * to ignore red.
 */
const statusTone: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  paid: 'success',
  fulfilled: 'accent',
  failed: 'danger',
  expired: 'neutral',
};

export function OrdersPage() {
  const { toast } = useToast();
  const [registered, setRegistered] = useState<RegisteredOrder[]>(() => orderRegistry.list());
  const [orders, setOrders] = useState<Map<string, Order>>(new Map());
  const [hydrating, setHydrating] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  /*
   * Hydration.
   *
   * The registry holds ids and tokens. Everything shown in the table comes from
   * a real GET /orders/:id read, one per entry, because there is no endpoint
   * that returns several. At counter volumes that is a handful of requests; a
   * console handling thousands of orders would need the list endpoint that this
   * API does not have, which is the first item in the README findings.
   */
  const hydrate = useCallback(async (entries: RegisteredOrder[], signal?: AbortSignal) => {
    setHydrating(true);
    const next = new Map<string, Order>();

    await Promise.all(
      entries.map(async (entry) => {
        try {
          const order = await api.getOrder(entry.orderId, entry.accessToken, signal);
          next.set(entry.orderId, order);
          orderRegistry.update(entry.orderId, {
            status: order.status,
            eventTitle: order.event.title,
            customerEmail: order.customer.email,
            totalCents: order.totalCents,
            currency: order.currency,
          });
        } catch {
          /*
           * A single unreadable order does not take the screen down. The row
           * stays, rendered from the cached fields, and is marked as
           * unreadable so the operator can remove it. The usual cause is a
           * database that was reset while the token stayed in this browser.
           */
        }
      }),
    );

    if (signal?.aborted) return;
    setOrders(next);
    setHydrating(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void hydrate(orderRegistry.list(), controller.signal);
    return () => controller.abort();
  }, [hydrate]);

  /*
   * Fulfilment arrives over the socket, not by polling.
   *
   * The API emits order:updated into a room per order when the fulfilment
   * consumer finishes, which is the asynchronous half of a checkout. Without
   * this the table would show "paid" until somebody reloaded.
   */
  useEffect(() => {
    const unsubscribes = registered.map((entry) =>
      subscribeToOrder(entry.orderId, () => {
        setOrders((current) => {
          const order = current.get(entry.orderId);
          if (!order || order.status === 'fulfilled') return current;
          const next = new Map(current);
          next.set(entry.orderId, { ...order, status: 'fulfilled' });
          return next;
        });
        orderRegistry.update(entry.orderId, { status: 'fulfilled' });
        toast({
          title: `Order ${shortId(entry.orderId)} fulfilled`,
          description: 'Tickets have been issued.',
          tone: 'success',
        });
      }),
    );

    return () => unsubscribes.forEach((off) => off());
  }, [registered, toast]);

  const rows = useMemo(() => {
    const list = registered.map((entry) => ({ entry, order: orders.get(entry.orderId) ?? null }));
    if (!search) return list;
    return list.filter((row) => row.entry.orderId === search);
  }, [registered, orders, search]);

  /*
   * The combobox options.
   *
   * Filtering is local because the searchable set is local: the registry is the
   * only list of orders this console can see. The description carries the email
   * and the event, so an operator can find an order by any of the three without
   * knowing which one they are typing.
   */
  const searchOptions = useMemo(
    () =>
      registered.map((entry) => {
        const order = orders.get(entry.orderId);
        return {
          value: entry.orderId,
          label: `${shortId(entry.orderId)} · ${order?.customer.email ?? entry.customerEmail ?? 'unknown'}`,
          description: order?.event.title ?? entry.eventTitle ?? 'Not readable',
        };
      }),
    [registered, orders],
  );

  const columns: TableColumn<{ entry: RegisteredOrder; order: Order | null }>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'Order',
        cell: ({ entry }) => (
          <span className="cui-tnum font-mono text-text">{shortId(entry.orderId)}</span>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        cell: ({ entry, order }) => (
          <span className="block max-w-[24ch] truncate text-text">
            {order?.customer.email ?? entry.customerEmail ?? '—'}
          </span>
        ),
      },
      {
        key: 'event',
        header: 'Event',
        hideBelow: 'md',
        cell: ({ entry, order }) => (
          <span className="block max-w-[24ch] truncate text-text-muted">
            {order?.event.title ?? entry.eventTitle ?? '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        cell: ({ order }) =>
          order ? (
            <Badge tone={statusTone[order.status]} dot>
              {order.status}
            </Badge>
          ) : hydrating ? (
            <Skeleton variant="text" width="60%" />
          ) : (
            <Badge tone="danger">unreadable</Badge>
          ),
      },
      {
        key: 'expires',
        header: 'Hold',
        hideBelow: 'lg',
        cell: ({ order }) =>
          order && order.status === 'pending' ? (
            <span className="cui-tnum text-warning-text">{relativeToNow(order.expiresAt)}</span>
          ) : (
            <span className="text-text-disabled">—</span>
          ),
      },
      {
        key: 'total',
        header: 'Total',
        numeric: true,
        cell: ({ entry, order }) =>
          order
            ? money(order.totalCents, order.currency)
            : entry.totalCents !== undefined
              ? money(entry.totalCents, entry.currency ?? 'EUR')
              : '—',
      },
    ],
    [hydrating],
  );

  const selectedOrder = selected ? (orders.get(selected) ?? null) : null;
  const selectedEntry = selected ? registered.find((e) => e.orderId === selected) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-ui text-display text-text">Orders</h1>
          <p className="cui-prose mt-1 text-text-subtle">
            Orders this console holds an access token for. The ticketing API has no endpoint that
            lists orders, so this is what is reachable rather than everything that exists.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            Add by id and token
          </Button>
          <Button
            variant="ghost"
            onClick={() => void hydrate(orderRegistry.list())}
            loading={hydrating}
            loadingLabel="Refreshing orders"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4 sm:grid-cols-[minmax(0,420px)_auto] sm:items-end">
        <Combobox
          label="Find an order"
          options={searchOptions}
          value={search}
          onChange={setSearch}
          placeholder="Order id, customer email or event"
          hint="Searches the orders this browser holds tokens for."
          emptyMessage="No order in this console matches that"
        />
        {search ? (
          <Button variant="ghost" onClick={() => setSearch(null)} className="sm:mb-[26px]">
            Show all
          </Button>
        ) : null}
      </div>

      <Table
        columns={columns}
        rows={rows}
        getRowId={({ entry }) => entry.orderId}
        caption="Orders held by this console"
        loading={hydrating && registered.length === 0}
        skeletonRows={4}
        onRowActivate={({ entry }) => setSelected(entry.orderId)}
        empty={{
          title: search ? 'No order matches that search' : 'No orders in this console yet',
          description: search
            ? 'The search only covers orders this browser holds a token for.'
            : 'Take a counter sale from an event page, or add an order by pasting its id and access token. The API issues that token once, at checkout, and there is no way to look it up again.',
          action: search ? (
            <Button variant="secondary" onClick={() => setSearch(null)}>
              Show all
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              Add by id and token
            </Button>
          ),
        }}
      />

      <OrderDetailModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        order={selectedOrder}
        entry={selectedEntry}
        onForget={(orderId) => {
          setRegistered(orderRegistry.remove(orderId));
          setSelected(null);
          toast({ title: 'Order removed from this console', tone: 'neutral' });
        }}
      />

      <AddOrderModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(entry, order) => {
          setRegistered(orderRegistry.list());
          setOrders((current) => new Map(current).set(entry.orderId, order));
          setAddOpen(false);
          toast({
            title: 'Order added',
            description: `${shortId(entry.orderId)} for ${order.customer.email}.`,
            tone: 'success',
          });
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                      */
/* -------------------------------------------------------------------------- */

function OrderDetailModal({
  open,
  onClose,
  order,
  entry,
  onForget,
}: {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  entry: RegisteredOrder | undefined;
  onForget: (orderId: string) => void;
}) {
  if (!entry) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Order ${shortId(entry.orderId)}`}
      description={order ? order.event.title : 'This order could not be read.'}
      footer={
        <>
          <Button variant="ghost" onClick={() => onForget(entry.orderId)}>
            Remove from this console
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {!order ? (
        <p className="cui-prose text-text">
          The API returned no order for this id and token. It answers the same way for a missing
          order and a wrong token, deliberately, so there is no way to tell which. The usual cause
          is a database that was reset while this browser kept the token.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [
                'Status',
                <Badge key="s" tone={statusTone[order.status]} dot>
                  {order.status}
                </Badge>,
              ],
              ['Customer', order.customer.email],
              [
                'Total',
                <span key="t" className="cui-tnum">
                  {money(order.totalCents, order.currency)}
                </span>,
              ],
              [
                order.status === 'pending' ? 'Hold expires' : 'Paid',
                <span key="d" className="cui-tnum">
                  {order.status === 'pending'
                    ? relativeToNow(order.expiresAt)
                    : order.paidAt
                      ? when(order.paidAt)
                      : '—'}
                </span>,
              ],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="font-ui text-label uppercase text-text-muted">{label}</dt>
                <dd className="mt-1 font-ui text-body text-text">{value}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h3 className="mb-2 font-ui text-title text-text">Items</h3>
            <ul className="rounded-lg border border-border">
              {order.items.map((item) => (
                <li
                  key={item.ticketTypeId}
                  className="flex items-baseline justify-between border-b border-border-subtle px-3 py-2 last:border-b-0"
                >
                  <span className="font-ui text-body text-text">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="cui-tnum font-ui text-body text-text">
                    {money(item.unitPriceCents * item.quantity, order.currency)}
                  </span>
                </li>
              ))}
              <li className="flex items-baseline justify-between bg-surface-sunken px-3 py-2">
                <span className="font-ui text-dense text-text-muted">
                  Service fee {money(order.feeCents, order.currency)}
                </span>
                <span className="cui-tnum font-ui text-body font-medium text-text">
                  {money(order.totalCents, order.currency)}
                </span>
              </li>
            </ul>
          </div>

          {order.tickets.length > 0 ? (
            <div>
              <h3 className="mb-2 font-ui text-title text-text">
                Tickets
                <span className="ml-2 font-ui text-dense font-normal text-text-subtle">
                  issued by the fulfilment consumer
                </span>
              </h3>
              <ul className="flex flex-wrap gap-2">
                {order.tickets.map((ticket) => (
                  <li
                    key={ticket.serial}
                    className="cui-tnum rounded-sm border border-border bg-surface-sunken px-2 py-1 font-mono text-dense text-text"
                  >
                    {ticket.serial}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="cui-prose text-text-subtle">
              No tickets issued yet. They are created asynchronously after payment, and this dialog
              updates over the socket when the fulfilment consumer finishes.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Add by hand                                                                 */
/* -------------------------------------------------------------------------- */

function AddOrderModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (entry: RegisteredOrder, order: Order) => void;
}) {
  const idRef = useRef<HTMLInputElement>(null);
  const [orderId, setOrderId] = useState('');
  const [token, setToken] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setChecking(true);
    setError(null);
    try {
      // Read it before storing it. An entry that cannot be read is a row that
      // renders as an error forever, which is worse than refusing to add it.
      const order = await api.getOrder(orderId.trim(), token.trim());
      const list = orderRegistry.add({
        orderId: orderId.trim(),
        accessToken: token.trim(),
        eventTitle: order.event.title,
        customerEmail: order.customer.email,
        totalCents: order.totalCents,
        currency: order.currency,
        status: order.status,
      });
      const entry = list.find((e) => e.orderId === orderId.trim())!;
      setOrderId('');
      setToken('');
      onAdded(entry, order);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.operatorMessage : 'That order could not be read.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add an order to this console"
      description="Both the id and the access token are needed, and the token is only issued once."
      initialFocus={idRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={checking} loadingLabel="Checking" onClick={submit}>
            Add order
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          ref={idRef}
          label="Order id"
          required
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="4d1f0c2e-..."
          hint="The UUID returned by checkout."
          error={error ?? undefined}
        />
        <Input
          label="Access token"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Issued once, in the checkout response"
        />

        <Card surface="flat">
          <CardHeader>
            <CardTitle>Why this exists</CardTitle>
            <CardDescription>It is a workaround, not a feature.</CardDescription>
          </CardHeader>
          <CardBody>
            <p className="cui-prose text-text">
              The ticketing API deliberately has no way to list orders, and returns the same 404 for
              a missing order as for a wrong token so the endpoint cannot be used to discover which
              ids exist. That is right for a public API and leaves an operator console with nothing
              to page through, so this console remembers the orders it has seen. Doing it properly
              needs an authenticated list endpoint in the other repo.
            </p>
          </CardBody>
        </Card>
      </div>
    </Modal>
  );
}
