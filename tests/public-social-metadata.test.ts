import { describe, it, expect, vi, afterEach } from "vitest";
import { resolvePublicSiteUrl } from "@/lib/public-site-url";
import { publicSocialMetadata } from "@/lib/public-page-metadata";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });
describe("public deployment metadata", () => {
  it("defaults to the public domain independently of a local callback URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3108");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.resetModules();
    expect((await import("@/lib/brand")).brand.siteUrl).toBe("https://cvunfold.com");
    expect(resolvePublicSiteUrl(" https://cvunfold.com/ ")).toBe("https://cvunfold.com");
  });
  it.each(["http://cvunfold.com", "https://localhost", "https://127.0.0.1", "https://[::1]", "https://test.local", "https://cvunfold.com:3108", "https://user:pass@cvunfold.com", "https://cvunfold.com/path", "https://cvunfold.com?q=1", "https://cvunfold.com#fragment"])("rejects an unsafe public origin: %s", value => {
    expect(() => resolvePublicSiteUrl(value)).toThrow("PUBLIC_SITE_URL_INVALID");
  });
  it.each([
    ["pl", "/przykladowy-raport", "/opengraph-image"],
    ["en", "/en/sample-report", "/en/opengraph-image"],
    ["pl", "/dla-szkol", "/dla-szkol/opengraph-image"],
    ["en", "/en/for-schools", "/en/for-schools/opengraph-image"],
  ] as const)("provides images for Open Graph and Twitter on %s %s", (locale, path, image) => {
    const metadata = publicSocialMetadata(locale, { title: "Title", description: "Description", path });
    expect(metadata.openGraph).toMatchObject({ images: [{ url: image, width: 1200, height: 630 }] });
    expect(metadata.twitter).toMatchObject({ images: [{ url: image }], card: "summary_large_image" });
  });
});
