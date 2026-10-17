import { afterEach, describe, expect, it, vi } from "vitest";
import config from "../next.config";
import { schoolsPath } from "@/lib/i18n";
import { schoolSiteOrigin } from "@/lib/schools/urls";
import { publicSocialMetadata } from "@/lib/public-page-metadata";
import robots from "@/app/dla-szkol/robots";
import sitemap from "@/app/dla-szkol/sitemap";
import mainSitemap from "@/app/sitemap";
afterEach(() => { vi.unstubAllEnvs(); });
describe("schools subdomain deployment configuration", () => {
  it("keeps the current local and preview routes until explicitly configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SCHOOLS_URL", ""); expect(schoolsPath("pl")).toBe("/dla-szkol"); expect(await config.rewrites!()).toEqual([]);
  });
  it("routes the school host before the consumer homepage without touching API routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_SCHOOLS_URL", "https://szkoly.cvunfold.com");
    const rewrites = await config.rewrites!(); expect(rewrites).toMatchObject({ beforeFiles: expect.arrayContaining([{ source: "/", has: [{ type: "host", value: "szkoly.cvunfold.com" }], destination: "/dla-szkol" }]) });
    expect(JSON.stringify(rewrites)).not.toContain('/api/'); expect(schoolsPath("pl")).toBe("https://szkoly.cvunfold.com/");
    expect(schoolsPath("en")).toBe("https://szkoly.cvunfold.com/en/for-schools");
    expect((await config.redirects!()).some(r => r.source === "/dla-szkol" && r.destination === "https://szkoly.cvunfold.com/")).toBe(true);
  });
  it("publishes school-only canonical links, share images and sitemap; protects private paths", () => {
    vi.stubEnv("NEXT_PUBLIC_SCHOOLS_URL", "https://szkoly.cvunfold.com");
    const metadata = publicSocialMetadata("pl", { title: "School", description: "School offer", path: "/dla-szkol" });
    expect(metadata.openGraph).toMatchObject({ url: "https://szkoly.cvunfold.com/", images: [{ url: "https://szkoly.cvunfold.com/dla-szkol/opengraph-image" }] });
    expect(sitemap().map(r => r.url)).toEqual([schoolsPath("pl"),schoolsPath("en")]);
    expect(mainSitemap().some(row => row.url.includes("szkoly.cvunfold.com") || row.url.endsWith("/dla-szkol") || row.url.endsWith("/en/for-schools"))).toBe(false);
    expect(robots()).toMatchObject({ host: "https://szkoly.cvunfold.com", sitemap: "https://szkoly.cvunfold.com/sitemap.xml", rules: { disallow: expect.arrayContaining(["/api/", "/dla-szkol/panel", "/dla-szkol/potwierdz", "/dla-szkol/demo"]) } });
  });
  it("rejects an unrelated domain or URL containing credentials", () => {
    expect(() => schoolSiteOrigin("https://other.example")).toThrow(); expect(() => schoolSiteOrigin("https://user:pass@szkoly.cvunfold.com")).toThrow();
  });
});
