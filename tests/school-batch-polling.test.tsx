// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { SchoolPanel } from "@/components/schools/school-panel";
import type { SchoolData } from "@/lib/schools/model";
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
describe("school queue refresh",()=>{
 it("refreshes active batches and stops polling when processing completes",async()=>{
   vi.useFakeTimers();
   const data:SchoolData={schoolName:"Testowa",groups:[{id:"g",name:"Frontend",target_role:"frontend_developer",target_seniority:"first_job"}],groupId:"g",students:[],backgroundUploadsEnabled:true,analysisTiming:{averageMs:120000,sampleCount:10},batches:[{id:"b",createdAt:new Date().toISOString(),status:"queued",jobs:[{id:"j",name:"Anna",status:"queued"}]}]};
   const done={...data,batches:[{...data.batches![0],status:"complete",jobs:[{...data.batches![0].jobs[0],status:"complete"}]}]};
   const fetch=vi.fn(async()=>({ok:true,json:async()=>done}));vi.stubGlobal("fetch",fetch);
   render(<SchoolPanel initialData={data}/>);expect(screen.getByRole("heading",{name:"Pracujemy nad CV Twojej grupy"})).toBeTruthy();
   await act(async()=>{await vi.advanceTimersByTimeAsync(10000);});
   expect(screen.getByRole("heading",{name:"Paczka została przetworzona"})).toBeTruthy();expect(fetch).toHaveBeenCalledOnce();
   await act(async()=>{await vi.advanceTimersByTimeAsync(30000);});expect(fetch).toHaveBeenCalledOnce();
 });
});
