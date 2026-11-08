import { useId } from "react";

// Shared across the homepage, service directory and individual landing pages.
export const servicePhotos: Record<string, { src: string; alt: string }> = {
  business: {
    src: "/photos/services/business-fleet-960.webp",
    alt: "Визуализация автомобилей для бизнеса у современного делового центра",
  },
  team: {
    src: "/photos/services/team-premium-960.webp",
    alt: "Визуализация команды CarPort China в офисе",
  },
  "service-warranty": {
    src: "/photos/services/service-recast-960.webp",
    alt: "Диагностика автомобильной электроники в мастерской",
  },
  parts: {
    src: "/photos/services/parts-recast-960.webp",
    alt: "Работа с тормозным диском автомобиля",
  },
  russification: {
    src: "/photos/services/software-960.webp",
    alt: "Цифровая приборная панель автомобиля",
  },
  film: {
    src: "/photos/services/film-recast-960.webp",
    alt: "Мастер наносит защитную плёнку на кузов",
  },
  "trade-in": {
    src: "/photos/services/trade-in-recast-960.webp",
    alt: "Осмотр автомобиля специалистом по оценке",
  },
  "credit-insurance": {
    src: "/photos/services/credit-insurance-recast-960.webp",
    alt: "Консультация по финансированию автомобиля",
  },
  "pmzh-belarus": {
    src: "/photos/services/pmzh-belarus-generated-960.webp",
    alt: "Визуализация автомобиля у жилого квартала в Беларуси",
  },
  "pmzh-kyrgyzstan": {
    src: "/photos/services/pmzh-kyrgyzstan-generated-960.webp",
    alt: "Визуализация автомобиля в городе у гор Киргизии",
  },
};

export function ServicePhoto({
  slug,
  prominent = false,
}: {
  slug: string;
  prominent?: boolean;
}) {
  const id = useId();
  const photo = servicePhotos[slug];
  const contour = "M40 7H953V600L920 633H7V40Z";
  return (
    <svg
      className="service-image"
      viewBox="0 0 960 640"
      fill="none"
      focusable="false"
    >
      <defs>
        <clipPath id={id}>
          <path d={contour} />
        </clipPath>
      </defs>
      <foreignObject width="960" height="640" clipPath={`url(#${id})`}>
        <img
          src={photo.src}
          srcSet={`${photo.src.replace("-960.webp", "-480.webp")} 480w, ${photo.src} 960w`}
          sizes={
            prominent
              ? "(max-width: 799px) calc(100vw - 32px), 46vw"
              : "(max-width: 639px) calc(50vw - 22px), (max-width: 899px) 46vw, 23vw"
          }
          width="960"
          height="640"
          alt={photo.alt}
          loading={prominent ? "eager" : "lazy"}
          decoding="async"
        />
      </foreignObject>
      <path className="service-image-outline" d={contour} />
      <path
        className="service-image-accent"
        d="M7 120V40L40 7H200M953 520V600L920 633H760"
      />
      <path
        className="service-image-detail"
        d="M66 18H116M128 18H150M894 622H844M832 622H810"
      />
    </svg>
  );
}
