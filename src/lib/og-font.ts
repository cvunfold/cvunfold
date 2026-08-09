import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ogFont = readFile(join(process.cwd(), "src/assets/og-font.ttf")).then((buffer) =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
);

export async function ogFonts() {
  const data = await ogFont;
  return [
    { name: "Gidole", data: data.slice(0), weight: 400 as const, style: "normal" as const },
    { name: "Gidole", data: data.slice(0), weight: 700 as const, style: "normal" as const },
  ];
}
