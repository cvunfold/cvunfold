import { afterAll, beforeAll, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
let directory: string, preload: string;
beforeAll(() => {
  directory = mkdtempSync(join(tmpdir(), "cvunfold-invoice-cli-")); preload = join(directory, "offline.mjs");
  writeFileSync(preload, `globalThis.fetch = async (url, init) => { console.log('OFFLINE_REQUEST',init.method); return new Response(JSON.stringify({environment:process.env.TEST_MISMATCH ? 'preview':'development',databaseRef:'qqqqqqqqqqqqqqqqqqqq',school:{id:'11111111-1111-4111-8111-111111111111',name:'Fikcyjna szkoła'},active:init.method==='POST',access:null,replayed:false}),{status:200}); };`);
});
afterAll(() => rmSync(directory, { recursive: true, force: true }));
const baseArgs = ["scripts/school-access.mjs", "--action", "activate", "--school-id", "11111111-1111-4111-8111-111111111111", "--base-url", "http://127.0.0.1:3151", "--environment", "development", "--database-ref", "qqqqqqqqqqqqqqqqqqqq", "--invoice", "FV/SYNTHETIC/1", "--until", "2099-01-01T00:00:00Z"];
function run(extra: string[] = [], mismatch = false) {
  return execFileSync(process.execPath, ["--import", preload, ...baseArgs, ...extra], { encoding: "utf8", env: { NODE_ENV: "test", ADMIN_SECRET: "synthetic-owner-secret-".repeat(2), ...(mismatch ? { TEST_MISMATCH: "1" } : {}) }, stdio: ["pipe", "pipe", "pipe"] });
}
it("shows a dry run without sending an activation request", () => {
  const output = run(); expect(output).toContain("OFFLINE_REQUEST GET"); expect(output).not.toContain("OFFLINE_REQUEST POST"); expect(output).toContain('"apply": false');
});
it("sends activation only with the explicit apply flag after target verification", () => {
  const output = run(["--apply"]); expect(output).toContain("OFFLINE_REQUEST POST"); expect(output).toContain('"active": true');
});
it("stops before writing when the inspected environment differs", () => {
  try { run(["--apply"], true); throw new Error("Expected target rejection"); }
  catch (error) { const result = error as { stdout: string; stderr: string }; expect(result.stdout).not.toContain("OFFLINE_REQUEST POST"); expect(result.stderr).toContain("Environment/database mismatch"); }
});
