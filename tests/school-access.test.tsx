// @vitest-environment jsdom
import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SchoolAccess } from "@/components/schools/school-access";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, "", "/"); });

describe("school login confirmation", () => {
  it("retains the code after StrictMode repeats effects and submits only on confirmation", async () => {
    window.history.replaceState(null, "", "/dla-szkol/potwierdz?code=test-one-time-login-code");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Test verification failed" }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<StrictMode><SchoolAccess confirm/></StrictMode>);
    expect(screen.queryByRole("alert")).toBeNull();
    const button = screen.getByRole("button", { name: "Wejdź do panelu" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(new URLSearchParams(window.location.search).get("code")).toBe("test-one-time-login-code");
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith("/api/schools/auth", expect.objectContaining({ method: "PUT", body: JSON.stringify({ code: "test-one-time-login-code" }) }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Test verification failed"));
  });

  it("rejects a link without a code and disables confirmation", () => {
    window.history.replaceState(null, "", "/dla-szkol/potwierdz");
    render(<StrictMode><SchoolAccess confirm/></StrictMode>);
    expect(screen.getByRole("alert").textContent).toContain("Link jest nieprawidłowy");
    expect((screen.getByRole("button", { name: "Wejdź do panelu" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("preserves an unused code when the page remounts", () => {
    window.history.replaceState(null, "", "/dla-szkol/potwierdz?code=test-one-time-login-code");
    const first = render(<SchoolAccess confirm/>);
    first.unmount();
    render(<SchoolAccess confirm/>);
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: "Wejdź do panelu" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it.each(["?error_code=otp_expired", "#error_code=otp_expired"])("explains an expired provider link: %s", suffix => {
    window.history.replaceState(null, "", `/dla-szkol/potwierdz${suffix}`);
    render(<SchoolAccess confirm/>);
    expect(screen.getByRole("alert").textContent).toContain("Link wygasł lub został już użyty");
    expect(window.location.search + window.location.hash).toBe("");
  });
});
