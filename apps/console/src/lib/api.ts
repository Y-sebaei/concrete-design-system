/**
 * The ticketing API, typed from its actual route definitions.
 *
 * Nothing here is invented. Every field and every query parameter was read off
 * the NestJS controllers and the zod schemas in the ticketing repo, which this
 * console does not modify. Where the API cannot do something the console wants,
 * that is recorded in the README findings list rather than faked here.
 */

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/* -------------------------------------------------------------------------- */
/* Shapes                                                                      */
/* -------------------------------------------------------------------------- */

/** GET /events returns Elasticsearch documents, not the catalogue row shape. */
export interface EventDocument {
  eventId: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  status: 'draft' | 'published' | 'cancelled';
  currency: string;
  venueId: string;
  venueName: string;
  city: string;
  country: string;
  minPriceCents: number;
  maxPriceCents: number;
  indexedAt: string;
}

export interface SearchResult {
  items: EventDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /**
   * 'database' means Elasticsearch was unreachable and the API fell back to a
   * plain ILIKE query, which loses ranking and fuzzy matching. The console
   * surfaces this rather than hiding it: a degraded result set that looks
   * identical to a healthy one is how a broken search stays broken for a week.
   */
  source: 'search' | 'database';
}

export interface TicketType {
  id: string;
  name: string;
  priceCents: number;
  maxPerOrder: number;
  salesStartAt: string;
  salesEndAt: string;
  quantityTotal: number;
  quantityAvailable: number;
}

export interface EventDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  status: string;
  currency: string;
  serviceFeeBps: number;
  venue: { id: string; name: string; city: string; country: string; addressLine: string };
  minPriceCents: number;
  maxPriceCents: number;
  ticketTypes: TicketType[];
}

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'failed' | 'expired';

export interface Order {
  id: string;
  status: OrderStatus;
  statusDetail: string | null;
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
  currency: string;
  expiresAt: string;
  paidAt: string | null;
  fulfilledAt: string | null;
  paymentUrl: string | null;
  customer: { email: string; name: string };
  event: { slug: string; title: string; startsAt: string; venueName: string; city: string };
  items: { ticketTypeId: string; name: string; unitPriceCents: number; quantity: number }[];
  tickets: { serial: string; ticketTypeId: string; seq: number; issuedAt?: string }[];
}

export interface CheckoutResult {
  orderId: string;
  accessToken: string;
  paymentUrl: string;
  totalCents: number;
  subtotalCents: number;
  feeCents: number;
  currency: string;
  expiresAt: string;
  replayed: boolean;
  traceId?: string;
}

export type EventSort = 'relevance' | 'date' | 'price';

export interface EventQuery {
  q?: string;
  city?: string;
  from?: string;
  to?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  page?: number;
  /** The API caps this at 50. */
  pageSize?: number;
  sort?: EventSort;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Copy for a toast. The API's own error codes are precise and unreadable, so
   * the ones an operator can actually act on get a sentence and the rest fall
   * back to something honest rather than something reassuring.
   */
  get operatorMessage(): string {
    switch (this.code) {
      case 'EVENT_NOT_FOUND':
        return 'That event is not in the catalogue. It may have been unpublished.';
      case 'ORDER_NOT_FOUND':
        return 'No order matches that id and token. Both have to be right, and the API will not say which one is wrong.';
      case 'SOLD_OUT':
      case 'INSUFFICIENT_INVENTORY':
        return 'Not enough seats left for that quantity.';
      case 'LOCAL_PAYMENTS_DISABLED':
        return 'Stripe is configured on the API, so counter sales cannot be completed from here.';
      default:
        if (this.status === 0) return 'The API did not respond. Check that docker compose is up.';
        if (this.status >= 500) return `The API returned ${this.status}. It may still be starting.`;
        return this.message;
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch (cause) {
    // fetch only rejects for network-level failures, which for this console
    // almost always means the stack is not running. Status 0 marks that apart
    // from an HTTP error so the message can say something useful.
    throw new ApiError((cause as Error).message, 0);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body as { error?: string; message?: string } | null;
    throw new ApiError(
      detail?.message ?? detail?.error ?? `Request failed with ${response.status}`,
      response.status,
      detail?.error,
    );
  }

  return body as T;
}

/* -------------------------------------------------------------------------- */
/* Routes                                                                      */
/* -------------------------------------------------------------------------- */

export const api = {
  /**
   * Browse and search are one endpoint in this API, deliberately, so the
   * console cannot end up with a browse page that quietly keeps working while
   * search is broken.
   */
  listEvents(query: EventQuery, signal?: AbortSignal): Promise<SearchResult> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '' && value !== null) params.set(key, String(value));
    }
    return request<SearchResult>(`/events?${params.toString()}`, { signal });
  },

  getEvent(slug: string, signal?: AbortSignal): Promise<EventDetail> {
    return request<EventDetail>(`/events/${encodeURIComponent(slug)}`, { signal });
  },

  /** Powers the city filter. Distinct cities with at least one published event. */
  listCities(signal?: AbortSignal): Promise<string[]> {
    return request<string[]>('/search/cities', { signal });
  },

  /**
   * An order is readable only with the token issued at checkout. The API
   * returns the same 404 for a missing order and a wrong token, so that nobody
   * can use it to confirm which order ids exist.
   */
  getOrder(orderId: string, token: string, signal?: AbortSignal): Promise<Order> {
    return request<Order>(
      `/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(token)}`,
      { signal },
    );
  },

  /**
   * A counter sale. The idempotency key is required by the API and is what
   * makes a double-clicked Take payment button one order rather than two.
   */
  checkout(
    input: {
      eventSlug: string;
      customer: { email: string; name: string };
      items: { ticketTypeId: string; quantity: number }[];
    },
    idempotencyKey: string,
  ): Promise<CheckoutResult> {
    return request<CheckoutResult>('/checkout', {
      method: 'POST',
      headers: { 'idempotency-key': idempotencyKey },
      body: JSON.stringify(input),
    });
  },

  /**
   * Completes a counter sale through the local payment gateway, which signs a
   * webhook and posts it to the API over real HTTP. Only available when the API
   * has no Stripe key configured; otherwise it answers 503 and the console says
   * so.
   */
  completeLocalPayment(input: {
    sessionId: string;
    orderId: string;
    outcome: 'succeeded' | 'failed' | 'expired';
  }): Promise<{ delivered: boolean }> {
    return request<{ delivered: boolean }>('/payments/local/complete', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};

/** Pulls the local gateway session id out of the payment URL the API returns. */
export function localSessionId(paymentUrl: string): string | null {
  try {
    return new URL(paymentUrl, API_URL).searchParams.get('session');
  } catch {
    return null;
  }
}
