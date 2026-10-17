// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { SchoolFormattedText } from "@/components/schools/formatted-text";
afterEach(cleanup);
it("retains heading line breaks and turns consecutive bullets into one semantic list", () => {
  const { container } = render(<SchoolFormattedText text={"ShopList, 2026\nReact, TypeScript\n• Własny wkład\n• Wsparcie mentora\n• Sprawdzenia"}/>);
  expect(container.querySelector("p")?.textContent).toBe("ShopList, 2026\nReact, TypeScript");
  expect(container.querySelectorAll("ul")).toHaveLength(1);
  expect([...container.querySelectorAll("li")].map(el => el.textContent)).toEqual(["Własny wkład", "Wsparcie mentora", "Sprawdzenia"]);
});
it("keeps separate paragraphs and renders markup as plain text", () => {
  const { container } = render(<SchoolFormattedText text={'Pierwszy akapit\r\n\r\n<script>alert(1)</script>\r\n- Punkt'}/>);
  expect(container.querySelectorAll("p")).toHaveLength(2);
  expect(container.querySelector("script")).toBeNull();
  expect(container.textContent).toContain("<script>alert(1)</script>");
  expect(container.querySelector("li")?.textContent).toBe("Punkt");
});
