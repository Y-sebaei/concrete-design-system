import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

/**
 * One socket for the whole console.
 *
 * The API puts every browser in a room per event, so subscribing is cheap and
 * the connection is shared. Opening a socket per component would mean one
 * connection per visible event row, which the gateway would happily accept and
 * then melt under.
 */

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface InventoryChanged {
  eventId: string;
  reason: 'hold' | 'commit' | 'release' | 'register';
  items: { ticketTypeId: string; quantityAvailable: number; quantityTotal: number }[];
}

export interface OrderUpdated {
  status: 'fulfilled';
  ticketCount: number;
  serials: string[];
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    // The API's realtime consumer reads from the latest Kafka offset, so a
    // reconnecting browser is not replayed an hour of inventory history. That
    // makes an aggressive reconnect cheap, and the console leans on it.
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    withCredentials: true,
  });

  return socket;
}

/**
 * Subscribes to one event's inventory room and returns an unsubscribe.
 *
 * Re-subscribes on every reconnect. This is the part that is easy to miss: the
 * room membership lives on the server, so a dropped connection silently loses
 * it, and a page that only subscribes on mount goes quiet after the first blip
 * while still looking connected.
 */
export function subscribeToEvent(
  eventId: string,
  onChange: (payload: InventoryChanged) => void,
): () => void {
  const s = getSocket();

  const join = () => s.emit('subscribe:event', eventId);
  join();
  s.on('connect', join);
  s.on('inventory:changed', onChange);

  return () => {
    s.emit('unsubscribe:event', eventId);
    s.off('connect', join);
    s.off('inventory:changed', onChange);
  };
}

export function subscribeToOrder(
  orderId: string,
  onUpdate: (payload: OrderUpdated) => void,
): () => void {
  const s = getSocket();

  const join = () => s.emit('subscribe:order', orderId);
  join();
  s.on('connect', join);
  s.on('order:updated', onUpdate);

  return () => {
    s.off('connect', join);
    s.off('order:updated', onUpdate);
  };
}
