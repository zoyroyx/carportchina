// Local integration point. No transport, cookies, query strings or personal data.
export type JourneyEvent =
  | "catalog_view"
  | "car_view"
  | "gallery_change"
  | "request_sent"
  | "catalog_filter";
export function trackJourney(
  name: JourneyEvent,
  context: { offerId?: string; service?: string } = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("carport:journey", { detail: { name, ...context } }),
  );
}
