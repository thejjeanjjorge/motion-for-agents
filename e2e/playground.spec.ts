import { expect, test } from '@playwright/test';

test('preset and reduced-motion controls retain lesson progress', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Run query' }).click();
  const progress = page.getByRole('progressbar', { name: 'Lesson completion' });
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3, 4);
  await expect(page.getByRole('status').filter({ hasText: 'That’s the right result.' })).toBeVisible();
  await page.getByRole('radio', { name: /^Spring/ }).check();
  await page.getByRole('checkbox', { name: /^Reduce motion/ }).check();
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3, 4);
  await expect(page.getByRole('heading', { name: 'Find products under $50' })).toBeVisible();
  await page.getByRole('button', { name: 'Next question' }).click();
  await expect(page.getByRole('heading', { name: 'Find the newest customers' })).toBeVisible();
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3, 4);
  expect(errors).toEqual([]);
});

test('native keyboard activation and tab navigation work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Learning flow' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'UI elements' })).toBeFocused();
  await expect(page.getByRole('tab', { name: 'UI elements' })).toHaveAttribute('aria-selected', 'true');
  const save = page.getByRole('button', { name: 'Save to collection' });
  await save.focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Saved to collection' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Saved to collection' }).press('Enter');
  await expect(save).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'error', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Couldn’t save changes');
});

test('a milestone burst is bounded and only follows an explicit trigger', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('tab', { name: 'UI elements' }).click();
  const particles = page.locator('[data-motion-celebration]');
  await expect(particles).toHaveCount(0);
  await page.getByRole('button', { name: 'Celebrate once' }).click();
  await expect(particles).toHaveCount(1);
  await expect(particles).toHaveAttribute('aria-hidden', 'true');
  await expect(particles).toHaveCount(0, { timeout: 2500 });
  await page.getByRole('radio', { name: /^Celebration/ }).check();
  await expect(particles).toHaveCount(0);
  await expect(page.getByText('A milestone worth marking')).toBeVisible();
});

test('system reduced motion applies on load and when preferences change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByText('Your system already requests reduced motion.')).toBeVisible();
  await page.getByRole('tab', { name: 'UI elements' }).click();
  await page.getByRole('button', { name: 'Celebrate once' }).click();
  await expect(page.locator('[data-motion-celebration]')).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.getByText('Your system motion preference is respected.')).toBeVisible();
  await page.getByRole('button', { name: 'Celebrate once' }).click();
  await expect(page.locator('[data-motion-celebration]')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-motion-celebration]')).toHaveCount(0);
  await expect(page.getByText('A milestone worth marking')).toBeVisible();
});

test('forced reduced motion preserves content and suppresses particles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.getByRole('checkbox', { name: /^Reduce motion/ }).check();
  await page.getByRole('tab', { name: 'UI elements' }).click();
  await page.getByRole('button', { name: 'Celebrate once' }).click();
  await expect(page.locator('[data-motion-celebration]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add 25%' }).click();
  await expect(page.getByRole('progressbar', { name: 'Collection import progress' })).toHaveAttribute('aria-valuenow', '50');
  await expect(page.getByText('A milestone worth marking')).toBeVisible();
});

test('the mobile playground stays within a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Run query' }).click();
  await expect.poll(async () => Number(await page.getByRole('progressbar', { name: 'Lesson completion' }).getAttribute('aria-valuenow'))).toBeCloseTo(100 / 3, 4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('tab', { name: 'UI elements' }).click();
  await expect(page.getByRole('button', { name: 'Celebrate once' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
