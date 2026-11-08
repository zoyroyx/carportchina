import { describe, it, expect } from "vitest";
import { render } from "../apps/web/entry-server";
import { staticPages, services } from "../apps/web/content";
describe("Серверный HTML", () => {
  for (const url of [
    ...Object.keys(staticPages),
    ...services.map((s) => `/services/${s.slug}/`),
  ])
    it(`контент без JS: ${url}`, () => {
      const result = render({ url, offers: [], now: 0 });
      expect(result.status).toBe(200);
      expect(result.html).toContain("<h1>");
      expect(result.html).not.toContain("undefined");
    });
  it("неизвестная страница отдаёт 404", () =>
    expect(render({ url: "/missing/", offers: [], now: 0 }).status).toBe(404));
  it("не отражает HTML из URL", () =>
    expect(
      render({
        url: "/?q=%3Cscript%3Ealert(1)%3C/script%3E",
        offers: [],
        now: 0,
      }).html,
    ).not.toContain("<script>alert"));
});
