// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ read: vi.fn(), hasCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ has: mocks.hasCookie, toString: () => "test-cookie" }), headers: async () => new Headers({ host: "127.0.0.1:3108" }) }));
vi.mock("@/lib/schools/data", () => ({ readSchoolData: mocks.read }));
vi.mock("@/components/schools/school-panel", () => ({ SchoolPanel: () => <div>School panel</div> }));
import SchoolPanelPage from "@/app/dla-szkol/panel/page";
import { SchoolError } from "@/lib/schools/server";
beforeEach(() => { vi.resetAllMocks(); mocks.hasCookie.mockReturnValue(true); });
afterEach(cleanup);
describe("school panel authentication errors", () => {
  it("does not ask a signed-in user to log in when package configuration is missing", async () => {
    mocks.read.mockRejectedValue(new SchoolError(503, "Pakiety grupy nie są jeszcze skonfigurowane."));
    render(await SchoolPanelPage());
    expect(screen.getByRole("alert").textContent).toContain("Pakiety grupy");
    expect(screen.queryByRole("button", { name: "Wyślij link do logowania" })).toBeNull();
    expect(screen.getByRole("link", { name: "Spróbuj ponownie" }).getAttribute("href")).toBe("/dla-szkol/panel");
  });
  it("asks for login when the server session has expired", async () => {
    mocks.read.mockRejectedValue(new SchoolError(401, "Sesja wygasła. Zaloguj się ponownie."));
    render(await SchoolPanelPage());
    expect(screen.getByRole("button", { name: "Wyślij link do logowania" })).toBeTruthy();
  });
  it("asks for login when no session cookie exists", async () => {
    mocks.hasCookie.mockReturnValue(false);
    render(await SchoolPanelPage());
    expect(screen.getByRole("button", { name: "Wyślij link do logowania" })).toBeTruthy();
    expect(mocks.read).not.toHaveBeenCalled();
  });
});
