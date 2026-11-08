import { describe, expect, it } from "vitest";
import { buildSeo, llmsTxt, llmsFullTxt, SITE_ORIGIN } from "../apps/server/seo";
import { services } from "../apps/web/content";
import { clientReviews, deliveryPhotos } from "../apps/web/reviews";
import { legalOperator } from "../apps/web/legal-content";
import { visibleOffers, type Offer } from "../packages/contracts/offers";
import offers from "../data/offers.json";
import company from "../data/company.json";

const props = { url: "/", offers: offers as Offer[], company, now: Date.parse("2026-11-08T20:00:00Z") };

describe("AI-readable public content", () => {
  it("keeps company, reviews and service answers consistent with visible content", () => {
    const full = llmsFullTxt(props);
    for (const value of [legalOperator.name, legalOperator.email, legalOperator.address, legalOperator.inn]) expect(full).toContain(value);
    for (const review of clientReviews) expect(full).toContain(review.description);
    for (const photo of deliveryPhotos) expect(full).toContain(photo.title);
    for (const service of services) {
      expect(full).toContain(service.intro);
      for (const [question, answer] of service.questions) {
        expect(full).toContain(question);
        expect(full).toContain(answer);
      }
    }
  });

  it("publishes only eligible offers without private import metadata", () => {
    const extra = ["draft", "archived"].map(publication => ({ ...offers[0], publication, slug: `secret-${publication}`, title: `PRIVATE-${publication}` } as Offer));
    const mixed = { ...props, offers: [...props.offers, ...extra] };
    for (const guide of [llmsTxt(mixed), llmsFullTxt(mixed)]) {
      expect(guide).not.toContain("PRIVATE-");
      expect(guide).not.toContain("secret-");
      for (const offer of visibleOffers(props.offers)) expect(guide).toContain(`${SITE_ORIGIN}/cars/${offer.slug}/`);
    }
  });

  it("connects the public HTML and both guides without adding a 404 or preview discovery link", () => {
    expect(llmsTxt(props)).toContain(`${SITE_ORIGIN}/llms-full.txt`);
    expect(llmsFullTxt(props)).toContain(`${SITE_ORIGIN}/llms.txt`);
    expect(buildSeo(props, true).head).toContain('rel="describedby"');
    expect(buildSeo(props, false).head).not.toContain('rel="describedby"');
    expect(buildSeo({ ...props, url: "/missing/" }, true).head).not.toContain('rel="describedby"');
  });
});
