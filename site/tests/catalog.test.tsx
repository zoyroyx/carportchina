import { describe, it, expect } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { render } from "../apps/web/entry-server";
import {
  OfferSchema,
  catalogQuery,
  offerForPath,
  imageSource,
  type Offer,
} from "../packages/contracts/offers";
import fixture from "./fixtures/offers.json";
const offers = fixture as Offer[];
const now = Date.parse("2026-11-01T00:00:00Z");
describe("Каталог и карточка", () => {
  it("валидирует новый контракт", () =>
    offers.forEach((o) => expect(Value.Check(OfferSchema, o)).toBe(true)));
  it("открывает опубликованную карточку с контекстом обращения", () => {
    const result = render({ url: "/cars/qa-vehicle/", offers, now });
    expect(result.status).toBe(200);
    expect(result.title).toBe(offers[0].title);
    expect(result.html).toContain("Тестовая комплектация");
    expect(result.html).toContain('name="Код предложения" value="qa-vehicle"');
    expect(result.html).toContain("Тестовая строка состава стоимости");
  });
  it("не раскрывает черновик, архив или неизвестный автомобиль", () => {
    for (const url of ["/cars/qa-draft/", "/cars/missing/"])
      expect(render({ url, offers, now }).status).toBe(404);
    expect(
      offerForPath(
        [{ ...offers[0], publication: "archived" }],
        "/cars/qa-vehicle/",
      ),
    ).toBeUndefined();
  });
  it("объединяет поиск, бюджет и НДС", () => {
    expect(
      catalogQuery(
        offers,
        new URLSearchParams("q=модель&budget=5000000&vat=true"),
        now,
      ),
    ).toEqual([offers[0]]);
    expect(
      catalogQuery(offers, new URLSearchParams("q=несуществующий"), now),
    ).toEqual([]);
  });
  it("не использует просроченную или неизвестную цену для бюджета", () => {
    expect(
      catalogQuery(
        [{ ...offers[0], validUntil: "2020-01-01" }],
        new URLSearchParams("budget=9000000"),
        now,
      ),
    ).toEqual([]);
  });
  it("сортирует цены и оставляет неизвестные в конце", () => {
    const unknown = {
      ...offers[0],
      id: "unknown",
      priceKind: "on_request",
      amountMinor: null,
    } as Offer;
    expect(
      catalogQuery(
        [...offers, unknown],
        new URLSearchParams("sort=price_desc"),
        now,
      ).map((o) => o.id),
    ).toEqual(["qa-second", "qa-vehicle", "unknown"]);
  });
  it("отсекает опасные адреса изображений", () => {
    for (const url of [
      "javascript:alert(1)",
      "//evil.test/a",
      "data:text/html,hi",
    ])
      expect(imageSource(url)).toBeUndefined();
    expect(imageSource("/photos/test.webp")).toBe("/photos/test.webp");
  });
  it("не публикует неподтверждённые истории", () => {
    const result = render({
      url: "/",
      offers: [],
      now,
      company: {
        contacts: null,
        stories: [
          {
            id: "x",
            title: "Скрытая история",
            text: "Не согласовано",
            kind: "delivery",
            image: "/x.webp",
            imageAlt: "Фото",
            approved: false,
          },
        ],
      },
    });
    expect(result.html).not.toContain("Скрытая история");
  });
});
