import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Value } from "@sinclair/typebox/value";
import { Request } from "../apps/web/Request";
import { CompanySchema } from "../packages/contracts/company";
import { buildSeo } from "../apps/server/seo";
import company from "../data/company.json";

describe("live requests", () => {
  it("requires contact and explicit consent without sending during SSR", () => {
    const html = renderToStaticMarkup(<Request type="parts" country="Беларусь" />);
    expect(html).toContain('name="contact"');
    expect(html).toMatch(/<input(?=[^>]*type="checkbox")(?=[^>]*name="consent")(?=[^>]*required)[^>]*>/);
    expect(html).not.toContain('checked=""');
    expect(html).toContain('value="Беларусь"');
    expect(html).toContain('Отправить заявку');
    expect(html).toContain('mailto:corp@carportchina.ru');
    expect(html).not.toContain('Предпросмотр формы');
  });
  it("accepts a verified email without inventing a phone or legal identity", () => {
    expect(Value.Check(CompanySchema, company)).toBe(true);
    expect(Value.Check(CompanySchema, { contacts: { email: "invalid" }, stories: [] })).toBe(false);
  });
  it("publishes the contact email once in the existing Organization graph", () => {
    const seo = buildSeo({ url: "/contacts/", offers: [], now: Date.now(), company }, true);
    const orgs = seo.graph.filter(node => node["@type"] === "Organization");
    expect(orgs).toHaveLength(1);
    expect(orgs[0]?.email).toBe("corp@carportchina.ru");
    expect(orgs[0]?.telephone).toBeUndefined();
    expect(seo.indexable).toBe(true);
  });
});
