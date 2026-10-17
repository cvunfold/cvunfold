import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

// Vercel builds receive production credentials. Unit tests must not inherit them.
const keys = ["PATH", "HOME", "SystemRoot", "TMPDIR", "TEMP", "TMP", "CI", "FORCE_COLOR", "NO_COLOR"];
const env = Object.fromEntries(keys.filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
env.NODE_ENV = "test";
env.MOCK_MODE = "true";
const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("vitest/vitest.mjs"), "run"], {
  env,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
