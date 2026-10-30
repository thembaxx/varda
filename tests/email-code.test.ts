import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { sendSignInCode, isEmailCodeConfigured } from "../lib/auth-email";

const prior = {
  VARDA_EMAIL_OTP_ENABLED: process.env.VARDA_EMAIL_OTP_ENABLED,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
};
const originalFetch = globalThis.fetch;

afterEach(() => {
  for (const [key, value] of Object.entries(prior)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = originalFetch;
});

test("email codes are disabled without an explicitly configured sender", async () => {
  delete process.env.VARDA_EMAIL_OTP_ENABLED;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  assert.equal(isEmailCodeConfigured(), false);
  await assert.rejects(sendSignInCode("person@example.com", "123456", "sign-in"), /not configured/);
});

test("email code delivery sends a short-lived code through the configured provider", async () => {
  process.env.VARDA_EMAIL_OTP_ENABLED = "true";
  process.env.RESEND_API_KEY = "test-key";
  process.env.RESEND_FROM_EMAIL = "Varda <login@example.com>";
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer test-key");
    const payload = JSON.parse(String(init?.body));
    assert.deepEqual(payload.to, ["person@example.com"]);
    assert.match(payload.text, /123456/);
    assert.match(payload.text, /5 minutes/);
    return Response.json({ id: "test-id" });
  };
  await sendSignInCode("person@example.com", "123456", "sign-in");
  assert.equal(calls, 1);
});

test("delivery fails closed and rejects unsupported operations", async () => {
  process.env.VARDA_EMAIL_OTP_ENABLED = "true";
  process.env.RESEND_API_KEY = "test-key";
  process.env.RESEND_FROM_EMAIL = "Varda <login@example.com>";
  globalThis.fetch = async () => new Response("Provider failed", { status: 422 });
  await assert.rejects(
    sendSignInCode("person@example.com", "123456", "sign-in"),
    /delivery failed/,
  );
  await assert.rejects(
    sendSignInCode("person@example.com", "123456", "forget-password"),
    /Unsupported/,
  );
});
