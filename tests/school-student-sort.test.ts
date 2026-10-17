import { describe, expect, it } from "vitest";
import { schoolDemoStudents } from "@/lib/schools/demo";
import { sortSchoolStudents } from "@/lib/schools/model";

describe("student ordering", () => {
  it("sorts full names using Polish alphabetical order in both directions", () => {
    const students = schoolDemoStudents(0, 4);
    ["Anna Żuk", "Łukasz Nowak", "Anna Adamska", "Lena Kowalska"].forEach((name, i) => students[i].name = name);
    expect(sortSchoolStudents(students, { key: "name", direction: "asc" }).map(p => p.name))
      .toEqual(["Anna Adamska", "Anna Żuk", "Lena Kowalska", "Łukasz Nowak"]);
    expect(sortSchoolStudents(students, { key: "name", direction: "desc" }).map(p => p.name))
      .toEqual(["Łukasz Nowak", "Lena Kowalska", "Anna Żuk", "Anna Adamska"]);
    expect(students[0].name).toBe("Anna Żuk");
  });
  it("keeps missing grades last, treats zero as a real grade and sorts ties by name", () => {
    const students = schoolDemoStudents(0, 4);
    students[0].report!.summary.overallScore = 0;
    students[1].report = null;
    students[2].report!.summary.overallScore = 80;
    students[3].report!.summary.overallScore = 80;
    expect(sortSchoolStudents(students, { key: "score", direction: "asc" }).map(p => p.id))
      .toEqual([students[0].id, students[2].id, students[3].id, students[1].id]);
    expect(sortSchoolStudents(students, { key: "score", direction: "desc" }).map(p => p.id))
      .toEqual([students[2].id, students[3].id, students[0].id, students[1].id]);
  });
});
