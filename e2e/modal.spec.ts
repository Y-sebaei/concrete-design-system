import { expect, test, type Page } from '@playwright/test';

/**
 * The modal, operated only from the keyboard.
 *
 * Everything here is also covered by jsdom unit tests, and that is the point of
 * running it again in a browser: jsdom has no layout, no real focus model and
 * no browser chrome, so a trap can pass there and leak in Chromium. The
 * assertions are deliberately about where focus is, because that is the only
 * thing a keyboard user can perceive.
 */

const STORY = '/iframe.html?id=components-modal--keyboard-only&viewMode=story';

/** The accessible name of whatever currently has focus. */
async function focusedName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return 'BODY';
    return (
      el.getAttribute('aria-label') ??
      el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) ??
      el.tagName
    );
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto(STORY);
  await expect(page.getByRole('button', { name: 'Open dialog' })).toBeVisible();
});

test('opens from the keyboard and moves focus into the dialog', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.focus();
  await page.keyboard.press('Enter');

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAccessibleName('Refund order 4d1f');

  // Focus has to be inside the dialog, not left on the trigger behind it.
  await expect(page.locator('[role="dialog"] :focus')).toBeFocused();
});

test('Tab cycles inside the dialog and never reaches the page behind', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  const seen: string[] = [];
  // Twelve presses is comfortably more than one full cycle of this dialog, so
  // if the trap leaks anywhere in the loop this catches it.
  for (let i = 0; i < 12; i += 1) {
    seen.push(await focusedName(page));
    await page.keyboard.press('Tab');

    const inside = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return Boolean(dialog && dialog.contains(document.activeElement));
    });
    expect(inside, `focus escaped the dialog on press ${i + 1}`).toBe(true);
  }

  // And it actually moved, rather than being pinned to one element.
  expect(new Set(seen).size).toBeGreaterThan(1);
});

test('Shift+Tab wraps backwards from the first element to the last', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  // The first tabbable element in this dialog is the close button.
  await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Refund 49.80 EUR' })).toBeFocused();
});

test('Escape closes the dialog and returns focus to the trigger', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(page.getByRole('dialog')).toBeHidden();
  // The part people forget. Without restore, focus lands on <body> and the next
  // Tab starts from the top of the document.
  await expect(trigger).toBeFocused();
});

test('closing with a button inside the dialog also restores focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Open dialog' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  const cancel = page.getByRole('button', { name: 'Cancel' });
  await cancel.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('the control behind the dialog is not reachable while it is open', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  for (let i = 0; i < 10; i += 1) {
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Behind the dialog' })).not.toBeFocused();
  }
});

test('page scroll is locked while open and restored on close', async ({ page }) => {
  const overflow = () => page.evaluate(() => document.body.style.overflow);

  expect(await overflow()).toBe('');

  await page.getByRole('button', { name: 'Open dialog' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await overflow()).toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await overflow()).toBe('');
});

test('the focus ring is actually drawn on the focused control', async ({ page }) => {
  await page.getByRole('button', { name: 'Open dialog' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  /*
   * A trap that moves focus correctly but draws nothing is still unusable, and
   * it is invisible to every assertion above. This checks the ring exists: a
   * non-transparent outline plus the inner band drawn as a box-shadow.
   */
  const ring = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const style = getComputedStyle(el);
    return {
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });

  expect(ring.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(ring.outlineWidth)).toBeGreaterThan(0);
  expect(ring.boxShadow).not.toBe('none');
});
