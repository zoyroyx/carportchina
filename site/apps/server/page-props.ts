import type { AppProps } from "../web/App";
import { catalogQuery, offerForPath } from "../../packages/contracts/offers";

// Navigation uses ordinary links. Hydrate only the inventory this page renders.
export function pageProps(props: AppProps): AppProps {
  const path = new URL(props.url, "https://carportchina.ru").pathname;
  if (path === "/cars/") return props;
  const car = offerForPath(props.offers, path);
  const offers = path === "/"
    ? catalogQuery(props.offers, new URLSearchParams(), props.now).slice(0, 4)
    : car ? [car] : [];
  return { ...props, offers };
}
