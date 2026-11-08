import type { AppProps } from "../web/App";
import { services, staticPages, titleFor } from "../web/content";
import { clientReviews } from "../web/reviews";
import {
  catalogQuery,
  imageSource,
  isCurrent,
  offerForPath,
  visibleOffers,
} from "../../packages/contracts/offers";

export const SITE_ORIGIN = "https://carportchina.ru";
const absolute = (path: string) => new URL(path, SITE_ORIGIN).href;
export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const pageCopy: Record<string, [string, string]> = {
  "/ferrari-849-testarossa-spider/": ["Ferrari 849 Testarossa Spider 2027: одна квота | CarPort China", "Эксклюзивная квота CarPort China на Ferrari 849 Testarossa Spider. Индивидуальная конфигурация и поставка летом 2027 года. Фотографии, конфигуратор Ferrari и персональное предложение."],
  "/": [
    "Автомобили из Китая, Кореи и Европы | CarPort China",
    "Подбор и доставка автомобилей из Китая, Кореи, ОАЭ и Европы. Каталог, оформление для России, сервис и поддержка после покупки в CarPort China.",
  ],
  "/cars/": [
    "Каталог автомобилей из Китая и других стран | CarPort China",
    "Автомобили Changan, Geely и другие предложения CarPort China: фотографии, комплектации, характеристики и условия покупки. Подбор под ваши пожелания.",
  ],
  "/business/": [
    "Автомобили для бизнеса и юридических лиц | CarPort China",
    "Подбор автомобилей для компании. Обсудите количество, комплектации, документы, условия оплаты и НДС в индивидуальном коммерческом предложении CarPort China.",
  ],
  "/services/": [
    "Сервис, запчасти и услуги для автомобилей | CarPort China",
    "Обслуживание, запчасти, русификация, защитная плёнка, трейд-ин, кредит и страхование. Выберите услугу и узнайте, что нужно для индивидуального предложения.",
  ],
  "/about/": [
    "О компании CarPort China: подбор, доставка и сервис",
    "CarPort China помогает выбрать и привезти автомобиль, согласовать оформление и организовать обслуживание после покупки. Узнайте о направлениях работы компании.",
  ],
  "/contacts/": [
    "Контакты CarPort China",
    "Контактная информация CarPort China для вопросов по автомобилям, покупке и обслуживанию. Данные компании и доступные способы связи.",
  ],
  "/reviews/": [
    "Отзывы клиентов и выдачи автомобилей | CarPort China",
    "Видеоотзывы клиентов CarPort China и фотографии с выдачи автомобилей. Впечатления владельцев после получения машины.",
  ],
  "/deliveries/": [
    "Выдачи автомобилей и опыт клиентов | CarPort China",
    "Материалы CarPort China о выдачах автомобилей и работе с клиентами. Подтверждённые истории публикуются после согласования.",
  ],
  "/privacy/": [
    "Политика обработки персональных данных | CarPort China",
    "Политика ООО «ЛОГИСТИК +» для сайта CarPort China: цели, состав и сроки обработки персональных данных, защита, права пользователей и порядок обращений.",
  ],
  "/consent/": [
    "Согласие на обработку персональных данных | CarPort China",
    "Отдельное согласие на обработку персональных данных для рассмотрения обращения в ООО «ЛОГИСТИК +»: перечень данных, действия, срок и порядок отзыва.",
  ],
};
const serviceNames: Record<string, string> = {
  "service-warranty": "Сервис и гарантийное обслуживание автомобилей",
  parts: "Подбор запчастей для китайских автомобилей",
  russification: "Русификация и адаптация китайских автомобилей",
  film: "Оклейка автомобиля защитной плёнкой",
  "trade-in": "Трейд-ин и оценка автомобиля",
  "credit-insurance": "Помощь с автокредитом и страхованием",
  "pmzh-belarus": "Сопровождение ПМЖ в Беларуси",
  "pmzh-kyrgyzstan": "Сопровождение ПМЖ в Киргизии",
};
export function pageReady(path: string, props: AppProps): boolean {
  if (["/privacy/", "/consent/", "/deliveries/"].includes(path)) return false;
  if (path === "/contacts/" && !props.company?.contacts) return false;
  return !!(titleFor(path) || offerForPath(props.offers, path));
}
export function sitemap(props: AppProps): string {
  const paths = [
    ...Object.keys(staticPages),
    ...services.map((s) => `/services/${s.slug}/`),
    ...visibleOffers(props.offers).map((o) => `/cars/${o.slug}/`),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths
      .filter((p) => pageReady(p, props))
      .map((p) => `<url><loc>${escapeHtml(absolute(p))}</loc></url>`)
      .join("") +
    "</urlset>"
  );
}
export function robotsTxt(publicSite: boolean): string {
  return publicSite
    ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /health\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n";
}
export function buildSeo(props: AppProps, publicSite = false) {
  const url = new URL(props.url, SITE_ORIGIN),
    path = url.pathname;
  const car = offerForPath(props.offers, path),
    service = services.find((s) => path === `/services/${s.slug}/`);
  const known = !!(car || titleFor(path));
  const title = car
    ? `${car.title}${car.trim ? " " + car.trim : ""}${car.year ? " " + car.year : ""} — характеристики и фото | CarPort China`
    : service
      ? `${serviceNames[service.slug]} | CarPort China`
      : (pageCopy[path]?.[0] ?? "Страница не найдена | CarPort China");
  const description = car
    ? `${car.title}${car.year ? " " + car.year : ""}${car.trim ? ", " + car.trim : ""}. Фотографии, характеристики и оснащение. Уточните актуальную стоимость и условия покупки в CarPort China.`
    : service
      ? service.intro
      : (pageCopy[path]?.[1] ??
        "Страница не найдена. Перейдите в каталог автомобилей или на главную CarPort China.");
  const filtered =
    path === "/cars/" &&
    ["q", "brand", "budget", "vat", "sort", "availability"].some(
      (k) => !!url.searchParams.get(k),
    );
  const indexable = known && pageReady(path, props) && !filtered;
  const robots = !publicSite
    ? "noindex, nofollow"
    : indexable
      ? "index, follow, max-image-preview:large"
      : "noindex, follow";
  const canonical = known ? absolute(path) : undefined;
  const image = absolute(
    path === "/ferrari-849-testarossa-spider/" ? "/photos/promos/ferrari-849-1920.webp" : imageSource(car?.gallery?.[0]?.src ?? car?.image) ?? "/brand/social.jpg",
  );
  const orgId = SITE_ORIGIN + "/#organization",
    siteId = SITE_ORIGIN + "/#website";
  const org: Record<string, unknown> = {
    "@type": "Organization",
    "@id": orgId,
    name: "CarPort China",
    url: SITE_ORIGIN + "/",
    logo: absolute("/brand/logo.png"),
  };
  if (props.company?.contacts) {
    org.legalName = props.company.contacts.legalName;
    org.telephone = props.company.contacts.phone;
      org.email = props.company.contacts.email;
    if (props.company.contacts.address)
      org.address = props.company.contacts.address;
  }
  const graph: Record<string, unknown>[] = [];
  if (known) {
    graph.push(org, {
      "@type": "WebSite",
      "@id": siteId,
      url: SITE_ORIGIN + "/",
      name: "CarPort China",
      inLanguage: "ru-RU",
      publisher: { "@id": orgId },
    });
    const page: Record<string, unknown> = {
      "@type":
        path === "/cars/" || path === "/services/" || path === "/reviews/"
          ? "CollectionPage"
          : path === "/about/"
            ? "AboutPage"
            : path === "/contacts/"
              ? "ContactPage"
              : "WebPage",
      "@id": canonical + "#webpage",
      url: canonical,
      name: title,
      description,
      inLanguage: "ru-RU",
      isPartOf: { "@id": siteId },
      publisher: { "@id": orgId },
    };
    graph.push(page);
    if (path === "/reviews/") {
      // Video markup belongs to the page with playable videos, not thumbnail links.
      // Native MP4s have contentUrl; there is no separate embeddable player URL.
      const videos = clientReviews.map(review => ({
        "@type": "VideoObject",
        "@id": absolute(`/reviews/#${review.id}`),
        url: absolute(`/reviews/#${review.id}`),
        name: review.title,
        description: review.description,
        thumbnailUrl: [absolute(review.poster)],
        contentUrl: absolute(review.src),
        uploadDate: review.uploadDate,
        duration: review.duration,
        encodingFormat: "video/mp4",
        inLanguage: "ru-RU",
        publisher: { "@id": orgId },
        about: { "@id": orgId },
      }));
      graph.push(...videos);
      page.video = videos.map(video => ({ "@id": video["@id"] }));
      if (path === "/reviews/") {
        const listId = canonical + "#videos";
        graph.push({
          "@type": "ItemList",
          "@id": listId,
          name: "Видеоотзывы клиентов CarPort China",
          numberOfItems: videos.length,
          itemListElement: videos.map((video, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: { "@id": video["@id"] },
          })),
        });
        page.mainEntity = { "@id": listId };
        page.about = { "@id": orgId };
      }
    }
    if (path !== "/") {
      const crumbs = [{ name: "Главная", item: SITE_ORIGIN + "/" }];
      if (car) crumbs.push({ name: "Автомобили", item: absolute("/cars/") });
      if (service)
        crumbs.push({ name: "Услуги", item: absolute("/services/") });
      crumbs.push({ name: car?.title ?? titleFor(path)!, item: canonical! });
      graph.push({
        "@type": "BreadcrumbList",
        "@id": canonical + "#breadcrumbs",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          ...c,
        })),
      });
      page.breadcrumb = { "@id": canonical + "#breadcrumbs" };
    }
    if (car) {
      const vehicle: Record<string, unknown> = {
        "@type": "Car",
        "@id": canonical + "#vehicle",
        name: car.title,
        url: canonical,
        brand: { "@type": "Brand", name: car.brand },
        model: car.model,
        vehicleModelDate: car.year ? String(car.year) : undefined,
        vehicleConfiguration: car.trim,
        description: car.description,
        image: (car.gallery?.length
          ? car.gallery.map((p) => p.src)
          : [car.image]
        )
          .filter((p) => imageSource(p))
          .map((p) => absolute(p!)),
        additionalProperty: (car.specifications ?? []).map((s) => ({
          "@type": "PropertyValue",
          name: s.label,
          value: s.value,
        })),
      };
      if (car.mileageKm !== undefined)
        vehicle.mileageFromOdometer = {
          "@type": "QuantitativeValue",
          value: car.mileageKm,
          unitCode: "KMT",
        };
      // Source estimates and on-request prices are not purchasable offers.
      if (
        car.priceKind === "fixed_total" &&
        car.amountMinor &&
        car.fullCostsConfirmed &&
        car.termsApproved &&
        isCurrent(car.validUntil, props.now)
      ) {
        const minor = BigInt(car.amountMinor);
        vehicle.offers = {
          "@type": "Offer",
          url: canonical,
          price: `${minor / 100n}.${String(minor % 100n).padStart(2, "0")}`,
          priceCurrency: "RUB",
          priceValidUntil: car.validUntil,
        };
      }
      graph.push(vehicle);
      page.mainEntity = { "@id": canonical + "#vehicle" };
    }
    if (service) {
      graph.push({
        "@type": "Service",
        "@id": canonical + "#service",
        name: serviceNames[service.slug],
        description: service.intro,
        url: canonical,
        provider: { "@id": orgId },
      });
      page.mainEntity = { "@id": canonical + "#service" };
    }
    if (path === "/cars/") {
      const cars = catalogQuery(props.offers, url.searchParams, props.now);
      graph.push({
        "@type": "ItemList",
        "@id": canonical + "#catalog",
        numberOfItems: cars.length,
        itemListElement: cars.map((o, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: o.title,
          url: absolute(`/cars/${o.slug}/`),
        })),
      });
      page.mainEntity = { "@id": canonical + "#catalog" };
    }
  }
  const meta = (name: string, content: string, property = false) =>
    `<meta ${property ? "property" : "name"}="${name}" content="${escapeHtml(content)}"/>`;
  const head = [
    `<title>${escapeHtml(title)}</title>`,
    meta("description", description),
    meta("robots", robots),
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}"/>` : "",
    '<link rel="icon" type="image/png" href="/favicon.png"/>',
    meta("og:type", "website", true),
    meta("og:locale", "ru_RU", true),
    meta("og:site_name", "CarPort China", true),
    meta("og:title", title, true),
    meta("og:description", description, true),
    canonical ? meta("og:url", canonical, true) : "",
    meta("og:image", image, true),
    meta(
      "og:image:alt",
      car?.title ??
        "CarPort China: подбор, доставка и обслуживание автомобилей",
      true,
    ),
    meta("twitter:card", "summary_large_image"),
    meta("twitter:title", title),
    meta("twitter:description", description),
    meta("twitter:image", image),
    graph.length
      ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`
      : "",
  ].join("");
  return { head, robots, title, description, canonical, graph, indexable };
}
