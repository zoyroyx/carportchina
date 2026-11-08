import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { App, type AppProps } from "../apps/web/App";
import { pageProps } from "../apps/server/page-props";
import { buildSeo, llmsTxt } from "../apps/server/seo";
import { PromoBanners } from "../apps/web/PromoBanners";
import { HeroSlideshow } from "../apps/web/HeroSlideshow";
import records from "../data/offers.json";
import company from "../data/company.json";
import type { Offer } from "../packages/contracts/offers";

const common = { offers: records as Offer[], company, now: Date.parse("2026-11-08") };
describe("SEO and first-screen payload", () => {
  it("reduces hydration data without changing visible HTML or SEO", () => {
    for (const url of ["/", "/cars/", `/cars/${records[0].slug}/`, "/reviews/", "/contacts/", "/services/parts/", "/privacy/"]) {
      const full: AppProps = { ...common, url };
      const compact = pageProps(full);
      expect(renderToStaticMarkup(createElement(App, compact))).toBe(renderToStaticMarkup(createElement(App, full)));
      expect(buildSeo(compact, true)).toEqual(buildSeo(full, true));
      if (url === "/cars/") expect(compact.offers).toHaveLength(records.length);
      else expect(compact.offers.length).toBeLessThan(records.length);
    }
  });
  it("keeps only initially visible slide images in server HTML", () => {
    expect(renderToStaticMarkup(createElement(PromoBanners)).match(/<img /g)).toHaveLength(1);
    expect(renderToStaticMarkup(createElement(HeroSlideshow)).match(/<img /g)).toHaveLength(3);
  });
  it("links company identity and exposes a useful LLM guide without invented prices", () => {
    const props = { ...common, url: "/contacts/" };
    expect(buildSeo(props, true).graph.find(n => n["@type"] === "Organization")).toMatchObject({ taxID: "9717149586", address: { "@type": "PostalAddress", addressLocality: "Москва" } });
    const guide = llmsTxt(props);
    expect(guide).toContain("https://carportchina.ru/reviews/");
    expect(guide).toContain(`/cars/${records[0].slug}/`);
    expect(guide).not.toContain("₽");
  });
});
