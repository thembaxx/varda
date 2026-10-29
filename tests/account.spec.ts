import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'node:path';

test('Better Auth registration, profile edits, authenticated community API and sign-in survive a reload', async ({ page }) => {
  const email = `varda-e2e-${Date.now()}@example.test`;
  const title = `Community test ${Date.now()}`;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open your profile' }).click();
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await page.getByLabel('Your name', { exact: true }).fill('Test Neighbour');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('A-little-test-password-1987');
    await page.getByRole('button', { name: 'Find your people' }).click();

    await page.getByRole('button', { name: 'Open your profile' }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await page.getByLabel('Your name', { exact: true }).fill('River Neighbour');
    await page.getByRole('button', { name: 'Save profile' }).click();

    const post = await page.request.post('/api/community', {
      headers: { origin: 'http://localhost:3000' },
      data: {
        title,
        message: 'An actual authenticated post written by the browser regression test.',
        category: 'Outdoors',
      },
    });
    expect(post.status()).toBe(201);
    const { id } = await post.json();
    expect(typeof id).toBe('string');
    const listing = await page.request.get('/api/community');
    expect(listing.ok()).toBe(true);
    expect((await listing.json()).posts.some((item: { id: string }) => item.id === id)).toBe(true);

    await page.reload();
    await page.getByRole('button', { name: 'Open your profile' }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('River Neighbour');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.getByRole('button', { name: 'Open your profile' }).click();
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill('A-little-test-password-1987');
    await page.getByRole('button', { name: 'Come on in' }).click();
    await page.getByRole('button', { name: 'Open your profile' }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  } finally {
    const db = new Database(path.resolve(process.env.AUTH_DATABASE_PATH || '.data/varda.sqlite'));
    try {
      db.pragma('foreign_keys = ON');
      db.prepare('DELETE FROM user WHERE email = ?').run(email);
    } finally {
      db.close();
    }
  }
});

test('unauthenticated social writes and unsigned settlement fail closed', async ({ request }) => {
  const post = await request.post('/api/community', {
    headers: { origin: 'http://localhost:3000' },
    data: {
      title: 'Unexpected note',
      message: 'This must never reach the database.',
      category: 'Culture',
    },
  });
  expect(post.status()).toBe(401);
  const notification = await request.post('/api/payments/itn', {
    data: { payment_status: 'COMPLETE' },
  });
  expect(notification.status()).toBe(503);
  expect((await notification.json()).verified).toBe(false);
});
