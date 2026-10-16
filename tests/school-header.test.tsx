// @vitest-environment jsdom
import {afterEach,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {SchoolHeader} from "@/components/schools/school-header";
afterEach(cleanup);
it("marks the demo and preserves a primary panel entry",()=>{
 render(<SchoolHeader demo/>);
 expect(screen.getByRole('link',{name:'Demo'}).getAttribute('aria-current')).toBe('page');
 const panel=screen.getByRole('link',{name:'Panel szkoły'});
 expect(panel.getAttribute('href')).toBe('/dla-szkol/panel');
 expect(panel.classList.contains('button-primary')).toBe(true);
 expect(screen.queryByRole('button',{name:'Wyloguj się'})).toBeNull();
});
it("retains logout and prevents repeated actions while the panel is busy",()=>{
 const logout=vi.fn();const {rerender}=render(<SchoolHeader panelActive onLogout={logout}/>);
 fireEvent.click(screen.getByRole('button',{name:'Wyloguj się'}));
 expect(logout).toHaveBeenCalledTimes(1);
 rerender(<SchoolHeader panelActive busy onLogout={logout}/>);
 fireEvent.click(screen.getByRole('button',{name:'Wyloguj się'}));
 expect(logout).toHaveBeenCalledTimes(1);
 expect(screen.getByRole('link',{name:'Panel szkoły'}).getAttribute('aria-current')).toBe('page');
});
