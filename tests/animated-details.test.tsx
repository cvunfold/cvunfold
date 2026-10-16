// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AnimatedDetails } from "@/components/animated-details";
afterEach(cleanup);
it("toggles native open state and accessible expanded state without browser animation support", () => {
  const {container} = render(<AnimatedDetails><summary>Historia</summary><button>Treść</button></AnimatedDetails>);
  const details=container.querySelector('details')!;
  const summary=screen.getByText('Historia');
  expect(details.open).toBe(false);
  fireEvent.click(summary);
  expect(details.open).toBe(true);
  expect(summary.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(summary);
  expect(details.open).toBe(false);
  expect(summary.getAttribute('aria-expanded')).toBe('false');
});
it("respects initial open and an explicit changed open prop", () => {
  const {container,rerender}=render(<AnimatedDetails open><summary>Historia</summary><p>Treść</p></AnimatedDetails>);
  expect(container.querySelector('details')!.open).toBe(true);
  rerender(<AnimatedDetails open={false}><summary>Historia</summary><p>Treść</p></AnimatedDetails>);
  expect(container.querySelector('details')!.open).toBe(false);
});
it("honors a summary handler that cancels the toggle", () => {
  const {container}=render(<AnimatedDetails><summary onClick={e=>e.preventDefault()}>Historia</summary><p>Treść</p></AnimatedDetails>);
  fireEvent.click(screen.getByText('Historia'));
  expect(container.querySelector('details')!.open).toBe(false);
});
