import { useEffect, useId, useRef, useState } from "react";

const groups: [string, string, number][][] = [
  [
    ["hero-suv-street", "Чёрный внедорожник на городской улице", 720],
    ["hero-coastal-suv", "Тёмный кроссовер у моря на закате", 569],
    ["hero-green-suv", "Зелёный внедорожник у здания", 698],
  ],
  [
    ["hero-suv-showroom", "Чёрный автомобиль в автосалоне", 1280],
    ["hero-interior", "Светлый салон автомобиля с широким экраном", 693],
  ],
  [
    [
      "hero-sports-car",
      "Красный спортивный автомобиль у кирпичной стены",
      1028,
    ],
    ["hero-night-sports", "Светлый спортивный кабриолет ночью", 1029],
    ["hero-white-sedan", "Белый седан на фоне деревьев", 692],
  ],
];

const slots = ["collage-main", "collage-showroom", "collage-sports"];

export function HeroSlideshow() {
  const frameId = useId();
  const [active, setActive] = useState([0, 0, 0]);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const loaded = useRef(new Set<string>());
  const turn = useRef(0);

  useEffect(() => {
    root.current
      ?.querySelectorAll<HTMLImageElement>("img[data-photo]")
      .forEach((image) => {
        if (image.complete && image.naturalWidth > 0 && image.dataset.photo)
          loaded.current.add(image.dataset.photo);
      });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    motion();
    visibility();
    media.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) observer.observe(root.current);
    return () => {
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (reduced || !visible || !pageVisible) return;
    const timer = window.setInterval(() => {
      const slot = turn.current++ % groups.length;
      const photos = groups[slot];
      setActive((current) => {
        for (let offset = 1; offset < photos.length; offset++) {
          const next = (current[slot] + offset) % photos.length;
          if (loaded.current.has(photos[next][0]))
            return current.map((value, index) =>
              index === slot ? next : value,
            );
        }
        return current;
      });
    }, 3600);
    return () => window.clearInterval(timer);
  }, [reduced, visible, pageVisible]);

  return (
    <div
      className="hero-collage hero-slideshow packed-collage"
      ref={root}
      role="group"
      aria-label="Фотографии автомобилей"
      data-reduced-motion={reduced}
    >
      {groups.map((photos, slot) => (
        <div className={`hero-photo-slot ${slots[slot]}`} key={slots[slot]}>
          {photos.map(([name, alt], index) => (
            <div
              key={name}
              className={`hero-photo-layer${active[slot] === index ? " is-active" : ""}`}
              aria-hidden={active[slot] !== index}
            >
              <svg
                className="hero-photo-frame"
                viewBox={`0 0 960 ${slot === 0 ? 520 : 640}`}
                fill="none"
                focusable="false"
              >
                <defs>
                  <clipPath id={`${frameId}-${name}`}>
                    <rect x="7" y="7" width="946" height={slot === 0 ? 506 : 626} rx="38" />
                  </clipPath>
                </defs>
                <foreignObject
                  width="960"
                  height={slot === 0 ? 520 : 640}
                  clipPath={`url(#${frameId}-${name})`}
                >
                  <img
                    key={name}
                    data-photo={name}
                    src={`/photos/${name}-960.webp`}
                    srcSet={`/photos/${name}-480.webp 480w, /photos/${name}-960.webp 960w`}
                    sizes={
                      slot === 0
                        ? "(max-width: 639px) calc(100vw - 32px), (min-width: 1440px) 640px, 46vw"
                        : "(max-width: 639px) calc(50vw - 20px), (min-width: 1440px) 320px, 23vw"
                    }
                    alt={alt}
                    aria-hidden={active[slot] !== index}
                    className={active[slot] === index ? "is-active" : ""}
                    width="960"
                    height={slot === 0 ? 520 : 640}
                    fetchPriority={slot === 0 && index === 0 ? "high" : "low"}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    onLoad={() => loaded.current.add(name)}
                  />
                </foreignObject>
                <rect className="hero-frame-outline" x="7" y="7" width="946" height={slot === 0 ? 506 : 626} rx="38" />
                <path className="hero-frame-accent" d="M7 112V45Q7 7 45 7H156" />
              </svg>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
