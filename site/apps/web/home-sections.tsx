import { services } from "./content";
import { ServicePhoto } from "./ServicePhoto";
const benefits = [
  [
    "Собственный сервис",
    "ТО, диагностика и поддержка после покупки.",
    "/services/service-warranty/",
  ],
  [
    "Полный утильсбор",
    "Для учёта в РФ. Обязательства в договоре.",
    "#documents",
  ],
  [
    "Трейд-ин на аукционе",
    "Предложения по выкупу вашего авто.",
    "/services/trade-in/",
  ],
  ["Автомобили уже есть", "Выберите модель и запишитесь на осмотр.", "/cars/"],
  [
    "Кредит и страховка",
    "Подбор программы под вашу покупку.",
    "/services/credit-insurance/",
  ],
  [
    "Китайские запчасти",
    "Детали и расходники под вашу модель.",
    "/services/parts/",
  ],
  [
    "Русификация",
    "Решения для новых моделей и версий ПО.",
    "/services/russification/",
  ],
  ["Защита плёнкой", "Оклейка кузова и отдельных зон.", "/services/film/"],
  [
    "ПМЖ в Беларуси",
    "Сопровождение и консультация по вашей ситуации.",
    "/services/pmzh-belarus/",
  ],
  [
    "ПМЖ в Киргизии",
    "Помощь с порядком оформления и документами.",
    "/services/pmzh-kyrgyzstan/",
  ],
];

function BenefitIcon({ index }: { index: number }) {
  const paths = [
    "M20 5a6 6 0 0 1-7 8L6 20l-3-3 7-7a6 6 0 0 1 8-7l-4 4 3 3 3-5Z",
    "M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7L12 3ZM8 12l3 3 5-6",
    "M4 8h15l-4-4M20 16H5l4 4",
    "M3 14l2-6h14l2 6v5h-3v-3H6v3H3v-5ZM3 13h18M7 8l2-4h6l2 4M6 13v2m12-2v2",
    "M3 5h18v14H3V5Zm0 5h18M6 15h4",
    "M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Zm1 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
    "M3 4h18v13H3V4Zm5 17h8m-4-4v4M7 8l-2 2 2 2m10-4 2 2-2 2m-6 1 2-6",
    "M4 3h16v12l-6 6H4V3Zm10 18v-6h6M8 7h8M8 11h5",
  ];
  return (
    <svg
      className="benefit-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[index] ?? "M5 3h14v18H5V3Zm4 4h6M9 11h6M9 15h4"} />
    </svg>
  );
}

function BenefitsList({ start, end }: { start: number; end: number }) {
  return (
    <div className="benefits-list">
      {benefits.slice(start, end).map(([title, text, href], offset) => (
        <article key={title}>
          <BenefitIcon index={start + offset} />
          <div>
            <h3>
              <a href={href}>{title}</a>
            </h3>
            <p>{text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function HomeBenefits() {
  return (
    <section
      className="section home-benefits compact-benefits"
      aria-labelledby="benefits-title"
    >
      <div className="benefits-heading">
        <h2 id="benefits-title">
          Всё для автомобиля.
          <br /> <em>В одном месте.</em>
        </h2>
        <p>
          Мы знаем подход к автомобилям.
          <br />
          <strong>
            Подбираем, адаптируем и обслуживаем в собственном сервисе.
          </strong>
        </p>
      </div>
      <BenefitsList start={0} end={4} />
      <details className="benefits-more">
        <summary className="benefits-toggle">
          <span className="benefits-expand-label">Больше</span>
          <span className="benefits-collapse-label">Свернуть</span>
          <span className="benefits-toggle-symbol" aria-hidden="true" />
        </summary>
        <BenefitsList start={4} end={benefits.length} />
      </details>
    </section>
  );
}

const features = [
  {
    slug: "service-warranty",
    image: "service",
    title: "Сервис и гарантия",
    text: "Свой сервис для вашего автомобиля. ТО, диагностика и поддержка после покупки.",
    alt: "Диагностика автомобильной электроники в мастерской",
  },
  {
    slug: "parts",
    image: "parts",
    title: "Запчасти",
    text: "Расходники и отдельные узлы. Подбор деталей под вашу модель.",
    alt: "Механик работает с тормозным диском автомобиля",
  },
  {
    slug: "russification",
    image: "software",
    title: "Русификация",
    text: "Понятный интерфейс и адаптация системы. Начнём с проверки совместимости.",
    alt: "Цифровая приборная панель автомобиля",
  },
  {
    slug: "film",
    image: "film",
    title: "Защита плёнкой",
    text: "Сохраните внешний вид автомобиля. Подберём покрытие и зоны защиты.",
    alt: "Мастер наносит плёнку на кузов автомобиля",
  },
];

export function HomeServices({
  all = false,
  level = 3,
}: {
  all?: boolean;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const cards = all
    ? services.map((s) => ({
        ...s,
        text: features.find((f) => f.slug === s.slug)?.text ?? s.intro,
        title: features.find((f) => f.slug === s.slug)?.title ?? s.title,
      }))
    : features;
  return (
    <>
      <div className="home-service-grid">
        {cards.map((s) => (
          <a
            className="home-service"
            href={`/services/${s.slug}/`}
            key={s.slug}
          >
            <ServicePhoto slug={s.slug} />
            <div className="home-service-heading">
              <Heading>{s.title}</Heading>
              <span aria-hidden="true">↗</span>
            </div>
            <p>{s.text}</p>
          </a>
        ))}
      </div>
    </>
  );
}
