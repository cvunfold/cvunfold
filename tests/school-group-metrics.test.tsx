// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import {cleanup,render} from "@testing-library/react";
import {SchoolGroupMetrics} from "@/components/schools/group-metrics";
import {schoolGuidedIterationsData} from "@/lib/schools/demo";
import {summarizeSchool} from "@/lib/schools/model";
afterEach(cleanup);
it("does not present duplicate initial/current values before anyone has uploaded a second CV",()=>{
  const students=schoolGuidedIterationsData().students.map(student=>({...student,report:student.initialReport??student.report,initialReport:undefined,latestVersion:0}));
  const summary=summarizeSchool(students);
  expect(summary.baseline).toBeNull();
  const {container}=render(<SchoolGroupMetrics summary={summary}/>);
  expect(container.querySelectorAll('.school-metric-pair')).toHaveLength(0);
  const cards=container.querySelectorAll('.school-card');
  expect(cards).toHaveLength(3);
  expect(cards[0].querySelectorAll('strong')).toHaveLength(1);
  expect(cards[2].querySelectorAll('strong')).toHaveLength(1);
  expect(cards[1].querySelector('strong')?.textContent).toBe('0 z 10');
  expect(container.textContent).not.toContain('Początkowo');
  expect(container.textContent).not.toContain('Teraz');
  expect(summary.secondAnalysisCount).toBe(0);
});
