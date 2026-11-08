import catalogCovers from "../../data/catalog-covers.json";
import catalogImages from "../../data/catalog-images.json";
import type { CompanyContent } from "../../packages/contracts/company";
import { useState, useEffect } from "react";
import {
  type Offer,
  imageSource,
  priceLabel,
} from "../../packages/contracts/offers";
import { trackJourney } from "./analytics";
const availabilityLabels: Record<string, string> = { in_stock: "В наличии", to_order: "Под заказ", in_transit: "В пути", unknown: "Уточнить наличие" };
function Availability({ offer }: { offer: Offer }) {
  return <span className={`vehicle-availability ${offer.availability === "in_stock" ? "is-stock" : ""}`}>{availabilityLabels[offer.availability ?? "unknown"]}</span>;
}
function VehiclePrice({ offer, now }: { offer: Offer; now: number }) {
  if (offer.priceKind === "on_request" && (offer.stockPriceRub || offer.orderPriceRub)) {
    const rub = (value: number) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
    return <>
      {offer.stockPriceRub && <span className="vehicle-price-option is-stock"><span>В наличии</span><strong>от {rub(offer.stockPriceRub)}</strong></span>}
      {offer.orderPriceRub && <span className={`vehicle-price-option ${offer.stockPriceRub ? "is-alternative" : ""}`}><span>Под заказ</span><strong>от {rub(offer.orderPriceRub)}</strong></span>}
      <span className="vehicle-price-caption">По предложению от {offer.sourcePrice?.date.split("-").reverse().join(".")} · итоговый расчёт индивидуально</span>
    </>;
  }
  if (offer.priceKind === "on_request" && offer.sourcePrice) {
    return (
      <>
        от {new Intl.NumberFormat("ru-RU").format(offer.sourcePrice.fromRub)} ₽
        <span className="vehicle-price-caption">
          Цена в предложении · требуется актуальный расчёт
        </span>
      </>
    );
  }
  return <>{priceLabel(offer, now)}</>;
}
const imageMetadata = catalogImages as Record<
  string,
  { width: number; height: number; srcSet: string; thumbnail: string }
>;

