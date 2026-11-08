import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync } from "node:fs";
import { PromoBanners, promos } from "../apps/web/PromoBanners";
import { FerrariPage } from "../apps/web/FerrariPage";
import { ferrariConfigurator, ferrariPath, ferrariPhotos } from "../apps/web/ferrari-content";
import { buildSeo, sitemap } from "../apps/server/seo";
import { titleFor } from "../apps/web/content";

describe("promotions and Ferrari allocation", () => {
  it("starts with Ferrari and keeps other slides out of keyboard navigation", () => {
    const html = renderToStaticMarkup(<PromoBanners />);
    expect(promos[0].id).toBe("ferrari");
    expect(html.match(/inert=""/g)).toHaveLength(2);
    expect(html).toContain(ferrariPath);
    for (const promo of promos) {
      for (const width of [960, 1920]) expect(existsSync(`public/photos/promos/${promo.image}-${width}.webp`)).toBe(true);
      for (const link of promo.links) expect(titleFor(link.href)).toBeTruthy();
    }
  });
  it("keeps the supplied configurator configuration and all nine photos", () => {
    const url = new URL(ferrariConfigurator);
    expect(url.hostname).toBe("carconfigurator.ferrari.com");
    expect(url.searchParams.get("configuration")).toBe("3ef7243e89f694de3912a23f1d5cbdb5033b7f7893d20067b23da74daa86b281");
    expect(ferrariPhotos).toHaveLength(9);
    for (const photo of ferrariPhotos) for (const width of [320, 1200]) expect(existsSync(`public/photos/ferrari/photo-${photo.id}-${width}.webp`)).toBe(true);
  });
  it("has a dedicated lead form and no discarded competitor wording", () => {
    const html = renderToStaticMarkup(<FerrariPage />);
    expect(html).toContain('id="ferrari-request"');
    expect(html).toContain('maxLength="2000"');
    expect(html).toContain('type="url"');
    expect(html).toContain('летом 2027');
    expect(html).not.toMatch(/двух компаний|по информации|модель.*уточняется/i);
    expect(html.match(/<h1>/g)).toHaveLength(1);
  });
  it("indexes the landing with a unique canonical and no invented price or videos", () => {
    const props = { url: ferrariPath, offers: [], now: Date.now() };
    const seo = buildSeo(props, true);
    expect(seo.indexable).toBe(true);
    expect(seo.canonical).toBe(`https://carportchina.ru${ferrariPath}`);
    expect(seo.head).toContain('ferrari-849-1920.webp');
    expect(sitemap(props)).toContain(ferrariPath);
    expect(seo.graph.some(node => node["@type"] === "Offer" || node["@type"] === "VideoObject")).toBe(false);
  });
});
