import { readFileSync } from "node:fs";
import { join } from "node:path";
import { detectTargetRole } from "../src/lib/role-detection";
import { TARGET_ROLES, type TargetRoleId } from "../src/lib/roles";

// Offline accuracy for the deterministic role detector. Run before trusting the
// detector with anything user-visible: it answers "how often is it right, and
// what does it confuse with what", which is the question that decides whether
// prefilling the role field is safe at all.
//
// Deterministic input and deterministic detector means this number does not move
// between runs. A change here is a real change in behaviour, not sampling noise.

type DetectionCase = { id: string; expected: TargetRoleId; confident: boolean; signal: string; text: string };

const cases: DetectionCase[] = JSON.parse(
  readFileSync(join(process.cwd(), "fixtures", "role-detection-cases.json"), "utf8"),
).cases;

const roleIds: TargetRoleId[] = [...TARGET_ROLES.map((role) => role.id)];
const results = cases.map((item) => {
  const detection = detectTargetRole(item.text);
  return {
    ...item,
    detected: detection.role,
    detectedConfident: detection.confident,
    correct: detection.role === item.expected,
    confidenceCorrect: detection.confident === item.confident,
    topScore: detection.scores[0]?.score ?? 0,
  };
});

const correct = results.filter((result) => result.correct).length;
const confidenceCorrect = results.filter((result) => result.confidenceCorrect).length;
const percent = (part: number, whole: number) => whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`;

console.log("\nRole detection — offline accuracy\n");
console.log(`Cases:                ${results.length}`);
console.log(`Correct role:         ${correct} (${percent(correct, results.length)})`);
console.log(`Correct confidence:   ${confidenceCorrect} (${percent(confidenceCorrect, results.length)})`);

// The dangerous failure is a confident wrong answer: it silently picks the wrong
// rubric. A hedged wrong answer only costs the user one correction.
const confidentlyWrong = results.filter((result) => !result.correct && result.detectedConfident);
console.log(`Confidently wrong:    ${confidentlyWrong.length}${confidentlyWrong.length ? "  <-- these pick the wrong rubric silently" : ""}`);

console.log("\nPer expected role\n");
for (const role of roleIds) {
  const forRole = results.filter((result) => result.expected === role);
  if (!forRole.length) continue;
  const hits = forRole.filter((result) => result.correct).length;
  console.log(`  ${role.padEnd(22)} ${String(hits).padStart(2)}/${forRole.length}  ${percent(hits, forRole.length)}`);
}

const confusions = results.filter((result) => !result.correct);
if (confusions.length) {
  console.log("\nConfusions\n");
  for (const result of confusions) {
    console.log(`  ${result.id}`);
    console.log(`    expected ${result.expected} (confident: ${result.confident})`);
    console.log(`    detected ${result.detected} (confident: ${result.detectedConfident}, top score ${result.topScore})`);
    console.log(`    signal   ${result.signal}`);
  }
}

const confidenceMismatches = results.filter((result) => result.correct && !result.confidenceCorrect);
if (confidenceMismatches.length) {
  console.log("\nRight role, wrong confidence\n");
  for (const result of confidenceMismatches) {
    console.log(`  ${result.id}: expected confident=${result.confident}, got ${result.detectedConfident}`);
  }
}

console.log("");
if (confidentlyWrong.length) process.exitCode = 1;
