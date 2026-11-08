import { Type, type Static } from "@sinclair/typebox";

export const OfferSchema = Type.Object(
  {
    id: Type.String(),
    slug: Type.String(),
    title: Type.String(),
    publication: Type.Union(
      ["draft", "published", "archived"].map((v) => Type.Literal(v)),
    ),
    registrationMarket: Type.Union(
      ["RF", "BY", "KG", "other", "undecided"].map((v) => Type.Literal(v)),
    ),
    priceKind: Type.Union(
      ["fixed_total", "estimate_total", "on_request"].map((v) =>
        Type.Literal(v),
      ),
    ),
    amountMinor: Type.Union([
      Type.String({ pattern: "^[0-9]+$" }),
      Type.Null(),
    ]),
    currency: Type.Literal("RUB"),
    validUntil: Type.Union([Type.String(), Type.Null()]),
    fullCostsConfirmed: Type.Boolean(),
    termsApproved: Type.Boolean(),
    estimateBasis: Type.Union([Type.String(), Type.Null()]),
    vatConfirmed: Type.Boolean(),
    image: Type.Union([Type.String(), Type.Null()]),
    brand: Type.String(),
    model: Type.Optional(Type.String()),
    availability: Type.Optional(Type.Union(["in_stock", "to_order", "in_transit", "unknown"].map(v => Type.Literal(v)))),
    availabilityNote: Type.Optional(Type.String()),
    stockPriceRub: Type.Optional(Type.Integer({ minimum: 1 })),
    orderPriceRub: Type.Optional(Type.Integer({ minimum: 1 })),
    year: Type.Optional(Type.Integer({ minimum: 1900, maximum: 2100 })),
    mileageKm: Type.Optional(Type.Integer({ minimum: 0 })),
    trim: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    sourcePrice: Type.Optional(
      Type.Object({
        fromRub: Type.Integer({ minimum: 1 }),
        date: Type.String(),
        note: Type.String(),
      }),
    ),
    photoNote: Type.Optional(Type.String()),
    highlights: Type.Optional(Type.Array(Type.String())),
    equipment: Type.Optional(
      Type.Array(
        Type.Object({
          title: Type.String(),
          items: Type.Array(Type.String()),
        }),
      ),
    ),
    gallery: Type.Optional(
      Type.Array(Type.Object({ src: Type.String(), alt: Type.String() })),
    ),
    specifications: Type.Optional(
      Type.Array(Type.Object({ label: Type.String(), value: Type.String() })),
    ),
    priceIncludes: Type.Optional(Type.Array(Type.String())),
    priceExcludes: Type.Optional(Type.Array(Type.String())),
    documents: Type.Optional(Type.Array(Type.String())),
    seller: Type.Optional(Type.String()),
    updatedAt: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
export type Offer = Static<typeof OfferSchema>;

export function publicationIssues(offer: Offer): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(offer.slug))
    errors.push("INVALID_SLUG");
  if (!offer.id.trim() || !offer.title.trim() || !offer.brand.trim())
    errors.push("IDENTITY_REQUIRED");
  if (offer.registrationMarket !== "RF") errors.push("RF_ONLY");
  if (offer.priceKind === "on_request") {
    if (offer.amountMinor !== null) errors.push("REQUEST_PRICE_MUST_BE_NULL");
  } else {
    if (
      !offer.amountMinor ||
      !/^[0-9]+$/.test(offer.amountMinor) ||
      !offer.validUntil ||
      !Number.isFinite(Date.parse(offer.validUntil))
    )
      errors.push("PRICE_INCOMPLETE");
    if (!offer.fullCostsConfirmed || !offer.termsApproved)
      errors.push("TERMS_REQUIRED");
    if (offer.priceKind === "estimate_total" && !offer.estimateBasis?.trim())
      errors.push("ESTIMATE_BASIS_REQUIRED");
  }
  return errors;
}
export function isCurrent(date: string | null, now: number): boolean {
  return !!date && Date.parse(date) > now;
}
export function visibleOffers(offers: Offer[]): Offer[] {
  return offers.filter(
    (o) => o.publication === "published" && publicationIssues(o).length === 0,
  );
}
export function counts(offers: Offer[]) {
  return { total: visibleOffers(offers).length };
}
export function priceLabel(o: Offer, now: number): string {
  if (
    o.priceKind === "on_request" ||
    o.amountMinor === null ||
    !isCurrent(o.validUntil, now)
  )
    return "Стоимость уточняется";
  const minor = BigInt(o.amountMinor);
  const amount = new Intl.NumberFormat("ru-RU").format(minor / 100n);
  const fraction = minor % 100n;
  return `${o.priceKind === "estimate_total" ? "Ориентировочно " : ""}${amount}${fraction ? "," + fraction.toString().padStart(2, "0") : ""} ₽`;
}

