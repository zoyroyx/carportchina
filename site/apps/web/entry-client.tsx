import { hydrateRoot } from "react-dom/client";
import { App, type AppProps } from "./App";
import "@fontsource-variable/golos-text";
import "../../packages/ui/styles.css";
const props = JSON.parse(
  document.getElementById("page-data")!.textContent!,
) as AppProps;
hydrateRoot(document.getElementById("root")!, <App {...props} />);
