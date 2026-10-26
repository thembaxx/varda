import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";
import path from "node:path";

test("Better Auth account, profile, community post and reaction round trip through the database", async ({
  page,
}) => {
  const email = `varda-e2e-${Date.now()}@example.test`;
  const title = `A little test walk ${Date.now()}`;
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Open your profile", exact: true }).first().click();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByLabel("Your name", { exact: true }).fill("Test Neighbour");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("A-little-test-password-1987");
    await page.getByRole("button", { name: "Find your people", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hey, Test." })).toBeVisible();
    await page.getByRole("button", { name: "Open your profile", exact: true }).first().click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await page.getByLabel("Your name", { exact: true }).fill("River Neighbour");
    await page.getByRole("button", { name: "Save profile", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Hey, River." })).toBeVisible();
    await page.locator(".desktop-nav").getByRole("link", { name: "Community" }).click();
    await page.getByRole("button", { name: "Leave a note", exact: true }).click();
    await page.getByLabel("A little headline").fill(title);
    await page.getByLabel("Pick a corner").selectOption("Outdoors");
    await page
      .getByLabel("Your note", { exact: true })
      .fill("A real round trip from a friendly invitation to the community database.");
    await page.getByRole("button", { name: "Put it on the board", exact: true }).click();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Like ${title}`, exact: true }).click();
    await expect(page.getByRole("button", { name: `Like ${title}`, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: `Like ${title}`, exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: "Open your profile", exact: true }).first().click();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByRole("button", { name: "Open your profile", exact: true }).first().click();
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("A-little-test-password-1987");
    await page.getByRole("button", { name: "Come on in", exact: true }).click();
    await page.getByRole("button", { name: "Open your profile", exact: true }).first().click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  } finally {
    const db = new Database(path.resolve(process.env.AUTH_DATABASE_PATH || ".data/varda.sqlite"));
    db.pragma("foreign_keys = ON");
    db.prepare("DELETE FROM user WHERE email = ?").run(email);
    db.close();
  }
});

test("unauthenticated social writes and unsigned settlement fail closed", async ({ request }) => {
  const post = await request.post("/api/community", {
    headers: { origin: "http://localhost:3000" },
    data: {
      title: "Unexpected note",
      message: "This must never reach the database.",
      category: "Culture",
    },
  });
  expect(post.status()).toBe(401);
  const notification = await request.post("/api/payments/itn", {
    data: { payment_status: "COMPLETE" },
  });
  expect(notification.status()).toBe(503);
  expect((await notification.json()).verified).toBe(false);
});
