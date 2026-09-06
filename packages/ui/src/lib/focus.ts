/**
 * Focus plumbing shared by Modal and the Combobox listbox.
 */

/**
 * The tabbable-element selector.
 *
 * Deliberately not a general-purpose "is this focusable" implementation. It
 * covers the elements a dialog in this library can realistically contain, and
 * it is applied against the live DOM on every Tab rather than cached at open
 * time, because the contents of a dialog change: a disabled Save button becomes
 * enabled, a validation error appears, a row is deleted. A trap built on a list
 * captured when the dialog opened sends focus to elements that are gone.
 */
const TABBABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

/**
 * Whether an element can actually receive focus right now.
 *
 * The obvious implementation is `element.getClientRects().length > 0`, and it
 * is what most focus traps use. It is also wrong under jsdom, which does no
 * layout at all: every element reports zero rects, so the whole trap silently
 * degrades to "nothing is tabbable" and the unit tests pass for the wrong
 * reason, or fail for a reason that has nothing to do with the trap.
 *
 * So the primary check is computed style, walking ancestors because
 * getComputedStyle on a child of a display:none element reports that child's
 * own display, not none. That works identically in jsdom and in a browser.
 *
 * The rect check is kept, but only where the document is doing layout at all,
 * which the body's own rects tell us. In a real browser it adds the cases
 * style alone misses: a zero-area control, or one inside a collapsed
 * container. Under jsdom the gate is false and the check is skipped.
 */
function isVisible(element: HTMLElement): boolean {
  if (element.hidden) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;

  let node: HTMLElement | null = element;
  while (node) {
    const style = getComputedStyle(node);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    node = node.parentElement;
  }

  const documentDoesLayout = document.body.getClientRects().length > 0;
  if (documentDoesLayout && element.getClientRects().length === 0) return false;

  return true;
}

export function getTabbable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (element) => isVisible(element) && !element.closest('[inert]'),
  );
}

/*
 * Scroll locking, reference counted.
 *
 * The naive version saves body.style.overflow when it locks and writes it back
 * when it unlocks. That is correct for exactly one overlay at a time, and wrong
 * the moment there are two: the second lock saves "hidden", because the first
 * one put it there, and releasing the second restores "hidden" permanently. The
 * page is then unscrollable with nothing on screen to explain why.
 *
 * A modal opening a confirmation dialog is enough to hit this, and so is a
 * modal being unmounted a frame later than the next one mounts, which is what
 * made the test for this flaky roughly one run in three before the counter
 * existed. Counting locks makes the outcome independent of ordering.
 */
let lockCount = 0;
let savedStyles: { overflow: string; paddingRight: string } | null = null;

/**
 * Locks page scroll and returns a function that releases this particular lock.
 * The release is idempotent, so calling it twice does not unbalance the count.
 *
 * The padding compensation is not cosmetic. Removing the scrollbar without it
 * widens the viewport by however many pixels the scrollbar occupied, and every
 * fixed-position element jumps sideways at the moment the dialog opens. On a
 * data-dense screen that is the whole toolbar moving.
 */
export function lockScroll(): () => void {
  const { body, documentElement } = document;

  if (lockCount === 0) {
    savedStyles = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };

    const scrollbar = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) {
      const current = parseFloat(window.getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${current + scrollbar}px`;
    }
  }

  lockCount += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);

    if (lockCount === 0 && savedStyles) {
      body.style.overflow = savedStyles.overflow;
      body.style.paddingRight = savedStyles.paddingRight;
      savedStyles = null;
    }
  };
}
