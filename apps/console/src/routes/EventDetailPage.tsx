import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Select,
  Skeleton,
  SkeletonText,
  Table,
  useToast,
  type TableColumn,
} from '@ysebaei/concrete-ui';
import { ApiError, api, localSessionId, type EventDetail, type TicketType } from '../lib/api';
import { subscribeToEvent, type InventoryChanged } from '../lib/socket';
import { orderRegistry } from '../lib/orderRegistry';
import { money, when } from '../lib/format';

const reasonCopy: Record<InventoryChanged['reason'], string> = {
  hold: 'seats held at checkout',
  commit: 'seats sold',
  release: 'a hold expired and seats came back',
  register: 'inventory registered',
};

export function EventDetailPage() {
  const { slug = '' } = useParams();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashed, setFlashed] = useState<ReadonlySet<string>>(new Set());
  const [lastChange, setLastChange] = useState<{ at: Date; reason: string } | null>(null);
  const [saleOpen, setSaleOpen] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      api
        .getEvent(slug, signal)
        .then((next) => {
          setEvent(next);
          setLoading(false);
        })
        .catch((cause: unknown) => {
          if (signal?.aborted) return;
          setLoading(false);
          setError(
            cause instanceof ApiError ? cause.operatorMessage : 'The event could not be loaded.',
          );
        });
    },
    [slug],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  /*
   * THE LIVE PART
   *
   * The API pushes one inventory.changed message per change into a room named
   * for the event, and the payload carries the new counts for every affected
   * ticket type. So this is a merge into local state, not a refetch: refetching
   * on every push would turn one socket message into an HTTP request, which is
   * the thing the socket exists to avoid.
   *
   * The subscription re-joins on reconnect, which lives in subscribeToEvent.
   * Room membership is server-side state, so a dropped connection loses it
   * silently and a page that only subscribes on mount goes quiet after the
   * first blip while still looking connected.
   */
  /*
   * The event as it currently is, for the socket handler to diff against.
   *
   * This ref is not a convenience. The handler has to know which ticket types
   * changed so it can flash those rows and announce the change, and the obvious
   * way to work that out is to build the set inside the setEvent updater. That
   * does not work: React does not run an updater synchronously, so the set is
   * still empty on the next line and the handler concludes nothing changed. The
   * counts update, the flash never fires, and the live region keeps saying it is
   * waiting. The symptom is easy to miss because the numbers are visibly
   * correct, which is the half everybody checks.
   *
   * So the diff is computed synchronously against the ref, and the ref is moved
   * forward at the same time as the state. Two messages arriving in one tick
   * then diff against the right baseline rather than both against the old one.
   */
  const eventRef = useRef<EventDetail | null>(null);
  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  useEffect(() => {
    if (!event) return;

    const unsubscribe = subscribeToEvent(event.id, (payload) => {
      const current = eventRef.current;
      if (!current || payload.eventId !== current.id) return;

      const updates = new Map(payload.items.map((item) => [item.ticketTypeId, item]));
      const changedIds = new Set<string>();

      const ticketTypes = current.ticketTypes.map((type) => {
        const update = updates.get(type.id);
        if (!update || update.quantityAvailable === type.quantityAvailable) return type;
        changedIds.add(type.id);
        return {
          ...type,
          quantityAvailable: update.quantityAvailable,
          quantityTotal: update.quantityTotal,
        };
      });

      if (changedIds.size === 0) return;

      const next = { ...current, ticketTypes };
      eventRef.current = next;
      setEvent(next);

      setLastChange({ at: new Date(), reason: reasonCopy[payload.reason] ?? payload.reason });
      setFlashed(changedIds);

      if (flashTimer.current) clearTimeout(flashTimer.current);
      // Slightly longer than the 1.2s flash, so the class is removed after the
      // animation rather than partway through it.
      flashTimer.current = setTimeout(() => setFlashed(new Set()), 1500);
    });

    return () => {
      unsubscribe();
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
    // Only the event id matters: re-subscribing on every inventory change would
    // leave and rejoin the room on each message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const columns: TableColumn<TicketType>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Ticket type',
        cell: (t) => <span className="font-medium">{t.name}</span>,
      },
      {
        key: 'price',
        header: 'Price',
        numeric: true,
        cell: (t) => money(t.priceCents, event?.currency ?? 'EUR'),
      },
      {
        key: 'sold',
        header: 'Sold',
        numeric: true,
        hideBelow: 'sm',
        cell: (t) => t.quantityTotal - t.quantityAvailable,
      },
      {
        key: 'remaining',
        header: 'Remaining',
        numeric: true,
        cell: (t) => (
          <span
            className={
              t.quantityAvailable === 0
                ? 'font-medium text-danger-text'
                : t.quantityAvailable <= 10
                  ? 'font-medium text-warning-text'
                  : undefined
            }
          >
            {t.quantityAvailable} / {t.quantityTotal}
          </span>
        ),
      },
      {
        key: 'sales',
        header: 'On sale until',
        hideBelow: 'lg',
        cell: (t) => <span className="cui-tnum text-text-muted">{when(t.salesEndAt)}</span>,
      },
    ],
    [event?.currency],
  );

  if (loading && !event) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton variant="text" width="34%" height={28} />
          <Skeleton variant="text" width="22%" />
        </div>
        <Card>
          <SkeletonText lines={3} />
        </Card>
        <Skeleton variant="block" height={280} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>This event could not be loaded</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => load()}>
              Try again
            </Button>
            {/* A link, not a button styled as one. It changes the URL. */}
            <Link
              to="/events"
              className="cui-focus rounded-md px-2 py-1 font-ui text-body font-medium text-accent-text hover:underline"
            >
              Back to events
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  const totalRemaining = event.ticketTypes.reduce((sum, t) => sum + t.quantityAvailable, 0);
  const totalCapacity = event.ticketTypes.reduce((sum, t) => sum + t.quantityTotal, 0);

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb">
        <Link
          to="/events"
          className="cui-focus rounded-sm font-ui text-dense text-accent-text hover:underline"
        >
          Events
        </Link>
        <span aria-hidden="true" className="mx-2 font-ui text-dense text-text-disabled">
          /
        </span>
        <span className="font-ui text-dense text-text-muted">{event.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-ui text-display text-text">{event.title}</h1>
            <Badge
              tone={
                event.status === 'published'
                  ? 'success'
                  : event.status === 'cancelled'
                    ? 'danger'
                    : 'neutral'
              }
              dot
            >
              {event.status}
            </Badge>
          </div>
          <p className="mt-1 font-ui text-body text-text-muted">
            {event.venue.name}, {event.venue.city} ·{' '}
            <span className="cui-tnum">{when(event.startsAt)}</span>
          </p>
        </div>
        <Button variant="primary" onClick={() => setSaleOpen(true)}>
          Record a counter sale
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Capacity', String(totalCapacity)],
          ['Sold', String(totalCapacity - totalRemaining)],
          ['Remaining', String(totalRemaining)],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="font-ui text-label uppercase text-text-muted">{label}</p>
            <p className="cui-tnum mt-1 font-ui text-display text-text">{value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-ui text-title text-text">Ticket types</h2>

        {/*
          A polite live region for the socket. The flash on the row is a visual
          cue and says nothing to a screen reader, so the change is also stated
          in words. It is polite rather than assertive because inventory moving
          is normal and should not interrupt whatever is being read.
        */}
        <p aria-live="polite" className="font-ui text-dense text-text-subtle">
          {lastChange
            ? `Updated ${lastChange.at.toLocaleTimeString('en-GB')}: ${lastChange.reason}.`
            : 'Waiting for inventory changes.'}
        </p>
      </div>

      <Table
        columns={columns}
        rows={event.ticketTypes}
        getRowId={(t) => t.id}
        caption={`Ticket types for ${event.title}, with live remaining inventory`}
        flashedRowIds={flashed}
        empty={{
          title: 'This event has no ticket types',
          description:
            'Nothing can be sold until at least one ticket type exists. Ticket types are created with the event in the catalogue API.',
        }}
      />

      <p className="cui-prose text-text-subtle">
        Remaining counts come from the inventory service over the socket, one message per change.
        Open the storefront in another tab and start a checkout to watch a hold land here without a
        refresh.
      </p>

      <CounterSaleModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        event={event}
        onRecorded={(message) => {
          toast(message);
          setSaleOpen(false);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Counter sale                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A counter sale, which is also the only way orders get into this console.
 *
 * The ticketing API has no endpoint that lists orders, so the Orders screen can
 * only show orders whose id and access token this console holds. Those come
 * from here: POST /checkout returns both, and the registry keeps them. See
 * lib/orderRegistry.ts for the full reasoning and the consequences.
 */
function CounterSaleModal({
  open,
  onClose,
  event,
  onRecorded,
}: {
  open: boolean;
  onClose: () => void;
  event: EventDetail;
  onRecorded: (toast: {
    title: string;
    description?: string;
    tone: 'success' | 'warning' | 'danger';
  }) => void;
}) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const available = event.ticketTypes.filter((t) => t.quantityAvailable > 0);

  useEffect(() => {
    if (open) {
      setTicketTypeId(available[0]?.id ?? '');
      setFieldError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit() {
    if (!email.includes('@')) {
      setFieldError('A valid email is required. The ticket is sent to it.');
      emailRef.current?.focus();
      return;
    }

    const type = event.ticketTypes.find((t) => t.id === ticketTypeId);
    if (!type) {
      setFieldError('Pick a ticket type.');
      return;
    }

    setSubmitting(true);
    setFieldError(null);

    try {
      // The API requires an idempotency key, and it is what makes a
      // double-clicked button one order rather than two.
      const key = `console-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const checkout = await api.checkout(
        {
          eventSlug: event.slug,
          customer: { email, name: name || email.split('@')[0]! },
          items: [{ ticketTypeId, quantity: Number(quantity) || 1 }],
        },
        key,
      );

      orderRegistry.add({
        orderId: checkout.orderId,
        accessToken: checkout.accessToken,
        eventTitle: event.title,
        customerEmail: email,
        totalCents: checkout.totalCents,
        currency: checkout.currency,
        status: 'pending',
      });

      /*
       * With the local gateway the payment can be completed here, which
       * exercises the real signed-webhook path rather than a shortcut. With
       * Stripe configured the API answers 503 and the operator has to finish in
       * the browser, so the order is left pending and the console says why.
       */
      const session = localSessionId(checkout.paymentUrl);
      if (session) {
        try {
          await api.completeLocalPayment({
            sessionId: session,
            orderId: checkout.orderId,
            outcome: 'succeeded',
          });
          orderRegistry.update(checkout.orderId, { status: 'paid' });
          onRecorded({
            title: 'Counter sale recorded',
            description: `Order ${checkout.orderId.slice(0, 8)} paid. It appears under Orders.`,
            tone: 'success',
          });
          return;
        } catch {
          onRecorded({
            title: 'Order created, payment not completed',
            description: 'The hold is live and will expire on its own. It appears under Orders.',
            tone: 'warning',
          });
          return;
        }
      }

      onRecorded({
        title: 'Order created, awaiting payment',
        description:
          'Stripe is configured on the API, so payment has to be completed in the browser. The order is under Orders.',
        tone: 'warning',
      });
    } catch (cause) {
      setFieldError(
        cause instanceof ApiError ? cause.operatorMessage : 'The order could not be created.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record a counter sale"
      description={`${event.title}, ${event.venue.name}`}
      initialFocus={emailRef}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={submitting}
            loadingLabel="Taking payment"
            onClick={submit}
          >
            Take payment
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          ref={emailRef}
          label="Customer email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          hint="The ticket and the access link are sent here."
          error={fieldError ?? undefined}
        />
        <Input
          label="Customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Optional"
        />

        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          {/*
            A Select rather than a Combobox. An event has a handful of ticket
            types, and the native control gives the operator keyboard type-ahead
            and the platform picker for nothing.
          */}
          <Select
            label="Ticket type"
            value={ticketTypeId}
            onChange={(e) => setTicketTypeId(e.target.value)}
            options={
              available.length === 0
                ? [{ value: '', label: 'Everything is sold out', disabled: true }]
                : available.map((type) => ({
                    value: type.id,
                    label: `${type.name} · ${money(type.priceCents, event.currency)} · ${type.quantityAvailable} left`,
                  }))
            }
          />

          <Input
            label="Quantity"
            numeric
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <p className="cui-prose text-text-subtle">
          This creates a real order through POST /checkout and, where the local payment gateway is
          active, completes it through the signed webhook path. It is the only way orders reach the
          Orders screen, because the API has no endpoint that lists them.
        </p>
      </div>
    </Modal>
  );
}
