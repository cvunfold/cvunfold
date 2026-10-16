// @vitest-environment jsdom
import { afterEach,it,expect,vi } from "vitest";
import { cleanup,render,screen,fireEvent,waitFor } from "@testing-library/react";
import { SchoolReportRating } from "@/components/schools/report-rating";
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it("shows failed mail delivery and reuses the submission ID on retry",async()=>{
 const fetch=vi.fn().mockResolvedValueOnce({ok:false,json:async()=>({error:"Ocena zapisana, ale nie udało się wysłać maila."})}).mockResolvedValueOnce({ok:true,json:async()=>({ok:true,sent:true})});vi.stubGlobal("fetch",fetch);
 render(<SchoolReportRating id="synthetic" version={1}/>);fireEvent.click(screen.getByRole("button",{name:"Wyślij ocenę"}));
 expect((await screen.findByRole("alert")).textContent).toContain("nie udało się wysłać maila");expect(screen.queryByText("Dziękujemy za ocenę.")).toBeNull();
 fireEvent.click(screen.getByRole("button",{name:"Wyślij ocenę"}));await waitFor(()=>expect(screen.getByText("Dziękujemy za ocenę.")).toBeTruthy());
 expect(JSON.parse(fetch.mock.calls[0][1].body).requestId).toBe(JSON.parse(fetch.mock.calls[1][1].body).requestId);
});
