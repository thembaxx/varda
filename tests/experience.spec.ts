import {test, expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function home(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'Hey, neighbour.'})).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
}

test('saved plans, goals, and theme persist across a reload', async ({page}) => {
  await home(page);
  await page.getByRole('button', {name: 'Save A seat at the table', exact: true}).click();
  await page.getByRole('button', {name: 'Take your reusable cup', exact: true}).click();
  await page.getByRole('button', {name: 'Open settings'}).click();
  await page.getByRole('button', {name: 'Dark', exact: true}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', {name: 'coral accent', exact: true}).click();
  await page.getByRole('button', {name: 'Close Make it yours', exact: true}).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'coral');
  await expect(page.getByRole('button', {name: 'Unsave A seat at the table', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: 'Take your reusable cup', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: 'Saved', exact: false}).first().click();
  await expect(page.locator('.event-card')).toHaveCount(1);
  await page.getByRole('button', {name: 'View A seat at the table', exact: true}).click();
  await page.getByRole('button', {name: 'Add to my plans', exact: true}).click();
  await expect(page.getByRole('button', {name: 'In my plans · undo', exact: true})).toBeVisible();
});

test('PWA opens lazy views and retains saved plans after an actual offline reload', async ({page, context}) => {
  await home(page);
  await page.getByRole('button', {name: 'Save A seat at the table', exact: true}).click();
  await expect.poll(() => page.evaluate(async () => !!navigator.serviceWorker.controller), {timeout: 30_000}).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', {name: 'Hey, neighbour.'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Unsave A seat at the table', exact: true})).toBeVisible();
  await page.locator('.desktop-nav').getByRole('link', {name: 'Wallet'}).click();
  await expect(page.getByRole('heading', {name: 'More living. Less life admin.'})).toBeVisible();
  await page.getByRole('button', {name: 'Save for later', exact: true}).click();
  await expect(page.getByText('Saved on this device · unpaid')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Continue to sandbox checkout'})).toBeDisabled();
  await page.locator('.desktop-nav').getByRole('link', {name: '3D studio'}).click();
  await expect(page.locator('#spatial-studio canvas')).toBeVisible({timeout: 30_000});
  await context.setOffline(false);
});

test('offline preference prevents account and payment requests without marking saved intents paid', async ({page}) => {
  await home(page);
  await page.getByRole('button', {name: 'Open settings'}).click();
  await page.getByRole('switch', {name: 'Offline mode', exact: true}).click();
  await expect(page.getByRole('switch', {name: 'Offline mode', exact: true})).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', {name: 'Close Make it yours', exact: true}).click();
  await page.locator('.desktop-nav').getByRole('link', {name: 'Wallet'}).click();
  await page.getByRole('button', {name: 'Save for later', exact: true}).click();
  await expect(page.getByText('Saved on this device · unpaid')).toBeVisible();
  await expect(page.getByRole('button', {name: 'Continue to sandbox checkout'})).toBeDisabled();
  await page.reload();
  await expect(page.locator('.offline-bar')).toContainText('Offline mode');
  const result = await page.evaluate(async () => {
    const response = await fetch('/api/auth/ok'); return response.status;
  });
  expect(result).toBe(503);
  await page.getByRole('button', {name: 'Reconnect', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Continue to sandbox checkout'})).toBeEnabled();
});

test('layout and dialogs fit mobile through desktop, and reduced motion wins', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await home(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({width, height: 900});
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', {name: 'Open settings'}).click();
    const box = await page.getByRole('dialog').boundingBox();
    expect(box!.width).toBeLessThanOrEqual(width);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.setViewportSize({width: 390, height: 844});
  await expect(page.getByRole('navigation', {name: 'Mobile navigation'})).toBeVisible();
  await page.getByRole('navigation', {name: 'Mobile navigation'}).getByRole('link', {name: 'Community'}).click();
  await expect(page.getByRole('heading', {name: 'A little hello. A lot of possibility.'})).toBeVisible();
});

test('installation events are retained before the settings dialog opens', async ({page}) => {
  await home(page);
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt');
    Object.assign(event, {prompt: async () => {}, userChoice: Promise.resolve({outcome: 'accepted', platform: 'web'})});
    window.dispatchEvent(event);
  });
  await page.getByRole('button', {name: 'Open settings'}).click();
  await page.getByRole('button', {name: /Take Varda home/}).click();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByText('Varda is at home on this device.')).toBeVisible();
});

test('home and settings have no serious accessibility violations', async ({page}) => {
  await home(page);
  const homeResults = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(homeResults.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await page.getByRole('button', {name: 'Open settings'}).click();
  const settingsResults = await new AxeBuilder({page}).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(settingsResults.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});
