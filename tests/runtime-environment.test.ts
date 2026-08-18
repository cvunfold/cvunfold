import { describe, expect, it } from "vitest";
import { runtimeEnvironmentFrom } from "@/lib/runtime-environment";

describe("runtimeEnvironmentFrom", () => {
  it.each([
    [{ VERCEL_ENV: "production", NODE_ENV: "production" }, "production"],
    [{ VERCEL_ENV: "preview", NODE_ENV: "production" }, "preview"],
    [{ VERCEL_ENV: "development", NODE_ENV: "development" }, "development"],
    [{ NODE_ENV: "production" }, "production"],
    [{ NODE_ENV: "development" }, "development"],
  ] as const)("maps %o to %s", (environment, expected) => {
    expect(runtimeEnvironmentFrom(environment)).toBe(expected);
  });
});
