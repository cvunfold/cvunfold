// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import {ReportView} from '@/components/report-view';
import {createMockReport} from '@/lib/ai/mock-report';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn(),push:vi.fn()})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('allows separate feedback on the original and revised CV',async()=>{
 const fetch=vi.fn<typeof globalThis.fetch>().mockResolvedValue({ok:true,json:async()=>({ok:true,sent:true})} as Response);vi.stubGlobal('fetch',fetch);
 const report=createMockReport();const view=render(<ReportView paid mockMode locale='pl' data={report} feedbackVersion={0}/>);
 fireEvent.click(screen.getByRole('button',{name:'Wyślij feedback'}));await waitFor(()=>expect(screen.getByText(/Dziękujemy/)).toBeTruthy());
 view.rerender(<ReportView paid mockMode locale='pl' data={report} feedbackVersion={1}/>);
 expect(screen.getByRole('button',{name:'Wyślij feedback'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Wyślij feedback'}));
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));expect(JSON.parse(fetch.mock.calls[0][1]!.body as string).version).toBe(0);expect(JSON.parse(fetch.mock.calls[1][1]!.body as string).version).toBe(1);
});
