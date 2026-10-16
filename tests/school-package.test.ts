import { beforeEach, describe, expect, it, vi } from "vitest";
const fake=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),requireSchool:vi.fn(),requireGroup:vi.fn()}));
vi.mock("@/lib/schools/server",async original=>({...await original<object>(),schoolDatabase:()=>({rpc:fake.rpc,from:fake.from}),requireSchool:fake.requireSchool,requireSchoolGroup:fake.requireGroup}));
import { readSchoolPackage } from "@/lib/schools/package";
import { GET,POST } from "@/app/api/schools/package/route";
beforeEach(()=>{vi.clearAllMocks();fake.rpc.mockResolvedValue({data:{active:true,source:'invoice',state:'active',expiresAt:'2027-01-01T00:00:00Z'},error:null});const chain={select:vi.fn(),eq:vi.fn(),or:vi.fn(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({count:7,error:null}).then(resolve)};chain.select.mockReturnValue(chain);chain.eq.mockReturnValue(chain);chain.or.mockReturnValue(chain);fake.from.mockReturnValue(chain);fake.requireSchool.mockResolvedValue({schoolId:'school'});fake.requireGroup.mockResolvedValue({});});
describe('school invoice entitlement',()=>{
 it('uses verified invoice access and counts cumulative group seats',async()=>{expect(await readSchoolPackage('group')).toMatchObject({active:true,paid:true,source:'invoice',used:7,limit:30});expect(fake.rpc).toHaveBeenCalledWith('school_group_access',{p_group_id:'group'});});
 it('fails closed when the invoice migration is unavailable',async()=>{fake.rpc.mockResolvedValue({data:null,error:{message:'missing function'}});await expect(readSchoolPackage('group')).rejects.toMatchObject({status:503});});
 it('does not grant full access for revoked or expired grants',async()=>{fake.rpc.mockResolvedValue({data:{active:false,source:'invoice',state:'revoked'},error:null});expect(await readSchoolPackage('group')).toMatchObject({paid:false,active:false});});
 it('retires the authenticated school package checkout without Stripe',async()=>{const response=await POST(new Request('http://localhost/api/schools/package',{method:'POST',headers:{origin:'http://localhost'}}));expect(response.status).toBe(410);expect(fake.rpc).not.toHaveBeenCalled();});
 it('ignores payment session query strings when reading access',async()=>{const id='11111111-1111-4111-8111-111111111111';const response=await GET(new Request('http://localhost/api/schools/package?group='+id+'&session_id=cs_forged'));expect(response.status).toBe(200);expect(fake.rpc).toHaveBeenCalledExactlyOnceWith('school_group_access',{p_group_id:id});});
});
