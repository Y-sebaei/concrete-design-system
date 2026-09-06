import { expect, test, type Page } from '@playwright/test';

/**
 * The combobox, operated only from the keyboard.
 *
 * The assertions follow aria-activedescendant rather than DOM focus, because
 * that is the whole design of the pattern: focus stays in the text field so the
 * user can keep typing, and the highlight moves separately. A test that asserts
 * on document.activeElement would pass on an implementation that moves real
 * focus into the list, which is the wrong behaviour and breaks typing.
 */

const STORY = '/iframe.html?id=components-combobox--playground&viewMode=story';

/** The text of the option currently marked active, or null. */
async function activeOption(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const input = document.querySelector('input[role="combobox"]');
    const id = input?.getAttribute('aria-activedescendant');
    if (!id) return null;
    return document.getElementById(id)?.textContent?.trim() ?? null;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto(STORY);
  await expect(page.getByRole('combobox', { name: 'City' })).toBeVisible();
});

test('is collapsed at rest and wired to its listbox', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });

  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('listbox')).toHaveCount(0);

  await input.focus();
  await page.keyboard.press('ArrowDown');

  await expect(input).toHaveAttribute('aria-expanded', 'true');
  const listboxId = await page.getByRole('listbox').getAttribute('id');
  await expect(input).toHaveAttribute('aria-controls', listboxId!);
});

test('keeps DOM focus in the text field while the highlight moves', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  await page.keyboard.press('ArrowDown');
  await expect(input).toBeFocused();
  expect(await activeOption(page)).toContain('Berlin');

  await page.keyboard.press('ArrowDown');
  await expect(input).toBeFocused();
  expect(await activeOption(page)).toContain('Bern');
});

test('ArrowUp opens on the last option and wraps', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  await page.keyboard.press('ArrowUp');
  expect(await activeOption(page)).toContain('Zurich');

  await page.keyboard.press('ArrowDown');
  expect(await activeOption(page)).toContain('Berlin');
});

test('Alt+ArrowDown opens the list without choosing anything', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  await page.keyboard.press('Alt+ArrowDown');

  await expect(page.getByRole('listbox')).toBeVisible();
  expect(await activeOption(page)).toBeNull();
});

test('steps over a disabled option rather than landing on it', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  // Berlin, Bern, Bremen, Cologne, then Dresden is disabled so Hamburg.
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowDown');
  expect(await activeOption(page)).toContain('Cologne');

  await page.keyboard.press('ArrowDown');
  expect(await activeOption(page)).toContain('Hamburg');
  expect(await activeOption(page)).not.toContain('Dresden');
});

test('typing filters the list and the count is announced', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.click();
  await page.keyboard.type('bre');

  await expect(page.getByRole('option')).toHaveCount(1);
  await expect(page.getByRole('option').first()).toContainText('Bremen');

  // The live region is what tells a screen reader how many results are left.
  // Screen readers announce the active option on their own and never announce
  // the count, which is the reason this region exists at all.
  await expect(page.locator('[aria-live="polite"]')).toHaveText(/1 result available/);
});

test('Enter commits the highlighted option and closes', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(input).toHaveValue('Bern');
  await expect(input).toBeFocused();
});

test('the active option is visibly marked, not only marked in ARIA', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();
  await page.keyboard.press('ArrowDown');

  /*
   * The regression this guards against is real: the highlight was once a tint
   * at 1.09:1 against the surface behind it, which is correct in the
   * accessibility tree and invisible on screen. A state carried only by ARIA
   * excludes everybody who is looking at the screen.
   */
  const marker = await page.evaluate(() => {
    const input = document.querySelector('input[role="combobox"]');
    const id = input?.getAttribute('aria-activedescendant');
    const option = id ? document.getElementById(id) : null;
    if (!option) return null;
    const style = getComputedStyle(option);
    return { boxShadow: style.boxShadow, background: style.backgroundColor, color: style.color };
  });

  expect(marker).not.toBeNull();
  // The 2px accent bar is what meets the 3:1 that WCAG 1.4.11 asks of a state
  // indicator; the tint alone cannot.
  expect(marker!.boxShadow).toContain('inset');
});

test('Escape closes, and a second Escape clears the field', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(input).toHaveValue('Berlin');

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await expect(input).toHaveValue('Berlin');

  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
});

test('Tab commits the highlight and lets focus leave', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.focus();

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Tab');

  await expect(input).toHaveValue('Bern');
  await expect(input).not.toBeFocused();
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('an empty result is not offered as a selectable option', async ({ page }) => {
  const input = page.getByRole('combobox', { name: 'City' });
  await input.click();
  await page.keyboard.type('zzzz');

  // A dead-end option the user can arrow onto and press Enter on is worse than
  // no option, and a listbox may only contain options in any case.
  await expect(page.getByRole('option')).toHaveCount(0);
  await expect(page.getByText('Nothing matches that')).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).toHaveText(/No results/);
});

test('inline autocomplete completes forwards and deletes backwards', async ({ page }) => {
  await page.goto('/iframe.html?id=components-combobox--inline-autocomplete&viewMode=story');
  const input = page.getByRole('combobox', { name: 'City' });

  await input.click();
  await page.keyboard.type('brem');
  await expect(input).toHaveValue('Bremen');

  // The selected completion is what the next keystroke replaces.
  const selection = await input.evaluate((el: HTMLInputElement) => [
    el.selectionStart,
    el.selectionEnd,
  ]);
  expect(selection).toEqual([4, 6]);

  // And Backspace has to actually delete. Re-completing here is the bug that
  // makes the field feel frozen, and it is the one most implementations ship.
  await page.keyboard.press('Backspace');
  await expect(input).toHaveValue('Brem');
});
