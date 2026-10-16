import { describe,it,expect,vi } from "vitest";
import { insertFeedbackOnce } from "@/lib/data/feedback";
import type { SupabaseClient } from "@supabase/supabase-js";
const feedback={rating:4,accurate:"yes",comment:"Przydatny raport"};
function database(existing:unknown,error:unknown={code:"23505"}) {
 const insert=vi.fn(async()=>({error})),eq=vi.fn();const query={select:()=>query,eq,maybeSingle:async()=>({data:existing,error:null}),insert};eq.mockReturnValue(query);
 return {db:{from:()=>query} as unknown as SupabaseClient,insert,eq};
}
describe("feedback retries",()=>{
 it("inserts once and treats an identical scoped primary-key conflict as a safe retry",async()=>{
  const fresh=database(null,null);await insertFeedbackOnce(fresh.db,"analysis",feedback,"submission",1);expect(fresh.insert).toHaveBeenCalledWith(expect.objectContaining({id:"submission",analysis_id:"analysis",report_version:1}));
  const retry=database({rating:4,accurate:"yes",comment:feedback.comment,issue_id:null,report_version:1});await insertFeedbackOnce(retry.db,"analysis",feedback,"submission",1);expect(retry.eq).toHaveBeenCalledWith("analysis_id","analysis");
 });
 it("rejects different content, versions and a request owned by another report",async()=>{
  for(const row of [null,{...feedback,rating:2,report_version:1},{...feedback,report_version:0}])await expect(insertFeedbackOnce(database(row).db,"analysis",feedback,"submission",1)).rejects.toThrow("FEEDBACK_REQUEST_REUSED");
 });
});
