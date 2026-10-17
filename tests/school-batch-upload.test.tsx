// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SchoolBatchUpload } from "@/components/schools/batch-upload";
vi.mock("@/lib/schools/upload-files",()=>({ expandSchoolFiles:async(files:File[])=>files,studentNameFromFilename:()=>"Anna Testowa" }));
beforeEach(()=>vi.stubGlobal("fetch",vi.fn()));afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const props={groupId:"group",remainingSeats:30,onBusy:vi.fn(),onSubmitted:vi.fn(async()=>{}),onClose:vi.fn()};
function choose() { fireEvent.change(document.querySelector('input[type="file"]')!,{target:{files:[new File(["pdf"],"Anna_Testowa.pdf",{type:"application/pdf"})]}}); }
describe("school batch transfer UI",()=>{
  it("sends auto names, waits for transfer and commits before confirming submission",async()=>{
    const calls:unknown[]=[];let release:()=>void=()=>{};
    vi.mocked(fetch).mockImplementation(async(url,init)=>{
      if(url==="/api/schools/uploads") {const body=JSON.parse(String(init?.body));calls.push(body);return {ok:true,json:async()=>body.action==="prepare"?{batchId:"batch",jobs:[{id:"job",url:"https://storage.test/upload"}]}:{ok:true}} as Response;}
      await new Promise<void>(resolve=>{release=resolve;});return {ok:true} as Response;
    });
    const submitted=vi.fn(async()=>{});render(<SchoolBatchUpload {...props} onSubmitted={submitted}/>);choose();
    await screen.findByDisplayValue("Anna Testowa");fireEvent.click(screen.getByRole("checkbox"));fireEvent.click(screen.getByRole("button",{name:"Prześlij i analizuj w tle"}));
    await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));expect(submitted).not.toHaveBeenCalled();release();
    await waitFor(()=>expect(submitted).toHaveBeenCalledOnce());expect(calls).toEqual([expect.objectContaining({action:"prepare",files:[expect.objectContaining({studentName:"Anna Testowa",manual:false})]}),{action:"commit",batchId:"batch"}]);
  });
  it("retries only commit after a failed confirmation, avoiding duplicate uploads",async()=>{
    let failed=false;vi.mocked(fetch).mockImplementation(async(url,init)=>{
      if(url!=="/api/schools/uploads")return {ok:true} as Response;
      const body=JSON.parse(String(init?.body));if(body.action==="prepare")return {ok:true,json:async()=>({batchId:"batch",jobs:[{id:"job",url:"https://storage.test/upload"}]})} as Response;
      if(!failed){failed=true;return {ok:false,json:async()=>({error:"Spróbuj ponownie"})} as Response;}return {ok:true,json:async()=>({ok:true})} as Response;
    });
    render(<SchoolBatchUpload {...props}/>);choose();await screen.findByDisplayValue("Anna Testowa");fireEvent.click(screen.getByRole("checkbox"));fireEvent.click(screen.getByRole("button",{name:"Prześlij i analizuj w tle"}));await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button",{name:"Ponów zapis paczki"}));await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(4));
    expect(vi.mocked(fetch).mock.calls.filter(([url])=>url==="https://storage.test/upload")).toHaveLength(1);
  });
});
