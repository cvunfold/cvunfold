// @vitest-environment jsdom
import {afterEach,expect,it} from "vitest";
import {cleanup,render,screen} from "@testing-library/react";
import SchoolDemoPage from "@/app/dla-szkol/demo/page";
import {schoolGuidedIterationsData} from "@/lib/schools/demo";
afterEach(cleanup);
it("exposes only the current ten-person group on the public demo page",()=>{
  const data=schoolGuidedIterationsData();
  expect(data.groups.map(group=>group.id)).toEqual(["demo-guided-iterations"]);
  render(<SchoolDemoPage/>);
  expect(document.querySelectorAll('.school-student')).toHaveLength(10);
  expect(screen.getByRole('combobox',{name:'Grupa'}).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByRole('button',{name:'Zobacz archiwalne CV'})).toBeNull();
  expect(screen.queryByRole('button',{name:'Zobacz iterację Anny'})).toBeNull();
  expect(screen.queryByRole('button',{name:'Zobacz poprawki grupy'})).toBeNull();
});
