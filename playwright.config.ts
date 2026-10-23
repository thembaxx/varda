import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const executablePath =
  process.env.CHROMIUM_PATH || (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      executablePath,
      args: [
        "--no-sandbox",
        "--use-angle=swiftshader",
        "--enable-webgl",
        "--enable-unsafe-swiftshader",
      ],
    },
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
