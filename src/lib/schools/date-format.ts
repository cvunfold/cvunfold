// School dates use the same zone during server rendering and in the browser.
const options = { timeZone: "Europe/Warsaw" };
export function schoolDate(value: string): string {
  return new Date(value).toLocaleDateString("pl-PL", options);
}
export function schoolDateTime(value: string): string {
  return new Date(value).toLocaleString("pl-PL", options);
}
export function schoolTime(value: number): string {
  return new Date(value).toLocaleTimeString("pl-PL", { ...options, hour: "2-digit", minute: "2-digit" });
}
