import { describe, expect, it } from "vitest";
import { localLiveEvaluationEnabled } from "@/lib/ai/local-live-evaluation";

const local = { LOCAL_LIVE_EVALUATION: "true", MOCK_MODE: "true", NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3111" };
describe("isolated local live evaluation", () => {
  it("allows only explicit localhost dev evaluations with memory storage", () => {
    expect(localLiveEvaluationEnabled(local)).toBe(true);
    expect(localLiveEvaluationEnabled({ ...local, NEXT_PUBLIC_APP_URL: "http://localhost:3111" })).toBe(true);
  });
  it.each([
    { LOCAL_LIVE_EVALUATION: "false" }, { MOCK_MODE: "false" }, { NODE_ENV: "production" },
    { NODE_ENV: "test" }, { VERCEL: "1" }, { VERCEL_ENV: "preview" },
    { VERCEL_TARGET_ENV: "production" }, { NEXT_PUBLIC_APP_URL: "https://cvunfold.com" },
    { NEXT_PUBLIC_APP_URL: "" },
  ])("rejects deployment or ambiguous storage configuration %j", (overrides) => {
    expect(localLiveEvaluationEnabled({ ...local, ...overrides })).toBe(false);
  });
});
