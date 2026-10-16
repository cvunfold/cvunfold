// @vitest-environment jsdom
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {SchoolPanelScene} from "@/components/schools/school-panel-scene";
let observers: Array<(entries: {isIntersecting:boolean}[])=>void> = [];
function setup(reduced=false){
 vi.useFakeTimers();
 vi.stubGlobal('matchMedia',vi.fn(()=>({matches:reduced,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 vi.spyOn(document,'hidden','get').mockReturnValue(false);
 vi.stubGlobal('IntersectionObserver',class{
  constructor(private callback:(entries:{isIntersecting:boolean}[])=>void){observers.push(callback)}
  observe(){this.callback([{isIntersecting:true}])}
  disconnect(){}
 });
 return render(<SchoolPanelScene/>);
}
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();observers=[]});
it('advances through the students and then changes to the AI group',()=>{
 const {container}=setup();
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Karolina');
 act(()=>vi.advanceTimersByTime(5000));
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Bartek');
 expect(container.querySelector('.school-scene-finding')?.textContent).toContain('Nie opisano sprawdzenia projektu');
 act(()=>vi.advanceTimersByTime(5000));
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Emilia');
 act(()=>vi.advanceTimersByTime(5000));
 expect(screen.getByRole('heading',{name:'AI i automatyzacje'})).toBeTruthy();
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Natalia');
 expect(container.querySelector('.school-scene-role')?.textContent).toBe('AI / LLM Engineer');
 expect(container.querySelector('.school-scene-timeline')).toBeNull();
});
it('pauses after manual selection and resumes only when requested',()=>{
 const {container}=setup();
 fireEvent.click(screen.getByRole('button',{name:'AI'}));
 fireEvent.click(screen.getByRole('button',{name:/Jakub/}));
 expect(container.querySelector('.school-scene-role')?.textContent).toBe('AI Automation Specialist');
 act(()=>vi.advanceTimersByTime(15000));
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Jakub');
 fireEvent.click(screen.getByRole('button',{name:'Wznów animację'}));
 act(()=>vi.advanceTimersByTime(5000));
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Sara');
});
it('keeps reduced-motion mode static while allowing group selection',()=>{
 const {container}=setup(true);
 act(()=>vi.advanceTimersByTime(30000));
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Karolina');
 expect(screen.queryByRole('button',{name:'Wstrzymaj animację'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'AI'}));
 expect(screen.getByRole('heading',{name:'AI i automatyzacje'})).toBeTruthy();
});
it('does not advance when the scene is outside the viewport',()=>{
 const {container}=setup();
 act(()=>observers.forEach(callback=>callback([{isIntersecting:false}])));
 act(()=>vi.advanceTimersByTime(10000));
 expect(container.querySelector('.school-scene-row.highlighted')?.textContent).toContain('Karolina');
});
