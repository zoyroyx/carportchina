import { describe, it, expect } from "vitest";
import { buildSeo, robotsTxt, sitemap, SITE_ORIGIN } from "../apps/server/seo";
import { staticPages, services } from "../apps/web/content";
import records from "../data/offers.json";
import fixtures from "./fixtures/offers.json";
import company from "../data/company.json";
import type { Offer } from "../packages/contracts/offers";
import type { AppProps } from "../apps/web/App";
const props: AppProps = {
  url: "/",
  offers: records as Offer[],
  now: Date.parse("2026-11-03"),
  company: { contacts: null, stories: [] },
};
describe("SEO under carportchina.ru", () => {
  it("publishes consistent customer contacts and separates the office from the legal address on every route", () => {
    const paths = [...Object.keys(staticPages), ...services.map(s => `/services/${s.slug}/`), ...props.offers.map(o => `/cars/${o.slug}/`)];
    for (const url of paths) {
      const graph = buildSeo({ ...props, company, url }, true).graph;
      const organizations = graph.filter(n => n["@type"] === "Organization");
      expect(organizations).toHaveLength(1);
      expect(organizations[0]).toMatchObject({
        telephone: company.contacts.phone,
        email: company.contacts.email,
        sameAs: [company.contacts.telegramGroup],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: company.contacts.phone,
          email: company.contacts.email,
          url: company.contacts.messenger,
        },
        location: { "@type": "Place", address: company.contacts.officeAddress, description: company.contacts.officeDirections },
        address: { "@type": "PostalAddress", postalCode: "111024", streetAddress: "ул. Авиамоторная, д. 50, стр. 2, помещ. 49/2" },
      });
    }
    const updated = { ...company, contacts: { ...company.contacts, phone: "+79990000000", messenger: "https://t.me/example" } };
    const updatedOrg = buildSeo({ ...props, company: updated }, true).graph.find(n => n["@type"] === "Organization");
    expect(updatedOrg).toMatchObject({ telephone: updated.contacts.phone, contactPoint: { telephone: updated.contacts.phone, url: updated.contacts.messenger } });
  });
  it("keeps preview blocked independently of production build", () => {
    expect(buildSeo(props).robots).toBe("noindex, nofollow");
    expect(robotsTxt(false)).toContain("Disallow: /\n");
    expect(buildSeo(props, true).robots).toContain("index, follow");
    expect(robotsTxt(true)).toContain(SITE_ORIGIN + "/sitemap.xml");
  });
  it("has unique title and description on every known route", () => {
    const paths = [
      ...Object.keys(staticPages),
      ...services.map((s) => `/services/${s.slug}/`),
      ...props.offers.map((o) => `/cars/${o.slug}/`),
    ];
    const seo = paths.map((url) => buildSeo({ ...props, url }, true));
    expect(new Set(seo.map((s) => s.title)).size).toBe(paths.length);
    expect(new Set(seo.map((s) => s.description)).size).toBe(paths.length);
    for (const s of seo) {
      expect(s.canonical).toMatch(/^https:\/\/carportchina\.ru\//);
      expect(s.head).toContain("application/ld+json");
    }
  });
  it("canonicalizes filters and tracking; filters are not indexed", () => {
    const seo = buildSeo(
      { ...props, url: "/cars/?brand=Geely&utm_source=mail" },
      true,
    );
    expect(seo.robots).toBe("noindex, follow");
    expect(seo.canonical).toBe(SITE_ORIGIN + "/cars/");
    expect(
      seo.graph.find((n) => n["@type"] === "ItemList")?.numberOfItems,
    ).toBe(2);
    expect(
      buildSeo({ ...props, url: "/?utm_source=mail" }, true).indexable,
    ).toBe(true);
  });
  it("excludes placeholders, filtered URLs and unknown paths from sitemap", () => {
    const xml = sitemap(props);
    for (const path of [
      "/privacy/",
      "/consent/",
      "/contacts/",
      "/deliveries/",
    ]) {
      expect(xml).not.toContain(SITE_ORIGIN + path);
      expect(buildSeo({ ...props, url: path }, true).robots).toBe(
        "noindex, follow",
      );
    }
    expect(xml).not.toMatch(/<loc>[^<]*\?/);
    expect(xml).toContain("/cars/changan-qiyuan-a06-2026/");
    const missing = buildSeo({ ...props, url: "/missing/" }, true);
    expect(missing.canonical).toBeUndefined();
    expect(missing.graph).toHaveLength(0);
    expect(missing.robots).toBe("noindex, follow");
  });
  it("does not fabricate offers, ratings, or business contacts", () => {
    for (const o of props.offers) {
      const graph = buildSeo({ ...props, url: `/cars/${o.slug}/` }, true).graph;
      const car = graph.find((n) => n["@type"] === "Car")!;
      expect(car.offers).toBeUndefined();
      expect(car.aggregateRating).toBeUndefined();
      expect(
        graph.find((n) => n["@type"] === "Organization")?.telephone,
      ).toBeUndefined();
    }
  });
  it("publishes only a current confirmed fixed price, never expired or estimated", () => {
    const o = fixtures[0] as Offer;
    const get = (offer: Offer) =>
      buildSeo(
        { ...props, offers: [offer], url: "/cars/qa-vehicle/" },
        true,
      ).graph.find((n) => n["@type"] === "Car")!;
    expect(get(o).offers).toMatchObject({
      price: "4500000.00",
      priceCurrency: "RUB",
    });
    expect(get({ ...o, validUntil: "2020-01-01" }).offers).toBeUndefined();
    expect(
      get({ ...o, priceKind: "estimate_total", estimateBasis: "Расчёт" })
        .offers,
    ).toBeUndefined();
  });
  it("escapes markup and script termination in content", () => {
    const o = {
      ...props.offers[0],
      title: "</script><script>alert(1)</script>",
    };
    const seo = buildSeo(
      { ...props, offers: [o], url: `/cars/${o.slug}/` },
      true,
    );
    expect(seo.head).not.toContain("<script>alert(1)");
    expect(seo.head).toContain("\\u003c/script>");
    expect(seo.head).toContain("&lt;/script&gt;");
  });
});

