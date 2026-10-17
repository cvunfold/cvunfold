// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackComposer } from "@/components/schools/feedback-composer";
import { SchoolPanel } from "@/components/schools/school-panel";
import { schoolDemoData } from "@/lib/schools/demo";
import { buildFeedbackDraft } from "@/lib/schools/feedback-draft";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function setup() {
  const data = schoolDemoData(); const student = data.students[0];
  render(<FeedbackComposer student={student} schoolName={data.schoolName} report={student.report!}/>);
  fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail" }));
  return { data, student, draft: buildFeedbackDraft(student.name, data.schoolName, student.report!), body: screen.getByLabelText("Treść maila") as HTMLTextAreaElement };
}
describe("editable school feedback", () => {
  it.each([
    ["Emilia Czech", "Cześć Emilia!"], ["Jarosław Kowalski", "Cześć Jarek!"],
    ["Bartosz Lis", "Cześć Bartek!"], ["Franciszek Bąk", "Cześć Franek!"],
    ["Wojciech Adamski", "Cześć Wojtek!"], ["Katarzyna Nowak", "Cześć Kasia!"],
    ["  Jaroslaw   Nowak ", "Cześć Jarek!"], ["Lena Zając", "Cześć Lena!"],
    ["", "Cześć!"], ["cv.pdf", "Cześć!"],
  ])("uses a casual first-name greeting for %s", (name, greeting) => {
    const student = schoolDemoData().students[0];
    const draft = buildFeedbackDraft(name, "Szkoła", student.report!);
    expect(draft.body.split("\n")[0]).toBe(greeting);
    expect(draft.subject).toBe(`Feedback do CV: ${name}`);
  });
  it("shows a mail link below the copy action and follows the selected recipient", () => {
    const data = schoolDemoData(); const student = data.students[0];
    student.contact = { emails: ["anna@example.com", "anna+cv@example.com"], phones: [] };
    render(<FeedbackComposer student={student} schoolName={data.schoolName} report={student.report!}/>);
    fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail" }));
    expect(screen.getByRole("link", { name: "anna@example.com" }).getAttribute("href")).toBe("mailto:anna%40example.com");
    fireEvent.click(screen.getByRole("combobox", { name: "Adresat" }));
    fireEvent.click(screen.getByRole("option", { name: "anna+cv@example.com" }));
    expect(screen.getByRole("link", { name: "anna+cv@example.com" }).getAttribute("href")).toBe("mailto:anna%2Bcv%40example.com");
  });
  it("shows suggestions only in empty fields, accepts Tab, returns after clearing and preserves edits", () => {
    const { body, draft } = setup();
    expect(body.value).toBe(""); expect(body.placeholder).toBe(draft.body);
    expect(screen.getByRole("button", { name: "Kopiuj mail" }).hasAttribute("disabled")).toBe(true);
    expect(fireEvent.keyDown(body, { key: "Tab", shiftKey: true })).toBe(true);
    expect(body.value).toBe("");
    expect(fireEvent.keyDown(body, { key: "Tab" })).toBe(false);
    expect(body.value).toBe(draft.body);
    fireEvent.change(body, { target: { value: "Mój własny feedback" } });
    expect(fireEvent.keyDown(body, { key: "Tab" })).toBe(true);
    expect(body.value).toBe("Mój własny feedback");
    fireEvent.change(body, { target: { value: "" } });
    expect(body.placeholder).toBe(draft.body);
    fireEvent.keyDown(body, { key: "Tab" }); expect(body.value).toBe(draft.body);
  });
  it("previews and copies only the accepted edited text, with no hidden suggestion", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const { body } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Podgląd maila" }));
    expect(screen.getByText("Treść jest pusta. Wstaw sugestię lub napisz wiadomość.")).toBeTruthy();
    fireEvent.change(body, { target: { value: "Poprawiony feedback\nDrugi akapit" } });
    expect(document.querySelector(".school-feedback-text")?.textContent).toBe("Poprawiony feedback\nDrugi akapit");
    fireEvent.click(screen.getByRole("button", { name: "Kopiuj mail" }));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(writeText).toHaveBeenCalledExactlyOnceWith("Poprawiony feedback\nDrugi akapit");
  });
  it("offers a button for touch input and surfaces clipboard failures", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    const { body, draft } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Wstaw sugestię treści" }));
    expect(body.value).toBe(draft.body);
    fireEvent.click(screen.getByRole("button", { name: "Kopiuj mail" }));
    expect((await screen.findByRole("alert")).textContent).toContain("skopiuj ją ręcznie");
  });
  it("does not reuse one student's draft when switching reports", () => {
    render(<SchoolPanel initialData={schoolDemoData()} demo/>);
    fireEvent.click(screen.getAllByRole("button", { name: "Raport" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail" }));
    fireEvent.change(screen.getByLabelText("Treść maila"), { target: { value: "Prywatny tekst dla Anny" } });
    fireEvent.click(screen.getByRole("combobox", { name: "Kursant" }));
    fireEvent.click(screen.getByRole("option", { name: "Michał Nowak" }));
    fireEvent.click(screen.getByRole("button", { name: "Przygotuj mail" }));
    expect((screen.getByLabelText("Treść maila") as HTMLTextAreaElement).value).toBe("");
    expect((screen.getByLabelText("Temat") as HTMLInputElement).placeholder).toContain("Michał Nowak");
  });
});
