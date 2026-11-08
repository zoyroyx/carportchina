import { it, expect } from "vitest";
import { render } from "../apps/web/entry-server";
import { filterOffers, counts, type Offer } from "../packages/contracts/offers";
const now = Date.parse("2026-10-31T00:00:00Z");
const offer: Offer = {
  id: "fixture",
  slug: "fixture",
  title: "Тестовый автомобиль",
  publication: "published",
  registrationMarket: "RF",
  priceKind: "on_request",
  amountMinor: null,
  currency: "RUB",
  validUntil: null,
  fullCostsConfirmed: false,
  termsApproved: false,
  estimateBasis: null,
  vatConfirmed: true,
  image: null,
  brand: "Fixture",
};
it("единый каталог сохраняет фильтры марки и НДС и скрывает архив", () => {
  const offers = [
    offer,
    { ...offer, id: "second", brand: "Other", vatConfirmed: false },
    { ...offer, publication: "archived" as const },
    { ...offer, publication: "draft" as const },
  ];
  expect(filterOffers(offers)).toHaveLength(counts(offers).total);
  expect(filterOffers(offers, "Fixture", true)).toEqual([offer]);
  expect(filterOffers(offers, "Other", true)).toEqual([]);
});
it("старые параметры статуса не разбивают каталог при рендере", () => {
  const offers = [offer];
  for (const status of ["in_stock", "in_transit", "on_order"]) {
    const html = render({ url: `/cars/?status=${status}`, offers, now }).html;
    expect(html).toContain(offer.title);
    expect(html).not.toContain('name="status"');
  }
});
it.each(["/", "/cars/", "/business/", "/services/", "/about/", "/contacts/"])(
  "единый каталог без устаревших маршрутов: %s",
  (url) => {
    const html = render({ url, offers: [], now }).html;
    expect(html).not.toMatch(
      /status=in_|href="\/order\//,
    );
    expect(html).toContain('href="/cars/');
  },
);
it("не смешивает запросы по гарантии и подбору автомобиля", () => {
  const html = render({
    url: "/services/service-warranty/",
    offers: [],
    now,
  }).html;
  expect(html).toContain("Когда возникла проблема");
  expect(html).not.toContain("Что стоит учесть при подборе");
});