const covers = catalogCovers as Record<string, { src: string; srcSet: string; width: number; height: number }>;
function CardPrice({ offer, now, purchaseMode }: { offer: Offer; now: number; purchaseMode: string }) {
  const orderFirst = purchaseMode === "to_order" && !!offer.orderPriceRub;
  const main = orderFirst ? offer.orderPriceRub : offer.stockPriceRub ?? offer.orderPriceRub ?? offer.sourcePrice?.fromRub;
  const second = orderFirst ? offer.stockPriceRub : offer.stockPriceRub ? offer.orderPriceRub : undefined;
  const label = orderFirst ? "Под заказ" : offer.stockPriceRub ? "Из наличия" : offer.orderPriceRub || offer.availability === "to_order" ? "Под заказ" : "Цена предложения";
  const rub = (amount: number) => new Intl.NumberFormat("ru-RU").format(amount);
  return <div className="catalog-price-block">
    <span className="catalog-price-label">{label}</span>
    <strong className={`catalog-price-main ${!main && offer.priceKind === "on_request" ? "is-request" : ""}`}>{offer.priceKind === "on_request" && main ? <><small>от </small>{rub(main)}<small> ₽</small></> : priceLabel(offer, now)}</strong>
    <span className="catalog-price-secondary">{second && offer.priceKind === "on_request" ? <>{orderFirst ? "В наличии" : "Под заказ"}<b>от {rub(second)} ₽</b></> : null}</span>
    <span className="catalog-price-date">{offer.sourcePrice ? `Предложение от ${offer.sourcePrice.date.split("-").reverse().join(".")}` : "Условия при обращении"}</span>
  </div>;
}
export function VehicleCard({ offer, now, purchaseMode = "" }: { offer: Offer; now: number; purchaseMode?: string }) {
  const cover = covers[offer.slug];
  const src = cover?.src ?? imageSource(offer.gallery?.[0]?.src ?? offer.image);
  return (
    <a className="vehicle-card" href={`/cars/${offer.slug}/`}>
      <div className="vehicle-card-media">
        {src ? <img src={src} alt={offer.title} loading="lazy" width={cover?.width ?? 640} height={cover?.height ?? 400} srcSet={cover?.srcSet} sizes="(max-width: 639px) calc((100vw - 44px) / 2), (max-width: 1023px) calc((100vw - 80px) / 3), (max-width: 1519px) calc((100vw - 140px) / 4), 345px" decoding="async" /> : <span>Фотографии готовятся</span>}
        <span className="vehicle-photo-count" aria-label={`Фотографий: ${offer.gallery?.length ?? 0}`}>▧ {offer.gallery?.length ?? 0}</span>
      </div>
      <div className="vehicle-card-copy">
        <Availability offer={offer} />
        <h3>{offer.title}</h3>
        <p className="vehicle-meta">{[offer.year, offer.trim].filter(Boolean).join(" · ")}</p>
        <CardPrice offer={offer} now={now} purchaseMode={purchaseMode} />
        <span className="vehicle-card-action">{offer.availability === "in_stock" ? "Выбрать автомобиль" : "Подробнее"}<span aria-hidden="true">↗</span></span>
      </div>
    </a>
  );
}
export function VehicleDetails({ offer, now }: { offer: Offer; now: number }) {
  const photos = (
    offer.gallery?.length
      ? offer.gallery
      : offer.image
        ? [{ src: offer.image, alt: offer.title }]
        : []
  ).filter((p) => imageSource(p.src));
  const [index, setIndex] = useState(0);
  useEffect(() => {
    trackJourney("car_view", { offerId: offer.id });
  }, [offer.id]);
  const specs = [
    { label: "Марка", value: offer.brand },
    ...(offer.model ? [{ label: "Модель", value: offer.model }] : []),
    ...(offer.year
      ? [{ label: "Год выпуска", value: String(offer.year) }]
      : []),
    ...(offer.trim ? [{ label: "Комплектация", value: offer.trim }] : []),
    ...(offer.mileageKm !== undefined
      ? [
          {
            label: "Пробег",
            value: `${new Intl.NumberFormat("ru-RU").format(offer.mileageKm)} км`,
          },
        ]
      : []),
    ...(offer.specifications ?? []),
  ];
  return (
    <>
      <section className="vehicle-detail">
        <div className="vehicle-gallery">
          <div className="vehicle-stage">
            {photos[index] ? (
              <img
                src={photos[index].src}
                alt={photos[index].alt}
                width={imageMetadata[photos[index].src]?.width ?? 1200}
                height={imageMetadata[photos[index].src]?.height ?? 900}
                srcSet={imageMetadata[photos[index].src]?.srcSet}
                sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1519px) 56vw, 800px"
                fetchPriority="high"
              />
            ) : (
              <p>Фотографии автомобиля готовятся</p>
            )}
          </div>
          {photos.length > 0 && (
            <p className="vehicle-photo-caption">
              <span>
                {index + 1} / {photos.length}
              </span>{" "}
              {photos[index]?.alt}
            </p>
          )}
          {photos.length > 1 && (
            <div className="vehicle-thumbs" aria-label="Фотографии автомобиля">
              {photos.map((p, i) => (
                <button
                  key={`${p.src}-${i}`}
                  type="button"
                  aria-label={`Фотография ${i + 1}: ${p.alt}`}
                  aria-pressed={index === i}
                  onClick={() => {
                    setIndex(i);
                    trackJourney("gallery_change", { offerId: offer.id });
                  }}
                >
                  <img
                    src={imageMetadata[p.src]?.thumbnail ?? p.src}
                    alt=""
                    width="120"
                    height="90"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
          {offer.photoNote && <p className="vehicle-meta">{offer.photoNote}</p>}
        </div>
        <div className="vehicle-summary">
          <span className="eyebrow">{offer.brand} · Автомобиль</span>
          <h1>{offer.title}</h1>
          <Availability offer={offer} />
          {offer.availabilityNote && <p className="vehicle-meta">{offer.availabilityNote}</p>}
          {offer.trim && <p className="lead">{offer.trim}</p>}
          {offer.highlights && (
            <ul className="vehicle-highlights">
              {offer.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <p className="vehicle-price">
            <VehiclePrice offer={offer} now={now} />
          </p>
          {offer.sourcePrice && (
            <p className="vehicle-meta">{offer.sourcePrice.note}</p>
          )}
          <p className="muted">
            {offer.vatConfirmed
              ? "Продажа с НДС подтверждена для этого предложения."
              : "Условия оплаты и НДС уточняются по предложению."}
          </p>
          {offer.seller && <p>Продавец: {offer.seller}</p>}
          {offer.validUntil &&
            Number.isFinite(Date.parse(offer.validUntil)) && (
              <p className="vehicle-meta">
                Срок актуальности цены:{" "}
                {new Date(offer.validUntil).toLocaleDateString("ru-RU", {
                  timeZone: "UTC",
                })}
              </p>
            )}
          <a href="#request" className="button">
            {offer.availability === "in_stock" ? "Хочу этот автомобиль" : "Узнать условия покупки"} <span aria-hidden="true">↗</span>
          </a>
          <a href="#specifications" className="text-link">
            Характеристики ↓
          </a>
        </div>
      </section>
      <section className="section specification-layout" id="specifications">
        <div>
          <span className="eyebrow">Детали выбора</span>
          <h2>Об автомобиле</h2>
          {offer.description && <p>{offer.description}</p>}
        </div>
        <dl className="specification-list">
          {specs.map((s, i) => (
            <div key={i}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      {!!offer.equipment?.length && (
        <section className="section specification-layout vehicle-equipment">
          <div>
            <span className="eyebrow">Комплектация в деталях</span>
            <h2>Оснащение</h2>
            <p>
              Оборудование по предложению. Наличие опций сверяется для
              выбранного автомобиля.
            </p>
          </div>
          <div>
            {offer.equipment.map((group) => (
              <details key={group.title}>
                <summary>
                  {group.title}
                  <span>{group.items.length} опций</span>
                </summary>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      )}
      <section className="section specification-layout">
        <div>
          <span className="eyebrow">Частые вопросы</span>
          <h2>Цена и документы</h2>
          <p>Состав предложения сверяется с договором перед оплатой.</p>
        </div>
        <div className="purchase-terms">
          {[
            ["В стоимость включено", offer.priceIncludes],
            ["Рассчитывается отдельно", offer.priceExcludes],
            ["Документы по автомобилю", offer.documents],
          ].map(([title, rows]) => (
            <div key={String(title)}>
              <h3>{String(title)}</h3>
              {Array.isArray(rows) && rows.length ? (
                <ul>
                  {rows.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">
                  Состав уточняется в индивидуальном предложении.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
export function PurchaseProcess() {
  return (
    <section
      className="section purchase-process compact-process"
      id="purchase-process"
    >
      <h2>Всё просто и прозрачно</h2>
      <ol className="purchase-chain">
        {[
          ["Выбираете авто", "Модель и комплектация", "Выбираете авто"],
          ["Заключаете договор", "Стоимость и условия", "Договор"],
          ["Получаете ключи", "Автомобиль и документы", "Ключи"],
          ["Обращаетесь к нам", "Сервис и поддержка", "Сервис"],
        ].map(([title, text, compact], i) => (
          <li key={title}>
            <span className="chain-number">0{i + 1}</span>
            <h3>
              <span className="chain-title-full">{title}</span>
              <span className="chain-title-compact" aria-hidden="true">
                {compact}
              </span>
            </h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function ProposalContents() {
  return (
    <section className="section specification-layout">
      <div>
        <span className="eyebrow">Для закупки</span>
        <h2>Что уточнить в коммерческом предложении</h2>
        <p>
          Один автомобиль или несколько: состав предложения должен отвечать
          задаче компании.
        </p>
        <a className="text-link" href="#request">
          Подготовить запрос КП ↗
        </a>
      </div>
      <dl className="specification-list">
        {[
          ["Автомобиль", "Модель, комплектация и количество"],
          ["Стоимость", "Итоговая сумма, НДС и дополнительные расходы"],
          ["Документы", "Продавец, договор и комплект для бухгалтерии"],
          ["Передача", "Место, порядок и согласованные сроки"],
        ].map(([a, b]) => (
          <div key={a}>
            <dt>{a}</dt>
            <dd>{b}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CompanyProof({
  company,
  kind,
  serviceSlug,
}: {
  company?: CompanyContent;
  kind?: string;
  serviceSlug?: string;
}) {
  const stories = (company?.stories ?? []).filter(
    (s) =>
      s.approved &&
      (!kind || s.kind === kind) &&
      (!serviceSlug || s.serviceSlug === serviceSlug),
  );
  if (!stories.length) return null;
  return (
    <section className="section company-proof">
      <div className="section-head">
        <div>
          <span className="eyebrow">CarPort China в деле</span>
          <h2>Автомобили и люди</h2>
        </div>
      </div>
      <div className="proof-grid">
        {stories.map((s) => (
          <article key={s.id}>
            {imageSource(s.image) && (
              <img
                src={s.image}
                alt={s.imageAlt}
                width="800"
                height="600"
                loading="lazy"
              />
            )}
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            {s.sourceUrl && imageSource(s.sourceUrl) && (
              <a className="text-link" href={s.sourceUrl}>
                Посмотреть источник ↗
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
