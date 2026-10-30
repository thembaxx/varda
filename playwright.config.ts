import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const port = Number(process.env.VARDA_TEST_PORT || 3215);
const baseURL = `https://localhost:${port}`;
const databaseURL = process.env.VARDA_TEST_DATABASE_URL;
if (!databaseURL)
  throw new Error(
    "Set VARDA_TEST_DATABASE_URL to a dedicated loopback PostgreSQL database ending in _test.",
  );
const database = new URL(databaseURL);
if (
  !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
  !database.pathname.endsWith("_test")
) {
  throw new Error(
    "Browser tests require a dedicated loopback PostgreSQL database ending in _test.",
  );
}
process.env.VARDA_DATABASE_DRIVER = "postgres";
process.env.DATABASE_URL = databaseURL;
process.env.VARDA_EMAIL_OTP_ENABLED = "false";

// Browser workers inherit the managed server's isolated account database.
// Never reuse a developer database or an already-running server.
if (!process.env.VARDA_E2E_DIR) {
  process.env.VARDA_E2E_DIR = mkdtempSync(join(tmpdir(), "varda-e2e-"));
  process.env.BETTER_AUTH_SECRET = randomBytes(48).toString("base64url");
}
process.env.AUTH_DATABASE_PATH = join(process.env.VARDA_E2E_DIR, "accounts.sqlite");
process.env.BETTER_AUTH_URL = baseURL;
process.env.APP_URL = baseURL;
const executablePath =
  process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  globalTeardown: "./tests/teardown.ts",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    reducedMotion: "reduce",
    launchOptions: {
      executablePath,
      args: [
        "--no-sandbox",
        "--ignore-certificate-errors",
        "--use-angle=swiftshader",
        "--enable-webgl",
        "--enable-unsafe-swiftshader",
      ],
    },
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: "node --import tsx scripts/migrate-auth.ts && node .next/standalone/server.js",
      env: { PORT: String(port + 1), HOSTNAME: "127.0.0.1" },
      url: `http://127.0.0.1:${port + 1}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "node scripts/test-https-proxy.mjs",
      url: baseURL,
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});
