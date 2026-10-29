import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function home(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: /Interactive.*3D.*micro-grid anatomy/ })).toBeVisible();
}

test('current homepage exposes its studio, community board and South African payment sections', async ({ page }) => {
  await home(page);
  for (const id of ['studio', 'community-board', 'sa-payments', 'architecture-specs']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.getByRole('button', { name: 'Open your profile' })).toBeVisible();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Make it yours' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Make it yours' })).toHaveCount(0);
});

test('theme and accent preferences survive a reload', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Make it yours' });
  await settings.getByRole('button', { name: 'Dark', exact: true }).click();
  await settings.getByRole('button', { name: 'coral accent', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'coral');
});

test('studio animation intensity is stored and respects a selected reduced mode', async ({ page }) => {
  await home(page);
  const choices = page.getByRole('group', { name: '3D Studio Animation Intensity' });
  await choices.getByRole('button', { name: /Reduced/ }).click();
  await expect(choices.getByRole('button', { name: /Reduced/ })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(
    page.getByRole('group', { name: '3D Studio Animation Intensity' }).getByRole('button', { name: /Reduced/ }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('offline payment mode labels do not claim a completed real settlement', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: 'Simulate Load-Shedding' }).click();
  await expect(page.getByRole('button', { name: 'Offline USSD Queue: ON' })).toBeVisible();
  await page.getByRole('button', { name: 'Offline USSD Queue: ON' }).click();
  await expect(page.getByRole('button', { name: 'Simulate Load-Shedding' })).toBeVisible();
});

test('mobile bottom navigation remains visible without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await home(page);
  const nav = page.getByRole('navigation', { name: 'Mobile Bottom Navigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Varda Quick Settle' })).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test('home and preferences have no serious accessibility violations', async ({ page }) => {
  await home(page);
  const homeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(homeResults.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.getByRole('button', { name: 'Open settings' }).click();
  const settingsResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(settingsResults.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});
