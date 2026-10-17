import { expect, it } from "vitest";
import pairs from "../fixtures/schools/guided-iterations.json";
import anna from "../fixtures/schools/demo-revision.json";
import { schoolGuidedIterationsData, schoolIterationDemoData } from "@/lib/schools/demo";

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
it("removes repeated sentences while retaining every recorded fact across each demo conversation", () => {
  const students = [...schoolGuidedIterationsData().students, ...schoolIterationDemoData().students];
  for (const student of students.filter(item => item.sample?.revision)) {
    const conversation = student.sample!.revision!.conversation!;
    const original = conversation.flatMap(item => sentences(item.answer));
    const shown = conversation.flatMap(item => sentences(item.displayAnswer ?? item.answer));
    expect(new Set(shown)).toEqual(new Set(original));
    expect(shown.length).toBe(new Set(shown).size);
  }
});
it("keeps the stored answers and presents the distinct technical explanation for Karolina", () => {
  const pair = pairs.find(p => p.id === "karolina")!;
  expect(pair.conversation[2].answer).toBe(`${pair.factLedger.ownership} ${pair.factLedger.structure}`);
  expect("displayAnswer" in pair.conversation[2] ? pair.conversation[2].displayAnswer : undefined).toBe(pair.factLedger.structure);
  expect(anna.conversation[0].answer).toBe(anna.conversation[1].answer);
});
