// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SchoolSelect } from "@/components/schools/school-select";
afterEach(cleanup);
const options = [{ id: "first_job", label: "Pierwsza praca w IT", mark: "IT" }, { id: "junior", label: "Junior", mark: "JR" }];
it("supports keyboard selection and submits the chosen form value", () => {
  const onChange = vi.fn();
  const { container } = render(<form><SchoolSelect name="seniority" label="Etap kariery" options={options} onChange={onChange}/></form>);
  const field = screen.getByRole("combobox", { name: "Etap kariery" });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "ArrowDown" });
  fireEvent.keyDown(field, { key: "Enter" });
  expect(onChange).toHaveBeenCalledWith("junior");
  expect(field.getAttribute("aria-expanded")).toBe("false");
  expect(new FormData(container.querySelector("form")!).get("seniority")).toBe("junior");
  fireEvent.click(field); fireEvent.keyDown(field, { key: "Escape" });
  expect(field.getAttribute("aria-expanded")).toBe("false");
});
it("keeps disabled fields unavailable", () => {
  render(<SchoolSelect label="Grupa" value="first_job" options={options} disabled/>);
  expect(screen.getByRole("combobox", { name: "Grupa" }).hasAttribute("disabled")).toBe(true);
  expect(screen.queryByRole("listbox")).toBeNull();
});
