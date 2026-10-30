import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";
import path from "node:path";

test("Better Auth registration, profile edits, authenticated community API and sign-in survive a reload", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const email = `varda-e2e-${Date.now()}@example.test`;
  const title = `Community test ${Date.now()}`;
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Open your profile" }).click();
    await page.getByRole("button", { name: "Create account", exact: true }).click();
    await page.getByLabel("Your name", { exact: true }).fill("Test Neighbour");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("A-little-test-password-1987");
    await page.getByRole("button", { name: "Find your people" }).click();

    await page.getByRole("button", { name: "Open your profile" }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await page.getByLabel("Your name", { exact: true }).fill("River Neighbour");
    await page.getByRole("button", { name: "Save profile" }).click();

    const post = await page.request.post("/api/community", {
      headers: { origin: process.env.BETTER_AUTH_URL! },
      data: {
        title,
        message: "An actual authenticated post written by the browser regression test.",
        category: "Outdoors",
      },
    });
    expect(post.status()).toBe(201);
    const crossOrigin = await page.request.post("/api/community", {
      headers: { origin: "https://other.example" },
      data: {
        title,
        message: "This authenticated cross-origin write must fail.",
        category: "Outdoors",
      },
    });
    expect(crossOrigin.status()).toBe(403);
    const { id } = await post.json();
    expect(typeof id).toBe("string");
    const listing = await page.request.get("/api/community");
    expect(listing.ok()).toBe(true);
    expect((await listing.json()).posts.some((item: { id: string }) => item.id === id)).toBe(true);

    const origin = new URL(page.url()).origin;
    const reservationDetails = {
      roomId: "fynbos",
      date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      time: "10:00",
      hours: 1,
      requestId: crypto.randomUUID(),
    };
    const reserve = () =>
      page.request.post("/api/reservations", {
        headers: { origin },
        data: reservationDetails,
      });
    const reserved = await reserve();
    expect(reserved.status()).toBe(201);
    const { reservation } = await reserved.json();
    expect(reservation.paymentStatus).toBe("unpaid");
    expect((await (await reserve()).json()).reservation.id).toBe(reservation.id);
    const cancelled = await page.request.delete("/api/reservations", {
      headers: { origin },
      data: { id: reservation.id },
    });
    expect(cancelled.status()).toBe(200);
    expect((await cancelled.json()).reservation.status).toBe("cancelled");

    await page.reload();
    await page.getByRole("button", { name: "Open your profile" }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
    await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("River Neighbour");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Open your profile" }).click();
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("A-little-test-password-1987");
    await page.getByRole("button", { name: "Come on in" }).click();
    await page.getByRole("button", { name: "Open your profile" }).click();
    await expect(page.getByText(email, { exact: true })).toBeVisible();
  } finally {
    const db = new Database(path.resolve(process.env.AUTH_DATABASE_PATH || ".data/varda.sqlite"));
    try {
      db.pragma("foreign_keys = ON");
      db.prepare("DELETE FROM user WHERE email = ?").run(email);
    } finally {
      db.close();
    }
  }
});

test("unauthenticated social writes and unsigned settlement fail closed", async ({ request }) => {
  const post = await request.post("/api/community", {
    headers: { origin: process.env.BETTER_AUTH_URL! },
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
