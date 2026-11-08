import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { buildSeo, sitemap, SITE_ORIGIN } from "../apps/server/seo";
import { render } from "../apps/web/entry-server";
import { clientReviews } from "../apps/web/reviews";
import { staticPages, services } from "../apps/web/content";
import records from "../data/offers.json";
import type { Offer } from "../packages/contracts/offers";
import type { AppProps } from "../apps/web/App";

const props: AppProps = { url: "/reviews/", offers: records as Offer[], now: Date.parse("2026-11-08"), company: { contacts: null, stories: [] } };

describe("Reviews share the site's structured-data graph", () => {
  it("has one collection, one breadcrumb trail and a connected list of two videos", () => {
    const seo = buildSeo(props, true);
    expect(seo.canonical).toBe(`${SITE_ORIGIN}/reviews/`);
    expect(seo.indexable).toBe(true);
    expect(seo.head.match(/application\/ld\+json/g)).toHaveLength(1);
    expect(seo.graph.filter(n => n["@type"] === "CollectionPage")).toHaveLength(1);
    expect(seo.graph.filter(n => n["@type"] === "BreadcrumbList")).toHaveLength(1);
    expect(seo.graph.find(n => n["@type"] === "CollectionPage")).toMatchObject({
      mainEntity: { "@id": `${SITE_ORIGIN}/reviews/#videos` },
      breadcrumb: { "@id": `${SITE_ORIGIN}/reviews/#breadcrumbs` },
      isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    });
    expect(seo.graph.find(n => n["@type"] === "ItemList")).toMatchObject({
      numberOfItems: 2,
      itemListElement: clientReviews.map((review, index) => ({ position: index + 1, item: { "@id": `${SITE_ORIGIN}/reviews/#${review.id}` } })),
    });
  });

  it("describes playable videos on reviews and only links to them from home", () => {
    const sourceManifest = JSON.parse(readFileSync("output/reviews-2026-11-07/edit-manifest.json", "utf8")) as { duration: number }[];
    for (const url of ["/reviews/"]) {
      const data = { ...props, url };
      const videos = buildSeo(data, true).graph.filter(n => n["@type"] === "VideoObject");
      const html = render(data).html;
      expect(videos).toHaveLength(2);
      clientReviews.forEach((review, index) => {
        expect(videos[index]).toMatchObject({
          "@id": `${SITE_ORIGIN}/reviews/#${review.id}`,
          name: review.title, description: review.description,
          thumbnailUrl: [`${SITE_ORIGIN}${review.poster}`],
          contentUrl: `${SITE_ORIGIN}${review.src}`,
          uploadDate: "2026-11-08T15:56:17+03:00", duration: review.duration,
          publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        });
        expect(videos[index].embedUrl).toBeUndefined();
        expect(videos[index].interactionStatistic).toBeUndefined();
        expect(existsSync(`public${review.src}`)).toBe(true);
        expect(existsSync(`public${review.poster}`)).toBe(true);
        expect(Math.abs(Number(review.duration.slice(2, -1)) - sourceManifest[index].duration)).toBeLessThan(.001);
        for (const value of [review.title, review.description, review.src, review.poster, `id="${review.id}"`]) expect(html).toContain(value);
      });
    }
    const home = { ...props, url: "/?utm_source=test" };
    expect(buildSeo(home, true).graph.some(n => n["@type"] === "VideoObject")).toBe(false);
    const homeHtml = render(home).html;
    expect(homeHtml).not.toContain("<video");
    clientReviews.forEach(review => {
      expect(homeHtml).toContain(`href="/reviews/#${review.id}"`);
      expect(homeHtml).toContain(review.poster);
      expect(homeHtml).not.toContain(review.src);
    });
  });

  it("keeps IDs unique and all internal references resolvable across every route", () => {
    const routes = [...Object.keys(staticPages), ...services.map(s => `/services/${s.slug}/`), ...props.offers.map(o => `/cars/${o.slug}/`)];
    for (const url of routes) {
      const { graph, head } = buildSeo({ ...props, url }, true);
      const ids = new Set(graph.map(n => n["@id"]));
      expect(ids.size, url).toBe(graph.length);
      expect(graph.filter(n => n["@type"] === "Organization"), url).toHaveLength(1);
      expect(graph.filter(n => n["@type"] === "WebSite"), url).toHaveLength(1);
      const visit = (value: unknown) => {
        if (Array.isArray(value)) return value.forEach(visit);
        if (!value || typeof value !== "object") return;
        const obj = value as Record<string, unknown>;
        if (obj["@id"]) expect(ids.has(obj["@id"]), `${url}: ${obj["@id"]}`).toBe(true);
        Object.values(obj).forEach(visit);
      };
      visit(graph);
      expect(head).not.toMatch(/"(?:Review|AggregateRating|ratingValue)"/);
      if (url !== "/reviews/") expect(graph.some(n => n["@type"] === "VideoObject")).toBe(false);
      const json = head.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1];
      expect(JSON.parse(json)["@graph"]).toEqual(JSON.parse(JSON.stringify(graph)));
    }
  });

  it("keeps preview blocked, strips tracking and excludes the redirected page from sitemap", () => {
    expect(buildSeo(props).robots).toBe("noindex, nofollow");
    expect(buildSeo({ ...props, url: "/reviews/?utm_source=test" }, true).canonical).toBe(`${SITE_ORIGIN}/reviews/`);
    expect(sitemap(props)).toContain(`${SITE_ORIGIN}/reviews/`);
    expect(sitemap(props)).not.toContain(`${SITE_ORIGIN}/deliveries/`);
  });
});
