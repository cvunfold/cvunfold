import { ASSESSMENT_REPORT_PROMPT_VERSION } from "./assessment-report-prompt";
import { ASSESSMENT_VERSION, ASSESSMENT_VALIDATION_VERSION } from "./evidence-assessment";

// The report and its recheck guard must describe the same complete method.
export function reviewPromptVersion(baseVersion: string, separated: boolean): string {
  return `${baseVersion}${separated ? `+${ASSESSMENT_VERSION}+${ASSESSMENT_VALIDATION_VERSION}+${ASSESSMENT_REPORT_PROMPT_VERSION}` : ""}`;
}
