import { defineConfig, devices } from "@playwright/test";

const port = 3107;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  // A clean CI runner compiles each first-visited route on demand.
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { MOCK_MODE: "true", NEXT_PUBLIC_APP_URL: "https://cvunfold.pl" },
  },
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
