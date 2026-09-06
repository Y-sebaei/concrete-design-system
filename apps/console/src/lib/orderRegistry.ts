import type { OrderStatus } from './api';

/**
 * THE ORDERS PROBLEM, AND WHAT THIS IS.
 *
 * The ticketing API has no endpoint that lists orders. There is exactly one way
 * to read an order, GET /orders/:id?token=, and the token is issued once, in
 * the checkout response. That is a deliberate decision in that API: the same
 * 404 comes back for a missing order and for a wrong token, so the endpoint
 * cannot be used to enumerate which order ids exist.
 *
 * It also means a console cannot show "all orders", because no such view is
 * reachable from outside the database. Rather than invent an endpoint in a repo
 * this project is not allowed to modify, the console keeps an operator-side
 * registry: the id and token of every order this console has issued or been
 * handed, stored per browser. The Orders screen searches that registry and
 * hydrates each entry from the real endpoint.
 *
 * The honest consequences, which are in the README findings list:
 *
 *   - The registry is per browser. Another operator at another machine sees
 *     their own sales, not yours.
 *   - Orders taken through the storefront never appear here, only ones taken at
 *     this counter or pasted in by hand.
 *   - Clearing site data loses the tokens, and they cannot be reissued.
 *
 * Doing this properly needs a GET /orders endpoint behind operator
 * authentication, which is a change to the other repo.
 */

const STORAGE_KEY = 'boxoffice.orders.v1';

export interface RegisteredOrder {
  orderId: string;
  accessToken: string;
  /** Cached from the last successful read, so the list renders before hydration. */
  eventTitle?: string;
  customerEmail?: string;
  totalCents?: number;
  currency?: string;
  status?: OrderStatus;
  recordedAt: string;
}

function read(): RegisteredOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RegisteredOrder[]) : [];
  } catch {
    // A corrupt or unavailable store must not take the screen down with it.
    // Private browsing throws on access in some browsers.
    return [];
  }
}

function write(orders: RegisteredOrder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* Nothing useful to do. The list still works for this session. */
  }
}

export const orderRegistry = {
  list(): RegisteredOrder[] {
    return read().sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  },

  add(order: Omit<RegisteredOrder, 'recordedAt'>): RegisteredOrder[] {
    const existing = read().filter((o) => o.orderId !== order.orderId);
    const next = [{ ...order, recordedAt: new Date().toISOString() }, ...existing];
    write(next);
    return next;
  },

  /** Merges the fields a successful read filled in, keeping the token. */
  update(orderId: string, patch: Partial<RegisteredOrder>): RegisteredOrder[] {
    const next = read().map((o) => (o.orderId === orderId ? { ...o, ...patch } : o));
    write(next);
    return next;
  },

  remove(orderId: string): RegisteredOrder[] {
    const next = read().filter((o) => o.orderId !== orderId);
    write(next);
    return next;
  },
};
