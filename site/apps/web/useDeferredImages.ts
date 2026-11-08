import { useEffect, useState } from "react";

/** Decorative secondary slides must not compete with the first screen. */
export function useDeferredImages(enabled: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    let timer: number | undefined;
    const schedule = () => { timer = window.setTimeout(() => setReady(true), 1200); };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => { window.removeEventListener("load", schedule); window.clearTimeout(timer); };
  }, [enabled, ready]);
  return ready;
}