export function filterOffers(
  offers: Offer[],
  brand = "",
  vat = false,
): Offer[] {
  return visibleOffers(offers).filter(
    (o) => (!brand || o.brand === brand) && (!vat || o.vatConfirmed),
  );
}

export function offerForPath(offers: Offer[], path: string): Offer | undefined {
  return visibleOffers(offers).find((o) => path === `/cars/${o.slug}/`);
}
export function imageSource(
  src: string | null | undefined,
): string | undefined {
  if (!src) return undefined;
  if (/^\/(?!\/)[^\\]*$/.test(src)) return src;
  try {
    const u = new URL(src);
    return u.protocol === "https:" && !u.username && !u.password
      ? src
      : undefined;
  } catch {
    return undefined;
  }
}
// Reference prices are displayed as estimates, never exported as confirmed SEO offers.
export function catalogPrice(o: Offer, now: number, purchaseMode = ""): bigint | null {
  if (o.priceKind === "on_request") {
    const rub = (purchaseMode === "to_order" ? o.orderPriceRub : undefined) ?? o.stockPriceRub ?? o.orderPriceRub ?? o.sourcePrice?.fromRub;
    return rub ? BigInt(rub) * 100n : null;
  }
  return isCurrent(o.validUntil, now) && o.amountMinor !== null ? BigInt(o.amountMinor) : null;
}
export function catalogQuery(
  offers: Offer[],
  params: URLSearchParams,
  now: number,
): Offer[] {
  const q = (params.get("q") ?? "").trim().toLocaleLowerCase("ru");
  const budget = params.get("budget") ?? "";
  const max =
    /^\d{1,10}$/.test(budget) && BigInt(budget) > 0n
      ? BigInt(budget) * 100n
      : null;
  const sort = params.get("sort") ?? "";
  const result = filterOffers(
    offers,
    params.get("brand") ?? "",
    params.get("vat") === "true",
  ).filter(
    (o) =>
      (!params.get("availability") || (params.get("availability") === "to_order" ? o.availability === "to_order" || !!o.orderPriceRub : o.availability === params.get("availability"))) &&
      (!q ||
        `${o.brand} ${o.model ?? ""} ${o.title} ${o.trim ?? ""}`
          .toLocaleLowerCase("ru")
          .includes(q)) &&
      (max === null ||
        (catalogPrice(o, now, params.get("availability") ?? "") !== null && catalogPrice(o, now, params.get("availability") ?? "")! <= max)),
  );
  if (sort === "price_asc" || sort === "price_desc")
    result.sort((a, b) => {
      const av = catalogPrice(a, now, params.get("availability") ?? "");
      const bv = catalogPrice(b, now, params.get("availability") ?? "");
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      return (
        (av < bv ? -1 : av > bv ? 1 : 0) * (sort === "price_desc" ? -1 : 1)
      );
    });
  if (sort === "year_desc")
    result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  if (!sort) result.sort((a, b) => Number(b.availability === "in_stock") - Number(a.availability === "in_stock"));
  return result;
}
