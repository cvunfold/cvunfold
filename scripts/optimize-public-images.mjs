import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const check = process.argv.includes("--check");
const manifest = {};
let beforeBytes = 0, afterBytes = 0, count = 0;

async function save(path, buffer) {
  const existing = await readFile(path).catch(error => { if (error.code === "ENOENT") return null; throw error; });
  if (existing?.equals(buffer)) return;
  if (check) throw new Error(`Optimized asset is missing or stale: ${path}. Run assets:optimize.`);
  await writeFile(path, buffer);
}

await mkdir("public/demo/schools/optimized", { recursive: true });
await mkdir("public/images/optimized", { recursive: true });
for (const name of (await readdir("public/demo/schools")).filter(name => name.endsWith(".png")).sort()) {
  const original = await readFile(`public/demo/schools/${name}`);
  const optimized = await sharp(original).webp({ lossless: true, effort: 6 }).toBuffer();
  const originalPixels = await sharp(original).ensureAlpha().raw().toBuffer();
  const optimizedPixels = await sharp(optimized).ensureAlpha().raw().toBuffer();
  if (!originalPixels.equals(optimizedPixels)) throw new Error(`CV preview pixels changed: ${name}`);
  const hash = createHash("sha256").update(optimized).digest("hex").slice(0, 12);
  const target = `/demo/schools/optimized/${name.replace(/\.png$/, "")}-${hash}.webp`;
  await save(`public${target}`, optimized);
  manifest[`/demo/schools/${name.replace(/\.png$/, ".pdf")}`] = target;
  beforeBytes += original.length; afterBytes += optimized.length; count++;
}
const manifestSource = "// Generated lossless previews of public fictional CVs. Hashed names are immutable.\nexport const SCHOOL_DEMO_PREVIEW_IMAGES: Record<string, string> = " + JSON.stringify(manifest, null, 2) + ";\n";
await save("src/lib/schools/demo-preview-images.ts", Buffer.from(manifestSource));

for (const [input, stem] of [["public/images/cv-story/natalia.png", "natalia"], ["public/images/pawel-maczka-czarnecki.png", "pawel-maczka-czarnecki"]]) {
  const original = await readFile(input);
  const optimized = await sharp(original).webp({ quality: 88, effort: 6 }).toBuffer();
  const hash = createHash("sha256").update(optimized).digest("hex").slice(0, 12);
  const target = `/images/optimized/${stem}-${hash}.webp`;
  await save(`public${target}`, optimized);
  const previous = new RegExp(`/images/optimized/${stem}-[a-f0-9]{12}\\.webp`, "g");
  for (const path of ["src/components/cv-product-preview.tsx", "src/components/cv-improvement-story.tsx", "src/components/landing-page.tsx", "src/components/methodology-page.tsx", "src/components/article-page.tsx"]) {
    const source = await readFile(path, "utf8");
    const updated = source.replace(previous, target).replaceAll(input.replace(/^public/, ""), target);
    if (source !== updated) {
      if (check) throw new Error(`Portrait reference is stale: ${path}. Run assets:optimize.`);
      await writeFile(path, updated);
    }
  }
}
// Keep the original URLs and earlier hashed assets available for existing links.
console.log(JSON.stringify({ check, cvPreviews: count, originalBytes: beforeBytes, optimizedBytes: afterBytes, cvPixelsIdentical: true }));
