import { describe, it, expect } from "vitest";
import {
  counts,
  visibleOffers,
  publicationIssues,
  priceLabel,
  type Offer,
} from "../packages/contracts/offers";
const now = Date.parse("2026-10-30T12:00:00Z");
const offer: Offer = {
  id: "test",
  slug: "test",
  title: "Тест, не для публикации",
  publication: "published",
  registrationMarket: "RF",
  priceKind: "fixed_total",
  amountMinor: "450000000",
  currency: "RUB",
  validUntil: "2026-11-01T00:00:00Z",
  fullCostsConfirmed: true,
  termsApproved: true,
  estimateBasis: null,
  vatConfirmed: false,
  image: null,
  brand: "Test",
};
describe("Защита достоверности предложения", () => {
  it("не отдаёт черновики, архив и предложения для другого рынка", () =>
    expect(
      visibleOffers([
        { ...offer, publication: "draft" },
        { ...offer, publication: "archived" },
        { ...offer, registrationMarket: "BY" },
      ]),
    ).toEqual([]));
  it("не показывает неполный итог", () =>
    expect(visibleOffers([{ ...offer, fullCostsConfirmed: false }])).toEqual(
      [],
    ));
  it("требует основания для ориентировочной цены", () =>
    expect(
      publicationIssues({ ...offer, priceKind: "estimate_total" }),
    ).toContain("ESTIMATE_BASIS_REQUIRED"));
  it("скрывает сумму с истёкшей актуальностью", () =>
    expect(
      priceLabel({ ...offer, validUntil: "2026-10-29T00:00:00Z" }, now),
    ).toBe("Стоимость уточняется"));
  it("считает единый каталог без черновиков и архивных автомобилей", () =>
    expect(
      counts([
        offer,
        { ...offer, publication: "archived" },
        { ...offer, publication: "draft" },
      ]),
    ).toEqual({ total: 1 }));
  it("не маскирует неизвестную стоимость нулём", () =>
    expect(
      publicationIssues({
        ...offer,
        priceKind: "on_request",
        amountMinor: "0",
      }),
    ).toContain("REQUEST_PRICE_MUST_BE_NULL"));
  it("сохраняет точность суммы выше Number.MAX_SAFE_INTEGER", () =>
    expect(
      priceLabel({ ...offer, amountMinor: "900719925474099312" }, now),
    ).toContain(",12 ₽"));
});
