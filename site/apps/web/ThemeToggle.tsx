import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const explicit = document.documentElement.dataset.theme;
      setDark(explicit === "dark" || (explicit !== "light" && media.matches));
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const label = dark ? "Включить светлую тему" : "Включить тёмную тему";
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = dark ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        setDark(!dark);
        try {
          localStorage.setItem("carport-theme", next);
        } catch {}
      }}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <g className="theme-sun">
          <circle cx="16" cy="16" r="5" />
          <path d="M16 3v3m0 20v3M3 16h3m20 0h3M7 7l2 2m14 14 2 2M7 25l2-2M23 9l2-2" />
        </g>
        <path
          className="theme-moon"
          d="M24.5 19.5A10 10 0 0 1 12.5 7.5a10 10 0 1 0 12 12Z"
        />
      </svg>
    </button>
  );
}
