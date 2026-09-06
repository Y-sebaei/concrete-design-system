/**
 * Formatting, in one place.
 *
 * Money is stored in cents everywhere in this API, and every place it reaches a
 * screen it has to go through here. Dividing by 100 inline is how a currency
 * ends up rendered three different ways on three different screens.
 */

export function money(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateOnly = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function when(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function day(iso: string): string {
  return dateOnly.format(new Date(iso));
}

/** For a hold expiry, which an operator reads as a countdown rather than a time. */
export function relativeToNow(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const minutes = Math.round(ms / 60000);
  if (minutes <= 0) return 'expired';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} d`;
}

/** Order ids are UUIDs. Nobody reads all 36 characters off a screen. */
export function shortId(id: string): string {
  return id.slice(0, 8);
}
