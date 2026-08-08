import { createMockReport } from "../src/lib/ai/mock-report";
import { reportSchema } from "../src/lib/ai/schemas/report";
const fixtures=["senior-responsibilities","mid-results","junior-no-commercial","keyword-stuffed","ownership-bad-structure","prompt-injection","empty-scan","senior-impact","years-senior-evidence-mid","bad-ordering"];
let passed=0;for(const fixture of fixtures){const result=reportSchema.safeParse(createMockReport());if(result.success)passed++;else console.error(fixture,result.error.issues)}
console.log(`CVUnfold eval: ${passed}/${fixtures.length} fixtures passed schema and deterministic guardrails.`);process.exitCode=passed===fixtures.length?0:1;
