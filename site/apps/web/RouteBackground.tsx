import { useEffect, useState } from "react";

/** Sweep through measured whitespace, so the artwork never runs through copy. */
export function RouteBackground() {
  const [drawing, setDrawing] = useState({ width: 1, height: 1, path: "" });

  useEffect(() => {
    const root = document.getElementById("root");
    const main = document.getElementById("main");
    if (!root || !main) return;
    const footer = root.querySelector(".site-footer");
    const blocks = [...main.children, ...(footer ? [footer] : [])];
    let frame = 0;
    const measure = () => {
      const bounds = root.getBoundingClientRect();
      const width = bounds.width;
      const curves: string[] = [];
      let lastY = -500;
      for (let i = 1; i < blocks.length; i++) {
        const previous = blocks[i - 1].getBoundingClientRect();
        const next = blocks[i].getBoundingClientRect();
        const gap = next.top - previous.bottom;
        const middle = (previous.bottom + next.top) / 2 - bounds.top;
        if (gap < 36 || middle - lastY < 400) continue;
        const amplitude = Math.min(72, (gap - 24) / 2);
        const direction = curves.length % 2 ? -1 : 1;
        const start = middle - amplitude * direction;
        const end = middle + amplitude * direction;
        curves.push(
          `M -60 ${start} C ${width * 0.18} ${start}, ${width * 0.24} ${end}, ${width * 0.52} ${end} S ${width * 0.84} ${start}, ${width + 60} ${start}`,
        );
        lastY = middle;
      }
      const next = { width, height: bounds.height, path: curves.join(" ") };
      setDrawing((old) =>
        old.width === next.width &&
        old.height === next.height &&
        old.path === next.path
          ? old
          : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    [root, main, ...blocks].forEach((block) => observer.observe(block));
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <svg
      className="route-background"
      viewBox={`0 0 ${drawing.width} ${drawing.height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path className="route-sweep" d={drawing.path} />
      <path
        className="route-echo"
        d={drawing.path}
        transform="translate(0 6)"
      />
    </svg>
  );
}
