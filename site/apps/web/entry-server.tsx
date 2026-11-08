import { offerForPath } from "../../packages/contracts/offers";
import { renderToString } from "react-dom/server";
import { App, type AppProps } from "./App";
import { titleFor } from "./content";
export function render(props: AppProps) {
  const path = new URL(props.url, "http://local").pathname;
  const title = offerForPath(props.offers, path)?.title ?? titleFor(path);
  return {
    html: renderToString(<App {...props} />),
    title: title ?? "Страница не найдена",
    status: title ? 200 : 404,
  };
}
